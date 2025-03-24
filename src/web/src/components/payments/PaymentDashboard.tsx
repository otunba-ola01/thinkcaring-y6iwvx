# src/web/src/components/payments/PaymentDashboard.tsx
```typescript
import React, { useMemo } from 'react'; // v18.2.0
import { Box, Grid, Typography, Button, Skeleton, Divider } from '@mui/material'; // v5.13.0
import { Add, FileUpload, Visibility, AttachMoney, AccountBalance } from '@mui/icons-material'; // v5.13.0

import {
  PaymentDashboardProps,
  ReconciliationStatus,
  PaymentMethod,
  PaymentMetrics,
} from '../../types/payments.types';
import MetricCard from '../ui/MetricCard';
import Card from '../ui/Card';
import BarChart from '../charts/BarChart';
import PieChart from '../charts/PieChart';
import LineChart from '../charts/LineChart';
import AlertNotification from '../ui/AlertNotification';
import useResponsive from '../../hooks/useResponsive';
import { formatCurrency, formatNumber, formatPercentage } from '../../utils/format';

/**
 * A dashboard component that displays payment metrics, reconciliation status, payment trends, and quick actions
 *
 * @param {PaymentDashboardProps} props - The component props
 * @returns {JSX.Element} The rendered PaymentDashboard component
 */
const PaymentDashboard: React.FC<PaymentDashboardProps> = ({
  metrics,
  loading,
  onCreatePayment,
  onImportRemittance,
  onViewAll,
}) => {
  // Destructure props to extract metrics, loading, and callback functions
  const { breakpoint, isMobile } = useResponsive();

  // Prepare data for the reconciliation status chart from metrics
  const reconciliationStatusData = useMemo(() => {
    return prepareReconciliationStatusData(metrics);
  }, [metrics]);

  // Prepare data for the payment method breakdown chart from metrics
  const paymentMethodData = useMemo(() => {
    return preparePaymentMethodData(metrics);
  }, [metrics]);

  // Prepare data for the payment trend chart from metrics
  const paymentTrendData = useMemo(() => {
    return preparePaymentTrendData(metrics);
  }, [metrics]);

  // Prepare data for the payer breakdown chart from metrics
  const payerBreakdownData = useMemo(() => {
    return preparePayerBreakdownData(metrics);
  }, [metrics]);

  // Render a Grid container with appropriate spacing
  return (
    <Grid container spacing={2}>
      {/* Render MetricCards for total payments, total amount, average payment, and reconciliation rate */}
      <Grid item xs={12} sm={6} md={3}>
        <MetricCard
          title="Total Payments"
          value={loading ? <Skeleton /> : formatNumber(metrics?.totalPayments || 0)}
          loading={loading}
          icon={<AttachMoney />}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <MetricCard
          title="Total Amount"
          value={loading ? <Skeleton /> : formatCurrency(metrics?.totalAmount || 0)}
          loading={loading}
          icon={<AccountBalance />}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <MetricCard
          title="Average Payment"
          value={loading ? <Skeleton /> : formatCurrency(metrics?.averagePaymentAmount || 0)}
          loading={loading}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <MetricCard
          title="Reconciliation Rate"
          value={loading ? <Skeleton /> : formatPercentage(metrics?.reconciliationBreakdown.find(item => item.status === ReconciliationStatus.RECONCILED)?.count / metrics?.totalPayments || 0)}
          loading={loading}
        />
      </Grid>

      {/* Render a Card with the reconciliation status breakdown chart */}
      <Grid item xs={12} md={6}>
        <Card title="Reconciliation Status">
          {loading ? (
            <Skeleton variant="rectangular" height={300} />
          ) : (
            <PieChart data={reconciliationStatusData} height={300} />
          )}
        </Card>
      </Grid>

      {/* Render a Card with the payment method breakdown chart */}
      <Grid item xs={12} md={6}>
        <Card title="Payment Method Breakdown">
          {loading ? (
            <Skeleton variant="rectangular" height={300} />
          ) : (
            <PieChart data={paymentMethodData} height={300} />
          )}
        </Card>
      </Grid>

      {/* Render a Card with the payment trend chart */}
      <Grid item xs={12} md={8}>
        <Card title="Payment Trend">
          {loading ? (
            <Skeleton variant="rectangular" height={300} />
          ) : (
            <LineChart data={[
              {
                name: 'Payments',
                data: paymentTrendData.map(item => ({ x: item.period, y: item.amount }))
              }
            ]} height={300} />
          )}
        </Card>
      </Grid>

      {/* Render a Card with the payer breakdown chart */}
      <Grid item xs={12} md={4}>
        <Card title="Top Payers">
          {loading ? (
            <Skeleton variant="rectangular" height={300} />
          ) : (
            <BarChart data={payerBreakdownData} height={300} />
          )}
        </Card>
      </Grid>

      {/* Render a Card with quick action buttons for creating payments, importing remittance, and viewing all payments */}
      <Grid item xs={12}>
        <Card title="Quick Actions">
          <Box sx={{ display: 'flex', gap: 2, flexDirection: isMobile ? 'column' : 'row' }}>
            <Button variant="contained" startIcon={<Add />} onClick={onCreatePayment}>
              Create Payment
            </Button>
            <Button variant="outlined" startIcon={<FileUpload />} onClick={onImportRemittance}>
              Import Remittance
            </Button>
            <Button variant="text" startIcon={<Visibility />} onClick={onViewAll}>
              View All Payments
            </Button>
          </Box>
        </Card>
      </Grid>

      {/* Render an AlertNotification for unreconciled payments if applicable */}
      {metrics?.reconciliationBreakdown.find(item => item.status === ReconciliationStatus.UNRECONCILED)?.count > 0 && (
        <Grid item xs={12}>
          <AlertNotification
            message={`You have ${metrics?.reconciliationBreakdown.find(item => item.status === ReconciliationStatus.UNRECONCILED)?.count} unreconciled payments. Please reconcile them to ensure accurate financial records.`}
            severity="warning"
          />
        </Grid>
      )}
    </Grid>
  );
};

/**
 * Prepares data for the reconciliation status chart
 * @param {PaymentDashboardMetrics} metrics - The payment metrics
 * @returns {Array} Array of data points for the chart
 */
const prepareReconciliationStatusData = (metrics: PaymentMetrics) => {
  // Extract reconciliation breakdown from metrics
  const reconciliationBreakdown = metrics?.reconciliationBreakdown || [];

  // Map the breakdown to chart data points with labels, values, and colors
  return reconciliationBreakdown.map(item => ({
    label: item.status,
    value: item.amount,
    color: item.status === ReconciliationStatus.RECONCILED ? '#4CAF50' : '#FF9800',
  }));
};

/**
 * Prepares data for the payment method breakdown chart
 * @param {PaymentDashboardMetrics} metrics - The payment metrics
 * @returns {Array} Array of data points for the chart
 */
const preparePaymentMethodData = (metrics: PaymentMetrics) => {
  // Extract payment method breakdown from metrics
  const paymentMethodBreakdown = metrics?.paymentMethodBreakdown || [];

  // Map the breakdown to chart data points with labels, values, and colors
  return paymentMethodBreakdown.map(item => ({
    label: item.method,
    value: item.amount,
    color: item.method === PaymentMethod.EFT ? '#2196F3' : '#FFC107',
  }));
};

/**
 * Prepares data for the payment trend chart
 * @param {PaymentDashboardMetrics} metrics - The payment metrics
 * @returns {Array} Array of data points for the chart
 */
const preparePaymentTrendData = (metrics: PaymentMetrics) => {
  // Extract payment trend data from metrics
  const paymentTrend = metrics?.paymentTrend || [];

  // Map the trend data to chart data points with labels and values
  return paymentTrend.map(item => ({
    period: item.period,
    amount: item.amount,
  }));
};

/**
 * Prepares data for the payer breakdown chart
 * @param {PaymentDashboardMetrics} metrics - The payment metrics
 * @returns {Array} Array of data points for the chart
 */
const preparePayerBreakdownData = (metrics: PaymentMetrics) => {
  // Extract payments by payer from metrics
  const paymentsByPayer = metrics?.paymentsByPayer || [];

  // Map the payer data to chart data points with labels, values, and colors
  const payerData = paymentsByPayer.map(item => ({
    label: item.payerName,
    value: item.amount,
  }));

  // Sort by amount in descending order
  payerData.sort((a, b) => b.value - a.value);

  // Limit to top 5 payers for readability
  return payerData.slice(0, 5);
};

export default PaymentDashboard;