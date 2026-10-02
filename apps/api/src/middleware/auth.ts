import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { errors, AppError } from '../lib/error';
import { UserRole } from '@caresync/shared';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      email?: string;
      role?: UserRole;
      user?: {
        id: string;
        email: string;
        role: UserRole;
      };
    }
  }
}

export const verifyAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.accessToken || req.headers.authorization?.split(' ')[1];

    if (!token) {
      throw errors.UNAUTHORIZED();
    }

    const decoded = jwt.verify(token, env.jwtSecret) as any;

    req.userId = decoded.sub;
    req.email = decoded.email;
    req.role = decoded.role;
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      });
    } else {
      throw errors.INVALID_TOKEN();
    }
  }
};

export const requireRole = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.role || !roles.includes(req.role)) {
      throw errors.FORBIDDEN();
    }
    next();
  };
};

export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.accessToken || req.headers.authorization?.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, env.jwtSecret) as any;
      req.userId = decoded.sub;
      req.email = decoded.email;
      req.role = decoded.role;
    }
  } catch (error) {
    // Silently ignore auth errors for optional auth
  }

  next();
};
