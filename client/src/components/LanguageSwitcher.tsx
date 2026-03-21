import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'react-native-paper';
import { LANGUAGE_STORAGE_KEY } from '../i18n';
import type { AppTheme } from '../theme/theme';

type Props = {
  tone?: 'default' | 'light';
};

export function LanguageSwitcher({ tone = 'default' }: Props) {
  const theme = useTheme<AppTheme>();
  const { i18n, t } = useTranslation();
  const activeLanguage = i18n.resolvedLanguage === 'en' ? 'en' : 'it';
  const isLight = tone === 'light';

  const changeLanguage = async (language: 'it' | 'en') => {
    if (language === activeLanguage) {
      return;
    }

    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    await i18n.changeLanguage(language);
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isLight ? 'rgba(12, 18, 24, 0.28)' : theme.custom.surfaceStrong,
          borderColor: isLight ? 'rgba(255,255,255,0.32)' : theme.custom.border,
        },
      ]}
    >
      {([
        { code: 'it', label: 'IT', accessibilityLabel: t('language.italian') },
        { code: 'en', label: 'EN', accessibilityLabel: t('language.english') },
      ] as const).map(option => {
        const selected = activeLanguage === option.code;

        return (
          <Pressable
            key={option.code}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={option.accessibilityLabel}
            onPress={() => changeLanguage(option.code)}
            style={[
              styles.option,
              {
                backgroundColor: selected
                  ? isLight
                    ? 'rgba(255,255,255,0.18)'
                    : theme.custom.brand
                  : 'transparent',
              },
            ]}
          >
            <Text
              style={[
                styles.optionLabel,
                {
                  color: selected
                    ? '#FFFFFF'
                    : isLight
                      ? 'rgba(255,255,255,0.92)'
                      : theme.custom.textSecondary,
                },
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignSelf: 'flex-end',
    borderRadius: 999,
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  option: {
    minWidth: 44,
    minHeight: 34,
    paddingHorizontal: 12,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
});
