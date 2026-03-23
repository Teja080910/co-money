import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { Card, Chip, Divider } from 'react-native-paper';

type Props = {
  context: any;
};

export function TransactionsTab({ context }: Props) {
  const { t } = useTranslation();
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

  const translateTypeFilter = (option: string) => t(`transactions.filters.type.${option.toLowerCase()}`);
  const translateStatusFilter = (option: string) => t(`transactions.filters.status.${option.toLowerCase()}`);

  return (
    <Card style={[styles.card, { backgroundColor: theme.custom.surfaceStrong }]} mode="elevated">
      <Card.Title title={t('transactions.title')} subtitle={t('transactions.subtitle')} />
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
              {translateTypeFilter(option)}
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
              {translateStatusFilter(option)}
            </Chip>
          ))}
        </View>

        <Divider style={styles.divider} />

        {filteredTransactions.length ? (
          filteredTransactions.map((transaction: any) => (
            <View key={transaction.id} style={styles.listItem}>
              <Text style={[styles.listTitle, { color: theme.custom.textPrimary }]}>
                {t(`transactions.types.${transaction.type.toLowerCase()}`)} {transaction.points} {t('common.pointsShort')}
              </Text>
              <Text style={[styles.listMeta, { color: theme.custom.textSecondary }]}>
                {t(`pointTypes.${transaction.pointType.toLowerCase()}`)} • {t(`transactions.statuses.${transaction.status.toLowerCase()}`)} • {new Date(transaction.createdAt).toLocaleString()}
              </Text>
              {transaction.purchaseAmount ? (
                <Text style={[styles.listMeta, { color: theme.custom.textSecondary }]}>
                  {t('transactions.purchase')}: {transaction.purchaseAmount} | {t('transactions.discount')}: {transaction.discountAmount || 0} | {t('transactions.payable')}: {transaction.payableAmount || 0}
                </Text>
              ) : null}
              {transaction.earnedPoints ? (
                <Text style={[styles.listMeta, { color: theme.custom.textSecondary }]}>
                  {t('transactions.earnedInSettlement')}: {transaction.earnedPoints}
                  {transaction.isFirstTransactionBonus ? ` • ${t('transactions.firstTimeBonus')}` : ''}
                </Text>
              ) : null}
              <Text style={[styles.listMeta, { color: theme.custom.textSecondary }]}>
                {t('transactions.from')}: {transaction.fromShopId || t('common.na')} | {t('transactions.to')}: {transaction.toShopId || t('common.na')}
              </Text>
              <Text style={[styles.listMeta, { color: theme.custom.textSecondary }]}>
                {t('common.balance')}: {transaction.balanceBefore} {t('common.to')} {transaction.balanceAfter}
              </Text>
            </View>
          ))
        ) : (
          <Text style={[styles.emptyText, { color: theme.custom.textSecondary }]}>{t('transactions.empty')}</Text>
        )}
      </Card.Content>
    </Card>
  );
}
