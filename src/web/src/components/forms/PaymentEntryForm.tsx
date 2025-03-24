import React, { useEffect } from 'react';
import { z } from 'zod'; // v3.21.0
import { Grid, TextField, MenuItem, FormControl, InputLabel, Select, FormHelperText, Alert } from '@mui/material'; // v5.13.0
import { DatePicker } from '@mui/x-date-pickers'; // v6.0.0
import { LocalizationProvider } from '@mui/x-date-pickers'; // v6.0.0
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'; // v6.0.0
import { Save, Cancel } from '@mui/icons-material'; // v5.13.0

import { PaymentEntryFormProps } from '../../types/form.types';
import { CreatePaymentDto, PaymentMethod } from '../../types/payments.types';
import useForm from '../../hooks/useForm';
import { formatCurrency, parseCurrency } from '../../utils/currency';
import { formatDate, parseDate } from '../../utils/date';
import Card from '../ui/Card';
import ActionButton from '../ui/ActionButton';

/**
 * Zod validation schema for payment form validation
 */
const validationSchema = z.object({
  payerId: z.string().min(1, "Payer is required"),
  paymentDate: z.string().min(1, "Payment date is required")
    .refine(val => parseDate(val) !== null, { message: "Please enter a valid date" }),
  paymentAmount: z.number()
    .positive({ message: "Payment amount must be greater than zero" }),
  paymentMethod: z.nativeEnum(PaymentMethod, {
    errorMap: () => ({ message: "Please select a valid payment method" }),
  }),
  referenceNumber: z.string().nullable().optional(),
  checkNumber: z.string().nullable().optional()
    .refine(
      (val, ctx) => {
        // Check number is required if payment method is CHECK
        if (ctx.data.paymentMethod === PaymentMethod.CHECK && (!val || val.trim() === '')) {
          return false;
        }
        return true;
      },
      { message: "Check number is required for check payments" }
    ),
  remittanceId: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

/**
 * Form component for creating and editing payment records in the HCBS Revenue Management System.
 * Provides fields for entering payment details such as payer, payment date, amount, method, and reference information.
 * 
 * @param props - The component props
 * @returns The rendered form component
 */
const PaymentEntryForm: React.FC<PaymentEntryFormProps> = ({
  payment,
  onSubmit,
  onCancel,
  payers,
  paymentMethods,
  loading = false,
  error
}) => {
  // Prepare default values from existing payment or create empty defaults
  const defaultValues = {
    payerId: payment?.payerId || '',
    paymentDate: payment?.paymentDate ? formatDate(payment.paymentDate) : formatDate(new Date()),
    paymentAmount: payment?.paymentAmount || 0,
    paymentMethod: payment?.paymentMethod || PaymentMethod.EFT,
    referenceNumber: payment?.referenceNumber || '',
    checkNumber: payment?.checkNumber || '',
    remittanceId: payment?.remittanceId || '',
    notes: payment?.notes || '',
  };

  // Initialize form with validation schema and default values
  const { 
    register, 
    handleSubmit, 
    formState: { errors }, 
    control,
    watch,
    setValue
  } = useForm({
    defaultValues,
    validationSchema
  });

  // Get the current payment method value to conditionally show check number field
  const watchPaymentMethod = watch('paymentMethod');

  // Handle form submission
  const handleFormSubmit = (data: any) => {
    // Prepare data for submission
    const paymentData: CreatePaymentDto = {
      payerId: data.payerId,
      paymentDate: data.paymentDate,
      paymentAmount: data.paymentAmount,
      paymentMethod: data.paymentMethod,
      referenceNumber: data.referenceNumber || null,
      checkNumber: data.checkNumber || null,
      remittanceId: data.remittanceId || null,
      notes: data.notes || null,
    };

    onSubmit(paymentData);
  };

  return (
    <Card
      title={payment ? "Edit Payment" : "Record New Payment"}
      sx={{ maxWidth: 900, mx: 'auto' }}
    >
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Payer Selection */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth error={!!errors.payerId}>
              <InputLabel id="payer-label">Payer *</InputLabel>
              <Select
                labelId="payer-label"
                id="payerId"
                label="Payer *"
                {...register('payerId')}
                disabled={loading}
              >
                {payers.map((payer) => (
                  <MenuItem key={payer.value.toString()} value={payer.value.toString()}>
                    {payer.label}
                  </MenuItem>
                ))}
              </Select>
              {errors.payerId && (
                <FormHelperText>{errors.payerId.message}</FormHelperText>
              )}
            </FormControl>
          </Grid>

          {/* Payment Date */}
          <Grid item xs={12} md={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Payment Date *"
                value={parseDate(watch('paymentDate'))}
                onChange={(date) => {
                  setValue('paymentDate', formatDate(date));
                }}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !!errors.paymentDate,
                    helperText: errors.paymentDate?.message,
                    disabled: loading,
                  },
                }}
              />
            </LocalizationProvider>
          </Grid>

          {/* Payment Amount */}
          <Grid item xs={12} md={6}>
            <TextField
              id="paymentAmount"
              label="Payment Amount *"
              fullWidth
              value={formatCurrency(watch('paymentAmount'))}
              onChange={(e) => {
                setValue('paymentAmount', parseCurrency(e.target.value));
              }}
              error={!!errors.paymentAmount}
              helperText={errors.paymentAmount?.message}
              disabled={loading}
            />
          </Grid>

          {/* Payment Method */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth error={!!errors.paymentMethod}>
              <InputLabel id="payment-method-label">Payment Method *</InputLabel>
              <Select
                labelId="payment-method-label"
                id="paymentMethod"
                label="Payment Method *"
                {...register('paymentMethod')}
                disabled={loading}
              >
                {paymentMethods.map((method) => (
                  <MenuItem key={method.value.toString()} value={method.value.toString()}>
                    {method.label}
                  </MenuItem>
                ))}
              </Select>
              {errors.paymentMethod && (
                <FormHelperText>{errors.paymentMethod.message}</FormHelperText>
              )}
            </FormControl>
          </Grid>

          {/* Check Number - Conditional field */}
          {watchPaymentMethod === PaymentMethod.CHECK && (
            <Grid item xs={12} md={6}>
              <TextField
                id="checkNumber"
                label="Check Number *"
                fullWidth
                {...register('checkNumber')}
                error={!!errors.checkNumber}
                helperText={errors.checkNumber?.message}
                disabled={loading}
              />
            </Grid>
          )}

          {/* Reference Number */}
          <Grid item xs={12} md={6}>
            <TextField
              id="referenceNumber"
              label="Reference Number"
              fullWidth
              {...register('referenceNumber')}
              error={!!errors.referenceNumber}
              helperText={errors.referenceNumber?.message}
              disabled={loading}
            />
          </Grid>

          {/* Remittance ID */}
          <Grid item xs={12} md={6}>
            <TextField
              id="remittanceId"
              label="Remittance ID"
              fullWidth
              {...register('remittanceId')}
              error={!!errors.remittanceId}
              helperText={errors.remittanceId?.message}
              disabled={loading}
            />
          </Grid>

          {/* Notes */}
          <Grid item xs={12}>
            <TextField
              id="notes"
              label="Notes"
              fullWidth
              multiline
              rows={3}
              {...register('notes')}
              error={!!errors.notes}
              helperText={errors.notes?.message}
              disabled={loading}
            />
          </Grid>
        </Grid>

        {/* Form Actions */}
        <Grid container spacing={2} justifyContent="flex-end" sx={{ mt: 3 }}>
          <Grid item>
            <ActionButton
              label="Cancel"
              variant="outlined"
              color="inherit"
              icon={<Cancel />}
              onClick={onCancel}
              disabled={loading}
            />
          </Grid>
          <Grid item>
            <ActionButton
              label={payment ? "Save Changes" : "Record Payment"}
              variant="contained"
              color="primary"
              icon={<Save />}
              onClick={handleSubmit(handleFormSubmit)}
              disabled={loading}
            />
          </Grid>
        </Grid>
      </form>
    </Card>
  );
};

export default PaymentEntryForm;