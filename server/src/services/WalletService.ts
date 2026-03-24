import { FindOptionsWhere } from 'typeorm';
import { AppDataSource } from '../config/db';
import { WalletPointType } from '../constants/walletPointTypes';
import { WalletTransactionStatus } from '../constants/walletTransactionStatuses';
import { UserRole } from '../constants/userRoles';
import { WalletTransactionType } from '../constants/walletTransactionTypes';
import { Shop } from '../models/Shop';
import { User } from '../models/User';
import { Wallet } from '../models/Wallet';
import { WalletTransaction } from '../models/WalletTransaction';
import { createQrValue, verifyQrValue } from '../utils/qr';
import { CategoryService } from './CategoryService';
import { SystemConfigService } from './SystemConfigService';

type CurrentUser = {
    id: string;
    role: UserRole;
};

type UpdateWalletInput = {
    customerId: string;
    shopId: string;
    points: number;
    purchaseAmount?: number;
    description?: string;
    pointType?: string;
    categoryId?: string;
};

export class WalletService {
    private userRepository = AppDataSource.getRepository(User);
    private shopRepository = AppDataSource.getRepository(Shop);
    private walletRepository = AppDataSource.getRepository(Wallet);
    private walletTransactionRepository = AppDataSource.getRepository(WalletTransaction);
    private categoryService = new CategoryService();
    private systemConfigService = new SystemConfigService();

    public async getWalletSummary(currentUser: CurrentUser, customerId?: string) {
        const targetUserId = this.resolveWalletOwnerId(currentUser, customerId);
        const customer = await this.getCustomer(targetUserId);
        const wallet = await this.getOrCreateWallet(customer.id);
        const recentTransactions = await this.walletTransactionRepository.find({
            where: { walletId: wallet.id },
            order: { createdAt: 'DESC' },
            take: 20,
        });

        const pointsBreakdown = await this.getPointsBreakdown(wallet.id);

        return {
            customer: {
                id: customer.id,
                firstName: customer.firstName,
                lastName: customer.lastName,
                email: customer.email,
                role: customer.role,
            },
            wallet: {
                id: wallet.id,
                customerId: wallet.customerId,
            },
            balance: wallet.balance,
            pointsBreakdown,
            recentTransactions,
        };
    }

    public async getCustomerQrCode(currentUser: CurrentUser) {
        if (currentUser.role !== UserRole.CUSTOMER) {
            throw new Error('Only customers can generate QR codes.');
        }

        const walletSummary = await this.getWalletSummary(currentUser);
        const qrPayload = createQrValue(walletSummary.customer.id, walletSummary.wallet.id);

        return {
            ...walletSummary,
            ...qrPayload,
        };
    }

    public async scanCustomerQr(currentUser: CurrentUser, qrValue: string) {
        if (![UserRole.MERCHANT, UserRole.ADMIN].includes(currentUser.role)) {
            throw new Error('You do not have permission to scan customer QR codes.');
        }

        const payload = verifyQrValue(qrValue);
        if (!payload) {
            throw new Error('Invalid or expired QR code.');
        }

        const wallet = await this.walletRepository.findOneBy({ id: payload.walletId, customerId: payload.customerId });
        if (!wallet) {
            throw new Error('Wallet not found for QR code.');
        }

        return this.getWalletSummary(currentUser, payload.customerId);
    }

    public async getTransactions(
        currentUser: CurrentUser,
        customerId?: string,
        shopId?: string,
        type?: string,
        status?: string,
    ) {
        if (currentUser.role === UserRole.CUSTOMER) {
            return this.applyTransactionFilters(
                await this.walletTransactionRepository.find({
                    where: { customerId: currentUser.id },
                    order: { createdAt: 'DESC' },
                }),
                type,
                status,
            );
        }

        if (currentUser.role === UserRole.MERCHANT) {
            const shops = await this.shopRepository.findBy({ merchantId: currentUser.id });
            const ownedShopIds = shops.map(shop => shop.id);

            if (!ownedShopIds.length) {
                return [];
            }

            const transactions = await this.walletTransactionRepository.find({
                order: { createdAt: 'DESC' },
            });

            return this.applyTransactionFilters(
                transactions.filter(transaction => !!transaction.shopId && ownedShopIds.includes(transaction.shopId)),
                type,
                status,
            );
        }

        const filters: FindOptionsWhere<WalletTransaction> = {};
        if (customerId?.trim()) {
            filters.customerId = customerId.trim();
        }
        if (shopId?.trim()) {
            filters.shopId = shopId.trim();
        }

        const transactions = await this.walletTransactionRepository.find({
            where: filters,
            order: { createdAt: 'DESC' },
        });

        return this.applyTransactionFilters(transactions, type, status);
    }

    public async earnPoints(currentUser: CurrentUser, input: UpdateWalletInput) {
        this.assertStaffCanUpdateWallet(currentUser.role);

        const points = this.normalizePoints(input.points);
        const customer = await this.getCustomer(input.customerId);
        const wallet = await this.getOrCreateWallet(customer.id);
        const shop = await this.getAccessibleShop(currentUser, input.shopId);
        const pointType = this.normalizePointType(input.pointType);
        const balanceBefore = wallet.balance;

        wallet.balance += points;
        await this.walletRepository.save(wallet);

        const transaction = this.walletTransactionRepository.create({
            walletId: wallet.id,
            customerId: customer.id,
            merchantId: shop.merchantId,
            performedByUserId: currentUser.id,
            shopId: shop.id,
            fromShopId: null,
            toShopId: shop.id,
            type: WalletTransactionType.EARN,
            pointType,
            status: WalletTransactionStatus.SUCCESS,
            points,
            purchaseAmount: null,
            discountAmount: null,
            payableAmount: null,
            earnedPoints: points,
            isFirstTransactionBonus: false,
            balanceBefore,
            balanceAfter: wallet.balance,
            description: input.description?.trim() || 'Points earned',
        });

        await this.walletTransactionRepository.save(transaction);

        return {
            balance: wallet.balance,
            transaction,
        };
    }

    public async spendPoints(currentUser: CurrentUser, input: UpdateWalletInput) {
        this.assertStaffCanUpdateWallet(currentUser.role);

        const requestedPoints = this.normalizePoints(input.points);
        const customer = await this.getCustomer(input.customerId);
        const wallet = await this.getOrCreateWallet(customer.id);
        const shop = await this.getAccessibleShop(currentUser, input.shopId);
        const availablePoints = await this.getSpendablePointsForShop(customer.id, shop.id);
        const pointType = this.normalizePointType(input.pointType);
        const purchaseAmount = input.purchaseAmount === undefined ? null : this.normalizeCurrencyAmount(input.purchaseAmount);

        this.assertRequestedPointsAreSpendable(requestedPoints, wallet.balance, availablePoints);

        const preview = await this.previewSettlement(currentUser, input);

        if (!purchaseAmount) {
            if (wallet.balance < requestedPoints || availablePoints < requestedPoints) {
                throw new Error('Insufficient spendable points for this shop.');
            }

            const balanceBefore = wallet.balance;
            wallet.balance -= requestedPoints;
            await this.walletRepository.save(wallet);

            const transaction = this.walletTransactionRepository.create({
                walletId: wallet.id,
                customerId: customer.id,
                merchantId: shop.merchantId,
                performedByUserId: currentUser.id,
                shopId: shop.id,
                fromShopId: shop.id,
                toShopId: null,
                type: WalletTransactionType.SPEND,
                pointType,
                status: WalletTransactionStatus.SUCCESS,
                points: requestedPoints,
                purchaseAmount: null,
                discountAmount: null,
                payableAmount: null,
                earnedPoints: null,
                isFirstTransactionBonus: false,
                balanceBefore,
                balanceAfter: wallet.balance,
                description: input.description?.trim() || 'Points spent',
            });

            await this.walletTransactionRepository.save(transaction);

            return {
                balance: wallet.balance,
                transaction,
            };
        }

        const maxDiscountPoints = preview.maxDiscountPoints;
        const pointsToUse = preview.usedPoints;

        if (pointsToUse <= 0) {
            throw new Error('Insufficient spendable points for this shop.');
        }

        const payableAmount = preview.payableAmount ?? 0;
        const earnedPoints = preview.earnedPoints ?? 0;
        const balanceBefore = wallet.balance;
        const balanceAfterSpend = balanceBefore - pointsToUse;
        const balanceAfterEarn = balanceAfterSpend + earnedPoints;

        wallet.balance = balanceAfterEarn;
        await this.walletRepository.save(wallet);

        const spendTransaction = this.walletTransactionRepository.create({
            walletId: wallet.id,
            customerId: customer.id,
            merchantId: shop.merchantId,
            performedByUserId: currentUser.id,
            shopId: shop.id,
            fromShopId: shop.id,
            toShopId: null,
            type: WalletTransactionType.SPEND,
            pointType,
            status: WalletTransactionStatus.SUCCESS,
            points: pointsToUse,
            purchaseAmount,
            discountAmount: pointsToUse,
            payableAmount,
            earnedPoints,
            isFirstTransactionBonus: false,
            balanceBefore,
            balanceAfter: balanceAfterSpend,
            description: input.description?.trim() || 'Points spent during purchase settlement',
        });

        const earnTransaction = this.walletTransactionRepository.create({
            walletId: wallet.id,
            customerId: customer.id,
            merchantId: shop.merchantId,
            performedByUserId: currentUser.id,
            shopId: shop.id,
            fromShopId: null,
            toShopId: shop.id,
            type: WalletTransactionType.EARN,
            pointType: WalletPointType.STANDARD,
            status: WalletTransactionStatus.SUCCESS,
            points: earnedPoints,
            purchaseAmount,
            discountAmount: pointsToUse,
            payableAmount,
            earnedPoints,
            isFirstTransactionBonus: false,
            balanceBefore: balanceAfterSpend,
            balanceAfter: balanceAfterEarn,
            description: `Points earned on payable amount of ${payableAmount}`,
        });

        const transactionsToSave = [spendTransaction, earnTransaction];

        await this.walletTransactionRepository.save(transactionsToSave);

        return {
            balance: wallet.balance,
            usedPoints: pointsToUse,
            maxDiscountPoints,
            payableAmount,
            earnedPoints,
            bonusPoints: 0,
            transactions: transactionsToSave,
        };
    }

    public async previewSettlement(currentUser: CurrentUser, input: UpdateWalletInput) {
        this.assertStaffCanUpdateWallet(currentUser.role);

        const requestedPoints = this.normalizePoints(input.points);
        const customer = await this.getCustomer(input.customerId);
        const wallet = await this.getOrCreateWallet(customer.id);
        const shop = await this.getAccessibleShop(currentUser, input.shopId);
        const availablePoints = await this.getSpendablePointsForShop(customer.id, shop.id);
        const purchaseAmount = input.purchaseAmount === undefined ? null : this.normalizeCurrencyAmount(input.purchaseAmount);
        const currentConfig = await this.systemConfigService.getCurrentConfig();
        const applicableCategory = await this.categoryService.getCategoryForShop(shop.id, input.categoryId);

        this.assertRequestedPointsAreSpendable(requestedPoints, wallet.balance, availablePoints);

        if (!purchaseAmount) {
            return {
                customerId: customer.id,
                shopId: shop.id,
                categoryId: applicableCategory?.id || null,
                categoryName: applicableCategory?.formattedName || null,
                availablePoints,
                requestedPoints,
                usedPoints: requestedPoints,
                maxDiscountPoints: requestedPoints,
                maxDiscountPercent: applicableCategory?.discountPercent ?? currentConfig.defaultMaxDiscountPercent,
                payableAmount: null,
                earnedPoints: null,
                bonusPoints: 0,
                predictedBalance: wallet.balance - requestedPoints,
            };
        }

        const configuredMaxDiscountPercent = applicableCategory?.discountPercent ?? currentConfig.defaultMaxDiscountPercent;
        const maxDiscountPoints = Math.floor((purchaseAmount * configuredMaxDiscountPercent) / 100);
        const spendableBalance = Math.min(wallet.balance, availablePoints);
        const usedPoints = Math.min(requestedPoints, maxDiscountPoints, spendableBalance);
        const payableAmount = purchaseAmount - usedPoints;
        const earnedPoints = payableAmount;
        return {
            customerId: customer.id,
            shopId: shop.id,
            categoryId: applicableCategory?.id || null,
            categoryName: applicableCategory?.formattedName || null,
            availablePoints,
            requestedPoints,
            usedPoints,
            maxDiscountPoints,
            maxDiscountPercent: configuredMaxDiscountPercent,
            payableAmount,
            earnedPoints,
            bonusPoints: 0,
            predictedBalance: wallet.balance - usedPoints + earnedPoints,
        };
    }

    public async getReport(currentUser: CurrentUser) {
        if (![UserRole.REPRESENTATIVE, UserRole.ADMIN].includes(currentUser.role)) {
            throw new Error('You do not have permission to view reports.');
        }

        const [customers, shops, wallets, transactions] = await Promise.all([
            this.userRepository.findBy({ role: UserRole.CUSTOMER }),
            this.shopRepository.find(),
            this.walletRepository.find(),
            this.walletTransactionRepository.find(),
        ]);

        const scopedShops = currentUser.role === UserRole.REPRESENTATIVE
            ? shops.filter(shop => shop.representativeId === currentUser.id)
            : shops;
        const scopedShopIds = new Set(scopedShops.map(shop => shop.id));
        const scopedTransactions = currentUser.role === UserRole.REPRESENTATIVE
            ? transactions.filter(transaction => !!transaction.shopId && scopedShopIds.has(transaction.shopId))
            : transactions;
        const now = new Date();
        const currentMonthTransactions = scopedTransactions.filter(transaction => {
            const createdAt = new Date(transaction.createdAt);
            return createdAt.getUTCFullYear() === now.getUTCFullYear() && createdAt.getUTCMonth() === now.getUTCMonth();
        });

        const totalPointsIssued = scopedTransactions
            .filter(transaction => transaction.type === WalletTransactionType.EARN)
            .reduce((sum, transaction) => sum + transaction.points, 0);

        const totalPointsSpent = scopedTransactions
            .filter(transaction => transaction.type === WalletTransactionType.SPEND)
            .reduce((sum, transaction) => sum + transaction.points, 0);

        const activeBalance = wallets.reduce((sum, wallet) => sum + wallet.balance, 0);
        const monthlyPointsIssued = currentMonthTransactions
            .filter(transaction => transaction.type === WalletTransactionType.EARN)
            .reduce((sum, transaction) => sum + transaction.points, 0);
        const monthlyPointsSpent = currentMonthTransactions
            .filter(transaction => transaction.type === WalletTransactionType.SPEND)
            .reduce((sum, transaction) => sum + transaction.points, 0);
        const topShops = scopedShops
            .map(shop => ({
                id: shop.id,
                name: shop.name,
                location: shop.location,
                transactionCount: scopedTransactions.filter(transaction => transaction.shopId === shop.id).length,
                pointsIssued: scopedTransactions
                    .filter(transaction => transaction.shopId === shop.id && transaction.type === WalletTransactionType.EARN)
                    .reduce((sum, transaction) => sum + transaction.points, 0),
                pointsSpent: scopedTransactions
                    .filter(transaction => transaction.shopId === shop.id && transaction.type === WalletTransactionType.SPEND)
                    .reduce((sum, transaction) => sum + transaction.points, 0),
            }))
            .sort((left, right) => right.transactionCount - left.transactionCount)
            .slice(0, 5);

        return {
            totalCustomers: customers.length,
            totalShops: scopedShops.length,
            totalPointsIssued,
            totalPointsSpent,
            activeBalance,
            monthlyPointsIssued,
            monthlyPointsSpent,
            topShops,
        };
    }

    private resolveWalletOwnerId(currentUser: CurrentUser, customerId?: string): string {
        if (currentUser.role === UserRole.CUSTOMER) {
            return currentUser.id;
        }

        if (!customerId?.trim()) {
            throw new Error('Customer is required.');
        }

        return customerId.trim();
    }

    private async getCustomer(customerId: string): Promise<User> {
        const customer = await this.userRepository.findOneBy({ id: customerId.trim() });
        if (!customer || customer.role !== UserRole.CUSTOMER) {
            throw new Error('Customer not found.');
        }

        return customer;
    }

    private async getOrCreateWallet(customerId: string): Promise<Wallet> {
        const existingWallet = await this.walletRepository.findOneBy({ customerId });
        if (existingWallet) {
            return existingWallet;
        }

        const wallet = this.walletRepository.create({
            customerId,
            balance: 0,
        });

        return this.walletRepository.save(wallet);
    }

    private async getAccessibleShop(currentUser: CurrentUser, shopId: string): Promise<Shop> {
        const shop = await this.shopRepository.findOneBy({ id: shopId.trim() });
        if (!shop || !shop.isActive) {
            throw new Error('Shop not found.');
        }

        if (currentUser.role === UserRole.MERCHANT && shop.merchantId !== currentUser.id) {
            throw new Error('You do not have permission to use this shop.');
        }

        return shop;
    }

    private async getSpendablePointsForShop(customerId: string, shopId: string): Promise<number> {
        const transactions = await this.walletTransactionRepository.find({
            where: { customerId },
            order: { createdAt: 'ASC' },
        });

        const earnedFromCurrentShop = transactions
            .filter(
                transaction =>
                    transaction.status === WalletTransactionStatus.SUCCESS &&
                    transaction.type === WalletTransactionType.EARN &&
                    transaction.shopId === shopId,
            )
            .reduce((sum, transaction) => sum + transaction.points, 0);

        const spentFromCurrentShop = transactions
            .filter(
                transaction =>
                    transaction.status === WalletTransactionStatus.SUCCESS &&
                    transaction.type === WalletTransactionType.SPEND &&
                    transaction.shopId === shopId,
            )
            .reduce((sum, transaction) => sum + transaction.points, 0);

        return Math.max(earnedFromCurrentShop - spentFromCurrentShop, 0);
    }

    private assertStaffCanUpdateWallet(role: UserRole): void {
        if (![UserRole.MERCHANT, UserRole.ADMIN].includes(role)) {
            throw new Error('You do not have permission to update wallet points.');
        }
    }

    private normalizePoints(points: number): number {
        if (!Number.isInteger(points) || points <= 0) {
            throw new Error('Points must be a positive integer.');
        }

        return points;
    }

    private normalizeCurrencyAmount(amount: number): number {
        if (!Number.isInteger(amount) || amount <= 0) {
            throw new Error('Purchase amount must be a positive integer.');
        }

        return amount;
    }

    private assertRequestedPointsAreSpendable(requestedPoints: number, walletBalance: number, availablePoints: number) {
        if (availablePoints <= 0) {
            throw new Error('Points cannot be redeemed for this shop.');
        }

        if (requestedPoints > availablePoints) {
            throw new Error('Requested points exceed the points available for this shop.');
        }

        if (requestedPoints > walletBalance) {
            throw new Error('Requested points exceed the customer wallet balance.');
        }
    }

    private normalizePointType(pointType?: string): WalletPointType {
        if (!pointType?.trim()) {
            return WalletPointType.STANDARD;
        }

        const normalizedPointType = pointType.trim().toUpperCase();
        if (normalizedPointType === WalletPointType.STANDARD || normalizedPointType === WalletPointType.BONUS) {
            return normalizedPointType;
        }

        throw new Error('Invalid point type.');
    }

    private applyTransactionFilters(
        transactions: WalletTransaction[],
        type?: string,
        status?: string,
    ): WalletTransaction[] {
        return transactions.filter(transaction => {
            const matchesType = type?.trim() ? transaction.type === type.trim().toUpperCase() : true;
            const matchesStatus = status?.trim() ? transaction.status === status.trim().toUpperCase() : true;
            return matchesType && matchesStatus;
        });
    }

    private async getPointsBreakdown(walletId: string) {
        const transactions = await this.walletTransactionRepository.find({
            where: { walletId, status: WalletTransactionStatus.SUCCESS },
        });

        const totalsByPointType = new Map<WalletPointType, number>();

        for (const transaction of transactions) {
            const currentTotal = totalsByPointType.get(transaction.pointType) || 0;
            const delta = transaction.type === WalletTransactionType.SPEND ? -transaction.points : transaction.points;
            totalsByPointType.set(transaction.pointType, currentTotal + delta);
        }

        return Array.from(totalsByPointType.entries()).map(([pointType, balance]) => ({
            pointType,
            balance: Math.max(balance, 0),
        }));
    }
}
