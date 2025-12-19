'use client';

import { useState } from 'react';
import { Category, Timeframe } from '@/types';
import styles from '@/app/Dashboard.module.css';

interface QuickAddNoteProps {
  onAdd: (text: string, category: Category, timeframe: Timeframe) => Promise<void>;
  categories: { id: string; label: string }[];
  timeframes: { id: string; label: string }[];
}

export function QuickAddNote({ onAdd, categories, timeframes }: QuickAddNoteProps) {
  const [text, setText] = useState('');
  const [category, setCategory] = useState(categories[0]?.id || 'opportunities');
  const [timeframe, setTimeframe] = useState(timeframes[0]?.id || '10months');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    
    await onAdd(text.trim(), category as Category, timeframe as Timeframe);
    setText('');
    setIsExpanded(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.metaKey) {
      handleSubmit(e);
    }
  };

  return (
    <div className={styles.quickAdd}>
      {!isExpanded ? (
        <button 
          className={styles.quickAddTrigger}
          onClick={() => setIsExpanded(true)}
        >
          + Quick Add Note
        </button>
      ) : (
        <form onSubmit={handleSubmit} className={styles.quickAddForm}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your idea... (⌘+Enter to save)"
            autoFocus
            className={styles.quickAddInput}
          />
          <div className={styles.quickAddControls}>
            <select 
              value={category} 
              onChange={(e) => setCategory(e.target.value)}
              className={styles.quickAddSelect}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
            <select 
              value={timeframe} 
              onChange={(e) => setTimeframe(e.target.value)}
              className={styles.quickAddSelect}
            >
              {timeframes.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
            <button type="submit" className={styles.quickAddSubmit} disabled={!text.trim()}>
              Add
            </button>
            <button 
              type="button" 
              className={styles.quickAddCancel}
              onClick={() => { setIsExpanded(false); setText(''); }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
