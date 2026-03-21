import React from 'react';
import './src/i18n';
import { NavigationContainer, DefaultTheme as NavigationLightTheme, DarkTheme as NavigationDarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useColorScheme } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { HomeScreen } from './src/screens/HomeScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';
import { RegistrationSuccessScreen } from './src/screens/RegistrationSuccessScreen';
import { VerifyEmailScreen } from './src/screens/VerifyEmailScreen';
import { CustomerQrScreen } from './src/screens/CustomerQrScreen';
import { MerchantScanScreen } from './src/screens/MerchantScanScreen';
import { RootStackParamList } from './src/navigation/types';
import { getTheme } from './src/theme/theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const paperTheme = getTheme(isDark);
  const navigationTheme = isDark ? NavigationDarkTheme : NavigationLightTheme;

  return (
    <SafeAreaProvider>
      <PaperProvider theme={paperTheme}>
        <NavigationContainer
          theme={{
            ...navigationTheme,
            colors: {
              ...navigationTheme.colors,
              background: paperTheme.custom.background,
              card: paperTheme.custom.surfaceStrong,
              text: paperTheme.custom.textPrimary,
              border: paperTheme.custom.border,
              primary: paperTheme.custom.brand,
            },
          }}
        >
          <Stack.Navigator initialRouteName="Register" screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
            <Stack.Screen name="RegistrationSuccess" component={RegistrationSuccessScreen} />
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="CustomerQr" component={CustomerQrScreen} />
            <Stack.Screen name="MerchantScan" component={MerchantScanScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
