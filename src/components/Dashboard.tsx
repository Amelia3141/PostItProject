'use client';

import { useState, useRef, useCallback } from 'react';
import { Note, Category, Timeframe, ViewMode, FilterState, Board } from '@/types';
import { useNotes, useConnections, useFilteredNotes, useStats } from '@/lib/hooks';
import { useUser } from '@/lib/userContext';
import { logActivity } from '@/lib/activityDb';
import { NoteCard } from './NoteCard';
import { NoteModal } from './NoteModal';
import { QuickAddNote } from './QuickAddNote';
import { PresenceAvatars } from './PresenceAvatars';
import { ActivityFeed } from './ActivityFeed';
import { AIAnalysis } from './AIAnalysis';
import { ToastProvider, useToast } from './Toast';
import { ShortcutsModal } from './KeyboardShortcuts';
import { exportToJSON, exportToCSV, exportToPDF, exportToPPTX, exportToAIPDF, importFromJSON } from '@/lib/export';
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { DraggableNoteCard } from './DraggableNoteCard';
import { DroppableCell } from './DroppableCell';
import { FlowView } from './FlowView';
import NetworkAnalysisPanel, { VisualizationMode } from './NetworkAnalysisPanel';
import { OnboardingTutorial } from './OnboardingTutorial';
import { calculateDensity, getColor, getCellDensity, getGapSummary, DensityMethod, ColorScheme, DensityCell } from '@/lib/density';
import styles from '@/app/Dashboard.module.css';

interface DashboardProps {
  board: Board;
  readOnly?: boolean;
  showShortcuts?: boolean;
  showTutorial?: boolean;
  onCloseShortcuts?: () => void;
  onCloseTutorial?: () => void;
}

function getRotation(id: string): number {
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return ((hash % 13) - 6) * 0.1;
}

type SortOption = 'newest' | 'oldest' | 'mostVotes' | 'leastVotes' | 'alphabetical';

export function Dashboard({ board, readOnly = false, showShortcuts = false, showTutorial = false, onCloseShortcuts, onCloseTutorial }: DashboardProps) {
  const { notes, loading, addNote, editNote, removeNote, vote, undo, canUndo, restoreVersion, authors } = useNotes(board.id);
  const { connections, addConnection, removeConnection } = useConnections(board.id);
  const { user } = useUser();
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );
  
  const [viewMode, setViewMode] = useState<ViewMode>('board');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [minVotes, setMinVotes] = useState<number>(0);
  const [collapsedRows, setCollapsedRows] = useState<Set<string>>(new Set());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);
  const [showNetworkAnalysis, setShowNetworkAnalysis] = useState(false);
  const [highlightedNodeId, setHighlightedNodeId] = useState<string | null>(null);
  const [highlightedPath, setHighlightedPath] = useState<string[] | null>(null);
  const [visualizationMode, setVisualizationMode] = useState<VisualizationMode>('none');
  const [selectedNotes, setSelectedNotes] = useState<Set<string>>(new Set());
  const [bulkMode, setBulkMode] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [densityMethod, setDensityMethod] = useState<DensityMethod>('grid');
  const [colorScheme, setColorScheme] = useState<ColorScheme>('heat');
  const [showDensitySettings, setShowDensitySettings] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const flowViewRef = useRef<HTMLDivElement>(null);
  const [filters, setFilters] = useState<FilterState>({
    timeframe: 'all',
    category: 'all',
    searchQuery: '',
    showConnections: false,
    authorId: undefined,
  });

  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Import handler
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      const importedNotes = await importFromJSON(file);
      let count = 0;
      for (const noteData of importedNotes) {
        if (noteData.text) {
          await addNote({
            text: noteData.text,
            category: (noteData.category as Category) || board.rows[0]?.id as Category,
            timeframe: (noteData.timeframe as Timeframe) || board.columns[0]?.id as Timeframe,
            votes: noteData.votes || 0,
            tags: noteData.tags || [],
            connections: [],
          });
          count++;
        }
      }
      alert(`Imported ${count} notes successfully!`);
    } catch (err) {
      alert('Failed to import: ' + (err as Error).message);
    }
    e.target.value = '';
  };

  // Bulk delete handler
  const handleBulkDelete = async () => {
    if (!user || selectedNotes.size === 0) return;
    if (!confirm(`Delete ${selectedNotes.size} selected notes?`)) return;

    const noteIds = Array.from(selectedNotes);
    for (let i = 0; i < noteIds.length; i++) {
      await removeNote(noteIds[i]);
    }
    setSelectedNotes(new Set());
    setBulkMode(false);
  };

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
    if (readOnly || !user) return;
    const newNote = await addNote({
      text,
      category,
      timeframe,
      votes: 0,
      tags: [],
      connections: [],
    });
    await logActivity(board.id, 'note_created', user.id, user.name, user.colour, newNote?.id, text);
  };

  const handleSaveNote = async (data: Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'boardId'>) => {
    if (readOnly || !user) return;
    if (selectedNote) {
      await editNote(selectedNote.id, data);
      await logActivity(board.id, 'note_edited', user.id, user.name, user.colour, selectedNote.id, data.text);
    } else {
      const newNote = await addNote(data);
      await logActivity(board.id, 'note_created', user.id, user.name, user.colour, newNote?.id, data.text);
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (readOnly || !user) return;
    const note = notes.find(n => n.id === id);
    await removeNote(id);
    await logActivity(board.id, 'note_deleted', user.id, user.name, user.colour, id, note?.text);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    if (readOnly || !user) return;
    const { active, over } = event;
    if (!over) return;
    
    const noteId = active.id as string;
    const targetId = over.id as string;
    
    const targetRow = board.rows.find(r => targetId.startsWith(r.id + '-'));
    const targetCol = board.columns.find(c => targetId.endsWith('-' + c.id));
    
    if (!targetRow || !targetCol) return;
    
    const newCategory = targetRow.id as Category;
    const newTimeframe = targetCol.id as Timeframe;
    
    const note = notes.find(n => n.id === noteId);
    if (note && (note.category !== newCategory || note.timeframe !== newTimeframe)) {
      await editNote(noteId, { category: newCategory, timeframe: newTimeframe });
      const fromRow = board.rows.find(r => r.id === note.category)?.label || note.category;
      const toRow = board.rows.find(r => r.id === newCategory)?.label || newCategory;
      const fromCol = board.columns.find(c => c.id === note.timeframe)?.label || note.timeframe;
      const toCol = board.columns.find(c => c.id === newTimeframe)?.label || newTimeframe;
      await logActivity(board.id, 'note_moved', user.id, user.name, user.colour, noteId, note.text, `${fromRow}/${fromCol} → ${toRow}/${toCol}`);
    }
  };

  const handleVote = async (id: string, increment: number) => {
    if (readOnly || !user) return;
    await vote(id, increment);
    const note = notes.find(n => n.id === id);
    await logActivity(board.id, 'vote', user.id, user.name, user.colour, id, note?.text, increment > 0 ? '+1' : '-1');
  };

  const handleConnect = async (sourceId: string, targetId: string) => {
    if (readOnly || !user) return;
    await addConnection(sourceId, targetId);
    const sourceNote = notes.find(n => n.id === sourceId);
    const targetNote = notes.find(n => n.id === targetId);
    await logActivity(board.id, 'connection_created', user.id, user.name, user.colour, undefined, undefined, `"${sourceNote?.text?.substring(0, 20)}..." → "${targetNote?.text?.substring(0, 20)}..."`);
  };

  const handleDeleteConnection = async (connectionId: string) => {
    if (readOnly || !user) return;
    const connection = connections.find(c => c.id === connectionId);
    if (connection) {
      const sourceNote = notes.find(n => n.id === connection.sourceId);
      const targetNote = notes.find(n => n.id === connection.targetId);
      await removeConnection(connectionId);
      await logActivity(board.id, 'connection_deleted', user.id, user.name, user.colour, undefined, undefined, `"${sourceNote?.text?.substring(0, 20)}..." → "${targetNote?.text?.substring(0, 20)}..."`);
    }
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

  // Calculate density cells using the selected method
  const densityCells = showHeatmap
    ? calculateDensity(processedNotes, board, { method: densityMethod, colorScheme })
    : [];

  // Get heatmap color for a cell
  const getHeatmapColor = (rowId: string, colId: string): string | undefined => {
    if (!showHeatmap) return undefined;

    const cell = getCellDensity(densityCells, rowId, colId);
    if (!cell) return undefined;

    return getColor(cell.normalised, colorScheme, densityMethod === 'gaps');
  };

  // Get gap summary for display
  const gapSummary = showHeatmap && densityMethod === 'gaps'
    ? getGapSummary(densityCells, board)
    : null;

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  const flowViewContent = (
    <div ref={flowViewRef}>
      <FlowView
        notes={processedNotes}
        connections={connections}
        columns={board.columns}
        rows={board.rows}
        onNoteClick={handleNoteClick}
        onConnect={handleConnect}
        onDeleteConnection={handleDeleteConnection}
        highlightedNodeId={highlightedNodeId}
        highlightedPath={highlightedPath}
        visualizationMode={visualizationMode}
      />
    </div>
  );

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerTopBar}>
          <PresenceAvatars boardId={board.id} />
          {user && (
            <div className={styles.userBadge} style={{ backgroundColor: user.colour }}>
              {user.name}
            </div>
          )}
        </div>
        <div className={styles.headerTitle}>
          <h1 className={styles.title}>{board.name}</h1>
          {board.description && (
            <p className={styles.subtitle}>{board.description}</p>
          )}
        </div>
        {readOnly && (
          <div className={styles.readOnlyBanner}>
            View only mode - you cannot make changes
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

      <ActivityFeed boardId={board.id} />

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

        {viewMode === 'board' && (
          <div className={styles.heatmapControls}>
            <button
              className={`${styles.filterBtn} ${showHeatmap ? styles.active : ''}`}
              onClick={() => setShowHeatmap(!showHeatmap)}
              title="Toggle heatmap visualization"
            >
              {showHeatmap ? 'Heatmap On' : 'Heatmap'}
            </button>
            {showHeatmap && (
              <>
                <select
                  className={styles.sortSelect}
                  value={densityMethod}
                  onChange={(e) => setDensityMethod(e.target.value as DensityMethod)}
                  title="Density calculation method"
                >
                  <option value="grid">Grid Count</option>
                  <option value="kde">KDE (Smooth)</option>
                  <option value="structured">Structured</option>
                  <option value="votes">Vote Weighted</option>
                  <option value="gaps">Gap Analysis</option>
                </select>
                <select
                  className={styles.sortSelect}
                  value={colorScheme}
                  onChange={(e) => setColorScheme(e.target.value as ColorScheme)}
                  title="Color scheme"
                >
                  <option value="heat">Heat (G→Y→R)</option>
                  <option value="viridis">Viridis</option>
                  <option value="blues">Blues</option>
                  <option value="greens">Greens</option>
                  <option value="diverging">Diverging</option>
                </select>
              </>
            )}
          </div>
        )}

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
              Undo
            </button>

            <button className={styles.addNoteBtn} onClick={handleAddNote}>
              + Add Note
            </button>
          </>
        )}
        
        <button
          className={styles.aiBtn}
          onClick={() => setShowAIAnalysis(true)}
        >
          AI Analysis
        </button>

        <div className={styles.exportGroup}>
          <button className={styles.filterBtn} onClick={() => exportToJSON(notes)}>JSON</button>
          <button className={styles.filterBtn} onClick={() => exportToCSV(notes)}>CSV</button>
          <button className={styles.filterBtn} onClick={() => exportToPDF(notes, board.name, board, connections, flowViewRef.current)}>PDF</button>
          <button className={styles.filterBtn} onClick={() => exportToPPTX(notes, board)}>PPTX</button>
          <button
            className={styles.aiBtn}
            onClick={async () => {
              try {
                await exportToAIPDF(notes, board, connections, flowViewRef.current);
              } catch (err: any) {
                alert('AI PDF export failed: ' + err.message);
              }
            }}
            title="Generate AI-enhanced strategic report"
          >
            AI Report
          </button>
          {!readOnly && (
            <>
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                style={{ display: 'none' }}
                id="import-json"
              />
              <label htmlFor="import-json" className={styles.filterBtn} style={{ cursor: 'pointer' }}>
                Import
              </label>
            </>
          )}
        </div>

        {viewMode === 'flow' && (
          <>
            <button
              className={`${styles.filterBtn} ${showNetworkAnalysis ? styles.active : ''}`}
              onClick={() => setShowNetworkAnalysis(!showNetworkAnalysis)}
              title="Network Analysis"
            >
              Network
            </button>
            <button
              className={styles.filterBtn}
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? 'Exit' : 'Fullscreen'}
            </button>
          </>
        )}
      </div>

      {viewMode === 'board' && (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className={`${styles.board} ${styles.fadeIn}`}>
            <div className={styles.boardHeader} style={{ gridTemplateColumns: `180px repeat(${board.columns.length}, 1fr)` }}>
              <div className={styles.boardRowLabel}></div>
              {board.columns.map((col) => (
                <div key={col.id} className={`${styles.timeframeHeader} ${col.colour ? styles[col.colour] : ''}`}>{col.label}</div>
              ))}
            </div>

            {board.rows.map((row) => (
              <div 
                key={row.id} 
                className={styles.boardRow}
                style={{ 
                  gridTemplateColumns: `180px repeat(${board.columns.length}, 1fr)`,
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
                  <DroppableCell key={col.id} category={row.id as Category} timeframe={col.id as Timeframe} heatmapColor={getHeatmapColor(row.id, col.id)}>
                    {getNotesByCell(row.id, col.id).map((note) => (
                      <DraggableNoteCard
                        key={note.id}
                        note={note}
                        onClick={() => handleNoteClick(note)}
                        onVote={handleVote}
                        rotation={getRotation(note.id)}
                        rowColour={row.colour}
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
              Exit Fullscreen
            </button>
            {flowViewContent}
          </div>
        ) : (
          <div className={styles.flowContainer}>
            <div className={styles.flowMain}>
              {flowViewContent}
            </div>
            {showNetworkAnalysis && (
              <div className={styles.networkAnalysisSidebar}>
                <NetworkAnalysisPanel
                  notes={notes}
                  connections={connections}
                  onHighlightNode={setHighlightedNodeId}
                  onHighlightPath={setHighlightedPath}
                  onVisualizationModeChange={setVisualizationMode}
                />
              </div>
            )}
          </div>
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
        onDelete={handleDeleteNote}
        onVote={handleVote}
        onRestoreVersion={restoreVersion}
        categories={board.rows.map(r => ({ id: r.id, label: r.label }))}
        timeframes={board.columns.map(c => ({ id: c.id, label: c.label }))}
        readOnly={readOnly}
        boardId={board.id}
        authors={authors}
      />

      <AIAnalysis
        board={board}
        notes={notes}
        isOpen={showAIAnalysis}
        onClose={() => setShowAIAnalysis(false)}
      />

      <ShortcutsModal
        isOpen={showShortcuts}
        onClose={() => onCloseShortcuts?.()}
      />

      {bulkMode && selectedNotes.size > 0 && (
        <div className={styles.bulkActions}>
          <span>{selectedNotes.size} selected</span>
          <button onClick={handleBulkDelete} className={styles.bulkDeleteBtn}>
            Delete Selected
          </button>
          <button onClick={() => { setSelectedNotes(new Set()); setBulkMode(false); }}>
            Cancel
          </button>
        </div>
      )}

      {!readOnly && (
        <OnboardingTutorial
          forceShow={showTutorial}
          onComplete={() => onCloseTutorial?.()}
        />
      )}
    </div>
  );
}
