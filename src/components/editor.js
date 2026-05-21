/**
 * Document Editor Component
 */
import { S } from '../state/store.js';
import { IDB } from '../services/db.js';
import { UI } from './ui.js';
import { Viewer } from './viewer.js';
import { SB } from '../services/supabase.js';

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
    const content = document.getElementById('mdt').value;
    const delta = content.length - (S.activeDoc.content?.length || 0);
    S.activeDoc.content = content;
    
    await IDB.put('docs', S.activeDoc);
    await IDB.put('logs', { docId: S.activeDoc.id, ts: Date.now(), msg: '문서 내용 직접 편집', delta });
    await SB.saveDoc(S.activeDoc);
    
    Viewer.render();
    if (S.logOpen) {
      import('./logPanel.js').then(({ LogPanel }) => LogPanel.render());
    }
    
    this.setMode('view');
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
    document.getElementById('doc-tb').style.display = 'none';
    const mdv = document.getElementById('mdv');
    if (mdv) mdv.innerHTML = '';
    const wlc = document.getElementById('wlc-a');
    if (wlc) wlc.style.display = 'flex';
    document.getElementById('edit-a').style.display = 'none';
  }
};
