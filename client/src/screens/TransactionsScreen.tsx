import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { Card, List, useTheme } from 'react-native-paper';
import { AppScreen } from '../components/app/AppScreen';
import { useSession } from '../context/SessionContext';
import { ScreenProps } from '../navigation/types';
import type { AppTheme } from '../theme/theme';

export function TransactionsScreen({ navigation }: ScreenProps<'Transactions'>) {
  const theme = useTheme<AppTheme>();
  const { transactions, refresh, loading } = useSession();

  return (
    <AppScreen onBack={navigation.goBack} onRefresh={refresh} refreshing={loading} subtitle="Earn, redeem, and payable breakdowns" title="Transactions">
      <Card style={styles.card}>
        <Card.Content>
          {transactions.map(transaction => (
            <List.Item
              key={transaction.id}
              description={`${transaction.shopName} • discount ${transaction.discountAmount} • earned ${transaction.earnedPoints} • ${new Date(transaction.createdAt).toLocaleString()}`}
              title={`Total ${transaction.totalAmount} • payable ${transaction.payableAmount}`}
            />
          ))}
          {transactions.length === 0 ? <Text style={{ color: theme.custom.textSecondary }}>No transactions yet.</Text> : null}
        </Card.Content>
      </Card>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
  },
});
