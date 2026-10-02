import { Request, Response, NextFunction } from 'express';
import { AppError } from '../lib/error';
import { logger } from '../lib/logger';
import { ZodError } from 'zod';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const requestId = (req as any).id || 'unknown';

  if (err instanceof ZodError) {
    logger.warn(`Validation error: ${requestId}`, err.errors);
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: err.errors,
      },
    });
  }

  if (err instanceof AppError) {
    logger.warn(`App error: ${err.code} - ${err.message}`, { requestId });
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
  }

  logger.error(`Unexpected error: ${requestId}`, {
    message: err?.message,
    stack: err?.stack,
  });

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
    },
  });
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
