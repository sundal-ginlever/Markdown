/**
 * AI Q&A Panel Component
 */
import { S, QA } from '../state/store.js';
import { renderQAMarkdown } from '../utils/markdown.js';
import { callQAApi } from '../services/ai.js';
import { UI } from './ui.js';

export const QAPanel = {
  toggle() {
    const el = document.getElementById('qa-panel');
    const btn = document.getElementById('b-qa');
    if (!el || !btn) return;
    const isOpen = el.classList.toggle('open');
    btn.classList.toggle('qa-active', isOpen);
    if (isOpen) document.getElementById('qa-input')?.focus();
  },

  async ask() {
    const inp = document.getElementById('qa-input');
    const q = inp?.value.trim();
    if (!q || QA.loading || !S.activeDoc) return;

    this.addMessage('user', q);
    inp.value = '';
    QA.loading = true;
    this.renderTyping(true);

    try {
      const docId = S.activeDoc.id;
      const historyArr = QA.history[docId] || [];
      const ans = await callQAApi(q, S.activeDoc, historyArr);
      this.addMessage('ai', ans);
    } catch (e) {
      UI.toast('QA Error: ' + e.message, 'err');
    } finally {
      QA.loading = false;
      this.renderTyping(false);
    }
  },

  addMessage(role, content) {
    const docId = S.activeDoc?.id;
    if (!docId) return;
    const currentHist = QA.history[docId] || [];
    QA.history = { ...QA.history, [docId]: [...currentHist, { role, content, ts: Date.now() }] };
    try {
      localStorage.setItem('dv_qa_hist', JSON.stringify(QA.history));
    } catch (err) {
      console.warn('Quota exceeded on localStorage for QA history, pruning...', err);
      for (const id of Object.keys(QA.history)) {
        if (QA.history[id].length > 10) {
          QA.history[id] = QA.history[id].slice(-10);
        }
      }
      try {
        localStorage.setItem('dv_qa_hist', JSON.stringify(QA.history));
      } catch (err2) {
        console.error('Failed to set localStorage even after pruning', err2);
      }
    }
    this.render();
  },

  render() {
    const el = document.getElementById('qa-messages');
    const docId = S.activeDoc?.id;
    if (!el || !docId) return;

    const hist = QA.history[docId] || [];
    if (!hist.length) {
      el.innerHTML = `<div class="qa-empty"><div class="qei">🤖</div><span>이 문서에 대해 질문하세요</span></div>`;
      return;
    }

    el.innerHTML = hist.map(m => `
      <div class="qa-msg ${m.role}">
        <div class="qa-avatar ${m.role}">${m.role === 'ai' ? 'AI' : 'U'}</div>
        <div class="qa-bubble">${renderQAMarkdown(m.content)}</div>
      </div>
    `).join('');
    el.scrollTop = el.scrollHeight;
  },

  renderTyping(show) {
    const el = document.getElementById('qa-messages');
    if (!el) return;
    const existing = document.getElementById('qa-typing');
    if (show && !existing) {
      const t = document.createElement('div');
      t.id = 'qa-typing';
      t.className = 'qa-typing';
      t.innerHTML = '<div class="qa-dot"></div><div class="qa-dot"></div><div class="qa-dot"></div>';
      el.appendChild(t);
      el.scrollTop = el.scrollHeight;
    } else if (!show && existing) {
      existing.remove();
    }
  }
};
