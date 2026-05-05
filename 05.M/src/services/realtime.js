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
          S.md[idx] = this.mapDoc(newDoc);
          Sidebar.render();
          if (S.activeDoc?.id === newDoc.id) {
            UI.toast('Document updated from another device', 'info');
            // Logic to prompt user to reload or auto-update
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
