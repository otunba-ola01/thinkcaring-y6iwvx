import React, { useMemo } from 'react';
import { Box, Typography, Divider } from '@mui/material'; // v5.13.0

import { AgingChartProps, BaseChartProps } from '../../types/chart.types';
import BarChart from './BarChart';
import { getChartOptions, CHART_COLORS } from '../../config/chart.config';
import Card from '../ui/Card';
import { formatCurrency } from '../../utils/currency';

/**
 * A specialized chart component that visualizes accounts receivable aging data by buckets
 * 
 * @param props - The component props
 * @returns The rendered AgingChart component
 */
const AgingChart = (props: AgingChartProps & BaseChartProps): JSX.Element => {
  const { 
    data, 
    showTotal = false, 
    ...rest 
  } = props;
  
  // Calculate total amount from all buckets if showTotal is true
  const total = useMemo(() => {
    if (!showTotal || !data || data.length === 0) return 0;
    return calculateTotal(data);
  }, [data, showTotal]);

  // Prepare the chart data in the format expected by BarChart
  const chartData = useMemo(() => {
    return prepareChartData(data || []);
  }, [data]);

  // Determine if we have data to show the total summary
  const hasData = data && data.length > 0 && !rest.loading && !rest.error;
  
  return (
    <>
      <BarChart 
        data={chartData}
        title={rest.title || "Accounts Receivable Aging"}
        subtitle={rest.subtitle || "Outstanding balances by age"}
        height={rest.height}
        loading={rest.loading}
        error={rest.error}
        emptyMessage={rest.emptyMessage || "No aging data available"}
        sx={rest.sx}
        xAxis={{
          type: "category",
          title: "Aging Buckets"
        }}
        yAxis={{
          type: "linear",
          title: "Amount",
          format: "currency"
        }}
      />
      
      {showTotal && hasData && (
        <Card sx={{ mt: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle1">Total Outstanding</Typography>
            <Typography variant="h6" data-testid="aging-total">
              {formatCurrency(total)}
            </Typography>
          </Box>
        </Card>
      )}
    </>
  );
};

/**
 * Prepares aging data for the BarChart component
 * 
 * @param data - The aging buckets data
 * @returns Formatted data for the BarChart component
 */
const prepareChartData = (data: Array<{ bucket: string; amount: number }>) => {
  return data.map(item => ({
    label: item.bucket,
    value: item.amount,
    color: getAgingColor(item.bucket)
  }));
};

/**
 * Gets an appropriate color for an aging bucket based on its age
 * 
 * @param bucket - The aging bucket name
 * @returns Color code for the bucket
 */
const getAgingColor = (bucket: string): string => {
  const bucketLower = bucket.toLowerCase();
  
  // Use colors that indicate severity - newer buckets are green, older are red
  if (bucketLower.includes('current') || bucketLower.includes('0-30')) {
    return CHART_COLORS.PRIMARY[1]; // Green
  } else if (bucketLower.includes('31-60')) {
    return CHART_COLORS.PRIMARY[5]; // Yellow
  } else if (bucketLower.includes('61-90')) {
    return CHART_COLORS.PRIMARY[2]; // Orange
  } else {
    return CHART_COLORS.PRIMARY[6]; // Red
  }
};

/**
 * Calculates the total amount from all aging buckets
 * 
 * @param data - The aging buckets data
 * @returns Total amount across all buckets
 */
const calculateTotal = (data: Array<{ bucket: string; amount: number }>): number => {
  return data.reduce((sum, item) => sum + item.amount, 0);
};

export default AgingChart;