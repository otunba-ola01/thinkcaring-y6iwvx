import {
  User,
  UserStatus,
  UserProfile
} from '../types/users.types';

import {
  MfaMethod,
  AuthProvider
} from '../types/auth.types';

import {
  UUID,
  Timestamp,
  ContactInfo
} from '../types/common.types';

import { userRepository } from '../database/repositories/user.repository';

/**
 * Model class representing a user in the HCBS Revenue Management System.
 * Provides methods for user-related operations including authentication,
 * password management, and role-based access control.
 */
export class UserModel {
  id: UUID;
  email: string;
  firstName: string;
  lastName: string;
  passwordHash: string;
  passwordSalt: string;
  passwordLastChanged: Timestamp | null;
  passwordResetRequired: boolean;
  roleId: UUID;
  roleName: string | null;
  status: UserStatus;
  failedLoginAttempts: number;
  lockedUntil: Timestamp | null;
  lastLogin: Timestamp | null;
  mfaEnabled: boolean;
  mfaMethod: MfaMethod | null;
  authProvider: AuthProvider;
  contactInfo: ContactInfo;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: UUID | null;
  updatedBy: UUID | null;

  /**
   * Creates a new UserModel instance
   * @param userData User data to initialize the model with
   */
  constructor(userData: User) {
    this.id = userData.id;
    this.email = userData.email;
    this.firstName = userData.firstName;
    this.lastName = userData.lastName;
    this.passwordHash = userData.passwordHash;
    this.passwordSalt = userData.passwordSalt;
    this.passwordLastChanged = userData.passwordLastChanged || null;
    this.passwordResetRequired = userData.passwordResetRequired || false;
    this.roleId = userData.roleId;
    this.roleName = null; // Will be populated when loading with role
    this.status = userData.status;
    this.failedLoginAttempts = userData.failedLoginAttempts || 0;
    this.lockedUntil = userData.lockedUntil || null;
    this.lastLogin = userData.lastLogin || null;
    this.mfaEnabled = userData.mfaEnabled || false;
    this.mfaMethod = userData.mfaMethod || null;
    this.authProvider = userData.authProvider;
    this.contactInfo = userData.contactInfo;
    this.createdAt = userData.createdAt;
    this.updatedAt = userData.updatedAt;
    this.createdBy = userData.createdBy || null;
    this.updatedBy = userData.updatedBy || null;
  }

  /**
   * Gets the user's full name
   * @returns The user's full name (firstName + lastName)
   */
  getFullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  /**
   * Checks if the user account is active
   * @returns True if the user status is ACTIVE
   */
  isActive(): boolean {
    return this.status === UserStatus.ACTIVE;
  }

  /**
   * Checks if the user account is locked
   * @returns True if the user status is LOCKED
   */
  isLocked(): boolean {
    return this.status === UserStatus.LOCKED;
  }

  /**
   * Checks if the user needs to reset their password
   * @returns True if password reset is required or status is PASSWORD_RESET
   */
  requiresPasswordReset(): boolean {
    return this.passwordResetRequired || this.status === UserStatus.PASSWORD_RESET;
  }

  /**
   * Checks if multi-factor authentication is enabled for the user
   * @returns True if MFA is enabled
   */
  hasMfaEnabled(): boolean {
    return this.mfaEnabled;
  }

  /**
   * Verifies if the provided password matches the user's password
   * @param password Password to verify
   * @returns True if the password is correct
   */
  async verifyPassword(password: string): Promise<boolean> {
    return await userRepository.verifyPassword(this, password);
  }

  /**
   * Changes the user's password
   * @param newPassword New password
   * @param updatedBy ID of the user making the update, or null for system updates
   * @returns True if the password was changed successfully
   */
  async changePassword(newPassword: string, updatedBy: UUID | null = null): Promise<boolean> {
    return await userRepository.updatePassword(this.id, newPassword, updatedBy);
  }

  /**
   * Activates the user account
   * @param updatedBy ID of the user making the update, or null for system updates
   * @returns True if the account was activated successfully
   */
  async activate(updatedBy: UUID | null = null): Promise<boolean> {
    return await userRepository.updateStatus(this.id, UserStatus.ACTIVE, updatedBy);
  }

  /**
   * Deactivates the user account
   * @param updatedBy ID of the user making the update, or null for system updates
   * @returns True if the account was deactivated successfully
   */
  async deactivate(updatedBy: UUID | null = null): Promise<boolean> {
    return await userRepository.updateStatus(this.id, UserStatus.INACTIVE, updatedBy);
  }

  /**
   * Locks the user account until a specified time
   * @param lockedUntil Timestamp until which the account is locked
   * @param updatedBy ID of the user making the update, or null for system updates
   * @returns True if the account was locked successfully
   */
  async lock(lockedUntil: Timestamp, updatedBy: UUID | null = null): Promise<boolean> {
    return await userRepository.lockAccount(this.id, lockedUntil, updatedBy);
  }

  /**
   * Unlocks the user account
   * @param updatedBy ID of the user making the update, or null for system updates
   * @returns True if the account was unlocked successfully
   */
  async unlock(updatedBy: UUID | null = null): Promise<boolean> {
    return await userRepository.unlockAccount(this.id, updatedBy);
  }

  /**
   * Updates the last login timestamp for the user
   * @returns True if the timestamp was updated successfully
   */
  async updateLastLogin(): Promise<boolean> {
    return await userRepository.updateLastLogin(this.id);
  }

  /**
   * Converts the user model to a user profile object for client responses
   * @returns User profile object without sensitive information
   */
  toProfile(): UserProfile {
    return {
      id: this.id,
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName,
      fullName: this.getFullName(),
      roleId: this.roleId,
      roleName: this.roleName || '',
      status: this.status,
      lastLogin: this.lastLogin,
      mfaEnabled: this.mfaEnabled,
      mfaMethod: this.mfaMethod,
      authProvider: this.authProvider,
      contactInfo: this.contactInfo,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * Finds a user by ID and returns a UserModel instance
   * @param id User ID
   * @returns UserModel instance if found, null otherwise
   */
  static async findById(id: UUID): Promise<UserModel | null> {
    const user = await userRepository.findById(id);
    if (!user) return null;
    return new UserModel(user);
  }

  /**
   * Finds a user by email and returns a UserModel instance
   * @param email User email
   * @returns UserModel instance if found, null otherwise
   */
  static async findByEmail(email: string): Promise<UserModel | null> {
    const user = await userRepository.findByEmail(email);
    if (!user) return null;
    return new UserModel(user);
  }

  /**
   * Finds a user with role information by ID
   * @param id User ID
   * @returns UserModel instance with role information if found, null otherwise
   */
  static async findWithRole(id: UUID): Promise<UserModel | null> {
    const userWithRole = await userRepository.findWithRoleById(id);
    if (!userWithRole) return null;
    
    const userModel = new UserModel(userWithRole.user);
    userModel.roleName = userWithRole.role.name;
    return userModel;
  }
}