/**
 * Upload and Convert Modal Component
 */
import { S, STYLES } from '../../state/store.js';
import { UI } from '../ui.js';

export const UploadModal = {
  renderStyles() {
    const grid = document.getElementById('style-grid');
    if (!grid) return;
    grid.innerHTML = STYLES.map(st => `
      <label class="sc ${st.cls} ${S.selectedStyle === st.id ? 'sel' : ''}">
        <input type="radio" name="style" value="${st.id}" ${S.selectedStyle === st.id ? 'checked' : ''} onchange="window.selectStyle('${st.id}')">
        <span class="sc-ico">${st.icon}</span>
        <span class="sc-info">
          <span class="sc-name">${st.name}</span>
          <span class="sc-desc">${st.desc}</span>
        </span>
      </label>`).join('');
  },

  handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    S.pendingFile = file;
    const info = document.getElementById('sel-f');
    if (info) info.textContent = file.name;
    const btn = document.getElementById('b-proc');
    if (btn) {
      btn.disabled = false;
      btn.style.opacity = '1';
    }
  },

  close() {
    UI.toggleModal('up-mo', false);
    S.pendingFile = null;
    const info = document.getElementById('sel-f');
    if (info) info.textContent = '';
  }
};
