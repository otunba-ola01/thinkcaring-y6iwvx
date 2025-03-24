/**
 * Type definitions for chart components used throughout the HCBS Revenue Management System.
 * This file provides TypeScript interfaces and types for all chart-related data structures,
 * configuration options, and component props to ensure type safety and consistency.
 */

import { ChartOptions, ChartType, ChartData, ScriptableContext, TooltipItem } from 'chart.js'; // v4.3.0
import { ThemeMode, Size } from './common.types';

/**
 * Interface for a single data point in charts
 */
export interface ChartDataPoint {
  /** The label for this data point */
  label: string;
  /** The numeric value of this data point */
  value: number;
  /** Optional color override for this specific data point */
  color?: string;
  /** Optional unique identifier for this data point */
  id?: string | number;
}

/**
 * Interface for a data series in multi-series charts (line, area)
 */
export interface ChartSeries {
  /** The name of this data series */
  name: string;
  /** Array of data points with x,y coordinates */
  data: Array<{ x: string | number | Date; y: number }>;
  /** Optional color override for this specific series */
  color?: string;
  /** Optional unique identifier for this series */
  id?: string | number;
}

/**
 * Enum for chart axis types
 */
export enum ChartAxisType {
  CATEGORY = 'category',
  LINEAR = 'linear',
  TIME = 'time',
  LOGARITHMIC = 'logarithmic'
}

/**
 * Enum for chart legend positions
 */
export enum ChartLegendPosition {
  TOP = 'top',
  RIGHT = 'right',
  BOTTOM = 'bottom',
  LEFT = 'left'
}

/**
 * Interface for chart axis configuration
 */
export interface ChartAxisConfig {
  /** The type of axis */
  type: ChartAxisType;
  /** Optional title for the axis */
  title?: string;
  /** Optional minimum value for the axis */
  min?: number;
  /** Optional maximum value for the axis */
  max?: number;
  /** Optional format string for axis labels */
  format?: string;
  /** Whether to show grid lines */
  grid?: boolean;
  /** Whether axis should be stacked */
  stacked?: boolean;
}

/**
 * Interface for chart theme configuration
 */
export interface ChartTheme {
  /** Array of color values to use for data */
  colors: string[];
  /** Background color for the chart */
  backgroundColor: string;
  /** Color for text elements */
  textColor: string;
  /** Color for axes */
  axisColor: string;
  /** Color for grid lines */
  gridColor: string;
  /** Background color for tooltips */
  tooltipBackgroundColor: string;
  /** Text color for tooltips */
  tooltipTextColor: string;
}

/**
 * Base interface for props shared by all chart components
 */
export interface BaseChartProps {
  /** Chart title */
  title?: string;
  /** Chart subtitle */
  subtitle?: string;
  /** Size preset for the chart */
  size?: Size;
  /** Explicit height for the chart */
  height?: number | string;
  /** Margin configuration for the chart */
  margin?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
  /** Legend configuration */
  legend?: boolean | {
    position?: ChartLegendPosition;
  };
  /** Tooltip configuration */
  tooltip?: boolean | {
    format?: string;
  };
  /** Whether the chart is in loading state */
  loading?: boolean;
  /** Error message if chart failed to load */
  error?: string | null;
  /** Message to display when chart has no data */
  emptyMessage?: string;
  /** Theme mode for the chart */
  themeMode?: ThemeMode;
  /** Additional style overrides */
  sx?: Record<string, any>;
}

/**
 * Interface for bar chart component props
 */
export interface BarChartProps extends BaseChartProps {
  /** Data to display in the chart */
  data: ChartDataPoint[] | ChartSeries[];
  /** Whether to show bars horizontally */
  horizontal?: boolean;
  /** Whether to stack bars */
  stacked?: boolean;
  /** X-axis configuration */
  xAxis?: ChartAxisConfig;
  /** Y-axis configuration */
  yAxis?: ChartAxisConfig;
  /** Click handler for bar chart items */
  onClick?: (dataPoint: ChartDataPoint | { seriesName: string; x: string | number | Date; y: number }) => void;
}

/**
 * Interface for line chart component props
 */
export interface LineChartProps extends BaseChartProps {
  /** Data to display in the chart */
  data: ChartSeries[];
  /** X-axis configuration */
  xAxis?: ChartAxisConfig;
  /** Y-axis configuration */
  yAxis?: ChartAxisConfig;
  /** Whether to show data points */
  showPoints?: boolean;
  /** Whether to use curved lines */
  curve?: boolean;
  /** Whether to fill the area under the line */
  area?: boolean;
  /** Click handler for line chart points */
  onClick?: (point: { seriesName: string; x: string | number | Date; y: number }) => void;
}

/**
 * Interface for pie chart component props
 */
export interface PieChartProps extends BaseChartProps {
  /** Data to display in the chart */
  data: ChartDataPoint[];
  /** Whether to display as a donut chart */
  donut?: boolean;
  /** Inner radius for donut charts (0-1) */
  innerRadius?: number;
  /** Position of labels */
  labelPosition?: ChartLegendPosition;
  /** Whether to show percentage values */
  showPercentage?: boolean;
  /** Click handler for pie segments */
  onClick?: (dataPoint: ChartDataPoint) => void;
}

/**
 * Interface for area chart component props
 */
export interface AreaChartProps extends BaseChartProps {
  /** Data to display in the chart */
  data: ChartSeries[];
  /** X-axis configuration */
  xAxis?: ChartAxisConfig;
  /** Y-axis configuration */
  yAxis?: ChartAxisConfig;
  /** Whether to stack areas */
  stacked?: boolean;
  /** Whether to use curved lines */
  curve?: boolean;
  /** Whether to show data points */
  showPoints?: boolean;
  /** Click handler for area chart points */
  onClick?: (point: { seriesName: string; x: string | number | Date; y: number }) => void;
}

/**
 * Interface for metrics chart component props
 * Used for displaying KPI metrics with comparisons
 */
export interface MetricsChartProps extends BaseChartProps {
  /** Metric data with current, previous, and optional target values */
  data: {
    current: number;
    previous: number;
    target?: number;
  };
  /** Format for displaying the metric */
  format?: 'currency' | 'percentage' | 'number';
  /** Whether to show change from previous value */
  showChange?: boolean;
  /** Whether to show target indicator */
  showTarget?: boolean;
  /** Whether positive change is good (affects color coding) */
  positiveIsGood?: boolean;
}

/**
 * Interface for aging chart component props
 * Specialized chart for accounts receivable aging
 */
export interface AgingChartProps extends BaseChartProps {
  /** Aging data with buckets and amounts */
  data: {
    bucket: string;
    amount: number;
  }[];
  /** Whether to display total amount */
  showTotal?: boolean;
}

/**
 * Interface for status distribution chart component props
 * Specialized chart for status distributions like claim statuses
 */
export interface StatusDistributionChartProps extends BaseChartProps {
  /** Status distribution data */
  data: {
    status: string;
    count: number;
    color?: string;
  }[];
  /** Whether to show legend */
  showLegend?: boolean;
  /** Whether to show percentage values */
  showPercentage?: boolean;
}

/**
 * Type for custom chart tooltip formatter function
 */
export type ChartTooltipFormatter = (
  tooltipItems: TooltipItem<ChartType>[]
) => string | string[];

/**
 * Type for chart click event handler function
 */
export type ChartClickHandler = (event: any, elements: any[], chart: any) => void;