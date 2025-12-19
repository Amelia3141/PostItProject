import { BoardTemplate } from '@/types';

export const boardTemplates: BoardTemplate[] = [
  {
    id: 'ai-landscape',
    name: 'AI Landscape',
    description: 'Map AI opportunities, enablers, and actors across time horizons',
    columns: [
      { id: '10months', label: 'Next 10 Months' },
      { id: '3years', label: '3 Years' },
      { id: '10years', label: '10 Years' },
    ],
    rows: [
      { id: 'opportunities', label: 'Opportunities', colour: 'pink', question: 'What new possibilities could AI create?' },
      { id: 'enablers', label: 'Enablers', colour: 'blue', question: 'What technologies will make this possible?' },
      { id: 'actors', label: 'Actors', colour: 'yellow', question: 'Who will drive these changes?' },
    ],
  },
  {
    id: 'product-roadmap',
    name: 'Product Roadmap',
    description: 'Plan product features across quarters',
    columns: [
      { id: 'q1', label: 'Q1' },
      { id: 'q2', label: 'Q2' },
      { id: 'q3', label: 'Q3' },
      { id: 'q4', label: 'Q4' },
    ],
    rows: [
      { id: 'features', label: 'Features', colour: 'pink', question: 'What will we build?' },
      { id: 'infrastructure', label: 'Infrastructure', colour: 'blue', question: 'What do we need to support it?' },
      { id: 'research', label: 'Research', colour: 'yellow', question: 'What do we need to learn?' },
    ],
  },
  {
    id: 'swot',
    name: 'SWOT Analysis',
    description: 'Analyze strengths, weaknesses, opportunities, and threats',
    columns: [
      { id: 'internal', label: 'Internal' },
      { id: 'external', label: 'External' },
    ],
    rows: [
      { id: 'positive', label: 'Positive', colour: 'pink', question: 'Strengths & Opportunities' },
      { id: 'negative', label: 'Negative', colour: 'blue', question: 'Weaknesses & Threats' },
    ],
  },
  {
    id: 'blank',
    name: 'Blank Board',
    description: 'Start from scratch with custom rows and columns',
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
