export type Category = 'opportunities' | 'enablers' | 'actors';

export type Timeframe = '10months' | '3years' | '10years' | 'foundational';

export interface Note {
  id: string;
  text: string;
  category: Category;
  timeframe: Timeframe;
  votes: number;
  tags: string[];
  connections: string[]; // IDs of connected notes
  createdAt: number;
  updatedAt: number;
  createdBy?: string;
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
  title: string;
  description: string;
  createdAt: number;
  updatedAt: number;
  ownerId: string;
  collaborators: string[];
  isPublic: boolean;
  password?: string;
}

export interface User {
  id: string;
  email?: string;
  displayName?: string;
  createdAt: number;
}

export type ViewMode = 'grid' | 'board' | 'flow';

export interface FilterState {
  timeframe: Timeframe | 'all';
  category: Category | 'all';
  searchQuery: string;
  showConnections: boolean;
}
