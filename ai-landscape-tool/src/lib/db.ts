import {
  ref,
  set,
  get,
  remove,
  onValue,
  off,
  update,
  push,
} from 'firebase/database';
import { getDb } from './firebase';
import { Note, Connection, Comment } from '@/types';
import { v4 as uuidv4 } from 'uuid';

const NOTES_PATH = 'notes';
const CONNECTIONS_PATH = 'connections';

export async function createNote(data: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<Note> {
  const db = getDb();
  const id = uuidv4();
  const now = Date.now();

  const note: Note = {
    ...data,
    id,
    createdAt: now,
    updatedAt: now,
    votes: data.votes || 0,
    tags: data.tags || [],
    connections: data.connections || [],
    comments: data.comments || [],
    history: data.history || [],
  };

  await set(ref(db, `${NOTES_PATH}/${id}`), note);
  return note;
}

export async function updateNote(id: string, data: Partial<Note>): Promise<void> {
  const db = getDb();
  await update(ref(db, `${NOTES_PATH}/${id}`), {
    ...data,
    updatedAt: Date.now(),
  });
}

export async function deleteNote(id: string): Promise<void> {
  const db = getDb();
  await remove(ref(db, `${NOTES_PATH}/${id}`));
}

export async function getNote(id: string): Promise<Note | null> {
  const db = getDb();
  const snapshot = await get(ref(db, `${NOTES_PATH}/${id}`));
  if (!snapshot.exists()) return null;
  return snapshot.val() as Note;
}

export async function getAllNotes(): Promise<Note[]> {
  const db = getDb();
  const snapshot = await get(ref(db, NOTES_PATH));
  if (!snapshot.exists()) return [];
  return Object.values(snapshot.val()) as Note[];
}

export function subscribeToNotes(callback: (notes: Note[]) => void): () => void {
  const db = getDb();
  const notesRef = ref(db, NOTES_PATH);

  const handleValue = (snapshot: any) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }
    const notes = Object.values(snapshot.val()) as Note[];
    callback(notes);
  };

  onValue(notesRef, handleValue);
  return () => off(notesRef, 'value', handleValue);
}

export async function createConnection(
  sourceId: string,
  targetId: string,
  boardId?: string
): Promise<Connection> {
  const db = getDb();
  const id = uuidv4();
  
  const connection: Connection = {
    id,
    sourceId,
    targetId,
    boardId,
  };
  
  await set(ref(db, `${CONNECTIONS_PATH}/${id}`), connection);
  return connection;
}

export async function deleteConnection(id: string): Promise<void> {
  const db = getDb();
  await remove(ref(db, `${CONNECTIONS_PATH}/${id}`));
}

export function subscribeToConnections(callback: (connections: Connection[]) => void): () => void {
  const db = getDb();
  const connectionsRef = ref(db, CONNECTIONS_PATH);

  const handleValue = (snapshot: any) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }
    const connections = Object.values(snapshot.val()) as Connection[];
    callback(connections);
  };

  onValue(connectionsRef, handleValue);
  return () => off(connectionsRef, 'value', handleValue);
}

export async function addComment(
  noteId: string,
  text: string,
  author: string,
  authorId: string
): Promise<Comment> {
  const db = getDb();
  const id = uuidv4();
  const comment: Comment = {
    id,
    text,
    author,
    authorId,
    createdAt: Date.now(),
  };

  const noteRef = ref(db, `${NOTES_PATH}/${noteId}`);
  const snapshot = await get(noteRef);
  if (snapshot.exists()) {
    const note = snapshot.val() as Note;
    const comments = note.comments || [];
    await update(noteRef, { comments: [...comments, comment] });
  }

  return comment;
}

export async function deleteComment(noteId: string, commentId: string): Promise<void> {
  const db = getDb();
  const noteRef = ref(db, `${NOTES_PATH}/${noteId}`);
  const snapshot = await get(noteRef);
  if (snapshot.exists()) {
    const note = snapshot.val() as Note;
    const comments = (note.comments || []).filter((c: Comment) => c.id !== commentId);
    await update(noteRef, { comments });
  }
}

export async function voteForNote(id: string, increment: number): Promise<void> {
  const db = getDb();
  const noteRef = ref(db, `${NOTES_PATH}/${id}`);
  const snapshot = await get(noteRef);
  if (snapshot.exists()) {
    const note = snapshot.val() as Note;
    const newVotes = (note.votes || 0) + increment;
    await update(noteRef, { votes: newVotes, updatedAt: Date.now() });
  }
}

export async function seedDatabase(): Promise<void> {
  // No-op - kept for backwards compatibility
}
