import { Request, Response, NextFunction } from 'express'; // version 4.18+
import {
  RequestWithParams,
  RequestWithQuery,
  RequestWithBody,
  RequestWithParamsAndBody,
} from '../types/request.types';
import { UUID } from '../types/common.types';
import {
  IdParam,
  CreateServiceDto,
  UpdateServiceDto,
  UpdateServiceBillingStatusDto,
  UpdateServiceDocumentationStatusDto,
  ServiceQueryParams,
  ServiceValidationRequest,
} from '../types/services.types';
import { ServicesService } from '../services/services.service';
import {
  SuccessResponse,
  PaginatedResponse,
  EmptyResponse,
  ValidationFailureResponse,
  BulkOperationSuccessResponse,
} from '../types/response.types';
import { logger } from '../utils/logger';
import {
  validateCreateService,
  validateUpdateService,
  validateUpdateServiceBillingStatus,
  validateUpdateServiceDocumentationStatus,
  validateServiceQuery,
  validateServiceValidationRequest,
  validateServiceImport,
} from '../validation/service.validation';
import { requireAuth, requirePermissionForAction } from '../middleware/auth.middleware';
import { PermissionCategory, PermissionAction } from '../types/users.types';

// Define the ServicesController object
export const ServicesController = {
  /**
   * Retrieves a service by its ID
   * @param req - Express request object containing the service ID in req.params
   * @param res - Express response object
   * @param next - Express next function
   */
  getServiceById: async (
    req: RequestWithParams<IdParam>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Extract service ID from request parameters
      const { id } = req.params;

      // Log the service retrieval request
      logger.info(`Retrieving service with ID: ${id}`);

      // Call ServicesService.getServiceById with the ID
      const service = await ServicesService.getServiceById(id);

      // Return success response with service data
      res.status(200).json(SuccessResponse(service));
    } catch (error) {
      // Catch and forward any errors to error handling middleware
      next(error);
    }
  },

  /**
   * Retrieves services with optional filtering and pagination
   * @param req - Express request object containing query parameters for filtering and pagination
   * @param res - Express response object
   * @param next - Express next function
   */
  getServices: async (
    req: RequestWithQuery<ServiceQueryParams>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Extract query parameters from request
      const queryParams = req.query;

      // Log the service retrieval request with query parameters
      logger.info('Retrieving services with query parameters', { queryParams });

      // Call ServicesService.getServices with query parameters
      const { services, total } = await ServicesService.getServices(queryParams);

      // Return paginated response with services data and pagination metadata
      res.status(200).json(PaginatedResponse(services, {
        page: queryParams.pagination?.page || 1,
        limit: queryParams.pagination?.limit || 10,
        totalItems: total,
        totalPages: Math.ceil(total / (queryParams.pagination?.limit || 10)),
      }));
    } catch (error) {
      // Catch and forward any errors to error handling middleware
      next(error);
    }
  },

  /**
   * Retrieves services for a specific client
   * @param req - Express request object containing client ID in req.params and query parameters for filtering and pagination
   * @param res - Express response object
   * @param next - Express next function
   */
  getServicesByClientId: async (
    req: RequestWithParamsAndQuery<IdParam, ServiceQueryParams>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Extract client ID from request parameters
      const { id: clientId } = req.params;

      // Extract query parameters from request
      const queryParams = req.query;

      // Log the client services retrieval request
      logger.info(`Retrieving services for client with ID: ${clientId}`);

      // Call ServicesService.getServicesByClientId with client ID and query parameters
      const { services, total } = await ServicesService.getServicesByClientId(clientId, queryParams);

      // Return paginated response with client services data and pagination metadata
      res.status(200).json(PaginatedResponse(services, {
        page: queryParams.pagination?.page || 1,
        limit: queryParams.pagination?.limit || 10,
        totalItems: total,
        totalPages: Math.ceil(total / (queryParams.pagination?.limit || 10)),
      }));
    } catch (error) {
      // Catch and forward any errors to error handling middleware
      next(error);
    }
  },

  /**
   * Retrieves services for a specific program
   * @param req - Express request object containing program ID in req.params and query parameters for filtering and pagination
   * @param res - Express response object
   * @param next - Express next function
   */
  getServicesByProgramId: async (
    req: RequestWithParamsAndQuery<IdParam, ServiceQueryParams>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Extract program ID from request parameters
      const { id: programId } = req.params;

      // Extract query parameters from request
      const queryParams = req.query;

      // Log the program services retrieval request
      logger.info(`Retrieving services for program with ID: ${programId}`);

      // Call ServicesService.getServicesByProgramId with program ID and query parameters
      const { services, total } = await ServicesService.getServicesByProgramId(programId, queryParams);

      // Return paginated response with program services data and pagination metadata
      res.status(200).json(PaginatedResponse(services, {
        page: queryParams.pagination?.page || 1,
        limit: queryParams.pagination?.limit || 10,
        totalItems: total,
        totalPages: Math.ceil(total / (queryParams.pagination?.limit || 10)),
      }));
    } catch (error) {
      // Catch and forward any errors to error handling middleware
      next(error);
    }
  },

  /**
   * Retrieves services for a specific authorization
   * @param req - Express request object containing authorization ID in req.params and query parameters for filtering and pagination
   * @param res - Express response object
   * @param next - Express next function
   */
  getServicesByAuthorizationId: async (
    req: RequestWithParamsAndQuery<IdParam, ServiceQueryParams>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Extract authorization ID from request parameters
      const { id: authorizationId } = req.params;

      // Extract query parameters from request
      const queryParams = req.query;

      // Log the authorization services retrieval request
      logger.info(`Retrieving services for authorization with ID: ${authorizationId}`);

      // Call ServicesService.getServicesByAuthorizationId with authorization ID and query parameters
      const { services, total } = await ServicesService.getServicesByAuthorizationId(authorizationId, queryParams);

      // Return paginated response with authorization services data and pagination metadata
      res.status(200).json(PaginatedResponse(services, {
        page: queryParams.pagination?.page || 1,
        limit: queryParams.pagination?.limit || 10,
        totalItems: total,
        totalPages: Math.ceil(total / (queryParams.pagination?.limit || 10)),
      }));
    } catch (error) {
      // Catch and forward any errors to error handling middleware
      next(error);
    }
  },

  /**
   * Retrieves services for a specific claim
   * @param req - Express request object containing claim ID in req.params and query parameters for filtering and pagination
   * @param res - Express response object
   * @param next - Express next function
   */
  getServicesByClaimId: async (
    req: RequestWithParamsAndQuery<IdParam, ServiceQueryParams>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Extract claim ID from request parameters
      const { id: claimId } = req.params;

      // Extract query parameters from request
      const queryParams = req.query;

      // Log the claim services retrieval request
      logger.info(`Retrieving services for claim with ID: ${claimId}`);

      // Call ServicesService.getServicesByClaimId with claim ID and query parameters
      const { services, total } = await ServicesService.getServicesByClaimId(claimId, queryParams);

      // Return paginated response with claim services data and pagination metadata
      res.status(200).json(PaginatedResponse(services, {
        page: queryParams.pagination?.page || 1,
        limit: queryParams.pagination?.limit || 10,
        totalItems: total,
        totalPages: Math.ceil(total / (queryParams.pagination?.limit || 10)),
      }));
    } catch (error) {
      // Catch and forward any errors to error handling middleware
      next(error);
    }
  },

  /**
   * Creates a new service
   * @param req - Express request object containing service data in req.body
   * @param res - Express response object
   * @param next - Express next function
   */
  createService: async (
    req: RequestWithBody<CreateServiceDto>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Extract service data from request body
      const serviceData = req.body;

      // Extract authenticated user ID from request
      const createdBy = req.user?.id;

      // Log the service creation request
      logger.info('Creating service', { serviceData, createdBy });

      // Call ServicesService.createService with service data and user ID
      const service = await ServicesService.createService(serviceData, createdBy);

      // Return success response with created service data
      res.status(201).json(SuccessResponse(service));
    } catch (error) {
      // Catch and forward any errors to error handling middleware
      next(error);
    }
  },

  /**
   * Updates an existing service
   * @param req - Express request object containing service ID in req.params and update data in req.body
   * @param res - Express response object
   * @param next - Express next function
   */
  updateService: async (
    req: RequestWithParamsAndBody<IdParam, UpdateServiceDto>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Extract service ID from request parameters
      const { id } = req.params;

      // Extract service data from request body
      const serviceData = req.body;

      // Extract authenticated user ID from request
      const updatedBy = req.user?.id;

      // Log the service update request
      logger.info(`Updating service with ID: ${id}`, { serviceData, updatedBy });

      // Call ServicesService.updateService with service ID, service data, and user ID
      const service = await ServicesService.updateService(id, serviceData, updatedBy);

      // Return success response with updated service data
      res.status(200).json(SuccessResponse(service));
    } catch (error) {
      // Catch and forward any errors to error handling middleware
      next(error);
    }
  },

  /**
   * Marks a service as deleted (soft delete)
   * @param req - Express request object containing service ID in req.params
   * @param res - Express response object
   * @param next - Express next function
   */
  deleteService: async (
    req: RequestWithParams<IdParam>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Extract service ID from request parameters
      const { id } = req.params;

      // Extract authenticated user ID from request
      const deletedBy = req.user?.id;

      // Log the service deletion request
      logger.info(`Deleting service with ID: ${id}`, { deletedBy });

      // Call ServicesService.deleteService with service ID and user ID
      const deleted = await ServicesService.deleteService(id, deletedBy);

      // Return empty success response
      res.status(204).json(EmptyResponse());
    } catch (error) {
      // Catch and forward any errors to error handling middleware
      next(error);
    }
  },

  /**
   * Updates a service's billing status
   * @param req - Express request object containing service ID in req.params and billing status data in req.body
   * @param res - Express response object
   * @param next - Express next function
   */
  updateServiceBillingStatus: async (
    req: RequestWithParamsAndBody<IdParam, UpdateServiceBillingStatusDto>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Extract service ID from request parameters
      const { id } = req.params;

      // Extract billing status data from request body
      const statusData = req.body;

      // Extract authenticated user ID from request
      const updatedBy = req.user?.id;

      // Log the billing status update request
      logger.info(`Updating service billing status with ID: ${id}`, { statusData, updatedBy });

      // Call ServicesService.updateServiceBillingStatus with service ID, status data, and user ID
      const service = await ServicesService.updateServiceBillingStatus(id, statusData, updatedBy);

      // Return success response with updated service data
      res.status(200).json(SuccessResponse(service));
    } catch (error) {
      // Catch and forward any errors to error handling middleware
      next(error);
    }
  },

  /**
   * Updates a service's documentation status
   * @param req - Express request object containing service ID in req.params and documentation status data in req.body
   * @param res - Express response object
   * @param next - Express next function
   */
  updateServiceDocumentationStatus: async (
    req: RequestWithParamsAndBody<IdParam, UpdateServiceDocumentationStatusDto>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Extract service ID from request parameters
      const { id } = req.params;

      // Extract documentation status data from request body
      const statusData = req.body;

      // Extract authenticated user ID from request
      const updatedBy = req.user?.id;

      // Log the documentation status update request
      logger.info(`Updating service documentation status with ID: ${id}`, { statusData, updatedBy });

      // Call ServicesService.updateServiceDocumentationStatus with service ID, status data, and user ID
      const service = await ServicesService.updateServiceDocumentationStatus(id, statusData, updatedBy);

      // Return success response with updated service data
      res.status(200).json(SuccessResponse(service));
    } catch (error) {
      // Catch and forward any errors to error handling middleware
      next(error);
    }
  },

  /**
   * Updates billing status for multiple services
   * @param req - Express request object containing service IDs and status data in req.body
   * @param res - Express response object
   * @param next - Express next function
   */
  bulkUpdateBillingStatus: async (
    req: RequestWithBody<{ serviceIds: UUID[], statusData: UpdateServiceBillingStatusDto }>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Extract service IDs and status data from request body
      const { serviceIds, statusData } = req.body;

      // Extract authenticated user ID from request
      const updatedBy = req.user?.id;

      // Log the bulk billing status update request
      logger.info('Bulk updating billing status for services', { serviceIds, statusData, updatedBy });

      // Call ServicesService.bulkUpdateBillingStatus with service IDs, status data, and user ID
      const results = await ServicesService.bulkUpdateBillingStatus(serviceIds, statusData, updatedBy);

      // Return bulk operation success response with results
      res.status(200).json(BulkOperationSuccessResponse({
        successful: results.updatedCount,
        failed: results.failedIds.length,
        total: serviceIds.length,
      }, results.failedIds.map(id => ({ id, reason: 'Failed to update billing status' }))));
    } catch (error) {
      // Catch and forward any errors to error handling middleware
      next(error);
    }
  },

  /**
   * Validates a service for billing readiness
   * @param req - Express request object containing service ID in req.params
   * @param res - Express response object
   * @param next - Express next function
   */
  validateService: async (
    req: RequestWithParams<IdParam>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Extract service ID from request parameters
      const { id } = req.params;

      // Log the service validation request
      logger.info(`Validating service with ID: ${id}`);

      // Call ServicesService.validateService with service ID
      const validationResult = await ServicesService.validateService(id);

      // Return success response with validation results
      res.status(200).json(SuccessResponse(validationResult));
    } catch (error) {
      // Catch and forward any errors to error handling middleware
      next(error);
    }
  },

  /**
   * Validates multiple services for billing readiness
   * @param req - Express request object containing service IDs in req.body
   * @param res - Express response object
   * @param next - Express next function
   */
  validateServices: async (
    req: RequestWithBody<ServiceValidationRequest>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Extract service IDs from request body
      const { serviceIds } = req.body;

      // Log the multiple services validation request
      logger.info('Validating multiple services', { serviceIds });

      // Call ServicesService.validateServices with service IDs
      const validationResponse = await ServicesService.validateServices(serviceIds);

      // If validation has errors or warnings, return validation failure response
      if (!validationResponse.isValid) {
        return res.status(400).json(ValidationFailureResponse(
          validationResponse.isValid,
          validationResponse.errors,
          validationResponse.warnings,
          'One or more services failed validation'
        ));
      }

      // Otherwise, return success response with validation results
      res.status(200).json(SuccessResponse(validationResponse));
    } catch (error) {
      // Catch and forward any errors to error handling middleware
      next(error);
    }
  },

  /**
   * Retrieves summarized service information for lists and dashboards
   * @param req - Express request object containing query parameters for filtering and pagination
   * @param res - Express response object
   * @param next - Express next function
   */
  getServiceSummaries: async (
    req: RequestWithQuery<ServiceQueryParams>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Extract query parameters from request
      const queryParams = req.query;

      // Log the service summaries retrieval request
      logger.info('Retrieving service summaries', { queryParams });

      // Call ServicesService.getServiceSummaries with query parameters
      const { services, total } = await ServicesService.getServiceSummaries(queryParams);

      // Return paginated response with service summaries and pagination metadata
      res.status(200).json(PaginatedResponse(services, {
        page: queryParams.pagination?.page || 1,
        limit: queryParams.pagination?.limit || 10,
        totalItems: total,
        totalPages: Math.ceil(total / (queryParams.pagination?.limit || 10)),
      }));
    } catch (error) {
      // Catch and forward any errors to error handling middleware
      next(error);
    }
  },

  /**
   * Retrieves services that are ready for billing
   * @param req - Express request object containing query parameters for filtering and pagination
   * @param res - Express response object
   * @param next - Express next function
   */
  getBillableServices: async (
    req: RequestWithQuery<ServiceQueryParams>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Extract query parameters from request
      const queryParams = req.query;

      // Log the billable services retrieval request
      logger.info('Retrieving billable services', { queryParams });

      // Call ServicesService.getBillableServices with query parameters
      const { services, total } = await ServicesService.getBillableServices(queryParams);

      // Return paginated response with billable services and pagination metadata
      res.status(200).json(PaginatedResponse(services, {
        page: queryParams.pagination?.page || 1,
        limit: queryParams.pagination?.limit || 10,
        totalItems: total,
        totalPages: Math.ceil(total / (queryParams.pagination?.limit || 10)),
      }));
    } catch (error) {
      // Catch and forward any errors to error handling middleware
      next(error);
    }
  },

  /**
   * Retrieves service metrics for dashboard and reporting
   * @param req - Express request object containing query parameters for filtering metrics
   * @param res - Express response object
   * @param next - Express next function
   */
  getServiceMetrics: async (
    req: RequestWithQuery<{ dateRange?: string, programId?: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Extract date range and program ID from query parameters
      const { dateRange, programId } = req.query;

      // Prepare options object with extracted parameters
      const options = {
        dateRange,
        programId,
      };

      // Log the service metrics retrieval request
      logger.info('Retrieving service metrics', { options });

      // Call ServicesService.getServiceMetrics with options
      const metrics = await ServicesService.getServiceMetrics(options);

      // Return success response with service metrics data
      res.status(200).json(SuccessResponse(metrics));
    } catch (error) {
      // Catch and forward any errors to error handling middleware
      next(error);
    }
  },

  /**
   * Imports services from external systems
   * @param req - Express request object containing services array in req.body
   * @param res - Express response object
   * @param next - Express next function
   */
  importServices: async (
    req: RequestWithBody<{ services: any[] }>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Extract services array from request body
      const { services } = req.body;

      // Extract authenticated user ID from request
      const createdBy = req.user?.id;

      // Log the service import request
      logger.info('Importing services', { serviceCount: services.length, createdBy });

      // Call ServicesService.importServices with services array and user ID
      const importResults = await ServicesService.importServices(services, createdBy);

      // Return success response with import results
      res.status(200).json(SuccessResponse(importResults));
    } catch (error) {
      // Catch and forward any errors to error handling middleware
      next(error);
    }
  },
};