import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

export const AUTH_USER_KEY = 'auth-user';
export const AUTH_TOKEN_KEY = 'auth-token';

const secureStorageAvailability = SecureStore.isAvailableAsync().catch(() => false);

async function isSecureStorageAvailable() {
  return secureStorageAvailability;
}

export async function getSecureSessionItem(key: string) {
  const secureStorageEnabled = await isSecureStorageAvailable();

  if (secureStorageEnabled) {
    const secureValue = await SecureStore.getItemAsync(key);
    if (secureValue !== null) {
      return secureValue;
    }
  }

  const legacyValue = await AsyncStorage.getItem(key);
  if (legacyValue === null || !secureStorageEnabled) {
    return legacyValue;
  }

  await SecureStore.setItemAsync(key, legacyValue);
  await AsyncStorage.removeItem(key);
  return legacyValue;
}

export async function setSecureSessionItem(key: string, value: string) {
  if (await isSecureStorageAvailable()) {
    await SecureStore.setItemAsync(key, value);
    await AsyncStorage.removeItem(key);
    return;
  }

  await AsyncStorage.setItem(key, value);
}

export async function setSecureSessionItems(entries: Array<[string, string]>) {
  await Promise.all(entries.map(([key, value]) => setSecureSessionItem(key, value)));
}

export async function removeSecureSessionItems(keys: string[]) {
  const secureStorageEnabled = await isSecureStorageAvailable();

  await Promise.all(keys.map(async key => {
    await AsyncStorage.removeItem(key);
    if (secureStorageEnabled) {
      await SecureStore.deleteItemAsync(key);
    }
  }));
}
