export interface Player {
  uuid: string;
  username: string;
  rank: string | null;
  first_join: string | null;
  playtime_total_days: number | null;
  created_at: string;
  updated_at: string;
}

export interface Character {
  uuid: string;
  player_uuid: string;
  type: string | null;
  nickname: string | null;
  gamemodes: string | null;
  last_fetched_at: string | null;
  created_at: string;
}

export interface CharacterStats {
  id: number;
  character_uuid: string;
  valid_from: string;
  valid_until: string | null;
  level: number | null;
  total_level: number | null;
  xp: number | null;
  xp_percent: number | null;
  playtime_hours: number | null;
  mobs_killed: number | null;
  chests_found: number | null;
  blocks_walked: number | null;
  items_identified: number | null;
  logins: number | null;
  deaths: number | null;
  discoveries: number | null;
  content_completion: number | null;
  wars: number | null;
  pvp_kills: number | null;
  pvp_deaths: number | null;
  dungeons_total: number | null;
  raids_total: number | null;
  world_events: number | null;
  caves: number | null;
  lootruns: number | null;
  quests_count: number | null;
  skill_points: Record<string, number> | null;
  professions: Record<string, { level: number; xpPercent: number | null }> | null;
  dungeons: Record<string, number> | null;
  raids: Record<string, number> | null;
  quests_list: string | null;
}

export interface CharacterWithStats extends Character {
  player: Player | null;
  current_stats: CharacterStats | null;
  is_recently_active?: boolean;
}
