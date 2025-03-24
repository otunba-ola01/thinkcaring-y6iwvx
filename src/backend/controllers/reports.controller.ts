import { Response } from 'express'; // express v4.18+
import { Request, RequestWithParams, RequestWithQuery, RequestWithBody, RequestWithParamsAndBody, IdParam } from '../types/request.types';
import { SuccessResponse, PaginatedResponse, ValidationFailureResponse } from '../types/response.types';
import { UUID, DateRange } from '../types/common.types';
import { ReportType, ReportParameters, ReportData, ReportFormat, ScheduleFrequency, ScheduledReport, TimeFrame, ReportDefinition, FinancialMetric } from '../types/reports.types';
import { ReportsService } from '../services/reports.service';
import { logger } from '../utils/logger';
import { dateUtils } from '../utils/date';

/**
 * Controller responsible for handling HTTP requests related to report generation, management, scheduling, and financial metrics in the HCBS Revenue Management System. 
 * This controller implements RESTful endpoints for generating standard and custom reports, managing report definitions, scheduling reports, and retrieving financial metrics.
 */
export default {
  /**
   * Generates a report based on report type and parameters
   * @param req 
   * @param res 
   * @returns Sends HTTP response with generated report data
   */
  generateReport: async (
    req: RequestWithBody<{ reportType: ReportType; parameters: ReportParameters; }>,
    res: Response
  ): Promise<void> => {
    // Extract report type and parameters from request body
    const { reportType, parameters } = req.body;

    // Extract user ID and organization ID from authenticated request
    const userId = req.user?.id;
    const organizationId = 'org-123'; // TODO: Replace with actual organization ID

    // Log report generation request
    logger.info('Generating report', { reportType, parameters, userId, organizationId });

    // Create metadata object with user and organization information
    const metadata = {
      userId,
      organizationId
    };

    try {
      // Call ReportsService.generateReport to generate the report
      const reportData: ReportData = await ReportsService.generateReport(reportType, parameters, metadata);

      // Return success response with generated report data
      SuccessResponse<ReportData>(reportData, 'Report generated successfully');
      res.status(200).json({
        success: true,
        data: reportData,
        message: 'Report generated successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      // Handle errors and return appropriate error response
      logger.error('Error generating report', { error, reportType, parameters, userId, organizationId });
      ValidationFailureResponse(false, null, null, error.message);
      res.status(500).json({
        success: false,
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  },

  /**
   * Generates a report based on a saved report definition
   * @param req 
   * @param res 
   * @returns Sends HTTP response with generated report data
   */
  generateReportById: async (
    req: RequestWithParamsAndBody<IdParam, { parameters?: Partial<ReportParameters> }>,
    res: Response
  ): Promise<void> => {
    // Extract report definition ID from request parameters
    const reportDefinitionId = req.params.id;

    // Extract optional override parameters from request body
    const parameters = req.body.parameters || {};

    // Extract user ID and organization ID from authenticated request
    const userId = req.user?.id;
    const organizationId = 'org-123'; // TODO: Replace with actual organization ID

    // Log report generation by ID request
    logger.info('Generating report by ID', { reportDefinitionId, parameters, userId, organizationId });

    // Create metadata object with user and organization information
    const metadata = {
      userId,
      organizationId
    };

    try {
      // Call ReportsService.generateReportById to generate the report
      const reportData: ReportData = await ReportsService.generateReportById(reportDefinitionId, parameters, metadata);

      // Return success response with generated report data
      SuccessResponse<ReportData>(reportData, 'Report generated successfully');
      res.status(200).json({
        success: true,
        data: reportData,
        message: 'Report generated successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      // Handle errors and return appropriate error response
      logger.error('Error generating report by ID', { error, reportDefinitionId, parameters, userId, organizationId });
      ValidationFailureResponse(false, null, null, error.message);
      res.status(500).json({
        success: false,
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  },

  /**
   * Exports a report in the specified format
   * @param req 
   * @param res 
   * @returns Sends HTTP response with export URL and details
   */
  exportReport: async (
    req: RequestWithParamsAndQuery<IdParam, { format: string }>,
    res: Response
  ): Promise<void> => {
    // Extract report instance ID from request parameters
    const reportInstanceId = req.params.id;

    // Extract export format from query parameters
    const format = req.query.format;

    // Extract organization ID from authenticated request
    const organizationId = 'org-123'; // TODO: Replace with actual organization ID

    // Log report export request
    logger.info('Exporting report', { reportInstanceId, format, organizationId });

    try {
      // Call ReportsService.exportReport to export the report in the specified format
      const exportResult = await ReportsService.exportReport({} as ReportData, format as ReportFormat, organizationId);

      // Return success response with export URL and details
      SuccessResponse(exportResult, 'Report exported successfully');
      res.status(200).json({
        success: true,
        data: exportResult,
        message: 'Report exported successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      // Handle errors and return appropriate error response
      logger.error('Error exporting report', { error, reportInstanceId, format, organizationId });
      ValidationFailureResponse(false, null, null, error.message);
      res.status(500).json({
        success: false,
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  },

  /**
   * Retrieves a list of report definitions with pagination
   * @param req 
   * @param res 
   * @returns Sends HTTP response with paginated report definitions
   */
  getReportDefinitions: async (
    req: RequestWithQuery<{ page?: string; limit?: string; search?: string; type?: string; category?: string; }>,
    res: Response
  ): Promise<void> => {
    // Extract query parameters for pagination and filtering
    const { page, limit, search, type, category } = req.query;

    // Extract organization ID from authenticated request
    const organizationId = 'org-123'; // TODO: Replace with actual organization ID

    // Log report definitions retrieval request
    logger.info('Retrieving report definitions', { page, limit, search, type, category, organizationId });

    try {
      // Call ReportsService.getReportDefinitions to retrieve report definitions
      const reportDefinitions = await ReportsService.getReportDefinitions({ page, limit, search, type, category, organizationId });

      // Return paginated response with report definitions
      PaginatedResponse(reportDefinitions.reportDefinitions, { page: reportDefinitions.page, limit: reportDefinitions.pageSize, totalItems: reportDefinitions.total, totalPages: 1 }, 'Report definitions retrieved successfully');
      res.status(200).json({
        success: true,
        data: reportDefinitions.reportDefinitions,
        pagination: {
          page: reportDefinitions.page,
          limit: reportDefinitions.pageSize,
          totalItems: reportDefinitions.total,
          totalPages: 1
        },
        message: 'Report definitions retrieved successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      // Handle errors and return appropriate error response
      logger.error('Error retrieving report definitions', { error, page, limit, search, type, category, organizationId });
      ValidationFailureResponse(false, null, null, error.message);
      res.status(500).json({
        success: false,
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  },

  /**
   * Retrieves a specific report definition by ID
   * @param req 
   * @param res 
   * @returns Sends HTTP response with report definition data
   */
  getReportDefinition: async (
    req: RequestWithParams<IdParam>,
    res: Response
  ): Promise<void> => {
    // Extract report definition ID from request parameters
    const reportDefinitionId = req.params.id;

    // Log report definition retrieval request
    logger.info('Retrieving report definition', { reportDefinitionId });

    try {
      // Call ReportsService.getReportDefinition to retrieve the report definition
      const reportDefinition = await ReportsService.getReportDefinition(reportDefinitionId);

      // Return success response with report definition data
      SuccessResponse(reportDefinition, 'Report definition retrieved successfully');
      res.status(200).json({
        success: true,
        data: reportDefinition,
        message: 'Report definition retrieved successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      // Handle errors and return appropriate error response
      logger.error('Error retrieving report definition', { error, reportDefinitionId });
      ValidationFailureResponse(false, null, null, error.message);
      res.status(500).json({
        success: false,
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  },

  /**
   * Creates a new report definition
   * @param req 
   * @param res 
   * @returns Sends HTTP response with created report definition data
   */
  createReportDefinition: async (
    req: RequestWithBody<Partial<ReportDefinition>>,
    res: Response
  ): Promise<void> => {
    // Extract report definition data from request body
    const reportDefinition = req.body;

    // Extract organization ID from authenticated request
    const organizationId = 'org-123'; // TODO: Replace with actual organization ID

    // Set organization ID in the report definition data
    reportDefinition.organizationId = organizationId;

    // Log report definition creation request
    logger.info('Creating report definition', { reportDefinition, organizationId });

    try {
      // Call ReportsService.createReportDefinition to create the report definition
      const createdReportDefinition = await ReportsService.createReportDefinition(reportDefinition);

      // Return success response with created report definition data
      SuccessResponse(createdReportDefinition, 'Report definition created successfully');
      res.status(201).json({
        success: true,
        data: createdReportDefinition,
        message: 'Report definition created successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      // Handle errors and return appropriate error response
      logger.error('Error creating report definition', { error, reportDefinition, organizationId });
      ValidationFailureResponse(false, null, null, error.message);
      res.status(500).json({
        success: false,
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  },

  /**
   * Updates an existing report definition
   * @param req 
   * @param res 
   * @returns Sends HTTP response with updated report definition data
   */
  updateReportDefinition: async (
    req: RequestWithParamsAndBody<IdParam, Partial<ReportDefinition>>,
    res: Response
  ): Promise<void> => {
    // Extract report definition ID from request parameters
    const reportDefinitionId = req.params.id;

    // Extract update data from request body
    const updates = req.body;

    // Log report definition update request
    logger.info('Updating report definition', { reportDefinitionId, updates });

    try {
      // Call ReportsService.updateReportDefinition to update the report definition
      const updatedReportDefinition = await ReportsService.updateReportDefinition(reportDefinitionId, updates);

      // Return success response with updated report definition data
      SuccessResponse(updatedReportDefinition, 'Report definition updated successfully');
      res.status(200).json({
        success: true,
        data: updatedReportDefinition,
        message: 'Report definition updated successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      // Handle errors and return appropriate error response
      logger.error('Error updating report definition', { error, reportDefinitionId, updates });
      ValidationFailureResponse(false, null, null, error.message);
      res.status(500).json({
        success: false,
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  },

  /**
   * Deletes a report definition
   * @param req 
   * @param res 
   * @returns Sends HTTP response with deletion confirmation
   */
  deleteReportDefinition: async (
    req: RequestWithParams<IdParam>,
    res: Response
  ): Promise<void> => {
    // Extract report definition ID from request parameters
    const reportDefinitionId = req.params.id;

    // Log report definition deletion request
    logger.info('Deleting report definition', { reportDefinitionId });

    try {
      // Call ReportsService.deleteReportDefinition to delete the report definition
      await ReportsService.deleteReportDefinition(reportDefinitionId);

      // Return success response with deletion confirmation
      SuccessResponse(null, 'Report definition deleted successfully');
      res.status(204).send();
    } catch (error) {
      // Handle errors and return appropriate error response
      logger.error('Error deleting report definition', { error, reportDefinitionId });
      ValidationFailureResponse(false, null, null, error.message);
      res.status(500).json({
        success: false,
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  },
  
  /**
   * Retrieves a list of report instances with pagination
   * @param req 
   * @param res 
   * @returns Sends HTTP response with paginated report instances
   */
  getReportInstances: async (
    req: RequestWithQuery<{ page?: string; limit?: string; reportType?: string; startDate?: string; endDate?: string; }>,
    res: Response
  ): Promise<void> => {
    // Extract query parameters for pagination and filtering
    const { page, limit, reportType, startDate, endDate } = req.query;

    // Extract organization ID from authenticated request
    const organizationId = 'org-123'; // TODO: Replace with actual organization ID

    // Log report instances retrieval request
    logger.info('Retrieving report instances', { page, limit, reportType, startDate, endDate, organizationId });

    try {
      // Call ReportsService.getReportInstances to retrieve report instances
      const reportInstances = await ReportsService.getReportInstances({ page, limit, reportType, startDate, endDate, organizationId });

      // Return paginated response with report instances
      PaginatedResponse(reportInstances.reportInstances, { page: reportInstances.page, limit: reportInstances.pageSize, totalItems: reportInstances.total, totalPages: 1 }, 'Report instances retrieved successfully');
      res.status(200).json({
        success: true,
        data: reportInstances.reportInstances,
        pagination: {
          page: reportInstances.page,
          limit: reportInstances.pageSize,
          totalItems: reportInstances.total,
          totalPages: 1
        },
        message: 'Report instances retrieved successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      // Handle errors and return appropriate error response
      logger.error('Error retrieving report instances', { error, page, limit, reportType, startDate, endDate, organizationId });
      ValidationFailureResponse(false, null, null, error.message);
      res.status(500).json({
        success: false,
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  },
  
  /**
   * Retrieves a specific report instance by ID
   * @param req 
   * @param res 
   * @returns Sends HTTP response with report instance data
   */
  getReportInstance: async (
    req: RequestWithParams<IdParam>,
    res: Response
  ): Promise<void> => {
    // Extract report instance ID from request parameters
    const reportInstanceId = req.params.id;

    // Log report instance retrieval request
    logger.info('Retrieving report instance', { reportInstanceId });

    try {
      // Call ReportsService.getReportInstance to retrieve the report instance
      const reportInstance = await ReportsService.getReportInstance(reportInstanceId);

      // Return success response with report instance data
      SuccessResponse(reportInstance, 'Report instance retrieved successfully');
      res.status(200).json({
        success: true,
        data: reportInstance,
        message: 'Report instance retrieved successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      // Handle errors and return appropriate error response
      logger.error('Error retrieving report instance', { error, reportInstanceId });
      ValidationFailureResponse(false, null, null, error.message);
      res.status(500).json({
        success: false,
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  },

  /**
   * Creates a new scheduled report
   * @param req 
   * @param res 
   * @returns Sends HTTP response with created scheduled report data
   */
  createScheduledReport: async (
    req: RequestWithBody<{ reportDefinitionId: UUID; scheduledReport: Partial<ScheduledReport> }>,
    res: Response
  ): Promise<void> => {
    // Extract report definition ID and scheduled report data from request body
    const { reportDefinitionId, scheduledReport } = req.body;

    // Extract user ID and organization ID from authenticated request
    const userId = req.user?.id;
    const organizationId = 'org-123'; // TODO: Replace with actual organization ID

    // Log scheduled report creation request
    logger.info('Creating scheduled report', { reportDefinitionId, scheduledReport, userId, organizationId });

    try {
      // Call ReportsService.createScheduledReport to create the scheduled report
      const createdScheduledReport = await ReportsService.createScheduledReport(reportDefinitionId, scheduledReport, userId);

      // Return success response with created scheduled report data
      SuccessResponse(createdScheduledReport, 'Scheduled report created successfully');
      res.status(201).json({
        success: true,
        data: createdScheduledReport,
        message: 'Scheduled report created successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      // Handle errors and return appropriate error response
      logger.error('Error creating scheduled report', { error, reportDefinitionId, scheduledReport, userId, organizationId });
      ValidationFailureResponse(false, null, null, error.message);
      res.status(500).json({
        success: false,
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  },

  /**
   * Updates an existing scheduled report
   * @param req 
   * @param res 
   * @returns Sends HTTP response with updated scheduled report data
   */
  updateScheduledReport: async (
    req: RequestWithParamsAndBody<IdParam, Partial<ScheduledReport>>,
    res: Response
  ): Promise<void> => {
    // Extract scheduled report ID from request parameters
    const scheduledReportId = req.params.id;

    // Extract update data from request body
    const updates = req.body;

    // Extract user ID from authenticated request
    const userId = req.user?.id;

    // Log scheduled report update request
    logger.info('Updating scheduled report', { scheduledReportId, updates, userId });

    try {
      // Call ReportsService.updateScheduledReport to update the scheduled report
      const updatedScheduledReport = await ReportsService.updateScheduledReport(scheduledReportId, updates, userId);

      // Return success response with updated scheduled report data
      SuccessResponse(updatedScheduledReport, 'Scheduled report updated successfully');
      res.status(200).json({
        success: true,
        data: updatedScheduledReport,
        message: 'Scheduled report updated successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      // Handle errors and return appropriate error response
      logger.error('Error updating scheduled report', { error, scheduledReportId, updates, userId });
      ValidationFailureResponse(false, null, null, error.message);
      res.status(500).json({
        success: false,
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  },

  /**
   * Deletes a scheduled report
   * @param req 
   * @param res 
   * @returns Sends HTTP response with deletion confirmation
   */
  deleteScheduledReport: async (
    req: RequestWithParams<IdParam>,
    res: Response
  ): Promise<void> => {
    // Extract scheduled report ID from request parameters
    const scheduledReportId = req.params.id;

    // Extract user ID from authenticated request
    const userId = req.user?.id;

    // Log scheduled report deletion request
    logger.info('Deleting scheduled report', { scheduledReportId, userId });

    try {
      // Call ReportsService.deleteScheduledReport to delete the scheduled report
      await ReportsService.deleteScheduledReport(scheduledReportId, userId);

      // Return success response with deletion confirmation
      SuccessResponse(null, 'Scheduled report deleted successfully');
      res.status(204).send();
    } catch (error) {
      // Handle errors and return appropriate error response
      logger.error('Error deleting scheduled report', { error, scheduledReportId, userId });
      ValidationFailureResponse(false, null, null, error.message);
      res.status(500).json({
        success: false,
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  },

  /**
   * Retrieves a list of scheduled reports with pagination
   * @param req 
   * @param res 
   * @returns Sends HTTP response with paginated scheduled reports
   */
  getScheduledReports: async (
    req: RequestWithQuery<{ page?: string; limit?: string; isActive?: string; }>,
    res: Response
  ): Promise<void> => {
    // Extract query parameters for pagination and filtering
    const { page, limit, isActive } = req.query;

    // Extract organization ID from authenticated request
    const organizationId = 'org-123'; // TODO: Replace with actual organization ID

    // Log scheduled reports retrieval request
    logger.info('Retrieving scheduled reports', { page, limit, isActive, organizationId });

    try {
      // Call ReportsService.getScheduledReports to retrieve scheduled reports
      const scheduledReports = await ReportsService.getScheduledReports(organizationId, { page, limit, isActive });

      // Return paginated response with scheduled reports
      PaginatedResponse(scheduledReports.scheduledReports, { page: 1, limit: 25, totalItems: scheduledReports.total, totalPages: 1 }, 'Scheduled reports retrieved successfully');
      res.status(200).json({
        success: true,
        data: scheduledReports.scheduledReports,
        pagination: {
          page: 1,
          limit: 25,
          totalItems: scheduledReports.total,
          totalPages: 1
        },
        message: 'Scheduled reports retrieved successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      // Handle errors and return appropriate error response
      logger.error('Error retrieving scheduled reports', { error, page, limit, isActive, organizationId });
      ValidationFailureResponse(false, null, null, error.message);
      res.status(500).json({
        success: false,
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  },

  /**
   * Retrieves a specific scheduled report by ID
   * @param req 
   * @param res 
   * @returns Sends HTTP response with scheduled report data
   */
  getScheduledReport: async (
    req: RequestWithParams<IdParam>,
    res: Response
  ): Promise<void> => {
    // Extract scheduled report ID from request parameters
    const scheduledReportId = req.params.id;

    // Log scheduled report retrieval request
    logger.info('Retrieving scheduled report', { scheduledReportId });

    try {
      // Call ReportsService.getScheduledReport to retrieve the scheduled report
      const scheduledReport = await ReportsService.getScheduledReport(scheduledReportId);

      // Return success response with scheduled report data
      SuccessResponse(scheduledReport, 'Scheduled report retrieved successfully');
      res.status(200).json({
        success: true,
        data: scheduledReport,
        message: 'Scheduled report retrieved successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      // Handle errors and return appropriate error response
      logger.error('Error retrieving scheduled report', { error, scheduledReportId });
      ValidationFailureResponse(false, null, null, error.message);
      res.status(500).json({
        success: false,
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  },

  /**
   * Executes a scheduled report immediately
   * @param req 
   * @param res 
   * @returns Sends HTTP response with execution confirmation
   */
  executeScheduledReport: async (
    req: RequestWithParams<IdParam>,
    res: Response
  ): Promise<void> => {
    // Extract scheduled report ID from request parameters
    const scheduledReportId = req.params.id;

    // Extract user ID from authenticated request
    const userId = req.user?.id;

    // Log scheduled report execution request
    logger.info('Executing scheduled report', { scheduledReportId, userId });

    try {
      // Call ReportsService.executeScheduledReport to execute the scheduled report
      const reportInstanceId = await ReportsService.executeScheduledReport(scheduledReportId, userId);

      // Return success response with execution confirmation and report instance ID
      SuccessResponse({ reportInstanceId }, 'Scheduled report executed successfully');
      res.status(200).json({
        success: true,
        data: { reportInstanceId },
        message: 'Scheduled report executed successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      // Handle errors and return appropriate error response
      logger.error('Error executing scheduled report', { error, scheduledReportId, userId });
      ValidationFailureResponse(false, null, null, error.message);
      res.status(500).json({
        success: false,
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  },

  /**
   * Retrieves financial metrics for dashboard and reporting
   * @param req 
   * @param res 
   * @returns Sends HTTP response with financial metrics data
   */
  getFinancialMetrics: async (
    req: RequestWithQuery<{ timeFrame?: string; startDate?: string; endDate?: string; programId?: string; payerId?: string; facilityId?: string; }>,
    res: Response
  ): Promise<void> => {
    // Extract query parameters for time frame and filtering
    const { timeFrame, startDate, endDate, programId, payerId, facilityId } = req.query;

    // Extract organization ID from authenticated request
    const organizationId = 'org-123'; // TODO: Replace with actual organization ID

    // Log financial metrics retrieval request
    logger.info('Retrieving financial metrics', { timeFrame, startDate, endDate, programId, payerId, facilityId, organizationId });

    try {
      // Call ReportsService.getFinancialMetrics to retrieve financial metrics
      const financialMetrics = await ReportsService.getFinancialMetrics({ timeFrame, startDate, endDate, programId, payerId, facilityId });

      // Return success response with financial metrics data
      SuccessResponse(financialMetrics, 'Financial metrics retrieved successfully');
      res.status(200).json({
        success: true,
        data: financialMetrics,
        message: 'Financial metrics retrieved successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      // Handle errors and return appropriate error response
      logger.error('Error retrieving financial metrics', { error, timeFrame, startDate, endDate, programId, payerId, facilityId, organizationId });
      ValidationFailureResponse(false, null, null, error.message);
      res.status(500).json({
        success: false,
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  },
  
    /**
   * Retrieves revenue-specific metrics
   * @param req 
   * @param res 
   * @returns Sends HTTP response with revenue metrics data
   */
  getRevenueMetrics: async (
    req: RequestWithQuery<{ timeFrame?: string; startDate?: string; endDate?: string; programId?: string; payerId?: string; facilityId?: string; }>,
    res: Response
  ): Promise<void> => {
    // Extract query parameters for time frame and filtering
    const { timeFrame, startDate, endDate, programId, payerId, facilityId } = req.query;

    // Extract organization ID from authenticated request
    const organizationId = 'org-123'; // TODO: Replace with actual organization ID

    // Log revenue metrics retrieval request
    logger.info('Retrieving revenue metrics', { timeFrame, startDate, endDate, programId, payerId, facilityId, organizationId });

    try {
      // Call ReportsService.getRevenueMetrics to retrieve revenue metrics
      const revenueMetrics = await ReportsService.getRevenueMetrics({ timeFrame, startDate, endDate, programId, payerId, facilityId });

      // Return success response with revenue metrics data
      SuccessResponse(revenueMetrics, 'Revenue metrics retrieved successfully');
      res.status(200).json({
        success: true,
        data: revenueMetrics,
        message: 'Revenue metrics retrieved successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      // Handle errors and return appropriate error response
      logger.error('Error retrieving revenue metrics', { error, timeFrame, startDate, endDate, programId, payerId, facilityId, organizationId });
      ValidationFailureResponse(false, null, null, error.message);
      res.status(500).json({
        success: false,
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  },
  
  /**
   * Retrieves claims-specific metrics
   * @param req 
   * @param res 
   * @returns Sends HTTP response with claims metrics data
   */
  getClaimsMetrics: async (
    req: RequestWithQuery<{ timeFrame?: string; startDate?: string; endDate?: string; programId?: string; payerId?: string; facilityId?: string; }>,
    res: Response
  ): Promise<void> => {
    // Extract query parameters for time frame and filtering
    const { timeFrame, startDate, endDate, programId, payerId, facilityId } = req.query;

    // Extract organization ID from authenticated request
    const organizationId = 'org-123'; // TODO: Replace with actual organization ID

    // Log claims metrics retrieval request
    logger.info('Retrieving claims metrics', { timeFrame, startDate, endDate, programId, payerId, facilityId, organizationId });

    try {
      // Call ReportsService.getClaimsMetrics to retrieve claims metrics
      const claimsMetrics = await ReportsService.getClaimsMetrics({ timeFrame, startDate, endDate, programId, payerId, facilityId });

      // Return success response with claims metrics data
      SuccessResponse(claimsMetrics, 'Claims metrics retrieved successfully');
      res.status(200).json({
        success: true,
        data: claimsMetrics,
        message: 'Claims metrics retrieved successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      // Handle errors and return appropriate error response
      logger.error('Error retrieving claims metrics', { error, timeFrame, startDate, endDate, programId, payerId, facilityId, organizationId });
      ValidationFailureResponse(false, null, null, error.message);
      res.status(500).json({
        success: false,
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  },
  
  /**
   * Retrieves payment-specific metrics
   * @param req 
   * @param res 
   * @returns Sends HTTP response with payment metrics data
   */
  getPaymentMetrics: async (
    req: RequestWithQuery<{ timeFrame?: string; startDate?: string; endDate?: string; programId?: string; payerId?: string; facilityId?: string; }>,
    res: Response
  ): Promise<void> => {
    // Extract query parameters for time frame and filtering
    const { timeFrame, startDate, endDate, programId, payerId, facilityId } = req.query;

    // Extract organization ID from authenticated request
    const organizationId = 'org-123'; // TODO: Replace with actual organization ID

    // Log payment metrics retrieval request
    logger.info('Retrieving payment metrics', { timeFrame, startDate, endDate, programId, payerId, facilityId, organizationId });

    try {
      // Call ReportsService.getPaymentMetrics to retrieve payment metrics
      const paymentMetrics = await ReportsService.getPaymentMetrics({ timeFrame, startDate, endDate, programId, payerId, facilityId });

      // Return success response with payment metrics data
      SuccessResponse(paymentMetrics, 'Payment metrics retrieved successfully');
      res.status(200).json({
        success: true,
        data: paymentMetrics,
        message: 'Payment metrics retrieved successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      // Handle errors and return appropriate error response
      logger.error('Error retrieving payment metrics', { error, timeFrame, startDate, endDate, programId, payerId, facilityId, organizationId });
      ValidationFailureResponse(false, null, null, error.message);
      res.status(500).json({
        success: false,
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
};