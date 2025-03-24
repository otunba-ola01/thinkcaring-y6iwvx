/**
 * Service responsible for tracking and validating service authorizations in the billing workflow. This service ensures that services are properly authorized before billing, validates services against authorization limits, and tracks authorization utilization to prevent billing for unauthorized services.
 */

import { UUID } from '../../types/common.types'; // Import UUID type for service and authorization identification
import { AuthorizationValidationResult, BillingRuleType, BillingRuleSeverity } from '../../types/billing.types'; // Import billing-related types for authorization validation
import { ServiceWithRelations } from '../../types/services.types'; // Import service-related types for authorization validation
import { AuthorizationModel } from '../../models/authorization.model'; // Import authorization model for authorization-related operations
import { ServicesService } from '../services.service'; // Import services service for retrieving service data with relations
import { logger } from '../../utils/logger'; // Import logger for service operations logging
import { NotFoundError } from '../../errors/not-found-error'; // Import error class for when services or authorizations are not found
import { BusinessError } from '../../errors/business-error'; // Import error class for business rule violations

/**
 * Validates a service against its authorization requirements
 * @param serviceId - UUID of the service to validate
 * @returns {Promise<AuthorizationValidationResult>} Result of the authorization validation
 */
async function validateServiceAuthorization(serviceId: UUID): Promise<AuthorizationValidationResult> {
  logger.info(`Validating service authorization for service ID: ${serviceId}`);

  try {
    // 1. Retrieve the service with its relations using ServicesService.getServiceById
    const service: ServiceWithRelations | null = await ServicesService.getServiceById(serviceId);

    // 2. If service not found, throw NotFoundError
    if (!service) {
      logger.error(`Service with ID ${serviceId} not found.`);
      throw new NotFoundError('Service not found', 'service', serviceId);
    }

    // 3. Check if service has an associated authorizationId
    if (service.authorizationId) {
      logger.debug(`Service has explicit authorization ID: ${service.authorizationId}`);
      // 4. If authorizationId exists, validate service against authorization using AuthorizationModel.validateServiceAgainstAuthorization
      const validationResult = await AuthorizationModel.validateServiceAgainstAuthorization(
        {
          clientId: service.clientId,
          serviceTypeId: service.serviceTypeId,
          serviceDate: service.serviceDate,
          units: service.units,
        },
        service.authorizationId
      );

      logger.debug(`Authorization validation result for service ID ${serviceId}:`, validationResult);
      return {
        ...validationResult,
        serviceId: serviceId,
        authorizationId: service.authorizationId,
      };
    } else {
      logger.debug(`Service has no explicit authorization ID, attempting to find a matching authorization.`);
      // 5. If no authorizationId, attempt to find a matching authorization for the client and service type
      const matchingAuthId = await findMatchingAuthorization(service);

      if (matchingAuthId) {
        logger.debug(`Found matching authorization ID: ${matchingAuthId}`);
        // 6. If authorization found, validate service against authorization using AuthorizationModel.validateServiceAgainstAuthorization
        const validationResult = await AuthorizationModel.validateServiceAgainstAuthorization(
          {
            clientId: service.clientId,
            serviceTypeId: service.serviceTypeId,
            serviceDate: service.serviceDate,
            units: service.units,
          },
          matchingAuthId
        );

        logger.debug(`Authorization validation result for service ID ${serviceId} with matching auth ID ${matchingAuthId}:`, validationResult);
        return {
          ...validationResult,
          serviceId: serviceId,
          authorizationId: matchingAuthId,
        };
      } else {
        logger.warn(`No matching authorization found for service ID ${serviceId}.`);
        // 7. If no authorization found, return validation result with isAuthorized=false and appropriate error
        return {
          isAuthorized: false,
          authorizationId: null,
          serviceId: serviceId,
          errors: ['No authorization found for this service'],
          authorizedUnits: null,
          usedUnits: null,
          remainingUnits: null,
          expirationDate: null,
        };
      }
    }
  } catch (error) {
    logger.error(`Error validating service authorization for service ID ${serviceId}:`, error);
    throw error;
  }
}

/**
 * Validates multiple services against their authorization requirements
 * @param serviceIds - Array of service IDs to validate
 * @returns {Promise<AuthorizationValidationResult[]>} Array of validation results for each service
 */
async function validateMultipleServicesAuthorization(serviceIds: UUID[]): Promise<AuthorizationValidationResult[]> {
  logger.info(`Validating authorization for multiple services. Service IDs: ${serviceIds.join(', ')}`);
  const results: AuthorizationValidationResult[] = [];

  for (const serviceId of serviceIds) {
    try {
      const validationResult = await validateServiceAuthorization(serviceId);
      results.push(validationResult);
    } catch (error) {
      logger.error(`Error validating authorization for service ID ${serviceId}:`, error);
      results.push({
        isAuthorized: false,
        authorizationId: null,
        serviceId: serviceId,
        errors: [error.message],
        authorizedUnits: null,
        usedUnits: null,
        remainingUnits: null,
        expirationDate: null,
      });
    }
  }

  return results;
}

/**
 * Finds a matching authorization for a service without explicit authorization ID
 * @param service - Service object to find an authorization for
 * @returns {Promise<UUID | null>} Matching authorization ID or null if none found
 */
async function findMatchingAuthorization(service: ServiceWithRelations): Promise<UUID | null> {
  logger.debug(`Finding matching authorization for service ID: ${service.id}`);

  try {
    // 1. Extract client ID and service type ID from service
    const clientId = service.clientId;
    const serviceTypeId = service.serviceTypeId;

    // 2. Retrieve active authorizations for the client using AuthorizationModel.findActiveByClientId
    const activeAuthorizations = await AuthorizationModel.findActiveByClientId(clientId);

    // 3. Filter authorizations by service type
    const matchingAuthorizations = activeAuthorizations.filter(auth => auth.serviceTypes.some(st => st.id === serviceTypeId));

    // 4. Filter authorizations by date range (service date must be within authorization period)
    const serviceDate = new Date(service.serviceDate);
    const validAuthorizations = matchingAuthorizations.filter(auth => {
      const startDate = new Date(auth.startDate);
      const endDate = auth.endDate ? new Date(auth.endDate) : null;
      return serviceDate >= startDate && (!endDate || serviceDate <= endDate);
    });

    // 5. If multiple matching authorizations, select the one with the most remaining units
    let bestMatch = null;
    let maxRemainingUnits = -1;
    for (const auth of validAuthorizations) {
      if (auth.utilization.remainingUnits > maxRemainingUnits) {
        bestMatch = auth;
        maxRemainingUnits = auth.utilization.remainingUnits;
      }
    }

    // 6. Return the ID of the matching authorization or null if none found
    if (bestMatch) {
      logger.debug(`Found best matching authorization ID: ${bestMatch.id}`);
      return bestMatch.id;
    } else {
      logger.debug('No matching authorization found.');
      return null;
    }
  } catch (error) {
    logger.error(`Error finding matching authorization for service ID ${service.id}:`, error);
    throw error;
  }
}

/**
 * Tracks the utilization of an authorization when a service is billed
 * @param serviceId - UUID of the service being billed
 * @param isAddition - Boolean indicating whether units are being added (true) or removed (false)
 * @param userId - UUID of the user performing the action
 * @returns {Promise<{ authorizationId: UUID; remainingUnits: number; totalUnits: number }>} Updated authorization utilization information
 */
async function trackAuthorizationUtilization(serviceId: UUID, isAddition: boolean, userId: UUID | null = null): Promise<{ authorizationId: UUID; remainingUnits: number; totalUnits: number }> {
  logger.info(`Tracking authorization utilization for service ID ${serviceId}. Adding units: ${isAddition}`);

  try {
    // 1. Retrieve the service with its relations using ServicesService.getServiceById
    const service: ServiceWithRelations | null = await ServicesService.getServiceById(serviceId);

    // 2. If service not found, throw NotFoundError
    if (!service) {
      logger.error(`Service with ID ${serviceId} not found.`);
      throw new NotFoundError('Service not found', 'service', serviceId);
    }

    // 3. If service has no authorizationId, throw BusinessError
    if (!service.authorizationId) {
      logger.error(`Service with ID ${serviceId} has no authorization ID.`);
      throw new BusinessError('Service has no authorization ID', null, 'service.no_authorization');
    }

    // 4. Call AuthorizationModel.trackUtilization to update utilization
    const utilization = await AuthorizationModel.trackUtilization(service.authorizationId, service.units, isAddition, userId);

    logger.debug(`Authorization utilization updated for service ID ${serviceId}. Remaining units: ${utilization.remainingUnits}`);

    // 5. Return updated authorization utilization information
    return {
      authorizationId: service.authorizationId,
      remainingUnits: utilization.remainingUnits,
      totalUnits: service.units,
    };
  } catch (error) {
    logger.error(`Error tracking authorization utilization for service ID ${serviceId}:`, error);
    throw error;
  }
}

/**
 * Retrieves the current utilization for an authorization
 * @param authorizationId - UUID of the authorization
 * @returns {Promise<{ authorizedUnits: number; usedUnits: number; remainingUnits: number; utilizationPercentage: number }>} Authorization utilization details
 */
async function getAuthorizationUtilization(authorizationId: UUID): Promise<{ authorizedUnits: number; usedUnits: number; remainingUnits: number; utilizationPercentage: number }> {
  logger.info(`Retrieving authorization utilization for authorization ID ${authorizationId}.`);

  try {
    // 1. Call AuthorizationModel.getUtilization to retrieve utilization data
    const utilization = await AuthorizationModel.getUtilization(authorizationId);

    logger.debug(`Authorization utilization retrieved for authorization ID ${authorizationId}. Used units: ${utilization.usedUnits}`);

    // 2. Return authorization utilization details
    return utilization;
  } catch (error) {
    logger.error(`Error retrieving authorization utilization for authorization ID ${authorizationId}:`, error);
    throw error;
  }
}

/**
 * Checks if an authorization is expiring soon or has expired
 * @param authorizationId - UUID of the authorization
 * @param daysThreshold - Number of days to check for expiration
 * @returns {Promise<{ isExpiring: boolean; isExpired: boolean; daysRemaining: number | null; expirationDate: string | null }>} Authorization expiration status
 */
async function checkAuthorizationExpiration(authorizationId: UUID, daysThreshold: number): Promise<{ isExpiring: boolean; isExpired: boolean; daysRemaining: number | null; expirationDate: string | null }> {
  logger.info(`Checking authorization expiration for authorization ID ${authorizationId}. Days threshold: ${daysThreshold}`);

  try {
    // 1. Retrieve authorization using AuthorizationModel.findById
    const authorization = await AuthorizationModel.findById(authorizationId);

    // 2. If authorization not found, throw NotFoundError
    if (!authorization) {
      logger.error(`Authorization with ID ${authorizationId} not found.`);
      throw new NotFoundError('Authorization not found', 'authorization', authorizationId);
    }

    // 3. Calculate current date and expiration date
    const currentDate = new Date();
    const expirationDate = authorization.endDate ? new Date(authorization.endDate) : null;

    // 4. Calculate days remaining until expiration
    let daysRemaining: number | null = null;
    if (expirationDate) {
      const timeDiff = expirationDate.getTime() - currentDate.getTime();
      daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
    }

    // 5. Determine if authorization is expired (days remaining < 0)
    const isExpired = daysRemaining !== null && daysRemaining < 0;

    // 6. Determine if authorization is expiring soon (days remaining < daysThreshold)
    const isExpiring = daysRemaining !== null && daysRemaining <= daysThreshold && !isExpired;

    logger.debug(`Authorization expiration status for authorization ID ${authorizationId}. Is expiring: ${isExpiring}, is expired: ${isExpired}, days remaining: ${daysRemaining}`);

    // 7. Return expiration status with details
    return {
      isExpiring,
      isExpired,
      daysRemaining,
      expirationDate: authorization.endDate || null,
    };
  } catch (error) {
    logger.error(`Error checking authorization expiration for authorization ID ${authorizationId}:`, error);
    throw error;
  }
}

// Export the service object with all functions
export const AuthorizationTrackingService = {
  validateServiceAuthorization,
  validateMultipleServicesAuthorization,
  trackAuthorizationUtilization,
  getAuthorizationUtilization,
  checkAuthorizationExpiration
};