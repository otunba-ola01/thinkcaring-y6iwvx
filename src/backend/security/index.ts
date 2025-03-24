/**
 * Central export file for the security module of the HCBS Revenue Management System.
 * This file aggregates and exports all security-related functionality including encryption,
 * authentication, authorization, audit logging, data masking, session management,
 * role-based access control, and HIPAA compliance features.
 */

// Import encryption module for data protection
import * as encryption from './encryption';

// Import token management module for JWT handling
import * as token from './token';

// Import password policy module for password validation and management
import * as passwordPolicy from './passwordPolicy';

// Import data masking module for PHI/PII protection
import * as dataMasking from './data-masking';

// Import audit logging module for HIPAA compliance
import * as auditLogging from './audit-logging';

// Import session management module for secure user sessions
import * as sessionManagement from './session-management';

// Import role-based access control module for authorization
import * as roleBasedAccess from './role-based-access';

// Import authentication module for user authentication
import * as authentication from './authentication';

// Import authorization module for access control
import * as authorization from './authorization';

// Import HIPAA compliance module for healthcare regulations
import * as hipaaCompliance from './hipaaCompliance';

/**
 * Export encryption functionality for data protection
 */
export { encryption };

/**
 * Export token management functionality for JWT handling
 */
export { token };

/**
 * Export password policy functionality for password validation and management
 */
export { passwordPolicy };

/**
 * Export data masking functionality for PHI/PII protection
 */
export { dataMasking };

/**
 * Export audit logging functionality for HIPAA compliance
 */
export { auditLogging };

/**
 * Export session management functionality for secure user sessions
 */
export { sessionManagement };

/**
 * Export role-based access control functionality for authorization
 */
export { roleBasedAccess };

/**
 * Export authentication functionality for user authentication
 */
export { authentication };

/**
 * Export authorization functionality for access control
 */
export { authorization };

/**
 * Export HIPAA compliance functionality for healthcare regulations
 */
export { hipaaCompliance };