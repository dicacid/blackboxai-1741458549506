import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Grid,
  Rating,
  Chip,
  CircularProgress,
  Alert,
  Button,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import type { Event, ApiResponse } from '../../types';

const EventRecommendations: React.FC = () => {
  const [recommendations, setRecommendations] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        // In a real app, you'd get the userId from your auth context
        const userId = 'current-user-id';
        const response = await fetch(`/api/recommendations?userId=${userId}&limit=4`);
        const data: ApiResponse<Event[]> = await response.json();
        
        if (!data.success) {
          throw new Error(data.error?.message || 'Failed to fetch recommendations');
        }

        setRecommendations(data.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch recommendations');
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  const handleViewEvent = (eventId: string) => {
    navigate(`/events/${eventId}`);
  };

  if (loading) {
    return (
      <Paper sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Recommended Events
      </Typography>

      <Grid container spacing={2}>
        {recommendations.map((event) => (
          <Grid item xs={12} sm={6} key={event.id}>
            <Card>
              <CardMedia
                component="img"
                height="140"
                image={event.image}
                alt={event.title}
              />
              <CardContent>
                <Typography variant="h6" noWrap>
                  {event.title}
                </Typography>
                
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <Rating value={event.rating} readOnly size="small" />
                  <Typography variant="body2" color="text.secondary">
                    {event.rating.toFixed(1)}
                  </Typography>
                </Box>

                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <Chip
                    label={event.category}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                  <Chip
                    label={`Match: ${(event.matchScore * 100).toFixed(0)}%`}
                    size="small"
                    color="secondary"
                    variant="outlined"
                  />
                </Box>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {new Date(event.date).toLocaleDateString()}
                </Typography>

                <Typography variant="h6" color="primary">
                  ${event.price.toFixed(2)}
                </Typography>

                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => handleViewEvent(event.id)}
                  sx={{ mt: 1 }}
                >
                  View Details
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
};

export default EventRecommendations;
