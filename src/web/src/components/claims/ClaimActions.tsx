import React, { useMemo } from 'react'; // v18.2.0
import { Box, Stack, SxProps, Theme } from '@mui/material'; // v5.13.0
import { Edit, Send, Refresh, Print, Block, Redo, Create } from '@mui/icons-material'; // v5.13.0

import ActionButton from '../ui/ActionButton';
import useClaims from '../../hooks/useClaims';
import useToast from '../../hooks/useToast';
import { ClaimStatus, ClaimWithRelations } from '../../types/claims.types';
import { CLAIM_STATUS_ACTIONS, CLAIM_ACTIONS } from '../../constants/claims.constants';

/**
 * Props for the ClaimActions component
 */
interface ClaimActionsProps {
  claim: ClaimWithRelations;
  onEdit?: (claimId: string) => void;
  onSubmit?: (claimId: string) => void;
  onResubmit?: (claimId: string) => void;
  onVoid?: (claimId: string) => void;
  onAppeal?: (claimId: string) => void;
  onPrint?: (claimId: string) => void;
  sx?: SxProps<Theme>;
}

/**
 * Mapping of action types to their corresponding icons
 */
const ACTION_ICONS: Record<string, React.ReactNode> = {
  [CLAIM_ACTIONS.EDIT]: <Edit />,
  [CLAIM_ACTIONS.SUBMIT]: <Send />,
  [CLAIM_ACTIONS.RESUBMIT]: <Redo />,
  [CLAIM_ACTIONS.VOID]: <Block />,
  [CLAIM_ACTIONS.APPEAL]: <Create />,
  [CLAIM_ACTIONS.PRINT]: <Print />,
  [CLAIM_ACTIONS.REFRESH_STATUS]: <Refresh />,
};

/**
 * Mapping of action types to their display labels
 */
const ACTION_LABELS: Record<string, string> = {
  [CLAIM_ACTIONS.EDIT]: 'Edit Claim',
  [CLAIM_ACTIONS.SUBMIT]: 'Submit Claim',
  [CLAIM_ACTIONS.RESUBMIT]: 'Resubmit Claim',
  [CLAIM_ACTIONS.VOID]: 'Void Claim',
  [CLAIM_ACTIONS.APPEAL]: 'Appeal Claim',
  [CLAIM_ACTIONS.PRINT]: 'Print Claim',
  [CLAIM_ACTIONS.REFRESH_STATUS]: 'Refresh Status',
};

/**
 * Confirmation messages for actions that require confirmation
 */
const CONFIRMATION_MESSAGES: Record<string, string> = {
  [CLAIM_ACTIONS.VOID]: 'Are you sure you want to void this claim? This action cannot be undone.',
  [CLAIM_ACTIONS.RESUBMIT]: 'Are you sure you want to resubmit this claim?',
  [CLAIM_ACTIONS.APPEAL]: 'Are you sure you want to appeal this claim?',
};

/**
 * A component that renders action buttons for claim operations based on the current claim status
 */
const ClaimActions: React.FC<ClaimActionsProps> = ({
  claim,
  onEdit,
  onSubmit,
  onResubmit,
  onVoid,
  onAppeal,
  onPrint,
  sx,
}) => {
  const {
    submitClaim,
    appealClaim,
    voidClaim,
  } = useClaims({ autoFetch: false });
  const toast = useToast();

  const availableActions = useMemo(() => {
    return CLAIM_STATUS_ACTIONS[claim.claimStatus] || [];
  }, [claim.claimStatus]);

  const handleEdit = () => {
    if (onEdit && claim.id) {
      onEdit(claim.id);
    }
  };

  const handleSubmit = async () => {
    if (onSubmit && claim.id) {
      try {
        await submitClaim(claim.id, {
          submissionMethod: 'electronic', // Default submission method
          submissionDate: new Date().toISOString().split('T')[0], // Today's date
          externalClaimId: null,
          notes: null,
        });
        toast.success('Claim submitted successfully!');
      } catch (error: any) {
        toast.error(error?.message || 'Failed to submit claim.');
      }
    }
  };

  const handleResubmit = async () => {
    if (onResubmit && claim.id) {
      try {
        await submitClaim(claim.id, {
          submissionMethod: 'electronic', // Default submission method
          submissionDate: new Date().toISOString().split('T')[0], // Today's date
          externalClaimId: null,
          notes: null,
        });
        toast.success('Claim resubmitted successfully!');
      } catch (error: any) {
        toast.error(error?.message || 'Failed to resubmit claim.');
      }
    }
  };

  const handleVoid = async () => {
    if (onVoid && claim.id) {
      try {
        await voidClaim(claim.id, 'Voided by user');
        toast.success('Claim voided successfully!');
      } catch (error: any) {
        toast.error(error?.message || 'Failed to void claim.');
      }
    }
  };

  const handleAppeal = async () => {
    if (onAppeal && claim.id) {
      try {
        await appealClaim(claim.id, { appealReason: 'Appealed by user' });
        toast.success('Claim appealed successfully!');
      } catch (error: any) {
        toast.error(error?.message || 'Failed to appeal claim.');
      }
    }
  };

  const handlePrint = () => {
    if (onPrint && claim.id) {
      onPrint(claim.id);
    }
  };

  const renderActionButton = (actionType: string, onClick: () => void): JSX.Element => {
    const icon = ACTION_ICONS[actionType];
    const label = ACTION_LABELS[actionType];
    const confirmText = CONFIRMATION_MESSAGES[actionType];

    return (
      <ActionButton
        key={actionType}
        label={label}
        icon={icon}
        onClick={onClick}
        confirmText={confirmText}
      />
    );
  };

  return (
    <Stack direction="row" spacing={2} sx={sx}>
      {availableActions.map((actionType) => {
        switch (actionType) {
          case CLAIM_ACTIONS.EDIT:
            return renderActionButton(CLAIM_ACTIONS.EDIT, handleEdit);
          case CLAIM_ACTIONS.SUBMIT:
            return renderActionButton(CLAIM_ACTIONS.SUBMIT, handleSubmit);
          case CLAIM_ACTIONS.RESUBMIT:
            return renderActionButton(CLAIM_ACTIONS.RESUBMIT, handleResubmit);
          case CLAIM_ACTIONS.VOID:
            return renderActionButton(CLAIM_ACTIONS.VOID, handleVoid);
          case CLAIM_ACTIONS.APPEAL:
            return renderActionButton(CLAIM_ACTIONS.APPEAL, handleAppeal);
          case CLAIM_ACTIONS.PRINT:
            return renderActionButton(CLAIM_ACTIONS.PRINT, handlePrint);
          default:
            return null;
        }
      })}
    </Stack>
  );
};

export default ClaimActions;