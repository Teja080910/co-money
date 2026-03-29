import React from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const { authUser, theme, styles, displayName, navigation, wallet, transactions, customerUsers, availableShops, filteredCustomers, merchants, customers, shops, report, representatives, renderSummaryMetric } = context;
  const safeTransactions = transactions ?? [];
  const safeCustomerUsers = customerUsers ?? [];
  const safeAvailableShops = availableShops ?? [];
  const safeFilteredCustomers = filteredCustomers ?? [];
  const safeMerchants = merchants ?? [];
  const safeCustomers = customers ?? [];
  const safeShops = shops ?? [];
  const safeRepresentatives = representatives ?? [];
  const canManagePromotions = authUser.role === UserRole.MERCHANT || authUser.role === UserRole.ADMIN;

  if (!authUser) {
    return null;
  }

  if (authUser.role === UserRole.CUSTOMER) {
    return (
      <>
        <Card style={[styles.card, { backgroundColor: theme.custom.surfaceStrong }]} mode="elevated">
          <Card.Content>
            <Text style={[styles.heroEyebrow, { color: theme.custom.textSecondary }]}>{t('overview.customer.welcomeBack')}</Text>
            <Text style={[styles.heroTitle, { color: theme.custom.textPrimary }]}>{displayName}</Text>
            <Text style={[styles.heroSubtitle, { color: theme.custom.textSecondary }]}>{t('overview.customer.subtitle')}</Text>
            <Button mode="contained" onPress={() => navigation.navigate('CustomerQr')} style={styles.primaryAction}>{t('overview.customer.qrCta')}</Button>
          </Card.Content>
        </Card>
        <View style={styles.metricGrid}>
          {renderSummaryMetric(t('overview.customer.metrics.currentBalance'), wallet?.balance ?? 0)}
          {renderSummaryMetric(t('overview.customer.metrics.transactions'), safeTransactions.length)}
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
          {renderSummaryMetric(t('overview.merchant.metrics.customers'), safeCustomerUsers.length)}
          {renderSummaryMetric(t('overview.merchant.metrics.myShops'), safeAvailableShops.length)}
          {renderSummaryMetric(t('overview.merchant.metrics.transactions'), safeTransactions.length)}
        </View>
        <Button mode="contained" onPress={() => navigation.navigate('MerchantScan')} style={styles.primaryAction}>{t('overview.merchant.scanQr')}</Button>
        <View style={{ marginTop: 8 }}>
          <UserListSection context={context} title={t('overview.merchant.recentCustomersTitle')} subtitle={t('overview.merchant.recentCustomersSubtitle')} users={safeFilteredCustomers.slice(0, 5)} />
        </View>
        <PromotionsSection context={context} editable={canManagePromotions} />
        <EventsSection context={context} editable={false} />
      </>
    );
  }

  if (authUser.role === UserRole.REPRESENTATIVE) {
    return (
      <>
        <View style={styles.metricGrid}>
          {renderSummaryMetric(t('overview.representative.metrics.merchants'), safeMerchants.length)}
          {renderSummaryMetric(t('overview.representative.metrics.customers'), safeCustomers.length)}
          {renderSummaryMetric(t('overview.representative.metrics.transactions'), safeTransactions.length)}
          {renderSummaryMetric(t('overview.representative.metrics.shops'), safeShops.length)}
        </View>
        <ShopManagementSection context={context} title={t('overview.representative.shopManagementTitle')} subtitle={t('overview.representative.shopManagementSubtitle')} />
        <PromotionsSection context={context} editable={canManagePromotions} />
        {report ? (
          <Card style={[styles.card, { backgroundColor: theme.custom.surfaceStrong }]} mode="elevated">
            <Card.Title title={t('overview.representative.snapshotTitle')} subtitle={t('overview.representative.snapshotSubtitle')} />
            <Card.Content>
              <Text style={[styles.reportText, { color: theme.custom.textPrimary }]}>{t('overview.representative.issued')}: {report.totalPointsIssued}</Text>
              <Text style={[styles.reportText, { color: theme.custom.textPrimary }]}>{t('reports.cashedIn')}: {report.totalPointsSpent}</Text>
              <Text style={[styles.reportText, { color: theme.custom.textPrimary }]}>{t('reports.monthlyIssued')}: {report.monthlyPointsIssued ?? 0}</Text>
              <Text style={[styles.reportText, { color: theme.custom.textPrimary }]}>{t('reports.monthlySpent')}: {report.monthlyPointsSpent ?? 0}</Text>
              <Text style={[styles.reportText, { color: theme.custom.textPrimary }]}>{t('overview.representative.activeBalance')}: {report.activeBalance}</Text>
            </Card.Content>
          </Card>
        ) : null}
      </>
    );
  }

  return (
    <>
      <View style={styles.metricGrid}>
        {renderSummaryMetric(t('overview.admin.metrics.representatives'), safeRepresentatives.length)}
        {renderSummaryMetric(t('overview.admin.metrics.merchants'), safeMerchants.length)}
        {renderSummaryMetric(t('overview.admin.metrics.customers'), safeCustomers.length)}
        {renderSummaryMetric(t('overview.admin.metrics.transactions'), safeTransactions.length)}
      </View>
      {report ? (
        <Card style={[styles.card, { backgroundColor: theme.custom.surfaceStrong }]} mode="elevated">
          <Card.Title title={t('overview.admin.summaryTitle')} subtitle={t('overview.admin.summarySubtitle')} />
          <Card.Content>
            <Text style={[styles.reportText, { color: theme.custom.textPrimary }]}>{t('reports.customers')}: {report.totalCustomers} | {t('reports.shops')}: {report.totalShops}</Text>
            <Text style={[styles.reportText, { color: theme.custom.textPrimary }]}>{t('reports.issued')}: {report.totalPointsIssued} | {t('reports.cashedIn')}: {report.totalPointsSpent}</Text>
            <Text style={[styles.reportText, { color: theme.custom.textPrimary }]}>{t('reports.monthlyIssued')}: {report.monthlyPointsIssued ?? 0} | {t('reports.monthlySpent')}: {report.monthlyPointsSpent ?? 0}</Text>
            <Text style={[styles.reportText, { color: theme.custom.textPrimary }]}>{t('reports.activeBalance')}: {report.activeBalance}</Text>
          </Card.Content>
        </Card>
      ) : null}
      <UserListSection context={context} title={t('overview.admin.recentRepresentativesTitle')} subtitle={t('overview.admin.recentRepresentativesSubtitle')} users={safeRepresentatives.slice(0, 4)} />
      <UserListSection context={context} title={t('overview.admin.recentMerchantsTitle')} subtitle={t('overview.admin.recentMerchantsSubtitle')} users={safeMerchants.slice(0, 4)} />
      <UserListSection context={context} title={t('overview.admin.recentCustomersTitle')} subtitle={t('overview.admin.recentCustomersSubtitle')} users={safeCustomers.slice(0, 4)} />
    </>
  );
}
