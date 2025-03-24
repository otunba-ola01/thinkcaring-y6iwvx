import React, { useState, useEffect, useCallback } from 'react'; // v18.2.0
import { useParams, useNavigate } from 'react-router-dom'; // v6.11.2
import {
  Box,
  Typography,
  Grid,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  FormHelperText,
  Divider,
  Button,
  Switch,
  FormControlLabel
} from '@mui/material'; // v5.13.0
import { Save as SaveIcon, Cancel as CancelIcon } from '@mui/icons-material'; // v5.11.16
import * as z from 'zod'; // v1.2.0
import { DatePicker } from '@mui/x-date-pickers'; // v6.5.0
import axios from 'axios'; // v1.4.0

import Card from '../ui/Card';
import ActionButton from '../ui/ActionButton';
import useForm from '../../hooks/useForm';
import useSettings from '../../hooks/useSettings';
import useToast from '../../hooks/useToast';
import { UUID } from '../../types/common.types';

/**
 * Component for creating and editing program configurations
 * @param props 
 * @returns The rendered ProgramConfigForm component
 */
const ProgramConfigForm: React.FC = (props) => {
  // 1. Extract programId from props or URL parameters using useParams
  const { programId: propProgramId } = props;
  const { programId: urlProgramId } = useParams<{ programId: UUID }>();
  const programId = propProgramId || urlProgramId;

  // 2. Initialize navigate function from useNavigate
  const navigate = useNavigate();

  // 3. Initialize state for loading and program data
  const [loading, setLoading] = useState(false);
  const [program, setProgram] = useState<any>(null);

  // 4. Use useSettings hook to access program-related settings
  const { settings, error: settingsError } = useSettings();

  // 5. Use useToast hook for displaying success and error notifications
  const toast = useToast();

  // 6. Define validation schema using Zod
  const validationSchema = z.object({
    name: z.string().min(2, { message: "Program name must be at least 2 characters." }),
    code: z.string().min(1, { message: "Program code is required." }),
    description: z.string().optional(),
    type: z.string().min(1, { message: "Program type is required." }),
    fundingSource: z.string().optional(),
    billingFrequency: z.string().optional(),
    startDate: z.date().optional(),
    endDate: z.date().optional(),
    requiresAuthorization: z.boolean().default(false),
    documentationRequirements: z.string().optional(),
    billingRequirements: z.string().optional(),
  });

  // 7. Initialize form with useForm hook, providing validation schema and default values
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
  } = useForm({
    validationSchema: validationSchema,
    defaultValues: {
      name: '',
      code: '',
      description: '',
      type: '',
      fundingSource: '',
      billingFrequency: '',
      startDate: null,
      endDate: null,
      requiresAuthorization: false,
      documentationRequirements: '',
      billingRequirements: '',
    },
  });

  // 8. Implement useEffect to fetch program data when programId changes
  useEffect(() => {
    if (programId) {
      fetchProgram(programId);
    }
  }, [programId]);

  /**
   * Fetches program data by ID
   * @param programId 
   */
  const fetchProgram = async (programId: UUID) => {
    // Set loading state to true
    setLoading(true);
    try {
      // Make API request to fetch program data by ID
      const response = await axios.get(`/api/programs/${programId}`);
      // Update program state with fetched data
      setProgram(response.data);
      // Set form values with program data
      reset(response.data);
      // Set loading state to false
      setLoading(false);
    } catch (error: any) {
      // Handle any errors and display error toast
      toast.error(error.message || 'Failed to fetch program', { title: 'Error' });
      // Set loading state to false
      setLoading(false);
    }
  };

  /**
   * Handles form submission for creating or updating a program
   * @param values 
   */
  const handleSubmitForm = async (values: any) => {
    // Set loading state to true
    setLoading(true);
    // Prepare program data from form values
    const programData = {
      ...values,
      startDate: values.startDate ? values.startDate.toISOString() : null,
      endDate: values.endDate ? values.endDate.toISOString() : null,
    };
    try {
      // If in edit mode (programId exists), make API request to update the program
      if (programId) {
        await axios.put(`/api/programs/${programId}`, programData);
        // Display success toast notification
        toast.success('Program updated successfully!', { title: 'Success' });
      } else {
        // If in create mode, make API request to create a new program
        await axios.post('/api/programs', programData);
        // Display success toast notification
        toast.success('Program created successfully!', { title: 'Success' });
      }
      // Navigate back to program list
      navigate('/settings/programs');
    } catch (error: any) {
      // Handle any errors and display error toast
      toast.error(error.message || 'Failed to save program', { title: 'Error' });
    } finally {
      // Set loading state to false
      setLoading(false);
    }
  };

  /**
   * Handles cancellation of form editing
   */
  const handleCancel = () => {
    // Navigate back to program list
    navigate('/settings/programs');
  };

  /**
   * Formats enum values for display
   * @param value 
   */
  const formatEnumValue = (value: string) => {
    // Replace underscores with spaces
    const spacedValue = value.replace(/_/g, ' ');
    // Convert to title case
    return spacedValue.charAt(0).toUpperCase() + spacedValue.slice(1);
  };

  // 9. Render form with Card component as container
  return (
    <Card title={programId ? "Edit Program" : "Create Program"} loading={loading}>
      <Box component="form" onSubmit={handleSubmit(handleSubmitForm)} noValidate sx={{ mt: 1 }}>
        <Grid container spacing={2}>
          {/* 10. Render form fields for program details (name, code, description) */}
          <Grid item xs={12} sm={6}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="name"
              label="Program Name"
              {...register("name")}
              error={!!errors.name}
              helperText={errors.name?.message}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="code"
              label="Program Code"
              {...register("code")}
              error={!!errors.code}
              helperText={errors.code?.message}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              margin="normal"
              fullWidth
              id="description"
              label="Description"
              multiline
              rows={3}
              {...register("description")}
              error={!!errors.description}
              helperText={errors.description?.message}
            />
          </Grid>

          {/* 11. Render select fields for program type, funding source, status, and billing frequency */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth margin="normal" error={!!errors.type}>
              <InputLabel id="type-label">Program Type</InputLabel>
              <Select
                labelId="type-label"
                id="type"
                label="Program Type"
                {...register("type")}
              >
                <MenuItem value="personalCare">Personal Care</MenuItem>
                <MenuItem value="residential">Residential</MenuItem>
                <MenuItem value="dayServices">Day Services</MenuItem>
              </Select>
              <FormHelperText>{errors.type?.message}</FormHelperText>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth margin="normal">
              <InputLabel id="fundingSource-label">Funding Source</InputLabel>
              <Select
                labelId="fundingSource-label"
                id="fundingSource"
                label="Funding Source"
                {...register("fundingSource")}
              >
                <MenuItem value="medicaid">Medicaid</MenuItem>
                <MenuItem value="medicare">Medicare</MenuItem>
                <MenuItem value="private">Private</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth margin="normal">
              <InputLabel id="billingFrequency-label">Billing Frequency</InputLabel>
              <Select
                labelId="billingFrequency-label"
                id="billingFrequency"
                label="Billing Frequency"
                {...register("billingFrequency")}
              >
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="biweekly">Bi-Weekly</MenuItem>
                <MenuItem value="monthly">Monthly</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* 12. Render date fields for start date and end date */}
          <Grid item xs={12} sm={6}>
            <DatePicker
              label="Start Date"
              format="MM/DD/YYYY"
              slotProps={{ textField: { fullWidth: true, margin: 'normal', ...register("startDate") } }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <DatePicker
              label="End Date"
              format="MM/DD/YYYY"
              slotProps={{ textField: { fullWidth: true, margin: 'normal', ...register("endDate") } }}
            />
          </Grid>

          {/* 13. Render switch for requires authorization */}
          <Grid item xs={12}>
            <FormControlLabel
              control={<Switch {...register("requiresAuthorization")} />}
              label="Requires Authorization"
            />
          </Grid>

          {/* 14. Render text areas for documentation requirements and billing requirements */}
          <Grid item xs={12}>
            <TextField
              margin="normal"
              fullWidth
              id="documentationRequirements"
              label="Documentation Requirements"
              multiline
              rows={3}
              {...register("documentationRequirements")}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              margin="normal"
              fullWidth
              id="billingRequirements"
              label="Billing Requirements"
              multiline
              rows={3}
              {...register("billingRequirements")}
            />
          </Grid>
        </Grid>

        {/* 15. Render form actions (save, cancel) at the bottom of the form */}
        <Divider sx={{ my: 2 }} />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <ActionButton label="Cancel" icon={<CancelIcon />} onClick={handleCancel} variant="outlined" />
          <ActionButton label="Save" icon={<SaveIcon />} type="submit" />
        </Box>
      </Box>
    </Card>
  );
};

export default ProgramConfigForm;