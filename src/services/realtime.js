/**
 * Realtime Subscription Service
 */
import { SB } from './supabase.js';
import { S } from '../state/store.js';
import { UI } from '../components/ui.js';
import { Sidebar } from '../components/sidebar.js';
import { IDB } from './db.js';

export const RealtimeService = {
  channel: null,
  isSubscribing: false,

  async subscribe() {
    if (!SB.client || !SB.user) return;
    
    if (this.isSubscribing) return;
    this.isSubscribing = true;
    
    try {
      // Cleanup any existing channel to prevent duplicate event bindings
      await this.unsubscribe();
      
      S.rtStatus = 'connecting';
      this.channel = SB.client.channel('db-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'm_documents', filter: `user_id=eq.${SB.user.id}` }, (payload) => {
          this.handleDocChange(payload);
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') S.rtStatus = 'connected';
          else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') S.rtStatus = 'disconnected';
        });
    } finally {
      this.isSubscribing = false;
    }
  },

  async handleDocChange(payload) {
    console.log('Realtime change received:', payload);
    const { eventType, new: newDoc, old: oldDoc } = payload;

    if (eventType === 'INSERT') {
      if (!S.md.find(d => d.id === newDoc.id)) {
        const mapped = this.mapDoc(newDoc);
        S.md.unshift(mapped);
        await IDB.put('docs', mapped);
        Sidebar.render();
      }
    } else if (eventType === 'UPDATE') {
      const idx = S.md.findIndex(d => d.id === newDoc.id);
      if (idx !== -1) {
        // Only update if remote version is newer
        if ((newDoc.version || 0) > (S.md[idx].version || 0)) {
          const mapped = this.mapDoc(newDoc);
          S.md[idx] = mapped;
          await IDB.put('docs', mapped);
          Sidebar.render();
          if (S.activeDoc?.id === newDoc.id) {
            if (S.mode === 'view') {
              S.activeDoc = mapped;
              import('../components/viewer.js').then(({ Viewer }) => {
                Viewer.render();
              });
              UI.toast('다른 기기에서 변경된 내용이 실시간으로 반영되었습니다.', 'ok');
            } else {
              UI.toast('다른 기기에서 이 문서가 업데이트되었습니다. 저장 시 버전 충돌이 발생할 수 있습니다.', 'warn');
            }
          }
        }
      } else {
        // Local Missing Guard: If not found locally, treat UPDATE as INSERT to keep sync intact
        const mapped = this.mapDoc(newDoc);
        S.md.unshift(mapped);
        await IDB.put('docs', mapped);
        Sidebar.render();
      }
    } else if (eventType === 'DELETE') {
      S.md = S.md.filter(d => d.id !== oldDoc.id);
      await IDB.deleteDoc(oldDoc.id);
      Sidebar.render();
      if (S.activeDoc?.id === oldDoc.id) {
        import('../components/editor.js').then(({ Editor }) => Editor.close());
        UI.toast('다른 기기에서 현재 보고 있는 문서가 삭제되어 창을 닫았습니다.', 'warn');
      }
    }
  },

  mapDoc(d) {
    const mapped = {
      id: d.id,
      name: d.name,
      content: d.content,
      styleId: d.style_id,
      createdAt: new Date(d.created_at),
      updatedAt: d.updated_at ? new Date(d.updated_at) : new Date(),
      version: d.version || 1,
      rawId: d.raw_id,
      cnt: d.sheet_count || 0
    };
    
    if (d.folder_id) {
      mapped.folderId = d.folder_id;
      S.docFolder[d.id] = d.folder_id;
    } else {
      delete S.docFolder[d.id];
    }
    
    return mapped;
  },

  async unsubscribe() {
    if (this.channel && SB.client) {
      try {
        await SB.client.removeChannel(this.channel);
      } catch (e) {
        console.warn('Failed to remove channel safely:', e);
      }
    }
    this.channel = null;
  }
};
