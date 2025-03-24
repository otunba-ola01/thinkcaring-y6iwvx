/**
 * Table Configuration
 * 
 * This file defines configuration settings and default values for data tables
 * throughout the HCBS Revenue Management System.
 * 
 * It centralizes table-related configurations such as default pagination settings,
 * sort direction mappings, filter operator mappings, and column configurations
 * to ensure consistent behavior across all data tables in the application.
 * 
 * @version 1.0.0
 */

import { SortDirection, FilterOperator } from '../types/common.types';
import { PAGINATION_OPTIONS, DEFAULT_PAGE_SIZE } from '../constants/ui.constants';
import { GridSortDirection, GridFilterOperator } from '@mui/x-data-grid';

/**
 * Default settings for all data tables in the application
 */
export const DEFAULT_TABLE_SETTINGS = {
  pagination: {
    page: 0,
    pageSize: DEFAULT_PAGE_SIZE,
    pageSizeOptions: PAGINATION_OPTIONS
  },
  density: 'standard',
  autoHeight: false,
  checkboxSelection: false,
  disableSelectionOnClick: false,
  disableColumnMenu: false,
  disableColumnFilter: false,
  disableColumnSelector: false,
  disableDensitySelector: false,
  disableExtendRowFullWidth: false,
  showCellRightBorder: false,
  showColumnRightBorder: true,
  headerHeight: 56,
  rowHeight: 48
};

/**
 * Default configuration for table columns
 */
export const DEFAULT_COLUMN_CONFIG = {
  width: 150,
  minWidth: 80,
  flex: 1,
  sortable: true,
  filterable: true,
  editable: false,
  resizable: true,
  hideable: true,
  align: 'left',
  headerAlign: 'left'
};

/**
 * Maps application sort directions to Material UI DataGrid sort directions
 */
export const SORT_DIRECTION_MAPPING = {
  [SortDirection.ASC]: GridSortDirection.asc,
  [SortDirection.DESC]: GridSortDirection.desc
};

/**
 * Maps application filter operators to Material UI DataGrid filter operators
 */
export const FILTER_OPERATOR_MAPPING = {
  [FilterOperator.EQUALS]: GridFilterOperator.equals,
  [FilterOperator.NOT_EQUALS]: GridFilterOperator.notEquals,
  [FilterOperator.CONTAINS]: GridFilterOperator.contains,
  [FilterOperator.STARTS_WITH]: GridFilterOperator.startsWith,
  [FilterOperator.ENDS_WITH]: GridFilterOperator.endsWith,
  [FilterOperator.GREATER_THAN]: GridFilterOperator.greaterThan,
  [FilterOperator.GREATER_THAN_OR_EQUALS]: GridFilterOperator.greaterThanOrEqual,
  [FilterOperator.LESS_THAN]: GridFilterOperator.lessThan,
  [FilterOperator.LESS_THAN_OR_EQUALS]: GridFilterOperator.lessThanOrEqual,
  [FilterOperator.IS_NULL]: GridFilterOperator.isEmpty,
  [FilterOperator.IS_NOT_NULL]: GridFilterOperator.isNotEmpty,
  [FilterOperator.IN]: GridFilterOperator.isAnyOf,
  [FilterOperator.NOT_IN]: GridFilterOperator.isNotAnyOf,
  [FilterOperator.BETWEEN]: GridFilterOperator.between
};

/**
 * Format settings for date columns
 */
export const DATE_COLUMN_FORMAT = {
  type: 'date',
  valueFormatter: (value) => value ? new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '',
  width: 120
};

/**
 * Format settings for currency columns
 */
export const CURRENCY_COLUMN_FORMAT = {
  type: 'number',
  valueFormatter: (value) => value !== undefined && value !== null ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value) : '',
  align: 'right',
  headerAlign: 'right',
  width: 120
};

/**
 * Format settings for percentage columns
 */
export const PERCENTAGE_COLUMN_FORMAT = {
  type: 'number',
  valueFormatter: (value) => value !== undefined && value !== null ? `${(value * 100).toFixed(2)}%` : '',
  align: 'right',
  headerAlign: 'right',
  width: 100
};

/**
 * Row height values for different table density settings
 */
export const TABLE_DENSITY_HEIGHT = {
  compact: 36,
  standard: 48,
  comfortable: 60
};

/**
 * Default formatters for different column types
 */
export const COLUMN_TYPE_FORMATTERS = {
  string: {
    valueFormatter: (value) => value || ''
  },
  number: {
    valueFormatter: (value) => value !== undefined && value !== null ? value.toLocaleString() : '',
    align: 'right',
    headerAlign: 'right'
  },
  boolean: {
    valueFormatter: (value) => value ? 'Yes' : 'No'
  },
  date: DATE_COLUMN_FORMAT,
  currency: CURRENCY_COLUMN_FORMAT,
  percentage: PERCENTAGE_COLUMN_FORMAT
};

/**
 * Props for the loading overlay in tables
 */
export const TABLE_LOADING_OVERLAY_PROPS = {
  sx: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1
  }
};

/**
 * Props for the no rows overlay in tables
 */
export const TABLE_NO_ROWS_OVERLAY_PROPS = {
  sx: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3
  }
};

/**
 * Props for the table toolbar
 */
export const TABLE_TOOLBAR_PROPS = {
  sx: {
    padding: 1,
    display: 'flex',
    justifyContent: 'space-between'
  }
};