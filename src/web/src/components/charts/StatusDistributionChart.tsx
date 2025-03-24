import React, { useMemo } from 'react'; // v18.2.0
import { Box, Typography } from '@mui/material'; // v5.13.0

import { StatusDistributionChartProps } from '../../types/chart.types';
import { BaseChartProps, ChartDataPoint, ChartLegendPosition } from '../../types/chart.types';
import PieChart from './PieChart';
import Card from '../ui/Card';
import { CLAIM_STATUS_COLORS, CLAIM_STATUS_LABELS } from '../../constants/claims.constants';
import { ClaimStatus } from '../../types/claims.types';

/**
 * A component that visualizes status distribution data as a pie or donut chart with appropriate colors and labels
 * 
 * @param {StatusDistributionChartProps & BaseChartProps} props - Component props
 * @returns {JSX.Element} The rendered StatusDistributionChart component
 */
const StatusDistributionChart = (props: StatusDistributionChartProps & BaseChartProps): JSX.Element => {
  const {
    data,
    title,
    subtitle,
    showLegend = true,
    showPercentage = true,
    donut = true,
    size,
    height = 300,
    margin,
    loading = false,
    error = null,
    emptyMessage = 'No status data available',
    themeMode,
    sx = {},
    ...otherProps
  } = props;

  // Calculate total for percentage calculation
  const total = useMemo(() => {
    return data.reduce((sum, item) => sum + item.count, 0);
  }, [data]);

  // Transform status data to chart data points
  const chartData = useMemo(() => {
    return transformStatusData(data);
  }, [data]);

  // If no custom container is provided, wrap the chart in a Card
  return (
    <Card 
      title={title} 
      subtitle={subtitle} 
      sx={{ ...sx, height }} 
      loading={loading}
      error={error}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          position: 'relative',
          ...(margin && { margin })
        }}
        role="img"
        aria-label={title ? `${title} status distribution chart` : "Status distribution chart"}
      >
        {data && data.length > 0 ? (
          <PieChart 
            data={chartData}
            donut={donut}
            showPercentage={showPercentage}
            legend={{ position: showLegend ? ChartLegendPosition.RIGHT : undefined }}
            height={height}
            themeMode={themeMode}
            loading={loading}
            error={error}
            emptyMessage={emptyMessage}
            {...otherProps}
          />
        ) : (
          <Typography color="text.secondary" variant="body1">
            {emptyMessage}
          </Typography>
        )}
      </Box>
    </Card>
  );
};

/**
 * Transforms status distribution data into the format expected by the PieChart component
 * 
 * @param {Array<{ status: string; count: number; color?: string }>} data - Status distribution data
 * @returns {ChartDataPoint[]} Transformed data for the PieChart component
 */
const transformStatusData = (data: Array<{ status: string; count: number; color?: string }>): ChartDataPoint[] => {
  return data.map(item => ({
    label: getStatusLabel(item.status),
    value: item.count,
    color: getStatusColor(item.status, item.color)
  }));
};

/**
 * Gets a human-readable label for a status code
 * 
 * @param {string} status - Status code
 * @returns {string} Human-readable status label
 */
const getStatusLabel = (status: string): string => {
  // Check if status is a ClaimStatus enum value
  if (Object.values(ClaimStatus).includes(status as ClaimStatus)) {
    // Return the label from CLAIM_STATUS_LABELS
    return CLAIM_STATUS_LABELS[status as ClaimStatus];
  }
  
  // If not a ClaimStatus, just capitalize the first letter
  return status.charAt(0).toUpperCase() + status.slice(1);
};

/**
 * Gets the appropriate color for a status code
 * 
 * @param {string} status - Status code
 * @param {string | undefined} providedColor - Optional color override
 * @returns {string} Color code for the status
 */
const getStatusColor = (status: string, providedColor?: string): string => {
  // If a color is provided, use that
  if (providedColor) {
    return providedColor;
  }
  
  // Check if status is a ClaimStatus enum value
  if (Object.values(ClaimStatus).includes(status as ClaimStatus)) {
    // Return the color from CLAIM_STATUS_COLORS
    return CLAIM_STATUS_COLORS[status as ClaimStatus];
  }
  
  // Default color if not found
  return '#9E9E9E'; // Grey
};

export default StatusDistributionChart;