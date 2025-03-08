import React, { useState } from 'react';
import {
  Box,
  Button,
  ButtonGroup,
  Menu,
  MenuItem,
  Popover,
  Typography,
  IconButton,
  TextField,
  useTheme,
} from '@mui/material';
import {
  DateRange as DateRangeIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Today as TodayIcon,
} from '@mui/icons-material';

import { useAnalytics } from './AnalyticsProvider';

const PRESET_RANGES = [
  { label: 'Today', value: 0 },
  { label: 'Yesterday', value: 1 },
  { label: 'Last 7 Days', value: 7 },
  { label: 'Last 30 Days', value: 30 },
  { label: 'Last 90 Days', value: 90 },
] as const;

interface AnalyticsDatePickerProps {
  className?: string;
  onChange?: (range: { start: Date; end: Date }) => void;
}

const AnalyticsDatePicker: React.FC<AnalyticsDatePickerProps> = ({
  className,
  onChange,
}) => {
  const theme = useTheme();
  const { timeRange, setTimeRange } = useAnalytics();
  
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [presetsAnchor, setPresetsAnchor] = useState<null | HTMLElement>(null);
  const [startDate, setStartDate] = useState<Date>(new Date(timeRange.start));
  const [endDate, setEndDate] = useState<Date>(new Date(timeRange.end));

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handlePresetsClick = (event: React.MouseEvent<HTMLElement>) => {
    setPresetsAnchor(event.currentTarget);
  };

  const handlePresetsClose = () => {
    setPresetsAnchor(null);
  };

  const handlePresetSelect = (days: number) => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    
    const start = new Date();
    start.setDate(start.getDate() - days);
    start.setHours(0, 0, 0, 0);
    
    handleApply(start, end);
    handlePresetsClose();
  };

  const handleApply = (start: Date, end: Date) => {
    setStartDate(start);
    setEndDate(end);
    setTimeRange(start.toISOString(), end.toISOString());
    onChange?.({ start, end });
    handleClose();
  };

  const handleQuickNav = (direction: 'prev' | 'next') => {
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const newStart = new Date(startDate);
    const newEnd = new Date(endDate);

    if (direction === 'prev') {
      newStart.setDate(newStart.getDate() - days);
      newEnd.setDate(newEnd.getDate() - days);
    } else {
      newStart.setDate(newStart.getDate() + days);
      newEnd.setDate(newEnd.getDate() + days);
    }
    
    handleApply(newStart, newEnd);
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    });
  };

  const formatDateRange = (): string => {
    if (startDate.toDateString() === endDate.toDateString()) {
      return formatDate(startDate);
    }
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  };

  const handleDateChange = (type: 'start' | 'end', dateString: string) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return;

    if (type === 'start') {
      if (date > endDate) return;
      setStartDate(date);
    } else {
      if (date < startDate) return;
      setEndDate(date);
    }
  };

  return (
    <Box className={className}>
      <ButtonGroup variant="outlined" size="small">
        <IconButton
          size="small"
          onClick={() => handleQuickNav('prev')}
          sx={{ borderRadius: 0 }}
        >
          <ChevronLeftIcon />
        </IconButton>

        <Button
          onClick={handleClick}
          startIcon={<DateRangeIcon />}
          sx={{ px: 2 }}
        >
          {formatDateRange()}
        </Button>

        <IconButton
          size="small"
          onClick={() => handleQuickNav('next')}
          sx={{ borderRadius: 0 }}
        >
          <ChevronRightIcon />
        </IconButton>

        <Button onClick={handlePresetsClick}>
          <TodayIcon />
        </Button>
      </ButtonGroup>

      <Menu
        anchorEl={presetsAnchor}
        open={Boolean(presetsAnchor)}
        onClose={handlePresetsClose}
      >
        {PRESET_RANGES.map((range) => (
          <MenuItem
            key={range.value}
            onClick={() => handlePresetSelect(range.value)}
          >
            {range.label}
          </MenuItem>
        ))}
      </Menu>

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
      >
        <Box sx={{ p: 2, display: 'flex', gap: 2 }}>
          <TextField
            label="Start Date"
            type="date"
            value={startDate.toISOString().split('T')[0]}
            onChange={(e) => handleDateChange('start', e.target.value)}
            inputProps={{
              max: endDate.toISOString().split('T')[0],
            }}
            size="small"
          />
          <TextField
            label="End Date"
            type="date"
            value={endDate.toISOString().split('T')[0]}
            onChange={(e) => handleDateChange('end', e.target.value)}
            inputProps={{
              min: startDate.toISOString().split('T')[0],
              max: new Date().toISOString().split('T')[0],
            }}
            size="small"
          />
        </Box>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            onClick={() => handleApply(startDate, endDate)}
          >
            Apply
          </Button>
        </Box>
      </Popover>
    </Box>
  );
};

export default AnalyticsDatePicker;
