/**
 * Background Job Queue Service
 * Implements T240 - Bull queue for heavy operations
 * Handles: analytics generation, bulk emails, report exports
 */

// Bull v4 import - Queue is default export
import Queue from 'bull';
import type { Job } from 'bull';
import { logger } from '../utils/logger';

/**
 * Job types
 */
export enum JobType {
  GENERATE_ANALYTICS = 'generate-analytics',
  SEND_BULK_EMAIL = 'send-bulk-email',
  EXPORT_REPORT = 'export-report',
}

/**
 * Job data interfaces
 */
export interface GenerateAnalyticsJobData {
  expoId: string;
  userId: string;
  metricType?: string;
}

export interface SendBulkEmailJobData {
  recipients: string[];
  subject: string;
  template: string;
  data?: Record<string, any>;
}

export interface ExportReportJobData {
  expoId: string;
  userId: string;
  reportType: string;
  format: 'pdf' | 'csv' | 'xlsx';
}

/**
 * Job queue service
 * Provides Bull queue for background job processing
 */
class JobQueueService {
  private static instance: JobQueueService;
  private analyticsQueue: InstanceType<typeof Queue> | null = null;
  private emailQueue: InstanceType<typeof Queue> | null = null;
  private reportQueue: InstanceType<typeof Queue> | null = null;
  private workers: InstanceType<typeof Queue>[] = []; // Workers are Queue instances with processors

  private constructor() {
    this.initializeQueues();
  }

  public static getInstance(): JobQueueService {
    if (!JobQueueService.instance) {
      JobQueueService.instance = new JobQueueService();
    }
    return JobQueueService.instance;
  }

  /**
   * Initialize Bull queues with Redis connection
   */
  private initializeQueues(): void {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    try {
      // Analytics queue
      this.analyticsQueue = new Queue(JobType.GENERATE_ANALYTICS, {
        redis: redisUrl,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: 100, // Keep last 100 completed jobs
          removeOnFail: 500, // Keep last 500 failed jobs
        },
      });

      // Email queue
      this.emailQueue = new Queue(JobType.SEND_BULK_EMAIL, {
        redis: redisUrl,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: 100,
          removeOnFail: 500,
        },
      });

      // Report export queue
      this.reportQueue = new Queue(JobType.EXPORT_REPORT, {
        redis: redisUrl,
        defaultJobOptions: {
          attempts: 2,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
          removeOnComplete: 50,
          removeOnFail: 100,
        },
      });

      // Setup queue event listeners
      this.setupQueueListeners();
      // Setup workers
      this.setupWorkers();

      logger.info('Job queues initialized');
    } catch (error) {
      logger.error('Failed to initialize job queues:', error);
      // Queues will fail gracefully - jobs won't be processed but won't crash the app
    }
  }

  /**
   * Setup queue event listeners for monitoring
   */
  private setupQueueListeners(): void {
    [this.analyticsQueue, this.emailQueue, this.reportQueue].forEach((queue) => {
      if (!queue) return;

      queue.on('error', (error) => {
        logger.error('Queue error:', error);
      });

      queue.on('waiting', (jobId) => {
        logger.debug('Job waiting', { jobId, queue: queue.name });
      });

      queue.on('active', (job) => {
        logger.info('Job started', { jobId: job.id, queue: queue.name, type: job.name });
      });

      queue.on('completed', (job) => {
        logger.info('Job completed', { jobId: job.id, queue: queue.name, type: job.name });
      });

      queue.on('failed', (job, err) => {
        logger.error('Job failed', {
          jobId: job?.id,
          queue: queue.name,
          type: job?.name,
          error: err.message,
        });
      });

      queue.on('stalled', (jobId) => {
        logger.warn('Job stalled', { jobId, queue: queue.name });
      });
    });
  }

  /**
   * Setup workers to process jobs
   * In Bull v4, use queue.process() instead of new Worker()
   */
  private setupWorkers(): void {
    // Analytics worker
    if (this.analyticsQueue) {
      this.analyticsQueue.process(
        2, // concurrency: Process 2 analytics jobs concurrently
        async (job: Job<GenerateAnalyticsJobData>) => {
          logger.info('Processing analytics generation job', { jobId: job.id, data: job.data });
          // Import here to avoid circular dependencies
          const { getExpoAnalytics } = await import('./analyticsService');
          const result = await getExpoAnalytics(
            job.data.expoId,
            job.data.userId,
            'admin', // Job runs with admin privileges
            job.data.metricType
          );
          return result;
        }
      );

      this.analyticsQueue.on('completed', (job) => {
        logger.info('Analytics job completed', { jobId: job.id });
      });

      this.analyticsQueue.on('failed', (job, err) => {
        logger.error('Analytics job failed', { jobId: job?.id, error: err?.message });
      });

      this.workers.push(this.analyticsQueue);
    }

    // Email worker
    if (this.emailQueue) {
      this.emailQueue.process(
        5, // concurrency: Process 5 email jobs concurrently
        async (job: Job<SendBulkEmailJobData>) => {
          logger.info('Processing bulk email job', { jobId: job.id, recipients: job.data.recipients.length });
          // Import here to avoid circular dependencies
          const { sendBulkEmail } = await import('./emailService');
          const result = await sendBulkEmail(job.data.recipients, job.data.subject, job.data.template, job.data.data);
          return result;
        }
      );

      this.emailQueue.on('completed', (job) => {
        logger.info('Email job completed', { jobId: job.id });
      });

      this.emailQueue.on('failed', (job, err) => {
        logger.error('Email job failed', { jobId: job?.id, error: err?.message });
      });

      this.workers.push(this.emailQueue);
    }

    // Report export worker
    if (this.reportQueue) {
      this.reportQueue.process(
        1, // concurrency: Process 1 report at a time (CPU intensive)
        async (job: Job<ExportReportJobData>) => {
          logger.info('Processing report export job', { jobId: job.id, data: job.data });
          // Import here to avoid circular dependencies
          const { exportReport } = await import('./exportService');
          const result = await exportReport(
            job.data.expoId,
            job.data.userId,
            job.data.reportType,
            job.data.format
          );
          return result;
        }
      );

      this.reportQueue.on('completed', (job) => {
        logger.info('Report export job completed', { jobId: job.id });
      });

      this.reportQueue.on('failed', (job, err) => {
        logger.error('Report export job failed', { jobId: job?.id, error: err?.message });
      });

      this.workers.push(this.reportQueue);
    }
  }

  /**
   * Add analytics generation job to queue
   */
  public async addAnalyticsJob(data: GenerateAnalyticsJobData): Promise<Job> {
    if (!this.analyticsQueue) {
      throw new Error('Analytics queue not initialized');
    }
    return this.analyticsQueue.add(data);
  }

  /**
   * Add bulk email job to queue
   */
  public async addBulkEmailJob(data: SendBulkEmailJobData): Promise<Job> {
    if (!this.emailQueue) {
      throw new Error('Email queue not initialized');
    }
    return this.emailQueue.add(data);
  }

  /**
   * Add report export job to queue
   */
  public async addReportExportJob(data: ExportReportJobData): Promise<Job> {
    if (!this.reportQueue) {
      throw new Error('Report queue not initialized');
    }
    return this.reportQueue.add(data);
  }

  /**
   * Get queue statistics
   */
  public async getQueueStats(): Promise<Record<string, any>> {
    const stats: Record<string, any> = {};

    if (this.analyticsQueue) {
      const [waiting, active, completed, failed] = await Promise.all([
        this.analyticsQueue.getWaitingCount(),
        this.analyticsQueue.getActiveCount(),
        this.analyticsQueue.getCompletedCount(),
        this.analyticsQueue.getFailedCount(),
      ]);
      stats.analytics = { waiting, active, completed, failed };
    }

    if (this.emailQueue) {
      const [waiting, active, completed, failed] = await Promise.all([
        this.emailQueue.getWaitingCount(),
        this.emailQueue.getActiveCount(),
        this.emailQueue.getCompletedCount(),
        this.emailQueue.getFailedCount(),
      ]);
      stats.email = { waiting, active, completed, failed };
    }

    if (this.reportQueue) {
      const [waiting, active, completed, failed] = await Promise.all([
        this.reportQueue.getWaitingCount(),
        this.reportQueue.getActiveCount(),
        this.reportQueue.getCompletedCount(),
        this.reportQueue.getFailedCount(),
      ]);
      stats.report = { waiting, active, completed, failed };
    }

    return stats;
  }

  /**
   * Close all queues and workers
   * In Bull v4, closing queues also stops their processors
   */
  public async close(): Promise<void> {
    await Promise.all([
      this.analyticsQueue?.close(),
      this.emailQueue?.close(),
      this.reportQueue?.close(),
    ]);
    this.workers = [];
    logger.info('Job queues and workers closed');
  }
}

// Export singleton instance
export const jobQueue = JobQueueService.getInstance();
export default jobQueue;

