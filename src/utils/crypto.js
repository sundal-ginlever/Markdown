/**
 * Encryption Utility using Web Crypto API (AES-GCM)
 * Replaces insecure btoa/atob encoding with actual encryption.
 * The encryption key is stored as a non-extractable CryptoKey in IndexedDB,
 * which is significantly harder to access via XSS than localStorage.
 */

const ALGO = 'AES-GCM';
const KEY_NAME = 'dv_crypto_key';
const DB_NAME = 'DocVaultCrypto';

async function openCryptoDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = e => {
      e.target.result.createObjectStore('keys');
    };
    req.onsuccess = e => resolve(e.target.result);
    req.onerror = e => reject(e.target.error);
  });
}

let cachedKey = null;

async function getOrCreateKey() {
  if (cachedKey) return cachedKey;

  const db = await openCryptoDB();

  // 1. Pre-generate candidate key before starting the transaction
  const candidateKey = await crypto.subtle.generateKey(
    { name: ALGO, length: 256 },
    false, // non-extractable — cannot be exported via JS
    ['encrypt', 'decrypt']
  );

  // 2. Perform atomic get-and-set inside a single readwrite transaction (multi-tab lock)
  const key = await new Promise((resolve, reject) => {
    const tx = db.transaction('keys', 'readwrite');
    const store = tx.objectStore('keys');
    const getReq = store.get(KEY_NAME);

    getReq.onsuccess = () => {
      const existing = getReq.result;
      if (existing) {
        // Discard the newly generated candidate key, use the existing one!
        resolve(existing);
      } else {
        // Persist the candidate key
        const putReq = store.put(candidateKey, KEY_NAME);
        putReq.onsuccess = () => resolve(candidateKey);
        putReq.onerror = () => reject(putReq.error);
      }
    };
    getReq.onerror = () => reject(getReq.error);
  });

  cachedKey = key;
  return key;
}

/**
 * Encrypt a plaintext string using AES-GCM.
 * Returns a base64 string (IV + ciphertext) suitable for localStorage.
 */
export async function encrypt(plaintext) {
  const key = await getOrCreateKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);

  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGO, iv },
    key,
    encoded
  );

  // Combine IV (12 bytes) + ciphertext into one buffer
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);

  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt a previously encrypted base64 string.
 * Extracts the 12-byte IV prefix, then decrypts the remaining ciphertext.
 */
export async function decrypt(stored) {
  const key = await getOrCreateKey();
  const combined = Uint8Array.from(atob(stored), c => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);

  const decrypted = await crypto.subtle.decrypt(
    { name: ALGO, iv },
    key,
    ciphertext
  );

  return new TextDecoder().decode(decrypted);
}
