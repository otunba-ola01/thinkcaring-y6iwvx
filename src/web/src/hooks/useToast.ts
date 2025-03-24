import { useContext } from 'react'; // v18.2.0
import { ToastContext } from '../context/ToastContext';
import { Severity } from '../types/common.types';

/**
 * Interface defining the return value of the useToast hook
 */
interface UseToastReturn {
  /**
   * Function to show a success toast notification
   */
  success: (message: string, options?: { title?: string; autoHideDuration?: number; actions?: React.ReactNode }) => string;
  
  /**
   * Function to show an error toast notification
   */
  error: (message: string, options?: { title?: string; autoHideDuration?: number; actions?: React.ReactNode }) => string;
  
  /**
   * Function to show a warning toast notification
   */
  warning: (message: string, options?: { title?: string; autoHideDuration?: number; actions?: React.ReactNode }) => string;
  
  /**
   * Function to show an info toast notification
   */
  info: (message: string, options?: { title?: string; autoHideDuration?: number; actions?: React.ReactNode }) => string;
  
  /**
   * Original showToast function from context for custom toast notifications
   */
  show: (toast: { message: string; severity: Severity; title?: string; autoHideDuration?: number; actions?: React.ReactNode }) => string;
  
  /**
   * Function to hide a specific toast by ID
   */
  hide: (id: string) => void;
  
  /**
   * Function to clear all toast notifications
   */
  clearAll: () => void;
}

/**
 * A custom hook that provides a simplified interface for displaying toast notifications
 * 
 * @returns An object containing functions to show, hide, and clear toast notifications
 */
const useToast = (): UseToastReturn => {
  const context = useContext(ToastContext);
  
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  
  const { showToast, hideToast, clearToasts } = context;
  
  const success = (message: string, options?: { title?: string; autoHideDuration?: number; actions?: React.ReactNode }): string => {
    return showToast({
      message,
      severity: Severity.SUCCESS,
      title: options?.title,
      autoHideDuration: options?.autoHideDuration,
      actions: options?.actions
    });
  };
  
  const error = (message: string, options?: { title?: string; autoHideDuration?: number; actions?: React.ReactNode }): string => {
    return showToast({
      message,
      severity: Severity.ERROR,
      title: options?.title,
      autoHideDuration: options?.autoHideDuration,
      actions: options?.actions
    });
  };
  
  const warning = (message: string, options?: { title?: string; autoHideDuration?: number; actions?: React.ReactNode }): string => {
    return showToast({
      message,
      severity: Severity.WARNING,
      title: options?.title,
      autoHideDuration: options?.autoHideDuration,
      actions: options?.actions
    });
  };
  
  const info = (message: string, options?: { title?: string; autoHideDuration?: number; actions?: React.ReactNode }): string => {
    return showToast({
      message,
      severity: Severity.INFO,
      title: options?.title,
      autoHideDuration: options?.autoHideDuration,
      actions: options?.actions
    });
  };
  
  return {
    success,
    error,
    warning,
    info,
    show: showToast,
    hide: hideToast,
    clearAll: clearToasts
  };
};

export default useToast;