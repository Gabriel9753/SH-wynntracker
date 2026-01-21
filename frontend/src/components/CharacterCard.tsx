import type { Character } from '../types';

const classIconMap: Record<string, string> = {
  'archer': '/classes/archer.webp',
  'hunter': '/classes/archer.webp',
  'warrior': '/classes/warrior.webp',
  'knight': '/classes/warrior.webp',
  'assassin': '/classes/assassin.webp',
  'ninja': '/classes/assassin.webp',
  'mage': '/classes/mage.webp',
  'dark wizard': '/classes/mage.webp',
  'shaman': '/classes/shaman.webp',
  'skyseer': '/classes/shaman.webp',
};

function getClassIcon(classType: string): string | null {
  const key = classType.toLowerCase();
  return classIconMap[key] || null;
}

function formatLastUpdate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('de-DE');
}

interface CharacterCardProps {
  character: Character;
  playerName?: string;
  level?: number | null;
  playtime?: number | null;
  xpPercent?: number | null;
  isRecentlyActive?: boolean;
  lastUpdate?: string | null;
  onClick: (uuid: string) => void;
}

export default function CharacterCard({
  character,
  playerName,
  level,
  playtime,
  xpPercent,
  isRecentlyActive = false,
  lastUpdate,
  onClick
}: CharacterCardProps) {
  const displayName = playerName || character.nickname || 'Unknown';
  const classType = character.type || 'Unknown';
  const classIcon = getClassIcon(classType);

  return (
    <div
      className="card cursor-pointer character-card-compact"
      onClick={() => onClick(character.uuid)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {classIcon ? (
            <img
              src={classIcon}
              alt={classType}
              className="w-10 h-12 object-contain"
            />
          ) : (
            <div className={`online-indicator ${isRecentlyActive ? 'active' : ''}`} />
          )}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-medium text-[var(--text-primary)]">
                {displayName}
              </h3>
              {classIcon && (
                <div className={`online-indicator ${isRecentlyActive ? 'active' : ''}`} style={{ width: '6px', height: '6px' }} />
              )}
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              {classType}
            </p>
          </div>
        </div>
        {level != null && (
          <div className="text-right">
            <div className="text-xl font-bold text-[var(--text-primary)]">
              {level}
            </div>
            <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide">
              Level
            </div>
          </div>
        )}
      </div>

      {xpPercent != null && (
        <div className="mb-2">
          <div className="flex justify-between text-xs text-[var(--text-secondary)] mb-1">
            <span>XP</span>
            <span className="font-medium">{xpPercent.toFixed(1)}%</span>
          </div>
          <div className="progress-bar h-1.5">
            <div className="progress-fill" style={{ width: `${Math.min(xpPercent, 100)}%` }} />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between text-xs mt-2">
        {playtime != null && (
          <span className="text-[var(--text-muted)]">
            {playtime.toFixed(1)}h played
          </span>
        )}
        {lastUpdate && (
          <span className="text-[var(--text-muted)]">
            {formatLastUpdate(lastUpdate)}
          </span>
        )}
      </div>
    </div>
  );
}
