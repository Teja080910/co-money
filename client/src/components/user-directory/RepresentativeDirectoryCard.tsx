import React from 'react';
import { UserDirectoryCard } from './UserDirectoryCard';
import type { DirectoryUser } from './types';

type Props = {
  users: DirectoryUser[];
};

export function RepresentativeDirectoryCard({ users }: Props) {
  return (
    <UserDirectoryCard
      title="Representatives"
      subtitle="Internal representative accounts"
      users={users}
    />
  );
}
