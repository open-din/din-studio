import type { ProjectManifest } from '../../project/types';
import { loadProjectRagTextSources } from '../../project/repository';
import { chunkText, parseFileToPlainText } from './chunker';
import { createEmbedding } from './embeddings';
import type { VectorRecord } from './vectorStore';
import {
    connectVectorStore,
    deleteByFilename,
    getAllChunks,
    getFirstByContentHash,
    putChunk,
} from './vectorStore';
import { debounce, searchSimilar } from './search';

export function fnv1aHex(str: string): string {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 0x01000193);
    }
    return (h >>> 0).toString(16);
}

export function extname(name: string): string {
    const m = /\.[^./\\]+$/i.exec(name);
    return m ? m[0].toLowerCase() : '';
}

export function readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const fr = new FileReader();
        fr.onload = () => resolve(typeof fr.result === 'string' ? fr.result : '');
        fr.onerror = () => reject(fr.error ?? new Error('FileReader failed'));
        fr.readAsText(file);
    });
}

const ALLOWED_EXT = new Set(['.md', '.txt', '.json']);

export interface IndexFilesOptions {
    onStatus?: (s: string) => void;
    maxFileBytes?: number;
}

/** Virtual file for the shared indexing pipeline (uploaded files or project-folder paths). */
export interface NamedTextSource {
    name: string;
    byteSize?: number;
    readText: () => Promise<string>;
}

export async function indexNamedTextSources(
    sources: NamedTextSource[],
    apiKey: string,
    opts: IndexFilesOptions = {},
): Promise<{ chunkCount: number; totalInStore: number }> {
    const { onStatus = () => {}, maxFileBytes = 5 * 1024 * 1024 } = opts;
    const db = await connectVectorStore();
    let totalChunks = 0;

    for (const source of sources) {
        const ext = extname(source.name);
        if (!ALLOWED_EXT.has(ext)) {
            onStatus(`skip ${source.name} (use .md, .txt, .json)`);
            continue;
        }
        if (source.byteSize !== undefined && source.byteSize > maxFileBytes) {
            onStatus(`skip ${source.name} (>${Math.round(maxFileBytes / 1024)} KiB limit)`);
            continue;
        }

        onStatus(`indexing ${source.name}…`);
        await deleteByFilename(db, source.name);

        const raw = await source.readText();
        const approxBytes = source.byteSize ?? new Blob([raw]).size;
        if (approxBytes > maxFileBytes) {
            onStatus(`skip ${source.name} (>${Math.round(maxFileBytes / 1024)} KiB limit)`);
            continue;
        }

        const plain = parseFileToPlainText(raw, ext);
        const parts = chunkText(plain);

        let i = 0;
        for (const chunk of parts) {
            const contentHash = fnv1aHex(chunk);
            const id = `${source.name}::${i}::${contentHash}`;

            const reuse = await getFirstByContentHash(db, contentHash);
            const embedding: number[] =
                reuse && Array.isArray(reuse.embedding)
                    ? reuse.embedding
                    : await createEmbedding(chunk, apiKey);

            const record: VectorRecord = {
                id,
                text: chunk,
                embedding,
                metadata: { filename: source.name, contentHash },
            };
            await putChunk(db, record);
            i += 1;
            totalChunks += 1;
        }
    }

    const all = await getAllChunks(db);
    onStatus('done');
    return { chunkCount: totalChunks, totalInStore: all.length };
}

export async function indexFiles(
    files: File[],
    apiKey: string,
    opts: IndexFilesOptions = {},
): Promise<{ chunkCount: number; totalInStore: number }> {
    const sources: NamedTextSource[] = files.map((file) => ({
        name: file.name,
        byteSize: file.size,
        readText: () => readFileAsText(file),
    }));
    return indexNamedTextSources(sources, apiKey, opts);
}

/**
 * Indexes all `.md` / `.txt` / `.json` files under the project directory
 * (`browser-fs-handle` or `electron-fs`). No-op for `browser-indexeddb` (empty source list).
 */
export async function indexProjectDocuments(
    project: ProjectManifest,
    apiKey: string,
    opts: IndexFilesOptions = {},
): Promise<{ chunkCount: number; totalInStore: number }> {
    const { onStatus = () => {} } = opts;
    const ragSources = await loadProjectRagTextSources(project);
    if (ragSources.length === 0) {
        if (project.storageKind === 'browser-indexeddb') {
            onStatus('RAG: IndexedDB projects have no folder; upload files instead.');
        } else {
            onStatus('RAG: no .md/.txt/.json files found in project folder.');
        }
        const db = await connectVectorStore();
        const all = await getAllChunks(db);
        return { chunkCount: 0, totalInStore: all.length };
    }

    const sources: NamedTextSource[] = ragSources.map((s) => ({
        name: s.sourceId,
        byteSize: s.byteSize,
        readText: s.readText,
    }));
    return indexNamedTextSources(sources, apiKey, opts);
}

export interface RetrieveContextOptions {
    apiKey: string;
    topK?: number;
    db?: IDBDatabase;
}

export async function retrieveContext(userQuery: string, opts: RetrieveContextOptions): Promise<string> {
    const { apiKey, topK = 5, db: dbIn } = opts;
    if (!apiKey) {
        throw new Error('retrieveContext: options.apiKey is required');
    }

    const q = (userQuery ?? '').trim();
    if (!q) {
        return '';
    }

    const db = dbIn ?? (await connectVectorStore());
    const all = await getAllChunks(db);
    if (all.length === 0) {
        return '';
    }

    const queryEmbedding = await createEmbedding(q, apiKey);
    const top = searchSimilar(queryEmbedding, all, topK);
    return top.map((t) => t.text).join('\n\n---\n\n');
}

export function createRetrieveContextDebounced(
    waitMs = 320,
): (query: string, opts: RetrieveContextOptions) => Promise<string> {
    return debounce(
        (query: string, opts: RetrieveContextOptions) => retrieveContext(query, opts),
        waitMs,
    );
}
