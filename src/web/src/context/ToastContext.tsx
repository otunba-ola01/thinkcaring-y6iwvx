import React, { createContext, useCallback, useState, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid'; // v9.0.0
import { Stack } from '@mui/material'; // v5.13.0
import { Severity } from '../types/common.types';
import AlertNotification from '../components/ui/AlertNotification';

/**
 * Interface defining the structure of a toast notification
 */
interface ToastNotification {
  id: string;
  message: string;
  severity: Severity;
  title?: string;
  autoHideDuration?: number;
  actions?: ReactNode;
}

/**
 * Interface defining the shape of the toast context
 */
interface ToastContextType {
  toasts: ToastNotification[];
  showToast: (toast: Omit<ToastNotification, 'id'>) => string;
  hideToast: (id: string) => void;
  clearToasts: () => void;
}

// Create the context with a default value of undefined
const ToastContext = createContext<ToastContextType | undefined>(undefined);

/**
 * A context provider component that manages toast notifications
 * throughout the HCBS Revenue Management System.
 * 
 * Provides a centralized way to display, manage, and dismiss temporary 
 * notifications for user feedback such as success messages, errors, warnings, 
 * and informational alerts.
 * 
 * @param {ReactNode} children - Child components that will have access to the toast context
 * @returns {JSX.Element} The ToastProvider component with its children
 */
const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // State to hold all active toast notifications
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  /**
   * Adds a new toast notification and returns its ID
   * @param {Omit<ToastNotification, 'id'>} toast - Toast notification data without ID
   * @returns {string} The ID of the newly created toast
   */
  const showToast = useCallback((toast: Omit<ToastNotification, 'id'>): string => {
    const id = uuidv4();
    setToasts(prevToasts => [...prevToasts, { ...toast, id }]);
    return id;
  }, []);

  /**
   * Removes a specific toast notification by ID
   * @param {string} id - The ID of the toast to remove
   */
  const hideToast = useCallback((id: string) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  }, []);

  /**
   * Removes all toast notifications
   */
  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Create the context value object
  const contextValue: ToastContextType = {
    toasts,
    showToast,
    hideToast,
    clearToasts,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {/* Toast container positioned at the top-right corner */}
      <Stack
        spacing={2}
        sx={{
          position: 'fixed',
          top: 16,
          right: 16,
          zIndex: 2000,
          maxWidth: 400,
        }}
      >
        {/* Render each toast notification */}
        {toasts.map(toast => (
          <AlertNotification
            key={toast.id}
            message={toast.message}
            severity={toast.severity}
            onDismiss={() => hideToast(toast.id)}
            action={toast.actions}
            autoHideDuration={toast.autoHideDuration}
          />
        ))}
      </Stack>
    </ToastContext.Provider>
  );
};

/**
 * Custom hook that provides access to the toast context
 * Must be used within a ToastProvider
 * 
 * @returns {ToastContextType} The toast context value containing toast state and functions
 * @throws {Error} If used outside of a ToastProvider
 */
const useToastContext = (): ToastContextType => {
  const context = React.useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToastContext must be used within a ToastProvider');
  }
  return context;
};

export { ToastContext, ToastProvider, useToastContext };