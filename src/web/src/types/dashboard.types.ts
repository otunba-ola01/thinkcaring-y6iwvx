/**
 * Defines TypeScript interfaces, types, and enums for the dashboard functionality in the HCBS Revenue Management System.
 * This file provides type definitions for dashboard metrics, filters, alerts, and other data structures
 * used throughout the dashboard components and state management.
 */

import { 
  UUID, 
  ISO8601Date, 
  ISO8601DateTime, 
  Money, 
  DateRange,
  Percentage,
  ClaimStatus,
  PaymentStatus,
  ServiceStatus,
  Severity
} from './common.types';
import { ClaimMetrics } from './claims.types';
import { PaymentMetrics } from './payments.types';

/**
 * Enum defining the time frame options for dashboard filters
 */
export enum TimeFrame {
  TODAY = 'today',
  YESTERDAY = 'yesterday',
  LAST_7_DAYS = 'last7Days',
  LAST_30_DAYS = 'last30Days',
  THIS_MONTH = 'thisMonth',
  LAST_MONTH = 'lastMonth',
  THIS_QUARTER = 'thisQuarter',
  LAST_QUARTER = 'lastQuarter',
  THIS_YEAR = 'thisYear',
  LAST_YEAR = 'lastYear',
  CUSTOM = 'custom'
}

/**
 * Enum defining the categories of alerts in the system
 */
export enum AlertCategory {
  CLAIM = 'claim',
  PAYMENT = 'payment',
  AUTHORIZATION = 'authorization',
  BILLING = 'billing',
  COMPLIANCE = 'compliance',
  SYSTEM = 'system'
}

/**
 * Enum defining the loading states for async operations
 */
export enum LoadingState {
  IDLE = 'idle',
  LOADING = 'loading',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed'
}

/**
 * Interface for dashboard filter options
 */
export interface DashboardFilters {
  timeFrame: TimeFrame;
  dateRange: DateRange;
  programId: UUID | undefined;
  payerId: UUID | undefined;
  facilityId: UUID | undefined;
}

/**
 * Interface for revenue breakdown by program
 */
export interface RevenueByProgram {
  programId: UUID;
  programName: string;
  amount: Money;
  percentage: Percentage;
  previousAmount: Money;
  changePercentage: Percentage;
}

/**
 * Interface for revenue breakdown by payer
 */
export interface RevenueByPayer {
  payerId: UUID;
  payerName: string;
  amount: Money;
  percentage: Percentage;
  previousAmount: Money;
  changePercentage: Percentage;
}

/**
 * Interface for revenue breakdown by facility
 */
export interface RevenueByFacility {
  facilityId: UUID;
  facilityName: string;
  amount: Money;
  percentage: Percentage;
  previousAmount: Money;
  changePercentage: Percentage;
}

/**
 * Interface for a single point in the revenue trend chart
 */
export interface RevenueTrendPoint {
  date: ISO8601Date;
  amount: Money;
  previousAmount: Money | null;
}

/**
 * Interface for comprehensive revenue metrics
 */
export interface RevenueMetrics {
  currentPeriodRevenue: Money;
  previousPeriodRevenue: Money;
  changePercentage: Percentage;
  ytdRevenue: Money;
  previousYtdRevenue: Money;
  ytdChangePercentage: Percentage;
  projectedRevenue: Money;
  revenueByProgram: RevenueByProgram[];
  revenueByPayer: RevenueByPayer[];
  revenueByFacility: RevenueByFacility[];
  revenueTrend: RevenueTrendPoint[];
}

/**
 * Interface for claim status distribution
 */
export interface ClaimStatusBreakdown {
  status: ClaimStatus;
  count: number;
  amount: Money;
  percentage: Percentage;
}

/**
 * Interface for claims-related metrics
 */
export interface ClaimsMetrics {
  totalClaims: number;
  totalAmount: Money;
  statusBreakdown: ClaimStatusBreakdown[];
  denialRate: Percentage;
  averageProcessingTime: number;
  cleanClaimRate: Percentage;
  claimsApproachingDeadline: number;
  recentClaims: Array<{ id: UUID; claimNumber: string; clientName: string; amount: Money; status: ClaimStatus; payerName: string; age: number }>;
}

/**
 * Interface for alert notifications displayed on the dashboard
 */
export interface AlertNotification {
  id: UUID;
  title: string;
  message: string;
  category: AlertCategory;
  severity: Severity;
  timestamp: ISO8601DateTime;
  read: boolean;
  entityType: string | null;
  entityId: UUID | null;
  actionUrl: string | null;
  expiresAt: ISO8601DateTime | null;
}

/**
 * Interface for accounts receivable aging summary
 */
export interface AgingReceivablesSummary {
  current: Money;
  days1to30: Money;
  days31to60: Money;
  days61to90: Money;
  days91Plus: Money;
  total: Money;
}

/**
 * Interface for service delivery metrics
 */
export interface ServiceMetrics {
  totalServices: number;
  totalAmount: Money;
  unbilledServices: number;
  unbilledAmount: Money;
  statusBreakdown: Array<{ status: ServiceStatus; count: number; amount: Money; percentage: Percentage }>;
  servicesByProgram: Array<{ programId: UUID; programName: string; count: number; amount: Money; percentage: Percentage }>;
}

/**
 * Interface for all dashboard metrics combined
 */
export interface DashboardMetrics {
  revenue: RevenueMetrics;
  claims: ClaimsMetrics;
  payments: PaymentMetrics;
  services: ServiceMetrics;
  agingReceivables: AgingReceivablesSummary;
  alerts: AlertNotification[];
}

/**
 * Interface for dashboard Redux state
 */
export interface DashboardState {
  metrics: DashboardMetrics | null;
  filters: DashboardFilters;
  loading: LoadingState;
  error: string | null;
  lastUpdated: string | null;
}

/**
 * Interface for dashboard filter dropdown options
 */
export interface DashboardFilterOption {
  id: string;
  label: string;
  value: string;
}

/**
 * Interface for dashboard filter configuration
 */
export interface DashboardFilterConfig {
  id: string;
  label: string;
  type: string;
  options: DashboardFilterOption[] | null;
  defaultValue: string | null;
}

/**
 * Interface for dashboard API response
 */
export interface DashboardApiResponse {
  metrics: DashboardMetrics;
  timestamp: string;
}

/**
 * Interface for revenue metrics API response
 */
export interface RevenueMetricsApiResponse {
  metrics: RevenueMetrics;
  timestamp: string;
}

/**
 * Interface for claims metrics API response
 */
export interface ClaimsMetricsApiResponse {
  metrics: ClaimsMetrics;
  timestamp: string;
}

/**
 * Interface for alert notifications API response
 */
export interface AlertNotificationsApiResponse {
  alerts: AlertNotification[];
  timestamp: string;
}

/**
 * Interface for mark alert read request
 */
export interface MarkAlertReadRequest {
  alertId: UUID;
  read: boolean;
}

/**
 * Interface for mark alert read response
 */
export interface MarkAlertReadResponse {
  success: boolean;
  alertId: UUID;
  read: boolean;
}