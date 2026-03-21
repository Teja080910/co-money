import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Button, Card, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import type { ScreenProps } from '../navigation/types';
import { apiClient } from '../services/api';
import type { AppTheme } from '../theme/theme';

type ScannedCustomerResponse = {
  customer: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  balance: number;
};

export function MerchantScanScreen({ navigation }: ScreenProps<'MerchantScan'>) {
  const theme = useTheme<AppTheme>();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scannedCustomer, setScannedCustomer] = useState<ScannedCustomerResponse | null>(null);

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (hasScanned || isSubmitting) {
      return;
    }

    setHasScanned(true);
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await apiClient.post<ScannedCustomerResponse>('/api/wallet/scan-customer', {
        qrValue: data,
      });
      setScannedCustomer(response.data);
    } catch (scanError: any) {
      setError(scanError?.response?.data?.error || 'Unable to scan customer QR.');
      setHasScanned(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!permission) {
    return null;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, { backgroundColor: theme.custom.background }]}>
        <View
          style={[
            styles.headerCard,
            {
              marginTop: Math.max(insets.top + 16, 24),
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
            <MaterialCommunityIcons name="camera-outline" size={16} color={theme.custom.brandStrong} />
            <Text style={[styles.topPillText, { color: theme.custom.brandStrong }]}>Merchant Scanner</Text>
          </View>
          <Text style={[styles.heroTitle, { color: theme.custom.textPrimary }]}>Scan Customer</Text>
          <Text style={[styles.heroSubtitle, { color: theme.custom.textSecondary }]}>
            Camera access is required to verify a customer QR.
          </Text>
        </View>

        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.custom.surfaceStrong,
              borderColor: 'rgba(243, 111, 33, 0.12)',
              paddingBottom: Math.max(insets.bottom + 28, 36),
            },
          ]}
        >
          <Text style={[styles.permissionText, { color: theme.custom.textPrimary }]}>
            Allow camera access to scan customer QR codes.
          </Text>
          <Button mode="contained" onPress={() => void requestPermission()}>
            Grant Camera Access
          </Button>
        </View>
      </View>
    );
  }

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
            <MaterialCommunityIcons name="qrcode-scan" size={16} color={theme.custom.brandStrong} />
            <Text style={[styles.topPillText, { color: theme.custom.brandStrong }]}>Merchant Scanner</Text>
          </View>
          <Text style={[styles.heroTitle, { color: theme.custom.textPrimary }]}>Scan Customer</Text>
          <Text style={[styles.heroSubtitle, { color: theme.custom.textSecondary }]}>
            Scan QR to verify a customer and jump back into the add-points flow.
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
            <Text style={[styles.sheetTitle, { color: theme.custom.textPrimary }]}>Scanner</Text>
            <Text style={[styles.sheetSubtitle, { color: theme.custom.textSecondary }]}>
              Align the customer QR inside the frame to fetch the wallet details.
            </Text>
          </View>

          <View style={styles.cameraFrame}>
            <CameraView
              style={styles.camera}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={handleBarcodeScanned}
            />
            <View style={styles.scanGuide}>
              <View style={styles.scanBox} />
            </View>
          </View>

          <Card style={[styles.resultCard, { backgroundColor: theme.custom.surfaceStrong }]} mode="elevated">
            <Card.Content>
              {error ? <Text style={[styles.statusText, { color: theme.custom.error }]}>{error}</Text> : null}
              {!error && !scannedCustomer ? (
                <Text style={[styles.statusText, { color: theme.custom.textPrimary }]}>
                  {isSubmitting ? 'Checking customer QR...' : 'Ready to scan a customer wallet.'}
                </Text>
              ) : null}
              {scannedCustomer ? (
                <>
                  <Text style={[styles.customerName, { color: theme.custom.textPrimary }]}>
                    {[scannedCustomer.customer.firstName, scannedCustomer.customer.lastName].filter(Boolean).join(' ') || scannedCustomer.customer.email}
                  </Text>
                  <Text style={[styles.statusText, { color: theme.custom.textSecondary }]}>
                    Balance: {scannedCustomer.balance} pts
                  </Text>
                  <Button
                    mode="contained"
                    onPress={() => navigation.replace('Home', { selectedCustomerId: scannedCustomer.customer.id })}
                    style={styles.actionButton}
                  >
                    Use This Customer
                  </Button>
                </>
              ) : (
                <Button mode="outlined" onPress={() => { setHasScanned(false); setError(null); }}>
                  Scan Again
                </Button>
              )}
            </Card.Content>
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingBottom: 28,
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
  permissionWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
  permissionText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
  },
  cameraFrame: {
    height: 320,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 18,
    backgroundColor: '#0B1525',
  },
  camera: {
    flex: 1,
  },
  scanGuide: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanBox: {
    width: 210,
    height: 210,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.9)',
    backgroundColor: 'transparent',
  },
  resultCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(243, 111, 33, 0.08)',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 6,
  },
  statusText: {
    fontSize: 14,
    marginBottom: 10,
    lineHeight: 21,
  },
  customerName: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },
  actionButton: {
    marginTop: 10,
  },
});
