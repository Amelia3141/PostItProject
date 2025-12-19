'use client';

import { useState, useEffect } from 'react';
import { Note, Category, Timeframe, Comment, NoteVersion } from '@/types';
import { addComment, deleteComment } from '@/lib/db';
import { useUser } from '@/lib/userContext';
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
}: NoteModalProps) {
  const { user } = useUser();
  const [text, setText] = useState('');
  const [category, setCategory] = useState<string>(categories[0]?.id || '');
  const [timeframe, setTimeframe] = useState<string>(timeframes[0]?.id || '');
  const [tagsInput, setTagsInput] = useState('');
  const [votes, setVotes] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (note) {
      setText(note.text);
      setCategory(note.category);
      setTimeframe(note.timeframe);
      setTagsInput((note.tags || []).join(', '));
      setVotes(note.votes || 0);
      setComments(note.comments || []);
    } else {
      setText('');
      setCategory(categories[0]?.id || '');
      setTimeframe(timeframes[0]?.id || '');
      setTagsInput('');
      setVotes(0);
      setComments([]);
    }
    setShowHistory(false);
  }, [note, categories, timeframes]);

  if (!isOpen) return null;

  const handleSave = async () => {
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
    if (note && confirm('Are you sure you want to delete this note?')) {
      await onDelete(note.id);
      onClose();
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !user) return;
    
    if (note) {
      await addComment(note.id, newComment.trim(), user.name, user.id);
      setComments([...comments, {
        id: Date.now().toString(),
        text: newComment.trim(),
        author: user.name,
        authorId: user.id,
        createdAt: Date.now(),
      }]);
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
    if (note && confirm('Restore this version? Current changes will be saved to history.')) {
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
          <div className={styles.noteMeta}>
            <span>Created by: {note.createdBy || 'Unknown'}</span>
            {note.lastEditedBy && note.lastEditedBy !== note.createdBy && (
              <span> • Last edited by: {note.lastEditedBy}</span>
            )}
          </div>
        )}

        <div className={styles.formGroup}>
          <label>Content</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter your idea..."
          />
        </div>

        <div className={styles.formGroup}>
          <label>Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label>Timeframe</label>
          <select value={timeframe} onChange={(e) => setTimeframe(e.target.value)}>
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
          />
        </div>

        <div className={styles.voteControls}>
          <span>Votes: {votes}</span>
          <button className={styles.voteBtn} onClick={() => note && onVote(note.id, -1)}>
            -1 Vote
          </button>
          <button className={styles.voteBtn} onClick={() => note && onVote(note.id, 1)}>
            +1 Vote
          </button>
        </div>

        {note && note.history && note.history.length > 0 && (
          <div className={styles.historySection}>
            <h3 className={styles.historyTitle}>
              <span>Version History ({note.history.length})</span>
              <button 
                className={styles.filterBtn}
                onClick={() => setShowHistory(!showHistory)}
              >
                {showHistory ? 'Hide' : 'Show'}
              </button>
            </h3>
            {showHistory && (
              <div className={styles.historyList}>
                {[...note.history].reverse().map((version) => (
                  <div key={version.id} className={styles.historyItem}>
                    <div>
                      <div className={styles.historyText}>
                        {version.text.length > 50 ? version.text.substring(0, 50) + '...' : version.text}
                      </div>
                      <div className={styles.historyMeta}>
                        {version.editedBy} • {formatDate(version.timestamp)}
                      </div>
                    </div>
                    <button 
                      className={styles.restoreBtn}
                      onClick={() => handleRestore(version)}
                    >
                      Restore
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {note && (
          <div className={styles.commentsSection}>
            <h3 className={styles.commentsTitle}>
              Comments ({comments.length})
            </h3>
            
            <div className={styles.commentsList}>
              {comments.length === 0 ? (
                <p className={styles.noComments}>No comments yet</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className={styles.comment}>
                    <div className={styles.commentHeader}>
                      <span className={styles.commentAuthor}>{comment.author}</span>
                      <span className={styles.commentDate}>{formatDate(comment.createdAt)}</span>
                      <button 
                        className={styles.commentDelete}
                        onClick={() => handleDeleteComment(comment.id)}
                      >
                        ✕
                      </button>
                    </div>
                    <p className={styles.commentText}>{comment.text}</p>
                  </div>
                ))
              )}
            </div>

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
          </div>
        )}

        <div className={styles.modalActions}>
          <button className={styles.saveBtn} onClick={handleSave}>
            {note ? 'Save Changes' : 'Create Note'}
          </button>
          <button className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          {note && (
            <button className={styles.deleteBtn} onClick={handleDelete}>
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
