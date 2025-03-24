import { batchManager, registerJobHandler } from './batch-manager'; // Import batch processing framework for job registration and execution
import { logger } from '../utils/logger'; // Import logging batch job execution, errors, and status updates
import { ReportExportService } from '../services/reports/export.service'; // Import service for exporting reports in various formats
import { ReportsService } from '../services/reports.service'; // Import service for retrieving report data
import { ClaimsService } from '../services/claims.service'; // Import service for retrieving claim data
import { PaymentsService } from '../services/payments.service'; // Import service for retrieving payment data
import { NotificationService } from '../services/notification.service'; // Import service for sending notifications to users
import { ExportType, ExportFormat, ExportOptions } from '../types/reports.types'; // Import type definitions for export operations
import { UUID } from '../types/common.types'; // Import common type definitions
import { BusinessError } from '../errors/business-error'; // Import error handling for business rule violations
import { metrics } from '../utils/metrics'; // Track metrics for data export batch jobs
import { fileUtils } from '../utils/file'; // Utilities for file operations
import fs from 'fs-extra'; // Enhanced file system operations with promises // version ^11.1.1
import path from 'path'; // Path manipulation utilities // version ^0.12.7

// Define the job type for data export
const DATA_EXPORT_JOB_TYPE = 'data-export';

/**
 * Handles the batch export of data based on the specified export type and parameters
 * @param jobData - Data for the batch job including export type, entity ID, format, and options
 * @param context - Context for the batch job
 * @returns Result of the data export process including URLs to exported files
 */
const handleDataExportBatch = async (jobData: any, context: any): Promise<object> => {
  // Log start of data export batch job
  logger.info('Starting data export batch job', { jobData, context });

  // Extract parameters from jobData (exportType, entityId, format, options, notifyUsers, userId)
  const { exportType, entityId, format, options, notifyUsers, userId } = jobData;

  // Validate parameters are present and valid
  const isValid = validateExportParameters(jobData);
  if (!isValid) {
    throw new BusinessError('Invalid export parameters', jobData, 'data-export.invalid_parameters');
  }

  let exportResult;
  // Switch based on exportType (REPORT, CLAIM, PAYMENT, CLAIMS_BATCH, PAYMENTS_BATCH)
  switch (exportType) {
    case ExportType.REPORT:
      // For REPORT type, call handleReportExport function
      exportResult = await handleReportExport(entityId, format, options);
      break;
    case ExportType.CLAIM:
      // For CLAIM type, call handleClaimExport function
      exportResult = await handleClaimExport(entityId, format, options);
      break;
    case ExportType.PAYMENT:
      // For PAYMENT type, call handlePaymentExport function
      exportResult = await handlePaymentExport(entityId, format, options);
      break;
    case ExportType.CLAIMS_BATCH:
      // For CLAIMS_BATCH type, call handleClaimsBatchExport function
      exportResult = await handleClaimsBatchExport(options.filterCriteria, format, options);
      break;
    case ExportType.PAYMENTS_BATCH:
      // For PAYMENTS_BATCH type, call handlePaymentsBatchExport function
      exportResult = await handlePaymentsBatchExport(options.filterCriteria, format, options);
      break;
    default:
      // If exportType is not supported, throw BusinessError
      throw new BusinessError(`Unsupported export type: ${exportType}`, { exportType }, 'data-export.unsupported_export_type');
  }

  // If notifyUsers is true, send notifications to specified users
  if (notifyUsers && userId) {
    await sendExportNotification([userId], exportType, exportResult);
  }

  // Log completion of batch job with success/failure status
  logger.info('Data export batch job completed', { exportType, entityId, format, success: true, exportResult });

  // Return comprehensive results object with export details and download URLs
  return exportResult;
};

/**
 * Handles the export of a report to the specified format
 * @param reportId - ID of the report to export
 * @param format - Format to export the report to
 * @param options - Options for the export
 * @returns Details of the exported report file
 */
const handleReportExport = async (reportId: UUID, format: ExportFormat, options: ExportOptions): Promise<{ url: string; filename: string; storageKey: string }> => {
  // Log start of report export
  logger.info('Starting report export', { reportId, format, options });

  // Initialize ReportsService and ReportExportService
  const reportsService = new ReportsService(null, null, null, new ReportExportService(), null, null, null);
  const reportExportService = new ReportExportService();

  // Retrieve report data using ReportsService.getReportById
  const reportData = await reportsService.getReportById(reportId, options);

  // Export report to specified format using ReportExportService.exportReport
  const exportResult = await reportExportService.exportReport(reportData, format, 'org-123');

  // Return export details including download URL, filename, and storage key
  return exportResult;
};

/**
 * Handles the export of a single claim to the specified format
 * @param claimId - ID of the claim to export
 * @param format - Format to export the claim to
 * @param options - Options for the export
 * @returns Details of the exported claim file
 */
const handleClaimExport = async (claimId: UUID, format: ExportFormat, options: ExportOptions): Promise<{ url: string; filename: string; storageKey: string }> => {
  // Log start of claim export
  logger.info('Starting claim export', { claimId, format, options });

  // Initialize ClaimsService and ReportExportService
  const claimsService = new ClaimsService();
  const reportExportService = new ReportExportService();

  // Retrieve claim data using ClaimsService.getClaimById
  const claimData = await claimsService.getClaim(claimId);

  // Format claim data for export
  // TODO: Implement claim data formatting

  // Export claim to specified format using ReportExportService.exportReport
  const exportResult = await reportExportService.exportReport(claimData, format, 'org-123');

  // Return export details including download URL, filename, and storage key
  return exportResult;
};

/**
 * Handles the export of a single payment to the specified format
 * @param paymentId - ID of the payment to export
 * @param format - Format to export the payment to
 * @param options - Options for the export
 * @returns Details of the exported payment file
 */
const handlePaymentExport = async (paymentId: UUID, format: ExportFormat, options: ExportOptions): Promise<{ url: string; filename: string; storageKey: string }> => {
  // Log start of payment export
  logger.info('Starting payment export', { paymentId, format, options });

  // Initialize PaymentsService and ReportExportService
  const paymentsService = new PaymentsService();
  const reportExportService = new ReportExportService();

  // Retrieve payment data using PaymentsService.getPaymentById
  const paymentData = await paymentsService.getPaymentById(paymentId, options);

  // Format payment data for export
  // TODO: Implement payment data formatting

  // Export payment to specified format using ReportExportService.exportReport
  const exportResult = await reportExportService.exportReport(paymentData, format, 'org-123');

  // Return export details including download URL, filename, and storage key
  return exportResult;
};

/**
 * Handles the export of multiple claims based on filter criteria
 * @param filterCriteria - Criteria to filter claims by
 * @param format - Format to export the claims to
 * @param options - Options for the export
 * @returns Details of the exported claims batch file
 */
const handleClaimsBatchExport = async (filterCriteria: any, format: ExportFormat, options: ExportOptions): Promise<{ url: string; filename: string; storageKey: string; count: number }> => {
  // Log start of claims batch export
  logger.info('Starting claims batch export', { filterCriteria, format, options });

  // Initialize ClaimsService and ReportExportService
  const claimsService = new ClaimsService();
  const reportExportService = new ReportExportService();

  // Retrieve claims data using ClaimsService.getClaimsByFilter
  const claimsData = await claimsService.getClaims(filterCriteria);

  // Format claims data for export
  // TODO: Implement claims data formatting

  // Export claims to specified format using ReportExportService.exportReport
  const exportResult = await reportExportService.exportReport(claimsData, format, 'org-123');

  // Return export details including download URL, filename, storage key, and count of exported claims
  return { ...exportResult, count: claimsData.length };
};

/**
 * Handles the export of multiple payments based on filter criteria
 * @param filterCriteria - Criteria to filter payments by
 * @param format - Format to export the payments to
 * @param options - Options for the export
 * @returns Details of the exported payments batch file
 */
const handlePaymentsBatchExport = async (filterCriteria: any, format: ExportFormat, options: ExportOptions): Promise<{ url: string; filename: string; storageKey: string; count: number }> => {
  // Log start of payments batch export
  logger.info('Starting payments batch export', { filterCriteria, format, options });

  // Initialize PaymentsService and ReportExportService
  const paymentsService = new PaymentsService();
  const reportExportService = new ReportExportService();

  // Retrieve payments data using PaymentsService.getPaymentsByFilter
  const paymentsData = await paymentsService.getPayments(filterCriteria);

  // Format payments data for export
  // TODO: Implement payments data formatting

  // Export payments to specified format using ReportExportService.exportReport
  const exportResult = await reportExportService.exportReport(paymentsData, format, 'org-123');

  // Return export details including download URL, filename, storage key, and count of exported payments
  return { ...exportResult, count: paymentsData.length };
};

/**
 * Validates the parameters for data export
 * @param params - Parameters to validate
 * @returns Whether parameters are valid
 */
const validateExportParameters = (params: any): boolean => {
  // Check if exportType is valid (REPORT, CLAIM, PAYMENT, CLAIMS_BATCH, PAYMENTS_BATCH)
  if (!Object.values(ExportType).includes(params.exportType)) {
    logger.error('Invalid export type', { exportType: params.exportType });
    return false;
  }

  // For single entity exports (REPORT, CLAIM, PAYMENT), validate that entityId is provided
  if ([ExportType.REPORT, ExportType.CLAIM, ExportType.PAYMENT].includes(params.exportType) && !params.entityId) {
    logger.error('Entity ID is required for single entity exports', { exportType: params.exportType });
    return false;
  }

  // For batch exports (CLAIMS_BATCH, PAYMENTS_BATCH), validate that filterCriteria is provided
  if ([ExportType.CLAIMS_BATCH, ExportType.PAYMENTS_BATCH].includes(params.exportType) && !params.filterCriteria) {
    logger.error('Filter criteria is required for batch exports', { exportType: params.exportType });
    return false;
  }

  // Validate that format is a valid ExportFormat
  if (!Object.values(ExportFormat).includes(params.format)) {
    logger.error('Invalid export format', { format: params.format });
    return false;
  }

  return true;
};

/**
 * Sends a notification about the completed export
 * @param userIds - IDs of the users to notify
 * @param exportType - Type of the export
 * @param exportResult - Result of the export
 * @returns Resolves when notifications are sent
 */
const sendExportNotification = async (userIds: UUID[], exportType: string, exportResult: any): Promise<void> => {
  // Initialize the NotificationService
  const notificationService = new NotificationService();

  // Create notification content with export details and download link
  const notificationContent = {
    title: `Data Export Completed`,
    message: `Your ${exportType} export has completed successfully.`,
    data: {
      downloadUrl: exportResult.url,
      filename: exportResult.filename,
    },
  };

  // For each userId, send a notification
  for (const userId of userIds) {
    try {
      await notificationService.sendNotification(
        userId,
        'data_export_completed' as any, // TODO: Define notification types
        'info' as any, // TODO: Define notification severities
        notificationContent
      );
      logger.info(`Export notification sent to user ${userId}`);
    } catch (error) {
      logger.error(`Error sending export notification to user ${userId}`, error);
    }
  }
};

/**
 * Registers the data export batch handler with the batch manager
 */
const registerDataExportBatchHandler = (): void => {
  // Call registerJobHandler with DATA_EXPORT_JOB_TYPE and handleDataExportBatch handler
  batchManager.registerJobHandler(DATA_EXPORT_JOB_TYPE, handleDataExportBatch);

  // Log registration of data export batch handler
  logger.info('Registered data export batch handler');
};

// Call registerDataExportBatchHandler to register the handler
registerDataExportBatchHandler();

// Export the handler function for use in other modules
export { handleDataExportBatch };
export { registerDataExportBatchHandler };
export { DATA_EXPORT_JOB_TYPE };
export { handleReportExport };
export { handleClaimExport };
export { handlePaymentExport };
export { handleClaimsBatchExport };
export { handlePaymentsBatchExport };