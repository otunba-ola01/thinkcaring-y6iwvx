import React, { useState, useEffect, useCallback } from 'react'; // v18.2.0
import {
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Switch,
  FormControlLabel,
  Grid,
  Typography,
  Divider,
} from '@mui/material'; // v5.13.0
import { Save, Cancel } from '@mui/icons-material'; // v5.13.0
import { useTheme } from '@mui/material/styles'; // v5.13.0

import useForm from '../../hooks/useForm'; // Custom hook for form state management and validation
import Card from '../ui/Card'; // Card container component for the form
import { ServiceType } from '../../types/services.types'; // Enum for service type categories
import {
  ServiceCode,
  CreateServiceCodeDto,
  UpdateServiceCodeDto,
} from '../../types/settings.types'; // Type definitions for service code data and operations
import { getPrograms } from '../../api/settings.api'; // API function to fetch programs for association with service codes

interface ServiceCodeFormProps {
  serviceCode?: ServiceCode;
  onSubmit: (data: CreateServiceCodeDto | UpdateServiceCodeDto) => void;
  onCancel: () => void;
  loading?: boolean;
}

/**
 * Form component for creating and editing service codes
 * @param {object} props - ServiceCodeFormProps
 * @returns {JSX.Element} The rendered form component
 */
const ServiceCodeForm: React.FC<ServiceCodeFormProps> = ({
  serviceCode,
  onSubmit,
  onCancel,
  loading,
}) => {
  // Extract serviceCode, onSubmit, onCancel, and loading props
  const theme = useTheme();

  // Initialize form state with useForm hook
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateServiceCodeDto | UpdateServiceCodeDto>({
    defaultValues: {
      code: '',
      name: '',
      description: '',
      type: ServiceType.OTHER,
      rate: 0,
      programIds: [],
      documentationRequired: false,
      active: true,
    },
  });

  // Initialize state for programs list
  const [programs, setPrograms] = useState<
    { value: string; label: string }[]
  >([]);

  // Initialize state for loading programs
  const [loadingPrograms, setLoadingPrograms] = useState(false);

  // Define validation schema for form fields
  // Implement fetchPrograms function to load program data
  const fetchPrograms = useCallback(async () => {
    setLoadingPrograms(true);
    try {
      const response = await getPrograms({ pagination: { page: 1, pageSize: 1000 } });
      if (response.data && response.data.items) {
        setPrograms(
          response.data.items.map((program) => ({
            value: program.id,
            label: `${program.name} (${program.code})`,
          }))
        );
      }
    } catch (error) {
      console.error('Failed to load programs:', error);
      // Handle error appropriately, e.g., display an error message
    } finally {
      setLoadingPrograms(false);
    }
  }, []);

  // Implement handleSubmit function to process form submission
  const submitHandler = handleSubmit(async (data) => {
    // Map programIds to an array of UUIDs
    const programIds = data.programIds ? data.programIds : [];
    const submitData = { ...data, programIds };
    onSubmit(submitData);
  });

  // Implement useEffect to load programs on component mount
  useEffect(() => {
    fetchPrograms();
  }, [fetchPrograms]);

  // Implement useEffect to initialize form with serviceCode data when editing
  useEffect(() => {
    if (serviceCode) {
      reset({
        code: serviceCode.code,
        name: serviceCode.name,
        description: serviceCode.description,
        type: serviceCode.type,
        rate: serviceCode.rate,
        programIds: serviceCode.programIds || [], // Ensure programIds is always an array
        documentationRequired: serviceCode.documentationRequired,
        active: serviceCode.active,
      });
    }
  }, [serviceCode, reset]);

  // Helper function to convert ServiceType enum to select options
  const getServiceTypeOptions = () => {
    return Object.values(ServiceType).map((type) => ({
      value: type,
      label: type.replace(/_/g, ' '), // Replace underscores with spaces for display
    }));
  };

  // Render form with Material UI components
  return (
    <Card title={serviceCode ? 'Edit Service Code' : 'Create Service Code'} loading={loading}>
      <Box component="form" onSubmit={submitHandler} sx={{ mt: 1 }}>
        <Grid container spacing={2}>
          {/* Code Field */}
          <Grid item xs={12} sm={6}>
            <TextField
              label="Code"
              fullWidth
              {...register('code', { required: 'Code is required' })}
              error={!!errors.code}
              helperText={errors.code?.message}
              disabled={loading}
            />
          </Grid>

          {/* Name Field */}
          <Grid item xs={12} sm={6}>
            <TextField
              label="Name"
              fullWidth
              {...register('name', { required: 'Name is required' })}
              error={!!errors.name}
              helperText={errors.name?.message}
              disabled={loading}
            />
          </Grid>

          {/* Description Field */}
          <Grid item xs={12}>
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={3}
              {...register('description')}
              disabled={loading}
            />
          </Grid>

          {/* Type Field */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth error={!!errors.type} disabled={loading}>
              <InputLabel id="type-label">Type</InputLabel>
              <Select
                labelId="type-label"
                label="Type"
                {...register('type', { required: 'Type is required' })}
              >
                {getServiceTypeOptions().map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
              {errors.type && (
                <FormHelperText>{errors.type.message}</FormHelperText>
              )}
            </FormControl>
          </Grid>

          {/* Rate Field */}
          <Grid item xs={12} sm={6}>
            <TextField
              label="Rate"
              type="number"
              fullWidth
              {...register('rate', {
                required: 'Rate is required',
                valueAsNumber: true,
              })}
              error={!!errors.rate}
              helperText={errors.rate?.message}
              disabled={loading}
            />
          </Grid>

          {/* Program Associations Field */}
          <Grid item xs={12}>
            <FormControl fullWidth disabled={loadingPrograms || loading}>
              <InputLabel id="programIds-label">Program Associations</InputLabel>
              <Select
                labelId="programIds-label"
                multiple
                label="Program Associations"
                {...register('programIds')}
                renderValue={(selected) => {
                  return (selected as string[])
                    .map(
                      (s) =>
                        programs.find((program) => program.value === s)?.label
                    )
                    .join(', ');
                }}
              >
                {programs.map((program) => (
                  <MenuItem key={program.value} value={program.value}>
                    {program.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Documentation Requirements Field */}
          <Grid item xs={12}>
            <FormControlLabel
              control={<Switch {...register('documentationRequired')} disabled={loading} />}
              label="Documentation Required"
            />
          </Grid>

          {/* Active Status Field */}
          <Grid item xs={12}>
            <FormControlLabel
              control={<Switch {...register('active')} disabled={loading} />}
              label="Active"
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* Submit and Cancel Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button variant="outlined" onClick={onCancel} disabled={loading}>
            <Cancel sx={{ mr: 1 }} />
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading}
          >
            <Save sx={{ mr: 1 }} />
            {serviceCode ? 'Update' : 'Create'}
          </Button>
        </Box>
      </Box>
    </Card>
  );
};

// Helper function to convert ServiceType enum to select options
const getServiceTypeOptions = () => {
  return Object.values(ServiceType).map((type) => ({
    value: type,
    label: type.replace(/_/g, ' '), // Replace underscores with spaces for display
  }));
};

export default ServiceCodeForm;