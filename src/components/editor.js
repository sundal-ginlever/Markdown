/**
 * Document Editor Component
 */
import { S, SEARCH } from '../state/store.js';
import { IDB } from '../services/db.js';
import { UI } from './ui.js';
import { Viewer } from './viewer.js';
import { SB } from '../services/supabase.js';
import { Router } from '../utils/router.js';

export const Editor = {
  setMode(m) {
    S.mode = m;
    const isEdit = m === 'edit';
    document.getElementById('view-a').style.display = isEdit ? 'none' : 'block';
    document.getElementById('edit-a').style.display = isEdit ? 'block' : 'none';
    document.getElementById('b-view').classList.toggle('act', !isEdit);
    document.getElementById('b-edit').classList.toggle('act', isEdit);
    document.getElementById('b-save').style.display = isEdit ? 'block' : 'none';
    
    if (isEdit && S.activeDoc) {
      document.getElementById('mdt').value = S.activeDoc.content;
    }
  },

  async save() {
    if (!S.activeDoc) return;
    const docToSave = { ...S.activeDoc };
    const content = document.getElementById('mdt').value;
    const delta = content.length - (docToSave.content?.length || 0);
    docToSave.content = content;
    docToSave.updatedAt = new Date();
    
    // Immediately update reactive state for current doc
    S.activeDoc.content = content;
    S.activeDoc.updatedAt = docToSave.updatedAt;
    
    await IDB.put('docs', docToSave);
    const logEntry = { docId: docToSave.id, ts: Date.now(), msg: '문서 내용 직접 편집', delta };
    await IDB.put('logs', logEntry);
    await SB.saveLog(docToSave.id, logEntry);
    await SB.saveDoc(docToSave);
    
    // Only update UI if the active document is still the same one
    if (S.activeDoc && S.activeDoc.id === docToSave.id) {
      Viewer.render();
      if (S.logOpen) {
        import('./logPanel.js').then(({ LogPanel }) => LogPanel.render());
      }
      this.setMode('view');
    }
    
    UI.toast('저장되었습니다!', 'ok');
  },

  export() {
    if (!S.activeDoc) return;
    const blob = new Blob([S.activeDoc.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = S.activeDoc.name.endsWith('.md') ? S.activeDoc.name : S.activeDoc.name + '.md';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 300);
  },

  async exportAll() {
    if (!S.md.length) return;
    try {
      const { UI } = await import('./ui.js');
      UI.showPb(S.lang === 'ko' ? '문서 압축 중...' : 'Zipping documents...');
      const { default: JSZip } = await import('https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm');
      const zip = new JSZip();
      
      const usedPaths = new Set();
      
      S.md.forEach(doc => {
        let folderName = '';
        if (doc.folderId) {
          const folderObj = S.folders.find(f => f.id === doc.folderId);
          if (folderObj && folderObj.name) {
            folderName = folderObj.name.replace(/[\\/:*?"<>|]/g, '_').trim();
          }
        }

        let baseName = doc.name || 'document';
        if (!baseName.endsWith('.md')) {
          baseName += '.md';
        }
        baseName = baseName.replace(/[\\/:*?"<>|]/g, '_').trim();

        let relativePath = folderName ? `${folderName}/${baseName}` : baseName;
        let counter = 1;
        
        while (usedPaths.has(relativePath.toLowerCase())) {
          const extIdx = baseName.lastIndexOf('.md');
          const cleanName = baseName.substring(0, extIdx);
          const newBaseName = `${cleanName} (${counter}).md`;
          relativePath = folderName ? `${folderName}/${newBaseName}` : newBaseName;
          counter++;
        }
        
        usedPaths.add(relativePath.toLowerCase());
        zip.file(relativePath, doc.content || '');
      });
      
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      const dateStr = new Date().toISOString().split('T')[0];
      a.download = `DocVault_Export_${dateStr}.zip`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      
      UI.hidePb();
      UI.toast(S.lang === 'ko' ? '백업이 완료되었습니다!' : 'Export completed!', 'ok');
    } catch (e) {
      console.error('JSZip export failed:', e);
      import('./ui.js').then(({ UI }) => { UI.hidePb(); UI.toast('Export Error: ' + e.message, 'err'); });
    }
  },

  close() {
    S.activeDoc = null;
    S.mode = 'view';
    Router.navigate(null);
    document.getElementById('doc-tb').style.display = 'none';
    const mdv = document.getElementById('mdv');
    if (mdv) mdv.innerHTML = '';
    const wlc = document.getElementById('wlc-a');
    if (wlc) wlc.style.display = 'flex';
    document.getElementById('edit-a').style.display = 'none';
    document.getElementById('view-a').style.display = 'block';

    // Reset search highlights and hide its floating panel
    import('../services/search.js').then(({ SearchService }) => {
      SearchService.activeHls = [];
    });
    SEARCH.hlIdx = -1;
    SEARCH.hlCount = 0;
    const nav = document.getElementById('hl-nav');
    if (nav) nav.style.display = 'none';
  }
};
