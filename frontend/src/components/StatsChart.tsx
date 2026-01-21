import { useMemo } from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import type { CharacterStats } from '../types';

interface StatsChartProps {
  data: CharacterStats[];
  dataKey: keyof CharacterStats;
  label: string;
  color?: string;
  timeRange?: string;
}

function formatXAxisTick(timestamp: number, rangeKey: string): string {
  const date = new Date(timestamp);
  switch (rangeKey) {
    case 'today':
    case '24h':
      return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    case '3d':
      return `${date.getDate()}.${date.getMonth() + 1} ${date.getHours()}:00`;
    case '7d':
      return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
    case '30d':
      return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
    default:
      return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
  }
}

function getTickInterval(rangeKey: string): number {
  switch (rangeKey) {
    case 'today':
    case '24h':
      return 60 * 60 * 1000;
    case '3d':
      return 6 * 60 * 60 * 1000;
    case '7d':
      return 24 * 60 * 60 * 1000;
    case '30d':
      return 3 * 24 * 60 * 60 * 1000;
    default:
      return 24 * 60 * 60 * 1000;
  }
}

function formatValue(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toFixed(Number.isInteger(value) ? 0 : 1);
}

export default function StatsChart({ 
  data, 
  dataKey, 
  label, 
  color = '#6366f1',
  timeRange = '7d'
}: StatsChartProps) {
  const chartData = useMemo(() => {
    return data.map(stat => ({
      timestamp: new Date(stat.valid_from).getTime(),
      value: stat[dataKey] as number | null,
    })).filter(d => d.value !== null && d.value !== undefined);
  }, [data, dataKey]);

  const xTicks = useMemo(() => {
    if (chartData.length === 0) return [];
    const interval = getTickInterval(timeRange);
    const minTime = chartData[0]?.timestamp || 0;
    const maxTime = chartData[chartData.length - 1]?.timestamp || 0;

    const ticks: number[] = [];
    const startTick = Math.ceil(minTime / interval) * interval;
    for (let t = startTick; t <= maxTime; t += interval) {
      ticks.push(t);
    }
    return ticks;
  }, [chartData, timeRange]);

  if (chartData.length < 2) {
    return (
      <div className="chart-container flex items-center justify-center h-48">
        <p className="text-[var(--text-muted)] text-sm">Not enough data to display chart</p>
      </div>
    );
  }

  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
          <defs>
            <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" strokeOpacity={0.5} />
          <XAxis
            dataKey="timestamp"
            type="number"
            domain={['dataMin', 'dataMax']}
            ticks={xTicks}
            tickFormatter={(value) => formatXAxisTick(value, timeRange)}
            stroke="var(--text-muted)"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: 'var(--border-color)' }}
          />
          <YAxis
            stroke="var(--text-muted)"
            fontSize={11}
            tickFormatter={formatValue}
            tickLine={false}
            axisLine={{ stroke: 'var(--border-color)' }}
            width={50}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            labelFormatter={(value) => new Date(value).toLocaleString('de-DE')}
            formatter={(value: number | undefined) => value !== undefined ? [formatValue(value), label] : ['', label]}
          />
          <Area
            type="monotone"
            dataKey="value"
            name={label}
            stroke={color}
            strokeWidth={2.5}
            fill={`url(#gradient-${dataKey})`}
            dot={false}
            activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
