import * as cron from 'node-cron'; // node-cron ^3.0.2
import { EventEmitter } from 'events'; // events latest
import { logger } from '../utils/logger';
import { metrics } from '../utils/metrics';
import { config } from '../config';
import { createErrorFromUnknown } from '../utils/error';
import { 
  JobStatus, 
  SchedulerOptions, 
  JobDefinition, 
  JobExecutionResult 
} from '../types/common.types';

/**
 * Enum for job execution status
 * Used if not defined in common.types
 */
enum DefaultJobStatus {
  IDLE = 'IDLE',
  RUNNING = 'RUNNING',
  PAUSED = 'PAUSED',
  FAILED = 'FAILED'
}

// Use imported JobStatus or fall back to default enum
const JobStatusValues = typeof JobStatus !== 'undefined' ? JobStatus : DefaultJobStatus;

/**
 * Job history entry structure for tracking job execution
 */
interface JobHistoryEntry {
  startTime: Date;
  endTime: Date;
  duration: number;
  success: boolean;
  error: string | null;
  manual: boolean;
  params?: any;
}

/**
 * Job registry entry structure for tracking job metadata
 */
interface JobRegistryEntry {
  id: string;
  cronExpression: string;
  task: cron.ScheduledTask;
  definition: JobDefinition;
  options: any;
  status: string;
  lastRun: Date | null;
  nextRun: Date | null;
  lastDuration: number | null;
  lastResult: any;
  lastError: Error | null;
  runCount: number;
  successCount: number;
  failureCount: number;
  created: Date;
  executionHistory: JobHistoryEntry[];
  retryState?: {
    attempts: number;
    lastError: Error | null;
  } | null;
}

/**
 * Default options for scheduler initialization
 */
const DEFAULT_SCHEDULER_OPTIONS: SchedulerOptions = {
  maxConcurrentJobs: 10,
  defaultJobTimeoutMs: 30000, // 30 seconds
  autoStart: true,
  autoRegisterJobs: true,
  healthCheckIntervalMs: 60000, // 1 minute
  maxRetries: 3,
  retryDelayMs: 1000
};

/**
 * Scheduler class for managing scheduled jobs in the HCBS Revenue Management System
 * Handles job scheduling, execution, monitoring, and error handling
 */
class Scheduler {
  private jobsRegistry: Map<string, JobRegistryEntry> = new Map();
  private eventEmitter: EventEmitter;
  private isInitialized: boolean = false;
  private healthCheckInterval?: NodeJS.Timeout;
  private metrics: {
    totalJobsScheduled: number;
    totalJobsExecuted: number;
    totalSuccessfulJobs: number;
    totalFailedJobs: number;
    averageExecutionTime: number;
    executionTimeHistory: number[];
  };
  private options: SchedulerOptions;

  /**
   * Creates a new Scheduler instance
   * @param options Configuration options for the scheduler
   */
  constructor(options?: Partial<SchedulerOptions>) {
    this.eventEmitter = new EventEmitter();
    
    // Initialize metrics tracking
    this.metrics = {
      totalJobsScheduled: 0,
      totalJobsExecuted: 0,
      totalSuccessfulJobs: 0,
      totalFailedJobs: 0,
      averageExecutionTime: 0,
      executionTimeHistory: []
    };
    
    // Apply default options
    this.options = {
      ...DEFAULT_SCHEDULER_OPTIONS,
      ...(config.scheduler || {}),
      ...options
    };
    
    // Set a reasonable max listeners limit to avoid memory leaks
    this.eventEmitter.setMaxListeners(100);
    
    logger.debug('Scheduler instance created', { options: this.options });
  }

  /**
   * Schedules a job with the specified cron expression
   * @param jobId Unique identifier for the job
   * @param cronExpression Cron expression for scheduling
   * @param jobDefinition Job definition containing the function to execute
   * @param options Additional job options
   * @returns True if job was successfully scheduled
   */
  public scheduleJob(
    jobId: string,
    cronExpression: string,
    jobDefinition: JobDefinition,
    options?: any
  ): boolean {
    // Validate job ID
    if (!jobId) {
      logger.error('Job ID is required');
      return false;
    }

    // Check if job already exists
    if (this.jobsRegistry.has(jobId)) {
      logger.warn(`Job ${jobId} already exists and will be replaced`, { jobId });
      this.unscheduleJob(jobId);
    }

    // Validate cron expression
    if (!cron.validate(cronExpression)) {
      logger.error(`Invalid cron expression for job ${jobId}: ${cronExpression}`, { jobId, cronExpression });
      return false;
    }

    // Prepare job options with defaults
    const jobOptions = {
      timezone: options?.timezone || 'UTC',
      timeoutMs: options?.timeoutMs || this.options.defaultJobTimeoutMs,
      retry: options?.retry || {
        attempts: this.options.maxRetries,
        backoffMs: this.options.retryDelayMs
      },
      ...options
    };

    try {
      // Create job task
      const task = cron.schedule(
        cronExpression,
        this.createJobExecutionWrapper(jobId, jobDefinition, jobOptions),
        {
          scheduled: true,
          timezone: jobOptions.timezone
        }
      );

      // Store job details in registry
      this.jobsRegistry.set(jobId, {
        id: jobId,
        cronExpression,
        task,
        definition: jobDefinition,
        options: jobOptions,
        status: JobStatusValues.IDLE,
        lastRun: null,
        nextRun: this.calculateNextRun(cronExpression, jobOptions.timezone),
        lastDuration: null,
        lastResult: null,
        lastError: null,
        runCount: 0,
        successCount: 0,
        failureCount: 0,
        created: new Date(),
        executionHistory: []
      });

      // Update metrics
      this.metrics.totalJobsScheduled++;

      // Emit event
      this.eventEmitter.emit('job:scheduled', { jobId, cronExpression });

      logger.info(`Scheduled job ${jobId} with cron expression ${cronExpression}`, {
        jobId,
        cronExpression,
        timezone: jobOptions.timezone,
        description: jobDefinition.description || 'No description provided'
      });

      return true;
    } catch (error) {
      const formattedError = createErrorFromUnknown(error);
      logger.error(`Failed to schedule job ${jobId}`, {
        jobId,
        cronExpression,
        error: formattedError
      });
      return false;
    }
  }

  /**
   * Unschedules a job by ID
   * @param jobId ID of the job to unschedule
   * @returns True if job was successfully unscheduled
   */
  public unscheduleJob(jobId: string): boolean {
    const job = this.jobsRegistry.get(jobId);
    if (!job) {
      logger.warn(`Cannot unschedule job ${jobId}: Job not found`, { jobId });
      return false;
    }

    try {
      // Stop the cron job
      job.task.stop();

      // Remove from registry
      this.jobsRegistry.delete(jobId);

      // Emit event
      this.eventEmitter.emit('job:unscheduled', { jobId });

      logger.info(`Unscheduled job ${jobId}`, { jobId });
      return true;
    } catch (error) {
      const formattedError = createErrorFromUnknown(error);
      logger.error(`Failed to unschedule job ${jobId}`, {
        jobId,
        error: formattedError
      });
      return false;
    }
  }

  /**
   * Manually executes a job immediately, regardless of its schedule
   * @param jobId ID of the job to execute
   * @param params Optional parameters to pass to the job function
   * @returns Promise resolving to the job execution result
   */
  public async executeJobManually(
    jobId: string, 
    params?: any
  ): Promise<JobExecutionResult> {
    const job = this.jobsRegistry.get(jobId);
    if (!job) {
      logger.warn(`Cannot execute job ${jobId}: Job not found`, { jobId });
      return {
        success: false,
        error: new Error(`Job ${jobId} not found`),
        data: null,
        duration: 0
      };
    }

    logger.info(`Manually executing job ${jobId}`, { jobId, params });

    // Update job status
    job.status = JobStatusValues.RUNNING;
    job.lastRun = new Date();

    // Emit event
    this.eventEmitter.emit('job:started', { jobId, manual: true });

    const startTime = Date.now();
    let success = false;
    let result = null;
    let error = null;

    try {
      // Execute job function
      const executionParams = {
        ...(job.definition.params || {}),
        ...(params || {})
      };
      
      result = await this.executeWithTimeout(
        job.definition.execute,
        job.options.timeoutMs,
        executionParams
      );
      
      success = true;

      // Update job metrics
      job.successCount++;
      this.metrics.totalSuccessfulJobs++;

      logger.info(`Successfully executed job ${jobId}`, { 
        jobId, 
        duration: Date.now() - startTime,
        resultType: typeof result
      });
    } catch (err) {
      error = createErrorFromUnknown(err);
      job.failureCount++;
      this.metrics.totalFailedJobs++;

      logger.error(`Failed to execute job ${jobId}`, {
        jobId, 
        duration: Date.now() - startTime,
        error
      });
    }

    const duration = Date.now() - startTime;

    // Update job status and metrics
    job.status = JobStatusValues.IDLE;
    job.lastDuration = duration;
    job.lastResult = success ? result : null;
    job.lastError = error;
    job.runCount++;
    job.executionHistory.push({
      startTime: new Date(startTime),
      endTime: new Date(),
      duration,
      success,
      error: error ? error.message : null,
      manual: true,
      params
    });

    // Limit history size
    if (job.executionHistory.length > 100) {
      job.executionHistory.shift();
    }

    // Update average execution time
    this.metrics.executionTimeHistory.push(duration);
    if (this.metrics.executionTimeHistory.length > 100) {
      this.metrics.executionTimeHistory.shift();
    }
    this.metrics.averageExecutionTime = this.metrics.executionTimeHistory.reduce((a, b) => a + b, 0) / this.metrics.executionTimeHistory.length;

    // Track metrics
    metrics.trackSystemMetric('scheduler_job_duration', duration, {
      jobId,
      success: success ? 'true' : 'false',
      manual: 'true'
    });
    metrics.trackSystemMetric(`scheduler_job_${success ? 'success' : 'failure'}`, 1, { jobId });

    // Emit completion event
    this.eventEmitter.emit(
      success ? 'job:completed' : 'job:failed', 
      { 
        jobId, 
        duration, 
        manual: true,
        error: error ? error.message : null 
      }
    );

    // Return job execution result
    return {
      success,
      error,
      data: result,
      duration
    };
  }

  /**
   * Gets the current status of a job
   * @param jobId ID of the job
   * @returns Job status information or null if job not found
   */
  public getJobStatus(jobId: string): any {
    const job = this.jobsRegistry.get(jobId);
    if (!job) {
      return null;
    }

    return {
      id: job.id,
      name: job.definition.name || job.id,
      description: job.definition.description,
      status: job.status,
      cronExpression: job.cronExpression,
      lastRun: job.lastRun,
      nextRun: this.calculateNextRun(job.cronExpression, job.options.timezone),
      lastDuration: job.lastDuration,
      lastError: job.lastError ? job.lastError.message : null,
      runCount: job.runCount,
      successCount: job.successCount,
      failureCount: job.failureCount,
      created: job.created,
      executionHistory: job.executionHistory.slice(-10) // Return only last 10 runs
    };
  }

  /**
   * Gets a list of all registered jobs and their statuses
   * @returns Array of job status information
   */
  public getAllJobs(): any[] {
    const jobs = [];
    this.jobsRegistry.forEach((job, jobId) => {
      jobs.push(this.getJobStatus(jobId));
    });
    return jobs;
  }

  /**
   * Pauses all scheduled jobs
   * @returns True if jobs were successfully paused
   */
  public pauseAllJobs(): boolean {
    logger.info('Pausing all scheduled jobs');
    
    try {
      let pausedCount = 0;
      this.jobsRegistry.forEach((job, jobId) => {
        if (job.task && job.status !== JobStatusValues.PAUSED) {
          job.task.stop();
          job.status = JobStatusValues.PAUSED;
          pausedCount++;
        }
      });

      // Emit event
      this.eventEmitter.emit('scheduler:paused', { jobCount: pausedCount });

      logger.info(`Paused ${pausedCount} jobs`);
      return true;
    } catch (error) {
      const formattedError = createErrorFromUnknown(error);
      logger.error('Failed to pause jobs', {
        error: formattedError
      });
      return false;
    }
  }

  /**
   * Resumes all paused jobs
   * @returns True if jobs were successfully resumed
   */
  public resumeAllJobs(): boolean {
    logger.info('Resuming all paused jobs');
    
    try {
      let resumedCount = 0;
      this.jobsRegistry.forEach((job, jobId) => {
        if (job.task && job.status === JobStatusValues.PAUSED) {
          job.task.start();
          job.status = JobStatusValues.IDLE;
          resumedCount++;
        }
      });

      // Emit event
      this.eventEmitter.emit('scheduler:resumed', { jobCount: resumedCount });

      logger.info(`Resumed ${resumedCount} jobs`);
      return true;
    } catch (error) {
      const formattedError = createErrorFromUnknown(error);
      logger.error('Failed to resume jobs', {
        error: formattedError
      });
      return false;
    }
  }

  /**
   * Initializes the scheduler with configuration options
   * @param options Initialization options
   * @returns Promise that resolves when initialization is complete
   */
  public async initialize(options?: Partial<SchedulerOptions>): Promise<void> {
    if (this.isInitialized) {
      logger.warn('Scheduler is already initialized');
      return;
    }

    logger.info('Initializing scheduler', { options });

    // Apply options if provided
    if (options) {
      this.options = { ...this.options, ...options };
    }

    // Set up event listeners
    this.setupEventListeners();

    // Register default jobs if configured
    if (this.options.autoRegisterJobs) {
      this.registerDefaultJobs();
    }

    // Start health check if configured
    if (this.options.healthCheckIntervalMs > 0) {
      this.startHealthCheck();
    }

    this.isInitialized = true;
    this.eventEmitter.emit('scheduler:initialized');

    logger.info('Scheduler initialized successfully', {
      options: this.options,
      defaultJobs: this.options.autoRegisterJobs
    });
  }

  /**
   * Gracefully shuts down the scheduler, allowing in-progress jobs to complete
   * @param force If true, terminates running jobs instead of waiting for completion
   * @returns Promise that resolves when shutdown is complete
   */
  public async shutdown(force: boolean = false): Promise<void> {
    logger.info('Shutting down scheduler', { force });

    if (!this.isInitialized) {
      logger.warn('Scheduler is not initialized, nothing to shut down');
      return;
    }

    // Stop health check interval if running
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
    }

    // Stop all scheduled jobs
    this.pauseAllJobs();

    // If force=true, we don't wait for running jobs
    if (!force) {
      // Check if there are any running jobs
      const runningJobs = Array.from(this.jobsRegistry.values())
        .filter(job => job.status === JobStatusValues.RUNNING);
      
      if (runningJobs.length > 0) {
        logger.info(`Waiting for ${runningJobs.length} running jobs to complete`, {
          runningJobs: runningJobs.map(job => job.id)
        });
        
        // Wait for jobs to complete with timeout
        const waitUntil = Date.now() + 30000; // 30 second timeout
        while (Date.now() < waitUntil) {
          const stillRunning = Array.from(this.jobsRegistry.values())
            .filter(job => job.status === JobStatusValues.RUNNING).length;
          
          if (stillRunning === 0) {
            logger.info('All running jobs completed');
            break;
          }
          
          // Wait a bit
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Check if we timed out
        const timedOutJobs = Array.from(this.jobsRegistry.values())
          .filter(job => job.status === JobStatusValues.RUNNING);
        
        if (timedOutJobs.length > 0) {
          logger.warn(`${timedOutJobs.length} jobs still running after timeout, proceeding with shutdown`, {
            timedOutJobs: timedOutJobs.map(job => job.id)
          });
        }
      }
    }

    // Clear all jobs
    this.jobsRegistry.clear();
    this.isInitialized = false;

    // Emit shutdown event
    this.eventEmitter.emit('scheduler:shutdown', { force });

    logger.info('Scheduler has been shut down', { force });
  }

  /**
   * Gets current scheduler metrics and performance data
   * @returns Object containing scheduler metrics
   */
  public getMetrics(): any {
    const jobsByStatus = {
      total: this.jobsRegistry.size,
      idle: 0,
      running: 0,
      paused: 0,
      failed: 0
    };

    // Count jobs by status
    this.jobsRegistry.forEach(job => {
      const status = job.status.toLowerCase();
      if (jobsByStatus.hasOwnProperty(status)) {
        jobsByStatus[status]++;
      }
    });

    // Calculate success rate
    const successRate = this.metrics.totalJobsExecuted > 0 
      ? (this.metrics.totalSuccessfulJobs / this.metrics.totalJobsExecuted) * 100 
      : 0;

    // Get most recent execution times for trending analysis
    const recentExecutionTimes = this.metrics.executionTimeHistory.slice(-20);

    return {
      system: {
        totalJobsScheduled: this.metrics.totalJobsScheduled,
        totalJobsExecuted: this.metrics.totalJobsExecuted,
        totalSuccessfulJobs: this.metrics.totalSuccessfulJobs,
        totalFailedJobs: this.metrics.totalFailedJobs,
        averageExecutionTime: this.metrics.averageExecutionTime,
        successRate: successRate,
        initialized: this.isInitialized,
        uptime: this.isInitialized 
          ? Math.floor((Date.now() - new Date(this.metrics.startTime || Date.now()).getTime()) / 1000) 
          : 0
      },
      current: {
        totalJobs: this.jobsRegistry.size,
        jobsByStatus,
        recentExecutionTimes
      },
      jobs: Array.from(this.jobsRegistry.keys()).map(jobId => ({
        id: jobId,
        status: this.jobsRegistry.get(jobId)?.status,
        lastRun: this.jobsRegistry.get(jobId)?.lastRun,
        nextRun: this.jobsRegistry.get(jobId)?.nextRun,
        successRate: this.jobsRegistry.get(jobId)?.runCount 
          ? (this.jobsRegistry.get(jobId)?.successCount / this.jobsRegistry.get(jobId)?.runCount) * 100 
          : 0
      }))
    };
  }

  /**
   * Creates a wrapper function for job execution that handles metrics, logging, and error handling
   * @param jobId ID of the job
   * @param jobDefinition Job definition containing the function to execute
   * @param options Job options
   * @returns Wrapped job execution function
   * @private
   */
  private createJobExecutionWrapper(
    jobId: string,
    jobDefinition: JobDefinition,
    options: any
  ): () => Promise<void> {
    return async (): Promise<void> => {
      const job = this.jobsRegistry.get(jobId);
      
      // Skip execution if job was removed or is paused
      if (!job || job.status === JobStatusValues.PAUSED) {
        return;
      }

      // Update job status
      job.status = JobStatusValues.RUNNING;
      job.lastRun = new Date();

      // Emit event
      this.eventEmitter.emit('job:started', { jobId, manual: false });

      const startTime = Date.now();
      let success = false;
      let result = null;
      let error = null;

      try {
        // Execute with timeout
        result = await this.executeWithTimeout(
          job.definition.execute, 
          options.timeoutMs, 
          job.definition.params || {}
        );
        success = true;

        // Update job metrics
        job.successCount++;
        this.metrics.totalSuccessfulJobs++;

        logger.debug(`Successfully executed scheduled job ${jobId}`, { 
          jobId, 
          duration: Date.now() - startTime
        });
      } catch (err) {
        error = createErrorFromUnknown(err);
        job.failureCount++;
        this.metrics.totalFailedJobs++;

        logger.error(`Failed to execute scheduled job ${jobId}`, {
          jobId, 
          duration: Date.now() - startTime,
          error
        });

        // Handle retry if configured
        if (options.retry && options.retry.attempts > 0) {
          await this.handleJobRetry(jobId, jobDefinition, options, error);
        }
      }

      const duration = Date.now() - startTime;

      // Update job status and metrics
      job.status = JobStatusValues.IDLE;
      job.lastDuration = duration;
      job.lastResult = success ? result : null;
      job.lastError = error;
      job.runCount++;
      job.nextRun = this.calculateNextRun(job.cronExpression, job.options.timezone);
      job.executionHistory.push({
        startTime: new Date(startTime),
        endTime: new Date(),
        duration,
        success,
        error: error ? error.message : null,
        manual: false
      });

      // Limit history size
      if (job.executionHistory.length > 100) {
        job.executionHistory.shift();
      }

      // Update overall metrics
      this.metrics.totalJobsExecuted++;
      this.metrics.executionTimeHistory.push(duration);
      if (this.metrics.executionTimeHistory.length > 100) {
        this.metrics.executionTimeHistory.shift();
      }
      this.metrics.averageExecutionTime = this.metrics.executionTimeHistory.reduce((a, b) => a + b, 0) / 
        (this.metrics.executionTimeHistory.length || 1);

      // Track metrics
      metrics.trackSystemMetric('scheduler_job_duration', duration, {
        jobId,
        success: success ? 'true' : 'false',
        manual: 'false'
      });
      metrics.trackSystemMetric(`scheduler_job_${success ? 'success' : 'failure'}`, 1, { jobId });

      // Emit completion event
      this.eventEmitter.emit(
        success ? 'job:completed' : 'job:failed', 
        { 
          jobId, 
          duration, 
          manual: false,
          error: error ? error.message : null 
        }
      );
    };
  }

  /**
   * Executes a function with a timeout
   * @param fn Function to execute
   * @param timeoutMs Timeout in milliseconds
   * @param params Parameters to pass to the function
   * @returns Promise that resolves with the function result or rejects with timeout error
   * @private
   */
  private async executeWithTimeout<T>(
    fn: (params: any) => Promise<T>, 
    timeoutMs: number, 
    params: any
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      // Create timeout timer
      const timer = setTimeout(() => {
        reject(new Error(`Job execution timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      // Execute function
      fn(params)
        .then(result => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  /**
   * Handles job retry when execution fails
   * @param jobId ID of the job
   * @param jobDefinition Job definition
   * @param options Job options
   * @param error Error that caused the failure
   * @private
   */
  private async handleJobRetry(
    jobId: string,
    jobDefinition: JobDefinition,
    options: any,
    error: Error
  ): Promise<void> {
    const job = this.jobsRegistry.get(jobId);
    if (!job) {
      return;
    }

    const retryOptions = options.retry;
    const retryAttempts = retryOptions.attempts;
    const retryBackoffMs = retryOptions.backoffMs;

    // Create retry state if it doesn't exist
    if (!job.retryState) {
      job.retryState = {
        attempts: 0,
        lastError: null
      };
    }

    // Check if we've reached max retry attempts
    if (job.retryState.attempts >= retryAttempts) {
      logger.warn(`Job ${jobId} has failed after ${retryAttempts} retry attempts`, {
        jobId,
        attempts: job.retryState.attempts,
        lastError: error.message
      });
      
      // Reset retry state
      job.retryState = null;
      return;
    }

    // Increment retry count
    job.retryState.attempts++;
    job.retryState.lastError = error;

    // Calculate backoff time with exponential backoff
    const backoffTime = retryBackoffMs * Math.pow(2, job.retryState.attempts - 1);
    
    logger.info(`Retrying job ${jobId} (attempt ${job.retryState.attempts}/${retryAttempts}) in ${backoffTime}ms`, {
      jobId,
      attempt: job.retryState.attempts,
      backoffTime
    });

    // Schedule retry
    await new Promise(resolve => setTimeout(resolve, backoffTime));

    try {
      // Execute retry with timeout
      const result = await this.executeWithTimeout(
        jobDefinition.execute,
        options.timeoutMs,
        jobDefinition.params || {}
      );
      
      // Retry succeeded
      job.status = JobStatusValues.IDLE;
      job.successCount++;
      job.lastResult = result;
      job.lastError = null;

      // Clear retry state
      const attemptsMade = job.retryState ? job.retryState.attempts : 0;
      job.retryState = null;

      logger.info(`Job ${jobId} retry succeeded on attempt ${attemptsMade}`, {
        jobId
      });

      // Emit event
      this.eventEmitter.emit('job:retry:succeeded', { 
        jobId, 
        attempts: attemptsMade 
      });
    } catch (retryError) {
      // Retry failed
      const formattedError = createErrorFromUnknown(retryError);
      
      if (job.retryState) {
        job.retryState.lastError = formattedError;
      }
      
      const attemptsMade = job.retryState ? job.retryState.attempts : 0;
      
      logger.warn(`Job ${jobId} retry failed on attempt ${attemptsMade}`, {
        jobId,
        error: formattedError
      });

      // Emit event
      this.eventEmitter.emit('job:retry:failed', { 
        jobId, 
        attempts: attemptsMade,
        error: formattedError.message
      });

      // Try again if we have attempts left
      await this.handleJobRetry(jobId, jobDefinition, options, formattedError);
    }
  }

  /**
   * Calculates the next scheduled run time for a job
   * @param cronExpression Cron expression for the job
   * @param timezone Timezone for the cron expression
   * @returns Date object representing the next run time
   * @private
   */
  private calculateNextRun(cronExpression: string, timezone: string): Date {
    try {
      const schedule = cron.schedule(cronExpression, () => {}, {
        scheduled: false,
        timezone
      });
      
      return schedule.nextDate().toDate();
    } catch (error) {
      const formattedError = createErrorFromUnknown(error);
      logger.error(`Failed to calculate next run time for cron expression ${cronExpression}`, {
        cronExpression,
        timezone,
        error: formattedError
      });
      
      return new Date(); // Fallback to current time
    }
  }

  /**
   * Sets up event listeners for job events
   * @private
   */
  private setupEventListeners(): void {
    // Log failed jobs
    this.eventEmitter.on('job:failed', ({ jobId, error }) => {
      logger.warn(`Job ${jobId} failed: ${error}`, { jobId, error });
      
      // Track metric for monitoring
      metrics.trackSystemMetric('scheduler_job_failure', 1, { jobId });
    });

    // Track job completion metrics
    this.eventEmitter.on('job:completed', ({ jobId, duration }) => {
      // Track metric for monitoring
      metrics.trackSystemMetric('scheduler_job_success', 1, { jobId });
      metrics.trackSystemMetric('scheduler_job_duration_ms', duration, { jobId });
    });

    // Track stalled jobs
    this.eventEmitter.on('job:stalled', ({ jobId, runningTime }) => {
      metrics.trackSystemMetric('scheduler_job_stalled', 1, { jobId, runningTime });
    });

    // Log scheduler lifecycle events
    this.eventEmitter.on('scheduler:initialized', () => {
      logger.info('Scheduler initialization complete');
      this.metrics.startTime = new Date();
    });

    this.eventEmitter.on('scheduler:shutdown', ({ force }) => {
      logger.info('Scheduler shutdown event received', { force });
    });
  }

  /**
   * Registers default jobs from configuration
   * @private
   */
  private registerDefaultJobs(): void {
    logger.info('Registering default jobs');
    
    // Check if we have default jobs configured
    const defaultJobs = config.scheduler?.defaultJobs || [];
    
    if (defaultJobs.length === 0) {
      logger.info('No default jobs configured');
      return;
    }
    
    defaultJobs.forEach(jobConfig => {
      try {
        // Dynamically import job handler if specified
        let jobFunction;
        
        if (jobConfig.handlerPath) {
          // Dynamic import - in a real implementation, we would handle this more robustly
          try {
            const handler = require(jobConfig.handlerPath);
            jobFunction = handler[jobConfig.handlerName || 'default'];
          } catch (importError) {
            logger.error(`Failed to import job handler for ${jobConfig.id}`, {
              path: jobConfig.handlerPath,
              error: createErrorFromUnknown(importError)
            });
            return;
          }
        } else if (jobConfig.handler) {
          jobFunction = jobConfig.handler;
        } else {
          logger.error(`No handler specified for default job ${jobConfig.id}`, {
            jobConfig
          });
          return;
        }
        
        if (typeof jobFunction !== 'function') {
          logger.error(`Handler for job ${jobConfig.id} is not a function`, {
            jobConfig,
            handlerType: typeof jobFunction
          });
          return;
        }
        
        // Schedule the job
        this.scheduleJob(
          jobConfig.id,
          jobConfig.cronExpression,
          {
            name: jobConfig.name || jobConfig.id,
            description: jobConfig.description || '',
            execute: jobFunction,
            params: jobConfig.params || {}
          },
          jobConfig.options || {}
        );
        
        logger.info(`Registered default job ${jobConfig.id}`, {
          jobId: jobConfig.id,
          cronExpression: jobConfig.cronExpression
        });
      } catch (error) {
        logger.error(`Failed to register default job ${jobConfig.id}`, {
          error: createErrorFromUnknown(error),
          jobConfig
        });
      }
    });
  }

  /**
   * Starts a periodic health check of scheduled jobs
   * @private
   */
  private startHealthCheck(): void {
    logger.info('Starting scheduler health check', {
      intervalMs: this.options.healthCheckIntervalMs
    });
    
    this.healthCheckInterval = setInterval(() => {
      try {
        // Check for stalled jobs (running for too long)
        const now = Date.now();
        let stalledJobsCount = 0;
        
        this.jobsRegistry.forEach((job, jobId) => {
          if (job.status === JobStatusValues.RUNNING && job.lastRun) {
            const runningTime = now - new Date(job.lastRun).getTime();
            const timeout = job.options.timeoutMs || this.options.defaultJobTimeoutMs;
            
            // If job is running longer than its timeout, consider it stalled
            if (runningTime > timeout * 1.5) {
              stalledJobsCount++;
              logger.warn(`Job ${jobId} appears to be stalled, running for ${runningTime}ms`, {
                jobId,
                timeout,
                runningTime,
                startedAt: job.lastRun
              });
              
              // Emit event for monitoring
              this.eventEmitter.emit('job:stalled', { 
                jobId, 
                runningTime,
                timeout
              });
            }
          }
        });
        
        // Log health check results
        logger.debug('Scheduler health check completed', {
          totalJobs: this.jobsRegistry.size,
          stalledJobs: stalledJobsCount
        });
        
        // Emit health check event
        this.eventEmitter.emit('scheduler:healthcheck', {
          timestamp: new Date(),
          healthy: stalledJobsCount === 0,
          metrics: this.getMetrics()
        });
      } catch (error) {
        logger.error('Error during scheduler health check', {
          error: createErrorFromUnknown(error)
        });
      }
    }, this.options.healthCheckIntervalMs);
  }
}

// Create singleton instance
const scheduler = new Scheduler();

// Export singleton and class
export { 
  scheduler,
  Scheduler
};

// Export methods directly for convenience
export const scheduleJob = scheduler.scheduleJob.bind(scheduler);
export const unscheduleJob = scheduler.unscheduleJob.bind(scheduler);
export const executeJobManually = scheduler.executeJobManually.bind(scheduler);
export const getJobStatus = scheduler.getJobStatus.bind(scheduler);
export const getAllJobs = scheduler.getAllJobs.bind(scheduler);
export const pauseAllJobs = scheduler.pauseAllJobs.bind(scheduler);
export const resumeAllJobs = scheduler.resumeAllJobs.bind(scheduler);
export const initialize = scheduler.initialize.bind(scheduler);
export const shutdown = scheduler.shutdown.bind(scheduler);
export const getMetrics = scheduler.getMetrics.bind(scheduler);