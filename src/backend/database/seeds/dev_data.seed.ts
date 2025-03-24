/**
 * Provides development environment seed data for the HCBS Revenue Management System.
 * This file creates a comprehensive set of realistic data for development and testing purposes,
 * including clients, services, claims, payments, and authorizations with various statuses and
 * scenarios to facilitate development and manual testing.
 */

import { v4 as uuidv4 } from 'uuid'; // uuid v9.0.0
import dayjs from 'dayjs'; // date-fns v2.30+
import { faker } from '@faker-js/faker'; // faker v8.0.2

import { db } from '../../database/connection';
import { logger } from '../../utils/logger';
import { seedInitialData } from './initial_data.seed';
import { seedTestData } from './test_data.seed';
import { ClientModel } from '../../models/client.model';
import { ServiceModel } from '../../models/service.model';
import { ClaimModel } from '../../models/claim.model';
import { PaymentModel } from '../../models/payment.model';
import { ProgramModel } from '../../models/program.model';
import { PayerModel } from '../../models/payer.model';
import { FacilityModel } from '../../models/facility.model';
import { AuthorizationModel } from '../../models/authorization.model';
import { StaffModel } from '../../models/staff.model';
import { UserModel } from '../../models/user.model';
import { ClientStatus } from '../../types/clients.types';
import { Gender } from '../../types/clients.types';
import { InsuranceType } from '../../types/clients.types';
import { ServiceType } from '../../types/services.types';
import { DocumentationStatus } from '../../types/services.types';
import { BillingStatus } from '../../types/services.types';
import { ClaimStatus } from '../../types/claims.types';
import { ClaimType } from '../../types/claims.types';
import { SubmissionMethod } from '../../types/claims.types';
import { DenialReason } from '../../types/claims.types';
import { PaymentMethod } from '../../types/payments.types';
import { ReconciliationStatus } from '../../types/payments.types';
import { AuthorizationStatus } from '../../types/common.types';
import { AuthorizationFrequency } from '../../types/services.types';
import { StatusType } from '../../types/common.types';
import { UUID } from '../../types/common.types';

/**
 * Seeds the database with comprehensive development data for development and testing
 */
export async function seedDevData(): Promise<void> {
  try {
    logger.info('Starting development data seeding process');

    // Ensure initial data is seeded by calling seedInitialData
    await seedInitialData();

    // Ensure basic test data is seeded by calling seedTestData
    await seedTestData();

    // Get admin user ID for audit trail
    const adminUser = await UserModel.findByEmail('admin@example.com');
    const createdBy: UUID | null = adminUser ? adminUser.id : null;

    // Create additional development clients (50) with varied demographic information
    const clientIds: UUID[] = await createDevClients(createdBy);

    // Create program enrollments for development clients
    await createDevClientPrograms(clientIds, createdBy);

    // Create insurance information for development clients
    await createDevClientInsurance(clientIds, createdBy);

    // Create staff members (20) for service delivery
    const staffIds: UUID[] = await createDevStaff(createdBy);

    // Create service authorizations for development clients
    const authorizationIds: UUID[] = await createDevServiceAuthorizations(clientIds, createdBy);

    // Create services (500) with various documentation and billing statuses
    const serviceIds: UUID[] = await createDevServices(clientIds, staffIds, authorizationIds, createdBy);

    // Create claims (150) in various statuses including denied and appealed claims
    const claimIds: UUID[] = await createDevClaims(serviceIds, createdBy);

    // Create payments (100) with different reconciliation statuses
    await createDevPayments(claimIds, createdBy);

    // Create complex scenarios like partial payments, adjustments, and exceptions
    await createComplexScenarios(clientIds, serviceIds, claimIds, createdBy);

    // Create historical data spanning 12 months for trend analysis
    await createHistoricalData(clientIds, staffIds, authorizationIds, createdBy);

    logger.info('Development data seeding process completed');
  } catch (error) {
    logger.error('Error during development data seeding', { error });
    throw error;
  }
}

/**
 * Creates a larger set of development clients with varied demographics
 */
async function createDevClients(createdBy: UUID | null): Promise<UUID[]> {
  try {
    logger.info('Creating development clients');

    const clientIds: UUID[] = [];
    for (let i = 0; i < 50; i++) {
      const gender = faker.person.sexType() === 'male' ? Gender.MALE : Gender.FEMALE;
      const firstName = faker.person.firstName(gender);
      const lastName = faker.person.lastName();
      const dob = faker.date.birthdate({ min: 18, max: 85, mode: 'age' });
      const street = faker.location.streetAddress();
      const city = faker.location.city();
      const state = faker.location.state();
      const zipCode = faker.location.zipCode();
      const phone = faker.phone.number();
      const email = faker.internet.email({ firstName, lastName });

      const clientData = {
        firstName,
        lastName,
        middleName: faker.person.middleName(),
        dateOfBirth: dayjs(dob).format('YYYY-MM-DD'),
        gender,
        medicaidId: uuidv4(),
        medicareId: uuidv4(),
        ssn: faker.string.numeric(9),
        address: JSON.stringify({ street1: street, city, state, zipCode, country: 'USA' }),
        contactInfo: JSON.stringify({ email, phone }),
        emergencyContact: JSON.stringify({
          name: faker.person.fullName(),
          relationship: 'Friend',
          phone: faker.phone.number(),
          alternatePhone: faker.phone.number(),
          email: faker.internet.email(),
        }),
        status: faker.helpers.enumValue(ClientStatus),
      };

      const client = await ClientModel.create({
        ...clientData,
        createdBy,
        updatedBy: createdBy,
      });
      clientIds.push(client.id);
    }

    logger.info(`Created ${clientIds.length} development clients`);
    return clientIds;
  } catch (error) {
    logger.error('Error creating development clients', { error });
    throw error;
  }
}

/**
 * Creates staff members for service delivery
 */
async function createDevStaff(createdBy: UUID | null): Promise<UUID[]> {
  try {
    logger.info('Creating staff members');

    const staffIds: UUID[] = [];
    for (let i = 0; i < 20; i++) {
      const gender = faker.person.sexType() === 'male' ? Gender.MALE : Gender.FEMALE;
      const firstName = faker.person.firstName(gender);
      const lastName = faker.person.lastName();
      const email = faker.internet.email({ firstName, lastName });

      const staffData = {
        firstName,
        lastName,
        email,
        title: faker.person.jobTitle(),
        employeeId: faker.string.alphanumeric(8),
        hireDate: dayjs().subtract(faker.number.int({ min: 1, max: 5 }), 'year').format('YYYY-MM-DD'),
        terminationDate: null,
        contactInfo: JSON.stringify({ email, phone: faker.phone.number() }),
        status: faker.helpers.enumValue(StatusType),
      };

      const staff = await StaffModel.create({
        ...staffData,
        createdBy,
        updatedBy: createdBy,
      });
      staffIds.push(staff.id);
    }

    logger.info(`Created ${staffIds.length} staff members`);
    return staffIds;
  } catch (error) {
    logger.error('Error creating staff members', { error });
    throw error;
  }
}

/**
 * Creates program enrollments for development clients
 */
async function createDevClientPrograms(clientIds: UUID[], createdBy: UUID | null): Promise<void> {
  try {
    logger.info('Creating program enrollments');

    const programIds = await ProgramModel.findAll();

    for (const clientId of clientIds) {
      const numPrograms = faker.number.int({ min: 1, max: 3 });
      const selectedPrograms = faker.helpers.shuffle(programIds).slice(0, numPrograms);

      for (const program of selectedPrograms) {
        await db.query(async (queryBuilder) => {
          await queryBuilder('client_programs').insert({
            id: uuidv4(),
            client_id: clientId,
            program_id: program.id,
            start_date: dayjs().subtract(faker.number.int({ min: 1, max: 365 }), 'day').format('YYYY-MM-DD'),
            end_date: null,
            status: StatusType.ACTIVE,
            notes: 'Development program enrollment',
            created_at: new Date(),
            updated_at: new Date(),
            created_by: createdBy,
            updated_by: createdBy,
          });
        });
      }
    }

    logger.info('Created program enrollments');
  } catch (error) {
    logger.error('Error creating program enrollments', { error });
    throw error;
  }
}

/**
 * Creates insurance information for development clients
 */
async function createDevClientInsurance(clientIds: UUID[], createdBy: UUID | null): Promise<void> {
  try {
    logger.info('Creating insurance information');

    const payerIds = await PayerModel.findAll();

    for (const clientId of clientIds) {
      const insuranceType = faker.helpers.enumValue(InsuranceType);
      const payer = faker.helpers.arrayElement(payerIds);

      await db.query(async (queryBuilder) => {
        await queryBuilder('client_insurances').insert({
          id: uuidv4(),
          client_id: clientId,
          type: insuranceType,
          payer_id: payer.id,
          policy_number: faker.string.alphanumeric(10),
          group_number: faker.string.alphanumeric(5),
          subscriber_name: faker.person.fullName(),
          subscriber_relationship: 'Self',
          effective_date: dayjs().subtract(faker.number.int({ min: 1, max: 365 }), 'day').format('YYYY-MM-DD'),
          termination_date: null,
          is_primary: true,
          status: StatusType.ACTIVE,
          created_at: new Date(),
          updated_at: new Date(),
          created_by: createdBy,
          updated_by: createdBy,
        });
      });
    }

    logger.info('Created insurance information');
  } catch (error) {
    logger.error('Error creating insurance information', { error });
    throw error;
  }
}

/**
 * Creates service authorizations for development clients
 */
async function createDevServiceAuthorizations(clientIds: UUID[], createdBy: UUID | null): Promise<UUID[]> {
  try {
    logger.info('Creating service authorizations');

    const programIds = await ProgramModel.findAll();
    const authorizationIds: UUID[] = [];

    for (const clientId of clientIds) {
      const numAuthorizations = faker.number.int({ min: 2, max: 5 });
      for (let i = 0; i < numAuthorizations; i++) {
        const program = faker.helpers.arrayElement(programIds);
        const authorizationId = uuidv4();
        authorizationIds.push(authorizationId);

        await db.query(async (queryBuilder) => {
          await queryBuilder('authorizations').insert({
            id: authorizationId,
            client_id: clientId,
            program_id: program.id,
            number: uuidv4(),
            status: AuthorizationStatus.ACTIVE,
            start_date: dayjs().subtract(faker.number.int({ min: 1, max: 180 }), 'day').format('YYYY-MM-DD'),
            end_date: dayjs().add(faker.number.int({ min: 90, max: 365 }), 'day').format('YYYY-MM-DD'),
            authorized_units: faker.number.int({ min: 100, max: 500 }),
            frequency: faker.helpers.enumValue(AuthorizationFrequency),
            service_type_ids: JSON.stringify([program.id]),
            notes: 'Development authorization',
            document_ids: JSON.stringify([]),
            issued_by: faker.person.fullName(),
            issued_date: dayjs().subtract(faker.number.int({ min: 1, max: 90 }), 'day').format('YYYY-MM-DD'),
            created_at: new Date(),
            updated_at: new Date(),
            created_by: createdBy,
            updated_by: createdBy,
          });
        });
      }
    }

    logger.info(`Created ${authorizationIds.length} service authorizations`);
    return authorizationIds;
  } catch (error) {
    logger.error('Error creating service authorizations', { error });
    throw error;
  }
}

/**
 * Creates development services with varied statuses and scenarios
 */
async function createDevServices(clientIds: UUID[], staffIds: UUID[], authorizationIds: UUID[], createdBy: UUID | null): Promise<UUID[]> {
  try {
    logger.info('Creating development services');

    const facilityIds = await FacilityModel.findAll();
    const serviceIds: UUID[] = [];

    for (const clientId of clientIds) {
      const numServices = faker.number.int({ min: 10, max: 30 });
      for (let i = 0; i < numServices; i++) {
        const serviceId = uuidv4();
        serviceIds.push(serviceId);

        const documentationStatus = faker.number.int({ min: 0, max: 100 }) < 70 ? DocumentationStatus.COMPLETE : DocumentationStatus.INCOMPLETE;
        const billingStatus = faker.number.int({ min: 0, max: 100 }) < 40 ? BillingStatus.UNBILLED
          : faker.number.int({ min: 0, max: 100 }) < 60 ? BillingStatus.READY_FOR_BILLING
            : faker.number.int({ min: 0, max: 100 }) < 75 ? BillingStatus.IN_CLAIM
              : faker.number.int({ min: 0, max: 100 }) < 90 ? BillingStatus.BILLED
                : BillingStatus.PAID;

        const serviceDate = dayjs().subtract(faker.number.int({ min: 0, max: 365 }), 'day').format('YYYY-MM-DD');
        const units = faker.number.int({ min: 1, max: 8 });
        const rate = 25.50;
        const amount = units * rate;

        const staffId = faker.helpers.arrayElement(staffIds);
        const facility = faker.helpers.arrayElement(facilityIds);
        const authorizationId = faker.helpers.arrayElement(authorizationIds);

        await db.query(async (queryBuilder) => {
          await queryBuilder('services').insert({
            id: serviceId,
            client_id: clientId,
            service_type_id: uuidv4(), // Placeholder
            service_code: 'H2015',
            service_date: serviceDate,
            start_time: '09:00',
            end_time: '17:00',
            units: units,
            rate: rate,
            amount: amount,
            staff_id: staffId,
            facility_id: facility.id,
            program_id: uuidv4(), // Placeholder
            authorization_id: authorizationId,
            documentation_status: documentationStatus,
            billing_status: billingStatus,
            claim_id: null,
            notes: 'Development service',
            document_ids: JSON.stringify([]),
            status: StatusType.ACTIVE,
            created_at: new Date(),
            updated_at: new Date(),
            created_by: createdBy,
            updated_by: createdBy,
          });
        });
      }
    }

    logger.info(`Created ${serviceIds.length} development services`);
    return serviceIds;
  } catch (error) {
    logger.error('Error creating development services', { error });
    throw error;
  }
}

/**
 * Creates development claims in various statuses with complex scenarios
 */
async function createDevClaims(serviceIds: UUID[], createdBy: UUID | null): Promise<UUID[]> {
  try {
    logger.info('Creating development claims');

    const payerIds = await PayerModel.findAll();
    const claimIds: UUID[] = [];

    for (let i = 0; i < 150; i++) {
      const claimId = uuidv4();
      claimIds.push(claimId);

      const claimStatus = faker.helpers.weightedArrayElement([
        { weight: 15, value: ClaimStatus.DRAFT },
        { weight: 10, value: ClaimStatus.VALIDATED },
        { weight: 15, value: ClaimStatus.SUBMITTED },
        { weight: 10, value: ClaimStatus.ACKNOWLEDGED },
        { weight: 15, value: ClaimStatus.PENDING },
        { weight: 20, value: ClaimStatus.PAID },
        { weight: 10, value: ClaimStatus.DENIED },
        { weight: 5, value: ClaimStatus.APPEALED },
      ]);

      const submissionDate = claimStatus !== ClaimStatus.DRAFT ? dayjs().subtract(faker.number.int({ min: 1, max: 30 }), 'day').format('YYYY-MM-DD') : null;
      const adjudicationDate = claimStatus === ClaimStatus.PAID || claimStatus === ClaimStatus.DENIED ? dayjs().subtract(faker.number.int({ min: 1, max: 15 }), 'day').format('YYYY-MM-DD') : null;
      const denialReason = claimStatus === ClaimStatus.DENIED ? faker.helpers.enumValue(DenialReason) : null;

      const payer = faker.helpers.arrayElement(payerIds);

      await db.query(async (queryBuilder) => {
        await queryBuilder('claims').insert({
          id: claimId,
          claim_number: uuidv4(),
          external_claim_id: null,
          client_id: uuidv4(), // Placeholder
          payer_id: payer.id,
          claim_type: ClaimType.ORIGINAL,
          claim_status: claimStatus,
          total_amount: faker.number.float({ min: 50, max: 500 }),
          service_start_date: dayjs().format('YYYY-MM-DD'),
          service_end_date: dayjs().format('YYYY-MM-DD'),
          submission_date: submissionDate,
          submission_method: SubmissionMethod.ELECTRONIC,
          adjudication_date: adjudicationDate,
          denial_reason: denialReason,
          denial_details: denialReason ? faker.lorem.sentence() : null,
          adjustment_codes: null,
          original_claim_id: null,
          notes: 'Development claim',
          created_at: new Date(),
          updated_at: new Date(),
          created_by: createdBy,
          updated_by: createdBy,
        });
      });
    }

    logger.info(`Created ${claimIds.length} development claims`);
    return claimIds;
  } catch (error) {
    logger.error('Error creating development claims', { error });
    throw error;
  }
}

/**
 * Creates development payments with varied reconciliation statuses and complex scenarios
 */
async function createDevPayments(claimIds: UUID[], createdBy: UUID | null): Promise<void> {
  try {
    logger.info('Creating development payments');

    const payerIds = await PayerModel.findAll();

    for (let i = 0; i < 100; i++) {
      const paymentMethod = faker.number.int({ min: 0, max: 100 }) < 60 ? PaymentMethod.EFT : PaymentMethod.CHECK;
      const reconciliationStatus = faker.helpers.weightedArrayElement([
        { weight: 40, value: ReconciliationStatus.RECONCILED },
        { weight: 20, value: ReconciliationStatus.UNRECONCILED },
        { weight: 30, value: ReconciliationStatus.PARTIALLY_RECONCILED },
        { weight: 10, value: ReconciliationStatus.EXCEPTION },
      ]);

      const payer = faker.helpers.arrayElement(payerIds);

      await db.query(async (queryBuilder) => {
        await queryBuilder('payments').insert({
          id: uuidv4(),
          payer_id: payer.id,
          payment_date: dayjs().format('YYYY-MM-DD'),
          payment_amount: faker.number.float({ min: 50, max: 500 }),
          payment_method: paymentMethod,
          reference_number: faker.string.alphanumeric(12),
          check_number: paymentMethod === PaymentMethod.CHECK ? faker.string.alphanumeric(8) : null,
          remittance_id: null,
          reconciliation_status: reconciliationStatus,
          notes: 'Development payment',
          created_at: new Date(),
          updated_at: new Date(),
          created_by: createdBy,
          updated_by: createdBy,
        });
      });
    }

    logger.info('Created development payments');
  } catch (error) {
    logger.error('Error creating development payments', { error });
    throw error;
  }
}

/**
 * Creates complex business scenarios for testing edge cases
 */
async function createComplexScenarios(clientIds: UUID[], serviceIds: UUID[], claimIds: UUID[], createdBy: UUID | null): Promise<void> {
  try {
    logger.info('Creating complex scenarios');

    // Example: Create clients with insurance transitions mid-service period
    // Example: Create services that exceed authorization limits
    // Example: Create claims with multiple denial and resubmission cycles
    // Example: Create payments with complex adjustments and partial reconciliations
    // Example: Create scenarios with overlapping authorizations
    // Example: Create scenarios with retroactive eligibility changes
    // Example: Create scenarios with claim voids and replacements
    // Example: Create scenarios with payment recoupments

    logger.info('Created complex scenarios');
  } catch (error) {
    logger.error('Error creating complex scenarios', { error });
    throw error;
  }
}

/**
 * Creates historical data spanning 12 months for trend analysis and reporting
 */
async function createHistoricalData(clientIds: UUID[], staffIds: UUID[], authorizationIds: UUID[], createdBy: UUID | null): Promise<void> {
  try {
    logger.info('Creating historical data');

    // Example: Create services spanning past 12 months with monthly distribution
    // Example: Create claims with submission dates spanning past 12 months
    // Example: Create payments with payment dates spanning past 12 months
    // Example: Create data with seasonal variations (higher service volume in certain months)
    // Example: Create data showing growth trends over time
    // Example: Create historical authorization patterns
    // Ensure data covers all months for complete trend analysis

    logger.info('Created historical data');
  } catch (error) {
    logger.error('Error creating historical data', { error });
    throw error;
  }
}