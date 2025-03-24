import { v4 as uuidv4 } from 'uuid'; // version 9.0.0
import { Knex } from 'knex'; // version 2.4.2
import { 
  initializeDatabase, 
  closeDatabase, 
  getKnexInstance, 
  transaction 
} from '../../database/connection';
import { BaseRepository } from '../../database/repositories/base.repository';
import { 
  DatabaseEntity, 
  WhereCondition, 
  OrderBy, 
  Pagination 
} from '../../types/database.types';
import { UUID } from '../../types/common.types';
import { DatabaseError } from '../../errors/database-error';
import { mockUsers } from '../fixtures/users.fixtures';

/**
 * Test entity interface extending DatabaseEntity for integration testing
 */
interface TestEntity extends DatabaseEntity {
  id: UUID;
  name: string;
  description: string;
  value: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: UUID | null;
  updatedBy: UUID | null;
  deletedAt: Date | null;
  deletedBy: UUID | null;
}

/**
 * Test repository implementation extending BaseRepository for integration testing
 */
class TestEntityRepository extends BaseRepository<TestEntity> {
  constructor() {
    super('test_entities', 'id', true);
  }
}

describe('Database Integration Tests', () => {
  let testRepo: TestEntityRepository;
  
  beforeAll(async () => {
    // Initialize database connection
    await initializeDatabase();
    
    // Create test table
    const knex = getKnexInstance();
    
    // Create UUID extension if it doesn't exist
    await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    
    // Drop table if it exists
    await knex.schema.dropTableIfExists('test_entities');
    
    // Create test table
    await knex.schema.createTable('test_entities', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.string('name').notNullable();
      table.text('description');
      table.float('value').notNullable().defaultTo(0);
      table.boolean('active').notNullable().defaultTo(true);
      table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
      table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
      table.uuid('created_by').nullable();
      table.uuid('updated_by').nullable();
      table.timestamp('deleted_at').nullable();
      table.uuid('deleted_by').nullable();
    });
    
    // Initialize repository
    testRepo = new TestEntityRepository();
  });
  
  afterAll(async () => {
    // Drop test table
    const knex = getKnexInstance();
    await knex.schema.dropTableIfExists('test_entities');
    
    // Close database connection
    await closeDatabase();
  });
  
  beforeEach(async () => {
    // Clean test data
    const knex = getKnexInstance();
    await knex('test_entities').delete();
    
    // Reset sequences if any
    try {
      await knex.raw('ALTER SEQUENCE IF EXISTS test_entities_id_seq RESTART WITH 1');
    } catch (error) {
      // Ignore error if sequence doesn't exist
    }
  });
  
  describe('Database Connection Tests', () => {
    it('should initialize database connection successfully', async () => {
      // Close and re-initialize to test initialization
      await closeDatabase();
      await initializeDatabase();
      
      // Verify connection works by running a simple query
      const knex = getKnexInstance();
      const result = await knex.raw('SELECT 1 as value');
      
      expect(result).toBeTruthy();
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].value).toBe(1);
    });
    
    it('should close database connection successfully', async () => {
      // First make sure we have a connection
      await initializeDatabase();
      
      // Close the connection
      await closeDatabase();
      
      // Attempting to get instance should throw error
      expect(() => getKnexInstance()).toThrow(DatabaseError);
      
      // Reinitialize for other tests
      await initializeDatabase();
    });
    
    it('should throw error when trying to get instance before initialization', async () => {
      // Close the connection
      await closeDatabase();
      
      // Attempting to get instance should throw error
      expect(() => getKnexInstance()).toThrow(DatabaseError);
      
      // Reinitialize for other tests
      await initializeDatabase();
    });
    
    it('should return the same instance when calling getKnexInstance multiple times', async () => {
      const instance1 = getKnexInstance();
      const instance2 = getKnexInstance();
      
      expect(instance1).toBe(instance2);
    });
    
    it('should perform a simple query successfully', async () => {
      const knex = getKnexInstance();
      const result = await knex.raw('SELECT 1 as value');
      
      expect(result).toBeTruthy();
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].value).toBe(1);
    });
  });
  
  describe('Transaction Tests', () => {
    it('should commit transaction successfully', async () => {
      // Insert data within a transaction and commit
      const testEntity = {
        id: uuidv4(),
        name: 'Test Entity 1',
        description: 'Test entity created in transaction',
        value: 100,
        active: true
      };
      
      await transaction(async (trx) => {
        await trx('test_entities').insert(testEntity);
        // Transaction will commit automatically if no errors
      });
      
      // Verify the data was committed
      const knex = getKnexInstance();
      const result = await knex('test_entities').where('id', testEntity.id).first();
      
      expect(result).toBeTruthy();
      expect(result.name).toBe(testEntity.name);
    });
    
    it('should rollback transaction on error', async () => {
      // Insert data within a transaction that will fail
      const testEntity = {
        id: uuidv4(),
        name: 'Test Entity 2',
        description: 'Test entity for rollback',
        value: 200,
        active: true
      };
      
      try {
        await transaction(async (trx) => {
          await trx('test_entities').insert(testEntity);
          
          // Force an error to trigger rollback
          throw new Error('Forced transaction error');
        });
        
        // Should not reach this point
        fail('Transaction should have failed');
      } catch (error) {
        // Expected error, continue
        expect(error.message).toBe('Forced transaction error');
      }
      
      // Verify the data was not committed
      const knex = getKnexInstance();
      const result = await knex('test_entities').where('id', testEntity.id).first();
      
      expect(result).toBeUndefined();
    });
    
    it('should maintain isolation between transactions', async () => {
      // Create two transactions that don't see each other's changes
      const testEntity1 = {
        id: uuidv4(),
        name: 'Isolation Test 1',
        description: 'First entity for isolation test',
        value: 300,
        active: true
      };
      
      const testEntity2 = {
        id: uuidv4(),
        name: 'Isolation Test 2',
        description: 'Second entity for isolation test',
        value: 400,
        active: true
      };
      
      // Start first transaction but don't commit yet
      const trx1Promise = getKnexInstance().transaction(async (trx1) => {
        // Insert first entity
        await trx1('test_entities').insert(testEntity1);
        
        // Start second transaction
        const trx2Promise = getKnexInstance().transaction(async (trx2) => {
          // Insert second entity
          await trx2('test_entities').insert(testEntity2);
          
          // Check that first entity is not visible in second transaction
          const checkResult = await trx2('test_entities').where('id', testEntity1.id).first();
          expect(checkResult).toBeUndefined();
          
          // Commit second transaction
        });
        
        // Wait for second transaction to complete
        await trx2Promise;
        
        // Commit first transaction
      });
      
      // Wait for both transactions to complete
      await trx1Promise;
      
      // Verify both entities were committed
      const knex = getKnexInstance();
      const results = await knex('test_entities').whereIn('id', [testEntity1.id, testEntity2.id]);
      
      expect(results).toHaveLength(2);
    });
    
    it('should handle nested transactions correctly', async () => {
      // Test nested transactions with commit and rollback scenarios
      const testEntity1 = {
        id: uuidv4(),
        name: 'Nested Transaction 1',
        description: 'Entity for nested transaction test',
        value: 500,
        active: true
      };
      
      const testEntity2 = {
        id: uuidv4(),
        name: 'Nested Transaction 2',
        description: 'Entity for nested transaction test',
        value: 600,
        active: true
      };
      
      // Execute nested transactions
      await transaction(async (outerTrx) => {
        // Insert in outer transaction
        await outerTrx('test_entities').insert(testEntity1);
        
        // Start nested transaction that will commit
        await transaction(async (innerTrx) => {
          await innerTrx('test_entities').insert(testEntity2);
          // Inner transaction commits
        }, outerTrx);
        
        // Both entities should be visible in outer transaction
        const results = await outerTrx('test_entities')
          .whereIn('id', [testEntity1.id, testEntity2.id]);
        
        expect(results).toHaveLength(2);
        // Outer transaction commits
      });
      
      // Verify both entities were committed to the database
      const knex = getKnexInstance();
      const results = await knex('test_entities')
        .whereIn('id', [testEntity1.id, testEntity2.id]);
      
      expect(results).toHaveLength(2);
    });
  });
  
  describe('Repository Pattern Tests', () => {
    it('should create a new entity successfully', async () => {
      const newEntity = {
        name: 'Test Repository Entity',
        description: 'Entity created through repository',
        value: 1000,
        active: true
      };
      
      const result = await testRepo.create(newEntity);
      
      expect(result).toBeTruthy();
      expect(result.id).toBeTruthy();
      expect(result.name).toBe(newEntity.name);
      expect(result.description).toBe(newEntity.description);
      expect(result.value).toBe(newEntity.value);
      expect(result.active).toBe(newEntity.active);
      expect(result.createdAt).toBeTruthy();
      expect(result.updatedAt).toBeTruthy();
    });
    
    it('should find entity by ID successfully', async () => {
      // Create an entity
      const newEntity = {
        name: 'Find By ID Test',
        description: 'Entity for findById test',
        value: 1100,
        active: true
      };
      
      const created = await testRepo.create(newEntity);
      
      // Find the entity by ID
      const found = await testRepo.findById(created.id);
      
      expect(found).toBeTruthy();
      expect(found.id).toBe(created.id);
      expect(found.name).toBe(newEntity.name);
    });
    
    it('should find all entities with pagination', async () => {
      // Create multiple entities
      const entities = [
        {
          name: 'Find All Test 1',
          description: 'First entity for findAll test',
          value: 1200,
          active: true
        },
        {
          name: 'Find All Test 2',
          description: 'Second entity for findAll test',
          value: 1300,
          active: true
        },
        {
          name: 'Find All Test 3',
          description: 'Third entity for findAll test',
          value: 1400,
          active: false
        }
      ];
      
      for (const entity of entities) {
        await testRepo.create(entity);
      }
      
      // Test findAll with pagination
      const pagination: Pagination = { page: 1, limit: 2 };
      const result = await testRepo.findAll({}, pagination);
      
      expect(result).toBeTruthy();
      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(3);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(2);
      expect(result.totalPages).toBe(2);
      
      // Test second page
      const page2Result = await testRepo.findAll({}, { page: 2, limit: 2 });
      
      expect(page2Result).toBeTruthy();
      expect(page2Result.data).toHaveLength(1);
      expect(page2Result.total).toBe(3);
      expect(page2Result.page).toBe(2);
    });
    
    it('should update entity successfully', async () => {
      // Create an entity
      const newEntity = {
        name: 'Update Test',
        description: 'Entity for update test',
        value: 1500,
        active: true
      };
      
      const created = await testRepo.create(newEntity);
      
      // Update the entity
      const updates = {
        name: 'Updated Entity',
        value: 1600,
        active: false
      };
      
      const updated = await testRepo.update(created.id, updates);
      
      expect(updated).toBeTruthy();
      expect(updated.id).toBe(created.id);
      expect(updated.name).toBe(updates.name);
      expect(updated.value).toBe(updates.value);
      expect(updated.active).toBe(updates.active);
      expect(updated.description).toBe(created.description); // Not updated
      expect(updated.updatedAt).not.toEqual(created.updatedAt);
    });
    
    it('should soft delete entity successfully', async () => {
      // Create an entity
      const newEntity = {
        name: 'Soft Delete Test',
        description: 'Entity for soft delete test',
        value: 1700,
        active: true
      };
      
      const created = await testRepo.create(newEntity);
      
      // Soft delete the entity
      const deleted = await testRepo.delete(created.id);
      
      expect(deleted).toBe(true);
      
      // Entity should not be found with standard find
      const notFound = await testRepo.findById(created.id);
      expect(notFound).toBeNull();
      
      // Entity should still exist in the database with deleted_at set
      const knex = getKnexInstance();
      const result = await knex('test_entities')
        .where('id', created.id)
        .first();
      
      expect(result).toBeTruthy();
      expect(result.deleted_at).toBeTruthy();
    });
    
    it('should restore soft-deleted entity successfully', async () => {
      // Create an entity
      const newEntity = {
        name: 'Restore Test',
        description: 'Entity for restore test',
        value: 1800,
        active: true
      };
      
      const created = await testRepo.create(newEntity);
      
      // Soft delete the entity
      await testRepo.delete(created.id);
      
      // Restore the entity
      const restored = await testRepo.restore(created.id);
      
      expect(restored).toBe(true);
      
      // Entity should be found again
      const found = await testRepo.findById(created.id);
      expect(found).toBeTruthy();
      expect(found.id).toBe(created.id);
    });
    
    it('should hard delete entity when softDelete is false', async () => {
      // Create a repository with soft delete disabled
      class HardDeleteRepository extends BaseRepository<TestEntity> {
        constructor() {
          super('test_entities', 'id', false);
        }
      }
      
      const hardDeleteRepo = new HardDeleteRepository();
      
      // Create an entity
      const newEntity = {
        name: 'Hard Delete Test',
        description: 'Entity for hard delete test',
        value: 1900,
        active: true
      };
      
      const created = await hardDeleteRepo.create(newEntity);
      
      // Hard delete the entity
      const deleted = await hardDeleteRepo.delete(created.id);
      
      expect(deleted).toBe(true);
      
      // Entity should not exist in the database
      const knex = getKnexInstance();
      const result = await knex('test_entities')
        .where('id', created.id)
        .first();
      
      expect(result).toBeUndefined();
    });
    
    it('should handle complex where conditions', async () => {
      // Create entities with different values
      const entities = [
        { name: 'Where Test 1', value: 100, active: true },
        { name: 'Where Test 2', value: 200, active: true },
        { name: 'Where Test 3', value: 300, active: false },
        { name: 'Where Test 4', value: 400, active: false },
        { name: 'Different Name', value: 500, active: true }
      ];
      
      for (const entity of entities) {
        await testRepo.create(entity);
      }
      
      // Test where with multiple conditions
      const whereConditions = {
        active: true,
        name: 'Where Test 2'
      };
      
      const result = await testRepo.findAll(whereConditions);
      
      expect(result).toBeTruthy();
      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('Where Test 2');
      
      // Test with complex condition (using array of objects)
      const complexConditions = [
        { active: true },
        { value: 400 }
      ];
      
      const complexResult = await testRepo.findAll(complexConditions);
      
      // Should match entities that are active OR have value 400
      expect(complexResult).toBeTruthy();
      expect(complexResult.data.length).toBeGreaterThanOrEqual(3);
    });
    
    it('should handle order by clauses', async () => {
      // Create entities with different values
      const entities = [
        { name: 'Order Test C', value: 100 },
        { name: 'Order Test A', value: 300 },
        { name: 'Order Test B', value: 200 }
      ];
      
      for (const entity of entities) {
        await testRepo.create(entity);
      }
      
      // Test ordering by name ascending
      const orderByName: OrderBy[] = [
        { column: 'name', direction: 'ASC' }
      ];
      
      const ascResult = await testRepo.findAll({}, { page: 1, limit: 10 }, orderByName);
      
      expect(ascResult).toBeTruthy();
      expect(ascResult.data[0].name).toBe('Order Test A');
      expect(ascResult.data[1].name).toBe('Order Test B');
      expect(ascResult.data[2].name).toBe('Order Test C');
      
      // Test ordering by value descending
      const orderByValue: OrderBy[] = [
        { column: 'value', direction: 'DESC' }
      ];
      
      const descResult = await testRepo.findAll({}, { page: 1, limit: 10 }, orderByValue);
      
      expect(descResult).toBeTruthy();
      expect(descResult.data[0].value).toBe(300);
      expect(descResult.data[1].value).toBe(200);
      expect(descResult.data[2].value).toBe(100);
    });
    
    it('should handle transactions in repository methods', async () => {
      // Test that repository methods can use transactions
      const entity1 = {
        name: 'Transaction Test 1',
        value: 2000
      };
      
      const entity2 = {
        name: 'Transaction Test 2',
        value: 2100
      };
      
      // Execute operations in a transaction
      await transaction(async (trx) => {
        await testRepo.create(entity1, { transaction: trx });
        await testRepo.create(entity2, { transaction: trx });
      });
      
      // Verify both entities were created
      const results = await testRepo.findAll({
        name: { $like: 'Transaction Test%' }
      } as any);
      
      expect(results).toBeTruthy();
      expect(results.data.length).toBe(2);
    });
  });
  
  describe('Error Handling Tests', () => {
    it('should throw DatabaseError on query failure', async () => {
      // Attempt to query a non-existent table
      try {
        const knex = getKnexInstance();
        await knex('non_existent_table').select('*');
        fail('Expected query to throw an error');
      } catch (error) {
        expect(error).toBeInstanceOf(DatabaseError);
        expect(error.message).toContain('Database error');
      }
    });
    
    it('should throw DatabaseError with correct context on failure', async () => {
      // Create a repository for a non-existent table
      class InvalidRepository extends BaseRepository<any> {
        constructor() {
          super('non_existent_table');
        }
      }
      
      const invalidRepo = new InvalidRepository();
      
      try {
        await invalidRepo.findAll();
        fail('Expected findAll to throw an error');
      } catch (error) {
        expect(error).toBeInstanceOf(DatabaseError);
        expect(error.operation).toBe('findAll');
        expect(error.entity).toBe('non_existent_table');
      }
    });
    
    it('should handle constraint violations appropriately', async () => {
      // Create a table with a unique constraint
      const knex = getKnexInstance();
      await knex.schema.dropTableIfExists('constraint_test');
      await knex.schema.createTable('constraint_test', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table.string('name').unique().notNullable();
        table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
        table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
      });
      
      // Create a repository for this table
      class ConstraintRepository extends BaseRepository<any> {
        constructor() {
          super('constraint_test', 'id', false);
        }
      }
      
      const constraintRepo = new ConstraintRepository();
      
      // Insert a record
      await constraintRepo.create({ name: 'Unique Name' });
      
      // Try to insert a duplicate record
      try {
        await constraintRepo.create({ name: 'Unique Name' });
        fail('Expected create to throw a duplicate key error');
      } catch (error) {
        expect(error).toBeInstanceOf(DatabaseError);
        expect(error.code).toBe('DUPLICATE_ENTRY');
      }
      
      // Clean up
      await knex.schema.dropTable('constraint_test');
    });
  });
});