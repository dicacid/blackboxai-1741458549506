import React, { useState } from 'react';
import {
  Paper,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Grid,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormGroup,
  FormControlLabel,
  TextField,
  useTheme,
} from '@mui/material';
import {
  FileDownload as ExportIcon,
  PictureAsPdf as PdfIcon,
  TableChart as CsvIcon,
} from '@mui/icons-material';
import type { AnalyticsExport } from '../../types';
import analyticsService from '../../services/analyticsService';

interface ExportAnalyticsProps {
  className?: string;
}

interface ExportOptions {
  format: 'csv' | 'pdf';
  dateRange: {
    start: string;
    end: string;
  };
  metrics: string[];
  includeCharts: boolean;
  customization: {
    logo: boolean;
    title: string;
    notes: string;
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

const ExportAnalytics: React.FC<ExportAnalyticsProps> = ({ className }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState<ExportOptions>({
    format: 'pdf',
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      end: new Date().toISOString(),
    },
    metrics: ['users', 'revenue', 'performance'],
    includeCharts: true,
    customization: {
      logo: true,
      title: 'Analytics Report',
      notes: '',
    },
  });

  const handleFormatChange = (format: 'csv' | 'pdf') => {
    setOptions(prev => ({ ...prev, format }));
  };

  const handleDateChange = (type: 'start' | 'end', value: string) => {
    setOptions(prev => ({
      ...prev,
      dateRange: { ...prev.dateRange, [type]: value },
    }));
  };

  const handleMetricToggle = (metricId: string) => {
    setOptions(prev => ({
      ...prev,
      metrics: prev.metrics.includes(metricId)
        ? prev.metrics.filter(id => id !== metricId)
        : [...prev.metrics, metricId],
    }));
  };

  const handleCustomizationChange = (
    field: keyof ExportOptions['customization'],
    value: string | boolean
  ) => {
    setOptions(prev => ({
      ...prev,
      customization: { ...prev.customization, [field]: value },
    }));
  };

  const handleExport = async () => {
    try {
      setLoading(true);
      setError(null);

      const exportData: AnalyticsExport = {
        format: options.format,
        data: null,
        filters: {
          dateRange: {
            start: options.dateRange.start,
            end: options.dateRange.end,
          },
          metrics: options.metrics,
        },
        includeCharts: options.includeCharts,
        customization: options.customization,
      };

      const blob = await analyticsService.exportAnalytics(
        options.format,
        exportData
      );

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `analytics-report.${options.format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to export analytics data');
      console.error('Error exporting analytics data:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderFormatSelection = () => (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Typography variant="subtitle1" gutterBottom>
          Export Format
        </Typography>
      </Grid>
      <Grid item xs={12} sm={6}>
        <Button
          fullWidth
          variant={options.format === 'pdf' ? 'contained' : 'outlined'}
          startIcon={<PdfIcon />}
          onClick={() => handleFormatChange('pdf')}
          sx={{ height: '100%' }}
        >
          PDF Report
        </Button>
      </Grid>
      <Grid item xs={12} sm={6}>
        <Button
          fullWidth
          variant={options.format === 'csv' ? 'contained' : 'outlined'}
          startIcon={<CsvIcon />}
          onClick={() => handleFormatChange('csv')}
          sx={{ height: '100%' }}
        >
          CSV Data
        </Button>
      </Grid>
    </Grid>
  );

  const renderDateRange = () => (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Typography variant="subtitle1" gutterBottom>
          Date Range
        </Typography>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          type="date"
          label="Start Date"
          value={options.dateRange.start.split('T')[0]}
          onChange={(e) => handleDateChange('start', new Date(e.target.value).toISOString())}
          InputLabelProps={{ shrink: true }}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          type="date"
          label="End Date"
          value={options.dateRange.end.split('T')[0]}
          onChange={(e) => handleDateChange('end', new Date(e.target.value).toISOString())}
          InputLabelProps={{ shrink: true }}
        />
      </Grid>
    </Grid>
  );

  const renderMetricSelection = () => (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Typography variant="subtitle1" gutterBottom>
          Metrics to Include
        </Typography>
      </Grid>
      <Grid item xs={12}>
        <FormGroup>
          {AVAILABLE_METRICS.map((metric) => (
            <FormControlLabel
              key={metric.id}
              control={
                <Checkbox
                  checked={options.metrics.includes(metric.id)}
                  onChange={() => handleMetricToggle(metric.id)}
                />
              }
              label={metric.label}
            />
          ))}
        </FormGroup>
      </Grid>
    </Grid>
  );

  const renderCustomization = () => (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Typography variant="subtitle1" gutterBottom>
          Report Customization
        </Typography>
      </Grid>
      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Checkbox
              checked={options.includeCharts}
              onChange={(e) => setOptions(prev => ({
                ...prev,
                includeCharts: e.target.checked,
              }))}
            />
          }
          label="Include Charts and Visualizations"
        />
      </Grid>
      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Checkbox
              checked={options.customization.logo}
              onChange={(e) => handleCustomizationChange('logo', e.target.checked)}
            />
          }
          label="Include Company Logo"
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Report Title"
          value={options.customization.title}
          onChange={(e) => handleCustomizationChange('title', e.target.value)}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          multiline
          rows={4}
          label="Additional Notes"
          value={options.customization.notes}
          onChange={(e) => handleCustomizationChange('notes', e.target.value)}
        />
      </Grid>
    </Grid>
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
        <Grid container spacing={4}>
          <Grid item xs={12}>
            <Typography variant="h5" gutterBottom>
              Export Analytics Data
            </Typography>
          </Grid>

          <Grid item xs={12}>
            {renderFormatSelection()}
          </Grid>

          <Grid item xs={12}>
            {renderDateRange()}
          </Grid>

          <Grid item xs={12}>
            {renderMetricSelection()}
          </Grid>

          <Grid item xs={12}>
            {renderCustomization()}
          </Grid>

          <Grid item xs={12}>
            <Button
              fullWidth
              size="large"
              variant="contained"
              startIcon={loading ? <CircularProgress size={20} /> : <ExportIcon />}
              onClick={handleExport}
              disabled={loading || options.metrics.length === 0}
            >
              {loading ? 'Exporting...' : 'Export Analytics'}
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default ExportAnalytics;
