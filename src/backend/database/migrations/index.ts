import { Knex } from 'knex'; // v2.4.2
import initialSchema from './20230701000000_initial_schema';
import addUsers from './20230701000001_add_users';
import addClients from './20230701000002_add_clients';
import addServices from './20230701000003_add_services';
import addClaims from './20230701000004_add_claims';
import addPayments from './20230701000005_add_payments';
import addAuthorizations from './20230701000006_add_authorizations';
import addAuditLogs from './20230701000007_add_audit_logs';
import addPrograms from './20230701000008_add_programs';
import addPayers from './20230701000009_add_payers';
import addFacilities from './20230701000010_add_facilities';
import addRoles from './20230701000011_add_roles';
import addPermissions from './20230701000012_add_permissions';
import addStaff from './20230701000013_add_staff';
import addDocuments from './20230701000014_add_documents';
import addReports from './20230701000015_add_reports';
import addNotifications from './20230701000016_add_notifications';
import addSettings from './20230701000017_add_settings';

/**
 * Exports an array of migration objects in the correct execution order for the database migration system.
 * Each migration object should contain an `up` and `down` function to apply and revert the migration, respectively.
 *
 * The order of migrations is crucial for maintaining database integrity and ensuring that dependencies between tables are correctly handled.
 * For example, tables with foreign key constraints must be created before tables that reference them, and dropped after tables that reference them.
 */
export default [
  // Initial schema setup
  initialSchema,

  // Core data setup
  addUsers,
  addClients,
  addServices,
  addClaims,
  addPayments,
  addAuthorizations,
  addAuditLogs,
  addPrograms,
  addPayers,
  addFacilities,
  addRoles,
  addPermissions,
  addStaff,
  addDocuments,
  addReports,
  addNotifications,
  addSettings,
];