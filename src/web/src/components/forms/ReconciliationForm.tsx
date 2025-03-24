import React, { useState, useEffect, useMemo } from 'react'; // v18.2.0
import { z } from 'zod'; // v3.21.0
import {
  Grid,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  Typography,
  Box,
  Divider,
  Chip,
  IconButton,
  Tooltip,
  Autocomplete,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  Alert,
} from '@mui/material'; // v5.13.0
import {
  Add,
  Delete,
  Info,
  CheckCircle,
  Warning,
  Save,
  Cancel,
} from '@mui/icons-material'; // v5.13.0

import useForm from '../../hooks/useForm';
import { ReconciliationFormProps } from '../../types/form.types';
import {
  ReconcilePaymentDto,
  PaymentWithRelations,
  ClaimSummary,
  AdjustmentType,
  ReconciliationStatus,
  PaymentAdjustmentDto,
} from '../../types/payments.types';
import Card from '../ui/Card';
import ActionButton from '../ui/ActionButton';
import StatusBadge from '../claims/StatusBadge';
import {
  RECONCILIATION_STATUS_LABELS,
  RECONCILIATION_STATUS_COLORS,
  ADJUSTMENT_TYPE_LABELS,
  COMMON_ADJUSTMENT_CODES,
  ADJUSTMENT_CODE_DESCRIPTIONS,
} from '../../constants/payments.constants';
import { formatCurrency, parseCurrency } from '../../utils/currency';
import { formatDate } from '../../utils/date';

/**
 * Zod validation schema for reconciliation form data
 */
const validationSchema = z.object({});

/**
 * Form component for reconciling payments with claims
 */
const ReconciliationForm: React.FC<ReconciliationFormProps> = ({
  payment,
  claims,
  onSubmit,
  onCancel,
  loading,
  error,
}) => {
  // Initialize state for selected claims and payment amounts
  const [selectedClaims, setSelectedClaims] = useState<string[]>([]);
  const [claimPayments, setClaimPayments] = useState<{ [claimId: string]: number }>({});
  const [adjustments, setAdjustments] = useState<{ [claimId: string]: PaymentAdjustmentDto[] }>({});
  const [reconciliationStatus, setReconciliationStatus] = useState<ReconciliationStatus>(ReconciliationStatus.UNRECONCILED);

  // Calculate total payment amount
  const totalPaymentAmount = useMemo(() => {
    return payment ? payment.paymentAmount : 0;
  }, [payment]);

  // Calculate allocated amount
  const allocatedAmount = useMemo(() => {
    return Object.values(claimPayments).reduce((sum, amount) => sum + amount, 0);
  }, [claimPayments]);

  // Calculate remaining amount
  const remainingAmount = useMemo(() => {
    return totalPaymentAmount - allocatedAmount;
  }, [totalPaymentAmount, allocatedAmount]);

  // Initialize form with useForm hook
  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<ReconcilePaymentDto>({
    defaultValues: {
      claimPayments: [],
      notes: '',
    },
    validationSchema,
  });

  // Handle claim selection
  const handleClaimSelection = (claimId: string) => {
    setSelectedClaims((prevSelected) =>
      prevSelected.includes(claimId)
        ? prevSelected.filter((id) => id !== claimId)
        : [...prevSelected, claimId]
    );
  };

  // Handle payment amount change for a claim
  const handlePaymentAmountChange = (claimId: string, amount: number) => {
    setClaimPayments((prevPayments) => ({
      ...prevPayments,
      [claimId]: amount,
    }));
  };

  // Handle adding an adjustment to a claim
  const handleAddAdjustment = (claimId: string) => {
    setAdjustments((prevAdjustments) => ({
      ...prevAdjustments,
      [claimId]: [...(prevAdjustments[claimId] || []), { adjustmentType: AdjustmentType.CONTRACTUAL, adjustmentCode: '', adjustmentAmount: 0, description: null }],
    }));
  };

  // Handle removing an adjustment from a claim
  const handleRemoveAdjustment = (claimId: string, index: number) => {
    setAdjustments((prevAdjustments) => ({
      ...prevAdjustments,
      [claimId]: prevAdjustments[claimId].filter((_, i) => i !== index),
    }));
  };

  // Handle changing an adjustment property
  const handleAdjustmentChange = (claimId: string, index: number, field: string, value: any) => {
    setAdjustments((prevAdjustments) => {
      const claimAdjustments = [...(prevAdjustments[claimId] || [])];
      claimAdjustments[index] = { ...claimAdjustments[index], [field]: value };
      return { ...prevAdjustments, [claimId]: claimAdjustments };
    });
  };

  // Handle reconciliation status change
  const handleStatusChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setReconciliationStatus(event.target.value as ReconciliationStatus);
  };

  // Handle form submission
  const handleSubmitForm = handleSubmit(async (data) => {
    const reconcileData: ReconcilePaymentDto = {
      claimPayments: selectedClaims.map((claimId) => ({
        claimId: claimId,
        amount: claimPayments[claimId] || 0,
        adjustments: adjustments[claimId] || [],
      })),
      notes: data.notes,
    };
    await onSubmit(reconcileData);
  });

  return (
    <Card title="Payment Reconciliation">
      <Typography variant="body1">
        Payer: {payment?.payer.name}
        <br />
        Date: {formatDate(payment?.paymentDate)}
        <br />
        Amount: {formatCurrency(payment?.paymentAmount)}
      </Typography>
      <form onSubmit={handleSubmitForm}>
        <TableContainer component={Paper}>
          <Table aria-label="reconciliation table">
            <TableHead>
              <TableRow>
                <TableCell>Claim #</TableCell>
                <TableCell>Client</TableCell>
                <TableCell>Service Date</TableCell>
                <TableCell>Billed Amount</TableCell>
                <TableCell>Payment Amount</TableCell>
                <TableCell>Adjustments</TableCell>
                <TableCell>Select</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {claims.map((claim) => (
                <TableRow key={claim.id}>
                  <TableCell>{claim.claimNumber}</TableCell>
                  <TableCell>{claim.clientName}</TableCell>
                  <TableCell>{formatDate(claim.serviceStartDate)}</TableCell>
                  <TableCell>{formatCurrency(claim.totalAmount)}</TableCell>
                  <TableCell>
                    <TextField
                      label="Payment Amount"
                      type="number"
                      value={claimPayments[claim.id] || ''}
                      onChange={(e) =>
                        handlePaymentAmountChange(claim.id, parseCurrency(e.target.value))
                      }
                    />
                    {adjustments[claim.id]?.map((adjustment, index) => (
                      <Box key={index}>
                        <FormControl>
                          <InputLabel>Adjustment Type</InputLabel>
                          <Select
                            value={adjustment.adjustmentType}
                            label="Adjustment Type"
                            onChange={(e) =>
                              handleAdjustmentChange(claim.id, index, 'adjustmentType', e.target.value)
                            }
                          >
                            {Object.entries(ADJUSTMENT_TYPE_LABELS).map(([key, label]) => (
                              <MenuItem key={key} value={key}>
                                {label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        <TextField
                          label="Adjustment Code"
                          value={adjustment.adjustmentCode}
                          onChange={(e) =>
                            handleAdjustmentChange(claim.id, index, 'adjustmentCode', e.target.value)
                          }
                        />
                        <TextField
                          label="Adjustment Amount"
                          type="number"
                          value={adjustment.adjustmentAmount}
                          onChange={(e) =>
                            handleAdjustmentChange(claim.id, index, 'adjustmentAmount', parseCurrency(e.target.value))
                          }
                        />
                        <IconButton onClick={() => handleRemoveAdjustment(claim.id, index)}>
                          <Delete />
                        </IconButton>
                      </Box>
                    ))}
                    <IconButton onClick={() => handleAddAdjustment(claim.id)}>
                      <Add />
                    </IconButton>
                  </TableCell>
                  <TableCell>
                    <Checkbox
                      checked={selectedClaims.includes(claim.id)}
                      onChange={() => handleClaimSelection(claim.id)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <FormControl fullWidth>
          <InputLabel id="reconciliation-status-label">Reconciliation Status</InputLabel>
          <Select
            labelId="reconciliation-status-label"
            id="reconciliationStatus"
            value={reconciliationStatus}
            label="Reconciliation Status"
            onChange={handleStatusChange}
          >
            {Object.entries(RECONCILIATION_STATUS_LABELS).map(([key, label]) => (
              <MenuItem key={key} value={key}>
                {label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label="Notes"
          multiline
          rows={4}
          fullWidth
          {...register('notes')}
        />

        <Typography variant="h6">
          Allocated Amount: {formatCurrency(allocatedAmount)}
        </Typography>
        <Typography variant="h6">
          Remaining Amount: {formatCurrency(remainingAmount)}
        </Typography>

        {error && <Alert severity="error">{error}</Alert>}

        <Box mt={2}>
          <ActionButton
            label="Reconcile"
            icon={<Save />}
            onClick={handleSubmitForm}
            disabled={loading}
          />
          <ActionButton
            label="Cancel"
            icon={<Cancel />}
            onClick={onCancel}
            variant="outlined"
            color="inherit"
            disabled={loading}
            sx={{ ml: 2 }}
          />
        </Box>
      </form>
    </Card>
  );
};

export default ReconciliationForm;