/**
 * Report Models
 * 
 * This file defines the database models for report-related entities in the HCBS Revenue Management System.
 * It implements models for report definitions, report instances, and scheduled reports to support
 * comprehensive financial reporting capabilities.
 * 
 * @module models/report.model
 */

import { UUID, ISO8601Date, AuditableEntity } from '../types/common.types';
import {
  ReportType,
  ReportCategory,
  ReportStatus,
  ScheduleFrequency,
  ReportFormat,
  ReportParameters,
  ReportVisualization,
  ReportRecipient
} from '../types/reports.types';
import { db } from '../database/connection';

/**
 * Model class for report definitions, which define the structure and parameters of reports
 */
class ReportDefinitionModel {
  tableName: string;
  primaryKey: string;

  /**
   * Creates a new instance of the ReportDefinitionModel
   */
  constructor() {
    this.tableName = 'report_definitions';
    this.primaryKey = 'id';
  }

  /**
   * Finds a report definition by its ID
   * @param id The ID of the report definition to find
   * @returns The report definition object if found, null otherwise
   */
  async findById(id: UUID): Promise<any> {
    return await db.query(async (knexInstance) => {
      const result = await knexInstance(this.tableName)
        .where({ id })
        .first();
      return result || null;
    });
  }

  /**
   * Finds report definitions by report type
   * @param reportType The report type to filter by
   * @returns Array of report definitions matching the specified type
   */
  async findByType(reportType: ReportType): Promise<any[]> {
    return await db.query(async (knexInstance) => {
      return await knexInstance(this.tableName)
        .where({ type: reportType })
        .orderBy('name');
    });
  }

  /**
   * Finds report definition templates
   * @param systemOnly Whether to return only system templates
   * @returns Array of report definition templates
   */
  async findTemplates(systemOnly: boolean): Promise<any[]> {
    return await db.query(async (knexInstance) => {
      let query = knexInstance(this.tableName)
        .where({ isTemplate: true });
      
      if (systemOnly) {
        query = query.where({ isSystem: true });
      }
      
      return await query.orderBy('name');
    });
  }

  /**
   * Finds report definitions for a specific organization
   * @param organizationId The organization ID to filter by
   * @param pagination Optional pagination parameters
   * @returns Paginated report definitions for the organization
   */
  async findByOrganization(organizationId: UUID, pagination: { page?: number, limit?: number } = {}): Promise<{ data: any[], total: number }> {
    return await db.query(async (knexInstance) => {
      const { page = 1, limit = 20 } = pagination;
      const offset = (page - 1) * limit;
      
      // Query for data with pagination
      const data = await knexInstance(this.tableName)
        .where({ organizationId })
        .orderBy('updatedAt', 'desc')
        .limit(limit)
        .offset(offset);
      
      // Query for total count
      const [{ count }] = await knexInstance(this.tableName)
        .where({ organizationId })
        .count({ count: '*' });
      
      return {
        data,
        total: parseInt(count)
      };
    });
  }

  /**
   * Creates a new report definition
   * @param data The report definition data
   * @returns The created report definition
   */
  async create(data: object): Promise<any> {
    return await db.query(async (knexInstance) => {
      const [id] = await knexInstance(this.tableName)
        .insert(data)
        .returning('id');
      
      return await this.findById(id);
    });
  }

  /**
   * Updates an existing report definition
   * @param id The ID of the report definition to update
   * @param data The updated report definition data
   * @returns The updated report definition
   */
  async update(id: UUID, data: object): Promise<any> {
    return await db.query(async (knexInstance) => {
      await knexInstance(this.tableName)
        .where({ id })
        .update({
          ...data,
          updatedAt: knexInstance.fn.now()
        });
      
      return await this.findById(id);
    });
  }

  /**
   * Deletes a report definition
   * @param id The ID of the report definition to delete
   * @returns True if the deletion was successful
   */
  async delete(id: UUID): Promise<boolean> {
    return await db.query(async (knexInstance) => {
      const result = await knexInstance(this.tableName)
        .where({ id })
        .delete();
      
      return result > 0;
    });
  }

  /**
   * Creates a new report definition from a template
   * @param templateId The ID of the template to use
   * @param data Additional data to override template values
   * @returns The newly created report definition
   */
  async createFromTemplate(templateId: UUID, data: object): Promise<any> {
    return await db.query(async (knexInstance) => {
      // Find the template
      const template = await this.findById(templateId);
      
      if (!template) {
        throw new Error(`Template with ID ${templateId} not found`);
      }
      
      // Create new report definition based on template
      const newReportDefinition = {
        ...template,
        id: undefined, // Remove ID to generate a new one
        createdAt: undefined,
        updatedAt: undefined,
        isTemplate: false, // This is not a template
        ...data // Override with provided data
      };
      
      return await this.create(newReportDefinition);
    });
  }
}

/**
 * Model class for report instances, which represent generated reports
 */
class ReportInstanceModel {
  tableName: string;
  primaryKey: string;

  /**
   * Creates a new instance of the ReportInstanceModel
   */
  constructor() {
    this.tableName = 'report_instances';
    this.primaryKey = 'id';
  }

  /**
   * Finds a report instance by its ID
   * @param id The ID of the report instance to find
   * @returns The report instance object if found, null otherwise
   */
  async findById(id: UUID): Promise<any> {
    return await db.query(async (knexInstance) => {
      const result = await knexInstance(this.tableName)
        .where({ id })
        .first();
      return result || null;
    });
  }

  /**
   * Finds report instances for a specific report definition
   * @param reportDefinitionId The report definition ID to filter by
   * @param pagination Optional pagination parameters
   * @returns Paginated report instances for the definition
   */
  async findByDefinition(reportDefinitionId: UUID, pagination: { page?: number, limit?: number } = {}): Promise<{ data: any[], total: number }> {
    return await db.query(async (knexInstance) => {
      const { page = 1, limit = 20 } = pagination;
      const offset = (page - 1) * limit;
      
      // Query for data with pagination
      const data = await knexInstance(this.tableName)
        .where({ reportDefinitionId })
        .orderBy('generatedAt', 'desc')
        .limit(limit)
        .offset(offset);
      
      // Query for total count
      const [{ count }] = await knexInstance(this.tableName)
        .where({ reportDefinitionId })
        .count({ count: '*' });
      
      return {
        data,
        total: parseInt(count)
      };
    });
  }

  /**
   * Finds report instances by status
   * @param status The status to filter by
   * @param pagination Optional pagination parameters
   * @returns Paginated report instances with the specified status
   */
  async findByStatus(status: ReportStatus, pagination: { page?: number, limit?: number } = {}): Promise<{ data: any[], total: number }> {
    return await db.query(async (knexInstance) => {
      const { page = 1, limit = 20 } = pagination;
      const offset = (page - 1) * limit;
      
      // Query for data with pagination
      const data = await knexInstance(this.tableName)
        .where({ status })
        .orderBy('generatedAt', 'desc')
        .limit(limit)
        .offset(offset);
      
      // Query for total count
      const [{ count }] = await knexInstance(this.tableName)
        .where({ status })
        .count({ count: '*' });
      
      return {
        data,
        total: parseInt(count)
      };
    });
  }

  /**
   * Finds report instances for a specific organization
   * @param organizationId The organization ID to filter by
   * @param pagination Optional pagination parameters
   * @param filters Additional filters to apply
   * @returns Paginated report instances for the organization
   */
  async findByOrganization(organizationId: UUID, pagination: { page?: number, limit?: number } = {}, filters: object = {}): Promise<{ data: any[], total: number }> {
    return await db.query(async (knexInstance) => {
      const { page = 1, limit = 20 } = pagination;
      const offset = (page - 1) * limit;
      
      // Build query with filters
      let query = knexInstance(this.tableName)
        .where({ organizationId });
      
      // Apply additional filters
      if (filters) {
        for (const [key, value] of Object.entries(filters)) {
          query = query.where(key, value);
        }
      }
      
      // Query for data with pagination
      const data = await query
        .orderBy('generatedAt', 'desc')
        .limit(limit)
        .offset(offset);
      
      // Clone query for count (without pagination)
      let countQuery = knexInstance(this.tableName)
        .where({ organizationId });
      
      // Apply filters to count query
      if (filters) {
        for (const [key, value] of Object.entries(filters)) {
          countQuery = countQuery.where(key, value);
        }
      }
      
      // Query for total count
      const [{ count }] = await countQuery.count({ count: '*' });
      
      return {
        data,
        total: parseInt(count)
      };
    });
  }

  /**
   * Creates a new report instance
   * @param data The report instance data
   * @returns The created report instance
   */
  async create(data: object): Promise<any> {
    return await db.query(async (knexInstance) => {
      const [id] = await knexInstance(this.tableName)
        .insert(data)
        .returning('id');
      
      return await this.findById(id);
    });
  }

  /**
   * Updates an existing report instance
   * @param id The ID of the report instance to update
   * @param data The updated report instance data
   * @returns The updated report instance
   */
  async update(id: UUID, data: object): Promise<any> {
    return await db.query(async (knexInstance) => {
      await knexInstance(this.tableName)
        .where({ id })
        .update({
          ...data,
          updatedAt: knexInstance.fn.now()
        });
      
      return await this.findById(id);
    });
  }

  /**
   * Updates the status of a report instance
   * @param id The ID of the report instance to update
   * @param status The new status
   * @param additionalData Additional data to update
   * @returns The updated report instance
   */
  async updateStatus(id: UUID, status: ReportStatus, additionalData: object = {}): Promise<any> {
    return await db.query(async (knexInstance) => {
      const updateData = {
        status,
        ...additionalData,
        updatedAt: knexInstance.fn.now()
      };
      
      await knexInstance(this.tableName)
        .where({ id })
        .update(updateData);
      
      return await this.findById(id);
    });
  }

  /**
   * Deletes a report instance
   * @param id The ID of the report instance to delete
   * @returns True if the deletion was successful
   */
  async delete(id: UUID): Promise<boolean> {
    return await db.query(async (knexInstance) => {
      const result = await knexInstance(this.tableName)
        .where({ id })
        .delete();
      
      return result > 0;
    });
  }

  /**
   * Finds expired report instances
   * @returns Array of expired report instances
   */
  async findExpired(): Promise<any[]> {
    return await db.query(async (knexInstance) => {
      const now = new Date();
      
      return await knexInstance(this.tableName)
        .where('expiresAt', '<', now)
        .orderBy('expiresAt');
    });
  }
}

/**
 * Model class for scheduled reports, which automate report generation on a schedule
 */
class ScheduledReportModel {
  tableName: string;
  primaryKey: string;

  /**
   * Creates a new instance of the ScheduledReportModel
   */
  constructor() {
    this.tableName = 'scheduled_reports';
    this.primaryKey = 'id';
  }

  /**
   * Finds a scheduled report by its ID
   * @param id The ID of the scheduled report to find
   * @returns The scheduled report object if found, null otherwise
   */
  async findById(id: UUID): Promise<any> {
    return await db.query(async (knexInstance) => {
      const result = await knexInstance(this.tableName)
        .where({ id })
        .first();
      return result || null;
    });
  }

  /**
   * Finds scheduled reports for a specific report definition
   * @param reportDefinitionId The report definition ID to filter by
   * @param pagination Optional pagination parameters
   * @returns Paginated scheduled reports for the definition
   */
  async findByDefinition(reportDefinitionId: UUID, pagination: { page?: number, limit?: number } = {}): Promise<{ data: any[], total: number }> {
    return await db.query(async (knexInstance) => {
      const { page = 1, limit = 20 } = pagination;
      const offset = (page - 1) * limit;
      
      // Query for data with pagination
      const data = await knexInstance(this.tableName)
        .where({ reportDefinitionId })
        .limit(limit)
        .offset(offset);
      
      // Query for total count
      const [{ count }] = await knexInstance(this.tableName)
        .where({ reportDefinitionId })
        .count({ count: '*' });
      
      return {
        data,
        total: parseInt(count)
      };
    });
  }

  /**
   * Finds scheduled reports for a specific organization
   * @param organizationId The organization ID to filter by
   * @param pagination Optional pagination parameters
   * @param filters Additional filters to apply
   * @returns Paginated scheduled reports for the organization
   */
  async findByOrganization(organizationId: UUID, pagination: { page?: number, limit?: number } = {}, filters: object = {}): Promise<{ data: any[], total: number }> {
    return await db.query(async (knexInstance) => {
      const { page = 1, limit = 20 } = pagination;
      const offset = (page - 1) * limit;
      
      // Build query with filters
      let query = knexInstance(this.tableName)
        .where({ organizationId });
      
      // Apply additional filters
      if (filters) {
        for (const [key, value] of Object.entries(filters)) {
          query = query.where(key, value);
        }
      }
      
      // Query for data with pagination
      const data = await query
        .limit(limit)
        .offset(offset);
      
      // Clone query for count (without pagination)
      let countQuery = knexInstance(this.tableName)
        .where({ organizationId });
      
      // Apply filters to count query
      if (filters) {
        for (const [key, value] of Object.entries(filters)) {
          countQuery = countQuery.where(key, value);
        }
      }
      
      // Query for total count
      const [{ count }] = await countQuery.count({ count: '*' });
      
      return {
        data,
        total: parseInt(count)
      };
    });
  }

  /**
   * Creates a new scheduled report
   * @param data The scheduled report data
   * @returns The created scheduled report
   */
  async create(data: object): Promise<any> {
    return await db.query(async (knexInstance) => {
      const [id] = await knexInstance(this.tableName)
        .insert(data)
        .returning('id');
      
      return await this.findById(id);
    });
  }

  /**
   * Updates an existing scheduled report
   * @param id The ID of the scheduled report to update
   * @param data The updated scheduled report data
   * @returns The updated scheduled report
   */
  async update(id: UUID, data: object): Promise<any> {
    return await db.query(async (knexInstance) => {
      await knexInstance(this.tableName)
        .where({ id })
        .update({
          ...data,
          updatedAt: knexInstance.fn.now()
        });
      
      return await this.findById(id);
    });
  }

  /**
   * Deletes a scheduled report
   * @param id The ID of the scheduled report to delete
   * @returns True if the deletion was successful
   */
  async delete(id: UUID): Promise<boolean> {
    return await db.query(async (knexInstance) => {
      const result = await knexInstance(this.tableName)
        .where({ id })
        .delete();
      
      return result > 0;
    });
  }

  /**
   * Finds scheduled reports that are due to run
   * @param currentDate The current date to compare against
   * @returns Array of scheduled reports due to run
   */
  async findDueReports(currentDate: Date): Promise<any[]> {
    return await db.query(async (knexInstance) => {
      return await knexInstance(this.tableName)
        .where({ isActive: true })
        .where('nextRunAt', '<=', currentDate)
        .orderBy('nextRunAt');
    });
  }

  /**
   * Updates the next run date for a scheduled report
   * @param id The ID of the scheduled report to update
   * @param lastRunAt The last run date
   * @param nextRunAt The next run date
   * @returns The updated scheduled report
   */
  async updateNextRunDate(id: UUID, lastRunAt: Date, nextRunAt: Date): Promise<any> {
    return await db.query(async (knexInstance) => {
      await knexInstance(this.tableName)
        .where({ id })
        .update({
          lastRunAt,
          nextRunAt,
          updatedAt: knexInstance.fn.now()
        });
      
      return await this.findById(id);
    });
  }

  /**
   * Toggles the active status of a scheduled report
   * @param id The ID of the scheduled report to update
   * @param isActive The new active status
   * @returns The updated scheduled report
   */
  async toggleActive(id: UUID, isActive: boolean): Promise<any> {
    return await db.query(async (knexInstance) => {
      await knexInstance(this.tableName)
        .where({ id })
        .update({
          isActive,
          updatedAt: knexInstance.fn.now()
        });
      
      return await this.findById(id);
    });
  }
}

// Export the model classes
export { ReportDefinitionModel, ReportInstanceModel, ScheduledReportModel };
export default { ReportDefinitionModel, ReportInstanceModel, ScheduledReportModel };