'use client';

import { useState, useEffect } from 'react';
import { Note, Category, Timeframe } from '@/types';
import { categoryConfig, timeframeConfig } from '@/data/seed';
import styles from '@/app/Dashboard.module.css';

interface NoteModalProps {
  note?: Note | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onDelete?: (id: string) => void;
  onVote?: (id: string, increment: number) => void;
}

export function NoteModal({
  note,
  isOpen,
  onClose,
  onSave,
  onDelete,
  onVote,
}: NoteModalProps) {
  const [text, setText] = useState('');
  const [category, setCategory] = useState<Category>('opportunities');
  const [timeframe, setTimeframe] = useState<Timeframe>('10months');
  const [tagsInput, setTagsInput] = useState('');
  const [votes, setVotes] = useState(0);

  useEffect(() => {
    if (note) {
      setText(note.text);
      setCategory(note.category);
      setTimeframe(note.timeframe);
      setTagsInput((note.tags || []).join(', '));
      setVotes(note.votes || 0);
    } else {
      setText('');
      setCategory('opportunities');
      setTimeframe('10months');
      setTagsInput('');
      setVotes(0);
    }
  }, [note, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    onSave({
      text,
      category,
      timeframe,
      tags,
      votes: note ? votes : 1,
      connections: note?.connections || [],
    });
    
    onClose();
  };

  const handleDelete = () => {
    if (note && onDelete && confirm('Are you sure you want to delete this note?')) {
      onDelete(note.id);
      onClose();
    }
  };

  const handleVote = (increment: number) => {
    if (note && onVote) {
      const newVotes = Math.max(0, votes + increment);
      setVotes(newVotes);
      onVote(note.id, increment);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.modalTitle}>
          {note ? 'Edit Note' : 'Add New Note'}
        </h2>
        
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Content</label>
            <textarea
              className={styles.formTextarea}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter the idea or concept..."
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Category</label>
            <select
              className={styles.formSelect}
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
            >
              {Object.entries(categoryConfig).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Timeframe</label>
            <select
              className={styles.formSelect}
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value as Timeframe)}
            >
              {Object.entries(timeframeConfig).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Tags (comma-separated)</label>
            <input
              type="text"
              className={styles.formInput}
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g. Q1, Priority, Research"
            />
          </div>

          {note && (
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Votes: {votes}</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => handleVote(-1)}
                  disabled={votes === 0}
                >
                  -1 Vote
                </button>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => handleVote(1)}
                >
                  +1 Vote
                </button>
              </div>
            </div>
          )}

          <div className={styles.modalActions}>
            {note && onDelete && (
              <button
                type="button"
                className={styles.btnDanger}
                onClick={handleDelete}
              >
                Delete
              </button>
            )}
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={onClose}
            >
              Cancel
            </button>
            <button type="submit" className={styles.btnPrimary}>
              {note ? 'Save Changes' : 'Add Note'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
