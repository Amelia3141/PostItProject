'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { initFirebase } from '@/lib/firebase';
import { getBoard } from '@/lib/boardDb';
import { Board, Note } from '@/types';
import { ref, onValue } from 'firebase/database';
import { getDb } from '@/lib/firebase';
import styles from './embed.module.css';

export default function EmbedPage() {
  const params = useParams();
  const [board, setBoard] = useState<Board | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initFirebase();

    async function loadBoard() {
      const boardId = params.id as string;
      const boardData = await getBoard(boardId);

      if (!boardData) {
        setError('Board not found');
        setLoading(false);
        return;
      }

      setBoard(boardData);

      // Subscribe to notes
      const db = getDb();
      const notesRef = ref(db, 'notes');
      onValue(notesRef, (snapshot) => {
        if (snapshot.exists()) {
          const allNotes = Object.values(snapshot.val()) as Note[];
          const boardNotes = allNotes.filter(n => n.boardId === boardId);
          setNotes(boardNotes);
        }
        setLoading(false);
      });
    }

    loadBoard();
  }, [params.id]);

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  if (error || !board) {
    return <div className={styles.error}>{error || 'Board not found'}</div>;
  }

  const getNotesByCell = (rowId: string, colId: string) => {
    return notes.filter(n => n.category === rowId && n.timeframe === colId);
  };

  return (
    <div className={styles.embed}>
      <div className={styles.header}>
        <h1>{board.name}</h1>
        {board.description && <p>{board.description}</p>}
      </div>

      <div className={styles.board}>
        <div className={styles.boardHeader} style={{ gridTemplateColumns: `120px repeat(${board.columns.length}, 1fr)` }}>
          <div></div>
          {board.columns.map(col => (
            <div key={col.id} className={styles.colHeader}>{col.label}</div>
          ))}
        </div>

        {board.rows.map(row => (
          <div
            key={row.id}
            className={styles.boardRow}
            style={{ gridTemplateColumns: `120px repeat(${board.columns.length}, 1fr)` }}
          >
            <div className={`${styles.rowLabel} ${styles[row.colour]}`}>{row.label}</div>
            {board.columns.map(col => (
              <div key={col.id} className={styles.cell}>
                {getNotesByCell(row.id, col.id).map(note => (
                  <div key={note.id} className={`${styles.note} ${styles[row.colour]}`}>
                    <p>{note.text}</p>
                    {note.votes > 0 && <span className={styles.votes}>{note.votes} votes</span>}
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className={styles.footer}>
        <span>Powered by AI Landscape Tool</span>
        <span>{notes.length} ideas</span>
      </div>
    </div>
  );
}
