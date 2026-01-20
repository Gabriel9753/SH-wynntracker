import { useState, useEffect, useCallback, useMemo } from 'react';
import type { CharacterWithStats } from '../types';
import { fetchCharacters, addCharacter } from '../services/api';
import Layout from '../components/Layout';
import CharacterCard from '../components/CharacterCard';
import CharacterSearch from '../components/CharacterSearch';
import ComparisonChart from '../components/ComparisonChart';

interface HomePageProps {
  onSelectCharacter: (uuid: string) => void;
}

export default function HomePage({ onSelectCharacter }: HomePageProps) {
  const [characters, setCharacters] = useState<CharacterWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const { maxLevel, maxPlaytime } = useMemo(() => {
    if (characters.length === 0) return { maxLevel: 0, maxPlaytime: 0 };
    
    const levels = characters
      .map(c => c.current_stats?.level || 0)
      .filter(l => l > 0);
    const playtimes = characters
      .map(c => c.current_stats?.playtime_hours || 0)
      .filter(p => p > 0);
    
    return {
      maxLevel: levels.length > 0 ? Math.max(...levels) : 0,
      maxPlaytime: playtimes.length > 0 ? Math.max(...playtimes) : 0,
    };
  }, [characters]);

  return (
    <Layout>
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-3">
          Your Characters
        </h1>
        <p className="text-[var(--text-secondary)] max-w-md mx-auto">
          Track your Wynncraft character stats and progression over time
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
          <div className="text-4xl mb-4">🎮</div>
          <p className="text-lg mb-2">No characters found</p>
          <p className="text-sm">Add a character using the button above</p>
        </div>
      ) : (
        <>
          <ComparisonChart characters={characters} />
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {characters.map(character => {
              const level = character.current_stats?.level || 0;
              const playtime = character.current_stats?.playtime_hours || 0;
              
              return (
                <CharacterCard
                  key={character.uuid}
                  character={character}
                  playerName={character.player?.username}
                  level={character.current_stats?.level}
                  playtime={character.current_stats?.playtime_hours}
                  xpPercent={character.current_stats?.xp_percent}
                  isRecentlyActive={character.is_recently_active}
                  isMaxLevel={level > 0 && level === maxLevel && characters.length > 1}
                  isMaxPlaytime={playtime > 0 && playtime === maxPlaytime && characters.length > 1}
                  onClick={onSelectCharacter}
                />
              );
            })}
          </div>
        </>
      )}
    </Layout>
  );
}
