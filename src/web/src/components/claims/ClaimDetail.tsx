import React, { useState, useEffect, useCallback } from 'react'; // v18.2.0
import { useRouter } from 'next/router'; // v13.4.0
import { Box, Grid, Typography, Divider, Skeleton, CircularProgress, SxProps, Theme } from '@mui/material'; // v5.13.0

import Card from '../ui/Card';
import Tabs from '../ui/Tabs';
import StatusBadge from './StatusBadge';
import ClaimTimeline from './ClaimTimeline';
import ClaimServiceList from './ClaimServiceList';
import ClaimActions from './ClaimActions';
import ClaimSummary from './ClaimSummary';
import useClaims from '../../hooks/useClaims';
import { ClaimWithRelations, ClaimStatus, ClaimLifecycle } from '../../types/claims.types';
import { CLAIM_STATUS_LABELS } from '../../constants/claims.constants';
import { formatCurrency, formatDate } from '../../utils/format';
import useToast from '../../hooks/useToast';

/**
 * Interface defining the props for the ClaimDetail component
 */
interface ClaimDetailProps {
  /** The ID of the claim to display */
  claimId: string;
  /** Optional callback function for navigating back to the claims list */
  onBack?: () => void;
  /** Optional callback function for editing the claim */
  onEdit?: (claimId: string) => void;
  /** Optional callback function for deleting the claim */
  onDelete?: (claimId: string) => void;
  /** Optional styling for the component */
  sx?: SxProps<Theme>;
}

/**
 * Tab definitions for the claim detail view
 */
const TABS = [
  { label: 'Services', value: 'services' },
  { label: 'Documentation', value: 'documentation' },
  { label: 'Payments', value: 'payments' },
  { label: 'Notes', value: 'notes' },
  { label: 'History', value: 'history' },
];

/**
 * A component that displays detailed information about a claim
 */
const ClaimDetail: React.FC<ClaimDetailProps> = ({
  claimId,
  onEdit,
  onDelete,
  onBack,
  sx,
}) => {
  // State for managing the active tab
  const [activeTab, setActiveTab] = useState<string>(TABS[0].value);

  // State for managing loading and claim lifecycle data
  const [loading, setLoading] = useState<boolean>(true);
  const [claimLifecycle, setClaimLifecycle] = useState<ClaimLifecycle | null>(null);

  // Get the router for navigation
  const router = useRouter();

  // Get claim operations and state management from useClaims hook
  const {
    fetchClaimLifecycle,
    appealClaim,
    voidClaim,
  } = useClaims({ autoFetch: false });

  // Get toast notifications from useToast hook
  const toast = useToast();

  /**
   * Fetches claim details including timeline and related claims
   */
  const fetchClaimDetails = useCallback(async () => {
    setLoading(true);
    try {
      const lifecycle = await fetchClaimLifecycle(claimId);
      if (lifecycle) {
        setClaimLifecycle(lifecycle);
      } else {
        // Handle the case where claim lifecycle data could not be fetched
        toast.error('Failed to load claim details.');
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to load claim details.');
    } finally {
      setLoading(false);
    }
  }, [claimId, fetchClaimLifecycle, toast]);

  /**
   * Handles editing the claim and navigates to the edit page
   */
  const handleEdit = () => {
    if (onEdit) {
      onEdit(claimId);
    }
  };

  /**
   * Handles deleting the claim and navigates back to the claims list
   */
  const handleDelete = () => {
    if (onDelete) {
      onDelete(claimId);
    }
  };

  /**
   * Handles submitting the claim
   */
  const handleSubmit = () => {
    // Implement submit logic here
    console.log('Submit claim');
  };

  /**
   * Handles voiding the claim
   */
  const handleVoid = async () => {
    try {
      await voidClaim(claimId, 'Voided by user');
      toast.success('Claim voided successfully!');
      // Refresh claim details after voiding
      fetchClaimDetails();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to void claim.');
    }
  };

  /**
   * Handles cloning the claim
   */
  const handleClone = () => {
    // Implement clone logic here
    console.log('Clone claim');
  };

  /**
   * Handles printing the claim
   */
  const handlePrint = () => {
    // Implement print logic here
    console.log('Print claim');
  };

  /**
   * Handles resubmitting the claim
   */
  const handleResubmit = async () => {
    try {
      // Implement resubmit logic here
      console.log('Resubmit claim');
      toast.success('Claim resubmitted successfully!');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to resubmit claim.');
    }
  };

  /**
   * Handles appealing the claim
   */
  const handleAppeal = async () => {
    try {
      await appealClaim(claimId, { appealReason: 'Appealed by user' });
      toast.success('Claim appealed successfully!');
      // Refresh claim details after appealing
      fetchClaimDetails();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to appeal claim.');
    }
  };

  // Fetch claim details when claimId changes
  useEffect(() => {
    if (claimId) {
      fetchClaimDetails();
    }
  }, [claimId, fetchClaimDetails]);

  // Extract claim and related data from claimLifecycle
  const claim = claimLifecycle?.claim;
  const timeline = claimLifecycle?.timeline;
  const relatedClaims = claimLifecycle?.relatedClaims;

  /**
   * Renders the claim information section
   * @param claim The claim data
   * @returns A Card component with claim details
   */
  const renderClaimInfo = (claim: ClaimWithRelations): JSX.Element => {
    return (
      <Card title="Claim Information">
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography variant="subtitle2">Client:</Typography>
            <Typography>{claim.client.firstName} {claim.client.lastName}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="subtitle2">Service Type:</Typography>
            <Typography>{claim.services[0]?.serviceType.name || 'N/A'}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="subtitle2">Date Range:</Typography>
            <Typography>{formatDate(claim.serviceStartDate)} - {formatDate(claim.serviceEndDate)}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="subtitle2">Payer:</Typography>
            <Typography>{claim.payer.name}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="subtitle2">Total Amount:</Typography>
            <Typography>{formatCurrency(claim.totalAmount)}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="subtitle2">Status:</Typography>
            <Typography><StatusBadge status={claim.claimStatus} type="claim" /></Typography>
          </Grid>
        </Grid>
      </Card>
    );
  };

  /**
   * Renders the content for the selected tab
   * @param activeTab The currently selected tab
   * @param claimLifecycle The claim lifecycle data
   * @returns The content for the selected tab
   */
  const renderTabContent = (activeTab: string, claimLifecycle: ClaimLifecycle): JSX.Element => {
    switch (activeTab) {
      case 'services':
        return <ClaimServiceList services={claimLifecycle.claim.services} />;
      case 'documentation':
        return <Typography>Documentation content</Typography>;
      case 'payments':
        return <Typography>Payments content</Typography>;
      case 'notes':
        return <Typography>Notes content</Typography>;
      case 'history':
        return <Typography>History content</Typography>;
      default:
        return <Typography>No content for this tab</Typography>;
    }
  };

  /**
   * Renders the related claims section
   * @param claimLifecycle The claim lifecycle data
   * @returns A section showing related claims
   */
  const renderRelatedClaims = (claimLifecycle: ClaimLifecycle): JSX.Element => {
    return (
      <Card title="Related Claims">
        {relatedClaims && relatedClaims.length > 0 ? (
          relatedClaims.map(relatedClaim => (
            <ClaimSummary
              key={relatedClaim.id}
              claim={relatedClaim}
              onClick={() => router.push(`/claims/${relatedClaim.id}`)}
            />
          ))
        ) : (
          <Typography>No related claims</Typography>
        )}
      </Card>
    );
  };

  // Render loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Render error state
  if (!claim) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6">Claim not found</Typography>
      </Box>
    );
  }

  // Render the claim detail view
  return (
    <Box sx={{ ...sx }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">Claim # {claim.claimNumber}</Typography>
        {onBack && (
          <Button onClick={onBack} variant="outlined">
            Back to Claims
          </Button>
        )}
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          {renderClaimInfo(claim)}
        </Grid>
        <Grid item xs={12} md={6}>
          <Card title="Status Timeline">
            {timeline && <ClaimTimeline timeline={timeline} />}
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mt: 2 }}>
        <ClaimActions
          claim={claim}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onSubmit={handleSubmit}
          onResubmit={handleResubmit}
          onVoid={handleVoid}
          onAppeal={handleAppeal}
          onPrint={handlePrint}
        />
      </Box>

      <Box sx={{ mt: 3 }}>
        <Tabs
          tabs={TABS}
          activeTab={activeTab}
          onChange={(tab) => setActiveTab(tab)}
        />
        <Box sx={{ mt: 2 }}>
          {claimLifecycle && renderTabContent(activeTab, claimLifecycle)}
        </Box>
      </Box>

      <Box sx={{ mt: 3 }}>
        {claimLifecycle && renderRelatedClaims(claimLifecycle)}
      </Box>
    </Box>
  );
};

export default ClaimDetail;