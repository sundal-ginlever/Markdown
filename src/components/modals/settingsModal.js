/**
 * Settings and API Key Modal Component
 */
import { S } from '../../state/store.js';
import { UI } from '../ui.js';
import { encrypt } from '../../utils/crypto.js';

export const SettingsModal = {
  tempAi: null,

  _isInitialized: false,

  init() {
    if (this._isInitialized) return;
    this._isInitialized = true;

    const tabs = document.querySelectorAll('.ptab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const p = tab.dataset.p;
        this.switchProvider(p);
      });
    });

    // Capture opening of the modal to instantiate the temporary config clone
    document.getElementById('key-btn')?.addEventListener('click', () => {
      this.open();
    });
  },

  open() {
    // Deep clone global settings to temporary local buffer
    this.tempAi = JSON.parse(JSON.stringify(S.ai));
    this.switchProvider(this.tempAi.provider || 'claude');
  },

  switchProvider(p) {
    if (!this.tempAi) {
      this.tempAi = JSON.parse(JSON.stringify(S.ai));
    }
    this.saveCurrentTabInputs();
    this.tempAi.provider = p;
    
    // Update Tabs UI
    document.querySelectorAll('.ptab').forEach(t => {
      t.classList.toggle('act', t.dataset.p === p);
    });

    // Update Forms UI
    this.renderForm(p);

    // Autofocus the first input in the new form
    const container = document.getElementById('kf-claude');
    const firstInput = container?.querySelector('input, select');
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 50);
    }
  },

  saveCurrentTabInputs() {
    if (!this.tempAi) return;
    const p = this.tempAi.provider;
    if (p === 'claude') {
      const k = document.getElementById('k-claude')?.value;
      if (k !== undefined) this.tempAi.keys.claude = k;
      const m = document.getElementById('m-claude')?.value;
      if (m !== undefined) this.tempAi.models.claude = m;
    } else if (p === 'gpt4') {
      const k = document.getElementById('k-gpt4')?.value;
      if (k !== undefined) this.tempAi.keys.gpt4 = k;
      const m = document.getElementById('m-gpt4')?.value;
      if (m !== undefined) this.tempAi.models.gpt4 = m;
    } else if (p === 'gemini') {
      const k = document.getElementById('k-gemini')?.value;
      if (k !== undefined) this.tempAi.keys.gemini = k;
      const m = document.getElementById('m-gemini')?.value;
      if (m !== undefined) this.tempAi.models.gemini = m;
    } else if (p === 'local') {
      const u = document.getElementById('k-local-url')?.value;
      if (u !== undefined) this.tempAi.localUrl = u;
      const k = document.getElementById('k-local')?.value;
      if (k !== undefined) this.tempAi.keys.local = k;
      const m = document.getElementById('m-local')?.value;
      if (m !== undefined) this.tempAi.models.local = m;
    }
  },

  renderForm(p) {
    const container = document.getElementById('kf-claude'); // We use this as the base container
    if (!container || !this.tempAi) return;

    // Clear and re-render based on provider
    let html = '';
    if (p === 'claude') {
      html = `
        <div class="fr"><label class="fl-lbl">ANTHROPIC API KEY</label><input type="password" class="fi-inp" id="k-claude" value="${this.tempAi.keys.claude || ''}"></div>
        <div class="fr"><label class="fl-lbl">MODEL</label><select class="fi-inp" id="m-claude">
          <option value="claude-haiku-4-5" ${this.tempAi.models.claude === 'claude-haiku-4-5' ? 'selected' : ''}>Claude Haiku 4.5 — 빠르고 저렴 (권장)</option>
          <option value="claude-sonnet-4-6" ${this.tempAi.models.claude === 'claude-sonnet-4-6' ? 'selected' : ''}>Claude Sonnet 4.6 — 균형</option>
          <option value="claude-opus-4-8" ${this.tempAi.models.claude === 'claude-opus-4-8' ? 'selected' : ''}>Claude Opus 4.8 — 최고 성능 (비쌈)</option>
        </select></div>
      `;
    } else if (p === 'gpt4') {
      html = `
        <div class="fr"><label class="fl-lbl">OPENAI API KEY</label><input type="password" class="fi-inp" id="k-gpt4" value="${this.tempAi.keys.gpt4 || ''}"></div>
        <div class="fr"><label class="fl-lbl">MODEL (SELECT OR TYPE)</label>
          <input type="text" class="fi-inp" id="m-gpt4" list="gpt-models" value="${this.tempAi.models.gpt4 || 'gpt-5.4-mini'}" placeholder="e.g. gpt-5.4-mini">
          <datalist id="gpt-models">
            <option value="gpt-5.4-mini">GPT-5.4 mini — 빠르고 저렴 (권장)</option>
            <option value="gpt-5.4-nano">GPT-5.4 nano — 초저가</option>
            <option value="gpt-5.5">GPT-5.5 — 최고 성능</option>
          </datalist>
        </div>
      `;
    } else if (p === 'gemini') {
      html = `
        <div class="fr"><label class="fl-lbl">GOOGLE AI API KEY (GEMINI)</label><input type="password" class="fi-inp" id="k-gemini" value="${this.tempAi.keys.gemini || ''}"></div>
        <div class="fr"><label class="fl-lbl">MODEL (SELECT OR TYPE)</label>
          <input type="text" class="fi-inp" id="m-gemini" list="gemini-models" value="${this.tempAi.models.gemini || 'gemini-3.5-flash'}" placeholder="e.g. gemini-3.5-flash">
          <datalist id="gemini-models">
            <option value="gemini-3.5-flash">Gemini 3.5 Flash — 권장</option>
            <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash-Lite — 초저가</option>
            <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
          </datalist>
        </div>
      `;
    } else if (p === 'local') {
      html = `
        <div class="fr"><label class="fl-lbl">CUSTOM API ENDPOINT URL</label><input type="text" class="fi-inp" id="k-local-url" placeholder="https://api.openai.com/v1/chat/completions" value="${this.tempAi.localUrl || ''}"></div>
        <div class="fr"><label class="fl-lbl">API KEY (OPTIONAL)</label><input type="password" class="fi-inp" id="k-local" value="${this.tempAi.keys.local || ''}"></div>
        <div class="fr"><label class="fl-lbl">MODEL NAME</label><input type="text" class="fi-inp" id="m-local" value="${this.tempAi.models.local || ''}"></div>
      `;
    }
    
    container.innerHTML = html;
  },

  loadKeys() {
    // Keys are loaded into inputs during renderForm
  },

  async save() {
    this.saveCurrentTabInputs();
    
    // Commit the temporary state back to the reactive global store S.ai
    if (this.tempAi) {
      Object.assign(S.ai.keys, this.tempAi.keys);
      Object.assign(S.ai.models, this.tempAi.models);
      S.ai.provider = this.tempAi.provider;
      S.ai.localUrl = this.tempAi.localUrl;
    }

    // Keep the titlebar engine selector and Q&A badge in sync with the saved provider
    const sel = document.getElementById('ai-sel');
    if (sel) sel.value = S.ai.provider;
    const badge = document.getElementById('qa-model-badge');
    if (badge) badge.textContent = ({ claude: 'Claude', gpt4: 'GPT', gemini: 'Gemini', local: 'Custom' })[S.ai.provider] || S.ai.provider;
    
    // Encrypt with AES-GCM via Web Crypto API before storing
    try {
      const json = JSON.stringify(S.ai);
      const encrypted = await encrypt(json);
      localStorage.setItem('dv_ai', encrypted);
    } catch (e) {
      console.error('Encryption failed, falling back:', e);
      localStorage.setItem('dv_ai', btoa(unescape(encodeURIComponent(JSON.stringify(S.ai)))));
    }
    
    UI.toast('설정이 저장되었습니다!', 'ok');
    UI.toggleModal('key-mo', false);
    this.tempAi = null;
  },

  close() {
    this.tempAi = null;
    UI.toggleModal('key-mo', false);
  }
};
