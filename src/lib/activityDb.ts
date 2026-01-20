import { ref, set, onValue, off, query, orderByChild, limitToLast } from 'firebase/database';
import { getDb } from './firebase';
import { v4 as uuidv4 } from 'uuid';

const ACTIVITY_PATH = 'activity';

export type ActivityType = 'note_created' | 'note_edited' | 'note_deleted' | 'note_moved' | 'vote' | 'comment_added' | 'connection_created';

export interface Activity {
  id: string;
  boardId: string;
  type: ActivityType;
  userId: string;
  userName: string;
  userColour: string;
  noteId?: string;
  noteText?: string;
  details?: string;
  timestamp: number;
}

export async function logActivity(
  boardId: string,
  type: ActivityType,
  userId: string,
  userName: string,
  userColour: string,
  noteId?: string,
  noteText?: string,
  details?: string
): Promise<void> {
  const db = getDb();
  const id = uuidv4();
  
  const activity: Record<string, any> = {
    id,
    boardId,
    type,
    userId,
    userName,
    userColour,
    timestamp: Date.now(),
  };
  
  // Only add optional fields if they have values
  if (noteId) activity.noteId = noteId;
  if (noteText) activity.noteText = noteText.length > 50 ? noteText.substring(0, 50) + '...' : noteText;
  if (details) activity.details = details;
  
  await set(ref(db, `${ACTIVITY_PATH}/${boardId}/${id}`), activity);
}

export function subscribeToActivity(
  boardId: string,
  callback: (activities: Activity[]) => void,
  limit: number = 50
): () => void {
  const db = getDb();
  const activityRef = query(
    ref(db, `${ACTIVITY_PATH}/${boardId}`),
    orderByChild('timestamp'),
    limitToLast(limit)
  );
  
  const handleValue = (snapshot: any) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }
    
    const data = snapshot.val();
    const activities = Object.values(data) as Activity[];
    activities.sort((a, b) => b.timestamp - a.timestamp);
    callback(activities);
  };
  
  onValue(activityRef, handleValue);
  return () => off(activityRef, 'value', handleValue);
}
