// OAuth Callback Handler for Client Mode
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import {
  exchangeCodeForTokens,
  validateIdToken,
  fetchUserInfo,
} from '../oauth/client';

const prisma = new PrismaClient();

// Store PKCE verifiers and states temporarily (in production, use Redis)
const pendingAuth = new Map<
  string,
  { providerId: string; codeVerifier: string; nonce: string }
>();

// Initiate OAuth login
export const initiateOAuthLogin = async (req: Request, res: Response) => {
  try {
    const { providerId } = req.params;

    if (!req.session.userId) {
      return res.status(401).json({
        error: 'unauthorized',
        message: 'Authentication required',
      });
    }

    const provider = await prisma.oauthProvider.findUnique({
      where: { id: providerId },
    });

    if (!provider || !provider.active) {
      return res.status(404).json({
        error: 'not_found',
        message: 'Provider not found or inactive',
      });
    }

    // Generate state and PKCE
    const crypto = require('crypto');
    const state = crypto.randomBytes(32).toString('hex');
    const nonce = crypto.randomBytes(32).toString('hex');

    // Generate PKCE
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');

    // Store state and verifier
    pendingAuth.set(state, {
      providerId: provider.id,
      codeVerifier,
      nonce,
    });

    // Auto-cleanup after 10 minutes
    setTimeout(() => {
      pendingAuth.delete(state);
    }, 10 * 60 * 1000);

    // Build authorization URL
    const params = new URLSearchParams({
      client_id: provider.clientId,
      response_type: 'code',
      redirect_uri: `${process.env.BASE_URL}/api/oauth/callback`,
      scope: Array.isArray(provider.scopes)
        ? provider.scopes.join(' ')
        : (provider.scopes as any),
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      nonce,
    });

    const authUrl = `${provider.authEndpoint}?${params.toString()}`;

    // Log event
    await prisma.oauthLog.create({
      data: {
        userId: req.session.userId,
        eventType: 'oauth_login_initiated',
        status: 'success',
        details: {
          providerId: provider.id,
          providerName: provider.name,
        },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    return res.json({
      success: true,
      authUrl,
      state,
    });
  } catch (error) {
    console.error('Initiate OAuth login error:', error);
    return res.status(500).json({
      error: 'server_error',
      message: 'Internal server error',
    });
  }
};

// OAuth callback handler
export const handleOAuthCallback = async (req: Request, res: Response) => {
  try {
    const { code, state, error, error_description } = req.query;

    // Handle error from provider
    if (error) {
      console.error('OAuth error:', error, error_description);
      return res.redirect(
        `/dashboard?error=${error}&error_description=${error_description}`
      );
    }

    if (!code || !state) {
      return res.status(400).send('Missing code or state parameter');
    }

    // Retrieve stored auth data
    const authData = pendingAuth.get(state as string);

    if (!authData) {
      return res.status(400).send('Invalid or expired state parameter');
    }

    // Clean up
    pendingAuth.delete(state as string);

    // Get provider
    const provider = await prisma.oauthProvider.findUnique({
      where: { id: authData.providerId },
    });

    if (!provider) {
      return res.status(404).send('Provider not found');
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(
      provider,
      code as string,
      authData.codeVerifier
    );

    let idTokenClaims: any = null;
    let userInfo: any = null;

    // Validate and decode ID token if present
    if (tokens.id_token) {
      try {
        idTokenClaims = await validateIdToken(
          tokens.id_token,
          provider,
          authData.nonce
        );
      } catch (error) {
        console.error('ID token validation error:', error);
      }
    }

    // Fetch user info
    if (tokens.access_token && provider.userinfoEndpoint) {
      try {
        userInfo = await fetchUserInfo(provider, tokens.access_token);
      } catch (error) {
        console.error('UserInfo fetch error:', error);
      }
    }

    // Store tokens in database
    if (req.session.userId) {
      const expiresAt = new Date(
        Date.now() + (tokens.expires_in || 3600) * 1000
      );

      await prisma.oauthToken.create({
        data: {
          userId: req.session.userId,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          idToken: tokens.id_token,
          expiresAt,
          scope: tokens.scope,
          tokenType: tokens.token_type || 'Bearer',
        },
      });

      // Log success
      await prisma.oauthLog.create({
        data: {
          userId: req.session.userId,
          eventType: 'oauth_login_success',
          status: 'success',
          details: {
            providerId: provider.id,
            providerName: provider.name,
            scopes: tokens.scope,
            hasIdToken: !!tokens.id_token,
            hasRefreshToken: !!tokens.refresh_token,
            idTokenClaims,
            userInfo,
          },
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        },
      });
    }

    // Redirect to dashboard with success
    return res.redirect('/dashboard?oauth_success=true');
  } catch (error: any) {
    console.error('OAuth callback error:', error);

    if (req.session.userId) {
      await prisma.oauthLog.create({
        data: {
          userId: req.session.userId,
          eventType: 'oauth_login_failed',
          status: 'failure',
          details: {
            error: error.message,
            stack: error.stack,
          },
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        },
      });
    }

    return res.redirect(
      `/dashboard?error=oauth_failed&error_description=${encodeURIComponent(
        error.message
      )}`
    );
  }
};
