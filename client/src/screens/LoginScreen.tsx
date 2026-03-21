import React, { useEffect, useState } from 'react';
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
import { useTranslation } from 'react-i18next';
import { useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { FloatingLabelInput } from '../components/auth/FloatingLabelInput';
import { PrimaryButton } from '../components/auth/PrimaryButton';
import { ScreenProps } from '../navigation/types';
import { getApiErrorMessage, getApiResponseError } from '../services/api';
import { clearAuthenticatedUser, getPendingVerificationEmail, loginUser, savePendingVerificationEmail } from '../services/auth';
import type { AppTheme } from '../theme/theme';

const logoSource = require('../../assets/auth/co-money-logo.png');
const backgroundSource = require('../../assets/auth/register-background.png');

export function LoginScreen({ navigation }: ScreenProps<'Login'>) {
  const theme = useTheme<AppTheme>();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({
    identifier: false,
    password: false,
  });
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<string | null>(null);

  const trimmedIdentifier = identifier.trim();
  const errors = {
    identifier: touched.identifier && !trimmedIdentifier ? t('auth.login.errors.identifierRequired') : undefined,
    password: touched.password && !password ? t('auth.login.errors.passwordRequired') : undefined,
  };

  const isValid = Boolean(trimmedIdentifier && password);

  const markAllTouched = () => {
    setTouched({
      identifier: true,
      password: true,
    });
  };

  useEffect(() => {
    let active = true;

    void clearAuthenticatedUser();
    void getPendingVerificationEmail().then(email => {
      if (active) {
        setPendingVerificationEmail(email);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  const openPendingVerification = () => {
    if (!pendingVerificationEmail) {
      return;
    }

    setSubmitError(null);
    navigation.push('VerifyEmail', {
      email: pendingVerificationEmail,
    });
  };

  const handleLogin = async () => {
    if (!isValid) {
      markAllTouched();
      return;
    }

    setSubmitError(null);
    setLoading(true);

    try {
      await loginUser({
        identifier: trimmedIdentifier.toLowerCase(),
        password,
      });
      navigation.replace('Home');
    } catch (error) {
      const responseError = getApiResponseError(error);
      if (responseError === 'Verifica prima la tua email.') {
        const verificationEmail = trimmedIdentifier.includes('@')
          ? trimmedIdentifier.toLowerCase()
          : pendingVerificationEmail;

        if (verificationEmail) {
          await savePendingVerificationEmail(verificationEmail);
          navigation.push('VerifyEmail', {
            email: verificationEmail,
          });
          return;
        }
      }

      setSubmitError(getApiErrorMessage(error, t('auth.login.errors.submit')));
    } finally {
      setLoading(false);
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
                <View style={styles.topRow}>
                  <View style={[styles.topPill, { borderColor: 'rgba(255,255,255,0.42)' }]}>
                    <MaterialCommunityIcons name="login-variant" size={16} color="#FFFFFF" />
                    <Text style={styles.topPillText}>{t('auth.login.heroBadge')}</Text>
                  </View>
                  <LanguageSwitcher tone="light" />
                </View>
                <Image source={logoSource} style={styles.logo} resizeMode="contain" />
                <Text style={styles.heroTitle}>{t('auth.login.heroTitle')}</Text>
                <Text style={styles.heroSubtitle}>{t('auth.login.heroSubtitle')}</Text>
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
              <Text style={[styles.sheetTitle, { color: theme.custom.textPrimary }]}>{t('auth.login.title')}</Text>
              <Text style={[styles.sheetSubtitle, { color: theme.custom.textSecondary }]}>{t('auth.login.subtitle')}</Text>
            </View>

            <FloatingLabelInput
              accessibleLabel={t('auth.login.identifierLabel')}
              autoCapitalize="none"
              autoComplete="username"
              error={errors.identifier}
              helperText={!errors.identifier ? t('auth.login.identifierHelper') : undefined}
              icon="account-outline"
              label={t('auth.login.identifierLabel')}
              onChangeText={text => {
                setIdentifier(text);
                setTouched(current => ({ ...current, identifier: true }));
              }}
              returnKeyType="next"
              valid={Boolean(trimmedIdentifier)}
              value={identifier}
            />

            <FloatingLabelInput
              accessibleLabel={t('auth.login.passwordLabel')}
              autoComplete="password"
              error={errors.password}
              helperText={!errors.password ? t('auth.login.passwordHelper') : undefined}
              icon="lock-outline"
              label={t('auth.login.passwordLabel')}
              onChangeText={text => {
                setPassword(text);
                setTouched(current => ({ ...current, password: true }));
              }}
              onSubmitEditing={handleLogin}
              onToggleSecureEntry={() => setShowPassword(!showPassword)}
              returnKeyType="done"
              secureTextEntry={!showPassword}
              textContentType="password"
              valid={Boolean(password)}
              value={password}
            />

            {submitError ? <Text style={[styles.errorText, { color: theme.custom.error }]}>{submitError}</Text> : null}

            <PrimaryButton disabled={!isValid} label={t('auth.login.cta')} loading={loading} onPress={handleLogin} />

            {pendingVerificationEmail ? (
              <View style={styles.resumeRow}>
                <Text style={[styles.resumeText, { color: theme.custom.textSecondary }]}>
                  {t('auth.login.resumeVerificationPrompt')}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  hitSlop={10}
                  onPress={openPendingVerification}
                  style={({ pressed }) => [styles.inlineAction, pressed ? styles.inlineActionPressed : null]}
                >
                  <Text style={styles.footerLink}>{t('auth.login.resumeVerificationAction')}</Text>
                </Pressable>
              </View>
            ) : null}

            <View style={styles.footerRow}>
              <Text style={[styles.footerText, { color: theme.custom.textSecondary }]}>{t('auth.login.footerPrompt')}</Text>
              <Text style={styles.footerLink} onPress={() => navigation.navigate('Register')}>
                {t('auth.login.footerAction')}
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
  topRow: {
    position: 'absolute',
    top: 54,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  topPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(12, 18, 24, 0.28)',
    flexShrink: 1,
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
  errorText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 14,
  },
  resumeRow: {
    marginTop: 16,
    marginBottom: 2,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  resumeText: {
    fontSize: 14,
  },
  inlineAction: {
    justifyContent: 'center',
  },
  inlineActionPressed: {
    opacity: 0.72,
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
