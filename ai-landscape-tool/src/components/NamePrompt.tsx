'use client';

import { useState } from 'react';
import { useUser } from '@/lib/userContext';
import styles from '@/app/Dashboard.module.css';

export function NamePrompt() {
  const { user, setUserName, isNameSet } = useUser();
  const [name, setName] = useState('');

  if (isNameSet || !user) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      setUserName(name.trim());
    }
  };

  return (
    <div className={styles.namePromptOverlay}>
      <div className={styles.namePromptModal}>
        <h2>Welcome to AI Landscape</h2>
        <p>Enter your name to start collaborating</p>
        <div 
          className={styles.colourPreview}
          style={{ backgroundColor: user.colour }}
        />
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            autoFocus
          />
          <button type="submit" disabled={!name.trim()}>
            Join Workshop
          </button>
        </form>
      </div>
    </div>
  );
}
