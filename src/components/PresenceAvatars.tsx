'use client';

import { useState, useEffect } from 'react';
import { subscribeToPresence, setUserPresence, PresenceUser } from '@/lib/presence';
import { useUser } from '@/lib/userContext';
import styles from '@/app/Dashboard.module.css';

interface PresenceAvatarsProps {
  boardId: string;
}

export function PresenceAvatars({ boardId }: PresenceAvatarsProps) {
  const { user } = useUser();
  const [activeUsers, setActiveUsers] = useState<PresenceUser[]>([]);

  // Set own presence
  useEffect(() => {
    if (!user || !boardId) return;
    
    const cleanup = setUserPresence(user, boardId);
    return cleanup;
  }, [user, boardId]);

  // Subscribe to others' presence
  useEffect(() => {
    if (!boardId) return;
    
    const unsubscribe = subscribeToPresence(boardId, setActiveUsers);
    return unsubscribe;
  }, [boardId]);

  // Filter out current user for display
  const otherUsers = activeUsers.filter(u => u.id !== user?.id);

  if (otherUsers.length === 0) return null;

  return (
    <div className={styles.presenceContainer}>
      <span className={styles.presenceLabel}>
        {otherUsers.length} other{otherUsers.length !== 1 ? 's' : ''} viewing:
      </span>
      <div className={styles.presenceAvatars}>
        {otherUsers.slice(0, 5).map((u) => (
          <div
            key={u.id}
            className={styles.presenceAvatar}
            style={{ backgroundColor: u.colour }}
            title={u.name}
          >
            {u.name.charAt(0).toUpperCase()}
          </div>
        ))}
        {otherUsers.length > 5 && (
          <div className={styles.presenceMore}>
            +{otherUsers.length - 5}
          </div>
        )}
      </div>
    </div>
  );
}
