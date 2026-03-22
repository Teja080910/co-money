export type DirectoryUser = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  username: string;
  email: string;
  role: string;
  emailVerified: boolean;
};
