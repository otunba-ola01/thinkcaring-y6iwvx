import { ServicesService } from '../../services/services.service';
import { ServiceModel } from '../../models/service.model';
import { ClientsService } from '../../services/clients.service';
import { NotificationService } from '../../services/notification.service';
import { NotFoundError } from '../../errors/not-found-error';
import { BusinessError } from '../../errors/business-error';
import { ValidationError } from '../../errors/validation-error';
import { ServiceType, DocumentationStatus, BillingStatus, StatusType } from '../../types/services.types';
import { mockService, mockServiceWithRelations, mockServiceSummary, mockServices, mockServicesWithRelations, mockServiceSummaries, mockServiceMetrics, createMockService, createMockServiceWithRelations } from '../fixtures/services.fixtures';
import { mockClient } from '../fixtures/clients.fixtures';
import { mockAuthorization } from '../fixtures/authorizations.fixtures';

// Mock the service model to isolate tests from database
jest.mock('../../models/service.model');

// Mock the clients service for testing
jest.mock('../../services/clients.service');

// Mock the notification service for testing
jest.mock('../../services/notification.service');

describe('ServicesService', () => {
  // Main test suite for the ServicesService

  let servicesService: ServicesService;
  let mockServiceModel: jest.Mocked<typeof ServiceModel>;
  let mockClientsService: jest.Mocked<typeof ClientsService>;
  let mockNotificationService: jest.Mocked<typeof NotificationService>;

  beforeEach(() => {
    // Setup function that runs before each test
    servicesService = ServicesService;
    mockServiceModel = {
      findById: jest.fn(),
      findAll: jest.fn(),
      findByClientId: jest.fn(),
      findByAuthorizationId: jest.fn(),
      findByClaimId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateBillingStatus: jest.fn(),
      updateDocumentationStatus: jest.fn(),
      delete: jest.fn(),
      validateService: jest.fn(),
      validateServices: jest.fn(),
      getServiceSummaries: jest.fn(),
      getUnbilledServices: jest.fn(),
      getServiceMetrics: jest.fn(),
      importServices: jest.fn(),
    } as any;
    (ServiceModel as any).mockImplementation(() => mockServiceModel);

    mockClientsService = {
      getClientById: jest.fn(),
    } as any;
    (ClientsService as any).mockImplementation(() => mockClientsService);

    mockNotificationService = {
      sendServiceNotification: jest.fn(),
    } as any;
    (NotificationService as any).mockImplementation(() => mockNotificationService);
  });

  afterEach(() => {
    // Cleanup function that runs after each test
    jest.clearAllMocks();
  });

  describe('getServiceById', () => {
    // Test suite for the getServiceById method

    test('should return a service when found', async () => {
      // Test that getServiceById returns a service when it exists
      mockServiceModel.findById.mockResolvedValue(mockServiceWithRelations);

      const service = await servicesService.getServiceById(mockService.id);

      expect(service).toEqual(mockServiceWithRelations);
      expect(mockServiceModel.findById).toHaveBeenCalledWith(mockService.id);
    });

    test('should throw NotFoundError when service does not exist', async () => {
      // Test that getServiceById throws NotFoundError for non-existent services
      mockServiceModel.findById.mockResolvedValue(null);

      await expect(servicesService.getServiceById(mockService.id)).rejects.toThrow(NotFoundError);
      expect(mockServiceModel.findById).toHaveBeenCalledWith(mockService.id);
    });
  });

  describe('getServices', () => {
    // Test suite for the getServices method

    test('should return services with pagination', async () => {
      // Test that getServices returns services with pagination
      const mockQueryParams = { pagination: { page: 1, limit: 10 }, sort: { sortBy: 'serviceDate', sortDirection: 'asc' } } as any;
      mockServiceModel.findAll.mockResolvedValue({ services: mockServicesWithRelations, total: mockServicesWithRelations.length });

      const { services, total } = await servicesService.getServices(mockQueryParams);

      expect(services).toEqual(mockServicesWithRelations);
      expect(total).toEqual(mockServicesWithRelations.length);
      expect(mockServiceModel.findAll).toHaveBeenCalledWith(mockQueryParams);
    });
  });

  describe('getServicesByClientId', () => {
    // Test suite for the getServicesByClientId method

    test('should return services for a specific client', async () => {
      // Test that getServicesByClientId returns services for a specific client
      const mockClientId = mockClient.id;
      const mockQueryParams = { pagination: { page: 1, limit: 10 }, sort: { sortBy: 'serviceDate', sortDirection: 'asc' } } as any;
      mockServiceModel.findByClientId.mockResolvedValue({ services: mockServicesWithRelations, total: mockServicesWithRelations.length });

      const { services, total } = await servicesService.getServicesByClientId(mockClientId, mockQueryParams);

      expect(services).toEqual(mockServicesWithRelations);
      expect(total).toEqual(mockServicesWithRelations.length);
      expect(mockServiceModel.findByClientId).toHaveBeenCalledWith(mockClientId, mockQueryParams);
    });
  });

  describe('getServicesByProgramId', () => {
    // Test suite for the getServicesByProgramId method

    test('should return services for a specific program', async () => {
      // Test that getServicesByProgramId returns services for a specific program
      const mockProgramId = mockProgram.id;
      const mockQueryParams = { pagination: { page: 1, limit: 10 }, sort: { sortBy: 'serviceDate', sortDirection: 'asc' } } as any;
      mockServiceModel.findAll.mockResolvedValue({ services: mockServicesWithRelations, total: mockServicesWithRelations.length });

      const { services, total } = await servicesService.getServicesByProgramId(mockProgramId, mockQueryParams);

      expect(services).toEqual(mockServicesWithRelations);
      expect(total).toEqual(mockServicesWithRelations.length);
      expect(mockServiceModel.findAll).toHaveBeenCalledWith({ ...mockQueryParams, programId: mockProgramId });
    });
  });

  describe('getServicesByAuthorizationId', () => {
    // Test suite for the getServicesByAuthorizationId method

    test('should return services for a specific authorization', async () => {
      // Test that getServicesByAuthorizationId returns services for a specific authorization
      const mockAuthorizationId = mockAuthorization.id;
      const mockQueryParams = { pagination: { page: 1, limit: 10 }, sort: { sortBy: 'serviceDate', sortDirection: 'asc' } } as any;
      mockServiceModel.findByAuthorizationId.mockResolvedValue({ services: mockServicesWithRelations, total: mockServicesWithRelations.length });

      const { services, total } = await servicesService.getServicesByAuthorizationId(mockAuthorizationId, mockQueryParams);

      expect(services).toEqual(mockServicesWithRelations);
      expect(total).toEqual(mockServicesWithRelations.length);
      expect(mockServiceModel.findByAuthorizationId).toHaveBeenCalledWith(mockAuthorizationId, mockQueryParams);
    });
  });

  describe('getServicesByClaimId', () => {
    // Test suite for the getServicesByClaimId method

    test('should return services for a specific claim', async () => {
      // Test that getServicesByClaimId returns services for a specific claim
      const mockClaimId = 'claim-id-123';
      const mockQueryParams = { pagination: { page: 1, limit: 10 }, sort: { sortBy: 'serviceDate', sortDirection: 'asc' } } as any;
      mockServiceModel.findByClaimId.mockResolvedValue({ services: mockServicesWithRelations, total: mockServicesWithRelations.length });

      const { services, total } = await servicesService.getServicesByClaimId(mockClaimId, mockQueryParams);

      expect(services).toEqual(mockServicesWithRelations);
      expect(total).toEqual(mockServicesWithRelations.length);
      expect(mockServiceModel.findByClaimId).toHaveBeenCalledWith(mockClaimId, mockQueryParams);
    });
  });

  describe('createService', () => {
    // Test suite for the createService method

    test('should create a new service', async () => {
      // Test that createService creates a new service
      const mockServiceData = {
        clientId: mockClient.id,
        serviceTypeId: 'service-type-id',
        serviceCode: 'service-code',
        serviceDate: '2024-01-01',
        units: 1,
        rate: 50,
        programId: mockProgram.id,
        documentationStatus: DocumentationStatus.COMPLETE,
      } as any;
      mockClientsService.getClientById.mockResolvedValue(mockClient);
      mockServiceModel.create.mockResolvedValue(mockServiceWithRelations);
      mockNotificationService.sendServiceNotification.mockResolvedValue(undefined);

      const service = await servicesService.createService(mockServiceData);

      expect(service).toEqual(mockServiceWithRelations);
      expect(mockClientsService.getClientById).toHaveBeenCalledWith(mockServiceData.clientId, false);
      expect(mockServiceModel.create).toHaveBeenCalledWith(mockServiceData, null);
      expect(mockNotificationService.sendServiceNotification).toHaveBeenCalled();
    });

    test('should throw NotFoundError when client does not exist', async () => {
      // Test that createService throws NotFoundError when client does not exist
      const mockServiceData = {
        clientId: mockClient.id,
        serviceTypeId: 'service-type-id',
        serviceCode: 'service-code',
        serviceDate: '2024-01-01',
        units: 1,
        rate: 50,
        programId: mockProgram.id,
        documentationStatus: DocumentationStatus.COMPLETE,
      } as any;
      mockClientsService.getClientById.mockRejectedValue(new NotFoundError('Client not found', 'client', mockServiceData.clientId));

      await expect(servicesService.createService(mockServiceData)).rejects.toThrow(NotFoundError);
      expect(mockClientsService.getClientById).toHaveBeenCalledWith(mockServiceData.clientId, false);
      expect(mockServiceModel.create).not.toHaveBeenCalled();
    });
  });

  describe('updateService', () => {
    // Test suite for the updateService method

    test('should update an existing service', async () => {
      // Test that updateService updates an existing service
      mockServiceModel.findById.mockResolvedValue(mockServiceWithRelations);
      mockServiceModel.update.mockResolvedValue(mockServiceWithRelations);
      mockNotificationService.sendServiceNotification.mockResolvedValue(undefined);
      const mockUpdateData = { serviceCode: 'new-service-code' } as any;

      const service = await servicesService.updateService(mockService.id, mockUpdateData);

      expect(service).toEqual(mockServiceWithRelations);
      expect(mockServiceModel.findById).toHaveBeenCalledWith(mockService.id);
      expect(mockServiceModel.update).toHaveBeenCalledWith(mockService.id, mockUpdateData, null);
      expect(mockNotificationService.sendServiceNotification).toHaveBeenCalled();
    });

    test('should throw NotFoundError when updating non-existent service', async () => {
      // Test that updateService throws NotFoundError for non-existent services
      mockServiceModel.findById.mockResolvedValue(null);
      const mockUpdateData = { serviceCode: 'new-service-code' } as any;

      await expect(servicesService.updateService(mockService.id, mockUpdateData)).rejects.toThrow(NotFoundError);
      expect(mockServiceModel.findById).toHaveBeenCalledWith(mockService.id);
      expect(mockServiceModel.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteService', () => {
    // Test suite for the deleteService method

    test('should delete a service', async () => {
      // Test that deleteService deletes a service
      mockServiceModel.findById.mockResolvedValue(mockServiceWithRelations);
      mockServiceModel.delete.mockResolvedValue(true);
      mockNotificationService.sendServiceNotification.mockResolvedValue(undefined);

      const result = await servicesService.deleteService(mockService.id);

      expect(result).toBe(true);
      expect(mockServiceModel.findById).toHaveBeenCalledWith(mockService.id);
      expect(mockServiceModel.delete).toHaveBeenCalledWith(mockService.id, null);
      expect(mockNotificationService.sendServiceNotification).toHaveBeenCalled();
    });

    test('should throw NotFoundError when deleting non-existent service', async () => {
      // Test that deleteService throws NotFoundError for non-existent services
      mockServiceModel.findById.mockResolvedValue(null);

      await expect(servicesService.deleteService(mockService.id)).rejects.toThrow(NotFoundError);
      expect(mockServiceModel.findById).toHaveBeenCalledWith(mockService.id);
      expect(mockServiceModel.delete).not.toHaveBeenCalled();
    });
  });

  describe('updateServiceBillingStatus', () => {
    // Test suite for the updateServiceBillingStatus method

    test('should update service billing status', async () => {
      // Test that updateServiceBillingStatus updates a service's billing status
      mockServiceModel.findById.mockResolvedValue(mockServiceWithRelations);
      mockServiceModel.updateBillingStatus.mockResolvedValue(mockServiceWithRelations);
      mockNotificationService.sendServiceNotification.mockResolvedValue(undefined);
      const mockStatusData = { billingStatus: BillingStatus.BILLED } as any;

      const service = await servicesService.updateServiceBillingStatus(mockService.id, mockStatusData);

      expect(service).toEqual(mockServiceWithRelations);
      expect(mockServiceModel.findById).toHaveBeenCalledWith(mockService.id);
      expect(mockServiceModel.updateBillingStatus).toHaveBeenCalledWith(mockService.id, mockStatusData, null);
      expect(mockNotificationService.sendServiceNotification).toHaveBeenCalled();
    });

    test('should throw BusinessError when billing status transition is not allowed', async () => {
      // Test that updateServiceBillingStatus throws BusinessError for invalid transitions
      const mockServiceWithBilledStatus = { ...mockServiceWithRelations, billingStatus: BillingStatus.BILLED };
      mockServiceModel.findById.mockResolvedValue(mockServiceWithBilledStatus);
      const mockStatusData = { billingStatus: BillingStatus.UNBILLED } as any;

      await expect(servicesService.updateServiceBillingStatus(mockService.id, mockStatusData)).rejects.toThrow(BusinessError);
      expect(mockServiceModel.findById).toHaveBeenCalledWith(mockService.id);
      expect(mockServiceModel.updateBillingStatus).not.toHaveBeenCalled();
    });
  });

  describe('updateServiceDocumentationStatus', () => {
    // Test suite for the updateServiceDocumentationStatus method

    test('should update service documentation status', async () => {
      // Test that updateServiceDocumentationStatus updates a service's documentation status
      mockServiceModel.findById.mockResolvedValue(mockServiceWithRelations);
      mockServiceModel.updateDocumentationStatus.mockResolvedValue(mockServiceWithRelations);
      mockNotificationService.sendServiceNotification.mockResolvedValue(undefined);
      const mockStatusData = { documentationStatus: DocumentationStatus.COMPLETE } as any;

      const service = await servicesService.updateServiceDocumentationStatus(mockService.id, mockStatusData);

      expect(service).toEqual(mockServiceWithRelations);
      expect(mockServiceModel.findById).toHaveBeenCalledWith(mockService.id);
      expect(mockServiceModel.updateDocumentationStatus).toHaveBeenCalledWith(mockService.id, mockStatusData, null);
      expect(mockNotificationService.sendServiceNotification).toHaveBeenCalled();
    });

    test('should update billing status to READY_FOR_BILLING when documentation is complete', async () => {
      // Test that updateServiceDocumentationStatus updates billing status when documentation is complete
      const mockServiceWithUnbilledStatus = { ...mockServiceWithRelations, documentationStatus: DocumentationStatus.INCOMPLETE, billingStatus: BillingStatus.UNBILLED };
      mockServiceModel.findById.mockResolvedValue(mockServiceWithUnbilledStatus);
      mockServiceModel.updateDocumentationStatus.mockResolvedValue({ ...mockServiceWithUnbilledStatus, documentationStatus: DocumentationStatus.COMPLETE });
      mockServiceModel.updateBillingStatus.mockResolvedValue({ ...mockServiceWithUnbilledStatus, documentationStatus: DocumentationStatus.COMPLETE, billingStatus: BillingStatus.READY_FOR_BILLING });
      mockNotificationService.sendServiceNotification.mockResolvedValue(undefined);
      const mockStatusData = { documentationStatus: DocumentationStatus.COMPLETE } as any;

      const service = await servicesService.updateServiceDocumentationStatus(mockService.id, mockStatusData);

      expect(service).toEqual({ ...mockServiceWithUnbilledStatus, documentationStatus: DocumentationStatus.COMPLETE, billingStatus: BillingStatus.READY_FOR_BILLING });
      expect(mockServiceModel.updateDocumentationStatus).toHaveBeenCalledWith(mockService.id, mockStatusData, null);
      expect(mockServiceModel.updateBillingStatus).toHaveBeenCalledWith(mockService.id, { billingStatus: BillingStatus.READY_FOR_BILLING, claimId: null }, null);
      expect(mockNotificationService.sendServiceNotification).toHaveBeenCalledTimes(2);
    });
  });

  describe('bulkUpdateBillingStatus', () => {
    // Test suite for the bulkUpdateBillingStatus method

    test('should update billing status for multiple services', async () => {
      // Test that bulkUpdateBillingStatus updates billing status for multiple services
      const mockServiceIds = [mockService.id, 'service-id-2', 'service-id-3'];
      const mockStatusData = { billingStatus: BillingStatus.BILLED } as any;
      (servicesService.updateServiceBillingStatus as jest.Mock) = jest.fn().mockResolvedValue(mockServiceWithRelations);

      const result = await servicesService.bulkUpdateBillingStatus(mockServiceIds, mockStatusData);

      expect(result.updatedCount).toBe(mockServiceIds.length);
      expect(result.failedIds).toEqual([]);
      mockServiceIds.forEach(id => {
        expect(servicesService.updateServiceBillingStatus).toHaveBeenCalledWith(id, mockStatusData);
      });
    });

    test('should handle partial success with some failures', async () => {
      // Test that bulkUpdateBillingStatus handles partial success with some failures
      const mockServiceIds = [mockService.id, 'service-id-2', 'service-id-3'];
      const mockStatusData = { billingStatus: BillingStatus.BILLED } as any;
      (servicesService.updateServiceBillingStatus as jest.Mock) = jest.fn()
        .mockResolvedValueOnce(mockServiceWithRelations)
        .mockRejectedValueOnce(new Error('Update failed'))
        .mockResolvedValueOnce(mockServiceWithRelations);

      const result = await servicesService.bulkUpdateBillingStatus(mockServiceIds, mockStatusData);

      expect(result.updatedCount).toBe(2);
      expect(result.failedIds).toEqual(['service-id-2']);
      expect(servicesService.updateServiceBillingStatus).toHaveBeenCalledTimes(3);
    });
  });

  describe('validateService', () => {
    // Test suite for the validateService method

    test('should validate a service successfully', async () => {
      // Test that validateService validates a service successfully
      mockServiceModel.findById.mockResolvedValue(mockServiceWithRelations);
      const mockValidationResult = { isValid: true, errors: [], warnings: [] } as any;
      mockServiceModel.validateService.mockResolvedValue(mockValidationResult);
      mockServiceModel.updateBillingStatus.mockResolvedValue(mockServiceWithRelations);

      const result = await servicesService.validateService(mockService.id);

      expect(result).toEqual(mockValidationResult);
      expect(mockServiceModel.findById).toHaveBeenCalledWith(mockService.id);
      expect(mockServiceModel.validateService).toHaveBeenCalledWith(mockService.id);
      expect(mockServiceModel.updateBillingStatus).toHaveBeenCalledWith(mockService.id, { billingStatus: BillingStatus.READY_FOR_BILLING, claimId: null }, null);
    });

    test('should return validation errors when service is invalid', async () => {
      // Test that validateService returns validation errors for invalid services
      mockServiceModel.findById.mockResolvedValue(mockServiceWithRelations);
      const mockValidationResult = { isValid: false, errors: [{ code: 'INVALID_DATA', message: 'Invalid data' }], warnings: [] } as any;
      mockServiceModel.validateService.mockResolvedValue(mockValidationResult);

      const result = await servicesService.validateService(mockService.id);

      expect(result).toEqual(mockValidationResult);
      expect(mockServiceModel.findById).toHaveBeenCalledWith(mockService.id);
      expect(mockServiceModel.validateService).toHaveBeenCalledWith(mockService.id);
      expect(mockServiceModel.updateBillingStatus).not.toHaveBeenCalled();
    });
  });

  describe('validateServices', () => {
    // Test suite for the validateServices method

    test('should validate multiple services in a batch', async () => {
      // Test that validateServices validates multiple services
      const mockServiceIds = [mockService.id, 'service-id-2', 'service-id-3'];
      const mockBatchResult = { results: [{ serviceId: mockService.id, isValid: true, errors: [], warnings: [] }], isValid: true, totalErrors: 0, totalWarnings: 0 } as any;
      mockServiceModel.validateServices.mockResolvedValue(mockBatchResult);
      mockServiceModel.updateBillingStatus.mockResolvedValue(mockServiceWithRelations);

      const result = await servicesService.validateServices(mockServiceIds);

      expect(result).toEqual(mockBatchResult);
      expect(mockServiceModel.validateServices).toHaveBeenCalledWith(mockServiceIds);
      expect(mockServiceModel.updateBillingStatus).toHaveBeenCalled();
    });

    test('should handle validation with some invalid services', async () => {
      // Test that validateServices handles some invalid services
      const mockServiceIds = [mockService.id, 'service-id-2', 'service-id-3'];
      const mockBatchResult = { results: [{ serviceId: mockService.id, isValid: true, errors: [], warnings: [] }, { serviceId: 'service-id-2', isValid: false, errors: [{ code: 'INVALID_DATA', message: 'Invalid data' }], warnings: [] }], isValid: false, totalErrors: 1, totalWarnings: 0 } as any;
      mockServiceModel.validateServices.mockResolvedValue(mockBatchResult);
      mockServiceModel.updateBillingStatus.mockResolvedValue(mockServiceWithRelations);

      const result = await servicesService.validateServices(mockServiceIds);

      expect(result).toEqual(mockBatchResult);
      expect(mockServiceModel.validateServices).toHaveBeenCalledWith(mockServiceIds);
      expect(mockServiceModel.updateBillingStatus).toHaveBeenCalled();
    });
  });

  describe('getServiceSummaries', () => {
    // Test suite for the getServiceSummaries method

    test('should return service summaries with pagination', async () => {
      // Test that getServiceSummaries returns service summaries with pagination
      const mockQueryParams = { pagination: { page: 1, limit: 10 }, sort: { sortBy: 'serviceDate', sortDirection: 'asc' } } as any;
      mockServiceModel.getServiceSummaries.mockResolvedValue({ services: mockServiceSummaries, total: mockServiceSummaries.length });

      const { services, total } = await servicesService.getServiceSummaries(mockQueryParams);

      expect(services).toEqual(mockServiceSummaries);
      expect(total).toEqual(mockServiceSummaries.length);
      expect(mockServiceModel.getServiceSummaries).toHaveBeenCalledWith(mockQueryParams);
    });
  });

  describe('getBillableServices', () => {
    // Test suite for the getBillableServices method

    test('should return services ready for billing', async () => {
      // Test that getBillableServices returns services ready for billing
      const mockQueryParams = { pagination: { page: 1, limit: 10 }, sort: { sortBy: 'serviceDate', sortDirection: 'asc' } } as any;
      mockServiceModel.getUnbilledServices.mockResolvedValue({ services: mockServicesWithRelations, total: mockServicesWithRelations.length });

      const { services, total } = await servicesService.getBillableServices(mockQueryParams);

      expect(services).toEqual(mockServicesWithRelations);
      expect(total).toEqual(mockServicesWithRelations.length);
      expect(mockServiceModel.getUnbilledServices).toHaveBeenCalledWith(mockQueryParams);
    });
  });

  describe('getServiceMetrics', () => {
    // Test suite for the getServiceMetrics method

    test('should return service metrics', async () => {
      // Test that getServiceMetrics returns service metrics
      const mockOptions = { dateRange: { startDate: '2024-01-01', endDate: '2024-01-31' } };
      mockServiceModel.getServiceMetrics.mockResolvedValue(mockServiceMetrics);

      const metrics = await servicesService.getServiceMetrics(mockOptions);

      expect(metrics).toEqual(mockServiceMetrics);
      expect(mockServiceModel.getServiceMetrics).toHaveBeenCalledWith(mockOptions);
    });
  });

  describe('importServices', () => {
    // Test suite for the importServices method

    test('should import services successfully', async () => {
      // Test that importServices imports services successfully
      const mockServiceImportData = [{ clientId: mockClient.id, serviceTypeId: 'service-type-id', serviceCode: 'service-code', serviceDate: '2024-01-01', units: 1, rate: 50, programId: mockProgram.id }] as any;
      const mockImportResult = { totalProcessed: 1, successCount: 1, errorCount: 0, errors: [], processedServices: [mockService.id] } as any;
      mockServiceModel.importServices.mockResolvedValue(mockImportResult);
      mockNotificationService.sendServiceNotification.mockResolvedValue(undefined);

      const result = await servicesService.importServices(mockServiceImportData);

      expect(result).toEqual(mockImportResult);
      expect(mockServiceModel.importServices).toHaveBeenCalledWith(mockServiceImportData, null);
      expect(mockNotificationService.sendServiceNotification).toHaveBeenCalled();
    });

    test('should handle import with some errors', async () => {
      // Test that importServices handles import with some errors
      const mockServiceImportData = [{ clientId: mockClient.id, serviceTypeId: 'service-type-id', serviceCode: 'service-code', serviceDate: '2024-01-01', units: 1, rate: 50, programId: mockProgram.id }] as any;
      const mockImportResult = { totalProcessed: 1, successCount: 0, errorCount: 1, errors: [{ index: 0, message: 'Import failed' }], processedServices: [] } as any;
      mockServiceModel.importServices.mockResolvedValue(mockImportResult);
      mockNotificationService.sendServiceNotification.mockResolvedValue(undefined);

      const result = await servicesService.importServices(mockServiceImportData);

      expect(result).toEqual(mockImportResult);
      expect(mockServiceModel.importServices).toHaveBeenCalledWith(mockServiceImportData, null);
      expect(mockNotificationService.sendServiceNotification).toHaveBeenCalled();
    });
  });

  describe('isBillingStatusTransitionAllowed', () => {
    // Test suite for the isBillingStatusTransitionAllowed method

    test('should return true for allowed transitions', () => {
      // Test that isBillingStatusTransitionAllowed returns true for allowed transitions
      const allowedTransitions = [
        { current: BillingStatus.UNBILLED, new: BillingStatus.READY_FOR_BILLING },
        { current: BillingStatus.READY_FOR_BILLING, new: BillingStatus.IN_CLAIM },
        { current: BillingStatus.IN_CLAIM, new: BillingStatus.BILLED },
        { current: BillingStatus.BILLED, new: BillingStatus.PAID },
        { current: BillingStatus.DENIED, new: BillingStatus.READY_FOR_BILLING },
        { current: BillingStatus.PAID, new: BillingStatus.VOID },
      ];

      allowedTransitions.forEach(({ current, new: newStatus }) => {
        const result = servicesService.isBillingStatusTransitionAllowed(current, newStatus);
        expect(result).toBe(true);
      });
    });

    test('should return false for disallowed transitions', () => {
      // Test that isBillingStatusTransitionAllowed returns false for disallowed transitions
      const disallowedTransitions = [
        { current: BillingStatus.BILLED, new: BillingStatus.UNBILLED },
        { current: BillingStatus.PAID, new: BillingStatus.READY_FOR_BILLING },
        { current: BillingStatus.VOID, new: BillingStatus.BILLED },
      ];

      disallowedTransitions.forEach(({ current, new: newStatus }) => {
        const result = servicesService.isBillingStatusTransitionAllowed(current, newStatus);
        expect(result).toBe(false);
      });
    });
  });
});