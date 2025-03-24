import React, { useEffect } from 'react'; // react v18.2.0
import { useRouter } from 'next/router'; // next/router v13.4+
import Head from 'next/head'; // next/head v13.4+

import SettingsLayout from '../../components/layout/SettingsLayout';
import UserManagement from '../../components/settings/UserManagement';
import useAuth from '../../hooks/useAuth';

/**
 * Page component for user management in the settings section
 * @returns Rendered users page component
 */
const UsersPage: React.FC = () => {
  // LD1: Get router instance using useRouter hook
  const router = useRouter();

  // LD1: Get authentication state and hasPermission function using useAuth hook
  const { hasPermission } = useAuth();

  // LD1: Check if user has permission to access user management
  useEffect(() => {
    if (!hasPermission('settings:users:manage')) {
      // LD1: Redirect to dashboard if user doesn't have permission
      router.push('/dashboard');
    }
  }, [hasPermission, router]);

  // LD1: Return the SettingsLayout component with UserManagement component
  return (
    <>
      {/* LD1: Set page title and metadata using Head component */}
      <Head>
        <title>User Management - ThinkCaring</title>
        <meta name="description" content="Manage user accounts and roles within the system." />
      </Head>
      <SettingsLayout activeTab="/settings/users">
        <UserManagement />
      </SettingsLayout>
    </>
  );
};

// IE3: Export the UsersPage component as the default export
export default UsersPage;