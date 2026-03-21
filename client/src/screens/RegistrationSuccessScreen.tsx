import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';
import { AuthScreenShell } from '../components/auth/AuthScreenShell';
import { PrimaryButton } from '../components/auth/PrimaryButton';
import { ScreenProps } from '../navigation/types';
import type { AppTheme } from '../theme/theme';

export function RegistrationSuccessScreen({ navigation }: ScreenProps<'RegistrationSuccess'>) {
  const theme = useTheme<AppTheme>();

  return (
    <AuthScreenShell
      badge={
        <View style={[styles.badge, { backgroundColor: theme.custom.success }]}>
          <MaterialCommunityIcons name="check" size={34} color="#FFFFFF" />
        </View>
      }
      subtitle="Your account is ready and the reward network is available."
      title="Welcome aboard"
    >
      <View style={styles.content}>
        <Text style={[styles.body, { color: theme.custom.textSecondary }]}>
          Head into the app to view wallet balances, merchant tools, admin reporting, and the shared rewards logic.
        </Text>
        <PrimaryButton label="Continue to dashboard" onPress={() => navigation.replace('Home')} />
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
