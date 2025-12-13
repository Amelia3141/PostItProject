'use client';

import { useCallback, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Note, Connection, Category } from '@/types';

interface FlowViewProps {
  notes: Note[];
  connections: Connection[];
  onNoteClick: (note: Note) => void;
}

const categoryColors: Record<Category, string> = {
  opportunities: '#ffb3ba',
  enablers: '#bae1ff',
  actors: '#ffffba',
};

export function FlowView({ notes, connections, onNoteClick }: FlowViewProps) {
  const initialNodes: Node[] = useMemo(() => {
    const cols = { '10months': 0, '3years': 1, '10years': 2, 'foundational': 1 };
    const rows = { opportunities: 0, enablers: 1, actors: 2 };
    const counts: Record<string, number> = {};

    return notes.map((note) => {
      const key = `${note.category}-${note.timeframe}`;
      counts[key] = (counts[key] || 0) + 1;
      const col = cols[note.timeframe] ?? 1;
      const row = rows[note.category] ?? 0;
      const offset = counts[key] - 1;

      return {
        id: note.id,
        position: { 
          x: 100 + col * 350 + (offset % 3) * 120, 
          y: 100 + row * 250 + Math.floor(offset / 3) * 150 
        },
        data: { 
          label: note.text.substring(0, 50) + (note.text.length > 50 ? '...' : ''),
          note 
        },
        style: {
          background: categoryColors[note.category],
          border: '1px solid #333',
          borderRadius: '8px',
          padding: '10px',
          fontSize: '12px',
          width: 150,
          cursor: 'pointer',
        },
      };
    });
  }, [notes]);

  const initialEdges: Edge[] = useMemo(() => {
    return connections.map((conn) => ({
      id: conn.id,
      source: conn.sourceId,
      target: conn.targetId,
      label: conn.label,
      style: { stroke: '#667eea', strokeWidth: 2 },
      animated: true,
    }));
  }, [connections]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onNodeClick = useCallback((_: any, node: Node) => {
    if (node.data.note) {
      onNoteClick(node.data.note);
    }
  }, [onNoteClick]);

  return (
    <div style={{ width: '100%', height: '600px', background: 'white', borderRadius: '12px' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
