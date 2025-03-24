import { debug } from '../utils/logger';
import { maskingPatterns } from '../config/logger.config';
import { UUID } from '../types/common.types';

// Import from external modules
import clone from 'lodash'; // lodash ^4.17.21

/**
 * Enum defining different levels of data masking
 */
export enum MaskingLevel {
  NONE = 'none',     // No masking applied
  PARTIAL = 'partial', // Partial masking (show part of the data)
  FULL = 'full'      // Full masking (completely hide the data)
}

/**
 * Interface for configuring masking behavior
 */
export interface MaskingOptions {
  level: MaskingLevel;           // Level of masking to apply
  preserveLength?: boolean;      // Whether to preserve the original string length
  maskChar?: string;             // Character to use for masking
  exceptions?: string[];         // Fields to exempt from masking
}

/**
 * Default masking options
 */
export const DEFAULT_MASKING_OPTIONS: MaskingOptions = {
  level: MaskingLevel.PARTIAL,
  preserveLength: false,
  maskChar: 'X',
  exceptions: []
};

/**
 * Masks sensitive data in an object based on predefined patterns
 * @param data Any data object to mask
 * @param options Masking options to apply
 * @returns Cloned object with sensitive data masked
 */
export function maskData(data: any, options: MaskingOptions = DEFAULT_MASKING_OPTIONS): any {
  // Create a deep clone to avoid modifying the original
  const clonedData = clone(data);
  
  // Return early if data is null or undefined
  if (clonedData === null || clonedData === undefined) {
    return clonedData;
  }
  
  // If data is a primitive type (string, number, boolean), apply direct masking if applicable
  if (typeof clonedData !== 'object') {
    if (typeof clonedData === 'string') {
      // If masking level is FULL, completely mask the string
      if (options.level === MaskingLevel.FULL) {
        return options.preserveLength 
          ? clonedData.replace(/./g, options.maskChar || 'X') 
          : '[REDACTED]';
      }
      
      // For PARTIAL masking, detect and mask sensitive patterns
      let result = clonedData;
      
      // Check for specific data patterns and apply appropriate masking
      if (/^\d{3}-\d{2}-\d{4}$/.test(result)) {
        return maskSSN(result);
      } else if (/^\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}$/.test(result)) {
        return maskCreditCard(result);
      } else if (/^\d{4}-\d{2}-\d{2}$/.test(result) || /^\d{2}\/\d{2}\/\d{4}$/.test(result)) {
        return maskDateOfBirth(result);
      } else if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result)) {
        return maskEmail(result);
      } else if (/^\(\d{3}\) \d{3}-\d{4}$/.test(result) || /^\d{3}-\d{3}-\d{4}$/.test(result)) {
        return maskPhone(result);
      }
      
      // Apply configured masking patterns from global config
      for (const pattern of maskingPatterns) {
        result = result.replace(pattern.regex, pattern.replacement);
      }
      
      return result;
    }
    
    // Non-string primitives can't contain PII, return as is
    return clonedData;
  }
  
  // Handle arrays
  if (Array.isArray(clonedData)) {
    return clonedData.map(item => maskData(item, options));
  }
  
  // Handle objects (recursively)
  const result = { ...clonedData };
  for (const key in result) {
    if (Object.prototype.hasOwnProperty.call(result, key)) {
      // Skip masking for exceptions
      if (options.exceptions && options.exceptions.includes(key)) {
        continue;
      }
      
      // Apply specific masking based on field names
      if (typeof result[key] === 'string') {
        if (key.toLowerCase().includes('ssn') || key.toLowerCase() === 'socialsecuritynumber') {
          result[key] = maskSSN(result[key]);
        } else if (key.toLowerCase().includes('creditcard') || key.toLowerCase().includes('cardnumber')) {
          result[key] = maskCreditCard(result[key]);
        } else if (key.toLowerCase().includes('dob') || key.toLowerCase().includes('dateofbirth') || key.toLowerCase().includes('birthdate')) {
          result[key] = maskDateOfBirth(result[key]);
        } else if (key.toLowerCase().includes('email')) {
          result[key] = maskEmail(result[key]);
        } else if (key.toLowerCase().includes('phone') || key.toLowerCase().includes('phonenumber') || key.toLowerCase().includes('telephone')) {
          result[key] = maskPhone(result[key]);
        } else if (key.toLowerCase().includes('address')) {
          if (typeof result[key] === 'object') {
            result[key] = maskAddress(result[key]);
          } else {
            // If address is a string, apply generic masking
            result[key] = options.level === MaskingLevel.FULL 
              ? '[REDACTED]' 
              : result[key].replace(/([^,]+),(.+)/, 'XXXXX,$2'); // Keep city, state
          }
        } else {
          // Apply generic masking patterns for other string fields
          let maskedValue = result[key];
          for (const pattern of maskingPatterns) {
            maskedValue = maskedValue.replace(pattern.regex, pattern.replacement);
          }
          result[key] = maskedValue;
        }
      } else if (typeof result[key] === 'object' && result[key] !== null) {
        // Recursively mask nested objects
        result[key] = maskData(result[key], options);
      }
    }
  }
  
  debug('Masked data applied', { 
    maskedFields: Object.keys(result).length,
    maskingLevel: options.level 
  });
  
  return result;
}

/**
 * Masks specific fields in an object based on field names and types
 * @param data Object containing data to be masked
 * @param fields Array of field names to mask
 * @param options Masking options to apply
 * @returns Object with specified fields masked
 */
export function maskSensitiveFields(data: object, fields: string[], options: MaskingOptions = DEFAULT_MASKING_OPTIONS): object {
  // Create a deep clone to avoid modifying the original
  const clonedData = clone(data);
  
  // Return early if data is null or undefined
  if (!clonedData) {
    return clonedData;
  }
  
  // Process each field to be masked
  fields.forEach(field => {
    // Handle nested fields with dot notation (e.g., 'user.contact.phone')
    const parts = field.split('.');
    
    if (parts.length === 1) {
      // Direct field access
      if (Object.prototype.hasOwnProperty.call(clonedData, field)) {
        const value = clonedData[field];
        
        // For full masking, replace with [REDACTED] or mask chars
        if (options.level === MaskingLevel.FULL) {
          if (typeof value === 'string') {
            clonedData[field] = options.preserveLength 
              ? value.replace(/./g, options.maskChar || 'X') 
              : '[REDACTED]';
          }
          return;
        }
        
        // For partial masking, use specific functions based on field name
        if (field.toLowerCase().includes('ssn') || field.toLowerCase() === 'socialsecuritynumber') {
          clonedData[field] = maskSSN(value);
        } else if (field.toLowerCase().includes('creditcard') || field.toLowerCase().includes('cardnumber')) {
          clonedData[field] = maskCreditCard(value);
        } else if (field.toLowerCase().includes('dob') || field.toLowerCase().includes('dateofbirth') || field.toLowerCase().includes('birthdate')) {
          clonedData[field] = maskDateOfBirth(value);
        } else if (field.toLowerCase().includes('email')) {
          clonedData[field] = maskEmail(value);
        } else if (field.toLowerCase().includes('phone') || field.toLowerCase().includes('phonenumber') || field.toLowerCase().includes('telephone')) {
          clonedData[field] = maskPhone(value);
        } else if (field.toLowerCase().includes('address')) {
          clonedData[field] = maskAddress(value);
        } else if (typeof value === 'string') {
          // Generic masking for other string fields
          let maskedValue = value;
          for (const pattern of maskingPatterns) {
            maskedValue = maskedValue.replace(pattern.regex, pattern.replacement);
          }
          clonedData[field] = maskedValue;
        }
      }
    } else {
      // Handle nested fields (recursively)
      let current = clonedData;
      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (!current[part] || typeof current[part] !== 'object') {
          break; // Path doesn't exist or isn't an object
        }
        current = current[part];
      }
      
      const lastPart = parts[parts.length - 1];
      if (current && Object.prototype.hasOwnProperty.call(current, lastPart)) {
        const value = current[lastPart];
        
        // For full masking, replace with [REDACTED] or mask chars
        if (options.level === MaskingLevel.FULL) {
          if (typeof value === 'string') {
            current[lastPart] = options.preserveLength 
              ? value.replace(/./g, options.maskChar || 'X') 
              : '[REDACTED]';
          }
          return;
        }
        
        // For partial masking, use specific functions based on field name
        if (lastPart.toLowerCase().includes('ssn') || lastPart.toLowerCase() === 'socialsecuritynumber') {
          current[lastPart] = maskSSN(value);
        } else if (lastPart.toLowerCase().includes('creditcard') || lastPart.toLowerCase().includes('cardnumber')) {
          current[lastPart] = maskCreditCard(value);
        } else if (lastPart.toLowerCase().includes('dob') || lastPart.toLowerCase().includes('dateofbirth') || lastPart.toLowerCase().includes('birthdate')) {
          current[lastPart] = maskDateOfBirth(value);
        } else if (lastPart.toLowerCase().includes('email')) {
          current[lastPart] = maskEmail(value);
        } else if (lastPart.toLowerCase().includes('phone') || lastPart.toLowerCase().includes('phonenumber') || lastPart.toLowerCase().includes('telephone')) {
          current[lastPart] = maskPhone(value);
        } else if (lastPart.toLowerCase().includes('address')) {
          current[lastPart] = maskAddress(value);
        } else if (typeof value === 'string') {
          // Generic masking for other string fields
          let maskedValue = value;
          for (const pattern of maskingPatterns) {
            maskedValue = maskedValue.replace(pattern.regex, pattern.replacement);
          }
          current[lastPart] = maskedValue;
        }
      }
    }
  });
  
  return clonedData;
}

/**
 * Masks Social Security Numbers showing only the last 4 digits
 * @param ssn Social Security Number to mask
 * @returns Masked SSN (e.g., XXX-XX-1234)
 */
export function maskSSN(ssn: string): string {
  if (!ssn || typeof ssn !== 'string') {
    return ssn;
  }
  
  // Handle formatted and unformatted SSNs
  let cleanSSN = ssn.replace(/[- ]/g, '');
  
  // Validate that we have a 9-digit number
  if (!/^\d{9}$/.test(cleanSSN)) {
    return ssn; // Return original if not valid SSN format
  }
  
  // Get the last 4 digits
  const last4 = cleanSSN.slice(-4);
  
  // Return masked SSN in XXX-XX-1234 format
  return `XXX-XX-${last4}`;
}

/**
 * Masks credit card numbers showing only the last 4 digits
 * @param cardNumber Credit card number to mask
 * @returns Masked credit card number (e.g., XXXX-XXXX-XXXX-1234)
 */
export function maskCreditCard(cardNumber: string): string {
  if (!cardNumber || typeof cardNumber !== 'string') {
    return cardNumber;
  }
  
  // Handle formatted and unformatted card numbers
  let cleanCard = cardNumber.replace(/[- ]/g, '');
  
  // Validate that we have at least 13 digits (min for valid card numbers)
  if (!/^\d{13,19}$/.test(cleanCard)) {
    return cardNumber; // Return original if not valid card format
  }
  
  // Get the last 4 digits
  const last4 = cleanCard.slice(-4);
  
  // Format with dashes for readability
  if (cleanCard.length === 16) {
    return `XXXX-XXXX-XXXX-${last4}`;
  } else {
    // For non-standard lengths, just show the last 4
    return `${'X'.repeat(cleanCard.length - 4)}${last4}`;
  }
}

/**
 * Masks date of birth showing only the year
 * @param dob Date of birth to mask
 * @returns Masked date of birth (e.g., XXXX-XX-XX)
 */
export function maskDateOfBirth(dob: string): string {
  if (!dob || typeof dob !== 'string') {
    return dob;
  }
  
  // Handle ISO format (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
    const year = dob.slice(0, 4);
    return `${year}-XX-XX`;
  }
  
  // Handle US format (MM/DD/YYYY)
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dob)) {
    const year = dob.slice(-4);
    return `XX/XX/${year}`;
  }
  
  // Handle other formats - just mask the entire string
  return 'XXXX-XX-XX';
}

/**
 * Masks address showing only city and state
 * @param address Address object to mask
 * @returns Masked address object
 */
export function maskAddress(address: any): any {
  if (!address) {
    return address;
  }
  
  // Handle string addresses
  if (typeof address === 'string') {
    // Attempt to keep only city and state
    return address.replace(/([^,]+),(.+)/, 'XXXXX,$2');
  }
  
  // For non-objects, return as is
  if (typeof address !== 'object') {
    return address;
  }
  
  const maskedAddress = clone(address);
  
  // Mask street address lines
  if (maskedAddress.street1) {
    maskedAddress.street1 = 'XXXXX';
  }
  
  if (maskedAddress.street2) {
    maskedAddress.street2 = 'XXXXX';
  }
  
  // Keep city and state visible
  // No changes to city and state
  
  // Mask zip code except for first 3 digits
  if (maskedAddress.zipCode && typeof maskedAddress.zipCode === 'string') {
    const firstThree = maskedAddress.zipCode.slice(0, 3);
    maskedAddress.zipCode = `${firstThree}XX`;
  }
  
  return maskedAddress;
}

/**
 * Masks email address showing only domain and first character of local part
 * @param email Email address to mask
 * @returns Masked email (e.g., j***@example.com)
 */
export function maskEmail(email: string): string {
  if (!email || typeof email !== 'string') {
    return email;
  }
  
  // Validate email format
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return email; // Return original if not valid email format
  }
  
  const [localPart, domain] = email.split('@');
  
  // Show only the first character of the local part
  const firstChar = localPart.charAt(0);
  const maskedLocal = `${firstChar}${'*'.repeat(Math.max(localPart.length - 1, 3))}`;
  
  return `${maskedLocal}@${domain}`;
}

/**
 * Masks phone number showing only last 4 digits
 * @param phone Phone number to mask
 * @returns Masked phone number (e.g., (XXX) XXX-1234)
 */
export function maskPhone(phone: string): string {
  if (!phone || typeof phone !== 'string') {
    return phone;
  }
  
  // Handle formatted and unformatted phone numbers
  let cleanPhone = phone.replace(/[().\-\s]/g, '');
  
  // Validate phone number format (allow for country codes)
  if (!/^\+?\d{10,15}$/.test(cleanPhone)) {
    return phone; // Return original if not valid phone format
  }
  
  // Get the last 4 digits
  const last4 = cleanPhone.slice(-4);
  
  // Return in standard US format, regardless of input format
  return `(XXX) XXX-${last4}`;
}

/**
 * Masks various types of identifiers based on their format
 * @param identifier Identifier to mask
 * @param type Optional type of identifier to guide masking
 * @returns Masked identifier appropriate to its type
 */
export function maskIdentifier(identifier: string, type?: string): string {
  if (!identifier || typeof identifier !== 'string') {
    return identifier;
  }
  
  // Determine the identifier type if not provided
  if (!type) {
    // Detect type based on format
    if (/^\d{3}-\d{2}-\d{4}$/.test(identifier) || /^\d{9}$/.test(identifier)) {
      type = 'ssn';
    } else if (/^\d{13,19}$/.test(identifier) || /^(\d{4}[- ]){3}\d{4}$/.test(identifier)) {
      type = 'credit_card';
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(identifier) || /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(identifier)) {
      type = 'date_of_birth';
    } else if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)) {
      type = 'email';
    } else if (/^\+?\d{10,15}$/.test(identifier) || /^\(\d{3}\) \d{3}-\d{4}$/.test(identifier) || /^\d{3}-\d{3}-\d{4}$/.test(identifier)) {
      type = 'phone';
    }
  }
  
  // Apply the appropriate masking function based on identifier type
  switch (type) {
    case 'ssn':
      return maskSSN(identifier);
    case 'credit_card':
      return maskCreditCard(identifier);
    case 'date_of_birth':
      return maskDateOfBirth(identifier);
    case 'email':
      return maskEmail(identifier);
    case 'phone':
      return maskPhone(identifier);
    default:
      // For unknown formats, use generic masking
      // Show first two and last two characters, mask the rest
      return identifier.slice(0, 2) + 'X'.repeat(Math.max(identifier.length - 4, 1)) + 
             (identifier.length > 2 ? identifier.slice(-2) : '');
  }
}

/**
 * Applies masking based on user role and permissions
 * @param data Data object to mask
 * @param userId User ID for owner-based masking exceptions
 * @param userRoles Array of user role names
 * @param options Masking options to apply
 * @returns Data with role-appropriate masking applied
 */
export function applyRoleBasedMasking(
  data: object, 
  userId: UUID, 
  userRoles: string[], 
  options: MaskingOptions = DEFAULT_MASKING_OPTIONS
): object {
  // Determine masking level based on user roles
  let maskingLevel = MaskingLevel.FULL; // Default to full masking
  
  // Check for admin role (no masking)
  if (userRoles.includes('administrator') || userRoles.includes('admin')) {
    maskingLevel = MaskingLevel.NONE;
  }
  // Check for financial manager (partial masking)
  else if (userRoles.includes('financial_manager')) {
    maskingLevel = MaskingLevel.PARTIAL;
  }
  // Check for billing specialist (partial masking)
  else if (userRoles.includes('billing_specialist')) {
    maskingLevel = MaskingLevel.PARTIAL;
  }
  
  // Create options with determined masking level
  const roleOptions: MaskingOptions = {
    ...options,
    level: maskingLevel
  };
  
  // Special handling for owner of the data
  const clonedData = clone(data);
  
  // Handle special cases like data owners (e.g., patients viewing their own data)
  if (clonedData['userId'] === userId || clonedData['createdBy'] === userId || clonedData['ownerId'] === userId) {
    // The user is viewing their own data, use less restrictive masking
    roleOptions.level = Math.min(
      roleOptions.level === MaskingLevel.FULL ? MaskingLevel.PARTIAL : roleOptions.level, 
      MaskingLevel.PARTIAL
    );
  }
  
  // If no masking needed, return the cloned data
  if (roleOptions.level === MaskingLevel.NONE) {
    return clonedData;
  }
  
  // Apply appropriate masking based on masking level
  if (roleOptions.level === MaskingLevel.PARTIAL) {
    // Determine fields to mask based on partial masking rules
    const fieldsToMask = [
      'ssn', 
      'socialSecurityNumber',
      'creditCard', 
      'cardNumber',
      'dateOfBirth',
      'birthdate',
      'dob',
      'address.street1',
      'address.street2',
      'street1',
      'street2',
      'email',
      'emailAddress',
      'phone',
      'phoneNumber',
      'mobilePhone',
      'medicaid_id',
      'medicaidId',
      'medicare_id',
      'medicareId'
    ];
    
    return maskSensitiveFields(clonedData, fieldsToMask, roleOptions);
  }
  
  // For full masking, mask all sensitive data
  return maskData(clonedData, roleOptions);
}

/**
 * Detects potential sensitive data in an object based on patterns
 * @param data Object to scan for sensitive data
 * @returns Report of detected sensitive data fields
 */
export function detectSensitiveData(data: object): object {
  const result = {
    hasSensitiveData: false,
    detectedFields: [],
    fieldTypes: {}
  };
  
  // Return early if data is null or undefined
  if (!data) {
    return result;
  }
  
  // Helper function to scan object recursively
  const scanObject = (obj: any, path = '') => {
    if (!obj || typeof obj !== 'object') {
      return;
    }
    
    // Handle arrays
    if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        scanObject(item, path ? `${path}[${index}]` : `[${index}]`);
      });
      return;
    }
    
    // Scan each property
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = obj[key];
        const currentPath = path ? `${path}.${key}` : key;
        
        // Check if the key name indicates sensitive data
        const sensitiveKeyPatterns = [
          /ssn/i, /social.*security/i, /tax.*id/i,
          /credit.*card/i, /card.*number/i, /cvv/i, /cvc/i,
          /birth.*date/i, /dob/i, 
          /email/i, 
          /phone/i, /mobile/i, /telephone/i,
          /address/i, /street/i,
          /password/i, /secret/i, /token/i,
          /medicaid.*id/i, /medicare.*id/i,
          /diagnosis/i, /condition/i, /treatment/i
        ];
        
        const isSensitiveKey = sensitiveKeyPatterns.some(pattern => pattern.test(key));
        
        // Check string values for patterns
        if (typeof value === 'string') {
          // Check for SSN pattern
          if (/^\d{3}-\d{2}-\d{4}$/.test(value) || /^\d{9}$/.test(value)) {
            result.hasSensitiveData = true;
            result.detectedFields.push(currentPath);
            result.fieldTypes[currentPath] = 'SSN';
          }
          // Check for credit card pattern
          else if (/^\d{13,19}$/.test(value) || /^(\d{4}[- ]){3}\d{4}$/.test(value)) {
            result.hasSensitiveData = true;
            result.detectedFields.push(currentPath);
            result.fieldTypes[currentPath] = 'Credit Card';
          }
          // Check for date of birth pattern
          else if (/^\d{4}-\d{2}-\d{2}$/.test(value) || /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(value)) {
            // Only flag if the key name suggests it's a birth date
            if (isSensitiveKey) {
              result.hasSensitiveData = true;
              result.detectedFields.push(currentPath);
              result.fieldTypes[currentPath] = 'Date of Birth';
            }
          }
          // Check for email pattern
          else if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            result.hasSensitiveData = true;
            result.detectedFields.push(currentPath);
            result.fieldTypes[currentPath] = 'Email';
          }
          // Check for phone pattern
          else if (/^\+?\d{10,15}$/.test(value) || /^\(\d{3}\) \d{3}-\d{4}$/.test(value) || /^\d{3}-\d{3}-\d{4}$/.test(value)) {
            result.hasSensitiveData = true;
            result.detectedFields.push(currentPath);
            result.fieldTypes[currentPath] = 'Phone';
          }
          // Flag sensitive key names even if the pattern isn't recognized
          else if (isSensitiveKey) {
            result.hasSensitiveData = true;
            result.detectedFields.push(currentPath);
            result.fieldTypes[currentPath] = 'Potential Sensitive Data';
          }
        }
        // Recursively scan nested objects
        else if (value !== null && typeof value === 'object') {
          scanObject(value, currentPath);
        }
      }
    }
  };
  
  // Start the scan
  scanObject(data);
  
  return result;
}