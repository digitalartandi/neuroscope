// src/secure-store.js
// AES-GCM Verschlüsselung für lokale Speicherung (localStorage) mit Schlüssel in IndexedDB.
// Reines JavaScript (kein TypeScript), SSR-sicher.

const DB_NAME = "secure-store";
const STORE = "keys";
const KEY_ID = "master_v1";

function toB64(u8) {
  let s = "";
  for (let i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]);
  return btoa(s);
}
function fromB64(b64) {
  const s = atob(b64);
  const u8 = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) u8[i] = s.charCodeAt(i);
  return u8;
}
function isBrowserCryptoAvailable() {
  return typeof window !== "undefined" && window.crypto && window.crypto.subtle;
}

function getDB() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") return reject(new Error("IndexedDB not available"));
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => { req.result.createObjectStore(STORE); };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error("IDB open failed"));
  });
}
async function idbGet(key) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const get = tx.objectStore(STORE).get(key);
    get.onsuccess = () => resolve(get.result ?? null);
    get.onerror = () => reject(get.error || new Error("IDB get failed"));
  });
}
async function idbPut(key, value) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error("IDB put failed"));
  });
}

let inMemoryKeyRaw = null; // Fallback wenn IDB nicht verfügbar ist
async function loadOrCreateKey() {
  if (!isBrowserCryptoAvailable()) throw new Error("WebCrypto not available");

  let raw = null;
  try { raw = await idbGet(KEY_ID); } catch { raw = inMemoryKeyRaw; }

  if (!raw) {
    const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
    const rawBuf = await crypto.subtle.exportKey("raw", key);
    raw = new Uint8Array(rawBuf);
    try { await idbPut(KEY_ID, raw); } catch { inMemoryKeyRaw = raw; }
  }

  return crypto.subtle.importKey("raw", raw, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

export const SecureStore = {
  async set(key, value) {
    if (!isBrowserCryptoAvailable()) throw new Error("SecureStore unavailable (no WebCrypto)");
    const k = await loadOrCreateKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const data = new TextEncoder().encode(JSON.stringify(value));
    const aad = new TextEncoder().encode("app:v1|type:answers");
    const cipherBuf = await crypto.subtle.encrypt({ name: "AES-GCM", iv, additionalData: aad }, k, data);
    const payload = { v: 1, iv: toB64(iv), c: toB64(new Uint8Array(cipherBuf)) };
    localStorage.setItem(key, JSON.stringify(payload));
  },
  async get(key) {
    if (!isBrowserCryptoAvailable()) return null;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    let parsed;
    try { parsed = JSON.parse(raw); } catch { return null; }
    if (!parsed || parsed.v !== 1 || !parsed.iv || !parsed.c) return null;

    try {
      const k = await loadOrCreateKey();
      const iv = fromB64(parsed.iv);
      const cipher = fromB64(parsed.c);
      const aad = new TextEncoder().encode("app:v1|type:answers");
      const plainBuf = await crypto.subtle.decrypt({ name: "AES-GCM", iv, additionalData: aad }, k, cipher);
      return JSON.parse(new TextDecoder().decode(plainBuf));
    } catch {
      try { localStorage.removeItem(key); } catch {}
      return null;
    }
  },
  async remove(key) {
    try { localStorage.removeItem(key); } catch {}
  },
};

export async function migrateIfNeeded(key, legacyKey) {
  try {
    const maybeEnc = localStorage.getItem(key);
    if (maybeEnc) {
      const p = JSON.parse(maybeEnc);
      if (p && p.v === 1 && p.iv && p.c) return; // schon verschlüsselt
    }
  } catch {}
  let sourceKey = null;
  if (legacyKey && localStorage.getItem(legacyKey) != null) sourceKey = legacyKey;
  else if (localStorage.getItem(key) != null) sourceKey = key;
  if (!sourceKey) return;

  const raw = localStorage.getItem(sourceKey);
  let data;
  try { data = JSON.parse(raw); } catch { data = raw; }

  try {
    await SecureStore.set(key, data);
    if (legacyKey && sourceKey === legacyKey) localStorage.removeItem(legacyKey);
  } catch {
    // Wenn Krypto nicht verfügbar ist, lassen wir die Daten lieber unberührt
  }
}
