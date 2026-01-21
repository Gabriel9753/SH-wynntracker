import { useState } from 'react';

interface TimeRangePickerProps {
  value: string;
  onChange: (range: string, fromDate?: Date, toDate?: Date) => void;
}

const PRESETS = [
  { key: 'today', label: 'Today (00:00)' },
  { key: '24h', label: 'Last 24h' },
  { key: '3d', label: '3 Days' },
  { key: '7d', label: '7 Days' },
  { key: '30d', label: '30 Days' },
  { key: 'custom', label: 'Custom' },
];

function getDateRange(key: string): { from: Date; to: Date } {
  const now = new Date();
  const to = now;
  let from = new Date();

  switch (key) {
    case 'today':
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case '24h':
      from = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case '3d':
      from = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      break;
    case '7d':
      from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }

  return { from, to };
}

export { getDateRange };

export default function TimeRangePicker({ value, onChange }: TimeRangePickerProps) {
  const [showCustom, setShowCustom] = useState(false);
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const handlePresetClick = (key: string) => {
    if (key === 'custom') {
      setShowCustom(true);
      return;
    }
    setShowCustom(false);
    const range = getDateRange(key);
    onChange(key, range.from, range.to);
  };

  const handleCustomApply = () => {
    if (customFrom && customTo) {
      onChange('custom', new Date(customFrom), new Date(customTo));
    }
  };

  return (
    <div className="time-range-picker">
      <div className="time-range-presets">
        {PRESETS.map(preset => (
          <button
            key={preset.key}
            onClick={() => handlePresetClick(preset.key)}
            className={`time-range-btn ${value === preset.key ? 'active' : ''}`}
          >
            {preset.label}
          </button>
        ))}
      </div>
      {showCustom && (
        <div className="time-range-custom">
          <input
            type="date"
            value={customFrom}
            onChange={e => setCustomFrom(e.target.value)}
            className="input-field"
          />
          <span className="text-[var(--text-muted)]">to</span>
          <input
            type="date"
            value={customTo}
            onChange={e => setCustomTo(e.target.value)}
            className="input-field"
          />
          <button onClick={handleCustomApply} className="btn-primary">
            Apply
          </button>
        </div>
      )}
    </div>
  );
}
