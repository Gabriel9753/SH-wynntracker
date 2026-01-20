import { useState, useEffect } from 'react';
import type { CharacterWithStats, CharacterStats } from '../types';
import { fetchStatsHistory } from '../services/api';
import StatsChart from './StatsChart';

interface StatsDashboardProps {
  character: CharacterWithStats;
}

function StatRow({ label, value, unit }: { label: string; value: string | number | null; unit?: string }) {
  return (
    <div className="flex justify-between py-2.5 border-b border-[var(--border-color)] last:border-0">
      <span className="text-[var(--text-muted)]">{label}</span>
      <span className="text-[var(--text-primary)] font-medium">
        {value != null ? `${typeof value === 'number' ? value.toLocaleString() : value}${unit || ''}` : '-'}
      </span>
    </div>
  );
}

function calculateLevelEfficiency(stats: CharacterStats): string | null {
  if (!stats.playtime_hours || !stats.level) return null;
  const hoursPerLevel = stats.playtime_hours / stats.level;
  return hoursPerLevel.toFixed(1);
}

function calculateTimeAtLevel(history: CharacterStats[], currentLevel: number | null): string | null {
  if (!currentLevel || history.length < 2) return null;
  
  const levelEntries = history.filter(s => s.level === currentLevel);
  if (levelEntries.length === 0) return null;
  
  const firstAtLevel = new Date(levelEntries[0].valid_from);
  const now = new Date();
  const hoursAtLevel = (now.getTime() - firstAtLevel.getTime()) / (1000 * 60 * 60);
  
  if (hoursAtLevel < 1) return `${Math.round(hoursAtLevel * 60)}m`;
  if (hoursAtLevel < 24) return `${hoursAtLevel.toFixed(1)}h`;
  return `${(hoursAtLevel / 24).toFixed(1)}d`;
}

function formatLastUpdate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString('de-DE');
}

export default function StatsDashboard({ character }: StatsDashboardProps) {
  const stats = character.current_stats;
  const player = character.player;
  const [history, setHistory] = useState<CharacterStats[]>([]);
  const [selectedChart, setSelectedChart] = useState<keyof CharacterStats>('level');

  useEffect(() => {
    fetchStatsHistory(character.uuid).then(setHistory).catch(() => {});
  }, [character.uuid]);

  if (!stats) {
    return (
      <div className="empty-state">
        <p className="text-lg">No stats available</p>
        <p className="text-sm">Data will appear once the character is tracked</p>
      </div>
    );
  }

  const levelEfficiency = calculateLevelEfficiency(stats);
  const timeAtLevel = calculateTimeAtLevel(history, stats.level);

  const chartOptions: { key: keyof CharacterStats; label: string }[] = [
    { key: 'level', label: 'Level' },
    { key: 'xp_percent', label: 'XP %' },
    { key: 'playtime_hours', label: 'Playtime' },
    { key: 'mobs_killed', label: 'Mobs' },
    { key: 'deaths', label: 'Deaths' },
    { key: 'dungeons_total', label: 'Dungeons' },
    { key: 'raids_total', label: 'Raids' },
    { key: 'quests_count', label: 'Quests' },
  ];

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className={`online-indicator ${character.is_recently_active ? 'active' : ''}`} />
            <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">
              {player?.username || 'Unknown'}
            </h1>
            <span className="text-[var(--text-secondary)]">({character.type || 'Unknown'})</span>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-[var(--text-muted)]">
            <span>Level {stats.level} ({stats.xp_percent?.toFixed(1) || 0}%)</span>
            <span>{stats.playtime_hours?.toFixed(1) || 0}h played</span>
            <span>Total Level {stats.total_level}</span>
          </div>
        </div>
        {stats.valid_from && (
          <div className="text-sm text-[var(--text-muted)]">
            Last update: {formatLastUpdate(stats.valid_from)}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="card p-6">
          <h2 className="text-sm font-medium text-[var(--text-secondary)] mb-4">Progress</h2>
          <StatRow label="Level" value={stats.level} />
          <StatRow label="XP Progress" value={stats.xp_percent != null ? stats.xp_percent.toFixed(1) : null} unit="%" />
          <StatRow label="Total Level" value={stats.total_level} />
          <StatRow label="Playtime" value={stats.playtime_hours != null ? stats.playtime_hours.toFixed(1) : null} unit="h" />
          <StatRow label="Level Efficiency" value={levelEfficiency} unit=" h/lvl" />
          <StatRow label="Time at Level" value={timeAtLevel} />
        </div>

        <div className="card p-6">
          <h2 className="text-sm font-medium text-[var(--text-secondary)] mb-4">Combat</h2>
          <StatRow label="Mobs Killed" value={stats.mobs_killed} />
          <StatRow label="Deaths" value={stats.deaths} />
          <StatRow label="PvP Kills" value={stats.pvp_kills} />
          <StatRow label="PvP Deaths" value={stats.pvp_deaths} />
          <StatRow label="Wars" value={stats.wars} />
        </div>

        <div className="card p-6">
          <h2 className="text-sm font-medium text-[var(--text-secondary)] mb-4">Activity</h2>
          <StatRow label="Chests Found" value={stats.chests_found} />
          <StatRow label="Discoveries" value={stats.discoveries} />
          <StatRow label="Items Identified" value={stats.items_identified} />
          <StatRow label="Blocks Walked" value={stats.blocks_walked} />
          <StatRow label="Logins" value={stats.logins} />
        </div>

        <div className="card p-6">
          <h2 className="text-sm font-medium text-[var(--text-secondary)] mb-4">Content</h2>
          <StatRow label="Dungeons" value={stats.dungeons_total} />
          <StatRow label="Raids" value={stats.raids_total} />
          <StatRow label="Quests" value={stats.quests_count} />
          <StatRow label="World Events" value={stats.world_events} />
          <StatRow label="Caves" value={stats.caves} />
          <StatRow label="Lootruns" value={stats.lootruns} />
        </div>
      </div>

      {stats.professions && Object.keys(stats.professions).length > 0 && (
        <div className="card p-6">
          <h2 className="text-sm font-medium text-[var(--text-secondary)] mb-4">Professions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {Object.entries(stats.professions).map(([name, data]) => (
              <div key={name} className="stat-card text-center">
                <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide mb-1">{name}</div>
                <div className="text-xl font-bold text-[var(--text-primary)]">{data.level}</div>
                {data.xpPercent != null && (
                  <div className="text-xs text-[var(--text-muted)]">{data.xpPercent.toFixed(0)}%</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {stats.skill_points && Object.keys(stats.skill_points).length > 0 && (
        <div className="card p-6">
          <h2 className="text-sm font-medium text-[var(--text-secondary)] mb-4">Skill Points</h2>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {Object.entries(stats.skill_points).map(([name, value]) => (
              <div key={name} className="stat-card text-center">
                <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide mb-1">{name}</div>
                <div className="text-xl font-bold text-[var(--text-primary)]">{value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {history.length > 1 && (
        <div className="card p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <h2 className="text-sm font-medium text-[var(--text-secondary)]">History</h2>
            <div className="flex gap-1 overflow-x-auto pb-2 -mb-2">
              {chartOptions.map(opt => (
                <button
                  key={opt.key}
                  onClick={() => setSelectedChart(opt.key)}
                  className={`chart-button ${selectedChart === opt.key ? 'active' : ''}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <StatsChart 
            data={history} 
            dataKey={selectedChart}
            label={chartOptions.find(o => o.key === selectedChart)?.label || ''}
          />
        </div>
      )}
    </div>
  );
}
