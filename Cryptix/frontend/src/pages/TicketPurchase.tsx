import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Typography,
  Box,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Stepper,
  Step,
  StepLabel,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  useTheme,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  LocalActivity as TicketIcon,
  AccountBalanceWallet as WalletIcon,
  Receipt as ReceiptIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useWeb3React } from '@web3-react/core';
import type { Event, VenueSection } from '../types';
import eventService from '../services/eventService';
import web3Service from '../services/web3Service';

const steps = ['Select Quantity', 'Review & Pay', 'Confirmation'];

const TicketPurchase: React.FC = () => {
  const { eventId, sectionId } = useParams<{ eventId: string; sectionId: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const { account, active } = useWeb3React();

  const [activeStep, setActiveStep] = useState(0);
  const [event, setEvent] = useState<Event | null>(null);
  const [section, setSection] = useState<VenueSection | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);

  useEffect(() => {
    if (!active) {
      setError('Please connect your wallet to purchase tickets');
      return;
    }
    fetchEventDetails();
  }, [eventId, sectionId, active]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const eventData = await eventService.getEventById(eventId!);
      const sectionData = eventData.venue?.sections?.find(s => s.id === sectionId);
      
      if (!sectionData) {
        throw new Error('Selected section not found');
      }

      setEvent(eventData);
      setSection(sectionData);
    } catch (err) {
      setError('Failed to fetch event details. Please try again.');
      console.error('Error fetching event details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value);
    if (value > 0 && value <= 10) { // Limit to 10 tickets per purchase
      setQuantity(value);
    }
  };

  const calculateTotal = () => {
    if (!section) return 0;
    return quantity * section.priceRange.min;
  };

  const handlePurchase = async () => {
    if (!event || !section || !account) return;

    try {
      setProcessing(true);
      setError(null);

      // Call smart contract to purchase tickets
      const hash = await eventService.purchaseTickets(
        event.id,
        quantity,
        section.id
      );

      setTransactionHash(hash);
      setActiveStep(2);
    } catch (err) {
      setError('Failed to complete purchase. Please try again.');
      console.error('Purchase error:', err);
    } finally {
      setProcessing(false);
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Select Ticket Quantity
            </Typography>
            <TextField
              type="number"
              label="Quantity"
              value={quantity}
              onChange={handleQuantityChange}
              inputProps={{ min: 1, max: 10 }}
              fullWidth
              sx={{ mb: 2 }}
            />
            <Alert severity="info">
              Maximum 10 tickets per purchase
            </Alert>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Review Purchase
            </Typography>
            <Paper sx={{ p: 2, mb: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle1">
                    {event?.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {section?.name} Section
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Divider />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">Price per ticket:</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" align="right">
                    {eventService.formatPrice(section?.priceRange.min || 0)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">Quantity:</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" align="right">
                    {quantity}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Divider />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle1">Total:</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle1" align="right">
                    {eventService.formatPrice(calculateTotal())}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
            <Alert severity="info" sx={{ mb: 2 }}>
              Connected Wallet: {account}
            </Alert>
          </Box>
        );

      case 2:
        return (
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom color="success.main">
              Purchase Successful!
            </Typography>
            <Box sx={{ my: 3 }}>
              <TicketIcon sx={{ fontSize: 60, color: 'success.main' }} />
            </Box>
            <Typography paragraph>
              Your tickets have been minted and sent to your wallet.
            </Typography>
            {transactionHash && (
              <Typography variant="body2" color="text.secondary">
                Transaction Hash: {transactionHash}
              </Typography>
            )}
            <Button
              variant="outlined"
              onClick={() => navigate(`/tickets`)}
              sx={{ mt: 2 }}
            >
              View My Tickets
            </Button>
          </Box>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={fetchEventDetails}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {activeStep < 2 && (
        <Button
          startIcon={<BackIcon />}
          onClick={() => activeStep === 0 ? navigate(-1) : setActiveStep(prev => prev - 1)}
          sx={{ mb: 3 }}
        >
          {activeStep === 0 ? 'Back to Event' : 'Back'}
        </Button>
      )}

      <Paper sx={{ p: 3 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {renderStepContent(activeStep)}

        {activeStep < 2 && (
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              onClick={activeStep === 0 ? () => setActiveStep(1) : handlePurchase}
              disabled={processing}
              startIcon={activeStep === 0 ? undefined : <WalletIcon />}
            >
              {processing ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  Processing...
                </>
              ) : activeStep === 0 ? (
                'Continue'
              ) : (
                'Confirm Purchase'
              )}
            </Button>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default TicketPurchase;
