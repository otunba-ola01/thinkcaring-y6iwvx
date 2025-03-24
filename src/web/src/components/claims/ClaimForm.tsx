import React, { useState, useEffect, useMemo } from 'react'; // react v18.2.0
import {
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Button,
  Box,
  Divider,
  Typography,
  Checkbox,
  ListItemText,
  Chip,
  Paper,
  CircularProgress,
} from '@mui/material'; // v5.13.0
import { z } from 'zod'; // v3.21.0

import { ClaimEntryFormProps } from '../../types/form.types';
import { ClaimType, ClaimStatus } from '../../types/claims.types';
import useForm from '../../hooks/useForm';
import Card from '../ui/Card';
import { claimsApi } from '../../api/claims.api';
import { fetchServices, fetchServicesByClientId } from '../../api/services.api';
import useToast from '../../hooks/useToast';

/**
 * Zod validation schema for claim form data
 */
const claimValidationSchema = z.object({
  clientId: z.string().uuid({ message: 'Client is required' }),
  payerId: z.string().uuid({ message: 'Payer is required' }),
  claimType: z.nativeEnum(ClaimType, {
    invalid_type_error: 'Claim type is required',
  }),
  serviceIds: z.array(z.string().uuid()).nonempty({
    message: 'At least one service must be selected',
  }),
  originalClaimId: z.string().uuid().optional(), // For adjustment claims
  notes: z.string().optional(),
});

/**
 * Form component for creating and editing claims
 */
export const ClaimForm: React.FC<ClaimEntryFormProps> = ({
  claim,
  onSubmit,
  onCancel,
  clients,
  payers,
  services,
  loading,
  error,
}) => {
  // Initialize form with useForm hook, passing validation schema and default values
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: claim
      ? {
          clientId: claim.clientId,
          payerId: claim.payerId,
          claimType: claim.claimType,
          serviceIds: claim.serviceIds,
          originalClaimId: claim.originalClaimId,
          notes: claim.notes,
        }
      : {
          clientId: '',
          payerId: '',
          claimType: ClaimType.ORIGINAL,
          serviceIds: [],
          originalClaimId: null,
          notes: '',
        },
    validationSchema: claimValidationSchema,
  });

  // Initialize toast notification hook
  const toast = useToast();

  // Set up state for available services based on selected client
  const [availableServices, setAvailableServices] = useState(services || []);

  // Set up state for selected services
  const [selectedServices, setSelectedServices] = useState<string[]>(
    claim ? claim.serviceIds : []
  );

  // Create effect to fetch services when client changes
  useEffect(() => {
    if (getValues('clientId')) {
      fetchServicesByClientId(getValues('clientId'))
        .then((response) => {
          if (response.data && response.data.items) {
            setAvailableServices(response.data.items);
          } else {
            toast.error('Failed to fetch services for client');
          }
        })
        .catch((err) => {
          toast.error('Error fetching services: ' + err.message);
        });
    } else {
      setAvailableServices([]);
    }
  }, [getValues('clientId')]);

  // Create function to handle client selection change
  const handleClientChange = (event: any) => {
    setValue('clientId', event.target.value);
    setSelectedServices([]); // Clear selected services when client changes
  };

  // Create function to handle service selection change
  const handleServiceChange = (event: any) => {
    const { value } = event.target;
    setSelectedServices(value);
    setValue('serviceIds', value);
  };

  // Create function to handle form submission
  const onSubmitHandler = handleSubmit(async (data) => {
    try {
      // Call the onSubmit function passed from the parent component
      await onSubmit(data);
      toast.success('Claim submitted successfully!');
    } catch (error: any) {
      toast.error('Failed to submit claim: ' + error.message);
    }
  });

  // Create function to calculate total claim amount from selected services
  const totalClaimAmount = useMemo(() => {
    return availableServices
      .filter((service) => selectedServices.includes(service.id))
      .reduce((total, service) => total + service.amount, 0);
  }, [availableServices, selectedServices]);

  // Render form inside Card component
  return (
    <Card title="Claim Entry Form" loading={loading}>
      <form onSubmit={onSubmitHandler}>
        <Grid container spacing={2}>
          {/* Client Selection */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth error={!!errors.clientId}>
              <InputLabel id="client-label">Client</InputLabel>
              <Select
                labelId="client-label"
                value={getValues('clientId') || ''}
                label="Client"
                onChange={handleClientChange}
                {...register('clientId')}
              >
                {clients.map((client) => (
                  <MenuItem key={client.id} value={client.id}>
                    {client.firstName} {client.lastName}
                  </MenuItem>
                ))}
              </Select>
              {errors.clientId && (
                <FormHelperText>{errors.clientId.message}</FormHelperText>
              )}
            </FormControl>
          </Grid>

          {/* Payer Selection */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth error={!!errors.payerId}>
              <InputLabel id="payer-label">Payer</InputLabel>
              <Select
                labelId="payer-label"
                value={getValues('payerId') || ''}
                label="Payer"
                {...register('payerId')}
              >
                {payers.map((payer) => (
                  <MenuItem key={payer.id} value={payer.id}>
                    {payer.name}
                  </MenuItem>
                ))}
              </Select>
              {errors.payerId && (
                <FormHelperText>{errors.payerId.message}</FormHelperText>
              )}
            </FormControl>
          </Grid>

          {/* Claim Type Selection */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth error={!!errors.claimType}>
              <InputLabel id="claim-type-label">Claim Type</InputLabel>
              <Select
                labelId="claim-type-label"
                value={getValues('claimType') || ''}
                label="Claim Type"
                {...register('claimType')}
              >
                <MenuItem value={ClaimType.ORIGINAL}>Original</MenuItem>
                <MenuItem value={ClaimType.ADJUSTMENT}>Adjustment</MenuItem>
                <MenuItem value={ClaimType.REPLACEMENT}>Replacement</MenuItem>
                <MenuItem value={ClaimType.VOID}>Void</MenuItem>
              </Select>
              {errors.claimType && (
                <FormHelperText>{errors.claimType.message}</FormHelperText>
              )}
            </FormControl>
          </Grid>

          {/* Service Selection */}
          <Grid item xs={12}>
            <FormControl fullWidth error={!!errors.serviceIds}>
              <InputLabel id="services-label">Services</InputLabel>
              <Select
                labelId="services-label"
                multiple
                value={selectedServices}
                onChange={handleServiceChange}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} />
                    ))}
                  </Box>
                )}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 200,
                      width: 250,
                    },
                  },
                }}
              >
                {availableServices.map((service) => (
                  <MenuItem key={service.id} value={service.id}>
                    <Checkbox checked={selectedServices.indexOf(service.id) > -1} />
                    <ListItemText primary={`${service.serviceType} - $${service.amount}`} />
                  </MenuItem>
                ))}
              </Select>
              {errors.serviceIds && (
                <FormHelperText>{errors.serviceIds.message}</FormHelperText>
              )}
            </FormControl>
          </Grid>

          {/* Original Claim Selection (for adjustment claims) */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Original Claim (for adjustments)"
              {...register('originalClaimId')}
            />
          </Grid>

          {/* Notes */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Notes"
              multiline
              rows={4}
              {...register('notes')}
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="subtitle1">
            Total Claim Amount: ${totalClaimAmount.toFixed(2)}
          </Typography>
          <div>
            <Button variant="contained" color="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? <CircularProgress size={24} /> : 'Submit'}
            </Button>
            <Button variant="outlined" color="secondary" onClick={onCancel} sx={{ ml: 1 }}>
              Cancel
            </Button>
          </div>
        </Box>
      </form>
    </Card>
  );
};