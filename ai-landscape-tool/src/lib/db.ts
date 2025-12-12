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
import { getDb as getFirebaseDatabase } from './firebase';
import { Note, Connection, Workshop } from '@/types';
import { v4 as uuidv4 } from 'uuid';

const NOTES_PATH = 'notes';
const CONNECTIONS_PATH = 'connections';
const WORKSHOPS_PATH = 'workshops';

// Helper to get database reference
function getDbRef(path: string): DatabaseReference {
  const db = getFirebaseDatabase();
  return ref(db, path);
}

// ==================== NOTES ====================

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
  
  // Return unsubscribe function
  return () => off(notesRef, 'value', handleValue);
}

export async function voteForNote(id: string, increment: number = 1): Promise<void> {
  const note = await getNote(id);
  if (note) {
    await updateNote(id, { votes: Math.max(0, note.votes + increment) });
  }
}

export async function addTagToNote(id: string, tag: string): Promise<void> {
  const note = await getNote(id);
  if (note && !note.tags.includes(tag)) {
    await updateNote(id, { tags: [...note.tags, tag] });
  }
}

export async function removeTagFromNote(id: string, tag: string): Promise<void> {
  const note = await getNote(id);
  if (note) {
    await updateNote(id, { tags: note.tags.filter((t) => t !== tag) });
  }
}

// ==================== CONNECTIONS ====================

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
  
  // Update both notes to include the connection
  const [sourceNote, targetNote] = await Promise.all([
    getNote(sourceId),
    getNote(targetId),
  ]);
  
  if (sourceNote && !sourceNote.connections.includes(targetId)) {
    await updateNote(sourceId, {
      connections: [...sourceNote.connections, targetId],
    });
  }
  
  if (targetNote && !targetNote.connections.includes(sourceId)) {
    await updateNote(targetId, {
      connections: [...targetNote.connections, sourceId],
    });
  }
  
  return connection;
}

export async function deleteConnection(id: string): Promise<void> {
  const connectionRef = getDbRef(`${CONNECTIONS_PATH}/${id}`);
  const snapshot = await get(connectionRef);
  
  if (snapshot.exists()) {
    const connection = snapshot.val() as Connection;
    
    // Remove connection references from notes
    const [sourceNote, targetNote] = await Promise.all([
      getNote(connection.sourceId),
      getNote(connection.targetId),
    ]);
    
    if (sourceNote) {
      await updateNote(connection.sourceId, {
        connections: sourceNote.connections.filter((c) => c !== connection.targetId),
      });
    }
    
    if (targetNote) {
      await updateNote(connection.targetId, {
        connections: targetNote.connections.filter((c) => c !== connection.sourceId),
      });
    }
    
    await remove(connectionRef);
  }
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

// ==================== WORKSHOPS ====================

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

// ==================== SEED DATA ====================

export async function seedDatabase(notes: Note[]): Promise<void> {
  const existingNotes = await getAllNotes();
  
  if (existingNotes.length > 0) {
    console.log('Database already has notes, skipping seed');
    return;
  }
  
  const updates: Record<string, Note> = {};
  notes.forEach((note) => {
    updates[`${NOTES_PATH}/${note.id}`] = note;
  });
  
  const db = getFirebaseDatabase();
  await update(ref(db), updates);
  console.log(`Seeded ${notes.length} notes`);
}
