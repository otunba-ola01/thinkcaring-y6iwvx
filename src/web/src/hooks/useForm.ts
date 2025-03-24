import { useState, useEffect } from 'react'; // v18.2.0
import { useForm as useReactHookForm, UseFormReturn } from 'react-hook-form'; // v7.45.0
import { zodResolver } from '@hookform/resolvers/zod'; // v3.1.0
import { ZodError } from 'zod'; // v3.21.0

import { UseFormHookProps, UseFormHookReturn, FormValidationSchema } from '../types/form.types';
import { validationConfig } from '../config/validation.config';
import { validateForm, formatZodErrors } from '../utils/validation';
import useToast from './useToast';

/**
 * Custom hook that enhances React Hook Form with Zod validation and error handling.
 * 
 * This hook provides:
 * - Integration with Zod schema validation
 * - Toast notifications for validation errors
 * - Enhanced form state tracking
 * - Error handling during form submission
 * - Support for financial data validation
 * 
 * @param props - Configuration options for the form
 * @returns Enhanced form methods and state
 */
const useForm = <TFieldValues extends Record<string, any> = Record<string, any>>(
  props: UseFormHookProps
): UseFormHookReturn<TFieldValues> => {
  const {
    defaultValues = {},
    validationSchema,
    mode = validationConfig.mode,
    reValidateMode = validationConfig.reValidateMode,
    context
  } = props;

  // Initialize toast notifications
  const toast = useToast();

  // Configure form options
  const formOptions: any = {
    defaultValues,
    mode,
    reValidateMode,
    context,
    criteriaMode: validationConfig.criteriaMode,
    shouldFocusError: validationConfig.shouldFocusError,
    shouldUnregister: validationConfig.shouldUnregister
  };

  // Add Zod resolver if validation schema is provided
  if (validationSchema) {
    formOptions.resolver = zodResolver(validationSchema);
  }

  // Initialize React Hook Form
  const methods = useReactHookForm<TFieldValues>(formOptions);

  // Track additional form state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formState, setFormState] = useState(methods.formState);

  /**
   * Enhanced handleSubmit function that adds error handling and submission state management
   * 
   * @param onValid - Function to call when form data is valid
   * @param onInvalid - Optional function to call when form data is invalid
   * @returns Submit handler function
   */
  const handleSubmit = (
    onValid: (data: TFieldValues) => Promise<void> | void,
    onInvalid?: (errors: any) => void
  ) => {
    return methods.handleSubmit(
      async (data) => {
        setIsSubmitting(true);
        
        // Additional custom validation if needed
        if (validationSchema) {
          try {
            // Run direct validation against the schema for any complex validations
            // that might not be covered by the resolver
            validateForm(data, validationSchema);
          } catch (error) {
            if (error instanceof ZodError) {
              const formattedErrors = formatZodErrors(error);
              if (onInvalid) {
                onInvalid(formattedErrors);
              }
              
              // Show detailed validation error
              const errorKeys = Object.keys(formattedErrors);
              if (errorKeys.length > 0) {
                const fieldName = errorKeys[0];
                const fieldErrors = formattedErrors[fieldName];
                
                toast.error(fieldErrors[0], {
                  title: 'Validation Error'
                });
              }
              
              setIsSubmitting(false);
              return;
            }
          }
        }
        
        try {
          // Execute the form submission handler
          await onValid(data);
        } catch (error) {
          console.error('Form submission error:', error);
          
          // Show user-friendly error notification
          toast.error(
            error instanceof Error ? error.message : 'An error occurred during form submission',
            { title: 'Submission Error' }
          );
        } finally {
          setIsSubmitting(false);
        }
      },
      (errors) => {
        // Display the first validation error in a toast notification
        const errorKeys = Object.keys(errors);
        if (errorKeys.length > 0) {
          const fieldName = errorKeys[0];
          const fieldError = errors[fieldName];
          
          toast.error(
            fieldError.message || `Please correct the error in ${fieldName}`,
            { title: 'Validation Failed' }
          );
        }
        
        if (onInvalid) {
          onInvalid(errors);
        }
      }
    );
  };

  // Keep local form state in sync with React Hook Form state
  useEffect(() => {
    setFormState({
      ...methods.formState,
      isSubmitting,
    });
  }, [methods.formState, isSubmitting]);

  /**
   * Validates the current form data against the validation schema without submission
   * Useful for checking form validity at any point
   * 
   * @returns Validation result with errors if any
   */
  const validateFormData = () => {
    if (!validationSchema) {
      return { valid: true, errors: {} };
    }
    
    try {
      const data = methods.getValues();
      return validateForm(data, validationSchema);
    } catch (error) {
      if (error instanceof ZodError) {
        return { 
          valid: false, 
          errors: formatZodErrors(error)
        };
      }
      return { valid: false, errors: { form: ['Unexpected validation error'] } };
    }
  };

  /**
   * Reset the form with optional new default values
   * Enhanced to reset our custom state as well
   */
  const reset = (values?: any, options?: any) => {
    methods.reset(values, options);
    setIsSubmitting(false);
  };

  // Return enhanced form methods and state
  return {
    ...methods,
    handleSubmit,
    reset,
    validateFormData,
    isSubmitting,
    isValidating: methods.formState.isValidating,
    formState: {
      ...formState,
      isSubmitting,
      isValidating: methods.formState.isValidating,
      isValid: methods.formState.isValid,
    },
  } as UseFormHookReturn<TFieldValues>;
};

export default useForm;