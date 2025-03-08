import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Button,
  TextField,
  InputAdornment,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Chip,
  Pagination,
  Fade,
  useTheme,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useWeb3React } from '@web3-react/core';
import type { MarketListing, Event, MarketStats } from '../types';
import MarketListingCard from '../components/marketplace/MarketListingCard';
import MarketplaceStats from '../components/marketplace/MarketplaceStats';
import web3Service from '../services/web3Service';
import eventService from '../services/eventService';
import analyticsService from '../services/analyticsService';

const ITEMS_PER_PAGE = 12;

interface MarketFilters {
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  eventId?: string;
  sortBy?: 'price_asc' | 'price_desc' | 'date_asc' | 'date_desc';
}

const Marketplace: React.FC = () => {
  const theme = useTheme();
  const { active } = useWeb3React();
  const [listings, setListings] = useState<MarketListing[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [marketStats, setMarketStats] = useState<MarketStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<MarketFilters>({
    sortBy: 'date_desc',
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchEvents();
    fetchMarketStats();
    fetchListings();

    // Set up periodic refresh for market stats
    const statsInterval = setInterval(fetchMarketStats, 60000); // Refresh every minute
    return () => clearInterval(statsInterval);
  }, []);

  useEffect(() => {
    fetchListings();
  }, [filters, page]);

  const fetchEvents = async () => {
    try {
      const data = await eventService.getEvents();
      setEvents(data);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const fetchMarketStats = async () => {
    try {
      setStatsLoading(true);
      const stats = await analyticsService.getMarketStats();
      setMarketStats(stats);
    } catch (error) {
      console.error('Error fetching market stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchListings = async () => {
    try {
      setLoading(true);
      setError(null);

      // Create clean query params
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', ITEMS_PER_PAGE.toString());

      if (filters.search) params.append('search', filters.search);
      if (filters.eventId) params.append('eventId', filters.eventId);
      if (filters.minPrice) params.append('minPrice', filters.minPrice.toString());
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
      if (filters.sortBy) params.append('sortBy', filters.sortBy);

      const response = await fetch(`/api/marketplace/listings?${params}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to fetch listings');
      }

      setListings(data.data);
      setTotalPages(Math.ceil(data.meta.total / ITEMS_PER_PAGE));
    } catch (err) {
      setError('Failed to fetch listings. Please try again.');
      console.error('Error fetching listings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (listingId: string) => {
    if (!active) {
      // TODO: Show wallet connection modal
      return;
    }

    try {
      setProcessing(true);
      setError(null);

      const response = await fetch(`/api/marketplace/listings/${listingId}/purchase`, {
        method: 'POST',
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to purchase ticket');
      }

      // Remove the purchased listing and refresh stats
      setListings(prev => prev.filter(listing => listing.tokenId !== listingId));
      fetchMarketStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to purchase ticket');
      console.error('Purchase error:', err);
    } finally {
      setProcessing(false);
    }
  };

  const handleFilterChange = (key: keyof MarketFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
    setPage(1); // Reset to first page when filters change
  };

  const clearFilters = () => {
    setFilters({ sortBy: 'date_desc' });
    setPage(1);
  };

  const getSortOptions = () => [
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
    { value: 'date_asc', label: 'Oldest First' },
    { value: 'date_desc', label: 'Newest First' },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Ticket Marketplace
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Buy and sell tickets securely on the blockchain
        </Typography>
      </Box>

      {/* Market Stats */}
      {marketStats && (
        <MarketplaceStats
          stats={marketStats}
          loading={statsLoading}
          sx={{ mb: 4 }}
        />
      )}

      {/* Filters */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            label="Search"
            value={filters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <FormControl fullWidth>
            <InputLabel>Event</InputLabel>
            <Select
              value={filters.eventId || ''}
              label="Event"
              onChange={(e) => handleFilterChange('eventId', e.target.value)}
            >
              <MenuItem value="">All Events</MenuItem>
              {events.map((event) => (
                <MenuItem key={event.id} value={event.id}>
                  {event.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={3}>
          <FormControl fullWidth>
            <InputLabel>Sort By</InputLabel>
            <Select
              value={filters.sortBy}
              label="Sort By"
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            >
              {getSortOptions().map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={2}>
          <Button
            fullWidth
            variant="outlined"
            onClick={clearFilters}
            disabled={!filters.search && !filters.eventId && filters.sortBy === 'date_desc'}
          >
            Clear Filters
          </Button>
        </Grid>
      </Grid>

      {/* Price Range */}
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Min Price"
              type="number"
              value={filters.minPrice || ''}
              onChange={(e) => handleFilterChange('minPrice', e.target.value ? Number(e.target.value) : undefined)}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Max Price"
              type="number"
              value={filters.maxPrice || ''}
              onChange={(e) => handleFilterChange('maxPrice', e.target.value ? Number(e.target.value) : undefined)}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
            />
          </Grid>
        </Grid>
      </Box>

      {/* Active Filters */}
      {(filters.search || filters.eventId || filters.minPrice || filters.maxPrice) && (
        <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {filters.search && (
            <Chip
              label={`Search: ${filters.search}`}
              onDelete={() => handleFilterChange('search', undefined)}
            />
          )}
          {filters.eventId && (
            <Chip
              label={`Event: ${events.find(e => e.id === filters.eventId)?.title}`}
              onDelete={() => handleFilterChange('eventId', undefined)}
            />
          )}
          {(filters.minPrice || filters.maxPrice) && (
            <Chip
              label={`Price: ${filters.minPrice || 0} - ${filters.maxPrice || '∞'}`}
              onDelete={() => {
                handleFilterChange('minPrice', undefined);
                handleFilterChange('maxPrice', undefined);
              }}
            />
          )}
        </Box>
      )}

      {/* Listings */}
      {error ? (
        <Alert
          severity="error"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={fetchListings}
              startIcon={<RefreshIcon />}
            >
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      ) : loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress />
        </Box>
      ) : listings.length === 0 ? (
        <Alert severity="info">
          No listings found matching your criteria.
        </Alert>
      ) : (
        <>
          <Grid container spacing={3}>
            {listings.map((listing, index) => (
              <Fade
                key={listing.tokenId}
                in={true}
                timeout={(index % ITEMS_PER_PAGE) * 100}
              >
                <Grid item xs={12} sm={6} md={4} lg={3}>
                  <MarketListingCard
                    listing={listing}
                    onPurchase={handlePurchase}
                    disabled={processing}
                  />
                </Grid>
              </Fade>
            ))}
          </Grid>

          {totalPages > 1 && (
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, value) => setPage(value)}
                color="primary"
                size="large"
              />
            </Box>
          )}
        </>
      )}
    </Container>
  );
};

export default Marketplace;
