import React, { useEffect } from 'react'; // react v18.2.0
import Head from 'next/head'; // next/head v13.4.0
import { useRouter } from 'next/router'; // next/router v13.4.0
import { NextPage } from 'next'; // next v13.4.0

import AuthLayout from '../components/layout/AuthLayout';
import MfaForm from '../components/auth/MfaForm';
import useAuth from '../hooks/useAuth';
import { getSeoConfig } from '../config/seo.config';

/**
 * SEO configuration for the MFA page
 */
const seoConfig = getSeoConfig({
  title: 'Verify Identity',
  description: 'Complete multi-factor authentication to access the HCBS Revenue Management System'
});

/**
 * Next.js page component that renders the MFA verification screen
 * @returns {JSX.Element} The rendered MFA verification page
 */
const MfaPage: NextPage = () => {
  // Initialize router with useRouter hook
  const router = useRouter();

  // Get authentication state and functions from useAuth hook
  const { isAuthenticated, redirectAfterLogin, mfaRequired, mfaResponse } = useAuth();

  // Set up effect to redirect to login if MFA is not required
  useEffect(() => {
    if (!mfaRequired) {
      router.push('/auth/login');
    }
  }, [mfaRequired, router]);

  // Set up effect to redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      redirectAfterLogin();
    }
  }, [isAuthenticated, redirectAfterLogin]);

  // If MFA is not required or user is already authenticated, return null to prevent rendering
  if (!mfaRequired || isAuthenticated) {
    return null;
  }

  /**
   * Handle successful MFA verification by redirecting to the appropriate page
   * @param {object} response - The login response object
   */
  const onSuccess = (response: any) => {
    redirectAfterLogin();
  };

  // Render the MFA page with AuthLayout and MfaForm components
  return (
    <AuthLayout title="Verify Identity">
      {/* Include Head component with SEO metadata */}
      <Head>
        <title>{seoConfig.title}</title>
        <meta name="description" content={seoConfig.description} />
      </Head>

      {/* Pass mfaToken and method from mfaResponse to MfaForm component */}
      {mfaResponse && (
        <MfaForm
          mfaToken={mfaResponse.mfaToken}
          method={mfaResponse.method}
          onSuccess={onSuccess} // Pass onSuccess callback to handle successful verification
        />
      )}
    </AuthLayout>
  );
};

/**
 * Next.js server-side function to handle redirects for users who don't need MFA
 * @param {object} context - Next.js context object
 * @returns {object} Server-side props or redirect object
 */
export async function getServerSideProps(context: any) {
  // Extract cookies from the request
  const { req } = context;
  const { cookies } = req;

  // Check if MFA token exists in cookies
  const mfaToken = cookies['hcbs_mfa_token'];

  // If MFA token doesn't exist, redirect to login page
  if (!mfaToken) {
    return {
      redirect: {
        destination: '/auth/login',
        permanent: false,
      },
    };
  }

  // Otherwise, return empty props to render the MFA page
  return {
    props: {},
  };
}

export default MfaPage;