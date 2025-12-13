'use client';

import { useCallback, useMemo, useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection as FlowConnection,
  MarkerType,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Note, Connection, Category, Timeframe } from '@/types';

interface FlowViewProps {
  notes: Note[];
  connections: Connection[];
  onNoteClick: (note: Note) => void;
  onConnect: (sourceId: string, targetId: string) => void;
}

const categoryColors: Record<Category, string> = {
  opportunities: '#ffb3ba',
  enablers: '#bae1ff',
  actors: '#ffffba',
};

const categoryLabels: Record<Category, string> = {
  opportunities: '🎯 Opportunities',
  enablers: '⚙️ Enablers',
  actors: '👥 Actors',
};

const timeframeLabels: Record<Timeframe, string> = {
  '10months': '10 Months',
  '3years': '3 Years',
  '10years': '10 Years',
  'foundational': 'Foundational',
};

const timeframeOrder: Timeframe[] = ['10months', '3years', '10years', 'foundational'];
const categoryOrder: Category[] = ['opportunities', 'enablers', 'actors'];

export function FlowView({ notes, connections, onNoteClick, onConnect }: FlowViewProps) {
  const [connectMode, setConnectMode] = useState(false);
  const [connectSource, setConnectSource] = useState<string | null>(null);

  const initialNodes: Node[] = useMemo(() => {
    const nodes: Node[] = [];
    const cellCounts: Record<string, number> = {};
    
    const colWidth = 300;
    const rowHeight = 300;
    const nodeWidth = 160;
    const nodeHeight = 80;
    const padding = 20;
    
    // Add column headers
    timeframeOrder.forEach((tf, colIndex) => {
      nodes.push({
        id: `header-${tf}`,
        position: { x: 150 + colIndex * colWidth, y: 0 },
        data: { label: timeframeLabels[tf] },
        style: {
          background: '#667eea',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          padding: '10px 20px',
          fontSize: '14px',
          fontWeight: 'bold',
          width: 120,
          textAlign: 'center',
        },
        draggable: false,
        selectable: false,
      });
    });

    // Add row labels
    categoryOrder.forEach((cat, rowIndex) => {
      nodes.push({
        id: `label-${cat}`,
        position: { x: 0, y: 80 + rowIndex * rowHeight },
        data: { label: categoryLabels[cat] },
        style: {
          background: categoryColors[cat],
          border: '2px solid #333',
          borderRadius: '8px',
          padding: '10px',
          fontSize: '12px',
          fontWeight: 'bold',
          width: 120,
          textAlign: 'center',
        },
        draggable: false,
        selectable: false,
      });
    });

    // Add note nodes
    notes.forEach((note) => {
      const colIndex = timeframeOrder.indexOf(note.timeframe);
      const rowIndex = categoryOrder.indexOf(note.category);
      
      if (colIndex === -1 || rowIndex === -1) return;
      
      const cellKey = `${note.category}-${note.timeframe}`;
      cellCounts[cellKey] = (cellCounts[cellKey] || 0);
      const offset = cellCounts[cellKey];
      cellCounts[cellKey]++;
      
      const col = offset % 2;
      const row = Math.floor(offset / 2);
      
      const x = 150 + colIndex * colWidth + col * (nodeWidth + padding);
      const y = 80 + rowIndex * rowHeight + row * (nodeHeight + padding);

      nodes.push({
        id: note.id,
        position: { x, y },
        data: { 
          label: note.text.length > 40 ? note.text.substring(0, 40) + '...' : note.text,
          note,
          votes: note.votes || 0,
        },
        style: {
          background: categoryColors[note.category],
          border: connectSource === note.id ? '3px solid #667eea' : '1px solid #333',
          borderRadius: '8px',
          padding: '8px',
          fontSize: '11px',
          width: nodeWidth,
          cursor: 'pointer',
          boxShadow: connectSource === note.id ? '0 0 10px rgba(102, 126, 234, 0.5)' : 'none',
        },
      });
    });

    return nodes;
  }, [notes, connectSource]);

  const initialEdges: Edge[] = useMemo(() => {
    return connections.map((conn) => ({
      id: conn.id,
      source: conn.sourceId,
      target: conn.targetId,
      label: conn.label,
      style: { stroke: '#667eea', strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#667eea' },
      animated: true,
    }));
  }, [connections]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onNodeClick = useCallback((_: any, node: Node) => {
    // Ignore header/label clicks
    if (node.id.startsWith('header-') || node.id.startsWith('label-')) return;
    
    if (connectMode) {
      if (!connectSource) {
        setConnectSource(node.id);
      } else if (connectSource !== node.id) {
        onConnect(connectSource, node.id);
        setConnectSource(null);
        setConnectMode(false);
      }
    } else if (node.data.note) {
      onNoteClick(node.data.note);
    }
  }, [connectMode, connectSource, onNoteClick, onConnect]);

  const handleConnectMode = () => {
    setConnectMode(!connectMode);
    setConnectSource(null);
  };

  return (
    <div style={{ width: '100%', height: '700px', background: 'white', borderRadius: '12px' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        fitView
        fitViewOptions={{ padding: 0.2 }}
      >
        <Background />
        <Controls />
        <Panel position="top-right">
          <button
            onClick={handleConnectMode}
            style={{
              padding: '8px 16px',
              background: connectMode ? '#667eea' : 'white',
              color: connectMode ? 'white' : '#333',
              border: '2px solid #667eea',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              marginRight: '8px',
            }}
          >
            {connectMode 
              ? connectSource 
                ? '🔗 Click target node...' 
                : '🔗 Click source node...'
              : '🔗 Connect Notes'}
          </button>
          {connectMode && (
            <button
              onClick={() => { setConnectMode(false); setConnectSource(null); }}
              style={{
                padding: '8px 16px',
                background: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          )}
        </Panel>
      </ReactFlow>
    </div>
  );
}
