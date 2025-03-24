import { TimeFrame, DashboardFilters } from '../types/dashboard.types';

/**
 * Time period options for dashboard filters with labels and values
 */
export const DASHBOARD_TIME_PERIODS = {
  TODAY: {
    label: 'Today',
    value: TimeFrame.TODAY,
  },
  YESTERDAY: {
    label: 'Yesterday',
    value: TimeFrame.YESTERDAY,
  },
  LAST_7_DAYS: {
    label: 'Last 7 Days',
    value: TimeFrame.LAST_7_DAYS,
  },
  LAST_30_DAYS: {
    label: 'Last 30 Days',
    value: TimeFrame.LAST_30_DAYS,
  },
  THIS_MONTH: {
    label: 'This Month',
    value: TimeFrame.THIS_MONTH,
  },
  LAST_MONTH: {
    label: 'Last Month',
    value: TimeFrame.LAST_MONTH,
  },
  THIS_QUARTER: {
    label: 'This Quarter',
    value: TimeFrame.THIS_QUARTER,
  },
  LAST_QUARTER: {
    label: 'Last Quarter',
    value: TimeFrame.LAST_QUARTER,
  },
  THIS_YEAR: {
    label: 'This Year',
    value: TimeFrame.THIS_YEAR,
  },
  LAST_YEAR: {
    label: 'Last Year',
    value: TimeFrame.LAST_YEAR,
  },
  CUSTOM: {
    label: 'Custom Range',
    value: TimeFrame.CUSTOM,
  },
};

/**
 * Types of widgets available on the dashboard
 */
export const DASHBOARD_WIDGET_TYPES = {
  REVENUE_SUMMARY: 'revenueSummary',
  REVENUE_BY_PROGRAM: 'revenueByProgram',
  REVENUE_BY_PAYER: 'revenueByPayer',
  REVENUE_TREND: 'revenueTrend',
  CLAIMS_STATUS: 'claimsStatus',
  CLAIMS_AGING: 'claimsAging',
  ALERTS: 'alerts',
  RECENT_CLAIMS: 'recentClaims',
  AGING_RECEIVABLES: 'agingReceivables',
  QUICK_ACTIONS: 'quickActions',
};

/**
 * Default filter settings for the dashboard
 */
export const DEFAULT_DASHBOARD_FILTERS: DashboardFilters = {
  timeFrame: TimeFrame.LAST_30_DAYS,
  dateRange: {
    startDate: null,
    endDate: null,
  },
  programId: undefined,
  payerId: undefined,
  facilityId: undefined,
};

/**
 * Default refresh interval for dashboard data in milliseconds (5 minutes)
 */
export const DASHBOARD_REFRESH_INTERVAL = 300000; // 5 minutes in milliseconds

/**
 * Alert categories with labels and icons for the dashboard
 */
export const DASHBOARD_ALERT_CATEGORIES = {
  CLAIM: {
    label: 'Claims',
    icon: 'description',
  },
  PAYMENT: {
    label: 'Payments',
    icon: 'payments',
  },
  AUTHORIZATION: {
    label: 'Authorizations',
    icon: 'verified',
  },
  BILLING: {
    label: 'Billing',
    icon: 'receipt',
  },
  COMPLIANCE: {
    label: 'Compliance',
    icon: 'gavel',
  },
  SYSTEM: {
    label: 'System',
    icon: 'computer',
  },
};

/**
 * Color schemes for dashboard charts and visualizations
 */
export const DASHBOARD_CHART_COLORS = {
  primary: [
    '#0F52BA', // Primary blue
    '#4CAF50', // Green
    '#FF6B35', // Orange
    '#8E24AA', // Purple
    '#1E88E5', // Light blue
    '#43A047', // Light green
    '#FB8C00', // Light orange
    '#7B1FA2', // Light purple
    '#0D47A1', // Dark blue
    '#2E7D32', // Dark green
  ],
  status: {
    draft: '#78909C', // Blue grey
    validated: '#42A5F5', // Light blue
    submitted: '#29B6F6', // Lighter blue
    acknowledged: '#26C6DA', // Cyan
    pending: '#FFA726', // Orange
    paid: '#66BB6A', // Green
    partialPaid: '#9CCC65', // Light green
    denied: '#EF5350', // Red
    appealed: '#7E57C2', // Purple
    void: '#78909C', // Blue grey
  },
  trend: {
    positive: '#4CAF50', // Green
    negative: '#F44336', // Red
    neutral: '#9E9E9E', // Grey
  },
};

/**
 * Configuration for the responsive dashboard layout grid
 */
export const DASHBOARD_LAYOUT_CONFIG = {
  cols: { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 },
  breakpoints: { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 },
  rowHeight: 150,
  margin: [20, 20],
};

/**
 * Default widget positions and sizes for different screen sizes
 */
export const DEFAULT_WIDGET_LAYOUTS = {
  lg: [
    { i: 'revenueSummary', x: 0, y: 0, w: 4, h: 2 },
    { i: 'claimsStatus', x: 4, y: 0, w: 4, h: 2 },
    { i: 'alerts', x: 8, y: 0, w: 4, h: 2 },
    { i: 'revenueByProgram', x: 0, y: 2, w: 6, h: 3 },
    { i: 'agingReceivables', x: 6, y: 2, w: 6, h: 3 },
    { i: 'recentClaims', x: 0, y: 5, w: 12, h: 3 },
  ],
  md: [
    { i: 'revenueSummary', x: 0, y: 0, w: 5, h: 2 },
    { i: 'claimsStatus', x: 5, y: 0, w: 5, h: 2 },
    { i: 'alerts', x: 0, y: 2, w: 5, h: 2 },
    { i: 'revenueByProgram', x: 5, y: 2, w: 5, h: 2 },
    { i: 'agingReceivables', x: 0, y: 4, w: 10, h: 3 },
    { i: 'recentClaims', x: 0, y: 7, w: 10, h: 3 },
  ],
  sm: [
    { i: 'revenueSummary', x: 0, y: 0, w: 6, h: 2 },
    { i: 'claimsStatus', x: 0, y: 2, w: 6, h: 2 },
    { i: 'alerts', x: 0, y: 4, w: 6, h: 2 },
    { i: 'revenueByProgram', x: 0, y: 6, w: 6, h: 3 },
    { i: 'agingReceivables', x: 0, y: 9, w: 6, h: 3 },
    { i: 'recentClaims', x: 0, y: 12, w: 6, h: 3 },
  ],
  xs: [
    { i: 'revenueSummary', x: 0, y: 0, w: 4, h: 2 },
    { i: 'claimsStatus', x: 0, y: 2, w: 4, h: 2 },
    { i: 'alerts', x: 0, y: 4, w: 4, h: 2 },
    { i: 'revenueByProgram', x: 0, y: 6, w: 4, h: 3 },
    { i: 'agingReceivables', x: 0, y: 9, w: 4, h: 3 },
    { i: 'recentClaims', x: 0, y: 12, w: 4, h: 3 },
  ],
};

/**
 * Threshold values for dashboard metrics to determine status colors
 */
export const DASHBOARD_METRIC_THRESHOLDS = {
  denialRate: {
    good: 0.05, // 0-5% is good
    warning: 0.10, // 5-10% is warning
    critical: 0.10, // >10% is critical
  },
  cleanClaimRate: {
    good: 0.95, // >95% is good
    warning: 0.90, // 90-95% is warning
    critical: 0.90, // <90% is critical
  },
  daysInAR: {
    good: 30, // 0-30 days is good
    warning: 45, // 30-45 days is warning
    critical: 45, // >45 days is critical
  },
};

/**
 * Standard date format for dashboard displays
 */
export const DASHBOARD_DATE_FORMAT = 'MMM dd, yyyy';

/**
 * Currency formatting options for dashboard financial displays
 */
export const DASHBOARD_CURRENCY_FORMAT = {
  standard: {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  },
  compact: {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  },
};