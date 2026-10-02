import { env } from '../config/env';

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

const levels: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const currentLevel = levels[env.logLevel as LogLevel] || levels.info;

export const logger = {
  error: (message: string, meta?: any) => {
    if (levels.error <= currentLevel) {
      console.error(`[ERROR] ${message}`, meta);
    }
  },

  warn: (message: string, meta?: any) => {
    if (levels.warn <= currentLevel) {
      console.warn(`[WARN] ${message}`, meta);
    }
  },

  info: (message: string, meta?: any) => {
    if (levels.info <= currentLevel) {
      console.log(`[INFO] ${message}`, meta);
    }
  },

  debug: (message: string, meta?: any) => {
    if (levels.debug <= currentLevel) {
      console.debug(`[DEBUG] ${message}`, meta);
    }
  },
};
