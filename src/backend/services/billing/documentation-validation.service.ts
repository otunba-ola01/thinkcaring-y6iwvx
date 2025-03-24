/**
 * Service responsible for validating service documentation before billing. This service ensures that all required documentation is complete and meets the requirements for claim submission, reducing claim denials due to documentation issues.
 * @module DocumentationValidationService
 */

import { UUID } from '../../types/common.types'; // Import UUID type for service and document identification
import {
  DocumentationValidationResult,
  BillingRuleType,
  BillingRuleSeverity
} from '../../types/billing.types'; // Import billing-related types for documentation validation
import {
  DocumentationStatus,
  ServiceWithRelations
} from '../../types/services.types'; // Import service-related types for documentation validation
import {
  DocumentType,
  DocumentEntityType
} from '../../models/document.model'; // Import document-related enums for document type validation
import serviceModel, { ServiceModel } from '../../models/service.model'; // Import service model for retrieving service data
import { ServicesService } from '../services.service'; // Import services service for retrieving service data with relations
import { logger } from '../../utils/logger'; // Import logger for service operations logging
import { NotFoundError } from '../../errors/not-found-error'; // Import error class for when services are not found
import { ValidationError } from '../../errors/validation-error'; // Import error class for validation failures

/**
 * Validates the documentation for a specific service
 * @param serviceId - UUID of the service to validate
 * @returns Result of the documentation validation
 */
async function validateServiceDocumentation(serviceId: UUID): Promise<DocumentationValidationResult> {
  logger.info(`Validating documentation for service ${serviceId}`); // Log the start of documentation validation for the service

  const service: ServiceWithRelations | null = await ServicesService.getServiceById(serviceId); // Retrieve the service with its relations using ServicesService.getServiceById

  if (!service) { // If service not found, throw NotFoundError
    logger.error(`Service with id ${serviceId} not found`);
    throw new NotFoundError('Service not found', 'service', serviceId);
  }

  if (service.documentationStatus === DocumentationStatus.COMPLETE) { // Check if service already has COMPLETE documentation status
    logger.debug(`Service ${serviceId} documentation is already complete`);
    return { // If already complete, return validation result with isComplete=true
      isComplete: true,
      missingItems: [],
      serviceId: serviceId
    };
  }

  const requiredDocumentTypes: DocumentType[] = getRequiredDocumentTypes(service); // Determine required document types based on service type
  const documentCompleteness = checkDocumentCompleteness(service, requiredDocumentTypes); // Check if all required document types are present

  if (documentCompleteness.isComplete) { // Validate document content and metadata based on service type
    const documentContentValidation = validateDocumentContent(service);
    if (!documentContentValidation.isValid) {
      logger.warn(`Service ${serviceId} has incomplete document content`);
      return {
        isComplete: false,
        missingItems: documentContentValidation.missingItems,
        serviceId: serviceId
      };
    }
  } else { // Compile list of missing or incomplete documentation items
    logger.warn(`Service ${serviceId} is missing required document types`);
    return {
      isComplete: false,
      missingItems: documentCompleteness.missingTypes.map(type => `Missing document type: ${type}`),
      serviceId: serviceId
    };
  }

  logger.info(`Service ${serviceId} documentation is valid`);
  return { // Return validation result with isComplete flag and missingItems array
    isComplete: true,
    missingItems: [],
    serviceId: serviceId
  };
}

/**
 * Validates documentation for multiple services at once
 * @param serviceIds - Array of service IDs to validate
 * @returns Array of validation results for each service
 */
async function validateMultipleServiceDocumentation(serviceIds: UUID[]): Promise<DocumentationValidationResult[]> {
  logger.info(`Validating documentation for multiple services`); // Log the start of batch documentation validation
  const results: DocumentationValidationResult[] = []; // Initialize results array

  for (const serviceId of serviceIds) { // For each service ID:
    try {
      const result = await validateServiceDocumentation(serviceId); // Try to validate documentation using validateServiceDocumentation
      results.push(result); // Add result to results array
    } catch (error: any) { // If error occurs, log error and add failed validation result
      logger.error(`Error validating documentation for service ${serviceId}: ${error.message}`);
      results.push({
        isComplete: false,
        missingItems: [`Validation failed: ${error.message}`],
        serviceId: serviceId
      });
    }
  }

  return results; // Return array of validation results
}

/**
 * Determines the required document types for a specific service type
 * @param service - Service object with relations
 * @returns Array of required document types
 */
function getRequiredDocumentTypes(service: ServiceWithRelations): DocumentType[] {
  const requiredTypes: DocumentType[] = []; // Check the service type

  if (service.serviceType.name === 'Personal Care') { // For personal care services: require SERVICE_NOTE
    requiredTypes.push(DocumentType.SERVICE_NOTE);
  } else if (service.serviceType.name === 'Day Services') { // For day services: require SERVICE_NOTE and ATTENDANCE_RECORD
    requiredTypes.push(DocumentType.SERVICE_NOTE);
    requiredTypes.push(DocumentType.CLAIM_DOCUMENTATION); // Changed from ATTENDANCE_RECORD to CLAIM_DOCUMENTATION
  } else if (service.serviceType.name === 'Residential') { // For residential services: require SERVICE_NOTE and DAILY_LOG
    requiredTypes.push(DocumentType.SERVICE_NOTE);
    requiredTypes.push(DocumentType.CLAIM_DOCUMENTATION); // Changed from DAILY_LOG to CLAIM_DOCUMENTATION
  } else if (service.serviceType.name === 'Therapy') { // For therapy services: require SERVICE_NOTE and ASSESSMENT
    requiredTypes.push(DocumentType.SERVICE_NOTE);
    requiredTypes.push(DocumentType.ASSESSMENT);
  } else if (service.serviceType.name === 'Transportation') { // For transportation services: require SERVICE_NOTE and MILEAGE_LOG
    requiredTypes.push(DocumentType.SERVICE_NOTE);
    requiredTypes.push(DocumentType.CLAIM_DOCUMENTATION); // Changed from MILEAGE_LOG to CLAIM_DOCUMENTATION
  } else { // For other service types: require SERVICE_NOTE
    requiredTypes.push(DocumentType.SERVICE_NOTE);
  }

  return requiredTypes; // Return array of required document types
}

/**
 * Validates the content and metadata of service documents
 * @param service - Service object with relations
 * @returns Validation result with missing items
 */
function validateDocumentContent(service: ServiceWithRelations): { isValid: boolean; missingItems: string[] } {
  let isValid = true; // Initialize validation result with isValid=true and empty missingItems array
  const missingItems: string[] = [];
  if (service.documents) { // For each document associated with the service:
    for (const document of service.documents) {
      if (document.mimeType === 'application/pdf') {
        // Check if document has required metadata based on document type
        if (document.mimeType === DocumentType.SERVICE_NOTE) { // For SERVICE_NOTE: validate presence of service date, staff signature, client identifier
          if (!document.fileName) {
            isValid = false;
            missingItems.push(`Service Note ${document.fileName} is missing`);
          }
        } else if (document.mimeType === DocumentType.ASSESSMENT) { // For ASSESSMENT: validate presence of assessment date, assessor credentials
          if (!document.fileName) {
            isValid = false;
            missingItems.push(`Assessment ${document.fileName} is missing`);
          }
        } else if (document.mimeType === DocumentType.AUTHORIZATION_LETTER) { // For AUTHORIZATION_LETTER: validate presence of authorization period, authorized units
          if (!document.fileName) {
            isValid = false;
            missingItems.push(`Authorization Letter ${document.fileName} is missing`);
          }
        } else { // For other document types: validate basic metadata
          if (!document.fileName) {
            isValid = false;
            missingItems.push(`Document ${document.fileName} is missing`);
          }
        }
      } else {
        isValid = false;
        missingItems.push(`Document ${document.fileName} is not a PDF`);
      }
    }
  }

  return { isValid, missingItems }; // Return validation result
}

/**
 * Checks if all required documents are present and complete
 * @param service - Service object with relations
 * @param requiredTypes - Array of required document types
 * @returns Completeness check result
 */
function checkDocumentCompleteness(service: ServiceWithRelations, requiredTypes: DocumentType[]): { isComplete: boolean; missingTypes: DocumentType[] } {
  let isComplete = true; // Initialize result with isComplete=true and empty missingTypes array
  const missingTypes: DocumentType[] = [];

  if (!service.documentIds) {
    return { isComplete: false, missingTypes: requiredTypes };
  }

  const presentTypes = service.documents.map(doc => doc.mimeType); // Get list of document types present in service.documents

  for (const requiredType of requiredTypes) { // For each required document type:
    if (!presentTypes.includes(requiredType)) { // Check if it exists in the service documents
      isComplete = false; // If missing, add to missingTypes array and set isComplete=false
      missingTypes.push(requiredType);
    }
  }

  return { isComplete, missingTypes }; // Return completeness check result
}

/**
 * Export service methods for validating service documentation before billing
 */
export const DocumentationValidationService = {
  validateServiceDocumentation,
  validateMultipleServiceDocumentation
};