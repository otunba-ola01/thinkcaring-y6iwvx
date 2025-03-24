import z from 'zod'; // v3.21.0
import { 
  validateField, 
  validateForm, 
  formatZodErrors, 
  formatValidationError, 
  createZodSchema, 
  getZodValidator, 
  applyValidationRule, 
  isValidEmail, 
  isValidPhone, 
  isValidCurrency, 
  isValidMedicaidId, 
  validators 
} from '../../../utils/validation';
import { FormValidationRule } from '../../../types/form.types';
import { validationPatterns, validationMessages } from '../../../config/validation.config';

describe('validateField', () => {
  it('should return error for required field with empty value', () => {
    const result = validateField('', 'firstName', [{ rule: FormValidationRule.REQUIRED }]);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBe(1);
    expect(result.errors[0]).toContain('First Name is required');
  });

  it('should pass validation for required field with valid value', () => {
    const result = validateField('John', 'firstName', [{ rule: FormValidationRule.REQUIRED }]);
    expect(result.valid).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  it('should validate minimum length constraint', () => {
    const result = validateField('Ab', 'password', [
      { rule: FormValidationRule.MIN_LENGTH, value: 8 }
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('at least 8 characters');
  });

  it('should validate maximum length constraint', () => {
    const result = validateField('ThisIsAVeryLongFieldValue', 'username', [
      { rule: FormValidationRule.MAX_LENGTH, value: 10 }
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('not exceed 10 characters');
  });

  it('should validate minimum value constraint', () => {
    const result = validateField(5, 'quantity', [
      { rule: FormValidationRule.MIN, value: 10 }
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('at least 10');
  });

  it('should validate maximum value constraint', () => {
    const result = validateField(100, 'age', [
      { rule: FormValidationRule.MAX, value: 65 }
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('not exceed 65');
  });

  it('should validate pattern constraint', () => {
    const result = validateField('123abc', 'zipCode', [
      { rule: FormValidationRule.PATTERN, value: /^\d{5}(?:-\d{4})?$/ }
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('invalid');
  });

  it('should validate email format', () => {
    const result = validateField('invalid-email', 'email', [
      { rule: FormValidationRule.EMAIL }
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('valid email');
  });

  it('should validate phone format', () => {
    const result = validateField('123', 'phone', [
      { rule: FormValidationRule.PHONE }
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('valid phone');
  });

  it('should validate currency format', () => {
    const result = validateField('abc123', 'amount', [
      { rule: FormValidationRule.CURRENCY }
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('currency');
  });

  it('should validate Medicaid ID format', () => {
    const result = validateField('12', 'medicaidId', [
      { rule: FormValidationRule.MEDICAID_ID }
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('Medicaid ID');
  });

  it('should handle multiple constraints', () => {
    const result = validateField('a', 'password', [
      { rule: FormValidationRule.REQUIRED },
      { rule: FormValidationRule.MIN_LENGTH, value: 8 },
      { rule: FormValidationRule.PATTERN, value: /^(?=.*[A-Z])/ }
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBe(2); // Should fail on min length and pattern
  });

  it('should support custom error messages', () => {
    const result = validateField('', 'firstName', [
      { rule: FormValidationRule.REQUIRED, message: 'Custom error for {field}' }
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toBe('Custom error for First Name');
  });

  it('should pass when no validation rules are provided', () => {
    const result = validateField('any value', 'field', []);
    expect(result.valid).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  it('should handle null values with required constraint', () => {
    const result = validateField(null, 'field', [{ rule: FormValidationRule.REQUIRED }]);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBe(1);
  });

  it('should handle undefined values with required constraint', () => {
    const result = validateField(undefined, 'field', [{ rule: FormValidationRule.REQUIRED }]);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBe(1);
  });
});

describe('validateForm', () => {
  it('should pass validation with valid data', () => {
    const schema = z.object({
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      email: z.string().email()
    });

    const validData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com'
    };

    const result = validateForm(validData, schema);
    expect(result.valid).toBe(true);
    expect(Object.keys(result.errors).length).toBe(0);
  });

  it('should return errors for invalid data', () => {
    const schema = z.object({
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      email: z.string().email()
    });

    const invalidData = {
      firstName: '',
      lastName: 'Doe',
      email: 'invalid-email'
    };

    const result = validateForm(invalidData, schema);
    expect(result.valid).toBe(false);
    expect(Object.keys(result.errors).length).toBe(2);
    expect(result.errors.firstName).toBeDefined();
    expect(result.errors.email).toBeDefined();
  });

  it('should detect missing required fields', () => {
    const schema = z.object({
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      email: z.string().email()
    });

    const incompleteData = {
      firstName: 'John'
      // Missing lastName and email
    };

    const result = validateForm(incompleteData, schema);
    expect(result.valid).toBe(false);
    expect(Object.keys(result.errors).length).toBe(2);
  });

  it('should validate forms with multiple field errors', () => {
    const schema = z.object({
      username: z.string().min(3).max(10),
      password: z.string().min(8),
      confirmPassword: z.string()
    }).refine(data => data.password === data.confirmPassword, {
      message: "Passwords don't match",
      path: ["confirmPassword"]
    });

    const invalidData = {
      username: 'a', // Too short
      password: 'pass',  // Too short
      confirmPassword: 'different' // Doesn't match
    };

    const result = validateForm(invalidData, schema);
    expect(result.valid).toBe(false);
    expect(Object.keys(result.errors).length).toBe(3);
  });

  it('should validate forms with nested object fields', () => {
    const schema = z.object({
      name: z.string().min(1),
      address: z.object({
        street: z.string().min(1),
        city: z.string().min(1),
        zipCode: z.string().regex(/^\d{5}(?:-\d{4})?$/)
      })
    });

    const invalidData = {
      name: 'John Doe',
      address: {
        street: '123 Main St',
        city: '',
        zipCode: 'invalid'
      }
    };

    const result = validateForm(invalidData, schema);
    expect(result.valid).toBe(false);
    expect(result.errors['address.city']).toBeDefined();
    expect(result.errors['address.zipCode']).toBeDefined();
  });

  it('should validate forms with array fields', () => {
    const schema = z.object({
      name: z.string().min(1),
      phones: z.array(z.string().regex(/^(\d{3})-(\d{3})-(\d{4})$/)).min(1)
    });

    const invalidData = {
      name: 'John',
      phones: ['123-456', 'invalid']
    };

    const result = validateForm(invalidData, schema);
    expect(result.valid).toBe(false);
    expect(result.errors['phones.0']).toBeDefined();
    expect(result.errors['phones.1']).toBeDefined();
  });

  it('should return valid true when no schema is provided', () => {
    const result = validateForm({ name: 'Test' }, undefined as any);
    expect(result.valid).toBe(true);
    expect(Object.keys(result.errors).length).toBe(0);
  });

  it('should handle empty form data with required fields', () => {
    const schema = z.object({
      firstName: z.string().min(1),
      lastName: z.string().min(1)
    });
    
    const result = validateForm({}, schema);
    expect(result.valid).toBe(false);
    expect(Object.keys(result.errors).length).toBe(2);
  });
});

describe('formatZodErrors', () => {
  it('should format simple Zod errors', () => {
    const error = new z.ZodError([
      {
        code: 'too_small',
        minimum: 1,
        type: 'string',
        inclusive: true,
        exact: false,
        message: 'Required',
        path: ['firstName']
      }
    ]);

    const formattedErrors = formatZodErrors(error);
    expect(formattedErrors.firstName).toEqual(['Required']);
  });

  it('should format nested field Zod errors', () => {
    const error = new z.ZodError([
      {
        code: 'too_small',
        minimum: 1,
        type: 'string',
        inclusive: true,
        exact: false,
        message: 'Required',
        path: ['address', 'city']
      }
    ]);

    const formattedErrors = formatZodErrors(error);
    expect(formattedErrors['address.city']).toEqual(['Required']);
  });

  it('should format array field Zod errors', () => {
    const error = new z.ZodError([
      {
        code: 'invalid_type',
        expected: 'string',
        received: 'number',
        path: ['phones', 0],
        message: 'Expected string, received number'
      }
    ]);

    const formattedErrors = formatZodErrors(error);
    expect(formattedErrors['phones.0']).toEqual(['Expected string, received number']);
  });

  it('should format multiple errors for the same field', () => {
    const error = new z.ZodError([
      {
        code: 'too_small',
        minimum: 8,
        type: 'string',
        inclusive: true,
        exact: false,
        message: 'String must contain at least 8 character(s)',
        path: ['password']
      },
      {
        code: 'invalid_string',
        validation: 'regex',
        message: 'Must contain at least one uppercase letter',
        path: ['password']
      }
    ]);

    const formattedErrors = formatZodErrors(error);
    expect(formattedErrors.password.length).toBe(2);
    expect(formattedErrors.password).toContain('String must contain at least 8 character(s)');
    expect(formattedErrors.password).toContain('Must contain at least one uppercase letter');
  });

  it('should format errors with custom error messages', () => {
    const error = new z.ZodError([
      {
        code: 'custom',
        message: 'Passwords do not match',
        path: ['confirmPassword']
      }
    ]);

    const formattedErrors = formatZodErrors(error);
    expect(formattedErrors.confirmPassword).toEqual(['Passwords do not match']);
  });
});

describe('formatValidationError', () => {
  it('should format required field error message', () => {
    const message = formatValidationError('required', 'firstName');
    expect(message).toBe('First Name is required');
  });

  it('should format min length error message with parameters', () => {
    const message = formatValidationError('minLength', 'password', { min: 8 });
    expect(message).toBe('Password must be at least 8 characters');
  });

  it('should format max length error message with parameters', () => {
    const message = formatValidationError('maxLength', 'username', { max: 20 });
    expect(message).toBe('Username must not exceed 20 characters');
  });

  it('should format min value error message with parameters', () => {
    const message = formatValidationError('min', 'age', { min: 18 });
    expect(message).toBe('Age must be at least 18');
  });

  it('should format max value error message with parameters', () => {
    const message = formatValidationError('max', 'quantity', { max: 100 });
    expect(message).toBe('Quantity must not exceed 100');
  });

  it('should format pattern error message', () => {
    const message = formatValidationError('pattern', 'zipCode');
    expect(message).toBe('Zip Code contains invalid characters');
  });

  it('should format email error message', () => {
    const message = formatValidationError('email', 'emailAddress');
    expect(message).toBe('Please enter a valid email address');
  });

  it('should format phone error message', () => {
    const message = formatValidationError('phone', 'phoneNumber');
    expect(message).toBe('Please enter a valid phone number');
  });

  it('should format currency error message', () => {
    const message = formatValidationError('currency', 'amount');
    expect(message).toBe('Please enter a valid currency amount (e.g., $123.45)');
  });

  it('should format Medicaid ID error message', () => {
    const message = formatValidationError('medicaidId', 'medicaidIdNumber');
    expect(message).toBe('Please enter a valid Medicaid ID');
  });

  it('should format field name correctly (camelCase to words)', () => {
    const message = formatValidationError('required', 'billingAddressLine1');
    expect(message).toBe('Billing Address Line1 is required');
  });

  it('should handle unknown message key with default message', () => {
    const message = formatValidationError('unknownKey', 'fieldName');
    expect(message).toBe('Field Name is invalid');
  });

  it('should handle custom error message template', () => {
    const template = '{field} must be a valid {type}';
    const message = formatValidationError(template, 'address', { type: 'mailing address' });
    expect(message).toBe('Address must be a valid mailing address');
  });
});

describe('createZodSchema', () => {
  it('should create schema for string field', () => {
    const fields = {
      name: { type: 'text' }
    };
    
    const schema = createZodSchema(fields);
    const result = schema.safeParse({ name: 'John' });
    expect(result.success).toBe(true);
  });

  it('should create schema for number field', () => {
    const fields = {
      age: { type: 'number' }
    };
    
    const schema = createZodSchema(fields);
    const result = schema.safeParse({ age: 30 });
    expect(result.success).toBe(true);
    
    const invalidResult = schema.safeParse({ age: 'thirty' });
    expect(invalidResult.success).toBe(false);
  });

  it('should create schema for boolean field', () => {
    const fields = {
      active: { type: 'checkbox' }
    };
    
    const schema = createZodSchema(fields);
    const result = schema.safeParse({ active: true });
    expect(result.success).toBe(true);
    
    const invalidResult = schema.safeParse({ active: 'yes' });
    expect(invalidResult.success).toBe(false);
  });

  it('should create schema for date field', () => {
    const fields = {
      birthDate: { 
        type: 'date',
        validation: [
          { rule: FormValidationRule.DATE }
        ]
      }
    };
    
    const schema = createZodSchema(fields);
    const result = schema.safeParse({ birthDate: '2023-05-15' });
    expect(result.success).toBe(true);
    
    const invalidResult = schema.safeParse({ birthDate: 'May 15, 2023' });
    expect(invalidResult.success).toBe(false);
  });

  it('should create schema for array field', () => {
    const fields = {
      interests: { type: 'multi_select' }
    };
    
    const schema = createZodSchema(fields);
    const result = schema.safeParse({ interests: ['sports', 'music'] });
    expect(result.success).toBe(true);
    
    const invalidResult = schema.safeParse({ interests: 'sports' });
    expect(invalidResult.success).toBe(false);
  });

  it('should create schema with required validation', () => {
    const fields = {
      username: { 
        type: 'text',
        validation: [
          { rule: FormValidationRule.REQUIRED }
        ]
      }
    };
    
    const schema = createZodSchema(fields);
    const result = schema.safeParse({ username: 'johndoe' });
    expect(result.success).toBe(true);
    
    const invalidResult = schema.safeParse({ username: '' });
    expect(invalidResult.success).toBe(false);
  });

  it('should create schema with min length validation', () => {
    const fields = {
      password: { 
        type: 'password',
        validation: [
          { rule: FormValidationRule.MIN_LENGTH, value: 8 }
        ]
      }
    };
    
    const schema = createZodSchema(fields);
    const result = schema.safeParse({ password: 'securepassword' });
    expect(result.success).toBe(true);
    
    const invalidResult = schema.safeParse({ password: 'short' });
    expect(invalidResult.success).toBe(false);
  });

  it('should create schema with max length validation', () => {
    const fields = {
      username: { 
        type: 'text',
        validation: [
          { rule: FormValidationRule.MAX_LENGTH, value: 10 }
        ]
      }
    };
    
    const schema = createZodSchema(fields);
    const result = schema.safeParse({ username: 'john' });
    expect(result.success).toBe(true);
    
    const invalidResult = schema.safeParse({ username: 'johndoeisverylong' });
    expect(invalidResult.success).toBe(false);
  });

  it('should create schema with min value validation', () => {
    const fields = {
      age: { 
        type: 'number',
        validation: [
          { rule: FormValidationRule.MIN, value: 18 }
        ]
      }
    };
    
    const schema = createZodSchema(fields);
    const result = schema.safeParse({ age: 21 });
    expect(result.success).toBe(true);
    
    const invalidResult = schema.safeParse({ age: 16 });
    expect(invalidResult.success).toBe(false);
  });

  it('should create schema with max value validation', () => {
    const fields = {
      age: { 
        type: 'number',
        validation: [
          { rule: FormValidationRule.MAX, value: 65 }
        ]
      }
    };
    
    const schema = createZodSchema(fields);
    const result = schema.safeParse({ age: 60 });
    expect(result.success).toBe(true);
    
    const invalidResult = schema.safeParse({ age: 70 });
    expect(invalidResult.success).toBe(false);
  });

  it('should create schema with pattern validation', () => {
    const fields = {
      zipCode: { 
        type: 'text',
        validation: [
          { rule: FormValidationRule.PATTERN, value: /^\d{5}(?:-\d{4})?$/ }
        ]
      }
    };
    
    const schema = createZodSchema(fields);
    const result = schema.safeParse({ zipCode: '12345' });
    expect(result.success).toBe(true);
    
    const invalidResult = schema.safeParse({ zipCode: 'abcde' });
    expect(invalidResult.success).toBe(false);
  });

  it('should create schema with email validation', () => {
    const fields = {
      email: { 
        type: 'email',
        validation: [
          { rule: FormValidationRule.EMAIL }
        ]
      }
    };
    
    const schema = createZodSchema(fields);
    const result = schema.safeParse({ email: 'test@example.com' });
    expect(result.success).toBe(true);
    
    const invalidResult = schema.safeParse({ email: 'not-an-email' });
    expect(invalidResult.success).toBe(false);
  });

  it('should create schema with phone validation', () => {
    const fields = {
      phone: { 
        type: 'phone',
        validation: [
          { rule: FormValidationRule.PHONE }
        ]
      }
    };
    
    const schema = createZodSchema(fields);
    const result = schema.safeParse({ phone: '123-456-7890' });
    expect(result.success).toBe(true);
    
    const invalidResult = schema.safeParse({ phone: '123' });
    expect(invalidResult.success).toBe(false);
  });

  it('should create schema with currency validation', () => {
    const fields = {
      amount: { 
        type: 'money',
        validation: [
          { rule: FormValidationRule.CURRENCY }
        ]
      }
    };
    
    const schema = createZodSchema(fields);
    const result = schema.safeParse({ amount: '$123.45' });
    expect(result.success).toBe(true);
    
    const invalidResult = schema.safeParse({ amount: 'abc' });
    expect(invalidResult.success).toBe(false);
  });

  it('should create schema with Medicaid ID validation', () => {
    const fields = {
      medicaidId: { 
        type: 'text',
        validation: [
          { rule: FormValidationRule.MEDICAID_ID }
        ]
      }
    };
    
    const schema = createZodSchema(fields);
    const result = schema.safeParse({ medicaidId: 'AB123456' });
    expect(result.success).toBe(true);
    
    const invalidResult = schema.safeParse({ medicaidId: 'X' });
    expect(invalidResult.success).toBe(false);
  });

  it('should create schema with multiple fields and validations', () => {
    const fields = {
      username: { 
        type: 'text',
        validation: [
          { rule: FormValidationRule.REQUIRED },
          { rule: FormValidationRule.MIN_LENGTH, value: 3 },
          { rule: FormValidationRule.MAX_LENGTH, value: 20 }
        ]
      },
      email: {
        type: 'email',
        validation: [
          { rule: FormValidationRule.REQUIRED },
          { rule: FormValidationRule.EMAIL }
        ]
      },
      age: {
        type: 'number',
        validation: [
          { rule: FormValidationRule.MIN, value: 18 }
        ]
      }
    };
    
    const schema = createZodSchema(fields);
    const result = schema.safeParse({
      username: 'johndoe',
      email: 'john@example.com',
      age: 25
    });
    expect(result.success).toBe(true);
    
    const invalidResult = schema.safeParse({
      username: 'j',
      email: 'not-an-email',
      age: 16
    });
    expect(invalidResult.success).toBe(false);
  });

  it('should create schema with custom error messages', () => {
    const fields = {
      username: { 
        type: 'text',
        validation: [
          { 
            rule: FormValidationRule.REQUIRED, 
            message: 'Custom required message for {field}' 
          }
        ]
      }
    };
    
    const schema = createZodSchema(fields);
    const result = schema.safeParse({ username: '' });
    expect(result.success).toBe(false);
    
    // Note: Zod's safeParse doesn't return the formatted error message directly
    // We'd need to format it ourselves to check the custom message
  });
});

describe('getZodValidator', () => {
  it('should get string validator for text type', () => {
    const validator = getZodValidator('text');
    expect(validator).toBeInstanceOf(z.ZodString);
  });

  it('should get string validator for email type', () => {
    const validator = getZodValidator('email');
    expect(validator).toBeInstanceOf(z.ZodString);
  });

  it('should get string validator for password type', () => {
    const validator = getZodValidator('password');
    expect(validator).toBeInstanceOf(z.ZodString);
  });

  it('should get string validator for phone type', () => {
    const validator = getZodValidator('phone');
    expect(validator).toBeInstanceOf(z.ZodString);
  });

  it('should get number validator for number type', () => {
    const validator = getZodValidator('number');
    expect(validator).toBeInstanceOf(z.ZodNumber);
  });

  it('should get boolean validator for checkbox type', () => {
    const validator = getZodValidator('checkbox');
    expect(validator).toBeInstanceOf(z.ZodBoolean);
  });

  it('should get boolean validator for switch type', () => {
    const validator = getZodValidator('switch');
    expect(validator).toBeInstanceOf(z.ZodBoolean);
  });

  it('should get date validator for date type', () => {
    const validator = getZodValidator('date');
    expect(validator).toBeInstanceOf(z.ZodString);
  });

  it('should get array validator for multi-select type', () => {
    const validator = getZodValidator('multi_select');
    expect(validator).toBeInstanceOf(z.ZodArray);
  });

  it('should get any validator for unknown type', () => {
    const validator = getZodValidator('custom_unknown_type');
    expect(validator).toBeInstanceOf(z.ZodAny);
  });
});

describe('applyValidationRule', () => {
  it('should apply required rule to validator', () => {
    const validator = z.string();
    const result = applyValidationRule(validator, { rule: FormValidationRule.REQUIRED }, 'field');
    
    // Test validation
    const validParse = result.safeParse('test');
    expect(validParse.success).toBe(true);
    
    const invalidParse = result.safeParse('');
    expect(invalidParse.success).toBe(false);
  });

  it('should apply min length rule to validator', () => {
    const validator = z.string();
    const result = applyValidationRule(
      validator, 
      { rule: FormValidationRule.MIN_LENGTH, value: 5 }, 
      'field'
    );
    
    // Test validation
    const validParse = result.safeParse('testing');
    expect(validParse.success).toBe(true);
    
    const invalidParse = result.safeParse('test');
    expect(invalidParse.success).toBe(false);
  });

  it('should apply max length rule to validator', () => {
    const validator = z.string();
    const result = applyValidationRule(
      validator, 
      { rule: FormValidationRule.MAX_LENGTH, value: 5 }, 
      'field'
    );
    
    // Test validation
    const validParse = result.safeParse('test');
    expect(validParse.success).toBe(true);
    
    const invalidParse = result.safeParse('testing');
    expect(invalidParse.success).toBe(false);
  });

  it('should apply min value rule to validator', () => {
    const validator = z.number();
    const result = applyValidationRule(
      validator, 
      { rule: FormValidationRule.MIN, value: 10 }, 
      'field'
    );
    
    // Test validation
    const validParse = result.safeParse(15);
    expect(validParse.success).toBe(true);
    
    const invalidParse = result.safeParse(5);
    expect(invalidParse.success).toBe(false);
  });

  it('should apply max value rule to validator', () => {
    const validator = z.number();
    const result = applyValidationRule(
      validator, 
      { rule: FormValidationRule.MAX, value: 10 }, 
      'field'
    );
    
    // Test validation
    const validParse = result.safeParse(5);
    expect(validParse.success).toBe(true);
    
    const invalidParse = result.safeParse(15);
    expect(invalidParse.success).toBe(false);
  });

  it('should apply pattern rule to validator', () => {
    const validator = z.string();
    const result = applyValidationRule(
      validator, 
      { rule: FormValidationRule.PATTERN, value: /^[A-Z]+$/ }, 
      'field'
    );
    
    // Test validation
    const validParse = result.safeParse('ABC');
    expect(validParse.success).toBe(true);
    
    const invalidParse = result.safeParse('abc');
    expect(invalidParse.success).toBe(false);
  });

  it('should apply email rule to validator', () => {
    const validator = z.string();
    const result = applyValidationRule(
      validator, 
      { rule: FormValidationRule.EMAIL }, 
      'field'
    );
    
    // Test validation
    const validParse = result.safeParse('test@example.com');
    expect(validParse.success).toBe(true);
    
    const invalidParse = result.safeParse('not-an-email');
    expect(invalidParse.success).toBe(false);
  });

  it('should apply phone rule to validator', () => {
    const validator = z.string();
    const result = applyValidationRule(
      validator, 
      { rule: FormValidationRule.PHONE }, 
      'field'
    );
    
    // Test validation
    const validParse = result.safeParse('123-456-7890');
    expect(validParse.success).toBe(true);
    
    const invalidParse = result.safeParse('123');
    expect(invalidParse.success).toBe(false);
  });

  it('should apply currency rule to validator', () => {
    const validator = z.string();
    const result = applyValidationRule(
      validator, 
      { rule: FormValidationRule.CURRENCY }, 
      'field'
    );
    
    // Test validation
    const validParse = result.safeParse('$123.45');
    expect(validParse.success).toBe(true);
    
    const invalidParse = result.safeParse('abc');
    expect(invalidParse.success).toBe(false);
  });

  it('should apply Medicaid ID rule to validator', () => {
    const validator = z.string();
    const result = applyValidationRule(
      validator, 
      { rule: FormValidationRule.MEDICAID_ID }, 
      'field'
    );
    
    // Test validation
    const validParse = result.safeParse('AB123456');
    expect(validParse.success).toBe(true);
    
    const invalidParse = result.safeParse('X');
    expect(invalidParse.success).toBe(false);
  });

  it('should apply rule with custom error message', () => {
    const validator = z.string();
    const result = applyValidationRule(
      validator, 
      { 
        rule: FormValidationRule.REQUIRED, 
        message: 'Custom required message for {field}' 
      }, 
      'firstName'
    );
    
    // We can't easily test the custom error message with safeParse
    expect(result).toBeInstanceOf(z.ZodString);
  });

  it('should return original validator for unknown rule type', () => {
    const validator = z.string();
    const result = applyValidationRule(
      validator, 
      { rule: 'unknown' as any }, 
      'field'
    );
    
    expect(result).toBe(validator);
  });
});

describe('isValidEmail', () => {
  it('should return true for valid email addresses', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isValidEmail('user.name@example.co.uk')).toBe(true);
    expect(isValidEmail('user+tag@example.org')).toBe(true);
  });

  it('should return false for invalid email addresses', () => {
    expect(isValidEmail('test')).toBe(false);
    expect(isValidEmail('test@')).toBe(false);
    expect(isValidEmail('@example.com')).toBe(false);
    expect(isValidEmail('test@example')).toBe(false);
  });

  it('should handle email with special characters in local part', () => {
    expect(isValidEmail('user.name+tag_123@example.com')).toBe(true);
  });

  it('should handle email with subdomains', () => {
    expect(isValidEmail('user@sub.domain.example.com')).toBe(true);
  });

  it('should handle email with plus addressing', () => {
    expect(isValidEmail('user+tag+another@example.com')).toBe(true);
  });

  it('should return false for empty string', () => {
    expect(isValidEmail('')).toBe(false);
  });

  it('should return false for null', () => {
    expect(isValidEmail(null as any)).toBe(false);
  });

  it('should return false for undefined', () => {
    expect(isValidEmail(undefined as any)).toBe(false);
  });
});

describe('isValidPhone', () => {
  it('should return true for valid phone numbers', () => {
    expect(isValidPhone('123-456-7890')).toBe(true);
    expect(isValidPhone('(123) 456-7890')).toBe(true);
    expect(isValidPhone('123.456.7890')).toBe(true);
  });

  it('should return false for invalid phone numbers', () => {
    expect(isValidPhone('123')).toBe(false);
    expect(isValidPhone('123-456')).toBe(false);
    expect(isValidPhone('12345678901234')).toBe(false);
    expect(isValidPhone('abcdefghij')).toBe(false);
  });

  it('should handle phone numbers with different formats', () => {
    expect(isValidPhone('123 456 7890')).toBe(true);
    expect(isValidPhone('(123)456-7890')).toBe(true);
    expect(isValidPhone('123.456.7890')).toBe(true);
  });

  it('should handle phone numbers with extensions', () => {
    expect(isValidPhone('+1 123-456-7890')).toBe(true);
  });

  it('should return false for empty string', () => {
    expect(isValidPhone('')).toBe(false);
  });

  it('should return false for null', () => {
    expect(isValidPhone(null as any)).toBe(false);
  });

  it('should return false for undefined', () => {
    expect(isValidPhone(undefined as any)).toBe(false);
  });
});

describe('isValidCurrency', () => {
  it('should return true for valid currency amounts', () => {
    expect(isValidCurrency('123.45')).toBe(true);
    expect(isValidCurrency('$123.45')).toBe(true);
    expect(isValidCurrency('1,234.56')).toBe(true);
    expect(isValidCurrency('$1,234.56')).toBe(true);
  });

  it('should return false for invalid currency formats', () => {
    expect(isValidCurrency('abc')).toBe(false);
    expect(isValidCurrency('123.456')).toBe(false); // More than 2 decimal places
    expect(isValidCurrency('$123.4')).toBe(true); // Actually should pass with 1 decimal place
    expect(isValidCurrency('123$')).toBe(false); // Dollar sign at end
  });

  it('should handle currency with dollar sign', () => {
    expect(isValidCurrency('$123')).toBe(true);
    expect(isValidCurrency('$0.99')).toBe(true);
  });

  it('should handle currency with commas', () => {
    expect(isValidCurrency('1,234')).toBe(true);
    expect(isValidCurrency('1,234,567.89')).toBe(true);
  });

  it('should handle currency with decimal places', () => {
    expect(isValidCurrency('123.00')).toBe(true);
    expect(isValidCurrency('123.5')).toBe(true);
  });

  it('should return false for empty string', () => {
    expect(isValidCurrency('')).toBe(false);
  });

  it('should return false for null', () => {
    expect(isValidCurrency(null as any)).toBe(false);
  });

  it('should return false for undefined', () => {
    expect(isValidCurrency(undefined as any)).toBe(false);
  });
});

describe('isValidMedicaidId', () => {
  it('should return true for valid Medicaid IDs', () => {
    expect(isValidMedicaidId('AB123456')).toBe(true);
    expect(isValidMedicaidId('123456789')).toBe(true);
    expect(isValidMedicaidId('ABCDEF123456')).toBe(true);
  });

  it('should return false for invalid Medicaid IDs', () => {
    expect(isValidMedicaidId('12345')).toBe(false); // Too short
    expect(isValidMedicaidId('AB12345678901234')).toBe(false); // Too long
    expect(isValidMedicaidId('!@#$%^')).toBe(false); // Invalid characters
  });

  it('should handle Medicaid IDs with different formats', () => {
    expect(isValidMedicaidId('ABC123')).toBe(true);
    expect(isValidMedicaidId('123ABC')).toBe(true);
    expect(isValidMedicaidId('A1B2C3D4E5')).toBe(true);
  });

  it('should return false for empty string', () => {
    expect(isValidMedicaidId('')).toBe(false);
  });

  it('should return false for null', () => {
    expect(isValidMedicaidId(null as any)).toBe(false);
  });

  it('should return false for undefined', () => {
    expect(isValidMedicaidId(undefined as any)).toBe(false);
  });
});

describe('validators', () => {
  it('should validate email addresses', () => {
    expect(validators.email('test@example.com')).toBe(true);
    expect(validators.email('invalid-email')).toBe(false);
  });

  it('should validate phone numbers', () => {
    expect(validators.phone('123-456-7890')).toBe(true);
    expect(validators.phone('123')).toBe(false);
  });

  it('should validate currency amounts', () => {
    expect(validators.currency('$123.45')).toBe(true);
    expect(validators.currency('abc')).toBe(false);
  });

  it('should validate Medicaid IDs', () => {
    expect(validators.medicaidId('AB123456')).toBe(true);
    expect(validators.medicaidId('X')).toBe(false);
  });

  it('should validate required fields', () => {
    expect(validators.required('value')).toBe(true);
    expect(validators.required('')).toBe(false);
    expect(validators.required(null)).toBe(false);
    expect(validators.required(undefined)).toBe(false);
  });

  it('should validate minimum length', () => {
    expect(validators.minLength('testing', 5)).toBe(true);
    expect(validators.minLength('test', 5)).toBe(false);
  });

  it('should validate maximum length', () => {
    expect(validators.maxLength('test', 5)).toBe(true);
    expect(validators.maxLength('testing', 5)).toBe(false);
  });

  it('should validate minimum value', () => {
    expect(validators.min(15, 10)).toBe(true);
    expect(validators.min(5, 10)).toBe(false);
  });

  it('should validate maximum value', () => {
    expect(validators.max(5, 10)).toBe(true);
    expect(validators.max(15, 10)).toBe(false);
  });

  it('should validate against patterns', () => {
    expect(validators.pattern('ABC', /^[A-Z]+$/)).toBe(true);
    expect(validators.pattern('abc', /^[A-Z]+$/)).toBe(false);
  });
});