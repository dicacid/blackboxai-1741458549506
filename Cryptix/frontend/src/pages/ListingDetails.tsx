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
  Divider,
  Chip,
  IconButton,
  Tooltip,
  useTheme,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  AccountCircle as UserIcon,
  OpenInNew as ExternalLinkIcon,
  AccessTime as TimeIcon,
  LocalActivity as TicketIcon,
  Event as EventIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useWeb3React } from '@web3-react/core';
import type { MarketListing, Event } from '../types';
import web3Service from '../services/web3Service';
import eventService from '../services/eventService';

const ListingDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const { active } = useWeb3React();

  const [listing, setListing] = useState<MarketListing | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchListingDetails();
  }, [id]);

  const fetchListingDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch listing details
      const response = await fetch(`/api/marketplace/listings/${id}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to fetch listing details');
      }

      setListing(data.data);

      // Fetch associated event details
      const eventResponse = await fetch(`/api/events/${data.data.eventId}`);
      const eventData = await eventResponse.json();

      if (!eventData.success) {
        throw new Error(eventData.error?.message || 'Failed to fetch event details');
      }

      setEvent(eventData.data);
    } catch (err) {
      setError('Failed to fetch listing details. Please try again.');
      console.error('Error fetching listing details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!active || !listing) {
      return;
    }

    try {
      setProcessing(true);
      setError(null);

      const response = await fetch(`/api/marketplace/listings/${listing.tokenId}/purchase`, {
        method: 'POST',
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to purchase ticket');
      }

      // Navigate to tickets page after successful purchase
      navigate('/tickets');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to purchase ticket');
      console.error('Purchase error:', err);
    } finally {
      setProcessing(false);
    }
  };

  const getTimeLeft = () => {
    if (!listing?.expiresAt) return null;
    const now = Date.now();
    const expiresAt = listing.expiresAt * 1000; // Convert to milliseconds
    if (expiresAt <= now) return 'Expired';

    const diff = expiresAt - now;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h left`;
    if (hours > 0) return `${hours}h left`;
    return 'Ending soon';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !listing || !event) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={fetchListingDetails}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      </Container>
    );
  }

  const timeLeft = getTimeLeft();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Button
        startIcon={<BackIcon />}
        onClick={() => navigate('/marketplace')}
        sx={{ mb: 3 }}
      >
        Back to Marketplace
      </Button>

      <Grid container spacing={4}>
        {/* Listing Image and Details */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ overflow: 'hidden' }}>
            <Box
              component="img"
              src={listing.image || '/placeholder.png'}
              alt={`Ticket ${listing.tokenId}`}
              sx={{
                width: '100%',
                height: 400,
                objectFit: 'cover',
              }}
            />

            <Box sx={{ p: 3 }}>
              <Typography variant="h4" gutterBottom>
                {event.title}
              </Typography>

              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EventIcon color="action" />
                    <Typography variant="body1">
                      {eventService.formatEventDate(event.date)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationIcon color="action" />
                    <Typography variant="body1">
                      {event.location}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              <Typography variant="body1" paragraph>
                {event.description}
              </Typography>

              {event.tags && event.tags.length > 0 && (
                <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {event.tags.map((tag) => (
                    <Chip key={tag} label={tag} size="small" />
                  ))}
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Purchase Section */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, position: 'sticky', top: 24 }}>
            <Typography variant="h5" gutterBottom>
              Ticket Details
            </Typography>

            {timeLeft && (
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TimeIcon sx={{ mr: 1 }} color="action" />
                <Typography
                  color={timeLeft === 'Expired' ? 'error' : 'text.primary'}
                >
                  {timeLeft}
                </Typography>
              </Box>
            )}

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Seller
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <UserIcon color="action" />
                <Typography>
                  {web3Service.shortenAddress(listing.seller)}
                </Typography>
                <Tooltip title="View on blockchain">
                  <IconButton
                    size="small"
                    onClick={() => window.open(web3Service.getExplorerUrl(listing.seller, 'address'), '_blank')}
                  >
                    <ExternalLinkIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            {listing.section && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Section
                </Typography>
                <Typography>{listing.section}</Typography>
              </Box>
            )}

            {listing.seat && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Seat
                </Typography>
                <Typography>{listing.seat}</Typography>
              </Box>
            )}

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Price
              </Typography>
              <Typography variant="h4" color="primary">
                {eventService.formatPrice(listing.price)}
              </Typography>
            </Box>

            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={handlePurchase}
              disabled={!listing.active || processing}
              startIcon={<TicketIcon />}
            >
              {processing ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  Processing...
                </>
              ) : !listing.active ? (
                'Sold'
              ) : (
                'Purchase Ticket'
              )}
            </Button>

            {!active && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Please connect your wallet to purchase tickets
              </Alert>
            )}

            <Box sx={{ mt: 3 }}>
              <Typography variant="caption" color="text.secondary">
                Token ID: {listing.tokenId}
              </Typography>
              <br />
              <Typography variant="caption" color="text.secondary">
                Contract: {web3Service.shortenAddress(listing.smartContractAddress)}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ListingDetails;
