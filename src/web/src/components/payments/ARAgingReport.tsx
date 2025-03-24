# src/web/src/components/payments/ARAgingReport.tsx
```typescript
import React, { useEffect, useMemo } from 'react'; // v18.2.0
import { Box, Typography, Divider, Grid, Skeleton } from '@mui/material'; // v5.13.0
import Card from '../ui/Card';
import AgingChart from '../charts/AgingChart';
import { usePayments } from '../../hooks/usePayments';
import { AccountsReceivableAging } from '../../types/payments.types';
import { formatCurrency } from '../../utils/currency';
import { formatDate } from '../../utils/date';

/**
 * Interface defining the props for the ARAgingReport component.
 * Extends the base properties with optional filtering parameters.
 */
interface ARAgingReportProps {
  dateRange?: { startDate: string; endDate: string };
  payerId?: string;
  programId?: string;
  showChart?: boolean;
  showSummary?: boolean;
  height?: number | string;
  onRefresh?: () => void;
}

/**
 * Component that displays accounts receivable aging information with a chart visualization.
 * This component helps financial managers track outstanding payments categorized by aging buckets
 * (current, 1-30 days, 31-60 days, 61-90 days, 90+ days).
 *
 * @param {ARAgingReportProps} props - The component props
 * @returns {JSX.Element} The rendered ARAgingReport component
 */
const ARAgingReport = (props: ARAgingReportProps): JSX.Element => {
  // Destructure props to extract dateRange, payerId, programId, and other optional props
  const { dateRange, payerId, programId, showChart = true, showSummary = true, height = 300, onRefresh } = props;

  // Use the usePayments hook to access accounts receivable data and fetch function
  const { accountsReceivable, fetchAccountsReceivable, loading } = usePayments();

  // Use useEffect to fetch accounts receivable data when component mounts or dependencies change
  useEffect(() => {
    fetchAccountsReceivable(dateRange?.startDate, payerId, programId);
  }, [fetchAccountsReceivable, dateRange?.startDate, payerId, programId]);

  // Use useMemo to transform the accounts receivable data into the format expected by AgingChart
  const chartData = useMemo(() => {
    return transformAgingDataForChart(accountsReceivable?.aging);
  }, [accountsReceivable?.aging]);

  // Render a Card component with title 'Accounts Receivable Aging'
  return (
    <Card title="Accounts Receivable Aging">
      {loading ? (
        // If loading, display skeleton placeholders
        <Box sx={{ width: '100%', height: height }}>
          <Skeleton variant="rectangular" width="100%" height={height} />
        </Box>
      ) : (
        <>
          {showChart && chartData && (
            // If data is available, render the AgingChart with the transformed data
            <AgingChart data={chartData} height={height} />
          )}
          {showSummary && accountsReceivable?.aging && (
            // Below the chart, display a summary section with total outstanding amount
            <Box mt={2}>
              <Typography variant="subtitle1">Total Outstanding: {formatCurrency(accountsReceivable.aging.totalOutstanding)}</Typography>
              <Grid container spacing={2}>
                {/* Display a breakdown of aging buckets with amounts and percentages */}
                <Grid item xs={6} md={3}>
                  <Typography variant="body2">Current: {formatCurrency(accountsReceivable.aging.current)}</Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="body2">1-30 Days: {formatCurrency(accountsReceivable.aging.days1to30)}</Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="body2">31-60 Days: {formatCurrency(accountsReceivable.aging.days31to60)}</Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="body2">61-90 Days: {formatCurrency(accountsReceivable.aging.days61to90)}</Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="body2">90+ Days: {formatCurrency(accountsReceivable.aging.days91Plus)}</Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </>
      )}
    </Card>
  );
};

/**
 * Transforms accounts receivable aging data into the format expected by the AgingChart component.
 *
 * @param {AccountsReceivableAging | null} aging - The accounts receivable aging data
 * @returns {Array<{ bucket: string; amount: number }>} Formatted data for the AgingChart component
 */
const transformAgingDataForChart = (aging: AccountsReceivableAging | null): Array<{ bucket: string; amount: number }> => {
  // If aging data is null, return an empty array
  if (!aging) {
    return [];
  }

  // Create an array of data points with bucket names and amounts
  return [
    { bucket: 'Current', amount: aging.current },
    { bucket: '1-30 Days', amount: aging.days1to30 },
    { bucket: '31-60 Days', amount: aging.days31to60 },
    { bucket: '61-90 Days', amount: aging.days61to90 },
    { bucket: '90+ Days', amount: aging.days91Plus },
  ];
};

/**
 * Calculates the percentage of a value relative to a total.
 *
 * @param {number} value - The value to calculate percentage for
 * @param {number} total - The total value
 * @returns {number} The percentage value
 */
const calculatePercentage = (value: number, total: number): number => {
  // If total is zero, return 0 to avoid division by zero
  if (total === 0) {
    return 0;
  }

  // Calculate the percentage by dividing value by total and multiplying by 100
  const percentage = (value / total) * 100;

  // Round to one decimal place
  return parseFloat(percentage.toFixed(1));
};

// Export the ARAgingReport component as the default export
export default ARAgingReport;