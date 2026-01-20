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

interface CharacterCardProps {
  character: Character;
  playerName?: string;
  level?: number | null;
  playtime?: number | null;
  xpPercent?: number | null;
  isRecentlyActive?: boolean;
  isMaxLevel?: boolean;
  isMaxPlaytime?: boolean;
  onClick: (uuid: string) => void;
}

export default function CharacterCard({ 
  character, 
  playerName,
  level,
  playtime,
  xpPercent,
  isRecentlyActive = false,
  isMaxLevel = false,
  isMaxPlaytime = false,
  onClick 
}: CharacterCardProps) {
  const displayName = playerName || character.nickname || 'Unknown';
  const classType = character.type || 'Unknown';
  const classIcon = getClassIcon(classType);
  
  return (
    <div
      className="card cursor-pointer"
      onClick={() => onClick(character.uuid)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {classIcon ? (
            <img 
              src={classIcon} 
              alt={classType} 
              className="w-12 h-14 object-contain"
            />
          ) : (
            <div className={`online-indicator ${isRecentlyActive ? 'active' : ''}`} />
          )}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-medium text-[var(--text-primary)]">
                {displayName}
              </h3>
              {classIcon && (
                <div className={`online-indicator ${isRecentlyActive ? 'active' : ''}`} style={{ width: '8px', height: '8px' }} />
              )}
            </div>
            <p className="text-sm text-[var(--text-secondary)]">
              {classType}
            </p>
          </div>
        </div>
        {level != null && (
          <div className="text-right">
            <div className={`text-2xl font-bold ${isMaxLevel ? 'text-[var(--accent-primary)]' : 'text-[var(--text-primary)]'}`}>
              {level}
              {isMaxLevel && <span className="text-xs ml-1">👑</span>}
            </div>
            <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide">
              Level
            </div>
          </div>
        )}
      </div>
      
      {xpPercent != null && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-[var(--text-secondary)] mb-2">
            <span>XP Progress</span>
            <span className="font-medium">{xpPercent.toFixed(1)}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${Math.min(xpPercent, 100)}%` }} />
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-between text-sm">
        {playtime != null && (
          <span className={isMaxPlaytime ? 'text-[var(--accent-secondary)] font-medium' : 'text-[var(--text-muted)]'}>
            {playtime.toFixed(1)}h played
            {isMaxPlaytime && <span className="ml-1">⏱️</span>}
          </span>
        )}
        {isRecentlyActive && (
          <span className="text-[var(--online-color)] text-xs font-medium">
            Active
          </span>
        )}
      </div>
    </div>
  );
}
