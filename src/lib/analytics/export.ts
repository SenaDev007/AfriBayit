/**
 * AfriBayit — Analytics Data Export
 * Export analytics data to CSV or PDF
 */

export interface ExportOptions {
  format: 'csv' | 'pdf';
  filename: string;
  data: Record<string, unknown>[];
  columns?: { key: string; label: string }[];
  title?: string;
}

/**
 * Generate CSV from analytics data
 */
export function exportToCSV(data: Record<string, unknown>[], filename: string, columns?: { key: string; label: string }[]): string {
  if (!data.length) return '';

  const cols = columns || Object.keys(data[0]).map(k => ({ key: k, label: k }));

  // Header row
  const header = cols.map(c => `"${c.label}"`).join(',');

  // Data rows
  const rows = data.map(row =>
    cols.map(c => {
      const val = row[c.key];
      const str = val === null || val === undefined ? '' : String(val);
      return `"${str.replace(/"/g, '""')}"`;
    }).join(',')
  );

  return [header, ...rows].join('\n');
}

/**
 * Generate a simple PDF-compatible report (HTML for print)
 * In production, would use a proper PDF library
 */
export function exportToPDF(options: ExportOptions): string {
  const { data, title, columns } = options;
  const cols = columns || (data.length > 0 ? Object.keys(data[0]).map(k => ({ key: k, label: k })) : []);

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title || 'Rapport AfriBayit'}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; color: #2C2E2F; }
    h1 { color: #003087; font-size: 24px; border-bottom: 2px solid #D4AF37; padding-bottom: 8px; }
    h2 { color: #003087; font-size: 18px; margin-top: 20px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th { background: #003087; color: white; padding: 8px 12px; text-align: left; font-size: 12px; }
    td { padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-size: 12px; }
    tr:nth-child(even) td { background: #f9fafb; }
    .footer { margin-top: 40px; font-size: 10px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 8px; }
  </style>
</head>
<body>
  <h1>${title || 'Rapport Analytique AfriBayit'}</h1>
  <p>Généré le ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>

  <table>
    <thead>
      <tr>${cols.map(c => `<th>${c.label}</th>`).join('')}</tr>
    </thead>
    <tbody>
      ${data.map(row => `<tr>${cols.map(c => `<td>${row[c.key] ?? ''}</td>`).join('')}</tr>`).join('')}
    </tbody>
  </table>

  <div class="footer">
    AfriBayit — Plateforme Immobilière Pan-Africaine · Rapport confidentiel
  </div>
</body>
</html>`;

  return html;
}
