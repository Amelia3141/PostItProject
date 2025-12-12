# AI Landscape - Foresight Workshop Tool

A digital post-it note board for collaborative roadmapping and foresight workshops. Maps AI opportunities, enabling technologies, and key actors across different time horizons.

## Features

### Current
- **Board View**: 3x3 grid with categories (Opportunities, Enablers, Actors) × timeframes (10 months, 3 years, 10 years)
- **Grid View**: Flat card layout for quick scanning
- **Flow View**: (In development) Visual connections between ideas
- **Real-time sync**: Firebase Realtime Database for live collaboration
- **Voting**: Dot-based voting system to prioritise ideas
- **Tagging**: Add custom tags to notes
- **Filtering**: Filter by timeframe, category, or search text
- **CRUD**: Add, edit, delete notes

### Planned
- Visual connection mapping between ideas
- Drag-and-drop repositioning
- User authentication
- NLP features (sentiment analysis, auto-summarisation)
- Photo OCR for importing physical post-its

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: Firebase Realtime Database
- **Styling**: CSS Modules
- **Fonts**: Playfair Display, Nunito, Space Mono, Inter

## Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- Firebase account

### Installation

```bash
# Clone the repository
git clone https://github.com/Amelia3141/PostItProject.git
cd PostItProject

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local
```

### Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use existing)
3. Enable **Realtime Database**
   - Choose a region
   - Start in test mode (we'll add rules later)
4. Go to Project Settings > General > Your apps
5. Add a Web app
6. Copy the config values to `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=xxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=xxx.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=xxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=xxx.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxx
NEXT_PUBLIC_FIREBASE_APP_ID=xxx
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://xxx-default-rtdb.firebaseio.com
```

7. Apply security rules from `firebase-rules.json` in the Firebase Console

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Production Build

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/
│   ├── globals.css        # Global styles
│   ├── Dashboard.module.css # Component styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main page
├── components/
│   ├── Dashboard.tsx      # Main dashboard component
│   ├── NoteCard.tsx       # Individual note card
│   └── NoteModal.tsx      # Add/edit modal
├── data/
│   └── seed.ts            # Initial data from workshop
├── lib/
│   ├── db.ts              # Database operations
│   ├── firebase.ts        # Firebase configuration
│   └── hooks.ts           # React hooks
└── types/
    └── index.ts           # TypeScript types
```

## Data Model

### Note
```typescript
interface Note {
  id: string;
  text: string;
  category: 'opportunities' | 'enablers' | 'actors';
  timeframe: '10months' | '3years' | '10years' | 'foundational';
  votes: number;
  tags: string[];
  connections: string[];
  createdAt: number;
  updatedAt: number;
}
```

### Connection
```typescript
interface Connection {
  id: string;
  sourceId: string;
  targetId: string;
  label?: string;
  createdAt: number;
}
```

## Contributing

See [TODO.md](./TODO.md) for the current task list.

## Licence

Private - SI Units Limited
