import * as Knex from 'knex'; // v2.4.2
import { Transaction, MigrationTableName } from '../../types/database.types';

/**
 * Migration to create the payers table
 * 
 * This migration establishes the data structure for managing funding sources such as
 * Medicaid, Medicare, private insurance, and other payers, including their contact
 * information, billing requirements, and submission methods.
 * 
 * @param knex - The Knex instance
 * @returns Promise resolving when the migration is complete
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('payers', (table) => {
    // Primary identifier
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    
    // Payer identification
    table.string('name', 255).notNullable();
    table.string('payer_type', 50).notNullable().comment('Medicaid, Medicare, Private, Other');
    table.string('payer_id', 100).comment('External identifier for the payer');
    
    // Address information
    table.string('street_address', 255);
    table.string('city', 100);
    table.string('state', 50);
    table.string('zip_code', 20);
    table.string('country', 50).defaultTo('USA');
    
    // Contact information
    table.string('phone', 50);
    table.string('email', 255);
    table.string('website', 255);
    table.string('contact_person', 100);
    
    // Billing requirements
    table.string('submission_format', 50).comment('837P, CMS-1500, etc.');
    table.integer('timely_filing_days').comment('Number of days allowed for claim submission');
    table.boolean('requires_authorization').defaultTo(false);
    table.jsonb('required_fields').comment('JSON array of fields required for submission');
    table.integer('claim_frequency_limit').comment('Maximum claims per submission');
    table.integer('service_line_limit').comment('Maximum service lines per claim');
    table.jsonb('custom_requirements').comment('Payer-specific requirements');
    
    // Submission method
    table.string('submission_method', 50).comment('Electronic, Paper, etc.');
    table.string('endpoint_url', 255).comment('API or submission endpoint');
    table.string('clearinghouse', 100).comment('Clearinghouse used for submission');
    table.string('trading_partner_id', 100).comment('Trading partner ID for electronic submission');
    
    // Credentials (encrypted)
    table.text('credential_key').comment('Encrypted API key or username');
    table.text('credential_secret').comment('Encrypted password or secret');
    
    // Additional configuration
    table.jsonb('submission_config').comment('Additional submission configuration');
    table.boolean('is_electronic').defaultTo(true).comment('Whether payer accepts electronic claims');
    
    // Status and metadata
    table.string('status', 20).notNullable().defaultTo('active').comment('active, inactive');
    table.text('notes').comment('Additional notes');
    
    // Audit columns
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by');
    table.uuid('updated_by');
    table.timestamp('deleted_at').nullable();
    table.uuid('deleted_by').nullable();
  });

  // Add indexes for efficient querying
  await knex.schema.raw('CREATE INDEX idx_payers_name ON payers (name)');
  await knex.schema.raw('CREATE INDEX idx_payers_payer_type ON payers (payer_type)');
  await knex.schema.raw('CREATE INDEX idx_payers_status ON payers (status)');
  await knex.schema.raw('CREATE UNIQUE INDEX idx_payers_payer_id ON payers (payer_id) WHERE payer_id IS NOT NULL');
  
  // Add a trigger to update the updated_at timestamp
  await knex.schema.raw(`
    CREATE OR REPLACE FUNCTION update_payers_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $$ language 'plpgsql';
    
    CREATE TRIGGER payers_updated_at
    BEFORE UPDATE ON payers
    FOR EACH ROW
    EXECUTE FUNCTION update_payers_updated_at();
  `);
}

/**
 * Migration to drop the payers table
 * 
 * @param knex - The Knex instance
 * @returns Promise resolving when the migration is complete
 */
export async function down(knex: Knex): Promise<void> {
  // Drop the trigger first
  await knex.schema.raw('DROP TRIGGER IF EXISTS payers_updated_at ON payers');
  await knex.schema.raw('DROP FUNCTION IF EXISTS update_payers_updated_at()');
  
  // Drop the table
  await knex.schema.dropTableIfExists('payers');
}