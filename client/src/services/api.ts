import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import i18n from '../i18n';

const AUTH_USER_KEY = 'auth-user';
const AUTH_TOKEN_KEY = 'auth-token';

const fallbackApiUrl =
  Platform.OS === 'android' ? 'http://10.0.2.2:5008' : 'http://127.0.0.1:5008';

function resolveApiUrl() {
  const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

  if (!configuredApiUrl) {
    return fallbackApiUrl;
  }

  if (Platform.OS !== 'android') {
    return configuredApiUrl;
  }

  return configuredApiUrl
    .replace('://127.0.0.1', '://10.0.2.2')
    .replace('://localhost', '://10.0.2.2');
}

export const apiClient = axios.create({
  baseURL: 'https://modern-fawn-immensely.ngrok-free.app',
  timeout: 10000,
});

apiClient.interceptors.request.use(config => {
  config.headers.set?.('Accept-Language', i18n.resolvedLanguage === 'en' ? 'en' : 'it');
  return config;
});

apiClient.interceptors.request.use(async config => {
  const accessToken = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  const serializedUser = await AsyncStorage.getItem(AUTH_USER_KEY);
  const authenticatedUser = serializedUser ? (JSON.parse(serializedUser) as { id: string; email: string }) : null;

  if (accessToken) {
    config.headers.set?.('Authorization', `Bearer ${accessToken}`);
  }

  if (authenticatedUser) {
    config.headers.set?.('x-user-id', authenticatedUser.id);
    config.headers.set?.('x-user-email', authenticatedUser.email);
  }

  return config;
});

const API_ERROR_KEY_BY_MESSAGE: Record<string, string> = {
  'Inserisci il tuo nome.': 'apiErrors.firstNameRequired',
  'Inserisci il tuo cognome.': 'apiErrors.lastNameRequired',
  'Inserisci la tua email.': 'apiErrors.emailRequired',
  'Email richiesta.': 'apiErrors.emailRequiredGeneric',
  'Inserisci una email valida.': 'apiErrors.emailInvalid',
  'Inserisci una password.': 'apiErrors.passwordRequired',
  'Password richiesta.': 'apiErrors.passwordRequiredShort',
  'La password deve essere di almeno 8 caratteri.': 'apiErrors.passwordShort',
  'Email gia registrata.': 'apiErrors.emailAlreadyRegistered',
  'Inserisci il codice OTP.': 'apiErrors.otpRequired',
  'Utente non trovato.': 'apiErrors.userNotFound',
  'Email gia verificata.': 'apiErrors.emailAlreadyVerified',
  'Codice OTP non disponibile.': 'apiErrors.otpUnavailable',
  'OTP non valido.': 'apiErrors.invalidOtp',
  'Codice OTP reinviato alla tua email.': 'apiErrors.otpResent',
  'Inserisci nome utente.': 'apiErrors.usernameRequired',
  'Inserisci nome utente o email.': 'apiErrors.identifierRequired',
  'Credenziali non valide.': 'apiErrors.invalidCredentials',
  'Verifica prima la tua email.': 'apiErrors.verifyEmailFirst',
  "Impossibile inviare l'email di verifica in questo momento.": 'apiErrors.verificationEmailFailed',
};

export function getApiResponseError(error: unknown): string | undefined {
  if (axios.isAxiosError(error)) {
    const responseMessage = error.response?.data?.error;
    if (typeof responseMessage === 'string' && responseMessage.trim()) {
      return responseMessage.trim();
    }
  }

  return undefined;
}

export function getApiErrorMessage(error: unknown, fallbackMessage: string): string {
  const responseMessage = getApiResponseError(error);

  if (responseMessage) {
    const translationKey = API_ERROR_KEY_BY_MESSAGE[responseMessage];
    return translationKey ? i18n.t(translationKey) : responseMessage;
  }

  return fallbackMessage;
}
