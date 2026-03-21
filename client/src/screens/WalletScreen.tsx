import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card, List, useTheme } from 'react-native-paper';
import { AppScreen } from '../components/app/AppScreen';
import { SummaryCard } from '../components/app/SummaryCard';
import { useSession } from '../context/SessionContext';
import { ScreenProps } from '../navigation/types';
import type { AppTheme } from '../theme/theme';

export function WalletScreen({ navigation }: ScreenProps<'Wallet'>) {
  const theme = useTheme<AppTheme>();
  const { wallet, refresh, loading } = useSession();

  return (
    <AppScreen onBack={navigation.goBack} onRefresh={refresh} refreshing={loading} subtitle="Live point balances" title="Wallet">
      <View style={styles.row}>
        <SummaryCard label="Total balance" value={`${wallet?.totalBalance ?? 0}`} />
        <SummaryCard label="Shops with points" tone="accent" value={`${wallet?.wallet.buckets.length ?? 0}`} />
      </View>
      <Card style={styles.card}>
        <Card.Title title="Balance by source shop" />
        <Card.Content>
          {wallet?.wallet.buckets.map(bucket => (
            <List.Item
              key={bucket.shopId}
              description={`Updated ${new Date(bucket.updatedAt).toLocaleString()}`}
              right={() => <Text style={[styles.balance, { color: theme.custom.brand }]}>{bucket.balance}</Text>}
              title={bucket.shopName}
            />
          )) ?? <Text style={{ color: theme.custom.textSecondary }}>No wallet data available.</Text>}
        </Card.Content>
      </Card>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  card: {
    borderRadius: 24,
  },
  balance: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 12,
  },
});
