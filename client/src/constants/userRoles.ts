export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  MERCHANT = 'MERCHANT',
  REPRESENTATIVE = 'REPRESENTATIVE',
  ADMIN = 'ADMIN',
}

export const USER_ROLES = [
  UserRole.CUSTOMER,
  UserRole.MERCHANT,
  UserRole.REPRESENTATIVE,
  UserRole.ADMIN,
] as const;
