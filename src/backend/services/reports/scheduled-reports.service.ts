import { logger } from '../../utils/logger'; // winston 3.8.2
import { ReportType, ReportParameters, ReportData, ReportFormat, ScheduleFrequency, ScheduledReport } from '../../types/reports.types';
import { UUID } from '../../types/common.types';
import { BusinessError } from '../../errors/business-error';
import { NotFoundError } from '../../errors/not-found-error';
import { dateUtils } from '../../utils/date';
import { ScheduledReportModel, ReportDefinitionModel, ReportInstanceModel } from '../../models/report.model';
import { StandardReportsService } from './standard-reports.service';
import { CustomReportsService } from './custom-reports.service';
import { ReportExportService } from './export.service';
import { notificationService } from '../../services/notification.service';

/**
 * Service for managing scheduled reports in the HCBS Revenue Management System
 */
export class ScheduledReportsService {
  /**
   * Creates a new instance of the ScheduledReportsService
   * @param scheduledReportModel 
   * @param reportDefinitionModel 
   * @param reportInstanceModel 
   * @param standardReportsService 
   * @param customReportsService 
   * @param reportExportService 
   */
  constructor(
    private scheduledReportModel: ScheduledReportModel,
    private reportDefinitionModel: ReportDefinitionModel,
    private reportInstanceModel: ReportInstanceModel,
    private standardReportsService: StandardReportsService,
    private customReportsService: CustomReportsService,
    private reportExportService: ReportExportService
  ) {
    // Initialize service dependencies
  }

  /**
   * Creates a new scheduled report
   * @param reportDefinitionId 
   * @param scheduledReport 
   * @param userId 
   * @returns The created scheduled report
   */
  async createScheduledReport(
    reportDefinitionId: UUID,
    scheduledReport: Partial<ScheduledReport>,
    userId: UUID
  ): Promise<ScheduledReport> {
    logger.info('Creating scheduled report', { reportDefinitionId, scheduledReport, userId });

    try {
      // Validate that the report definition exists
      const reportDefinition = await this.reportDefinitionModel.findById(reportDefinitionId);
      if (!reportDefinition) {
        throw new NotFoundError(`Report definition with ID ${reportDefinitionId} not found`, 'ReportDefinition', reportDefinitionId);
      }

      // Validate scheduled report data (frequency, recipients, etc.)
      this.validateScheduledReport(scheduledReport);

      // Calculate initial nextRunAt date based on frequency and time
      const now = new Date();
      const nextRunAt = dateUtils.calculateNextRunDate(
        scheduledReport.frequency as ScheduleFrequency,
        scheduledReport.dayOfWeek,
        scheduledReport.dayOfMonth,
        scheduledReport.time,
        now
      );

      // Create scheduled report record in database
      const data = {
        ...scheduledReport,
        reportDefinitionId,
        nextRunAt,
        organizationId: reportDefinition.organizationId,
        isActive: true,
        createdBy: userId,
        updatedBy: userId
      };
      const createdScheduledReport = await this.scheduledReportModel.create(data);

      // Return the created scheduled report
      return createdScheduledReport;
    } catch (error) {
      logger.error('Error creating scheduled report', { error, reportDefinitionId, scheduledReport, userId });
      throw error;
    }
  }

  /**
   * Updates an existing scheduled report
   * @param scheduledReportId 
   * @param scheduledReport 
   * @param userId 
   * @returns The updated scheduled report
   */
  async updateScheduledReport(
    scheduledReportId: UUID,
    scheduledReport: Partial<ScheduledReport>,
    userId: UUID
  ): Promise<ScheduledReport> {
    logger.info('Updating scheduled report', { scheduledReportId, scheduledReport, userId });

    try {
      // Verify that the scheduled report exists
      const existingScheduledReport = await this.scheduledReportModel.findById(scheduledReportId);
      if (!existingScheduledReport) {
        throw new NotFoundError(`Scheduled report with ID ${scheduledReportId} not found`, 'ScheduledReport', scheduledReportId);
      }

      // Validate updated scheduled report data
      this.validateScheduledReport(scheduledReport);

      // If frequency or time changed, recalculate nextRunAt
      let nextRunAt = existingScheduledReport.nextRunAt;
      if (scheduledReport.frequency || scheduledReport.time) {
        nextRunAt = dateUtils.calculateNextRunDate(
          scheduledReport.frequency as ScheduleFrequency || existingScheduledReport.frequency,
          scheduledReport.dayOfWeek || existingScheduledReport.dayOfWeek,
          scheduledReport.dayOfMonth || existingScheduledReport.dayOfMonth,
          scheduledReport.time || existingScheduledReport.time,
          existingScheduledReport.lastRunAt || new Date()
        );
      }

      // Update scheduled report record in database
      const data = {
        ...scheduledReport,
        nextRunAt,
        updatedBy: userId
      };
      const updatedScheduledReport = await this.scheduledReportModel.update(scheduledReportId, data);

      // Return the updated scheduled report
      return updatedScheduledReport;
    } catch (error) {
      logger.error('Error updating scheduled report', { error, scheduledReportId, scheduledReport, userId });
      throw error;
    }
  }

  /**
   * Deletes a scheduled report
   * @param scheduledReportId 
   * @param userId 
   * @returns True if deletion was successful
   */
  async deleteScheduledReport(scheduledReportId: UUID, userId: UUID): Promise<boolean> {
    logger.info('Deleting scheduled report', { scheduledReportId, userId });

    try {
      // Verify that the scheduled report exists
      const existingScheduledReport = await this.scheduledReportModel.findById(scheduledReportId);
      if (!existingScheduledReport) {
        throw new NotFoundError(`Scheduled report with ID ${scheduledReportId} not found`, 'ScheduledReport', scheduledReportId);
      }

      // Delete scheduled report record from database
      const deleted = await this.scheduledReportModel.delete(scheduledReportId);

      // Return success status
      return deleted;
    } catch (error) {
      logger.error('Error deleting scheduled report', { error, scheduledReportId, userId });
      throw error;
    }
  }

  /**
   * Retrieves a scheduled report by ID
   * @param scheduledReportId 
   * @returns The scheduled report
   */
  async getScheduledReport(scheduledReportId: UUID): Promise<ScheduledReport> {
    logger.info('Retrieving scheduled report', { scheduledReportId });

    try {
      // Query database for scheduled report by ID
      const scheduledReport = await this.scheduledReportModel.findById(scheduledReportId);

      // If not found, throw NotFoundError
      if (!scheduledReport) {
        throw new NotFoundError(`Scheduled report with ID ${scheduledReportId} not found`, 'ScheduledReport', scheduledReportId);
      }

      // Return the scheduled report
      return scheduledReport;
    } catch (error) {
      logger.error('Error retrieving scheduled report', { error, scheduledReportId });
      throw error;
    }
  }

  /**
   * Retrieves all scheduled reports for an organization
   * @param organizationId 
   * @param filters 
   * @returns List of scheduled reports and total count
   */
  async getScheduledReports(organizationId: UUID, filters: object): Promise<{ scheduledReports: ScheduledReport[]; total: number }> {
    logger.info('Retrieving scheduled reports', { organizationId, filters });

    try {
      // Apply filters (report type, active status, etc.)
      const scheduledReportsResult = await this.scheduledReportModel.findByOrganization(organizationId, {}, filters);

      // Return the scheduled reports and total count
      return {
        scheduledReports: scheduledReportsResult.data,
        total: scheduledReportsResult.total
      };
    } catch (error) {
      logger.error('Error retrieving scheduled reports', { error, organizationId, filters });
      throw error;
    }
  }

  /**
   * Executes a scheduled report immediately
   * @param scheduledReportId 
   * @param userId 
   * @returns The ID of the generated report instance
   */
  async executeScheduledReport(scheduledReportId: UUID, userId: UUID): Promise<UUID> {
    logger.info('Executing scheduled report immediately', { scheduledReportId, userId });

    try {
      // Retrieve the scheduled report by ID
      const scheduledReport = await this.getScheduledReport(scheduledReportId);

      // Generate the report using appropriate service (standard or custom)
      const { reportInstance } = await this.generateScheduledReport(scheduledReport);

      // Send notifications to recipients
      // await this.sendReportNotifications(scheduledReport, reportInstance, exportResults);

      // Return the report instance ID
      return reportInstance.id;
    } catch (error) {
      logger.error('Error executing scheduled report immediately', { error, scheduledReportId, userId });
      throw error;
    }
  }

  /**
   * Processes all scheduled reports that are due to run
   * @returns Summary of processing results
   */
  async processDueReports(): Promise<{ processed: number; succeeded: number; failed: number }> {
    logger.info('Processing due reports');

    let processed = 0;
    let succeeded = 0;
    let failed = 0;

    try {
      // Get current date and time
      const now = new Date();

      // Query database for scheduled reports due to run
      const dueReports = await this.scheduledReportModel.findDueReports(now);

      // For each due report, execute the report generation
      for (const scheduledReport of dueReports) {
        processed++;
        try {
          // Generate the report using appropriate service (standard or custom)
          const { reportInstance } = await this.generateScheduledReport(scheduledReport);

          // Update the lastRunAt and nextRunAt dates for each processed report
          await this.scheduledReportModel.updateNextRunDate(
            scheduledReport.id,
            now,
            reportInstance.expiresAt
          );

          // Send notifications to recipients
          await this.sendReportNotifications(scheduledReport, reportInstance, []);

          succeeded++;
        } catch (error) {
          logger.error('Error generating scheduled report', { error, scheduledReport });
          failed++;
        }
      }

      // Return summary of processing results
      return { processed, succeeded, failed };
    } catch (error) {
      logger.error('Error processing due reports', error);
      return { processed, succeeded, failed };
    }
  }

  /**
   * Toggles the active status of a scheduled report
   * @param scheduledReportId 
   * @param isActive 
   * @param userId 
   * @returns The updated scheduled report
   */
  async toggleScheduledReportActive(scheduledReportId: UUID, isActive: boolean, userId: UUID): Promise<ScheduledReport> {
    logger.info('Toggling scheduled report active status', { scheduledReportId, isActive, userId });

    try {
      // Verify that the scheduled report exists
      const existingScheduledReport = await this.getScheduledReport(scheduledReportId);

      // Update the isActive status in the database
      const updatedScheduledReport = await this.scheduledReportModel.toggleActive(scheduledReportId, isActive, userId);

      // If activating and nextRunAt is in the past, recalculate nextRunAt
      if (isActive && existingScheduledReport.nextRunAt < new Date()) {
        const nextRunAt = dateUtils.calculateNextRunDate(
          existingScheduledReport.frequency as ScheduleFrequency,
          existingScheduledReport.dayOfWeek,
          existingScheduledReport.dayOfMonth,
          existingScheduledReport.time,
          existingScheduledReport.lastRunAt || new Date()
        );
        await this.scheduledReportModel.updateNextRunDate(scheduledReportId, existingScheduledReport.lastRunAt, nextRunAt);
      }

      // Return the updated scheduled report
      return updatedScheduledReport;
    } catch (error) {
      logger.error('Error toggling scheduled report active status', { error, scheduledReportId, isActive, userId });
      throw error;
    }
  }

  /**
   * Generates a report based on a scheduled report configuration
   * @param scheduledReport 
   * @returns The generated report instance and export results
   */
  async generateScheduledReport(scheduledReport: ScheduledReport): Promise<{ reportInstance: any; exportResults: any[] }> {
    logger.info('Generating scheduled report', { scheduledReport });

    try {
      // Retrieve the report definition
      const reportDefinition = await this.reportDefinitionModel.findById(scheduledReport.reportDefinitionId);

      // Generate the report using appropriate service (standard or custom)
      let reportData: ReportData;
      if (reportDefinition.type === ReportType.CUSTOM) {
        reportData = await this.customReportsService.generateCustomReport(scheduledReport.reportDefinitionId, scheduledReport.parameters);
      } else {
        reportData = await this.standardReportsService.generateReport(reportDefinition.type, scheduledReport.parameters);
      }

      // Export the report in all specified formats
      const exportResults = [];
      for (const format of scheduledReport.formats) {
        const exportResult = await this.reportExportService.exportReport(reportData, format, scheduledReport.organizationId);
        exportResults.push(exportResult);
      }

      // Create a report instance record in the database
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Expires in 24 hours
      const reportInstanceData = {
        reportDefinitionId: scheduledReport.reportDefinitionId,
        name: scheduledReport.name,
        parameters: scheduledReport.parameters,
        status: 'completed',
        generatedAt: now,
        expiresAt: expiresAt,
        fileUrls: exportResults.reduce((acc, result) => ({ ...acc, [result.filename]: result.url }), {}),
        organizationId: scheduledReport.organizationId
      };
      const reportInstance = await this.reportInstanceModel.create(reportInstanceData);

      // Return the report instance and export results
      return { reportInstance, exportResults };
    } catch (error) {
      logger.error('Error generating scheduled report', { error, scheduledReport });
      throw error;
    }
  }

  /**
   * Sends notifications to report recipients
   * @param scheduledReport 
   * @param reportInstance 
   * @param exportResults 
   */
  async sendReportNotifications(scheduledReport: ScheduledReport, reportInstance: any, exportResults: any[]): Promise<void> {
    logger.info('Sending report notifications', { scheduledReport, reportInstance, exportResults });

    try {
      // For each recipient, determine notification method
      for (const recipient of scheduledReport.recipients) {
        // For email recipients, send email with report attachments
        if (recipient.email) {
          await notificationService.sendNotification(
            recipient.userId,
            ReportType.CUSTOM,
            NotificationSeverity.INFO,
            {
              title: `Scheduled Report "${scheduledReport.name}" Generated`,
              message: `Your scheduled report "${scheduledReport.name}" has been generated and is available for download.`,
              data: {
                reportName: scheduledReport.name,
                reportId: reportInstance.id,
                exportResults: exportResults.map(result => ({
                  format: result.format,
                  url: result.url
                }))
              }
            },
            [DeliveryMethod.EMAIL]
          );
        }

        // For in-app notifications, create notification with report links
        // TODO: Implement in-app notification logic
      }
    } catch (error) {
      logger.error('Error sending report notifications', { error, scheduledReport, reportInstance, exportResults });
      throw error;
    }
  }

  /**
   * Calculates the next run date for a scheduled report
   * @param frequency 
   * @param dayOfWeek 
   * @param dayOfMonth 
   * @param time 
   * @param lastRunAt 
   * @returns The next run date
   */
  calculateNextRunDate(
    frequency: ScheduleFrequency,
    dayOfWeek: number,
    dayOfMonth: number,
    time: string,
    lastRunAt: Date
  ): Date {
    // Parse the time string into hours and minutes
    const [hours, minutes] = dateUtils.parseTime(time);

    // Create a base date (either lastRunAt or current date)
    const baseDate = lastRunAt || new Date();

    let nextRunDate: Date;

    switch (frequency) {
      case ScheduleFrequency.DAILY:
        nextRunDate = dateUtils.addToDate(baseDate, 1, 'days');
        break;
      case ScheduleFrequency.WEEKLY:
        // Add days until next occurrence of dayOfWeek
        let daysToAdd = (dayOfWeek - baseDate.getDay() + 7) % 7;
        if (daysToAdd === 0) {
          daysToAdd = 7; // Add a week if it's the same day
        }
        nextRunDate = dateUtils.addToDate(baseDate, daysToAdd, 'days');
        break;
      case ScheduleFrequency.MONTHLY:
        // Set to dayOfMonth of next month
        let nextMonth = dateUtils.addToDate(baseDate, 1, 'months');
        nextRunDate = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), dayOfMonth);
        break;
      case ScheduleFrequency.QUARTERLY:
        // Set to dayOfMonth of next quarter
        let nextQuarter = dateUtils.addToDate(baseDate, 3, 'months');
        nextRunDate = new Date(nextQuarter.getFullYear(), nextQuarter.getMonth(), dayOfMonth);
        break;
      case ScheduleFrequency.YEARLY:
        // Set to same day next year
        nextRunDate = dateUtils.addToDate(baseDate, 1, 'years');
        break;
      default:
        throw new BusinessError(`Invalid schedule frequency: ${frequency}`, null, 'schedule.invalid_frequency');
    }

    // Set the time component to specified hours and minutes
    nextRunDate.setHours(hours, minutes, 0, 0);

    // If calculated date is in the past, recalculate from current date
    if (nextRunDate < new Date()) {
      return this.calculateNextRunDate(frequency, dayOfWeek, dayOfMonth, time, new Date());
    }

    return nextRunDate;
  }

  /**
   * Validates scheduled report data
   * @param scheduledReport 
   */
  validateScheduledReport(scheduledReport: Partial<ScheduledReport>): void {
    if (!scheduledReport.name) {
      throw new BusinessError('Scheduled report name is required', null, 'schedule.missing_name');
    }

    if (!scheduledReport.frequency) {
      throw new BusinessError('Scheduled report frequency is required', null, 'schedule.missing_frequency');
    }

    if (!scheduledReport.formats || scheduledReport.formats.length === 0) {
      throw new BusinessError('At least one report format is required', null, 'schedule.missing_formats');
    }

    if (!scheduledReport.recipients || scheduledReport.recipients.length === 0) {
      throw new BusinessError('At least one recipient is required', null, 'schedule.missing_recipients');
    }

    if (!scheduledReport.time) {
      throw new BusinessError('Scheduled report time is required', null, 'schedule.missing_time');
    }

    // Validate frequency-specific fields
    if (scheduledReport.frequency === ScheduleFrequency.WEEKLY && !scheduledReport.dayOfWeek) {
      throw new BusinessError('Day of week is required for weekly schedules', null, 'schedule.missing_day_of_week');
    }

    if ((scheduledReport.frequency === ScheduleFrequency.MONTHLY || scheduledReport.frequency === ScheduleFrequency.QUARTERLY) && !scheduledReport.dayOfMonth) {
      throw new BusinessError('Day of month is required for monthly/quarterly schedules', null, 'schedule.missing_day_of_month');
    }
  }
}

// Export the class instance
const scheduledReportsService = new ScheduledReportsService(
  new ScheduledReportModel(),
  new ReportDefinitionModel(),
  new ReportInstanceModel(),
  new StandardReportsService(null, null, null, null),
  new CustomReportsService(null, null, null, null, null),
  new ReportExportService()
);

export { scheduledReportsService as ScheduledReportsService };