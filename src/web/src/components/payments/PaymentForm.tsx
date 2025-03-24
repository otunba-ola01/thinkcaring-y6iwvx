import React, { useState, useEffect } from 'react'; // v18.2.0
import { z } from 'zod'; // v3.21.0
import { Grid, TextField, MenuItem, Button, Box, Typography, FormHelperText } from '@mui/material'; // v5.13.0
import { DatePicker } from '@mui/x-date-pickers'; // v6.5.0

import useForm from '../../hooks/useForm';
import { Card } from '../ui/Card';
import { CreatePaymentDto, UpdatePaymentDto, PaymentMethod } from '../../types/payments.types';
import { PaymentEntryFormProps } from '../../types/form.types';
import { PAYMENT_METHOD_LABELS } from '../../constants/payments.constants';
import { formatCurrency } from '../../utils/currency';
import { formatDate, parseDate } from '../../utils/date';

/**
 * A form component for creating and editing payment records in the HCBS Revenue Management System.
 * Allows financial staff to enter payment details including payer, amount, date, payment method, and reference information.
 * 
 * @param props - Component props including payment data, submission handler, and form configuration
 * @returns The rendered payment form component
 */
const PaymentForm: React.FC<PaymentEntryFormProps> = ({
  payment,
  onSubmit,
  onCancel,
  payers,
  paymentMethods,
  loading = false,
  error
}) => {
  // Define Zod validation schema for the payment form
  const validationSchema = z.object({
    payerId: z.string({
      required_error: "Payer is required"
    }),
    paymentDate: z.string({
      required_error: "Payment date is required"
    }),
    paymentAmount: z.number({
      required_error: "Payment amount is required"
    }).positive("Payment amount must be greater than zero"),
    paymentMethod: z.nativeEnum(PaymentMethod, {
      required_error: "Payment method is required"
    }),
    referenceNumber: z.string().nullable().optional(),
    checkNumber: z.string().nullable().optional(),
    notes: z.string().nullable().optional()
  });

  // Format default values for the form
  const defaultValues = {
    payerId: payment?.payerId || '',
    paymentDate: payment?.paymentDate || formatDate(new Date()),
    paymentAmount: payment?.paymentAmount || 0,
    paymentMethod: payment?.paymentMethod || PaymentMethod.EFT,
    referenceNumber: payment?.referenceNumber || '',
    checkNumber: payment?.checkNumber || '',
    notes: payment?.notes || ''
  };

  // Initialize form with validation schema and default values
  const { 
    register, 
    handleSubmit, 
    formState: { errors, isSubmitting }, 
    setValue,
    watch
  } = useForm({
    validationSchema,
    defaultValues
  });

  // Watch payment method to conditionally show check number field
  const paymentMethod = watch('paymentMethod');

  // Handle form submission
  const onFormSubmit = async (data: any) => {
    try {
      // Prepare the data for submission - convert strings to their proper types
      const formattedData = {
        ...data,
        // Convert empty strings to null for nullable fields
        referenceNumber: data.referenceNumber || null,
        checkNumber: data.checkNumber || null,
        notes: data.notes || null
      };

      // Call the parent component's onSubmit handler with the formatted data
      await onSubmit(formattedData);
    } catch (error) {
      console.error('Error submitting payment form:', error);
    }
  };

  return (
    <Card>
      <form onSubmit={handleSubmit(onFormSubmit)}>
        {/* Display error message if there is one */}
        {error && (
          <Box mb={2}>
            <Typography color="error">{error}</Typography>
          </Box>
        )}

        <Grid container spacing={2}>
          {/* Payer selection */}
          <Grid item xs={12} md={6}>
            <TextField
              select
              label="Payer"
              fullWidth
              {...register('payerId')}
              error={!!errors.payerId}
              helperText={errors.payerId?.message}
              disabled={loading || isSubmitting}
              required
            >
              {payers.map((payer) => (
                <MenuItem key={payer.value} value={payer.value}>
                  {payer.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Payment date */}
          <Grid item xs={12} md={6}>
            <DatePicker
              label="Payment Date"
              value={parseDate(watch('paymentDate'))}
              onChange={(date) => {
                if (date) {
                  setValue('paymentDate', formatDate(date));
                }
              }}
              slotProps={{
                textField: {
                  fullWidth: true,
                  error: !!errors.paymentDate,
                  helperText: errors.paymentDate?.message,
                  required: true,
                  disabled: loading || isSubmitting
                }
              }}
            />
          </Grid>

          {/* Payment amount */}
          <Grid item xs={12} md={6}>
            <TextField
              label="Payment Amount"
              fullWidth
              type="number"
              inputProps={{ step: "0.01", min: "0" }}
              {...register('paymentAmount', {
                valueAsNumber: true
              })}
              error={!!errors.paymentAmount}
              helperText={errors.paymentAmount?.message}
              disabled={loading || isSubmitting}
              required
            />
          </Grid>

          {/* Payment method */}
          <Grid item xs={12} md={6}>
            <TextField
              select
              label="Payment Method"
              fullWidth
              {...register('paymentMethod')}
              error={!!errors.paymentMethod}
              helperText={errors.paymentMethod?.message}
              disabled={loading || isSubmitting}
              required
            >
              {paymentMethods.map((method) => (
                <MenuItem key={method.value} value={method.value}>
                  {method.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Reference number */}
          <Grid item xs={12} md={6}>
            <TextField
              label="Reference Number"
              fullWidth
              {...register('referenceNumber')}
              error={!!errors.referenceNumber}
              helperText={errors.referenceNumber?.message || "EFT, payment portal, or other reference number"}
              disabled={loading || isSubmitting}
            />
          </Grid>

          {/* Check number - conditionally shown based on payment method */}
          {paymentMethod === PaymentMethod.CHECK && (
            <Grid item xs={12} md={6}>
              <TextField
                label="Check Number"
                fullWidth
                {...register('checkNumber')}
                error={!!errors.checkNumber}
                helperText={errors.checkNumber?.message}
                disabled={loading || isSubmitting}
              />
            </Grid>
          )}

          {/* Notes */}
          <Grid item xs={12}>
            <TextField
              label="Notes"
              fullWidth
              multiline
              rows={3}
              {...register('notes')}
              error={!!errors.notes}
              helperText={errors.notes?.message}
              disabled={loading || isSubmitting}
            />
          </Grid>
        </Grid>

        {/* Form actions */}
        <Box mt={3} display="flex" justifyContent="flex-end">
          <Button
            type="button"
            onClick={onCancel}
            disabled={loading || isSubmitting}
            sx={{ mr: 1 }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading || isSubmitting}
          >
            {payment ? 'Update Payment' : 'Create Payment'}
          </Button>
        </Box>
      </form>
    </Card>
  );
};

export default PaymentForm;