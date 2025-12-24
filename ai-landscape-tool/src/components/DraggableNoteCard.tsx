'use client';

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Note } from '@/types';
import styles from '@/app/Dashboard.module.css';

interface DraggableNoteCardProps {
  note: Note;
  onClick?: () => void;
  onVote?: (id: string, increment: number) => void;
  rotation?: number;
  rowColour?: string;
}

export function DraggableNoteCard({
  note,
  onClick,
  onVote,
  rotation = 0,
  rowColour = 'pink',
}: DraggableNoteCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: note.id,
    data: { note },
  });

  const votes = note.votes || 0;
  const tags = note.tags || [];

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  const handleVote = (e: React.MouseEvent, increment: number) => {
    e.stopPropagation();
    if (onVote) {
      onVote(note.id, increment);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <div
      ref={setNodeRef}
      className={`${styles.card} ${styles[rowColour]}`}
      style={style}
      onClick={handleCardClick}
    >
      <div
        className={styles.dragHandle}
        {...listeners}
        {...attributes}
      >
        ⋮⋮
      </div>
      <p className={styles.cardText}>{note.text}</p>
      <div className={styles.cardFooter}>
        <div className={styles.voteButtons}>
          <button 
            className={styles.voteSmallBtn} 
            onClick={(e) => handleVote(e, -1)}
            onPointerDown={(e) => e.stopPropagation()}
          >
            −
          </button>
          <span className={styles.voteCount}>{votes}</span>
          <button 
            className={styles.voteSmallBtn} 
            onClick={(e) => handleVote(e, 1)}
            onPointerDown={(e) => e.stopPropagation()}
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
