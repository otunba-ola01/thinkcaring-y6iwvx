import * as Knex from 'knex'; // v2.4.2
import { Transaction } from '../../types/database.types';
import { DocumentType, DocumentEntityType, DocumentStatus } from '../../models/document.model';

/**
 * Database migration to create the documents table
 * 
 * This migration creates a table to store document metadata for the HCBS Revenue Management System.
 * The table supports the storage and management of various document types such as service notes,
 * assessments, authorization letters, claim documentation, and payment remittances.
 * 
 * The actual document files are stored in S3 with metadata references maintained in this table.
 */

/**
 * Migration function to create the documents table in the database
 * 
 * @param knex - The Knex instance
 * @returns A promise that resolves when the migration is complete
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('documents', (table) => {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    
    // Document file metadata
    table.string('file_name').notNullable().comment('Original filename of the document');
    table.bigInteger('file_size').notNullable().comment('Size of the file in bytes');
    table.string('content_type').notNullable().comment('MIME type of the document');
    table.string('storage_key').notNullable().comment('S3 storage reference key');
    
    // Relationship fields
    table.enum('entity_type', Object.values(DocumentEntityType)).notNullable()
      .comment('Type of entity this document is associated with');
    table.uuid('entity_id').notNullable()
      .comment('ID of the entity this document is associated with');
    
    // Document classification
    table.enum('type', Object.values(DocumentType)).notNullable()
      .comment('Type of document (service note, assessment, etc.)');
    table.text('description').nullable()
      .comment('Description of the document');
    table.jsonb('tags').nullable().defaultTo('[]')
      .comment('Tags for categorizing and searching documents');
    table.enum('status', Object.values(DocumentStatus)).notNullable().defaultTo(DocumentStatus.PENDING)
      .comment('Current status of the document');
    
    // Additional metadata
    table.jsonb('metadata').nullable().defaultTo('{}')
      .comment('Additional metadata stored as key-value pairs');
    
    // Audit fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable();
    table.uuid('updated_by').notNullable();
    table.timestamp('deleted_at').nullable();
    
    // Indexes for common query patterns
    table.index(['entity_type', 'entity_id'], 'idx_documents_entity');
    table.index('type', 'idx_documents_type');
    table.index('status', 'idx_documents_status');
  });
}

/**
 * Migration function to drop the documents table from the database
 * 
 * @param knex - The Knex instance
 * @returns A promise that resolves when the table is dropped
 */
export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('documents');
}