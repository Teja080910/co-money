import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Card, List, Snackbar, TextInput, useTheme } from 'react-native-paper';
import { AppScreen } from '../components/app/AppScreen';
import { useSession } from '../context/SessionContext';
import { ScreenProps } from '../navigation/types';
import type { AppTheme } from '../theme/theme';

export function PromotionsScreen({ navigation }: ScreenProps<'Promotions'>) {
  const theme = useTheme<AppTheme>();
  const { promotions, shops, overview, user, createPromotion, refresh, loading } = useSession();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pointsCost, setPointsCost] = useState('15');
  const [error, setError] = useState('');

  const availableShopId = useMemo(() => {
    if (user?.role === 'merchant') {
      return user.managedShopIds[0] ?? shops[0]?.id;
    }
    if (user?.role === 'representative') {
      return overview?.managedShops?.[0]?.id ?? shops[0]?.id;
    }
    return shops[0]?.id;
  }, [overview?.managedShops, shops, user?.managedShopIds, user?.role]);

  const canCreate = user?.role === 'merchant' || user?.role === 'admin' || user?.role === 'representative';

  return (
    <AppScreen onBack={navigation.goBack} onRefresh={refresh} refreshing={loading} subtitle="Network offers and merchant promotions" title="Promotions">
      {canCreate && availableShopId ? (
        <Card style={styles.card}>
          <Card.Title title="Create promotion" />
          <Card.Content style={styles.form}>
            <TextInput label="Title" mode="outlined" onChangeText={setTitle} value={title} />
            <TextInput label="Description" mode="outlined" multiline onChangeText={setDescription} value={description} />
            <TextInput label="Points cost" keyboardType="number-pad" mode="outlined" onChangeText={setPointsCost} value={pointsCost} />
            <Button
              mode="contained"
              onPress={async () => {
                try {
                  await createPromotion({
                    shopId: availableShopId,
                    title,
                    description,
                    pointsCost: Number(pointsCost) || 0,
                    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
                    active: true,
                  });
                  setTitle('');
                  setDescription('');
                  setPointsCost('15');
                } catch (requestError) {
                  setError((requestError as Error).message || 'Unable to create promotion.');
                }
              }}
            >
              Save promotion
            </Button>
          </Card.Content>
        </Card>
      ) : null}

      <Card style={styles.card}>
        <Card.Title title="Active promotions" />
        <Card.Content>
          {promotions.map(promotion => {
            const shop = shops.find(entry => entry.id === promotion.shopId);
            return (
              <List.Item
                key={promotion.id}
                description={`${shop?.name ?? 'Shop'} • ${promotion.pointsCost} points • expires ${new Date(promotion.expiresAt).toLocaleDateString()}`}
                title={promotion.title}
              />
            );
          })}
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
});
