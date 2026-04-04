/**
 * Chromium exposes async iteration on directory handles; `lib.dom` may lag behind.
 */
interface FileSystemDirectoryHandle {
    values(): AsyncIterableIterator<FileSystemHandle>;
}
