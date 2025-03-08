import React from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Button,
  Chip,
  IconButton,
  Tooltip,
  useTheme,
} from '@mui/material';
import {
  AccessTime as TimeIcon,
  OpenInNew as ExternalLinkIcon,
  AccountCircle as UserIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import type { MarketListing } from '../../types';
import eventService from '../../services/eventService';
import web3Service from '../../services/web3Service';

interface MarketListingCardProps {
  listing: MarketListing;
  onPurchase?: (listingId: string) => Promise<void>;
  disabled?: boolean;
  className?: string;
}

const MarketListingCard: React.FC<MarketListingCardProps> = ({
  listing,
  onPurchase,
  disabled = false,
  className,
}) => {
  const theme = useTheme();
  const navigate = useNavigate();

  const handlePurchase = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onPurchase && !disabled) {
      await onPurchase(listing.tokenId);
    }
  };

  const getTimeLeft = () => {
    if (!listing.expiresAt) return null;
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

  const timeLeft = getTimeLeft();

  return (
    <Card
      className={className}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[4],
        },
      }}
      onClick={() => navigate(`/marketplace/${listing.tokenId}`)}
    >
      <CardMedia
        component="img"
        height="140"
        image={listing.image || '/placeholder.png'}
        alt={`Ticket ${listing.tokenId}`}
      />

      {timeLeft && (
        <Chip
          icon={<TimeIcon />}
          label={timeLeft}
          size="small"
          color={timeLeft === 'Expired' ? 'error' : 'primary'}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            bgcolor: theme.palette.background.paper,
          }}
        />
      )}

      <CardContent sx={{ flexGrow: 1 }}>
        <Typography gutterBottom variant="h6" component="div" noWrap>
          {listing.eventName}
        </Typography>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Listed by:
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <UserIcon fontSize="small" color="action" />
            <Typography variant="body2" noWrap>
              {web3Service.shortenAddress(listing.seller)}
            </Typography>
            <Tooltip title="View on blockchain">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(web3Service.getExplorerUrl(listing.seller, 'address'), '_blank');
                }}
              >
                <ExternalLinkIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {listing.section && (
          <Typography variant="body2" color="text.secondary">
            Section: {listing.section}
          </Typography>
        )}

        {listing.seat && (
          <Typography variant="body2" color="text.secondary">
            Seat: {listing.seat}
          </Typography>
        )}

        <Box sx={{ mt: 2 }}>
          <Typography variant="h6" color="primary" gutterBottom>
            {eventService.formatPrice(listing.price)}
          </Typography>

          <Button
            variant="contained"
            fullWidth
            onClick={handlePurchase}
            disabled={disabled || !listing.active}
          >
            {!listing.active ? 'Sold' : 'Purchase'}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default MarketListingCard;
