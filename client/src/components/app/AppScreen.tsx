import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Appbar, useTheme } from 'react-native-paper';
import type { AppTheme } from '../../theme/theme';

type Props = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onBack?: () => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  actions?: React.ReactNode;
};

export function AppScreen({ title, subtitle, children, onBack, onRefresh, refreshing, actions }: Props) {
  const theme = useTheme<AppTheme>();

  return (
    <View style={[styles.root, { backgroundColor: theme.custom.background }]}>
      <View style={[styles.blob, styles.blobTop, { backgroundColor: 'rgba(47,107,255,0.12)' }]} />
      <View style={[styles.blob, styles.blobBottom, { backgroundColor: 'rgba(52,211,153,0.12)' }]} />
      <Appbar.Header style={[styles.header, { backgroundColor: 'transparent' }]}>
        {onBack ? <Appbar.BackAction onPress={onBack} /> : null}
        <Appbar.Content title={title} subtitle={subtitle} />
        {actions}
      </Appbar.Header>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          onRefresh ? <RefreshControl refreshing={Boolean(refreshing)} onRefresh={onRefresh} tintColor={theme.custom.brand} /> : undefined
        }
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    elevation: 0,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 16,
  },
  blob: {
    position: 'absolute',
    borderRadius: 999,
  },
  blobTop: {
    width: 220,
    height: 220,
    top: -70,
    right: -60,
  },
  blobBottom: {
    width: 200,
    height: 200,
    left: -80,
    bottom: 40,
  },
});
