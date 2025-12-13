import {
  ref,
  set,
  get,
  push,
  update,
  remove,
  onValue,
  off,
  DataSnapshot,
  DatabaseReference,
} from 'firebase/database';
import { getDb } from './firebase';
import { Note, Connection, Workshop } from '@/types';
import { v4 as uuidv4 } from 'uuid';

const NOTES_PATH = 'notes';
const CONNECTIONS_PATH = 'connections';
const WORKSHOPS_PATH = 'workshops';

function getDbRef(path: string): DatabaseReference {
  const db = getDb();
  return ref(db, path);
}

export async function createNote(note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<Note> {
  const id = uuidv4();
  const now = Date.now();
  const newNote: Note = {
    ...note,
    id,
    createdAt: now,
    updatedAt: now,
  };
  
  await set(getDbRef(`${NOTES_PATH}/${id}`), newNote);
  return newNote;
}

export async function updateNote(id: string, updates: Partial<Note>): Promise<void> {
  const updateData = {
    ...updates,
    updatedAt: Date.now(),
  };
  await update(getDbRef(`${NOTES_PATH}/${id}`), updateData);
}

export async function deleteNote(id: string): Promise<void> {
  await remove(getDbRef(`${NOTES_PATH}/${id}`));
}

export async function getNote(id: string): Promise<Note | null> {
  const snapshot = await get(getDbRef(`${NOTES_PATH}/${id}`));
  return snapshot.exists() ? (snapshot.val() as Note) : null;
}

export async function getAllNotes(): Promise<Note[]> {
  const snapshot = await get(getDbRef(NOTES_PATH));
  if (!snapshot.exists()) return [];
  
  const data = snapshot.val();
  return Object.values(data) as Note[];
}

export function subscribeToNotes(callback: (notes: Note[]) => void): () => void {
  const notesRef = getDbRef(NOTES_PATH);
  
  const handleValue = (snapshot: DataSnapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }
    const data = snapshot.val();
    const notes = Object.values(data) as Note[];
    callback(notes);
  };
  
  onValue(notesRef, handleValue);
  
  return () => off(notesRef, 'value', handleValue);
}

export async function voteForNote(id: string, increment: number = 1): Promise<void> {
  const note = await getNote(id);
  if (note) {
    await updateNote(id, { votes: Math.max(0, (note.votes || 0) + increment) });
  }
}

export async function addTagToNote(id: string, tag: string): Promise<void> {
  const note = await getNote(id);
  if (note && !(note.tags || []).includes(tag)) {
    await updateNote(id, { tags: [...(note.tags || []), tag] });
  }
}

export async function removeTagFromNote(id: string, tag: string): Promise<void> {
  const note = await getNote(id);
  if (note) {
    await updateNote(id, { tags: (note.tags || []).filter((t) => t !== tag) });
  }
}

export async function createConnection(
  sourceId: string,
  targetId: string,
  label?: string
): Promise<Connection> {
  const id = uuidv4();
  const connection: Connection = {
    id,
    sourceId,
    targetId,
    label,
    createdAt: Date.now(),
  };
  
  await set(getDbRef(`${CONNECTIONS_PATH}/${id}`), connection);
  return connection;
}

export async function deleteConnection(id: string): Promise<void> {
  await remove(getDbRef(`${CONNECTIONS_PATH}/${id}`));
}

export async function getAllConnections(): Promise<Connection[]> {
  const snapshot = await get(getDbRef(CONNECTIONS_PATH));
  if (!snapshot.exists()) return [];
  
  const data = snapshot.val();
  return Object.values(data) as Connection[];
}

export function subscribeToConnections(callback: (connections: Connection[]) => void): () => void {
  const connectionsRef = getDbRef(CONNECTIONS_PATH);
  
  const handleValue = (snapshot: DataSnapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }
    const data = snapshot.val();
    const connections = Object.values(data) as Connection[];
    callback(connections);
  };
  
  onValue(connectionsRef, handleValue);
  
  return () => off(connectionsRef, 'value', handleValue);
}

export async function createWorkshop(
  workshop: Omit<Workshop, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Workshop> {
  const id = uuidv4();
  const now = Date.now();
  const newWorkshop: Workshop = {
    ...workshop,
    id,
    createdAt: now,
    updatedAt: now,
  };
  
  await set(getDbRef(`${WORKSHOPS_PATH}/${id}`), newWorkshop);
  return newWorkshop;
}

export async function getWorkshop(id: string): Promise<Workshop | null> {
  const snapshot = await get(getDbRef(`${WORKSHOPS_PATH}/${id}`));
  return snapshot.exists() ? (snapshot.val() as Workshop) : null;
}

export async function seedDatabase(notes: Note[]): Promise<void> {
  const existingNotes = await getAllNotes();
  
  if (existingNotes.length > 0) {
    console.log('Database already has notes, skipping seed');
    return;
  }
  
  const db = getDb();
  const updates: Record<string, Note> = {};
  notes.forEach((note) => {
    updates[`${NOTES_PATH}/${note.id}`] = note;
  });
  
  await update(ref(db), updates);
  console.log(`Seeded ${notes.length} notes`);
}
