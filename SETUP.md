# Setup Instructions

## Quick Start Guide

### Step 1: Install Dependencies

#### Backend
```bash
cd backend
npm install
```

#### Frontend
```bash
cd frontend
npm install
```

### Step 2: Setup Database

#### Option A: Using Docker
```bash
docker run -d \
  --name oauth-postgres \
  -e POSTGRES_USER=oauth_user \
  -e POSTGRES_PASSWORD=oauth_pass \
  -e POSTGRES_DB=oauth_platform \
  -p 5432:5432 \
  postgres:16-alpine
```

#### Option B: Local PostgreSQL
```bash
# Create database
createdb oauth_platform

# Create user
psql -c "CREATE USER oauth_user WITH PASSWORD 'oauth_pass';"
psql -c "GRANT ALL PRIVILEGES ON DATABASE oauth_platform TO oauth_user;"
```

### Step 3: Configure Environment

```bash
cd backend
cp .env.example .env

# Edit .env with your configuration
# Make sure DATABASE_URL points to your database
```

### Step 4: Run Database Migrations

```bash
cd backend
npx prisma migrate dev
npx prisma generate
```

### Step 5: Start the Application

#### Terminal 1 - Backend
```bash
cd backend
npm run dev
```

#### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```

### Step 6: Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- Discovery: http://localhost:4000/.well-known/openid-configuration

## Docker Compose Setup

### Start Everything
```bash
docker-compose up -d
```

### Run Migrations
```bash
docker-compose exec backend npx prisma migrate deploy
```

### View Logs
```bash
docker-compose logs -f
```

### Stop Everything
```bash
docker-compose down
```

### Reset Database
```bash
docker-compose down -v
docker-compose up -d
docker-compose exec backend npx prisma migrate deploy
```

## First-Time Usage

### 1. Create an Account
1. Go to http://localhost:3000
2. Click "Sign up"
3. Enter email and password
4. Login

### 2. Register Your First OAuth Client
1. Navigate to "Registered Clients"
2. Click "Register Client"
3. Fill in:
   - Name: Test App
   - Redirect URIs: http://localhost:3000/callback
   - Scopes: openid profile email
4. Save the client_id and client_secret

### 3. Test Authorization Flow
Use the authorization endpoint:
```
http://localhost:4000/oauth/authorize?
  client_id=YOUR_CLIENT_ID&
  response_type=code&
  redirect_uri=http://localhost:3000/callback&
  scope=openid profile email&
  state=test123
```

### 4. Add an External Provider
1. Go to "OAuth Providers"
2. Click "Add Provider"
3. For testing with Google:
   - Name: Google
   - Issuer: https://accounts.google.com
   - Client ID: (from Google Console)
   - Client Secret: (from Google Console)
4. Click "Login with Google" to test

## Troubleshooting

### Database Connection Failed
```bash
# Check if PostgreSQL is running
docker ps

# Or for local:
pg_isadmin

# Check DATABASE_URL in .env
```

### Prisma Issues
```bash
# Regenerate Prisma Client
npx prisma generate

# Reset database
npx prisma migrate reset

# View database in Prisma Studio
npx prisma studio
```

### Port Already in Use
```bash
# Change PORT in backend/.env
PORT=4001

# Change port in frontend/vite.config.ts
server: {
  port: 3001
}
```

### CORS Errors
- Check FRONTEND_URL in backend/.env matches frontend port
- Ensure withCredentials: true in axios config

## Production Deployment

### Security Checklist
- [ ] Change SESSION_SECRET
- [ ] Change JWT_SECRET
- [ ] Use strong database password
- [ ] Enable HTTPS
- [ ] Set NODE_ENV=production
- [ ] Enable database SSL
- [ ] Implement rate limiting
- [ ] Add security headers

### Environment Variables for Production
```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/db?ssl=true
SESSION_SECRET=<generate-strong-random-string>
JWT_SECRET=<generate-strong-random-string>
ISSUER=https://yourdomain.com
BASE_URL=https://yourdomain.com
FRONTEND_URL=https://yourdomain.com
```

### Build for Production

#### Backend
```bash
cd backend
npm run build
npm start
```

#### Frontend
```bash
cd frontend
npm run build
npm run preview
```

### Deploy with Docker
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## Testing

### Manual Testing
1. Use the web interface
2. Use the Postman collection
3. Test with curl commands

### Automated Testing
```bash
cd backend
npm test
```

## Maintenance

### Database Backups
```bash
# Backup
docker-compose exec postgres pg_dump -U oauth_user oauth_platform > backup.sql

# Restore
docker-compose exec -T postgres psql -U oauth_user oauth_platform < backup.sql
```

### View Logs
```bash
# Docker
docker-compose logs -f backend
docker-compose logs -f frontend

# Local
# Check terminal output
```

### Update Dependencies
```bash
# Backend
cd backend
npm update

# Frontend
cd frontend
npm update
```

## Support

For issues:
1. Check logs
2. Verify configuration
3. Review documentation
4. Open GitHub issue

## Next Steps

1. ✅ Set up the application
2. ✅ Create a user account
3. ✅ Register an OAuth client
4. ✅ Test OAuth flows
5. ✅ Add external providers
6. ✅ Explore token viewer
7. ✅ Use test console

Happy Testing! 🚀
