import React, { useCallback } from 'react'; // v18.2.0
import { Box, Stack, SxProps, Theme } from '@mui/material'; // v5.13.0
import {
  Edit,
  Delete,
  AccountBalance,
  Receipt,
  Undo,
  Visibility,
} from '@mui/icons-material'; // v5.13.0
import ActionButton from '../ui/ActionButton';
import { usePayments } from '../../hooks/usePayments';
import { PaymentWithRelations, ReconciliationStatus } from '../../types/payments.types';
import { Severity } from '../../types/common.types';
import { useToast } from '../../hooks/useToast';

/**
 * Interface defining the props for the PaymentActions component.
 */
interface PaymentActionsProps {
  payment: PaymentWithRelations;
  onEdit?: () => void;
  onReconcile?: () => void;
  onViewRemittance?: () => void;
  sx?: SxProps<Theme>;
}

/**
 * A component that provides action buttons for managing payments.
 * It displays contextual actions based on payment status, such as edit, delete,
 * reconcile, view remittance, and undo reconciliation.
 *
 * @param {PaymentActionsProps} props - The props for the PaymentActions component.
 * @returns {JSX.Element} The rendered PaymentActions component.
 */
const PaymentActions: React.FC<PaymentActionsProps> = ({
  payment,
  onEdit,
  onReconcile,
  onViewRemittance,
  sx,
}) => {
  // Access payment-related functions from the usePayments hook
  const { deletePayment, reconcilePayment, clearMatchingResult } = usePayments();

  // Access toast notification functions from the useToast hook
  const { success, error } = useToast();

  /**
   * Handles the delete action for a payment.
   * Displays a confirmation dialog before deleting the payment.
   */
  const handleDelete = useCallback(async () => {
    try {
      if (payment?.id) {
        await deletePayment(payment.id);
        success('Payment deleted successfully.');
      } else {
        error('Payment ID is missing.');
      }
    } catch (err: any) {
      error(err?.message || 'Failed to delete payment.');
    }
  }, [payment?.id, deletePayment, success, error]);

  /**
   * Handles the undo reconciliation action for a payment.
   * Displays a confirmation dialog before undoing the reconciliation.
   */
  const handleUndoReconciliation = useCallback(async () => {
    try {
      if (payment?.id) {
        await reconcilePayment(payment.id, {
          claimPayments: [],
          notes: 'Undo reconciliation'
        });
        clearMatchingResult();
        success('Payment reconciliation undone successfully.');
      } else {
        error('Payment ID is missing.');
      }
    } catch (err: any) {
      error(err?.message || 'Failed to undo payment reconciliation.');
    }
  }, [payment?.id, reconcilePayment, success, error, clearMatchingResult]);

  // Determine which actions to show based on payment reconciliation status
  const showReconcile =
    payment.reconciliationStatus !== ReconciliationStatus.RECONCILED &&
    payment.reconciliationStatus !== ReconciliationStatus.PARTIALLY_RECONCILED &&
    onReconcile;

  const showUndoReconcile =
    payment.reconciliationStatus === ReconciliationStatus.RECONCILED ||
    payment.reconciliationStatus === ReconciliationStatus.PARTIALLY_RECONCILED;

  return (
    <Stack direction="row" spacing={1} sx={sx}>
      {onEdit && (
        <ActionButton
          label="Edit"
          icon={<Edit />}
          onClick={onEdit}
        />
      )}

      <ActionButton
        label="Delete"
        icon={<Delete />}
        onClick={handleDelete}
        confirmText="Are you sure you want to delete this payment?"
      />

      {showReconcile && (
        <ActionButton
          label="Reconcile"
          icon={<AccountBalance />}
          onClick={onReconcile}
        />
      )}

      {payment.remittanceId && (
        <ActionButton
          label="View Remittance"
          icon={<Receipt />}
          onClick={onViewRemittance}
        />
      )}

      {showUndoReconcile && (
        <ActionButton
          label="Undo Reconciliation"
          icon={<Undo />}
          onClick={handleUndoReconciliation}
          confirmText="Are you sure you want to undo this reconciliation?"
        />
      )}
    </Stack>
  );
};

export default PaymentActions;