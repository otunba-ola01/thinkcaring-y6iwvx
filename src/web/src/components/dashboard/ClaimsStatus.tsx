import React, { useMemo } from 'react'; // v18.2.0
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Skeleton, useTheme } from '@mui/material'; // v5.13.0
import Card from '../ui/Card';
import StatusDistributionChart from '../charts/StatusDistributionChart';
import useDashboard from '../../hooks/useDashboard';
import { ClaimStatus } from '../../types/claims.types';
import { CLAIM_STATUS_LABELS, CLAIM_STATUS_COLORS } from '../../constants/claims.constants';
import { formatCurrency } from '../../utils/currency';
import { ClaimStatusBreakdown, LoadingState } from '../../types/dashboard.types';

/**
 * A component that displays the distribution of claims by status using a pie chart and a summary table
 * @param {object} props - Component props
 * @returns {JSX.Element} The rendered ClaimsStatus component
 */
const ClaimsStatus = (props: { className?: string }): JSX.Element => {
  // LD1: Destructure props to extract any custom props like className
  const { className } = props;

  // LD1: Use the useDashboard hook to access dashboard data, loading state, and error state
  const { claimsMetrics, loading, error, claimStatusBreakdown } = useDashboard();

  // LD1: Use the useTheme hook to access the current theme for styling
  const theme = useTheme();

  // LD1: Extract claims metrics and status breakdown from the dashboard data
  const totalClaims = claimsMetrics?.totalClaims || 0;

  // LD1: Use useMemo to transform the status breakdown data into the format expected by StatusDistributionChart
  const chartData = useMemo(() => {
    if (!claimStatusBreakdown) return [];
    return transformStatusData(claimStatusBreakdown);
  }, [claimStatusBreakdown]);

  // LD1: Render a Card component with a title 'Claims Status'
  return (
    <Card title="Claims Status" className={className}>
      {loading === LoadingState.LOADING ? (
        // LD1: Handle loading state by showing skeletons when data is loading
        <Box sx={{ p: 2 }}>
          <Skeleton variant="rectangular" width="100%" height={200} />
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Count</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell align="right">Percentage</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Array.from({ length: 3 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell><Skeleton variant="text" /></TableCell>
                    <TableCell align="right"><Skeleton variant="text" /></TableCell>
                    <TableCell align="right"><Skeleton variant="text" /></TableCell>
                    <TableCell align="right"><Skeleton variant="text" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      ) : error ? (
        // LD1: Handle error state by showing an error message when data fetching fails
        <Box sx={{ p: 2, color: theme.palette.error.main }}>
          <Typography variant="body1">Error: {error}</Typography>
        </Box>
      ) : !claimStatusBreakdown || claimStatusBreakdown.length === 0 ? (
        // LD1: Handle empty state by showing a message when no claims data is available
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="body1" color="textSecondary">No claims data available.</Typography>
        </Box>
      ) : (
        // LD1: Apply appropriate spacing and styling based on the current theme
        <Box sx={{ p: 2 }}>
          {/* LD1: Render a StatusDistributionChart component with the transformed status data */}
          <StatusDistributionChart data={chartData} />

          {/* LD1: Render a table below the chart showing status breakdown details (status, count, amount, percentage) */}
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Count</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell align="right">Percentage</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {claimStatusBreakdown.map((status) => (
                  <TableRow key={status.status}>
                    <TableCell>{CLAIM_STATUS_LABELS[status.status] || status.status}</TableCell>
                    <TableCell align="right">{status.count}</TableCell>
                    <TableCell align="right">{formatCurrency(status.amount)}</TableCell>
                    <TableCell align="right">
                      {totalClaims > 0 ? ((status.count / totalClaims) * 100).toFixed(1) + '%' : '0.0%'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Card>
  );
};

/**
 * Transforms the claim status breakdown data into the format expected by the StatusDistributionChart component
 * @param {ClaimStatusBreakdown[]} statusBreakdown
 * @returns {Array<{ status: string; count: number; color?: string }>} Transformed data for the StatusDistributionChart
 */
const transformStatusData = (statusBreakdown: ClaimStatusBreakdown[]): Array<{ status: string; count: number; color?: string }> => {
  // LD1: Map each status breakdown item to the format expected by StatusDistributionChart
  return statusBreakdown.map(item => {
    // LD1: Extract status and count from each item
    const { status, count } = item;

    // LD1: Get the appropriate color for each status from CLAIM_STATUS_COLORS
    const color = CLAIM_STATUS_COLORS[status];

    // LD1: Return the transformed array
    return { status, count, color };
  });
};

// IE3: Be generous about your exports so long as it doesn't create a security risk.
export default ClaimsStatus;