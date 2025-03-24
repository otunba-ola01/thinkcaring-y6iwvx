import { logger } from '../utils/logger';
import { createHistogram, createGauge, createCounter } from '../utils/metrics';
import { Request } from '../types/request.types';
import { Response } from '../types/response.types';
import * as express from 'express'; // express 4.18+
import * as onFinished from 'on-finished'; // on-finished 2.4.1

/**
 * Interface defining metrics collected for a specific API route
 */
interface ApiRouteMetrics {
  route: string;
  method: string;
  requestCount: number;
  errorCount: number;
  minResponseTime: number;
  maxResponseTime: number;
  totalResponseTime: number;
  p95ResponseTime: number;
  slaCompliancePercentage: number;
  responseTimes: number[];
  lastUpdated: Date;
}

/**
 * Interface defining aggregate API performance metrics
 */
interface ApiPerformanceMetrics {
  totalRequests: number;
  totalErrors: number;
  errorRate: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  slaCompliancePercentage: number;
  routeMetrics: Record<string, ApiRouteMetrics>;
  timestamp: Date;
}

/**
 * Interface defining the structure of a health check result
 */
interface HealthCheckResult {
  healthy: boolean;
  responseTime: number;
  message: string;
  error?: object;
  metrics?: ApiPerformanceMetrics;
}

// Create metrics collectors
const apiResponseTimeHistogram = createHistogram(
  'api_response_time_seconds',
  'API response time in seconds',
  ['route', 'method', 'status_code'],
  [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10]
);

const apiRequestRateCounter = createCounter(
  'api_request_rate',
  'API request rate',
  ['route', 'method']
);

const apiErrorRateCounter = createCounter(
  'api_error_rate',
  'API error rate',
  ['route', 'method', 'status_code']
);

const apiSlaComplianceGauge = createGauge(
  'api_sla_compliance_percentage',
  'Percentage of API requests meeting SLA',
  ['route']
);

// Map to store API route metrics
const apiPerformanceMetrics = new Map<string, ApiRouteMetrics>();

// SLA threshold in milliseconds (from requirements: 95% < 500ms)
const API_SLA_THRESHOLD_MS = 500;

/**
 * Checks if API performance metrics are within acceptable thresholds
 * 
 * @returns Promise<HealthCheckResult> Health check result for API performance
 */
export async function checkApiPerformanceHealth(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  try {
    const metrics = getApiPerformanceMetrics();
    
    // Check if performance meets acceptable thresholds:
    // 1. 95th percentile response time is below SLA threshold
    // 2. Error rate is below 1%
    // 3. SLA compliance percentage is at least 95%
    const isHealthy = 
      metrics.p95ResponseTime < API_SLA_THRESHOLD_MS && 
      metrics.errorRate < 1.0 && 
      metrics.slaCompliancePercentage >= 95.0;
    
    const responseTime = Date.now() - startTime;
    
    logger.info('API performance health check completed', {
      healthy: isHealthy,
      p95ResponseTime: metrics.p95ResponseTime,
      errorRate: metrics.errorRate,
      slaCompliancePercentage: metrics.slaCompliancePercentage,
      responseTime
    });
    
    return {
      healthy: isHealthy,
      responseTime,
      message: isHealthy 
        ? 'API performance within acceptable thresholds'
        : 'API performance exceeds acceptable thresholds',
      metrics
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    logger.error('Error checking API performance health', { error });
    
    return {
      healthy: false,
      responseTime,
      message: 'Error checking API performance health',
      error
    };
  }
}

/**
 * Retrieves current API performance metrics
 * 
 * @returns ApiPerformanceMetrics Current API performance metrics
 */
export function getApiPerformanceMetrics(): ApiPerformanceMetrics {
  let totalRequests = 0;
  let totalErrors = 0;
  let totalResponseTime = 0;
  let responseTimes: number[] = [];
  let routesWithinSla = 0;
  let routeCount = 0;
  
  const routeMetrics: Record<string, ApiRouteMetrics> = {};
  
  // Aggregate metrics across all routes
  for (const [key, metrics] of apiPerformanceMetrics.entries()) {
    totalRequests += metrics.requestCount;
    totalErrors += metrics.errorCount;
    totalResponseTime += metrics.totalResponseTime;
    responseTimes = responseTimes.concat(metrics.responseTimes);
    
    routeMetrics[key] = { ...metrics };
    
    // Count routes that meet SLA requirements (95% of requests < threshold)
    if (metrics.slaCompliancePercentage >= 95.0) {
      routesWithinSla++;
    }
    
    routeCount++;
  }
  
  // Calculate aggregate metrics
  const errorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;
  const averageResponseTime = totalRequests > 0 ? totalResponseTime / totalRequests : 0;
  const p95ResponseTime = responseTimes.length > 0 ? calculatePercentile(responseTimes, 95) : 0;
  
  // Overall SLA compliance is the percentage of routes that meet SLA requirements
  const slaCompliancePercentage = routeCount > 0 
    ? (routesWithinSla / routeCount) * 100 
    : 100; // If no routes, assume compliance
  
  logger.debug('Generated API performance metrics', {
    totalRequests,
    totalErrors,
    errorRate,
    averageResponseTime,
    p95ResponseTime,
    slaCompliancePercentage,
    routeCount
  });
  
  return {
    totalRequests,
    totalErrors,
    errorRate,
    averageResponseTime,
    p95ResponseTime,
    slaCompliancePercentage,
    routeMetrics,
    timestamp: new Date()
  };
}

/**
 * Creates Express middleware for tracking API performance metrics
 * 
 * @returns express.RequestHandler Middleware function for tracking API performance
 */
export function createApiPerformanceMiddleware(): express.RequestHandler {
  return (req: Request, res: Response, next: express.NextFunction) => {
    const originalUrl = req.originalUrl || req.url;
    
    // Skip tracking for health check and static asset routes
    if (shouldSkipTracking(originalUrl)) {
      return next();
    }
    
    // Add start time to request if not already set
    const reqWithTiming = req as Request & { startTime?: number };
    reqWithTiming.startTime = reqWithTiming.startTime || Date.now();
    
    // Normalize the route path to group similar routes
    const route = getNormalizedRoute(originalUrl);
    const method = req.method;
    
    // Increment request counter
    apiRequestRateCounter.labels(route, method).inc();
    
    // Track response time when the request is complete
    onFinished(res, (err, res) => {
      if (err) {
        logger.error('Error tracking API performance', { 
          route, 
          method, 
          error: err 
        });
        return;
      }
      
      const responseTime = Date.now() - reqWithTiming.startTime!;
      const statusCode = res.statusCode;
      
      // Record response time in histogram (convert to seconds for Prometheus)
      apiResponseTimeHistogram.labels(route, method, statusCode.toString()).observe(responseTime / 1000);
      
      // Increment error counter if status code is 4xx or 5xx
      if (statusCode >= 400) {
        apiErrorRateCounter.labels(route, method, statusCode.toString()).inc();
      }
      
      // Update route metrics
      updateRouteMetrics(route, method, responseTime, statusCode);
      
      // Update SLA compliance gauge
      const routeMetrics = apiPerformanceMetrics.get(`${route}:${method}`);
      if (routeMetrics) {
        apiSlaComplianceGauge.labels(route).set(routeMetrics.slaCompliancePercentage);
      }
      
      // Log performance data
      logger.debug('API request completed', {
        route,
        method,
        statusCode,
        responseTime,
        slaThreshold: API_SLA_THRESHOLD_MS,
        withinSla: responseTime <= API_SLA_THRESHOLD_MS
      });
    });
    
    next();
  };
}

/**
 * Manually tracks API performance for a specific route
 * 
 * @param route Route path
 * @param method HTTP method
 * @param responseTime Response time in milliseconds
 * @param statusCode HTTP status code
 */
export function trackApiPerformance(
  route: string,
  method: string,
  responseTime: number,
  statusCode: number
): void {
  // Record response time in histogram (convert to seconds for Prometheus)
  apiResponseTimeHistogram.labels(route, method, statusCode.toString()).observe(responseTime / 1000);
  
  // Increment request counter
  apiRequestRateCounter.labels(route, method).inc();
  
  // Increment error counter if status code is 4xx or 5xx
  if (statusCode >= 400) {
    apiErrorRateCounter.labels(route, method, statusCode.toString()).inc();
  }
  
  // Update route metrics
  updateRouteMetrics(route, method, responseTime, statusCode);
  
  // Update SLA compliance gauge
  const routeMetrics = apiPerformanceMetrics.get(`${route}:${method}`);
  if (routeMetrics) {
    apiSlaComplianceGauge.labels(route).set(routeMetrics.slaCompliancePercentage);
  }
  
  logger.debug('Manual API performance tracking', {
    route,
    method,
    statusCode,
    responseTime,
    slaThreshold: API_SLA_THRESHOLD_MS,
    withinSla: responseTime <= API_SLA_THRESHOLD_MS
  });
}

/**
 * Calculates the error rate for API requests
 * 
 * @param route Route path
 * @param method HTTP method
 * @returns number Error rate as a percentage
 */
export function calculateApiErrorRate(route: string, method: string): number {
  const metrics = apiPerformanceMetrics.get(`${route}:${method}`);
  
  if (!metrics || metrics.requestCount === 0) {
    return 0;
  }
  
  return (metrics.errorCount / metrics.requestCount) * 100;
}

/**
 * Updates performance metrics for a specific route
 * 
 * @param route Route path
 * @param method HTTP method
 * @param responseTime Response time in milliseconds
 * @param statusCode HTTP status code
 */
function updateRouteMetrics(
  route: string,
  method: string,
  responseTime: number,
  statusCode: number
): void {
  const key = `${route}:${method}`;
  let metrics = apiPerformanceMetrics.get(key);
  
  if (!metrics) {
    // Initialize metrics for new route
    metrics = {
      route,
      method,
      requestCount: 0,
      errorCount: 0,
      minResponseTime: Number.MAX_VALUE,
      maxResponseTime: 0,
      totalResponseTime: 0,
      p95ResponseTime: 0,
      slaCompliancePercentage: 100, // Initially assume full compliance
      responseTimes: [],
      lastUpdated: new Date()
    };
  }
  
  // Update metrics
  metrics.requestCount++;
  if (statusCode >= 400) {
    metrics.errorCount++;
  }
  
  // Update response time stats
  metrics.minResponseTime = Math.min(metrics.minResponseTime, responseTime);
  metrics.maxResponseTime = Math.max(metrics.maxResponseTime, responseTime);
  metrics.totalResponseTime += responseTime;
  
  // Keep a limited number of response time samples (last 1000)
  // to avoid excessive memory usage while maintaining statistical accuracy
  metrics.responseTimes.push(responseTime);
  if (metrics.responseTimes.length > 1000) {
    metrics.responseTimes.shift();
  }
  
  // Calculate p95 response time
  metrics.p95ResponseTime = calculatePercentile(metrics.responseTimes, 95);
  
  // Calculate SLA compliance percentage (percentage of requests below threshold)
  const withinSlaCount = metrics.responseTimes.filter(time => time <= API_SLA_THRESHOLD_MS).length;
  metrics.slaCompliancePercentage = (withinSlaCount / metrics.responseTimes.length) * 100;
  
  // Update last updated timestamp
  metrics.lastUpdated = new Date();
  
  // Save updated metrics
  apiPerformanceMetrics.set(key, metrics);
}

/**
 * Calculates a percentile value from an array of samples
 * 
 * @param samples Array of sample values
 * @param percentile Percentile to calculate (0-100)
 * @returns number The calculated percentile value
 */
function calculatePercentile(samples: number[], percentile: number): number {
  if (samples.length === 0) {
    return 0;
  }
  
  if (samples.length === 1) {
    return samples[0];
  }
  
  // Sort samples in ascending order
  const sortedSamples = [...samples].sort((a, b) => a - b);
  
  // Calculate index based on percentile
  // For example, 95th percentile would be at index 95% of the way through the array
  const index = Math.ceil((percentile / 100) * sortedSamples.length) - 1;
  
  // Return the value at the calculated index
  return sortedSamples[Math.max(0, Math.min(index, sortedSamples.length - 1))];
}

/**
 * Determines if performance tracking should be skipped for certain paths
 * 
 * @param path Request path
 * @returns boolean True if tracking should be skipped, false otherwise
 */
function shouldSkipTracking(path: string): boolean {
  // Skip health check endpoints
  if (path.startsWith('/health') || path === '/api/health' || 
      path.includes('/health/live') || path.includes('/health/ready')) {
    return true;
  }
  
  // Skip static assets
  if (path.startsWith('/static/') || 
      path.startsWith('/assets/') || 
      path.startsWith('/favicon.ico') ||
      path.endsWith('.js') || 
      path.endsWith('.css') || 
      path.endsWith('.png') || 
      path.endsWith('.jpg') || 
      path.endsWith('.jpeg') ||
      path.endsWith('.gif') ||
      path.endsWith('.svg')) {
    return true;
  }
  
  // Skip metrics endpoint
  if (path === '/metrics' || path === '/api/metrics') {
    return true;
  }
  
  return false;
}

/**
 * Normalizes route paths by replacing IDs with placeholders
 * to group similar routes for more meaningful metrics
 * 
 * @param originalUrl Original request URL
 * @returns string Normalized route path
 */
function getNormalizedRoute(originalUrl: string): string {
  // Remove query string if present
  const path = originalUrl.split('?')[0];
  
  // Replace UUID pattern with :id placeholder
  let normalizedPath = path.replace(
    /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
    '/:id'
  );
  
  // Replace numeric IDs with :id placeholder
  normalizedPath = normalizedPath.replace(/\/\d+(?=\/|$)/g, '/:id');
  
  return normalizedPath;
}