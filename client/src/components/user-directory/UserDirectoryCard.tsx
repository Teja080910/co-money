import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { Button, Card, useTheme } from 'react-native-paper';
import type { AppTheme } from '../../theme/theme';
import type { DirectoryUser, DirectoryUserActionLoadingState } from './types';

type Props = {
  title: string;
  subtitle: string;
  users: DirectoryUser[];
  showStatus?: boolean;
  onActivate?: (user: DirectoryUser) => void;
  onDeactivate?: (user: DirectoryUser) => void;
  onDelete?: (user: DirectoryUser) => void;
  actionLoadingState?: DirectoryUserActionLoadingState;
};

export function UserDirectoryCard({
  title,
  subtitle,
  users,
  showStatus = false,
  onActivate,
  onDeactivate,
  onDelete,
  actionLoadingState = null,
}: Props) {
  const { t } = useTranslation();
  const theme = useTheme<AppTheme>();

  return (
    <Card style={[styles.card, { backgroundColor: theme.custom.surfaceStrong }]} mode="elevated">
      <Card.Title title={title} subtitle={subtitle} />
      <Card.Content>
        {users.length ? (
          users.map(user => {
            const isSameUserLoading = actionLoadingState?.userId === user.id;
            const isActivateLoading = isSameUserLoading && actionLoadingState?.action === 'activate';
            const isDeactivateLoading = isSameUserLoading && actionLoadingState?.action === 'deactivate';
            const isDeleteLoading = isSameUserLoading && actionLoadingState?.action === 'delete';

            return (
              <View key={user.id} style={styles.listItem}>
              <Text style={[styles.listTitle, { color: theme.custom.textPrimary }]}>
                {[user.firstName, user.lastName].filter(Boolean).join(' ') || user.username}
              </Text>
              <Text style={[styles.listMeta, { color: theme.custom.textSecondary }]}>{user.email}</Text>
              <Text style={[styles.listMeta, { color: theme.custom.textSecondary }]}>
                {t('common.role')}: {t(`roles.${user.role.toLowerCase()}`)}
              </Text>
              {showStatus && user.status ? (
                <Text
                  style={[
                    styles.listMeta,
                    {
                      color:
                        user.status === 'ACTIVE'
                          ? theme.custom.success
                          : user.status === 'DELETED'
                            ? theme.custom.error
                            : theme.custom.textSecondary,
                    },
                  ]}
                >
                  {t('common.status')}: {t(`statuses.${user.status.toLowerCase()}`)}
                </Text>
              ) : null}
              {onActivate || onDeactivate || onDelete ? (
                <View style={styles.actionRow}>
                  {onActivate && user.status !== 'ACTIVE' ? (
                    <Button compact mode="text" onPress={() => onActivate(user)} loading={isActivateLoading} disabled={isSameUserLoading}>
                      {t('common.activate')}
                    </Button>
                  ) : null}
                  {onDeactivate && user.status === 'ACTIVE' ? (
                    <Button compact mode="text" onPress={() => onDeactivate(user)} loading={isDeactivateLoading} disabled={isSameUserLoading}>
                      {t('common.deactivate')}
                    </Button>
                  ) : null}
                  {onDelete && user.status !== 'DELETED' ? (
                    <Button compact mode="text" textColor={theme.custom.error} onPress={() => onDelete(user)} loading={isDeleteLoading} disabled={isSameUserLoading}>
                      {t('common.delete')}
                    </Button>
                  ) : null}
                </View>
              ) : null}
              </View>
            );
          })
        ) : (
          <Text style={[styles.emptyText, { color: theme.custom.textSecondary }]}>{t('common.noRecords')}</Text>
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 14,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(243, 111, 33, 0.08)',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 6,
  },
  listItem: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(148, 163, 184, 0.3)',
  },
  listTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  listMeta: {
    marginTop: 4,
    fontSize: 13,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  emptyText: {
    fontSize: 14,
  },
});
