/**
 * Supabase Cloud Synchronization Service
 */

import { createClient } from '@supabase/supabase-js';
import { S } from '../state/store.js';
import { IDB } from './db.js';

export const SB = {
  client: null,
  user: null,
  session: null,
  config: JSON.parse(localStorage.getItem('dv_sb_cfg') || 'null'),
  isSyncing: false,

  async init(cfg = null) {
    if (cfg) {
      this.config = cfg;
      localStorage.setItem('dv_sb_cfg', JSON.stringify(cfg));
    }
    if (!this.config?.url || !this.config?.key) return null;

    try {
      this.client = createClient(this.config.url, this.config.key);
      const { data } = await this.client.auth.getSession();
      this.session = data.session;
      this.user = data.session?.user || null;

      // Start background sync processor
      this.processQueue();

      return this.client;
    } catch (e) {
      console.error('Supabase Init Error:', e);
      return null;
    }
  },

  async signUp(email, password) {
    if (!this.client) throw new Error('Supabase not initialized');
    return await this.client.auth.signUp({ email, password });
  },

  async signIn(email, password) {
    if (!this.client) throw new Error('Supabase not initialized');
    const { data, error } = await this.client.auth.signInWithPassword({ email, password });
    if (!error) {
      this.session = data.session;
      this.user = data.user;
    }
    return { data, error };
  },

  async signOut() {
    if (!this.client) return;
    await this.client.auth.signOut();
    this.session = null;
    this.user = null;
  },

  async saveDoc(mf, rawDoc) {
    const payload = {
      action: 'saveDoc',
      data: { mf, rawDoc },
      ts: Date.now()
    };
    await IDB.put('sync_queue', payload);
    this.processQueue();
  },

  async processQueue() {
    if (this.isSyncing || !this.client || !this.user) return;
    this.isSyncing = true;

    try {
      const queue = await IDB.getAll('sync_queue');
      for (const item of queue) {
        try {
          if (item.action === 'saveDoc') {
            await this._performSaveDoc(item.data.mf, item.data.rawDoc);
          } else if (item.action === 'deleteDoc') {
            await this._performDeleteDoc(item.data.docId);
          } else if (item.action === 'saveLog') {
            await this._performSaveLog(item.data.docId, item.data.logEntry);
          }
          await IDB.del('sync_queue', item.id);
        } catch (e) {
          console.warn('Sync item failed, will retry later:', e);
          break; // Stop processing queue if one fails (likely offline)
        }
      }
    } finally {
      this.isSyncing = false;
    }
  },

  async _performSaveDoc(mf, rawDoc) {
    const payload = {
      id: mf.id,
      user_id: this.user.id,
      name: mf.name,
      raw_id: mf.rawId,
      content: mf.content,
      style_id: mf.styleId || 'dev',
      sheet_count: mf.cnt || 0,
      updated_at: new Date().toISOString(),
      version: (mf.version || 1) + 1
    };

    if (rawDoc !== undefined) {
      payload.raw_name = rawDoc?.name || null;
      payload.raw_ext = rawDoc?.ext || null;
      payload.raw_content = rawDoc?.content || null;
    }

    // Optimistic concurrency control: match by id and current version
    const query = this.client
      .from('m_documents')
      .upsert(payload, { onConflict: 'id' });

    if (mf.version) {
      query.eq('version', mf.version);
    }

    const { data, error } = await query.select();

    if (error) {
      if (error.code === '23505' || error.code === 'PGRST116') {
        throw new Error('VERSION_CONFLICT');
      }
      throw error;
    }

    // Update local version if successful
    if (data && data[0]) mf.version = data[0].version;
  },

  async loadAll() {
    if (!this.client || !this.user) return [];
    try {
      const { data, error } = await this.client
        .from('m_documents')
        .select('*')
        .eq('user_id', this.user.id)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data;
    } catch (e) {
      console.error('Supabase loadAll error:', e);
      return [];
    }
  },

  async deleteDoc(docId) {
    const payload = { action: 'deleteDoc', data: { docId }, ts: Date.now() };
    await IDB.put('sync_queue', payload);
    this.processQueue();
  },

  async _performDeleteDoc(docId) {
    await this.client.from('m_documents').delete().eq('id', docId).eq('user_id', this.user.id);
  },

  async saveLog(docId, logEntry) {
    const payload = { action: 'saveLog', data: { docId, logEntry }, ts: Date.now() };
    await IDB.put('sync_queue', payload);
    this.processQueue();
  },

  async _performSaveLog(docId, logEntry) {
    await this.client.from('m_edit_logs').insert({
      doc_id: docId,
      user_id: this.user.id,
      msg: logEntry.msg,
      delta: logEntry.delta || 0,
      after_text: logEntry.after || ''
    });
  }
};
