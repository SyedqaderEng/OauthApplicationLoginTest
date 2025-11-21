// Main Express Server
import express, { Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// OAuth Server Endpoints
import { getDiscoveryDocument } from './oauth/discovery';
import { jwksManager } from './oauth/jwks';
import { authorizeEndpoint, consentPage } from './oauth/authorize';
import {
  tokenEndpoint,
  introspectEndpoint,
  revokeEndpoint,
} from './oauth/token';
import { userinfoEndpoint } from './oauth/userinfo';
import {
  registerClient,
  getClients,
  getClient,
  updateClient,
  deleteClient,
} from './oauth/provider';

// Auth API
import {
  signup,
  login,
  logout,
  getCurrentUser,
  requireAuth,
  getUserTokens,
  getOAuthLogs,
} from './api/auth';

// Provider Config API
import {
  addProvider,
  getProviders,
  getProvider,
  updateProvider,
  deleteProvider,
  testProvider,
} from './api/provider-config';

// OAuth Callback
import {
  initiateOAuthLogin,
  handleOAuthCallback,
} from './api/oauth-callback';

// Load environment variables
dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-this',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax',
    },
  })
);

// Extend Express Request type for session
declare module 'express-session' {
  interface SessionData {
    userId: string;
    email: string;
  }
}

// Initialize JWKS on startup
(async () => {
  await jwksManager.getOrCreateKeyPair();
  console.log('🔐 JWKS initialized');
})();

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// ============================================
// OAUTH2 / OIDC AUTHORIZATION SERVER ENDPOINTS
// ============================================

// OpenID Connect Discovery
app.get('/.well-known/openid-configuration', getDiscoveryDocument);

// JWKS endpoint
app.get('/jwks', async (req: Request, res: Response) => {
  const jwks = await jwksManager.getPublicJWKS();
  res.json(jwks);
});

// Authorization endpoint
app.get('/oauth/authorize', authorizeEndpoint);

// Consent page (optional)
app.get('/oauth/consent', consentPage);

// Token endpoint
app.post('/oauth/token', tokenEndpoint);

// UserInfo endpoint
app.get('/oauth/userinfo', userinfoEndpoint);

// Token introspection
app.post('/oauth/introspect', introspectEndpoint);

// Token revocation
app.post('/oauth/revoke', revokeEndpoint);

// Client registration
app.post('/oauth/register', registerClient);

// Client management endpoints
app.get('/oauth/clients', requireAuth, getClients);
app.get('/oauth/clients/:clientId', requireAuth, getClient);
app.put('/oauth/clients/:clientId', requireAuth, updateClient);
app.delete('/oauth/clients/:clientId', requireAuth, deleteClient);

// ============================================
// AUTHENTICATION API
// ============================================

app.post('/api/auth/signup', signup);
app.post('/api/auth/login', login);
app.post('/api/auth/logout', logout);
app.get('/api/auth/me', getCurrentUser);
app.get('/api/auth/tokens', getUserTokens);
app.get('/api/auth/logs', getOAuthLogs);

// ============================================
// OAUTH PROVIDER CONFIGURATION API (CLIENT MODE)
// ============================================

app.post('/api/providers', requireAuth, addProvider);
app.get('/api/providers', requireAuth, getProviders);
app.get('/api/providers/:id', requireAuth, getProvider);
app.put('/api/providers/:id', requireAuth, updateProvider);
app.delete('/api/providers/:id', requireAuth, deleteProvider);
app.post('/api/providers/test', requireAuth, testProvider);

// ============================================
// OAUTH CLIENT FLOW (LOGIN WITH EXTERNAL PROVIDERS)
// ============================================

// Initiate OAuth login with external provider
app.post('/api/oauth/login/:providerId', initiateOAuthLogin);

// OAuth callback
app.get('/api/oauth/callback', handleOAuthCallback);

// ============================================
// APP CONFIGURATION
// ============================================

app.get('/api/config', requireAuth, async (req: Request, res: Response) => {
  try {
    const config = await prisma.appConfig.findFirst();

    if (!config) {
      // Create default config
      const newConfig = await prisma.appConfig.create({
        data: {
          appMode: 'BOTH',
          issuer: process.env.ISSUER || 'http://localhost:4000',
          signingKeys: {},
        },
      });

      return res.json({ config: newConfig });
    }

    return res.json({ config });
  } catch (error) {
    console.error('Get config error:', error);
    return res.status(500).json({
      error: 'server_error',
      message: 'Internal server error',
    });
  }
});

app.put('/api/config', requireAuth, async (req: Request, res: Response) => {
  try {
    const { appMode, issuer } = req.body;

    let config = await prisma.appConfig.findFirst();

    if (!config) {
      config = await prisma.appConfig.create({
        data: {
          appMode: appMode || 'BOTH',
          issuer: issuer || process.env.ISSUER || 'http://localhost:4000',
          signingKeys: {},
        },
      });
    } else {
      config = await prisma.appConfig.update({
        where: { id: config.id },
        data: {
          ...(appMode && { appMode }),
          ...(issuer && { issuer }),
        },
      });
    }

    return res.json({ success: true, config });
  } catch (error) {
    console.error('Update config error:', error);
    return res.status(500).json({
      error: 'server_error',
      message: 'Internal server error',
    });
  }
});

// ============================================
// ERROR HANDLING
// ============================================

app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'not_found',
    message: 'Endpoint not found',
  });
});

// Global error handler
app.use(
  (
    err: Error,
    req: Request,
    res: Response,
    next: express.NextFunction
  ) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
      error: 'server_error',
      message: 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && {
        details: err.message,
        stack: err.stack,
      }),
    });
  }
);

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║  🔐 OAuth2 + OIDC Test Platform                          ║
║                                                           ║
║  Server running on: http://localhost:${PORT}              ║
║  Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}             ║
║                                                           ║
║  OAuth Endpoints:                                         ║
║  - Discovery: /.well-known/openid-configuration          ║
║  - JWKS: /jwks                                            ║
║  - Authorize: /oauth/authorize                            ║
║  - Token: /oauth/token                                    ║
║  - UserInfo: /oauth/userinfo                              ║
║  - Register Client: /oauth/register                       ║
║                                                           ║
║  API Endpoints:                                           ║
║  - Signup: POST /api/auth/signup                          ║
║  - Login: POST /api/auth/login                            ║
║  - Providers: GET/POST /api/providers                     ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});
