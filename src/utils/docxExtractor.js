/**
 * DOCX Word Data Extractor (Lazy Loaded)
 */

export async function extractDocx(file, showPb, hidePb) {
  if (showPb) showPb('Word 문서 분석 중...', 30);
  
  // Dynamic import for mammoth
  const mammoth = await import('mammoth');

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const res = await mammoth.extractRawText({ arrayBuffer: e.target.result });
        if (showPb) showPb('Word 분석 완료', 100);
        if (hidePb) setTimeout(hidePb, 600);
        resolve({
          type: 'docx',
          text: res.value || `[DOCX: ${file.name} — 텍스트를 추출할 수 없습니다.]`,
          cnt: 0
        });
      } catch (err) { reject(err); }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}
