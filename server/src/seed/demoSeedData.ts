import { UserRole } from '../constants/userRoles';
import { WalletPointType } from '../constants/walletPointTypes';
import { WalletTransactionStatus } from '../constants/walletTransactionStatuses';
import { WalletTransactionType } from '../constants/walletTransactionTypes';

export type SeedUserDefinition = {
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    password: string;
    role: UserRole;
};

type SeedShopDefinition = {
    name: string;
    location: string;
    description: string;
    merchantEmail: string;
    representativeEmail: string;
    isActive?: boolean;
};

type SeedPromotionDefinition = {
    title: string;
    description: string;
    shopName: string;
    merchantEmail: string;
    bonusPoints: number;
    maxDiscountPercent: number;
    startsAt: string;
    endsAt: string;
    isActive?: boolean;
};

type SeedEventDefinition = {
    title: string;
    description: string;
    location: string;
    createdByEmail: string;
    startsAt: string;
    endsAt: string;
    isActive?: boolean;
};

type SeedWalletTransactionDefinition = {
    description: string;
    customerEmail: string;
    merchantEmail: string;
    performedByEmail: string;
    shopName: string;
    fromShopName?: string | null;
    toShopName?: string | null;
    type: WalletTransactionType;
    pointType: WalletPointType;
    status: WalletTransactionStatus;
    points: number;
    purchaseAmount?: number | null;
    discountAmount?: number | null;
    payableAmount?: number | null;
    earnedPoints?: number | null;
    isFirstTransactionBonus?: boolean;
    createdAt: string;
};

type SeedLoginReference = {
    role: UserRole;
    displayName: string;
    identifier: string;
    email: string;
    password: string;
};

function getRequiredSeedPassword(envKey: string, fallback: string): string {
    const configuredPassword = process.env[envKey]?.trim();

    if (configuredPassword) {
        return configuredPassword;
    }

    if (process.env.NODE_ENV === 'production') {
        throw new Error(`${envKey} is required in production.`);
    }

    return fallback;
}

function getSeedEmail(envKey: string, fallback: string): string {
    return process.env[envKey]?.trim().toLowerCase() || fallback;
}

export function getSeedUsers(): SeedUserDefinition[] {
    return [
        {
            firstName: 'System',
            lastName: 'Admin',
            username: 'admin',
            email: getSeedEmail('SEED_ADMIN_EMAIL', 'admin@sottocasa.it'),
            password: getRequiredSeedPassword('SEED_ADMIN_PASSWORD', 'Admin123!'),
            role: UserRole.ADMIN,
        },
        {
            firstName: 'Rita',
            lastName: 'Representative',
            username: 'representative',
            email: getSeedEmail('SEED_REPRESENTATIVE_EMAIL', 'representative@sottocasa.it'),
            password: getRequiredSeedPassword('SEED_REPRESENTATIVE_PASSWORD', 'Representative123!'),
            role: UserRole.REPRESENTATIVE,
        },
        {
            firstName: 'Marco',
            lastName: 'Merchant',
            username: 'merchant',
            email: getSeedEmail('SEED_MERCHANT_EMAIL', 'merchant@sottocasa.it'),
            password: getRequiredSeedPassword('SEED_MERCHANT_PASSWORD', 'Merchant123!'),
            role: UserRole.MERCHANT,
        },
        {
            firstName: 'Luca',
            lastName: 'Customer',
            username: 'customer',
            email: getSeedEmail('SEED_CUSTOMER_EMAIL', 'customer@sottocasa.it'),
            password: getRequiredSeedPassword('SEED_CUSTOMER_PASSWORD', 'Customer123!'),
            role: UserRole.CUSTOMER,
        },
        {
            firstName: 'Anna',
            lastName: 'Customer',
            username: 'customer2',
            email: getSeedEmail('SEED_CUSTOMER_TWO_EMAIL', 'customer2@sottocasa.it'),
            password: getRequiredSeedPassword('SEED_CUSTOMER_TWO_PASSWORD', 'Customer123!'),
            role: UserRole.CUSTOMER,
        },
    ];
}

export function getRoleSeedUsers(): SeedUserDefinition[] {
    return getSeedUsers().filter((user) => user.role !== UserRole.CUSTOMER);
}

export function getSeedLoginReference(): SeedLoginReference[] {
    return getSeedUsers().map((user) => ({
        role: user.role,
        displayName: `${user.firstName} ${user.lastName}`,
        identifier: user.email,
        email: user.email,
        password: user.password,
    }));
}

export function getSeedShops(): SeedShopDefinition[] {
    const users = getSeedUsers();
    const merchantEmail = users.find((user) => user.role === UserRole.MERCHANT)?.email ?? 'merchant@sottocasa.it';
    const representativeEmail = users.find((user) => user.role === UserRole.REPRESENTATIVE)?.email ?? 'representative@sottocasa.it';

    return [
        {
            name: 'Roma Centro Market',
            location: 'Rome City Center',
            description: 'Flagship neighborhood store for daily rewards and customer wallet demos.',
            merchantEmail,
            representativeEmail,
            isActive: true,
        },
        {
            name: 'Milano Rewards Corner',
            location: 'Milan Porta Nuova',
            description: 'Second demo shop used for transfer and representative management scenarios.',
            merchantEmail,
            representativeEmail,
            isActive: true,
        },
    ];
}

export function getSeedPromotions(): SeedPromotionDefinition[] {
    const merchantEmail = getSeedUsers().find((user) => user.role === UserRole.MERCHANT)?.email ?? 'merchant@sottocasa.it';

    return [
        {
            title: 'Spring Bonus Week',
            description: 'Earn extra points on your first purchase of the week.',
            shopName: 'Roma Centro Market',
            merchantEmail,
            bonusPoints: 20,
            maxDiscountPercent: 25,
            startsAt: '2026-03-20T09:00:00.000Z',
            endsAt: '2026-04-10T21:00:00.000Z',
            isActive: true,
        },
        {
            title: 'Weekend Saver',
            description: 'Bonus cashback-style points for high-value weekend purchases.',
            shopName: 'Milano Rewards Corner',
            merchantEmail,
            bonusPoints: 35,
            maxDiscountPercent: 30,
            startsAt: '2026-03-22T08:00:00.000Z',
            endsAt: '2026-04-30T22:00:00.000Z',
            isActive: true,
        },
    ];
}

export function getSeedEvents(): SeedEventDefinition[] {
    const representativeEmail = getSeedUsers().find((user) => user.role === UserRole.REPRESENTATIVE)?.email ?? 'representative@sottocasa.it';
    const adminEmail = getSeedUsers().find((user) => user.role === UserRole.ADMIN)?.email ?? 'admin@sottocasa.it';

    return [
        {
            title: 'Merchant Onboarding Session',
            description: 'Walkthrough for representatives and merchants using the loyalty flows.',
            location: 'Rome HQ',
            createdByEmail: representativeEmail,
            startsAt: '2026-03-25T10:00:00.000Z',
            endsAt: '2026-03-25T12:00:00.000Z',
            isActive: true,
        },
        {
            title: 'Admin Rewards Review',
            description: 'Monthly health check for campaigns, transactions, and outstanding balances.',
            location: 'Milan Operations Hub',
            createdByEmail: adminEmail,
            startsAt: '2026-03-28T14:00:00.000Z',
            endsAt: '2026-03-28T15:30:00.000Z',
            isActive: true,
        },
    ];
}

export function getSeedWalletTransactions(): SeedWalletTransactionDefinition[] {
    const users = getSeedUsers();
    const customerEmail = users.find((user) => user.username === 'customer')?.email ?? 'customer@sottocasa.it';
    const customerTwoEmail = users.find((user) => user.username === 'customer2')?.email ?? 'customer2@sottocasa.it';
    const merchantEmail = users.find((user) => user.role === UserRole.MERCHANT)?.email ?? 'merchant@sottocasa.it';

    return [
        {
            description: 'Seed earn transaction for Roma flagship launch purchase',
            customerEmail,
            merchantEmail,
            performedByEmail: merchantEmail,
            shopName: 'Roma Centro Market',
            type: WalletTransactionType.EARN,
            pointType: WalletPointType.STANDARD,
            status: WalletTransactionStatus.SUCCESS,
            points: 120,
            purchaseAmount: 2400,
            discountAmount: 0,
            payableAmount: 2400,
            earnedPoints: 120,
            isFirstTransactionBonus: false,
            createdAt: '2026-03-20T10:00:00.000Z',
        },
        {
            description: 'Seed bonus promotion credit for first weekly purchase',
            customerEmail,
            merchantEmail,
            performedByEmail: merchantEmail,
            shopName: 'Roma Centro Market',
            type: WalletTransactionType.EARN,
            pointType: WalletPointType.BONUS,
            status: WalletTransactionStatus.SUCCESS,
            points: 20,
            purchaseAmount: 2400,
            discountAmount: 0,
            payableAmount: 2400,
            earnedPoints: 20,
            isFirstTransactionBonus: true,
            createdAt: '2026-03-20T10:01:00.000Z',
        },
        {
            description: 'Seed spend transaction for loyalty redemption',
            customerEmail,
            merchantEmail,
            performedByEmail: merchantEmail,
            shopName: 'Roma Centro Market',
            type: WalletTransactionType.SPEND,
            pointType: WalletPointType.STANDARD,
            status: WalletTransactionStatus.SUCCESS,
            points: -20,
            purchaseAmount: 800,
            discountAmount: 200,
            payableAmount: 600,
            earnedPoints: 0,
            isFirstTransactionBonus: false,
            createdAt: '2026-03-21T11:00:00.000Z',
        },
        {
            description: 'Seed earn transaction for Milano rewards demo',
            customerEmail: customerTwoEmail,
            merchantEmail,
            performedByEmail: merchantEmail,
            shopName: 'Milano Rewards Corner',
            type: WalletTransactionType.EARN,
            pointType: WalletPointType.STANDARD,
            status: WalletTransactionStatus.SUCCESS,
            points: 35,
            purchaseAmount: 700,
            discountAmount: 0,
            payableAmount: 700,
            earnedPoints: 35,
            isFirstTransactionBonus: false,
            createdAt: '2026-03-22T09:30:00.000Z',
        },
    ];
}
