import React from 'react';
import { UserDirectoryCard } from './UserDirectoryCard';
import type { DirectoryUser } from './types';

type Props = {
  users: DirectoryUser[];
};

export function MerchantDirectoryCard({ users }: Props) {
  return (
    <UserDirectoryCard
      title="Merchants"
      subtitle="Managed merchant accounts"
      users={users}
    />
  );
}
