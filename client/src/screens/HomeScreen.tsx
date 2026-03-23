import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Button, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { UserRole } from '../constants/userRoles';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { AddPointsTab } from '../components/home-tabs/AddPointsTab';
import { CustomersTab } from '../components/home-tabs/CustomersTab';
import { HomeOverviewTab } from '../components/home-tabs/HomeOverviewTab';
import {
  AdminUserManagementSection,
  EventsSection,
  PromotionsSection,
  RepresentativeUserManagementSection,
  ShopManagementSection,
  UserListSection,
} from '../components/home-tabs/ManagementSections';
import { ProfileTab } from '../components/home-tabs/ProfileTab';
import { ReportsTab } from '../components/home-tabs/ReportsTab';
import { TransactionsTab } from '../components/home-tabs/TransactionsTab';
import { WalletTab } from '../components/home-tabs/WalletTab';
import { BottomTabBar } from '../components/navigation/BottomTabBar';
import { getRoutesForRole } from '../navigation/homeTabConfig';
import type { HomeTabParamList, ScreenProps } from '../navigation/types';
import { apiClient } from '../services/api';
import { changePassword, clearAuthenticatedUser, getAuthenticatedUser, type AuthUser } from '../services/auth';
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

const roleTitles: Record<AuthUser['role'], string> = {
  [UserRole.CUSTOMER]: 'roles.customer',
  [UserRole.MERCHANT]: 'roles.merchant',
  [UserRole.REPRESENTATIVE]: 'roles.representative',
  [UserRole.ADMIN]: 'roles.admin',
};

const transactionTypeOptions = ['ALL', 'EARN', 'SPEND'];
const transactionStatusOptions = ['ALL', 'SUCCESS', 'PENDING', 'FAILED'];
const pointTypeOptions: Array<'STANDARD' | 'BONUS'> = ['STANDARD', 'BONUS'];
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  const { t } = useTranslation();
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
  const [activeTabKey, setActiveTabKey] = useState<keyof HomeTabParamList>('home');
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
  const [internalRole, setInternalRole] = useState<AuthUser['role']>(UserRole.MERCHANT);
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
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [passwordVisibility, setPasswordVisibility] = useState({
    current: false,
    next: false,
    confirm: false,
  });
  const [passwordTouched, setPasswordTouched] = useState({
    current: false,
    next: false,
    confirm: false,
  });
  const [activeDatePicker, setActiveDatePicker] = useState<
    'promotion-start' | 'promotion-end' | 'event-start' | 'event-end' | null
  >(null);

  const routes = useMemo(() => {
    if (!authUser) {
      return [];
    }

    return getRoutesForRole(authUser.role).map(routeItem => ({
      ...routeItem,
      title: t(`navigation.tabs.${routeItem.key}`, routeItem.title),
    }));
  }, [authUser, t]);
  const activeRoute = useMemo(
    () => routes.find(routeItem => routeItem.key === activeTabKey) || routes[0] || null,
    [activeTabKey, routes],
  );

  const displayName = useMemo(() => {
    if (!authUser) {
      return '';
    }

    return [authUser.firstName, authUser.lastName].filter(Boolean).join(' ') || authUser.username;
  }, [authUser]);

  const customerUsers = useMemo(
    () => customers.filter(customer => customer.role === UserRole.CUSTOMER),
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

    if (authUser.role === UserRole.MERCHANT) {
      return shops.filter(shop => shop.merchantId === authUser.id);
    }

    return shops;
  }, [authUser, shops]);

  const manageablePromotionShops = useMemo(() => {
    if (!authUser) {
      return [];
    }

    if (authUser.role === UserRole.MERCHANT) {
      return availableShops;
    }

    if (authUser.role === UserRole.REPRESENTATIVE) {
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

    if (authUser.role === UserRole.ADMIN) {
      return [UserRole.REPRESENTATIVE, UserRole.MERCHANT, UserRole.CUSTOMER] as AuthUser['role'][];
    }

    if (authUser.role === UserRole.REPRESENTATIVE) {
      return [UserRole.MERCHANT, UserRole.CUSTOMER] as AuthUser['role'][];
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
  const currentPasswordError = passwordTouched.current && !currentPassword.trim()
    ? 'Current password is required.'
    : undefined;
  const newPasswordError = passwordTouched.next && newPassword.trim() && newPassword.trim().length < 8
    ? 'New password must be at least 8 characters.'
    : undefined;
  const confirmPasswordError = passwordTouched.confirm && confirmPassword.trim() && confirmPassword !== newPassword
    ? 'Passwords do not match.'
    : undefined;

  const fetchSelectedCustomerWallet = useCallback(async (customerId: string) => {
    if (!customerId.trim() || !authUser || authUser.role === UserRole.CUSTOMER) {
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
      if (storedUser.role === UserRole.CUSTOMER) {
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

        if (storedUser.role === UserRole.REPRESENTATIVE || storedUser.role === UserRole.ADMIN) {
          requests.push(apiClient.get<UserSummary[]>('/api/users/merchants'));
          requests.push(apiClient.get<ReportSummary>('/api/wallet/reports/summary'));
        }

        if (storedUser.role === UserRole.ADMIN) {
          requests.push(apiClient.get<UserSummary[]>('/api/users/representatives'));
        }

        const responses = await Promise.all(requests);

        setWallet(null);
        setTransactions(responses[0].data);
        setCustomers(responses[1].data);
        setShops(responses[2].data);
        setPromotions(responses[3].data);
        setEvents(responses[4].data);
        setMerchants(storedUser.role === UserRole.REPRESENTATIVE || storedUser.role === UserRole.ADMIN ? responses[5].data : []);
        setReport(
          storedUser.role === UserRole.REPRESENTATIVE
            ? responses[6].data
            : storedUser.role === UserRole.ADMIN
              ? responses[6].data
              : null,
        );
        setRepresentatives(storedUser.role === UserRole.ADMIN ? responses[7].data : []);
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
    if (!selectedShopId && availableShops.length && authUser?.role === UserRole.MERCHANT) {
      setSelectedShopId(availableShops[0].id);
    }
  }, [authUser?.role, availableShops, selectedShopId]);

  useEffect(() => {
    if (
      (!shopMerchantId || !merchants.some(merchant => merchant.id === shopMerchantId)) &&
      merchants.length &&
      (authUser?.role === UserRole.REPRESENTATIVE || authUser?.role === UserRole.ADMIN)
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
    if (routes.length && !routes.some(routeItem => routeItem.key === activeTabKey)) {
      const fallbackKey = routes[0].key as keyof HomeTabParamList;
      setActiveTabKey(fallbackKey);
    }
  }, [activeTabKey, routes]);

  useEffect(() => {
    if (route.params?.selectedCustomerId) {
      setSelectedCustomerId(route.params.selectedCustomerId);
      const addPointsIndex = routes.findIndex(item => item.key === 'add-points');
      const customersIndex = routes.findIndex(item => item.key === 'customers');
      const nextIndex = addPointsIndex >= 0 ? addPointsIndex : customersIndex >= 0 ? customersIndex : 0;
      const nextKey = (routes[nextIndex]?.key || routes[0]?.key || 'home') as keyof HomeTabParamList;
      setActiveTabKey(nextKey);
    }
  }, [route.params?.selectedCustomerId, routes]);

  useEffect(() => {
    setError(null);
    setSuccessMessage(null);
  }, [activeTabKey]);

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
    setInternalRole(allowedInternalRoles[0] || UserRole.MERCHANT);
  };

  const resetPasswordForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordTouched({
      current: false,
      next: false,
      confirm: false,
    });
    setPasswordVisibility({
      current: false,
      next: false,
      confirm: false,
    });
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

  const handleChangePassword = async () => {
    const trimmedCurrentPassword = currentPassword.trim();
    const trimmedNewPassword = newPassword.trim();
    const trimmedConfirmPassword = confirmPassword.trim();

    if (!trimmedCurrentPassword || !trimmedNewPassword || !trimmedConfirmPassword) {
      setPasswordTouched({
        current: true,
        next: true,
        confirm: true,
      });
      setError('Current password, new password, and confirmation are required.');
      return;
    }

    if (trimmedNewPassword.length < 8) {
      setPasswordTouched(current => ({ ...current, next: true }));
      setError('New password must be at least 8 characters.');
      return;
    }

    if (trimmedCurrentPassword === trimmedNewPassword) {
      setError('New password must be different from the current password.');
      return;
    }

    if (trimmedNewPassword !== trimmedConfirmPassword) {
      setPasswordTouched(current => ({ ...current, confirm: true }));
      setError('New password and confirm password must match.');
      return;
    }

    setPasswordSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await changePassword({
        currentPassword: trimmedCurrentPassword,
        newPassword: trimmedNewPassword,
        confirmPassword: trimmedConfirmPassword,
      });
      setSuccessMessage(response.message || 'Password updated successfully.');
      resetPasswordForm();
    } catch (submitError: any) {
      setError(submitError?.response?.data?.error || 'Unable to update password.');
    } finally {
      setPasswordSubmitting(false);
    }
  };

  const renderSummaryMetric = (label: string, value: string | number) => (
    <View style={[styles.metricBox, { backgroundColor: theme.custom.surfaceStrong, borderColor: theme.custom.border }]}>
      <Text style={[styles.metricLabel, { color: theme.custom.textSecondary }]}>{label}</Text>
      <Text style={[styles.metricValue, { color: theme.custom.textPrimary }]}>{value}</Text>
    </View>
  );

  const tabContext = {
    theme,
    styles,
    navigation,
    authUser,
    displayName,
    wallet,
    report,
    selectedCustomer,
    selectedCustomerId,
    setSelectedCustomerId,
    selectedCustomerWallet,
    selectedShopId,
    setSelectedShopId,
    availableShops,
    filteredCustomers,
    customerSearch,
    setCustomerSearch,
    pointTypeOptions,
    pointType,
    setPointType,
    points,
    setPoints,
    description,
    setDescription,
    purchaseAmount,
    setPurchaseAmount,
    spendPoints,
    setSpendPoints,
    spendDescription,
    setSpendDescription,
    submitting,
    handleAddPoints,
    handleSpendPoints,
    onLogout,
    currentPasswordError,
    newPasswordError,
    confirmPasswordError,
    passwordVisibility,
    setPasswordVisibility,
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    setPasswordTouched,
    passwordSubmitting,
    handleChangePassword,
    resetPasswordForm,
    transactionTypeOptions,
    transactionStatusOptions,
    transactionTypeFilter,
    setTransactionTypeFilter,
    transactionStatusFilter,
    setTransactionStatusFilter,
    filteredTransactions,
    shops,
    merchants,
    customers,
    representatives,
    shopName,
    setShopName,
    shopLocation,
    setShopLocation,
    shopDescription,
    setShopDescription,
    shopMerchantId,
    setShopMerchantId,
    shopSubmitting,
    handleSaveShop,
    editingShopId,
    resetShopForm,
    merchantNameMap,
    handleEditShop,
    handleToggleShopStatus,
    promotionTitle,
    setPromotionTitle,
    promotionDescription,
    setPromotionDescription,
    manageablePromotionShops,
    promotionShopId,
    setPromotionShopId,
    promotionBonusPoints,
    setPromotionBonusPoints,
    renderDateField,
    promotionStartDate,
    promotionEndDate,
    promotionSubmitting,
    handleCreatePromotion,
    resetPromotionForm,
    promotions,
    handleDeletePromotion,
    eventTitle,
    setEventTitle,
    eventDescription,
    setEventDescription,
    eventLocation,
    setEventLocation,
    eventStartDate,
    eventEndDate,
    eventSubmitting,
    handleCreateEvent,
    resetEventForm,
    events,
    handleDeleteEvent,
    formatDate,
    allowedInternalRoles,
    internalRole,
    setInternalRole,
    internalFirstName,
    setInternalFirstName,
    internalLastName,
    setInternalLastName,
    trimmedInternalUsername,
    internalUsername,
    setInternalUsername,
    internalEmailError,
    trimmedInternalEmail,
    internalEmail,
    setInternalEmail,
    internalPasswordError,
    internalPasswordVisible,
    setInternalPasswordVisible,
    internalPassword,
    setInternalPassword,
    userSubmitting,
    handleCreateInternalUser,
    resetInternalUserForm,
    customerUsers,
    renderSummaryMetric,
  };

  const activeRouteIndex = useMemo(
    () => routes.findIndex(routeItem => routeItem.key === activeTabKey),
    [activeTabKey, routes],
  );

  const renderActiveTabContent = () => {
    switch (activeTabKey) {
      case 'home':
      case 'dashboard':
        return <HomeOverviewTab context={tabContext} />;
      case 'wallet':
        return <WalletTab context={tabContext} />;
      case 'reports':
        return <ReportsTab context={tabContext} />;
      case 'user-management':
        return authUser?.role === UserRole.REPRESENTATIVE
          ? <RepresentativeUserManagementSection context={tabContext} />
          : <AdminUserManagementSection context={tabContext} />;
      case 'shop-management':
        return (
          <ShopManagementSection
            context={tabContext}
            title={t('management.admin.shopManagementTitle')}
            subtitle={t('management.admin.shopManagementSubtitle')}
          />
        );
      case 'promotions':
        return <PromotionsSection context={tabContext} editable />;
      case 'events':
        return <EventsSection context={tabContext} editable />;
      case 'transactions':
        return <TransactionsTab context={tabContext} />;
      case 'customers':
        return <CustomersTab context={tabContext} />;
      case 'add-points':
        return <AddPointsTab context={tabContext} />;
      case 'merchants':
        return (
          <UserListSection
            context={tabContext}
            title={t('directory.merchants.title')}
            subtitle={t('directory.merchants.subtitle')}
            users={merchants}
          />
        );
      case 'representatives':
        return (
          <UserListSection
            context={tabContext}
            title={t('directory.representatives.title')}
            subtitle={t('directory.representatives.subtitle')}
            users={representatives}
          />
        );
      case 'profile':
        return <ProfileTab context={tabContext} />;
      default:
        return <HomeOverviewTab context={tabContext} />;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.custom.background }]}>
      <View pointerEvents="none" style={styles.backdropLayer}>
        <View style={styles.backdropBase} />
        <View style={styles.backdropGlowBlue} />
        <View style={styles.backdropGlowOrange} />
        <View style={styles.backdropGrid} />
      </View>
      <ScrollView
        contentContainerStyle={[
          styles.contentFrame,
          {
            paddingTop: Math.max(insets.top + 16, 24),
            paddingBottom: Math.max(insets.bottom + 140, 148),
          },
        ]}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator animating size="large" style={styles.loader} />
          </View>
        ) : (
          <>
            <View
              style={[
                styles.headerCard,
                {
                  borderColor: 'rgba(255,255,255,0.1)',
                  shadowColor: theme.custom.shadow,
                },
              ]}
            >
              <View style={styles.headerGlowBlue} />
              <View style={styles.headerGlowOrange} />
              <View style={styles.headerGrid} />
              <View style={styles.headerTopRow}>
                <View style={styles.rolePill}>
                  <MaterialCommunityIcons name="shield-account-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.rolePillText}>
                    {authUser ? t(roleTitles[authUser.role]) : 'Co-Money'}
                  </Text>
                </View>
                <View style={styles.headerActions}>
                  <LanguageSwitcher tone="light" />
                  <Pressable onPress={() => void onLogout()} style={styles.headerLogoutButton}>
                    <MaterialCommunityIcons name="logout-variant" size={16} color="#FFFFFF" />
                    <Text style={styles.headerLogoutText}>{t('dashboard.logout')}</Text>
                  </Pressable>
                </View>
              </View>

              <View style={styles.headerAccentRow}>
                <View style={styles.headerAccentLine} />
                <View style={styles.headerAccentDot} />
              </View>
              <Text style={styles.dashboardKicker}>{activeRoute?.title || t('dashboard.overview')}</Text>
              <Text style={styles.dashboardTitle}>
                {displayName ? t('dashboard.welcomeBack', { name: displayName }) : 'Co-Money'}
              </Text>
              <Text style={styles.dashboardSubtitle}>
                {t('dashboard.bannerSubtitle', { section: activeRoute?.title || t('dashboard.overview') })}
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
                  {activeRoute?.title || t('dashboard.overview')}
                </Text>
                <Text style={[styles.sheetSubtitle, { color: theme.custom.textSecondary }]}>
                  {t('dashboard.sheetSubtitle')}
                </Text>
              </View>

              {error ? <Text style={[styles.message, { color: theme.custom.error }]}>{error}</Text> : null}
              {successMessage ? <Text style={[styles.message, { color: theme.custom.success }]}>{successMessage}</Text> : null}
              <View style={styles.tabNavigatorShell}>
                <View style={styles.tabSceneContent}>
                  {renderActiveTabContent()}
                </View>
              </View>
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

          </>
        )}
      </ScrollView>
      {!loading && routes.length ? (
        <View style={styles.bottomBarOverlay}>
          <BottomTabBar
            routes={routes}
            routeIndex={activeRouteIndex >= 0 ? activeRouteIndex : 0}
            onSelectRoute={index => {
              const target = routes[index];
              if (target?.key) {
                setActiveTabKey(target.key as keyof HomeTabParamList);
              }
            }}
            bottomInset={insets.bottom}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backdropLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  backdropBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F4F7FB',
  },
  backdropGlowBlue: {
    position: 'absolute',
    top: -70,
    right: -60,
    width: 280,
    height: 280,
    borderRadius: 999,
    backgroundColor: 'rgba(47,107,255,0.16)',
  },
  backdropGlowOrange: {
    position: 'absolute',
    top: 150,
    left: -70,
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: 'rgba(243,111,33,0.12)',
  },
  backdropGrid: {
    position: 'absolute',
    top: 80,
    right: 22,
    width: 132,
    height: 132,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.05)',
  },
  contentFrame: {
    paddingHorizontal: 0,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerCard: {
    overflow: 'hidden',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 18,
    backgroundColor: '#071823',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 1,
    shadowRadius: 28,
    elevation: 8,
  },
  headerGlowBlue: {
    position: 'absolute',
    top: -32,
    right: -10,
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: 'rgba(47,107,255,0.24)',
  },
  headerGlowOrange: {
    position: 'absolute',
    bottom: -42,
    left: -22,
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: 'rgba(243,111,33,0.2)',
  },
  headerGrid: {
    position: 'absolute',
    top: 18,
    right: 18,
    width: 118,
    height: 118,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
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
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  rolePillText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  headerLogoutButton: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerLogoutText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  headerAccentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  headerAccentLine: {
    width: 56,
    height: 4,
    borderRadius: 999,
    backgroundColor: '#F36F21',
  },
  headerAccentDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: '#8DB4FF',
  },
  dashboardKicker: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 10,
  },
  dashboardTitle: {
    color: '#FFFFFF',
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '900',
    marginBottom: 8,
  },
  dashboardSubtitle: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 14,
    lineHeight: 21,
  },
  sheet: {
    marginHorizontal: 16,
    marginBottom: 0,
    borderRadius: 30,
    paddingHorizontal: 18,
    paddingTop: 24,
    paddingBottom: 8,
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
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 24,
    borderRadius: 30,
    justifyContent: 'center',
    minHeight: 360,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
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
  tabNavigatorShell: {
    position: 'relative',
  },
  tabSceneContent: {
    paddingTop: 6,
    paddingBottom: 8,
  },
  bottomBarOverlay: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 12,
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
});
