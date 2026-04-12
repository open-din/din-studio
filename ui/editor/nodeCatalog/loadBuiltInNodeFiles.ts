/// <reference types="vite/client" />
/**
 * Load per-node YAML from `ui/editor/built-in-nodes/**` (category / subcategory folders).
 *
 * @see docs_v2/10-studio-node-ui-json-catalog.md
 */
import { parse as parseYaml } from 'yaml';

import type { RawStudioNodeDefinition } from './definition';

/** Known subcategory folder slugs → palette labels (match legacy monolithic JSON + built-in trees). */
const SUBCATEGORY_SLUG_TO_LABEL: Record<string, string> = {
    generators: 'Generators',
    'envelopes-and-modulation': 'Envelopes and Modulation',
    'filters-and-tone': 'Filters and Tone',
    'gain-mix-and-stereo-dsp': 'Gain, Mix, and Stereo DSP',
    'dynamics-and-nonlinear': 'Dynamics and Nonlinear',
    'time-based-effects': 'Time-Based Effects',
    analysis: 'Analysis',
    interfaces: 'Interfaces',
    values: 'Values',
    transport: 'Transport',
    sequencers: 'Sequencers',
    voice: 'Voice',
    assets: 'Assets',
    buses: 'Buses',
    output: 'Output',
    general: 'General',
};

/**
 * Title-case words from a kebab-case slug (fallback when not in {@link SUBCATEGORY_SLUG_TO_LABEL}).
 */
export function slugToCatalogLabel(slug: string): string {
    return slug
        .split('-')
        .filter((s) => s.length > 0)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
}

/**
 * First-level folder under `built-in-nodes/` → `StudioNodeDefinition.category` display string.
 * `audio` → `AUDIO`; other slugs use title case (`sources` → `Sources`) to match legacy palette names.
 */
export function categorySlugToCategoryLabel(categorySlug: string): string {
    if (categorySlug === 'audio') {
        return 'AUDIO';
    }
    if (categorySlug === 'midi') {
        return 'MIDI';
    }
    return slugToCatalogLabel(categorySlug);
}

/**
 * Second-level folder slug → `StudioNodeDefinition.subcategory`.
 */
export function subcategorySlugToLabel(subcategorySlug: string): string {
    return SUBCATEGORY_SLUG_TO_LABEL[subcategorySlug] ?? slugToCatalogLabel(subcategorySlug);
}

function parseGlobKey(key: string): { categorySlug: string; subcategorySlug: string } | null {
    const normalized = key.replace(/\\/g, '/');
    const marker = 'built-in-nodes/';
    const idx = normalized.indexOf(marker);
    if (idx === -1) {
        return null;
    }
    const rest = normalized.slice(idx + marker.length);
    const parts = rest.split('/').filter(Boolean);
    if (parts.length < 3) {
        return null;
    }
    const fileName = parts[parts.length - 1];
    if (!fileName.endsWith('.yaml') && !fileName.endsWith('.yml')) {
        return null;
    }
    if (fileName.startsWith('_')) {
        return null;
    }
    const categorySlug = parts[0];
    const subcategorySlug = parts[1];
    return { categorySlug, subcategorySlug };
}

function parseYamlToRaw(content: string): unknown {
    return parseYaml(content);
}

/**
 * Eager glob of all built-in node YAML files; parsed into raw definitions with path-derived taxonomy.
 */
export function loadBuiltInNodeRawDefinitions(): RawStudioNodeDefinition[] {
    const rawGlob = import.meta.glob<string>('../built-in-nodes/**/*.yaml', {
        eager: true,
        query: '?raw',
        import: 'default',
    });
    const ymlGlob = import.meta.glob<string>('../built-in-nodes/**/*.yml', {
        eager: true,
        query: '?raw',
        import: 'default',
    });
    const entries = { ...rawGlob, ...ymlGlob };
    const out: RawStudioNodeDefinition[] = [];

    for (const [key, rawTextUnknown] of Object.entries(entries)) {
        const rawText = typeof rawTextUnknown === 'string' ? rawTextUnknown : String(rawTextUnknown);
        const pathInfo = parseGlobKey(key);
        if (!pathInfo) {
            continue;
        }
        const category = categorySlugToCategoryLabel(pathInfo.categorySlug);
        const subcategory = subcategorySlugToLabel(pathInfo.subcategorySlug);
        let parsed: unknown;
        try {
            parsed = parseYamlToRaw(rawText);
        } catch {
            if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
                console.warn('[node catalog] skipped invalid YAML:', key);
            }
            continue;
        }
        if (!parsed || typeof parsed !== 'object') {
            continue;
        }
        const obj = parsed as Record<string, unknown>;
        const merged: RawStudioNodeDefinition = {
            ...obj,
            category,
            subcategory,
        } as RawStudioNodeDefinition;

        const fileCategory = obj.category != null ? String(obj.category).trim() : '';
        const fileSub = obj.subcategory != null ? String(obj.subcategory).trim() : '';
        if (fileCategory && fileCategory !== category) {
            if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
                console.warn(
                    `[node catalog] YAML category mismatch for ${key}: file "${fileCategory}" vs path "${category}" (path wins)`,
                );
            }
        }
        if (fileSub && fileSub !== subcategory) {
            if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
                console.warn(
                    `[node catalog] YAML subcategory mismatch for ${key}: file "${fileSub}" vs path "${subcategory}" (path wins)`,
                );
            }
        }

        out.push(merged);
    }

    return out;
}
