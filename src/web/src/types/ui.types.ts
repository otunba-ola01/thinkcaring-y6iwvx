/**
 * Defines TypeScript interfaces, types, and enums for UI components used throughout the HCBS Revenue Management System frontend.
 * This file provides type definitions for component props, ensuring consistent prop patterns and type safety across the application's UI components.
 */

import { SxProps, Theme } from '@mui/material'; // v5.13.0
import { ReactNode } from 'react'; // v18.2.0
import {
  SortDirection,
  FilterOperator,
  PaginationParams,
  ISO8601Date,
  Severity,
  Size,
  ClaimStatus,
  PaymentStatus,
  ServiceStatus,
  SelectOption
} from './common.types';

/**
 * Interface for Card component props
 */
export interface CardProps {
  title?: string;
  subtitle?: string;
  children?: ReactNode;
  actions?: ReactNode;
  loading?: boolean;
  sx?: SxProps<Theme>;
  elevation?: number;
}

/**
 * Interface for MetricCard component props
 */
export interface MetricCardProps {
  title: string;
  value: string | number;
  trend?: number;
  trendLabel?: string;
  icon?: ReactNode;
  loading?: boolean;
  onClick?: () => void;
  sx?: SxProps<Theme>;
}

/**
 * Interface for StatusBadge component props
 */
export interface StatusBadgeProps {
  status: string;
  type: 'claim' | 'documentation' | 'billing' | 'reconciliation';
  size?: Size;
  sx?: SxProps<Theme>;
}

/**
 * Interface for ActionButton component props
 */
export interface ActionButtonProps {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  confirmText?: string;
  variant?: 'text' | 'outlined' | 'contained';
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
  size?: Size;
  disabled?: boolean;
  sx?: SxProps<Theme>;
}

/**
 * Interface for SearchInput component props
 */
export interface SearchInputProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onSearch: (value: string) => void;
  suggestions?: string[];
  loading?: boolean;
  debounceMs?: number;
  sx?: SxProps<Theme>;
}

/**
 * Interface for DateRangePicker component props
 */
export interface DateRangePickerProps {
  startDate: ISO8601Date | null;
  endDate: ISO8601Date | null;
  onChange: (startDate: ISO8601Date | null, endDate: ISO8601Date | null) => void;
  presets?: {
    label: string;
    value: string;
    range: {
      startDate: ISO8601Date | null;
      endDate: ISO8601Date | null;
    }
  }[];
  minDate?: ISO8601Date;
  maxDate?: ISO8601Date;
  disabled?: boolean;
  sx?: SxProps<Theme>;
}

/**
 * Interface for FileUploader component props
 */
export interface FileUploaderProps {
  acceptedTypes: string[];
  maxSize: number;
  onUpload: (files: File[]) => void;
  multiple?: boolean;
  label?: string;
  helperText?: string;
  loading?: boolean;
  error?: string;
  sx?: SxProps<Theme>;
}

/**
 * Enum for filter types used in FilterPanel component
 */
export enum FilterType {
  TEXT = 'text',
  SELECT = 'select',
  MULTI_SELECT = 'multiSelect',
  DATE = 'date',
  DATE_RANGE = 'dateRange',
  NUMBER = 'number',
  BOOLEAN = 'boolean'
}

/**
 * Interface for filter options used in FilterPanel component
 */
export interface FilterOption {
  value: string | number | boolean;
  label: string;
}

/**
 * Interface for filter configuration used in FilterPanel component
 */
export interface FilterConfig {
  id: string;
  label: string;
  type: FilterType;
  field: string;
  operator: FilterOperator;
  options?: FilterOption[];
  defaultValue?: any;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  width?: number | string;
}

/**
 * Interface for FilterPanel component props
 */
export interface FilterPanelProps {
  filters: FilterConfig[];
  onFilterChange: (filters: Record<string, any>) => void;
  initialValues?: Record<string, any>;
  collapsible?: boolean;
  loading?: boolean;
  sx?: SxProps<Theme>;
}

/**
 * Interface for AlertNotification component props
 */
export interface AlertNotificationProps {
  message: string;
  severity: Severity;
  onDismiss?: () => void;
  action?: ReactNode;
  autoHideDuration?: number;
  sx?: SxProps<Theme>;
}

/**
 * Interface for Pagination component props
 */
export interface PaginationProps {
  page: number;
  pageSize: number;
  totalItems: number;
  pageSizeOptions?: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  sx?: SxProps<Theme>;
}

/**
 * Interface for Stepper component props
 */
export interface StepperProps {
  steps: string[];
  activeStep: number;
  onStepChange?: (step: number) => void;
  orientation?: 'horizontal' | 'vertical';
  sx?: SxProps<Theme>;
}

/**
 * Interface for Tabs component props
 */
export interface TabsProps {
  tabs: { label: string; value: string; disabled?: boolean }[];
  activeTab: string;
  onChange: (value: string) => void;
  orientation?: 'horizontal' | 'vertical';
  sx?: SxProps<Theme>;
}

/**
 * Interface for ConfirmDialog component props
 */
export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  severity?: Severity;
}

/**
 * Interface for Skeleton component props
 */
export interface SkeletonProps {
  variant?: 'text' | 'rectangular' | 'circular' | 'rounded';
  width?: number | string;
  height?: number | string;
  animation?: 'pulse' | 'wave' | false;
  count?: number;
  sx?: SxProps<Theme>;
}

/**
 * Interface for EmptyState component props
 */
export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: ReactNode;
  action?: ReactNode;
  sx?: SxProps<Theme>;
}

/**
 * Interface for table column configuration used in DataTable component
 */
export interface TableColumn {
  field: string;
  headerName: string;
  width?: number;
  flex?: number;
  type?: 'string' | 'number' | 'date' | 'boolean' | 'currency' | 'status' | 'actions';
  sortable?: boolean;
  filterable?: boolean;
  hide?: boolean;
  valueFormatter?: (value: any) => string;
  renderCell?: (params: any) => ReactNode;
  statusType?: 'claim' | 'documentation' | 'billing' | 'reconciliation';
}

/**
 * Interface for DataTable component props
 */
export interface DataTableProps {
  columns: TableColumn[];
  data: any[];
  loading?: boolean;
  pagination?: PaginationParams;
  totalItems?: number;
  onPageChange?: (pagination: PaginationParams) => void;
  onSortChange?: (sortModel: { field: string; direction: SortDirection }[]) => void;
  onFilterChange?: (filterModel: { field: string; operator: FilterOperator; value: any }[]) => void;
  onRowClick?: (row: any) => void;
  selectable?: boolean;
  onSelectionChange?: (selectedRows: any[]) => void;
  sx?: SxProps<Theme>;
}

/**
 * Base interface for chart component props
 */
export interface ChartProps {
  data: any[];
  height?: number | string;
  width?: number | string;
  loading?: boolean;
  title?: string;
  sx?: SxProps<Theme>;
}

/**
 * Interface for BarChart component props extending ChartProps
 */
export interface BarChartProps extends ChartProps {
  xAxisDataKey: string;
  bars: { dataKey: string; name: string; color?: string }[];
  stacked?: boolean;
  horizontal?: boolean;
  legend?: boolean;
}

/**
 * Interface for LineChart component props extending ChartProps
 */
export interface LineChartProps extends ChartProps {
  xAxisDataKey: string;
  lines: { dataKey: string; name: string; color?: string }[];
  legend?: boolean;
  grid?: boolean;
}

/**
 * Interface for PieChart component props extending ChartProps
 */
export interface PieChartProps extends ChartProps {
  nameKey: string;
  dataKey: string;
  colorKey?: string;
  legend?: boolean;
  donut?: boolean;
}