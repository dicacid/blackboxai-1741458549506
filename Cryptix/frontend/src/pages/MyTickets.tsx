import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Typography,
  Box,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Button,
  Fade,
  useTheme,
} from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { useWeb3React } from '@web3-react/core';
import TicketCard from '../components/tickets/TicketCard';
import type { Ticket } from '../types';
import web3Service from '../services/web3Service';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`tickets-tabpanel-${index}`}
    aria-labelledby={`tickets-tab-${index}`}
  >
    {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
  </div>
);

const MyTickets: React.FC = () => {
  const theme = useTheme();
  const { account, active } = useWeb3React();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (active && account) {
      fetchTickets();
    }
  }, [active, account]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      // In a real app, you would fetch tickets from your backend/blockchain
      const response = await fetch(`/api/users/${account}/tickets`);
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to fetch tickets');
      }
      setTickets(data.data);
    } catch (err) {
      setError('Failed to fetch tickets. Please try again.');
      console.error('Error fetching tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async (ticketId: string, toAddress: string) => {
    try {
      setProcessing(true);
      setError(null);

      // Validate address
      if (!web3Service.isValidAddress(toAddress)) {
        throw new Error('Invalid recipient address');
      }

      // In a real app, you would call your smart contract here
      const response = await fetch(`/api/tickets/${ticketId}/transfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ toAddress }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to transfer ticket');
      }

      // Update local state
      setTickets(prev => prev.filter(ticket => ticket.id !== ticketId));
    } catch (err) {
      throw err;
    } finally {
      setProcessing(false);
    }
  };

  const handleList = async (ticketId: string, price: number) => {
    try {
      setProcessing(true);
      setError(null);

      // In a real app, you would call your smart contract here
      const response = await fetch(`/api/tickets/${ticketId}/list`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ price }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to list ticket');
      }

      // Update local state
      setTickets(prev =>
        prev.map(ticket =>
          ticket.id === ticketId
            ? { ...ticket, status: 'forSale' as const }
            : ticket
        )
      );
    } catch (err) {
      throw err;
    } finally {
      setProcessing(false);
    }
  };

  const getFilteredTickets = () => {
    switch (tabValue) {
      case 0: // Active
        return tickets.filter(ticket => ticket.status === 'active');
      case 1: // For Sale
        return tickets.filter(ticket => ticket.status === 'forSale');
      case 2: // Used/Expired
        return tickets.filter(ticket => ['used', 'expired', 'revoked'].includes(ticket.status));
      default:
        return tickets;
    }
  };

  if (!active) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="info">
          Please connect your wallet to view your tickets.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          My Tickets
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your tickets and view their status
        </Typography>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          aria-label="ticket categories"
        >
          <Tab label={`Active (${tickets.filter(t => t.status === 'active').length})`} />
          <Tab label={`For Sale (${tickets.filter(t => t.status === 'forSale').length})`} />
          <Tab
            label={`Used/Expired (${
              tickets.filter(t => ['used', 'expired', 'revoked'].includes(t.status)).length
            })`}
          />
        </Tabs>
      </Box>

      {error ? (
        <Alert
          severity="error"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={fetchTickets}
              startIcon={<RefreshIcon />}
            >
              Retry
            </Button>
          }
          sx={{ mt: 2 }}
        >
          {error}
        </Alert>
      ) : loading ? (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 400,
          }}
        >
          <CircularProgress />
        </Box>
      ) : (
        <TabPanel value={tabValue} index={tabValue}>
          <Grid container spacing={3}>
            {getFilteredTickets().map((ticket, index) => (
              <Fade
                key={ticket.id}
                in={true}
                timeout={(index % 12) * 100}
              >
                <Grid item xs={12} sm={6} md={4} lg={3}>
                  <TicketCard
                    ticket={ticket}
                    onTransfer={handleTransfer}
                    onList={handleList}
                  />
                </Grid>
              </Fade>
            ))}
            {getFilteredTickets().length === 0 && (
              <Grid item xs={12}>
                <Alert severity="info">
                  No tickets found in this category.
                </Alert>
              </Grid>
            )}
          </Grid>
        </TabPanel>
      )}
    </Container>
  );
};

export default MyTickets;
