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

export async function exportToPDF(
  notes: Note[],
  filename = 'ai-landscape-export',
  board?: Board,
  connections?: Connection[],
  _flowElement?: HTMLElement | null // Not used - we render our own flow view
) {
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

  // Page 3: Network/Flow View (always render if we have board structure)
  if (board && notes.length > 0) {
    doc.addPage('landscape');
    doc.setFontSize(18);
    doc.setTextColor(26, 26, 46);
    doc.text('Flow / Network View', 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    const connCount = connections?.length || 0;
    doc.text(`${notes.length} ideas${connCount > 0 ? ` • ${connCount} connections` : ''}`, 14, 28);

    // Render grid-based flow view
    renderFlowNetworkView(doc, notes, board, connections || []);

    // Connection details table on next page
    if (connections && connections.length > 0) {
      doc.addPage('landscape');
      doc.setFontSize(14);
      doc.setTextColor(26, 26, 46);
      doc.text('Connection Details', 14, 20);

      autoTable(doc, {
        startY: 30,
        head: [['From', 'To']],
        body: connections.slice(0, 25).map(conn => {
          const source = notes.find(n => n.id === conn.sourceId);
          const target = notes.find(n => n.id === conn.targetId);
          return [
            source?.text.substring(0, 60) + (source && source.text.length > 60 ? '...' : '') || 'Unknown',
            target?.text.substring(0, 60) + (target && target.text.length > 60 ? '...' : '') || 'Unknown',
          ];
        }),
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [102, 126, 234] },
      });
    }
  }

  // Helper function to render flow view with grid layout
  function renderFlowNetworkView(doc: any, notes: Note[], board: Board, connections: Connection[]) {
    const cols = board.columns;
    const rows = board.rows;

    const startX = 50;
    const startY = 40;
    const colWidth = (270 - startX) / cols.length;
    const rowHeight = 35;

    const colorMap: Record<string, { bg: [number, number, number]; border: [number, number, number] }> = {
      pink: { bg: [255, 245, 245], border: [254, 215, 215] },
      blue: { bg: [240, 247, 255], border: [190, 227, 248] },
      yellow: { bg: [255, 255, 240], border: [250, 240, 137] },
      green: { bg: [240, 255, 244], border: [154, 230, 180] },
      purple: { bg: [250, 245, 255], border: [214, 188, 250] },
      orange: { bg: [255, 250, 240], border: [251, 211, 141] },
    };

    // Track node positions for connections
    const nodePositions: Record<string, { x: number; y: number }> = {};
    const cellCounts: Record<string, number> = {};

    // Draw column headers
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    cols.forEach((col, i) => {
      doc.setFillColor(26, 26, 46);
      doc.roundedRect(startX + i * colWidth + 2, startY, colWidth - 4, 12, 2, 2, 'F');
      doc.text(col.label, startX + i * colWidth + colWidth / 2, startY + 8, { align: 'center' });
    });

    // Draw row labels
    rows.forEach((row, rowIdx) => {
      const y = startY + 15 + rowIdx * rowHeight;
      const colors = colorMap[row.colour] || { bg: [245, 245, 245], border: [220, 220, 220] };
      doc.setFillColor(colors.bg[0], colors.bg[1], colors.bg[2]);
      doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
      doc.roundedRect(5, y, 42, 28, 2, 2, 'FD');
      doc.setTextColor(60, 60, 60);
      doc.setFontSize(6);
      const labelLines = doc.splitTextToSize(row.label, 38);
      doc.text(labelLines, 26, y + 10 + (labelLines.length > 1 ? 0 : 4), { align: 'center' });
    });

    // Draw notes as nodes
    const nodeWidth = 32;
    const nodeHeight = 18;

    notes.forEach((note) => {
      const colIdx = cols.findIndex(c => c.id === note.timeframe);
      const rowIdx = rows.findIndex(r => r.id === note.category);
      if (colIdx === -1 || rowIdx === -1) return;

      const row = rows[rowIdx];
      const cellKey = `${note.category}-${note.timeframe}`;
      const offset = cellCounts[cellKey] || 0;
      cellCounts[cellKey] = offset + 1;

      // Position within cell (2 columns of nodes)
      const col = offset % 2;
      const nodeRow = Math.floor(offset / 2);

      const x = startX + colIdx * colWidth + 4 + col * (nodeWidth + 2);
      const y = startY + 15 + rowIdx * rowHeight + 2 + nodeRow * (nodeHeight + 2);

      // Store center position for connections
      nodePositions[note.id] = { x: x + nodeWidth / 2, y: y + nodeHeight / 2 };

      // Draw node
      const colors = colorMap[row.colour] || { bg: [245, 245, 245], border: [220, 220, 220] };
      doc.setFillColor(colors.bg[0], colors.bg[1], colors.bg[2]);
      doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
      doc.roundedRect(x, y, nodeWidth, nodeHeight, 1, 1, 'FD');

      // Draw label (truncated)
      doc.setFontSize(4);
      doc.setTextColor(50, 50, 50);
      const label = note.text.substring(0, 18) + (note.text.length > 18 ? '..' : '');
      const labelLines = doc.splitTextToSize(label, nodeWidth - 2);
      doc.text(labelLines.slice(0, 2), x + nodeWidth / 2, y + 5, { align: 'center' });
    });

    // Draw connections with arrows
    if (connections.length > 0) {
      doc.setDrawColor(102, 126, 234);
      doc.setLineWidth(0.3);

      connections.forEach((conn) => {
        const source = nodePositions[conn.sourceId];
        const target = nodePositions[conn.targetId];
        if (source && target) {
          // Draw curved line
          const midX = (source.x + target.x) / 2;
          const midY = (source.y + target.y) / 2 - 5;

          // Simple line for now
          doc.line(source.x, source.y, target.x, target.y);

          // Draw arrowhead
          const angle = Math.atan2(target.y - source.y, target.x - source.x);
          const arrowSize = 2;
          const arrowX = target.x - 4 * Math.cos(angle);
          const arrowY = target.y - 4 * Math.sin(angle);

          doc.line(
            arrowX,
            arrowY,
            arrowX - arrowSize * Math.cos(angle - Math.PI / 5),
            arrowY - arrowSize * Math.sin(angle - Math.PI / 5)
          );
          doc.line(
            arrowX,
            arrowY,
            arrowX - arrowSize * Math.cos(angle + Math.PI / 5),
            arrowY - arrowSize * Math.sin(angle + Math.PI / 5)
          );
        }
      });
    }
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

// AI-enhanced PDF export with comprehensive analysis
export async function exportToAIPDF(
  notes: Note[],
  board: Board,
  connections?: Connection[],
  flowElement?: HTMLElement | null,
  filename = 'ai-landscape-report'
): Promise<void> {
  // First, get AI analysis
  const response = await fetch('/api/ai/summarise', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      notes,
      boardName: board.name,
      rows: board.rows,
      columns: board.columns,
      type: 'comprehensive',
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate AI analysis');
  }

  const { analysis } = await response.json();

  // Now generate PDF with AI analysis included
  const { jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');
  const doc = new jsPDF('portrait', 'mm', 'a4');

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;

  // Title page
  doc.setFontSize(28);
  doc.setTextColor(26, 26, 46);
  doc.text(board.name, pageWidth / 2, 60, { align: 'center' });

  if (board.description) {
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(board.description, pageWidth / 2, 75, { align: 'center' });
  }

  doc.setFontSize(14);
  doc.setTextColor(102, 126, 234);
  doc.text('AI-Generated Strategic Report', pageWidth / 2, 95, { align: 'center' });

  doc.setFontSize(10);
  doc.setTextColor(150, 150, 150);
  doc.text(`${notes.length} ideas analysed • Generated ${new Date().toLocaleDateString()}`, pageWidth / 2, 110, { align: 'center' });

  // Stats box
  const totalVotes = notes.reduce((sum, n) => sum + (n.votes || 0), 0);
  const contributors = new Set(notes.map(n => n.createdById).filter(Boolean)).size;

  doc.setFillColor(247, 247, 250);
  doc.roundedRect(margin, 130, contentWidth, 30, 3, 3, 'F');
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text(`Total Votes: ${totalVotes}`, margin + 20, 145);
  doc.text(`Contributors: ${contributors}`, margin + 80, 145);
  doc.text(`Connections: ${connections?.length || 0}`, margin + 140, 145);

  // AI Analysis pages
  doc.addPage();
  let yPos = 25;

  // Process analysis text line by line
  const lines = analysis.split('\n');

  for (const line of lines) {
    // Check if we need a new page
    if (yPos > pageHeight - 30) {
      doc.addPage();
      yPos = 25;
    }

    // Handle different markdown elements
    if (line.startsWith('# ') && !line.startsWith('## ')) {
      // H1 - Section header
      doc.setFontSize(16);
      doc.setTextColor(26, 26, 46);
      doc.setFont(undefined as any, 'bold');
      const headerText = line.substring(2);
      doc.text(headerText, margin, yPos);
      yPos += 4;
      doc.setDrawColor(102, 126, 234);
      doc.setLineWidth(0.5);
      doc.line(margin, yPos, margin + doc.getTextWidth(headerText), yPos);
      yPos += 10;
    } else if (line.startsWith('## ')) {
      // H2 - Subsection header
      doc.setFontSize(14);
      doc.setTextColor(26, 26, 46);
      doc.setFont(undefined as any, 'bold');
      doc.text(line.substring(3), margin, yPos);
      yPos += 8;
    } else if (line.startsWith('**') && line.endsWith('**')) {
      // Bold section
      doc.setFontSize(11);
      doc.setTextColor(60, 60, 60);
      doc.setFont(undefined as any, 'bold');
      doc.text(line.replace(/\*\*/g, ''), margin, yPos);
      yPos += 6;
    } else if (line.startsWith('*') && line.endsWith('*') && !line.startsWith('**')) {
      // Italic/label
      doc.setFontSize(10);
      doc.setTextColor(102, 126, 234);
      doc.setFont(undefined as any, 'italic');
      doc.text(line.replace(/\*/g, ''), margin, yPos);
      yPos += 6;
    } else if (line.startsWith('- [ ] ')) {
      // Checkbox item
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      doc.setFont(undefined as any, 'normal');
      const wrappedText = doc.splitTextToSize('☐ ' + line.substring(6), contentWidth - 10);
      doc.text(wrappedText, margin + 5, yPos);
      yPos += wrappedText.length * 5;
    } else if (line.startsWith('- ')) {
      // Bullet point
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      doc.setFont(undefined as any, 'normal');
      const wrappedText = doc.splitTextToSize('• ' + line.substring(2), contentWidth - 10);
      doc.text(wrappedText, margin + 5, yPos);
      yPos += wrappedText.length * 5;
    } else if (line.trim() === '') {
      // Empty line
      yPos += 4;
    } else {
      // Regular paragraph
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      doc.setFont(undefined as any, 'normal');
      const wrappedText = doc.splitTextToSize(line, contentWidth);
      doc.text(wrappedText, margin, yPos);
      yPos += wrappedText.length * 5;
    }
  }

  // Board Matrix View
  doc.addPage('landscape');
  doc.setFontSize(16);
  doc.setTextColor(26, 26, 46);
  doc.setFont(undefined as any, 'bold');
  doc.text('Board Overview', 14, 20);

  const cols = board.columns;
  const rows = board.rows;
  const startX = 45;
  const startY = 30;
  const cellWidth = (280 - startX) / cols.length;
  const cellHeight = 25;

  // Column headers
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  cols.forEach((col, i) => {
    doc.setFillColor(102, 126, 234);
    doc.rect(startX + i * cellWidth, startY, cellWidth, 10, 'F');
    doc.text(col.label, startX + i * cellWidth + cellWidth / 2, startY + 7, { align: 'center' });
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
    const y = startY + 10 + rowIdx * cellHeight;

    // Row label
    const bgColor = colorMap[row.colour] || [245, 245, 245];
    doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
    doc.rect(5, y, 38, cellHeight, 'F');
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(7);
    doc.setFont(undefined as any, 'normal');
    const labelLines = doc.splitTextToSize(row.label, 35);
    doc.text(labelLines, 24, y + cellHeight / 2 - (labelLines.length - 1) * 2, { align: 'center' });

    cols.forEach((col, colIdx) => {
      const x = startX + colIdx * cellWidth;
      const cellNotes = notes.filter(n => n.category === row.id && n.timeframe === col.id);

      doc.setFillColor(252, 252, 252);
      doc.rect(x, y, cellWidth, cellHeight, 'F');
      doc.setDrawColor(230, 230, 230);
      doc.rect(x, y, cellWidth, cellHeight, 'S');

      if (cellNotes.length > 0) {
        doc.setTextColor(102, 126, 234);
        doc.setFontSize(11);
        doc.text(String(cellNotes.length), x + cellWidth / 2, y + cellHeight / 2 + 1, { align: 'center' });
        doc.setFontSize(6);
        doc.setTextColor(150, 150, 150);
        doc.text('notes', x + cellWidth / 2, y + cellHeight / 2 + 6, { align: 'center' });
      }
    });
  });

  // Top Voted Ideas
  doc.addPage('portrait');
  doc.setFontSize(16);
  doc.setTextColor(26, 26, 46);
  doc.setFont(undefined as any, 'bold');
  doc.text('Top Voted Ideas', margin, 25);

  const topVoted = [...notes].sort((a, b) => (b.votes || 0) - (a.votes || 0)).slice(0, 15);
  autoTable(doc, {
    startY: 35,
    head: [['#', 'Idea', 'Category', 'Votes']],
    body: topVoted.map((note, i) => [
      i + 1,
      note.text.substring(0, 80) + (note.text.length > 80 ? '...' : ''),
      board.rows.find(r => r.id === note.category)?.label || note.category,
      note.votes || 0
    ]),
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [102, 126, 234] },
    columnStyles: { 0: { cellWidth: 10 }, 3: { cellWidth: 15 } }
  });

  // Footer on each page
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    const isLandscape = i > 2 && i < totalPages;
    const footerY = isLandscape ? 200 : pageHeight - 10;
    const footerWidth = isLandscape ? 297 : pageWidth;
    doc.text(`${board.name} - AI Strategic Report`, margin, footerY);
    doc.text(`Page ${i} of ${totalPages}`, footerWidth - margin, footerY, { align: 'right' });
  }

  doc.save(`${filename}.pdf`);
}
