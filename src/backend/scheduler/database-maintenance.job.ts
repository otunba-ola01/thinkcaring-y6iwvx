/**
 * Database Maintenance Job
 * 
 * Scheduled job that performs routine database maintenance tasks to ensure optimal 
 * performance and data integrity of the PostgreSQL database.
 * 
 * This job handles vacuum operations, index maintenance, statistics updates, and 
 * monitoring of database health metrics. It is designed to run weekly during off-peak
 * hours (Saturday 11 PM) with minimal impact on system operations.
 * 
 * @version 1.0.0
 */

import { info, error, debug } from '../utils/logger';
import { trackSystemMetric } from '../utils/metrics';
import { db, getKnexInstance } from '../database/connection';
import { databaseConfig } from '../config/database.config';
import { createErrorFromUnknown } from '../utils/error';

/**
 * Executes the database maintenance job to optimize database performance
 * @param options Optional parameters for job execution
 * @returns Result of the job execution including success status, operations performed, and any errors
 */
async function execute(options = {}): Promise<{ 
  success: boolean, 
  operations: { name: string, success: boolean, duration: number }[],
  errors: any[] 
}> {
  const startTime = Date.now();
  info('Starting database maintenance job', { timestamp: new Date().toISOString() });
  
  const operations: { name: string, success: boolean, duration: number }[] = [];
  const errors: any[] = [];
  
  try {
    // Check database health before maintenance
    const preHealthCheck = await checkDatabaseHealth();
    info('Database health check before maintenance', preHealthCheck);
    
    if (!preHealthCheck.healthy) {
      throw new Error('Database is not healthy before maintenance. Aborting job.');
    }
    
    // Perform VACUUM operation
    try {
      const vacuumResult = await performVacuum(false);
      operations.push({ name: 'VACUUM', ...vacuumResult });
    } catch (error) {
      const err = createErrorFromUnknown(error);
      error('Error during VACUUM operation', { error: err });
      errors.push({ operation: 'VACUUM', error: err });
    }
    
    // Perform ANALYZE operation
    try {
      const analyzeResult = await performAnalyze();
      operations.push({ name: 'ANALYZE', ...analyzeResult });
    } catch (error) {
      const err = createErrorFromUnknown(error);
      error('Error during ANALYZE operation', { error: err });
      errors.push({ operation: 'ANALYZE', error: err });
    }
    
    // Reindex critical tables
    try {
      const reindexResult = await reindexCriticalTables();
      operations.push({ 
        name: 'REINDEX', 
        success: reindexResult.success, 
        duration: reindexResult.duration 
      });
    } catch (error) {
      const err = createErrorFromUnknown(error);
      error('Error during REINDEX operation', { error: err });
      errors.push({ operation: 'REINDEX', error: err });
    }
    
    // Update database statistics
    try {
      const statsResult = await updateStatistics();
      operations.push({ name: 'UPDATE STATISTICS', ...statsResult });
    } catch (error) {
      const err = createErrorFromUnknown(error);
      error('Error during UPDATE STATISTICS operation', { error: err });
      errors.push({ operation: 'UPDATE STATISTICS', error: err });
    }
    
    // Check for bloated tables and indexes
    try {
      const bloatCheck = await checkBloatedTables();
      info('Bloated tables and indexes check completed', { 
        bloatedTablesCount: bloatCheck.bloatedTables.length,
        bloatedIndexesCount: bloatCheck.bloatedIndexes.length,
        details: bloatCheck
      });
    } catch (error) {
      const err = createErrorFromUnknown(error);
      error('Error during bloated tables check', { error: err });
      errors.push({ operation: 'BLOAT CHECK', error: err });
    }
    
    // Terminate long-running queries (threshold of 30 minutes)
    try {
      const longRunningResult = await terminateLongRunningQueries(30);
      info('Long-running query check completed', { 
        terminatedQueries: longRunningResult.terminatedQueries 
      });
    } catch (error) {
      const err = createErrorFromUnknown(error);
      error('Error during long-running query termination', { error: err });
      errors.push({ operation: 'TERMINATE LONG QUERIES', error: err });
    }
    
    // Check database health after maintenance
    const postHealthCheck = await checkDatabaseHealth();
    info('Database health check after maintenance', postHealthCheck);
    
    // Track metrics about the job
    const endTime = Date.now();
    const totalDuration = endTime - startTime;
    trackSystemMetric('database_maintenance', 'duration', totalDuration, { success: 'true' });
    operations.forEach(op => {
      trackSystemMetric('database_maintenance_operation', 'duration', op.duration, { 
        operation: op.name,
        success: op.success.toString()
      });
    });
    
    info('Database maintenance job completed', { 
      totalDuration: totalDuration,
      operationsCount: operations.length,
      errorsCount: errors.length,
      success: errors.length === 0
    });
    
    return { 
      success: errors.length === 0, 
      operations, 
      errors 
    };
  } catch (error) {
    const err = createErrorFromUnknown(error);
    error('Database maintenance job failed', { error: err });
    trackSystemMetric('database_maintenance', 'duration', Date.now() - startTime, { success: 'false' });
    
    return {
      success: false,
      operations,
      errors: [...errors, { operation: 'MAINTENANCE JOB', error: err }]
    };
  }
}

/**
 * Performs VACUUM operation on database tables to reclaim storage and update statistics
 * @param analyze Whether to also perform analyze operation during vacuum
 * @returns Result of the VACUUM operation
 */
async function performVacuum(analyze: boolean): Promise<{ success: boolean, duration: number }> {
  const startTime = Date.now();
  info(`Starting VACUUM${analyze ? ' ANALYZE' : ''} operation`);
  
  try {
    const knex = getKnexInstance();
    
    // Execute VACUUM command with or without ANALYZE option
    const query = analyze ? 'VACUUM ANALYZE;' : 'VACUUM;';
    await knex.raw(query);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    info(`VACUUM${analyze ? ' ANALYZE' : ''} operation completed successfully`, { 
      duration: `${duration}ms` 
    });
    
    return { success: true, duration };
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    const err = createErrorFromUnknown(error);
    error(`VACUUM${analyze ? ' ANALYZE' : ''} operation failed`, { 
      error: err,
      duration: `${duration}ms`
    });
    
    throw err;
  }
}

/**
 * Performs ANALYZE operation to update query planner statistics
 * @returns Result of the ANALYZE operation
 */
async function performAnalyze(): Promise<{ success: boolean, duration: number }> {
  const startTime = Date.now();
  info('Starting ANALYZE operation');
  
  try {
    const knex = getKnexInstance();
    
    // Execute ANALYZE command
    await knex.raw('ANALYZE;');
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    info('ANALYZE operation completed successfully', { 
      duration: `${duration}ms` 
    });
    
    return { success: true, duration };
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    const err = createErrorFromUnknown(error);
    error('ANALYZE operation failed', { 
      error: err,
      duration: `${duration}ms`
    });
    
    throw err;
  }
}

/**
 * Rebuilds indexes on critical tables to optimize performance
 * @returns Result of the REINDEX operation
 */
async function reindexCriticalTables(): Promise<{ 
  success: boolean, 
  duration: number,
  tablesReindexed: string[]
}> {
  const startTime = Date.now();
  info('Starting REINDEX operation on critical tables');
  
  // Define list of critical tables that need regular reindexing
  const criticalTables = [
    'claims',
    'payments',
    'clients',
    'services',
    'service_authorizations',
    'claim_payments'
  ];
  
  const tablesReindexed: string[] = [];
  
  try {
    const knex = getKnexInstance();
    
    // Process each table
    for (const table of criticalTables) {
      try {
        debug(`Reindexing table: ${table}`);
        await knex.raw(`REINDEX TABLE ${table};`);
        tablesReindexed.push(table);
      } catch (error) {
        error(`Failed to reindex table: ${table}`, { error });
        // Continue with other tables instead of failing completely
      }
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    info('REINDEX operation completed', { 
      duration: `${duration}ms`,
      tablesReindexed,
      completedCount: tablesReindexed.length,
      totalCount: criticalTables.length
    });
    
    return { 
      success: tablesReindexed.length > 0, 
      duration,
      tablesReindexed
    };
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    const err = createErrorFromUnknown(error);
    error('REINDEX operation failed', { 
      error: err,
      duration: `${duration}ms`,
      tablesReindexed
    });
    
    throw err;
  }
}

/**
 * Updates database statistics for query optimization
 * @returns Result of the statistics update operation
 */
async function updateStatistics(): Promise<{ success: boolean, duration: number }> {
  const startTime = Date.now();
  info('Starting database statistics update');
  
  try {
    const knex = getKnexInstance();
    
    // Update PostgreSQL statistics
    await knex.raw('ANALYZE;');
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    info('Database statistics update completed successfully', { 
      duration: `${duration}ms` 
    });
    
    return { success: true, duration };
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    const err = createErrorFromUnknown(error);
    error('Database statistics update failed', { 
      error: err,
      duration: `${duration}ms`
    });
    
    throw err;
  }
}

/**
 * Identifies bloated tables and indexes that may need maintenance
 * @returns List of bloated tables and indexes with bloat percentage
 */
async function checkBloatedTables(): Promise<{ 
  bloatedTables: Array<{ tableName: string, bloatPercentage: number }>,
  bloatedIndexes: Array<{ indexName: string, tableName: string, bloatPercentage: number }>
}> {
  info('Starting bloated tables and indexes check');
  
  try {
    const knex = getKnexInstance();
    
    // Query to find bloated tables (tables with > 20% bloat)
    const bloatedTablesQuery = `
      SELECT
        schemaname || '.' || tablename AS table_name,
        ROUND(CASE WHEN otta=0 THEN 0.0 ELSE sml.relpages/otta::numeric END * 100) AS bloat_pct
      FROM (
        SELECT
          schemaname,
          tablename,
          cc.reltuples,
          cc.relpages,
          bs,
          CEIL((cc.reltuples*((datahdr+ma-
            (CASE WHEN datahdr%ma=0 THEN ma ELSE datahdr%ma END))+nullhdr2+4))/(bs-20::float)) AS otta
        FROM (
          SELECT
            ma,bs,schemaname,tablename,
            (datawidth+(hdr+ma-(case when hdr%ma=0 THEN ma ELSE hdr%ma END)))::numeric AS datahdr,
            (maxfracsum*(nullhdr+ma-(case when nullhdr%ma=0 THEN ma ELSE nullhdr%ma END))) AS nullhdr2
          FROM (
            SELECT
              schemaname, tablename, hdr, ma, bs,
              SUM((1-null_frac)*avg_width) AS datawidth,
              MAX(null_frac) AS maxfracsum,
              hdr+(
                SELECT 1+count(*)/8
                FROM pg_stats s2
                WHERE null_frac<>0 AND s2.schemaname = s.schemaname AND s2.tablename = s.tablename
              ) AS nullhdr
            FROM pg_stats s, (
              SELECT
                (SELECT current_setting('block_size')::numeric) AS bs,
                CASE WHEN substring(v,12,3) IN ('8.0','8.1','8.2') THEN 27 ELSE 23 END AS hdr,
                CASE WHEN v ~ 'mingw32' THEN 8 ELSE 4 END AS ma
              FROM (SELECT version() AS v) AS foo
            ) AS constants
            GROUP BY 1,2,3,4,5
          ) AS foo
        ) AS foo
        JOIN pg_class cc ON cc.relname = tablename
        JOIN pg_namespace nn ON cc.relnamespace = nn.oid AND nn.nspname = schemaname
        WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
          AND cc.relkind = 'r'
      ) AS sml
      WHERE bloat_pct > 20
      ORDER BY bloat_pct DESC;
    `;
    
    // Query to find bloated indexes (indexes with > 20% bloat)
    const bloatedIndexesQuery = `
      SELECT
        schemaname || '.' || tablename AS table_name,
        indexname AS index_name,
        ROUND(CASE WHEN otta=0 THEN 0.0 ELSE sml.relpages/otta::numeric END * 100) AS bloat_pct
      FROM (
        SELECT
          schemaname,
          tablename,
          indexname,
          cc.reltuples,
          cc.relpages,
          bs,
          CEIL((cc.reltuples*((datahdr+ma-
            (CASE WHEN datahdr%ma=0 THEN ma ELSE datahdr%ma END))+nullhdr2+4))/(bs-20::float)) AS otta
        FROM (
          SELECT
            ma,bs,schemaname,tablename,indexname,
            (datawidth+(hdr+ma-(case when hdr%ma=0 THEN ma ELSE hdr%ma END)))::numeric AS datahdr,
            (maxfracsum*(nullhdr+ma-(case when nullhdr%ma=0 THEN ma ELSE nullhdr%ma END))) AS nullhdr2
          FROM (
            SELECT
              schemaname, tablename, indexname, hdr, ma, bs,
              SUM((1-null_frac)*avg_width) AS datawidth,
              MAX(null_frac) AS maxfracsum,
              hdr+(
                SELECT 1+count(*)/8
                FROM pg_stats s2
                WHERE null_frac<>0 AND s2.schemaname = s.schemaname AND s2.tablename = s.tablename
              ) AS nullhdr
            FROM pg_stats s, (
              SELECT
                (SELECT current_setting('block_size')::numeric) AS bs,
                CASE WHEN substring(v,12,3) IN ('8.0','8.1','8.2') THEN 27 ELSE 23 END AS hdr,
                CASE WHEN v ~ 'mingw32' THEN 8 ELSE 4 END AS ma
              FROM (SELECT version() AS v) AS foo
            ) AS constants
            JOIN pg_catalog.pg_indexes i USING (schemaname, tablename)
            GROUP BY 1,2,3,4,5,6
          ) AS foo
        ) AS foo
        JOIN pg_class cc ON cc.relname = indexname
        JOIN pg_namespace nn ON cc.relnamespace = nn.oid AND nn.nspname = schemaname
        WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
          AND cc.relkind = 'i'
      ) AS sml
      WHERE bloat_pct > 20
      ORDER BY bloat_pct DESC;
    `;
    
    // Execute queries
    const bloatedTablesResult = await knex.raw(bloatedTablesQuery);
    const bloatedIndexesResult = await knex.raw(bloatedIndexesQuery);
    
    // Format results
    const bloatedTables = bloatedTablesResult.rows.map((row: any) => ({
      tableName: row.table_name,
      bloatPercentage: parseFloat(row.bloat_pct)
    }));
    
    const bloatedIndexes = bloatedIndexesResult.rows.map((row: any) => ({
      tableName: row.table_name,
      indexName: row.index_name,
      bloatPercentage: parseFloat(row.bloat_pct)
    }));
    
    info('Bloated tables and indexes check completed', {
      bloatedTablesCount: bloatedTables.length,
      bloatedIndexesCount: bloatedIndexes.length
    });
    
    // Log details of bloated objects if found
    if (bloatedTables.length > 0) {
      info('Bloated tables detected', { bloatedTables });
    }
    
    if (bloatedIndexes.length > 0) {
      info('Bloated indexes detected', { bloatedIndexes });
    }
    
    return { bloatedTables, bloatedIndexes };
  } catch (error) {
    const err = createErrorFromUnknown(error);
    error('Bloated tables and indexes check failed', { error: err });
    throw err;
  }
}

/**
 * Identifies and terminates long-running queries that may impact system performance
 * @param thresholdMinutes Threshold in minutes for query duration
 * @returns Number of queries terminated
 */
async function terminateLongRunningQueries(thresholdMinutes: number): Promise<{ 
  terminatedQueries: number 
}> {
  info('Starting long-running query check', { thresholdMinutes });
  
  try {
    const knex = getKnexInstance();
    
    // Find long-running queries
    const longRunningQuery = `
      SELECT pid, 
             usename, 
             application_name,
             client_addr,
             state,
             now() - pg_stat_activity.query_start AS duration,
             query
      FROM pg_stat_activity
      WHERE (now() - pg_stat_activity.query_start) > interval '${thresholdMinutes} minutes'
        AND state <> 'idle'
        AND query NOT ILIKE '%pg_stat_activity%'; -- Exclude this query
    `;
    
    const result = await knex.raw(longRunningQuery);
    const longRunningQueries = result.rows;
    
    info('Found long-running queries', { 
      count: longRunningQueries.length,
      thresholdMinutes
    });
    
    let terminatedCount = 0;
    
    // Terminate long-running queries, but exclude system queries and maintenance tasks
    for (const query of longRunningQueries) {
      // Skip if it's a system process or appears to be a maintenance task
      const isMaintenance = 
        query.query.toLowerCase().includes('vacuum') ||
        query.query.toLowerCase().includes('analyze') ||
        query.query.toLowerCase().includes('reindex') ||
        query.application_name.includes('maintenance');
        
      if (isMaintenance) {
        debug('Skipping termination for maintenance query', {
          pid: query.pid,
          duration: query.duration,
          queryText: query.query.substring(0, 100) // Truncate for readability
        });
        continue;
      }
      
      info('Terminating long-running query', {
        pid: query.pid,
        user: query.usename,
        duration: query.duration,
        queryText: query.query.substring(0, 100) // Truncate for readability
      });
      
      try {
        // Terminate the query
        await knex.raw(`SELECT pg_terminate_backend(${query.pid});`);
        terminatedCount++;
      } catch (terminateError) {
        error('Failed to terminate query', {
          pid: query.pid,
          error: terminateError
        });
      }
    }
    
    info('Long-running query check completed', { 
      found: longRunningQueries.length,
      terminated: terminatedCount
    });
    
    return { terminatedQueries: terminatedCount };
  } catch (error) {
    const err = createErrorFromUnknown(error);
    error('Long-running query check failed', { error: err });
    throw err;
  }
}

/**
 * Performs health check on database to ensure it's functioning properly
 * @returns Health status and key metrics
 */
async function checkDatabaseHealth(): Promise<{ 
  healthy: boolean,
  metrics: {
    connectionCount: number,
    activeQueries: number,
    dbSize: string,
    oldestTransaction: string
  }
}> {
  info('Starting database health check');
  
  try {
    // Check basic connectivity
    const isConnected = await db.healthCheck();
    
    if (!isConnected) {
      error('Database connectivity check failed');
      return {
        healthy: false,
        metrics: {
          connectionCount: 0,
          activeQueries: 0,
          dbSize: 'unknown',
          oldestTransaction: 'unknown'
        }
      };
    }
    
    const knex = getKnexInstance();
    
    // Get connection count
    const connectionCountResult = await knex.raw(
      "SELECT count(*) as count FROM pg_stat_activity;"
    );
    const connectionCount = parseInt(connectionCountResult.rows[0].count, 10);
    
    // Get active query count
    const activeQueriesResult = await knex.raw(
      "SELECT count(*) as count FROM pg_stat_activity WHERE state = 'active' AND query NOT ILIKE '%pg_stat_activity%';"
    );
    const activeQueries = parseInt(activeQueriesResult.rows[0].count, 10);
    
    // Get database size
    const dbSizeResult = await knex.raw(
      `SELECT pg_size_pretty(pg_database_size('${databaseConfig.connection.database}')) as size;`
    );
    const dbSize = dbSizeResult.rows[0].size;
    
    // Get oldest transaction
    const oldestTxResult = await knex.raw(
      "SELECT now() - xact_start as oldest_transaction FROM pg_stat_activity WHERE xact_start IS NOT NULL ORDER BY xact_start LIMIT 1;"
    );
    const oldestTransaction = oldestTxResult.rows.length > 0 
      ? oldestTxResult.rows[0].oldest_transaction 
      : 'No active transactions';
    
    info('Database health check completed', {
      healthy: true,
      connectionCount,
      activeQueries,
      dbSize,
      oldestTransaction
    });
    
    return {
      healthy: true,
      metrics: {
        connectionCount,
        activeQueries,
        dbSize,
        oldestTransaction
      }
    };
  } catch (error) {
    const err = createErrorFromUnknown(error);
    error('Database health check failed', { error: err });
    
    return {
      healthy: false,
      metrics: {
        connectionCount: 0,
        activeQueries: 0,
        dbSize: 'unknown',
        oldestTransaction: 'unknown'
      }
    };
  }
}

export const databaseMaintenanceJob = {
  execute
};