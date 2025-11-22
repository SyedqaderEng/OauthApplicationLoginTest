// Authentication API - Local user signup/login
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Signup endpoint
export const signup = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        error: 'invalid_request',
        message: 'Email and password are required',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: 'invalid_request',
        message: 'Password must be at least 6 characters',
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({
        error: 'user_exists',
        message: 'User with this email already exists',
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
      },
    });

    // Create session
    req.session.userId = user.id;
    req.session.email = user.email;

    // Log event
    await prisma.oauthLog.create({
      data: {
        userId: user.id,
        eventType: 'user_signup',
        status: 'success',
        details: { email: user.email },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    return res.status(201).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({
      error: 'server_error',
      message: 'Internal server error',
    });
  }
};

// Login endpoint
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        error: 'invalid_request',
        message: 'Email and password are required',
      });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({
        error: 'invalid_credentials',
        message: 'Invalid email or password',
      });
    }

    // Verify password
    const passwordValid = await bcrypt.compare(password, user.passwordHash);

    if (!passwordValid) {
      // Log failed attempt
      await prisma.oauthLog.create({
        data: {
          userId: user.id,
          eventType: 'login_failed',
          status: 'failure',
          details: { reason: 'invalid_password' },
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        },
      });

      return res.status(401).json({
        error: 'invalid_credentials',
        message: 'Invalid email or password',
      });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Create session
    req.session.userId = user.id;
    req.session.email = user.email;

    // Log successful login
    await prisma.oauthLog.create({
      data: {
        userId: user.id,
        eventType: 'login_success',
        status: 'success',
        details: { email: user.email },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    return res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        lastLoginAt: user.lastLoginAt,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      error: 'server_error',
      message: 'Internal server error',
    });
  }
};

// Logout endpoint
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.session.userId;

    req.session.destroy((err) => {
      if (err) {
        console.error('Session destruction error:', err);
        return res.status(500).json({
          error: 'server_error',
          message: 'Failed to logout',
        });
      }

      // Log logout
      if (userId) {
        prisma.oauthLog.create({
          data: {
            userId,
            eventType: 'logout',
            status: 'success',
            details: {},
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
          },
        });
      }

      return res.json({
        success: true,
        message: 'Logged out successfully',
      });
    });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      error: 'server_error',
      message: 'Internal server error',
    });
  }
};

// Get current user
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({
        error: 'unauthorized',
        message: 'Not authenticated',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.session.userId },
      select: {
        id: true,
        email: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        error: 'not_found',
        message: 'User not found',
      });
    }

    return res.json({ user });
  } catch (error) {
    console.error('Get current user error:', error);
    return res.status(500).json({
      error: 'server_error',
      message: 'Internal server error',
    });
  }
};

// Middleware to check authentication
export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.session.userId) {
    res.status(401).json({
      error: 'unauthorized',
      message: 'Authentication required',
    });
    return;
  }
  next();
};

// Get user's OAuth tokens
export const getUserTokens = async (req: Request, res: Response) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({
        error: 'unauthorized',
        message: 'Not authenticated',
      });
    }

    const tokens = await prisma.oauthToken.findMany({
      where: { userId: req.session.userId },
      include: {
        client: {
          select: {
            name: true,
            clientId: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Mask tokens for security
    const maskedTokens = tokens.map((token) => ({
      id: token.id,
      client: token.client,
      accessToken: `${token.accessToken.substring(0, 8)}...`,
      hasRefreshToken: !!token.refreshToken,
      hasIdToken: !!token.idToken,
      expiresAt: token.expiresAt,
      createdAt: token.createdAt,
      scope: token.scope,
      tokenType: token.tokenType,
    }));

    return res.json({ tokens: maskedTokens });
  } catch (error) {
    console.error('Get user tokens error:', error);
    return res.status(500).json({
      error: 'server_error',
      message: 'Internal server error',
    });
  }
};

// Get OAuth logs
export const getOAuthLogs = async (req: Request, res: Response) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({
        error: 'unauthorized',
        message: 'Not authenticated',
      });
    }

    const { limit = 50 } = req.query;

    const logs = await prisma.oauthLog.findMany({
      where: { userId: req.session.userId },
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
    });

    return res.json({ logs });
  } catch (error) {
    console.error('Get OAuth logs error:', error);
    return res.status(500).json({
      error: 'server_error',
      message: 'Internal server error',
    });
  }
};
