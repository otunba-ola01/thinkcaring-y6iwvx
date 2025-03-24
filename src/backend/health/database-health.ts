/**
 * Database Health Check Module
 *
 * Provides database health check functionality for the HCBS Revenue Management System.
 * Monitors database connectivity, performance metrics, and operational status to ensure
 * the database is functioning properly and within expected parameters.
 */

import { info, error, debug } from '../utils/logger';
import { createGauge, createHistogram, trackDatabaseQueryTime } from '../utils/metrics';
import { db, getKnexInstance } from '../database/connection';
import { databaseConfig } from '../config/database.config';

// Interfaces
interface HealthCheckResult {
  healthy: boolean;
  responseTime: number;
  message: string;
  error?: object;
  metrics?: DatabaseMetrics;
}

interface DatabaseMetrics {
  connectionPool: ConnectionPoolMetrics;
  queryPerformance: QueryPerformanceMetrics;
  databaseSize: number;
  activeTransactions: number;
  transactionsPerSecond: number;
  tableStats: object;
  indexStats: object;
  longestRunningQuery: object;
}

interface ConnectionPoolMetrics {
  total: number;
  active: number;
  idle: number;
  waiting: number;
  utilizationPercent: number;
  healthy: boolean;
}

interface QueryPerformanceMetrics {
  testQueryTime: number;
  averageQueryTime: number;
  healthy: boolean;
}

// Metrics
const dbHealthGauge = createGauge('database_health_status', 'Database health status (0=unhealthy, 1=healthy)');
const dbConnectionPoolGauge = createGauge('database_connection_pool', 'Database connection pool statistics', ['state']);
const dbQueryTimeHistogram = createHistogram(
  'database_query_time',
  'Database query execution time in milliseconds',
  ['operation'],
  [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000]
);

// State
let lastCheckTimestamp: number = 0;
let lastMetrics: DatabaseMetrics | null = null;

/**
 * Performs a health check on the database connection
 * @returns Promise resolving to health check result with status and metrics
 */
export async function checkDatabaseHealth(): Promise<HealthCheckResult> {
  info('Starting database health check');
  const startTime = Date.now();
  
  try {
    // Basic connectivity check
    const isConnected = await db.healthCheck();
    
    if (!isConnected) {
      error('Database health check failed: Database not connected');
      dbHealthGauge.set(0);
      
      return {
        healthy: false,
        responseTime: Date.now() - startTime,
        message: 'Database connectivity check failed'
      };
    }
    
    // Get detailed metrics
    const metrics = await getDatabaseMetrics();
    
    // Determine overall health based on metrics
    const isHealthy = metrics.connectionPool.healthy && metrics.queryPerformance.healthy;
    
    // Update health gauge
    dbHealthGauge.set(isHealthy ? 1 : 0);
    
    // Update state
    lastCheckTimestamp = Date.now();
    lastMetrics = metrics;
    
    info('Database health check completed', { 
      healthy: isHealthy, 
      connectionPool: metrics.connectionPool.healthy,
      queryPerformance: metrics.queryPerformance.healthy,
      responseTime: Date.now() - startTime
    });
    
    return {
      healthy: isHealthy,
      responseTime: Date.now() - startTime,
      message: isHealthy ? 'Database is healthy' : 'Database health check failed',
      metrics
    };
  } catch (err) {
    error('Error during database health check', { error: err });
    dbHealthGauge.set(0);
    
    return {
      healthy: false,
      responseTime: Date.now() - startTime,
      message: 'Error during database health check',
      error: err
    };
  }
}

/**
 * Collects detailed metrics about the database
 * @returns Promise resolving to detailed database metrics
 */
export async function getDatabaseMetrics(): Promise<DatabaseMetrics> {
  // Check if we have recent metrics (less than 1 minute old)
  const now = Date.now();
  if (lastMetrics && (now - lastCheckTimestamp) < 60000) {
    debug('Using cached database metrics');
    return lastMetrics;
  }
  
  debug('Collecting database metrics');
  
  // Check connection pool
  const connectionPool = await checkConnectionPool();
  
  // Check query performance
  const queryPerformance = await checkQueryPerformance();
  
  // Get additional metrics
  const knex = getKnexInstance();
  
  // Database size (PostgreSQL-specific)
  let databaseSize = 0;
  try {
    const sizeResult = await knex.raw(`
      SELECT pg_database_size(current_database()) as size
    `);
    databaseSize = parseInt(sizeResult.rows[0].size, 10);
  } catch (err) {
    error('Error getting database size', { error: err });
  }
  
  // Active transactions
  let activeTransactions = 0;
  let transactionsPerSecond = 0;
  try {
    const txResult = await knex.raw(`
      SELECT count(*) as count 
      FROM pg_stat_activity 
      WHERE state = 'active' AND xact_start IS NOT NULL
    `);
    activeTransactions = parseInt(txResult.rows[0].count, 10);
    
    // This is an approximation based on PostgreSQL stats
    const txRateResult = await knex.raw(`
      SELECT xact_commit + xact_rollback AS total_transactions
      FROM pg_stat_database
      WHERE datname = current_database()
    `);
    
    // We'll estimate TPS based on PostgreSQL stats which reset at server start
    transactionsPerSecond = parseInt(txRateResult.rows[0].total_transactions, 10) / 3600;
  } catch (err) {
    error('Error getting transaction metrics', { error: err });
  }
  
  // Longest running query
  let longestRunningQuery = {};
  try {
    const longQueryResult = await knex.raw(`
      SELECT pid, usename, query, query_start, now() - query_start AS duration
      FROM pg_stat_activity
      WHERE state = 'active' AND query != '<IDLE>' AND query NOT ILIKE '%pg_stat_activity%'
      ORDER BY duration DESC
      LIMIT 1
    `);
    
    if (longQueryResult.rows.length > 0) {
      longestRunningQuery = longQueryResult.rows[0];
    }
  } catch (err) {
    error('Error getting longest running query', { error: err });
  }
  
  // Table and index stats
  let tableStats = {};
  let indexStats = {};
  try {
    const tableResult = await knex.raw(`
      SELECT
        relname as table_name,
        n_live_tup as row_count,
        pg_size_pretty(pg_total_relation_size(relid)) as total_size
      FROM
        pg_stat_user_tables
      ORDER BY
        n_live_tup DESC
    `);
    
    tableStats = tableResult.rows.reduce((acc, row) => {
      acc[row.table_name] = {
        rowCount: parseInt(row.row_count, 10),
        totalSize: row.total_size
      };
      return acc;
    }, {});
    
    const indexResult = await knex.raw(`
      SELECT
        indexrelname as index_name,
        relname as table_name,
        idx_scan as index_scans,
        idx_tup_read as tuples_read,
        idx_tup_fetch as tuples_fetched
      FROM
        pg_stat_user_indexes
      ORDER BY
        idx_scan DESC
    `);
    
    indexStats = indexResult.rows.reduce((acc, row) => {
      acc[row.index_name] = {
        tableName: row.table_name,
        scans: parseInt(row.index_scans, 10),
        tuplesRead: parseInt(row.tuples_read, 10),
        tuplesFetched: parseInt(row.tuples_fetched, 10)
      };
      return acc;
    }, {});
  } catch (err) {
    error('Error getting table and index stats', { error: err });
  }
  
  // Compile metrics
  const metrics: DatabaseMetrics = {
    connectionPool,
    queryPerformance,
    databaseSize,
    activeTransactions,
    transactionsPerSecond,
    tableStats,
    indexStats,
    longestRunningQuery
  };
  
  // Cache metrics
  lastMetrics = metrics;
  lastCheckTimestamp = now;
  
  return metrics;
}

/**
 * Checks the health of the database connection pool
 * @returns Promise resolving to connection pool metrics and health status
 */
async function checkConnectionPool(): Promise<ConnectionPoolMetrics> {
  debug('Checking database connection pool');
  
  try {
    const knex = getKnexInstance();
    
    // Get pool stats from PostgreSQL
    const poolResult = await knex.raw(`
      SELECT 
        count(*) as total,
        sum(CASE WHEN state = 'active' THEN 1 ELSE 0 END) as active,
        sum(CASE WHEN state = 'idle' THEN 1 ELSE 0 END) as idle,
        sum(CASE WHEN state = 'waiting' THEN 1 ELSE 0 END) as waiting
      FROM 
        pg_stat_activity
      WHERE 
        datname = current_database()
    `);
    
    const total = parseInt(poolResult.rows[0].total, 10);
    const active = parseInt(poolResult.rows[0].active, 10);
    const idle = parseInt(poolResult.rows[0].idle, 10);
    const waiting = parseInt(poolResult.rows[0].waiting, 10);
    
    // Calculate utilization
    const maxConnections = databaseConfig.pool.max;
    const utilizationPercent = (total / maxConnections) * 100;
    
    // Determine if pool is healthy (utilization < 80%)
    const healthy = utilizationPercent < 80 && waiting === 0;
    
    // Update metrics
    dbConnectionPoolGauge.labels('total').set(total);
    dbConnectionPoolGauge.labels('active').set(active);
    dbConnectionPoolGauge.labels('idle').set(idle);
    dbConnectionPoolGauge.labels('waiting').set(waiting);
    dbConnectionPoolGauge.labels('utilization').set(utilizationPercent);
    
    return {
      total,
      active,
      idle,
      waiting,
      utilizationPercent,
      healthy
    };
  } catch (err) {
    error('Error checking connection pool', { error: err });
    
    // Return default metrics with unhealthy status
    return {
      total: 0,
      active: 0,
      idle: 0,
      waiting: 0,
      utilizationPercent: 0,
      healthy: false
    };
  }
}

/**
 * Checks database query performance by executing a test query
 * @returns Promise resolving to query performance metrics and health status
 */
async function checkQueryPerformance(): Promise<QueryPerformanceMetrics> {
  debug('Checking database query performance');
  
  try {
    const startTime = Date.now();
    
    // Execute a simple test query
    await db.query(knex => knex.raw('SELECT 1'));
    
    const queryTime = Date.now() - startTime;
    
    // Record the query time
    trackDatabaseQueryTime('healthCheck', 'system', queryTime);
    
    // Get average from previous measurements (simplified)
    // In a real implementation, you might want to query this from your metrics store
    const averageQueryTime = queryTime; // Placeholder for average
    
    // Determine if query performance is healthy (under 100ms)
    const healthy = queryTime < 100;
    
    return {
      testQueryTime: queryTime,
      averageQueryTime,
      healthy
    };
  } catch (err) {
    error('Error checking query performance', { error: err });
    
    // Return default metrics with unhealthy status
    return {
      testQueryTime: 0,
      averageQueryTime: 0,
      healthy: false
    };
  }
}

/**
 * Starts periodic monitoring of database health
 * @param intervalMs Time in milliseconds between health checks
 * @returns Timer reference for the monitoring interval
 */
export function monitorDatabaseHealth(intervalMs: number): NodeJS.Timeout {
  info('Starting database health monitoring', { intervalMs });
  
  // Perform initial check
  checkDatabaseHealth().catch(err => {
    error('Error during initial database health check', { error: err });
  });
  
  // Set up interval
  const timer = setInterval(() => {
    checkDatabaseHealth().catch(err => {
      error('Error during periodic database health check', { error: err });
    });
  }, intervalMs);
  
  return timer;
}

/**
 * Stops the periodic database health monitoring
 * @param monitoringTimer Timer reference from monitorDatabaseHealth
 */
export function stopDatabaseHealthMonitoring(monitoringTimer: NodeJS.Timeout): void {
  clearInterval(monitoringTimer);
  info('Stopped database health monitoring');
}