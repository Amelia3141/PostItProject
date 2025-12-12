'use client';

import { Note, Category } from '@/types';
import styles from '@/app/Dashboard.module.css';

interface NoteCardProps {
  note: Note;
  onClick?: () => void;
  isSelected?: boolean;
  isConnecting?: boolean;
  rotation?: number;
}

const categoryColours: Record<Category, string> = {
  opportunities: 'pink',
  enablers: 'blue',
  actors: 'yellow',
};

export function NoteCard({
  note,
  onClick,
  isSelected = false,
  isConnecting = false,
  rotation = 0,
}: NoteCardProps) {
  const colourClass = categoryColours[note.category] || 'pink';
  const votes = note.votes || 0;
  const tags = note.tags || [];
  
  return (
    <div
      data-note-id={note.id}
      className={`${styles.card} ${styles[colourClass]} ${isSelected ? styles.selected : ''} ${isConnecting ? styles.connecting : ''}`}
      style={{ transform: `rotate(${rotation}deg)` }}
      onClick={onClick}
    >
      <p className={styles.cardText}>{note.text}</p>
      <div className={styles.cardFooter}>
        <div className={styles.dots}>
          {Array.from({ length: Math.min(votes, 10) }).map((_, i) => (
            <span key={i} className={styles.dot} />
          ))}
        </div>
        {tags.length > 0 && (
          <div className={styles.tags}>
            {tags.map((tag: string) => (
              <span key={tag} className={styles.tag}>
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}