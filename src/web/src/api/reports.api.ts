/**
 * API Client for HCBS Revenue Management System reporting functionality
 * 
 * This file provides API client functions for interacting with the reporting endpoints,
 * including generating reports, retrieving report definitions, managing scheduled reports,
 * and accessing financial metrics.
 * 
 * @version 1.0.0
 */

import { apiClient } from './client';
import { API_ENDPOINTS } from '../constants/api.constants';
import { REPORT_API_ENDPOINTS } from '../constants/reports.constants';
import { 
  ApiResponse, 
  ApiPaginatedResponse 
} from '../types/api.types';
import { 
  ReportDefinition, 
  ReportInstance, 
  ScheduledReport, 
  ReportParameters, 
  GenerateReportRequest, 
  GenerateReportResponse, 
  ReportData, 
  FinancialMetric, 
  GetReportListParams, 
  ScheduleReportRequest,
  ReportFormat
} from '../types/reports.types';
import { UUID } from '../types/common.types';

/**
 * Retrieves a paginated list of report definitions with optional filtering
 * 
 * @param params - Query parameters for filtering and pagination
 * @returns Promise resolving to paginated list of report definitions
 */
const getReportDefinitions = async (
  params: GetReportListParams
): Promise<ApiPaginatedResponse<ReportDefinition>> => {
  return apiClient.get(REPORT_API_ENDPOINTS.REPORT_DEFINITIONS, params);
};

/**
 * Retrieves a specific report definition by ID
 * 
 * @param id - ID of the report definition to retrieve
 * @returns Promise resolving to the requested report definition
 */
const getReportDefinition = async (
  id: UUID
): Promise<ApiResponse<ReportDefinition>> => {
  const url = REPORT_API_ENDPOINTS.REPORT_DEFINITION_BY_ID.replace(':id', id);
  return apiClient.get(url);
};

/**
 * Creates a new report definition
 * 
 * @param reportDefinition - The report definition to create
 * @returns Promise resolving to the created report definition
 */
const createReportDefinition = async (
  reportDefinition: Partial<ReportDefinition>
): Promise<ApiResponse<ReportDefinition>> => {
  return apiClient.post(REPORT_API_ENDPOINTS.REPORT_DEFINITIONS, reportDefinition);
};

/**
 * Updates an existing report definition
 * 
 * @param id - ID of the report definition to update
 * @param reportDefinition - Updated report definition data
 * @returns Promise resolving to the updated report definition
 */
const updateReportDefinition = async (
  id: UUID,
  reportDefinition: Partial<ReportDefinition>
): Promise<ApiResponse<ReportDefinition>> => {
  const url = REPORT_API_ENDPOINTS.REPORT_DEFINITION_BY_ID.replace(':id', id);
  return apiClient.put(url, reportDefinition);
};

/**
 * Deletes a report definition by ID
 * 
 * @param id - ID of the report definition to delete
 * @returns Promise resolving when the report definition is deleted
 */
const deleteReportDefinition = async (
  id: UUID
): Promise<ApiResponse<void>> => {
  const url = REPORT_API_ENDPOINTS.REPORT_DEFINITION_BY_ID.replace(':id', id);
  return apiClient.del(url);
};

/**
 * Generates a new report based on the provided parameters
 * 
 * @param request - The report generation request parameters
 * @returns Promise resolving to the report generation response
 */
const generateReport = async (
  request: GenerateReportRequest
): Promise<ApiResponse<GenerateReportResponse>> => {
  return apiClient.post(REPORT_API_ENDPOINTS.GENERATE_REPORT, request);
};

/**
 * Generates a report based on an existing report definition
 * 
 * @param definitionId - ID of the report definition to use
 * @param parameters - Parameters to customize the report generation
 * @returns Promise resolving to the report generation response
 */
const generateReportFromDefinition = async (
  definitionId: UUID,
  parameters: ReportParameters
): Promise<ApiResponse<GenerateReportResponse>> => {
  const url = REPORT_API_ENDPOINTS.GENERATE_REPORT_BY_DEFINITION.replace(':id', definitionId);
  return apiClient.post(url, parameters);
};

/**
 * Retrieves a paginated list of report instances with optional filtering
 * 
 * @param params - Query parameters for filtering and pagination
 * @returns Promise resolving to paginated list of report instances
 */
const getReportInstances = async (
  params: GetReportListParams
): Promise<ApiPaginatedResponse<ReportInstance>> => {
  return apiClient.get(REPORT_API_ENDPOINTS.REPORT_INSTANCES, params);
};

/**
 * Retrieves a specific report instance by ID
 * 
 * @param id - ID of the report instance to retrieve
 * @returns Promise resolving to the requested report instance
 */
const getReportInstance = async (
  id: UUID
): Promise<ApiResponse<ReportInstance>> => {
  const url = REPORT_API_ENDPOINTS.REPORT_INSTANCE_BY_ID.replace(':id', id);
  return apiClient.get(url);
};

/**
 * Retrieves the data for a specific report instance
 * 
 * @param instanceId - ID of the report instance
 * @returns Promise resolving to the report data
 */
const getReportData = async (
  instanceId: UUID
): Promise<ApiResponse<ReportData>> => {
  const url = `${REPORT_API_ENDPOINTS.REPORT_INSTANCE_BY_ID.replace(':id', instanceId)}/data`;
  return apiClient.get(url);
};

/**
 * Exports a report in the specified format
 * 
 * @param instanceId - ID of the report instance to export
 * @param format - The format to export the report as
 * @param fileName - The name to use for the downloaded file
 * @returns Promise resolving to the exported report file as a Blob
 */
const exportReport = async (
  instanceId: UUID,
  format: ReportFormat,
  fileName: string
): Promise<Blob> => {
  const url = REPORT_API_ENDPOINTS.EXPORT_REPORT
    .replace(':id', instanceId)
    .replace(':format', format);
  
  return apiClient.downloadFile({ url, fileName });
};

/**
 * Deletes a report instance by ID
 * 
 * @param id - ID of the report instance to delete
 * @returns Promise resolving when the report instance is deleted
 */
const deleteReportInstance = async (
  id: UUID
): Promise<ApiResponse<void>> => {
  const url = REPORT_API_ENDPOINTS.REPORT_INSTANCE_BY_ID.replace(':id', id);
  return apiClient.del(url);
};

/**
 * Retrieves a paginated list of scheduled reports with optional filtering
 * 
 * @param params - Query parameters for filtering and pagination
 * @returns Promise resolving to paginated list of scheduled reports
 */
const getScheduledReports = async (
  params: GetReportListParams
): Promise<ApiPaginatedResponse<ScheduledReport>> => {
  return apiClient.get(REPORT_API_ENDPOINTS.SCHEDULED_REPORTS, params);
};

/**
 * Retrieves a specific scheduled report by ID
 * 
 * @param id - ID of the scheduled report to retrieve
 * @returns Promise resolving to the requested scheduled report
 */
const getScheduledReport = async (
  id: UUID
): Promise<ApiResponse<ScheduledReport>> => {
  const url = REPORT_API_ENDPOINTS.SCHEDULED_REPORT_BY_ID.replace(':id', id);
  return apiClient.get(url);
};

/**
 * Creates a new scheduled report
 * 
 * @param request - The schedule report request
 * @returns Promise resolving to the created scheduled report
 */
const scheduleReport = async (
  request: ScheduleReportRequest
): Promise<ApiResponse<ScheduledReport>> => {
  return apiClient.post(REPORT_API_ENDPOINTS.SCHEDULED_REPORTS, request);
};

/**
 * Updates an existing scheduled report
 * 
 * @param id - ID of the scheduled report to update
 * @param request - Updated schedule report data
 * @returns Promise resolving to the updated scheduled report
 */
const updateScheduledReport = async (
  id: UUID,
  request: Partial<ScheduleReportRequest>
): Promise<ApiResponse<ScheduledReport>> => {
  const url = REPORT_API_ENDPOINTS.SCHEDULED_REPORT_BY_ID.replace(':id', id);
  return apiClient.put(url, request);
};

/**
 * Deletes a scheduled report by ID
 * 
 * @param id - ID of the scheduled report to delete
 * @returns Promise resolving when the scheduled report is deleted
 */
const deleteScheduledReport = async (
  id: UUID
): Promise<ApiResponse<void>> => {
  const url = REPORT_API_ENDPOINTS.SCHEDULED_REPORT_BY_ID.replace(':id', id);
  return apiClient.del(url);
};

/**
 * Manually executes a scheduled report
 * 
 * @param id - ID of the scheduled report to execute
 * @returns Promise resolving to the report generation response
 */
const executeScheduledReport = async (
  id: UUID
): Promise<ApiResponse<GenerateReportResponse>> => {
  const url = REPORT_API_ENDPOINTS.EXECUTE_SCHEDULED_REPORT.replace(':id', id);
  return apiClient.post(url);
};

/**
 * Retrieves financial metrics data
 * 
 * @param params - Parameters for filtering metrics
 * @returns Promise resolving to financial metrics data
 */
const getFinancialMetrics = async (
  params: ReportParameters
): Promise<ApiResponse<FinancialMetric[]>> => {
  return apiClient.get(REPORT_API_ENDPOINTS.FINANCIAL_METRICS, params);
};

/**
 * Retrieves revenue-specific metrics data
 * 
 * @param params - Parameters for filtering metrics
 * @returns Promise resolving to revenue metrics data
 */
const getRevenueMetrics = async (
  params: ReportParameters
): Promise<ApiResponse<FinancialMetric[]>> => {
  return apiClient.get(REPORT_API_ENDPOINTS.REVENUE_METRICS, params);
};

/**
 * Retrieves claims-specific metrics data
 * 
 * @param params - Parameters for filtering metrics
 * @returns Promise resolving to claims metrics data
 */
const getClaimsMetrics = async (
  params: ReportParameters
): Promise<ApiResponse<FinancialMetric[]>> => {
  return apiClient.get(REPORT_API_ENDPOINTS.CLAIMS_METRICS, params);
};

/**
 * Retrieves payment-specific metrics data
 * 
 * @param params - Parameters for filtering metrics
 * @returns Promise resolving to payment metrics data
 */
const getPaymentMetrics = async (
  params: ReportParameters
): Promise<ApiResponse<FinancialMetric[]>> => {
  return apiClient.get(REPORT_API_ENDPOINTS.PAYMENT_METRICS, params);
};

// Export all report-related API functions
export const reportsApi = {
  getReportDefinitions,
  getReportDefinition,
  createReportDefinition,
  updateReportDefinition,
  deleteReportDefinition,
  generateReport,
  generateReportFromDefinition,
  getReportInstances,
  getReportInstance,
  getReportData,
  exportReport,
  deleteReportInstance,
  getScheduledReports,
  getScheduledReport,
  scheduleReport,
  updateScheduledReport,
  deleteScheduledReport,
  executeScheduledReport,
  getFinancialMetrics,
  getRevenueMetrics,
  getClaimsMetrics,
  getPaymentMetrics
};