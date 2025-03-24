/**
 * Provides initial seed data for the HCBS Revenue Management System database.
 * This file contains essential data required for the system to function properly,
 * including default roles, permissions, system settings, default programs, payers,
 * and an admin user. This data is seeded in all environments (development, testing,
 * and production) during initial system setup.
 */

import { v4 as uuidv4 } from 'uuid'; // uuid v9.0.0
import bcrypt from 'bcrypt'; // bcrypt v5.1.0

import { db } from '../../database/connection';
import { logger } from '../../utils/logger';
import { RoleModel } from '../../models/role.model';
import { PermissionModel } from '../../models/permission.model';
import { UserModel } from '../../models/user.model';
import { ProgramModel, ProgramType, ProgramStatus, FundingSource } from '../../models/program.model';
import { PayerModel, PayerType } from '../../models/payer.model';
import { FacilityModel } from '../../models/facility.model';
import { SettingModel } from '../../models/setting.model';
import { UserRole, UserStatus, PermissionCategory } from '../../types/users.types';
import { AuthProvider } from '../../types/auth.types';

/**
 * Seeds the database with initial required data for the system to function
 */
export async function seedInitialData(): Promise<void> {
  try {
    logger.info('Starting initial data seeding process');

    // Create default roles and permissions
    await createDefaultRolesAndPermissions();

    // Create default admin user if it doesn't exist
    await createAdminUser();

    // Create default system settings
    await createDefaultSettings();

    // Create default programs
    await createDefaultPrograms();

    // Create default payers
    await createDefaultPayers();

    // Create default facility
    await createDefaultFacility();

    logger.info('Initial data seeding process completed');
  } catch (error) {
    logger.error('Error during initial data seeding', { error });
    throw error;
  }
}

/**
 * Creates default roles and permissions and assigns permissions to roles
 */
async function createDefaultRolesAndPermissions(): Promise<void> {
  try {
    logger.info('Creating default roles and permissions');

    // Create system roles
    await RoleModel.createDefaultRoles();

    // Create system permissions
    await PermissionModel.createDefaultPermissions();

    logger.info('Default roles and permissions created successfully');
  } catch (error) {
    logger.error('Error creating default roles and permissions', { error });
    throw error;
  }
}

/**
 * Creates a default administrator user if one doesn't exist
 */
async function createAdminUser(): Promise<void> {
  try {
    logger.info('Creating default admin user if not exists');

    // Check if admin user already exists
    const existingAdmin = await UserModel.findByEmail('admin@example.com');

    if (!existingAdmin) {
      // Hash password
      const password = 'Admin123!';
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Find administrator role
      const adminRole = await RoleModel.findByName(UserRole.ADMINISTRATOR);

      if (!adminRole) {
        throw new Error('Administrator role not found');
      }

      // Create admin user
      await db.query(async (queryBuilder) => {
        await queryBuilder('users').insert({
          id: uuidv4(),
          email: 'admin@example.com',
          first_name: 'System',
          last_name: 'Administrator',
          password_hash: passwordHash,
          password_salt: '',
          role_id: adminRole.id,
          status: UserStatus.ACTIVE,
          auth_provider: AuthProvider.LOCAL,
          contact_info: JSON.stringify({
            email: 'admin@example.com',
            phone: '555-123-4567',
          }),
          created_at: new Date(),
          updated_at: new Date(),
        });
      });

      logger.info('Default admin user created successfully');
    } else {
      logger.info('Default admin user already exists, skipping creation');
    }
  } catch (error) {
    logger.error('Error creating default admin user', { error });
    throw error;
  }
}

/**
 * Creates default system settings
 */
async function createDefaultSettings(): Promise<void> {
  try {
    logger.info('Creating default system settings');

    const defaultSettings = [
      { key: 'organization.name', value: 'Thinkcaring' },
    ];

    for (const setting of defaultSettings) {
      const existingSetting = await SettingModel.findByKey(setting.key);

      if (!existingSetting) {
        await SettingModel.create({
          key: setting.key,
          value: setting.value,
          description: setting.key,
          category: 'system',
          dataType: 'string',
          isEditable: true,
          isHidden: false,
          metadata: {},
        });

        logger.info(`Created default setting: ${setting.key}`);
      } else {
        logger.info(`Default setting already exists: ${setting.key}, skipping creation`);
      }
    }
  } catch (error) {
    logger.error('Error creating default system settings', { error });
    throw error;
  }
}

/**
 * Creates default program types for HCBS providers
 */
async function createDefaultPrograms(): Promise<void> {
  try {
    logger.info('Creating default programs');

    const programs = [
      { name: 'Personal Care', type: ProgramType.PERSONAL_CARE },
      { name: 'Residential', type: ProgramType.RESIDENTIAL },
      { name: 'Day Services', type: ProgramType.DAY_SERVICES },
      { name: 'Respite', type: ProgramType.RESPITE },
    ];

    for (const program of programs) {
      const existingProgram = await ProgramModel.findByName(program.name);

      if (!existingProgram) {
        await db.query(async (queryBuilder) => {
          await queryBuilder('programs').insert({
            id: uuidv4(),
            name: program.name,
            code: program.type,
            description: program.name,
            type: program.type,
            status: ProgramStatus.ACTIVE,
            funding_source: FundingSource.MEDICAID,
            billing_frequency: 'monthly',
            start_date: new Date(),
            end_date: null,
            payer_id: null,
            contract_number: null,
            requires_authorization: false,
            documentation_requirements: null,
            billing_requirements: null,
            created_at: new Date(),
            updated_at: new Date(),
            created_by: null,
            updated_by: null,
          });
        });

        logger.info(`Created default program: ${program.name}`);
      } else {
        logger.info(`Default program already exists: ${program.name}, skipping creation`);
      }
    }
  } catch (error) {
    logger.error('Error creating default programs', { error });
    throw error;
  }
}

/**
 * Creates default payers for claims and billing
 */
async function createDefaultPayers(): Promise<void> {
  try {
    logger.info('Creating default payers');

    const payers = [
      { name: 'Medicaid', type: PayerType.MEDICAID },
      { name: 'Medicare', type: PayerType.MEDICARE },
      { name: 'Private Insurance', type: PayerType.PRIVATE_INSURANCE },
    ];

    for (const payer of payers) {
      const existingPayer = await PayerModel.findByName(payer.name);

      if (!existingPayer) {
        await db.query(async (queryBuilder) => {
          await queryBuilder('payers').insert({
            id: uuidv4(),
            name: payer.name,
            payer_type: payer.type,
            payer_id: uuidv4(),
            address: JSON.stringify({
              street1: '123 Main St',
              city: 'Anytown',
              state: 'NY',
              zipCode: '12345',
              country: 'USA',
            }),
            contact_info: JSON.stringify({
              email: 'payer@example.com',
              phone: '555-555-5555',
            }),
            billing_requirements: JSON.stringify({
              submission_format: 'electronic',
              timely_filing_days: 365,
              requires_authorization: true,
              required_fields: ['service_code', 'units', 'rate'],
            }),
            submission_method: JSON.stringify({
              method: 'electronic',
              endpoint: 'https://payer.example.com/api/claims',
              credentials: {
                username: 'payeruser',
                password: 'payerpassword',
              },
            }),
            is_electronic: true,
            status: StatusType.ACTIVE,
            notes: null,
            created_at: new Date(),
            updated_at: new Date(),
            created_by: null,
            updated_by: null,
          });
        });

        logger.info(`Created default payer: ${payer.name}`);
      } else {
        logger.info(`Default payer already exists: ${payer.name}, skipping creation`);
      }
    }
  } catch (error) {
    logger.error('Error creating default payers', { error });
    throw error;
  }
}

/**
 * Creates a default facility for service delivery
 */
async function createDefaultFacility(): Promise<void> {
  try {
    logger.info('Creating default facility');

    const facilityName = 'Main Office';
    const existingFacility = await FacilityModel.findByName(facilityName);

    if (!existingFacility) {
      await db.query(async (queryBuilder) => {
        await queryBuilder('facilities').insert({
          id: uuidv4(),
          name: facilityName,
          type: 'residential',
          license_number: '1234567890',
          license_expiration_date: new Date(),
          address: JSON.stringify({
            street1: '123 Main St',
            city: 'Anytown',
            state: 'NY',
            zipCode: '12345',
            country: 'USA',
          }),
          contact_info: JSON.stringify({
            email: 'facility@example.com',
            phone: '555-555-5555',
          }),
          status: StatusType.ACTIVE,
          notes: null,
          created_at: new Date(),
          updated_at: new Date(),
          created_by: null,
          updated_by: null,
        });
      });

      logger.info('Created default facility: Main Office');
    } else {
      logger.info('Default facility already exists: Main Office, skipping creation');
    }
  } catch (error) {
    logger.error('Error creating default facility', { error });
    throw error;
  }
}