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

export type ScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;
