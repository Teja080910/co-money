import React from 'react';
import './src/i18n';
import { NavigationContainer, DefaultTheme as NavigationLightTheme, DarkTheme as NavigationDarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View, useColorScheme } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SessionProvider, useSession } from './src/context/SessionContext';
import { HomeScreen } from './src/screens/HomeScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';
import { RegistrationSuccessScreen } from './src/screens/RegistrationSuccessScreen';
import { VerifyEmailScreen } from './src/screens/VerifyEmailScreen';
import { WalletScreen } from './src/screens/WalletScreen';
import { TransactionsScreen } from './src/screens/TransactionsScreen';
import { PromotionsScreen } from './src/screens/PromotionsScreen';
import { ShopsScreen } from './src/screens/ShopsScreen';
import { QRScreen } from './src/screens/QRScreen';
import { MerchantTransactionsScreen } from './src/screens/MerchantTransactionsScreen';
import { AdminUsersScreen } from './src/screens/AdminUsersScreen';
import { AdminEventsScreen } from './src/screens/AdminEventsScreen';
import { AdminReportsScreen } from './src/screens/AdminReportsScreen';
import { RootStackParamList } from './src/navigation/types';
import { getTheme } from './src/theme/theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

function AppNavigator() {
  const { bootstrapping, user } = useSession();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const paperTheme = getTheme(isDark);
  const navigationTheme = isDark ? NavigationDarkTheme : NavigationLightTheme;

  if (bootstrapping) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: paperTheme.custom.background }}>
        <ActivityIndicator color={paperTheme.custom.brand} size="large" />
      </View>
    );
  }

  return (
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
      <Stack.Navigator initialRouteName={user ? 'Home' : 'Login'} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
        <Stack.Screen name="RegistrationSuccess" component={RegistrationSuccessScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Wallet" component={WalletScreen} />
        <Stack.Screen name="Transactions" component={TransactionsScreen} />
        <Stack.Screen name="Promotions" component={PromotionsScreen} />
        <Stack.Screen name="Shops" component={ShopsScreen} />
        <Stack.Screen name="QR" component={QRScreen} />
        <Stack.Screen name="MerchantTransactions" component={MerchantTransactionsScreen} />
        <Stack.Screen name="AdminUsers" component={AdminUsersScreen} />
        <Stack.Screen name="AdminEvents" component={AdminEventsScreen} />
        <Stack.Screen name="AdminReports" component={AdminReportsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const paperTheme = getTheme(isDark);

  return (
    <SafeAreaProvider>
      <PaperProvider theme={paperTheme}>
        <SessionProvider>
          <AppNavigator />
        </SessionProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
