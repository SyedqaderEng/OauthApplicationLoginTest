# Quick Start Guide

Get your OAuth2 + OIDC Platform running in minutes!

## 🚀 One-Command Setup (Windows)

```powershell
.\start.ps1
```

## 🚀 One-Command Setup (Mac/Linux)

```bash
chmod +x start.sh
./start.sh
```

---

## 📋 Manual Setup Steps

### 1. Make Sure Docker Desktop is Running

Look for the whale icon in your system tray (Windows) or menu bar (Mac).

### 2. Start the Platform

```powershell
# Pull latest code
git pull origin claude/oauth2-oidc-platform-019yyDLWheYa783Z9bgXt1bh

# Clean up
docker-compose down

# Build and start
docker-compose up -d --build

# Wait 10-15 seconds, then run migrations
docker-compose exec backend npx prisma migrate deploy
```

### 3. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **Discovery Document**: http://localhost:4000/.well-known/openid-configuration
- **JWKS**: http://localhost:4000/jwks

---

## 🎯 First-Time User Journey

### Step 1: Create Account
1. Open http://localhost:3000
2. Click **"Sign up"**
3. Enter:
   - Email: `test@example.com`
   - Password: `password123`
4. Click **"Create Account"**

### Step 2: Explore Dashboard
After login, you'll see:
- **Active Tokens** count
- **Total Tokens** issued
- **Recent Events** log
- Your profile information

### Step 3: Register an OAuth Client
1. Click **"Registered Clients"** in the sidebar
2. Click **"Register Client"**
3. Fill in:
   ```
   Name: My Test App
   Redirect URIs: http://localhost:3000/callback
   Scopes: openid profile email
   ```
4. Click **"Register Client"**
5. **IMPORTANT**: Copy and save the `client_id` and `client_secret` (shown only once!)

### Step 4: Test OAuth Flow

#### Using the Test Console
1. Go to **"Test Console"** in the sidebar
2. Select **"OpenID Connect Discovery"**
3. Enter: `http://localhost:4000`
4. Click **"Run Test"**
5. You'll see the complete discovery document!

#### Testing Authorization Flow
Open a new browser tab and visit:
```
http://localhost:4000/oauth/authorize?
  client_id=YOUR_CLIENT_ID&
  response_type=code&
  redirect_uri=http://localhost:3000/callback&
  scope=openid profile email&
  state=test123
```

Replace `YOUR_CLIENT_ID` with the client ID you registered.

### Step 5: Add External Provider (Optional)

Want to login with Google, GitHub, or Auth0?

1. Click **"OAuth Providers"** in the sidebar
2. Click **"Add Provider"**
3. Example for **Google**:
   ```
   Name: Google
   Issuer: https://accounts.google.com
   Client ID: <your-google-oauth-client-id>
   Client Secret: <your-google-oauth-secret>
   Scopes: openid profile email
   ```
4. Click **"Add Provider"**
5. Click **"Login with Google"** to test!

---

## 🔧 Common Operations

### View Logs
```powershell
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Stop Services
```powershell
docker-compose down
```

### Restart Services
```powershell
docker-compose restart
```

### Reset Everything
```powershell
# WARNING: This deletes all data!
docker-compose down -v
docker-compose up -d --build
docker-compose exec backend npx prisma migrate deploy
```

### View Database
```powershell
docker-compose exec backend npx prisma studio
# Opens at http://localhost:5555
```

---

## 🧪 Testing OAuth Flows

### Using Postman

1. Import `postman_collection.json`
2. Set environment variables:
   - `base_url`: `http://localhost:4000`
   - `client_id`: (from registered client)
   - `client_secret`: (from registered client)
3. Run the collection!

### Using cURL

#### Get Discovery Document
```bash
curl http://localhost:4000/.well-known/openid-configuration
```

#### Get JWKS
```bash
curl http://localhost:4000/jwks
```

#### Register a Client
```bash
curl -X POST http://localhost:4000/oauth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test App",
    "redirect_uris": ["http://localhost:3000/callback"],
    "scopes": ["openid", "profile", "email"],
    "grant_types": ["authorization_code", "refresh_token"]
  }'
```

#### Exchange Code for Token
```bash
curl -X POST http://localhost:4000/oauth/token \
  -d "grant_type=authorization_code" \
  -d "code=YOUR_AUTH_CODE" \
  -d "redirect_uri=http://localhost:3000/callback" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET"
```

---

## 🐛 Troubleshooting

### Docker Desktop Not Starting
- Enable **WSL 2** (Windows)
- Enable **Hyper-V** (Windows)
- Restart computer
- Reinstall Docker Desktop

### Port Already in Use
```powershell
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process (Windows)
taskkill /PID <process-id> /F

# Or change ports in docker-compose.yml
```

### Database Connection Failed
```powershell
# Check if PostgreSQL container is running
docker-compose ps

# View PostgreSQL logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres
```

### Build Failures
```powershell
# Clean rebuild
docker-compose down -v
docker system prune -a
docker-compose up -d --build --no-cache
```

### Frontend Not Loading
```powershell
# Check frontend logs
docker-compose logs frontend

# Restart frontend
docker-compose restart frontend
```

---

## 📚 Learn More

- **OAuth 2.0 Spec**: https://oauth.net/2/
- **OpenID Connect**: https://openid.net/connect/
- **PKCE**: https://oauth.net/2/pkce/
- **JWT**: https://jwt.io/

---

## 🆘 Still Having Issues?

1. Check the logs: `docker-compose logs -f`
2. Review `WINDOWS_SETUP.md` for local development setup
3. Try the local development approach (without Docker)
4. Check `README.md` for detailed documentation

---

## ✅ Success Checklist

- [ ] Docker Desktop is running
- [ ] All containers started: `docker-compose ps`
- [ ] Migrations completed successfully
- [ ] Can access http://localhost:3000
- [ ] Can create an account
- [ ] Can login successfully
- [ ] Can register an OAuth client
- [ ] Can view tokens in dashboard

---

**Happy Testing!** 🎉

If everything is working, you now have a fully functional OAuth2 + OIDC test platform running locally!
