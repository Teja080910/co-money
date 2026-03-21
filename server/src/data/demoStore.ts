import { createId, hashPassword } from '../utils/security';
import type {
  EventRecord,
  Promotion,
  RewardTransaction,
  Shop,
  UserRecord,
  Wallet,
} from '../domain/types';

const now = new Date('2026-03-21T09:00:00.000Z');
const CUSTOMER_ID = '11111111-1111-4111-8111-111111111111';
const MERCHANT_1_ID = '22222222-2222-4222-8222-222222222222';
const REPRESENTATIVE_ID = '33333333-3333-4333-8333-333333333333';
const ADMIN_ID = '44444444-4444-4444-8444-444444444444';
const MERCHANT_2_ID = '55555555-5555-4555-8555-555555555555';
const MERCHANT_3_ID = '66666666-6666-4666-8666-666666666666';

const users: UserRecord[] = [
  {
    id: CUSTOMER_ID,
    fullName: 'Giulia Rossi',
    username: 'giuliarossi',
    email: 'customer@sottocasa.app',
    passwordHash: hashPassword('password123'),
    role: 'customer',
    verified: true,
    createdAt: now.toISOString(),
    managedShopIds: [],
    managedMerchantIds: [],
  },
  {
    id: MERCHANT_1_ID,
    fullName: 'Marco Bianchi',
    username: 'marcobianchi',
    email: 'merchant@sottocasa.app',
    passwordHash: hashPassword('password123'),
    role: 'merchant',
    verified: true,
    createdAt: now.toISOString(),
    managedShopIds: ['shop_1'],
    managedMerchantIds: [],
  },
  {
    id: REPRESENTATIVE_ID,
    fullName: 'Sara Conti',
    username: 'saraconti',
    email: 'rep@sottocasa.app',
    passwordHash: hashPassword('password123'),
    role: 'representative',
    verified: true,
    createdAt: now.toISOString(),
    managedShopIds: ['shop_1', 'shop_2', 'shop_3'],
    managedMerchantIds: [MERCHANT_1_ID, MERCHANT_2_ID, MERCHANT_3_ID],
  },
  {
    id: ADMIN_ID,
    fullName: 'Admin Team',
    username: 'adminteam',
    email: 'admin@sottocasa.app',
    passwordHash: hashPassword('password123'),
    role: 'admin',
    verified: true,
    createdAt: now.toISOString(),
    managedShopIds: [],
    managedMerchantIds: [],
  },
  {
    id: MERCHANT_2_ID,
    fullName: 'Luca Verdi',
    username: 'lucaverdi',
    email: 'cafe@sottocasa.app',
    passwordHash: hashPassword('password123'),
    role: 'merchant',
    verified: true,
    createdAt: now.toISOString(),
    managedShopIds: ['shop_2'],
    managedMerchantIds: [],
  },
  {
    id: MERCHANT_3_ID,
    fullName: 'Elena Neri',
    username: 'elenaneri',
    email: 'wellness@sottocasa.app',
    passwordHash: hashPassword('password123'),
    role: 'merchant',
    verified: true,
    createdAt: now.toISOString(),
    managedShopIds: ['shop_3'],
    managedMerchantIds: [],
  },
];

const shops: Shop[] = [
  {
    id: 'shop_1',
    name: 'Sottocasa Market',
    category: 'Groceries',
    city: 'Milan',
    earnRate: 0.1,
    maxDiscountRate: 0.3,
    ownerMerchantId: MERCHANT_1_ID,
    representativeId: REPRESENTATIVE_ID,
  },
  {
    id: 'shop_2',
    name: 'Corso Caffe',
    category: 'Cafe',
    city: 'Milan',
    earnRate: 0.12,
    maxDiscountRate: 0.3,
    ownerMerchantId: MERCHANT_2_ID,
    representativeId: REPRESENTATIVE_ID,
  },
  {
    id: 'shop_3',
    name: 'Verde Wellness',
    category: 'Wellness',
    city: 'Milan',
    earnRate: 0.08,
    maxDiscountRate: 0.25,
    ownerMerchantId: MERCHANT_3_ID,
    representativeId: REPRESENTATIVE_ID,
  },
];

const wallets: Wallet[] = [
  {
    customerId: CUSTOMER_ID,
    buckets: [
      { shopId: 'shop_1', shopName: 'Sottocasa Market', balance: 48, updatedAt: now.toISOString() },
      { shopId: 'shop_2', shopName: 'Corso Caffe', balance: 22, updatedAt: now.toISOString() },
      { shopId: 'shop_3', shopName: 'Verde Wellness', balance: 15, updatedAt: now.toISOString() },
    ],
  },
];

const promotions: Promotion[] = [
  {
    id: 'promo_1',
    shopId: 'shop_1',
    title: 'Fresh basket bonus',
    description: 'Redeem 20 points for a curated produce basket upgrade.',
    pointsCost: 20,
    expiresAt: '2026-04-10T18:00:00.000Z',
    active: true,
  },
  {
    id: 'promo_2',
    shopId: 'shop_2',
    title: 'Coffee duo reward',
    description: 'Use 15 points to unlock a second artisan drink.',
    pointsCost: 15,
    expiresAt: '2026-04-01T18:00:00.000Z',
    active: true,
  },
  {
    id: 'promo_3',
    shopId: 'shop_3',
    title: 'Wellness starter kit',
    description: 'Spend 30 points on a mindfulness and tea bundle.',
    pointsCost: 30,
    expiresAt: '2026-04-20T18:00:00.000Z',
    active: true,
  },
];

const events: EventRecord[] = [
  {
    id: 'event_1',
    title: 'Neighbourhood Spring Market',
    venue: 'Via Roma Square',
    startsAt: '2026-03-28T10:00:00.000Z',
    status: 'scheduled',
    summary: 'Cross-shop weekend event to boost first-time visits.',
  },
  {
    id: 'event_2',
    title: 'Merchant Success Workshop',
    venue: 'Community Hub',
    startsAt: '2026-04-03T16:30:00.000Z',
    status: 'scheduled',
    summary: 'Training for merchants on promotions and wallet usage.',
  },
];

const transactions: RewardTransaction[] = [
  {
    id: createId('txn'),
    customerId: CUSTOMER_ID,
    merchantId: MERCHANT_1_ID,
    shopId: 'shop_1',
    shopName: 'Sottocasa Market',
    totalAmount: 120,
    discountAmount: 0,
    payableAmount: 120,
    earnedPoints: 32,
    spentPoints: 0,
    firstTimeBonus: 20,
    sources: [],
    createdAt: '2026-03-16T09:45:00.000Z',
  },
  {
    id: createId('txn'),
    customerId: CUSTOMER_ID,
    merchantId: MERCHANT_2_ID,
    shopId: 'shop_2',
    shopName: 'Corso Caffe',
    totalAmount: 90,
    discountAmount: 25,
    payableAmount: 65,
    earnedPoints: 7,
    spentPoints: 25,
    firstTimeBonus: 0,
    sources: [{ shopId: 'shop_1', shopName: 'Sottocasa Market', pointsUsed: 25 }],
    createdAt: '2026-03-18T11:15:00.000Z',
  },
];

export const demoStore = {
  users,
  shops,
  wallets,
  promotions,
  events,
  transactions,
};
