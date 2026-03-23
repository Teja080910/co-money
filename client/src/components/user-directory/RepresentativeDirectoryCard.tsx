import React from 'react';
import { useTranslation } from 'react-i18next';
import { UserDirectoryCard } from './UserDirectoryCard';
import type { DirectoryUser } from './types';

type Props = {
  users: DirectoryUser[];
};

export function RepresentativeDirectoryCard({ users }: Props) {
  const { t } = useTranslation();
  return (
    <UserDirectoryCard
      title={t('directory.representatives.title')}
      subtitle={t('directory.representatives.subtitle')}
      users={users}
    />
  );
}
