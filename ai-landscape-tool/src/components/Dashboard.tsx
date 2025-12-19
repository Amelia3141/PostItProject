'use client';

import { useState, useEffect } from 'react';
import { Note, Category, Timeframe, ViewMode, FilterState } from '@/types';
import { categoryConfig, timeframeConfig } from '@/data/seed';
import { useNotes, useConnections, useFilteredNotes, useStats } from '@/lib/hooks';
import { useUser } from '@/lib/userContext';
import { NoteCard } from './NoteCard';
import { NoteModal } from './NoteModal';
import { exportToJSON, exportToCSV, exportToPDF } from '@/lib/export';
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { DraggableNoteCard } from './DraggableNoteCard';
import { DroppableCell } from './DroppableCell';
import { FlowView } from './FlowView';
import styles from '@/app/Dashboard.module.css';

function getRotation(id: string): number {
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return ((hash % 13) - 6) * 0.1;
}

type SortOption = 'newest' | 'oldest' | 'mostVotes' | 'leastVotes' | 'alphabetical';

export function Dashboard() {
  const { notes, loading, addNote, editNote, removeNote, vote, seed, undo, canUndo, restoreVersion, authors } = useNotes();
  const { connections, addConnection, removeConnection } = useConnections();
  const { user, isNameSet } = useUser();
  
  const [viewMode, setViewMode] = useState<ViewMode>('board');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [minVotes, setMinVotes] = useState<number>(0);
  const [collapsedRows, setCollapsedRows] = useState<Set<Category>>(new Set());
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
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);

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

  const noteCounts = {
    all: filteredNotes.length,
    opportunities: notes.filter(n => n.category === 'opportunities').length,
    enablers: notes.filter(n => n.category === 'enablers').length,
    actors: notes.filter(n => n.category === 'actors').length,
  };

  useEffect(() => {
    if (!loading && notes.length === 0) {
      seed();
    }
  }, [loading, notes.length, seed]);

  const handleNoteClick = (note: Note) => {
    if (connectingFrom) {
      if (connectingFrom !== note.id) {
        addConnection(connectingFrom, note.id);
      }
      setConnectingFrom(null);
    } else {
      setSelectedNote(note);
      setIsModalOpen(true);
    }
  };

  const handleAddNote = () => {
    setSelectedNote(null);
    setIsModalOpen(true);
  };

  const handleSaveNote = async (data: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (selectedNote) {
      await editNote(selectedNote.id, data);
    } else {
      await addNote(data);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    
    const noteId = active.id as string;
    const [newCategory, newTimeframe] = (over.id as string).split('-') as [Category, Timeframe];
    
    const note = notes.find(n => n.id === noteId);
    if (note && (note.category !== newCategory || note.timeframe !== newTimeframe)) {
      await editNote(noteId, { category: newCategory, timeframe: newTimeframe });
    }
  };

  const toggleRowCollapse = (category: Category) => {
    setCollapsedRows(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const getNotesByCell = (category: Category, timeframe: Timeframe) => {
    return processedNotes.filter(
      (note) => note.category === category && note.timeframe === timeframe
    );
  };

  if (!isNameSet) {
    return null; // NamePrompt will show
  }

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  const flowViewContent = (
    <FlowView
      notes={processedNotes}
      connections={connections}
      onNoteClick={handleNoteClick}
      onConnect={addConnection}
    />
  );

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>AI Landscape</h1>
        <p className={styles.subtitle}>
          Mapping the future of artificial intelligence across opportunities,
          enabling technologies, and key actors
        </p>
        {user && (
          <div className={styles.userBadge} style={{ backgroundColor: user.colour }}>
            {user.name}
          </div>
        )}
      </header>

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

      <div className={styles.topVoted}>
        <div className={styles.topVotedHeader}>
          <span className={styles.trophyIcon}>🏆</span>
          <h2>Top Voted Ideas</h2>
        </div>
        <div className={styles.topVotedList}>
          {stats.topVoted.map((note, index) => {
            const category = note.category || 'opportunities';
            const colour = categoryConfig[category]?.colour || 'pink';
            return (
              <div
                key={note.id}
                className={`${styles.topVotedItem} ${styles[colour]}`}
              >
                <div className={styles.topVotedRank}>#{index + 1}</div>
                <div className={styles.topVotedContent}>
                  <p className={styles.topVotedText}>{note.text}</p>
                  <div className={styles.topVotedMeta}>
                    <span className={styles.topVotedCategory}>{category}</span>
                    <span className={styles.topVotedTime}>
                      {timeframeConfig[note.timeframe]?.label || note.timeframe}
                    </span>
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

        <div className={styles.filterGroup}>
          <button
            className={`${styles.filterBtn} ${filters.timeframe === 'all' ? styles.active : ''}`}
            onClick={() => setFilters((f) => ({ ...f, timeframe: 'all' }))}
          >
            All Times
          </button>
          {Object.entries(timeframeConfig)
            .filter(([key]) => key !== 'foundational')
            .map(([key, config]) => (
              <button
                key={key}
                className={`${styles.filterBtn} ${filters.timeframe === key ? styles.active : ''}`}
                onClick={() => setFilters((f) => ({ ...f, timeframe: key as Timeframe }))}
              >
                {config.label}
              </button>
            ))}
        </div>

        <div className={styles.filterGroup}>
          <button
            className={`${styles.filterBtn} ${filters.category === 'all' ? styles.active : ''}`}
            onClick={() => setFilters((f) => ({ ...f, category: 'all' }))}
          >
            All ({noteCounts.all})
          </button>
          {Object.entries(categoryConfig).map(([key, config]) => (
            <button
              key={key}
              className={`${styles.filterBtn} ${filters.category === key ? styles.active : ''}`}
              onClick={() => setFilters((f) => ({ ...f, category: key as Category }))}
            >
              {config.label} ({noteCounts[key as Category]})
            </button>
          ))}
        </div>

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
            <div className={styles.boardHeader}>
              <div className={styles.boardRowLabel}></div>
              <div className={styles.timeframeHeader}>Next 10 months</div>
              <div className={styles.timeframeHeader}>3 years</div>
              <div className={styles.timeframeHeader}>10 years</div>
            </div>

            {(['opportunities', 'enablers', 'actors'] as Category[]).map((category) => (
              <div key={category} className={`${styles.boardRow} ${styles[category + 'Row']}`}>
                <div className={styles.boardRowLabel}>
                  <button 
                    className={styles.collapseBtn}
                    onClick={() => toggleRowCollapse(category)}
                  >
                    {collapsedRows.has(category) ? '▶' : '▼'}
                  </button>
                  <div className={`${styles.categoryBadge} ${styles[categoryConfig[category].colour]}`}>
                    {categoryConfig[category].label}
                  </div>
                </div>
                {!collapsedRows.has(category) && (['10months', '3years', '10years'] as Timeframe[]).map((tf) => (
                  <DroppableCell key={tf} category={category} timeframe={tf}>
                    {getNotesByCell(category, tf).map((note) => (
                      <DraggableNoteCard
                        key={note.id}
                        note={note}
                        onClick={() => handleNoteClick(note)}
                        onVote={vote}
                        rotation={getRotation(note.id)}
                      />
                    ))}
                  </DroppableCell>
                ))}
                {collapsedRows.has(category) && (
                  <div className={styles.collapsedRow}>
                    {processedNotes.filter(n => n.category === category).length} notes hidden
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
              onVote={vote}
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
        onDelete={removeNote}
        onVote={vote}
        onRestoreVersion={restoreVersion}
      />
    </div>
  );
}
