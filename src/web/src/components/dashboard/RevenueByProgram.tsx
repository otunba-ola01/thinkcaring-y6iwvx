import React, { useMemo, useCallback } from 'react'; // v18.2.0
import { Box, Typography, Divider } from '@mui/material'; // v5.13.0
import { useRouter } from 'next/router'; // latest

import Card from '../ui/Card';
import BarChart from '../charts/BarChart';
import { ChartDataPoint } from '../../types/chart.types';
import { RevenueByProgram } from '../../types/dashboard.types';
import useDashboard from '../../hooks/useDashboard';
import { CHART_COLORS } from '../../config/chart.config';
import { formatCurrency, formatPercentage } from '../../utils/format';

/**
 * A component that displays revenue breakdown by program using a bar chart
 * @param props - Component props
 * @returns The rendered RevenueByProgramChart component
 */
const RevenueByProgramChart = (props: {}): JSX.Element => {
  // Use the useDashboard hook to access revenue by program data and loading state
  const { revenueByProgram, loading } = useDashboard();

  // Use the useRouter hook to get access to the Next.js router for navigation
  const router = useRouter();

  // Create a click handler function to navigate to program details when a bar is clicked
  const handleBarClick = useCallback((dataPoint: ChartDataPoint) => {
    if (dataPoint.id) {
      router.push(`/programs/${dataPoint.id}`);
    }
  }, [router]);

  /**
   * Transforms revenue by program data into the format expected by the BarChart component
   * @param data - Revenue by program data
   * @returns Transformed data for the chart
   */
  const transformDataForChart = useCallback((data: RevenueByProgram[] | null): ChartDataPoint[] => {
    if (!data) return [];

    return data.map((item, index) => ({
      label: item.programName,
      value: item.amount,
      id: item.programId,
      color: CHART_COLORS[index % CHART_COLORS.length]
    })).sort((a, b) => b.value - a.value);
  }, []);

  // Transform the revenue by program data into the format expected by the BarChart component
  const chartData: ChartDataPoint[] = useMemo(() => transformDataForChart(revenueByProgram), [revenueByProgram, transformDataForChart]);

  // Configure the chart axis with appropriate labels and formatting
  const xAxisConfig = {
    title: 'Program',
    type: 'category' as const
  };

  const yAxisConfig = {
    title: 'Revenue',
    type: 'linear' as const,
    format: 'currency'
  };

  // Render a Card component containing the chart title and BarChart
  return (
    <Card title="Revenue by Program" loading={loading}>
      {chartData.length > 0 ? (
        <>
          <Box height={300}>
            <BarChart
              data={chartData}
              xAxis={xAxisConfig}
              yAxis={yAxisConfig}
              onClick={handleBarClick}
            />
          </Box>
          <Divider />
          <Box padding={2}>
            <Typography variant="subtitle2" gutterBottom>
              Program Revenue Summary
            </Typography>
            {revenueByProgram?.map((item) => (
              <Box key={item.programId} display="flex" justifyContent="space-between">
                <Typography variant="body2">{item.programName}</Typography>
                <Typography variant="body2">
                  {formatCurrency(item.amount)} ({formatPercentage(item.percentage)})
                </Typography>
              </Box>
            ))}
          </Box>
        </>
      ) : (
        <Box padding={2}>
          <Typography variant="body1">No revenue data available for the selected filters.</Typography>
        </Box>
      )}
    </Card>
  );
};

export default RevenueByProgramChart;