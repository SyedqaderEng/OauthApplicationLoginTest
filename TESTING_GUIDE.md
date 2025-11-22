# OAuth2 + OIDC Testing Guide

Complete guide for testing all OAuth flows and features.

## 📋 Table of Contents

1. [Setup Test Environment](#setup-test-environment)
2. [Test Local User Authentication](#test-local-user-authentication)
3. [Test OAuth Authorization Server](#test-oauth-authorization-server)
4. [Test OAuth Client Mode](#test-oauth-client-mode)
5. [Test PKCE Flow](#test-pkce-flow)
6. [Test Token Operations](#test-token-operations)
7. [Test OpenID Connect](#test-openid-connect)

---

## Setup Test Environment

### 1. Start the Platform
```powershell
.\start.ps1
```

### 2. Create Test User
- Navigate to http://localhost:3000
- Click "Sign up"
- Email: `testuser@example.com`
- Password: `TestPass123!`

### 3. Register Test Client
1. Login to dashboard
2. Go to "Registered Clients"
3. Click "Register Client"
4. Use these details:
   ```
   Name: Test OAuth Client
   Redirect URIs: http://localhost:8080/callback
                  http://localhost:3000/callback
   Scopes: openid profile email
   ```
5. **Save the client_id and client_secret!**

---

## Test Local User Authentication

### Test 1: Signup Flow

```bash
curl -X POST http://localhost:4000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "SecurePass123"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "user": {
    "id": "...",
    "email": "newuser@example.com",
    "createdAt": "..."
  }
}
```

### Test 2: Login Flow

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "newuser@example.com",
    "password": "SecurePass123"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "user": {
    "id": "...",
    "email": "newuser@example.com",
    "lastLoginAt": "..."
  }
}
```

### Test 3: Get Current User

```bash
curl http://localhost:4000/api/auth/me \
  -b cookies.txt
```

### Test 4: Logout

```bash
curl -X POST http://localhost:4000/api/auth/logout \
  -b cookies.txt
```

---

## Test OAuth Authorization Server

### Test 1: Discovery Document

```bash
curl http://localhost:4000/.well-known/openid-configuration | json_pp
```

**Verify it includes:**
- ✅ `authorization_endpoint`
- ✅ `token_endpoint`
- ✅ `userinfo_endpoint`
- ✅ `jwks_uri`
- ✅ `response_types_supported`
- ✅ `grant_types_supported`
- ✅ `code_challenge_methods_supported`

### Test 2: JWKS Endpoint

```bash
curl http://localhost:4000/jwks | json_pp
```

**Verify it includes:**
- ✅ `keys` array
- ✅ `kty`, `kid`, `use`, `alg` fields
- ✅ RSA public key (`n`, `e`)

### Test 3: Client Registration

```bash
curl -X POST http://localhost:4000/oauth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dynamic Client",
    "redirect_uris": ["http://localhost:8080/callback"],
    "scopes": ["openid", "profile", "email"],
    "grant_types": ["authorization_code", "refresh_token"]
  }'
```

**Expected Response:**
```json
{
  "client_id": "...",
  "client_secret": "...",
  "client_name": "Dynamic Client",
  "redirect_uris": ["http://localhost:8080/callback"],
  "grant_types": ["authorization_code", "refresh_token"]
}
```

---

## Test OAuth Client Mode

### Test 1: Add External Provider

```bash
curl -X POST http://localhost:4000/api/providers \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "name": "Test Provider",
    "issuer": "http://localhost:4000",
    "clientId": "YOUR_CLIENT_ID",
    "clientSecret": "YOUR_CLIENT_SECRET",
    "scopes": ["openid", "profile", "email"]
  }'
```

### Test 2: List Providers

```bash
curl http://localhost:4000/api/providers \
  -b cookies.txt
```

### Test 3: Test Provider Discovery

```bash
curl -X POST http://localhost:4000/api/providers/test \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "issuer": "https://accounts.google.com"
  }'
```

---

## Test PKCE Flow

### Step 1: Generate PKCE Values

```python
import hashlib
import base64
import secrets

# Generate code verifier
code_verifier = base64.urlsafe_b64encode(secrets.token_bytes(32)).decode('utf-8').rstrip('=')

# Generate code challenge
code_challenge = base64.urlsafe_b64encode(
    hashlib.sha256(code_verifier.encode('utf-8')).digest()
).decode('utf-8').rstrip('=')

print(f"Code Verifier: {code_verifier}")
print(f"Code Challenge: {code_challenge}")
```

### Step 2: Authorization Request

```
http://localhost:4000/oauth/authorize?
  client_id=YOUR_CLIENT_ID&
  response_type=code&
  redirect_uri=http://localhost:3000/callback&
  scope=openid%20profile%20email&
  state=random_state_123&
  code_challenge=CODE_CHALLENGE&
  code_challenge_method=S256
```

Visit this URL in a browser while logged in.

### Step 3: Exchange Code (with PKCE)

After redirect, extract the `code` parameter and:

```bash
curl -X POST http://localhost:4000/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code" \
  -d "code=AUTH_CODE_HERE" \
  -d "redirect_uri=http://localhost:3000/callback" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "code_verifier=CODE_VERIFIER_HERE"
```

**Expected Response:**
```json
{
  "access_token": "...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "...",
  "id_token": "...",
  "scope": "openid profile email"
}
```

---

## Test Token Operations

### Test 1: Token Introspection

```bash
curl -X POST http://localhost:4000/oauth/introspect \
  -d "token=YOUR_ACCESS_TOKEN"
```

**Expected Response (Active Token):**
```json
{
  "active": true,
  "scope": "openid profile email",
  "client_id": "...",
  "username": "testuser@example.com",
  "token_type": "Bearer",
  "exp": 1234567890,
  "iat": 1234564290,
  "sub": "..."
}
```

### Test 2: UserInfo Endpoint

```bash
curl http://localhost:4000/oauth/userinfo \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Response:**
```json
{
  "sub": "...",
  "email": "testuser@example.com",
  "email_verified": true,
  "name": "testuser",
  "preferred_username": "testuser"
}
```

### Test 3: Token Refresh

```bash
curl -X POST http://localhost:4000/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=refresh_token" \
  -d "refresh_token=YOUR_REFRESH_TOKEN" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET"
```

**Expected Response:**
```json
{
  "access_token": "NEW_ACCESS_TOKEN",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "NEW_REFRESH_TOKEN",
  "id_token": "NEW_ID_TOKEN",
  "scope": "openid profile email"
}
```

### Test 4: Token Revocation

```bash
curl -X POST http://localhost:4000/oauth/revoke \
  -d "token=YOUR_ACCESS_TOKEN" \
  -d "token_type_hint=access_token"
```

**Expected Response:** HTTP 200 (empty body)

### Test 5: Verify Token Revoked

```bash
curl -X POST http://localhost:4000/oauth/introspect \
  -d "token=YOUR_REVOKED_TOKEN"
```

**Expected Response:**
```json
{
  "active": false
}
```

---

## Test OpenID Connect

### Test 1: ID Token Validation

After obtaining an ID token, decode it at https://jwt.io

**Verify Header:**
```json
{
  "alg": "RS256",
  "kid": "...",
  "typ": "JWT"
}
```

**Verify Payload:**
```json
{
  "sub": "user-id",
  "email": "testuser@example.com",
  "aud": "client-id",
  "azp": "client-id",
  "scope": "openid profile email",
  "iss": "http://localhost:4000",
  "exp": 1234567890,
  "iat": 1234564290
}
```

### Test 2: Validate ID Token Signature

```javascript
// Use jose library
import { jwtVerify, createRemoteJWKSet } from 'jose';

const JWKS = createRemoteJWKSet(new URL('http://localhost:4000/jwks'));

const { payload } = await jwtVerify(idToken, JWKS, {
  issuer: 'http://localhost:4000',
  audience: 'YOUR_CLIENT_ID'
});

console.log('ID Token Valid!', payload);
```

---

## Client Credentials Flow

### Test 1: Get Access Token

```bash
curl -X POST http://localhost:4000/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "scope=api:read api:write"
```

**Expected Response:**
```json
{
  "access_token": "...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "api:read api:write"
}
```

### Test 2: Use Access Token

```bash
curl http://localhost:4000/api/some-protected-resource \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Integration Testing with Postman

### Import Collection

1. Open Postman
2. Click **Import**
3. Select `postman_collection.json`
4. Collection loads with all endpoints!

### Set Environment Variables

Create a new environment with:
- `base_url`: `http://localhost:4000`
- `client_id`: (from registered client)
- `client_secret`: (from registered client)
- `access_token`: (leave empty, will be set automatically)

### Run Test Sequence

1. **User Management** → Signup
2. **User Management** → Login
3. **Client Registration** → Register New Client
4. **Authorization Code Flow** → Authorization Request
5. **Authorization Code Flow** → Exchange Code for Token
6. **Resource Access** → Get UserInfo
7. **Token Operations** → Introspect Token
8. **Token Operations** → Revoke Token

---

## Performance Testing

### Load Test with Apache Bench

```bash
# Test discovery endpoint
ab -n 1000 -c 10 http://localhost:4000/.well-known/openid-configuration

# Test token endpoint
ab -n 100 -c 5 -p token_request.txt -T application/x-www-form-urlencoded \
   http://localhost:4000/oauth/token
```

### Monitoring

```bash
# Watch logs
docker-compose logs -f backend

# Check resource usage
docker stats
```

---

## Security Testing

### Test 1: Invalid Client Credentials

```bash
curl -X POST http://localhost:4000/oauth/token \
  -d "grant_type=client_credentials" \
  -d "client_id=invalid" \
  -d "client_secret=wrong"
```

**Expected:** HTTP 401 Unauthorized

### Test 2: Invalid Redirect URI

```
http://localhost:4000/oauth/authorize?
  client_id=YOUR_CLIENT_ID&
  response_type=code&
  redirect_uri=http://evil.com/callback
```

**Expected:** Error: "Invalid redirect_uri"

### Test 3: Expired Token

Use an old access token:

```bash
curl http://localhost:4000/oauth/userinfo \
  -H "Authorization: Bearer EXPIRED_TOKEN"
```

**Expected:** HTTP 401 Unauthorized

### Test 4: PKCE Code Challenge Mismatch

1. Use code_challenge in authorization
2. Use wrong code_verifier in token exchange

**Expected:** Error: "Invalid PKCE code_verifier"

---

## Automated Test Suite

### Run Backend Tests

```bash
cd backend
npm test
```

### Test Coverage

```bash
cd backend
npm run test:coverage
```

---

## Success Criteria

✅ All endpoints return expected responses
✅ ID tokens are properly signed and validated
✅ PKCE flow works correctly
✅ Token refresh works
✅ Token revocation works
✅ Discovery document is complete
✅ JWKS contains valid keys
✅ Invalid credentials are rejected
✅ Expired tokens are rejected

---

## Next Steps

After successful testing:

1. **Add external providers** (Google, GitHub, Auth0)
2. **Test with real OAuth clients**
3. **Deploy to production**
4. **Monitor logs and performance**
5. **Implement rate limiting**
6. **Add audit logging**

---

**Happy Testing!** 🧪🎉
