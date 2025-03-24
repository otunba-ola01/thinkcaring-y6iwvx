import React, { useState, useEffect } from 'react'; // v18.2.0
import { z } from 'zod'; // v3.21.0
import { Controller } from 'react-hook-form'; // v7.45.0
import {
  Box,
  Typography,
  Button,
  Grid,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  Switch,
  FormControlLabel,
  Divider,
  CircularProgress
} from '@mui/material'; // v5.13.0

import useForm from '../../hooks/useForm';
import useToast from '../../hooks/useToast';
import { ServiceCode } from '../../types/settings.types';
import { ServiceType } from '../../types/services.types';
import { FormFieldType } from '../../types/form.types';
import { SelectOption } from '../../types/common.types';

/**
 * Zod schema for validating service code form data
 */
const serviceCodeSchema = z.object({
  code: z.string()
    .min(1, 'Code is required')
    .max(20, 'Code must be 20 characters or less'),
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less'),
  description: z.string().optional(),
  serviceType: z.nativeEnum(ServiceType, { 
    errorMap: () => ({ message: 'Service type is required' })
  }),
  defaultRate: z.number()
    .min(0, 'Rate must be 0 or greater'),
  requiresDocumentation: z.boolean(),
  documentationRequirements: z.string().optional(),
  active: z.boolean(),
  programIds: z.array(z.string())
    .min(1, 'At least one program must be selected')
}).refine(
  data => !data.requiresDocumentation || 
    (data.requiresDocumentation && 
     data.documentationRequirements && 
     data.documentationRequirements.trim() !== ''
    ),
  {
    message: 'Documentation requirements must be provided when documentation is required',
    path: ['documentationRequirements']
  }
);

/**
 * Props interface for the ServiceCodeForm component
 */
export interface ServiceCodeFormProps {
  /** Service code data when editing an existing code */
  serviceCode?: ServiceCode;
  /** Callback function for form submission */
  onSubmit: (data: any) => Promise<void>;
  /** Optional callback function for cancellation */
  onCancel?: () => void;
  /** Array of available programs for association */
  programs: SelectOption[];
  /** Whether the form is in a loading state */
  loading?: boolean;
}

/**
 * Form component for creating and editing service codes in the HCBS Revenue Management System.
 * This component provides a user interface for administrators to manage service codes,
 * including their rates, documentation requirements, and program associations.
 */
const ServiceCodeForm: React.FC<ServiceCodeFormProps> = ({
  serviceCode,
  onSubmit,
  onCancel,
  programs,
  loading = false
}) => {
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  // Initialize the form with Zod schema validation
  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    setValue,
    reset,
    watch
  } = useForm({
    defaultValues: {
      code: serviceCode?.code || '',
      name: serviceCode?.name || '',
      description: serviceCode?.description || '',
      serviceType: serviceCode?.serviceType || '',
      defaultRate: serviceCode?.defaultRate || 0,
      requiresDocumentation: serviceCode?.requiresDocumentation || false,
      documentationRequirements: serviceCode?.documentationRequirements || '',
      active: serviceCode?.active !== undefined ? serviceCode.active : true,
      programIds: serviceCode?.programIds || []
    },
    validationSchema: serviceCodeSchema
  });

  // Watch requiresDocumentation field to conditionally show documentation requirements
  const requiresDocumentation = watch('requiresDocumentation');

  // Reset form when serviceCode prop changes
  useEffect(() => {
    if (serviceCode) {
      reset({
        code: serviceCode.code || '',
        name: serviceCode.name || '',
        description: serviceCode.description || '',
        serviceType: serviceCode.serviceType || '',
        defaultRate: serviceCode.defaultRate || 0,
        requiresDocumentation: serviceCode.requiresDocumentation || false,
        documentationRequirements: serviceCode.documentationRequirements || '',
        active: serviceCode.active !== undefined ? serviceCode.active : true,
        programIds: serviceCode.programIds || []
      });
    }
  }, [serviceCode, reset]);

  // Handle form submission with error handling
  const handleFormSubmit = async (data: any) => {
    try {
      setSubmitting(true);
      await onSubmit(data);
      toast.success('Service code saved successfully');
    } catch (error) {
      console.error('Error saving service code:', error);
      toast.error(
        error instanceof Error ? error.message : 'An error occurred while saving the service code'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit(handleFormSubmit)} noValidate>
      <Grid container spacing={3}>
        {/* Code field */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Code *"
            {...register('code')}
            error={!!errors.code}
            helperText={errors.code?.message as string}
            disabled={loading || submitting}
            inputProps={{ maxLength: 20 }}
          />
        </Grid>
        
        {/* Name field */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Name *"
            {...register('name')}
            error={!!errors.name}
            helperText={errors.name?.message as string}
            disabled={loading || submitting}
            inputProps={{ maxLength: 100 }}
          />
        </Grid>
        
        {/* Description field */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Description"
            multiline
            rows={3}
            {...register('description')}
            error={!!errors.description}
            helperText={errors.description?.message as string}
            disabled={loading || submitting}
          />
        </Grid>
        
        {/* Service Type dropdown */}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth error={!!errors.serviceType}>
            <InputLabel id="service-type-label">Service Type *</InputLabel>
            <Controller
              name="serviceType"
              control={control}
              render={({ field }) => (
                <Select
                  labelId="service-type-label"
                  label="Service Type *"
                  {...field}
                  disabled={loading || submitting}
                >
                  {Object.entries(ServiceType).map(([key, value]) => (
                    <MenuItem key={value} value={value}>
                      {key.replace(/_/g, ' ')}
                    </MenuItem>
                  ))}
                </Select>
              )}
            />
            {errors.serviceType && (
              <FormHelperText>{errors.serviceType.message as string}</FormHelperText>
            )}
          </FormControl>
        </Grid>
        
        {/* Default Rate field */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Default Rate ($) *"
            type="number"
            inputProps={{ step: '0.01', min: 0 }}
            {...register('defaultRate', { valueAsNumber: true })}
            error={!!errors.defaultRate}
            helperText={errors.defaultRate?.message as string}
            disabled={loading || submitting}
          />
        </Grid>
        
        {/* Requires Documentation switch */}
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Controller
                name="requiresDocumentation"
                control={control}
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    disabled={loading || submitting}
                  />
                )}
              />
            }
            label="Requires Documentation"
          />
        </Grid>
        
        {/* Documentation Requirements field - only shown when requiresDocumentation is true */}
        {requiresDocumentation && (
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Documentation Requirements *"
              multiline
              rows={3}
              {...register('documentationRequirements')}
              error={!!errors.documentationRequirements}
              helperText={errors.documentationRequirements?.message as string}
              disabled={loading || submitting}
              placeholder="Specify required documentation (e.g., service notes, time tracking, supervisor signature)"
            />
          </Grid>
        )}
        
        {/* Active status switch */}
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Controller
                name="active"
                control={control}
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    disabled={loading || submitting}
                  />
                )}
              />
            }
            label="Active"
          />
        </Grid>
        
        {/* Program associations multi-select */}
        <Grid item xs={12}>
          <FormControl fullWidth error={!!errors.programIds}>
            <InputLabel id="programs-label">Associated Programs *</InputLabel>
            <Controller
              name="programIds"
              control={control}
              render={({ field }) => (
                <Select
                  labelId="programs-label"
                  label="Associated Programs *"
                  multiple
                  {...field}
                  disabled={loading || submitting}
                >
                  {programs.map((program) => (
                    <MenuItem key={program.value.toString()} value={program.value.toString()}>
                      {program.label}
                    </MenuItem>
                  ))}
                </Select>
              )}
            />
            {errors.programIds && (
              <FormHelperText>{errors.programIds.message as string}</FormHelperText>
            )}
          </FormControl>
        </Grid>
        
        {/* Divider before action buttons */}
        <Grid item xs={12}>
          <Divider />
        </Grid>
        
        {/* Form action buttons */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            {onCancel && (
              <Button
                variant="outlined"
                onClick={onCancel}
                disabled={loading || submitting}
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading || submitting}
              startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : null}
            >
              {serviceCode ? 'Update' : 'Create'} Service Code
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ServiceCodeForm;