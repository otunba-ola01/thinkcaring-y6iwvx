import React, { useMemo, useEffect } from 'react'; // v18.2.0
import { Box, SxProps, Theme } from '@mui/material'; // v5.13.0
import FilterPanel from '../ui/FilterPanel';
import DateRangePicker from '../ui/DateRangePicker';
import { FilterConfig, FilterType } from '../../types/ui.types';
import { ReconciliationStatus, PaymentMethod } from '../../types/payments.types';
import { RECONCILIATION_STATUS_LABELS, PAYMENT_METHOD_LABELS, DEFAULT_PAYMENT_FILTERS } from '../../constants/payments.constants';
import usePayments from '../../hooks/usePayments';
import useFilter from '../../hooks/useFilter';

/**
 * Interface defining the props for the PaymentFilter component
 */
interface PaymentFilterProps {
  onFilterChange: (filters: Record<string, any>) => void;
  initialFilters?: Record<string, any>;
  sx?: SxProps<Theme>;
}

/**
 * A specialized filter component for payment-related views
 * Provides a consistent filtering interface for payment lists.
 * Renders a configurable set of filter controls specific to payment data,
 * including reconciliation status, payment method, date range, and payer selection.
 *
 * @param {PaymentFilterProps} props - The props for the PaymentFilter component
 * @returns {JSX.Element} The rendered PaymentFilter component
 */
const PaymentFilter: React.FC<PaymentFilterProps> = ({ onFilterChange, initialFilters, sx }) => {
  // Destructure props to extract onFilterChange, initialFilters, and sx
  // Get payment-related state and functions from usePayments hook
  const { filters: paymentFilters, updateFilters } = usePayments();

  // Define filter configurations for payment filtering
  const filterConfigs: FilterConfig[] = useMemo(() => {
    // Create reconciliation status filter configuration
    const reconciliationStatusFilter: FilterConfig = {
      id: 'reconciliationStatus',
      label: 'Reconciliation Status',
      type: FilterType.MULTI_SELECT,
      field: 'reconciliationStatus',
      operator: 'in',
      options: Object.entries(RECONCILIATION_STATUS_LABELS).map(([value, label]) => ({
        value,
        label,
      })),
    };

    // Create payment method filter configuration
    const paymentMethodFilter: FilterConfig = {
      id: 'paymentMethod',
      label: 'Payment Method',
      type: FilterType.MULTI_SELECT,
      field: 'paymentMethod',
      operator: 'in',
      options: Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => ({
        value,
        label,
      })),
    };

    // Create date range filter configuration
    const dateRangeFilter: FilterConfig = {
      id: 'dateRange',
      label: 'Payment Date',
      type: FilterType.DATE_RANGE,
      field: 'paymentDate',
      operator: 'between',
    };

    // Create payer filter configuration
    const payerFilter: FilterConfig = {
      id: 'payerId',
      label: 'Payer',
      type: FilterType.TEXT,
      field: 'payerId',
      operator: 'equals',
      placeholder: 'Search by Payer',
    };

    // Create search filter configuration
    const searchFilter: FilterConfig = {
      id: 'search',
      label: 'Search',
      type: FilterType.TEXT,
      field: 'search',
      operator: 'contains',
      placeholder: 'Search by Reference Number',
    };

    // Combine all filter configurations into an array
    return [reconciliationStatusFilter, paymentMethodFilter, dateRangeFilter, payerFilter, searchFilter];
  }, []);

  // Handle filter changes by updating payment filters and triggering onFilterChange callback
  const handleFilterChange = (filters: Record<string, any>) => {
    updateFilters(filters);
    onFilterChange(filters);
  };

  // Render the FilterPanel component with the defined configurations
  return (
    <FilterPanel
      filters={filterConfigs}
      onFilterChange={handleFilterChange}
      initialValues={initialFilters}
      sx={sx}
    />
  );
};

export default PaymentFilter;