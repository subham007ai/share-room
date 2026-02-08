import { useState } from 'react';
import { PlaceholdersAndVanishInput } from '@/components/ui/placeholders-and-vanish-input';

interface UsernameFormProps {
  onSubmit: (username: string) => void;
  initialValue?: string;
}

export const UsernameForm = ({ onSubmit, initialValue = '' }: UsernameFormProps) => {
  const [username, setUsername] = useState(initialValue);
  const [error, setError] = useState('');

  const placeholders = [
    "enter your username",
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
    setError('');
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = username.trim();
    
    if (trimmed.length < 2) {
      setError('Username must be at least 2 characters');
      return;
    }
    if (trimmed.length > 20) {
      setError('Username must be less than 20 characters');
      return;
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
      setError('Only letters, numbers, underscores and dashes allowed');
      return;
    }
    
    onSubmit(trimmed);
  };

  return (
    <div className="w-full max-w-xl space-y-4">
      <PlaceholdersAndVanishInput
        placeholders={placeholders}
        onChange={handleChange}
        onSubmit={handleSubmit}
      />
      {error && (
        <p className="text-sm text-destructive text-center">{error}</p>
      )}
    </div>
  );
};
