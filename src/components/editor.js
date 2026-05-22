/**
 * Document Editor Component
 */
import { S } from '../state/store.js';
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
    await IDB.put('logs', { docId: docToSave.id, ts: Date.now(), msg: '문서 내용 직접 편집', delta });
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
    a.download = S.activeDoc.name;
    a.click();
    URL.revokeObjectURL(url);
  },

  exportAll() {
    if (!S.md.length) return;
    S.md.forEach((doc, idx) => {
      setTimeout(() => {
        const blob = new Blob([doc.content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.name;
        a.click();
        URL.revokeObjectURL(url);
      }, idx * 300); // Prevent browser from blocking multiple sync downloads
    });
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
  }
};
