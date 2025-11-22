// OAuth2/OIDC Client Implementation
import crypto from 'crypto';
import fetch from 'node-fetch';
import { jwksManager } from './jwks';

// Generate PKCE verifier and challenge
export function generatePKCE(): {
  verifier: string;
  challenge: string;
  method: string;
} {
  const verifier = crypto.randomBytes(32).toString('base64url');
  const challenge = crypto
    .createHash('sha256')
    .update(verifier)
    .digest('base64url');

  return {
    verifier,
    challenge,
    method: 'S256',
  };
}

// Fetch OpenID Connect Discovery Document
export async function fetchDiscoveryDocument(issuer: string): Promise<any> {
  const discoveryUrl = issuer.endsWith('/')
    ? `${issuer}.well-known/openid-configuration`
    : `${issuer}/.well-known/openid-configuration`;

  const response = await fetch(discoveryUrl);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch discovery document: ${response.statusText}`
    );
  }

  return await response.json();
}

// Build authorization URL for OAuth/OIDC login
export function buildAuthorizationUrl(
  provider: any,
  state: string,
  codeChallenge?: string,
  nonce?: string
): string {
  const params = new URLSearchParams({
    client_id: provider.clientId,
    response_type: 'code',
    redirect_uri: `${process.env.BASE_URL}/api/oauth/callback`,
    scope: Array.isArray(provider.scopes)
      ? provider.scopes.join(' ')
      : provider.scopes,
    state,
  });

  if (codeChallenge) {
    params.set('code_challenge', codeChallenge);
    params.set('code_challenge_method', 'S256');
  }

  if (nonce) {
    params.set('nonce', nonce);
  }

  return `${provider.authEndpoint}?${params.toString()}`;
}

// Exchange authorization code for tokens
export async function exchangeCodeForTokens(
  provider: any,
  code: string,
  codeVerifier?: string
): Promise<any> {
  const body: any = {
    grant_type: 'authorization_code',
    code,
    redirect_uri: `${process.env.BASE_URL}/api/oauth/callback`,
    client_id: provider.clientId,
    client_secret: provider.clientSecret,
  };

  if (codeVerifier) {
    body.code_verifier = codeVerifier;
  }

  const response = await fetch(provider.tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(body),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Token exchange failed: ${JSON.stringify(errorData)}`);
  }

  return await response.json();
}

// Validate and decode ID Token
export async function validateIdToken(
  idToken: string,
  provider: any,
  nonce?: string
): Promise<any> {
  try {
    if (!provider.jwksUri) {
      throw new Error('JWKS URI not configured for provider');
    }

    const payload = await jwksManager.verifyExternalJWT(
      idToken,
      provider.jwksUri,
      provider.issuer
    );

    // Validate nonce if provided
    if (nonce && payload.nonce !== nonce) {
      throw new Error('Nonce mismatch');
    }

    // Validate audience
    if (payload.aud !== provider.clientId) {
      throw new Error('Audience mismatch');
    }

    return payload;
  } catch (error) {
    console.error('ID Token validation error:', error);
    throw error;
  }
}

// Fetch user info from provider
export async function fetchUserInfo(
  provider: any,
  accessToken: string
): Promise<any> {
  if (!provider.userinfoEndpoint) {
    throw new Error('UserInfo endpoint not configured');
  }

  const response = await fetch(provider.userinfoEndpoint, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`UserInfo fetch failed: ${response.statusText}`);
  }

  return await response.json();
}

// Refresh access token
export async function refreshAccessToken(
  provider: any,
  refreshToken: string
): Promise<any> {
  const body = {
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: provider.clientId,
    client_secret: provider.clientSecret,
  };

  const response = await fetch(provider.tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(body),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Token refresh failed: ${JSON.stringify(errorData)}`);
  }

  return await response.json();
}

// Introspect token (if supported by provider)
export async function introspectToken(
  provider: any,
  token: string
): Promise<any> {
  const introspectionEndpoint =
    provider.introspectionEndpoint ||
    `${provider.issuer}/oauth/introspect`;

  const body = {
    token,
    client_id: provider.clientId,
    client_secret: provider.clientSecret,
  };

  const response = await fetch(introspectionEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(body),
  });

  if (!response.ok) {
    throw new Error(`Token introspection failed: ${response.statusText}`);
  }

  return await response.json();
}

// Revoke token
export async function revokeToken(
  provider: any,
  token: string,
  tokenTypeHint: 'access_token' | 'refresh_token' = 'access_token'
): Promise<void> {
  const revocationEndpoint =
    provider.revocationEndpoint || `${provider.issuer}/oauth/revoke`;

  const body = {
    token,
    token_type_hint: tokenTypeHint,
    client_id: provider.clientId,
    client_secret: provider.clientSecret,
  };

  const response = await fetch(revocationEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(body),
  });

  if (!response.ok && response.status !== 200) {
    throw new Error(`Token revocation failed: ${response.statusText}`);
  }
}
