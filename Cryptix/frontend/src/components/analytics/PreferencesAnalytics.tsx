import React, { useEffect, useState } from 'react';
import {
  Paper,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Button,
  Divider,
  useTheme,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Refresh as RefreshIcon,
  Storage as StorageIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';

interface PreferencesAnalyticsProps {
  className?: string;
}

interface AnalyticsPreferences {
  notifications: {
    enabled: boolean;
    frequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
    metrics: string[];
    threshold: number;
  };
  autoRefresh: {
    enabled: boolean;
    interval: number;
    metrics: string[];
  };
  storage: {
    retentionPeriod: number;
    compressionEnabled: boolean;
    backupEnabled: boolean;
    backupFrequency: 'daily' | 'weekly' | 'monthly';
  };
  display: {
    defaultView: 'overview' | 'detailed';
    theme: 'light' | 'dark' | 'system';
    chartAnimations: boolean;
    decimalPlaces: number;
  };
}

const AVAILABLE_METRICS = [
  { id: 'users', label: 'User Activity' },
  { id: 'revenue', label: 'Revenue' },
  { id: 'performance', label: 'Performance' },
  { id: 'security', label: 'Security' },
  { id: 'blockchain', label: 'Blockchain' },
  { id: 'market', label: 'Market' },
  { id: 'recommendations', label: 'Recommendations' },
  { id: 'errors', label: 'Errors' },
  { id: 'network', label: 'Network' },
];

const PreferencesAnalytics: React.FC<PreferencesAnalyticsProps> = ({ className }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<AnalyticsPreferences>({
    notifications: {
      enabled: true,
      frequency: 'daily',
      metrics: ['users', 'revenue', 'security'],
      threshold: 10,
    },
    autoRefresh: {
      enabled: true,
      interval: 30,
      metrics: ['users', 'revenue', 'performance'],
    },
    storage: {
      retentionPeriod: 90,
      compressionEnabled: true,
      backupEnabled: true,
      backupFrequency: 'daily',
    },
    display: {
      defaultView: 'overview',
      theme: 'system',
      chartAnimations: true,
      decimalPlaces: 2,
    },
  });
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      // In a real app, this would load from an API or local storage
      await new Promise(resolve => setTimeout(resolve, 500));
      // Simulated data already set in initial state
      setLoading(false);
    } catch (err) {
      setError('Failed to load preferences');
      console.error('Error loading preferences:', err);
    }
  };

  const savePreferences = async () => {
    try {
      setLoading(true);
      // In a real app, this would save to an API or local storage
      await new Promise(resolve => setTimeout(resolve, 500));
      setHasChanges(false);
      setLoading(false);
    } catch (err) {
      setError('Failed to save preferences');
      console.error('Error saving preferences:', err);
    }
  };

  const handleNotificationChange = (
    field: keyof AnalyticsPreferences['notifications'],
    value: any
  ) => {
    setPreferences(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [field]: value,
      },
    }));
    setHasChanges(true);
  };

  const handleAutoRefreshChange = (
    field: keyof AnalyticsPreferences['autoRefresh'],
    value: any
  ) => {
    setPreferences(prev => ({
      ...prev,
      autoRefresh: {
        ...prev.autoRefresh,
        [field]: value,
      },
    }));
    setHasChanges(true);
  };

  const handleStorageChange = (
    field: keyof AnalyticsPreferences['storage'],
    value: any
  ) => {
    setPreferences(prev => ({
      ...prev,
      storage: {
        ...prev.storage,
        [field]: value,
      },
    }));
    setHasChanges(true);
  };

  const handleDisplayChange = (
    field: keyof AnalyticsPreferences['display'],
    value: any
  ) => {
    setPreferences(prev => ({
      ...prev,
      display: {
        ...prev.display,
        [field]: value,
      },
    }));
    setHasChanges(true);
  };

  const renderNotificationSettings = () => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <NotificationsIcon sx={{ mr: 2, color: theme.palette.primary.main }} />
          <Typography variant="h6">Notification Preferences</Typography>
        </Box>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.notifications.enabled}
                  onChange={(e) => handleNotificationChange('enabled', e.target.checked)}
                />
              }
              label="Enable Analytics Notifications"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Notification Frequency</InputLabel>
              <Select
                value={preferences.notifications.frequency}
                label="Notification Frequency"
                onChange={(e) => handleNotificationChange('frequency', e.target.value)}
                disabled={!preferences.notifications.enabled}
              >
                <MenuItem value="realtime">Real-time</MenuItem>
                <MenuItem value="hourly">Hourly</MenuItem>
                <MenuItem value="daily">Daily</MenuItem>
                <MenuItem value="weekly">Weekly</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="number"
              label="Alert Threshold (%)"
              value={preferences.notifications.threshold}
              onChange={(e) => handleNotificationChange('threshold', parseInt(e.target.value))}
              disabled={!preferences.notifications.enabled}
              inputProps={{ min: 0, max: 100 }}
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderAutoRefreshSettings = () => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <RefreshIcon sx={{ mr: 2, color: theme.palette.secondary.main }} />
          <Typography variant="h6">Auto-Refresh Settings</Typography>
        </Box>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.autoRefresh.enabled}
                  onChange={(e) => handleAutoRefreshChange('enabled', e.target.checked)}
                />
              }
              label="Enable Auto-Refresh"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              type="number"
              label="Refresh Interval (seconds)"
              value={preferences.autoRefresh.interval}
              onChange={(e) => handleAutoRefreshChange('interval', parseInt(e.target.value))}
              disabled={!preferences.autoRefresh.enabled}
              inputProps={{ min: 5, max: 3600 }}
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderStorageSettings = () => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <StorageIcon sx={{ mr: 2, color: theme.palette.success.main }} />
          <Typography variant="h6">Storage Settings</Typography>
        </Box>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="number"
              label="Data Retention Period (days)"
              value={preferences.storage.retentionPeriod}
              onChange={(e) => handleStorageChange('retentionPeriod', parseInt(e.target.value))}
              inputProps={{ min: 1, max: 365 }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Backup Frequency</InputLabel>
              <Select
                value={preferences.storage.backupFrequency}
                label="Backup Frequency"
                onChange={(e) => handleStorageChange('backupFrequency', e.target.value)}
                disabled={!preferences.storage.backupEnabled}
              >
                <MenuItem value="daily">Daily</MenuItem>
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="monthly">Monthly</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.storage.compressionEnabled}
                  onChange={(e) => handleStorageChange('compressionEnabled', e.target.checked)}
                />
              }
              label="Enable Data Compression"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.storage.backupEnabled}
                  onChange={(e) => handleStorageChange('backupEnabled', e.target.checked)}
                />
              }
              label="Enable Automated Backups"
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderDisplaySettings = () => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <VisibilityIcon sx={{ mr: 2, color: theme.palette.info.main }} />
          <Typography variant="h6">Display Settings</Typography>
        </Box>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Default View</InputLabel>
              <Select
                value={preferences.display.defaultView}
                label="Default View"
                onChange={(e) => handleDisplayChange('defaultView', e.target.value)}
              >
                <MenuItem value="overview">Overview</MenuItem>
                <MenuItem value="detailed">Detailed</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Theme</InputLabel>
              <Select
                value={preferences.display.theme}
                label="Theme"
                onChange={(e) => handleDisplayChange('theme', e.target.value)}
              >
                <MenuItem value="light">Light</MenuItem>
                <MenuItem value="dark">Dark</MenuItem>
                <MenuItem value="system">System</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.display.chartAnimations}
                  onChange={(e) => handleDisplayChange('chartAnimations', e.target.checked)}
                />
              }
              label="Enable Chart Animations"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="number"
              label="Decimal Places"
              value={preferences.display.decimalPlaces}
              onChange={(e) => handleDisplayChange('decimalPlaces', parseInt(e.target.value))}
              inputProps={{ min: 0, max: 4 }}
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  if (error) {
    return (
      <Alert severity="error" className={className}>
        {error}
      </Alert>
    );
  }

  return (
    <Box className={className}>
      <Paper sx={{ p: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h5" gutterBottom>
              Analytics Preferences
            </Typography>
          </Grid>

          <Grid item xs={12}>
            {renderNotificationSettings()}
          </Grid>

          <Grid item xs={12}>
            {renderAutoRefreshSettings()}
          </Grid>

          <Grid item xs={12}>
            {renderStorageSettings()}
          </Grid>

          <Grid item xs={12}>
            {renderDisplaySettings()}
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={loadPreferences}
                disabled={loading}
              >
                Reset
              </Button>
              <Button
                variant="contained"
                onClick={savePreferences}
                disabled={loading || !hasChanges}
                startIcon={loading ? <CircularProgress size={20} /> : undefined}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default PreferencesAnalytics;
