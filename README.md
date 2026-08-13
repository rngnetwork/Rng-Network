# 🚀 RNG Control Center — Setup & Deployment Guide

## 🛠️ Step-by-Step Setup Guide

### 📍 Step 1: Configure Environment Variables

Create `.env` (in project root) and `.env.local` (for Next.js frontend), `backend/.env` (for Spring Boot backend):

* **~/.env**: Copy the contents of ~/.env.example, paste it into .env, and fill its credentials
* **~/.env.local**: Copy the contents of ~/.env.local.example, paste it into .env.local, and fill its credentials
* **backend/.env**: Copy the contents of backend/.env.example, paste it into .env, and fill its credentials
---
### 📍 Step 2: Execute the One-Time Setup Command

Run this exact 1-block command in your terminal:

```bash
sdk install java 21.0.2-tem && sdk use java 21.0.2-tem
sudo apt-get update && sudo apt-get install -y postgresql postgresql-contrib

sudo service postgresql start
sudo su - postgres -c "psql -c \"ALTER USER postgres WITH PASSWORD 'postgres';\""
sudo su - postgres -c "psql -c \"CREATE DATABASE rng_db;\"" 2>/dev/null || true

chmod +x .deploy/deploy.sh backend/mvnw
```

---

### 📍 Step 3: Register Google OAuth2 & Discord OAuth2 Applications

#### **A. Google OAuth2 (Google Cloud Console)**
1. Open [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials).
2. Create an **OAuth 2.0 Client ID** (Application type: *Web application*).
3. Under **Authorized JavaScript origins**, add:
   - `http://localhost:8080`
   - `http://localhost:3000`
   - `https://YOUR-CODESPACE-NAME-8080.app.github.dev` (if using Codespaces)
4. Under **Authorized redirect URIs** (scroll down to the second section):
   - `http://localhost:8080/login/oauth2/code/google`
   - `https://YOUR-CODESPACE-NAME-8080.app.github.dev/login/oauth2/code/google`
5. Copy your **Client ID** and **Client Secret** into `.env`.

#### **B. Discord OAuth2 (Discord Developer Portal)**
1. Open [Discord Developer Portal](https://discord.com/developers/applications).
2. Select your Application $\rightarrow$ **OAuth2** $\rightarrow$ **Redirects**.
3. Add Authorized Redirect URIs:
   - `http://localhost:3000/auth/discord/callback`
   - `https://YOUR-CODESPACE-NAME-3000.app.github.dev/auth/discord/callback`
4. Copy your **Client ID** and **Client Secret** into `.env` and `.env.local`.

---

### 📍 Step 4: Configure GitHub Codespaces Port Visibility

1. Open the **Ports** tab in VS Code (bottom panel next to Terminal).
2. Right-click Port **`8080`** (Backend API) $\rightarrow$ **Port Visibility** $\rightarrow$ **Public**.
3. Right-click Port **`3000`** (Frontend UI) $\rightarrow$ **Port Visibility** $\rightarrow$ **Public**.

---

### 📍 Step 5: Run Automated Deployment Pipeline

Run the automated 7-phase deployment script:

```bash
.deploy/deploy.sh
```
---