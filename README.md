# 📄 Co-Money / SOTTOCASA — Execution Document

## 🧠 1. Project Objective

The goal of this project is to build a mobile application with backend support that enables a circular reward system for local shops.

Customers earn points when they make purchases and can use those points in other shops, increasing engagement among local businesses.

### 💡 Core Concept
Buy in one shop → Earn points → Spend in another shop

### ⚠️ Core Rule (Must Implement)
**Points earned in a shop cannot be used in the same shop.**
This must be enforced in backend logic.

---

## 📅 2. DEVELOPMENT PHASES

### 🟢 Phase 1: Setup
**Tasks:**
- Create React Native app (Expo)
- Setup backend (Node.js)
- Create folder structure
- Setup Git

### 🟡 Phase 2: Authentication
**Tasks & Features:**
- Login & Register UI
- Login & Register APIs
- Connect frontend with backend
- Role-based access

**Outcome:**
✔ Users can register and safely login

### 🔵 Phase 3: Customer Module
**Tasks & Screens:**
- Wallet Dashboard
- Transaction History
- Promotions & Shops List

**Outcome:**
✔ Customer can view wallet, transactions, and promotions

### 🟣 Phase 4: Merchant Module
**Tasks & Screens:**
- Merchant Dashboard
- Assign Points & Accept Points screens
- Assign Points & Accept Points APIs

**Outcome:**
✔ Merchant can give and accept points locally

### 🟠 Phase 5: Admin Module
**Tasks & Screens:**
- Admin Dashboard
- User Management Screen
- Events & Reports management

**Outcome:**
✔ Admin can fully manage the system

### 🔴 Phase 6: Core Business Logic
**Implementation Requirements:**
- Earn points & Spend points logic
- ❗ **Same shop restriction**
- Max discount logic
- First-time bonus

**Outcome:**
✔ System math and reward logic works correctly

### 🟤 Phase 7: Transaction System
**Features:**
- Calculate: Total, Discount, Payable, New points
- Store transaction securely

### ⚫ Phase 8: Wallet System
**Features:**
- Show live balance
- Update points securely
- Track point usage securely

### 📷 Phase 9: QR System
**Features:**
- Generate dynamic QR (Customer)
- Scan QR (Merchant)
- Fetch customer data and active points

### 🔗 Phase 10: Full Integration
**Tasks:**
- Connect frontend + backend for all remaining modules
- Handle loading states and errors
- Connect full app flow

**Outcome:**
✔ Complete flow working end-to-end

### 🧪 Phase 11: Testing Strategy
**Test Areas:**
- Login / Register
- Wallet updates & accurate math
- Transactions
- Promotions
- Roles and permissions

### 📦 Phase 12: Deployment
**Tasks:**
- Complete final testing
- Fix final bugs
- Build APK
- Test on a physical device

**Outcome:**
✔ App ready for presentation and demo

---

## 📌 3. Key Points to Remember
- Follow UI from video
- Keep code clean
- Build step-by-step
- Don’t overcomplicate

---

## 📋 4. Feature Summary

**Customer:**
- Login/Register
- Wallet
- QR
- Transactions
- Promotions

**Merchant:**
- Assign points
- Accept points
- Promotions

**Admin:**
- Manage users
- Events
- Reports

---

## 5. Client APK Build

To generate the Android APK locally from the native client project:

```bash
cd client/android
GRADLE_USER_HOME=/tmp/gradle-co-money ANDROID_HOME=/home/teja/Android/Sdk ./gradlew assembleRelease
```

Generated APK path:

```text
client/android/app/build/outputs/apk/release/app-release.apk
```

## 6. Server Deployment With PM2

The backend already reads its environment from `server/.env`, so PM2 can run it from the compiled build.

Node.js 20 or newer is required for this repo.

```bash
cd server
npm install
npm run build
pm2 start ecosystem.config.js --env production
pm2 save
```

Useful PM2 commands:

```bash
cd server
pm2 logs co-money-server
pm2 restart co-money-server
pm2 stop co-money-server
pm2 delete co-money-server
```

You can also use the package scripts:

```bash
cd server
npm run pm2:start
npm run pm2:logs
```

## 7. Client Web Deployment

The React Native app uses Expo web, so deployment is a static export.

Node.js 20 or newer is required. If you see `configs.toReversed is not a function`, the server is using an older Node release.

Set the client API URL first:

```bash
cd client
cp .env.example .env
```

Update `EXPO_PUBLIC_API_URL` in `client/.env` to your deployed backend URL, for example:

```bash
EXPO_PUBLIC_API_URL=https://api.your-domain.com
```

Build the web app:

```bash
cd client
npm install
npm run build:web
```

Expo will generate the static site in:

```text
client/dist
```

You can deploy that `dist` folder to any static host like Nginx, Vercel, Netlify, or Cloudflare Pages.

If you want to serve it with PM2 on a VPS:

```bash
cd /home/teja/Desktop/projects/co-money/client
npm run build:web
pm2 serve dist 3000 --spa --name co-money-web
pm2 save
```

Useful PM2 commands:

```bash
pm2 logs co-money-web
pm2 restart co-money-web
pm2 stop co-money-web
pm2 delete co-money-web
```

If your VPS is on an older Node version, switch before building:

```bash
nvm install 20
nvm use 20
node -v
```
