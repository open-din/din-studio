const DB_NAME = 'din-studio-rag';
const DB_VERSION = 1;
const STORE = 'chunks';

export interface ChunkMetadata {
    filename: string;
    contentHash: string;
}

export interface VectorRecord {
    id: string;
    text: string;
    embedding: number[];
    metadata: ChunkMetadata;
}

function openDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onerror = () => reject(req.error ?? new Error('IDB open failed'));
        req.onsuccess = () => resolve(req.result);
        req.onupgradeneeded = (ev) => {
            const db = (ev.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE)) {
                const os = db.createObjectStore(STORE, { keyPath: 'id' });
                os.createIndex('contentHash', 'metadata.contentHash', { unique: false });
                os.createIndex('filename', 'metadata.filename', { unique: false });
            }
        };
    });
}

export async function getAllChunks(db: IDBDatabase): Promise<VectorRecord[]> {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readonly');
        const os = tx.objectStore(STORE);
        const req = os.getAll();
        req.onerror = () => reject(req.error ?? new Error('getAll failed'));
        req.onsuccess = () => resolve((req.result as VectorRecord[]) ?? []);
    });
}

export async function getFirstByContentHash(
    db: IDBDatabase,
    contentHash: string,
): Promise<VectorRecord | undefined> {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readonly');
        const idx = tx.objectStore(STORE).index('contentHash');
        const req = idx.openCursor(IDBKeyRange.only(contentHash));
        req.onerror = () => reject(req.error ?? new Error('getFirstByContentHash failed'));
        req.onsuccess = () => {
            const cursor = req.result;
            resolve(cursor ? (cursor.value as VectorRecord) : undefined);
        };
    });
}

export async function putChunk(db: IDBDatabase, record: VectorRecord): Promise<void> {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite');
        const req = tx.objectStore(STORE).put(record);
        req.onerror = () => reject(req.error ?? new Error('put failed'));
        req.onsuccess = () => resolve();
    });
}

export async function deleteByFilename(db: IDBDatabase, filename: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite');
        const os = tx.objectStore(STORE);
        const idx = os.index('filename');
        const range = IDBKeyRange.only(filename);
        const req = idx.openCursor(range);
        req.onerror = () => reject(req.error ?? new Error('deleteByFilename failed'));
        req.onsuccess = () => {
            const cursor = req.result;
            if (cursor) {
                cursor.delete();
                cursor.continue();
            }
        };
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error ?? new Error('tx failed'));
    });
}

export async function connectVectorStore(): Promise<IDBDatabase> {
    return openDb();
}

export { DB_NAME, STORE };
