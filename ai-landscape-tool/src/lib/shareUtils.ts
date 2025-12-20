import { getDb } from './firebase';
import { ref, set, get } from 'firebase/database';
import { v4 as uuidv4 } from 'uuid';

const SHARES_PATH = 'shares';

export interface BoardShare {
  id: string;
  boardId: string;
  permission: 'view' | 'edit';
  createdAt: number;
  createdBy: string;
  createdById: string;
  expiresAt?: number;
}

export async function createShareLink(
  boardId: string,
  permission: 'view' | 'edit',
  userName: string,
  userId: string,
  expiresInDays?: number
): Promise<string> {
  const db = getDb();
  const shareId = uuidv4().substring(0, 8); // Short shareable ID
  
  const share: BoardShare = {
    id: shareId,
    boardId,
    permission,
    createdAt: Date.now(),
    createdBy: userName,
    createdById: userId,
    expiresAt: expiresInDays ? Date.now() + (expiresInDays * 24 * 60 * 60 * 1000) : undefined,
  };
  
  await set(ref(db, `${SHARES_PATH}/${shareId}`), share);
  
  return shareId;
}

export async function getShareLink(shareId: string): Promise<BoardShare | null> {
  const db = getDb();
  const snapshot = await get(ref(db, `${SHARES_PATH}/${shareId}`));
  
  if (!snapshot.exists()) return null;
  
  const share = snapshot.val() as BoardShare;
  
  // Check if expired
  if (share.expiresAt && share.expiresAt < Date.now()) {
    return null;
  }
  
  return share;
}

export async function revokeShareLink(shareId: string): Promise<void> {
  const db = getDb();
  await set(ref(db, `${SHARES_PATH}/${shareId}`), null);
}
