import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';
import { AuthScreenShell } from '../components/auth/AuthScreenShell';
import { OtpInput } from '../components/auth/OtpInput';
import { PrimaryButton } from '../components/auth/PrimaryButton';
import { ScreenProps } from '../navigation/types';
import type { AppTheme } from '../theme/theme';

export function VerifyEmailScreen({ navigation, route }: ScreenProps<'VerifyEmail'>) {
  const theme = useTheme<AppTheme>();
  const email = route.params.email;
  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(30);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1800, useNativeDriver: true }),
      ]),
    ).start();
  }, [pulse]);

  useEffect(() => {
    if (timer === 0) {
      return;
    }

    const interval = setInterval(() => {
      setTimer(current => Math.max(0, current - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  const handleVerify = async () => {
    if (otp.length !== 6) {
      return;
    }

    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1200));
    setLoading(false);
    navigation.replace('RegistrationSuccess');
  };

  const handleResend = async () => {
    if (timer > 0) {
      return;
    }

    setResending(true);
    await new Promise(resolve => setTimeout(resolve, 900));
    setOtp('');
    setTimer(30);
    setResending(false);
  };

  const ringScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
  });

  return (
    <AuthScreenShell
      badge={
        <Animated.View
          style={[
            styles.mailBadge,
            {
              backgroundColor: theme.custom.surfaceStrong,
              borderColor: theme.custom.border,
              transform: [{ scale: ringScale }],
            },
          ]}
        >
          <MaterialCommunityIcons name="email-fast-outline" size={26} color={theme.custom.brand} />
        </Animated.View>
      }
      footer={
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.custom.textSecondary }]}>Entered the wrong email?</Text>
          <Text style={[styles.footerLink, { color: theme.custom.brand }]} onPress={() => navigation.goBack()}>
            Edit it
          </Text>
        </View>
      }
      subtitle={`We sent a 6-digit verification code to ${email}`}
      title="Verify your email"
    >
      <View style={styles.content}>
        <OtpInput onChange={setOtp} value={otp} />
        <Text style={[styles.helper, { color: theme.custom.textSecondary }]}>
          Auto-fill works on supported devices. You can also paste the full code into any box.
        </Text>

        <PrimaryButton disabled={otp.length !== 6} label="Confirm email" loading={loading} onPress={handleVerify} />

        <View style={styles.resendCard}>
          <View>
            <Text style={[styles.resendLabel, { color: theme.custom.textPrimary }]}>Need a new code?</Text>
            <Text style={[styles.resendHint, { color: theme.custom.textSecondary }]}>
              {timer > 0 ? `Resend available in 00:${timer.toString().padStart(2, '0')}` : 'You can request another verification code now.'}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            disabled={timer > 0 || resending}
            onPress={handleResend}
            style={({ pressed }) => [styles.resendButton, pressed && timer === 0 ? styles.resendPressed : null]}
          >
            <Text
              style={[
                styles.resendButtonLabel,
                {
                  color: timer > 0 || resending ? theme.custom.textSecondary : theme.custom.brand,
                },
              ]}
            >
              {resending ? 'Sending...' : 'Resend'}
            </Text>
          </Pressable>
        </View>
      </View>
    </AuthScreenShell>
  );
}

const styles = StyleSheet.create({
  mailBadge: {
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
  helper: {
    fontSize: 13,
    lineHeight: 20,
  },
  resendCard: {
    marginTop: 4,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(148, 163, 184, 0.08)',
  },
  resendLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  resendHint: {
    fontSize: 12,
    lineHeight: 18,
    maxWidth: 220,
  },
  resendButton: {
    minHeight: 44,
    minWidth: 72,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  resendPressed: {
    opacity: 0.75,
  },
  resendButtonLabel: {
    fontSize: 14,
    fontWeight: '800',
  },
  footer: {
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
