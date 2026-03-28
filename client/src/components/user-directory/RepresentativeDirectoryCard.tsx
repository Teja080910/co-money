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

export const RepresentativeDirectoryCard = React.memo(function RepresentativeDirectoryCard(props: Props) {
  const { t } = useTranslation();
  return (
    <UserDirectoryCard
      title={t('directory.representatives.title')}
      subtitle={t('directory.representatives.subtitle')}
      {...props}
    />
  );
});
