import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Keyboard,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ActivityIndicator, BottomNavigation, Button, Card, Chip, Divider, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import type { ScreenProps } from '../navigation/types';
import { apiClient } from '../services/api';
import { clearAuthenticatedUser, getAuthenticatedUser, type AuthUser } from '../services/auth';
import type { AppTheme } from '../theme/theme';

type WalletTransaction = {
  id: string;
  walletId: string;
  customerId: string;
  merchantId: string;
  performedByUserId: string;
  shopId: string;
  fromShopId: string | null;
  toShopId: string | null;
  type: 'EARN' | 'SPEND' | 'ADJUSTMENT';
  pointType: 'STANDARD' | 'BONUS';
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  points: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string | null;
  createdAt: string;
};

type WalletResponse = {
  customer: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    role: string;
  };
  wallet: {
    id: string;
    customerId: string;
  };
  balance: number;
  pointsBreakdown: Array<{
    pointType: 'STANDARD' | 'BONUS';
    balance: number;
  }>;
  recentTransactions: WalletTransaction[];
};

type Shop = {
  id: string;
  name: string;
  location: string;
  description: string | null;
  merchantId: string;
  representativeId: string | null;
  isActive: boolean;
};

type UserSummary = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  username: string;
  email: string;
  role: AuthUser['role'];
  emailVerified: boolean;
};

type ReportSummary = {
  totalCustomers: number;
  totalShops: number;
  totalPointsIssued: number;
  totalPointsSpent: number;
  activeBalance: number;
};

type NavRoute = {
  key: string;
  title: string;
  focusedIcon: string;
  unfocusedIcon: string;
};

const roleTitles: Record<AuthUser['role'], string> = {
  CUSTOMER: 'Customer App',
  MERCHANT: 'Merchant Console',
  REPRESENTATIVE: 'Representative Workspace',
  ADMIN: 'Admin Dashboard',
};

const transactionTypeOptions = ['ALL', 'EARN', 'SPEND'];
const transactionStatusOptions = ['ALL', 'SUCCESS', 'PENDING', 'FAILED'];
const pointTypeOptions: Array<'STANDARD' | 'BONUS'> = ['STANDARD', 'BONUS'];

function getRoutesForRole(role: AuthUser['role']): NavRoute[] {
  switch (role) {
    case 'CUSTOMER':
      return [
        { key: 'home', title: 'Home', focusedIcon: 'home', unfocusedIcon: 'home-outline' },
        { key: 'wallet', title: 'Wallet', focusedIcon: 'wallet', unfocusedIcon: 'wallet-outline' },
        { key: 'transactions', title: 'History', focusedIcon: 'history', unfocusedIcon: 'history' },
        { key: 'profile', title: 'Profile', focusedIcon: 'account', unfocusedIcon: 'account-outline' },
      ];
    case 'MERCHANT':
      return [
        { key: 'home', title: 'Home', focusedIcon: 'store', unfocusedIcon: 'store-outline' },
        { key: 'customers', title: 'Customers', focusedIcon: 'account-group', unfocusedIcon: 'account-group-outline' },
        { key: 'add-points', title: 'Add Points', focusedIcon: 'plus-circle', unfocusedIcon: 'plus-circle-outline' },
        { key: 'transactions', title: 'Transactions', focusedIcon: 'receipt-text', unfocusedIcon: 'receipt-text-outline' },
        { key: 'profile', title: 'Profile', focusedIcon: 'account', unfocusedIcon: 'account-outline' },
      ];
    case 'REPRESENTATIVE':
      return [
        { key: 'home', title: 'Home', focusedIcon: 'home-city', unfocusedIcon: 'home-city-outline' },
        { key: 'merchants', title: 'Merchants', focusedIcon: 'storefront', unfocusedIcon: 'storefront-outline' },
        { key: 'customers', title: 'Customers', focusedIcon: 'account-group', unfocusedIcon: 'account-group-outline' },
        { key: 'transactions', title: 'Transactions', focusedIcon: 'history', unfocusedIcon: 'history' },
        { key: 'profile', title: 'Profile', focusedIcon: 'account', unfocusedIcon: 'account-outline' },
      ];
    case 'ADMIN':
      return [
        { key: 'dashboard', title: 'Dashboard', focusedIcon: 'view-dashboard', unfocusedIcon: 'view-dashboard-outline' },
        { key: 'representatives', title: 'Representatives', focusedIcon: 'badge-account', unfocusedIcon: 'badge-account-outline' },
        { key: 'merchants', title: 'Merchants', focusedIcon: 'storefront', unfocusedIcon: 'storefront-outline' },
        { key: 'customers', title: 'Customers', focusedIcon: 'account-group', unfocusedIcon: 'account-group-outline' },
        { key: 'reports', title: 'Reports', focusedIcon: 'chart-box', unfocusedIcon: 'chart-box-outline' },
      ];
  }
}

export function HomeScreen({ navigation, route }: ScreenProps<'Home'>) {
  const theme = useTheme<AppTheme>();
  const insets = useSafeAreaInsets();
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [wallet, setWallet] = useState<WalletResponse | null>(null);
  const [selectedCustomerWallet, setSelectedCustomerWallet] = useState<WalletResponse | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [customers, setCustomers] = useState<UserSummary[]>([]);
  const [merchants, setMerchants] = useState<UserSummary[]>([]);
  const [representatives, setRepresentatives] = useState<UserSummary[]>([]);
  const [report, setReport] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [routeIndex, setRouteIndex] = useState(0);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedShopId, setSelectedShopId] = useState('');
  const [points, setPoints] = useState('');
  const [description, setDescription] = useState('');
  const [pointType, setPointType] = useState<'STANDARD' | 'BONUS'>('STANDARD');
  const [shopName, setShopName] = useState('');
  const [shopLocation, setShopLocation] = useState('');
  const [shopDescription, setShopDescription] = useState('');
  const [shopMerchantId, setShopMerchantId] = useState('');
  const [editingShopId, setEditingShopId] = useState('');
  const [shopSubmitting, setShopSubmitting] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [transactionTypeFilter, setTransactionTypeFilter] = useState('ALL');
  const [transactionStatusFilter, setTransactionStatusFilter] = useState('ALL');

  const routes = useMemo(() => (authUser ? getRoutesForRole(authUser.role) : []), [authUser]);
  const activeRouteKey = routes[routeIndex]?.key || 'home';

  const displayName = useMemo(() => {
    if (!authUser) {
      return '';
    }

    return [authUser.firstName, authUser.lastName].filter(Boolean).join(' ') || authUser.username;
  }, [authUser]);

  const customerUsers = useMemo(
    () => customers.filter(customer => customer.role === 'CUSTOMER'),
    [customers],
  );

  const selectedCustomer = useMemo(
    () => customerUsers.find(customer => customer.id === selectedCustomerId) || null,
    [customerUsers, selectedCustomerId],
  );

  const merchantNameMap = useMemo(() => {
    return merchants.reduce<Record<string, string>>((acc, merchant) => {
      acc[merchant.id] = [merchant.firstName, merchant.lastName].filter(Boolean).join(' ') || merchant.username;
      return acc;
    }, {});
  }, [merchants]);

  const availableShops = useMemo(() => {
    if (!authUser) {
      return shops;
    }

    if (authUser.role === 'MERCHANT') {
      return shops.filter(shop => shop.merchantId === authUser.id);
    }

    return shops;
  }, [authUser, shops]);

  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) {
      return customerUsers;
    }

    const query = customerSearch.trim().toLowerCase();
    return customerUsers.filter(customer => {
      const fullName = [customer.firstName, customer.lastName].filter(Boolean).join(' ').toLowerCase();
      return (
        customer.username.toLowerCase().includes(query) ||
        customer.email.toLowerCase().includes(query) ||
        fullName.includes(query)
      );
    });
  }, [customerSearch, customerUsers]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      const matchesType = transactionTypeFilter === 'ALL' ? true : transaction.type === transactionTypeFilter;
      const matchesStatus = transactionStatusFilter === 'ALL' ? true : transaction.status === transactionStatusFilter;
      return matchesType && matchesStatus;
    });
  }, [transactionStatusFilter, transactionTypeFilter, transactions]);

  const fetchSelectedCustomerWallet = useCallback(async (customerId: string) => {
    if (!customerId.trim() || !authUser || authUser.role === 'CUSTOMER') {
      setSelectedCustomerWallet(null);
      return;
    }

    try {
      const response = await apiClient.get<WalletResponse>(`/api/wallet/customer/${customerId.trim()}`);
      setSelectedCustomerWallet(response.data);
    } catch {
      setSelectedCustomerWallet(null);
    }
  }, [authUser]);

  const loadDashboard = useCallback(async () => {
    setError(null);

    const storedUser = await getAuthenticatedUser();
    if (!storedUser) {
      navigation.replace('Login');
      return;
    }

    setAuthUser(storedUser);

    try {
      if (storedUser.role === 'CUSTOMER') {
        const [walletResponse, transactionsResponse] = await Promise.all([
          apiClient.get<WalletResponse>('/api/wallet/me'),
          apiClient.get<WalletTransaction[]>('/api/wallet/transactions'),
        ]);

        setWallet(walletResponse.data);
        setTransactions(transactionsResponse.data);
        setCustomers([]);
        setMerchants([]);
        setRepresentatives([]);
        setShops([]);
        setReport(null);
      } else {
        const requests: Array<Promise<any>> = [
          apiClient.get<WalletTransaction[]>('/api/wallet/transactions'),
          apiClient.get<UserSummary[]>('/api/users/customers'),
          apiClient.get<Shop[]>('/api/shops'),
        ];

        if (storedUser.role === 'REPRESENTATIVE' || storedUser.role === 'ADMIN') {
          requests.push(apiClient.get<UserSummary[]>('/api/users/merchants'));
          requests.push(apiClient.get<ReportSummary>('/api/wallet/reports/summary'));
        }

        if (storedUser.role === 'ADMIN') {
          requests.push(apiClient.get<UserSummary[]>('/api/users/representatives'));
        }

        const responses = await Promise.all(requests);
        setTransactions(responses[0].data);
        setCustomers(responses[1].data);
        setShops(responses[2].data);
        setWallet(null);
        setMerchants(storedUser.role === 'REPRESENTATIVE' || storedUser.role === 'ADMIN' ? responses[3].data : []);
        setReport(
          storedUser.role === 'REPRESENTATIVE'
            ? responses[4].data
            : storedUser.role === 'ADMIN'
              ? responses[4].data
              : null,
        );
        setRepresentatives(storedUser.role === 'ADMIN' ? responses[5].data : []);
      }
    } catch (loadError: any) {
      setError(loadError?.response?.data?.error || 'Unable to load dashboard data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [navigation]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    void fetchSelectedCustomerWallet(selectedCustomerId);
  }, [fetchSelectedCustomerWallet, selectedCustomerId]);

  useEffect(() => {
    if (!selectedShopId && availableShops.length && authUser?.role === 'MERCHANT') {
      setSelectedShopId(availableShops[0].id);
    }
  }, [authUser?.role, availableShops, selectedShopId]);

  useEffect(() => {
    if (
      (!shopMerchantId || !merchants.some(merchant => merchant.id === shopMerchantId)) &&
      merchants.length &&
      (authUser?.role === 'REPRESENTATIVE' || authUser?.role === 'ADMIN')
    ) {
      setShopMerchantId(merchants[0].id);
    }
  }, [authUser?.role, merchants, shopMerchantId]);

  useEffect(() => {
    if (route.params?.selectedCustomerId) {
      setSelectedCustomerId(route.params.selectedCustomerId);
      const addPointsIndex = routes.findIndex(item => item.key === 'add-points');
      const customersIndex = routes.findIndex(item => item.key === 'customers');
      const nextIndex = addPointsIndex >= 0 ? addPointsIndex : customersIndex >= 0 ? customersIndex : 0;
      setRouteIndex(nextIndex);
    }
  }, [route.params?.selectedCustomerId, routes]);

  useEffect(() => {
    setError(null);
    setSuccessMessage(null);
  }, [activeRouteKey]);

  const onLogout = async () => {
    await clearAuthenticatedUser();
    navigation.replace('Login');
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboard();
  };

  const resetShopForm = () => {
    setEditingShopId('');
    setShopName('');
    setShopLocation('');
    setShopDescription('');
    setShopMerchantId(merchants[0]?.id || '');
  };

  const handleAddPoints = async () => {
    if (!selectedCustomerId.trim()) {
      setError('Select a customer before adding points.');
      return;
    }

    if (!selectedShopId.trim()) {
      setError('Select a shop before adding points.');
      return;
    }

    if (!points.trim() || Number(points) <= 0) {
      setError('Enter a valid points amount.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await apiClient.post('/api/wallet/earn', {
        customerId: selectedCustomerId.trim(),
        shopId: selectedShopId.trim(),
        points: Number(points),
        pointType,
        description: description.trim() || undefined,
      });

      setSuccessMessage('Points added successfully.');
      setPoints('');
      setDescription('');
      await loadDashboard();
      await fetchSelectedCustomerWallet(selectedCustomerId);
    } catch (submitError: any) {
      setError(submitError?.response?.data?.error || 'Unable to add points.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditShop = (shop: Shop) => {
    setEditingShopId(shop.id);
    setShopName(shop.name);
    setShopLocation(shop.location);
    setShopDescription(shop.description || '');
    setShopMerchantId(shop.merchantId);
    setSuccessMessage(null);
    setError(null);
  };

  const handleSaveShop = async () => {
    const resolvedMerchantId = shopMerchantId.trim() || merchants[0]?.id || '';

    if (!shopName.trim()) {
      setError('Shop name is required.');
      return;
    }

    if (!shopLocation.trim()) {
      setError('Shop location is required.');
      return;
    }

    if (!resolvedMerchantId) {
      setError('Select a merchant for the shop.');
      return;
    }

    setShopSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    const payload = {
      name: shopName.trim(),
      location: shopLocation.trim(),
      description: shopDescription.trim() || undefined,
      merchantId: resolvedMerchantId,
    };

    try {
      if (editingShopId) {
        await apiClient.put(`/api/shops/${editingShopId}`, payload);
        setSuccessMessage('Shop updated successfully.');
      } else {
        await apiClient.post('/api/shops', payload);
        setSuccessMessage('Shop created successfully.');
      }

      resetShopForm();
      await loadDashboard();
    } catch (submitError: any) {
      setError(submitError?.response?.data?.error || 'Unable to save shop.');
    } finally {
      setShopSubmitting(false);
    }
  };

  const handleDeleteShop = async (shopId: string) => {
    setShopSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await apiClient.delete(`/api/shops/${shopId}`);
      if (editingShopId === shopId) {
        resetShopForm();
      }
      setSuccessMessage('Shop deleted successfully.');
      await loadDashboard();
    } catch (deleteError: any) {
      setError(deleteError?.response?.data?.error || 'Unable to delete shop.');
    } finally {
      setShopSubmitting(false);
    }
  };

  const renderSummaryMetric = (label: string, value: string | number) => (
    <View style={[styles.metricBox, { backgroundColor: theme.custom.surfaceStrong, borderColor: theme.custom.border }]}>
      <Text style={[styles.metricLabel, { color: theme.custom.textSecondary }]}>{label}</Text>
      <Text style={[styles.metricValue, { color: theme.custom.textPrimary }]}>{value}</Text>
    </View>
  );

  const renderTransactionList = () => (
    <Card style={[styles.card, { backgroundColor: theme.custom.surfaceStrong }]} mode="elevated">
      <Card.Title title="Transactions" subtitle="Track earn and spend activity" />
      <Card.Content>
        <View style={styles.filterRow}>
          {transactionTypeOptions.map(option => (
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
          {transactionStatusOptions.map(option => (
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
          filteredTransactions.map(transaction => (
            <View key={transaction.id} style={styles.listItem}>
              <Text style={[styles.listTitle, { color: theme.custom.textPrimary }]}>
                {transaction.type} {transaction.points} pts
              </Text>
              <Text style={[styles.listMeta, { color: theme.custom.textSecondary }]}>
                {transaction.pointType} • {transaction.status}
              </Text>
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

  const renderUserList = (title: string, subtitle: string, users: UserSummary[]) => (
    <Card style={[styles.card, { backgroundColor: theme.custom.surfaceStrong }]} mode="elevated">
      <Card.Title title={title} subtitle={subtitle} />
      <Card.Content>
        {users.length ? (
          users.map(user => (
            <View key={user.id} style={styles.listItem}>
              <Text style={[styles.listTitle, { color: theme.custom.textPrimary }]}>
                {[user.firstName, user.lastName].filter(Boolean).join(' ') || user.username}
              </Text>
              <Text style={[styles.listMeta, { color: theme.custom.textSecondary }]}>{user.email}</Text>
            </View>
          ))
        ) : (
          <Text style={[styles.emptyText, { color: theme.custom.textSecondary }]}>No records available.</Text>
        )}
      </Card.Content>
    </Card>
  );

  const renderShopManagementContent = (title: string, subtitle: string) => (
    <>
      <Card style={[styles.card, { backgroundColor: theme.custom.surfaceStrong }]} mode="elevated">
        <Card.Title title={title} subtitle={subtitle} />
        <Card.Content>
          <TextInput
            placeholder="Shop name"
            placeholderTextColor={theme.custom.textSecondary}
            style={[styles.input, { borderColor: theme.custom.border, color: theme.custom.textPrimary }]}
            value={shopName}
            onChangeText={setShopName}
          />
          <TextInput
            placeholder="Location"
            placeholderTextColor={theme.custom.textSecondary}
            style={[styles.input, { borderColor: theme.custom.border, color: theme.custom.textPrimary }]}
            value={shopLocation}
            onChangeText={setShopLocation}
          />
          <TextInput
            placeholder="Description"
            placeholderTextColor={theme.custom.textSecondary}
            style={[styles.input, { borderColor: theme.custom.border, color: theme.custom.textPrimary }]}
            value={shopDescription}
            onChangeText={setShopDescription}
          />

          <Text style={[styles.sectionLabel, { color: theme.custom.textSecondary }]}>Merchant</Text>
          <View style={styles.filterRow}>
            {merchants.map(merchant => (
              <Chip
                key={merchant.id}
                selected={shopMerchantId === merchant.id}
                mode={shopMerchantId === merchant.id ? 'flat' : 'outlined'}
                onPress={() => setShopMerchantId(merchant.id)}
                style={styles.filterChip}
              >
                {[merchant.firstName, merchant.lastName].filter(Boolean).join(' ') || merchant.username}
              </Chip>
            ))}
          </View>

          <View style={styles.actionRow}>
            <Button
              mode="contained"
              loading={shopSubmitting}
              onPress={() => void handleSaveShop()}
              style={styles.inlineActionButton}
            >
              {editingShopId ? 'Update Shop' : 'Add Shop'}
            </Button>
            {editingShopId ? (
              <Button mode="outlined" onPress={resetShopForm} style={styles.inlineActionButton}>
                Cancel
              </Button>
            ) : null}
          </View>
        </Card.Content>
      </Card>

      <Card style={[styles.card, { backgroundColor: theme.custom.surfaceStrong }]} mode="elevated">
        <Card.Title title="Managed Shops" subtitle="Add, update, or delete assigned shops" />
        <Card.Content>
          {shops.length ? (
            shops.map(shop => (
              <View key={shop.id} style={styles.shopRow}>
                <View style={styles.shopRowBody}>
                  <Text style={[styles.listTitle, { color: theme.custom.textPrimary }]}>{shop.name}</Text>
                  <Text style={[styles.listMeta, { color: theme.custom.textSecondary }]}>{shop.location}</Text>
                  {shop.description ? (
                    <Text style={[styles.listMeta, { color: theme.custom.textSecondary }]}>{shop.description}</Text>
                  ) : null}
                  <Text style={[styles.listMeta, { color: theme.custom.textSecondary }]}>
                    Merchant: {merchantNameMap[shop.merchantId] || shop.merchantId}
                  </Text>
                </View>
                <View style={styles.shopActions}>
                  <Button compact mode="outlined" onPress={() => handleEditShop(shop)}>
                    Edit
                  </Button>
                  <Button compact mode="text" textColor={theme.custom.error} onPress={() => void handleDeleteShop(shop.id)}>
                    Delete
                  </Button>
                </View>
              </View>
            ))
          ) : (
            <Text style={[styles.emptyText, { color: theme.custom.textSecondary }]}>No shops available yet.</Text>
          )}
        </Card.Content>
      </Card>
    </>
  );

  const renderHomeContent = () => {
    if (!authUser) {
      return null;
    }

    if (authUser.role === 'CUSTOMER') {
      return (
        <>
          <Card style={[styles.card, { backgroundColor: theme.custom.surfaceStrong }]} mode="elevated">
            <Card.Content>
              <Text style={[styles.heroEyebrow, { color: theme.custom.textSecondary }]}>Welcome back</Text>
              <Text style={[styles.heroTitle, { color: theme.custom.textPrimary }]}>{displayName}</Text>
              <Text style={[styles.heroSubtitle, { color: theme.custom.textSecondary }]}>
                Your wallet is ready for earning and spending across local shops.
              </Text>
              <Button mode="contained" onPress={() => navigation.navigate('CustomerQr')} style={styles.primaryAction}>
                Show My QR Code
              </Button>
            </Card.Content>
          </Card>
          <View style={styles.metricGrid}>
            {renderSummaryMetric('Current Balance', wallet?.balance ?? 0)}
            {renderSummaryMetric('Transactions', transactions.length)}
          </View>
        </>
      );
    }

    if (authUser.role === 'MERCHANT') {
      return (
        <>
          <View style={styles.metricGrid}>
            {renderSummaryMetric('Customers', customerUsers.length)}
            {renderSummaryMetric('My Shops', availableShops.length)}
            {renderSummaryMetric('Transactions', transactions.length)}
          </View>
          <Button mode="contained" onPress={() => navigation.navigate('MerchantScan')} style={styles.primaryAction}>
            Scan Customer QR
          </Button>
          {renderUserList('Recent Customers', 'Customers available for point assignment', filteredCustomers.slice(0, 5))}
        </>
      );
    }

    if (authUser.role === 'REPRESENTATIVE') {
      return (
        <>
          <View style={styles.metricGrid}>
            {renderSummaryMetric('Merchants', merchants.length)}
            {renderSummaryMetric('Customers', customers.length)}
            {renderSummaryMetric('Transactions', transactions.length)}
            {renderSummaryMetric('Shops', shops.length)}
          </View>
          {renderShopManagementContent('Shop Management', 'Representatives can add, update, and delete shop records')}
          {report ? (
            <Card style={[styles.card, { backgroundColor: theme.custom.surfaceStrong }]} mode="elevated">
              <Card.Title title="Operational Snapshot" subtitle="Representative reporting" />
              <Card.Content>
                <Text style={[styles.reportText, { color: theme.custom.textPrimary }]}>
                  Total points issued: {report.totalPointsIssued}
                </Text>
                <Text style={[styles.reportText, { color: theme.custom.textPrimary }]}>
                  Total points spent: {report.totalPointsSpent}
                </Text>
                <Text style={[styles.reportText, { color: theme.custom.textPrimary }]}>
                  Active balance: {report.activeBalance}
                </Text>
              </Card.Content>
            </Card>
          ) : null}
        </>
      );
    }

    return (
      <>
        <View style={styles.metricGrid}>
          {renderSummaryMetric('Representatives', representatives.length)}
          {renderSummaryMetric('Merchants', merchants.length)}
          {renderSummaryMetric('Customers', customers.length)}
          {renderSummaryMetric('Transactions', transactions.length)}
        </View>
        {renderShopManagementContent('Shop Management', 'Admins can manage every shop record in the network')}
        {report ? (
          <Card style={[styles.card, { backgroundColor: theme.custom.surfaceStrong }]} mode="elevated">
            <Card.Title title="Executive Summary" subtitle="Admin reporting" />
            <Card.Content>
              <Text style={[styles.reportText, { color: theme.custom.textPrimary }]}>
                Shops: {report.totalShops} | Active Balance: {report.activeBalance}
              </Text>
              <Text style={[styles.reportText, { color: theme.custom.textPrimary }]}>
                Issued: {report.totalPointsIssued} | Spent: {report.totalPointsSpent}
              </Text>
            </Card.Content>
          </Card>
        ) : null}
      </>
    );
  };

  const renderWalletContent = () => (
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
            wallet.pointsBreakdown.map(item => (
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

  const renderCustomersContent = () => (
    <>
      <Card style={[styles.card, { backgroundColor: theme.custom.surfaceStrong }]} mode="elevated">
        <Card.Title title="Customers" subtitle="Customer-role accounts available for point assignment" />
        <Card.Content>
          <TextInput
            placeholder="Search by name, username, or email"
            placeholderTextColor={theme.custom.textSecondary}
            style={[styles.input, { borderColor: theme.custom.border, color: theme.custom.textPrimary }]}
            value={customerSearch}
            onChangeText={setCustomerSearch}
          />
          {filteredCustomers.length ? (
            filteredCustomers.map(customer => {
              const selected = selectedCustomerId === customer.id;
              const customerName = [customer.firstName, customer.lastName].filter(Boolean).join(' ') || customer.username;

              return (
                <Pressable
                  key={customer.id}
                  onPress={() => setSelectedCustomerId(customer.id)}
                  style={[
                    styles.customerRow,
                    {
                      backgroundColor: selected ? 'rgba(47,107,255,0.08)' : theme.custom.surfaceStrong,
                      borderColor: selected ? theme.custom.brand : theme.custom.border,
                    },
                  ]}
                >
                  <View style={styles.customerRowBody}>
                    <Text style={[styles.listTitle, { color: theme.custom.textPrimary }]}>{customerName}</Text>
                    <Text style={[styles.listMeta, { color: theme.custom.textSecondary }]}>{customer.email}</Text>
                    <Text style={[styles.listMeta, { color: theme.custom.textSecondary }]}>Role: {customer.role}</Text>
                  </View>
                  <Chip selected={selected} mode={selected ? 'flat' : 'outlined'}>
                    {selected ? 'Selected' : 'Select'}
                  </Chip>
                </Pressable>
              );
            })
          ) : (
            <Text style={[styles.emptyText, { color: theme.custom.textSecondary }]}>No customer-role users match your search.</Text>
          )}
        </Card.Content>
      </Card>

      {selectedCustomerWallet ? (
        <Card style={[styles.card, { backgroundColor: theme.custom.surfaceStrong }]} mode="elevated">
          <Card.Title title="Selected Customer Wallet" subtitle={selectedCustomerWallet.customer.email} />
          <Card.Content>
            <Text style={[styles.listTitle, { color: theme.custom.textPrimary }]}>
              Balance: {selectedCustomerWallet.balance} pts
            </Text>
            {selectedCustomerWallet.pointsBreakdown.map(item => (
              <Text key={item.pointType} style={[styles.listMeta, { color: theme.custom.textSecondary }]}>
                {item.pointType}: {item.balance}
              </Text>
            ))}
          </Card.Content>
        </Card>
      ) : null}
    </>
  );

  const renderAddPointsContent = () => (
    <Card style={[styles.card, { backgroundColor: theme.custom.surfaceStrong }]} mode="elevated">
      <Card.Title title="Add Points" subtitle="Merchant earn transaction for a customer" />
      <Card.Content>
        <Text style={[styles.sectionLabel, { color: theme.custom.textSecondary }]}>Selected Customer</Text>
        {selectedCustomer ? (
          <View style={[styles.selectionCard, { borderColor: theme.custom.border }]}>
            <Text style={[styles.selectedValue, { color: theme.custom.textPrimary }]}>
              {[selectedCustomer.firstName, selectedCustomer.lastName].filter(Boolean).join(' ') || selectedCustomer.username}
            </Text>
            <Text style={[styles.listMeta, { color: theme.custom.textSecondary }]}>{selectedCustomer.email}</Text>
          </View>
        ) : (
          <Text style={[styles.selectedValue, { color: theme.custom.textPrimary }]}>
            Choose a customer below or from the Customers tab.
          </Text>
        )}
        <Button mode="outlined" onPress={() => navigation.navigate('MerchantScan')} style={styles.secondaryAction}>
          Scan Customer QR
        </Button>

        <Text style={[styles.sectionLabel, { color: theme.custom.textSecondary }]}>Choose Customer</Text>
        <View style={styles.filterRow}>
          {filteredCustomers.slice(0, 8).map(customer => (
            <Chip
              key={customer.id}
              selected={selectedCustomerId === customer.id}
              mode={selectedCustomerId === customer.id ? 'flat' : 'outlined'}
              onPress={() => setSelectedCustomerId(customer.id)}
              style={styles.filterChip}
            >
              {[customer.firstName, customer.lastName].filter(Boolean).join(' ') || customer.username}
            </Chip>
          ))}
        </View>

        <Text style={[styles.sectionLabel, { color: theme.custom.textSecondary }]}>Point Type</Text>
        <View style={styles.filterRow}>
          {pointTypeOptions.map(option => (
            <Chip
              key={option}
              selected={pointType === option}
              mode={pointType === option ? 'flat' : 'outlined'}
              onPress={() => setPointType(option)}
              style={styles.filterChip}
            >
              {option}
            </Chip>
          ))}
        </View>

        <Text style={[styles.sectionLabel, { color: theme.custom.textSecondary }]}>Select Shop</Text>
        {availableShops.length ? (
          <View style={styles.filterRow}>
            {availableShops.map(shop => (
              <Chip
                key={shop.id}
                selected={selectedShopId === shop.id}
                mode={selectedShopId === shop.id ? 'flat' : 'outlined'}
                onPress={() => setSelectedShopId(shop.id)}
                style={styles.filterChip}
              >
                {shop.name}
              </Chip>
            ))}
          </View>
        ) : (
          <Text style={[styles.emptyText, { color: theme.custom.textSecondary }]}>
            No merchant shop is available for point assignment.
          </Text>
        )}

        <TextInput
          placeholder="Points"
          placeholderTextColor={theme.custom.textSecondary}
          style={[styles.input, { borderColor: theme.custom.border, color: theme.custom.textPrimary }]}
          keyboardType="number-pad"
          value={points}
          onChangeText={setPoints}
        />
        <TextInput
          placeholder="Description"
          placeholderTextColor={theme.custom.textSecondary}
          style={[styles.input, { borderColor: theme.custom.border, color: theme.custom.textPrimary }]}
          value={description}
          onChangeText={setDescription}
        />
        <Button
          mode="contained"
          disabled={!selectedCustomerId.trim() || !selectedShopId.trim() || !points.trim()}
          loading={submitting}
          onPress={() => void handleAddPoints()}
        >
          Submit Earn Transaction
        </Button>
      </Card.Content>
    </Card>
  );

  const renderProfileContent = () => (
    <Card style={[styles.card, { backgroundColor: theme.custom.surfaceStrong }]} mode="elevated">
      <Card.Title title="Profile" subtitle="Current authenticated account" />
      <Card.Content>
        <Text style={[styles.listTitle, { color: theme.custom.textPrimary }]}>{displayName}</Text>
        <Text style={[styles.listMeta, { color: theme.custom.textSecondary }]}>{authUser?.email}</Text>
        <Text style={[styles.listMeta, { color: theme.custom.textSecondary }]}>Role: {authUser?.role}</Text>
        <Button mode="outlined" onPress={() => void onLogout()} style={styles.logoutButton}>
          Logout
        </Button>
      </Card.Content>
    </Card>
  );

  const renderReportsContent = () => (
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

  const renderScene = () => {
    switch (activeRouteKey) {
      case 'home':
      case 'dashboard':
        return renderHomeContent();
      case 'wallet':
        return renderWalletContent();
      case 'reports':
        return renderReportsContent();
      case 'transactions':
        return renderTransactionList();
      case 'customers':
        return renderCustomersContent();
      case 'add-points':
        return renderAddPointsContent();
      case 'merchants':
        return renderUserList('Merchants', 'Managed merchant accounts', merchants);
      case 'representatives':
        return renderUserList('Representatives', 'Internal representative accounts', representatives);
      case 'profile':
        return renderProfileContent();
      default:
        return renderHomeContent();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.custom.background }]}>
      <View style={styles.contentFrame}>
        {loading ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator animating size="large" style={styles.loader} />
          </View>
        ) : (
          <>
            <ScrollView
              contentContainerStyle={[
                styles.content,
                {
                  paddingTop: Math.max(insets.top + 16, 24),
                  paddingBottom: Math.max(insets.bottom + 112, 132),
                },
              ]}
              keyboardDismissMode="on-drag"
              keyboardShouldPersistTaps="handled"
              onScrollBeginDrag={Keyboard.dismiss}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />}
              showsVerticalScrollIndicator={false}
            >
              <View
                style={[
                  styles.headerCard,
                  {
                    backgroundColor: theme.custom.surfaceStrong,
                    borderColor: theme.custom.border,
                    shadowColor: theme.custom.shadow,
                  },
                ]}
              >
                <View style={styles.headerTopRow}>
                  <View style={[styles.rolePill, { backgroundColor: 'rgba(47,107,255,0.1)' }]}>
                    <MaterialCommunityIcons name="shield-account-outline" size={16} color={theme.custom.brandStrong} />
                    <Text style={[styles.rolePillText, { color: theme.custom.brandStrong }]}>
                      {authUser ? roleTitles[authUser.role] : 'Co-Money'}
                    </Text>
                  </View>
                  <View style={styles.headerActions}>
                    <LanguageSwitcher />
                    <Button compact mode="outlined" onPress={() => void onLogout()} style={styles.headerActionButton}>
                      Logout
                    </Button>
                  </View>
                </View>

                <Text style={[styles.dashboardTitle, { color: theme.custom.textPrimary }]}>
                  {displayName ? `Welcome back, ${displayName}` : 'Co-Money'}
                </Text>
                <Text style={[styles.dashboardSubtitle, { color: theme.custom.textSecondary }]}>
                  {routes[routeIndex]?.title || 'Overview'} for your wallet, transactions, and daily actions.
                </Text>
              </View>

              <View
                style={[
                  styles.sheet,
                  {
                    backgroundColor: theme.custom.surfaceStrong,
                    borderColor: 'rgba(243, 111, 33, 0.12)',
                  },
                ]}
              >
                <View style={styles.sheetHeader}>
                  <Text style={[styles.sheetTitle, { color: theme.custom.textPrimary }]}>
                    {routes[routeIndex]?.title || 'Overview'}
                  </Text>
                  <Text style={[styles.sheetSubtitle, { color: theme.custom.textSecondary }]}>
                    Role-aware wallet and transaction workspace.
                  </Text>
                </View>

                {error ? <Text style={[styles.message, { color: theme.custom.error }]}>{error}</Text> : null}
                {successMessage ? <Text style={[styles.message, { color: theme.custom.success }]}>{successMessage}</Text> : null}
                {renderScene()}
              </View>
            </ScrollView>

            {routes.length ? (
              <View style={styles.bottomBarWrap}>
                <BottomNavigation.Bar
                  navigationState={{ index: routeIndex, routes }}
                  onTabPress={({ route }) => setRouteIndex(routes.findIndex(item => item.key === route.key))}
                  renderIcon={({ route, focused, color }) => (
                    <MaterialCommunityIcons
                      name={(focused ? route.focusedIcon : route.unfocusedIcon) as React.ComponentProps<typeof MaterialCommunityIcons>['name']}
                      size={22}
                      color={color}
                    />
                  )}
                  style={[styles.bottomBar, { backgroundColor: theme.custom.surfaceStrong }]}
                  safeAreaInsets={{ bottom: insets.bottom }}
                />
              </View>
            ) : null}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentFrame: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 18,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 1,
    shadowRadius: 28,
    elevation: 8,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 18,
  },
  rolePill: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  rolePillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  headerActionButton: {
    borderRadius: 999,
  },
  dashboardTitle: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '900',
    marginBottom: 8,
  },
  dashboardSubtitle: {
    fontSize: 14,
    lineHeight: 21,
  },
  sheet: {
    marginHorizontal: 16,
    borderRadius: 30,
    paddingHorizontal: 18,
    paddingTop: 24,
    paddingBottom: 20,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 1,
    shadowRadius: 28,
    elevation: 10,
  },
  sheetHeader: {
    marginBottom: 18,
  },
  sheetTitle: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '900',
    marginBottom: 8,
  },
  sheetSubtitle: {
    fontSize: 14,
    lineHeight: 21,
  },
  loaderWrap: {
    flex: 1,
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 24,
    borderRadius: 30,
    justifyContent: 'center',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
  },
  content: {
    paddingTop: 0,
    paddingBottom: 28,
  },
  card: {
    marginBottom: 14,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(243, 111, 33, 0.08)',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 6,
  },
  heroEyebrow: {
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
  },
  heroSubtitle: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 14,
  },
  metricBox: {
    width: '47%',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  },
  metricLabel: {
    fontSize: 12,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '800',
  },
  message: {
    marginBottom: 12,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  filterChip: {
    marginBottom: 4,
  },
  customerChip: {
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  customerRow: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  customerRowBody: {
    flex: 1,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  inlineActionButton: {
    alignSelf: 'flex-start',
  },
  divider: {
    marginVertical: 12,
  },
  listItem: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(148, 163, 184, 0.3)',
  },
  listTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  listMeta: {
    marginTop: 4,
    fontSize: 13,
  },
  emptyText: {
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  selectedValue: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 14,
  },
  selectionCard: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
  },
  shopRow: {
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.22)',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
  },
  shopRowBody: {
    marginBottom: 10,
  },
  shopActions: {
    flexDirection: 'row',
    gap: 8,
  },
  walletBalanceValue: {
    fontSize: 40,
    fontWeight: '900',
  },
  walletBalanceLabel: {
    marginTop: 6,
    fontSize: 14,
  },
  reportText: {
    fontSize: 15,
    marginBottom: 8,
  },
  primaryAction: {
    marginTop: 16,
    alignSelf: 'flex-start',
  },
  secondaryAction: {
    marginBottom: 14,
    alignSelf: 'flex-start',
  },
  logoutButton: {
    marginTop: 18,
    alignSelf: 'flex-start',
  },
  bottomBarWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  bottomBar: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    overflow: 'hidden',
    borderTopWidth: 1,
    borderColor: 'rgba(243, 111, 33, 0.1)',
  },
});
