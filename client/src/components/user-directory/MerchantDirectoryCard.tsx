import React from 'react';
import { useTranslation } from 'react-i18next';
import { UserDirectoryCard } from './UserDirectoryCard';
import type { DirectoryFeedbackProps, DirectoryPaginationProps, DirectoryUser, DirectoryUserActionLoadingState } from './types';

type Props = DirectoryPaginationProps & DirectoryFeedbackProps & {
  users: DirectoryUser[];
  showStatus?: boolean;
  onActivate?: (user: DirectoryUser) => void;
  onDeactivate?: (user: DirectoryUser) => void;
  onDelete?: (user: DirectoryUser) => void;
  actionLoadingState?: DirectoryUserActionLoadingState;
};

export const MerchantDirectoryCard = React.memo(function MerchantDirectoryCard(props: Props) {
  const { t } = useTranslation();
  return (
    <UserDirectoryCard
      title={t('directory.merchants.title')}
      subtitle={t('directory.merchants.subtitle')}
      {...props}
    />
  );
});
