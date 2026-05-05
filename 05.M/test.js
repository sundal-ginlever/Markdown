
/* ══════════════════════════════════════════════════════
   CONVERSION STYLE DEFINITIONS
   Each style has: id, name, icon, color-class, desc, tags[], prompt(fname,ext,isSheet,sheetCnt)
══════════════════════════════════════════════════════ */
const STYLES = [
  {
    id: 'dev',
    name: 'Developer Docs',
    icon: '⚙️',
    cls: 'style-dev',
    color: '#15803D',
    desc: 'Code-first. README, API refs, changelogs.',
    tags: ['README','API','changelog','code blocks','badges'],
    prompt: (f,e,isSh,cnt) => `You are a senior technical writer creating developer documentation.

Convert the following ${isSh?`spreadsheet (${cnt} sheets)`:`${e} file`} into developer-optimised Markdown.

FILE: ${f}

## Output Rules
- **Structure**: H1 project title, then sections: Overview, Requirements/Prerequisites, Usage, Configuration, API Reference (if applicable), Examples, Changelog/Notes
- **Code**: Wrap ALL code, commands, paths, env vars in backtick fences with language hints (\`\`\`bash, \`\`\`python, \`\`\`json etc.)
- **Tables**: Use for parameters, options, environment variables, config keys
- **Badges**: Add text-based status badges like \`![status](passing)\` at the top where relevant
- **CLI**: Format command-line examples with \`$\` prefix
- **Links**: Use reference-style links for readability
- **Tone**: Technical, precise, no fluff. Active voice. Present tense.
- **DO NOT**: Add editorial commentary. No "In conclusion" sections. No marketing language.
- Output ONLY the Markdown. No preamble.`
  },
  {
    id: 'blog',
    name: 'Blog Post',
    icon: '✍️',
    cls: 'style-blog',
    color: '#C2410C',
    desc: 'Engaging narrative. Hook, story, CTA.',
    tags: ['hook','narrative','SEO','headings','CTA'],
    prompt: (f,e,isSh,cnt) => `You are a content writer converting source material into a polished blog post.

Convert the following ${isSh?`data (${cnt} sheets)`:`${e} document`} into a blog-post-optimised Markdown.

FILE: ${f}

## Output Rules
- **Opening Hook**: Start with a compelling 2-3 sentence hook — a bold claim, stat, or question — before the H1
- **Structure**: H1 title (SEO-optimised, ~60 chars), Introduction paragraph, H2 sections (3-6), Conclusion with takeaway, optional CTA
- **Voice**: Conversational but authoritative. First or second person ("you", "we"). Short punchy sentences mixed with longer ones.
- **Formatting**: Use callout blockquotes for key insights. Bold key phrases. Lists for enumerable items.
- **SEO**: Use the main topic as H1, related terms in H2s naturally
- **Length**: Aim for a complete, scannable post. Use a TL;DR summary block near the top.
- **Emoji**: Use sparingly (1-2 max) for visual breathing room
- **DO NOT**: Use academic tone. Avoid passive voice. No "In this article we will discuss".
- Output ONLY the Markdown. No preamble.`
  },
  {
    id: 'doc',
    name: 'Official Docs',
    icon: '📘',
    cls: 'style-doc',
    color: '#1D4ED8',
    desc: 'Formal. RFC-style structure. Versioned.',
    tags: ['formal','RFC','version','status','approval'],
    prompt: (f,e,isSh,cnt) => `You are a technical documentation specialist creating formal official documentation.

Convert the following ${isSh?`data source (${cnt} sheets)`:`${e} file`} into formal official-document Markdown.

FILE: ${f}

## Output Rules
- **Header Block**: Start with a YAML-like metadata block in a code fence:
  \`\`\`
  Document: [title]
  Version:  1.0.0
  Status:   Draft | Review | Approved
  Date:     [today]
  Author:   [inferred or "—"]
  \`\`\`
- **Structure**: Executive Summary → Scope & Purpose → Definitions/Glossary → Main Content sections → Appendix → References
- **Tone**: Formal, third-person, precise. Use "shall", "must", "should" per RFC 2119 where applicable.
- **Numbering**: Use numbered headings (1. / 1.1 / 1.1.1) for traceability
- **Tables**: Use for definitions, parameters, compliance requirements
- **Callouts**: Use blockquotes for ⚠️ warnings, ℹ️ notes, ✅ requirements
- **DO NOT**: Use contractions. No casual language. No first-person.
- Output ONLY the Markdown. No preamble.`
  },
  {
    id: 'wiki',
    name: 'Knowledge Wiki',
    icon: '🧠',
    cls: 'style-wiki',
    color: '#7C3AED',
    desc: 'Obsidian/Notion-style. Links, tags, graph-ready.',
    tags: ['[[wikilinks]]','#tags','callouts','backlinks','Obsidian'],
    prompt: (f,e,isSh,cnt) => `You are a knowledge management expert creating a wiki entry.

Convert the following ${isSh?`data (${cnt} sheets)`:`${e} document`} into a knowledge-wiki-optimised Markdown note.

FILE: ${f}

## Output Rules
- **Frontmatter**: Begin with YAML frontmatter:
  \`\`\`yaml
  ---
  title: [concise title]
  tags: [tag1, tag2, tag3]
  created: [date]
  type: note | concept | reference | process | index
  related: []
  ---
  \`\`\`
- **Structure**: One-line summary → Context/Background → Main Content → Key Concepts (defined inline) → Related Topics → References
- **Wikilinks**: Use [[Topic Name]] format for key concepts that could be their own notes
- **Callouts**: Use Obsidian-style callouts: \`> [!NOTE]\`, \`> [!TIP]\`, \`> [!WARNING]\`, \`> [!IMPORTANT]\`
- **Highlights**: Use ==highlighted text== for critical definitions
- **Tags**: Add a #tags line at the very bottom
- **Tone**: Encyclopedic but personal. Written to be referenced again. Dense with links.
- **DO NOT**: Use marketing language. No conclusions. Dense reference-style only.
- Output ONLY the Markdown. No preamble.`
  },
  {
    id: 'report',
    name: 'Report / Analysis',
    icon: '📊',
    cls: 'style-report',
    color: '#B45309',
    desc: 'Data-driven. Executive summary, insights, tables.',
    tags: ['exec summary','KPIs','insights','data tables','recommendations'],
    prompt: (f,e,isSh,cnt) => `You are a business analyst creating a professional report.

Convert the following ${isSh?`spreadsheet (${cnt} sheets)`:`${e} document`} into a report/analysis-optimised Markdown.

FILE: ${f}

## Output Rules
- **Executive Summary**: First section — 3-5 bullet points summarising key findings
- **Structure**: Executive Summary → Context → Methodology (brief) → Findings (data-rich, one H2 per major finding) → Insights & Analysis → Recommendations → Appendix (raw data tables)
- **Data**: Present all numerical data in clean Markdown tables. Include totals, averages, % changes where calculable.
- **Insights**: Use ➤ prefix for insight bullets. Bold the key takeaway in each insight.
- **Visual Cues**: Use blockquotes for highlighted KPIs or key numbers
- **Tone**: Professional, evidence-based. Third person. Quantify claims.
- **Trend Indicators**: Use ↑ ↓ → symbols for trend direction
- **DO NOT**: Editorialize without data. No vague claims. Every finding must reference data.
- Output ONLY the Markdown. No preamble.`
  },
  {
    id: 'custom',
    name: 'Custom',
    icon: '🎛️',
    cls: 'style-custom',
    color: '#0F766E',
    desc: 'Write your own system prompt.',
    tags: ['free-form','your rules','full control'],
    prompt: null  // uses custom-prompt textarea
  }
];

/* ══════════════════════════════════════════════════════
   STATE
══════════════════════════════════════════════════════ */
/* ══════════════════════════════════════════════════════
   I18N (다국어 지원)
══════════════════════════════════════════════════════ */
const I18N = {
  cur: 'ko',
  ko: {
    logo: 'DocVault',
    upload_btn: '문서 변환',
    api_key_btn: 'API 키',
    sync_btn: '클라우드',
    qa_btn: '질의응답',
    export_btn: '내보내기',
    style_sel_lbl: 'AI 엔진',
    search_ph: '문서 검색...',
    new_doc: '새 문서',
    empty_md: '변환된 문서가 없습니다',
    empty_raw: '업로드된 원본이 없습니다',
    sec_raw: '원본 파일',
    sec_md: '변환된 문서',
    tab_preview: '👁 미리보기',
    tab_edit: '✏️ 편집',
    tab_save: '💾 저장',
    tab_log: '📋 로그',
    wlc_ttl: 'DocVault에 오신 것을 환영합니다',
    wlc_sub: '파일을 드래그하거나 클릭하여 AI 변환을 시작하세요.',
    dz_txt: '변환할 파일을 여기에 드롭하세요',
    dz_sub: 'PDF, Word, TXT, CSV 등을 지원합니다',
    mo_up_ttl: '문서 업로드 및 변환',
    mo_up_sub: '파일을 선택하고 AI 변환 스타일을 지정하세요.',
    mo_up_drop: '파일을 선택하거나 드래그하세요',
    mo_style_ttl: '변환 스타일',
    mo_key_ttl: 'AI 프로바이더 설정',
    mo_key_sub: 'API 키는 브라우저에만 안전하게 저장됩니다.',
    mo_export_ttl: '내보내기',
    mo_export_sub: '문서를 다운로드하거나 클립보드에 복사합니다.',
    qa_empty_ttl: '문서에 대해 질문하세요',
    qa_input_ph: '질문을 입력하세요... (Enter로 전송)',
    status_ready: '준비 완료',
    status_proc: '처리 중...',
    toast_saved: '저장되었습니다',
    toast_deleted: '삭제되었습니다',
    toast_copied: '복사되었습니다',
    toast_err: '오류가 발생했습니다',
    toast_no_doc: '열려있는 문서가 없습니다',
    toast_copy_fail: '복사 실패 (권한 필요)',
    conf_clear: '저장된 모든 문서를 삭제할까요?\n(원본 파일 + 변환된 문서 + 수정 기록 전체)',
    export_bundle: '개 문서 번들 다운로드됨',
    export_obsidian: 'Obsidian 호환 포맷으로 내보냄',
    status_restore: '개 문서 복원됨',
    mo_reconv_ttl: '🔄 스타일 재변환',
    mo_reconv_sub: '같은 원본으로 다른 Markdown 스타일을 생성합니다. 기존 내용은 수정 기록에 보존됩니다.',
    btn_cancel: '취소',
    btn_close: '닫기',
    btn_save: '💾 저장',
    btn_clear: '🗑 전체 초기화',
    btn_install: '⬇️ 설치',
    btn_copy_my: '📋 내 문서로 복사',
    pwa_msg: '📱 앱으로 설치하면 오프라인에서도 사용할 수 있습니다',
    shared_msg: '🔗 공유된 문서입니다 — ',
    offline_msg: '⚡ 오프라인 모드 — 인터넷 연결 시 자동으로 클라우드에 동기화됩니다'
  },
  en: {
    logo: 'DocVault',
    upload_btn: 'Upload Doc',
    api_key_btn: 'API Key',
    sync_btn: 'Cloud',
    qa_btn: 'Q&A',
    export_btn: 'Export',
    style_sel_lbl: 'AI Engine',
    search_ph: 'Search docs...',
    new_doc: 'New Doc',
    empty_md: 'No converted docs',
    empty_raw: 'No source files',
    sec_raw: 'Raw Files',
    sec_md: 'Converted Docs',
    tab_preview: '👁 Preview',
    tab_edit: '✏️ Edit',
    tab_save: '💾 Save',
    tab_log: '📋 Log',
    wlc_ttl: 'Welcome to DocVault',
    wlc_sub: 'Drag or click to start AI conversion.',
    dz_txt: 'Drop files here to convert',
    dz_sub: 'Supports PDF, Word, TXT, CSV, etc.',
    mo_up_ttl: 'Upload & Convert',
    mo_up_sub: 'Select file and choose AI style.',
    mo_up_drop: 'Select or drag file',
    mo_style_ttl: 'Conversion Style',
    mo_key_ttl: 'AI Provider Settings',
    mo_key_sub: 'API keys are stored locally in your browser.',
    mo_export_ttl: 'Export',
    mo_export_sub: 'Download or copy documents.',
    qa_empty_ttl: 'Ask about this document',
    qa_input_ph: 'Type your question... (Enter to send)',
    status_ready: 'Ready',
    status_proc: 'Processing...',
    toast_saved: 'Saved',
    toast_deleted: 'Deleted',
    toast_copied: 'Copied',
    toast_err: 'Error occurred',
    toast_no_doc: 'No document is open',
    toast_copy_fail: 'Copy failed (Check permissions)',
    conf_clear: 'Delete all saved documents?\n(Raw files + Converted MD + Edit history)',
    export_bundle: 'docs bundle downloaded',
    export_obsidian: 'Exported for Obsidian',
    status_restore: 'docs restored',
    mo_reconv_ttl: '🔄 Reconvert Style',
    mo_reconv_sub: 'Generate a different Markdown style from the same source. Old content is kept in history.',
    btn_cancel: 'Cancel',
    btn_close: 'Close',
    btn_save: '💾 Save',
    btn_clear: '🗑 Clear All',
    btn_install: '⬇️ Install',
    btn_copy_my: '📋 Copy to My Docs',
    pwa_msg: '📱 Install as app to use offline',
    shared_msg: '🔗 Shared document — ',
    offline_msg: '⚡ Offline Mode — Changes will sync when online'
  }
};

function t(k) { return I18N[I18N.cur][k] || k; }

function setLang(l) {
  I18N.cur = l;
  S.lang = l;
  localStorage.setItem('dv_lang', l);
  renderI18N();
  toast(l === 'ko' ? '🇰🇷 한국어로 전환되었습니다' : '🇺🇸 Switched to English', 'ok');
}

function renderI18N() {
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-ph]').forEach(el => { el.placeholder = t(el.dataset.i18nPh); });
  document.querySelectorAll('[data-i18n-title]').forEach(el => { el.title = t(el.dataset.i18nTitle); });
  document.querySelectorAll('.lang-btn').forEach(btn => { btn.classList.toggle('act', btn.dataset.lang === I18N.cur); });
}

/* ══════════════════════════════════════════════════════
   STATE
══════════════════════════════════════════════════════ */
const S={
  raw:[],md:[],logs:{},activeDoc:null,mode:'view',logOpen:false,pendingFile:null,
  selectedStyle:'dev',  // default style
  secOpen:{raw:true,md:true},
  lang:'ko',
  ai:{provider:'claude',keys:{claude:'',gpt4:'',gemini:'',local:''},models:{claude:'claude-sonnet-4-20250514',gpt4:'gpt-4o',gemini:'gemini-1.5-pro',local:''},localUrl:''}
};

/* ══════════════════════════════════════════════════════
   INIT
══════════════════════════════════════════════════════ */
(function(){
  try{
    const l=localStorage.getItem('dv_lang'); if(l){ S.lang=l; I18N.cur=l; }
    const s=localStorage.getItem('dv_ai');
    if(s){
      let data;
      if(s.startsWith('{')){ // 하위 호환성: 기존 평문 JSON 처리
        data=JSON.parse(s);
      } else { // 새 방식: base64 디코딩
        data=JSON.parse(decodeURIComponent(escape(atob(s))));
      }
      Object.assign(S.ai,data);
    }
  }catch(e){console.warn('Init settings load failed:',e);}
  renderI18N();
  try{const s=localStorage.getItem('dv_style');if(s)S.selectedStyle=s;}catch(e){}
  document.getElementById('ai-sel').value=S.ai.provider;
  renderStyleGrid();
  updateStat();initRsz();initDrag();
  // P2: restore persisted docs first, then load demo if nothing stored
  if(!restoreFromStorage()) loadDemo();
})();

/* ══════════════════════════════════════════════════════
   STYLE GRID RENDER
══════════════════════════════════════════════════════ */
function renderStyleGrid(){
  const grid=document.getElementById('style-grid');
  grid.innerHTML=STYLES.map(st=>`
    <label class="sc ${st.cls} ${S.selectedStyle===st.id?'sel':''}" onclick="selectStyle('${st.id}')">
      <input type="radio" name="style" value="${st.id}" ${S.selectedStyle===st.id?'checked':''}>
      <span class="sc-ico">${st.icon}</span>
      <span class="sc-info">
        <span class="sc-name">${st.name}</span>
        <span class="sc-desc">${st.desc}</span>
        <span class="sc-tags">${st.tags.map(t=>`<span class="sc-tag">${t}</span>`).join('')}</span>
      </span>
    </label>`).join('');
  // show/hide custom prompt
  document.getElementById('custom-wrap').classList.toggle('show', S.selectedStyle==='custom');
}

function selectStyle(id){
  S.selectedStyle=id;
  localStorage.setItem('dv_style',id);
  renderStyleGrid();
}

function getStyleDef(){ return STYLES.find(s=>s.id===S.selectedStyle)||STYLES[0]; }

function styleColor(id){ return (STYLES.find(s=>s.id===id)||STYLES[0]).color; }

/* ══════════════════════════════════════════════════════
   STATUS
══════════════════════════════════════════════════════ */
function updateStat(){
  const p=S.ai.provider;
  const names={claude:'Claude',gpt4:'GPT-4o',gemini:'Gemini',local:'Local'};
  const hasKey=p==='local'?!!S.ai.localUrl:!!S.ai.keys[p];
  document.getElementById('sdot').className='sdot'+(hasKey?'':' w');
  document.getElementById('stxt').textContent=hasKey?names[p]:names[p]+' · no key';
  document.getElementById('key-btn').className='key-btn'+(hasKey?' ok':'');
}
function onProvChange(){S.ai.provider=document.getElementById('ai-sel').value;saveAI();updateStat();toast(`🔄 ${document.getElementById('ai-sel').options[document.getElementById('ai-sel').selectedIndex].text}`,'inf');}
function saveAI(){
  const json=JSON.stringify(S.ai);
  const encoded=btoa(unescape(encodeURIComponent(json)));
  localStorage.setItem('dv_ai',encoded);
}

/* ══════════════════════════════════════════════════════
   STYLE DETAIL / PROMPT PREVIEW
══════════════════════════════════════════════════════ */
function openStyleDetail(){
  const st=getStyleDef();
  document.getElementById('sd-ttl').textContent=`${st.icon} ${st.name} — System Prompt`;
  document.getElementById('sd-sub').textContent=st.desc;
  let promptText='';
  if(st.id==='custom'){
    promptText=document.getElementById('custom-prompt').value||'(Custom prompt is empty — type your instructions in the box)';
  } else {
    promptText=st.prompt('example.txt','txt',false,0);
  }
  document.getElementById('sd-prompt').textContent=promptText;
  document.getElementById('style-mo').classList.add('show');
}
function closeStyleMo(){document.getElementById('style-mo').classList.remove('show');}
function copyPrompt(){
  const txt=document.getElementById('sd-prompt').textContent;
  navigator.clipboard.writeText(txt).then(()=>toast('📋 Prompt copied','ok')).catch(()=>toast('Copy failed','err'));
}

/* ══════════════════════════════════════════════════════
   API KEY MODAL
══════════════════════════════════════════════════════ */
let aTab='claude';
function openKeyMo(){
  aTab=S.ai.provider;selPTab(aTab);
  document.getElementById('k-claude').value=S.ai.keys.claude||'';
  document.getElementById('k-gpt4').value=S.ai.keys.gpt4||'';
  document.getElementById('k-gemini').value=S.ai.keys.gemini||'';
  document.getElementById('k-local').value=S.ai.keys.local||'';
  document.getElementById('k-lurl').value=S.ai.localUrl||'';
  document.getElementById('m-claude').value=S.ai.models.claude;
  document.getElementById('m-gpt4').value=S.ai.models.gpt4;
  document.getElementById('m-gemini').value=S.ai.models.gemini;
  document.getElementById('m-local').value=S.ai.models.local||'';
  document.getElementById('key-mo').classList.add('show');
}
function closeKeyMo(){document.getElementById('key-mo').classList.remove('show');}
function selPTab(p){
  aTab=p;
  document.querySelectorAll('.ptab').forEach(t=>t.classList.toggle('act',t.dataset.p===p));
  ['claude','gpt4','gemini','local'].forEach(x=>document.getElementById('kf-'+x).style.display=x===p?'block':'none');
}
function saveKey(){
  S.ai.keys.claude=document.getElementById('k-claude').value.trim();
  S.ai.keys.gpt4=document.getElementById('k-gpt4').value.trim();
  S.ai.keys.gemini=document.getElementById('k-gemini').value.trim();
  S.ai.keys.local=document.getElementById('k-local').value.trim();
  S.ai.localUrl=document.getElementById('k-lurl').value.trim();
  S.ai.models.claude=document.getElementById('m-claude').value;
  S.ai.models.gpt4=document.getElementById('m-gpt4').value;
  S.ai.models.gemini=document.getElementById('m-gemini').value;
  S.ai.models.local=document.getElementById('m-local').value.trim();
  S.ai.provider=document.getElementById('ai-sel').value;
  saveAI();updateStat();closeKeyMo();toast('✅ API settings saved','ok');
}

/* ══════════════════════════════════════════════════════
   SPREADSHEET PARSING
══════════════════════════════════════════════════════ */
async function parseSheet(file){
  return new Promise((res,rej)=>{
    const r=new FileReader();
    r.onload=e=>{
      try{
        const wb=XLSX.read(e.target.result,{type:'binary'});
        const sheets={};
        wb.SheetNames.forEach(n=>{sheets[n]=XLSX.utils.sheet_to_json(wb.Sheets[n],{header:1,defval:'',raw:false});});
        res({names:wb.SheetNames,sheets});
      }catch(err){rej(err);}
    };
    r.onerror=()=>rej(new Error('File read error'));
    r.readAsBinaryString(file);
  });
}
function sheetsToText(d){
  let o='';
  d.names.forEach(n=>{
    o+=`\n=== Sheet: ${n} ===\n`;
    d.sheets[n].forEach(row=>{o+=row.join('\t')+'\n';});
  });
  return o;
}

/* ══════════════════════════════════════════════════════
   P6 — FILE EXTRACTION (PDF.js + mammoth.js)
══════════════════════════════════════════════════════ */

/* Progress helpers */
function showExtract(msg, pct) {
  const bar = document.getElementById('extract-bar');
  bar.classList.add('show');
  document.getElementById('extract-txt').textContent = msg;
  document.getElementById('extract-fill').style.width = pct + '%';
  document.getElementById('extract-pct').textContent = pct + '%';
}
function hideExtract() {
  document.getElementById('extract-bar').classList.remove('show');
  document.getElementById('extract-fill').style.width = '0%';
}

/* PDF extraction via PDF.js */
async function extractPdf(file) {
  showExtract('PDF 텍스트 추출 중...', 5);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        // Configure PDF.js worker
        if (typeof pdfjsLib !== 'undefined') {
          pdfjsLib.GlobalWorkerOptions.workerSrc =
            'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }

        const typedArray = new Uint8Array(e.target.result);
        const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;
        const totalPages = pdf.numPages;
        let fullText = '';
        let pageTexts = [];

        for (let i = 1; i <= totalPages; i++) {
          const pct = Math.round((i / totalPages) * 80) + 10;
          showExtract(`PDF 추출 중... (${i}/${totalPages} 페이지)`, pct);
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
        }

        fullText = pageTexts.join('\n\n');
        showExtract('PDF 추출 완료', 100);
        setTimeout(hideExtract, 600);

        resolve({
          type: 'pdf',
          text: fullText || `[PDF: ${file.name} — 텍스트를 추출할 수 없습니다. 스캔된 이미지 PDF일 수 있습니다.]`,
          pageCount: totalPages,
          cnt: 0,
          meta: { pages: totalPages, size: file.size }
        });
      } catch (err) {
        hideExtract();
        // Fallback: pass filename context to AI
        resolve({
          type: 'pdf',
          text: `[PDF: ${file.name}] PDF 파싱 실패 (${err.message}). 파일명을 기반으로 변환합니다.`,
          cnt: 0,
          meta: { pages: 0 }
        });
      }
    };
    reader.onerror = () => reject(new Error('PDF 파일 읽기 실패'));
    reader.readAsArrayBuffer(file);
  });
}

/* DOCX extraction via mammoth.js */
async function extractDocx(file) {
  showExtract('DOCX 텍스트 추출 중...', 20);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        showExtract('DOCX 문서 파싱 중...', 50);
        const result = await mammoth.extractRawText({ arrayBuffer: e.target.result });
        showExtract('DOCX 추출 완료', 100);
        setTimeout(hideExtract, 600);

        // Also try to get HTML for structure hints
        let structureHint = '';
        try {
          const htmlResult = await mammoth.convertToHtml({ arrayBuffer: e.target.result });
          // Extract heading structure from HTML
          const headings = [...htmlResult.value.matchAll(/<h([1-6])[^>]*>(.*?)<\/h[1-6]>/gi)]
            .map(m => `${'#'.repeat(parseInt(m[1]))} ${m[2].replace(/<[^>]+>/g, '')}`);
          if (headings.length > 0) {
            structureHint = '\n\n--- DOCUMENT STRUCTURE (headings) ---\n' + headings.join('\n');
          }
        } catch (_) { /* structure hints are optional */ }

        resolve({
          type: 'docx',
          text: (result.value || '') + structureHint,
          cnt: 0,
          meta: { messages: result.messages?.length || 0 }
        });
      } catch (err) {
        hideExtract();
        resolve({
          type: 'docx',
          text: `[DOCX: ${file.name}] 파싱 실패 (${err.message}). 파일명을 기반으로 변환합니다.`,
          cnt: 0
        });
      }
    };
    reader.onerror = () => reject(new Error('DOCX 파일 읽기 실패'));
    reader.readAsArrayBuffer(file);
  });
}

/* ══════════════════════════════════════════════════════
   FILE READ — now with real PDF + DOCX extraction
══════════════════════════════════════════════════════ */
async function readFile(file){
  const ext=file.name.split('.').pop().toLowerCase();
  if(['xlsx','xls','ods'].includes(ext)){
    const d=await parseSheet(file);
    return {type:'sheet',text:sheetsToText(d),sheetData:d,cnt:d.names.length};
  }
  if(ext==='pdf'){
    // Check if PDF.js loaded
    if(typeof pdfjsLib !== 'undefined') {
      return await extractPdf(file);
    }
    // Fallback if CDN failed
    return {type:'pdf',text:`[PDF: ${file.name}] PDF.js 로드 실패. 파일명 기반으로 변환합니다.`,cnt:0};
  }
  if(ext==='docx'){
    // Check if mammoth loaded
    if(typeof mammoth !== 'undefined') {
      return await extractDocx(file);
    }
    return {type:'docx',text:`[DOCX: ${file.name}] mammoth.js 로드 실패. 파일명 기반으로 변환합니다.`,cnt:0};
  }
  return new Promise(res=>{
    const r=new FileReader();
    r.onload=e=>res({type:'text',text:e.target.result,cnt:0});
    r.readAsText(file,'UTF-8');
  });
}

/* ══════════════════════════════════════════════════════
   BUILD PROMPT
══════════════════════════════════════════════════════ */
function buildPrompt(fname, fd, textOverride){
  const st=getStyleDef();
  const ext=fname.split('.').pop().toLowerCase();
  const isSh=fd.type==='sheet';
  const cnt=fd.cnt||0;
  const isPdf=fd.type==='pdf';
  const isDocx=fd.type==='docx';

  // File context header for AI
  let fileCtx = '';
  if(isPdf && fd.meta?.pages) fileCtx = ` (PDF · ${fd.meta.pages} 페이지)`;
  else if(isDocx) fileCtx = ' (DOCX · Word 문서)';
  else if(isSh) fileCtx = ` (스프레드시트 · ${cnt}개 시트)`;

  let systemPrompt='';
  if(st.id==='custom'){
    const custom=document.getElementById('custom-prompt').value.trim();
    systemPrompt=custom||`Convert the following document to clean, structured Markdown. Output ONLY Markdown.`;
  } else {
    systemPrompt=st.prompt(fname+fileCtx, ext, isSh, cnt);
  }

  const textToConvert = textOverride || fd.text.substring(0, 30000);

  return `${systemPrompt}

---
CONTENT TO CONVERT:
${textToConvert}
---`;
}

/* ══════════════════════════════════════════════════════
   AI CONVERT
══════════════════════════════════════════════════════ */
async function aiConvert(fname,fd,textOverride){
  const p=S.ai.provider;
  const prompt=buildPrompt(fname,fd,textOverride);

  if(p==='claude'){
    const h={'Content-Type':'application/json'};
    if(S.ai.keys.claude) h['x-api-key']=S.ai.keys.claude;
    const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:h,body:JSON.stringify({model:S.ai.models.claude,max_tokens:4096,messages:[{role:'user',content:prompt}]})});
    if(!r.ok) throw new Error(`Claude ${r.status}: ${await r.text()}`);
    const d=await r.json();return d.content.map(b=>b.text||'').join('');
  }
  if(p==='gpt4'){
    if(!S.ai.keys.gpt4) throw new Error('OpenAI key not set — click 🔑 API Key.');
    const r=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+S.ai.keys.gpt4},body:JSON.stringify({model:S.ai.models.gpt4,messages:[{role:'user',content:prompt}],max_tokens:4096})});
    if(!r.ok) throw new Error(`OpenAI ${r.status}`);
    const d=await r.json();return d.choices[0].message.content;
  }
  if(p==='gemini'){
    if(!S.ai.keys.gemini) throw new Error('Google AI key not set — click 🔑 API Key.');
    const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${S.ai.models.gemini}:generateContent?key=${S.ai.keys.gemini}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({contents:[{parts:[{text:prompt}]}]})});
    if(!r.ok) throw new Error(`Gemini ${r.status}`);
    const d=await r.json();return d.candidates[0].content.parts.map(x=>x.text).join('');
  }
  if(p==='local'){
    if(!S.ai.localUrl) throw new Error('Local endpoint not set — click 🔑 API Key.');
    const h={'Content-Type':'application/json'};
    if(S.ai.keys.local) h['Authorization']='Bearer '+S.ai.keys.local;
    const r=await fetch(S.ai.localUrl,{method:'POST',headers:h,body:JSON.stringify({model:S.ai.models.local||'default',messages:[{role:'user',content:prompt}]})});
    if(!r.ok) throw new Error(`Local API ${r.status}`);
    const d=await r.json();return d.choices?.[0]?.message?.content||d.response||JSON.stringify(d);
  }

  throw new Error('Unknown provider');
}

async function aiConvertLarge(fname, fd){
  const CHUNK_SIZE = 25000;
  const fullText = fd.text;
  if(fullText.length <= 30000) return await aiConvert(fname, fd);

  const chunks = [];
  for(let i=0; i<fullText.length; i+=CHUNK_SIZE){
    chunks.push(fullText.substring(i, i+CHUNK_SIZE));
  }

  let mergedMd = '';
  for(let i=0; i<chunks.length; i++){
    showPb(`Converting Chunk ${i+1}/${chunks.length}...`);
    const chunkMd = await aiConvert(fname, fd, chunks[i]);
    mergedMd += (i > 0 ? '\n\n' : '') + chunkMd;
  }
  return mergedMd;
}

/* ══════════════════════════════════════════════════════
   PROCESS FILE
══════════════════════════════════════════════════════ */
async function processFile(){
  const file=S.pendingFile;if(!file)return;
  const st=getStyleDef();
  closeUpMo();
  const pn=document.getElementById('ai-sel').options[document.getElementById('ai-sel').selectedIndex].text;
  showPb(`Converting with ${st.icon} ${st.name} style via ${pn}...`);
  try{
    const fd=await readFile(file);
    const id=Date.now().toString();
    S.raw.push({id,name:file.name,ext:file.name.split('.').pop().toLowerCase(),content:fd.text,size:file.size,uploadedAt:new Date()});
    renderRaw();
    const mdc=await aiConvertLarge(file.name,fd);
    const mn=file.name.replace(/\.[^.]+$/,'')+'.md';
    // Extra meta for display
    const extraInfo = fd.type==='pdf' && fd.meta?.pages
      ? ` (${fd.meta.pages}p)`
      : fd.type==='docx' ? ' (Word)' : '';
    const mf={id:'md_'+id,name:mn,rawId:id,content:mdc,cnt:fd.cnt||0,styleId:S.selectedStyle,createdAt:new Date(),srcType:fd.type};
    S.md.push(mf);S.logs['md_'+id]=[];
    renderMd();hidePb();openDoc(mf);
    persistToStorage();
    toast(`✅ "${mn}"${extraInfo} → ${st.icon} ${st.name}`,'ok');
  }catch(err){hidePb();toast(`❌ ${err.message}`,'err');console.error(err);}
}

/* ══════════════════════════════════════════════════════
   RENDER LISTS
══════════════════════════════════════════════════════ */
function renderRaw(){
  const el=document.getElementById('raw-l');
  document.getElementById('raw-cnt').textContent=S.raw.length;
  if(!S.raw.length){el.innerHTML='<div class="emp"><div class="ei">📂</div><span>No files yet</span></div>';return;}
  el.innerHTML=S.raw.map(f=>`<div class="fi" onclick="clickRaw('${f.id}')"><span class="fi-ico">${extIco(f.ext)}</span><span class="fi-nm">${esc(f.name)}</span><span class="fi-ext ${isXl(f.ext)?'xl':''}">${f.ext}</span></div>`).join('');
}
function renderMd(){
  const el=document.getElementById('md-l');
  document.getElementById('md-cnt').textContent=S.md.length;
  if(!S.md.length){el.innerHTML='<div class="emp"><div class="ei">✨</div><span>No converted docs</span></div>';return;}
  // In search mode, renderSearchResults handles the list
  if(SEARCH.query.length>=2){renderSearchResults();return;}
  el.innerHTML=S.md.map(f=>{
    const st=STYLES.find(s=>s.id===f.styleId)||STYLES[0];
    const isFav=S.favorites?.has(f.id);
    const tags=S.docTags?.[f.id]||[];
    const tagHtml=tags.slice(0,2).map(t=>`<span style="font-size:7px;color:var(--acc);font-family:var(--mono)">#${t}</span>`).join(' ');
    return `<div class="fi ${S.activeDoc?.id===f.id?'act':''}" onclick="openById('${f.id}')">
      <span class="fi-ico">🗒</span>
      <div style="flex:1;min-width:0;overflow:hidden">
        <div class="fi-nm">${esc(f.name)}</div>
        ${tags.length?`<div style="display:flex;gap:3px;margin-top:1px">${tagHtml}</div>`:''}
      </div>
      <span class="fi-style" style="color:${st.color};border-color:${st.color}40;background:${st.color}12">${st.icon}</span>
      <button class="fi-fav ${isFav?'on':''}" onclick="toggleFav('${f.id}',event)" title="즐겨찾기">★</button>
      <button class="fi-del" onclick="deleteDoc('${f.id}',event)" title="삭제">✕</button>
    </div>`;}).join('');
}
const extIco=e=>({pdf:'📕',txt:'📄',md:'🗒',docx:'📘',csv:'📊',json:'🔧',xlsx:'📗',xls:'📗',ods:'📗'})[e]||'📄';
const isXl=e=>['xlsx','xls','ods'].includes(e);
const esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

/* ══════════════════════════════════════════════════════
   OPEN DOC — update style badge in toolbar
══════════════════════════════════════════════════════ */
function openById(id){const f=S.md.find(f=>f.id===id);if(f)openDoc(f);}
function clickRaw(id){const m=S.md.find(m=>m.rawId===id);if(m)openDoc(m);}
function openDoc(f){
  S.activeDoc=f;setMode('view');
  document.getElementById('wlc-a').style.display='none';
  document.getElementById('doc-tb').style.display='flex';
  document.getElementById('doc-info-strip').style.display='flex';
  document.getElementById('dp-name').textContent=f.name;
  const st=STYLES.find(s=>s.id===f.styleId)||STYLES[0];
  const badge=document.getElementById('doc-style-badge');
  badge.style.display='flex';
  badge.style.color=st.color;
  badge.style.borderColor=st.color+'40';
  badge.style.background=st.color+'12';
  badge.innerHTML=`${st.icon} <span>${st.name}</span>`;
  badge.title=`Style: ${st.name} — 클릭하여 재변환`;
  renderDocInfoStrip(f);
  renderMd();renderViewer();
  if(window.innerWidth<=600)closeMobSb();
}

/* ══════════════════════════════════════════════════════
   MARKDOWN PARSER
══════════════════════════════════════════════════════ */
function parseMd(s){
  const fns = {};
  s = s.replace(/^\[\^([^\]]+)\]:\s*(.+)$/gm, (_, id, content) => {
    fns[id] = content;
    return '';
  });

  const safeUrl=u=>{
    const p=u.trim().toLowerCase();
    if(p.startsWith('javascript:')||p.startsWith('vbscript:')||p.startsWith('data:text/html')) return '#';
    return u.replace(/"/g,'&quot;');
  };
  // protect YAML frontmatter
  s=s.replace(/^---\n([\s\S]*?)\n---/m,(_,fm)=>`__FM__${btoa(unescape(encodeURIComponent(fm)))}__FM__`);
  
  s=s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  
  // Restore YAML
  s=s.replace(/__FM__(.*?)__FM__/g,(_,b)=>`<div class="mdv-fm"><pre><code>${decodeURIComponent(escape(atob(b)))}</code></pre></div>`);
  
  // Code Blocks with Copy Button
  s=s.replace(/```(\w*)\n?([\s\S]*?)```/g,(_,l,c)=>{
    const id = 'cb_' + Math.random().toString(36).substr(2, 9);
    return `<div class="code-wrap"><button class="cb-copy" onclick="copyCode('${id}', this)">📋 Copy</button><pre><code id="${id}" class="lang-${l}">${c.trim()}</code></pre></div>`;
  });

  s=s.replace(/^#{4} (.+)$/gm,'<h4>$1</h4>');
  s=s.replace(/^#{3} (.+)$/gm,'<h3>$1</h3>');
  s=s.replace(/^#{2} (.+)$/gm,'<h2>$1</h2>');
  s=s.replace(/^# (.+)$/gm,'<h1>$1</h1>');
  s=s.replace(/^---+$/gm,'<hr>');
  // Obsidian callouts
  s=s.replace(/^> \[!(NOTE|TIP|WARNING|IMPORTANT|INFO)\](.*?)$([\s\S]*?)(?=^[^>]|\n\n|$)/gm,(_,type,title,body)=>{
    const icons={NOTE:'ℹ️',TIP:'💡',WARNING:'⚠️',IMPORTANT:'🔴',INFO:'ℹ️'};
    const colors={NOTE:'var(--acc)',TIP:'var(--grn)',WARNING:'var(--yel)',IMPORTANT:'var(--red)',INFO:'var(--acc)'};
    return `<blockquote style="border-left-color:${colors[type]}"><strong>${icons[type]} ${type}${title}</strong>${body}</blockquote>`;
  });
  s=s.replace(/((?:^> .+\n?)+)/gm, b => {
    const content = b.trim().split('\n').map(l => l.replace(/^> /, '')).join('<br>');
    return `<blockquote>${content}</blockquote>`;
  });
  s=s.replace(/\*\*\*(.+?)\*\*\*/g,'<strong><em>$1</em></strong>');
  s=s.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>');
  s=s.replace(/\*(.+?)\*/g,'<em>$1</em>');
  s=s.replace(/__(.+?)__/g,'<strong>$1</strong>');
  s=s.replace(/~~(.+?)~~/g,'<del>$1</del>');
  s=s.replace(/==(.+?)==/g,'<mark style="background:rgba(245,200,66,.25);padding:1px 3px;border-radius:2px">$1</mark>');
  s=s.replace(/\[\[([^\]]+)\]\]/g,'<a href="#" style="color:var(--pur);border-bottom:1px dashed var(--pur)">[[<span>$1</span>]]</a>');
  s = s.replace(/\[\^([^\]]+)\]/g, (match, id) => {
    if (fns[id]) return `<sup class="fn-ref"><a href="#fn-${id}" id="fnref-${id}">[${id}]</a></sup>`;
    return match;
  });
  s=s.replace(/`([^`]+)`/g,'<code>$1</code>');
  s=s.replace(/!\[([^\]]*)\]\(([^)]+)\)/g,(_,a,u)=>`<img src="${safeUrl(u)}" alt="${a.replace(/"/g,'&quot;')}" style="max-width:100%;border-radius:6px">`);
  s=s.replace(/\[([^\]]+)\]\(([^)]+)\)/g,(_,t,u)=>`<a href="${safeUrl(u)}" target="_blank" rel="noopener">${t}</a>`);
  // tables
  s=s.split('\n').map(l=>/^\|[\s\-|:]+\|$/.test(l.trim())?'__SEP__':l).join('\n');
  s=s.replace(/((?:^\|.+\|\n?)+)/gm,block=>{
    const lines=block.trim().split('\n').filter(l=>l!=='__SEP__'&&l.trim());
    if(!lines.length)return block;
    let h='<table>';
    lines.forEach((l,i)=>{
      const cells=l.replace(/^\||\|$/g,'').split('|').map(c=>c.trim());
      h+=i===0?`<thead><tr>${cells.map(c=>`<th>${c}</th>`).join('')}</tr></thead><tbody>`:`<tr>${cells.map(c=>`<td>${c}</td>`).join('')}</tr>`;
    });
    return h+'</tbody></table>';
  });
  s=s.replace(/__SEP__\n?/g,'');
  // Nested Lists (Unordered)
  s = s.replace(/((?:^[ \t]*[-*+].+\n?)+)/gm, block => {
    const lines = block.split('\n').filter(l => l.trim());
    let html = '<ul>', level = 0;
    lines.forEach(l => {
      const indent = (l.match(/^\s*/) || [""])[0].length;
      const newLevel = Math.floor(indent / 2);
      let text = l.trim().replace(/^[-*+]\s+/, '');
      text = text.replace(/^\[ \]\s*/, '<input type="checkbox" disabled style="margin-right:6px;vertical-align:middle">');
      text = text.replace(/^\[[xX]\]\s*/, '<input type="checkbox" checked disabled style="margin-right:6px;vertical-align:middle">');
      
      if (newLevel > level) html += '<ul>'.repeat(newLevel - level);
      else if (newLevel < level) html += '</ul>'.repeat(level - newLevel);
      html += `<li>${text}</li>`;
      level = newLevel;
    });
    return html + '</ul>'.repeat(level + 1);
  });

  // Nested Lists (Ordered)
  s = s.replace(/((?:^[ \t]*\d+\..+\n?)+)/gm, block => {
    const lines = block.split('\n').filter(l => l.trim());
    let html = '<ol>', level = 0;
    lines.forEach(l => {
      const indent = (l.match(/^\s*/) || [""])[0].length;
      const newLevel = Math.floor(indent / 2);
      let text = l.trim().replace(/^\d+\.\s+/, '');
      text = text.replace(/^\[ \]\s*/, '<input type="checkbox" disabled style="margin-right:6px;vertical-align:middle">');
      text = text.replace(/^\[[xX]\]\s*/, '<input type="checkbox" checked disabled style="margin-right:6px;vertical-align:middle">');

      if (newLevel > level) html += '<ol>'.repeat(newLevel - level);
      else if (newLevel < level) html += '</ol>'.repeat(level - newLevel);
      html += `<li>${text}</li>`;
      level = newLevel;
    });
    return html + '</ol>'.repeat(level + 1);
  });
  s=s.replace(/^(?!<[a-zA-Z\/!])(.+)$/gm,l=>l.trim()?`<p>${l}</p>`:'');

  const fnIds = Object.keys(fns);
  if (fnIds.length > 0) {
    let fnHtml = '<div class="footnotes"><h3>Footnotes</h3>';
    fnIds.forEach(id => {
      fnHtml += `<div class="fn-item" id="fn-${id}"><span class="fn-id">[${id}]</span><span class="fn-content">${fns[id]} <a href="#fnref-${id}">↩</a></span></div>`;
    });
    s += fnHtml + '</div>';
  }
  return s;
}
function renderViewer(){if(!S.activeDoc)return;document.getElementById('mdv').innerHTML=parseMd(S.activeDoc.content);}

/* ══════════════════════════════════════════════════════
   MODE / SAVE / LOG (unchanged)
══════════════════════════════════════════════════════ */
function setMode(m){
  S.mode=m;
  document.getElementById('b-view').classList.toggle('on',m==='view');
  document.getElementById('b-edit').classList.toggle('on',m==='edit');
  document.getElementById('b-save').style.display=m==='edit'?'flex':'none';
  if(m==='view'){document.getElementById('view-a').style.display='block';document.getElementById('edit-a').style.display='none';renderViewer();}
  else{document.getElementById('view-a').style.display='none';document.getElementById('edit-a').style.display='flex';document.getElementById('mdt').value=S.activeDoc?.content||'';setTimeout(()=>document.getElementById('mdt').focus(),50);}
}
function saveEdit(){
  if(!S.activeDoc)return;
  const nxt=document.getElementById('mdt').value,prev=S.activeDoc.content;
  if(nxt===prev){toast('No changes','inf');return;}
  const delta=nxt.split('\n').length-prev.split('\n').length;
  S.activeDoc.content=nxt;
  const fi=S.md.findIndex(f=>f.id===S.activeDoc.id);if(fi!==-1)S.md[fi].content=nxt;
  if(!S.logs[S.activeDoc.id])S.logs[S.activeDoc.id]=[];
  S.logs[S.activeDoc.id].unshift({ts:new Date(),msg:`Edit: ${S.activeDoc.name}`,before:prev,after:nxt,delta});
  renderLog();setMode('view');persistToStorage();toast('✅ 저장 및 기록 완료','ok');
}
function toggleLog(){S.logOpen=!S.logOpen;document.getElementById('lgb').classList.toggle('open',S.logOpen);document.getElementById('b-log').classList.toggle('on',S.logOpen);renderLog();}
function renderLog(){
  const el=document.getElementById('lg-l');
  const logs=S.activeDoc?(S.logs[S.activeDoc.id]||[]):[];
  document.getElementById('lg-cnt').textContent=logs.length;
  if(!logs.length){el.innerHTML='<div style="padding:14px;color:var(--t3);font-size:10px;font-family:var(--mono);text-align:center">No edits yet</div>';return;}
  el.innerHTML=logs.map((l,i)=>`<div class="lg-i" onclick="restoreLog(${i})" title="Restore"><div class="lg-t">${fmtT(l.ts)}</div><div class="lg-m">${esc(l.msg)}</div><div class="lg-d ${l.delta>=0?'add':'del'}">${l.delta>=0?'＋':'－'}${Math.abs(l.delta)} lines</div></div>`).join('');
}
function restoreLog(i){
  if(!S.activeDoc)return;
  const logs=S.logs[S.activeDoc.id]||[];
  if(!logs[i]||!confirm('이 버전으로 복원할까요?'))return;
  S.activeDoc.content=logs[i].after;
  const fi=S.md.findIndex(f=>f.id===S.activeDoc.id);if(fi!==-1)S.md[fi].content=logs[i].after;
  renderViewer();toast('🔄 Version restored','ok');
}
function toggleSec(sec){
  S.secOpen[sec]=!S.secOpen[sec];
  document.getElementById(sec==='raw'?'raw-l':'md-l').style.display=S.secOpen[sec]?'':'none';
  document.getElementById(sec==='raw'?'h-raw':'h-md').classList.toggle('cls',!S.secOpen[sec]);
}

/* ══════════════════════════════════════════════════════
   UPLOAD MODAL
══════════════════════════════════════════════════════ */
function openUpMo(){
  document.getElementById('up-mo').classList.add('show');
  document.getElementById('sel-f').textContent='';
  const b=document.getElementById('b-proc');b.disabled=true;b.style.opacity='.4';
  S.pendingFile=null;document.getElementById('fi').value='';
  renderStyleGrid();
}
function closeUpMo(){document.getElementById('up-mo').classList.remove('show');}
document.getElementById('fi').addEventListener('change',e=>{if(e.target.files[0])selFile(e.target.files[0]);});
function selFile(file){
  S.pendingFile=file;
  const ext=file.name.split('.').pop().toLowerCase();
  document.getElementById('sel-f').innerHTML=`📎 <span style="color:var(--t1)">${esc(file.name)}</span> <span style="color:var(--t3)">(${(file.size/1024).toFixed(1)} KB${isXl(ext)?' · spreadsheet':''})</span>`;
  const b=document.getElementById('b-proc');b.disabled=false;b.style.opacity='1';
}
const moDz=document.getElementById('mo-dz');
moDz.addEventListener('dragover',e=>{e.preventDefault();moDz.classList.add('on');});
moDz.addEventListener('dragleave',()=>moDz.classList.remove('on'));
moDz.addEventListener('drop',e=>{e.preventDefault();moDz.classList.remove('on');if(e.dataTransfer.files[0])selFile(e.dataTransfer.files[0]);});
const mainDz=document.getElementById('main-dz');
mainDz.addEventListener('dragover',e=>{e.preventDefault();mainDz.classList.add('on');});
mainDz.addEventListener('dragleave',()=>mainDz.classList.remove('on'));
mainDz.addEventListener('drop',e=>{e.preventDefault();mainDz.classList.remove('on');if(e.dataTransfer.files[0]){openUpMo();setTimeout(()=>selFile(e.dataTransfer.files[0]),100);}});
document.getElementById('up-mo').addEventListener('click',e=>{if(e.target===document.getElementById('up-mo'))closeUpMo();});
document.getElementById('key-mo').addEventListener('click',e=>{if(e.target===document.getElementById('key-mo'))closeKeyMo();});
document.getElementById('style-mo').addEventListener('click',e=>{if(e.target===document.getElementById('style-mo'))closeStyleMo();});
document.getElementById('export-mo').addEventListener('click',e=>{if(e.target===document.getElementById('export-mo'))closeExportMo();});
document.getElementById('reconvert-mo').addEventListener('click',e=>{if(e.target===document.getElementById('reconvert-mo'))closeReconvertMo();});

/* ══════════════════════════════════════════════════════
   PROC / TOAST / RESIZER / MOBILE / KEYBOARD
══════════════════════════════════════════════════════ */
function showPb(m){document.getElementById('pb-txt').textContent=m;document.getElementById('pb').classList.add('show');}
function hidePb(){document.getElementById('pb').classList.remove('show');}
function toast(m,t=''){
  const c=document.getElementById('toasts');
  const el=document.createElement('div');el.className=`tst ${t}`;el.textContent=m;c.appendChild(el);
  setTimeout(()=>{el.style.transition='opacity .3s';el.style.opacity='0';setTimeout(()=>el.remove(),300);},2800);
}
function initRsz(){
  const r=document.getElementById('rsz'),sb=document.getElementById('sb');
  let drag=false,sx=0,sw=0;
  r.addEventListener('mousedown',e=>{drag=true;sx=e.clientX;sw=sb.offsetWidth;r.classList.add('drag');document.body.style.cssText='cursor:col-resize;user-select:none';});
  document.addEventListener('mousemove',e=>{if(!drag)return;sb.style.width=Math.max(140,Math.min(400,sw+e.clientX-sx))+'px';});
  document.addEventListener('mouseup',()=>{if(!drag)return;drag=false;r.classList.remove('drag');document.body.style.cssText='';});
}
function toggleMobSb(){const o=document.getElementById('sb').classList.toggle('mob');document.getElementById('mob-bd').classList.toggle('show',o);}
function closeMobSb(){document.getElementById('sb').classList.remove('mob');document.getElementById('mob-bd').classList.remove('show');}
function initDrag(){
  document.addEventListener('dragover',e=>e.preventDefault());
  document.addEventListener('drop',e=>{
    e.preventDefault();const f=e.dataTransfer.files[0];
    if(f&&!document.getElementById('up-mo').classList.contains('show')){openUpMo();setTimeout(()=>selFile(f),100);}
  });
}
document.addEventListener('keydown',e=>{
  if((e.ctrlKey||e.metaKey)&&e.key==='s'&&S.mode==='edit'){e.preventDefault();saveEdit();}
  if((e.ctrlKey||e.metaKey)&&e.key==='e'){e.preventDefault();if(S.activeDoc)setMode(S.mode==='edit'?'view':'edit');}
  if((e.ctrlKey||e.metaKey)&&e.key==='d'){e.preventDefault();if(S.activeDoc)downloadMd();}
  if((e.ctrlKey||e.metaKey)&&e.key==='r'){e.preventDefault();if(S.activeDoc)openReconvertMo();}
  if((e.ctrlKey||e.metaKey)&&e.key==='/'){e.preventDefault();if(S.activeDoc)toggleQA();}
  if((e.ctrlKey||e.metaKey)&&e.key==='k'){
    e.preventDefault();
    const si=document.getElementById('search-input');
    si.focus();si.select();
    if(window.innerWidth<=600){document.getElementById('sb').classList.add('mob');document.getElementById('mob-bd').classList.add('show');}
  }
  if(e.key==='Escape'){
    closeUpMo();closeKeyMo();closeStyleMo();closeExportMo();closeReconvertMo();
    // Close QA panel if open
    const qaPanel=document.getElementById('qa-panel');
    if(qaPanel.classList.contains('open')&&document.activeElement===document.getElementById('qa-input')){
      toggleQA();
    }
    if(document.activeElement===document.getElementById('search-input')){
      clearSearch();
      document.getElementById('search-input').blur();
    }
  }
  if(SEARCH.query.length>=2&&S.mode==='view'&&!e.ctrlKey&&!e.metaKey){
    if(e.key==='n'&&!e.shiftKey){e.preventDefault();nextHl();}
    if(e.key==='n'&&e.shiftKey){e.preventDefault();prevHl();}
  }
});
const fmtT=d=>d.toLocaleDateString('ko-KR')+' '+d.toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit',second:'2-digit'});

/* ══════════════════════════════════════════════════════
   P2 — localStorage PERSISTENCE
══════════════════════════════════════════════════════ */
const STORAGE_KEY = 'dv_docs_v1';
const MAX_STORAGE_CHARS = 4_500_000; // ~4.5MB safety limit

function persistToStorage(){
  try{
    // logs contain before/after content — trim to last 5 per doc to save space
    const logsSlim={};
    Object.keys(S.logs).forEach(k=>{logsSlim[k]=(S.logs[k]||[]).slice(0,5).map(l=>({ts:l.ts,msg:l.msg,delta:l.delta,after:l.after}));});
    const payload=JSON.stringify({raw:S.raw,md:S.md,logs:logsSlim,ts:Date.now()});
    if(payload.length>MAX_STORAGE_CHARS){
      // if too big, skip raw content (keep name/ext/meta only)
      const rawLite=S.raw.map(r=>({id:r.id,name:r.name,ext:r.ext,size:r.size,uploadedAt:r.uploadedAt}));
      const payloadLite=JSON.stringify({raw:rawLite,md:S.md,logs:logsSlim,ts:Date.now(),lite:true});
      localStorage.setItem(STORAGE_KEY,payloadLite);
    } else {
      localStorage.setItem(STORAGE_KEY,payload);
    }
  }catch(e){console.warn('Storage persist failed:',e);}
}

function restoreFromStorage(){
  try{
    const s=localStorage.getItem(STORAGE_KEY);
    if(!s) return false;
    const d=JSON.parse(s);
    if(!d.md||!d.md.length) return false;
    S.raw=d.raw||[];
    S.md=d.md.map(m=>({...m,createdAt:new Date(m.createdAt)}));
    // restore logs — rebuild full structure
    S.logs={};
    S.md.forEach(m=>{
      const saved=d.logs?.[m.id]||[];
      S.logs[m.id]=saved.map(l=>({...l,ts:new Date(l.ts),before:l.before||'',after:l.after||''}));
    });
    renderRaw();renderMd();
    if(S.md.length) openDoc(S.md[0]);
    toast(`📂 ${S.md.length}${t('status_restore')}`,'inf');
    return true;
  }catch(e){console.warn('Storage restore failed:',e);return false;}
}

function clearStorage(){
  if(!confirm(t('conf_clear'))) return;
  localStorage.removeItem(STORAGE_KEY);
  S.raw=[];S.md=[];S.logs={};S.activeDoc=null;
  renderRaw();renderMd();
  document.getElementById('doc-tb').style.display='none';
  document.getElementById('wlc-a').style.display='flex';
  document.getElementById('view-a').style.display='none';
  document.getElementById('edit-a').style.display='none';
  toast(`🗑 ${t('toast_deleted')}`,'inf');
}

function getStorageUsage(){
  try{
    const s=localStorage.getItem(STORAGE_KEY)||'';
    const kb=(s.length/1024).toFixed(1);
    const pct=Math.min(100,(s.length/MAX_STORAGE_CHARS*100).toFixed(0));
    return {kb,pct};
  }catch(e){return {kb:'?',pct:0};}
}

/* ══════════════════════════════════════════════════════
   P1 — DOWNLOAD & EXPORT
══════════════════════════════════════════════════════ */
function downloadMd(docId){
  const f=docId?S.md.find(m=>m.id===docId):S.activeDoc;
  if(!f){toast(t('toast_no_doc'),'err');return;}
  const blob=new Blob([f.content],{type:'text/markdown;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download=f.name;a.click();
  URL.revokeObjectURL(url);
  toast(`⬇️ ${f.name} 다운로드됨`,'ok');
}

function copyMdToClipboard(){
  if(!S.activeDoc){toast('열려있는 문서가 없습니다','err');return;}
  navigator.clipboard.writeText(S.activeDoc.content)
    .then(()=>toast(`📋 ${t('toast_copied')}`,'ok'))
    .catch(()=>toast(t('toast_copy_fail'),'err'));
}

function downloadAllMd(){
  if(!S.md.length){toast('변환된 문서가 없습니다','err');return;}
  // create a simple zip-like text bundle
  let bundle=`# DocVault Export Bundle\n# Generated: ${new Date().toLocaleString('ko-KR')}\n# Documents: ${S.md.length}\n\n`;
  S.md.forEach((f,i)=>{
    bundle+=`${'='.repeat(60)}\n# FILE ${i+1}: ${f.name}\n# Style: ${f.styleId} | Created: ${new Date(f.createdAt).toLocaleString('ko-KR')}\n${'='.repeat(60)}\n\n${f.content}\n\n`;
  });
  const blob=new Blob([bundle],{type:'text/markdown;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download=`docvault_export_${Date.now()}.md`;a.click();
  URL.revokeObjectURL(url);
  toast(`⬇️ ${S.md.length}${t('export_bundle')}`,'ok');
}

function exportToObsidian(){
  if(!S.activeDoc){toast('열려있는 문서가 없습니다','err');return;}
  // Obsidian-friendly: ensure frontmatter, add vault link hint
  let content=S.activeDoc.content;
  if(!content.startsWith('---')){
    const st=STYLES.find(s=>s.id===S.activeDoc.styleId)||STYLES[0];
    content=`---\ntitle: "${S.activeDoc.name.replace('.md','')}"\ntags: [docvault, ${S.activeDoc.styleId}]\ncreated: ${new Date().toISOString().split('T')[0]}\n---\n\n${content}`;
  }
  const blob=new Blob([content],{type:'text/markdown;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download=S.activeDoc.name;a.click();
  URL.revokeObjectURL(url);
  toast(t('export_obsidian'),'ok');
}

/* Open export modal */
function openExportMo(){
  if(!S.activeDoc&&!S.md.length){toast('내보낼 문서가 없습니다','err');return;}
  const usage=getStorageUsage();
  document.getElementById('export-doc-name').textContent=S.activeDoc?S.activeDoc.name:'(문서를 먼저 선택하세요)';
  document.getElementById('export-total').textContent=`${S.md.length}개 문서`;
  document.getElementById('storage-usage').textContent=`${usage.kb} KB / ~4,500 KB`;
  document.getElementById('storage-bar-fill').style.width=usage.pct+'%';
  document.getElementById('storage-bar-fill').style.background=usage.pct>80?'var(--red)':usage.pct>60?'var(--yel)':'var(--grn)';
  document.getElementById('export-mo').classList.add('show');
}
function closeExportMo(){document.getElementById('export-mo').classList.remove('show');}

/* ══════════════════════════════════════════════════════
   P3 — RECONVERT (style switching)
══════════════════════════════════════════════════════ */
function openReconvertMo(){
  if(!S.activeDoc){toast('열려있는 문서가 없습니다','err');return;}
  // pre-select a different style than current
  const cur=S.activeDoc.styleId||'dev';
  S.selectedStyle=cur;
  renderReconvertStyleGrid();
  document.getElementById('reconvert-doc-name').textContent=S.activeDoc.name;
  const curSt=STYLES.find(s=>s.id===cur)||STYLES[0];
  document.getElementById('reconvert-current').textContent=`${curSt.icon} ${curSt.name}`;
  document.getElementById('reconvert-mo').classList.add('show');
}
function closeReconvertMo(){document.getElementById('reconvert-mo').classList.remove('show');}

function renderReconvertStyleGrid(){
  const grid=document.getElementById('reconvert-style-grid');
  grid.innerHTML=STYLES.map(st=>`
    <label class="sc ${st.cls} ${S.selectedStyle===st.id?'sel':''}" onclick="selectStyle('${st.id}');renderReconvertStyleGrid()">
      <input type="radio" name="rc-style" value="${st.id}" ${S.selectedStyle===st.id?'checked':''}>
      <span class="sc-ico">${st.icon}</span>
      <span class="sc-info">
        <span class="sc-name">${st.name}</span>
        <span class="sc-desc">${st.desc}</span>
      </span>
    </label>`).join('');
  document.getElementById('reconvert-custom-wrap').classList.toggle('show', S.selectedStyle==='custom');
}

async function doReconvert(){
  if(!S.activeDoc)return;
  const st=getStyleDef();
  closeReconvertMo();
  // use raw content if available, else re-use existing MD as source
  const rawDoc=S.raw.find(r=>r.id===S.activeDoc.rawId);
  const sourceText=rawDoc?.content||S.activeDoc.content;
  const fname=rawDoc?.name||S.activeDoc.name;
  const pn=document.getElementById('ai-sel').options[document.getElementById('ai-sel').selectedIndex].text;
  showPb(`🔄 "${S.activeDoc.name}" → ${st.icon} ${st.name} 재변환 중...`);
  try{
    const fd={type:'text',text:sourceText,cnt:S.activeDoc.cnt||0};
    const mdc=await aiConvert(fname,fd);
    // save old version in log
    if(!S.logs[S.activeDoc.id])S.logs[S.activeDoc.id]=[];
    S.logs[S.activeDoc.id].unshift({
      ts:new Date(),
      msg:`Reconvert: ${(STYLES.find(s=>s.id===S.activeDoc.styleId)||STYLES[0]).icon}${S.activeDoc.styleId} → ${st.icon}${st.id}`,
      before:S.activeDoc.content,after:mdc,delta:mdc.split('\n').length-S.activeDoc.content.split('\n').length
    });
    S.activeDoc.content=mdc;
    S.activeDoc.styleId=S.selectedStyle;
    const idx=S.md.findIndex(f=>f.id===S.activeDoc.id);
    if(idx!==-1){S.md[idx].content=mdc;S.md[idx].styleId=S.selectedStyle;}
    renderMd();renderLog();openDoc(S.activeDoc);
    hidePb();persistToStorage();
    toast(`✅ ${st.icon} ${st.name} 스타일로 재변환 완료`,'ok');
  }catch(err){hidePb();toast(`❌ ${err.message}`,'err');console.error(err);}
}

/* ══════════════════════════════════════════════════════
   DEMO
══════════════════════════════════════════════════════ */
function loadDemo(){
  const d=new Date().toLocaleDateString('ko-KR');
  S.raw.push({id:'dr1',name:'api_notes.txt',ext:'txt',content:'demo',size:3200,uploadedAt:new Date()});
  S.raw.push({id:'dr2',name:'q2_sales.xlsx',ext:'xlsx',content:'demo',size:24576,uploadedAt:new Date()});
  S.raw.push({id:'dr3',name:'meeting_notes.txt',ext:'txt',content:'demo',size:1800,uploadedAt:new Date()});

  const demos=[
    {id:'dm1',name:'api_notes.md',rawId:'dr1',styleId:'dev',cnt:0,content:`# DocVault API — Integration Notes

![version](https://img.shields.io/badge/version-0.3.0-green) ![status](https://img.shields.io/badge/status-stable-blue)

## Overview

DocVault exposes a conversion pipeline that accepts raw documents and returns structured Markdown optimised for a chosen output style.

## Prerequisites

\`\`\`
Node.js >= 18.0
SheetJS  >= 0.18
Claude API key (sk-ant-...)
\`\`\`

## Quick Start

\`\`\`bash
# Clone and install
$ git clone https://github.com/example/docvault
$ cd docvault && npm install

# Set environment
$ export ANTHROPIC_API_KEY=sk-ant-your-key-here

# Start dev server
$ npm run dev
\`\`\`

## Configuration

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| \`AI_PROVIDER\` | string | \`claude\` | AI engine: claude, gpt4, gemini, local |
| \`DEFAULT_STYLE\` | string | \`dev\` | Conversion style preset |
| \`MAX_TOKENS\` | number | \`1000\` | Max output tokens |
| \`SUPABASE_URL\` | string | \`null\` | Cloud sync (Phase 2) |

## Conversion Styles

\`\`\`json
{
  "styles": ["dev", "blog", "doc", "wiki", "report", "custom"],
  "default": "dev"
}
\`\`\`

## Changelog

### v0.3.0
- ✅ Added conversion style presets (6 modes)
- ✅ Custom prompt support
- ✅ Prompt preview modal

### v0.2.0
- ✅ Spreadsheet support (xlsx, xls, ods)
- ✅ Multi-AI provider (Claude, GPT-4o, Gemini, Local)
- ✅ Responsive layout`},

    {id:'dm2',name:'q2_sales.md',rawId:'dr2',styleId:'report',cnt:3,content:`# Q2 2025 Sales Performance Report

---

## Executive Summary

- ➤ **Total Q2 revenue: ₩1,380M** — exceeding target by **+6.2%** (↑ vs Q1 +3.3%)
- ➤ **Product A leads growth** at +16% QoQ, driven by enterprise deals
- ➤ **Q3 at-risk**: ₩1,190M achieved vs ₩1,400M target (85% — ↓ needs remediation)
- ➤ **Annual run-rate** projects ₩5,370M vs ₩5,400M annual target (99.4%)
- ➤ **Recommendation**: Accelerate Product C pipeline in Q4 to offset Q3 shortfall

---

## Findings

### Finding 1 — Quarterly Revenue vs Target

| 분기 | 매출 | 목표 | 달성률 | Δ YoY |
|------|------|------|--------|-------|
| Q1 2025 | ₩1,240M | ₩1,200M | **103%** | ↑ +12% |
| Q2 2025 | ₩1,380M | ₩1,300M | **106%** | ↑ +11% |
| Q3 2025 | ₩1,190M | ₩1,400M | 85% | ↓ -4% |
| Q4 2025 | ₩1,560M | ₩1,500M | **104%** | ↑ +8% |

> **KPI HIGHLIGHT**: Q2 achieved highest quarterly revenue in company history at ₩1,380M

### Finding 2 — Product Mix Analysis

| 제품 | Q1 | Q2 | 성장률 | Trend |
|------|-----|-----|--------|-------|
| Product A | ₩500M | ₩580M | **+16%** | ↑ |
| Product B | ₩340M | ₩390M | **+14.7%** | ↑ |
| Product C | ₩400M | ₩410M | +2.5% | → |

➤ **Products A+B account for 70% of Q2 revenue** and both grew double-digits.

## Recommendations

1. **Product C**: Launch targeted SMB campaign in Q4 to recover Q3 gap
2. **Product A**: Replicate enterprise deal structure across APAC
3. **Forecasting**: Revise Q3 target to ₩1,250M (achievable baseline)`},

    {id:'dm3',name:'meeting_notes.md',rawId:'dr3',styleId:'wiki',cnt:0,content:`---
title: DocVault Architecture Discussion
tags: [architecture, meeting, docvault, decisions, 2025-Q2]
created: ${d}
type: note
related: [[DocVault Roadmap]], [[Supabase Integration]], [[AI Provider Strategy]]
---

One-line summary: Architecture review meeting to align on Phase 2 Supabase integration and multi-device sync approach.

---

## Context

Weekly engineering sync for [[DocVault]] project. Primary agenda: Phase 2 cloud storage decision.

## Key Decisions

> [!IMPORTANT] Decision: Supabase Selected
> Supabase chosen over Firebase for Phase 2 due to open-source nature, PostgreSQL compatibility, and [[Row Level Security]] support for multi-tenant document isolation.

> [!NOTE] Auth Strategy
> Email/password + Google OAuth via [[Supabase Auth]]. Session tokens stored in httpOnly cookies for security.

## Architecture Notes

- [[Documents Table]] → \`id, user_id, name, style_id, content, raw_content, created_at\`
- [[Edit Logs Table]] → \`id, doc_id, before, after, delta, ts\`
- [[Real-time Sync]] → Supabase Realtime channels with debounce (1500ms)

## Open Questions

- [ ] Conflict resolution for simultaneous edits across devices?
- [ ] Offline-first strategy — localStorage as write-ahead log?
- [ ] Rate limiting for AI conversion (per-user quota?)

## Related

#architecture #decisions #supabase #phase2`}
  ];

  demos.forEach(m=>{S.md.push({...m,createdAt:new Date()});S.logs[m.id]=[];});
  renderRaw();renderMd();openDoc(S.md[0]);

/* ══════════════════════════════════════════════════════
   P5 — FULL-TEXT SEARCH
   Features:
     - Real-time search across document title + content
     - Style filter chips (all / dev / blog / doc / wiki / report / custom)
     - Sort: relevance | newest | oldest | a-z
     - Snippet extraction with context around match
     - In-viewer highlight with ↑↓ navigation
     - Ctrl+K to focus search
     - Search clears when new doc uploaded
══════════════════════════════════════════════════════ */
const SEARCH = {
  query: '',
  filter: 'all',   // 'all' | style id
  activeHls: [],   // NodeList of current <mark> elements in viewer
  hlIdx: 0,        // current highlight index
};

/* ── INPUT HANDLER ── */
function onSearchInput() {
  const q = document.getElementById('search-input').value.trim();
  SEARCH.query = q;
  document.getElementById('search-clear').classList.toggle('show', q.length > 0);

  if (q.length === 0) {
    exitSearchMode();
    return;
  }
  if (q.length < 2) return; // wait for at least 2 chars
  renderSearchResults();
}

function setSearchFilter(f) {
  SEARCH.filter = f;
  document.querySelectorAll('.sf').forEach(el => el.classList.toggle('act', el.dataset.f === f));
  if (SEARCH.query.length >= 2) renderSearchResults();
}

function clearSearch() {
  SEARCH.query = '';
  document.getElementById('search-input').value = '';
  document.getElementById('search-clear').classList.remove('show');
  exitSearchMode();
}

/* ── SEARCH MODE TOGGLE ── */
function enterSearchMode() {
  document.getElementById('sb-raw').style.display = 'none';
  document.getElementById('sb-mds').style.display = 'none';
}

function exitSearchMode() {
  document.getElementById('sb-raw').style.display = '';
  document.getElementById('sb-mds').style.display = '';
  document.getElementById('search-stats').classList.remove('show');
  document.getElementById('hl-nav').style.display = 'none';
  // Remove highlights from viewer
  removeHighlights();
  // Re-render normal lists
  renderRaw(); renderMd();
}

/* ── CORE SEARCH ALGORITHM ── */
function searchDocs(query, filter, sort) {
  const q = query.toLowerCase();
  const words = q.split(/\s+/).filter(w => w.length >= 1);
  if (!words.length) return [];

  let results = S.md
    .filter(doc => filter === 'all' || doc.styleId === filter)
    .map(doc => {
      const nameLow  = doc.name.toLowerCase();
      const contLow  = doc.content.toLowerCase();

      // Score calculation
      let score = 0;
      let titleMatch = false;

      words.forEach(w => {
        // Title match — high weight
        const ti = nameLow.indexOf(w);
        if (ti !== -1) { score += 40; titleMatch = true; }

        // Content match — count occurrences
        let pos = 0, cnt = 0;
        while ((pos = contLow.indexOf(w, pos)) !== -1) { cnt++; pos++; }
        score += cnt * 3;
      });

      if (score === 0) return null;

      // Build snippet — find first occurrence, extract context
      const snippet = buildSnippet(doc.content, words, 120);
      const st = STYLES.find(s => s.id === doc.styleId) || STYLES[0];

      return { doc, score, snippet, titleMatch, st };
    })
    .filter(Boolean);

  // Sort
  if (sort === 'rel') results.sort((a, b) => b.score - a.score);
  else if (sort === 'new') results.sort((a, b) => new Date(b.doc.createdAt) - new Date(a.doc.createdAt));
  else if (sort === 'old') results.sort((a, b) => new Date(a.doc.createdAt) - new Date(b.doc.createdAt));
  else if (sort === 'az')  results.sort((a, b) => a.doc.name.localeCompare(b.doc.name));

  return results;
}

/* ── SNIPPET BUILDER ── */
function buildSnippet(content, words, maxLen) {
  // Find the position of first matching word in content
  const low = content.toLowerCase();
  let bestPos = -1;
  for (const w of words) {
    const idx = low.indexOf(w);
    if (idx !== -1 && (bestPos === -1 || idx < bestPos)) bestPos = idx;
  }
  if (bestPos === -1) return content.substring(0, maxLen);

  // Extract context around match
  const start = Math.max(0, bestPos - 30);
  const end   = Math.min(content.length, bestPos + maxLen);
  let snippet = (start > 0 ? '…' : '') + content.substring(start, end).replace(/\n/g, ' ');
  if (end < content.length) snippet += '…';
  return snippet;
}

/* ── HIGHLIGHT HELPER ── */
function highlightWords(text, words) {
  if (!words.length) return esc(text);
  let result = esc(text);
  words.forEach(w => {
    if (!w) return;
    const escaped = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    result = result.replace(new RegExp(`(${escaped})`, 'gi'), '<mark class="hl">$1</mark>');
  });
  return result;
}

/* ── RENDER SEARCH RESULTS ── */
function renderSearchResults() {
  const sort = document.getElementById('search-sort').value;
  const results = searchDocs(SEARCH.query, SEARCH.filter, sort);
  const words = SEARCH.query.toLowerCase().split(/\s+/).filter(w => w.length >= 1);

  enterSearchMode();

  const stats = document.getElementById('search-stats');
  if (results.length === 0) {
    stats.innerHTML = `검색: "${esc(SEARCH.query)}" — 결과 없음`;
    stats.classList.add('show');
    // Show empty state in md-l
    document.getElementById('sb-mds').style.display = '';
    document.getElementById('md-l').innerHTML = `
      <div class="search-empty">
        <div class="sei">🔍</div>
        <span>"${esc(SEARCH.query)}"</span>
        <span style="color:var(--t3)">일치하는 문서 없음</span>
      </div>`;
    return;
  }

  stats.innerHTML = `<span>검색: "<strong style="color:var(--acc)">${esc(SEARCH.query)}</strong>"</span><span>· ${results.length}개 문서</span>`;
  stats.classList.add('show');

  // Show results in the mds section
  document.getElementById('sb-mds').style.display = '';
  document.getElementById('h-md').querySelector('.badge').textContent = results.length;

  const el = document.getElementById('md-l');
  el.innerHTML = results.map(r => {
    const isAct = S.activeDoc?.id === r.doc.id;
    const hlName = highlightWords(r.doc.name, words);
    const hlSnip = highlightWords(r.snippet, words);
    const date = new Date(r.doc.createdAt).toLocaleDateString('ko-KR');
    return `<div class="sr ${isAct ? 'act' : ''}" onclick="openByIdAndHighlight('${r.doc.id}')">
      <div class="sr-top">
        <span class="sr-ico">🗒</span>
        <span class="sr-name">${hlName}</span>
        <span class="sr-style" style="color:${r.st.color};border-color:${r.st.color}40;background:${r.st.color}12">${r.st.icon}</span>
      </div>
      <div class="sr-snippet">${hlSnip}</div>
      <div class="sr-meta">${date}</div>
    </div>`;
  }).join('');
}

/* ── OPEN DOC + APPLY HIGHLIGHTS ── */
function openByIdAndHighlight(id) {
  const f = S.md.find(f => f.id === id);
  if (!f) return;
  openDoc(f);
  // Apply viewer highlights after render
  requestAnimationFrame(() => applyViewerHighlights());
  if (window.innerWidth <= 600) closeMobSb();
}

/* ── IN-VIEWER HIGHLIGHT ── */
function applyViewerHighlights() {
  if (!SEARCH.query || SEARCH.query.length < 2) return;
  const words = SEARCH.query.toLowerCase().split(/\s+/).filter(w => w.length >= 1);
  const viewer = document.getElementById('mdv');
  if (!viewer) return;

  // Walk text nodes and wrap matches
  const walker = document.createTreeWalker(viewer, NodeFilter.SHOW_TEXT, {
    acceptNode: n => n.parentElement.tagName === 'MARK' ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT
  });

  const nodesToReplace = [];
  while (walker.nextNode()) {
    const node = walker.currentNode;
    const text = node.textContent;
    const lower = text.toLowerCase();
    if (words.some(w => lower.includes(w))) {
      nodesToReplace.push(node);
    }
  }

  nodesToReplace.forEach(node => {
    const text = node.textContent;
    let html = text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    words.forEach(w => {
      if (!w) return;
      const esc2 = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      html = html.replace(new RegExp(`(${esc2})`, 'gi'), '<mark class="hl">$1</mark>');
    });
    const span = document.createElement('span');
    span.innerHTML = html;
    node.parentNode.replaceChild(span, node);
  });

  // Collect all highlights
  SEARCH.activeHls = Array.from(viewer.querySelectorAll('mark.hl'));
  SEARCH.hlIdx = 0;

  if (SEARCH.activeHls.length > 0) {
    document.getElementById('hl-nav').style.display = 'flex';
    scrollToHl(0);
  } else {
    document.getElementById('hl-nav').style.display = 'none';
  }
}

function removeHighlights() {
  const viewer = document.getElementById('mdv');
  if (!viewer) return;
  viewer.querySelectorAll('mark.hl').forEach(mark => {
    const parent = mark.parentNode;
    parent.replaceChild(document.createTextNode(mark.textContent), mark);
    parent.normalize();
  });
  SEARCH.activeHls = [];
  SEARCH.hlIdx = 0;
  document.getElementById('hl-nav').style.display = 'none';
}

function scrollToHl(idx) {
  if (!SEARCH.activeHls.length) return;
  SEARCH.activeHls.forEach((m, i) => {
    m.style.outline = i === idx ? '2px solid var(--acc)' : 'none';
    m.style.borderRadius = '2px';
  });
  SEARCH.activeHls[idx]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  document.getElementById('hl-status').textContent = `${idx + 1}/${SEARCH.activeHls.length}`;
}

function nextHl() {
  if (!SEARCH.activeHls.length) return;
  SEARCH.hlIdx = (SEARCH.hlIdx + 1) % SEARCH.activeHls.length;
  scrollToHl(SEARCH.hlIdx);
}

function prevHl() {
  if (!SEARCH.activeHls.length) return;
  SEARCH.hlIdx = (SEARCH.hlIdx - 1 + SEARCH.activeHls.length) % SEARCH.activeHls.length;
  scrollToHl(SEARCH.hlIdx);
}

/* ── RE-RENDER VIEWER WITH HIGHLIGHTS (override renderViewer) ── */
const _origRenderViewer = renderViewer;
renderViewer = function() {
  _origRenderViewer();
  if (SEARCH.query.length >= 2) {
    requestAnimationFrame(() => applyViewerHighlights());
  }
};

/* ── REFRESH SEARCH AFTER DOC CHANGES ── */
const _origRenderMd = renderMd;
renderMd = function() {
  _origRenderMd();
  // If search is active, re-run to include newly added docs
  if (SEARCH.query.length >= 2) {
    renderSearchResults();
  }
};

/* ══════════════════════════════════════════════════════
   P4 — SUPABASE CLOUD SYNC
   Architecture:
     - SB.client  : Supabase client instance
     - SB.user    : current auth user
     - SB.config  : { url, key } stored in localStorage
     - Sync flow  : processFile/saveEdit/doReconvert → dbSaveDoc()
                    App init → dbLoadAll() if logged in
     - Offline    : falls back to localStorage, syncs on reconnect
     - Migration  : one-click localStorage → Supabase
══════════════════════════════════════════════════════ */
const SB = {
  client: null,
  user: null,
  config: null,
  syncStatus: 'off',   // 'off' | 'ok' | 'syncing' | 'err'
  lastSync: null,
  channel: null,
  pendingSync: [],     // docs queued while offline
};

const SB_CONFIG_KEY = 'dv_sb_config';
const SETUP_SQL = `-- DocVault Schema (run once in Supabase SQL Editor)
-- =====================================================

create table if not exists public.dv_documents (
  id          text primary key,
  user_id     uuid references auth.users(id) on delete cascade not null,
  name        text not null,
  raw_id      text,
  raw_name    text,
  raw_ext     text,
  raw_content text,
  content     text not null,
  style_id    text default 'dev',
  sheet_count int  default 0,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create table if not exists public.dv_edit_logs (
  id          bigserial primary key,
  doc_id      text references public.dv_documents(id) on delete cascade,
  user_id     uuid references auth.users(id) on delete cascade,
  msg         text,
  delta       int  default 0,
  after_text  text,
  created_at  timestamptz default now()
);

-- Row Level Security: users only see their own data
alter table public.dv_documents enable row level security;
alter table public.dv_edit_logs  enable row level security;

create policy "users_own_docs" on public.dv_documents
  for all using (auth.uid() = user_id);

create policy "users_own_logs" on public.dv_edit_logs
  for all using (auth.uid() = user_id);

-- Index for fast queries
create index if not exists idx_docs_user on public.dv_documents(user_id, updated_at desc);
create index if not exists idx_logs_doc  on public.dv_edit_logs(doc_id, created_at desc);`;

/* ── INIT SUPABASE ── */
async function initSupabase() {
  try {
    const cfg = localStorage.getItem(SB_CONFIG_KEY);
    if (!cfg) return; // not configured
    SB.config = JSON.parse(cfg);
    if (!SB.config.url || !SB.config.key) return;

    SB.client = supabase.createClient(SB.config.url, SB.config.key);

    // Show SQL in setup modal
    document.getElementById('setup-sql-display').textContent = SETUP_SQL;
    document.getElementById('sb-url').value = SB.config.url;
    document.getElementById('sb-key').value = SB.config.key;

    // Mark app as cloud-active (shows cloud-only elements)
    document.body.classList.add('cloud-active');
    const cBtn = document.getElementById('cloud-setup-btn');
    cBtn.title = 'Supabase 설정';
    cBtn.querySelector('span') && (cBtn.querySelector('span').textContent = '설정됨');
    cBtn.style.color = 'var(--grn)';
    cBtn.style.borderColor = 'rgba(21,128,61,.3)';

    // Check session
    const { data: { session } } = await SB.client.auth.getSession();
    if (session?.user) {
      await onAuthSuccess(session.user);
    } else {
      // Show auth screen
      document.getElementById('auth-screen').style.display = 'flex';
    }

    // Listen for auth state changes
    SB.client.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        document.getElementById('auth-screen').style.display = 'none';
        await onAuthSuccess(session.user);
      } else if (event === 'SIGNED_OUT') {
        onAuthSignOut();
      }
    });

    // Online/offline detection
    window.addEventListener('online',  () => { hideOfflineBar(); flushPendingSync(); });
    window.addEventListener('offline', () => showOfflineBar());
    if (!navigator.onLine) showOfflineBar();

  } catch(e) {
    console.warn('Supabase init failed:', e);
  }
}

/* ── AUTH HANDLERS ── */
async function onAuthSuccess(user) {
  SB.user = user;
  updateUserUI(user);
  setSyncStatus('syncing', '데이터 로딩 중...');
  await dbLoadAll();
  setSyncStatus('ok', '동기화됨');

  // P6: Subscribe to Realtime changes
  subscribeRealtime();

  // Check if local docs exist for migration offer
  const local = localStorage.getItem(STORAGE_KEY);
  if (local) {
    const d = JSON.parse(local);
    if (d.md && d.md.length > 0 && S.md.length === 0) {
      document.getElementById('migrate-bar').classList.add('show');
    }
  }
}

function onAuthSignOut() {
  SB.user = null;
  setSyncStatus('off', '');
  updateUserUI(null);
  unsubscribeRealtime(); // P6: teardown channel
  document.getElementById('auth-screen').style.display = 'flex';
  S.raw = []; S.md = []; S.logs = {}; S.activeDoc = null;
  renderRaw(); renderMd();
  document.getElementById('doc-tb').style.display = 'none';
  document.getElementById('wlc-a').style.display = 'flex';
}

/* ── P6 REALTIME SYNC ── */
function subscribeRealtime() {
  if (!SB.client || !SB.user) return;
  // Tear down any existing channel
  unsubscribeRealtime();

  SB.channel = SB.client
    .channel('docvault-changes')
    .on(
      'postgres_changes',
      {
        event: '*',           // INSERT | UPDATE | DELETE
        schema: 'public',
        table: 'dv_documents',
        filter: `user_id=eq.${SB.user.id}`
      },
      (payload) => handleRealtimeDoc(payload)
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        document.getElementById('rt-badge').classList.add('show');
        console.log('[DocVault] Realtime connected');
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        document.getElementById('rt-badge').classList.remove('show');
      }
    });
}

function unsubscribeRealtime() {
  if (SB.channel) {
    SB.client?.removeChannel(SB.channel);
    SB.channel = null;
  }
  document.getElementById('rt-badge').classList.remove('show');
}

async function handleRealtimeDoc(payload) {
  const { eventType, new: newRow, old: oldRow } = payload;

  // Skip if this change originated from THIS tab (avoid double update)
  // We detect this by checking if the doc was recently saved from this session
  if (SB._lastSavedId && SB._lastSavedId === newRow?.id) {
    SB._lastSavedId = null;
    return;
  }

  if (eventType === 'INSERT' || eventType === 'UPDATE') {
    if (!newRow) return;
    const existingIdx = S.md.findIndex(m => m.id === newRow.id);
    const mapped = {
      id: newRow.id, name: newRow.name, rawId: newRow.raw_id || newRow.id,
      content: newRow.content, styleId: newRow.style_id || 'dev',
      cnt: newRow.sheet_count || 0, createdAt: new Date(newRow.created_at)
    };

    if (existingIdx === -1) {
      // New document from another device
      S.md.unshift(mapped);
      // Also add raw stub
      S.raw.unshift({
        id: newRow.raw_id || newRow.id, name: newRow.raw_name || newRow.name,
        ext: newRow.raw_ext || 'txt', content: newRow.raw_content || '',
        size: (newRow.raw_content || '').length, uploadedAt: new Date(newRow.created_at)
      });
      S.logs[mapped.id] = S.logs[mapped.id] || [];
      renderRaw(); renderMd();
      toast(`📡 새 문서 동기화됨: ${newRow.name}`, 'rt');
    } else {
      // Updated from another device — only apply if not currently editing
      if (S.activeDoc?.id === newRow.id && S.mode === 'edit') {
        // Don't overwrite active edit — show notification instead
        toast(`📡 "${newRow.name}" 이 다른 기기에서 수정됨 (편집 완료 후 새로고침)`, 'inf');
        return;
      }
      S.md[existingIdx] = mapped;
      if (S.activeDoc?.id === newRow.id) {
        S.activeDoc = mapped;
        renderViewer();
      }
      renderMd();
      toast(`📡 "${newRow.name}" 동기화됨`, 'rt');
    }
    setSyncStatus('ok', '동기화됨');
    persistToStorage();

  } else if (eventType === 'DELETE') {
    const id = oldRow?.id;
    if (!id) return;
    const idx = S.md.findIndex(m => m.id === id);
    if (idx !== -1) {
      const name = S.md[idx].name;
      S.md.splice(idx, 1);
      S.raw = S.raw.filter(r => r.id !== S.md[idx]?.rawId);
      if (S.activeDoc?.id === id) {
        S.activeDoc = null;
        document.getElementById('doc-tb').style.display = 'none';
        document.getElementById('wlc-a').style.display = 'flex';
      }
      renderRaw(); renderMd();
      toast(`📡 "${name}" 이 다른 기기에서 삭제됨`, 'inf');
      persistToStorage();
    }
  }
}

/* Tag last saved doc ID so Realtime handler can skip self-updates */
const _origDbSaveDoc = dbSaveDoc;
dbSaveDoc = async function(mf, rawDoc) {
  SB._lastSavedId = mf.id;
  return _origDbSaveDoc(mf, rawDoc);
};

function updateUserUI(user) {
  const avatar = document.getElementById('user-avatar');
  if (user) {
    const initial = (user.email || 'U')[0].toUpperCase();
    avatar.textContent = initial;
    avatar.title = user.email;
    document.getElementById('user-mo-email').textContent = user.email;
    document.getElementById('user-mo-avatar').textContent = initial;
  } else {
    avatar.textContent = '?';
    document.getElementById('user-mo-email').textContent = '—';
  }
}

/* ── AUTH UI FUNCTIONS ── */
function switchAuthTab(tab) {
  document.getElementById('tab-login').classList.toggle('act', tab==='login');
  document.getElementById('tab-signup').classList.toggle('act', tab==='signup');
  document.getElementById('auth-login-form').style.display  = tab==='login'  ? 'block' : 'none';
  document.getElementById('auth-signup-form').style.display = tab==='signup' ? 'block' : 'none';
  clearAuthMsg();
}

function showAuthMsg(msg, type) {
  const el = document.getElementById('auth-msg');
  el.textContent = msg;
  el.className = 'auth-msg ' + type;
}
function clearAuthMsg() {
  document.getElementById('auth-msg').className = 'auth-msg';
}

async function authSubmit() {
  if (!SB.client) return;
  const email = document.getElementById('auth-email').value.trim();
  const pw    = document.getElementById('auth-pw').value;
  if (!email || !pw) { showAuthMsg('이메일과 비밀번호를 입력하세요', 'err'); return; }
  const btn = document.getElementById('auth-submit');
  btn.disabled = true; btn.textContent = '로그인 중...';
  const { error } = await SB.client.auth.signInWithPassword({ email, password: pw });
  btn.disabled = false; btn.textContent = '로그인';
  if (error) showAuthMsg(error.message, 'err');
}

async function authSignup() {
  if (!SB.client) return;
  const email = document.getElementById('auth-email-s').value.trim();
  const pw    = document.getElementById('auth-pw-s').value;
  if (!email || !pw) { showAuthMsg('이메일과 비밀번호를 입력하세요', 'err'); return; }
  if (pw.length < 8) { showAuthMsg('비밀번호는 8자 이상이어야 합니다', 'err'); return; }
  const btn = document.getElementById('auth-signup-btn');
  btn.disabled = true; btn.textContent = '처리 중...';
  const { error } = await SB.client.auth.signUp({ email, password: pw });
  btn.disabled = false; btn.textContent = '계정 만들기';
  if (error) showAuthMsg(error.message, 'err');
  else showAuthMsg('✅ 이메일을 확인하고 인증 링크를 클릭하세요', 'ok');
}

async function authGoogle() {
  if (!SB.client) return;
  const { error } = await SB.client.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.href }
  });
  if (error) showAuthMsg(error.message, 'err');
}

function skipAuth() {
  document.getElementById('auth-screen').style.display = 'none';
  // Load local data
  if (!restoreFromStorage()) loadDemo();
  toast('💾 로컬 모드로 실행 중', 'inf');
}

async function signOut() {
  if (!SB.client) return;
  await SB.client.auth.signOut();
  closeUserMo();
  toast('👋 로그아웃됨', 'inf');
}

/* ── SETUP MODAL ── */
function openSetupMo() {
  document.getElementById('setup-sql-display').textContent = SETUP_SQL;
  if (SB.config) {
    document.getElementById('sb-url').value = SB.config.url || '';
    document.getElementById('sb-key').value = SB.config.key || '';
  }
  document.getElementById('setup-mo').classList.add('show');
}
function closeSetupMo() { document.getElementById('setup-mo').classList.remove('show'); }

async function testSupabaseConn() {
  const url = document.getElementById('sb-url').value.trim();
  const key = document.getElementById('sb-key').value.trim();
  if (!url || !key) { showSetupResult('URL과 Key를 입력하세요', 'err'); return; }
  showSetupResult('연결 테스트 중...', 'inf');
  try {
    const tc = supabase.createClient(url, key);
    const { error } = await tc.from('dv_documents').select('id').limit(1);
    if (error && error.code === '42P01') {
      showSetupResult('⚠️ 연결됨 — 하지만 테이블이 없습니다. SQL 스키마를 먼저 실행하세요.', 'warn');
    } else if (error) {
      showSetupResult('❌ ' + error.message, 'err');
    } else {
      showSetupResult('✅ 연결 성공! 저장 버튼을 눌러 적용하세요.', 'ok');
    }
  } catch(e) {
    showSetupResult('❌ 연결 실패: ' + e.message, 'err');
  }
}

function showSetupResult(msg, type) {
  const el = document.getElementById('setup-test-result');
  const colors = { ok:'var(--grn)', err:'var(--red)', warn:'var(--yel)', inf:'var(--t3)' };
  el.style.display = 'block';
  el.style.color = colors[type] || 'var(--t2)';
  el.textContent = msg;
}

async function saveSupabaseConfig() {
  const url = document.getElementById('sb-url').value.trim();
  const key = document.getElementById('sb-key').value.trim();
  if (!url || !key) { showSetupResult('URL과 Key를 입력하세요', 'err'); return; }
  SB.config = { url, key };
  localStorage.setItem(SB_CONFIG_KEY, JSON.stringify(SB.config));
  closeSetupMo();
  toast('✅ Supabase 설정 저장됨 — 페이지를 새로고침하면 로그인 화면이 나타납니다', 'ok');
  // Reinitialise
  await initSupabase();
}

function copySetupSql() {
  navigator.clipboard.writeText(SETUP_SQL)
    .then(() => toast('📋 SQL 복사됨 — Supabase SQL Editor에 붙여넣기 하세요', 'ok'))
    .catch(() => toast('복사 실패', 'err'));
}

/* ── USER MODAL ── */
function openUserMo() {
  if (!SB.user) return;
  const syncClasses = { ok:'ok', syncing:'syncing', err:'err', off:'off' };
  document.getElementById('user-sync-dot').className = 'sync-dot ' + (syncClasses[SB.syncStatus] || 'off');
  const syncLabels = { ok:'✅ 동기화됨', syncing:'🔄 동기화 중...', err:'❌ 오류', off:'⚫ 비활성' };
  document.getElementById('user-sync-txt').textContent = syncLabels[SB.syncStatus] || '—';
  document.getElementById('user-last-sync').textContent = SB.lastSync ? '마지막 동기화: ' + fmtT(SB.lastSync) : '아직 동기화 안됨';
  document.getElementById('user-mo-doccount').textContent = S.md.length;
  document.getElementById('user-mo').classList.add('show');
}
function closeUserMo() { document.getElementById('user-mo').classList.remove('show'); }

/* ── SYNC STATUS ── */
function setSyncStatus(status, label) {
  SB.syncStatus = status;
  const dot = document.getElementById('sync-dot');
  const lbl = document.getElementById('sync-lbl');
  dot.className = 'sync-dot ' + status;
  lbl.textContent = label;
  if (status === 'ok') SB.lastSync = new Date();
}

function showOfflineBar() {
  document.getElementById('offline-bar').classList.add('show');
  setSyncStatus('err', '오프라인');
}
function hideOfflineBar() {
  document.getElementById('offline-bar').classList.remove('show');
  setSyncStatus('ok', '온라인');
}

/* ── DB OPERATIONS ── */
async function dbLoadAll() {
  if (!SB.client || !SB.user) return;
  try {
    const { data: docs, error } = await SB.client
      .from('dv_documents')
      .select('*')
      .eq('user_id', SB.user.id)
      .order('updated_at', { ascending: false });
    if (error) throw error;

    // Load edit logs
    const docIds = docs.map(d => d.id);
    let logs = [];
    if (docIds.length > 0) {
      const { data: logData } = await SB.client
        .from('dv_edit_logs')
        .select('*')
        .in('doc_id', docIds)
        .order('created_at', { ascending: false });
      logs = logData || [];
    }

    // Map to app state
    S.raw = docs.map(d => ({
      id: d.raw_id || d.id,
      name: d.raw_name || d.name,
      ext: d.raw_ext || 'txt',
      content: d.raw_content || '',
      size: (d.raw_content || '').length,
      uploadedAt: new Date(d.created_at)
    }));
    S.md = docs.map(d => ({
      id: d.id,
      name: d.name,
      rawId: d.raw_id || d.id,
      content: d.content,
      styleId: d.style_id || 'dev',
      cnt: d.sheet_count || 0,
      createdAt: new Date(d.created_at)
    }));
    S.logs = {};
    S.md.forEach(m => {
      S.logs[m.id] = logs
        .filter(l => l.doc_id === m.id)
        .map(l => ({
          ts: new Date(l.created_at),
          msg: l.msg || '',
          delta: l.delta || 0,
          before: '',
          after: l.after_text || ''
        }));
    });

    renderRaw(); renderMd();
    if (S.md.length) openDoc(S.md[0]);
    setSyncStatus('ok', '동기화됨');
    toast(`☁️ ${S.md.length}개 문서 로드됨`, 'ok');
  } catch(e) {
    console.error('dbLoadAll:', e);
    setSyncStatus('err', '로드 실패');
    toast('☁️ 로드 실패: ' + e.message, 'err');
    // Fallback to local
    restoreFromStorage();
  }
}

async function dbSaveDoc(mf, rawDoc) {
  if (!SB.client || !SB.user) {
    // Queue for later if offline
    if (!navigator.onLine) { SB.pendingSync.push({ mf, rawDoc }); return; }
    return;
  }
  setSyncStatus('syncing', '저장 중...');
  try {
    const payload = {
      id: mf.id,
      user_id: SB.user.id,
      name: mf.name,
      raw_id: mf.rawId,
      raw_name: rawDoc?.name || null,
      raw_ext: rawDoc?.ext || null,
      raw_content: rawDoc?.content || null,
      content: mf.content,
      style_id: mf.styleId || 'dev',
      sheet_count: mf.cnt || 0,
      updated_at: new Date().toISOString()
    };
    const { error } = await SB.client
      .from('dv_documents')
      .upsert(payload, { onConflict: 'id' });
    if (error) throw error;
    setSyncStatus('ok', '동기화됨');
  } catch(e) {
    console.error('dbSaveDoc:', e);
    setSyncStatus('err', '저장 실패');
    toast('☁️ 클라우드 저장 실패 (로컬에는 저장됨)', 'err');
  }
}

async function dbSaveLog(docId, logEntry) {
  if (!SB.client || !SB.user) return;
  try {
    await SB.client.from('dv_edit_logs').insert({
      doc_id: docId,
      user_id: SB.user.id,
      msg: logEntry.msg,
      delta: logEntry.delta || 0,
      after_text: logEntry.after || ''
    });
  } catch(e) {
    console.warn('dbSaveLog:', e);
  }
}

async function dbDeleteDoc(docId) {
  if (!SB.client || !SB.user) return;
  try {
    await SB.client.from('dv_documents').delete().eq('id', docId).eq('user_id', SB.user.id);
  } catch(e) {
    console.warn('dbDeleteDoc:', e);
  }
}

/* ── FORCE SYNC ALL ── */
async function forceSyncAll() {
  if (!SB.client || !SB.user) { toast('로그인이 필요합니다', 'err'); return; }
  setSyncStatus('syncing', '전체 동기화 중...');
  let ok = 0, fail = 0;
  for (const mf of S.md) {
    const raw = S.raw.find(r => r.id === mf.rawId);
    try {
      await dbSaveDoc(mf, raw);
      ok++;
    } catch(e) { fail++; }
  }
  setSyncStatus('ok', '동기화됨');
  toast(`☁️ ${ok}개 동기화 완료${fail > 0 ? ` (${fail}개 실패)` : ''}`, ok > 0 ? 'ok' : 'err');
}

/* ── FLUSH PENDING ── */
async function flushPendingSync() {
  if (!SB.pendingSync.length) return;
  const queue = [...SB.pendingSync];
  SB.pendingSync = [];
  for (const { mf, rawDoc } of queue) {
    await dbSaveDoc(mf, rawDoc);
  }
  toast(`☁️ 오프라인 중 ${queue.length}개 문서 동기화 완료`, 'ok');
}

/* ── MIGRATE LOCAL → CLOUD ── */
async function migrateLocalToCloud() {
  if (!SB.client || !SB.user) { toast('로그인이 필요합니다', 'err'); return; }
  const local = localStorage.getItem(STORAGE_KEY);
  if (!local) return;
  const d = JSON.parse(local);
  if (!d.md || !d.md.length) return;

  document.getElementById('migrate-bar').classList.remove('show');
  showPb(`☁️ 로컬 ${d.md.length}개 문서를 클라우드로 이전 중...`);

  let ok = 0;
  for (const mf of d.md) {
    const raw = (d.raw || []).find(r => r.id === mf.rawId);
    await dbSaveDoc({ ...mf, createdAt: new Date(mf.createdAt) }, raw);
    ok++;
  }

  hidePb();
  toast(`✅ ${ok}개 문서가 클라우드로 이전됨`, 'ok');
  await dbLoadAll(); // reload from cloud
}

/* ── USER MODAL CLOSE ── */
document.getElementById('setup-mo').addEventListener('click', e => { if(e.target===document.getElementById('setup-mo')) closeSetupMo(); });
document.getElementById('user-mo').addEventListener('click',  e => { if(e.target===document.getElementById('user-mo'))  closeUserMo();  });

/* ── PATCH processFile TO ALSO CLOUD-SAVE ── */
const _origProcessFile = processFile;
processFile = async function() {
  // We'll intercept after the original completes by patching persistToStorage
};
// Patch persistToStorage to also trigger cloud save
const _origPersist = persistToStorage;
persistToStorage = function() {
  _origPersist();
  // Cloud save the most recently added doc
  if (SB.client && SB.user && S.md.length) {
    const mf  = S.md[S.md.length - 1];
    const raw = S.raw.find(r => r.id === mf.rawId);
    dbSaveDoc(mf, raw);
  }
};

/* ── PATCH saveEdit TO ALSO CLOUD-SAVE LOG ── */
const _origSaveEdit = saveEdit;
saveEdit = function() {
  _origSaveEdit();
  // cloud-save current doc + log
  if (SB.client && SB.user && S.activeDoc) {
    const mf  = S.activeDoc;
    const raw = S.raw.find(r => r.id === mf.rawId);
    const log = (S.logs[mf.id] || [])[0]; // most recent
    dbSaveDoc(mf, raw);
    if (log) dbSaveLog(mf.id, log);
  }
};

/* ══════════════════════════════════════════════════════
   P7 — AI DOCUMENT Q&A
   Features:
     - Chat panel slides up from viewer bottom
     - Full document context injected as system prompt
     - Multi-turn conversation history maintained per document
     - Uses same AI provider as conversion (Claude/GPT/Gemini/Local)
     - Quick preset questions
     - Markdown rendering in AI responses
     - Ctrl+/ to toggle panel
     - Conversation cleared when switching documents
     - Auto-resize textarea
══════════════════════════════════════════════════════ */
const QA = {
  history: {},      // { [docId]: [{role, content, ts}] }
  activeDocId: null,
  loading: false,
  expanded: false,
};

/* ── TOGGLE PANEL ── */
function toggleQA() {
  const panel = document.getElementById('qa-panel');
  const btn   = document.getElementById('b-qa');
  const isOpen = panel.classList.contains('open');
  if (isOpen) {
    panel.classList.remove('open');
    btn.classList.remove('qa-active');
  } else {
    if (!S.activeDoc) { toast('문서를 먼저 열어주세요', 'inf'); return; }
    panel.classList.add('open');
    btn.classList.add('qa-active');
    QA.activeDocId = S.activeDoc.id;
    renderQAMessages();
    updateQAModelBadge();
    setTimeout(() => document.getElementById('qa-input').focus(), 200);
  }
}

function toggleQAExpand() {
  QA.expanded = !QA.expanded;
  document.getElementById('qa-panel').classList.toggle('expanded', QA.expanded);
  document.getElementById('qa-expand-btn').textContent = QA.expanded ? '⤡' : '⤢';
}

/* ── UPDATE MODEL BADGE ── */
function updateQAModelBadge() {
  const names = { claude:'Claude', gpt4:'GPT-4o', gemini:'Gemini', local:'Local' };
  document.getElementById('qa-model-badge').textContent =
    names[S.ai.provider] || 'AI';
}

/* ── RENDER MESSAGES ── */
function renderQAMessages() {
  const docId = QA.activeDocId || S.activeDoc?.id;
  if (!docId) return;
  const msgs = QA.history[docId] || [];
  const container = document.getElementById('qa-messages');
  const empty = document.getElementById('qa-empty');

  if (!msgs.length) {
    empty.style.display = 'flex';
    // Remove any previous message elements
    container.querySelectorAll('.qa-msg').forEach(el => el.remove());
    container.querySelectorAll('.qa-ts').forEach(el => el.remove());
    return;
  }

  empty.style.display = 'none';
  // Re-render all messages
  const existing = container.querySelectorAll('.qa-msg, .qa-ts-wrap');
  existing.forEach(el => el.remove());

  msgs.forEach(msg => {
    const el = buildMsgEl(msg);
    container.appendChild(el);
  });

  // Scroll to bottom
  requestAnimationFrame(() => {
    container.scrollTop = container.scrollHeight;
  });
}

function buildMsgEl(msg) {
  const wrap = document.createElement('div');
  wrap.className = `qa-msg ${msg.role}`;
  const icon = msg.role === 'ai' ? '🤖' : '👤';
  const cls  = msg.role === 'ai' ? 'ai' : 'user';
  const content = msg.role === 'ai' ? renderQAMarkdown(msg.content) : esc(msg.content).replace(/\n/g, '<br>');
  const ts = msg.ts ? new Date(msg.ts).toLocaleTimeString('ko-KR', {hour:'2-digit', minute:'2-digit'}) : '';
  wrap.innerHTML = `
    <div class="qa-avatar ${cls}">${icon}</div>
    <div>
      <div class="qa-bubble">${content}</div>
      <div class="qa-ts">${ts}</div>
    </div>`;
  return wrap;
}

/* ── LIGHTWEIGHT MARKDOWN FOR QA RESPONSES ── */
function renderQAMarkdown(text) {
  let s = text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  s = s.replace(/```(\w*)\n?([\s\S]*?)```/g, (_,l,c) => `<pre>${c.trim()}</pre>`);
  s = s.replace(/^#{3} (.+)$/gm, '<h3>$1</h3>');
  s = s.replace(/^#{2} (.+)$/gm, '<h2>$1</h2>');
  s = s.replace(/^# (.+)$/gm,    '<h1>$1</h1>');
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/\*(.+?)\*/g,     '<em>$1</em>');
  s = s.replace(/`([^`]+)`/g,     '<code>$1</code>');
  s = s.replace(/^[-*] (.+)$/gm,  '<li>$1</li>');
  s = s.replace(/(<li>[\s\S]+?<\/li>)/g, '<ul>$1</ul>');
  s = s.replace(/^(?!<[a-zA-Z\/])(.+)$/gm, l => l.trim() ? `<p>${l}</p>` : '');
  return s;
}

/* ── TYPING INDICATOR ── */
function showTyping() {
  const container = document.getElementById('qa-messages');
  const el = document.createElement('div');
  el.className = 'qa-msg ai';
  el.id = 'qa-typing';
  el.innerHTML = `<div class="qa-avatar ai">🤖</div><div class="qa-bubble"><div class="qa-typing"><div class="qa-dot"></div><div class="qa-dot"></div><div class="qa-dot"></div></div></div>`;
  container.appendChild(el);
  container.scrollTop = container.scrollHeight;
}
function hideTyping() {
  document.getElementById('qa-typing')?.remove();
}

/* ── SEND MESSAGE ── */
async function sendQA(overrideText) {
  if (QA.loading) return;
  if (!S.activeDoc) { toast('문서를 먼저 열어주세요', 'inf'); return; }

  const inputEl = document.getElementById('qa-input');
  const text = overrideText || inputEl.value.trim();
  if (!text) return;

  if (!overrideText) {
    inputEl.value = '';
    inputEl.style.height = '34px';
  }

  QA.loading = true;
  QA.activeDocId = S.activeDoc.id;
  document.getElementById('qa-send').disabled = true;
  document.getElementById('qa-empty').style.display = 'none';

  // Add user message
  if (!QA.history[QA.activeDocId]) QA.history[QA.activeDocId] = [];
  const userMsg = { role: 'user', content: text, ts: new Date() };
  QA.history[QA.activeDocId].push(userMsg);

  const userEl = buildMsgEl(userMsg);
  document.getElementById('qa-messages').appendChild(userEl);
  showTyping();
  document.getElementById('qa-messages').scrollTop = 99999;

  try {
    const aiResponse = await callQAApi(text);
    hideTyping();
    const aiMsg = { role: 'ai', content: aiResponse, ts: new Date() };
    QA.history[QA.activeDocId].push(aiMsg);
    const aiEl = buildMsgEl(aiMsg);
    document.getElementById('qa-messages').appendChild(aiEl);
    document.getElementById('qa-messages').scrollTop = 99999;
  } catch(err) {
    hideTyping();
    const errMsg = { role: 'ai', content: `❌ 오류가 발생했습니다: ${err.message}`, ts: new Date() };
    QA.history[QA.activeDocId].push(errMsg);
    const errEl = buildMsgEl(errMsg);
    document.getElementById('qa-messages').appendChild(errEl);
  } finally {
    QA.loading = false;
    document.getElementById('qa-send').disabled = false;
    document.getElementById('qa-input').focus();
  }
}

function sendPreset(q) { sendQA(q); }

/* ── API CALL ── */
async function callQAApi(userQuestion) {
  const p = S.ai.provider;
  const doc = S.activeDoc;

  // System prompt: inject full document content as context
  const systemPrompt = `You are an expert document analyst and assistant. The user has opened the following document and wants to ask questions about it.

Document Name: ${doc.name}
Conversion Style: ${doc.styleId || 'dev'}
Document Length: ${doc.content.length} characters

--- DOCUMENT CONTENT START ---
${doc.content.substring(0, 16000)}
--- DOCUMENT CONTENT END ---

Instructions:
- Answer questions based on the document content above
- Be concise but thorough
- Use Markdown formatting in your responses (headers, lists, code blocks as needed)
- If the answer is not in the document, say so clearly
- Respond in the same language the user asks in (Korean or English)`;

  // Build conversation history for multi-turn
  const docHistory = QA.history[doc.id] || [];
  // Last N messages (exclude the message we just added)
  const historyForApi = docHistory.slice(-9, -1).map(m => ({
    role: m.role === 'ai' ? 'assistant' : 'user',
    content: m.content
  }));

  const messages = [
    ...historyForApi,
    { role: 'user', content: userQuestion }
  ];

  if (p === 'claude') {
    const h = { 'Content-Type': 'application/json' };
    if (S.ai.keys.claude) h['x-api-key'] = S.ai.keys.claude;
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST', headers: h,
      body: JSON.stringify({
        model: S.ai.models.claude,
        max_tokens: 1000,
        system: systemPrompt,
        messages
      })
    });
    if (!r.ok) throw new Error(`Claude ${r.status}: ${await r.text()}`);
    const d = await r.json();
    return d.content.map(b => b.text || '').join('');
  }

  if (p === 'gpt4') {
    if (!S.ai.keys.gpt4) throw new Error('OpenAI API 키가 필요합니다. 🔑 API Key를 클릭하세요.');
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type':'application/json', 'Authorization':'Bearer '+S.ai.keys.gpt4 },
      body: JSON.stringify({
        model: S.ai.models.gpt4,
        messages: [{ role:'system', content:systemPrompt }, ...messages]
      })
    });
    if (!r.ok) throw new Error(`OpenAI ${r.status}`);
    const d = await r.json();
    return d.choices[0].message.content;
  }

  if (p === 'gemini') {
    if (!S.ai.keys.gemini) throw new Error('Google AI API 키가 필요합니다. 🔑 API Key를 클릭하세요.');
    // Gemini: prepend system as first user turn
    const geminiMsgs = [
      { role:'user', parts:[{ text: systemPrompt + '\n\nUnderstood. I will answer questions about this document.' }] },
      { role:'model', parts:[{ text:'네, 문서를 읽었습니다. 질문해주세요.' }] },
      ...messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }))
    ];
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${S.ai.models.gemini}:generateContent?key=${S.ai.keys.gemini}`,
      { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({contents:geminiMsgs}) }
    );
    if (!r.ok) throw new Error(`Gemini ${r.status}`);
    const d = await r.json();
    return d.candidates[0].content.parts.map(x => x.text).join('');
  }

  if (p === 'local') {
    if (!S.ai.localUrl) throw new Error('로컬 엔드포인트가 설정되지 않았습니다. 🔑 API Key를 클릭하세요.');
    const h = { 'Content-Type':'application/json' };
    if (S.ai.keys.local) h['Authorization'] = 'Bearer ' + S.ai.keys.local;
    const r = await fetch(S.ai.localUrl, {
      method:'POST', headers:h,
      body: JSON.stringify({
        model: S.ai.models.local || 'default',
        messages: [{ role:'system', content:systemPrompt }, ...messages]
      })
    });
    if (!r.ok) throw new Error(`Local API ${r.status}`);
    const d = await r.json();
    return d.choices?.[0]?.message?.content || d.response || JSON.stringify(d);
  }

  throw new Error('알 수 없는 AI 제공자입니다');
}

/* ── CLEAR QA ── */
function clearQA() {
  const docId = QA.activeDocId || S.activeDoc?.id;
  if (docId) QA.history[docId] = [];
  document.querySelectorAll('#qa-messages .qa-msg').forEach(el => el.remove());
  document.getElementById('qa-empty').style.display = 'flex';
  toast('💬 대화 초기화됨', 'inf');
}

/* ── AUTO RESIZE TEXTAREA ── */
function autoResizeQA(el) {
  el.style.height = '34px';
  el.style.height = Math.min(el.scrollHeight, 120) + 'px';
}

/* ── KEYBOARD HANDLER ── */
function qaKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendQA();
  }
}

/* ── CLOSE QA WHEN SWITCHING DOCS ── */
const _origOpenDoc = openDoc;
openDoc = function(f) {
  _origOpenDoc(f);
  const panel = document.getElementById('qa-panel');
  if (panel.classList.contains('open')) {
    QA.activeDocId = f.id;
    renderQAMessages();
    updateQAModelBadge();
  }
};

/* ══════════════════════════════════════════════════════
   v0.9 — FAVORITES · TAGS · DELETE · Q&A PERSISTENCE
══════════════════════════════════════════════════════ */
S.favorites = new Set(JSON.parse(localStorage.getItem('dv_favs')||'[]'));
S.docTags   = JSON.parse(localStorage.getItem('dv_tags')||'{}');

function saveFavs(){localStorage.setItem('dv_favs',JSON.stringify([...S.favorites]));}
function saveTags(){localStorage.setItem('dv_tags',JSON.stringify(S.docTags));}

/* Favorites */
function toggleFav(id,e){
  e.stopPropagation();
  if(S.favorites.has(id)) S.favorites.delete(id);
  else S.favorites.add(id);
  saveFavs();
  const favs=S.md.filter(f=>S.favorites.has(f.id));
  const rest=S.md.filter(f=>!S.favorites.has(f.id));
  S.md=[...favs,...rest];
  renderMd();
  toast(S.favorites.has(id)?'★ 즐겨찾기 추가됨':'☆ 즐겨찾기 해제됨','inf');
}

/* Doc info strip */
function renderDocInfoStrip(f){
  const tags=S.docTags[f.id]||[];
  const inlineTags=document.getElementById('doc-tags-inline');
  const meta=document.getElementById('doc-info-meta');
  const date=f.createdAt?new Date(f.createdAt).toLocaleDateString('ko-KR'):'';
  const chars=(f.content||'').length;
  const words=(f.content||'').split(/\s+/).length;
  inlineTags.innerHTML=tags.map(t=>`<span class="doc-info-tag">#${esc(t)}<button class="dt-x" onclick="removeDocTag('${f.id}','${esc(t)}',event)">✕</button></span>`).join('');
  meta.textContent=`${date} · ${chars.toLocaleString()} chars · ${words.toLocaleString()} words`;
}

function addDocTag(){
  if(!S.activeDoc)return;
  const tag=prompt('태그를 입력하세요:');
  if(!tag||!tag.trim())return;
  const clean=tag.trim().toLowerCase().replace(/\s+/g,'-');
  if(!S.docTags[S.activeDoc.id])S.docTags[S.activeDoc.id]=[];
  if(!S.docTags[S.activeDoc.id].includes(clean)){
    S.docTags[S.activeDoc.id].push(clean);
    saveTags();renderDocInfoStrip(S.activeDoc);renderMd();
    toast(`🏷️ 태그 "${clean}" 추가됨`,'inf');
  }
}

function removeDocTag(docId,tag,e){
  e.stopPropagation();
  if(!S.docTags[docId])return;
  S.docTags[docId]=S.docTags[docId].filter(t=>t!==tag);
  saveTags();
  if(S.activeDoc?.id===docId)renderDocInfoStrip(S.activeDoc);
  renderMd();
}

/* Tag filter in search */
const _origSearchDocs2=searchDocs;
searchDocs=function(query,filter,sort){
  if(query.startsWith('#')){
    const tag=query.slice(1).toLowerCase();
    return S.md
      .filter(doc=>filter==='all'||doc.styleId===filter)
      .filter(doc=>(S.docTags[doc.id]||[]).some(t=>t.includes(tag)))
      .map(doc=>{
        const st=STYLES.find(s=>s.id===doc.styleId)||STYLES[0];
        return{doc,score:1,snippet:doc.content.substring(0,80)+'…',titleMatch:false,st};
      });
  }
  return _origSearchDocs2(query,filter,sort);
};

/* Delete doc */
function deleteDoc(id,e){
  e.stopPropagation();
  const f=S.md.find(f=>f.id===id);
  if(!f||!confirm(`"${f.name}" 을 삭제할까요?\n이 작업은 되돌릴 수 없습니다.`))return;
  S.md=S.md.filter(m=>m.id!==id);
  S.raw=S.raw.filter(r=>r.id!==f.rawId);
  delete S.logs[id]; S.favorites.delete(id); delete S.docTags[id]; delete QA.history[id];
  saveFavs();saveTags();persistToStorage();
  if(SB.client&&SB.user)dbDeleteDoc(id);
  if(S.activeDoc?.id===id){
    S.activeDoc=null;
    document.getElementById('doc-tb').style.display='none';
    document.getElementById('doc-info-strip').style.display='none';
    document.getElementById('wlc-a').style.display='flex';
    document.getElementById('view-a').style.display='none';
    document.getElementById('edit-a').style.display='none';
    const qap=document.getElementById('qa-panel');
    if(qap.classList.contains('open'))toggleQA();
  }
  renderRaw();renderMd();
  toast(`🗑 "${f.name}" 삭제됨`,'inf');
}
function deleteActiveDoc(){if(S.activeDoc)deleteDoc(S.activeDoc.id,{stopPropagation:()=>{}});}

/* Q&A history persistence */
const QA_KEY='dv_qa_history';
function saveQAHistory(){
  try{
    const slim={};
    Object.keys(QA.history).slice(-20).forEach(id=>{
      slim[id]=(QA.history[id]||[]).slice(-10).map(m=>({
        role:m.role,content:(m.content||'').substring(0,2000),
        ts:m.ts instanceof Date?m.ts.toISOString():m.ts
      }));
    });
    localStorage.setItem(QA_KEY,JSON.stringify(slim));
  }catch(e){console.warn('QA save:',e);}
}
function restoreQAHistory(){
  try{
    const s=localStorage.getItem(QA_KEY);if(!s)return;
    const d=JSON.parse(s);
    Object.keys(d).forEach(id=>{
      QA.history[id]=d[id].map(m=>({...m,ts:m.ts?new Date(m.ts):new Date()}));
    });
  }catch(e){console.warn('QA restore:',e);}
}
restoreQAHistory();

const _origSendQA2=sendQA;
sendQA=async function(ov){await _origSendQA2(ov);saveQAHistory();};

/* ══════════════════════════════════════════════════════
   v1.0 — SHARE · PWA · SERVICE WORKER
══════════════════════════════════════════════════════ */
const SHARE={access:'view',expiry:7,currentUrl:''};

function openShareMo(){
  if(!S.activeDoc){toast('문서를 먼저 열어주세요','inf');return;}
  document.getElementById('share-doc-name').textContent=`📄 ${S.activeDoc.name} 을 공유합니다`;
  document.getElementById('share-url-inp').value='';
  document.getElementById('share-mo').classList.add('show');
}
function closeShareMo(){document.getElementById('share-mo').classList.remove('show');}

function setShareAccess(l){
  SHARE.access=l;
  ['view','copy','edit'].forEach(x=>document.getElementById('ac-'+x).classList.toggle('act',x===l));
}

async function generateShareLink(){
  if(!S.activeDoc)return;
  const expiry=parseInt(document.getElementById('share-expiry').value);
  if(SB.client&&SB.user){
    const shareId='share_'+Date.now().toString(36);
    const expiresAt=expiry>0?new Date(Date.now()+expiry*86400000).toISOString():null;
    try{
      const{error}=await SB.client.from('dv_documents').upsert({
        id:shareId,user_id:SB.user.id,name:S.activeDoc.name,
        content:S.activeDoc.content,style_id:S.activeDoc.styleId||'dev',
        raw_content:JSON.stringify({shared:true,access:SHARE.access,expires_at:expiresAt,
          original_id:S.activeDoc.id,author:SB.user.email}),
        updated_at:new Date().toISOString()
      });
      if(error)throw error;
      const url=`${location.href.split('?')[0]}?share=${shareId}`;
      SHARE.currentUrl=url;
      document.getElementById('share-url-inp').value=url;
      toast('🔗 공유 링크 생성됨 (보안 강화)','ok');
    }catch(e){toast('공유 링크 생성 실패: '+e.message,'err');}
  }else{
    try{
      const payload={n:S.activeDoc.name,c:S.activeDoc.content,s:S.activeDoc.styleId,a:SHARE.access,ts:Date.now()};
      const b64=btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
      const url=`${location.href.split('?')[0]}?local_share=${b64}`;
      SHARE.currentUrl=url;
      document.getElementById('share-url-inp').value=url;
      toast('🔗 로컬 공유 링크 생성됨','inf');
    }catch(e){toast('링크 생성 실패: '+e.message,'err');}
  }
}

function copyShareUrl(){
  const url=document.getElementById('share-url-inp').value;
  if(!url){toast('먼저 링크를 생성하세요','inf');return;}
  navigator.clipboard.writeText(url).then(()=>toast('📋 링크 복사됨','ok')).catch(()=>toast('복사 실패','err'));
}

function revokeShare(){
  SHARE.currentUrl='';
  document.getElementById('share-url-inp').value='';
  toast('🔒 공유 취소됨','inf');
  closeShareMo();
}

/* Load shared doc on page open */
async function checkSharedDoc(){
  const params=new URLSearchParams(location.search);
  if(params.has('share')){
    const shareId=params.get('share');
    const sbUrl=params.get('sb') || (SB.config ? SB.config.url : null);
    const sbKey=params.get('k') || (SB.config ? SB.config.key : null);
    
    if(!sbUrl || !sbKey){
      toast('⚠️ 공유 문서를 불러오려면 Supabase 설정이 필요합니다','inf');
      return;
    }

    try{
      const tc=supabase.createClient(sbUrl,sbKey);
      const{data,error}=await tc.from('dv_documents').select('*').eq('id',shareId).single();
      if(error||!data){toast('공유 문서를 찾을 수 없습니다','err');return;}
      const meta=data.raw_content?JSON.parse(data.raw_content):{};
      if(meta.expires_at&&new Date(meta.expires_at)<new Date()){toast('⏰ 공유 링크가 만료됐습니다','err');return;}
      const shared={id:'shared_'+shareId,name:data.name,content:data.content,styleId:data.style_id||'dev',
        createdAt:new Date(data.created_at),rawId:null};
      S.md.unshift(shared);S.logs[shared.id]=[];
      renderMd();openDoc(shared);
      document.getElementById('shared-banner').classList.add('show');
      document.getElementById('shared-doc-author').textContent=meta.author?`공유자: ${meta.author}`:'공유된 문서';
      toast('🔗 공유된 문서를 불러왔습니다','ok');
    }catch(e){toast('공유 문서 로드 실패: '+e.message,'err');}
    return;
  }
  if(params.has('local_share')){
    try{
      const json=decodeURIComponent(escape(atob(params.get('local_share'))));
      const p=JSON.parse(json);
      const shared={id:'shared_local_'+Date.now(),name:p.n,content:p.c,styleId:p.s||'dev',
        createdAt:new Date(p.ts||Date.now()),rawId:null};
      S.md.unshift(shared);S.logs[shared.id]=[];
      renderMd();openDoc(shared);
      document.getElementById('shared-banner').classList.add('show');
      document.getElementById('shared-doc-author').textContent='로컬 공유 문서';
      toast('🔗 공유된 문서를 불러왔습니다','ok');
    }catch(e){toast('공유 링크 파싱 실패','err');}
  }
}

function cloneSharedDoc(){
  if(!S.activeDoc||!S.activeDoc.id.startsWith('shared_'))return;
  const clone={...S.activeDoc,id:'md_'+Date.now(),
    name:S.activeDoc.name.replace(/\.md$/,'')+'_복사본.md',createdAt:new Date()};
  S.md.push(clone);S.logs[clone.id]=[];
  renderMd();openDoc(clone);persistToStorage();
  document.getElementById('shared-banner').classList.remove('show');
  toast('📋 내 문서로 복사됨','ok');
}

/* PWA */
let _pwaPrompt=null;
window.addEventListener('beforeinstallprompt',e=>{
  e.preventDefault();_pwaPrompt=e;
  setTimeout(()=>document.getElementById('pwa-bar').classList.add('show'),3000);
});
async function installPWA(){
  if(!_pwaPrompt){toast('이미 설치됐거나 지원하지 않는 브라우저입니다','inf');return;}
  _pwaPrompt.prompt();
  const{outcome}=await _pwaPrompt.userChoice;
  if(outcome==='accepted'){toast('✅ DocVault 앱 설치 완료!','ok');document.getElementById('pwa-bar').classList.remove('show');}
  _pwaPrompt=null;
}
window.addEventListener('appinstalled',()=>{document.getElementById('pwa-bar').classList.remove('show');toast('✅ DocVault 앱으로 설치됨','ok');});

/* Service Worker (inline blob) */
if('serviceWorker' in navigator){
  const swCode=`const C='docvault-v1.0';
self.addEventListener('install',e=>{self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener('fetch',e=>{
  if(!e.request.url.startsWith('http'))return;
  e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request).then(r=>{
    if(r.ok&&r.type==='basic'){const cl=r.clone();caches.open(C).then(cache=>cache.put(e.request,cl));}
    return r;
  }).catch(()=>new Response('Offline',{status:503}))));
});`;
  const swUrl=URL.createObjectURL(new Blob([swCode],{type:'application/javascript'}));
  navigator.serviceWorker.register(swUrl).catch(()=>{});
}

/* PWA manifest */
(function(){
  const m={name:'DocVault',short_name:'DocVault',start_url:location.pathname,
    display:'standalone',background_color:'#FFF9E3',theme_color:'#C2410C',
    icons:[{src:"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23C2410C' rx='20'/><text y='.9em' font-size='80' x='10'>🗒</text></svg>",sizes:'512x512',type:'image/svg+xml'}]};
  const link=document.createElement('link');
  link.rel='manifest';link.href=URL.createObjectURL(new Blob([JSON.stringify(m)],{type:'application/json'}));
  document.head.appendChild(link);
})();

/* Share modal close */
document.getElementById('share-mo').addEventListener('click',e=>{if(e.target===document.getElementById('share-mo'))closeShareMo();});

/* Run shared doc check */
checkSharedDoc();

function copyCode(id, btn){
  const code = document.getElementById(id).textContent;
  navigator.clipboard.writeText(code).then(() => {
    const orig = btn.innerHTML;
    btn.innerHTML = '✅ Copied!';
    btn.classList.add('ok');
    setTimeout(() => {
      btn.innerHTML = orig;
      btn.classList.remove('ok');
    }, 2000);
  }).catch(() => toast('복사 실패', 'err'));
}

/* ── INIT ── */
initSupabase();
