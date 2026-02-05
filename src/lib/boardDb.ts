import { ref, set, get, remove, onValue, off, update } from 'firebase/database';
import { getDb } from './firebase';
import { Board, BoardColumn, BoardRow, Note } from '@/types';
import { v4 as uuidv4 } from 'uuid';

const BOARDS_PATH = 'boards';

// Helper to remove undefined values recursively (Firebase doesn't accept them at any level)
function cleanObject<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => cleanObject(item)) as T;
  }

  if (typeof obj === 'object') {
    const cleaned: Record<string, any> = {};
    Object.keys(obj as Record<string, any>).forEach(key => {
      const value = (obj as Record<string, any>)[key];
      if (value !== undefined) {
        cleaned[key] = cleanObject(value);
      }
    });
    return cleaned as T;
  }

  return obj;
}

export async function createBoard(data: {
  name: string;
  description?: string;
  columns: BoardColumn[];
  rows: BoardRow[];
  createdBy?: string;
  createdById?: string;
}): Promise<Board> {
  const db = getDb();
  const id = uuidv4();
  const now = Date.now();

  const board: Board = cleanObject({
    id,
    name: data.name,
    description: data.description,
    columns: data.columns,
    rows: data.rows,
    createdAt: now,
    updatedAt: now,
    createdBy: data.createdBy,
    createdById: data.createdById,
    archived: false,
  });

  await set(ref(db, `${BOARDS_PATH}/${id}`), board);
  return board;
}

export async function updateBoard(id: string, data: Partial<Board>): Promise<void> {
  const db = getDb();
  await update(ref(db, `${BOARDS_PATH}/${id}`), cleanObject({
    ...data,
    updatedAt: Date.now(),
  }));
}

export async function archiveBoard(id: string, archivedBy: string): Promise<void> {
  const db = getDb();
  await update(ref(db, `${BOARDS_PATH}/${id}`), {
    archived: true,
    archivedAt: Date.now(),
    archivedBy,
    updatedAt: Date.now(),
  });
}

export async function unarchiveBoard(id: string, unarchivedBy: string): Promise<void> {
  const db = getDb();
  await update(ref(db, `${BOARDS_PATH}/${id}`), {
    archived: false,
    unarchivedAt: Date.now(),
    unarchivedBy,
    updatedAt: Date.now(),
  });
}

export async function deleteBoard(id: string): Promise<void> {
  const db = getDb();
  await remove(ref(db, `${BOARDS_PATH}/${id}`));
  // Also delete all notes for this board
  const notesRef = ref(db, 'notes');
  const snapshot = await get(notesRef);
  if (snapshot.exists()) {
    const notes = snapshot.val();
    for (const noteId of Object.keys(notes)) {
      if (notes[noteId].boardId === id) {
        await remove(ref(db, `notes/${noteId}`));
      }
    }
  }
}

export async function getBoard(id: string): Promise<Board | null> {
  const db = getDb();
  const snapshot = await get(ref(db, `${BOARDS_PATH}/${id}`));
  if (!snapshot.exists()) return null;
  return snapshot.val() as Board;
}

export async function getAllBoards(): Promise<Board[]> {
  const db = getDb();
  const snapshot = await get(ref(db, BOARDS_PATH));
  if (!snapshot.exists()) return [];
  return Object.values(snapshot.val()) as Board[];
}

export function subscribeToBoards(callback: (boards: Board[]) => void): () => void {
  const db = getDb();
  const boardsRef = ref(db, BOARDS_PATH);

  const handleValue = (snapshot: any) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }
    const boards = Object.values(snapshot.val()) as Board[];
    // Sort by updatedAt descending, archived boards last
    boards.sort((a, b) => {
      if (a.archived && !b.archived) return 1;
      if (!a.archived && b.archived) return -1;
      return b.updatedAt - a.updatedAt;
    });
    callback(boards);
  };

  onValue(boardsRef, handleValue);
  return () => off(boardsRef, 'value', handleValue);
}

export async function duplicateBoard(
  boardId: string,
  newName: string,
  createdById?: string,
  createdBy?: string
): Promise<Board> {
  const db = getDb();
  const original = await getBoard(boardId);
  if (!original) throw new Error('Board not found');

  const newBoard = await createBoard({
    name: newName,
    description: original.description,
    columns: original.columns,
    rows: original.rows,
    createdBy,
    createdById,
  });

  // Copy notes
  const notesRef = ref(db, 'notes');
  const snapshot = await get(notesRef);
  if (snapshot.exists()) {
    const notes = snapshot.val();
    for (const noteId of Object.keys(notes)) {
      const note = notes[noteId] as Note;
      if (note.boardId === boardId) {
        const newNoteId = uuidv4();
        await set(ref(db, `notes/${newNoteId}`), cleanObject({
          ...note,
          id: newNoteId,
          boardId: newBoard.id,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          comments: [],
          history: [],
        }));
      }
    }
  }

  return newBoard;
}
