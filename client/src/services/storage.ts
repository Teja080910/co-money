import { Platform } from 'react-native';

type AsyncStorageModule = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};

const memoryStorage = new Map<string, string>();

function getWebStorage() {
  if (Platform.OS !== 'web') {
    return null;
  }

  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
}

function loadNativeStorage(): AsyncStorageModule | null {
  try {
    const module = require('@react-native-async-storage/async-storage');
    return module?.default ?? module ?? null;
  } catch {
    return null;
  }
}

const nativeStorage = loadNativeStorage();

async function getItem(key: string) {
  if (nativeStorage?.getItem) {
    try {
      return await nativeStorage.getItem(key);
    } catch {
      // Fall back when the native module is unavailable at runtime.
    }
  }

  const webStorage = getWebStorage();
  if (webStorage) {
    return webStorage.getItem(key);
  }

  return memoryStorage.get(key) ?? null;
}

async function setItem(key: string, value: string) {
  if (nativeStorage?.setItem) {
    try {
      await nativeStorage.setItem(key, value);
      return;
    } catch {
      // Fall back when the native module is unavailable at runtime.
    }
  }

  const webStorage = getWebStorage();
  if (webStorage) {
    webStorage.setItem(key, value);
    return;
  }

  memoryStorage.set(key, value);
}

async function removeItem(key: string) {
  if (nativeStorage?.removeItem) {
    try {
      await nativeStorage.removeItem(key);
      return;
    } catch {
      // Fall back when the native module is unavailable at runtime.
    }
  }

  const webStorage = getWebStorage();
  if (webStorage) {
    webStorage.removeItem(key);
    return;
  }

  memoryStorage.delete(key);
}

export const appStorage = {
  getItem,
  setItem,
  removeItem,
};
