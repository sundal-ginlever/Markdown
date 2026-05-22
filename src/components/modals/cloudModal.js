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
      this.loadKeys().then(() => {
        this.renderAuthSection();
      });
      UI.toggleModal('cloud-mo', true);
      setTimeout(() => {
        document.getElementById('cloud-url')?.focus();
      }, 100);
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

  renderAuthSection() {
    const section = document.getElementById('cloud-auth-section');
    if (!section) return;

    if (!SB.client) {
      section.innerHTML = '';
      return;
    }

    const isKo = localStorage.getItem('dv_lang') !== 'en';

    if (SB.user) {
      // User is signed in
      section.innerHTML = `
        <div class="cloud-auth-box">
          <div class="auth-title">${isKo ? '사용자 인증 상태' : 'User Authentication'}</div>
          <div class="auth-status-bar">
            <span>${isKo ? '로그인된 계정:' : 'Logged in as:'} <span class="auth-email">${SB.user.email}</span></span>
            <button class="bg" id="btn-sb-signout" style="padding: 4px 8px; font-size: 11px; cursor: pointer;">${isKo ? '로그아웃' : 'Sign Out'}</button>
          </div>
        </div>
      `;
      document.getElementById('btn-sb-signout').onclick = async () => {
        UI.showPb(isKo ? '로그아웃 중...' : 'Logging out...');
        try {
          await SB.signOut();
          UI.toast(isKo ? '로그아웃되었습니다.' : 'Logged out.', 'ok');
          this.renderAuthSection();
          if (window.updateSyncStatusUI) window.updateSyncStatusUI();
        } catch (e) {
          UI.toast('Signout error: ' + e.message, 'err');
        } finally {
          UI.hidePb();
        }
      };
    } else {
      // User is NOT signed in
      section.innerHTML = `
        <div class="cloud-auth-box">
          <div class="auth-title">${isKo ? '클라우드 로그인 / 회원가입' : 'Cloud Login / Sign Up'}</div>
          <div class="kf-wrap" style="margin-top:0; padding:0; border:none; display:flex; flex-direction:column; gap:8px;">
            <div class="fr" style="margin:0;"><label class="fl-lbl">EMAIL</label><input type="email" class="fi-inp" id="sb-email" placeholder="example@email.com"></div>
            <div class="fr" style="margin:0;"><label class="fl-lbl">PASSWORD</label><input type="password" class="fi-inp" id="sb-pass" placeholder="••••••••"></div>
          </div>
          <div style="display:flex; gap:8px; justify-content:flex-end; margin-top:4px;">
            <button class="bg" id="btn-sb-signup" style="padding:6px 12px; font-size:11px; cursor: pointer;">${isKo ? '회원가입' : 'Sign Up'}</button>
            <button class="bp" id="btn-sb-login" style="padding:6px 12px; font-size:11px; cursor: pointer;">${isKo ? '로그인' : 'Log In'}</button>
          </div>
        </div>
      `;

      document.getElementById('btn-sb-login').onclick = async () => {
        const email = document.getElementById('sb-email').value.trim();
        const pass = document.getElementById('sb-pass').value.trim();
        if (!email || !pass) {
          UI.toast(isKo ? '이메일과 비밀번호를 입력해주세요' : 'Please enter email and password', 'warn');
          return;
        }
        UI.showPb(isKo ? '로그인 중...' : 'Logging in...');
        try {
          const { error } = await SB.signIn(email, pass);
          if (error) throw error;
          UI.toast(isKo ? '성공적으로 로그인되었습니다.' : 'Successfully logged in.', 'ok');
          this.renderAuthSection();
          if (window.updateSyncStatusUI) window.updateSyncStatusUI();
        } catch (e) {
          UI.toast(isKo ? '로그인 실패: ' + e.message : 'Login failed: ' + e.message, 'err');
        } finally {
          UI.hidePb();
        }
      };

      document.getElementById('btn-sb-signup').onclick = async () => {
        const email = document.getElementById('sb-email').value.trim();
        const pass = document.getElementById('sb-pass').value.trim();
        if (!email || !pass) {
          UI.toast(isKo ? '이메일과 비밀번호를 입력해주세요' : 'Please enter email and password', 'warn');
          return;
        }
        UI.showPb(isKo ? '회원가입 중...' : 'Signing up...');
        try {
          const { error } = await SB.signUp(email, pass);
          if (error) throw error;
          UI.toast(isKo ? '가입 확인 메일이 발송되었습니다. 메일을 확인해주세요.' : 'Confirmation email sent. Please check your inbox.', 'ok');
        } catch (e) {
          UI.toast(isKo ? '회원가입 실패: ' + e.message : 'Sign up failed: ' + e.message, 'err');
        } finally {
          UI.hidePb();
        }
      };
    }
  },

  async save() {
    const url = document.getElementById('cloud-url')?.value.trim();
    const key = document.getElementById('cloud-key')?.value.trim();
    const isKo = localStorage.getItem('dv_lang') !== 'en';
    
    if (url && key) {
      const cfg = { url, key };
      try {
        const json = JSON.stringify(cfg);
        const encrypted = await encrypt(json);
        localStorage.setItem('dv_sb_cfg_enc', encrypted);
        await SB.init(cfg);
        this.renderAuthSection();
        if (window.updateSyncStatusUI) window.updateSyncStatusUI();
        UI.toast(isKo ? '클라우드 설정이 안전하게 저장되었습니다' : 'Cloud settings saved securely', 'ok');
      } catch (e) {
        UI.toast(isKo ? '설정 저장 중 오류: ' + e.message : 'Error saving settings: ' + e.message, 'err');
      }
    } else {
      localStorage.removeItem('dv_sb_cfg_enc');
      localStorage.removeItem('dv_sb_cfg');
      SB.config = null;
      SB.client = null;
      SB.user = null;
      SB.session = null;
      this.renderAuthSection();
      if (window.updateSyncStatusUI) window.updateSyncStatusUI();
      UI.toast(isKo ? '클라우드 설정이 초기화되었습니다' : 'Cloud settings reset', 'ok');
    }
    UI.toggleModal('cloud-mo', false);
  }
};
