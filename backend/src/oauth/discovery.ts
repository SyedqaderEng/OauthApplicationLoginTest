// OpenID Connect Discovery Document
import { Request, Response } from 'express';

export const getDiscoveryDocument = (req: Request, res: Response) => {
  const issuer = process.env.ISSUER || `${req.protocol}://${req.get('host')}`;

  const discoveryDocument = {
    issuer,
    authorization_endpoint: `${issuer}/oauth/authorize`,
    token_endpoint: `${issuer}/oauth/token`,
    userinfo_endpoint: `${issuer}/oauth/userinfo`,
    jwks_uri: `${issuer}/jwks`,
    registration_endpoint: `${issuer}/oauth/register`,
    introspection_endpoint: `${issuer}/oauth/introspect`,
    revocation_endpoint: `${issuer}/oauth/revoke`,

    // Supported features
    response_types_supported: [
      'code',
      'token',
      'id_token',
      'code token',
      'code id_token',
      'token id_token',
      'code token id_token',
    ],
    response_modes_supported: ['query', 'fragment', 'form_post'],
    grant_types_supported: [
      'authorization_code',
      'client_credentials',
      'refresh_token',
      'implicit',
    ],
    subject_types_supported: ['public'],
    id_token_signing_alg_values_supported: ['RS256'],
    token_endpoint_auth_methods_supported: [
      'client_secret_basic',
      'client_secret_post',
      'none',
    ],

    // PKCE support
    code_challenge_methods_supported: ['plain', 'S256'],

    // Scopes
    scopes_supported: [
      'openid',
      'profile',
      'email',
      'address',
      'phone',
      'offline_access',
    ],

    // Claims
    claims_supported: [
      'sub',
      'iss',
      'aud',
      'exp',
      'iat',
      'name',
      'email',
      'email_verified',
      'preferred_username',
      'given_name',
      'family_name',
      'picture',
    ],

    // Additional endpoints
    end_session_endpoint: `${issuer}/oauth/logout`,
    check_session_iframe: `${issuer}/oauth/check_session`,
  };

  res.json(discoveryDocument);
};
