import { MD3LightTheme as DefaultTheme } from 'react-native-paper';

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#6200EE', // Custom stunning purple primary
    accent: '#03DAC6',
    background: '#F6F6F6',
    surface: '#FFFFFF',
    text: '#333333',
    error: '#B00020',
  },
  roundness: 12, // More rounded corners for modern stylish look
};
