import { AppDataSource } from '../config/db';
import { WalletPointType } from '../constants/walletPointTypes';
import { WalletTransactionStatus } from '../constants/walletTransactionStatuses';
import { WalletTransactionType } from '../constants/walletTransactionTypes';
import { UserRole } from '../constants/userRoles';
import { Promotion } from '../models/Promotion';
import { PromotionClaim } from '../models/PromotionClaim';
import { Shop } from '../models/Shop';
import { Wallet } from '../models/Wallet';
import { WalletTransaction } from '../models/WalletTransaction';

type CurrentUser = {
    id: string;
    role: UserRole;
};

type PromotionInput = {
    title?: string;
    description?: string;
    shopId?: string;
    bonusPoints?: number;
    maxDiscountPercent?: number;
    startsAt?: string;
    endsAt?: string;
    isActive?: boolean;
};

export class PromotionService {
    private promotionRepository = AppDataSource.getRepository(Promotion);
    private promotionClaimRepository = AppDataSource.getRepository(PromotionClaim);
    private shopRepository = AppDataSource.getRepository(Shop);
    private walletRepository = AppDataSource.getRepository(Wallet);
    private walletTransactionRepository = AppDataSource.getRepository(WalletTransaction);

    public async listPromotions(currentUser: CurrentUser) {
        const promotions = await this.promotionRepository.find({
            order: { startsAt: 'ASC', createdAt: 'DESC' },
        });
        const shops = await this.shopRepository.find();
        const shopMap = new Map(shops.map(shop => [shop.id, shop]));
        const now = new Date();

        const customerClaims = currentUser.role === UserRole.CUSTOMER
            ? await this.promotionClaimRepository.findBy({ customerId: currentUser.id })
            : [];
        const claimedPromotionIds = new Set(customerClaims.map(claim => claim.promotionId));

        return promotions
            .filter(promotion => {
                if (currentUser.role === UserRole.CUSTOMER) {
                    return promotion.isActive && promotion.startsAt <= now && promotion.endsAt >= now;
                }

                if (currentUser.role === UserRole.MERCHANT) {
                    return promotion.merchantId === currentUser.id;
                }

                return true;
            })
            .map(promotion => ({
                ...promotion,
                shopName: shopMap.get(promotion.shopId)?.name || 'Unknown shop',
                shopLocation: shopMap.get(promotion.shopId)?.location || '',
                isClaimed: claimedPromotionIds.has(promotion.id),
            }));
    }

    public async createPromotion(currentUser: CurrentUser, input: PromotionInput) {
        this.assertCanManagePromotions(currentUser.role);

        const title = input.title?.trim();
        const shopId = input.shopId?.trim();
        const startsAt = this.parseDate(input.startsAt, 'Promotion start date is required.');
        const endsAt = this.parseDate(input.endsAt, 'Promotion end date is required.');

        if (!title) {
            throw new Error('Promotion title is required.');
        }

        if (!shopId) {
            throw new Error('Shop is required.');
        }

        if (endsAt < startsAt) {
            throw new Error('Promotion end date must be after the start date.');
        }

        const shop = await this.getManageableShop(currentUser, shopId);
        const promotion = this.promotionRepository.create({
            title,
            description: input.description?.trim() || null,
            shopId: shop.id,
            merchantId: shop.merchantId,
            bonusPoints: this.normalizeNonNegativeInteger(input.bonusPoints, 0),
            maxDiscountPercent: this.normalizePercentage(input.maxDiscountPercent, 30),
            startsAt,
            endsAt,
            isActive: input.isActive ?? true,
        });

        return this.promotionRepository.save(promotion);
    }

    public async updatePromotion(currentUser: CurrentUser, promotionId: string, input: PromotionInput) {
        this.assertCanManagePromotions(currentUser.role);

        const promotion = await this.promotionRepository.findOneBy({ id: promotionId.trim() });
        if (!promotion) {
            throw new Error('Promotion not found.');
        }

        const shop = await this.getManageableShop(currentUser, promotion.shopId);
        const nextTitle = input.title?.trim();
        const requestedShopId = input.shopId?.trim();

        if (nextTitle !== undefined) {
            if (!nextTitle) {
                throw new Error('Promotion title is required.');
            }
            promotion.title = nextTitle;
        }

        if (input.description !== undefined) {
            promotion.description = input.description?.trim() || null;
        }

        if (requestedShopId && requestedShopId !== promotion.shopId) {
            const nextShop = await this.getManageableShop(currentUser, requestedShopId);
            promotion.shopId = nextShop.id;
            promotion.merchantId = nextShop.merchantId;
        } else {
            promotion.merchantId = shop.merchantId;
        }

        if (input.startsAt !== undefined) {
            promotion.startsAt = this.parseDate(input.startsAt, 'Promotion start date is required.');
        }

        if (input.endsAt !== undefined) {
            promotion.endsAt = this.parseDate(input.endsAt, 'Promotion end date is required.');
        }

        if (promotion.endsAt < promotion.startsAt) {
            throw new Error('Promotion end date must be after the start date.');
        }

        if (input.bonusPoints !== undefined) {
            promotion.bonusPoints = this.normalizeNonNegativeInteger(input.bonusPoints, promotion.bonusPoints);
        }

        if (input.maxDiscountPercent !== undefined) {
            promotion.maxDiscountPercent = this.normalizePercentage(input.maxDiscountPercent, promotion.maxDiscountPercent);
        }

        if (typeof input.isActive === 'boolean') {
            promotion.isActive = input.isActive;
        }

        return this.promotionRepository.save(promotion);
    }

    public async deletePromotion(currentUser: CurrentUser, promotionId: string) {
        this.assertCanManagePromotions(currentUser.role);

        const promotion = await this.promotionRepository.findOneBy({ id: promotionId.trim() });
        if (!promotion) {
            throw new Error('Promotion not found.');
        }

        await this.getManageableShop(currentUser, promotion.shopId);
        await this.promotionRepository.remove(promotion);

        return { id: promotion.id };
    }

    public async claimPromotion(currentUser: CurrentUser, promotionId: string) {
        if (currentUser.role !== UserRole.CUSTOMER) {
            throw new Error('Only customers can claim promotions.');
        }

        const promotion = await this.promotionRepository.findOneBy({ id: promotionId.trim() });
        if (!promotion) {
            throw new Error('Promotion not found.');
        }

        const shop = await this.shopRepository.findOneBy({ id: promotion.shopId });
        if (!shop || !shop.isActive) {
            throw new Error('Promotion shop is not available.');
        }

        const now = new Date();
        if (!promotion.isActive || promotion.startsAt > now || promotion.endsAt < now) {
            throw new Error('This promotion is not active right now.');
        }

        const existingClaim = await this.promotionClaimRepository.findOneBy({
            promotionId: promotion.id,
            customerId: currentUser.id,
        });
        if (existingClaim) {
            throw new Error('You have already claimed this promotion.');
        }

        const wallet = await this.getOrCreateWallet(currentUser.id);
        const balanceBefore = wallet.balance;
        wallet.balance += promotion.bonusPoints;

        return AppDataSource.transaction(async manager => {
            await manager.save(Wallet, wallet);

            const claimTransaction = manager.create(WalletTransaction, {
                walletId: wallet.id,
                customerId: currentUser.id,
                merchantId: promotion.merchantId,
                performedByUserId: currentUser.id,
                shopId: promotion.shopId,
                fromShopId: null,
                toShopId: promotion.shopId,
                type: WalletTransactionType.EARN,
                pointType: WalletPointType.BONUS,
                status: WalletTransactionStatus.SUCCESS,
                points: promotion.bonusPoints,
                purchaseAmount: null,
                discountAmount: null,
                payableAmount: null,
                earnedPoints: promotion.bonusPoints,
                isFirstTransactionBonus: false,
                balanceBefore,
                balanceAfter: wallet.balance,
                description: `Promotion claimed: ${promotion.title}`,
            });

            const savedTransaction = await manager.save(WalletTransaction, claimTransaction);
            await manager.save(
                PromotionClaim,
                manager.create(PromotionClaim, {
                    promotionId: promotion.id,
                    customerId: currentUser.id,
                    walletTransactionId: savedTransaction.id,
                }),
            );

            return {
                promotionId: promotion.id,
                bonusPoints: promotion.bonusPoints,
                balance: wallet.balance,
                transactionId: savedTransaction.id,
            };
        });
    }

    private async getManageableShop(currentUser: CurrentUser, shopId: string) {
        const shop = await this.shopRepository.findOneBy({ id: shopId });
        if (!shop) {
            throw new Error('Shop not found.');
        }

        if (currentUser.role === UserRole.MERCHANT && shop.merchantId !== currentUser.id) {
            throw new Error('You do not have permission to manage promotions for this shop.');
        }

        if (currentUser.role === UserRole.REPRESENTATIVE && shop.representativeId !== currentUser.id) {
            throw new Error('You do not have permission to manage promotions for this shop.');
        }

        return shop;
    }

    private assertCanManagePromotions(role: UserRole) {
        if (![UserRole.MERCHANT, UserRole.REPRESENTATIVE, UserRole.ADMIN].includes(role)) {
            throw new Error('You do not have permission to manage promotions.');
        }
    }

    private parseDate(value: string | undefined, errorMessage: string): Date {
        const parsed = value ? new Date(value) : null;
        if (!parsed || Number.isNaN(parsed.getTime())) {
            throw new Error(errorMessage);
        }

        return parsed;
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

    private normalizeNonNegativeInteger(value: number | undefined, fallback: number) {
        if (value === undefined || value === null || value === Number.NaN) {
            return fallback;
        }

        if (!Number.isInteger(value) || value < 0) {
            throw new Error('Bonus points must be a non-negative integer.');
        }

        return value;
    }

    private normalizePercentage(value: number | undefined, fallback: number) {
        if (value === undefined || value === null || value === Number.NaN) {
            return fallback;
        }

        if (!Number.isInteger(value) || value < 0 || value > 100) {
            throw new Error('Max discount percent must be between 0 and 100.');
        }

        return value;
    }
}
