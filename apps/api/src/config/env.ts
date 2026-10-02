export const env = {
  // Database
  databaseUrl: process.env.DATABASE_URL || 'postgresql://caresync:caresync_dev_password@localhost:5432/caresync',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

  // Server
  apiPort: parseInt(process.env.API_PORT || '3000', 10),
  apiHost: process.env.API_HOST || 'localhost',
  nodeEnv: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',

  // Frontend
  frontendUrl: process.env.VITE_API_URL || 'http://localhost:5173',
  wsUrl: process.env.VITE_WS_URL || 'ws://localhost:3000',

  // JWT
  jwtSecret: process.env.JWT_SECRET || 'dev_jwt_secret_change_in_production',
  jwtExpiry: process.env.JWT_EXPIRY || '15m',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret_change_in_production',
  jwtRefreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',

  // Providers
  paymentProvider: process.env.PAYMENT_PROVIDER || 'mock',
  emailProvider: process.env.EMAIL_PROVIDER || 'log',
  symptomMatcherProvider: process.env.SYMPTOM_MATCHER_PROVIDER || 'deterministic',

  // API Keys
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  openaiApiKey: process.env.OPENAI_API_KEY,
  razorpayKeyId: process.env.RAZORPAY_KEY_ID,
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET,

  // Push Notifications
  vapidPublicKey: process.env.VAPID_PUBLIC_KEY,
  vapidPrivateKey: process.env.VAPID_PRIVATE_KEY,
  vapidSubject: process.env.VAPID_SUBJECT,

  // File Upload
  maxUploadSizeMb: parseInt(process.env.MAX_UPLOAD_SIZE_MB || '10', 10),
  uploadDir: process.env.UPLOAD_DIR || './uploads',

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',

  // Security
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',

  // Demo
  seedDemoData: process.env.SEED_DEMO_DATA !== 'false',
};
