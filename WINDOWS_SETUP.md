# Windows Setup Guide

This guide is specifically for Windows users who want to run the OAuth2 + OIDC Platform locally.

## Prerequisites

- Node.js 20+ ([Download](https://nodejs.org/))
- PostgreSQL ([Download](https://www.postgresql.org/download/windows/))
- Git for Windows

## Option 1: Local Development (Recommended for Windows)

### Step 1: Install PostgreSQL

1. Download and install PostgreSQL from https://www.postgresql.org/download/windows/
2. During installation, set password as `oauth_pass`
3. Keep default port `5432`

### Step 2: Create Database

Open **pgAdmin** or **SQL Shell (psql)** and run:

```sql
CREATE DATABASE oauth_platform;
CREATE USER oauth_user WITH PASSWORD 'oauth_pass';
GRANT ALL PRIVILEGES ON DATABASE oauth_platform TO oauth_user;
```

Or using PowerShell with psql:

```powershell
# Navigate to PostgreSQL bin directory (adjust version as needed)
cd "C:\Program Files\PostgreSQL\16\bin"

# Create database
.\psql -U postgres -c "CREATE DATABASE oauth_platform;"
.\psql -U postgres -c "CREATE USER oauth_user WITH PASSWORD 'oauth_pass';"
.\psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE oauth_platform TO oauth_user;"
```

### Step 3: Setup Backend

```powershell
# Navigate to project
cd C:\Projects\OauthApplicationLoginTest\OauthApplicationLoginTest

# Install backend dependencies
cd backend
npm install

# Copy environment file
copy .env.example .env

# Run database migrations
npx prisma migrate dev --name init
npx prisma generate

# Start backend server
npm run dev
```

The backend should now be running on **http://localhost:4000**

### Step 4: Setup Frontend (New PowerShell Window)

```powershell
# Navigate to frontend
cd C:\Projects\OauthApplicationLoginTest\OauthApplicationLoginTest\frontend

# Install dependencies
npm install

# Start frontend
npm run dev
```

The frontend should now be running on **http://localhost:3000**

### Step 5: Access the Application

Open your browser and go to:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **Discovery Document**: http://localhost:4000/.well-known/openid-configuration

## Option 2: Docker Desktop (If Docker is Working)

### Fix Docker Desktop Issues

1. **Start Docker Desktop**
   - Open Docker Desktop from Start Menu
   - Wait for the green "Docker Desktop is running" status
   - You should see a whale icon in your system tray

2. **Verify Docker is Running**
   ```powershell
   docker --version
   docker ps
   ```

3. **If Docker Desktop Won't Start:**
   - Enable WSL 2 (Windows Subsystem for Linux)
   - Enable Hyper-V in Windows Features
   - Restart your computer
   - Reinstall Docker Desktop if necessary

### Start with Docker

Once Docker Desktop is running:

```powershell
cd C:\Projects\OauthApplicationLoginTest\OauthApplicationLoginTest

# Build and start containers
docker-compose up -d

# Wait for containers to be ready (about 30-60 seconds)
# Then run migrations
docker-compose exec backend npx prisma migrate deploy

# View logs
docker-compose logs -f
```

## Troubleshooting

### Port Already in Use

If ports 3000 or 4000 are already in use:

**Backend (.env):**
```env
PORT=4001
```

**Frontend (vite.config.ts):**
```typescript
server: {
  port: 3001
}
```

### Database Connection Issues

Verify PostgreSQL is running:

```powershell
# Check if PostgreSQL service is running
Get-Service -Name postgresql*

# Or check with psql
psql -U postgres -c "SELECT version();"
```

If connection fails, update `DATABASE_URL` in `backend/.env`:

```env
DATABASE_URL="postgresql://oauth_user:oauth_pass@localhost:5432/oauth_platform"
```

### Prisma Issues

```powershell
cd backend

# Clear Prisma cache
npx prisma generate

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# View database in browser
npx prisma studio
```

### Node Modules Issues

If you get module errors:

```powershell
# Backend
cd backend
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install

# Frontend
cd ..\frontend
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
```

### Firewall Issues

If you can't access the application:

1. Open Windows Defender Firewall
2. Click "Allow an app through firewall"
3. Allow Node.js through private and public networks

## Quick Commands Reference

### Start Everything Locally

```powershell
# Terminal 1 - Backend
cd C:\Projects\OauthApplicationLoginTest\OauthApplicationLoginTest\backend
npm run dev

# Terminal 2 - Frontend (new window)
cd C:\Projects\OauthApplicationLoginTest\OauthApplicationLoginTest\frontend
npm run dev
```

### Stop Everything

```powershell
# Press Ctrl+C in each terminal

# Or if using Docker:
docker-compose down
```

### Reset Database

```powershell
cd backend
npx prisma migrate reset
```

### View Database

```powershell
cd backend
npx prisma studio
# Opens at http://localhost:5555
```

## Testing the Setup

1. Open http://localhost:3000
2. Click "Sign up"
3. Create an account with email: `test@example.com`, password: `password123`
4. Login and explore the dashboard
5. Go to "Registered Clients" and register a test OAuth client
6. Test the OAuth flow!

## Environment Variables (.env)

Make sure your `backend/.env` looks like this:

```env
NODE_ENV=development
PORT=4000
FRONTEND_URL=http://localhost:3000

# For local PostgreSQL
DATABASE_URL="postgresql://oauth_user:oauth_pass@localhost:5432/oauth_platform"

SESSION_SECRET=your-super-secret-session-key-change-this-in-production
ISSUER=http://localhost:4000
BASE_URL=http://localhost:4000
JWT_SECRET=your-jwt-secret-change-this-in-production
JWT_EXPIRES_IN=3600
PKCE_ENABLED=true
```

## Next Steps

After setup is complete:

1. ✅ Create a user account
2. ✅ Register an OAuth client
3. ✅ Test authorization flows
4. ✅ Add external providers (Google, Auth0)
5. ✅ Use the Test Console
6. ✅ View tokens in Token Viewer

## Support

If you encounter issues:

1. Check logs in the terminal
2. Verify PostgreSQL is running
3. Ensure ports 3000 and 4000 are free
4. Check firewall settings
5. Review error messages carefully

## Using Postman

Import `postman_collection.json` to test API endpoints:

1. Open Postman
2. Click Import
3. Select `postman_collection.json`
4. Set variables:
   - `base_url`: http://localhost:4000
   - `client_id`: (from registered client)
   - `client_secret`: (from registered client)

Happy testing! 🚀
