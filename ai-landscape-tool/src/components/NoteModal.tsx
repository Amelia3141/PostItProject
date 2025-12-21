'use client';

import { useState, useEffect } from 'react';
import { Note, Category, Timeframe, Comment, NoteVersion } from '@/types';
import { addComment, deleteComment } from '@/lib/db';
import { logActivity } from '@/lib/activityDb';
import { useUser } from '@/lib/userContext';
import { VersionHistory } from './VersionHistory';
import styles from '@/app/Dashboard.module.css';

interface NoteModalProps {
  note: Note | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'boardId'>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onVote: (id: string, increment: number) => Promise<void>;
  onRestoreVersion: (noteId: string, version: NoteVersion) => Promise<void>;
  categories: { id: string; label: string }[];
  timeframes: { id: string; label: string }[];
  readOnly?: boolean;
  boardId?: string;
}

export function NoteModal({ 
  note, 
  isOpen, 
  onClose, 
  onSave, 
  onDelete, 
  onVote, 
  onRestoreVersion,
  categories,
  timeframes,
  readOnly = false,
  boardId,
}: NoteModalProps) {
  const { user } = useUser();
  const [text, setText] = useState('');
  const [category, setCategory] = useState<string>(categories[0]?.id || '');
  const [timeframe, setTimeframe] = useState<string>(timeframes[0]?.id || '');
  const [tagsInput, setTagsInput] = useState('');
  const [votes, setVotes] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [activeTab, setActiveTab] = useState<'edit' | 'history' | 'comments'>('edit');

  useEffect(() => {
    if (note) {
      setText(note.text);
      setCategory(note.category);
      setTimeframe(note.timeframe);
      setTagsInput((note.tags || []).join(', '));
      setVotes(note.votes || 0);
      setComments(note.comments || []);
      setActiveTab('edit');
    } else {
      setText('');
      setCategory(categories[0]?.id || '');
      setTimeframe(timeframes[0]?.id || '');
      setTagsInput('');
      setVotes(0);
      setComments([]);
      setActiveTab('edit');
    }
  }, [note, categories, timeframes]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (readOnly) return;
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    await onSave({
      text,
      category: category as Category,
      timeframe: timeframe as Timeframe,
      votes,
      tags,
      connections: note?.connections || [],
      comments,
    });
    onClose();
  };

  const handleDelete = async () => {
    if (readOnly) return;
    if (note && confirm('Are you sure you want to delete this note?')) {
      await onDelete(note.id);
      onClose();
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !user || !note) return;
    
    await addComment(note.id, newComment.trim(), user.name, user.id);
    const newCommentObj = {
      id: Date.now().toString(),
      text: newComment.trim(),
      author: user.name,
      authorId: user.id,
      createdAt: Date.now(),
    };
    setComments([...comments, newCommentObj]);
    
    if (boardId) {
      await logActivity(boardId, 'comment_added', user.id, user.name, user.colour, note.id, note.text);
    }
    
    setNewComment('');
  };

  const handleDeleteComment = async (commentId: string) => {
    if (note && confirm('Delete this comment?')) {
      await deleteComment(note.id, commentId);
      setComments(comments.filter(c => c.id !== commentId));
    }
  };

  const handleRestore = async (version: NoteVersion) => {
    if (readOnly || !note) return;
    if (confirm('Restore this version? The current content will be saved to history.')) {
      await onRestoreVersion(note.id, version);
      onClose();
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={styles.modal} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.modalTitle}>{note ? 'Edit Note' : 'New Note'}</h2>

        {note && (
          <>
            <div className={styles.noteMeta}>
              <span>Created by {note.createdBy || 'Unknown'} on {formatDate(note.createdAt)}</span>
              {note.lastEditedBy && note.lastEditedBy !== note.createdBy && (
                <span> | Last edited by {note.lastEditedBy}</span>
              )}
            </div>
            
            <div className={styles.modalTabs}>
              <button 
                className={`${styles.modalTab} ${activeTab === 'edit' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('edit')}
              >
                Edit
              </button>
              <button 
                className={`${styles.modalTab} ${activeTab === 'history' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('history')}
              >
                History ({note.history?.length || 0})
              </button>
              <button 
                className={`${styles.modalTab} ${activeTab === 'comments' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('comments')}
              >
                Comments ({comments.length})
              </button>
            </div>
          </>
        )}

        {activeTab === 'edit' && (
          <>
            <div className={styles.formGroup}>
              <label>Content</label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter your idea..."
                disabled={readOnly}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} disabled={readOnly}>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Timeframe</label>
              <select value={timeframe} onChange={(e) => setTimeframe(e.target.value)} disabled={readOnly}>
                {timeframes.map((tf) => (
                  <option key={tf.id} value={tf.id}>
                    {tf.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Tags (comma-separated)</label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="e.g. Q1, Priority, Research"
                disabled={readOnly}
              />
            </div>

            {!readOnly && note && (
              <div className={styles.voteControls}>
                <span>Votes: {votes}</span>
                <button className={styles.voteBtn} onClick={() => onVote(note.id, -1)}>
                  -1
                </button>
                <button className={styles.voteBtn} onClick={() => onVote(note.id, 1)}>
                  +1
                </button>
              </div>
            )}
          </>
        )}

        {activeTab === 'history' && note && (
          <VersionHistory 
            note={note} 
            onRestore={handleRestore}
            readOnly={readOnly}
          />
        )}

        {activeTab === 'comments' && note && (
          <div className={styles.commentsSection}>
            <div className={styles.commentsList}>
              {comments.length === 0 ? (
                <p className={styles.noComments}>No comments yet</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className={styles.comment}>
                    <div className={styles.commentHeader}>
                      <span className={styles.commentAuthor}>{comment.author}</span>
                      <span className={styles.commentDate}>{formatDate(comment.createdAt)}</span>
                      {!readOnly && (
                        <button 
                          className={styles.commentDelete}
                          onClick={() => handleDeleteComment(comment.id)}
                        >
                          x
                        </button>
                      )}
                    </div>
                    <p className={styles.commentText}>{comment.text}</p>
                  </div>
                ))
              )}
            </div>

            {!readOnly && (
              <div className={styles.addComment}>
                <textarea
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className={styles.commentInput}
                />
                <button 
                  className={styles.addCommentBtn}
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                >
                  Add Comment
                </button>
              </div>
            )}
          </div>
        )}

        <div className={styles.modalActions}>
          {!readOnly && activeTab === 'edit' && (
            <button className={styles.saveBtn} onClick={handleSave}>
              {note ? 'Save Changes' : 'Create Note'}
            </button>
          )}
          <button className={styles.cancelBtn} onClick={onClose}>
            {readOnly ? 'Close' : 'Cancel'}
          </button>
          {!readOnly && note && activeTab === 'edit' && (
            <button className={styles.deleteBtn} onClick={handleDelete}>
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
