import { useMemo } from 'react';
import type { DataSeries } from './MultiCharacterChart';
import type { CharacterStats } from '../types';
import { CHART_COLORS } from './MultiCharacterChart';

import StatIcon from './StatIcon';

interface SessionListProps {
  series: DataSeries[];
  visibleSeries: Set<string>;
}

interface Session {
  id: string;
  characterName: string;
  characterUuid: string;
  color: string;
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
  startLevel: number;
  endLevel: number;
  // Stats
  mobsKilled: number;
  chestsFound: number;
  blocksWalked: number;
  dungeons: number;
  quests: number;
  caves: number;
  deaths: number;
}

function calculateSessions(series: DataSeries[], visibleSeries: Set<string>): Session[] {
  const sessions: Session[] = [];
  const SESSION_GAP_THRESHOLD = 60 * 60 * 1000; // 1 hour

  series.forEach((s, idx) => {
    if (!visibleSeries.has(s.characterUuid)) return;

    // Filter relevant data (non-null stats)
    const data = [...s.data].sort((a, b) => {
        const da = new Date(a.valid_from).getTime();
        const db = new Date(b.valid_from).getTime();
        return da - db;
    });

    if (data.length === 0) return;

    let currentSessionStart: CharacterStats = data[0];
    let currentSessionEnd: CharacterStats = data[0];
    let lastTime = new Date(data[0].valid_from).getTime();

    for (let i = 1; i < data.length; i++) {
        const stat = data[i];
        const time = new Date(stat.valid_from).getTime();
        
        if (time - lastTime > SESSION_GAP_THRESHOLD) {
            // End of session
            sessions.push(createSession(s, currentSessionStart, currentSessionEnd, idx));
            
            // Start new session
            currentSessionStart = stat;
        }
        
        currentSessionEnd = stat;
        lastTime = time;
    }

    // Push last session
    sessions.push(createSession(s, currentSessionStart, currentSessionEnd, idx));
  });

  // Filter out short sessions (< 5 minutes for better visibility during dev, keeping 10m based on request)
  // Reverting to 10m as requested previously.
  return sessions
    .filter(s => s.durationMinutes >= 10)
    .sort((a, b) => b.endTime.getTime() - a.endTime.getTime());
}

function createSession(series: DataSeries, start: CharacterStats, end: CharacterStats, colorIdx: number): Session {
    const startTime = new Date(start.valid_from);
    const endTime = new Date(end.valid_from);
    const durationMs = endTime.getTime() - startTime.getTime();
    
    // Calculate deltas
    const mobs = (end.mobs_killed || 0) - (start.mobs_killed || 0);
    const chests = (end.chests_found || 0) - (start.chests_found || 0);
    const blocks = (end.blocks_walked || 0) - (start.blocks_walked || 0);
    const dungeons = (end.dungeons_total || 0) - (start.dungeons_total || 0);
    const quests = (end.quests_count || 0) - (start.quests_count || 0);
    const caves = (end.caves || 0) - (start.caves || 0);
    const deaths = (end.deaths || 0) - (start.deaths || 0);

    const startLvl = start.level || 0;
    const endLvl = end.level || 0;

    return {
        id: `${series.characterUuid}-${startTime.getTime()}`,
        characterName: series.characterName,
        characterUuid: series.characterUuid,
        color: series.color || CHART_COLORS[colorIdx % CHART_COLORS.length],
        startTime,
        endTime,
        durationMinutes: Math.floor(durationMs / 1000 / 60),
        startLevel: startLvl,
        endLevel: endLvl,
        mobsKilled: Math.max(0, mobs),
        chestsFound: Math.max(0, chests),
        blocksWalked: Math.max(0, blocks),
        dungeons: Math.max(0, dungeons),
        quests: Math.max(0, quests),
        caves: Math.max(0, caves),
        deaths: Math.max(0, deaths),
    };
}

function formatDuration(minutes: number): string {
    if (minutes < 1) return '< 1m';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
}

function formatValueCompact(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toLocaleString();
}

export default function SessionList({ series, visibleSeries }: SessionListProps) {
  const sessions = useMemo(() => calculateSessions(series, visibleSeries), [series, visibleSeries]);
  
  if (sessions.length === 0) return null;

  return (
    <div className="card p-6 mt-6">
        <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-4">Detected Sessions</h3>
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead>
                    <tr className="text-[var(--text-muted)] border-b border-[var(--border-color)]">
                        <th className="pb-2 font-medium">Character</th>
                        <th className="pb-2 font-medium">Time</th>
                        <th className="pb-2 font-medium">Duration</th>
                        <th className="pb-2 font-medium">Level</th>
                        <th className="pb-2 font-medium text-right" title="Mobs Killed"><div className="flex justify-end"><StatIcon stat="mobs_killed" size={16} /></div></th>
                        <th className="pb-2 font-medium text-right" title="Chests Found"><div className="flex justify-end"><StatIcon stat="chests_found" size={16} /></div></th>
                        <th className="pb-2 font-medium text-right" title="Blocks Walked"><div className="flex justify-end"><StatIcon stat="blocks_walked" size={16} /></div></th>
                        <th className="pb-2 font-medium text-right" title="Dungeons"><div className="flex justify-end"><StatIcon stat="dungeons_total" size={16} /></div></th>
                        <th className="pb-2 font-medium text-right" title="Quests"><div className="flex justify-end"><StatIcon stat="quests_count" size={16} /></div></th>
                        <th className="pb-2 font-medium text-right" title="Caves"><div className="flex justify-end"><StatIcon stat="caves" size={16} /></div></th>
                        <th className="pb-2 font-medium text-right" title="Deaths"><div className="flex justify-end"><StatIcon stat="deaths" size={16} /></div></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                    {sessions.map(session => (
                        <tr key={session.id} className="group hover:bg-[var(--bg-hover)] transition-colors">
                            <td className="py-3 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ background: session.color }} />
                                <span className="font-medium whitespace-nowrap">{session.characterName}</span>
                            </td>
                            <td className="py-3 text-[var(--text-muted)] whitespace-nowrap">
                                {session.startTime.toLocaleDateString()} {session.startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} 
                            </td>
                            <td className="py-3 whitespace-nowrap">{formatDuration(session.durationMinutes)}</td>
                            <td className="py-3 whitespace-nowrap">
                                {session.startLevel === session.endLevel ? (
                                    <span>{session.endLevel}</span>
                                ) : (
                                    <span className="text-[var(--text-primary)]">
                                        {session.startLevel} <span className="text-[var(--text-muted)]">→</span> {session.endLevel}
                                    </span>
                                )}
                            </td>
                            <td className="py-3 text-right font-mono">{session.mobsKilled > 0 ? `+${formatValueCompact(session.mobsKilled)}` : '-'}</td>
                            <td className="py-3 text-right font-mono">{session.chestsFound > 0 ? `+${session.chestsFound}` : '-'}</td>
                            <td className="py-3 text-right font-mono">{session.blocksWalked > 0 ? `+${formatValueCompact(session.blocksWalked)}` : '-'}</td>
                            <td className="py-3 text-right font-mono">{session.dungeons > 0 ? `+${session.dungeons}` : '-'}</td>
                            <td className="py-3 text-right font-mono">{session.quests > 0 ? `+${session.quests}` : '-'}</td>
                            <td className="py-3 text-right font-mono">{session.caves > 0 ? `+${session.caves}` : '-'}</td>
                            <td className="py-3 text-right font-mono text-red-500">{session.deaths > 0 ? `+${session.deaths}` : '-'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
  );
}
