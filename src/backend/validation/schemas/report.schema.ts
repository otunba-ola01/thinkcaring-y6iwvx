import z from 'zod'; // v3.21.0
import { 
  ReportType, 
  ReportCategory, 
  ReportFormat, 
  ScheduleFrequency, 
  TimeFrame, 
  ComparisonType, 
  ChartType 
} from '../../types/reports.types';
import { DateRangePreset } from '../../types/common.types';

/**
 * Schema for validating date range parameters in reports
 * Ensures that start date is before or equal to end date
 */
export const dateRangeSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime()
}).refine(data => new Date(data.startDate) <= new Date(data.endDate), {
  message: 'Start date must be before or equal to end date',
  path: ['endDate']
});

/**
 * Schema for validating report parameters including time frames, 
 * date ranges, comparison options, and filtering criteria
 */
export const reportParametersSchema = z.object({
  timeFrame: z.nativeEnum(TimeFrame).optional(),
  dateRange: dateRangeSchema.optional(),
  comparisonType: z.nativeEnum(ComparisonType).optional().default(ComparisonType.NONE),
  comparisonDateRange: dateRangeSchema.optional(),
  programIds: z.array(z.string().uuid()).optional(),
  payerIds: z.array(z.string().uuid()).optional(),
  facilityIds: z.array(z.string().uuid()).optional(),
  serviceTypeIds: z.array(z.string().uuid()).optional(),
  asOfDate: z.string().datetime().optional(),
  groupBy: z.string().optional(),
  sortBy: z.string().optional(),
  limit: z.number().int().positive().optional(),
  customParameters: z.record(z.string(), z.any()).optional()
}).refine(data => {
  // If timeFrame is CUSTOM, dateRange must be provided
  if (data.timeFrame === TimeFrame.CUSTOM && !data.dateRange) {
    return false;
  }
  // If comparisonType is CUSTOM, comparisonDateRange must be provided
  if (data.comparisonType === ComparisonType.CUSTOM && !data.comparisonDateRange) {
    return false;
  }
  return true;
}, {
  message: 'Custom time frames and comparisons require date range specifications',
  path: ['dateRange']
});

/**
 * Schema for validating report visualization configurations
 * Defines requirements for charts, graphs, and other visual elements
 */
export const reportVisualizationSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  type: z.nativeEnum(ChartType),
  dataKey: z.string().min(1),
  xAxis: z.object({
    key: z.string().min(1),
    label: z.string().min(1)
  }).optional(),
  yAxis: z.object({
    key: z.string().min(1),
    label: z.string().min(1)
  }).optional(),
  series: z.array(z.object({
    key: z.string().min(1),
    label: z.string().min(1),
    color: z.string().optional()
  })).optional(),
  options: z.record(z.string(), z.any()).optional()
});

/**
 * Schema for validating report generation requests
 * Ensures all required information is provided to generate a report
 */
export const generateReportSchema = z.object({
  reportType: z.nativeEnum(ReportType),
  reportName: z.string().min(1, { message: 'Report name is required' }),
  parameters: reportParametersSchema,
  formats: z.array(z.nativeEnum(ReportFormat)).min(1, { message: 'At least one format is required' }).optional().default([ReportFormat.PDF]),
  visualizations: z.array(reportVisualizationSchema).optional(),
  saveAsTemplate: z.boolean().optional().default(false)
});

/**
 * Schema for validating report scheduling requests
 * Validates scheduling parameters based on frequency and distribution settings
 */
export const scheduleReportSchema = z.object({
  reportDefinitionId: z.string().uuid().optional(),
  reportType: z.nativeEnum(ReportType).optional(),
  name: z.string().min(1, { message: 'Schedule name is required' }),
  description: z.string().optional(),
  parameters: reportParametersSchema,
  frequency: z.nativeEnum(ScheduleFrequency),
  dayOfWeek: z.number().int().min(0).max(6).optional(),
  dayOfMonth: z.number().int().min(1).max(31).optional(),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Time must be in HH:MM format' }),
  formats: z.array(z.nativeEnum(ReportFormat)).min(1, { message: 'At least one format is required' }),
  recipients: z.array(z.object({
    email: z.string().email(),
    userId: z.string().uuid().optional()
  })).min(1, { message: 'At least one recipient is required' }),
  isActive: z.boolean().optional().default(true)
}).refine(data => {
  // If frequency is WEEKLY, dayOfWeek must be provided
  if (data.frequency === ScheduleFrequency.WEEKLY && data.dayOfWeek === undefined) {
    return false;
  }
  // If frequency is MONTHLY, dayOfMonth must be provided
  if (data.frequency === ScheduleFrequency.MONTHLY && data.dayOfMonth === undefined) {
    return false;
  }
  // Either reportDefinitionId or reportType must be provided
  if (!data.reportDefinitionId && !data.reportType) {
    return false;
  }
  return true;
}, {
  message: 'Missing required fields for the selected frequency or report reference',
  path: ['frequency']
});

/**
 * Schema for validating scheduled report update requests
 * Similar to scheduleReportSchema but with all fields optional
 */
export const updateScheduledReportSchema = z.object({
  name: z.string().min(1, { message: 'Schedule name is required' }).optional(),
  description: z.string().optional(),
  parameters: reportParametersSchema.optional(),
  frequency: z.nativeEnum(ScheduleFrequency).optional(),
  dayOfWeek: z.number().int().min(0).max(6).optional(),
  dayOfMonth: z.number().int().min(1).max(31).optional(),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Time must be in HH:MM format' }).optional(),
  formats: z.array(z.nativeEnum(ReportFormat)).min(1, { message: 'At least one format is required' }).optional(),
  recipients: z.array(z.object({
    email: z.string().email(),
    userId: z.string().uuid().optional()
  })).min(1, { message: 'At least one recipient is required' }).optional(),
  isActive: z.boolean().optional()
}).refine(data => {
  // If frequency is WEEKLY, dayOfWeek must be provided
  if (data.frequency === ScheduleFrequency.WEEKLY && data.dayOfWeek === undefined) {
    return false;
  }
  // If frequency is MONTHLY, dayOfMonth must be provided
  if (data.frequency === ScheduleFrequency.MONTHLY && data.dayOfMonth === undefined) {
    return false;
  }
  return true;
}, {
  message: 'Missing required fields for the selected frequency',
  path: ['frequency']
});

/**
 * Schema for validating report query parameters
 * Used for listing, filtering, and sorting reports
 */
export const reportQuerySchema = z.object({
  reportType: z.nativeEnum(ReportType).optional(),
  category: z.nativeEnum(ReportCategory).optional(),
  search: z.string().optional(),
  isTemplate: z.boolean().optional(),
  isSystem: z.boolean().optional(),
  createdAfter: z.string().datetime().optional(),
  createdBefore: z.string().datetime().optional(),
  createdBy: z.string().uuid().optional(),
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().optional().default(20),
  sortBy: z.string().optional(),
  sortDirection: z.enum(['asc', 'desc']).optional().default('desc')
});