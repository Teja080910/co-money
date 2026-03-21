import { AppDataSource } from '../config/db';
import { demoStore } from '../data/demoStore';
import type {
  AppStateData,
  EventRecord,
  LoginInput,
  PreviewTransactionInput,
  ProcessTransactionInput,
  Promotion,
  RewardTransaction,
  Shop,
  TransactionPreview,
  TransactionSource,
  UserRecord,
  Wallet,
  RegisterInput,
} from '../domain/types';
import { AppState } from '../models/AppState';
import { User } from '../models/User';
import { createId, hashPassword } from '../utils/security';

const FIRST_TIME_BONUS = 20;
const APP_STATE_ID = 'default';

function sanitizeUser(user: UserRecord) {
  return {
    id: user.id,
    fullName: user.fullName,
    username: user.username,
    email: user.email,
    role: user.role,
    verified: user.verified,
    createdAt: user.createdAt,
    managedShopIds: user.managedShopIds,
    managedMerchantIds: user.managedMerchantIds,
  };
}

function mapUserEntity(user: User): UserRecord {
  return {
    id: user.id,
    fullName: user.fullName,
    username: user.username,
    email: user.email,
    passwordHash: user.passwordHash,
    role: user.role,
    verified: user.verified,
    createdAt: user.createdAt.toISOString(),
    managedShopIds: user.managedShopIds ?? [],
    managedMerchantIds: user.managedMerchantIds ?? [],
  };
}

function createInitialState(): AppStateData {
  return {
    shops: [...demoStore.shops],
    wallets: [...demoStore.wallets.map(wallet => ({ ...wallet, buckets: [...wallet.buckets] }))],
    promotions: [...demoStore.promotions],
    events: [...demoStore.events],
    transactions: [...demoStore.transactions],
  };
}

export class AppService {
  private userRepository = AppDataSource.getRepository(User);
  private stateRepository = AppDataSource.getRepository(AppState);

  private async getStateEntity(): Promise<AppState> {
    let state = await this.stateRepository.findOneBy({ id: APP_STATE_ID });
    if (!state) {
      state = this.stateRepository.create({
        id: APP_STATE_ID,
        ...createInitialState(),
      });
      state = await this.stateRepository.save(state);
    }
    return state;
  }

  private async getState(): Promise<AppStateData> {
    const state = await this.getStateEntity();
    return {
      shops: state.shops ?? [],
      wallets: state.wallets ?? [],
      promotions: state.promotions ?? [],
      events: state.events ?? [],
      transactions: state.transactions ?? [],
    };
  }

  private async saveState(data: AppStateData): Promise<void> {
    await this.stateRepository.save(
      this.stateRepository.create({
        id: APP_STATE_ID,
        ...data,
      }),
    );
  }

  private async getWallet(customerId: string): Promise<{ state: AppStateData; wallet: Wallet }> {
    const state = await this.getState();
    let wallet = state.wallets.find(entry => entry.customerId === customerId);

    if (!wallet) {
      wallet = { customerId, buckets: [] };
      state.wallets.push(wallet);
      await this.saveState(state);
    }

    return { state, wallet };
  }

  private getShopFromState(state: AppStateData, shopId: string): Shop {
    const shop = state.shops.find(entry => entry.id === shopId);
    if (!shop) {
      throw new Error('Shop not found.');
    }
    return shop;
  }

  private async getUser(userId: string): Promise<UserRecord> {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new Error('User not found.');
    }
    return mapUserEntity(user);
  }

  private getScopedTransactions(state: AppStateData, user: UserRecord): RewardTransaction[] {
    if (user.role === 'customer') {
      return state.transactions.filter(entry => entry.customerId === user.id);
    }

    if (user.role === 'merchant') {
      return state.transactions.filter(entry => entry.merchantId === user.id);
    }

    if (user.role === 'representative') {
      return state.transactions.filter(entry => user.managedShopIds.includes(entry.shopId));
    }

    return [...state.transactions];
  }

  private hasVisitedShop(state: AppStateData, customerId: string, shopId: string): boolean {
    return state.transactions.some(entry => entry.customerId === customerId && entry.shopId === shopId);
  }

  private addPoints(wallet: Wallet, shop: Shop, points: number): void {
    if (points <= 0) {
      return;
    }

    const bucket = wallet.buckets.find(entry => entry.shopId === shop.id);
    if (bucket) {
      bucket.balance += points;
      bucket.updatedAt = new Date().toISOString();
      return;
    }

    wallet.buckets.push({
      shopId: shop.id,
      shopName: shop.name,
      balance: points,
      updatedAt: new Date().toISOString(),
    });
  }

  private consumeSpendablePoints(wallet: Wallet, shopId: string, requestedPoints: number): {
    spentPoints: number;
    restrictedPoints: number;
    sources: TransactionSource[];
  } {
    const restrictedPoints = wallet.buckets
      .filter(entry => entry.shopId === shopId)
      .reduce((sum, entry) => sum + entry.balance, 0);

    const spendableBuckets = wallet.buckets
      .filter(entry => entry.shopId !== shopId && entry.balance > 0)
      .sort((left, right) => left.updatedAt.localeCompare(right.updatedAt));

    let remaining = requestedPoints;
    const sources: TransactionSource[] = [];

    for (const bucket of spendableBuckets) {
      if (remaining <= 0) {
        break;
      }

      const pointsUsed = Math.min(bucket.balance, remaining);
      if (pointsUsed <= 0) {
        continue;
      }

      bucket.balance -= pointsUsed;
      bucket.updatedAt = new Date().toISOString();
      remaining -= pointsUsed;
      sources.push({
        shopId: bucket.shopId,
        shopName: bucket.shopName,
        pointsUsed,
      });
    }

    wallet.buckets = wallet.buckets.filter(entry => entry.balance > 0);

    return {
      spentPoints: requestedPoints - remaining,
      restrictedPoints,
      sources,
    };
  }

  public async register(input: RegisterInput) {
    const email = input.email.trim().toLowerCase();
    const existingUser = await this.userRepository.findOneBy({ email });
    if (existingUser) {
      throw new Error('An account with this email already exists.');
    }

    const fullName = input.fullName.trim();
    const username = fullName.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 18) || 'member';
    const user = this.userRepository.create({
      fullName,
      username,
      email,
      passwordHash: hashPassword(input.password),
      role: input.role,
      verified: false,
      managedShopIds: [],
      managedMerchantIds: [],
    });

    const savedUser = await this.userRepository.save(user);
    await this.getWallet(savedUser.id);

    return {
      user: sanitizeUser(mapUserEntity(savedUser)),
      verificationCode: '123456',
    };
  }

  public async verifyEmail(userId: string, otp: string) {
    if (otp !== '123456') {
      throw new Error('Invalid verification code.');
    }

    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new Error('User not found.');
    }

    user.verified = true;
    const savedUser = await this.userRepository.save(user);
    return { user: sanitizeUser(mapUserEntity(savedUser)) };
  }

  public async login(input: LoginInput) {
    const email = input.email.trim().toLowerCase();
    const user = await this.userRepository.findOneBy({ email });
    console.log(`User found: ${user}`);
    if (!user || user.passwordHash !== hashPassword(input.password)) {
      throw new Error('Invalid email or password.');
    }

    if (!user.verified) {
      throw new Error('Please verify your email before logging in.');
    }

    return {
      user: sanitizeUser(mapUserEntity(user)),
      token: `db-token-${user.id}`,
    };
  }

  public async getOverview(userId: string) {
    const user = await this.getUser(userId);
    const state = await this.getState();
    const transactions = this.getScopedTransactions(state, user)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .slice(0, 6);
    const wallet = state.wallets.find(entry => entry.customerId === userId) ?? { customerId: userId, buckets: [] };
    const totalBalance = wallet.buckets.reduce((sum, entry) => sum + entry.balance, 0);

    const base = {
      user: sanitizeUser(user),
      shops: state.shops,
      promotions: state.promotions.filter(entry => entry.active),
      events: state.events,
      recentTransactions: transactions,
    };

    if (user.role === 'customer') {
      return {
        ...base,
        wallet,
        metrics: {
          balance: totalBalance,
          visits: state.transactions.filter(entry => entry.customerId === userId).length,
          savings: state.transactions
            .filter(entry => entry.customerId === userId)
            .reduce((sum, entry) => sum + entry.discountAmount, 0),
        },
      };
    }

    if (user.role === 'merchant') {
      const managedShops = state.shops.filter(entry => user.managedShopIds.includes(entry.id));
      const merchantTransactions = state.transactions.filter(entry => entry.merchantId === userId);

      return {
        ...base,
        managedShops,
        metrics: {
          transactionsToday: merchantTransactions.length,
          customersServed: new Set(merchantTransactions.map(entry => entry.customerId)).size,
          pointsIssued: merchantTransactions.reduce((sum, entry) => sum + entry.earnedPoints, 0),
          pointsAccepted: merchantTransactions.reduce((sum, entry) => sum + entry.spentPoints, 0),
        },
      };
    }

    if (user.role === 'representative') {
      const scopedTransactions = state.transactions.filter(entry => user.managedShopIds.includes(entry.shopId));

      return {
        ...base,
        managedShops: state.shops.filter(entry => user.managedShopIds.includes(entry.id)),
        merchants: (await this.userRepository.find())
          .map(mapUserEntity)
          .filter(entry => user.managedMerchantIds.includes(entry.id))
          .map(sanitizeUser),
        metrics: {
          activeMerchants: user.managedMerchantIds.length,
          networkSales: scopedTransactions.reduce((sum, entry) => sum + entry.payableAmount, 0),
          redeemedPoints: scopedTransactions.reduce((sum, entry) => sum + entry.spentPoints, 0),
        },
      };
    }

    return {
      ...base,
      users: (await this.userRepository.find()).map(entry => sanitizeUser(mapUserEntity(entry))),
      metrics: {
        totalUsers: await this.userRepository.count(),
        totalShops: state.shops.length,
        livePromotions: state.promotions.filter(entry => entry.active).length,
        transactions: state.transactions.length,
      },
    };
  }

  public async getWalletSummary(customerId: string) {
    const { wallet } = await this.getWallet(customerId);
    return {
      wallet,
      totalBalance: wallet.buckets.reduce((sum, entry) => sum + entry.balance, 0),
    };
  }

  public async getTransactions(userId: string) {
    const user = await this.getUser(userId);
    const state = await this.getState();
    return this.getScopedTransactions(state, user).sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }

  public async getPromotions(): Promise<Promotion[]> {
    return (await this.getState()).promotions.filter(entry => entry.active);
  }

  public async getShops(): Promise<Shop[]> {
    return (await this.getState()).shops;
  }

  public async getEvents(): Promise<EventRecord[]> {
    return (await this.getState()).events;
  }

  public async getUsers() {
    return (await this.userRepository.find()).map(entry => sanitizeUser(mapUserEntity(entry)));
  }

  public async getQrPayload(userId: string) {
    const user = await this.getUser(userId);
    return {
      user: sanitizeUser(user),
      qrValue: `COMONEY::${user.id}::${Date.now()}`,
      wallet: await this.getWalletSummary(userId),
    };
  }

  public async previewTransaction(input: PreviewTransactionInput): Promise<TransactionPreview> {
    const state = await this.getState();
    const shop = this.getShopFromState(state, input.shopId);
    const wallet = state.wallets.find(entry => entry.customerId === input.customerId) ?? { customerId: input.customerId, buckets: [] };
    const totalAmount = Math.max(0, input.totalAmount);
    const requestedPoints = Math.max(0, Math.floor(input.requestedPoints ?? 0));
    const maxRedeemablePoints = Math.floor(totalAmount * shop.maxDiscountRate);
    const spendablePoints = wallet.buckets
      .filter(entry => entry.shopId !== shop.id)
      .reduce((sum, entry) => sum + entry.balance, 0);
    const sameShopRestrictedPoints = wallet.buckets
      .filter(entry => entry.shopId === shop.id)
      .reduce((sum, entry) => sum + entry.balance, 0);
    const pointsToUse = Math.min(requestedPoints, maxRedeemablePoints, spendablePoints);

    const previewSources: TransactionSource[] = [];
    let remaining = pointsToUse;
    for (const bucket of wallet.buckets.filter(entry => entry.shopId !== shop.id)) {
      if (remaining <= 0) {
        break;
      }
      const pointsUsed = Math.min(bucket.balance, remaining);
      if (pointsUsed <= 0) {
        continue;
      }
      previewSources.push({ shopId: bucket.shopId, shopName: bucket.shopName, pointsUsed });
      remaining -= pointsUsed;
    }

    const discountAmount = pointsToUse;
    const payableAmount = Math.max(0, totalAmount - discountAmount);
    const firstTimeBonus = this.hasVisitedShop(state, input.customerId, shop.id) ? 0 : FIRST_TIME_BONUS;
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
      sources: previewSources,
    };
  }

  public async processTransaction(input: ProcessTransactionInput) {
    const customer = await this.getUser(input.customerId);
    const merchant = await this.getUser(input.merchantId);
    const state = await this.getState();
    const shop = this.getShopFromState(state, input.shopId);

    if (!merchant.managedShopIds.includes(shop.id)) {
      throw new Error('Merchant cannot transact for this shop.');
    }

    if (customer.role !== 'customer') {
      throw new Error('Only customer accounts can earn or spend points.');
    }

    const preview = await this.previewTransaction(input);
    let wallet = state.wallets.find(entry => entry.customerId === input.customerId);
    if (!wallet) {
      wallet = { customerId: input.customerId, buckets: [] };
      state.wallets.push(wallet);
    }

    const usage = this.consumeSpendablePoints(wallet, shop.id, preview.discountAmount);
    this.addPoints(wallet, shop, preview.earnedPoints);

    const transaction: RewardTransaction = {
      id: createId('txn'),
      customerId: customer.id,
      merchantId: merchant.id,
      shopId: shop.id,
      shopName: shop.name,
      totalAmount: preview.totalAmount,
      discountAmount: usage.spentPoints,
      payableAmount: preview.totalAmount - usage.spentPoints,
      earnedPoints: preview.earnedPoints,
      spentPoints: usage.spentPoints,
      firstTimeBonus: preview.firstTimeBonus,
      sources: usage.sources,
      createdAt: new Date().toISOString(),
    };

    state.transactions.unshift(transaction);
    await this.saveState(state);

    return {
      transaction,
      wallet: {
        wallet,
        totalBalance: wallet.buckets.reduce((sum, entry) => sum + entry.balance, 0),
      },
      preview: {
        ...preview,
        discountAmount: usage.spentPoints,
        payableAmount: preview.totalAmount - usage.spentPoints,
        sameShopRestrictedPoints: usage.restrictedPoints,
      },
    };
  }

  public async createPromotion(input: Omit<Promotion, 'id'>) {
    const state = await this.getState();
    const promotion: Promotion = {
      ...input,
      id: createId('promo'),
    };
    state.promotions.unshift(promotion);
    await this.saveState(state);
    return promotion;
  }

  public async createEvent(input: Omit<EventRecord, 'id'>) {
    const state = await this.getState();
    const event: EventRecord = {
      ...input,
      id: createId('event'),
    };
    state.events.unshift(event);
    await this.saveState(state);
    return event;
  }
}
