import React from 'react';
import { Text } from 'react-native';
import { Card } from 'react-native-paper';

type Props = {
  context: any;
};

export function ReportsTab({ context }: Props) {
  const { theme, styles, report } = context;

  return (
    <Card style={[styles.card, { backgroundColor: theme.custom.surfaceStrong }]} mode="elevated">
      <Card.Title title="Reports" subtitle="Role-based reporting summary" />
      <Card.Content>
        {report ? (
          <>
            <Text style={[styles.reportText, { color: theme.custom.textPrimary }]}>Customers: {report.totalCustomers}</Text>
            <Text style={[styles.reportText, { color: theme.custom.textPrimary }]}>Shops: {report.totalShops}</Text>
            <Text style={[styles.reportText, { color: theme.custom.textPrimary }]}>Issued: {report.totalPointsIssued}</Text>
            <Text style={[styles.reportText, { color: theme.custom.textPrimary }]}>Spent: {report.totalPointsSpent}</Text>
            <Text style={[styles.reportText, { color: theme.custom.textPrimary }]}>Active Balance: {report.activeBalance}</Text>
          </>
        ) : (
          <Text style={[styles.emptyText, { color: theme.custom.textSecondary }]}>No report data available.</Text>
        )}
      </Card.Content>
    </Card>
  );
}
