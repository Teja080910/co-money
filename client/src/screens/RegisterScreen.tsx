import React, { useEffect, useRef, useState } from 'react';
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
import { FloatingLabelInput } from '../components/auth/FloatingLabelInput';
import { PrimaryButton } from '../components/auth/PrimaryButton';
import { useRegisterForm } from '../hooks/useRegisterForm';
import { ScreenProps } from '../navigation/types';
import type { AppTheme } from '../theme/theme';

const logoSource = require('../../assets/auth/co-money-logo.png');
const backgroundSource = require('../../assets/auth/register-background.png');
const defaultEmailDomain = '@sottocasa.it';

export function RegisterScreen({ navigation }: ScreenProps<'Register'>) {
  const theme = useTheme<AppTheme>();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
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

  const handleRegister = async () => {
    if (!isValid) {
      markAllTouched();
      return;
    }

    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1400));
    setLoading(false);
    navigation.navigate('VerifyEmail', { email: `${values.username.trim().toLowerCase()}${defaultEmailDomain}` });
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
                <View style={[styles.topPill, { borderColor: 'rgba(255,255,255,0.42)' }]}>
                  <MaterialCommunityIcons name="email-check-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.topPillText}>Verifica Email</Text>
                </View>
                <Image source={logoSource} style={styles.logo} resizeMode="contain" />
                <Text style={styles.heroTitle}>Registrazione</Text>
                <Text style={styles.heroSubtitle}>
                  Crea il tuo account e continua nel nuovo Co-Money con lo stile dell&apos;app originale.
                </Text>
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
              <Text style={[styles.sheetTitle, { color: theme.custom.textPrimary }]}>REGISTRATI</Text>
              <Text style={[styles.sheetSubtitle, { color: theme.custom.textSecondary }]}>
                Abbiamo recuperato dall&apos;app precedente il flusso di registrazione con verifica OTP via email.
              </Text>
            </View>

            <View style={styles.nameRow}>
              <View style={styles.halfField}>
                <FloatingLabelInput
                  accessibleLabel="Nome"
                  autoCapitalize="words"
                  autoComplete="name-given"
                  error={errors.firstName}
                  helperText={!errors.firstName ? 'Inserisci il tuo nome' : undefined}
                  icon="account-outline"
                  label="Nome"
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
                  accessibleLabel="Cognome"
                  autoCapitalize="words"
                  autoComplete="name-family"
                  error={errors.lastName}
                  helperText={!errors.lastName ? 'Inserisci il tuo cognome' : undefined}
                  icon="badge-account-outline"
                  inputRef={lastNameRef}
                  label="Cognome"
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

            <View style={styles.usernameSection}>
              <View style={styles.usernameRow}>
                <View style={styles.usernameField}>
                  <FloatingLabelInput
                    accessibleLabel="Nome utente"
                    autoCapitalize="none"
                    autoComplete="username"
                    error={errors.username}
                    helperText={!errors.username ? 'Inserisci nome utente' : undefined}
                    icon="account-circle-outline"
                    inputRef={emailRef}
                    label="Nome utente"
                    onChangeText={text => {
                      setFieldValue('username', text.replace(/\s+/g, '').toLowerCase());
                      touchField('username');
                    }}
                    onFocus={() => scrollToField(300)}
                    onSubmitEditing={() => passwordRef.current?.focus()}
                    returnKeyType="next"
                    valid={validity.username}
                    value={values.username}
                  />
                </View>
                <View style={[styles.domainCard, { backgroundColor: '#FFF4EC', borderColor: 'rgba(243, 111, 33, 0.18)' }]}>
                  <Text style={styles.domainLabel}>Dominio</Text>
                  <Text style={styles.domainValue}>{defaultEmailDomain}</Text>
                </View>
              </View>
              <Text style={[styles.usernameHint, { color: theme.custom.textSecondary }]}>
                Come nell&apos;app originale, il sistema completa automaticamente l&apos;indirizzo email.
              </Text>
            </View>

            <FloatingLabelInput
              accessibleLabel="Password"
              autoComplete="password-new"
              error={errors.password}
              helperText={!errors.password ? 'La password deve essere di almeno 8 caratteri' : undefined}
              icon="lock-outline"
              inputRef={passwordRef}
              label="Password"
              onChangeText={text => {
                setFieldValue('password', text);
                touchField('password');
              }}
              onFocus={() => scrollToField(470)}
              onSubmitEditing={() => confirmPasswordRef.current?.focus()}
              onToggleSecureEntry={() => setPasswordVisible(!passwordVisible)}
              returnKeyType="next"
              secureTextEntry={!passwordVisible}
              textContentType="newPassword"
              valid={validity.password}
              value={values.password}
            />

            <FloatingLabelInput
              accessibleLabel="Conferma Password"
              autoComplete="password-new"
              error={errors.confirmPassword}
              helperText={!errors.confirmPassword ? 'Conferma la password' : undefined}
              icon="lock-check-outline"
              inputRef={confirmPasswordRef}
              label="Conferma Password"
              onChangeText={text => {
                setFieldValue('confirmPassword', text);
                touchField('confirmPassword');
              }}
              onFocus={() => scrollToField(580)}
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
                <Text style={[styles.infoTitle, { color: theme.custom.textPrimary }]}>Verifica OTP</Text>
              </View>
              <Text style={[styles.infoText, { color: theme.custom.textSecondary }]}>
                Dopo la registrazione, invieremo un codice OTP alla tua email per completare l&apos;attivazione.
              </Text>
            </View>

            <View style={styles.actionWrap}>
              {loading ? (
                <View style={styles.loaderRow}>
                  <ActivityIndicator color="#F36F21" size="small" />
                  <Text style={[styles.loaderText, { color: theme.custom.textSecondary }]}>Registrazione in corso...</Text>
                </View>
              ) : null}
              <PrimaryButton disabled={!isValid} label="REGISTRATI" loading={loading} onPress={handleRegister} />
            </View>

            <View style={styles.footerRow}>
              <Text style={[styles.footerText, { color: theme.custom.textSecondary }]}>Hai gia un account?</Text>
              <Text style={styles.footerLink} onPress={() => navigation.navigate('Login')}>
                Accedi
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
  usernameSection: {
    marginBottom: 8,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  usernameField: {
    flex: 1,
  },
  domainCard: {
    minHeight: 64,
    minWidth: 126,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  domainLabel: {
    color: '#F36F21',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  domainValue: {
    color: '#7C2D12',
    fontSize: 13,
    fontWeight: '800',
  },
  usernameHint: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 2,
    paddingHorizontal: 4,
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
