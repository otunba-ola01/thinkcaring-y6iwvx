/**
 * Service responsible for validating services before billing. This service performs comprehensive validation of services against documentation requirements, authorization limits, and billing rules to ensure claims will be accepted by payers.
 * @module BillingValidationService
 */

import { UUID } from '../../types/common.types'; // Import UUID type for service identification
import {
  BillingValidationResult,
  BillingRuleType,
  BillingRuleSeverity,
  ServiceValidationError,
  ServiceValidationWarning
} from '../../types/billing.types'; // Import billing-related types for validation
import {
  ServiceWithRelations,
  BillingStatus,
  DocumentationStatus
} from '../../types/services.types'; // Import service-related types for validation
import { ServiceModel } from '../../models/service.model'; // Import service model for retrieving and updating services
import { DocumentationValidationService } from './documentation-validation.service'; // Import documentation validation service for checking documentation completeness
import { AuthorizationTrackingService } from './authorization-tracking.service'; // Import authorization tracking service for validating service authorizations
import { ServicesService } from '../services.service'; // Import services service for retrieving service data with relations
import { logger } from '../../utils/logger'; // Import logger for service operations logging
import { NotFoundError } from '../../errors/not-found-error'; // Import error class for when services are not found
import { ValidationError } from '../../errors/validation-error'; // Import error class for validation failures
import { BusinessError } from '../../errors/business-error'; // Import error class for business rule violations

/**
 * Validates a single service against all billing requirements
 * @param serviceId - UUID of the service to validate
 * @returns {Promise<BillingValidationResult>} Comprehensive validation result for the service
 */
async function validateSingleService(serviceId: UUID): Promise<BillingValidationResult> {
  logger.info(`Validating service with ID: ${serviceId}`);

  try {
    // Retrieve the service with its relations using ServicesService.getServiceById
    const service: ServiceWithRelations | null = await ServicesService.getServiceById(serviceId);

    // If service not found, throw NotFoundError
    if (!service) {
      logger.error(`Service with ID ${serviceId} not found.`);
      throw new NotFoundError('Service not found', 'service', serviceId);
    }

    // Call DocumentationValidationService.validateServiceDocumentation to check documentation
    const documentationResult = await DocumentationValidationService.validateServiceDocumentation(serviceId);

    // Call AuthorizationTrackingService.validateServiceAuthorization to check authorization
    const authorizationResult = await AuthorizationTrackingService.validateServiceAuthorization(serviceId);

    // Perform additional billing rule validations
    const { errors: billingErrors, warnings: billingWarnings } = validateBillingRules(service);

    // Compile all validation results into a BillingValidationResult object
    const isValid = documentationResult.isComplete && authorizationResult.isAuthorized && billingErrors.length === 0;

    const validationResult: BillingValidationResult = {
      serviceId: serviceId,
      isValid: isValid,
      errors: [...documentationResult.missingItems.map(message => ({ code: 'MISSING_DOCUMENTATION', message, field: 'documentation' })),
      ...authorizationResult.errors.map(message => ({ code: 'AUTHORIZATION_ERROR', message, field: 'authorization' })),
      ...billingErrors],
      warnings: [...authorizationResult.warnings.map(message => ({ code: 'AUTHORIZATION_WARNING', message, field: 'authorization' })),
      ...billingWarnings],
      documentation: documentationResult,
      authorization: authorizationResult
    };

    logger.debug(`Validation result for service ID ${serviceId}:`, validationResult);

    // Return the comprehensive validation result
    return validationResult;
  } catch (error) {
    logger.error(`Error validating service with ID ${serviceId}:`, error);
    throw error;
  }
}

/**
 * Validates multiple services against all billing requirements
 * @param serviceIds - UUID[]: Array of service IDs to validate
 * @returns {Promise<{ results: BillingValidationResult[], isValid: boolean, totalErrors: number, totalWarnings: number }>} Batch validation results for all services
 */
async function validateServicesForBilling(serviceIds: UUID[]): Promise<{ results: BillingValidationResult[]; isValid: boolean; totalErrors: number; totalWarnings: number }> {
  logger.info(`Validating multiple services for billing. Service IDs: ${serviceIds.join(', ')}`);

  let isValid = true;
  let totalErrors = 0;
  let totalWarnings = 0;
  const results: BillingValidationResult[] = [];

  for (const serviceId of serviceIds) {
    try {
      const validationResult = await validateSingleService(serviceId);
      results.push(validationResult);
      totalErrors += validationResult.errors.length;
      totalWarnings += validationResult.warnings.length;
      if (!validationResult.isValid) {
        isValid = false;
      }
    } catch (error: any) {
      logger.error(`Error validating service with ID ${serviceId}:`, error);
      results.push({
        serviceId: serviceId,
        isValid: false,
        errors: [{ code: 'VALIDATION_ERROR', message: error.message, field: null }],
        warnings: [],
        documentation: null,
        authorization: null
      });
      isValid = false;
      totalErrors++;
    }
  }

  return { results, isValid, totalErrors, totalWarnings };
}

/**
 * Updates a service's billing status based on validation results
 * @param serviceId - UUID: ID of the service to update
 * @param validationResult - BillingValidationResult: Validation result for the service
 * @param userId - UUID | null: ID of the user performing the action
 * @returns {Promise<ServiceWithRelations>} Updated service with new billing status
 */
async function updateServiceValidationStatus(serviceId: UUID, validationResult: BillingValidationResult, userId: UUID | null = null): Promise<ServiceWithRelations> {
  logger.info(`Updating service validation status for service ID ${serviceId}`);

  let billingStatus: BillingStatus;

  if (validationResult.isValid) {
    billingStatus = BillingStatus.READY_FOR_BILLING;
  } else if (validationResult.errors.some(error => error.code === 'MISSING_DOCUMENTATION')) {
    billingStatus = BillingStatus.UNBILLED;
  } else if (validationResult.errors.some(error => error.code === 'AUTHORIZATION_ERROR')) {
    billingStatus = BillingStatus.UNBILLED;
  } else {
    billingStatus = BillingStatus.UNBILLED;
  }

  try {
    // Call ServiceModel.updateBillingStatus to update the service status
    const updatedService = await ServiceModel.updateBillingStatus(
      serviceId,
      { billingStatus: billingStatus, claimId: null },
      userId
    );

    logger.debug(`Service ${serviceId} billing status updated to ${billingStatus}`);
    return updatedService;
  } catch (error) {
    logger.error(`Error updating service ${serviceId} billing status:`, error);
    throw error;
  }
}

/**
 * Validates a service against standard billing rules
 * @param service - ServiceWithRelations: Service object to validate
 * @returns {{ errors: ServiceValidationError[], warnings: ServiceValidationWarning[] }}: Validation errors and warnings
 */
function validateBillingRules(service: ServiceWithRelations): { errors: ServiceValidationError[]; warnings: ServiceValidationWarning[] } {
  const errors: ServiceValidationError[] = [];
  const warnings: ServiceValidationWarning[] = [];

  // Check if service date is within timely filing limits (typically 365 days)
  const timelyFilingResult = checkTimelyfiling(service);
  if (!timelyFilingResult.isValid) {
    errors.push({
      code: 'TIMELY_FILING_EXCEEDED',
      message: timelyFilingResult.error,
      field: 'serviceDate'
    });
  }

  // Check if service has valid rate (greater than zero)
  if (service.rate <= 0) {
    errors.push({
      code: 'INVALID_RATE',
      message: 'Service rate must be greater than zero',
      field: 'rate'
    });
  }

  // Check if service has valid units (greater than zero)
  if (service.units <= 0) {
    errors.push({
      code: 'INVALID_UNITS',
      message: 'Service units must be greater than zero',
      field: 'units'
    });
  }

  // Check if client is active (not inactive or discharged)
  if (service.client.status !== 'active') {
    errors.push({
      code: 'CLIENT_INACTIVE',
      message: 'Client is not active',
      field: 'clientId'
    });
  }

  // Check if service type is billable
  // TODO: Implement logic to check if service type is billable based on payer and program
  // This may involve querying a configuration table or external service

  // Check for potential duplicate services (same client, date, service type)
  checkDuplicateServices(service)
    .then(duplicateCheckResult => {
      if (duplicateCheckResult.isDuplicate) {
        warnings.push({
          code: 'DUPLICATE_SERVICE',
          message: `Potential duplicate service found with IDs: ${duplicateCheckResult.duplicateServices.join(', ')}`,
          field: null
        });
      }
    })
    .catch(error => {
      logger.error('Error checking for duplicate services:', error);
    });

    // Check if service date is not in the future
    if (new Date(service.serviceDate) > new Date()) {
      errors.push({
        code: 'FUTURE_SERVICE_DATE',
        message: 'Service date cannot be in the future',
        field: 'serviceDate'
      });
    }

    // Check if service has required fields for billing (client, service type, etc.)
    if (!service.clientId || !service.serviceTypeId || !service.serviceDate || !service.programId) {
      errors.push({
        code: 'MISSING_REQUIRED_FIELDS',
        message: 'Service is missing required fields for billing',
        field: null
      });
    }

  return { errors, warnings };
}

/**
 * Checks if a service is within timely filing limits
 * @param service - ServiceWithRelations: Service object to validate
 * @returns {{ isValid: boolean, daysRemaining: number | null, error: string | null }}: Timely filing validation result
 */
function checkTimelyfiling(service: ServiceWithRelations): { isValid: boolean; daysRemaining: number | null; error: string | null } {
  // Get service date from service
  const serviceDate = new Date(service.serviceDate);

  // Get current date
  const currentDate = new Date();

  // Calculate days elapsed since service date
  const timeDiff = currentDate.getTime() - serviceDate.getTime();
  const daysElapsed = Math.ceil(timeDiff / (1000 * 3600 * 24));

  // Get payer-specific timely filing limit (default to 365 days if not specified)
  const timelyFilingLimit = 365; // TODO: Replace with payer-specific timely filing limit

  // Calculate days remaining before filing deadline
  const daysRemaining = timelyFilingLimit - daysElapsed;

  // If days remaining is negative, service is beyond timely filing limit
  if (daysRemaining < 0) {
    return {
      isValid: false,
      daysRemaining: null,
      error: `Service is beyond timely filing limit of ${timelyFilingLimit} days`
    };
  }

  // Return validation result with isValid flag, days remaining, and error message if applicable
  return {
    isValid: true,
    daysRemaining: daysRemaining,
    error: null
  };
}

/**
 * Checks for potential duplicate services
 * @param service - ServiceWithRelations: Service object to validate
 * @returns {Promise<{ isDuplicate: boolean, duplicateServices: UUID[] }>}: Duplicate check result
 */
async function checkDuplicateServices(service: ServiceWithRelations): Promise<{ isDuplicate: boolean; duplicateServices: UUID[] }> {
  // Extract client ID, service date, and service type ID from service
  const clientId = service.clientId;
  const serviceDate = service.serviceDate;
  const serviceTypeId = service.serviceTypeId;

  // Query database for services with same client, date, and service type
  const duplicateServices = await ServiceModel.findAll({
    clientId: clientId,
    serviceDate: serviceDate,
    serviceTypeId: serviceTypeId
  });

  // Filter out the current service from results
  const potentialDuplicates = duplicateServices.services.filter(s => s.id !== service.id);

  // If matching services found, service may be a duplicate
  const isDuplicate = potentialDuplicates.length > 0;

  // Return result with isDuplicate flag and array of potential duplicate service IDs
  return {
    isDuplicate: isDuplicate,
    duplicateServices: potentialDuplicates.map(s => s.id)
  };
}

// Export the service object with all functions
export const BillingValidationService = {
  validateSingleService,
  validateServicesForBilling,
  updateServiceValidationStatus,
  validateBillingRules,
  checkTimelyfiling,
  checkDuplicateServices
};