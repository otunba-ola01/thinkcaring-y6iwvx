import React, { useState, useEffect, useMemo } from 'react'; // react v18.2.0
import {
  Box,
  Grid,
  Typography,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  Button,
  Checkbox,
  ListItemText,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material'; // v5.13.0
import { z } from 'zod'; // v3.21.0

import { ClaimEntryFormProps } from '../../types/form.types';
import { CreateClaimDto, ClaimType } from '../../types/claims.types';
import useForm from '../../hooks/useForm';
import { fetchServicesByClientId } from '../../api/services.api';
import { SelectOption } from '../../types/common.types';

/**
 * A form component for creating and editing claims
 * @param {ClaimEntryFormProps} props
 * @returns {JSX.Element} The rendered form component
 */
const ClaimEntryForm: React.FC<ClaimEntryFormProps> = (props) => {
  // LD1: Destructure props to extract claim, onSubmit, onCancel, clients, payers, services, loading, and error
  const { claim, onSubmit, onCancel, clients, payers, services, loading, error } = props;

  // LD1: Set up state for selected client ID
  const [selectedClientId, setSelectedClientId] = useState<string | undefined>(claim?.clientId);

  // LD1: Set up state for available services based on selected client
  const [availableServices, setAvailableServices] = useState<any[]>(services || []);

  // LD1: Set up state for loading services
  const [loadingServices, setLoadingServices] = useState<boolean>(false);

  // LD1: Initialize form with useForm hook, providing default values and form validation
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CreateClaimDto>({
    defaultValues: {
      clientId: '',
      payerId: '',
      claimType: ClaimType.ORIGINAL,
      serviceIds: [],
      notes: '',
    },
    // LD1: Provide a validation schema for the form
    // LD2: The validation schema should ensure that clientId, payerId, and serviceIds are required
    // LD2: The validation schema should also ensure that claimType is a valid ClaimType enum value
    validationSchema: z.object({
      clientId: z.string().min(1, { message: 'Client is required' }),
      payerId: z.string().min(1, { message: 'Payer is required' }),
      claimType: z.nativeEnum(ClaimType, {
        errorMap: () => ({ message: 'Claim Type is required' }),
      }),
      serviceIds: z.array(z.string()).min(1, { message: 'At least one service is required' }),
      notes: z.string().optional(),
    }),
  });

  // LD1: Create effect to load services when client selection changes
  useEffect(() => {
    // IE1: Check that fetchServicesByClientId is used correctly based on the source files provided to you.
    // IE1: fetchServicesByClientId requires a clientId as an input, so we must ensure that we satisfy such prerequisites using the specific contents of our assigned file.
    const loadServices = async () => {
      if (selectedClientId) {
        setLoadingServices(true);
        try {
          const response = await fetchServicesByClientId(selectedClientId);
          setAvailableServices(response.data.items);
        } catch (error) {
          console.error('Failed to load services:', error);
        } finally {
          setLoadingServices(false);
        }
      } else {
        setAvailableServices([]);
      }
    };

    loadServices();
  }, [selectedClientId]);

  // LD1: Create function to handle client selection change
  const handleClientChange = (event: any) => {
    const clientId = event.target.value as string;
    setSelectedClientId(clientId);
    setValue('clientId', clientId);
  };

  // LD1: Create function to calculate total amount based on selected services
  const calculateTotalAmount = () => {
    const selectedServiceIds = (availableServices || []).filter((service) =>
      (claim?.serviceIds || []).includes(service.id)
    );
    return selectedServiceIds.reduce((total, service) => total + service.amount, 0);
  };

  // LD1: Create memoized default values based on existing claim or empty values
  const defaultValues = useMemo(() => ({
    clientId: claim?.clientId || '',
    payerId: claim?.payerId || '',
    claimType: claim?.claimType || ClaimType.ORIGINAL,
    serviceIds: claim?.serviceIds || [],
    notes: claim?.notes || '',
  }), [claim]);

  // LD1: Render form with Grid layout containing form fields
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Grid container spacing={2}>
        {/* LD1: Render client selection dropdown with available clients */}
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth error={!!errors.clientId}>
            <InputLabel id="client-label">Client</InputLabel>
            <Select
              labelId="client-label"
              id="client"
              value={selectedClientId || ''}
              label="Client"
              onChange={handleClientChange}
              {...register('clientId')}
            >
              {clients?.map((client) => (
                <MenuItem key={client.value} value={client.value}>
                  {client.label}
                </MenuItem>
              ))}
            </Select>
            {errors.clientId && (
              <FormHelperText>{errors.clientId.message}</FormHelperText>
            )}
          </FormControl>
        </Grid>

        {/* LD1: Render payer selection dropdown with available payers */}
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth error={!!errors.payerId}>
            <InputLabel id="payer-label">Payer</InputLabel>
            <Select
              labelId="payer-label"
              id="payer"
              value={defaultValues.payerId}
              label="Payer"
              {...register('payerId')}
            >
              {payers?.map((payer) => (
                <MenuItem key={payer.value} value={payer.value}>
                  {payer.label}
                </MenuItem>
              ))}
            </Select>
            {errors.payerId && (
              <FormHelperText>{errors.payerId.message}</FormHelperText>
            )}
          </FormControl>
        </Grid>

        {/* LD1: Render service selection multi-select with available services */}
        <Grid item xs={12}>
          <FormControl fullWidth error={!!errors.serviceIds}>
            <InputLabel id="services-label">Services</InputLabel>
            <Select
              labelId="services-label"
              id="services"
              multiple
              value={defaultValues.serviceIds}
              label="Services"
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(selected as string[]).map((value) => (
                    <Chip key={value} label={value} />
                  ))}
                </Box>
              )}
              {...register('serviceIds')}
            >
              {loadingServices ? (
                <MenuItem disabled>
                  <CircularProgress size={20} />
                  Loading services...
                </MenuItem>
              ) : (
                availableServices?.map((service) => (
                  <MenuItem key={service.id} value={service.id}>
                    <Checkbox checked={(defaultValues.serviceIds as string[]).includes(service.id)} />
                    <ListItemText primary={`${service.serviceType} - ${service.amount}`} />
                  </MenuItem>
                ))
              )}
            </Select>
            {errors.serviceIds && (
              <FormHelperText>{errors.serviceIds.message}</FormHelperText>
            )}
          </FormControl>
        </Grid>

        {/* LD1: Render claim type selection for new or adjustment claims */}
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth error={!!errors.claimType}>
            <InputLabel id="claim-type-label">Claim Type</InputLabel>
            <Select
              labelId="claim-type-label"
              id="claimType"
              value={defaultValues.claimType}
              label="Claim Type"
              {...register('claimType')}
            >
              <MenuItem value={ClaimType.ORIGINAL}>Original</MenuItem>
              <MenuItem value={ClaimType.ADJUSTMENT}>Adjustment</MenuItem>
            </Select>
            {errors.claimType && (
              <FormHelperText>{errors.claimType.message}</FormHelperText>
            )}
          </FormControl>
        </Grid>

        {/* LD1: Render notes text field for additional information */}
        <Grid item xs={12}>
          <TextField
            id="notes"
            label="Notes"
            multiline
            rows={4}
            fullWidth
            {...register('notes')}
          />
        </Grid>

        {/* LD1: Display validation errors if present */}
        {error && (
          <Grid item xs={12}>
            <Alert severity="error">{error}</Alert>
          </Grid>
        )}

        {/* LD1: Render form actions (Submit and Cancel buttons) */}
        <Grid item xs={12}>
          <Box display="flex" justifyContent="flex-end" gap={2}>
            <Button onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? <CircularProgress size={24} /> : 'Submit'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </form>
  );
};

export default ClaimEntryForm;