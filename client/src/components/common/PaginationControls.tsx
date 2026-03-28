import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { Chip, IconButton, useTheme } from 'react-native-paper';
import type { AppTheme } from '../../theme/theme';

type Props = {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  loading?: boolean;
  onPageChange: (nextPage: number) => void;
  onPageSizeChange?: (nextPageSize: number) => void;
  pageSizeOptions?: number[];
};

export function PaginationControls({
  page,
  totalPages,
  totalItems,
  pageSize,
  loading = false,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10],
}: Props) {
  const { t } = useTranslation();
  const theme = useTheme<AppTheme>();
  const safeTotalPages = Math.max(totalPages, 1);
  const minimumPageSize = pageSizeOptions.length ? Math.min(...pageSizeOptions) : pageSize;

  if (!totalItems || totalItems <= minimumPageSize) {
    return null;
  }

  return (
    <View style={styles.container}>
      {onPageSizeChange ? (
        <View style={styles.pageSizeRow}>
          <Text style={[styles.pageSizeLabel, { color: theme.custom.textSecondary }]}>
            {t('common.pagination.itemsPerPage')}
          </Text>
          <View style={styles.pageSizeOptions}>
            {pageSizeOptions.map(option => (
              <Chip
                key={option}
                compact
                mode={pageSize === option ? 'flat' : 'outlined'}
                selected={pageSize === option}
                disabled={loading}
                onPress={() => onPageSizeChange(option)}
                style={styles.pageSizeChip}
              >
                {option}
              </Chip>
            ))}
          </View>
        </View>
      ) : null}
      <View style={styles.row}>
        <Text style={[styles.summary, { color: theme.custom.textSecondary }]}>
          {t('common.pagination.summary', {
            page,
            totalPages: safeTotalPages,
          })}
        </Text>
        <View style={styles.actions}>
          <IconButton
            icon="chevron-left"
            mode="outlined"
            disabled={page <= 1 || loading}
            onPress={() => onPageChange(page - 1)}
            style={styles.actionButton}
          />
          <IconButton
            icon="chevron-right"
            mode="outlined"
            disabled={page >= safeTotalPages || loading}
            onPress={() => onPageChange(page + 1)}
            style={styles.actionButton}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  summary: {
    flex: 1,
    fontSize: 13,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'flex-end',
  },
  pageSizeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  pageSizeLabel: {
    fontSize: 13,
  },
  pageSizeOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  pageSizeChip: {
    margin: 0,
  },
  actionButton: {
    margin: 0,
  },
});
