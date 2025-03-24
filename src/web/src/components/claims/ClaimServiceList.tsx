import React, { useMemo } from 'react'; // v18.2.0
import { Box, Typography, SxProps, Theme } from '@mui/material'; // v5.13.0
import DataTable from '../ui/DataTable';
import StatusBadge from '../ui/StatusBadge';
import { TableColumn } from '../../types/ui.types';
import { ServiceSummary, DocumentationStatus, BillingStatus } from '../../types/services.types';
import { ClaimService } from '../../types/claims.types';
import { formatCurrency, formatDate } from '../../utils/format';
import { Size } from '../../types/common.types';

/**
 * Interface defining the props for the ClaimServiceList component.
 * It includes services data, loading state, a service click handler, and styling options.
 */
interface ClaimServiceListProps {
  services: ServiceSummary[];
  loading?: boolean;
  onServiceClick?: (service: ServiceSummary) => void;
  sx?: SxProps<Theme>;
}

/**
 * A component that displays a list of services associated with a claim
 */
const ClaimServiceList: React.FC<ClaimServiceListProps> = ({
  services,
  loading,
  onServiceClick,
  sx,
}) => {
  /**
   * Define table columns for service data using useMemo
   * This ensures that the columns are only re-created when necessary
   */
  const columns: TableColumn[] = useMemo(
    () => [
      {
        field: 'serviceType',
        headerName: 'Service Type',
        width: 150,
        type: 'string',
        sortable: true,
      },
      {
        field: 'serviceDate',
        headerName: 'Date',
        width: 120,
        type: 'date',
        sortable: true,
      },
      {
        field: 'units',
        headerName: 'Units',
        width: 80,
        type: 'number',
        sortable: true,
      },
      {
        field: 'rate',
        headerName: 'Rate',
        width: 100,
        type: 'currency',
        sortable: true,
      },
      {
        field: 'amount',
        headerName: 'Amount',
        width: 120,
        type: 'currency',
        sortable: true,
      },
      {
        field: 'documentationStatus',
        headerName: 'Documentation',
        width: 150,
        type: 'status',
        statusType: 'documentation',
        sortable: true,
      },
      {
        field: 'billingStatus',
        headerName: 'Billing Status',
        width: 150,
        type: 'status',
        statusType: 'billing',
        sortable: true,
      },
    ],
    []
  );

  /**
   * Return a Box container with a title and DataTable component
   * Pass services data, columns configuration, and loading state to DataTable
   * Configure row click handler if onServiceClick is provided
   * Apply custom styling through the sx prop
   */
  return (
    <Box sx={{ width: '100%', ...sx }}>
      <Typography variant="h6" gutterBottom>
        Services
      </Typography>
      <DataTable
        columns={columns}
        data={services}
        loading={loading}
        onRowClick={onServiceClick}
      />
    </Box>
  );
};

export default ClaimServiceList;