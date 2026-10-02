import { createApp } from './app';
import { env } from './config/env';
import { logger } from './lib/logger';
import { prisma } from './lib/prisma';
import { createServer } from 'http';
import { RealtimeGateway } from './realtime/gateway';
import { jobScheduler } from './jobs/scheduler';

const app = createApp();
const httpServer = createServer(app);

// Initialize Socket.IO
const realtimeGateway = new RealtimeGateway(httpServer);
app.locals.realtimeGateway = realtimeGateway;

// Make gateway available globally for other modules
(global as any).realtimeGateway = realtimeGateway;

const start = async () => {
  try {
    // Test database connection
    logger.info('Testing database connection...');
    await prisma.$queryRaw`SELECT 1`;
    logger.info('✅ Database connected');

    // Start job scheduler
    jobScheduler.start();

    // Start server with HTTP and WebSocket
    httpServer.listen(env.apiPort, env.apiHost, () => {
      logger.info(
        `🚀 Server running at http://${env.apiHost}:${env.apiPort}`,
      );
      logger.info(`Environment: ${env.nodeEnv}`);
      logger.info(`WebSocket ready at ws://${env.apiHost}:${env.apiPort}`);
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      logger.info('Shutting down gracefully...');
      jobScheduler.stop();
      httpServer.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
};

start();
