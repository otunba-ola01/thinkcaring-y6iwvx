/**
 * Provides configuration for chart components used throughout the HCBS Revenue Management System.
 * This file defines default chart options, theme-aware styling, and utility functions for 
 * creating consistent chart configurations across the application.
 */

import { merge } from 'lodash'; // 4.17.21
import { ChartOptions, ScriptableContext, TooltipItem, ChartType } from 'chart.js'; // 4.3.0
import { ThemeMode } from '../types/common.types';
import { ChartTheme, ChartAxisConfig, ChartLegendPosition } from '../types/chart.types';

// Define chart color palettes
export const CHART_COLORS = {
  // Primary color palette for most charts
  PRIMARY: [
    '#0F52BA', // Primary blue
    '#4CAF50', // Green
    '#FF6B35', // Orange
    '#8E44AD', // Purple
    '#3498DB', // Light blue
    '#F1C40F', // Yellow
    '#E74C3C', // Red
    '#16A085', // Teal
    '#D35400', // Dark orange
    '#2C3E50'  // Dark blue
  ],
  // Status-specific colors for status charts
  STATUS: {
    draft: '#CCCCCC',        // Gray
    validated: '#64B5F6',    // Light blue
    submitted: '#42A5F5',    // Blue
    acknowledged: '#2196F3', // Medium blue
    pending: '#1976D2',      // Dark blue
    paid: '#4CAF50',         // Green
    denied: '#F44336',       // Red
    appealed: '#FF9800',     // Orange
    partialPaid: '#8BC34A'   // Light green
  },
  // Trend colors for showing increases/decreases
  TREND: {
    positive: '#4CAF50', // Green for positive trends
    negative: '#F44336', // Red for negative trends
    neutral: '#9E9E9E'   // Gray for neutral/no change
  }
};

// Define light theme for charts
export const LIGHT_THEME: ChartTheme = {
  colors: CHART_COLORS.PRIMARY,
  backgroundColor: '#FFFFFF',
  textColor: '#333333',
  axisColor: '#666666',
  gridColor: '#EEEEEE',
  tooltipBackgroundColor: '#FFFFFF',
  tooltipTextColor: '#333333'
};

// Define dark theme for charts
export const DARK_THEME: ChartTheme = {
  colors: CHART_COLORS.PRIMARY,
  backgroundColor: '#1E1E1E',
  textColor: '#E0E0E0',
  axisColor: '#BBBBBB',
  gridColor: '#333333',
  tooltipBackgroundColor: '#2C2C2C',
  tooltipTextColor: '#E0E0E0'
};

/**
 * Returns theme-specific colors and styling for charts
 * @param isDarkMode Boolean indicating whether dark mode is active
 * @returns Theme configuration for charts
 */
export const getChartTheme = (isDarkMode: boolean): ChartTheme => {
  return isDarkMode ? DARK_THEME : LIGHT_THEME;
};

/**
 * Formats tooltip values based on the specified format
 * @param value The numeric value to format
 * @param format The format to apply ('currency', 'percentage', 'number')
 * @returns Formatted value string
 */
export const formatTooltipValue = (value: number, format?: string): string => {
  if (!format) return value.toString();
  
  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(value);
    
    case 'percentage':
      // If value is greater than 1, assume it's already in percentage form (e.g., 25 for 25%)
      // Otherwise, assume it's in decimal form (e.g., 0.25 for 25%)
      const percentValue = value > 1 ? value / 100 : value;
      return new Intl.NumberFormat('en-US', {
        style: 'percent',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
      }).format(percentValue);
    
    case 'number':
    default:
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }).format(value);
  }
};

/**
 * Creates a tooltip formatter function for Chart.js
 * @param format The format to apply to values
 * @returns Tooltip formatter function
 */
export const createTooltipFormatter = (format?: string) => {
  return (tooltipItem: TooltipItem<ChartType>) => {
    // Different chart types have different parsed structures
    let value: number;
    if (tooltipItem.parsed.y !== undefined) {
      // For cartesian charts (bar, line, etc.)
      value = tooltipItem.parsed.y;
    } else if (typeof tooltipItem.parsed === 'number') {
      // For pie/doughnut charts
      value = tooltipItem.parsed;
    } else {
      // Fallback
      value = 0;
    }
    return formatTooltipValue(value, format);
  };
};

/**
 * Applies axis configuration to chart options
 * @param options Chart.js options object
 * @param xAxisConfig X-axis configuration
 * @param yAxisConfig Y-axis configuration
 * @param isDarkMode Boolean indicating whether dark mode is active
 * @returns Updated chart options
 */
export const applyAxisConfig = (
  options: ChartOptions,
  xAxisConfig?: ChartAxisConfig,
  yAxisConfig?: ChartAxisConfig,
  isDarkMode: boolean = false
): ChartOptions => {
  const theme = getChartTheme(isDarkMode);
  
  // Create a deep clone of the options to avoid mutating the original
  const updatedOptions = merge({}, options);
  
  // Ensure scales object exists
  if (!updatedOptions.scales) {
    updatedOptions.scales = {};
  }
  
  // Configure x-axis if provided
  if (xAxisConfig) {
    updatedOptions.scales.x = {
      type: xAxisConfig.type,
      title: {
        display: !!xAxisConfig.title,
        text: xAxisConfig.title,
        color: theme.textColor
      },
      min: xAxisConfig.min,
      max: xAxisConfig.max,
      stacked: xAxisConfig.stacked,
      grid: {
        display: xAxisConfig.grid !== false,
        color: theme.gridColor,
        borderColor: theme.axisColor
      },
      ticks: {
        color: theme.textColor
      }
    };
  }
  
  // Configure y-axis if provided
  if (yAxisConfig) {
    updatedOptions.scales.y = {
      type: yAxisConfig.type,
      title: {
        display: !!yAxisConfig.title,
        text: yAxisConfig.title,
        color: theme.textColor
      },
      min: yAxisConfig.min,
      max: yAxisConfig.max,
      stacked: yAxisConfig.stacked,
      grid: {
        display: yAxisConfig.grid !== false,
        color: theme.gridColor,
        borderColor: theme.axisColor
      },
      ticks: {
        color: theme.textColor,
        callback: yAxisConfig.format ? 
          (value: number) => formatTooltipValue(value, yAxisConfig.format) : 
          undefined
      }
    };
  }
  
  return updatedOptions;
};

/**
 * Creates base chart options with theme-aware styling
 * @param options Additional options or overrides
 * @returns Chart.js compatible options object
 */
export const getChartOptions = (options?: {
  themeMode?: ThemeMode;
  [key: string]: any;
}): ChartOptions => {
  // Determine if dark mode is active
  const themeMode = options?.themeMode || ThemeMode.LIGHT;
  const isDarkMode = themeMode === ThemeMode.DARK;
  
  // Get theme-specific styling
  const theme = getChartTheme(isDarkMode);
  
  // Create base options
  const baseOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false
    },
    color: theme.colors,
    font: {
      family: "'Inter', 'Helvetica', 'Arial', sans-serif",
      size: 12,
      weight: 'normal'
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: theme.textColor,
          usePointStyle: true,
          padding: 16
        }
      },
      tooltip: {
        backgroundColor: theme.tooltipBackgroundColor,
        titleColor: theme.tooltipTextColor,
        bodyColor: theme.tooltipTextColor,
        borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 4,
        usePointStyle: true
      }
    },
    animation: {
      duration: 1000,
      easing: 'easeOutQuart'
    }
  };
  
  // Merge with any provided options
  return options ? merge({}, baseOptions, options) : baseOptions;
};

/**
 * Default options for bar charts
 */
export const barChartOptions = (
  themeMode: ThemeMode = ThemeMode.LIGHT,
  isHorizontal: boolean = false
): ChartOptions => {
  const isDarkMode = themeMode === ThemeMode.DARK;
  const theme = getChartTheme(isDarkMode);
  
  return getChartOptions({
    themeMode,
    indexAxis: isHorizontal ? 'y' : 'x',
    elements: {
      bar: {
        borderWidth: 0,
        borderRadius: 4
      }
    },
    scales: {
      [isHorizontal ? 'y' : 'x']: {
        grid: {
          display: false
        },
        ticks: {
          color: theme.textColor
        }
      },
      [isHorizontal ? 'x' : 'y']: {
        grid: {
          color: theme.gridColor
        },
        ticks: {
          color: theme.textColor
        }
      }
    }
  });
};

/**
 * Default options for line charts
 */
export const lineChartOptions = (
  themeMode: ThemeMode = ThemeMode.LIGHT
): ChartOptions => {
  const isDarkMode = themeMode === ThemeMode.DARK;
  const theme = getChartTheme(isDarkMode);
  
  return getChartOptions({
    themeMode,
    elements: {
      line: {
        tension: 0.4, // Slightly curved lines
        borderWidth: 2,
        fill: false
      },
      point: {
        radius: 3,
        hoverRadius: 5,
        borderWidth: 2,
        backgroundColor: theme.backgroundColor
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: theme.textColor
        }
      },
      y: {
        grid: {
          color: theme.gridColor
        },
        ticks: {
          color: theme.textColor
        },
        beginAtZero: true
      }
    }
  });
};

/**
 * Default options for pie charts
 */
export const pieChartOptions = (
  themeMode: ThemeMode = ThemeMode.LIGHT,
  isDonut: boolean = false
): ChartOptions => {
  return getChartOptions({
    themeMode,
    cutout: isDonut ? '60%' : 0,
    layout: {
      padding: 16
    },
    plugins: {
      legend: {
        position: 'right'
      },
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<'pie'>) => {
            const value = context.parsed;
            const total = context.chart.data.datasets[0].data.reduce(
              (sum: number, val: number) => sum + val,
              0
            );
            const percentage = ((value / total) * 100).toFixed(1);
            return `${context.label}: ${formatTooltipValue(value, 'currency')} (${percentage}%)`;
          }
        }
      }
    }
  });
};

/**
 * Default options for area charts
 */
export const areaChartOptions = (
  themeMode: ThemeMode = ThemeMode.LIGHT
): ChartOptions => {
  const isDarkMode = themeMode === ThemeMode.DARK;
  const theme = getChartTheme(isDarkMode);
  
  return getChartOptions({
    themeMode,
    elements: {
      line: {
        tension: 0.4, // Slightly curved lines
        borderWidth: 2,
        fill: 'origin'
      },
      point: {
        radius: 2,
        hoverRadius: 5,
        borderWidth: 2,
        backgroundColor: theme.backgroundColor
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: theme.textColor
        }
      },
      y: {
        grid: {
          color: theme.gridColor
        },
        ticks: {
          color: theme.textColor
        },
        beginAtZero: true
      }
    },
    plugins: {
      filler: {
        propagate: false,
        drawTime: 'beforeDatasetsDraw'
      }
    }
  });
};