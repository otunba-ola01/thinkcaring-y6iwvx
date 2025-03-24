import React, { useMemo } from 'react'; // v18.2.0
import { Box } from '@mui/material'; // v5.13.0
import FilterPanel from '../ui/FilterPanel';
import { FilterConfig, FilterType } from '../../types/ui.types';
import { ClientStatus } from '../../types/clients.types';
import useClients from '../../hooks/useClients';

/**
 * Interface for ClientFilter component props
 */
export interface ClientFilterProps {
  onFilterChange: (filters: Record<string, any>) => void;
  initialValues: Record<string, any>;
  loading: boolean;
}

/**
 * Creates filter configurations for client filtering
 * @returns Array of filter configurations for client filtering
 */
function getClientFilterConfigs(): FilterConfig[] {
  return [
    {
      id: 'search',
      label: 'Search',
      type: FilterType.TEXT,
      field: 'search',
      operator: 'contains',
      placeholder: 'Search by name, ID or Medicaid ID'
    },
    {
      id: 'status',
      label: 'Status',
      type: FilterType.SELECT,
      field: 'status',
      operator: 'eq',
      options: Object.values(ClientStatus).map(status => ({
        value: status,
        label: status.charAt(0).toUpperCase() + status.slice(1)
      }))
    },
    {
      id: 'programId',
      label: 'Program',
      type: FilterType.SELECT,
      field: 'programId',
      operator: 'eq'
      // Program options would be loaded dynamically from API
    }
  ];
}

/**
 * Component that renders a filter panel for client filtering
 * @param {ClientFilterProps} props - The props for the ClientFilter component
 * @returns {JSX.Element} The rendered ClientFilter component
 */
const ClientFilter: React.FC<ClientFilterProps> = ({ onFilterChange, initialValues, loading }) => {
  // Get client filter configurations using useMemo to prevent unnecessary recalculations
  const filterConfigs = useMemo(() => getClientFilterConfigs(), []);

  // Return a Box component containing the FilterPanel component
  return (
    <Box>
      {/* Pass filter configurations, onFilterChange, and initialValues to FilterPanel */}
      <FilterPanel
        filters={filterConfigs}
        onFilterChange={onFilterChange}
        initialValues={initialValues}
        loading={loading}
      />
    </Box>
  );
};

export default ClientFilter;
export type { ClientFilterProps };