import React, { useState, useEffect, useMemo } from 'react'; // v18.2.0
import { z } from 'zod'; // v3.21.0
import { 
  Grid, 
  Box, 
  Typography, 
  TextField, 
  MenuItem, 
  Button, 
  FormControl, 
  InputLabel, 
  Select, 
  FormHelperText, 
  Divider, 
  Paper,
  CircularProgress
} from '@mui/material'; // v5.13.0
import { DatePicker } from '@mui/x-date-pickers/DatePicker'; // v6.0.0
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'; // v6.0.0
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'; // v6.0.0

import useForm from '../../hooks/useForm';
import useServices from '../../hooks/useServices';
import useToast from '../../hooks/useToast';
import { ServiceEntryFormProps } from '../../types/form.types';
import { CreateServiceDto, DocumentationStatus, ServiceType } from '../../types/services.types';
import { ClientSummary } from '../../types/clients.types';
import FileUploader from '../ui/FileUploader';
import { formatDate } from '../../utils/date';
import { formatCurrency } from '../../utils/currency';

/**
 * A form component for creating and editing service entries
 * 
 * @param {ServiceEntryFormProps} props - The props for the ServiceEntryForm component
 * @returns {JSX.Element} The rendered service entry form
 */
const ServiceEntryForm: React.FC<ServiceEntryFormProps> = ({
  service,
  onSubmit,
  onCancel,
  clients,
  serviceTypes,
  staff,
  loading,
  error
}) => {
  // Initialize state for calculated amount based on units and rate
  const [amount, setAmount] = useState<number>(0);

  // Initialize state for selected files for documentation upload
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  // Create validation schema using Zod for form validation
  const validationSchema = useMemo(() => {
    return z.object({
      clientId: z.string().uuid({ message: 'Required UUID for client selection' }),
      serviceTypeId: z.string().uuid({ message: 'Required UUID for service type' }),
      serviceCode: z.string({ required_error: 'Required string for service code' }),
      serviceDate: z.string({ required_error: 'Required date in ISO8601 format' }),
      units: z.number({ required_error: 'Required number for service units (positive)' }).positive(),
      rate: z.number({ required_error: 'Required number for service rate (positive)' }).positive(),
      staffId: z.string().uuid().optional(),
      facilityId: z.string().uuid().optional(),
      programId: z.string().uuid({ message: 'Required UUID for program' }),
      authorizationId: z.string().uuid().optional(),
      documentationStatus: z.nativeEnum(DocumentationStatus, { required_error: 'Required enum value for documentation status' }),
      notes: z.string().optional(),
    });
  }, []);

  // Initialize form using useForm hook with validation schema
  const { 
    register, 
    handleSubmit: handleFormSubmit, 
    setValue, 
    formState: { errors },
    reset,
    control
  } = useForm({ 
    defaultValues: {
      clientId: service?.clientId || '',
      serviceTypeId: service?.serviceTypeId || '',
      serviceCode: service?.serviceCode || '',
      serviceDate: service?.serviceDate || formatDate(new Date()),
      units: service?.units || 0,
      rate: service?.rate || 0,
      staffId: service?.staffId || '',
      facilityId: service?.facilityId || '',
      programId: service?.programId || '',
      authorizationId: service?.authorizationId || '',
      documentationStatus: service?.documentationStatus || DocumentationStatus.INCOMPLETE,
      notes: service?.notes || '',
    },
    validationSchema
  });

  // Initialize toast notifications using useToast hook
  const toast = useToast();

  // Calculate and update amount when units or rate changes
  useEffect(() => {
    const calculatedAmount = (control._getValues().units || 0) * (control._getValues().rate || 0);
    setAmount(calculatedAmount);
  }, [control._getValues().units, control._getValues().rate]);

  // Handle form submission with validation
  const handleSubmit = handleFormSubmit(async (formData) => {
    try {
      // Call onSubmit prop with service data
      await onSubmit(formData);

      // Show success toast notification
      toast.success('Service entry saved successfully!');
    } catch (e: any) {
      // Handle errors with error toast notification
      toast.error(e.message || 'Failed to save service entry.');
    }
  });

  // Handle file upload for service documentation
  const handleFileUpload = async (files: File[]): Promise<string[]> => {
    // TODO: Implement file upload logic here
    // This is a placeholder for the actual file upload implementation
    return Promise.resolve(['documentId1', 'documentId2']);
  };

  return (
    <Paper elevation={3} sx={{ padding: 3 }}>
      <Typography variant="h6" gutterBottom>
        {service ? 'Edit Service Entry' : 'Create Service Entry'}
      </Typography>
      <Divider sx={{ mb: 2 }} />
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" height={200}>
          <CircularProgress />
        </Box>
      ) : (
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Client Selection */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.clientId}>
                <InputLabel id="client-label">Client</InputLabel>
                <Select
                  labelId="client-label"
                  {...register('clientId')}
                  defaultValue=""
                >
                  {clients.map((client) => (
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

            {/* Service Type Selection */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.serviceTypeId}>
                <InputLabel id="service-type-label">Service Type</InputLabel>
                <Select
                  labelId="service-type-label"
                  {...register('serviceTypeId')}
                  defaultValue=""
                >
                  {serviceTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
                {errors.serviceTypeId && (
                  <FormHelperText>{errors.serviceTypeId.message}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            {/* Service Date Picker */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.serviceDate}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Service Date"
                    defaultValue={null}
                    format="MM/dd/yyyy"
                    onChange={(date) => {
                      setValue('serviceDate', formatDate(date), {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    }}
                    renderInput={(params) => (
                      <TextField {...params} helperText={errors.serviceDate?.message} />
                    )}
                  />
                </LocalizationProvider>
              </FormControl>
            </Grid>

            {/* Units and Rate Fields */}
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Units"
                type="number"
                {...register('units')}
                error={!!errors.units}
                helperText={errors.units?.message}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Rate"
                type="number"
                {...register('rate')}
                error={!!errors.rate}
                helperText={errors.rate?.message}
              />
            </Grid>

            {/* Calculated Amount */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Amount"
                value={formatCurrency(amount)}
                InputProps={{
                  readOnly: true,
                }}
              />
            </Grid>

            {/* Staff Selection */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="staff-label">Staff</InputLabel>
                <Select
                  labelId="staff-label"
                  {...register('staffId')}
                  defaultValue=""
                >
                  {staff && staff.map((staffMember) => (
                    <MenuItem key={staffMember.value} value={staffMember.value}>
                      {staffMember.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Documentation Status Selection */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.documentationStatus}>
                <InputLabel id="documentation-status-label">Documentation Status</InputLabel>
                <Select
                  labelId="documentation-status-label"
                  {...register('documentationStatus')}
                  defaultValue={DocumentationStatus.INCOMPLETE}
                >
                  {Object.values(DocumentationStatus).map((status) => (
                    <MenuItem key={status} value={status}>
                      {status}
                    </MenuItem>
                  ))}
                </Select>
                {errors.documentationStatus && (
                  <FormHelperText>{errors.documentationStatus.message}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            {/* File Uploader */}
            <Grid item xs={12}>
              <FileUploader
                acceptedTypes={['image/*', 'application/pdf']}
                maxSize={5 * 1024 * 1024} // 5MB
                onUpload={handleFileUpload}
                multiple
              />
            </Grid>

            {/* Notes Textarea */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={4}
                {...register('notes')}
              />
            </Grid>

            {/* Form Action Buttons */}
            <Grid item xs={12}>
              <Box display="flex" justifyContent="flex-end">
                <Button onClick={onCancel} sx={{ mr: 1 }}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      )}
    </Paper>
  );
};

export default ServiceEntryForm;