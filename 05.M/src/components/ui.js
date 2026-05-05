/**
 * Common UI Components (Toast, Progress Bar)
 */

export const UI = {
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
