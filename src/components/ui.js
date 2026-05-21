/**
 * Common UI Components (Toast, Progress Bar)
 */

export const UI = {
  initGlobal() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.ov.show').forEach(el => el.classList.remove('show'));
        const lgb = document.getElementById('lgb');
        if (lgb && lgb.classList.contains('show')) {
          import('../state/store.js').then(({ S }) => {
            if (S.logOpen) import('./logPanel.js').then(({ LogPanel }) => LogPanel.toggle());
          });
        }
      }
    });
  },

  toast(m, t = '') {
    const c = document.getElementById('toasts');
    if (!c) return;
    const el = document.createElement('div');
    el.className = `tst ${t}`;
    el.textContent = m;
    c.appendChild(el);
    setTimeout(() => {
      el.style.transition = 'opacity .3s';
      el.style.opacity = '0';
      setTimeout(() => el.remove(), 300);
    }, 2800);
  },

  showPb(m) {
    const txt = document.getElementById('pb-txt');
    const pb = document.getElementById('pb');
    if (txt) txt.textContent = m;
    if (pb) pb.classList.add('show');
  },

  hidePb() {
    const pb = document.getElementById('pb');
    if (pb) pb.classList.remove('show');
  },

  toggleModal(id, show) {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('show', show);
  }
};
