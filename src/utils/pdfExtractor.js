/**
 * PDF Text Extractor using Web Worker
 */

export async function extractPdf(file, showExtract, hideExtract) {
  if (showExtract) showExtract('PDF 텍스트 추출 중 (Worker)...', 5);
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const arrayBuffer = e.target.result;
      
      // Use Vite's worker syntax
      const worker = new Worker(new URL('./pdfWorker.js', import.meta.url), { type: 'module' });
      
      worker.onmessage = (msg) => {
        const { type, current, total, text, message } = msg.data;
        
        if (type === 'progress') {
          const pct = Math.round((current / total) * 80) + 10;
          if (showExtract) showExtract(`PDF 추출 중... (${current}/${total} 페이지)`, pct);
        } else if (type === 'success') {
          if (showExtract) showExtract('PDF 추출 완료', 100);
          if (hideExtract) setTimeout(hideExtract, 600);
          worker.terminate();
          resolve({
            type: 'pdf',
            text: text || `[PDF: ${file.name} — 텍스트를 추출할 수 없습니다.]`,
            pageCount: total,
            cnt: 0,
            meta: { pages: total, size: file.size }
          });
        } else if (type === 'error') {
          if (hideExtract) hideExtract();
          worker.terminate();
          resolve({
            type: 'pdf',
            text: `[PDF: ${file.name}] Worker 파싱 실패 (${message})`,
            cnt: 0,
            meta: { pages: 0 }
          });
        }
      };

      worker.onerror = (err) => {
        if (hideExtract) hideExtract();
        worker.terminate();
        reject(err);
      };

      worker.postMessage({ arrayBuffer }, [arrayBuffer]);
    };
    reader.onerror = () => reject(new Error('PDF 파일 읽기 실패'));
    reader.readAsArrayBuffer(file);
  });
}
