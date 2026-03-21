import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { appStorage } from './services/storage';

import en from './locales/en.json';
import it from './locales/it.json';

const resources = {
  en: { translation: en },
  it: { translation: it },
};

const LANGUAGE_DETECTOR = {
  type: 'languageDetector',
  async: true,
  detect: (callback: (lang: string) => void) => {
    appStorage
      .getItem('user-language')
      .then(language => {
        if (language) {
          return callback(language);
        }
        callback('en');
      })
      .catch(() => {
        callback('en');
      });
  },
  init: () => {},
  cacheUserLanguage: (language: string) => {
    void appStorage.setItem('user-language', language);
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
