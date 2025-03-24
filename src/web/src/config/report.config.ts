/**
 * Report Configuration
 * 
 * This file contains configurations and utility functions for the reporting functionality 
 * in the HCBS Revenue Management System. It centralizes report settings to ensure 
 * consistency across all reports and provides default parameters and visualizations
 * for each report type.
 */

import { 
  ReportType, 
  ReportCategory, 
  ReportFormat, 
  TimeFrame, 
  ComparisonType, 
  ChartType,
  ReportParameters,
  ReportVisualization,
  ReportDefinition
} from '../types/reports.types';
import { ThemeMode } from '../types/common.types';
import { getChartOptions, getChartTheme } from './chart.config';
import { formatDate, parseDate, DATE_RANGE_PRESETS } from './date.config';
import { merge } from 'lodash'; // 4.17.21
import { 
  addDays, 
  subDays, 
  startOfMonth, 
  endOfMonth, 
  startOfQuarter, 
  endOfQuarter, 
  startOfYear, 
  endOfYear 
} from 'date-fns'; // 2.30.0

/**
 * Default time frame used for reports
 */
export const DEFAULT_TIME_FRAME = TimeFrame.CURRENT_MONTH;

/**
 * Default comparison type used for reports
 */
export const DEFAULT_COMPARISON_TYPE = ComparisonType.PREVIOUS_PERIOD;

/**
 * Default report export formats
 */
export const DEFAULT_REPORT_FORMATS = [ReportFormat.PDF, ReportFormat.EXCEL];

/**
 * Human-readable labels for report types
 */
export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
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
export const REPORT_CATEGORY_LABELS: Record<ReportCategory, string> = {
  [ReportCategory.REVENUE]: 'Revenue',
  [ReportCategory.CLAIMS]: 'Claims',
  [ReportCategory.FINANCIAL]: 'Financial',
  [ReportCategory.OPERATIONAL]: 'Operational',
  [ReportCategory.COMPLIANCE]: 'Compliance'
};

/**
 * Human-readable labels for time frame options
 */
export const TIME_FRAME_LABELS: Record<TimeFrame, string> = {
  [TimeFrame.CURRENT_MONTH]: 'Current Month',
  [TimeFrame.PREVIOUS_MONTH]: 'Previous Month',
  [TimeFrame.CURRENT_QUARTER]: 'Current Quarter',
  [TimeFrame.PREVIOUS_QUARTER]: 'Previous Quarter',
  [TimeFrame.CURRENT_YEAR]: 'Current Year',
  [TimeFrame.PREVIOUS_YEAR]: 'Previous Year',
  [TimeFrame.LAST_30_DAYS]: 'Last 30 Days',
  [TimeFrame.LAST_60_DAYS]: 'Last 60 Days',
  [TimeFrame.LAST_90_DAYS]: 'Last 90 Days',
  [TimeFrame.CUSTOM]: 'Custom Range'
};

/**
 * Human-readable labels for comparison type options
 */
export const COMPARISON_TYPE_LABELS: Record<ComparisonType, string> = {
  [ComparisonType.PREVIOUS_PERIOD]: 'Previous Period',
  [ComparisonType.YEAR_OVER_YEAR]: 'Year Over Year',
  [ComparisonType.BUDGET]: 'Budget',
  [ComparisonType.NONE]: 'No Comparison'
};

/**
 * Human-readable labels for report format options
 */
export const REPORT_FORMAT_LABELS: Record<ReportFormat, string> = {
  [ReportFormat.PDF]: 'PDF',
  [ReportFormat.EXCEL]: 'Excel',
  [ReportFormat.CSV]: 'CSV',
  [ReportFormat.JSON]: 'JSON'
};

/**
 * Predefined report templates for each report type
 */
export const REPORT_TEMPLATES: Record<ReportType, object> = {
  [ReportType.REVENUE_BY_PROGRAM]: {
    title: 'Revenue by Program',
    description: 'Analyzes revenue breakdown by program with period over period comparison',
    category: ReportCategory.REVENUE,
    visualizations: [
      {
        type: ChartType.BAR,
        title: 'Revenue by Program',
        dataKey: 'revenueByProgram',
        xAxis: { key: 'programName', label: 'Program' },
        yAxis: { key: 'revenue', label: 'Revenue ($)' }
      },
      {
        type: ChartType.LINE,
        title: 'Revenue Trend by Program',
        dataKey: 'revenueByProgramTrend',
        xAxis: { key: 'month', label: 'Month' },
        yAxis: { key: 'revenue', label: 'Revenue ($)' }
      }
    ]
  },
  [ReportType.REVENUE_BY_PAYER]: {
    title: 'Revenue by Payer',
    description: 'Analyzes revenue breakdown by payer with period over period comparison',
    category: ReportCategory.REVENUE,
    visualizations: [
      {
        type: ChartType.PIE,
        title: 'Revenue Distribution by Payer',
        dataKey: 'revenueByPayer',
        series: [{ key: 'revenue', label: 'Revenue' }]
      },
      {
        type: ChartType.BAR,
        title: 'Revenue by Payer',
        dataKey: 'revenueByPayer',
        xAxis: { key: 'payerName', label: 'Payer' },
        yAxis: { key: 'revenue', label: 'Revenue ($)' }
      }
    ]
  },
  [ReportType.CLAIMS_STATUS]: {
    title: 'Claims Status',
    description: 'Analyzes claims by status with counts and amounts',
    category: ReportCategory.CLAIMS,
    visualizations: [
      {
        type: ChartType.PIE,
        title: 'Claims by Status',
        dataKey: 'claimStatusData',
        series: [{ key: 'count', label: 'Count' }]
      },
      {
        type: ChartType.BAR,
        title: 'Claim Amounts by Status',
        dataKey: 'claimStatusData',
        xAxis: { key: 'status', label: 'Status' },
        yAxis: { key: 'amount', label: 'Amount ($)' }
      }
    ]
  },
  [ReportType.AGING_ACCOUNTS_RECEIVABLE]: {
    title: 'Aging Accounts Receivable',
    description: 'Analyzes receivables by aging bucket with payer breakdown',
    category: ReportCategory.FINANCIAL,
    visualizations: [
      {
        type: ChartType.BAR,
        title: 'Aging Accounts Receivable',
        dataKey: 'agingReceivables',
        xAxis: { key: 'agingBucket', label: 'Aging Bucket' },
        yAxis: { key: 'amount', label: 'Amount ($)' }
      },
      {
        type: ChartType.BAR,
        title: 'Aging Receivables by Payer',
        dataKey: 'agingByPayer',
        xAxis: { key: 'payerName', label: 'Payer' },
        yAxis: { key: 'amount', label: 'Amount ($)' },
        series: [
          { key: 'current', label: 'Current' },
          { key: 'days1to30', label: '1-30 Days' },
          { key: 'days31to60', label: '31-60 Days' },
          { key: 'days61to90', label: '61-90 Days' },
          { key: 'days91Plus', label: '91+ Days' }
        ]
      }
    ]
  },
  [ReportType.DENIAL_ANALYSIS]: {
    title: 'Denial Analysis',
    description: 'Analyzes claim denials by reason with counts and amounts',
    category: ReportCategory.CLAIMS,
    visualizations: [
      {
        type: ChartType.PIE,
        title: 'Denials by Reason',
        dataKey: 'denialReasons',
        series: [{ key: 'count', label: 'Count' }]
      },
      {
        type: ChartType.BAR,
        title: 'Denial Amounts by Reason',
        dataKey: 'denialReasons',
        xAxis: { key: 'denialReason', label: 'Reason' },
        yAxis: { key: 'amount', label: 'Amount ($)' }
      },
      {
        type: ChartType.BAR,
        title: 'Denial Counts by Payer',
        dataKey: 'denialsByPayer',
        xAxis: { key: 'payerName', label: 'Payer' },
        yAxis: { key: 'count', label: 'Count' }
      }
    ]
  },
  [ReportType.PAYER_PERFORMANCE]: {
    title: 'Payer Performance',
    description: 'Analyzes payer performance metrics including processing time and payment rates',
    category: ReportCategory.CLAIMS,
    visualizations: [
      {
        type: ChartType.BAR,
        title: 'Average Processing Days by Payer',
        dataKey: 'payerPerformance',
        xAxis: { key: 'payerName', label: 'Payer' },
        yAxis: { key: 'averageProcessingDays', label: 'Days' }
      },
      {
        type: ChartType.BAR,
        title: 'Denial Rate by Payer',
        dataKey: 'payerPerformance',
        xAxis: { key: 'payerName', label: 'Payer' },
        yAxis: { key: 'denialRate', label: 'Denial Rate (%)' }
      }
    ]
  },
  [ReportType.SERVICE_UTILIZATION]: {
    title: 'Service Utilization',
    description: 'Analyzes service delivery and utilization against authorizations',
    category: ReportCategory.OPERATIONAL,
    visualizations: [
      {
        type: ChartType.BAR,
        title: 'Service Utilization by Program',
        dataKey: 'serviceUtilization',
        xAxis: { key: 'programName', label: 'Program' },
        yAxis: { key: 'utilizationPercentage', label: 'Utilization (%)' }
      },
      {
        type: ChartType.BAR,
        title: 'Units Authorized vs. Delivered by Service Type',
        dataKey: 'serviceUtilization',
        xAxis: { key: 'serviceTypeName', label: 'Service Type' },
        yAxis: { key: 'units', label: 'Units' },
        series: [
          { key: 'unitsAuthorized', label: 'Authorized' },
          { key: 'unitsDelivered', label: 'Delivered' }
        ]
      }
    ]
  },
  [ReportType.CUSTOM]: {
    title: 'Custom Report',
    description: 'Custom report with user-defined parameters and visualizations',
    category: ReportCategory.FINANCIAL,
    visualizations: []
  }
};

/**
 * Returns default parameters for a specific report type
 * 
 * @param reportType The type of report to get default parameters for
 * @returns Default parameters for the specified report type
 */
export const getDefaultReportParameters = (reportType: ReportType): ReportParameters => {
  // Create base parameters with defaults
  const now = new Date();
  const { startDate, endDate } = getDateRangeFromTimeFrame(DEFAULT_TIME_FRAME);
  
  const baseParameters: ReportParameters = {
    timeFrame: DEFAULT_TIME_FRAME,
    dateRange: {
      startDate,
      endDate
    },
    comparisonType: DEFAULT_COMPARISON_TYPE,
    comparisonDateRange: getComparisonDateRange(
      { startDate, endDate }, 
      DEFAULT_COMPARISON_TYPE
    ),
    programIds: [],
    payerIds: [],
    facilityIds: [],
    serviceTypeIds: [],
    asOfDate: formatDate(now),
    groupBy: '',
    sortBy: '',
    limit: 10,
    customParameters: {}
  };

  // Add report-specific default parameters
  switch (reportType) {
    case ReportType.REVENUE_BY_PROGRAM:
      return {
        ...baseParameters,
        groupBy: 'program',
        sortBy: 'revenue:desc'
      };
    
    case ReportType.REVENUE_BY_PAYER:
      return {
        ...baseParameters,
        groupBy: 'payer',
        sortBy: 'revenue:desc'
      };
    
    case ReportType.CLAIMS_STATUS:
      return {
        ...baseParameters,
        groupBy: 'status',
        sortBy: 'count:desc'
      };
    
    case ReportType.AGING_ACCOUNTS_RECEIVABLE:
      return {
        ...baseParameters,
        timeFrame: TimeFrame.CURRENT_MONTH,
        groupBy: 'agingBucket',
        sortBy: 'agingBucket:asc',
        comparisonType: ComparisonType.PREVIOUS_PERIOD,
        customParameters: {
          includePayers: true,
          includePrograms: true
        }
      };
    
    case ReportType.DENIAL_ANALYSIS:
      return {
        ...baseParameters,
        groupBy: 'denialReason',
        sortBy: 'count:desc',
        customParameters: {
          includePayerBreakdown: true
        }
      };
    
    case ReportType.PAYER_PERFORMANCE:
      return {
        ...baseParameters,
        groupBy: 'payer',
        sortBy: 'averageProcessingDays:asc',
        customParameters: {
          includeProcessingTime: true,
          includeDenialRate: true,
          includePaymentRate: true
        }
      };
    
    case ReportType.SERVICE_UTILIZATION:
      return {
        ...baseParameters,
        groupBy: 'serviceType',
        sortBy: 'utilizationPercentage:desc',
        customParameters: {
          includeProgramBreakdown: true,
          includeClientCounts: true
        }
      };
    
    case ReportType.CUSTOM:
    default:
      return baseParameters;
  }
};

/**
 * Returns default visualizations for a specific report type
 * 
 * @param reportType The type of report to get visualizations for
 * @param themeMode The current theme mode for styling
 * @returns Array of visualization configurations for the report
 */
export const getReportVisualizations = (
  reportType: ReportType,
  themeMode: ThemeMode = ThemeMode.LIGHT
): ReportVisualization[] => {
  // Get chart theme based on theme mode
  const theme = getChartTheme(themeMode === ThemeMode.DARK);
  
  // Get the template for this report type
  const template = REPORT_TEMPLATES[reportType];
  if (!template || !template.visualizations) {
    return [];
  }
  
  // Create visualizations with proper chart options based on theme
  return (template.visualizations as any[]).map((viz, index) => {
    const chartOptions = getChartOptions({ themeMode });
    
    // Configure specific chart options based on chart type
    let options = chartOptions;
    if (viz.type === ChartType.BAR) {
      options = merge({}, chartOptions, {
        scales: {
          x: {
            title: {
              display: !!viz.xAxis?.label,
              text: viz.xAxis?.label
            }
          },
          y: {
            title: {
              display: !!viz.yAxis?.label,
              text: viz.yAxis?.label
            },
            beginAtZero: true
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.dataset.label || '';
                const value = context.parsed.y;
                if (viz.yAxis?.key === 'revenue' || viz.yAxis?.key === 'amount') {
                  return `${label}: $${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                } 
                if (viz.yAxis?.key === 'denialRate' || viz.yAxis?.key === 'utilizationPercentage') {
                  return `${label}: ${value.toFixed(1)}%`;
                }
                return `${label}: ${value}`;
              }
            }
          }
        }
      });
    } else if (viz.type === ChartType.LINE) {
      options = merge({}, chartOptions, {
        scales: {
          x: {
            title: {
              display: !!viz.xAxis?.label,
              text: viz.xAxis?.label
            }
          },
          y: {
            title: {
              display: !!viz.yAxis?.label,
              text: viz.yAxis?.label
            },
            beginAtZero: true
          }
        },
        elements: {
          line: {
            tension: 0.4
          }
        }
      });
    } else if (viz.type === ChartType.PIE) {
      options = merge({}, chartOptions, {
        responsive: true,
        plugins: {
          legend: {
            position: 'right',
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const value = context.parsed;
                const total = context.chart.data.datasets[0].data.reduce((sum, val) => sum + val, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                
                if (viz.dataKey.includes('revenue') || viz.dataKey.includes('amount')) {
                  return `${label}: $${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${percentage}%)`;
                }
                return `${label}: ${value} (${percentage}%)`;
              }
            }
          }
        }
      });
    }
    
    // Create and return visualization config
    return {
      id: `${reportType}-viz-${index}`,
      title: viz.title,
      type: viz.type,
      dataKey: viz.dataKey,
      xAxis: viz.xAxis || { key: '', label: '' },
      yAxis: viz.yAxis || { key: '', label: '' },
      series: viz.series || [{ key: 'value', label: 'Value' }],
      options
    };
  });
};

/**
 * Creates a complete report definition for a specific report type
 * 
 * @param reportType The type of report to create
 * @param name The name of the report
 * @param parameters Custom parameters for the report (will be merged with defaults)
 * @param themeMode The current theme mode for styling visualizations
 * @returns Complete report definition
 */
export const getReportDefinition = (
  reportType: ReportType,
  name: string,
  parameters: Partial<ReportParameters>,
  themeMode: ThemeMode = ThemeMode.LIGHT
): ReportDefinition => {
  // Get default parameters and merge with provided parameters
  const defaultParams = getDefaultReportParameters(reportType);
  const mergedParams = merge({}, defaultParams, parameters);
  
  // Get visualizations for this report type
  const visualizations = getReportVisualizations(reportType, themeMode);
  
  // Get the template for this report type to determine category
  const template = REPORT_TEMPLATES[reportType];
  const category = template?.category || ReportCategory.FINANCIAL;
  
  // Create the report definition
  const reportDefinition: ReportDefinition = {
    id: '', // Will be assigned by API when saved
    name,
    description: template?.description || '',
    type: reportType,
    category,
    parameters: mergedParams,
    visualizations,
    isTemplate: false,
    isSystem: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: '' // Will be filled by API
  };
  
  return reportDefinition;
};

/**
 * Calculates date range based on a time frame selection
 * 
 * @param timeFrame The selected time frame
 * @param customDateRange Optional custom date range for CUSTOM time frame
 * @returns Date range with start and end dates
 */
export const getDateRangeFromTimeFrame = (
  timeFrame: TimeFrame,
  customDateRange?: { startDate: string | null; endDate: string | null }
): { startDate: string | null; endDate: string | null } => {
  // For custom time frame, return the provided custom date range
  if (timeFrame === TimeFrame.CUSTOM) {
    if (customDateRange?.startDate && customDateRange?.endDate) {
      return {
        startDate: customDateRange.startDate,
        endDate: customDateRange.endDate
      };
    }
    // If custom date range is not provided, return null values
    return { startDate: null, endDate: null };
  }
  
  const now = new Date();
  let startDate: Date;
  let endDate: Date = now;
  
  // Calculate start and end dates based on selected time frame
  switch (timeFrame) {
    case TimeFrame.CURRENT_MONTH:
      startDate = startOfMonth(now);
      endDate = endOfMonth(now);
      break;
      
    case TimeFrame.PREVIOUS_MONTH:
      const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      startDate = startOfMonth(prevMonth);
      endDate = endOfMonth(prevMonth);
      break;
      
    case TimeFrame.CURRENT_QUARTER:
      startDate = startOfQuarter(now);
      endDate = endOfQuarter(now);
      break;
      
    case TimeFrame.PREVIOUS_QUARTER:
      const prevQuarter = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      startDate = startOfQuarter(prevQuarter);
      endDate = endOfQuarter(prevQuarter);
      break;
      
    case TimeFrame.CURRENT_YEAR:
      startDate = startOfYear(now);
      endDate = endOfYear(now);
      break;
      
    case TimeFrame.PREVIOUS_YEAR:
      const prevYear = new Date(now.getFullYear() - 1, 0, 1);
      startDate = startOfYear(prevYear);
      endDate = endOfYear(prevYear);
      break;
      
    case TimeFrame.LAST_30_DAYS:
      startDate = subDays(now, 29); // 29 days ago + today = 30 days
      break;
      
    case TimeFrame.LAST_60_DAYS:
      startDate = subDays(now, 59); // 59 days ago + today = 60 days
      break;
      
    case TimeFrame.LAST_90_DAYS:
      startDate = subDays(now, 89); // 89 days ago + today = 90 days
      break;
      
    default:
      // Default to current month
      startDate = startOfMonth(now);
      endDate = endOfMonth(now);
  }
  
  return {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate)
  };
};

/**
 * Calculates comparison date range based on primary date range and comparison type
 * 
 * @param dateRange The primary date range to compare against
 * @param comparisonType The type of comparison to make
 * @returns Comparison date range with start and end dates
 */
export const getComparisonDateRange = (
  dateRange: { startDate: string | null; endDate: string | null },
  comparisonType: ComparisonType
): { startDate: string | null; endDate: string | null } => {
  // If comparison type is NONE or date range is incomplete, return null values
  if (
    comparisonType === ComparisonType.NONE ||
    !dateRange.startDate ||
    !dateRange.endDate
  ) {
    return { startDate: null, endDate: null };
  }
  
  // Parse start and end dates
  const startDate = parseDate(dateRange.startDate);
  const endDate = parseDate(dateRange.endDate);
  
  // If parsing failed, return null values
  if (!startDate || !endDate) {
    return { startDate: null, endDate: null };
  }
  
  // Calculate the number of days in the date range
  const dayDiff = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  switch (comparisonType) {
    case ComparisonType.PREVIOUS_PERIOD:
      // Shift date range back by the same number of days
      const prevPeriodStartDate = subDays(startDate, dayDiff + 1);
      const prevPeriodEndDate = subDays(endDate, dayDiff + 1);
      return {
        startDate: formatDate(prevPeriodStartDate),
        endDate: formatDate(prevPeriodEndDate)
      };
      
    case ComparisonType.YEAR_OVER_YEAR:
      // Shift date range back by 1 year (365 or 366 days)
      const oneYearAgoStartDate = new Date(startDate);
      oneYearAgoStartDate.setFullYear(oneYearAgoStartDate.getFullYear() - 1);
      
      const oneYearAgoEndDate = new Date(endDate);
      oneYearAgoEndDate.setFullYear(oneYearAgoEndDate.getFullYear() - 1);
      
      return {
        startDate: formatDate(oneYearAgoStartDate),
        endDate: formatDate(oneYearAgoEndDate)
      };
      
    case ComparisonType.BUDGET:
      // Budget comparison uses the same date range but compares to budget figures
      // The actual budget values will be retrieved separately
      return {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      };
      
    default:
      return { startDate: null, endDate: null };
  }
};