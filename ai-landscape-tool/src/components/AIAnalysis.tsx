'use client';

import { useState } from 'react';
import { Note, Board } from '@/types';
import styles from './AIAnalysis.module.css';

interface AIAnalysisProps {
  board: Board;
  notes: Note[];
  isOpen: boolean;
  onClose: () => void;
}

type AnalysisType = 'summary' | 'sentiment' | 'themes' | 'stakeholder' | 'actions' | 'gaps';

const ANALYSIS_OPTIONS: { type: AnalysisType; label: string; description: string }[] = [
  { type: 'summary', label: 'Executive Summary', description: 'Overview with key themes and recommendations' },
  { type: 'sentiment', label: 'Sentiment Analysis', description: 'Analyse tone, concerns, and opportunities' },
  { type: 'themes', label: 'Theme Extraction', description: 'Cluster ideas and identify patterns' },
  { type: 'stakeholder', label: 'Stakeholder Summaries', description: 'Tailored insights for different audiences' },
  { type: 'actions', label: 'Action Items', description: 'Extract concrete next steps' },
  { type: 'gaps', label: 'Gap Analysis', description: 'Identify what is missing' },
];

export function AIAnalysis({ board, notes, isOpen, onClose }: AIAnalysisProps) {
  const [selectedType, setSelectedType] = useState<AnalysisType>('summary');
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const runAnalysis = async () => {
    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const response = await fetch('/api/ai/summarise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes,
          boardName: board.name,
          rows: board.rows,
          columns: board.columns,
          type: selectedType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Analysis failed');
      }

      setAnalysis(data.analysis);
    } catch (err: any) {
      setError(err.message || 'Failed to run analysis');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (analysis) {
      navigator.clipboard.writeText(analysis);
    }
  };

  const exportAsMarkdown = () => {
    if (!analysis) return;
    
    const content = '# ' + board.name + ' - ' + ANALYSIS_OPTIONS.find(o => o.type === selectedType)?.label + '\n\n' + analysis;
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = board.name.toLowerCase().replace(/\s+/g, '-') + '-' + selectedType + '.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>AI Analysis</h2>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <div className={styles.content}>
          <div className={styles.options}>
            <label className={styles.label}>Analysis Type</label>
            <div className={styles.optionGrid}>
              {ANALYSIS_OPTIONS.map((option) => (
                <button
                  key={option.type}
                  className={styles.optionBtn + (selectedType === option.type ? ' ' + styles.selected : '')}
                  onClick={() => setSelectedType(option.type)}
                >
                  <span className={styles.optionLabel}>{option.label}</span>
                  <span className={styles.optionDesc}>{option.description}</span>
                </button>
              ))}
            </div>
          </div>

          <div className={styles.info}>
            <span className={styles.noteCount}>{notes.length} notes</span>
            <span className={styles.separator}>will be analysed</span>
          </div>

          <button
            className={styles.runBtn}
            onClick={runAnalysis}
            disabled={loading || notes.length === 0}
          >
            {loading ? 'Analysing...' : 'Run Analysis'}
          </button>

          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}

          {analysis && (
            <div className={styles.results}>
              <div className={styles.resultsHeader}>
                <h3 className={styles.resultsTitle}>
                  {ANALYSIS_OPTIONS.find(o => o.type === selectedType)?.label}
                </h3>
                <div className={styles.resultsActions}>
                  <button className={styles.actionBtn} onClick={copyToClipboard}>
                    Copy
                  </button>
                  <button className={styles.actionBtn} onClick={exportAsMarkdown}>
                    Export
                  </button>
                </div>
              </div>
              <div className={styles.analysisText}>
                {analysis.split('\n').map((line, i) => {
                  if (line.startsWith('**') && line.endsWith('**')) {
                    return <h4 key={i} className={styles.heading}>{line.replace(/\*\*/g, '')}</h4>;
                  }
                  if (line.startsWith('- ')) {
                    return <li key={i} className={styles.listItem}>{line.substring(2)}</li>;
                  }
                  if (line.trim() === '') {
                    return <br key={i} />;
                  }
                  return <p key={i} className={styles.paragraph}>{line}</p>;
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
