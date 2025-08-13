// src/secure-store.js
// AES-GCM Verschlüsselung für lokale Speicherung (localStorage) mit Schlüssel in IndexedDB.
// Reines JavaScript (kein TypeScript), SSR-sicher (keine window/crypto-Nutzung auf Top-Level).

const DB_NAME = "secure-store";
const STORE = "keys";
const KEY_ID = "master_v1";

// --- kleine Utils ---
function toB64(u8) {
  let bin = "";
  for (let i = 0; i < u8.length; i++) bin += String.fromCharCode(u8[i]);
  return btoa(bin);
}
function fromB64(b64) {
  const bin = atob(b64);
  const u8 = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  return u8;
}
function isBrowserCryptoAvailable() {
  return typeof window !== "undefined" && window.crypto && window.crypto.subtle;
}

// IndexedDB öffnen (bei Safari Private Mode kann das fehlschlagen)
function getDB() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      return reject(new Error("IndexedDB not available"));
    }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE);
    };
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
async function idbDel(key) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error("IDB delete failed"));
  });
}

// Schlüsselverwaltung: Keymaterial in IDB als RAW-Bytes speichern (AES-256)
let inMemoryKeyRaw = null; // Fallback, wenn IDB nicht verfügbar ist
async function loadOrCreateKey() {
  if (!isBrowserCryptoAvailable()) {
    throw new Error("WebCrypto not available");
  }
  // 1) aus IDB lesen (oder Fallback aus Memory)
  let raw = null;
  try {
    raw = await idbGet(KEY_ID);
  } catch {
    raw = inMemoryKeyRaw;
  }

  // 2) wenn nicht vorhanden → erzeugen
  if (!raw) {
    const key = await crypto.subtle.generateKey(
      { name: "AES-GCM", length: 256 },
      true, // extractable (wir speichern RAW in IDB)
      ["encrypt", "decrypt"]
    );
    const rawBuf = await crypto.subtle.exportKey("raw", key);
    raw = new Uint8Array(rawBuf);
    try {
      await idbPut(KEY_ID, raw);
    } catch {
      // Fallback: im Speicher halten (geht verloren wenn Tab schließt)
      inMemoryKeyRaw = raw;
    }
  }

  // 3) in CryptoKey importieren
  return crypto.subtle.importKey(
    "raw",
    raw,
    { name: "AES-GCM" },
    false, // nicht nochmal exportieren müssen
    ["encrypt", "decrypt"]
  );
}

// --- Öffentliche API ---
export const SecureStore = {
  async set(key, value) {
    if (!isBrowserCryptoAvailable()) {
      // Fallback: wenn keine Krypto verfügbar, NICHT im Klartext speichern.
      // Stattdessen still ignorieren oder (optional) throwen.
      throw new Error("SecureStore unavailable (no WebCrypto)");
    }
    const k = await loadOrCreateKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const data = new TextEncoder().encode(JSON.stringify(value));

    // Optionaler Kontext (AAD) – hilft, Format/Version zu binden
    const aad = new TextEncoder().encode("app:v1|type:answers");

    const cipherBuf = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv, additionalData: aad },
      k,
      data
    );
    const payload = {
      v: 1,
      iv: toB64(iv),
      c: toB64(new Uint8Array(cipherBuf)),
    };
    localStorage.setItem(key, JSON.stringify(payload));
  },

  async get(key) {
    if (!isBrowserCryptoAvailable()) return null;
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    // Erkennen, ob bereits verschlüsselt (unser Format)
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // kein JSON → nicht unser Format
      return null;
    }
    if (!parsed || parsed.v !== 1 || !parsed.iv || !parsed.c) {
      // nicht unser Format (evtl. Klartext alt) → null zurück, Migration übernimmt das
      return null;
    }

    try {
      const k = await loadOrCreateKey();
      const iv = fromB64(parsed.iv);
      const cipher = fromB64(parsed.c);
      const aad = new TextEncoder().encode("app:v1|type:answers");

      const plainBuf = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv, additionalData: aad },
        k,
        cipher
      );
      const txt = new TextDecoder().decode(plainBuf);
      return JSON.parse(txt);
    } catch (e) {
      // manipulierter/defekter Payload → löschen, um Folgefehler zu vermeiden
      try { localStorage.removeItem(key); } catch {}
      return null;
    }
  },

  async remove(key) {
    try { localStorage.removeItem(key); } catch {}
  },
};

// Stille Migration von evtl. vorhandenem Klartext (legacyKey → key)
export async function migrateIfNeeded(key, legacyKey) {
  // Bereits verschlüsselt?
  try {
    const maybeEnc = localStorage.getItem(key);
    if (maybeEnc) {
      const p = JSON.parse(maybeEnc);
      if (p && p.v === 1 && p.iv && p.c) return; // nichts zu tun
    }
  } catch {
    // ignorieren, wir migrieren unten
  }

  // Quelle wählen: bevorzugt legacyKey, sonst key
  let sourceKey = null;
  if (legacyKey && localStorage.getItem(legacyKey) != null) sourceKey = legacyKey;
  else if (localStorage.getItem(key) != null) sourceKey = key;

  if (!sourceKey) return; // nichts da

  let data;
  const raw = localStorage.getItem(sourceKey);
  try {
    data = JSON.parse(raw);
  } catch {
    // falls kein JSON, als String speichern
    data = raw;
  }

  try {
    await SecureStore.set(key, data);
    if (legacyKey && sourceKey === legacyKey) {
      localStorage.removeItem(legacyKey);
    } else if (sourceKey === key) {
      // wir haben Klartext unter key überschrieben; ok
    }
  } catch {
    // Wenn Krypto nicht verfügbar ist, lassen wir die Daten lieber unberührt
  }
}
