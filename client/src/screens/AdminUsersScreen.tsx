import React from 'react';
import { StyleSheet } from 'react-native';
import { Card, List } from 'react-native-paper';
import { AppScreen } from '../components/app/AppScreen';
import { useSession } from '../context/SessionContext';
import { ScreenProps } from '../navigation/types';

export function AdminUsersScreen({ navigation }: ScreenProps<'AdminUsers'>) {
  const { users, refresh, loading } = useSession();

  return (
    <AppScreen onBack={navigation.goBack} onRefresh={refresh} refreshing={loading} subtitle="User and role overview" title="Users">
      <Card style={styles.card}>
        <Card.Content>
          {users.map(user => (
            <List.Item key={user.id} description={`${user.email} • ${user.role}`} title={user.fullName} />
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
