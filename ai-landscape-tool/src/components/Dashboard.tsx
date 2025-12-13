'use client';

import { useState, useEffect } from 'react';
import { Note, Category, Timeframe, ViewMode, FilterState } from '@/types';
import { categoryConfig, timeframeConfig } from '@/data/seed';
import { useNotes, useConnections, useFilteredNotes, useStats } from '@/lib/hooks';
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

export function Dashboard() {
  const { notes, loading, addNote, editNote, removeNote, vote, seed } = useNotes();
  const { connections, addConnection, removeConnection } = useConnections();
  
  const [viewMode, setViewMode] = useState<ViewMode>('board');
  const [filters, setFilters] = useState<FilterState>({
    timeframe: 'all',
    category: 'all',
    searchQuery: '',
    showConnections: false,
  });
  
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);

  const filteredNotes = useFilteredNotes(notes, filters);
  const stats = useStats(notes);

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

  const getNotesByCell = (category: Category, timeframe: Timeframe) => {
    return filteredNotes.filter(
      (note) => note.category === category && note.timeframe === timeframe
    );
  };

  const getFoundationalNotes = () => {
    return filteredNotes.filter((note) => note.timeframe === 'foundational');
  };

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>AI Landscape</h1>
        <p className={styles.subtitle}>
          Mapping the future of artificial intelligence across opportunities,
          enabling technologies, and key actors
        </p>
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
            All Categories
          </button>
          {Object.entries(categoryConfig).map(([key, config]) => (
            <button
              key={key}
              className={`${styles.filterBtn} ${filters.category === key ? styles.active : ''}`}
              onClick={() => setFilters((f) => ({ ...f, category: key as Category }))}
            >
              {config.label}
            </button>
          ))}
        </div>

        <button className={styles.addNoteBtn} onClick={handleAddNote}>
          + Add Note
        </button>
        <button className={styles.filterBtn} onClick={() => exportToJSON(notes)}>JSON</button>
        <button className={styles.filterBtn} onClick={() => exportToCSV(notes)}>CSV</button>
        <button className={styles.filterBtn} onClick={() => exportToPDF(notes)}>PDF</button>
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

            <div className={`${styles.boardRow} ${styles.pinkRow}`}>
              <div className={styles.boardRowLabel}>
                <div className={`${styles.categoryBadge} ${styles.pink}`}>Opportunities</div>
              </div>
              {(['10months', '3years', '10years'] as Timeframe[]).map((tf) => (
                <DroppableCell key={tf} category="opportunities" timeframe={tf}>
                  {getNotesByCell('opportunities', tf).map((note) => (
                    <DraggableNoteCard
                      key={note.id}
                      note={note}
                      onClick={() => handleNoteClick(note)}
                      rotation={getRotation(note.id)}
                    />
                  ))}
                </DroppableCell>
              ))}
            </div>

            <div className={`${styles.boardRow} ${styles.blueRow}`}>
              <div className={styles.boardRowLabel}>
                <div className={`${styles.categoryBadge} ${styles.blue}`}>Enablers</div>
              </div>
              {(['10months', '3years', '10years'] as Timeframe[]).map((tf) => (
                <DroppableCell key={tf} category="enablers" timeframe={tf}>
                  {getNotesByCell('enablers', tf).map((note) => (
                    <DraggableNoteCard
                      key={note.id}
                      note={note}
                      onClick={() => handleNoteClick(note)}
                      rotation={getRotation(note.id)}
                    />
                  ))}
                </DroppableCell>
              ))}
            </div>

            <div className={`${styles.boardRow} ${styles.yellowRow}`}>
              <div className={styles.boardRowLabel}>
                <div className={`${styles.categoryBadge} ${styles.yellow}`}>Actors</div>
              </div>
              {(['10months', '3years', '10years'] as Timeframe[]).map((tf) => (
                <DroppableCell key={tf} category="actors" timeframe={tf}>
                  {getNotesByCell('actors', tf).map((note) => (
                    <DraggableNoteCard
                      key={note.id}
                      note={note}
                      onClick={() => handleNoteClick(note)}
                      rotation={getRotation(note.id)}
                    />
                  ))}
                </DroppableCell>
              ))}
            </div>
          </div>
        </DndContext>
      )}

      {viewMode === 'grid' && (
        <div className={styles.gridView}>
          {filteredNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onClick={() => handleNoteClick(note)}
              rotation={getRotation(note.id)}
            />
          ))}
        </div>
      )}

      {viewMode === 'flow' && (
        <FlowView
          notes={filteredNotes}
          connections={connections}
          onNoteClick={handleNoteClick}
          onConnect={addConnection}
        />
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
      />
    </div>
  );
}
