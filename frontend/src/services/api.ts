import type { CharacterWithStats, CharacterStats } from '../types';

const API_BASE = '/api';

export async function fetchCharacters(search?: string): Promise<CharacterWithStats[]> {
  const params = search ? `?search=${encodeURIComponent(search)}` : '';
  const res = await fetch(`${API_BASE}/characters${params}`);
  if (!res.ok) throw new Error('Failed to fetch characters');
  const characters = await res.json();
  
  const withStats = await Promise.all(
    characters.map(async (char: CharacterWithStats) => {
      try {
        const full = await fetchCharacter(char.uuid);
        return full;
      } catch {
        return char;
      }
    })
  );
  
  return withStats;
}

export async function fetchCharacter(uuid: string): Promise<CharacterWithStats> {
  const res = await fetch(`${API_BASE}/characters/${uuid}`);
  if (!res.ok) throw new Error('Failed to fetch character');
  return res.json();
}

export async function fetchStatsHistory(
  characterUuid: string,
  fromDate?: string,
  toDate?: string
): Promise<CharacterStats[]> {
  const params = new URLSearchParams();
  if (fromDate) params.append('from_date', fromDate);
  if (toDate) params.append('to_date', toDate);
  const query = params.toString() ? `?${params.toString()}` : '';
  const res = await fetch(`${API_BASE}/stats/${characterUuid}/history${query}`);
  if (!res.ok) throw new Error('Failed to fetch stats history');
  return res.json();
}

export async function addCharacter(url: string): Promise<CharacterWithStats> {
  const res = await fetch(`${API_BASE}/characters`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || 'Failed to add character');
  }
  return res.json();
}

export async function deleteCharacter(uuid: string): Promise<void> {
  const res = await fetch(`${API_BASE}/characters/${uuid}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete character');
}
