import React, { useEffect, useState } from 'react';
import {
  Paper,
  Box,
  Typography,
  CircularProgress,
  Alert,
  ToggleButtonGroup,
  ToggleButton,
  useTheme,
} from '@mui/material';
import { scaleLinear } from 'd3-scale';
import type { Event } from '../../types';
import analyticsService from '../../services/analyticsService';

interface HeatmapChartProps {
  eventId: string;
  className?: string;
}

interface HeatmapCell {
  x: number;
  y: number;
  value: number;
  color: string;
}

type TimeRange = 'day' | 'week' | 'month';

const HeatmapChart: React.FC<HeatmapChartProps> = ({ eventId, className }) => {
  const theme = useTheme();
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const [data, setData] = useState<HeatmapCell[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [maxValue, setMaxValue] = useState(0);

  const CELL_SIZE = 30;
  const GRID_WIDTH = 24; // 24 hours
  const GRID_HEIGHT = 7; // 7 days
  const MARGIN = { top: 40, right: 40, bottom: 40, left: 60 };
  const WIDTH = GRID_WIDTH * CELL_SIZE + MARGIN.left + MARGIN.right;
  const HEIGHT = GRID_HEIGHT * CELL_SIZE + MARGIN.top + MARGIN.bottom;

  useEffect(() => {
    fetchHeatmapData();
  }, [eventId, timeRange]);

  const fetchHeatmapData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await analyticsService.generateHeatmap(eventId);
      
      const colorScale = scaleLinear<string>()
        .domain([0, response.max])
        .range([theme.palette.primary.light, theme.palette.primary.dark]);

      const heatmapData: HeatmapCell[] = [];
      response.data.forEach((row, y) => {
        row.forEach((value, x) => {
          heatmapData.push({
            x,
            y,
            value,
            color: colorScale(value),
          });
        });
      });

      setData(heatmapData);
      setMaxValue(response.max);
    } catch (err) {
      setError('Failed to fetch heatmap data');
      console.error('Error fetching heatmap data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getHourLabel = (hour: number): string => {
    return `${hour % 12 || 12}${hour < 12 ? 'am' : 'pm'}`;
  };

  const getDayLabel = (day: number): string => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[day];
  };

  if (error) {
    return (
      <Alert severity="error" className={className}>
        {error}
      </Alert>
    );
  }

  if (loading) {
    return (
      <Box
        className={className}
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: HEIGHT,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper className={className} sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h6">Activity Heatmap</Typography>
        <ToggleButtonGroup
          value={timeRange}
          exclusive
          onChange={(_event: React.MouseEvent<HTMLElement>, value: TimeRange | null) => 
            value && setTimeRange(value)
          }
          size="small"
        >
          <ToggleButton value="day">24H</ToggleButton>
          <ToggleButton value="week">7D</ToggleButton>
          <ToggleButton value="month">30D</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Box
        sx={{
          position: 'relative',
          width: WIDTH,
          height: HEIGHT,
        }}
      >
        {/* Y-axis labels */}
        <Box sx={{ position: 'absolute', left: 0, top: MARGIN.top }}>
          {Array.from({ length: GRID_HEIGHT }).map((_, i) => (
            <Typography
              key={i}
              variant="caption"
              sx={{
                position: 'absolute',
                top: i * CELL_SIZE,
                right: MARGIN.left - 10,
                transform: 'translateY(50%)',
              }}
            >
              {getDayLabel(i)}
            </Typography>
          ))}
        </Box>

        {/* X-axis labels */}
        <Box sx={{ position: 'absolute', top: 10, left: MARGIN.left }}>
          {Array.from({ length: GRID_WIDTH }).map((_, i) => (
            <Typography
              key={i}
              variant="caption"
              sx={{
                position: 'absolute',
                left: i * CELL_SIZE,
                transform: 'translateX(-50%)',
              }}
            >
              {getHourLabel(i)}
            </Typography>
          ))}
        </Box>

        {/* Heatmap grid */}
        <Box
          sx={{
            position: 'absolute',
            top: MARGIN.top,
            left: MARGIN.left,
            display: 'grid',
            gridTemplateColumns: `repeat(${GRID_WIDTH}, ${CELL_SIZE}px)`,
            gap: 1,
          }}
        >
          {data.map((cell, i) => (
            <Box
              key={i}
              sx={{
                width: CELL_SIZE - 2,
                height: CELL_SIZE - 2,
                backgroundColor: cell.color,
                borderRadius: 1,
                cursor: 'pointer',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'scale(1.1)',
                },
              }}
              title={`${cell.value} activities`}
            />
          ))}
        </Box>

        {/* Legend */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <Typography variant="caption">Less</Typography>
          <Box
            sx={{
              width: 100,
              height: 10,
              background: `linear-gradient(to right, ${theme.palette.primary.light}, ${theme.palette.primary.dark})`,
              borderRadius: 1,
            }}
          />
          <Typography variant="caption">More</Typography>
        </Box>
      </Box>
    </Paper>
  );
};

export default HeatmapChart;
