import React, { useEffect, useState } from 'react';
import {
  Paper,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  useTheme,
} from '@mui/material';
import {
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import type { FraudDetectionAlert } from '../../types';
import analyticsService from '../../services/analyticsService';

interface FraudDetectionDashboardProps {
  className?: string;
}

interface AlertFilters {
  severity?: 'low' | 'medium' | 'high' | 'critical';
  type?: 'bot_activity' | 'price_manipulation' | 'suspicious_pattern' | 'bulk_purchase';
  status?: 'new' | 'investigating' | 'resolved' | 'false_positive';
  startDate?: string;
  endDate?: string;
}

const FraudDetectionDashboard: React.FC<FraudDetectionDashboardProps> = ({ className }) => {
  const theme = useTheme();
  const [alerts, setAlerts] = useState<FraudDetectionAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AlertFilters>({});
  const [selectedAlert, setSelectedAlert] = useState<FraudDetectionAlert | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [resolution, setResolution] = useState('');

  useEffect(() => {
    fetchAlerts();
  }, [filters]);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await analyticsService.getFraudAlerts(filters);
      setAlerts(data);
    } catch (err) {
      setError('Failed to fetch fraud alerts');
      console.error('Error fetching fraud alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (
    alertId: string,
    status: FraudDetectionAlert['status'],
    resolution?: string
  ) => {
    try {
      await fetch(`/api/fraud-alerts/${alertId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, resolution }),
      });

      setAlerts(prev =>
        prev.map(alert =>
          alert.id === alertId
            ? { ...alert, status, resolution }
            : alert
        )
      );

      setDialogOpen(false);
      setResolution('');
    } catch (err) {
      console.error('Error updating alert status:', err);
    }
  };

  const handleFilterChange = (key: keyof AlertFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  const getSeverityIcon = (severity: FraudDetectionAlert['severity']) => {
    switch (severity) {
      case 'critical':
        return <ErrorIcon color="error" />;
      case 'high':
        return <WarningIcon sx={{ color: theme.palette.warning.main }} />;
      case 'medium':
        return <WarningIcon sx={{ color: theme.palette.warning.light }} />;
      case 'low':
        return <WarningIcon sx={{ color: theme.palette.info.main }} />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: FraudDetectionAlert['status']) => {
    switch (status) {
      case 'new':
        return theme.palette.error.main;
      case 'investigating':
        return theme.palette.warning.main;
      case 'resolved':
        return theme.palette.success.main;
      case 'false_positive':
        return theme.palette.info.main;
      default:
        return theme.palette.grey[500];
    }
  };

  if (error) {
    return (
      <Alert severity="error" className={className}>
        {error}
      </Alert>
    );
  }

  if (loading) {
    return (
      <Box
        className={className}
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: 400,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box className={className}>
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6">Fraud Alerts</Typography>
        <Grid container spacing={2}>
          {alerts.map((alert) => (
            <Grid item xs={12} sm={6} md={4} key={alert.id}>
              <Paper sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
                {getSeverityIcon(alert.severity)}
                <Box sx={{ ml: 2 }}>
                  <Typography variant="body1">{alert.type}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {alert.details.pattern || 'No pattern detected'}
                  </Typography>
                  <Chip
                    label={alert.status}
                    sx={{ bgcolor: getStatusColor(alert.status), mt: 1 }}
                  />
                </Box>
                <IconButton
                  onClick={() => {
                    setSelectedAlert(alert);
                    setDialogOpen(true);
                  }}
                  sx={{ ml: 'auto' }}
                >
                  <AssignmentIcon />
                </IconButton>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        {selectedAlert && (
          <>
            <DialogTitle>
              Alert Details
              {getSeverityIcon(selectedAlert.severity)}
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">Type</Typography>
                  <Typography variant="body1">{selectedAlert.type.replace('_', ' ')}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">Details</Typography>
                  <Typography variant="body1">{selectedAlert.details.pattern}</Typography>
                </Grid>
                {selectedAlert.details.transactions && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">Transactions</Typography>
                    {selectedAlert.details.transactions.map((tx) => (
                      <Typography key={tx} variant="body2">{tx}</Typography>
                    ))}
                  </Grid>
                )}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Resolution Notes"
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button
                onClick={() => handleUpdateStatus(selectedAlert.id, 'investigating', resolution)}
                color="warning"
              >
                Mark as Investigating
              </Button>
              <Button
                onClick={() => handleUpdateStatus(selectedAlert.id, 'resolved', resolution)}
                color="success"
              >
                Mark as Resolved
              </Button>
              <Button
                onClick={() => handleUpdateStatus(selectedAlert.id, 'false_positive', resolution)}
                color="info"
              >
                Mark as False Positive
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default FraudDetectionDashboard;
