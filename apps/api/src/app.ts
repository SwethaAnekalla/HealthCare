import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { errorHandler, asyncHandler } from './middleware/errorHandler';
import { logger } from './lib/logger';

// Import routes
import authRoutes from './modules/auth/auth.routes';
import searchRoutes from './modules/search/search.routes';
import appointmentRoutes from './modules/appointments/appointments.routes';
import featuresRoutes from './modules/features.routes';

export const createApp = (): Express => {
  const app = express();

  // Middleware
  app.use(helmet());
  app.use(cors({
    origin: env.corsOrigin,
    credentials: true,
  }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));
  app.use(cookieParser());

  // Request ID middleware
  app.use((req, res, next) => {
    (req as any).id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    next();
  });

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API v1 routes
  const apiRouter = express.Router();

  apiRouter.get('/health', (req, res) => {
    res.json({
      success: true,
      data: {
        status: 'running',
        timestamp: new Date().toISOString(),
      },
    });
  });

  // Mount API routes
  apiRouter.use('/auth', authRoutes);
  apiRouter.use('/search', searchRoutes);
  apiRouter.use('/appointments', appointmentRoutes);
  apiRouter.use('/features', featuresRoutes);
  apiRouter.use('/', featuresRoutes); // Mount at root for convenience

  app.use('/api/v1', apiRouter);
  
  // Support /api prefix for compatibility
  app.use('/api', apiRouter);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Route not found',
      },
    });
  });

  // Error handler
  app.use(errorHandler);

  return app;
};
