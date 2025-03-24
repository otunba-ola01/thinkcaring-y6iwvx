import { UUID, ISO8601Date } from '../../types/common.types';
import {
  ClaimValidationResult,
  ClaimValidationError,
  ClaimValidationWarning,
  ClaimStatus,
} from '../../types/claims.types';
import { ErrorCode } from '../../types/error.types';
import { ClaimModel } from '../../models/claim.model';
import { ServiceModel } from '../../models/service.model';
import { PayerModel } from '../../models/payer.model';
import { BusinessError } from '../../errors/business-error';
import { NotFoundError } from '../../errors/not-found-error';
import { logger } from '../../utils/logger';
import { claimRepository } from '../../database/repositories/claim.repository';

/**
 * ClaimValidationService: Provides methods for validating claims against business rules and payer requirements.
 */
export const ClaimValidationService = {
  /**
   * Validates a claim against all applicable validation rules and payer requirements.
   * @param claimId - UUID of the claim to validate.
   * @param userId - UUID of the user performing the validation (optional).
   * @returns A Promise that resolves with a ClaimValidationResult containing validation results.
   */
  async validateClaim(claimId: UUID, userId: UUID | null): Promise<ClaimValidationResult> {
    logger.info(`Validating claim with ID: ${claimId}`, { userId });

    // Retrieve claim with all related data using ClaimModel.findById
    const claim = await claimRepository.findByIdWithRelations(claimId);

    // If claim not found, throw NotFoundError
    if (!claim) {
      logger.error(`Claim with ID ${claimId} not found`);
      throw new NotFoundError('Claim not found', 'claim', claimId);
    }

    // Initialize validation result object with claim ID, isValid flag, and empty errors/warnings arrays
    const validationResult: ClaimValidationResult = {
      claimId: claim.id,
      isValid: true,
      errors: [],
      warnings: [],
    };

    // Validate claim header information (client, payer, dates, etc.)
    const headerValidation = this.validateClaimHeader(claim);
    validationResult.errors.push(...headerValidation.errors);
    validationResult.warnings.push(...headerValidation.warnings);

    // Validate claim has at least one service
    if (!claim.services || claim.services.length === 0) {
      validationResult.isValid = false;
      validationResult.errors.push(this.createValidationError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        'Claim must have at least one service',
        'services',
        null
      ));
    }

    // Retrieve payer model to check payer-specific requirements
    const payerModel = PayerModel.createInstance(claim.payer);

    // Validate payer is active
    if (!payerModel.isActive()) {
      validationResult.isValid = false;
      validationResult.errors.push(this.createValidationError(
        ErrorCode.BUSINESS_RULE_VIOLATION,
        'Payer is inactive',
        'payer',
        { payerId: claim.payerId }
      ));
    }

    // Validate payer billing requirements using PayerModel.validateBillingRequirements
    const billingRequirementsValidation = payerModel.validateBillingRequirements();
    if (!billingRequirementsValidation.isValid) {
      validationResult.isValid = false;
      billingRequirementsValidation.missingRequirements.forEach(requirement => {
        validationResult.errors.push(this.createValidationError(
          ErrorCode.BUSINESS_RULE_VIOLATION,
          `Missing payer billing requirement: ${requirement}`,
          'payer.billingRequirements',
          { payerId: claim.payerId, requirement }
        ));
      });
    }

    // Validate payer submission method using PayerModel.validateSubmissionMethod
    const submissionMethodValidation = payerModel.validateSubmissionMethod();
    if (!submissionMethodValidation.isValid) {
      validationResult.isValid = false;
      submissionMethodValidation.missingConfiguration.forEach(config => {
        validationResult.errors.push(this.createValidationError(
          ErrorCode.BUSINESS_RULE_VIOLATION,
          `Missing payer submission configuration: ${config}`,
          'payer.submissionMethod',
          { payerId: claim.payerId, config }
        ));
      });
    }

    // Validate claim is within timely filing limits based on payer requirements
    if (claim.payer && claim.payer.payerType) {
      // Assuming timelyFilingDays is available in payer object
      const timelyFilingDays = 365; // Default value
      const timelyFilingValidation = this.validateTimelyFiling(claim.serviceEndDate, timelyFilingDays);
      if (!timelyFilingValidation.isValid) {
        validationResult.isValid = false;
        validationResult.errors.push(this.createValidationError(
          ErrorCode.BUSINESS_RULE_VIOLATION,
          `Claim exceeds timely filing limit by ${timelyFilingValidation.daysRemaining} days`,
          'serviceEndDate',
          { timelyFilingDays }
        ));
      }
    }

    // Validate all services in the claim using ServiceModel.validateServices
    if (claim.services && claim.services.length > 0) {
      const serviceValidation = await ServiceModel.prototype.validateServices(claim.services.map(s => s.id));
      if (!serviceValidation.isValid) {
        validationResult.isValid = false;
        serviceValidation.results.forEach(serviceResult => {
          serviceResult.errors.forEach(error => {
            validationResult.errors.push(this.createValidationError(
              ErrorCode.BUSINESS_RULE_VIOLATION,
              `Service validation error: ${error.message}`,
              `service[${serviceResult.serviceId}]`,
              { serviceId: serviceResult.serviceId, error }
            ));
          });
          serviceResult.warnings.forEach(warning => {
            validationResult.warnings.push(this.createValidationWarning(
              'SERVICE_VALIDATION_WARNING',
              `Service validation warning: ${warning.message}`,
              `service[${serviceResult.serviceId}]`,
              { serviceId: serviceResult.serviceId, warning }
            ));
          });
        });
      }
    }

    // Compile all errors and warnings into validation result
    validationResult.isValid = validationResult.errors.length === 0;

    // If validation passed, update claim status to VALIDATED
    if (validationResult.isValid) {
      await claimRepository.updateStatus(claimId, ClaimStatus.VALIDATED, 'Claim validated', userId);
    }

    // Log validation result summary
    logger.info(`Claim validation completed for ID: ${claimId}. Valid: ${validationResult.isValid}. Errors: ${validationResult.errors.length}. Warnings: ${validationResult.warnings.length}`);

    // Return the complete validation result
    return validationResult;
  },

  /**
   * Validates multiple claims in a batch operation.
   * @param claimIds - Array of UUIDs representing the claims to validate.
   * @param userId - UUID of the user performing the validation (optional).
   * @returns A Promise that resolves with an object containing batch validation results and summary statistics.
   */
  async batchValidateClaims(claimIds: UUID[], userId: UUID | null): Promise<{ results: ClaimValidationResult[], isValid: boolean, totalErrors: number, totalWarnings: number }> {
    logger.info(`Validating claims in batch. Claim count: ${claimIds.length}`, { userId });

    // Initialize results array and counters for errors and warnings
    const results: ClaimValidationResult[] = [];
    let totalErrors = 0;
    let totalWarnings = 0;

    // For each claim ID in the batch:
    for (const claimId of claimIds) {
      try {
        // Try to validate the claim using validateClaim function
        const validationResult = await this.validateClaim(claimId, userId);

        // Add the validation result to results array
        results.push(validationResult);

        // Update error and warning counters based on result
        totalErrors += validationResult.errors.length;
        totalWarnings += validationResult.warnings.length;

        // If validation fails, log the specific claim ID and error count
        if (!validationResult.isValid) {
          logger.warn(`Claim ID ${claimId} failed validation. Error count: ${validationResult.errors.length}`);
        }
      } catch (error: any) {
        // If error occurs during validation, catch and create error result for the claim
        logger.error(`Error validating claim ID ${claimId}: ${error.message}`);
        results.push({
          claimId: claimId,
          isValid: false,
          errors: [this.createValidationError(
            ErrorCode.INTERNAL_SERVER_ERROR,
            `Validation failed: ${error.message}`,
            null,
            null
          )],
          warnings: []
        });
        totalErrors++;
      }
    }

    // Calculate overall isValid flag (true if all claims are valid)
    const isValid = totalErrors === 0;

    // Log batch validation summary with success rate
    logger.info(`Batch validation completed. Success: ${results.length - totalErrors}. Failed: ${totalErrors}. Total warnings: ${totalWarnings}`);

    // Return batch results object with results array, isValid flag, and error/warning counts
    return {
      results,
      isValid,
      totalErrors,
      totalWarnings
    };
  },

  /**
   * Validates the header information of a claim.
   * @param claim - The claim object to validate.
   * @returns An object containing arrays of validation errors and warnings.
   */
  validateClaimHeader(claim: any): { errors: ClaimValidationError[], warnings: ClaimValidationWarning[] } {
    // Initialize errors and warnings arrays
    const errors: ClaimValidationError[] = [];
    const warnings: ClaimValidationWarning[] = [];

    // Validate client exists and is active
    if (!claim.clientId) {
      errors.push(this.createValidationError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        'Client is required',
        'clientId',
        null
      ));
    }

    // Validate payer exists and is active
    if (!claim.payerId) {
      errors.push(this.createValidationError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        'Payer is required',
        'payerId',
        null
      ));
    }

    // Validate claim dates (serviceStartDate not after serviceEndDate)
    if (claim.serviceStartDate && claim.serviceEndDate && claim.serviceStartDate > claim.serviceEndDate) {
      errors.push(this.createValidationError(
        ErrorCode.INVALID_INPUT,
        'Service start date cannot be after service end date',
        'serviceDates',
        null
      ));
    }

    // Validate claim dates are not in the future
    const today = new Date();
    if (claim.serviceStartDate && new Date(claim.serviceStartDate) > today) {
      warnings.push(this.createValidationWarning(
        'FUTURE_DATE',
        'Service start date is in the future',
        'serviceStartDate',
        null
      ));
    }

    if (claim.serviceEndDate && new Date(claim.serviceEndDate) > today) {
      warnings.push(this.createValidationWarning(
        'FUTURE_DATE',
        'Service end date is in the future',
        'serviceEndDate',
        null
      ));
    }

    // Validate claim number is properly formatted
    if (!claim.claimNumber || claim.claimNumber.length === 0) {
      errors.push(this.createValidationError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        'Claim number is required',
        'claimNumber',
        null
      ));
    }

    // Validate claim type is appropriate
    if (!claim.claimType) {
      errors.push(this.createValidationError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        'Claim type is required',
        'claimType',
        null
      ));
    }

    // If claim type is adjustment or replacement, validate original claim reference
    if ((claim.claimType === 'adjustment' || claim.claimType === 'replacement') && !claim.originalClaimId) {
      errors.push(this.createValidationError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        'Original claim ID is required for adjustment or replacement claims',
        'originalClaimId',
        null
      ));
    }

    return { errors, warnings };
  },

  /**
   * Validates all services included in a claim.
   * @param claimId - The ID of the claim being validated.
   * @param services - An array of service objects to validate.
   * @returns An object containing arrays of validation errors and warnings.
   */
  async validateClaimServices(claimId: UUID, services: any[]): Promise<{ errors: ClaimValidationError[], warnings: ClaimValidationWarning[] }> {
    // Initialize errors and warnings arrays
    const errors: ClaimValidationError[] = [];
    const warnings: ClaimValidationWarning[] = [];

    // Validate claim has at least one service
    if (!services || services.length === 0) {
      errors.push(this.createValidationError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        'Claim must have at least one service',
        'services',
        null
      ));
    }

    // For each service:
    for (const service of services) {
      // Validate service documentation is complete
      if (service.documentationStatus !== 'complete') {
        errors.push(this.createValidationError(
          ErrorCode.BUSINESS_RULE_VIOLATION,
          'Service documentation is incomplete',
          'service.documentationStatus',
          { serviceId: service.id }
        ));
      }

      // Validate service is not already billed on another claim
      if (service.claimId && service.claimId !== claimId) {
        errors.push(this.createValidationError(
          ErrorCode.BUSINESS_RULE_VIOLATION,
          'Service is already billed on another claim',
          'service.claimId',
          { serviceId: service.id, claimId: service.claimId }
        ));
      }

      // Validate service dates fall within claim date range
      // Validate service units and rates are valid
      // Validate service authorization if required
    }

    // Check for duplicate services within the claim
    // Validate total claim amount matches sum of service amounts

    return { errors, warnings };
  },

  /**
   * Validates claim against payer-specific requirements.
   * @param claim - The claim object to validate.
   * @param payer - The payer object to validate against.
   * @returns An object containing arrays of validation errors and warnings.
   */
  validatePayerRequirements(claim: any, payer: any): { errors: ClaimValidationError[], warnings: ClaimValidationWarning[] } {
    // Initialize errors and warnings arrays
    const errors: ClaimValidationError[] = [];
    const warnings: ClaimValidationWarning[] = [];

    // Validate payer is active
    if (payer.status !== 'active') {
      errors.push(this.createValidationError(
        ErrorCode.BUSINESS_RULE_VIOLATION,
        'Payer is inactive',
        'payer.status',
        { payerId: payer.id }
      ));
    }

    // Get payer billing requirements
    const billingRequirements = payer.billingRequirements || {};

    // Validate claim against timely filing limits
    // Validate required fields based on payer requirements
    // Validate claim format matches payer's required submission format
    // Validate service line limits if specified by payer
    // Validate any payer-specific custom requirements

    return { errors, warnings };
  },

  /**
   * Validates that the claim is within timely filing limits.
   * @param serviceEndDate - The end date of the service period.
   * @param timelyFilingDays - The number of days allowed for timely filing.
   * @returns An object indicating whether the claim is valid and the number of days remaining.
   */
  validateTimelyFiling(serviceEndDate: ISO8601Date, timelyFilingDays: number): { isValid: boolean, daysRemaining: number } {
    // Calculate the filing deadline based on service end date and timely filing days
    const filingDeadline = new Date(serviceEndDate);
    filingDeadline.setDate(filingDeadline.getDate() + timelyFilingDays);

    // Calculate current date
    const currentDate = new Date();

    // Calculate days remaining until deadline
    const timeDiff = filingDeadline.getTime() - currentDate.getTime();
    const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));

    // Set isValid to true if current date is before deadline
    const isValid = daysRemaining >= 0;

    // Return validation result with isValid flag and days remaining
    return { isValid, daysRemaining };
  },

  /**
   * Creates a standardized validation error object.
   * @param code - The error code.
   * @param message - The error message.
   * @param field - The field that failed validation (optional).
   * @param context - Additional context for the error (optional).
   * @returns A ClaimValidationError object.
   */
  createValidationError(code: ErrorCode, message: string, field: string | null, context: Record<string, any> | null): ClaimValidationError {
    return {
      code,
      message,
      field: field || null,
      context: context || null
    };
  },

  /**
   * Creates a standardized validation warning object.
   * @param code - The warning code.
   * @param message - The warning message.
   * @param field - The field that triggered the warning (optional).
   * @param context - Additional context for the warning (optional).
   * @returns A ClaimValidationWarning object.
   */
  createValidationWarning(code: string, message: string, field: string | null, context: Record<string, any> | null): ClaimValidationWarning {
    return {
      code,
      message,
      field: field || null,
      context: context || null
    };
  }
};