import { useState, useMemo, useRef } from 'react';
import type { CharacterStats } from '../types';

interface StatsChartProps {
  data: CharacterStats[];
  dataKey: keyof CharacterStats;
  label: string;
}

interface DataPoint {
  date: Date;
  value: number;
  label: string;
}

export default function StatsChart({ data, dataKey, label }: StatsChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const chartData = useMemo(() => {
    return data
      .map(stat => ({
        date: new Date(stat.valid_from),
        value: stat[dataKey] as number | null,
        label: new Date(stat.valid_from).toLocaleDateString('de-DE', {
          day: '2-digit',
          month: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        }),
      }))
      .filter((d): d is DataPoint => d.value != null)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [data, dataKey]);

  if (chartData.length < 2) {
    return (
      <div className="chart-container flex items-center justify-center h-48">
        <p className="text-[var(--text-muted)] text-sm">Not enough data points</p>
      </div>
    );
  }

  // Chart dimensions
  const width = 600;
  const height = 200;
  const padding = { top: 20, right: 20, bottom: 40, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Calculate scales
  const values = chartData.map(d => d.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const valueRange = maxVal - minVal || 1;
  const yPadding = valueRange * 0.1;

  const xScale = (index: number) => 
    padding.left + (index / (chartData.length - 1)) * chartWidth;
  
  const yScale = (value: number) => 
    padding.top + chartHeight - ((value - minVal + yPadding) / (valueRange + yPadding * 2)) * chartHeight;

  // Generate path
  const pathD = chartData
    .map((point, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(point.value)}`)
    .join(' ');

  // Generate area path
  const areaD = `${pathD} L ${xScale(chartData.length - 1)} ${padding.top + chartHeight} L ${xScale(0)} ${padding.top + chartHeight} Z`;

  // Y-axis ticks
  const yTicks = 5;
  const yTickValues = Array.from({ length: yTicks }, (_, i) => 
    minVal + (valueRange / (yTicks - 1)) * i
  );

  // Format value for display
  const formatValue = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toFixed(Number.isInteger(value) ? 0 : 1);
  };

  return (
    <div className="chart-container">
      <div className="text-sm font-medium text-[var(--text-secondary)] mb-4">{label} Over Time</div>
      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto"
          style={{ minHeight: '180px' }}
        >
          {yTickValues.map((tick, i) => (
            <line
              key={i}
              x1={padding.left}
              x2={width - padding.right}
              y1={yScale(tick)}
              y2={yScale(tick)}
              stroke="var(--border-color)"
              strokeDasharray="4,4"
            />
          ))}

          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="var(--accent-primary)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={areaD} fill="url(#areaGradient)" />

          <path
            d={pathD}
            fill="none"
            stroke="var(--accent-primary)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {chartData.map((point, i) => (
            <circle
              key={i}
              cx={xScale(i)}
              cy={yScale(point.value)}
              r={hoveredIndex === i ? 6 : 4}
              fill="var(--accent-primary)"
              stroke="var(--bg-card)"
              strokeWidth="2"
              className="cursor-pointer transition-all duration-150"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            />
          ))}

          {yTickValues.map((tick, i) => (
            <text
              key={i}
              x={padding.left - 10}
              y={yScale(tick)}
              textAnchor="end"
              dominantBaseline="middle"
              className="text-xs fill-[var(--text-muted)]"
            >
              {formatValue(tick)}
            </text>
          ))}

          <text
            x={padding.left}
            y={height - 10}
            textAnchor="start"
            className="text-xs fill-[var(--text-muted)]"
          >
            {chartData[0].date.toLocaleDateString('de-DE')}
          </text>
          <text
            x={width - padding.right}
            y={height - 10}
            textAnchor="end"
            className="text-xs fill-[var(--text-muted)]"
          >
            {chartData[chartData.length - 1].date.toLocaleDateString('de-DE')}
          </text>
        </svg>

        {hoveredIndex !== null && (
          <div
            className="tooltip absolute pointer-events-none transform -translate-x-1/2 -translate-y-full"
            style={{
              left: `${(xScale(hoveredIndex) / width) * 100}%`,
              top: `${(yScale(chartData[hoveredIndex].value) / height) * 100}%`,
              marginTop: '-12px'
            }}
          >
            <div className="font-medium">{formatValue(chartData[hoveredIndex].value)}</div>
            <div className="text-[var(--text-muted)]">{chartData[hoveredIndex].label}</div>
          </div>
        )}
      </div>
    </div>
  );
}
