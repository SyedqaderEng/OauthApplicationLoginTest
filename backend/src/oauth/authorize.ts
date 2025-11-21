// OAuth2 Authorization Endpoint
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

const prisma = new PrismaClient();

export const authorizeEndpoint = async (req: Request, res: Response) => {
  try {
    const {
      client_id,
      redirect_uri,
      response_type,
      scope,
      state,
      code_challenge,
      code_challenge_method,
      nonce,
    } = req.query;

    // Validate required parameters
    if (!client_id || !redirect_uri || !response_type) {
      return res.status(400).json({
        error: 'invalid_request',
        error_description: 'Missing required parameters',
      });
    }

    // Validate client
    const client = await prisma.oauthClient.findUnique({
      where: { clientId: client_id as string },
    });

    if (!client || !client.active) {
      return res.status(400).json({
        error: 'invalid_client',
        error_description: 'Client not found or inactive',
      });
    }

    // Validate redirect URI
    const redirectUris = client.redirectUris as string[];
    if (!redirectUris.includes(redirect_uri as string)) {
      return res.status(400).json({
        error: 'invalid_request',
        error_description: 'Invalid redirect_uri',
      });
    }

    // Check if user is authenticated
    if (!req.session.userId) {
      // Redirect to login page with return URL
      const returnUrl = encodeURIComponent(req.originalUrl);
      return res.redirect(`/login?return_url=${returnUrl}`);
    }

    // For authorization code flow
    if (response_type === 'code') {
      // Generate authorization code
      const code = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Store authorization code
      await prisma.authorizationCode.create({
        data: {
          code,
          clientId: client_id as string,
          userId: req.session.userId!,
          redirectUri: redirect_uri as string,
          scope: scope as string,
          codeChallenge: code_challenge as string,
          codeChallengeMethod: code_challenge_method as string,
          expiresAt,
        },
      });

      // Log event
      await prisma.oauthLog.create({
        data: {
          userId: req.session.userId!,
          eventType: 'authorization_code_issued',
          status: 'success',
          details: {
            clientId: client_id,
            scope,
            state,
          },
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        },
      });

      // Redirect back to client with code
      const redirectUrl = new URL(redirect_uri as string);
      redirectUrl.searchParams.set('code', code);
      if (state) {
        redirectUrl.searchParams.set('state', state as string);
      }

      return res.redirect(redirectUrl.toString());
    }

    // For implicit flow (token or id_token in response_type)
    if (response_type.includes('token') || response_type.includes('id_token')) {
      return res.status(400).json({
        error: 'unsupported_response_type',
        error_description: 'Implicit flow not fully implemented in this example',
      });
    }

    return res.status(400).json({
      error: 'unsupported_response_type',
      error_description: 'Unsupported response_type',
    });
  } catch (error) {
    console.error('Authorization error:', error);
    return res.status(500).json({
      error: 'server_error',
      error_description: 'Internal server error',
    });
  }
};

// Consent page (optional - can auto-consent for trusted clients)
export const consentPage = async (req: Request, res: Response) => {
  const { client_id, scope } = req.query;

  if (!req.session.userId) {
    return res.redirect('/login');
  }

  const client = await prisma.oauthClient.findUnique({
    where: { clientId: client_id as string },
  });

  if (!client) {
    return res.status(400).send('Invalid client');
  }

  // Return HTML consent page
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Authorization Consent</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 50px auto;
            padding: 20px;
          }
          .consent-box {
            border: 1px solid #ddd;
            padding: 20px;
            border-radius: 8px;
          }
          button {
            padding: 10px 20px;
            margin: 10px 5px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
          }
          .allow { background: #4CAF50; color: white; }
          .deny { background: #f44336; color: white; }
        </style>
      </head>
      <body>
        <div class="consent-box">
          <h2>Authorization Request</h2>
          <p><strong>${client.name}</strong> is requesting access to your account.</p>
          <p><strong>Requested scopes:</strong> ${scope || 'openid profile email'}</p>
          <form method="POST" action="/oauth/consent">
            <input type="hidden" name="client_id" value="${client_id}" />
            <input type="hidden" name="scope" value="${scope}" />
            <button type="submit" name="consent" value="allow" class="allow">Allow</button>
            <button type="submit" name="consent" value="deny" class="deny">Deny</button>
          </form>
        </div>
      </body>
    </html>
  `);
};
