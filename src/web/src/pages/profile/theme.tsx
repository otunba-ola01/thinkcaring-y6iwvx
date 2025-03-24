import React, { useCallback } from 'react'; // react v18.2.0
import Head from 'next/head'; // ^13.0.0
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  FormControl,
  FormControlLabel,
  RadioGroup,
  Radio,
  Switch,
  Divider,
  Button,
} from '@mui/material'; // 5.13+
import LightModeIcon from '@mui/icons-material/LightMode'; // 5.13+
import DarkModeIcon from '@mui/icons-material/DarkMode'; // 5.13+
import SettingsBrightnessIcon from '@mui/icons-material/SettingsBrightness'; // 5.13+
import AccessibilityNewIcon from '@mui/icons-material/AccessibilityNew'; // 5.13+

import ProfileLayout from '../../components/layout/ProfileLayout';
import { useTheme } from '../../context/ThemeContext';
import { ThemeMode } from '../../types/common.types';

/**
 * Page component for theme settings in the user profile
 * Allows users to customize the appearance of the application by selecting a theme mode and toggling high contrast mode.
 */
const ThemePage: React.FC = () => {
  // Access theme settings and toggle functions from the ThemeContext
  const { themeMode, setThemeMode, highContrast, toggleHighContrast } = useTheme();

  /**
   * Handles theme mode change when user selects a different mode
   * @param {React.ChangeEvent<HTMLInputElement>} event - The change event from the radio button group
   */
  const handleThemeModeChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    // Extract the selected value from event.target.value
    const selectedValue = event.target.value as ThemeMode;
    // Call setThemeMode with the selected theme mode
    setThemeMode(selectedValue);
  }, [setThemeMode]);

  return (
    <ProfileLayout activeTab="theme">
      {/* Set page title using Next.js Head component */}
      <Head>
        <title>Theme Settings | HCBS Revenue Management</title>
      </Head>

      {/* Page header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Theme Settings
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Customize the appearance of the application to suit your preferences.
        </Typography>
      </Box>

      {/* Theme settings cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
          gap: 3,
        }}
      >
        {/* Theme mode selection card */}
        <Card elevation={1}>
          <CardHeader title="Theme Mode" subheader="Choose between light, dark, or system theme" />
          <CardContent>
            <FormControl component="fieldset">
              <RadioGroup
                aria-label="theme-mode"
                name="theme-mode"
                value={themeMode}
                onChange={handleThemeModeChange}
              >
                <FormControlLabel
                  value={ThemeMode.LIGHT}
                  control={<Radio />}
                  label="Light Mode"
                  sx={{ mb: 1 }}
                />
                <FormControlLabel
                  value={ThemeMode.DARK}
                  control={<Radio />}
                  label="Dark Mode"
                  sx={{ mb: 1 }}
                />
                <FormControlLabel
                  value={ThemeMode.SYSTEM}
                  control={<Radio />}
                  label="System Default"
                  sx={{ mb: 1 }}
                />
              </RadioGroup>
            </FormControl>
          </CardContent>
        </Card>

        {/* High contrast mode toggle card */}
        <Card elevation={1}>
          <CardHeader title="Accessibility" subheader="Adjust settings for better visibility" />
          <CardContent>
            <FormControl component="fieldset" fullWidth>
              <FormControlLabel
                control={<Switch checked={highContrast} onChange={toggleHighContrast} />}
                label="High Contrast Mode"
                sx={{ mb: 1 }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Increases contrast for better readability and visibility.
              </Typography>
            </FormControl>
          </CardContent>
        </Card>

        {/* Theme preview card */}
        <Card elevation={1} sx={{ gridColumn: { xs: '1', md: '1 / 3' } }}>
          <CardHeader title="Theme Preview" subheader="See how your selected theme looks" />
          <CardContent>
            <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <Typography variant="h6" gutterBottom>
                Sample Content
              </Typography>
              <Typography variant="body1" paragraph>
                This is how text and UI elements will appear with your current theme settings.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 2 }}>
                <Button variant="contained" color="primary">
                  Primary Button
                </Button>
                <Button variant="contained" color="secondary">
                  Secondary Button
                </Button>
                <Button variant="outlined" color="primary">
                  Outlined Button
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </ProfileLayout>
  );
};

export default ThemePage;