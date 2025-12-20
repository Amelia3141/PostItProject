'use client';

import { useState } from 'react';
import { Note, Category, Timeframe, ViewMode, FilterState, Board } from '@/types';
import { useNotes, useConnections, useFilteredNotes, useStats } from '@/lib/hooks';
import { useUser } from '@/lib/userContext';
import { NoteCard } from './NoteCard';
import { NoteModal } from './NoteModal';
import { QuickAddNote } from './QuickAddNote';
import { PresenceAvatars } from './PresenceAvatars';
import { exportToJSON, exportToCSV, exportToPDF } from '@/lib/export';
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { DraggableNoteCard } from './DraggableNoteCard';
import { DroppableCell } from './DroppableCell';
import { FlowView } from './FlowView';
import styles from '@/app/Dashboard.module.css';

interface DashboardProps {
  board: Board;
  readOnly?: boolean;
}

function getRotation(id: string): number {
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return ((hash % 13) - 6) * 0.1;
}

type SortOption = 'newest' | 'oldest' | 'mostVotes' | 'leastVotes' | 'alphabetical';

export function Dashboard({ board, readOnly = false }: DashboardProps) {
  const { notes, loading, addNote, editNote, removeNote, vote, undo, canUndo, restoreVersion, authors } = useNotes(board.id);
  const { connections, addConnection } = useConnections(board.id);
  const { user } = useUser();
  
  const [viewMode, setViewMode] = useState<ViewMode>('board');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [minVotes, setMinVotes] = useState<number>(0);
  const [collapsedRows, setCollapsedRows] = useState<Set<string>>(new Set());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    timeframe: 'all',
    category: 'all',
    searchQuery: '',
    showConnections: false,
    authorId: undefined,
  });
  
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredNotes = useFilteredNotes(notes, filters);
  
  const processedNotes = filteredNotes
    .filter(note => (note.votes || 0) >= minVotes)
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest': return b.createdAt - a.createdAt;
        case 'oldest': return a.createdAt - b.createdAt;
        case 'mostVotes': return (b.votes || 0) - (a.votes || 0);
        case 'leastVotes': return (a.votes || 0) - (b.votes || 0);
        case 'alphabetical': return a.text.localeCompare(b.text);
        default: return 0;
      }
    });

  const stats = useStats(notes);

  const handleNoteClick = (note: Note) => {
    setSelectedNote(note);
    setIsModalOpen(true);
  };

  const handleAddNote = () => {
    if (readOnly) return;
    setSelectedNote(null);
    setIsModalOpen(true);
  };

  const handleQuickAdd = async (text: string, category: Category, timeframe: Timeframe) => {
    if (readOnly) return;
    await addNote({
      text,
      category,
      timeframe,
      votes: 0,
      tags: [],
      connections: [],
    });
  };

  const handleSaveNote = async (data: Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'boardId'>) => {
    if (readOnly) return;
    if (selectedNote) {
      await editNote(selectedNote.id, data);
    } else {
      await addNote(data);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    if (readOnly) return;
    const { active, over } = event;
    if (!over) return;
    
    const noteId = active.id as string;
    const [newCategory, newTimeframe] = (over.id as string).split('-') as [Category, Timeframe];
    
    const note = notes.find(n => n.id === noteId);
    if (note && (note.category !== newCategory || note.timeframe !== newTimeframe)) {
      await editNote(noteId, { category: newCategory, timeframe: newTimeframe });
    }
  };

  const handleVote = async (id: string, increment: number) => {
    if (readOnly) return;
    await vote(id, increment);
  };

  const toggleRowCollapse = (rowId: string) => {
    setCollapsedRows(prev => {
      const next = new Set(prev);
      if (next.has(rowId)) {
        next.delete(rowId);
      } else {
        next.add(rowId);
      }
      return next;
    });
  };

  const getNotesByCell = (rowId: string, colId: string) => {
    return processedNotes.filter(
      (note) => note.category === rowId && note.timeframe === colId
    );
  };

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  const flowViewContent = (
    <FlowView
      notes={processedNotes}
      connections={connections}
      onNoteClick={handleNoteClick}
      onConnect={readOnly ? () => {} : addConnection}
    />
  );

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.title}>{board.name}</h1>
            {board.description && (
              <p className={styles.subtitle}>{board.description}</p>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <PresenceAvatars boardId={board.id} />
            {user && (
              <div className={styles.userBadge} style={{ backgroundColor: user.colour }}>
                {user.name}
              </div>
            )}
          </div>
        </div>
        {readOnly && (
          <div className={styles.readOnlyBanner}>
            👁️ View only mode - you cannot make changes
          </div>
        )}
      </header>

      {!readOnly && (
        <QuickAddNote
          onAdd={handleQuickAdd}
          categories={board.rows.map(r => ({ id: r.id, label: r.label }))}
          timeframes={board.columns.map(c => ({ id: c.id, label: c.label }))}
        />
      )}

      <div className={styles.stats}>
        <div className={styles.stat}>
          <div className={styles.statNumber}>{stats.totalIdeas}</div>
          <div className={styles.statLabel}>Ideas</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statNumber}>{stats.totalVotes}</div>
          <div className={styles.statLabel}>Total Votes</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statNumber}>{stats.contributors}</div>
          <div className={styles.statLabel}>Contributors</div>
        </div>
      </div>

      {stats.topVoted.length > 0 && (
        <div className={styles.topVoted}>
          <div className={styles.topVotedHeader}>
            <span className={styles.trophyIcon}>🏆</span>
            <h2>Top Voted Ideas</h2>
          </div>
          <div className={styles.topVotedList}>
            {stats.topVoted.map((note, index) => {
              const row = board.rows.find(r => r.id === note.category);
              const col = board.columns.find(c => c.id === note.timeframe);
              return (
                <div
                  key={note.id}
                  className={`${styles.topVotedItem} ${styles[row?.colour || 'pink']}`}
                >
                  <div className={styles.topVotedRank}>#{index + 1}</div>
                  <div className={styles.topVotedContent}>
                    <p className={styles.topVotedText}>{note.text}</p>
                    <div className={styles.topVotedMeta}>
                      <span className={styles.topVotedCategory}>{row?.label || note.category}</span>
                      <span className={styles.topVotedTime}>{col?.label || note.timeframe}</span>
                    </div>
                  </div>
                  <div className={styles.topVotedDots}>
                    <span className={styles.dotCount}>{note.votes || 0}</span>
                    <span className={styles.dotLabel}>votes</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className={styles.controls}>
        <div className={styles.viewToggle}>
          <button
            className={`${styles.viewBtn} ${viewMode === 'grid' ? styles.active : ''}`}
            onClick={() => setViewMode('grid')}
          >
            Grid
          </button>
          <button
            className={`${styles.viewBtn} ${viewMode === 'board' ? styles.active : ''}`}
            onClick={() => setViewMode('board')}
          >
            Board
          </button>
          <button
            className={`${styles.viewBtn} ${viewMode === 'flow' ? styles.active : ''}`}
            onClick={() => setViewMode('flow')}
          >
            Flow
          </button>
        </div>

        <input
          type="text"
          placeholder="Search ideas..."
          className={styles.searchInput}
          value={filters.searchQuery}
          onChange={(e) => setFilters((f) => ({ ...f, searchQuery: e.target.value }))}
        />

        <select 
          className={styles.sortSelect}
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="mostVotes">Most Votes</option>
          <option value="leastVotes">Least Votes</option>
          <option value="alphabetical">A-Z</option>
        </select>

        <select
          className={styles.sortSelect}
          value={minVotes}
          onChange={(e) => setMinVotes(Number(e.target.value))}
        >
          <option value={0}>All Votes</option>
          <option value={1}>1+ Votes</option>
          <option value={2}>2+ Votes</option>
          <option value={3}>3+ Votes</option>
          <option value={5}>5+ Votes</option>
        </select>

        {authors.length > 0 && (
          <select
            className={styles.sortSelect}
            value={filters.authorId || ''}
            onChange={(e) => setFilters((f) => ({ ...f, authorId: e.target.value || undefined }))}
          >
            <option value="">All Authors</option>
            {authors.map((author) => (
              <option key={author.id} value={author.id}>
                {author.name}
              </option>
            ))}
          </select>
        )}

        {!readOnly && (
          <>
            <button 
              className={styles.undoBtn} 
              onClick={undo}
              disabled={!canUndo}
            >
              ↩ Undo
            </button>

            <button className={styles.addNoteBtn} onClick={handleAddNote}>
              + Add Note
            </button>
          </>
        )}
        
        <button className={styles.filterBtn} onClick={() => exportToJSON(notes)}>JSON</button>
        <button className={styles.filterBtn} onClick={() => exportToCSV(notes)}>CSV</button>
        <button className={styles.filterBtn} onClick={() => exportToPDF(notes)}>PDF</button>
        
        {viewMode === 'flow' && (
          <button 
            className={styles.filterBtn}
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            {isFullscreen ? '⊙ Exit' : '⛶ Fullscreen'}
          </button>
        )}
      </div>

      {viewMode === 'board' && (
        <DndContext onDragEnd={handleDragEnd}>
          <div className={`${styles.board} ${styles.fadeIn}`}>
            <div className={styles.boardHeader} style={{ gridTemplateColumns: `180px repeat(${board.columns.length}, 1fr)` }}>
              <div className={styles.boardRowLabel}></div>
              {board.columns.map((col) => (
                <div key={col.id} className={styles.timeframeHeader}>{col.label}</div>
              ))}
            </div>

            {board.rows.map((row) => (
              <div 
                key={row.id} 
                className={styles.boardRow}
                style={{ 
                  gridTemplateColumns: `180px repeat(${board.columns.length}, 1fr)`,
                  background: `rgba(${row.colour === 'pink' ? '254,215,215' : row.colour === 'blue' ? '190,227,248' : '250,240,137'}, 0.1)`
                }}
              >
                <div className={styles.boardRowLabel}>
                  <button 
                    className={styles.collapseBtn}
                    onClick={() => toggleRowCollapse(row.id)}
                  >
                    {collapsedRows.has(row.id) ? '▶' : '▼'}
                  </button>
                  <div className={`${styles.categoryBadge} ${styles[row.colour]}`}>
                    {row.label}
                  </div>
                </div>
                {!collapsedRows.has(row.id) && board.columns.map((col) => (
                  <DroppableCell key={col.id} category={row.id as Category} timeframe={col.id as Timeframe}>
                    {getNotesByCell(row.id, col.id).map((note) => (
                      <DraggableNoteCard
                        key={note.id}
                        note={note}
                        onClick={() => handleNoteClick(note)}
                        onVote={handleVote}
                        rotation={getRotation(note.id)}
                      />
                    ))}
                  </DroppableCell>
                ))}
                {collapsedRows.has(row.id) && (
                  <div className={styles.collapsedRow} style={{ gridColumn: `span ${board.columns.length}` }}>
                    {processedNotes.filter(n => n.category === row.id).length} notes hidden
                  </div>
                )}
              </div>
            ))}
          </div>
        </DndContext>
      )}

      {viewMode === 'grid' && (
        <div className={styles.gridView}>
          {processedNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onClick={() => handleNoteClick(note)}
              onVote={handleVote}
              rotation={getRotation(note.id)}
            />
          ))}
        </div>
      )}

      {viewMode === 'flow' && (
        isFullscreen ? (
          <div className={styles.fullscreenFlow}>
            <button 
              className={styles.exitFullscreenBtn}
              onClick={() => setIsFullscreen(false)}
            >
              ✕ Exit Fullscreen
            </button>
            {flowViewContent}
          </div>
        ) : (
          flowViewContent
        )
      )}

      <NoteModal
        note={selectedNote}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedNote(null);
        }}
        onSave={handleSaveNote}
        onDelete={readOnly ? async () => {} : removeNote}
        onVote={handleVote}
        onRestoreVersion={readOnly ? async () => {} : restoreVersion}
        categories={board.rows.map(r => ({ id: r.id, label: r.label }))}
        timeframes={board.columns.map(c => ({ id: c.id, label: c.label }))}
        readOnly={readOnly}
      />
    </div>
  );
}
