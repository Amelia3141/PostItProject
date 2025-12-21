'use client';

import { useState } from 'react';
import { initFirebase } from '@/lib/firebase';
import { createBoard } from '@/lib/boardDb';
import { createNote } from '@/lib/db';
import { Category, Timeframe } from '@/types';

export default function AdminPage() {
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const seedDevBoard = async () => {
    setLoading(true);
    setStatus('Creating board...');
    
    try {
      initFirebase();
      
      const board = await createBoard({
        name: 'AI Landscape Tool - Dev Roadmap',
        description: 'Live development progress and feature ideas. Add your suggestions!',
        columns: [
          { id: 'urgent', label: 'Urgent' },
          { id: 'not-urgent', label: 'Not Urgent' },
          { id: 'done', label: 'Done', colour: 'green' },
        ],
        rows: [
          { id: 'important', label: 'Important', colour: 'pink' },
          { id: 'not-important', label: 'Not Important', colour: 'blue' },
        ],
        createdBy: 'System',
        createdById: 'system',
      });

      setStatus('Adding tasks...');

      // To-do tasks
      const todoTasks: { text: string; category: string; timeframe: string; tags: string[] }[] = [
        { text: 'AI summarisation of board content', category: 'important', timeframe: 'not-urgent', tags: ['feature', 'ai'] },
        { text: 'Export to PowerPoint', category: 'important', timeframe: 'not-urgent', tags: ['feature', 'export'] },
        { text: 'Import from JSON', category: 'important', timeframe: 'not-urgent', tags: ['feature', 'import'] },
        { text: '@mentions in comments', category: 'important', timeframe: 'not-urgent', tags: ['feature', 'collab'] },
        { text: 'Keyboard shortcuts', category: 'important', timeframe: 'not-urgent', tags: ['ux'] },
        { text: 'Toast notifications for actions', category: 'not-important', timeframe: 'urgent', tags: ['ux'] },
        { text: 'Embed mode for external sites', category: 'not-important', timeframe: 'not-urgent', tags: ['feature'] },
        { text: 'Note templates', category: 'not-important', timeframe: 'not-urgent', tags: ['feature'] },
        { text: 'Bulk note operations', category: 'not-important', timeframe: 'not-urgent', tags: ['feature'] },
        { text: 'Board analytics/insights', category: 'not-important', timeframe: 'not-urgent', tags: ['feature', 'ai'] },
      ];

      // Completed tasks with completion dates
      const completedTasks: { text: string; category: string; tags: string[]; completedDate: string }[] = [
        { text: 'Flow view with SVG connections', category: 'important', tags: ['feature', 'core'], completedDate: '18 Dec 2025' },
        { text: 'Drag-and-drop between cells', category: 'important', tags: ['feature', 'ux'], completedDate: '18 Dec 2025' },
        { text: 'Export (JSON, CSV, PDF)', category: 'important', tags: ['feature', 'export'], completedDate: '18 Dec 2025' },
        { text: 'Quick vote buttons on cards', category: 'important', tags: ['feature', 'ux'], completedDate: '18 Dec 2025' },
        { text: 'Sort and filter options', category: 'important', tags: ['feature', 'ux'], completedDate: '18 Dec 2025' },
        { text: 'Collapse/expand rows', category: 'not-important', tags: ['feature', 'ux'], completedDate: '18 Dec 2025' },
        { text: 'Fullscreen mode for Flow view', category: 'not-important', tags: ['feature', 'ux'], completedDate: '18 Dec 2025' },
        { text: 'Comments on notes', category: 'important', tags: ['feature', 'collab'], completedDate: '19 Dec 2025' },
        { text: 'User identification with colours', category: 'important', tags: ['feature', 'collab'], completedDate: '19 Dec 2025' },
        { text: 'Authorship tracking', category: 'important', tags: ['feature', 'collab'], completedDate: '19 Dec 2025' },
        { text: 'Multi-board support', category: 'important', tags: ['feature', 'core'], completedDate: '19 Dec 2025' },
        { text: 'Board templates (AI Landscape, SWOT, etc)', category: 'important', tags: ['feature', 'core'], completedDate: '19 Dec 2025' },
        { text: 'Shareable links with permissions', category: 'important', tags: ['feature', 'collab'], completedDate: '21 Dec 2025' },
        { text: 'Real-time presence indicators', category: 'important', tags: ['feature', 'collab'], completedDate: '21 Dec 2025' },
        { text: 'Mobile responsive layout', category: 'important', tags: ['feature', 'ux'], completedDate: '21 Dec 2025' },
        { text: 'Activity feed', category: 'important', tags: ['feature', 'collab'], completedDate: '21 Dec 2025' },
        { text: 'Version history with diffs', category: 'important', tags: ['feature', 'core'], completedDate: '21 Dec 2025' },
        { text: 'Board settings editor', category: 'important', tags: ['feature', 'core'], completedDate: '21 Dec 2025' },
        { text: 'Dark mode toggle', category: 'not-important', tags: ['feature', 'ux'], completedDate: '21 Dec 2025' },
        { text: 'Eisenhower Matrix template', category: 'not-important', tags: ['feature', 'template'], completedDate: '21 Dec 2025' },
        { text: 'Column colour options', category: 'not-important', tags: ['feature', 'ux'], completedDate: '21 Dec 2025' },
        { text: 'Board archive system with timestamps', category: 'important', tags: ['feature', 'core'], completedDate: '21 Dec 2025' },
      ];

      // Create to-do tasks
      for (const task of todoTasks) {
        await createNote({
          text: task.text,
          category: task.category as Category,
          timeframe: task.timeframe as Timeframe,
          boardId: board.id,
          votes: 0,
          tags: task.tags,
          connections: [],
          createdBy: 'System',
          createdById: 'system',
        });
      }

      // Create completed tasks
      for (const task of completedTasks) {
        await createNote({
          text: `${task.text} [${task.completedDate}]`,
          category: task.category as Category,
          timeframe: 'done' as Timeframe,
          boardId: board.id,
          votes: 0,
          tags: [...task.tags, 'completed'],
          connections: [],
          createdBy: 'System',
          createdById: 'system',
        });
      }

      setStatus(`Done! Board created with ${todoTasks.length} to-do items and ${completedTasks.length} completed items.`);
    } catch (error) {
      setStatus(`Error: ${error}`);
    }
    
    setLoading(false);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Admin Tools</h1>
      
      <div style={{ marginTop: '2rem', padding: '1.5rem', border: '1px solid #e5e5e5' }}>
        <h2>Seed Dev Roadmap Board</h2>
        <p style={{ color: '#666', marginBottom: '1rem' }}>
          Creates an Eisenhower Matrix board with the current dev to-do list and completed items with timestamps.
        </p>
        <button
          onClick={seedDevBoard}
          disabled={loading}
          style={{
            padding: '0.75rem 1.5rem',
            background: '#111',
            color: 'white',
            border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.5 : 1,
          }}
        >
          {loading ? 'Creating...' : 'Create Dev Roadmap Board'}
        </button>
        {status && (
          <p style={{ marginTop: '1rem', padding: '0.75rem', background: '#fafafa' }}>
            {status}
          </p>
        )}
      </div>
    </div>
  );
}
