'use client';

import { useState, useEffect } from 'react';
import { Board } from '@/types';
import { subscribeToBoards, unarchiveBoard, deleteBoard } from '@/lib/boardDb';
import { useUser } from '@/lib/userContext';
import styles from '@/app/Dashboard.module.css';

interface ArchivedBoardsProps {
  isOpen: boolean;
  onClose: () => void;
  onUnarchive: (board: Board) => void;
}

export function ArchivedBoards({ isOpen, onClose, onUnarchive }: ArchivedBoardsProps) {
  const { user } = useUser();
  const [boards, setBoards] = useState<Board[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToBoards((allBoards) => {
      setBoards(allBoards.filter(b => b.archived));
    });
    return () => unsubscribe();
  }, []);

  if (!isOpen) return null;

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'Unknown';
    return new Date(timestamp).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleUnarchive = async (board: Board) => {
    if (!user) return;
    await unarchiveBoard(board.id, user.name);
    const updatedBoard = { ...board, archived: false, unarchivedAt: Date.now(), unarchivedBy: user.name };
    onUnarchive(updatedBoard);
  };

  const handleDelete = async (board: Board) => {
    if (confirm(`Permanently delete "${board.name}"? This cannot be undone.`)) {
      await deleteBoard(board.id);
    }
  };

  return (
    <div className={styles.modal} onClick={onClose}>
      <div className={styles.archivedModal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.modalTitle}>Archived Boards</h2>
        
        {boards.length === 0 ? (
          <p className={styles.noArchived}>No archived boards</p>
        ) : (
          <div className={styles.archivedList}>
            {boards.map((board) => (
              <div key={board.id} className={styles.archivedItem}>
                <div className={styles.archivedItemMain}>
                  <div className={styles.archivedItemName}>{board.name}</div>
                  <div className={styles.archivedItemMeta}>
                    <div>Created: {formatDate(board.createdAt)} by {board.createdBy || 'Unknown'}</div>
                    <div>Archived: {formatDate(board.archivedAt)} by {board.archivedBy || 'Unknown'}</div>
                    {board.unarchivedAt && (
                      <div>Previously unarchived: {formatDate(board.unarchivedAt)} by {board.unarchivedBy}</div>
                    )}
                  </div>
                </div>
                <div className={styles.archivedItemActions}>
                  <button
                    className={styles.unarchiveBtn}
                    onClick={() => handleUnarchive(board)}
                  >
                    Unarchive
                  </button>
                  <button
                    className={styles.permanentDeleteBtn}
                    onClick={() => handleDelete(board)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className={styles.modalActions}>
          <button className={styles.cancelBtn} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
