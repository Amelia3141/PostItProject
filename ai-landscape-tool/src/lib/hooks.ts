'use client';

import { useState, useEffect, useCallback } from 'react';
import { Note, Connection, FilterState, Category, Timeframe } from '@/types';
import {
  subscribeToNotes,
  subscribeToConnections,
  createNote,
  updateNote,
  deleteNote,
  voteForNote,
  createConnection,
  deleteConnection,
  seedDatabase,
} from './db';
import { seedNotes } from '@/data/seed';

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    
    const unsubscribe = subscribeToNotes((fetchedNotes) => {
      setNotes(fetchedNotes);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const addNote = useCallback(
    async (noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => {
      try {
        const newNote = await createNote(noteData);
        return newNote;
      } catch (err) {
        setError(err as Error);
        throw err;
      }
    },
    []
  );

  const editNote = useCallback(async (id: string, updates: Partial<Note>) => {
    try {
      await updateNote(id, updates);
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

  const removeNote = useCallback(async (id: string) => {
    try {
      await deleteNote(id);
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

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
      await seedDatabase(seedNotes);
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

  return {
    notes,
    loading,
    error,
    addNote,
    editNote,
    removeNote,
    vote,
    seed,
  };
}

export function useConnections() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    
    const unsubscribe = subscribeToConnections((fetchedConnections) => {
      setConnections(fetchedConnections);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const addConnection = useCallback(
    async (sourceId: string, targetId: string, label?: string) => {
      try {
        const newConnection = await createConnection(sourceId, targetId, label);
        return newConnection;
      } catch (err) {
        setError(err as Error);
        throw err;
      }
    },
    []
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
    // Filter by timeframe
    if (filters.timeframe !== 'all' && note.timeframe !== filters.timeframe) {
      return false;
    }

    // Filter by category
    if (filters.category !== 'all' && note.category !== filters.category) {
      return false;
    }

    // Filter by search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const matchesText = note.text.toLowerCase().includes(query);
      const matchesTags = (note.tags || []).some((tag) =>
        tag.toLowerCase().includes(query)
      );
      if (!matchesText && !matchesTags) {
        return false;
      }
    }

    return true;
  });
}

export function useStats(notes: Note[]) {
  const totalIdeas = notes.length;
  const totalVotes = notes.reduce((sum, note) => sum + (note.votes || 0), 0);
  
  // Count unique contributors (placeholder - would need user tracking)
  const contributors = new Set(notes.map((n) => (n as any).createdBy).filter(Boolean)).size || 8;

  const topVoted = [...notes]
    .sort((a, b) => (b.votes || 0) - (a.votes || 0))
    .slice(0, 5);

  const byCategory = {
    opportunities: notes.filter((n) => n.category === 'opportunities').length,
    enablers: notes.filter((n) => n.category === 'enablers').length,
    actors: notes.filter((n) => n.category === 'actors').length,
  };

  const byTimeframe = {
    '10months': notes.filter((n) => n.timeframe === '10months').length,
    '3years': notes.filter((n) => n.timeframe === '3years').length,
    '10years': notes.filter((n) => n.timeframe === '10years').length,
    foundational: notes.filter((n) => n.timeframe === 'foundational').length,
  };

  return {
    totalIdeas,
    totalVotes,
    contributors,
    topVoted,
    byCategory,
    byTimeframe,
  };
}