import { MD3DarkTheme, MD3LightTheme, type MD3Theme } from 'react-native-paper';

const lightColors = {
  brand: '#2F6BFF',
  brandStrong: '#1D4ED8',
  accent: '#34D399',
  background: '#F4F7FB',
  surface: 'rgba(255,255,255,0.82)',
  surfaceStrong: '#FFFFFF',
  border: 'rgba(148, 163, 184, 0.22)',
  input: 'rgba(255,255,255,0.92)',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  error: '#E11D48',
  success: '#16A34A',
  shadow: 'rgba(15, 23, 42, 0.12)',
};

const darkColors = {
  brand: '#7AA2FF',
  brandStrong: '#A5BFFF',
  accent: '#6EE7B7',
  background: '#07111F',
  surface: 'rgba(15,23,42,0.72)',
  surfaceStrong: '#0F172A',
  border: 'rgba(148, 163, 184, 0.18)',
  input: 'rgba(15,23,42,0.9)',
  textPrimary: '#E2E8F0',
  textSecondary: '#94A3B8',
  error: '#FB7185',
  success: '#4ADE80',
  shadow: 'rgba(2, 6, 23, 0.4)',
};

export type AppTheme = MD3Theme & {
  custom: typeof lightColors;
};

export const getTheme = (isDark: boolean): AppTheme => {
  const baseTheme = isDark ? MD3DarkTheme : MD3LightTheme;
  const palette = isDark ? darkColors : lightColors;

  return {
    ...baseTheme,
    roundness: 24,
    colors: {
      ...baseTheme.colors,
      primary: palette.brand,
      secondary: palette.accent,
      error: palette.error,
      background: palette.background,
      surface: palette.surfaceStrong,
      onBackground: palette.textPrimary,
      onSurface: palette.textPrimary,
      outline: palette.border,
    },
    custom: palette,
  };
};
