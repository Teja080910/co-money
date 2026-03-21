import React, { useEffect, useRef, useState } from 'react';
import {
  Image,
  ImageBackground,
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
import { resendRegistrationOtp, verifyRegistrationOtp } from '../services/auth';
import type { AppTheme } from '../theme/theme';

const logoSource = require('../../assets/auth/co-money-logo.png');
const backgroundSource = require('../../assets/auth/register-background.png');

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

    setErrorMessage(null);
    setLoading(true);

    try {
      await verifyRegistrationOtp({ email, otp });
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
          contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 28, 40) }}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroWrap}>
            <ImageBackground source={backgroundSource} style={styles.heroImage} resizeMode="cover">
              <View style={styles.heroOverlay}>
                <View style={styles.languageWrap}>
                  <LanguageSwitcher tone="light" />
                </View>
                <View style={[styles.topPill, { borderColor: 'rgba(255,255,255,0.42)' }]}>
                  <MaterialCommunityIcons name="message-badge-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.topPillText}>{t('auth.verifyEmail.heroBadge')}</Text>
                </View>
                <Image source={logoSource} style={styles.logo} resizeMode="contain" />
                <Text style={styles.heroTitle}>{t('auth.verifyEmail.heroTitle')}</Text>
                <Text style={styles.heroSubtitle}>{t('auth.verifyEmail.heroSubtitle')}</Text>
              </View>
            </ImageBackground>
          </View>

          <View
            style={[
              styles.sheet,
              {
                backgroundColor: theme.custom.surfaceStrong,
                borderColor: 'rgba(243, 111, 33, 0.12)',
                marginTop: -28,
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

            <Text style={[styles.sectionLabel, { color: theme.custom.textPrimary }]}>{t('auth.verifyEmail.sectionLabel')}</Text>
            <OtpInput onChange={setOtp} value={otp} />

            {errorMessage ? <Text style={[styles.errorText, { color: theme.custom.error }]}>{errorMessage}</Text> : null}

            <PrimaryButton disabled={otp.length !== 6} label={t('auth.verifyEmail.cta')} loading={loading} onPress={handleVerify} />

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
  heroWrap: {
    height: 340,
  },
  heroImage: {
    flex: 1,
  },
  heroOverlay: {
    flex: 1,
    backgroundColor: 'rgba(6, 25, 34, 0.42)',
    paddingTop: 64,
    paddingHorizontal: 24,
    paddingBottom: 34,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  languageWrap: {
    position: 'absolute',
    top: 54,
    right: 20,
  },
  topPill: {
    position: 'absolute',
    top: 56,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(12, 18, 24, 0.28)',
  },
  topPillText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  logo: {
    width: 148,
    height: 104,
    marginBottom: 12,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '900',
    marginBottom: 8,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    maxWidth: 320,
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
  errorText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 4,
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
