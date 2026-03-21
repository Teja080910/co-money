import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { appApi } from '../services/api';
import { appStorage } from '../services/storage';
import type {
  EventRecord,
  OverviewData,
  Promotion,
  QrPayload,
  RewardTransaction,
  SessionUser,
  Shop,
  TransactionPreview,
  WalletSummary,
} from '../types/app';

type SessionContextValue = {
  user: SessionUser | null;
  token: string | null;
  overview: OverviewData | null;
  wallet: WalletSummary | null;
  transactions: RewardTransaction[];
  promotions: Promotion[];
  shops: Shop[];
  events: EventRecord[];
  users: SessionUser[];
  qrPayload: QrPayload | null;
  loading: boolean;
  bootstrapping: boolean;
  login: (payload: { email: string; password: string }) => Promise<void>;
  register: (payload: { fullName: string; email: string; password: string; role: SessionUser['role'] }) => Promise<{
    userId: string;
    email: string;
    verificationCode: string;
  }>;
  verifyEmail: (payload: { userId: string; otp: string }) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  fetchQr: () => Promise<void>;
  previewTransaction: (payload: {
    customerId: string;
    merchantId: string;
    shopId: string;
    totalAmount: number;
    requestedPoints?: number;
  }) => Promise<TransactionPreview>;
  processTransaction: (payload: {
    customerId: string;
    merchantId: string;
    shopId: string;
    totalAmount: number;
    requestedPoints?: number;
  }) => Promise<void>;
  createPromotion: (payload: Omit<Promotion, 'id'>) => Promise<void>;
  createEvent: (payload: Omit<EventRecord, 'id'>) => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | undefined>(undefined);
const STORAGE_KEY = 'co-money-session';

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [wallet, setWallet] = useState<WalletSummary | null>(null);
  const [transactions, setTransactions] = useState<RewardTransaction[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [users, setUsers] = useState<SessionUser[]>([]);
  const [qrPayload, setQrPayload] = useState<QrPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(true);

  const persist = async (nextUser: SessionUser | null, nextToken: string | null) => {
    if (!nextUser || !nextToken) {
      await appStorage.removeItem(STORAGE_KEY);
      return;
    }

    await appStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        user: nextUser,
        token: nextToken,
      }),
    );
  };

  const loadSharedCollections = async () => {
    const [promotionData, shopData, eventData, userData] = await Promise.all([
      appApi.promotions(),
      appApi.shops(),
      appApi.events(),
      appApi.users(),
    ]);
    setPromotions(promotionData);
    setShops(shopData);
    setEvents(eventData);
    setUsers(userData ?? []);
  };

  const refresh = async (explicitUser?: SessionUser | null) => {
    const currentUser = explicitUser ?? user;
    if (!currentUser) {
      return;
    }

    setLoading(true);
    try {
      const [overviewData, walletData, transactionData] = await Promise.all([
        appApi.overview(currentUser.id),
        appApi.wallet(currentUser.id),
        appApi.transactions(currentUser.id),
      ]);

      setOverview(overviewData);
      setWallet(walletData);
      setTransactions(transactionData);
      await loadSharedCollections();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const stored = await appStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as { user: SessionUser; token: string };
          setUser(parsed.user);
          setToken(parsed.token);
          await refresh(parsed.user);
        } else {
          await loadSharedCollections();
        }
      } finally {
        setBootstrapping(false);
      }
    };

    bootstrap();
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({
      user,
      token,
      overview,
      wallet,
      transactions,
      promotions,
      shops,
      events,
      users,
      qrPayload,
      loading,
      bootstrapping,
      login: async payload => {
        setLoading(true);
        try {
          const response = await appApi.login(payload);
          setUser(response.user);
          setToken(response.token);
          await persist(response.user, response.token);
          await refresh(response.user);
        } finally {
          setLoading(false);
        }
      },
      register: async payload => {
        const response = await appApi.register(payload);
        return {
          userId: response.user.id,
          email: response.user.email,
          verificationCode: response.verificationCode,
        };
      },
      verifyEmail: async payload => {
        setLoading(true);
        try {
          const response = await appApi.verifyEmail(payload);
          const nextUser = response.user;
          const nextToken = `verified-${nextUser.id}`;
          setUser(nextUser);
          setToken(nextToken);
          await persist(nextUser, nextToken);
          await refresh(nextUser);
        } finally {
          setLoading(false);
        }
      },
      logout: async () => {
        setUser(null);
        setToken(null);
        setOverview(null);
        setWallet(null);
        setTransactions([]);
        setQrPayload(null);
        await persist(null, null);
        await loadSharedCollections();
      },
      refresh: async () => {
        await refresh();
      },
      fetchQr: async () => {
        if (!user) {
          return;
        }
        const data = await appApi.qr(user.id);
        setQrPayload(data);
      },
      previewTransaction: async payload => appApi.previewTransaction(payload),
      processTransaction: async payload => {
        setLoading(true);
        try {
          const response = await appApi.processTransaction(payload);
          setWallet(response.wallet);
          setTransactions(current => [response.transaction, ...current]);
          await refresh();
        } finally {
          setLoading(false);
        }
      },
      createPromotion: async payload => {
        await appApi.createPromotion(payload);
        await refresh();
      },
      createEvent: async payload => {
        await appApi.createEvent(payload);
        await refresh();
      },
    }),
    [bootstrapping, events, loading, overview, promotions, qrPayload, shops, token, transactions, user, users, wallet],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used inside SessionProvider');
  }
  return context;
}
