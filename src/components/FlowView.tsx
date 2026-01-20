'use client';

import { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  MarkerType,
  Connection as FlowConnection,
  Handle,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Note, Connection, BoardColumn, BoardRow } from '@/types';

interface ContextMenu {
  x: number;
  y: number;
  edgeId: string;
}

interface FlowViewProps {
  notes: Note[];
  connections: Connection[];
  columns: BoardColumn[];
  rows: BoardRow[];
  onNoteClick: (note: Note) => void;
  onConnect: (sourceId: string, targetId: string) => void;
  onDeleteConnection?: (connectionId: string) => void;
}

const colourToBackground: Record<string, string> = {
  pink: '#fff5f5',
  blue: '#f0f7ff',
  yellow: '#fffff0',
  green: '#f0fff4',
  purple: '#faf5ff',
  orange: '#fffaf0',
};

const colourToBorder: Record<string, string> = {
  pink: '#fed7d7',
  blue: '#bee3f8',
  yellow: '#faf089',
  green: '#9ae6b4',
  purple: '#d6bcfa',
  orange: '#fbd38d',
};

function NoteNode({ data }: { data: { label: string; note: Note; background: string; border: string } }) {
  return (
    <div style={{
      background: data.background,
      border: `1px solid ${data.border}`,
      borderRadius: '6px',
      padding: '8px',
      fontSize: '10px',
      width: 150,
      cursor: 'pointer',
    }}>
      <Handle type="target" position={Position.Top} style={{ background: '#667eea' }} />
      <div>{data.label}</div>
      <Handle type="source" position={Position.Bottom} style={{ background: '#667eea' }} />
    </div>
  );
}

const nodeTypes = { noteNode: NoteNode };

export function FlowView({ notes, connections, columns, rows, onNoteClick, onConnect, onDeleteConnection }: FlowViewProps) {
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);

  const buildNodes = useCallback((): Node[] => {
    const nodes: Node[] = [];
    const cellCounts: Record<string, number> = {};

    const colWidth = 320;
    const rowHeight = 280;
    const nodeWidth = 150;
    const nodeHeight = 70;
    const padding = 15;

    // Column headers (dynamic from board.columns)
    columns.forEach((col, colIndex) => {
      nodes.push({
        id: `header-${col.id}`,
        position: { x: 180 + colIndex * colWidth + colWidth/2 - 60, y: 10 },
        data: { label: col.label },
        style: {
          background: '#1a1a2e',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          padding: '8px 16px',
          fontSize: '12px',
          fontWeight: '600',
          width: 120,
          textAlign: 'center' as const,
        },
        draggable: false,
        selectable: false,
      });
    });

    // Row labels (dynamic from board.rows)
    rows.forEach((row, rowIndex) => {
      const bgColor = colourToBackground[row.colour] || '#f5f5f5';
      const borderColor = colourToBorder[row.colour] || '#e0e0e0';
      nodes.push({
        id: `label-${row.id}`,
        position: { x: 20, y: 70 + rowIndex * rowHeight + 40 },
        data: { label: row.label },
        style: {
          background: bgColor,
          border: `2px solid ${borderColor}`,
          borderRadius: '6px',
          padding: '8px 12px',
          fontSize: '11px',
          fontWeight: '600',
          width: 120,
          textAlign: 'center' as const,
        },
        draggable: false,
        selectable: false,
      });
    });

    // Note nodes
    notes.forEach((note) => {
      const colIndex = columns.findIndex(c => c.id === note.timeframe);
      const rowIndex = rows.findIndex(r => r.id === note.category);

      if (colIndex === -1 || rowIndex === -1) return;

      const row = rows[rowIndex];
      const cellKey = `${note.category}-${note.timeframe}`;
      cellCounts[cellKey] = (cellCounts[cellKey] || 0);
      const offset = cellCounts[cellKey];
      cellCounts[cellKey]++;

      const col = offset % 2;
      const rowOffset = Math.floor(offset / 2);

      const x = 180 + colIndex * colWidth + col * (nodeWidth + padding);
      const y = 70 + rowIndex * rowHeight + rowOffset * (nodeHeight + padding);

      const bgColor = colourToBackground[row.colour] || '#f5f5f5';
      const borderColor = colourToBorder[row.colour] || '#e0e0e0';

      nodes.push({
        id: note.id,
        type: 'noteNode',
        position: { x, y },
        data: {
          label: note.text.length > 35 ? note.text.substring(0, 35) + '...' : note.text,
          note,
          background: bgColor,
          border: borderColor,
        },
      });
    });

    return nodes;
  }, [notes, columns, rows]);

  const buildEdges = useCallback((): Edge[] => {
    return connections.map((conn) => ({
      id: conn.id,
      source: conn.sourceId,
      target: conn.targetId,
      style: {
        stroke: selectedEdgeId === conn.id ? '#e53e3e' : '#667eea',
        strokeWidth: selectedEdgeId === conn.id ? 3 : 2
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: selectedEdgeId === conn.id ? '#e53e3e' : '#667eea'
      },
      animated: false,
      selected: selectedEdgeId === conn.id,
    }));
  }, [connections, selectedEdgeId]);

  const [nodes, setNodes, onNodesChange] = useNodesState(buildNodes());
  const [edges, setEdges, onEdgesChange] = useEdgesState(buildEdges());

  useEffect(() => {
    setNodes(buildNodes());
  }, [notes, buildNodes, setNodes]);

  useEffect(() => {
    setEdges(buildEdges());
  }, [connections, buildEdges, setEdges, selectedEdgeId]);

  const handleConnect = useCallback((params: FlowConnection) => {
    if (params.source && params.target) {
      onConnect(params.source, params.target);
    }
  }, [onConnect]);

  const onNodeClick = useCallback((_: any, node: Node) => {
    if (node.id.startsWith('header-') || node.id.startsWith('label-')) return;
    if (node.data.note) {
      onNoteClick(node.data.note);
    }
  }, [onNoteClick]);

  // Click edge to select it
  const onEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    setSelectedEdgeId(prev => prev === edge.id ? null : edge.id);
    setContextMenu(null);
  }, []);

  // Right-click edge to show context menu
  const onEdgeContextMenu = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.preventDefault();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      edgeId: edge.id,
    });
    setSelectedEdgeId(edge.id);
  }, []);

  // Handle delete from context menu
  const handleDeleteFromMenu = useCallback(() => {
    if (contextMenu && onDeleteConnection) {
      onDeleteConnection(contextMenu.edgeId);
    }
    setContextMenu(null);
    setSelectedEdgeId(null);
  }, [contextMenu, onDeleteConnection]);

  // Handle keyboard delete
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedEdgeId && onDeleteConnection) {
        onDeleteConnection(selectedEdgeId);
        setSelectedEdgeId(null);
      }
      if (event.key === 'Escape') {
        setSelectedEdgeId(null);
        setContextMenu(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedEdgeId, onDeleteConnection]);

  // Close context menu on click outside
  const onPaneClick = useCallback(() => {
    setContextMenu(null);
    setSelectedEdgeId(null);
  }, []);

  return (
    <div style={{ width: '100%', height: '700px', background: 'white', borderRadius: '12px', border: '1px solid #e9ecef', position: 'relative' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onEdgeContextMenu={onEdgeContextMenu}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.1 }}
        connectionLineStyle={{ stroke: '#667eea', strokeWidth: 2 }}
      >
        <Background color="#f1f3f4" gap={20} />
        <Controls />
      </ReactFlow>

      {/* Context Menu */}
      {contextMenu && (
        <div
          style={{
            position: 'fixed',
            left: contextMenu.x,
            top: contextMenu.y,
            background: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            border: '1px solid #e5e7eb',
            zIndex: 1000,
            overflow: 'hidden',
          }}
        >
          <button
            onClick={handleDeleteFromMenu}
            style={{
              display: 'block',
              width: '100%',
              padding: '10px 16px',
              background: 'white',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#ef4444',
              textAlign: 'left',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#fef2f2'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
          >
            Delete connection
          </button>
        </div>
      )}

      {/* Selection hint */}
      {selectedEdgeId && !contextMenu && (
        <div
          style={{
            position: 'absolute',
            bottom: '16px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '12px',
            zIndex: 100,
          }}
        >
          Press Delete or Backspace to remove • Esc to cancel
        </div>
      )}
    </div>
  );
}
