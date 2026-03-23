import React from 'react';
import { useTranslation } from 'react-i18next';
import { UserDirectoryCard } from './UserDirectoryCard';
import type { DirectoryUser } from './types';

type Props = {
  users: DirectoryUser[];
};

export function MerchantDirectoryCard({ users }: Props) {
  const { t } = useTranslation();
  return (
    <UserDirectoryCard
      title={t('directory.merchants.title')}
      subtitle={t('directory.merchants.subtitle')}
      users={users}
    />
  );
}
