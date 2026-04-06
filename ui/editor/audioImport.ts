/**
 * Helpers for bulk / folder audio import (browser file picker and File System Access API).
 */

/** Case-insensitive match on file basename */
export const AUDIO_FILE_EXTENSION_RE =
    /\.(wav|mp3|m4a|aac|ogg|oga|opus|flac|webm|aiff?|caf|wma|mp4|mpeg|mpg)$/i;

export function isLikelyAudioFile(file: File): boolean {
    if (file.type.startsWith('audio/')) return true;
    if (file.type === 'application/ogg') return true;
    if (!file.type || file.type === 'application/octet-stream') {
        return AUDIO_FILE_EXTENSION_RE.test(file.name);
    }
    return false;
}

async function walkDirectoryForAudioFiles(
    dir: FileSystemDirectoryHandle,
    accumulator: File[],
): Promise<void> {
    for await (const entry of dir.values()) {
        const name = entry.name;
        if (entry.kind === 'directory') {
            if (name === 'node_modules' || name === '.git') continue;
            const sub = await dir.getDirectoryHandle(name);
            await walkDirectoryForAudioFiles(sub, accumulator);
        } else if (entry.kind === 'file' && AUDIO_FILE_EXTENSION_RE.test(name)) {
            const fh = await dir.getFileHandle(name);
            const file = await fh.getFile();
            if (isLikelyAudioFile(file)) {
                accumulator.push(file);
            }
        }
    }
}

export async function collectAudioFilesFromDirectoryHandle(
    root: FileSystemDirectoryHandle,
): Promise<File[]> {
    const out: File[] = [];
    await walkDirectoryForAudioFiles(root, out);
    return out;
}

type ShowDirectoryPickerFn = (options?: { mode?: 'read' | 'readwrite' }) => Promise<FileSystemDirectoryHandle>;

/**
 * Uses `showDirectoryPicker` (read-only) when available, then walks the tree for audio extensions.
 * @returns `unsupported` — use a fallback `<input webkitdirectory>`; `cancelled` — user dismissed the dialog; or file list (possibly empty).
 */
export async function pickAudioFilesFromNativeDirectory(): Promise<'unsupported' | 'cancelled' | File[]> {
    const picker = (globalThis as unknown as { showDirectoryPicker?: ShowDirectoryPickerFn }).showDirectoryPicker;
    if (typeof picker !== 'function') {
        return 'unsupported';
    }
    try {
        const handle = await picker({ mode: 'read' });
        return await collectAudioFilesFromDirectoryHandle(handle);
    } catch {
        return 'cancelled';
    }
}
