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
} | null;
