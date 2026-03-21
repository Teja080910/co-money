import React, { useMemo, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Button, Card, List, Snackbar, TextInput, useTheme } from 'react-native-paper';
import { AppScreen } from '../components/app/AppScreen';
import { useSession } from '../context/SessionContext';
import { ScreenProps } from '../navigation/types';
import type { AppTheme } from '../theme/theme';

export function MerchantTransactionsScreen({ navigation }: ScreenProps<'MerchantTransactions'>) {
  const theme = useTheme<AppTheme>();
  const { user, users, shops, previewTransaction, processTransaction, refresh, loading } = useSession();
  const [customerId, setCustomerId] = useState('11111111-1111-4111-8111-111111111111');
  const [totalAmount, setTotalAmount] = useState('100');
  const [requestedPoints, setRequestedPoints] = useState('30');
  const [previewText, setPreviewText] = useState('');
  const [error, setError] = useState('');

  const managedShopId = useMemo(() => user?.managedShopIds[0] ?? shops[0]?.id ?? '', [shops, user?.managedShopIds]);
  const customerOptions = users.filter(entry => entry.role === 'customer');

  return (
    <AppScreen
      onBack={navigation.goBack}
      onRefresh={refresh}
      refreshing={loading}
      subtitle="Assign and accept points in a single purchase flow"
      title="Merchant tools"
    >
      <Card style={styles.card}>
        <Card.Title title="Process transaction" />
        <Card.Content style={styles.form}>
          <TextInput
            label="Customer ID"
            mode="outlined"
            onChangeText={setCustomerId}
            placeholder={customerOptions[0]?.id}
            value={customerId}
          />
          <TextInput label="Total amount" keyboardType="decimal-pad" mode="outlined" onChangeText={setTotalAmount} value={totalAmount} />
          <TextInput
            label="Requested points"
            keyboardType="number-pad"
            mode="outlined"
            onChangeText={setRequestedPoints}
            value={requestedPoints}
          />
          <Button
            mode="contained-tonal"
            onPress={async () => {
              try {
                const preview = await previewTransaction({
                  customerId,
                  merchantId: user?.id ?? '',
                  shopId: managedShopId,
                  totalAmount: Number(totalAmount) || 0,
                  requestedPoints: Number(requestedPoints) || 0,
                });
                setPreviewText(
                  `Discount ${preview.discountAmount}, payable ${preview.payableAmount}, earned ${preview.earnedPoints}, blocked same-shop points ${preview.sameShopRestrictedPoints}`,
                );
              } catch (requestError) {
                setError((requestError as Error).message || 'Could not preview transaction.');
              }
            }}
          >
            Preview math
          </Button>
          <Button
            mode="contained"
            onPress={async () => {
              try {
                await processTransaction({
                  customerId,
                  merchantId: user?.id ?? '',
                  shopId: managedShopId,
                  totalAmount: Number(totalAmount) || 0,
                  requestedPoints: Number(requestedPoints) || 0,
                });
                setPreviewText('Transaction stored and wallet updated.');
              } catch (requestError) {
                setError((requestError as Error).message || 'Could not process transaction.');
              }
            }}
          >
            Save transaction
          </Button>
          {previewText ? <Text style={[styles.preview, { color: theme.custom.textSecondary }]}>{previewText}</Text> : null}
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title title="Available customers" />
        <Card.Content>
          {customerOptions.map(customer => (
            <List.Item key={customer.id} description={customer.email} title={`${customer.fullName} • ${customer.id}`} />
          ))}
        </Card.Content>
      </Card>
      <Snackbar onDismiss={() => setError('')} visible={Boolean(error)}>
        {error}
      </Snackbar>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
  },
  form: {
    gap: 12,
  },
  preview: {
    fontSize: 14,
    lineHeight: 21,
  },
});
