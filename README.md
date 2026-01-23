# NIECOMM - Nigeria Gadget Mart

NIECOMM is a localized e-commerce platform built for the Nigerian market, specializing in gadgets (phones, laptops, accessories). It prioritizes trust and safety through a robust **Escrow System** and strict **Vendor Verification** (CAC & Physical Shop).

## 🚀 Features

### 🛡️ Escrow & Safety
- **3-Day Fund Hold:** Buyer funds are held in a secure escrow account.
- **Release Conditions:** Funds are released to the vendor **only** after:
  1. The buyer confirms satisfaction manually.
  2. 3 days pass after confirmed delivery (automatic settlement).
- **Split Confirmation:** Separate actions for "Confirm Receipt" (Delivery) and "Confirm Satisfaction" (Fund Release).

### 👥 User Roles & Portals

#### 1. Buyer (User)
- **Modern Dashboard (SPA):** Real-time overview of orders and escrow status.
- **Order Tracking:** Visual timeline (Processing → Shipped → Out for Delivery → Delivered).
- **Escrow Control:** Ability to release funds upon satisfaction.
- **Location Filtering:** Filter products by State, LGA, and City.

#### 2. Vendor
- **Verification System:** Must upload CAC certificate and Shop Photo to sell.
- **Product Management:** Add/Edit products with images and stock tracking.
- **Wallet System:** View earnings, request withdrawals (Password protected).
- **Order Management:** Update order status (Shipped, Delivered).

#### 3. Administrator
- **Platform Overview:** Statistics on users, vendors, orders, and held escrow funds.
- **Vendor Verification:** Approve or reject vendor applications based on documents.
- **Escrow Settlement:** Manual batch processing to release matured funds (delivery + 3 days).
- **Withdrawal Management:** Process manual bank transfers and mark requests as "Sent" or "Rejected".

## 🛠️ Technology Stack

- **Backend:** Node.js, Express.js
- **Database:** MySQL / TiDB (via `mysql2` with Promise support)
- **Frontend:** HTML5, Bootstrap 5, Vanilla JavaScript (SPA Architecture)
- **Security:** 
  - `helmet`-style headers (CSP, XSS protection)
  - `express-rate-limit` for API protection
  - `bcryptjs` for password hashing
- **File Storage:** Local filesystem with robust fallback handling (supports read-only environments by using temp dirs).

## 📂 Project Structure

```
NIGERCOMM/
├── web/                    # Main Node.js Application
│   ├── public/             # Frontend Assets
│   │   ├── css/            # Stylesheets
│   │   ├── js/             # Client-side Logic (SPA, Auth)
│   │   ├── uploads/        # User Uploads (Products, Docs)
│   │   ├── *.html          # Single Page Application Views
│   ├── server.js           # Express Backend Entry Point
│   ├── package.json        # Dependencies
│   └── .env                # Environment Variables
├── nigeriagadgetmart/      # Legacy PHP Files (Deprecated)
└── README.md               # Documentation
```

## ⚡ Installation & Setup

### Prerequisites
- Node.js (v14+)
- MySQL Database

### Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd NIGERCOMM
   ```

2. **Navigate to the web application directory**
   ```bash
   cd web
   ```

3. **Install Dependencies**
   ```bash
   npm install
   ```

4. **Configure Environment**
   Create a `.env` file in the `web/` directory:
   ```env
   PORT=3000
   DB_HOST=127.0.0.1
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=nigeriagadgetmart
   DB_PORT=3306
   ```

5. **Initialize Database**
   Ensure your MySQL server is running. The application will attempt to connect on startup. You may need to import the initial schema if the database is empty.

6. **Start the Server**
   ```bash
   npm start
   ```
   Access the app at `http://localhost:3000`.

## 🔄 Workflow Summary

1. **Buyer** places an order -> Payment Status: **HELD**.
2. **Vendor** ships item -> Status: **SHIPPED**.
3. **Buyer** confirms receipt -> Status: **DELIVERED** (3-Day Timer Starts).
4. **Buyer** confirms satisfaction OR 3 days pass -> Payment Status: **PAID**.
5. Funds move to **Vendor Wallet**.
6. **Vendor** requests withdrawal -> **Admin** manually transfers funds and marks as **COMPLETED**.

## 📝 License
Proprietary - NIECOMM
