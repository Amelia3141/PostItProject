'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Dashboard } from '@/components/Dashboard';
import { NamePrompt } from '@/components/NamePrompt';
import { UserProvider, useUser } from '@/lib/userContext';
import { initFirebase } from '@/lib/firebase';
import { getShareLink, BoardShare } from '@/lib/shareUtils';
import { getBoard } from '@/lib/boardDb';
import { Board } from '@/types';

function SharedBoardContent() {
  const params = useParams();
  const router = useRouter();
  const { isNameSet } = useUser();
  const [share, setShare] = useState<BoardShare | null>(null);
  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initFirebase();
    
    async function loadShare() {
      const shareId = params.id as string;
      const shareData = await getShareLink(shareId);
      
      if (!shareData) {
        setError('This share link is invalid or has expired.');
        setLoading(false);
        return;
      }
      
      const boardData = await getBoard(shareData.boardId);
      
      if (!boardData) {
        setError('The shared board no longer exists.');
        setLoading(false);
        return;
      }
      
      setShare(shareData);
      setBoard(boardData);
      setLoading(false);
    }
    
    loadShare();
  }, [params.id]);

  if (!isNameSet) {
    return <NamePrompt />;
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        Loading shared board...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', gap: '1rem' }}>
        <h1 style={{ color: '#e53e3e' }}>⚠️ {error}</h1>
        <button 
          onClick={() => router.push('/')}
          style={{ padding: '0.75rem 1.5rem', background: '#667eea', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
        >
          Go to Home
        </button>
      </div>
    );
  }

  if (!board || !share) return null;

  return (
    <div style={{ padding: '1rem' }}>
      <div style={{ 
        background: share.permission === 'view' ? '#fff3cd' : '#d4edda', 
        padding: '0.75rem 1rem', 
        borderRadius: '8px', 
        marginBottom: '1rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span>
          {share.permission === 'view' 
            ? '👁️ You are viewing this board (read-only)' 
            : '✏️ You can edit this board'}
        </span>
        <button 
          onClick={() => router.push('/')}
          style={{ padding: '0.5rem 1rem', background: 'white', border: '1px solid #ccc', borderRadius: '6px', cursor: 'pointer' }}
        >
          Go to My Boards
        </button>
      </div>
      <Dashboard board={board} readOnly={share.permission === 'view'} />
    </div>
  );
}

export default function SharedBoardPage() {
  return (
    <UserProvider>
      <SharedBoardContent />
    </UserProvider>
  );
}
