import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, List } from 'react-native-paper';
import { AppScreen } from '../components/app/AppScreen';
import { SummaryCard } from '../components/app/SummaryCard';
import { useSession } from '../context/SessionContext';
import { ScreenProps } from '../navigation/types';

export function AdminReportsScreen({ navigation }: ScreenProps<'AdminReports'>) {
  const { overview, transactions, refresh, loading } = useSession();
  const metricEntries = Object.entries(overview?.metrics ?? {});

  return (
    <AppScreen onBack={navigation.goBack} onRefresh={refresh} refreshing={loading} subtitle="System totals and network activity" title="Reports">
      <View style={styles.row}>
        {metricEntries.map(([label, value], index) => (
          <SummaryCard key={label} label={label.replace(/([A-Z])/g, ' $1')} tone={index % 2 === 0 ? 'brand' : 'accent'} value={`${value}`} />
        ))}
      </View>
      <Card style={styles.card}>
        <Card.Title title="Latest transactions" />
        <Card.Content>
          {transactions.slice(0, 10).map(transaction => (
            <List.Item
              key={transaction.id}
              description={`${transaction.shopName} • discount ${transaction.discountAmount} • earned ${transaction.earnedPoints}`}
              title={`Payable ${transaction.payableAmount} • total ${transaction.totalAmount}`}
            />
          ))}
        </Card.Content>
      </Card>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    borderRadius: 24,
  },
});
