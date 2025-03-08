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
  Checkbox,
  RadioGroup,
  Radio,
  TextField,
  Box,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  GetApp as ExportIcon,
  PictureAsPdf as PdfIcon,
  TableChart as CsvIcon,
} from '@mui/icons-material';

import { useAnalytics } from './AnalyticsProvider';
import analyticsService from '../../services/analyticsService';

type ExportFormat = 'csv' | 'pdf';

interface ExportSettings {
  format: ExportFormat;
  includeCharts: boolean;
  includeTables: boolean;
  includeMetrics: boolean;
  customization: {
    title: string;
    logo: boolean;
    notes: string;
  };
}

interface AnalyticsExportProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  data?: any;
}

const DEFAULT_SETTINGS: ExportSettings = {
  format: 'csv',
  includeCharts: true,
  includeTables: true,
  includeMetrics: true,
  customization: {
    title: 'Analytics Export',
    logo: true,
    notes: '',
  },
};

const AnalyticsExport: React.FC<AnalyticsExportProps> = ({
  open,
  onClose,
  title = 'Analytics Export',
  data,
}) => {
  const { timeRange, filters } = useAnalytics();
  const [settings, setSettings] = useState<ExportSettings>({
    ...DEFAULT_SETTINGS,
    customization: {
      ...DEFAULT_SETTINGS.customization,
      title,
    },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFormatChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSettings(prev => ({
      ...prev,
      format: event.target.value as ExportFormat,
    }));
  };

  const handleToggle = (name: keyof Omit<ExportSettings, 'format' | 'customization'>) => {
    setSettings(prev => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  const handleCustomizationChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = event.target;
    setSettings(prev => ({
      ...prev,
      customization: {
        ...prev.customization,
        [name]: type === 'checkbox' ? (event.target as HTMLInputElement).checked : value,
      },
    }));
  };

  const handleExport = async () => {
    try {
      setLoading(true);
      setError(null);

      const blob = await analyticsService.exportAnalytics(settings.format, {
        timeRange,
        filters: filters || {},
        includeCharts: settings.includeCharts,
        customization: settings.customization,
        data,
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `analytics-export-${new Date().toISOString()}.${settings.format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export analytics data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Export Analytics</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Export Format
          </Typography>
          <RadioGroup row value={settings.format} onChange={handleFormatChange}>
            <FormControlLabel
              value="csv"
              control={<Radio />}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CsvIcon />
                  CSV
                </Box>
              }
            />
            <FormControlLabel
              value="pdf"
              control={<Radio />}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PdfIcon />
                  PDF
                </Box>
              }
            />
          </RadioGroup>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Include Content
          </Typography>
          <FormGroup>
            <FormControlLabel
              control={
                <Checkbox
                  checked={settings.includeCharts}
                  onChange={() => handleToggle('includeCharts')}
                />
              }
              label="Charts and Visualizations"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={settings.includeTables}
                  onChange={() => handleToggle('includeTables')}
                />
              }
              label="Data Tables"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={settings.includeMetrics}
                  onChange={() => handleToggle('includeMetrics')}
                />
              }
              label="Metrics and KPIs"
            />
          </FormGroup>
        </Box>

        {settings.format === 'pdf' && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Customization
            </Typography>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <TextField
                label="Report Title"
                name="title"
                value={settings.customization.title}
                onChange={handleCustomizationChange}
                size="small"
              />
            </FormControl>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <TextField
                label="Notes"
                name="notes"
                value={settings.customization.notes}
                onChange={handleCustomizationChange}
                multiline
                rows={3}
                size="small"
              />
            </FormControl>
            <FormControlLabel
              control={
                <Checkbox
                  checked={settings.customization.logo}
                  onChange={handleCustomizationChange}
                  name="logo"
                />
              }
              label="Include Logo"
            />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleExport}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <ExportIcon />}
        >
          Export
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AnalyticsExport;
