import 'reflect-metadata';
import dotenv from 'dotenv';
import { AppDataSource } from '../config/db';
import { Event } from '../models/Event';
import { Promotion } from '../models/Promotion';
import { Shop } from '../models/Shop';
import { User } from '../models/User';
import { Wallet } from '../models/Wallet';
import { WalletTransaction } from '../models/WalletTransaction';
import { hashPassword } from '../utils/password';
import {
    getSeedEvents,
    getSeedLoginReference,
    getSeedPromotions,
    getSeedShops,
    getSeedUsers,
    getSeedWalletTransactions,
} from '../seed/demoSeedData';

dotenv.config();

async function seedDemoData(): Promise<void> {
    if (process.env.ALLOW_ROLE_USER_SEED !== 'true') {
        throw new Error('Set ALLOW_ROLE_USER_SEED=true to run this script.');
    }

    await AppDataSource.initialize();

    try {
        const userRepository = AppDataSource.getRepository(User);
        const walletRepository = AppDataSource.getRepository(Wallet);
        const shopRepository = AppDataSource.getRepository(Shop);
        const promotionRepository = AppDataSource.getRepository(Promotion);
        const eventRepository = AppDataSource.getRepository(Event);
        const walletTransactionRepository = AppDataSource.getRepository(WalletTransaction);

        const usersByEmail = new Map<string, User>();

        for (const seedUser of getSeedUsers()) {
            const email = seedUser.email.toLowerCase();
            const existingUser = await userRepository.findOneBy({ email });

            if (existingUser) {
                existingUser.firstName = seedUser.firstName;
                existingUser.lastName = seedUser.lastName;
                existingUser.username = seedUser.username;
                existingUser.password = hashPassword(seedUser.password);
                existingUser.role = seedUser.role;
                existingUser.emailVerified = true;
                existingUser.verificationCode = null;
                existingUser.verificationCodeExpiresAt = null;
                usersByEmail.set(email, await userRepository.save(existingUser));
                console.log(`Updated seeded user: ${email}`);
                continue;
            }

            const createdUser = userRepository.create({
                firstName: seedUser.firstName,
                lastName: seedUser.lastName,
                username: seedUser.username,
                email,
                password: hashPassword(seedUser.password),
                role: seedUser.role,
                emailVerified: true,
                verificationCode: null,
                verificationCodeExpiresAt: null,
            });
            usersByEmail.set(email, await userRepository.save(createdUser));
            console.log(`Created seeded user: ${email}`);
        }

        const walletsByCustomerId = new Map<string, Wallet>();

        for (const seedUser of getSeedUsers().filter((user) => user.role === 'CUSTOMER')) {
            const customer = usersByEmail.get(seedUser.email.toLowerCase());
            if (!customer) {
                throw new Error(`Missing seeded customer ${seedUser.email}.`);
            }

            const existingWallet = await walletRepository.findOneBy({ customerId: customer.id });
            if (existingWallet) {
                existingWallet.balance = 0;
                walletsByCustomerId.set(customer.id, await walletRepository.save(existingWallet));
                console.log(`Reset wallet for customer: ${seedUser.email}`);
                continue;
            }

            const createdWallet = walletRepository.create({
                customerId: customer.id,
                balance: 0,
            });
            walletsByCustomerId.set(customer.id, await walletRepository.save(createdWallet));
            console.log(`Created wallet for customer: ${seedUser.email}`);
        }

        const shopsByName = new Map<string, Shop>();

        for (const seedShop of getSeedShops()) {
            const merchant = usersByEmail.get(seedShop.merchantEmail.toLowerCase());
            const representative = usersByEmail.get(seedShop.representativeEmail.toLowerCase());

            if (!merchant) {
                throw new Error(`Missing merchant for shop ${seedShop.name}.`);
            }

            if (!representative) {
                throw new Error(`Missing representative for shop ${seedShop.name}.`);
            }

            const existingShop = await shopRepository.findOneBy({ name: seedShop.name });
            if (existingShop) {
                existingShop.location = seedShop.location;
                existingShop.description = seedShop.description;
                existingShop.merchantId = merchant.id;
                existingShop.representativeId = representative.id;
                existingShop.isActive = seedShop.isActive ?? true;
                shopsByName.set(seedShop.name, await shopRepository.save(existingShop));
                console.log(`Updated seeded shop: ${seedShop.name}`);
                continue;
            }

            const createdShop = shopRepository.create({
                name: seedShop.name,
                location: seedShop.location,
                description: seedShop.description,
                merchantId: merchant.id,
                representativeId: representative.id,
                isActive: seedShop.isActive ?? true,
            });
            shopsByName.set(seedShop.name, await shopRepository.save(createdShop));
            console.log(`Created seeded shop: ${seedShop.name}`);
        }

        for (const seedPromotion of getSeedPromotions()) {
            const shop = shopsByName.get(seedPromotion.shopName);
            const merchant = usersByEmail.get(seedPromotion.merchantEmail.toLowerCase());

            if (!shop || !merchant) {
                throw new Error(`Missing shop or merchant for promotion ${seedPromotion.title}.`);
            }

            const existingPromotion = await promotionRepository.findOneBy({
                title: seedPromotion.title,
                shopId: shop.id,
            });

            if (existingPromotion) {
                existingPromotion.description = seedPromotion.description;
                existingPromotion.merchantId = merchant.id;
                existingPromotion.bonusPoints = seedPromotion.bonusPoints;
                existingPromotion.maxDiscountPercent = seedPromotion.maxDiscountPercent;
                existingPromotion.startsAt = new Date(seedPromotion.startsAt);
                existingPromotion.endsAt = new Date(seedPromotion.endsAt);
                existingPromotion.isActive = seedPromotion.isActive ?? true;
                await promotionRepository.save(existingPromotion);
                console.log(`Updated seeded promotion: ${seedPromotion.title}`);
                continue;
            }

            await promotionRepository.save(
                promotionRepository.create({
                    title: seedPromotion.title,
                    description: seedPromotion.description,
                    shopId: shop.id,
                    merchantId: merchant.id,
                    bonusPoints: seedPromotion.bonusPoints,
                    maxDiscountPercent: seedPromotion.maxDiscountPercent,
                    startsAt: new Date(seedPromotion.startsAt),
                    endsAt: new Date(seedPromotion.endsAt),
                    isActive: seedPromotion.isActive ?? true,
                }),
            );
            console.log(`Created seeded promotion: ${seedPromotion.title}`);
        }

        for (const seedEvent of getSeedEvents()) {
            const creator = usersByEmail.get(seedEvent.createdByEmail.toLowerCase());
            if (!creator) {
                throw new Error(`Missing creator for event ${seedEvent.title}.`);
            }

            const existingEvent = await eventRepository.findOneBy({
                title: seedEvent.title,
                location: seedEvent.location,
            });

            if (existingEvent) {
                existingEvent.description = seedEvent.description;
                existingEvent.createdByUserId = creator.id;
                existingEvent.startsAt = new Date(seedEvent.startsAt);
                existingEvent.endsAt = new Date(seedEvent.endsAt);
                existingEvent.isActive = seedEvent.isActive ?? true;
                await eventRepository.save(existingEvent);
                console.log(`Updated seeded event: ${seedEvent.title}`);
                continue;
            }

            await eventRepository.save(
                eventRepository.create({
                    title: seedEvent.title,
                    description: seedEvent.description,
                    location: seedEvent.location,
                    createdByUserId: creator.id,
                    startsAt: new Date(seedEvent.startsAt),
                    endsAt: new Date(seedEvent.endsAt),
                    isActive: seedEvent.isActive ?? true,
                }),
            );
            console.log(`Created seeded event: ${seedEvent.title}`);
        }

        const walletBalances = new Map<string, number>();

        for (const transactionSeed of getSeedWalletTransactions()) {
            const customer = usersByEmail.get(transactionSeed.customerEmail.toLowerCase());
            const merchant = usersByEmail.get(transactionSeed.merchantEmail.toLowerCase());
            const performedBy = usersByEmail.get(transactionSeed.performedByEmail.toLowerCase());
            const shop = shopsByName.get(transactionSeed.shopName);
            const fromShop = transactionSeed.fromShopName ? shopsByName.get(transactionSeed.fromShopName) : null;
            const toShop = transactionSeed.toShopName ? shopsByName.get(transactionSeed.toShopName) : null;

            if (!customer || !merchant || !performedBy || !shop) {
                throw new Error(`Missing related records for transaction "${transactionSeed.description}".`);
            }

            const wallet = walletsByCustomerId.get(customer.id);
            if (!wallet) {
                throw new Error(`Missing wallet for customer ${transactionSeed.customerEmail}.`);
            }

            const existingTransaction = await walletTransactionRepository.findOneBy({
                description: transactionSeed.description,
            });

            const balanceBefore = walletBalances.get(customer.id) ?? 0;
            const balanceAfter = balanceBefore + transactionSeed.points;
            walletBalances.set(customer.id, balanceAfter);

            if (existingTransaction) {
                existingTransaction.walletId = wallet.id;
                existingTransaction.customerId = customer.id;
                existingTransaction.merchantId = merchant.id;
                existingTransaction.performedByUserId = performedBy.id;
                existingTransaction.shopId = shop.id;
                existingTransaction.fromShopId = fromShop?.id ?? null;
                existingTransaction.toShopId = toShop?.id ?? null;
                existingTransaction.type = transactionSeed.type;
                existingTransaction.pointType = transactionSeed.pointType;
                existingTransaction.status = transactionSeed.status;
                existingTransaction.points = transactionSeed.points;
                existingTransaction.purchaseAmount = transactionSeed.purchaseAmount ?? null;
                existingTransaction.discountAmount = transactionSeed.discountAmount ?? null;
                existingTransaction.payableAmount = transactionSeed.payableAmount ?? null;
                existingTransaction.earnedPoints = transactionSeed.earnedPoints ?? null;
                existingTransaction.isFirstTransactionBonus = transactionSeed.isFirstTransactionBonus ?? false;
                existingTransaction.balanceBefore = balanceBefore;
                existingTransaction.balanceAfter = balanceAfter;
                existingTransaction.createdAt = new Date(transactionSeed.createdAt);
                await walletTransactionRepository.save(existingTransaction);
                console.log(`Updated seeded transaction: ${transactionSeed.description}`);
                continue;
            }

            await walletTransactionRepository.save(
                walletTransactionRepository.create({
                    walletId: wallet.id,
                    customerId: customer.id,
                    merchantId: merchant.id,
                    performedByUserId: performedBy.id,
                    shopId: shop.id,
                    fromShopId: fromShop?.id ?? null,
                    toShopId: toShop?.id ?? null,
                    type: transactionSeed.type,
                    pointType: transactionSeed.pointType,
                    status: transactionSeed.status,
                    points: transactionSeed.points,
                    purchaseAmount: transactionSeed.purchaseAmount ?? null,
                    discountAmount: transactionSeed.discountAmount ?? null,
                    payableAmount: transactionSeed.payableAmount ?? null,
                    earnedPoints: transactionSeed.earnedPoints ?? null,
                    isFirstTransactionBonus: transactionSeed.isFirstTransactionBonus ?? false,
                    balanceBefore,
                    balanceAfter,
                    description: transactionSeed.description,
                    createdAt: new Date(transactionSeed.createdAt),
                }),
            );
            console.log(`Created seeded transaction: ${transactionSeed.description}`);
        }

        for (const [customerId, wallet] of walletsByCustomerId.entries()) {
            wallet.balance = walletBalances.get(customerId) ?? 0;
            await walletRepository.save(wallet);
        }

        console.table(getSeedLoginReference());
    } finally {
        await AppDataSource.destroy();
    }
}

seedDemoData()
    .then(() => {
        console.log('Demo seed completed successfully.');
    })
    .catch((error) => {
        console.error('Demo seed failed:', error);
        process.exitCode = 1;
    });
