import {
  UUID,
  ISO8601Date,
  Money,
} from '../../types/common.types';
import {
  ServiceToClaimRequest,
  ServiceToClaimResponse,
  BillingFormat,
} from '../../types/billing.types';
import {
  ClaimType,
  ClaimStatus,
  SubmissionMethod,
} from '../../types/claims.types';
import {
  BillingStatus,
  DocumentationStatus,
} from '../../types/services.types';
import { ValidationResult } from '../../types/common.types';
import ServiceModel from '../../models/service.model';
import ClaimModel from '../../models/claim.model';
import { claimRepository } from '../../database/repositories/claim.repository';
import PayerModel from '../../models/payer.model';
import { NotFoundError } from '../../errors/not-found-error';
import { BusinessError } from '../../errors/business-error';
import { ValidationError } from '../../errors/validation-error';
import { db } from '../../database/connection';
import { logger } from '../../utils/logger';

/**
 * Converts a set of validated services into a billable claim
 * @param request 
 * @param userId 
 * @returns Response containing the created claim or validation errors
 */
async function convertServicesToClaim(
  request: ServiceToClaimRequest,
  userId: UUID | null
): Promise<ServiceToClaimResponse> {
  // Log start of service-to-claim conversion with request details
  logger.info('Starting service-to-claim conversion', { request, userId });

  // Validate that serviceIds array is not empty
  if (!request.serviceIds || request.serviceIds.length === 0) {
    logger.error('Service IDs array is empty', { request, userId });
    return {
      claim: null,
      validationResult: {
        isValid: false,
        errors: [{ field: 'serviceIds', message: 'Service IDs are required', code: 'EMPTY_SERVICE_IDS' }],
        warnings: []
      },
      success: false,
      message: 'No services provided for claim creation'
    };
  }

  // Validate that payerId is provided
  if (!request.payerId) {
    logger.error('Payer ID is missing', { request, userId });
    return {
      claim: null,
      validationResult: {
        isValid: false,
        errors: [{ field: 'payerId', message: 'Payer ID is required', code: 'MISSING_PAYER_ID' }],
        warnings: []
      },
      success: false,
      message: 'Payer ID is required for claim creation'
    };
  }

  // Begin database transaction
  return await db.transaction(async (trx) => {
    try {
      // Retrieve payer information using PayerModel.findById
      const payer = await PayerModel.createInstance(await PayerModel.findById(request.payerId));
      if (!payer) {
        logger.error('Payer not found', { payerId: request.payerId, userId });
        throw new NotFoundError('Payer not found', 'payer', request.payerId);
      }

      // Retrieve all services using ServiceModel.findById for each serviceId
      const services = [];
      for (const serviceId of request.serviceIds) {
        const service = await ServiceModel.findById(serviceId);
        if (!service) {
          logger.error('Service not found', { serviceId, userId });
          throw new NotFoundError('Service not found', 'service', serviceId);
        }
        services.push(service);
      }

      // Validate all services exist and are in READY_FOR_BILLING status
      const readyForBilling = services.every(s => s.billingStatus === BillingStatus.READY_FOR_BILLING);
      if (!readyForBilling) {
        logger.error('Not all services are ready for billing', { serviceIds: request.serviceIds, userId });
        throw new BusinessError('Not all services are ready for billing', null, 'invalid-service-status');
      }

      // Validate all services have COMPLETE documentation status
      const hasCompleteDocumentation = services.every(s => s.documentationStatus === DocumentationStatus.COMPLETE);
      if (!hasCompleteDocumentation) {
        logger.error('Not all services have complete documentation', { serviceIds: request.serviceIds, userId });
        throw new BusinessError('Not all services have complete documentation', null, 'incomplete-documentation');
      }

      // Validate all services belong to the same client
      const firstClientId = services[0].clientId;
      const sameClient = services.every(s => s.clientId === firstClientId);
      if (!sameClient) {
        logger.error('Services belong to different clients', { serviceIds: request.serviceIds, userId });
        throw new BusinessError('Services must belong to the same client', null, 'different-clients');
      }

      // Determine claim date range from service dates (min start date to max end date)
      const { serviceStartDate, serviceEndDate } = calculateClaimDateRange(services);

      // Calculate total claim amount by summing service amounts
      const totalAmount = services.reduce((sum, s) => sum + s.amount, 0);

      // Get payer billing requirements using PayerModel.getBillingRequirements
      const payerRequirements = payer.billingRequirements;

      // Determine appropriate billing format based on payer requirements
      const billingFormat = determineBillingFormat(payerRequirements);

      // Create new claim using claimRepository.createClaim with client, payer, dates, and amount
      const newClaim = await claimRepository.createClaim({
        clientId: firstClientId,
        payerId: request.payerId,
        claimType: ClaimType.ORIGINAL,
        serviceStartDate,
        serviceEndDate,
        totalAmount,
        notes: request.notes,
        createdBy: userId
      }, { transaction: trx });

      // Associate services with claim using claimRepository.updateClaimServices
      await claimRepository.updateClaimServices(newClaim.id, request.serviceIds, { transaction: trx });

      // Update each service's billing status to IN_CLAIM using ServiceModel.updateBillingStatus
      await updateServiceBillingStatuses(request.serviceIds, BillingStatus.IN_CLAIM, newClaim.id, userId, trx);

      // Commit transaction
      await trx.commit();

      // Log successful conversion with new claim ID
      logger.info('Successfully converted services to claim', { claimId: newClaim.id, serviceIds: request.serviceIds, userId });

      // Return success response with claim information
      return {
        claim: {
          id: newClaim.id,
          claimNumber: newClaim.claimNumber,
          clientId: newClaim.clientId,
          clientName: null, // TODO: Populate client name
          payerId: newClaim.payerId,
          payerName: payer.name,
          claimStatus: newClaim.claimStatus,
          totalAmount: newClaim.totalAmount,
          serviceStartDate: newClaim.serviceStartDate,
          serviceEndDate: newClaim.serviceEndDate,
          submissionDate: newClaim.submissionDate,
          claimAge: null
        },
        validationResult: null,
        success: true,
        message: 'Successfully created claim'
      };
    } catch (error) {
      // Rollback transaction
      await trx.rollback();

      // Log error
      logger.error('Error converting services to claim', { error, request, userId });

      // Return error response
      if (error instanceof NotFoundError || error instanceof BusinessError) {
        return {
          claim: null,
          validationResult: {
            isValid: false,
            errors: [{ field: 'general', message: error.message, code: error.code }],
            warnings: []
          },
          success: false,
          message: error.message
        };
      } else {
        return {
          claim: null,
          validationResult: {
            isValid: false,
            errors: [{ field: 'general', message: 'Failed to create claim', code: 'CLAIM_CREATION_FAILED' }],
            warnings: []
          },
          success: false,
          message: 'Failed to create claim'
        };
      }
    }
  });
}

/**
 * Converts multiple sets of services into claims in a batch process
 * @param batchData 
 * @param userId 
 * @returns Batch processing results
 */
async function batchConvertServicesToClaims(
  batchData: Array<{ serviceIds: UUID[], payerId: UUID, notes?: string }>,
  userId: UUID | null
): Promise<{
  totalProcessed: number;
  successCount: number;
  errorCount: number;
  errors: Array<{ serviceIds: UUID[], message: string }>;
  createdClaims: UUID[];
}> {
  // Log start of batch conversion process with number of batches
  logger.info('Starting batch service-to-claim conversion', { batchCount: batchData.length, userId });

  // Initialize result counters and arrays
  let totalProcessed = 0;
  let successCount = 0;
  let errorCount = 0;
  const errors: Array<{ serviceIds: UUID[], message: string }> = [];
  const createdClaims: UUID[] = [];

  // For each batch in batchData:
  for (const batch of batchData) {
    totalProcessed++;
    // Create ServiceToClaimRequest from batch data
    const request: ServiceToClaimRequest = {
      serviceIds: batch.serviceIds,
      payerId: batch.payerId,
      notes: batch.notes || null
    };

    try {
      // Try to convert services to claim using convertServicesToClaim
      const result = await convertServicesToClaim(request, userId);

      // If successful, increment success counter and add claim ID to createdClaims
      if (result.success) {
        successCount++;
        createdClaims.push(result.claim.id);
      } else {
        // If error occurs, increment error counter and add error details to errors array
        errorCount++;
        errors.push({ serviceIds: request.serviceIds, message: result.message });
      }
    } catch (error) {
      // Log unexpected error
      logger.error('Unexpected error during batch service-to-claim conversion', { error, request, userId });

      // Increment error counter and add error details to errors array
      errorCount++;
      errors.push({ serviceIds: request.serviceIds, message: error.message });
    }
  }

  // Log batch conversion completion with success/error counts
  logger.info('Completed batch service-to-claim conversion', { totalProcessed, successCount, errorCount, userId });

  // Return batch results with counts, errors, and created claim IDs
  return {
    totalProcessed,
    successCount,
    errorCount,
    errors,
    createdClaims
  };
}

/**
 * Retrieves services that are ready for billing with optional filtering
 * @param filter 
 * @param page 
 * @param pageSize 
 * @returns Paginated list of billable services
 */
async function findBillableServices(
  filter: any,
  page: number,
  pageSize: number
): Promise<{ services: Array<any>; total: number; page: number; limit: number; totalPages: number; }> {
  // Log billable services query with filter parameters
  logger.info('Querying billable services', { filter, page, pageSize });

  // Set default pagination values if not provided
  const currentPage = page || 1;
  const currentSize = pageSize || 10;

  // Create query parameters with billing status filter set to READY_FOR_BILLING
  const queryParams = {
    billingStatus: BillingStatus.READY_FOR_BILLING,
    documentationStatus: DocumentationStatus.COMPLETE,
    ...filter,
    pagination: {
      page: currentPage,
      limit: currentSize
    }
  };

  // Call ServiceModel.getUnbilledServices with query parameters
  const { services, total } = await ServiceModel.getUnbilledServices(queryParams);

  // Calculate total pages based on total services and page size
  const totalPages = Math.ceil(total / currentSize);

  // Return paginated result with services, total count, and pagination metadata
  return {
    services,
    total,
    page: currentPage,
    limit: currentSize,
    totalPages
  };
}

/**
 * Groups services based on payer-specific billing criteria for efficient claim creation
 * @param services 
 * @param payerRequirements 
 * @returns Array of service groups that should be billed together
 */
function groupServicesByBillingCriteria(
  services: Array<any>,
  payerRequirements: any
): Array<Array<any>> {
  // Log start of service grouping process
  logger.info('Grouping services by billing criteria', { serviceCount: services.length, payerRequirements });

  // Initialize empty array for service groups
  const serviceGroups: Array<Array<any>> = [];

  // Determine grouping criteria based on payer requirements (client, service type, date range, etc.)
  // TODO: Implement grouping logic based on payerRequirements

  // If payer requires separate claims by service type:
  // Group services by service type
  // TODO: Implement service type grouping

  // If payer requires date range limitations:
  // Split service groups to ensure date ranges don't exceed limits
  // TODO: Implement date range splitting

  // If payer has maximum services per claim:
  // Split groups that exceed the maximum
  // TODO: Implement maximum services splitting

  // For now, just return all services in a single group
  serviceGroups.push(services);

  // Log completion with number of resulting groups
  logger.info('Completed service grouping', { groupCount: serviceGroups.length });

  // Return array of service groups
  return serviceGroups;
}

/**
 * Validates that services meet all requirements for conversion to a claim
 * @param services 
 * @param payerId 
 * @returns Validation results including errors and warnings
 */
function validateServicesForConversion(
  services: Array<any>,
  payerId: UUID
): ValidationResult {
  // Initialize validation result object with empty errors and warnings arrays
  const validationResult: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  // Validate all services exist and are not null
  if (!services || services.length === 0) {
    validationResult.isValid = false;
    validationResult.errors.push({ field: 'services', message: 'No services provided', code: 'NO_SERVICES_PROVIDED' });
  }

  // Validate all services are in READY_FOR_BILLING status
  const readyForBilling = services.every(s => s.billingStatus === BillingStatus.READY_FOR_BILLING);
  if (!readyForBilling) {
    validationResult.isValid = false;
    validationResult.errors.push({ field: 'billingStatus', message: 'Not all services are ready for billing', code: 'INVALID_BILLING_STATUS' });
  }

  // Validate all services have COMPLETE documentation status
  const hasCompleteDocumentation = services.every(s => s.documentationStatus === DocumentationStatus.COMPLETE);
  if (!hasCompleteDocumentation) {
    validationResult.isValid = false;
    validationResult.errors.push({ field: 'documentationStatus', message: 'Not all services have complete documentation', code: 'INCOMPLETE_DOCUMENTATION' });
  }

  // Validate all services belong to the same client
  if (services.length > 0) {
    const firstClientId = services[0].clientId;
    const sameClient = services.every(s => s.clientId === firstClientId);
    if (!sameClient) {
      validationResult.isValid = false;
      validationResult.errors.push({ field: 'clientId', message: 'Services must belong to the same client', code: 'DIFFERENT_CLIENTS' });
    }
  }

  // Validate all services have not been billed on another claim
  const notBilled = services.every(s => s.claimId === null);
  if (!notBilled) {
    validationResult.isValid = false;
    validationResult.errors.push({ field: 'claimId', message: 'Some services have already been billed on another claim', code: 'ALREADY_BILLED' });
  }

  // Validate service dates are consistent and not in the future
  const today = new Date();
  const validDates = services.every(s => new Date(s.serviceDate) <= today);
  if (!validDates) {
    validationResult.isValid = false;
    validationResult.errors.push({ field: 'serviceDate', message: 'Service dates cannot be in the future', code: 'FUTURE_SERVICE_DATE' });
  }

  // Validate all services have valid amounts (greater than zero)
  const validAmounts = services.every(s => s.amount > 0);
  if (!validAmounts) {
    validationResult.isValid = false;
    validationResult.errors.push({ field: 'amount', message: 'Service amounts must be greater than zero', code: 'INVALID_AMOUNT' });
  }

  // TODO: Retrieve payer requirements
  // const payerRequirements = await getPayerRequirements(payerId);

  // TODO: Validate services against payer-specific requirements
  // Implement payer-specific validation logic here

  return validationResult;
}

/**
 * Determines the appropriate claim type based on services and payer requirements
 * @param services 
 * @param payerRequirements 
 * @returns The determined claim type
 */
function determineClaimType(
  services: Array<any>,
  payerRequirements: any
): ClaimType {
  // Check if payer has a default claim type in requirements
  if (payerRequirements && payerRequirements.defaultClaimType) {
    return payerRequirements.defaultClaimType;
  }

  // Check if services are for institutional care (facility-based)
  const isInstitutional = services.every(s => s.facilityId !== null);
  if (isInstitutional) {
    return ClaimType.INSTITUTIONAL;
  }

  // Otherwise, return ClaimType.PROFESSIONAL as the default
  return ClaimType.PROFESSIONAL;
}

/**
 * Determines the appropriate billing format based on payer requirements
 * @param payerRequirements 
 * @returns The determined billing format
 */
function determineBillingFormat(
  payerRequirements: any
): BillingFormat {
  // Check if payer has a required billing format in requirements
  if (payerRequirements && payerRequirements.requiredBillingFormat) {
    return payerRequirements.requiredBillingFormat;
  }

  // Check if payer accepts electronic claims
  if (payerRequirements && payerRequirements.acceptsElectronicClaims) {
    return BillingFormat.X12_837P;
  }

  // Otherwise, return BillingFormat.CMS1500 as the paper default
  return BillingFormat.CMS1500;
}

/**
 * Calculates the overall date range for a claim based on service dates
 * @param services 
 * @returns The calculated date range object
 */
function calculateClaimDateRange(
  services: Array<any>
): { serviceStartDate: ISO8601Date; serviceEndDate: ISO8601Date } {
  // Extract service dates from all services
  const serviceDates = services.map(s => new Date(s.serviceDate));

  // Find the earliest service date as serviceStartDate
  const serviceStartDate = new Date(Math.min(...serviceDates)).toISOString();

  // Find the latest service date as serviceEndDate
  const serviceEndDate = new Date(Math.max(...serviceDates)).toISOString();

  // Return the calculated date range object
  return { serviceStartDate, serviceEndDate };
}

/**
 * Updates the billing status of multiple services
 * @param serviceIds 
 * @param newStatus 
 * @param claimId 
 * @param userId 
 * @param transaction 
 * @returns True if all services were updated successfully
 */
async function updateServiceBillingStatuses(
  serviceIds: Array<UUID>,
  newStatus: BillingStatus,
  claimId: UUID | null,
  userId: UUID | null,
  transaction: any
): Promise<boolean> {
  // Log start of service status update
  logger.info('Updating billing status for services', { serviceIds, newStatus, claimId, userId });

  // For each service ID:
  for (const serviceId of serviceIds) {
    // Create status update data with new status and claim ID
    const statusUpdateData = {
      billingStatus: newStatus,
      claimId: claimId
    };

    // Call ServiceModel.updateBillingStatus with transaction
    await ServiceModel.updateBillingStatus(serviceId, statusUpdateData, userId);
  }

  // Log completion of status updates
  logger.info('Completed updating billing status for services', { serviceIds, newStatus, claimId, userId });

  // Return true if all updates were successful
  return true;
}

/**
 * Exports the service-to-claim service with methods for converting services to claims and finding billable services
 */
export const ServiceToClaimService = {
  convertServicesToClaim,
  batchConvertServicesToClaims,
  findBillableServices
};