// OAuth Provider Management
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// Register a new OAuth client
export const registerClient = async (req: Request, res: Response) => {
  try {
    const {
      name,
      redirect_uris,
      scopes,
      grant_types,
      token_endpoint_auth_method,
    } = req.body;

    if (!name || !redirect_uris || !Array.isArray(redirect_uris)) {
      return res.status(400).json({
        error: 'invalid_request',
        error_description: 'Missing or invalid required fields',
      });
    }

    // Generate client credentials
    const clientId = uuidv4();
    const clientSecret = uuidv4();
    const clientSecretHash = await bcrypt.hash(clientSecret, 10);

    const client = await prisma.oauthClient.create({
      data: {
        clientId,
        clientSecretHash,
        name,
        redirectUris: redirect_uris,
        scopes: scopes || ['openid', 'profile', 'email'],
        grantTypes: grant_types || ['authorization_code', 'refresh_token'],
        tokenEndpointAuthMethod:
          token_endpoint_auth_method || 'client_secret_basic',
        active: true,
      },
    });

    return res.status(201).json({
      client_id: client.clientId,
      client_secret: clientSecret, // Only returned once!
      client_name: client.name,
      redirect_uris: client.redirectUris,
      grant_types: client.grantTypes,
      token_endpoint_auth_method: client.tokenEndpointAuthMethod,
    });
  } catch (error) {
    console.error('Client registration error:', error);
    return res.status(500).json({
      error: 'server_error',
      error_description: 'Internal server error',
    });
  }
};

// Get all registered clients (admin only)
export const getClients = async (_req: Request, res: Response) => {
  try {
    const clients = await prisma.oauthClient.findMany({
      select: {
        id: true,
        clientId: true,
        name: true,
        redirectUris: true,
        scopes: true,
        grantTypes: true,
        tokenEndpointAuthMethod: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.json({ clients });
  } catch (error) {
    console.error('Get clients error:', error);
    return res.status(500).json({
      error: 'server_error',
      error_description: 'Internal server error',
    });
  }
};

// Get a specific client
export const getClient = async (req: Request, res: Response) => {
  try {
    const { clientId } = req.params;

    const client = await prisma.oauthClient.findUnique({
      where: { clientId },
      select: {
        id: true,
        clientId: true,
        name: true,
        redirectUris: true,
        scopes: true,
        grantTypes: true,
        tokenEndpointAuthMethod: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!client) {
      return res.status(404).json({
        error: 'not_found',
        error_description: 'Client not found',
      });
    }

    return res.json(client);
  } catch (error) {
    console.error('Get client error:', error);
    return res.status(500).json({
      error: 'server_error',
      error_description: 'Internal server error',
    });
  }
};

// Update client
export const updateClient = async (req: Request, res: Response) => {
  try {
    const { clientId } = req.params;
    const { name, redirect_uris, scopes, active } = req.body;

    const client = await prisma.oauthClient.update({
      where: { clientId },
      data: {
        ...(name && { name }),
        ...(redirect_uris && { redirectUris: redirect_uris }),
        ...(scopes && { scopes }),
        ...(typeof active === 'boolean' && { active }),
      },
    });

    return res.json({
      client_id: client.clientId,
      client_name: client.name,
      redirect_uris: client.redirectUris,
      scopes: client.scopes,
      active: client.active,
    });
  } catch (error) {
    console.error('Update client error:', error);
    return res.status(500).json({
      error: 'server_error',
      error_description: 'Internal server error',
    });
  }
};

// Delete client
export const deleteClient = async (req: Request, res: Response) => {
  try {
    const { clientId } = req.params;

    await prisma.oauthClient.delete({
      where: { clientId },
    });

    return res.status(204).send();
  } catch (error) {
    console.error('Delete client error:', error);
    return res.status(500).json({
      error: 'server_error',
      error_description: 'Internal server error',
    });
  }
};
