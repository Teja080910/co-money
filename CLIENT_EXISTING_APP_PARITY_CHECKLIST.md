# Client Existing-App Parity Checklist

This checklist compares the current React Native client in `client/` against the reconstructed behavior and requirements documented from `existing-app/`.

Status meanings:

- `Present`: implemented in the current client with visible UI and wiring
- `Partial`: some parity exists, but behavior, UX, or coverage is incomplete
- `Missing/Risk`: not implemented, not provable from the client, or implemented in a weaker way than the legacy requirement

## Customer

| Legacy requirement | Status | Current client evidence | Next action |
| --- | --- | --- | --- |
| Wallet screen | Present | [WalletTab](./client/src/components/home-tabs/WalletTab.tsx) shows wallet balance and points breakdown. | Keep aligned with backend wallet contract. |
| Transaction history | Present | [TransactionsTab](./client/src/components/home-tabs/TransactionsTab.tsx) shows transaction list, filters, pagination, balance before/after, and settlement details. | Validate legacy field parity with backend responses. |
| Customer QR code screen | Present | [CustomerQrScreen](./client/src/screens/CustomerQrScreen.tsx) loads `/api/wallet/qr-code`, renders QR, expiry, and wallet id. | Confirm QR payload semantics and expiry rules against backend. |
| Merchant/shop directory | Present | [ShopDirectorySection](./client/src/components/home-tabs/ManagementSections.tsx) lists shops with pagination. | Confirm filtering matches legacy merchant-list expectations. |
| Promotions browse | Present | [PromotionsSection](./client/src/components/home-tabs/ManagementSections.tsx) renders customer-facing promotions. | Verify customer visibility rules are enforced server-side. |
| Promotion claim flow | Present | [handleClaimPromotion](./client/src/screens/HomeScreen.tsx) posts to `/api/promotions/:id/claim`. | Confirm this is intended product behavior, since legacy app only inferred claimability. |
| Offline QR rendering after auth | Present | [CustomerQrScreen](./client/src/screens/CustomerQrScreen.tsx) caches the last valid QR payload and shows it when a live refresh fails. | Keep QR expiry semantics aligned with backend validation rules. |
| Secure token storage | Present | [auth.ts](./client/src/services/auth.ts), [api.ts](./client/src/services/api.ts), and [secureSessionStorage.ts](./client/src/services/secureSessionStorage.ts) store auth session data in `SecureStore` with migration from legacy `AsyncStorage`. | Verify secure-storage migration on physical devices before release. |

## Merchant

| Legacy requirement | Status | Current client evidence | Next action |
| --- | --- | --- | --- |
| Merchant dashboard/home | Present | Merchant tabs are defined in [homeTabConfig](./client/src/navigation/homeTabConfig.ts) and merchant overview is rendered in [HomeOverviewTab](./client/src/components/home-tabs/HomeOverviewTab.tsx). | Keep dashboard metrics aligned with legacy expectations. |
| QR scan customer verification | Present | [MerchantScanScreen](./client/src/screens/MerchantScanScreen.tsx) scans QR and posts to `/api/wallet/scan-customer`. | Confirm backend verification semantics match legacy `/esercente/verifica-cliente`. |
| Manual customer lookup fallback | Present | [MerchantScanScreen](./client/src/screens/MerchantScanScreen.tsx) supports manual lookup by name/username/email using the existing customer search API. | Keep this fallback fast and available for checkout resilience. |
| Verified customer handoff into transaction flow | Present | `selectedCustomerId` is passed via navigation in [MerchantScanScreen](./client/src/screens/MerchantScanScreen.tsx) and consumed in [HomeScreen](./client/src/screens/HomeScreen.tsx). | Keep this flow as the primary merchant verification handoff. |
| Customer list and wallet lookup | Present | [CustomersTab](./client/src/components/home-tabs/CustomersTab.tsx) selects a customer and shows wallet breakdown. | Confirm wallet payload contains all legacy merchant-visible balance fields. |
| Assign points | Present | [handleAddPoints](./client/src/screens/HomeScreen.tsx) posts to `/api/wallet/earn`. | Confirm response/audit data covers legacy before/after expectations. |
| Redeem or accept points | Present | [handleSpendPoints](./client/src/screens/HomeScreen.tsx) posts to `/api/wallet/spend`. | Confirm backend enforces spendability rules. |
| Unified transaction preview | Present | [handlePreviewSettlement](./client/src/screens/HomeScreen.tsx) posts to `/api/wallet/preview`; preview UI is in [AddPointsTab](./client/src/components/home-tabs/AddPointsTab.tsx). | Verify preview and commit reconciliation with backend tests. |
| Merchant category management | Present | [CategorySettingsSection](./client/src/components/home-tabs/ManagementSections.tsx) and related handlers in [HomeScreen](./client/src/screens/HomeScreen.tsx) support create/edit/activate/delete/default. | Confirm category discount rules match legacy transaction math. |
| Merchant promotions CRUD | Present | [PromotionsSection](./client/src/components/home-tabs/ManagementSections.tsx) plus promotion handlers in [HomeScreen](./client/src/screens/HomeScreen.tsx). | Confirm promotion application mechanics with product/backend. |
| Separate assign / accept / unified screens | Partial | Current UI consolidates these into [AddPointsTab](./client/src/components/home-tabs/AddPointsTab.tsx) instead of separate screens. | Decide whether feature parity requires screen-level matching or only behavior parity. |
| Dedicated server-side customer verification flow | Present | [MerchantScanScreen](./client/src/screens/MerchantScanScreen.tsx) sends `search`, `page`, and `pageSize` to `/api/users/customers` instead of fetching and filtering the full list client-side. | Keep result limits and search matching aligned with merchant checkout needs. |
| Explicit spendable-at-this-merchant balance UI | Present | [AddPointsTab](./client/src/components/home-tabs/AddPointsTab.tsx) surfaces the preview `availablePoints` returned by the backend settlement preview. | Keep the preview contract aligned with backend spendability rules. |
| Visible enforcement messaging for same-merchant-earned-points rule | Present | [AddPointsTab](./client/src/components/home-tabs/AddPointsTab.tsx) explains the same-shop restriction in the spend helper copy and pairs it with the explicit spendable balance preview. | Preserve this messaging when transaction copy evolves. |
| Explicit new balance success feedback after earn | Present | [handleAddPoints](./client/src/screens/HomeScreen.tsx) now uses the `/api/wallet/earn` response balance in the success message. | Keep the success copy aligned with backend earn response fields. |

## Representative

| Legacy requirement | Status | Current client evidence | Next action |
| --- | --- | --- | --- |
| Representative dashboard | Present | Representative overview is rendered in [HomeOverviewTab](./client/src/components/home-tabs/HomeOverviewTab.tsx) with aggregate KPIs. | Confirm KPI set matches legacy zone dashboard expectations. |
| Events create/edit/list | Present | [EventsSection](./client/src/components/home-tabs/ManagementSections.tsx) and event handlers in [HomeScreen](./client/src/screens/HomeScreen.tsx). | Confirm representative-only permissions server-side. |
| Merchant management/listing | Present | [RepresentativeUserManagementSection](./client/src/components/home-tabs/ManagementSections.tsx) shows merchant directory. | Confirm lifecycle actions intended for representative role. |
| Customer directory/listing | Present | [RepresentativeUserManagementSection](./client/src/components/home-tabs/ManagementSections.tsx) shows customer directory. | Confirm this matches legacy scope. |
| Internal user creation for merchant/customer | Present | [InternalUserManagementSection](./client/src/components/home-tabs/ManagementSections.tsx) plus [handleCreateInternalUser](./client/src/screens/HomeScreen.tsx). | Verify allowed roles remain limited to representative permissions. |
| Rich zone leaderboard / top-area reporting | Present | Representatives now have a reachable `reports` tab via [homeTabConfig](./client/src/navigation/homeTabConfig.ts), and ranked shop reporting is shown in [ReportsTab](./client/src/components/home-tabs/ReportsTab.tsx). | Keep report ranking scoped correctly to representative-owned shops. |
| Role constraints around promotions | Missing/Risk | Non-customer roles can edit promotions through [PromotionsSection](./client/src/components/home-tabs/ManagementSections.tsx). | Confirm whether representatives should manage promotions or only events. |

## Admin / Centrale

| Legacy requirement | Status | Current client evidence | Next action |
| --- | --- | --- | --- |
| Central dashboard | Present | Admin overview is rendered in [HomeOverviewTab](./client/src/components/home-tabs/HomeOverviewTab.tsx) with summary metrics and report snapshot. | Confirm metric set against legacy dashboard copy. |
| User management by role | Present | [AdminUserManagementSection](./client/src/components/home-tabs/ManagementSections.tsx) renders representative, merchant, and customer directories. | Keep list filters/statuses aligned with backend contract. |
| Activate user | Present | [handleActivateUser](./client/src/screens/HomeScreen.tsx) posts to `/api/users/:id/activate`. | Verify audit trail is server-side complete. |
| Deactivate user | Present | [handleDeactivateUser](./client/src/screens/HomeScreen.tsx) posts to `/api/users/:id/deactivate`. | Verify ledger preservation behavior server-side. |
| Delete user | Present | [handleDeleteUser](./client/src/screens/HomeScreen.tsx) posts to `/api/users/:id/delete`. | Confirm whether this is soft delete and rename UI if needed. |
| Representative creation | Present | Generic internal user creation supports representative role in [handleCreateInternalUser](./client/src/screens/HomeScreen.tsx). | Decide whether a dedicated create-representative screen is still wanted. |
| System configuration form | Present | [SystemConfigurationSection](./client/src/components/home-tabs/ManagementSections.tsx) exposes welcome bonus, expiry, max points, and default max discount. | Keep field names and semantics aligned with backend rules. |
| Configuration history/versioning | Present | History list is shown in [SystemConfigurationSection](./client/src/components/home-tabs/ManagementSections.tsx) and loaded in [HomeScreen](./client/src/screens/HomeScreen.tsx). | Confirm versioning semantics and edit/delete permissions. |
| Distinct central metric for points cashed in | Present | [HomeOverviewTab](./client/src/components/home-tabs/HomeOverviewTab.tsx) and [ReportsTab](./client/src/components/home-tabs/ReportsTab.tsx) now surface an explicit `cashed in` metric for central reporting. | Keep naming aligned with product copy in Italian production builds. |
| Dedicated create-representative UX | Partial | The behavior exists through a generic user form, not a dedicated central screen. | Decide whether UX parity requires a dedicated representative onboarding screen. |

## Cross-Cutting Requirements

| Legacy requirement | Status | Current client evidence | Next action |
| --- | --- | --- | --- |
| Auth, registration, OTP, session restore, logout | Present | [App.tsx](./client/App.tsx), [LoginScreen](./client/src/screens/LoginScreen.tsx), [RegisterScreen](./client/src/screens/RegisterScreen.tsx), and [VerifyEmailScreen](./client/src/screens/VerifyEmailScreen.tsx). | Keep backend error mapping and redirect behavior aligned. |
| Role-based routing | Present | Root tabs and screen routing are defined in [homeTabConfig](./client/src/navigation/homeTabConfig.ts) and [HomeScreen](./client/src/screens/HomeScreen.tsx). | Add coverage tests for role visibility. |
| Loading and empty states on major screens | Present | Present across wallet, transactions, customers, shops, promotions, events, and configuration sections. | Maintain consistency as new screens are added. |
| Manual fallback on scan screens | Present | [MerchantScanScreen](./client/src/screens/MerchantScanScreen.tsx) includes manual lookup. | Keep this mandatory for accessibility and checkout resilience. |
| Password change | Present | [ProfileTab](./client/src/components/home-tabs/ProfileTab.tsx) and [handleChangePassword](./client/src/screens/HomeScreen.tsx). | Confirm whether this was part of legacy parity or a modern addition. |
| Analytics events for business actions | Missing/Risk | No explicit client analytics hooks were found in the reviewed screens. | Add analytics instrumentation for scan, earn, spend, promotion, event, and admin flows. |
| Network retry behavior for non-destructive reads | Present | [api.ts](./client/src/services/api.ts) retries retryable `GET` failures once for timeout/offline conditions before surfacing an error. | Add screen-level retry affordances where UX needs a visible recovery action beyond the shared automatic retry. |
| Client-side evidence of privacy-safe merchant views | Partial | Merchant sees customer identity and wallet summary, but explicit privacy minimization rules are not visible in UI code. | Review what wallet/customer fields are shown during merchant operations. |
| Platform-secure token storage | Present | [auth.ts](./client/src/services/auth.ts), [api.ts](./client/src/services/api.ts), and [secureSessionStorage.ts](./client/src/services/secureSessionStorage.ts) use secure session storage with fallback only where secure storage is unavailable. | Validate storage behavior on every target platform in release builds. |

## Highest-Priority Follow-Ups

1. Decide whether representative promotion editing is intended or a parity drift from the legacy app.
2. Decide whether screen-level parity matters for merchant flows, or whether current consolidated UX is acceptable.
3. Add missing observability and analytics instrumentation for critical business actions.
4. Review privacy-safe field exposure during merchant verification and wallet flows.
5. Expand explicit retry/refresh affordances on individual screens where the shared automatic retry is not enough UX recovery.
