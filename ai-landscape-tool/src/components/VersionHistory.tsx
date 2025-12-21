'use client';

import { useState } from 'react';
import { Note, NoteVersion } from '@/types';
import styles from '@/app/Dashboard.module.css';

interface VersionHistoryProps {
  note: Note;
  onRestore: (version: NoteVersion) => void;
  readOnly?: boolean;
}

function getDiff(oldText: string, newText: string): { type: 'same' | 'added' | 'removed'; text: string }[] {
  const oldWords = oldText.split(/(\s+)/);
  const newWords = newText.split(/(\s+)/);
  const diff: { type: 'same' | 'added' | 'removed'; text: string }[] = [];
  
  let i = 0, j = 0;
  
  while (i < oldWords.length || j < newWords.length) {
    if (i >= oldWords.length) {
      diff.push({ type: 'added', text: newWords[j] });
      j++;
    } else if (j >= newWords.length) {
      diff.push({ type: 'removed', text: oldWords[i] });
      i++;
    } else if (oldWords[i] === newWords[j]) {
      diff.push({ type: 'same', text: oldWords[i] });
      i++;
      j++;
    } else {
      // Look ahead to find match
      let foundInNew = newWords.indexOf(oldWords[i], j);
      let foundInOld = oldWords.indexOf(newWords[j], i);
      
      if (foundInNew !== -1 && (foundInOld === -1 || foundInNew - j < foundInOld - i)) {
        // Add new words until we find the match
        while (j < foundInNew) {
          diff.push({ type: 'added', text: newWords[j] });
          j++;
        }
      } else if (foundInOld !== -1) {
        // Remove old words until we find the match
        while (i < foundInOld) {
          diff.push({ type: 'removed', text: oldWords[i] });
          i++;
        }
      } else {
        diff.push({ type: 'removed', text: oldWords[i] });
        diff.push({ type: 'added', text: newWords[j] });
        i++;
        j++;
      }
    }
  }
  
  return diff;
}

export function VersionHistory({ note, onRestore, readOnly = false }: VersionHistoryProps) {
  const [expandedVersion, setExpandedVersion] = useState<string | null>(null);
  
  if (!note.history || note.history.length === 0) {
    return (
      <div className={styles.versionHistory}>
        <p className={styles.noVersions}>No edit history yet</p>
      </div>
    );
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const versions = [...note.history].reverse();

  return (
    <div className={styles.versionHistory}>
      <h4 className={styles.versionHistoryTitle}>
        Edit History ({versions.length} {versions.length === 1 ? 'revision' : 'revisions'})
      </h4>
      
      <div className={styles.versionList}>
        {versions.map((version, index) => {
          const isExpanded = expandedVersion === version.id;
          const nextVersion = index > 0 ? versions[index - 1] : { text: note.text };
          const diff = getDiff(version.text, nextVersion.text);
          const hasChanges = diff.some(d => d.type !== 'same');
          
          return (
            <div key={version.id} className={styles.versionItem}>
              <div 
                className={styles.versionHeader}
                onClick={() => setExpandedVersion(isExpanded ? null : version.id)}
              >
                <div className={styles.versionMeta}>
                  <span className={styles.versionAuthor}>{version.editedBy}</span>
                  <span className={styles.versionDate}>{formatDate(version.timestamp)}</span>
                </div>
                <div className={styles.versionActions}>
                  <span className={styles.versionExpand}>
                    {isExpanded ? '−' : '+'}
                  </span>
                </div>
              </div>
              
              {isExpanded && (
                <div className={styles.versionDetails}>
                  <div className={styles.versionDiff}>
                    {hasChanges ? (
                      diff.map((part, i) => (
                        <span 
                          key={i} 
                          className={
                            part.type === 'added' ? styles.diffAdded :
                            part.type === 'removed' ? styles.diffRemoved :
                            styles.diffSame
                          }
                        >
                          {part.text}
                        </span>
                      ))
                    ) : (
                      <span className={styles.diffSame}>{version.text}</span>
                    )}
                  </div>
                  
                  <div className={styles.versionChanges}>
                    {version.category !== note.category && (
                      <span className={styles.versionChange}>
                        Category: {version.category}
                      </span>
                    )}
                    {version.timeframe !== note.timeframe && (
                      <span className={styles.versionChange}>
                        Timeframe: {version.timeframe}
                      </span>
                    )}
                  </div>
                  
                  {!readOnly && (
                    <button 
                      className={styles.versionRestoreBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        onRestore(version);
                      }}
                    >
                      Restore this version
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      <div className={styles.versionCurrent}>
        <span className={styles.versionCurrentLabel}>Current version</span>
        <span className={styles.versionCurrentText}>{note.text}</span>
      </div>
    </div>
  );
}
