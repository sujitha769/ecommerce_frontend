# ShopEasy Frontend (Meesho-style)

React 18 + Vite + React Router.

## Run
```bash
npm install
npm run dev      # http://localhost:5173
npm run build
```

## Features
- Register / Sign in (validation, session persisted)
- Product listing: search, category chips, sorting, skeleton loading
- Product detail with size select, Add to Cart, Buy Now
- Cart: quantity +/-, remove item, price summary with discounts
- Checkout: address -> payment (UPI / Card / Net Banking / COD, demo only)
- Order history with live tracking (status advances every 20s in mock mode)

## Backend integration
`src/api/client.js` has per-service mock flags:

| Flag | Service | Status |
|------|---------|--------|
| `MOCK.AUTH` | user-service (port 8802) | **real** |
| `MOCK.CATALOG` | product-service | mock |
| `MOCK.ORDERS` | order-service | mock |

Vite proxies `/api/auth` and `/api/users` to `http://localhost:8802` (override with `USER_SERVICE_URL`).
Add a proxy rule in `vite.config.js` for every new service, then set its flag to `false`.

Run user-service first (needs `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET` env vars), then `npm run dev`.
Tokens last 1 hour; the frontend auto-logs out on expiry.
