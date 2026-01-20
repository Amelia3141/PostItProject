'use client';

import { useState, useEffect, useCallback } from 'react';
import { Note, Connection, FilterState, Category, Timeframe, NoteVersion } from '@/types';
import {
  subscribeToNotes,
  subscribeToConnections,
  createNote as dbCreateNote,
  updateNote as dbUpdateNote,
  deleteNote,
  voteForNote,
  createConnection,
  deleteConnection,
  seedDatabase,
} from './db';
import { seedNotes } from '@/data/seed';
import { useUser } from './userContext';

export function useNotes(boardId: string) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastAction, setLastAction] = useState<{ type: string; data: any } | null>(null);
  const { user } = useUser();

  useEffect(() => {
    setLoading(true);
    
    const unsubscribe = subscribeToNotes((fetchedNotes) => {
      // Filter notes by boardId
      const boardNotes = fetchedNotes.filter(n => n.boardId === boardId);
      setNotes(boardNotes);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [boardId]);

  const addNote = useCallback(
    async (noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'boardId'>) => {
      try {
        const noteWithAuthor = {
          ...noteData,
          boardId,
          createdBy: user?.name || 'Anonymous',
          createdById: user?.id || 'unknown',
          lastEditedBy: user?.name || 'Anonymous',
          lastEditedById: user?.id || 'unknown',
        };
        const newNote = await dbCreateNote(noteWithAuthor);
        setLastAction({ type: 'create', data: newNote });
        return newNote;
      } catch (err) {
        setError(err as Error);
        throw err;
      }
    },
    [user, boardId]
  );

  const editNote = useCallback(async (id: string, updates: Partial<Note>) => {
    try {
      const note = notes.find(n => n.id === id);
      if (note) {
        const version: NoteVersion = {
          id: Date.now().toString(),
          text: note.text,
          category: note.category,
          timeframe: note.timeframe,
          editedBy: note.lastEditedBy || note.createdBy || 'Unknown',
          editedById: note.lastEditedById || note.createdById || 'unknown',
          timestamp: note.updatedAt,
        };
        
        const history = [...(note.history || []), version].slice(-20);
        
        await dbUpdateNote(id, {
          ...updates,
          lastEditedBy: user?.name || 'Anonymous',
          lastEditedById: user?.id || 'unknown',
          history,
        });
        
        setLastAction({ type: 'edit', data: { id, previousState: note } });
      }
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [notes, user]);

  const removeNote = useCallback(async (id: string) => {
    try {
      const note = notes.find(n => n.id === id);
      await deleteNote(id);
      setLastAction({ type: 'delete', data: note });
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [notes]);

  const vote = useCallback(async (id: string, increment: number = 1) => {
    try {
      await voteForNote(id, increment);
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

  const seed = useCallback(async () => {
    try {
      const notesWithBoardId = seedNotes.map(n => ({ ...n, boardId } as Note));
      // seedDatabase no longer used
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [boardId]);

  const undo = useCallback(async () => {
    if (!lastAction) return;
    
    try {
      if (lastAction.type === 'delete' && lastAction.data) {
        await dbCreateNote(lastAction.data);
      } else if (lastAction.type === 'edit' && lastAction.data) {
        const { id, previousState } = lastAction.data;
        await dbUpdateNote(id, previousState);
      }
      setLastAction(null);
    } catch (err) {
      setError(err as Error);
    }
  }, [lastAction]);

  const restoreVersion = useCallback(async (noteId: string, version: NoteVersion) => {
    try {
      await dbUpdateNote(noteId, {
        text: version.text,
        category: version.category,
        timeframe: version.timeframe,
        lastEditedBy: user?.name || 'Anonymous',
        lastEditedById: user?.id || 'unknown',
      });
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [user]);

  const authors = Array.from(
    new Map(
      notes
        .filter(n => n.createdById)
        .map(n => [n.createdById, { id: n.createdById!, name: n.createdBy! }])
    ).values()
  );

  return {
    notes,
    loading,
    error,
    addNote,
    editNote,
    removeNote,
    vote,
    seed,
    undo,
    canUndo: !!lastAction,
    restoreVersion,
    authors,
  };
}

export function useConnections(boardId: string) {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    
    const unsubscribe = subscribeToConnections((fetchedConnections) => {
      const boardConnections = fetchedConnections.filter(c => c.boardId === boardId);
      setConnections(boardConnections);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [boardId]);

  const addConnection = useCallback(
    async (sourceId: string, targetId: string, label?: string) => {
      try {
        const newConnection = await createConnection(sourceId, targetId, boardId);
        return newConnection;
      } catch (err) {
        setError(err as Error);
        throw err;
      }
    },
    [boardId]
  );

  const removeConnection = useCallback(async (id: string) => {
    try {
      await deleteConnection(id);
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

  return {
    connections,
    loading,
    error,
    addConnection,
    removeConnection,
  };
}

export function useFilteredNotes(notes: Note[], filters: FilterState) {
  return notes.filter((note) => {
    if (filters.timeframe !== 'all' && note.timeframe !== filters.timeframe) {
      return false;
    }

    if (filters.category !== 'all' && note.category !== filters.category) {
      return false;
    }

    if (filters.authorId && note.createdById !== filters.authorId) {
      return false;
    }

    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const matchesText = note.text.toLowerCase().includes(query);
      const matchesTags = (note.tags || []).some((tag) =>
        tag.toLowerCase().includes(query)
      );
      const matchesAuthor = (note.createdBy || '').toLowerCase().includes(query);
      if (!matchesText && !matchesTags && !matchesAuthor) {
        return false;
      }
    }

    return true;
  });
}

export function useStats(notes: Note[]) {
  const totalIdeas = notes.length;
  const totalVotes = notes.reduce((sum, note) => sum + (note.votes || 0), 0);
  const contributors = new Set(notes.map((n) => n.createdById).filter(Boolean)).size || 1;

  const topVoted = [...notes]
    .sort((a, b) => (b.votes || 0) - (a.votes || 0))
    .slice(0, 5);

  return {
    totalIdeas,
    totalVotes,
    contributors,
    topVoted,
  };
}
