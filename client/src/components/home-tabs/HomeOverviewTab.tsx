import React from 'react';
import { Text, View } from 'react-native';
import { Button, Card } from 'react-native-paper';
import { UserRole } from '../../constants/userRoles';
import {
  EventsSection,
  PromotionsSection,
  ShopDirectorySection,
  ShopManagementSection,
  UserListSection,
} from './ManagementSections';

type Props = {
  context: any;
};

export function HomeOverviewTab({ context }: Props) {
  const { authUser, theme, styles, displayName, navigation, wallet, transactions, customerUsers, availableShops, filteredCustomers, merchants, customers, shops, report, representatives, renderSummaryMetric } = context;
  const safeTransactions = transactions ?? [];
  const safeCustomerUsers = customerUsers ?? [];
  const safeAvailableShops = availableShops ?? [];
  const safeFilteredCustomers = filteredCustomers ?? [];
  const safeMerchants = merchants ?? [];
  const safeCustomers = customers ?? [];
  const safeShops = shops ?? [];
  const safeRepresentatives = representatives ?? [];

  if (!authUser) {
    return null;
  }

  if (authUser.role === UserRole.CUSTOMER) {
    return (
      <>
        <Card style={[styles.card, { backgroundColor: theme.custom.surfaceStrong }]} mode="elevated">
          <Card.Content>
            <Text style={[styles.heroEyebrow, { color: theme.custom.textSecondary }]}>Welcome back</Text>
            <Text style={[styles.heroTitle, { color: theme.custom.textPrimary }]}>{displayName}</Text>
            <Text style={[styles.heroSubtitle, { color: theme.custom.textSecondary }]}>Your wallet is ready for earning and spending across local shops.</Text>
            <Button mode="contained" onPress={() => navigation.navigate('CustomerQr')} style={styles.primaryAction}>Show My QR Code</Button>
          </Card.Content>
        </Card>
        <View style={styles.metricGrid}>
          {renderSummaryMetric('Current Balance', wallet?.balance ?? 0)}
          {renderSummaryMetric('Transactions', safeTransactions.length)}
        </View>
        <PromotionsSection context={context} editable={false} />
        <ShopDirectorySection context={context} />
        <EventsSection context={context} editable={false} />
      </>
    );
  }

  if (authUser.role === UserRole.MERCHANT) {
    return (
      <>
        <View style={styles.metricGrid}>
          {renderSummaryMetric('Customers', safeCustomerUsers.length)}
          {renderSummaryMetric('My Shops', safeAvailableShops.length)}
          {renderSummaryMetric('Transactions', safeTransactions.length)}
        </View>
        <Button mode="contained" onPress={() => navigation.navigate('MerchantScan')} style={styles.primaryAction}>Scan Customer QR</Button>
        <UserListSection context={context} title="Recent Customers" subtitle="Customers available for point assignment" users={safeFilteredCustomers.slice(0, 5)} />
        <PromotionsSection context={context} editable />
        <EventsSection context={context} editable={false} />
      </>
    );
  }

  if (authUser.role === UserRole.REPRESENTATIVE) {
    return (
      <>
        <View style={styles.metricGrid}>
          {renderSummaryMetric('Merchants', safeMerchants.length)}
          {renderSummaryMetric('Customers', safeCustomers.length)}
          {renderSummaryMetric('Transactions', safeTransactions.length)}
          {renderSummaryMetric('Shops', safeShops.length)}
        </View>
        <ShopManagementSection context={context} title="Shop Management" subtitle="Representatives can add, update, activate, and deactivate shop records" />
        <PromotionsSection context={context} editable />
        {report ? (
          <Card style={[styles.card, { backgroundColor: theme.custom.surfaceStrong }]} mode="elevated">
            <Card.Title title="Operational Snapshot" subtitle="Representative reporting" />
            <Card.Content>
              <Text style={[styles.reportText, { color: theme.custom.textPrimary }]}>Total points issued: {report.totalPointsIssued}</Text>
              <Text style={[styles.reportText, { color: theme.custom.textPrimary }]}>Total points spent: {report.totalPointsSpent}</Text>
              <Text style={[styles.reportText, { color: theme.custom.textPrimary }]}>Active balance: {report.activeBalance}</Text>
            </Card.Content>
          </Card>
        ) : null}
      </>
    );
  }

  return (
    <>
      <View style={styles.metricGrid}>
        {renderSummaryMetric('Representatives', safeRepresentatives.length)}
        {renderSummaryMetric('Merchants', safeMerchants.length)}
        {renderSummaryMetric('Customers', safeCustomers.length)}
        {renderSummaryMetric('Transactions', safeTransactions.length)}
      </View>
      {report ? (
        <Card style={[styles.card, { backgroundColor: theme.custom.surfaceStrong }]} mode="elevated">
          <Card.Title title="Executive Summary" subtitle="Admin reporting" />
          <Card.Content>
            <Text style={[styles.reportText, { color: theme.custom.textPrimary }]}>Customers: {report.totalCustomers} | Shops: {report.totalShops}</Text>
            <Text style={[styles.reportText, { color: theme.custom.textPrimary }]}>Issued: {report.totalPointsIssued} | Spent: {report.totalPointsSpent}</Text>
            <Text style={[styles.reportText, { color: theme.custom.textPrimary }]}>Active Balance: {report.activeBalance}</Text>
          </Card.Content>
        </Card>
      ) : null}
      <UserListSection context={context} title="Recent Representatives" subtitle="Latest internal representative accounts" users={safeRepresentatives.slice(0, 4)} />
      <UserListSection context={context} title="Recent Merchants" subtitle="Managed merchant accounts" users={safeMerchants.slice(0, 4)} />
      <UserListSection context={context} title="Recent Customers" subtitle="Newest customer accounts in the network" users={safeCustomers.slice(0, 4)} />
    </>
  );
}
