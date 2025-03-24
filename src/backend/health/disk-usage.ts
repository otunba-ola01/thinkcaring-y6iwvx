import * as os from 'os';  // Native
import * as fs from 'fs';  // Native
import * as path from 'path';  // Native
import * as diskusage from 'diskusage';  // diskusage 1.1.3
import { error, info, debug } from '../utils/logger';
import { createGauge } from '../utils/metrics';

// Define interfaces
enum DiskHealthStatus {
  HEALTHY = 'HEALTHY',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL'
}

interface PathDiskInfo {
  path: string;
  total: number;
  free: number;
  used: number;
  usagePercentage: number;
}

interface DiskMetrics {
  paths: Record<string, PathDiskInfo>;
  status: DiskHealthStatus;
  timestamp: number;
}

interface HealthCheckResult {
  healthy: boolean;
  responseTime: number;
  message: string;
  error?: any;
  metrics?: DiskMetrics;
}

// Global metrics gauges for Prometheus monitoring
const diskUsageGauge = createGauge('node_disk_usage', 'Disk usage statistics in bytes', ['path', 'type']);
const diskUtilizationGauge = createGauge('node_disk_utilization', 'Disk utilization percentage', ['path']);

// Cache for metrics to avoid excessive disk checks
let lastCheckTimestamp: number = 0;
let lastMetrics: DiskMetrics | null = null;

// Paths to monitor for disk usage
const DISK_CHECK_PATHS: string[] = [
  process.cwd(),
  os.tmpdir(),
  process.env.DOCUMENT_STORAGE_PATH || './storage'
];

// Thresholds for disk space warnings and critical alerts
const DISK_WARNING_THRESHOLD = Number(process.env.DISK_WARNING_THRESHOLD) || 80; // 80% usage warning
const DISK_CRITICAL_THRESHOLD = Number(process.env.DISK_CRITICAL_THRESHOLD) || 90; // 90% usage critical
const DISK_CHECK_INTERVAL = Number(process.env.DISK_CHECK_INTERVAL) || 300000; // 5 minutes
const DISK_METRICS_TTL = Number(process.env.DISK_METRICS_TTL) || 60000; // 1 minute cache

/**
 * Performs a health check on the disk usage of the application
 * @returns Result of the disk health check including status and metrics
 */
async function checkDiskHealth(): Promise<HealthCheckResult> {
  try {
    debug('Performing disk health check');
    const startTime = Date.now();
    
    // Get disk metrics
    const metrics = await getDiskMetrics();
    
    // Determine health status
    const status = isDiskHealthy(metrics);
    const healthy = status !== DiskHealthStatus.CRITICAL;
    
    // Calculate response time
    const responseTime = Date.now() - startTime;
    
    // Update disk health status gauge metric (0 for unhealthy, 1 for healthy)
    const healthValue = healthy ? 1 : 0;
    createGauge('node_disk_health', 'Disk health status (1=healthy, 0=unhealthy)').set(healthValue);
    
    if (status === DiskHealthStatus.HEALTHY) {
      return {
        healthy: true,
        responseTime,
        message: 'Disk space is sufficient',
        metrics
      };
    } else if (status === DiskHealthStatus.WARNING) {
      return {
        healthy: true,
        responseTime,
        message: 'Disk usage is approaching critical levels',
        metrics
      };
    } else {
      return {
        healthy: false,
        responseTime,
        message: 'Disk usage has exceeded critical threshold',
        metrics
      };
    }
  } catch (err) {
    error('Error performing disk health check', { error: err });
    return {
      healthy: false,
      responseTime: 0,
      message: 'Error checking disk health',
      error: err
    };
  }
}

/**
 * Collects detailed disk usage metrics for monitored paths
 * @returns Detailed metrics about disk usage for monitored paths
 */
async function getDiskMetrics(): Promise<DiskMetrics> {
  // Check if recent metrics are available and not expired
  const now = Date.now();
  if (lastMetrics && (now - lastCheckTimestamp) < DISK_METRICS_TTL) {
    debug('Using cached disk metrics', { age: now - lastCheckTimestamp });
    return lastMetrics;
  }

  debug('Collecting fresh disk metrics');
  const metrics: DiskMetrics = {
    paths: {},
    status: DiskHealthStatus.HEALTHY,
    timestamp: now
  };

  // For each path in DISK_CHECK_PATHS, collect disk usage information
  for (const checkPath of DISK_CHECK_PATHS) {
    try {
      const pathInfo = await getPathDiskInfo(checkPath);
      metrics.paths[checkPath] = pathInfo;
      
      // Update disk usage gauges with collected metrics
      diskUsageGauge.labels(checkPath, 'total').set(pathInfo.total);
      diskUsageGauge.labels(checkPath, 'free').set(pathInfo.free);
      diskUsageGauge.labels(checkPath, 'used').set(pathInfo.used);
      diskUtilizationGauge.labels(checkPath).set(pathInfo.usagePercentage);
    } catch (err) {
      error(`Error getting disk info for path: ${checkPath}`, { error: err });
    }
  }

  // Determine overall status
  metrics.status = isDiskHealthy(metrics);
  
  // Cache metrics and update lastMetrics and lastCheckTimestamp
  lastMetrics = metrics;
  lastCheckTimestamp = now;
  
  return metrics;
}

/**
 * Periodically tracks disk usage and updates metrics
 */
async function trackDiskUsage(): Promise<void> {
  try {
    const metrics = await getDiskMetrics();
    
    // Log disk usage statistics at debug level
    debug('Disk usage statistics', { 
      metrics,
      timestamp: new Date().toISOString()
    });
    
    // Check for potential disk space issues
    if (metrics.status === DiskHealthStatus.WARNING) {
      // Log warnings if disk usage exceeds warning thresholds
      info('Disk usage is approaching critical levels', { 
        metrics: metrics.paths
      });
    } else if (metrics.status === DiskHealthStatus.CRITICAL) {
      // Log critical alerts if disk usage exceeds critical thresholds
      error('Disk usage has exceeded critical threshold', { 
        metrics: metrics.paths
      });
    }
  } catch (err) {
    error('Error tracking disk usage', { error: err });
  }
}

/**
 * Starts periodic monitoring of disk usage
 * @param intervalMs Interval in milliseconds for checking disk usage
 * @returns Timer reference for the monitoring interval
 */
function startDiskMonitoring(intervalMs: number = DISK_CHECK_INTERVAL): NodeJS.Timeout {
  info('Starting disk usage monitoring', { 
    interval: intervalMs,
    paths: DISK_CHECK_PATHS 
  });
  
  // Perform initial check
  trackDiskUsage().catch(err => {
    error('Error in initial disk usage check', { error: err });
  });
  
  // Set up an interval to call trackDiskUsage periodically
  return setInterval(() => {
    trackDiskUsage().catch(err => {
      error('Error in disk usage monitoring', { error: err });
    });
  }, intervalMs);
}

/**
 * Stops the periodic disk usage monitoring
 * @param monitoringTimer Timer reference from startDiskMonitoring
 */
function stopDiskMonitoring(monitoringTimer: NodeJS.Timeout): void {
  info('Stopping disk usage monitoring');
  clearInterval(monitoringTimer);
}

/**
 * Determines if disk usage is within healthy thresholds
 * @param metrics Disk metrics to evaluate
 * @returns Status indicating disk health level
 */
function isDiskHealthy(metrics: DiskMetrics): DiskHealthStatus {
  let status = DiskHealthStatus.HEALTHY;

  // Check disk usage percentage for each monitored path against thresholds
  for (const path in metrics.paths) {
    const pathInfo = metrics.paths[path];
    
    // Return CRITICAL if any path exceeds critical thresholds
    if (pathInfo.usagePercentage >= DISK_CRITICAL_THRESHOLD) {
      return DiskHealthStatus.CRITICAL;
    }
    
    // Return WARNING if any path exceeds warning but not critical thresholds
    if (pathInfo.usagePercentage >= DISK_WARNING_THRESHOLD) {
      status = DiskHealthStatus.WARNING;
    }
  }

  // Return HEALTHY if all paths are below warning thresholds
  return status;
}

/**
 * Gets disk usage information for a specific path
 * @param checkPath Path to check
 * @returns Disk usage information for the specified path
 */
async function getPathDiskInfo(checkPath: string): Promise<PathDiskInfo> {
  // Ensure the path exists, create it if necessary
  try {
    await fs.promises.mkdir(checkPath, { recursive: true });
  } catch (err) {
    debug(`Could not create directory ${checkPath}`, { error: err });
  }

  // Get disk usage information using diskusage library
  const usage = await diskusage.check(checkPath);
  
  const total = usage.total;
  const free = usage.free;
  const used = total - free;
  const usagePercentage = Math.round((used / total) * 100);

  // Return object with total, free, used space and usage percentage
  return {
    path: checkPath,
    total,
    free,
    used,
    usagePercentage
  };
}

// Export functions to check disk health status and monitor disk usage
export {
  checkDiskHealth,
  getDiskMetrics,
  startDiskMonitoring,
  stopDiskMonitoring
};