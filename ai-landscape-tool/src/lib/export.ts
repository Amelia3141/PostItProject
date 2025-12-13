import { Note } from '@/types';

export function exportToJSON(notes: Note[], filename = 'ai-landscape-export') {
  const data = JSON.stringify(notes, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  downloadBlob(blob, `${filename}.json`);
}

export function exportToCSV(notes: Note[], filename = 'ai-landscape-export') {
  const headers = ['ID', 'Text', 'Category', 'Timeframe', 'Votes', 'Tags', 'Created'];
  const rows = notes.map(note => [
    note.id,
    `"${note.text.replace(/"/g, '""')}"`,
    note.category,
    note.timeframe,
    note.votes || 0,
    `"${(note.tags || []).join(', ')}"`,
    new Date(note.createdAt).toISOString()
  ]);
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  downloadBlob(blob, `${filename}.csv`);
}

export async function exportToPDF(notes: Note[], filename = 'ai-landscape-export') {
  const { jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');
  const doc = new jsPDF();
  doc.setFontSize(20);
  doc.text('AI Landscape - Workshop Export', 14, 22);
  doc.setFontSize(10);
  doc.text(`Exported: ${new Date().toLocaleDateString()}`, 14, 30);
  doc.text(`Total Ideas: ${notes.length}`, 14, 36);
  const tableData = notes.map(note => [
    note.text.substring(0, 60) + (note.text.length > 60 ? '...' : ''),
    note.category,
    note.timeframe,
    note.votes || 0
  ]);
  autoTable(doc, {
    startY: 45,
    head: [['Idea', 'Category', 'Timeframe', 'Votes']],
    body: tableData,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [102, 126, 234] }
  });
  doc.save(`${filename}.pdf`);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
