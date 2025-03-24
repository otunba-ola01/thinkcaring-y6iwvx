import React, { useState, useEffect, useMemo } from 'react'; // v18.2.0
import { Box, Typography, Grid, Divider, Chip, Button, Tooltip, SxProps, Theme } from '@mui/material'; // v5.13.0
import { Receipt as ReceiptIcon, AccountBalance as AccountBalanceIcon } from '@mui/icons-material'; // v5.13.0
import Card from '../ui/Card';
import StatusBadge from '../ui/StatusBadge';
import DataTable from '../ui/DataTable';
import PaymentActions from './PaymentActions';
import { usePayments } from '../../hooks/usePayments';
import { PaymentWithRelations, ReconciliationStatus, PaymentMethod } from '../../types/payments.types';
import { PAYMENT_METHOD_LABELS, RECONCILIATION_STATUS_LABELS, CLAIM_PAYMENT_TABLE_COLUMNS } from '../../constants/payments.constants';
import { formatCurrency, formatDate } from '../../utils/format';

/**
 * Interface defining the props for the PaymentDetail component.
 */
interface PaymentDetailProps {
  paymentId: string;
  onEdit?: () => void;
  onReconcile?: () => void;
  onBack?: () => void;
  sx?: SxProps<Theme>;
}

/**
 * A component that renders the payment header information
 */
interface PaymentHeaderProps {
  payment: PaymentWithRelations;
  sx?: SxProps<Theme>;
}

const PaymentHeader: React.FC<PaymentHeaderProps> = ({ payment, sx }) => {
  return (
    <Card title="Payment Information" sx={sx}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1">Payer:</Typography>
          <Typography variant="body1">{payment.payer.name}</Typography>
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1">Payment Date:</Typography>
          <Typography variant="body1">{formatDate(payment.paymentDate)}</Typography>
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1">Amount:</Typography>
          <Typography variant="body1">{formatCurrency(payment.paymentAmount)}</Typography>
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1">Method:</Typography>
          <Typography variant="body1">{PAYMENT_METHOD_LABELS[payment.paymentMethod]}</Typography>
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1">Reference #:</Typography>
          <Typography variant="body1">{payment.referenceNumber || 'N/A'}</Typography>
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1">Status:</Typography>
          <StatusBadge status={payment.reconciliationStatus} type="reconciliation" />
        </Grid>
      </Grid>
    </Card>
  );
};

/**
 * A component that renders remittance information if available
 */
interface RemittanceInfoProps {
  payment: PaymentWithRelations;
  sx?: SxProps<Theme>;
}

const RemittanceInfo: React.FC<RemittanceInfoProps> = ({ payment, sx }) => {
  if (!payment.remittanceInfo) {
    return null;
  }

  return (
    <Card title="Remittance Information" sx={sx}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1">Remittance #:</Typography>
          <Typography variant="body1">{payment.remittanceInfo.remittanceNumber}</Typography>
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1">Date:</Typography>
          <Typography variant="body1">{formatDate(payment.remittanceInfo.remittanceDate)}</Typography>
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1">Payer Identifier:</Typography>
          <Typography variant="body1">{payment.remittanceInfo.payerIdentifier}</Typography>
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1">Total Amount:</Typography>
          <Typography variant="body1">{formatCurrency(payment.remittanceInfo.totalAmount)}</Typography>
        </Grid>
        {payment.remittanceInfo.originalFilename && (
          <Grid item xs={12}>
            <Typography variant="subtitle1">File:</Typography>
            <Typography variant="body1">
              {payment.remittanceInfo.originalFilename} ({payment.remittanceInfo.fileType})
            </Typography>
          </Grid>
        )}
      </Grid>
    </Card>
  );
};

/**
 * A component that renders a table of claims associated with the payment
 */
interface ClaimPaymentListProps {
  payment: PaymentWithRelations;
  sx?: SxProps<Theme>;
}

const ClaimPaymentList: React.FC<ClaimPaymentListProps> = ({ payment, sx }) => {
  if (!payment.claimPayments || payment.claimPayments.length === 0) {
    return (
      <Card title="Associated Claims" sx={sx}>
        <Typography variant="body1">No claims associated with this payment.</Typography>
      </Card>
    );
  }

  const claimPaymentsData = useMemo(() => {
    return payment.claimPayments.map(claimPayment => ({
      claimNumber: claimPayment.claim.claimNumber,
      clientName: `${claimPayment.claim.clientName}`,
      serviceDate: claimPayment.claim.serviceDate,
      billedAmount: claimPayment.claim.totalAmount,
      paidAmount: claimPayment.paidAmount,
      adjustmentAmount: claimPayment.adjustments?.reduce((sum, adj) => sum + adj.adjustmentAmount, 0) || 0
    }));
  }, [payment]);

  return (
    <Card title="Associated Claims" sx={sx}>
      <DataTable
        columns={CLAIM_PAYMENT_TABLE_COLUMNS}
        data={claimPaymentsData}
      />
    </Card>
  );
};

/**
 * A component that displays detailed information about a payment
 */
const PaymentDetail: React.FC<PaymentDetailProps> = ({ paymentId, onEdit, onReconcile, onBack, sx }) => {
  // Access payment-related state and functions from the usePayments hook
  const { selectedPayment, fetchPaymentById } = usePayments();

  // Local state to manage loading state for remittance details
  const [loadingRemittance, setLoadingRemittance] = useState(false);

  // Fetch payment data when the component mounts or paymentId changes
  useEffect(() => {
    if (paymentId) {
      setLoadingRemittance(true);
      fetchPaymentById(paymentId)
        .finally(() => setLoadingRemittance(false));
    }
  }, [paymentId, fetchPaymentById]);

  // Prepare claim payment data for the DataTable using useMemo
  const claimPaymentsData = useMemo(() => {
    return selectedPayment?.claimPayments?.map(claimPayment => ({
      claimNumber: claimPayment.claim.claimNumber,
      clientName: `${claimPayment.claim.clientName}`,
      serviceDate: claimPayment.claim.serviceDate,
      billedAmount: claimPayment.claim.totalAmount,
      paidAmount: claimPayment.paidAmount,
      adjustmentAmount: claimPayment.adjustments?.reduce((sum, adj) => sum + adj.adjustmentAmount, 0) || 0
    })) || [];
  }, [selectedPayment]);

  // Render loading state if payment data is still loading
  if (!selectedPayment) {
    return <Typography>Loading payment details...</Typography>;
  }

  return (
    <Box sx={{ ...sx }}>
      {/* Payment header information */}
      <PaymentHeader payment={selectedPayment} />

      {/* Payment actions */}
      <PaymentActions
        payment={selectedPayment}
        onEdit={onEdit}
        onReconcile={onReconcile}
      />

      {/* Remittance information section */}
      <RemittanceInfo payment={selectedPayment} />

      {/* Associated claims section */}
      {claimPaymentsData.length > 0 ? (
        <ClaimPaymentList payment={selectedPayment} />
      ) : (
        <Typography>No claims associated with this payment.</Typography>
      )}
    </Box>
  );
};

export default PaymentDetail;