import React, { useRef, useEffect, useState, useMemo } from 'react'; // v18.2.0
import { Box, useTheme } from '@mui/material'; // v5.13.0
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  TimeScale,
  CategoryScale,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'; // v4.3.0
import { InsertChartOutlined as ChartIcon } from '@mui/icons-material'; // v5.13.0
import merge from 'lodash'; // v4.17.21

import { LineChartProps } from '../../types/chart.types';
import { ThemeMode } from '../../types/common.types';
import Card from '../ui/Card';
import Skeleton from '../ui/Skeleton';
import EmptyState from '../ui/EmptyState';
import {
  lineChartOptions,
  getChartOptions,
  applyAxisConfig
} from '../../config/chart.config';
import { formatValue } from '../../utils/format';

// Register Chart.js components
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

/**
 * A line chart component that visualizes time series or categorical data with multiple series support
 *
 * @param {LineChartProps} props - The component props
 * @returns {JSX.Element} The rendered LineChart component
 */
const LineChart: React.FC<LineChartProps> = ({
  data = [],
  xAxis,
  yAxis,
  showPoints = true,
  curve = false,
  area = false,
  title,
  subtitle,
  height = 300,
  loading = false,
  error = null,
  emptyMessage = 'No data available',
  themeMode,
  onClick,
  sx,
  ...rest
}) => {
  // Create ref for canvas element
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Chart instance state
  const [chartInstance, setChartInstance] = useState<Chart | null>(null);
  
  // Get Material UI theme for styling
  const theme = useTheme();
  
  // Determine if dark mode is active
  const isDarkMode =
    themeMode === ThemeMode.DARK ||
    (themeMode === ThemeMode.SYSTEM && theme.palette.mode === 'dark');

  // Prepare chart data
  const chartData = useMemo(() => {
    return {
      datasets: data.map((series, index) => ({
        label: series.name,
        data: series.data,
        borderColor: series.color || theme.palette.primary.main,
        backgroundColor: series.color 
          ? `${series.color}20` 
          : `${theme.palette.primary.main}20`,
        fill: area ? 'origin' : false,
        pointRadius: showPoints ? 3 : 0,
        pointHoverRadius: 5,
        pointBackgroundColor: theme.palette.background.paper,
        pointBorderColor: series.color || theme.palette.primary.main,
        pointBorderWidth: 2,
        tension: curve ? 0.4 : 0,
      })),
    };
  }, [data, theme, showPoints, curve, area]);

  // Create chart options
  const chartOptions = useMemo(() => {
    // Get base options for line chart
    const baseOptions = lineChartOptions(themeMode);
    
    // Create custom options
    const customOptions = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: (context: any) => {
              const label = context.dataset.label || '';
              const value = formatValue(context.raw.y, yAxis?.format || 'number');
              return `${label}: ${value}`;
            }
          }
        }
      },
    };
    
    // Merge base options with custom options
    return merge({}, baseOptions, customOptions);
  }, [themeMode, yAxis]);

  // Apply axis configuration
  const configuredOptions = useMemo(() => {
    return applyAxisConfig(chartOptions, xAxis, yAxis, isDarkMode);
  }, [chartOptions, xAxis, yAxis, isDarkMode]);

  // Initialize chart and handle cleanup
  useEffect(() => {
    // If there's a chart instance, destroy it
    if (chartInstance) {
      chartInstance.destroy();
    }
    
    // Get the canvas context
    const canvas = canvasRef.current;
    if (!canvas || !data.length) {
      setChartInstance(null);
      return;
    }
    
    // Create new chart
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const newChart = new Chart(ctx, {
        type: 'line',
        data: chartData,
        options: configuredOptions,
      });
      
      setChartInstance(newChart);
      
      // Clean up on unmount
      return () => {
        newChart.destroy();
        setChartInstance(null);
      };
    }
  }, [data, chartData, configuredOptions]);

  // Set up click handler if provided
  useEffect(() => {
    if (chartInstance && onClick) {
      const clickHandler = (evt: any) => {
        const points = chartInstance.getElementsAtEventForMode(
          evt,
          'nearest',
          { intersect: true },
          false
        );
        
        if (points.length) {
          const firstPoint = points[0];
          const datasetIndex = firstPoint.datasetIndex;
          const index = firstPoint.index;
          const pointData = chartInstance.data.datasets[datasetIndex].data[index];
          
          onClick({
            seriesName: chartInstance.data.datasets[datasetIndex].label || '',
            x: pointData.x,
            y: pointData.y
          });
        }
      };
      
      // Get the canvas element
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.addEventListener('click', clickHandler);
        
        // Clean up event listener on unmount
        return () => {
          canvas.removeEventListener('click', clickHandler);
        };
      }
    }
  }, [chartInstance, onClick]);

  // Render loading state
  if (loading) {
    return (
      <Card 
        title={title} 
        subtitle={subtitle}
        loading={true}
        sx={{ width: '100%', ...sx }}
      />
    );
  }

  // Render error state
  if (error) {
    return (
      <Card 
        title={title} 
        subtitle={subtitle}
        sx={{ width: '100%', ...sx }}
      >
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            p: 3,
            height: height,
            color: 'error.main'
          }}
        >
          {error}
        </Box>
      </Card>
    );
  }

  // Render empty state
  if (!data || data.length === 0) {
    return (
      <Card 
        title={title} 
        subtitle={subtitle}
        sx={{ width: '100%', ...sx }}
      >
        <EmptyState 
          title="No data available"
          description={emptyMessage}
          icon={<ChartIcon sx={{ fontSize: 64 }} />}
        />
      </Card>
    );
  }

  // Render chart
  return (
    <Card 
      title={title} 
      subtitle={subtitle}
      sx={{ width: '100%', ...sx }}
    >
      <Box 
        sx={{ 
          height, 
          width: '100%', 
          position: 'relative',
        }}
      >
        <canvas 
          ref={canvasRef} 
          aria-label={`Line chart: ${title || 'Chart data'}`}
        />
      </Box>
    </Card>
  );
};

export default LineChart;