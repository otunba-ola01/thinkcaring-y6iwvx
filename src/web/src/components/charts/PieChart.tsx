import React, { useRef, useEffect, useState, useMemo } from 'react'; // v18.2.0
import { Pie, Doughnut } from 'react-chartjs-2'; // v5.2.0
import { Box, Typography, CircularProgress } from '@mui/material'; // v5.13.0
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'; // v4.3.0
import merge from 'lodash'; // v4.17.21
import { InsertChartOutlined } from '@mui/icons-material'; // v5.13.0

import { PieChartProps } from '../../types/chart.types';
import { BaseChartProps, ChartDataPoint, ChartLegendPosition } from '../../types/chart.types';
import { getChartOptions, pieChartOptions, CHART_COLORS } from '../../config/chart.config';
import Card from '../ui/Card';
import useResponsive from '../../hooks/useResponsive';

// Register required Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

/**
 * A pie chart component that renders proportional data using Chart.js
 * with support for regular pie or donut chart styles.
 * 
 * @param {PieChartProps & BaseChartProps} props - The component props
 * @returns {JSX.Element} The rendered PieChart component
 */
const PieChart = (props: PieChartProps & BaseChartProps): JSX.Element => {
  const {
    // Chart data
    data = [],
    // Chart style props
    donut = false,
    innerRadius,
    labelPosition = ChartLegendPosition.RIGHT,
    showPercentage = true,
    // BaseChartProps
    title,
    subtitle,
    size,
    height = 300,
    margin,
    legend = true,
    tooltip = true,
    loading = false,
    error = null,
    emptyMessage = 'No data available',
    themeMode,
    sx = {},
    // Event handlers
    onClick
  } = props;

  // Get responsive information
  const { breakpoint, isXs, isSm, isMd } = useResponsive();
  
  // Create a ref for the chart container
  const containerRef = useRef<HTMLDivElement>(null);
  
  // State for container width (used for responsive adjustments)
  const [containerWidth, setContainerWidth] = useState<number>(0);
  
  // Measure container width on mount and window resize
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    
    // Initial measurement
    updateWidth();
    
    // Listen for resize events
    window.addEventListener('resize', updateWidth);
    
    // Clean up listener on unmount
    return () => {
      window.removeEventListener('resize', updateWidth);
    };
  }, []);
  
  // Prepare chart data in the format expected by Chart.js
  const chartData = useMemo(() => {
    return prepareChartData(data);
  }, [data]);
  
  // Prepare chart options by merging default options with custom options
  const chartOptions = useMemo(() => {
    return prepareChartOptions(props, containerWidth);
  }, [props, containerWidth]);
  
  // Handle loading state
  if (loading) {
    return (
      <Card title={title} subtitle={subtitle} sx={{ ...sx, height }}>
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100%', 
            minHeight: 200 
          }}
        >
          <CircularProgress />
        </Box>
      </Card>
    );
  }
  
  // Handle error state
  if (error) {
    return (
      <Card title={title} subtitle={subtitle} sx={{ ...sx, height }}>
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100%', 
            minHeight: 200 
          }}
        >
          <Typography color="error" variant="body1">
            {error}
          </Typography>
        </Box>
      </Card>
    );
  }
  
  // Handle empty data state
  if (!data || data.length === 0) {
    return (
      <Card title={title} subtitle={subtitle} sx={{ ...sx, height }}>
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100%', 
            minHeight: 200 
          }}
        >
          <InsertChartOutlined sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography color="text.secondary" variant="body1">
            {emptyMessage}
          </Typography>
        </Box>
      </Card>
    );
  }
  
  // Determine chart component based on donut prop
  const ChartComponent = donut ? Doughnut : Pie;
  
  return (
    <Card title={title} subtitle={subtitle} sx={{ ...sx, height }}>
      <Box 
        ref={containerRef}
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100%', 
          position: 'relative',
          ...(margin && { margin })
        }}
        role="img"
        aria-label={title ? `${title} pie chart` : "Pie chart"}
      >
        <ChartComponent 
          data={chartData}
          options={chartOptions}
        />
      </Box>
    </Card>
  );
};

/**
 * Prepares chart data in the format expected by Chart.js
 * 
 * @param {ChartDataPoint[]} data - The chart data points
 * @returns {object} Chart.js compatible data object
 */
const prepareChartData = (data: ChartDataPoint[]) => {
  // Extract labels and values from data points
  const labels = data.map(item => item.label);
  const values = data.map(item => item.value);
  
  // Use custom colors if provided, otherwise use default colors
  const colors = data.map((item, index) => 
    item.color || CHART_COLORS.PRIMARY[index % CHART_COLORS.PRIMARY.length]
  );
  
  return {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: colors,
        borderColor: colors.map(color => color),
        borderWidth: 1,
      },
    ],
  };
};

/**
 * Prepares chart options by merging default options with custom options
 * 
 * @param {PieChartProps & BaseChartProps} props - The component props
 * @param {number} containerWidth - The width of the container element
 * @returns {object} Chart.js compatible options object
 */
const prepareChartOptions = (props: PieChartProps & BaseChartProps, containerWidth: number) => {
  const {
    donut = false,
    innerRadius,
    labelPosition = ChartLegendPosition.RIGHT,
    showPercentage = true,
    tooltip = true,
    legend = true,
    themeMode,
    onClick
  } = props;
  
  // Get base chart options
  let options = getChartOptions({ themeMode });
  
  // Start with pie chart options
  options = merge({}, options, pieChartOptions(themeMode, donut));
  
  // Configure innerRadius if provided for donut charts
  if (donut && typeof innerRadius === 'number') {
    options = merge({}, options, {
      cutout: `${innerRadius * 100}%`
    });
  }
  
  // Configure tooltip
  if (tooltip) {
    const isTooltipObject = typeof tooltip === 'object';
    
    options = merge({}, options, {
      plugins: {
        tooltip: {
          callbacks: {
            label: (context: any) => {
              const value = context.raw;
              const total = calculateTotal(props.data);
              const percentage = ((value / total) * 100).toFixed(1);
              
              let label = context.label || '';
              label += `: ${new Intl.NumberFormat('en-US', {
                style: isTooltipObject && tooltip.format === 'currency' ? 'currency' : 'decimal',
                currency: 'USD',
                minimumFractionDigits: 0,
                maximumFractionDigits: 2
              }).format(value)}`;
              
              if (showPercentage) {
                label += ` (${percentage}%)`;
              }
              
              return label;
            }
          }
        }
      }
    });
  }
  
  // Configure legend
  if (legend) {
    const position = typeof legend === 'object' && legend.position 
      ? legend.position 
      : labelPosition;
    
    options = merge({}, options, {
      plugins: {
        legend: {
          display: true,
          position: position
        }
      }
    });
  } else {
    options = merge({}, options, {
      plugins: {
        legend: {
          display: false
        }
      }
    });
  }
  
  // Add click handler if provided
  if (onClick) {
    options = merge({}, options, {
      onClick: (event: any, elements: any[]) => {
        if (elements.length > 0) {
          const index = elements[0].index;
          onClick(props.data[index]);
        }
      }
    });
  }
  
  // Apply responsive options based on container width
  if (containerWidth < 400) {
    options = merge({}, options, {
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    });
  }
  
  return options;
};

/**
 * Calculates the total value of all data points
 * 
 * @param {ChartDataPoint[]} data - The chart data points
 * @returns {number} The sum of all data point values
 */
const calculateTotal = (data: ChartDataPoint[]): number => {
  return data.reduce((sum, item) => sum + item.value, 0);
};

export default PieChart;