import { useState } from 'react';
import './index.css';
import HomePage from './pages/HomePage';
import CharacterPage from './pages/CharacterPage';

export default function App() {
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);

  if (selectedCharacter) {
    return (
      <CharacterPage
        characterUuid={selectedCharacter}
        onBack={() => setSelectedCharacter(null)}
      />
    );
  }

  return (
    <HomePage onSelectCharacter={setSelectedCharacter} />
  );
}
