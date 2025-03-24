import React, { useState } from 'react';
import { 
  Grid, 
  TextField, 
  MenuItem, 
  Button, 
  Box, 
  Typography, 
  Divider, 
  Tabs, 
  Tab 
} from '@mui/material';
import z from 'zod';

import { useForm } from '../../hooks/useForm';
import { ClientInfoFormProps } from '../../types/form.types';
import { 
  Client, 
  Gender, 
  ClientStatus, 
  CreateClientDto, 
  UpdateClientDto 
} from '../../types/clients.types';
import Card from '../ui/Card';
import { validateForm } from '../../utils/validation';

/**
 * Form component for creating and editing client information in the HCBS Revenue Management System.
 * Handles client demographic data, contact information, insurance details, and program enrollments
 * with comprehensive validation.
 */
const ClientInfoForm: React.FC<ClientInfoFormProps> = ({
  client,
  onSubmit,
  onCancel,
  loading = false,
  error
}) => {
  // Set up tab state for navigation between form sections
  const [activeTab, setActiveTab] = useState<number>(0);

  // Create validation schema using Zod
  const validationSchema = z.object({
    // Personal Information
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    middleName: z.string().nullable(),
    dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    gender: z.nativeEnum(Gender, { errorMap: () => ({ message: 'Please select a valid gender' }) }),
    medicaidId: z.string().nullable(),
    medicareId: z.string().nullable(),
    ssn: z.string().nullable(),
    status: z.nativeEnum(ClientStatus, { errorMap: () => ({ message: 'Please select a valid status' }) }),
    
    // Contact Information
    address: z.object({
      street1: z.string().min(1, 'Street address is required'),
      street2: z.string().nullable(),
      city: z.string().min(1, 'City is required'),
      state: z.string().min(1, 'State is required'),
      zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, 'Please enter a valid ZIP code'),
      country: z.string().min(1, 'Country is required')
    }),
    contactInfo: z.object({
      email: z.string().email('Please enter a valid email address').nullable(),
      phone: z.string().regex(/^(\+\d{1,2}\s)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/, 'Please enter a valid phone number').nullable(),
      alternatePhone: z.string().regex(/^(\+\d{1,2}\s)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/, 'Please enter a valid phone number').nullable(),
      fax: z.string().nullable()
    }),
    
    // Emergency Contact
    emergencyContact: z.object({
      name: z.string().min(1, 'Emergency contact name is required'),
      relationship: z.string().min(1, 'Relationship is required'),
      phone: z.string().regex(/^(\+\d{1,2}\s)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/, 'Please enter a valid phone number'),
      alternatePhone: z.string().regex(/^(\+\d{1,2}\s)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/, 'Please enter a valid phone number').nullable(),
      email: z.string().email('Please enter a valid email address').nullable()
    }).nullable(),
    
    // Additional fields
    notes: z.string().nullable(),
    
    // For editing mode, we'll need to handle programs and insurances separately
    programs: z.array(z.any()).optional(),
    insurances: z.array(z.any()).optional()
  });

  // Set up form using the custom useForm hook
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm({
    defaultValues: client || {
      firstName: '',
      lastName: '',
      middleName: '',
      dateOfBirth: '',
      gender: Gender.PREFER_NOT_TO_SAY,
      medicaidId: '',
      medicareId: '',
      ssn: '',
      status: ClientStatus.PENDING,
      address: {
        street1: '',
        street2: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'United States'
      },
      contactInfo: {
        email: '',
        phone: '',
        alternatePhone: '',
        fax: ''
      },
      emergencyContact: {
        name: '',
        relationship: '',
        phone: '',
        alternatePhone: '',
        email: ''
      },
      notes: '',
      programs: [],
      insurances: []
    },
    validationSchema
  });

  // Handle tab changes
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Handle form submission
  const handleFormSubmit = handleSubmit(async (data) => {
    await onSubmit(data);
  });

  // Handle cancel button click
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  // Get the current value of hasEmergencyContact for conditional rendering
  const hasEmergencyContact = !!watch('emergencyContact');

  return (
    <form onSubmit={handleFormSubmit} noValidate aria-label="Client information form">
      <Card>
        {/* Tab Navigation */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            aria-label="Client information tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="Personal Information" id="tab-0" aria-controls="tabpanel-0" />
            <Tab label="Contact Information" id="tab-1" aria-controls="tabpanel-1" />
            <Tab label="Insurance" id="tab-2" aria-controls="tabpanel-2" />
            <Tab label="Programs" id="tab-3" aria-controls="tabpanel-3" />
          </Tabs>
        </Box>

        {/* Display general form error */}
        {error && (
          <Box sx={{ mb: 3 }}>
            <Typography color="error">{error}</Typography>
          </Box>
        )}

        {/* Personal Information Tab */}
        <Box 
          role="tabpanel" 
          hidden={activeTab !== 0} 
          id="tabpanel-0" 
          aria-labelledby="tab-0"
        >
          {activeTab === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6">Personal Information</Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <TextField
                  {...register('firstName')}
                  label="First Name"
                  fullWidth
                  required
                  error={!!errors.firstName}
                  helperText={errors.firstName?.message}
                  disabled={loading}
                  inputProps={{
                    'aria-invalid': !!errors.firstName,
                    'aria-describedby': errors.firstName ? 'firstName-error' : undefined
                  }}
                />
                {errors.firstName && (
                  <span id="firstName-error" hidden>
                    {errors.firstName.message}
                  </span>
                )}
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <TextField
                  {...register('middleName')}
                  label="Middle Name"
                  fullWidth
                  error={!!errors.middleName}
                  helperText={errors.middleName?.message}
                  disabled={loading}
                  inputProps={{
                    'aria-invalid': !!errors.middleName,
                    'aria-describedby': errors.middleName ? 'middleName-error' : undefined
                  }}
                />
                {errors.middleName && (
                  <span id="middleName-error" hidden>
                    {errors.middleName.message}
                  </span>
                )}
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <TextField
                  {...register('lastName')}
                  label="Last Name"
                  fullWidth
                  required
                  error={!!errors.lastName}
                  helperText={errors.lastName?.message}
                  disabled={loading}
                  inputProps={{
                    'aria-invalid': !!errors.lastName,
                    'aria-describedby': errors.lastName ? 'lastName-error' : undefined
                  }}
                />
                {errors.lastName && (
                  <span id="lastName-error" hidden>
                    {errors.lastName.message}
                  </span>
                )}
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  {...register('dateOfBirth')}
                  label="Date of Birth"
                  type="date"
                  fullWidth
                  required
                  InputLabelProps={{ shrink: true }}
                  error={!!errors.dateOfBirth}
                  helperText={errors.dateOfBirth?.message}
                  disabled={loading}
                  inputProps={{
                    'aria-invalid': !!errors.dateOfBirth,
                    'aria-describedby': errors.dateOfBirth ? 'dateOfBirth-error' : undefined
                  }}
                />
                {errors.dateOfBirth && (
                  <span id="dateOfBirth-error" hidden>
                    {errors.dateOfBirth.message}
                  </span>
                )}
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  {...register('gender')}
                  select
                  label="Gender"
                  fullWidth
                  required
                  error={!!errors.gender}
                  helperText={errors.gender?.message}
                  disabled={loading}
                  inputProps={{
                    'aria-invalid': !!errors.gender,
                    'aria-describedby': errors.gender ? 'gender-error' : undefined
                  }}
                >
                  <MenuItem value={Gender.MALE}>Male</MenuItem>
                  <MenuItem value={Gender.FEMALE}>Female</MenuItem>
                  <MenuItem value={Gender.NON_BINARY}>Non-Binary</MenuItem>
                  <MenuItem value={Gender.OTHER}>Other</MenuItem>
                  <MenuItem value={Gender.PREFER_NOT_TO_SAY}>Prefer Not To Say</MenuItem>
                </TextField>
                {errors.gender && (
                  <span id="gender-error" hidden>
                    {errors.gender.message}
                  </span>
                )}
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <TextField
                  {...register('medicaidId')}
                  label="Medicaid ID"
                  fullWidth
                  error={!!errors.medicaidId}
                  helperText={errors.medicaidId?.message}
                  disabled={loading}
                  inputProps={{
                    'aria-invalid': !!errors.medicaidId,
                    'aria-describedby': errors.medicaidId ? 'medicaidId-error' : undefined
                  }}
                />
                {errors.medicaidId && (
                  <span id="medicaidId-error" hidden>
                    {errors.medicaidId.message}
                  </span>
                )}
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <TextField
                  {...register('medicareId')}
                  label="Medicare ID"
                  fullWidth
                  error={!!errors.medicareId}
                  helperText={errors.medicareId?.message}
                  disabled={loading}
                  inputProps={{
                    'aria-invalid': !!errors.medicareId,
                    'aria-describedby': errors.medicareId ? 'medicareId-error' : undefined
                  }}
                />
                {errors.medicareId && (
                  <span id="medicareId-error" hidden>
                    {errors.medicareId.message}
                  </span>
                )}
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <TextField
                  {...register('ssn')}
                  label="Social Security Number"
                  fullWidth
                  type="password"
                  autoComplete="off"
                  error={!!errors.ssn}
                  helperText={errors.ssn?.message}
                  disabled={loading}
                  inputProps={{
                    'aria-invalid': !!errors.ssn,
                    'aria-describedby': errors.ssn ? 'ssn-error' : undefined
                  }}
                />
                {errors.ssn && (
                  <span id="ssn-error" hidden>
                    {errors.ssn.message}
                  </span>
                )}
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  {...register('status')}
                  select
                  label="Status"
                  fullWidth
                  required
                  error={!!errors.status}
                  helperText={errors.status?.message}
                  disabled={loading}
                  inputProps={{
                    'aria-invalid': !!errors.status,
                    'aria-describedby': errors.status ? 'status-error' : undefined
                  }}
                >
                  <MenuItem value={ClientStatus.ACTIVE}>Active</MenuItem>
                  <MenuItem value={ClientStatus.INACTIVE}>Inactive</MenuItem>
                  <MenuItem value={ClientStatus.PENDING}>Pending</MenuItem>
                  <MenuItem value={ClientStatus.DISCHARGED}>Discharged</MenuItem>
                  <MenuItem value={ClientStatus.ON_HOLD}>On Hold</MenuItem>
                  <MenuItem value={ClientStatus.DECEASED}>Deceased</MenuItem>
                </TextField>
                {errors.status && (
                  <span id="status-error" hidden>
                    {errors.status.message}
                  </span>
                )}
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  {...register('notes')}
                  label="Notes"
                  fullWidth
                  multiline
                  rows={4}
                  error={!!errors.notes}
                  helperText={errors.notes?.message}
                  disabled={loading}
                  inputProps={{
                    'aria-invalid': !!errors.notes,
                    'aria-describedby': errors.notes ? 'notes-error' : undefined
                  }}
                />
                {errors.notes && (
                  <span id="notes-error" hidden>
                    {errors.notes.message}
                  </span>
                )}
              </Grid>
            </Grid>
          )}
        </Box>

        {/* Contact Information Tab */}
        <Box 
          role="tabpanel" 
          hidden={activeTab !== 1} 
          id="tabpanel-1" 
          aria-labelledby="tab-1"
        >
          {activeTab === 1 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6">Address</Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  {...register('address.street1')}
                  label="Street Address"
                  fullWidth
                  required
                  error={!!errors.address?.street1}
                  helperText={errors.address?.street1?.message}
                  disabled={loading}
                  inputProps={{
                    'aria-invalid': !!errors.address?.street1,
                    'aria-describedby': errors.address?.street1 ? 'street1-error' : undefined
                  }}
                />
                {errors.address?.street1 && (
                  <span id="street1-error" hidden>
                    {errors.address.street1.message}
                  </span>
                )}
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  {...register('address.street2')}
                  label="Apt/Suite/Unit"
                  fullWidth
                  error={!!errors.address?.street2}
                  helperText={errors.address?.street2?.message}
                  disabled={loading}
                  inputProps={{
                    'aria-invalid': !!errors.address?.street2,
                    'aria-describedby': errors.address?.street2 ? 'street2-error' : undefined
                  }}
                />
                {errors.address?.street2 && (
                  <span id="street2-error" hidden>
                    {errors.address.street2.message}
                  </span>
                )}
              </Grid>
              
              <Grid item xs={12} sm={5}>
                <TextField
                  {...register('address.city')}
                  label="City"
                  fullWidth
                  required
                  error={!!errors.address?.city}
                  helperText={errors.address?.city?.message}
                  disabled={loading}
                  inputProps={{
                    'aria-invalid': !!errors.address?.city,
                    'aria-describedby': errors.address?.city ? 'city-error' : undefined
                  }}
                />
                {errors.address?.city && (
                  <span id="city-error" hidden>
                    {errors.address.city.message}
                  </span>
                )}
              </Grid>
              
              <Grid item xs={12} sm={3}>
                <TextField
                  {...register('address.state')}
                  label="State"
                  fullWidth
                  required
                  error={!!errors.address?.state}
                  helperText={errors.address?.state?.message}
                  disabled={loading}
                  inputProps={{
                    'aria-invalid': !!errors.address?.state,
                    'aria-describedby': errors.address?.state ? 'state-error' : undefined
                  }}
                />
                {errors.address?.state && (
                  <span id="state-error" hidden>
                    {errors.address.state.message}
                  </span>
                )}
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <TextField
                  {...register('address.zipCode')}
                  label="ZIP Code"
                  fullWidth
                  required
                  error={!!errors.address?.zipCode}
                  helperText={errors.address?.zipCode?.message}
                  disabled={loading}
                  inputProps={{
                    'aria-invalid': !!errors.address?.zipCode,
                    'aria-describedby': errors.address?.zipCode ? 'zipCode-error' : undefined
                  }}
                />
                {errors.address?.zipCode && (
                  <span id="zipCode-error" hidden>
                    {errors.address.zipCode.message}
                  </span>
                )}
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  {...register('address.country')}
                  label="Country"
                  fullWidth
                  required
                  error={!!errors.address?.country}
                  helperText={errors.address?.country?.message}
                  disabled={loading}
                  defaultValue="United States"
                  inputProps={{
                    'aria-invalid': !!errors.address?.country,
                    'aria-describedby': errors.address?.country ? 'country-error' : undefined
                  }}
                />
                {errors.address?.country && (
                  <span id="country-error" hidden>
                    {errors.address.country.message}
                  </span>
                )}
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="h6">Contact Information</Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  {...register('contactInfo.email')}
                  label="Email"
                  type="email"
                  fullWidth
                  error={!!errors.contactInfo?.email}
                  helperText={errors.contactInfo?.email?.message}
                  disabled={loading}
                  inputProps={{
                    'aria-invalid': !!errors.contactInfo?.email,
                    'aria-describedby': errors.contactInfo?.email ? 'email-error' : undefined
                  }}
                />
                {errors.contactInfo?.email && (
                  <span id="email-error" hidden>
                    {errors.contactInfo.email.message}
                  </span>
                )}
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  {...register('contactInfo.phone')}
                  label="Phone Number"
                  fullWidth
                  error={!!errors.contactInfo?.phone}
                  helperText={errors.contactInfo?.phone?.message}
                  disabled={loading}
                  inputProps={{
                    'aria-invalid': !!errors.contactInfo?.phone,
                    'aria-describedby': errors.contactInfo?.phone ? 'phone-error' : undefined
                  }}
                />
                {errors.contactInfo?.phone && (
                  <span id="phone-error" hidden>
                    {errors.contactInfo.phone.message}
                  </span>
                )}
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  {...register('contactInfo.alternatePhone')}
                  label="Alternate Phone"
                  fullWidth
                  error={!!errors.contactInfo?.alternatePhone}
                  helperText={errors.contactInfo?.alternatePhone?.message}
                  disabled={loading}
                  inputProps={{
                    'aria-invalid': !!errors.contactInfo?.alternatePhone,
                    'aria-describedby': errors.contactInfo?.alternatePhone ? 'alternatePhone-error' : undefined
                  }}
                />
                {errors.contactInfo?.alternatePhone && (
                  <span id="alternatePhone-error" hidden>
                    {errors.contactInfo.alternatePhone.message}
                  </span>
                )}
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  {...register('contactInfo.fax')}
                  label="Fax"
                  fullWidth
                  error={!!errors.contactInfo?.fax}
                  helperText={errors.contactInfo?.fax?.message}
                  disabled={loading}
                  inputProps={{
                    'aria-invalid': !!errors.contactInfo?.fax,
                    'aria-describedby': errors.contactInfo?.fax ? 'fax-error' : undefined
                  }}
                />
                {errors.contactInfo?.fax && (
                  <span id="fax-error" hidden>
                    {errors.contactInfo.fax.message}
                  </span>
                )}
              </Grid>
              
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Emergency Contact</Typography>
                  <Button 
                    variant="text" 
                    onClick={() => setValue('emergencyContact', hasEmergencyContact ? null : {
                      name: '',
                      relationship: '',
                      phone: '',
                      alternatePhone: '',
                      email: ''
                    })}
                    sx={{ ml: 2 }}
                  >
                    {hasEmergencyContact ? 'Remove' : 'Add'} Emergency Contact
                  </Button>
                </Box>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              
              {hasEmergencyContact && (
                <>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      {...register('emergencyContact.name')}
                      label="Contact Name"
                      fullWidth
                      required
                      error={!!errors.emergencyContact?.name}
                      helperText={errors.emergencyContact?.name?.message}
                      disabled={loading}
                      inputProps={{
                        'aria-invalid': !!errors.emergencyContact?.name,
                        'aria-describedby': errors.emergencyContact?.name ? 'emergencyName-error' : undefined
                      }}
                    />
                    {errors.emergencyContact?.name && (
                      <span id="emergencyName-error" hidden>
                        {errors.emergencyContact.name.message}
                      </span>
                    )}
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      {...register('emergencyContact.relationship')}
                      label="Relationship"
                      fullWidth
                      required
                      error={!!errors.emergencyContact?.relationship}
                      helperText={errors.emergencyContact?.relationship?.message}
                      disabled={loading}
                      inputProps={{
                        'aria-invalid': !!errors.emergencyContact?.relationship,
                        'aria-describedby': errors.emergencyContact?.relationship ? 'emergencyRelationship-error' : undefined
                      }}
                    />
                    {errors.emergencyContact?.relationship && (
                      <span id="emergencyRelationship-error" hidden>
                        {errors.emergencyContact.relationship.message}
                      </span>
                    )}
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      {...register('emergencyContact.phone')}
                      label="Phone Number"
                      fullWidth
                      required
                      error={!!errors.emergencyContact?.phone}
                      helperText={errors.emergencyContact?.phone?.message}
                      disabled={loading}
                      inputProps={{
                        'aria-invalid': !!errors.emergencyContact?.phone,
                        'aria-describedby': errors.emergencyContact?.phone ? 'emergencyPhone-error' : undefined
                      }}
                    />
                    {errors.emergencyContact?.phone && (
                      <span id="emergencyPhone-error" hidden>
                        {errors.emergencyContact.phone.message}
                      </span>
                    )}
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      {...register('emergencyContact.email')}
                      label="Email"
                      type="email"
                      fullWidth
                      error={!!errors.emergencyContact?.email}
                      helperText={errors.emergencyContact?.email?.message}
                      disabled={loading}
                      inputProps={{
                        'aria-invalid': !!errors.emergencyContact?.email,
                        'aria-describedby': errors.emergencyContact?.email ? 'emergencyEmail-error' : undefined
                      }}
                    />
                    {errors.emergencyContact?.email && (
                      <span id="emergencyEmail-error" hidden>
                        {errors.emergencyContact.email.message}
                      </span>
                    )}
                  </Grid>
                </>
              )}
            </Grid>
          )}
        </Box>

        {/* Insurance Tab */}
        <Box 
          role="tabpanel" 
          hidden={activeTab !== 2} 
          id="tabpanel-2" 
          aria-labelledby="tab-2"
        >
          {activeTab === 2 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6">Insurance Information</Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  Insurance information can be managed after the client has been created. Once the client record exists in the system, you can add multiple insurance policies, update coverage details, and manage primary/secondary designations.
                </Typography>
                
                <Typography variant="body2" color="text.secondary">
                  For new clients, please complete the Personal Information and Contact Information sections first, then save the client record. You will then be able to add insurance details from the client details page.
                </Typography>
              </Grid>
            </Grid>
          )}
        </Box>

        {/* Programs Tab */}
        <Box 
          role="tabpanel" 
          hidden={activeTab !== 3} 
          id="tabpanel-3" 
          aria-labelledby="tab-3"
        >
          {activeTab === 3 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6">Program Enrollment</Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  Program enrollment can be managed after the client has been created. Once the client record exists in the system, you can enroll them in various programs, specify start and end dates, and track program-specific information.
                </Typography>
                
                <Typography variant="body2" color="text.secondary">
                  For new clients, please complete the Personal Information and Contact Information sections first, then save the client record. You will then be able to manage program enrollments from the client details page.
                </Typography>
              </Grid>
            </Grid>
          )}
        </Box>

        {/* Form Actions */}
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={handleCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading}
          >
            {loading ? 'Saving...' : (client ? 'Update Client' : 'Create Client')}
          </Button>
        </Box>
      </Card>
    </form>
  );
};

export default ClientInfoForm;