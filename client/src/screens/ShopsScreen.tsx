import React from 'react';
import { StyleSheet } from 'react-native';
import { Card, List } from 'react-native-paper';
import { AppScreen } from '../components/app/AppScreen';
import { useSession } from '../context/SessionContext';
import { ScreenProps } from '../navigation/types';

export function ShopsScreen({ navigation }: ScreenProps<'Shops'>) {
  const { shops, refresh, loading } = useSession();

  return (
    <AppScreen onBack={navigation.goBack} onRefresh={refresh} refreshing={loading} subtitle="Participating local businesses" title="Shops">
      <Card style={styles.card}>
        <Card.Content>
          {shops.map(shop => (
            <List.Item
              key={shop.id}
              description={`${shop.category} • ${shop.city} • earn ${(shop.earnRate * 100).toFixed(0)}% • max discount ${(shop.maxDiscountRate * 100).toFixed(0)}%`}
              title={shop.name}
            />
          ))}
        </Card.Content>
      </Card>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
  },
});
