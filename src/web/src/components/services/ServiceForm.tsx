import React, { useState, useEffect, useMemo } from 'react'; // v18.2.0
import {
  Grid,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  Button,
  Box,
  Typography,
  Divider,
  CircularProgress,
} from '@mui/material'; // v5.13.0
import { DatePicker, TimePicker, LocalizationProvider } from '@mui/x-date-pickers'; // v6.0.0
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'; // v6.0.0
import { z } from 'zod'; // v3.21.0

import useForm from '../../hooks/useForm';
import useServices from '../../hooks/useServices';
import useToast from '../../hooks/useToast';
import Card from '../ui/Card';
import FileUploader from '../ui/FileUploader';
import { ServiceEntryFormProps } from '../../types/form.types';
import {
  CreateServiceDto,
  UpdateServiceDto,
  DocumentationStatus,
  BillingStatus,
  ServiceType,
} from '../../types/services.types';
import {
  DOCUMENTATION_STATUS_OPTIONS,
  BILLING_STATUS_OPTIONS,
} from '../../constants/services.constants';
import { formatCurrency, formatDate } from '../../utils/format';

/**
 * Calculates the total amount based on units and rate
 * @param units The number of units
 * @param rate The rate per unit
 * @returns The calculated amount (units * rate)
 */
const calculateAmount = (units: number, rate: number): number => {
  // Check if both units and rate are valid numbers
  if (typeof units !== 'number' || isNaN(units) || typeof rate !== 'number' || isNaN(rate)) {
    return 0;
  }

  // Multiply units by rate and return the result
  return units * rate;
};

/**
 * Form component for creating and editing services
 * @param {ServiceEntryFormProps} props
 * @returns {JSX.Element} The rendered service form component
 */
const ServiceForm: React.FC<ServiceEntryFormProps> = ({
  service,
  onSubmit,
  onCancel,
  clients,
  serviceTypes,
  staff,
  loading,
  error,
}) => {
  // Destructure props to extract service data, submission handlers, and options
  const isEditMode = !!service;

  // Initialize form with useForm hook and validation
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
    isSubmitting,
  } = useForm<CreateServiceDto | UpdateServiceDto>({
    defaultValues: {
      clientId: '',
      serviceTypeId: '',
      serviceCode: '',
      serviceDate: formatDate(new Date()),
      startTime: '08:00',
      endTime: '17:00',
      units: 1,
      rate: 50,
      staffId: '',
      facilityId: '',
      programId: '',
      authorizationId: '',
      documentationStatus: DocumentationStatus.INCOMPLETE,
      notes: '',
      documentIds: [],
    },
    // validationSchema: serviceValidationSchema, // TODO: Implement Zod schema
  });

  // Set up state for calculated amount, loading indicators, and file uploads
  const [calculatedAmount, setCalculatedAmount] = useState<number>(0);
  const [fileUploadLoading, setFileUploadLoading] = useState<boolean>(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  // Initialize toast notifications
  const toast = useToast();

  // Set up effect to calculate amount when units or rate changes
  useEffect(() => {
    const units = Number(watch('units'));
    const rate = Number(watch('rate'));
    setCalculatedAmount(calculateAmount(units, rate));
  }, [watch('units'), watch('rate')]);

  // Initialize useForm watch
  const watch = useFormContextWatch();

  // Set up effect to populate form with service data when editing
  useEffect(() => {
    if (service) {
      reset({
        clientId: service.clientId,
        serviceTypeId: service.serviceTypeId,
        serviceCode: service.serviceCode,
        serviceDate: service.serviceDate,
        startTime: service.startTime || '08:00',
        endTime: service.endTime || '17:00',
        units: service.units,
        rate: service.rate,
        staffId: service.staffId || '',
        facilityId: service.facilityId || '',
        programId: service.programId,
        authorizationId: service.authorizationId || '',
        documentationStatus: service.documentationStatus,
        notes: service.notes || '',
        documentIds: service.documentIds || [],
      });
      setCalculatedAmount(calculateAmount(service.units, service.rate));
    }
  }, [service, reset]);

  // Create handler for form submission that creates or updates a service
  const onSubmitHandler = handleSubmit(async (data) => {
    try {
      if (isEditMode) {
        // await updateService(service.id, data); // TODO: Implement update service
        toast.success('Service updated successfully');
      } else {
        // await createService(data); // TODO: Implement create service
        toast.success('Service created successfully');
      }
      onSubmit(data);
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit service');
    }
  });

  // Create handler for file uploads to attach documentation
  const handleFileUpload = async (files: File[]) => {
    setFileUploadLoading(true);
    try {
      // TODO: Implement file upload logic
      setUploadedFiles(files);
      toast.success('Files uploaded successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload files');
    } finally {
      setFileUploadLoading(false);
    }
  };

  // Render a Card component containing the form
  return (
    <Card title={isEditMode ? 'Edit Service' : 'Create Service'} loading={loading}>
      <form onSubmit={onSubmitHandler}>
        {/* Render Grid layout with form fields organized in a responsive layout */}
        <Grid container spacing={2}>
          {/* Render client selection dropdown with provided client options */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth error={!!errors.clientId}>
              <InputLabel id="client-label">Client</InputLabel>
              <Select labelId="client-label" label="Client" {...register('clientId')}>
                {clients.map((client) => (
                  <MenuItem key={client.value} value={client.value}>
                    {client.label}
                  </MenuItem>
                ))}
              </Select>
              {errors.clientId && <FormHelperText>{errors.clientId.message}</FormHelperText>}
            </FormControl>
          </Grid>

          {/* Render service type selection dropdown with provided service type options */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth error={!!errors.serviceTypeId}>
              <InputLabel id="service-type-label">Service Type</InputLabel>
              <Select labelId="service-type-label" label="Service Type" {...register('serviceTypeId')}>
                {serviceTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
              {errors.serviceTypeId && <FormHelperText>{errors.serviceTypeId.message}</FormHelperText>}
            </FormControl>
          </Grid>

          {/* Render date picker for service date */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth error={!!errors.serviceDate}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Service Date"
                  slotProps={{ textField: { helperText: errors.serviceDate?.message } }}
                  {...register('serviceDate')}
                />
              </LocalizationProvider>
            </FormControl>
          </Grid>

          {/* Render time pickers for start and end times (optional) */}
          <Grid item xs={6} md={3}>
            <FormControl fullWidth>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <TimePicker label="Start Time" {...register('startTime')} />
              </LocalizationProvider>
            </FormControl>
          </Grid>
          <Grid item xs={6} md={3}>
            <FormControl fullWidth>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <TimePicker label="End Time" {...register('endTime')} />
              </LocalizationProvider>
            </FormControl>
          </Grid>

          {/* Render numeric inputs for units and rate */}
          <Grid item xs={6} md={3}>
            <TextField
              fullWidth
              label="Units"
              type="number"
              {...register('units')}
              error={!!errors.units}
              helperText={errors.units?.message}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <TextField
              fullWidth
              label="Rate"
              type="number"
              {...register('rate')}
              error={!!errors.rate}
              helperText={errors.rate?.message}
            />
          </Grid>

          {/* Render calculated amount field (read-only) */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Amount"
              value={formatCurrency(calculatedAmount)}
              InputProps={{ readOnly: true }}
            />
          </Grid>

          {/* Render staff selection dropdown with provided staff options */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth error={!!errors.staffId}>
              <InputLabel id="staff-label">Staff</InputLabel>
              <Select labelId="staff-label" label="Staff" {...register('staffId')}>
                {staff.map((staffMember) => (
                  <MenuItem key={staffMember.value} value={staffMember.value}>
                    {staffMember.label}
                  </MenuItem>
                ))}
              </Select>
              {errors.staffId && <FormHelperText>{errors.staffId.message}</FormHelperText>}
            </FormControl>
          </Grid>

          {/* Render program selection dropdown with provided program options */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth error={!!errors.programId}>
              <InputLabel id="program-label">Program</InputLabel>
              <Select labelId="program-label" label="Program" {...register('programId')}>
                {/* TODO: Populate with program options */}
                <MenuItem value="program1">Program 1</MenuItem>
                <MenuItem value="program2">Program 2</MenuItem>
              </Select>
              {errors.programId && <FormHelperText>{errors.programId.message}</FormHelperText>}
            </FormControl>
          </Grid>

          {/* Render documentation status selection */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth error={!!errors.documentationStatus}>
              <InputLabel id="documentation-status-label">Documentation Status</InputLabel>
              <Select
                labelId="documentation-status-label"
                label="Documentation Status"
                {...register('documentationStatus')}
              >
                {DOCUMENTATION_STATUS_OPTIONS.map((status) => (
                  <MenuItem key={status.value} value={status.value}>
                    {status.label}
                  </MenuItem>
                ))}
              </Select>
              {errors.documentationStatus && <FormHelperText>{errors.documentationStatus.message}</FormHelperText>}
            </FormControl>
          </Grid>

          {/* Render file uploader for documentation attachments */}
          <Grid item xs={12}>
            <FileUploader
              acceptedTypes={['image/*', 'application/pdf']}
              maxSize={5 * 1024 * 1024} // 5MB
              onUpload={handleFileUpload}
              loading={fileUploadLoading}
            />
          </Grid>

          {/* Render notes text area for additional information */}
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

        {/* Render form action buttons (submit and cancel) */}
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={isSubmitting}
            sx={{ ml: 2 }}
          >
            {isSubmitting ? <CircularProgress size={24} /> : 'Submit'}
          </Button>
        </Box>
      </form>
    </Card>
  );
};

export default ServiceForm;

import { useWatch as useFormContextWatch } from 'react-hook-form';