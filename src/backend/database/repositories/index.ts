import { BaseRepository } from './base.repository';
import { userRepository } from './user.repository';
import { clientRepository } from './client.repository';
import { serviceRepository } from './service.repository';
import { claimRepository } from './claim.repository';
import { paymentRepository } from './payment.repository';
import { authorizationRepository } from './authorization.repository';
import { auditRepository } from './audit.repository';
import { programRepository } from './program.repository';
import { payerRepository } from './payer.repository';
import { facilityRepository } from './facility.repository';
import { roleRepository } from './role.repository';
import { permissionRepository } from './permission.repository';
import { staffRepository } from './staff.repository';
import { documentRepository } from './document.repository';
import { reportRepository } from './report.repository';
import { notificationRepository } from './notification.repository';
import { settingRepository } from './setting.repository';

/**
 * Exports all repository instances for centralized access.
 * This module aggregates and re-exports all repository instances to provide a single import point for database access throughout the application.
 * This simplifies imports and promotes a consistent data access pattern.
 */

export {
  BaseRepository,
  userRepository,
  clientRepository,
  serviceRepository,
  claimRepository,
  paymentRepository,
  authorizationRepository,
  auditRepository,
  programRepository,
  payerRepository,
  facilityRepository,
  roleRepository,
  permissionRepository,
  staffRepository,
  documentRepository,
  reportRepository,
  notificationRepository,
  settingRepository
};