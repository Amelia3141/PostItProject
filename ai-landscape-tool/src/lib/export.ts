import { Note, Board } from '@/types';

export function exportToJSON(notes: Note[], filename = 'ai-landscape-export') {
  const data = JSON.stringify(notes, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  downloadBlob(blob, `${filename}.json`);
}

export function importFromJSON(file: File): Promise<Partial<Note>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        // Handle both array of notes and object with notes property
        const notes = Array.isArray(data) ? data : data.notes || [];
        resolve(notes);
      } catch (err) {
        reject(new Error('Invalid JSON file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
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

export function exportToPPTX(notes: Note[], board: Board, filename = 'ai-landscape-export') {
  // Create HTML content that can be opened in PowerPoint
  const groupedByCategory: Record<string, Note[]> = {};
  notes.forEach(note => {
    const cat = note.category;
    if (!groupedByCategory[cat]) groupedByCategory[cat] = [];
    groupedByCategory[cat].push(note);
  });

  let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${board.name}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    .slide { page-break-after: always; min-height: 500px; padding: 40px; }
    .title-slide { text-align: center; padding-top: 150px; }
    .title-slide h1 { font-size: 48px; color: #1a1a2e; margin-bottom: 20px; }
    .title-slide p { font-size: 24px; color: #666; }
    .content-slide h2 { font-size: 32px; color: #1a1a2e; border-bottom: 3px solid #667eea; padding-bottom: 10px; }
    .content-slide ul { font-size: 18px; line-height: 1.8; }
    .content-slide li { margin-bottom: 8px; }
    .votes { color: #888; font-size: 14px; }
  </style>
</head>
<body>
  <div class="slide title-slide">
    <h1>${board.name}</h1>
    <p>${board.description || 'AI Foresight Workshop'}</p>
    <p style="margin-top: 40px; font-size: 18px; color: #999;">${notes.length} ideas • Exported ${new Date().toLocaleDateString()}</p>
  </div>
`;

  for (const [categoryId, categoryNotes] of Object.entries(groupedByCategory)) {
    const row = board.rows.find(r => r.id === categoryId);
    const categoryName = row?.label || categoryId;
    const sorted = [...categoryNotes].sort((a, b) => (b.votes || 0) - (a.votes || 0));

    html += `
  <div class="slide content-slide">
    <h2>${categoryName}</h2>
    <ul>
      ${sorted.slice(0, 15).map(note => `<li>${note.text} ${note.votes ? `<span class="votes">(${note.votes} votes)</span>` : ''}</li>`).join('\n      ')}
    </ul>
  </div>
`;
  }

  // Summary slide
  const topVoted = [...notes].sort((a, b) => (b.votes || 0) - (a.votes || 0)).slice(0, 5);
  html += `
  <div class="slide content-slide">
    <h2>Top Voted Ideas</h2>
    <ol>
      ${topVoted.map(note => `<li>${note.text} <span class="votes">(${note.votes || 0} votes)</span></li>`).join('\n      ')}
    </ol>
  </div>
</body>
</html>
`;

  const blob = new Blob([html], { type: 'application/vnd.ms-powerpoint' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.ppt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
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
