import React, { useState, useCallback, useEffect } from 'react'; // react v18.2.0
import { NextPage } from 'next'; // next v13.4+
import Head from 'next/head'; // next/head v13.4+
import { Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material'; // @mui/material v5.13.0
import { Add } from '@mui/icons-material'; // @mui/icons-material v5.13.0

import SettingsLayout from '../../components/layout/SettingsLayout';
import PayerList from '../../components/settings/PayerList';
import PayerForm from '../../components/settings/PayerForm';
import useToast from '../../hooks/useToast';
import useApiRequest from '../../hooks/useApiRequest';
import useAuth, {  } from '../../hooks/useAuth';
import { API_ENDPOINTS } from '../../constants/api.constants';
import { PayerType } from '../../types/claims.types';

/**
 * The main page component for managing payers in the settings section
 * @returns {JSX.Element} The rendered PayersPage component
 */
const PayersPage: NextPage = () => {
  // LD1: Initialize state for selected payer, form visibility, and loading state
  const [selectedPayer, setSelectedPayer] = useState<any | null>(null);
  const [formVisible, setFormVisible] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  // LD1: Initialize toast notification hook
  const toast = useToast();

  // LD1: Initialize API request hook for payer operations
  const { execute: createPayer } = useApiRequest({
    url: API_ENDPOINTS.SETTINGS.PAYERS,
    method: 'POST'
  });

  const { execute: updatePayer } = useApiRequest({
    url: API_ENDPOINTS.SETTINGS.PAYERS,
    method: 'PUT'
  });

  // LD1: Initialize auth hook to check permissions
  const { hasPermission } = useAuth();

  /**
   * Opens the payer form for adding a new payer
   * @returns {void} No return value
   */
  const handleAddPayer = useCallback(() => {
    // LD1: Set selectedPayer to null to indicate a new payer
    setSelectedPayer(null);
    // LD1: Set formVisible to true to show the form dialog
    setFormVisible(true);
  }, []);

  /**
   * Opens the payer form for editing an existing payer
   * @param {object} payer
   * @returns {void} No return value
   */
  const handleEditPayer = useCallback((payer: any) => {
    // LD1: Set selectedPayer to the payer object to be edited
    setSelectedPayer(payer);
    // LD1: Set formVisible to true to show the form dialog
    setFormVisible(true);
  }, []);

  /**
   * Closes the payer form dialog
   * @returns {void} No return value
   */
  const handleCloseForm = useCallback(() => {
    // LD1: Set formVisible to false to hide the form dialog
    setFormVisible(false);
    // LD1: Set selectedPayer to null to clear the selected payer
    setSelectedPayer(null);
  }, []);

  /**
   * Handles the submission of the payer form for creating or updating a payer
   * @param {object} payerData
   * @returns {Promise<void>} Promise that resolves when the operation is complete
   */
  const handleSubmitPayer = useCallback(async (payerData: any) => {
    // LD1: Set loading state to true
    setLoading(true);

    try {
      // LD1: Determine if this is a create or update operation based on selectedPayer
      if (selectedPayer) {
        // LD1: For update: Make PUT request to update payer endpoint with payer ID and data
        await updatePayer({ url: `${API_ENDPOINTS.SETTINGS.PAYERS}/${selectedPayer.id}`, data: payerData });
      } else {
        // LD1: For create: Make POST request to create payer endpoint with payer data
        await createPayer({ data: payerData });
      }

      // LD1: Show success toast notification on successful operation
      toast.success(`Payer ${selectedPayer ? 'updated' : 'created'} successfully`);
      // LD1: Close the form dialog
      handleCloseForm();
    } catch (err: any) {
      // LD1: Handle any errors with error toast notifications
      toast.error(err.message || 'Failed to save payer');
    } finally {
      // LD1: Set loading state to false
      setLoading(false);
    }
  }, [createPayer, updatePayer, selectedPayer, toast, handleCloseForm]);

  // LD1: Check if user has permission to manage payers
  const hasManagePayersPermission = hasPermission('settings:payers:manage');

  return (
    <>
      <Head>
        <title>Payers - HCBS Revenue Management</title>
      </Head>
      {/* LD1: Render the SettingsLayout with 'payers' as the active tab */}
      <SettingsLayout activeTab="payers">
        {/* LD1: Render the PayerList component with handlers for add and edit actions */}
        <PayerList onAddPayer={handleAddPayer} onEditPayer={handleEditPayer} />

        {/* LD1: Render a Dialog containing the PayerForm when form is visible */}
        <Dialog open={formVisible} onClose={handleCloseForm} fullWidth maxWidth="md">
          <DialogTitle>{selectedPayer ? 'Edit Payer' : 'Add Payer'}</DialogTitle>
          <DialogContent>
            <PayerForm
              payer={selectedPayer}
              onSubmit={handleSubmitPayer}
              onCancel={handleCloseForm}
              loading={loading}
            />
          </DialogContent>
          {/* LD1: Include appropriate dialog actions (Submit/Cancel) */}
          <DialogActions>
            <Button onClick={handleCloseForm} disabled={loading}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitPayer}
              color="primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </DialogActions>
        </Dialog>
      </SettingsLayout>
    </>
  );
};

// IE3: Export the PayersPage component as the default export
export default PayersPage;