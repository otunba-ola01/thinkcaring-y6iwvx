#!/usr/bin/env node

/**
 * User Creation Script
 *
 * Command-line utility for creating new users in the HCBS Revenue Management System.
 * This script allows administrators to create users directly from the command line
 * with specified roles and permissions, bypassing the web interface.
 *
 * It's particularly useful for:
 * - Initial system setup
 * - Creating admin users
 * - Bulk user creation through scripting
 */

import * as yargs from 'yargs'; // yargs ^17.7.2
import * as inquirer from 'inquirer'; // inquirer ^9.2.7
import * as chalk from 'chalk'; // chalk ^5.2.0
import * as dotenv from 'dotenv'; // dotenv ^16.3.1

import { userRepository } from '../database/repositories/user.repository';
import { roleRepository } from '../database/repositories/role.repository';
import { UserRole, UserStatus } from '../types/users.types';
import { AuthProvider } from '../types/auth.types';
import { validatePassword } from '../security/passwordPolicy';
import { logger } from '../utils/logger';
import { getKnexInstance } from '../database/connection';

/**
 * Main function that runs the user creation script
 */
async function main(): Promise<void> {
  try {
    // Load environment variables
    dotenv.config();
    
    // Parse command-line arguments
    const args = parseArguments();
    
    // Initialize database connection
    const knex = getKnexInstance();
    
    // Ensure default roles exist
    await roleRepository.createDefaultRoles();
    
    // Check if we have arguments provided or need to prompt
    if (args.email && args.firstName && args.lastName && args.password && args.role) {
      console.log(chalk.blue('Creating user with provided arguments...'));
      
      // Validate email format
      if (!validateEmail(args.email)) {
        console.error(chalk.red('Error: Invalid email format'));
        process.exit(1);
      }
      
      // Check if user already exists
      const existingUser = await userRepository.findByEmail(args.email);
      if (existingUser) {
        console.error(chalk.red(`Error: User with email ${args.email} already exists`));
        process.exit(1);
      }
      
      // Get role
      const role = await getRoleByNameOrId(args.role);
      if (!role) {
        console.error(chalk.red(`Error: Role '${args.role}' not found`));
        await displayAvailableRoles();
        process.exit(1);
      }
      
      // Create user
      await createUser({
        email: args.email,
        firstName: args.firstName,
        lastName: args.lastName,
        password: args.password,
        roleId: role.id
      });
      
    } else {
      console.log(chalk.blue('Please provide user information:'));
      
      // Display available roles for reference
      await displayAvailableRoles();
      
      // Prompt for user information
      const userInfo = await promptForUserInfo();
      
      // Validate email format
      if (!validateEmail(userInfo.email)) {
        console.error(chalk.red('Error: Invalid email format'));
        process.exit(1);
      }
      
      // Check if user already exists
      const existingUser = await userRepository.findByEmail(userInfo.email);
      if (existingUser) {
        console.error(chalk.red(`Error: User with email ${userInfo.email} already exists`));
        process.exit(1);
      }
      
      // Get role
      const role = await getRoleByNameOrId(userInfo.role);
      if (!role) {
        console.error(chalk.red(`Error: Role '${userInfo.role}' not found`));
        process.exit(1);
      }
      
      // Create user
      await createUser({
        email: userInfo.email,
        firstName: userInfo.firstName,
        lastName: userInfo.lastName,
        password: userInfo.password,
        roleId: role.id
      });
    }
    
    // Close database connection
    await knex.destroy();
    
  } catch (error) {
    logger.error('Error in create-user script', { error });
    console.error(chalk.red('An error occurred:'), error.message);
    process.exit(1);
  }
}

/**
 * Parses command-line arguments for user creation
 */
function parseArguments() {
  return yargs
    .option('email', {
      alias: 'e',
      describe: 'User email address',
      type: 'string'
    })
    .option('firstName', {
      alias: 'f',
      describe: 'User first name',
      type: 'string'
    })
    .option('lastName', {
      alias: 'l',
      describe: 'User last name',
      type: 'string'
    })
    .option('password', {
      alias: 'p',
      describe: 'User password',
      type: 'string'
    })
    .option('role', {
      alias: 'r',
      describe: 'User role (name or ID)',
      type: 'string'
    })
    .help()
    .example('$0 -e admin@example.com -f Admin -l User -p securePassword -r administrator', 'Create an admin user')
    .example('$0', 'Run in interactive mode')
    .argv;
}

/**
 * Prompts the user for input when command-line arguments are not provided
 */
async function promptForUserInfo() {
  return inquirer.prompt([
    {
      type: 'input',
      name: 'email',
      message: 'Enter email address:',
      validate: (input) => {
        if (validateEmail(input)) {
          return true;
        }
        return 'Please enter a valid email address';
      }
    },
    {
      type: 'input',
      name: 'firstName',
      message: 'Enter first name:',
      validate: (input) => input.trim().length > 0 ? true : 'First name is required'
    },
    {
      type: 'input',
      name: 'lastName',
      message: 'Enter last name:',
      validate: (input) => input.trim().length > 0 ? true : 'Last name is required'
    },
    {
      type: 'password',
      name: 'password',
      message: 'Enter password:',
      mask: '*',
      validate: async (input) => {
        const validationResult = await validatePassword(input);
        if (validationResult.isValid) {
          return true;
        }
        return validationResult.errors.join('\n');
      }
    },
    {
      type: 'list',
      name: 'role',
      message: 'Select role:',
      choices: [
        { name: 'Administrator', value: UserRole.ADMINISTRATOR },
        { name: 'Financial Manager', value: UserRole.FINANCIAL_MANAGER },
        { name: 'Billing Specialist', value: UserRole.BILLING_SPECIALIST },
        { name: 'Program Manager', value: UserRole.PROGRAM_MANAGER },
        { name: 'Read Only', value: UserRole.READ_ONLY }
      ]
    }
  ]);
}

/**
 * Validates an email address format
 */
function validateEmail(email: string): boolean {
  if (!email) return false;
  
  // Email regex pattern
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Gets a role by name or ID
 */
async function getRoleByNameOrId(roleNameOrId: string): Promise<any> {
  // Try to find by name first
  let role = await roleRepository.findByName(roleNameOrId);
  
  // If not found, try to find by ID
  if (!role) {
    try {
      role = await roleRepository.findById(roleNameOrId);
    } catch (error) {
      // Not found or invalid ID
      return null;
    }
  }
  
  return role;
}

/**
 * Creates a new user with the provided information
 */
async function createUser(userData: {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  roleId: string;
}): Promise<any> {
  // Validate required fields
  if (!userData.email || !userData.firstName || !userData.lastName || !userData.password || !userData.roleId) {
    throw new Error('Missing required user data');
  }
  
  // Validate password strength
  const passwordValidation = await validatePassword(userData.password);
  if (!passwordValidation.isValid) {
    throw new Error(`Password does not meet requirements: ${passwordValidation.errors.join(', ')}`);
  }
  
  // Prepare user data
  const user = {
    email: userData.email,
    firstName: userData.firstName,
    lastName: userData.lastName,
    roleId: userData.roleId,
    status: UserStatus.ACTIVE,
    mfaEnabled: false,
    mfaMethod: null,
    passwordResetRequired: true,
    authProvider: AuthProvider.LOCAL,
    failedLoginAttempts: 0,
    contactInfo: {
      email: userData.email,
      phone: '',
      alternatePhone: '',
      fax: ''
    }
  };
  
  try {
    // Create the user
    const createdUser = await userRepository.createUser(user, userData.password);
    
    // Log success
    logger.info('User created successfully', { 
      userId: createdUser.id, 
      email: createdUser.email,
      roleId: createdUser.roleId
    });
    
    console.log(chalk.green('User created successfully:'));
    console.log(chalk.green(`  ID: ${createdUser.id}`));
    console.log(chalk.green(`  Email: ${createdUser.email}`));
    console.log(chalk.green(`  Name: ${createdUser.firstName} ${createdUser.lastName}`));
    console.log(chalk.green(`  Role ID: ${createdUser.roleId}`));
    console.log(chalk.green(`  Status: ${createdUser.status}`));
    console.log(chalk.yellow('  Note: User will be required to change password on first login'));
    
    return createdUser;
  } catch (error) {
    logger.error('Failed to create user', { error, email: userData.email });
    throw new Error(`Failed to create user: ${error.message}`);
  }
}

/**
 * Displays available roles in the system
 */
async function displayAvailableRoles(): Promise<void> {
  try {
    console.log(chalk.cyan('\nAvailable roles:'));
    
    // Get all roles from the database
    const { data: roles } = await roleRepository.findAllWithFilters();
    
    // Display role information
    roles.forEach(role => {
      console.log(chalk.cyan(`  - ${role.name} (ID: ${role.id})`));
      console.log(`    ${role.description}`);
    });
    
    console.log(''); // Empty line for spacing
  } catch (error) {
    logger.error('Failed to display available roles', { error });
    console.error(chalk.red('Could not retrieve available roles'));
  }
}

// Run the script
main();