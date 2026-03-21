import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Appbar, Card, Title, ActivityIndicator, FAB } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { apiClient } from '../services/api';

interface Props {
  navigation: any;
}

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useTranslation();
  const onLogout = () => {
    navigation.replace('Login');
  };
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/api/users');
      setUsers(response.data);
    } catch (error) {
      console.warn(t('home.fetchWarning'));
      setUsers([
        { id: '1', username: 'TestUser1', email: 'test1@test.com' },
        { id: '2', username: 'TestUser2', email: 'test2@test.com' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchUsers();
  }, [t]);

  return (
    <View style={styles.container}>
      <Appbar.Header elevated>
        <Appbar.Content title={t('home.title')} subtitle={t('home.subtitle')} />
        <View style={styles.headerActions}>
          <LanguageSwitcher />
          <Appbar.Action accessibilityLabel={t('home.logout')} icon="logout" onPress={onLogout} />
        </View>
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.content}>
        <Title style={styles.sectionTitle}>{t('home.registeredUsers')}</Title>
        {loading ? (
          <ActivityIndicator animating={true} size="large" style={styles.loader} />
        ) : (
          users.map((user, index) => (
            <Card key={user.id || index} style={styles.card} mode="elevated">
              <Card.Title title={user.username} subtitle={user.email} />
            </Card>
          ))
        )}
      </ScrollView>
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => console.log('Pressed Add')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F6F6',
  },
  content: {
    padding: 16,
    paddingBottom: 80, // Space for FAB
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingRight: 8,
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  loader: {
    marginTop: 40,
  },
  card: {
    marginBottom: 12,
    borderRadius: 12,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});
