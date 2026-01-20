import { useMemo } from 'react';
import type { CharacterWithStats } from '../types';

interface ComparisonChartProps {
  characters: CharacterWithStats[];
}

interface CharacterData {
  name: string;
  level: number;
  playtime: number;
  type: string;
}

export default function ComparisonChart({ characters }: ComparisonChartProps) {
  const chartData = useMemo(() => {
    return characters
      .map(char => ({
        name: char.player?.username || char.nickname || 'Unknown',
        level: char.current_stats?.level || 0,
        playtime: char.current_stats?.playtime_hours || 0,
        type: char.type || 'Unknown',
      }))
      .filter(d => d.level > 0 || d.playtime > 0)
      .sort((a, b) => b.level - a.level);
  }, [characters]);

  if (chartData.length < 2) {
    return null;
  }

  const maxLevel = Math.max(...chartData.map(d => d.level));
  const maxPlaytime = Math.max(...chartData.map(d => d.playtime));

  const colors = [
    'var(--accent-primary)',
    'var(--accent-secondary)',
    '#f472b6',
    '#34d399',
    '#fbbf24',
    '#60a5fa',
  ];

  return (
    <div className="card mb-8">
      <h2 className="text-sm font-medium text-[var(--text-secondary)] mb-6">Character Comparison</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h3 className="text-xs text-[var(--text-muted)] uppercase tracking-wide mb-4">Level</h3>
          <div className="space-y-3">
            {chartData.map((char, i) => (
              <div key={`level-${char.name}`} className="flex items-center gap-3">
                <div className="w-24 text-sm text-[var(--text-secondary)] truncate">{char.name}</div>
                <div className="flex-1 h-6 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full flex items-center justify-end pr-2 transition-all duration-500"
                    style={{ 
                      width: `${(char.level / maxLevel) * 100}%`,
                      background: colors[i % colors.length],
                    }}
                  >
                    <span className="text-xs font-medium text-white drop-shadow">{char.level}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-xs text-[var(--text-muted)] uppercase tracking-wide mb-4">Playtime (hours)</h3>
          <div className="space-y-3">
            {chartData.map((char, i) => (
              <div key={`playtime-${char.name}`} className="flex items-center gap-3">
                <div className="w-24 text-sm text-[var(--text-secondary)] truncate">{char.name}</div>
                <div className="flex-1 h-6 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full flex items-center justify-end pr-2 transition-all duration-500"
                    style={{ 
                      width: `${(char.playtime / maxPlaytime) * 100}%`,
                      background: colors[i % colors.length],
                    }}
                  >
                    <span className="text-xs font-medium text-white drop-shadow">{char.playtime.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
