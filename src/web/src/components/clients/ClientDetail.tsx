import React, { useState, useEffect, useMemo } from 'react'; // v18.2.0
import { useRouter } from 'next/router'; // v13.4.0
import { Box, Typography, Grid, Divider, Chip, Paper, Skeleton, SxProps, Theme } from '@mui/material'; // v5.13.0
import { Edit as EditIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material'; // v5.11.16

import Card from '../ui/Card';
import Tabs from '../ui/Tabs';
import ActionButton from '../ui/ActionButton';
import AuthorizationList from './AuthorizationList';
import ServiceList from '../services/ServiceList';
import ClaimList from '../claims/ClaimList';
import useClients from '../../hooks/useClients';
import { Client, ClientStatus } from '../../types/clients.types';
import { formatDate, formatPhoneNumber } from '../../utils/format';
import { ROUTES } from '../../constants/routes.constants';

/**
 * Props interface for the ClientDetail component
 */
interface ClientDetailProps {
  /** The ID of the client to display */
  clientId: string;
  /** Optional styling for the component */
  sx?: SxProps<Theme>;
}

/**
 * Props interface for the ClientHeader component
 */
interface ClientHeaderProps {
  /** The client data to display in the header */
  client: Client;
  /** Callback function for editing the client */
  onEdit: () => void;
  /** Callback function for navigating back */
  onBack: () => void;
}

/**
 * Props interface for the ClientDemographics component
 */
interface ClientDemographicsProps {
  /** The client data to display */
  client: Client;
}

/**
 * Props interface for the ClientContact component
 */
interface ClientContactProps {
  /** The client data to display */
  client: Client;
}

/**
 * Props interface for the ClientPrograms component
 */
interface ClientProgramsProps {
  /** The client data to display */
  client: Client;
}

/**
 * Props interface for the ClientInsurance component
 */
interface ClientInsuranceProps {
  /** The client data to display */
  client: Client;
}

/**
 * Component that displays detailed information about a client
 * @param props - ClientDetailProps
 * @returns The rendered ClientDetail component
 */
const ClientDetail: React.FC<ClientDetailProps> = (props: ClientDetailProps) => {
  // LD1: Destructure props to extract clientId and sx
  const { clientId, sx } = props;

  // LD1: Initialize router for navigation
  const router = useRouter();

  // LD1: Initialize state for active tab
  const [activeTab, setActiveTab] = useState('authorizations');

  // LD1: Initialize client data using useClients hook
  const { 
    selectedClient: client, 
    getClientById, 
    loading, 
    error 
  } = useClients();

  // LD1: Fetch client data when component mounts or clientId changes
  useEffect(() => {
    if (clientId) {
      getClientById(clientId);
    }
  }, [clientId, getClientById]);

  // LD1: Create handleTabChange function to update active tab
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  // LD1: Create handleEditClient function to navigate to client edit page
  const handleEditClient = () => {
    router.push(`${ROUTES.CLIENTS.ROOT}/${clientId}/edit`);
  };

  // LD1: Create handleBackClick function to navigate back to clients list
  const handleBackClick = () => {
    router.push(ROUTES.CLIENTS.ROOT);
  };

  // LD1: Create handleAddService function to navigate to service creation page
  const handleAddService = () => {
    router.push(`${ROUTES.SERVICES.NEW}?clientId=${clientId}`);
  };

  // LD1: Create handleAddAuthorization function to navigate to authorization creation page
  const handleAddAuthorization = () => {
    router.push(`${ROUTES.CLIENTS.ROOT}/${clientId}/authorizations/new`);
  };

  // LD1: Create handleAddClaim function to navigate to claim creation page
  const handleAddClaim = () => {
    router.push(`${ROUTES.CLAIMS.NEW}?clientId=${clientId}`);
  };

  // LD1: Render loading state when client data is loading
  if (loading) {
    return <Typography>Loading client details...</Typography>;
  }

  // LD1: Render error state if client data fetch fails
  if (error) {
    return <Typography color="error">Error: {error}</Typography>;
  }

  // LD1: Render the client detail with header, demographic information, and tabbed content
  if (!client) {
    return <Typography>Client not found</Typography>;
  }

  // LD1: Render client header with name, ID, status, and action buttons
  return (
    <Box sx={{ width: '100%', ...sx }}>
      <ClientHeader 
        client={client} 
        onEdit={handleEditClient} 
        onBack={handleBackClick} 
      />

      <Grid container spacing={2} mt={2}>
        {/* LD1: Render client demographic information card with personal details */}
        <Grid item xs={12} md={6}>
          <ClientDemographics client={client} />
        </Grid>

        {/* LD1: Render client contact information card with address and contact details */}
        <Grid item xs={12} md={6}>
          <ClientContact client={client} />
        </Grid>

        {/* LD1: Render client program enrollments card with program list */}
        <Grid item xs={12} md={6}>
          <ClientPrograms client={client} />
        </Grid>

        {/* LD1: Render client insurance information card with insurance list */}
        <Grid item xs={12} md={6}>
          <ClientInsurance client={client} />
        </Grid>
      </Grid>

      {/* LD1: Render tabbed interface for authorizations, services, and claims */}
      <Tabs
        tabs={[
          { label: 'Authorizations', value: 'authorizations' },
          { label: 'Services', value: 'services' },
          { label: 'Claims', value: 'claims' },
        ]}
        activeTab={activeTab}
        onChange={handleTabChange}
        sx={{ mt: 2 }}
      />

      {/* LD1: Render AuthorizationList component in the Authorizations tab */}
      {activeTab === 'authorizations' && (
        <AuthorizationList clientId={clientId} />
      )}

      {/* LD1: Render ServiceList component in the Services tab */}
      {activeTab === 'services' && (
        <ServiceList clientId={clientId} />
      )}

      {/* LD1: Render ClaimList component in the Claims tab */}
      {activeTab === 'claims' && (
        <ClaimList clientId={clientId} />
      )}
    </Box>
  );
};

/**
 * Component that displays the client header with name, ID, status, and action buttons
 * @param props - ClientHeaderProps
 * @returns The rendered ClientHeader component
 */
const ClientHeader: React.FC<ClientHeaderProps> = (props: ClientHeaderProps) => {
  // LD1: Destructure props to extract client, onEdit, and onBack
  const { client, onEdit, onBack } = props;

  // LD1: Render a Paper component with client name, ID, and status
  return (
    <Paper elevation={1} sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Box>
        <Typography variant="h5" component="h1" gutterBottom>
          {client.firstName} {client.lastName}
        </Typography>
        <Typography variant="subtitle1" color="textSecondary">
          Client ID: {client.id}
        </Typography>
        <Chip label={client.status} color="primary" size="small" />
      </Box>

      {/* LD1: Render action buttons for back navigation and edit client */}
      <Box>
        <ActionButton label="Back to Clients" icon={<ArrowBackIcon />} onClick={onBack} />
        <ActionButton label="Edit Client" icon={<EditIcon />} onClick={onEdit} />
      </Box>
    </Paper>
  );
};

/**
 * Component that displays client demographic information
 * @param props - ClientDemographicsProps
 * @returns The rendered ClientDemographics component
 */
const ClientDemographics: React.FC<ClientDemographicsProps> = (props: ClientDemographicsProps) => {
  // LD1: Destructure props to extract client
  const { client } = props;

  // LD1: Render a Card component with demographic information
  return (
    <Card title="Demographics">
      <Typography variant="body2">
        Full Name: {client.firstName} {client.middleName} {client.lastName}
      </Typography>
      <Typography variant="body2">
        Date of Birth: {formatDate(client.dateOfBirth)}
      </Typography>
      <Typography variant="body2">
        Gender: {client.gender}
      </Typography>
      <Typography variant="body2">
        SSN: {client.ssn}
      </Typography>
      <Typography variant="body2">
        Medicaid ID: {client.medicaidId}
      </Typography>
      <Typography variant="body2">
        Medicare ID: {client.medicareId}
      </Typography>
    </Card>
  );
};

/**
 * Component that displays client contact information
 * @param props - ClientContactProps
 * @returns The rendered ClientContact component
 */
const ClientContact: React.FC<ClientContactProps> = (props: ClientContactProps) => {
  // LD1: Destructure props to extract client
  const { client } = props;

  // LD1: Render a Card component with contact information
  return (
    <Card title="Contact Information">
      <Typography variant="body2">
        Address: {client.address.street1}, {client.address.street2}, {client.address.city}, {client.address.state} {client.address.zipCode}
      </Typography>
      <Typography variant="body2">
        Phone: {formatPhoneNumber(client.contactInfo.phone)}
      </Typography>
      <Typography variant="body2">
        Email: {client.contactInfo.email}
      </Typography>
      {client.emergencyContact && (
        <>
          <Divider sx={{ my: 1 }} />
          <Typography variant="subtitle2">Emergency Contact</Typography>
          <Typography variant="body2">
            Name: {client.emergencyContact.name}
          </Typography>
          <Typography variant="body2">
            Relationship: {client.emergencyContact.relationship}
          </Typography>
          <Typography variant="body2">
            Phone: {formatPhoneNumber(client.emergencyContact.phone)}
          </Typography>
        </>
      )}
    </Card>
  );
};

/**
 * Component that displays client program enrollments
 * @param props - ClientProgramsProps
 * @returns The rendered ClientPrograms component
 */
const ClientPrograms: React.FC<ClientProgramsProps> = (props: ClientProgramsProps) => {
  // LD1: Destructure props to extract client
  const { client } = props;

  // LD1: Render a Card component with program enrollment information
  return (
    <Card title="Program Enrollments">
      {client.programs.map((program) => (
        <Box key={program.id} sx={{ mb: 1 }}>
          <Typography variant="subtitle2">{program.program.name}</Typography>
          <Typography variant="body2">
            Start Date: {formatDate(program.startDate)}
          </Typography>
          <Typography variant="body2">
            End Date: {formatDate(program.endDate)}
          </Typography>
          <Typography variant="body2">
            Status: {program.status}
          </Typography>
        </Box>
      ))}
    </Card>
  );
};

/**
 * Component that displays client insurance information
 * @param props - ClientInsuranceProps
 * @returns The rendered ClientInsurance component
 */
const ClientInsurance: React.FC<ClientInsuranceProps> = (props: ClientInsuranceProps) => {
  // LD1: Destructure props to extract client
  const { client } = props;

  // LD1: Render a Card component with insurance information
  return (
    <Card title="Insurance Information">
      {client.insurances.map((insurance) => (
        <Box key={insurance.id} sx={{ mb: 1 }}>
          <Typography variant="subtitle2">
            {insurance.isPrimary ? <b>Primary:</b> : null} {insurance.type}
          </Typography>
          <Typography variant="body2">
            Payer: {insurance.payer.name}
          </Typography>
          <Typography variant="body2">
            Policy Number: {insurance.policyNumber}
          </Typography>
          <Typography variant="body2">
            Effective Date: {formatDate(insurance.effectiveDate)}
          </Typography>
          <Typography variant="body2">
            Termination Date: {formatDate(insurance.terminationDate)}
          </Typography>
        </Box>
      ))}
    </Card>
  );
};

export default ClientDetail;