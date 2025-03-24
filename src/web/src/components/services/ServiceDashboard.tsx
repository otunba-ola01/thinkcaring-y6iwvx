import React, { useState, useEffect, useMemo } from 'react'; // react v18.2.0
import { Grid, Box, Typography, Divider, Button, Stack, useTheme } from '@mui/material'; // @mui/material v5.13.0
import { Add, Assignment, Assessment, MonetizationOn } from '@mui/icons-material'; // @mui/icons-material v5.13.0
import { useRouter } from 'next/router'; // next/router v13.4.0

import useServices from '../../hooks/useServices';
import MetricCard from '../ui/MetricCard';
import Card from '../ui/Card';
import StatusDistributionChart from '../charts/StatusDistributionChart';
import BarChart from '../charts/BarChart';
import ActionButton from '../ui/ActionButton';
import AlertNotification from '../ui/AlertNotification';
import { DOCUMENTATION_STATUS_LABELS, DOCUMENTATION_STATUS_COLORS, BILLING_STATUS_LABELS, BILLING_STATUS_COLORS } from '../../constants/services.constants';
import { formatCurrency } from '../../utils/format';
import { ServiceDashboardProps } from '../../types/dashboard.types';
import { ServiceMetrics, DocumentationStatus, BillingStatus } from '../../types/services.types';

/**
 * A dashboard component that displays key service metrics, status distributions, and trends
 * @param props - The component props
 * @returns The rendered ServiceDashboard component
 */
const ServiceDashboard: React.FC<ServiceDashboardProps> = (props: ServiceDashboardProps): JSX.Element => {
  // 1. Initialize the router for navigation
  const router = useRouter();

  // 2. Initialize the useServices hook to fetch service metrics
  const {
    serviceMetrics,
    fetchServiceMetrics,
    isFetchingMetrics
  } = useServices();

  // 3. Use useEffect to fetch service metrics on component mount
  useEffect(() => {
    fetchServiceMetrics();
  }, [fetchServiceMetrics]);

  // 4. Transform documentation status data for the StatusDistributionChart
  const documentationStatusData = useMemo(() => {
    return transformDocumentationStatusData(serviceMetrics);
  }, [serviceMetrics]);

  // 5. Transform billing status data for the StatusDistributionChart
  const billingStatusData = useMemo(() => {
    return transformBillingStatusData(serviceMetrics);
  }, [serviceMetrics]);

  // 6. Transform program data for the BarChart
  const programData = useMemo(() => {
    return transformProgramData(serviceMetrics);
  }, [serviceMetrics]);

  // Access the theme for styling purposes
  const theme = useTheme();

  // 7. Render a Grid container with responsive spacing
  return (
    <Grid container spacing={3}>
      {/* 8. Render MetricCards for total services, unbilled services, and unbilled amount */}
      <Grid item xs={12} md={4}>
        <MetricCard
          title="Total Services"
          value={serviceMetrics?.totalServices || 0}
          loading={isFetchingMetrics}
          icon={<Assignment />}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <MetricCard
          title="Unbilled Services"
          value={serviceMetrics?.totalUnbilledServices || 0}
          loading={isFetchingMetrics}
          icon={<Assessment />}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <MetricCard
          title="Unbilled Amount"
          value={formatCurrency(serviceMetrics?.totalUnbilledAmount || 0)}
          loading={isFetchingMetrics}
          icon={<MonetizationOn />}
        />
      </Grid>

      {/* 9. Render StatusDistributionChart for documentation status */}
      <Grid item xs={12} md={6}>
        <StatusDistributionChart
          title="Documentation Status"
          data={documentationStatusData}
          loading={isFetchingMetrics}
        />
      </Grid>

      {/* 10. Render StatusDistributionChart for billing status */}
      <Grid item xs={12} md={6}>
        <StatusDistributionChart
          title="Billing Status"
          data={billingStatusData}
          loading={isFetchingMetrics}
        />
      </Grid>

      {/* 11. Render BarChart for services by program */}
      <Grid item xs={12}>
        <BarChart
          title="Services by Program"
          data={programData}
          xAxis={{ type: 'category', title: 'Program' }}
          yAxis={{ type: 'number', title: 'Number of Services' }}
          loading={isFetchingMetrics}
        />
      </Grid>

      {/* 12. Render AlertNotification for services with incomplete documentation */}
      {serviceMetrics?.incompleteDocumentation > 0 && (
        <Grid item xs={12}>
          <AlertNotification
            message={`There are ${serviceMetrics.incompleteDocumentation} services with incomplete documentation.`}
            severity="warning"
          />
        </Grid>
      )}

      {/* 13. Render quick action buttons for creating services, validating services, and viewing reports */}
      <Grid item xs={12}>
        <Card title="Quick Actions">
          <Stack direction="row" spacing={2}>
            <ActionButton label="Create Service" icon={<Add />} onClick={handleCreateService} />
            <ActionButton label="Validate Services" icon={<Assignment />} onClick={handleValidateServices} />
            <ActionButton label="View Reports" icon={<Assessment />} onClick={handleViewReports} />
          </Stack>
        </Card>
      </Grid>
    </Grid>
  );
};

/**
 * Transforms service metrics documentation status data for the StatusDistributionChart
 * @param metrics 
 * @returns Transformed data for the chart
 */
const transformDocumentationStatusData = (metrics: ServiceMetrics | null): Array<{ status: string; count: number; color: string }> => {
  // If metrics is null, return an empty array
  if (!metrics) {
    return [];
  }

  // Create an array of status objects with counts and colors
  return [
    {
      status: DocumentationStatus.INCOMPLETE,
      count: metrics.totalServices - metrics.totalServices,
      color: DOCUMENTATION_STATUS_COLORS[DocumentationStatus.INCOMPLETE],
    },
    {
      status: DocumentationStatus.COMPLETE,
      count: metrics.totalServices - metrics.totalServices,
      color: DOCUMENTATION_STATUS_COLORS[DocumentationStatus.COMPLETE],
    },
  ];
};

/**
 * Transforms service metrics billing status data for the StatusDistributionChart
 * @param metrics 
 * @returns Transformed data for the chart
 */
const transformBillingStatusData = (metrics: ServiceMetrics | null): Array<{ status: string; count: number; color: string }> => {
  // If metrics is null, return an empty array
  if (!metrics) {
    return [];
  }

  // Create an array of status objects with counts and colors
  return [
    {
      status: BillingStatus.UNBILLED,
      count: metrics.totalServices - metrics.totalServices,
      color: BILLING_STATUS_COLORS[BillingStatus.UNBILLED],
    },
    {
      status: BillingStatus.BILLED,
      count: metrics.totalServices - metrics.totalServices,
      color: BILLING_STATUS_COLORS[BillingStatus.BILLED],
    },
  ];
};

/**
 * Transforms service metrics program data for the BarChart
 * @param metrics 
 * @returns Transformed data for the chart
 */
const transformProgramData = (metrics: ServiceMetrics | null): Array<{ label: string; value: number }> => {
  // If metrics is null, return an empty array
  if (!metrics) {
    return [];
  }

  // Map servicesByProgram data to the format expected by BarChart
  return metrics.servicesByProgram
    .map(program => ({
      label: program.programName,
      value: program.count,
    }))
    .sort((a, b) => b.value - a.value);
};

/**
 * Handles navigation to the service creation page
 */
const handleCreateService = (): void => {
  const router = useRouter();
  router.push('/services/new');
};

/**
 * Handles navigation to the service validation page
 */
const handleValidateServices = (): void => {
  const router = useRouter();
  router.push('/services/validation');
};

/**
 * Handles navigation to the service reports page
 */
const handleViewReports = (): void => {
  const router = useRouter();
  router.push('/reports/selection?type=services');
};

export default ServiceDashboard;