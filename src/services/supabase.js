/**
 * Supabase Cloud Synchronization Service
 */

import { createClient } from '@supabase/supabase-js';
import { S } from '../state/store.js';
import { IDB } from './db.js';
import { decrypt } from '../utils/crypto.js';

export const SB = {
  client: null,
  user: null,
  session: null,
  config: null,
  isSyncing: false,

  async init(cfg = null) {
    // 덮어쓰기 전 기존의 실시간 채널을 선제 격리하여 완벽 소거
    if (this.client) {
      try {
        import('./realtime.js').then(({ RealtimeService }) => RealtimeService.unsubscribe()).catch(e => console.warn('Realtime cleanup bypassed safely:', e));
      } catch (e) {
        console.warn('Pre-init realtime cleanup bypassed:', e);
      }
    }

    if (cfg) {
      this.config = cfg;
    } else {
      const encCfg = localStorage.getItem('dv_sb_cfg_enc');
      if (encCfg) {
        try {
          const json = await decrypt(encCfg);
          this.config = JSON.parse(json);
        } catch (e) {
          console.error('Supabase Config Decryption Failed (Key missing/corrupted). Clearing stale config.', e);
          localStorage.removeItem('dv_sb_cfg_enc');
          this.config = null;
        }
      }
    }
    // Clean up any remaining legacy plain-text configs if they exist, to ensure complete security compliance
    localStorage.removeItem('dv_sb_cfg');

    if (!this.config?.url || !this.config?.key) return null;

    try {
      this.client = createClient(this.config.url, this.config.key);
      const { data } = await this.client.auth.getSession();
      this.session = data.session;
      this.user = data.session?.user || null;

      this.client.auth.onAuthStateChange((event, session) => {
        this.session = session;
        this.user = session?.user || null;
        if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
          this.isSyncing = false;
          import('./realtime.js').then(({ RealtimeService }) => RealtimeService.unsubscribe()).catch(e => console.warn('Realtime cleanup bypassed safely:', e));
        }
      });

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
    import('./realtime.js').then(({ RealtimeService }) => RealtimeService.unsubscribe()).catch(e => console.warn('Realtime cleanup bypassed safely:', e));
  },

  async saveDoc(mf, rawDoc) {
    if (!this.client || !this.user) return;
    
    // Deduplicate: remove any existing saveDoc items for this doc from the queue
    try {
      const queue = await IDB.getAll('sync_queue');
      for (const item of queue) {
        if (item.action === 'saveDoc' && item.data?.mf?.id === mf.id) {
          await IDB.del('sync_queue', item.id);
        }
      }
    } catch (e) {
      console.warn('Queue deduplication failed:', e);
    }

    const payload = {
      action: 'saveDoc',
      data: { mf, rawDoc },
      userId: this.user.id,
      ts: Date.now()
    };
    await IDB.put('sync_queue', payload);
    await this.processQueue();
  },

  async saveDocsBulk(docsList) {
    if (!this.client || !this.user || !docsList.length) return;

    try {
      const queue = await IDB.getAll('sync_queue');
      const docIds = new Set(docsList.map(d => d.id));
      for (const item of queue) {
        if (item.action === 'saveDoc' && docIds.has(item.data?.mf?.id)) {
          await IDB.del('sync_queue', item.id);
        }
      }
    } catch (e) {
      console.warn('Queue bulk deduplication failed:', e);
    }

    for (const doc of docsList) {
      const payload = {
        action: 'saveDoc',
        data: { mf: doc, rawDoc: undefined },
        userId: this.user.id,
        ts: Date.now()
      };
      await IDB.put('sync_queue', payload);
    }
    
    this.processQueue();
  },

  async processQueue() {
    if (!navigator.onLine) return; // 75차 패치: 오프라인 시 싱크 대기열 프로세싱 원천 조기 반환!
    if (this.isSyncing || !this.client || !this.user) return;
    this.isSyncing = true;

    try {
      const queue = await IDB.getAll('sync_queue');
      for (const item of queue) {
        // Session validation guard: if the user signed out mid-loop, abort immediately!
        if (!this.user || !this.client) {
          console.warn('Session was terminated during queue processing, aborting pipeline.');
          break;
        }

        // Security Guard: Prevent cross-user data sync leak by skipping items belonging to another user
        if (item.userId && item.userId !== this.user.id) {
          console.warn(`Skipping sync queue item ${item.id} because it belongs to a different user (${item.userId})`);
          continue;
        }

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
          if (e.message?.includes('Auth session missing') || e.status === 401 || e.message?.includes('JWT expired')) {
            import('../components/ui.js').then(({ UI }) => {
              UI.toast('세션이 만료되었습니다. 다시 로그인해 주세요.', 'warn');
            });
            break;
          }
          if (e.message === 'VERSION_CONFLICT') {
            // Discard this stale item to prevent deadlock
            await IDB.del('sync_queue', item.id);
            
            // Fork the local document to save the user's offline work
            const forkedDoc = { ...item.data.mf };
            forkedDoc.id = 'md_' + Date.now().toString() + '_' + Math.random().toString(36).substr(2, 5);
            forkedDoc.name = `[충돌 복사본] ${forkedDoc.name}`;
            forkedDoc.version = 1;
            forkedDoc.rawId = forkedDoc.id;
            
            // If original document has raw file data, copy it for the fork
            if (item.data.rawDoc) {
              await IDB.put('raw', {
                id: forkedDoc.id,
                data: item.data.rawDoc.content,
                name: item.data.rawDoc.name,
                type: item.data.rawDoc.ext
              });
              if (!S.raw) S.raw = [];
              S.raw.unshift({ id: forkedDoc.id, name: item.data.rawDoc.name, type: item.data.rawDoc.ext });
            } else {
              try {
                const origRaw = await IDB.get('raw', item.data.mf.rawId);
                if (origRaw) {
                  const newRaw = { ...origRaw, id: forkedDoc.id };
                  await IDB.put('raw', newRaw);
                  if (!S.raw) S.raw = [];
                  S.raw.unshift({ id: forkedDoc.id, name: newRaw.name, type: newRaw.type });
                }
              } catch (rawErr) {
                console.warn('Failed to duplicate raw data from IDB:', rawErr);
              }
            }

            // Save fork to local IDB and S state
            await IDB.put('docs', forkedDoc);
            S.md.unshift(forkedDoc);
            
            // Enqueue the fork to be safely synced to cloud
            await IDB.put('sync_queue', { action: 'saveDoc', data: { mf: forkedDoc, rawDoc: item.data.rawDoc }, userId: this.user.id, ts: Date.now() });
            
            // Auto-Recovery: Overwrite original document with the cloud's latest state to escape conflict deadlock
            try {
              const { data: remoteDoc, error: getErr } = await this.client
                .from('m_documents')
                .select('*')
                .eq('id', item.data.mf.id)
                .maybeSingle();
              
              if (!getErr && remoteDoc) {
                const mappedRemote = {
                  id: remoteDoc.id,
                  name: remoteDoc.name,
                  content: remoteDoc.content,
                  styleId: remoteDoc.style_id,
                  createdAt: new Date(remoteDoc.created_at),
                  updatedAt: new Date(remoteDoc.updated_at),
                  version: remoteDoc.version,
                  rawId: remoteDoc.raw_id
                };
                
                await IDB.put('docs', mappedRemote);
                const origIdx = S.md.findIndex(d => d.id === mappedRemote.id);
                if (origIdx !== -1) {
                  S.md[origIdx] = mappedRemote;
                }
                
                if (S.activeDoc?.id === mappedRemote.id) {
                  S.activeDoc = mappedRemote;
                  import('../components/viewer.js').then(({ Viewer }) => Viewer.render());
                }
              }
            } catch (fetchErr) {
              console.warn('Failed to overwrite local copy with remote version after conflict:', fetchErr);
            }
            
            import('../components/sidebar.js').then(({ Sidebar }) => Sidebar.render());
            import('../components/ui.js').then(({ UI }) => {
              UI.toast(`버전 충돌 발생: 오프라인 변경사항을 "${forkedDoc.name}"(으)로 분리 저장하고 원래 문서는 클라우드 최신 버전으로 자동 덮어씌웠습니다.`, 'warn');
            });
          } else if (e.code && (e.code === '22001' || e.code === '23505') || e.status === 400 || e.status === 422 || e.status === 413) {
            console.error('Permanent sync error detected (Poison Pill), discarding item:', e);
            await IDB.del('sync_queue', item.id);
            import('../components/ui.js').then(({ UI }) => {
              UI.toast('문서 동기화 실패 (영구 오류): 서버에서 저장을 거부했습니다.', 'err');
            });
          } else {
            // 75차 패치: 네트워크 오프라인 혹은 단절/DNS 오류(Failed to fetch)인 경우 재시도 횟수 차감/페널티 없이 안전하게 패스!
            const isNetworkError = !navigator.onLine || 
              (e.message && (e.message.includes('Failed to fetch') || e.message.includes('network') || e.message.includes('Load failed'))) ||
              e.status === 0 || e.status === 502 || e.status === 503 || e.status === 504;

            if (isNetworkError) {
              console.log('Temporary network error during sync, leaving item in queue to retry later without incrementing retries:', e);
              break; // 대기열 중지, 페이로드는 훼손 없이 큐에 잔존
            }

            const maxRetries = 5;
            const currentRetries = (item.retry || 0) + 1;
            if (currentRetries >= maxRetries) {
              console.error(`Poison pill item [${item.id}] exceeded max retries. Discarding to prevent pipeline deadlock.`, e);
              await IDB.del('sync_queue', item.id);
              import('../components/ui.js').then(({ UI }) => {
                UI.toast(`문서(${item.data?.mf?.name || 'unknown'})의 동기화가 계속 실패하여 대기열에서 격리했습니다.`, 'err');
              });
              continue;
            } else {
              item.retry = currentRetries;
              await IDB.put('sync_queue', item);
              break;
            }
          }
        }
      }
    } finally {
      this.isSyncing = false;
    }
  },

  async _performSaveDoc(mf, rawDoc) {
    // 1. Fetch current remote version first to check for conflicts (Optimistic Concurrency Control)
    let remoteVersion = 0;
    try {
      const { data: remoteData, error: fetchError } = await this.client
        .from('m_documents')
        .select('version')
        .eq('id', mf.id)
        .maybeSingle();
      
      if (!fetchError && remoteData) {
        remoteVersion = remoteData.version || 0;
      }
    } catch (e) {
      console.warn('Failed to fetch remote version, proceeding anyway:', e);
    }

    // 2. Conflict detection: Remote version is strictly newer than our local base version
    if (remoteVersion > (mf.version || 0)) {
      console.warn(`Version conflict detected for doc ${mf.id}. Remote: ${remoteVersion}, Local base: ${mf.version}`);
      throw new Error('VERSION_CONFLICT');
    }

    const payload = {
      id: mf.id,
      user_id: this.user.id,
      name: mf.name,
      raw_id: mf.rawId,
      content: mf.content,
      style_id: mf.styleId || 'dev',
      sheet_count: mf.cnt || 0,
      updated_at: new Date().toISOString(),
      version: Math.max(remoteVersion, mf.version || 0) + 1
    };

    if (rawDoc !== undefined) {
      payload.raw_name = rawDoc?.name || null;
      payload.raw_ext = rawDoc?.ext || null;
      payload.raw_content = rawDoc?.content || null;
    }

    const { data, error } = await this.client
      .from('m_documents')
      .upsert(payload, { onConflict: 'id' })
      .select();

    if (error) {
      throw error;
    }

    // Update local version if successful
    if (data && data[0]) {
      const newVer = data[0].version;
      mf.version = newVer;

      // Update global store reactively
      const origDoc = S.md.find(d => d.id === mf.id);
      if (origDoc) {
        origDoc.version = newVer;
      }
      if (S.activeDoc && S.activeDoc.id === mf.id) {
        S.activeDoc.version = newVer;
      }

      // Persist the updated versioned document back to IndexedDB
      const updatedDoc = {
        id: mf.id,
        name: mf.name,
        rawId: mf.rawId,
        content: mf.content,
        styleId: mf.styleId || 'dev',
        createdAt: mf.createdAt ? new Date(mf.createdAt) : new Date(),
        updatedAt: mf.updatedAt ? new Date(mf.updatedAt) : new Date(),
        version: newVer
      };
      if (mf.folderId) updatedDoc.folderId = mf.folderId;
      await IDB.put('docs', updatedDoc);
    }
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

  async pullSync() {
    if (!this.client || !this.user) return;
    try {
      console.log('Starting Supabase Pull Sync...');
      const remoteDocs = await this.loadAll() || [];

      const localDocs = await IDB.getAll('docs');
      const localDocsMap = new Map(localDocs.map(d => [d.id, d]));
      
      let updatedAny = false;

      // Identify remote deletions: local docs that are synced (version > 0) but absent in remote Supabase list
      const remoteDocIds = new Set(remoteDocs.map(d => d.id));
      for (const localDoc of localDocs) {
        if (localDoc.version > 0 && !remoteDocIds.has(localDoc.id)) {
          console.log(`Remote deletion detected for doc ${localDoc.id}. Deleting locally.`);
          await IDB.deleteDoc(localDoc.id);
          S.md = S.md.filter(d => d.id !== localDoc.id);
          S.raw = S.raw.filter(r => r.id !== localDoc.id);
          delete S.docFolder[localDoc.id];
          S.favorites = S.favorites.filter(x => x !== localDoc.id);
          localStorage.setItem('dv_favs', JSON.stringify(S.favorites));
          
          if (S.activeDoc?.id === localDoc.id) {
            const { Editor } = await import('../components/editor.js');
            Editor.close();
            import('../components/ui.js').then(({ UI }) => {
              UI.toast('다른 기기에서 현재 문서가 삭제되어 화면을 닫았습니다.', 'warn');
            });
          }
          updatedAny = true;
        }
      }

      if (remoteDocs.length === 0) {
        if (updatedAny) {
          import('../components/sidebar.js').then(({ Sidebar }) => Sidebar.render());
        }
        return;
      }

      for (const remoteDoc of remoteDocs) {
        const localDoc = localDocsMap.get(remoteDoc.id);
        const remoteVersion = remoteDoc.version || 0;
        const localVersion = localDoc?.version || 0;

        if (!localDoc || remoteVersion > localVersion) {
          const mappedRemote = {
            id: remoteDoc.id,
            name: remoteDoc.name,
            content: remoteDoc.content,
            styleId: remoteDoc.style_id,
            createdAt: new Date(remoteDoc.created_at),
            updatedAt: new Date(remoteDoc.updated_at),
            version: remoteVersion,
            rawId: remoteDoc.raw_id,
            cnt: remoteDoc.sheet_count || 0
          };
          if (remoteDoc.folder_id) {
            mappedRemote.folderId = remoteDoc.folder_id;
          }

          // Save to IndexedDB docs
          await IDB.put('docs', mappedRemote);

          // Save Raw File data if exists in remote
          if (remoteDoc.raw_content) {
            await IDB.put('raw', {
              id: remoteDoc.id,
              data: remoteDoc.raw_content,
              name: remoteDoc.raw_name,
              type: remoteDoc.raw_ext
            });
            
            // Sync to S.raw
            if (!S.raw) S.raw = [];
            const rawIdx = S.raw.findIndex(r => r.id === remoteDoc.id);
            const rawMeta = { id: remoteDoc.id, name: remoteDoc.raw_name, type: remoteDoc.raw_ext };
            if (rawIdx !== -1) {
              S.raw[rawIdx] = rawMeta;
            } else {
              S.raw.unshift(rawMeta);
            }
          }

          // Sync to S.md
          if (!S.md) S.md = [];
          const idx = S.md.findIndex(d => d.id === remoteDoc.id);
          if (idx !== -1) {
            S.md[idx] = mappedRemote;
          } else {
            S.md.unshift(mappedRemote);
          }

          // If activeDoc was updated, reactively update it
          if (S.activeDoc?.id === remoteDoc.id) {
            S.activeDoc = mappedRemote;
            import('../components/viewer.js').then(({ Viewer }) => Viewer.render());
          }

          updatedAny = true;
        }
      }

      if (updatedAny) {
        console.log('Pull Sync completed and local store updated.');
        import('../components/sidebar.js').then(({ Sidebar }) => Sidebar.render());
      }
    } catch (e) {
      console.error('Supabase pullSync error:', e);
    }
  },

  async deleteDoc(docId) {
    if (!this.client || !this.user) return;

    // Deduplicate: remove any existing saveDoc/deleteDoc items for this doc from the queue
    try {
      const queue = await IDB.getAll('sync_queue');
      for (const item of queue) {
        if (item.data?.mf?.id === docId || item.data?.docId === docId) {
          await IDB.del('sync_queue', item.id);
        }
      }
    } catch (e) {
      console.warn('Queue cleanup failed:', e);
    }

    const payload = { action: 'deleteDoc', data: { docId }, userId: this.user.id, ts: Date.now() };
    await IDB.put('sync_queue', payload);
    await this.processQueue();
  },

  async _performDeleteDoc(docId) {
    await this.client.from('m_documents').delete().eq('id', docId).eq('user_id', this.user.id);
  },

  async saveLog(docId, logEntry) {
    if (!this.client || !this.user) return;
    const payload = { action: 'saveLog', data: { docId, logEntry }, userId: this.user.id, ts: Date.now() };
    await IDB.put('sync_queue', payload);
    await this.processQueue();
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
