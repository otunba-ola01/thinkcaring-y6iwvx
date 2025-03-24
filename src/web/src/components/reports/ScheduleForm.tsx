import React, { useState, useEffect, useMemo } from 'react'; // react v18.2.0
import { z } from 'zod'; // 3.21.0
import {
  Grid,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  Typography,
  Box,
  Divider,
  Chip,
  Autocomplete,
  FormControlLabel,
  Switch,
  Alert,
} from '@mui/material'; // 5.13.0
import { TimePicker } from '@mui/x-date-pickers'; // 6.0.0
import {
  Schedule,
  Email,
  Description,
  AccessTime,
  CalendarToday,
  Save,
  Cancel,
} from '@mui/icons-material'; // 5.13.0

import {
  ScheduleFrequency,
  ReportFormat,
  ReportType,
  ReportParameters,
  ScheduleReportRequest,
  ReportDefinition,
  ScheduledReport,
  ReportRecipient,
} from '../../types/reports.types';
import { UUID } from '../../types/common.types';
import useForm from '../../hooks/useForm';
import useReports from '../../hooks/useReports';
import Card from '../ui/Card';
import ActionButton from '../ui/ActionButton';
import ReportParameters from './ReportParameters';
import {
  SCHEDULE_FREQUENCY_LABELS,
  REPORT_FORMAT_LABELS,
  REPORT_SCHEDULING_ERROR_MESSAGES,
} from '../../constants/reports.constants';
import { DEFAULT_REPORT_FORMATS } from '../../config/report.config';

/**
 * Interface defining the props for the ScheduleForm component
 */
export interface ScheduleFormProps {
  reportDefinition: ReportDefinition;
  initialValues?: Partial<ScheduledReport>;
  onSubmit: (data: ScheduleReportRequest) => void;
  onCancel: () => void;
  loading: boolean;
  error: string | null;
}

/**
 * Zod validation schema for schedule form data
 */
const scheduleFormSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
  description: z.string().optional(),
  reportDefinitionId: z.string().uuid({ message: 'Report Definition ID is invalid' }),
  frequency: z.nativeEnum(ScheduleFrequency, { message: 'Frequency is required' }),
  dayOfWeek: z.number().optional(),
  dayOfMonth: z.number().optional(),
  time: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Time must be in HH:MM format' }),
  formats: z.array(z.nativeEnum(ReportFormat)).min(1, { message: 'At least one format must be selected' }),
  recipients: z.array(
    z.object({
      email: z.string().email({ message: 'Invalid email address' }),
    })
  ).min(1, { message: 'At least one recipient is required' }),
  isActive: z.boolean(),
  parameters: z.any(), // ReportParameters object
});

/**
 * Form component for scheduling reports
 */
const ScheduleForm: React.FC<ScheduleFormProps> = ({
  reportDefinition,
  initialValues,
  onSubmit,
  onCancel,
  loading,
  error,
}) => {
  // Initialize state for report parameters
  const [reportParameters, setReportParameters] = useState<ReportParameters>(
    initialValues?.parameters || reportDefinition.parameters
  );

  // Initialize state for recipients list
  const [recipients, setRecipients] = useState<ReportRecipient[]>(
    initialValues?.recipients || []
  );

  // Initialize state for selected formats
  const [selectedFormats, setSelectedFormats] = useState<ReportFormat[]>(
    initialValues?.formats || DEFAULT_REPORT_FORMATS
  );

  // Initialize form with useForm hook, passing validation schema and default values
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ScheduleReportRequest>({
    validationSchema: scheduleFormSchema,
    defaultValues: {
      reportDefinitionId: reportDefinition.id,
      name: initialValues?.name || `${reportDefinition.name} Schedule`,
      description: initialValues?.description || reportDefinition.description,
      frequency: initialValues?.frequency || ScheduleFrequency.DAILY,
      dayOfWeek: initialValues?.dayOfWeek || 1,
      dayOfMonth: initialValues?.dayOfMonth || 1,
      time: initialValues?.time || '08:00',
      formats: initialValues?.formats || DEFAULT_REPORT_FORMATS,
      recipients: initialValues?.recipients || [],
      isActive: initialValues?.isActive !== undefined ? initialValues.isActive : true,
      parameters: initialValues?.parameters || reportDefinition.parameters,
    },
  });

  // Create handleFrequencyChange function to update form based on frequency selection
  const handleFrequencyChange = (event: React.ChangeEvent<{ value: ScheduleFrequency }>) => {
    setValue('frequency', event.target.value);
  };

  // Create handleAddRecipient function to add a new recipient to the list
  const handleAddRecipient = () => {
    setRecipients([...recipients, { email: '' } as ReportRecipient]);
  };

  // Create handleRemoveRecipient function to remove a recipient from the list
  const handleRemoveRecipient = (index: number) => {
    const newRecipients = [...recipients];
    newRecipients.splice(index, 1);
    setRecipients(newRecipients);
  };

  // Create handleFormatChange function to update selected formats
  const handleFormatChange = (format: ReportFormat) => {
    if (selectedFormats.includes(format)) {
      setSelectedFormats(selectedFormats.filter((f) => f !== format));
    } else {
      setSelectedFormats([...selectedFormats, format]);
    }
  };

  // Create handleParameterChange function to update report parameters
  const handleParameterChange = (newParameters: ReportParameters) => {
    setReportParameters(newParameters);
  };

  // Create handleSubmit function that formats data before calling onSubmit
  const onSubmitHandler = (data: ScheduleReportRequest) => {
    const formattedData: ScheduleReportRequest = {
      ...data,
      reportDefinitionId: reportDefinition.id,
      formats: selectedFormats,
      recipients: recipients.map((recipient) => ({ email: recipient.email })),
      parameters: reportParameters,
    };
    onSubmit(formattedData);
  };

  // Use useEffect to update form when initialValues change
  useEffect(() => {
    if (initialValues) {
      setValue('name', initialValues.name || `${reportDefinition.name} Schedule`);
      setValue('description', initialValues.description || reportDefinition.description);
      setValue('frequency', initialValues.frequency || ScheduleFrequency.DAILY);
      setValue('dayOfWeek', initialValues.dayOfWeek || 1);
      setValue('dayOfMonth', initialValues.dayOfMonth || 1);
      setValue('time', initialValues.time || '08:00');
      setSelectedFormats(initialValues.formats || DEFAULT_REPORT_FORMATS);
      setRecipients(initialValues.recipients || []);
      setValue('isActive', initialValues.isActive !== undefined ? initialValues.isActive : true);
      setReportParameters(initialValues.parameters || reportDefinition.parameters);
    }
  }, [initialValues, reportDefinition, setValue]);

  // Render a Card component as the form container with appropriate title
  return (
    <Card title="Schedule Report" loading={loading}>
      {/* Render form fields for name and description */}
      <form onSubmit={handleSubmit(onSubmitHandler)}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Name"
              {...register('name')}
              error={!!errors.name}
              helperText={errors.name?.message}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              {...register('description')}
              error={!!errors.description}
              helperText={errors.description?.message}
            />
          </Grid>

          {/* Render frequency selection dropdown with options from SCHEDULE_FREQUENCY_LABELS */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth error={!!errors.frequency}>
              <InputLabel id="frequency-label">Frequency</InputLabel>
              <Select
                labelId="frequency-label"
                {...register('frequency')}
                label="Frequency"
                onChange={handleFrequencyChange}
              >
                {Object.entries(SCHEDULE_FREQUENCY_LABELS).map(([key, label]) => (
                  <MenuItem key={key} value={key as ScheduleFrequency}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
              {errors.frequency && (
                <FormHelperText>{errors.frequency.message}</FormHelperText>
              )}
            </FormControl>
          </Grid>

          {/* Conditionally render day selection based on selected frequency */}
          {watch('frequency') === ScheduleFrequency.WEEKLY && (
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Day of Week (1-7)"
                type="number"
                {...register('dayOfWeek')}
                error={!!errors.dayOfWeek}
                helperText={errors.dayOfWeek?.message}
              />
            </Grid>
          )}
          {watch('frequency') === ScheduleFrequency.MONTHLY && (
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Day of Month (1-31)"
                type="number"
                {...register('dayOfMonth')}
                error={!!errors.dayOfMonth}
                helperText={errors.dayOfMonth?.message}
              />
            </Grid>
          )}

          {/* Render time picker for scheduling time */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <TextField
                label="Time (HH:MM)"
                {...register('time')}
                error={!!errors.time}
                helperText={errors.time?.message}
              />
            </FormControl>
          </Grid>

          {/* Render format selection with checkboxes for each available format */}
          <Grid item xs={12}>
            <Typography variant="subtitle1">Formats</Typography>
            <Box>
              {Object.entries(REPORT_FORMAT_LABELS).map(([key, label]) => (
                <FormControlLabel
                  key={key}
                  control={
                    <Switch
                      checked={selectedFormats.includes(key as ReportFormat)}
                      onChange={() => handleFormatChange(key as ReportFormat)}
                      name={key}
                    />
                  }
                  label={label}
                />
              ))}
              {errors.formats && (
                <FormHelperText error>{errors.formats.message}</FormHelperText>
              )}
            </Box>
          </Grid>

          {/* Render recipient management section with email inputs and add/remove buttons */}
          <Grid item xs={12}>
            <Typography variant="subtitle1">Recipients</Typography>
            {recipients.map((recipient, index) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TextField
                  label={`Recipient ${index + 1} Email`}
                  value={recipient.email}
                  onChange={(e) => {
                    const newRecipients = [...recipients];
                    newRecipients[index].email = e.target.value;
                    setRecipients(newRecipients);
                  }}
                  sx={{ mr: 1 }}
                />
                <ActionButton
                  label="Remove"
                  onClick={() => handleRemoveRecipient(index)}
                  color="error"
                />
              </Box>
            ))}
            <ActionButton label="Add Recipient" onClick={handleAddRecipient} />
            {errors.recipients && (
              <FormHelperText error>{errors.recipients.message}</FormHelperText>
            )}
          </Grid>

          {/* Render ReportParameters component for configuring report parameters */}
          <Grid item xs={12}>
            <ReportParameters
              reportType={reportDefinition.type}
              initialParameters={reportParameters}
              onChange={handleParameterChange}
              onSubmit={handleParameterChange}
              title="Report Parameters"
              loading={loading}
            />
          </Grid>

          {/* Render active status toggle */}
          <Grid item xs={12}>
            <FormControlLabel
              control={<Switch {...register('isActive')} />}
              label="Active"
            />
          </Grid>

          {/* Display error alert if error prop is provided */}
          {error && (
            <Grid item xs={12}>
              <Alert severity="error">{error}</Alert>
            </Grid>
          )}

          {/* Render form actions: schedule and cancel buttons */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <ActionButton label="Cancel" onClick={onCancel} icon={<Cancel />} />
              <ActionButton label="Schedule" type="submit" icon={<Schedule />} />
            </Box>
          </Grid>
        </Grid>
      </form>
    </Card>
  );
};

export default ScheduleForm;