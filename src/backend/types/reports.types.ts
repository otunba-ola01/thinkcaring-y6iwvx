/**
 * Defines TypeScript types and interfaces for the reporting functionality in the HCBS Revenue Management System.
 * This file contains type definitions for report parameters, data structures, visualization options,
 * and scheduling configurations used throughout the reporting system.
 * 
 * @module reports.types
 */

import {
  UUID,
  ISO8601Date,
  Money,
  DateRange,
  TimeInterval,
  DateRangePreset,
  AgingBucket,
  AuditableEntity
} from './common.types';

import {
  ClaimStatus
} from './claims.types';

import {
  PaymentStatus
} from './payments.types';

/**
 * Enum defining the types of reports available in the system
 */
export enum ReportType {
  REVENUE_BY_PROGRAM = 'revenue_by_program',
  REVENUE_BY_PAYER = 'revenue_by_payer',
  CLAIMS_STATUS = 'claims_status',
  AGING_ACCOUNTS_RECEIVABLE = 'aging_accounts_receivable',
  DENIAL_ANALYSIS = 'denial_analysis',
  PAYER_PERFORMANCE = 'payer_performance',
  SERVICE_UTILIZATION = 'service_utilization',
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
  COMPLIANCE = 'compliance',
  CUSTOM = 'custom'
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
  PENDING = 'pending',
  GENERATING = 'generating',
  COMPLETED = 'completed',
  FAILED = 'failed',
  EXPIRED = 'expired'
}

/**
 * Enum defining the frequency options for scheduled reports
 */
export enum ScheduleFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly'
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
  RADAR = 'radar',
  GAUGE = 'gauge',
  TABLE = 'table'
}

/**
 * Enum defining standard time frames for report parameters
 */
export enum TimeFrame {
  TODAY = 'today',
  YESTERDAY = 'yesterday',
  THIS_WEEK = 'this_week',
  LAST_WEEK = 'last_week',
  THIS_MONTH = 'this_month',
  LAST_MONTH = 'last_month',
  THIS_QUARTER = 'this_quarter',
  LAST_QUARTER = 'last_quarter',
  THIS_YEAR = 'this_year',
  LAST_YEAR = 'last_year',
  LAST_30_DAYS = 'last_30_days',
  LAST_60_DAYS = 'last_60_days',
  LAST_90_DAYS = 'last_90_days',
  CUSTOM = 'custom'
}

/**
 * Enum defining comparison options for trend analysis in reports
 */
export enum ComparisonType {
  NONE = 'none',
  PREVIOUS_PERIOD = 'previous_period',
  PREVIOUS_YEAR = 'previous_year',
  CUSTOM = 'custom'
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
 * Interface defining the parameters for generating reports
 */
export interface ReportParameters {
  timeFrame: TimeFrame;
  dateRange: DateRange;
  comparisonType: ComparisonType;
  comparisonDateRange?: DateRange;
  programIds?: UUID[];
  payerIds?: UUID[];
  facilityIds?: UUID[];
  serviceTypeIds?: UUID[];
  asOfDate?: ISO8601Date;
  groupBy?: string;
  sortBy?: string;
  limit?: number;
  customParameters?: Record<string, any>;
}

/**
 * Interface defining metadata for generated reports
 */
export interface ReportMetadata {
  reportName: string;
  reportType: ReportType;
  generatedAt: ISO8601Date;
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
  xAxis?: { key: string; label: string };
  yAxis?: { key: string; label: string };
  series: Array<{ key: string; label: string; color?: string }>;
  options?: Record<string, any>;
}

/**
 * Interface defining summary metrics displayed in report headers
 */
export interface ReportSummaryMetric {
  label: string;
  value: number | string;
  previousValue?: number | string;
  change?: number;
  trend?: MetricTrend;
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
  organizationId: UUID;
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
  generatedAt: ISO8601Date;
  expiresAt: ISO8601Date;
  fileUrls: Record<ReportFormat, string>;
  errorMessage?: string;
  organizationId: UUID;
}

/**
 * Interface defining a recipient for scheduled reports
 */
export interface ReportRecipient {
  email: string;
  userId?: UUID;
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
  dayOfWeek?: number; // 0-6 representing Sunday to Saturday (for weekly)
  dayOfMonth?: number; // 1-31 (for monthly)
  time: string; // HH:MM in 24-hour format
  formats: ReportFormat[];
  recipients: ReportRecipient[];
  isActive: boolean;
  lastRunAt?: ISO8601Date;
  nextRunAt: ISO8601Date;
  organizationId: UUID;
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
  previousValue?: number | string;
  change?: number;
  trend?: MetricTrend;
  format: 'currency' | 'percentage' | 'number' | 'days' | 'text';
  target?: number;
  threshold?: { warning: number; critical: number };
}

/**
 * Interface defining data structure for revenue by program reports
 */
export interface RevenueByProgramData {
  programId: UUID;
  programName: string;
  revenue: Money;
  previousRevenue?: Money;
  change?: number;
  percentOfTotal: number;
  claimCount: number;
  clientCount: number;
  monthlyData?: Array<{ month: string; revenue: Money }>;
}

/**
 * Interface defining data structure for revenue by payer reports
 */
export interface RevenueByPayerData {
  payerId: UUID;
  payerName: string;
  revenue: Money;
  previousRevenue?: Money;
  change?: number;
  percentOfTotal: number;
  claimCount: number;
  averageProcessingDays: number;
  monthlyData?: Array<{ month: string; revenue: Money }>;
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
  payerBreakdown?: Array<{ payerId: UUID; payerName: string; amount: Money }>;
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
  payerBreakdown?: Array<{ payerId: UUID; payerName: string; count: number }>;
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