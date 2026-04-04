/**
 * Node can expose a non-API global `localStorage` (empty object without getItem/setItem). Vitest jsdom reuses it for
 * `window.localStorage`, and Vitest `node` tests still hit `globalThis.localStorage`. Replace with a minimal Storage.
 */
export function installMemoryLocalStorage(): void {
    const store = new Map<string, string>();
    const memory: Storage = {
        get length() {
            return store.size;
        },
        clear() {
            store.clear();
        },
        getItem(key: string) {
            return store.has(key) ? store.get(key)! : null;
        },
        key(index: number) {
            const keys = Array.from(store.keys());
            return index >= 0 && index < keys.length ? keys[index]! : null;
        },
        removeItem(key: string) {
            store.delete(key);
        },
        setItem(key: string, value: string) {
            store.set(String(key), String(value));
        },
    } as Storage;

    Object.defineProperty(globalThis, 'localStorage', {
        value: memory,
        configurable: true,
        writable: true,
    });
}
