'use client';

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Note, Category } from '@/types';
import styles from '@/app/Dashboard.module.css';

interface DraggableNoteCardProps {
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

export function DraggableNoteCard({
  note,
  onClick,
  isSelected = false,
  isConnecting = false,
  rotation = 0,
}: DraggableNoteCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: note.id,
    data: { note },
  });

  const colourClass = categoryColours[note.category] || 'pink';
  const votes = note.votes || 0;
  const tags = note.tags || [];

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    cursor: 'grab',
  };

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      data-note-id={note.id}
      className={`${styles.card} ${styles[colourClass]} ${isSelected ? styles.selected : ''} ${isConnecting ? styles.connecting : ''}`}
      style={style}
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
