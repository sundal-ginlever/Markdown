/**
 * Excel/Sheet Data Extractor (Lazy Loaded)
 */

export async function parseSheet(file, signal) {
  return new Promise((resolve, reject) => {
    if (signal && signal.aborted) return reject(new Error('Cancelled'));

    const reader = new FileReader();
    reader.onload = (e) => {
      if (signal && signal.aborted) return reject(new Error('Cancelled'));
      const arrayBuffer = e.target.result;
      
      const worker = new Worker(new URL('./xlsxWorker.js', import.meta.url), { type: 'module' });
      
      const onAbort = () => {
        cleanup();
        worker.terminate();
        reject(new Error('Cancelled'));
      };

      const cleanup = () => {
        if (signal) {
          signal.removeEventListener('abort', onAbort);
        }
      };

      if (signal) {
        signal.addEventListener('abort', onAbort);
      }

      worker.onmessage = (msg) => {
        const { type, data, message } = msg.data;
        cleanup();
        worker.terminate();
        if (type === 'success') {
          resolve(data); // Returns { names, text, cnt } directly from Worker!
        } else {
          reject(new Error(message || 'XLSX Worker 파싱에 실패했습니다.'));
        }
      };

      worker.onerror = (err) => {
        cleanup();
        worker.terminate();
        reject(err);
      };

      worker.postMessage({ arrayBuffer }, [arrayBuffer]);
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

export function sheetsToText(data) {
  // Returns pre-built text directly from worker
  return data.text || '';
}
