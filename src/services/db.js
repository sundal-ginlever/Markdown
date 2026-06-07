/**
 * Database Services (IndexedDB)
 */
import { S } from '../state/store.js';

const DB_VERSION = 3;

export const IDB = {
  db: null,
  initPromise: null,
  userId: 'guest',

  async init() {
    if (this.db) return this.db;
    if (this.initPromise) return this.initPromise;

    const dbName = `DocVaultDB_${this.userId}`;
    this.initPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(dbName, DB_VERSION);
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
      req.onsuccess = e => {
        this.db = e.target.result;
        this.initPromise = null;
        resolve(this.db);
      };
      req.onerror = e => {
        console.error('IndexedDB Init Error:', e.target.error);
        this.initPromise = null;
        reject(e.target.error);
      };
    });
    return this.initPromise;
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

  async getRawMetadata() {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('raw', 'readonly');
      const store = tx.objectStore('raw');
      const req = store.openCursor();
      const results = [];
      req.onsuccess = e => {
        const cursor = e.target.result;
        if (cursor) {
          results.push({ id: cursor.value.id, name: cursor.value.name, type: cursor.value.type });
          cursor.continue();
        } else {
          resolve(results);
        }
      };
      req.onerror = () => reject(req.error);
    });
  },

  async saveDoc(doc, rawData, logs, fileName, fileType) {
    const db = await this.init();
    
    return new Promise((resolve, reject) => {
      // Open a single atomic multi-store readwrite transaction
      const tx = db.transaction(['docs', 'raw', 'logs'], 'readwrite');
      
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(new Error('Transaction aborted (Rollback completed)'));

      try {
        // 1. Put document metadata into 'docs' store
        tx.objectStore('docs').put(doc);
        
        // 2. Put raw content into 'raw' store if available
        if (rawData) {
          tx.objectStore('raw').put({
            id: doc.id,
            data: rawData,
            name: fileName,
            type: fileType
          });
        }
        
        // 3. Put edit logs into 'logs' store if available
        if (logs && logs.length) {
          const logStore = tx.objectStore('logs');
          for (const l of logs) {
            logStore.put({ ...l, docId: doc.id });
          }
        }
      } catch (err) {
        tx.abort();
        reject(err);
      }
    });
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
      await new Promise((resolve, reject) => {
        const req = idx.openCursor(IDBKeyRange.only(id));
        req.onsuccess = e => { 
          const c = e.target.result; 
          if (c) { 
            c.delete(); 
            c.continue(); 
          } 
        };
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
      });
    } catch (e) { console.warn('IDB log cleanup:', e); }
  },

  async migrateFromLocalStorage(STORAGE_KEY, t, showPb, hidePb, toast) {
    const s = localStorage.getItem(STORAGE_KEY);
    if (!s) return;
    
    // Decoupling Guard: backup and remove the active migration trigger key immediately 
    // to prevent infinite loops on reload if any document throws an error during migration.
    localStorage.setItem(STORAGE_KEY + '_bak', s);
    localStorage.removeItem(STORAGE_KEY);
    
    try {
      const d = JSON.parse(s);
      if (!d.md || !d.md.length) return;
      
      if (showPb) showPb(t('status_proc'));
      let count = 0;
      for (const m of d.md) {
        try {
          const raw = d.raw?.find(r => r.id === m.id)?.data || null;
          const logs = d.logs?.[m.id] || [];
          await this.saveDoc(m, raw, logs);
          count++;
        } catch (itemErr) {
          console.warn(`Failed to migrate single document ${m.id || 'unknown'}:`, itemErr);
        }
      }
      if (toast && count > 0) toast(`📦 ${count}${t('status_restore')} (IndexedDB)`, 'ok');
    } catch (e) {
      console.error('Migration structural parse failed:', e);
    } finally {
      if (hidePb) hidePb();
    }
  },

  async getLogs(docId) {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('logs', 'readonly');
      const store = tx.objectStore('logs');
      const idx = store.index('docId');
      const req = idx.getAll(IDBKeyRange.only(docId));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  },

  async switchUser(userId) {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    this.initPromise = null;
    this.userId = userId || 'guest';
    await this.init();
  }
};
