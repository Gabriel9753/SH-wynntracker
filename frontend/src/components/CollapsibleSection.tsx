import { useState, type ReactNode } from 'react';

interface CollapsibleSectionProps {
  title: string;
  count?: number;
  defaultOpen?: boolean;
  children: ReactNode;
}

export default function CollapsibleSection({ 
  title, 
  count, 
  defaultOpen = false,
  children 
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="collapsible-section">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="collapsible-header"
      >
        <div className="flex items-center gap-2">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="currentColor"
            className={`collapsible-arrow ${isOpen ? 'open' : ''}`}
          >
            <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
          </svg>
          <span className="collapsible-title">{title}</span>
          {count !== undefined && (
            <span className="collapsible-count">({count})</span>
          )}
        </div>
      </button>
      {isOpen && (
        <div className="collapsible-content">
          {children}
        </div>
      )}
    </div>
  );
}
