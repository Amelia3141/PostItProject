'use client';

import { useDroppable } from '@dnd-kit/core';
import { Category, Timeframe } from '@/types';
import styles from '@/app/Dashboard.module.css';

interface DroppableCellProps {
  category: Category;
  timeframe: Timeframe;
  children: React.ReactNode;
}

export function DroppableCell({ category, timeframe, children }: DroppableCellProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: `${category}-${timeframe}`,
  });

  return (
    <div
      ref={setNodeRef}
      className={styles.boardCell}
      style={{
        backgroundColor: isOver ? 'rgba(0, 0, 0, 0.05)' : undefined,
      }}
    >
      {children}
    </div>
  );
}
