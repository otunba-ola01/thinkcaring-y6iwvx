import React, { useState, useEffect, useRef } from 'react'; // react v18.2.0
import { NextPage } from 'next'; // next v13.4+
import Head from 'next/head'; // next/head v13.4+
import { useRouter } from 'next/router'; // next/router v13.4+
import { useForm, Controller } from 'react-hook-form'; // react-hook-form v7.45+
import { zodResolver } from '@hookform/resolvers/zod'; // @hookform/resolvers/zod v3.1+
import { z } from 'zod'; // zod v3.21+
import {
  Typography,
  Grid,
  Box,
  Divider,
  Paper,
  Button,
  TextField,
  MenuItem,
  Select,
  FormControl,
  FormLabel,
  FormHelperText,
  InputLabel,
  CircularProgress,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
} from '@mui/material'; // @mui/material v5.13+
import {
  ContactSupport,
  Chat,
  Email,
  Phone,
  ExpandMore,
  Send,
  AttachFile,
} from '@mui/icons-material'; // @mui/icons-material v5.13+

import HelpLayout from '../../components/layout/HelpLayout';
import Card from '../../components/ui/Card';
import ActionButton from '../../components/ui/ActionButton';
import AlertNotification from '../../components/ui/AlertNotification';
import useResponsive from '../../hooks/useResponsive';
import useToast from '../../hooks/useToast';
import useAuth from '../../hooks/useAuth';
import useApiRequest from '../../hooks/useApiRequest';
import {
  SupportTicketFormData,
  SupportTicket,
  TicketResponse,
} from '../../types/ui.types';

// Define constants for support categories, priority levels, business hours, and contact information
const SUPPORT_CATEGORIES = [
  { id: 'technical', label: 'Technical Issue' },
  { id: 'billing', label: 'Billing Question' },
  { id: 'account', label: 'Account Management' },
  { id: 'feature', label: 'Feature Request' },
  { id: 'training', label: 'Training Request' },
  { id: 'other', label: 'Other' },
];

const PRIORITY_LEVELS = [
  { id: 'low', label: 'Low - General question or non-urgent issue' },
  { id: 'medium', label: 'Medium - Issue affecting some functionality' },
  { id: 'high', label: 'High - Significant issue affecting operations' },
  { id: 'critical', label: 'Critical - System down or unusable' },
];

const BUSINESS_HOURS = {
  weekdays: 'Monday - Friday: 8:00 AM - 8:00 PM ET',
  weekend: 'Saturday: 9:00 AM - 5:00 PM ET',
  closed: 'Sunday: Closed',
};

const CONTACT_INFO = {
  phone: {
    support: '1-800-555-HCBS (4227)',
    billing: '1-800-555-1234',
  },
  email: {
    support: 'support@thinkcaring.com',
    billing: 'billing@thinkcaring.com',
    training: 'training@thinkcaring.com',
  },
};

// Mock support tickets for demonstration purposes
const MOCK_TICKETS: SupportTicket[] = [
  {
    id: 'TKT-001234',
    subject: 'Cannot submit claims',
    category: 'technical',
    priority: 'high',
    status: 'in-progress',
    created: '2023-06-15T14:30:00Z',
    updated: '2023-06-15T16:45:00Z',
    description: "I'm unable to submit claims. When I click the submit button, nothing happens.",
    responses: [
      {
        id: 'RSP-001',
        from: 'support',
        name: 'John Smith',
        timestamp: '2023-06-15T15:20:00Z',
        message:
          'Thank you for reporting this issue. Can you please provide more details about your browser version and any error messages you might see in the console?',
      },
    ],
  },
  {
    id: 'TKT-001233',
    subject: 'Question about payment reconciliation',
    category: 'billing',
    priority: 'medium',
    status: 'resolved',
    created: '2023-06-10T09:15:00Z',
    updated: '2023-06-12T11:30:00Z',
    description: "I'm having trouble understanding how to reconcile payments when there are multiple adjustments.",
    responses: [
      {
        id: 'RSP-002',
        from: 'support',
        name: 'Sarah Johnson',
        timestamp: '2023-06-10T10:45:00Z',
        message:
          "I'd be happy to help with payment reconciliation. Let me explain the process for handling multiple adjustments...",
      },
      {
        id: 'RSP-003',
        from: 'user',
        name: 'You',
        timestamp: '2023-06-11T14:20:00Z',
        message: 'Thank you for the explanation. I have one more question about how to handle overpayments.',
      },
      {
        id: 'RSP-004',
        from: 'support',
        name: 'Sarah Johnson',
        timestamp: '2023-06-12T11:30:00Z',
        message: 'For overpayments, you should follow these steps... Does that answer your question?',
      },
    ],
  },
];

// Define the form schema using Zod for validation
const ticketSchema = z.object({
  subject: z
    .string()
    .min(5, 'Subject must be at least 5 characters')
    .max(100, 'Subject cannot exceed 100 characters'),
  category: z.string().min(1, 'Please select a category'),
  priority: z.string().min(1, 'Please select a priority level'),
  description: z
    .string()
    .min(20, 'Description must be at least 20 characters')
    .max(2000, 'Description cannot exceed 2000 characters'),
});

// Define the SupportPage component
const SupportPage: NextPage = () => {
  // Get the router instance using useRouter hook
  const router = useRouter();

  // Get responsive breakpoints using useResponsive hook
  const { isMobile } = useResponsive();

  // Get the authenticated user information using useAuth hook
  const { user } = useAuth();

  // Get toast notification functions using useToast hook
  const { success: showSuccess, error: showError } = useToast();

  // Initialize API request hook for submitting support tickets
  const { execute: submitTicket, loading: isSubmitting } = useApiRequest();

  // Set up state for active tab, chat window visibility, and loading states
  const [activeTab, setActiveTab] = useState(0);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isChatAvailable, setIsChatAvailable] = useState(true);

  // Set up form handling with react-hook-form and zod validation
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SupportTicketFormData>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      subject: '',
      category: '',
      priority: 'medium',
      description: '',
    },
  });

  // Create a function to handle support ticket submission
  const onSubmitTicket = async (data: SupportTicketFormData) => {
    try {
      // Set isSubmitting state to true
      // Create a FormData object with the form data
      const formData = new FormData();
      formData.append('subject', data.subject);
      formData.append('category', data.category);
      formData.append('priority', data.priority);
      formData.append('description', data.description);

      // Add file attachments to the FormData if present
      attachments.forEach((file) => {
        formData.append('attachments', file);
      });

      // Make API request to submit the support ticket
      await submitTicket({
        url: '/api/support/tickets',
        method: 'POST',
        data: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Show success toast notification on successful submission
      showSuccess('Your support ticket has been submitted successfully!');

      // Reset the form and attachments state
      reset();
      setAttachments([]);
    } catch (error: any) {
      // Show error toast notification if submission fails
      showError(error.message || 'Failed to submit support ticket. Please try again.');
    }
  };

  // Create a function to handle file attachment
  const handleFileAttachment = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const fileArray: File[] = Array.from(files);

    // Validate file types and sizes
    for (const file of fileArray) {
      const allowedTypes = ['.jpg', '.jpeg', '.png', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.csv'];
      const fileExtension = file.name.slice((file.name.lastIndexOf('.') - 1 >>> 0) + 2);
      if (!allowedTypes.includes(`.${fileExtension}`)) {
        showError(`Invalid file type: ${file.name}. Only .jpg, .png, .pdf, .doc, .xlsx, and .csv files are allowed.`);
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        showError(`File ${file.name} is too large. Maximum size is 10MB.`);
        return;
      }
    }

    // Check if maximum number of attachments would be exceeded
    if (attachments.length + fileArray.length > 5) {
      showError('You can only attach a maximum of 5 files.');
      return;
    }

    // Add valid files to attachments state
    setAttachments((prevAttachments) => [...prevAttachments, ...fileArray]);
    (event.target as HTMLInputElement).value = '';
  };

  // Create a function to handle removing a file attachment
  const handleRemoveAttachment = (index: number) => {
    const newAttachments = [...attachments];
    newAttachments.splice(index, 1);
    setAttachments(newAttachments);
  };

  // Create a function to handle live chat initiation
  const handleStartChat = () => {
    setIsChatOpen(true);
  };

  // Create a function to handle tab changes
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Create a function to format a date string
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  // Create a function to get a human-readable label for a ticket status
  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'in-progress':
        return 'In Progress';
      case 'resolved':
        return 'Resolved';
      default:
        return 'Open';
    }
  };

  // Create a function to get the appropriate color for a ticket status
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'in-progress':
        return 'warning';
      case 'resolved':
        return 'success';
      default:
        return 'primary';
    }
  };

  // Render the HelpLayout component with 'support' as the active tab
  return (
    <HelpLayout activeTab="support">
      {/* Render a Head component with page title and metadata */}
      <Head>
        <title>Support - HCBS Revenue Management</title>
      </Head>

      {/* Render tabs for 'Create Ticket', 'My Tickets', and 'Contact Information' */}
      <Paper elevation={2} sx={{ mb: 4 }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="Support options" sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Create Ticket" icon={<ContactSupport />} iconPosition="start" id="support-tab-0" aria-controls="support-tabpanel-0" />
          <Tab label="My Tickets" icon={<Email />} iconPosition="start" id="support-tab-1" aria-controls="support-tabpanel-1" />
          <Tab label="Contact Information" icon={<Phone />} iconPosition="start" id="support-tab-2" aria-controls="support-tabpanel-2" />
        </Tabs>

        {/* Render the active tab content based on the selected tab */}
        <TabPanel value={activeTab} index={0} id="support-tabpanel-0" aria-labelledby="support-tab-0">
          <Box component="form" onSubmit={handleSubmit(onSubmitTicket)} noValidate sx={{ mt: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Controller
                  name="subject"
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <TextField
                      {...field}
                      label="Subject"
                      fullWidth
                      error={!!error}
                      helperText={error?.message}
                      disabled={isSubmitting}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="category"
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <FormControl fullWidth error={!!error}>
                      <InputLabel id="category-label">Category</InputLabel>
                      <Select
                        {...field}
                        labelId="category-label"
                        label="Category"
                        disabled={isSubmitting}
                      >
                        {SUPPORT_CATEGORIES.map((category) => (
                          <MenuItem key={category.id} value={category.id}>
                            {category.label}
                          </MenuItem>
                        ))}
                      </Select>
                      {error && <FormHelperText>{error.message}</FormHelperText>}
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="priority"
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <FormControl fullWidth error={!!error}>
                      <InputLabel id="priority-label">Priority</InputLabel>
                      <Select
                        {...field}
                        labelId="priority-label"
                        label="Priority"
                        disabled={isSubmitting}
                      >
                        {PRIORITY_LEVELS.map((priority) => (
                          <MenuItem key={priority.id} value={priority.id}>
                            {priority.label}
                          </MenuItem>
                        ))}
                      </Select>
                      {error && <FormHelperText>{error.message}</FormHelperText>}
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="description"
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <TextField
                      {...field}
                      label="Description"
                      multiline
                      rows={6}
                      fullWidth
                      error={!!error}
                      helperText={error?.message || 'Please provide as much detail as possible about your issue or question.'}
                      disabled={isSubmitting}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Attachments
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Button
                      variant="outlined"
                      component="label"
                      startIcon={<AttachFile />}
                      disabled={isSubmitting}
                    >
                      Add Files
                      <input
                        type="file"
                        hidden
                        multiple
                        onChange={handleFileAttachment}
                        accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx,.csv"
                      />
                    </Button>
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                      Max 5 files, 10MB each (.jpg, .png, .pdf, .doc, .xlsx, .csv)
                    </Typography>
                  </Box>
                  {attachments.length > 0 && (
                    <Box>
                      <Typography variant="body2" gutterBottom>
                        Attached Files:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {attachments.map((file, index) => (
                          <Chip
                            key={index}
                            label={file.name}
                            onDelete={() => handleRemoveAttachment(index)}
                            disabled={isSubmitting}
                          />
                        ))}
                      </Box>
                    </Box>
                  )}
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    size="large"
                    disabled={isSubmitting}
                    startIcon={isSubmitting ? <CircularProgress size={20} /> : <Send />}
                  >
                    Submit Ticket
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>

        {/* Render the 'My Tickets' tab content */}
        <TabPanel value={activeTab} index={1} id="support-tabpanel-1" aria-labelledby="support-tab-1">
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Your Support Tickets
            </Typography>
            {MOCK_TICKETS.length > 0 ? (
              <Box>
                {MOCK_TICKETS.map((ticket) => (
                  <Accordion key={ticket.id} sx={{ mb: 2 }}>
                    <AccordionSummary
                      expandIcon={<ExpandMore />}
                      aria-controls={`ticket-${ticket.id}-content`}
                      id={`ticket-${ticket.id}-header`}
                    >
                      <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                          <Typography variant="subtitle1">{ticket.subject}</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Chip label={ticket.id} size="small" sx={{ mr: 1 }} />
                            <Chip label={getStatusLabel(ticket.status)} color={getStatusColor(ticket.status) as any} size="small" />
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', mt: 1 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ mr: 2 }}>
                            Created: {formatDate(ticket.created)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Updated: {formatDate(ticket.updated)}
                          </Typography>
                        </Box>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Description:
                        </Typography>
                        <Typography variant="body2" paragraph>
                          {ticket.description}
                        </Typography>
                      </Box>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="subtitle2" gutterBottom>
                        Responses:
                      </Typography>
                      <Box sx={{ ml: 2 }}>
                        {ticket.responses.map((response) => (
                          <Box
                            key={response.id}
                            sx={{
                              mb: 2,
                              p: 2,
                              bgcolor: response.from === 'support' ? 'primary.lighter' : 'grey.100',
                              borderRadius: 1,
                            }}
                          >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="subtitle2">{response.name}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {formatDate(response.timestamp)}
                              </Typography>
                            </Box>
                            <Typography variant="body2">{response.message}</Typography>
                          </Box>
                        ))}
                      </Box>
                      {ticket.status !== 'resolved' && (
                        <Box sx={{ mt: 2 }}>
                          <TextField
                            label="Reply to this ticket"
                            multiline
                            rows={3}
                            fullWidth
                            placeholder="Type your response here..."
                          />
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                            <Button variant="contained" startIcon={<Send />}>
                              Send Reply
                            </Button>
                          </Box>
                        </Box>
                      )}
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  You don't have any support tickets yet.
                </Typography>
                <Button variant="contained" onClick={() => setActiveTab(0)}>
                  Create a Ticket
                </Button>
              </Box>
            )}
          </Box>
        </TabPanel>

        {/* Render the 'Contact Information' tab content */}
        <TabPanel value={activeTab} index={2} id="support-tabpanel-2" aria-labelledby="support-tab-2">
          <Box sx={{ mt: 3 }}>
            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <Card elevation={2} sx={{ height: '100%' }}>
                  <Box sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom display="flex" alignItems="center">
                      <Phone sx={{ mr: 1 }} />
                      Phone Support
                    </Typography>
                    <Typography variant="body2" paragraph>
                      For immediate assistance, please call our support team:
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2">Technical Support:</Typography>
                      <Typography
                        variant="body1"
                        color="primary"
                        component="a"
                        href={`tel:${CONTACT_INFO.phone.support}`}
                        sx={{ textDecoration: 'none' }}
                      >
                        {CONTACT_INFO.phone.support}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2">Billing Support:</Typography>
                      <Typography
                        variant="body1"
                        color="primary"
                        component="a"
                        href={`tel:${CONTACT_INFO.phone.billing}`}
                        sx={{ textDecoration: 'none' }}
                      >
                        {CONTACT_INFO.phone.billing}
                      </Typography>
                    </Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Business Hours:
                    </Typography>
                    <Typography variant="body2" paragraph>
                      {BUSINESS_HOURS.weekdays}
                    </Typography>
                    <Typography variant="body2" paragraph>
                      {BUSINESS_HOURS.weekend}
                    </Typography>
                    <Typography variant="body2">
                      {BUSINESS_HOURS.closed}
                    </Typography>
                  </Box>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card elevation={2} sx={{ height: '100%' }}>
                  <Box sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom display="flex" alignItems="center">
                      <Email sx={{ mr: 1 }} />
                      Email Support
                    </Typography>
                    <Typography variant="body2" paragraph>
                      You can also reach our support team via email:
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2">Technical Support:</Typography>
                      <Typography
                        variant="body1"
                        color="primary"
                        component="a"
                        href={`mailto:${CONTACT_INFO.email.support}`}
                        sx={{ textDecoration: 'none' }}
                      >
                        {CONTACT_INFO.email.support}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2">Billing Questions:</Typography>
                      <Typography
                        variant="body1"
                        color="primary"
                        component="a"
                        href={`mailto:${CONTACT_INFO.email.billing}`}
                        sx={{ textDecoration: 'none' }}
                      >
                        {CONTACT_INFO.email.billing}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2">Training Requests:</Typography>
                      <Typography
                        variant="body1"
                        color="primary"
                        component="a"
                        href={`mailto:${CONTACT_INFO.email.training}`}
                        sx={{ textDecoration: 'none' }}
                      >
                        {CONTACT_INFO.email.training}
                      </Typography>
                    </Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Email Response Time:
                    </Typography>
                    <Typography variant="body2">
                      We strive to respond to all email inquiries within 24 business hours.
                    </Typography>
                  </Box>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>
      </Paper>

      {/* Render a floating action button for initiating live chat when available */}
      {isChatAvailable && (
        <Box sx={{ position: 'fixed', bottom: 20, right: 20, zIndex: 1000 }}>
          {isChatOpen ? (
            <Paper elevation={6} sx={{ width: 320, height: 450, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <Box sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle1">Live Support Chat</Typography>
                <Button size="small" color="inherit" onClick={() => setIsChatOpen(false)}>
                  Close
                </Button>
              </Box>
              <Box sx={{ flexGrow: 1, p: 2, bgcolor: 'background.default', overflowY: 'auto' }}>
                <Box sx={{ bgcolor: 'primary.lighter', p: 2, borderRadius: 2, maxWidth: '80%', mb: 2 }}>
                  <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                    Support Agent
                  </Typography>
                  <Typography variant="body2">Hello! Welcome to ThinkCaring support. How can I help you today?</Typography>
                </Box>
              </Box>
              <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', display: 'flex' }}>
                <TextField fullWidth size="small" placeholder="Type your message..." variant="outlined" sx={{ mr: 1 }} />
                <Button variant="contained" color="primary">
                  Send
                </Button>
              </Box>
            </Paper>
          ) : (
            <ActionButton
              color="primary"
              size="large"
              icon={<Chat />}
              tooltip="Start Live Chat"
              onClick={handleStartChat}
            />
          )}
        </Box>
      )}
    </HelpLayout>
  );
};

// Define a TabPanel component for rendering tab content
interface TabPanelProps {
  children?: React.ReactNode;
  index: any;
  value: any;
  id?: string;
  'aria-labelledby'?: string;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`support-tabpanel-${index}`}
      aria-labelledby={`support-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          <Typography component="div">{children}</Typography>
        </Box>
      )}
    </div>
  );
}

export default SupportPage;