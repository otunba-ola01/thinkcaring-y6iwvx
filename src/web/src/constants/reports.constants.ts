/**
 * This file defines constants for reporting functionality in the HCBS Revenue Management System.
 * It includes API endpoints, labels, formats, configurations, and other constants used throughout
 * the reporting module.
 */

import {
  ReportType,
  ReportCategory,
  ReportFormat,
  ReportStatus,
  ScheduleFrequency,
  TimeFrame,
  ComparisonType,
  ChartType,
  MetricTrend,
  AgingBucket
} from '../types/reports.types';

/**
 * API endpoints for reporting functionality
 */
export const REPORT_API_ENDPOINTS = {
  BASE: '/api/reports',
  GENERATE_REPORT: '/api/reports/generate',
  GENERATE_REPORT_BY_DEFINITION: '/api/reports/generate-from-definition',
  EXPORT_REPORT: '/api/reports/export',
  REPORT_DEFINITIONS: '/api/reports/definitions',
  REPORT_DEFINITION_BY_ID: '/api/reports/definitions/:id',
  REPORT_INSTANCES: '/api/reports/instances',
  REPORT_INSTANCE_BY_ID: '/api/reports/instances/:id',
  SCHEDULED_REPORTS: '/api/reports/scheduled',
  SCHEDULED_REPORT_BY_ID: '/api/reports/scheduled/:id',
  EXECUTE_SCHEDULED_REPORT: '/api/reports/scheduled/:id/execute',
  FINANCIAL_METRICS: '/api/reports/metrics/financial',
  REVENUE_METRICS: '/api/reports/metrics/revenue',
  CLAIMS_METRICS: '/api/reports/metrics/claims',
  PAYMENT_METRICS: '/api/reports/metrics/payments'
};

/**
 * Human-readable labels for report types
 */
export const REPORT_TYPE_LABELS = {
  [ReportType.REVENUE_BY_PROGRAM]: 'Revenue by Program',
  [ReportType.REVENUE_BY_PAYER]: 'Revenue by Payer',
  [ReportType.CLAIMS_STATUS]: 'Claims Status',
  [ReportType.AGING_ACCOUNTS_RECEIVABLE]: 'Aging Accounts Receivable',
  [ReportType.DENIAL_ANALYSIS]: 'Denial Analysis',
  [ReportType.PAYER_PERFORMANCE]: 'Payer Performance',
  [ReportType.SERVICE_UTILIZATION]: 'Service Utilization',
  [ReportType.CUSTOM]: 'Custom Report'
};

/**
 * Human-readable labels for report categories
 */
export const REPORT_CATEGORY_LABELS = {
  [ReportCategory.REVENUE]: 'Revenue',
  [ReportCategory.CLAIMS]: 'Claims',
  [ReportCategory.FINANCIAL]: 'Financial',
  [ReportCategory.OPERATIONAL]: 'Operational',
  [ReportCategory.COMPLIANCE]: 'Compliance'
};

/**
 * Human-readable labels for report formats
 */
export const REPORT_FORMAT_LABELS = {
  [ReportFormat.PDF]: 'PDF',
  [ReportFormat.EXCEL]: 'Excel',
  [ReportFormat.CSV]: 'CSV',
  [ReportFormat.JSON]: 'JSON'
};

/**
 * MIME types for report formats
 */
export const REPORT_FORMAT_MIME_TYPES = {
  [ReportFormat.PDF]: 'application/pdf',
  [ReportFormat.EXCEL]: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  [ReportFormat.CSV]: 'text/csv',
  [ReportFormat.JSON]: 'application/json'
};

/**
 * File extensions for report formats
 */
export const REPORT_FORMAT_EXTENSIONS = {
  [ReportFormat.PDF]: 'pdf',
  [ReportFormat.EXCEL]: 'xlsx',
  [ReportFormat.CSV]: 'csv',
  [ReportFormat.JSON]: 'json'
};

/**
 * Human-readable labels for report statuses
 */
export const REPORT_STATUS_LABELS = {
  [ReportStatus.DRAFT]: 'Draft',
  [ReportStatus.GENERATING]: 'Generating',
  [ReportStatus.COMPLETED]: 'Completed',
  [ReportStatus.FAILED]: 'Failed',
  [ReportStatus.SCHEDULED]: 'Scheduled'
};

/**
 * Color codes for report status badges and visualizations
 */
export const REPORT_STATUS_COLORS = {
  [ReportStatus.DRAFT]: '#9e9e9e', // Grey
  [ReportStatus.GENERATING]: '#2196f3', // Blue
  [ReportStatus.COMPLETED]: '#4caf50', // Green
  [ReportStatus.FAILED]: '#f44336', // Red
  [ReportStatus.SCHEDULED]: '#ff9800' // Orange
};

/**
 * Human-readable labels for schedule frequency values
 */
export const SCHEDULE_FREQUENCY_LABELS = {
  [ScheduleFrequency.DAILY]: 'Daily',
  [ScheduleFrequency.WEEKLY]: 'Weekly',
  [ScheduleFrequency.BIWEEKLY]: 'Bi-weekly',
  [ScheduleFrequency.MONTHLY]: 'Monthly',
  [ScheduleFrequency.QUARTERLY]: 'Quarterly',
  [ScheduleFrequency.ANNUALLY]: 'Annually'
};

/**
 * Human-readable labels for time frame values
 */
export const TIME_FRAME_LABELS = {
  [TimeFrame.CURRENT_MONTH]: 'Current Month',
  [TimeFrame.PREVIOUS_MONTH]: 'Previous Month',
  [TimeFrame.CURRENT_QUARTER]: 'Current Quarter',
  [TimeFrame.PREVIOUS_QUARTER]: 'Previous Quarter',
  [TimeFrame.CURRENT_YEAR]: 'Current Year',
  [TimeFrame.PREVIOUS_YEAR]: 'Previous Year',
  [TimeFrame.LAST_30_DAYS]: 'Last 30 Days',
  [TimeFrame.LAST_60_DAYS]: 'Last 60 Days',
  [TimeFrame.LAST_90_DAYS]: 'Last 90 Days',
  [TimeFrame.CUSTOM]: 'Custom Date Range'
};

/**
 * Human-readable labels for comparison type values
 */
export const COMPARISON_TYPE_LABELS = {
  [ComparisonType.PREVIOUS_PERIOD]: 'Previous Period',
  [ComparisonType.YEAR_OVER_YEAR]: 'Year over Year',
  [ComparisonType.BUDGET]: 'Budget',
  [ComparisonType.NONE]: 'No Comparison'
};

/**
 * Human-readable labels for chart type values
 */
export const CHART_TYPE_LABELS = {
  [ChartType.BAR]: 'Bar Chart',
  [ChartType.LINE]: 'Line Chart',
  [ChartType.PIE]: 'Pie Chart',
  [ChartType.AREA]: 'Area Chart',
  [ChartType.SCATTER]: 'Scatter Plot',
  [ChartType.TABLE]: 'Table'
};

/**
 * Human-readable labels for metric trend values
 */
export const METRIC_TREND_LABELS = {
  [MetricTrend.UP]: 'Increasing',
  [MetricTrend.DOWN]: 'Decreasing',
  [MetricTrend.FLAT]: 'Unchanged'
};

/**
 * Icon names for metric trend visualization
 */
export const METRIC_TREND_ICONS = {
  [MetricTrend.UP]: 'trending_up',
  [MetricTrend.DOWN]: 'trending_down',
  [MetricTrend.FLAT]: 'trending_flat'
};

/**
 * Color codes for metric trend visualization
 */
export const METRIC_TREND_COLORS = {
  [MetricTrend.UP]: '#4caf50', // Green for positive trends
  [MetricTrend.DOWN]: '#f44336', // Red for negative trends
  [MetricTrend.FLAT]: '#9e9e9e' // Grey for unchanged trends
};

/**
 * Human-readable labels for aging bucket values
 */
export const AGING_BUCKET_LABELS = {
  [AgingBucket.CURRENT]: 'Current',
  [AgingBucket.DAYS_1_30]: '1-30 Days',
  [AgingBucket.DAYS_31_60]: '31-60 Days',
  [AgingBucket.DAYS_61_90]: '61-90 Days',
  [AgingBucket.DAYS_91_PLUS]: '91+ Days'
};

/**
 * Color codes for aging bucket visualization
 */
export const AGING_BUCKET_COLORS = {
  [AgingBucket.CURRENT]: '#4caf50', // Green
  [AgingBucket.DAYS_1_30]: '#8bc34a', // Light Green
  [AgingBucket.DAYS_31_60]: '#ffeb3b', // Yellow
  [AgingBucket.DAYS_61_90]: '#ff9800', // Orange
  [AgingBucket.DAYS_91_PLUS]: '#f44336' // Red
};

/**
 * Default parameter values for report generation
 */
export const DEFAULT_REPORT_PARAMETERS = {
  timeFrame: TimeFrame.LAST_30_DAYS,
  dateRange: { startDate: null, endDate: null },
  comparisonType: ComparisonType.PREVIOUS_PERIOD,
  programIds: [],
  payerIds: [],
  facilityIds: []
};

/**
 * Column definitions for report-related data tables
 */
export const REPORT_TABLE_COLUMNS = {
  REPORT_DEFINITIONS: [
    { field: 'name', headerName: 'Report Name', width: 250, sortable: true },
    { field: 'type', headerName: 'Type', width: 150, sortable: true, valueGetter: (params: any) => REPORT_TYPE_LABELS[params.row.type] },
    { field: 'category', headerName: 'Category', width: 150, sortable: true, valueGetter: (params: any) => REPORT_CATEGORY_LABELS[params.row.category] },
    { field: 'createdAt', headerName: 'Created Date', width: 150, sortable: true, type: 'date' },
    { field: 'updatedAt', headerName: 'Last Modified', width: 150, sortable: true, type: 'date' },
    { field: 'isTemplate', headerName: 'Template', width: 100, sortable: true, type: 'boolean' },
    { field: 'actions', headerName: 'Actions', width: 150, sortable: false }
  ],
  REPORT_INSTANCES: [
    { field: 'name', headerName: 'Report Name', width: 250, sortable: true },
    { field: 'generatedAt', headerName: 'Generated', width: 150, sortable: true, type: 'date' },
    { field: 'status', headerName: 'Status', width: 120, sortable: true, valueGetter: (params: any) => REPORT_STATUS_LABELS[params.row.status] },
    { field: 'reportDefinitionId', headerName: 'Definition', width: 100, sortable: true },
    { field: 'expiresAt', headerName: 'Expires', width: 150, sortable: true, type: 'date' },
    { field: 'actions', headerName: 'Actions', width: 200, sortable: false }
  ],
  SCHEDULED_REPORTS: [
    { field: 'name', headerName: 'Report Name', width: 250, sortable: true },
    { field: 'frequency', headerName: 'Frequency', width: 120, sortable: true, valueGetter: (params: any) => SCHEDULE_FREQUENCY_LABELS[params.row.frequency] },
    { field: 'nextRunAt', headerName: 'Next Run', width: 150, sortable: true, type: 'date' },
    { field: 'lastRunAt', headerName: 'Last Run', width: 150, sortable: true, type: 'date' },
    { field: 'isActive', headerName: 'Active', width: 100, sortable: true, type: 'boolean' },
    { field: 'actions', headerName: 'Actions', width: 200, sortable: false }
  ]
};

/**
 * Action identifiers for report operations
 */
export const REPORT_ACTIONS = {
  VIEW: 'view',
  EDIT: 'edit',
  GENERATE: 'generate',
  EXPORT: 'export',
  SCHEDULE: 'schedule',
  DELETE: 'delete',
  EXECUTE: 'execute'
};

/**
 * Map report actions to required permissions
 */
export const REPORT_ACTION_PERMISSIONS = {
  VIEW: 'reports:view',
  EDIT: 'reports:edit',
  GENERATE: 'reports:generate',
  EXPORT: 'reports:export',
  SCHEDULE: 'reports:schedule',
  DELETE: 'reports:delete',
  EXECUTE: 'reports:execute'
};

/**
 * Standard error messages for report generation errors
 */
export const REPORT_GENERATION_ERROR_MESSAGES = {
  INVALID_PARAMETERS: 'Invalid report parameters. Please check your inputs and try again.',
  MISSING_REPORT_TYPE: 'Report type is required.',
  INVALID_DATE_RANGE: 'Invalid date range. Please select a valid date range.',
  NO_DATA_AVAILABLE: 'No data available for the selected parameters.',
  PROCESSING_ERROR: 'An error occurred while processing the report.',
  EXPORT_FAILED: 'Failed to export the report.'
};

/**
 * Standard error messages for report scheduling errors
 */
export const REPORT_SCHEDULING_ERROR_MESSAGES = {
  INVALID_FREQUENCY: 'Invalid frequency. Please select a valid frequency.',
  INVALID_DAY: 'Invalid day selection for the selected frequency.',
  INVALID_TIME: 'Invalid time format. Please enter a valid time.',
  MISSING_RECIPIENTS: 'At least one recipient is required.',
  INVALID_EMAIL: 'One or more email addresses are invalid.',
  MISSING_FORMAT: 'At least one export format must be selected.'
};

/**
 * Pre-defined report templates with default visualizations and parameters
 */
export const REPORT_TEMPLATES = {
  [ReportType.REVENUE_BY_PROGRAM]: {
    name: 'Revenue by Program',
    description: 'Analyze revenue distribution across different programs',
    category: ReportCategory.REVENUE,
    parameters: {
      ...DEFAULT_REPORT_PARAMETERS,
      groupBy: 'program'
    },
    visualizations: [
      {
        id: 'revByProgramBar',
        title: 'Revenue by Program',
        type: ChartType.BAR,
        dataKey: 'programRevenue',
        xAxis: { key: 'programName', label: 'Program' },
        yAxis: { key: 'revenue', label: 'Revenue ($)' },
        series: [{ key: 'revenue', label: 'Revenue', color: '#2196f3' }],
        options: { horizontal: false, stacked: false }
      },
      {
        id: 'revByProgramPie',
        title: 'Revenue Distribution',
        type: ChartType.PIE,
        dataKey: 'programRevenue',
        series: [{ key: 'revenue', label: 'Revenue' }],
        options: { showLegend: true, showLabels: true }
      },
      {
        id: 'revTrendByProgram',
        title: 'Revenue Trend by Program',
        type: ChartType.LINE,
        dataKey: 'revenueTrend',
        xAxis: { key: 'month', label: 'Month' },
        yAxis: { key: 'revenue', label: 'Revenue ($)' },
        series: [
          { key: 'program1', label: 'Program 1', color: '#2196f3' },
          { key: 'program2', label: 'Program 2', color: '#4caf50' },
          { key: 'program3', label: 'Program 3', color: '#ff9800' }
        ],
        options: { showPoints: true, curveType: 'monotone' }
      }
    ]
  },
  [ReportType.REVENUE_BY_PAYER]: {
    name: 'Revenue by Payer',
    description: 'Analyze revenue distribution across different payers',
    category: ReportCategory.REVENUE,
    parameters: {
      ...DEFAULT_REPORT_PARAMETERS,
      groupBy: 'payer'
    },
    visualizations: [
      {
        id: 'revByPayerBar',
        title: 'Revenue by Payer',
        type: ChartType.BAR,
        dataKey: 'payerRevenue',
        xAxis: { key: 'payerName', label: 'Payer' },
        yAxis: { key: 'revenue', label: 'Revenue ($)' },
        series: [{ key: 'revenue', label: 'Revenue', color: '#2196f3' }],
        options: { horizontal: false, stacked: false }
      },
      {
        id: 'revByPayerPie',
        title: 'Revenue Distribution',
        type: ChartType.PIE,
        dataKey: 'payerRevenue',
        series: [{ key: 'revenue', label: 'Revenue' }],
        options: { showLegend: true, showLabels: true }
      },
      {
        id: 'revTrendByPayer',
        title: 'Revenue Trend by Payer',
        type: ChartType.LINE,
        dataKey: 'revenueTrend',
        xAxis: { key: 'month', label: 'Month' },
        yAxis: { key: 'revenue', label: 'Revenue ($)' },
        series: [
          { key: 'payer1', label: 'Payer 1', color: '#2196f3' },
          { key: 'payer2', label: 'Payer 2', color: '#4caf50' },
          { key: 'payer3', label: 'Payer 3', color: '#ff9800' }
        ],
        options: { showPoints: true, curveType: 'monotone' }
      }
    ]
  },
  [ReportType.CLAIMS_STATUS]: {
    name: 'Claims Status',
    description: 'Analyze claims by status and track claim processing metrics',
    category: ReportCategory.CLAIMS,
    parameters: {
      ...DEFAULT_REPORT_PARAMETERS
    },
    visualizations: [
      {
        id: 'claimsByStatusPie',
        title: 'Claims by Status',
        type: ChartType.PIE,
        dataKey: 'claimsByStatus',
        series: [{ key: 'count', label: 'Claims' }],
        options: { showLegend: true, showLabels: true }
      },
      {
        id: 'claimsByStatusBar',
        title: 'Claims Amount by Status',
        type: ChartType.BAR,
        dataKey: 'claimsByStatus',
        xAxis: { key: 'status', label: 'Status' },
        yAxis: { key: 'amount', label: 'Amount ($)' },
        series: [{ key: 'amount', label: 'Amount', color: '#2196f3' }],
        options: { horizontal: false, stacked: false }
      },
      {
        id: 'claimsProcessingTime',
        title: 'Average Claim Processing Time by Payer',
        type: ChartType.BAR,
        dataKey: 'processingByPayer',
        xAxis: { key: 'payerName', label: 'Payer' },
        yAxis: { key: 'days', label: 'Days' },
        series: [{ key: 'days', label: 'Processing Days', color: '#ff9800' }],
        options: { horizontal: true, stacked: false }
      }
    ]
  },
  [ReportType.AGING_ACCOUNTS_RECEIVABLE]: {
    name: 'Aging Accounts Receivable',
    description: 'Analyze outstanding accounts receivable by aging buckets',
    category: ReportCategory.FINANCIAL,
    parameters: {
      ...DEFAULT_REPORT_PARAMETERS,
      asOfDate: null
    },
    visualizations: [
      {
        id: 'agingBucketsBar',
        title: 'Accounts Receivable Aging',
        type: ChartType.BAR,
        dataKey: 'agingBuckets',
        xAxis: { key: 'bucket', label: 'Aging Bucket' },
        yAxis: { key: 'amount', label: 'Amount ($)' },
        series: [{ key: 'amount', label: 'Amount', color: '#2196f3' }],
        options: { horizontal: false, stacked: false }
      },
      {
        id: 'agingByPayer',
        title: 'Aging by Payer',
        type: ChartType.BAR,
        dataKey: 'agingByPayer',
        xAxis: { key: 'payerName', label: 'Payer' },
        yAxis: { key: 'amount', label: 'Amount ($)' },
        series: [
          { key: 'current', label: 'Current', color: '#4caf50' },
          { key: 'days1To30', label: '1-30 Days', color: '#8bc34a' },
          { key: 'days31To60', label: '31-60 Days', color: '#ffeb3b' },
          { key: 'days61To90', label: '61-90 Days', color: '#ff9800' },
          { key: 'days91Plus', label: '91+ Days', color: '#f44336' }
        ],
        options: { horizontal: false, stacked: true }
      }
    ]
  },
  [ReportType.DENIAL_ANALYSIS]: {
    name: 'Denial Analysis',
    description: 'Analyze claim denials by reason and payer',
    category: ReportCategory.CLAIMS,
    parameters: {
      ...DEFAULT_REPORT_PARAMETERS
    },
    visualizations: [
      {
        id: 'denialsByReasonPie',
        title: 'Denials by Reason',
        type: ChartType.PIE,
        dataKey: 'denialsByReason',
        series: [{ key: 'count', label: 'Denials' }],
        options: { showLegend: true, showLabels: true }
      },
      {
        id: 'denialsByPayerBar',
        title: 'Denial Rate by Payer',
        type: ChartType.BAR,
        dataKey: 'denialsByPayer',
        xAxis: { key: 'payerName', label: 'Payer' },
        yAxis: { key: 'rate', label: 'Denial Rate (%)' },
        series: [{ key: 'rate', label: 'Denial Rate', color: '#f44336' }],
        options: { horizontal: false, stacked: false }
      },
      {
        id: 'denialTrend',
        title: 'Denial Trend',
        type: ChartType.LINE,
        dataKey: 'denialTrend',
        xAxis: { key: 'month', label: 'Month' },
        yAxis: { key: 'rate', label: 'Denial Rate (%)' },
        series: [{ key: 'rate', label: 'Denial Rate', color: '#f44336' }],
        options: { showPoints: true, curveType: 'monotone' }
      }
    ]
  },
  [ReportType.PAYER_PERFORMANCE]: {
    name: 'Payer Performance',
    description: 'Compare performance metrics across different payers',
    category: ReportCategory.CLAIMS,
    parameters: {
      ...DEFAULT_REPORT_PARAMETERS
    },
    visualizations: [
      {
        id: 'payerProcessingTime',
        title: 'Average Processing Time by Payer',
        type: ChartType.BAR,
        dataKey: 'payerPerformance',
        xAxis: { key: 'payerName', label: 'Payer' },
        yAxis: { key: 'processingDays', label: 'Days' },
        series: [{ key: 'processingDays', label: 'Avg. Processing Days', color: '#2196f3' }],
        options: { horizontal: true, stacked: false }
      },
      {
        id: 'payerPaymentRate',
        title: 'Payment Rate by Payer',
        type: ChartType.BAR,
        dataKey: 'payerPerformance',
        xAxis: { key: 'payerName', label: 'Payer' },
        yAxis: { key: 'paymentRate', label: 'Payment Rate (%)' },
        series: [{ key: 'paymentRate', label: 'Payment Rate', color: '#4caf50' }],
        options: { horizontal: false, stacked: false }
      },
      {
        id: 'payerDenialRate',
        title: 'Denial Rate by Payer',
        type: ChartType.BAR,
        dataKey: 'payerPerformance',
        xAxis: { key: 'payerName', label: 'Payer' },
        yAxis: { key: 'denialRate', label: 'Denial Rate (%)' },
        series: [{ key: 'denialRate', label: 'Denial Rate', color: '#f44336' }],
        options: { horizontal: false, stacked: false }
      }
    ]
  },
  [ReportType.SERVICE_UTILIZATION]: {
    name: 'Service Utilization',
    description: 'Analyze service delivery and utilization rates',
    category: ReportCategory.OPERATIONAL,
    parameters: {
      ...DEFAULT_REPORT_PARAMETERS
    },
    visualizations: [
      {
        id: 'utilizationByProgram',
        title: 'Utilization by Program',
        type: ChartType.BAR,
        dataKey: 'utilizationByProgram',
        xAxis: { key: 'programName', label: 'Program' },
        yAxis: { key: 'utilizationRate', label: 'Utilization Rate (%)' },
        series: [{ key: 'utilizationRate', label: 'Utilization Rate', color: '#2196f3' }],
        options: { horizontal: false, stacked: false }
      },
      {
        id: 'utilizationByService',
        title: 'Utilization by Service Type',
        type: ChartType.BAR,
        dataKey: 'utilizationByService',
        xAxis: { key: 'serviceTypeName', label: 'Service Type' },
        yAxis: { key: 'utilizationRate', label: 'Utilization Rate (%)' },
        series: [{ key: 'utilizationRate', label: 'Utilization Rate', color: '#4caf50' }],
        options: { horizontal: false, stacked: false }
      },
      {
        id: 'unitsDeliveredVsAuthorized',
        title: 'Units Delivered vs. Authorized',
        type: ChartType.BAR,
        dataKey: 'utilizationByProgram',
        xAxis: { key: 'programName', label: 'Program' },
        yAxis: { key: 'units', label: 'Units' },
        series: [
          { key: 'unitsAuthorized', label: 'Authorized', color: '#9e9e9e' },
          { key: 'unitsDelivered', label: 'Delivered', color: '#2196f3' }
        ],
        options: { horizontal: false, stacked: false }
      }
    ]
  }
};

/**
 * Number of days before generated reports expire
 */
export const REPORT_EXPIRATION_DAYS = 30;

/**
 * Maximum number of scheduled reports a user can create
 */
export const MAX_SCHEDULED_REPORTS_PER_USER = 25;

/**
 * Maximum number of reports that can be processed in a single batch
 */
export const REPORT_BATCH_SIZE_LIMIT = 10;

/**
 * Redux action types for report state management
 */
export const REPORT_REDUX_ACTIONS = {
  FETCH_REPORT_DEFINITIONS: 'reports/fetchReportDefinitions',
  FETCH_REPORT_DEFINITIONS_SUCCESS: 'reports/fetchReportDefinitionsSuccess',
  FETCH_REPORT_DEFINITIONS_FAILURE: 'reports/fetchReportDefinitionsFailure',
  
  FETCH_REPORT_INSTANCES: 'reports/fetchReportInstances',
  FETCH_REPORT_INSTANCES_SUCCESS: 'reports/fetchReportInstancesSuccess',
  FETCH_REPORT_INSTANCES_FAILURE: 'reports/fetchReportInstancesFailure',
  
  GENERATE_REPORT: 'reports/generateReport',
  GENERATE_REPORT_SUCCESS: 'reports/generateReportSuccess',
  GENERATE_REPORT_FAILURE: 'reports/generateReportFailure',
  
  FETCH_SCHEDULED_REPORTS: 'reports/fetchScheduledReports',
  FETCH_SCHEDULED_REPORTS_SUCCESS: 'reports/fetchScheduledReportsSuccess',
  FETCH_SCHEDULED_REPORTS_FAILURE: 'reports/fetchScheduledReportsFailure',
  
  SCHEDULE_REPORT: 'reports/scheduleReport',
  SCHEDULE_REPORT_SUCCESS: 'reports/scheduleReportSuccess',
  SCHEDULE_REPORT_FAILURE: 'reports/scheduleReportFailure',
  
  CLEAR_REPORT_ERRORS: 'reports/clearErrors',
  RESET_REPORT_STATE: 'reports/resetState'
};