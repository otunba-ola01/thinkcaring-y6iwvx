import React from 'react'; // react v18.2.0
import type { AppProps } from 'next/app'; // next/app v13.4+
import Head from 'next/head'; // next/head v13.4+
import Router from 'next/router'; // next/router v13.4+
import { Provider as ReduxProvider } from 'react-redux'; // react-redux v8.0+
import NProgress from 'nprogress'; // nprogress v0.2.0
import { CacheProvider, EmotionCache } from '@emotion/react'; // @emotion/react v11.10+
import createEmotionCache from '@emotion/cache'; // @emotion/cache v11.10+

import MainLayout from '../components/layout/MainLayout';
import AuthLayout from '../components/layout/AuthLayout';
import ErrorBoundary from '../components/ui/ErrorBoundary';
import { ThemeProvider } from '../context/ThemeContext';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import { NotificationProvider } from '../context/NotificationContext';
import { store } from '../store';
import '../styles/globals.css';
import '../styles/nprogress.css';

// Create client-side emotion cache, globally accessible
const clientSideEmotionCache = createEmotionCache();

// Define interface for props of the MyApp component
interface MyAppProps extends AppProps {
  emotionCache?: EmotionCache;
}

/**
 * Main application component that wraps all pages
 * @param {object} { Component, emotionCache = clientSideEmotionCache, pageProps }
 * @returns {JSX.Element} The rendered application
 */
function MyApp({ Component, emotionCache = clientSideEmotionCache, pageProps }: MyAppProps): JSX.Element {
  // LD1: Get the getLayout function from the Component or use a default function
  const getLayout = Component.getLayout || ((page: React.ReactNode) => page);

  // LD1: Set up NProgress configuration for page loading indicators
  NProgress.configure({ showSpinner: false });

  // LD1: Add router event handlers for NProgress start and stop
  Router.events.on('routeChangeStart', () => NProgress.start());
  Router.events.on('routeChangeComplete', () => NProgress.done());
  Router.events.on('routeChangeError', () => NProgress.done());

  // LD1: Determine if the current page is an authentication page based on the route
  const isAuthPage = Router.router?.pathname.startsWith('/auth') || false;

  // LD1: Render the application with all necessary providers
  // LD1: Wrap the entire application with CacheProvider for Emotion styling
  // LD1: Wrap with ErrorBoundary to catch and handle errors
  // LD1: Wrap with ThemeProvider for theme management
  // LD1: Wrap with ReduxProvider for global state management
  // LD1: Wrap with AuthProvider for authentication
  // LD1: Wrap with ToastProvider for toast notifications
  // LD1: Wrap with NotificationProvider for system notifications
  // LD1: Render Head component with meta tags and title
  // LD1: Apply the appropriate layout (AuthLayout or MainLayout) based on isAuthPage
  // LD1: Use getLayout function to apply any page-specific layout
  // LD1: Render the Component with pageProps
  return (
    <CacheProvider value={emotionCache}>
      <Head>
        {/* LD1: Meta tag for viewport settings, enabling responsive design */}
        <meta name="viewport" content="initial-scale=1, width=device-width" />
        {/* LD1: Title for the application */}
        <title>HCBS Revenue Management</title>
      </Head>
      <ErrorBoundary>
        <ThemeProvider>
          <ReduxProvider store={store}>
            <AuthProvider>
              <ToastProvider>
                <NotificationProvider>
                  {isAuthPage ? (
                    <AuthLayout title={Component.title || 'Authentication'}>
                      {getLayout(<Component {...pageProps} />)}
                    </AuthLayout>
                  ) : (
                    <MainLayout>
                      {getLayout(<Component {...pageProps} />)}
                    </MainLayout>
                  )}
                </NotificationProvider>
              </ToastProvider>
            </AuthProvider>
          </ReduxProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </CacheProvider>
  );
}

export default MyApp;