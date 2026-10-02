import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { errors } from '../../lib/error';
import { prisma } from '../../lib/prisma';
import { RegisterInput, LoginInput } from '@caresync/shared';
import { logger } from '../../lib/logger';

export const authService = {
  async register(data: RegisterInput) {
    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: data.email }, { phone: data.phone }],
      },
    });

    if (existingUser?.email === data.email) {
      throw errors.EMAIL_ALREADY_EXISTS();
    }
    if (existingUser?.phone === data.phone) {
      throw errors.PHONE_ALREADY_EXISTS();
    }

    // Hash password
    const passwordHash = await bcryptjs.hash(data.password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        phone: data.phone,
        name: data.name,
        passwordHash,
        role: data.role,
        status: 'ACTIVE',
      },
    });

    // Create role-specific profile
    if (data.role === 'PATIENT') {
      await prisma.patientProfile.create({
        data: {
          userId: user.id,
        },
      });

      await prisma.wallet.create({
        data: {
          userId: user.id,
          balance: 0,
        },
      });

      await prisma.notificationPreference.create({
        data: {
          userId: user.id,
        },
      });
    } else if (data.role === 'DOCTOR') {
 // Create minimal doctor profile for testing
 await prisma.doctorProfile.create({
 data: {
 userId: user.id,
 registrationNumber: 'REG-' + user.id.substring(0, 8).toUpperCase(),
 experience: 5,
 consultationFee: 50000,
 },
 });
 }

    logger.info(`User registered: ${user.email} (${user.role})`);

    // Generate tokens for auto-login
    const accessToken = jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      env.jwtSecret,
      { expiresIn: '24h' }
    );

    const refreshToken = jwt.sign(
      { sub: user.id },
      env.jwtRefreshSecret,
      { expiresIn: '7d' }
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  },

  async login(data: LoginInput) {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw errors.INVALID_CREDENTIALS();
    }

    // Check password
    const passwordMatch = await bcryptjs.compare(data.password, user.passwordHash);
    if (!passwordMatch) {
      throw errors.INVALID_CREDENTIALS();
    }

    // Check if user is active
    if (user.status !== 'ACTIVE') {
      throw new Error('User account is not active');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate tokens
    const tokens = this.generateTokens(user);

    logger.info(`User logged in: ${user.email}`);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      ...tokens,
    };
  },

  generateTokens(user: any) {
    const accessToken = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
      },
      env.jwtSecret as string,
      { expiresIn: env.jwtExpiry } as any,
    );

    const refreshToken = jwt.sign(
      {
        sub: user.id,
        type: 'refresh',
      },
      env.jwtRefreshSecret as string,
      { expiresIn: env.jwtRefreshExpiry } as any,
    );

    return { accessToken, refreshToken };
  },

  async refreshToken(refreshToken: string) {
    try {
      const decoded = jwt.verify(refreshToken, env.jwtRefreshSecret) as any;

      const user = await prisma.user.findUnique({
        where: { id: decoded.sub },
      });

      if (!user) {
        throw errors.INVALID_TOKEN();
      }

      const tokens = this.generateTokens(user);

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        ...tokens,
      };
    } catch (error) {
      throw errors.INVALID_TOKEN();
    }
  },

  async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw errors.NOT_FOUND('User');
    }

    return user;
  },

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if user exists
      logger.info(`Forgot password request for non-existent email: ${email}`);
      return { message: 'If email exists, you will receive a password reset link' };
    }

    // Generate reset token (valid for 1 hour)
    const resetToken = jwt.sign(
      { sub: user.id, type: 'reset' },
      env.jwtSecret,
      { expiresIn: '1h' },
    );

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetTokenExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    logger.info(`Password reset requested for: ${email}`);

    return { message: 'If email exists, you will receive a password reset link' };
  },

  async resetPassword(token: string, newPassword: string) {
    try {
      const decoded = jwt.verify(token, env.jwtSecret) as any;

      const user = await prisma.user.findUnique({
        where: { id: decoded.sub },
      });

      if (!user || user.passwordResetToken !== token) {
        throw errors.INVALID_TOKEN();
      }

      if (user.passwordResetTokenExpiresAt && user.passwordResetTokenExpiresAt < new Date()) {
        throw new Error('Password reset token expired');
      }

      const passwordHash = await bcryptjs.hash(newPassword, 10);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          passwordResetToken: null,
          passwordResetTokenExpiresAt: null,
        },
      });

      logger.info(`Password reset for: ${user.email}`);

      return { message: 'Password reset successfully' };
    } catch (error) {
      throw errors.INVALID_TOKEN();
    }
  },
};




