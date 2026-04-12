/**
 * Default visible title when `label` is null (`v2/specs/09-ui-components.md` §10.6).
 *
 * @see docs_v2/10-studio-node-ui-json-catalog.md
 */

/**
 * Turn a machine `name` (e.g. `low_pass`, `stepSequencer`) into a short human title.
 * Splits camelCase and kebab/snake segments like the palette catalog.
 */
export function humanizeStudioNodeName(name: string): string {
    const s = name.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[-_]+/g, ' ');
    return s
        .split(/\s+/)
        .filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
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
