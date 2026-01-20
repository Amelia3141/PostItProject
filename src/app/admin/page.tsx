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
          { id: 'future', label: 'Future Direction', colour: 'purple' },
        ],
        createdBy: 'System',
        createdById: 'system',
      });

      setStatus('Adding tasks...');

      // To-do tasks
      const todoTasks: { text: string; category: string; timeframe: string; tags: string[] }[] = [
        // Important + Urgent
        { text: 'Toast notifications for actions', category: 'important', timeframe: 'urgent', tags: ['ux', 'quick-win'] },
        { text: 'Keyboard shortcuts', category: 'important', timeframe: 'urgent', tags: ['ux', 'quick-win'] },
        
        // Important + Not Urgent
        { text: 'AI summarisation of board content', category: 'important', timeframe: 'not-urgent', tags: ['feature', 'ai'] },
        { text: 'Export to PowerPoint', category: 'important', timeframe: 'not-urgent', tags: ['feature', 'export'] },
        { text: 'Import from JSON', category: 'important', timeframe: 'not-urgent', tags: ['feature', 'import'] },
        { text: '@mentions in comments', category: 'important', timeframe: 'not-urgent', tags: ['feature', 'collab'] },
        
        // Not Important + Not Urgent
        { text: 'Embed mode for external sites', category: 'not-important', timeframe: 'not-urgent', tags: ['feature'] },
        { text: 'Note templates', category: 'not-important', timeframe: 'not-urgent', tags: ['feature'] },
        { text: 'Bulk note operations', category: 'not-important', timeframe: 'not-urgent', tags: ['feature'] },
        
        // Future Direction - Premium Features
        { text: 'Custom domain support (white-labelling)', category: 'future', timeframe: 'not-urgent', tags: ['premium', 'branding'] },
        { text: 'Per-user colour theme preferences', category: 'future', timeframe: 'not-urgent', tags: ['premium', 'ux'] },
        { text: 'Per-board custom theme settings', category: 'future', timeframe: 'not-urgent', tags: ['premium', 'ux'] },
        { text: 'Global page theme customisation', category: 'future', timeframe: 'not-urgent', tags: ['premium', 'branding'] },
        { text: 'Live session insights dashboard', category: 'future', timeframe: 'not-urgent', tags: ['premium', 'analytics', 'ai'] },
        { text: 'Auto-generated PDF reports', category: 'future', timeframe: 'not-urgent', tags: ['premium', 'export', 'ai'] },
        { text: 'Auto-generated PowerPoint with AI', category: 'future', timeframe: 'not-urgent', tags: ['premium', 'export', 'ai'] },
        { text: 'GitHub-style participation heatmap', category: 'future', timeframe: 'not-urgent', tags: ['premium', 'analytics'] },
        { text: 'Ideas generated rate over time chart', category: 'future', timeframe: 'not-urgent', tags: ['premium', 'analytics'] },
        { text: 'Visual cluster heatmaps', category: 'future', timeframe: 'not-urgent', tags: ['premium', 'analytics'] },
        { text: 'Executive summary generator', category: 'future', timeframe: 'not-urgent', tags: ['premium', 'ai', 'export'] },
        { text: 'Per-stakeholder summaries (govt/academia/industry/SME)', category: 'future', timeframe: 'not-urgent', tags: ['premium', 'ai'] },
        { text: 'AI-generated insights per board category', category: 'future', timeframe: 'not-urgent', tags: ['premium', 'ai'] },
        { text: 'Auto-cluster similar ideas', category: 'future', timeframe: 'not-urgent', tags: ['premium', 'ai'] },
        { text: 'AI "what\'s missing" suggestions', category: 'future', timeframe: 'not-urgent', tags: ['premium', 'ai'] },
        { text: 'Sentiment analysis on notes', category: 'future', timeframe: 'not-urgent', tags: ['premium', 'ai'] },
        { text: 'AI action items extraction', category: 'future', timeframe: 'not-urgent', tags: ['premium', 'ai'] },
        { text: 'Admin vs participant roles', category: 'future', timeframe: 'not-urgent', tags: ['premium', 'permissions'] },
        { text: 'View permissions (hide prev group ideas)', category: 'future', timeframe: 'not-urgent', tags: ['premium', 'permissions'] },
        { text: 'Admin-only settings panel', category: 'future', timeframe: 'not-urgent', tags: ['premium', 'permissions'] },
        { text: 'Slack integration', category: 'future', timeframe: 'not-urgent', tags: ['premium', 'integration'] },
        { text: 'Notion/Confluence export', category: 'future', timeframe: 'not-urgent', tags: ['premium', 'integration'] },
        { text: 'Zapier webhooks', category: 'future', timeframe: 'not-urgent', tags: ['premium', 'integration'] },
        { text: 'SSO/company login', category: 'future', timeframe: 'not-urgent', tags: ['premium', 'enterprise'] },
        { text: 'Audit logs', category: 'future', timeframe: 'not-urgent', tags: ['premium', 'enterprise'] },
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

  const addFutureTasks = async () => {
    setLoading(true);
    setStatus('Adding future tasks to existing board...');
    
    try {
      initFirebase();
      
      // Find the dev roadmap board
      const { getAllBoards } = await import('@/lib/boardDb');
      const boards = await getAllBoards();
      const devBoard = boards.find(b => b.name.includes('Dev Roadmap'));
      
      if (!devBoard) {
        setStatus('Error: Dev Roadmap board not found. Create it first.');
        setLoading(false);
        return;
      }

      const futureTasks: { text: string; tags: string[] }[] = [
        { text: 'Custom domain support (white-labelling)', tags: ['premium', 'branding'] },
        { text: 'Per-user colour theme preferences', tags: ['premium', 'ux'] },
        { text: 'Per-board custom theme settings', tags: ['premium', 'ux'] },
        { text: 'Global page theme customisation', tags: ['premium', 'branding'] },
        { text: 'Live session insights dashboard', tags: ['premium', 'analytics', 'ai'] },
        { text: 'Auto-generated PDF reports', tags: ['premium', 'export', 'ai'] },
        { text: 'Auto-generated PowerPoint with AI', tags: ['premium', 'export', 'ai'] },
        { text: 'GitHub-style participation heatmap', tags: ['premium', 'analytics'] },
        { text: 'Ideas generated rate over time chart', tags: ['premium', 'analytics'] },
        { text: 'Visual cluster heatmaps', tags: ['premium', 'analytics'] },
        { text: 'Executive summary generator', tags: ['premium', 'ai', 'export'] },
        { text: 'Per-stakeholder summaries (govt/academia/industry/SME)', tags: ['premium', 'ai'] },
        { text: 'AI-generated insights per board category', tags: ['premium', 'ai'] },
        { text: 'Auto-cluster similar ideas', tags: ['premium', 'ai'] },
        { text: 'AI "what\'s missing" suggestions', tags: ['premium', 'ai'] },
        { text: 'Sentiment analysis on notes', tags: ['premium', 'ai'] },
        { text: 'AI action items extraction', tags: ['premium', 'ai'] },
        { text: 'Admin vs participant roles', tags: ['premium', 'permissions'] },
        { text: 'View permissions (hide prev group ideas)', tags: ['premium', 'permissions'] },
        { text: 'Admin-only settings panel', tags: ['premium', 'permissions'] },
        { text: 'Slack integration', tags: ['premium', 'integration'] },
        { text: 'Notion/Confluence export', tags: ['premium', 'integration'] },
        { text: 'Zapier webhooks', tags: ['premium', 'integration'] },
        { text: 'SSO/company login', tags: ['premium', 'enterprise'] },
        { text: 'Audit logs', tags: ['premium', 'enterprise'] },
      ];

      // First check if board has 'future' row, if not we need to add tasks to 'not-important'
      const hasFuture = devBoard.rows.some(r => r.id === 'future');
      const category = hasFuture ? 'future' : 'not-important';

      for (const task of futureTasks) {
        await createNote({
          text: task.text,
          category: category as Category,
          timeframe: 'not-urgent' as Timeframe,
          boardId: devBoard.id,
          votes: 0,
          tags: task.tags,
          connections: [],
          createdBy: 'System',
          createdById: 'system',
        });
      }

      setStatus(`Done! Added ${futureTasks.length} future direction tasks.`);
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
          Creates a fresh Eisenhower Matrix board with to-do, completed, and future direction items.
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
      </div>

      <div style={{ marginTop: '1.5rem', padding: '1.5rem', border: '1px solid #e5e5e5' }}>
        <h2>Add Future Tasks Only</h2>
        <p style={{ color: '#666', marginBottom: '1rem' }}>
          Adds premium/future direction tasks to an existing Dev Roadmap board.
        </p>
        <button
          onClick={addFutureTasks}
          disabled={loading}
          style={{
            padding: '0.75rem 1.5rem',
            background: '#666',
            color: 'white',
            border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.5 : 1,
          }}
        >
          {loading ? 'Adding...' : 'Add Future Tasks'}
        </button>
      </div>

      {status && (
        <p style={{ marginTop: '1rem', padding: '0.75rem', background: '#fafafa' }}>
          {status}
        </p>
      )}
    </div>
  );
}
