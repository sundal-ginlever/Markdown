/**
 * Routing and Deep Linking Utility
 */
import { S } from '../state/store.js';
import { Sidebar } from '../components/sidebar.js';
import { Viewer } from '../components/viewer.js';

export const Router = {
  init() {
    window.addEventListener('popstate', () => this.handleRoute());
    this.handleRoute();
  },

  handleRoute() {
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
        S.activeDoc = doc;
        Viewer.render();
        Sidebar.render();
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
  },

  async loadSharedDoc(id) {
    console.log('Loading shared doc:', id);
    // Logic to fetch shared doc from Supabase public table or similar
    // This would call SB.fetchPublicDoc(id)
  }
};
