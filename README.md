# OAuth2 + OIDC Test Platform

A complete, full-stack OAuth2 and OpenID Connect (OIDC) test platform that can act as both an **Authorization Server (IdP)** and an **OAuth2 Client (Relying Party)**.

## 🎯 Features

### Authorization Server (IdP) Mode
- ✅ OAuth2 Authorization Code flow
- ✅ PKCE (Proof Key for Code Exchange) support
- ✅ Client Credentials flow
- ✅ Refresh Token support
- ✅ OpenID Connect Discovery Document (`.well-known/openid-configuration`)
- ✅ JWKS (JSON Web Key Set) endpoint
- ✅ JWT signing with RSA keys
- ✅ Token introspection & revocation
- ✅ UserInfo endpoint
- ✅ Dynamic client registration

### OAuth2 Client Mode
- ✅ Login with external OAuth/OIDC providers
- ✅ Auto-fetch provider metadata
- ✅ PKCE support
- ✅ Token validation & decoding
- ✅ ID Token signature verification
- ✅ Refresh token handling

### Platform Features
- ✅ Local user authentication (bcrypt password hashing)
- ✅ Token management dashboard
- ✅ OAuth event logging
- ✅ Interactive test console
- ✅ Token viewer with claims decoder
- ✅ PostgreSQL database
- ✅ Docker Compose setup

## 🛠 Tech Stack

**Backend:**
- Node.js + TypeScript
- Express
- Prisma (PostgreSQL ORM)
- jose (JWT/JWK handling)
- bcrypt (password hashing)

**Frontend:**
- React + TypeScript
- Vite
- TailwindCSS
- React Router
- Axios
- Lucide Icons

**Infrastructure:**
- PostgreSQL 16
- Docker + Docker Compose

## 📁 Project Structure

```
OauthApplicationLoginTest/
├── backend/
│   ├── src/
│   │   ├── oauth/
│   │   │   ├── authorize.ts       # Authorization endpoint
│   │   │   ├── token.ts           # Token endpoint
│   │   │   ├── userinfo.ts        # UserInfo endpoint
│   │   │   ├── discovery.ts       # OIDC Discovery
│   │   │   ├── jwks.ts            # JWKS management
│   │   │   ├── provider.ts        # OAuth provider management
│   │   │   └── client.ts          # OAuth client functions
│   │   ├── api/
│   │   │   ├── auth.ts            # Local auth endpoints
│   │   │   ├── provider-config.ts # Provider configuration
│   │   │   └── oauth-callback.ts  # OAuth callback handler
│   │   ├── server.ts              # Main server file
│   │   └── ...
│   ├── prisma/
│   │   └── schema.prisma          # Database schema
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   ├── Signup.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── OAuthProviders.tsx
│   │   │   ├── TokenViewer.tsx
│   │   │   ├── OAuthTestConsole.tsx
│   │   │   └── RegisteredClients.tsx
│   │   ├── components/
│   │   │   └── Layout.tsx
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for local development)
- PostgreSQL (if running without Docker)

### Option 1: Docker Compose (Recommended)

1. **Clone the repository**
```bash
git clone <repository-url>
cd OauthApplicationLoginTest
```

2. **Create environment file**
```bash
cp backend/.env.example backend/.env
```

3. **Start all services**
```bash
docker-compose up -d
```

4. **Run database migrations**
```bash
docker-compose exec backend npx prisma migrate deploy
```

5. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- Discovery Document: http://localhost:4000/.well-known/openid-configuration

### Option 2: Local Development

1. **Setup Backend**
```bash
cd backend
npm install
cp .env.example .env

# Update DATABASE_URL in .env
# Run migrations
npx prisma migrate dev
npx prisma generate

# Start backend
npm run dev
```

2. **Setup Frontend**
```bash
cd frontend
npm install

# Start frontend
npm run dev
```

3. **Setup PostgreSQL**
```bash
# Create database
createdb oauth_platform

# Or use Docker for just the database
docker run -d \
  --name oauth-postgres \
  -e POSTGRES_USER=oauth_user \
  -e POSTGRES_PASSWORD=oauth_pass \
  -e POSTGRES_DB=oauth_platform \
  -p 5432:5432 \
  postgres:16-alpine
```

## 📖 Usage Guide

### 1. User Registration & Login

1. Navigate to http://localhost:3000
2. Click "Sign up" and create an account
3. Login with your credentials

### 2. Register as OAuth Authorization Server

#### Register a Client Application

1. Go to "Registered Clients" tab
2. Click "Register Client"
3. Fill in:
   - **Name**: My Test App
   - **Redirect URIs**: `http://localhost:3000/callback`
   - **Scopes**: `openid profile email`
4. **Save the Client ID and Secret** (shown only once!)

#### Test OAuth Flow

You can now use this server as an OAuth provider for external applications!

**Authorization Endpoint:**
```
GET http://localhost:4000/oauth/authorize?
  client_id=YOUR_CLIENT_ID&
  response_type=code&
  redirect_uri=http://localhost:3000/callback&
  scope=openid profile email&
  state=random_state&
  code_challenge=PKCE_CHALLENGE&
  code_challenge_method=S256
```

**Token Endpoint:**
```bash
POST http://localhost:4000/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code&
code=AUTHORIZATION_CODE&
redirect_uri=http://localhost:3000/callback&
client_id=YOUR_CLIENT_ID&
client_secret=YOUR_CLIENT_SECRET&
code_verifier=PKCE_VERIFIER
```

### 3. Use as OAuth Client (Login with External Providers)

#### Add an External Provider

1. Go to "OAuth Providers" tab
2. Click "Add Provider"
3. Fill in provider details:

**Example: Google**
```
Name: Google
Issuer: https://accounts.google.com
Client ID: <your-google-client-id>
Client Secret: <your-google-client-secret>
Scopes: openid profile email
```

**Example: Auth0**
```
Name: Auth0
Issuer: https://YOUR-TENANT.auth0.com
Client ID: <your-auth0-client-id>
Client Secret: <your-auth0-client-secret>
Scopes: openid profile email
```

4. Click "Login with [Provider]" to test the OAuth flow

### 4. View and Inspect Tokens

1. Go to "Token Viewer" tab
2. Select a token from the list
3. View:
   - Access token
   - Refresh token (if available)
   - ID token claims (decoded)
   - Token metadata
   - Expiration time

### 5. Test Console

Use the interactive test console to:
- Test OIDC Discovery documents
- Introspect tokens
- Call UserInfo endpoints

## 🔐 OAuth2 Endpoints

### Authorization Server Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/.well-known/openid-configuration` | GET | OpenID Connect Discovery |
| `/jwks` | GET | JSON Web Key Set |
| `/oauth/authorize` | GET | Authorization endpoint |
| `/oauth/token` | POST | Token endpoint |
| `/oauth/userinfo` | GET | UserInfo endpoint |
| `/oauth/introspect` | POST | Token introspection |
| `/oauth/revoke` | POST | Token revocation |
| `/oauth/register` | POST | Dynamic client registration |

### Client API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/signup` | POST | User signup |
| `/api/auth/login` | POST | User login |
| `/api/auth/logout` | POST | User logout |
| `/api/auth/me` | GET | Current user info |
| `/api/providers` | GET/POST | Manage OAuth providers |
| `/api/oauth/login/:providerId` | POST | Initiate OAuth login |
| `/api/oauth/callback` | GET | OAuth callback handler |

## 📝 Database Schema

```prisma
model User {
  id            String   @id @default(uuid())
  email         String   @unique
  passwordHash  String
  createdAt     DateTime @default(now())
  lastLoginAt   DateTime?
  oauthTokens   OauthToken[]
  oauthLogs     OauthLog[]
}

model OauthClient {
  id                      String   @id @default(uuid())
  clientId                String   @unique
  clientSecretHash        String?
  name                    String
  redirectUris            Json
  scopes                  Json
  grantTypes              Json
  active                  Boolean  @default(true)
}

model OauthToken {
  id           String   @id @default(uuid())
  userId       String?
  clientId     String?
  accessToken  String
  refreshToken String?
  idToken      String?
  expiresAt    DateTime
  scope        String?
  tokenType    String   @default("Bearer")
}

model OauthProvider {
  id                String   @id @default(uuid())
  name              String
  issuer            String
  authEndpoint      String
  tokenEndpoint     String
  userinfoEndpoint  String?
  jwksUri           String?
  clientId          String
  clientSecret      String
  scopes            Json
  active            Boolean  @default(true)
}

model OauthLog {
  id          String   @id @default(uuid())
  userId      String?
  eventType   String
  status      String
  details     Json
  createdAt   DateTime @default(now())
}
```

## 🧪 Testing Examples

### Example 1: Authorization Code Flow

```bash
# 1. Get authorization code
curl "http://localhost:4000/oauth/authorize?\
client_id=YOUR_CLIENT_ID&\
response_type=code&\
redirect_uri=http://localhost:3000/callback&\
scope=openid profile email&\
state=abc123"

# 2. Exchange code for tokens
curl -X POST http://localhost:4000/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code" \
  -d "code=AUTHORIZATION_CODE" \
  -d "redirect_uri=http://localhost:3000/callback" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET"
```

### Example 2: Client Credentials Flow

```bash
curl -X POST http://localhost:4000/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "scope=api:read"
```

### Example 3: Token Introspection

```bash
curl -X POST http://localhost:4000/oauth/introspect \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "token=YOUR_ACCESS_TOKEN"
```

### Example 4: UserInfo Request

```bash
curl http://localhost:4000/oauth/userinfo \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 🔧 Configuration

### Environment Variables

**Backend (.env)**
```env
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://oauth_user:oauth_pass@localhost:5432/oauth_platform
SESSION_SECRET=your-super-secret-session-key
JWT_SECRET=your-jwt-secret
ISSUER=http://localhost:4000
BASE_URL=http://localhost:4000
FRONTEND_URL=http://localhost:3000
```

### Supported Grant Types

- `authorization_code` - Authorization Code flow
- `authorization_code` + PKCE - Enhanced security
- `client_credentials` - Server-to-server
- `refresh_token` - Token refresh

### Supported Response Types

- `code` - Authorization Code
- `token` - Implicit (basic support)
- `id_token` - OIDC implicit

## 📊 Postman Collection

Import the included Postman collection to test all OAuth flows:

```json
{
  "info": {
    "name": "OAuth2 + OIDC Platform",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/"
  },
  "item": [
    {
      "name": "Discovery",
      "request": {
        "method": "GET",
        "url": "http://localhost:4000/.well-known/openid-configuration"
      }
    },
    {
      "name": "JWKS",
      "request": {
        "method": "GET",
        "url": "http://localhost:4000/jwks"
      }
    },
    {
      "name": "Token Endpoint",
      "request": {
        "method": "POST",
        "url": "http://localhost:4000/oauth/token",
        "body": {
          "mode": "urlencoded",
          "urlencoded": [
            {"key": "grant_type", "value": "authorization_code"},
            {"key": "code", "value": "{{auth_code}}"},
            {"key": "redirect_uri", "value": "http://localhost:3000/callback"},
            {"key": "client_id", "value": "{{client_id}}"},
            {"key": "client_secret", "value": "{{client_secret}}"}
          ]
        }
      }
    }
  ]
}
```

## 🐛 Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker-compose ps

# View logs
docker-compose logs postgres

# Reset database
docker-compose down -v
docker-compose up -d
```

### Token Validation Errors

- Ensure `ISSUER` matches the server URL
- Check that JWKS is accessible at `/jwks`
- Verify token hasn't expired

### CORS Issues

- Check `FRONTEND_URL` in backend .env
- Ensure credentials are included in requests

## 🚀 Production Deployment

### Security Checklist

- [ ] Change `SESSION_SECRET` to a strong random value
- [ ] Change `JWT_SECRET` to a strong random value
- [ ] Use HTTPS in production
- [ ] Set `NODE_ENV=production`
- [ ] Enable database SSL
- [ ] Rotate signing keys periodically
- [ ] Implement rate limiting
- [ ] Add CSP headers
- [ ] Enable audit logging
- [ ] Use secure cookie settings

### Deploy with Docker

```bash
# Build and start
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Run migrations
docker-compose exec backend npx prisma migrate deploy
```

## 📚 Resources

- [OAuth 2.0 RFC 6749](https://datatracker.ietf.org/doc/html/rfc6749)
- [OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html)
- [PKCE RFC 7636](https://datatracker.ietf.org/doc/html/rfc7636)
- [JWT RFC 7519](https://datatracker.ietf.org/doc/html/rfc7519)
- [JWKS RFC 7517](https://datatracker.ietf.org/doc/html/rfc7517)

## 📄 License

MIT

## 👥 Contributing

Contributions welcome! Please open an issue or submit a pull request.

## 🆘 Support

For issues and questions:
- Open a GitHub issue
- Check existing documentation
- Review OAuth2/OIDC specifications

---

**Built with ❤️ using Node.js, React, and PostgreSQL**
