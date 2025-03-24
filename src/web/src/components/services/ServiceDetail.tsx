import React, { useState, useEffect, useMemo } from 'react'; // v18.2.0
import { useRouter } from 'next/router'; // v13.4+
import { Box, Typography, Grid, Divider, LinearProgress, Chip, Paper, Alert } from '@mui/material'; // v5.13.0
import { Edit as EditIcon, Delete as DeleteIcon, Description as DocumentIcon, Assignment as ClaimIcon, EventNote as AuthorizationIcon } from '@mui/icons-material'; // v5.13.0

import Card from '../ui/Card';
import StatusBadge from '../ui/StatusBadge';
import ActionButton from '../ui/ActionButton';
import Tabs from '../ui/Tabs';
import ConfirmDialog from '../ui/ConfirmDialog';
import FileUploader from '../ui/FileUploader';
import ServiceForm from './ServiceForm';
import ClaimServiceList from '../claims/ClaimServiceList';
import AuthorizationList from '../clients/AuthorizationList';
import useServices, { UseServicesResult } from '../../hooks/useServices';
import useToast from '../../hooks/useToast';
import { ServiceWithRelations, DocumentationStatus, BillingStatus, UpdateServiceDocumentationStatusDto } from '../../types/services.types';
import { UUID, LoadingState, Severity } from '../../types/common.types';
import { ROUTES } from '../../constants/routes.constants';
import { formatCurrency, formatDate } from '../../utils/format';

/**
 * Props interface for the ServiceDetail component
 */
interface ServiceDetailProps {
  serviceId: UUID;
  onBack?: () => void;
}

/**
 * Main component for displaying detailed information about a service
 * @param {ServiceDetailProps} props
 * @returns {JSX.Element} The rendered ServiceDetail component
 */
const ServiceDetail: React.FC<ServiceDetailProps> = ({ serviceId, onBack }) => {
  // 1. Destructure props to extract serviceId and onBack
  // 2. Initialize router for navigation
  const router = useRouter();

  // 3. Initialize state for service data, loading state, error, active tab, edit mode, and delete confirmation
  const [activeTab, setActiveTab] = useState<string>('details');
  const [editMode, setEditMode] = useState<boolean>(false);
  const [confirmDeleteDialogOpen, setConfirmDeleteDialogOpen] = useState<boolean>(false);

  // 4. Initialize toast notification hook
  const toast = useToast();

  // 5. Use the useServices hook to fetch service data and manage service operations
  const {
    selectedService: service,
    fetchServiceById,
    updateService,
    deleteService,
    updateServiceDocumentationStatus,
    loading,
    error,
  } = useServices();

  // 6. Create fetchService function to retrieve service details by ID
  // 7. Create handleEditService function to toggle edit mode
  const handleEditService = () => {
    setEditMode(true);
  };

  // 8. Create handleUpdateService function to save service changes
  const handleUpdateService = async (data: any) => {
    if (service) {
      await updateService(service.id, data);
      setEditMode(false);
    }
  };

  // 9. Create handleDeleteService function to delete the service
  const handleDeleteService = async () => {
    if (service) {
      await deleteService(service.id);
      toast.success('Service deleted successfully');
      setConfirmDeleteDialogOpen(false);
      router.push(ROUTES.SERVICES.ROOT);
    }
  };

  // 10. Create handleUpdateDocumentationStatus function to update documentation status
  const handleUpdateDocumentationStatus = async (documentationStatus: DocumentationStatus, documentIds: UUID[]) => {
    if (service) {
      const data: UpdateServiceDocumentationStatusDto = { documentationStatus, documentIds };
      await updateServiceDocumentationStatus(service.id, data);
      toast.success('Documentation status updated successfully');
    }
  };

  // 11. Create handleTabChange function to switch between tabs
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  // 12. Create handleBack function to navigate back or call onBack prop
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  // 13. Use useEffect to fetch service data when serviceId changes
  useEffect(() => {
    fetchServiceById(serviceId);
  }, [serviceId, fetchServiceById]);

  // 14. Define tabs for the tabbed interface (Details, Documentation, Authorization, Claims)
  const tabs = useMemo(() => [
    { label: 'Details', value: 'details' },
    { label: 'Documentation', value: 'documentation' },
    { label: 'Authorization', value: 'authorization' },
    { label: 'Claims', value: 'claims' },
  ], []);

  // 15. Render loading state when data is loading
  if (loading === LoadingState.LOADING) {
    return <Typography>Loading service details...</Typography>;
  }

  // 16. Render error state if data fetch fails
  if (error) {
    return <Typography color="error">Error: {error}</Typography>;
  }

  // 17. Render service form when in edit mode
  if (editMode && service) {
    return (
      <ServiceForm
        service={service}
        onSubmit={handleUpdateService}
        onCancel={() => setEditMode(false)}
        clients={[]} // TODO: Populate with client options
        serviceTypes={[]} // TODO: Populate with service type options
        staff={[]} // TODO: Populate with staff options
      />
    );
  }

  // 18. Render service details with tabs when not in edit mode
  if (service) {
    return (
      <Card title="Service Details">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={handleTabChange} />
        <Divider sx={{ my: 2 }} />
        {activeTab === 'details' && <ServiceDetailsTab service={service} />}
        {activeTab === 'documentation' && (
          <ServiceDocumentationTab
            service={service}
            onUpdateDocumentationStatus={(status, documentIds) => handleUpdateDocumentationStatus(status, documentIds)}
            isUpdating={loading === LoadingState.UPDATING}
          />
        )}
        {activeTab === 'authorization' && <ServiceAuthorizationTab service={service} />}
        {activeTab === 'claims' && <ServiceClaimsTab service={service} />}
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <ActionButton label="Edit" icon={<EditIcon />} onClick={handleEditService} />
          <ActionButton
            label="Delete"
            icon={<DeleteIcon />}
            color="error"
            confirmText="Are you sure you want to delete this service?"
            onClick={() => setConfirmDeleteDialogOpen(true)}
          />
          <ConfirmDialog
            open={confirmDeleteDialogOpen}
            title="Confirm Delete"
            message="Are you sure you want to delete this service?"
            confirmLabel="Delete"
            cancelLabel="Cancel"
            onConfirm={handleDeleteService}
            onCancel={() => setConfirmDeleteDialogOpen(false)}
            severity={Severity.WARNING}
          />
        </Box>
      </Card>
    );
  }

  // 19. Include confirmation dialog for delete action
  return <Typography>Service not found</Typography>;
};

/**
 * Component for displaying basic service details
 * @param {ServiceWithRelations} service
 * @returns {JSX.Element} The rendered service details tab
 */
const ServiceDetailsTab: React.FC<{ service: ServiceWithRelations }> = ({ service }) => {
  // 1. Render a Grid layout with service information
  // 2. Display client information (name, ID)
  // 3. Display service type and code
  // 4. Display service date and time
  // 5. Display units, rate, and calculated amount
  // 6. Display program and facility information
  // 7. Display staff information if available
  // 8. Display status information with StatusBadge components
  // 9. Format dates, currency values, and other data for display
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <Typography variant="subtitle1">Client:</Typography>
        <Typography>{service.client.firstName} {service.client.lastName}</Typography>
        <Typography color="textSecondary">ID: {service.client.id}</Typography>
      </Grid>
      <Grid item xs={12} md={6}>
        <Typography variant="subtitle1">Service Type:</Typography>
        <Typography>{service.serviceType.name} ({service.serviceType.code})</Typography>
      </Grid>
      <Grid item xs={12} md={6}>
        <Typography variant="subtitle1">Service Date:</Typography>
        <Typography>{formatDate(service.serviceDate)}</Typography>
      </Grid>
      <Grid item xs={12} md={6}>
        <Typography variant="subtitle1">Units:</Typography>
        <Typography>{service.units}</Typography>
      </Grid>
      <Grid item xs={12} md={6}>
        <Typography variant="subtitle1">Rate:</Typography>
        <Typography>{formatCurrency(service.rate)}</Typography>
      </Grid>
      <Grid item xs={12} md={6}>
        <Typography variant="subtitle1">Amount:</Typography>
        <Typography>{formatCurrency(service.amount)}</Typography>
      </Grid>
      <Grid item xs={12} md={6}>
        <Typography variant="subtitle1">Program:</Typography>
        <Typography>{service.program.name}</Typography>
      </Grid>
      <Grid item xs={12} md={6}>
        <Typography variant="subtitle1">Facility:</Typography>
        <Typography>{service.facility?.name || 'N/A'}</Typography>
      </Grid>
      {service.staff && (
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1">Staff:</Typography>
          <Typography>{service.staff.firstName} {service.staff.lastName}</Typography>
        </Grid>
      )}
      <Grid item xs={12} md={6}>
        <Typography variant="subtitle1">Documentation Status:</Typography>
        <StatusBadge status={service.documentationStatus} type="documentation" />
      </Grid>
      <Grid item xs={12} md={6}>
        <Typography variant="subtitle1">Billing Status:</Typography>
        <StatusBadge status={service.billingStatus} type="billing" />
      </Grid>
    </Grid>
  );
};

/**
 * Component for displaying and managing service documentation
 * @param {ServiceWithRelations} service
 * @param {function} onUpdateDocumentationStatus
 * @param {boolean} isUpdating
 * @returns {JSX.Element} The rendered documentation tab
 */
const ServiceDocumentationTab: React.FC<{
  service: ServiceWithRelations;
  onUpdateDocumentationStatus: (status: DocumentationStatus, documentIds: UUID[]) => void;
  isUpdating: boolean;
}> = ({ service, onUpdateDocumentationStatus, isUpdating }) => {
  // 1. Display current documentation status with StatusBadge
  // 2. Render FileUploader component for adding new documentation
  // 3. Display list of existing documents with download options
  // 4. Include functionality to update documentation status
  // 5. Show loading indicator when updating documentation
  // 6. Display documentation requirements based on service type
  // 7. Include validation status and any validation errors
  return (
    <Box>
      <Typography variant="subtitle1">Documentation Status:</Typography>
      <StatusBadge status={service.documentationStatus} type="documentation" />
      <FileUploader
        acceptedTypes={['image/*', 'application/pdf']}
        maxSize={5 * 1024 * 1024}
        onUpload={(files) => {
          // TODO: Implement file upload logic
          console.log('Uploaded files:', files);
        }}
        loading={isUpdating}
      />
      {/* TODO: Implement list of existing documents */}
    </Box>
  );
};

/**
 * Component for displaying authorization information related to the service
 * @param {ServiceWithRelations} service
 * @returns {JSX.Element} The rendered authorization tab
 */
const ServiceAuthorizationTab: React.FC<{ service: ServiceWithRelations }> = ({ service }) => {
  // 1. Display authorization details if service has an authorization
  // 2. Show authorization number, date range, and status
  // 3. Display authorized units and used units with utilization percentage
  // 4. Render progress bar for visual representation of utilization
  // 5. Show warning if authorization is expiring soon
  // 6. Display message if no authorization is associated with the service
  return (
    <Box>
      {service.authorization ? (
        <AuthorizationList clientId={service.clientId} />
      ) : (
        <Typography>No authorization associated with this service.</Typography>
      )}
    </Box>
  );
};

/**
 * Component for displaying claims associated with the service
 * @param {ServiceWithRelations} service
 * @returns {JSX.Element} The rendered claims tab
 */
const ServiceClaimsTab: React.FC<{ service: ServiceWithRelations }> = ({ service }) => {
  // 1. Display claim information if service is associated with a claim
  // 2. Show claim number, status, submission date, and amount
  // 3. Include link to navigate to the claim detail page
  // 4. Display message if service is not associated with any claim
  // 5. Show billing status and options for unbilled services
  return (
    <Box>
      {service.claim ? (
        <ClaimServiceList services={[service]} selectable={false} />
      ) : (
        <Typography>This service is not associated with any claim.</Typography>
      )}
    </Box>
  );
};

/**
 * Helper function to calculate authorization utilization percentage
 * @param {number} authorizedUnits
 * @param {number} usedUnits
 * @returns {number} Utilization percentage (0-100)
 */
const calculateAuthorizationUtilization = (authorizedUnits: number, usedUnits: number): number => {
  // 1. Return 0 if authorizedUnits is 0 to avoid division by zero
  if (authorizedUnits === 0) {
    return 0;
  }

  // 2. Calculate percentage as (usedUnits / authorizedUnits) * 100
  let percentage = (usedUnits / authorizedUnits) * 100;

  // 3. Ensure percentage is between 0 and 100
  percentage = Math.min(Math.max(percentage, 0), 100);

  // 4. Return the calculated percentage
  return percentage;
};

export default ServiceDetail;