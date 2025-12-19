import {
  ref,
  set,
  get,
  update,
  remove,
  onValue,
  off,
  query,
  orderByChild,
  equalTo,
  DataSnapshot,
} from 'firebase/database';
import { getDb } from './firebase';
import { Board, Note, Connection } from '@/types';
import { v4 as uuidv4 } from 'uuid';

const BOARDS_PATH = 'boards';
const NOTES_PATH = 'notes';
const CONNECTIONS_PATH = 'connections';

function getDbRef(path: string) {
  const db = getDb();
  return ref(db, path);
}

// Board CRUD
export async function createBoard(board: Omit<Board, 'id' | 'createdAt' | 'updatedAt'>): Promise<Board> {
  const id = uuidv4();
  const now = Date.now();
  const newBoard: Board = {
    ...board,
    id,
    createdAt: now,
    updatedAt: now,
  };
  
  await set(getDbRef(BOARDS_PATH + '/' + id), newBoard);
  return newBoard;
}

export async function updateBoard(id: string, updates: Partial<Board>): Promise<void> {
  await update(getDbRef(BOARDS_PATH + '/' + id), {
    ...updates,
    updatedAt: Date.now(),
  });
}

export async function deleteBoard(id: string): Promise<void> {
  // Delete board
  await remove(getDbRef(BOARDS_PATH + '/' + id));
  
  // Note: In production, you'd also delete associated notes and connections
  // For now, they'll just be orphaned
}

export async function getBoard(id: string): Promise<Board | null> {
  const snapshot = await get(getDbRef(BOARDS_PATH + '/' + id));
  return snapshot.exists() ? (snapshot.val() as Board) : null;
}

export async function getAllBoards(): Promise<Board[]> {
  const snapshot = await get(getDbRef(BOARDS_PATH));
  if (!snapshot.exists()) return [];
  return Object.values(snapshot.val()) as Board[];
}

export function subscribeToBoards(callback: (boards: Board[]) => void): () => void {
  const boardsRef = getDbRef(BOARDS_PATH);
  
  const handleValue = (snapshot: DataSnapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }
    const boards = Object.values(snapshot.val()) as Board[];
    // Sort by most recently updated
    boards.sort((a, b) => b.updatedAt - a.updatedAt);
    callback(boards);
  };
  
  onValue(boardsRef, handleValue);
  return () => off(boardsRef, 'value', handleValue);
}

// Duplicate a board with all its notes
export async function duplicateBoard(
  boardId: string, 
  newName: string,
  userId?: string,
  userName?: string
): Promise<Board> {
  const originalBoard = await getBoard(boardId);
  if (!originalBoard) throw new Error('Board not found');
  
  // Create new board
  const newBoard = await createBoard({
    name: newName,
    description: originalBoard.description,
    columns: originalBoard.columns,
    rows: originalBoard.rows,
    createdBy: userName,
    createdById: userId,
  });
  
  // Get all notes from original board
  const notesSnapshot = await get(getDbRef(NOTES_PATH));
  if (notesSnapshot.exists()) {
    const allNotes = Object.values(notesSnapshot.val()) as Note[];
    const boardNotes = allNotes.filter(n => n.boardId === boardId);
    
    // Create copies of notes for new board
    for (const note of boardNotes) {
      const newNoteId = uuidv4();
      const newNote: Note = {
        ...note,
        id: newNoteId,
        boardId: newBoard.id,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        history: [],
        comments: [],
      };
      await set(getDbRef(NOTES_PATH + '/' + newNoteId), newNote);
    }
  }
  
  return newBoard;
}
