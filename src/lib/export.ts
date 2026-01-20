import { Note, Board, Connection } from '@/types';

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

export async function exportToPDF(notes: Note[], filename = 'ai-landscape-export', board?: Board, connections?: Connection[]) {
  const { jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');
  const doc = new jsPDF('landscape');

  const boardName = board?.name || 'AI Landscape';

  // Title page
  doc.setFontSize(28);
  doc.setTextColor(26, 26, 46);
  doc.text(boardName, 148, 60, { align: 'center' });

  if (board?.description) {
    doc.setFontSize(14);
    doc.setTextColor(100, 100, 100);
    doc.text(board.description, 148, 75, { align: 'center' });
  }

  doc.setFontSize(12);
  doc.setTextColor(150, 150, 150);
  doc.text(`${notes.length} ideas • Exported ${new Date().toLocaleDateString()}`, 148, 100, { align: 'center' });

  // Stats summary
  const totalVotes = notes.reduce((sum, n) => sum + (n.votes || 0), 0);
  const contributors = new Set(notes.map(n => n.createdById).filter(Boolean)).size;

  doc.setFontSize(11);
  doc.setTextColor(80, 80, 80);
  doc.text(`Total Votes: ${totalVotes} • Contributors: ${contributors}`, 148, 115, { align: 'center' });

  // Page 2: Board Matrix View
  if (board) {
    doc.addPage('landscape');
    doc.setFontSize(18);
    doc.setTextColor(26, 26, 46);
    doc.text('Board Overview', 14, 20);

    const cols = board.columns;
    const rows = board.rows;
    const startX = 45;
    const startY = 35;
    const cellWidth = (280 - startX) / cols.length;
    const cellHeight = 30;

    // Column headers
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    cols.forEach((col, i) => {
      doc.setFillColor(26, 26, 46);
      doc.rect(startX + i * cellWidth, startY, cellWidth, 12, 'F');
      doc.text(col.label, startX + i * cellWidth + cellWidth/2, startY + 8, { align: 'center' });
    });

    // Row labels and cells
    const colorMap: Record<string, [number, number, number]> = {
      pink: [255, 245, 245],
      blue: [240, 247, 255],
      yellow: [255, 255, 240],
      green: [240, 255, 244],
      purple: [250, 245, 255],
      orange: [255, 250, 240],
    };

    rows.forEach((row, rowIdx) => {
      const y = startY + 12 + rowIdx * cellHeight;

      // Row label
      const bgColor = colorMap[row.colour] || [245, 245, 245];
      doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
      doc.rect(5, y, 38, cellHeight, 'F');
      doc.setTextColor(60, 60, 60);
      doc.setFontSize(7);
      const labelLines = doc.splitTextToSize(row.label, 35);
      doc.text(labelLines, 24, y + cellHeight/2 - (labelLines.length - 1) * 2, { align: 'center' });

      // Cells with note counts
      cols.forEach((col, colIdx) => {
        const x = startX + colIdx * cellWidth;
        const cellNotes = notes.filter(n => n.category === row.id && n.timeframe === col.id);

        doc.setFillColor(250, 250, 250);
        doc.rect(x, y, cellWidth, cellHeight, 'F');
        doc.setDrawColor(230, 230, 230);
        doc.rect(x, y, cellWidth, cellHeight, 'S');

        if (cellNotes.length > 0) {
          doc.setTextColor(102, 126, 234);
          doc.setFontSize(12);
          doc.text(String(cellNotes.length), x + cellWidth/2, y + cellHeight/2 + 2, { align: 'center' });
          doc.setFontSize(6);
          doc.setTextColor(150, 150, 150);
          doc.text('notes', x + cellWidth/2, y + cellHeight/2 + 8, { align: 'center' });
        }
      });
    });
  }

  // Page 3: Network/Connections View
  if (connections && connections.length > 0) {
    doc.addPage('landscape');
    doc.setFontSize(18);
    doc.setTextColor(26, 26, 46);
    doc.text('Connections / Network View', 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`${connections.length} connections between ideas`, 14, 30);

    // Create a simple network visualization
    const connectedNotes = new Set<string>();
    connections.forEach(c => {
      connectedNotes.add(c.sourceId);
      connectedNotes.add(c.targetId);
    });

    const relevantNotes = notes.filter(n => connectedNotes.has(n.id));
    const nodePositions: Record<string, { x: number; y: number }> = {};

    // Position nodes in a circular layout
    const centerX = 148;
    const centerY = 115;
    const radius = 70;

    relevantNotes.forEach((note, i) => {
      const angle = (i / relevantNotes.length) * 2 * Math.PI - Math.PI / 2;
      nodePositions[note.id] = {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      };
    });

    // Draw connections (lines)
    doc.setDrawColor(102, 126, 234);
    doc.setLineWidth(0.5);
    connections.forEach(conn => {
      const source = nodePositions[conn.sourceId];
      const target = nodePositions[conn.targetId];
      if (source && target) {
        doc.line(source.x, source.y, target.x, target.y);
        // Draw arrowhead
        const angle = Math.atan2(target.y - source.y, target.x - source.x);
        const arrowSize = 3;
        doc.line(
          target.x - arrowSize * Math.cos(angle - Math.PI / 6),
          target.y - arrowSize * Math.sin(angle - Math.PI / 6),
          target.x,
          target.y
        );
        doc.line(
          target.x - arrowSize * Math.cos(angle + Math.PI / 6),
          target.y - arrowSize * Math.sin(angle + Math.PI / 6),
          target.x,
          target.y
        );
      }
    });

    // Draw nodes (circles with labels)
    relevantNotes.forEach((note, i) => {
      const pos = nodePositions[note.id];
      if (pos) {
        doc.setFillColor(102, 126, 234);
        doc.circle(pos.x, pos.y, 4, 'F');
        doc.setFontSize(6);
        doc.setTextColor(50, 50, 50);
        const label = note.text.substring(0, 20) + (note.text.length > 20 ? '...' : '');
        doc.text(label, pos.x, pos.y + 8, { align: 'center' });
      }
    });

    // List connections as table
    doc.setFontSize(10);
    doc.setTextColor(26, 26, 46);
    autoTable(doc, {
      startY: 175,
      head: [['From', 'To']],
      body: connections.slice(0, 15).map(conn => {
        const source = notes.find(n => n.id === conn.sourceId);
        const target = notes.find(n => n.id === conn.targetId);
        return [
          source?.text.substring(0, 40) + (source && source.text.length > 40 ? '...' : '') || 'Unknown',
          target?.text.substring(0, 40) + (target && target.text.length > 40 ? '...' : '') || 'Unknown',
        ];
      }),
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [102, 126, 234] },
    });
  }

  // Page 4: Top Voted Ideas
  doc.addPage('landscape');
  doc.setFontSize(18);
  doc.setTextColor(26, 26, 46);
  doc.text('Top Voted Ideas', 14, 20);

  const topVoted = [...notes].sort((a, b) => (b.votes || 0) - (a.votes || 0)).slice(0, 10);
  autoTable(doc, {
    startY: 30,
    head: [['Rank', 'Idea', 'Category', 'Timeframe', 'Votes']],
    body: topVoted.map((note, i) => [
      i + 1,
      note.text.substring(0, 80) + (note.text.length > 80 ? '...' : ''),
      board?.rows.find(r => r.id === note.category)?.label || note.category,
      board?.columns.find(c => c.id === note.timeframe)?.label || note.timeframe,
      note.votes || 0
    ]),
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [102, 126, 234] },
    columnStyles: { 0: { cellWidth: 15 }, 4: { cellWidth: 20 } }
  });

  // Page 4+: All Ideas Table
  doc.addPage('landscape');
  doc.setFontSize(18);
  doc.setTextColor(26, 26, 46);
  doc.text('All Ideas', 14, 20);

  const tableData = notes.map(note => [
    note.text.substring(0, 70) + (note.text.length > 70 ? '...' : ''),
    board?.rows.find(r => r.id === note.category)?.label || note.category,
    board?.columns.find(c => c.id === note.timeframe)?.label || note.timeframe,
    note.votes || 0,
    note.createdBy || 'Anonymous'
  ]);

  autoTable(doc, {
    startY: 30,
    head: [['Idea', 'Category', 'Timeframe', 'Votes', 'Author']],
    body: tableData,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [102, 126, 234] },
    columnStyles: { 3: { cellWidth: 18 }, 4: { cellWidth: 35 } }
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
