import { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
} from 'recharts';
import type { CharacterStats } from '../types';
import TimeRangePicker, { getDateRange } from './TimeRangePicker';
import StatIcon from './StatIcon';
import SessionList from './SessionList';

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
    case '1h':
    case '3h':
    case '6h':
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
    case '1h':
      return 10 * 60 * 1000;
    case '3h':
      return 30 * 60 * 1000;
    case '6h':
      return 60 * 60 * 1000;
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

  const uniqueEntries = new Map();
  validPayload.forEach(entry => {
    if (!uniqueEntries.has(entry.dataKey)) {
      uniqueEntries.set(entry.dataKey, entry);
    }
  });

  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-date">
        {new Date(label).toLocaleString('de-DE')}
      </div>
      <div className="chart-tooltip-items">
        {Array.from(uniqueEntries.values()).map(entry => {
          const series = seriesMap.get(entry.dataKey as string);
          return (
            <div key={entry.dataKey} className="chart-tooltip-item">
              <div
                className="chart-tooltip-dot"
                style={{ background: entry.color }}
              />
              <span className="chart-tooltip-name">{series?.characterName || entry.name}</span>
              <span className="chart-tooltip-value">{formatValue(entry.value as number)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function MultiCharacterChart({ series, onTimeRangeChange }: MultiCharacterChartProps) {
  const [timeRange, setTimeRange] = useState('24h');
  const [selectedStat, setSelectedStat] = useState<keyof CharacterStats>('level');
  const [hiddenSeries, setHiddenSeries] = useState<Set<string>>(new Set());
  const [showMoreStats, setShowMoreStats] = useState(false);
  const [hoveredSeries, setHoveredSeries] = useState<string | null>(null);

  const handleTimeRangeChange = (range: string, fromDate?: Date, toDate?: Date) => {
    setTimeRange(range);
    if (fromDate && toDate) {
      onTimeRangeChange(fromDate, toDate);
    } else {
      const dates = getDateRange(range);
      onTimeRangeChange(dates.from, dates.to);
    }
  };

  const visibleSeries = useMemo(() => {
    return new Set(
      series
        .filter(s => !hiddenSeries.has(s.characterUuid))
        .map(s => s.characterUuid)
    );
  }, [series, hiddenSeries]);

  const toggleSeriesVisibility = (uuid: string) => {
    setHiddenSeries(prev => {
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
    
    const { from, to } = getDateRange(timeRange);
    allTimestamps.add(from.getTime());
    allTimestamps.add(to.getTime());

    series.forEach(s => {
      s.data.forEach(stat => {
        let ts = stat.valid_from;
        allTimestamps.add(new Date(ts).getTime());
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
        const stat = s.data.find(d => {
          let ts = d.valid_from;
          return new Date(ts).getTime() === timestamp;
        });
        if (stat) {
          point[s.characterUuid] = stat[selectedStat] as number | null;
        }
      });
      return point;
    });
  }, [series, selectedStat, visibleSeries, timeRange]);

  const { interpolatedData, realDataMarkers } = useMemo(() => {
    if (chartData.length === 0) return { interpolatedData: [], realDataMarkers: new Map<string, Set<number>>() };

    const result = chartData.map(p => ({ ...p }));
    const markers = new Map<string, Set<number>>();

    series.forEach(s => {
      if (!visibleSeries.has(s.characterUuid)) return;
      
      const realTimestamps = new Set<number>();
      
      chartData.forEach((point) => {
        const val = point[s.characterUuid];
        if (val !== null && val !== undefined) {
          realTimestamps.add(point.timestamp as number);
        }
      });
      
      markers.set(s.characterUuid, realTimestamps);

      let lastValue: number | null = null;
      for (let i = 0; i < result.length; i++) {
        const val = result[i][s.characterUuid];
        if (val !== null && val !== undefined) {
          lastValue = val;
        } else if (lastValue !== null) {
          result[i][s.characterUuid] = lastValue;
        }
      }

      let firstValue: number | null = null;
      for (let i = 0; i < result.length; i++) {
        const val = result[i][s.characterUuid];
        if (val !== null && val !== undefined) {
          firstValue = val;
          break;
        }
      }
      if (firstValue !== null) {
        for (let i = 0; i < result.length; i++) {
          const val = result[i][s.characterUuid];
          if (val !== null && val !== undefined) {
            break;
          }
          result[i][s.characterUuid] = firstValue;
        }
      }
    });

    return { interpolatedData: result, realDataMarkers: markers };
  }, [chartData, series, visibleSeries]);

  const interpolatedChartData = interpolatedData;

  const xDomain = useMemo(() => {
    const dates = getDateRange(timeRange);
    return [dates.from.getTime(), dates.to.getTime()] as [number, number];
  }, [timeRange, series]);

  const xTicks = useMemo(() => {
    const interval = getTickInterval(timeRange);
    const [minTime, maxTime] = xDomain;

    const ticks: number[] = [];
    const startTick = Math.ceil(minTime / interval) * interval;
    for (let t = startTick; t <= maxTime; t += interval) {
      ticks.push(t);
    }
    return ticks;
  }, [xDomain, timeRange]);

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

  const { solidChartData, dashedChartData } = useMemo(() => {
    const INTERPOLATION_THRESHOLD = 60 * 60 * 1000;
    
    const solid = interpolatedChartData.map(point => {
      const newPoint: Record<string, number | null> = { timestamp: point.timestamp as number };
      
      series.forEach(s => {
        if (!visibleSeries.has(s.characterUuid)) {
          newPoint[s.characterUuid] = null;
          return;
        }
        
        const realTs = realDataMarkers.get(s.characterUuid);
        if (!realTs) {
          newPoint[s.characterUuid] = null;
          return;
        }
        
        const currentTs = point.timestamp as number;
        let minDistance = Infinity;
        
        realTs.forEach(ts => {
          const dist = Math.abs(currentTs - ts);
          if (dist < minDistance) {
            minDistance = dist;
          }
        });
        
        if (minDistance <= INTERPOLATION_THRESHOLD) {
          newPoint[s.characterUuid] = point[s.characterUuid] as number | null;
        } else {
          newPoint[s.characterUuid] = null;
        }
      });
      
      return newPoint;
    });

    const dashed = interpolatedChartData.map((point, index) => {
      const newPoint: Record<string, number | null> = { timestamp: point.timestamp as number };
      
      series.forEach(s => {
        if (!visibleSeries.has(s.characterUuid)) {
          newPoint[s.characterUuid] = null;
          return;
        }
        
        const realTs = realDataMarkers.get(s.characterUuid);
        if (!realTs) {
          // If no real data at all (but we have fallback data), make it all dashed
          newPoint[s.characterUuid] = point[s.characterUuid] as number | null;
          return;
        }
        
        const currentTs = point.timestamp as number;
        let minDistance = Infinity;
        
        realTs.forEach(ts => {
          const dist = Math.abs(currentTs - ts);
          if (dist < minDistance) {
            minDistance = dist;
          }
        });
        
        const isDashed = minDistance > INTERPOLATION_THRESHOLD;
        
        // Determine if neighbors are dashed to include boundary points
        let prevPixelDashed = false;
        if (index > 0) {
           const prevTs = interpolatedChartData[index - 1].timestamp as number;
           let prevMinDist = Infinity;
           realTs.forEach(ts => {
             const dist = Math.abs(prevTs - ts);
             if (dist < prevMinDist) prevMinDist = dist;
           });
           if (prevMinDist > INTERPOLATION_THRESHOLD) prevPixelDashed = true;
        }

        let nextPixelDashed = false;
        if (index < interpolatedChartData.length - 1) {
           const nextTs = interpolatedChartData[index + 1].timestamp as number;
           let nextMinDist = Infinity;
           realTs.forEach(ts => {
             const dist = Math.abs(nextTs - ts);
             if (dist < nextMinDist) nextMinDist = dist;
           });
           if (nextMinDist > INTERPOLATION_THRESHOLD) nextPixelDashed = true;
        }

        if (isDashed || prevPixelDashed || nextPixelDashed) {
          newPoint[s.characterUuid] = point[s.characterUuid] as number | null;
        } else {
          newPoint[s.characterUuid] = null;
        }
      });
      
      return newPoint;
    });

    return { solidChartData: solid, dashedChartData: dashed };
  }, [interpolatedChartData, series, visibleSeries, realDataMarkers]);

  const offlineZones = useMemo(() => {
    if (!hoveredSeries || !dashedChartData.length) return [];

    const zones: { x1: number; x2: number }[] = [];
    let startTimestamp: number | null = null;

    dashedChartData.forEach((point, index) => {
      const val = point[hoveredSeries];
      const hasValue = val !== null && val !== undefined;

      if (hasValue && startTimestamp === null) {
        startTimestamp = point.timestamp as number;
      } else if (!hasValue && startTimestamp !== null) {

        const prevPoint = dashedChartData[index - 1];
        if (prevPoint) {
           zones.push({ x1: startTimestamp, x2: prevPoint.timestamp as number });
        }
        startTimestamp = null;
      }
    });

    if (startTimestamp !== null) {
      const lastPoint = dashedChartData[dashedChartData.length - 1];
      zones.push({ x1: startTimestamp, x2: lastPoint.timestamp as number });
    }

    return zones;
  }, [dashedChartData, hoveredSeries]);

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
            <LineChart margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" strokeOpacity={0.5} />
              
              {offlineZones.map((zone, idx) => (
                <ReferenceArea
                  key={idx}
                  x1={zone.x1}
                  x2={zone.x2}
                  fill="var(--border-color)"
                  fillOpacity={0.15}
                />
              ))}

              <XAxis
                dataKey="timestamp"
                type="number"
                domain={xDomain}
                ticks={xTicks}
                tickFormatter={(value) => formatXAxisTick(value, timeRange)}
                stroke="var(--text-muted)"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: 'var(--border-color)' }}
                allowDuplicatedCategory={false}
                allowDataOverflow={true}
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
                cursor={{ stroke: 'var(--text-muted)', strokeWidth: 1, strokeDasharray: '4 4' }}
              />
              {series.map((s, idx) => (
                visibleSeries.has(s.characterUuid) && (
                  <Line
                    key={`${s.characterUuid}-dashed`}
                    data={dashedChartData}
                    type="monotone"
                    dataKey={s.characterUuid}
                    name={`${s.characterName} (offline)`}
                    stroke={s.color || CHART_COLORS[idx % CHART_COLORS.length]}
                    strokeWidth={2}
                    strokeDasharray="6 4"
                    strokeOpacity={hoveredSeries && hoveredSeries !== s.characterUuid ? 0.1 : 0.5}
                    dot={false}
                    activeDot={false}
                    connectNulls={false}
                    legendType="none"
                    isAnimationActive={false}
                  />
                )
              ))}
              {series.map((s, idx) => (
                visibleSeries.has(s.characterUuid) && (
                  <Line
                    key={`${s.characterUuid}-solid`}
                    data={solidChartData}
                    type="monotone"
                    dataKey={s.characterUuid}
                    name={s.characterName}
                    stroke={s.color || CHART_COLORS[idx % CHART_COLORS.length]}
                    strokeWidth={hoveredSeries === s.characterUuid ? 3 : 2.5}
                    strokeOpacity={hoveredSeries && hoveredSeries !== s.characterUuid ? 0.1 : 1}
                    dot={false}
                    activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }}
                    connectNulls={false}
                    onMouseEnter={() => setHoveredSeries(s.characterUuid)}
                    onMouseLeave={() => setHoveredSeries(null)}
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
            onMouseEnter={() => setHoveredSeries(s.characterUuid)}
            onMouseLeave={() => setHoveredSeries(null)}
            className={`legend-button ${!visibleSeries.has(s.characterUuid) ? 'inactive' : ''} ${
              hoveredSeries && hoveredSeries !== s.characterUuid && visibleSeries.has(s.characterUuid) ? 'opacity-50' : ''
            }`}
          >
            <div
              className="legend-dot"
              style={{ background: s.color || CHART_COLORS[idx % CHART_COLORS.length] }}
            />
            <span>{s.characterName}</span>
          </button>
        ))}
      </div>

      <SessionList series={series} visibleSeries={visibleSeries} />
    </div>
  );
}

export { CHART_COLORS };
export type { DataSeries };
