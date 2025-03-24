import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Box, useTheme } from '@mui/material'; // v5.13.0
import { Chart, LineController, LineElement, PointElement, LinearScale, TimeScale, CategoryScale, Tooltip, Legend, Filler } from 'chart.js'; // v4.3.0
import { InsertChartOutlined as ChartIcon } from '@mui/icons-material'; // v5.13.0
import merge from 'lodash'; // v4.17.21

import { AreaChartProps } from '../../types/chart.types';
import { ThemeMode } from '../../types/common.types';
import Card from '../ui/Card';
import Skeleton from '../ui/Skeleton';
import EmptyState from '../ui/EmptyState';
import { areaChartOptions, getChartOptions, applyAxisConfig } from '../../config/chart.config';
import { formatValue } from '../../utils/format';

/**
 * A reusable area chart component that visualizes time series or categorical data with 
 * support for multiple data series, customizable axes, and interactive features.
 * 
 * @param {AreaChartProps} props - Component props
 * @returns {JSX.Element} The rendered AreaChart component
 */
const AreaChart: React.FC<AreaChartProps> = ({
  data,
  xAxis,
  yAxis,
  stacked = false,
  curve = true,
  showPoints = false,
  title,
  subtitle,
  height = 300,
  loading = false,
  error = null,
  emptyMessage = 'No data available',
  themeMode,
  onClick,
  sx
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [chartInstance, setChartInstance] = useState<Chart | null>(null);
  const theme = useTheme();
  const isDarkMode = themeMode === ThemeMode.DARK || (themeMode === ThemeMode.SYSTEM && theme.palette.mode === 'dark');
  
  // Define chart colors based on Material UI palette
  const chartColors = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.error.main,
    theme.palette.info.main,
    theme.palette.primary.dark,
    theme.palette.secondary.dark,
    theme.palette.success.dark,
    theme.palette.warning.dark
  ];
  
  // Prepare chart data
  const chartData = useMemo(() => {
    return {
      datasets: data.map((series, index) => ({
        label: series.name,
        data: series.data,
        borderColor: series.color || chartColors[index % chartColors.length],
        backgroundColor: series.color 
          ? `${series.color}40` // Add 25% opacity 
          : `${chartColors[index % chartColors.length]}40`,
        fill: true,
        tension: curve ? 0.4 : 0,
        pointRadius: showPoints ? 3 : 0,
        pointHoverRadius: 5,
        pointBackgroundColor: theme.palette.background.paper,
        pointBorderColor: series.color || chartColors[index % chartColors.length],
        pointBorderWidth: 2,
      }))
    };
  }, [data, chartColors, theme, curve, showPoints]);
  
  // Create chart options
  const chartOptions = useMemo(() => {
    const options = merge(
      {},
      areaChartOptions(themeMode),
      {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            stacked: stacked
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: (context) => {
                const dataset = context.dataset;
                const dataPoint = context.raw;
                const value = typeof dataPoint === 'object' && 'y' in dataPoint 
                  ? dataPoint.y 
                  : dataPoint;
                  
                // Format value based on y-axis format if available
                const format = yAxis?.format || 'number';
                const formattedValue = formatValue(value, format);
                
                return `${dataset.label}: ${formattedValue}`;
              }
            }
          }
        },
        onClick: onClick ? (event, elements, chart) => {
          if (elements.length > 0) {
            const element = elements[0];
            const index = element.index;
            const datasetIndex = element.datasetIndex;
            const dataset = chart.data.datasets[datasetIndex];
            const dataPoint = dataset.data[index];
            const seriesName = dataset.label || '';
            
            onClick({
              seriesName,
              x: typeof dataPoint === 'object' && 'x' in dataPoint ? dataPoint.x : index,
              y: typeof dataPoint === 'object' && 'y' in dataPoint ? dataPoint.y : dataPoint
            });
          }
        } : undefined
      }
    );
    
    // Apply axis configuration
    return applyAxisConfig(options, xAxis, yAxis, isDarkMode);
  }, [themeMode, xAxis, yAxis, stacked, onClick, isDarkMode]);
  
  // Initialize and update chart
  useEffect(() => {
    // Register required Chart.js components
    Chart.register(
      LineController,
      LineElement,
      PointElement,
      LinearScale,
      TimeScale,
      CategoryScale,
      Tooltip,
      Legend,
      Filler
    );
    
    let newChartInstance: Chart | null = null;
    
    // Initialize chart if canvas is available and data exists
    if (canvasRef.current && data && data.length > 0) {
      // Destroy existing chart instance if it exists
      if (chartInstance) {
        chartInstance.destroy();
      }
      
      // Create new chart instance
      newChartInstance = new Chart(canvasRef.current, {
        type: 'line',
        data: chartData,
        options: chartOptions
      });
      
      // Update chart and store instance
      newChartInstance.update();
      setChartInstance(newChartInstance);
    }
    
    // Clean up on unmount or when chart changes
    return () => {
      if (chartInstance) {
        chartInstance.destroy();
      }
      if (newChartInstance && newChartInstance !== chartInstance) {
        newChartInstance.destroy();
      }
      setChartInstance(null);
    };
  }, [chartData, chartOptions, data, chartInstance]);
  
  // Handle loading state
  if (loading) {
    return (
      <Card title={title} subtitle={subtitle} loading={true} sx={{ height, ...sx }}>
        <Skeleton variant="rectangular" height={height} />
      </Card>
    );
  }
  
  // Handle error state
  if (error) {
    return (
      <Card title={title} subtitle={subtitle} sx={{ height, ...sx }}>
        <Box sx={{ p: 2, color: 'error.main', textAlign: 'center' }}>
          {error}
        </Box>
      </Card>
    );
  }
  
  // Handle empty data
  if (!data || data.length === 0) {
    return (
      <Card title={title} subtitle={subtitle} sx={{ height, ...sx }}>
        <EmptyState 
          title="No Data Available"
          description={emptyMessage}
          icon={<ChartIcon sx={{ fontSize: 64 }} />}
        />
      </Card>
    );
  }
  
  // Render chart
  return (
    <Card title={title} subtitle={subtitle} sx={{ height, ...sx }}>
      <Box sx={{ height: 'calc(100% - 16px)', width: '100%', position: 'relative', px: 1 }}>
        <canvas ref={canvasRef}></canvas>
      </Box>
    </Card>
  );
};

export default AreaChart;