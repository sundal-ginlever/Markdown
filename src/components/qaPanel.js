/**
 * AI Q&A Panel Component
 */
import { S, QA } from '../state/store.js';
import { renderQAMarkdown } from '../utils/markdown.js';
import { callQAApi } from '../services/ai.js';
import { UI } from './ui.js';

export const QAPanel = {
  abortController: null,

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

    if (this.abortController) this.abortController.abort();
    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    const targetDocId = S.activeDoc.id;
    const historyArr = [...(QA.history[targetDocId] || [])];

    this.addMessageForDoc(targetDocId, 'user', q);
    inp.value = '';
    inp.style.height = 'auto';
    QA.loading = true;
    this.renderTyping(true);

    try {
      const targetDoc = S.md.find(d => d.id === targetDocId);
      const finalDoc = targetDoc || S.activeDoc;
      const ans = await callQAApi(q, finalDoc, historyArr, signal);
      
      // 유실 가드 (Survival Guard): AI 답변 완료 시점에 해당 문서가 스토어에 여전히 존재해야만 메시지 추가
      if (S.md.some(d => d.id === targetDocId)) {
        this.addMessageForDoc(targetDocId, 'ai', ans);
      } else {
        console.warn(`Doc ${targetDocId} was deleted during QA API call. Discarding response to prevent storage leak.`);
      }
    } catch (e) {
      if (e.name !== 'AbortError' && e.message !== 'Cancelled') {
        UI.toast('QA Error: ' + e.message, 'err');
      }
    } finally {
      QA.loading = false;
      this.renderTyping(false);
      this.abortController = null;
    }
  },

  addMessage(role, content) {
    this.addMessageForDoc(S.activeDoc?.id, role, content);
  },

  addMessageForDoc(docId, role, content) {
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
    if (S.activeDoc?.id === docId) {
      this.render();
    }
  },

  clearHistory() {
    const docId = S.activeDoc?.id;
    if (!docId) return;
    
    const isKo = S.lang === 'ko';
    const msg = isKo ? '이 문서의 모든 질문 답변 대화 기록을 삭제하시겠습니까?' : 'Clear all Q&A conversation history for this document?';
    
    if (confirm(msg)) {
      if (QA.history[docId]) {
        delete QA.history[docId];
        QA.history = { ...QA.history };
        localStorage.setItem('dv_qa_hist', JSON.stringify(QA.history));
      }
      this.render();
      UI.toast(isKo ? '대화 기록이 삭제되었습니다.' : 'Conversation history cleared.', 'ok');
    }
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
