/**
 * Realtime Subscription Service
 */
import { SB } from './supabase.js';
import { S } from '../state/store.js';
import { UI } from '../components/ui.js';
import { Sidebar } from '../components/sidebar.js';

export const RealtimeService = {
  channel: null,

  subscribe() {
    if (!SB.client || !SB.user) return;
    
    S.rtStatus = 'connecting';
    this.channel = SB.client.channel('db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'm_documents' }, (payload) => {
        this.handleDocChange(payload);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') S.rtStatus = 'connected';
        else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') S.rtStatus = 'disconnected';
      });
  },

  handleDocChange(payload) {
    console.log('Realtime change received:', payload);
    const { eventType, new: newDoc, old: oldDoc } = payload;

    if (eventType === 'INSERT') {
      if (!S.md.find(d => d.id === newDoc.id)) {
        S.md.unshift(this.mapDoc(newDoc));
        Sidebar.render();
      }
    } else if (eventType === 'UPDATE') {
      const idx = S.md.findIndex(d => d.id === newDoc.id);
      if (idx !== -1) {
        // Only update if remote version is newer
        if ((newDoc.version || 0) > (S.md[idx].version || 0)) {
          const mapped = this.mapDoc(newDoc);
          S.md[idx] = mapped;
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
      }
    } else if (eventType === 'DELETE') {
      S.md = S.md.filter(d => d.id !== oldDoc.id);
      Sidebar.render();
    }
  },

  mapDoc(d) {
    return {
      id: d.id,
      name: d.name,
      content: d.content,
      styleId: d.style_id,
      createdAt: new Date(d.created_at),
      updatedAt: d.updated_at ? new Date(d.updated_at) : new Date(),
      version: d.version || 1
    };
  },

  unsubscribe() {
    if (this.channel) {
      SB.client.removeChannel(this.channel);
      this.channel = null;
    }
  }
};
