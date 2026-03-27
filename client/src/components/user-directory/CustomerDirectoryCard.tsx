import React from 'react';
import { useTranslation } from 'react-i18next';
import { UserDirectoryCard } from './UserDirectoryCard';
import type { DirectoryUser, DirectoryUserActionLoadingState } from './types';

type Props = {
  users: DirectoryUser[];
  showStatus?: boolean;
  onActivate?: (user: DirectoryUser) => void;
  onDeactivate?: (user: DirectoryUser) => void;
  onDelete?: (user: DirectoryUser) => void;
  actionLoadingState?: DirectoryUserActionLoadingState;
};

export function CustomerDirectoryCard(props: Props) {
  const { t } = useTranslation();
  return (
    <UserDirectoryCard
      title={t('directory.customers.title')}
      subtitle={t('directory.customers.subtitle')}
      {...props}
    />
  );
}
