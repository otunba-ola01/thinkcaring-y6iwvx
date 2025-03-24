import React, { useRef, useEffect, useState, useMemo } from 'react'; // v18.2.0
import { Bar } from 'react-chartjs-2'; // v5.2.0
import { Box, Typography, CircularProgress } from '@mui/material'; // v5.13.0
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'; // v4.3.0
import merge from 'lodash'; // v4.17.21
import { InsertChartOutlined } from '@mui/icons-material'; // v5.13.0

import { BarChartProps } from '../../types/chart.types';
import { BaseChartProps, ChartDataPoint, ChartSeries, ChartAxisType } from '../../types/chart.types';
import { getChartOptions, barChartOptions, applyAxisConfig, CHART_COLORS } from '../../config/chart.config';
import Card from '../ui/Card';
import useResponsive from '../../hooks/useResponsive';

// Register Chart.js components if not already registered
if (!ChartJS.registry.getController('bar')) {
  ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
  );
}

/**
 * Determines if the provided data is multi-series (array of ChartSeries) or single series (array of ChartDataPoint)
 * 
 * @param data - The chart data to analyze
 * @returns true if data is multi-series, false otherwise
 */
const isMultiSeriesData = (data: ChartDataPoint[] | ChartSeries[]): boolean => {
  if (!Array.isArray(data) || data.length === 0) return false;
  
  // Check if the first item has a 'data' property (indicating ChartSeries)
  return 'data' in data[0] && Array.isArray(data[0].data);
};

/**
 * Prepares chart data in the format expected by Chart.js
 * 
 * @param data - The raw data from component props
 * @param isMultiSeries - Whether the data is multi-series
 * @returns Chart.js compatible data object
 */
const prepareChartData = (
  data: ChartDataPoint[] | ChartSeries[],
  isMultiSeries: boolean
) => {
  if (isMultiSeries) {
    // Multi-series data (ChartSeries[])
    const series = data as ChartSeries[];
    
    // Extract unique labels from all series' x values
    const allLabels = new Set<string>();
    series.forEach(s => {
      s.data.forEach(d => allLabels.add(d.x.toString()));
    });
    
    // Sort labels to ensure consistent ordering
    const labels = Array.from(allLabels).sort();
    
    // Create datasets for each series
    const datasets = series.map((s, index) => {
      // Create a map of x values to y values for quick lookup
      const dataMap = new Map(s.data.map(d => [d.x.toString(), d.y]));
      
      return {
        label: s.name,
        data: labels.map(label => dataMap.get(label) || 0),
        backgroundColor: s.color || CHART_COLORS[index % CHART_COLORS.length],
        borderColor: 'transparent',
        barPercentage: 0.8,
        categoryPercentage: 0.8
      };
    });
    
    return { labels, datasets };
  } else {
    // Single series data (ChartDataPoint[])
    const dataPoints = data as ChartDataPoint[];
    
    // Extract labels and values
    const labels = dataPoints.map(d => d.label);
    const values = dataPoints.map(d => d.value);
    const colors = dataPoints.map((d, index) => 
      d.color || CHART_COLORS[index % CHART_COLORS.length]
    );
    
    const datasets = [{
      data: values,
      backgroundColor: colors,
      borderColor: 'transparent',
      barPercentage: 0.8,
      categoryPercentage: 0.8
    }];
    
    return { labels, datasets };
  }
};

/**
 * Prepares chart options by merging default options with custom options
 * 
 * @param props - Component props
 * @param containerWidth - Width of the container
 * @returns Chart.js compatible options object
 */
const prepareChartOptions = (
  props: BarChartProps & BaseChartProps,
  containerWidth: number
) => {
  const {
    horizontal,
    stacked,
    xAxis,
    yAxis,
    tooltip,
    legend,
    themeMode,
    onClick
  } = props;
  
  // Get base options for bar charts
  let options = barChartOptions(themeMode, !!horizontal);
  
  // Apply stacked configuration if needed
  if (stacked) {
    options = merge({}, options, {
      scales: {
        x: { stacked: true },
        y: { stacked: true }
      }
    });
  }
  
  // Apply axis configuration
  options = applyAxisConfig(
    options, 
    xAxis, 
    yAxis, 
    themeMode === 'dark'
  );
  
  // Configure tooltip
  if (tooltip === false) {
    if (options.plugins && options.plugins.tooltip) {
      options.plugins.tooltip.enabled = false;
    }
  } else if (typeof tooltip === 'object') {
    // Using merge to maintain other tooltip options
    if (options.plugins && options.plugins.tooltip) {
      options.plugins.tooltip = merge({}, options.plugins.tooltip, tooltip);
    }
  }
  
  // Configure legend
  if (legend === false) {
    if (options.plugins && options.plugins.legend) {
      options.plugins.legend.display = false;
    }
  } else if (typeof legend === 'object') {
    // Using merge to maintain other legend options
    if (options.plugins && options.plugins.legend) {
      options.plugins.legend = merge({}, options.plugins.legend, legend);
    }
  }
  
  // Add click handler if provided
  if (onClick) {
    options.onClick = (event, elements, chart) => {
      if (elements.length > 0) {
        const { index, datasetIndex } = elements[0];
        
        // Get the clicked data
        const value = chart.data.datasets[datasetIndex].data[index] as number;
        const label = chart.data.labels?.[index]?.toString() || '';
        
        // Determine if it's multi-series or single series
        const isMulti = chart.data.datasets.length > 1 && !!chart.data.datasets[datasetIndex].label;
        
        if (isMulti) {
          const seriesName = chart.data.datasets[datasetIndex].label || '';
          onClick({ seriesName, x: label, y: value });
        } else {
          // Single series, create a ChartDataPoint-like object
          onClick({ label, value });
        }
      }
    };
  }
  
  // Apply responsive options based on container width
  if (containerWidth < 400) {
    options = merge({}, options, {
      plugins: {
        legend: {
          display: false
        }
      }
    });
  }
  
  return options;
};

/**
 * A bar chart component that renders categorical data using Chart.js with
 * support for horizontal/vertical orientation and stacked/grouped bars.
 * Used throughout the application for displaying revenue breakdowns, claims statistics,
 * and other financial metrics.
 * 
 * @param props - Component props including data, configuration options, and styling properties
 * @returns The rendered BarChart component
 */
const BarChart = (props: BarChartProps & BaseChartProps): JSX.Element => {
  const {
    data,
    title,
    subtitle,
    height = 300,
    loading = false,
    error = null,
    emptyMessage = 'No data available',
    sx = {}
  } = props;
  
  // Use responsive hook to get current screen size
  const responsive = useResponsive();
  
  // Create a ref for the chart container
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Track container width for responsive adjustments
  const [containerWidth, setContainerWidth] = useState(0);
  
  // Measure container width on mount and window resize
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };
    
    // Initial measurement
    updateWidth();
    
    // Re-measure on window resize
    const handleResize = () => {
      window.requestAnimationFrame(updateWidth);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Determine if data is multi-series or single series
  const isMultiSeries = useMemo(() => isMultiSeriesData(data), [data]);
  
  // Prepare chart data in the format expected by Chart.js
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return { labels: [], datasets: [] };
    return prepareChartData(data, isMultiSeries);
  }, [data, isMultiSeries]);
  
  // Prepare chart options
  const chartOptions = useMemo(() => {
    return prepareChartOptions(props, containerWidth);
  }, [props, containerWidth]);
  
  // Handle loading state
  if (loading) {
    return (
      <Card title={title} subtitle={subtitle} sx={sx}>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          height={height}
        >
          <CircularProgress aria-label="Loading chart data" />
        </Box>
      </Card>
    );
  }
  
  // Handle error state
  if (error) {
    return (
      <Card title={title} subtitle={subtitle} sx={sx}>
        <Box
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          height={height}
          color="error.main"
        >
          <Typography variant="body1" gutterBottom>
            {error}
          </Typography>
        </Box>
      </Card>
    );
  }
  
  // Handle empty data state
  if (!data || data.length === 0) {
    return (
      <Card title={title} subtitle={subtitle} sx={sx}>
        <Box
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          height={height}
          color="text.secondary"
        >
          <InsertChartOutlined sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
          <Typography variant="body1">{emptyMessage}</Typography>
        </Box>
      </Card>
    );
  }
  
  // Generate a descriptive aria label for accessibility
  const ariaLabel = title 
    ? `Bar chart of ${title}${subtitle ? `: ${subtitle}` : ''}`
    : 'Bar chart';

  // Render the chart
  return (
    <Card title={title} subtitle={subtitle} sx={sx}>
      <Box
        ref={containerRef}
        height={height}
        role="img"
        aria-label={ariaLabel}
      >
        <Bar 
          data={chartData} 
          options={chartOptions}
          aria-hidden="true" // Hide from screen readers since we have the aria-label on the parent
        />
      </Box>
    </Card>
  );
};

export default BarChart;