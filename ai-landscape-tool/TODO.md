# AI Landscape Tool - Project TODO

## Completed

| Task | Added | Completed | Notes |
|------|-------|-----------|-------|
| Reverse engineer original Vercel app structure | 2024-12-12 | 2024-12-12 | Extracted all 66 notes with categories, timeframes, votes, tags |
| Set up Next.js 14 project structure | 2024-12-12 | 2024-12-12 | TypeScript, App Router |
| Create TypeScript types | 2024-12-12 | 2024-12-12 | Note, Connection, Workshop, FilterState, etc. |
| Extract and structure seed data | 2024-12-12 | 2024-12-12 | All original notes preserved |
| Implement Firebase Realtime Database integration | 2024-12-12 | 2024-12-12 | CRUD operations, subscriptions |
| Create React hooks for data management | 2024-12-12 | 2024-12-12 | useNotes, useConnections, useFilteredNotes, useStats |
| Replicate original CSS styling | 2024-12-12 | 2024-12-12 | CSS modules matching original design |
| Build NoteCard component | 2024-12-12 | 2024-12-12 | With colour coding, votes, tags |
| Build NoteModal for add/edit | 2024-12-12 | 2024-12-12 | Full CRUD UI |
| Build Dashboard with Board view | 2024-12-12 | 2024-12-12 | Grid layout matching original |
| Implement filtering (time/category/search) | 2024-12-12 | 2024-12-12 | All filters functional |
| Implement voting | 2024-12-12 | 2024-12-12 | Increment/decrement votes |
| Add Grid view | 2024-12-12 | 2024-12-12 | Alternative card layout |
| Create connection data model | 2024-12-12 | 2024-12-12 | Bi-directional relationships |

## In Progress

| Task | Added | Notes |
|------|-------|-------|
| Push to GitHub repository | 2024-12-12 | Repo created: github.com/Amelia3141/PostItProject - needs push |
| Configure Firebase credentials | 2024-12-12 | DB URL set, need API key + app ID from Firebase console |

## TODO - High Priority

| Task | Added | Notes |
|------|-------|-------|
| Implement Flow view with visual connections | 2024-12-12 | SVG lines between connected notes, possibly use react-flow |
| Add drag-and-drop to move notes between cells | 2024-12-12 | Consider react-beautiful-dnd or @dnd-kit |
| Implement user authentication | 2024-12-12 | Firebase Auth with email/password or anonymous |
| Add real-time collaboration indicators | 2024-12-12 | Show who's viewing/editing |
| Export to JSON/CSV | 2024-12-12 | Data export functionality |

## TODO - Medium Priority

| Task | Added | Notes |
|------|-------|-------|
| Add connection labels/types | 2024-12-12 | Categorise relationship types |
| Implement connection creation UI | 2024-12-12 | Click-to-connect flow |
| Add note history/versioning | 2024-12-12 | Track changes over time |
| Keyboard shortcuts | 2024-12-12 | Quick add, navigation |
| Mobile responsive improvements | 2024-12-12 | Touch-friendly interface |
| Dark mode | 2024-12-12 | Theme toggle |

## TODO - Future/Advanced (NLP/ML)

| Task | Added | Notes |
|------|-------|-------|
| Sentiment analysis of notes | 2024-12-12 | Positive/negative/neutral classification |
| Auto-summarisation of clusters | 2024-12-12 | Group related notes and generate summaries |
| Similarity-based grouping | 2024-12-12 | Suggest connections based on content |
| Topic extraction | 2024-12-12 | Auto-generate tags from content |
| OCR integration for photo import | 2024-12-12 | Upload photos of physical post-its |
| AI-powered connection suggestions | 2024-12-12 | Recommend links between ideas |

## Setup Instructions

1. Clone the repository
2. Copy `.env.example` to `.env.local`
3. Create a Firebase project at https://console.firebase.google.com/
4. Enable Realtime Database
5. Copy Firebase config values to `.env.local`
6. Apply security rules from `firebase-rules.json`
7. Run `npm install`
8. Run `npm run dev`

## Notes

- Original data from Henry's workshop has been preserved
- Current implementation is statically rendered, requires Firebase for persistence
- The "Show Connections" feature mentioned in emails was never implemented in original - now scaffolded
