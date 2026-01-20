'use client';

import { useState } from 'react';
import { createShareLink } from '@/lib/shareUtils';
import { useUser } from '@/lib/userContext';
import styles from '@/app/Dashboard.module.css';

interface ShareModalProps {
  boardId: string;
  boardName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ShareModal({ boardId, boardName, isOpen, onClose }: ShareModalProps) {
  const { user } = useUser();
  const [permission, setPermission] = useState<'view' | 'edit'>('edit');
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleCreateLink = async () => {
    if (!user) return;
    
    setLoading(true);
    const shareId = await createShareLink(
      boardId,
      permission,
      user.name,
      user.id
    );
    
    const url = `${window.location.origin}/share/${shareId}`;
    setShareUrl(url);
    setLoading(false);
  };

  const handleCopy = async () => {
    if (shareUrl) {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={styles.modal} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.modalTitle}>Share "{boardName}"</h2>
        
        <div className={styles.formGroup}>
          <label>Permission level</label>
          <select 
            value={permission} 
            onChange={(e) => setPermission(e.target.value as 'view' | 'edit')}
          >
            <option value="edit">Can edit</option>
            <option value="view">Can view only</option>
          </select>
        </div>

        {!shareUrl ? (
          <button 
            className={styles.saveBtn} 
            onClick={handleCreateLink}
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Share Link'}
          </button>
        ) : (
          <div className={styles.shareUrlContainer}>
            <input 
              type="text" 
              value={shareUrl} 
              readOnly 
              className={styles.shareUrlInput}
            />
            <button className={styles.copyBtn} onClick={handleCopy}>
              {copied ? '✓ Copied!' : 'Copy'}
            </button>
          </div>
        )}

        <p className={styles.shareNote}>
          Anyone with this link can {permission === 'edit' ? 'view and edit' : 'view'} this board.
        </p>

        <div className={styles.modalActions}>
          <button className={styles.cancelBtn} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
