import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { FloatingLabelInput } from '../components/auth/FloatingLabelInput';
import { PrimaryButton } from '../components/auth/PrimaryButton';
import { FEEDBACK_AUTO_DISMISS_MS } from '../constants/feedback';
import { useAutoDismissMessage } from '../hooks/useAutoDismissMessage';
import { useRegisterForm } from '../hooks/useRegisterForm';
import { ScreenProps } from '../navigation/types';
import { getApiErrorMessage } from '../services/api';
import { registerUser, savePendingVerificationEmail } from '../services/auth';
import type { AppTheme } from '../theme/theme';

const logoSource = require('../../assets/auth/co-money-logo.png');
const backgroundSource = require('../../assets/auth/register-background.png');

export function RegisterScreen({ navigation }: ScreenProps<'Register'>) {
  const theme = useTheme<AppTheme>();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const lastNameRef = useRef<TextInput>(null);
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
  const clearSubmitError = useCallback(() => {
    setSubmitError(null);
  }, []);

  useAutoDismissMessage(submitError, clearSubmitError, FEEDBACK_AUTO_DISMISS_MS);

  const handleRegister = async () => {
    if (!isValid) {
      markAllTouched();
      return;
    }

    setSubmitError(null);
    setLoading(true);

    try {
      const result = await registerUser({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        password: values.password,
      });
      await savePendingVerificationEmail(result.email);

      navigation.navigate('VerifyEmail', {
        email: result.email,
      });
    } catch (error) {
      setSubmitError(getApiErrorMessage(error, t('auth.register.errors.submit')));
    } finally {
      setLoading(false);
    }
  };

  const scrollToField = (y: number) => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y, animated: true });
    });
  };

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hideSubscription = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  return (
    <Pressable style={[styles.root, { backgroundColor: theme.custom.surfaceStrong }]} onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 24}
      >
        <ScrollView
          ref={scrollRef}
          automaticallyAdjustKeyboardInsets
          bounces={false}
          contentContainerStyle={{
            paddingBottom: keyboardVisible ? Math.max(insets.bottom + 140, 160) : Math.max(insets.bottom + 28, 40),
          }}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroWrap}>
            <ImageBackground source={backgroundSource} style={styles.heroImage} resizeMode="cover">
              <View style={styles.heroOverlay}>
                <View style={styles.topRow}>
                  <View style={[styles.topPill, { borderColor: 'rgba(255,255,255,0.42)' }]}>
                    <MaterialCommunityIcons name="email-check-outline" size={16} color="#FFFFFF" />
                    <Text style={styles.topPillText}>{t('auth.register.heroBadge')}</Text>
                  </View>
                  <LanguageSwitcher tone="light" />
                </View>
                <Image source={logoSource} style={styles.logo} resizeMode="contain" />
                <Text style={styles.heroTitle}>{t('auth.register.heroTitle')}</Text>
                <Text style={styles.heroSubtitle}>{t('auth.register.heroSubtitle')}</Text>
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
              <Text style={[styles.sheetTitle, { color: theme.custom.textPrimary }]}>{t('auth.register.title')}</Text>
              <Text style={[styles.sheetSubtitle, { color: theme.custom.textSecondary }]}>
                {t('auth.register.subtitle')}
              </Text>
            </View>

            <View style={styles.nameRow}>
              <View style={styles.halfField}>
                <FloatingLabelInput
                  accessibleLabel={t('auth.register.firstNameLabel')}
                  autoCapitalize="words"
                  autoComplete="name-given"
                  error={errors.firstName}
                  helperText={!errors.firstName ? t('auth.register.firstNameHelper') : undefined}
                  icon="account-outline"
                  label={t('auth.register.firstNameLabel')}
                  onChangeText={text => {
                    setFieldValue('firstName', text);
                    touchField('firstName');
                  }}
                  onFocus={() => scrollToField(180)}
                  onSubmitEditing={() => lastNameRef.current?.focus()}
                  returnKeyType="next"
                  valid={validity.firstName}
                  value={values.firstName}
                />
              </View>
              <View style={styles.halfField}>
                <FloatingLabelInput
                  accessibleLabel={t('auth.register.lastNameLabel')}
                  autoCapitalize="words"
                  autoComplete="name-family"
                  error={errors.lastName}
                  helperText={!errors.lastName ? t('auth.register.lastNameHelper') : undefined}
                  icon="badge-account-outline"
                  inputRef={lastNameRef}
                  label={t('auth.register.lastNameLabel')}
                  onChangeText={text => {
                    setFieldValue('lastName', text);
                    touchField('lastName');
                  }}
                  onFocus={() => scrollToField(220)}
                  onSubmitEditing={() => emailRef.current?.focus()}
                  returnKeyType="next"
                  valid={validity.lastName}
                  value={values.lastName}
                />
              </View>
            </View>

            <FloatingLabelInput
              accessibleLabel={t('auth.register.emailLabel')}
              autoCapitalize="none"
              autoComplete="email"
              error={errors.email}
              helperText={!errors.email ? t('auth.register.emailHelper') : undefined}
              icon="email-outline"
              inputRef={emailRef}
              keyboardType="email-address"
              label={t('auth.register.emailLabel')}
              onChangeText={text => {
                setFieldValue('email', text);
                touchField('email');
              }}
              onFocus={() => scrollToField(300)}
              onSubmitEditing={() => passwordRef.current?.focus()}
              returnKeyType="next"
              valid={validity.email}
              value={values.email}
            />

            <FloatingLabelInput
              accessibleLabel={t('auth.register.passwordLabel')}
              autoComplete="password-new"
              error={errors.password}
              helperText={!errors.password ? t('auth.register.passwordHelper') : undefined}
              icon="lock-outline"
              inputRef={passwordRef}
              label={t('auth.register.passwordLabel')}
              onChangeText={text => {
                setFieldValue('password', text);
                touchField('password');
              }}
              onFocus={() => scrollToField(420)}
              onSubmitEditing={() => confirmPasswordRef.current?.focus()}
              onToggleSecureEntry={() => setPasswordVisible(!passwordVisible)}
              returnKeyType="next"
              secureTextEntry={!passwordVisible}
              textContentType="newPassword"
              valid={validity.password}
              value={values.password}
            />

            <FloatingLabelInput
              accessibleLabel={t('auth.register.confirmPasswordLabel')}
              autoComplete="password-new"
              error={errors.confirmPassword}
              helperText={!errors.confirmPassword ? t('auth.register.confirmPasswordHelper') : undefined}
              icon="lock-check-outline"
              inputRef={confirmPasswordRef}
              label={t('auth.register.confirmPasswordLabel')}
              onChangeText={text => {
                setFieldValue('confirmPassword', text);
                touchField('confirmPassword');
              }}
              onFocus={() => scrollToField(520)}
              onSubmitEditing={handleRegister}
              onToggleSecureEntry={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
              returnKeyType="done"
              secureTextEntry={!confirmPasswordVisible}
              textContentType="password"
              valid={validity.confirmPassword}
              value={values.confirmPassword}
            />

            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="shield-check-outline" size={18} color="#F36F21" />
                <Text style={[styles.infoTitle, { color: theme.custom.textPrimary }]}>{t('auth.register.otpTitle')}</Text>
              </View>
              <Text style={[styles.infoText, { color: theme.custom.textSecondary }]}>
                {t('auth.register.otpBody')}
              </Text>
            </View>

            <View style={styles.actionWrap}>
              {submitError ? <Text style={[styles.submitError, { color: theme.custom.error }]}>{submitError}</Text> : null}
              {loading ? (
                <View style={styles.loaderRow}>
                  <ActivityIndicator color="#F36F21" size="small" />
                  <Text style={[styles.loaderText, { color: theme.custom.textSecondary }]}>{t('auth.register.submitting')}</Text>
                </View>
              ) : null}
              <PrimaryButton disabled={!isValid} label={t('auth.register.cta')} loading={loading} onPress={handleRegister} />
            </View>

            <View style={styles.footerRow}>
              <Text style={[styles.footerText, { color: theme.custom.textSecondary }]}>{t('auth.register.footerPrompt')}</Text>
              <Text style={styles.footerLink} onPress={() => navigation.navigate('Login')}>
                {t('auth.register.footerAction')}
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
    height: 360,
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
    width: 168,
    height: 120,
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
    marginBottom: 16,
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
  nameRow: {
    flexDirection: 'row',
    gap: 10,
  },
  halfField: {
    flex: 1,
  },
  infoCard: {
    borderRadius: 20,
    backgroundColor: '#FFF4EC',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 4,
    marginBottom: 18,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  infoText: {
    fontSize: 12,
    lineHeight: 19,
  },
  actionWrap: {
    gap: 10,
  },
  loaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
  },
  loaderText: {
    fontSize: 12,
    fontWeight: '600',
  },
  submitError: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    textAlign: 'center',
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
