import React, { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { Button, Card, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { FEEDBACK_AUTO_DISMISS_MS } from '../constants/feedback';
import { useAutoDismissMessage } from '../hooks/useAutoDismissMessage';
import type { ScreenProps } from '../navigation/types';
import { getAuthenticatedUser } from '../services/auth';
import { apiClient } from '../services/api';
import type { AppTheme } from '../theme/theme';

type CustomerQrResponse = {
  qrValue: string;
  expiresAt: string;
  expiresInSeconds: number;
  customer: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  wallet: {
    id: string;
    customerId: string;
  };
  balance: number;
};

const CUSTOMER_QR_CACHE_KEY_PREFIX = 'customer-qr-cache';

export function CustomerQrScreen({ navigation }: ScreenProps<'CustomerQr'>) {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [qrData, setQrData] = useState<CustomerQrResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showingCachedQr, setShowingCachedQr] = useState(false);
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useAutoDismissMessage(error, clearError, FEEDBACK_AUTO_DISMISS_MS);

  const getCustomerQrCacheKey = useCallback(async () => {
    const authenticatedUser = await getAuthenticatedUser();
    return authenticatedUser ? `${CUSTOMER_QR_CACHE_KEY_PREFIX}:${authenticatedUser.id}` : null;
  }, []);

  const getCachedQr = useCallback(async () => {
    const cacheKey = await getCustomerQrCacheKey();
    if (!cacheKey) {
      return null;
    }

    const serializedQr = await AsyncStorage.getItem(cacheKey);
    if (!serializedQr) {
      return null;
    }

    try {
      const authenticatedUser = await getAuthenticatedUser();
      const cachedQr = JSON.parse(serializedQr) as CustomerQrResponse;
      if (
        !authenticatedUser ||
        cachedQr.customer.id !== authenticatedUser.id ||
        new Date(cachedQr.expiresAt).getTime() <= Date.now()
      ) {
        await AsyncStorage.removeItem(cacheKey);
        return null;
      }
      return cachedQr;
    } catch {
      await AsyncStorage.removeItem(cacheKey);
      return null;
    }
  }, [getCustomerQrCacheKey]);

  const loadQr = useCallback(async () => {
    setError(null);

    try {
      const response = await apiClient.get<CustomerQrResponse>('/api/wallet/qr-code');
      setQrData(response.data);
      setShowingCachedQr(false);
      const cacheKey = await getCustomerQrCacheKey();
      if (cacheKey) {
        await AsyncStorage.setItem(cacheKey, JSON.stringify(response.data));
      }
    } catch (loadError: any) {
      const cachedQr = await getCachedQr();
      if (cachedQr) {
        setQrData(cachedQr);
        setShowingCachedQr(true);
      } else {
        setQrData(null);
        setShowingCachedQr(false);
        setError(loadError?.response?.data?.error || t('customerQr.loadError'));
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getCachedQr, getCustomerQrCacheKey, t]);

  useEffect(() => {
    void loadQr();
  }, [loadQr]);

  return (
    <View style={[styles.container, { backgroundColor: theme.custom.background }]}>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(insets.top + 16, 24),
            paddingBottom: Math.max(insets.bottom + 28, 40),
          },
        ]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void loadQr(); }} />}
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
            <Pressable
              onPress={() => navigation.goBack()}
              style={[styles.iconButton, { backgroundColor: 'rgba(47,107,255,0.1)' }]}
            >
              <MaterialCommunityIcons color={theme.custom.brandStrong} name="arrow-left" size={22} />
            </Pressable>
            <LanguageSwitcher />
          </View>
          <View style={[styles.topPill, { backgroundColor: 'rgba(47,107,255,0.1)' }]}>
            <MaterialCommunityIcons name="qrcode" size={16} color={theme.custom.brandStrong} />
            <Text style={[styles.topPillText, { color: theme.custom.brandStrong }]}>{t('customerQr.badge')}</Text>
          </View>
          <Text style={[styles.heroTitle, { color: theme.custom.textPrimary }]}>{t('customerQr.title')}</Text>
          <Text style={[styles.heroSubtitle, { color: theme.custom.textSecondary }]}>
            {t('customerQr.subtitle')}
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
            <Text style={[styles.sheetTitle, { color: theme.custom.textPrimary }]}>{t('customerQr.sheetTitle')}</Text>
            <Text style={[styles.sheetSubtitle, { color: theme.custom.textSecondary }]}>
              {t('customerQr.sheetSubtitle')}
            </Text>
          </View>

          <Card style={[styles.card, { backgroundColor: theme.custom.surfaceStrong }]} mode="elevated">
            <Card.Content style={styles.cardContent}>
              {loading ? (
                <Text style={[styles.message, { color: theme.custom.textSecondary }]}>{t('customerQr.loading')}</Text>
              ) : error ? (
                <Text style={[styles.message, { color: theme.custom.error }]}>{error}</Text>
              ) : qrData ? (
                <>
                  {showingCachedQr ? (
                    <Text style={[styles.cachedMessage, { color: theme.custom.brandStrong }]}>
                      {t('customerQr.cachedNotice')}
                    </Text>
                  ) : null}
                  <View style={styles.qrWrap}>
                    <QRCode value={qrData.qrValue} size={220} />
                  </View>
                  <Text style={[styles.balance, { color: theme.custom.brandStrong }]}>{qrData.balance} pts</Text>
                  <Text style={[styles.helper, { color: theme.custom.textSecondary }]}>
                    {t('customerQr.expiresAt')} {new Date(qrData.expiresAt).toLocaleTimeString()}
                  </Text>
                  <Text style={[styles.helper, { color: theme.custom.textSecondary }]}>
                    {t('customerQr.walletId')}: {qrData.wallet.id}
                  </Text>
                </>
              ) : null}
            </Card.Content>
          </Card>

          <Button mode="contained" onPress={() => void loadQr()}>
            {t('customerQr.refresh')}
          </Button>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 28 },
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
    marginBottom: 18,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topPill: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  topPillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  heroTitle: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '900',
    marginBottom: 8,
  },
  heroSubtitle: {
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
  card: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(243, 111, 33, 0.08)',
    marginBottom: 16,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 6,
  },
  cardContent: { alignItems: 'center', paddingVertical: 20 },
  qrWrap: {
    padding: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 18,
  },
  balance: { fontSize: 36, fontWeight: '800', marginBottom: 8 },
  helper: { fontSize: 14, marginBottom: 4 },
  message: { fontSize: 14, textAlign: 'center' },
  cachedMessage: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
    textAlign: 'center',
  },
});
