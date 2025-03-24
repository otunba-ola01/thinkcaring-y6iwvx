import { z } from 'zod'; // version 3.21+
import {
  validateSchema,
  validateSchemaAsync,
  isValidUUID,
  isValidDate,
  isValidEmail,
  isValidPhoneNumber,
  isValidCurrency,
  isValidPercentage,
  createValidationError,
  validateRequiredFields
} from '../../utils/validation';
import { ValidationError } from '../../errors/validation-error';
import { ErrorCode } from '../../types/error.types';

describe('validateSchema', () => {
  it('should validate data against a schema', () => {
    // Define a simple schema
    const schema = z.object({
      name: z.string(),
      age: z.number().positive(),
      email: z.string().email()
    });

    // Valid data
    const validData = {
      name: 'John Doe',
      age: 30,
      email: 'john.doe@example.com'
    };

    // Act & Assert
    expect(() => validateSchema(schema, validData, 'User')).not.toThrow();
    const result = validateSchema(schema, validData, 'User');
    expect(result).toEqual(validData);
  });

  it('should return properly typed data', () => {
    // Define a schema with transformations
    const schema = z.object({
      id: z.string().uuid(),
      amount: z.number().transform(val => val.toFixed(2)),
      tags: z.array(z.string())
    });

    // Input data
    const inputData = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      amount: 99.99,
      tags: ['tag1', 'tag2']
    };

    // Act
    const result = validateSchema(schema, inputData, 'Transaction');

    // Assert
    expect(result).toHaveProperty('id', inputData.id);
    expect(result).toHaveProperty('amount', '99.99');
    expect(result).toHaveProperty('tags', inputData.tags);
  });

  it('should throw ValidationError for invalid data', () => {
    // Define a schema
    const schema = z.object({
      name: z.string(),
      age: z.number().positive(),
      email: z.string().email()
    });

    // Invalid data
    const invalidData = {
      name: 'John Doe',
      age: -5, // Invalid age (not positive)
      email: 'not-an-email' // Invalid email
    };

    // Act & Assert
    expect(() => validateSchema(schema, invalidData, 'User')).toThrow(ValidationError);
  });

  it('should include proper error details in ValidationError', () => {
    // Define a schema
    const schema = z.object({
      name: z.string(),
      age: z.number().positive(),
      email: z.string().email()
    });

    // Invalid data
    const invalidData = {
      name: 'John Doe',
      age: -5, // Invalid age
      email: 'not-an-email' // Invalid email
    };

    // Act & Assert
    try {
      validateSchema(schema, invalidData, 'User');
      fail('Expected validation to throw an error');
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      
      const validationError = error as ValidationError;
      expect(validationError.validationErrors).toHaveLength(2);
      
      // Check that it includes errors for both invalid fields
      const fields = validationError.validationErrors.map(err => err.field);
      expect(fields).toContain('age');
      expect(fields).toContain('email');
    }
  });

  it('should validate complex nested objects', () => {
    // Define a schema with nested objects
    const addressSchema = z.object({
      street: z.string(),
      city: z.string(),
      state: z.string().length(2),
      zipCode: z.string().regex(/^\d{5}(-\d{4})?$/)
    });

    const userSchema = z.object({
      name: z.string(),
      address: addressSchema,
      contacts: z.array(z.string().email())
    });

    // Valid nested data
    const validData = {
      name: 'John Doe',
      address: {
        street: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        zipCode: '12345'
      },
      contacts: ['john.doe@example.com', 'jdoe@company.com']
    };

    // Invalid nested data
    const invalidData = {
      name: 'John Doe',
      address: {
        street: '123 Main St',
        city: 'Anytown',
        state: 'California', // Too long
        zipCode: 'abc' // Invalid format
      },
      contacts: ['john.doe@example.com', 'not-an-email']
    };

    // Act & Assert for valid data
    expect(() => validateSchema(userSchema, validData, 'UserProfile')).not.toThrow();
    
    // Act & Assert for invalid data
    try {
      validateSchema(userSchema, invalidData, 'UserProfile');
      fail('Expected validation to throw an error');
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      
      const validationError = error as ValidationError;
      expect(validationError.validationErrors.length).toBeGreaterThanOrEqual(2);
      
      // Check that it includes errors for nested fields
      const fields = validationError.validationErrors.map(err => err.field);
      expect(fields).toContain('address.state');
      expect(fields).toContain('address.zipCode');
      expect(fields).toContain('contacts.1');
    }
  });

  it('should allow custom error messages', () => {
    // Define a schema with custom error messages
    const schema = z.object({
      name: z.string({
        required_error: 'Name is required',
        invalid_type_error: 'Name must be a string'
      }),
      age: z.number({
        required_error: 'Age is required',
        invalid_type_error: 'Age must be a number'
      }).positive('Age must be positive'),
      email: z.string().email('Invalid email format')
    });

    // Invalid data
    const invalidData = {
      name: 123, // Not a string
      age: -5, // Not positive
      email: 'not-an-email' // Invalid email
    };

    // Act & Assert
    try {
      validateSchema(schema, invalidData, 'User');
      fail('Expected validation to throw an error');
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      
      const validationError = error as ValidationError;
      
      // Check for custom error messages
      const nameError = validationError.validationErrors.find(e => e.field === 'name');
      const ageError = validationError.validationErrors.find(e => e.field === 'age');
      const emailError = validationError.validationErrors.find(e => e.field === 'email');
      
      expect(nameError?.message).toBe('Name must be a string');
      expect(ageError?.message).toBe('Age must be positive');
      expect(emailError?.message).toBe('Invalid email format');
    }
  });
});

describe('validateSchemaAsync', () => {
  it('should validate data asynchronously', async () => {
    // Define a simple schema
    const schema = z.object({
      name: z.string(),
      age: z.number().positive(),
      email: z.string().email()
    });

    // Valid data
    const validData = {
      name: 'John Doe',
      age: 30,
      email: 'john.doe@example.com'
    };

    // Act & Assert
    await expect(validateSchemaAsync(schema, validData, 'User')).resolves.toEqual(validData);
  });

  it('should throw ValidationError for invalid data', async () => {
    // Define a schema
    const schema = z.object({
      name: z.string(),
      age: z.number().positive(),
      email: z.string().email()
    });

    // Invalid data
    const invalidData = {
      name: 'John Doe',
      age: -5, // Invalid age
      email: 'not-an-email' // Invalid email
    };

    // Act & Assert
    await expect(validateSchemaAsync(schema, invalidData, 'User')).rejects.toBeInstanceOf(ValidationError);
  });

  it('should include proper error details in ValidationError', async () => {
    // Define a schema
    const schema = z.object({
      name: z.string(),
      age: z.number().positive(),
      email: z.string().email()
    });

    // Invalid data
    const invalidData = {
      name: 'John Doe',
      age: -5, // Invalid age
      email: 'not-an-email' // Invalid email
    };

    // Act & Assert
    try {
      await validateSchemaAsync(schema, invalidData, 'User');
      fail('Expected validation to throw an error');
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      
      const validationError = error as ValidationError;
      expect(validationError.validationErrors).toHaveLength(2);
      
      // Check that it includes errors for both invalid fields
      const fields = validationError.validationErrors.map(err => err.field);
      expect(fields).toContain('age');
      expect(fields).toContain('email');
    }
  });

  it('should support async validation with refinements', async () => {
    // Define a schema with async refinement
    const schema = z.object({
      username: z.string().refine(
        async (val) => {
          // Simulate checking if username is available
          await new Promise(resolve => setTimeout(resolve, 10));
          return val !== 'admin'; // 'admin' username is not available
        },
        { message: 'Username is not available' }
      )
    });

    // Test with valid username
    await expect(validateSchemaAsync(schema, { username: 'newuser' }, 'Registration'))
      .resolves.toEqual({ username: 'newuser' });

    // Test with invalid username
    await expect(validateSchemaAsync(schema, { username: 'admin' }, 'Registration'))
      .rejects.toBeInstanceOf(ValidationError);
  });

  it('should handle async validation with transformations', async () => {
    // Define a schema with async transformation
    const schema = z.object({
      id: z.string().uuid(),
      createdAt: z.string().transform(async (val) => {
        // Simulate async date parsing
        await new Promise(resolve => setTimeout(resolve, 10));
        return new Date(val);
      })
    });

    // Valid data
    const validData = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      createdAt: '2023-05-01T00:00:00Z'
    };

    // Act
    const result = await validateSchemaAsync(schema, validData, 'Event');

    // Assert
    expect(result).toHaveProperty('id', validData.id);
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.createdAt.toISOString()).toBe(validData.createdAt);
  });
});

describe('isValidUUID', () => {
  it('should return true for valid UUIDs', () => {
    // Valid UUIDs
    const validUUIDs = [
      '123e4567-e89b-12d3-a456-426614174000',
      'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      '00000000-0000-4000-a000-000000000000'
    ];

    // Act & Assert
    validUUIDs.forEach(uuid => {
      expect(isValidUUID(uuid)).toBe(true);
    });
  });

  it('should return false for invalid UUIDs', () => {
    // Invalid UUIDs
    const invalidUUIDs = [
      'not-a-uuid',
      '123e4567-e89b-12d3-a456-42661417400', // Too short
      '123e4567-e89b-12d3-a456-4266141740000', // Too long
      '123e4567-e89b-12d3-a456_426614174000', // Invalid separator
      '123e4567-e89b-12d3-a456', // Incomplete
      'GGGGGGGG-GGGG-GGGG-GGGG-GGGGGGGGGGGG' // Invalid characters
    ];

    // Act & Assert
    invalidUUIDs.forEach(uuid => {
      expect(isValidUUID(uuid)).toBe(false);
    });
  });

  it('should return false for non-string inputs', () => {
    // Non-string inputs
    const nonStringInputs = [
      null,
      undefined,
      123,
      true,
      {},
      [],
      () => {}
    ];

    // Act & Assert
    nonStringInputs.forEach(input => {
      expect(isValidUUID(input as any)).toBe(false);
    });
  });

  it('should handle edge cases properly', () => {
    // Edge cases
    const edgeCases = [
      '', // Empty string
      ' ', // Space
      ' 123e4567-e89b-12d3-a456-426614174000 ' // Valid UUID with whitespace
    ];

    // Act & Assert
    edgeCases.forEach(input => {
      expect(isValidUUID(input)).toBe(false);
    });
  });
});

describe('isValidDate', () => {
  it('should return true for valid dates in YYYY-MM-DD format', () => {
    // Valid dates
    const validDates = [
      '2023-01-01',
      '2023-12-31',
      '2000-02-29', // Leap year
      '1900-01-01',
      '2023-05-15'
    ];

    // Act & Assert
    validDates.forEach(date => {
      expect(isValidDate(date)).toBe(true);
    });
  });

  it('should return false for invalid date formats', () => {
    // Invalid date formats
    const invalidDateFormats = [
      '01-01-2023', // MM-DD-YYYY
      '2023/01/01', // YYYY/MM/DD
      '2023.01.01', // YYYY.MM.DD
      '20230101',   // YYYYMMDD
      '2023-1-1',   // Missing leading zeros
      '23-01-01'    // YY-MM-DD
    ];

    // Act & Assert
    invalidDateFormats.forEach(date => {
      expect(isValidDate(date)).toBe(false);
    });
  });

  it('should return false for invalid dates', () => {
    // Invalid dates (with valid format)
    const invalidDates = [
      '2023-02-30', // February 30 doesn't exist
      '2023-02-31', // February 31 doesn't exist
      '2023-04-31', // April 31 doesn't exist
      '2023-06-31', // June 31 doesn't exist
      '2023-09-31', // September 31 doesn't exist
      '2023-11-31', // November 31 doesn't exist
      '2023-00-01', // Month 0 doesn't exist
      '2023-13-01', // Month 13 doesn't exist
      '2023-01-00', // Day 0 doesn't exist
      '2023-01-32', // Day 32 doesn't exist
      '2023-02-29'  // Not a leap year
    ];

    // Act & Assert
    invalidDates.forEach(date => {
      expect(isValidDate(date)).toBe(false);
    });
  });

  it('should return false for non-string inputs', () => {
    // Non-string inputs
    const nonStringInputs = [
      null,
      undefined,
      123,
      true,
      {},
      [],
      () => {},
      new Date()
    ];

    // Act & Assert
    nonStringInputs.forEach(input => {
      expect(isValidDate(input as any)).toBe(false);
    });
  });

  it('should handle edge cases properly', () => {
    // Edge cases
    const edgeCases = [
      '', // Empty string
      ' ', // Space
      ' 2023-01-01 ' // Valid date with whitespace
    ];

    // Act & Assert
    edgeCases.forEach(input => {
      expect(isValidDate(input)).toBe(false);
    });
  });
});

describe('isValidEmail', () => {
  it('should return true for valid email addresses', () => {
    // Valid email addresses
    const validEmails = [
      'test@example.com',
      'user.name@example.com',
      'user+tag@example.com',
      'user-name@example.co.uk',
      'user123@example.io',
      'first.last@subdomain.example.com'
    ];

    // Act & Assert
    validEmails.forEach(email => {
      expect(isValidEmail(email)).toBe(true);
    });
  });

  it('should return false for invalid email formats', () => {
    // Invalid email formats
    const invalidEmails = [
      'not-an-email',
      'missing@domain',
      '@example.com',
      'spaces in@example.com',
      'missing.domain@',
      'double..dots@example.com',
      'invalid@chars@example.com',
      'invalid@domain@with@multiple@ats.com',
      'invalid@.com',
      'invalid@domain.',
      '.invalid@domain.com'
    ];

    // Act & Assert
    invalidEmails.forEach(email => {
      expect(isValidEmail(email)).toBe(false);
    });
  });

  it('should return false for non-string inputs', () => {
    // Non-string inputs
    const nonStringInputs = [
      null,
      undefined,
      123,
      true,
      {},
      [],
      () => {}
    ];

    // Act & Assert
    nonStringInputs.forEach(input => {
      expect(isValidEmail(input as any)).toBe(false);
    });
  });

  it('should handle edge cases properly', () => {
    // Edge cases
    const edgeCases = [
      '', // Empty string
      ' ', // Space
      ' test@example.com ' // Valid email with whitespace
    ];

    // Act & Assert
    edgeCases.forEach(input => {
      expect(isValidEmail(input)).toBe(false);
    });
  });
});

describe('isValidPhoneNumber', () => {
  it('should return true for valid US phone numbers', () => {
    // Valid US phone numbers (10 digits)
    const validPhoneNumbers = [
      '1234567890',
      '5551234567',
      '9876543210'
    ];

    // Act & Assert
    validPhoneNumbers.forEach(phone => {
      expect(isValidPhoneNumber(phone)).toBe(true);
    });
  });

  it('should return true for formatted phone numbers', () => {
    // Formatted phone numbers
    const formattedPhoneNumbers = [
      '(123) 456-7890',
      '123-456-7890',
      '123.456.7890',
      '123 456 7890'
    ];

    // Act & Assert
    formattedPhoneNumbers.forEach(phone => {
      expect(isValidPhoneNumber(phone)).toBe(true);
    });
  });

  it('should return false for invalid phone numbers', () => {
    // Invalid phone numbers
    const invalidPhoneNumbers = [
      '123456789', // Too short (9 digits)
      '12345678901', // Too long (11 digits)
      '12345', // Too short
      'abcdefghij', // Not numeric
      '123-456-789', // Too short after removing formatting
      '123-4567-8901' // Too long after removing formatting
    ];

    // Act & Assert
    invalidPhoneNumbers.forEach(phone => {
      expect(isValidPhoneNumber(phone)).toBe(false);
    });
  });

  it('should return false for non-string inputs', () => {
    // Non-string inputs
    const nonStringInputs = [
      null,
      undefined,
      123,
      true,
      {},
      [],
      () => {}
    ];

    // Act & Assert
    nonStringInputs.forEach(input => {
      expect(isValidPhoneNumber(input as any)).toBe(false);
    });
  });

  it('should handle edge cases properly', () => {
    // Edge cases
    const edgeCases = [
      '', // Empty string
      ' ', // Space
      ' 1234567890 ' // Valid phone with whitespace
    ];

    // Act & Assert
    edgeCases.forEach(input => {
      expect(isValidPhoneNumber(input)).toBe(false);
    });
  });
});

describe('isValidCurrency', () => {
  it('should return true for valid currency amounts', () => {
    // Valid currency amounts
    const validCurrencyAmounts = [
      0,
      1,
      1.5,
      1.50,
      1.99,
      1000,
      1000.00,
      1000000.99,
      -1, // Negative values are valid for currency (e.g., refunds)
      -1.99
    ];

    // Act & Assert
    validCurrencyAmounts.forEach(amount => {
      expect(isValidCurrency(amount)).toBe(true);
    });
  });

  it('should return true for string currency values', () => {
    // Valid string currency values
    const validStringCurrencyValues = [
      '0',
      '1',
      '1.5',
      '1.50',
      '1.99',
      '1000',
      '1000.00',
      '1000000.99',
      '-1',
      '-1.99'
    ];

    // Act & Assert
    validStringCurrencyValues.forEach(amount => {
      expect(isValidCurrency(amount)).toBe(true);
    });
  });

  it('should return false for values with too many decimal places', () => {
    // Values with too many decimal places
    const invalidDecimalPlaces = [
      1.999,
      0.001,
      -1.999,
      '1.999',
      '0.001',
      '-1.999'
    ];

    // Act & Assert
    invalidDecimalPlaces.forEach(amount => {
      expect(isValidCurrency(amount)).toBe(false);
    });
  });

  it('should return false for non-numeric strings', () => {
    // Non-numeric strings
    const nonNumericStrings = [
      'abc',
      'one',
      '1a',
      '1,000',
      '$1.99',
      '1.99$'
    ];

    // Act & Assert
    nonNumericStrings.forEach(input => {
      expect(isValidCurrency(input)).toBe(false);
    });
  });

  it('should handle edge cases properly', () => {
    // Edge cases
    const edgeCases = [
      '', // Empty string
      ' ', // Space
      ' 1.99 ' // Valid amount with whitespace
    ];

    // Act & Assert
    edgeCases.forEach(input => {
      expect(isValidCurrency(input)).toBe(false);
    });
  });
});

describe('isValidPercentage', () => {
  it('should return true for valid percentages (0-100)', () => {
    // Valid percentages
    const validPercentages = [
      0,
      1,
      50,
      99,
      100,
      0.5,
      99.9
    ];

    // Act & Assert
    validPercentages.forEach(percentage => {
      expect(isValidPercentage(percentage)).toBe(true);
    });
  });

  it('should return true for string percentage values', () => {
    // Valid string percentage values
    const validStringPercentages = [
      '0',
      '1',
      '50',
      '99',
      '100',
      '0.5',
      '99.9'
    ];

    // Act & Assert
    validStringPercentages.forEach(percentage => {
      expect(isValidPercentage(percentage)).toBe(true);
    });
  });

  it('should return false for values outside the 0-100 range', () => {
    // Values outside 0-100 range
    const outOfRangeValues = [
      -1,
      101,
      -0.1,
      100.1,
      '-1',
      '101',
      '-0.1',
      '100.1'
    ];

    // Act & Assert
    outOfRangeValues.forEach(percentage => {
      expect(isValidPercentage(percentage)).toBe(false);
    });
  });

  it('should return false for non-numeric strings', () => {
    // Non-numeric strings
    const nonNumericStrings = [
      'abc',
      '50%',
      '50percent',
      '1a',
      '1,000'
    ];

    // Act & Assert
    nonNumericStrings.forEach(input => {
      expect(isValidPercentage(input)).toBe(false);
    });
  });

  it('should handle edge cases properly', () => {
    // Edge cases
    const edgeCases = [
      '', // Empty string
      ' ', // Space
      ' 50 ' // Valid percentage with whitespace
    ];

    // Act & Assert
    edgeCases.forEach(input => {
      expect(isValidPercentage(input)).toBe(false);
    });
  });
});

describe('createValidationError', () => {
  it('should create a ValidationError with the correct message', () => {
    // Arrange
    const message = 'Validation failed';
    const details = [];

    // Act
    const error = createValidationError(message, details);

    // Assert
    expect(error).toBeInstanceOf(ValidationError);
    expect(error.message).toBe(message);
  });

  it('should add validation details correctly', () => {
    // Arrange
    const message = 'Validation failed';
    const details = [
      { field: 'name', message: 'Name is required', value: null, code: ErrorCode.MISSING_REQUIRED_FIELD },
      { field: 'email', message: 'Invalid email format', value: 'not-an-email', code: ErrorCode.INVALID_FORMAT }
    ];

    // Act
    const error = createValidationError(message, details);

    // Assert
    expect(error.validationErrors).toHaveLength(2);
    expect(error.validationErrors[0]).toEqual(details[0]);
    expect(error.validationErrors[1]).toEqual(details[1]);
  });

  it('should create a ValidationError with the correct error code', () => {
    // Arrange
    const message = 'Validation failed';
    const details = [
      { field: 'name', message: 'Name is required', value: null, code: ErrorCode.MISSING_REQUIRED_FIELD }
    ];

    // Act
    const error = createValidationError(message, details);

    // Assert
    expect(error.code).toBe(ErrorCode.INVALID_INPUT);
  });

  it('should create a ValidationError with the correct HTTP status code', () => {
    // Arrange
    const message = 'Validation failed';
    const details = [];

    // Act
    const error = createValidationError(message, details);

    // Assert
    expect(error.status).toBe(400); // Bad Request
  });
});

describe('validateRequiredFields', () => {
  it('should return null when all required fields are present', () => {
    // Arrange
    const data = { name: 'John', email: 'john@example.com', age: 30 };
    const requiredFields = ['name', 'email', 'age'];

    // Act
    const result = validateRequiredFields(data, requiredFields);

    // Assert
    expect(result).toBeNull();
  });

  it('should return error details when fields are missing', () => {
    // Arrange
    const data = { name: 'John' };
    const requiredFields = ['name', 'email', 'age'];

    // Act
    const result = validateRequiredFields(data, requiredFields);

    // Assert
    expect(result).not.toBeNull();
    expect(result).toHaveLength(2);
    
    const fields = result?.map(detail => detail.field);
    expect(fields).toContain('email');
    expect(fields).toContain('age');
  });

  it('should identify null values as missing', () => {
    // Arrange
    const data = { name: 'John', email: null, age: 30 };
    const requiredFields = ['name', 'email', 'age'];

    // Act
    const result = validateRequiredFields(data, requiredFields);

    // Assert
    expect(result).not.toBeNull();
    expect(result).toHaveLength(1);
    expect(result?.[0].field).toBe('email');
    expect(result?.[0].code).toBe(ErrorCode.MISSING_REQUIRED_FIELD);
  });

  it('should correctly identify multiple missing fields', () => {
    // Arrange
    const data = { };
    const requiredFields = ['name', 'email', 'age'];

    // Act
    const result = validateRequiredFields(data, requiredFields);

    // Assert
    expect(result).not.toBeNull();
    expect(result).toHaveLength(3);
    
    const fields = result?.map(detail => detail.field);
    expect(fields).toContain('name');
    expect(fields).toContain('email');
    expect(fields).toContain('age');
  });

  it('should handle nested fields correctly', () => {
    // Arrange
    const data = {
      name: 'John',
      address: {
        city: 'New York'
        // street is missing
      }
    };
    const requiredFields = ['name', 'address.street', 'address.city'];

    // Act & Assert
    // Note: This test checks how the function handles nested field specifications
    const result = validateRequiredFields(data, requiredFields);
    expect(result).not.toBeNull();
    expect(result).toHaveLength(1);
    expect(result?.[0].field).toBe('address.street');
  });
});

describe('ValidationError', () => {
  it('should create an error with the correct properties', () => {
    // Arrange
    const message = 'Validation failed';

    // Act
    const error = new ValidationError(message);

    // Assert
    expect(error).toBeInstanceOf(ValidationError);
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe(message);
    expect(error.code).toBe(ErrorCode.INVALID_INPUT);
    expect(error.status).toBe(400);
    expect(error.validationErrors).toEqual([]);
  });

  it('should convert Zod errors correctly', () => {
    // Arrange
    const schema = z.object({
      name: z.string(),
      age: z.number().positive(),
      email: z.string().email()
    });

    // Create a Zod error
    let zodError: z.ZodError;
    try {
      schema.parse({
        name: 'John',
        age: -5,
        email: 'not-an-email'
      });
      fail('Expected Zod validation to throw an error');
    } catch (error) {
      zodError = error as z.ZodError;
    }

    // Act
    const validationError = ValidationError.fromZodError(zodError!);

    // Assert
    expect(validationError).toBeInstanceOf(ValidationError);
    expect(validationError.validationErrors).toHaveLength(2);
    
    // Check error codes
    const ageError = validationError.validationErrors.find(e => e.field === 'age');
    const emailError = validationError.validationErrors.find(e => e.field === 'email');
    
    expect(ageError?.code).toBe(ErrorCode.INVALID_FORMAT);
    expect(emailError?.code).toBe(ErrorCode.INVALID_FORMAT);
  });

  it('should add validation errors correctly', () => {
    // Arrange
    const error = new ValidationError('Validation failed');
    const validationError = {
      field: 'name',
      message: 'Name is required',
      value: null,
      code: ErrorCode.MISSING_REQUIRED_FIELD
    };

    // Act
    error.addValidationError(validationError);

    // Assert
    expect(error.validationErrors).toHaveLength(1);
    expect(error.validationErrors[0]).toEqual(validationError);
  });

  it('should get validation errors correctly', () => {
    // Arrange
    const error = new ValidationError('Validation failed');
    const validationErrors = [
      { field: 'name', message: 'Name is required', value: null, code: ErrorCode.MISSING_REQUIRED_FIELD },
      { field: 'email', message: 'Invalid email format', value: 'not-an-email', code: ErrorCode.INVALID_FORMAT }
    ];

    // Add errors
    validationErrors.forEach(ve => error.addValidationError(ve));

    // Act
    const result = error.getValidationErrors();

    // Assert
    expect(result).toHaveLength(2);
    expect(result).toEqual(validationErrors);
  });
});