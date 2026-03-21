import React, { useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { OtpInput } from '../components/auth/OtpInput';
import { PrimaryButton } from '../components/auth/PrimaryButton';
import { ScreenProps } from '../navigation/types';
import { getApiErrorMessage } from '../services/api';
import { clearPendingVerificationEmail, resendRegistrationOtp, verifyRegistrationOtp } from '../services/auth';
import type { AppTheme } from '../theme/theme';

export function VerifyEmailScreen({ navigation, route }: ScreenProps<'VerifyEmail'>) {
  const theme = useTheme<AppTheme>();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const email = route.params.email;
  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(30);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const normalizedOtp = otp.replace(/\D/g, '').slice(0, 6);

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
    if (normalizedOtp.length !== 6) {
      setErrorMessage(t('auth.verifyEmail.invalidOtp'));
      return;
    }

    setErrorMessage(null);
    setLoading(true);

    try {
      await verifyRegistrationOtp({ email, otp: normalizedOtp });
      await clearPendingVerificationEmail();
      navigation.replace('RegistrationSuccess');
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, t('auth.verifyEmail.invalidOtp')));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0) {
      return;
    }

    setErrorMessage(null);
    setResending(true);

    try {
      await resendRegistrationOtp(email);
      setOtp('');
      setTimer(30);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, t('auth.verifyEmail.resendError')));
    } finally {
      setResending(false);
    }
  };

  return (
    <Pressable style={[styles.root, { backgroundColor: theme.custom.surfaceStrong }]} onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 24}
      >
        <ScrollView
          bounces={false}
          contentContainerStyle={{
            paddingTop: Math.max(insets.top + 16, 24),
            paddingBottom: Math.max(insets.bottom + 28, 40),
          }}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              styles.headerCard,
              {
                backgroundColor: theme.custom.surfaceStrong,
                borderColor: theme.custom.border,
                shadowColor: theme.custom.shadow,
              },
            ]}
          >
            <View style={styles.headerTopRow}>
              <View style={[styles.topPill, { backgroundColor: 'rgba(47,107,255,0.1)' }]}>
                <MaterialCommunityIcons name="message-badge-outline" size={16} color={theme.custom.brandStrong} />
                <Text style={[styles.topPillText, { color: theme.custom.brandStrong }]}>{t('auth.verifyEmail.heroBadge')}</Text>
              </View>
              <LanguageSwitcher />
            </View>
            <Text style={[styles.heroTitle, { color: theme.custom.textPrimary }]}>{t('auth.verifyEmail.heroTitle')}</Text>
            <Text style={[styles.heroSubtitle, { color: theme.custom.textSecondary }]}>{t('auth.verifyEmail.heroSubtitle')}</Text>
          </View>

          <View
            style={[
              styles.sheet,
              {
                backgroundColor: theme.custom.surfaceStrong,
                borderColor: 'rgba(243, 111, 33, 0.12)',
              },
            ]}
          >
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: theme.custom.textPrimary }]}>{t('auth.verifyEmail.title')}</Text>
              <Text style={[styles.sheetSubtitle, { color: theme.custom.textSecondary }]}>
                {t('auth.verifyEmail.subtitle')}
              </Text>
            </View>

            <View style={styles.emailCard}>
              <MaterialCommunityIcons name="email-outline" size={18} color="#F36F21" />
              <Text style={[styles.emailText, { color: theme.custom.textPrimary }]}>{email}</Text>
            </View>

            <View style={styles.formStack}>
              <Text style={[styles.sectionLabel, { color: theme.custom.textPrimary }]}>{t('auth.verifyEmail.sectionLabel')}</Text>
              <OtpInput onChange={setOtp} value={normalizedOtp} />

              {errorMessage ? <Text style={[styles.errorText, { color: theme.custom.error }]}>{errorMessage}</Text> : null}

              <View style={styles.buttonWrap}>
                <PrimaryButton
                  disabled={normalizedOtp.length !== 6}
                  label={t('auth.verifyEmail.cta')}
                  loading={loading}
                  onPress={handleVerify}
                />
              </View>
            </View>

            <View style={styles.resendRow}>
              <Text style={[styles.resendText, { color: theme.custom.textSecondary }]}>
                {timer > 0
                  ? t('auth.verifyEmail.resendCountdown', { time: timer.toString().padStart(2, '0') })
                  : t('auth.verifyEmail.resendPrompt')}
              </Text>
              <Pressable
                accessibilityRole="button"
                disabled={timer > 0 || resending}
                onPress={handleResend}
                style={({ pressed }) => [styles.resendAction, pressed && timer === 0 ? styles.resendPressed : null]}
              >
                <Text
                  style={[
                    styles.resendActionText,
                    { color: timer > 0 || resending ? theme.custom.textSecondary : '#F36F21' },
                  ]}
                >
                  {resending ? t('auth.verifyEmail.resending') : t('auth.verifyEmail.resendAction')}
                </Text>
              </Pressable>
            </View>

            <View style={styles.footerRow}>
              <Text style={[styles.footerText, { color: theme.custom.textSecondary }]}>{t('auth.verifyEmail.wrongEmailPrompt')}</Text>
              <Text style={styles.footerLink} onPress={() => navigation.goBack()}>
                {t('auth.verifyEmail.wrongEmailAction')}
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  headerCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 18,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 1,
    shadowRadius: 28,
    elevation: 8,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  topPill: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
    marginBottom: 18,
  },
  topPillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  heroTitle: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '900',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 21,
  },
  sheet: {
    marginHorizontal: 16,
    borderRadius: 30,
    paddingHorizontal: 18,
    paddingTop: 22,
    paddingBottom: 26,
    borderWidth: 1,
    shadowColor: '#18181B',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 12,
  },
  sheetHeader: {
    marginBottom: 12,
  },
  sheetTitle: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  sheetSubtitle: {
    fontSize: 13,
    lineHeight: 20,
  },
  emailCard: {
    borderRadius: 20,
    backgroundColor: '#FFF4EC',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  emailText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 12,
  },
  formStack: {
    width: '100%',
  },
  errorText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 4,
  },
  buttonWrap: {
    width: '100%',
    marginTop: 10,
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    marginTop: 18,
  },
  resendText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },
  resendAction: {
    minHeight: 40,
    justifyContent: 'center',
  },
  resendPressed: {
    opacity: 0.7,
  },
  resendActionText: {
    fontSize: 14,
    fontWeight: '800',
  },
  footerRow: {
    marginTop: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 14,
  },
  footerLink: {
    color: '#F36F21',
    fontSize: 14,
    fontWeight: '800',
  },
});
