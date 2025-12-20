import { getDb } from './firebase';
import { ref, set, onValue, off, onDisconnect, serverTimestamp } from 'firebase/database';
import { User } from '@/types';

const PRESENCE_PATH = 'presence';

export interface PresenceUser {
  id: string;
  name: string;
  colour: string;
  boardId: string;
  lastSeen: number;
}

export function setUserPresence(user: User, boardId: string): () => void {
  const db = getDb();
  const presenceRef = ref(db, `${PRESENCE_PATH}/${boardId}/${user.id}`);
  
  const presenceData: PresenceUser = {
    id: user.id,
    name: user.name,
    colour: user.colour,
    boardId,
    lastSeen: Date.now(),
  };
  
  // Set presence
  set(presenceRef, presenceData);
  
  // Update lastSeen every 30 seconds
  const interval = setInterval(() => {
    set(presenceRef, { ...presenceData, lastSeen: Date.now() });
  }, 30000);
  
  // Remove on disconnect
  onDisconnect(presenceRef).remove();
  
  // Cleanup function
  return () => {
    clearInterval(interval);
    set(presenceRef, null);
  };
}

export function subscribeToPresence(
  boardId: string, 
  callback: (users: PresenceUser[]) => void
): () => void {
  const db = getDb();
  const presenceRef = ref(db, `${PRESENCE_PATH}/${boardId}`);
  
  const handleValue = (snapshot: any) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }
    
    const data = snapshot.val();
    const users = Object.values(data) as PresenceUser[];
    
    // Filter out stale users (not seen in last 60 seconds)
    const activeUsers = users.filter(u => Date.now() - u.lastSeen < 60000);
    
    callback(activeUsers);
  };
  
  onValue(presenceRef, handleValue);
  
  return () => off(presenceRef, 'value', handleValue);
}
