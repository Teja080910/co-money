import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Keyboard,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { ActivityIndicator, BottomNavigation, Button, Card, Chip, Divider, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CustomerDirectoryCard } from '../components/user-directory/CustomerDirectoryCard';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { FloatingLabelInput } from '../components/auth/FloatingLabelInput';
import { MerchantDirectoryCard } from '../components/user-directory/MerchantDirectoryCard';
import { RepresentativeDirectoryCard } from '../components/user-directory/RepresentativeDirectoryCard';
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
  purchaseAmount: number | null;
  discountAmount: number | null;
  payableAmount: number | null;
  earnedPoints: number | null;
  isFirstTransactionBonus: boolean;
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

type Promotion = {
  id: string;
  title: string;
  description: string | null;
  shopId: string;
  merchantId: string;
  shopName: string;
  shopLocation: string;
  bonusPoints: number;
  maxDiscountPercent: number;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
};

type EventItem = {
  id: string;
  title: string;
  description: string | null;
  location: string;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
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
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
        { key: 'user-management', title: 'Users', focusedIcon: 'account-group', unfocusedIcon: 'account-group-outline' },
        { key: 'transactions', title: 'Transactions', focusedIcon: 'history', unfocusedIcon: 'history' },
        { key: 'profile', title: 'Profile', focusedIcon: 'account', unfocusedIcon: 'account-outline' },
      ];
    case 'ADMIN':
      return [
        { key: 'dashboard', title: 'Dashboard', focusedIcon: 'view-dashboard', unfocusedIcon: 'view-dashboard-outline' },
        { key: 'user-management', title: 'Users', focusedIcon: 'account-group', unfocusedIcon: 'account-group-outline' },
        { key: 'shop-management', title: 'Shops', focusedIcon: 'storefront', unfocusedIcon: 'storefront-outline' },
        { key: 'promotions', title: 'Promotions', focusedIcon: 'tag-multiple', unfocusedIcon: 'tag-multiple-outline' },
        { key: 'events', title: 'Events', focusedIcon: 'calendar-star', unfocusedIcon: 'calendar-star' },
      ];
  }
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString();
}

function formatDateInputValue(date: Date) {
  return date.toISOString().split('T')[0];
}

function getPickerDate(value: string) {
  if (!value) {
    return new Date();
  }

  const parsedDate = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
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
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [shopSubmitting, setShopSubmitting] = useState(false);
  const [promotionSubmitting, setPromotionSubmitting] = useState(false);
  const [eventSubmitting, setEventSubmitting] = useState(false);
  const [userSubmitting, setUserSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [routeIndex, setRouteIndex] = useState(0);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedShopId, setSelectedShopId] = useState('');
  const [points, setPoints] = useState('');
  const [description, setDescription] = useState('');
  const [pointType, setPointType] = useState<'STANDARD' | 'BONUS'>('STANDARD');
  const [purchaseAmount, setPurchaseAmount] = useState('');
  const [spendPoints, setSpendPoints] = useState('');
  const [spendDescription, setSpendDescription] = useState('');
  const [shopName, setShopName] = useState('');
  const [shopLocation, setShopLocation] = useState('');
  const [shopDescription, setShopDescription] = useState('');
  const [shopMerchantId, setShopMerchantId] = useState('');
  const [editingShopId, setEditingShopId] = useState('');
  const [promotionTitle, setPromotionTitle] = useState('');
  const [promotionDescription, setPromotionDescription] = useState('');
  const [promotionBonusPoints, setPromotionBonusPoints] = useState('');
  const [promotionStartDate, setPromotionStartDate] = useState('');
  const [promotionEndDate, setPromotionEndDate] = useState('');
  const [promotionShopId, setPromotionShopId] = useState('');
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventStartDate, setEventStartDate] = useState('');
  const [eventEndDate, setEventEndDate] = useState('');
  const [internalRole, setInternalRole] = useState<AuthUser['role']>('MERCHANT');
  const [internalFirstName, setInternalFirstName] = useState('');
  const [internalLastName, setInternalLastName] = useState('');
  const [internalUsername, setInternalUsername] = useState('');
  const [internalEmail, setInternalEmail] = useState('');
  const [internalPassword, setInternalPassword] = useState('');
  const [internalPasswordVisible, setInternalPasswordVisible] = useState(false);
  const [internalTouched, setInternalTouched] = useState({
    username: false,
    email: false,
    password: false,
  });
  const [customerSearch, setCustomerSearch] = useState('');
  const [transactionTypeFilter, setTransactionTypeFilter] = useState('ALL');
  const [transactionStatusFilter, setTransactionStatusFilter] = useState('ALL');
  const [activeDatePicker, setActiveDatePicker] = useState<
    'promotion-start' | 'promotion-end' | 'event-start' | 'event-end' | null
  >(null);

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

  const manageablePromotionShops = useMemo(() => {
    if (!authUser) {
      return [];
    }

    if (authUser.role === 'MERCHANT') {
      return availableShops;
    }

    if (authUser.role === 'REPRESENTATIVE') {
      return shops.filter(shop => shop.representativeId === authUser.id);
    }

    return shops;
  }, [authUser, availableShops, shops]);

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

  const allowedInternalRoles = useMemo(() => {
    if (!authUser) {
      return [] as AuthUser['role'][];
    }

    if (authUser.role === 'ADMIN') {
      return ['REPRESENTATIVE', 'MERCHANT', 'CUSTOMER'] as AuthUser['role'][];
    }

    if (authUser.role === 'REPRESENTATIVE') {
      return ['MERCHANT', 'CUSTOMER'] as AuthUser['role'][];
    }

    return [] as AuthUser['role'][];
  }, [authUser]);

  const trimmedInternalUsername = internalUsername.trim();
  const trimmedInternalEmail = internalEmail.trim();
  const internalEmailError = internalTouched.email && trimmedInternalEmail && !emailPattern.test(trimmedInternalEmail)
    ? 'Enter a valid email address.'
    : undefined;
  const internalPasswordError = internalTouched.password && internalPassword && internalPassword.length < 8
    ? 'Password must be at least 8 characters.'
    : undefined;

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
        const [walletResponse, transactionsResponse, shopsResponse, promotionsResponse, eventsResponse] = await Promise.all([
          apiClient.get<WalletResponse>('/api/wallet/me'),
          apiClient.get<WalletTransaction[]>('/api/wallet/transactions'),
          apiClient.get<Shop[]>('/api/shops'),
          apiClient.get<Promotion[]>('/api/promotions'),
          apiClient.get<EventItem[]>('/api/events'),
        ]);

        setWallet(walletResponse.data);
        setTransactions(transactionsResponse.data);
        setShops(shopsResponse.data);
        setPromotions(promotionsResponse.data);
        setEvents(eventsResponse.data);
        setCustomers([]);
        setMerchants([]);
        setRepresentatives([]);
        setReport(null);
      } else {
        const requests: Array<Promise<any>> = [
          apiClient.get<WalletTransaction[]>('/api/wallet/transactions'),
          apiClient.get<UserSummary[]>('/api/users/customers'),
          apiClient.get<Shop[]>('/api/shops'),
          apiClient.get<Promotion[]>('/api/promotions'),
          apiClient.get<EventItem[]>('/api/events'),
        ];

        if (storedUser.role === 'REPRESENTATIVE' || storedUser.role === 'ADMIN') {
          requests.push(apiClient.get<UserSummary[]>('/api/users/merchants'));
          requests.push(apiClient.get<ReportSummary>('/api/wallet/reports/summary'));
        }

        if (storedUser.role === 'ADMIN') {
          requests.push(apiClient.get<UserSummary[]>('/api/users/representatives'));
        }

        const responses = await Promise.all(requests);

        setWallet(null);
        setTransactions(responses[0].data);
        setCustomers(responses[1].data);
        setShops(responses[2].data);
        setPromotions(responses[3].data);
        setEvents(responses[4].data);
        setMerchants(storedUser.role === 'REPRESENTATIVE' || storedUser.role === 'ADMIN' ? responses[5].data : []);
        setReport(
          storedUser.role === 'REPRESENTATIVE'
            ? responses[6].data
            : storedUser.role === 'ADMIN'
              ? responses[6].data
              : null,
        );
        setRepresentatives(storedUser.role === 'ADMIN' ? responses[7].data : []);
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
    if (
      manageablePromotionShops.length &&
      (!promotionShopId || !manageablePromotionShops.some(shop => shop.id === promotionShopId))
    ) {
      setPromotionShopId(manageablePromotionShops[0].id);
    }
  }, [manageablePromotionShops, promotionShopId]);

  useEffect(() => {
    if (allowedInternalRoles.length && !allowedInternalRoles.includes(internalRole)) {
      setInternalRole(allowedInternalRoles[0]);
    }
  }, [allowedInternalRoles, internalRole]);

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

  const resetPromotionForm = () => {
    setPromotionTitle('');
    setPromotionDescription('');
    setPromotionBonusPoints('');
    setPromotionStartDate('');
    setPromotionEndDate('');
    setPromotionShopId(manageablePromotionShops[0]?.id || '');
  };

  const resetEventForm = () => {
    setEventTitle('');
    setEventDescription('');
    setEventLocation('');
    setEventStartDate('');
    setEventEndDate('');
  };

  const resetInternalUserForm = () => {
    setInternalFirstName('');
    setInternalLastName('');
    setInternalUsername('');
    setInternalEmail('');
    setInternalPassword('');
    setInternalPasswordVisible(false);
    setInternalTouched({
      username: false,
      email: false,
      password: false,
    });
    setInternalRole(allowedInternalRoles[0] || 'MERCHANT');
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (event.type === 'dismissed') {
      setActiveDatePicker(null);
      return;
    }

    if (!selectedDate || !activeDatePicker) {
      return;
    }

    const nextValue = formatDateInputValue(selectedDate);

    switch (activeDatePicker) {
      case 'promotion-start':
        setPromotionStartDate(nextValue);
        break;
      case 'promotion-end':
        setPromotionEndDate(nextValue);
        break;
      case 'event-start':
        setEventStartDate(nextValue);
        break;
      case 'event-end':
        setEventEndDate(nextValue);
        break;
    }

    if (Platform.OS !== 'ios') {
      setActiveDatePicker(null);
    }
  };

  const renderDateField = (
    label: string,
    value: string,
    pickerKey: NonNullable<typeof activeDatePicker>,
    helperText: string,
  ) => (
    <View style={styles.dateFieldBlock}>
      <Text style={[styles.sectionLabel, { color: theme.custom.textSecondary }]}>{label}</Text>
      <Pressable
        onPress={() => setActiveDatePicker(pickerKey)}
        style={[styles.dateField, { borderColor: theme.custom.border, backgroundColor: theme.custom.background }]}
      >
        <Text style={[styles.dateFieldValue, { color: value ? theme.custom.textPrimary : theme.custom.textSecondary }]}>
          {value || 'Select date'}
        </Text>
        <MaterialCommunityIcons name="calendar-month-outline" size={20} color={theme.custom.textSecondary} />
      </Pressable>
      <Text style={[styles.dateFieldHelper, { color: theme.custom.textSecondary }]}>{helperText}</Text>
    </View>
  );

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

  const handleSpendPoints = async () => {
    if (!selectedCustomerId.trim()) {
      setError('Select a customer before accepting points.');
      return;
    }

    if (!selectedShopId.trim()) {
      setError('Select a shop before accepting points.');
      return;
    }

    if (!purchaseAmount.trim() || Number(purchaseAmount) <= 0) {
      setError('Enter a valid purchase amount.');
      return;
    }

    if (!spendPoints.trim() || Number(spendPoints) <= 0) {
      setError('Enter the requested points to use.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await apiClient.post<{
        usedPoints: number;
        payableAmount: number;
        earnedPoints: number;
        bonusPoints: number;
      }>('/api/wallet/spend', {
        customerId: selectedCustomerId.trim(),
        shopId: selectedShopId.trim(),
        points: Number(spendPoints),
        purchaseAmount: Number(purchaseAmount),
        description: spendDescription.trim() || undefined,
      });

      const result = response.data;
      setSuccessMessage(
        `Settlement complete. Used ${result.usedPoints} pts, payable ${result.payableAmount}, earned ${result.earnedPoints}${result.bonusPoints ? ` + ${result.bonusPoints} bonus` : ''}.`,
      );
      setPurchaseAmount('');
      setSpendPoints('');
      setSpendDescription('');
      await loadDashboard();
      await fetchSelectedCustomerWallet(selectedCustomerId);
    } catch (submitError: any) {
      setError(submitError?.response?.data?.error || 'Unable to settle the purchase.');
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

  const handleToggleShopStatus = async (shop: Shop) => {
    setShopSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const nextStatus = !shop.isActive;
      await apiClient.put(`/api/shops/${shop.id}`, { isActive: nextStatus });
      setSuccessMessage(`Shop ${nextStatus ? 'activated' : 'deactivated'} successfully.`);
      await loadDashboard();
    } catch (updateError: any) {
      setError(updateError?.response?.data?.error || 'Unable to update shop status.');
    } finally {
      setShopSubmitting(false);
    }
  };

  const handleCreatePromotion = async () => {
    if (!promotionTitle.trim()) {
      setError('Promotion title is required.');
      return;
    }

    if (!promotionShopId.trim()) {
      setError('Select a shop for the promotion.');
      return;
    }

    if (!promotionStartDate.trim() || !promotionEndDate.trim()) {
      setError('Enter both promotion dates.');
      return;
    }

    setPromotionSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await apiClient.post('/api/promotions', {
        title: promotionTitle.trim(),
        description: promotionDescription.trim() || undefined,
        shopId: promotionShopId.trim(),
        bonusPoints: promotionBonusPoints.trim() ? Number(promotionBonusPoints) : 0,
        startsAt: `${promotionStartDate.trim()}T00:00:00.000Z`,
        endsAt: `${promotionEndDate.trim()}T23:59:59.000Z`,
      });

      setSuccessMessage('Promotion created successfully.');
      resetPromotionForm();
      await loadDashboard();
    } catch (submitError: any) {
      setError(submitError?.response?.data?.error || 'Unable to create promotion.');
    } finally {
      setPromotionSubmitting(false);
    }
  };

  const handleDeletePromotion = async (promotionId: string) => {
    setPromotionSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await apiClient.delete(`/api/promotions/${promotionId}`);
      setSuccessMessage('Promotion removed successfully.');
      await loadDashboard();
    } catch (deleteError: any) {
      setError(deleteError?.response?.data?.error || 'Unable to delete promotion.');
    } finally {
      setPromotionSubmitting(false);
    }
  };

  const handleCreateEvent = async () => {
    if (!eventTitle.trim()) {
      setError('Event title is required.');
      return;
    }

    if (!eventLocation.trim()) {
      setError('Event location is required.');
      return;
    }

    if (!eventStartDate.trim() || !eventEndDate.trim()) {
      setError('Enter both event dates.');
      return;
    }

    setEventSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await apiClient.post('/api/events', {
        title: eventTitle.trim(),
        description: eventDescription.trim() || undefined,
        location: eventLocation.trim(),
        startsAt: `${eventStartDate.trim()}T00:00:00.000Z`,
        endsAt: `${eventEndDate.trim()}T23:59:59.000Z`,
      });

      setSuccessMessage('Event created successfully.');
      resetEventForm();
      await loadDashboard();
    } catch (submitError: any) {
      setError(submitError?.response?.data?.error || 'Unable to create event.');
    } finally {
      setEventSubmitting(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    setEventSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await apiClient.delete(`/api/events/${eventId}`);
      setSuccessMessage('Event removed successfully.');
      await loadDashboard();
    } catch (deleteError: any) {
      setError(deleteError?.response?.data?.error || 'Unable to delete event.');
    } finally {
      setEventSubmitting(false);
    }
  };

  const handleCreateInternalUser = async () => {
    if (!trimmedInternalEmail || !trimmedInternalUsername || !internalPassword.trim()) {
      setError('Username, email, and password are required.');
      setInternalTouched({
        username: true,
        email: true,
        password: true,
      });
      return;
    }

    if (!emailPattern.test(trimmedInternalEmail)) {
      setError('Enter a valid email address.');
      setInternalTouched(current => ({ ...current, email: true }));
      return;
    }

    if (internalPassword.trim().length < 8) {
      setError('Password must be at least 8 characters.');
      setInternalTouched(current => ({ ...current, password: true }));
      return;
    }

    setUserSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await apiClient.post('/api/users/internal', {
        firstName: internalFirstName.trim() || undefined,
        lastName: internalLastName.trim() || undefined,
        username: internalUsername.trim(),
        email: trimmedInternalEmail,
        password: internalPassword.trim(),
        role: internalRole,
      });

      setSuccessMessage(`${internalRole} account created successfully.`);
      resetInternalUserForm();
      await loadDashboard();
    } catch (submitError: any) {
      setError(submitError?.response?.data?.error || 'Unable to create user.');
    } finally {
      setUserSubmitting(false);
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
                {transaction.pointType} • {transaction.status} • {new Date(transaction.createdAt).toLocaleString()}
              </Text>
              {transaction.purchaseAmount ? (
                <Text style={[styles.listMeta, { color: theme.custom.textSecondary }]}>
                  Purchase: {transaction.purchaseAmount} | Discount: {transaction.discountAmount || 0} | Payable: {transaction.payableAmount || 0}
                </Text>
              ) : null}
              {transaction.earnedPoints ? (
                <Text style={[styles.listMeta, { color: theme.custom.textSecondary }]}>
                  Earned in settlement: {transaction.earnedPoints}
                  {transaction.isFirstTransactionBonus ? ' • First-time bonus' : ''}
                </Text>
              ) : null}
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
              <Text style={[styles.listMeta, { color: theme.custom.textSecondary }]}>Role: {user.role}</Text>
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
          <FloatingLabelInput
            icon="store-outline"
            label="Shop name"
            helperText="Use the public-facing shop name customers will recognize."
            value={shopName}
            onChangeText={setShopName}
            autoCapitalize="words"
          />
          <FloatingLabelInput
            icon="map-marker-outline"
            label="Location"
            helperText="Add the branch area or address shown in the shop listing."
            value={shopLocation}
            onChangeText={setShopLocation}
            autoCapitalize="words"
          />
          <FloatingLabelInput
            icon="text-box-outline"
            label="Description"
            helperText="Write a short summary about what this shop offers."
            value={shopDescription}
            onChangeText={setShopDescription}
            autoCapitalize="sentences"
            multiline
            numberOfLines={3}
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
        <Card.Title title="Managed Shops" subtitle="Add, update, activate, or deactivate assigned shops" />
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
                  <Text style={[styles.listMeta, { color: shop.isActive ? theme.custom.success : theme.custom.error }]}>
                    Status: {shop.isActive ? 'Active' : 'Inactive'}
                  </Text>
                </View>
                <View style={styles.shopActions}>
                  <Button compact mode="outlined" onPress={() => handleEditShop(shop)}>
                    Edit
                  </Button>
                  <Button
                    compact
                    mode="text"
                    textColor={shop.isActive ? theme.custom.error : theme.custom.success}
                    onPress={() => void handleToggleShopStatus(shop)}
                  >
                    {shop.isActive ? 'Deactivate' : 'Activate'}
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

  const renderShopDirectory = () => (
    <Card style={[styles.card, { backgroundColor: theme.custom.surfaceStrong }]} mode="elevated">
      <Card.Title title="Shops List" subtitle="Participating local shops" />
      <Card.Content>
        {shops.length ? (
          shops.map(shop => (
            <View key={shop.id} style={styles.listItem}>
              <Text style={[styles.listTitle, { color: theme.custom.textPrimary }]}>{shop.name}</Text>
              <Text style={[styles.listMeta, { color: theme.custom.textSecondary }]}>{shop.location}</Text>
              {shop.description ? (
                <Text style={[styles.listMeta, { color: theme.custom.textSecondary }]}>{shop.description}</Text>
              ) : null}
            </View>
          ))
        ) : (
          <Text style={[styles.emptyText, { color: theme.custom.textSecondary }]}>No shops are available yet.</Text>
        )}
      </Card.Content>
    </Card>
  );

  const renderPromotionsContent = (editable: boolean) => (
    <>
      {editable ? (
        <Card style={[styles.card, { backgroundColor: theme.custom.surfaceStrong }]} mode="elevated">
        <Card.Title title="Promotions" subtitle="Create shop offers and bonus campaigns" />
        <Card.Content>
            <FloatingLabelInput
              icon="tag-outline"
              label="Promotion title"
              helperText="Choose a clear campaign name customers can scan quickly."
              value={promotionTitle}
              onChangeText={setPromotionTitle}
              autoCapitalize="sentences"
            />
            <FloatingLabelInput
              icon="text-box-outline"
              label="Description"
              helperText="Explain the offer, reward, or eligibility in one short note."
              value={promotionDescription}
              onChangeText={setPromotionDescription}
              autoCapitalize="sentences"
              multiline
              numberOfLines={3}
            />
            <Text style={[styles.sectionLabel, { color: theme.custom.textSecondary }]}>Shop</Text>
            <View style={styles.filterRow}>
              {manageablePromotionShops.map(shop => (
                <Chip
                  key={shop.id}
                  selected={promotionShopId === shop.id}
                  mode={promotionShopId === shop.id ? 'flat' : 'outlined'}
                  onPress={() => setPromotionShopId(shop.id)}
                  style={styles.filterChip}
                >
                  {shop.name}
                </Chip>
              ))}
            </View>
            <FloatingLabelInput
              icon="star-four-points-outline"
              label="Bonus points"
              helperText="Enter the extra reward points granted by this promotion."
              keyboardType="number-pad"
              value={promotionBonusPoints}
              onChangeText={setPromotionBonusPoints}
            />
            {renderDateField('Start date', promotionStartDate, 'promotion-start', 'Choose when this promotion should become active.')}
            {renderDateField('End date', promotionEndDate, 'promotion-end', 'Choose the last day customers can use this promotion.')}
            <View style={styles.actionRow}>
              <Button mode="contained" loading={promotionSubmitting} onPress={() => void handleCreatePromotion()}>
                Save Promotion
              </Button>
              <Button mode="outlined" onPress={resetPromotionForm}>
                Reset
              </Button>
            </View>
          </Card.Content>
        </Card>
      ) : null}

      <Card style={[styles.card, { backgroundColor: theme.custom.surfaceStrong }]} mode="elevated">
        <Card.Title title="Active Promotions" subtitle="Offers available across the network" />
        <Card.Content>
          {promotions.length ? (
            promotions.map(promotion => (
              <View key={promotion.id} style={styles.shopRow}>
                <View style={styles.shopRowBody}>
                  <Text style={[styles.listTitle, { color: theme.custom.textPrimary }]}>{promotion.title}</Text>
                  <Text style={[styles.listMeta, { color: theme.custom.textSecondary }]}>
                    {promotion.shopName} • {promotion.shopLocation}
                  </Text>
                  {promotion.description ? (
                    <Text style={[styles.listMeta, { color: theme.custom.textSecondary }]}>{promotion.description}</Text>
                  ) : null}
                  <Text style={[styles.listMeta, { color: theme.custom.textSecondary }]}>
                    Bonus: {promotion.bonusPoints} pts • Max discount: {promotion.maxDiscountPercent}%
                  </Text>
                  <Text style={[styles.listMeta, { color: theme.custom.textSecondary }]}>
                    {formatDate(promotion.startsAt)} to {formatDate(promotion.endsAt)}
                  </Text>
                </View>
                {editable ? (
                  <View style={styles.shopActions}>
                    <Button compact mode="text" textColor={theme.custom.error} onPress={() => void handleDeletePromotion(promotion.id)}>
                      Delete
                    </Button>
                  </View>
                ) : null}
              </View>
            ))
          ) : (
            <Text style={[styles.emptyText, { color: theme.custom.textSecondary }]}>No promotions are available right now.</Text>
          )}
        </Card.Content>
      </Card>
    </>
  );

  const renderEventsContent = (editable: boolean) => (
    <>
      {editable ? (
        <Card style={[styles.card, { backgroundColor: theme.custom.surfaceStrong }]} mode="elevated">
        <Card.Title title="Events" subtitle="Plan community events and announcements" />
        <Card.Content>
            <FloatingLabelInput
              icon="calendar-text-outline"
              label="Event title"
              helperText="Use the event name that should appear in announcements."
              value={eventTitle}
              onChangeText={setEventTitle}
              autoCapitalize="sentences"
            />
            <FloatingLabelInput
              icon="text-box-outline"
              label="Description"
              helperText="Add a short agenda, purpose, or event summary."
              value={eventDescription}
              onChangeText={setEventDescription}
              autoCapitalize="sentences"
              multiline
              numberOfLines={3}
            />
            <FloatingLabelInput
              icon="map-marker-outline"
              label="Location"
              helperText="Mention the venue, branch, or meetup point."
              value={eventLocation}
              onChangeText={setEventLocation}
              autoCapitalize="words"
            />
            {renderDateField('Start date', eventStartDate, 'event-start', 'Pick the first day this event will be visible as active.')}
            {renderDateField('End date', eventEndDate, 'event-end', 'Pick the final day for this event schedule.')}
            <View style={styles.actionRow}>
              <Button mode="contained" loading={eventSubmitting} onPress={() => void handleCreateEvent()}>
                Save Event
              </Button>
              <Button mode="outlined" onPress={resetEventForm}>
                Reset
              </Button>
            </View>
          </Card.Content>
        </Card>
      ) : null}

      <Card style={[styles.card, { backgroundColor: theme.custom.surfaceStrong }]} mode="elevated">
        <Card.Title title="Events" subtitle="Upcoming network activity" />
        <Card.Content>
          {events.length ? (
            events.map(event => (
              <View key={event.id} style={styles.shopRow}>
                <View style={styles.shopRowBody}>
                  <Text style={[styles.listTitle, { color: theme.custom.textPrimary }]}>{event.title}</Text>
                  <Text style={[styles.listMeta, { color: theme.custom.textSecondary }]}>{event.location}</Text>
                  {event.description ? (
                    <Text style={[styles.listMeta, { color: theme.custom.textSecondary }]}>{event.description}</Text>
                  ) : null}
                  <Text style={[styles.listMeta, { color: theme.custom.textSecondary }]}>
                    {formatDate(event.startsAt)} to {formatDate(event.endsAt)}
                  </Text>
                </View>
                {editable ? (
                  <View style={styles.shopActions}>
                    <Button compact mode="text" textColor={theme.custom.error} onPress={() => void handleDeleteEvent(event.id)}>
                      Delete
                    </Button>
                  </View>
                ) : null}
              </View>
            ))
          ) : (
            <Text style={[styles.emptyText, { color: theme.custom.textSecondary }]}>No events are scheduled yet.</Text>
          )}
        </Card.Content>
      </Card>
    </>
  );

  const renderInternalUserManagement = () => {
    if (!allowedInternalRoles.length) {
      return null;
    }

    return (
      <Card style={[styles.card, { backgroundColor: theme.custom.surfaceStrong }]} mode="elevated">
        <Card.Title title="User Management" subtitle="Create internal and managed accounts" />
        <Card.Content>
          <Text style={[styles.sectionLabel, { color: theme.custom.textSecondary }]}>Role</Text>
          <View style={styles.filterRow}>
            {allowedInternalRoles.map(role => (
              <Chip
                key={role}
                selected={internalRole === role}
                mode={internalRole === role ? 'flat' : 'outlined'}
                onPress={() => setInternalRole(role)}
                style={styles.filterChip}
              >
                {role}
              </Chip>
            ))}
          </View>
          <FloatingLabelInput
            icon="account-outline"
            label="First name"
            helperText="Enter the user’s given name for their profile."
            value={internalFirstName}
            onChangeText={setInternalFirstName}
            autoCapitalize="words"
          />
          <FloatingLabelInput
            icon="badge-account-outline"
            label="Last name"
            helperText="Enter the surname used for reporting and account records."
            value={internalLastName}
            onChangeText={setInternalLastName}
            autoCapitalize="words"
          />
          <FloatingLabelInput
            icon="account-circle-outline"
            label="Username"
            helperText="Use a unique sign-in name without spaces."
            valid={Boolean(trimmedInternalUsername)}
            value={internalUsername}
            onChangeText={text => {
              setInternalUsername(text);
              setInternalTouched(current => ({ ...current, username: true }));
            }}
            autoCapitalize="none"
          />
          <FloatingLabelInput
            icon="email-outline"
            label="Email"
            error={internalEmailError}
            helperText={!internalEmailError ? 'Add the email address used for login and notifications.' : undefined}
            valid={Boolean(trimmedInternalEmail) && !internalEmailError}
            value={internalEmail}
            onChangeText={text => {
              setInternalEmail(text);
              setInternalTouched(current => ({ ...current, email: true }));
            }}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <FloatingLabelInput
            icon="lock-outline"
            label="Password"
            error={internalPasswordError}
            helperText={!internalPasswordError ? 'Set a temporary password with at least 8 characters.' : undefined}
            onToggleSecureEntry={() => setInternalPasswordVisible(current => !current)}
            secureTextEntry={!internalPasswordVisible}
            valid={internalPassword.length >= 8}
            value={internalPassword}
            onChangeText={text => {
              setInternalPassword(text);
              setInternalTouched(current => ({ ...current, password: true }));
            }}
          />
          <View style={styles.actionRow}>
            <Button mode="contained" loading={userSubmitting} onPress={() => void handleCreateInternalUser()}>
              Create User
            </Button>
            <Button mode="outlined" onPress={resetInternalUserForm}>
              Reset
            </Button>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderAdminDashboardContent = () => (
    <>
      <View style={styles.metricGrid}>
        {renderSummaryMetric('Representatives', representatives.length)}
        {renderSummaryMetric('Merchants', merchants.length)}
        {renderSummaryMetric('Customers', customers.length)}
        {renderSummaryMetric('Transactions', transactions.length)}
      </View>

      {report ? (
        <Card style={[styles.card, { backgroundColor: theme.custom.surfaceStrong }]} mode="elevated">
          <Card.Title title="Executive Summary" subtitle="Admin reporting" />
          <Card.Content>
            <Text style={[styles.reportText, { color: theme.custom.textPrimary }]}>
              Customers: {report.totalCustomers} | Shops: {report.totalShops}
            </Text>
            <Text style={[styles.reportText, { color: theme.custom.textPrimary }]}>
              Issued: {report.totalPointsIssued} | Spent: {report.totalPointsSpent}
            </Text>
            <Text style={[styles.reportText, { color: theme.custom.textPrimary }]}>
              Active Balance: {report.activeBalance}
            </Text>
          </Card.Content>
        </Card>
      ) : null}

      {renderUserList('Recent Representatives', 'Latest internal representative accounts', representatives.slice(0, 4))}
      {renderUserList('Recent Merchants', 'Managed merchant accounts', merchants.slice(0, 4))}
      {renderUserList('Recent Customers', 'Newest customer accounts in the network', customers.slice(0, 4))}
    </>
  );

  const renderAdminUserManagementContent = () => (
    <>
      {renderInternalUserManagement()}
      <RepresentativeDirectoryCard users={representatives} />
      <MerchantDirectoryCard users={merchants} />
      <CustomerDirectoryCard users={customers} />
    </>
  );

  const renderRepresentativeUserManagementContent = () => (
    <>
      {renderInternalUserManagement()}
      <MerchantDirectoryCard users={merchants} />
      <CustomerDirectoryCard users={customers} />
      {renderCustomersContent()}
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
          {renderPromotionsContent(false)}
          {renderShopDirectory()}
          {renderEventsContent(false)}
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
          {renderPromotionsContent(true)}
          {renderEventsContent(false)}
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
          {renderShopManagementContent('Shop Management', 'Representatives can add, update, activate, and deactivate shop records')}
          {renderPromotionsContent(true)}
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
      renderAdminDashboardContent()
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
          <FloatingLabelInput
            icon="magnify"
            label="Search by name, username, or email"
            helperText="Filter the customer list to find the right wallet faster."
            value={customerSearch}
            onChangeText={setCustomerSearch}
            autoCapitalize="none"
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
    <>
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

          <FloatingLabelInput
            icon="plus-circle-outline"
            label="Points"
            helperText="Enter how many points should be added to the customer wallet."
            keyboardType="number-pad"
            value={points}
            onChangeText={setPoints}
          />
          <FloatingLabelInput
            icon="text-box-outline"
            label="Description"
            helperText="Add an optional note explaining why these points were issued."
            value={description}
            onChangeText={setDescription}
            autoCapitalize="sentences"
            multiline
            numberOfLines={3}
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

      <Card style={[styles.card, { backgroundColor: theme.custom.surfaceStrong }]} mode="elevated">
        <Card.Title title="Accept Points" subtitle="Settle a purchase with discount, payable amount, and new points" />
        <Card.Content>
          <Text style={[styles.listMeta, { color: theme.custom.textSecondary }]}>
            Same-shop restriction is enforced automatically and discounts are capped at 30% of the purchase.
          </Text>
          <FloatingLabelInput
            icon="cash-multiple"
            label="Purchase amount"
            helperText="Enter the bill total before discounts are applied."
            keyboardType="number-pad"
            value={purchaseAmount}
            onChangeText={setPurchaseAmount}
          />
          <FloatingLabelInput
            icon="ticket-percent-outline"
            label="Requested points to use"
            helperText="Enter how many customer points should be redeemed."
            keyboardType="number-pad"
            value={spendPoints}
            onChangeText={setSpendPoints}
          />
          <FloatingLabelInput
            icon="text-box-outline"
            label="Settlement description"
            helperText="Add an optional note for the purchase or redemption context."
            value={spendDescription}
            onChangeText={setSpendDescription}
            autoCapitalize="sentences"
            multiline
            numberOfLines={3}
          />
          <Button
            mode="contained"
            disabled={!selectedCustomerId.trim() || !selectedShopId.trim() || !purchaseAmount.trim() || !spendPoints.trim()}
            loading={submitting}
            onPress={() => void handleSpendPoints()}
          >
            Submit Purchase Settlement
          </Button>
        </Card.Content>
      </Card>
    </>
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
      case 'user-management':
        return authUser?.role === 'REPRESENTATIVE'
          ? renderRepresentativeUserManagementContent()
          : renderAdminUserManagementContent();
      case 'shop-management':
        return renderShopManagementContent('Shop Management', 'Admins can add, update, activate, and deactivate shop records');
      case 'promotions':
        return renderPromotionsContent(true);
      case 'events':
        return renderEventsContent(true);
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
                {activeDatePicker ? (
                  <View style={styles.datePickerWrap}>
                    <DateTimePicker
                      value={
                        activeDatePicker === 'promotion-start'
                          ? getPickerDate(promotionStartDate)
                          : activeDatePicker === 'promotion-end'
                            ? getPickerDate(promotionEndDate)
                            : activeDatePicker === 'event-start'
                              ? getPickerDate(eventStartDate)
                              : getPickerDate(eventEndDate)
                      }
                      mode="date"
                      display={Platform.OS === 'ios' ? 'inline' : 'default'}
                      onChange={handleDateChange}
                    />
                    {Platform.OS === 'ios' ? (
                      <Button mode="text" onPress={() => setActiveDatePicker(null)}>
                        Done
                      </Button>
                    ) : null}
                  </View>
                ) : null}
              </View>
            </ScrollView>

            {routes.length ? (
              <View style={styles.bottomBarWrap}>
                <BottomNavigation.Bar
                  navigationState={{ index: routeIndex, routes }}
                  onTabPress={({ route }) => setRouteIndex(routes.findIndex(item => item.key === route.key))}
                  renderIcon={({ route: navRoute, focused, color }) => (
                    <MaterialCommunityIcons
                      name={(focused ? navRoute.focusedIcon : navRoute.unfocusedIcon) as React.ComponentProps<typeof MaterialCommunityIcons>['name']}
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
    flexWrap: 'wrap',
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
  directoryTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  directorySubtitle: {
    fontSize: 13,
    marginBottom: 8,
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
  dateFieldBlock: {
    marginBottom: 12,
  },
  dateFieldHelper: {
    fontSize: 12,
    lineHeight: 16,
    paddingHorizontal: 4,
    paddingTop: 6,
  },
  dateField: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateFieldValue: {
    fontSize: 15,
    fontWeight: '500',
  },
  datePickerWrap: {
    marginTop: 12,
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
