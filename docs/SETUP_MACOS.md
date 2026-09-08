# ToastKart Backend — macOS Setup & Run Guide

## Table of Contents
1. [Tech Stack Overview](#tech-stack-overview)
2. [Prerequisites](#prerequisites)
3. [Step 1: Prepare Environment (XAMPP PHP in PATH)](#step-1-prepare-environment-xampp-php-in-path)
4. [Step 2: Install Composer](#step-2-install-composer)
5. [Step 3: Install PHP Dependencies](#step-3-install-php-dependencies)
6. [Step 4: Configure .env File](#step-4-configure-env-file)
7. [Step 5: Database Setup & Migrations](#step-5-database-setup--migrations)
8. [Step 6: (Optional) Link Storage for File Uploads](#step-6-optional-link-storage-for-file-uploads)
9. [Step 7: Start the Development Server](#step-7-start-the-development-server)
10. [One-Click Scripts (Composer)](#one-click-scripts-composer)
11. [Frontend Integration](#frontend-integration)
12. [Testing](#testing)
13. [Logs & Debugging](#logs--debugging)
14. [Common Issues & Fixes](#common-issues--fixes)
15. [Switching to MySQL (XAMPP)](#switching-to-mysql-xampp)
16. [API Routes Quick Reference](#api-routes-quick-reference)
17. [Project Structure](#project-structure)
18. [Deployment Guide (Symlink Approach)](DEPLOYMENT.md)
19. [Generic Deployment Guide (.htaccess Subfolder Approach)](HOSTINGER_GENERIC_DEPLOYMENT.md)

---

## Tech Stack Overview

| Layer | Technology | Version/Library |
|-------|-----------|---------------|
| **Framework** | Laravel | 13.x (see [composer.json](file:///Applications/XAMPP/xamppfiles/htdocs/github/bin/abhirami-ecom/backend/composer.json#L9-L12)) |
| **PHP** | PHP | ^8.3 required; works with 8.2 using `--ignore-platform-reqs` |
| **Auth** | Laravel Sanctum | 4.3 (Token-based SPA auth) |
| **Database** | SQLite (default) / MySQL | via Eloquent ORM |
| **Queue** | Database driver | Default (see [.env](file:///Applications/XAMPP/xamppfiles/htdocs/github/bin/abhirami-ecom/backend/.env#L38)) |
| **Session** | File driver | Local dev (see [.env](file:///Applications/XAMPP/xamppfiles/htdocs/github/bin/abhirami-ecom/backend/.env#L30)) |
| **Cache** | Database driver | Default (see [.env](file:///Applications/XAMPP/xamppfiles/htdocs/github/bin/abhirami-ecom/backend/.env#L40)) |
| **Frontend Build** | Vite 8 / Tailwind CSS 4 | See [package.json](file:///Applications/XAMPP/xamppfiles/htdocs/github/bin/abhirami-ecom/backend/package.json#L1-L16) |
| **Testing** | PHPUnit 12 | See [phpunit.xml](file:///Applications/XAMPP/xamppfiles/htdocs/github/bin/abhirami-ecom/backend/phpunit.xml) |

---

## Prerequisites

- **XAMPP** with PHP 8.2+ installed at `/Applications/XAMPP/`
- **Composer** 2.x (installed in Step 2 if missing)
- **Node.js** >= 18 (for Vite asset bundling; optional if only running API)
- **PHP extensions** (bundled with XAMPP):
  - `pdo_sqlite` or `pdo_mysql`
  - `mbstring`, `xml`, `curl`, `openssl`, `json`, `zip`

---

## Step 1: Prepare Environment (XAMPP PHP in PATH)

XAMPP's PHP must be available in your shell. Add this to `~/.zshrc` to make it persistent:

```bash
echo 'export PATH="/Applications/XAMPP/xamppfiles/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

Verify:

```bash
php -v
# Expected: PHP 8.2.x or 8.3.x
```

---

## Step 2: Install Composer

### Option A — Global Install (recommended)

```bash
cd /tmp
php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"
php composer-setup.php --install-dir=/usr/local/bin --filename=composer
php -r "unlink('composer-setup.php');"
```

### Option B — Local Install in /tmp (sandbox-friendly)

```bash
export COMPOSER_HOME="/tmp/composer_home"
mkdir -p $COMPOSER_HOME
cd /tmp
php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"
php composer-setup.php --install-dir=/tmp --filename=composer
php -r "unlink('composer-setup.php');"
# Use as: php /tmp/composer ...
```

Verify:

```bash
composer --version
```

---

## Step 3: Install PHP Dependencies

Navigate to the backend project directory:

```bash
cd /Applications/XAMPP/xamppfiles/htdocs/github/bin/abhirami-ecom/backend
export COMPOSER_HOME="/tmp/composer_home"
composer install --ignore-platform-reqs --no-interaction
```

> **Why `--ignore-platform-reqs`?** The [composer.json](file:///Applications/XAMPP/xamppfiles/htdocs/github/bin/abhirami-ecom/backend/composer.json#L9) requires PHP ^8.3, but XAMPP ships PHP 8.2. This flag lets it run anyway.

If using local `/tmp/composer`:

```bash
export COMPOSER_HOME="/tmp/composer_home"
php /tmp/composer install --ignore-platform-reqs --no-interaction
```

---

## Step 4: Configure .env File

### 4.1 Copy template (skip if `.env` already exists)

```bash
cd /Applications/XAMPP/xamppfiles/htdocs/github/bin/abhirami-ecom/backend
cp .env.example .env
php artisan key:generate --ansi
```

### 4.2 Edit `.env` — Required Values

Open [.env](file:///Applications/XAMPP/xamppfiles/htdocs/github/bin/abhirami-ecom/backend/.env) and ensure the following values are set:

```env
APP_NAME=ToastKart
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000

# --- Database (SQLite = zero-config recommended for local dev) ---
DB_CONNECTION=sqlite
# DB_DATABASE=database/database.sqlite   (auto-detects in database_path())

# --- Session (use 'file' to avoid sessions table) ---
SESSION_DRIVER=file

# --- Sanctum SPA Auth ---
# Include frontend dev server ports (Vite = 5173, Create React App = 3000)
SANCTUM_STATEFUL_DOMAINS=localhost,localhost:5173,localhost:3000,127.0.0.1,127.0.0.1:8000,::1
```

### ⚠️ Current .env Issues to Fix

The existing [.env](file:///Applications/XAMPP/xamppfiles/htdocs/github/bin/abhirami-ecom/backend/.env) has these deviations from the recommended setup:

1. **`DB_CONNECTION=mysqli` → Should be `sqlite` (or `mysql`)**: Laravel's PDO driver is `mysql`, not `mysqli`. For zero-config, use `sqlite`.

2. **Missing `SANCTUM_STATEFUL_DOMAINS`**: Add the line above for Sanctum SPA auth to work with the frontend.

---

## Step 5: Database Setup & Migrations

### Option A: SQLite (Recommended — Zero Config)

```bash
cd /Applications/XAMPP/xamppfiles/htdocs/github/bin/abhirami-ecom/backend

# Create empty SQLite DB file (Laravel expects database/database.sqlite)
touch database/database.sqlite

# Run all 19 migrations
php artisan migrate --force
```

### Option B: MySQL (via XAMPP)

See [Switching to MySQL (XAMPP)](#switching-to-mysql-xampp) at the end of this guide.

### Expected Migration Checklist (19 tables total)

After migration, these tables should exist:
- Core: `users`, `cache`, `jobs`, `migrations`
- Auth: `personal_access_tokens`
- Multi-store: `stores`, `categories`, `products`
- Customers & orders: `customers`, `carts`, `cart_items`, `orders`, `order_items`
- Settings: `settings`
- Plus column migrations: `role` (users), `owner_name` / `subdomain` (stores), `image` (products → longtext), `color` & `size` (products)

Verify with:

```bash
php artisan migrate:status
```

---

## Step 6: (Optional) Link Storage for File Uploads

If the app stores product images or other files in `storage/app/public`:

```bash
php artisan storage:link
```

This creates a symlink `public/storage → storage/app/public`.

---

## Step 7: Start the Development Server

```bash
cd /Applications/XAMPP/xamppfiles/htdocs/github/bin/abhirami-ecom/backend
php artisan serve
```

The server runs at: **http://localhost:8000**

### Health Check

```bash
curl http://localhost:8000/api/health
# Expected: {"status":"ok","app":"ToastKart API"}
```

Or open in browser: http://localhost:8000/api/health

---

## One-Click Scripts (Composer)

Defined in [composer.json](file:///Applications/XAMPP/xamppfiles/htdocs/github/bin/abhirami-ecom/backend/composer.json#L35-L51) scripts section:

| Command | What it does |
|---------|-------------|
| `composer run setup` | Install deps → copy env → key:generate → migrate → npm build |
| `composer run dev` | Start 4 processes concurrently: server, queue, pail logs, vite |
| `composer run test` | Clear config → run PHPUnit suite |

> ⚠️ If running on XAMPP PHP 8.2, run composer with `--ignore-platform-reqs`:
> ```bash
> composer run setup --ignore-platform-reqs
> ```

---

## Frontend Integration

The frontend React app lives in the sibling [frontend](file:///Applications/XAMPP/xamppfiles/htdocs/github/bin/abhirami-ecom/frontend) directory. The backend sends/expects these HTTP headers from the frontend:

```
Authorization: Bearer <toastkart_token>
X-Store-Id: <active_store_id>
Content-Type: application/json
Accept: application/json
```

Ensure `SANCTUM_STATEFUL_DOMAINS` in `.env` includes the frontend port (5173 for Vite).

---

## Testing

```bash
cd /Applications/XAMPP/xamppfiles/htdocs/github/bin/abhirami-ecom/backend

# Full test suite
php artisan test

# Specific test
php artisan test tests/Feature/OrderProductIdPersistenceTest.php
php artisan test tests/Feature/OwnerScopedCatalogTest.php
```

Existing feature tests:
- [OrderProductIdPersistenceTest.php](file:///Applications/XAMPP/xamppfiles/htdocs/github/bin/abhirami-ecom/backend/tests/Feature/OrderProductIdPersistenceTest.php)
- [OwnerScopedCatalogTest.php](file:///Applications/XAMPP/xamppfiles/htdocs/github/bin/abhirami-ecom/backend/tests/Feature/OwnerScopedCatalogTest.php)

---

## Logs & Debugging

- **Log file**: [storage/logs/laravel.log](file:///Applications/XAMPP/xamppfiles/htdocs/github/bin/abhirami-ecom/backend/storage/logs/laravel.log)
- **Real-time log tailing**:
  ```bash
  php artisan pail
  ```
- **Clear all caches** (config, route, view, cache):
  ```bash
  php artisan optimize:clear
  ```

---

## Common Issues & Fixes

### Issue: "PHP version ^8.3 required but 8.2.x installed"
Always use `--ignore-platform-reqs`:

```bash
composer install --ignore-platform-reqs
composer update --ignore-platform-reqs
```

### Issue: "Database table not found"
Run migrations:

```bash
php artisan migrate --force
```

Rebuild everything (⚠️ drops ALL data):
```bash
php artisan migrate:fresh --seed
```

### Issue: Auth 401 "Unauthenticated"
1. Check that `Authorization: Bearer <token>` header is being sent
2. Confirm `personal_access_tokens` table exists
3. Clear config cache:
   ```bash
   php artisan config:clear
   ```
4. Verify `SANCTUM_STATEFUL_DOMAINS` includes your frontend origin

### Issue: CORS / Preflight (Vite localhost:5173)
1. Laravel 13 auto-handles CORS for `api/*` routes
2. Ensure `SANCTUM_STATEFUL_DOMAINS` includes `localhost:5173`:
   ```env
   SANCTUM_STATEFUL_DOMAINS=localhost,localhost:5173,127.0.0.1,::1
   ```

### Issue: Permission denied for storage/ or bootstrap/cache/
```bash
chmod -R 775 storage bootstrap/cache
```

### Issue: Composer "Unable to write keys.dev.pub to ~/.composer"
```bash
export COMPOSER_HOME="/tmp/composer_home"
```

---

## Switching to MySQL (XAMPP)

1. **Start MySQL** from XAMPP Control Panel (default port 3306).

2. **Create the database** using phpMyAdmin (http://localhost/phpmyadmin) or CLI:

```sql
CREATE DATABASE abhirami_ecom CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

3. **Update [.env](file:///Applications/XAMPP/xamppfiles/htdocs/github/bin/abhirami-ecom/backend/.env#L23-L28)**:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=abhirami_ecom
DB_USERNAME=root
DB_PASSWORD=
```

4. **Clear cache & migrate**:
```bash
php artisan config:clear
php artisan migrate --force
```

---

## API Routes Quick Reference

All routes are defined in [routes/api.php](file:///Applications/XAMPP/xamppfiles/htdocs/github/bin/abhirami-ecom/backend/routes/api.php) and prefixed with `/api`.

### Public (No Auth)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/register` | Register new user |
| POST | `/api/login` | Login & get Sanctum token |

### Protected (Requires `auth:sanctum` — Bearer token)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/logout` | Revoke current token |
| GET | `/api/me` | Current user info |
| GET | `/api/dashboard` | Dashboard stats |
| | | |
| GET | `/api/users` | List users (Admin) |
| GET | `/api/users/{id}` | User detail (Admin) |
| | | |
| GET/POST/PUT/DELETE | `/api/stores[/{id}]` | Store CRUD |
| GET/POST/PUT/DELETE | `/api/categories[/{id}]` | Category CRUD |
| GET/POST/PUT/DELETE | `/api/products[/{id}]` | Product CRUD |
| GET | `/api/inventory` | Inventory listing |
| PUT | `/api/inventory/{id}/stock` | Update product stock |
| GET/POST/PUT/DELETE | `/api/customers[/{id}]` | Customer CRUD |
| | | |
| GET | `/api/cart` | Get cart |
| POST | `/api/cart/items` | Add cart item |
| PUT | `/api/cart/items/{id}` | Update cart item |
| DELETE | `/api/cart/items/{id}` | Remove cart item |
| DELETE | `/api/cart` | Clear cart |
| | | |
| GET | `/api/orders` | List orders |
| POST | `/api/orders` | Create order (checkout) |
| GET | `/api/orders/{id}` | Order detail |
| PUT | `/api/orders/{id}/status` | Update order status |

---

## Project Structure

```
abhirami-ecom/
├── backend/
│   ├── app/
│   │   ├── Http/Controllers/    # REST API Controllers (Auth, Cart, Category, Customer, Dashboard, Inventory, Order, Product, Setting, Store, User)
│   │   └── Models/         # Eloquent Models (Cart, CartItem, Category, Customer, Order, OrderItem, Product, Setting, Store, User)
│   ├── config/            # App config (app.php, auth.php, database.php, sanctum.php, etc.)
│   ├── database/
│   │   ├── migrations/  # 19 migration files
│   │   ├── seeders/     # DatabaseSeeder.php
│   │   └── factories/   # UserFactory.php
│   ├── public/          # Web root (index.php)
│   ├── routes/
│   │   ├── api.php     # API routes (prefix /api)
│   │   ├── web.php     # Web routes
│   │   └── console.php # Artisan commands
│   ├── storage/         # Logs, cache, sessions, uploads
│   ├── tests/           # PHPUnit tests
│   ├── composer.json
│   ├── package.json
│   ├── .env
│   ├── .env.example
│   └── artisan       # CLI entry point
├── docs/
│   └── SETUP_MACOS.md   # This file
└── frontend/          # React + Vite app
```
