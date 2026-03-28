import AsyncStorage from '@react-native-async-storage/async-storage';

export const AUTH_USER_KEY = 'auth-user';
export const AUTH_TOKEN_KEY = 'auth-token';

export async function getSecureSessionItem(key: string) {
  return AsyncStorage.getItem(key);
}

export async function setSecureSessionItem(key: string, value: string) {
  await AsyncStorage.setItem(key, value);
}

export async function setSecureSessionItems(entries: Array<[string, string]>) {
  await Promise.all(entries.map(([key, value]) => setSecureSessionItem(key, value)));
}

export async function removeSecureSessionItems(keys: string[]) {
  await Promise.all(keys.map(async key => {
    await AsyncStorage.removeItem(key);
  }));
}
