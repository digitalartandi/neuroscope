// secure-store.ts / .js – Interface, das zu deinem App-Code passt
export const SecureStore = {
  // speichert beliebige JSON-serialisierbare Daten verschlüsselt
  set: async (key: string, value: unknown) => { /* AES-GCM + IV */ },
  // lädt und entschlüsselt – oder null
  get: async <T = unknown>(key: string): Promise<T | null> => { /* ... */ },
  // entfernt Eintrag
  remove: async (key: string) => { /* ... */ },
};

// migriert evtl. vorhandenen Klartext von legacyKey → key (einmalig & still)
export async function migrateIfNeeded(key: string, legacyKey?: string) {
  // 1) Wenn localStorage[key] bereits im verschlüsselten Format ist → return
  // 2) Falls legacyKey gesetzt und Klartext unter legacyKey existiert:
  //    - JSON parse versuchen (oder als String belassen)
  //    - SecureStore.set(key, daten)
  //    - localStorage.removeItem(legacyKey)
  // 3) Falls Klartext unter key existiert (Altversion) → wie oben verschlüsseln & überschreiben
}
