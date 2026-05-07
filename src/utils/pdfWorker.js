/**
 * Web Worker for PDF Text Extraction (Optimized for Vite + Lazy Loaded)
 */

self.onmessage = async (e) => {
  const { arrayBuffer, workerSrc } = e.data;
  
  try {
    // Dynamic import inside worker
    const pdfjs = await import('pdfjs-dist');
    
    // Set worker source — use library version with fallback
    const pdfVersion = pdfjs.version || '4.10.38';
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfVersion}/pdf.worker.min.mjs`;
    
    if (workerSrc) pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
    
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
