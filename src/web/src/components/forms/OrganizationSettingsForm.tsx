import React, { useState, useEffect } from 'react'; // v18.2.0
import {
  Grid,
  TextField,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Divider,
  IconButton,
  Tooltip,
  FormHelperText
} from '@mui/material'; // v5.13.0
import { ColorPicker } from '@mui/x-date-pickers'; // v6.0.0
import { DatePicker } from '@mui/x-date-pickers'; // v6.0.0
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material'; // v5.13.0
import { z } from 'zod'; // v3.21.0

import Card from '../ui/Card';
import ActionButton from '../ui/ActionButton';
import FileUploader from '../ui/FileUploader';
import useForm from '../../hooks/useForm';
import { settingsApi } from '../../api/settings.api';
import { OrganizationSettings, UpdateOrganizationSettingsDto } from '../../types/settings.types';
import { validateEmail, validatePhone, validateZipCode, validateRequired } from '../../utils/validation';

/**
 * Creates a Zod validation schema for the organization settings form
 * @returns {z.ZodObject} Zod validation schema for organization settings data
 */
const createOrganizationValidationSchema = () => {
  // LD1: Create a Zod object schema with validation rules for each field
  return z.object({
    name: z.string().min(1, { message: 'Organization name is required' }), // LD1: Validate organization name as a required string
    legalName: z.string().min(1, { message: 'Legal name is required' }), // LD1: Validate legal name as a required string
    taxId: z.string().regex(/^\d{2}-\d{7}$/, { message: 'Invalid Tax ID format' }), // LD1: Validate tax ID with appropriate pattern
    npi: z.string().regex(/^\d{10}$/, { message: 'Invalid NPI format' }), // LD1: Validate NPI with appropriate pattern
    medicaidId: z.string().optional(), // LD1: Validate Medicaid ID with appropriate pattern
    address: z.object({ // LD1: Validate address fields including required fields and zip code format
      street1: z.string().min(1, { message: 'Street address is required' }),
      street2: z.string().optional(),
      city: z.string().min(1, { message: 'City is required' }),
      state: z.string().min(1, { message: 'State is required' }),
      zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, { message: 'Invalid ZIP code format' }),
      country: z.string().min(1, { message: 'Country is required' })
    }),
    contactInfo: z.object({ // LD1: Validate contact information including email and phone with proper formats
      email: z.string().email({ message: 'Invalid email format' }).optional(),
      phone: z.string().regex(/^\d{3}-\d{3}-\d{4}$/, { message: 'Invalid phone format' }).optional(),
      alternatePhone: z.string().regex(/^\d{3}-\d{3}-\d{4}$/, { message: 'Invalid phone format' }).optional(),
      fax: z.string().regex(/^\d{3}-\d{3}-\d{4}$/, { message: 'Invalid phone format' }).optional()
    }),
    logo: z.string().optional(),
    primaryColor: z.string().regex(/^#([0-9A-Fa-f]{3}){1,2}$/, { message: 'Invalid color format' }).optional(), // LD1: Validate color values for branding
    secondaryColor: z.string().regex(/^#([0-9A-Fa-f]{3}){1,2}$/, { message: 'Invalid color format' }).optional(), // LD1: Validate color values for branding
    licenseInfo: z.array( // LD1: Validate license information array with required fields and date format
      z.object({
        type: z.string().min(1, { message: 'License type is required' }),
        number: z.string().min(1, { message: 'License number is required' }),
        expirationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Invalid date format' })
      })
    ).optional()
  });
};

/**
 * Form component for editing organization settings
 * @param {OrganizationSettings} organizationSettings
 * @param {function} onSuccess
 * @returns {JSX.Element} The rendered organization settings form
 */
interface OrganizationSettingsFormProps {
  organizationSettings: OrganizationSettings;
  onSuccess: () => void;
}
export const OrganizationSettingsForm: React.FC<OrganizationSettingsFormProps> = ({ organizationSettings, onSuccess }) => {
  // LD1: Initialize state for loading, error, and success message
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // LD1: Initialize form using useForm hook with validation schema
  const validationSchema = createOrganizationValidationSchema();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset
  } = useForm<UpdateOrganizationSettingsDto>({ validationSchema });

  // LD1: Set up form values when organization settings are provided
  useEffect(() => {
    if (organizationSettings) {
      reset(organizationSettings);
    }
  }, [organizationSettings, reset]);

  // LD1: Handle logo file upload and conversion to base64
  const handleLogoUpload = async (files: File[]) => {
    const file = files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setValue('logo', base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  // LD1: Handle adding and removing license information entries
  const [licenseInfo, setLicenseInfo] = useState(organizationSettings?.licenseInfo || []);

  const addLicense = () => {
    setLicenseInfo([...licenseInfo, { type: '', number: '', expirationDate: '' }]);
  };

  const removeLicense = (index: number) => {
    const newLicenseInfo = [...licenseInfo];
    newLicenseInfo.splice(index, 1);
    setLicenseInfo(newLicenseInfo);
  };

  // LD1: Handle form submission to update organization settings
  const onSubmit = async (data: UpdateOrganizationSettingsDto) => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await settingsApi.updateOrganizationSettings(data);
      setSuccessMessage('Organization settings updated successfully!');
      onSuccess();
    } catch (e: any) {
      setError(e.message || 'Failed to update organization settings.');
    } finally {
      setLoading(false);
    }
  };

  // LD1: Render form with Card component containing all form sections
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card title="Organization Information" loading={loading}>
        {/* LD1: Include organization information section with name, legal name, tax ID, NPI, and Medicaid ID fields */}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Organization Name"
              fullWidth
              {...register('name')}
              error={!!errors.name}
              helperText={errors.name?.message}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Legal Name"
              fullWidth
              {...register('legalName')}
              error={!!errors.legalName}
              helperText={errors.legalName?.message}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Tax ID"
              fullWidth
              {...register('taxId')}
              error={!!errors.taxId}
              helperText={errors.taxId?.message}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="NPI"
              fullWidth
              {...register('npi')}
              error={!!errors.npi}
              helperText={errors.npi?.message}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Medicaid ID"
              fullWidth
              {...register('medicaidId')}
              error={!!errors.medicaidId}
              helperText={errors.medicaidId?.message}
            />
          </Grid>
        </Grid>
      </Card>

      <Card title="Branding" sx={{ mt: 3 }} loading={loading}>
        {/* LD1: Include branding section with logo upload and color pickers */}
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12}>
            <FileUploader
              label="Organization Logo"
              acceptedTypes={['image/jpeg', 'image/png', 'image/jpg']}
              maxSize={5 * 1024 * 1024}
              onUpload={handleLogoUpload}
              error={errors.logo?.message}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography>Primary Color</Typography>
            <ColorPicker
              value={organizationSettings?.primaryColor || '#000000'}
              onChange={(color: any) => setValue('primaryColor', color)}
            />
             {errors.primaryColor && (
              <FormHelperText error>{errors.primaryColor.message}</FormHelperText>
            )}
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography>Secondary Color</Typography>
            <ColorPicker
              value={organizationSettings?.secondaryColor || '#000000'}
              onChange={(color: any) => setValue('secondaryColor', color)}
            />
             {errors.secondaryColor && (
              <FormHelperText error>{errors.secondaryColor.message}</FormHelperText>
            )}
          </Grid>
        </Grid>
      </Card>

      <Card title="Contact Information" sx={{ mt: 3 }} loading={loading}>
        {/* LD1: Include contact information section with email, phone, and address fields */}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Email"
              fullWidth
              {...register('contactInfo.email')}
              error={!!errors.contactInfo?.email}
              helperText={errors.contactInfo?.email?.message}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Phone"
              fullWidth
              {...register('contactInfo.phone')}
              error={!!errors.contactInfo?.phone}
              helperText={errors.contactInfo?.phone?.message}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Alternate Phone"
              fullWidth
              {...register('contactInfo.alternatePhone')}
              error={!!errors.contactInfo?.alternatePhone}
              helperText={errors.contactInfo?.alternatePhone?.message}
            />
          </Grid>
           <Grid item xs={12} sm={6}>
            <TextField
              label="Fax"
              fullWidth
              {...register('contactInfo.fax')}
              error={!!errors.contactInfo?.fax}
              helperText={errors.contactInfo?.fax?.message}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Street Address"
              fullWidth
              {...register('address.street1')}
              error={!!errors.address?.street1}
              helperText={errors.address?.street1?.message}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Street Address 2"
              fullWidth
              {...register('address.street2')}
              error={!!errors.address?.street2}
              helperText={errors.address?.street2?.message}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="City"
              fullWidth
              {...register('address.city')}
              error={!!errors.address?.city}
              helperText={errors.address?.city?.message}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="State"
              fullWidth
              {...register('address.state')}
              error={!!errors.address?.state}
              helperText={errors.address?.state?.message}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Zip Code"
              fullWidth
              {...register('address.zipCode')}
              error={!!errors.address?.zipCode}
              helperText={errors.address?.zipCode?.message}
            />
          </Grid>
           <Grid item xs={12} sm={6}>
            <TextField
              label="Country"
              fullWidth
              {...register('address.country')}
              error={!!errors.address?.country}
              helperText={errors.address?.country?.message}
            />
          </Grid>
        </Grid>
      </Card>

      <Card title="License Information" sx={{ mt: 3 }} loading={loading}>
        {/* LD1: Include license information section with dynamic form fields for multiple licenses */}
        {licenseInfo.map((license, index) => (
          <Box key={index} sx={{ mb: 2, border: '1px solid #ccc', p: 2, borderRadius: 1 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={4}>
                <TextField
                  label="License Type"
                  fullWidth
                  value={license.type}
                  onChange={(e) => {
                    const newLicenseInfo = [...licenseInfo];
                    newLicenseInfo[index].type = e.target.value;
                    setLicenseInfo(newLicenseInfo);
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="License Number"
                  fullWidth
                  value={license.number}
                   onChange={(e) => {
                    const newLicenseInfo = [...licenseInfo];
                    newLicenseInfo[index].number = e.target.value;
                    setLicenseInfo(newLicenseInfo);
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <DatePicker
                  label="Expiration Date"
                  value={license.expirationDate}
                  onChange={(date: any) => {
                    const newLicenseInfo = [...licenseInfo];
                    newLicenseInfo[index].expirationDate = date;
                    setLicenseInfo(newLicenseInfo);
                  }}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>
              <Grid item xs={12}>
                <IconButton onClick={() => removeLicense(index)}>
                  <DeleteIcon />
                </IconButton>
              </Grid>
            </Grid>
          </Box>
        ))}
        <ActionButton label="Add License" icon={<AddIcon />} onClick={addLicense} />
      </Card>

      {/* LD1: Display loading indicator during form submission */}
      {loading && (
        <Box display="flex" justifyContent="center" mt={2}>
          <CircularProgress />
        </Box>
      )}

      {/* LD1: Show success or error messages after submission */}
      {successMessage && (
        <Alert severity="success" sx={{ mt: 2 }}>
          {successMessage}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {/* LD1: Include Save button in form actions */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <ActionButton label="Save" type="submit" disabled={loading} />
      </Box>
    </form>
  );
};