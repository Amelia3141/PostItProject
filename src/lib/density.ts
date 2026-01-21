import { Note, Board } from '@/types';

export type DensityMethod = 'grid' | 'kde' | 'structured' | 'gaps' | 'votes';
export type ColorScheme = 'heat' | 'viridis' | 'blues' | 'greens' | 'diverging';

export interface DensityCell {
  rowId: string;
  colId: string;
  count: number;
  normalised: number; // 0-1 relative to max
  votes?: number;
  gapScore?: number;
}

export interface DensityConfig {
  method: DensityMethod;
  colorScheme: ColorScheme;
  kdeBandwidth?: number;
  showGapHighlights?: boolean;
}

// Grid-based density (simple count per cell)
export function gridDensity(notes: Note[], board: Board): DensityCell[] {
  const counts: Map<string, number> = new Map();

  for (const note of notes) {
    const key = `${note.category}:${note.timeframe}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  const max = Math.max(...Array.from(counts.values()), 1);

  const cells: DensityCell[] = [];
  for (const row of board.rows) {
    for (const col of board.columns) {
      const key = `${row.id}:${col.id}`;
      const count = counts.get(key) || 0;
      cells.push({
        rowId: row.id,
        colId: col.id,
        count,
        normalised: count / max,
      });
    }
  }

  return cells;
}

// Kernel Density Estimation with Gaussian kernel
export function kdeDensity(
  notes: Note[],
  board: Board,
  bandwidth: number = 1.5
): DensityCell[] {
  // Map categories and timeframes to numeric positions
  const rowIndex = new Map(board.rows.map((r, i) => [r.id, i]));
  const colIndex = new Map(board.columns.map((c, i) => [c.id, i]));

  // Convert notes to coordinates
  const points = notes.map(note => ({
    x: colIndex.get(note.timeframe) || 0,
    y: rowIndex.get(note.category) || 0,
  }));

  // Calculate KDE for each cell
  const cells: DensityCell[] = [];
  let maxDensity = 0;

  for (const row of board.rows) {
    for (const col of board.columns) {
      const cellX = colIndex.get(col.id) || 0;
      const cellY = rowIndex.get(row.id) || 0;

      let density = 0;
      for (const point of points) {
        const dx = cellX - point.x;
        const dy = cellY - point.y;
        const distSq = dx * dx + dy * dy;
        // Gaussian kernel
        density += Math.exp(-distSq / (2 * bandwidth * bandwidth));
      }

      // Normalise by kernel area
      if (points.length > 0) {
        density /= points.length * 2 * Math.PI * bandwidth * bandwidth;
      }

      maxDensity = Math.max(maxDensity, density);

      const count = notes.filter(n => n.category === row.id && n.timeframe === col.id).length;
      cells.push({
        rowId: row.id,
        colId: col.id,
        count,
        normalised: density, // Will normalise after
      });
    }
  }

  // Normalise to 0-1
  if (maxDensity > 0) {
    for (const cell of cells) {
      cell.normalised = cell.normalised / maxDensity;
    }
  }

  return cells;
}

// Structured density (category/time aware)
export function structuredDensity(notes: Note[], board: Board): DensityCell[] {
  const counts: Map<string, { count: number; votes: number }> = new Map();

  for (const note of notes) {
    const key = `${note.category}:${note.timeframe}`;
    const existing = counts.get(key) || { count: 0, votes: 0 };
    counts.set(key, {
      count: existing.count + 1,
      votes: existing.votes + (note.votes || 0),
    });
  }

  const maxCount = Math.max(...Array.from(counts.values()).map(v => v.count), 1);

  const cells: DensityCell[] = [];
  for (const row of board.rows) {
    for (const col of board.columns) {
      const key = `${row.id}:${col.id}`;
      const data = counts.get(key) || { count: 0, votes: 0 };
      cells.push({
        rowId: row.id,
        colId: col.id,
        count: data.count,
        votes: data.votes,
        normalised: data.count / maxCount,
      });
    }
  }

  return cells;
}

// Vote-weighted density
export function votesDensity(notes: Note[], board: Board): DensityCell[] {
  const votes: Map<string, number> = new Map();
  const counts: Map<string, number> = new Map();

  for (const note of notes) {
    const key = `${note.category}:${note.timeframe}`;
    votes.set(key, (votes.get(key) || 0) + (note.votes || 0));
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  const maxVotes = Math.max(...Array.from(votes.values()), 1);

  const cells: DensityCell[] = [];
  for (const row of board.rows) {
    for (const col of board.columns) {
      const key = `${row.id}:${col.id}`;
      const voteCount = votes.get(key) || 0;
      const count = counts.get(key) || 0;
      cells.push({
        rowId: row.id,
        colId: col.id,
        count,
        votes: voteCount,
        normalised: voteCount / maxVotes,
      });
    }
  }

  return cells;
}

// Gap analysis - identifies sparse regions
export function gapAnalysis(notes: Note[], board: Board): DensityCell[] {
  const counts: Map<string, number> = new Map();

  for (const note of notes) {
    const key = `${note.category}:${note.timeframe}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  const totalItems = notes.length;
  const numCells = board.rows.length * board.columns.length;
  const expectedUniform = totalItems / numCells;

  const cells: DensityCell[] = [];

  for (const row of board.rows) {
    for (const col of board.columns) {
      const key = `${row.id}:${col.id}`;
      const count = counts.get(key) || 0;

      // Gap score: higher = more sparse than expected
      const gapScore = expectedUniform > 0
        ? Math.max(0, (expectedUniform - count) / expectedUniform)
        : (count === 0 ? 1 : 0);

      cells.push({
        rowId: row.id,
        colId: col.id,
        count,
        normalised: gapScore, // For gaps, normalised represents sparseness
        gapScore,
      });
    }
  }

  return cells;
}

// Main density calculation function
export function calculateDensity(
  notes: Note[],
  board: Board,
  config: DensityConfig
): DensityCell[] {
  switch (config.method) {
    case 'grid':
      return gridDensity(notes, board);
    case 'kde':
      return kdeDensity(notes, board, config.kdeBandwidth || 1.5);
    case 'structured':
      return structuredDensity(notes, board);
    case 'votes':
      return votesDensity(notes, board);
    case 'gaps':
      return gapAnalysis(notes, board);
    default:
      return gridDensity(notes, board);
  }
}

// Color scheme functions
export function getColor(intensity: number, scheme: ColorScheme, isGap: boolean = false): string {
  if (intensity === 0 && !isGap) return 'transparent';

  // Clamp intensity to 0-1
  const t = Math.max(0, Math.min(1, intensity));

  switch (scheme) {
    case 'heat':
      if (isGap) {
        // For gaps: transparent to orange/red
        const r = 255;
        const g = Math.round(200 - t * 150);
        const b = 50;
        return `rgba(${r}, ${g}, ${b}, ${0.1 + t * 0.4})`;
      }
      // Green -> Yellow -> Red
      const r = Math.round(t < 0.5 ? t * 2 * 255 : 255);
      const g = Math.round(t < 0.5 ? 255 : (1 - (t - 0.5) * 2) * 255);
      return `rgba(${r}, ${g}, 0, ${0.15 + t * 0.35})`;

    case 'viridis':
      // Purple -> Blue -> Green -> Yellow
      if (t < 0.25) {
        return `rgba(68, 1, 84, ${0.15 + t * 0.35})`;
      } else if (t < 0.5) {
        const mix = (t - 0.25) * 4;
        return `rgba(${Math.round(68 - 25 * mix)}, ${Math.round(1 + 103 * mix)}, ${Math.round(84 + 54 * mix)}, ${0.15 + t * 0.35})`;
      } else if (t < 0.75) {
        const mix = (t - 0.5) * 4;
        return `rgba(${Math.round(43 + 82 * mix)}, ${Math.round(104 + 75 * mix)}, ${Math.round(138 - 68 * mix)}, ${0.15 + t * 0.35})`;
      } else {
        const mix = (t - 0.75) * 4;
        return `rgba(${Math.round(125 + 128 * mix)}, ${Math.round(179 + 50 * mix)}, ${Math.round(70 - 40 * mix)}, ${0.15 + t * 0.35})`;
      }

    case 'blues':
      // Light blue -> Dark blue
      const blueR = Math.round(240 - t * 180);
      const blueG = Math.round(248 - t * 150);
      const blueB = Math.round(255 - t * 50);
      return `rgba(${blueR}, ${blueG}, ${blueB}, ${0.2 + t * 0.4})`;

    case 'greens':
      // Light green -> Dark green
      const greenR = Math.round(240 - t * 180);
      const greenG = Math.round(255 - t * 80);
      const greenB = Math.round(240 - t * 180);
      return `rgba(${greenR}, ${greenG}, ${greenB}, ${0.2 + t * 0.4})`;

    case 'diverging':
      // Blue (low) -> White (mid) -> Red (high)
      if (t < 0.5) {
        const mix = t * 2;
        return `rgba(${Math.round(50 + 205 * mix)}, ${Math.round(100 + 155 * mix)}, ${Math.round(200 + 55 * mix)}, ${0.2 + Math.abs(t - 0.5) * 0.4})`;
      } else {
        const mix = (t - 0.5) * 2;
        return `rgba(255, ${Math.round(255 - 155 * mix)}, ${Math.round(255 - 205 * mix)}, ${0.2 + Math.abs(t - 0.5) * 0.4})`;
      }

    default:
      return `rgba(102, 126, 234, ${0.1 + t * 0.4})`;
  }
}

// Get density value for a specific cell
export function getCellDensity(
  cells: DensityCell[],
  rowId: string,
  colId: string
): DensityCell | undefined {
  return cells.find(c => c.rowId === rowId && c.colId === colId);
}

// Get gap analysis summary
export interface GapSummary {
  totalGaps: number;
  emptyRegions: { row: string; col: string }[];
  sparseRegions: { row: string; col: string; gapScore: number }[];
  densestRegions: { row: string; col: string; count: number }[];
}

export function getGapSummary(cells: DensityCell[], board: Board): GapSummary {
  const emptyRegions: { row: string; col: string }[] = [];
  const sparseRegions: { row: string; col: string; gapScore: number }[] = [];
  const densestRegions: { row: string; col: string; count: number }[] = [];

  for (const cell of cells) {
    const rowLabel = board.rows.find(r => r.id === cell.rowId)?.label || cell.rowId;
    const colLabel = board.columns.find(c => c.id === cell.colId)?.label || cell.colId;

    if (cell.count === 0) {
      emptyRegions.push({ row: rowLabel, col: colLabel });
    } else if (cell.gapScore && cell.gapScore > 0.5) {
      sparseRegions.push({ row: rowLabel, col: colLabel, gapScore: cell.gapScore });
    }

    if (cell.count > 0) {
      densestRegions.push({ row: rowLabel, col: colLabel, count: cell.count });
    }
  }

  // Sort sparse regions by gap score (most sparse first)
  sparseRegions.sort((a, b) => b.gapScore - a.gapScore);

  // Sort densest regions by count (most dense first)
  densestRegions.sort((a, b) => b.count - a.count);

  return {
    totalGaps: emptyRegions.length,
    emptyRegions,
    sparseRegions: sparseRegions.slice(0, 5),
    densestRegions: densestRegions.slice(0, 5),
  };
}
