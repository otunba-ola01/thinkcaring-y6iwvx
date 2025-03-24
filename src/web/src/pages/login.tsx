import React, { useEffect } from 'react'; // react v18.2.0
import Head from 'next/head'; // next/head v13.4.0
import { useRouter } from 'next/router'; // next/router v13.4.0
import { NextPage } from 'next'; // next v13.4.0

import AuthLayout from '../components/layout/AuthLayout'; // Layout component for authentication pages
import LoginForm from '../components/auth/LoginForm'; // Form component for user login
import useAuth from '../hooks/useAuth'; // Hook for authentication functionality
import { getSeoConfig } from '../config/seo.config'; // Function to generate SEO configuration for the page

/**
 * SEO configuration for the login page
 */
const seoConfig = getSeoConfig({
  title: 'Login',
  description: 'Log in to the HCBS Revenue Management System'
});

/**
 * Next.js page component that renders the login screen
 * @returns {JSX.Element} The rendered login page
 */
const LoginPage: NextPage = () => {
  // Initialize router with useRouter hook
  const router = useRouter();

  // Get authentication state and functions from useAuth hook
  const { isAuthenticated, redirectAfterLogin } = useAuth();

  // Set up effect to redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      redirectAfterLogin();
    }
  }, [isAuthenticated, redirectAfterLogin]);

  /**
   * Handle successful login by redirecting to the appropriate page
   * @param {object} response - The login response object
   */
  const handleLoginSuccess = (response: any) => {
    redirectAfterLogin();
  };

  // Render the login page with AuthLayout and LoginForm components
  return (
    <AuthLayout title="Login">
      {/* Include Head component with SEO metadata */}
      <Head>
        <title>{seoConfig.title}</title>
        <meta name="description" content={seoConfig.description} />
        <link rel="canonical" href={seoConfig.canonical} />
        {/* Open Graph meta tags */}
        <meta property="og:title" content={seoConfig.openGraph.title} />
        <meta property="og:description" content={seoConfig.openGraph.description} />
        <meta property="og:type" content={seoConfig.openGraph.type} />
        <meta property="og:url" content={seoConfig.openGraph.url} />
        <meta property="og:image" content={seoConfig.openGraph.image} />
        <meta property="og:site_name" content={seoConfig.openGraph.siteName} />
        {/* Twitter meta tags */}
        <meta name="twitter:card" content={seoConfig.twitter.card} />
        <meta name="twitter:site" content={seoConfig.twitter.site} />
        <meta name="twitter:title" content={seoConfig.twitter.title} />
        <meta name="twitter:description" content={seoConfig.twitter.description} />
        <meta name="twitter:image" content={seoConfig.twitter.image} />
        {/* Robots meta tag */}
        {seoConfig.noindex && <meta name="robots" content="noindex" />}
        {seoConfig.nofollow && <meta name="robots" content="nofollow" />}
      </Head>
      {/* Render the LoginForm component */}
      <LoginForm onSuccess={handleLoginSuccess} />
    </AuthLayout>
  );
};

/**
 * Next.js server-side function to handle redirects for authenticated users
 * @param {object} context - Next.js context object
 * @returns {object} Server-side props or redirect object
 */
export async function getServerSideProps(context: any) {
  // Extract cookies from the request
  const { req } = context;
  const cookies = req.headers.cookie || '';

  // Check if authentication token exists in cookies
  const accessToken = cookies.includes('hcbs_access_token');

  // If token exists, redirect to dashboard
  if (accessToken) {
    return {
      redirect: {
        destination: '/dashboard',
        permanent: false,
      },
    };
  }

  // Otherwise, return empty props to render the login page
  return {
    props: {},
  };
}

export default LoginPage;