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
  Chip,
  Divider,
  Rating,
  Tooltip,
  IconButton,
  useTheme,
  Fade,
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  Share as ShareIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  LocalActivity as TicketIcon,
  ArrowBack as BackIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useWeb3React } from '@web3-react/core';
import type { Event, VenueSection } from '../types';
import eventService from '../services/eventService';

interface SectionCardProps {
  section: VenueSection;
  onSelect: (sectionId: string) => void;
  disabled?: boolean;
}

const SectionCard: React.FC<SectionCardProps> = ({ section, onSelect, disabled }) => {
  const theme = useTheme();

  return (
    <Paper
      sx={{
        p: 2,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.7 : 1,
        transition: 'transform 0.2s, box-shadow 0.2s',
        ...(!disabled && {
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: theme.shadows[4],
          },
        }),
      }}
      onClick={() => !disabled && onSelect(section.id)}
    >
      <Typography variant="h6" gutterBottom>
        {section.name}
      </Typography>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Capacity: {section.capacity}
        </Typography>
        <Typography variant="h6" color="primary">
          {eventService.formatPrice(section.priceRange.min)}
        </Typography>
      </Box>
    </Paper>
  );
};

const EventDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const { active } = useWeb3React();
  
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchEventDetails();
      // Load favorite status from localStorage
      const savedFavorites = localStorage.getItem('favoriteEvents');
      if (savedFavorites) {
        const favorites = new Set(JSON.parse(savedFavorites));
        setIsFavorite(favorites.has(id));
      }
    }
  }, [id]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await eventService.getEventById(id!);
      setEvent(data);
    } catch (err) {
      setError('Failed to fetch event details. Please try again.');
      console.error('Error fetching event details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: event?.title || 'Event Details',
          text: `Check out ${event?.title} on Cryptix!`,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
      }
    } catch (error) {
      console.error('Error sharing event:', error);
    }
  };

  const handleFavorite = () => {
    const newIsFavorite = !isFavorite;
    setIsFavorite(newIsFavorite);
    
    const savedFavorites = localStorage.getItem('favoriteEvents');
    const favorites = new Set(savedFavorites ? JSON.parse(savedFavorites) : []);
    
    if (newIsFavorite) {
      favorites.add(id);
    } else {
      favorites.delete(id);
    }
    
    localStorage.setItem('favoriteEvents', JSON.stringify(Array.from(favorites)));
  };

  const handlePurchase = async () => {
    if (!active) {
      // TODO: Show wallet connection modal
      return;
    }
    
    try {
      if (!selectedSection) {
        throw new Error('Please select a ticket section');
      }
      
      // Navigate to ticket purchase page with selected section
      navigate(`/events/${id}/purchase/${selectedSection}`);
    } catch (error) {
      console.error('Error initiating purchase:', error);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !event) {
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

  const ticketsRemaining = event.maxTickets ? event.maxTickets - (event.ticketsSold || 0) : null;
  const soldOutSoon = ticketsRemaining !== null && ticketsRemaining <= 20;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Button
        startIcon={<BackIcon />}
        onClick={() => navigate('/events')}
        sx={{ mb: 3 }}
      >
        Back to Events
      </Button>

      <Grid container spacing={4}>
        {/* Event Image and Basic Info */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ position: 'relative', overflow: 'hidden', borderRadius: 2 }}>
            <Box
              component="img"
              src={event.image}
              alt={event.title}
              sx={{
                width: '100%',
                height: 400,
                objectFit: 'cover',
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                top: 16,
                right: 16,
                display: 'flex',
                gap: 1,
              }}
            >
              <Tooltip title="Share event">
                <IconButton
                  onClick={handleShare}
                  sx={{ bgcolor: 'background.paper' }}
                >
                  <ShareIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}>
                <IconButton
                  onClick={handleFavorite}
                  sx={{ bgcolor: 'background.paper' }}
                >
                  {isFavorite ? (
                    <FavoriteIcon color="error" />
                  ) : (
                    <FavoriteBorderIcon />
                  )}
                </IconButton>
              </Tooltip>
            </Box>
          </Paper>

          <Box sx={{ mt: 3 }}>
            <Typography variant="h4" gutterBottom>
              {event.title}
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Rating value={event.rating} readOnly precision={0.5} />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                {event.rating.toFixed(1)}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <Chip
                icon={<LocationIcon />}
                label={event.location}
                variant="outlined"
              />
              <Chip
                icon={<CalendarIcon />}
                label={eventService.formatEventDate(event.date)}
                variant="outlined"
              />
              <Chip
                icon={<TicketIcon />}
                label={`${ticketsRemaining} tickets remaining`}
                color={soldOutSoon ? 'error' : 'default'}
                variant="outlined"
              />
            </Box>

            <Typography variant="body1" paragraph>
              {event.description}
            </Typography>

            {event.tags && event.tags.length > 0 && (
              <Box sx={{ mt: 2 }}>
                {event.tags.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    size="small"
                    sx={{ mr: 1, mb: 1 }}
                  />
                ))}
              </Box>
            )}
          </Box>
        </Grid>

        {/* Ticket Purchase Section */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, position: 'sticky', top: 24 }}>
            <Typography variant="h6" gutterBottom>
              Select Tickets
            </Typography>

            {event.venue?.sections ? (
              <>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Choose your preferred section:
                  </Typography>
                  <Grid container spacing={2}>
                    {event.venue.sections.map((section) => (
                      <Grid item xs={12} key={section.id}>
                        <SectionCard
                          section={section}
                          onSelect={setSelectedSection}
                          disabled={event.status === 'cancelled'}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Box>

                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  onClick={handlePurchase}
                  disabled={!selectedSection || event.status === 'cancelled'}
                  startIcon={<TicketIcon />}
                >
                  {event.status === 'cancelled'
                    ? 'Event Cancelled'
                    : 'Purchase Tickets'}
                </Button>

                {!active && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    Please connect your wallet to purchase tickets
                  </Alert>
                )}
              </>
            ) : (
              <Alert severity="info">
                No ticket sections available for this event
              </Alert>
            )}

            {event.organizer && (
              <Box sx={{ mt: 3 }}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" gutterBottom>
                  Organized by:
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {event.organizer}
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default EventDetails;
