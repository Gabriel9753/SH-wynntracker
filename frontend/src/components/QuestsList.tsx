interface QuestsListProps {
  questsJson: string | null;
}

export default function QuestsList({ questsJson }: QuestsListProps) {
  if (!questsJson) {
    return (
      <div className="text-[var(--text-muted)] text-sm">No quests data available</div>
    );
  }

  let quests: string[] = [];

  if (questsJson.startsWith('[')) {
    try {
      quests = JSON.parse(questsJson);
    } catch {
      quests = [];
    }
  } else {
    quests = questsJson.split(';').map(q => q.trim()).filter(q => q.length > 0);
  }

  if (quests.length === 0) {
    return (
      <div className="text-[var(--text-muted)] text-sm">No quests completed</div>
    );
  }

  return (
    <div className="quests-list">
      <div className="quests-grid">
        {quests.map((quest, index) => (
          <div key={index} className="quest-item">
            <svg
              className="quest-check"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
            </svg>
            <span>{quest}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
