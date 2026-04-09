import { expect, test } from '@playwright/test';
import { createInitialGraphDocument } from '../../ui/editor/defaultGraph';
import { createSeedAsset, createSeedProject, installElectronBridge } from './support/fixtures';

function buildAssetSeed() {
    const asset = createSeedAsset('asset-kick', 'kick.wav', 'sample');
    const project = createSeedProject({
        id: 'asset-lab',
        name: 'Asset Lab',
        assets: [asset],
    });

    return {
        bootstrap: { windowKind: 'project' as const, projectId: project.snapshot.project.id },
        projects: [project],
    };
}

function buildMissingAssetSeed() {
    const graph = createInitialGraphDocument('missing-asset-graph', 'Broken Asset Graph', 0);
    graph.nodes.push({
        id: 'sampler_missing',
        type: 'samplerNode',
        position: { x: 200, y: 340 },
        dragHandle: '.node-header',
        data: {
            type: 'sampler',
            src: '',
            loop: false,
            playbackRate: 1,
            detune: 0,
            loaded: false,
            label: 'Broken Sample',
            sampleId: 'missing-kick',
            assetPath: 'samples/missing-kick.wav',
            fileName: 'missing-kick.wav',
        },
    });

    const project = createSeedProject({
        id: 'missing-assets',
        name: 'Missing Assets',
        graphs: [graph],
        activeGraphId: graph.id,
    });

    return {
        bootstrap: { windowKind: 'project' as const, projectId: project.snapshot.project.id },
        projects: [project],
    };
}

test('F10-S01 asset search and import reduce the visible decision set', async ({ page }) => {
    await installElectronBridge(page, buildAssetSeed());
    await page.goto('/');

    await page.getByTitle('Library').click();
    await page.getByLabel('Search library files').fill('kick');
    await expect(page.getByText('kick.wav')).toBeVisible();

    await page.getByLabel('Import library files').setInputFiles({
        name: 'snare.wav',
        mimeType: 'audio/wav',
        buffer: Buffer.from([82, 73, 70, 70, 1, 0, 0, 0, 87, 65, 86, 69]),
    });

    await page.getByLabel('Search library files').fill('');
    await expect(page.getByText('snare.wav')).toBeVisible();
});

test('F10-S02 and F10-S03 missing asset repair stays in the library and ends clearly', async ({ page }) => {
    await installElectronBridge(page, buildMissingAssetSeed());
    await page.goto('/');

    await page.getByTitle('Library').click();
    await expect(page.getByText('Missing asset repair')).toBeVisible();
    await page.getByLabel('Repair Broken Sample').setInputFiles({
        name: 'fixed-kick.wav',
        mimeType: 'audio/wav',
        buffer: Buffer.from([82, 73, 70, 70, 1, 0, 0, 0, 87, 65, 86, 69]),
    });

    await expect(page.getByText('Missing asset repair')).not.toBeVisible();
});

function buildLibraryCategorySeed() {
    const kick = createSeedAsset('seed-kick', 'kick.wav', 'sample');
    const plate = createSeedAsset('seed-plate', 'plate.wav', 'impulse');
    const clip = createSeedAsset('seed-clip', 'clip.mid', 'midi', { mimeType: 'audio/midi' });
    const patch = createSeedAsset('seed-patch', 'bass-bus.patch.json', 'patch', { mimeType: 'application/json' });
    const project = createSeedProject({
        id: 'library-categories',
        name: 'Library Categories',
        assets: [kick, plate, clip, patch],
    });
    return {
        bootstrap: { windowKind: 'project' as const, projectId: project.snapshot.project.id },
        projects: [project],
    };
}

test('F10-S04 library category tabs switch between Audio, Convolvers, MIDI, and Patches views', async ({ page }) => {
    await installElectronBridge(page, buildLibraryCategorySeed());
    await page.goto('/');

    await page.getByTitle('Library').click();

    await expect(page.getByRole('button', { name: 'Audio' })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByText('kick.wav')).toBeVisible();

    await page.getByRole('button', { name: 'Convolvers' }).click();
    await expect(page.getByRole('button', { name: 'Convolvers' })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByText('plate.wav')).toBeVisible();
    await expect(page.getByText('kick.wav')).not.toBeVisible();

    await page.getByRole('button', { name: 'MIDI' }).click();
    await expect(page.getByRole('button', { name: 'MIDI' })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByText('clip.mid')).toBeVisible();
    await expect(page.getByText('kick.wav')).not.toBeVisible();

    await page.getByRole('button', { name: 'Patches' }).click();
    await expect(page.getByRole('button', { name: 'Patches' })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByText('bass-bus.patch.json')).toBeVisible();
    await expect(page.getByText('clip.mid')).not.toBeVisible();
});

test('F10-S05 importing a MIDI file shows it under the MIDI tab', async ({ page }) => {
    await installElectronBridge(page, buildLibraryCategorySeed());
    await page.goto('/');

    await page.getByTitle('Library').click();
    await page.getByRole('button', { name: 'MIDI' }).click();

    const midiBytes = Buffer.from([0x4d, 0x54, 0x68, 0x64, 0, 0, 0, 0x06]);
    await page.getByLabel('Import library files').setInputFiles({
        name: 'imported.mid',
        mimeType: 'audio/midi',
        buffer: midiBytes,
    });

    await expect(page.getByText('imported.mid')).toBeVisible();
});

test('F10-S06 importing an impulse file shows it under the Convolvers tab', async ({ page }) => {
    await installElectronBridge(page, buildLibraryCategorySeed());
    await page.goto('/');

    await page.getByTitle('Library').click();
    await page.getByRole('button', { name: 'Convolvers' }).click();

    await page.getByLabel('Import library files').setInputFiles({
        name: 'new-ir.wav',
        mimeType: 'audio/wav',
        buffer: Buffer.from([82, 73, 70, 70, 1, 0, 0, 0, 87, 65, 86, 69]),
    });

    await expect(page.getByText('new-ir.wav')).toBeVisible();
});

test('F10-S07 importing a patch file shows it under the Patches tab', async ({ page }) => {
    await installElectronBridge(page, buildLibraryCategorySeed());
    await page.goto('/');

    await page.getByTitle('Library').click();
    await page.getByRole('button', { name: 'Patches' }).click();

    await page.getByLabel('Import library files (Patches)').setInputFiles({
        name: 'nested-drum.din',
        mimeType: 'application/json',
        buffer: Buffer.from('{"version":1,"nodes":[],"connections":[]}', 'utf8'),
    });

    await expect(page.getByText('nested-drum.din')).toBeVisible();
});
