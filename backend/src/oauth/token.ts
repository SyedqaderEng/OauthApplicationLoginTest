// OAuth2 Token Endpoint
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { jwksManager } from './jwks';

const prisma = new PrismaClient();

// Verify PKCE code challenge
function verifyPKCE(
  codeVerifier: string,
  codeChallenge: string,
  method: string
): boolean {
  if (method === 'plain') {
    return codeVerifier === codeChallenge;
  } else if (method === 'S256') {
    const hash = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');
    return hash === codeChallenge;
  }
  return false;
}

export const tokenEndpoint = async (req: Request, res: Response) => {
  try {
    const {
      grant_type,
      code,
      redirect_uri,
      client_id,
      client_secret,
      code_verifier,
      refresh_token,
      scope,
    } = req.body;

    if (!grant_type) {
      return res.status(400).json({
        error: 'invalid_request',
        error_description: 'Missing grant_type',
      });
    }

    // Handle Authorization Code flow
    if (grant_type === 'authorization_code') {
      if (!code || !redirect_uri || !client_id) {
        return res.status(400).json({
          error: 'invalid_request',
          error_description: 'Missing required parameters',
        });
      }

      // Find authorization code
      const authCode = await prisma.authorizationCode.findUnique({
        where: { code },
      });

      if (!authCode || authCode.used) {
        return res.status(400).json({
          error: 'invalid_grant',
          error_description: 'Invalid or expired authorization code',
        });
      }

      // Check expiration
      if (authCode.expiresAt < new Date()) {
        await prisma.authorizationCode.update({
          where: { code },
          data: { used: true },
        });
        return res.status(400).json({
          error: 'invalid_grant',
          error_description: 'Authorization code expired',
        });
      }

      // Validate client
      if (authCode.clientId !== client_id) {
        return res.status(400).json({
          error: 'invalid_client',
          error_description: 'Client mismatch',
        });
      }

      // Validate redirect URI
      if (authCode.redirectUri !== redirect_uri) {
        return res.status(400).json({
          error: 'invalid_request',
          error_description: 'Redirect URI mismatch',
        });
      }

      // Verify PKCE if used
      if (authCode.codeChallenge) {
        if (!code_verifier) {
          return res.status(400).json({
            error: 'invalid_request',
            error_description: 'PKCE code_verifier required',
          });
        }

        const pkceValid = verifyPKCE(
          code_verifier,
          authCode.codeChallenge,
          authCode.codeChallengeMethod || 'S256'
        );

        if (!pkceValid) {
          return res.status(400).json({
            error: 'invalid_grant',
            error_description: 'Invalid PKCE code_verifier',
          });
        }
      }

      // Validate client secret if not using PKCE
      if (!authCode.codeChallenge) {
        const client = await prisma.oauthClient.findUnique({
          where: { clientId: client_id },
        });

        if (client?.clientSecretHash) {
          if (!client_secret) {
            return res.status(401).json({
              error: 'invalid_client',
              error_description: 'Client secret required',
            });
          }

          const secretValid = await bcrypt.compare(
            client_secret,
            client.clientSecretHash
          );

          if (!secretValid) {
            return res.status(401).json({
              error: 'invalid_client',
              error_description: 'Invalid client credentials',
            });
          }
        }
      }

      // Mark code as used
      await prisma.authorizationCode.update({
        where: { code },
        data: { used: true },
      });

      // Get user
      const user = await prisma.user.findUnique({
        where: { id: authCode.userId },
      });

      if (!user) {
        return res.status(400).json({
          error: 'invalid_grant',
          error_description: 'User not found',
        });
      }

      // Generate tokens
      const accessToken = crypto.randomBytes(32).toString('hex');
      const refreshTokenValue = crypto.randomBytes(32).toString('hex');
      const expiresIn = 3600; // 1 hour

      // Generate ID Token (if openid scope requested)
      let idToken: string | undefined;
      const scopes = authCode.scope?.split(' ') || [];

      if (scopes.includes('openid')) {
        const idTokenPayload = {
          sub: user.id,
          email: user.email,
          aud: client_id,
          azp: client_id,
          scope: authCode.scope,
        };

        idToken = await jwksManager.signJWT(idTokenPayload, '1h');
      }

      // Store tokens
      await prisma.oauthToken.create({
        data: {
          userId: user.id,
          clientId: authCode.clientId,
          accessToken,
          refreshToken: refreshTokenValue,
          idToken,
          expiresAt: new Date(Date.now() + expiresIn * 1000),
          scope: authCode.scope,
          tokenType: 'Bearer',
        },
      });

      // Log event
      await prisma.oauthLog.create({
        data: {
          userId: user.id,
          eventType: 'token_issued',
          status: 'success',
          details: {
            grantType: grant_type,
            clientId: client_id,
            scope: authCode.scope,
          },
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        },
      });

      return res.json({
        access_token: accessToken,
        token_type: 'Bearer',
        expires_in: expiresIn,
        refresh_token: refreshTokenValue,
        id_token: idToken,
        scope: authCode.scope,
      });
    }

    // Handle Client Credentials flow
    if (grant_type === 'client_credentials') {
      if (!client_id || !client_secret) {
        return res.status(401).json({
          error: 'invalid_client',
          error_description: 'Client credentials required',
        });
      }

      // Validate client
      const client = await prisma.oauthClient.findUnique({
        where: { clientId: client_id },
      });

      if (!client || !client.active) {
        return res.status(401).json({
          error: 'invalid_client',
          error_description: 'Invalid client',
        });
      }

      if (!client.clientSecretHash) {
        return res.status(401).json({
          error: 'invalid_client',
          error_description: 'Client secret not configured',
        });
      }

      const secretValid = await bcrypt.compare(
        client_secret,
        client.clientSecretHash
      );

      if (!secretValid) {
        return res.status(401).json({
          error: 'invalid_client',
          error_description: 'Invalid client credentials',
        });
      }

      // Generate access token
      const accessToken = crypto.randomBytes(32).toString('hex');
      const expiresIn = 3600;

      await prisma.oauthToken.create({
        data: {
          clientId: client.id,
          accessToken,
          expiresAt: new Date(Date.now() + expiresIn * 1000),
          scope: scope || 'default',
          tokenType: 'Bearer',
        },
      });

      return res.json({
        access_token: accessToken,
        token_type: 'Bearer',
        expires_in: expiresIn,
        scope: scope || 'default',
      });
    }

    // Handle Refresh Token flow
    if (grant_type === 'refresh_token') {
      if (!refresh_token) {
        return res.status(400).json({
          error: 'invalid_request',
          error_description: 'Missing refresh_token',
        });
      }

      const tokenRecord = await prisma.oauthToken.findFirst({
        where: { refreshToken: refresh_token },
        include: { user: true },
      });

      if (!tokenRecord) {
        return res.status(400).json({
          error: 'invalid_grant',
          error_description: 'Invalid refresh token',
        });
      }

      // Generate new access token
      const newAccessToken = crypto.randomBytes(32).toString('hex');
      const newRefreshToken = crypto.randomBytes(32).toString('hex');
      const expiresIn = 3600;

      // Generate new ID token if scope includes openid
      let newIdToken: string | undefined;
      const scopes = tokenRecord.scope?.split(' ') || [];

      if (scopes.includes('openid') && tokenRecord.user) {
        const idTokenPayload = {
          sub: tokenRecord.user.id,
          email: tokenRecord.user.email,
          aud: tokenRecord.clientId,
          scope: tokenRecord.scope,
        };

        newIdToken = await jwksManager.signJWT(idTokenPayload, '1h');
      }

      // Update token
      await prisma.oauthToken.update({
        where: { id: tokenRecord.id },
        data: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
          idToken: newIdToken,
          expiresAt: new Date(Date.now() + expiresIn * 1000),
        },
      });

      return res.json({
        access_token: newAccessToken,
        token_type: 'Bearer',
        expires_in: expiresIn,
        refresh_token: newRefreshToken,
        id_token: newIdToken,
        scope: tokenRecord.scope,
      });
    }

    return res.status(400).json({
      error: 'unsupported_grant_type',
      error_description: 'Unsupported grant_type',
    });
  } catch (error) {
    console.error('Token endpoint error:', error);
    return res.status(500).json({
      error: 'server_error',
      error_description: 'Internal server error',
    });
  }
};

// Token introspection endpoint
export const introspectEndpoint = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.json({ active: false });
    }

    const tokenRecord = await prisma.oauthToken.findFirst({
      where: { accessToken: token },
      include: { user: true, client: true },
    });

    if (!tokenRecord) {
      return res.json({ active: false });
    }

    if (tokenRecord.expiresAt < new Date()) {
      return res.json({ active: false });
    }

    return res.json({
      active: true,
      scope: tokenRecord.scope,
      client_id: tokenRecord.client?.clientId,
      username: tokenRecord.user?.email,
      token_type: tokenRecord.tokenType,
      exp: Math.floor(tokenRecord.expiresAt.getTime() / 1000),
      iat: Math.floor(tokenRecord.createdAt.getTime() / 1000),
      sub: tokenRecord.userId,
    });
  } catch (error) {
    console.error('Introspection error:', error);
    return res.status(500).json({
      error: 'server_error',
      error_description: 'Internal server error',
    });
  }
};

// Token revocation endpoint
export const revokeEndpoint = async (req: Request, res: Response) => {
  try {
    const { token, token_type_hint } = req.body;

    if (!token) {
      return res.status(400).json({
        error: 'invalid_request',
        error_description: 'Missing token',
      });
    }

    // Find and delete token
    if (token_type_hint === 'refresh_token') {
      await prisma.oauthToken.deleteMany({
        where: { refreshToken: token },
      });
    } else {
      await prisma.oauthToken.deleteMany({
        where: { accessToken: token },
      });
    }

    return res.status(200).send();
  } catch (error) {
    console.error('Revocation error:', error);
    return res.status(500).json({
      error: 'server_error',
      error_description: 'Internal server error',
    });
  }
};
