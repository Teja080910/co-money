import type {
  EventRecord,
  LoginResponse,
  OverviewData,
  Promotion,
  QrPayload,
  RegisterResponse,
  RewardTransaction,
  SessionUser,
  Shop,
  TransactionPreview,
  TransactionSource,
  UserRole,
  WalletSummary,
} from '../types/app';

type WalletBucket = WalletSummary['wallet']['buckets'][number];

const FIRST_TIME_BONUS = 20;
const CUSTOMER_ID = '11111111-1111-4111-8111-111111111111';
const MERCHANT_1_ID = '22222222-2222-4222-8222-222222222222';
const REPRESENTATIVE_ID = '33333333-3333-4333-8333-333333333333';
const ADMIN_ID = '44444444-4444-4444-8444-444444444444';
const MERCHANT_2_ID = '55555555-5555-4555-8555-555555555555';
const MERCHANT_3_ID = '66666666-6666-4666-8666-666666666666';

const users: Array<SessionUser & { password: string }> = [
  {
    id: CUSTOMER_ID,
    fullName: 'Giulia Rossi',
    username: 'giuliarossi',
    email: 'customer@sottocasa.app',
    password: 'password123',
    role: 'customer',
    verified: true,
    createdAt: '2026-03-21T09:00:00.000Z',
    managedShopIds: [],
    managedMerchantIds: [],
  },
  {
    id: MERCHANT_1_ID,
    fullName: 'Marco Bianchi',
    username: 'marcobianchi',
    email: 'merchant@sottocasa.app',
    password: 'password123',
    role: 'merchant',
    verified: true,
    createdAt: '2026-03-21T09:00:00.000Z',
    managedShopIds: ['shop_1'],
    managedMerchantIds: [],
  },
  {
    id: REPRESENTATIVE_ID,
    fullName: 'Sara Conti',
    username: 'saraconti',
    email: 'rep@sottocasa.app',
    password: 'password123',
    role: 'representative',
    verified: true,
    createdAt: '2026-03-21T09:00:00.000Z',
    managedShopIds: ['shop_1', 'shop_2', 'shop_3'],
    managedMerchantIds: [MERCHANT_1_ID, MERCHANT_2_ID, MERCHANT_3_ID],
  },
  {
    id: ADMIN_ID,
    fullName: 'Admin Team',
    username: 'adminteam',
    email: 'admin@sottocasa.app',
    password: 'password123',
    role: 'admin',
    verified: true,
    createdAt: '2026-03-21T09:00:00.000Z',
    managedShopIds: [],
    managedMerchantIds: [],
  },
  {
    id: MERCHANT_2_ID,
    fullName: 'Luca Verdi',
    username: 'lucaverdi',
    email: 'cafe@sottocasa.app',
    password: 'password123',
    role: 'merchant',
    verified: true,
    createdAt: '2026-03-21T09:00:00.000Z',
    managedShopIds: ['shop_2'],
    managedMerchantIds: [],
  },
  {
    id: MERCHANT_3_ID,
    fullName: 'Elena Neri',
    username: 'elenaneri',
    email: 'wellness@sottocasa.app',
    password: 'password123',
    role: 'merchant',
    verified: true,
    createdAt: '2026-03-21T09:00:00.000Z',
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

const walletMap = new Map<string, WalletSummary>([
  [
    CUSTOMER_ID,
    {
      totalBalance: 85,
      wallet: {
        customerId: CUSTOMER_ID,
        buckets: [
          { shopId: 'shop_1', shopName: 'Sottocasa Market', balance: 48, updatedAt: '2026-03-21T09:00:00.000Z' },
          { shopId: 'shop_2', shopName: 'Corso Caffe', balance: 22, updatedAt: '2026-03-21T09:00:00.000Z' },
          { shopId: 'shop_3', shopName: 'Verde Wellness', balance: 15, updatedAt: '2026-03-21T09:00:00.000Z' },
        ],
      },
    },
  ],
]);

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
];

const transactions: RewardTransaction[] = [
  {
    id: 'txn_1',
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
    id: 'txn_2',
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

function cloneUser(user: SessionUser & { password: string }): SessionUser {
  const { password: _password, ...safeUser } = user;
  return { ...safeUser };
}

function createUserId() {
  return `user_${Date.now()}`;
}

function createEntityId(prefix: string) {
  return `${prefix}_${Date.now()}`;
}

function getWallet(userId: string): WalletSummary {
  const existing = walletMap.get(userId);
  if (existing) {
    return existing;
  }

  const wallet: WalletSummary = {
    totalBalance: 0,
    wallet: {
      customerId: userId,
      buckets: [],
    },
  };
  walletMap.set(userId, wallet);
  return wallet;
}

function recalculateWallet(wallet: WalletSummary) {
  wallet.totalBalance = wallet.wallet.buckets.reduce((sum, bucket) => sum + bucket.balance, 0);
}

function getScopedTransactions(user: SessionUser): RewardTransaction[] {
  if (user.role === 'customer') {
    return transactions.filter(item => item.customerId === user.id);
  }
  if (user.role === 'merchant') {
    return transactions.filter(item => item.merchantId === user.id);
  }
  if (user.role === 'representative') {
    return transactions.filter(item => user.managedShopIds.includes(item.shopId));
  }
  return [...transactions];
}

function buildOverview(user: SessionUser): OverviewData {
  const wallet = getWallet(user.id);
  const recentTransactions = getScopedTransactions(user).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6);

  if (user.role === 'customer') {
    return {
      user,
      shops,
      promotions,
      events,
      recentTransactions,
      wallet: wallet.wallet,
      metrics: {
        balance: wallet.totalBalance,
        visits: transactions.filter(item => item.customerId === user.id).length,
        savings: transactions.filter(item => item.customerId === user.id).reduce((sum, item) => sum + item.discountAmount, 0),
      },
    };
  }

  if (user.role === 'merchant') {
    const merchantTransactions = transactions.filter(item => item.merchantId === user.id);
    return {
      user,
      shops,
      promotions,
      events,
      recentTransactions,
      managedShops: shops.filter(shop => user.managedShopIds.includes(shop.id)),
      metrics: {
        transactionsToday: merchantTransactions.length,
        customersServed: new Set(merchantTransactions.map(item => item.customerId)).size,
        pointsIssued: merchantTransactions.reduce((sum, item) => sum + item.earnedPoints, 0),
        pointsAccepted: merchantTransactions.reduce((sum, item) => sum + item.spentPoints, 0),
      },
    };
  }

  if (user.role === 'representative') {
    const scopedTransactions = transactions.filter(item => user.managedShopIds.includes(item.shopId));
    return {
      user,
      shops,
      promotions,
      events,
      recentTransactions,
      managedShops: shops.filter(shop => user.managedShopIds.includes(shop.id)),
      merchants: users.filter(item => user.managedMerchantIds.includes(item.id)).map(cloneUser),
      metrics: {
        activeMerchants: user.managedMerchantIds.length,
        networkSales: scopedTransactions.reduce((sum, item) => sum + item.payableAmount, 0),
        redeemedPoints: scopedTransactions.reduce((sum, item) => sum + item.spentPoints, 0),
      },
    };
  }

  return {
    user,
    shops,
    promotions,
    events,
    recentTransactions,
    users: users.map(cloneUser),
    metrics: {
      totalUsers: users.length,
      totalShops: shops.length,
      livePromotions: promotions.filter(item => item.active).length,
      transactions: transactions.length,
    },
  };
}

function previewTransactionCore(payload: {
  customerId: string;
  merchantId: string;
  shopId: string;
  totalAmount: number;
  requestedPoints?: number;
}): TransactionPreview {
  const wallet = getWallet(payload.customerId);
  const shop = shops.find(item => item.id === payload.shopId);
  if (!shop) {
    throw new Error('Shop not found.');
  }

  const totalAmount = Math.max(0, payload.totalAmount);
  const requestedPoints = Math.max(0, Math.floor(payload.requestedPoints ?? 0));
  const maxRedeemablePoints = Math.floor(totalAmount * shop.maxDiscountRate);
  const spendablePoints = wallet.wallet.buckets
    .filter(bucket => bucket.shopId !== shop.id)
    .reduce((sum, bucket) => sum + bucket.balance, 0);
  const sameShopRestrictedPoints = wallet.wallet.buckets
    .filter(bucket => bucket.shopId === shop.id)
    .reduce((sum, bucket) => sum + bucket.balance, 0);
  const discountAmount = Math.min(requestedPoints, maxRedeemablePoints, spendablePoints);

  let remaining = discountAmount;
  const sources: TransactionSource[] = [];
  for (const bucket of wallet.wallet.buckets.filter(item => item.shopId !== shop.id)) {
    if (remaining <= 0) {
      break;
    }
    const pointsUsed = Math.min(bucket.balance, remaining);
    if (pointsUsed > 0) {
      sources.push({ shopId: bucket.shopId, shopName: bucket.shopName, pointsUsed });
      remaining -= pointsUsed;
    }
  }

  const payableAmount = Math.max(0, totalAmount - discountAmount);
  const firstTimeBonus = transactions.some(item => item.customerId === payload.customerId && item.shopId === payload.shopId) ? 0 : FIRST_TIME_BONUS;
  const earnedPoints = Math.floor(payableAmount * shop.earnRate) + firstTimeBonus;

  return {
    totalAmount,
    maxRedeemablePoints,
    spendablePoints,
    discountAmount,
    payableAmount,
    earnedPoints,
    firstTimeBonus,
    sameShopRestrictedPoints,
    sources,
  };
}

function consumePoints(wallet: WalletSummary, shopId: string, pointsToUse: number): TransactionSource[] {
  let remaining = pointsToUse;
  const sources: TransactionSource[] = [];

  for (const bucket of wallet.wallet.buckets.filter(item => item.shopId !== shopId)) {
    if (remaining <= 0) {
      break;
    }
    const pointsUsed = Math.min(bucket.balance, remaining);
    if (pointsUsed > 0) {
      bucket.balance -= pointsUsed;
      bucket.updatedAt = new Date().toISOString();
      remaining -= pointsUsed;
      sources.push({ shopId: bucket.shopId, shopName: bucket.shopName, pointsUsed });
    }
  }

  wallet.wallet.buckets = wallet.wallet.buckets.filter(bucket => bucket.balance > 0);
  recalculateWallet(wallet);
  return sources;
}

function addPoints(wallet: WalletSummary, shop: Shop, earnedPoints: number) {
  if (earnedPoints <= 0) {
    return;
  }

  const bucket = wallet.wallet.buckets.find(item => item.shopId === shop.id);
  if (bucket) {
    bucket.balance += earnedPoints;
    bucket.updatedAt = new Date().toISOString();
  } else {
    wallet.wallet.buckets.push({
      shopId: shop.id,
      shopName: shop.name,
      balance: earnedPoints,
      updatedAt: new Date().toISOString(),
    });
  }

  recalculateWallet(wallet);
}

export const demoApi = {
  async register(payload: { fullName: string; email: string; password: string; role: UserRole }): Promise<RegisterResponse> {
    const normalizedEmail = payload.email.trim().toLowerCase();
    if (users.some(user => user.email === normalizedEmail)) {
      throw new Error('An account with this email already exists.');
    }

    const user: SessionUser & { password: string } = {
      id: createUserId(),
      fullName: payload.fullName.trim(),
      username: payload.fullName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 18) || 'member',
      email: normalizedEmail,
      password: payload.password,
      role: payload.role,
      verified: false,
      createdAt: new Date().toISOString(),
      managedShopIds: [],
      managedMerchantIds: [],
    };

    users.push(user);
    walletMap.set(user.id, { totalBalance: 0, wallet: { customerId: user.id, buckets: [] } });

    return {
      user: cloneUser(user),
      verificationCode: '123456',
    };
  },

  async verifyEmail(payload: { userId: string; otp: string }) {
    if (payload.otp !== '123456') {
      throw new Error('Invalid verification code.');
    }
    const user = users.find(item => item.id === payload.userId);
    if (!user) {
      throw new Error('User not found.');
    }
    user.verified = true;
    return { user: cloneUser(user) };
  },

  async login(payload: { email: string; password: string }): Promise<LoginResponse> {
    const user = users.find(item => item.email === payload.email.trim().toLowerCase());
    if (!user || user.password !== payload.password) {
      throw new Error('Invalid email or password.');
    }
    if (!user.verified) {
      throw new Error('Please verify your email before logging in.');
    }
    return {
      user: cloneUser(user),
      token: `demo-token-${user.id}`,
    };
  },

  async overview(userId: string) {
    const user = users.find(item => item.id === userId);
    if (!user) {
      throw new Error('User not found.');
    }
    return buildOverview(cloneUser(user));
  },

  async wallet(userId: string) {
    return getWallet(userId);
  },

  async transactions(userId: string) {
    const user = users.find(item => item.id === userId);
    if (!user) {
      throw new Error('User not found.');
    }
    return getScopedTransactions(cloneUser(user)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async promotions() {
    return promotions.filter(item => item.active);
  },

  async shops() {
    return shops;
  },

  async events() {
    return events;
  },

  async users() {
    return users.map(cloneUser);
  },

  async qr(userId: string): Promise<QrPayload> {
    const user = users.find(item => item.id === userId);
    if (!user) {
      throw new Error('User not found.');
    }
    return {
      user: cloneUser(user),
      qrValue: `COMONEY::${user.id}::${Date.now()}`,
      wallet: getWallet(user.id),
    };
  },

  async previewTransaction(payload: {
    customerId: string;
    merchantId: string;
    shopId: string;
    totalAmount: number;
    requestedPoints?: number;
  }) {
    return previewTransactionCore(payload);
  },

  async processTransaction(payload: {
    customerId: string;
    merchantId: string;
    shopId: string;
    totalAmount: number;
    requestedPoints?: number;
  }) {
    const preview = previewTransactionCore(payload);
    const wallet = getWallet(payload.customerId);
    const shop = shops.find(item => item.id === payload.shopId);
    if (!shop) {
      throw new Error('Shop not found.');
    }

    const sources = consumePoints(wallet, shop.id, preview.discountAmount);
    addPoints(wallet, shop, preview.earnedPoints);

    const transaction: RewardTransaction = {
      id: createEntityId('txn'),
      customerId: payload.customerId,
      merchantId: payload.merchantId,
      shopId: shop.id,
      shopName: shop.name,
      totalAmount: preview.totalAmount,
      discountAmount: preview.discountAmount,
      payableAmount: preview.payableAmount,
      earnedPoints: preview.earnedPoints,
      spentPoints: preview.discountAmount,
      firstTimeBonus: preview.firstTimeBonus,
      sources,
      createdAt: new Date().toISOString(),
    };

    transactions.unshift(transaction);

    return {
      transaction,
      wallet,
      preview,
    };
  },

  async createPromotion(payload: Omit<Promotion, 'id'>) {
    const promotion: Promotion = {
      ...payload,
      id: createEntityId('promo'),
    };
    promotions.unshift(promotion);
    return promotion;
  },

  async createEvent(payload: Omit<EventRecord, 'id'>) {
    const event: EventRecord = {
      ...payload,
      id: createEntityId('event'),
    };
    events.unshift(event);
    return event;
  },
};
