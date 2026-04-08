import { expect, test } from '@playwright/test';
import { createSeedAsset, createSeedProject, installElectronBridge } from './support/fixtures';

function buildMidiPlayerSeed() {
    const midiAsset = createSeedAsset('midi-patch-1', 'pattern.mid', 'midi', { mimeType: 'audio/midi' });
    const project = createSeedProject({
        id: 'midi-player-lab',
        name: 'MIDI Player Lab',
        assets: [midiAsset],
    });
    return {
        bootstrap: { windowKind: 'project' as const, projectId: project.snapshot.project.id },
        projects: [project],
    };
}

test('F67-S01 MIDI Player is placeable from the MIDI catalog', async ({ page }) => {
    await installElectronBridge(page, buildMidiPlayerSeed());
    await page.goto('/');

    await page.getByTitle('Catalog').click();
    await page.getByRole('button', { name: 'Add MIDI Player' }).click();

    await expect(page.locator('.react-flow__node').filter({ hasText: 'MIDI Player' })).toHaveCount(1);
});

test('F67-S02 MIDI Player exposes transport and trigger handles', async ({ page }) => {
    await installElectronBridge(page, buildMidiPlayerSeed());
    await page.goto('/');

    await page.getByTitle('Catalog').click();
    await page.getByRole('button', { name: 'Add MIDI Player' }).click();

    const node = page.locator('.react-flow__node').filter({ hasText: 'MIDI Player' }).first();
    await expect(node.locator('.react-flow__handle[data-handleid="transport"]').first()).toBeVisible();
    await expect(node.locator('.react-flow__handle[data-handleid="trigger"]').first()).toBeVisible();
});
