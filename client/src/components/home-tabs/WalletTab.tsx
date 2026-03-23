import React from 'react';
import { Text, View } from 'react-native';
import { Card } from 'react-native-paper';

type Props = {
  context: any;
};

export function WalletTab({ context }: Props) {
  const { theme, styles, wallet } = context;

  return (
    <>
      <Card style={[styles.card, { backgroundColor: theme.custom.surfaceStrong }]} mode="elevated">
        <Card.Title title="Wallet" subtitle="Current point balance" />
        <Card.Content>
          <Text style={[styles.walletBalanceValue, { color: theme.custom.brandStrong }]}>{wallet?.balance ?? 0}</Text>
          <Text style={[styles.walletBalanceLabel, { color: theme.custom.textSecondary }]}>Total available points</Text>
        </Card.Content>
      </Card>

      <Card style={[styles.card, { backgroundColor: theme.custom.surfaceStrong }]} mode="elevated">
        <Card.Title title="Points Breakdown" subtitle="Supported point types" />
        <Card.Content>
          {wallet?.pointsBreakdown?.length ? (
            wallet.pointsBreakdown.map((item: any) => (
              <View key={item.pointType} style={styles.listItem}>
                <Text style={[styles.listTitle, { color: theme.custom.textPrimary }]}>{item.pointType}</Text>
                <Text style={[styles.listMeta, { color: theme.custom.textSecondary }]}>{item.balance} pts</Text>
              </View>
            ))
          ) : (
            <Text style={[styles.emptyText, { color: theme.custom.textSecondary }]}>No point types recorded yet.</Text>
          )}
        </Card.Content>
      </Card>
    </>
  );
}
