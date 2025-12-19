import { Note, Category, Timeframe } from '@/types';

export const categoryConfig: Record<Category, { label: string; colour: string; question: string }> = {
  opportunities: { label: 'Opportunities', colour: 'pink', question: 'What new possibilities could AI create?' },
  enablers: { label: 'Enablers', colour: 'blue', question: 'What technologies will make this possible?' },
  actors: { label: 'Actors', colour: 'yellow', question: 'Who will drive these changes?' },
};

export const timeframeConfig: Record<Timeframe, { label: string }> = {
  '10months': { label: 'Next 10 Months' },
  '3years': { label: '3 Years' },
  '10years': { label: '10 Years' },
  'foundational': { label: 'Foundational' },
};

export const seedNotes: Omit<Note, 'boardId'>[] = [
  // OPPORTUNITIES - 10 months
  { id: '1', text: 'Detection of Disinformation', category: 'opportunities', timeframe: '10months', votes: 2, tags: [], connections: [], createdAt: Date.now(), updatedAt: Date.now() },
  { id: '2', text: 'AI Cyber Defence Service / AI Research Teams', category: 'opportunities', timeframe: '10months', votes: 2, tags: [], connections: [], createdAt: Date.now(), updatedAt: Date.now() },
  { id: '3', text: 'Forecasting & Predictive Systems', category: 'opportunities', timeframe: '10months', votes: 2, tags: [], connections: [], createdAt: Date.now(), updatedAt: Date.now() },
  { id: '4', text: 'Automating Big Data Tasks (resource/funding management)', category: 'opportunities', timeframe: '10months', votes: 1, tags: [], connections: [], createdAt: Date.now(), updatedAt: Date.now() },
  
  // OPPORTUNITIES - 3 years
  { id: '5', text: 'AI Creativity', category: 'opportunities', timeframe: '3years', votes: 4, tags: [], connections: [], createdAt: Date.now(), updatedAt: Date.now() },
  { id: '6', text: 'Longevity/Immortality • Solo Hedge Funds • Faster Clinical Trials', category: 'opportunities', timeframe: '3years', votes: 4, tags: [], connections: [], createdAt: Date.now(), updatedAt: Date.now() },
  { id: '7', text: 'Personalised AI Tutors for Everyone', category: 'opportunities', timeframe: '3years', votes: 3, tags: [], connections: [], createdAt: Date.now(), updatedAt: Date.now() },
  
  // OPPORTUNITIES - 10 years
  { id: '8', text: 'Human-level Problem Solving / Simplification of Expertise', category: 'opportunities', timeframe: '10years', votes: 3, tags: [], connections: [], createdAt: Date.now(), updatedAt: Date.now() },
  { id: '9', text: 'Infrastructure / Resource Sharing', category: 'opportunities', timeframe: '10years', votes: 2, tags: [], connections: [], createdAt: Date.now(), updatedAt: Date.now() },
  
  // ENABLERS - 10 months
  { id: '10', text: 'Reinforcement Learning Environments for TEXT', category: 'enablers', timeframe: '3years', votes: 4, tags: [], connections: [], createdAt: Date.now(), updatedAt: Date.now() },
  { id: '11', text: 'World Models (E4)/ Vertical AI (E1)', category: 'enablers', timeframe: '10years', votes: 3, tags: [], connections: [], createdAt: Date.now(), updatedAt: Date.now() },
  { id: '12', text: 'Incentive Systems for Both Humans and AI', category: 'enablers', timeframe: '10months', votes: 2, tags: [], connections: [], createdAt: Date.now(), updatedAt: Date.now() },
  
  // ACTORS
  { id: '13', text: 'Historical Document Understanding', category: 'actors', timeframe: '10months', votes: 1, tags: [], connections: [], createdAt: Date.now(), updatedAt: Date.now() },
  { id: '14', text: 'Agent Protocols with Guarantee', category: 'actors', timeframe: '3years', votes: 2, tags: [], connections: [], createdAt: Date.now(), updatedAt: Date.now() },
  { id: '15', text: 'Augmented Humans', category: 'actors', timeframe: '10years', votes: 3, tags: [], connections: [], createdAt: Date.now(), updatedAt: Date.now() },
  { id: '16', text: 'Government - Army AI Capabilities', category: 'actors', timeframe: '10years', votes: 2, tags: [], connections: [], createdAt: Date.now(), updatedAt: Date.now() },
];
