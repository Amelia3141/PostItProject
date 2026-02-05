export type Category = string;
export type Timeframe = string;
export type ViewMode = 'grid' | 'board' | 'flow' | 'roadmap';

export interface BoardColumn {
  id: string;
  label: string;
  colour?: string;
}

export interface BoardRow {
  id: string;
  label: string;
  colour: string;
  question?: string;
}

export interface Board {
  id: string;
  name: string;
  description?: string;
  columns: BoardColumn[];
  rows: BoardRow[];
  createdAt: number;
  updatedAt: number;
  createdBy?: string;
  createdById?: string;
  archived?: boolean;
  archivedAt?: number;
  archivedBy?: string;
  unarchivedAt?: number;
  unarchivedBy?: string;
}

export interface BoardTemplate {
  id: string;
  name: string;
  description: string;
  columns: BoardColumn[];
  rows: BoardRow[];
}

export interface Note {
  id: string;
  text: string;
  category: Category;
  timeframe: Timeframe;
  boardId: string;
  votes: number;
  tags: string[];
  connections: string[];
  createdAt: number;
  updatedAt: number;
  createdBy?: string;
  createdById?: string;
  lastEditedBy?: string;
  lastEditedById?: string;
  comments?: Comment[];
  history?: NoteVersion[];
  // Signal strength metadata (0-1 scale for visualization)
  signalStrength?: number;
  // Hover tooltip data
  paperTrends?: string;
  topInstitutions?: string[];
  // Spanning - notes that span multiple columns
  spanColumns?: string[]; // Array of column IDs this note spans
}

export interface NoteVersion {
  id: string;
  text: string;
  category: Category;
  timeframe: Timeframe;
  editedBy: string;
  editedById?: string;
  timestamp: number;
}

export interface Comment {
  id: string;
  text: string;
  author: string;
  authorId?: string;
  createdAt: number;
}

export interface Connection {
  id: string;
  sourceId: string;
  targetId: string;
  boardId?: string;
}

export interface FilterState {
  timeframe: Timeframe | 'all';
  category: Category | 'all';
  searchQuery: string;
  showConnections: boolean;
  authorId?: string;
}

export interface User {
  id: string;
  name: string;
  colour: string;
  lastSeen?: number;
}

export interface BoardShare {
  id: string;
  boardId: string;
  permission: 'view' | 'edit';
  createdAt: number;
  createdBy: string;
  createdById: string;
  expiresAt?: number;
}
