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

async function getOrCreateKey() {
  const db = await openCryptoDB();

  // Try to retrieve existing key
  const existing = await new Promise((resolve, reject) => {
    const tx = db.transaction('keys', 'readonly');
    const req = tx.objectStore('keys').get(KEY_NAME);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

  if (existing) return existing;

  // Generate a new non-extractable AES-GCM key
  const key = await crypto.subtle.generateKey(
    { name: ALGO, length: 256 },
    false, // non-extractable — cannot be exported via JS
    ['encrypt', 'decrypt']
  );

  // Persist in IndexedDB
  await new Promise((resolve, reject) => {
    const tx = db.transaction('keys', 'readwrite');
    const req = tx.objectStore('keys').put(key, KEY_NAME);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });

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
