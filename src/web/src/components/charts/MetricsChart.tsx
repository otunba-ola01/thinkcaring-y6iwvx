import React, { useEffect, useRef, useMemo } from 'react'; // v18.2.0
import { Box, Typography, Chip, useTheme } from '@mui/material'; // v5.13.0
import { TrendingUp, TrendingDown, Flag } from '@mui/icons-material'; // v5.13.0
import { Chart, registerables } from 'chart.js'; // v4.3.0

import { MetricsChartProps, BaseChartProps } from '../../types/chart.types';
import { ThemeMode } from '../../types/common.types';
import Card from '../ui/Card';
import { formatCurrency } from '../../utils/currency';
import { formatNumber, formatPercentage, percentage } from '../../utils/number';

// Register Chart.js components
Chart.register(...registerables);

/**
 * Formats a metric value based on the specified format type
 * 
 * @param value - The value to format
 * @param format - The format type ('currency', 'percentage', or 'number')
 * @returns Formatted value string
 */
const formatMetricValue = (value: number, format: string): string => {
  switch (format) {
    case 'currency':
      return formatCurrency(value);
    case 'percentage':
      return formatPercentage(value);
    case 'number':
    default:
      return formatNumber(value);
  }
};

/**
 * Creates the configuration for the metrics chart visualization
 * 
 * @param data - The chart data (current, previous, target)
 * @param showTarget - Whether to show the target indicator
 * @param isDarkMode - Whether the theme is in dark mode
 * @returns Chart.js configuration object
 */
const createChartConfig = (
  data: { current: number; previous: number; target?: number },
  showTarget: boolean,
  isDarkMode: boolean
) => {
  const { current, previous, target } = data;
  
  // Define colors based on theme mode
  const colors = {
    current: isDarkMode ? '#90caf9' : '#1976d2', // Blue
    previous: isDarkMode ? '#5d6b82' : '#c7d0dc', // Gray
    target: isDarkMode ? '#ffb74d' : '#f57c00', // Orange
    background: isDarkMode ? '#121212' : '#ffffff',
    gridLines: isDarkMode ? '#303030' : '#e0e0e0',
    text: isDarkMode ? '#ffffff' : '#333333',
  };

  // Calculate the max value for the y-axis scale
  const maxValue = Math.max(
    current, 
    previous, 
    target !== undefined && showTarget ? target : 0
  ) * 1.2; // Add 20% padding

  // Create dataset for the chart
  const datasets = [
    {
      label: 'Current',
      data: [current],
      backgroundColor: colors.current,
      barThickness: 40,
    },
    {
      label: 'Previous',
      data: [previous],
      backgroundColor: colors.previous,
      barThickness: 40,
    },
  ];

  // Add target dataset if it exists and showTarget is true
  if (target !== undefined && showTarget) {
    datasets.push({
      label: 'Target',
      data: [target],
      backgroundColor: colors.target,
      barThickness: 40,
    });
  }

  return {
    type: 'bar',
    data: {
      labels: [''],
      datasets,
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      scales: {
        x: {
          beginAtZero: true,
          max: maxValue,
          grid: {
            color: colors.gridLines,
          },
          ticks: {
            color: colors.text,
          },
        },
        y: {
          display: false,
        },
      },
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: colors.text,
            boxWidth: 12,
            padding: 15,
          },
        },
        tooltip: {
          backgroundColor: isDarkMode ? '#424242' : '#f5f5f5',
          titleColor: colors.text,
          bodyColor: colors.text,
          borderColor: colors.gridLines,
          borderWidth: 1,
        },
      },
      animation: {
        duration: 500,
      },
    },
  };
};

/**
 * A component that visualizes metric comparisons with current value, previous value, and optional target
 * 
 * @param {MetricsChartProps & BaseChartProps} props - The component props
 * @returns {JSX.Element} The rendered MetricsChart component
 */
const MetricsChart = ({
  data,
  format = 'number',
  showChange = true,
  showTarget = false,
  positiveIsGood = true,
  title,
  subtitle,
  loading = false,
  error,
  themeMode = ThemeMode.LIGHT,
  sx,
}: MetricsChartProps & BaseChartProps): JSX.Element => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  const theme = useTheme();
  const isDarkMode = themeMode === ThemeMode.DARK || theme.palette.mode === 'dark';

  // Calculate the percentage change
  const change = data 
    ? (data.previous === 0 
      ? (data.current > 0 ? 100 : 0) 
      : percentage(data.current - data.previous, data.previous)) 
    : 0;
  
  // Determine if change is positive, negative, or neutral
  const isPositive = change > 0;
  const isNegative = change < 0;
  const isNeutral = change === 0;
  
  // Determine color based on whether positive change is good
  const changeColor = isNeutral
    ? 'default'
    : isPositive
      ? positiveIsGood ? 'success' : 'error'
      : positiveIsGood ? 'error' : 'success';
  
  // Format the current value
  const formattedCurrent = data ? formatMetricValue(data.current, format) : '-';
  
  // Format the previous value
  const formattedPrevious = data ? formatMetricValue(data.previous, format) : '-';
  
  // Format the target value if it exists
  const formattedTarget = data && data.target !== undefined && showTarget
    ? formatMetricValue(data.target, format)
    : null;
  
  // Format the change with a + or - sign
  const formattedChange = `${isPositive ? '+' : ''}${change.toFixed(1)}%`;

  // Create and memoize chart config
  const chartConfig = useMemo(() => {
    if (!data) return null;
    return createChartConfig(data, showTarget, isDarkMode);
  }, [data, showTarget, isDarkMode]);

  // Initialize and update chart
  useEffect(() => {
    if (!chartRef.current || !chartConfig) return;

    // Destroy existing chart instance
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // Create new chart instance
    chartInstance.current = new Chart(chartRef.current, chartConfig as any);

    // Cleanup on unmount
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [chartConfig]);

  // Render loading skeleton if loading
  if (loading) {
    return (
      <Card 
        title={title} 
        subtitle={subtitle}
        loading={true} 
        sx={{ minHeight: 300, ...sx }}
      />
    );
  }

  // Render error message if error exists
  if (error) {
    return (
      <Card title={title} subtitle={subtitle} sx={{ minHeight: 300, ...sx }}>
        <Box display="flex" justifyContent="center" alignItems="center" height="200px">
          <Typography color="error">{error}</Typography>
        </Box>
      </Card>
    );
  }

  return (
    <Card title={title} subtitle={subtitle} sx={{ minHeight: 300, ...sx }}>
      <Box display="flex" flexDirection="column" height="100%" sx={{ p: 1 }}>
        {/* Current value and change indicator */}
        <Box display="flex" alignItems="flex-end" mb={2}>
          <Typography variant="h4" component="div" fontWeight="bold">
            {formattedCurrent}
          </Typography>
          
          {showChange && (
            <Chip
              icon={isPositive ? <TrendingUp /> : isNegative ? <TrendingDown /> : undefined}
              label={formattedChange}
              size="small"
              color={changeColor}
              variant="outlined"
              sx={{ ml: 1, mb: 0.5, height: 24 }}
            />
          )}
        </Box>
        
        {/* Comparison with previous period */}
        <Typography variant="body2" color="text.secondary" mb={2}>
          Previous: {formattedPrevious}
        </Typography>
        
        {/* Chart visualization */}
        <Box flex={1} minHeight={150} position="relative">
          <canvas ref={chartRef} height="150" />
        </Box>
        
        {/* Target indicator */}
        {formattedTarget && (
          <Box display="flex" alignItems="center" mt={1}>
            <Flag fontSize="small" color="warning" />
            <Typography variant="body2" color="text.secondary" ml={0.5}>
              Target: {formattedTarget}
            </Typography>
          </Box>
        )}
      </Box>
    </Card>
  );
};

export default MetricsChart;