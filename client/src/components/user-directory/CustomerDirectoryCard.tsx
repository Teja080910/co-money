import React from 'react';
import { UserDirectoryCard } from './UserDirectoryCard';
import type { DirectoryUser } from './types';

type Props = {
  users: DirectoryUser[];
};

export function CustomerDirectoryCard({ users }: Props) {
  return (
    <UserDirectoryCard
      title="Customers"
      subtitle="Customer accounts across the network"
      users={users}
    />
  );
}
