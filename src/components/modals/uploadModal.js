/**
 * Upload and Convert Modal Component
 */
import { S, STYLES } from '../../state/store.js';
import { UI } from '../ui.js';

export const UploadModal = {
  init() {
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

    this.renderStyles();
  },

  renderStyles() {
    const grid = document.getElementById('style-grid');
    if (!grid) return;
    grid.innerHTML = STYLES.map(st => `
      <div class="sc ${st.cls} ${S.selectedStyle === st.id ? 'sel' : ''}" data-id="${st.id}">
        <span class="sc-ico">${st.icon}</span>
        <span class="sc-info">
          <span class="sc-name">${st.name}</span>
          <span class="sc-desc">${st.desc}</span>
        </span>
      </div>`).join('');

    grid.querySelectorAll('.sc').forEach(el => {
      el.addEventListener('click', () => {
        const id = el.dataset.id;
        S.selectedStyle = id;
        localStorage.setItem('dv_style', id);
        this.renderStyles();
      });
    });
  },

  handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    S.pendingFile = file;
    const info = document.getElementById('sel-f');
    if (info) info.textContent = `📄 ${file.name} (${(file.size/1024).toFixed(1)} KB)`;
    
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
    const btn = document.getElementById('b-proc');
    if (btn) btn.disabled = true;
  }
};
