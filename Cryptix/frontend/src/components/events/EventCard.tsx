import React from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Chip,
  Button,
  Rating,
  Tooltip,
  IconButton,
  Skeleton,
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  Share as ShareIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  LocalActivity as TicketIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import type { Event } from '../../types';
import eventService from '../../services/eventService';

interface EventCardProps {
  event: Event;
  onFavorite?: (eventId: string, isFavorite: boolean) => void;
  isFavorite?: boolean;
  loading?: boolean;
  className?: string;
}

type EventStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled';

const EventCard: React.FC<EventCardProps> = ({
  event,
  onFavorite,
  isFavorite = false,
  loading = false,
  className,
}) => {
  const navigate = useNavigate();

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (navigator.share) {
        await navigator.share({
          title: event.title,
          text: `Check out ${event.title} on Cryptix!`,
          url: window.location.origin + '/events/' + event.id,
        });
      } else {
        await navigator.clipboard.writeText(
          window.location.origin + '/events/' + event.id
        );
      }
    } catch (error) {
      console.error('Error sharing event:', error);
    }
  };

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFavorite?.(event.id, !isFavorite);
  };

  const getStatusColor = (status: EventStatus): string => {
    switch (status) {
      case 'upcoming':
        return '#00C851';
      case 'ongoing':
        return '#ffbb33';
      case 'completed':
        return '#ff4444';
      case 'cancelled':
        return '#9e9e9e';
      default:
        return '#33b5e5';
    }
  };

  const getStatusText = (status: EventStatus): string => {
    switch (status) {
      case 'upcoming':
        return 'UPCOMING';
      case 'ongoing':
        return 'LIVE NOW';
      case 'completed':
        return 'COMPLETED';
      case 'cancelled':
        return 'CANCELLED';
      default:
        return status.toUpperCase();
    }
  };

  if (loading) {
    return (
      <Card
        className={className}
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Skeleton variant="rectangular" height={200} />
        <CardContent sx={{ flexGrow: 1 }}>
          <Skeleton variant="text" width="80%" height={32} />
          <Skeleton variant="text" width="40%" height={24} sx={{ mb: 1 }} />
          <Skeleton variant="text" width="60%" height={24} sx={{ mb: 1 }} />
          <Skeleton variant="text" width="70%" height={24} sx={{ mb: 2 }} />
          <Box sx={{ mt: 'auto' }}>
            <Skeleton variant="text" width="30%" height={32} sx={{ mb: 1 }} />
            <Skeleton variant="rectangular" height={36} />
          </Box>
        </CardContent>
      </Card>
    );
  }

  const ticketsRemaining = event.maxTickets ? event.maxTickets - (event.ticketsSold || 0) : null;
  const soldOutSoon = ticketsRemaining !== null && ticketsRemaining <= 20;

  return (
    <Card
      className={className}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 6,
        },
      }}
      onClick={() => navigate(`/events/${event.id}`)}
    >
      <Box sx={{ position: 'relative' }}>
        <CardMedia
          component="img"
          height="200"
          image={event.image}
          alt={event.title}
        />
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            display: 'flex',
            gap: 1,
          }}
        >
          <Tooltip title="Share event">
            <IconButton
              size="small"
              sx={{ bgcolor: 'background.paper' }}
              onClick={handleShare}
            >
              <ShareIcon />
            </IconButton>
          </Tooltip>
          {onFavorite && (
            <Tooltip title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}>
              <IconButton
                size="small"
                sx={{ bgcolor: 'background.paper' }}
                onClick={handleFavorite}
              >
                {isFavorite ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon />}
              </IconButton>
            </Tooltip>
          )}
        </Box>
        <Chip
          label={getStatusText(event.status as EventStatus)}
          sx={{
            position: 'absolute',
            top: 8,
            left: 8,
            bgcolor: getStatusColor(event.status as EventStatus),
            color: 'white',
          }}
          size="small"
        />
      </Box>

      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Typography gutterBottom variant="h6" component="div" noWrap>
          {event.title}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Rating value={event.rating} readOnly size="small" precision={0.5} />
          <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
            {event.rating.toFixed(1)}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <LocationIcon fontSize="small" color="action" sx={{ mr: 1 }} />
          <Typography variant="body2" color="text.secondary" noWrap>
            {event.location}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <CalendarIcon fontSize="small" color="action" sx={{ mr: 1 }} />
          <Typography variant="body2" color="text.secondary" noWrap>
            {eventService.formatEventDate(event.date)}
          </Typography>
        </Box>

        {ticketsRemaining !== null && (
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <TicketIcon fontSize="small" color="action" sx={{ mr: 1 }} />
            <Typography
              variant="body2"
              color={soldOutSoon ? 'error' : 'text.secondary'}
              fontWeight={soldOutSoon ? 'bold' : 'normal'}
            >
              {ticketsRemaining === 0
                ? 'Sold Out'
                : `${ticketsRemaining} tickets remaining`}
            </Typography>
          </Box>
        )}

        <Box sx={{ mt: 'auto' }}>
          <Typography variant="h6" color="primary" gutterBottom>
            {eventService.formatPrice(event.price)}
          </Typography>
          <Button
            variant="contained"
            fullWidth
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/events/${event.id}/tickets`);
            }}
            disabled={event.status === 'cancelled' || ticketsRemaining === 0}
          >
            {event.status === 'cancelled'
              ? 'Cancelled'
              : ticketsRemaining === 0
              ? 'Sold Out'
              : 'Get Tickets'}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default EventCard;
