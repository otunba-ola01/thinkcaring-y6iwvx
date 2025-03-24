# src/web/src/components/forms/ReportParametersForm.tsx
```typescript
import React, { useState, useEffect, useMemo } from 'react'; // v18.2.0
import { z } from 'zod'; // v3.21.0
import {
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  FormHelperText,
  Box,
  Typography,
} from '@mui/material'; // v5.13.0

import {
  ReportType,
  ReportParameters,
  TimeFrame,
  ComparisonType,
} from '../../types/reports.types';
import { DateRange } from '../../types/common.types';
import useForm from '../../hooks/useForm';
import DateRangePicker from '../ui/DateRangePicker';
import {
  DEFAULT_TIME_FRAME,
  DEFAULT_COMPARISON_TYPE,
  TIME_FRAME_LABELS,
  COMPARISON_TYPE_LABELS,
  getDateRangeFromTimeFrame,
  getDefaultReportParameters,
} from '../../config/report.config';

/**
 * Interface defining the props for the ReportParametersForm component
 */
export interface ReportParametersFormProps {
  reportType: ReportType;
  initialValues?: Partial<ReportParameters>;
  onChange: (values: ReportParameters) => void;
  onSubmit: (values: ReportParameters) => void;
}

/**
 * Creates a Zod validation schema for report parameters based on report type
 * @param reportType The type of report to create the schema for
 * @returns Zod schema for validating report parameters
 */
const createReportParametersSchema = (reportType: ReportType) => {
  // Create base schema with common fields (timeFrame, comparisonType)
  let baseSchema = z.object({
    timeFrame: z.nativeEnum(TimeFrame),
    comparisonType: z.nativeEnum(ComparisonType),
  });

  // Add conditional validation for dateRange when timeFrame is CUSTOM
  baseSchema = baseSchema.refine(
    (data) => {
      if (data.timeFrame === TimeFrame.CUSTOM) {
        return (
          data.dateRange &&
          data.dateRange.startDate !== null &&
          data.dateRange.endDate !== null
        );
      }
      return true;
    },
    {
      message: 'Date range is required when Time Frame is Custom',
      path: ['dateRange'],
    }
  );

  // Add report-specific validation rules based on reportType
  switch (reportType) {
    case ReportType.REVENUE_BY_PROGRAM:
    case ReportType.REVENUE_BY_PAYER:
    case ReportType.CLAIMS_STATUS:
    case ReportType.AGING_ACCOUNTS_RECEIVABLE:
    case ReportType.DENIAL_ANALYSIS:
    case ReportType.PAYER_PERFORMANCE:
    case ReportType.SERVICE_UTILIZATION:
    case ReportType.CUSTOM:
      // Add any report-specific validation rules here
      break;
    default:
      break;
  }

  return baseSchema;
};

/**
 * Form component for configuring report parameters
 * @param reportType The type of report to configure parameters for
 * @param initialValues Initial values for the form
 * @param onChange Callback function to execute when form values change
 * @param onSubmit Callback function to execute when the form is submitted
 * @returns Rendered form component
 */
const ReportParametersForm: React.FC<ReportParametersFormProps> = ({
  reportType,
  initialValues,
  onChange,
  onSubmit,
}) => {
  // Create validation schema using createReportParametersSchema
  const validationSchema = useMemo(() => createReportParametersSchema(reportType), [reportType]);

  // Get default parameters for the report type using getDefaultReportParameters
  const defaultReportParameters = useMemo(() => getDefaultReportParameters(reportType), [reportType]);

  // Merge default parameters with initialValues prop
  const mergedInitialValues = useMemo(() => {
    return { ...defaultReportParameters, ...initialValues };
  }, [defaultReportParameters, initialValues]);

  // Initialize form using useForm hook with merged default values and validation schema
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ReportParameters>({
    defaultValues: mergedInitialValues,
    validationSchema: validationSchema,
  });

  // Set up state for tracking if timeFrame is CUSTOM to show/hide date picker
  const timeFrameValue = watch('timeFrame');
  const isCustomTimeFrame = timeFrameValue === TimeFrame.CUSTOM;

  // Create handleTimeFrameChange function to update dateRange when timeFrame changes
  const handleTimeFrameChange = (event: React.ChangeEvent<{ value: TimeFrame }>) => {
    const newTimeFrame = event.target.value;
    setValue('timeFrame', newTimeFrame);

    // Update dateRange based on the new timeFrame
    const { startDate, endDate } = getDateRangeFromTimeFrame(newTimeFrame);
    setValue('dateRange', { startDate, endDate });
  };

  // Create handleDateRangeChange function to update form when date range is selected
  const handleDateRangeChange = (startDate: string | null, endDate: string | null) => {
    setValue('dateRange', { startDate, endDate });
  };

  // Create handleChange function to call onChange prop when form values change
  const handleChange = () => {
    const values = watch();
    onChange(values);
  };

  // Use useEffect to update form when initialValues prop changes
  useEffect(() => {
    Object.keys(initialValues || {}).forEach((key) => {
      setValue(key as keyof ReportParameters, initialValues[key] as any);
    });
  }, [initialValues, setValue]);

  // Render form with Grid layout containing form fields
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Grid container spacing={2}>
        {/* TimeFrame select field with options from TIME_FRAME_LABELS */}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel id="timeFrame-label">Time Frame</InputLabel>
            <Select
              labelId="timeFrame-label"
              {...register('timeFrame')}
              onChange={handleTimeFrameChange}
              label="Time Frame"
            >
              {Object.entries(TIME_FRAME_LABELS).map(([key, label]) => (
                <MenuItem key={key} value={key as TimeFrame}>
                  {label}
                </MenuItem>
              ))}
            </Select>
            {errors.timeFrame && (
              <FormHelperText error>{errors.timeFrame.message}</FormHelperText>
            )}
          </FormControl>
        </Grid>

        {/* Conditionally render DateRangePicker when timeFrame is CUSTOM */}
        {isCustomTimeFrame && (
          <Grid item xs={12} md={6}>
            <DateRangePicker
              startDate={watch('dateRange.startDate')}
              endDate={watch('dateRange.endDate')}
              onChange={handleDateRangeChange}
            />
            {errors.dateRange && (
              <FormHelperText error>{errors.dateRange.message}</FormHelperText>
            )}
          </Grid>
        )}

        {/* ComparisonType select field with options from COMPARISON_TYPE_LABELS */}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel id="comparisonType-label">Comparison Type</InputLabel>
            <Select
              labelId="comparisonType-label"
              {...register('comparisonType')}
              label="Comparison Type"
            >
              {Object.entries(COMPARISON_TYPE_LABELS).map(([key, label]) => (
                <MenuItem key={key} value={key as ComparisonType}>
                  {label}
                </MenuItem>
              ))}
            </Select>
            {errors.comparisonType && (
              <FormHelperText error>{errors.comparisonType.message}</FormHelperText>
            )}
          </FormControl>
        </Grid>

        {/* program, payer, and facility multi-select fields */}
        {/* Render report-specific fields based on reportType */}
      </Grid>
    </form>
  );
};

export default ReportParametersForm;