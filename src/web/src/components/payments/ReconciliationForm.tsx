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
const validationSchema = z.object({
  selectedClaims: z.array(z.string()).optional(), // Array of claim IDs
  claimPayments: z.array(
    z.object({
      claimId: z.string(),
      amount: z.string(),
      adjustments: z.array(
        z.object({
          adjustmentType: z.string(),
          adjustmentCode: z.string(),
          adjustmentAmount: z.string(),
        })
      ).optional(),
    })
  ).optional(),
  reconciliationStatus: z.nativeEnum(ReconciliationStatus, {
    required_error: 'Reconciliation status is required',
  }),
  notes: z.string().optional(),
});

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
  // Destructure props to extract payment, claims, onSubmit, onCancel, loading, and error
  const {
    payer,
    paymentDate,
    paymentAmount,
    paymentMethod,
    referenceNumber,
  } = payment;

  // Initialize state for selected claims, payment amounts, adjustments, and reconciliation status
  const [selectedClaims, setSelectedClaims] = useState<string[]>([]);
  const [paymentAmounts, setPaymentAmounts] = useState<Record<string, string>>({});
  const [adjustments, setAdjustments] = useState<Record<string, PaymentAdjustmentDto[]>>({});
  const [reconciliationStatus, setReconciliationStatus] = useState<ReconciliationStatus>(
    ReconciliationStatus.UNRECONCILED
  );

  // Calculate total payment amount, allocated amount, and remaining amount
  const totalPaymentAmount = useMemo(() => parseCurrency(paymentAmount), [paymentAmount]);

  const allocatedAmount = useMemo(() => {
    let total = 0;
    selectedClaims.forEach((claimId) => {
      const amount = parseCurrency(paymentAmounts[claimId] || '0');
      total += amount;
      if (adjustments[claimId]) {
        adjustments[claimId].forEach((adj) => {
          total += parseCurrency(adj.adjustmentAmount || '0');
        });
      }
    });
    return total;
  }, [selectedClaims, paymentAmounts, adjustments]);

  const remainingAmount = useMemo(() => totalPaymentAmount - allocatedAmount, [
    totalPaymentAmount,
    allocatedAmount,
  ]);

  // Initialize form with useForm hook, passing validation schema and default values
  const { handleSubmit, register, reset, formState } = useForm<ReconcilePaymentDto>({
    validationSchema: validationSchema as any,
    defaultValues: {
      claimPayments: [],
      notes: '',
    },
  });

  // Create handleClaimSelection function to toggle claim selection
  const handleClaimSelection = (claimId: string) => {
    setSelectedClaims((prevSelected) =>
      prevSelected.includes(claimId)
        ? prevSelected.filter((id) => id !== claimId)
        : [...prevSelected, claimId]
    );
  };

  // Create handlePaymentAmountChange function to update payment amounts for claims
  const handlePaymentAmountChange = (claimId: string, amount: string) => {
    setPaymentAmounts((prevAmounts) => ({ ...prevAmounts, [claimId]: amount }));
  };

  // Create handleAddAdjustment function to add adjustment to a claim
  const handleAddAdjustment = (claimId: string) => {
    setAdjustments((prevAdjustments) => ({
      ...prevAdjustments,
      [claimId]: [
        ...(prevAdjustments[claimId] || []),
        {
          adjustmentType: AdjustmentType.CONTRACTUAL,
          adjustmentCode: '',
          adjustmentAmount: '0',
          description: '',
        },
      ],
    }));
  };

  // Create handleRemoveAdjustment function to remove adjustment from a claim
  const handleRemoveAdjustment = (claimId: string, index: number) => {
    setAdjustments((prevAdjustments) => ({
      ...prevAdjustments,
      [claimId]: prevAdjustments[claimId].filter((_, i) => i !== index),
    }));
  };

  // Create handleAdjustmentChange function to update adjustment properties
  const handleAdjustmentChange = (
    claimId: string,
    index: number,
    field: string,
    value: string
  ) => {
    setAdjustments((prevAdjustments) => {
      const updatedAdjustments = [...(prevAdjustments[claimId] || [])];
      updatedAdjustments[index] = {
        ...updatedAdjustments[index],
        [field]: value,
      };
      return { ...prevAdjustments, [claimId]: updatedAdjustments };
    });
  };

  // Create handleStatusChange function to update reconciliation status
  const handleStatusChange = (event: any) => {
    setReconciliationStatus(event.target.value);
  };

  // Create handleSubmit function that formats data before calling onSubmit
  const onSubmitHandler = handleSubmit((data) => {
    const claimPayments = selectedClaims.map((claimId) => ({
      claimId: claimId,
      amount: parseCurrency(paymentAmounts[claimId] || '0'),
      adjustments: adjustments[claimId] || [],
    }));

    const reconcileData: ReconcilePaymentDto = {
      claimPayments: claimPayments,
      notes: data.notes,
    };

    onSubmit(reconcileData);
  });

  return (
    <Card title="Payment Reconciliation">
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography variant="subtitle1">
            Payer: {payer.name}
          </Typography>
          <Typography variant="subtitle1">
            Date: {formatDate(paymentDate)}
          </Typography>
          <Typography variant="subtitle1">
            Amount: {formatCurrency(paymentAmount)}
          </Typography>
          <Typography variant="subtitle1">
            Reference: {referenceNumber}
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <TableContainer component={Paper}>
            <Table aria-label="claims table">
              <TableHead>
                <TableRow>
                  <TableCell>Select</TableCell>
                  <TableCell>Claim #</TableCell>
                  <TableCell>Client</TableCell>
                  <TableCell>Service Date</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {claims.map((claim) => (
                  <TableRow key={claim.id}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedClaims.includes(claim.id)}
                        onChange={() => handleClaimSelection(claim.id)}
                      />
                    </TableCell>
                    <TableCell>{claim.claimNumber}</TableCell>
                    <TableCell>{claim.clientName}</TableCell>
                    <TableCell>{formatDate(claim.serviceStartDate)}</TableCell>
                    <TableCell>{formatCurrency(claim.totalAmount)}</TableCell>
                    <TableCell>
                      <StatusBadge status={claim.claimStatus} type="claim" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
        {selectedClaims.map((claimId) => (
          <Grid item xs={12} key={claimId}>
            <Typography variant="h6">Claim {claimId}</Typography>
            <TextField
              label="Payment Amount"
              variant="outlined"
              fullWidth
              value={paymentAmounts[claimId] || ''}
              onChange={(e) => handlePaymentAmountChange(claimId, e.target.value)}
            />
            <Typography variant="subtitle1">Adjustments</Typography>
            {adjustments[claimId]?.map((adjustment, index) => (
              <Grid container spacing={2} key={index}>
                <Grid item xs={4}>
                  <FormControl fullWidth>
                    <InputLabel id={`adjustment-type-label-${claimId}-${index}`}>
                      Adjustment Type
                    </InputLabel>
                    <Select
                      labelId={`adjustment-type-label-${claimId}-${index}`}
                      value={adjustment.adjustmentType}
                      label="Adjustment Type"
                      onChange={(e) =>
                        handleAdjustmentChange(
                          claimId,
                          index,
                          'adjustmentType',
                          e.target.value
                        )
                      }
                    >
                      {Object.entries(ADJUSTMENT_TYPE_LABELS).map(
                        ([key, label]) => (
                          <MenuItem key={key} value={key}>
                            {label}
                          </MenuItem>
                        )
                      )}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={4}>
                  <FormControl fullWidth>
                    <InputLabel id={`adjustment-code-label-${claimId}-${index}`}>
                      Adjustment Code
                    </InputLabel>
                    <Autocomplete
                      disablePortal
                      id={`adjustment-code-${claimId}-${index}`}
                      options={Object.keys(COMMON_ADJUSTMENT_CODES)}
                      value={adjustment.adjustmentCode}
                      onChange={(_, newValue) => {
                        handleAdjustmentChange(
                          claimId,
                          index,
                          'adjustmentCode',
                          newValue || ''
                        );
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Adjustment Code"
                          InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                              <React.Fragment>
                                {params.InputProps.endAdornment}
                                {adjustment.adjustmentCode && (
                                  <Tooltip
                                    title={
                                      ADJUSTMENT_CODE_DESCRIPTIONS[
                                        adjustment.adjustmentCode
                                      ] || 'No description available'
                                    }
                                  >
                                    <IconButton>
                                      <Info />
                                    </IconButton>
                                  </Tooltip>
                                )}
                              </React.Fragment>
                            ),
                          }}
                        />
                      )}
                    />
                  </FormControl>
                </Grid>
                <Grid item xs={3}>
                  <TextField
                    label="Adjustment Amount"
                    variant="outlined"
                    fullWidth
                    value={adjustment.adjustmentAmount}
                    onChange={(e) =>
                      handleAdjustmentChange(
                        claimId,
                        index,
                        'adjustmentAmount',
                        e.target.value
                      )
                    }
                  />
                </Grid>
                <Grid item xs={1}>
                  <IconButton
                    onClick={() => handleRemoveAdjustment(claimId, index)}
                  >
                    <Delete />
                  </IconButton>
                </Grid>
              </Grid>
            ))}
            <ActionButton
              label="Add Adjustment"
              icon={<Add />}
              onClick={() => handleAddAdjustment(claimId)}
            />
          </Grid>
        ))}
        <Grid item xs={12}>
          <FormControl fullWidth>
            <InputLabel id="reconciliation-status-label">
              Reconciliation Status
            </InputLabel>
            <Select
              labelId="reconciliation-status-label"
              value={reconciliationStatus}
              label="Reconciliation Status"
              onChange={handleStatusChange}
            >
              {Object.entries(RECONCILIATION_STATUS_LABELS).map(
                ([key, label]) => (
                  <MenuItem key={key} value={key}>
                    {label}
                  </MenuItem>
                )
              )}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12}>
          <TextField
            label="Notes"
            multiline
            rows={4}
            fullWidth
            {...register('notes')}
          />
        </Grid>
        <Grid item xs={12}>
          <Typography variant="subtitle1">
            Allocated Amount: {formatCurrency(allocatedAmount)}
          </Typography>
          <Typography variant="subtitle1">
            Remaining Amount: {formatCurrency(remainingAmount)}
          </Typography>
        </Grid>
        {error && (
          <Grid item xs={12}>
            <Alert severity="error">{error}</Alert>
          </Grid>
        )}
        <Grid item xs={12}>
          <ActionButton
            label="Reconcile"
            icon={<Save />}
            onClick={onSubmitHandler}
            disabled={formState.isSubmitting}
          />
          <ActionButton
            label="Cancel"
            icon={<Cancel />}
            onClick={onCancel}
            variant="outlined"
            color="inherit"
            disabled={formState.isSubmitting}
          />
        </Grid>
      </Grid>
    </Card>
  );
};

export default ReconciliationForm;