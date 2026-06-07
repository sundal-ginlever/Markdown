/**
 * Upload and Convert Modal Component
 */
import { S, STYLES } from '../../state/store.js';
import { UI } from '../ui.js';

export const UploadModal = {
  abortController: null,

  _isInitialized: false,

  init() {
    if (this._isInitialized) return;
    this._isInitialized = true;

    const dz = document.getElementById('mo-dz');
    const fi = document.getElementById('fi');
    
    // Click to upload
    dz?.addEventListener('click', () => fi?.click());

    // Drag and Drop
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(evt => {
      const handler = (e) => {
        e.preventDefault();
        e.stopPropagation();
      };
      dz?.addEventListener(evt, handler);
      
      document.body.addEventListener(evt, (e) => {
        const hasFiles = e.dataTransfer && e.dataTransfer.types && Array.from(e.dataTransfer.types).includes('Files');
        // Allow default drag-and-drop text inputs inside standard inputs, textareas, or contenteditables
        if (e.target.closest('input, textarea, [contenteditable="true"]') && !hasFiles) {
          return;
        }

        if (evt === 'drop') {
          // If dropped on the main drag zone, trigger upload modal
          const isMainDz = e.target.closest('#main-dz');
          if (isMainDz) {
            e.preventDefault();
            e.stopPropagation();
            if (e.dataTransfer?.files?.length) {
              this.handleFileSelect({ target: { files: e.dataTransfer.files } });
              UI.toggleModal('up-mo', true);
            }
            return;
          }
        }
        
        // Prevent browser navigation and state loss by blocking default dragover and drop globally at all times
        if (evt === 'dragover' || evt === 'drop') {
          e.preventDefault();
          e.stopPropagation();
        }
      });
    });

    dz?.addEventListener('dragover', () => dz.classList.add('drag'));
    dz?.addEventListener('dragleave', () => dz.classList.remove('drag'));
    dz?.addEventListener('drop', (e) => {
      dz.classList.remove('drag');
      const files = e.dataTransfer.files;
      if (files.length) {
        this.handleFileSelect({ target: { files } });
      }
    });

    // Event Delegation: 모달/홈 화면 스타일 그리드 공통 리스너 바인딩
    const onStylePick = (e) => {
      const card = e.target.closest('.sc');
      if (!card) return;
      S.selectedStyle = card.dataset.id;
      localStorage.setItem('dv_style', card.dataset.id);
      this.renderStyles();
    };
    document.getElementById('style-grid')?.addEventListener('click', onStylePick);
    document.getElementById('wlc-style-grid')?.addEventListener('click', onStylePick);

    this.renderStyles();
  },

  renderStyles() {
    const html = STYLES.map(st => `
      <div class="sc ${st.cls} ${S.selectedStyle === st.id ? 'sel' : ''}" data-id="${st.id}">
        <span class="sc-ico">${st.icon}</span>
        <span class="sc-info">
          <span class="sc-name">${st.name}</span>
          <span class="sc-desc">${st.desc}</span>
        </span>
      </div>`).join('');
    ['style-grid', 'wlc-style-grid'].forEach(id => {
      const grid = document.getElementById(id);
      if (grid) grid.innerHTML = html;
    });
  },

  handleFileSelect(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    S.pendingFiles = files;
    S.pendingFile = files[0];
    const isKo = S.lang === 'ko';
    const label = files.length === 1
      ? `📄 ${files[0].name} (${(files[0].size / 1024).toFixed(1)} KB)`
      : (isKo ? `📄 ${files.length}개 파일 선택됨` : `📄 ${files.length} files selected`);

    const info = document.getElementById('sel-f');
    if (info) info.textContent = label;
    const btn = document.getElementById('b-proc');
    if (btn) {
      btn.disabled = false;
      btn.style.opacity = '1';
    }

    // Mirror the selection onto the home (welcome) converter
    const wlcInfo = document.getElementById('wlc-sel-f');
    if (wlcInfo) wlcInfo.textContent = label;
    const wlcAction = document.getElementById('wlc-action');
    if (wlcAction) wlcAction.style.display = 'flex';
  },

  close() {
    UI.toggleModal('up-mo', false);
    S.pendingFile = null;
    S.pendingFiles = null;
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    const info = document.getElementById('sel-f');
    if (info) info.textContent = '';
    const btn = document.getElementById('b-proc');
    if (btn) btn.disabled = true;
    const fi = document.getElementById('fi');
    if (fi) fi.value = '';

    // Reset the home converter indicator too
    const wlcInfo = document.getElementById('wlc-sel-f');
    if (wlcInfo) wlcInfo.textContent = '';
    const wlcAction = document.getElementById('wlc-action');
    if (wlcAction) wlcAction.style.display = 'none';
  }
};
