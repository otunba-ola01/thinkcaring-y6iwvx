import React, { useMemo } from 'react';
import { Box, SxProps, Theme } from '@mui/material'; // v5.13.0

import FilterPanel from '../ui/FilterPanel';
import { FilterConfig, FilterType } from '../../types/ui.types';
import { BillingQueueFilter } from '../../types/billing.types';
import { DOCUMENTATION_STATUS_LABELS, BILLING_STATUS_LABELS } from '../../constants/services.constants';
import useFilter from '../../hooks/useFilter';

/**
 * Interface for BillingFilter component props
 */
export interface BillingFilterProps {
  /**
   * Callback triggered when filters change
   */
  onFilterChange: (filters: Record<string, any>) => void;
  
  /**
   * Initial filter values
   */
  initialValues?: Partial<BillingQueueFilter>;
  
  /**
   * Whether the component is in a loading state
   */
  loading?: boolean;
  
  /**
   * Custom styles to apply to the component
   */
  sx?: SxProps<Theme>;
}

/**
 * A specialized filter component for the billing workflow
 * Provides filtering capabilities for the billing queue and dashboard
 */
const BillingFilter: React.FC<BillingFilterProps> = ({
  onFilterChange,
  initialValues = {},
  loading = false,
  sx = {}
}) => {
  // Get filter configurations
  const filterConfigs = useMemo(() => getBillingFilterConfigs(), []);
  
  return (
    <FilterPanel
      filters={filterConfigs}
      onFilterChange={onFilterChange}
      initialValues={initialValues}
      loading={loading}
      sx={sx}
    />
  );
};

/**
 * Creates filter configurations specific to the billing workflow
 */
const getBillingFilterConfigs = (): FilterConfig[] => {
  return [
    {
      id: 'clientId',
      label: 'Client',
      type: FilterType.SELECT,
      field: 'clientId',
      operator: 'eq',
      options: [], // Would be populated dynamically in a real implementation
      width: '200px'
    },
    {
      id: 'programId',
      label: 'Program',
      type: FilterType.SELECT,
      field: 'programId',
      operator: 'eq',
      options: [], // Would be populated dynamically in a real implementation
      width: '200px'
    },
    {
      id: 'serviceTypeId',
      label: 'Service Type',
      type: FilterType.SELECT,
      field: 'serviceTypeId',
      operator: 'eq',
      options: [], // Would be populated dynamically in a real implementation
      width: '200px'
    },
    {
      id: 'payerId',
      label: 'Payer',
      type: FilterType.SELECT,
      field: 'payerId',
      operator: 'eq',
      options: [], // Would be populated dynamically in a real implementation
      width: '200px'
    },
    {
      id: 'dateRange',
      label: 'Date Range',
      type: FilterType.DATE_RANGE,
      field: 'dateRange',
      operator: 'between',
      width: '300px'
    },
    {
      id: 'documentationStatus',
      label: 'Documentation Status',
      type: FilterType.SELECT,
      field: 'documentationStatus',
      operator: 'eq',
      options: getFilterOptions(DOCUMENTATION_STATUS_LABELS),
      width: '200px'
    },
    {
      id: 'billingStatus',
      label: 'Billing Status',
      type: FilterType.SELECT,
      field: 'billingStatus',
      operator: 'eq',
      options: getFilterOptions(BILLING_STATUS_LABELS),
      width: '200px'
    },
    {
      id: 'search',
      label: 'Search',
      type: FilterType.TEXT,
      field: 'search',
      operator: 'contains',
      placeholder: 'Search by client name, service ID...',
      width: '250px'
    }
  ];
};

/**
 * Converts a label object to an array of filter options
 */
const getFilterOptions = (labels: Record<string, string>): Array<{ value: string, label: string }> => {
  return Object.entries(labels).map(([value, label]) => ({
    value,
    label
  }));
};

export default BillingFilter;