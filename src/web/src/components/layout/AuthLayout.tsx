import React, { useEffect } from 'react'; // react v18.2.0
import { useRouter } from 'next/router'; // next/router v13.4.0
import Image from 'next/image'; // next/image v13.4.0
import { Box, Container, Paper, Typography, useTheme, Grid } from '@mui/material'; // v5.13.0
import { AuthLayoutProps } from '../../types/ui.types';
import useResponsive from '../../hooks/useResponsive';
import { useAuthContext } from '../../context/AuthContext';

/**
 * Component that provides the layout structure for authentication-related pages
 * in the HCBS Revenue Management System. This layout is used for login, forgot
 * password, reset password, and MFA verification screens.
 */
const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title }) => {
  const router = useRouter();
  const theme = useTheme();
  const { isMobile } = useResponsive();
  const { isAuthenticated } = useAuthContext();
  
  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, router]);
  
  // Return null during redirect to prevent flash of content
  if (isAuthenticated) {
    return null;
  }
  
  // Styles
  const authContainer = {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    backgroundColor: 'background.default'
  };
  
  const brandingColumn = {
    display: { xs: 'none', md: 'flex' },
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'primary.main',
    color: 'primary.contrastText',
    padding: 4,
    borderRadius: 1
  };
  
  const formPaper = {
    padding: { xs: 3, sm: 4 },
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
    maxWidth: '450px',
    margin: '0 auto',
    borderRadius: 1,
    boxShadow: 3
  };
  
  const logo = {
    marginBottom: 3,
    width: '180px',
    height: 'auto'
  };
  
  const titleStyle = {
    marginBottom: 4,
    fontWeight: 'fontWeightBold'
  };
  
  const footer = {
    marginTop: 4,
    textAlign: 'center',
    color: 'text.secondary',
    fontSize: '0.75rem'
  };
  
  return (
    <Box sx={authContainer}>
      <Container maxWidth="lg" sx={{ flex: 1, display: 'flex', alignItems: 'center', py: 4 }}>
        <Grid container spacing={3} sx={{ minHeight: { xs: '80vh', md: '70vh' } }}>
          {/* Branding column (hidden on mobile) */}
          <Grid item xs={12} md={6} sx={brandingColumn}>
            <Box sx={{ maxWidth: '80%' }}>
              <Image
                src="/logo-white.png"
                alt="Thinkcaring"
                width={240}
                height={80}
                priority
              />
              <Typography variant="h4" sx={{ mt: 4, fontWeight: 'fontWeightBold' }}>
                HCBS Revenue Management System
              </Typography>
              <Typography variant="body1" sx={{ mt: 2 }}>
                Streamline your billing processes, enhance financial visibility, and ensure compliance with Medicaid and other payer requirements.
              </Typography>
            </Box>
          </Grid>
          
          {/* Form column */}
          <Grid
            item
            xs={12}
            md={6}
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: { xs: 2, sm: 4 }
            }}
          >
            <Paper 
              elevation={3} 
              sx={formPaper}
              component="main" 
              aria-labelledby="auth-title"
              tabIndex={-1}
            >
              {/* Logo (centered at top of form) */}
              <Box sx={logo}>
                <Image
                  src="/logo.png"
                  alt="Thinkcaring"
                  width={180}
                  height={60}
                  priority
                />
              </Box>
              
              {/* Page title */}
              <Typography 
                variant="h5" 
                component="h1" 
                sx={titleStyle}
                id="auth-title"
              >
                {title}
              </Typography>
              
              {/* Authentication form content */}
              <Box sx={{ width: '100%' }}>
                {children}
              </Box>
              
              {/* Footer */}
              <Typography variant="caption" sx={footer}>
                &copy; {new Date().getFullYear()} Thinkcaring. All rights reserved.
                <br />
                Version {process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'}
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default AuthLayout;