'use client';

import { useState, useEffect } from 'react';
import { subscribeToActivity, Activity, ActivityType } from '@/lib/activityDb';
import styles from '@/app/Dashboard.module.css';

interface ActivityFeedProps {
  boardId: string;
}

const activityLabels: Record<ActivityType, string> = {
  note_created: 'created a note',
  note_edited: 'edited a note',
  note_deleted: 'deleted a note',
  note_moved: 'moved a note',
  vote: 'voted on a note',
  comment_added: 'added a comment',
  connection_created: 'connected notes',
};

export function ActivityFeed({ boardId }: ActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToActivity(boardId, setActivities);
    return () => unsubscribe();
  }, [boardId]);

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    
    return new Date(timestamp).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
    });
  };

  if (activities.length === 0) return null;

  const displayedActivities = isExpanded ? activities : activities.slice(0, 5);

  return (
    <div className={styles.activityFeed}>
      <div className={styles.activityHeader}>
        <h3>Recent Activity</h3>
        <button 
          className={styles.activityToggle}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? 'Show less' : `Show all (${activities.length})`}
        </button>
      </div>
      <div className={styles.activityList}>
        {displayedActivities.map((activity) => (
          <div key={activity.id} className={styles.activityItem}>
            <div 
              className={styles.activityAvatar}
              style={{ backgroundColor: activity.userColour }}
            >
              {activity.userName.charAt(0).toUpperCase()}
            </div>
            <div className={styles.activityContent}>
              <span className={styles.activityUser}>{activity.userName}</span>
              <span className={styles.activityAction}>
                {activityLabels[activity.type]}
              </span>
              {activity.noteText && (
                <span className={styles.activityNote}>"{activity.noteText}"</span>
              )}
              {activity.details && (
                <span className={styles.activityDetails}>{activity.details}</span>
              )}
            </div>
            <span className={styles.activityTime}>{formatTime(activity.timestamp)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
