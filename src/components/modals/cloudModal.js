/**
 * Cloud Setup Modal Component
 */
import { SB } from '../../services/supabase.js';
import { UI } from '../ui.js';
import { encrypt, decrypt } from '../../utils/crypto.js';

export const CloudModal = {
  init() {
    this.loadKeys();
    document.getElementById('cloud-setup-btn')?.addEventListener('click', () => {
      this.loadKeys();
      UI.toggleModal('cloud-mo', true);
    });
    document.getElementById('btn-cloud-cancel')?.addEventListener('click', () => UI.toggleModal('cloud-mo', false));
    document.getElementById('btn-cloud-save')?.addEventListener('click', () => this.save());
  },

  async loadKeys() {
    const encCfg = localStorage.getItem('dv_sb_cfg_enc');
    if (encCfg) {
      try {
        const json = await decrypt(encCfg);
        const data = JSON.parse(json);
        document.getElementById('cloud-url').value = data.url || '';
        document.getElementById('cloud-key').value = data.key || '';
      } catch (e) {
        console.error('Failed to decrypt cloud config:', e);
      }
    } else if (SB.config) {
      document.getElementById('cloud-url').value = SB.config.url || '';
      document.getElementById('cloud-key').value = SB.config.key || '';
    }
  },

  async save() {
    const url = document.getElementById('cloud-url')?.value.trim();
    const key = document.getElementById('cloud-key')?.value.trim();
    
    if (url && key) {
      const cfg = { url, key };
      try {
        const json = JSON.stringify(cfg);
        const encrypted = await encrypt(json);
        localStorage.setItem('dv_sb_cfg_enc', encrypted);
        SB.init(cfg);
        UI.toast('클라우드 설정이 안전하게 저장되었습니다', 'ok');
      } catch (e) {
        UI.toast('설정 저장 중 오류: ' + e.message, 'err');
      }
    } else {
      localStorage.removeItem('dv_sb_cfg_enc');
      localStorage.removeItem('dv_sb_cfg');
      SB.config = null;
      UI.toast('클라우드 설정이 초기화되었습니다', 'ok');
    }
    UI.toggleModal('cloud-mo', false);
  }
};
