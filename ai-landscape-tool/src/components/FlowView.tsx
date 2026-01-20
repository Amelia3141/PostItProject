'use client';

import { useCallback, useEffect } from 'react';
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
      style: { stroke: '#667eea', strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#667eea' },
      animated: false,
    }));
  }, [connections]);

  const [nodes, setNodes, onNodesChange] = useNodesState(buildNodes());
  const [edges, setEdges, onEdgesChange] = useEdgesState(buildEdges());

  useEffect(() => {
    setNodes(buildNodes());
  }, [notes, buildNodes, setNodes]);

  useEffect(() => {
    setEdges(buildEdges());
  }, [connections, buildEdges, setEdges]);

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

  const onEdgeClick = useCallback((_: any, edge: Edge) => {
    if (onDeleteConnection && window.confirm('Delete this connection?')) {
      onDeleteConnection(edge.id);
    }
  }, [onDeleteConnection]);

  return (
    <div style={{ width: '100%', height: '700px', background: 'white', borderRadius: '12px', border: '1px solid #e9ecef' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.1 }}
        connectionLineStyle={{ stroke: '#667eea', strokeWidth: 2 }}
      >
        <Background color="#f1f3f4" gap={20} />
        <Controls />
      </ReactFlow>
    </div>
  );
}
