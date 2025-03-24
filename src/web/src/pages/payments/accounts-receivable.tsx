import React, { useState, useEffect, useCallback } from 'react'; // react v18.2.0
import Head from 'next/head'; // next/head v13.4+
import { Box, Typography, Grid, Divider, Button, Skeleton } from '@mui/material'; // @mui/material v5.13.0
import { GetServerSideProps } from 'next'; // next v13.4+

import MainLayout from '../../components/layout/MainLayout';
import ARAgingReport from '../../components/payments/ARAgingReport';
import PaymentFilter from '../../components/payments/PaymentFilter';
import usePayments from '../../hooks/usePayments';
import Card from '../../components/ui/Card';
import { formatCurrency } from '../../utils/currency';
import { formatDate } from '../../utils/date';
import { AccountsReceivableAging } from '../../types/payments.types';

/**
 * Interface for the filter state used in the accounts receivable page
 */
interface FilterState {
  dateRange: { startDate: string; endDate: string };
  payerId: string | null;
  programId: string | null;
}

/**
 * Page component that displays accounts receivable aging information
 * @returns {JSX.Element} The rendered AccountsReceivablePage component
 */
const AccountsReceivablePage: React.FC = () => {
  // 1. Initialize state for filter parameters (dateRange, payerId, programId)
  const [filterState, setFilterState] = useState<FilterState>({
    dateRange: { startDate: '', endDate: '' },
    payerId: null,
    programId: null,
  });

  // 2. Get accounts receivable data and related functions from usePayments hook
  const { accountsReceivable, isLoading, fetchAccountsReceivable, clearAccountsReceivable } = usePayments();

  // 3. Define a handleFilterChange function to update filter state when filters change
  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilterState((prev) => ({ ...prev, ...newFilters }));
  };

  // 4. Define a handleRefresh function to refresh accounts receivable data
  const handleRefresh = useCallback(() => {
    fetchAccountsReceivable(filterState.dateRange.startDate, filterState.payerId, filterState.programId);
  }, [fetchAccountsReceivable, filterState.dateRange.startDate, filterState.payerId, filterState.programId]);

  // 5. Use useEffect to fetch accounts receivable data when component mounts or filters change
  useEffect(() => {
    fetchAccountsReceivable(filterState.dateRange.startDate, filterState.payerId, filterState.programId);
  }, [fetchAccountsReceivable, filterState.dateRange.startDate, filterState.payerId, filterState.programId]);

  // 6. Use useEffect to clean up by clearing accounts receivable data when component unmounts
  useEffect(() => {
    return () => {
      clearAccountsReceivable();
    };
  }, [clearAccountsReceivable]);

  // 7. Render the page with MainLayout component
  return (
    <MainLayout>
      {/* 8. Include Head component with page title and metadata */}
      <Head>
        <title>Accounts Receivable - ThinkCaring</title>
        <meta name="description" content="Accounts Receivable Aging Report" />
      </Head>

      {/* 9. Render page header with title and action buttons */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h4" component="h1">
          Accounts Receivable
        </Typography>
        <Divider />
      </Box>

      {/* 10. Render PaymentFilter component for filtering accounts receivable data */}
      <PaymentFilter onFilterChange={handleFilterChange} />

      {/* 11. Render ARAgingReport component to display aging data visualization */}
      <ARAgingReport
        dateRange={filterState.dateRange}
        payerId={filterState.payerId}
        programId={filterState.programId}
        onRefresh={handleRefresh}
      />

      {/* 12. Render detailed breakdown sections for aging by payer and program */}
      <Grid container spacing={2} mt={2}>
        <Grid item xs={12} md={6}>
          {renderAgingByPayerSection(accountsReceivable?.aging, isLoading)}
        </Grid>
        <Grid item xs={12} md={6}>
          {renderAgingByProgramSection(accountsReceivable?.aging, isLoading)}
        </Grid>
      </Grid>
    </MainLayout>
  );
};

// 13. Implement responsive layout using Grid components

/**
 * Helper function to render the aging by payer breakdown section
 * @param {AccountsReceivableAging | null} aging - The accounts receivable aging data
 * @param {boolean} isLoading - A boolean indicating if the data is loading
 * @returns {JSX.Element} The rendered aging by payer section
 */
const renderAgingByPayerSection = (aging: AccountsReceivableAging | null, isLoading: boolean): JSX.Element => {
  // 1. Render a Card component with title 'Aging by Payer'
  return (
    <Card title="Aging by Payer">
      {isLoading ? (
        // 2. If loading, display skeleton placeholders
        <Skeleton variant="rectangular" width="100%" height={200} />
      ) : aging ? (
        // 3. If data is available, render a table with payer aging breakdown
        <Box>
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <Typography variant="subtitle2">Payer</Typography>
            </Grid>
            <Grid item xs={2}>
              <Typography variant="subtitle2">Current</Typography>
            </Grid>
            <Grid item xs={2}>
              <Typography variant="subtitle2">1-90 Days</Typography>
            </Grid>
            <Grid item xs={2}>
              <Typography variant="subtitle2">90+ Days</Typography>
            </Grid>
            <Grid item xs={2}>
              <Typography variant="subtitle2">Total</Typography>
            </Grid>
          </Grid>
          <Divider sx={{ my: 1 }} />
          {aging.agingByPayer.map((payer) => (
            <Grid container spacing={2} key={payer.payerName}>
              {/* 4. Include columns for payer name, current, 1-30 days, 31-60 days, 61-90 days, 90+ days, and total */}
              <Grid item xs={4}>
                <Typography variant="body2">{payer.payerName}</Typography>
              </Grid>
              <Grid item xs={2}>
                {/* 5. Format currency values appropriately */}
                <Typography variant="body2">{formatCurrency(payer.current)}</Typography>
              </Grid>
              <Grid item xs={2}>
                <Typography variant="body2">
                  {formatCurrency(payer.days1to30 + payer.days31to60 + payer.days61to90)}
                </Typography>
              </Grid>
              <Grid item xs={2}>
                <Typography variant="body2">{formatCurrency(payer.days91Plus)}</Typography>
              </Grid>
              <Grid item xs={2}>
                <Typography variant="body2">{formatCurrency(payer.total)}</Typography>
              </Grid>
            </Grid>
          ))}
          <Divider sx={{ my: 1 }} />
          <Grid container spacing={2}>
            <Grid item xs={4}>
              {/* 6. Include a total row at the bottom */}
              <Typography variant="subtitle2">Total</Typography>
            </Grid>
            <Grid item xs={2}>
              <Typography variant="body2">{formatCurrency(aging.current)}</Typography>
            </Grid>
            <Grid item xs={2}>
              <Typography variant="body2">
                {formatCurrency(aging.days1to30 + aging.days31to60 + aging.days61to90)}
              </Typography>
            </Grid>
            <Grid item xs={2}>
              <Typography variant="body2">{formatCurrency(aging.days91Plus)}</Typography>
            </Grid>
            <Grid item xs={2}>
              <Typography variant="body2">{formatCurrency(aging.totalOutstanding)}</Typography>
            </Grid>
          </Grid>
        </Box>
      ) : (
        <Typography>No data available</Typography>
      )}
    </Card>
  );
};

/**
 * Helper function to render the aging by program breakdown section
 * @param {AccountsReceivableAging | null} aging - The accounts receivable aging data
 * @param {boolean} isLoading - A boolean indicating if the data is loading
 * @returns {JSX.Element} The rendered aging by program section
 */
const renderAgingByProgramSection = (aging: AccountsReceivableAging | null, isLoading: boolean): JSX.Element => {
  // 1. Render a Card component with title 'Aging by Program'
  return (
    <Card title="Aging by Program">
      {isLoading ? (
        // 2. If loading, display skeleton placeholders
        <Skeleton variant="rectangular" width="100%" height={200} />
      ) : aging ? (
        // 3. If data is available, render a table with program aging breakdown
        <Box>
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <Typography variant="subtitle2">Program</Typography>
            </Grid>
            <Grid item xs={2}>
              <Typography variant="subtitle2">Current</Typography>
            </Grid>
            <Grid item xs={2}>
              <Typography variant="subtitle2">1-90 Days</Typography>
            </Grid>
            <Grid item xs={2}>
              <Typography variant="subtitle2">90+ Days</Typography>
            </Grid>
            <Grid item xs={2}>
              <Typography variant="subtitle2">Total</Typography>
            </Grid>
          </Grid>
          <Divider sx={{ my: 1 }} />
          {aging.agingByProgram.map((program) => (
            <Grid container spacing={2} key={program.programName}>
              {/* 4. Include columns for program name, current, 1-30 days, 31-60 days, 61-90 days, 90+ days, and total */}
              <Grid item xs={4}>
                <Typography variant="body2">{program.programName}</Typography>
              </Grid>
              <Grid item xs={2}>
                {/* 5. Format currency values appropriately */}
                <Typography variant="body2">{formatCurrency(program.current)}</Typography>
              </Grid>
              <Grid item xs={2}>
                <Typography variant="body2">
                  {formatCurrency(program.days1to30 + program.days31to60 + program.days61to90)}
                </Typography>
              </Grid>
              <Grid item xs={2}>
                <Typography variant="body2">{formatCurrency(program.days91Plus)}</Typography>
              </Grid>
              <Grid item xs={2}>
                <Typography variant="body2">{formatCurrency(program.total)}</Typography>
              </Grid>
            </Grid>
          ))}
          <Divider sx={{ my: 1 }} />
          <Grid container spacing={2}>
            <Grid item xs={4}>
              {/* 6. Include a total row at the bottom */}
              <Typography variant="subtitle2">Total</Typography>
            </Grid>
            <Grid item xs={2}>
              <Typography variant="body2">{formatCurrency(aging.current)}</Typography>
            </Grid>
            <Grid item xs={2}>
              <Typography variant="body2">
                {formatCurrency(aging.days1to30 + aging.days31to60 + aging.days61to90)}
              </Typography>
            </Grid>
            <Grid item xs={2}>
              <Typography variant="body2">{formatCurrency(aging.days91Plus)}</Typography>
            </Grid>
            <Grid item xs={2}>
              <Typography variant="body2">{formatCurrency(aging.totalOutstanding)}</Typography>
            </Grid>
          </Grid>
        </Box>
      ) : (
        <Typography>No data available</Typography>
      )}
    </Card>
  );
};

/**
 * Server-side function to handle initial data loading and authentication
 */
export const getServerSideProps: GetServerSideProps = async (context) => {
  // 1. Check if user is authenticated
  // TODO: Implement authentication check
  const isAuthenticated = true; // Placeholder

  // 2. If not authenticated, redirect to login page
  if (!isAuthenticated) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  // 3. Return empty props object as data will be fetched client-side
  return {
    props: {},
  };
};

export default AccountsReceivablePage;