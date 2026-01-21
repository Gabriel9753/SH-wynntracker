import { useState, useEffect } from 'react';
import type { CharacterWithStats } from '../types';
import { fetchCharacter } from '../services/api';
import Layout from '../components/Layout';
import StatsDashboard from '../components/StatsDashboard';

interface CharacterPageProps {
  characterUuid: string;
  onBack: () => void;
}

export default function CharacterPage({ characterUuid, onBack }: CharacterPageProps) {
  const [character, setCharacter] = useState<CharacterWithStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load(isInitial = false) {
      try {
        if (isInitial) setLoading(true);
        const data = await fetchCharacter(characterUuid);
        setCharacter(data);
        setError(null);
      } catch (e) {
        setError('Failed to load character');
      } finally {
        if (isInitial) setLoading(false);
      }
    }
    
    load(true);
    
    let timeoutRef: number | null = null;
    let currentCharacter = character;
    
    const scheduleNext = () => {
      if (document.hidden) return;
      
      const interval = currentCharacter?.is_recently_active ? 2 * 60 * 1000 : 5 * 60 * 1000;
      timeoutRef = window.setTimeout(async () => {
        await load(false);
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
  }, [characterUuid]);

  return (
    <Layout>
      <button
        onClick={onBack}
        className="group flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mb-8"
      >
        <svg 
          className="w-5 h-5 transition-transform group-hover:-translate-x-1" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Characters
      </button>

      {error && (
        <div className="error-box mb-8">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="loading-spinner" />
        </div>
      ) : character ? (
        <StatsDashboard character={character} />
      ) : (
        <div className="empty-state py-16">
          <div className="text-4xl mb-4">❓</div>
          <p className="text-lg">Character not found</p>
        </div>
      )}
    </Layout>
  );
}
