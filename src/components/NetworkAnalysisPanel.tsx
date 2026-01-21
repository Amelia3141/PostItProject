'use client';

import { useState, useMemo } from 'react';
import { Note, Connection } from '@/types';
import {
  analyzeNetwork,
  CentralityResult,
  PathResult,
  findShortestPath,
  exportToGraph,
} from '@/lib/networkAnalysis';
import styles from './NetworkAnalysisPanel.module.css';

interface NetworkAnalysisPanelProps {
  notes: Note[];
  connections: Connection[];
  onHighlightNode?: (nodeId: string | null) => void;
  onHighlightPath?: (path: string[] | null) => void;
  onVisualizationModeChange?: (mode: VisualizationMode) => void;
}

export type VisualizationMode = 'none' | 'degree' | 'betweenness' | 'in-degree' | 'out-degree';

export default function NetworkAnalysisPanel({
  notes,
  connections,
  onHighlightNode,
  onHighlightPath,
  onVisualizationModeChange,
}: NetworkAnalysisPanelProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'centrality' | 'paths' | 'export'>('overview');
  const [centralityType, setCentralityType] = useState<'degree' | 'betweenness' | 'in' | 'out'>('degree');
  const [pathFromId, setPathFromId] = useState<string>('');
  const [pathToId, setPathToId] = useState<string>('');
  const [pathResult, setPathResult] = useState<PathResult | null>(null);
  const [visualizationMode, setVisualizationMode] = useState<VisualizationMode>('none');

  const analysis = useMemo(() => {
    if (connections.length === 0) return null;
    return analyzeNetwork(notes, connections);
  }, [notes, connections]);

  const connectedNotes = useMemo(() => {
    const ids = new Set<string>();
    connections.forEach(c => {
      ids.add(c.sourceId);
      ids.add(c.targetId);
    });
    return notes.filter(n => ids.has(n.id));
  }, [notes, connections]);

  const handleVisualizationChange = (mode: VisualizationMode) => {
    setVisualizationMode(mode);
    onVisualizationModeChange?.(mode);
  };

  const handleFindPath = () => {
    if (!pathFromId || !pathToId) return;
    const result = findShortestPath(notes, connections, pathFromId, pathToId);
    setPathResult(result);
    if (result) {
      onHighlightPath?.(result.path);
    }
  };

  const handleClearPath = () => {
    setPathResult(null);
    onHighlightPath?.(null);
  };

  const handleExportGraph = () => {
    const graph = exportToGraph(notes, connections);
    const blob = new Blob([JSON.stringify(graph, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'network-graph.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getCentralityResults = (): CentralityResult[] => {
    if (!analysis) return [];
    switch (centralityType) {
      case 'degree': return analysis.degreeCentrality;
      case 'betweenness': return analysis.betweennessCentrality;
      case 'in': return analysis.inDegreeCentrality;
      case 'out': return analysis.outDegreeCentrality;
    }
  };

  if (connections.length === 0) {
    return (
      <div className={styles.panel}>
        <div className={styles.emptyState}>
          <p>No connections found.</p>
          <p className={styles.hint}>Create connections in Flow view to see network analysis.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'overview' ? styles.active : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'centrality' ? styles.active : ''}`}
          onClick={() => setActiveTab('centrality')}
        >
          Centrality
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'paths' ? styles.active : ''}`}
          onClick={() => setActiveTab('paths')}
        >
          Paths
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'export' ? styles.active : ''}`}
          onClick={() => setActiveTab('export')}
        >
          Export
        </button>
      </div>

      <div className={styles.content}>
        {activeTab === 'overview' && analysis && (
          <div className={styles.overview}>
            <div className={styles.statsGrid}>
              <div className={styles.stat}>
                <span className={styles.statValue}>{analysis.nodeCount}</span>
                <span className={styles.statLabel}>Connected Nodes</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statValue}>{analysis.edgeCount}</span>
                <span className={styles.statLabel}>Connections</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statValue}>{(analysis.density * 100).toFixed(1)}%</span>
                <span className={styles.statLabel}>Density</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statValue}>{analysis.longestPath?.length || 0}</span>
                <span className={styles.statLabel}>Longest Path</span>
              </div>
            </div>

            {analysis.longestPath && (
              <div className={styles.section}>
                <h4>Longest Path</h4>
                <div className={styles.pathDisplay}>
                  {analysis.longestPath.pathNotes.map((node, i) => (
                    <span key={node.id} className={styles.pathNode}>
                      <span
                        className={styles.pathNodeText}
                        onMouseEnter={() => onHighlightNode?.(node.id)}
                        onMouseLeave={() => onHighlightNode?.(null)}
                      >
                        {node.text.substring(0, 25)}{node.text.length > 25 ? '...' : ''}
                      </span>
                      {i < analysis.longestPath!.pathNotes.length - 1 && (
                        <span className={styles.pathArrow}>→</span>
                      )}
                    </span>
                  ))}
                </div>
                <button
                  className={styles.highlightBtn}
                  onClick={() => onHighlightPath?.(analysis.longestPath?.path || null)}
                >
                  Highlight Path
                </button>
              </div>
            )}

            <div className={styles.section}>
              <h4>Visualization Mode</h4>
              <div className={styles.vizModes}>
                <button
                  className={`${styles.vizBtn} ${visualizationMode === 'none' ? styles.active : ''}`}
                  onClick={() => handleVisualizationChange('none')}
                >
                  None
                </button>
                <button
                  className={`${styles.vizBtn} ${visualizationMode === 'degree' ? styles.active : ''}`}
                  onClick={() => handleVisualizationChange('degree')}
                >
                  Degree
                </button>
                <button
                  className={`${styles.vizBtn} ${visualizationMode === 'betweenness' ? styles.active : ''}`}
                  onClick={() => handleVisualizationChange('betweenness')}
                >
                  Betweenness
                </button>
                <button
                  className={`${styles.vizBtn} ${visualizationMode === 'in-degree' ? styles.active : ''}`}
                  onClick={() => handleVisualizationChange('in-degree')}
                >
                  In-Degree
                </button>
                <button
                  className={`${styles.vizBtn} ${visualizationMode === 'out-degree' ? styles.active : ''}`}
                  onClick={() => handleVisualizationChange('out-degree')}
                >
                  Out-Degree
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'centrality' && analysis && (
          <div className={styles.centrality}>
            <div className={styles.centralityTypeSelect}>
              <select
                value={centralityType}
                onChange={(e) => setCentralityType(e.target.value as any)}
                className={styles.select}
              >
                <option value="degree">Degree Centrality</option>
                <option value="betweenness">Betweenness Centrality</option>
                <option value="in">In-Degree (Dependencies)</option>
                <option value="out">Out-Degree (Dependents)</option>
              </select>
            </div>

            <div className={styles.centralityList}>
              {getCentralityResults().slice(0, 15).map((result) => (
                <div
                  key={result.nodeId}
                  className={styles.centralityItem}
                  onMouseEnter={() => onHighlightNode?.(result.nodeId)}
                  onMouseLeave={() => onHighlightNode?.(null)}
                >
                  <span className={styles.rank}>#{result.rank}</span>
                  <span className={styles.nodeText}>
                    {result.noteText.substring(0, 40)}{result.noteText.length > 40 ? '...' : ''}
                  </span>
                  <span className={styles.score}>{result.score.toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className={styles.centralityHelp}>
              {centralityType === 'degree' && (
                <p>Total connections (in + out). High values indicate well-connected nodes.</p>
              )}
              {centralityType === 'betweenness' && (
                <p>How often a node lies on shortest paths. High values indicate bridge nodes.</p>
              )}
              {centralityType === 'in' && (
                <p>Number of incoming connections. High values indicate dependencies.</p>
              )}
              {centralityType === 'out' && (
                <p>Number of outgoing connections. High values indicate enablers.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'paths' && (
          <div className={styles.paths}>
            <div className={styles.pathFinder}>
              <h4>Find Shortest Path</h4>
              <div className={styles.pathInputs}>
                <select
                  value={pathFromId}
                  onChange={(e) => setPathFromId(e.target.value)}
                  className={styles.select}
                >
                  <option value="">Select start node...</option>
                  {connectedNotes.map(note => (
                    <option key={note.id} value={note.id}>
                      {note.text.substring(0, 50)}{note.text.length > 50 ? '...' : ''}
                    </option>
                  ))}
                </select>
                <span className={styles.pathArrowInput}>→</span>
                <select
                  value={pathToId}
                  onChange={(e) => setPathToId(e.target.value)}
                  className={styles.select}
                >
                  <option value="">Select end node...</option>
                  {connectedNotes.map(note => (
                    <option key={note.id} value={note.id}>
                      {note.text.substring(0, 50)}{note.text.length > 50 ? '...' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.pathActions}>
                <button
                  className={styles.findPathBtn}
                  onClick={handleFindPath}
                  disabled={!pathFromId || !pathToId}
                >
                  Find Path
                </button>
                {pathResult && (
                  <button className={styles.clearPathBtn} onClick={handleClearPath}>
                    Clear
                  </button>
                )}
              </div>
            </div>

            {pathResult && (
              <div className={styles.pathResultSection}>
                <h4>Path Found (Length: {pathResult.length})</h4>
                <div className={styles.pathDisplay}>
                  {pathResult.pathNotes.map((node, i) => (
                    <span key={node.id} className={styles.pathNode}>
                      <span
                        className={styles.pathNodeText}
                        onMouseEnter={() => onHighlightNode?.(node.id)}
                        onMouseLeave={() => onHighlightNode?.(null)}
                      >
                        {node.text.substring(0, 25)}{node.text.length > 25 ? '...' : ''}
                      </span>
                      {i < pathResult.pathNotes.length - 1 && (
                        <span className={styles.pathArrow}>→</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {pathResult === null && pathFromId && pathToId && (
              <div className={styles.noPath}>
                <p>No path found between selected nodes.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'export' && (
          <div className={styles.export}>
            <h4>Export Graph Data</h4>
            <p className={styles.exportDesc}>
              Export the network graph in a standardized format for use with external analysis tools.
            </p>
            <div className={styles.exportFormat}>
              <h5>Format Preview:</h5>
              <pre className={styles.formatPreview}>
{`{
  "nodes": [
    { "id", "label", "category",
      "timeHorizon", "votes", "metadata" }
  ],
  "edges": [
    { "source", "target",
      "weight", "type" }
  ]
}`}
              </pre>
            </div>
            <button className={styles.exportBtn} onClick={handleExportGraph}>
              Download Graph JSON
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
