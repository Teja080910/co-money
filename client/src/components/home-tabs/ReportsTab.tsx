import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text } from 'react-native';
import { Card } from 'react-native-paper';

type Props = {
  context: any;
};

export function ReportsTab({ context }: Props) {
  const { t } = useTranslation();
  const { theme, styles, report } = context;

  return (
    <Card style={[styles.card, { backgroundColor: theme.custom.surfaceStrong }]} mode="elevated">
      <Card.Title title={t('reports.title')} subtitle={t('reports.subtitle')} />
      <Card.Content>
        {report ? (
          <>
            <Text style={[styles.reportText, { color: theme.custom.textPrimary }]}>{t('reports.customers')}: {report.totalCustomers}</Text>
            <Text style={[styles.reportText, { color: theme.custom.textPrimary }]}>{t('reports.shops')}: {report.totalShops}</Text>
            <Text style={[styles.reportText, { color: theme.custom.textPrimary }]}>{t('reports.issued')}: {report.totalPointsIssued}</Text>
            <Text style={[styles.reportText, { color: theme.custom.textPrimary }]}>{t('reports.spent')}: {report.totalPointsSpent}</Text>
            <Text style={[styles.reportText, { color: theme.custom.textPrimary }]}>{t('reports.activeBalance')}: {report.activeBalance}</Text>
          </>
        ) : (
          <Text style={[styles.emptyText, { color: theme.custom.textSecondary }]}>{t('reports.empty')}</Text>
        )}
      </Card.Content>
    </Card>
  );
}
