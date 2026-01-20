import { useState } from 'react';

interface CharacterSearchProps {
  onSearch: (query: string) => void;
  onAddCharacter: (url: string) => void;
}

export default function CharacterSearch({ onSearch, onAddCharacter }: CharacterSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [addUrl, setAddUrl] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    onSearch(e.target.value);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (addUrl.trim()) {
      onAddCharacter(addUrl.trim());
      setAddUrl('');
      setShowAddForm(false);
    }
  };

  return (
    <div className="mb-8">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg 
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search characters..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="input-field pl-10"
          />
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className={showAddForm ? 'btn-secondary' : 'btn-primary'}
        >
          {showAddForm ? 'Cancel' : '+ Add Character'}
        </button>
      </div>
      
      {showAddForm && (
        <form onSubmit={handleAddSubmit} className="mt-4">
          <div className="card p-4">
            <label className="block text-sm text-[var(--text-secondary)] mb-2">
              Wynncraft Character URL
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="url"
                placeholder="https://wynncraft.com/stats/player/..."
                value={addUrl}
                onChange={(e) => setAddUrl(e.target.value)}
                className="input-field flex-1"
                autoFocus
              />
              <button type="submit" className="btn-primary">
                Add
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
