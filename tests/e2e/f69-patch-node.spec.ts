import { expect, test } from '@playwright/test';
import { createInitialGraphDocument } from '../../ui/editor/defaultGraph';
import { createSeedProject, installElectronBridge } from './support/fixtures';

function buildPatchNodeSeed() {
    const mainGraph = createInitialGraphDocument('graph-shell-1', 'Main Graph', 0);
    const siblingGraph = createInitialGraphDocument('graph-shell-2', 'Drum Bus', 1);

    siblingGraph.nodes.push(
        {
            id: 'event-1',
            type: 'eventTriggerNode',
            position: { x: 80, y: 80 },
            data: {
                type: 'eventTrigger',
                label: 'Bang',
                token: 0,
                mode: 'change',
                cooldownMs: 0,
                velocity: 1,
                duration: 0.1,
                note: 60,
                trackId: 'event',
            },
        } as any,
        {
            id: 'midi-cc-out-1',
            type: 'midiCCOutputNode',
            position: { x: 240, y: 80 },
            data: {
                type: 'midiCCOutput',
                label: 'CC Out',
                outputId: null,
                channel: 1,
                cc: 74,
                value: 0,
                valueFormat: 'normalized',
            },
        } as any,
    );

    const project = createSeedProject({
        id: 'patch-node-lab',
        name: 'Patch Node Lab',
        graphs: [mainGraph, siblingGraph],
        activeGraphId: mainGraph.id,
    });

    return {
        bootstrap: { windowKind: 'project' as const, projectId: project.snapshot.project.id },
        projects: [project],
    };
}

test('F69-S01 Patch node is discoverable and placeable from the Sources catalog', async ({ page }) => {
    await installElectronBridge(page, buildPatchNodeSeed());
    await page.goto('/');

    await page.getByTitle('Catalog').click();
    await page.getByRole('button', { name: 'Add Patch' }).click();

    await expect(page.locator('.react-flow__node').filter({ hasText: 'Patch' })).toHaveCount(1);
});

test('F69-S02 Patch node derives handles after selecting a sibling graph source', async ({ page }) => {
    await installElectronBridge(page, buildPatchNodeSeed());
    await page.goto('/');

    await page.getByTitle('Catalog').click();
    await page.getByRole('button', { name: 'Add Patch' }).click();

    const patchNode = page.locator('.react-flow__node').filter({ hasText: 'Patch' }).first();
    await patchNode.locator('select[title="Select patch source"]').selectOption('graph:graph-shell-2');

    await expect(patchNode.locator('.react-flow__handle[data-handleid="in:bang"]').first()).toBeVisible();
    await expect(patchNode.locator('.react-flow__handle[data-handleid="out:ccOut"]').first()).toBeVisible();
});
