/**
 * Session Management Module for HCBS Revenue Management System
 * 
 * Provides HIPAA-compliant session management functionality including creation, 
 * validation, tracking, and termination of user sessions. Implements security best 
 * practices for healthcare applications with proper session expiration, enforcement
 * of concurrent session limits, and comprehensive audit logging.
 */

import { Redis } from 'ioredis'; // v5.3.2
import { v4 as uuidv4 } from 'uuid'; // ^9.0.0

import { auth, redisConfig } from '../config';
import { UserSession, AuthenticatedUser, RequestInfo } from '../types/auth.types';
import { AuthError } from '../errors/auth-error';
import { logger } from '../utils/logger';
import { auditLog } from '../security/audit-logging';
import { db } from '../database/connection';

// Redis client singleton instance
let redisClient: Redis | null = null;

/**
 * Gets or creates a Redis client instance
 * @returns Redis client instance
 */
function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis({
      ...redisConfig.redisOptions,
      keyPrefix: redisConfig.keyPrefix,
      commandTimeout: 5000,
      retryStrategy: (times) => {
        if (times > 3) {
          logger.error('Redis connection failed multiple times, giving up', { times });
          return null; // stop retrying
        }
        return Math.min(times * 100, 3000); // exponential backoff
      }
    });

    redisClient.on('error', (error) => {
      logger.error('Redis client error', { error });
    });

    logger.info('Redis client initialized for session management');
  }
  
  return redisClient;
}

/**
 * Creates a Redis key for a session
 * @param sessionId Session identifier
 * @returns Redis key for the session
 */
function createSessionKey(sessionId: string): string {
  return `session:${sessionId}`;
}

/**
 * Creates a Redis key pattern to find all sessions for a user
 * @param userId User identifier
 * @returns Redis key pattern for user sessions
 */
function createUserSessionPattern(userId: string): string {
  return `session:*:${userId}`;
}

/**
 * Creates a new user session and stores it in Redis
 * @param user Authenticated user information
 * @param requestInfo Information about the request (IP, user agent)
 * @param rememberMe Whether to extend session duration
 * @returns The created session object
 */
export async function createSession(
  user: AuthenticatedUser,
  requestInfo: RequestInfo,
  rememberMe: boolean = false
): Promise<UserSession> {
  try {
    // Generate a unique session ID
    const sessionId = uuidv4();
    
    // Extract request information
    const { ipAddress, userAgent } = requestInfo;
    
    // Calculate expiration time based on configuration and rememberMe flag
    const now = new Date();
    const sessionSettings = auth.sessionSettings;
    const sessionDuration = rememberMe 
      ? sessionSettings.rememberMeDuration 
      : sessionSettings.absoluteTimeout;
    
    // Calculate session end time based on absolute timeout
    const endTime = new Date(now.getTime() + (sessionDuration * 1000));
    
    // Create session object
    const session: UserSession = {
      id: sessionId,
      userId: user.id,
      userInfo: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roleId: user.roleId,
        roleName: user.roleName,
        permissions: user.permissions
      },
      ipAddress,
      deviceInfo: userAgent || 'Unknown',
      startTime: now,
      lastActivity: now,
      endTime: null,
      isActive: true,
      rememberMe
    };
    
    // Store session in Redis with TTL
    const redis = getRedisClient();
    const sessionKey = createSessionKey(sessionId);
    await redis.set(
      sessionKey, 
      JSON.stringify(session), 
      'EX', 
      sessionDuration
    );
    
    logger.debug('Created new session', { 
      sessionId, 
      userId: user.id, 
      expiration: endTime.toISOString() 
    });
    
    // Store session record in database for audit purposes
    await db.query(async (knex) => {
      await knex('user_sessions').insert({
        id: sessionId,
        user_id: user.id,
        ip_address: ipAddress,
        device_info: userAgent,
        start_time: now,
        last_activity: now,
        end_time: null,
        is_active: true,
        remember_me: rememberMe,
        created_at: now,
        updated_at: now
      });
    });
    
    // Log session creation for audit purposes
    await auditLog.logUserActivity(
      'LOGIN',
      `User logged in and started session ${sessionId}`,
      { rememberMe, sessionTTL: sessionDuration },
      { userId: user.id, userName: `${user.firstName} ${user.lastName}`, ipAddress, userAgent }
    );
    
    // Enforce maximum sessions limit
    await enforceMaxSessions(user.id, session);
    
    return session;
  } catch (error) {
    logger.error('Failed to create session', { error, userId: user.id });
    throw error;
  }
}

/**
 * Retrieves a session from Redis by session ID
 * @param sessionId Session identifier
 * @returns The session object or null if not found
 */
export async function getSession(sessionId: string): Promise<UserSession | null> {
  try {
    if (!sessionId || typeof sessionId !== 'string') {
      logger.warn('Invalid session ID format', { sessionId });
      return null;
    }
    
    const redis = getRedisClient();
    const sessionKey = createSessionKey(sessionId);
    const sessionData = await redis.get(sessionKey);
    
    if (!sessionData) {
      logger.debug('Session not found', { sessionId });
      return null;
    }
    
    try {
      const session = JSON.parse(sessionData) as UserSession;
      
      // Convert string dates to Date objects
      session.startTime = new Date(session.startTime);
      session.lastActivity = new Date(session.lastActivity);
      if (session.endTime) {
        session.endTime = new Date(session.endTime);
      }
      
      return session;
    } catch (parseError) {
      logger.error('Error parsing session data', { 
        sessionId, 
        error: parseError, 
        sessionData 
      });
      return null;
    }
  } catch (error) {
    logger.error('Error retrieving session', { error, sessionId });
    return null;
  }
}

/**
 * Validates a session and checks if it's still active
 * @param session Session to validate
 * @returns True if session is valid and active
 */
export function validateSession(session: UserSession): boolean {
  // No session, not valid
  if (!session) {
    return false;
  }
  
  // Check if session has ended
  if (session.endTime !== null) {
    return false;
  }
  
  // Check if session has expired due to inactivity
  const now = new Date();
  const inactivityTimeout = auth.sessionSettings.inactivityTimeout * 1000; // convert seconds to ms
  const lastActivity = new Date(session.lastActivity);
  const inactivityDeadline = new Date(lastActivity.getTime() + inactivityTimeout);
  
  if (now > inactivityDeadline) {
    logger.debug('Session expired due to inactivity', { 
      sessionId: session.id,
      lastActivity: lastActivity.toISOString(),
      inactivityDeadline: inactivityDeadline.toISOString(),
      now: now.toISOString()
    });
    return false;
  }
  
  // Check if session is marked as active
  if (!session.isActive) {
    return false;
  }
  
  return true;
}

/**
 * Updates the last activity timestamp of a session
 * @param sessionId Session identifier
 * @returns True if session was successfully updated
 */
export async function updateSessionActivity(sessionId: string): Promise<boolean> {
  try {
    // Get the session
    const session = await getSession(sessionId);
    if (!session) {
      logger.debug('Session not found for activity update', { sessionId });
      return false;
    }
    
    // Update last activity timestamp
    const now = new Date();
    session.lastActivity = now;
    
    // Store updated session in Redis with the same TTL
    const redis = getRedisClient();
    const sessionKey = createSessionKey(sessionId);
    
    // Get the remaining TTL
    const ttl = await redis.ttl(sessionKey);
    if (ttl <= 0) {
      logger.debug('Session expired or does not exist', { sessionId, ttl });
      return false;
    }
    
    // Update session in Redis
    await redis.set(
      sessionKey,
      JSON.stringify(session),
      'EX',
      ttl
    );
    
    // Update session record in database
    await db.query(async (knex) => {
      await knex('user_sessions')
        .where('id', sessionId)
        .update({
          last_activity: now,
          updated_at: now
        });
    });
    
    logger.debug('Updated session activity', { sessionId, lastActivity: now.toISOString() });
    return true;
  } catch (error) {
    logger.error('Error updating session activity', { error, sessionId });
    return false;
  }
}

/**
 * Ends a user session by removing it from Redis and updating database record
 * @param sessionId Session identifier
 * @returns True if session was successfully ended
 */
export async function endSession(sessionId: string): Promise<boolean> {
  try {
    // Get the session
    const session = await getSession(sessionId);
    if (!session) {
      logger.debug('Session not found for termination', { sessionId });
      return false;
    }
    
    // Remove session from Redis
    const redis = getRedisClient();
    const sessionKey = createSessionKey(sessionId);
    await redis.del(sessionKey);
    
    const now = new Date();
    
    // Update session record in database
    await db.query(async (knex) => {
      await knex('user_sessions')
        .where('id', sessionId)
        .update({
          end_time: now,
          is_active: false,
          updated_at: now
        });
    });
    
    // Log session termination for audit purposes
    await auditLog.logUserActivity(
      'LOGOUT',
      `User session ${sessionId} ended`,
      { sessionDuration: now.getTime() - new Date(session.startTime).getTime() },
      { userId: session.userId, ipAddress: session.ipAddress, userAgent: session.deviceInfo }
    );
    
    logger.debug('Ended session', { sessionId, userId: session.userId });
    return true;
  } catch (error) {
    logger.error('Error ending session', { error, sessionId });
    return false;
  }
}

/**
 * Ends all active sessions for a specific user
 * @param userId User identifier
 * @returns True if all sessions were successfully ended
 */
export async function endAllUserSessions(userId: string): Promise<boolean> {
  try {
    // Get all active sessions for the user
    const sessions = await getActiveSessions(userId);
    
    if (sessions.length === 0) {
      logger.debug('No active sessions found for user', { userId });
      return true;
    }
    
    const now = new Date();
    
    // End each session
    const sessionIds = sessions.map(session => session.id);
    
    // Remove all sessions from Redis
    const redis = getRedisClient();
    const sessionKeys = sessionIds.map(id => createSessionKey(id));
    await redis.del(...sessionKeys);
    
    // Update all session records in database
    await db.query(async (knex) => {
      await knex('user_sessions')
        .whereIn('id', sessionIds)
        .update({
          end_time: now,
          is_active: false,
          updated_at: now
        });
    });
    
    // Log mass session termination for audit purposes
    await auditLog.logSecurityEvent(
      'LOGOUT',
      `All sessions terminated for user ${userId}`,
      'INFO',
      { sessionCount: sessions.length, sessionIds },
      { userId }
    );
    
    logger.info('Ended all user sessions', { userId, sessionCount: sessions.length });
    return true;
  } catch (error) {
    logger.error('Error ending all user sessions', { error, userId });
    return false;
  }
}

/**
 * Retrieves all active sessions for a specific user
 * @param userId User identifier
 * @returns Array of active user sessions
 */
export async function getActiveSessions(userId: string): Promise<UserSession[]> {
  try {
    // Get all sessions for the user from Redis
    const redis = getRedisClient();
    const userSessionPattern = createUserSessionPattern(userId);
    const sessionKeys = await redis.keys(userSessionPattern);
    
    if (sessionKeys.length === 0) {
      return [];
    }
    
    // Get all session data
    const sessionDataArray = await redis.mget(...sessionKeys);
    
    // Parse and filter valid sessions
    const sessions: UserSession[] = [];
    for (const sessionData of sessionDataArray) {
      if (!sessionData) continue;
      
      try {
        const session = JSON.parse(sessionData) as UserSession;
        
        // Convert string dates to Date objects
        session.startTime = new Date(session.startTime);
        session.lastActivity = new Date(session.lastActivity);
        if (session.endTime) {
          session.endTime = new Date(session.endTime);
        }
        
        // Include only valid sessions
        if (validateSession(session)) {
          sessions.push(session);
        }
      } catch (parseError) {
        logger.error('Error parsing session data', { error: parseError, sessionData });
      }
    }
    
    return sessions;
  } catch (error) {
    logger.error('Error retrieving active sessions', { error, userId });
    return [];
  }
}

/**
 * Gets the count of active sessions for a specific user
 * @param userId User identifier
 * @returns Number of active sessions
 */
export async function getSessionCount(userId: string): Promise<number> {
  try {
    // Get all sessions for the user
    const sessions = await getActiveSessions(userId);
    return sessions.length;
  } catch (error) {
    logger.error('Error getting session count', { error, userId });
    return 0;
  }
}

/**
 * Enforces maximum session limit by ending oldest sessions if needed
 * @param userId User identifier
 * @param newSession Newly created session
 */
export async function enforceMaxSessions(userId: string, newSession: UserSession): Promise<void> {
  try {
    // Get maximum allowed sessions from configuration
    const maxSessions = auth.sessionSettings.maxConcurrentSessions;
    
    // Get current session count
    const sessions = await getActiveSessions(userId);
    
    // If under the limit, do nothing
    if (sessions.length <= maxSessions) {
      return;
    }
    
    logger.debug('Enforcing max session limit', { 
      userId, 
      currentCount: sessions.length, 
      maxAllowed: maxSessions 
    });
    
    // Sort sessions by start time (oldest first)
    sessions.sort((a, b) => {
      return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
    });
    
    // Exclude the new session we just created
    const oldSessions = sessions.filter(session => session.id !== newSession.id);
    
    // Calculate how many sessions to end
    const sessionsToEnd = oldSessions.slice(0, sessions.length - maxSessions);
    
    // End each excess session
    for (const session of sessionsToEnd) {
      await endSession(session.id);
    }
    
    if (sessionsToEnd.length > 0) {
      logger.info('Ended oldest sessions to enforce maximum limit', { 
        userId, 
        endedCount: sessionsToEnd.length,
        sessionsEnded: sessionsToEnd.map(s => s.id)
      });
      
      // Log session limit enforcement for audit purposes
      await auditLog.logSecurityEvent(
        'SYSTEM',
        `Enforced maximum session limit for user ${userId}`,
        'INFO',
        { 
          maxSessions,
          totalSessionsBefore: sessions.length,
          sessionsEnded: sessionsToEnd.map(s => s.id)
        },
        { userId }
      );
    }
  } catch (error) {
    logger.error('Error enforcing max sessions', { error, userId });
    // Don't throw - just log the error as this shouldn't interrupt the login flow
  }
}