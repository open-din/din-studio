/**
 * Default visible title when `label` is null (`v2/specs/09-ui-components.md` §10.6).
 *
 * @see docs_v2/10-studio-node-ui-json-catalog.md
 */

/**
 * Turn a machine `name` (e.g. `low_pass`) into a short human title.
 */
export function humanizeStudioNodeName(name: string): string {
    const s = name.trim().replace(/[-_]+/g, ' ');
    return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Palette / canvas title: catalog label wins; otherwise humanized `name`.
 */
export function resolveDefaultStudioTitle(def: { name: string; label: string | null }): string {
    if (def.label !== null && def.label.trim() !== '') {
        return def.label.trim();
    }
    return humanizeStudioNodeName(def.name);
}
