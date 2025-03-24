import React, { useMemo } from 'react'; // v18.2.0
import { useSelector } from 'react-redux'; // v8.0.5
import { Box, Typography, Divider, Skeleton } from '@mui/material'; // v5.13.0

import Card from '../ui/Card';
import AgingChart from '../charts/AgingChart';
import useDashboard from '../../hooks/useDashboard';
import { selectAgingReceivables } from '../../store/dashboard/dashboardSelectors';
import { AgingReceivablesSummary } from '../../types/dashboard.types';
import { formatCurrency } from '../../utils/currency';

interface Props {
  className?: string;
}

/**
 * Component that displays accounts receivable aging data in a card with a chart
 * @param {object} props
 * @returns {JSX.Element} The rendered AgingReceivables component
 */
const AgingReceivables = (props: Props): JSX.Element => {
  // Destructure props to extract any custom props like className
  const { className } = props;

  // Use the useSelector hook with selectAgingReceivables to get aging data from Redux store
  const agingData = useSelector(selectAgingReceivables);

  // Use the useDashboard hook to access loading state
  const { loading } = useDashboard();

  // Use useMemo to transform the aging data into the format expected by AgingChart
  const chartData = useMemo(() => {
    return prepareChartData(agingData);
  }, [agingData]);

  // Handle loading state by showing skeleton placeholders when data is loading
  if (loading) {
    return (
      <Card title="Aging Receivables" className={className}>
        <Skeleton variant="rectangular" width="100%" height={200} />
        <Divider />
        <Box display="flex" justifyContent="space-between" mt={2}>
          <Skeleton variant="text" width={100} />
          <Skeleton variant="text" width={80} />
        </Box>
      </Card>
    );
  }

  // Handle empty or null data state by showing appropriate message
  if (!agingData) {
    return (
      <Card title="Aging Receivables" className={className}>
        <Typography variant="body1" color="textSecondary">
          No aging receivables data available.
        </Typography>
      </Card>
    );
  }

  // Render a Card component containing the aging receivables chart and summary
  return (
    <Card title="Aging Receivables" className={className}>
      {/* Render the AgingChart component with the prepared data */}
      <AgingChart data={chartData} />

      {/* Show a summary section with total outstanding amount */}
      <Divider style={{ marginTop: '1rem', marginBottom: '1rem' }} />
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="subtitle1">Total Outstanding</Typography>
        {/* Format all currency values using the formatCurrency utility */}
        <Typography variant="h6">{formatCurrency(agingData.total)}</Typography>
      </Box>
    </Card>
  );
};

/**
 * Transforms aging receivables data into the format required by the AgingChart component
 * @param {AgingReceivablesSummary} agingData
 * @returns {Array<{bucket: string; amount: number}>} Formatted data for the AgingChart
 */
const prepareChartData = (agingData: AgingReceivablesSummary | null) => {
  if (!agingData) {
    return [];
  }

  // Create an array of data points from the aging buckets
  const chartData = [
    { bucket: 'Current', amount: agingData.current },
    { bucket: '1-30 Days', amount: agingData.days1to30 },
    { bucket: '31-60 Days', amount: agingData.days31to60 },
    { bucket: '61-90 Days', amount: agingData.days61to90 },
    { bucket: '90+ Days', amount: agingData.days91Plus },
  ];

  // Map each bucket to an object with bucket name and amount
  return chartData.map((item) => ({
    bucket: item.bucket,
    amount: item.amount,
  }));
};

// Export the AgingReceivables component as the default export
export default AgingReceivables;