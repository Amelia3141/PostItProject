'use client';

import { useState } from 'react';
import { Category, Timeframe } from '@/types';
import styles from '@/app/Dashboard.module.css';

const NOTE_TEMPLATES = [
  { label: 'Blank', text: '' },
  { label: 'Opportunity', text: 'Opportunity: [describe the opportunity and potential impact]' },
  { label: 'Risk', text: 'Risk: [describe the risk and mitigation strategy]' },
  { label: 'Action Item', text: 'Action: [what needs to be done] | Owner: [who] | Due: [when]' },
  { label: 'Question', text: 'Question: [what do we need to find out?]' },
  { label: 'Insight', text: 'Insight: [key learning or observation]' },
];

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
  const [showTemplates, setShowTemplates] = useState(false);

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
          <div className={styles.templateBar}>
            <button
              type="button"
              className={styles.templateToggle}
              onClick={() => setShowTemplates(!showTemplates)}
            >
              📝 Templates {showTemplates ? '▲' : '▼'}
            </button>
            {showTemplates && (
              <div className={styles.templateList}>
                {NOTE_TEMPLATES.map((t, i) => (
                  <button
                    key={i}
                    type="button"
                    className={styles.templateBtn}
                    onClick={() => {
                      setText(t.text);
                      setShowTemplates(false);
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            )}
          </div>
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
