/**
 * Excel/Sheet Data Extractor (Lazy Loaded)
 */

export async function parseSheet(file) {
  // Dynamic import to reduce initial bundle size
  const XLSX = await import('xlsx');
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: 'array' });
        const res = { names: wb.SheetNames, sheets: {} };
        wb.SheetNames.forEach(n => {
          res.sheets[n] = XLSX.utils.sheet_to_json(wb.Sheets[n], { header: 1 });
        });
        resolve(res);
      } catch (err) { reject(err); }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

export function sheetsToText(data) {
  let txt = '';
  data.names.forEach(n => {
    txt += `\n\n### SHEET: ${n}\n`;
    const rows = data.sheets[n];
    if (Array.isArray(rows)) {
      rows.forEach(r => {
        if (Array.isArray(r)) {
          const rowText = r.map(c => {
            if (c === null || c === undefined) return '';
            // Convert to string and sanitize inner tabs/newlines to prevent breaking TSV structure
            return String(c)
              .replace(/\r?\n/g, ' ')
              .replace(/\t/g, ' ');
          }).join('\t');
          txt += rowText + '\n';
        }
      });
    }
  });
  return txt.trim();
}
