import React, { useState, useEffect, useMemo } from 'react'; // v18.2.0
import { z } from 'zod'; // v3.21.0
import { 
  Grid, 
  TextField, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  Select, 
  FormHelperText, 
  Button, 
  Divider, 
  Typography, 
  Box,
  Tabs,
  Tab,
  IconButton
} from '@mui/material'; // v5.13.0
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material'; // v5.13.0

import Card from '../ui/Card';
import useForm from '../../hooks/useForm';
import { 
  Client, 
  CreateClientDto, 
  UpdateClientDto, 
  Gender, 
  ClientStatus, 
  InsuranceType, 
  ClientProgram, 
  ClientInsurance 
} from '../../types/clients.types';
import { ClientInfoFormProps } from '../../types/form.types';
import { Address, ContactInfo, Status, SelectOption } from '../../types/common.types';
import { validators } from '../../utils/validation';
import useClients from '../../hooks/useClients';

/**
 * Creates a Zod validation schema for client form data
 * @returns {z.ZodObject} Zod schema for client form validation
 */
const createClientValidationSchema = () => {
  // Define validation schema for client personal information
  const personalInfoSchema = z.object({
    firstName: z.string().min(2, { message: 'First name must be at least 2 characters' }),
    lastName: z.string().min(2, { message: 'Last name must be at least 2 characters' }),
    middleName: z.string().optional(),
    dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Invalid date format' }),
    gender: z.enum([Gender.MALE, Gender.FEMALE, Gender.NON_BINARY, Gender.OTHER, Gender.PREFER_NOT_TO_SAY]),
    medicaidId: z.string().optional(),
    medicareId: z.string().optional(),
    ssn: z.string().optional(),
    status: z.enum([ClientStatus.ACTIVE, ClientStatus.INACTIVE, ClientStatus.PENDING, ClientStatus.DISCHARGED, ClientStatus.ON_HOLD, ClientStatus.DECEASED]),
    notes: z.string().optional(),
  });

  // Define validation schema for client address
  const addressSchema = z.object({
    street1: z.string().min(2, { message: 'Street address is required' }),
    street2: z.string().optional(),
    city: z.string().min(2, { message: 'City is required' }),
    state: z.string().min(2, { message: 'State is required' }),
    zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, { message: 'Invalid zip code' }),
    country: z.string().min(2, { message: 'Country is required' }),
  });

  // Define validation schema for client contact information
  const contactInfoSchema = z.object({
    email: z.string().email({ message: 'Invalid email address' }).optional(),
    phone: z.string().regex(/^(\+\d{1,2}\s)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/, { message: 'Invalid phone number' }).optional(),
    alternatePhone: z.string().regex(/^(\+\d{1,2}\s)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/, { message: 'Invalid phone number' }).optional(),
    fax: z.string().regex(/^(\+\d{1,2}\s)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/, { message: 'Invalid fax number' }).optional(),
  });

  // Define validation schema for emergency contact information
  const emergencyContactSchema = z.object({
    name: z.string().min(2, { message: 'Emergency contact name is required' }).optional(),
    relationship: z.string().min(2, { message: 'Emergency contact relationship is required' }).optional(),
    phone: z.string().regex(/^(\+\d{1,2}\s)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/, { message: 'Invalid emergency contact phone number' }).optional(),
    alternatePhone: z.string().regex(/^(\+\d{1,2}\s)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/, { message: 'Invalid emergency contact alternate phone number' }).optional(),
    email: z.string().email({ message: 'Invalid emergency contact email address' }).optional(),
  });

  // Define validation schema for program enrollments
  const programEnrollmentSchema = z.object({
    programId: z.string().uuid({ message: 'Invalid program ID' }),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Invalid date format' }),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Invalid date format' }).nullable(),
    status: z.enum([Status.ACTIVE, Status.INACTIVE, Status.PENDING, Status.DELETED]),
    notes: z.string().optional(),
  });

  // Define validation schema for insurance information
  const insuranceSchema = z.object({
    type: z.enum([InsuranceType.MEDICAID, InsuranceType.MEDICARE, InsuranceType.PRIVATE, InsuranceType.SELF_PAY, InsuranceType.OTHER]),
    payerId: z.string().uuid({ message: 'Invalid payer ID' }).nullable(),
    policyNumber: z.string().min(2, { message: 'Policy number is required' }),
    groupNumber: z.string().optional().nullable(),
    subscriberName: z.string().optional().nullable(),
    subscriberRelationship: z.string().optional().nullable(),
    effectiveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Invalid date format' }),
    terminationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Invalid date format' }).nullable(),
    isPrimary: z.boolean(),
    status: z.enum([Status.ACTIVE, Status.INACTIVE, Status.PENDING, Status.DELETED]),
  });

  // Combine all schemas into a complete client validation schema
  return z.object({
    ...personalInfoSchema.shape,
    address: addressSchema,
    contactInfo: contactInfoSchema,
    emergencyContact: emergencyContactSchema.optional(),
    programs: z.array(programEnrollmentSchema).optional(),
    insurances: z.array(insuranceSchema).optional(),
  });
};

/**
 * Form component for creating and editing client information
 * @param {ClientInfoFormProps} props
 * @returns {JSX.Element} Rendered client form component
 */
const ClientForm: React.FC<ClientInfoFormProps> = (props) => {
  // Destructure props to extract client data, submission handler, and loading state
  const { client, onSubmit, onCancel, loading, error } = props;

  // Initialize form state using useForm hook with client data and validation schema
  const validationSchema = useMemo(() => createClientValidationSchema(), []);
  const { 
    register, 
    handleSubmit, 
    reset, 
    formState: { errors },
    control
  } = useForm({
    defaultValues: mapClientToFormData(client),
    validationSchema: validationSchema
  });

  // Set up state for managing program enrollments and insurance information
  const [programs, setPrograms] = useState<ClientProgram[]>(client?.programs || []);
  const [insurances, setInsurances] = useState<ClientInsurance[]>(client?.insurances || []);

  // Create handlers for adding, updating, and removing program enrollments
  const handleAddProgram = () => {
    setPrograms([...programs, {
      id: 'new-' + Date.now(), // Temporary ID
      clientId: client?.id || '',
      programId: '',
      program: { id: '', name: '', code: '' },
      startDate: '',
      endDate: null,
      status: Status.ACTIVE,
      notes: null,
    } as any]);
  };

  const handleUpdateProgram = (index: number, field: string, value: any) => {
    const newPrograms = [...programs];
    newPrograms[index][field] = value;
    setPrograms(newPrograms);
  };

  const handleRemoveProgram = (index: number) => {
    const newPrograms = [...programs];
    newPrograms.splice(index, 1);
    setPrograms(newPrograms);
  };

  // Create handlers for adding, updating, and removing insurance information
  const handleAddInsurance = () => {
    setInsurances([...insurances, {
      id: 'new-' + Date.now(), // Temporary ID
      clientId: client?.id || '',
      type: InsuranceType.MEDICAID,
      payerId: null,
      payer: null,
      policyNumber: '',
      groupNumber: null,
      subscriberName: null,
      subscriberRelationship: null,
      effectiveDate: '',
      terminationDate: null,
      isPrimary: false,
      status: Status.ACTIVE,
    } as any]);
  };

  const handleUpdateInsurance = (index: number, field: string, value: any) => {
    const newInsurances = [...insurances];
    newInsurances[index][field] = value;
    setInsurances(newInsurances);
  };

  const handleRemoveInsurance = (index: number) => {
    const newInsurances = [...insurances];
    newInsurances.splice(index, 1);
    setInsurances(newInsurances);
  };

    // Set up state for managing form tabs
    const [activeTab, setActiveTab] = useState('personal');

    // Create handlers for form tab navigation
    const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
        setActiveTab(newValue);
    };

  // Set up form submission handler that validates and submits the form data
  const onSubmitHandler = handleSubmit((data) => {
    const clientDto = mapFormDataToClientDto(data, !!client);
    onSubmit(clientDto);
  });

  // Render form with multiple sections (personal info, address, contact, programs, insurance)
  return (
    <form onSubmit={onSubmitHandler}>
      <Card title="Client Information" loading={loading}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={activeTab} onChange={handleTabChange} aria-label="client form tabs">
                    <Tab label="Personal Info" value="personal" />
                    <Tab label="Address" value="address" />
                    <Tab label="Contact" value="contact" />
                    <Tab label="Programs" value="programs" />
                    <Tab label="Insurance" value="insurance" />
                </Tabs>
            </Box>
        {activeTab === 'personal' && (
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="First Name"
                  fullWidth
                  {...register("firstName")}
                  error={!!errors.firstName}
                  helperText={errors.firstName?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Last Name"
                  fullWidth
                  {...register("lastName")}
                  error={!!errors.lastName}
                  helperText={errors.lastName?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Middle Name"
                  fullWidth
                  {...register("middleName")}
                  error={!!errors.middleName}
                  helperText={errors.middleName?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Date of Birth"
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  {...register("dateOfBirth")}
                  error={!!errors.dateOfBirth}
                  helperText={errors.dateOfBirth?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={!!errors.gender}>
                  <InputLabel id="gender-label">Gender</InputLabel>
                  <Select labelId="gender-label" label="Gender" {...register("gender")}>
                    <MenuItem value={Gender.MALE}>Male</MenuItem>
                    <MenuItem value={Gender.FEMALE}>Female</MenuItem>
                    <MenuItem value={Gender.NON_BINARY}>Non-Binary</MenuItem>
                    <MenuItem value={Gender.OTHER}>Other</MenuItem>
                    <MenuItem value={Gender.PREFER_NOT_TO_SAY}>Prefer Not to Say</MenuItem>
                  </Select>
                  <FormHelperText>{errors.gender?.message}</FormHelperText>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Medicaid ID"
                  fullWidth
                  {...register("medicaidId")}
                  error={!!errors.medicaidId}
                  helperText={errors.medicaidId?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Medicare ID"
                  fullWidth
                  {...register("medicareId")}
                  error={!!errors.medicareId}
                  helperText={errors.medicareId?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="SSN"
                  fullWidth
                  {...register("ssn")}
                  error={!!errors.ssn}
                  helperText={errors.ssn?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={!!errors.status}>
                  <InputLabel id="status-label">Status</InputLabel>
                  <Select labelId="status-label" label="Status" {...register("status")}>
                    <MenuItem value={ClientStatus.ACTIVE}>Active</MenuItem>
                    <MenuItem value={ClientStatus.INACTIVE}>Inactive</MenuItem>
                    <MenuItem value={ClientStatus.PENDING}>Pending</MenuItem>
                    <MenuItem value={ClientStatus.DISCHARGED}>Discharged</MenuItem>
                    <MenuItem value={ClientStatus.ON_HOLD}>On Hold</MenuItem>
                    <MenuItem value={ClientStatus.DECEASED}>Deceased</MenuItem>
                  </Select>
                  <FormHelperText>{errors.status?.message}</FormHelperText>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Notes"
                  multiline
                  rows={4}
                  fullWidth
                  {...register("notes")}
                  error={!!errors.notes}
                  helperText={errors.notes?.message}
                />
              </Grid>
            </Grid>
          </Box>
        )}

        {activeTab === 'address' && (
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Street Address 1"
                  fullWidth
                  {...register("address.street1")}
                  error={!!errors.address?.street1}
                  helperText={errors.address?.street1?.message}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Street Address 2"
                  fullWidth
                  {...register("address.street2")}
                  error={!!errors.address?.street2}
                  helperText={errors.address?.street2?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="City"
                  fullWidth
                  {...register("address.city")}
                  error={!!errors.address?.city}
                  helperText={errors.address?.city?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="State"
                  fullWidth
                  {...register("address.state")}
                  error={!!errors.address?.state}
                  helperText={errors.address?.state?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Zip Code"
                  fullWidth
                  {...register("address.zipCode")}
                  error={!!errors.address?.zipCode}
                  helperText={errors.address?.zipCode?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Country"
                  fullWidth
                  {...register("address.country")}
                  error={!!errors.address?.country}
                  helperText={errors.address?.country?.message}
                />
              </Grid>
            </Grid>
          </Box>
        )}

        {activeTab === 'contact' && (
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Email"
                  fullWidth
                  {...register("contactInfo.email")}
                  error={!!errors.contactInfo?.email}
                  helperText={errors.contactInfo?.email?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Phone"
                  fullWidth
                  {...register("contactInfo.phone")}
                  error={!!errors.contactInfo?.phone}
                  helperText={errors.contactInfo?.phone?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Alternate Phone"
                  fullWidth
                  {...register("contactInfo.alternatePhone")}
                  error={!!errors.contactInfo?.alternatePhone}
                  helperText={errors.contactInfo?.alternatePhone?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Fax"
                  fullWidth
                  {...register("contactInfo.fax")}
                  error={!!errors.contactInfo?.fax}
                  helperText={errors.contactInfo?.fax?.message}
                />
              </Grid>
            </Grid>
          </Box>
        )}

        {activeTab === 'programs' && (
          <Box sx={{ mt: 2 }}>
            {programs.map((program, index) => (
              <Card key={program.id} title={`Program Enrollment #${index + 1}`} sx={{ mb: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Program ID"
                      fullWidth
                      value={program.programId}
                      onChange={(e) => handleUpdateProgram(index, 'programId', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Start Date"
                      type="date"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      value={program.startDate}
                      onChange={(e) => handleUpdateProgram(index, 'startDate', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="End Date"
                      type="date"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      value={program.endDate || ''}
                      onChange={(e) => handleUpdateProgram(index, 'endDate', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel id={`program-status-label-${index}`}>Status</InputLabel>
                      <Select
                        labelId={`program-status-label-${index}`}
                        label="Status"
                        value={program.status}
                        onChange={(e) => handleUpdateProgram(index, 'status', e.target.value)}
                      >
                        <MenuItem value={Status.ACTIVE}>Active</MenuItem>
                        <MenuItem value={Status.INACTIVE}>Inactive</MenuItem>
                        <MenuItem value={Status.PENDING}>Pending</MenuItem>
                        <MenuItem value={Status.DELETED}>Deleted</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Notes"
                      multiline
                      rows={4}
                      fullWidth
                      value={program.notes || ''}
                      onChange={(e) => handleUpdateProgram(index, 'notes', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sx={{ textAlign: 'right' }}>
                    <IconButton onClick={() => handleRemoveProgram(index)}>
                      <DeleteIcon />
                    </IconButton>
                  </Grid>
                </Grid>
              </Card>
            ))}
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddProgram}>
              Add Program
            </Button>
          </Box>
        )}

        {activeTab === 'insurance' && (
          <Box sx={{ mt: 2 }}>
            {insurances.map((insurance, index) => (
              <Card key={insurance.id} title={`Insurance #${index + 1}`} sx={{ mb: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel id={`insurance-type-label-${index}`}>Insurance Type</InputLabel>
                      <Select
                        labelId={`insurance-type-label-${index}`}
                        label="Insurance Type"
                        value={insurance.type}
                        onChange={(e) => handleUpdateInsurance(index, 'type', e.target.value)}
                      >
                        <MenuItem value={InsuranceType.MEDICAID}>Medicaid</MenuItem>
                        <MenuItem value={InsuranceType.MEDICARE}>Medicare</MenuItem>
                        <MenuItem value={InsuranceType.PRIVATE}>Private</MenuItem>
                        <MenuItem value={InsuranceType.SELF_PAY}>Self Pay</MenuItem>
                        <MenuItem value={InsuranceType.OTHER}>Other</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Payer ID"
                      fullWidth
                      value={insurance.payerId || ''}
                      onChange={(e) => handleUpdateInsurance(index, 'payerId', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Policy Number"
                      fullWidth
                      value={insurance.policyNumber}
                      onChange={(e) => handleUpdateInsurance(index, 'policyNumber', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Group Number"
                      fullWidth
                      value={insurance.groupNumber || ''}
                      onChange={(e) => handleUpdateInsurance(index, 'groupNumber', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Subscriber Name"
                      fullWidth
                      value={insurance.subscriberName || ''}
                      onChange={(e) => handleUpdateInsurance(index, 'subscriberName', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Subscriber Relationship"
                      fullWidth
                      value={insurance.subscriberRelationship || ''}
                      onChange={(e) => handleUpdateInsurance(index, 'subscriberRelationship', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Effective Date"
                      type="date"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      value={insurance.effectiveDate}
                      onChange={(e) => handleUpdateInsurance(index, 'effectiveDate', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Termination Date"
                      type="date"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      value={insurance.terminationDate || ''}
                      onChange={(e) => handleUpdateInsurance(index, 'terminationDate', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel id={`insurance-status-label-${index}`}>Status</InputLabel>
                      <Select
                        labelId={`insurance-status-label-${index}`}
                        label="Status"
                        value={insurance.status}
                        onChange={(e) => handleUpdateInsurance(index, 'status', e.target.value)}
                      >
                        <MenuItem value={Status.ACTIVE}>Active</MenuItem>
                        <MenuItem value={Status.INACTIVE}>Inactive</MenuItem>
                        <MenuItem value={Status.PENDING}>Pending</MenuItem>
                        <MenuItem value={Status.DELETED}>Deleted</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel id={`insurance-isPrimary-label-${index}`}>Is Primary</InputLabel>
                      <Select
                        labelId={`insurance-isPrimary-label-${index}`}
                        label="Is Primary"
                        value={insurance.isPrimary}
                        onChange={(e) => handleUpdateInsurance(index, 'isPrimary', e.target.value === 'true')}
                      >
                        <MenuItem value={true}>Yes</MenuItem>
                        <MenuItem value={false}>No</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sx={{ textAlign: 'right' }}>
                    <IconButton onClick={() => handleRemoveInsurance(index)}>
                      <DeleteIcon />
                    </IconButton>
                  </Grid>
                </Grid>
              </Card>
            ))}
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddInsurance}>
              Add Insurance
            </Button>
          </Box>
        )}
        <Divider sx={{ my: 2 }} />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button onClick={onCancel}>Cancel</Button>
          <Button type="submit" variant="contained">
            Submit
          </Button>
        </Box>
      </Card>
    </form>
  );
};

/**
 * Maps client data to form data structure
 * @param {Client | null} client
 * @returns {Record<string, any>} Form data structure for the client form
 */
const mapClientToFormData = (client: Client | null): Record<string, any> => {
  // Check if client is null, return empty form data if true
  if (!client) {
    return {
      firstName: '',
      lastName: '',
      middleName: '',
      dateOfBirth: '',
      gender: Gender.PREFER_NOT_TO_SAY,
      medicaidId: '',
      medicareId: '',
      ssn: '',
      address: {
        street1: '',
        street2: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
      },
      contactInfo: {
        email: '',
        phone: '',
        alternatePhone: '',
        fax: '',
      },
      programs: [],
      insurances: [],
      notes: '',
      status: ClientStatus.ACTIVE,
    };
  }

  // Extract personal information from client
  const { 
    firstName, 
    lastName, 
    middleName, 
    dateOfBirth, 
    gender, 
    medicaidId, 
    medicareId, 
    ssn, 
    status, 
    notes 
  } = client;

  // Extract address information from client
  const { address } = client;

  // Extract contact information from client
  const { contactInfo } = client;

  // Extract emergency contact information from client
  const { emergencyContact } = client;

  // Extract program enrollments from client
  const { programs } = client;

  // Extract insurance information from client
  const { insurances } = client;

  // Return structured form data object
  return {
    firstName,
    lastName,
    middleName,
    dateOfBirth,
    gender,
    medicaidId,
    medicareId,
    ssn,
    address,
    contactInfo,
    emergencyContact,
    programs,
    insurances,
    notes,
    status,
  };
};

/**
 * Maps form data to client DTO for API submission
 * @param {Record<string, any>} formData
 * @param {boolean} isUpdate
 * @returns {CreateClientDto | UpdateClientDto} Client DTO for API submission
 */
const mapFormDataToClientDto = (formData: Record<string, any>, isUpdate: boolean): CreateClientDto | UpdateClientDto => {
  // Extract form data fields
  const { 
    firstName, 
    lastName, 
    middleName, 
    dateOfBirth, 
    gender, 
    medicaidId, 
    medicareId, 
    ssn, 
    address, 
    contactInfo, 
    emergencyContact, 
    notes, 
    status 
  } = formData;

  // Structure data according to API DTO requirements
  const clientDto = {
    firstName,
    lastName,
    middleName,
    dateOfBirth,
    gender,
    medicaidId,
    medicareId,
    ssn,
    address,
    contactInfo,
    emergencyContact,
    notes,
    status,
  };

  // Handle differences between create and update DTOs
  if (isUpdate) {
    return clientDto as UpdateClientDto;
  } else {
    return {
      ...clientDto,
      programs: [],
      insurances: [],
    } as CreateClientDto;
  }
};

export default ClientForm;