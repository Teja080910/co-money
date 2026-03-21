import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card, useTheme } from 'react-native-paper';
import type { AppTheme } from '../../theme/theme';

type Props = {
  label: string;
  value: string;
  tone?: 'brand' | 'accent';
};

export function SummaryCard({ label, value, tone = 'brand' }: Props) {
  const theme = useTheme<AppTheme>();
  const accent = tone === 'brand' ? theme.custom.brand : theme.custom.accent;

  return (
    <Card style={[styles.card, { backgroundColor: theme.custom.surfaceStrong }]}>
      <Card.Content>
        <View style={[styles.dot, { backgroundColor: accent }]} />
        <Text style={[styles.label, { color: theme.custom.textSecondary }]}>{label}</Text>
        <Text style={[styles.value, { color: theme.custom.textPrimary }]}>{value}</Text>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 24,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 999,
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    marginBottom: 8,
  },
  value: {
    fontSize: 24,
    fontWeight: '800',
  },
});
