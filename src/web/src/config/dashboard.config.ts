/**
 * Configuration file for the dashboard components in the HCBS Revenue Management System.
 * Defines widget configurations, layout settings, chart options, and utility functions
 * for dashboard customization and responsiveness.
 */

import { merge } from 'lodash'; // 4.17.21
import { ChartOptions } from 'chart.js'; // 4.3.0
import { ThemeMode } from '../types/common.types';
import { 
  TimeFrame, 
  DashboardFilterConfig, 
  DashboardFilters 
} from '../types/dashboard.types';
import { getChartOptions, formatTooltipValue } from './chart.config';

// Dashboard grid breakpoints (pixels)
export const DASHBOARD_GRID_BREAKPOINTS = {
  xs: 0,    // Mobile phones
  sm: 600,  // Tablets 
  md: 960,  // Small laptops
  lg: 1280, // Desktops
  xl: 1920  // Large screens
};

// Dashboard grid columns at different breakpoints
export const DASHBOARD_GRID_COLUMNS = {
  xs: 1,  // 1 column on mobile
  sm: 2,  // 2 columns on tablets
  md: 4,  // 4 columns on small laptops
  lg: 12, // 12 columns on desktops
  xl: 12  // 12 columns on large screens
};

// Dashboard filter configurations
export const DASHBOARD_FILTER_CONFIGS: DashboardFilterConfig[] = [
  {
    id: 'timeFrame',
    label: 'Date Range',
    type: 'select',
    options: [
      { id: 'today', label: 'Today', value: TimeFrame.TODAY },
      { id: 'yesterday', label: 'Yesterday', value: TimeFrame.YESTERDAY },
      { id: 'last7Days', label: 'Last 7 Days', value: TimeFrame.LAST_7_DAYS },
      { id: 'last30Days', label: 'Last 30 Days', value: TimeFrame.LAST_30_DAYS },
      { id: 'thisMonth', label: 'This Month', value: TimeFrame.THIS_MONTH },
      { id: 'lastMonth', label: 'Last Month', value: TimeFrame.LAST_MONTH },
      { id: 'thisQuarter', label: 'This Quarter', value: TimeFrame.THIS_QUARTER },
      { id: 'lastQuarter', label: 'Last Quarter', value: TimeFrame.LAST_QUARTER },
      { id: 'thisYear', label: 'This Year', value: TimeFrame.THIS_YEAR },
      { id: 'lastYear', label: 'Last Year', value: TimeFrame.LAST_YEAR },
      { id: 'custom', label: 'Custom Range', value: TimeFrame.CUSTOM }
    ],
    defaultValue: TimeFrame.LAST_30_DAYS
  },
  {
    id: 'programId',
    label: 'Program',
    type: 'select',
    options: null, // Will be populated from API
    defaultValue: null
  },
  {
    id: 'payerId',
    label: 'Payer',
    type: 'select',
    options: null, // Will be populated from API
    defaultValue: null
  },
  {
    id: 'facilityId',
    label: 'Facility',
    type: 'select',
    options: null, // Will be populated from API
    defaultValue: null
  }
];

// Dashboard widget configurations
export const dashboardWidgetConfigs = {
  // Financial Overview Widget
  financialOverview: {
    id: 'financialOverview',
    title: 'Revenue',
    description: 'Key financial metrics for the selected time period',
    type: 'metrics',
    refreshInterval: 300000, // 5 minutes
    dataSource: '/api/dashboard/metrics/revenue',
    metrics: [
      {
        id: 'currentPeriodRevenue',
        label: 'Revenue',
        format: 'currency',
        compareField: 'previousPeriodRevenue',
        showComparison: true,
        positiveIsGood: true
      }
    ],
    chart: {
      type: 'line',
      dataKey: 'revenueTrend',
      xAxisKey: 'date',
      yAxisKey: 'amount',
      height: 120
    }
  },
  
  // Revenue Metrics Widget
  revenueMetrics: {
    id: 'revenueMetrics',
    title: 'Revenue Metrics',
    description: 'Detailed revenue metrics and trends',
    type: 'charts',
    refreshInterval: 300000, // 5 minutes
    dataSource: '/api/dashboard/metrics/revenue',
    charts: [
      {
        id: 'revenueTrend',
        type: 'line',
        title: 'Revenue Trend',
        dataKey: 'revenueTrend',
        xAxisKey: 'date',
        yAxisKey: 'amount',
        showComparison: true,
        comparisonKey: 'previousAmount',
        height: 240
      }
    ]
  },
  
  // Claims Status Widget
  claimsStatus: {
    id: 'claimsStatus',
    title: 'Claims Status',
    description: 'Current status of submitted claims',
    type: 'chart',
    refreshInterval: 300000, // 5 minutes
    dataSource: '/api/dashboard/metrics/claims',
    chart: {
      type: 'pie',
      dataKey: 'statusBreakdown',
      labelKey: 'status',
      valueKey: 'count',
      colorKey: 'status',
      height: 240,
      showLegend: true,
      legendPosition: 'bottom'
    },
    summary: [
      {
        id: 'cleanClaimRate',
        label: 'Clean Claim Rate',
        format: 'percentage',
        thresholds: {
          warning: 80,
          success: 90
        }
      },
      {
        id: 'totalClaims',
        label: 'Total Claims',
        format: 'number'
      }
    ]
  },
  
  // Alerts Widget
  alerts: {
    id: 'alerts',
    title: 'Alerts',
    description: 'Critical alerts requiring attention',
    type: 'alerts',
    refreshInterval: 60000, // 1 minute
    dataSource: '/api/dashboard/alerts',
    maxAlerts: 5,
    groupBySeverity: true,
    showActions: true
  },
  
  // Revenue by Program Widget
  revenueByProgram: {
    id: 'revenueByProgram',
    title: 'Revenue by Program',
    description: 'Revenue breakdown by program',
    type: 'chart',
    refreshInterval: 300000, // 5 minutes
    dataSource: '/api/dashboard/metrics/revenue',
    chart: {
      type: 'bar',
      dataKey: 'revenueByProgram',
      labelKey: 'programName',
      valueKey: 'amount',
      height: 240,
      horizontal: false,
      showLegend: false
    },
    summary: [
      {
        id: 'totalRevenue',
        label: 'Total Revenue',
        format: 'currency',
        calculate: (data) => data.reduce((sum, item) => sum + item.amount, 0)
      }
    ]
  },
  
  // Aging Receivables Widget
  agingReceivables: {
    id: 'agingReceivables',
    title: 'Aging Receivables',
    description: 'Accounts receivable aging breakdown',
    type: 'chart',
    refreshInterval: 300000, // 5 minutes
    dataSource: '/api/dashboard/metrics/aging',
    chart: {
      type: 'bar',
      dataKey: 'agingBreakdown',
      labelKey: 'range',
      valueKey: 'amount',
      height: 240,
      horizontal: true,
      showLegend: false
    },
    summary: [
      {
        id: 'totalReceivables',
        label: 'Total Receivables',
        format: 'currency',
        calculate: (data) => data.reduce((sum, item) => sum + item.amount, 0)
      }
    ]
  },
  
  // Recent Claims Widget
  recentClaims: {
    id: 'recentClaims',
    title: 'Recent Claims',
    description: 'Recently submitted and updated claims',
    type: 'table',
    refreshInterval: 300000, // 5 minutes
    dataSource: '/api/dashboard/claims/recent',
    columns: [
      { id: 'claimNumber', label: 'Claim #', sortable: true },
      { id: 'clientName', label: 'Client', sortable: true },
      { id: 'amount', label: 'Amount', format: 'currency', sortable: true },
      { id: 'status', label: 'Status', sortable: true },
      { id: 'payerName', label: 'Payer', sortable: true },
      { id: 'age', label: 'Age', format: 'days', sortable: true }
    ],
    pagination: {
      pageSize: 5,
      showPagination: false
    },
    actions: {
      viewClaim: {
        label: 'View',
        route: '/claims/:id'
      }
    }
  }
};

// Default dashboard configuration
export const defaultDashboardConfig = {
  // Default layout configuration
  layout: {
    // Default layout for large screens (lg and xl)
    lg: [
      { i: 'financialOverview', x: 0, y: 0, w: 4, h: 2 },
      { i: 'claimsStatus', x: 4, y: 0, w: 4, h: 2 },
      { i: 'alerts', x: 8, y: 0, w: 4, h: 2 },
      { i: 'revenueByProgram', x: 0, y: 2, w: 6, h: 3 },
      { i: 'agingReceivables', x: 6, y: 2, w: 6, h: 3 },
      { i: 'recentClaims', x: 0, y: 5, w: 12, h: 3 }
    ],
    // Default layout for medium screens (md)
    md: [
      { i: 'financialOverview', x: 0, y: 0, w: 2, h: 2 },
      { i: 'claimsStatus', x: 2, y: 0, w: 2, h: 2 },
      { i: 'alerts', x: 0, y: 2, w: 4, h: 2 },
      { i: 'revenueByProgram', x: 0, y: 4, w: 4, h: 3 },
      { i: 'agingReceivables', x: 0, y: 7, w: 4, h: 3 },
      { i: 'recentClaims', x: 0, y: 10, w: 4, h: 3 }
    ],
    // Default layout for small screens (sm)
    sm: [
      { i: 'financialOverview', x: 0, y: 0, w: 2, h: 2 },
      { i: 'claimsStatus', x: 0, y: 2, w: 2, h: 2 },
      { i: 'alerts', x: 0, y: 4, w: 2, h: 2 },
      { i: 'revenueByProgram', x: 0, y: 6, w: 2, h: 3 },
      { i: 'agingReceivables', x: 0, y: 9, w: 2, h: 3 },
      { i: 'recentClaims', x: 0, y: 12, w: 2, h: 3 }
    ],
    // Default layout for extra small screens (xs)
    xs: [
      { i: 'financialOverview', x: 0, y: 0, w: 1, h: 2 },
      { i: 'claimsStatus', x: 0, y: 2, w: 1, h: 2 },
      { i: 'alerts', x: 0, y: 4, w: 1, h: 2 },
      { i: 'revenueByProgram', x: 0, y: 6, w: 1, h: 3 },
      { i: 'agingReceivables', x: 0, y: 9, w: 1, h: 3 },
      { i: 'recentClaims', x: 0, y: 12, w: 1, h: 3 }
    ]
  },
  // Default widgets to display
  widgets: [
    'financialOverview',
    'claimsStatus',
    'alerts',
    'revenueByProgram',
    'agingReceivables',
    'recentClaims'
  ],
  // Default filters to display
  filters: [
    'timeFrame',
    'programId',
    'payerId'
  ]
};

// Dashboard chart options
export const dashboardChartOptions = {
  // Revenue trend chart options
  revenueTrend: getChartOptions({
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'month',
          tooltipFormat: 'MMM yyyy',
          displayFormats: {
            day: 'MMM d',
            week: 'MMM d',
            month: 'MMM yyyy'
          }
        },
        grid: {
          display: false
        }
      },
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => formatTooltipValue(value, 'currency')
        }
      }
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.parsed.y;
            return `Revenue: ${formatTooltipValue(value, 'currency')}`;
          }
        }
      }
    }
  }),
  
  // Revenue by program chart options
  revenueByProgram: getChartOptions({
    indexAxis: 'y',
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          callback: (value) => formatTooltipValue(value, 'currency')
        }
      },
      y: {
        grid: {
          display: false
        }
      }
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.parsed.x;
            return `Revenue: ${formatTooltipValue(value, 'currency')}`;
          }
        }
      }
    }
  }),
  
  // Revenue by payer chart options
  revenueByPayer: getChartOptions({
    indexAxis: 'y',
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          callback: (value) => formatTooltipValue(value, 'currency')
        }
      },
      y: {
        grid: {
          display: false
        }
      }
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.parsed.x;
            return `Revenue: ${formatTooltipValue(value, 'currency')}`;
          }
        }
      }
    }
  }),
  
  // Claim status chart options
  claimStatus: getChartOptions({
    plugins: {
      legend: {
        position: 'bottom',
        align: 'start'
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.parsed;
            const total = context.dataset.data.reduce((sum, val) => sum + val, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${context.label}: ${value} (${percentage}%)`;
          }
        }
      }
    }
  }),
  
  // Aging receivables chart options
  agingReceivables: getChartOptions({
    indexAxis: 'y',
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          callback: (value) => formatTooltipValue(value, 'currency')
        }
      },
      y: {
        grid: {
          display: false
        }
      }
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.parsed.x;
            return `Amount: ${formatTooltipValue(value, 'currency')}`;
          }
        }
      }
    }
  })
};

/**
 * Retrieves configuration for a specific dashboard widget type
 * 
 * @param widgetType - The type of widget to retrieve configuration for
 * @param overrides - Optional configuration overrides
 * @returns Widget configuration with applied overrides
 */
export const getDashboardWidgetConfig = (
  widgetType: string, 
  overrides: Record<string, any> = {}
): Record<string, any> => {
  const baseConfig = dashboardWidgetConfigs[widgetType];
  if (!baseConfig) {
    throw new Error(`Widget type "${widgetType}" not found in configuration`);
  }
  
  return merge({}, baseConfig, overrides);
};

/**
 * Returns the default dashboard layout configuration
 * 
 * @returns Default dashboard layout configuration
 */
export const getDefaultDashboardLayout = () => {
  return defaultDashboardConfig.layout;
};

/**
 * Generates responsive dashboard layout based on screen width
 * 
 * @param width - The current screen width
 * @returns Responsive dashboard layout configuration
 */
export const getResponsiveDashboardLayout = (width: number) => {
  // Determine which breakpoint the current width falls into
  let breakpoint = 'lg';
  
  if (width < DASHBOARD_GRID_BREAKPOINTS.sm) {
    breakpoint = 'xs';
  } else if (width < DASHBOARD_GRID_BREAKPOINTS.md) {
    breakpoint = 'sm';
  } else if (width < DASHBOARD_GRID_BREAKPOINTS.lg) {
    breakpoint = 'md';
  } else if (width < DASHBOARD_GRID_BREAKPOINTS.xl) {
    breakpoint = 'lg';
  } else {
    breakpoint = 'xl';
  }
  
  // Return the layout for the determined breakpoint
  return defaultDashboardConfig.layout[breakpoint] || defaultDashboardConfig.layout.lg;
};

/**
 * Returns dashboard configuration with applied filters
 * 
 * @param filters - The filters to apply to the dashboard
 * @returns Filtered dashboard configuration
 */
export const getFilteredDashboardConfig = (filters: DashboardFilters): Record<string, any> => {
  // Start with the default dashboard configuration
  const filteredConfig = merge({}, defaultDashboardConfig);
  
  // Apply filters to each widget's data source
  filteredConfig.widgets = filteredConfig.widgets.map(widgetId => {
    const widget = getDashboardWidgetConfig(widgetId);
    
    // Update widget data source to include filters
    widget.filters = filters;
    
    // Update widget titles to reflect applied filters if necessary
    if (filters.programId && widget.id === 'revenueByProgram') {
      // This would be expanded to look up the program name from the programId
      widget.title = 'Revenue by Program (Filtered)';
    }
    
    return widget;
  });
  
  return filteredConfig;
};