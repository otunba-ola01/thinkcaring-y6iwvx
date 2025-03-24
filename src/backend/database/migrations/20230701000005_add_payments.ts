import type { Knex } from 'knex'; // v2.4.2
import type { Transaction } from '../../types/database.types';

/**
 * Migration: Add payment-related tables
 * 
 * Creates the database schema for payment processing and reconciliation, including:
 * - payments: Stores payment information received from payers
 * - claim_payments: Junction table linking claims with payments
 * - payment_adjustments: Tracks individual payment adjustments
 * - remittance_info: Stores metadata about remittance advice documents
 * - remittance_details: Stores line items from remittance advice documents
 */
export async function up(knex: Knex): Promise<void> {
  // Create payments table to track all incoming payments from payers
  await knex.schema.createTable('payments', (table) => {
    table.uuid('id').primary();
    table.uuid('payer_id').notNullable().references('id').inTable('payers');
    table.date('payment_date').notNullable();
    table.decimal('payment_amount', 12, 2).notNullable();
    table.string('payment_method', 20).notNullable().comment('eft, check, credit_card, cash, other');
    table.string('reference_number', 50).comment('Check number, EFT trace number, etc.');
    table.string('remittance_id', 50).comment('835 file identifier or other reference');
    table.string('reconciliation_status', 20).notNullable().defaultTo('received')
      .comment('received, matched, reconciled, posted, exception');
    table.text('notes');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    
    // Add indexes for performance on frequently queried columns
    table.index('payer_id');
    table.index('payment_date');
    table.index('reconciliation_status');
    table.index('reference_number');
  });

  // Create claim_payments junction table to associate claims with payments
  await knex.schema.createTable('claim_payments', (table) => {
    table.uuid('id').primary();
    table.uuid('claim_id').notNullable().references('id').inTable('claims');
    table.uuid('payment_id').notNullable().references('id').inTable('payments');
    table.decimal('paid_amount', 12, 2).notNullable().comment('Amount applied to this claim');
    table.jsonb('adjustment_codes').comment('JSON array of adjustment codes and amounts');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    
    // Add indexes and constraints
    table.index('claim_id');
    table.index('payment_id');
    table.unique(['claim_id', 'payment_id']);
  });

  // Create payment_adjustments table for detailed tracking of payment adjustments
  await knex.schema.createTable('payment_adjustments', (table) => {
    table.uuid('id').primary();
    table.uuid('claim_payment_id').notNullable().references('id').inTable('claim_payments');
    table.string('adjustment_code', 20).notNullable()
      .comment('Standard adjustment codes (CO, PR, OA, etc.) with reason code');
    table.decimal('adjustment_amount', 12, 2).notNullable();
    table.string('adjustment_reason', 255).comment('Description of the adjustment reason');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    
    // Add indexes for performance
    table.index('claim_payment_id');
    table.index('adjustment_code');
  });

  // Create remittance_info table for tracking remittance advice documents
  await knex.schema.createTable('remittance_info', (table) => {
    table.uuid('id').primary();
    table.uuid('payment_id').references('id').inTable('payments')
      .comment('Associated payment record if available');
    table.string('remittance_number', 50).notNullable().comment('Unique identifier for the remittance');
    table.uuid('payer_id').notNullable().references('id').inTable('payers');
    table.date('remittance_date').notNullable();
    table.decimal('remittance_amount', 12, 2).notNullable().comment('Total amount in the remittance');
    table.string('remittance_format', 20).notNullable().comment('835, PDF, CSV, etc.');
    table.string('status', 20).notNullable().defaultTo('received')
      .comment('Processing status of the remittance');
    table.string('file_location', 255).comment('Path or reference to stored file');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    
    // Add indexes for performance
    table.index('payment_id');
    table.index('payer_id');
    table.index('remittance_date');
    table.index('remittance_number');
    table.index('status');
  });

  // Create remittance_details table for line items within remittance advice documents
  await knex.schema.createTable('remittance_details', (table) => {
    table.uuid('id').primary();
    table.uuid('remittance_id').notNullable().references('id').inTable('remittance_info');
    table.uuid('claim_id').references('id').inTable('claims')
      .comment('Associated claim if identified');
    table.uuid('service_id').references('id').inTable('services')
      .comment('Associated service if identified');
    table.date('service_date').comment('Date of service from remittance');
    table.decimal('billed_amount', 12, 2).notNullable().comment('Original billed amount');
    table.decimal('paid_amount', 12, 2).notNullable().comment('Amount paid for this line item');
    table.string('adjustment_code', 20).comment('Adjustment code if present');
    table.decimal('adjustment_amount', 12, 2).defaultTo(0.00)
      .comment('Amount of adjustment applied');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    
    // Add indexes for performance
    table.index('remittance_id');
    table.index('claim_id');
    table.index('service_id');
  });
}

/**
 * Rollback migration: Drop payment-related tables
 * 
 * Drops all tables created in the up migration in reverse order
 * to respect foreign key constraints.
 */
export async function down(knex: Knex): Promise<void> {
  // Drop tables in reverse order to respect foreign key constraints
  await knex.schema.dropTableIfExists('remittance_details');
  await knex.schema.dropTableIfExists('remittance_info');
  await knex.schema.dropTableIfExists('payment_adjustments');
  await knex.schema.dropTableIfExists('claim_payments');
  await knex.schema.dropTableIfExists('payments');
}