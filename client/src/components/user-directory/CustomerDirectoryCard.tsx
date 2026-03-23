import React from 'react';
import { useTranslation } from 'react-i18next';
import { UserDirectoryCard } from './UserDirectoryCard';
import type { DirectoryUser } from './types';

type Props = {
  users: DirectoryUser[];
};

export function CustomerDirectoryCard({ users }: Props) {
  const { t } = useTranslation();
  return (
    <UserDirectoryCard
      title={t('directory.customers.title')}
      subtitle={t('directory.customers.subtitle')}
      users={users}
    />
  );
}
