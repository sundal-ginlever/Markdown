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
    S.activeDoc.content = content;
    await IDB.saveDoc(S.activeDoc);
    await SB.saveDoc(S.activeDoc);
    Viewer.render();
    this.setMode('view');
    UI.toast('저장되었습니다!', 'ok');
  }
};
