# Co-Money QA Test Case Document

## Scope

This document covers manual QA validation for the implemented items from:

- `## 5. Roles and Permissions`
- `## 6. Reconstructed Functional Scope`

The focus is on backend-integrated React Native behavior without redesigning the existing UI/UX.

## Test Environment

- Latest database migrations applied
- Backend server running
- React Native client running
- Test data available for:
  - `ADMIN`
  - `REPRESENTATIVE`
  - `MERCHANT`
  - `CUSTOMER`
- At least:
  - one active merchant-owned shop
  - one representative-managed shop
  - one active customer wallet
  - sample promotion
  - sample event

## Status Values

Use one of the following during execution:

- `Not Run`
- `Pass`
- `Fail`
- `Blocked`

## Test Cases

| Test ID | Module | Precondition | Steps | Expected Result | Status |
|---|---|---|---|---|---|
| QA-001 | Login | Valid account exists for each role | Login as `CUSTOMER`, `MERCHANT`, `REPRESENTATIVE`, and `ADMIN` | Login succeeds and the correct role-specific tabs/dashboard load | Not Run |
| QA-002 | Session Restore | User already logged in | Close and reopen app | Saved session restores successfully and user stays authenticated | Not Run |
| QA-003 | Logout | User logged in | Tap logout from app header/profile | Session clears and app returns to login screen | Not Run |
| QA-004 | Auth Profile | User logged in | Open profile screen after login | Profile data matches authenticated account | Not Run |
| QA-005 | Deactivated Account Access | Admin and merchant account exist | Admin deactivates merchant, then merchant attempts login and uses old session | Login is blocked and protected requests fail for old token/session | Not Run |
| QA-006 | Reactivation | Merchant is inactive | Admin reactivates merchant and merchant logs in again | Merchant can authenticate successfully again | Not Run |
| QA-007 | Admin User Delete | Admin and target user exist | Admin deletes a managed user | Deleted user is no longer usable for authentication and is shown with deleted status where applicable | Not Run |
| QA-008 | Customer Permissions | Customer logged in | Try normal customer flows and confirm no admin/merchant actions are exposed | Customer can only access customer features | Not Run |
| QA-009 | Merchant Permissions | Merchant logged in | Open merchant tabs and attempt category/promotion/customer flows | Merchant can manage only their allowed operational scope | Not Run |
| QA-010 | Representative Permissions | Representative logged in | Open representative flows for shops, events, users, reports, categories | Representative can access only assigned/allowed scope | Not Run |
| QA-011 | Admin Permissions | Admin logged in | Open admin tabs for users, shops, categories, configuration, reports | Admin has access to full administrative scope | Not Run |
| QA-012 | Customer Wallet View | Customer wallet exists | Login as customer and open wallet tab | Wallet balance, breakdown, and recent transactions display correctly | Not Run |
| QA-013 | Customer QR | Customer logged in | Open QR screen and refresh QR | QR loads successfully and refresh generates a new valid code | Not Run |
| QA-014 | Merchant QR Scan | Merchant and customer QR available | Scan customer QR from merchant flow | Customer wallet is resolved and customer is selected for add-points flow | Not Run |
| QA-015 | Manual Customer Lookup by Name | Merchant logged in, scan screen open | Search customer by first/last name | Matching customers are returned and selectable | Not Run |
| QA-016 | Manual Customer Lookup by Username | Merchant logged in, scan screen open | Search customer by username | Matching customers are returned and selectable | Not Run |
| QA-017 | Manual Customer Lookup by Email | Merchant logged in, scan screen open | Search customer by email | Matching customers are returned and selectable | Not Run |
| QA-018 | Earn Points Success | Merchant, customer, and shop available | Select customer, shop, point type, enter points, submit earn | Earn transaction succeeds, wallet balance updates, and transaction appears in history | Not Run |
| QA-019 | Earn Points Validation | Merchant logged in | Try earn flow with missing customer, missing shop, or invalid points | Validation or server error prevents invalid submission | Not Run |
| QA-020 | Spend Preview Success | Merchant, customer wallet, and shop available | Enter customer, shop, purchase amount, spend points, category, then preview | Preview shows used points, max discount, payable amount, earned points, bonus points, and predicted balance | Not Run |
| QA-021 | Spend Settlement Success | Preview-ready settlement data available | Submit spend/settlement after preview | Spend succeeds and final transaction values align with preview | Not Run |
| QA-022 | Spend Validation | Merchant logged in | Try spend flow with invalid amounts or missing fields | Invalid settlement is blocked with proper error handling | Not Run |
| QA-023 | Same-Shop Spend Restriction | Customer has points from one shop | Try spending points in unauthorized context | Settlement respects same-shop restriction and blocks invalid usage | Not Run |
| QA-024 | First Settlement Bonus | Customer qualifies for first settlement bonus | Complete first eligible purchase settlement | Bonus points are applied exactly once according to config | Not Run |
| QA-025 | Category Create | Merchant or representative has accessible shop | Open category settings, create new category with discount percent | Category is saved and visible in category list | Not Run |
| QA-026 | Category Edit | Existing category available | Edit category name and/or discount percent | Updated values persist and display correctly | Not Run |
| QA-027 | Category Activate/Deactivate | Existing active category available | Toggle category active state | Category status changes successfully | Not Run |
| QA-028 | Category Delete | Existing non-default category available | Delete category | Category is removed successfully | Not Run |
| QA-029 | Default Category Protection | Default category exists | Attempt to delete default category | Delete is blocked by validation/business rule | Not Run |
| QA-030 | Category Default Switch | Two categories exist for one shop | Mark a different category as default | Only one category remains default for that shop | Not Run |
| QA-031 | Category-Based Preview Change | Two categories with different discount rules exist | Run preview using different categories for same settlement | Preview values change according to selected category discount percent | Not Run |
| QA-032 | Promotion Create | Merchant/admin has valid shop | Create a promotion | Promotion is saved and listed | Not Run |
| QA-033 | Promotion Edit | Existing promotion available | Edit promotion fields | Promotion updates successfully | Not Run |
| QA-034 | Promotion Activate/Deactivate | Existing promotion available | Toggle promotion active status | Promotion status updates successfully | Not Run |
| QA-035 | Promotion Delete | Existing promotion available | Delete promotion | Promotion is removed successfully | Not Run |
| QA-036 | Promotion Claim | Customer and active promotion available | Customer opens promotions and claims one | Claim succeeds and wallet/bonus values update correctly | Not Run |
| QA-037 | Event Create | Representative/admin logged in | Create event with title, location, and dates | Event is saved and displayed in event list | Not Run |
| QA-038 | Event Edit | Existing event available | Edit event details | Event updates successfully | Not Run |
| QA-039 | Event Activate/Deactivate | Existing event available | Toggle event active state | Event status updates successfully | Not Run |
| QA-040 | Event Delete | Existing event available | Delete event | Event is removed successfully | Not Run |
| QA-041 | Shop Create | Representative/admin and merchant available | Create a shop and assign merchant | Shop is saved and visible in managed shops | Not Run |
| QA-042 | Shop Edit | Existing shop available | Edit shop details | Shop updates successfully | Not Run |
| QA-043 | Shop Activate/Deactivate | Existing shop available | Toggle shop active status | Shop status updates successfully | Not Run |
| QA-044 | Scoped Shop Visibility | Merchant and representative accounts exist | Compare visible shops across merchant, representative, and admin | Each role only sees shops in its intended scope | Not Run |
| QA-045 | Internal User Create | Admin or representative logged in | Create allowed managed/internal user from current UI | User is created successfully with valid role restrictions | Not Run |
| QA-046 | User Status UI | Admin has users in multiple states | Open user management lists | Active/inactive/deleted users display correct status and actions | Not Run |
| QA-047 | Representative Report | Representative has transactional data | Open representative dashboard/report area | Summary metrics load correctly for representative scope | Not Run |
| QA-048 | Admin Report | Admin has transactional data | Open admin dashboard/report area | Global summary metrics load correctly | Not Run |
| QA-049 | Monthly Reporting Metrics | Transactions exist in current month | Verify monthly issued and monthly spent values | Monthly report values match current-month transaction data | Not Run |
| QA-050 | Top Shops Reporting | Multiple shops have transactions | Verify top shops list in reports | Top shops are ordered and displayed correctly | Not Run |
| QA-051 | Configuration Load | Admin logged in | Open configuration tab | Current configuration values load into form correctly | Not Run |
| QA-052 | Configuration Save | Admin logged in | Update welcome bonus, expiration days, max points, discount cap, and save | Configuration saves successfully and latest values reload | Not Run |
| QA-053 | Configuration History | At least one configuration change saved | Open configuration history | New version entry appears with saved values and optional change reason | Not Run |
| QA-054 | Config Fallback In Preview | Admin updated default max discount percent | Run settlement preview without category override | Preview uses the updated default discount rule | Not Run |
| QA-055 | Language Toggle | App supports English and Italian | Switch language and revisit updated flows | New labels/messages for categories, preview, configuration, and actions are translated | Not Run |
| QA-056 | Visual Regression | App builds and loads normally | Navigate all updated tabs and forms | Existing UI layout remains intact with no major visual breakage | Not Run |
| QA-057 | Error Handling | Backend returns validation or permission errors | Trigger invalid submissions in multiple modules | Clear error message is shown and app remains stable | Not Run |

## Known Remaining Gap

The following area is still a known scope gap and should not be marked as failed unless separately implemented:

- Transaction history pagination / large-history paging behavior

Current history testing should validate correctness of displayed data, filters, and updates, not pagination.
