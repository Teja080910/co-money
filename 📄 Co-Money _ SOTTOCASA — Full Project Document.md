# **📄 Co-Money / SOTTOCASA — Full Project Document**

---

# **🧠 1\. Project Overview**

## **🎯 Objective**

Build a **mobile app \+ backend system** where:

* Customers earn points when they shop  
* Points can be used in **other shops (not same shop)**  
* Local shops help each other grow

---

## **💡 Core Idea (Simple)**

👉 “Buy in one shop → Earn points → Spend in another shop”

---

# **👥 2\. User Roles**

| Role | Description |
| ----- | ----- |
| 👤 Customer | Earn & spend points |
| 🏪 Merchant | Give & accept points |
| 🧑‍💼 Representative | Manage shops & view reports |
| 👨‍💼 Admin | Control system & settings |

---

# **🔁 3\. Core Business Logic**

## **Flow:**

1. Customer buys → earns points  
2. Customer goes to another shop → uses points  
3. Pays remaining amount  
4. Earns new points

---

## **⚠️ Important Rule**

❌ Points earned in a shop **cannot be used in same shop**

---

## **💰 Example**

* Purchase \= ₹100  
* Max discount \= 30% → ₹30  
* Customer has ₹50 points

👉 Result:

* Uses ₹30 points  
* Pays ₹70  
* Earns points on ₹70

---

# **🏗️ 4\. System Architecture**

## **📱 Frontend**

* React Native (Expo)

## **⚙️ Backend**

* Supabase / Firebase (recommended)

## **🗄️ Database**

* Users  
* Wallet  
* Transactions  
* Shops  
* Promotions  
* Events

---

# **📂 5\. Project Structure**

/src  
  /screens  
  /components  
  /services  
  /navigation  
  /utils  
---

# **🚀 6\. Development Phases**

---

## **🟢 Phase 1: Setup**

### **Tasks:**

* Create React Native app  
* Setup backend  
* Create folder structure  
* Setup Git

---

## **🟡 Phase 2: Authentication**

### **Features:**

* Login  
* Register  
* Role-based access

---

## **🔵 Phase 3: Customer Module**

### **Screens:**

* Wallet Dashboard  
* QR Code  
* Transaction History  
* Promotions  
* Shops List

---

## **🟣 Phase 4: Merchant Module**

### **Screens:**

* Dashboard  
* Assign Points  
* Accept Points  
* Promotions

---

## **🟠 Phase 5: Admin Module**

### **Screens:**

* Dashboard  
* User Management  
* Events  
* Reports

---

## **🔴 Phase 6: Core Logic**

### **Implement:**

* Earn points  
* Spend points  
* Same shop restriction  
* Max discount logic  
* First-time bonus

---

## **🟤 Phase 7: Transaction System**

### **Features:**

* Calculate:  
  * Total  
  * Discount  
  * Payable  
  * New points  
* Store transaction

---

## **⚫ Phase 8: Wallet System**

### **Features:**

* Show balance  
* Update points  
* Track usage

---

## **📷 Phase 9: QR System**

### **Features:**

* Generate QR (customer)  
* Scan QR (merchant)  
* Fetch user data

---

## **🔗 Phase 10: Integration**

* Connect frontend \+ backend  
* Handle loading/errors

---

## **🧪 Phase 11: Testing**

Test:

* Login  
* Wallet  
* Transactions  
* Promotions  
* Roles

---

## **📦 Phase 12: Deployment**

* Build APK  
* Test on device  
* Fix bugs  
* Deliver

# **Key Points to Remember**

* Follow UI from video  
* Keep code clean  
* Build step-by-step  
* Don’t overcomplicate

---

**Feature Summary**

Customer:

Login/Register

Wallet

QR

Transactions

Promotions

Merchant:

Assign points

Accept points

Promotions

Admin:

Manage users

Events

Reports

