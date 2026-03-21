import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { Button, Card, List, Snackbar, TextInput } from 'react-native-paper';
import { AppScreen } from '../components/app/AppScreen';
import { useSession } from '../context/SessionContext';
import { ScreenProps } from '../navigation/types';

export function AdminEventsScreen({ navigation }: ScreenProps<'AdminEvents'>) {
  const { events, createEvent, refresh, loading } = useSession();
  const [title, setTitle] = useState('');
  const [venue, setVenue] = useState('');
  const [summary, setSummary] = useState('');
  const [error, setError] = useState('');

  return (
    <AppScreen onBack={navigation.goBack} onRefresh={refresh} refreshing={loading} subtitle="Community events and activations" title="Events">
      <Card style={styles.card}>
        <Card.Title title="Create event" />
        <Card.Content style={styles.form}>
          <TextInput label="Title" mode="outlined" onChangeText={setTitle} value={title} />
          <TextInput label="Venue" mode="outlined" onChangeText={setVenue} value={venue} />
          <TextInput label="Summary" mode="outlined" multiline onChangeText={setSummary} value={summary} />
          <Button
            mode="contained"
            onPress={async () => {
              try {
                await createEvent({
                  title,
                  venue,
                  summary,
                  startsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
                  status: 'scheduled',
                });
                setTitle('');
                setVenue('');
                setSummary('');
              } catch (requestError) {
                setError((requestError as Error).message || 'Unable to create event.');
              }
            }}
          >
            Save event
          </Button>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          {events.map(event => (
            <List.Item key={event.id} description={`${event.venue} • ${new Date(event.startsAt).toLocaleString()} • ${event.status}`} title={event.title} />
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
});
