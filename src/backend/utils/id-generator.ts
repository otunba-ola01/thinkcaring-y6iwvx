/**
 * Utility module for generating unique identifiers for various entities in the HCBS Revenue Management System.
 * 
 * This module provides functions to create secure, non-guessable IDs with different formats and
 * prefixes based on entity types. These IDs are used throughout the application for database records
 * and external references.
 */

import { v4 as uuidv4, validate as validateUuid } from 'uuid'; // uuid ^9.0.0
import { nanoid } from 'nanoid'; // nanoid ^4.0.2
import { generateSecureHexToken } from './crypto';
import { logger } from './logger';

// Default length for generated IDs
export const DEFAULT_ID_LENGTH = 16;

// Entity type to prefix mapping
export const ENTITY_PREFIXES = {
  client: 'CLT',
  claim: 'CLM',
  service: 'SVC',
  payment: 'PMT',
  authorization: 'AUTH',
  report: 'RPT',
  document: 'DOC',
  user: 'USR',
  facility: 'FAC',
  program: 'PRG',
  payer: 'PAY'
};

/**
 * Generates a standard UUID v4
 * 
 * @returns A UUID v4 string
 */
export function generateUUID(): string {
  return uuidv4();
}

/**
 * Validates if a string is a valid UUID
 * 
 * @param id - String to validate
 * @returns True if the string is a valid UUID, false otherwise
 */
export function isValidUUID(id: string): boolean {
  return validateUuid(id);
}

/**
 * Generates a compact, URL-friendly unique identifier
 * 
 * @param length - Length of the ID (default: DEFAULT_ID_LENGTH)
 * @returns A nanoid string of the specified length
 */
export function generateNanoId(length: number = DEFAULT_ID_LENGTH): string {
  return nanoid(length);
}

/**
 * Generates a prefixed unique identifier for a specific entity type
 * 
 * @param entityType - Type of entity (client, claim, service, etc.)
 * @param length - Length of the random part of the ID (default: DEFAULT_ID_LENGTH)
 * @returns A prefixed unique identifier for the entity
 */
export function generateEntityId(entityType: string, length: number = DEFAULT_ID_LENGTH): string {
  let prefix = ENTITY_PREFIXES[entityType as keyof typeof ENTITY_PREFIXES];
  
  if (!prefix) {
    logger.warn(`Unknown entity type: ${entityType}, using generic prefix`, { entityType });
    prefix = 'ENT';
  }
  
  const randomId = generateSecureHexToken(length);
  logger.debug(`Generated entity ID for ${entityType}`, { prefix, length });
  
  return `${prefix}-${randomId}`;
}

/**
 * Generates a formatted claim number for external reference
 * 
 * @param prefix - Custom prefix for the claim number (default: 'C')
 * @returns A formatted claim number
 */
export function generateClaimNumber(prefix: string = 'C'): string {
  const now = new Date();
  const year = now.getFullYear().toString();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  
  // Generate a 6-digit random number for uniqueness
  const random = generateSecureHexToken(3).substring(0, 6);
  
  const claimNumber = `${prefix}${year}${month}${day}-${random}`;
  logger.debug(`Generated claim number`, { claimNumber });
  
  return claimNumber;
}

/**
 * Generates a formatted authorization number
 * 
 * @param prefix - Custom prefix for the authorization number (default: 'AUTH')
 * @returns A formatted authorization number
 */
export function generateAuthorizationNumber(prefix: string = 'AUTH'): string {
  const year = new Date().getFullYear().toString();
  
  // Generate a 6-digit random number for uniqueness
  const random = generateSecureHexToken(3).substring(0, 6);
  
  const authNumber = `${prefix}${year}-${random}`;
  logger.debug(`Generated authorization number`, { authNumber });
  
  return authNumber;
}

/**
 * Generates a payment reference number
 * 
 * @param prefix - Custom prefix for the payment reference (default: 'PMT')
 * @returns A formatted payment reference number
 */
export function generatePaymentReferenceNumber(prefix: string = 'PMT'): string {
  const now = new Date();
  const year = now.getFullYear().toString();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  
  // Generate an 8-digit random number for uniqueness
  const random = generateSecureHexToken(4).substring(0, 8);
  
  const paymentRef = `${prefix}${year}${month}${day}-${random}`;
  logger.debug(`Generated payment reference`, { paymentRef });
  
  return paymentRef;
}

/**
 * Generates a unique document identifier
 * 
 * @param documentType - Type of document (default: 'DOC')
 * @returns A unique document identifier
 */
export function generateDocumentId(documentType: string = 'DOC'): string {
  const timestamp = Date.now().toString();
  const random = generateSecureHexToken(4);
  
  const documentId = `${documentType}-${timestamp}-${random}`;
  logger.debug(`Generated document ID`, { documentId, documentType });
  
  return documentId;
}

/**
 * Extracts the entity type from a prefixed entity ID
 * 
 * @param id - Prefixed entity ID
 * @returns The entity type or null if not recognized
 */
export function extractEntityTypeFromId(id: string): string | null {
  try {
    // Extract prefix from ID (characters before the first hyphen)
    const parts = id.split('-');
    if (parts.length < 2) {
      logger.error(`Invalid entity ID format: ${id}`);
      return null;
    }
    
    const prefix = parts[0];
    
    // Find entity type by prefix
    for (const [type, typePrefix] of Object.entries(ENTITY_PREFIXES)) {
      if (typePrefix === prefix) {
        return type;
      }
    }
    
    logger.debug(`Unknown entity prefix: ${prefix}`, { id });
    return null;
  } catch (error) {
    logger.error(`Error extracting entity type from ID: ${id}`, { error });
    return null;
  }
}

/**
 * Validates if a string is a valid entity ID with the correct prefix
 * 
 * @param id - ID to validate
 * @param entityType - Expected entity type
 * @returns True if the ID is valid for the entity type, false otherwise
 */
export function isValidEntityId(id: string, entityType: string): boolean {
  try {
    const expectedPrefix = ENTITY_PREFIXES[entityType as keyof typeof ENTITY_PREFIXES];
    
    if (!expectedPrefix) {
      logger.warn(`Unknown entity type in validation: ${entityType}`);
      return false;
    }
    
    // Check if ID starts with the expected prefix
    if (!id.startsWith(`${expectedPrefix}-`)) {
      return false;
    }
    
    // Validate format: prefix-randomId
    const parts = id.split('-');
    return parts.length === 2 && parts[0] === expectedPrefix && parts[1].length > 0;
  } catch (error) {
    logger.error(`Error validating entity ID: ${id}`, { error, entityType });
    return false;
  }
}