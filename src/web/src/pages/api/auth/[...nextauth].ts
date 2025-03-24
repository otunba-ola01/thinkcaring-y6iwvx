import NextAuth, { NextAuthOptions } from 'next-auth';
import { JWT } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials'; // v4.22+
import { PrismaAdapter } from '@next-auth/prisma-adapter'; // v1.0+
import prisma from '../../../lib/prisma'; // @prisma/client v4.14+

import { authConfig, cookieConfig } from '../../config/auth.config';
import { AUTH_ERROR_MESSAGES, SESSION_SETTINGS } from '../../constants/auth.constants';
import { AuthUser, MfaMethod } from '../../types/auth.types';

/**
 * Verifies user credentials against the database
 * 
 * @param email User email
 * @param password User password
 * @returns Authenticated user if credentials are valid, null otherwise
 */
async function verifyCredentials(
  email: string,
  password: string
): Promise<AuthUser | null> {
  try {
    // Find user by email in the database
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        organization: true,
        role: {
          include: {
            permissions: true
          }
        },
        loginAttempts: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      }
    });

    // Check if user exists and is active
    if (!user || user.status !== 'active') {
      return null;
    }

    // Check if account is locked due to failed attempts
    if (authConfig.accountLockout.enabled && user.loginAttempts.length > 0) {
      const lastAttempt = user.loginAttempts[0];
      
      if (lastAttempt.failedAttempts >= authConfig.accountLockout.maxAttempts) {
        const lockoutTime = new Date(lastAttempt.updatedAt);
        lockoutTime.setMilliseconds(lockoutTime.getMilliseconds() + authConfig.accountLockout.lockoutDuration);
        
        if (new Date() < lockoutTime) {
          throw new Error(AUTH_ERROR_MESSAGES.ACCOUNT_LOCKED);
        }
      }
    }

    // Verify password hash against provided password
    const bcrypt = require('bcryptjs');
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      // Increment failed attempts if authentication fails
      await prisma.loginAttempt.upsert({
        where: { userId: user.id },
        update: {
          failedAttempts: {
            increment: 1
          },
          updatedAt: new Date()
        },
        create: {
          userId: user.id,
          failedAttempts: 1
        }
      });
      
      return null;
    }

    // Reset failed attempts if login is successful
    if (user.loginAttempts.length > 0) {
      await prisma.loginAttempt.update({
        where: { userId: user.id },
        data: {
          failedAttempts: 0,
          updatedAt: new Date()
        }
      });
    }

    // Return user data if authentication is successful
    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role.name,
      permissions: user.role.permissions.map(p => p.name),
      mfaEnabled: user.mfaEnabled,
      lastLogin: user.lastLogin,
      status: user.status,
      organization: {
        id: user.organization.id,
        name: user.organization.name
      }
    };

    return authUser;
  } catch (error) {
    console.error('Error in verifyCredentials:', error);
    throw error;
  }
}

/**
 * Generates an MFA challenge for a user during login
 * 
 * @param user Authenticated user
 * @returns MFA challenge details
 */
async function generateMfaChallenge(
  user: AuthUser
): Promise<{ mfaToken: string; method: MfaMethod }> {
  try {
    // Determine the user's preferred MFA method
    const userPreference = await prisma.userPreference.findUnique({
      where: { userId: user.id },
      select: { preferredMfaMethod: true }
    });
    
    const method = userPreference?.preferredMfaMethod as MfaMethod || MfaMethod.SMS;
    
    // Generate a secure random code
    const crypto = require('crypto');
    const code = crypto.randomInt(100000, 999999).toString();
    
    // Store the code and expiration time in the database
    const bcrypt = require('bcryptjs');
    const hashedCode = await bcrypt.hash(code, 10);
    
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setMilliseconds(expiresAt.getMilliseconds() + authConfig.mfaSettings.codeExpiry);
    
    const mfaChallenge = await prisma.mfaChallenge.create({
      data: {
        userId: user.id,
        method,
        code: hashedCode,
        expiresAt,
        isUsed: false
      }
    });
    
    // Send the code to the user via their preferred method (SMS, email, etc.)
    if (method === MfaMethod.SMS) {
      // Implementation for SMS delivery would go here
      // This might use a service like Twilio or AWS SNS
      console.log(`[MFA Code - SMS] Code ${code} sent to user ${user.id}`);
    } else if (method === MfaMethod.EMAIL) {
      // Implementation for email delivery would go here
      console.log(`[MFA Code - Email] Code ${code} sent to user ${user.id}`);
    }
    
    // Generate and return an MFA token and method
    const jwt = require('jsonwebtoken');
    const mfaToken = jwt.sign(
      { 
        userId: user.id, 
        challengeId: mfaChallenge.id,
        exp: Math.floor(expiresAt.getTime() / 1000)
      },
      process.env.NEXTAUTH_SECRET
    );
    
    return { mfaToken, method };
  } catch (error) {
    console.error('Error in generateMfaChallenge:', error);
    throw error;
  }
}

/**
 * Verifies an MFA code during the authentication process
 * 
 * @param mfaToken MFA token
 * @param code User-provided verification code
 * @returns Authenticated user if MFA code is valid, null otherwise
 */
async function verifyMfaCode(
  mfaToken: string,
  code: string
): Promise<AuthUser | null> {
  try {
    // Decode the MFA token to get the user ID and challenge ID
    const jwt = require('jsonwebtoken');
    let decoded;
    
    try {
      decoded = jwt.verify(mfaToken, process.env.NEXTAUTH_SECRET);
    } catch (jwtError) {
      console.error('Invalid MFA token:', jwtError);
      return null;
    }
    
    const { userId, challengeId } = decoded;
    
    // Retrieve the MFA challenge from the database
    const challenge = await prisma.mfaChallenge.findUnique({
      where: { id: challengeId },
      include: { user: true }
    });
    
    // Check if the challenge exists and hasn't expired
    if (!challenge || challenge.isUsed || new Date() > challenge.expiresAt) {
      return null;
    }
    
    // Verify the provided code against the stored code
    const bcrypt = require('bcryptjs');
    const isCodeValid = await bcrypt.compare(code, challenge.code);
    
    if (!isCodeValid) {
      // Increment attempts and potentially mark as used if max attempts reached
      await prisma.mfaChallenge.update({
        where: { id: challengeId },
        data: { 
          attempts: { increment: 1 },
          isUsed: (challenge.attempts + 1 >= authConfig.mfaSettings.maxAttempts)
        }
      });
      
      return null;
    }
    
    // Mark the challenge as used if verification is successful
    await prisma.mfaChallenge.update({
      where: { id: challengeId },
      data: { isUsed: true }
    });
    
    // Retrieve and return the user if verification is successful
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        organization: true,
        role: {
          include: {
            permissions: true
          }
        }
      }
    });
    
    if (!user) return null;
    
    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role.name,
      permissions: user.role.permissions.map(p => p.name),
      mfaEnabled: user.mfaEnabled,
      lastLogin: user.lastLogin,
      status: user.status,
      organization: {
        id: user.organization.id,
        name: user.organization.name
      }
    };
    
    return authUser;
  } catch (error) {
    console.error('Error in verifyMfaCode:', error);
    return null;
  }
}

/**
 * Handles trusted device registration for MFA
 * 
 * @param userId User ID
 * @param rememberDevice Whether to remember this device
 * @param deviceInfo Information about the device
 * @returns Device token if registered, null otherwise
 */
async function handleTrustedDevice(
  userId: string,
  rememberDevice: boolean,
  deviceInfo: object
): Promise<string | null> {
  // If rememberDevice is false, return null
  if (!rememberDevice) return null;
  
  try {
    // Generate a secure device token
    const crypto = require('crypto');
    const deviceToken = crypto.randomBytes(64).toString('hex');
    
    // Store the device information and token in the database
    const bcrypt = require('bcryptjs');
    const hashedToken = await bcrypt.hash(deviceToken, 10);
    
    // Set expiration based on trusted device days configuration
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + authConfig.mfaSettings.trustedDeviceDays);
    
    await prisma.trustedDevice.create({
      data: {
        userId,
        token: hashedToken,
        deviceName: deviceInfo.name || 'Unknown Device',
        deviceType: deviceInfo.type || 'Unknown',
        browser: deviceInfo.browser || 'Unknown',
        ipAddress: deviceInfo.ipAddress || '',
        expiresAt
      }
    });
    
    // Return the device token
    return deviceToken;
  } catch (error) {
    console.error('Error in handleTrustedDevice:', error);
    return null;
  }
}

/**
 * Validates a user session for continued access
 * 
 * @param session Session object
 * @param token JWT token
 * @returns Updated session object
 */
async function validateSession(session: object, token: object): Promise<object> {
  // Check if the session has expired based on last activity
  if (token.lastActivity) {
    const lastActivity = new Date(token.lastActivity);
    const now = new Date();
    const idleTimeMs = now.getTime() - lastActivity.getTime();
    
    if (idleTimeMs > SESSION_SETTINGS.IDLE_TIMEOUT) {
      throw new Error(AUTH_ERROR_MESSAGES.SESSION_EXPIRED);
    }
    
    // Update last activity timestamp if session is still valid
    token.lastActivity = now.toISOString();
  }
  
  // Check if user still has required permissions
  try {
    const user = await prisma.user.findUnique({
      where: { id: token.sub },
      select: { 
        status: true, 
        role: { 
          include: { 
            permissions: true 
          } 
        } 
      }
    });
    
    if (!user || user.status !== 'active') {
      throw new Error('User is no longer active');
    }
    
    // Update permissions if needed
    if (user.role && user.role.permissions) {
      token.permissions = user.role.permissions.map(p => p.name);
    }
    
    // Return updated session if valid
    return {
      ...session,
      user: {
        ...session.user,
        permissions: token.permissions
      },
      expires: new Date(Date.now() + SESSION_SETTINGS.IDLE_TIMEOUT).toISOString()
    };
  } catch (error) {
    console.error('Error validating session:', error);
    throw new Error('Session validation failed');
  }
}

/**
 * NextAuth configuration options defining providers, callbacks, and session handling
 */
const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Email and Password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        rememberMe: { label: 'Remember Me', type: 'boolean' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error(AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS);
        }

        try {
          // Call verifyCredentials function to authenticate user
          const user = await verifyCredentials(
            credentials.email,
            credentials.password
          );
          
          // If authentication fails, throw CredentialsSignin error
          if (!user) {
            throw new Error(AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS);
          }
          
          // If user has MFA enabled, generate MFA challenge
          if (user.mfaEnabled && authConfig.mfaSettings.enabled) {
            const { mfaToken, method } = await generateMfaChallenge(user);
            
            // If MFA is required, return object with mfaRequired flag and token
            return {
              id: user.id,
              email: user.email,
              name: `${user.firstName} ${user.lastName}`,
              mfaRequired: true,
              mfaToken,
              mfaMethod: method
            };
          }
          
          // If MFA is not required, return user object for session creation
          return {
            id: user.id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            role: user.role,
            permissions: user.permissions,
            organizationId: user.organization.id,
            rememberMe: credentials.rememberMe === 'true'
          };
        } catch (error) {
          console.error('Authorization error:', error);
          throw error;
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: SESSION_SETTINGS.IDLE_TIMEOUT
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
    maxAge: SESSION_SETTINGS.IDLE_TIMEOUT
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token',
      options: {
        httpOnly: cookieConfig.httpOnly,
        secure: cookieConfig.secure,
        sameSite: cookieConfig.sameSite,
        path: cookieConfig.path
      }
    },
    callbackUrl: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.callback-url' : 'next-auth.callback-url',
      options: {
        httpOnly: cookieConfig.httpOnly,
        secure: cookieConfig.secure,
        sameSite: cookieConfig.sameSite,
        path: cookieConfig.path
      }
    },
    csrfToken: {
      name: process.env.NODE_ENV === 'production' ? '__Host-next-auth.csrf-token' : 'next-auth.csrf-token',
      options: {
        httpOnly: true,
        secure: cookieConfig.secure,
        sameSite: cookieConfig.sameSite,
        path: cookieConfig.path
      }
    }
  },
  pages: {
    signIn: '/login',
    error: '/login',
    verifyRequest: '/mfa'
  },
  callbacks: {
    async jwt({ token, user, account, trigger, session }) {
      // Extract token and user from parameters
      // If first-time sign in, add user data to token
      if (user) {
        token.sub = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
        token.permissions = user.permissions;
        token.organizationId = user.organizationId;
        token.lastActivity = new Date().toISOString();
        
        // If MFA is required, add mfaRequired flag and token to JWT
        if (user.mfaRequired) {
          token.mfaRequired = true;
          token.mfaToken = user.mfaToken;
          token.mfaMethod = user.mfaMethod;
        }
        
        // Extend token lifetime if "remember me" is selected
        if (user.rememberMe) {
          const extendedExpiry = new Date();
          extendedExpiry.setDate(extendedExpiry.getDate() + 30); // 30 days
          token.extendedExpiry = extendedExpiry.toISOString();
        }
      }
      
      // If token has mfaRequired flag and MFA verification is complete, update token
      if (token.mfaRequired && session?.mfaVerified) {
        delete token.mfaRequired;
        delete token.mfaToken;
        delete token.mfaMethod;
        
        // Update user data from verified MFA session
        if (session.user) {
          Object.assign(token, {
            role: session.user.role,
            permissions: session.user.permissions
          });
        }
        
        // Mark session as freshly authenticated
        token.lastActivity = new Date().toISOString();
      }
      
      // Add last activity timestamp to token for session timeout tracking
      if (trigger === 'update' && session) {
        token.lastActivity = new Date().toISOString();
        
        // Update any changed properties from session
        if (session.newPermissions) {
          token.permissions = session.newPermissions;
        }
      }
      
      return token;
    },
    
    async session({ session, token }) {
      // Call validateSession to ensure session is still valid
      try {
        session = await validateSession(session, token);
      } catch (error) {
        throw error; // This will force a new login
      }
      
      // Copy user data from token to session
      session.user.id = token.sub;
      session.user.email = token.email;
      session.user.name = token.name;
      
      // Add permissions and role information to session
      session.user.role = token.role;
      session.user.permissions = token.permissions;
      session.user.organizationId = token.organizationId;
      
      // Include MFA state if needed
      if (token.mfaRequired) {
        session.mfaRequired = true;
        session.mfaToken = token.mfaToken;
        session.mfaMethod = token.mfaMethod;
      }
      
      // Return updated session object
      return session;
    },
    
    async redirect({ url, baseUrl }) {
      // If MFA is required, redirect to MFA verification page
      if (url.startsWith(baseUrl) && url.includes('mfaRequired=true')) {
        return `${baseUrl}/mfa`;
      }
      
      // If url starts with baseUrl, return url (internal redirect)
      if (url.startsWith(baseUrl)) {
        return url;
      }
      
      // Otherwise, return baseUrl (prevent open redirects)
      return baseUrl;
    }
  },
  events: {
    async signIn({ user }) {
      // Log successful sign-in for audit purposes
      try {
        const clientIp = ''; // Would be populated from request in actual implementation
        const userAgent = ''; // Would be populated from request in actual implementation
        
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: 'SIGN_IN',
            details: {
              ip: clientIp,
              userAgent: userAgent
            }
          }
        });
        
        // Update user's last login timestamp
        await prisma.user.update({
          where: { id: user.id },
          data: {
            lastLogin: new Date()
          }
        });
      } catch (error) {
        console.error('Error logging sign-in event:', error);
      }
    },
    
    async signOut({ token }) {
      // Log sign-out for audit purposes
      try {
        if (token?.sub) {
          const clientIp = ''; // Would be populated from request in actual implementation
          const userAgent = ''; // Would be populated from request in actual implementation
          
          await prisma.auditLog.create({
            data: {
              userId: token.sub,
              action: 'SIGN_OUT',
              details: {
                ip: clientIp,
                userAgent: userAgent
              }
            }
          });
          
          // Clear any trusted device cookies
          // This would be handled in the API response
        }
      } catch (error) {
        console.error('Error logging sign-out event:', error);
      }
    }
  },
  debug: process.env.NODE_ENV === 'development'
};

export default NextAuth(authOptions);