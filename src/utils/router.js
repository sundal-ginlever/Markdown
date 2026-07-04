/**
 * Routing and Deep Linking Utility
 */
import { S } from '../state/store.js';
import { Sidebar } from '../components/sidebar.js';
import { Viewer } from '../components/viewer.js';

export const Router = {
  _popstateHandler: null,

  init() {
    if (this._popstateHandler) {
      window.removeEventListener('popstate', this._popstateHandler);
    }
    this._popstateHandler = () => this.handleRoute();
    window.addEventListener('popstate', this._popstateHandler);
    this.handleRoute();
  },

  async handleRoute() {
    const params = new URLSearchParams(window.location.search);
    
    // Handle Shared Document
    const shareId = params.get('share');
    if (shareId) {
      this.loadSharedDoc(shareId);
      return;
    }

    // Handle Local Document Selection via URL
    const docId = params.get('doc');
    if (docId) {
      const doc = S.md.find(d => d.id === docId);
      if (doc) {
        // Safety Guard: Auto-Save current document editing progress before navigating away
        if (S.mode === 'edit' && S.activeDoc && S.activeDoc.id !== docId) {
          const { Editor } = await import('../components/editor.js');
          try {
            await Editor.save();
          } catch (err) {
            console.error('Auto-save failed during navigation:', err);
            try {
              const { UI } = await import('../components/ui.js');
              UI.toast(S.lang === 'ko' ? '자동 저장에 실패했지만 이동을 진행합니다.' : 'Auto-save failed but proceeding with navigation.', 'warn');
            } catch (uiErr) {
              console.error('Failed to show toast:', uiErr);
            }
          }
        } else if (S.mode === 'edit') {
          const { Editor } = await import('../components/editor.js');
          Editor.setMode('view');
        }
        S.activeDoc = doc;
        Viewer.render();
        Sidebar.render();

        // Sync LogPanel reactively if it is currently open
        if (S.logOpen) {
          import('../components/logPanel.js').then(({ LogPanel }) => LogPanel.render());
        }
      } else {
        // Fallback Rescue: Handle invalid/deleted deep links gracefully
        console.warn(`Attempted to access invalid or deleted document link: ${docId}`);
        const { Editor } = await import('../components/editor.js');
        Editor.close();
        this.navigate(null);
      }
    } else {
      if (S.mode === 'edit') {
        const { Editor } = await import('../components/editor.js');
        try {
          await Editor.save();
        } catch (err) {
          console.error('Auto-save failed during closing:', err);
          try {
            const { UI } = await import('../components/ui.js');
            UI.toast(S.lang === 'ko' ? '자동 저장에 실패했습니다.' : 'Auto-save failed.', 'warn');
          } catch (uiErr) {
            console.error('Failed to show toast:', uiErr);
          }
        }
      }
      if (S.activeDoc) {
        const { Editor } = await import('../components/editor.js');
        Editor.close();
      }
    }
  },

  navigate(docId) {
    const url = new URL(window.location.href);
    if (docId) {
      url.searchParams.set('doc', docId);
    } else {
      url.searchParams.delete('doc');
    }
    window.history.pushState({}, '', url);
    this.handleRoute(); // Trigger routing immediately on navigate!
  },

  async loadSharedDoc(id) {
    console.log('Loading shared doc:', id);
    // Not implemented — no cloud backend to fetch a shared document from.
  }
};
