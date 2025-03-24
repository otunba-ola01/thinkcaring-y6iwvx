import { z } from 'zod'; // v3.21.0
import { validateBody, validateQuery, validateParams, validateParamsAndBody } from '../middleware/validation.middleware';
import {
  generateReportSchema,
  scheduleReportSchema,
  updateScheduledReportSchema,
  reportQuerySchema
} from './schemas/report.schema';
import { UUID } from '../types/common.types';

/**
 * Middleware for validating report generation requests
 * 
 * @returns RequestHandler Express middleware function that validates report generation request body
 */
export const validateGenerateReport = () => {
  return validateBody(generateReportSchema);
};

/**
 * Middleware for validating report scheduling requests
 * 
 * @returns RequestHandler Express middleware function that validates report scheduling request body
 */
export const validateScheduleReport = () => {
  return validateBody(scheduleReportSchema);
};

/**
 * Middleware for validating scheduled report update requests
 * 
 * @returns RequestHandler Express middleware function that validates scheduled report update request body
 */
export const validateUpdateScheduledReport = () => {
  return validateBody(updateScheduledReportSchema);
};

/**
 * Middleware for validating report query parameters
 * 
 * @returns RequestHandler Express middleware function that validates report query parameters
 */
export const validateReportQuery = () => {
  return validateQuery(reportQuerySchema);
};

/**
 * Middleware for validating report ID parameters
 * 
 * @returns RequestHandler Express middleware function that validates report ID parameters
 */
export const validateReportIdParam = () => {
  return validateParams(z.object({
    id: z.string().uuid({ message: 'Report ID must be a valid UUID' })
  }));
};