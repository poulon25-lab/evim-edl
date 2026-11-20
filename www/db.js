// Stockage local (IndexedDB) : biens, états des lieux, photos, réglages
const DB = (() => {
  let dbp = null;
  function open() {
    if (dbp) return dbp;
    dbp = new Promise((res, rej) => {
      const r = indexedDB.open('edl-ia', 1);
      r.onupgradeneeded = () => {
        const d = r.result;
        d.createObjectStore('biens', { keyPath: 'id' });
        d.createObjectStore('edls', { keyPath: 'id' });
        d.createObjectStore('photos', { keyPath: 'id' });
        d.createObjectStore('kv', { keyPath: 'k' });
      };
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
    return dbp;
  }
  async function tx(store, mode, fn) {
    const d = await open();
    return new Promise((res, rej) => {
      const t = d.transaction(store, mode);
      const s = t.objectStore(store);
      const out = fn(s);
      t.oncomplete = () => res(out instanceof IDBRequest ? out.result : out);
      t.onerror = () => rej(t.error);
    });
  }
  return {
    uid: () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    put: (store, obj) => tx(store, 'readwrite', s => s.put(obj)),
    get: (store, id) => tx(store, 'readonly', s => s.get(id)),
    del: (store, id) => tx(store, 'readwrite', s => s.delete(id)),
    all: (store) => tx(store, 'readonly', s => s.getAll()),
    async getSetting(k, def) { const r = await this.get('kv', k); return r ? r.v : def; },
    setSetting(k, v) { return this.put('kv', { k, v }); },
  };
})();
