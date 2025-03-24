import React, { useState, useEffect, useCallback } from 'react'; // react v18.2.0 React hooks for state management and side effects
import { useRouter } from 'next/router'; // next/router v13.4+
import { Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material'; // @mui/material v5.13+ Material UI components for layout and dialogs
import { Add } from '@mui/icons-material'; // @mui/icons-material v5.13+ Material UI icon for the add button
import Head from 'next/head'; // next/head v13.4+

import SettingsLayout from '../../components/layout/SettingsLayout'; // Layout component for settings pages with consistent navigation
import ProgramList from '../../components/settings/ProgramList'; // Component for displaying and managing the list of programs
import ProgramForm from '../../components/settings/ProgramForm'; // Component for creating and editing program information
import Card from '../../components/ui/Card'; // UI component for containing content in a styled card
import useToast from '../../hooks/useToast'; // Custom hook for displaying toast notifications
import useApiRequest from '../../hooks/useApiRequest'; // Custom hook for making API requests
import useSettings from '../../hooks/useSettings'; // Custom hook for accessing and managing settings
import { API_ENDPOINTS } from '../../constants/api.constants'; // API endpoint constants for program management
import { ProgramFormValues } from '../../types/settings.types'; // Type definition for program form values

/**
 * Main component for the programs settings page
 * @returns {JSX.Element} The rendered programs page
 */
const ProgramsPage: React.FC = () => {
  // LD1: Initialize router using useRouter hook
  const router = useRouter();

  // LD1: Initialize state for managing program form dialog
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);

  // LD1: Initialize state for selected program when editing
  const [selectedProgram, setSelectedProgram] = useState<any>(null);

  // LD1: Initialize toast notification hook
  const { success } = useToast();

  // LD1: Initialize API request hook
  const { execute: apiRequest } = useApiRequest();

  // LD1: Initialize settings hook for accessing program-related settings
  const { settings, fetchSettings } = useSettings();

  /**
   * Handles opening the dialog for adding a new program
   * @returns {void} No return value
   */
  const handleAddProgram = useCallback(() => {
    // LD1: Set selectedProgram to null to indicate adding a new program
    setSelectedProgram(null);
    // LD1: Set isFormOpen to true to open the dialog
    setIsFormOpen(true);
  }, []);

  /**
   * Handles opening the dialog for editing an existing program
   * @param {object} program
   * @returns {void} No return value
   */
  const handleEditProgram = useCallback((program: any) => {
    // LD1: Set selectedProgram to the program to be edited
    setSelectedProgram(program);
    // LD1: Set isFormOpen to true to open the dialog
    setIsFormOpen(true);
  }, []);

  /**
   * Handles closing the program form dialog
   * @returns {void} No return value
   */
  const handleCloseForm = useCallback(() => {
    // LD1: Set isFormOpen to false to close the dialog
    setIsFormOpen(false);
    // LD1: Set selectedProgram to null to reset the form
    setSelectedProgram(null);
  }, []);

  /**
   * Handles successful form submission
   * @param {ProgramFormValues} formData
   * @returns {void} No return value
   */
  const handleFormSuccess = useCallback((formData: ProgramFormValues) => {
    // LD1: Close the form dialog
    handleCloseForm();
    // LD1: Show success toast notification based on whether adding or editing
    success(selectedProgram ? 'Program updated successfully!' : 'Program added successfully!');
    // LD1: Refresh the program list to show updated data
    fetchSettings();
  }, [success, selectedProgram, fetchSettings, handleCloseForm]);

  // LD1: Render the page with SettingsLayout as the wrapper
  return (
    <>
     <Head>
        <title>Programs - ThinkCaring</title>
      </Head>
      <SettingsLayout>
        {/* LD1: Render page title and add program button */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6">Programs</Typography>
          <Button variant="contained" startIcon={<Add />} onClick={handleAddProgram}>
            Add Program
          </Button>
        </Box>

        {/* LD1: Render ProgramList component for displaying programs */}
        <ProgramList onEdit={handleEditProgram} />

        {/* LD1: Render dialog with ProgramForm for adding/editing programs */}
        <Dialog open={isFormOpen} onClose={handleCloseForm} fullWidth maxWidth="md">
          <DialogTitle>{selectedProgram ? 'Edit Program' : 'Add Program'}</DialogTitle>
          <DialogContent>
            <ProgramForm
              initialValues={selectedProgram}
              onSubmit={handleFormSuccess}
              isLoading={false} // Replace with actual loading state if needed
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseForm}>Cancel</Button>
          </DialogActions>
        </Dialog>
      </SettingsLayout>
    </>
  );
};

// IE3: Be generous about your exports so long as it doesn't create a security risk.
// IE3: Export the ProgramsPage component as the default export
export default ProgramsPage;