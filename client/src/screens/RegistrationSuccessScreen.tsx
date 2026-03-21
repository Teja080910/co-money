import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'react-native-paper';
import { AuthScreenShell } from '../components/auth/AuthScreenShell';
import { PrimaryButton } from '../components/auth/PrimaryButton';
import { ScreenProps } from '../navigation/types';
import type { AppTheme } from '../theme/theme';

export function RegistrationSuccessScreen({ navigation }: ScreenProps<'RegistrationSuccess'>) {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation();
  const circleScale = useRef(new Animated.Value(0.5)).current;
  const checkOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(circleScale, {
        toValue: 1,
        useNativeDriver: true,
        damping: 10,
        stiffness: 180,
      }),
      Animated.timing(checkOpacity, {
        toValue: 1,
        duration: 280,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, [checkOpacity, circleScale]);

  return (
    <AuthScreenShell
      badge={
        <Animated.View
          style={[
            styles.badge,
            {
              backgroundColor: theme.custom.success,
              transform: [{ scale: circleScale }],
            },
          ]}
        >
          <Animated.View style={{ opacity: checkOpacity }}>
            <MaterialCommunityIcons name="check" size={36} color="#FFFFFF" />
          </Animated.View>
        </Animated.View>
      }
      subtitle={t('auth.success.subtitle')}
      title={t('auth.success.title')}
    >
      <View style={styles.content}>
        <Text style={[styles.body, { color: theme.custom.textSecondary }]}>{t('auth.success.body')}</Text>
        <PrimaryButton label={t('auth.success.cta')} onPress={() => navigation.replace('Home')} />
      </View>
    </AuthScreenShell>
  );
}

const styles = StyleSheet.create({
  badge: {
    width: 84,
    height: 84,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    gap: 20,
  },
  body: {
    fontSize: 15,
    lineHeight: 24,
  },
});
