export type Category = 'opportunities' | 'enablers' | 'actors';

export type Timeframe = '10months' | '3years' | '10years' | 'foundational';

export type ViewMode = 'grid' | 'board' | 'flow';

export interface User {
  id: string;
  name: string;
  colour: string;
  lastSeen: number;
}

export interface Comment {
  id: string;
  text: string;
  author: string;
  authorId: string;
  createdAt: number;
}

export interface NoteVersion {
  id: string;
  text: string;
  category: Category;
  timeframe: Timeframe;
  editedBy: string;
  editedById: string;
  timestamp: number;
}

export interface Note {
  id: string;
  text: string;
  category: Category;
  timeframe: Timeframe;
  votes: number;
  tags: string[];
  connections: string[];
  comments?: Comment[];
  createdAt: number;
  updatedAt: number;
  createdBy?: string;
  createdById?: string;
  lastEditedBy?: string;
  lastEditedById?: string;
  history?: NoteVersion[];
}

export interface Connection {
  id: string;
  sourceId: string;
  targetId: string;
  label?: string;
  createdAt: number;
}

export interface Workshop {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
}

export interface FilterState {
  timeframe: Timeframe | 'all';
  category: Category | 'all';
  searchQuery: string;
  showConnections: boolean;
  authorId?: string;
}
