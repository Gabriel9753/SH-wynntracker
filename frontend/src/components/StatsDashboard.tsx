import { useState, useEffect, useMemo } from 'react';
import type { CharacterWithStats, CharacterStats } from '../types';
import { fetchStatsHistory } from '../services/api';
import StatsChart from './StatsChart';
import TimeRangePicker, { getDateRange } from './TimeRangePicker';
import ProfessionIcon from './ProfessionIcon';
import SkillIcon from './SkillIcon';
import CollapsibleSection from './CollapsibleSection';

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

function getWynncraftUrl(playerUuid: string, characterUuid: string): string {
  return `https://wynncraft.com/stats/player/${playerUuid}?class=${characterUuid}`;
}

function getQuestWikiUrl(questName: string): string {
  const wikiName = questName.replace(/ /g, '_');
  return `https://wynncraft.wiki.gg/wiki/${wikiName}`;
}



function parseContentList(data: string | Record<string, number> | null): { name: string; count: number }[] {
  if (!data) return [];

  if (typeof data === 'object') {
    return Object.entries(data)
      .map(([name, count]) => ({ name, count: count as number }))
      .sort((a, b) => b.count - a.count);
  }

  if (typeof data === 'string') {
    if (data.startsWith('{')) {
      try {
        const parsed = JSON.parse(data);
        return Object.entries(parsed)
          .map(([name, count]) => ({ name, count: count as number }))
          .sort((a, b) => b.count - a.count);
      } catch {
        return [];
      }
    }
    return data.split(';').filter(s => s.trim()).map(name => ({ name: name.trim(), count: 1 }));
  }

  return [];
}

function parseQuestsList(questsJson: string | null): string[] {
  if (!questsJson) return [];

  if (questsJson.startsWith('[')) {
    try {
      return JSON.parse(questsJson);
    } catch {
      return [];
    }
  }

  return questsJson.split(';').map(q => q.trim()).filter(q => q.length > 0);
}

export default function StatsDashboard({ character }: StatsDashboardProps) {
  const stats = character.current_stats;
  const player = character.player;
  const [history, setHistory] = useState<CharacterStats[]>([]);
  const [selectedChart, setSelectedChart] = useState<keyof CharacterStats>('level');
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    const dates = getDateRange(timeRange);
    fetchStatsHistory(character.uuid, dates.from.toISOString(), dates.to.toISOString())
      .then(setHistory)
      .catch(() => {});
  }, [character.uuid, timeRange]);

  const handleTimeRangeChange = (range: string, fromDate?: Date, toDate?: Date) => {
    setTimeRange(range);
    if (fromDate && toDate) {
      fetchStatsHistory(character.uuid, fromDate.toISOString(), toDate.toISOString())
        .then(setHistory)
        .catch(() => {});
    }
  };

  const sortedProfessions = useMemo(() => {
    if (!stats?.professions) return [];
    return Object.entries(stats.professions)
      .sort((a, b) => b[1].level - a[1].level);
  }, [stats?.professions]);

  const dungeonsList = useMemo(() => parseContentList(stats?.dungeons ?? null), [stats?.dungeons]);
  const raidsList = useMemo(() => parseContentList(stats?.raids ?? null), [stats?.raids]);
  const questsList = useMemo(() => parseQuestsList(stats?.quests_list || null), [stats?.quests_list]);

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

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="card p-6">
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
          <div className="flex flex-col items-end gap-2">
            {stats.valid_from && (
              <div className="text-xs text-[var(--text-muted)]">
                Last update: {formatLastUpdate(stats.valid_from)}
              </div>
            )}
            {player?.uuid && (
              <a
                href={getWynncraftUrl(player.uuid, character.uuid)}
                target="_blank"
                rel="noopener noreferrer"
                className="wynncraft-link"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7zm-2 16H5V5h7V3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7h-7z"/>
                </svg>
                View on Wynncraft
              </a>
            )}
          </div>
        </div>
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

      {sortedProfessions.length > 0 && (
        <div className="card p-6">
          <h2 className="text-sm font-medium text-[var(--text-secondary)] mb-4">Professions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {sortedProfessions.map(([name, data]) => (
              <div key={name} className="profession-card">
                <ProfessionIcon profession={name} size={24} className="profession-card-icon" />
                <div className="profession-card-name">{name}</div>
                <div className="profession-card-level">{data.level}</div>
                {data.xpPercent != null && (
                  <div className="profession-card-xp">{data.xpPercent.toFixed(0)}%</div>
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
              <div key={name} className="skill-card">
                <SkillIcon skill={name} size={20} className="skill-card-icon" />
                <div className="skill-card-name">{name}</div>
                <div className="skill-card-value">{value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card p-6">
        <div className="space-y-3">
          {questsList.length > 0 && (
            <CollapsibleSection title="Quests" count={questsList.length}>
              <div className="content-list-grid">
                {questsList.map((quest, index) => (
                  <a
                    key={index}
                    href={getQuestWikiUrl(quest)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="content-list-item quest-link"
                  >
                    <svg className="content-check" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                    </svg>
                    <span>{quest}</span>
                    <svg className="quest-link-icon" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z" />
                    </svg>
                  </a>
                ))}
              </div>
            </CollapsibleSection>
          )}

          {dungeonsList.length > 0 && (
            <CollapsibleSection title="Dungeons" count={stats.dungeons_total || 0}>
              <div className="content-list-grid">
                {dungeonsList.map((item, index) => (
                  <div key={index} className="content-list-item">
                    <span className="content-count">{item.count}x</span>
                    <span>{item.name}</span>
                  </div>
                ))}
              </div>
            </CollapsibleSection>
          )}

          {raidsList.length > 0 && (
            <CollapsibleSection title="Raids" count={stats.raids_total || 0}>
              <div className="content-list-grid">
                {raidsList.map((item, index) => (
                  <div key={index} className="content-list-item">
                    <span className="content-count">{item.count}x</span>
                    <span>{item.name}</span>
                  </div>
                ))}
              </div>
            </CollapsibleSection>
          )}
        </div>
      </div>

      <div className="card p-6">
        <div className="flex flex-col gap-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-sm font-medium text-[var(--text-secondary)]">History</h2>
            <TimeRangePicker value={timeRange} onChange={handleTimeRangeChange} />
          </div>
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
        {history.length > 1 ? (
          <StatsChart
            data={history}
            dataKey={selectedChart}
            label={chartOptions.find(o => o.key === selectedChart)?.label || ''}
            timeRange={timeRange}
          />
        ) : (
          <div className="chart-container flex items-center justify-center h-48">
            <p className="text-[var(--text-muted)] text-sm">No data available for this time range</p>
          </div>
        )}
      </div>
    </div>
  );
}
