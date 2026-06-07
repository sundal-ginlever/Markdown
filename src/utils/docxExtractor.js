/**
 * DOCX Word Data Extractor (Lazy Loaded)
 */

async function loadMammothScript() {
  if (window.mammoth) return window.mammoth;
  
  return new Promise((resolve, reject) => {
    // Check if the script is already being injected or is in document
    const existingScript = document.querySelector('script[src*="mammoth.browser"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.mammoth));
      existingScript.addEventListener('error', () => reject(new Error('mammoth script load failed')));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.8.0/mammoth.browser.min.js';
    script.async = true;
    script.onload = () => resolve(window.mammoth);
    script.onerror = () => reject(new Error('mammoth script load failed'));
    document.head.appendChild(script);
  });
}

export async function extractDocx(file, showPb, hidePb, signal) {
  if (showPb) showPb('Word 문서 분석 중...', 30);
  if (signal && signal.aborted) throw new Error('Cancelled');
  
  // Safe Dynamic script injection instead of ESM dynamic import to prevent CommonJS fs/path bundle crashes in browser
  let mammothInstance;
  try {
    mammothInstance = await loadMammothScript();
  } catch (err) {
    throw new Error('Word 변환 모듈을 불러오지 못했습니다: ' + err.message);
  }
  
  if (signal && signal.aborted) throw new Error('Cancelled');

  return new Promise((resolve, reject) => {
    const onAbort = () => {
      cleanup();
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

    const reader = new FileReader();
    reader.onload = async (e) => {
      if (signal && signal.aborted) {
        cleanup();
        return reject(new Error('Cancelled'));
      }
      try {
        const res = await mammothInstance.extractRawText({ arrayBuffer: e.target.result });
        cleanup();
        if (signal && signal.aborted) return reject(new Error('Cancelled'));
        if (showPb) showPb('Word 분석 완료', 100);
        if (hidePb) setTimeout(hidePb, 600);
        resolve({
          type: 'docx',
          text: res.value || `[DOCX: ${file.name} — 텍스트를 추출할 수 없습니다.]`,
          cnt: 0
        });
      } catch (err) { 
        cleanup();
        if (hidePb) hidePb();
        reject(err); 
      }
    };
    
    reader.onerror = (err) => {
      cleanup();
      reject(err);
    };

    reader.readAsArrayBuffer(file);
  });
}
