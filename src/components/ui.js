/**
 * Common UI Components (Toast, Progress Bar)
 */

export const UI = {
  initGlobal() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        // 1. Close Command Palette if active
        const cmdPal = document.getElementById('cmd-pal');
        if (cmdPal && cmdPal.classList.contains('show')) {
          cmdPal.classList.remove('show');
          return;
        }

        // 2. Toggle Log Panel if active
        const lgb = document.getElementById('lgb');
        if (lgb && lgb.classList.contains('show')) {
          import('../state/store.js').then(({ S }) => {
            if (S.logOpen) {
              import('./logPanel.js').then(({ LogPanel }) => LogPanel.toggle());
            }
          });
          return;
        }

        // 3. Close Q&A Panel if active
        const qaPanel = document.getElementById('qa-panel');
        if (qaPanel && qaPanel.classList.contains('open')) {
          import('./qaPanel.js').then(({ QAPanel }) => QAPanel.toggle());
          return;
        }

        // 4. Dismiss other open modals safely
        const otherModals = Array.from(document.querySelectorAll('.ov.show')).filter(el => el.id !== 'cmd-pal');
        if (otherModals.length > 0) {
          otherModals.forEach(el => {
            if (el.id === 'up-mo') {
              import('./modals/uploadModal.js').then(({ UploadModal }) => UploadModal.close());
            } else if (el.id === 'key-mo') {
              import('./modals/settingsModal.js').then(({ SettingsModal }) => SettingsModal.close());
            } else {
              el.classList.remove('show');
            }
          });
          return;
        }
      }

      if (e.key === 'Tab') {
        const activeModal = document.querySelector('.ov.show');
        if (activeModal) {
          const focusables = Array.from(activeModal.querySelectorAll('input, select, textarea, button, [tabindex="0"]'))
            .filter(el => !el.disabled && el.style.display !== 'none' && el.style.visibility !== 'hidden');
          if (focusables.length > 0) {
            const first = focusables[0];
            const last = focusables[focusables.length - 1];
            if (e.shiftKey) {
              if (document.activeElement === first) {
                last.focus();
                e.preventDefault();
              }
            } else {
              if (document.activeElement === last) {
                first.focus();
                e.preventDefault();
              }
            }
          }
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
