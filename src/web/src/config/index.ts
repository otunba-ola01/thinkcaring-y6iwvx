/**
 * Central configuration index file that exports all configuration modules for the HCBS Revenue Management System web application.
 * This file serves as a single entry point for accessing various configuration settings throughout the application,
 * including API, authentication, date formatting, theming, UI components, reporting, and dashboard configurations.
 */

import {
  apiConfig,
  getApiBaseUrl,
  getApiHeaders,
} from './api.config';

import {
  authConfig,
  passwordPolicyConfig,
  cookieConfig,
} from './auth.config';

import {
  DEFAULT_DATE_FORMAT,
  API_DATE_FORMAT,
  DISPLAY_DATE_FORMAT,
  SHORT_DATE_FORMAT,
  LONG_DATE_FORMAT,
  DATETIME_FORMAT,
  TIME_FORMAT,
  FISCAL_YEAR_START_MONTH,
  DATE_LOCALE,
  DATE_PICKER_CONFIG,
  DATE_RANGE_PRESETS,
  formatDate,
  parseDate,
  isValidDate,
} from './date.config';

import {
  getDefaultThemeConfig,
  getThemeConfig,
  createAppTheme,
  getSystemThemeMode,
  resolveThemeMode,
  defaultThemeConfig,
  breakpoints,
  spacing,
} from './theme.config';

import {
  DEFAULT_TABLE_SETTINGS,
  DEFAULT_COLUMN_CONFIG,
  SORT_DIRECTION_MAPPING,
  FILTER_OPERATOR_MAPPING,
  DATE_COLUMN_FORMAT,
  CURRENCY_COLUMN_FORMAT,
  PERCENTAGE_COLUMN_FORMAT,
  TABLE_DENSITY_HEIGHT,
} from './table.config';

import {
  CHART_COLORS,
  LIGHT_THEME,
  DARK_THEME,
  getChartOptions,
  getChartTheme,
  formatTooltipValue,
  createTooltipFormatter,
  applyAxisConfig,
  barChartOptions,
  lineChartOptions,
  pieChartOptions,
  areaChartOptions,
} from './chart.config';

import {
  SeoConfig,
  OpenGraphConfig,
  TwitterConfig,
  defaultSeoConfig,
  getSeoConfig,
} from './seo.config';

import {
  NavigationConfig,
  NavigationItem,
} from './navigation.config';

import {
  validationConfig,
  validationPatterns,
  validationMessages,
  getValidationMessage,
  createValidationSchema,
  zodValidators,
} from './validation.config';

import {
  DEFAULT_TIME_FRAME,
  DEFAULT_COMPARISON_TYPE,
  DEFAULT_REPORT_FORMATS,
  REPORT_TYPE_LABELS,
  REPORT_CATEGORY_LABELS,
  TIME_FRAME_LABELS,
  COMPARISON_TYPE_LABELS,
  REPORT_FORMAT_LABELS,
  REPORT_TEMPLATES,
  getDefaultReportParameters,
  getReportVisualizations,
  getReportDefinition,
  getDateRangeFromTimeFrame,
  getComparisonDateRange,
} from './report.config';

import {
  DASHBOARD_GRID_BREAKPOINTS,
  DASHBOARD_GRID_COLUMNS,
  DASHBOARD_FILTER_CONFIGS,
  dashboardWidgetConfigs,
  defaultDashboardConfig,
  dashboardChartOptions,
  getDashboardWidgetConfig,
  getDefaultDashboardLayout,
  getResponsiveDashboardLayout,
  getFilteredDashboardConfig,
} from './dashboard.config';

/**
 * API configuration settings
 */
export { apiConfig };

/**
 * Function to get API base URL
 */
export { getApiBaseUrl };

/**
 * Function to get API headers
 */
export { getApiHeaders };

/**
 * Authentication configuration settings
 */
export { authConfig };

/**
 * Password policy configuration
 */
export { passwordPolicyConfig };

/**
 * Cookie configuration settings
 */
export { cookieConfig };

/**
 * Date configuration settings and utility functions
 */
export const dateConfig = {
  DEFAULT_DATE_FORMAT,
  API_DATE_FORMAT,
  DISPLAY_DATE_FORMAT,
  SHORT_DATE_FORMAT,
  LONG_DATE_FORMAT,
  DATETIME_FORMAT,
  TIME_FORMAT,
  FISCAL_YEAR_START_MONTH,
  DATE_LOCALE,
  DATE_PICKER_CONFIG,
  DATE_RANGE_PRESETS,
  formatDate,
  parseDate,
  isValidDate,
};

/**
 * Theme configuration settings and utility functions
 */
export const themeConfig = {
  getDefaultThemeConfig,
  getThemeConfig,
  createAppTheme,
  getSystemThemeMode,
  resolveThemeMode,
  defaultThemeConfig,
  breakpoints,
  spacing,
};

/**
 * Table configuration settings
 */
export const tableConfig = {
  DEFAULT_TABLE_SETTINGS,
  DEFAULT_COLUMN_CONFIG,
  SORT_DIRECTION_MAPPING,
  FILTER_OPERATOR_MAPPING,
  DATE_COLUMN_FORMAT,
  CURRENCY_COLUMN_FORMAT,
  PERCENTAGE_COLUMN_FORMAT,
  TABLE_DENSITY_HEIGHT,
};

/**
 * Chart configuration settings and utility functions
 */
export const chartConfig = {
  CHART_COLORS,
  LIGHT_THEME,
  DARK_THEME,
  getChartOptions,
  getChartTheme,
  formatTooltipValue,
  createTooltipFormatter,
  applyAxisConfig,
  barChartOptions,
  lineChartOptions,
  pieChartOptions,
  areaChartOptions,
};

/**
 * SEO configuration settings and utility functions
 */
export const seoConfig = {
  SeoConfig,
  OpenGraphConfig,
  TwitterConfig,
  defaultSeoConfig,
  getSeoConfig,
};

/**
 * Navigation configuration settings
 */
export const navigationConfig = {
    NavigationConfig,
    NavigationItem,
    items: NavigationConfig.items,
    secondaryItems: NavigationConfig.secondaryItems,
    mobileItems: NavigationConfig.mobileItems,
    icons: NavigationConfig.icons,
    getItemByPath: NavigationConfig.getItemByPath,
    getItemById: NavigationConfig.getItemById,
    filterByPermission: NavigationConfig.filterByPermission,
    getBreadcrumbs: NavigationConfig.getBreadcrumbs,
    getActiveItem: NavigationConfig.getActiveItem,
};

/**
 * Form validation configuration settings and utility functions
 */
export const validationConfigF = {
  validationConfig,
  validationPatterns,
  validationMessages,
  getValidationMessage,
  createValidationSchema,
  zodValidators,
};

/**
 * Report configuration settings and utility functions
 */
export const reportConfig = {
  DEFAULT_TIME_FRAME,
  DEFAULT_COMPARISON_TYPE,
  DEFAULT_REPORT_FORMATS,
  REPORT_TYPE_LABELS,
  REPORT_CATEGORY_LABELS,
  TIME_FRAME_LABELS,
  COMPARISON_TYPE_LABELS,
  REPORT_FORMAT_LABELS,
  REPORT_TEMPLATES,
  getDefaultReportParameters,
  getReportVisualizations,
  getReportDefinition,
  getDateRangeFromTimeFrame,
  getComparisonDateRange,
};

/**
 * Dashboard configuration settings and utility functions
 */
export const dashboardConfig = {
  DASHBOARD_GRID_BREAKPOINTS,
  DASHBOARD_GRID_COLUMNS,
  DASHBOARD_FILTER_CONFIGS,
  dashboardWidgetConfigs,
  defaultDashboardConfig,
  dashboardChartOptions,
  getDashboardWidgetConfig,
  getDefaultDashboardLayout,
  getResponsiveDashboardLayout,
  getFilteredDashboardConfig,
};