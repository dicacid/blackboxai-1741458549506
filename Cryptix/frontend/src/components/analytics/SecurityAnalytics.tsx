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
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
} from '@mui/material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Security as SecurityIcon,
  Gavel as ComplianceIcon,
  Shield as ThreatIcon,
  Lock as AuthIcon,
} from '@mui/icons-material';
import type { ChartTooltipProps } from '../../types';

interface SecurityAnalyticsProps {
  className?: string;
}

interface SecurityMetrics {
  overview: {
    securityScore: number;
    threatLevel: 'low' | 'medium' | 'high' | 'critical';
    activeThreats: number;
    resolvedThreats: number;
    vulnerabilities: number;
    complianceScore: number;
  };
  authentication: {
    failedLogins: number;
    successfulLogins: number;
    mfaEnabled: number;
    mfaDisabled: number;
    suspiciousAttempts: number;
    blockedIPs: number;
  };
  threats: {
    current: Array<{
      id: string;
      type: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      status: 'active' | 'investigating' | 'mitigated';
      detectedAt: string;
      source: string;
      description: string;
      affectedUsers: number;
    }>;
    history: Array<{
      timestamp: string;
      threats: number;
      mitigated: number;
    }>;
  };
  vulnerabilities: {
    byType: Array<{
      type: string;
      count: number;
      severity: 'low' | 'medium' | 'high' | 'critical';
      status: 'open' | 'in_progress' | 'resolved';
    }>;
    byComponent: Array<{
      component: string;
      vulnerabilities: number;
      criticalCount: number;
      highCount: number;
    }>;
  };
}

const SEVERITY_COLORS = {
  low: '#4caf50',
  medium: '#ff9800',
  high: '#f44336',
  critical: '#d32f2f',
};

const SecurityAnalytics: React.FC<SecurityAnalyticsProps> = ({ className }) => {
  const theme = useTheme();
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSecurityData();
    const interval = setInterval(fetchSecurityData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchSecurityData = async () => {
    try {
      setLoading(prevLoading => !metrics && prevLoading);
      // Simulated data - in a real app, this would be an API call
      const data: SecurityMetrics = {
        overview: {
          securityScore: 85 + Math.random() * 10,
          threatLevel: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)] as 'low' | 'medium' | 'high' | 'critical',
          activeThreats: Math.floor(10 + Math.random() * 5),
          resolvedThreats: Math.floor(90 + Math.random() * 10),
          vulnerabilities: Math.floor(20 + Math.random() * 10),
          complianceScore: 90 + Math.random() * 5,
        },
        authentication: {
          failedLogins: Math.floor(100 + Math.random() * 50),
          successfulLogins: Math.floor(1000 + Math.random() * 200),
          mfaEnabled: Math.floor(800 + Math.random() * 100),
          mfaDisabled: Math.floor(200 + Math.random() * 50),
          suspiciousAttempts: Math.floor(50 + Math.random() * 20),
          blockedIPs: Math.floor(20 + Math.random() * 10),
        },
        threats: {
          current: generateCurrentThreats(),
          history: generateThreatHistory(),
        },
        vulnerabilities: {
          byType: generateVulnerabilityTypes(),
          byComponent: generateComponentVulnerabilities(),
        },
      };
      setMetrics(data);
    } catch (err) {
      setError('Failed to fetch security data');
      console.error('Error fetching security data:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateCurrentThreats = () => {
    const threatTypes = [
      'SQL Injection',
      'DDoS Attack',
      'Brute Force',
      'XSS Attempt',
      'Unauthorized Access',
    ];
    
    return threatTypes.map((type, index) => ({
      id: `THREAT-${1000 + index}`,
      type,
      severity: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)] as 'low' | 'medium' | 'high' | 'critical',
      status: ['active', 'investigating', 'mitigated'][Math.floor(Math.random() * 3)] as 'active' | 'investigating' | 'mitigated',
      detectedAt: new Date(Date.now() - Math.random() * 86400000).toISOString(),
      source: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      description: `Detected ${type.toLowerCase()} attempt from suspicious IP`,
      affectedUsers: Math.floor(Math.random() * 100),
    }));
  };

  const generateThreatHistory = () => {
    return Array.from({ length: 24 }, (_, i) => {
      const date = new Date();
      date.setHours(date.getHours() - (24 - i - 1));
      return {
        timestamp: date.toISOString(),
        threats: Math.floor(5 + Math.random() * 10),
        mitigated: Math.floor(3 + Math.random() * 7),
      };
    });
  };

  const generateVulnerabilityTypes = () => {
    const types = [
      'Input Validation',
      'Authentication',
      'Authorization',
      'Configuration',
      'Cryptography',
    ];
    
    return types.map(type => ({
      type,
      count: Math.floor(5 + Math.random() * 15),
      severity: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)] as 'low' | 'medium' | 'high' | 'critical',
      status: ['open', 'in_progress', 'resolved'][Math.floor(Math.random() * 3)] as 'open' | 'in_progress' | 'resolved',
    }));
  };

  const generateComponentVulnerabilities = () => {
    const components = [
      'Frontend',
      'Backend API',
      'Database',
      'Authentication',
      'Smart Contracts',
    ];
    
    return components.map(component => ({
      component,
      vulnerabilities: Math.floor(10 + Math.random() * 20),
      criticalCount: Math.floor(Math.random() * 5),
      highCount: Math.floor(2 + Math.random() * 8),
    }));
  };

  const renderOverviewCards = () => {
    if (!metrics) return null;

    const cards = [
      {
        title: 'Security Score',
        value: `${metrics.overview.securityScore.toFixed(1)}%`,
        icon: <SecurityIcon sx={{ fontSize: 32 }} />,
        color: theme.palette.primary.main,
      },
      {
        title: 'Compliance',
        value: `${metrics.overview.complianceScore.toFixed(1)}%`,
        icon: <ComplianceIcon sx={{ fontSize: 32 }} />,
        color: theme.palette.success.main,
      },
      {
        title: 'Active Threats',
        value: metrics.overview.activeThreats,
        icon: <ThreatIcon sx={{ fontSize: 32 }} />,
        color: theme.palette.error.main,
      },
      {
        title: 'Authentication',
        value: `${((metrics.authentication.mfaEnabled / (metrics.authentication.mfaEnabled + metrics.authentication.mfaDisabled)) * 100).toFixed(1)}% MFA`,
        icon: <AuthIcon sx={{ fontSize: 32 }} />,
        color: theme.palette.info.main,
      },
    ];

    return (
      <Grid container spacing={3}>
        {cards.map((card) => (
          <Grid item xs={12} sm={6} md={3} key={card.title}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      bgcolor: `${card.color}20`,
                      color: card.color,
                      mr: 2,
                    }}
                  >
                    {card.icon}
                  </Box>
                  <Box>
                    <Typography variant="h6">{card.title}</Typography>
                    <Typography variant="h4">{card.value}</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  const renderThreatHistory = () => {
    if (!metrics) return null;

    const CustomTooltip: React.FC<ChartTooltipProps> = ({ active, payload, label }) => {
      if (active && payload && payload.length && label) {
        return (
          <Paper sx={{ p: 1.5 }}>
            <Typography variant="body2" color="text.secondary">
              {new Date(label).toLocaleTimeString()}
            </Typography>
            <Typography variant="body1" color="error.main">
              Threats: {payload[0].value}
            </Typography>
            <Typography variant="body1" color="success.main">
              Mitigated: {payload[1].value}
            </Typography>
          </Paper>
        );
      }
      return null;
    };

    return (
      <Box sx={{ height: 300 }}>
        <ResponsiveContainer>
          <LineChart data={metrics.threats.history}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={(value: string) => new Date(value).toLocaleTimeString()}
            />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="threats"
              name="Detected Threats"
              stroke={theme.palette.error.main}
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="mitigated"
              name="Mitigated Threats"
              stroke={theme.palette.success.main}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    );
  };

  const renderActiveThreats = () => {
    if (!metrics) return null;

    return (
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Source</TableCell>
              <TableCell align="right">Affected Users</TableCell>
              <TableCell align="right">Detected</TableCell>
              <TableCell align="right">Severity</TableCell>
              <TableCell align="right">Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {metrics.threats.current.map((threat) => (
              <TableRow key={threat.id}>
                <TableCell>{threat.id}</TableCell>
                <TableCell>{threat.type}</TableCell>
                <TableCell>{threat.source}</TableCell>
                <TableCell align="right">{threat.affectedUsers}</TableCell>
                <TableCell align="right">
                  {new Date(threat.detectedAt).toLocaleString()}
                </TableCell>
                <TableCell align="right">
                  <Chip
                    label={threat.severity}
                    sx={{ bgcolor: SEVERITY_COLORS[threat.severity], color: 'white' }}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">
                  <Chip
                    label={threat.status}
                    color={
                      threat.status === 'mitigated'
                        ? 'success'
                        : threat.status === 'investigating'
                        ? 'warning'
                        : 'error'
                    }
                    size="small"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  if (error) {
    return (
      <Alert severity="error" className={className}>
        {error}
      </Alert>
    );
  }

  if (loading || !metrics) {
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
      <Grid container spacing={3}>
        <Grid item xs={12}>
          {renderOverviewCards()}
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Threat History
            </Typography>
            {renderThreatHistory()}
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Active Threats
            </Typography>
            {renderActiveThreats()}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SecurityAnalytics;
