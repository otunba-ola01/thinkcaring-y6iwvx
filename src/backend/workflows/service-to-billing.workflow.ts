/**
 * @fileoverview Implements a comprehensive workflow for converting healthcare services to billable claims in the HCBS Revenue Management System. This workflow orchestrates the validation, conversion, and submission processes, providing a high-level interface that coordinates multiple specialized services to streamline the billing process.
 */

import { UUID } from '../types/common.types'; // Import UUID type for service and claim identification
import {
  ValidationResult
} from '../types/common.types'; // Import validation result interface for returning validation outcomes
import {
  BillingValidationRequest,
  BillingValidationResponse,
  ServiceToClaimRequest,
  ServiceToClaimResponse,
  BillingQueueFilter,
  BillingQueueResponse,
  BillingDashboardMetrics
} from '../types/billing.types'; // Import billing-related interfaces for request/response handling
import {
  BillingService
} from '../services/billing.service'; // Import billing service for orchestrating the billing workflow
import {
  DocumentationValidationService
} from '../services/billing/documentation-validation.service'; // Import documentation validation service for checking documentation completeness
import {
  AuthorizationTrackingService
} from '../services/billing/authorization-tracking.service'; // Import authorization tracking service for validating service authorizations
import {
  ServiceToClaimService
} from '../services/billing/service-to-claim.service'; // Import service-to-claim service for finding billable services
import {
  logger
} from '../utils/logger'; // Import logger for workflow operations logging
import {
  NotFoundError
} from '../errors/not-found-error'; // Import error class for when services are not found
import {
  BusinessError
} from '../errors/business-error'; // Import error class for business rule violations

/**
 * Orchestrates the end-to-end process of converting services to billable claims
 */
export class ServiceToBillingWorkflow {
  private billingService: BillingService;
  private documentationValidationService: DocumentationValidationService;
  private authorizationTrackingService: AuthorizationTrackingService;
  private serviceToClaimService: ServiceToClaimService;

  /**
   * Initializes the service-to-billing workflow with required services
   */
  constructor() {
    // Initialize service references to their imported instances
    this.billingService = BillingService;
    this.documentationValidationService = DocumentationValidationService;
    this.authorizationTrackingService = AuthorizationTrackingService;
    this.serviceToClaimService = ServiceToClaimService;

    // Log workflow initialization
    logger.info('ServiceToBillingWorkflow initialized');
  }

  /**
   * Validates services against all billing requirements including documentation and authorization
   * @param request - BillingValidationRequest: Request object containing service IDs to validate
   * @param userId - UUID | null: ID of the user performing the validation, if applicable
   * @returns Promise<BillingValidationResponse>: Comprehensive validation results for all services
   */
  async validateServicesForBilling(
    request: BillingValidationRequest,
    userId: UUID | null
  ): Promise<BillingValidationResponse> {
    // Log workflow start for service validation
    logger.info('Starting service validation', {
      request,
      userId
    });

    // Validate request contains service IDs
    if (!request.serviceIds || request.serviceIds.length === 0) {
      logger.error('Service IDs are missing in the request');
      throw new BusinessError('Service IDs are required', null, 'missing-service-ids');
    }

    // Delegate to billingService.validateServicesForBilling
    const validationResponse = await this.billingService.validateServicesForBilling(request, userId);

    // Log validation results summary
    logger.info('Service validation completed', {
      isValid: validationResponse.isValid,
      totalErrors: validationResponse.totalErrors,
      totalWarnings: validationResponse.totalWarnings
    });

    // Return validation response with results, isValid flag, and error/warning counts
    return validationResponse;
  }

  /**
   * Converts validated services into a billable claim
   * @param request - ServiceToClaimRequest: Request object containing service IDs and payer information
   * @param userId - UUID | null: ID of the user performing the conversion, if applicable
   * @returns Promise<ServiceToClaimResponse>: Response containing the created claim or validation errors
   */
  async convertServicesToClaim(
    request: ServiceToClaimRequest,
    userId: UUID | null
  ): Promise<ServiceToClaimResponse> {
    // Log workflow start for service-to-claim conversion
    logger.info('Starting service-to-claim conversion', {
      request,
      userId
    });

    // Validate request contains service IDs and payer ID
    if (!request.serviceIds || request.serviceIds.length === 0 || !request.payerId) {
      logger.error('Service IDs or Payer ID are missing in the request');
      throw new BusinessError('Service IDs and Payer ID are required', null, 'missing-service-ids-payer-id');
    }

    // Delegate to billingService.convertServicesToClaim
    const conversionResponse = await this.billingService.convertServicesToClaim(request, userId);

    // Log conversion result
    logger.info('Service-to-claim conversion completed', {
      success: conversionResponse.success,
      claimId: conversionResponse.claim?.id,
      message: conversionResponse.message
    });

    // Return conversion response with claim information or validation errors
    return conversionResponse;
  }

  /**
   * Converts multiple sets of services into claims in a batch process
   * @param batchData - Array<{ serviceIds: UUID[], payerId: UUID, notes?: string }>: Array of batch data for conversion
   * @param userId - UUID | null: ID of the user performing the batch conversion, if applicable
   * @returns Promise<{ totalProcessed: number, successCount: number, errorCount: number, errors: Array<{ serviceIds: UUID[], message: string }>, createdClaims: UUID[] }>: Batch processing results
   */
  async batchConvertServicesToClaims(
    batchData: Array < {
      serviceIds: UUID[];
      payerId: UUID;
      notes?: string
    } > ,
    userId: UUID | null
  ): Promise < {
    totalProcessed: number;
    successCount: number;
    errorCount: number;
    errors: Array < {
      serviceIds: UUID[];
      message: string;
    } > ;
    createdClaims: UUID[];
  } > {
    // Log workflow start for batch conversion
    logger.info('Starting batch service-to-claim conversion', {
      batchSize: batchData.length,
      userId
    });

    // Validate batch data structure
    if (!batchData || !Array.isArray(batchData)) {
      logger.error('Batch data is invalid');
      throw new BusinessError('Batch data must be a non-empty array', null, 'invalid-batch-data');
    }

    // Delegate to billingService.batchConvertServicesToClaims
    const batchConversionResponse = await this.billingService.batchConvertServicesToClaims(batchData, userId);

    // Log batch conversion results summary
    logger.info('Batch service-to-claim conversion completed', {
      totalProcessed: batchConversionResponse.totalProcessed,
      successCount: batchConversionResponse.successCount,
      errorCount: batchConversionResponse.errorCount,
      createdClaims: batchConversionResponse.createdClaims
    });

    // Return batch results with counts, errors, and created claim IDs
    return batchConversionResponse;
  }

  /**
   * Validates services and converts them to a claim if validation is successful
   * @param request - ServiceToClaimRequest: Request object containing service IDs and payer information
   * @param userId - UUID | null: ID of the user performing the conversion, if applicable
   * @returns Promise<ServiceToClaimResponse>: Response containing the created claim and validation results
   */
  async validateAndConvertToClaim(
    request: ServiceToClaimRequest,
    userId: UUID | null
  ): Promise<ServiceToClaimResponse> {
    // Log workflow start for validate and convert process
    logger.info('Starting validate and convert to claim process', {
      request,
      userId
    });

    // Create validation request from service IDs
    const validationRequest: BillingValidationRequest = {
      serviceIds: request.serviceIds
    };

    // Call validateServicesForBilling to validate all services
    const validationResponse = await this.validateServicesForBilling(validationRequest, userId);

    // If validation fails (has errors), return response with validation errors
    if (!validationResponse.isValid) {
      logger.warn('Service validation failed', {
        serviceIds: request.serviceIds,
        validationResponse
      });
      return {
        claim: null,
        validationResult: {
          isValid: false,
          errors: validationResponse.results.flatMap(r => r.errors),
          warnings: validationResponse.results.flatMap(r => r.warnings)
        },
        success: false,
        message: 'Service validation failed'
      };
    }

    // If validation passes, call convertServicesToClaim to create claim
    const conversionResponse = await this.convertServicesToClaim(request, userId);

    // Log workflow completion with result
    logger.info('Validate and convert to claim process completed', {
      success: conversionResponse.success,
      claimId: conversionResponse.claim?.id,
      message: conversionResponse.message
    });

    // Return response with claim information and validation results
    return conversionResponse;
  }

  /**
   * Retrieves services that are ready for billing with optional filtering
   * @param filter - BillingQueueFilter: Filter object containing criteria for filtering services
   * @param page - number: Page number for pagination
   * @param pageSize - number: Number of services to return per page
   * @returns Promise<BillingQueueResponse>: Paginated list of billable services
   */
  async getBillingQueue(
    filter: BillingQueueFilter,
    page: number,
    pageSize: number
  ): Promise<BillingQueueResponse> {
    // Log workflow start for retrieving billing queue
    logger.info('Starting get billing queue process', {
      filter,
      page,
      pageSize
    });

    // Set default pagination values if not provided
    const currentPage = page || 1;
    const currentPageSize = pageSize || 10;

    // Delegate to billingService.getBillingQueue
    const billingQueueResponse = await this.billingService.getBillingQueue(filter, currentPage, currentPageSize);

    // Log workflow completion with result
    logger.info('Get billing queue process completed', {
      totalServices: billingQueueResponse.services.length,
      total: billingQueueResponse.total,
      page: billingQueueResponse.page,
      limit: billingQueueResponse.limit
    });

    // Return paginated result with services, total count, pagination metadata, and total amount
    return billingQueueResponse;
  }

  /**
   * Validates that a service has complete documentation for billing
   * @param serviceId - UUID: ID of the service to validate
   * @returns Promise<ValidationResult>: Validation results for service documentation
   */
  async validateServiceDocumentation(serviceId: UUID): Promise<ValidationResult> {
    // Log workflow start for documentation validation
    logger.info('Starting documentation validation', {
      serviceId
    });

    // Delegate to documentationValidationService.validateServiceDocumentation
    const validationResult = await this.documentationValidationService.validateServiceDocumentation(serviceId);

    // Log validation result
    logger.info('Documentation validation completed', {
      serviceId,
      isValid: validationResult.isValid,
      errors: validationResult.errors,
      warnings: validationResult.warnings
    });

    // Return validation result with isValid flag and any error/warning messages
    return validationResult;
  }

  /**
   * Validates that a service is properly authorized for billing
   * @param serviceId - UUID: ID of the service to validate
   * @returns Promise<ValidationResult>: Validation results for service authorization
   */
  async validateServiceAuthorization(serviceId: UUID): Promise<ValidationResult> {
    // Log workflow start for authorization validation
    logger.info('Starting authorization validation', {
      serviceId
    });

    // Delegate to authorizationTrackingService.validateServiceAuthorization
    const validationResult = await this.authorizationTrackingService.validateServiceAuthorization(serviceId);

    // Log validation result
    logger.info('Authorization validation completed', {
      serviceId,
      isValid: validationResult.isValid,
      errors: validationResult.errors,
      warnings: validationResult.warnings
    });

    // Return validation result with isValid flag and any error/warning messages
    return validationResult;
  }

  /**
   * Finds services that are ready for billing with optional filtering
   * @param filter - object: Filter object containing criteria for filtering services
   * @param page - number: Page number for pagination
   * @param pageSize - number: Number of services to return per page
   * @returns Promise<{ services: Array<any>, total: number, page: number, limit: number, totalPages: number }>: Paginated list of billable services
   */
  async findBillableServices(
    filter: object,
    page: number,
    pageSize: number
  ): Promise < {
    services: Array < any > ;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } > {
    // Log workflow start for finding billable services
    logger.info('Starting find billable services process', {
      filter,
      page,
      pageSize
    });

    // Set default pagination values if not provided
    const currentPage = page || 1;
    const currentPageSize = pageSize || 10;

    // Delegate to serviceToClaimService.findBillableServices
    const billableServicesResponse = await this.serviceToClaimService.findBillableServices(filter, currentPage, currentPageSize);

    // Log workflow completion with result
    logger.info('Find billable services process completed', {
      totalServices: billableServicesResponse.services.length,
      total: billableServicesResponse.total,
      page: billableServicesResponse.page,
      limit: billableServicesResponse.limit
    });

    // Return paginated result with services, total count, and pagination metadata
    return billableServicesResponse;
  }

  /**
   * Retrieves metrics for the billing dashboard
   * @param userId - UUID | null: ID of the user requesting the dashboard metrics, if applicable
   * @returns Promise<BillingDashboardMetrics>: Metrics for the billing dashboard
   */
  async getBillingDashboardMetrics(userId: UUID | null): Promise<BillingDashboardMetrics> {
    // Log workflow start for retrieving dashboard metrics
    logger.info('Starting get billing dashboard metrics process', {
      userId
    });

    // Delegate to billingService.getBillingDashboardMetrics
    const dashboardMetrics = await this.billingService.getBillingDashboardMetrics(userId);

    // Log workflow completion with result
    logger.info('Get billing dashboard metrics process completed', {
      unbilledServicesCount: dashboardMetrics.unbilledServicesCount,
      incompleteDocumentationCount: dashboardMetrics.incompleteDocumentationCount,
      pendingClaimsCount: dashboardMetrics.pendingClaimsCount
    });

    // Return dashboard metrics including unbilled services, incomplete documentation, and upcoming deadlines
    return dashboardMetrics;
  }
}

// Export the service-to-billing workflow class for use throughout the application
export {
  ServiceToBillingWorkflow
};

// Create a singleton instance of the ServiceToBillingWorkflow
const serviceToBillingWorkflow = new ServiceToBillingWorkflow();

// Export a singleton instance of the service-to-billing workflow for easy access
export {
  serviceToBillingWorkflow
};