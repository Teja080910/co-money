import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './locales/en.json';
import it from './locales/it.json';

const resources = {
  en: { translation: en },
  it: { translation: it },
};

export const LANGUAGE_STORAGE_KEY = 'user-language';

const LANGUAGE_DETECTOR = {
  type: 'languageDetector',
  async: true,
  detect: (callback: (lang: string) => void) => {
    AsyncStorage.getItem(LANGUAGE_STORAGE_KEY)
      .then(language => {
        if (language === 'en' || language === 'it') {
          return callback(language);
        }
        callback('it');
      })
      .catch(() => {
        callback('it');
      });
  },
  init: () => {},
  cacheUserLanguage: (language: string) => {
    AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  },
};

i18n
  .use(LANGUAGE_DETECTOR as any)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'it',
    supportedLngs: ['it', 'en'],
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
