import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserRole } from '../constants/userRoles';
import { apiClient } from './api';
import {
  AUTH_TOKEN_KEY,
  AUTH_USER_KEY,
  getSecureSessionItem,
  removeSecureSessionItems,
  setSecureSessionItem,
  setSecureSessionItems,
} from './secureSessionStorage';

const PENDING_VERIFICATION_EMAIL_KEY = 'pending-verification-email';

export type AuthUser = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  username: string;
  email: string;
  role: UserRole;
  emailVerified: boolean;
};

export type AuthSession = {
  accessToken: string;
  expiresInSeconds: number;
  tokenType: 'Bearer';
  user: AuthUser;
};

type RegisterPayload = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

type RegisterResponse = {
  message: string;
  email: string;
  emailVerified: boolean;
  debugOtp?: string;
};

type VerifyOtpPayload = {
  email: string;
  otp: string;
};

type VerifyOtpResponse = {
  message: string;
  email: string;
  emailVerified: boolean;
  debugOtp?: string;
};

type LoginPayload = {
  identifier: string;
  password: string;
};

type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

type LoginResponse = {
  message: string;
  accessToken: string;
  tokenType: 'Bearer';
  expiresInSeconds: number;
  user: AuthUser;
};

export async function registerUser(payload: RegisterPayload) {
  const response = await apiClient.post<RegisterResponse>('/auth/registrazione', payload);
  console.log('Registration response:', response.data);
  return response.data;
}

export async function verifyRegistrationOtp(payload: VerifyOtpPayload) {
  const response = await apiClient.post<VerifyOtpResponse>('/auth/verifica-otp', payload);
  return response.data;
}

export async function resendRegistrationOtp(email: string) {
  const response = await apiClient.post<VerifyOtpResponse>('/auth/reinvia-otp', { email });
  return response.data;
}

export async function loginUser(payload: LoginPayload) {
  const response = await apiClient.post<LoginResponse>('/auth/login', payload);
  await saveAuthenticatedSession({
    accessToken: response.data.accessToken,
    expiresInSeconds: response.data.expiresInSeconds,
    tokenType: response.data.tokenType,
    user: response.data.user,
  });
  return response.data;
}

export async function changePassword(payload: ChangePasswordPayload) {
  const response = await apiClient.post<{ message: string }>('/auth/change-password', payload);
  return response.data;
}

export async function fetchAuthenticatedProfile() {
  const response = await apiClient.get<AuthUser>('/auth/profilo');
  await saveAuthenticatedUser(response.data);
  return response.data;
}

export async function logoutUser() {
  try {
    await apiClient.post('/auth/logout');
  } finally {
    await clearAuthenticatedUser();
  }
}

export async function savePendingVerificationEmail(email: string) {
  await AsyncStorage.setItem(PENDING_VERIFICATION_EMAIL_KEY, email.trim().toLowerCase());
}

export async function getPendingVerificationEmail() {
  const email = await AsyncStorage.getItem(PENDING_VERIFICATION_EMAIL_KEY);
  return email?.trim().toLowerCase() || null;
}

export async function clearPendingVerificationEmail() {
  await AsyncStorage.removeItem(PENDING_VERIFICATION_EMAIL_KEY);
}

export async function saveAuthenticatedSession(session: AuthSession) {
  await setSecureSessionItems([
    [AUTH_USER_KEY, JSON.stringify(session.user)],
    [AUTH_TOKEN_KEY, session.accessToken],
  ]);
}

export async function saveAuthenticatedUser(user: AuthUser) {
  await setSecureSessionItem(AUTH_USER_KEY, JSON.stringify(user));
}

export async function getAuthenticatedUser() {
  const serializedUser = await getSecureSessionItem(AUTH_USER_KEY);
  if (!serializedUser) {
    return null;
  }

  try {
    return JSON.parse(serializedUser) as AuthUser;
  } catch {
    await removeSecureSessionItems([AUTH_USER_KEY]);
    return null;
  }
}

export async function clearAuthenticatedUser() {
  await removeSecureSessionItems([AUTH_USER_KEY, AUTH_TOKEN_KEY]);
}

export async function getAuthenticatedToken() {
  return getSecureSessionItem(AUTH_TOKEN_KEY);
}
