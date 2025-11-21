// OAuth Provider Configuration API
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { fetchDiscoveryDocument } from '../oauth/client';

const prisma = new PrismaClient();

// Add external OAuth provider
export const addProvider = async (req: Request, res: Response) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({
        error: 'unauthorized',
        message: 'Authentication required',
      });
    }

    const {
      name,
      issuer,
      clientId,
      clientSecret,
      scopes,
      discoveryUrl,
      authEndpoint,
      tokenEndpoint,
      userinfoEndpoint,
      jwksUri,
    } = req.body;

    // Validation
    if (!name || !clientId || !clientSecret) {
      return res.status(400).json({
        error: 'invalid_request',
        message: 'Name, clientId, and clientSecret are required',
      });
    }

    let providerConfig: any = {
      name,
      issuer,
      clientId,
      clientSecret,
      scopes: scopes || ['openid', 'profile', 'email'],
    };

    // If discovery URL or issuer is provided, fetch discovery document
    if (discoveryUrl || issuer) {
      try {
        const discovery = await fetchDiscoveryDocument(
          discoveryUrl || issuer
        );

        providerConfig = {
          ...providerConfig,
          issuer: discovery.issuer,
          discoveryUrl: discoveryUrl || `${issuer}/.well-known/openid-configuration`,
          authEndpoint: discovery.authorization_endpoint,
          tokenEndpoint: discovery.token_endpoint,
          userinfoEndpoint: discovery.userinfo_endpoint,
          jwksUri: discovery.jwks_uri,
        };
      } catch (error: any) {
        console.error('Discovery fetch error:', error);
        // If discovery fails, use manual endpoints if provided
        if (!authEndpoint || !tokenEndpoint) {
          return res.status(400).json({
            error: 'invalid_request',
            message:
              'Failed to fetch discovery document. Please provide auth and token endpoints manually.',
            details: error.message,
          });
        }

        providerConfig = {
          ...providerConfig,
          discoveryUrl,
          authEndpoint,
          tokenEndpoint,
          userinfoEndpoint,
          jwksUri,
        };
      }
    } else if (authEndpoint && tokenEndpoint) {
      // Manual configuration
      providerConfig = {
        ...providerConfig,
        authEndpoint,
        tokenEndpoint,
        userinfoEndpoint,
        jwksUri,
      };
    } else {
      return res.status(400).json({
        error: 'invalid_request',
        message:
          'Either issuer/discoveryUrl OR manual endpoints (authEndpoint, tokenEndpoint) must be provided',
      });
    }

    // Create provider
    const provider = await prisma.oauthProvider.create({
      data: providerConfig,
    });

    // Log event
    await prisma.oauthLog.create({
      data: {
        userId: req.session.userId,
        eventType: 'provider_added',
        status: 'success',
        details: {
          providerId: provider.id,
          providerName: provider.name,
        },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    return res.status(201).json({
      success: true,
      provider: {
        id: provider.id,
        name: provider.name,
        issuer: provider.issuer,
        authEndpoint: provider.authEndpoint,
        tokenEndpoint: provider.tokenEndpoint,
        userinfoEndpoint: provider.userinfoEndpoint,
        jwksUri: provider.jwksUri,
        scopes: provider.scopes,
        active: provider.active,
      },
    });
  } catch (error) {
    console.error('Add provider error:', error);
    return res.status(500).json({
      error: 'server_error',
      message: 'Internal server error',
    });
  }
};

// Get all providers
export const getProviders = async (req: Request, res: Response) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({
        error: 'unauthorized',
        message: 'Authentication required',
      });
    }

    const providers = await prisma.oauthProvider.findMany({
      select: {
        id: true,
        name: true,
        issuer: true,
        authEndpoint: true,
        tokenEndpoint: true,
        userinfoEndpoint: true,
        jwksUri: true,
        scopes: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.json({ providers });
  } catch (error) {
    console.error('Get providers error:', error);
    return res.status(500).json({
      error: 'server_error',
      message: 'Internal server error',
    });
  }
};

// Get single provider
export const getProvider = async (req: Request, res: Response) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({
        error: 'unauthorized',
        message: 'Authentication required',
      });
    }

    const { id } = req.params;

    const provider = await prisma.oauthProvider.findUnique({
      where: { id },
    });

    if (!provider) {
      return res.status(404).json({
        error: 'not_found',
        message: 'Provider not found',
      });
    }

    return res.json({ provider });
  } catch (error) {
    console.error('Get provider error:', error);
    return res.status(500).json({
      error: 'server_error',
      message: 'Internal server error',
    });
  }
};

// Update provider
export const updateProvider = async (req: Request, res: Response) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({
        error: 'unauthorized',
        message: 'Authentication required',
      });
    }

    const { id } = req.params;
    const {
      name,
      clientId,
      clientSecret,
      scopes,
      active,
      authEndpoint,
      tokenEndpoint,
      userinfoEndpoint,
      jwksUri,
    } = req.body;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (clientId) updateData.clientId = clientId;
    if (clientSecret) updateData.clientSecret = clientSecret;
    if (scopes) updateData.scopes = scopes;
    if (typeof active === 'boolean') updateData.active = active;
    if (authEndpoint) updateData.authEndpoint = authEndpoint;
    if (tokenEndpoint) updateData.tokenEndpoint = tokenEndpoint;
    if (userinfoEndpoint) updateData.userinfoEndpoint = userinfoEndpoint;
    if (jwksUri) updateData.jwksUri = jwksUri;

    const provider = await prisma.oauthProvider.update({
      where: { id },
      data: updateData,
    });

    return res.json({
      success: true,
      provider,
    });
  } catch (error) {
    console.error('Update provider error:', error);
    return res.status(500).json({
      error: 'server_error',
      message: 'Internal server error',
    });
  }
};

// Delete provider
export const deleteProvider = async (req: Request, res: Response) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({
        error: 'unauthorized',
        message: 'Authentication required',
      });
    }

    const { id } = req.params;

    await prisma.oauthProvider.delete({
      where: { id },
    });

    return res.json({
      success: true,
      message: 'Provider deleted successfully',
    });
  } catch (error) {
    console.error('Delete provider error:', error);
    return res.status(500).json({
      error: 'server_error',
      message: 'Internal server error',
    });
  }
};

// Test provider connection (fetch discovery document)
export const testProvider = async (req: Request, res: Response) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({
        error: 'unauthorized',
        message: 'Authentication required',
      });
    }

    const { issuer } = req.body;

    if (!issuer) {
      return res.status(400).json({
        error: 'invalid_request',
        message: 'Issuer URL is required',
      });
    }

    const discovery = await fetchDiscoveryDocument(issuer);

    return res.json({
      success: true,
      discovery,
    });
  } catch (error: any) {
    console.error('Test provider error:', error);
    return res.status(400).json({
      error: 'discovery_failed',
      message: 'Failed to fetch discovery document',
      details: error.message,
    });
  }
};
