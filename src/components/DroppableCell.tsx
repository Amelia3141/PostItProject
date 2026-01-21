'use client';

import { useDroppable } from '@dnd-kit/core';
import { Category, Timeframe } from '@/types';
import styles from '@/app/Dashboard.module.css';

interface DroppableCellProps {
  category: Category;
  timeframe: Timeframe;
  children: React.ReactNode;
  heatmapIntensity?: number; // 0-1 value for heatmap coloring
}

// Heatmap color scale from light to dark (green-yellow-red)
function getHeatmapColor(intensity: number): string {
  if (intensity === 0) return 'transparent';

  // Interpolate from green (low) through yellow (medium) to red (high)
  const r = Math.round(intensity < 0.5 ? intensity * 2 * 255 : 255);
  const g = Math.round(intensity < 0.5 ? 255 : (1 - (intensity - 0.5) * 2) * 255);
  const b = 0;

  return `rgba(${r}, ${g}, ${b}, ${0.15 + intensity * 0.25})`;
}

export function DroppableCell({ category, timeframe, children, heatmapIntensity }: DroppableCellProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: `${category}-${timeframe}`,
  });

  const backgroundColor = isOver
    ? 'rgba(0, 0, 0, 0.05)'
    : heatmapIntensity !== undefined
      ? getHeatmapColor(heatmapIntensity)
      : undefined;

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
