/**
 * Document Viewer Component
 */
import { S } from '../state/store.js';
import { parseMd } from '../utils/markdown.js';
import { SEARCH } from '../state/store.js';
import { SearchService } from '../services/search.js';

export const Viewer = {
  render() {
    const el = document.getElementById('mdv');
    if (!el || !S.activeDoc) return;
    el.innerHTML = parseMd(S.activeDoc.content);
    
    // Apply search highlights if query exists
    if (SEARCH.query) {
      SearchService.applyHighlights(el, SEARCH.query);
    }
    
    // Update toolbar
    document.getElementById('dp-name').textContent = S.activeDoc.name;
    document.getElementById('doc-tb').style.display = 'flex';
    document.getElementById('wlc-a').style.display = 'none';
    document.getElementById('view-a').style.display = 'block';
    
    this.renderFavBtn();

    const badge = document.getElementById('doc-style-badge');
    if (badge && S.activeDoc) {
      import('../state/store.js').then(({ STYLES }) => {
        const st = STYLES.find(s => s.id === S.activeDoc.styleId) || STYLES[0];
        badge.innerHTML = `<span class="style-tag ${st.cls}" style="color:${st.color};border:1px solid ${st.color};padding:2px 6px;border-radius:4px;font-size:10px;cursor:pointer">${st.icon} ${st.name} (재변환)</span>`;
        badge.style.display = 'flex';
        badge.onclick = () => this.openReconvModal();
      });
    }
  },

  renderFavBtn() {
    if (!S.activeDoc) return;
    const btn = document.getElementById('btn-fav-doc');
    if (!btn) return;
    const isFav = S.favorites.includes(S.activeDoc.id);
    btn.textContent = isFav ? '★' : '☆';
    btn.style.color = isFav ? 'gold' : 'var(--t3)';
  },

  openReconvModal() {
    if (!S.activeDoc) return;
    import('../state/store.js').then(({ STYLES }) => {
      const grid = document.getElementById('reconv-style-grid');
      if (grid) {
        grid.innerHTML = STYLES.map(s => `
          <div class="style-card ${S.activeDoc.styleId === s.id ? 'act' : ''}" data-id="${s.id}">
            <div class="sc-ico">${s.icon}</div>
            <div class="sc-tit">${s.name}</div>
          </div>
        `).join('');
        
        grid.querySelectorAll('.style-card').forEach(c => {
          c.onclick = () => {
            grid.querySelectorAll('.style-card').forEach(x => x.classList.remove('act'));
            c.classList.add('act');
          };
        });
      }
      
      const uiProm = import('./ui.js').then(({ UI }) => UI);
      
      document.getElementById('btn-reconv-cancel').onclick = () => uiProm.then(UI => UI.toggleModal('reconv-mo', false));
      document.getElementById('btn-reconv-start').onclick = () => this.startReconv();
      
      uiProm.then(UI => UI.toggleModal('reconv-mo', true));
    });
  },

  async startReconv() {
    const actCard = document.querySelector('#reconv-style-grid .style-card.act');
    if (!actCard || !S.activeDoc) return;
    const styleId = actCard.dataset.id;
    
    const [{ UI }, { IDB }, { STYLES }, { aiConvert }, { Sidebar }, { SB }] = await Promise.all([
      import('./ui.js'),
      import('../services/db.js'),
      import('../state/store.js'),
      import('../services/ai.js'),
      import('./sidebar.js'),
      import('../services/supabase.js')
    ]);

    UI.toggleModal('reconv-mo', false);
    UI.showPb('원본 데이터 불러오는 중...');
    
    try {
      const rawRes = await IDB.get('raw', S.activeDoc.rawId);
      if (!rawRes || !rawRes.data) throw new Error('원본 데이터(Raw)를 찾을 수 없습니다.');
      
      UI.showPb('AI 재변환 중...');
      const styleDef = STYLES.find(s => s.id === styleId) || STYLES[0];
      const mdc = await aiConvert(rawRes.name, { type: rawRes.type, cnt: 0, text: '' }, rawRes.data, styleDef);
      
      const delta = mdc.length - S.activeDoc.content.length;
      S.activeDoc.content = mdc;
      S.activeDoc.styleId = styleId;
      S.activeDoc.updatedAt = new Date();
      
      await IDB.put('docs', S.activeDoc);
      await IDB.put('logs', { docId: S.activeDoc.id, ts: Date.now(), msg: `스타일 재변환 (${styleDef.name})`, delta });
      await SB.saveDoc(S.activeDoc);
      
      this.render();
      Sidebar.render();
      UI.toast('성공적으로 재변환되었습니다.', 'ok');
    } catch (e) {
      console.error(e);
      UI.toast('재변환 오류: ' + e.message, 'err');
    } finally {
      UI.hidePb();
    }
  }
};
