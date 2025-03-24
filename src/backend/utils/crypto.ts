/**
 * Cryptographic utilities for the HCBS Revenue Management System
 * 
 * This module provides cryptographic functions for secure operations including
 * token generation, password hashing, and data encryption. All functions follow
 * best practices for security and are designed to be compliant with HIPAA requirements.
 */

import { logger } from './logger';
import { ApiError } from '../errors/api-error';
import { ErrorCode, ErrorCategory } from '../types/error.types';
import * as crypto from 'crypto'; // crypto ^1.0.0
import * as bcrypt from 'bcrypt'; // bcrypt ^5.1.0

// Constants
const DEFAULT_SALT_ROUNDS = 12;
const DEFAULT_TOKEN_LENGTH = 32;
const DEFAULT_HASH_ALGORITHM = 'sha256';
const ENCODING_BASE64 = 'base64';
const ENCODING_HEX = 'hex';

/**
 * Generates a cryptographically secure random token
 * 
 * @param length - Length of the token in bytes (default: 32)
 * @returns A secure random token encoded as base64
 * @throws ApiError if token generation fails
 */
export function generateSecureToken(length: number = DEFAULT_TOKEN_LENGTH): string {
  try {
    // Validate that length is a positive number
    if (length <= 0 || !Number.isInteger(length)) {
      throw new Error('Token length must be a positive integer');
    }

    // Use crypto.randomBytes to generate cryptographically secure random bytes
    const randomBytes = crypto.randomBytes(length);
    
    // Convert the random bytes to a base64 string
    return randomBytes.toString(ENCODING_BASE64);
  } catch (error) {
    logger.error('Failed to generate secure token', { error, length });
    throw new ApiError({
      message: 'Failed to generate secure token',
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      status: 500,
      category: ErrorCategory.SECURITY,
      cause: error instanceof Error ? error : new Error(String(error))
    });
  }
}

/**
 * Generates a cryptographically secure random token in hexadecimal format
 * 
 * @param length - Length of the token in bytes (default: 32)
 * @returns A secure random token encoded as hexadecimal
 * @throws ApiError if token generation fails
 */
export function generateSecureHexToken(length: number = DEFAULT_TOKEN_LENGTH): string {
  try {
    // Validate that length is a positive number
    if (length <= 0 || !Number.isInteger(length)) {
      throw new Error('Token length must be a positive integer');
    }

    // Use crypto.randomBytes to generate cryptographically secure random bytes
    const randomBytes = crypto.randomBytes(length);
    
    // Convert the random bytes to a hexadecimal string
    return randomBytes.toString(ENCODING_HEX);
  } catch (error) {
    logger.error('Failed to generate secure hex token', { error, length });
    throw new ApiError({
      message: 'Failed to generate secure hex token',
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      status: 500,
      category: ErrorCategory.SECURITY,
      cause: error instanceof Error ? error : new Error(String(error))
    });
  }
}

/**
 * Hashes a password using bcrypt with configurable salt rounds
 * 
 * @param password - The password to hash
 * @param saltRounds - Number of salt rounds to use (default: 12)
 * @returns Promise resolving to the hashed password
 * @throws ApiError if password hashing fails
 */
export async function hashPassword(
  password: string, 
  saltRounds: number = DEFAULT_SALT_ROUNDS
): Promise<string> {
  try {
    // Validate that password is not empty
    if (!password) {
      throw new Error('Password cannot be empty');
    }
    
    // Use bcrypt.hash to generate a secure password hash
    return await bcrypt.hash(password, saltRounds);
  } catch (error) {
    logger.error('Failed to hash password', { error, saltRounds });
    throw new ApiError({
      message: 'Failed to hash password',
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      status: 500,
      category: ErrorCategory.SECURITY,
      cause: error instanceof Error ? error : new Error(String(error))
    });
  }
}

/**
 * Compares a plain text password with a hashed password
 * 
 * @param plainPassword - The plain text password to compare
 * @param hashedPassword - The hashed password to compare against
 * @returns Promise resolving to true if passwords match, false otherwise
 * @throws ApiError if password comparison fails
 */
export async function comparePassword(
  plainPassword: string, 
  hashedPassword: string
): Promise<boolean> {
  try {
    // Validate that both passwords are provided
    if (!plainPassword || !hashedPassword) {
      throw new Error('Both plain and hashed passwords must be provided');
    }
    
    // Use bcrypt.compare to securely compare the passwords
    return await bcrypt.compare(plainPassword, hashedPassword);
  } catch (error) {
    logger.error('Failed to compare password', { error });
    throw new ApiError({
      message: 'Failed to compare password',
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      status: 500,
      category: ErrorCategory.SECURITY,
      cause: error instanceof Error ? error : new Error(String(error))
    });
  }
}

/**
 * Creates a hash of data using the specified algorithm
 * 
 * @param data - The data to hash
 * @param algorithm - The hash algorithm to use (default: sha256)
 * @returns The hashed data as a hexadecimal string
 * @throws ApiError if hashing fails
 */
export function hashData(
  data: string, 
  algorithm: string = DEFAULT_HASH_ALGORITHM
): string {
  try {
    // Validate that data is not empty
    if (!data) {
      throw new Error('Data to hash cannot be empty');
    }
    
    // Create a hash object using crypto.createHash with the specified algorithm
    const hash = crypto.createHash(algorithm);
    
    // Update the hash with the data
    hash.update(data);
    
    // Return the hash digest as a hexadecimal string
    return hash.digest(ENCODING_HEX);
  } catch (error) {
    logger.error('Failed to hash data', { error, algorithm });
    throw new ApiError({
      message: 'Failed to hash data',
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      status: 500,
      category: ErrorCategory.SECURITY,
      cause: error instanceof Error ? error : new Error(String(error))
    });
  }
}

/**
 * Creates an HMAC (Hash-based Message Authentication Code) for data
 * 
 * @param data - The data to create an HMAC for
 * @param key - The key to use for the HMAC
 * @param algorithm - The hash algorithm to use (default: sha256)
 * @returns The HMAC as a hexadecimal string
 * @throws ApiError if HMAC creation fails
 */
export function createHmac(
  data: string, 
  key: string, 
  algorithm: string = DEFAULT_HASH_ALGORITHM
): string {
  try {
    // Validate that data and key are not empty
    if (!data) {
      throw new Error('Data for HMAC cannot be empty');
    }
    if (!key) {
      throw new Error('Key for HMAC cannot be empty');
    }
    
    // Create an HMAC object using crypto.createHmac with the specified algorithm and key
    const hmac = crypto.createHmac(algorithm, key);
    
    // Update the HMAC with the data
    hmac.update(data);
    
    // Return the HMAC digest as a hexadecimal string
    return hmac.digest(ENCODING_HEX);
  } catch (error) {
    logger.error('Failed to create HMAC', { error, algorithm });
    throw new ApiError({
      message: 'Failed to create HMAC',
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      status: 500,
      category: ErrorCategory.SECURITY,
      cause: error instanceof Error ? error : new Error(String(error))
    });
  }
}

/**
 * Generates a cryptographically secure random salt
 * 
 * @param length - Length of the salt in bytes (default: 16)
 * @returns A secure random salt encoded as base64
 * @throws ApiError if salt generation fails
 */
export function generateSalt(length: number = 16): string {
  try {
    // Validate that length is a positive number
    if (length <= 0 || !Number.isInteger(length)) {
      throw new Error('Salt length must be a positive integer');
    }
    
    // Use crypto.randomBytes to generate cryptographically secure random bytes for the salt
    const salt = crypto.randomBytes(length);
    
    // Convert the random bytes to a base64 string
    return salt.toString(ENCODING_BASE64);
  } catch (error) {
    logger.error('Failed to generate salt', { error, length });
    throw new ApiError({
      message: 'Failed to generate salt',
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      status: 500,
      category: ErrorCategory.SECURITY,
      cause: error instanceof Error ? error : new Error(String(error))
    });
  }
}

/**
 * Performs a timing-safe comparison of two strings to prevent timing attacks
 * 
 * @param a - The first string to compare
 * @param b - The second string to compare
 * @returns True if the strings are equal, false otherwise
 * @throws ApiError if comparison fails
 */
export function timingSafeEqual(a: string, b: string): boolean {
  try {
    // Validate that both strings are provided
    if (!a || !b) {
      throw new Error('Both strings for comparison must be provided');
    }
    
    // Convert strings to Buffer objects
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    
    // If lengths differ, return false (not equal)
    if (bufA.length !== bufB.length) {
      return false;
    }
    
    // Use crypto.timingSafeEqual to perform a constant-time comparison
    return crypto.timingSafeEqual(bufA, bufB);
  } catch (error) {
    logger.error('Failed to perform timing-safe comparison', { error });
    throw new ApiError({
      message: 'Failed to perform timing-safe comparison',
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      status: 500,
      category: ErrorCategory.SECURITY,
      cause: error instanceof Error ? error : new Error(String(error))
    });
  }
}

/**
 * Generates a random string using a specified character set
 * 
 * @param length - Length of the string to generate
 * @param charset - Character set to use (default: alphanumeric)
 * @returns A random string of specified length using the given character set
 * @throws ApiError if string generation fails
 */
export function generateRandomString(
  length: number, 
  charset: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
): string {
  try {
    // Validate that length is a positive number
    if (length <= 0 || !Number.isInteger(length)) {
      throw new Error('String length must be a positive integer');
    }
    if (!charset || charset.length === 0) {
      throw new Error('Character set cannot be empty');
    }
    
    // Generate secure random bytes using crypto.randomBytes
    const randomBytes = crypto.randomBytes(length);
    
    // Map the random bytes to characters from the charset
    let result = '';
    for (let i = 0; i < length; i++) {
      result += charset[randomBytes[i] % charset.length];
    }
    
    return result;
  } catch (error) {
    logger.error('Failed to generate random string', { error, length });
    throw new ApiError({
      message: 'Failed to generate random string',
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      status: 500,
      category: ErrorCategory.SECURITY,
      cause: error instanceof Error ? error : new Error(String(error))
    });
  }
}

/**
 * Generates a secure ID suitable for use as a non-guessable identifier
 * 
 * @param length - Length of the ID in bytes (default: 16)
 * @returns A secure random ID
 * @throws ApiError if ID generation fails
 */
export function generateSecureId(length: number = 16): string {
  try {
    // Validate that length is a positive number
    if (length <= 0 || !Number.isInteger(length)) {
      throw new Error('ID length must be a positive integer');
    }
    
    // Use generateSecureHexToken to generate a secure random token
    return generateSecureHexToken(length);
  } catch (error) {
    logger.error('Failed to generate secure ID', { error, length });
    throw new ApiError({
      message: 'Failed to generate secure ID',
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      status: 500,
      category: ErrorCategory.SECURITY,
      cause: error instanceof Error ? error : new Error(String(error))
    });
  }
}