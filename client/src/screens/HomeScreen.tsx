import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Text, Appbar, Card, Title, Paragraph, Button, ActivityIndicator, FAB } from 'react-native-paper';
import axios from 'axios';

interface Props {
  onLogout: () => void;
}

export const HomeScreen: React.FC<Props> = ({ onLogout }) => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Connect to the local backend. Note: Adjust IP address if running on physical device
      const response = await axios.get('http://127.0.0.1:3000/api/users');
      setUsers(response.data);
    } catch (error) {
      console.warn("Could not fetch users, make sure backend is running");
      setUsers([
        { id: '1', username: 'TestUser1', email: 'test1@test.com' },
        { id: '2', username: 'TestUser2', email: 'test2@test.com' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <View style={styles.container}>
      <Appbar.Header elevated>
        <Appbar.Content title="Dashboard" subtitle="Co-Money" />
        <Appbar.Action icon="logout" onPress={onLogout} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.content}>
        <Title style={styles.sectionTitle}>Registered Users</Title>
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
