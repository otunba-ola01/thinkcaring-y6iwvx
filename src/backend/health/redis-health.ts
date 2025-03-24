import Redis from 'ioredis'; // ioredis v5.3.2
import { info, error, debug } from '../utils/logger';
import { createGauge, createHistogram } from '../utils/metrics';
import { redisOptions } from '../config/redis.config';
import { cacheManager, createRedisClient } from '../utils/cache';

/**
 * Interface defining the structure of a health check result
 */
interface HealthCheckResult {
  healthy: boolean;
  responseTime: number;
  message: string;
  error?: object;
  metrics?: RedisMetrics;
}

/**
 * Interface defining the structure of Redis metrics
 */
interface RedisMetrics {
  memoryUsage: number;
  memoryUsagePercent: number;
  connectedClients: number;
  operationsPerSecond: number;
  hitRate: number;
  keyCount: number;
  commandPerformance?: RedisCommandMetrics;
}

/**
 * Interface defining the structure of Redis command performance metrics
 */
interface RedisCommandMetrics {
  setCommandTime: number;
  getCommandTime: number;
  delCommandTime: number;
  averageCommandTime: number;
  healthy: boolean;
}

// Create Prometheus metrics for Redis health monitoring
const redisHealthGauge = createGauge('redis_health_status', 'Redis health status (0=unhealthy, 1=healthy)');
const redisMemoryGauge = createGauge('redis_memory_usage', 'Redis memory usage in bytes');
const redisClientsGauge = createGauge('redis_connected_clients', 'Number of connected clients to Redis');
const redisCommandsHistogram = createHistogram(
  'redis_command_time',
  'Redis command execution time in milliseconds',
  ['command'],
  [1, 5, 10, 25, 50, 100, 250, 500]
);

// Cache the last check timestamp and metrics to reduce burden on Redis
let lastCheckTimestamp: number = 0;
let lastMetrics: RedisMetrics | null = null;

/**
 * Performs a health check on the Redis connection
 * @returns Promise<HealthCheckResult> Health check result with status and metrics
 */
async function checkRedisHealth(): Promise<HealthCheckResult> {
  info('Checking Redis health');
  const startTime = Date.now();
  
  try {
    // Get Redis client from cache manager
    const client = cacheManager.getClient();
    
    // Check if Redis is responsive using a simple PING command
    const pingResult = await client.ping();
    const isHealthy = pingResult === 'PONG';
    
    // Collect additional Redis metrics
    const metrics = await getRedisMetrics();
    
    // Update Prometheus metrics
    redisHealthGauge.set(isHealthy ? 1 : 0);
    redisMemoryGauge.set(metrics.memoryUsage);
    redisClientsGauge.set(metrics.connectedClients);
    
    // Calculate response time
    const responseTime = Date.now() - startTime;
    
    // Update last check timestamp and metrics
    lastCheckTimestamp = Date.now();
    lastMetrics = metrics;
    
    const result = {
      healthy: isHealthy,
      responseTime,
      message: isHealthy ? 'Redis is healthy' : 'Redis is not responding correctly',
      metrics
    };
    
    info(`Redis health check completed: ${result.healthy ? 'HEALTHY' : 'UNHEALTHY'}`, {
      responseTime,
      memoryUsage: metrics.memoryUsage,
      connectedClients: metrics.connectedClients,
      operationsPerSecond: metrics.operationsPerSecond
    });
    
    return result;
  } catch (err) {
    error('Redis health check failed', { error: err });
    
    // Update Prometheus metrics to indicate unhealthy status
    redisHealthGauge.set(0);
    
    return {
      healthy: false,
      responseTime: Date.now() - startTime,
      message: 'Redis health check failed',
      error: err instanceof Error ? { message: err.message, stack: err.stack } : { message: String(err) }
    };
  }
}

/**
 * Collects detailed metrics about Redis
 * @returns Promise<RedisMetrics> Detailed Redis metrics
 */
async function getRedisMetrics(): Promise<RedisMetrics> {
  // Check if we have recent metrics that aren't too old (less than 30 seconds)
  const metricsAge = Date.now() - lastCheckTimestamp;
  if (lastMetrics && metricsAge < 30000) {
    return lastMetrics;
  }
  
  try {
    const client = cacheManager.getClient();
    
    // Execute INFO command to get Redis server information
    const infoStr = await client.info();
    
    // Parse Redis INFO response to extract metrics
    const info: Record<string, string> = {};
    infoStr.split('\r\n').forEach(line => {
      const parts = line.split(':');
      if (parts.length === 2) {
        info[parts[0]] = parts[1];
      }
    });
    
    // Extract memory metrics
    const usedMemory = parseInt(info['used_memory'] || '0', 10);
    const maxMemory = parseInt(info['maxmemory'] || '0', 10);
    const memoryUsagePercent = maxMemory > 0 ? (usedMemory / maxMemory) * 100 : 0;
    
    // Extract client metrics
    const connectedClients = parseInt(info['connected_clients'] || '0', 10);
    
    // Extract operations metrics
    const instantaneousOpsPerSec = parseInt(info['instantaneous_ops_per_sec'] || '0', 10);
    
    // Extract cache hit/miss metrics
    const keyspaceHits = parseInt(info['keyspace_hits'] || '0', 10);
    const keyspaceMisses = parseInt(info['keyspace_misses'] || '0', 10);
    const hitRate = keyspaceHits + keyspaceMisses > 0 
      ? keyspaceHits / (keyspaceHits + keyspaceMisses) * 100 
      : 0;
    
    // Extract key count metrics
    let keyCount = 0;
    // Parse keyspace info, format: db0:keys=1,expires=0,avg_ttl=0
    Object.keys(info).forEach(key => {
      if (key.startsWith('db')) {
        const dbInfo = info[key];
        const keysMatch = dbInfo.match(/keys=(\d+)/);
        if (keysMatch && keysMatch[1]) {
          keyCount += parseInt(keysMatch[1], 10);
        }
      }
    });
    
    // Get command performance metrics
    const commandPerformance = await checkRedisCommand();
    
    // Update Prometheus metrics
    redisMemoryGauge.set(usedMemory);
    redisClientsGauge.set(connectedClients);
    
    const metrics: RedisMetrics = {
      memoryUsage: usedMemory,
      memoryUsagePercent,
      connectedClients,
      operationsPerSecond: instantaneousOpsPerSec,
      hitRate,
      keyCount,
      commandPerformance
    };
    
    // Cache metrics and update lastMetrics
    lastMetrics = metrics;
    lastCheckTimestamp = Date.now();
    
    return metrics;
  } catch (err) {
    error('Failed to collect Redis metrics', { error: err });
    
    // Return default metrics if collection fails
    return {
      memoryUsage: 0,
      memoryUsagePercent: 0,
      connectedClients: 0,
      operationsPerSecond: 0,
      hitRate: 0,
      keyCount: 0
    };
  }
}

/**
 * Checks Redis command performance by executing a test command
 * @returns Promise<RedisCommandMetrics> Command performance metrics and health status
 */
async function checkRedisCommand(): Promise<RedisCommandMetrics> {
  try {
    const client = cacheManager.getClient();
    const testKey = `health:test:${Date.now()}`;
    const testValue = 'health_check_test_value';
    
    // Measure SET command performance
    const setStartTime = Date.now();
    await client.set(testKey, testValue, 'EX', 60); // Expire in 60 seconds
    const setCommandTime = Date.now() - setStartTime;
    redisCommandsHistogram.labels('set').observe(setCommandTime);
    
    // Measure GET command performance
    const getStartTime = Date.now();
    await client.get(testKey);
    const getCommandTime = Date.now() - getStartTime;
    redisCommandsHistogram.labels('get').observe(getCommandTime);
    
    // Measure DEL command performance
    const delStartTime = Date.now();
    await client.del(testKey);
    const delCommandTime = Date.now() - delStartTime;
    redisCommandsHistogram.labels('del').observe(delCommandTime);
    
    // Calculate average command time
    const averageCommandTime = (setCommandTime + getCommandTime + delCommandTime) / 3;
    
    // Determine if command performance is healthy (under 50ms average)
    const healthy = averageCommandTime < 50;
    
    return {
      setCommandTime,
      getCommandTime,
      delCommandTime,
      averageCommandTime,
      healthy
    };
  } catch (err) {
    error('Redis command check failed', { error: err });
    
    return {
      setCommandTime: 0,
      getCommandTime: 0,
      delCommandTime: 0,
      averageCommandTime: 0,
      healthy: false
    };
  }
}

/**
 * Starts periodic monitoring of Redis health
 * @param intervalMs Interval in milliseconds between health checks
 * @returns NodeJS.Timeout Timer reference for the monitoring interval
 */
function monitorRedisHealth(intervalMs: number = 60000): NodeJS.Timeout {
  info(`Starting Redis health monitoring with interval of ${intervalMs}ms`);
  
  // Perform initial health check to establish baseline
  checkRedisHealth().catch(err => {
    error('Initial Redis health check failed', { error: err });
  });
  
  // Set up an interval to call checkRedisHealth periodically
  const timer = setInterval(async () => {
    try {
      await checkRedisHealth();
    } catch (err) {
      error('Periodic Redis health check failed', { error: err });
    }
  }, intervalMs);
  
  return timer;
}

/**
 * Stops the periodic Redis health monitoring
 * @param monitoringTimer Timer reference from monitorRedisHealth
 */
function stopRedisHealthMonitoring(monitoringTimer: NodeJS.Timeout): void {
  clearInterval(monitoringTimer);
  info('Stopped Redis health monitoring');
}

/**
 * Creates a test Redis client for health checks
 * @returns Promise<Redis> Configured Redis client for testing
 */
async function createTestRedisClient(): Promise<Redis> {
  // Create a new Redis client with timeout settings
  const client = new Redis({
    ...redisOptions,
    connectTimeout: 2000,
    commandTimeout: 1000,
    maxRetriesPerRequest: 1
  });
  
  // Configure error handling
  client.on('error', (err) => {
    debug('Test Redis client error', { error: err });
  });
  
  return client;
}

export {
  checkRedisHealth,
  getRedisMetrics,
  monitorRedisHealth,
  stopRedisHealthMonitoring
};