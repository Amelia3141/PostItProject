'use client';

import { useDroppable } from '@dnd-kit/core';
import { Category, Timeframe } from '@/types';
import styles from '@/app/Dashboard.module.css';

interface DroppableCellProps {
  category: Category;
  timeframe: Timeframe;
  children: React.ReactNode;
  heatmapColor?: string; // Pre-calculated color from density system
}

export function DroppableCell({ category, timeframe, children, heatmapColor }: DroppableCellProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: `${category}-${timeframe}`,
  });

  const backgroundColor = isOver
    ? 'rgba(0, 0, 0, 0.05)'
    : heatmapColor || undefined;

  return (
    <div
      ref={setNodeRef}
      className={styles.boardCell}
      style={{ backgroundColor }}
    >
      {children}
    </div>
  );
}
