import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Snackbar, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AuthScreenShell } from '../components/auth/AuthScreenShell';
import { OtpInput } from '../components/auth/OtpInput';
import { PrimaryButton } from '../components/auth/PrimaryButton';
import { useSession } from '../context/SessionContext';
import { ScreenProps } from '../navigation/types';
import type { AppTheme } from '../theme/theme';

export function VerifyEmailScreen({ navigation, route }: ScreenProps<'VerifyEmail'>) {
  const theme = useTheme<AppTheme>();
  const { verifyEmail, loading } = useSession();
  const [otp, setOtp] = useState(route.params.verificationCode);
  const [error, setError] = useState('');

  const handleVerify = async () => {
    try {
      setError('');
      await verifyEmail({ userId: route.params.userId, otp });
      navigation.replace('RegistrationSuccess');
    } catch (requestError) {
      setError((requestError as Error).message || 'Verification failed.');
    }
  };

  return (
    <AuthScreenShell
      badge={
        <View style={[styles.badge, { backgroundColor: theme.custom.surfaceStrong, borderColor: theme.custom.border }]}>
          <MaterialCommunityIcons name="email-check-outline" size={22} color={theme.custom.brand} />
        </View>
      }
      subtitle={`We sent a 6-digit code to ${route.params.email}.`}
      title="Verify email"
    >
      <View style={styles.content}>
        <OtpInput onChange={setOtp} value={otp} />
        <View style={styles.tipBox}>
          <Text style={[styles.tipTitle, { color: theme.custom.textPrimary }]}>Demo verification code</Text>
          <Text style={[styles.tipText, { color: theme.custom.textSecondary }]}>{route.params.verificationCode}</Text>
        </View>
        <PrimaryButton disabled={otp.length !== 6} label="Confirm email" loading={loading} onPress={handleVerify} />
      </View>
      <Snackbar onDismiss={() => setError('')} visible={Boolean(error)}>
        {error}
      </Snackbar>
    </AuthScreenShell>
  );
}

const styles = StyleSheet.create({
  badge: {
    width: 72,
    height: 72,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    gap: 18,
  },
  tipBox: {
    borderRadius: 20,
    padding: 16,
    backgroundColor: 'rgba(148, 163, 184, 0.08)',
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 6,
  },
  tipText: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 6,
  },
});
