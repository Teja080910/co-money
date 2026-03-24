# Existing App Production Requirements

## 1. Purpose

This document converts the packaged application in `existing-app/` into a production-oriented requirements specification for rebuild, migration, or feature-parity implementation.

This is **not source-authoritative documentation**. The folder contains a compiled mobile app bundle, not the original Flutter repository. Every requirement in this document is tagged as:

- `Verified`: directly evidenced from packaged files, binary strings, manifests, assets, or embedded metadata.
- `Inferred`: highly likely based on compiled artifacts and naming, but not provable line-by-line without the original source.
- `Open Question`: important detail that should be confirmed with product or source access before implementation is finalized.

## 2. Source Evidence Reviewed

The requirements below were reconstructed from:

- `existing-app/PROJECT_DOCUMENTATION.md`
- `existing-app/lib/arm64-v8a/libapp.so`
- `existing-app/AndroidManifest.xml`
- `existing-app/Payload/Runner.app/Info.plist`
- `existing-app/Payload/Runner.app/AppFrameworkInfo.plist`
- `existing-app/Payload/Runner.app/embedded.mobileprovision`
- `existing-app/assets/flutter_assets/AssetManifest.json`
- packaged libraries, plugin names, and readable strings from Android/iOS binaries

## 3. Product Summary

### 3.1 Product Identity

- `Verified`: App display name is `Rapresentante Commercianti`.
- `Verified`: Android package identifier is `com.example.rapresentante_commercianti`.
- `Verified`: iOS bundle identifier is `com.rapresentante.commercianti`.
- `Verified`: Flutter is the application framework.
- `Verified`: The app targets both Android and iOS.
- `Verified`: Embedded production API base URL is `https://co-money.it/api/v1`.

### 3.2 Product Intent

- `Verified`: The app contains role-specific screens and routes for customer, merchant, representative, and central admin users.
- `Inferred`: The app is a loyalty and local-commerce platform built around points or wallet value, QR-based customer identification, merchant-led earning/redemption, promotions, events, and zone or network reporting.

### 3.3 Production Objective

The rebuilt or migrated application must support:

- secure authentication and session persistence
- role-based dashboard routing
- customer wallet and transaction history
- merchant customer verification and transaction execution
- promotion creation and viewing
- representative event management
- central admin oversight, user management, and system configuration
- QR or barcode-based customer scan workflows

## 4. Confirmed Technology Characteristics

### 4.1 Mobile Stack

- `Verified`: Flutter application structure.
- `Verified`: Likely provider-based state management through references to:
  - `providers/auth_provider.dart`
  - `providers/wallet_provider.dart`
- `Verified`: Service-based API access through references to:
  - `services/api_service.dart`
  - `services/auth_service.dart`
  - `services/wallet_service.dart`

### 4.2 Packaged Plugins and Native Dependencies

- `Verified`: `mobile_scanner`
- `Verified`: ML Kit barcode scanning
- `Verified`: `flutter_secure_storage`
- `Verified`: `shared_preferences`
- `Verified`: `path_provider`
- `Verified`: Google transport libraries and related runtime dependencies

### 4.3 Assets and Branding

- `Verified`: `assets/images/background.png`
- `Verified`: `assets/images/logo.png`
- `Inferred`: login and dashboard screens use branded art rather than plain system styling.

### 4.4 Localization

- `Verified`: Italian is the primary interface language.
- `Verified`: Screen names and UI copy are largely Italian.
- `Inferred`: Production rollout was designed primarily for an Italian regional market.

## 5. Roles and Permissions

### 5.1 Customer

- `Verified`: Customer-specific screens exist for:
  - wallet
  - promotions
  - merchant list
  - QR code
  - transaction history
- `Verified`: Binary strings include:
  - `/home-cliente`
  - `PromozioniClienteScreen`
  - `WalletItalianTheme`
  - `Storico Transazioni`
- `Inferred`: Customers can view balance, show their QR code to merchants, review transactions, browse active promotions, and inspect merchants in the network.

### 5.2 Merchant

- `Verified`: Merchant-specific screens exist for:
  - dashboard
  - assign points
  - accept points
  - QR scanner
  - promotions
  - category settings
  - unified transaction flow
- `Verified`: Binary strings include:
  - `/esercente/dashboard`
  - `/esercente/verifica-cliente`
  - `/esercente/assegna-punti`
  - `/esercente/accetta-punti`
  - `/transazione/unificata`
  - `/transazione/anteprima`
- `Inferred`: Merchants can verify a customer, scan a QR code, assign points, redeem points, and use a combined earn-plus-discount flow.

### 5.3 Representative

- `Verified`: Representative-specific screens exist for:
  - dashboard
  - create event
  - manage events
- `Verified`: Binary strings include:
  - `/rappresentante/dashboard`
  - `/dashboard-rappresentante`
  - `/rappresentante/eventi`
- `Inferred`: Representatives manage a merchant zone or territory and monitor local performance.

### 5.4 Central Admin

- `Verified`: Central/admin screens exist for:
  - dashboard
  - user management
  - representative creation
  - configuration settings
- `Verified`: Binary strings include:
  - `/centrale/dashboard`
  - `/dashboard-centrale`
  - `/centrale/utenti`
  - `/centrale/crea-rappresentante`
  - `/centrale/configurazioni`
  - `centraleAttivaUtente`
  - `centraleDisattivaUtente`
  - `centraleEliminaUtente`
- `Inferred`: Admin users oversee all roles, configure core points-system parameters, and manage network users.

## 6. Reconstructed Functional Scope

### 6.1 Authentication and Session

- `Verified`: The app includes:
  - login
  - registration
  - OTP verification
  - OTP resend
  - profile fetch
  - logout
- `Verified`: Binary routes include:
  - `/auth/login`
  - `/auth/registrazione`
  - `/auth/verifica-otp`
  - `/auth/reinvia-otp`
  - `/auth/profilo`
  - `/auth/logout`
  - `/v1/auth/check-username`
- `Verified`: Strings include:
  - `Codice OTP`
  - `Inserisci il codice OTP`
  - `OTP non valido`
  - `Codice OTP reinviato alla tua email`
  - `Verifica la tua email`
  - `Registrazione completata con successo!`
- `Verified`: Token storage evidence includes string `auth_token`.
- `Inferred`: Login likely accepts username or email and persists a bearer token.

#### Production requirements

- implement login, registration, OTP verification, OTP resend, session restore, and logout
- persist session secrets securely using platform-secure storage
- support username availability checking during registration
- require verified email before granting full access
- block expired or invalid sessions and redirect to login

### 6.2 Customer Wallet and History

- `Verified`: Screen names and model references indicate:
  - `wallet.dart`
  - `transazione.dart`
  - `wallet_provider.dart`
  - customer wallet screen
  - transaction history screen
- `Verified`: API route includes `/wallet/transazioni`
- `Verified`: Strings include:
  - `Saldo`
  - `Saldo totale`
  - `Nessuna transazione`
  - `Errore caricamento wallet`
  - `Errore caricamento transazioni`
- `Inferred`: The customer wallet shows total balance and transaction records; the transaction history likely includes earned, spent, and bonus-related entries.

#### Production requirements

- show current wallet balance and derived totals reliably
- list transactions with timestamps, types, amount or points, and resulting balance
- handle empty, loading, refresh, and error states
- support pagination or at minimum efficient incremental loading for large histories

### 6.3 Customer QR Code

- `Verified`: `screens/cliente/qr_code_screen.dart`
- `Verified`: strings include:
  - `Mostra questo codice all'esercente`
  - QR-related package references
- `Inferred`: Customer QR encodes customer identity or session-safe lookup value for merchant scanning.

#### Production requirements

- generate a merchant-readable QR code for the authenticated customer
- ensure QR payload is secure against trivial forgery
- support refresh or short-lived encoding if QR carries sensitive claims
- provide offline rendering once authenticated session is present

### 6.4 Merchant Customer Verification and Scanning

- `Verified`: merchant scan flow includes:
  - `scanner_qr_screen.dart`
  - `Scansiona cliente`
  - `Inquadra il QR code del cliente`
  - `Inserisci ID cliente`
  - `Verifica prima il cliente`
  - `/esercente/verifica-cliente`
- `Inferred`: Merchant can verify a customer by QR scan and possibly by manual ID fallback.

#### Production requirements

- allow merchant to scan customer QR code
- provide manual customer lookup fallback when scanning is unavailable
- show verified customer identity before any wallet-impacting action
- prevent transaction submission before successful verification

### 6.5 Merchant Assign Points

- `Verified`: merchant screen `assegna_punti_screen.dart`
- `Verified`: route `/esercente/assegna-punti`
- `Verified`: strings include:
  - `Assegna Punti/Moneta`
  - `Nuovi punti cliente`
  - `Nuovo saldo cliente`
  - `Inserisci punti`
- `Inferred`: Merchant can award points directly to a verified customer.

#### Production requirements

- allow a merchant to assign points to a verified customer
- record balance before and after the operation
- show success feedback including newly granted points and updated balance
- validate point amount and prevent invalid submissions
- audit who performed the operation and from which merchant account

### 6.6 Merchant Accept or Redeem Points

- `Verified`: merchant screen `accetta_punti_screen.dart`
- `Verified`: route `/esercente/accetta-punti`
- `Verified`: strings include:
  - `Accetta Pagamento in Punti/Moneta`
  - `Punti da Accettare`
  - `Acquisto con punti...`
  - `punti_disponibili_cliente`
  - `punti_spendibili_qui`
  - `Il cliente può spendere punti solo se NON li ha guadagnati qui`
- `Inferred`: Spendability is constrained by source-of-points rules, likely to prevent merchants from immediately redeeming points issued by themselves.

#### Production requirements

- allow merchant to redeem points from a verified customer
- enforce spendability rules based on origin or category of points
- calculate and show how many points are usable at the current merchant
- update the customer balance atomically
- record the redemption transaction with all calculation inputs and outputs

### 6.7 Unified Transaction Flow

- `Verified`: `transazione_unificata_screen.dart`
- `Verified`: routes include:
  - `/transazione/unificata`
  - `/transazione/anteprima`
- `Verified`: strings include:
  - `Sconta + Genera punti in un'unica transazione`
  - `Vendibile in Punti/Moneta`
  - `sconto_applicato`
  - `nuovi_punti_generati`
  - `sconto_max_applicabile`
  - `sconto_max_percentuale`
- `Inferred`: The app includes a combined checkout flow where a purchase can redeem points, apply a capped discount, and generate new points in the same transaction.

#### Production requirements

- support previewing a transaction before commit
- calculate discount, maximum applicable discount, payable amount, and new points generated
- return a post-transaction updated balance
- log the transaction as a single business action even if multiple ledger events are created

### 6.8 Merchant Categories and Discount Rules

- `Verified`: `impostazioni_categorie_screen.dart`
- `Verified`: strings include:
  - `Aggiungi Categoria`
  - `Categoria generale (default)`
  - `Percentuali per Categoria`
  - `Sconti per Categoria`
  - `Questi sconti appariranno di default quando aggiungi una categoria nella transazione`
  - `categoria`
  - `categoria_formattata`
  - `sconto_percentuale`
- `Inferred`: Merchants can define discount percentages by product or transaction category, used during transaction preview and checkout.

#### Production requirements

- provide merchant category management
- allow per-category discount percentage configuration
- support a default fallback category
- apply configured category rules consistently inside transaction preview and settlement

### 6.9 Promotions

- `Verified`: customer promotions screen and merchant promotions screen both exist
- `Verified`: strings include:
  - `Promozioni Attive`
  - `Le Mie Promozioni`
  - `Nuova Promozione`
  - `Crea Promozione`
  - `bonus_punti`
  - `Doppio sconto per nuovi clienti!`
- `Inferred`: Merchants create promotions; customers browse currently active promotions.
- `Open Question`: whether promotions are informational only, claimable, or automatically applied during checkout is not fully reconstructable from the bundle alone.

#### Production requirements

- allow merchants to create, edit, list, activate, and deactivate promotions
- show customers only promotions they are allowed to see
- include title, description, validity window, reward, and discount details
- define exact promotion application mechanics before release

### 6.10 Events

- `Verified`: representative event screens exist:
  - `crea_evento_screen.dart`
  - `gestione_eventi_screen.dart`
- `Verified`: strings include:
  - `Crea Evento`
  - `Titolo Evento`
  - `Nessun evento creato`
  - `Crea Primo Evento`
- `Inferred`: Representatives create and manage community, merchant-network, or promotional events.

#### Production requirements

- allow representative users to create and edit events
- support event title, description, date or time, and possibly location
- show existing and upcoming events
- define whether events award points automatically or are informational only

### 6.11 Representative Dashboard

- `Verified`: strings include:
  - `Dashboard Zona`
  - `Top Zone per Circolazione Punti`
  - `/rappresentante/dashboard`
- `Inferred`: Representative dashboard aggregates regional or zone metrics across merchants.

#### Production requirements

- show zone-level KPIs
- identify top-performing areas or merchants
- summarize point circulation and transaction activity
- define exact filters by time window and geography

### 6.12 Central Dashboard

- `Verified`: strings include:
  - `Dashboard Centrale`
  - `Punti Totali in Circolazione`
  - `Punti emessi`
  - `Punti spesi`
  - `Punti incassati`
  - `Punti emessi (mese)`
  - `Punti spesi (mese)`
- `Inferred`: Central dashboard is a network-wide reporting surface for system health and commercial performance.

#### Production requirements

- show network-wide KPIs
- support total and monthly metrics
- support breakdowns by geography or zone where available
- ensure numbers reconcile against underlying wallet and transaction ledgers

### 6.13 Central User Management

- `Verified`: user-management routes and actions exist for:
  - list users
  - activate user
  - deactivate user
  - delete user
  - create representative
- `Verified`: strings include:
  - `Utente attivato`
  - `Utente disattivato`
  - `Sei sicuro di voler eliminare definitivamente`
- `Inferred`: Admin can manage account lifecycle for at least representatives and possibly merchants or customers.

#### Production requirements

- allow admins to list users by role and status
- activate and deactivate accounts without deleting historical transactions
- support controlled deletion rules with audit trail
- support representative creation with role-specific onboarding

### 6.14 Central System Configuration

- `Verified`: `configurazioni_screen.dart`
- `Verified`: strings include:
  - `Regole Sistema Punti`
  - `Bonus Benvenuto (punti)`
  - `Scadenza Punti (giorni)`
  - `Dopo quanti giorni i punti scadono`
  - `limite_max_punti_transazione`
  - `punti_assegnati`
- `Inferred`: System administrators control core points economy settings.

#### Production requirements

- define and persist global system configuration
- support at minimum:
  - welcome bonus points
  - point-expiration days
  - maximum points per transaction
  - default or configurable discount limits
- version configuration changes and record who changed them
- ensure changes do not silently corrupt historical transaction semantics

  ## 7. Reconstructed Screen Inventory

### 7.1 Verified screen paths

- `screens/auth/login_screen_italian.dart`
- `screens/auth/registrazione_screen.dart`
- `screens/auth/verifica_otp_screen.dart`
- `screens/cliente/lista_esercenti_screen.dart`
- `screens/cliente/promozioni_cliente_screen.dart`
- `screens/cliente/qr_code_screen.dart`
- `screens/cliente/storico_transazioni_screen.dart`
- `screens/cliente/wallet_italian_theme.dart`
- `screens/esercente/accetta_punti_screen.dart`
- `screens/esercente/assegna_punti_screen.dart`
- `screens/esercente/home_esercente.dart`
- `screens/esercente/impostazioni_categorie_screen.dart`
- `screens/esercente/promozioni_screen.dart`
- `screens/esercente/scanner_qr_screen.dart`
- `screens/esercente/transazione_unificata_screen.dart`
- `screens/rappresentante/crea_evento_screen.dart`
- `screens/rappresentante/dashboard_rappresentante.dart`
- `screens/rappresentante/gestione_eventi_screen.dart`
- `screens/centrale/configurazioni_screen.dart`
- `screens/centrale/crea_rappresentante_screen.dart`
- `screens/centrale/dashboard_centrale.dart`
- `screens/centrale/gestione_utenti_screen.dart`

### 7.2 Production screen requirements

Each rebuilt screen should provide:

- authenticated access control
- loading and error states
- empty-state design
- localized labels and messages
- accessibility support
- analytics events for key business actions
- resilient network retry behavior for non-destructive reads

## 8. Reconstructed API Surface

### 8.1 Verified route fragments found

- `/auth/login`
- `/auth/registrazione`
- `/auth/verifica-otp`
- `/auth/reinvia-otp`
- `/auth/profilo`
- `/auth/logout`
- `/v1/auth/check-username`
- `/wallet/transazioni`
- `/esercente/dashboard`
- `/esercente/lista-zona`
- `/esercente/verifica-cliente`
- `/esercente/assegna-punti`
- `/esercente/accetta-punti`
- `/transazione/unificata`
- `/transazione/anteprima`
- `/rappresentante/dashboard`
- `/rappresentante/eventi`
- `/centrale/dashboard`
- `/centrale/utenti`
- `/centrale/crea-rappresentante`
- `/centrale/configurazioni`
- `/attiva`
- `/disattiva`

### 8.2 API requirements

The production API must:

- enforce authentication and role authorization at the backend
- return stable, versioned contracts
- use consistent error structures
- capture traceability and audit context for all wallet-changing operations
- ensure atomicity for balance-changing actions
- provide idempotency protection where duplicate submissions are possible

### 8.3 Open API contract items

- `Open Question`: exact request and response schemas are not recoverable from the bundle.
- `Open Question`: whether point values are integer-only, money-only, or a hybrid “points/moneta” unit at every layer.
- `Open Question`: whether promotions, events, and category settings are merchant-scoped, representative-scoped, or partially global.

## 9. Domain Model Reconstruction

### 9.1 Confirmed domain entities

- `Verified`: User
- `Verified`: Wallet
- `Verified`: Transaction
- `Verified`: Promotion
- `Verified`: Event
- `Verified`: Category or category settings
- `Verified`: System configuration

### 9.2 Inferred entity fields

#### User

- id
- role
- username
- email
- verification state
- active or disabled state
- zone or merchant association

#### Wallet

- customer id
- total balance
- available spendable balance
- possibly merchant-eligible balance at current merchant

#### Transaction

- id
- customer id
- merchant id
- type
- points in or out
- balance before
- balance after
- discount applied
- generated points
- category
- created at
- operator or actor

#### Promotion

- title
- description
- active status
- bonus points
- discount parameters
- validity window
- owner or merchant association

#### Event

- title
- description
- date range
- creator
- zone or merchant association

#### Configuration

- welcome bonus points
- point expiry days
- max points per transaction
- max discount percentage or cap
- category defaults

## 10. Business Rules Reconstructed

### 10.1 Verified or strongly evidenced

- customers must verify email through OTP before full usage
- merchants must verify a customer before running a points action
- there is a limit on points or discount application per transaction
- there is a welcome bonus concept
- there is a point-expiration concept
- there are category-based discount percentages
- merchants appear to be restricted from accepting points that were earned at the same merchant

### 10.2 Rules that must be clarified before production launch

- exact unit model of “Punti/Moneta”
- exact promotion application mechanics
- whether points expire lazily or by scheduled job
- whether welcome bonus is registration-based, first-transaction-based, or event-based
- whether customers can transfer points
- whether representatives can create promotions or only events

## 11. Security Requirements

### 11.1 Verified security-related evidence

- `Verified`: token persistence likely uses `flutter_secure_storage`
- `Verified`: auth token string exists in binary
- `Verified`: role-based route separation is present
- `Verified`: iOS production signing profile is non-debug (`get-task-allow = false`)

### 11.2 Production security requirements

- store tokens and secrets only in secure platform storage
- use TLS for all API communication
- never trust role claims purely from the client
- require backend authorization for every role-sensitive endpoint
- protect wallet-changing operations with atomic server-side validation
- log sensitive administrative operations with actor identity and timestamp
- sanitize all user-generated text rendered in admin dashboards or notifications
- enforce session expiration and revocation semantics
- rate-limit auth, OTP, customer verification, and transaction endpoints

### 11.3 Packaging and permission gaps

- `Verified`: Android build includes camera, internet, and network-state permissions.
- `Verified`: iOS metadata reviewed from the packaged app does not show `NSCameraUsageDescription`.
- `Inferred`: If the iOS artifact truly lacks camera usage messaging, the scanning feature is not production-safe on iOS and may fail App Store review or runtime permission prompts.

## 12. Reliability and Data Integrity Requirements

- wallet balance changes must be transactional and auditable
- no client-side only calculation may be treated as final financial truth
- transaction preview and final settlement must reconcile exactly
- duplicate submissions must not create duplicate balance updates
- user deactivation must preserve ledger history
- soft-delete should be preferred for business records unless legal deletion is required

## 13. Performance Requirements

- dashboard loads should be optimized for mobile latency
- QR scan verification should complete fast enough for live checkout use
- transaction history should support large datasets without rendering stalls
- dashboard metrics should use aggregated queries or precomputed summaries if volumes grow

## 14. Observability Requirements

- capture structured server logs for auth, wallet, transaction, promotion, event, and admin flows
- define business metrics for:
  - registrations
  - OTP completion
  - active customers
  - points issued
  - points redeemed
  - promotions created
  - events created
  - merchant transaction success rate
- add error monitoring for scan failures, settlement failures, and configuration-update failures

## 15. Accessibility and UX Requirements

- support readable text scaling
- ensure scan screens provide fallback manual entry
- provide clear success and error feedback after every wallet action
- preserve customer privacy when wallet details are shown to merchants
- maintain Italian-first localization and design for future multilingual expansion

## 16. Release Engineering Requirements

### 16.1 Verified packaging facts

- `Verified`: Android package id currently appears to be a default-style identifier.
- `Verified`: iOS bundle id is production-like and store-signed.
- `Verified`: iOS minimum version is `13.0`.
- `Verified`: app version is `1.0.0`.

### 16.2 Production release requirements

- normalize Android and iOS identifiers under the same release namespace
- define separate dev, staging, and production environments
- externalize API base URLs per environment
- maintain signing, provisioning, and release notes in source control or secure CI configuration
- verify all platform permissions and privacy declarations before store submission

## 17. Testing Requirements

The rebuilt application should not be released without:

- unit tests for auth, wallet, transaction calculations, and role guards
- integration tests for:
  - login plus OTP
  - wallet retrieval
  - customer verification
  - assign points
  - accept points
  - unified transaction preview and commit
  - promotions and events CRUD
  - admin user activation and deactivation
- end-to-end mobile tests for critical role journeys
- regression tests for configuration changes affecting transaction math

## 18. Migration and Rebuild Guidance

### 18.1 Recommended implementation priorities

1. Authentication and role routing
2. Core wallet ledger and transaction engine
3. Merchant verification and QR scanning
4. Customer wallet, QR, and history
5. Merchant promotions and category settings
6. Representative events and dashboard
7. Central dashboard, user management, and configuration

### 18.2 Migration strategy

- `Recommended`: treat the compiled app as a feature-discovery artifact, not as a direct codebase migration source.
- `Recommended`: rebuild from explicit backend contracts and product-approved business rules.
- `Recommended`: validate every inferred rule with stakeholders before marking parity complete.

## 19. Risks

- only compiled artifacts are available, so some requirements remain inferred
- Android and iOS packaging identifiers are inconsistent
- camera permission metadata appears incomplete on iOS
- exact data schemas and server-side business rules cannot be fully recovered from binaries
- any rebuild that copies visible behavior without confirming hidden backend rules may reproduce incorrect logic

## 20. Open Questions That Must Be Answered Before Final Production Sign-Off

1. What is the exact semantic model of `Punti/Moneta`?
2. How are spendable points calculated for a merchant, especially when points were earned at the same merchant?
3. Are promotions informational, claimable, or auto-applied?
4. What exact event fields and event-to-wallet interactions exist?
5. Which roles can create promotions, events, users, and settings?
6. What is the exact customer identifier format encoded in QR?
7. What are the OTP expiration, retry, and rate-limit rules?
8. What are the point-expiration execution rules?
9. What is the deletion policy for users and business records?
10. Which dashboard metrics are authoritative and how are they calculated?

## 21. Production Definition Of Done

The rebuilt application should be considered production-ready only when:

- all verified features are implemented
- all inferred business rules are explicitly confirmed or replaced by approved requirements
- role-based access is enforced server-side
- wallet and transaction calculations are audited and tested
- mobile permissions and privacy metadata are complete for both platforms
- environment separation and release signing are standardized
- monitoring, logging, and support playbooks are in place

## 22. Executive Recommendation

The packaged app provides enough evidence to define a strong product brief and implementation roadmap, but **not enough to safely clone every business rule without stakeholder confirmation**. The correct production approach is to use this document as a reverse-engineered baseline, confirm every open rule with product or backend owners, and then implement against explicit contracts rather than guessing from the compiled bundle.
