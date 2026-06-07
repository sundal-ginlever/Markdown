/**
 * Web Worker for PDF Text Extraction (Optimized for Vite + Lazy Loaded)
 */

self.onmessage = async (e) => {
  const { arrayBuffer, workerSrc } = e.data;
  
  try {
    let pdfjs;
    try {
      // Dynamic import inside worker (modern browser standard)
      pdfjs = await import('pdfjs-dist');
      
      const pdfVersion = pdfjs.version || '4.10.38';
      pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfVersion}/pdf.worker.min.mjs`;
      if (workerSrc) pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
    } catch (importErr) {
      console.warn('Worker ESM dynamic import failed, falling back to legacy UMD script loading:', importErr);
      
      // Fallback UMD loads robust ES5-compatible build from cdnjs
      self.importScripts('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js');
      pdfjs = self['pdfjsLib'] || self['pdfjs-dist/build/pdf'];
      
      if (!pdfjs) {
        throw new Error('Fallback PDF library failed to initialize via importScripts');
      }
      
      pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
    }
    
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    const totalPages = pdf.numPages;
    let pageTexts = [];

    for (let i = 1; i <= totalPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .map(item => item.str)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
        
      if (pageText) {
        pageTexts.push(`--- Page ${i} ---\n${pageText}`);
      }
      
      self.postMessage({ type: 'progress', current: i, total: totalPages });
    }

    const fullText = pageTexts.join('\n\n');
    self.postMessage({ type: 'success', text: fullText, totalPages });
  } catch (err) {
    self.postMessage({ type: 'error', message: err.message });
  }
};
