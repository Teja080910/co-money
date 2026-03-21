import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  VerifyEmail: { email: string; userId: string; verificationCode: string };
  RegistrationSuccess: undefined;
  Home: undefined;
  Wallet: undefined;
  Transactions: undefined;
  Promotions: undefined;
  Shops: undefined;
  QR: undefined;
  MerchantTransactions: undefined;
  AdminUsers: undefined;
  AdminEvents: undefined;
  AdminReports: undefined;
};

export type ScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;
