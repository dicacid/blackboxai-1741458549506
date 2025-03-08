import React, { useState, useEffect } from 'react';
import {
  Paper,
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Typography,
  Button,
  Chip,
  Collapse,
  useTheme,
} from '@mui/material';
import {
  FilterList as FilterIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import type { Event } from '../../types';
import eventService from '../../services/eventService';

interface EventFiltersProps {
  onFilterChange: (filters: EventFilters) => void;
  loading?: boolean;
}

export interface EventFilters {
  search?: string;
  category?: string;
  location?: string;
  priceRange?: {
    min: number;
    max: number;
  };
  status?: Event['status'];
}

const EventFilters: React.FC<EventFiltersProps> = ({
  onFilterChange,
  loading = false,
}) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [filters, setFilters] = useState<EventFilters>({});
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const [categoryData, locationData] = await Promise.all([
          eventService.getEventCategories(),
          eventService.getEventLocations(),
        ]);
        setCategories(categoryData);
        setLocations(locationData);
      } catch (error) {
        console.error('Error fetching filter options:', error);
      }
    };

    fetchFilterOptions();
  }, []);

  const handleFilterChange = (
    key: keyof EventFilters,
    value: string | { min: number; max: number } | undefined
  ) => {
    const newFilters = {
      ...filters,
      [key]: value,
    };

    if (!value) {
      delete newFilters[key];
    }

    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handlePriceRangeChange = (_: unknown, newValue: number | number[]) => {
    if (Array.isArray(newValue)) {
      setPriceRange(newValue as [number, number]);
      handleFilterChange('priceRange', {
        min: newValue[0],
        max: newValue[1],
      });
    }
  };

  const clearFilters = () => {
    setFilters({});
    setPriceRange([0, 1000]);
    onFilterChange({});
  };

  const activeFiltersCount = Object.keys(filters).length;

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Button
          startIcon={<FilterIcon />}
          onClick={() => setExpanded(!expanded)}
          sx={{ mr: 2 }}
        >
          Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
        </Button>
        {activeFiltersCount > 0 && (
          <Button
            startIcon={<ClearIcon />}
            onClick={clearFilters}
            color="inherit"
            size="small"
          >
            Clear All
          </Button>
        )}
      </Box>

      <Collapse in={expanded}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Search Events"
            value={filters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            disabled={loading}
            fullWidth
          />

          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl fullWidth disabled={loading}>
              <InputLabel>Category</InputLabel>
              <Select
                value={filters.category || ''}
                label="Category"
                onChange={(e) => handleFilterChange('category', e.target.value)}
              >
                <MenuItem value="">All Categories</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth disabled={loading}>
              <InputLabel>Location</InputLabel>
              <Select
                value={filters.location || ''}
                label="Location"
                onChange={(e) => handleFilterChange('location', e.target.value)}
              >
                <MenuItem value="">All Locations</MenuItem>
                {locations.map((location) => (
                  <MenuItem key={location} value={location}>
                    {location}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth disabled={loading}>
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status || ''}
                label="Status"
                onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
              >
                <MenuItem value="">All Status</MenuItem>
                <MenuItem value="upcoming">Upcoming</MenuItem>
                <MenuItem value="ongoing">Live Now</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ px: 2 }}>
            <Typography gutterBottom>Price Range</Typography>
            <Slider
              value={priceRange}
              onChange={handlePriceRangeChange}
              valueLabelDisplay="auto"
              min={0}
              max={1000}
              disabled={loading}
              valueLabelFormat={(value) => `$${value}`}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">
                ${priceRange[0]}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ${priceRange[1]}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Collapse>

      {activeFiltersCount > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
          {Object.entries(filters).map(([key, value]) => {
            if (!value) return null;
            let label = '';
            if (key === 'priceRange') {
              label = `Price: $${(value as { min: number; max: number }).min} - $${
                (value as { min: number; max: number }).max
              }`;
            } else {
              label = `${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`;
            }
            return (
              <Chip
                key={key}
                label={label}
                onDelete={() => handleFilterChange(key as keyof EventFilters, undefined)}
                disabled={loading}
              />
            );
          })}
        </Box>
      )}
    </Paper>
  );
};

export default EventFilters;
