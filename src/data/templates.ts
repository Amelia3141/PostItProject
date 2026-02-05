import { BoardTemplate } from '@/types';

export const boardTemplates: BoardTemplate[] = [
  {
    id: 'ai-landscape',
    name: 'AI Landscape',
    description: 'Map AI opportunities, enabling technologies, and key actors across time horizons',
    columns: [
      { id: 'near', label: 'Near Term (0-2 years)' },
      { id: 'mid', label: 'Mid Term (2-5 years)' },
      { id: 'far', label: 'Far Term (5+ years)' },
    ],
    rows: [
      { id: 'opportunities', label: 'Opportunities', colour: 'pink' },
      { id: 'enablers', label: 'Enabling Technologies', colour: 'blue' },
      { id: 'actors', label: 'Key Actors', colour: 'yellow' },
    ],
  },
  {
    id: 'product-roadmap',
    name: 'Product Roadmap',
    description: 'Plan product development across quarters',
    columns: [
      { id: 'q1', label: 'Q1' },
      { id: 'q2', label: 'Q2' },
      { id: 'q3', label: 'Q3' },
      { id: 'q4', label: 'Q4' },
    ],
    rows: [
      { id: 'features', label: 'Features', colour: 'pink' },
      { id: 'infrastructure', label: 'Infrastructure', colour: 'blue' },
      { id: 'research', label: 'Research', colour: 'yellow' },
    ],
  },
  {
    id: 'swot',
    name: 'SWOT Analysis',
    description: 'Analyse strengths, weaknesses, opportunities, and threats',
    columns: [
      { id: 'positive', label: 'Positive' },
      { id: 'negative', label: 'Negative' },
    ],
    rows: [
      { id: 'internal', label: 'Internal', colour: 'blue' },
      { id: 'external', label: 'External', colour: 'yellow' },
    ],
  },
  {
    id: 'eisenhower',
    name: 'Eisenhower Matrix',
    description: 'Prioritise tasks by urgency and importance, track completed work',
    columns: [
      { id: 'urgent', label: 'Urgent', colour: 'pink' },
      { id: 'not-urgent', label: 'Not Urgent', colour: 'blue' },
      { id: 'done', label: 'Done', colour: 'green' },
    ],
    rows: [
      { id: 'important', label: 'Important', colour: 'pink' },
      { id: 'not-important', label: 'Not Important', colour: 'blue' },
    ],
  },
  {
    id: 'kanban',
    name: 'Kanban Board',
    description: 'Track work through stages from backlog to done',
    columns: [
      { id: 'backlog', label: 'Backlog' },
      { id: 'todo', label: 'To Do' },
      { id: 'in-progress', label: 'In Progress' },
      { id: 'review', label: 'Review' },
      { id: 'done', label: 'Done' },
    ],
    rows: [
      { id: 'high', label: 'High Priority', colour: 'pink' },
      { id: 'medium', label: 'Medium Priority', colour: 'yellow' },
      { id: 'low', label: 'Low Priority', colour: 'blue' },
    ],
  },
  {
    id: 'retrospective',
    name: 'Retrospective',
    description: 'Reflect on what worked, what didn\'t, and actions',
    columns: [
      { id: 'good', label: 'What Went Well' },
      { id: 'bad', label: 'What Didn\'t Go Well' },
      { id: 'actions', label: 'Actions' },
    ],
    rows: [
      { id: 'process', label: 'Process', colour: 'blue' },
      { id: 'people', label: 'People', colour: 'pink' },
      { id: 'tools', label: 'Tools', colour: 'yellow' },
    ],
  },
  {
    id: 'user-story-map',
    name: 'User Story Map',
    description: 'Map user journeys and features by release',
    columns: [
      { id: 'mvp', label: 'MVP' },
      { id: 'v1', label: 'Version 1' },
      { id: 'v2', label: 'Version 2' },
      { id: 'future', label: 'Future' },
    ],
    rows: [
      { id: 'discovery', label: 'Discovery', colour: 'pink' },
      { id: 'engagement', label: 'Engagement', colour: 'blue' },
      { id: 'retention', label: 'Retention', colour: 'yellow' },
      { id: 'growth', label: 'Growth', colour: 'green' },
    ],
  },
  {
    id: 'blank',
    name: 'Blank Board',
    description: 'Start from scratch with a customisable 3x3 grid',
    columns: [
      { id: 'col1', label: 'Column 1' },
      { id: 'col2', label: 'Column 2' },
      { id: 'col3', label: 'Column 3' },
    ],
    rows: [
      { id: 'row1', label: 'Row 1', colour: 'pink' },
      { id: 'row2', label: 'Row 2', colour: 'blue' },
      { id: 'row3', label: 'Row 3', colour: 'yellow' },
    ],
  },
];
