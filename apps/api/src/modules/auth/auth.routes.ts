import { Router, Request, Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';
import { verifyAuth } from '../../middleware/auth';
import { registerSchema, loginSchema } from '@caresync/shared';
import { authService } from './auth.service';
import { logger } from '../../lib/logger';

const router = Router();

/**
 * POST /auth/register
 * Register a new user
 */
router.post(
  '/register',
  asyncHandler(async (req: Request, res: Response) => {
    const data = registerSchema.parse(req.body);
    const result = await authService.register(data);

    // Set refresh token in httpOnly cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      success: true,
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  }),
);

/**
 * POST /auth/login
 * Login and get access token
 */
router.post(
  '/login',
  asyncHandler(async (req: Request, res: Response) => {
    const data = loginSchema.parse(req.body);
    const result = await authService.login(data);

    // Set refresh token in httpOnly cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      success: true,
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  }),
);

/**
 * POST /auth/refresh
 * Refresh access token
 */
router.post(
  '/refresh',
  asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Refresh token required',
        },
      });
    }

    const result = await authService.refreshToken(refreshToken);

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  }),
);

/**
 * GET /auth/me
 * Get current user
 */
router.get(
  '/me',
  verifyAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const user = await authService.getCurrentUser(req.userId!);

    res.json({
      success: true,
      data: user,
    });
  }),
);

/**
 * POST /auth/logout
 * Logout (clear cookies)
 */
router.post(
  '/logout',
  asyncHandler(async (req: Request, res: Response) => {
    res.clearCookie('refreshToken');

    res.json({
      success: true,
      data: { message: 'Logged out successfully' },
    });
  }),
);

/**
 * POST /auth/forgot-password
 * Request password reset
 */
router.post(
  '/forgot-password',
  asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Email required' },
      });
    }

    const result = await authService.forgotPassword(email);

    res.json({
      success: true,
      data: result,
    });
  }),
);

/**
 * POST /auth/reset-password
 * Reset password with token
 */
router.post(
  '/reset-password',
  asyncHandler(async (req: Request, res: Response) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Token and new password required',
        },
      });
    }

    const result = await authService.resetPassword(token, newPassword);

    res.json({
      success: true,
      data: result,
    });
  }),
);

export default router;
