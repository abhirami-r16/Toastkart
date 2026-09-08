# Backend Setup Guide (Abhirami E-Commerce)

## Project Overview

- **Framework:** Laravel 13 (PHP ^8.3, compatible with PHP 8.2 using `--ignore-platform-reqs`)
- **Auth:** Laravel Sanctum (Token-based SPA auth)
- **Database:** SQLite (default), supports MySQL/MariaDB/PostgreSQL/SQL Server
- **Queue:** Database driver (default)
- **Session:** File driver (local dev), Database driver (production)
- **Cache:** Database driver (default)

## Prerequisites

- PHP >= 8.2 (XAMPP 8.2.4 works; project requires ^8.3 — use `--ignore-platform-reqs` flag)
- Composer 2.x
- PHP extensions (typically bundled with XAMPP):
  - `pdo_sqlite` (for SQLite), or `pdo_mysql` (for MySQL)
  - `mbstring`, `xml`, `curl`, `openssl`, `json`, `zip`
- Node.js >= 18 (for optional Vite asset bundling)

## Directory Structure

```
backend/
├── app/
│   ├── Http/Controllers/   # REST API Controllers
│   │   ├── Auth/AuthController.php
│   │   ├── AuthController.php
│   │   ├── CartController.php
│   │   ├── CartItemController.php
│   │   ├── CategoryController.php
│   │   ├── CustomerController.php
│   │   ├── DashboardController.php
│   │   ├── InventoryController.php
│   │   ├── OrderController.php
│   │   ├── OrderItemController.php
│   │   ├── ProductController.php
│   │   ├── SettingController.php
│   │   ├── StoreController.php
│   │   └── UserController.php
│   └── Models/              # Eloquent Models
│       ├── Cart.php, CartItem.php, Category.php
│       ├── Customer.php, Order.php, OrderItem.php
│       ├── Product.php, Setting.php, Store.php, User.php
├── config/                 # App config files
├── database/
│   ├── migrations/         # DB schema migrations (19 migrations)
│   ├── seeders/            # Seed classes
│   └── factories/          # Model factories
├── public/                 # Web root (index.php)
├── routes/
│   ├── api.php             # API routes (prefix: /api)
│   ├── web.php             # Web routes
│   └── console.php         # Artisan commands
├── storage/                # Logs, cache, sessions, uploads
├── tests/                  # PHPUnit tests (Feature & Unit)
├── composer.json
├── .env.example
├── .env                    # (After setup)
└── artisan                 # CLI entry point
```

## Quick Start (macOS with XAMPP)

### 0. Add XAMPP PHP to PATH (persist in ~/.zshrc)

```bash
export PATH="/Applications/XAMPP/xamppfiles/bin:$PATH"
```

### 1. Install Composer (if missing)

Option A — Install globally (requires writable /usr/local/bin):
```bash
cd /tmp
php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"
php composer-setup.php --install-dir=/usr/local/bin --filename=composer
php -r "unlink('composer-setup.php');"
```

Option B — Install locally in project (sandbox-friendly):
```bash
export COMPOSER_HOME="/tmp/composer_home"
mkdir -p $COMPOSER_HOME
cd /tmp
php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"
php composer-setup.php --install-dir=/tmp --filename=composer
php -r "unlink('composer-setup.php');"
# Use as: php /tmp/composer ...
```

### 2. Install PHP Dependencies

```bash
cd /Applications/XAMPP/xamppfiles/htdocs/github/bin/abhirami-ecom/backend

# If using system composer:
export COMPOSER_HOME="/tmp/composer_home"
composer install --ignore-platform-reqs --no-interaction

# If using /tmp/composer:
# php /tmp/composer install --ignore-platform-reqs --no-interaction
```

> The `--ignore-platform-reqs` flag bypasses the PHP ^8.3 requirement when using PHP 8.2 from XAMPP.

### 3. Configure Environment

```bash
cd /Applications/XAMPP/xamppfiles/htdocs/github/bin/abhirami-ecom/backend

# Copy template
cp .env.example .env

# Generate APP_KEY
php artisan key:generate --ansi
```

Edit `.env` and update these values for local development:

```env
APP_NAME=ToastKart
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000

# Database (SQLite — zero-config, recommended for quick setup)
DB_CONNECTION=sqlite
# DB_DATABASE=database/database.sqlite   (auto-detects in database_path())

# OR MySQL (via XAMPP)
# DB_CONNECTION=mysql
# DB_HOST=127.0.0.1
# DB_PORT=3306
# DB_DATABASE=abhirami_ecom
# DB_USERNAME=root
# DB_PASSWORD=

# Sessions — use 'file' locally (avoids need for sessions table)
SESSION_DRIVER=file

# Sanctum SPA auth — include frontend dev server port (5173 = Vite default)
SANCTUM_STATEFUL_DOMAINS=localhost,localhost:5173,localhost:3000,127.0.0.1,127.0.0.1:8000,::1
```

### 4. Create SQLite Database & Run Migrations

```bash
cd /Applications/XAMPP/xamppfiles/htdocs/github/bin/abhirami-ecom/backend

# Create empty SQLite DB file (if not using MySQL)
touch database/database.sqlite

# Run all migrations
php artisan migrate --force
```

Expected migrations (19 tables):
- `users`, `cache`, `jobs`
- `personal_access_tokens`
- `stores`, `categories`, `products`
- `customers`, `carts`, `cart_items`
- `orders`, `order_items`
- `settings`
- Plus several column migrations (role, owner_name, subdomain, image, color/size)

### 5. (Optional) Link Storage for File Uploads

```bash
php artisan storage:link
```

### 6. Start Development Server

```bash
php artisan serve
# Server running on: http://localhost:8000
```

Health check: `curl http://localhost:8000/api/health`
Expected response: `{"status":"ok","app":"ToastKart API"}`

## API Routes Summary

All routes are prefixed with `/api`.

### Public
| Method | Path | Description |
|--------|------|-------------|
| GET    | `/health` | API health check |
| POST   | `/register` | Register a new user |
| POST   | `/login` | Login & issue Sanctum token |

### Protected (auth:sanctum — Bearer token)
| Method | Path | Description |
|--------|------|-------------|
| POST   | `/logout` | Revoke current token |
| GET    | `/me` | Current authenticated user |
| GET    | `/dashboard` | Dashboard stats/metrics |
|        |        |                         |
| GET    | `/users` | List users (Admin) |
| GET    | `/users/{id}` | User details (Admin) |
|        |        |                         |
| GET/POST/PUT/DELETE | `/stores[/{id}]` | Store CRUD |
| GET/POST/PUT/DELETE | `/categories[/{id}]` | Category CRUD |
| GET/POST/PUT/DELETE | `/products[/{id}]` | Product CRUD |
| GET    | `/inventory` | Inventory listing |
| PUT    | `/inventory/{id}/stock` | Update product stock |
| GET/POST/PUT/DELETE | `/customers[/{id}]` | Customer CRUD |
|        |        |                         |
| GET    | `/cart` | Get cart |
| POST   | `/cart/items` | Add cart item |
| PUT    | `/cart/items/{id}` | Update cart item |
| DELETE | `/cart/items/{id}` | Remove cart item |
| DELETE | `/cart` | Clear cart |
|        |        |                         |
| GET    | `/orders` | List orders |
| POST   | `/orders` | Create order (checkout) |
| GET    | `/orders/{id}` | Order detail |
| PUT    | `/orders/{id}/status` | Update order status |

**Headers sent by frontend:**
```
Authorization: Bearer <toastkart_token>
X-Store-Id: <active_store_id>
Content-Type: application/json
Accept: application/json
```

## Database Schema (Core Relationships)

```
User (role: admin/store_owner/customer)
 └── Store (owner_id → User.id)
      ├── Category (store_id)
      ├── Product (store_id, category_id, color, size, image[base64])
      │    └── Inventory management via stock qty on Product
      ├── Customer (store_id)
      ├── Order (store_id, customer_id)
      │    └── OrderItem (order_id, product_id, qty, price)
      └── Setting (store_id, key/value)

Customer (per store)
 └── Cart (customer_id, store_id)
      └── CartItem (cart_id, product_id, qty)
```

## Available Scripts (Composer)

| Command | Description |
|---------|-------------|
| `composer run setup` | One-click: install, copy env, key:generate, migrate, npm build |
| `composer run dev` | Start 4 processes concurrently (server, queue, pail logs, vite) |
| `composer run test` | Clear config & run PHPUnit test suite |

## Testing

```bash
# Full suite
php artisan test

# Specific test
php artisan test tests/Feature/OrderProductIdPersistenceTest.php
```

Existing tests:
- `OrderProductIdPersistenceTest.php`
- `OwnerScopedCatalogTest.php`

## Logs & Debugging

- **Log file:** `storage/logs/laravel.log`
- **Real-time logs:** `php artisan pail` (included in `composer run dev`)
- **Clear all caches:**
  ```bash
  php artisan optimize:clear
  ```

## Common Issues & Fixes

### "PHP version ^8.3 required but 8.2.x installed"
Always use `--ignore-platform-reqs` with composer commands on XAMPP PHP 8.2:
```bash
composer install --ignore-platform-reqs
composer update --ignore-platform-reqs
```

### "Database table not found"
Run migrations:
```bash
php artisan migrate --force
```
Or rebuild (⚠️ drops all data):
```bash
php artisan migrate:fresh --seed
```

### Auth: "Unauthenticated" / 401
1. Check `Authorization: Bearer <token>` header is present
2. Confirm `personal_access_tokens` table exists
3. Ensure `sanctum` config is loaded:
   ```bash
   php artisan config:clear
   ```
4. Check `SANCTUM_STATEFUL_DOMAINS` includes your frontend origin

### CORS / Preflight issues with Vite (localhost:5173)
1. Laravel 13 auto-handles CORS for `api/*` routes via json exception rendering
2. Sanctum stateful domains must include `localhost:5173` (or your Vite port)
3. Verify in `.env`:
   ```env
   SANCTUM_STATEFUL_DOMAINS=localhost,localhost:5173,127.0.0.1,::1
   ```

### "Permission denied" for storage/ or bootstrap/cache/
```bash
chmod -R 775 storage bootstrap/cache
```

### Composer: "Unable to write keys.dev.pub to /Users/.../.composer"
Set `COMPOSER_HOME` to a writable path:
```bash
export COMPOSER_HOME="/tmp/composer_home"
```

## Switching to MySQL (XAMPP)

1. Start MySQL from XAMPP Control Panel (port 3306)
2. Create database:
   ```sql
   CREATE DATABASE abhirami_ecom CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
3. Update `.env`:
   ```env
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=abhirami_ecom
   DB_USERNAME=root
   DB_PASSWORD=
   ```
4. Clear cache & migrate:
   ```bash
   php artisan config:clear
   php artisan migrate --force
   ```
