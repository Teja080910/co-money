import { UserRole } from '../constants/userRoles';
import type { AppTabRoute } from './types';

export function getRoutesForRole(role: UserRole): AppTabRoute[] {
  switch (role) {
    case UserRole.CUSTOMER:
      return [
        { key: 'home', title: 'Home', focusedIcon: 'home', unfocusedIcon: 'home-outline', showWelcomeHeader: true },
        { key: 'wallet', title: 'Wallet', focusedIcon: 'wallet', unfocusedIcon: 'wallet-outline' },
        { key: 'promotions', title: 'Promotions', focusedIcon: 'tag-multiple', unfocusedIcon: 'tag-multiple-outline' },
        { key: 'transactions', title: 'History', focusedIcon: 'history', unfocusedIcon: 'history' },
        { key: 'profile', title: 'Profile', focusedIcon: 'account', unfocusedIcon: 'account-outline' },
      ];
    case UserRole.MERCHANT:
      return [
        { key: 'home', title: 'Home', focusedIcon: 'store', unfocusedIcon: 'store-outline', showWelcomeHeader: true },
        { key: 'customers', title: 'Customers', focusedIcon: 'account-group', unfocusedIcon: 'account-group-outline' },
        { key: 'add-points', title: 'Add Points', focusedIcon: 'plus-circle', unfocusedIcon: 'plus-circle-outline' },
        { key: 'promotions', title: 'Promotions', focusedIcon: 'tag-multiple', unfocusedIcon: 'tag-multiple-outline' },
        { key: 'category-settings', title: 'Categories', focusedIcon: 'shape-outline', unfocusedIcon: 'shape-outline' },
        { key: 'transactions', title: 'Transactions', focusedIcon: 'receipt-text', unfocusedIcon: 'receipt-text-outline' },
        { key: 'profile', title: 'Profile', focusedIcon: 'account', unfocusedIcon: 'account-outline' },
      ];
    case UserRole.REPRESENTATIVE:
      return [
        { key: 'home', title: 'Home', focusedIcon: 'home-city', unfocusedIcon: 'home-city-outline', showWelcomeHeader: true },
        { key: 'events', title: 'Events', focusedIcon: 'calendar-star', unfocusedIcon: 'calendar-star' },
        { key: 'user-management', title: 'Users', focusedIcon: 'account-group', unfocusedIcon: 'account-group-outline' },
        { key: 'category-settings', title: 'Categories', focusedIcon: 'shape-outline', unfocusedIcon: 'shape-outline' },
        { key: 'transactions', title: 'Transactions', focusedIcon: 'history', unfocusedIcon: 'history' },
        { key: 'profile', title: 'Profile', focusedIcon: 'account', unfocusedIcon: 'account-outline' },
      ];
    case UserRole.ADMIN:
      return [
        { key: 'dashboard', title: 'Dashboard', focusedIcon: 'view-dashboard', unfocusedIcon: 'view-dashboard-outline', showWelcomeHeader: true },
        { key: 'user-management', title: 'Users', focusedIcon: 'account-group', unfocusedIcon: 'account-group-outline' },
        { key: 'shop-management', title: 'Shops', focusedIcon: 'storefront', unfocusedIcon: 'storefront-outline' },
        { key: 'category-settings', title: 'Categories', focusedIcon: 'shape-outline', unfocusedIcon: 'shape-outline' },
        { key: 'configuration', title: 'Config', focusedIcon: 'cog-outline', unfocusedIcon: 'cog-outline' },
        { key: 'promotions', title: 'Promotions', focusedIcon: 'tag-multiple', unfocusedIcon: 'tag-multiple-outline' },
        { key: 'events', title: 'Events', focusedIcon: 'calendar-star', unfocusedIcon: 'calendar-star' },
        { key: 'profile', title: 'Profile', focusedIcon: 'account', unfocusedIcon: 'account-outline' },
      ];
  }
}
