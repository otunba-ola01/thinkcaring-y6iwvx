import { error, info, debug } from '../utils/logger';
import { createGauge } from '../utils/metrics';
import * as os from 'os'; // native

// Memory health status enum
enum MemoryHealthStatus {
  HEALTHY = 'HEALTHY',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL'
}

// Interface defining the structure of memory metrics
interface MemoryMetrics {
  heapTotal: number;
  heapUsed: number;
  heapUsagePercentage: number;
  rss: number;
  external: number;
  arrayBuffers: number;
  systemTotal: number;
  systemFree: number;
  systemUsed: number;
  systemUsagePercentage: number;
}

// Interface defining the structure of a health check result
interface HealthCheckResult {
  healthy: boolean;
  responseTime: number;
  message: string;
  error?: object;
  metrics?: MemoryMetrics;
}

// Create Prometheus gauges for memory metrics
const memoryUsageGauge = createGauge('node_memory_usage', 'Memory usage statistics in bytes', ['type']);
const memoryUtilizationGauge = createGauge('node_memory_utilization', 'Memory utilization percentage');

// Cache variables to avoid excessive checks
let lastCheckTimestamp: number = 0;
let lastMetrics: MemoryMetrics | null = null;

// Constants for memory thresholds
const METRICS_CACHE_TTL = 5000; // 5 seconds
const HEAP_USAGE_WARNING_THRESHOLD = 0.7; // 70%
const HEAP_USAGE_CRITICAL_THRESHOLD = 0.85; // 85%
const SYSTEM_MEMORY_WARNING_THRESHOLD = 0.8; // 80%
const SYSTEM_MEMORY_CRITICAL_THRESHOLD = 0.9; // 90%

/**
 * Performs a health check on the memory usage of the application
 * @returns Result of the memory health check including status and metrics
 */
async function checkMemoryHealth(): Promise<HealthCheckResult> {
  debug('Performing memory health check');
  const startTime = Date.now();
  
  try {
    // Collect memory usage statistics using getMemoryMetrics()
    const metrics = await getMemoryMetrics();
    
    // Evaluate if memory usage is within acceptable thresholds
    const memoryHealth = isMemoryHealthy(metrics);
    const responseTime = Date.now() - startTime;
    
    // Update memory health status gauge metric (0 for unhealthy, 1 for healthy)
    memoryUsageGauge.labels('health_status').set(memoryHealth === MemoryHealthStatus.CRITICAL ? 0 : 1);
    
    // Return success status with response time and memory metrics if within thresholds
    if (memoryHealth === MemoryHealthStatus.HEALTHY) {
      return {
        healthy: true,
        responseTime,
        message: 'Memory usage is within acceptable thresholds',
        metrics
      };
    } 
    // Return warning status if memory usage is approaching thresholds
    else if (memoryHealth === MemoryHealthStatus.WARNING) {
      return {
        healthy: true, // Still considered healthy but with a warning
        responseTime,
        message: 'Memory usage is approaching thresholds, consider scaling',
        metrics
      };
    } 
    // Return failure status if memory usage exceeds critical thresholds
    else {
      return {
        healthy: false,
        responseTime,
        message: 'Memory usage exceeds critical thresholds',
        metrics
      };
    }
  } catch (err) {
    // Catch and log any errors during the health check
    error('Error performing memory health check', { error: err });
    
    // Return failure status with error details if check fails
    return {
      healthy: false,
      responseTime: Date.now() - startTime,
      message: 'Error performing memory health check',
      error: err as object
    };
  }
}

/**
 * Collects detailed memory usage metrics for the application
 * @returns Detailed metrics about memory usage
 */
async function getMemoryMetrics(): Promise<MemoryMetrics> {
  const now = Date.now();
  
  // Check if recent metrics are available and not expired
  if (lastMetrics && (now - lastCheckTimestamp) < METRICS_CACHE_TTL) {
    debug('Returning cached memory metrics');
    return lastMetrics;
  }
  
  // Collect Node.js process memory usage using process.memoryUsage()
  const memoryUsage = process.memoryUsage();
  
  // Collect system memory information using os.totalmem() and os.freemem()
  const systemTotal = os.totalmem();
  const systemFree = os.freemem();
  const systemUsed = systemTotal - systemFree;
  
  // Calculate memory utilization percentages
  const heapUsagePercentage = memoryUsage.heapUsed / memoryUsage.heapTotal;
  const systemUsagePercentage = systemUsed / systemTotal;
  
  // Create metrics object
  const metrics: MemoryMetrics = {
    // Node.js heap metrics
    heapTotal: memoryUsage.heapTotal,
    heapUsed: memoryUsage.heapUsed,
    heapUsagePercentage,
    rss: memoryUsage.rss,
    external: memoryUsage.external,
    arrayBuffers: memoryUsage.arrayBuffers || 0, // Handle older Node.js versions
    
    // System memory metrics
    systemTotal,
    systemFree,
    systemUsed,
    systemUsagePercentage
  };
  
  // Update memory usage gauges with collected metrics
  memoryUsageGauge.labels('heap_total').set(metrics.heapTotal);
  memoryUsageGauge.labels('heap_used').set(metrics.heapUsed);
  memoryUsageGauge.labels('rss').set(metrics.rss);
  memoryUsageGauge.labels('external').set(metrics.external);
  memoryUsageGauge.labels('array_buffers').set(metrics.arrayBuffers);
  memoryUsageGauge.labels('system_total').set(metrics.systemTotal);
  memoryUsageGauge.labels('system_free').set(metrics.systemFree);
  memoryUsageGauge.labels('system_used').set(metrics.systemUsed);
  
  // Set the memory utilization gauge (as percentage)
  memoryUtilizationGauge.set(metrics.heapUsagePercentage * 100);
  
  // Cache metrics and update lastMetrics and lastCheckTimestamp
  lastMetrics = metrics;
  lastCheckTimestamp = now;
  
  return metrics;
}

/**
 * Periodically tracks memory usage and updates metrics
 */
async function trackMemoryUsage(): Promise<void> {
  try {
    // Collect memory metrics using getMemoryMetrics()
    const metrics = await getMemoryMetrics();
    
    // Log memory usage statistics at debug level
    debug('Memory usage statistics', {
      heapUsage: `${(metrics.heapUsagePercentage * 100).toFixed(2)}%`,
      systemUsage: `${(metrics.systemUsagePercentage * 100).toFixed(2)}%`,
      heapUsedMB: (metrics.heapUsed / 1024 / 1024).toFixed(2),
      rssMB: (metrics.rss / 1024 / 1024).toFixed(2),
      systemFreeMB: (metrics.systemFree / 1024 / 1024).toFixed(2)
    });
    
    // Check for potential memory issues
    if (metrics.heapUsagePercentage > HEAP_USAGE_WARNING_THRESHOLD) {
      // Log warnings if memory usage exceeds warning thresholds
      info('High heap memory usage detected', {
        heapUsage: `${(metrics.heapUsagePercentage * 100).toFixed(2)}%`,
        threshold: `${(HEAP_USAGE_WARNING_THRESHOLD * 100).toFixed(2)}%`
      });
      
      // Trigger garbage collection if supported and memory usage is high
      if (metrics.heapUsagePercentage > HEAP_USAGE_CRITICAL_THRESHOLD && global.gc) {
        info('Triggering garbage collection due to high memory usage');
        global.gc();
      }
    }
    
    if (metrics.systemUsagePercentage > SYSTEM_MEMORY_WARNING_THRESHOLD) {
      info('High system memory usage detected', {
        systemUsage: `${(metrics.systemUsagePercentage * 100).toFixed(2)}%`,
        threshold: `${(SYSTEM_MEMORY_WARNING_THRESHOLD * 100).toFixed(2)}%`
      });
    }
  } catch (err) {
    error('Error tracking memory usage', { error: err });
  }
}

/**
 * Starts periodic monitoring of memory usage
 * @param intervalMs Interval in milliseconds between memory checks
 * @returns Timer reference for the monitoring interval
 */
function startMemoryMonitoring(intervalMs = 60000): NodeJS.Timeout {
  // Log the start of memory monitoring
  info('Starting memory usage monitoring', { intervalMs });
  
  // Set up an interval to call trackMemoryUsage periodically
  return setInterval(trackMemoryUsage, intervalMs);
}

/**
 * Stops the periodic memory usage monitoring
 * @param monitoringTimer Timer reference returned by startMemoryMonitoring
 */
function stopMemoryMonitoring(monitoringTimer: NodeJS.Timeout): void {
  // Clear the monitoring interval timer
  clearInterval(monitoringTimer);
  
  // Log the stopping of memory monitoring
  info('Stopped memory usage monitoring');
}

/**
 * Determines if memory usage is within healthy thresholds
 * @param metrics Memory metrics to evaluate
 * @returns Status indicating memory health level
 */
function isMemoryHealthy(metrics: MemoryMetrics): MemoryHealthStatus {
  // Check heap usage percentage against thresholds
  if (metrics.heapUsagePercentage > HEAP_USAGE_CRITICAL_THRESHOLD) {
    return MemoryHealthStatus.CRITICAL;
  }
  
  // Check system memory usage percentage against thresholds
  if (metrics.systemUsagePercentage > SYSTEM_MEMORY_CRITICAL_THRESHOLD) {
    return MemoryHealthStatus.CRITICAL;
  }
  
  // Return WARNING if any metric exceeds warning but not critical thresholds
  if (metrics.heapUsagePercentage > HEAP_USAGE_WARNING_THRESHOLD ||
      metrics.systemUsagePercentage > SYSTEM_MEMORY_WARNING_THRESHOLD) {
    return MemoryHealthStatus.WARNING;
  }
  
  // Return HEALTHY if all metrics are below warning thresholds
  return MemoryHealthStatus.HEALTHY;
}

/**
 * Analyzes memory usage patterns to detect potential memory leaks
 * @param historicalMetrics Array of memory metrics over time
 * @returns Whether a potential memory leak is detected
 */
function detectMemoryLeak(historicalMetrics: MemoryMetrics[]): boolean {
  // Check if sufficient historical data is available
  if (historicalMetrics.length < 5) {
    return false;
  }
  
  // Analyze the trend of heap usage over time
  const heapUsedValues = historicalMetrics.map(m => m.heapUsed);
  
  // Count consecutive increases to analyze the pattern
  let consecutiveIncreases = 0;
  for (let i = 1; i < heapUsedValues.length; i++) {
    if (heapUsedValues[i] > heapUsedValues[i - 1]) {
      consecutiveIncreases++;
    } else {
      // If we see a significant decrease, it might be due to GC - reset counter
      if ((heapUsedValues[i - 1] - heapUsedValues[i]) / heapUsedValues[i - 1] > 0.2) {
        consecutiveIncreases = 0;
      }
    }
  }
  
  // Calculate the rate of increase in memory usage
  const startValue = heapUsedValues[0];
  const endValue = heapUsedValues[heapUsedValues.length - 1];
  const overallGrowthRate = (endValue - startValue) / startValue;
  
  // Compare against expected growth patterns
  const highConsecutiveIncreases = consecutiveIncreases > (historicalMetrics.length * 0.7);
  const highOverallGrowth = overallGrowthRate > 0.2; // 20% growth is abnormal
  
  // Return true if abnormal growth pattern is detected
  if (highConsecutiveIncreases && highOverallGrowth) {
    info('Potential memory leak detected', {
      consecutiveIncreases,
      totalSamples: historicalMetrics.length,
      overallGrowthRate: `${(overallGrowthRate * 100).toFixed(2)}%`
    });
    return true;
  }
  
  // Return false if memory usage pattern appears normal
  return false;
}

// Extend the global interface to include gc() if available
declare global {
  namespace NodeJS {
    interface Global {
      gc?: () => void;
    }
  }
}

// Export functions
export {
  checkMemoryHealth,
  getMemoryMetrics,
  startMemoryMonitoring,
  stopMemoryMonitoring
};