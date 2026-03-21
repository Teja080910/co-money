import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card, useTheme } from 'react-native-paper';
import { AppScreen } from '../components/app/AppScreen';
import { useSession } from '../context/SessionContext';
import { ScreenProps } from '../navigation/types';
import type { AppTheme } from '../theme/theme';

export function QRScreen({ navigation }: ScreenProps<'QR'>) {
  const theme = useTheme<AppTheme>();
  const { qrPayload, fetchQr, refresh, loading } = useSession();

  useEffect(() => {
    void fetchQr();
  }, []);

  return (
    <AppScreen onBack={navigation.goBack} onRefresh={refresh} refreshing={loading} subtitle="Merchant scan payload" title="Customer QR">
      <Card style={styles.card}>
        <Card.Content style={styles.content}>
          <View style={[styles.qrBox, { borderColor: theme.custom.brand }]}>
            <Text style={[styles.qrText, { color: theme.custom.textPrimary }]}>{qrPayload?.qrValue ?? 'Loading QR...'}</Text>
          </View>
          <Text style={[styles.helper, { color: theme.custom.textSecondary }]}>
            The merchant flow uses this payload to fetch the customer and current wallet information.
          </Text>
        </Card.Content>
      </Card>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
  },
  content: {
    gap: 16,
  },
  qrBox: {
    minHeight: 240,
    borderRadius: 28,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  qrText: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '800',
  },
  helper: {
    fontSize: 14,
    lineHeight: 21,
  },
});
