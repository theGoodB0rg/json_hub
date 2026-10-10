/**
 * IndexedDB-backed event queue.
 *
 * Why not localStorage:
 * - localStorage is synchronous (blocks main thread on every write)
 * - 5 MB total per origin shared with the whole app
 * - Serialized string manipulation per item
 * - No atomic operations across multiple items (race conditions on flush)
 *
 * IndexedDB gives us:
 * - Multi-megabyte quota per origin (hundreds of MB in practice)
 * - Atomic transactions across multiple records
 * - Native binary storage (Uint8Array doesn't round-trip through JSON)
 * - Non-blocking async operations
 *
 * The queue is append-only; the orchestrator pops batches, attempts
 * delivery, and the caller deletes the keys of delivered events. If the
 * tab crashes mid-flush, undelivered events remain for the next page load.
 */

const DB_NAME = 'jsonexport_telemetry';
const DB_VERSION = 1;
const STORE_NAME = 'queue';
const MAX_QUEUE_SIZE = 500; // Hard cap — drops oldest when exceeded.

export interface QueuedEvent {
    key?: number;      // auto-incrementing primary key (set after insert)
    body: Uint8Array;  // the serialized payload the transport will send
    contentType: string;
    endpoint: string;
    createdAt: number;
    attempts: number;
}

function isAvailable(): boolean {
    try {
        return typeof indexedDB !== 'undefined' && indexedDB !== null;
    } catch {
        return false;
    }
}

function openDb(): Promise<IDBDatabase | null> {
    if (!isAvailable()) return Promise.resolve(null);
    return new Promise((resolve) => {
        try {
            const req = indexedDB.open(DB_NAME, DB_VERSION);
            req.onupgradeneeded = () => {
                const db = req.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: 'key', autoIncrement: true });
                }
            };
            req.onsuccess = () => resolve(req.result);
            // Private browsing, quota exceeded, Firefox-with-storage-blocked
            // all land here. The caller must handle a null db gracefully.
            req.onerror = () => resolve(null);
            req.onblocked = () => resolve(null);
        } catch {
            resolve(null);
        }
    });
}

export async function enqueue(event: Omit<QueuedEvent, 'key'>): Promise<number | null> {
    const db = await openDb();
    if (!db) return null;
    return new Promise((resolve) => {
        try {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const req = store.add(event);
            req.onsuccess = () => resolve(req.result as number);
            req.onerror = () => resolve(null);
            tx.oncomplete = () => db.close();
            tx.onerror = () => db.close();
        } catch {
            try { db.close(); } catch { /* noop */ }
            resolve(null);
        }
    });
}

export async function peek(limit = 20): Promise<QueuedEvent[]> {
    const db = await openDb();
    if (!db) return [];
    return new Promise((resolve) => {
        try {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const req = store.getAll(null, limit);
            req.onsuccess = () => resolve((req.result as QueuedEvent[]) || []);
            req.onerror = () => resolve([]);
            tx.oncomplete = () => db.close();
        } catch {
            try { db.close(); } catch { /* noop */ }
            resolve([]);
        }
    });
}

export async function remove(keys: number[]): Promise<void> {
    if (keys.length === 0) return;
    const db = await openDb();
    if (!db) return;
    return new Promise((resolve) => {
        try {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            for (const k of keys) store.delete(k);
            tx.oncomplete = () => { db.close(); resolve(); };
            tx.onerror = () => { db.close(); resolve(); };
        } catch {
            try { db.close(); } catch { /* noop */ }
            resolve();
        }
    });
}

export async function markAttempt(keys: number[]): Promise<void> {
    if (keys.length === 0) return;
    const db = await openDb();
    if (!db) return;
    return new Promise((resolve) => {
        try {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const req = store.openCursor();
            req.onsuccess = () => {
                const cursor = req.result;
                if (!cursor) return;
                const key = (cursor.value as QueuedEvent).key;
                if (key !== undefined && keys.includes(key)) {
                    const updated = { ...cursor.value, attempts: (cursor.value.attempts || 0) + 1 };
                    cursor.update(updated);
                }
                cursor.continue();
            };
            tx.oncomplete = () => { db.close(); resolve(); };
            tx.onerror = () => { db.close(); resolve(); };
        } catch {
            try { db.close(); } catch { /* noop */ }
            resolve();
        }
    });
}

export async function count(): Promise<number> {
    const db = await openDb();
    if (!db) return 0;
    return new Promise((resolve) => {
        try {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const req = tx.objectStore(STORE_NAME).count();
            req.onsuccess = () => resolve(req.result || 0);
            req.onerror = () => resolve(0);
            tx.oncomplete = () => db.close();
        } catch {
            try { db.close(); } catch { /* noop */ }
            resolve(0);
        }
    });
}

/**
 * Enforce the hard queue cap by removing the oldest records above the limit.
 * Called opportunistically after enqueues to avoid unbounded growth when
 * every transport fails for a long stretch.
 */
export async function trimToMax(): Promise<number> {
    const db = await openDb();
    if (!db) return 0;
    return new Promise((resolve) => {
        try {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const countReq = store.count();
            countReq.onsuccess = () => {
                const total = countReq.result;
                const excess = total - MAX_QUEUE_SIZE;
                if (excess <= 0) { tx.oncomplete = () => { db.close(); resolve(0); }; return; }
                // Delete the lowest keys (oldest first — auto-increment is monotonic).
                let removed = 0;
                const openReq = store.openCursor();
                openReq.onsuccess = () => {
                    const cursor = openReq.result;
                    if (!cursor || removed >= excess) return;
                    cursor.delete();
                    removed++;
                    cursor.continue();
                };
                tx.oncomplete = () => { db.close(); resolve(removed); };
            };
            tx.onerror = () => { db.close(); resolve(0); };
        } catch {
            try { db.close(); } catch { /* noop */ }
            resolve(0);
        }
    });
}
