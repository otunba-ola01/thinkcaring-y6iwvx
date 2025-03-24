import React, { useState, useEffect, useCallback } from 'react'; // v18.2.0
import { useNavigate, useParams } from 'react-router-dom'; // v6.11.2
import {
  Box,
  Grid,
  TextField,
  MenuItem,
  FormControl,
  FormControlLabel,
  InputLabel,
  Select,
  Switch,
  Typography,
  Button,
  Divider,
  CircularProgress,
  Tabs,
  Tab,
} from '@mui/material'; // v5.13.0
import { DatePicker } from '@mui/x-date-pickers'; // v6.5.0
import { z } from 'zod'; // v3.21.0

import Card from '../ui/Card'; // Container component for the program form
import useForm from '../../hooks/useForm'; // Hook for form handling with validation
import useSettings from '../../hooks/useSettings'; // Hook for accessing and managing program settings
import useToast from '../../hooks/useToast'; // Hook for displaying toast notifications
import {
  ProgramFormProps,
  ProgramFormValues,
} from '../../types/settings.types'; // Types for program form props and values
import {
  ProgramType,
  ProgramStatus,
  FundingSource,
  BillingFrequency,
} from '../../types/settings.types'; // Enums for program form select options
import ServiceCodeForm from './ServiceCodeForm'; // Component for managing service codes within the program form

/**
 * Component for creating and editing program configurations
 * @param {ProgramFormProps} props - The component props
 * @returns {JSX.Element} The rendered ProgramForm component
 */
const ProgramForm: React.FC<ProgramFormProps> = ({
  initialValues,
  onSubmit,
  isLoading,
}) => {
  // LD1: Destructure props to extract initialValues, onSubmit, and isLoading
  // LD1: Initialize navigate function from useNavigate
  const navigate = useNavigate();
  // LD1: Get programId from URL parameters using useParams
  const { programId } = useParams<{ programId: string }>();
  // LD1: Initialize toast notification hook for displaying success/error messages
  const toast = useToast();
  // LD1: Initialize useSettings hook to access program-related settings
  const {
    settings,
    createSetting,
    updateSetting,
    deleteSetting,
  } = useSettings();

  // LD1: Set up form state using useForm hook with validation
  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm<ProgramFormValues>({
    defaultValues: {
      name: '',
      code: '',
      type: ProgramType.PERSONAL_CARE,
      status: ProgramStatus.ACTIVE,
      description: '',
      startDate: null,
      endDate: null,
      fundingSource: FundingSource.MEDICAID,
      billingFrequency: BillingFrequency.MONTHLY,
      payer: '',
      contractNumber: '',
      requiresAuthorization: false,
      documentationRequirements: '',
      billingRequirements: '',
      serviceCodes: [],
    },
  });

  // LD1: Initialize state for active tab using useState
  const [activeTab, setActiveTab] = useState('basicInfo');
  // LD1: Initialize state for service codes using useState
  const [serviceCodes, setServiceCodes] = useState<any[]>([]);

  // LD1: Set up useEffect to populate form with initialValues when available
  useEffect(() => {
    if (initialValues) {
      reset(initialValues);
      setServiceCodes(initialValues.serviceCodes || []);
    }
  }, [initialValues, reset]);

  // LD1: Implement handleSubmit function to process form submission
  const submitHandler = handleSubmit(async (data) => {
    try {
      // LD1: Call the onSubmit function passed as a prop
      await onSubmit(data);
      // LD1: Display a success toast notification
      toast.success('Program saved successfully!', { title: 'Success' });
      // LD1: Navigate back to the program list page
      navigate('/settings/programs');
    } catch (error) {
      // LD1: Display an error toast notification
      toast.error('Failed to save program. Please try again.', {
        title: 'Error',
      });
    }
  });

  // LD1: Implement handleCancel function to navigate back to program list
  const handleCancel = () => {
    navigate('/settings/programs');
  };

  // LD1: Implement handleTabChange function to switch between form tabs
  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue);
  };

  // LD1: Implement handleAddServiceCode function to add a new service code
  const handleAddServiceCode = () => {
    setServiceCodes((prevCodes) => [...prevCodes, { id: Date.now() }]);
  };

  // LD1: Implement handleRemoveServiceCode function to remove a service code
  const handleRemoveServiceCode = (id: number) => {
    setServiceCodes((prevCodes) => prevCodes.filter((code) => code.id !== id));
  };

  // LD1: Implement handleServiceCodeChange function to update a service code
  const handleServiceCodeChange = (id: number, updatedCode) => {
    setServiceCodes((prevCodes) =>
      prevCodes.map((code) => (code.id === id ? { ...code, ...updatedCode } : code))
    );
  };

  // LD1: Render a Card component containing the program form
  return (
    <Card title={programId ? 'Edit Program' : 'Create Program'} loading={isLoading}>
      {/* LD1: Render form header with title based on edit/create mode */}
      <Box component="form" onSubmit={submitHandler} sx={{ mt: 1 }}>
        {/* LD1: Render Tabs component for navigating between form sections */}
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="program-form-tabs">
          <Tab label="Basic Info" value="basicInfo" />
          <Tab label="Billing" value="billing" />
          <Tab label="Service Codes" value="serviceCodes" />
        </Tabs>

        {/* LD1: Render form fields based on active tab (Basic Info, Billing, Service Codes) */}
        {activeTab === 'basicInfo' && renderBasicInfoTab({ control, errors, watch })}
        {activeTab === 'billing' && renderBillingTab({ control, errors, watch })}
        {activeTab === 'serviceCodes' && renderServiceCodesTab({
          serviceCodes,
          onAddServiceCode: handleAddServiceCode,
          onRemoveServiceCode: handleRemoveServiceCode,
          onServiceCodeChange: handleServiceCodeChange,
        })}

        <Divider sx={{ my: 2 }} />

        {/* LD1: Render form action buttons (Cancel, Save) */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button variant="outlined" onClick={handleCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" color="primary" disabled={isLoading}>
            Save
          </Button>
        </Box>
      </Box>
    </Card>
  );
};

interface TabProps {
  control: any;
  errors: any;
  watch: any;
}

/**
 * Renders the basic information tab of the program form
 * @param {object} { control, errors, watch }
 * @returns {JSX.Element} The rendered basic info form fields
 */
const renderBasicInfoTab = ({ control, errors, watch }: TabProps): JSX.Element => {
  // LD1: Render Grid container for form layout
  return (
    <Grid container spacing={2}>
      {/* LD1: Render program name TextField */}
      <Grid item xs={12} sm={6}>
        <TextField
          label="Program Name"
          fullWidth
          {...register('name', { required: 'Program Name is required' })}
          error={!!errors.name}
          helperText={errors.name?.message}
        />
      </Grid>

      {/* LD1: Render program code TextField */}
      <Grid item xs={12} sm={6}>
        <TextField
          label="Program Code"
          fullWidth
          {...register('code', { required: 'Program Code is required' })}
          error={!!errors.code}
          helperText={errors.code?.message}
        />
      </Grid>

      {/* LD1: Render program type Select field with ProgramType options */}
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth error={!!errors.type}>
          <InputLabel id="type-label">Type</InputLabel>
          <Select labelId="type-label" label="Type" {...register('type', { required: 'Type is required' })}>
            {Object.values(ProgramType).map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </Select>
          {errors.type && <Typography color="error">{errors.type.message}</Typography>}
        </FormControl>
      </Grid>

      {/* LD1: Render program status Select field with ProgramStatus options */}
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth error={!!errors.status}>
          <InputLabel id="status-label">Status</InputLabel>
          <Select labelId="status-label" label="Status" {...register('status', { required: 'Status is required' })}>
            {Object.values(ProgramStatus).map((status) => (
              <MenuItem key={status} value={status}>
                {status}
              </MenuItem>
            ))}
          </Select>
          {errors.status && <Typography color="error">{errors.status.message}</Typography>}
        </FormControl>
      </Grid>

      {/* LD1: Render description TextField with multiline support */}
      <Grid item xs={12}>
        <TextField
          label="Description"
          fullWidth
          multiline
          rows={3}
          {...register('description')}
        />
      </Grid>

      {/* LD1: Render start date DatePicker */}
      <Grid item xs={12} sm={6}>
        <DatePicker
          label="Start Date"
          slotProps={{ textField: { fullWidth: true, error: !!errors.startDate, helperText: errors.startDate?.message } }}
          {...register('startDate', { required: 'Start Date is required' })}
        />
      </Grid>

      {/* LD1: Render end date DatePicker */}
      <Grid item xs={12} sm={6}>
        <DatePicker
          label="End Date"
          slotProps={{ textField: { fullWidth: true, error: !!errors.endDate, helperText: errors.endDate?.message } }}
          {...register('endDate')}
        />
      </Grid>
    </Grid>
  );
};

/**
 * Renders the billing information tab of the program form
 * @param {object} { control, errors, watch }
 * @returns {JSX.Element} The rendered billing form fields
 */
const renderBillingTab = ({ control, errors, watch }: TabProps): JSX.Element => {
  // LD1: Render Grid container for form layout
  return (
    <Grid container spacing={2}>
      {/* LD1: Render funding source Select field with FundingSource options */}
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth error={!!errors.fundingSource}>
          <InputLabel id="fundingSource-label">Funding Source</InputLabel>
          <Select
            labelId="fundingSource-label"
            label="Funding Source"
            {...register('fundingSource', { required: 'Funding Source is required' })}
          >
            {Object.values(FundingSource).map((source) => (
              <MenuItem key={source} value={source}>
                {source}
              </MenuItem>
            ))}
          </Select>
          {errors.fundingSource && <Typography color="error">{errors.fundingSource.message}</Typography>}
        </FormControl>
      </Grid>

      {/* LD1: Render billing frequency Select field with BillingFrequency options */}
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth error={!!errors.billingFrequency}>
          <InputLabel id="billingFrequency-label">Billing Frequency</InputLabel>
          <Select
            labelId="billingFrequency-label"
            label="Billing Frequency"
            {...register('billingFrequency', { required: 'Billing Frequency is required' })}
          >
            {Object.values(BillingFrequency).map((frequency) => (
              <MenuItem key={frequency} value={frequency}>
                {frequency}
              </MenuItem>
            ))}
          </Select>
          {errors.billingFrequency && <Typography color="error">{errors.billingFrequency.message}</Typography>}
        </FormControl>
      </Grid>

      {/* LD1: Render payer Select field with available payers */}
      <Grid item xs={12} sm={6}>
        <TextField
          label="Payer"
          fullWidth
          {...register('payer')}
          error={!!errors.payer}
          helperText={errors.payer?.message}
        />
      </Grid>

      {/* LD1: Render contract number TextField */}
      <Grid item xs={12} sm={6}>
        <TextField
          label="Contract Number"
          fullWidth
          {...register('contractNumber')}
          error={!!errors.contractNumber}
          helperText={errors.contractNumber?.message}
        />
      </Grid>

      {/* LD1: Render requires authorization Switch */}
      <Grid item xs={12}>
        <FormControlLabel
          control={<Switch {...register('requiresAuthorization')} />}
          label="Requires Authorization"
        />
      </Grid>

      {/* LD1: Render documentation requirements TextField with multiline support */}
      <Grid item xs={12}>
        <TextField
          label="Documentation Requirements"
          fullWidth
          multiline
          rows={3}
          {...register('documentationRequirements')}
        />
      </Grid>

      {/* LD1: Render billing requirements TextField with multiline support */}
      <Grid item xs={12}>
        <TextField
          label="Billing Requirements"
          fullWidth
          multiline
          rows={3}
          {...register('billingRequirements')}
        />
      </Grid>
    </Grid>
  );
};

interface ServiceCodesTabProps {
  serviceCodes: any[];
  onAddServiceCode: () => void;
  onRemoveServiceCode: (id: number) => void;
  onServiceCodeChange: (id: number, updatedCode: any) => void;
}

/**
 * Renders the service codes tab of the program form
 * @param {object} { serviceCodes, onAddServiceCode, onRemoveServiceCode, onServiceCodeChange }
 * @returns {JSX.Element} The rendered service codes form section
 */
const renderServiceCodesTab = ({
  serviceCodes,
  onAddServiceCode,
  onRemoveServiceCode,
  onServiceCodeChange,
}: ServiceCodesTabProps): JSX.Element => {
  // LD1: Render Box container for service codes section
  return (
    <Box>
      {/* LD1: Render section header with Add Service Code button */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Service Codes</Typography>
        <Button variant="contained" color="primary" onClick={onAddServiceCode}>
          Add Service Code
        </Button>
      </Box>

      {/* LD1: Render list of ServiceCodeForm components for each service code */}
      {serviceCodes.length > 0 ? (
        serviceCodes.map((code) => (
          <ServiceCodeForm
            key={code.id}
            serviceCode={code}
            onSubmit={(updatedCode) => onServiceCodeChange(code.id, updatedCode)}
            onCancel={() => onRemoveServiceCode(code.id)}
          />
        ))
      ) : (
        // LD1: Render empty state message if no service codes exist
        <Typography variant="body1">No service codes added yet.</Typography>
      )}
    </Box>
  );
};

// LD2: Be generous about your exports so long as it doesn't create a security risk.
export default ProgramForm;