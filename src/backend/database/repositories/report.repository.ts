import { BaseRepository } from './base.repository';
import { UUID } from '../../types/common.types';
import { ReportType, ReportStatus, ScheduleFrequency, ReportParameters } from '../../types/reports.types';
import { WhereCondition, Pagination, PaginatedResult, RepositoryOptions } from '../../types/database.types';
import { logger } from '../../utils/logger';

/**
 * Repository class for report definitions, providing database operations for report templates and configurations
 */
export class ReportDefinitionRepository extends BaseRepository<any> {
  /**
   * Creates a new instance of the ReportDefinitionRepository
   */
  constructor() {
    super('report_definitions', 'id', true);
  }

  /**
   * Finds report definitions by report type
   *
   * @param reportType Type of report to find
   * @param pagination Pagination options
   * @param options Repository options
   * @returns Paginated report definitions matching the specified type
   */
  async findByType(
    reportType: ReportType,
    pagination: Pagination = { page: 1, limit: 25 },
    options: RepositoryOptions = {}
  ): Promise<PaginatedResult<any>> {
    try {
      logger.debug(`Finding report definitions by type: ${reportType}`);
      const whereCondition = { report_type: reportType };
      return await this.findAll(whereCondition, pagination, [], options);
    } catch (error) {
      this.handleDatabaseError(error, 'findByType');
    }
  }

  /**
   * Finds report definition templates
   *
   * @param systemOnly Whether to only include system templates
   * @param pagination Pagination options
   * @param options Repository options
   * @returns Paginated report definition templates
   */
  async findTemplates(
    systemOnly: boolean = false,
    pagination: Pagination = { page: 1, limit: 25 },
    options: RepositoryOptions = {}
  ): Promise<PaginatedResult<any>> {
    try {
      logger.debug(`Finding report templates, systemOnly: ${systemOnly}`);
      let whereCondition: WhereCondition = { is_template: true };
      
      if (systemOnly) {
        whereCondition = { ...whereCondition, is_system: true };
      }
      
      return await this.findAll(whereCondition, pagination, [], options);
    } catch (error) {
      this.handleDatabaseError(error, 'findTemplates');
    }
  }

  /**
   * Finds report definitions for a specific organization
   *
   * @param organizationId Organization ID
   * @param pagination Pagination options
   * @param options Repository options
   * @returns Paginated report definitions for the organization
   */
  async findByOrganization(
    organizationId: UUID,
    pagination: Pagination = { page: 1, limit: 25 },
    options: RepositoryOptions = {}
  ): Promise<PaginatedResult<any>> {
    try {
      logger.debug(`Finding report definitions for organization: ${organizationId}`);
      const whereCondition = { organization_id: organizationId };
      return await this.findAll(whereCondition, pagination, [], options);
    } catch (error) {
      this.handleDatabaseError(error, 'findByOrganization');
    }
  }

  /**
   * Creates a new report definition from a template
   *
   * @param templateId ID of the template report definition
   * @param data Additional data to override template values
   * @param options Repository options
   * @returns The newly created report definition
   */
  async createFromTemplate(
    templateId: UUID,
    data: object,
    options: RepositoryOptions = {}
  ): Promise<any> {
    try {
      logger.debug(`Creating report definition from template: ${templateId}`);
      
      // Find the template
      const template = await this.findById(templateId, options);
      if (!template) {
        throw new Error(`Template report definition with ID ${templateId} not found`);
      }
      
      // Create a new report definition based on the template
      const newReportDefinition = {
        ...template,
        ...data,
        is_template: false,
      };
      
      // Remove the ID field to ensure a new record is created
      delete newReportDefinition.id;
      
      // Create the new report definition
      return await this.create(newReportDefinition, options);
    } catch (error) {
      this.handleDatabaseError(error, 'createFromTemplate');
    }
  }
}

/**
 * Repository class for report instances, providing database operations for generated reports
 */
export class ReportInstanceRepository extends BaseRepository<any> {
  /**
   * Creates a new instance of the ReportInstanceRepository
   */
  constructor() {
    super('report_instances', 'id', true);
  }

  /**
   * Finds report instances for a specific report definition
   *
   * @param reportDefinitionId Report definition ID
   * @param pagination Pagination options
   * @param options Repository options
   * @returns Paginated report instances for the definition
   */
  async findByDefinition(
    reportDefinitionId: UUID,
    pagination: Pagination = { page: 1, limit: 25 },
    options: RepositoryOptions = {}
  ): Promise<PaginatedResult<any>> {
    try {
      logger.debug(`Finding report instances for definition: ${reportDefinitionId}`);
      const whereCondition = { report_definition_id: reportDefinitionId };
      return await this.findAll(
        whereCondition, 
        pagination, 
        [{ column: 'generated_at', direction: 'DESC' }], 
        options
      );
    } catch (error) {
      this.handleDatabaseError(error, 'findByDefinition');
    }
  }

  /**
   * Finds report instances by status
   *
   * @param status Report status
   * @param pagination Pagination options
   * @param options Repository options
   * @returns Paginated report instances with the specified status
   */
  async findByStatus(
    status: ReportStatus,
    pagination: Pagination = { page: 1, limit: 25 },
    options: RepositoryOptions = {}
  ): Promise<PaginatedResult<any>> {
    try {
      logger.debug(`Finding report instances with status: ${status}`);
      const whereCondition = { status };
      return await this.findAll(
        whereCondition, 
        pagination, 
        [{ column: 'generated_at', direction: 'DESC' }], 
        options
      );
    } catch (error) {
      this.handleDatabaseError(error, 'findByStatus');
    }
  }

  /**
   * Finds report instances for a specific organization
   *
   * @param organizationId Organization ID
   * @param pagination Pagination options
   * @param additionalFilters Additional filters to apply
   * @param options Repository options
   * @returns Paginated report instances for the organization
   */
  async findByOrganization(
    organizationId: UUID,
    pagination: Pagination = { page: 1, limit: 25 },
    additionalFilters: WhereCondition = {},
    options: RepositoryOptions = {}
  ): Promise<PaginatedResult<any>> {
    try {
      logger.debug(`Finding report instances for organization: ${organizationId}`);
      const whereCondition = { 
        organization_id: organizationId,
        ...additionalFilters 
      };
      return await this.findAll(
        whereCondition, 
        pagination, 
        [{ column: 'generated_at', direction: 'DESC' }], 
        options
      );
    } catch (error) {
      this.handleDatabaseError(error, 'findByOrganization');
    }
  }

  /**
   * Updates the status of a report instance
   *
   * @param id Report instance ID
   * @param status New status
   * @param additionalData Additional data to update
   * @param options Repository options
   * @returns The updated report instance
   */
  async updateStatus(
    id: UUID,
    status: ReportStatus,
    additionalData: object = {},
    options: RepositoryOptions = {}
  ): Promise<any> {
    try {
      logger.debug(`Updating report instance status to ${status} for ID: ${id}`);
      const updateData = {
        status,
        ...additionalData
      };
      
      return await this.update(id, updateData, options);
    } catch (error) {
      this.handleDatabaseError(error, 'updateStatus');
    }
  }

  /**
   * Finds expired report instances
   *
   * @param options Repository options
   * @returns Array of expired report instances
   */
  async findExpired(options: RepositoryOptions = {}): Promise<any[]> {
    try {
      logger.debug('Finding expired report instances');
      const queryBuilder = this.getQueryBuilder(options.transaction);
      
      // Add condition for expires_at < current date
      const results = await queryBuilder
        .where('expires_at', '<', new Date())
        .select('*');
      
      return results;
    } catch (error) {
      this.handleDatabaseError(error, 'findExpired');
    }
  }
}

/**
 * Repository class for scheduled reports, providing database operations for report schedules
 */
export class ScheduledReportRepository extends BaseRepository<any> {
  /**
   * Creates a new instance of the ScheduledReportRepository
   */
  constructor() {
    super('scheduled_reports', 'id', true);
  }

  /**
   * Finds scheduled reports for a specific report definition
   *
   * @param reportDefinitionId Report definition ID
   * @param pagination Pagination options
   * @param options Repository options
   * @returns Paginated scheduled reports for the definition
   */
  async findByDefinition(
    reportDefinitionId: UUID,
    pagination: Pagination = { page: 1, limit: 25 },
    options: RepositoryOptions = {}
  ): Promise<PaginatedResult<any>> {
    try {
      logger.debug(`Finding scheduled reports for definition: ${reportDefinitionId}`);
      const whereCondition = { report_definition_id: reportDefinitionId };
      return await this.findAll(whereCondition, pagination, [], options);
    } catch (error) {
      this.handleDatabaseError(error, 'findByDefinition');
    }
  }

  /**
   * Finds scheduled reports for a specific organization
   *
   * @param organizationId Organization ID
   * @param pagination Pagination options
   * @param additionalFilters Additional filters to apply
   * @param options Repository options
   * @returns Paginated scheduled reports for the organization
   */
  async findByOrganization(
    organizationId: UUID,
    pagination: Pagination = { page: 1, limit: 25 },
    additionalFilters: WhereCondition = {},
    options: RepositoryOptions = {}
  ): Promise<PaginatedResult<any>> {
    try {
      logger.debug(`Finding scheduled reports for organization: ${organizationId}`);
      const whereCondition = { 
        organization_id: organizationId,
        ...additionalFilters 
      };
      return await this.findAll(whereCondition, pagination, [], options);
    } catch (error) {
      this.handleDatabaseError(error, 'findByOrganization');
    }
  }

  /**
   * Finds scheduled reports that are due to run
   *
   * @param currentDate Current date to compare against next run date
   * @param options Repository options
   * @returns Array of scheduled reports due to run
   */
  async findDueReports(
    currentDate: Date,
    options: RepositoryOptions = {}
  ): Promise<any[]> {
    try {
      logger.debug('Finding scheduled reports due to run');
      const queryBuilder = this.getQueryBuilder(options.transaction);
      
      // Find reports where is_active is true and next_run_at <= currentDate
      const results = await queryBuilder
        .where('is_active', true)
        .where('next_run_at', '<=', currentDate)
        .select('*');
      
      return results;
    } catch (error) {
      this.handleDatabaseError(error, 'findDueReports');
    }
  }

  /**
   * Updates the next run date for a scheduled report
   *
   * @param id Scheduled report ID
   * @param lastRunAt When the report was last run
   * @param nextRunAt When the report should next run
   * @param options Repository options
   * @returns The updated scheduled report
   */
  async updateNextRunDate(
    id: UUID,
    lastRunAt: Date,
    nextRunAt: Date,
    options: RepositoryOptions = {}
  ): Promise<any> {
    try {
      logger.debug(`Updating next run date for scheduled report ID: ${id}`);
      const updateData = {
        last_run_at: lastRunAt,
        next_run_at: nextRunAt
      };
      
      return await this.update(id, updateData, options);
    } catch (error) {
      this.handleDatabaseError(error, 'updateNextRunDate');
    }
  }

  /**
   * Toggles the active status of a scheduled report
   *
   * @param id Scheduled report ID
   * @param isActive Whether the report should be active
   * @param options Repository options
   * @returns The updated scheduled report
   */
  async toggleActive(
    id: UUID,
    isActive: boolean,
    options: RepositoryOptions = {}
  ): Promise<any> {
    try {
      logger.debug(`Toggling active status to ${isActive} for scheduled report ID: ${id}`);
      const updateData = {
        is_active: isActive
      };
      
      return await this.update(id, updateData, options);
    } catch (error) {
      this.handleDatabaseError(error, 'toggleActive');
    }
  }
}

// Export all repositories
export default {
  ReportDefinitionRepository,
  ReportInstanceRepository,
  ScheduledReportRepository
};