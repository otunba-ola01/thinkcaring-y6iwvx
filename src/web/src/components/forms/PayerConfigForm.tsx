import React, { useState, useEffect } from 'react'; // v18.2.0
import { 
  Box, 
  Typography, 
  Grid, 
  TextField, 
  MenuItem, 
  FormControl, 
  FormControlLabel, 
  FormHelperText, 
  InputLabel, 
  Select, 
  Switch, 
  Divider 
} from '@mui/material'; // v5.13.0
import { z } from 'zod'; // v3.21.0

import useForm from '../../hooks/useForm';
import useToast from '../../hooks/useToast';
import Card from '../ui/Card';
import { PayerType, SubmissionFormat } from '../../types/claims.types';
import { PayerConfigFormProps } from '../../types/form.types';

/**
 * Component for configuring payer settings including billing requirements and submission methods
 * 
 * @param props - The component props
 * @returns The rendered PayerConfigForm component
 */
const PayerConfigForm: React.FC<PayerConfigFormProps> = ({
  payer,
  onSubmit,
  onCancel,
  loading = false
}) => {
  const toast = useToast();

  // Create validation schema for the form fields
  const validationSchema = z.object({
    name: z.string()
      .min(2, "Payer name must be at least 2 characters")
      .max(100, "Payer name must be less than 100 characters"),
    payerType: z.nativeEnum(PayerType, {
      errorMap: () => ({ message: "Please select a valid payer type" })
    }),
    isActive: z.boolean(),
    submissionFormat: z.nativeEnum(SubmissionFormat, {
      errorMap: () => ({ message: "Please select a valid submission format" })
    }),
    timelyFilingDays: z.number()
      .min(1, "Timely filing days must be at least 1")
      .max(365, "Timely filing days must be at most 365"),
    requiresAuthorization: z.boolean(),
    // Fields for electronic submission
    submissionEndpoint: z.string().url("Please enter a valid URL").optional().or(z.literal('')),
    apiKey: z.string().optional().or(z.literal('')),
    apiSecret: z.string().optional().or(z.literal('')),
    submissionPortalUrl: z.string().url("Please enter a valid URL").optional().or(z.literal('')),
    portalUsername: z.string().optional().or(z.literal('')),
    portalPassword: z.string().optional().or(z.literal('')),
    clearinghouseId: z.string().optional().or(z.literal('')),
    submitterNumber: z.string().optional().or(z.literal('')),
    receiverId: z.string().optional().or(z.literal('')),
    // Paper submission fields
    mailingAddress: z.string().optional().or(z.literal('')),
    attention: z.string().optional().or(z.literal('')),
    // Common fields
    notes: z.string().optional().or(z.literal(''))
  });

  // Default values for the form
  const defaultValues = {
    name: payer?.name || '',
    payerType: payer?.payerType || PayerType.MEDICAID,
    isActive: payer?.isActive ?? true,
    submissionFormat: payer?.submissionFormat || SubmissionFormat.ELECTRONIC,
    timelyFilingDays: payer?.timelyFilingDays || 90,
    requiresAuthorization: payer?.requiresAuthorization ?? true,
    // Electronic submission fields
    submissionEndpoint: payer?.submissionEndpoint || '',
    apiKey: payer?.apiKey || '',
    apiSecret: payer?.apiSecret || '',
    submissionPortalUrl: payer?.submissionPortalUrl || '',
    portalUsername: payer?.portalUsername || '',
    portalPassword: payer?.portalPassword || '',
    clearinghouseId: payer?.clearinghouseId || '',
    submitterNumber: payer?.submitterNumber || '',
    receiverId: payer?.receiverId || '',
    // Paper submission fields
    mailingAddress: payer?.mailingAddress || '',
    attention: payer?.attention || '',
    // Common fields
    notes: payer?.notes || ''
  };

  // Initialize form with validation schema
  const { 
    register, 
    handleSubmit, 
    formState: { errors, isSubmitting }, 
    watch,
    setValue
  } = useForm({
    defaultValues,
    validationSchema
  });

  // Watch the submission format to show the appropriate fields
  const submissionFormat = watch('submissionFormat');
  
  // Track which submission fields to show based on the format
  const [showDirectApiFields, setShowDirectApiFields] = useState(false);
  const [showPortalFields, setShowPortalFields] = useState(false);
  const [showClearinghouseFields, setShowClearinghouseFields] = useState(false);
  const [showPaperFields, setShowPaperFields] = useState(false);

  // Update visible submission fields when format changes
  useEffect(() => {
    setShowDirectApiFields(submissionFormat === SubmissionFormat.DIRECT_API);
    setShowPortalFields(submissionFormat === SubmissionFormat.PORTAL);
    setShowClearinghouseFields(submissionFormat === SubmissionFormat.CLEARINGHOUSE);
    setShowPaperFields(submissionFormat === SubmissionFormat.PAPER);
  }, [submissionFormat]);

  // Handle form submission
  const onFormSubmit = handleSubmit(async (data) => {
    try {
      await onSubmit(data);
      toast.success("Payer configuration saved successfully");
    } catch (error) {
      console.error('Error saving payer configuration:', error);
      toast.error(error instanceof Error ? error.message : "Failed to save payer configuration");
    }
  });

  return (
    <Box component="form" onSubmit={onFormSubmit} noValidate>
      <Grid container spacing={3}>
        {/* Basic Payer Information */}
        <Grid item xs={12}>
          <Card 
            title="Basic Information"
            loading={loading}
          >
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  {...register('name')}
                  label="Payer Name"
                  fullWidth
                  required
                  error={!!errors.name}
                  helperText={errors.name?.message}
                  disabled={loading || isSubmitting}
                  inputProps={{
                    "aria-label": "Payer Name",
                    "aria-required": "true"
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={!!errors.payerType}>
                  <InputLabel id="payer-type-label">Payer Type</InputLabel>
                  <Select
                    {...register('payerType')}
                    labelId="payer-type-label"
                    label="Payer Type"
                    required
                    disabled={loading || isSubmitting}
                    inputProps={{
                      "aria-label": "Payer Type",
                      "aria-required": "true"
                    }}
                  >
                    <MenuItem value={PayerType.MEDICAID}>Medicaid</MenuItem>
                    <MenuItem value={PayerType.MEDICARE}>Medicare</MenuItem>
                    <MenuItem value={PayerType.PRIVATE_INSURANCE}>Private Insurance</MenuItem>
                    <MenuItem value={PayerType.MANAGED_CARE}>Managed Care</MenuItem>
                    <MenuItem value={PayerType.SELF_PAY}>Self Pay</MenuItem>
                    <MenuItem value={PayerType.GRANT}>Grant</MenuItem>
                    <MenuItem value={PayerType.OTHER}>Other</MenuItem>
                  </Select>
                  {errors.payerType && <FormHelperText>{errors.payerType.message}</FormHelperText>}
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      {...register('isActive')}
                      checked={watch('isActive')}
                      disabled={loading || isSubmitting}
                      color="primary"
                    />
                  }
                  label="Active"
                />
              </Grid>
            </Grid>
          </Card>
        </Grid>

        {/* Billing Requirements */}
        <Grid item xs={12}>
          <Card 
            title="Billing Requirements"
            loading={loading}
          >
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={!!errors.submissionFormat}>
                  <InputLabel id="submission-format-label">Submission Format</InputLabel>
                  <Select
                    {...register('submissionFormat')}
                    labelId="submission-format-label"
                    label="Submission Format"
                    required
                    disabled={loading || isSubmitting}
                    inputProps={{
                      "aria-label": "Submission Format",
                      "aria-required": "true"
                    }}
                  >
                    <MenuItem value={SubmissionFormat.ELECTRONIC}>Electronic (837)</MenuItem>
                    <MenuItem value={SubmissionFormat.DIRECT_API}>Direct API</MenuItem>
                    <MenuItem value={SubmissionFormat.PORTAL}>Web Portal</MenuItem>
                    <MenuItem value={SubmissionFormat.CLEARINGHOUSE}>Clearinghouse</MenuItem>
                    <MenuItem value={SubmissionFormat.PAPER}>Paper</MenuItem>
                  </Select>
                  {errors.submissionFormat && <FormHelperText>{errors.submissionFormat.message}</FormHelperText>}
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  {...register('timelyFilingDays', {
                    valueAsNumber: true
                  })}
                  label="Timely Filing Limit (Days)"
                  type="number"
                  fullWidth
                  required
                  error={!!errors.timelyFilingDays}
                  helperText={errors.timelyFilingDays?.message}
                  disabled={loading || isSubmitting}
                  inputProps={{
                    min: 1,
                    max: 365,
                    "aria-label": "Timely Filing Limit in Days",
                    "aria-required": "true"
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      {...register('requiresAuthorization')}
                      checked={watch('requiresAuthorization')}
                      disabled={loading || isSubmitting}
                      color="primary"
                    />
                  }
                  label="Requires Service Authorization"
                />
              </Grid>
            </Grid>
          </Card>
        </Grid>

        {/* Submission Method Settings */}
        <Grid item xs={12}>
          <Card 
            title="Submission Method Configuration"
            loading={loading}
          >
            <Grid container spacing={2}>
              {/* Direct API fields */}
              {showDirectApiFields && (
                <>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Direct API Configuration
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      {...register('submissionEndpoint')}
                      label="API Endpoint URL"
                      fullWidth
                      error={!!errors.submissionEndpoint}
                      helperText={errors.submissionEndpoint?.message}
                      disabled={loading || isSubmitting}
                      inputProps={{
                        "aria-label": "API Endpoint URL"
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      {...register('apiKey')}
                      label="API Key"
                      fullWidth
                      error={!!errors.apiKey}
                      helperText={errors.apiKey?.message}
                      disabled={loading || isSubmitting}
                      inputProps={{
                        "aria-label": "API Key"
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      {...register('apiSecret')}
                      label="API Secret"
                      type="password"
                      fullWidth
                      error={!!errors.apiSecret}
                      helperText={errors.apiSecret?.message}
                      disabled={loading || isSubmitting}
                      inputProps={{
                        "aria-label": "API Secret"
                      }}
                    />
                  </Grid>
                </>
              )}

              {/* Portal fields */}
              {showPortalFields && (
                <>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Web Portal Configuration
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      {...register('submissionPortalUrl')}
                      label="Portal URL"
                      fullWidth
                      error={!!errors.submissionPortalUrl}
                      helperText={errors.submissionPortalUrl?.message}
                      disabled={loading || isSubmitting}
                      inputProps={{
                        "aria-label": "Portal URL"
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      {...register('portalUsername')}
                      label="Portal Username"
                      fullWidth
                      error={!!errors.portalUsername}
                      helperText={errors.portalUsername?.message}
                      disabled={loading || isSubmitting}
                      inputProps={{
                        "aria-label": "Portal Username"
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      {...register('portalPassword')}
                      label="Portal Password"
                      type="password"
                      fullWidth
                      error={!!errors.portalPassword}
                      helperText={errors.portalPassword?.message}
                      disabled={loading || isSubmitting}
                      inputProps={{
                        "aria-label": "Portal Password"
                      }}
                    />
                  </Grid>
                </>
              )}

              {/* Clearinghouse fields */}
              {showClearinghouseFields && (
                <>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Clearinghouse Configuration
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      {...register('clearinghouseId')}
                      label="Clearinghouse ID"
                      fullWidth
                      error={!!errors.clearinghouseId}
                      helperText={errors.clearinghouseId?.message}
                      disabled={loading || isSubmitting}
                      inputProps={{
                        "aria-label": "Clearinghouse ID"
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      {...register('submitterNumber')}
                      label="Submitter Number"
                      fullWidth
                      error={!!errors.submitterNumber}
                      helperText={errors.submitterNumber?.message}
                      disabled={loading || isSubmitting}
                      inputProps={{
                        "aria-label": "Submitter Number"
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      {...register('receiverId')}
                      label="Receiver ID"
                      fullWidth
                      error={!!errors.receiverId}
                      helperText={errors.receiverId?.message}
                      disabled={loading || isSubmitting}
                      inputProps={{
                        "aria-label": "Receiver ID"
                      }}
                    />
                  </Grid>
                </>
              )}

              {/* Paper fields */}
              {showPaperFields && (
                <>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Paper Submission Configuration
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      {...register('mailingAddress')}
                      label="Mailing Address"
                      fullWidth
                      multiline
                      rows={3}
                      error={!!errors.mailingAddress}
                      helperText={errors.mailingAddress?.message}
                      disabled={loading || isSubmitting}
                      inputProps={{
                        "aria-label": "Mailing Address"
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      {...register('attention')}
                      label="Attention/Department"
                      fullWidth
                      error={!!errors.attention}
                      helperText={errors.attention?.message}
                      disabled={loading || isSubmitting}
                      inputProps={{
                        "aria-label": "Attention/Department"
                      }}
                    />
                  </Grid>
                </>
              )}

              {/* Notes field for all submission types */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Additional Notes
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <TextField
                  {...register('notes')}
                  label="Notes"
                  fullWidth
                  multiline
                  rows={3}
                  error={!!errors.notes}
                  helperText={errors.notes?.message}
                  disabled={loading || isSubmitting}
                  inputProps={{
                    "aria-label": "Notes"
                  }}
                />
              </Grid>
            </Grid>
          </Card>
        </Grid>

        {/* Form Actions */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
            {onCancel && (
              <Box 
                component="button"
                type="button"
                onClick={onCancel}
                disabled={loading || isSubmitting}
                sx={{
                  px: 3, 
                  py: 1, 
                  border: '1px solid',
                  borderColor: 'grey.300',
                  borderRadius: 1,
                  bgcolor: 'background.paper',
                  color: 'text.primary',
                  typography: 'button',
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: 'grey.100'
                  },
                  '&:disabled': {
                    bgcolor: 'action.disabledBackground',
                    color: 'action.disabled',
                    cursor: 'default'
                  }
                }}
              >
                Cancel
              </Box>
            )}
            <Box 
              component="button"
              type="submit"
              disabled={loading || isSubmitting}
              sx={{
                px: 3, 
                py: 1, 
                border: 'none',
                borderRadius: 1,
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                typography: 'button',
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: 'primary.dark'
                },
                '&:disabled': {
                  bgcolor: 'action.disabledBackground',
                  color: 'action.disabled',
                  cursor: 'default'
                }
              }}
            >
              {isSubmitting ? 'Saving...' : (payer ? 'Update Payer' : 'Create Payer')}
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PayerConfigForm;