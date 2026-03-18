import React, { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';
import { AuthScreenShell } from '../components/auth/AuthScreenShell';
import { FloatingLabelInput } from '../components/auth/FloatingLabelInput';
import { PrimaryButton } from '../components/auth/PrimaryButton';
import { ScreenProps } from '../navigation/types';
import type { AppTheme } from '../theme/theme';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginScreen({ navigation }: ScreenProps<'Login'>) {
  const theme = useTheme<AppTheme>();
  const passwordRef = useRef<TextInput>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({
    email: false,
    password: false,
  });

  const errors = useMemo(() => {
    const nextErrors: { email?: string; password?: string } = {};

    if (touched.email) {
      if (!email.trim()) {
        nextErrors.email = 'Enter your email address.';
      } else if (!emailRegex.test(email.trim())) {
        nextErrors.email = 'Use the email format linked to your account.';
      }
    }

    if (touched.password) {
      if (!password) {
        nextErrors.password = 'Enter your password.';
      } else if (password.length < 8) {
        nextErrors.password = 'Your password should be at least 8 characters.';
      }
    }

    return nextErrors;
  }, [email, password, touched.email, touched.password]);

  const validity = {
    email: emailRegex.test(email.trim()),
    password: password.length >= 8,
  };

  const isValid = validity.email && validity.password;

  const markAllTouched = () => {
    setTouched({
      email: true,
      password: true,
    });
  };

  const handleLogin = async () => {
    if (!isValid) {
      markAllTouched();
      return;
    }

    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
    navigation.replace('Home');
  };

  return (
    <AuthScreenShell
      badge={
        <View style={[styles.badge, { backgroundColor: theme.custom.surfaceStrong, borderColor: theme.custom.border }]}>
          <MaterialCommunityIcons name="star-four-points-outline" size={18} color={theme.custom.brand} />
          <Text style={[styles.badgeText, { color: theme.custom.textPrimary }]}>Welcome back</Text>
        </View>
      }
      footer={
        <View style={styles.footerRow}>
          <Text style={[styles.footerText, { color: theme.custom.textSecondary }]}>New here?</Text>
          <Text style={[styles.footerLink, { color: theme.custom.brand }]} onPress={() => navigation.navigate('Register')}>
            Create account
          </Text>
        </View>
      }
      subtitle="Sign in to continue with your workspace"
      title="Welcome back"
    >
      <View style={styles.form}>
        <FloatingLabelInput
          accessibleLabel="Email address"
          autoComplete="email"
          error={errors.email}
          helperText={!errors.email ? 'Use the email you registered with.' : undefined}
          icon="email-outline"
          keyboardType="email-address"
          label="Email address"
          onChangeText={text => {
            setEmail(text.trim().toLowerCase());
            setTouched(current => ({ ...current, email: true }));
          }}
          onSubmitEditing={() => passwordRef.current?.focus()}
          returnKeyType="next"
          valid={validity.email}
          value={email}
        />
        <FloatingLabelInput
          accessibleLabel="Password"
          autoComplete="password"
          error={errors.password}
          helperText={!errors.password ? 'Your password stays encrypted end to end.' : undefined}
          icon="lock-outline"
          inputRef={passwordRef}
          label="Password"
          onChangeText={text => {
            setPassword(text);
            setTouched(current => ({ ...current, password: true }));
          }}
          onSubmitEditing={handleLogin}
          onToggleSecureEntry={() => setShowPassword(!showPassword)}
          returnKeyType="done"
          secureTextEntry={!showPassword}
          textContentType="password"
          valid={validity.password}
          value={password}
        />

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="shield-lock-outline" size={16} color={theme.custom.brand} />
            <Text style={[styles.metaText, { color: theme.custom.textSecondary }]}>Fast and secure sign in</Text>
          </View>
          {loading ? <ActivityIndicator color={theme.custom.brand} size="small" /> : null}
        </View>

        <PrimaryButton disabled={!isValid} label="Login" loading={loading} onPress={handleLogin} />
      </View>
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
    width: '100%',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 18,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '500',
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
