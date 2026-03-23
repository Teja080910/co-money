import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { Card } from 'react-native-paper';

type Props = {
  context: any;
};

export function WalletTab({ context }: Props) {
  const { t } = useTranslation();
  const { theme, styles, wallet } = context;

  return (
    <>
      <Card style={[styles.card, { backgroundColor: theme.custom.surfaceStrong }]} mode="elevated">
        <Card.Title title={t('wallet.title')} subtitle={t('wallet.subtitle')} />
        <Card.Content>
          <Text style={[styles.walletBalanceValue, { color: theme.custom.brandStrong }]}>{wallet?.balance ?? 0}</Text>
          <Text style={[styles.walletBalanceLabel, { color: theme.custom.textSecondary }]}>{t('wallet.availablePoints')}</Text>
        </Card.Content>
      </Card>

      <Card style={[styles.card, { backgroundColor: theme.custom.surfaceStrong }]} mode="elevated">
        <Card.Title title={t('wallet.breakdownTitle')} subtitle={t('wallet.breakdownSubtitle')} />
        <Card.Content>
          {wallet?.pointsBreakdown?.length ? (
            wallet.pointsBreakdown.map((item: any) => (
              <View key={item.pointType} style={styles.listItem}>
                <Text style={[styles.listTitle, { color: theme.custom.textPrimary }]}>{t(`pointTypes.${item.pointType.toLowerCase()}`)}</Text>
                <Text style={[styles.listMeta, { color: theme.custom.textSecondary }]}>{item.balance} {t('common.pointsShort')}</Text>
              </View>
            ))
          ) : (
            <Text style={[styles.emptyText, { color: theme.custom.textSecondary }]}>{t('wallet.empty')}</Text>
          )}
        </Card.Content>
      </Card>
    </>
  );
}
