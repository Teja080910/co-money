import axios from 'axios';
import type {
  EventRecord,
  LoginResponse,
  OverviewData,
  Promotion,
  QrPayload,
  RegisterResponse,
  RewardTransaction,
  Shop,
  TransactionPreview,
  UserRole,
  WalletSummary,
} from '../types/app';

const apiBaseUrl = process.env.EXPO_PUBLIC_API_URL;

const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 8000,
});

function isNetworkError(error: unknown) {
  return axios.isAxiosError(error) && !error.response;
}

function normalizeError(error: unknown): Error {
  if (axios.isAxiosError(error)) {
    const message =
      (typeof error.response?.data?.error === 'string' && error.response.data.error) ||
      error.message ||
      'Unexpected API error.';

    if (!error.response) {
      return new Error(
        `Backend not reachable at ${apiBaseUrl ?? 'EXPO_PUBLIC_API_URL is not set'}. Set EXPO_PUBLIC_API_URL in your env and try again.`,
      );
    }

    return new Error(message);
  }

  return error instanceof Error ? error : new Error('Unexpected API error.');
}

async function request<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (error) {
    throw normalizeError(error);
  }
}

export const appApi = {
  register: async (payload: { fullName: string; email: string; password: string; role: UserRole }) => {
    return request(async () => {
      const response = await api.post<RegisterResponse>('/api/auth/register', payload);
      return response.data;
    });
  },
  verifyEmail: async (payload: { userId: string; otp: string }) => {
    return request(async () => {
      const response = await api.post<{ user: RegisterResponse['user'] }>('/api/auth/verify-email', payload);
      return response.data;
    });
  },
  login: async (payload: { email: string; password: string }) => {
    return request(async () => {
      const response = await api.post<LoginResponse>('/api/auth/login', payload);
      return response.data;
    });
  },
  overview: async (userId: string) => {
    return request(async () => {
      const response = await api.get<OverviewData>(`/api/app/overview/${userId}`);
      return response.data;
    });
  },
  wallet: async (userId: string) => {
    return request(async () => {
      const response = await api.get<WalletSummary>(`/api/app/wallet/${userId}`);
      return response.data;
    });
  },
  transactions: async (userId: string) => {
    return request(async () => {
      const response = await api.get<RewardTransaction[]>(`/api/app/transactions/${userId}`);
      return response.data;
    });
  },
  promotions: async () => {
    return request(async () => {
      const response = await api.get<Promotion[]>('/api/app/promotions');
      return response.data;
    });
  },
  shops: async () => {
    return request(async () => {
      const response = await api.get<Shop[]>('/api/app/shops');
      return response.data;
    });
  },
  events: async () => {
    return request(async () => {
      const response = await api.get<EventRecord[]>('/api/app/events');
      return response.data;
    });
  },
  users: async () => {
    return request(async () => {
      const response = await api.get<OverviewData['users']>('/api/app/users');
      return response.data ?? [];
    });
  },
  qr: async (userId: string) => {
    return request(async () => {
      const response = await api.get<QrPayload>(`/api/app/qr/${userId}`);
      return response.data;
    });
  },
  previewTransaction: async (payload: {
    customerId: string;
    merchantId: string;
    shopId: string;
    totalAmount: number;
    requestedPoints?: number;
  }) => {
    return request(async () => {
      const response = await api.post<TransactionPreview>('/api/app/transactions/preview', payload);
      return response.data;
    });
  },
  processTransaction: async (payload: {
    customerId: string;
    merchantId: string;
    shopId: string;
    totalAmount: number;
    requestedPoints?: number;
  }) => {
    return request(async () => {
      const response = await api.post<{
        transaction: RewardTransaction;
        wallet: WalletSummary;
        preview: TransactionPreview;
      }>('/api/app/transactions', payload);
      return response.data;
    });
  },
  createPromotion: async (payload: Omit<Promotion, 'id'>) => {
    return request(async () => {
      const response = await api.post<Promotion>('/api/app/promotions', payload);
      return response.data;
    });
  },
  createEvent: async (payload: Omit<EventRecord, 'id'>) => {
    return request(async () => {
      const response = await api.post<EventRecord>('/api/app/events', payload);
      return response.data;
    });
  },
};
