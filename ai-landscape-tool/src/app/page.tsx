'use client';

import { useState, useEffect } from 'react';
import { Dashboard } from '@/components/Dashboard';
import { NamePrompt } from '@/components/NamePrompt';
import { BoardSelector } from '@/components/BoardSelector';
import { UserProvider, useUser } from '@/lib/userContext';
import { initFirebase } from '@/lib/firebase';
import { Board } from '@/types';
import { subscribeToBoards, createBoard } from '@/lib/boardDb';
import { boardTemplates } from '@/data/templates';

function AppContent() {
  const { isNameSet, user } = useUser();
  const [boards, setBoards] = useState<Board[]>([]);
  const [currentBoardId, setCurrentBoardId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initFirebase();
    
    const unsubscribe = subscribeToBoards((fetchedBoards) => {
      setBoards(fetchedBoards);
      
      // If no current board selected, select the most recent one
      // Or create default board if none exist
      if (!currentBoardId && fetchedBoards.length > 0) {
        setCurrentBoardId(fetchedBoards[0].id);
      } else if (fetchedBoards.length === 0 && isNameSet && user) {
        // Create default AI Landscape board
        const template = boardTemplates[0];
        createBoard({
          name: 'AI Landscape Workshop',
          description: template.description,
          columns: template.columns,
          rows: template.rows,
          createdBy: user.name,
          createdById: user.id,
        }).then((board) => {
          setCurrentBoardId(board.id);
        });
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentBoardId, isNameSet, user]);

  const handleSelectBoard = (boardId: string) => {
    setCurrentBoardId(boardId);
  };

  const handleCreateBoard = (board: Board) => {
    setCurrentBoardId(board.id);
  };

  if (!isNameSet) {
    return <NamePrompt />;
  }

  if (loading) {
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
      {currentBoard && (
        <Dashboard board={currentBoard} />
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
