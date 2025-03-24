/**
 * Provides encryption and decryption functionality for sensitive data in the HCBS Revenue Management System.
 * Implements AES-256 encryption for data at rest and supports secure key management for HIPAA compliance.
 */

import * as crypto from 'crypto'; // Node.js built-in cryptography module
import * as fs from 'fs'; // File system access for key management
import * as path from 'path'; // Path manipulation for key file locations

import { logger } from '../utils/logger';
import { ApiError } from '../errors/api-error';
import { ErrorCode, ErrorCategory } from '../types/error.types';
import { generateSecureToken, generateSalt } from '../utils/crypto';
import { authConfig } from '../config/auth.config';

// Constants for encryption configuration
const DEFAULT_ALGORITHM = 'aes-256-gcm';
const DEFAULT_KEY_LENGTH = 32; // 256 bits
const DEFAULT_IV_LENGTH = 16; // 128 bits
const DEFAULT_TAG_LENGTH = 16; // 128 bits
const ENCODING = 'utf8';
const KEY_ENCODING = 'hex';

/**
 * Interface representing encrypted data with its initialization vector and authentication tag
 */
interface EncryptedData {
  content: string; // The encrypted content encoded as base64
  iv: string; // The initialization vector used for encryption, encoded as base64
  tag: string; // The authentication tag for verifying data integrity, encoded as base64
}

/**
 * Encrypts sensitive data using AES-256-GCM algorithm
 * 
 * @param data - The data to encrypt
 * @param key - The encryption key (hex encoded)
 * @param algorithm - The encryption algorithm to use (default: aes-256-gcm)
 * @returns Object containing encrypted data, initialization vector, and authentication tag
 * @throws ApiError if encryption fails
 */
export function encrypt(
  data: string,
  key: string,
  algorithm: string = DEFAULT_ALGORITHM
): EncryptedData {
  try {
    // Validate inputs
    if (!data) {
      throw new Error('Data to encrypt cannot be empty');
    }
    if (!key) {
      throw new Error('Encryption key cannot be empty');
    }

    // Generate a random initialization vector (IV)
    const iv = crypto.randomBytes(DEFAULT_IV_LENGTH);
    
    // Convert the key from hex to a Buffer
    const keyBuffer = Buffer.from(key, KEY_ENCODING);
    
    // Create a cipher using the specified algorithm, key, and IV
    const cipher = crypto.createCipheriv(algorithm, keyBuffer, iv);
    
    // Encrypt the data
    let encrypted = cipher.update(data, ENCODING, 'base64');
    encrypted += cipher.final('base64');
    
    // Get the authentication tag
    const tag = cipher.getAuthTag();
    
    // Return an object with the encrypted content, IV, and auth tag (all base64 encoded)
    return {
      content: encrypted,
      iv: iv.toString('base64'),
      tag: tag.toString('base64')
    };
  } catch (error) {
    logger.error('Encryption failed', { error, algorithm });
    throw new ApiError({
      message: 'Failed to encrypt data',
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      status: 500,
      category: ErrorCategory.SECURITY,
      cause: error instanceof Error ? error : new Error(String(error))
    });
  }
}

/**
 * Decrypts encrypted data using AES-256-GCM algorithm
 * 
 * @param encryptedData - Object containing encrypted content, IV, and auth tag
 * @param key - The encryption key (hex encoded)
 * @param algorithm - The encryption algorithm to use (default: aes-256-gcm)
 * @returns The decrypted data as a string
 * @throws ApiError if decryption fails
 */
export function decrypt(
  encryptedData: EncryptedData,
  key: string,
  algorithm: string = DEFAULT_ALGORITHM
): string {
  try {
    // Validate inputs
    if (!encryptedData || !encryptedData.content || !encryptedData.iv || !encryptedData.tag) {
      throw new Error('Encrypted data is incomplete or invalid');
    }
    if (!key) {
      throw new Error('Decryption key cannot be empty');
    }

    // Convert the key from hex to a Buffer
    const keyBuffer = Buffer.from(key, KEY_ENCODING);
    
    // Convert the IV and tag from base64 to Buffer
    const iv = Buffer.from(encryptedData.iv, 'base64');
    const tag = Buffer.from(encryptedData.tag, 'base64');
    
    // Create a decipher using the specified algorithm, key, and IV
    const decipher = crypto.createDecipheriv(algorithm, keyBuffer, iv);
    
    // Set the authentication tag
    decipher.setAuthTag(tag);
    
    // Decrypt the data
    let decrypted = decipher.update(encryptedData.content, 'base64', ENCODING);
    decrypted += decipher.final(ENCODING);
    
    return decrypted;
  } catch (error) {
    logger.error('Decryption failed', { error, algorithm });
    throw new ApiError({
      message: 'Failed to decrypt data',
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      status: 500,
      category: ErrorCategory.SECURITY,
      cause: error instanceof Error ? error : new Error(String(error))
    });
  }
}

/**
 * Generates a secure encryption key for AES-256
 * 
 * @param length - Length of the key in bytes (default: 32 for AES-256)
 * @returns A secure encryption key encoded as hex
 * @throws ApiError if key generation fails
 */
export function generateEncryptionKey(length: number = DEFAULT_KEY_LENGTH): string {
  try {
    // Use generateSecureToken to generate a secure random key
    return generateSecureToken(length);
  } catch (error) {
    logger.error('Failed to generate encryption key', { error, length });
    throw new ApiError({
      message: 'Failed to generate encryption key',
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      status: 500,
      category: ErrorCategory.SECURITY,
      cause: error instanceof Error ? error : new Error(String(error))
    });
  }
}

/**
 * Loads an encryption key from a file or environment variable
 * 
 * @param keyPath - Path to the key file or environment variable name prefixed with 'env:'
 * @returns The loaded encryption key
 * @throws ApiError if key loading fails
 */
export async function loadEncryptionKey(keyPath: string): Promise<string> {
  try {
    if (!keyPath) {
      throw new Error('Key path cannot be empty');
    }

    // Check if keyPath refers to an environment variable
    if (keyPath.startsWith('env:')) {
      const envVarName = keyPath.substring(4);
      const envKey = process.env[envVarName];
      if (!envKey) {
        throw new Error(`Environment variable ${envVarName} not found`);
      }
      return envKey;
    }

    // Otherwise, load the key from a file
    return await fs.promises.readFile(keyPath, { encoding: 'utf8' });
  } catch (error) {
    logger.error('Failed to load encryption key', { error, keyPath });
    throw new ApiError({
      message: 'Failed to load encryption key',
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      status: 500,
      category: ErrorCategory.SECURITY,
      cause: error instanceof Error ? error : new Error(String(error))
    });
  }
}

/**
 * Saves an encryption key to a file with secure permissions
 * 
 * @param key - The encryption key to save
 * @param keyPath - Path where the key should be saved
 * @returns Promise that resolves when the key is saved
 * @throws ApiError if key saving fails
 */
export async function saveEncryptionKey(key: string, keyPath: string): Promise<void> {
  try {
    if (!key) {
      throw new Error('Encryption key cannot be empty');
    }
    if (!keyPath) {
      throw new Error('Key path cannot be empty');
    }

    // Create directory if it doesn't exist
    const directory = path.dirname(keyPath);
    await fs.promises.mkdir(directory, { recursive: true });

    // Write the key to the file
    await fs.promises.writeFile(keyPath, key, { encoding: 'utf8' });

    // Set secure file permissions (0600 - owner read/write only)
    await fs.promises.chmod(keyPath, 0o600);

    logger.info('Encryption key saved successfully', { keyPath });
  } catch (error) {
    logger.error('Failed to save encryption key', { error, keyPath });
    throw new ApiError({
      message: 'Failed to save encryption key',
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      status: 500,
      category: ErrorCategory.SECURITY,
      cause: error instanceof Error ? error : new Error(String(error))
    });
  }
}

/**
 * Rotates an encryption key by generating a new key and re-encrypting data
 * 
 * @param oldKeyPath - Path to the old encryption key
 * @param newKeyPath - Path where the new encryption key should be saved
 * @param reEncryptCallback - Optional callback function to re-encrypt data with the new key
 * @returns Promise that resolves when key rotation is complete
 * @throws ApiError if key rotation fails
 */
export async function rotateEncryptionKey(
  oldKeyPath: string,
  newKeyPath: string,
  reEncryptCallback?: (oldKey: string, newKey: string) => Promise<void>
): Promise<void> {
  try {
    if (!oldKeyPath) {
      throw new Error('Old key path cannot be empty');
    }
    if (!newKeyPath) {
      throw new Error('New key path cannot be empty');
    }

    // Load the old key
    const oldKey = await loadEncryptionKey(oldKeyPath);

    // Generate a new key
    const newKey = generateEncryptionKey();

    // Save the new key
    await saveEncryptionKey(newKey, newKeyPath);

    // If a callback is provided, use it to re-encrypt data with the new key
    if (reEncryptCallback) {
      await reEncryptCallback(oldKey, newKey);
    }

    logger.info('Encryption key rotated successfully', { oldKeyPath, newKeyPath });
  } catch (error) {
    logger.error('Failed to rotate encryption key', { error, oldKeyPath, newKeyPath });
    throw new ApiError({
      message: 'Failed to rotate encryption key',
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      status: 500,
      category: ErrorCategory.SECURITY,
      cause: error instanceof Error ? error : new Error(String(error))
    });
  }
}

/**
 * Encrypts a specific field in an object
 * 
 * @param data - Object containing the field to encrypt
 * @param fieldName - Name of the field to encrypt
 * @param key - Encryption key
 * @returns Object with the specified field encrypted
 * @throws ApiError if encryption fails
 */
export function encryptField(
  data: Record<string, any>,
  fieldName: string,
  key: string
): Record<string, any> {
  try {
    if (!data) {
      throw new Error('Data object cannot be empty');
    }
    if (!fieldName) {
      throw new Error('Field name cannot be empty');
    }
    if (!key) {
      throw new Error('Encryption key cannot be empty');
    }

    // Create a shallow copy of the object
    const result = { ...data };

    // Check if the field exists and has a value
    if (result[fieldName] !== undefined && result[fieldName] !== null) {
      // Convert the value to a string if it's not already
      const valueToEncrypt = typeof result[fieldName] === 'string'
        ? result[fieldName]
        : JSON.stringify(result[fieldName]);
      
      // Encrypt the field
      result[fieldName] = encrypt(valueToEncrypt, key);
    }

    return result;
  } catch (error) {
    logger.error('Failed to encrypt field', { error, fieldName });
    throw new ApiError({
      message: `Failed to encrypt field ${fieldName}`,
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      status: 500,
      category: ErrorCategory.SECURITY,
      cause: error instanceof Error ? error : new Error(String(error))
    });
  }
}

/**
 * Decrypts a specific field in an object
 * 
 * @param data - Object containing the field to decrypt
 * @param fieldName - Name of the field to decrypt
 * @param key - Decryption key
 * @returns Object with the specified field decrypted
 * @throws ApiError if decryption fails
 */
export function decryptField(
  data: Record<string, any>,
  fieldName: string,
  key: string
): Record<string, any> {
  try {
    if (!data) {
      throw new Error('Data object cannot be empty');
    }
    if (!fieldName) {
      throw new Error('Field name cannot be empty');
    }
    if (!key) {
      throw new Error('Decryption key cannot be empty');
    }

    // Create a shallow copy of the object
    const result = { ...data };

    // Check if the field exists and appears to be encrypted
    if (
      result[fieldName] !== undefined &&
      result[fieldName] !== null &&
      typeof result[fieldName] === 'object' &&
      'content' in result[fieldName] &&
      'iv' in result[fieldName] &&
      'tag' in result[fieldName]
    ) {
      // Decrypt the field
      let decrypted = decrypt(result[fieldName], key);
      
      // Try to parse as JSON if it looks like a JSON string
      try {
        if (
          (decrypted.startsWith('{') && decrypted.endsWith('}')) ||
          (decrypted.startsWith('[') && decrypted.endsWith(']'))
        ) {
          decrypted = JSON.parse(decrypted);
        }
      } catch {
        // If JSON parsing fails, keep the string value
      }
      
      result[fieldName] = decrypted;
    }

    return result;
  } catch (error) {
    logger.error('Failed to decrypt field', { error, fieldName });
    throw new ApiError({
      message: `Failed to decrypt field ${fieldName}`,
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      status: 500,
      category: ErrorCategory.SECURITY,
      cause: error instanceof Error ? error : new Error(String(error))
    });
  }
}

/**
 * Encrypts multiple fields in an object based on a schema
 * 
 * @param data - Object containing fields to encrypt
 * @param fieldsToEncrypt - Array of field names to encrypt
 * @param key - Encryption key
 * @returns Object with specified fields encrypted
 * @throws ApiError if encryption fails
 */
export function encryptObject(
  data: Record<string, any>,
  fieldsToEncrypt: string[],
  key: string
): Record<string, any> {
  try {
    if (!data) {
      throw new Error('Data object cannot be empty');
    }
    if (!fieldsToEncrypt || !Array.isArray(fieldsToEncrypt)) {
      throw new Error('Fields to encrypt must be an array');
    }
    if (!key) {
      throw new Error('Encryption key cannot be empty');
    }

    // Create a copy of the original object
    let result = { ...data };

    // Encrypt each field
    for (const fieldName of fieldsToEncrypt) {
      result = encryptField(result, fieldName, key);
    }

    return result;
  } catch (error) {
    logger.error('Failed to encrypt object fields', { error, fieldsToEncrypt });
    throw new ApiError({
      message: 'Failed to encrypt object fields',
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      status: 500,
      category: ErrorCategory.SECURITY,
      cause: error instanceof Error ? error : new Error(String(error))
    });
  }
}

/**
 * Decrypts multiple fields in an object based on a schema
 * 
 * @param data - Object containing fields to decrypt
 * @param fieldsToDecrypt - Array of field names to decrypt
 * @param key - Decryption key
 * @returns Object with specified fields decrypted
 * @throws ApiError if decryption fails
 */
export function decryptObject(
  data: Record<string, any>,
  fieldsToDecrypt: string[],
  key: string
): Record<string, any> {
  try {
    if (!data) {
      throw new Error('Data object cannot be empty');
    }
    if (!fieldsToDecrypt || !Array.isArray(fieldsToDecrypt)) {
      throw new Error('Fields to decrypt must be an array');
    }
    if (!key) {
      throw new Error('Decryption key cannot be empty');
    }

    // Create a copy of the original object
    let result = { ...data };

    // Decrypt each field
    for (const fieldName of fieldsToDecrypt) {
      result = decryptField(result, fieldName, key);
    }

    return result;
  } catch (error) {
    logger.error('Failed to decrypt object fields', { error, fieldsToDecrypt });
    throw new ApiError({
      message: 'Failed to decrypt object fields',
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      status: 500,
      category: ErrorCategory.SECURITY,
      cause: error instanceof Error ? error : new Error(String(error))
    });
  }
}

export {
  encrypt,
  decrypt,
  generateEncryptionKey,
  loadEncryptionKey,
  saveEncryptionKey,
  rotateEncryptionKey,
  encryptField,
  decryptField,
  encryptObject,
  decryptObject
};