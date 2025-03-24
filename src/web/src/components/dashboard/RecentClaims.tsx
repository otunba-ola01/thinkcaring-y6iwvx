import React, { useState, useEffect, useMemo } from 'react'; // react v18.2.0
import { useRouter } from 'next/router'; // next/router v13.4.0
import { Box, Typography, Button } from '@mui/material'; // @mui/material v5.13.0

import DataTable from '../ui/DataTable';
import StatusBadge from '../ui/StatusBadge';
import Card from '../ui/Card';
import useClaims from '../../hooks/useClaims';
import useResponsive from '../../hooks/useResponsive';
import { ClaimSummary, ClaimStatus } from '../../types/claims.types';
import { TableColumn } from '../../types/ui.types';
import { formatCurrency } from '../../utils/currency';

/**
 * Interface defining the props for the RecentClaims component
 */
interface RecentClaimsProps {
  /**
   * Maximum number of claims to display
   */
  limit: number;
  /**
   * Title of the recent claims section
   */
  title: string;
  /**
   * Link to view all claims
   */
  viewAllHref?: string;
}

/**
 * Component that displays a list of recent claims on the dashboard
 *
 * @param {RecentClaimsProps} props - The component props
 * @returns {JSX.Element} The rendered RecentClaims component
 */
const RecentClaims: React.FC<RecentClaimsProps> = (props) => {
  // Destructure props to extract limit, title, and viewAllHref
  const { limit, title, viewAllHref } = props;

  // Initialize router using useRouter hook for navigation
  const router = useRouter();

  // Initialize responsive hook to determine current device size
  const { isMobile } = useResponsive();

  // Set up useClaims hook with appropriate options (limit, sort by newest first, autoFetch enabled)
  const { claims, loading, fetchClaims } = useClaims({
    initialSort: [{ field: 'claimNumber', direction: 'desc' }],
    autoFetch: true,
    initialPageSize: limit,
  });

  // Define columns for the DataTable with appropriate configuration
  const getClaimColumns = (isMobile: boolean): TableColumn[] => {
    // Define base columns that are shown on all device sizes
    const baseColumns: TableColumn[] = [
      {
        field: 'claimNumber',
        headerName: 'Claim #',
        width: 120,
      },
      {
        field: 'clientName',
        headerName: 'Client',
        width: 150,
      },
      {
        field: 'amount',
        headerName: 'Amount',
        width: 100,
        type: 'currency',
        valueFormatter: formatCurrency,
      },
      {
        field: 'status',
        headerName: 'Status',
        width: 130,
        type: 'status',
        statusType: 'claim',
        renderCell: (params: any) => (
          <StatusBadge status={params.value} type="claim" />
        ),
      },
    ];

    // For mobile view, return a reduced set of columns (claim number, client, amount, status)
    if (isMobile) {
      return baseColumns.filter((column) =>
        ['claimNumber', 'clientName', 'amount', 'status'].includes(column.field)
      );
    }

    // For desktop view, return all columns (claim number, client, service type, amount, status, payer, age)
    return [
      ...baseColumns.slice(0, 2),
      {
        field: 'serviceType',
        headerName: 'Service',
        width: 150,
      },
      ...baseColumns.slice(2, 4),
      {
        field: 'payerName',
        headerName: 'Payer',
        width: 120,
      },
      {
        field: 'claimAge',
        headerName: 'Age',
        width: 80,
      },
    ];
  };

  // Memoize the columns to prevent re-renders
  const columns = useMemo(() => getClaimColumns(isMobile), [isMobile]);

  // Handle row click to navigate to claim details page
  const handleRowClick = (row: ClaimSummary) => {
    router.push(`/claims/${row.id}`);
  };

  // Render a Card component containing the recent claims
  return (
    <Card
      title={
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">{title}</Typography>
          {viewAllHref && (
            <Button color="primary" onClick={() => router.push(viewAllHref)}>
              View All
            </Button>
          )}
        </Box>
      }
    >
      {/* Render DataTable with claims data, defined columns, and loading state */}
      <DataTable
        columns={columns}
        data={claims}
        loading={loading === 'LOADING'}
        onRowClick={handleRowClick}
      />
    </Card>
  );
};

export default RecentClaims;