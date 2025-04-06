import { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Paper,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  Alert,
  Snackbar,
} from '@mui/material';

// Tab panel component
function TabPanel({ children, value, index }) {
  return (
    <Box role="tabpanel" hidden={value !== index} sx={{ py: 3 }}>
      {value === index && children}
    </Box>
  );
}

function SettingsPage() {
  const [tabValue, setTabValue] = useState(0);
  const [settings, setSettings] = useState({
    general: {
      siteName: 'XII-OS Dashboard',
      logoUrl: '/logo.png',
      theme: 'light',
    },
    api: {
      endpoint: 'http://localhost:3000/api',
      timeout: 30000,
      retries: 3,
    },
    notifications: {
      email: true,
      browser: true,
      slack: false,
      slackWebhook: '',
    },
    security: {
      sessionTimeout: 60,
      maxLoginAttempts: 5,
      enforceStrongPasswords: true,
    },
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleChange = (section, field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setSettings({
      ...settings,
      [section]: {
        ...settings[section],
        [field]: value,
      },
    });
  };

  const handleSave = () => {
    // In a real application, this would send the settings to an API
    console.log('Saving settings:', settings);
    setSnackbar({
      open: true,
      message: 'Settings saved successfully!',
      severity: 'success',
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        System Settings
      </Typography>
      
      <Paper sx={{ mt: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="General" />
          <Tab label="API" />
          <Tab label="Notifications" />
          <Tab label="Security" />
        </Tabs>
        
        {/* General Settings */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Site Name"
                value={settings.general.siteName}
                onChange={handleChange('general', 'siteName')}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Logo URL"
                value={settings.general.logoUrl}
                onChange={handleChange('general', 'logoUrl')}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Theme</InputLabel>
                <Select
                  value={settings.general.theme}
                  label="Theme"
                  onChange={handleChange('general', 'theme')}
                >
                  <MenuItem value="light">Light</MenuItem>
                  <MenuItem value="dark">Dark</MenuItem>
                  <MenuItem value="system">System Default</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* API Settings */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="API Endpoint"
                value={settings.api.endpoint}
                onChange={handleChange('api', 'endpoint')}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Request Timeout (ms)"
                type="number"
                value={settings.api.timeout}
                onChange={handleChange('api', 'timeout')}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Max Retries"
                type="number"
                value={settings.api.retries}
                onChange={handleChange('api', 'retries')}
              />
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* Notification Settings */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.notifications.email}
                    onChange={handleChange('notifications', 'email')}
                  />
                }
                label="Email Notifications"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.notifications.browser}
                    onChange={handleChange('notifications', 'browser')}
                  />
                }
                label="Browser Notifications"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.notifications.slack}
                    onChange={handleChange('notifications', 'slack')}
                  />
                }
                label="Slack Notifications"
              />
            </Grid>
            {settings.notifications.slack && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Slack Webhook URL"
                  value={settings.notifications.slackWebhook}
                  onChange={handleChange('notifications', 'slackWebhook')}
                />
              </Grid>
            )}
          </Grid>
        </TabPanel>
        
        {/* Security Settings */}
        <TabPanel value={tabValue} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Session Timeout (minutes)"
                type="number"
                value={settings.security.sessionTimeout}
                onChange={handleChange('security', 'sessionTimeout')}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Max Login Attempts"
                type="number"
                value={settings.security.maxLoginAttempts}
                onChange={handleChange('security', 'maxLoginAttempts')}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.security.enforceStrongPasswords}
                    onChange={handleChange('security', 'enforceStrongPasswords')}
                  />
                }
                label="Enforce Strong Passwords"
              />
            </Grid>
          </Grid>
        </TabPanel>
        
        <Divider />
        
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="outlined" sx={{ mr: 1 }}>
            Reset
          </Button>
          <Button variant="contained" color="primary" onClick={handleSave}>
            Save Changes
          </Button>
        </Box>
      </Paper>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default SettingsPage; 