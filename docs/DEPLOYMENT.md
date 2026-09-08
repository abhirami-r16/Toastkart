# Deployment Guide: ToastKart on Hostinger

This guide explains how to deploy the split Laravel (backend) and React/Vite (frontend) architecture to a shared hosting environment like Hostinger Premium using Git.

Because shared hosting often does not support running Node.js (`npm`) commands via SSH, the frontend must be built locally before deploying.

---

## 1. Project Configuration (Already Applied)

The repository has been configured to support automated local/production routing:

1. **`frontend/.env.production`:** Automatically detected by Vite when you run `npm run build`. Overrides `VITE_API_BASE_URL` to point to the live Hostinger API.
2. **`frontend/public/.htaccess`:** Ensures the React app handles its own SPA routing on the Hostinger server, while explicitly proxying all `/api/*` traffic to the Laravel backend.
3. **`frontend/.gitignore`:** The `dist/` folder is *un-ignored* so that compiled frontend assets can be pushed to GitHub.
4. **`deploy.sh`:** A root-level bash script that automates the backend installation (Composer, Artisan) and symlinking on the server.

---

## 2. Deployment Workflow

Whenever you make changes to the code, follow this strict workflow to deploy:

### Step 1: Local Build & Push
Because Hostinger cannot run `npm run build`, you must compile the frontend locally before pushing to GitHub.

```bash
cd frontend
npm install
npm run build
cd ..

git add .
git commit -m "chore: build and prepare for deployment"
git push origin main
```

### Step 2: Trigger Deployment in Hostinger
1. Log in to your Hostinger hPanel.
2. Under your domain, navigate to **Advanced -> GIT**.
3. Click **Deploy** to pull the latest changes from your GitHub repository.
   *(Note: Ensure your Deployment Path is a folder like `repository`, **not** `public_html`)*.

### Step 3: Run Deployment Script via SSH
1. Open your terminal and connect to Hostinger via SSH:
   ```bash
   ssh -p 65002 user@hostinger_ip
   ```
2. Navigate to your repository folder:
   ```bash
   cd domains/yourdomain.com/repository
   ```
3. Execute the deployment script:
   ```bash
   ./deploy.sh
   ```

**What does `deploy.sh` do?**
- Installs PHP dependencies (`composer install --no-dev`)
- Runs database migrations (`php artisan migrate --force`)
- Caches Laravel routes and configs
- Copies your pre-built `frontend/dist` folder into Hostinger's `public_html`
- Creates a symlink connecting `public_html/api` to `repository/backend/public`, securely exposing your API without revealing Laravel's `.env`.

---

## 3. Initial Server Setup (First Time Only)

If you are setting this up for the very first time on Hostinger:

1. **Hostinger Git Setup:** When connecting your GitHub repository in Hostinger, set the "Deployment Path" to a directory *alongside* `public_html` (e.g., `repository`).
2. **Database Setup:** Create a MySQL Database in hPanel.
3. **Laravel Environment:** SSH into the server, navigate to `repository/backend`, and create the production `.env` file:
   ```bash
   cp .env.example .env
   ```
4. **Configure `.env`:** Update the following critical keys in your production `.env`:
   ```env
   APP_ENV=production
   APP_DEBUG=false
   APP_URL=https://palegreen-heron-317581.hostingersite.com
   SANCTUM_STATEFUL_DOMAINS=palegreen-heron-317581.hostingersite.com
   
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_DATABASE=your_db_name
   DB_USERNAME=your_db_user
   DB_PASSWORD=your_db_pass
   ```
5. **Run Initial Script:** Run `./deploy.sh` to migrate the database and setup symlinks.
