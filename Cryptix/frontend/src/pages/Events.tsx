import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Button,
  Pagination,
  useTheme,
  Fade,
} from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import EventCard from '../components/events/EventCard';
import EventFilters, { EventFilters as Filters } from '../components/events/EventFilters';
import type { Event } from '../types';
import eventService from '../services/eventService';

const ITEMS_PER_PAGE = 12;

const Events: React.FC = () => {
  const theme = useTheme();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({});
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchEvents();
    // Load favorites from localStorage
    const savedFavorites = localStorage.getItem('favoriteEvents');
    if (savedFavorites) {
      setFavorites(new Set(JSON.parse(savedFavorites)));
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [filters, page]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await eventService.getEvents(filters);
      
      // Calculate total pages
      setTotalPages(Math.ceil(data.length / ITEMS_PER_PAGE));
      
      // Get current page data
      const start = (page - 1) * ITEMS_PER_PAGE;
      const end = start + ITEMS_PER_PAGE;
      setEvents(data.slice(start, end));
    } catch (err) {
      setError('Failed to fetch events. Please try again.');
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters: Filters) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page when filters change
  };

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFavorite = (eventId: string, isFavorite: boolean) => {
    const newFavorites = new Set(favorites);
    if (isFavorite) {
      newFavorites.add(eventId);
    } else {
      newFavorites.delete(eventId);
    }
    setFavorites(newFavorites);
    localStorage.setItem('favoriteEvents', JSON.stringify(Array.from(newFavorites)));
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Events
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Discover and book tickets for the most exciting events
        </Typography>
      </Box>

      <EventFilters
        onFilterChange={handleFilterChange}
        loading={loading}
      />

      {error ? (
        <Alert
          severity="error"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={fetchEvents}
              startIcon={<RefreshIcon />}
            >
              Retry
            </Button>
          }
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
      ) : events.length === 0 ? (
        <Alert severity="info">
          No events found matching your criteria. Try adjusting your filters.
        </Alert>
      ) : (
        <>
          <Grid container spacing={3}>
            {events.map((event, index) => (
              <Fade
                key={event.id}
                in={true}
                timeout={(index % ITEMS_PER_PAGE) * 100}
              >
                <Grid item xs={12} sm={6} md={4} lg={3}>
                  <EventCard
                    event={event}
                    onFavorite={handleFavorite}
                    isFavorite={favorites.has(event.id)}
                  />
                </Grid>
              </Fade>
            ))}
          </Grid>

          {totalPages > 1 && (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                mt: 4,
                mb: 2,
              }}
            >
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
                size="large"
                showFirstButton
                showLastButton
              />
            </Box>
          )}
        </>
      )}
    </Container>
  );
};

export default Events;
