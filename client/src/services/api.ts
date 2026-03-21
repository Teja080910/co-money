import axios from 'axios';
import { Platform } from 'react-native';

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
  baseURL: resolveApiUrl(),
  timeout: 10000,
});

export function getApiErrorMessage(error: unknown, fallbackMessage: string): string {
  if (axios.isAxiosError(error)) {
    const responseMessage = error.response?.data?.error;
    if (typeof responseMessage === 'string' && responseMessage.trim()) {
      return responseMessage;
    }
  }

  return fallbackMessage;
}
