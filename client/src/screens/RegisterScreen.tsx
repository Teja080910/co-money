import React, { useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';
import { AuthScreenShell } from '../components/auth/AuthScreenShell';
import { FloatingLabelInput } from '../components/auth/FloatingLabelInput';
import { PrimaryButton } from '../components/auth/PrimaryButton';
import { ScreenProps } from '../navigation/types';
import type { AppTheme } from '../theme/theme';
import { useRegisterForm } from '../hooks/useRegisterForm';

export function RegisterScreen({ navigation }: ScreenProps<'Register'>) {
  const theme = useTheme<AppTheme>();
  const [loading, setLoading] = useState(false);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);
  const {
    values,
    errors,
    validity,
    isValid,
    setFieldValue,
    touchField,
    markAllTouched,
    passwordVisible,
    confirmPasswordVisible,
    setPasswordVisible,
    setConfirmPasswordVisible,
  } = useRegisterForm();

  const handleRegister = async () => {
    if (!isValid) {
      markAllTouched();
      return;
    }

    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1400));
    setLoading(false);
    navigation.navigate('VerifyEmail', { email: values.email });
  };

  return (
    <AuthScreenShell
      badge={
        <View style={[styles.badge, { backgroundColor: theme.custom.surfaceStrong, borderColor: theme.custom.border }]}>
          <MaterialCommunityIcons name="shield-check-outline" size={18} color={theme.custom.brand} />
          <Text style={[styles.badgeText, { color: theme.custom.textPrimary }]}>Secure onboarding</Text>
        </View>
      }
      footer={
        <View style={styles.footerRow}>
          <Text style={[styles.footerText, { color: theme.custom.textSecondary }]}>Already have an account?</Text>
          <Text style={[styles.footerLink, { color: theme.custom.brand }]} onPress={() => navigation.navigate('Login')}>
            Login
          </Text>
        </View>
      }
      subtitle="Join us and get started"
      title="Create your account"
    >
      <View style={styles.form}>
        <FloatingLabelInput
          accessibleLabel="Full name"
          autoCapitalize="words"
          autoComplete="name"
          error={errors.fullName}
          helperText={!errors.fullName ? 'Use your real name for a smoother verification flow.' : undefined}
          icon="account-outline"
          label="Full name"
          onChangeText={text => {
            setFieldValue('fullName', text);
            touchField('fullName');
          }}
          onSubmitEditing={() => emailRef.current?.focus()}
          returnKeyType="next"
          valid={validity.fullName}
          value={values.fullName}
        />
        <FloatingLabelInput
          accessibleLabel="Email address"
          autoComplete="email"
          error={errors.email}
          icon="email-outline"
          inputRef={emailRef}
          keyboardType="email-address"
          label="Email address"
          onChangeText={text => {
            setFieldValue('email', text);
            touchField('email');
          }}
          onSubmitEditing={() => passwordRef.current?.focus()}
          returnKeyType="next"
          valid={validity.email}
          value={values.email}
        />
        <FloatingLabelInput
          accessibleLabel="Password"
          autoComplete="password-new"
          error={errors.password}
          helperText={!errors.password ? 'Use 8+ characters with a mix of letters and numbers.' : undefined}
          icon="lock-outline"
          inputRef={passwordRef}
          label="Password"
          onChangeText={text => {
            setFieldValue('password', text);
            touchField('password');
          }}
          onSubmitEditing={() => confirmPasswordRef.current?.focus()}
          onToggleSecureEntry={() => setPasswordVisible(!passwordVisible)}
          returnKeyType="next"
          secureTextEntry={!passwordVisible}
          textContentType="newPassword"
          valid={validity.password}
          value={values.password}
        />
        <FloatingLabelInput
          accessibleLabel="Confirm password"
          autoComplete="password-new"
          error={errors.confirmPassword}
          icon="lock-check-outline"
          inputRef={confirmPasswordRef}
          label="Confirm password"
          onChangeText={text => {
            setFieldValue('confirmPassword', text);
            touchField('confirmPassword');
          }}
          onSubmitEditing={handleRegister}
          onToggleSecureEntry={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
          returnKeyType="done"
          secureTextEntry={!confirmPasswordVisible}
          textContentType="password"
          valid={validity.confirmPassword}
          value={values.confirmPassword}
        />

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="lightning-bolt-outline" size={16} color={theme.custom.brand} />
            <Text style={[styles.metaText, { color: theme.custom.textSecondary }]}>Real-time validation</Text>
          </View>
          {loading ? <ActivityIndicator color={theme.custom.brand} size="small" /> : null}
        </View>

        <PrimaryButton disabled={!isValid} label="Create account" loading={loading} onPress={handleRegister} />
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
