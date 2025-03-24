import React, { useState, useEffect } from 'react'; // v18.2.0
import { z } from 'zod'; // v3.21.0
import { 
  Box, 
  Typography, 
  Grid, 
  Button, 
  TextField, 
  MenuItem, 
  FormControl, 
  FormControlLabel, 
  Switch, 
  Divider, 
  Paper, 
  Accordion, 
  AccordionSummary, 
  AccordionDetails 
} from '@mui/material'; // v5.13.0
import { ExpandMore } from '@mui/icons-material'; // v5.13.0

import useForm from '../../hooks/useForm';
import useToast from '../../hooks/useToast';
import { PayerType, SubmissionFormat } from '../../types/claims.types';
import { Status as StatusType } from '../../types/common.types';
import { FormFieldType } from '../../types/form.types';

/**
 * Component for creating and editing payer information in the HCBS Revenue Management System.
 * Provides fields for payer details, address, contact information, billing requirements, and submission methods.
 * 
 * @param {Object} props - Component props
 * @param {Object|null} props.payer - Existing payer data for editing, or null for new payer
 * @param {Function} props.onSubmit - Function to call when form is submitted with valid data
 * @param {Function} props.onCancel - Function to call when form is cancelled
 * @param {boolean} props.loading - Whether the form is in a loading state
 * @returns {JSX.Element} The rendered PayerForm component
 */
const PayerForm: React.FC<{
  payer: any | null;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
}> = ({ payer, onSubmit, onCancel, loading }) => {
  // Initialize toast notification hook
  const toast = useToast();

  // Define validation schema for the form
  const validationSchema = z.object({
    name: z.string().min(1, "Payer name is required"),
    payerType: z.string().min(1, "Payer type is required"),
    status: z.string().min(1, "Status is required"),
    identifier: z.string().optional(),
    // Address fields
    street1: z.string().optional(),
    street2: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().optional(),
    // Contact fields
    contactName: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email("Invalid email address").optional().or(z.literal("")),
    fax: z.string().optional(),
    website: z.string().url("Invalid website URL").optional().or(z.literal("")),
    // Billing requirements
    claimFormat: z.string().optional(),
    submissionFormat: z.string().optional(),
    requiredFields: z.string().optional(),
    billingNotes: z.string().optional(),
    // Submission method
    isElectronic: z.boolean().optional(),
    submissionMethod: z.string().optional(),
    clearinghouse: z.string().optional(),
    portalUrl: z.string().url("Invalid portal URL").optional().or(z.literal("")),
    submissionNotes: z.string().optional()
  });

  // Set default values based on existing payer or empty values for new payer
  const defaultValues = {
    name: payer?.name || '',
    payerType: payer?.payerType || '',
    identifier: payer?.identifier || '',
    status: payer?.status || StatusType.ACTIVE,
    // Address fields
    street1: payer?.address?.street1 || '',
    street2: payer?.address?.street2 || '',
    city: payer?.address?.city || '',
    state: payer?.address?.state || '',
    zipCode: payer?.address?.zipCode || '',
    country: payer?.address?.country || 'United States',
    // Contact fields
    contactName: payer?.contactInfo?.contactName || '',
    phone: payer?.contactInfo?.phone || '',
    email: payer?.contactInfo?.email || '',
    fax: payer?.contactInfo?.fax || '',
    website: payer?.contactInfo?.website || '',
    // Billing requirements
    claimFormat: payer?.billingRequirements?.claimFormat || '',
    submissionFormat: payer?.billingRequirements?.submissionFormat || '',
    requiredFields: payer?.billingRequirements?.requiredFields || '',
    billingNotes: payer?.billingRequirements?.billingNotes || '',
    // Submission method
    isElectronic: payer?.submissionMethod?.isElectronic ?? true,
    submissionMethod: payer?.submissionMethod?.method || '',
    clearinghouse: payer?.submissionMethod?.clearinghouse || '',
    portalUrl: payer?.submissionMethod?.portalUrl || '',
    submissionNotes: payer?.submissionMethod?.notes || ''
  };

  // Initialize form with validation schema
  const { register, handleSubmit, formState, control, watch, setValue } = useForm({
    defaultValues,
    validationSchema
  });

  // State for tracking expanded accordion sections
  const [expanded, setExpanded] = useState<string | false>('basicInfo');

  // Watch for electronic submission setting to conditionally show/hide fields
  const isElectronic = watch('isElectronic');

  // Handle form submission
  const onFormSubmit = handleSubmit(async (data) => {
    try {
      // Format the data for API submission
      const formattedData = {
        ...data,
        address: {
          street1: data.street1,
          street2: data.street2,
          city: data.city,
          state: data.state,
          zipCode: data.zipCode,
          country: data.country
        },
        contactInfo: {
          contactName: data.contactName,
          phone: data.phone,
          email: data.email,
          fax: data.fax,
          website: data.website
        },
        billingRequirements: {
          claimFormat: data.claimFormat,
          submissionFormat: data.submissionFormat,
          requiredFields: data.requiredFields,
          billingNotes: data.billingNotes
        },
        submissionMethod: {
          isElectronic: data.isElectronic,
          method: data.submissionMethod,
          clearinghouse: data.clearinghouse,
          portalUrl: data.portalUrl,
          notes: data.submissionNotes
        }
      };

      // Remove the flattened fields that we've now nested
      const fieldsToDelete = [
        'street1', 'street2', 'city', 'state', 'zipCode', 'country',
        'contactName', 'phone', 'email', 'fax', 'website',
        'claimFormat', 'submissionFormat', 'requiredFields', 'billingNotes',
        'submissionMethod', 'clearinghouse', 'portalUrl', 'submissionNotes'
      ];

      fieldsToDelete.forEach(field => {
        delete formattedData[field];
      });

      // Include the id if editing an existing payer
      if (payer?.id) {
        formattedData.id = payer.id;
      }

      await onSubmit(formattedData);
      toast.success(`Payer ${payer ? 'updated' : 'created'} successfully`);
    } catch (error) {
      toast.error(`Failed to ${payer ? 'update' : 'create'} payer: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('Form submission error:', error);
    }
  });

  // Handle form cancellation
  const handleCancel = () => {
    onCancel();
  };

  // Handle accordion expansion/collapse
  const handleAccordionChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h5" gutterBottom>
        {payer ? 'Edit' : 'Add'} Payer
      </Typography>
      <Divider sx={{ mb: 3 }} />
      
      <form onSubmit={onFormSubmit}>
        {/* Basic Information Section */}
        <Accordion 
          expanded={expanded === 'basicInfo'} 
          onChange={handleAccordionChange('basicInfo')}
          sx={{ mb: 2 }}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="h6">Basic Information</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  {...register('name')}
                  label="Payer Name"
                  fullWidth
                  required
                  error={!!formState.errors.name}
                  helperText={formState.errors.name?.message?.toString()}
                  disabled={loading}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  {...register('identifier')}
                  label="Payer Identifier"
                  fullWidth
                  error={!!formState.errors.identifier}
                  helperText={formState.errors.identifier?.message?.toString()}
                  disabled={loading}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  {...register('payerType')}
                  select
                  label="Payer Type"
                  fullWidth
                  required
                  error={!!formState.errors.payerType}
                  helperText={formState.errors.payerType?.message?.toString()}
                  disabled={loading}
                >
                  {getPayerTypeOptions().map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  {...register('status')}
                  select
                  label="Status"
                  fullWidth
                  required
                  error={!!formState.errors.status}
                  helperText={formState.errors.status?.message?.toString()}
                  disabled={loading}
                >
                  {getStatusOptions().map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Address & Contact Information Section */}
        <Accordion 
          expanded={expanded === 'addressContact'} 
          onChange={handleAccordionChange('addressContact')}
          sx={{ mb: 2 }}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="h6">Address & Contact Information</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="subtitle1" gutterBottom>Address</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  {...register('street1')}
                  label="Street Address"
                  fullWidth
                  error={!!formState.errors.street1}
                  helperText={formState.errors.street1?.message?.toString()}
                  disabled={loading}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  {...register('street2')}
                  label="Street Address Line 2"
                  fullWidth
                  error={!!formState.errors.street2}
                  helperText={formState.errors.street2?.message?.toString()}
                  disabled={loading}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  {...register('city')}
                  label="City"
                  fullWidth
                  error={!!formState.errors.city}
                  helperText={formState.errors.city?.message?.toString()}
                  disabled={loading}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  {...register('state')}
                  label="State/Province"
                  fullWidth
                  error={!!formState.errors.state}
                  helperText={formState.errors.state?.message?.toString()}
                  disabled={loading}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  {...register('zipCode')}
                  label="ZIP / Postal Code"
                  fullWidth
                  error={!!formState.errors.zipCode}
                  helperText={formState.errors.zipCode?.message?.toString()}
                  disabled={loading}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  {...register('country')}
                  label="Country"
                  fullWidth
                  error={!!formState.errors.country}
                  helperText={formState.errors.country?.message?.toString()}
                  disabled={loading}
                />
              </Grid>
            </Grid>

            <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>Contact Information</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  {...register('contactName')}
                  label="Contact Name"
                  fullWidth
                  error={!!formState.errors.contactName}
                  helperText={formState.errors.contactName?.message?.toString()}
                  disabled={loading}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  {...register('phone')}
                  label="Phone Number"
                  fullWidth
                  error={!!formState.errors.phone}
                  helperText={formState.errors.phone?.message?.toString()}
                  disabled={loading}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  {...register('email')}
                  label="Email"
                  type="email"
                  fullWidth
                  error={!!formState.errors.email}
                  helperText={formState.errors.email?.message?.toString()}
                  disabled={loading}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  {...register('fax')}
                  label="Fax Number"
                  fullWidth
                  error={!!formState.errors.fax}
                  helperText={formState.errors.fax?.message?.toString()}
                  disabled={loading}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  {...register('website')}
                  label="Website"
                  fullWidth
                  error={!!formState.errors.website}
                  helperText={formState.errors.website?.message?.toString()}
                  disabled={loading}
                />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Billing Requirements Section */}
        <Accordion 
          expanded={expanded === 'billingRequirements'} 
          onChange={handleAccordionChange('billingRequirements')}
          sx={{ mb: 2 }}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="h6">Billing Requirements</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  {...register('claimFormat')}
                  label="Claim Format"
                  fullWidth
                  error={!!formState.errors.claimFormat}
                  helperText={formState.errors.claimFormat?.message?.toString()}
                  disabled={loading}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  {...register('submissionFormat')}
                  select
                  label="Submission Format"
                  fullWidth
                  error={!!formState.errors.submissionFormat}
                  helperText={formState.errors.submissionFormat?.message?.toString()}
                  disabled={loading}
                >
                  {getSubmissionFormatOptions().map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  {...register('requiredFields')}
                  label="Required Fields"
                  fullWidth
                  multiline
                  rows={2}
                  error={!!formState.errors.requiredFields}
                  helperText={formState.errors.requiredFields?.message?.toString()}
                  disabled={loading}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  {...register('billingNotes')}
                  label="Billing Notes"
                  fullWidth
                  multiline
                  rows={3}
                  error={!!formState.errors.billingNotes}
                  helperText={formState.errors.billingNotes?.message?.toString()}
                  disabled={loading}
                />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Submission Method Section */}
        <Accordion 
          expanded={expanded === 'submissionMethod'} 
          onChange={handleAccordionChange('submissionMethod')}
          sx={{ mb: 3 }}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="h6">Submission Method</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      {...register('isElectronic')}
                      checked={watch('isElectronic')}
                      onChange={(e) => setValue('isElectronic', e.target.checked)}
                      disabled={loading}
                    />
                  }
                  label="Electronic Submission"
                />
              </Grid>
              
              {isElectronic && (
                <>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      {...register('submissionMethod')}
                      label="Submission Method"
                      fullWidth
                      error={!!formState.errors.submissionMethod}
                      helperText={formState.errors.submissionMethod?.message?.toString()}
                      disabled={loading}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      {...register('clearinghouse')}
                      label="Clearinghouse"
                      fullWidth
                      error={!!formState.errors.clearinghouse}
                      helperText={formState.errors.clearinghouse?.message?.toString()}
                      disabled={loading}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      {...register('portalUrl')}
                      label="Portal URL"
                      fullWidth
                      error={!!formState.errors.portalUrl}
                      helperText={formState.errors.portalUrl?.message?.toString()}
                      disabled={loading}
                    />
                  </Grid>
                </>
              )}
              
              <Grid item xs={12}>
                <TextField
                  {...register('submissionNotes')}
                  label="Submission Notes"
                  fullWidth
                  multiline
                  rows={3}
                  error={!!formState.errors.submissionNotes}
                  helperText={formState.errors.submissionNotes?.message?.toString()}
                  disabled={loading}
                />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Form Actions */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
          <Button
            variant="outlined"
            onClick={handleCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading || !formState.isValid}
          >
            {loading ? 'Saving...' : payer ? 'Update Payer' : 'Create Payer'}
          </Button>
        </Box>
      </form>
    </Paper>
  );
};

/**
 * Helper function to generate select options for payer types
 * @returns {Array} Array of options for payer type select field
 */
function getPayerTypeOptions() {
  return Object.values(PayerType).map(payerType => ({
    value: payerType,
    label: payerType
      .replace(/([A-Z])/g, ' $1') // Add space before capital letters
      .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
  }));
}

/**
 * Helper function to generate select options for submission formats
 * @returns {Array} Array of options for submission format select field
 */
function getSubmissionFormatOptions() {
  return Object.values(SubmissionFormat).map(format => ({
    value: format,
    label: format
      .replace(/_/g, ' ') // Replace underscores with spaces
      .replace(/([A-Z])/g, ' $1') // Add space before capital letters
      .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
  }));
}

/**
 * Helper function to generate select options for status types
 * @returns {Array} Array of options for status select field
 */
function getStatusOptions() {
  return Object.values(StatusType).map(status => ({
    value: status,
    label: status
      .replace(/([A-Z])/g, ' $1') // Add space before capital letters
      .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
  }));
}

export default PayerForm;