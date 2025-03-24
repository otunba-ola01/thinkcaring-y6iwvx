import React, { useMemo } from 'react'; // v18.2.0
import BarChart from './BarChart';
import { ChartDataPoint, BarChartProps } from '../../types/chart.types';
import { RevenueByPayer } from '../../types/dashboard.types';
import { formatCurrency } from '../../utils/currency';
import { CHART_COLORS } from '../../config/chart.config';

/**
 * A specialized chart component that visualizes revenue distribution across different payers.
 * This component renders a bar chart showing payer revenue data with proper formatting
 * for currency values and supports interactive features like tooltips and click handling.
 *
 * @param props - Component props including payer revenue data and configuration options
 * @returns The rendered RevenueByPayerChart component
 */
const RevenueByPayerChart = ({
  payerRevenue,
  title = 'Revenue by Payer',
  subtitle,
  horizontal = false,
  height = 300,
  loading = false,
  error = null,
  emptyMessage = 'No payer revenue data available',
  themeMode = 'light',
  onClick,
  sx = {}
}: {
  payerRevenue: RevenueByPayer[];
  title?: string;
  subtitle?: string;
  horizontal?: boolean;
  height?: number | string;
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  themeMode?: 'light' | 'dark' | 'system';
  onClick?: (payer: RevenueByPayer) => void;
  sx?: Record<string, any>;
}): JSX.Element => {
  // Transform payer revenue data into chart data points
  const chartData = useMemo(() => {
    return transformPayerData(payerRevenue);
  }, [payerRevenue]);
  
  // Memoize axis configurations
  const yAxis = useMemo(() => ({
    type: 'linear',
    title: 'Revenue',
    format: 'currency'
  }), []);
  
  const xAxis = useMemo(() => ({
    type: 'category',
    title: 'Payer'
  }), []);
  
  // Handle click on chart elements
  const handleClick = useMemo(() => {
    return (dataPoint: ChartDataPoint) => {
      if (onClick && payerRevenue) {
        // Find the corresponding payer data
        const payer = payerRevenue.find(p => p.payerId === dataPoint.id);
        if (payer) {
          onClick(payer);
        }
      }
    };
  }, [onClick, payerRevenue]);
  
  return (
    <BarChart
      data={chartData}
      title={title}
      subtitle={subtitle}
      horizontal={horizontal}
      height={height}
      loading={loading}
      error={error}
      emptyMessage={emptyMessage}
      xAxis={xAxis}
      yAxis={yAxis}
      tooltip={{ format: 'currency' }}
      onClick={handleClick}
      themeMode={themeMode}
      sx={sx}
    />
  );
};

/**
 * Transforms RevenueByPayer data into ChartDataPoint format for the BarChart component
 * 
 * @param payerRevenue - Array of RevenueByPayer objects
 * @returns Array of ChartDataPoint objects formatted for the chart
 */
function transformPayerData(payerRevenue: RevenueByPayer[] | undefined): ChartDataPoint[] {
  if (!payerRevenue || payerRevenue.length === 0) {
    return [];
  }
  
  // Map each payer to a chart data point
  const chartData = payerRevenue.map((payer, index) => ({
    label: payer.payerName,
    value: payer.amount,
    color: CHART_COLORS.PRIMARY[index % CHART_COLORS.PRIMARY.length],
    id: payer.payerId // Store payerId for click handling
  }));
  
  // Sort data by amount in descending order for better visualization
  return chartData.sort((a, b) => b.value - a.value);
}

export default RevenueByPayerChart;