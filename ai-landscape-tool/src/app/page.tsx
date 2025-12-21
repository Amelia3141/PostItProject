'use client';

import { useState, useEffect } from 'react';
import { Dashboard } from '@/components/Dashboard';
import { BoardSelector } from '@/components/BoardSelector';
import { NamePrompt } from '@/components/NamePrompt';
import { UserProvider, useUser } from '@/lib/userContext';
import { initFirebase } from '@/lib/firebase';
import { subscribeToBoards, createBoard } from '@/lib/boardDb';
import { subscribeToNotes, updateNote } from '@/lib/db';
import { Board, Note } from '@/types';
import { boardTemplates } from '@/data/templates';

function AppContent() {
  const { isNameSet } = useUser();
  const [boards, setBoards] = useState<Board[]>([]);
  const [currentBoard, setCurrentBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);
  const [migrated, setMigrated] = useState(false);

  useEffect(() => {
    initFirebase();
    
    const unsubscribe = subscribeToBoards((updatedBoards) => {
      setBoards(updatedBoards);
      
      if (currentBoard) {
        const updated = updatedBoards.find(b => b.id === currentBoard.id);
        if (updated) {
          setCurrentBoard(updated);
        }
      } else if (updatedBoards.length > 0 && !currentBoard) {
        setCurrentBoard(updatedBoards[0]);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Migration: check for orphaned notes without boardId
  useEffect(() => {
    if (migrated || loading || boards.length > 0) return;

    const unsubNotes = subscribeToNotes((notes: Note[]) => {
      const orphanedNotes = notes.filter(n => !n.boardId);
      
      if (orphanedNotes.length > 0 && !migrated) {
        setMigrated(true);
        
        // Create legacy board for orphaned notes
        const template = boardTemplates.find(t => t.id === 'ai-landscape')!;
        createBoard({
          name: 'AI Landscape (Original)',
          description: 'Original workshop notes migrated from previous version',
          columns: template.columns,
          rows: template.rows,
        }).then((legacyBoard) => {
          // Assign orphaned notes to legacy board
          orphanedNotes.forEach(note => {
            updateNote(note.id, { boardId: legacyBoard.id });
          });
          setCurrentBoard(legacyBoard);
        });
      } else if (orphanedNotes.length === 0 && boards.length === 0 && !migrated) {
        setMigrated(true);
        // No boards and no orphaned notes - create default board
        const template = boardTemplates.find(t => t.id === 'ai-landscape')!;
        createBoard({
          name: template.name,
          description: template.description,
          columns: template.columns,
          rows: template.rows,
        }).then(setCurrentBoard);
      }
    });

    return () => unsubNotes();
  }, [boards, loading, migrated]);

  if (!isNameSet) {
    return <NamePrompt />;
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        Loading...
      </div>
    );
  }

  const handleSelectBoard = (boardId: string) => {
    const board = boards.find(b => b.id === boardId);
    if (board) setCurrentBoard(board);
  };

  const handleCreateBoard = (board: Board) => {
    setCurrentBoard(board);
  };

  const handleUpdateBoard = (board: Board) => {
    setCurrentBoard(board);
  };

  return (
    <main>
      <BoardSelector
        currentBoardId={currentBoard?.id || null}
        onSelectBoard={handleSelectBoard}
        onCreateBoard={handleCreateBoard}
        onUpdateBoard={handleUpdateBoard}
      />
      {currentBoard && <Dashboard board={currentBoard} />}
    </main>
  );
}

export default function Home() {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
}
