/**
 * Session Encryption Utility
 * Encrypts sensitive session data stored in localStorage
 * Uses Web Crypto API (AES-GCM) for encryption
 */

const SESSION_STORAGE_KEY = 'auth_session';
const SESSION_ENCRYPTION_KEY_NAME = 'session_enc_key';

/**
 * Generate or retrieve encryption key from IndexedDB
 * In production, consider using a key derived from user's password + salt
 */
async function getOrCreateEncryptionKey() {
  // Try to get existing key from IndexedDB
  const key = await getKeyFromIndexedDB();
  if (key) return key;
  
  // Generate new key
  const newKey = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true, // extractable
    ['encrypt', 'decrypt']
  );
  
  // Store in IndexedDB
  await storeKeyInIndexedDB(newKey);
  return newKey;
}

/**
 * Store encryption key in IndexedDB (more secure than localStorage)
 */
async function storeKeyInIndexedDB(key) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('SecureSessionDB', 1);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('keys')) {
        db.createObjectStore('keys');
      }
    };
    
    request.onsuccess = async (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['keys'], 'readwrite');
      const store = transaction.objectStore('keys');
      
      // Export key as raw format for storage
      const exportedKey = await crypto.subtle.exportKey('raw', key);
      store.put(exportedKey, SESSION_ENCRYPTION_KEY_NAME);
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    };
    
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get encryption key from IndexedDB
 */
async function getKeyFromIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('SecureSessionDB', 1);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('keys')) {
        db.createObjectStore('keys');
      }
    };
    
    request.onsuccess = async (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['keys'], 'readonly');
      const store = transaction.objectStore('keys');
      const getRequest = store.get(SESSION_ENCRYPTION_KEY_NAME);
      
      getRequest.onsuccess = async () => {
        if (getRequest.result) {
          try {
            const key = await crypto.subtle.importKey(
              'raw',
              getRequest.result,
              { name: 'AES-GCM', length: 256 },
              false,
              ['encrypt', 'decrypt']
            );
            resolve(key);
          } catch (err) {
            resolve(null);
          }
        } else {
          resolve(null);
        }
      };
      
      getRequest.onerror = () => resolve(null);
      transaction.oncomplete = () => db.close();
    };
    
    request.onerror = () => resolve(null);
  });
}

/**
 * Encrypt data using AES-GCM
 * @param {Object} data - Data to encrypt
 * @returns {Promise<string>} Base64 encoded encrypted data with IV
 */
export async function encryptSession(data) {
  try {
    const key = await getOrCreateEncryptionKey();
    const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for GCM
    const encodedData = new TextEncoder().encode(JSON.stringify(data));
    
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encodedData
    );
    
    // Combine IV + encrypted data
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);
    
    return btoa(String.fromCharCode(...combined));
  } catch (err) {
    console.error('Session encryption failed:', err);
    // Fallback to plaintext (with warning)
    console.warn('Falling back to unencrypted storage');
    return JSON.stringify(data);
  }
}

/**
 * Decrypt session data
 * @param {string} encryptedData - Base64 encoded encrypted data
 * @returns {Promise<Object|null>} Decrypted data or null if failed
 */
export async function decryptSession(encryptedData) {
  try {
    // Check if it's plaintext (fallback)
    if (!encryptedData || typeof encryptedData !== 'string') {
      return null;
    }
    
    // Try to parse as JSON first (plaintext fallback)
    try {
      const parsed = JSON.parse(encryptedData);
      // If it has the expected structure, it might be plaintext
      if (parsed.user && parsed.token && parsed.expiresAt) {
        console.warn('Found unencrypted session data, migrating to encrypted storage');
        return parsed;
      }
    } catch {
      // Not plaintext, continue with decryption
    }
    
    const key = await getOrCreateEncryptionKey();
    const combined = new Uint8Array(atob(encryptedData).split('').map(c => c.charCodeAt(0)));
    
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );
    
    return JSON.parse(new TextDecoder().decode(decrypted));
  } catch (err) {
    console.error('Session decryption failed:', err);
    return null;
  }
}

/**
 * Save session to localStorage (encrypted)
 * @param {Object} session - Session data
 */
export async function saveSession(session) {
  const encrypted = await encryptSession(session);
  localStorage.setItem(SESSION_STORAGE_KEY, encrypted);
}

/**
 * Load session from localStorage (decrypted)
 * @returns {Promise<Object|null>} Session data or null
 */
export async function loadSession() {
  const encrypted = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!encrypted) return null;
  return decryptSession(encrypted);
}

/**
 * Clear session from localStorage
 */
export function clearSession() {
  localStorage.removeItem(SESSION_STORAGE_KEY);
}

/**
 * Check if session is valid (not expired)
 * @param {Object} session - Session data
 * @returns {boolean}
 */
export function isSessionValid(session) {
  if (!session || !session.expiresAt) return false;
  return Date.now() < session.expiresAt;
}

/**
 * Migrate existing plaintext sessions to encrypted storage
 * Call this on app initialization
 */
export async function migrateSession() {
  const plaintext = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!plaintext) return;
  
  try {
    const parsed = JSON.parse(plaintext);
    // If it's already an object with expected structure, it's plaintext
    if (parsed.user && parsed.token && parsed.expiresAt) {
      await saveSession(parsed);
      console.log('Session migrated to encrypted storage');
    }
  } catch {
    // Not valid JSON, might already be encrypted
  }
}