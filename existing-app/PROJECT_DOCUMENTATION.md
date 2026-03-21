# Existing App Project Documentation

## 1. Overview

This document describes the mobile project found at `existing-app/`.

Important context:
- This folder is **not the original Flutter source repository**.
- It is a **packaged build output / extracted mobile app bundle** containing Android and iOS artifacts.
- The details below are reconstructed from:
  - bundled Flutter assets
  - native manifests and plist metadata
  - embedded framework/plugin names
  - readable strings from the compiled Flutter binary

Because the original Dart source is not present, some items below are marked as **inferred** rather than directly verified from source code.

## 2. Project Identity

### Verified / strongly evidenced
- App display name: `Rapresentante Commercianti`
- App type: `Flutter mobile application`
- iOS bundle identifier: `com.rapresentante.commercianti`
- Android package identifier: `com.example.rapresentante_commercianti`
- App version: `1.0.0`
- Android version code: `15`
- iOS minimum OS version: `13.0`

### Likely business purpose
This app appears to be a **multi-role loyalty / rewards platform** for:
- customers
- merchants
- representatives
- central admins

The product seems focused on:
- wallet and points management
- merchant promotions
- event management
- QR / barcode-based customer scanning
- role-specific dashboards

## 3. Technology Stack

### Application framework
- Flutter

### Native platform targets
- Android
- iOS

### Android build evidence
- Kotlin Gradle plugin `1.8.22`
- Gradle build system metadata present
- Java/Kotlin compatibility target `11`

### Bundled Flutter plugins and libraries
The packaged app includes evidence of these Flutter/native integrations:
- `flutter_secure_storage`
- `shared_preferences`
- `path_provider`
- `mobile_scanner`
- Google ML Kit barcode scanning
- Firebase / Google transport components

### Inferred architectural style
The compiled strings indicate a fairly standard Flutter app structure:
- `config/`
- `models/`
- `providers/`
- `services/`
- `screens/`

This strongly suggests a **provider-based state management pattern** with service classes for API/auth/wallet concerns.

## 4. Reconstructed Source Structure

The following source paths were found inside the compiled Flutter binary:

```text
package:rapresentante_commercianti/config/api_config.dart
package:rapresentante_commercianti/config/theme.dart
package:rapresentante_commercianti/main.dart
package:rapresentante_commercianti/models/transazione.dart
package:rapresentante_commercianti/models/user.dart
package:rapresentante_commercianti/models/wallet.dart
package:rapresentante_commercianti/providers/auth_provider.dart
package:rapresentante_commercianti/providers/wallet_provider.dart
package:rapresentante_commercianti/screens/auth/login_screen_italian.dart
package:rapresentante_commercianti/screens/auth/registrazione_screen.dart
package:rapresentante_commercianti/screens/auth/verifica_otp_screen.dart
package:rapresentante_commercianti/screens/centrale/configurazioni_screen.dart
package:rapresentante_commercianti/screens/centrale/crea_rappresentante_screen.dart
package:rapresentante_commercianti/screens/centrale/dashboard_centrale.dart
package:rapresentante_commercianti/screens/centrale/gestione_utenti_screen.dart
package:rapresentante_commercianti/screens/cliente/lista_esercenti_screen.dart
package:rapresentante_commercianti/screens/cliente/promozioni_cliente_screen.dart
package:rapresentante_commercianti/screens/cliente/qr_code_screen.dart
package:rapresentante_commercianti/screens/cliente/storico_transazioni_screen.dart
package:rapresentante_commercianti/screens/cliente/wallet_italian_theme.dart
package:rapresentante_commercianti/screens/esercente/accetta_punti_screen.dart
package:rapresentante_commercianti/screens/esercente/assegna_punti_screen.dart
package:rapresentante_commercianti/screens/esercente/home_esercente.dart
package:rapresentante_commercianti/screens/esercente/impostazioni_categorie_screen.dart
package:rapresentante_commercianti/screens/esercente/promozioni_screen.dart
package:rapresentante_commercianti/screens/esercente/scanner_qr_screen.dart
package:rapresentante_commercianti/screens/esercente/transazione_unificata_screen.dart
package:rapresentante_commercianti/screens/rappresentante/crea_evento_screen.dart
package:rapresentante_commercianti/screens/rappresentante/dashboard_rappresentante.dart
package:rapresentante_commercianti/screens/rappresentante/gestione_eventi_screen.dart
package:rapresentante_commercianti/services/api_service.dart
package:rapresentante_commercianti/services/auth_service.dart
package:rapresentante_commercianti/services/wallet_service.dart
```

## 5. Functional Modules

### 5.1 Authentication
Strong evidence of a complete auth flow:
- login screen
- registration screen
- OTP verification screen
- logout
- resend OTP
- profile fetch

Relevant endpoints found in the binary:
- `/auth/login`
- `/auth/registrazione`
- `/auth/verifica-otp`
- `/auth/reinvia-otp`
- `/auth/profilo`
- `/auth/logout`

### 5.2 Customer Module
Customer-facing screens inferred from the app:
- wallet screen
- merchants list
- promotions list
- QR code screen
- transaction history

Likely customer capabilities:
- view available merchants
- check points balance
- display QR code for in-store scanning
- browse promotions
- inspect transaction history

### 5.3 Merchant Module
Merchant-facing screens found in the binary:
- merchant home
- assign points
- accept points
- QR scanner
- promotions management
- category settings
- unified transaction flow

Relevant endpoints found:
- `/esercente/dashboard`
- `/esercente/lista-zona`
- `/esercente/verifica-cliente`
- `/esercente/assegna-punti`
- `/esercente/accetta-punti`

Likely merchant capabilities:
- search or verify customer
- scan customer QR code
- assign reward points
- redeem / accept points
- manage merchant promotions

### 5.4 Representative Module
Representative-specific screens:
- representative dashboard
- create event
- manage events

Relevant endpoint found:
- `/rappresentante/dashboard`
- `/rappresentante/eventi`

Likely representative capabilities:
- monitor local network performance
- create and manage promotional or local events
- support merchant ecosystem operations

### 5.5 Central Admin Module
Admin/central office screens found:
- central dashboard
- user management
- representative creation
- configuration settings

Visible strings also suggest an admin role such as:
- `Admin Centrale`
- admin-only access copy

Likely admin capabilities:
- system oversight
- user and role management
- representative onboarding
- configuration and policy control

## 6. Data Model Indicators

The following model classes were found:
- `user.dart`
- `wallet.dart`
- `transazione.dart`

This suggests the core domain includes:
- users with role-based access
- wallet balances / points balance
- transaction records

Visible binary strings also suggest:
- promotions
- events
- transaction summary
- merchant/customer validation flows

## 7. Backend Integration

### Base API URL
A production-looking base URL is embedded in the Flutter binary:

```text
https://co-money.it/api/v1
```

### Backend shape
The API is organized around:
- `/auth/*`
- `/wallet`
- `/wallet/transazioni`
- `/esercente/*`
- `/rappresentante/*`

This indicates a role-oriented REST API with separate concerns for:
- authentication
- wallet operations
- merchant workflows
- representative workflows

## 8. Storage and Local Persistence

Bundled plugins show that the app likely uses:
- `flutter_secure_storage` for sensitive values such as auth tokens
- `shared_preferences` for lightweight preferences and local flags
- `path_provider` for local file or app-directory access

Likely locally persisted data:
- authentication token
- user session metadata
- app preferences
- possibly cached flags or onboarding state

## 9. Scanning and Device Capabilities

The app has strong evidence of QR/barcode scanning support:
- `mobile_scanner` package references
- ML Kit barcode libraries
- `ScannerQRScreen`
- strings such as `Scansiona cliente`

### Android permissions confirmed from manifest strings
- `android.permission.CAMERA`
- `android.permission.INTERNET`
- `android.permission.ACCESS_NETWORK_STATE`

Other system-level manifest entries also exist because of packaged libraries and startup components.

## 10. Assets and Branding

The Flutter asset manifest contains:
- `assets/images/background.png`
- `assets/images/logo.png`

This suggests a lightweight branded asset set, likely with:
- splash/login branding
- themed background artwork
- custom app logo

## 11. Localization and Language

The screen file names and visible strings indicate the app is strongly oriented toward **Italian language usage**.

Examples found:
- `login_screen_italian.dart`
- `registrazione_screen.dart`
- `verifica_otp_screen.dart`
- `Le Mie Promozioni`
- `Crea Promozione`
- `Crea Evento`
- `Riepilogo Transazione`
- `Token non trovato. Effettua il login.`

This suggests:
- Italian is the primary product language
- the app may be intended for a local/Italian market deployment

## 12. Inferred Runtime Architecture

Based on the compiled paths and strings, the application likely follows this flow:

1. App starts from `main.dart`
2. Theme and API config are loaded
3. Authentication state is managed via `AuthProvider`
4. Wallet and transactional state is managed via `WalletProvider`
5. Users are routed to role-specific dashboards
6. Role modules call backend services through `ApiService`, `AuthService`, and `WalletService`

This is consistent with a layered Flutter app:
- UI screens
- provider state management
- service layer
- REST backend

## 13. Known Constraints Of This Documentation

Because this folder contains compiled app artifacts rather than source code:
- exact UI implementation cannot be verified line-by-line
- business rules cannot be fully confirmed
- class fields and API payloads cannot be reconstructed completely
- test coverage and developer workflows cannot be documented accurately
- CI/CD setup cannot be confirmed
- original repository structure, commit history, and environment setup are unavailable

## 14. Risks / Observations

### Packaging mismatch
There appears to be a platform identifier mismatch:
- Android package: `com.example.rapresentante_commercianti`
- iOS bundle ID: `com.rapresentante.commercianti`

This may indicate:
- unfinished production packaging on Android
- a development/default Android application ID
- inconsistent release engineering between platforms

### Rebuildability risk
Since only compiled outputs are present:
- the app cannot be reliably maintained from this folder alone
- source recovery would require decompilation or the original repository

### Documentation confidence
Confidence is high for:
- app name
- platform and framework
- visible modules/screens
- API base URL
- major third-party plugins

Confidence is medium for:
- exact business workflows
- detailed data contracts
- role permissions beyond what strings reveal

## 15. Recommended Next Steps

If this project is going to be migrated, rebuilt, or integrated with the current `co-money` codebase, the recommended next steps are:

1. Obtain the original Flutter source repository if available.
2. Recreate the domain model from the discovered modules:
   - auth
   - wallet
   - promotions
   - events
   - merchant transaction flow
3. Mirror the discovered API contracts on the backend:
   - login
   - registration + OTP verification
   - profile/session
   - wallet + transactions
   - merchant point assignment/redemption
   - representative events
4. Normalize package identifiers for production release.
5. Decide whether the new React Native client should be:
   - feature-parity with this Flutter app
   - a simplified rewrite
   - a role-by-role migration

## 16. Summary

`existing-app/` contains a packaged Flutter application called `Rapresentante Commercianti`. The app appears to be a role-based loyalty/rewards platform with modules for customers, merchants, representatives, and central admins. It integrates with a backend at `https://co-money.it/api/v1`, uses QR/barcode scanning, wallet and transaction features, promotions, events, and secure local storage.

This document should be treated as a **reverse-engineered project brief**, not as authoritative source documentation.
