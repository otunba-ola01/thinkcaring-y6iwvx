/**
 * This file defines TypeScript types and interfaces for the reporting functionality in the HCBS Revenue Management System frontend.
 * It provides type definitions for report parameters, data structures, visualization options, scheduling configurations,
 * and API responses used throughout the reporting module.
 */

import { 
  UUID,
  ISO8601Date,
  ISO8601DateTime,
  Money,
  DateRange,
  PaginatedResponse,
  QueryParams
} from './common.types';

import { ApiResponse } from './api.types';
import { ClaimStatus } from './claims.types';
import { PaymentStatus } from './payments.types';

/**
 * Enum defining the types of reports available in the system
 */
export enum ReportType {
  REVENUE_BY_PROGRAM = 'revenueByProgram',
  REVENUE_BY_PAYER = 'revenueByPayer',
  CLAIMS_STATUS = 'claimsStatus',
  AGING_ACCOUNTS_RECEIVABLE = 'agingAccountsReceivable',
  DENIAL_ANALYSIS = 'denialAnalysis',
  PAYER_PERFORMANCE = 'payerPerformance',
  SERVICE_UTILIZATION = 'serviceUtilization',
  CUSTOM = 'custom'
}

/**
 * Enum defining the categories of reports for organization and filtering
 */
export enum ReportCategory {
  REVENUE = 'revenue',
  CLAIMS = 'claims',
  FINANCIAL = 'financial',
  OPERATIONAL = 'operational',
  COMPLIANCE = 'compliance'
}

/**
 * Enum defining the available export formats for reports
 */
export enum ReportFormat {
  PDF = 'pdf',
  EXCEL = 'excel',
  CSV = 'csv',
  JSON = 'json'
}

/**
 * Enum defining the possible statuses of a report instance
 */
export enum ReportStatus {
  DRAFT = 'draft',
  GENERATING = 'generating',
  COMPLETED = 'completed',
  FAILED = 'failed',
  SCHEDULED = 'scheduled'
}

/**
 * Enum defining the frequency options for scheduled reports
 */
export enum ScheduleFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  BIWEEKLY = 'biweekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  ANNUALLY = 'annually'
}

/**
 * Enum defining standard time frames for report parameters
 */
export enum TimeFrame {
  CURRENT_MONTH = 'currentMonth',
  PREVIOUS_MONTH = 'previousMonth',
  CURRENT_QUARTER = 'currentQuarter',
  PREVIOUS_QUARTER = 'previousQuarter',
  CURRENT_YEAR = 'currentYear',
  PREVIOUS_YEAR = 'previousYear',
  LAST_30_DAYS = 'last30Days',
  LAST_60_DAYS = 'last60Days',
  LAST_90_DAYS = 'last90Days',
  CUSTOM = 'custom'
}

/**
 * Enum defining comparison options for trend analysis in reports
 */
export enum ComparisonType {
  PREVIOUS_PERIOD = 'previousPeriod',
  YEAR_OVER_YEAR = 'yearOverYear',
  BUDGET = 'budget',
  NONE = 'none'
}

/**
 * Enum defining the types of charts available for report visualizations
 */
export enum ChartType {
  BAR = 'bar',
  LINE = 'line',
  PIE = 'pie',
  AREA = 'area',
  SCATTER = 'scatter',
  TABLE = 'table'
}

/**
 * Enum defining trend directions for financial metrics
 */
export enum MetricTrend {
  UP = 'up',
  DOWN = 'down',
  FLAT = 'flat'
}

/**
 * Enum defining aging buckets for accounts receivable reports
 */
export enum AgingBucket {
  CURRENT = 'current',
  DAYS_1_30 = 'days1To30',
  DAYS_31_60 = 'days31To60',
  DAYS_61_90 = 'days61To90',
  DAYS_91_PLUS = 'days91Plus'
}

/**
 * Interface defining the parameters for generating reports
 */
export interface ReportParameters {
  timeFrame: TimeFrame;
  dateRange: DateRange;
  comparisonType: ComparisonType;
  comparisonDateRange: DateRange;
  programIds: UUID[];
  payerIds: UUID[];
  facilityIds: UUID[];
  serviceTypeIds: UUID[];
  asOfDate: ISO8601Date;
  groupBy: string;
  sortBy: string;
  limit: number;
  customParameters: Record<string, any>;
}

/**
 * Interface defining metadata for generated reports
 */
export interface ReportMetadata {
  reportName: string;
  reportType: ReportType;
  generatedAt: ISO8601DateTime;
  generatedBy: { id: UUID; name: string };
  parameters: ReportParameters;
  organization: { id: UUID; name: string };
}

/**
 * Interface defining visualization configurations for reports
 */
export interface ReportVisualization {
  id: string;
  title: string;
  type: ChartType;
  dataKey: string;
  xAxis: { key: string; label: string };
  yAxis: { key: string; label: string };
  series: Array<{ key: string; label: string; color?: string }>;
  options: Record<string, any>;
}

/**
 * Interface defining summary metrics displayed in report headers
 */
export interface ReportSummaryMetric {
  label: string;
  value: number | string;
  previousValue: number | string;
  change: number;
  trend: MetricTrend;
  format: 'currency' | 'percentage' | 'number' | 'date' | 'text';
}

/**
 * Interface defining the structure of generated report data
 */
export interface ReportData {
  metadata: ReportMetadata;
  summaryMetrics: ReportSummaryMetric[];
  visualizations: ReportVisualization[];
  data: Record<string, any[]>;
}

/**
 * Interface defining a report definition that can be saved and reused
 */
export interface ReportDefinition {
  id: UUID;
  name: string;
  description: string;
  type: ReportType;
  category: ReportCategory;
  parameters: ReportParameters;
  visualizations: ReportVisualization[];
  isTemplate: boolean;
  isSystem: boolean;
  createdAt: ISO8601DateTime;
  updatedAt: ISO8601DateTime;
  createdBy: UUID;
}

/**
 * Interface defining a generated report instance
 */
export interface ReportInstance {
  id: UUID;
  reportDefinitionId: UUID;
  name: string;
  parameters: ReportParameters;
  status: ReportStatus;
  generatedAt: ISO8601DateTime;
  expiresAt: ISO8601DateTime;
  fileUrls: Record<ReportFormat, string>;
  errorMessage: string;
  createdBy: UUID;
}

/**
 * Interface defining a recipient for scheduled reports
 */
export interface ReportRecipient {
  email: string;
  userId: UUID;
  name: string;
}

/**
 * Interface defining a scheduled report configuration
 */
export interface ScheduledReport {
  id: UUID;
  reportDefinitionId: UUID;
  name: string;
  description: string;
  parameters: ReportParameters;
  frequency: ScheduleFrequency;
  dayOfWeek: number;
  dayOfMonth: number;
  time: string;
  formats: ReportFormat[];
  recipients: ReportRecipient[];
  isActive: boolean;
  lastRunAt: ISO8601DateTime;
  nextRunAt: ISO8601DateTime;
  createdAt: ISO8601DateTime;
  updatedAt: ISO8601DateTime;
  createdBy: UUID;
}

/**
 * Interface defining the request payload for scheduling a report
 */
export interface ScheduleReportRequest {
  reportDefinitionId: UUID;
  name: string;
  description: string;
  parameters: ReportParameters;
  frequency: ScheduleFrequency;
  dayOfWeek: number;
  dayOfMonth: number;
  time: string;
  formats: ReportFormat[];
  recipients: ReportRecipient[];
  isActive: boolean;
}

/**
 * Interface defining the request payload for generating a report
 */
export interface GenerateReportRequest {
  reportType: ReportType;
  name: string;
  parameters: ReportParameters;
  formats: ReportFormat[];
  saveDefinition: boolean;
}

/**
 * Interface defining the response from a report generation request
 */
export interface GenerateReportResponse {
  reportInstanceId: UUID;
  reportDefinitionId: UUID;
  status: ReportStatus;
  message: string;
}

/**
 * Interface defining parameters for retrieving a list of reports
 */
export interface GetReportListParams {
  page: number;
  pageSize: number;
  reportType: ReportType;
  category: ReportCategory;
  status: ReportStatus;
  startDate: ISO8601Date;
  endDate: ISO8601Date;
  search: string;
}

/**
 * Interface defining a financial metric for dashboards and reports
 */
export interface FinancialMetric {
  id: string;
  name: string;
  description: string;
  category: 'revenue' | 'claims' | 'payments' | 'general';
  value: number | string;
  previousValue: number | string;
  change: number;
  trend: MetricTrend;
  format: 'currency' | 'percentage' | 'number' | 'days' | 'text';
  target: number;
  threshold: { warning: number; critical: number };
}

/**
 * Interface defining data structure for revenue by program reports
 */
export interface RevenueByProgramData {
  programId: UUID;
  programName: string;
  revenue: Money;
  previousRevenue: Money;
  change: number;
  percentOfTotal: number;
  claimCount: number;
  clientCount: number;
  monthlyData: Array<{ month: string; revenue: Money }>;
}

/**
 * Interface defining data structure for revenue by payer reports
 */
export interface RevenueByPayerData {
  payerId: UUID;
  payerName: string;
  revenue: Money;
  previousRevenue: Money;
  change: number;
  percentOfTotal: number;
  claimCount: number;
  averageProcessingDays: number;
  monthlyData: Array<{ month: string; revenue: Money }>;
}

/**
 * Interface defining data structure for claims status reports
 */
export interface ClaimsStatusData {
  status: ClaimStatus;
  count: number;
  amount: Money;
  percentOfTotal: number;
  averageAge: number;
}

/**
 * Interface defining data structure for aging accounts receivable reports
 */
export interface AgingReceivablesData {
  agingBucket: AgingBucket;
  amount: Money;
  percentOfTotal: number;
  claimCount: number;
  payerBreakdown: Array<{ payerId: UUID; payerName: string; amount: Money }>;
}

/**
 * Interface defining data structure for denial analysis reports
 */
export interface DenialAnalysisData {
  denialReason: string;
  denialCode: string;
  count: number;
  amount: Money;
  percentOfTotal: number;
  payerBreakdown: Array<{ payerId: UUID; payerName: string; count: number }>;
}

/**
 * Interface defining data structure for payer performance reports
 */
export interface PayerPerformanceData {
  payerId: UUID;
  payerName: string;
  claimsSubmitted: number;
  claimsPaid: number;
  claimsDenied: number;
  denialRate: number;
  averageProcessingDays: number;
  paymentRate: number;
}

/**
 * Interface defining data structure for service utilization reports
 */
export interface ServiceUtilizationData {
  serviceTypeId: UUID;
  serviceTypeName: string;
  programId: UUID;
  programName: string;
  unitsAuthorized: number;
  unitsDelivered: number;
  utilizationPercentage: number;
  clientCount: number;
}

/**
 * Type alias for API responses containing report data
 */
export type ReportApiResponse = ApiResponse<ReportData>;

/**
 * Type alias for API responses containing report instance data
 */
export type ReportInstanceApiResponse = ApiResponse<ReportInstance>;

/**
 * Type alias for API responses containing paginated report lists
 */
export type ReportListApiResponse = ApiResponse<PaginatedResponse<ReportInstance>>;

/**
 * Type alias for API responses containing scheduled report data
 */
export type ScheduledReportApiResponse = ApiResponse<ScheduledReport>;

/**
 * Type alias for API responses containing financial metrics data
 */
export type FinancialMetricsApiResponse = ApiResponse<FinancialMetric[]>;