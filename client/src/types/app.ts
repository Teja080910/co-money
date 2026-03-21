export type UserRole = 'customer' | 'merchant' | 'representative' | 'admin';

export type SessionUser = {
  id: string;
  fullName: string;
  username: string;
  email: string;
  role: UserRole;
  verified: boolean;
  createdAt: string;
  managedShopIds: string[];
  managedMerchantIds: string[];
};

export type Shop = {
  id: string;
  name: string;
  category: string;
  city: string;
  earnRate: number;
  maxDiscountRate: number;
  ownerMerchantId: string;
  representativeId: string;
};

export type WalletBucket = {
  shopId: string;
  shopName: string;
  balance: number;
  updatedAt: string;
};

export type WalletSummary = {
  wallet: {
    customerId: string;
    buckets: WalletBucket[];
  };
  totalBalance: number;
};

export type Promotion = {
  id: string;
  shopId: string;
  title: string;
  description: string;
  pointsCost: number;
  expiresAt: string;
  active: boolean;
};

export type EventRecord = {
  id: string;
  title: string;
  venue: string;
  startsAt: string;
  status: 'scheduled' | 'live' | 'completed';
  summary: string;
};

export type TransactionSource = {
  shopId: string;
  shopName: string;
  pointsUsed: number;
};

export type RewardTransaction = {
  id: string;
  customerId: string;
  merchantId: string;
  shopId: string;
  shopName: string;
  totalAmount: number;
  discountAmount: number;
  payableAmount: number;
  earnedPoints: number;
  spentPoints: number;
  firstTimeBonus: number;
  sources: TransactionSource[];
  createdAt: string;
};

export type TransactionPreview = {
  totalAmount: number;
  maxRedeemablePoints: number;
  spendablePoints: number;
  discountAmount: number;
  payableAmount: number;
  earnedPoints: number;
  firstTimeBonus: number;
  sameShopRestrictedPoints: number;
  sources: TransactionSource[];
};

export type OverviewData = {
  user: SessionUser;
  shops: Shop[];
  promotions: Promotion[];
  events: EventRecord[];
  recentTransactions: RewardTransaction[];
  wallet?: { customerId: string; buckets: WalletBucket[] };
  managedShops?: Shop[];
  merchants?: SessionUser[];
  users?: SessionUser[];
  metrics: Record<string, number>;
};

export type QrPayload = {
  user: SessionUser;
  qrValue: string;
  wallet: WalletSummary;
};

export type RegisterResponse = {
  user: SessionUser;
  verificationCode: string;
};

export type LoginResponse = {
  user: SessionUser;
  token: string;
};
