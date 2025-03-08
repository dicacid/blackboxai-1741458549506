import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  TooltipProps,
} from 'recharts';
import { useTheme } from '@mui/material';

import AnalyticsTooltip from './AnalyticsTooltip';
import { generateChartColors } from '../../utils/analytics';

interface ChartSeries {
  dataKey: string;
  name: string;
  color?: string;
  type?: 'solid' | 'dashed' | 'dotted';
  opacity?: number;
  yAxis?: 'left' | 'right';
}

interface ChartOptions {
  stacked?: boolean;
  percentage?: boolean;
  animation?: boolean;
  tooltip?: boolean;
  legend?: boolean;
  grid?: boolean;
  xAxis?: {
    dataKey: string;
    type?: 'category' | 'number';
    format?: (value: any) => string;
    label?: string;
  };
  yAxis?: {
    left?: {
      label?: string;
      format?: (value: any) => string;
      domain?: [number | 'auto', number | 'auto'];
    };
    right?: {
      label?: string;
      format?: (value: any) => string;
      domain?: [number | 'auto', number | 'auto'];
    };
  };
}

interface AnalyticsChartProps {
  className?: string;
  type: 'line' | 'bar' | 'area' | 'pie' | 'radar';
  data: any[];
  series: ChartSeries[];
  options?: ChartOptions;
  height?: number;
}

const CustomTooltip = ({ active, payload, label }: TooltipProps<any, any>) => {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <AnalyticsTooltip
      timestamp={String(label)}
      data={payload.map((entry) => ({
        label: String(entry.name),
        value: entry.value,
        color: entry.color,
      }))}
    />
  );
};

const AnalyticsChart: React.FC<AnalyticsChartProps> = ({
  className,
  type,
  data,
  series,
  options = {},
  height = 300,
}) => {
  const theme = useTheme();
  const colors = generateChartColors(series.length);

  const getStrokeDasharray = (type?: 'solid' | 'dashed' | 'dotted') => {
    switch (type) {
      case 'dashed':
        return '5 5';
      case 'dotted':
        return '1 5';
      default:
        return 'none';
    }
  };

  const renderLineChart = () => (
    <LineChart data={data} height={height}>
      {options.grid && (
        <CartesianGrid
          strokeDasharray="3 3"
          stroke={theme.palette.divider}
        />
      )}
      <XAxis
        dataKey={options.xAxis?.dataKey || ''}
        type={options.xAxis?.type || 'category'}
        tickFormatter={options.xAxis?.format}
        label={options.xAxis?.label ? { value: options.xAxis.label, position: 'bottom' } : undefined}
        stroke={theme.palette.text.secondary}
      />
      <YAxis
        yAxisId="left"
        tickFormatter={options.yAxis?.left?.format}
        domain={options.yAxis?.left?.domain as [number, number] | undefined}
        label={options.yAxis?.left?.label ? { value: options.yAxis.left.label, angle: -90, position: 'left' } : undefined}
        stroke={theme.palette.text.secondary}
      />
      {options.yAxis?.right && (
        <YAxis
          yAxisId="right"
          orientation="right"
          tickFormatter={options.yAxis.right.format}
          domain={options.yAxis.right.domain as [number, number] | undefined}
          label={options.yAxis.right.label ? { value: options.yAxis.right.label, angle: 90, position: 'right' } : undefined}
          stroke={theme.palette.text.secondary}
        />
      )}
      {options.tooltip && <Tooltip content={CustomTooltip} />}
      {options.legend && <Legend />}
      {series.map((s, index) => (
        <Line
          key={s.dataKey}
          type="monotone"
          dataKey={s.dataKey}
          name={s.name}
          stroke={s.color || colors[index]}
          strokeDasharray={getStrokeDasharray(s.type)}
          strokeOpacity={s.opacity}
          yAxisId={s.yAxis || 'left'}
          isAnimationActive={options.animation !== false}
        />
      ))}
    </LineChart>
  );

  const renderBarChart = () => (
    <BarChart data={data} height={height}>
      {options.grid && (
        <CartesianGrid
          strokeDasharray="3 3"
          stroke={theme.palette.divider}
        />
      )}
      <XAxis
        dataKey={options.xAxis?.dataKey || ''}
        type={options.xAxis?.type || 'category'}
        tickFormatter={options.xAxis?.format}
        label={options.xAxis?.label ? { value: options.xAxis.label, position: 'bottom' } : undefined}
        stroke={theme.palette.text.secondary}
      />
      <YAxis
        yAxisId="left"
        tickFormatter={options.yAxis?.left?.format}
        domain={options.yAxis?.left?.domain as [number, number] | undefined}
        label={options.yAxis?.left?.label ? { value: options.yAxis.left.label, angle: -90, position: 'left' } : undefined}
        stroke={theme.palette.text.secondary}
      />
      {options.tooltip && <Tooltip content={CustomTooltip} />}
      {options.legend && <Legend />}
      {series.map((s, index) => (
        <Bar
          key={s.dataKey}
          dataKey={s.dataKey}
          name={s.name}
          fill={s.color || colors[index]}
          fillOpacity={s.opacity}
          yAxisId={s.yAxis || 'left'}
          isAnimationActive={options.animation !== false}
        />
      ))}
    </BarChart>
  );

  const renderAreaChart = () => (
    <AreaChart data={data} height={height}>
      {options.grid && (
        <CartesianGrid
          strokeDasharray="3 3"
          stroke={theme.palette.divider}
        />
      )}
      <XAxis
        dataKey={options.xAxis?.dataKey || ''}
        type={options.xAxis?.type || 'category'}
        tickFormatter={options.xAxis?.format}
        label={options.xAxis?.label ? { value: options.xAxis.label, position: 'bottom' } : undefined}
        stroke={theme.palette.text.secondary}
      />
      <YAxis
        yAxisId="left"
        tickFormatter={options.yAxis?.left?.format}
        domain={options.yAxis?.left?.domain as [number, number] | undefined}
        label={options.yAxis?.left?.label ? { value: options.yAxis.left.label, angle: -90, position: 'left' } : undefined}
        stroke={theme.palette.text.secondary}
      />
      {options.tooltip && <Tooltip content={CustomTooltip} />}
      {options.legend && <Legend />}
      {series.map((s, index) => (
        <Area
          key={s.dataKey}
          type="monotone"
          dataKey={s.dataKey}
          name={s.name}
          fill={s.color || colors[index]}
          stroke={s.color || colors[index]}
          fillOpacity={s.opacity || 0.2}
          yAxisId={s.yAxis || 'left'}
          isAnimationActive={options.animation !== false}
        />
      ))}
    </AreaChart>
  );

  const renderPieChart = () => (
    <PieChart height={height}>
      <Pie
        data={data}
        dataKey={series[0].dataKey}
        nameKey={options.xAxis?.dataKey || 'name'}
        cx="50%"
        cy="50%"
        outerRadius={height / 3}
        isAnimationActive={options.animation !== false}
      >
        {data.map((_, index) => (
          <Cell
            key={index}
            fill={series[0].color || colors[index % colors.length]}
            fillOpacity={series[0].opacity}
          />
        ))}
      </Pie>
      {options.tooltip && <Tooltip content={CustomTooltip} />}
      {options.legend && <Legend />}
    </PieChart>
  );

  const renderRadarChart = () => (
    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data} height={height}>
      <PolarGrid stroke={theme.palette.divider} />
      <PolarAngleAxis
        dataKey={options.xAxis?.dataKey || ''}
        tickFormatter={options.xAxis?.format}
        stroke={theme.palette.text.secondary}
      />
      <PolarRadiusAxis
        tickFormatter={options.yAxis?.left?.format}
        stroke={theme.palette.text.secondary}
      />
      {series.map((s, index) => (
        <Radar
          key={s.dataKey}
          name={s.name}
          dataKey={s.dataKey}
          stroke={s.color || colors[index]}
          fill={s.color || colors[index]}
          fillOpacity={s.opacity || 0.2}
          isAnimationActive={options.animation !== false}
        />
      ))}
      {options.tooltip && <Tooltip content={CustomTooltip} />}
      {options.legend && <Legend />}
    </RadarChart>
  );

  const renderChart = () => {
    switch (type) {
      case 'line':
        return renderLineChart();
      case 'bar':
        return renderBarChart();
      case 'area':
        return renderAreaChart();
      case 'pie':
        return renderPieChart();
      case 'radar':
        return renderRadarChart();
      default:
        return <div />;
    }
  };

  return (
    <ResponsiveContainer width="100%" height={height} className={className}>
      {renderChart()}
    </ResponsiveContainer>
  );
};

// Helper components for common chart types
export const LineAnalyticsChart: React.FC<Omit<AnalyticsChartProps, 'type'>> = (props) => (
  <AnalyticsChart {...props} type="line" />
);

export const BarAnalyticsChart: React.FC<Omit<AnalyticsChartProps, 'type'>> = (props) => (
  <AnalyticsChart {...props} type="bar" />
);

export const AreaAnalyticsChart: React.FC<Omit<AnalyticsChartProps, 'type'>> = (props) => (
  <AnalyticsChart {...props} type="area" />
);

export const PieAnalyticsChart: React.FC<Omit<AnalyticsChartProps, 'type'>> = (props) => (
  <AnalyticsChart {...props} type="pie" />
);

export const RadarAnalyticsChart: React.FC<Omit<AnalyticsChartProps, 'type'>> = (props) => (
  <AnalyticsChart {...props} type="radar" />
);

export default AnalyticsChart;
