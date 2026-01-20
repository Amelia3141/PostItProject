'use client';

import { Note, Category } from '@/types';
import styles from '@/app/Dashboard.module.css';

interface NoteCardProps {
  note: Note;
  onClick?: () => void;
  onVote?: (id: string, increment: number) => void;
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
  onVote,
  rotation = 0,
}: NoteCardProps) {
  const colourClass = categoryColours[note.category] || 'pink';
  const votes = note.votes || 0;
  const tags = note.tags || [];

  const handleVote = (e: React.MouseEvent, increment: number) => {
    e.stopPropagation();
    if (onVote) {
      onVote(note.id, increment);
    }
  };

  return (
    <div
      className={`${styles.card} ${styles[colourClass]}`}
      style={{ transform: `rotate(${rotation}deg)` }}
      onClick={onClick}
    >
      <p className={styles.cardText}>{note.text}</p>
      <div className={styles.cardFooter}>
        <div className={styles.voteButtons}>
          <button 
            className={styles.voteSmallBtn} 
            onClick={(e) => handleVote(e, -1)}
          >
            −
          </button>
          <span className={styles.voteCount}>{votes}</span>
          <button 
            className={styles.voteSmallBtn} 
            onClick={(e) => handleVote(e, 1)}
          >
            +
          </button>
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
      {note.createdBy && (
        <div className={styles.authorBadge} style={{ marginTop: '4px' }}>
          {note.createdBy}
        </div>
      )}
    </div>
  );
}
