import React, { useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { HelperText, Snackbar, useTheme } from 'react-native-paper';
import { AuthScreenShell } from '../components/auth/AuthScreenShell';
import { FloatingLabelInput } from '../components/auth/FloatingLabelInput';
import { PrimaryButton } from '../components/auth/PrimaryButton';
import { useSession } from '../context/SessionContext';
import { ScreenProps } from '../navigation/types';
import type { AppTheme } from '../theme/theme';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginScreen({ navigation }: ScreenProps<'Login'>) {
  const theme = useTheme<AppTheme>();
  const { login, loading } = useSession();
  const passwordRef = useRef<TextInput>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const valid = useMemo(
    () => ({
      email: emailRegex.test(email.trim()),
      password: password.length >= 8,
    }),
    [email, password],
  );

  const handleLogin = async () => {
    try {
      setError('');
      await login({ email, password });
      navigation.replace('Home');
    } catch (requestError) {
      setError((requestError as Error).message || 'Unable to sign in right now.');
    }
  };

  return (
    <AuthScreenShell
      badge={
        <View style={[styles.badge, { backgroundColor: theme.custom.surfaceStrong, borderColor: theme.custom.border }]}>
          <MaterialCommunityIcons name="storefront-outline" size={18} color={theme.custom.brand} />
          <Text style={[styles.badgeText, { color: theme.custom.textPrimary }]}>Shared rewards network</Text>
        </View>
      }
      centerHeader
      footer={
        <View style={styles.footerRow}>
          <Text style={[styles.footerText, { color: theme.custom.textSecondary }]}>Need a new account?</Text>
          <Text style={[styles.footerLink, { color: theme.custom.brand }]} onPress={() => navigation.navigate('Register')}>
            Register
          </Text>
        </View>
      }
      subtitle="Sign in as a customer, merchant, representative, or admin."
      title="Co-Money"
    >
      <View style={styles.form}>
        <FloatingLabelInput
          accessibleLabel="Email address"
          autoComplete="email"
          icon="email-outline"
          keyboardType="email-address"
          label="Email address"
          onChangeText={setEmail}
          onSubmitEditing={() => passwordRef.current?.focus()}
          returnKeyType="next"
          valid={valid.email}
          value={email}
        />
        <FloatingLabelInput
          accessibleLabel="Password"
          autoComplete="password"
          icon="lock-outline"
          inputRef={passwordRef}
          label="Password"
          onChangeText={setPassword}
          onSubmitEditing={handleLogin}
          onToggleSecureEntry={() => setShowPassword(value => !value)}
          returnKeyType="done"
          secureTextEntry={!showPassword}
          textContentType="password"
          valid={valid.password}
          value={password}
        />
        {process.env.EXPO_PUBLIC_ENVIRONMENT === 'DEVELOPMENT' &&
        <View style={styles.demoCard}>
          <Text style={[styles.demoTitle, { color: theme.custom.textPrimary }]}>Demo accounts</Text>
          <Text style={[styles.demoText, { color: theme.custom.textSecondary }]}>customer@sottocasa.app</Text>
          <Text style={[styles.demoText, { color: theme.custom.textSecondary }]}>merchant@sottocasa.app</Text>
          <Text style={[styles.demoText, { color: theme.custom.textSecondary }]}>rep@sottocasa.app</Text>
          <Text style={[styles.demoText, { color: theme.custom.textSecondary }]}>admin@sottocasa.app</Text>
          <HelperText type="info" visible style={{ paddingHorizontal: 0 }}>
            Password for each demo account: password123
          </HelperText>
        </View>}

        <PrimaryButton disabled={!valid.email || !valid.password} label="Login" loading={loading} onPress={handleLogin} />
      </View>

      <Snackbar onDismiss={() => setError('')} visible={Boolean(error)}>
        {error}
      </Snackbar>
    </AuthScreenShell>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  form: {
    gap: 4,
  },
  demoCard: {
    borderRadius: 20,
    padding: 16,
    backgroundColor: 'rgba(148, 163, 184, 0.08)',
    marginBottom: 18,
  },
  demoTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 8,
  },
  demoText: {
    fontSize: 13,
    lineHeight: 20,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 14,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '800',
  },
});
