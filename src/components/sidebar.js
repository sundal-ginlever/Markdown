/**
 * Sidebar and File List Component
 */
import { S, SEARCH } from '../state/store.js';
import { t } from '../utils/i18n.js';
import { IDB } from '../services/db.js';
import { Viewer } from './viewer.js';
import { QAPanel } from './qaPanel.js';
import { SearchService } from '../services/search.js';
import { SB } from '../services/supabase.js';
import { Router } from '../utils/router.js';
import { UI } from './ui.js';

export const Sidebar = {
  render() {
    this.renderMD();
    this.renderRaw();
  },

  lastRenderKey: null,

  renderMD() {
    const el = document.getElementById('md-l');
    if (!el) return;

    const currentRenderKey = JSON.stringify({
      mdCount: S.md.length,
      favorites: S.favorites,
      sort: S.sort,
      filter: SEARCH.filter,
      query: SEARCH.query,
      activeId: S.activeDoc?.id,
      folders: S.folders,
      secOpen: S.secOpen,
      lang: S.lang,
      docHash: S.md.map(d => {
        const time = d.updatedAt instanceof Date 
          ? d.updatedAt.getTime() 
          : (Date.parse(d.updatedAt) || 0);
        return `${d.id}:${d.name}:${d.folderId}:${time}`;
      }).join('|')
    });

    if (this.lastRenderKey === currentRenderKey) {
      return;
    }
    this.lastRenderKey = currentRenderKey;
    
    let filtered = S.md;
    if (SEARCH.filter !== 'all') {
      if (SEARCH.filter === 'fav') {
        filtered = filtered.filter(d => S.favorites.includes(d.id));
      } else {
        filtered = filtered.filter(d => d.styleId === SEARCH.filter);
      }
    }
    
    // Apply sorting
    if (S.sort === 'fav') {
      filtered.sort((a, b) => {
        const aFav = S.favorites.includes(a.id) ? 1 : 0;
        const bFav = S.favorites.includes(b.id) ? 1 : 0;
        if (aFav !== bFav) return bFav - aFav;
        return b.createdAt - a.createdAt;
      });
    } else if (S.sort === 'old') {
      filtered.sort((a, b) => a.createdAt - b.createdAt);
    } else if (S.sort === 'new') {
      filtered.sort((a, b) => b.createdAt - a.createdAt);
    } else if (S.sort === 'az') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    const statsEl = document.getElementById('search-stats');
    if (SEARCH.query) {
      filtered = SearchService.search(SEARCH.query, filtered);
      if (statsEl) {
        const isKo = S.lang === 'ko';
        statsEl.textContent = isKo ? `${filtered.length}개의 문서가 검색되었습니다` : `${filtered.length} documents found`;
        statsEl.style.display = 'block';
      }
    } else {
      if (statsEl) {
        statsEl.textContent = '';
        statsEl.style.display = 'none';
      }
    }

    if (!filtered.length) {
      el.innerHTML = `<div class="emp">${t('empty_md')}</div>`;
      const countEl = document.getElementById('md-cnt');
      if (countEl) countEl.textContent = '0';
      return;
    }

    const countEl = document.getElementById('md-cnt');
    if (countEl) countEl.textContent = filtered.length;

    // Helper to render individual file item HTML
    const renderFileItem = (f) => {
      const isAct = S.activeDoc?.id === f.id;
      const isFav = S.favorites.includes(f.id);
      const snippet = SEARCH.query ? `<div class="fi-snip">${SearchService.buildSnippet(f.content, SEARCH.query)}</div>` : '';
      return `
        <div class="fi ${isAct ? 'act' : ''}" data-id="${f.id}">
          <div class="fi-main">
            <span class="fi-ico" style="${isFav ? 'color:gold;font-size:12px' : ''}">${isFav ? '★' : '🗒'}</span>
            <span class="fi-nm" style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${SearchService.escapeHtml(f.name)}</span>
            <button class="fi-fld" title="${t('move_to_folder') || '폴더로 이동'}" style="background:none;border:none;cursor:pointer;opacity:0.6;font-size:11px;margin-right:4px;padding:2px;">📁</button>
            <button class="fi-del" title="삭제">✕</button>
          </div>
          ${snippet}
        </div>
      `;
    };

    // If there are folders defined in S.folders, group them
    if (S.folders && S.folders.length > 0) {
      let foldersHtml = '';
      
      // Render each folder
      S.folders.forEach(folder => {
        const folderDocs = filtered.filter(d => d.folderId === folder.id);
        const isCollapsed = S.secOpen[folder.id] === false;
        
        foldersHtml += `
          <div class="fld-sec ${isCollapsed ? 'collapsed' : ''}" data-folder-id="${folder.id}">
            <div class="fld-h" style="display:flex;align-items:center;gap:6px;padding:6px 8px;font-size:11px;font-weight:600;color:var(--t2);cursor:pointer;background:var(--bg-hov);border-radius:4px;margin-bottom:2px;user-select:none;">
              <span class="fld-chv" style="font-size:8px;transition:transform 0.2s;display:inline-block;${isCollapsed ? 'transform:rotate(-90deg);' : ''}">▼</span>
              <span>📁</span>
              <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${SearchService.escapeHtml(folder.name)}</span>
              <span class="badge" style="background:rgba(0,0,0,0.05);color:var(--t3);padding:1px 5px;border-radius:8px;font-size:9px;font-weight:normal;">${folderDocs.length}</span>
              <button class="fld-del" style="background:none;border:none;color:var(--red);opacity:0.6;cursor:pointer;font-size:10px;padding:2px 4px;margin-left:4px;" title="폴더 삭제">✕</button>
            </div>
            <div class="fld-list" style="margin-left:8px;border-left:1px dashed var(--bdr);padding-left:4px;${isCollapsed ? 'display:none;' : ''}">
              ${folderDocs.map(f => renderFileItem(f)).join('')}
              ${folderDocs.length === 0 ? `<div class="emp" style="padding:8px;color:var(--t3);font-size:10px;">${S.lang === 'ko' ? '비어 있는 폴더' : 'Empty folder'}</div>` : ''}
            </div>
          </div>
        `;
      });
      
      // Render Uncategorized docs
      const uncategorizedDocs = filtered.filter(d => !d.folderId || !S.folders.some(f => f.id === d.folderId));
      const isUncatCollapsed = S.secOpen['uncategorized'] === false;
      
      foldersHtml += `
        <div class="fld-sec ${isUncatCollapsed ? 'collapsed' : ''}" data-folder-id="uncategorized">
          <div class="fld-h" style="display:flex;align-items:center;gap:6px;padding:6px 8px;font-size:11px;font-weight:600;color:var(--t3);cursor:pointer;user-select:none;margin-bottom:2px;">
            <span class="fld-chv" style="font-size:8px;transition:transform 0.2s;display:inline-block;${isUncatCollapsed ? 'transform:rotate(-90deg);' : ''}">▼</span>
            <span>📂</span>
            <span style="flex:1;">${S.lang === 'ko' ? '미분류 문서' : 'Uncategorized'}</span>
            <span class="badge" style="background:rgba(0,0,0,0.05);color:var(--t3);padding:1px 5px;border-radius:8px;font-size:9px;font-weight:normal;">${uncategorizedDocs.length}</span>
          </div>
          <div class="fld-list" style="margin-left:8px;border-left:1px dashed var(--bdr);padding-left:4px;${isUncatCollapsed ? 'display:none;' : ''}">
            ${uncategorizedDocs.map(f => renderFileItem(f)).join('')}
            ${uncategorizedDocs.length === 0 ? `<div class="emp" style="padding:8px;color:var(--t3);font-size:10px;">${S.lang === 'ko' ? '문서 없음' : 'No documents'}</div>` : ''}
          </div>
        </div>
      `;
      
      el.innerHTML = foldersHtml;
    } else {
      // Flat representation
      el.innerHTML = filtered.map(f => renderFileItem(f)).join('');
    }
  },

  renderRaw() {
    const el = document.getElementById('raw-l');
    if (!el) return;

    if (!S.raw || !S.raw.length) {
      el.innerHTML = `<div class="emp">📂 No files yet</div>`;
      const cnt = document.getElementById('raw-cnt');
      if (cnt) cnt.textContent = '0';
      return;
    }

    el.innerHTML = S.raw.map(f => `
      <div class="fi raw" data-id="${f.id}">
        <div class="fi-main">
          <span class="fi-ico">📄</span>
          <span class="fi-nm">${SearchService.escapeHtml(f.name)}</span>
        </div>
      </div>
    `).join('');

    const rawCntEl = document.getElementById('raw-cnt');
    if (rawCntEl) rawCntEl.textContent = S.raw.length;
  },

  _isInitialized: false,

  init() {
    if (this._isInitialized) return;
    this._isInitialized = true;

    this.initResizer();
    
    // Event Delegation for file list
    const list = document.getElementById('md-l');
    list?.addEventListener('click', async (e) => {
      try {
        const delBtn = e.target.closest('.fi-del');
        const fldBtn = e.target.closest('.fi-fld');
        const item = e.target.closest('.fi');
        
        const fldH = e.target.closest('.fld-h');
        const fldDel = e.target.closest('.fld-del');
        const fldSec = e.target.closest('.fld-sec');

        // Click folder delete button
        if (fldDel && fldSec) {
          e.stopPropagation();
          const fldId = fldSec.dataset.folderId;
          await this.deleteFolder(fldId);
          return;
        }

        // Click folder header to collapse/expand
        if (fldH && fldSec) {
          e.stopPropagation();
          const fldId = fldSec.dataset.folderId;
          S.secOpen[fldId] = S.secOpen[fldId] !== false ? false : true;
          this.render();
          return;
        }

        // Delete file button
        if (delBtn && item) {
          e.stopPropagation();
          const id = item.dataset.id;
          const msg = S.lang === 'ko' ? '이 문서를 삭제하시겠습니까?' : 'Are you sure you want to delete this document?';
          if (confirm(msg)) {
            await this.deleteDoc(id);
          }
          return;
        }

        // Move file to folder button
        if (fldBtn && item) {
          e.stopPropagation();
          const id = item.dataset.id;
          await this.promptMoveDoc(id);
          return;
        }

        // Open document
        if (item) {
          const id = item.dataset.id;
          this.openDoc(id);
        }
      } catch (err) {
        console.error('Error in sidebar click handler:', err);
      }
    });

    // Section Toggle
    ['h-raw', 'h-md'].forEach(id => {
      const h = document.getElementById(id);
      h?.addEventListener('click', () => {
        const sec = h.closest('.sb-sec');
        sec?.classList.toggle('collapsed');
      });
    });

    // Search Filters
    document.querySelectorAll('.sf').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.sf').forEach(b => b.classList.remove('act'));
        btn.classList.add('act');
        SEARCH.filter = btn.dataset.f;
        this.render();
      });
    });

    // Search Sort
    document.getElementById('search-sort')?.addEventListener('change', (e) => {
      S.sort = e.target.value;
      this.render();
    });
  },

  openDoc(id) {
    const doc = S.md.find(d => d.id === id);
    if (!doc) return;

    // 문서 전환 시 기존 진행 중이던 Q&A 요청을 전격 중단 (사이드바 조기 중단용 유지)
    if (QAPanel.abortController) {
      QAPanel.abortController.abort();
    }

    Router.navigate(id); // 74차 패치: 모든 상태 처리 및 렌더링을 라우터에 일원화 위임!
  },

  async deleteDoc(id) {
    await IDB.deleteDoc(id);
    try {
      await SB.deleteDoc(id);
    } catch (e) {
      console.warn('Supabase delete doc failed, will sync later:', e);
    }
    S.favorites = S.favorites.filter(x => x !== id);
    localStorage.setItem('dv_favs', JSON.stringify(S.favorites));
    S.md = S.md.filter(d => d.id !== id);
    S.raw = S.raw.filter(r => r.id !== id);
    delete S.docFolder[id];
    if (S.activeDoc?.id === id) {
      // 삭제 대상 문서가 활성화되어 있었다면 진행 중이던 Q&A 전격 중단
      if (QAPanel.abortController) {
        QAPanel.abortController.abort();
      }
      const { Editor } = await import('./editor.js');
      Editor.close();
    }
    this.render();
    if (window.updateStorageInfo) window.updateStorageInfo();
  },

  // --- Folder Management Methods ---
  async createFolder() {
    const isKo = S.lang === 'ko';
    const promptMsg = isKo ? '새 폴더 이름을 입력하세요:' : 'Enter new folder name:';
    const name = prompt(promptMsg);
    if (!name || !name.trim()) return;
    
    const folder = { id: 'f_' + Date.now(), name: name.trim() };
    if (!S.folders) S.folders = [];
    S.folders.push(folder);
    await IDB.put('folders', folder);
    this.render();
    UI.toast(isKo ? '폴더가 생성되었습니다.' : 'Folder created.', 'ok');
  },

  async deleteFolder(folderId) {
    const isKo = S.lang === 'ko';
    const confirmMsg = isKo 
      ? '폴더를 삭제할까요? (내부 문서는 삭제되지 않고 미분류로 이동합니다)'
      : 'Delete this folder? (Documents inside will be moved to Uncategorized)';
      
    if (confirm(confirmMsg)) {
      S.folders = S.folders.filter(f => f.id !== folderId);
      await IDB.del('folders', folderId);
      
      // Detach documents in the deleted folder
      const docsToUpdate = [];
      for (const d of S.md) {
        if (d.folderId === folderId) {
          d.folderId = null;
          d.updatedAt = new Date();
          await IDB.put('docs', d);
          docsToUpdate.push(d);
        }
      }
      
      if (docsToUpdate.length > 0) {
        try {
          await SB.saveDocsBulk(docsToUpdate);
        } catch (e) {
          console.warn('Supabase bulk save failed, will sync later:', e);
        }
      }
      
      // Cleanup S.docFolder state
      Object.keys(S.docFolder).forEach(k => {
        if (S.docFolder[k] === folderId) {
          delete S.docFolder[k];
        }
      });
      
      delete S.secOpen[folderId];
      
      this.render();
      UI.toast(isKo ? '폴더가 삭제되었습니다.' : 'Folder deleted.', 'ok');
    }
  },

  async promptMoveDoc(docId) {
    const isKo = S.lang === 'ko';
    if (!S.folders || S.folders.length === 0) {
      UI.toast(isKo ? '생성된 폴더가 없습니다. 📁+ 버튼으로 새 폴더를 먼저 만드세요.' : 'No folders found. Create a folder using the 📁+ button first.', 'warn');
      return;
    }

    const folderListText = S.folders.map((f, idx) => `${idx + 1}: ${f.name}`).join('\n');
    const body = isKo 
      ? `이동할 폴더 번호를 입력하세요:\n\n0: [미분류 문서로 이동]\n${folderListText}`
      : `Enter the folder number to move to:\n\n0: [Move to Uncategorized]\n${folderListText}`;
      
    const choice = prompt(body);
    if (choice === null) return; // User cancelled
    
    const val = parseInt(choice.trim());
    if (isNaN(val) || val < 0 || val > S.folders.length) {
      UI.toast(isKo ? '유효하지 않은 입력입니다.' : 'Invalid choice.', 'warn');
      return;
    }
    
    if (val === 0) {
      await this.moveDocToFolder(docId, null);
    } else {
      const folder = S.folders[val - 1];
      await this.moveDocToFolder(docId, folder.id);
    }
  },

  async moveDocToFolder(docId, folderId) {
    const isKo = S.lang === 'ko';
    const doc = S.md.find(d => d.id === docId);
    if (!doc) return;
    
    doc.folderId = folderId;
    doc.updatedAt = new Date();
    await IDB.put('docs', doc);
    try {
      await SB.saveDoc(doc);
    } catch(e) {}
    
    if (folderId) {
      S.docFolder[docId] = folderId;
    } else {
      delete S.docFolder[docId];
    }
    
    this.render();
    UI.toast(isKo ? '이동 완료!' : 'Moved successfully!', 'ok');
  },

  initResizer() {
    const rsz = document.getElementById('rsz');
    if (!rsz) return;
    
    let isMd = false;
    
    const onMouseMove = (e) => {
      if (!isMd) return;
      const w = Math.max(150, Math.min(600, e.clientX));
      document.documentElement.style.setProperty('--sb', w + 'px');
    };
    
    const onMouseUp = () => {
      isMd = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    
    rsz.addEventListener('mousedown', (e) => {
      isMd = true;
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });
  }
};
