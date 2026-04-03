import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

interface CoverageItem {
    id: string;
    kind: string;
    name: string;
    source: string;
    docs: string;
    tests: string[];
    scenarios: string[];
}

interface CoverageManifest {
    version: number;
    items: CoverageItem[];
}

const rootDir = process.cwd();

function loadCoverageManifest(): CoverageManifest {
    const raw = readFileSync(resolve(rootDir, 'project/COVERAGE_MANIFEST.json'), 'utf8');
    return JSON.parse(raw) as CoverageManifest;
}

function loadScenarioIds(): Set<string> {
    const matrix = readFileSync(resolve(rootDir, 'project/TEST_MATRIX.md'), 'utf8');
    return new Set(Array.from(matrix.matchAll(/`(F\d{2}-S\d{2})`/g), (match) => match[1]));
}

describe('project coverage manifest', () => {
    it('keeps item ids unique and normalized for editor nodes', () => {
        const manifest = loadCoverageManifest();
        const ids = manifest.items.map((item) => item.id);

        expect(new Set(ids).size).toBe(ids.length);
        for (const item of manifest.items) {
            expect(item.kind).toBe('editor-node');
            expect(item.id).toBe(`editor-node:${item.name}`);
        }
    });

    it('references only files that exist in the repo', () => {
        const manifest = loadCoverageManifest();

        for (const item of manifest.items) {
            expect(existsSync(resolve(rootDir, item.source)), `${item.name} source missing: ${item.source}`).toBe(true);
            expect(existsSync(resolve(rootDir, item.docs)), `${item.name} docs missing: ${item.docs}`).toBe(true);
            for (const testPath of item.tests) {
                expect(existsSync(resolve(rootDir, testPath)), `${item.name} test missing: ${testPath}`).toBe(true);
            }
        }
    });

    it('references only scenario ids declared in the test matrix', () => {
        const manifest = loadCoverageManifest();
        const scenarioIds = loadScenarioIds();

        for (const item of manifest.items) {
            for (const scenarioId of item.scenarios) {
                expect(scenarioIds.has(scenarioId), `${item.name} references unknown scenario ${scenarioId}`).toBe(true);
            }
        }
    });
});
