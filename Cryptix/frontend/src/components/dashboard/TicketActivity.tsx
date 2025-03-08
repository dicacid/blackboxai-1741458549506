import React from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Tooltip,
  Paper,
  Alert,
  IconButton,
  Fade,
  useTheme,
} from '@mui/material';
import {
  LocalActivity as TicketIcon,
  SwapHoriz as TransferIcon,
  ShoppingCart as PurchaseIcon,
  AttachMoney as SaleIcon,
  Refresh as RefreshIcon,
  ErrorOutline as ErrorIcon,
} from '@mui/icons-material';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler,
} from 'chart.js';
import { shortenAddress } from '../../utils/web3';
import type { 
  TicketActivity as TicketActivityType, 
  ChartData,
  ApiError 
} from '../../types';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend,
  Filler
);

const getActivityIcon = (type: TicketActivityType['type']) => {
  switch (type) {
    case 'purchase':
      return <PurchaseIcon />;
    case 'transfer':
      return <TransferIcon />;
    case 'sale':
      return <SaleIcon />;
    case 'mint':
      return <TicketIcon />;
    case 'revoke':
      return <ErrorIcon />;
    default:
      return <TicketIcon />;
  }
};

const getActivityColor = (type: TicketActivityType['type'], theme: any) => {
  switch (type) {
    case 'purchase':
      return theme.palette.success.main;
    case 'transfer':
      return theme.palette.info.main;
    case 'sale':
      return theme.palette.warning.main;
    case 'mint':
      return theme.palette.primary.main;
    case 'revoke':
      return theme.palette.error.main;
    default:
      return theme.palette.grey[500];
  }
};

const getActivityLabel = (type: TicketActivityType['type']): string => {
  return type.charAt(0).toUpperCase() + type.slice(1);
};

const TicketActivity: React.FC = () => {
  const theme = useTheme();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<ApiError | null>(null);
  const [activities, setActivities] = React.useState<TicketActivityType[]>([]);
  const [chartData, setChartData] = React.useState<ChartData | null>(null);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      setError(null);

      // Simulated API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data
      const mockActivities: TicketActivityType[] = [
        {
          id: '1',
          type: 'purchase',
          eventName: 'Summer Festival 2024',
          price: 150,
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          status: 'success',
          transactionHash: '0xabc...',
        },
        {
          id: '2',
          type: 'transfer',
          eventName: 'Rock Concert',
          price: 200,
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          from: '0x1234567890123456789012345678901234567890',
          to: '0x9876543210987654321098765432109876543210',
          status: 'success',
          transactionHash: '0xdef...',
        },
        {
          id: '3',
          type: 'sale',
          eventName: 'Jazz Night',
          price: 75,
          timestamp: new Date(Date.now() - 10800000).toISOString(),
          status: 'success',
          transactionHash: '0xghi...',
        },
      ];

      setActivities(mockActivities);

      // Prepare chart data
      const labels = ['6h ago', '5h ago', '4h ago', '3h ago', '2h ago', '1h ago', 'Now'];
      const data: ChartData = {
        labels,
        datasets: [
          {
            label: 'Transaction Volume',
            data: [12, 19, 15, 25, 22, 30, 28],
            borderColor: theme.palette.primary.main,
            backgroundColor: `${theme.palette.primary.main}20`,
            tension: 0.4,
            fill: true,
          },
        ],
      };

      setChartData(data);
      setLoading(false);
    } catch (err) {
      setError({
        code: 'FETCH_ERROR',
        message: 'Failed to fetch ticket activities',
        details: err instanceof Error ? err.message : 'Unknown error',
      });
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchActivities();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3, minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert
        severity="error"
        action={
          <IconButton
            color="inherit"
            size="small"
            onClick={fetchActivities}
            aria-label="retry"
          >
            <RefreshIcon />
          </IconButton>
        }
      >
        {error.message}
      </Alert>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 3 
      }}>
        <Typography variant="h6">
          Ticket Activity
        </Typography>
        <Tooltip title="Refresh activities" arrow>
          <IconButton onClick={fetchActivities} size="small">
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Activity Chart */}
      {chartData && (
        <Box sx={{ height: 200, mb: 3 }}>
          <Line
            data={chartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: false,
                },
                tooltip: {
                  mode: 'index',
                  intersect: false,
                  backgroundColor: theme.palette.background.paper,
                  titleColor: theme.palette.text.primary,
                  bodyColor: theme.palette.text.secondary,
                  borderColor: theme.palette.divider,
                  borderWidth: 1,
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  grid: {
                    display: false,
                  },
                  ticks: {
                    color: theme.palette.text.secondary,
                  },
                },
                x: {
                  grid: {
                    display: false,
                  },
                  ticks: {
                    color: theme.palette.text.secondary,
                  },
                },
              },
            }}
          />
        </Box>
      )}

      {/* Recent Activity List */}
      <List sx={{ width: '100%' }}>
        {activities.map((activity) => (
          <Fade key={activity.id} in={true} timeout={500}>
            <ListItem
              alignItems="flex-start"
              sx={{
                px: 2,
                borderRadius: 1,
                mb: 1,
                '&:hover': {
                  backgroundColor: theme.palette.action.hover,
                },
              }}
            >
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: getActivityColor(activity.type, theme) }}>
                  {getActivityIcon(activity.type)}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle2">
                      {activity.eventName}
                    </Typography>
                    <Chip
                      label={new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                      }).format(activity.price)}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      label={getActivityLabel(activity.type)}
                      size="small"
                      color={activity.status === 'success' ? 'success' : 'error'}
                    />
                  </Box>
                }
                secondary={
                  <Box sx={{ mt: 0.5 }}>
                    {activity.from && activity.to && (
                      <Typography
                        component="span"
                        variant="body2"
                        color="text.secondary"
                      >
                        From {shortenAddress(activity.from)} to{' '}
                        {shortenAddress(activity.to)}
                      </Typography>
                    )}
                    <Typography
                      component="div"
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 0.5 }}
                    >
                      {new Date(activity.timestamp).toLocaleString()}
                      {activity.transactionHash && (
                        <Tooltip title="View on blockchain explorer" arrow>
                          <Chip
                            label={shortenAddress(activity.transactionHash, 6)}
                            size="small"
                            variant="outlined"
                            sx={{ ml: 1 }}
                            clickable
                            onClick={() => window.open(`https://etherscan.io/tx/${activity.transactionHash}`, '_blank')}
                          />
                        </Tooltip>
                      )}
                    </Typography>
                  </Box>
                }
              />
            </ListItem>
          </Fade>
        ))}
      </List>
    </Paper>
  );
};

export default TicketActivity;
