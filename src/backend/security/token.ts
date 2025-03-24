/**
 * JWT Token Management Module
 * 
 * This module handles the generation, verification, and management of JWT tokens
 * for the HCBS Revenue Management System. It provides secure token handling for
 * authentication flows including access tokens, refresh tokens, MFA tokens, and
 * password reset tokens.
 * 
 * Security features include:
 * - RS256 asymmetric signing for enhanced security
 * - Token expiration and validation
 * - Token revocation capabilities
 * - Refresh token rotation with family-based tracking
 * - Secure storage of token metadata
 * 
 * @module security/token
 */

import * as jwt from 'jsonwebtoken'; // jsonwebtoken ^9.0.0
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid'; // uuid ^9.0.0

import { auth } from '../config';
import { 
  TokenType, 
  TokenPayload, 
  RefreshTokenPayload,
  MfaTokenPayload,
  PasswordResetTokenPayload,
  TokenMetadata,
  AuthenticatedUser,
  MfaMethod
} from '../types/auth.types';
import { AuthError } from '../errors/auth-error';
import { logger } from '../utils/logger';
import { db } from '../database/connection';

// Private and public key cache to avoid reading from disk on every token operation
let privateKeyCache: string | null = null;
let publicKeyCache: string | null = null;

/**
 * Reads the private key from file system for token signing
 * 
 * @returns Private key as string
 */
function readPrivateKey(): string {
  if (privateKeyCache) {
    return privateKeyCache;
  }

  try {
    privateKeyCache = fs.readFileSync(auth.privateKeyPath, 'utf8');
    return privateKeyCache;
  } catch (error) {
    logger.error('Failed to read private key', { 
      path: auth.privateKeyPath,
      error: error.message
    });
    throw new Error(`Failed to read private key: ${error.message}`);
  }
}

/**
 * Reads the public key from file system for token verification
 * 
 * @returns Public key as string
 */
function readPublicKey(): string {
  if (publicKeyCache) {
    return publicKeyCache;
  }

  try {
    publicKeyCache = fs.readFileSync(auth.publicKeyPath, 'utf8');
    return publicKeyCache;
  } catch (error) {
    logger.error('Failed to read public key', { 
      path: auth.publicKeyPath,
      error: error.message
    });
    throw new Error(`Failed to read public key: ${error.message}`);
  }
}

/**
 * Generates a JWT access token for an authenticated user
 *
 * @param user Authenticated user information
 * @returns Signed JWT access token
 */
export function generateAccessToken(user: AuthenticatedUser): string {
  const tokenId = uuidv4();
  
  // Create the token payload
  const payload: TokenPayload = {
    sub: user.id,
    email: user.email,
    tokenType: TokenType.ACCESS,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + auth.accessTokenExpiration,
    iss: auth.tokenIssuer,
    aud: auth.tokenAudience,
    jti: tokenId
  };

  // Sign the token with the private key using RS256 algorithm
  const privateKey = readPrivateKey();
  const token = jwt.sign(payload, privateKey, { algorithm: 'RS256' });
  
  // Store token metadata in the database
  storeTokenMetadata({
    id: tokenId,
    userId: user.id,
    type: TokenType.ACCESS,
    family: null,
    issuedAt: new Date(),
    expiresAt: new Date(payload.exp * 1000),
    revokedAt: null,
    revocationReason: null,
    deviceInfo: null,
    ipAddress: null
  });
  
  return token;
}

/**
 * Generates a JWT refresh token with longer expiration
 *
 * @param user Authenticated user information
 * @param tokenFamily Family identifier for token rotation tracking
 * @param deviceInfo Information about the device requesting the token
 * @returns Signed JWT refresh token
 */
export function generateRefreshToken(
  user: AuthenticatedUser, 
  tokenFamily: string,
  deviceInfo: object
): string {
  const tokenId = uuidv4();
  
  // Create the token payload
  const payload: RefreshTokenPayload = {
    sub: user.id,
    email: user.email,
    tokenType: TokenType.REFRESH,
    family: tokenFamily,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + auth.refreshTokenExpiration,
    iss: auth.tokenIssuer,
    aud: auth.tokenAudience,
    jti: tokenId
  };

  // Sign the token with the private key using RS256 algorithm
  const privateKey = readPrivateKey();
  const token = jwt.sign(payload, privateKey, { algorithm: 'RS256' });
  
  // Store token metadata in the database
  storeTokenMetadata({
    id: tokenId,
    userId: user.id,
    type: TokenType.REFRESH,
    family: tokenFamily,
    issuedAt: new Date(),
    expiresAt: new Date(payload.exp * 1000),
    revokedAt: null,
    revocationReason: null,
    deviceInfo: JSON.stringify(deviceInfo),
    ipAddress: null
  });
  
  return token;
}

/**
 * Generates a short-lived token for multi-factor authentication
 *
 * @param user Authenticated user information
 * @param mfaMethod MFA method being used
 * @returns Signed JWT MFA token
 */
export function generateMfaToken(
  user: AuthenticatedUser,
  mfaMethod: MfaMethod
): string {
  const tokenId = uuidv4();
  
  // Create the token payload
  const payload: MfaTokenPayload = {
    sub: user.id,
    email: user.email,
    tokenType: TokenType.MFA,
    mfaMethod,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + auth.mfaTokenExpiration,
    iss: auth.tokenIssuer,
    aud: auth.tokenAudience,
    jti: tokenId
  };

  // Sign the token with the private key using RS256 algorithm
  const privateKey = readPrivateKey();
  const token = jwt.sign(payload, privateKey, { algorithm: 'RS256' });
  
  // Store token metadata in the database
  storeTokenMetadata({
    id: tokenId,
    userId: user.id,
    type: TokenType.MFA,
    family: null,
    issuedAt: new Date(),
    expiresAt: new Date(payload.exp * 1000),
    revokedAt: null,
    revocationReason: null,
    deviceInfo: null,
    ipAddress: null
  });
  
  return token;
}

/**
 * Generates a token for password reset process
 *
 * @param userId User ID requesting password reset
 * @param email User email for the password reset
 * @returns Signed JWT password reset token
 */
export function generatePasswordResetToken(
  userId: string,
  email: string
): string {
  const tokenId = uuidv4();
  
  // Create the token payload
  const payload: PasswordResetTokenPayload = {
    sub: userId,
    email: email,
    tokenType: TokenType.PASSWORD_RESET,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + auth.passwordResetExpiration,
    iss: auth.tokenIssuer,
    aud: auth.tokenAudience,
    jti: tokenId
  };

  // Sign the token with the private key using RS256 algorithm
  const privateKey = readPrivateKey();
  const token = jwt.sign(payload, privateKey, { algorithm: 'RS256' });
  
  // Store token metadata in the database
  storeTokenMetadata({
    id: tokenId,
    userId,
    type: TokenType.PASSWORD_RESET,
    family: null,
    issuedAt: new Date(),
    expiresAt: new Date(payload.exp * 1000),
    revokedAt: null,
    revocationReason: null,
    deviceInfo: null,
    ipAddress: null
  });
  
  return token;
}

/**
 * Verifies an access token and returns the authenticated user
 *
 * @param token JWT access token to verify
 * @returns Promise resolving to authenticated user from the token
 * @throws AuthError if token is invalid, expired, or revoked
 */
export async function verifyAccessToken(token: string): Promise<AuthenticatedUser> {
  try {
    // Verify the token signature and expiration
    const publicKey = readPublicKey();
    const decoded = jwt.verify(token, publicKey, { 
      algorithms: ['RS256'],
      issuer: auth.tokenIssuer,
      audience: auth.tokenAudience
    }) as TokenPayload;
    
    // Verify token type
    if (decoded.tokenType !== TokenType.ACCESS) {
      logger.warn('Invalid token type for access token', { 
        tokenType: decoded.tokenType,
        expected: TokenType.ACCESS
      });
      throw AuthError.unauthorized('Invalid token type');
    }
    
    // Check if token has been revoked
    const isRevoked = await isTokenRevoked(decoded.jti);
    if (isRevoked) {
      logger.warn('Attempt to use revoked access token', { tokenId: decoded.jti });
      throw AuthError.unauthorized('Token has been revoked');
    }
    
    // Reconstruct the authenticated user from token payload
    // In a real implementation, we might want to fetch the latest user data from the database
    // to ensure we have up-to-date permissions
    const user: AuthenticatedUser = {
      id: decoded.sub,
      email: decoded.email,
      firstName: '', // These fields are not in the token payload
      lastName: '',  // They would need to be fetched from the database
      roleId: '',    // in a real implementation
      roleName: '',
      permissions: [],
      mfaEnabled: false,
      lastLogin: null
    };
    
    logger.debug('Access token verified successfully', { 
      userId: user.id,
      tokenId: decoded.jti
    });
    
    return user;
  } catch (error) {
    // Handle different types of JWT errors
    if (error instanceof jwt.TokenExpiredError) {
      logger.debug('Access token expired', { error: error.message });
      throw AuthError.sessionExpired('Access token has expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      logger.warn('Invalid access token', { error: error.message });
      throw AuthError.unauthorized('Invalid access token');
    } else if (error instanceof AuthError) {
      // Pass through AuthError instances
      throw error;
    } else {
      // Log unexpected errors and convert to AuthError
      logger.error('Token verification error', { 
        error: error.message,
        stack: error.stack
      });
      throw AuthError.unauthorized('Failed to verify access token');
    }
  }
}

/**
 * Verifies a refresh token and returns the token payload
 *
 * @param token JWT refresh token to verify
 * @returns Promise resolving to verified refresh token payload
 * @throws AuthError if token is invalid, expired, or revoked
 */
export async function verifyRefreshToken(token: string): Promise<RefreshTokenPayload & TokenPayload> {
  try {
    // Verify the token signature and expiration
    const publicKey = readPublicKey();
    const decoded = jwt.verify(token, publicKey, { 
      algorithms: ['RS256'],
      issuer: auth.tokenIssuer,
      audience: auth.tokenAudience
    }) as RefreshTokenPayload & TokenPayload;
    
    // Verify token type
    if (decoded.tokenType !== TokenType.REFRESH) {
      logger.warn('Invalid token type for refresh token', { 
        tokenType: decoded.tokenType,
        expected: TokenType.REFRESH
      });
      throw AuthError.unauthorized('Invalid token type');
    }
    
    // Check if token has been revoked
    const isRevoked = await isTokenRevoked(decoded.jti);
    if (isRevoked) {
      logger.warn('Attempt to use revoked refresh token', { tokenId: decoded.jti });
      throw AuthError.unauthorized('Token has been revoked');
    }
    
    logger.debug('Refresh token verified successfully', { 
      userId: decoded.sub,
      tokenId: decoded.jti,
      family: decoded.family
    });
    
    return decoded;
  } catch (error) {
    // Handle different types of JWT errors
    if (error instanceof jwt.TokenExpiredError) {
      logger.debug('Refresh token expired', { error: error.message });
      throw AuthError.unauthorized('Refresh token has expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      logger.warn('Invalid refresh token', { error: error.message });
      throw AuthError.unauthorized('Invalid refresh token');
    } else if (error instanceof AuthError) {
      // Pass through AuthError instances
      throw error;
    } else {
      // Log unexpected errors and convert to AuthError
      logger.error('Token verification error', { 
        error: error.message,
        stack: error.stack
      });
      throw AuthError.unauthorized('Failed to verify refresh token');
    }
  }
}

/**
 * Verifies an MFA token and returns the token payload
 *
 * @param token JWT MFA token to verify
 * @returns Promise resolving to verified MFA token payload
 * @throws AuthError if token is invalid, expired, or revoked
 */
export async function verifyMfaToken(token: string): Promise<MfaTokenPayload & TokenPayload> {
  try {
    // Verify the token signature and expiration
    const publicKey = readPublicKey();
    const decoded = jwt.verify(token, publicKey, { 
      algorithms: ['RS256'],
      issuer: auth.tokenIssuer,
      audience: auth.tokenAudience
    }) as MfaTokenPayload & TokenPayload;
    
    // Verify token type
    if (decoded.tokenType !== TokenType.MFA) {
      logger.warn('Invalid token type for MFA token', { 
        tokenType: decoded.tokenType,
        expected: TokenType.MFA
      });
      throw AuthError.unauthorized('Invalid token type');
    }
    
    // Check if token has been revoked
    const isRevoked = await isTokenRevoked(decoded.jti);
    if (isRevoked) {
      logger.warn('Attempt to use revoked MFA token', { tokenId: decoded.jti });
      throw AuthError.unauthorized('Token has been revoked');
    }
    
    logger.debug('MFA token verified successfully', { 
      userId: decoded.sub,
      tokenId: decoded.jti,
      mfaMethod: decoded.mfaMethod
    });
    
    return decoded;
  } catch (error) {
    // Handle different types of JWT errors
    if (error instanceof jwt.TokenExpiredError) {
      logger.debug('MFA token expired', { error: error.message });
      throw AuthError.unauthorized('MFA token has expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      logger.warn('Invalid MFA token', { error: error.message });
      throw AuthError.unauthorized('Invalid MFA token');
    } else if (error instanceof AuthError) {
      // Pass through AuthError instances
      throw error;
    } else {
      // Log unexpected errors and convert to AuthError
      logger.error('Token verification error', { 
        error: error.message,
        stack: error.stack
      });
      throw AuthError.unauthorized('Failed to verify MFA token');
    }
  }
}

/**
 * Verifies a password reset token and returns the token payload
 *
 * @param token JWT password reset token to verify
 * @returns Promise resolving to verified password reset token payload
 * @throws AuthError if token is invalid, expired, or revoked
 */
export async function verifyPasswordResetToken(token: string): Promise<PasswordResetTokenPayload & TokenPayload> {
  try {
    // Verify the token signature and expiration
    const publicKey = readPublicKey();
    const decoded = jwt.verify(token, publicKey, { 
      algorithms: ['RS256'],
      issuer: auth.tokenIssuer,
      audience: auth.tokenAudience
    }) as PasswordResetTokenPayload & TokenPayload;
    
    // Verify token type
    if (decoded.tokenType !== TokenType.PASSWORD_RESET) {
      logger.warn('Invalid token type for password reset token', { 
        tokenType: decoded.tokenType,
        expected: TokenType.PASSWORD_RESET
      });
      throw AuthError.unauthorized('Invalid token type');
    }
    
    // Check if token has been revoked
    const isRevoked = await isTokenRevoked(decoded.jti);
    if (isRevoked) {
      logger.warn('Attempt to use revoked password reset token', { tokenId: decoded.jti });
      throw AuthError.unauthorized('Token has been revoked');
    }
    
    logger.debug('Password reset token verified successfully', { 
      userId: decoded.sub,
      tokenId: decoded.jti
    });
    
    return decoded;
  } catch (error) {
    // Handle different types of JWT errors
    if (error instanceof jwt.TokenExpiredError) {
      logger.debug('Password reset token expired', { error: error.message });
      throw AuthError.unauthorized('Password reset token has expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      logger.warn('Invalid password reset token', { error: error.message });
      throw AuthError.unauthorized('Invalid password reset token');
    } else if (error instanceof AuthError) {
      // Pass through AuthError instances
      throw error;
    } else {
      // Log unexpected errors and convert to AuthError
      logger.error('Token verification error', { 
        error: error.message,
        stack: error.stack
      });
      throw AuthError.unauthorized('Failed to verify password reset token');
    }
  }
}

/**
 * Revokes a specific token by its ID
 *
 * @param tokenId ID of the token to revoke
 * @param reason Reason for revocation
 * @returns Promise resolving to true if token was successfully revoked
 */
export async function revokeToken(tokenId: string, reason: string): Promise<boolean> {
  try {
    // Update token metadata to mark it as revoked
    await db.query(async (knex) => {
      return knex('token_metadata')
        .where('id', tokenId)
        .update({
          revokedAt: new Date(),
          revocationReason: reason
        });
    });
    
    logger.info('Token revoked', { tokenId, reason });
    return true;
  } catch (error) {
    logger.error('Failed to revoke token', { 
      tokenId,
      reason,
      error: error.message
    });
    return false;
  }
}

/**
 * Revokes all tokens for a specific user
 *
 * @param userId ID of the user whose tokens should be revoked
 * @param reason Reason for revocation
 * @returns Promise resolving to true if all tokens were successfully revoked
 */
export async function revokeAllUserTokens(userId: string, reason: string): Promise<boolean> {
  try {
    // Update all active tokens for the user to mark them as revoked
    await db.query(async (knex) => {
      return knex('token_metadata')
        .where('userId', userId)
        .whereNull('revokedAt')
        .update({
          revokedAt: new Date(),
          revocationReason: reason
        });
    });
    
    logger.info('All user tokens revoked', { userId, reason });
    return true;
  } catch (error) {
    logger.error('Failed to revoke all user tokens', { 
      userId,
      reason,
      error: error.message
    });
    return false;
  }
}

/**
 * Revokes an old refresh token and generates a new one in the same family
 *
 * @param oldToken Old refresh token to revoke
 * @param user Authenticated user information
 * @param tokenFamily Family identifier for token rotation tracking
 * @param deviceInfo Information about the device requesting the token
 * @returns Promise resolving to new refresh token
 */
export async function rotateRefreshToken(
  oldToken: string,
  user: AuthenticatedUser,
  tokenFamily: string,
  deviceInfo: object
): Promise<string> {
  try {
    // Verify the old token to ensure it's valid
    const decoded = await verifyRefreshToken(oldToken);
    
    // Revoke the old token
    await revokeToken(decoded.jti, 'rotated');
    
    // Generate a new refresh token in the same family
    const newToken = generateRefreshToken(user, tokenFamily, deviceInfo);
    
    logger.info('Refresh token rotated', { 
      userId: user.id,
      oldTokenId: decoded.jti,
      family: tokenFamily
    });
    
    return newToken;
  } catch (error) {
    logger.error('Failed to rotate refresh token', { 
      userId: user.id,
      family: tokenFamily,
      error: error.message
    });
    
    if (error instanceof AuthError) {
      throw error;
    } else {
      throw AuthError.unauthorized('Failed to rotate refresh token');
    }
  }
}

/**
 * Generates a unique token family identifier for refresh token rotation
 *
 * @returns Unique token family identifier
 */
export function generateTokenFamily(): string {
  return uuidv4();
}

/**
 * Stores token metadata in the database for tracking
 *
 * @param metadata Token metadata to store
 * @returns Promise resolving when storage is complete
 */
async function storeTokenMetadata(metadata: TokenMetadata): Promise<void> {
  try {
    await db.query(async (knex) => {
      return knex('token_metadata').insert(metadata);
    });
    
    logger.debug('Token metadata stored', { 
      tokenId: metadata.id,
      type: metadata.type,
      userId: metadata.userId
    });
  } catch (error) {
    logger.error('Failed to store token metadata', { 
      tokenId: metadata.id,
      error: error.message
    });
    // Don't throw here to prevent token generation failures
    // but we should log the error for monitoring
  }
}

/**
 * Retrieves token metadata from the database
 *
 * @param tokenId ID of the token to retrieve metadata for
 * @returns Promise resolving to token metadata or null if not found
 */
async function getTokenMetadata(tokenId: string): Promise<TokenMetadata | null> {
  try {
    const result = await db.query(async (knex) => {
      return knex('token_metadata')
        .where('id', tokenId)
        .first();
    });
    
    return result || null;
  } catch (error) {
    logger.error('Failed to retrieve token metadata', { 
      tokenId,
      error: error.message
    });
    return null;
  }
}

/**
 * Checks if a token has been revoked
 *
 * @param tokenId ID of the token to check
 * @returns Promise resolving to true if token is revoked
 */
export async function isTokenRevoked(tokenId: string): Promise<boolean> {
  try {
    const metadata = await getTokenMetadata(tokenId);
    
    // If we couldn't find the token metadata, consider it revoked
    if (!metadata) {
      logger.warn('Token metadata not found', { tokenId });
      return true;
    }
    
    // Check if the token has a revocation timestamp
    return metadata.revokedAt !== null;
  } catch (error) {
    logger.error('Error checking token revocation status', { 
      tokenId,
      error: error.message
    });
    
    // In case of an error, consider the token revoked for security
    return true;
  }
}