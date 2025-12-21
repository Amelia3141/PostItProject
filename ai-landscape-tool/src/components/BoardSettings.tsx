'use client';

import { useState, useEffect } from 'react';
import { Board, BoardColumn, BoardRow } from '@/types';
import { updateBoard } from '@/lib/boardDb';
import styles from '@/app/Dashboard.module.css';

interface BoardSettingsProps {
  board: Board;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (board: Board) => void;
}

const COLOURS = ['pink', 'blue', 'yellow', 'green', 'purple', 'orange', 'grey'] as const;

export function BoardSettings({ board, isOpen, onClose, onUpdate }: BoardSettingsProps) {
  const [name, setName] = useState(board.name);
  const [description, setDescription] = useState(board.description || '');
  const [columns, setColumns] = useState<BoardColumn[]>(board.columns);
  const [rows, setRows] = useState<BoardRow[]>(board.rows);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(board.name);
    setDescription(board.description || '');
    setColumns(board.columns);
    setRows(board.rows);
  }, [board]);

  if (!isOpen) return null;

  const handleAddColumn = () => {
    const newId = `col-${Date.now()}`;
    setColumns([...columns, { id: newId, label: 'New Column', colour: undefined }]);
  };

  const handleRemoveColumn = (index: number) => {
    if (columns.length <= 1) return;
    setColumns(columns.filter((_, i) => i !== index));
  };

  const handleColumnChange = (index: number, field: 'label' | 'colour', value: string) => {
    const updated = [...columns];
    if (field === 'colour') {
      updated[index] = { ...updated[index], colour: value || undefined };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setColumns(updated);
  };

  const handleAddRow = () => {
    const newId = `row-${Date.now()}`;
    setRows([...rows, { id: newId, label: 'New Row', colour: 'pink' }]);
  };

  const handleRemoveRow = (index: number) => {
    if (rows.length <= 1) return;
    setRows(rows.filter((_, i) => i !== index));
  };

  const handleRowChange = (index: number, field: 'label' | 'colour', value: string) => {
    const updated = [...rows];
    updated[index] = { ...updated[index], [field]: value };
    setRows(updated);
  };

  const handleMoveColumn = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= columns.length) return;
    const updated = [...columns];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setColumns(updated);
  };

  const handleMoveRow = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= rows.length) return;
    const updated = [...rows];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setRows(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    const updatedBoard: Board = {
      ...board,
      name,
      description,
      columns,
      rows,
      updatedAt: Date.now(),
    };
    await updateBoard(board.id, { name, description, columns, rows });
    onUpdate(updatedBoard);
    setSaving(false);
    onClose();
  };

  return (
    <div className={styles.modal} onClick={onClose}>
      <div className={styles.settingsModal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.modalTitle}>Board Settings</h2>

        <div className={styles.formGroup}>
          <label>Board Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter board name"
          />
        </div>

        <div className={styles.formGroup}>
          <label>Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description"
          />
        </div>

        <div className={styles.settingsSection}>
          <div className={styles.settingsSectionHeader}>
            <label>Columns ({columns.length})</label>
            <button 
              type="button" 
              className={styles.settingsAddBtn}
              onClick={handleAddColumn}
            >
              + Add
            </button>
          </div>
          <div className={styles.settingsList}>
            {columns.map((col, index) => (
              <div key={col.id} className={styles.settingsItem}>
                <div className={styles.settingsItemOrder}>
                  <button
                    type="button"
                    onClick={() => handleMoveColumn(index, 'up')}
                    disabled={index === 0}
                    className={styles.settingsMoveBtn}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveColumn(index, 'down')}
                    disabled={index === columns.length - 1}
                    className={styles.settingsMoveBtn}
                  >
                    ↓
                  </button>
                </div>
                <input
                  type="text"
                  value={col.label}
                  onChange={(e) => handleColumnChange(index, 'label', e.target.value)}
                  className={styles.settingsInput}
                />
                <select
                  value={col.colour || ''}
                  onChange={(e) => handleColumnChange(index, 'colour', e.target.value)}
                  className={styles.settingsColourSelect}
                >
                  <option value="">No colour</option>
                  {COLOURS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => handleRemoveColumn(index)}
                  disabled={columns.length <= 1}
                  className={styles.settingsRemoveBtn}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.settingsSection}>
          <div className={styles.settingsSectionHeader}>
            <label>Rows ({rows.length})</label>
            <button 
              type="button" 
              className={styles.settingsAddBtn}
              onClick={handleAddRow}
            >
              + Add
            </button>
          </div>
          <div className={styles.settingsList}>
            {rows.map((row, index) => (
              <div key={row.id} className={styles.settingsItem}>
                <div className={styles.settingsItemOrder}>
                  <button
                    type="button"
                    onClick={() => handleMoveRow(index, 'up')}
                    disabled={index === 0}
                    className={styles.settingsMoveBtn}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveRow(index, 'down')}
                    disabled={index === rows.length - 1}
                    className={styles.settingsMoveBtn}
                  >
                    ↓
                  </button>
                </div>
                <input
                  type="text"
                  value={row.label}
                  onChange={(e) => handleRowChange(index, 'label', e.target.value)}
                  className={styles.settingsInput}
                />
                <select
                  value={row.colour}
                  onChange={(e) => handleRowChange(index, 'colour', e.target.value)}
                  className={styles.settingsColourSelect}
                >
                  {COLOURS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => handleRemoveRow(index)}
                  disabled={rows.length <= 1}
                  className={styles.settingsRemoveBtn}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        <p className={styles.settingsWarning}>
          Note: Removing columns or rows will not delete existing notes, but they may become orphaned.
        </p>

        <div className={styles.modalActions}>
          <button 
            className={styles.saveBtn} 
            onClick={handleSave}
            disabled={saving || !name.trim()}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
