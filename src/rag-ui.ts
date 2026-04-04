import type { ProjectManifest } from '../project/types';
import { createRetrieveContextDebounced, indexFiles, indexProjectDocuments } from './rag/retrieve';
import type { IndexFilesOptions } from './rag/retrieve';

export const DEFAULT_MAX_BYTES = 5 * 1024 * 1024;

export interface CreateRagUiOptions {
    getApiKey?: () => string | null | undefined;
    /** When set, shows “Index project folder” (uses `browser-fs-handle` / `electron-fs` roots). */
    getActiveProject?: () => ProjectManifest | null | undefined;
    maxFileBytes?: number;
    searchDebounceMs?: number;
}

export interface RagUiHandle {
    getChunkCount: () => number;
    getTotalInStore: () => number;
    searchDebounced: (query: string) => Promise<string>;
    setStatus: (t: string) => void;
}

export function createRagUi(host: HTMLElement, options: CreateRagUiOptions = {}): RagUiHandle {
    const {
        getApiKey = () => null,
        getActiveProject,
        maxFileBytes = DEFAULT_MAX_BYTES,
        searchDebounceMs = 320,
    } = options;

    const projectRow = getActiveProject
        ? '<button type="button" class="din-rag-index-project">Index project folder</button>'
        : '';

    host.innerHTML = `
<div class="din-rag-ui" style="font:12px system-ui,sans-serif;display:flex;flex-direction:column;gap:8px">
  <label style="display:flex;flex-direction:column;gap:4px">
    <span>Local specs (.md, .txt, .json)</span>
    <input type="file" class="din-rag-files" multiple accept=".md,.txt,.json,text/markdown,text/plain,application/json" />
  </label>
  <button type="button" class="din-rag-index" disabled>Index files</button>
  ${projectRow}
  <div>Chunks (last run): <span class="din-rag-chunks-last">0</span> · in store: <span class="din-rag-chunks-total">0</span></div>
  <div class="din-rag-status" style="opacity:0.85">idle</div>
</div>`;

    const fileInput = host.querySelector<HTMLInputElement>('.din-rag-files');
    const indexBtn = host.querySelector<HTMLButtonElement>('.din-rag-index');
    const projectBtn = host.querySelector<HTMLButtonElement>('.din-rag-index-project');
    const lastEl = host.querySelector<HTMLSpanElement>('.din-rag-chunks-last');
    const totalEl = host.querySelector<HTMLSpanElement>('.din-rag-chunks-total');
    const statusEl = host.querySelector<HTMLDivElement>('.din-rag-status');

    if (!fileInput || !indexBtn || !lastEl || !totalEl || !statusEl) {
        throw new Error('createRagUi: failed to build template');
    }

    let lastChunkCount = 0;
    let totalInStore = 0;

    const setStatus = (t: string) => {
        statusEl.textContent = t;
    };

    const applyIndexResult = (result: { chunkCount: number; totalInStore: number }) => {
        lastChunkCount = result.chunkCount;
        totalInStore = result.totalInStore;
        lastEl.textContent = String(lastChunkCount);
        totalEl.textContent = String(totalInStore);
    };

    const indexOptsBase: IndexFilesOptions = {
        onStatus: setStatus,
        maxFileBytes,
    };

    const retrieveDebounced = createRetrieveContextDebounced(searchDebounceMs);

    fileInput.addEventListener('change', () => {
        indexBtn.disabled = !fileInput.files?.length;
    });

    indexBtn.addEventListener('click', async () => {
        const key = getApiKey();
        if (!key) {
            setStatus('API key missing');
            return;
        }
        const files = Array.from(fileInput.files ?? []);
        if (!files.length) return;

        indexBtn.disabled = true;
        if (projectBtn) projectBtn.disabled = true;
        setStatus('indexing…');
        try {
            const result = await indexFiles(files, key, indexOptsBase);
            applyIndexResult(result);
        } catch (e) {
            setStatus(e instanceof Error ? e.message : String(e));
        } finally {
            indexBtn.disabled = !fileInput.files?.length;
            if (projectBtn) projectBtn.disabled = false;
        }
    });

    if (projectBtn && getActiveProject) {
        projectBtn.addEventListener('click', async () => {
            const key = getApiKey();
            if (!key) {
                setStatus('API key missing');
                return;
            }
            const project = getActiveProject();
            if (!project) {
                setStatus('No project open');
                return;
            }

            indexBtn.disabled = true;
            projectBtn.disabled = true;
            setStatus('indexing…');
            try {
                const result = await indexProjectDocuments(project, key, indexOptsBase);
                applyIndexResult(result);
            } catch (e) {
                setStatus(e instanceof Error ? e.message : String(e));
            } finally {
                indexBtn.disabled = !fileInput.files?.length;
                projectBtn.disabled = false;
            }
        });
    }

    return {
        getChunkCount: () => lastChunkCount,
        getTotalInStore: () => totalInStore,
        searchDebounced: (query: string) => {
            const key = getApiKey();
            if (!key) return Promise.reject(new Error('API key missing'));
            return retrieveDebounced(query, { apiKey: key, topK: 5 });
        },
        setStatus,
    };
}
