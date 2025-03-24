import React, { useState, useCallback, useEffect } from 'react'; // react v18.0.0
import {
  TextField,
  Grid,
  Button,
  Typography,
  Divider,
  Box,
  CircularProgress,
  FormHelperText,
  InputAdornment,
  IconButton
} from '@mui/material'; // v5.13+
import { Add, Delete, Upload } from '@mui/icons-material'; // v5.13+
import { DatePicker } from '@mui/x-date-pickers'; // v6.0+
import { z } from 'zod'; // ^3.21.0

import Card from '../ui/Card';
import useForm from '../../hooks/useForm';
import useSettings from '../../hooks/useSettings';
import { OrganizationSettings, UpdateOrganizationSettingsDto } from '../../types/settings.types';
import { Address, ContactInfo, LoadingState } from '../../types/common.types';
import useToast from '../../hooks/useToast';

interface OrganizationFormProps {
  onSuccess?: () => void;
}

/**
 * A form component for managing organization settings.
 * Allows administrators to update organization information, branding settings, contact information, and license information.
 *
 * @param {OrganizationFormProps} props - The component props, including an optional onSuccess callback.
 * @returns {JSX.Element} The rendered organization form component.
 */
const OrganizationForm: React.FC<OrganizationFormProps> = ({ onSuccess }) => {
  // Access organization settings data and functions using the useSettings hook
  const { organizationSettings, updateOrganizationSettings, loading, error, fetchOrganizationSettings } = useSettings();

  // Initialize the form using useForm with a validation schema
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    control,
    watch,
    setValue
  } = useForm<UpdateOrganizationSettingsDto>({
    validationSchema: z.object({
      name: z.string().min(2, { message: "Organization name must be at least 2 characters" }),
      legalName: z.string().optional(),
      taxId: z.string().optional(),
      npi: z.string().optional(),
      medicaidId: z.string().optional(),
      address: z.object({
        street1: z.string().min(2, { message: "Street address is required" }),
        street2: z.string().optional(),
        city: z.string().min(2, { message: "City is required" }),
        state: z.string().min(2, { message: "State is required" }),
        zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, { message: "Invalid zip code" }),
        country: z.string().optional(),
      }),
      contactInfo: z.object({
        email: z.string().email({ message: "Invalid email address" }).optional(),
        phone: z.string().optional(),
        alternatePhone: z.string().optional(),
        fax: z.string().optional(),
      }),
      logo: z.string().optional(),
      primaryColor: z.string().optional(),
      secondaryColor: z.string().optional(),
      licenseInfo: z.array(
        z.object({
          type: z.string().optional(),
          number: z.string().optional(),
          expirationDate: z.string().optional(),
        })
      ).optional(),
    }),
  });

  // Set up toast notifications using useToast
  const toast = useToast();

  // Fetch organization settings on component mount
  useEffect(() => {
    fetchOrganizationSettings();
  }, [fetchOrganizationSettings]);

  // Set form default values when organization settings are loaded
  useEffect(() => {
    if (organizationSettings) {
      reset(organizationSettings);
    }
  }, [organizationSettings, reset]);

  /**
   * Handles the form submission.
   * Calls updateOrganizationSettings with the form data, shows a success toast notification on successful update,
   * calls the onSuccess callback if provided, and handles errors by showing an error toast notification.
   *
   * @param {UpdateOrganizationSettingsDto} formData - The form data to submit.
   * @returns {Promise<void>} A promise that resolves when the submission is complete.
   */
  const handleSubmitForm = useCallback(async (formData: UpdateOrganizationSettingsDto) => {
    try {
      await updateOrganizationSettings(formData);
      toast.success('Organization settings updated successfully!');
      onSuccess?.();
    } catch (e: any) {
      toast.error(e.message || 'Failed to update organization settings.');
    }
  }, [updateOrganizationSettings, toast, onSuccess]);

  /**
   * Adds a new empty license to the licenses array.
   */
  const addLicense = useCallback(() => {
    const licenses = watch('licenseInfo') || [];
    setValue('licenseInfo', [...licenses, { type: '', number: '', expirationDate: '' }]);
  }, [setValue, watch]);

  /**
   * Removes a license at the specified index.
   *
   * @param {number} index - The index of the license to remove.
   */
  const removeLicense = useCallback((index: number) => {
    const licenses = watch('licenseInfo') || [];
    const updatedLicenses = licenses.filter((_, i) => i !== index);
    setValue('licenseInfo', updatedLicenses);
  }, [setValue, watch]);

  /**
   * Handles logo file upload.
   *
   * @param {React.ChangeEvent<HTMLInputElement>} event - The file input change event.
   */
  const handleLogoUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }

    const file = files[0];

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setValue('logo', base64String);
    };
    reader.onerror = () => {
      toast.error('Failed to read the file.');
    };
    reader.readAsDataURL(file);
  }, [setValue, toast]);

  return (
    <Card title="Organization Settings" loading={loading === LoadingState.LOADING}>
      <form onSubmit={handleSubmit(handleSubmitForm)}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h6">Organization Information</Typography>
            <Divider />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Organization Name"
              fullWidth
              {...register("name")}
              error={!!errors.name}
              helperText={errors.name?.message}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Legal Name"
              fullWidth
              {...register("legalName")}
              error={!!errors.legalName}
              helperText={errors.legalName?.message}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Tax ID"
              fullWidth
              {...register("taxId")}
              error={!!errors.taxId}
              helperText={errors.taxId?.message}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="NPI"
              fullWidth
              {...register("npi")}
              error={!!errors.npi}
              helperText={errors.npi?.message}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Medicaid ID"
              fullWidth
              {...register("medicaidId")}
              error={!!errors.medicaidId}
              helperText={errors.medicaidId?.message}
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="h6">Address</Typography>
            <Divider />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Street Address"
              fullWidth
              {...register("address.street1")}
              error={!!errors.address?.street1}
              helperText={errors.address?.street1?.message}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Street Address 2"
              fullWidth
              {...register("address.street2")}
              error={!!errors.address?.street2}
              helperText={errors.address?.street2?.message}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              label="City"
              fullWidth
              {...register("address.city")}
              error={!!errors.address?.city}
              helperText={errors.address?.city?.message}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              label="State"
              fullWidth
              {...register("address.state")}
              error={!!errors.address?.state}
              helperText={errors.address?.state?.message}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              label="Zip Code"
              fullWidth
              {...register("address.zipCode")}
              error={!!errors.address?.zipCode}
              helperText={errors.address?.zipCode?.message}
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="h6">Contact Information</Typography>
            <Divider />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Email"
              fullWidth
              {...register("contactInfo.email")}
              error={!!errors.contactInfo?.email}
              helperText={errors.contactInfo?.email?.message}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Phone"
              fullWidth
              {...register("contactInfo.phone")}
              error={!!errors.contactInfo?.phone}
              helperText={errors.contactInfo?.phone?.message}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Alternate Phone"
              fullWidth
              {...register("contactInfo.alternatePhone")}
              error={!!errors.contactInfo?.alternatePhone}
              helperText={errors.contactInfo?.alternatePhone?.message}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Fax"
              fullWidth
              {...register("contactInfo.fax")}
              error={!!errors.contactInfo?.fax}
              helperText={errors.contactInfo?.fax?.message}
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="h6">Branding</Typography>
            <Divider />
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Button
                variant="outlined"
                component="label"
              >
                Upload Logo
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleLogoUpload}
                />
              </Button>
              {watch('logo') && <Typography sx={{ ml: 2 }}>Logo Uploaded</Typography>}
            </Box>
            {errors.logo && <FormHelperText error>{errors.logo.message}</FormHelperText>}
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Primary Color"
              fullWidth
              {...register("primaryColor")}
              error={!!errors.primaryColor}
              helperText={errors.primaryColor?.message}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Secondary Color"
              fullWidth
              {...register("secondaryColor")}
              error={!!errors.secondaryColor}
              helperText={errors.secondaryColor?.message}
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="h6">Licenses</Typography>
            <Divider />
          </Grid>

          {watch('licenseInfo')?.map((license, index) => (
            <React.Fragment key={index}>
              <Grid item xs={12} md={4}>
                <TextField
                  label={`License Type ${index + 1}`}
                  fullWidth
                  {...register(`licenseInfo.${index}.type`)}
                  error={!!errors.licenseInfo?.[index]?.type}
                  helperText={errors.licenseInfo?.[index]?.type?.message}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label={`License Number ${index + 1}`}
                  fullWidth
                  {...register(`licenseInfo.${index}.number`)}
                  error={!!errors.licenseInfo?.[index]?.number}
                  helperText={errors.licenseInfo?.[index]?.number?.message}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <DatePicker
                  label={`Expiration Date ${index + 1}`}
                  control={control}
                  name={`licenseInfo.${index}.expirationDate`}
                  error={!!errors.licenseInfo?.[index]?.expirationDate}
                  helperText={errors.licenseInfo?.[index]?.expirationDate?.message}
                />
              </Grid>
              <Grid item xs={12} md={1} sx={{ display: 'flex', alignItems: 'center' }}>
                <IconButton onClick={() => removeLicense(index)}>
                  <Delete />
                </IconButton>
              </Grid>
            </React.Fragment>
          ))}

          <Grid item xs={12}>
            <Button startIcon={<Add />} onClick={addLicense}>Add License</Button>
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button variant="contained" type="submit" disabled={isSubmitting}>
                {isSubmitting ? <CircularProgress size={24} sx={{ mr: 1 }} /> : null}
                Save
              </Button>
              <Button variant="outlined" onClick={() => reset(organizationSettings)}>
                Reset
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Card>
  );
};

export default OrganizationForm;