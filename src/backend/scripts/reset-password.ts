#!/usr/bin/env node

/**
 * Command-line utility script for resetting user passwords in the HCBS Revenue Management System.
 * This script allows administrators to reset passwords for users directly from the command line, bypassing the normal password reset flow.
 * It's particularly useful for administrative password resets, account recovery, or resolving locked accounts.
 */

// Import necessary modules and dependencies
import * as dotenv from 'dotenv'; // dotenv v16.3.1
import * as yargs from 'yargs'; // yargs v17.7.2
import * as inquirer from 'inquirer'; // inquirer v9.2.7
import chalk from 'chalk'; // chalk v5.2.0

import { userRepository } from '../database/repositories/user.repository';
import { UserModel } from '../models/user.model';
import { UserStatus } from '../types/users.types';
import { validatePasswordStrength } from '../security/passwordPolicy';
import { revokeAllUserTokens } from '../security/token';
import { endAllUserSessions } from '../security/session-management';
import { logger } from '../utils/logger';
import { getKnexInstance } from '../database/connection';

/**
 * Main function that runs the script
 */
async function main(): Promise<void> {
  // Load environment variables using dotenv
  dotenv.config();

  // Parse command line arguments using yargs
  const argv = parseArguments();

  // Initialize database connection
  const knex = getKnexInstance();

  try {
    // If command line arguments are provided, reset password with those arguments
    if (argv.email && argv.password) {
      await resetPassword({
        email: argv.email as string,
        password: argv.password as string,
        unlock: argv.unlock as boolean,
        force: argv.force as boolean
      });
    } else {
      // Otherwise, prompt user for input using inquirer
      const userInfo = await promptForUserInfo();
      await resetPassword({
        email: userInfo.email,
        password: userInfo.password,
        unlock: userInfo.unlock,
        force: userInfo.force
      });
    }
  } catch (error) {
    // Display error message
    logger.error(chalk.red(`Password reset failed: ${error.message}`));
  } finally {
    // Close database connection
    await knex.destroy();
  }
}

/**
 * Parse command line arguments
 */
function parseArguments(): any {
  // Configure yargs with options for email and password
  const parser = yargs
    .option('email', {
      alias: 'e',
      describe: 'Email address of the user to reset password for',
      type: 'string'
    })
    .option('password', {
      alias: 'p',
      describe: 'New password for the user',
      type: 'string'
    })
    // Add option for unlock flag to unlock locked accounts
    .option('unlock', {
      alias: 'u',
      describe: 'Unlock the user account if it is locked',
      type: 'boolean',
      default: false
    })
    // Add option for force flag to bypass password policy validation
    .option('force', {
      alias: 'f',
      describe: 'Force password reset, bypassing password policy validation',
      type: 'boolean',
      default: false
    })
    // Add help text and usage examples
    .help()
    .alias('help', 'h')
    .usage('Usage: $0 --email <email> --password <password> [--unlock] [--force]')
    .example([
      ['$0 --email user@example.com --password NewPassword123', 'Reset password for user@example.com'],
      ['$0 --email admin@example.com --password Admin123 --unlock', 'Reset password and unlock admin@example.com'],
      ['$0 --email user@example.com --password WeakPassword --force', 'Reset password bypassing password policy']
    ]);

  // Parse and return arguments
  return parser.parseSync();
}

/**
 * Prompt user for input when arguments are not provided
 */
async function promptForUserInfo(): Promise<any> {
  // Use inquirer to prompt for email
  const questions = [
    {
      type: 'input',
      name: 'email',
      message: 'Enter user email:',
      validate: validateEmail
    },
    {
      type: 'password',
      name: 'password',
      message: 'Enter new password:',
      mask: '*'
    },
    {
      type: 'password',
      name: 'confirmPassword',
      message: 'Confirm new password:',
      mask: '*',
      validate: (value, answers) => {
        if (value !== answers.password) {
          return 'Passwords do not match.';
        }
        return true;
      }
    },
    {
      type: 'confirm',
      name: 'unlock',
      message: 'Unlock account if locked?',
      default: false
    },
    {
      type: 'confirm',
      name: 'force',
      message: 'Bypass password policy validation?',
      default: false
    }
  ];

  // Prompt for new password with masking
  // Prompt for password confirmation
  // Prompt for unlock option (yes/no)
  // Prompt for force option to bypass password validation (yes/no)
  return inquirer.prompt(questions);
}

/**
 * Validate email format
 */
function validateEmail(email: string): boolean | string {
  // Check if email is provided
  if (!email) {
    return 'Email cannot be empty.';
  }

  // Validate email format using regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Invalid email format.';
  }

  // Return validation result
  return true;
}

/**
 * Reset a user's password
 */
async function resetPassword(resetData: any): Promise<boolean> {
  // Validate required fields (email, password)
  if (!resetData.email || !resetData.password) {
    throw new Error('Email and password are required.');
  }

  // If force flag is not set, validate password strength using validatePassword
  if (!resetData.force) {
    const passwordValidation = await validatePasswordStrength(resetData.password);
    if (!passwordValidation.isValid) {
      throw new Error(`Invalid password: ${passwordValidation.errors.join(', ')}`);
    }
  }

  // Find user by email using UserModel.findByEmail
  const user = await userRepository.findByEmail(resetData.email);
  if (!user) {
    throw new Error('User not found.');
  }

  // Update user password using userRepository.updatePassword
  const passwordUpdated = await userRepository.updatePassword(user.id, resetData.password);
  if (!passwordUpdated) {
    throw new Error('Failed to update password.');
  }

  // If unlock flag is set, unlock account using userRepository.unlockAccount
  if (resetData.unlock) {
    await userRepository.unlockAccount(user.id);
  }

  // Set user status to ACTIVE using userRepository.updateStatus
  await userRepository.updateStatus(user.id, UserStatus.ACTIVE);

  // Revoke all user tokens using revokeAllUserTokens
  await revokeAllUserTokens(user.id, 'Password reset');

  // End all user sessions using endAllUserSessions
  await endAllUserSessions(user.id);

  // Log success message
  logger.info(chalk.green(`Password reset successfully for user: ${resetData.email}`));

  // Return true if password was reset successfully
  return true;
}

// Execute main function
main();