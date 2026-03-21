import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, Card, Chip, List, useTheme } from 'react-native-paper';
import { AppScreen } from '../components/app/AppScreen';
import { SummaryCard } from '../components/app/SummaryCard';
import { useSession } from '../context/SessionContext';
import { ScreenProps } from '../navigation/types';
import type { AppTheme } from '../theme/theme';

export function HomeScreen({ navigation }: ScreenProps<'Home'>) {
  const theme = useTheme<AppTheme>();
  const { user, overview, loading, logout, refresh } = useSession();

  if (!user || !overview) {
    return (
      <AppScreen title="Co-Money" subtitle="Loading dashboard">
        <Card style={styles.card}>
          <Card.Content>
            <Text style={{ color: theme.custom.textPrimary }}>The dashboard is preparing your workspace.</Text>
          </Card.Content>
        </Card>
      </AppScreen>
    );
  }

  const metricEntries = Object.entries(overview.metrics).slice(0, 4);
  const quickActions =
    user.role === 'customer'
      ? [
          { label: 'Wallet', route: 'Wallet' as const },
          { label: 'QR', route: 'QR' as const },
          { label: 'Transactions', route: 'Transactions' as const },
          { label: 'Promotions', route: 'Promotions' as const },
          { label: 'Shops', route: 'Shops' as const },
        ]
      : user.role === 'merchant'
        ? [
            { label: 'Merchant tools', route: 'MerchantTransactions' as const },
            { label: 'Promotions', route: 'Promotions' as const },
            { label: 'Transactions', route: 'Transactions' as const },
            { label: 'Shops', route: 'Shops' as const },
          ]
        : user.role === 'representative'
          ? [
              { label: 'Transactions', route: 'Transactions' as const },
              { label: 'Promotions', route: 'Promotions' as const },
              { label: 'Shops', route: 'Shops' as const },
              { label: 'Reports', route: 'AdminReports' as const },
            ]
          : [
              { label: 'Users', route: 'AdminUsers' as const },
              { label: 'Events', route: 'AdminEvents' as const },
              { label: 'Reports', route: 'AdminReports' as const },
              { label: 'Promotions', route: 'Promotions' as const },
            ];

  return (
    <AppScreen
      title={`${user.fullName}`}
      subtitle={`${user.role.toUpperCase()} workspace`}
      onRefresh={refresh}
      refreshing={loading}
      actions={<Button onPress={async () => {
        await logout();
        navigation.replace('Login');
      }}>Logout</Button>}
    >
      <Card style={[styles.hero, { backgroundColor: theme.custom.surfaceStrong }]}>
        <Card.Content style={styles.heroContent}>
          <Chip compact style={{ alignSelf: 'flex-start' }}>
            Circular loyalty engine
          </Chip>
          <Text style={[styles.heroTitle, { color: theme.custom.textPrimary }]}>
            Buy in one shop, earn rewards, and spend them across the network.
          </Text>
          <Text style={[styles.heroBody, { color: theme.custom.textSecondary }]}>
            Same-shop redemption is blocked in backend logic, max discounts are enforced, and first-time shop visits add a bonus.
          </Text>
        </Card.Content>
      </Card>

      <View style={styles.metricsRow}>
        {metricEntries.map(([label, value], index) => (
          <SummaryCard
            key={label}
            label={label.replace(/([A-Z])/g, ' $1')}
            tone={index % 2 === 0 ? 'brand' : 'accent'}
            value={`${value}`}
          />
        ))}
      </View>

      <Card style={styles.card}>
        <Card.Title title="Quick actions" />
        <Card.Content style={styles.actionWrap}>
          {quickActions.map(action => (
            <Button key={action.label} mode="contained-tonal" onPress={() => navigation.navigate(action.route)} style={styles.actionButton}>
              {action.label}
            </Button>
          ))}
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title title="Recent activity" />
        <Card.Content>
          {overview.recentTransactions.map(transaction => (
            <List.Item
              key={transaction.id}
              description={`${transaction.shopName} • payable ${transaction.payableAmount} • earned ${transaction.earnedPoints}`}
              title={`${transaction.totalAmount} total • used ${transaction.spentPoints} points`}
            />
          ))}
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title title="Upcoming events" />
        <Card.Content>
          {overview.events.map(event => (
            <List.Item key={event.id} description={`${event.venue} • ${new Date(event.startsAt).toLocaleString()}`} title={event.title} />
          ))}
        </Card.Content>
      </Card>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: 28,
  },
  heroContent: {
    gap: 14,
  },
  heroTitle: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '800',
  },
  heroBody: {
    fontSize: 15,
    lineHeight: 22,
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    borderRadius: 24,
  },
  actionWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionButton: {
    borderRadius: 16,
  },
});
