/**
 * Log Panel Component
 */
import { S } from '../state/store.js';
import { IDB } from '../services/db.js';

export const LogPanel = {
  async toggle(forceState) {
    if (typeof forceState === 'boolean') {
      S.logOpen = forceState;
    } else {
      S.logOpen = !S.logOpen;
    }
    
    const lgb = document.getElementById('lgb');
    const btn = document.getElementById('b-log');
    
    if (S.logOpen) {
      lgb?.classList.add('show');
      btn?.classList.add('act');
      await this.render();
    } else {
      lgb?.classList.remove('show');
      btn?.classList.remove('act');
    }
  },

  async render() {
    if (!S.activeDoc) return;
    const targetId = S.activeDoc.id;
    
    const docLogs = await IDB.getLogs(targetId);
    
    // Safety check: ensure active doc hasn't changed while retrieving logs
    if (!S.activeDoc || S.activeDoc.id !== targetId) return;
    
    docLogs.sort((a, b) => b.ts - a.ts);
    
    const cnt = document.getElementById('lg-cnt');
    if (cnt) cnt.textContent = docLogs.length;

    const list = document.getElementById('lg-l');
    if (!list) return;

    if (!docLogs.length) {
      list.innerHTML = `<div class="emp" style="padding:20px;text-align:center;color:var(--t3)">No edit history</div>`;
      return;
    }

    list.innerHTML = docLogs.map(l => `
      <div class="lg-it">
        <div class="lg-time">${new Date(l.ts).toLocaleString()}</div>
        <div class="lg-msg">${l.msg || 'Document edited'}</div>
        ${l.delta !== undefined ? `<div class="lg-delta ${l.delta > 0 ? 'pos' : 'neg'}">${l.delta > 0 ? '+' : ''}${l.delta} chars</div>` : ''}
      </div>
    `).join('');
  }
};
