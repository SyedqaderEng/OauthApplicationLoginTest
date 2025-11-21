// OAuth2 UserInfo Endpoint
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const userinfoEndpoint = async (req: Request, res: Response) => {
  try {
    // Extract access token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'invalid_token',
        error_description: 'Missing or invalid authorization header',
      });
    }

    const accessToken = authHeader.substring(7);

    // Find token in database
    const tokenRecord = await prisma.oauthToken.findFirst({
      where: { accessToken },
      include: { user: true },
    });

    if (!tokenRecord) {
      return res.status(401).json({
        error: 'invalid_token',
        error_description: 'Invalid access token',
      });
    }

    // Check if token is expired
    if (tokenRecord.expiresAt < new Date()) {
      return res.status(401).json({
        error: 'invalid_token',
        error_description: 'Access token expired',
      });
    }

    if (!tokenRecord.user) {
      return res.status(404).json({
        error: 'not_found',
        error_description: 'User not found',
      });
    }

    // Build userinfo response based on scopes
    const scopes = tokenRecord.scope?.split(' ') || [];
    const userInfo: any = {
      sub: tokenRecord.user.id,
    };

    if (scopes.includes('profile')) {
      userInfo.name = tokenRecord.user.email.split('@')[0];
      userInfo.preferred_username = tokenRecord.user.email.split('@')[0];
    }

    if (scopes.includes('email')) {
      userInfo.email = tokenRecord.user.email;
      userInfo.email_verified = true;
    }

    // Log access
    await prisma.oauthLog.create({
      data: {
        userId: tokenRecord.user.id,
        eventType: 'userinfo_accessed',
        status: 'success',
        details: {
          scopes: tokenRecord.scope,
        },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    return res.json(userInfo);
  } catch (error) {
    console.error('UserInfo error:', error);
    return res.status(500).json({
      error: 'server_error',
      error_description: 'Internal server error',
    });
  }
};
