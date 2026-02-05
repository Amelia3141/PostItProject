'use client';

import { useState, useMemo } from 'react';
import { Note, Connection, BoardColumn, BoardRow } from '@/types';
import {
  calculateDegreeCentrality,
  calculateBetweennessCentrality,
  calculateInDegreeCentrality,
  calculateOutDegreeCentrality,
  CentralityResult,
} from '@/lib/networkAnalysis';
import styles from './AILandscapeRoadmap.module.css';

interface AILandscapeRoadmapProps {
  notes: Note[];
  connections: Connection[];
  columns: BoardColumn[];
  rows: BoardRow[];
  title?: string;
  subtitle?: string;
  onNoteClick?: (note: Note) => void;
}

// Network analysis data for a single note
interface NetworkAnalysisData {
  degree: number;
  degreeRank: number;
  betweenness: number;
  betweennessRank: number;
  inDegree: number;
  outDegree: number;
  connectedNotes: string[];
}

export function AILandscapeRoadmap({
  notes,
  connections,
  columns,
  rows,
  title = 'AI Landscape',
  subtitle = 'Evidence-led technology signal based on human expertise and network science',
  onNoteClick,
}: AILandscapeRoadmapProps) {
  const [hoveredNote, setHoveredNote] = useState<Note | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // Pre-calculate all network analysis metrics
  const networkAnalysis = useMemo(() => {
    const degreeCentrality = calculateDegreeCentrality(notes, connections);
    const betweennessCentrality = calculateBetweennessCentrality(notes, connections);
    const inDegreeCentrality = calculateInDegreeCentrality(notes, connections);
    const outDegreeCentrality = calculateOutDegreeCentrality(notes, connections);

    const analysisMap = new Map<string, NetworkAnalysisData>();

    notes.forEach(note => {
      const degreeData = degreeCentrality.find(d => d.nodeId === note.id);
      const betweennessData = betweennessCentrality.find(d => d.nodeId === note.id);
      const inDegreeData = inDegreeCentrality.find(d => d.nodeId === note.id);
      const outDegreeData = outDegreeCentrality.find(d => d.nodeId === note.id);

      // Find connected notes
      const connectedIds = new Set<string>();
      connections.forEach(conn => {
        if (conn.sourceId === note.id) connectedIds.add(conn.targetId);
        if (conn.targetId === note.id) connectedIds.add(conn.sourceId);
      });
      const connectedNotes = Array.from(connectedIds)
        .map(id => notes.find(n => n.id === id)?.text || '')
        .filter(Boolean)
        .slice(0, 5);

      analysisMap.set(note.id, {
        degree: degreeData?.score || 0,
        degreeRank: degreeData?.rank || 0,
        betweenness: betweennessData?.score || 0,
        betweennessRank: betweennessData?.rank || 0,
        inDegree: inDegreeData?.score || 0,
        outDegree: outDegreeData?.score || 0,
        connectedNotes,
      });
    });

    return analysisMap;
  }, [notes, connections]);

  // Group notes by row (category) and column (timeframe)
  const notesByCell = useMemo(() => {
    const cellMap: Record<string, Note[]> = {};

    notes.forEach(note => {
      // Handle spanning notes
      if (note.spanColumns && note.spanColumns.length > 0) {
        // Put spanning notes in a special cell
        const key = `${note.category}-spanning`;
        if (!cellMap[key]) cellMap[key] = [];
        cellMap[key].push(note);
      } else {
        const key = `${note.category}-${note.timeframe}`;
        if (!cellMap[key]) cellMap[key] = [];
        cellMap[key].push(note);
      }
    });

    return cellMap;
  }, [notes]);

  // Calculate stats
  const stats = useMemo(() => ({
    totalIdeas: notes.length,
    totalVotes: notes.reduce((sum, n) => sum + (n.votes || 0), 0),
    contributors: new Set(notes.map(n => n.createdById).filter(Boolean)).size,
  }), [notes]);

  const handleMouseEnter = (note: Note, event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      x: rect.left + rect.width / 2,
      y: rect.top,
    });
    setHoveredNote(note);
  };

  const handleMouseLeave = () => {
    setHoveredNote(null);
  };

  // Get color intensity based on signal strength or votes
  const getNoteStyle = (note: Note, rowColour: string) => {
    const strength = note.signalStrength ?? (note.votes ? Math.min(1, note.votes / 10) : 0.5);
    const opacity = 0.6 + (strength * 0.4);

    // Check if this is a "top priority" note (has star/high votes)
    const isTopPriority = (note.votes || 0) >= 5 || note.tags?.includes('TOP PRIORITY');

    return {
      opacity,
      isTopPriority,
    };
  };

  const getRowColor = (colour: string) => {
    const colors: Record<string, { bg: string; border: string; text: string }> = {
      pink: { bg: 'rgba(255, 182, 193, 0.15)', border: '#ff6b9d', text: '#ffb6c1' },
      blue: { bg: 'rgba(100, 149, 237, 0.15)', border: '#6495ed', text: '#87ceeb' },
      yellow: { bg: 'rgba(255, 215, 0, 0.15)', border: '#ffd700', text: '#ffe066' },
      green: { bg: 'rgba(144, 238, 144, 0.15)', border: '#90ee90', text: '#98fb98' },
      purple: { bg: 'rgba(186, 85, 211, 0.15)', border: '#ba55d3', text: '#dda0dd' },
      orange: { bg: 'rgba(255, 165, 0, 0.15)', border: '#ffa500', text: '#ffcc80' },
    };
    return colors[colour] || colors.blue;
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerMeta}>
          <span className={styles.orgName}>SI UNITS • STRATEGIC FORESIGHT WORKSHOP • NOVEMBER 2025</span>
        </div>
        <div className={styles.headerContent}>
          <span className={styles.netintel}>NETINTEL view of AI future</span>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statNumber}>{stats.totalIdeas}</span>
            <span className={styles.statLabel}>ideas</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statNumber}>{stats.totalVotes}</span>
            <span className={styles.statLabel}>votes</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statNumber}>{stats.contributors}</span>
            <span className={styles.statLabel}>contributors</span>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <div className={styles.grid}>
        {/* Column Headers */}
        <div className={styles.columnHeaders}>
          <div className={styles.rowLabelSpace}></div>
          {columns.map((col) => (
            <div key={col.id} className={styles.columnHeader}>
              <span className={styles.columnLabel}>{col.label}</span>
            </div>
          ))}
        </div>

        {/* Rows */}
        {rows.map((row) => {
          const rowColors = getRowColor(row.colour);
          return (
            <div key={row.id} className={styles.row}>
              <div
                className={styles.rowLabel}
                style={{
                  backgroundColor: rowColors.bg,
                  borderColor: rowColors.border,
                  color: rowColors.text,
                }}
              >
                {row.label}
              </div>
              {columns.map((col) => {
                const cellNotes = notesByCell[`${row.id}-${col.id}`] || [];
                return (
                  <div key={col.id} className={styles.cell}>
                    {cellNotes.map((note) => {
                      const { opacity, isTopPriority } = getNoteStyle(note, row.colour);
                      const rowColors = getRowColor(row.colour);
                      return (
                        <div
                          key={note.id}
                          className={`${styles.noteCard} ${isTopPriority ? styles.topPriority : ''}`}
                          style={{
                            backgroundColor: rowColors.bg,
                            borderColor: rowColors.border,
                            opacity,
                          }}
                          onMouseEnter={(e) => handleMouseEnter(note, e)}
                          onMouseLeave={handleMouseLeave}
                          onClick={() => onNoteClick?.(note)}
                        >
                          {isTopPriority && <span className={styles.star}>★</span>}
                          <span className={styles.noteText}>{note.text}</span>
                          {(note.votes || 0) > 0 && (
                            <span className={styles.voteDots}>
                              {'•'.repeat(Math.min(note.votes || 0, 5))}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Tooltip with Network Analysis */}
      {hoveredNote && (
        <div
          className={styles.tooltip}
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y - 10,
          }}
        >
          <div className={styles.tooltipTitle}>{hoveredNote.text}</div>

          {networkAnalysis.has(hoveredNote.id) && (
            <div className={styles.tooltipContent}>
              <div className={styles.tooltipSection}>
                <h4>Network Analysis</h4>
                <div className={styles.tooltipGrid}>
                  <div className={styles.tooltipMetric}>
                    <span className={styles.metricLabel}>Degree Centrality</span>
                    <span className={styles.metricValue}>
                      {networkAnalysis.get(hoveredNote.id)?.degree || 0}
                      <span className={styles.metricRank}>
                        (#{networkAnalysis.get(hoveredNote.id)?.degreeRank || '-'})
                      </span>
                    </span>
                  </div>
                  <div className={styles.tooltipMetric}>
                    <span className={styles.metricLabel}>Betweenness</span>
                    <span className={styles.metricValue}>
                      {networkAnalysis.get(hoveredNote.id)?.betweenness.toFixed(2) || 0}
                      <span className={styles.metricRank}>
                        (#{networkAnalysis.get(hoveredNote.id)?.betweennessRank || '-'})
                      </span>
                    </span>
                  </div>
                  <div className={styles.tooltipMetric}>
                    <span className={styles.metricLabel}>In-Degree</span>
                    <span className={styles.metricValue}>
                      {networkAnalysis.get(hoveredNote.id)?.inDegree || 0}
                    </span>
                  </div>
                  <div className={styles.tooltipMetric}>
                    <span className={styles.metricLabel}>Out-Degree</span>
                    <span className={styles.metricValue}>
                      {networkAnalysis.get(hoveredNote.id)?.outDegree || 0}
                    </span>
                  </div>
                </div>
              </div>

              {networkAnalysis.get(hoveredNote.id)?.connectedNotes.length ? (
                <div className={styles.tooltipSection}>
                  <h4>Connected Ideas</h4>
                  <ul className={styles.connectedList}>
                    {networkAnalysis.get(hoveredNote.id)?.connectedNotes.map((text, i) => (
                      <li key={i}>{text.length > 40 ? text.slice(0, 40) + '...' : text}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {hoveredNote.paperTrends && (
                <div className={styles.tooltipSection}>
                  <h4>Paper Trends</h4>
                  <p>{hoveredNote.paperTrends}</p>
                </div>
              )}

              {hoveredNote.topInstitutions && hoveredNote.topInstitutions.length > 0 && (
                <div className={styles.tooltipSection}>
                  <h4>Top Institutions</h4>
                  <ul className={styles.institutionsList}>
                    {hoveredNote.topInstitutions.map((inst, i) => (
                      <li key={i}>{inst}</li>
                    ))}
                  </ul>
                </div>
              )}

              {hoveredNote.votes !== undefined && hoveredNote.votes > 0 && (
                <div className={styles.tooltipVotes}>
                  <span>{hoveredNote.votes} votes</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <footer className={styles.footer}>
        <span>AI Landscape Foresight Workshop • SI Units Ltd • November 2025</span>
        <span>{connections.length} participant-created connections shown</span>
      </footer>
    </div>
  );
}
