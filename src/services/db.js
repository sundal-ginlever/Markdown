/**
 * Database Services (IndexedDB)
 */
import { S } from '../state/store.js';

const DB_NAME = 'DocVaultDB';
const DB_VERSION = 3;

export const IDB = {
  db: null,
  async init() {
    if (this.db) return this.db;
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = e => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('docs')) {
          const s = db.createObjectStore('docs', { keyPath: 'id' });
          s.createIndex('updatedAt', 'updatedAt', { unique: false });
        }
        if (!db.objectStoreNames.contains('raw')) {
          db.createObjectStore('raw', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('logs')) {
          const s = db.createObjectStore('logs', { keyPath: 'id', autoIncrement: true });
          s.createIndex('docId', 'docId', { unique: false });
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains('folders')) {
          db.createObjectStore('folders', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('sync_queue')) {
          db.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true });
        }
      };
      req.onsuccess = e => { this.db = e.target.result; resolve(this.db); };
      req.onerror = e => { console.error('IndexedDB Init Error:', e.target.error); reject(e.target.error); };
    });
  },

  async op(storeName, mode, fn) {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, mode);
      const store = tx.objectStore(storeName);
      const req = fn(store);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  },

  async put(store, data) { return this.op(store, 'readwrite', s => s.put(data)); },
  async get(store, id) { return this.op(store, 'readonly', s => s.get(id)); },
  async getAll(store) { return this.op(store, 'readonly', s => s.getAll()); },
  async del(store, id) { return this.op(store, 'readwrite', s => s.delete(id)); },
  async clear(store) { return this.op(store, 'readwrite', s => s.clear()); },

  async saveDoc(doc, rawData, logs, fileName, fileType) {
    await this.put('docs', doc);
    if (rawData) await this.put('raw', { id: doc.id, data: rawData, name: fileName, type: fileType });
    if (logs && logs.length) {
      for (const l of logs) {
        await this.put('logs', { ...l, docId: doc.id });
      }
    }
  },

  async loadDocs() {
    return await this.getAll('docs');
  },

  async deleteDoc(id) {
    await this.del('docs', id);
    await this.del('raw', id);
    try {
      const db = await this.init();
      const tx = db.transaction('logs', 'readwrite');
      const store = tx.objectStore('logs');
      const idx = store.index('docId');
      const req = idx.openCursor(IDBKeyRange.only(id));
      req.onsuccess = e => { const c = e.target.result; if (c) { c.delete(); c.continue(); } };
    } catch (e) { console.warn('IDB log cleanup:', e); }
  },

  async migrateFromLocalStorage(STORAGE_KEY, t, showPb, hidePb, toast) {
    const s = localStorage.getItem(STORAGE_KEY);
    if (!s) return;
    try {
      const d = JSON.parse(s);
      if (!d.md || !d.md.length) return;
      
      if (showPb) showPb(t('status_proc'));
      let count = 0;
      for (const m of d.md) {
        const raw = d.raw?.find(r => r.id === m.id)?.data || null;
        const logs = d.logs?.[m.id] || [];
        await this.saveDoc(m, raw, logs);
        count++;
      }
      localStorage.setItem(STORAGE_KEY + '_bak', s);
      localStorage.removeItem(STORAGE_KEY);
      if (toast) toast(`📦 ${count}${t('status_restore')} (IndexedDB)`, 'ok');
    } catch (e) {
      console.error('Migration failed:', e);
    } finally {
      if (hidePb) hidePb();
    }
  }
};
