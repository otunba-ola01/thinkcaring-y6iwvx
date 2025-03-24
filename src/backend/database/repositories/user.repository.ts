import bcrypt from 'bcrypt'; // bcrypt v5.1.0
import { BaseRepository } from './base.repository';
import { 
  User,
  UserWithRole,
  UserStatus,
  UserFilterParams
} from '../../types/users.types';
import {
  UUID,
  Timestamp
} from '../../types/common.types';
import {
  PaginatedResult,
  Pagination,
  OrderBy,
  RepositoryOptions,
  Transaction
} from '../../types/database.types';
import { getKnexInstance } from '../connection';
import { DatabaseError } from '../../errors/database-error';
import { logger } from '../../utils/logger';

/**
 * Repository class for user entity database operations
 */
class UserRepository extends BaseRepository<User> {
  /**
   * Creates a new UserRepository instance
   */
  constructor() {
    // Call the parent BaseRepository constructor with 'users' table name
    super('users', 'id', true);
  }

  /**
   * Finds a user by email address
   * 
   * @param email Email address to search for
   * @param options Repository options
   * @returns User if found, null otherwise
   */
  async findByEmail(email: string, options: RepositoryOptions = {}): Promise<User | null> {
    try {
      logger.debug(`Finding user by email: ${email}`);
      // Get a query builder for the users table
      const queryBuilder = this.getQueryBuilder(options.transaction);
      
      // Add a where condition for the email (case insensitive)
      const result = await queryBuilder
        .whereRaw('LOWER(email) = LOWER(?)', [email])
        .first();
      
      // Return the first result or null if not found
      return result ? this.mapDbUserToUser(result) : null;
    } catch (error) {
      // Handle database errors with proper error translation
      this.handleDatabaseError(error, 'findByEmail');
    }
  }

  /**
   * Finds a user with their associated role information by ID
   * 
   * @param id User ID
   * @param options Repository options
   * @returns User with role if found, null otherwise
   */
  async findWithRoleById(id: UUID, options: RepositoryOptions = {}): Promise<UserWithRole | null> {
    try {
      logger.debug(`Finding user with role by ID: ${id}`);
      
      // Get a query builder for the users table
      const queryBuilder = this.getQueryBuilder(options.transaction);
      
      // Join with the roles table on roleId
      // Left join with the permission_grants table
      // Left join with the permissions table
      const results = await queryBuilder
        .select([
          'users.*',
          'roles.id as role_id',
          'roles.name as role_name',
          'roles.description as role_description',
          'roles.is_system as role_is_system',
          'roles.created_at as role_created_at',
          'roles.updated_at as role_updated_at',
          'roles.created_by as role_created_by',
          'roles.updated_by as role_updated_by',
          'permissions.id as permission_id',
          'permissions.name as permission_name',
          'permissions.description as permission_description',
          'permissions.category as permission_category',
          'permissions.action as permission_action',
          'permissions.resource as permission_resource',
          'permissions.is_system as permission_is_system'
        ])
        .leftJoin('roles', 'users.role_id', 'roles.id')
        .leftJoin('permission_grants', 'roles.id', 'permission_grants.role_id')
        .leftJoin('permissions', 'permission_grants.permission_id', 'permissions.id')
        .where('users.id', id);
      
      if (!results || results.length === 0) {
        return null;
      }
      
      // Transform the results to group permissions with the role
      const user = this.mapDbUserToUser(results[0]);
      
      // Filter out rows where permission is null
      const permissions = results
        .filter(row => row.permission_id)
        .map(row => ({
          id: row.permission_id,
          name: row.permission_name,
          description: row.permission_description,
          category: row.permission_category,
          action: row.permission_action,
          resource: row.permission_resource,
          isSystem: row.permission_is_system === 1 || row.permission_is_system === true
        }));
      
      const role = {
        id: results[0].role_id,
        name: results[0].role_name,
        description: results[0].role_description,
        isSystem: results[0].role_is_system === 1 || results[0].role_is_system === true,
        permissions,
        createdAt: results[0].role_created_at,
        updatedAt: results[0].role_updated_at,
        createdBy: results[0].role_created_by,
        updatedBy: results[0].role_updated_by
      };
      
      // Return the user with role information
      return { user, role };
    } catch (error) {
      // Handle database errors with proper error translation
      this.handleDatabaseError(error, 'findWithRoleById');
    }
  }

  /**
   * Finds users based on filter criteria with pagination and sorting
   * 
   * @param filter Filter criteria
   * @param pagination Pagination parameters
   * @param orderBy Sorting parameters
   * @param options Repository options
   * @returns Paginated list of users
   */
  async findUsers(
    filter: UserFilterParams = {},
    pagination: Pagination = { page: 1, limit: 25 },
    orderBy: OrderBy[] = [],
    options: RepositoryOptions = {}
  ): Promise<PaginatedResult<User>> {
    try {
      logger.debug('Finding users with filter', { filter, pagination, orderBy });
      
      // Get a query builder for the users table
      const queryBuilder = this.getQueryBuilder(options.transaction);
      
      // Apply filter conditions (status, roleId, search, etc.)
      if (filter.status) {
        if (Array.isArray(filter.status)) {
          queryBuilder.whereIn('status', filter.status);
        } else {
          queryBuilder.where('status', filter.status);
        }
      }
      
      if (filter.roleId) {
        if (Array.isArray(filter.roleId)) {
          queryBuilder.whereIn('role_id', filter.roleId);
        } else {
          queryBuilder.where('role_id', filter.roleId);
        }
      }
      
      if (filter.mfaEnabled !== undefined) {
        queryBuilder.where('mfa_enabled', filter.mfaEnabled);
      }
      
      if (filter.createdAfter) {
        queryBuilder.where('created_at', '>=', filter.createdAfter);
      }
      
      if (filter.createdBefore) {
        queryBuilder.where('created_at', '<=', filter.createdBefore);
      }
      
      if (filter.lastLoginAfter) {
        queryBuilder.where('last_login', '>=', filter.lastLoginAfter);
      }
      
      if (filter.lastLoginBefore) {
        queryBuilder.where('last_login', '<=', filter.lastLoginBefore);
      }
      
      if (filter.search) {
        queryBuilder.where(function() {
          this.whereRaw('LOWER(email) LIKE ?', [`%${filter.search.toLowerCase()}%`])
            .orWhereRaw('LOWER(first_name) LIKE ?', [`%${filter.search.toLowerCase()}%`])
            .orWhereRaw('LOWER(last_name) LIKE ?', [`%${filter.search.toLowerCase()}%`]);
        });
      }
      
      // Create count query
      const countQuery = queryBuilder.clone().count({ count: '*' }).first();
      
      // Apply pagination parameters
      const paginatedQuery = this.applyPagination(queryBuilder.clone(), pagination);
      
      // Apply sorting parameters
      const sortedQuery = this.applyOrderBy(paginatedQuery, orderBy);
      
      // Execute the query
      const [users, countResult] = await Promise.all([
        sortedQuery,
        countQuery
      ]);
      
      const total = parseInt(countResult.count, 10);
      const totalPages = Math.ceil(total / pagination.limit);
      
      // Return paginated results
      return {
        data: users.map(user => this.mapDbUserToUser(user)),
        total,
        page: pagination.page,
        limit: pagination.limit,
        totalPages
      };
    } catch (error) {
      // Handle database errors with proper error translation
      this.handleDatabaseError(error, 'findUsers');
    }
  }

  /**
   * Creates a new user with hashed password
   * 
   * @param userData User data without ID, password hash, and salt
   * @param password Plain text password
   * @param options Repository options
   * @returns Created user
   */
  async createUser(
    userData: Omit<User, 'id' | 'passwordHash' | 'passwordSalt'>,
    password: string,
    options: RepositoryOptions = {}
  ): Promise<User> {
    try {
      logger.debug('Creating new user');
      
      // Generate a salt for password hashing
      const salt = await bcrypt.genSalt(12);
      
      // Hash the password with the generated salt
      const passwordHash = await bcrypt.hash(password, salt);
      
      // Prepare user data with hashed password and salt
      const userToCreate = {
        ...userData,
        passwordHash,
        passwordSalt: salt
      };
      
      // Transform user object to DB format
      const dbUser = this.mapUserToDbUser(userToCreate);
      
      // Call the base create method to insert the user
      const createdUser = await this.create(dbUser, options);
      
      // Return the created user
      return this.mapDbUserToUser(createdUser);
    } catch (error) {
      // Handle database errors with proper error translation
      this.handleDatabaseError(error, 'createUser');
    }
  }

  /**
   * Updates a user's password
   * 
   * @param userId User ID
   * @param newPassword New password
   * @param updatedBy ID of the user making the update, or null for system updates
   * @param options Repository options
   * @returns True if password was updated successfully
   */
  async updatePassword(
    userId: UUID,
    newPassword: string,
    updatedBy: UUID | null = null,
    options: RepositoryOptions = {}
  ): Promise<boolean> {
    try {
      logger.debug(`Updating password for user: ${userId}`);
      
      // Generate a new salt for password hashing
      const salt = await bcrypt.genSalt(12);
      
      // Hash the new password with the generated salt
      const passwordHash = await bcrypt.hash(newPassword, salt);
      
      // Get a query builder for the users table
      const queryBuilder = this.getQueryBuilder(options.transaction);
      
      // Prepare update data with new password hash, salt, and timestamps
      const updateData: any = {
        password_hash: passwordHash,
        password_salt: salt,
        password_last_changed: new Date(),
        password_reset_required: false,
        updated_at: new Date()
      };
      
      // Add updated_by if provided
      if (updatedBy) {
        updateData.updated_by = updatedBy;
      }
      
      // Add a where condition for the user ID
      // Execute the update query
      const result = await queryBuilder
        .where('id', userId)
        .update(updateData);
      
      // Return true if the update was successful
      return result > 0;
    } catch (error) {
      // Handle database errors with proper error translation
      this.handleDatabaseError(error, 'updatePassword');
    }
  }

  /**
   * Verifies if a password matches the stored hash for a user
   * 
   * @param user User object with password hash
   * @param password Password to verify
   * @returns True if password matches
   */
  async verifyPassword(user: User, password: string): Promise<boolean> {
    try {
      // Use bcrypt to compare the provided password with the stored hash
      return await bcrypt.compare(password, user.passwordHash);
    } catch (error) {
      // Handle any errors during verification
      logger.error('Error verifying password', { error });
      return false;
    }
  }

  /**
   * Updates a user's status
   * 
   * @param userId User ID
   * @param status New status
   * @param updatedBy ID of the user making the update, or null for system updates
   * @param options Repository options
   * @returns True if status was updated successfully
   */
  async updateStatus(
    userId: UUID,
    status: UserStatus,
    updatedBy: UUID | null = null,
    options: RepositoryOptions = {}
  ): Promise<boolean> {
    try {
      logger.debug(`Updating status for user: ${userId} to ${status}`);
      
      // Get a query builder for the users table
      const queryBuilder = this.getQueryBuilder(options.transaction);
      
      // Prepare update data with new status and updated timestamp
      const updateData: any = {
        status,
        updated_at: new Date()
      };
      
      // Add updated_by if provided
      if (updatedBy) {
        updateData.updated_by = updatedBy;
      }
      
      // Add a where condition for the user ID
      // Execute the update query
      const result = await queryBuilder
        .where('id', userId)
        .update(updateData);
      
      // Return true if the update was successful
      return result > 0;
    } catch (error) {
      // Handle database errors with proper error translation
      this.handleDatabaseError(error, 'updateStatus');
    }
  }

  /**
   * Increments the failed login attempts counter for a user
   * 
   * @param userId User ID
   * @param options Repository options
   * @returns New failed login attempts count
   */
  async incrementFailedLoginAttempts(
    userId: UUID,
    options: RepositoryOptions = {}
  ): Promise<number> {
    try {
      logger.debug(`Incrementing failed login attempts for user: ${userId}`);
      
      // Get a query builder for the users table
      const queryBuilder = this.getQueryBuilder(options.transaction);
      
      // Use a knex increment operation for the failed_login_attempts field
      const [result] = await queryBuilder
        .where('id', userId)
        .increment('failed_login_attempts', 1)
        .update({
          updated_at: new Date()
        }, ['failed_login_attempts']);
      
      // Return the new failed login attempts count
      return result.failed_login_attempts;
    } catch (error) {
      // Handle database errors with proper error translation
      this.handleDatabaseError(error, 'incrementFailedLoginAttempts');
    }
  }

  /**
   * Resets the failed login attempts counter for a user
   * 
   * @param userId User ID
   * @param options Repository options
   * @returns True if counter was reset successfully
   */
  async resetFailedLoginAttempts(
    userId: UUID,
    options: RepositoryOptions = {}
  ): Promise<boolean> {
    try {
      logger.debug(`Resetting failed login attempts for user: ${userId}`);
      
      // Get a query builder for the users table
      const queryBuilder = this.getQueryBuilder(options.transaction);
      
      // Prepare update data to set failed_login_attempts to 0
      // Execute the update query
      const result = await queryBuilder
        .where('id', userId)
        .update({
          failed_login_attempts: 0,
          updated_at: new Date()
        });
      
      // Return true if the update was successful
      return result > 0;
    } catch (error) {
      // Handle database errors with proper error translation
      this.handleDatabaseError(error, 'resetFailedLoginAttempts');
    }
  }

  /**
   * Locks a user account until a specified time
   * 
   * @param userId User ID
   * @param lockedUntil Timestamp until which the account is locked
   * @param updatedBy ID of the user making the update, or null for system updates
   * @param options Repository options
   * @returns True if account was locked successfully
   */
  async lockAccount(
    userId: UUID,
    lockedUntil: Timestamp,
    updatedBy: UUID | null = null,
    options: RepositoryOptions = {}
  ): Promise<boolean> {
    try {
      logger.debug(`Locking user account: ${userId} until ${lockedUntil}`);
      
      // Get a query builder for the users table
      const queryBuilder = this.getQueryBuilder(options.transaction);
      
      // Prepare update data with LOCKED status and lockedUntil timestamp
      const updateData: any = {
        status: UserStatus.LOCKED,
        locked_until: lockedUntil,
        updated_at: new Date()
      };
      
      // Add updated_by if provided
      if (updatedBy) {
        updateData.updated_by = updatedBy;
      }
      
      // Add a where condition for the user ID
      // Execute the update query
      const result = await queryBuilder
        .where('id', userId)
        .update(updateData);
      
      // Return true if the update was successful
      return result > 0;
    } catch (error) {
      // Handle database errors with proper error translation
      this.handleDatabaseError(error, 'lockAccount');
    }
  }

  /**
   * Unlocks a user account
   * 
   * @param userId User ID
   * @param updatedBy ID of the user making the update, or null for system updates
   * @param options Repository options
   * @returns True if account was unlocked successfully
   */
  async unlockAccount(
    userId: UUID,
    updatedBy: UUID | null = null,
    options: RepositoryOptions = {}
  ): Promise<boolean> {
    try {
      logger.debug(`Unlocking user account: ${userId}`);
      
      // Get a query builder for the users table
      const queryBuilder = this.getQueryBuilder(options.transaction);
      
      // Prepare update data with ACTIVE status, null lockedUntil, and reset failed attempts
      const updateData: any = {
        status: UserStatus.ACTIVE,
        locked_until: null,
        failed_login_attempts: 0,
        updated_at: new Date()
      };
      
      // Add updated_by if provided
      if (updatedBy) {
        updateData.updated_by = updatedBy;
      }
      
      // Add a where condition for the user ID
      // Execute the update query
      const result = await queryBuilder
        .where('id', userId)
        .update(updateData);
      
      // Return true if the update was successful
      return result > 0;
    } catch (error) {
      // Handle database errors with proper error translation
      this.handleDatabaseError(error, 'unlockAccount');
    }
  }

  /**
   * Updates the last login timestamp for a user
   * 
   * @param userId User ID
   * @param options Repository options
   * @returns True if timestamp was updated successfully
   */
  async updateLastLogin(
    userId: UUID,
    options: RepositoryOptions = {}
  ): Promise<boolean> {
    try {
      logger.debug(`Updating last login timestamp for user: ${userId}`);
      
      // Get a query builder for the users table
      const queryBuilder = this.getQueryBuilder(options.transaction);
      
      // Prepare update data with current timestamp for last_login
      // Add a where condition for the user ID
      // Execute the update query
      const result = await queryBuilder
        .where('id', userId)
        .update({
          last_login: new Date(),
          updated_at: new Date()
        });
      
      // Return true if the update was successful
      return result > 0;
    } catch (error) {
      // Handle database errors with proper error translation
      this.handleDatabaseError(error, 'updateLastLogin');
    }
  }

  /**
   * Updates the multi-factor authentication settings for a user
   * 
   * @param userId User ID
   * @param mfaEnabled Whether MFA is enabled
   * @param mfaMethod MFA method
   * @param mfaSecret MFA secret
   * @param updatedBy ID of the user making the update, or null for system updates
   * @param options Repository options
   * @returns True if MFA settings were updated successfully
   */
  async updateMfaSettings(
    userId: UUID,
    mfaEnabled: boolean,
    mfaMethod: string | null,
    mfaSecret: string | null,
    updatedBy: UUID | null = null,
    options: RepositoryOptions = {}
  ): Promise<boolean> {
    try {
      logger.debug(`Updating MFA settings for user: ${userId}`, { mfaEnabled, mfaMethod });
      
      // Get a query builder for the users table
      const queryBuilder = this.getQueryBuilder(options.transaction);
      
      // Prepare update data with MFA settings and updated timestamp
      const updateData: any = {
        mfa_enabled: mfaEnabled,
        mfa_method: mfaMethod,
        mfa_secret: mfaSecret,
        updated_at: new Date()
      };
      
      // Add updated_by if provided
      if (updatedBy) {
        updateData.updated_by = updatedBy;
      }
      
      // Add a where condition for the user ID
      // Execute the update query
      const result = await queryBuilder
        .where('id', userId)
        .update(updateData);
      
      // Return true if the update was successful
      return result > 0;
    } catch (error) {
      // Handle database errors with proper error translation
      this.handleDatabaseError(error, 'updateMfaSettings');
    }
  }

  /**
   * Stores a password in the user's password history
   * 
   * @param userId User ID
   * @param passwordHash Hashed password
   * @param options Repository options
   * @returns True if password was stored successfully
   */
  async storePasswordHistory(
    userId: UUID,
    passwordHash: string,
    options: RepositoryOptions = {}
  ): Promise<boolean> {
    try {
      logger.debug(`Storing password history for user: ${userId}`);
      
      // Get a query builder for the password_history table
      const knex = getKnexInstance();
      let queryBuilder = knex('password_history');
      
      // Use transaction if provided
      if (options.transaction) {
        queryBuilder = options.transaction('password_history');
      }
      
      // Prepare insert data with user ID, password hash, and timestamp
      // Execute the insert query
      await queryBuilder.insert({
        user_id: userId,
        password_hash: passwordHash,
        created_at: new Date()
      });
      
      // Trim history to keep only the most recent entries (e.g., last 10)
      const history = await queryBuilder
        .where('user_id', userId)
        .orderBy('created_at', 'desc')
        .select('id');
      
      if (history.length > 10) {
        const idsToKeep = history.slice(0, 10).map(h => h.id);
        await queryBuilder
          .where('user_id', userId)
          .whereNotIn('id', idsToKeep)
          .delete();
      }
      
      // Return true if the insert was successful
      return true;
    } catch (error) {
      // Handle database errors with proper error translation
      this.handleDatabaseError(error, 'storePasswordHistory');
    }
  }

  /**
   * Gets the password history for a user
   * 
   * @param userId User ID
   * @param limit Maximum number of history entries to retrieve
   * @param options Repository options
   * @returns Password history entries
   */
  async getPasswordHistory(
    userId: UUID,
    limit: number = 10,
    options: RepositoryOptions = {}
  ): Promise<{ passwordHash: string; createdAt: Timestamp }[]> {
    try {
      logger.debug(`Getting password history for user: ${userId}`);
      
      // Get a query builder for the password_history table
      const knex = getKnexInstance();
      let queryBuilder = knex('password_history');
      
      // Use transaction if provided
      if (options.transaction) {
        queryBuilder = options.transaction('password_history');
      }
      
      // Add a where condition for the user ID
      // Order by creation date descending
      // Limit the number of results
      // Execute the query
      const history = await queryBuilder
        .where('user_id', userId)
        .orderBy('created_at', 'desc')
        .limit(limit)
        .select('password_hash', 'created_at');
      
      // Return the password history entries
      return history.map(h => ({
        passwordHash: h.password_hash,
        createdAt: h.created_at
      }));
    } catch (error) {
      // Handle database errors with proper error translation
      this.handleDatabaseError(error, 'getPasswordHistory');
    }
  }

  /**
   * Maps a database user record to a User object
   * @param dbUser Database user record
   * @returns User object
   */
  private mapDbUserToUser(dbUser: any): User {
    if (!dbUser) return null;
    
    return {
      id: dbUser.id,
      email: dbUser.email,
      firstName: dbUser.first_name,
      lastName: dbUser.last_name,
      passwordHash: dbUser.password_hash,
      passwordSalt: dbUser.password_salt,
      passwordLastChanged: dbUser.password_last_changed,
      passwordResetRequired: dbUser.password_reset_required === 1 || dbUser.password_reset_required === true,
      roleId: dbUser.role_id,
      status: dbUser.status,
      failedLoginAttempts: dbUser.failed_login_attempts,
      lockedUntil: dbUser.locked_until,
      lastLogin: dbUser.last_login,
      mfaEnabled: dbUser.mfa_enabled === 1 || dbUser.mfa_enabled === true,
      mfaMethod: dbUser.mfa_method,
      mfaSecret: dbUser.mfa_secret,
      authProvider: dbUser.auth_provider,
      contactInfo: dbUser.contact_info,
      createdAt: dbUser.created_at,
      updatedAt: dbUser.updated_at,
      createdBy: dbUser.created_by,
      updatedBy: dbUser.updated_by,
      deletedAt: dbUser.deleted_at,
      deletedBy: dbUser.deleted_by
    };
  }

  /**
   * Maps a User object to a database user record
   * @param user User object
   * @returns Database user record
   */
  private mapUserToDbUser(user: any): any {
    if (!user) return null;
    
    return {
      id: user.id,
      email: user.email,
      first_name: user.firstName,
      last_name: user.lastName,
      password_hash: user.passwordHash,
      password_salt: user.passwordSalt,
      password_last_changed: user.passwordLastChanged,
      password_reset_required: user.passwordResetRequired,
      role_id: user.roleId,
      status: user.status,
      failed_login_attempts: user.failedLoginAttempts,
      locked_until: user.lockedUntil,
      last_login: user.lastLogin,
      mfa_enabled: user.mfaEnabled,
      mfa_method: user.mfaMethod,
      mfa_secret: user.mfaSecret,
      auth_provider: user.authProvider,
      contact_info: user.contactInfo,
      created_at: user.createdAt,
      updated_at: user.updatedAt,
      created_by: user.createdBy,
      updated_by: user.updatedBy,
      deleted_at: user.deletedAt,
      deleted_by: user.deletedBy
    };
  }
}

// Create singleton instance
const userRepository = new UserRepository();

// Export the repository instance
export { userRepository };