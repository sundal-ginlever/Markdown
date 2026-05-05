/**
 * Settings and API Key Modal Component
 */
import { S } from '../../state/store.js';
import { UI } from '../ui.js';
import { encrypt } from '../../utils/crypto.js';

export const SettingsModal = {
  init() {
    const tabs = document.querySelectorAll('.ptab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const p = tab.dataset.p;
        this.switchProvider(p);
      });
    });

    // Initial Load
    this.switchProvider(S.ai.provider || 'claude');
    this.loadKeys();
  },

  switchProvider(p) {
    S.ai.provider = p;
    
    // Update Tabs UI
    document.querySelectorAll('.ptab').forEach(t => {
      t.classList.toggle('act', t.dataset.p === p);
    });

    // Update Forms UI
    this.renderForm(p);
  },

  renderForm(p) {
    const container = document.getElementById('kf-claude'); // We use this as the base container
    if (!container) return;

    // Clear and re-render based on provider
    let html = '';
    if (p === 'claude') {
      html = `
        <div class="fr"><label class="fl-lbl">ANTHROPIC API KEY</label><input type="password" class="fi-inp" id="k-claude" value="${S.ai.keys.claude || ''}"></div>
        <div class="fr"><label class="fl-lbl">MODEL</label><select class="fi-inp" id="m-claude">
          <option value="claude-3-5-sonnet-20240620" ${S.ai.models.claude === 'claude-3-5-sonnet-20240620' ? 'selected' : ''}>Claude 3.5 Sonnet</option>
          <option value="claude-3-opus-20240229" ${S.ai.models.claude === 'claude-3-opus-20240229' ? 'selected' : ''}>Claude 3 Opus</option>
        </select></div>
      `;
    } else if (p === 'gpt4') {
      html = `
        <div class="fr"><label class="fl-lbl">OPENAI API KEY</label><input type="password" class="fi-inp" id="k-gpt4" value="${S.ai.keys.gpt4 || ''}"></div>
        <div class="fr"><label class="fl-lbl">MODEL</label><select class="fi-inp" id="m-gpt4">
          <option value="gpt-4o" ${S.ai.models.gpt4 === 'gpt-4o' ? 'selected' : ''}>GPT-4o</option>
          <option value="gpt-4-turbo" ${S.ai.models.gpt4 === 'gpt-4-turbo' ? 'selected' : ''}>GPT-4 Turbo</option>
          <option value="gpt-3.5-turbo" ${S.ai.models.gpt4 === 'gpt-3.5-turbo' ? 'selected' : ''}>GPT-3.5 Turbo</option>
        </select></div>
      `;
    } else if (p === 'gemini') {
      html = `
        <div class="fr"><label class="fl-lbl">GOOGLE AI API KEY (GEMINI)</label><input type="password" class="fi-inp" id="k-gemini" value="${S.ai.keys.gemini || ''}"></div>
        <div class="fr"><label class="fl-lbl">MODEL</label><select class="fi-inp" id="m-gemini">
          <option value="gemini-1.5-pro" ${S.ai.models.gemini === 'gemini-1.5-pro' ? 'selected' : ''}>Gemini 1.5 Pro</option>
          <option value="gemini-1.5-flash" ${S.ai.models.gemini === 'gemini-1.5-flash' ? 'selected' : ''}>Gemini 1.5 Flash</option>
          <option value="gemini-1.0-pro" ${S.ai.models.gemini === 'gemini-1.0-pro' ? 'selected' : ''}>Gemini 1.0 Pro</option>
        </select></div>
      `;
    } else if (p === 'local') {
      html = `
        <div class="fr"><label class="fl-lbl">CUSTOM API ENDPOINT URL</label><input type="text" class="fi-inp" id="k-local-url" placeholder="https://api.openai.com/v1/chat/completions" value="${S.ai.localUrl || ''}"></div>
        <div class="fr"><label class="fl-lbl">API KEY (OPTIONAL)</label><input type="password" class="fi-inp" id="k-local" value="${S.ai.keys.local || ''}"></div>
        <div class="fr"><label class="fl-lbl">MODEL NAME</label><input type="text" class="fi-inp" id="m-local" value="${S.ai.models.local || ''}"></div>
      `;
    }
    
    container.innerHTML = html;
  },

  loadKeys() {
    // Keys are loaded into inputs during renderForm
  },

  async save() {
    const p = S.ai.provider;
    
    if (p === 'claude') {
      S.ai.keys.claude = document.getElementById('k-claude')?.value || '';
      S.ai.models.claude = document.getElementById('m-claude')?.value;
    } else if (p === 'gpt4') {
      S.ai.keys.gpt4 = document.getElementById('k-gpt4')?.value || '';
      S.ai.models.gpt4 = document.getElementById('m-gpt4')?.value;
    } else if (p === 'gemini') {
      S.ai.keys.gemini = document.getElementById('k-gemini')?.value || '';
      S.ai.models.gemini = document.getElementById('m-gemini')?.value;
    } else if (p === 'local') {
      S.ai.localUrl = document.getElementById('k-local-url')?.value || '';
      S.ai.keys.local = document.getElementById('k-local')?.value || '';
      S.ai.models.local = document.getElementById('m-local')?.value || '';
    }
    
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
  }
};
