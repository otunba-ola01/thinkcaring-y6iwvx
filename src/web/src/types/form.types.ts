/**
 * Form-related TypeScript interfaces, types, and enums for the HCBS Revenue Management System.
 * This file defines type definitions for form components, validation schemas, and form hooks
 * to ensure type safety and consistency across all forms in the application.
 */

import { SxProps, Theme } from '@mui/material'; // v5.13+
import { ReactNode } from 'react';
import { 
  UseFormReturn, 
  FieldValues, 
  FieldErrors, 
  UseFormProps, 
  FieldPath, 
  RegisterOptions 
} from 'react-hook-form'; // v7.45+
import { 
  ZodType, 
  ZodObject, 
  ZodRawShape 
} from 'zod'; // v3.21+
import { SelectOption } from './common.types';

/**
 * Enum defining the types of form fields supported in the application
 */
export enum FormFieldType {
  TEXT = 'text',
  TEXTAREA = 'textarea',
  EMAIL = 'email',
  PASSWORD = 'password',
  NUMBER = 'number',
  PHONE = 'phone',
  DATE = 'date',
  TIME = 'time',
  DATETIME = 'datetime',
  SELECT = 'select',
  MULTI_SELECT = 'multiSelect',
  CHECKBOX = 'checkbox',
  RADIO = 'radio',
  SWITCH = 'switch',
  FILE = 'file',
  MONEY = 'money',
  HIDDEN = 'hidden'
}

/**
 * Enum defining the validation rules that can be applied to form fields
 */
export enum FormValidationRule {
  REQUIRED = 'required',
  MIN_LENGTH = 'minLength',
  MAX_LENGTH = 'maxLength',
  MIN = 'min',
  MAX = 'max',
  PATTERN = 'pattern',
  EMAIL = 'email',
  PHONE = 'phone',
  ZIP_CODE = 'zipCode',
  MEDICAID_ID = 'medicaidId',
  MEDICARE_ID = 'medicareId',
  CURRENCY = 'currency',
  DATE = 'date',
  CUSTOM = 'custom'
}

/**
 * Interface for configuring validation rules for form fields
 */
export interface FormValidationConfig {
  rule: FormValidationRule;
  value?: any;
  message?: string;
  params?: Record<string, any>;
}

/**
 * Interface for configuring form fields with validation, styling, and behavior
 */
export interface FormFieldConfig {
  name: string;
  label: string;
  type: FormFieldType;
  placeholder?: string;
  helperText?: string;
  defaultValue?: any;
  options?: SelectOption[];
  validation?: FormValidationConfig[];
  disabled?: boolean;
  readOnly?: boolean;
  hidden?: boolean;
  fullWidth?: boolean;
  gridSize?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  sx?: SxProps<Theme>;
}

/**
 * Interface for configuring a complete form with fields, validation, and submission handling
 */
export interface FormConfig {
  id: string;
  fields: FormFieldConfig[];
  defaultValues?: Record<string, any>;
  validationSchema?: ZodType<any>;
  onSubmit: (data: any) => void | Promise<void>;
  onError?: (errors: FieldErrors<any>) => void;
}

/**
 * Type alias for Zod validation schema used in forms
 */
export type FormValidationSchema = ZodObject<ZodRawShape>;

/**
 * Interface for props passed to the useForm hook
 */
export interface UseFormHookProps {
  defaultValues?: Record<string, any>;
  validationSchema?: FormValidationSchema;
  mode?: 'onSubmit' | 'onChange' | 'onBlur' | 'onTouched' | 'all';
  reValidateMode?: 'onChange' | 'onBlur' | 'onSubmit';
  context?: any;
}

/**
 * Type for the return value of the useForm hook, extending React Hook Form's UseFormReturn with additional properties
 */
export type UseFormHookReturn<TFieldValues extends FieldValues = FieldValues> = UseFormReturn<TFieldValues> & {
  isSubmitting: boolean;
  isValidating: boolean;
  formState: UseFormReturn<TFieldValues>['formState'] & {
    isValid: boolean;
    isSubmitting: boolean;
    isValidating: boolean;
  };
};

/**
 * Interface for global validation configuration
 */
export interface ValidationConfig {
  mode?: 'onSubmit' | 'onChange' | 'onBlur' | 'onTouched' | 'all';
  reValidateMode?: 'onChange' | 'onBlur' | 'onSubmit';
  defaultValues?: Record<string, any>;
  criteriaMode?: 'firstError' | 'all';
  shouldFocusError?: boolean;
  shouldUnregister?: boolean;
}

/**
 * Interface for regular expression patterns used in validation
 */
export interface ValidationPatterns {
  email: RegExp;
  password: RegExp;
  phone: RegExp;
  zipCode: RegExp;
  medicaidId: RegExp;
  medicareId: RegExp;
  currency: RegExp;
  numeric: RegExp;
  alphanumeric: RegExp;
  date: RegExp;
}

/**
 * Interface for validation error message templates
 */
export interface ValidationMessages {
  required: string;
  email: string;
  password: string;
  minLength: string;
  maxLength: string;
  min: string;
  max: string;
  pattern: string;
  phone: string;
  zipCode: string;
  medicaidId: string;
  medicareId: string;
  currency: string;
  date: string;
  numeric: string;
  alphanumeric: string;
}

/**
 * Interface for props passed to form components
 */
export interface FormProps {
  id: string;
  onSubmit: (data: any) => void | Promise<void>;
  onCancel?: () => void;
  defaultValues?: Record<string, any>;
  validationSchema?: FormValidationSchema;
  loading?: boolean;
  error?: string;
  submitLabel?: string;
  cancelLabel?: string;
  showCancel?: boolean;
  children: ReactNode;
  sx?: SxProps<Theme>;
}

/**
 * Interface for props passed to the ClientInfoForm component
 */
export interface ClientInfoFormProps {
  client?: any;
  onSubmit: (data: any) => void | Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
  error?: string;
}

/**
 * Interface for props passed to the ServiceEntryForm component
 */
export interface ServiceEntryFormProps {
  service?: any;
  onSubmit: (data: any) => void | Promise<void>;
  onCancel?: () => void;
  clients: SelectOption[];
  serviceTypes: SelectOption[];
  staff: SelectOption[];
  loading?: boolean;
  error?: string;
}

/**
 * Interface for props passed to the ClaimEntryForm component
 */
export interface ClaimEntryFormProps {
  claim?: any;
  onSubmit: (data: any) => void | Promise<void>;
  onCancel?: () => void;
  clients: SelectOption[];
  payers: SelectOption[];
  services: any[];
  loading?: boolean;
  error?: string;
}

/**
 * Interface for props passed to the PaymentEntryForm component
 */
export interface PaymentEntryFormProps {
  payment?: any;
  onSubmit: (data: any) => void | Promise<void>;
  onCancel?: () => void;
  payers: SelectOption[];
  paymentMethods: SelectOption[];
  loading?: boolean;
  error?: string;
}

/**
 * Interface for props passed to the ReconciliationForm component
 */
export interface ReconciliationFormProps {
  payment: any;
  claims: any[];
  onSubmit: (data: any) => void | Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
  error?: string;
}

/**
 * Interface for props passed to the ReportParametersForm component
 */
export interface ReportParametersFormProps {
  reportType: string;
  parameters?: Record<string, any>;
  onSubmit: (data: any) => void | Promise<void>;
  onCancel?: () => void;
  programs: SelectOption[];
  payers: SelectOption[];
  facilities: SelectOption[];
  loading?: boolean;
  error?: string;
}