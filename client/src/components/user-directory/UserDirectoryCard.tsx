import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { ActivityIndicator, Button, Card, useTheme } from 'react-native-paper';
import { PaginationControls } from '../common/PaginationControls';
import type { AppTheme } from '../../theme/theme';
import type { DirectoryFeedbackProps, DirectoryUser, DirectoryUserAction, DirectoryUserActionLoadingState } from './types';

type Props = DirectoryFeedbackProps & {
  title: string;
  subtitle: string;
  users: DirectoryUser[];
  showStatus?: boolean;
  onActivate?: (user: DirectoryUser) => void | Promise<void>;
  onDeactivate?: (user: DirectoryUser) => void | Promise<void>;
  onDelete?: (user: DirectoryUser) => void | Promise<void>;
  actionLoadingState?: DirectoryUserActionLoadingState;
  loading?: boolean;
  page?: number;
  pageSize?: number;
  totalPages?: number;
  totalItems?: number;
  onPageChange?: (nextPage: number) => void;
  onPageSizeChange?: (nextPageSize: number) => void;
};

type UserDirectoryRowProps = {
  user: DirectoryUser;
  showStatus: boolean;
  onActivate?: () => void;
  onDeactivate?: () => void;
  onDelete?: () => void;
  isSameUserLoading: boolean;
  activeAction: DirectoryUserAction | null;
};

const UserDirectoryRow = React.memo(function UserDirectoryRow({
  user,
  showStatus,
  onActivate,
  onDeactivate,
  onDelete,
  isSameUserLoading,
  activeAction,
}: UserDirectoryRowProps) {
  const { t } = useTranslation();
  const theme = useTheme<AppTheme>();
  const isActivateLoading = isSameUserLoading && activeAction === 'activate';
  const isDeactivateLoading = isSameUserLoading && activeAction === 'deactivate';
  const isDeleteLoading = isSameUserLoading && activeAction === 'delete';

  return (
    <View style={styles.listItem}>
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
            <Button compact mode="text" style={styles.actionButtonWide} contentStyle={styles.actionButtonContent} labelStyle={styles.actionButtonLabel} onPress={onActivate} loading={isActivateLoading} disabled={isSameUserLoading}>
              {t('common.activate')}
            </Button>
          ) : null}
          {onDeactivate && user.status === 'ACTIVE' ? (
            <Button compact mode="text" style={styles.actionButtonWide} contentStyle={styles.actionButtonContent} labelStyle={styles.actionButtonLabel} onPress={onDeactivate} loading={isDeactivateLoading} disabled={isSameUserLoading}>
              {t('common.deactivate')}
            </Button>
          ) : null}
          {onDelete && user.status !== 'DELETED' ? (
            <Button compact mode="text" style={styles.actionButtonCompact} contentStyle={styles.actionButtonContent} labelStyle={styles.actionButtonLabel} textColor={theme.custom.error} onPress={onDelete} loading={isDeleteLoading} disabled={isSameUserLoading}>
              {t('common.delete')}
            </Button>
          ) : null}
        </View>
      ) : null}
    </View>
  );
});

export const UserDirectoryCard = React.memo(function UserDirectoryCard({
  title,
  subtitle,
  users,
  errorMessage,
  successMessage,
  showStatus = false,
  onActivate,
  onDeactivate,
  onDelete,
  actionLoadingState = null,
  loading = false,
  page = 1,
  pageSize = 5,
  totalPages = 0,
  totalItems = 0,
  onPageChange,
  onPageSizeChange,
}: Props) {
  const { t } = useTranslation();
  const theme = useTheme<AppTheme>();
  const [localActionLoadingState, setLocalActionLoadingState] = React.useState<DirectoryUserActionLoadingState>(null);
  const effectiveActionLoadingState = actionLoadingState ?? localActionLoadingState;

  const runUserAction = React.useCallback(async (
    action: DirectoryUserAction,
    handler: ((user: DirectoryUser) => void | Promise<void>) | undefined,
    user: DirectoryUser,
  ) => {
    if (!handler) {
      return;
    }

    const shouldManageLocally = actionLoadingState === undefined;
    if (shouldManageLocally) {
      setLocalActionLoadingState({ userId: user.id, action, role: user.role });
    }

    try {
      await handler(user);
    } finally {
      if (shouldManageLocally) {
        setLocalActionLoadingState(null);
      }
    }
  }, [actionLoadingState]);

  return (
    <Card style={[styles.card, { backgroundColor: theme.custom.surfaceStrong }]} mode="elevated">
      <Card.Title title={title} subtitle={subtitle} />
      <Card.Content>
        {loading ? (
          <ActivityIndicator animating size="small" style={styles.loading} />
        ) : users.length ? (
          users.map(user => (
            <UserDirectoryRow
              key={user.id}
              user={user}
              showStatus={showStatus}
              onActivate={onActivate ? () => void runUserAction('activate', onActivate, user) : undefined}
              onDeactivate={onDeactivate ? () => void runUserAction('deactivate', onDeactivate, user) : undefined}
              onDelete={onDelete ? () => void runUserAction('delete', onDelete, user) : undefined}
              isSameUserLoading={effectiveActionLoadingState?.userId === user.id}
              activeAction={effectiveActionLoadingState?.userId === user.id ? effectiveActionLoadingState.action : null}
            />
          ))
        ) : (
          <Text style={[styles.emptyText, { color: theme.custom.textSecondary }]}>{t('common.noRecords')}</Text>
        )}
        {errorMessage ? (
          <Text style={[styles.message, { color: theme.custom.error }]}>
            {errorMessage}
          </Text>
        ) : null}
        {!errorMessage && successMessage ? (
          <Text style={[styles.message, { color: theme.custom.success }]}>
            {successMessage}
          </Text>
        ) : null}
        {onPageChange ? (
          <PaginationControls
            page={page}
            pageSize={pageSize}
            totalPages={totalPages}
            totalItems={totalItems}
            loading={loading}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
          />
        ) : null}
      </Card.Content>
    </Card>
  );
});

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
    flexWrap: 'nowrap',
    width: '100%',
  },
  actionButtonCompact: {
    flex: 1,
  },
  actionButtonWide: {
    flex: 1,
  },
  actionButtonContent: {
    minHeight: 34,
    justifyContent: 'center',
  },
  actionButtonLabel: {
    fontSize: 12,
    marginHorizontal: 4,
  },
  emptyText: {
    fontSize: 14,
  },
  message: {
    marginTop: 8,
    marginBottom: 4,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    width: '100%',
    alignSelf: 'center',
    textAlign: 'center',
  },
  loading: {
    marginVertical: 12,
  },
});
