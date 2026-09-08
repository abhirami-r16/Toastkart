# Frontend Setup Guide (Abhirami E-Commerce)

## Project Overview

- **Framework:** React 19 + Vite 8
- **UI:** Bootstrap 5.3
- **Routing:** React Router DOM 7
- **Charts:** Recharts 3
- **Icons:** Lucide React
- **HTTP Client:** Axios
- **API Base URL:** `http://localhost:8000/api` (configurable via env)

## Prerequisites

- Node.js >= 18.x (tested: v24.18.0)
- npm >= 9.x (tested: 11.16.0)
- Backend API running on `http://localhost:8000`

## Directory Structure

```
frontend/
├── src/
│   ├── api/              # Axios instance & API modules
│   ├── assets/           # Static assets (images, logos)
│   ├── components/       # Reusable components (Navbar, Sidebar, CartDrawer)
│   ├── context/          # React Context (Auth, Cart, Store, Storefront)
│   ├── hooks/            # Custom hooks (useReveal, useSEO)
│   ├── layouts/          # Page layouts (AdminLayout, StoreLayout, StorefrontLayout)
│   ├── pages/            # Route pages (Dashboard, Products, Orders, Storefront, etc.)
│   ├── routes/           # AppRoutes.jsx (main router)
│   ├── styles/           # CSS files (main.css, storefront.css)
│   ├── utils/            # Helper utilities
│   ├── App.jsx
│   ├── main.jsx          # Entry point
├── public/               # Static public assets
├── package.json
├── vite.config.js
└── .env                  # Environment variables
```

## Quick Start (macOS)

### 1. Install Dependencies

```bash
cd /Applications/XAMPP/xamppfiles/htdocs/github/bin/abhirami-ecom/frontend
npm install
```

### 2. Configure Environment

Copy or create the `.env` file in the frontend root:

```env
# .env
VITE_API_BASE_URL=http://localhost:8000/api
```

> **Note:** If your backend runs on a different port/host, update `VITE_API_BASE_URL` accordingly.

### 3. Start Development Server

```bash
npm run dev
```

The app will be available at: **http://localhost:5173**

Vite default port is 5173. If occupied, Vite will auto-increment to 5174, etc.

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run Oxlint linter |

## Routes Overview

| Path | Description |
|------|-------------|
| `/` | Home / Storefront (BoConcept style) |
| `/portal`, `/landing` | Landing page for the platform |
| `/login`, `/register` | Authentication pages |
| `/owner/dashboard` | Store Owner Dashboard |
| `/admin/dashboard` | Admin Dashboard |
| `/customer/dashboard` | Customer Dashboard |
| `/stores` | Manage Stores |
| `/categories` | Manage Categories |
| `/products` | Manage Products |
| `/inventory` | Inventory Management |
| `/customers` | Customer Management |
| `/orders` | Order Management |
| `/cart` | Cart Page |
| `/settings` | Settings Page |
| `/store/:slug` | Individual storefront (subdomain-based routing also supported) |

## Context Providers

- **AuthContext:** Authentication state (login, register, logout, me)
- **CartContext:** Shopping cart state for admin portal
- **StoreContext:** Active store selection
- **StorefrontAuthContext:** Customer auth for storefront
- **StorefrontCartContext:** Customer cart for storefront

## Token Storage

Tokens are stored in `localStorage` under these keys:
- `toastkart_token` — Bearer token for API auth
- `toastkart_active_store_id` — Active store ID sent as `X-Store-Id` header

## CORS Notes

The frontend runs on `localhost:5173`. Ensure the backend's `SANCTUM_STATEFUL_DOMAINS` includes `localhost:5173` and CORS (if configured) allows origins from the Vite dev server.

## Production Build

```bash
npm run build
# Output: dist/
```

Serve `dist/` with any static server (nginx, Apache, `vite preview`, etc.).

## Troubleshooting

### `npm install` fails with scripts permission
```bash
npm config set ignore-scripts false
# Or for individual packages:
npm approve-scripts fsevents
```

### API calls failing / 401 errors
1. Verify backend is running: `curl http://localhost:8000/api/health`
2. Check `VITE_API_BASE_URL` is correct in `.env`
3. Clear localStorage tokens and re-login:
   - DevTools → Application → Local Storage → Clear
   - Or run: `localStorage.clear()` in console

### `QuotaExceededError` in localStorage
- App auto-cleans large base64 product images on mount
- Manually clear localStorage if needed

### Subdomain routing not working locally
Subdomain detection checks `window.location.hostname`. Localhost/IP addresses skip subdomain routing. Use `/store/:slug` path-based routing instead during development.
