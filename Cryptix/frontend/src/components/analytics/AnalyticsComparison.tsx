import React, { useState } from 'react';
import {
  Box,
  Button,
  Menu,
  MenuItem,
  Popover,
  Typography,
  Switch,
  FormControlLabel,
  useTheme,
} from '@mui/material';
import {
  Compare as CompareIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';

import { useAnalytics } from './AnalyticsProvider';

const COMPARISON_PRESETS = [
  { label: 'Previous Period', value: 'previous' },
  { label: 'Same Period Last Year', value: 'year' },
  { label: 'Custom Range', value: 'custom' },
] as const;

interface AnalyticsComparisonProps {
  className?: string;
  onChange?: (comparison: { enabled: boolean; timeRange?: { start: string; end: string } }) => void;
}

const AnalyticsComparison: React.FC<AnalyticsComparisonProps> = ({
  className,
  onChange,
}) => {
  const theme = useTheme();
  const { timeRange, comparison, setComparison } = useAnalytics();
  
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [presetsAnchor, setPresetsAnchor] = useState<null | HTMLElement>(null);
  const [customRange, setCustomRange] = useState<{ start: string; end: string }>({
    start: '',
    end: '',
  });

  const handleCustomClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCustomClose = () => {
    setAnchorEl(null);
  };

  const handlePresetsClick = (event: React.MouseEvent<HTMLElement>) => {
    setPresetsAnchor(event.currentTarget);
  };

  const handlePresetsClose = () => {
    setPresetsAnchor(null);
  };

  const handlePresetSelect = (preset: typeof COMPARISON_PRESETS[number]['value']) => {
    const currentStart = new Date(timeRange.start);
    const currentEnd = new Date(timeRange.end);
    const duration = currentEnd.getTime() - currentStart.getTime();

    if (preset === 'custom') {
      handlePresetsClose();
      setCustomRange({
        start: timeRange.start.split('T')[0],
        end: timeRange.end.split('T')[0],
      });
      setAnchorEl(presetsAnchor);
      return;
    }

    let start: Date;
    let end: Date;

    if (preset === 'previous') {
      end = new Date(currentStart);
      start = new Date(end.getTime() - duration);
    } else { // year
      start = new Date(currentStart);
      end = new Date(currentEnd);
      start.setFullYear(start.getFullYear() - 1);
      end.setFullYear(end.getFullYear() - 1);
    }

    handleApply({
      start: start.toISOString(),
      end: end.toISOString(),
    });
    handlePresetsClose();
  };

  const handleApply = (range: { start: string; end: string }) => {
    setComparison(true, range);
    onChange?.({ enabled: true, timeRange: range });
    handleCustomClose();
  };

  const handleToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    const enabled = event.target.checked;
    if (!enabled) {
      setComparison(false);
      onChange?.({ enabled: false });
    } else if (comparison.timeRange) {
      setComparison(true, comparison.timeRange);
      onChange?.({ enabled: true, timeRange: comparison.timeRange });
    } else {
      handlePresetsClick(event as any);
    }
  };

  const formatDateRange = (start: string, end: string): string => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
      });
    };

    if (startDate.toDateString() === endDate.toDateString()) {
      return formatDate(startDate);
    }
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  };

  const handleDateChange = (type: 'start' | 'end', dateString: string) => {
    setCustomRange(prev => ({
      ...prev,
      [type]: dateString,
    }));
  };

  return (
    <Box className={className}>
      <FormControlLabel
        control={
          <Switch
            checked={comparison.enabled}
            onChange={handleToggle}
            color="primary"
          />
        }
        label={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CompareIcon />
            <Typography variant="body2">
              {comparison.enabled && comparison.timeRange
                ? `vs ${formatDateRange(comparison.timeRange.start, comparison.timeRange.end)}`
                : 'Compare'}
            </Typography>
            {comparison.enabled && (
              <Button
                size="small"
                startIcon={<CalendarIcon />}
                onClick={handlePresetsClick}
              >
                Change
              </Button>
            )}
          </Box>
        }
      />

      <Menu
        anchorEl={presetsAnchor}
        open={Boolean(presetsAnchor)}
        onClose={handlePresetsClose}
      >
        {COMPARISON_PRESETS.map(({ label, value }) => (
          <MenuItem
            key={value}
            onClick={() => handlePresetSelect(value)}
          >
            {label}
          </MenuItem>
        ))}
      </Menu>

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleCustomClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Custom Comparison Range
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <input
              type="date"
              value={customRange.start}
              onChange={(e) => handleDateChange('start', e.target.value)}
              max={customRange.end || undefined}
            />
            <input
              type="date"
              value={customRange.end}
              onChange={(e) => handleDateChange('end', e.target.value)}
              min={customRange.start || undefined}
            />
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              onClick={() => handleApply(customRange)}
              disabled={!customRange.start || !customRange.end}
            >
              Apply
            </Button>
          </Box>
        </Box>
      </Popover>
    </Box>
  );
};

export default AnalyticsComparison;
