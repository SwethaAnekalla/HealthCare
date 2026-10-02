import { checkRefundSLABreachers, processApprovedRefunds } from './refund-sla-checker';
import {
  handleNoShowAppointments,
  updateQueueETAs,
  cleanupStaleQueues,
  propagateDoctorStatusChanges,
} from './queue-monitor';
import { logger } from '../lib/logger';

export class JobScheduler {
  private jobs: Map<string, NodeJS.Timeout> = new Map();

  start() {
    logger.info('Starting job scheduler...');

    // Refund SLA check - every 5 minutes
    this.scheduleJob('refund-sla-check', 5 * 60 * 1000, checkRefundSLABreachers);

    // Process approved refunds - every 2 minutes
    this.scheduleJob('process-approved-refunds', 2 * 60 * 1000, processApprovedRefunds);

    // No-show handler - every 10 minutes
    this.scheduleJob('no-show-handler', 10 * 60 * 1000, handleNoShowAppointments);

    // Queue ETA update - every 1 minute
    this.scheduleJob('queue-eta-update', 1 * 60 * 1000, updateQueueETAs);

    // Cleanup stale queues - every 30 minutes
    this.scheduleJob('cleanup-stale-queues', 30 * 60 * 1000, cleanupStaleQueues);

    // Doctor status propagation - every 15 minutes
    this.scheduleJob('doctor-status-propagation', 15 * 60 * 1000, propagateDoctorStatusChanges);

    logger.info('Job scheduler started with 6 jobs');
  }

  private scheduleJob(name: string, interval: number, job: () => Promise<void>) {
    const timeout = setInterval(async () => {
      try {
        logger.debug(`Running job: ${name}`);
        await job();
      } catch (error) {
        logger.error(`Job failed: ${name}`, { error });
      }
    }, interval);

    this.jobs.set(name, timeout);
    logger.info(`Job scheduled: ${name}`, { intervalMs: interval });
  }

  stop() {
    logger.info('Stopping job scheduler...');
    this.jobs.forEach((timeout, name) => {
      clearInterval(timeout);
      logger.debug(`Job stopped: ${name}`);
    });
    this.jobs.clear();
    logger.info('Job scheduler stopped');
  }

  getStatus() {
    return {
      active: this.jobs.size,
      jobs: Array.from(this.jobs.keys()),
    };
  }
}

export const jobScheduler = new JobScheduler();
