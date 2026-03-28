export type DirectoryUser = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  username: string;
  email: string;
  role: string;
  emailVerified: boolean;
  status?: 'ACTIVE' | 'INACTIVE' | 'DELETED';
  isActive?: boolean;
};

export type DirectoryUserAction = 'activate' | 'deactivate' | 'delete';

export type DirectoryUserActionLoadingState = {
  userId: string;
  action: DirectoryUserAction;
  role: string;
} | null;

export type DirectoryPaginationProps = {
  loading?: boolean;
  page?: number;
  pageSize?: number;
  totalPages?: number;
  totalItems?: number;
  onPageChange?: (nextPage: number) => void;
  onPageSizeChange?: (nextPageSize: number) => void;
};

export type DirectoryFeedbackProps = {
  errorMessage?: string;
  successMessage?: string;
};
