import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function readJson(rel) {
    const raw = fs.readFileSync(path.join(root, rel), 'utf8');
    return JSON.parse(raw);
}

function loadScenarioIds() {
    const matrix = fs.readFileSync(path.join(root, 'project/TEST_MATRIX.md'), 'utf8');
    return new Set(Array.from(matrix.matchAll(/`(F\d{2}-S\d{2})`/g), (m) => m[1]));
}

const errors = [];
const scenarioIds = loadScenarioIds();

for (const [label, rel, kindCheck] of [
    ['COVERAGE', 'project/COVERAGE_MANIFEST.json', 'editor-node'],
    ['SURFACE', 'project/SURFACE_MANIFEST.json', null],
]) {
    const manifest = readJson(rel);
    if (!Array.isArray(manifest.items)) {
        errors.push(`${rel}: "items" must be an array`);
        continue;
    }
    const ids = new Set();
    for (const item of manifest.items) {
        if (ids.has(item.id)) {
            errors.push(`${rel}: duplicate id ${item.id}`);
        }
        ids.add(item.id);

        if (kindCheck && item.kind !== kindCheck) {
            errors.push(`${rel}: ${item.id} expected kind "${kindCheck}", got "${item.kind}"`);
        }

        if (item.kind === 'editor-node') {
            if (item.id !== `editor-node:${item.name}`) {
                errors.push(`${rel}: ${item.id} id must be editor-node:${item.name}`);
            }
        } else if (item.kind === 'studio-surface') {
            if (item.id !== `surface:${item.name}`) {
                errors.push(`${rel}: ${item.id} id must be surface:${item.name}`);
            }
        } else if (item.kind === 'mcp-target') {
            if (item.id !== `mcp-target:${item.name}`) {
                errors.push(`${rel}: ${item.id} id must be mcp-target:${item.name}`);
            }
        }

        const files = [item.source, item.docs, ...(item.tests ?? [])];
        for (const f of files) {
            if (!fs.existsSync(path.join(root, f))) {
                errors.push(`${item.id}: missing ${f}`);
            }
        }

        if (!Array.isArray(item.tests) || item.tests.length === 0) {
            errors.push(`${item.id}: tests must list at least one file`);
        }

        for (const sid of item.scenarios ?? []) {
            if (!scenarioIds.has(sid)) {
                errors.push(`${item.id}: unknown scenario ${sid}`);
            }
        }
    }
}

for (const rel of ['project/ROUTE_CARD.json', 'project/EDITOR_NODE_SLICES.json', 'project/MCP_TOOL_SLICES.json']) {
    if (!fs.existsSync(path.join(root, rel))) {
        errors.push(`missing ${rel}`);
    }
}

if (errors.length) {
    console.error(errors.join('\n'));
    process.exit(1);
}

console.log('Manifests OK');
