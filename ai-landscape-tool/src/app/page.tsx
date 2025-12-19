'use client';

import { useState, useEffect } from 'react';
import { Dashboard } from '@/components/Dashboard';
import { NamePrompt } from '@/components/NamePrompt';
import { BoardSelector } from '@/components/BoardSelector';
import { UserProvider, useUser } from '@/lib/userContext';
import { initFirebase } from '@/lib/firebase';
import { Board, Note } from '@/types';
import { subscribeToBoards, createBoard } from '@/lib/boardDb';
import { subscribeToNotes, updateNote } from '@/lib/db';
import { boardTemplates } from '@/data/templates';

function AppContent() {
  const { isNameSet, user } = useUser();
  const [boards, setBoards] = useState<Board[]>([]);
  const [currentBoardId, setCurrentBoardId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [migrated, setMigrated] = useState(false);

  useEffect(() => {
    initFirebase();
    
    const unsubscribeBoards = subscribeToBoards((fetchedBoards) => {
      setBoards(fetchedBoards);
      
      // Select most recent board if none selected
      if (!currentBoardId && fetchedBoards.length > 0) {
        setCurrentBoardId(fetchedBoards[0].id);
      }
      
      setLoading(false);
    });

    return () => unsubscribeBoards();
  }, [currentBoardId]);

  // Migrate old notes without boardId to a legacy board
  useEffect(() => {
    if (migrated || !isNameSet || !user || loading) return;

    const unsubscribeNotes = subscribeToNotes(async (allNotes) => {
      const orphanedNotes = allNotes.filter(n => !n.boardId);
      
      if (orphanedNotes.length > 0) {
        // Check if legacy board already exists
        const legacyBoard = boards.find(b => b.name === 'AI Landscape (Original)');
        
        if (legacyBoard) {
          // Assign orphaned notes to legacy board
          for (const note of orphanedNotes) {
            await updateNote(note.id, { boardId: legacyBoard.id });
          }
        } else {
          // Create legacy board for old notes
          const template = boardTemplates[0]; // AI Landscape template
          const newBoard = await createBoard({
            name: 'AI Landscape (Original)',
            description: 'Original workshop notes migrated from previous version',
            columns: template.columns,
            rows: template.rows,
            createdBy: user.name,
            createdById: user.id,
          });
          
          // Assign orphaned notes to this board
          for (const note of orphanedNotes) {
            await updateNote(note.id, { boardId: newBoard.id });
          }
          
          setCurrentBoardId(newBoard.id);
        }
      } else if (boards.length === 0 && isNameSet && user) {
        // No boards and no orphaned notes - create default board
        const template = boardTemplates[0];
        const newBoard = await createBoard({
          name: 'AI Landscape Workshop',
          description: template.description,
          columns: template.columns,
          rows: template.rows,
          createdBy: user.name,
          createdById: user.id,
        });
        setCurrentBoardId(newBoard.id);
      }
      
      setMigrated(true);
    });

    return () => unsubscribeNotes();
  }, [isNameSet, user, loading, boards, migrated]);

  const handleSelectBoard = (boardId: string) => {
    setCurrentBoardId(boardId);
  };

  const handleCreateBoard = (board: Board) => {
    setCurrentBoardId(board.id);
  };

  if (!isNameSet) {
    return <NamePrompt />;
  }

  if (loading || !migrated) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;
  }

  const currentBoard = boards.find(b => b.id === currentBoardId);

  return (
    <div style={{ padding: '1rem' }}>
      <BoardSelector 
        currentBoardId={currentBoardId}
        onSelectBoard={handleSelectBoard}
        onCreateBoard={handleCreateBoard}
      />
      {currentBoard ? (
        <Dashboard board={currentBoard} />
      ) : (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#6c757d' }}>
          Select a board or create a new one to get started.
        </div>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
}
