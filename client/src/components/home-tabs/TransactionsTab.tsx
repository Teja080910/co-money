import React from 'react';
import { Text, View } from 'react-native';
import { Card, Chip, Divider } from 'react-native-paper';

type Props = {
  context: any;
};

export function TransactionsTab({ context }: Props) {
  const {
    theme,
    styles,
    transactionTypeOptions,
    transactionStatusOptions,
    transactionTypeFilter,
    transactionStatusFilter,
    setTransactionTypeFilter,
    setTransactionStatusFilter,
    filteredTransactions,
  } = context;

  return (
    <Card style={[styles.card, { backgroundColor: theme.custom.surfaceStrong }]} mode="elevated">
      <Card.Title title="Transactions" subtitle="Track earn and spend activity" />
      <Card.Content>
        <View style={styles.filterRow}>
          {transactionTypeOptions.map((option: string) => (
            <Chip
              key={option}
              mode={transactionTypeFilter === option ? 'flat' : 'outlined'}
              selected={transactionTypeFilter === option}
              onPress={() => setTransactionTypeFilter(option)}
              style={styles.filterChip}
            >
              {option}
            </Chip>
          ))}
        </View>
        <View style={styles.filterRow}>
          {transactionStatusOptions.map((option: string) => (
            <Chip
              key={option}
              mode={transactionStatusFilter === option ? 'flat' : 'outlined'}
              selected={transactionStatusFilter === option}
              onPress={() => setTransactionStatusFilter(option)}
              style={styles.filterChip}
            >
              {option}
            </Chip>
          ))}
        </View>

        <Divider style={styles.divider} />

        {filteredTransactions.length ? (
          filteredTransactions.map((transaction: any) => (
            <View key={transaction.id} style={styles.listItem}>
              <Text style={[styles.listTitle, { color: theme.custom.textPrimary }]}>
                {transaction.type} {transaction.points} pts
              </Text>
              <Text style={[styles.listMeta, { color: theme.custom.textSecondary }]}>
                {transaction.pointType} • {transaction.status} • {new Date(transaction.createdAt).toLocaleString()}
              </Text>
              {transaction.purchaseAmount ? (
                <Text style={[styles.listMeta, { color: theme.custom.textSecondary }]}>
                  Purchase: {transaction.purchaseAmount} | Discount: {transaction.discountAmount || 0} | Payable: {transaction.payableAmount || 0}
                </Text>
              ) : null}
              {transaction.earnedPoints ? (
                <Text style={[styles.listMeta, { color: theme.custom.textSecondary }]}>
                  Earned in settlement: {transaction.earnedPoints}
                  {transaction.isFirstTransactionBonus ? ' • First-time bonus' : ''}
                </Text>
              ) : null}
              <Text style={[styles.listMeta, { color: theme.custom.textSecondary }]}>
                From: {transaction.fromShopId || 'N/A'} | To: {transaction.toShopId || 'N/A'}
              </Text>
              <Text style={[styles.listMeta, { color: theme.custom.textSecondary }]}>
                Balance: {transaction.balanceBefore} to {transaction.balanceAfter}
              </Text>
            </View>
          ))
        ) : (
          <Text style={[styles.emptyText, { color: theme.custom.textSecondary }]}>No transactions match the current filters.</Text>
        )}
      </Card.Content>
    </Card>
  );
}
