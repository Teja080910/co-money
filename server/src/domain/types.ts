export type UserRole = 'customer' | 'merchant' | 'representative' | 'admin';

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

export type Wallet = {
  customerId: string;
  buckets: WalletBucket[];
};

export type UserRecord = {
  id: string;
  fullName: string;
  username: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  verified: boolean;
  createdAt: string;
  managedShopIds: string[];
  managedMerchantIds: string[];
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

export type AppStateData = {
  shops: Shop[];
  wallets: Wallet[];
  promotions: Promotion[];
  events: EventRecord[];
  transactions: RewardTransaction[];
};

export type RegisterInput = {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type PreviewTransactionInput = {
  customerId: string;
  merchantId: string;
  shopId: string;
  totalAmount: number;
  requestedPoints?: number;
};

export type ProcessTransactionInput = PreviewTransactionInput;

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
