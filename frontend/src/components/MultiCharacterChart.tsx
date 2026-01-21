import { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { CharacterStats } from '../types';
import TimeRangePicker, { getDateRange } from './TimeRangePicker';
import StatIcon from './StatIcon';

interface DataSeries {
  characterUuid: string;
  characterName: string;
  color: string;
  data: CharacterStats[];
  icon?: string;
}

interface MultiCharacterChartProps {
  series: DataSeries[];
  onTimeRangeChange: (fromDate: Date, toDate: Date) => void;
}

const CHART_COLORS = [
  '#6366f1',
  '#22c55e',
  '#f59e0b',
  '#ec4899',
  '#14b8a6',
  '#f97316',
  '#8b5cf6',
  '#ef4444',
  '#06b6d4',
  '#84cc16',
];

const PRIMARY_STATS: { key: keyof CharacterStats; label: string }[] = [
  { key: 'level', label: 'Level' },
  { key: 'xp_percent', label: 'XP %' },
  { key: 'playtime_hours', label: 'Playtime' },
  { key: 'mobs_killed', label: 'Mobs' },
  { key: 'deaths', label: 'Deaths' },
];

const SECONDARY_STATS: { key: keyof CharacterStats; label: string }[] = [
  { key: 'chests_found', label: 'Chests' },
  { key: 'discoveries', label: 'Discoveries' },
  { key: 'blocks_walked', label: 'Blocks' },
  { key: 'dungeons_total', label: 'Dungeons' },
  { key: 'raids_total', label: 'Raids' },
  { key: 'quests_count', label: 'Quests' },
  { key: 'world_events', label: 'Events' },
  { key: 'caves', label: 'Caves' },
  { key: 'lootruns', label: 'Lootruns' },
];

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

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    dataKey: string;
    value: number | null;
    color: string;
    name: string;
  }>;
  label?: number;
  seriesMap: Map<string, DataSeries>;
}

function CustomTooltip({ active, payload, label, seriesMap }: CustomTooltipProps) {
  if (!active || !payload || !label) return null;

  const validPayload = payload.filter(p => p.value !== null && p.value !== undefined);
  if (validPayload.length === 0) return null;

  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-date">
        {new Date(label).toLocaleString('de-DE')}
      </div>
      <div className="chart-tooltip-items">
        {validPayload.map(entry => {
          const series = seriesMap.get(entry.dataKey);
          return (
            <div key={entry.dataKey} className="chart-tooltip-item">
              <div
                className="chart-tooltip-dot"
                style={{ background: entry.color }}
              />
              <span className="chart-tooltip-name">{series?.characterName || entry.name}</span>
              <span className="chart-tooltip-value">{formatValue(entry.value!)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function MultiCharacterChart({ series, onTimeRangeChange }: MultiCharacterChartProps) {
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedStat, setSelectedStat] = useState<keyof CharacterStats>('level');
  const [visibleSeries, setVisibleSeries] = useState<Set<string>>(new Set(series.map(s => s.characterUuid)));
  const [showMoreStats, setShowMoreStats] = useState(false);

  const handleTimeRangeChange = (range: string, fromDate?: Date, toDate?: Date) => {
    setTimeRange(range);
    if (fromDate && toDate) {
      onTimeRangeChange(fromDate, toDate);
    } else {
      const dates = getDateRange(range);
      onTimeRangeChange(dates.from, dates.to);
    }
  };

  const toggleSeriesVisibility = (uuid: string) => {
    setVisibleSeries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(uuid)) {
        newSet.delete(uuid);
      } else {
        newSet.add(uuid);
      }
      return newSet;
    });
  };

  const seriesMap = useMemo(() => {
    const map = new Map<string, DataSeries>();
    series.forEach(s => map.set(s.characterUuid, s));
    return map;
  }, [series]);

  const chartData = useMemo(() => {
    const allTimestamps = new Set<number>();
    series.forEach(s => {
      s.data.forEach(stat => {
        allTimestamps.add(new Date(stat.valid_from).getTime());
      });
    });

    const sortedTimestamps = Array.from(allTimestamps).sort((a, b) => a - b);

    return sortedTimestamps.map(timestamp => {
      const point: Record<string, number | null> = { timestamp };
      series.forEach(s => {
        if (!visibleSeries.has(s.characterUuid)) {
          point[s.characterUuid] = null;
          return;
        }
        const stat = s.data.find(d => new Date(d.valid_from).getTime() === timestamp);
        if (stat) {
          point[s.characterUuid] = stat[selectedStat] as number | null;
        }
      });
      return point;
    });
  }, [series, selectedStat, visibleSeries]);

  const interpolatedChartData = useMemo(() => {
    if (chartData.length === 0) return [];

    const result = [...chartData];

    series.forEach(s => {
      if (!visibleSeries.has(s.characterUuid)) return;

      let lastValue: number | null = null;
      for (let i = 0; i < result.length; i++) {
        const val = result[i][s.characterUuid];
        if (val !== null && val !== undefined) {
          lastValue = val;
        } else if (lastValue !== null) {
          result[i][s.characterUuid] = lastValue;
        }
      }
    });

    return result;
  }, [chartData, series, visibleSeries]);

  const xTicks = useMemo(() => {
    if (interpolatedChartData.length === 0) return [];
    const interval = getTickInterval(timeRange);
    const minTime = interpolatedChartData[0]?.timestamp || 0;
    const maxTime = interpolatedChartData[interpolatedChartData.length - 1]?.timestamp || 0;

    const ticks: number[] = [];
    const startTick = Math.ceil(minTime / interval) * interval;
    for (let t = startTick; t <= maxTime; t += interval) {
      ticks.push(t);
    }
    return ticks;
  }, [interpolatedChartData, timeRange]);

  const yDomain = useMemo(() => {
    if (interpolatedChartData.length === 0) return [0, 'auto'] as [number, string];

    let minValue = Infinity;
    let maxValue = -Infinity;

    interpolatedChartData.forEach(point => {
      series.forEach(s => {
        if (!visibleSeries.has(s.characterUuid)) return;
        const value = point[s.characterUuid];
        if (value !== null && value !== undefined && typeof value === 'number') {
          minValue = Math.min(minValue, value);
          maxValue = Math.max(maxValue, value);
        }
      });
    });

    if (minValue === Infinity || maxValue === -Infinity) {
      return [0, 'auto'] as [number, string];
    }

    const padding = (maxValue - minValue) * 0.1;
    return [Math.max(0, Math.floor(minValue - padding)), Math.ceil(maxValue + padding)] as [number, number];
  }, [interpolatedChartData, series, visibleSeries]);

  const hasData = interpolatedChartData.length > 0;

  return (
    <div className="card p-6">
      <div className="flex flex-col gap-4 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-sm font-medium text-[var(--text-secondary)]">Stats History</h2>
          <TimeRangePicker value={timeRange} onChange={handleTimeRangeChange} />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {PRIMARY_STATS.map(opt => (
            <button
              key={opt.key}
              onClick={() => setSelectedStat(opt.key)}
              className={`stat-tab-button ${selectedStat === opt.key ? 'active' : ''}`}
            >
              <StatIcon stat={opt.key} size={14} />
              <span>{opt.label}</span>
            </button>
          ))}
          <div className="relative">
            <button
              onClick={() => setShowMoreStats(!showMoreStats)}
              className="stat-tab-button more-button"
            >
              <span>More</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 10l5 5 5-5z" />
              </svg>
            </button>
            {showMoreStats && (
              <div className="stat-dropdown">
                {SECONDARY_STATS.map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => {
                      setSelectedStat(opt.key);
                      setShowMoreStats(false);
                    }}
                    className={`stat-dropdown-item ${selectedStat === opt.key ? 'active' : ''}`}
                  >
                    <StatIcon stat={opt.key} size={14} />
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="chart-container">
        {hasData ? (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={interpolatedChartData} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
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
                domain={yDomain}
              />
              <Tooltip
                content={<CustomTooltip seriesMap={seriesMap} />}
                cursor={{ stroke: 'var(--border-hover)', strokeWidth: 1 }}
              />
              {series.map((s, idx) => (
                visibleSeries.has(s.characterUuid) && (
                  <Line
                    key={s.characterUuid}
                    type="monotone"
                    dataKey={s.characterUuid}
                    name={s.characterName}
                    stroke={s.color || CHART_COLORS[idx % CHART_COLORS.length]}
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }}
                    connectNulls={false}
                  />
                )
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-48">
            <p className="text-[var(--text-muted)] text-sm">No data available for this time range</p>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-[var(--border-color)]">
        {series.map((s, idx) => (
          <button
            key={s.characterUuid}
            onClick={() => toggleSeriesVisibility(s.characterUuid)}
            className={`legend-button ${!visibleSeries.has(s.characterUuid) ? 'inactive' : ''}`}
          >
            <div
              className="legend-dot"
              style={{ background: s.color || CHART_COLORS[idx % CHART_COLORS.length] }}
            />
            <span>{s.characterName}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export { CHART_COLORS };
export type { DataSeries };
