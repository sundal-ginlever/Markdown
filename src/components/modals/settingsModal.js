/**
 * Settings and API Key Modal Component
 */
import { S } from '../../state/store.js';
import { UI } from '../ui.js';
import { encrypt } from '../../utils/crypto.js';

export const SettingsModal = {
  async save() {
    const claudeKey = document.getElementById('k-claude')?.value;
    if (claudeKey) S.ai.keys.claude = claudeKey;
    
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
