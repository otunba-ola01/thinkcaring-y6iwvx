import React, { useMemo, useEffect } from 'react'; // react v18.2.0
import { Box, Grid, Typography, Chip } from '@mui/material'; // v5.13.0

import FilterPanel from '../ui/FilterPanel';
import DateRangePicker from '../ui/DateRangePicker';
import StatusBadge from './StatusBadge';
import { ClaimStatus } from '../../types/claims.types';
import { FilterConfig, FilterType } from '../../types/ui.types';
import { CLAIM_STATUS_LABELS, DEFAULT_CLAIM_FILTERS } from '../../constants/claims.constants';
import useClaims from '../../hooks/useClaims';

/**
 * Interface for the ClaimFilter component props
 */
export interface ClaimFilterProps {
  onFilterChange: (filters: Record<string, any>) => void;
  initialValues?: Record<string, any>;
  loading: boolean;
  clientId?: string | undefined;
  payerId?: string | undefined;
  showStatusChips?: boolean;
  sx?: object;
}

/**
 * A specialized filter component for claims management
 */
const ClaimFilter: React.FC<ClaimFilterProps> = ({
  onFilterChange,
  initialValues,
  loading,
  clientId,
  payerId,
  showStatusChips,
  sx,
}) => {
  // Use the useClaims hook to access claim-related state and functionality
  const { statusCounts } = useClaims({});

  // Create a memoized array of filter configurations for the claims list
  const filters: FilterConfig[] = useMemo(() => [
    {
      id: 'status',
      label: 'Status',
      type: FilterType.MULTI_SELECT,
      field: 'claimStatus',
      operator: null,
      options: Object.entries(CLAIM_STATUS_LABELS).map(([key, label]) => ({
        value: key,
        label: label,
      })),
    },
    {
      id: 'dateRange',
      label: 'Date Range',
      type: FilterType.DATE_RANGE,
      field: 'serviceDate', // or 'submissionDate'
      operator: 'between',
    },
    {
      id: 'payerId',
      label: 'Payer',
      type: FilterType.SELECT,
      field: 'payerId',
      operator: 'eq',
      options: payerId ? [] : [
        { value: 'medicaid', label: 'Medicaid' },
        { value: 'medicare', label: 'Medicare' },
        { value: 'private', label: 'Private Insurance' },
      ],
    },
    {
      id: 'search',
      label: 'Search',
      type: FilterType.TEXT,
      field: 'claimNumber', // or 'clientName'
      operator: 'contains',
      placeholder: 'Search by Claim # or Client Name',
    },
  ], [payerId]);

  // If clientId is provided, add it to the filter values
  useEffect(() => {
    if (clientId) {
      onFilterChange({ ...initialValues, clientId });
    }
  }, [clientId, initialValues, onFilterChange]);

  // If payerId is provided, add it to the filter values
  useEffect(() => {
    if (payerId) {
      onFilterChange({ ...initialValues, payerId });
    }
  }, [payerId, initialValues, onFilterChange]);

  // Handle filter changes by calling the onFilterChange callback
  const handleFilterChange = (filters: Record<string, any>) => {
    onFilterChange(filters);
  };

  // Render the FilterPanel component with the configured filters
  return (
    <Box sx={sx}>
      <FilterPanel
        filters={filters}
        onFilterChange={handleFilterChange}
        initialValues={initialValues}
        loading={loading}
        collapsible
      />
      {showStatusChips && statusCounts && (
        <Box mt={2}>
          <Typography variant="subtitle2" gutterBottom>
            Quick Status Filters:
          </Typography>
          {renderStatusChips(statusCounts, (status) => {
            handleFilterChange({ ...initialValues, status });
          }, initialValues?.status)}
        </Box>
      )}
    </Box>
  );
};

/**
 * Renders clickable status chips for quick status filtering
 */
const renderStatusChips = (
  statusCounts: Record<ClaimStatus, number>,
  onStatusClick: (status: ClaimStatus | ClaimStatus[] | undefined) => void,
  selectedStatus: ClaimStatus | ClaimStatus[] | undefined
): JSX.Element => {
  // Create a Box container for the status chips
  return (
    <Box display="flex" flexWrap="wrap" gap={1}>
      {/* Map through the ClaimStatus enum values */}
      {Object.values(ClaimStatus).map((status) => (
        <Chip
          key={status}
          label={`${CLAIM_STATUS_LABELS[status]} (${statusCounts[status] || 0})`}
          onClick={() => {
            // Handle click events to toggle status selection
            if (Array.isArray(selectedStatus)) {
              if (selectedStatus.includes(status)) {
                onStatusClick(selectedStatus.filter((s) => s !== status));
              } else {
                onStatusClick([...selectedStatus, status]);
              }
            } else if (selectedStatus === status) {
              onStatusClick(undefined);
            } else {
              onStatusClick(status);
            }
          }}
          /* Apply selected styling if the status is currently selected */
          color={Array.isArray(selectedStatus) && selectedStatus.includes(status) || selectedStatus === status ? 'primary' : 'default'}
          variant={Array.isArray(selectedStatus) && selectedStatus.includes(status) || selectedStatus === status ? 'contained' : 'outlined'}
        />
      ))}
    </Box>
  );
};

export default ClaimFilter;

// Export the ClaimFilter component as the default export
export type { ClaimFilterProps };