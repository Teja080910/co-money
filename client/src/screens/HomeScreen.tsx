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
import { ActivityIndicator, Button, Portal, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { UserRole } from '../constants/userRoles';
import { FEEDBACK_AUTO_DISMISS_MS } from '../constants/feedback';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { FloatingLabelInput } from '../components/auth/FloatingLabelInput';
import { SelectField } from '../components/common/SelectField';
import { AddPointsTab } from '../components/home-tabs/AddPointsTab';
import { CustomersTab } from '../components/home-tabs/CustomersTab';
import { HomeOverviewTab } from '../components/home-tabs/HomeOverviewTab';
import {
  AdminUserManagementSection,
  CategorySettingsSection,
  EventsSection,
  PromotionsSection,
  RepresentativeUserManagementSection,
  ShopManagementSection,
  SystemConfigurationSection,
  UserListSection,
} from '../components/home-tabs/ManagementSections';
import { ProfileTab } from '../components/home-tabs/ProfileTab';
import { ReportsTab } from '../components/home-tabs/ReportsTab';
import { TransactionsTab } from '../components/home-tabs/TransactionsTab';
import { WalletTab } from '../components/home-tabs/WalletTab';
import { BottomTabBar } from '../components/navigation/BottomTabBar';
import { useAutoDismissMessage } from '../hooks/useAutoDismissMessage';
import { getRoutesForRole } from '../navigation/homeTabConfig';
import type { HomeTabParamList, ScreenProps } from '../navigation/types';
import { apiClient, getApiErrorMessage } from '../services/api';
import { changePassword, fetchAuthenticatedProfile, getAuthenticatedUser, logoutUser, type AuthUser } from '../services/auth';
import type { AppTheme } from '../theme/theme';

type WalletTransaction = {
  id: string;
  walletId: string;
  customerId: string;
  merchantId: string | null;
  performedByUserId: string;
  shopId: string | null;
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
  isActive?: boolean;
  status?: 'ACTIVE' | 'INACTIVE' | 'DELETED';
  deactivatedAt?: string | null;
  deletedAt?: string | null;
};

type ReportSummary = {
  totalCustomers: number;
  totalShops: number;
  totalPointsIssued: number;
  totalPointsSpent: number;
  activeBalance: number;
  monthlyPointsIssued?: number;
  monthlyPointsSpent?: number;
  topShops?: Array<{
    id: string;
    name: string;
    location: string;
    transactionCount: number;
    pointsIssued: number;
    pointsSpent: number;
  }>;
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
  isClaimed?: boolean;
  message?: string;
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

type ShopCategory = {
  id: string;
  shopId: string;
  shopName: string;
  name: string;
  formattedName: string;
  discountPercent: number;
  isDefault: boolean;
  isActive: boolean;
};

type SystemConfig = {
  id?: string;
  version: number;
  welcomeBonusPoints: number;
  pointExpirationDays: number;
  maxPointsPerTransaction: number;
  defaultMaxDiscountPercent: number;
  updatedByUserId: string;
  changeReason: string | null;
  createdAt: string | Date;
};

type SettlementPreview = {
  customerId: string;
  shopId: string;
  categoryId: string | null;
  categoryName: string | null;
  availablePoints: number;
  requestedPoints: number;
  usedPoints: number;
  maxDiscountPoints: number;
  maxDiscountPercent: number;
  payableAmount: number | null;
  earnedPoints: number | null;
  bonusPoints: number;
  predictedBalance: number;
};

type PaginatedResponse<T> = {
  items: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
};

type PaginatedListState<T> = {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  loading: boolean;
};

type ActiveEditSheet = 'shop' | 'promotion' | 'event' | 'category' | 'configuration' | null;
type WalletActionFeedback = 'earn' | 'spend' | 'preview' | null;
type ManagementFeedbackTarget =
  | 'shopForm'
  | 'shopList'
  | 'promotionForm'
  | 'promotionList'
  | 'eventForm'
  | 'eventList'
  | 'categoryForm'
  | 'categoryList'
  | 'configurationForm'
  | 'configurationList'
  | 'internalUserForm'
  | 'representativesList'
  | 'merchantsList'
  | 'customersList'
  | 'editSheet';

type ManagementFeedbackState = {
  target: ManagementFeedbackTarget | null;
  error: string | null;
  success: string | null;
};

const createEmptyManagementFeedback = (): ManagementFeedbackState => ({
  target: null,
  error: null,
  success: null,
});

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
const defaultPageSize = 5;

function createInitialPaginatedListState<T>(): PaginatedListState<T> {
  return {
    items: [],
    page: 1,
    pageSize: defaultPageSize,
    totalItems: 0,
    totalPages: 0,
    loading: false,
  };
}

function toPaginatedListState<T>(response: PaginatedResponse<T>): PaginatedListState<T> {
  return {
    items: response.items,
    page: response.pagination.page,
    pageSize: response.pagination.pageSize,
    totalItems: response.pagination.totalItems,
    totalPages: response.pagination.totalPages,
    loading: false,
  };
}

function mergeItemsById<T extends { id?: string | null }>(items: T[], updatedItem: Partial<T> & { id: string }) {
  return items.map(item => (item.id === updatedItem.id ? { ...item, ...updatedItem } : item));
}

function removeItemFromPaginatedListState<T extends { id?: string | null }>(state: PaginatedListState<T>, itemId: string): PaginatedListState<T> {
  const nextItems = state.items.filter(item => item.id !== itemId);
  const removedCount = state.items.length - nextItems.length;
  const totalItems = Math.max(state.totalItems - removedCount, 0);
  const totalPages = totalItems ? Math.ceil(totalItems / state.pageSize) : 0;
  const page = totalPages === 0 ? 1 : Math.min(state.page, totalPages);

  return {
    ...state,
    items: nextItems,
    page,
    totalItems,
    totalPages,
  };
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString();
}

function getManagedUserFeedbackTarget(role: AuthUser['role']): Extract<ManagementFeedbackTarget, 'representativesList' | 'merchantsList' | 'customersList'> {
  switch (role) {
    case UserRole.REPRESENTATIVE:
      return 'representativesList';
    case UserRole.MERCHANT:
      return 'merchantsList';
    default:
      return 'customersList';
  }
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
  const [transactionPage, setTransactionPage] = useState(1);
  const [transactionPageSize, setTransactionPageSize] = useState(defaultPageSize);
  const [transactionTotalItems, setTransactionTotalItems] = useState(0);
  const [transactionTotalPages, setTransactionTotalPages] = useState(0);
  const [transactionLoading, setTransactionLoading] = useState(false);
  const [shops, setShops] = useState<Shop[]>([]);
  const [customers, setCustomers] = useState<UserSummary[]>([]);
  const [merchants, setMerchants] = useState<UserSummary[]>([]);
  const [representatives, setRepresentatives] = useState<UserSummary[]>([]);
  const [report, setReport] = useState<ReportSummary | null>(null);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [categories, setCategories] = useState<ShopCategory[]>([]);
  const [systemConfig, setSystemConfig] = useState<SystemConfig | null>(null);
  const [systemConfigHistory, setSystemConfigHistory] = useState<SystemConfig[]>([]);
  const [customerListState, setCustomerListState] = useState<PaginatedListState<UserSummary>>(createInitialPaginatedListState());
  const [directoryCustomerListState, setDirectoryCustomerListState] = useState<PaginatedListState<UserSummary>>(createInitialPaginatedListState());
  const [merchantListState, setMerchantListState] = useState<PaginatedListState<UserSummary>>(createInitialPaginatedListState());
  const [representativeListState, setRepresentativeListState] = useState<PaginatedListState<UserSummary>>(createInitialPaginatedListState());
  const [shopListState, setShopListState] = useState<PaginatedListState<Shop>>(createInitialPaginatedListState());
  const [promotionListState, setPromotionListState] = useState<PaginatedListState<Promotion>>(createInitialPaginatedListState());
  const [eventListState, setEventListState] = useState<PaginatedListState<EventItem>>(createInitialPaginatedListState());
  const [categoryListState, setCategoryListState] = useState<PaginatedListState<ShopCategory>>(createInitialPaginatedListState());
  const [systemConfigHistoryListState, setSystemConfigHistoryListState] = useState<PaginatedListState<SystemConfig>>(createInitialPaginatedListState());
  const [listRefreshNonce, setListRefreshNonce] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [shopSubmitting, setShopSubmitting] = useState(false);
  const [shopUpdateSubmitting, setShopUpdateSubmitting] = useState(false);
  const [shopStatusLoadingId, setShopStatusLoadingId] = useState('');
  const [promotionSubmitting, setPromotionSubmitting] = useState(false);
  const [promotionUpdateSubmitting, setPromotionUpdateSubmitting] = useState(false);
  const [promotionActionLoadingState, setPromotionActionLoadingState] = useState<{ id: string; action: 'status' | 'delete' } | null>(null);
  const [claimingPromotionId, setClaimingPromotionId] = useState('');
  const [eventSubmitting, setEventSubmitting] = useState(false);
  const [eventUpdateSubmitting, setEventUpdateSubmitting] = useState(false);
  const [eventActionLoadingState, setEventActionLoadingState] = useState<{ id: string; action: 'status' | 'delete' } | null>(null);
  const [categorySubmitting, setCategorySubmitting] = useState(false);
  const [categoryUpdateSubmitting, setCategoryUpdateSubmitting] = useState(false);
  const [categoryActionLoadingState, setCategoryActionLoadingState] = useState<{ id: string; action: 'status' | 'delete' } | null>(null);
  const [userSubmitting, setUserSubmitting] = useState(false);
  const [configSubmitting, setConfigSubmitting] = useState(false);
  const [configUpdateSubmitting, setConfigUpdateSubmitting] = useState(false);
  const [configHistoryActionLoadingState, setConfigHistoryActionLoadingState] = useState<{ id: string; action: 'delete' } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [managementFeedback, setManagementFeedback] = useState<ManagementFeedbackState>(createEmptyManagementFeedback);
  const [walletActionFeedback, setWalletActionFeedback] = useState<WalletActionFeedback>(null);
  const [activeTabKey, setActiveTabKey] = useState<keyof HomeTabParamList>('home');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedShopId, setSelectedShopId] = useState('');
  const [points, setPoints] = useState('');
  const [description, setDescription] = useState('');
  const [pointType, setPointType] = useState<'STANDARD' | 'BONUS'>('STANDARD');
  const [purchaseAmount, setPurchaseAmount] = useState('');
  const [spendPoints, setSpendPoints] = useState('');
  const [spendDescription, setSpendDescription] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [settlementPreview, setSettlementPreview] = useState<SettlementPreview | null>(null);
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
  const [editingPromotionId, setEditingPromotionId] = useState('');
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventStartDate, setEventStartDate] = useState('');
  const [eventEndDate, setEventEndDate] = useState('');
  const [editingEventId, setEditingEventId] = useState('');
  const [categoryShopId, setCategoryShopId] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [categoryDiscountPercent, setCategoryDiscountPercent] = useState('');
  const [categoryIsDefault, setCategoryIsDefault] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState('');
  const [activeEditSheet, setActiveEditSheet] = useState<ActiveEditSheet>(null);
  const [configWelcomeBonusPoints, setConfigWelcomeBonusPoints] = useState('');
  const [configPointExpirationDays, setConfigPointExpirationDays] = useState('');
  const [configMaxPointsPerTransaction, setConfigMaxPointsPerTransaction] = useState('');
  const [configDefaultMaxDiscountPercent, setConfigDefaultMaxDiscountPercent] = useState('');
  const [configChangeReason, setConfigChangeReason] = useState('');
  const [editingConfigurationId, setEditingConfigurationId] = useState('');
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

  const clearManagementFeedback = useCallback(() => {
    setManagementFeedback(createEmptyManagementFeedback());
  }, []);

  const clearGlobalFeedback = useCallback(() => {
    setError(null);
    setSuccessMessage(null);
    setWalletActionFeedback(null);
  }, []);

  const showManagementFeedback = useCallback((
    target: ManagementFeedbackTarget,
    next: { error?: string | null; success?: string | null },
  ) => {
    setManagementFeedback({
      target,
      error: next.error ?? null,
      success: next.success ?? null,
    });
  }, []);

  const activeGlobalFeedbackMessage = error || successMessage
    ? `${walletActionFeedback ?? 'global'}:${error ?? successMessage}`
    : null;
  const activeManagementFeedbackMessage = managementFeedback.error || managementFeedback.success
    ? `${managementFeedback.target ?? 'management'}:${managementFeedback.error ?? managementFeedback.success}`
    : null;

  useAutoDismissMessage(activeGlobalFeedbackMessage, clearGlobalFeedback, FEEDBACK_AUTO_DISMISS_MS);
  useAutoDismissMessage(activeManagementFeedbackMessage, clearManagementFeedback, FEEDBACK_AUTO_DISMISS_MS);

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
  const showWelcomeHeader = Boolean(activeRoute?.showWelcomeHeader);

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

  const shopNameMap = useMemo(() => {
    return shops.reduce<Record<string, string>>((acc, shop) => {
      acc[shop.id] = shop.name;
      return acc;
    }, {});
  }, [shops]);

  const userDisplayNameMap = useMemo(() => {
    const map: Record<string, string> = {};

    const allUsers = [...customers, ...merchants, ...representatives];
    allUsers.forEach(user => {
      map[user.id] = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username;
    });

    if (authUser) {
      map[authUser.id] = [authUser.firstName, authUser.lastName].filter(Boolean).join(' ') || authUser.username;
    }

    return map;
  }, [authUser, customers, merchants, representatives]);

  const availableShops = useMemo(() => {
    if (!authUser) {
      return shops;
    }

    if (authUser.role === UserRole.MERCHANT) {
      return shops.filter(shop => shop.merchantId === authUser.id);
    }

    if (authUser.role === UserRole.REPRESENTATIVE) {
      return shops.filter(shop => shop.representativeId === authUser.id);
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

  const visibleCategories = useMemo(() => {
    if (!selectedShopId.trim()) {
      return categories;
    }

    return categories.filter(category => category.shopId === selectedShopId);
  }, [categories, selectedShopId]);

  const manageableCategories = useMemo(() => {
    if (!categoryShopId.trim()) {
      return categories;
    }

    return categories.filter(category => category.shopId === categoryShopId);
  }, [categories, categoryShopId]);

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
    ? t('apiErrors.emailInvalid')
    : undefined;
  const internalPasswordError = internalTouched.password && internalPassword && internalPassword.length < 8
    ? t('apiErrors.passwordShort')
    : undefined;
  const currentPasswordError = passwordTouched.current && !currentPassword.trim()
    ? t('profile.password.errors.currentRequired')
    : undefined;
  const newPasswordError = passwordTouched.next && newPassword.trim() && newPassword.trim().length < 8
    ? t('profile.password.errors.newShort')
    : undefined;
  const confirmPasswordError = passwordTouched.confirm && confirmPassword.trim() && confirmPassword !== newPassword
    ? t('profile.password.errors.confirmMismatch')
    : undefined;

  const applyConfigurationFormValues = useCallback((config: SystemConfig | null) => {
    if (!config) {
      setConfigWelcomeBonusPoints('');
      setConfigPointExpirationDays('');
      setConfigMaxPointsPerTransaction('');
      setConfigDefaultMaxDiscountPercent('');
      setConfigChangeReason('');
      return;
    }

    setConfigWelcomeBonusPoints(String(config.welcomeBonusPoints));
    setConfigPointExpirationDays(String(config.pointExpirationDays));
    setConfigMaxPointsPerTransaction(String(config.maxPointsPerTransaction));
    setConfigDefaultMaxDiscountPercent(String(config.defaultMaxDiscountPercent));
    setConfigChangeReason(config.changeReason || '');
  }, []);

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
      const authenticatedProfile = await fetchAuthenticatedProfile();
      setAuthUser(authenticatedProfile);

      if (authenticatedProfile.role === UserRole.CUSTOMER) {
        const [walletResponse, shopsResponse, promotionsResponse, eventsResponse] = await Promise.all([
          apiClient.get<WalletResponse>('/api/wallet/me'),
          apiClient.get<Shop[]>('/api/shops'),
          apiClient.get<Promotion[]>('/api/promotions'),
          apiClient.get<EventItem[]>('/api/events'),
        ]);

        setWallet(walletResponse.data);
        setShops(shopsResponse.data);
        setPromotions(promotionsResponse.data);
        setEvents(eventsResponse.data);
        setCategories([]);
        setSystemConfig(null);
        setSystemConfigHistory([]);
        setCustomers([]);
        setMerchants([]);
        setRepresentatives([]);
        setReport(null);
      } else {
        const requests: Array<Promise<any>> = [
          apiClient.get<UserSummary[]>('/api/users/customers'),
          apiClient.get<Shop[]>('/api/shops'),
          apiClient.get<Promotion[]>('/api/promotions'),
          apiClient.get<EventItem[]>('/api/events'),
          apiClient.get<ShopCategory[]>('/api/categories'),
        ];

        if (authenticatedProfile.role === UserRole.REPRESENTATIVE || authenticatedProfile.role === UserRole.ADMIN) {
          requests.push(apiClient.get<UserSummary[]>('/api/users/merchants'));
          requests.push(apiClient.get<ReportSummary>('/api/wallet/reports/summary'));
        }

        if (authenticatedProfile.role === UserRole.ADMIN) {
          requests.push(apiClient.get<SystemConfig>('/api/system-config'));
          requests.push(apiClient.get<SystemConfig[]>('/api/system-config/history'));
          requests.push(apiClient.get<UserSummary[]>('/api/users/representatives'));
        }

        const responses = await Promise.all(requests);

        setWallet(null);
        setCustomers(responses[0].data);
        setShops(responses[1].data);
        setPromotions(responses[2].data);
        setEvents(responses[3].data);
        setCategories(responses[4].data);
        setMerchants(authenticatedProfile.role === UserRole.REPRESENTATIVE || authenticatedProfile.role === UserRole.ADMIN ? responses[5].data : []);
        setReport(
          authenticatedProfile.role === UserRole.REPRESENTATIVE
            ? responses[6].data
            : authenticatedProfile.role === UserRole.ADMIN
              ? responses[6].data
              : null,
        );
        if (authenticatedProfile.role === UserRole.ADMIN) {
          setSystemConfig(responses[7].data);
          setSystemConfigHistory(responses[8].data);
          setRepresentatives(responses[9].data);
        } else {
          setSystemConfig(null);
          setSystemConfigHistory([]);
          setRepresentatives([]);
        }
      }

      const transactionsResponse = await apiClient.get<PaginatedResponse<WalletTransaction>>('/api/wallet/transactions', {
        params: {
          page: transactionPage,
          pageSize: transactionPageSize,
          type: transactionTypeFilter === 'ALL' ? undefined : transactionTypeFilter,
          status: transactionStatusFilter === 'ALL' ? undefined : transactionStatusFilter,
        },
      });

      setTransactions(transactionsResponse.data.items);
      setTransactionPage(transactionsResponse.data.pagination.page);
      setTransactionTotalItems(transactionsResponse.data.pagination.totalItems);
      setTransactionTotalPages(transactionsResponse.data.pagination.totalPages);
      setListRefreshNonce(current => current + 1);
    } catch (loadError: any) {
      if (loadError?.response?.status === 401) {
        await logoutUser();
        navigation.replace('Login');
        return;
      }

      setError(loadError?.response?.data?.error || t('homeScreen.errors.loadDashboard'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [navigation, transactionPage, transactionPageSize, transactionStatusFilter, transactionTypeFilter]);

  const loadTransactions = useCallback(async (nextPage = transactionPage, nextPageSize = transactionPageSize) => {
    if (!authUser) {
      return;
    }

    setTransactionLoading(true);

    try {
      const response = await apiClient.get<PaginatedResponse<WalletTransaction>>('/api/wallet/transactions', {
        params: {
          page: nextPage,
          pageSize: nextPageSize,
          type: transactionTypeFilter === 'ALL' ? undefined : transactionTypeFilter,
          status: transactionStatusFilter === 'ALL' ? undefined : transactionStatusFilter,
        },
      });

      setTransactions(response.data.items);
      setTransactionPage(response.data.pagination.page);
      setTransactionTotalItems(response.data.pagination.totalItems);
      setTransactionTotalPages(response.data.pagination.totalPages);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, t('homeScreen.errors.loadTransactions')));
    } finally {
      setTransactionLoading(false);
    }
  }, [authUser, transactionPage, transactionPageSize, transactionStatusFilter, transactionTypeFilter]);

  const loadCustomerListPage = useCallback(async (nextPage = customerListState.page) => {
    if (!authUser || authUser.role === UserRole.CUSTOMER) {
      setCustomerListState(createInitialPaginatedListState<UserSummary>());
      return;
    }

    setCustomerListState(current => ({ ...current, loading: true }));

    try {
      const response = await apiClient.get<PaginatedResponse<UserSummary>>('/api/users/customers', {
        params: {
          page: nextPage,
          pageSize: customerListState.pageSize,
          search: customerSearch.trim() || undefined,
        },
      });

      setCustomerListState(toPaginatedListState(response.data));
    } catch (loadError) {
      setCustomerListState(current => ({ ...current, loading: false }));
      setError(getApiErrorMessage(loadError, t('homeScreen.errors.loadListData')));
    }
  }, [authUser, customerListState.page, customerListState.pageSize, customerSearch, t]);

  const loadDirectoryCustomerListPage = useCallback(async (nextPage = directoryCustomerListState.page) => {
    if (!authUser || (authUser.role !== UserRole.REPRESENTATIVE && authUser.role !== UserRole.ADMIN)) {
      setDirectoryCustomerListState(createInitialPaginatedListState<UserSummary>());
      return;
    }

    setDirectoryCustomerListState(current => ({ ...current, loading: true }));

    try {
      const response = await apiClient.get<PaginatedResponse<UserSummary>>('/api/users/customers', {
        params: {
          page: nextPage,
          pageSize: directoryCustomerListState.pageSize,
        },
      });

      setDirectoryCustomerListState(toPaginatedListState(response.data));
    } catch (loadError) {
      setDirectoryCustomerListState(current => ({ ...current, loading: false }));
      setError(getApiErrorMessage(loadError, t('homeScreen.errors.loadListData')));
    }
  }, [authUser, directoryCustomerListState.page, directoryCustomerListState.pageSize, t]);

  const loadMerchantListPage = useCallback(async (nextPage = merchantListState.page) => {
    if (!authUser || (authUser.role !== UserRole.REPRESENTATIVE && authUser.role !== UserRole.ADMIN)) {
      setMerchantListState(createInitialPaginatedListState<UserSummary>());
      return;
    }

    setMerchantListState(current => ({ ...current, loading: true }));

    try {
      const response = await apiClient.get<PaginatedResponse<UserSummary>>('/api/users/merchants', {
        params: {
          page: nextPage,
          pageSize: merchantListState.pageSize,
        },
      });

      setMerchantListState(toPaginatedListState(response.data));
    } catch (loadError) {
      setMerchantListState(current => ({ ...current, loading: false }));
      setError(getApiErrorMessage(loadError, t('homeScreen.errors.loadListData')));
    }
  }, [authUser, merchantListState.page, merchantListState.pageSize, t]);

  const loadRepresentativeListPage = useCallback(async (nextPage = representativeListState.page) => {
    if (!authUser || authUser.role !== UserRole.ADMIN) {
      setRepresentativeListState(createInitialPaginatedListState<UserSummary>());
      return;
    }

    setRepresentativeListState(current => ({ ...current, loading: true }));

    try {
      const response = await apiClient.get<PaginatedResponse<UserSummary>>('/api/users/representatives', {
        params: {
          page: nextPage,
          pageSize: representativeListState.pageSize,
        },
      });

      setRepresentativeListState(toPaginatedListState(response.data));
    } catch (loadError) {
      setRepresentativeListState(current => ({ ...current, loading: false }));
      setError(getApiErrorMessage(loadError, t('homeScreen.errors.loadListData')));
    }
  }, [authUser, representativeListState.page, representativeListState.pageSize, t]);

  const loadShopListPage = useCallback(async (nextPage = shopListState.page) => {
    if (!authUser) {
      setShopListState(createInitialPaginatedListState<Shop>());
      return;
    }

    setShopListState(current => ({ ...current, loading: true }));

    try {
      const response = await apiClient.get<PaginatedResponse<Shop>>('/api/shops', {
        params: {
          page: nextPage,
          pageSize: shopListState.pageSize,
        },
      });

      setShopListState(toPaginatedListState(response.data));
    } catch (loadError) {
      setShopListState(current => ({ ...current, loading: false }));
      setError(getApiErrorMessage(loadError, t('homeScreen.errors.loadListData')));
    }
  }, [authUser, shopListState.page, shopListState.pageSize, t]);

  const applyShopUpdate = useCallback((updatedShop: Shop) => {
    const mergeShop = (items: Shop[]) => items.map(item => (item.id === updatedShop.id ? { ...item, ...updatedShop } : item));
    setShops(current => mergeShop(current));
    setShopListState(current => ({ ...current, items: mergeShop(current.items) }));
  }, []);

  const applyPromotionUpdate = useCallback((updatedPromotion: Partial<Promotion> & { id: string }) => {
    setPromotions(current => mergeItemsById(current, updatedPromotion));
    setPromotionListState(current => ({ ...current, items: mergeItemsById(current.items, updatedPromotion) }));
  }, []);

  const removePromotion = useCallback((promotionId: string) => {
    setPromotions(current => current.filter(item => item.id !== promotionId));
    setPromotionListState(current => removeItemFromPaginatedListState(current, promotionId));
  }, []);

  const applyEventUpdate = useCallback((updatedEvent: Partial<EventItem> & { id: string }) => {
    setEvents(current => mergeItemsById(current, updatedEvent));
    setEventListState(current => ({ ...current, items: mergeItemsById(current.items, updatedEvent) }));
  }, []);

  const removeEvent = useCallback((eventId: string) => {
    setEvents(current => current.filter(item => item.id !== eventId));
    setEventListState(current => removeItemFromPaginatedListState(current, eventId));
  }, []);

  const applyCategoryUpdate = useCallback((updatedCategory: Partial<ShopCategory> & { id: string }) => {
    setCategories(current => mergeItemsById(current, updatedCategory));
    setCategoryListState(current => ({ ...current, items: mergeItemsById(current.items, updatedCategory) }));
  }, []);

  const removeCategory = useCallback((categoryId: string) => {
    setCategories(current => current.filter(item => item.id !== categoryId));
    setCategoryListState(current => removeItemFromPaginatedListState(current, categoryId));
  }, []);

  const applySystemConfigUpdate = useCallback((updatedConfig: Partial<SystemConfig> & { id: string }) => {
    setSystemConfigHistory(current => mergeItemsById(current, updatedConfig));
    setSystemConfigHistoryListState(current => ({ ...current, items: mergeItemsById(current.items, updatedConfig) }));
    if (systemConfig?.id === updatedConfig.id) {
      setSystemConfig(current => (current ? { ...current, ...updatedConfig } : current));
    }
  }, [systemConfig?.id]);

  const removeSystemConfigEntry = useCallback((configId: string) => {
    setSystemConfigHistory(current => current.filter(item => item.id !== configId));
    setSystemConfigHistoryListState(current => removeItemFromPaginatedListState(current, configId));
    if (systemConfig?.id === configId) {
      setSystemConfig(null);
    }
  }, [systemConfig?.id]);

  const loadPromotionListPage = useCallback(async (nextPage = promotionListState.page) => {
    if (!authUser) {
      setPromotionListState(createInitialPaginatedListState<Promotion>());
      return;
    }

    setPromotionListState(current => ({ ...current, loading: true }));

    try {
      const response = await apiClient.get<PaginatedResponse<Promotion>>('/api/promotions', {
        params: {
          page: nextPage,
          pageSize: promotionListState.pageSize,
        },
      });

      setPromotionListState(toPaginatedListState(response.data));
    } catch (loadError) {
      setPromotionListState(current => ({ ...current, loading: false }));
      setError(getApiErrorMessage(loadError, t('homeScreen.errors.loadListData')));
    }
  }, [authUser, promotionListState.page, promotionListState.pageSize, t]);

  const loadEventListPage = useCallback(async (nextPage = eventListState.page) => {
    if (!authUser) {
      setEventListState(createInitialPaginatedListState<EventItem>());
      return;
    }

    setEventListState(current => ({ ...current, loading: true }));

    try {
      const response = await apiClient.get<PaginatedResponse<EventItem>>('/api/events', {
        params: {
          page: nextPage,
          pageSize: eventListState.pageSize,
        },
      });

      setEventListState(toPaginatedListState(response.data));
    } catch (loadError) {
      setEventListState(current => ({ ...current, loading: false }));
      setError(getApiErrorMessage(loadError, t('homeScreen.errors.loadListData')));
    }
  }, [authUser, eventListState.page, eventListState.pageSize, t]);

  const loadCategoryListPage = useCallback(async (nextPage = categoryListState.page) => {
    if (!authUser || authUser.role === UserRole.CUSTOMER) {
      setCategoryListState(createInitialPaginatedListState<ShopCategory>());
      return;
    }

    setCategoryListState(current => ({ ...current, loading: true }));

    try {
      const response = await apiClient.get<PaginatedResponse<ShopCategory>>('/api/categories', {
        params: {
          page: nextPage,
          pageSize: categoryListState.pageSize,
          shopId: categoryShopId.trim() || undefined,
        },
      });

      setCategoryListState(toPaginatedListState(response.data));
    } catch (loadError) {
      setCategoryListState(current => ({ ...current, loading: false }));
      setError(getApiErrorMessage(loadError, t('homeScreen.errors.loadListData')));
    }
  }, [authUser, categoryListState.page, categoryListState.pageSize, categoryShopId, t]);

  const loadSystemConfigHistoryListPage = useCallback(async (nextPage = systemConfigHistoryListState.page) => {
    if (!authUser || authUser.role !== UserRole.ADMIN) {
      setSystemConfigHistoryListState(createInitialPaginatedListState<SystemConfig>());
      return;
    }

    setSystemConfigHistoryListState(current => ({ ...current, loading: true }));

    try {
      const response = await apiClient.get<PaginatedResponse<SystemConfig>>('/api/system-config/history', {
        params: {
          page: nextPage,
          pageSize: systemConfigHistoryListState.pageSize,
        },
      });

      setSystemConfigHistoryListState(toPaginatedListState(response.data));
    } catch (loadError) {
      setSystemConfigHistoryListState(current => ({ ...current, loading: false }));
      setError(getApiErrorMessage(loadError, t('homeScreen.errors.loadListData')));
    }
  }, [authUser, systemConfigHistoryListState.page, systemConfigHistoryListState.pageSize, t]);

  const applyManagedUserUpdate = useCallback((updatedUser: UserSummary) => {
    const mergeUser = (items: UserSummary[]) => items.map(item => (item.id === updatedUser.id ? { ...item, ...updatedUser } : item));

    switch (updatedUser.role) {
      case UserRole.CUSTOMER:
        setCustomers(current => mergeUser(current));
        setCustomerListState(current => ({ ...current, items: mergeUser(current.items) }));
        setDirectoryCustomerListState(current => ({ ...current, items: mergeUser(current.items) }));
        break;
      case UserRole.MERCHANT:
        setMerchants(current => mergeUser(current));
        setMerchantListState(current => ({ ...current, items: mergeUser(current.items) }));
        break;
      case UserRole.REPRESENTATIVE:
        setRepresentatives(current => mergeUser(current));
        setRepresentativeListState(current => ({ ...current, items: mergeUser(current.items) }));
        break;
      default:
        break;
    }
  }, []);

  const refreshManagedUsersByRole = useCallback(async (role: AuthUser['role']) => {
    switch (role) {
      case UserRole.CUSTOMER: {
        const requests: Array<Promise<any>> = [
          apiClient.get<UserSummary[]>('/api/users/customers'),
          loadCustomerListPage(1),
        ];

        if (authUser && (authUser.role === UserRole.REPRESENTATIVE || authUser.role === UserRole.ADMIN)) {
          requests.push(loadDirectoryCustomerListPage(1));
        }

        const [customersResponse] = await Promise.all(requests);
        setCustomers(customersResponse.data);
        return;
      }
      case UserRole.MERCHANT: {
        if (!authUser || (authUser.role !== UserRole.REPRESENTATIVE && authUser.role !== UserRole.ADMIN)) {
          return;
        }

        const [merchantsResponse] = await Promise.all([
          apiClient.get<UserSummary[]>('/api/users/merchants'),
          loadMerchantListPage(1),
        ]);
        setMerchants(merchantsResponse.data);
        return;
      }
      case UserRole.REPRESENTATIVE: {
        if (!authUser || authUser.role !== UserRole.ADMIN) {
          return;
        }

        const [representativesResponse] = await Promise.all([
          apiClient.get<UserSummary[]>('/api/users/representatives'),
          loadRepresentativeListPage(1),
        ]);
        setRepresentatives(representativesResponse.data);
        return;
      }
      default:
        return;
    }
  }, [authUser, loadCustomerListPage, loadDirectoryCustomerListPage, loadMerchantListPage, loadRepresentativeListPage]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    setCustomerListState(current => (current.page === 1 ? current : { ...current, page: 1 }));
  }, [customerSearch]);

  useEffect(() => {
    setCategoryListState(current => (current.page === 1 ? current : { ...current, page: 1 }));
  }, [categoryShopId]);

  useEffect(() => {
    if (!listRefreshNonce) {
      return;
    }

    void loadCustomerListPage();
  }, [authUser?.role, customerListState.page, customerListState.pageSize, customerSearch, listRefreshNonce, loadCustomerListPage]);

  useEffect(() => {
    if (!listRefreshNonce) {
      return;
    }

    void loadDirectoryCustomerListPage();
  }, [authUser?.role, directoryCustomerListState.page, directoryCustomerListState.pageSize, listRefreshNonce, loadDirectoryCustomerListPage]);

  useEffect(() => {
    if (!listRefreshNonce) {
      return;
    }

    void loadMerchantListPage();
  }, [authUser?.role, merchantListState.page, merchantListState.pageSize, listRefreshNonce, loadMerchantListPage]);

  useEffect(() => {
    if (!listRefreshNonce) {
      return;
    }

    void loadRepresentativeListPage();
  }, [authUser?.role, representativeListState.page, representativeListState.pageSize, listRefreshNonce, loadRepresentativeListPage]);

  useEffect(() => {
    if (!listRefreshNonce) {
      return;
    }

    void loadShopListPage();
  }, [authUser?.role, shopListState.page, shopListState.pageSize, listRefreshNonce, loadShopListPage]);

  useEffect(() => {
    if (!listRefreshNonce) {
      return;
    }

    void loadPromotionListPage();
  }, [authUser?.role, promotionListState.page, promotionListState.pageSize, listRefreshNonce, loadPromotionListPage]);

  useEffect(() => {
    if (!listRefreshNonce) {
      return;
    }

    void loadEventListPage();
  }, [authUser?.role, eventListState.page, eventListState.pageSize, listRefreshNonce, loadEventListPage]);

  useEffect(() => {
    if (!listRefreshNonce) {
      return;
    }

    void loadCategoryListPage();
  }, [authUser?.role, categoryListState.page, categoryListState.pageSize, categoryShopId, listRefreshNonce, loadCategoryListPage]);

  useEffect(() => {
    if (!listRefreshNonce) {
      return;
    }

    void loadSystemConfigHistoryListPage();
  }, [authUser?.role, systemConfigHistoryListState.page, systemConfigHistoryListState.pageSize, listRefreshNonce, loadSystemConfigHistoryListPage]);

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
    if (visibleCategories.length && !visibleCategories.some(category => category.id === selectedCategoryId)) {
      const defaultCategory = visibleCategories.find(category => category.isDefault) || visibleCategories[0];
      setSelectedCategoryId(defaultCategory?.id || '');
    }

    if (!visibleCategories.length) {
      setSelectedCategoryId('');
    }
  }, [selectedCategoryId, visibleCategories]);

  useEffect(() => {
    if (
      availableShops.length &&
      (!categoryShopId || !availableShops.some(shop => shop.id === categoryShopId))
    ) {
      setCategoryShopId(availableShops[0].id);
    }
  }, [availableShops, categoryShopId]);

  useEffect(() => {
    if (systemConfig) {
      applyConfigurationFormValues(systemConfig);
      setConfigChangeReason('');
      setEditingConfigurationId('');
    }
  }, [applyConfigurationFormValues, systemConfig]);

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
    setWalletActionFeedback(null);
  }, [activeTabKey]);

  useEffect(() => {
    setSettlementPreview(null);
  }, [selectedCustomerId, selectedShopId, selectedCategoryId, purchaseAmount, spendPoints]);

  const onLogout = async () => {
    await logoutUser();
    navigation.replace('Login');
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboard();
  };

  const handleSelectTransactionTypeFilter = useCallback(async (nextFilter: string) => {
    setTransactionTypeFilter(nextFilter);
    setTransactionPage(1);
    if (authUser) {
      setTransactionLoading(true);
      try {
        const response = await apiClient.get<PaginatedResponse<WalletTransaction>>('/api/wallet/transactions', {
          params: {
            page: 1,
            pageSize: transactionPageSize,
            type: nextFilter === 'ALL' ? undefined : nextFilter,
            status: transactionStatusFilter === 'ALL' ? undefined : transactionStatusFilter,
          },
        });
        setTransactions(response.data.items);
        setTransactionPage(response.data.pagination.page);
        setTransactionTotalItems(response.data.pagination.totalItems);
        setTransactionTotalPages(response.data.pagination.totalPages);
      } catch (loadError) {
        setError(getApiErrorMessage(loadError, t('homeScreen.errors.loadTransactions')));
      } finally {
        setTransactionLoading(false);
      }
    }
  }, [authUser, transactionPageSize, transactionStatusFilter]);

  const handleSelectTransactionStatusFilter = useCallback(async (nextFilter: string) => {
    setTransactionStatusFilter(nextFilter);
    setTransactionPage(1);
    if (authUser) {
      setTransactionLoading(true);
      try {
        const response = await apiClient.get<PaginatedResponse<WalletTransaction>>('/api/wallet/transactions', {
          params: {
            page: 1,
            pageSize: transactionPageSize,
            type: transactionTypeFilter === 'ALL' ? undefined : transactionTypeFilter,
            status: nextFilter === 'ALL' ? undefined : nextFilter,
          },
        });
        setTransactions(response.data.items);
        setTransactionPage(response.data.pagination.page);
        setTransactionTotalItems(response.data.pagination.totalItems);
        setTransactionTotalPages(response.data.pagination.totalPages);
      } catch (loadError) {
        setError(getApiErrorMessage(loadError, t('homeScreen.errors.loadTransactions')));
      } finally {
        setTransactionLoading(false);
      }
    }
  }, [authUser, transactionPageSize, transactionTypeFilter]);

  const handleTransactionPageChange = useCallback(async (nextPage: number) => {
    await loadTransactions(nextPage);
  }, [loadTransactions]);

  const handleTransactionPageSizeChange = useCallback(async (nextPageSize: number) => {
    setTransactionPageSize(nextPageSize);
    setTransactionPage(1);
    await loadTransactions(1, nextPageSize);
  }, [loadTransactions]);

  const handleCustomerListPageChange = useCallback((nextPage: number) => {
    setCustomerListState(current => ({ ...current, page: nextPage }));
  }, []);

  const handleCustomerListPageSizeChange = useCallback((nextPageSize: number) => {
    setCustomerListState(current => ({ ...current, page: 1, pageSize: nextPageSize }));
  }, []);

  const handleDirectoryCustomerListPageChange = useCallback((nextPage: number) => {
    setDirectoryCustomerListState(current => ({ ...current, page: nextPage }));
  }, []);

  const handleDirectoryCustomerListPageSizeChange = useCallback((nextPageSize: number) => {
    setDirectoryCustomerListState(current => ({ ...current, page: 1, pageSize: nextPageSize }));
  }, []);

  const handleMerchantListPageChange = useCallback((nextPage: number) => {
    setMerchantListState(current => ({ ...current, page: nextPage }));
  }, []);

  const handleMerchantListPageSizeChange = useCallback((nextPageSize: number) => {
    setMerchantListState(current => ({ ...current, page: 1, pageSize: nextPageSize }));
  }, []);

  const handleRepresentativeListPageChange = useCallback((nextPage: number) => {
    setRepresentativeListState(current => ({ ...current, page: nextPage }));
  }, []);

  const handleRepresentativeListPageSizeChange = useCallback((nextPageSize: number) => {
    setRepresentativeListState(current => ({ ...current, page: 1, pageSize: nextPageSize }));
  }, []);

  const handleShopListPageChange = useCallback((nextPage: number) => {
    setShopListState(current => ({ ...current, page: nextPage }));
  }, []);

  const handleShopListPageSizeChange = useCallback((nextPageSize: number) => {
    setShopListState(current => ({ ...current, page: 1, pageSize: nextPageSize }));
  }, []);

  const handlePromotionListPageChange = useCallback((nextPage: number) => {
    setPromotionListState(current => ({ ...current, page: nextPage }));
  }, []);

  const handlePromotionListPageSizeChange = useCallback((nextPageSize: number) => {
    setPromotionListState(current => ({ ...current, page: 1, pageSize: nextPageSize }));
  }, []);

  const handleEventListPageChange = useCallback((nextPage: number) => {
    setEventListState(current => ({ ...current, page: nextPage }));
  }, []);

  const handleEventListPageSizeChange = useCallback((nextPageSize: number) => {
    setEventListState(current => ({ ...current, page: 1, pageSize: nextPageSize }));
  }, []);

  const handleCategoryListPageChange = useCallback((nextPage: number) => {
    setCategoryListState(current => ({ ...current, page: nextPage }));
  }, []);

  const handleCategoryListPageSizeChange = useCallback((nextPageSize: number) => {
    setCategoryListState(current => ({ ...current, page: 1, pageSize: nextPageSize }));
  }, []);

  const handleSystemConfigHistoryPageChange = useCallback((nextPage: number) => {
    setSystemConfigHistoryListState(current => ({ ...current, page: nextPage }));
  }, []);

  const handleSystemConfigHistoryPageSizeChange = useCallback((nextPageSize: number) => {
    setSystemConfigHistoryListState(current => ({ ...current, page: 1, pageSize: nextPageSize }));
  }, []);

  const resetShopForm = () => {
    setEditingShopId('');
    setShopName('');
    setShopLocation('');
    setShopDescription('');
    setShopMerchantId(merchants[0]?.id || '');
    setActiveEditSheet(current => (current === 'shop' ? null : current));
  };

  const resetPromotionForm = () => {
    setEditingPromotionId('');
    setPromotionTitle('');
    setPromotionDescription('');
    setPromotionBonusPoints('');
    setPromotionStartDate('');
    setPromotionEndDate('');
    setPromotionShopId(manageablePromotionShops[0]?.id || '');
    setActiveEditSheet(current => (current === 'promotion' ? null : current));
  };

  const resetEventForm = () => {
    setEditingEventId('');
    setEventTitle('');
    setEventDescription('');
    setEventLocation('');
    setEventStartDate('');
    setEventEndDate('');
    setActiveEditSheet(current => (current === 'event' ? null : current));
  };

  const resetCategoryForm = () => {
    setEditingCategoryId('');
    setCategoryName('');
    setCategoryDiscountPercent('');
    setCategoryIsDefault(false);
    setCategoryShopId(availableShops[0]?.id || '');
    setActiveEditSheet(current => (current === 'category' ? null : current));
  };

  const resetConfigurationForm = useCallback(() => {
    setEditingConfigurationId('');
    applyConfigurationFormValues(systemConfig);
    setConfigChangeReason('');
    setError(null);
    setSuccessMessage(null);
    setActiveEditSheet(current => (current === 'configuration' ? null : current));
  }, [applyConfigurationFormValues, systemConfig]);

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
          {value || t('common.selectDate')}
        </Text>
        <MaterialCommunityIcons name="calendar-month-outline" size={20} color={theme.custom.textSecondary} />
      </Pressable>
      <Text style={[styles.dateFieldHelper, { color: theme.custom.textSecondary }]}>{helperText}</Text>
    </View>
  );

  const handleAddPoints = async () => {
    if (!selectedCustomerId.trim()) {
      setError(t('homeScreen.errors.addPointsCustomerRequired'));
      return;
    }

    if (!selectedShopId.trim()) {
      setError(t('homeScreen.errors.addPointsShopRequired'));
      return;
    }

    if (!points.trim() || Number(points) <= 0) {
      setError(t('homeScreen.errors.addPointsAmountInvalid'));
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    setWalletActionFeedback('earn');

    try {
      const response = await apiClient.post<{ balance?: number }>('/api/wallet/earn', {
        customerId: selectedCustomerId.trim(),
        shopId: selectedShopId.trim(),
        points: Number(points),
        pointType,
        description: description.trim() || undefined,
      });

      setSuccessMessage(
        typeof response.data.balance === 'number'
          ? t('homeScreen.success.pointsAddedWithBalance', { balance: response.data.balance })
          : t('homeScreen.success.pointsAdded'),
      );
      setPoints('');
      setDescription('');
      await loadDashboard();
      await fetchSelectedCustomerWallet(selectedCustomerId);
    } catch (submitError: any) {
      setError(submitError?.response?.data?.error || t('homeScreen.errors.addPointsSubmit'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSpendPoints = async () => {
    if (!selectedCustomerId.trim()) {
      setError(t('homeScreen.errors.spendCustomerRequired'));
      return;
    }

    if (!selectedShopId.trim()) {
      setError(t('homeScreen.errors.spendShopRequired'));
      return;
    }

    if (!purchaseAmount.trim() || Number(purchaseAmount) <= 0) {
      setError(t('homeScreen.errors.purchaseAmountInvalid'));
      return;
    }

    if (!spendPoints.trim() || Number(spendPoints) <= 0) {
      setError(t('homeScreen.errors.spendPointsRequired'));
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    setWalletActionFeedback('spend');

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
        categoryId: selectedCategoryId.trim() || undefined,
        description: spendDescription.trim() || undefined,
      });

      const result = response.data;
      setSuccessMessage(t('homeScreen.success.settlementComplete', {
        usedPoints: result.usedPoints,
        payableAmount: result.payableAmount,
        earnedPoints: result.earnedPoints,
        bonusSuffix: result.bonusPoints
          ? t('homeScreen.success.settlementBonusSuffix', { bonusPoints: result.bonusPoints })
          : '',
      }));
      setPurchaseAmount('');
      setSpendPoints('');
      setSpendDescription('');
      setSettlementPreview(null);
      await loadDashboard();
      await fetchSelectedCustomerWallet(selectedCustomerId);
    } catch (submitError: any) {
      setError(submitError?.response?.data?.error || t('homeScreen.errors.settlePurchase'));
    } finally {
      setSubmitting(false);
    }
  };

  const handlePreviewSettlement = async () => {
    if (!selectedCustomerId.trim() || !selectedShopId.trim() || !purchaseAmount.trim() || !spendPoints.trim()) {
      setError(t('homeScreen.errors.previewFieldsRequired'));
      return;
    }

    setPreviewLoading(true);
    setError(null);
    setSuccessMessage(null);
    setSettlementPreview(null);
    setWalletActionFeedback('preview');

    try {
      const response = await apiClient.post<SettlementPreview>('/api/wallet/preview', {
        customerId: selectedCustomerId.trim(),
        shopId: selectedShopId.trim(),
        points: Number(spendPoints),
        purchaseAmount: Number(purchaseAmount),
        categoryId: selectedCategoryId.trim() || undefined,
      });
      setSettlementPreview(response.data);
    } catch (previewError: any) {
      setError(getApiErrorMessage(previewError, t('homeScreen.errors.previewSettlement')));
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleEditShop = (shop: Shop) => {
    setEditingShopId(shop.id);
    setShopName(shop.name);
    setShopLocation(shop.location);
    setShopDescription(shop.description || '');
    setShopMerchantId(shop.merchantId);
    clearManagementFeedback();
    setActiveEditSheet('shop');
  };

  const handleSaveShop = async () => {
    const resolvedMerchantId = shopMerchantId.trim() || merchants[0]?.id || '';
    const isEditingShop = Boolean(editingShopId);
    const feedbackTarget = isEditingShop ? 'shopList' : 'shopForm';
    const successTarget = isEditingShop ? 'shopList' : 'shopForm';

    if (!shopName.trim()) {
      showManagementFeedback(feedbackTarget, { error: t('homeScreen.errors.shopNameRequired') });
      return;
    }

    if (!shopLocation.trim()) {
      showManagementFeedback(feedbackTarget, { error: t('homeScreen.errors.shopLocationRequired') });
      return;
    }

    if (!resolvedMerchantId) {
      showManagementFeedback(feedbackTarget, { error: t('homeScreen.errors.shopMerchantRequired') });
      return;
    }

    if (isEditingShop) {
      setShopUpdateSubmitting(true);
    } else {
      setShopSubmitting(true);
    }
    clearManagementFeedback();

    const payload = {
      name: shopName.trim(),
      location: shopLocation.trim(),
      description: shopDescription.trim() || undefined,
      merchantId: resolvedMerchantId,
    };

    try {
      if (isEditingShop) {
        await apiClient.put(`/api/shops/${editingShopId}`, payload);
        showManagementFeedback(successTarget, { success: t('homeScreen.success.shopUpdated') });
      } else {
        await apiClient.post('/api/shops', payload);
        showManagementFeedback(successTarget, { success: t('homeScreen.success.shopCreated') });
      }

      resetShopForm();
      await loadDashboard();
    } catch (submitError: any) {
      showManagementFeedback(feedbackTarget, {
        error: submitError?.response?.data?.error || t('homeScreen.errors.shopSave'),
      });
    } finally {
      if (isEditingShop) {
        setShopUpdateSubmitting(false);
      } else {
        setShopSubmitting(false);
      }
    }
  };

  const handleToggleShopStatus = async (shop: Shop) => {
    setShopStatusLoadingId(shop.id);
    clearManagementFeedback();

    try {
      const nextStatus = !shop.isActive;
      const response = await apiClient.put<Shop>(`/api/shops/${shop.id}`, { isActive: nextStatus });
      applyShopUpdate(response.data);
      showManagementFeedback('shopList', {
        success: t(nextStatus ? 'homeScreen.success.shopActivated' : 'homeScreen.success.shopDeactivated'),
      });
    } catch (updateError: any) {
      showManagementFeedback('shopList', {
        error: updateError?.response?.data?.error || t('homeScreen.errors.shopStatusUpdate'),
      });
    } finally {
      setShopStatusLoadingId('');
    }
  };

  const handleCreatePromotion = async () => {
    const isEditingPromotion = Boolean(editingPromotionId);
    const feedbackTarget = isEditingPromotion ? 'promotionList' : 'promotionForm';
    const successTarget = isEditingPromotion ? 'promotionList' : 'promotionForm';

    if (!promotionTitle.trim()) {
      showManagementFeedback(feedbackTarget, { error: t('homeScreen.errors.promotionTitleRequired') });
      return;
    }

    if (!promotionShopId.trim()) {
      showManagementFeedback(feedbackTarget, { error: t('homeScreen.errors.promotionShopRequired') });
      return;
    }

    if (!promotionStartDate.trim() || !promotionEndDate.trim()) {
      showManagementFeedback(feedbackTarget, { error: t('homeScreen.errors.promotionDatesRequired') });
      return;
    }

    if (isEditingPromotion) {
      setPromotionUpdateSubmitting(true);
    } else {
      setPromotionSubmitting(true);
    }
    clearManagementFeedback();

    try {
      const payload = {
        title: promotionTitle.trim(),
        description: promotionDescription.trim() || undefined,
        shopId: promotionShopId.trim(),
        bonusPoints: promotionBonusPoints.trim() ? Number(promotionBonusPoints) : 0,
        startsAt: `${promotionStartDate.trim()}T00:00:00.000Z`,
        endsAt: `${promotionEndDate.trim()}T23:59:59.000Z`,
      };

      if (isEditingPromotion) {
        const response = await apiClient.put<Promotion>(`/api/promotions/${editingPromotionId}`, payload);
        showManagementFeedback(successTarget, {
          success: response.data.message || t('homeScreen.success.promotionUpdated'),
        });
      } else {
        const response = await apiClient.post<Promotion>('/api/promotions', payload);
        showManagementFeedback(successTarget, {
          success: response.data.message || t('homeScreen.success.promotionCreated'),
        });
      }

      resetPromotionForm();
      await loadDashboard();
    } catch (submitError: any) {
      showManagementFeedback(feedbackTarget, {
        error: submitError?.response?.data?.error || t('homeScreen.errors.promotionSave'),
      });
    } finally {
      if (isEditingPromotion) {
        setPromotionUpdateSubmitting(false);
      } else {
        setPromotionSubmitting(false);
      }
    }
  };

  const handleDeletePromotion = async (promotionId: string) => {
    setPromotionActionLoadingState({ id: promotionId, action: 'delete' });
    clearManagementFeedback();

    try {
      await apiClient.delete<{ id: string; message?: string }>(`/api/promotions/${promotionId}`);
      removePromotion(promotionId);
      showManagementFeedback('promotionList', { success: t('homeScreen.success.promotionRemoved') });
    } catch (deleteError: any) {
      showManagementFeedback('promotionList', {
        error: deleteError?.response?.data?.error || t('homeScreen.errors.promotionDelete'),
      });
    } finally {
      setPromotionActionLoadingState(null);
    }
  };

  const handleEditPromotion = (promotion: Promotion) => {
    setEditingPromotionId(promotion.id);
    setPromotionTitle(promotion.title);
    setPromotionDescription(promotion.description || '');
    setPromotionBonusPoints(String(promotion.bonusPoints));
    setPromotionStartDate(promotion.startsAt.split('T')[0] || '');
    setPromotionEndDate(promotion.endsAt.split('T')[0] || '');
    setPromotionShopId(promotion.shopId);
    clearManagementFeedback();
    setActiveEditSheet('promotion');
  };

  const handleTogglePromotionStatus = async (promotion: Promotion) => {
    setPromotionActionLoadingState({ id: promotion.id, action: 'status' });
    clearManagementFeedback();

    try {
      const response = await apiClient.put<Promotion>(`/api/promotions/${promotion.id}`, {
        isActive: !promotion.isActive,
      });
      applyPromotionUpdate({
        ...response.data,
        id: promotion.id,
        shopName: promotion.shopName,
        shopLocation: promotion.shopLocation,
        isClaimed: promotion.isClaimed,
      });
      showManagementFeedback('promotionList', {
        success: t(promotion.isActive ? 'homeScreen.success.promotionDeactivated' : 'homeScreen.success.promotionActivated'),
      });
    } catch (updateError: any) {
      showManagementFeedback('promotionList', {
        error: updateError?.response?.data?.error || t('homeScreen.errors.promotionStatusUpdate'),
      });
    } finally {
      setPromotionActionLoadingState(null);
    }
  };

  const handleClaimPromotion = async (promotionId: string) => {
    if (!promotionId.trim()) {
      return;
    }

    setClaimingPromotionId(promotionId);
    clearManagementFeedback();

    try {
      const response = await apiClient.post<{ bonusPoints: number; balance: number }>(`/api/promotions/${promotionId}/claim`);
      const result = response.data;
      showManagementFeedback('promotionList', {
        success: t('homeScreen.success.promotionClaimed', { bonusPoints: result.bonusPoints }),
      });
      await loadDashboard();
    } catch (claimError: any) {
      showManagementFeedback('promotionList', {
        error: claimError?.response?.data?.error || t('homeScreen.errors.promotionClaim'),
      });
    } finally {
      setClaimingPromotionId('');
    }
  };

  const handleCreateEvent = async () => {
    const isEditingEvent = Boolean(editingEventId);
    const feedbackTarget = isEditingEvent ? 'eventList' : 'eventForm';
    const successTarget = isEditingEvent ? 'eventList' : 'eventForm';

    if (!eventTitle.trim()) {
      showManagementFeedback(feedbackTarget, { error: t('homeScreen.errors.eventTitleRequired') });
      return;
    }

    if (!eventLocation.trim()) {
      showManagementFeedback(feedbackTarget, { error: t('homeScreen.errors.eventLocationRequired') });
      return;
    }

    if (!eventStartDate.trim() || !eventEndDate.trim()) {
      showManagementFeedback(feedbackTarget, { error: t('homeScreen.errors.eventDatesRequired') });
      return;
    }

    if (isEditingEvent) {
      setEventUpdateSubmitting(true);
    } else {
      setEventSubmitting(true);
    }
    clearManagementFeedback();

    try {
      const payload = {
        title: eventTitle.trim(),
        description: eventDescription.trim() || undefined,
        location: eventLocation.trim(),
        startsAt: `${eventStartDate.trim()}T00:00:00.000Z`,
        endsAt: `${eventEndDate.trim()}T23:59:59.000Z`,
      };

      if (isEditingEvent) {
        await apiClient.put(`/api/events/${editingEventId}`, payload);
        showManagementFeedback(successTarget, { success: t('homeScreen.success.eventUpdated') });
      } else {
        await apiClient.post('/api/events', payload);
        showManagementFeedback(successTarget, { success: t('homeScreen.success.eventCreated') });
      }

      resetEventForm();
      await loadDashboard();
    } catch (submitError: any) {
      showManagementFeedback(feedbackTarget, {
        error: submitError?.response?.data?.error || t('homeScreen.errors.eventSave'),
      });
    } finally {
      if (isEditingEvent) {
        setEventUpdateSubmitting(false);
      } else {
        setEventSubmitting(false);
      }
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    setEventActionLoadingState({ id: eventId, action: 'delete' });
    clearManagementFeedback();

    try {
      await apiClient.delete(`/api/events/${eventId}`);
      removeEvent(eventId);
      showManagementFeedback('eventList', { success: t('homeScreen.success.eventRemoved') });
    } catch (deleteError: any) {
      showManagementFeedback('eventList', {
        error: deleteError?.response?.data?.error || t('homeScreen.errors.eventDelete'),
      });
    } finally {
      setEventActionLoadingState(null);
    }
  };

  const handleEditEvent = (event: EventItem) => {
    setEditingEventId(event.id);
    setEventTitle(event.title);
    setEventDescription(event.description || '');
    setEventLocation(event.location);
    setEventStartDate(event.startsAt.split('T')[0] || '');
    setEventEndDate(event.endsAt.split('T')[0] || '');
    clearManagementFeedback();
    setActiveEditSheet('event');
  };

  const handleToggleEventStatus = async (event: EventItem) => {
    setEventActionLoadingState({ id: event.id, action: 'status' });
    clearManagementFeedback();

    try {
      const response = await apiClient.put<EventItem>(`/api/events/${event.id}`, {
        isActive: !event.isActive,
      });
      applyEventUpdate(response.data);
      showManagementFeedback('eventList', {
        success: t(event.isActive ? 'homeScreen.success.eventDeactivated' : 'homeScreen.success.eventActivated'),
      });
    } catch (updateError: any) {
      showManagementFeedback('eventList', {
        error: updateError?.response?.data?.error || t('homeScreen.errors.eventStatusUpdate'),
      });
    } finally {
      setEventActionLoadingState(null);
    }
  };

  const handleEditCategory = (category: ShopCategory) => {
    setEditingCategoryId(category.id);
    setCategoryShopId(category.shopId);
    setCategoryName(category.formattedName || category.name);
    setCategoryDiscountPercent(String(category.discountPercent));
    setCategoryIsDefault(category.isDefault);
    clearManagementFeedback();
    setActiveEditSheet('category');
  };

  const handleSaveCategory = async () => {
    const isEditingCategory = Boolean(editingCategoryId);
    const feedbackTarget = isEditingCategory ? 'categoryList' : 'categoryForm';
    const successTarget = isEditingCategory ? 'categoryList' : 'categoryForm';

    if (!categoryShopId.trim()) {
      showManagementFeedback(feedbackTarget, { error: t('homeScreen.errors.categoryShopRequired') });
      return;
    }

    if (!categoryName.trim()) {
      showManagementFeedback(feedbackTarget, { error: t('homeScreen.errors.categoryNameRequired') });
      return;
    }

    if (!categoryDiscountPercent.trim() || Number(categoryDiscountPercent) < 0) {
      showManagementFeedback(feedbackTarget, { error: t('homeScreen.errors.categoryDiscountInvalid') });
      return;
    }

    if (isEditingCategory) {
      setCategoryUpdateSubmitting(true);
    } else {
      setCategorySubmitting(true);
    }
    clearManagementFeedback();

    const payload = {
      shopId: categoryShopId.trim(),
      name: categoryName.trim(),
      discountPercent: Number(categoryDiscountPercent),
      isDefault: categoryIsDefault,
    };

    try {
      if (isEditingCategory) {
        await apiClient.put(`/api/categories/${editingCategoryId}`, payload);
        showManagementFeedback(successTarget, { success: t('homeScreen.success.categoryUpdated') });
      } else {
        await apiClient.post('/api/categories', payload);
        showManagementFeedback(successTarget, { success: t('homeScreen.success.categoryCreated') });
      }

      resetCategoryForm();
      await loadDashboard();
    } catch (submitError: any) {
      showManagementFeedback(feedbackTarget, {
        error: submitError?.response?.data?.error || t('homeScreen.errors.categorySave'),
      });
    } finally {
      if (isEditingCategory) {
        setCategoryUpdateSubmitting(false);
      } else {
        setCategorySubmitting(false);
      }
    }
  };

  const handleToggleCategoryStatus = async (category: ShopCategory) => {
    setCategoryActionLoadingState({ id: category.id, action: 'status' });
    clearManagementFeedback();

    try {
      const response = await apiClient.put<ShopCategory>(`/api/categories/${category.id}`, {
        isActive: !category.isActive,
      });
      applyCategoryUpdate({
        ...response.data,
        id: category.id,
        shopName: category.shopName,
      });
      showManagementFeedback('categoryList', {
        success: t(category.isActive ? 'homeScreen.success.categoryDeactivated' : 'homeScreen.success.categoryActivated'),
      });
    } catch (submitError: any) {
      showManagementFeedback('categoryList', {
        error: submitError?.response?.data?.error || t('homeScreen.errors.categoryStatusUpdate'),
      });
    } finally {
      setCategoryActionLoadingState(null);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    setCategoryActionLoadingState({ id: categoryId, action: 'delete' });
    clearManagementFeedback();

    try {
      await apiClient.delete(`/api/categories/${categoryId}`);
      removeCategory(categoryId);
      showManagementFeedback('categoryList', { success: t('homeScreen.success.categoryDeleted') });
    } catch (submitError: any) {
      showManagementFeedback('categoryList', {
        error: submitError?.response?.data?.error || t('homeScreen.errors.categoryDelete'),
      });
    } finally {
      setCategoryActionLoadingState(null);
    }
  };

  const handleEditConfiguration = useCallback((config: SystemConfig) => {
    setEditingConfigurationId(config.id || '');
    applyConfigurationFormValues(config);
    clearManagementFeedback();
    setActiveEditSheet('configuration');
  }, [applyConfigurationFormValues, clearManagementFeedback]);

  const handleSaveConfiguration = async () => {
    const isEditingConfiguration = Boolean(editingConfigurationId);
    const feedbackTarget = isEditingConfiguration ? 'configurationList' : 'configurationForm';
    const successTarget = isEditingConfiguration ? 'configurationList' : 'configurationForm';

    if (
      !configWelcomeBonusPoints.trim() ||
      !configPointExpirationDays.trim() ||
      !configMaxPointsPerTransaction.trim() ||
      !configDefaultMaxDiscountPercent.trim()
    ) {
      showManagementFeedback(feedbackTarget, { error: t('homeScreen.errors.configurationFieldsRequired') });
      return;
    }

    if (isEditingConfiguration) {
      setConfigUpdateSubmitting(true);
    } else {
      setConfigSubmitting(true);
    }
    clearManagementFeedback();

    try {
      const payload = {
        welcomeBonusPoints: Number(configWelcomeBonusPoints),
        pointExpirationDays: Number(configPointExpirationDays),
        maxPointsPerTransaction: Number(configMaxPointsPerTransaction),
        defaultMaxDiscountPercent: Number(configDefaultMaxDiscountPercent),
        changeReason: configChangeReason.trim() || undefined,
      };

      if (isEditingConfiguration) {
        const response = await apiClient.put<SystemConfig & { message?: string }>(`/api/system-config/${editingConfigurationId}`, payload);
        showManagementFeedback(successTarget, {
          success: response.data.message || t('homeScreen.success.configurationUpdated'),
        });
        setActiveEditSheet(current => (current === 'configuration' ? null : current));
      } else {
        const response = await apiClient.post<SystemConfig & { message?: string }>('/api/system-config', payload);
        showManagementFeedback(successTarget, {
          success: response.data.message || t('homeScreen.success.configurationUpdated'),
        });
      }

      setEditingConfigurationId('');
      await loadDashboard();
    } catch (submitError: any) {
      showManagementFeedback(feedbackTarget, {
        error: submitError?.response?.data?.error || t('homeScreen.errors.configurationSave'),
      });
    } finally {
      if (isEditingConfiguration) {
        setConfigUpdateSubmitting(false);
      } else {
        setConfigSubmitting(false);
      }
    }
  };

  const handleDeleteConfiguration = async (configId: string) => {
    setConfigHistoryActionLoadingState({ id: configId, action: 'delete' });
    clearManagementFeedback();

    try {
      const response = await apiClient.delete<{ id: string; message?: string }>(`/api/system-config/${configId}`);
      removeSystemConfigEntry(configId);
      const currentConfigResponse = await apiClient.get<SystemConfig>('/api/system-config');
      setSystemConfig(currentConfigResponse.data);
      if (editingConfigurationId === configId) {
        setEditingConfigurationId('');
        setActiveEditSheet(current => (current === 'configuration' ? null : current));
      }
      showManagementFeedback('configurationList', {
        success: response.data.message || t('homeScreen.success.configurationDeleted'),
      });
    } catch (submitError: any) {
      showManagementFeedback('configurationList', {
        error: submitError?.response?.data?.error || t('homeScreen.errors.configurationDelete'),
      });
    } finally {
      setConfigHistoryActionLoadingState(null);
    }
  };

  const handleCreateInternalUser = async () => {
    if (!trimmedInternalEmail || !trimmedInternalUsername || !internalPassword.trim()) {
      showManagementFeedback('internalUserForm', { error: t('homeScreen.errors.internalUserRequired') });
      setInternalTouched({
        username: true,
        email: true,
        password: true,
      });
      return;
    }

    if (!emailPattern.test(trimmedInternalEmail)) {
      showManagementFeedback('internalUserForm', { error: t('apiErrors.emailInvalid') });
      setInternalTouched(current => ({ ...current, email: true }));
      return;
    }

    if (internalPassword.trim().length < 8) {
      showManagementFeedback('internalUserForm', { error: t('apiErrors.passwordShort') });
      setInternalTouched(current => ({ ...current, password: true }));
      return;
    }

    setUserSubmitting(true);
    clearManagementFeedback();

    try {
      const createdRole = internalRole;

      await apiClient.post('/api/users/internal', {
        firstName: internalFirstName.trim() || undefined,
        lastName: internalLastName.trim() || undefined,
        username: internalUsername.trim(),
        email: trimmedInternalEmail,
        password: internalPassword.trim(),
        role: createdRole,
      });

      showManagementFeedback('internalUserForm', {
        success: t('homeScreen.success.internalUserCreated', {
          role: t(`roles.${createdRole.toLowerCase()}`),
        }),
      });
      resetInternalUserForm();
      await refreshManagedUsersByRole(createdRole);
    } catch (submitError: any) {
      showManagementFeedback('internalUserForm', {
        error: getApiErrorMessage(submitError, t('homeScreen.errors.userCreate')),
      });
    } finally {
      setUserSubmitting(false);
    }
  };

  const handleActivateUser = useCallback(async (user: UserSummary) => {
    clearManagementFeedback();

    try {
      const response = await apiClient.post<UserSummary>(`/api/users/${user.id}/activate`, {});
      applyManagedUserUpdate(response.data);
      showManagementFeedback(getManagedUserFeedbackTarget(user.role), {
        success: t('homeScreen.success.userActivated'),
      });
    } catch (submitError: any) {
      showManagementFeedback(getManagedUserFeedbackTarget(user.role), {
        error: submitError?.response?.data?.error || t('homeScreen.errors.userActivate'),
      });
    }
  }, [applyManagedUserUpdate, clearManagementFeedback, showManagementFeedback, t]);

  const handleDeactivateUser = useCallback(async (user: UserSummary) => {
    clearManagementFeedback();

    try {
      const response = await apiClient.post<UserSummary>(`/api/users/${user.id}/deactivate`, {});
      applyManagedUserUpdate(response.data);
      showManagementFeedback(getManagedUserFeedbackTarget(user.role), {
        success: t('homeScreen.success.userDeactivated'),
      });
    } catch (submitError: any) {
      showManagementFeedback(getManagedUserFeedbackTarget(user.role), {
        error: submitError?.response?.data?.error || t('homeScreen.errors.userDeactivate'),
      });
    }
  }, [applyManagedUserUpdate, clearManagementFeedback, showManagementFeedback, t]);

  const handleDeleteUser = useCallback(async (user: UserSummary) => {
    clearManagementFeedback();

    try {
      const response = await apiClient.post<UserSummary>(`/api/users/${user.id}/delete`, {});
      applyManagedUserUpdate(response.data);
      showManagementFeedback(getManagedUserFeedbackTarget(user.role), {
        success: t('homeScreen.success.userDeleted'),
      });
    } catch (submitError: any) {
      showManagementFeedback(getManagedUserFeedbackTarget(user.role), {
        error: submitError?.response?.data?.error || t('homeScreen.errors.userDelete'),
      });
    }
  }, [applyManagedUserUpdate, clearManagementFeedback, showManagementFeedback, t]);

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
      setError(t('profile.password.errors.required'));
      return;
    }

    if (trimmedNewPassword.length < 8) {
      setPasswordTouched(current => ({ ...current, next: true }));
      setError(t('profile.password.errors.newShort'));
      return;
    }

    if (trimmedCurrentPassword === trimmedNewPassword) {
      setError(t('profile.password.errors.mustDiffer'));
      return;
    }

    if (trimmedNewPassword !== trimmedConfirmPassword) {
      setPasswordTouched(current => ({ ...current, confirm: true }));
      setError(t('profile.password.errors.confirmMatch'));
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
      setSuccessMessage(response.message || t('profile.password.success'));
      resetPasswordForm();
    } catch (submitError: any) {
      setError(submitError?.response?.data?.error || t('profile.password.errors.submit'));
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

  const renderSheetActions = (
    onSubmit: () => void,
    onCancel: () => void,
    loading: boolean,
  ) => (
    <View style={styles.bottomSheetActionColumn}>
      <Button
        mode="contained"
        loading={loading}
        onPress={() => void onSubmit()}
        style={styles.bottomSheetPrimaryButton}
        contentStyle={styles.bottomSheetButtonContent}
      >
        {t('common.update')}
      </Button>
      <Button
        mode="outlined"
        onPress={onCancel}
        style={styles.bottomSheetSecondaryButton}
        contentStyle={styles.bottomSheetButtonContent}
      >
        {t('common.cancel')}
      </Button>
    </View>
  );

  const renderSheetFeedback = () => {
    const activeListTarget =
      activeEditSheet === 'shop'
        ? 'shopList'
        : activeEditSheet === 'promotion'
          ? 'promotionList'
          : activeEditSheet === 'event'
            ? 'eventList'
            : activeEditSheet === 'category'
              ? 'categoryList'
              : activeEditSheet === 'configuration'
                ? 'configurationList'
                : null;

    if (managementFeedback.target !== 'editSheet' && managementFeedback.target !== activeListTarget) {
      return null;
    }

    if (managementFeedback.error) {
      return (
        <Text style={[styles.message, { color: theme.custom.error }]}>
          {managementFeedback.error}
        </Text>
      );
    }

    if (managementFeedback.success) {
      return (
        <Text style={[styles.message, { color: theme.custom.success }]}>
          {managementFeedback.success}
        </Text>
      );
    }

    return null;
  };

  const renderEditSheetContent = () => {
    switch (activeEditSheet) {
      case 'shop':
        return (
          <>
            <View style={styles.bottomSheetHandle} />
            <Text style={[styles.sheetTitle, { color: theme.custom.textPrimary }]}>{t('management.bottomSheet.shop.title')}</Text>
            <Text style={[styles.sheetSubtitle, { color: theme.custom.textSecondary }]}>{t('management.bottomSheet.shop.subtitle')}</Text>
            <FloatingLabelInput icon="store-outline" label={t('management.shopForm.nameLabel')} value={shopName} onChangeText={setShopName} autoCapitalize="words" />
            <FloatingLabelInput icon="map-marker-outline" label={t('management.shopForm.locationLabel')} value={shopLocation} onChangeText={setShopLocation} autoCapitalize="words" />
            <FloatingLabelInput icon="text-box-outline" label={t('management.shopForm.descriptionLabel')} value={shopDescription} onChangeText={setShopDescription} autoCapitalize="sentences" multiline numberOfLines={3} />
            <SelectField
              label={t('management.shopForm.merchant')}
              value={shopMerchantId}
              onSelect={setShopMerchantId}
              options={merchants.map(merchant => ({
                value: merchant.id,
                label: [merchant.firstName, merchant.lastName].filter(Boolean).join(' ') || merchant.username,
              }))}
            />
            {renderSheetActions(handleSaveShop, resetShopForm, shopUpdateSubmitting)}
            {renderSheetFeedback()}
          </>
        );
      case 'promotion':
        return (
          <>
            <View style={styles.bottomSheetHandle} />
            <Text style={[styles.sheetTitle, { color: theme.custom.textPrimary }]}>{t('management.bottomSheet.promotion.title')}</Text>
            <Text style={[styles.sheetSubtitle, { color: theme.custom.textSecondary }]}>{t('management.bottomSheet.promotion.subtitle')}</Text>
            <FloatingLabelInput icon="tag-outline" label={t('management.promotions.titleLabel')} value={promotionTitle} onChangeText={setPromotionTitle} autoCapitalize="sentences" />
            <FloatingLabelInput icon="text-box-outline" label={t('management.promotions.descriptionLabel')} value={promotionDescription} onChangeText={setPromotionDescription} autoCapitalize="sentences" multiline numberOfLines={3} />
            <SelectField
              label={t('management.promotions.shop')}
              value={promotionShopId}
              onSelect={setPromotionShopId}
              options={manageablePromotionShops.map(shop => ({ value: shop.id, label: shop.name }))}
            />
            <FloatingLabelInput icon="star-four-points-outline" label={t('management.promotions.bonusLabel')} keyboardType="number-pad" value={promotionBonusPoints} onChangeText={setPromotionBonusPoints} />
            {renderDateField(t('common.startDate'), promotionStartDate, 'promotion-start', t('management.promotions.startHelper'))}
            {renderDateField(t('common.endDate'), promotionEndDate, 'promotion-end', t('management.promotions.endHelper'))}
            {renderSheetActions(handleCreatePromotion, resetPromotionForm, promotionUpdateSubmitting)}
            {renderSheetFeedback()}
          </>
        );
      case 'event':
        return (
          <>
            <View style={styles.bottomSheetHandle} />
            <Text style={[styles.sheetTitle, { color: theme.custom.textPrimary }]}>{t('management.bottomSheet.event.title')}</Text>
            <Text style={[styles.sheetSubtitle, { color: theme.custom.textSecondary }]}>{t('management.bottomSheet.event.subtitle')}</Text>
            <FloatingLabelInput icon="calendar-text-outline" label={t('management.events.titleLabel')} value={eventTitle} onChangeText={setEventTitle} autoCapitalize="sentences" />
            <FloatingLabelInput icon="text-box-outline" label={t('management.events.descriptionLabel')} value={eventDescription} onChangeText={setEventDescription} autoCapitalize="sentences" multiline numberOfLines={3} />
            <FloatingLabelInput icon="map-marker-outline" label={t('management.events.locationLabel')} value={eventLocation} onChangeText={setEventLocation} autoCapitalize="words" />
            {renderDateField(t('common.startDate'), eventStartDate, 'event-start', t('management.events.startHelper'))}
            {renderDateField(t('common.endDate'), eventEndDate, 'event-end', t('management.events.endHelper'))}
            {renderSheetActions(handleCreateEvent, resetEventForm, eventUpdateSubmitting)}
            {renderSheetFeedback()}
          </>
        );
      case 'category':
        return (
          <>
            <View style={styles.bottomSheetHandle} />
            <Text style={[styles.sheetTitle, { color: theme.custom.textPrimary }]}>{t('management.bottomSheet.category.title')}</Text>
            <Text style={[styles.sheetSubtitle, { color: theme.custom.textSecondary }]}>{t('management.bottomSheet.category.subtitle')}</Text>
            <SelectField
              label={t('management.categories.shop')}
              value={categoryShopId}
              onSelect={setCategoryShopId}
              options={availableShops.map(shop => ({ value: shop.id, label: shop.name }))}
            />
            <FloatingLabelInput icon="shape-outline" label={t('management.categories.nameLabel')} value={categoryName} onChangeText={setCategoryName} autoCapitalize="words" />
            <FloatingLabelInput icon="percent-outline" label={t('management.categories.discountLabel')} value={categoryDiscountPercent} onChangeText={setCategoryDiscountPercent} keyboardType="number-pad" />
            {renderSheetActions(handleSaveCategory, resetCategoryForm, categoryUpdateSubmitting)}
            {renderSheetFeedback()}
          </>
        );
      case 'configuration':
        return (
          <>
            <View style={styles.bottomSheetHandle} />
            <Text style={[styles.sheetTitle, { color: theme.custom.textPrimary }]}>{t('management.bottomSheet.configuration.title')}</Text>
            <Text style={[styles.sheetSubtitle, { color: theme.custom.textSecondary }]}>{t('management.bottomSheet.configuration.subtitle')}</Text>
            <FloatingLabelInput icon="gift-outline" label={t('management.configuration.welcomeBonusLabel')} value={configWelcomeBonusPoints} onChangeText={setConfigWelcomeBonusPoints} keyboardType="number-pad" />
            <FloatingLabelInput icon="calendar-clock-outline" label={t('management.configuration.expirationLabel')} value={configPointExpirationDays} onChangeText={setConfigPointExpirationDays} keyboardType="number-pad" />
            <FloatingLabelInput icon="counter" label={t('management.configuration.maxPointsLabel')} value={configMaxPointsPerTransaction} onChangeText={setConfigMaxPointsPerTransaction} keyboardType="number-pad" />
            <FloatingLabelInput icon="percent-outline" label={t('management.configuration.defaultDiscountLabel')} value={configDefaultMaxDiscountPercent} onChangeText={setConfigDefaultMaxDiscountPercent} keyboardType="number-pad" />
            <FloatingLabelInput icon="text-box-outline" label={t('management.configuration.reasonLabel')} value={configChangeReason} onChangeText={setConfigChangeReason} autoCapitalize="sentences" multiline numberOfLines={3} />
            {renderSheetActions(handleSaveConfiguration, resetConfigurationForm, configUpdateSubmitting)}
            {renderSheetFeedback()}
          </>
        );
      default:
        return null;
    }
  };

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
    customerListItems: customerListState.items,
    customerListLoading: customerListState.loading,
    customerListPage: customerListState.page,
    customerListPageSize: customerListState.pageSize,
    customerListTotalPages: customerListState.totalPages,
    customerListTotalItems: customerListState.totalItems,
    handleCustomerListPageChange,
    handleCustomerListPageSizeChange,
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
    previewCategories: visibleCategories,
    selectedCategoryId,
    setSelectedCategoryId,
    previewLoading,
    settlementPreview,
    error,
    successMessage,
    managementFeedback,
    walletActionFeedback,
    handlePreviewSettlement,
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
    setTransactionTypeFilter: handleSelectTransactionTypeFilter,
    transactionStatusFilter,
    setTransactionStatusFilter: handleSelectTransactionStatusFilter,
    filteredTransactions: transactions,
    transactionLoading,
    transactionPage,
    transactionPageSize,
    transactionTotalPages,
    transactionTotalItems,
    handleTransactionPageChange,
    handleTransactionPageSizeChange,
    shops,
    merchants,
    customers,
    representatives,
    shopListItems: shopListState.items,
    shopListLoading: shopListState.loading,
    shopListPage: shopListState.page,
    shopListPageSize: shopListState.pageSize,
    shopListTotalPages: shopListState.totalPages,
    shopListTotalItems: shopListState.totalItems,
    handleShopListPageChange,
    handleShopListPageSizeChange,
    shopName,
    setShopName,
    shopLocation,
    setShopLocation,
    shopDescription,
    setShopDescription,
    shopMerchantId,
    setShopMerchantId,
    shopSubmitting,
    shopStatusLoadingId,
    handleSaveShop,
    editingShopId,
    resetShopForm,
    merchantNameMap,
    shopNameMap,
    userDisplayNameMap,
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
    editingPromotionId,
    renderDateField,
    promotionStartDate,
    promotionEndDate,
    promotionSubmitting,
    promotionActionLoadingState,
    claimingPromotionId,
    handleCreatePromotion,
    resetPromotionForm,
    promotions,
    promotionListItems: promotionListState.items,
    promotionListLoading: promotionListState.loading,
    promotionListPage: promotionListState.page,
    promotionListPageSize: promotionListState.pageSize,
    promotionListTotalPages: promotionListState.totalPages,
    promotionListTotalItems: promotionListState.totalItems,
    handlePromotionListPageChange,
    handlePromotionListPageSizeChange,
    handleEditPromotion,
    handleTogglePromotionStatus,
    handleDeletePromotion,
    handleClaimPromotion,
    eventTitle,
    setEventTitle,
    eventDescription,
    setEventDescription,
    eventLocation,
    setEventLocation,
    eventStartDate,
    eventEndDate,
    editingEventId,
    eventSubmitting,
    eventActionLoadingState,
    handleCreateEvent,
    resetEventForm,
    events,
    eventListItems: eventListState.items,
    eventListLoading: eventListState.loading,
    eventListPage: eventListState.page,
    eventListPageSize: eventListState.pageSize,
    eventListTotalPages: eventListState.totalPages,
    eventListTotalItems: eventListState.totalItems,
    handleEventListPageChange,
    handleEventListPageSizeChange,
    handleEditEvent,
    handleToggleEventStatus,
    handleDeleteEvent,
    formatDate,
    categoryShopId,
    setCategoryShopId,
    categoryName,
    setCategoryName,
    categoryDiscountPercent,
    setCategoryDiscountPercent,
    categoryIsDefault,
    setCategoryIsDefault,
    categorySubmitting,
    categoryActionLoadingState,
    editingCategoryId,
    categories: manageableCategories,
    categoryListItems: categoryListState.items,
    categoryListLoading: categoryListState.loading,
    categoryListPage: categoryListState.page,
    categoryListPageSize: categoryListState.pageSize,
    categoryListTotalPages: categoryListState.totalPages,
    categoryListTotalItems: categoryListState.totalItems,
    handleCategoryListPageChange,
    handleCategoryListPageSizeChange,
    handleEditCategory,
    handleSaveCategory,
    handleToggleCategoryStatus,
    handleDeleteCategory,
    resetCategoryForm,
    systemConfig,
    systemConfigHistory,
    systemConfigHistoryItems: systemConfigHistoryListState.items,
    systemConfigHistoryLoading: systemConfigHistoryListState.loading,
    systemConfigHistoryPage: systemConfigHistoryListState.page,
    systemConfigHistoryPageSize: systemConfigHistoryListState.pageSize,
    systemConfigHistoryTotalPages: systemConfigHistoryListState.totalPages,
    systemConfigHistoryTotalItems: systemConfigHistoryListState.totalItems,
    handleSystemConfigHistoryPageChange,
    handleSystemConfigHistoryPageSizeChange,
    editingConfigurationId,
    configWelcomeBonusPoints,
    setConfigWelcomeBonusPoints,
    configPointExpirationDays,
    setConfigPointExpirationDays,
    configMaxPointsPerTransaction,
    setConfigMaxPointsPerTransaction,
    configDefaultMaxDiscountPercent,
    setConfigDefaultMaxDiscountPercent,
    configChangeReason,
    setConfigChangeReason,
    configSubmitting,
    configHistoryActionLoadingState,
    handleSaveConfiguration,
    resetConfigurationForm,
    handleEditConfiguration,
    handleDeleteConfiguration,
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
    setInternalTouched,
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
    directoryCustomerListItems: directoryCustomerListState.items,
    directoryCustomerListLoading: directoryCustomerListState.loading,
    directoryCustomerListPage: directoryCustomerListState.page,
    directoryCustomerListPageSize: directoryCustomerListState.pageSize,
    directoryCustomerListTotalPages: directoryCustomerListState.totalPages,
    directoryCustomerListTotalItems: directoryCustomerListState.totalItems,
    handleDirectoryCustomerListPageChange,
    handleDirectoryCustomerListPageSizeChange,
    merchantListItems: merchantListState.items,
    merchantListLoading: merchantListState.loading,
    merchantListPage: merchantListState.page,
    merchantListPageSize: merchantListState.pageSize,
    merchantListTotalPages: merchantListState.totalPages,
    merchantListTotalItems: merchantListState.totalItems,
    handleMerchantListPageChange,
    handleMerchantListPageSizeChange,
    representativeListItems: representativeListState.items,
    representativeListLoading: representativeListState.loading,
    representativeListPage: representativeListState.page,
    representativeListPageSize: representativeListState.pageSize,
    representativeListTotalPages: representativeListState.totalPages,
    representativeListTotalItems: representativeListState.totalItems,
    handleRepresentativeListPageChange,
    handleRepresentativeListPageSizeChange,
    handleCreateInternalUser,
    handleActivateUser,
    handleDeactivateUser,
    handleDeleteUser,
    resetInternalUserForm,
    customerUsers,
    renderSummaryMetric,
  };

  const activeRouteIndex = useMemo(
    () => routes.findIndex(routeItem => routeItem.key === activeTabKey),
    [activeTabKey, routes],
  );
  const tabScenes = useMemo<Partial<Record<keyof HomeTabParamList, React.ReactNode>>>(() => ({
    home: <HomeOverviewTab context={tabContext} />,
    dashboard: <HomeOverviewTab context={tabContext} />,
    wallet: <WalletTab context={tabContext} />,
    reports: <ReportsTab context={tabContext} />,
    'user-management': authUser?.role === UserRole.REPRESENTATIVE
      ? <RepresentativeUserManagementSection context={tabContext} />
      : <AdminUserManagementSection context={tabContext} />,
    'shop-management': (
      <ShopManagementSection
        context={tabContext}
        title={t('management.admin.shopManagementTitle')}
        subtitle={t('management.admin.shopManagementSubtitle')}
      />
    ),
    'category-settings': <CategorySettingsSection context={tabContext} />,
    configuration: <SystemConfigurationSection context={tabContext} />,
    promotions: <PromotionsSection context={tabContext} editable={authUser?.role !== UserRole.CUSTOMER} />,
    events: <EventsSection context={tabContext} editable />,
    transactions: <TransactionsTab context={tabContext} />,
    customers: <CustomersTab context={tabContext} />,
    'add-points': <AddPointsTab context={tabContext} />,
    merchants: (
      <UserListSection
        context={tabContext}
        title={t('directory.merchants.title')}
        subtitle={t('directory.merchants.subtitle')}
        users={merchants}
      />
    ),
    representatives: (
      <UserListSection
        context={tabContext}
        title={t('directory.representatives.title')}
        subtitle={t('directory.representatives.subtitle')}
        users={representatives}
      />
    ),
    profile: <ProfileTab context={tabContext} />,
  }), [authUser?.role, merchants, representatives, t, tabContext]);

  const activeTabContent = tabScenes[activeTabKey] ?? tabScenes.home ?? tabScenes.dashboard ?? null;

  return (
    <View style={[styles.container, { backgroundColor: theme.custom.background }]}>
      <View pointerEvents="none" style={styles.backdropLayer}>
        <View style={styles.backdropBase} />
        <View style={styles.backdropGlowBlue} />
        <View style={styles.backdropGlowOrange} />
        <View style={styles.backdropGrid} />
      </View>
      {activeEditSheet ? (
        <Portal>
          <View style={styles.bottomSheetOverlay}>
            <Pressable
              style={[
                styles.bottomSheetBackdrop,
                {
                  backgroundColor: theme.custom.background === '#07111F'
                    ? 'rgba(2, 6, 23, 0.78)'
                    : 'rgba(15, 23, 42, 0.62)',
                },
              ]}
              onPress={() => {
                if (activeEditSheet === 'shop') {
                  resetShopForm();
                } else if (activeEditSheet === 'promotion') {
                  resetPromotionForm();
                } else if (activeEditSheet === 'event') {
                  resetEventForm();
                } else if (activeEditSheet === 'category') {
                  resetCategoryForm();
                } else if (activeEditSheet === 'configuration') {
                  resetConfigurationForm();
                }
              }}
            />
            <View
              style={[
                styles.bottomSheetShell,
                {
                  paddingBottom: 0,
                },
              ]}
            >
              <View
                style={[
                  styles.bottomSheetCard,
                  {
                    backgroundColor: theme.custom.surfaceStrong,
                    borderColor: theme.custom.border,
                    shadowColor: theme.custom.shadow,
                  },
                ]}
              >
                <ScrollView
                  key={activeEditSheet}
                  style={styles.bottomSheetScroll}
                  contentContainerStyle={[
                    styles.bottomSheetContent,
                    {
                      paddingBottom: Math.max(insets.bottom + 20, 28),
                    },
                  ]}
                  showsVerticalScrollIndicator={false}
                >
                  {renderEditSheetContent()}
                </ScrollView>
              </View>
            </View>
          </View>
        </Portal>
      ) : null}
      <ScrollView
        contentContainerStyle={[
          styles.contentFrame,
          {
            paddingTop: Math.max(insets.top + 16, 24),
            paddingBottom: Math.max(insets.bottom + 54, 58),
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
            {showWelcomeHeader ? (
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
            ) : null}

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

	              <View style={styles.tabNavigatorShell}>
	                <View style={styles.tabSceneContent}>
	                  {activeTabContent}
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
    width: '100%',
    alignSelf: 'center',
    textAlign: 'center',
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
  bottomSheetOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    zIndex: 25,
  },
  bottomSheetShell: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 0,
    justifyContent: 'flex-end',
  },
  bottomSheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  bottomSheetCard: {
    width: '100%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderWidth: 1,
    overflow: 'hidden',
    height: '66%',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 22,
  },
  bottomSheetScroll: {
    width: '100%',
  },
  bottomSheetContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 18,
  },
  bottomSheetHandle: {
    alignSelf: 'center',
    width: 56,
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(148, 163, 184, 0.55)',
    marginBottom: 16,
  },
  bottomSheetActionColumn: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 10,
  },
  bottomSheetPrimaryButton: {
    width: '78%',
    alignSelf: 'center',
  },
  bottomSheetSecondaryButton: {
    width: '78%',
    alignSelf: 'center',
  },
  bottomSheetButtonContent: {
    minHeight: 46,
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
    bottom: 0,
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
    flexWrap: 'nowrap',
    width: '100%',
  },
  rowActionButtonCompact: {
    flex: 1,
  },
  rowActionButtonWide: {
    flex: 1,
  },
  rowActionButtonContent: {
    minHeight: 34,
    justifyContent: 'center',
  },
  rowActionButtonLabel: {
    fontSize: 12,
    marginHorizontal: 4,
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
