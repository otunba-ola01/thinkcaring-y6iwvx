import { BaseRepository } from './base.repository';
import { 
  AuditLog, 
  CreateAuditLogDto, 
  AuditLogFilter, 
  AuditEventType, 
  AuditResourceType, 
  AuditSeverity,
  AuditLogSummary 
} from '../../models/audit.model';
import { UUID, Timestamp } from '../../types/common.types';
import { 
  Pagination, 
  PaginatedResult, 
  RepositoryOptions, 
  WhereCondition,
  OrderBy 
} from '../../types/database.types';
import { logger } from '../../utils/logger';
import { getKnexInstance } from '../connection';

/**
 * Repository class for managing audit log entries in the database
 */
class AuditRepository extends BaseRepository<AuditLog> {
  /**
   * Creates a new AuditRepository instance
   */
  constructor() {
    // Call super constructor with 'audit_logs' table name
    super('audit_logs', 'id', false); // false because audit logs are never deleted
  }

  /**
   * Creates a new audit log entry in the database
   * 
   * @param auditLogData Data for the new audit log entry
   * @param options Repository options
   * @returns The created audit log entry
   */
  async createAuditLog(auditLogData: CreateAuditLogDto, options: RepositoryOptions = {}): Promise<AuditLog> {
    try {
      // Generate a new UUID for the audit log entry
      const id = crypto.randomUUID();
      
      // Set the timestamp to current time if not provided
      const timestamp = new Date();
      
      // Create the audit log entry with provided data
      const auditLog: AuditLog = {
        id,
        timestamp,
        ...auditLogData
      };
      
      // Call the base repository create method
      return await this.create(auditLog, options);
    } catch (error) {
      logger.error('Error creating audit log', { error, auditLogData });
      throw error;
    }
  }

  /**
   * Retrieves audit logs based on filter criteria with pagination
   * 
   * @param filter Filter criteria for audit logs
   * @param pagination Pagination options
   * @param orderBy Sort options
   * @param options Repository options
   * @returns Paginated list of audit logs matching the filter criteria
   */
  async getAuditLogs(
    filter: AuditLogFilter = {},
    pagination: Pagination = { page: 1, limit: 25 },
    orderBy: OrderBy[] = [],
    options: RepositoryOptions = {}
  ): Promise<PaginatedResult<AuditLog>> {
    try {
      // Build where conditions based on filter criteria
      const whereConditions = this.buildWhereConditions(filter);
      
      // Apply date range filter if provided
      const queryBuilder = this.getQueryBuilder(options.transaction);
      
      if (filter.startDate) {
        queryBuilder.where('timestamp', '>=', filter.startDate);
      }
      if (filter.endDate) {
        queryBuilder.where('timestamp', '<=', filter.endDate);
      }
      
      // Apply search term filter if provided
      if (filter.searchTerm) {
        queryBuilder.where(function() {
          this.where('description', 'like', `%${filter.searchTerm}%`)
              .orWhereRaw("metadata::text ILIKE ?", [`%${filter.searchTerm}%`]);
        });
      }
      
      // Set default order by timestamp descending if not provided
      if (!orderBy || orderBy.length === 0) {
        orderBy = [{ column: 'timestamp', direction: 'DESC' }];
      }
      
      // Call the base repository findAll method with the constructed query
      return await this.findAll(whereConditions, pagination, orderBy, options);
    } catch (error) {
      logger.error('Error retrieving audit logs', { error, filter });
      throw error;
    }
  }

  /**
   * Retrieves security-related audit logs for compliance monitoring
   * 
   * @param filter Filter criteria for audit logs
   * @param pagination Pagination options
   * @param orderBy Sort options
   * @param options Repository options
   * @returns Paginated list of security-related audit logs
   */
  async getSecurityAuditLogs(
    filter: AuditLogFilter = {},
    pagination: Pagination = { page: 1, limit: 25 },
    orderBy: OrderBy[] = [],
    options: RepositoryOptions = {}
  ): Promise<PaginatedResult<AuditLog>> {
    try {
      // Enhance filter to focus on security-related events
      const securityFilter: AuditLogFilter = {
        ...filter,
        // Include LOGIN, LOGOUT, FAILED_LOGIN event types
        eventType: filter.eventType || [
          AuditEventType.LOGIN,
          AuditEventType.LOGOUT,
          AuditEventType.FAILED_LOGIN,
          AuditEventType.PASSWORD_CHANGE,
          AuditEventType.PASSWORD_RESET
        ],
        // Include events with WARNING, ERROR, CRITICAL severity
        severity: filter.severity || [
          AuditSeverity.WARNING,
          AuditSeverity.ERROR,
          AuditSeverity.CRITICAL
        ]
      };
      
      // Call getAuditLogs with the enhanced filter
      return await this.getAuditLogs(securityFilter, pagination, orderBy, options);
    } catch (error) {
      logger.error('Error retrieving security audit logs', { error, filter });
      throw error;
    }
  }

  /**
   * Retrieves audit logs related to data access, particularly for PHI/PII
   * 
   * @param filter Filter criteria for audit logs
   * @param pagination Pagination options
   * @param orderBy Sort options
   * @param options Repository options
   * @returns Paginated list of data access audit logs
   */
  async getDataAccessAuditLogs(
    filter: AuditLogFilter = {},
    pagination: Pagination = { page: 1, limit: 25 },
    orderBy: OrderBy[] = [],
    options: RepositoryOptions = {}
  ): Promise<PaginatedResult<AuditLog>> {
    try {
      // Enhance filter to focus on data access events
      const dataAccessFilter: AuditLogFilter = {
        ...filter,
        // Include READ event type
        eventType: filter.eventType || AuditEventType.READ,
        // Focus on sensitive resource types (CLIENT, SERVICE, etc.)
        resourceType: filter.resourceType || [
          AuditResourceType.CLIENT,
          AuditResourceType.SERVICE,
          AuditResourceType.CLAIM,
          AuditResourceType.PAYMENT,
          AuditResourceType.AUTHORIZATION,
          AuditResourceType.DOCUMENT
        ]
      };
      
      // Call getAuditLogs with the enhanced filter
      return await this.getAuditLogs(dataAccessFilter, pagination, orderBy, options);
    } catch (error) {
      logger.error('Error retrieving data access audit logs', { error, filter });
      throw error;
    }
  }

  /**
   * Retrieves audit logs for a specific resource
   * 
   * @param resourceType Type of resource
   * @param resourceId ID of the resource
   * @param pagination Pagination options
   * @param orderBy Sort options
   * @param options Repository options
   * @returns Paginated list of audit logs for the specified resource
   */
  async getAuditLogsByResourceId(
    resourceType: AuditResourceType,
    resourceId: UUID,
    pagination: Pagination = { page: 1, limit: 25 },
    orderBy: OrderBy[] = [],
    options: RepositoryOptions = {}
  ): Promise<PaginatedResult<AuditLog>> {
    try {
      // Create filter with resource type and resource ID
      const filter: AuditLogFilter = {
        resourceType,
        resourceId,
        startDate: null,
        endDate: null,
        userId: null,
        eventType: null,
        severity: null,
        searchTerm: null
      };
      
      // Call getAuditLogs with the filter
      return await this.getAuditLogs(filter, pagination, orderBy, options);
    } catch (error) {
      logger.error('Error retrieving audit logs by resource ID', { 
        error, resourceType, resourceId 
      });
      throw error;
    }
  }

  /**
   * Retrieves audit logs for a specific user
   * 
   * @param userId ID of the user
   * @param pagination Pagination options
   * @param orderBy Sort options
   * @param options Repository options
   * @returns Paginated list of audit logs for the specified user
   */
  async getAuditLogsByUser(
    userId: UUID,
    pagination: Pagination = { page: 1, limit: 25 },
    orderBy: OrderBy[] = [],
    options: RepositoryOptions = {}
  ): Promise<PaginatedResult<AuditLog>> {
    try {
      // Create filter with user ID
      const filter: AuditLogFilter = {
        userId,
        startDate: null,
        endDate: null,
        eventType: null,
        resourceType: null,
        resourceId: null,
        severity: null,
        searchTerm: null
      };
      
      // Call getAuditLogs with the filter
      return await this.getAuditLogs(filter, pagination, orderBy, options);
    } catch (error) {
      logger.error('Error retrieving audit logs by user', { error, userId });
      throw error;
    }
  }

  /**
   * Generates a summary of audit logs for reporting and dashboards
   * 
   * @param filter Filter criteria for audit logs
   * @param options Repository options
   * @returns Summary statistics of audit logs
   */
  async getAuditLogSummary(
    filter: AuditLogFilter = {},
    options: RepositoryOptions = {}
  ): Promise<AuditLogSummary> {
    try {
      // Get database connection
      const knex = getKnexInstance();
      
      // Build where conditions based on filter criteria
      const whereConditions = this.buildWhereConditions(filter);
      
      // Execute query to count total events
      const baseQuery = knex('audit_logs');
      
      // Apply where conditions
      Object.entries(whereConditions).forEach(([key, value]) => {
        if (value === null) {
          baseQuery.whereNull(key);
        } else if (Array.isArray(value)) {
          baseQuery.whereIn(key, value);
        } else {
          baseQuery.where(key, value);
        }
      });
      
      // Apply date range filter
      if (filter.startDate) {
        baseQuery.where('timestamp', '>=', filter.startDate);
      }
      if (filter.endDate) {
        baseQuery.where('timestamp', '<=', filter.endDate);
      }
      
      // Apply search term filter
      if (filter.searchTerm) {
        baseQuery.where(function() {
          this.where('description', 'like', `%${filter.searchTerm}%`)
              .orWhereRaw("metadata::text ILIKE ?", [`%${filter.searchTerm}%`]);
        });
      }
      
      // Execute queries for summary statistics
      const totalResult = await baseQuery.clone().count('* as count').first();
      const totalEvents = parseInt(totalResult.count, 10);
      
      // Execute query to count events by type
      const eventsByTypeResults = await baseQuery.clone()
        .select('event_type')
        .count('* as count')
        .groupBy('event_type');
      
      // Execute query to count events by resource
      const eventsByResourceResults = await baseQuery.clone()
        .select('resource_type')
        .count('* as count')
        .groupBy('resource_type');
      
      // Execute query to count events by severity
      const eventsBySeverityResults = await baseQuery.clone()
        .select('severity')
        .count('* as count')
        .groupBy('severity');
      
      // Execute query to count events by user
      const eventsByUserResults = await baseQuery.clone()
        .select('user_id', 'user_name')
        .count('* as count')
        .whereNotNull('user_id')
        .groupBy('user_id', 'user_name');
      
      // Compile results into AuditLogSummary object
      const eventsByType: Record<AuditEventType, number> = {} as Record<AuditEventType, number>;
      const eventsByResource: Record<AuditResourceType, number> = {} as Record<AuditResourceType, number>;
      const eventsBySeverity: Record<AuditSeverity, number> = {} as Record<AuditSeverity, number>;
      const eventsByUser: Record<string, number> = {};
      
      eventsByTypeResults.forEach(result => {
        eventsByType[result.event_type as AuditEventType] = parseInt(result.count, 10);
      });
      
      eventsByResourceResults.forEach(result => {
        eventsByResource[result.resource_type as AuditResourceType] = parseInt(result.count, 10);
      });
      
      eventsBySeverityResults.forEach(result => {
        eventsBySeverity[result.severity as AuditSeverity] = parseInt(result.count, 10);
      });
      
      eventsByUserResults.forEach(result => {
        const userLabel = result.user_name || result.user_id;
        eventsByUser[userLabel] = parseInt(result.count, 10);
      });
      
      // Return the summary
      return {
        totalEvents,
        eventsByType,
        eventsByResource,
        eventsBySeverity,
        eventsByUser,
        timeRange: {
          startDate: filter.startDate || new Date(0).toISOString(),
          endDate: filter.endDate || new Date().toISOString()
        }
      };
    } catch (error) {
      logger.error('Error generating audit log summary', { error, filter });
      throw error;
    }
  }

  /**
   * Purges audit logs older than the specified retention period (admin only)
   * 
   * @param retentionDays Number of days to retain audit logs
   * @param options Repository options
   * @returns Number of purged audit log entries
   */
  async purgeAuditLogs(retentionDays: number, options: RepositoryOptions = {}): Promise<number> {
    try {
      // Validate retention period is at least 365 days (1 year) for compliance
      if (retentionDays < 365) {
        throw new Error('Retention period must be at least 365 days (1 year) for compliance');
      }
      
      // Calculate cutoff date based on retention period
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
      
      // Get database connection
      const knex = getKnexInstance();
      
      // Execute delete query for records older than cutoff date
      const result = await knex('audit_logs')
        .where('timestamp', '<', cutoffDate)
        .delete();
      
      // Create audit log entry for the purge operation itself
      await this.createAuditLog({
        userId: options.createdBy || null,
        userName: null,
        eventType: AuditEventType.SYSTEM,
        resourceType: AuditResourceType.SYSTEM,
        resourceId: null,
        description: `Purged ${result} audit logs older than ${retentionDays} days`,
        ipAddress: null,
        userAgent: null,
        severity: AuditSeverity.INFO,
        metadata: {
          retentionDays,
          cutoffDate: cutoffDate.toISOString(),
          purgedCount: result
        },
        beforeState: null,
        afterState: null
      }, options);
      
      // Return count of deleted records
      return result;
    } catch (error) {
      logger.error('Error purging audit logs', { error, retentionDays });
      throw error;
    }
  }

  /**
   * Exports audit logs based on filter criteria for compliance reporting
   * 
   * @param filter Filter criteria for audit logs
   * @param options Repository options
   * @returns Array of audit logs matching the filter criteria
   */
  async exportAuditLogs(
    filter: AuditLogFilter = {},
    options: RepositoryOptions = {}
  ): Promise<AuditLog[]> {
    try {
      // Build where conditions based on filter criteria
      const whereConditions = this.buildWhereConditions(filter);
      
      // Get database connection
      const knex = getKnexInstance();
      
      // Execute query to retrieve all matching audit logs (no pagination)
      const queryBuilder = knex('audit_logs');
      
      // Apply where conditions
      Object.entries(whereConditions).forEach(([key, value]) => {
        if (value === null) {
          queryBuilder.whereNull(key);
        } else if (Array.isArray(value)) {
          queryBuilder.whereIn(key, value);
        } else {
          queryBuilder.where(key, value);
        }
      });
      
      // Apply date range filter
      if (filter.startDate) {
        queryBuilder.where('timestamp', '>=', filter.startDate);
      }
      if (filter.endDate) {
        queryBuilder.where('timestamp', '<=', filter.endDate);
      }
      
      // Apply search term filter
      if (filter.searchTerm) {
        queryBuilder.where(function() {
          this.where('description', 'like', `%${filter.searchTerm}%`)
              .orWhereRaw("metadata::text ILIKE ?", [`%${filter.searchTerm}%`]);
        });
      }
      
      // Order by timestamp descending
      queryBuilder.orderBy('timestamp', 'desc');
      
      // Execute query
      const results = await queryBuilder;
      
      // Create audit log entry for the export operation itself
      await this.createAuditLog({
        userId: options.createdBy || null,
        userName: null,
        eventType: AuditEventType.EXPORT,
        resourceType: AuditResourceType.SYSTEM,
        resourceId: null,
        description: `Exported ${results.length} audit logs`,
        ipAddress: null,
        userAgent: null,
        severity: AuditSeverity.INFO,
        metadata: {
          filter,
          exportedCount: results.length
        },
        beforeState: null,
        afterState: null
      }, options);
      
      // Return the array of audit logs
      return results;
    } catch (error) {
      logger.error('Error exporting audit logs', { error, filter });
      throw error;
    }
  }

  /**
   * Helper method to build where conditions from audit log filter
   * 
   * @param filter Audit log filter
   * @returns Where conditions for database query
   */
  private buildWhereConditions(filter: AuditLogFilter): WhereCondition {
    // Initialize empty where conditions object
    const whereConditions: WhereCondition = {};
    
    // Add date range conditions if provided
    // Note: Date range is handled separately in query methods
    
    // Add user ID condition if provided
    if (filter.userId) {
      whereConditions.user_id = filter.userId;
    }
    
    // Add event type condition if provided
    if (filter.eventType) {
      if (Array.isArray(filter.eventType)) {
        whereConditions.event_type = filter.eventType;
      } else {
        whereConditions.event_type = filter.eventType;
      }
    }
    
    // Add resource type condition if provided
    if (filter.resourceType) {
      if (Array.isArray(filter.resourceType)) {
        whereConditions.resource_type = filter.resourceType;
      } else {
        whereConditions.resource_type = filter.resourceType;
      }
    }
    
    // Add resource ID condition if provided
    if (filter.resourceId) {
      whereConditions.resource_id = filter.resourceId;
    }
    
    // Add severity condition if provided
    if (filter.severity) {
      if (Array.isArray(filter.severity)) {
        whereConditions.severity = filter.severity;
      } else {
        whereConditions.severity = filter.severity;
      }
    }
    
    // Add search term condition if provided
    // Note: Search term is handled separately in query methods
    
    return whereConditions;
  }
}

// Export singleton instance of the AuditRepository for use throughout the application
export const auditRepository = new AuditRepository();