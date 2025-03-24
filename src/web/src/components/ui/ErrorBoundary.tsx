import React, { Component, ErrorInfo, ReactNode } from 'react'; // v18.2.0
import { Button } from '@mui/material'; // v5.13.0
import { ErrorOutline as ErrorIcon } from '@mui/icons-material'; // v5.13.0
import EmptyState from './EmptyState';

/**
 * Props for the ErrorBoundary component
 */
interface ErrorBoundaryProps {
  children: ReactNode;
}

/**
 * State for the ErrorBoundary component
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * A React error boundary component that catches JavaScript errors in its child
 * component tree, logs those errors, and displays a fallback UI instead of
 * crashing the entire application.
 * 
 * This component implements React's error boundary pattern to prevent UI crashes
 * and provide a graceful degradation experience when errors occur.
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    // Initialize state with no error
    this.state = {
      hasError: false,
      error: null
    };
  }

  /**
   * React lifecycle method that updates state when an error is caught
   * This is called during the "render" phase, so side-effects are not permitted
   */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error
    };
  }

  /**
   * React lifecycle method called after an error has been caught
   * This is called during the "commit" phase, so side-effects are permitted
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to the console in development
    console.error('Error caught by ErrorBoundary:', error);
    console.error('Component stack:', errorInfo.componentStack);
    
    // In production, you would integrate with an error tracking service
    // For example: Sentry.captureException(error, { extra: errorInfo });
  }

  /**
   * Resets the error state and attempts to recover
   * This allows the component to try re-rendering its children
   */
  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Fallback UI when an error occurs
      return (
        <EmptyState
          title="Something went wrong"
          description={
            process.env.NODE_ENV === 'development'
              ? `An error occurred: ${this.state.error?.message}. Check the console for more details.`
              : 'An error occurred in this component. Please try again or contact support if the problem persists.'
          }
          icon={<ErrorIcon sx={{ fontSize: 64, color: 'error.main' }} />}
          action={
            <Button
              variant="contained"
              color="primary"
              onClick={this.handleReset}
              aria-label="Try to recover from error"
            >
              Try Again
            </Button>
          }
        />
      );
    }

    // When there's no error, render children normally
    return this.props.children;
  }
}

export default ErrorBoundary;