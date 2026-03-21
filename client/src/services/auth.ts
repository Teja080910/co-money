import { apiClient } from './api';

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

type LoginResponse = {
  message: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    emailVerified: boolean;
  };
};

export async function registerUser(payload: RegisterPayload) {
  const response = await apiClient.post<RegisterResponse>('/auth/registrazione', payload);
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
  return response.data;
}
