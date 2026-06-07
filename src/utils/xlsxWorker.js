import * as XLSX from 'xlsx';

self.onmessage = function (e) {
  try {
    const { arrayBuffer } = e.data;
    const data = new Uint8Array(arrayBuffer);
    
    // Read the workbook synchronously within the worker
    const wb = XLSX.read(data, { type: 'array' });
    
    const names = wb.SheetNames;
    const sheets = {};
    wb.SheetNames.forEach(n => {
      sheets[n] = XLSX.utils.sheet_to_json(wb.Sheets[n], { header: 1 });
    });
    
    // 2. Perform sheetsToText conversion safely inside Web Worker to keep main thread completely free!
    const result = [];
    names.forEach(n => {
      result.push(`### SHEET: ${n}`);
      const rows = sheets[n];
      if (Array.isArray(rows)) {
        rows.forEach(r => {
          if (Array.isArray(r)) {
            const rowText = r.map(c => {
              if (c === null || c === undefined) return '';
              return String(c)
                .replace(/\r?\n/g, ' ')
                .replace(/\t/g, ' ');
            }).join('\t');
            result.push(rowText);
          }
        });
      }
      result.push(''); // spacing
    });
    const fullText = result.join('\n').trim();

    // 3. Return only the flattened text and metadata, eliminating heavy structured clone overhead
    self.postMessage({ 
      type: 'success', 
      data: {
        names,
        text: fullText,
        cnt: names.length
      } 
    });
  } catch (error) {
    self.postMessage({ type: 'error', message: error.message || 'XLSX parsing failed' });
  }
};
