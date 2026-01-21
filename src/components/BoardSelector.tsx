'use client';

import { useState, useEffect } from 'react';
import { Board, BoardTemplate } from '@/types';
import { subscribeToBoards, createBoard, deleteBoard, duplicateBoard, archiveBoard } from '@/lib/boardDb';
import { boardTemplates } from '@/data/templates';
import { useUser } from '@/lib/userContext';
import { ShareModal } from './ShareModal';
import { BoardSettings } from './BoardSettings';
import { ArchivedBoards } from './ArchivedBoards';
import { ThemeToggle } from './ThemeToggle';
import styles from '@/app/Dashboard.module.css';

interface BoardSelectorProps {
  currentBoardId: string | null;
  onSelectBoard: (boardId: string) => void;
  onCreateBoard: (board: Board) => void;
  onUpdateBoard: (board: Board) => void;
  onShowShortcuts?: () => void;
  onShowTutorial?: () => void;
}

export function BoardSelector({ currentBoardId, onSelectBoard, onCreateBoard, onUpdateBoard, onShowShortcuts, onShowTutorial }: BoardSelectorProps) {
  const { user } = useUser();
  const [boards, setBoards] = useState<Board[]>([]);
  const [archivedCount, setArchivedCount] = useState(0);
  const [showNewBoard, setShowNewBoard] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');

  useEffect(() => {
    const unsubscribe = subscribeToBoards((allBoards) => {
      const active = allBoards.filter(b => !b.archived);
      const archived = allBoards.filter(b => b.archived);
      setBoards(active);
      setArchivedCount(archived.length);
    });
    return () => unsubscribe();
  }, []);

  const handleCreateFromTemplate = async (template: BoardTemplate) => {
    const board = await createBoard({
      name: newBoardName || template.name,
      description: template.description,
      columns: template.columns,
      rows: template.rows,
      createdBy: user?.name,
      createdById: user?.id,
    });
    onCreateBoard(board);
    setShowNewBoard(false);
    setShowTemplates(false);
    setNewBoardName('');
  };

  const handleCreateCustom = async () => {
    const board = await createBoard({
      name: newBoardName || 'New Board',
      columns: [
        { id: 'col1', label: 'Column 1' },
        { id: 'col2', label: 'Column 2' },
        { id: 'col3', label: 'Column 3' },
      ],
      rows: [
        { id: 'row1', label: 'Row 1', colour: 'pink' },
        { id: 'row2', label: 'Row 2', colour: 'blue' },
        { id: 'row3', label: 'Row 3', colour: 'yellow' },
      ],
      createdBy: user?.name,
      createdById: user?.id,
    });
    onCreateBoard(board);
    setShowNewBoard(false);
    setNewBoardName('');
  };

  const handleDuplicate = async (boardId: string, boardName: string) => {
    const newBoard = await duplicateBoard(
      boardId, 
      `${boardName} (Copy)`,
      user?.id,
      user?.name
    );
    onCreateBoard(newBoard);
  };

  const handleArchive = async (board: Board) => {
    if (!user) return;
    await archiveBoard(board.id, user.name);
    if (currentBoardId === board.id) {
      const remaining = boards.filter(b => b.id !== board.id);
      if (remaining.length > 0) {
        onSelectBoard(remaining[0].id);
      }
    }
  };

  const handleDelete = async (board: Board) => {
    const shouldArchive = confirm(
      `Are you sure you want to delete "${board.name}"?\n\nClick "Cancel" to archive instead (recommended).`
    );
    
    if (shouldArchive) {
      const confirmDelete = confirm(
        `This will permanently delete "${board.name}" and all its notes.\n\nAre you absolutely sure?`
      );
      if (confirmDelete) {
        await deleteBoard(board.id);
        if (currentBoardId === board.id) {
          const remaining = boards.filter(b => b.id !== board.id);
          if (remaining.length > 0) {
            onSelectBoard(remaining[0].id);
          }
        }
      }
    } else {
      // User clicked Cancel, offer to archive
      if (user) {
        await archiveBoard(board.id, user.name);
        if (currentBoardId === board.id) {
          const remaining = boards.filter(b => b.id !== board.id);
          if (remaining.length > 0) {
            onSelectBoard(remaining[0].id);
          }
        }
      }
    }
  };

  const handleUnarchive = (board: Board) => {
    onCreateBoard(board);
    setShowArchived(false);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const currentBoard = boards.find(b => b.id === currentBoardId);

  return (
    <div className={styles.boardSelector}>
      <div className={styles.boardSelectorHeader}>
        <h3>Your Boards</h3>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {currentBoard && (
            <>
              <button
                className={styles.settingsBtn}
                onClick={() => setShowSettings(true)}
              >
                Settings
              </button>
              <button
                className={styles.shareBtn}
                onClick={() => setShowShareModal(true)}
              >
                Share
              </button>
            </>
          )}
          <button
            className={styles.newBoardBtn}
            onClick={() => setShowNewBoard(true)}
          >
            + New Board
          </button>
          <ThemeToggle />
          {onShowShortcuts && (
            <button
              className={styles.headerBtn}
              onClick={onShowShortcuts}
              title="Keyboard shortcuts (?)"
            >
              Shortcuts
            </button>
          )}
          {onShowTutorial && (
            <button
              className={styles.headerBtn}
              onClick={onShowTutorial}
              title="Show tutorial"
            >
              Tutorial
            </button>
          )}
        </div>
      </div>

      <div className={styles.boardList}>
        {boards.length === 0 ? (
          <p className={styles.noBoards}>No boards yet. Create your first one!</p>
        ) : (
          boards.map((board) => (
            <div 
              key={board.id}
              className={`${styles.boardItem} ${currentBoardId === board.id ? styles.activeBoardItem : ''}`}
            >
              <div 
                className={styles.boardItemMain}
                onClick={() => onSelectBoard(board.id)}
              >
                <div className={styles.boardItemName}>{board.name}</div>
                <div className={styles.boardItemMeta}>
                  {formatDate(board.updatedAt)} • {board.createdBy || 'Unknown'}
                </div>
              </div>
              <div className={styles.boardItemActions}>
                <button
                  className={styles.boardActionBtn}
                  onClick={(e) => { e.stopPropagation(); handleDuplicate(board.id, board.name); }}
                  title="Duplicate"
                >
                  ⧉
                </button>
                <button
                  className={styles.boardActionBtn}
                  onClick={(e) => { e.stopPropagation(); handleArchive(board); }}
                  title="Archive"
                >
                  ⌂
                </button>
                <button
                  className={styles.boardActionBtn}
                  onClick={(e) => { e.stopPropagation(); handleDelete(board); }}
                  title="Delete"
                >
                  ×
                </button>
              </div>
            </div>
          ))
        )}
        
        {archivedCount > 0 && (
          <div 
            className={styles.archivedBoardsLink}
            onClick={() => setShowArchived(true)}
          >
            <span className={styles.archiveIcon}>◫</span>
            <span>{archivedCount} archived</span>
          </div>
        )}
      </div>

      {showNewBoard && (
        <div className={styles.modal} onClick={() => setShowNewBoard(false)}>
          <div className={styles.newBoardModal} onClick={(e) => e.stopPropagation()}>
            <h2>Create New Board</h2>
            
            <div className={styles.formGroup}>
              <label>Board Name</label>
              <input
                type="text"
                value={newBoardName}
                onChange={(e) => setNewBoardName(e.target.value)}
                placeholder="My Workshop"
              />
            </div>

            {!showTemplates ? (
              <div className={styles.createOptions}>
                <button 
                  className={styles.createOptionBtn}
                  onClick={() => setShowTemplates(true)}
                >
                  Use Template
                </button>
                <button 
                  className={styles.createOptionBtn}
                  onClick={handleCreateCustom}
                >
                  Custom Board
                </button>
              </div>
            ) : (
              <div className={styles.templateGrid}>
                {boardTemplates.map((template) => (
                  <div 
                    key={template.id}
                    className={styles.templateCard}
                    onClick={() => handleCreateFromTemplate(template)}
                  >
                    <div className={styles.templateName}>{template.name}</div>
                    <div className={styles.templateDesc}>{template.description}</div>
                    <div className={styles.templatePreview}>
                      {template.columns.length} columns × {template.rows.length} rows
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className={styles.modalActions}>
              <button 
                className={styles.cancelBtn}
                onClick={() => { setShowNewBoard(false); setShowTemplates(false); }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {currentBoard && (
        <>
          <ShareModal
            boardId={currentBoard.id}
            boardName={currentBoard.name}
            isOpen={showShareModal}
            onClose={() => setShowShareModal(false)}
          />
          <BoardSettings
            board={currentBoard}
            isOpen={showSettings}
            onClose={() => setShowSettings(false)}
            onUpdate={onUpdateBoard}
          />
        </>
      )}

      <ArchivedBoards
        isOpen={showArchived}
        onClose={() => setShowArchived(false)}
        onUnarchive={handleUnarchive}
      />
    </div>
  );
}
