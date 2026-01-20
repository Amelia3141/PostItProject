'use client';

import { useEffect, useState, useCallback } from 'react';
import styles from '@/app/Dashboard.module.css';

interface KeyboardShortcutsProps {
  onAddNote: () => void;
  onToggleView: (view: 'grid' | 'board' | 'flow') => void;
  onUndo: () => void;
  onSearch: () => void;
  onExport: () => void;
  onAIAnalysis: () => void;
  canUndo: boolean;
}

export function useKeyboardShortcuts({
  onAddNote,
  onToggleView,
  onUndo,
  onSearch,
  onExport,
  onAIAnalysis,
  canUndo,
}: KeyboardShortcutsProps) {
  const [showShortcuts, setShowShortcuts] = useState(false);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't trigger if user is typing in an input
    if (e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement) {
      return;
    }

    const key = e.key.toLowerCase();
    const cmd = e.metaKey || e.ctrlKey;

    // ? - Show shortcuts help
    if (key === '?' || (e.shiftKey && key === '/')) {
      e.preventDefault();
      setShowShortcuts(prev => !prev);
      return;
    }

    // Escape - Close shortcuts modal
    if (key === 'escape' && showShortcuts) {
      setShowShortcuts(false);
      return;
    }

    // N - New note
    if (key === 'n' && !cmd) {
      e.preventDefault();
      onAddNote();
      return;
    }

    // 1, 2, 3 - Switch views
    if (key === '1' && !cmd) {
      e.preventDefault();
      onToggleView('board');
      return;
    }
    if (key === '2' && !cmd) {
      e.preventDefault();
      onToggleView('grid');
      return;
    }
    if (key === '3' && !cmd) {
      e.preventDefault();
      onToggleView('flow');
      return;
    }

    // Cmd/Ctrl + Z - Undo
    if (key === 'z' && cmd && !e.shiftKey && canUndo) {
      e.preventDefault();
      onUndo();
      return;
    }

    // / or Cmd+K - Focus search
    if ((key === '/' || (cmd && key === 'k')) && !e.shiftKey) {
      e.preventDefault();
      onSearch();
      return;
    }

    // E - Export
    if (key === 'e' && !cmd) {
      e.preventDefault();
      onExport();
      return;
    }

    // A - AI Analysis
    if (key === 'a' && !cmd) {
      e.preventDefault();
      onAIAnalysis();
      return;
    }
  }, [onAddNote, onToggleView, onUndo, onSearch, onExport, onAIAnalysis, canUndo, showShortcuts]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return { showShortcuts, setShowShortcuts };
}

export function ShortcutsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  const shortcuts = [
    { keys: ['N'], description: 'Add new note' },
    { keys: ['1'], description: 'Board view' },
    { keys: ['2'], description: 'Grid view' },
    { keys: ['3'], description: 'Flow view' },
    { keys: ['/'], description: 'Focus search' },
    { keys: ['⌘', 'Z'], description: 'Undo' },
    { keys: ['E'], description: 'Export menu' },
    { keys: ['A'], description: 'AI Analysis' },
    { keys: ['?'], description: 'Show shortcuts' },
    { keys: ['Esc'], description: 'Close modal' },
  ];

  return (
    <div className={styles.shortcutsModal} onClick={onClose}>
      <div className={styles.shortcutsContent} onClick={e => e.stopPropagation()}>
        <h2 className={styles.shortcutsTitle}>Keyboard Shortcuts</h2>
        <div className={styles.shortcutsList}>
          {shortcuts.map((shortcut, i) => (
            <div key={i} className={styles.shortcutItem}>
              <span>{shortcut.description}</span>
              <span className={styles.shortcutKey}>
                {shortcut.keys.map((key, j) => (
                  <kbd key={j}>{key}</kbd>
                ))}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
