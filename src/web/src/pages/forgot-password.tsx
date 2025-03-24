import React from 'react'; // react v18.2.0
import { NextPage } from 'next'; // next v13.4.0
import { useRouter } from 'next/router'; // next v13.4.0
import { NextSeo } from 'next-seo'; // next-seo v6.0.0

import AuthLayout from '../components/layout/AuthLayout';
import ForgotPasswordForm from '../components/auth/ForgotPasswordForm';
import { AUTH_ROUTES } from '../constants/auth.constants';

/**
 * ForgotPasswordPage component is a Next.js page that renders the forgot password screen
 * for the HCBS Revenue Management System. This page allows users to request a password
 * reset by entering their email address. It provides a user-friendly interface with
 * validation and feedback.
 */
const ForgotPasswordPage: NextPage = () => {
  // Initialize router using useRouter hook
  const router = useRouter();

  /**
   * handleSuccess function to navigate to login page after successful submission
   */
  const handleSuccess = () => {
    router.push(AUTH_ROUTES.LOGIN);
  };

  return (
    <AuthLayout title="Forgot Password">
      {/* Include NextSeo component for SEO metadata */}
      <NextSeo
        title="Forgot Password - HCBS Revenue Management System"
        description="Request a password reset for your HCBS Revenue Management System account."
      />
      {/* Render ForgotPasswordForm component with handleSuccess callback */}
      <ForgotPasswordForm onSuccess={handleSuccess} />
    </AuthLayout>
  );
};

export default ForgotPasswordPage;