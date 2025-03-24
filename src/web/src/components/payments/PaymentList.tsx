import React, { useState, useEffect, useMemo, useCallback } from 'react'; // v18.2.0
import { Box, Typography, Divider, Menu, MenuItem, IconButton, Tooltip } from '@mui/material'; // v5.13.0
import { MoreVert, Visibility, Edit, Delete, Sync } from '@mui/icons-material'; // v5.13.0
import { useRouter } from 'next/router'; // v13.4.0

import DataTable from '../ui/DataTable';
import ActionButton from '../ui/ActionButton';
import StatusBadge from '../ui/StatusBadge';
import PaymentFilter from './PaymentFilter';
import { PaymentSummary, ReconciliationStatus, PaymentMethod } from '../../types/payments.types';
import { TableColumn } from '../../types/ui.types';
import { 
  PAYMENT_TABLE_COLUMNS, 
  PAYMENT_METHOD_LABELS, 
  RECONCILIATION_STATUS_LABELS, 
  PAYMENT_BATCH_ACTIONS 
} from '../../constants/payments.constants';
import usePayments from '../../hooks/usePayments';
import useToast from '../../hooks/useToast';
import { formatCurrency } from '../../utils/currency';

/**
 * Interface for PaymentList component props
 */
interface PaymentListProps {
  onPaymentSelect?: (paymentId: string) => void;
  selectedPaymentIds?: string[];
  sx?: object;
}

/**
 * A component that displays a list of payments with filtering, sorting, and pagination capabilities
 */
const PaymentList: React.FC<PaymentListProps> = ({ onPaymentSelect, selectedPaymentIds, sx }) => {
  // Destructure props to extract onPaymentSelect, selectedPaymentIds, and sx
  
  // Initialize router using useRouter hook
  const router = useRouter();

  // Initialize toast notification using useToast hook
  const { success, error } = useToast();

  // Get payment-related state and functions from usePayments hook
  const { 
    payments, 
    filters, 
    loading, 
    fetchPayments, 
    updateFilters 
  } = usePayments();

  // Initialize state for selected rows using useState
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  // Initialize state for action menu anchor using useState
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // Initialize state for current payment using useState
  const [currentPayment, setCurrentPayment] = useState<PaymentSummary | null>(null);

  // Define columns for the payment table using PAYMENT_TABLE_COLUMNS constant
  const columns: TableColumn[] = useMemo(() => {
    return PAYMENT_TABLE_COLUMNS.map(col => {
      if (col.id === 'reconciliationStatus') {
        return {
          ...col,
          renderCell: (params: any) => (
            <StatusBadge 
              status={params.row.reconciliationStatus} 
              type="reconciliation" 
            />
          )
        };
      }
      if (col.id === 'paymentMethod') {
        return {
          ...col,
          valueFormatter: (value: PaymentMethod) => PAYMENT_METHOD_LABELS[value]
        };
      }
      if (col.id === 'actions') {
        return {
          ...col,
          renderCell: (params: any) => (
            <Box>
              <IconButton 
                aria-label="view" 
                onClick={(event) => {
                  event.stopPropagation();
                  handleMenuOpen(event, params.row);
                }}
              >
                <MoreVert />
              </IconButton>
            </Box>
          )
        };
      }
      return col;
    });
  }, []);

  // Define handleRowClick function to navigate to payment detail page
  const handleRowClick = useCallback((payment: PaymentSummary) => {
    router.push(`/payments/${payment.id}`);
  }, [router]);

  // Define handleFilterChange function to update payment filters
  const handleFilterChange = useCallback((newFilters: any) => {
    updateFilters(newFilters);
  }, [updateFilters]);

  // Define handlePageChange function to update pagination
  const handlePageChange = useCallback((page: number) => {
    updateFilters({ pagination: { ...filters.pagination, page } });
  }, [filters, updateFilters]);

  // Define handleSortChange function to update sorting
  const handleSortChange = useCallback((sortModel: any) => {
    updateFilters({ sort: sortModel[0] });
  }, [updateFilters]);

  // Define handleSelectionChange function to update selected rows
  const handleSelectionChange = useCallback((newSelectedRows: any[]) => {
    setSelectedRows(newSelectedRows.map(row => row.id));
  }, []);

  // Define handleViewPayment function to navigate to payment detail page
  const handleViewPayment = useCallback((paymentId: string) => {
    router.push(`/payments/${paymentId}`);
  }, [router]);

  // Define handleEditPayment function to navigate to payment edit page
  const handleEditPayment = useCallback((paymentId: string) => {
    router.push(`/payments/${paymentId}/edit`);
  }, [router]);

  // Define handleReconcilePayment function to navigate to payment reconciliation page
  const handleReconcilePayment = useCallback((paymentId: string) => {
    router.push(`/payments/${paymentId}/reconciliation`);
  }, [router]);

  // Define handleDeletePayment function to delete a payment with confirmation
  const handleDeletePayment = useCallback((paymentId: string) => {
    // Implement delete payment logic here
    success('Payment deleted successfully');
  }, [success]);

  // Define handleBatchAction function to perform actions on selected payments
  const handleBatchAction = useCallback((action: string) => {
    // Implement batch action logic here
    success(`Batch action "${action}" performed successfully`);
  }, [success]);

  // Define handleMenuOpen function to open the action menu
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, payment: PaymentSummary) => {
    setAnchorEl(event.currentTarget);
    setCurrentPayment(payment);
  };

  // Define handleMenuClose function to close the action menu
  const handleMenuClose = () => {
    setAnchorEl(null);
    setCurrentPayment(null);
  };

  // Fetch payments on component mount and when filters change
  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  return (
    <Box sx={{ width: '100%', ...sx }}>
      <PaymentFilter 
        onFilterChange={handleFilterChange} 
      />
      <DataTable
        columns={columns}
        data={payments}
        loading={loading}
        pagination={filters.pagination}
        totalItems={100}
        onPageChange={handlePageChange}
        onSortChange={handleSortChange}
        onRowClick={handleRowClick}
        selectable={true}
        onSelectionChange={handleSelectionChange}
      />
      {selectedRows.length > 0 && (
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          {PAYMENT_BATCH_ACTIONS.map(action => (
            <ActionButton
              key={action.id}
              label={action.label}
              icon={<action.icon />}
              onClick={() => handleBatchAction(action.action)}
            />
          ))}
        </Box>
      )}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
            handleViewPayment(currentPayment.id);
            handleMenuClose();
          }}>
          View
        </MenuItem>
        <MenuItem onClick={() => {
            handleEditPayment(currentPayment.id);
            handleMenuClose();
          }}>
          Edit
        </MenuItem>
        <MenuItem onClick={() => {
            handleReconcilePayment(currentPayment.id);
            handleMenuClose();
          }}>
          Reconcile
        </MenuItem>
        <MenuItem onClick={() => {
            handleDeletePayment(currentPayment.id);
            handleMenuClose();
          }}>
          Delete
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default PaymentList;