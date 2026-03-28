export enum UserRole {
    CUSTOMER = 'CUSTOMER',
    MERCHANT = 'MERCHANT',
    REPRESENTATIVE = 'REPRESENTATIVE',
    ADMIN = 'ADMIN',
}

export const USER_ROLES = Object.freeze([
    UserRole.CUSTOMER,
    UserRole.MERCHANT,
    UserRole.REPRESENTATIVE,
    UserRole.ADMIN,
]);

export function isUserRole(value: string): value is UserRole {
    return USER_ROLES.includes(value as UserRole);
}
