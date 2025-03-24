import React, { useEffect, useMemo } from 'react'; // v18.2.0
import { Box, Button, Grid } from '@mui/material'; // v5.13.0
import { FilterList as FilterIcon, Clear as ClearIcon } from '@mui/icons-material'; // v5.13.0

import FilterPanel from '../ui/FilterPanel';
import DateRangePicker from '../ui/DateRangePicker';
import SearchInput from '../ui/SearchInput';
import useFilter from '../../hooks/useFilter';
import { ServiceFilterProps, DocumentationStatus, BillingStatus } from '../../types/services.types';
import { FilterConfig, FilterType } from '../../types/ui.types';
import { DOCUMENTATION_STATUS_LABELS, BILLING_STATUS_LABELS, DEFAULT_SERVICE_FILTERS } from '../../constants/services.constants';
import useServices from '../../hooks/useServices';

/**
 * Component that provides filtering capabilities for services
 * @param props - ServiceFilterProps
 * @returns The rendered ServiceFilter component
 */
const ServiceFilter: React.FC<ServiceFilterProps> = (props: ServiceFilterProps) => {
  // LD1: Destructure props to extract filters, onFilterChange, onClearFilters, clientId, and programId
  const { filters, onFilterChange, onClearFilters, clientId, programId } = props;

  // LD1: Define filter configurations for date range, documentation status, billing status, program, and search
  const filterConfigs: FilterConfig[] = useMemo(() => getFilterConfigurations({ clientId, programId }), [clientId, programId]);

  // LD1: Initialize filter state using useFilter hook with the filter configurations
  const {
    filters: filterState,
    setFilter,
    clearFilter,
    clearAllFilters,
    applyFilters,
  } = useFilter({
    filterConfigs,
    initialFilters: filters || DEFAULT_SERVICE_FILTERS,
    onFilterChange,
  });

  // LD1: Handle filter changes by updating filter state and calling onFilterChange
  const handleFilterChange = (key: string, value: any) => {
    setFilter(key, value);
  };

  // LD1: Handle clearing filters by resetting filter state and calling onClearFilters
  const handleClearFilters = () => {
    clearAllFilters();
    onClearFilters();
  };

  // LD1: Render FilterPanel component with the defined filter configurations
  // LD1: Include filter actions for applying and clearing filters
  // LD1: Apply appropriate styling and layout for the filter panel
  return (
    <FilterPanel
      filters={filterConfigs}
      onFilterChange={handleFilterChange}
      initialValues={filters}
      collapsible={true}
    />
  );
};

/**
 * Creates filter configurations for the service filter panel
 * @param object - { clientId, programId }
 * @returns Array of filter configurations
 */
const getFilterConfigurations = (object: { clientId: any; programId: any; }) => {
    const { clientId, programId } = object;
    // LD1: Create date range filter configuration
    const filterConfigurations: FilterConfig[] = [
        {
            id: 'dateRange',
            label: 'Date Range',
            type: FilterType.DATE_RANGE,
            field: 'serviceDate',
            operator: 'between'
        },
        // LD1: Create documentation status filter configuration with options from DocumentationStatus enum
        {
            id: 'documentationStatus',
            label: 'Documentation Status',
            type: FilterType.SELECT,
            field: 'documentationStatus',
            options: Object.entries(DOCUMENTATION_STATUS_LABELS).map(([key, label]) => ({
                value: key,
                label
            }))
        },
        // LD1: Create billing status filter configuration with options from BillingStatus enum
        {
            id: 'billingStatus',
            label: 'Billing Status',
            type: FilterType.SELECT,
            field: 'billingStatus',
            options: Object.entries(BILLING_STATUS_LABELS).map(([key, label]) => ({
                value: key,
                label
            }))
        },
    ];

    // LD1: Create program filter configuration if no programId is provided
    if (!programId) {
        filterConfigurations.push({
            id: 'programId',
            label: 'Program',
            type: FilterType.SELECT,
            field: 'programId',
            options: [] // TODO: Populate with program options
        });
    }

    // LD1: Create search filter configuration for text search
    filterConfigurations.push({
        id: 'search',
        label: 'Search',
        type: FilterType.TEXT,
        field: 'search',
        operator: 'contains',
        placeholder: 'Search by client name, service code, etc.'
    });

    // LD1: Return the array of filter configurations
    return filterConfigurations;
};

export default ServiceFilter;