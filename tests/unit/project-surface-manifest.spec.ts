import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

interface SurfaceItem {
    id: string;
    kind: string;
    name: string;
    source: string;
    docs: string;
    tests: string[];
    scenarios: string[];
}

interface SurfaceManifest {
    version: number;
    items: SurfaceItem[];
}

const rootDir = process.cwd();

function loadSurfaceManifest(): SurfaceManifest {
    const raw = readFileSync(resolve(rootDir, 'project/SURFACE_MANIFEST.json'), 'utf8');
    return JSON.parse(raw) as SurfaceManifest;
}

function loadScenarioIds(): Set<string> {
    const matrix = readFileSync(resolve(rootDir, 'project/TEST_MATRIX.md'), 'utf8');
    return new Set(Array.from(matrix.matchAll(/`(F\d{2}-S\d{2})`/g), (match) => match[1]));
}

describe('project surface manifest', () => {
    it('keeps item ids unique and normalized', () => {
        const manifest = loadSurfaceManifest();
        const ids = manifest.items.map((item) => item.id);

        expect(new Set(ids).size).toBe(ids.length);
        for (const item of manifest.items) {
            if (item.kind === 'studio-surface') {
                expect(item.id).toBe(`surface:${item.name}`);
            } else if (item.kind === 'mcp-target') {
                expect(item.id).toBe(`mcp-target:${item.name}`);
            } else {
                throw new Error(`Unexpected kind ${item.kind}`);
            }
        }
    });

    it('references only files that exist in the repo', () => {
        const manifest = loadSurfaceManifest();

        for (const item of manifest.items) {
            expect(existsSync(resolve(rootDir, item.source)), `${item.name} source missing: ${item.source}`).toBe(true);
            expect(existsSync(resolve(rootDir, item.docs)), `${item.name} docs missing: ${item.docs}`).toBe(true);
            for (const testPath of item.tests) {
                expect(existsSync(resolve(rootDir, testPath)), `${item.name} test missing: ${testPath}`).toBe(true);
            }
        }
    });

    it('references only scenario ids declared in the test matrix', () => {
        const manifest = loadSurfaceManifest();
        const scenarioIds = loadScenarioIds();

        for (const item of manifest.items) {
            for (const scenarioId of item.scenarios) {
                expect(scenarioIds.has(scenarioId), `${item.name} references unknown scenario ${scenarioId}`).toBe(true);
            }
        }
    });
});
