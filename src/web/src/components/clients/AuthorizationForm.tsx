import React, { useState, useEffect, useMemo } from 'react'; // v18.2.0
import { useRouter } from 'next/router'; // v13.4+
import {
  Box,
  Grid,
  TextField,
  MenuItem,
  Button,
  Typography,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  SxProps,
} from '@mui/material'; // v5.13+
import { DatePicker } from '@mui/x-date-pickers'; // v6.0+
import { z } from 'zod'; // v3.21+

import Card from '../ui/Card';
import useForm from '../../hooks/useForm';
import useClients from '../../hooks/useClients';
import useApiRequest from '../../hooks/useApiRequest';
import { formatDate, parseApiDate } from '../../utils/date';
import { Authorization } from './AuthorizationList';
import { UUID, StatusType } from '../../types/common.types';
import { ServiceType } from '../../types/services.types';
import { ROUTES } from '../../constants/routes.constants';

/**
 * Props interface for the AuthorizationForm component
 */
export interface AuthorizationFormProps {
  clientId: UUID;
  authorizationId?: UUID;
  onSuccess: () => void;
  sx?: SxProps;
}

/**
 * Interface for authorization form data structure
 */
export interface AuthorizationFormData {
  authorizationNumber: string;
  serviceTypeId: UUID;
  programId: UUID;
  payerId: UUID | null;
  startDate: string;
  endDate: string | null;
  authorizedUnits: number;
  status: StatusType;
  notes: string | null;
}

/**
 * DTO for creating a new authorization
 */
export interface CreateAuthorizationDto {
  authorizationNumber: string;
  clientId: UUID;
  serviceTypeId: UUID;
  programId: UUID;
  payerId: UUID | null;
  startDate: string;
  endDate: string | null;
  authorizedUnits: number;
  status: StatusType;
  notes: string | null;
}

/**
 * DTO for updating an existing authorization
 */
export interface UpdateAuthorizationDto {
  authorizationNumber: string;
  serviceTypeId: UUID;
  programId: UUID;
  payerId: UUID | null;
  startDate: string;
  endDate: string | null;
  authorizedUnits: number;
  status: StatusType;
  notes: string | null;
}

/**
 * Component for creating or editing a client service authorization
 */
const AuthorizationForm: React.FC<AuthorizationFormProps> = ({
  clientId,
  authorizationId,
  onSuccess,
  sx,
}) => {
  // Initialize router for navigation
  const router = useRouter();

  // Initialize state for loading, error, serviceTypes, programs, and payers
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serviceTypes, setServiceTypes] = useState<
    { value: UUID; label: string }[]
  >([]);
  const [programs, setPrograms] = useState<{ value: UUID; label: string }[]>([]);
  const [payers, setPayers] = useState<{ value: UUID; label: string }[]>([]);

  // Initialize form validation schema using Zod
  const validationSchema = useMemo(() => getValidationSchema(), []);

  // Initialize form with useForm hook and validation schema
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AuthorizationFormData>({
    validationSchema,
  });

  // Initialize useClients hook for client authorization operations
  const { addClientAuthorization, updateClientAuthorization } = useClients();

  // Initialize useApiRequest hook for making API requests
  const { execute: apiRequest } = useApiRequest();

  // Create fetchServiceTypes function to get available service types
  const fetchServiceTypes = async () => {
    // Placeholder for API call to fetch service types
    // const response = await apiRequest({ url: '/api/service-types', method: 'GET' });
    // setServiceTypes(response.data.map(st => ({ value: st.id, label: st.name })));
    setServiceTypes([
      { value: '1' as UUID, label: 'Personal Care' },
      { value: '2' as UUID, label: 'Respite Care' },
    ]);
  };

  // Create fetchPrograms function to get available programs
  const fetchPrograms = async () => {
    // Placeholder for API call to fetch programs
    // const response = await apiRequest({ url: '/api/programs', method: 'GET' });
    // setPrograms(response.data.map(p => ({ value: p.id, label: p.name })));
    setPrograms([
      { value: '1' as UUID, label: 'Program A' },
      { value: '2' as UUID, label: 'Program B' },
    ]);
  };

  // Create fetchPayers function to get available payers
  const fetchPayers = async () => {
    // Placeholder for API call to fetch payers
    // const response = await apiRequest({ url: '/api/payers', method: 'GET' });
    // setPayers(response.data.map(p => ({ value: p.id, label: p.name })));
    setPayers([
      { value: '1' as UUID, label: 'Medicaid' },
      { value: '2' as UUID, label: 'Medicare' },
    ]);
  };

  // Create fetchAuthorization function to get existing authorization data if editing
  const fetchAuthorization = async (authorizationId: UUID) => {
    setLoading(true);
    setError(null);

    try {
      // Placeholder for API call to fetch authorization data
      // const response = await apiRequest({ url: `/api/authorizations/${authorizationId}`, method: 'GET' });
      // const authorization = response.data;
      // reset({
      //   authorizationNumber: authorization.authorizationNumber,
      //   serviceTypeId: authorization.serviceTypeId,
      //   programId: authorization.programId,
      //   payerId: authorization.payerId,
      //   startDate: formatDate(authorization.startDate),
      //   endDate: formatDate(authorization.endDate),
      //   authorizedUnits: authorization.authorizedUnits,
      //   status: authorization.status,
      //   notes: authorization.notes,
      // });
    } catch (err: any) {
      setError(err.message || 'Failed to fetch authorization');
    } finally {
      setLoading(false);
    }
  };

  // Create handleSubmit function to process form submission
  const onSubmit = async (formData: AuthorizationFormData) => {
    setLoading(true);
    setError(null);

    try {
      const formattedData = formatFormData(formData);

      if (authorizationId) {
        // Update existing authorization
        await updateClientAuthorization(
          clientId,
          authorizationId,
          formattedData
        );
      } else {
        // Create new authorization
        await addClientAuthorization(clientId, formattedData);
      }

      toast.success('Authorization saved successfully');
      onSuccess();
      router.push(`${ROUTES.CLIENTS.ROOT}/${clientId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to save authorization');
      toast.error(err.message || 'Failed to save authorization');
    } finally {
      setLoading(false);
    }
  };

  // Create handleCancel function to navigate back to client authorizations page
  const handleCancel = () => {
    router.push(`${ROUTES.CLIENTS.ROOT}/${clientId}`);
  };

  // Use useEffect to fetch reference data (service types, programs, payers) on component mount
  useEffect(() => {
    Promise.all([fetchServiceTypes(), fetchPrograms(), fetchPayers()]);
  }, []);

  // Use useEffect to fetch authorization data if authorizationId is provided
  useEffect(() => {
    if (authorizationId) {
      fetchAuthorization(authorizationId);
    }
  }, [authorizationId]);

  // Render loading state when data is being fetched
  if (loading) {
    return <Typography>Loading authorization form...</Typography>;
  }

  // Render error state if data fetch fails
  if (error) {
    return <Typography color="error">Error: {error}</Typography>;
  }

  // Render form with Card component containing form fields
  return (
    <Card title="Authorization Form" sx={sx}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={2}>
          {/* Authorization Number */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Authorization Number"
              {...register('authorizationNumber')}
              error={!!errors.authorizationNumber}
              helperText={errors.authorizationNumber?.message}
            />
          </Grid>

          {/* Service Type */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth error={!!errors.serviceTypeId}>
              <InputLabel id="service-type-label">Service Type</InputLabel>
              <Select
                labelId="service-type-label"
                label="Service Type"
                {...register('serviceTypeId')}
              >
                {serviceTypes.map((st) => (
                  <MenuItem key={st.value} value={st.value}>
                    {st.label}
                  </MenuItem>
                ))}
              </Select>
              {errors.serviceTypeId && (
                <FormHelperText>{errors.serviceTypeId.message}</FormHelperText>
              )}
            </FormControl>
          </Grid>

          {/* Program */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth error={!!errors.programId}>
              <InputLabel id="program-label">Program</InputLabel>
              <Select labelId="program-label" label="Program" {...register('programId')}>
                {programs.map((program) => (
                  <MenuItem key={program.value} value={program.value}>
                    {program.label}
                  </MenuItem>
                ))}
              </Select>
              {errors.programId && (
                <FormHelperText>{errors.programId.message}</FormHelperText>
              )}
            </FormControl>
          </Grid>

          {/* Payer */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel id="payer-label">Payer</InputLabel>
              <Select labelId="payer-label" label="Payer" {...register('payerId')}>
                <MenuItem value="">None</MenuItem>
                {payers.map((payer) => (
                  <MenuItem key={payer.value} value={payer.value}>
                    {payer.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Start Date */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Start Date"
              type="date"
              InputLabelProps={{ shrink: true }}
              {...register('startDate')}
              error={!!errors.startDate}
              helperText={errors.startDate?.message}
            />
          </Grid>

          {/* End Date */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="End Date"
              type="date"
              InputLabelProps={{ shrink: true }}
              {...register('endDate')}
              error={!!errors.endDate}
              helperText={errors.endDate?.message}
            />
          </Grid>

          {/* Authorized Units */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Authorized Units"
              type="number"
              {...register('authorizedUnits', { valueAsNumber: true })}
              error={!!errors.authorizedUnits}
              helperText={errors.authorizedUnits?.message}
            />
          </Grid>

          {/* Status */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth error={!!errors.status}>
              <InputLabel id="status-label">Status</InputLabel>
              <Select labelId="status-label" label="Status" {...register('status')}>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
              {errors.status && <FormHelperText>{errors.status.message}</FormHelperText>}
            </FormControl>
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

          {/* Submit and Cancel Buttons */}
          <Grid item xs={12}>
            <Box display="flex" justifyContent="flex-end">
              <Button onClick={handleCancel} sx={{ mr: 2 }}>
                Cancel
              </Button>
              <Button type="submit" variant="contained" color="primary">
                Save
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Card>
  );
};

/**
 * Creates a Zod validation schema for the authorization form
 */
const getValidationSchema = () => {
  return z.object({
    authorizationNumber: z.string().min(1, { message: 'Authorization number is required' }),
    serviceTypeId: z.string().uuid({ message: 'Service type is required' }),
    programId: z.string().uuid({ message: 'Program is required' }),
    payerId: z.string().uuid({ message: 'Payer must be a valid UUID' }).nullable(),
    startDate: z.string().min(1, { message: 'Start date is required' }),
    endDate: z.string().nullable(),
    authorizedUnits: z.number().min(1, { message: 'Authorized units must be at least 1' }),
    status: z.enum(['active', 'inactive'] as [string, ...string[]], {
      errorMap: () => ({ message: 'Status is required' }),
    }),
    notes: z.string().nullable(),
  });
};

/**
 * Formats form data for API submission
 */
const formatFormData = (formData: AuthorizationFormData) => {
  const { startDate, endDate, authorizedUnits, ...rest } = formData;

  return {
    ...rest,
    startDate: formatDate(startDate),
    endDate: endDate ? formatDate(endDate) : null,
    authorizedUnits: Number(authorizedUnits),
    clientId,
  };
};

export default AuthorizationForm;