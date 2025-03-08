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
  AccountBalance as ContractIcon,
  SwapHoriz as TransactionIcon,
  LocalGasStation as GasIcon,
  Storage as BlockIcon,
} from '@mui/icons-material';
import type { ChartTooltipProps } from '../../types';

interface BlockchainAnalyticsProps {
  className?: string;
}

interface BlockchainMetrics {
  overview: {
    totalTransactions: number;
    activeContracts: number;
    uniqueUsers: number;
    avgGasUsed: number;
    avgBlockTime: number;
    avgConfirmationTime: number;
  };
  contracts: {
    activity: Array<{
      address: string;
      name: string;
      transactions: number;
      uniqueUsers: number;
      gasUsed: number;
      lastActivity: string;
    }>;
    distribution: Array<{
      type: string;
      count: number;
      percentage: number;
    }>;
  };
  transactions: {
    history: Array<{
      timestamp: string;
      count: number;
      gasUsed: number;
      avgConfirmationTime: number;
    }>;
    recent: Array<{
      hash: string;
      type: string;
      from: string;
      to: string;
      value: number;
      gasUsed: number;
      timestamp: string;
      status: 'success' | 'pending' | 'failed';
    }>;
  };
  gas: {
    history: Array<{
      timestamp: string;
      price: number;
      used: number;
    }>;
    distribution: Array<{
      range: string;
      count: number;
      percentage: number;
    }>;
  };
}

const COLORS = ['#3f51b5', '#2196f3', '#00bcd4', '#009688', '#4caf50'];

const BlockchainAnalytics: React.FC<BlockchainAnalyticsProps> = ({ className }) => {
  const theme = useTheme();
  const [metrics, setMetrics] = useState<BlockchainMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBlockchainData();
    const interval = setInterval(fetchBlockchainData, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchBlockchainData = async () => {
    try {
      setLoading(prevLoading => !metrics && prevLoading);
      // Simulated data - in a real app, this would be an API call
      const data: BlockchainMetrics = {
        overview: {
          totalTransactions: 100000 + Math.floor(Math.random() * 10000),
          activeContracts: 50 + Math.floor(Math.random() * 10),
          uniqueUsers: 5000 + Math.floor(Math.random() * 1000),
          avgGasUsed: 100000 + Math.floor(Math.random() * 20000),
          avgBlockTime: 12 + Math.random() * 3,
          avgConfirmationTime: 30 + Math.random() * 10,
        },
        contracts: {
          activity: generateContractActivity(),
          distribution: generateContractDistribution(),
        },
        transactions: {
          history: generateTransactionHistory(),
          recent: generateRecentTransactions(),
        },
        gas: {
          history: generateGasHistory(),
          distribution: generateGasDistribution(),
        },
      };
      setMetrics(data);
    } catch (err) {
      setError('Failed to fetch blockchain data');
      console.error('Error fetching blockchain data:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateContractActivity = () => {
    const contracts = [
      'TicketMarket',
      'NFTMinter',
      'EventManager',
      'TokenSwap',
      'UserRegistry',
    ];
    
    return contracts.map((name, index) => ({
      address: `0x${Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      name,
      transactions: 1000 + Math.floor(Math.random() * 2000),
      uniqueUsers: 100 + Math.floor(Math.random() * 200),
      gasUsed: 1000000 + Math.floor(Math.random() * 500000),
      lastActivity: new Date(Date.now() - Math.random() * 3600000).toISOString(),
    }));
  };

  const generateContractDistribution = () => {
    const types = ['Market', 'NFT', 'Token', 'Governance', 'Utility'];
    const total = 100;
    return types.map((type, index) => {
      const percentage = 35 - index * 5 + Math.random() * 5;
      return {
        type,
        count: Math.floor((percentage / 100) * total),
        percentage,
      };
    });
  };

  const generateTransactionHistory = () => {
    return Array.from({ length: 24 }, (_, i) => {
      const date = new Date();
      date.setHours(date.getHours() - (24 - i - 1));
      return {
        timestamp: date.toISOString(),
        count: 100 + Math.floor(Math.random() * 50),
        gasUsed: 2000000 + Math.floor(Math.random() * 1000000),
        avgConfirmationTime: 25 + Math.random() * 10,
      };
    });
  };

  const generateRecentTransactions = () => {
    const types = ['Transfer', 'Mint', 'List', 'Purchase', 'Bid'];
    return Array.from({ length: 10 }, (_, i) => ({
      hash: `0x${Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      type: types[Math.floor(Math.random() * types.length)],
      from: `0x${Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      to: `0x${Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      value: Math.random() * 10,
      gasUsed: 50000 + Math.floor(Math.random() * 50000),
      timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
      status: ['success', 'pending', 'failed'][Math.floor(Math.random() * 3)] as 'success' | 'pending' | 'failed',
    }));
  };

  const generateGasHistory = () => {
    return Array.from({ length: 24 }, (_, i) => {
      const date = new Date();
      date.setHours(date.getHours() - (24 - i - 1));
      return {
        timestamp: date.toISOString(),
        price: 50 + Math.random() * 20,
        used: 2000000 + Math.floor(Math.random() * 1000000),
      };
    });
  };

  const generateGasDistribution = () => {
    const ranges = ['0-50K', '50K-100K', '100K-200K', '200K-500K', '>500K'];
    const total = 100;
    return ranges.map((range, index) => {
      const percentage = 30 - index * 5 + Math.random() * 5;
      return {
        range,
        count: Math.floor((percentage / 100) * total),
        percentage,
      };
    });
  };

  const formatAddress = (address: string): string => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatGas = (gas: number): string => {
    return `${(gas / 1000).toFixed(1)}K`;
  };

  const renderOverviewCards = () => {
    if (!metrics) return null;

    const cards = [
      {
        title: 'Active Contracts',
        value: metrics.overview.activeContracts,
        icon: <ContractIcon sx={{ fontSize: 32 }} />,
        color: theme.palette.primary.main,
      },
      {
        title: 'Transactions',
        value: metrics.overview.totalTransactions.toLocaleString(),
        icon: <TransactionIcon sx={{ fontSize: 32 }} />,
        color: theme.palette.secondary.main,
      },
      {
        title: 'Avg Gas',
        value: formatGas(metrics.overview.avgGasUsed),
        icon: <GasIcon sx={{ fontSize: 32 }} />,
        color: theme.palette.warning.main,
      },
      {
        title: 'Block Time',
        value: `${metrics.overview.avgBlockTime.toFixed(1)}s`,
        icon: <BlockIcon sx={{ fontSize: 32 }} />,
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

  const renderTransactionHistory = () => {
    if (!metrics) return null;

    const CustomTooltip: React.FC<ChartTooltipProps> = ({ active, payload, label }) => {
      if (active && payload && payload.length && label) {
        return (
          <Paper sx={{ p: 1.5 }}>
            <Typography variant="body2" color="text.secondary">
              {new Date(label).toLocaleTimeString()}
            </Typography>
            <Typography variant="body1" color="primary.main">
              Transactions: {payload[0].value}
            </Typography>
            <Typography variant="body1" color="secondary.main">
              Gas Used: {formatGas(payload[1].value)}
            </Typography>
          </Paper>
        );
      }
      return null;
    };

    return (
      <Box sx={{ height: 300 }}>
        <ResponsiveContainer>
          <LineChart data={metrics.transactions.history}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={(value: string) => new Date(value).toLocaleTimeString()}
            />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="count"
              name="Transactions"
              stroke={theme.palette.primary.main}
              strokeWidth={2}
              dot={false}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="gasUsed"
              name="Gas Used"
              stroke={theme.palette.secondary.main}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    );
  };

  const renderRecentTransactions = () => {
    if (!metrics) return null;

    return (
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Hash</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>From</TableCell>
              <TableCell>To</TableCell>
              <TableCell align="right">Value</TableCell>
              <TableCell align="right">Gas Used</TableCell>
              <TableCell align="right">Time</TableCell>
              <TableCell align="right">Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {metrics.transactions.recent.map((tx) => (
              <TableRow key={tx.hash}>
                <TableCell>{formatAddress(tx.hash)}</TableCell>
                <TableCell>{tx.type}</TableCell>
                <TableCell>{formatAddress(tx.from)}</TableCell>
                <TableCell>{formatAddress(tx.to)}</TableCell>
                <TableCell align="right">{tx.value.toFixed(4)} ETH</TableCell>
                <TableCell align="right">{formatGas(tx.gasUsed)}</TableCell>
                <TableCell align="right">
                  {new Date(tx.timestamp).toLocaleTimeString()}
                </TableCell>
                <TableCell align="right">
                  <Chip
                    label={tx.status}
                    color={
                      tx.status === 'success'
                        ? 'success'
                        : tx.status === 'pending'
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
              Transaction History
            </Typography>
            {renderTransactionHistory()}
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Transactions
            </Typography>
            {renderRecentTransactions()}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default BlockchainAnalytics;
