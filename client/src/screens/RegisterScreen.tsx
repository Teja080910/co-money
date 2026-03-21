import React, { useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Chip, Snackbar, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AuthScreenShell } from '../components/auth/AuthScreenShell';
import { FloatingLabelInput } from '../components/auth/FloatingLabelInput';
import { PrimaryButton } from '../components/auth/PrimaryButton';
import { useSession } from '../context/SessionContext';
import { ScreenProps } from '../navigation/types';
import type { AppTheme } from '../theme/theme';
import type { UserRole } from '../types/app';

const roles: Array<{ value: UserRole; label: string }> = [
  { value: 'customer', label: 'Customer' },
  { value: 'merchant', label: 'Merchant' },
  { value: 'representative', label: 'Representative' },
  { value: 'admin', label: 'Admin' },
];

export function RegisterScreen({ navigation }: ScreenProps<'Register'>) {
  const theme = useTheme<AppTheme>();
  const { register, loading } = useSession();
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('customer');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');

  const valid = useMemo(
    () => ({
      fullName: fullName.trim().length >= 2,
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()),
      password: password.length >= 8,
      confirmPassword: confirmPassword.length > 0 && confirmPassword === password,
    }),
    [confirmPassword, email, fullName, password],
  );

  const handleRegister = async () => {
    try {
      setError('');
      const response = await register({ fullName, email, password, role });
      navigation.navigate('VerifyEmail', response);
    } catch (requestError) {
      setError((requestError as Error).message || 'Unable to create the account.');
    }
  };

  return (
    <AuthScreenShell
      badge={
        <View style={[styles.badge, { backgroundColor: theme.custom.surfaceStrong, borderColor: theme.custom.border }]}>
          <MaterialCommunityIcons name="account-group-outline" size={18} color={theme.custom.brand} />
          <Text style={[styles.badgeText, { color: theme.custom.textPrimary }]}>Role-based onboarding</Text>
        </View>
      }
      centerHeader
      footer={
        <View style={styles.footerRow}>
          <Text style={[styles.footerText, { color: theme.custom.textSecondary }]}>Already registered?</Text>
          <Text style={[styles.footerLink, { color: theme.custom.brand }]} onPress={() => navigation.navigate('Login')}>
            Login
          </Text>
        </View>
      }
      subtitle="Create the role you want to demo inside the local network."
      title="Create account"
    >
      <View style={styles.form}>
        <FloatingLabelInput
          accessibleLabel="Full name"
          autoCapitalize="words"
          autoComplete="name"
          icon="account-outline"
          label="Full name"
          onChangeText={setFullName}
          onSubmitEditing={() => emailRef.current?.focus()}
          returnKeyType="next"
          valid={valid.fullName}
          value={fullName}
        />
        <FloatingLabelInput
          accessibleLabel="Email address"
          autoComplete="email"
          icon="email-outline"
          inputRef={emailRef}
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
          autoComplete="password-new"
          icon="lock-outline"
          inputRef={passwordRef}
          label="Password"
          onChangeText={setPassword}
          onSubmitEditing={() => confirmPasswordRef.current?.focus()}
          onToggleSecureEntry={() => setShowPassword(value => !value)}
          returnKeyType="next"
          secureTextEntry={!showPassword}
          textContentType="newPassword"
          valid={valid.password}
          value={password}
        />
        <FloatingLabelInput
          accessibleLabel="Confirm password"
          autoComplete="password-new"
          icon="lock-check-outline"
          inputRef={confirmPasswordRef}
          label="Confirm password"
          onChangeText={setConfirmPassword}
          onSubmitEditing={handleRegister}
          onToggleSecureEntry={() => setShowConfirmPassword(value => !value)}
          returnKeyType="done"
          secureTextEntry={!showConfirmPassword}
          textContentType="password"
          valid={valid.confirmPassword}
          value={confirmPassword}
        />

        <View style={styles.roleWrap}>
          <Text style={[styles.roleTitle, { color: theme.custom.textPrimary }]}>Choose a role</Text>
          <View style={styles.roleRow}>
            {roles.map(option => (
              <Chip
                key={option.value}
                mode={role === option.value ? 'flat' : 'outlined'}
                onPress={() => setRole(option.value)}
                selected={role === option.value}
                style={styles.chip}
              >
                {option.label}
              </Chip>
            ))}
          </View>
        </View>

        <PrimaryButton
          disabled={!valid.fullName || !valid.email || !valid.password || !valid.confirmPassword}
          label="Create account"
          loading={loading}
          onPress={handleRegister}
        />
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
  roleWrap: {
    gap: 12,
    marginBottom: 18,
  },
  roleTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  roleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    borderRadius: 999,
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
