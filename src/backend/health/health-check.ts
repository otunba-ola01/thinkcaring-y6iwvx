import { logger } from '../utils/logger'; // Import logger for health check logging
import { createGauge } from '../utils/metrics'; // Import metrics utility for tracking system health metrics
import { checkDatabaseHealth, getDatabaseMetrics } from './database-health'; // Import database health check functions
import { checkRedisHealth, getRedisMetrics } from './redis-health'; // Import Redis health check functions
import { checkIntegrationHealth, checkAllIntegrationsHealth, getIntegrationMetrics } from './integration-health'; // Import integration health check functions
import { IntegrationType } from '../types/integration.types'; // Import integration type enum for integration health checks
import { checkMemoryHealth, getMemoryMetrics } from './memory-usage'; // Import memory health check functions
import { checkDiskHealth, getDiskMetrics } from './disk-usage'; // Import disk health check functions
import { checkApiPerformanceHealth, getApiPerformanceMetrics } from './api-performance';
import * as express from 'express'; // express 4.18+

/**
 * Interface defining the structure of a health check result
 */
interface HealthCheckResult {
  healthy: boolean;
  responseTime: number;
  message: string;
  error?: object;
  metrics?: object;
}

/**
 * Enum for health check component types
 */
export enum HealthCheckComponent {
  DATABASE = 'database',
  REDIS = 'redis',
  INTEGRATION = 'integration',
  MEMORY = 'memory',
  DISK = 'disk',
  API = 'api'
}

/**
 * Enum for system health status values
 */
export enum SystemHealthStatus {
  HEALTHY = 'healthy',
  WARNING = 'warning',
  DEGRADED = 'degraded',
  CRITICAL = 'critical',
  UNKNOWN = 'unknown'
}

/**
 * Interface defining the structure of the overall system health check result
 */
interface SystemHealthResult {
  status: SystemHealthStatus;
  responseTime: number;
  components: Record<HealthCheckComponent, HealthCheckResult>;
  timestamp: Date;
  version: string;
}

// Prometheus gauge metric for tracking system health status (0=unhealthy, 1=healthy)
const systemHealthGauge = createGauge('system_health_status', 'Overall system health status (0=unhealthy, 1=healthy)');

// Prometheus gauge metric for tracking component health status (0=unhealthy, 1=healthy)
const componentHealthGauge = createGauge('component_health_status', 'Component health status (0=unhealthy, 1=healthy)', ['component']);

// Global variable to store the last health check result
let lastHealthCheckResult: SystemHealthResult | null = null;

// Global variable to store the health check interval timer
let healthCheckInterval: NodeJS.Timeout | null = null;

// Health check interval in milliseconds (default: 60 seconds)
const HEALTH_CHECK_INTERVAL_MS = 60000;

/**
 * Performs a comprehensive health check across all system components
 * @returns Promise<SystemHealthResult> Comprehensive health check result for the entire system
 */
async function checkHealth(): Promise<SystemHealthResult> {
  logger.info('Starting comprehensive health check');

  const startTime = Date.now();

  // Execute health checks for all components in parallel using Promise.all
  const [databaseResult, redisResult, integrationResults, memoryResult, diskResult, apiResult] = await Promise.all([
    checkDatabaseHealth(),
    checkRedisHealth(),
    checkAllIntegrationsHealth(),
    checkMemoryHealth(),
    checkDiskHealth(),
    checkApiPerformanceHealth()
  ]);

  // Collect results from database health check
  const databaseHealth = databaseResult;

  // Collect results from Redis health check
  const redisHealth = redisResult;

  // Collect results from integration health checks
  const integrationHealthMap = integrationResults;
  const integrationHealth: HealthCheckResult = {
    healthy: Array.from(integrationHealthMap.values()).every(result => result.status === IntegrationStatus.ACTIVE),
    responseTime: null,
    message: 'Integration health check',
    metrics: getIntegrationMetrics()
  };

  // Collect results from memory health check
  const memoryHealth = memoryResult;

  // Collect results from disk health check
  const diskHealth = diskResult;

  // Collect results from API performance health check
  const apiHealth = apiResult;

  // Determine overall system health status based on component results
  const componentResults: Record<HealthCheckComponent, HealthCheckResult> = {
    [HealthCheckComponent.DATABASE]: databaseHealth,
    [HealthCheckComponent.REDIS]: redisHealth,
    [HealthCheckComponent.INTEGRATION]: integrationHealth,
    [HealthCheckComponent.MEMORY]: memoryHealth,
    [HealthCheckComponent.DISK]: diskHealth,
    [HealthCheckComponent.API]: apiHealth
  };

  const systemStatus = determineSystemHealthStatus(componentResults);

  // Calculate the total response time of the health check
  const responseTime = Date.now() - startTime;

  // Update system health gauge metric (0 for unhealthy, 1 for healthy)
  systemHealthGauge.set(systemStatus === SystemHealthStatus.HEALTHY ? 1 : 0);

  // Update component health gauge metrics for each component
  componentHealthGauge.labels(HealthCheckComponent.DATABASE).set(databaseHealth.healthy ? 1 : 0);
  componentHealthGauge.labels(HealthCheckComponent.REDIS).set(redisHealth.healthy ? 1 : 0);
  componentHealthGauge.labels(HealthCheckComponent.INTEGRATION).set(integrationHealth.healthy ? 1 : 0);
  componentHealthGauge.labels(HealthCheckComponent.MEMORY).set(memoryHealth.healthy ? 1 : 0);
  componentHealthGauge.labels(HealthCheckComponent.DISK).set(diskHealth.healthy ? 1 : 0);
  componentHealthGauge.labels(HealthCheckComponent.API).set(apiHealth.healthy ? 1 : 0);

  // Store the health check result in lastHealthCheckResult
  lastHealthCheckResult = {
    status: systemStatus,
    responseTime,
    components: componentResults,
    timestamp: new Date(),
    version: '1.0.0' // TODO: Get version from package.json
  };

  // Log the completion of health check with overall status
  logger.info('Health check completed', { status: systemStatus, responseTime });

  // Return the comprehensive health check result
  return lastHealthCheckResult;
}

/**
 * Checks the health of a specific system component
 * @param component HealthCheckComponent
 * @returns Promise<HealthCheckResult> Health check result for the specified component
 */
async function checkComponentHealth(component: HealthCheckComponent): Promise<HealthCheckResult> {
  logger.info(`Checking health for component: ${component}`);

  switch (component) {
    case HealthCheckComponent.DATABASE:
      return checkDatabaseHealth();
    case HealthCheckComponent.REDIS:
      return checkRedisHealth();
    case HealthCheckComponent.INTEGRATION:
      return checkAllIntegrationsHealth().then(results => ({
        healthy: Array.from(results.values()).every(result => result.status === IntegrationStatus.ACTIVE),
        responseTime: null,
        message: 'Integration health check',
        metrics: getIntegrationMetrics()
      }));
    case HealthCheckComponent.MEMORY:
      return checkMemoryHealth();
    case HealthCheckComponent.DISK:
      return checkDiskHealth();
    case HealthCheckComponent.API:
      return checkApiPerformanceHealth();
    default:
      logger.warn(`Unknown health check component: ${component}`);
      return {
        healthy: false,
        responseTime: 0,
        message: `Unknown health check component: ${component}`
      };
  }
}

/**
 * Gets the current overall health status of the system
 * @returns SystemHealthStatus Current system health status
 */
function getHealthStatus(): SystemHealthStatus {
  // Check if lastHealthCheckResult exists
  if (!lastHealthCheckResult) {
    // If no health check has been performed, return UNKNOWN status
    return SystemHealthStatus.UNKNOWN;
  }

  // Log the retrieval of health status at debug level
  logger.debug('Retrieving health status', { status: lastHealthCheckResult.status });

  // Return the status from lastHealthCheckResult
  return lastHealthCheckResult.status;
}

/**
 * Gets detailed health information for all system components
 * @returns SystemHealthResult | null Detailed health information or null if no check has been performed
 */
function getDetailedHealthStatus(): SystemHealthResult | null {
  // Log the retrieval of detailed health status at debug level
  logger.debug('Retrieving detailed health status');

  // Return the lastHealthCheckResult object
  return lastHealthCheckResult;
}

/**
 * Starts periodic health monitoring across all system components
 * @param intervalMs number
 * @returns NodeJS.Timeout Timer reference for the monitoring interval
 */
function startHealthMonitoring(intervalMs: number = HEALTH_CHECK_INTERVAL_MS): NodeJS.Timeout {
  logger.info('Starting health monitoring', { intervalMs });

  // If monitoring is already active, clear the existing interval
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
  }

  // Perform initial health check to establish baseline
  checkHealth().catch(err => {
    logger.error('Error during initial health check', { error: err });
  });

  // Set up an interval to call checkHealth periodically
  healthCheckInterval = setInterval(() => {
    checkHealth().catch(err => {
      logger.error('Error during periodic health check', { error: err });
    });
  }, intervalMs);

  // Return the interval timer reference for potential cancellation
  return healthCheckInterval;
}

/**
 * Stops the periodic health monitoring
 */
function stopHealthMonitoring(): void {
  // Check if healthCheckInterval exists
  if (healthCheckInterval) {
    // Clear the monitoring interval timer
    clearInterval(healthCheckInterval);

    // Set healthCheckInterval to null
    healthCheckInterval = null;

    // Log the stopping of health monitoring
    logger.info('Stopping health monitoring');
  }
}

/**
 * Creates Express middleware for health check endpoints
 * @returns express.RequestHandler Middleware function for health check endpoints
 */
function createHealthCheckMiddleware(): express.RequestHandler {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    // Check if the request path is a health check endpoint
    if (!isHealthCheckEndpoint(req.path)) {
      // If not a health check endpoint, call next() to continue to the next middleware
      return next();
    }

    // Determine the type of health check based on the path and query parameters
    const path = req.path;

    if (path === '/health/live') {
      // For /health/live endpoint, return a simple 200 OK response
      return res.status(200).send('OK');
    } else if (path === '/health/ready') {
      // For /health/ready endpoint, check if the system is ready to accept traffic
      const status = getHealthStatus();
      const statusCode = status === SystemHealthStatus.HEALTHY ? 200 : 503;
      return res.status(statusCode).send(status);
    } else if (path === '/health/deep') {
      // For /health/deep endpoint, perform a comprehensive health check
      checkHealth()
        .then(health => {
          // Return appropriate HTTP status code based on health check result
          const statusCode = health.status === SystemHealthStatus.HEALTHY ? 200 : 503;

          // Include detailed health information in the response body
          res.status(statusCode).json(health);
        })
        .catch(err => {
          // Handle any errors during health check and return 500 status
          logger.error('Error performing deep health check', { error: err });
          res.status(500).send('Error performing health check');
        });
    } else {
      // For other health check endpoints, return 404 Not Found
      res.status(404).send('Not Found');
    }
  };
}

/**
 * Determines the overall system health status based on component results
 * @param componentResults Record<HealthCheckComponent, HealthCheckResult>
 * @returns SystemHealthStatus Overall system health status
 */
function determineSystemHealthStatus(componentResults: Record<HealthCheckComponent, HealthCheckResult>): SystemHealthStatus {
  // Check if any critical components (Database, Redis) are unhealthy
  if (!componentResults[HealthCheckComponent.DATABASE].healthy || !componentResults[HealthCheckComponent.REDIS].healthy) {
    // If any critical component is unhealthy, return CRITICAL status
    return SystemHealthStatus.CRITICAL;
  }

  // Check if multiple non-critical components are unhealthy
  let unhealthyCount = 0;
  for (const component in componentResults) {
    if (component !== HealthCheckComponent.DATABASE && component !== HealthCheckComponent.REDIS && !componentResults[component].healthy) {
      unhealthyCount++;
    }
  }

  if (unhealthyCount >= 2) {
    // If multiple non-critical components are unhealthy, return DEGRADED status
    return SystemHealthStatus.DEGRADED;
  }

  // Check if any non-critical component is unhealthy
  for (const component in componentResults) {
    if (component !== HealthCheckComponent.DATABASE && component !== HealthCheckComponent.REDIS && !componentResults[component].healthy) {
      // If any non-critical component is unhealthy, return WARNING status
      return SystemHealthStatus.WARNING;
    }
  }

  // If all components are healthy, return HEALTHY status
  return SystemHealthStatus.HEALTHY;
}

/**
 * Determines if a request path is a health check endpoint
 * @param path string
 * @returns boolean True if the path is a health check endpoint, false otherwise
 */
function isHealthCheckEndpoint(path: string): boolean {
  // Check if the path matches /health, /api/health, or their subpaths
  return path === '/health' || path === '/api/health' || path.startsWith('/health/') || path.startsWith('/api/health/');
}

// Export functions
export {
  checkHealth,
  checkComponentHealth,
  getHealthStatus,
  getDetailedHealthStatus,
  startHealthMonitoring,
  stopHealthMonitoring,
  createHealthCheckMiddleware,
  determineSystemHealthStatus,
  isHealthCheckEndpoint
};