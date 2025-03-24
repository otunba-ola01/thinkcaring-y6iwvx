import { Knex } from 'knex'; // v2.4.2
import { Transaction } from '../../types/database.types';
import { 
  ReportType, 
  ReportCategory, 
  ReportStatus, 
  ScheduleFrequency, 
  ReportFormat 
} from '../../types/reports.types';

/**
 * Migration to create the report-related tables in the database
 * This implements the reporting infrastructure needed for financial analysis
 * and decision-making in the HCBS Revenue Management System.
 */
export async function up(knex: Knex): Promise<void> {
  // Create report_definitions table
  await knex.schema.createTable('report_definitions', (table) => {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    
    // Basic information
    table.string('name').notNullable();
    table.text('description');
    
    // Report type and category
    table.string('type').notNullable();
    table.string('category').notNullable();
    
    // Configuration
    table.jsonb('parameters').defaultTo('{}');
    table.jsonb('visualizations').defaultTo('[]');
    
    // Flags
    table.boolean('isTemplate').notNullable().defaultTo(false);
    table.boolean('isSystem').notNullable().defaultTo(false);
    
    // Organization
    table.uuid('organizationId').notNullable().references('id').inTable('organizations');
    
    // Audit columns
    table.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    table.uuid('createdBy');
    table.uuid('updatedBy');
    table.timestamp('deletedAt');
    
    // Indexes for performance
    table.index(['type']);
    table.index(['category']);
    table.index(['isTemplate']);
    table.index(['organizationId']);
  });
  
  // Create report_instances table
  await knex.schema.createTable('report_instances', (table) => {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    
    // Relationship to report definition
    table.uuid('reportDefinitionId').notNullable().references('id').inTable('report_definitions');
    
    // Basic information
    table.string('name').notNullable();
    table.jsonb('parameters').defaultTo('{}');
    
    // Status and timing
    table.string('status').notNullable().defaultTo(ReportStatus.PENDING);
    table.timestamp('generatedAt');
    table.timestamp('expiresAt');
    
    // Output information
    table.jsonb('fileUrls').defaultTo('{}');
    table.text('errorMessage');
    
    // Organization
    table.uuid('organizationId').notNullable().references('id').inTable('organizations');
    
    // Audit columns
    table.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    table.uuid('createdBy');
    table.uuid('updatedBy');
    table.timestamp('deletedAt');
    
    // Indexes for performance
    table.index(['reportDefinitionId']);
    table.index(['status']);
    table.index(['generatedAt']);
    table.index(['organizationId']);
  });
  
  // Create scheduled_reports table
  await knex.schema.createTable('scheduled_reports', (table) => {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    
    // Relationship to report definition
    table.uuid('reportDefinitionId').notNullable().references('id').inTable('report_definitions');
    
    // Basic information
    table.string('name').notNullable();
    table.text('description');
    table.jsonb('parameters').defaultTo('{}');
    
    // Schedule configuration
    table.string('frequency').notNullable();
    table.integer('dayOfWeek'); // 0-6 for Sunday-Saturday
    table.integer('dayOfMonth'); // 1-31
    table.string('time').notNullable(); // HH:MM in 24-hour format
    
    // Output configuration
    table.jsonb('formats').defaultTo('[]');
    table.jsonb('recipients').defaultTo('[]');
    
    // Status and timing
    table.boolean('isActive').notNullable().defaultTo(true);
    table.timestamp('lastRunAt');
    table.timestamp('nextRunAt').notNullable();
    
    // Organization
    table.uuid('organizationId').notNullable().references('id').inTable('organizations');
    
    // Audit columns
    table.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    table.uuid('createdBy');
    table.uuid('updatedBy');
    table.timestamp('deletedAt');
    
    // Indexes for performance
    table.index(['reportDefinitionId']);
    table.index(['isActive']);
    table.index(['nextRunAt']);
    table.index(['organizationId']);
  });
}

/**
 * Migration to drop the report-related tables from the database
 */
export async function down(knex: Knex): Promise<void> {
  // Drop in reverse order of creation to handle foreign key constraints
  await knex.schema.dropTableIfExists('scheduled_reports');
  await knex.schema.dropTableIfExists('report_instances');
  await knex.schema.dropTableIfExists('report_definitions');
}