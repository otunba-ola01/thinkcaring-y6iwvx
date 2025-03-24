import React, { useState, useEffect, useMemo, useRef } from 'react'; // react v18.2.0
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
  Tabs,
  Tab
} from '@mui/material'; // @mui/material v5.13+
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  OndemandVideo as VideoIcon,
  PlayArrow as PlayIcon
} from '@mui/icons-material'; // @mui/icons-material v5.13+

import HelpLayout from '../../components/layout/HelpLayout';
import Card from '../../components/ui/Card';
import SearchInput from '../../components/ui/SearchInput';
import FilterPanel from '../../components/ui/FilterPanel';
import EmptyState from '../../components/ui/EmptyState';
import useResponsive from '../../hooks/useResponsive';
import useQueryParams from '../../hooks/useQueryParams';
import { ROUTES } from '../../constants/routes.constants';
import { Tutorial } from '../../types/ui.types';

interface TutorialPageProps {}

/**
 * Defines the structure of a tutorial category
 */
interface TutorialCategory {
  id: string;
  label: string;
  color: 'primary' | 'secondary' | 'success' | 'warning' | 'info' | 'default';
}

/**
 * Defines the available tutorial categories
 */
const TUTORIAL_CATEGORIES: TutorialCategory[] = [
  { id: 'getting-started', label: 'Getting Started', color: 'primary' },
  { id: 'claims', label: 'Claims Management', color: 'secondary' },
  { id: 'billing', label: 'Billing', color: 'success' },
  { id: 'payments', label: 'Payments', color: 'warning' },
  { id: 'reports', label: 'Reports', color: 'info' },
  { id: 'settings', label: 'Settings', color: 'default' },
];

/**
 * Defines the structure of a tutorial object
 */
const TUTORIALS: Tutorial[] = [
  {
    id: 'tut-001',
    title: 'Getting Started with HCBS Revenue Management',
    description: 'An introduction to the HCBS Revenue Management System dashboard and navigation.',
    category: 'getting-started',
    duration: '5:30',
    thumbnailUrl: '/assets/images/tutorials/dashboard-overview.jpg',
    videoUrl: 'https://storage.thinkcaring.com/tutorials/dashboard-overview.mp4',
    tags: ['introduction', 'dashboard', 'navigation'],
  },
  {
    id: 'tut-002',
    title: 'Creating Your First Claim',
    description: 'Learn how to create and submit your first claim in the system.',
    category: 'claims',
    duration: '8:45',
    thumbnailUrl: '/assets/images/tutorials/create-claim.jpg',
    videoUrl: 'https://storage.thinkcaring.com/tutorials/create-claim.mp4',
    tags: ['claims', 'submission', 'billing'],
  },
  {
    id: 'tut-003',
    title: 'Managing Client Information',
    description: 'How to add, edit, and manage client information in the system.',
    category: 'getting-started',
    duration: '6:15',
    thumbnailUrl: '/assets/images/tutorials/client-management.jpg',
    videoUrl: 'https://storage.thinkcaring.com/tutorials/client-management.mp4',
    tags: ['clients', 'management', 'data entry'],
  },
  {
    id: 'tut-004',
    title: 'Service Documentation Best Practices',
    description: 'Learn how to properly document services for successful billing.',
    category: 'billing',
    duration: '7:20',
    thumbnailUrl: '/assets/images/tutorials/service-documentation.jpg',
    videoUrl: 'https://storage.thinkcaring.com/tutorials/service-documentation.mp4',
    tags: ['documentation', 'services', 'compliance'],
  },
  {
    id: 'tut-005',
    title: 'Processing Payments and Remittances',
    description: 'How to process payments and reconcile them with submitted claims.',
    category: 'payments',
    duration: '10:15',
    thumbnailUrl: '/assets/images/tutorials/payment-processing.jpg',
    videoUrl: 'https://storage.thinkcaring.com/tutorials/payment-processing.mp4',
    tags: ['payments', 'reconciliation', 'remittance'],
  },
  {
    id: 'tut-006',
    title: 'Generating Financial Reports',
    description: 'Learn how to create and customize financial reports for your organization.',
    category: 'reports',
    duration: '9:30',
    thumbnailUrl: '/assets/images/tutorials/financial-reports.jpg',
    videoUrl: 'https://storage.thinkcaring.com/tutorials/financial-reports.mp4',
    tags: ['reports', 'financial', 'analytics'],
  },
  {
    id: 'tut-007',
    title: 'User and Role Management',
    description: 'How to manage users, roles, and permissions in the system.',
    category: 'settings',
    duration: '6:45',
    thumbnailUrl: '/assets/images/tutorials/user-management.jpg',
    videoUrl: 'https://storage.thinkcaring.com/tutorials/user-management.mp4',
    tags: ['users', 'roles', 'permissions', 'security'],
  },
  {
    id: 'tut-008',
    title: 'Batch Claim Submission',
    description: 'How to efficiently submit multiple claims in a batch process.',
    category: 'claims',
    duration: '7:50',
    thumbnailUrl: '/assets/images/tutorials/batch-claims.jpg',
    videoUrl: 'https://storage.thinkcaring.com/tutorials/batch-claims.mp4',
    tags: ['claims', 'batch', 'efficiency'],
  },
  {
    id: 'tut-009',
    title: 'Managing Service Authorizations',
    description: 'Learn how to track and manage service authorizations for clients.',
    category: 'billing',
    duration: '8:10',
    thumbnailUrl: '/assets/images/tutorials/service-authorizations.jpg',
    videoUrl: 'https://storage.thinkcaring.com/tutorials/service-authorizations.mp4',
    tags: ['authorizations', 'services', 'compliance'],
  },
  {
    id: 'tut-010',
    title: 'Accounts Receivable Management',
    description: 'How to effectively manage your accounts receivable and aging claims.',
    category: 'payments',
    duration: '9:20',
    thumbnailUrl: '/assets/images/tutorials/accounts-receivable.jpg',
    videoUrl: 'https://storage.thinkcaring.com/tutorials/accounts-receivable.mp4',
    tags: ['accounts receivable', 'aging', 'collections'],
  },
  {
    id: 'tut-011',
    title: 'Customizing Dashboard Views',
    description: 'How to customize your dashboard to focus on the metrics that matter to you.',
    category: 'getting-started',
    duration: '5:45',
    thumbnailUrl: '/assets/images/tutorials/dashboard-customization.jpg',
    videoUrl: 'https://storage.thinkcaring.com/tutorials/dashboard-customization.mp4',
    tags: ['dashboard', 'customization', 'metrics'],
  },
  {
    id: 'tut-012',
    title: 'Handling Claim Denials',
    description: 'Best practices for addressing and appealing denied claims.',
    category: 'claims',
    duration: '11:30',
    thumbnailUrl: '/assets/images/tutorials/claim-denials.jpg',
    videoUrl: 'https://storage.thinkcaring.com/tutorials/claim-denials.mp4',
    tags: ['denials', 'appeals', 'claims'],
  },
];

/**
 * Defines the filter configuration for the tutorials page
 */
const FILTER_CONFIG = [
  {
    id: 'category',
    label: 'Category',
    type: 'select',
    field: 'category',
    operator: 'eq',
    options: TUTORIAL_CATEGORIES.map(cat => ({ value: cat.id, label: cat.label })),
  },
];

/**
 * The main component for the Tutorials page that displays video tutorials for the HCBS Revenue Management System
 * @returns The rendered Tutorials page
 */
const TutorialsPage: NextPage<TutorialPageProps> = () => {
  // Get the router instance using useRouter hook
  const router = useRouter();

  // Get responsive breakpoints using useResponsive hook
  const { isMobile } = useResponsive();

  // Initialize query params using useQueryParams hook
  const { query, setQueryParam, getQueryParam } = useQueryParams();

  // Set up state for search query, selected category, and selected tutorial
  const [searchQuery, setSearchQuery] = useState<string>(getQueryParam('search', '') || '');
  const [selectedCategory, setSelectedCategory] = useState<string>(getQueryParam('category', '') || '');
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Create a memoized filtered tutorials list based on search query and selected category
  const filteredTutorials = useMemo(() => {
    let filtered = TUTORIALS;

    if (searchQuery) {
      filtered = filtered.filter(tutorial =>
        tutorial.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tutorial.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tutorial.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(tutorial => tutorial.category === selectedCategory);
    }

    return filtered;
  }, [searchQuery, selectedCategory]);

  // Create a reference to the video element for controlling playback
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Handle search input changes and update URL query parameters
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  // Handle search submission
  const handleSearch = (value: string) => {
    setQueryParam('search', value);
  };

  // Handle category filter changes and update URL query parameters
  const handleFilterChange = (filters: Record<string, any>) => {
    setSelectedCategory(filters.category || '');
    setQueryParam('category', filters.category || '');
  };

  // Handle tutorial selection to display the video player
  const handleTutorialSelect = (tutorial: Tutorial) => {
    setSelectedTutorial(tutorial);
    setQueryParam('tutorial', tutorial.id);
    window.scrollTo(0, 0);
  };

  // Handle returning to the tutorial list from a tutorial video
  const handleBackToList = () => {
    setSelectedTutorial(null);
    setQueryParam('tutorial', null);
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  // Handle clearing all search filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setQueryParam('search', null);
    setQueryParam('category', null);
  };

  // Gets the display label for a category ID
  const getCategoryLabel = (categoryId: string): string => {
    const category = TUTORIAL_CATEGORIES.find(cat => cat.id === categoryId);
    return category ? category.label : 'Unknown Category';
  };

  // Gets the color for a category ID
  const getCategoryColor = (categoryId: string): string => {
    const category = TUTORIAL_CATEGORIES.find(cat => cat.id === categoryId);
    return category ? category.color : 'default';
  };

  // Render the HelpLayout component with 'tutorials' as the active tab
  return (
    <HelpLayout activeTab="tutorials">
      {/* Render a Head component with page title and metadata */}
      <Head>
        <title>Video Tutorials - HCBS Revenue Management</title>
      </Head>

      {/* Render a search bar for filtering tutorials */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Video Tutorials
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Watch step-by-step video guides that demonstrate how to use key features of the HCBS Revenue Management System.
        </Typography>
      </Box>

      {/* Render a search bar and category filters */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, mb: 3 }}>
        <Box sx={{ flex: 1 }}>
          <SearchInput
            placeholder="Search tutorials..."
            value={searchQuery}
            onChange={handleSearchChange}
            onSearch={handleSearch}
          />
        </Box>
        <Box sx={{ width: { xs: '100%', md: '300px' } }}>
          <FilterPanel
            filters={FILTER_CONFIG}
            initialValues={{ category: selectedCategory }}
            onFilterChange={handleFilterChange}
            collapsible
          />
        </Box>
      </Box>

      {/* If a tutorial is selected, render the video player with the tutorial */}
      {selectedTutorial ? (
        <Box sx={{ mb: 3 }}>
          <Button variant="outlined" onClick={handleBackToList} sx={{ mb: 2 }}>
            Back to Tutorials
          </Button>
          <Paper elevation={2} sx={{ overflow: 'hidden' }}>
            <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="h5" component="h2">
                {selectedTutorial.title}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <Chip
                  label={getCategoryLabel(selectedTutorial.category)}
                  color={getCategoryColor(selectedTutorial.category)}
                  size="small"
                  sx={{ mr: 1 }}
                />
                <Typography variant="body2" color="text.secondary">
                  Duration: {selectedTutorial.duration}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ position: 'relative', paddingTop: '56.25%', bgcolor: 'black' }}>
              <video
                ref={videoRef}
                src={selectedTutorial.videoUrl}
                controls
                width="100%"
                height="auto"
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
              />
            </Box>
            <Box sx={{ p: 3 }}>
              <Typography variant="body1" paragraph>
                {selectedTutorial.description}
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" component="span" sx={{ mr: 1 }}>
                  Tags:
                </Typography>
                {selectedTutorial.tags.map(tag => (
                  <Chip key={tag} label={tag} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                ))}
              </Box>
            </Box>
          </Paper>
        </Box>
      ) : (
        // Otherwise, render the grid of tutorial cards matching the search and category filters
        filteredTutorials.length > 0 ? (
          <Grid container spacing={3}>
            {filteredTutorials.map(tutorial => (
              <Grid key={tutorial.id} item xs={12} sm={6} md={4}>
                <Card
                  elevation={2}
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    '&:hover': {
                      boxShadow: 6,
                    },
                  }}
                  onClick={() => handleTutorialSelect(tutorial)}
                >
                  <Box sx={{ position: 'relative', paddingTop: '56.25%', bgcolor: 'grey.200' }}>
                    <img
                      src={tutorial.thumbnailUrl}
                      alt={tutorial.title}
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        bgcolor: 'rgba(0, 0, 0, 0.6)',
                        borderRadius: '50%',
                        width: 60,
                        height: 60,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s',
                        '&:hover': {
                          bgcolor: 'rgba(0, 0, 0, 0.8)',
                          width: 64,
                          height: 64,
                        },
                      }}
                    >
                      <PlayIcon sx={{ color: 'white', fontSize: 30 }} />
                    </Box>
                    <Box sx={{ position: 'absolute', bottom: 0, right: 0, bgcolor: 'rgba(0, 0, 0, 0.7)', color: 'white', px: 1, py: 0.5, borderTopLeftRadius: 4 }}>
                      <Typography variant="caption">{tutorial.duration}</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ p: 2, flexGrow: 1 }}>
                    <Chip
                      label={getCategoryLabel(tutorial.category)}
                      color={getCategoryColor(tutorial.category)}
                      size="small"
                      sx={{ mb: 1 }}
                    />
                    <Typography variant="h6" component="h3" gutterBottom>
                      {tutorial.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {tutorial.description}
                    </Typography>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          // If no tutorials match the filters, render an EmptyState component
          <EmptyState
            title="No tutorials found"
            description="Try adjusting your search or filters to find tutorials."
            icon={<VideoIcon />}
            action={<Button variant="contained" onClick={handleClearFilters}>Clear Filters</Button>}
          />
        )
      )}
    </HelpLayout>
  );
};

export default TutorialsPage;