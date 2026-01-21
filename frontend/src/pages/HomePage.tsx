import { useState, useEffect, useCallback, useMemo } from 'react';
import type { CharacterWithStats, CharacterStats } from '../types';
import { fetchCharacters, addCharacter, fetchStatsHistory } from '../services/api';
import Layout from '../components/Layout';
import CharacterCard from '../components/CharacterCard';
import CharacterSearch from '../components/CharacterSearch';
import MultiCharacterChart, { CHART_COLORS } from '../components/MultiCharacterChart';
import type { DataSeries } from '../components/MultiCharacterChart';
import { getDateRange } from '../components/TimeRangePicker';

interface HomePageProps {
  onSelectCharacter: (uuid: string) => void;
}

export default function HomePage({ onSelectCharacter }: HomePageProps) {
  const [characters, setCharacters] = useState<CharacterWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [historyData, setHistoryData] = useState<Record<string, CharacterStats[]>>({});

  const loadCharacters = useCallback(async (search?: string) => {
    try {
      setLoading(true);
      const data = await fetchCharacters(search);
      setCharacters(data);
      setError(null);
    } catch (e) {
      setError('Failed to load characters');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCharacters();
  }, [loadCharacters]);

  useEffect(() => {
    if (!characters.length) return;
    
    const getPollingInterval = () => {
      const hasActiveChar = characters.some(char => char.is_recently_active);
      return hasActiveChar ? 2 * 60 * 1000 : 5 * 60 * 1000;
    };
    
    let timeoutRef: number | null = null;
    
    const scheduleNext = () => {
      if (document.hidden) return;
      
      const interval = getPollingInterval();
      timeoutRef = window.setTimeout(() => {
        loadCharacters();
        scheduleNext();
      }, interval);
    };
    
    const handleVisibilityChange = () => {
      if (document.hidden && timeoutRef) {
        clearTimeout(timeoutRef);
        timeoutRef = null;
      } else if (!document.hidden) {
        scheduleNext();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    scheduleNext();
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (timeoutRef) clearTimeout(timeoutRef);
    };
  }, [loadCharacters]);

  const loadHistory = useCallback(async (fromDate: Date, toDate: Date) => {
    const newHistory: Record<string, CharacterStats[]> = {};
    await Promise.all(
      characters.map(async (char) => {
        try {
          const history = await fetchStatsHistory(char.uuid, fromDate.toISOString(), toDate.toISOString());
          newHistory[char.uuid] = history;
        } catch {
          newHistory[char.uuid] = [];
        }
      })
    );
    setHistoryData(newHistory);
  }, [characters]);

  useEffect(() => {
    if (characters.length > 0) {
      const dates = getDateRange('24h');
      loadHistory(dates.from, dates.to);
    }
  }, [characters, loadHistory]);

  const handleTimeRangeChange = (fromDate: Date, toDate: Date) => {
    loadHistory(fromDate, toDate);
  };

  const handleSearch = useCallback((query: string) => {
    loadCharacters(query);
  }, [loadCharacters]);

  const handleAddCharacter = useCallback(async (url: string) => {
    try {
      await addCharacter(url);
      loadCharacters();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to add character';
      setError(message);
    }
  }, [loadCharacters]);

  const sortedCharacters = useMemo(() => {
    return [...characters].sort((a, b) => {
      const levelA = a.current_stats?.level || 0;
      const levelB = b.current_stats?.level || 0;
      return levelB - levelA;
    });
  }, [characters]);

  const chartSeries: DataSeries[] = useMemo(() => {
    return sortedCharacters.map((char, idx) => {
      let data = historyData[char.uuid] || [];
      
      if (data.length === 0 && char.current_stats) {
        data = [char.current_stats];
      }
      
      return {
        characterUuid: char.uuid,
        characterName: char.player?.username || char.nickname || 'Unknown',
        color: CHART_COLORS[idx % CHART_COLORS.length],
        data,
      };
    });
  }, [sortedCharacters, historyData]);

  return (
    <Layout>
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-3">
          Die fast Abiturienten
        </h1>
        <p className="text-[var(--text-secondary)] max-w-md mx-auto">
          tracking...
        </p>
      </div>

      <CharacterSearch onSearch={handleSearch} onAddCharacter={handleAddCharacter} />

      {error && (
        <div className="error-box mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="loading-spinner" />
        </div>
      ) : characters.length === 0 ? (
        <div className="empty-state py-16">
          <div className="text-4xl mb-4">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor" className="mx-auto opacity-50">
              <path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 10H3V8h18v8zM6 15h2v-2h2v-2H8V9H6v2H4v2h2z"/>
            </svg>
          </div>
          <p className="text-lg mb-2">No characters found</p>
          <p className="text-sm">Add a character using the button above</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {sortedCharacters.map(character => (
              <CharacterCard
                key={character.uuid}
                character={character}
                playerName={character.player?.username}
                level={character.current_stats?.level}
                playtime={character.current_stats?.playtime_hours}
                xpPercent={character.current_stats?.xp_percent}
                isRecentlyActive={character.is_recently_active}
                lastUpdate={character.current_stats?.valid_from}
                onClick={onSelectCharacter}
              />
            ))}
          </div>

          {chartSeries.length >= 1 && (
            <MultiCharacterChart series={chartSeries} onTimeRangeChange={handleTimeRangeChange} />
          )}
        </>
      )}
    </Layout>
  );
}
