import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  FormControlLabel,
  FormGroup,
  Switch,
  Select,
  MenuItem,
  TextField,
  Box,
  Typography,
  Divider,
  Alert,
  useTheme,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Timer as TimerIcon,
  Palette as PaletteIcon,
  Language as LanguageIcon,
} from '@mui/icons-material';

import { useAnalytics } from './AnalyticsProvider';

interface AnalyticsSettingsProps {
  open: boolean;
  onClose: () => void;
}

interface SettingsState {
  refreshInterval: number;
  autoRefresh: boolean;
  display: {
    theme: 'light' | 'dark' | 'system';
    decimals: number;
    currency: string;
    timezone: string;
  };
}

const DEFAULT_SETTINGS: SettingsState = {
  refreshInterval: 30000,
  autoRefresh: true,
  display: {
    theme: 'system',
    decimals: 2,
    currency: 'USD',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  },
};

const CURRENCIES = [
  { value: 'USD', label: 'US Dollar ($)' },
  { value: 'EUR', label: 'Euro (€)' },
  { value: 'GBP', label: 'British Pound (£)' },
  { value: 'JPY', label: 'Japanese Yen (¥)' },
  { value: 'ETH', label: 'Ethereum (Ξ)' },
];

const THEMES = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

const AnalyticsSettings: React.FC<AnalyticsSettingsProps> = ({
  open,
  onClose,
}) => {
  const theme = useTheme();
  const { preferences, updatePreferences } = useAnalytics();
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (section: keyof SettingsState, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: typeof prev[section] === 'object'
        ? { ...prev[section], [field]: value }
        : value,
    }));
  };

  const handleSave = async () => {
    try {
      setError(null);
      await updatePreferences({
        theme: settings.display.theme,
        decimals: settings.display.decimals,
        currency: settings.display.currency,
        timezone: settings.display.timezone,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Analytics Settings</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <TimerIcon />
            <Typography variant="subtitle2">Refresh Settings</Typography>
          </Box>
          <FormGroup>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.autoRefresh}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    autoRefresh: e.target.checked,
                  }))}
                />
              }
              label="Auto Refresh"
            />
            <FormControl fullWidth sx={{ mt: 1 }}>
              <TextField
                label="Refresh Interval (ms)"
                type="number"
                value={settings.refreshInterval}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  refreshInterval: Number(e.target.value),
                }))}
                disabled={!settings.autoRefresh}
                size="small"
              />
            </FormControl>
          </FormGroup>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <PaletteIcon />
            <Typography variant="subtitle2">Display Settings</Typography>
          </Box>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <Typography variant="caption" gutterBottom>
              Theme
            </Typography>
            <Select
              value={settings.display.theme}
              onChange={(e) => handleChange('display', 'theme', e.target.value)}
              size="small"
            >
              {THEMES.map(({ value, label }) => (
                <MenuItem key={value} value={value}>{label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <Typography variant="caption" gutterBottom>
              Currency
            </Typography>
            <Select
              value={settings.display.currency}
              onChange={(e) => handleChange('display', 'currency', e.target.value)}
              size="small"
            >
              {CURRENCIES.map(({ value, label }) => (
                <MenuItem key={value} value={value}>{label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <Typography variant="caption" gutterBottom>
              Decimal Places
            </Typography>
            <TextField
              type="number"
              value={settings.display.decimals}
              onChange={(e) => handleChange('display', 'decimals', Number(e.target.value))}
              size="small"
              inputProps={{ min: 0, max: 8 }}
            />
          </FormControl>
          <FormControl fullWidth>
            <Typography variant="caption" gutterBottom>
              Timezone
            </Typography>
            <Select
              value={settings.display.timezone}
              onChange={(e) => handleChange('display', 'timezone', e.target.value)}
              size="small"
            >
              {Intl.supportedValuesOf('timeZone').map((zone) => (
                <MenuItem key={zone} value={zone}>{zone}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          startIcon={<SettingsIcon />}
        >
          Save Settings
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AnalyticsSettings;
