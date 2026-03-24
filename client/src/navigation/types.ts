import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  VerifyEmail: { email: string };
  RegistrationSuccess: undefined;
  Home: { selectedCustomerId?: string } | undefined;
  CustomerQr: undefined;
  MerchantScan: undefined;
};

export type AppTabRoute = {
  key: string;
  title: string;
  focusedIcon: string;
  unfocusedIcon: string;
};

export type HomeTabParamList = {
  home: undefined;
  dashboard: undefined;
  wallet: undefined;
  reports: undefined;
  'user-management': undefined;
  'shop-management': undefined;
  'category-settings': undefined;
  configuration: undefined;
  promotions: undefined;
  events: undefined;
  transactions: undefined;
  customers: undefined;
  'add-points': undefined;
  merchants: undefined;
  representatives: undefined;
  profile: undefined;
};

export type ScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;
