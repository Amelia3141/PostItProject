'use client';

import { useCallback, useMemo, useState, useEffect } from 'react';
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
import { Note, Connection, Category, Timeframe } from '@/types';

interface FlowViewProps {
  notes: Note[];
  connections: Connection[];
  onNoteClick: (note: Note) => void;
  onConnect: (sourceId: string, targetId: string) => void;
}

const categoryColors: Record<Category, string> = {
  opportunities: '#fff5f5',
  enablers: '#f0f7ff',
  actors: '#fffff0',
};

const categoryBorders: Record<Category, string> = {
  opportunities: '#fed7d7',
  enablers: '#bee3f8',
  actors: '#faf089',
};

const timeframeLabels: Record<Timeframe, string> = {
  '10months': '10 Months',
  '3years': '3 Years',
  '10years': '10 Years',
  'foundational': 'Foundational',
};

const timeframeOrder: Timeframe[] = ['10months', '3years', '10years', 'foundational'];
const categoryOrder: Category[] = ['opportunities', 'enablers', 'actors'];

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

export function FlowView({ notes, connections, onNoteClick, onConnect }: FlowViewProps) {
  const buildNodes = useCallback((): Node[] => {
    const nodes: Node[] = [];
    const cellCounts: Record<string, number> = {};
    
    const colWidth = 320;
    const rowHeight = 280;
    const nodeWidth = 150;
    const nodeHeight = 70;
    const padding = 15;
    
    timeframeOrder.forEach((tf, colIndex) => {
      nodes.push({
        id: `header-${tf}`,
        position: { x: 180 + colIndex * colWidth + colWidth/2 - 60, y: 10 },
        data: { label: timeframeLabels[tf] },
        style: {
          background: '#1a1a2e',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          padding: '8px 16px',
          fontSize: '12px',
          fontWeight: '600',
          width: 100,
          textAlign: 'center',
        },
        draggable: false,
        selectable: false,
      });
    });

    categoryOrder.forEach((cat, rowIndex) => {
      nodes.push({
        id: `label-${cat}`,
        position: { x: 20, y: 70 + rowIndex * rowHeight + 40 },
        data: { label: cat.charAt(0).toUpperCase() + cat.slice(1) },
        style: {
          background: categoryColors[cat],
          border: `2px solid ${categoryBorders[cat]}`,
          borderRadius: '6px',
          padding: '8px 12px',
          fontSize: '11px',
          fontWeight: '600',
          width: 100,
          textAlign: 'center',
        },
        draggable: false,
        selectable: false,
      });
    });

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
      
      const x = 180 + colIndex * colWidth + col * (nodeWidth + padding);
      const y = 70 + rowIndex * rowHeight + row * (nodeHeight + padding);

      nodes.push({
        id: note.id,
        type: 'noteNode',
        position: { x, y },
        data: { 
          label: note.text.length > 35 ? note.text.substring(0, 35) + '...' : note.text,
          note,
          background: categoryColors[note.category],
          border: categoryBorders[note.category],
        },
      });
    });

    return nodes;
  }, [notes]);

  const buildEdges = useCallback((): Edge[] => {
    return connections.map((conn) => ({
      id: conn.id,
      source: conn.sourceId,
      target: conn.targetId,
      style: { stroke: '#667eea', strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#667eea' },
      animated: true,
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

  return (
    <div style={{ width: '100%', height: '700px', background: 'white', borderRadius: '12px', border: '1px solid #e9ecef' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        onNodeClick={onNodeClick}
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
