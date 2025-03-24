/**
 * Provides test data for the HCBS Revenue Management System database.
 * This file creates a consistent set of test data including clients, services, claims, payments, and authorizations that can be used for testing and development. The test data represents realistic scenarios while being limited in volume compared to production data.
 */

import { v4 as uuidv4 } from 'uuid'; // uuid v9.0.0
import dayjs from 'dayjs'; // date-fns v2.30+

import { db } from '../../database/connection';
import { logger } from '../../utils/logger';
import { seedInitialData } from './initial_data.seed';
import { ClientModel } from '../../models/client.model';
import { ServiceModel } from '../../models/service.model';
import { ClaimModel } from '../../models/claim.model';
import { PaymentModel } from '../../models/payment.model';
import { ProgramModel } from '../../models/program.model';
import { PayerModel } from '../../models/payer.model';
import { FacilityModel } from '../../models/facility.model';
import { AuthorizationModel } from '../../models/authorization.model';
import { UserModel } from '../../models/user.model';
import { ClientStatus, Gender, InsuranceType } from '../../types/clients.types';
import { ServiceType, DocumentationStatus, BillingStatus, AuthorizationFrequency } from '../../types/services.types';
import { ClaimStatus, ClaimType, SubmissionMethod } from '../../types/claims.types';
import { PaymentMethod, ReconciliationStatus } from '../../types/payments.types';
import { StatusType } from '../../types/common.types';

/**
 * Seeds the database with test data for testing and development
 */
export async function seedTestData(): Promise<void> {
  try {
    logger.info('Starting test data seeding process');

    // Ensure initial data is seeded by calling seedInitialData
    await seedInitialData();

    // Get admin user ID for audit trail
    const adminUser = await UserModel.findByEmail('admin@example.com');
    const createdBy = adminUser ? adminUser.id : null;

    // Create test clients (10) with demographic information
    const clientIds = await createTestClients(createdBy);

    // Create program enrollments for test clients
    await createTestClientPrograms(clientIds, createdBy);

    // Create insurance information for test clients
    await createTestClientInsurance(clientIds, createdBy);

    // Create service authorizations for test clients
    const authorizationIds = await createTestServiceAuthorizations(clientIds, createdBy);

    // Create services (100) with various documentation statuses
    const serviceIds = await createTestServices(clientIds, authorizationIds, createdBy);

    // Create claims (30) in various statuses
    const claimIds = await createTestClaims(serviceIds, createdBy);

    // Create payments (20) with different reconciliation statuses
    await createTestPayments(claimIds, createdBy);

    logger.info('Test data seeding process completed');
  } catch (error) {
    logger.error('Error during test data seeding', { error });
    throw error;
  }
}

/**
 * Creates a set of test clients with consistent demographics
 */
async function createTestClients(createdBy: UUID | null): Promise<UUID[]> {
  try {
    logger.info('Creating test clients');

    // Define test client data with consistent demographics
    const testClients = Array.from({ length: 10 }, (_, i) => ({
      firstName: `Test${i + 1}`,
      lastName: 'Client',
      middleName: 'Middle',
      dateOfBirth: dayjs().subtract(20 + i, 'year').format('YYYY-MM-DD'),
      gender: i % 2 === 0 ? Gender.MALE : Gender.FEMALE,
      medicaidId: uuidv4(),
      medicareId: uuidv4(),
      ssn: `${100000000 + i}`,
      address: JSON.stringify({
        street1: `${i + 1} Test St`,
        city: 'Testville',
        state: 'NY',
        zipCode: '12345',
        country: 'USA',
      }),
      contactInfo: JSON.stringify({
        email: `test${i + 1}@example.com`,
        phone: '555-555-5555',
      }),
      emergencyContact: JSON.stringify({
        name: 'Test Contact',
        relationship: 'Parent',
        phone: '555-555-5555',
        alternatePhone: '555-555-5555',
        email: 'testcontact@example.com',
      }),
      status: ClientStatus.ACTIVE,
    }));

    // Create client records using ClientModel
    const clientIds: UUID[] = [];
    for (const clientData of testClients) {
      const client = await ClientModel.create({
        ...clientData,
        createdBy,
        updatedBy: createdBy,
      });
      clientIds.push(client.id);
    }

    logger.info(`Created ${clientIds.length} test clients`);
    return clientIds;
  } catch (error) {
    logger.error('Error creating test clients', { error });
    throw error;
  }
}

/**
 * Creates program enrollments for test clients
 */
async function createTestClientPrograms(clientIds: UUID[], createdBy: UUID | null): Promise<void> {
  try {
    logger.info('Creating test client programs');

    // Get program IDs from database using ProgramModel
    const personalCareProgram = await ProgramModel.findByName('Personal Care');
    const residentialProgram = await ProgramModel.findByName('Residential');
    const dayServicesProgram = await ProgramModel.findByName('Day Services');
    const respiteProgram = await ProgramModel.findByName('Respite');

    if (!personalCareProgram || !residentialProgram || !dayServicesProgram || !respiteProgram) {
      throw new Error('One or more programs not found');
    }

    // For each client, create 1-2 program enrollments
    for (const clientId of clientIds) {
      const numPrograms = Math.floor(Math.random() * 2) + 1; // 1 or 2 programs
      const programs = [personalCareProgram, residentialProgram, dayServicesProgram, respiteProgram].slice(0, numPrograms);

      for (const program of programs) {
        await db.query(async (queryBuilder) => {
          await queryBuilder('client_programs').insert({
            id: uuidv4(),
            client_id: clientId,
            program_id: program.id,
            start_date: dayjs().subtract(Math.floor(Math.random() * 365), 'day').format('YYYY-MM-DD'),
            end_date: null,
            status: StatusType.ACTIVE,
            notes: 'Test program enrollment',
            created_at: new Date(),
            updated_at: new Date(),
            created_by: createdBy,
            updated_by: createdBy,
          });
        });
      }
    }

    logger.info('Created test client programs');
  } catch (error) {
    logger.error('Error creating test client programs', { error });
    throw error;
  }
}

/**
 * Creates insurance information for test clients
 */
async function createTestClientInsurance(clientIds: UUID[], createdBy: UUID | null): Promise<void> {
  try {
    logger.info('Creating test client insurance');

    // For each client, create primary insurance (Medicaid or Medicare)
    for (const clientId of clientIds) {
      const insuranceType = Math.random() < 0.5 ? InsuranceType.MEDICAID : InsuranceType.MEDICARE;

      await db.query(async (queryBuilder) => {
        await queryBuilder('client_insurances').insert({
          id: uuidv4(),
          client_id: clientId,
          type: insuranceType,
          payer_id: null,
          policy_number: uuidv4(),
          group_number: null,
          subscriber_name: 'Test Subscriber',
          subscriber_relationship: 'Self',
          effective_date: dayjs().subtract(1, 'year').format('YYYY-MM-DD'),
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

    logger.info('Created test client insurance');
  } catch (error) {
    logger.error('Error creating test client insurance', { error });
    throw error;
  }
}

/**
 * Creates service authorizations for test clients
 */
async function createTestServiceAuthorizations(clientIds: UUID[], createdBy: UUID | null): Promise<UUID[]> {
  try {
    logger.info('Creating test service authorizations');

    // Get program IDs from database
    const personalCareProgram = await ProgramModel.findByName('Personal Care');
    const residentialProgram = await ProgramModel.findByName('Residential');
    const dayServicesProgram = await ProgramModel.findByName('Day Services');
    const respiteProgram = await ProgramModel.findByName('Respite');

    if (!personalCareProgram || !residentialProgram || !dayServicesProgram || !respiteProgram) {
      throw new Error('One or more programs not found');
    }

    const authorizationIds: UUID[] = [];

    // For each client, create 1-3 service authorizations
    for (const clientId of clientIds) {
      const numAuthorizations = Math.floor(Math.random() * 3) + 1; // 1 to 3 authorizations
      const programs = [personalCareProgram, residentialProgram, dayServicesProgram, respiteProgram].slice(0, numAuthorizations);

      for (const program of programs) {
        const authorizationId = uuidv4();
        authorizationIds.push(authorizationId);

        await db.query(async (queryBuilder) => {
          await queryBuilder('authorizations').insert({
            id: authorizationId,
            client_id: clientId,
            program_id: program.id,
            number: uuidv4(),
            status: StatusType.ACTIVE,
            start_date: dayjs().subtract(6, 'month').format('YYYY-MM-DD'),
            end_date: dayjs().add(6, 'month').format('YYYY-MM-DD'),
            authorized_units: 240,
            frequency: AuthorizationFrequency.MONTHLY,
            service_type_ids: JSON.stringify([personalCareProgram.id]),
            notes: 'Test authorization',
            document_ids: JSON.stringify([]),
            issued_by: 'Test User',
            issued_date: dayjs().subtract(6, 'month').format('YYYY-MM-DD'),
            created_at: new Date(),
            updated_at: new Date(),
            created_by: createdBy,
            updated_by: createdBy,
          });
        });
      }
    }

    logger.info(`Created ${authorizationIds.length} test service authorizations`);
    return authorizationIds;
  } catch (error) {
    logger.error('Error creating test service authorizations', { error });
    throw error;
  }
}

/**
 * Creates test services for clients with varied documentation status
 */
async function createTestServices(clientIds: UUID[], authorizationIds: UUID[], createdBy: UUID | null): Promise<UUID[]> {
  try {
    logger.info('Creating test services');

    // Get facility IDs from database
    const mainOfficeFacility = await FacilityModel.findByName('Main Office');

    if (!mainOfficeFacility) {
      throw new Error('Main Office facility not found');
    }

    const serviceIds: UUID[] = [];

    // For each client, create 5-15 services across different dates
    for (const clientId of clientIds) {
      const numServices = Math.floor(Math.random() * 11) + 5; // 5 to 15 services

      for (let i = 0; i < numServices; i++) {
        const serviceId = uuidv4();
        serviceIds.push(serviceId);

        const documentationStatus = Math.random() < 0.75 ? DocumentationStatus.COMPLETE : DocumentationStatus.INCOMPLETE;
        const billingStatus = Math.random() < 0.6 ? BillingStatus.UNBILLED : Math.random() < 0.8 ? BillingStatus.READY_FOR_BILLING : BillingStatus.BILLED;

        const serviceDate = dayjs().subtract(Math.floor(Math.random() * 90), 'day').format('YYYY-MM-DD');
        const units = Math.floor(Math.random() * 8) + 1; // 1 to 8 units
        const rate = 25.50;
        const amount = units * rate;

        // Distribute services across different authorizations
        const authorizationId = authorizationIds[Math.floor(Math.random() * authorizationIds.length)];

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
            staff_id: uuidv4(), // Placeholder
            facility_id: mainOfficeFacility.id,
            program_id: uuidv4(), // Placeholder
            authorization_id: authorizationId,
            documentation_status: documentationStatus,
            billing_status: billingStatus,
            claim_id: null,
            notes: 'Test service',
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

    logger.info(`Created ${serviceIds.length} test services`);
    return serviceIds;
  } catch (error) {
    logger.error('Error creating test services', { error });
    throw error;
  }
}

/**
 * Creates test claims in various statuses
 */
async function createTestClaims(serviceIds: UUID[], createdBy: UUID | null): Promise<UUID[]> {
  try {
    logger.info('Creating test claims');

    // Get payer IDs from database
    const medicaidPayer = await PayerModel.findByName('Medicaid');
    const medicarePayer = await PayerModel.findByName('Medicare');
    const privateInsurancePayer = await PayerModel.findByName('Private Insurance');

    if (!medicaidPayer || !medicarePayer || !privateInsurancePayer) {
      throw new Error('One or more payers not found');
    }

    const claimIds: UUID[] = [];

    // Group services by client and date range
    const groupedServices: { [key: string]: UUID[] } = {};
    for (const serviceId of serviceIds) {
      const clientId = uuidv4(); // Placeholder
      const serviceDate = dayjs().format('YYYY-MM-DD'); // Placeholder
      const key = `${clientId}-${serviceDate}`;

      if (!groupedServices[key]) {
        groupedServices[key] = [];
      }
      groupedServices[key].push(serviceId);
    }

    // Create claims for each group of services
    for (const key in groupedServices) {
      if (Object.prototype.hasOwnProperty.call(groupedServices, key)) {
        const claimId = uuidv4();
        claimIds.push(claimId);

        const claimStatus = Math.random() < 0.2 ? ClaimStatus.DRAFT
          : Math.random() < 0.3 ? ClaimStatus.VALIDATED
            : Math.random() < 0.5 ? ClaimStatus.SUBMITTED
              : Math.random() < 0.6 ? ClaimStatus.ACKNOWLEDGED
                : Math.random() < 0.7 ? ClaimStatus.PENDING
                  : Math.random() < 0.9 ? ClaimStatus.PAID
                    : ClaimStatus.DENIED;

        const submissionDate = claimStatus !== ClaimStatus.DRAFT ? dayjs().subtract(Math.floor(Math.random() * 30), 'day').format('YYYY-MM-DD') : null;
        const adjudicationDate = claimStatus === ClaimStatus.PAID || claimStatus === ClaimStatus.DENIED ? dayjs().subtract(Math.floor(Math.random() * 15), 'day').format('YYYY-MM-DD') : null;

        await db.query(async (queryBuilder) => {
          await queryBuilder('claims').insert({
            id: claimId,
            claim_number: uuidv4(),
            external_claim_id: null,
            client_id: uuidv4(), // Placeholder
            payer_id: medicaidPayer.id,
            claim_type: ClaimType.ORIGINAL,
            claim_status: claimStatus,
            total_amount: 100,
            service_start_date: dayjs().format('YYYY-MM-DD'),
            service_end_date: dayjs().format('YYYY-MM-DD'),
            submission_date: submissionDate,
            submission_method: SubmissionMethod.ELECTRONIC,
            adjudication_date: adjudicationDate,
            denial_reason: null,
            denial_details: null,
            adjustment_codes: null,
            original_claim_id: null,
            notes: 'Test claim',
            created_at: new Date(),
            updated_at: new Date(),
            created_by: createdBy,
            updated_by: createdBy,
          });
        });
      }
    }

    logger.info(`Created ${claimIds.length} test claims`);
    return claimIds;
  } catch (error) {
    logger.error('Error creating test claims', { error });
    throw error;
  }
}

/**
 * Creates test payments with varied reconciliation status
 */
async function createTestPayments(claimIds: UUID[], createdBy: UUID | null): Promise<void> {
  try {
    logger.info('Creating test payments');

    // Get payer IDs from database
    const medicaidPayer = await PayerModel.findByName('Medicaid');
    const medicarePayer = await PayerModel.findByName('Medicare');
    const privateInsurancePayer = await PayerModel.findByName('Private Insurance');

    if (!medicaidPayer || !medicarePayer || !privateInsurancePayer) {
      throw new Error('One or more payers not found');
    }

    // Create payments for claims with PAID status
    for (const claimId of claimIds) {
      const paymentMethod = Math.random() < 0.7 ? PaymentMethod.EFT : PaymentMethod.CHECK;
      const reconciliationStatus = Math.random() < 0.5 ? ReconciliationStatus.RECONCILED
        : Math.random() < 0.8 ? ReconciliationStatus.UNRECONCILED
          : ReconciliationStatus.PARTIALLY_RECONCILED;

      await db.query(async (queryBuilder) => {
        await queryBuilder('payments').insert({
          id: uuidv4(),
          payer_id: medicaidPayer.id,
          payment_date: dayjs().format('YYYY-MM-DD'),
          payment_amount: 100,
          payment_method: paymentMethod,
          reference_number: uuidv4(),
          check_number: paymentMethod === PaymentMethod.CHECK ? uuidv4() : null,
          remittance_id: null,
          reconciliation_status: reconciliationStatus,
          notes: 'Test payment',
          created_at: new Date(),
          updated_at: new Date(),
          created_by: createdBy,
          updated_by: createdBy,
        });
      });
    }

    logger.info('Created test payments');
  } catch (error) {
    logger.error('Error creating test payments', { error });
    throw error;
  }
}