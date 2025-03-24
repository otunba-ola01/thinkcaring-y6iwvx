import React, { useState, useEffect, useMemo } from 'react'; // react v18.2.0
import { NextPage } from 'next'; // next v13.4+
import Head from 'next/head'; // next/head v13.4+
import { useRouter } from 'next/router'; // next/router v13.4+
import {
  Typography,
  Grid,
  Box,
  Divider,
  Chip,
  Paper,
  Button,
  Container,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material'; // @mui/material v5.13+
import {
  ExpandMore as ExpandMoreIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  MenuBook as ArticleIcon
} from '@mui/icons-material'; // @mui/icons-material v5.13+

import HelpLayout from '../../components/layout/HelpLayout';
import Card from '../../components/ui/Card';
import SearchInput from '../../components/ui/SearchInput';
import FilterPanel from '../../components/ui/FilterPanel';
import EmptyState from '../../components/ui/EmptyState';
import useResponsive from '../../hooks/useResponsive';
import useQueryParams from '../../hooks/useQueryParams';
import { ROUTES } from '../../constants/routes.constants';
import { ISO8601Date } from '../../types/common.types';

// Define article categories with labels and colors
const ARTICLE_CATEGORIES = [
  { id: 'getting-started', label: 'Getting Started', color: 'primary' },
  { id: 'claims', label: 'Claims Management', color: 'secondary' },
  { id: 'billing', label: 'Billing', color: 'success' },
  { id: 'payments', label: 'Payments', color: 'warning' },
  { id: 'reports', label: 'Reports', color: 'info' },
  { id: 'settings', label: 'Settings', color: 'default' },
  { id: 'troubleshooting', label: 'Troubleshooting', color: 'error' }
];

// Define knowledge base articles with title, summary, category, and content
const KNOWLEDGE_BASE_ARTICLES = [
  {
    id: 'kb-001',
    title: 'Getting Started with HCBS Revenue Management',
    summary: 'An introduction to the HCBS Revenue Management System and its key features.',
    category: 'getting-started',
    content: '# Getting Started with HCBS Revenue Management\n\nWelcome to the HCBS Revenue Management System! This guide will help you understand the key features and get started with using the system effectively.\n\n## System Overview\n\nThe HCBS Revenue Management System is designed to streamline financial operations for Home and Community-Based Services providers. It addresses critical challenges in revenue cycle management by:\n\n- Streamlining billing processes\n- Enhancing financial visibility\n- Ensuring compliance with Medicaid and other payer requirements\n\n## Key Features\n\n- **Dashboard**: Get a comprehensive view of your financial metrics\n- **Claims Management**: Track claims throughout their lifecycle\n- **Billing Workflow**: Convert services to billable claims efficiently\n- **Payment Reconciliation**: Match payments to claims and manage accounts receivable\n- **Financial Reporting**: Generate insights with customizable reports\n\n## Next Steps\n\n1. Explore the Dashboard to familiarize yourself with key metrics\n2. Review the Clients section to understand client management\n3. Learn about the Claims process and how to submit claims\n4. Understand how to reconcile payments\n5. Explore the reporting capabilities\n\nFor more detailed information, check out our video tutorials or contact support if you have specific questions.',
    tags: ['introduction', 'overview', 'basics']
  },
  {
    id: 'kb-010',
    title: 'Claim Submission Process',
    summary: 'Learn how to submit claims efficiently using the system.',
    category: 'claims',
    content: '# Claim Submission Process\n\nThis guide explains the complete process for submitting claims through the HCBS Revenue Management System.\n\n## Before You Begin\n\nEnsure you have the following information ready:\n\n- Client details and eligibility information\n- Service documentation\n- Authorization details\n- Payer information\n\n## Step-by-Step Process\n\n1. **Create a New Claim**\n   - Navigate to Claims > New Claim\n   - Select the client from the dropdown\n   - Choose the service period\n\n2. **Add Services to the Claim**\n   - Select billable services from the list\n   - Verify service details and units\n   - Ensure documentation is complete\n\n3. **Validate the Claim**\n   - Run validation to check for errors\n   - Address any validation issues\n   - Verify claim totals\n\n4. **Submit the Claim**\n   - Choose the submission method\n   - Review final claim details\n   - Submit to payer\n\n5. **Track Claim Status**\n   - Monitor claim status in the Claims dashboard\n   - Follow up on pending claims\n   - Address any denials promptly\n\n## Best Practices\n\n- Submit claims within timely filing deadlines\n- Ensure all documentation is complete before submission\n- Regularly check claim status and follow up on pending claims\n- Review denial reasons and correct issues before resubmission\n\n## Troubleshooting\n\nIf you encounter issues during claim submission, check:\n\n- Service authorization validity\n- Client eligibility for the service period\n- Documentation completeness\n- Correct service codes and modifiers',
    tags: ['claims', 'submission', 'billing']
  },
  {
    id: 'kb-025',
    title: 'Payment Reconciliation',
    summary: 'How to reconcile payments with submitted claims.',
    category: 'payments',
    content: "# Payment Reconciliation\n\nThis guide explains how to reconcile payments with submitted claims in the HCBS Revenue Management System.\n\n## Understanding Payment Reconciliation\n\nPayment reconciliation is the process of matching payments received from payers to the claims you've submitted. This process ensures that you're paid correctly for services provided and helps identify discrepancies that need attention.\n\n## Reconciliation Process\n\n1. **Import Remittance**\n   - Navigate to Payments > Import Remittance\n   - Upload the 835 file or manually enter payment information\n   - The system will validate the remittance data\n\n2. **Review Payment Details**\n   - Examine the payment summary\n   - Review any adjustments or denials\n   - Note the total paid amount\n\n3. **Match Payments to Claims**\n   - The system will automatically match payments to claims where possible\n   - Review automatic matches for accuracy\n   - Manually match any unmatched payments\n\n4. **Handle Discrepancies**\n   - Identify underpayments or denials\n   - Document adjustment reasons\n   - Create follow-up tasks for issues requiring attention\n\n5. **Finalize Reconciliation**\n   - Confirm all payments are matched\n   - Update claim statuses\n   - Post reconciled payments to your accounting system\n\n## Handling Common Scenarios\n\n### Partial Payments\n\nWhen a claim is partially paid:\n\n1. Match the payment to the claim\n2. Document the reason for partial payment\n3. Determine if follow-up is needed\n\n### Denials\n\nWhen a claim is denied:\n\n1. Document the denial reason\n2. Determine if the claim can be corrected and resubmitted\n3. Create a follow-up task if needed\n\n### Overpayments\n\nWhen a payer overpays a claim:\n\n1. Document the overpayment\n2. Follow your organization's process for handling overpayments\n3. Contact the payer if necessary\n\n## Best Practices\n\n- Reconcile payments promptly after receipt\n- Document all adjustment reasons\n- Follow up on denials and underpayments quickly\n- Regularly review aging accounts receivable\n- Maintain clear documentation of all reconciliation activities",
    tags: ['payments', 'reconciliation', 'accounts receivable']
  },
  {
    id: 'kb-032',
    title: 'Generating Reports',
    summary: 'Learn how to create and customize financial reports.',
    category: 'reports',
    content: "# Generating Reports\n\nThis guide explains how to create, customize, and export reports in the HCBS Revenue Management System.\n\n## Available Report Types\n\nThe system offers several standard report types:\n\n- **Revenue Reports**: Track revenue by program, payer, or time period\n- **Claims Reports**: Analyze claim status, aging, and denial reasons\n- **Financial Reports**: Review accounts receivable, cash flow, and financial metrics\n- **Custom Reports**: Build your own reports with selected data points\n\n## Creating a Standard Report\n\n1. **Select Report Type**\n   - Navigate to Reports > Selection\n   - Choose the report category\n   - Select the specific report template\n\n2. **Configure Parameters**\n   - Set the date range\n   - Select programs, payers, or other filters\n   - Choose grouping options\n\n3. **Generate the Report**\n   - Click 'Generate Report'\n   - Review the results\n   - Adjust parameters if needed\n\n4. **Export or Save**\n   - Export to PDF, Excel, or CSV\n   - Save report parameters for future use\n   - Schedule recurring reports if needed\n\n## Building Custom Reports\n\n1. **Start Custom Report Builder**\n   - Navigate to Reports > Custom Builder\n   - Select data sources\n\n2. **Select Fields**\n   - Choose the fields to include\n   - Add calculated fields if needed\n\n3. **Configure Filters**\n   - Add filters to narrow down data\n   - Set default filter values\n\n4. **Set Grouping and Sorting**\n   - Choose how to group data\n   - Set sort order\n\n5. **Choose Visualization**\n   - Select chart types\n   - Configure display options\n\n6. **Save and Export**\n   - Save the report definition\n   - Generate and export results\n\n## Scheduling Reports\n\n1. **Configure Schedule**\n   - Select report to schedule\n   - Set frequency (daily, weekly, monthly)\n   - Choose delivery time\n\n2. **Set Delivery Options**\n   - Add email recipients\n   - Choose file format\n   - Add message text\n\n3. **Activate Schedule**\n   - Review settings\n   - Activate the schedule\n   - Test delivery\n\n## Best Practices\n\n- Start with standard reports before creating custom reports\n- Use consistent date ranges for trend analysis\n- Export to Excel for further analysis\n- Schedule critical reports for automatic delivery\n- Save frequently used report parameters\n\n## Troubleshooting\n\n- If a report takes too long to generate, try narrowing the date range\n- For complex reports, consider scheduling during off-hours\n- If data seems incorrect, verify your filter settings\n- For export issues, try a different file format",
    tags: ['reports', 'analytics', 'financial reporting']
  },
  {
    id: 'kb-045',
    title: 'User Management',
    summary: 'How to manage users, roles, and permissions in the system.',
    category: 'settings',
    content: "# User Management\n\nThis guide explains how to manage users, roles, and permissions in the HCBS Revenue Management System.\n\n## User Management Overview\n\nThe system provides comprehensive tools for managing user access, including:\n\n- Creating and managing user accounts\n- Assigning roles and permissions\n- Setting up multi-factor authentication\n- Monitoring user activity\n\n## Managing Users\n\n### Adding a New User\n\n1. Navigate to Settings > Users\n2. Click 'Add User'\n3. Enter user details:\n   - Full name\n   - Email address\n   - Job title\n   - Contact information\n4. Assign appropriate role(s)\n5. Set initial password options\n6. Enable MFA if required\n7. Save the new user\n\n### Editing Existing Users\n\n1. Navigate to Settings > Users\n2. Find the user in the list\n3. Click 'Edit'\n4. Update user information\n5. Save changes\n\n### Deactivating Users\n\n1. Navigate to Settings > Users\n2. Find the user in the list\n3. Click 'Deactivate'\n4. Confirm deactivation\n\n## Role Management\n\n### Understanding Roles\n\nThe system includes several predefined roles:\n\n- **Administrator**: Full system access\n- **Financial Manager**: Access to financial reports and dashboards\n- **Billing Specialist**: Access to claims and billing functions\n- **Program Manager**: Limited access to program-specific data\n- **Read-only User**: View-only access to reports and dashboards\n\n### Creating Custom Roles\n\n1. Navigate to Settings > Roles\n2. Click 'Add Role'\n3. Enter role name and description\n4. Select permissions for the role\n5. Save the new role\n\n### Editing Roles\n\n1. Navigate to Settings > Roles\n2. Find the role in the list\n3. Click 'Edit'\n4. Modify permissions\n5. Save changes\n\n## Permission Management\n\n### Permission Categories\n\nPermissions are organized into categories:\n\n- **Data Access**: View clients, claims, payments, etc.\n- **Operations**: Create claims, submit claims, process payments, etc.\n- **Administration**: Manage users, configure system, audit logs, etc.\n- **Reporting**: Run reports, export data, schedule reports, etc.\n\n### Assigning Permissions\n\nPermissions are typically assigned to roles, and users inherit permissions from their assigned roles. However, you can also assign specific permissions directly to users if needed.\n\n## Security Best Practices\n\n- Follow the principle of least privilege when assigning roles\n- Require strong passwords and MFA for all users\n- Regularly review user access and remove unnecessary permissions\n- Audit user activity periodically\n- Deactivate user accounts promptly when employees leave\n\n## Troubleshooting\n\n- If a user can't access a feature, check their role and permissions\n- For login issues, verify the user's status is active\n- If MFA is causing problems, you can temporarily disable it for a user\n- For persistent issues, check the audit log for clues",
    tags: ['users', 'roles', 'permissions', 'security']
  },
  {
    id: 'kb-050',
    title: 'Troubleshooting Common Issues',
    summary: 'Solutions for frequently encountered problems in the system.',
    category: 'troubleshooting',
    content: "# Troubleshooting Common Issues\n\nThis guide provides solutions for common issues you might encounter while using the HCBS Revenue Management System.\n\n## Login and Access Issues\n\n### Cannot Log In\n\n**Possible causes and solutions:**\n\n1. **Incorrect credentials**\n   - Verify username and password\n   - Use the 'Forgot Password' link if needed\n\n2. **Account locked**\n   - Contact your administrator to unlock the account\n   - Wait for the automatic unlock period to expire\n\n3. **MFA issues**\n   - Ensure your device time is synchronized\n   - Use backup codes if you can't access your authenticator app\n   - Contact administrator for MFA reset\n\n### Cannot Access Certain Features\n\n**Possible causes and solutions:**\n\n1. **Insufficient permissions**\n   - Verify your assigned role has the necessary permissions\n   - Request additional permissions from your administrator\n\n2. **Feature not enabled**\n   - Check if the feature is included in your organization's subscription\n   - Contact administrator to enable the feature\n\n## Claim Submission Issues\n\n### Validation Errors\n\n**Possible causes and solutions:**\n\n1. **Missing information**\n   - Review all required fields\n   - Check for incomplete documentation\n\n2. **Invalid codes**\n   - Verify service codes are correct for the payer\n   - Check modifiers and place of service codes\n\n3. **Authorization issues**\n   - Verify service is authorized\n   - Check authorization dates and units\n\n### Submission Failures\n\n**Possible causes and solutions:**\n\n1. **Connectivity issues**\n   - Check your internet connection\n   - Verify the clearinghouse or payer system is operational\n\n2. **Format errors**\n   - Review claim format requirements\n   - Check for special characters in text fields\n\n3. **Duplicate claims**\n   - Verify the claim hasn't already been submitted\n   - Check for duplicate claim numbers\n\n## Payment Reconciliation Issues\n\n### Cannot Match Payments\n\n**Possible causes and solutions:**\n\n1. **Missing claim information**\n   - Verify claim numbers in the remittance\n   - Check for claim adjustments or resubmissions\n\n2. **Payment amount discrepancies**\n   - Review adjustment codes\n   - Check for bundled payments\n\n### Import Errors\n\n**Possible causes and solutions:**\n\n1. **Invalid file format**\n   - Verify the file is a valid 835 format\n   - Check for file corruption\n\n2. **Duplicate remittance**\n   - Verify the remittance hasn't already been imported\n   - Check remittance trace numbers\n\n## Reporting Issues\n\n### Reports Not Loading\n\n**Possible causes and solutions:**\n\n1. **Large data volume**\n   - Narrow the date range\n   - Apply additional filters\n   - Try running the report during off-peak hours\n\n2. **Browser issues**\n   - Clear browser cache\n   - Try a different browser\n\n### Export Problems\n\n**Possible causes and solutions:**\n\n1. **File size limitations**\n   - Export in smaller batches\n   - Use CSV format for large datasets\n\n2. **Format compatibility**\n   - Try a different export format\n   - Update software used to open exported files\n\n## Performance Issues\n\n### Slow System Response\n\n**Possible causes and solutions:**\n\n1. **Browser performance**\n   - Close unnecessary tabs\n   - Clear cache and cookies\n   - Update your browser\n\n2. **Network issues**\n   - Check your internet connection speed\n   - Connect to a more stable network\n\n3. **System load**\n   - Try during off-peak hours\n   - Reduce complex filtering in large datasets\n\n## Getting Additional Help\n\nIf you cannot resolve an issue using this guide:\n\n1. Check other knowledge base articles for specific topics\n2. Watch tutorial videos for step-by-step guidance\n3. Contact support through the Support page\n4. For urgent issues, use the live chat feature during business hours",
    tags: ['troubleshooting', 'errors', 'help', 'support']
  }
];

// Define filter configuration for category selection
const FILTER_CONFIG = [
  {
    id: 'category',
    label: 'Category',
    type: 'select',
    field: 'category',
    options: ARTICLE_CATEGORIES.map(cat => ({ value: cat.id, label: cat.label }))
  }
];

/**
 * The main component for the Knowledge Base page that displays searchable help articles
 * @returns {JSX.Element} The rendered Knowledge Base page
 */
const KnowledgeBasePage: NextPage = () => {
  // Get the router instance using useRouter hook
  const router = useRouter();

  // Get responsive breakpoints using useResponsive hook
  const { isMobile } = useResponsive();

  // Initialize query params using useQueryParams hook
  const { query, getQueryParam, setQueryParam } = useQueryParams();

  // Set up state for search query, selected category, and loading state
  const [searchQuery, setSearchQuery] = useState<string>(getQueryParam('search', ''));
  const [selectedCategory, setSelectedCategory] = useState<string>(getQueryParam('category', ''));
  const [loading, setLoading] = useState<boolean>(false);

  // Create a memoized filtered articles list based on search query and selected category
  const filteredArticles = useMemo(() => {
    let articles = [...KNOWLEDGE_BASE_ARTICLES];

    if (searchQuery) {
      articles = articles.filter(article =>
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory) {
      articles = articles.filter(article => article.category === selectedCategory);
    }

    return articles;
  }, [searchQuery, selectedCategory]);

  // Handle search input changes and update URL query parameters
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setQueryParam('search', value, { replace: true });
  };

  // Handle category filter changes and update URL query parameters
  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    setQueryParam('category', value, { replace: true });
  };

  // Load article details when article ID is provided in URL
  useEffect(() => {
    const articleId = getQueryParam('view');
    if (articleId) {
      // Load article details here (e.g., fetch from API)
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
      }, 500);
    }
  }, [getQueryParam]);

  return (
    <HelpLayout activeTab="knowledge-base">
      <Head>
        <title>Knowledge Base - HCBS Revenue Management</title>
        <meta name="description" content="Searchable knowledge base for HCBS Revenue Management System" />
      </Head>

      <Container maxWidth="md">
        <SearchInput
          placeholder="Search articles..."
          value={searchQuery}
          onChange={handleSearchChange}
          onSearch={handleSearchChange}
          loading={loading}
          sx={{ mb: 2 }}
        />

        <FilterPanel
          filters={FILTER_CONFIG}
          initialValues={{ category: selectedCategory }}
          onFilterChange={(newFilters) => handleCategoryChange(newFilters.category)}
        />

        {filteredArticles.length > 0 ? (
          <Grid container spacing={2}>
            {filteredArticles.map(article => (
              <Grid item xs={12} key={article.id}>
                <Card title={article.title} subtitle={article.summary}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Chip label={ARTICLE_CATEGORIES.find(cat => cat.id === article.category)?.label} color={ARTICLE_CATEGORIES.find(cat => cat.id === article.category)?.color as any} size="small" />
                    <Button size="small" onClick={() => router.push(`${ROUTES.HELP.KNOWLEDGE_BASE}?view=${article.id}`)}>
                      Read More
                    </Button>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <EmptyState
            title="No articles found"
            description="No articles match your search criteria. Try adjusting your search or filters."
            icon={<ArticleIcon sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.7 }} />}
          />
        )}
      </Container>
    </HelpLayout>
  );
};

export default KnowledgeBasePage;