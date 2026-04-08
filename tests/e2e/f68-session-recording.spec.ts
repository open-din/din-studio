import { expect, test } from '@playwright/test';
import { createSeedProject, installElectronBridge } from './support/fixtures';

function buildWorkspaceSeed() {
    const project = createSeedProject({ id: 'recording-lab', name: 'Recording Lab' });
    return {
        bootstrap: { windowKind: 'project' as const, projectId: project.snapshot.project.id },
        projects: [project],
    };
}

test('F68-S01 bottom drawer exposes Recording tab', async ({ page }) => {
    await installElectronBridge(page, buildWorkspaceSeed());
    await page.goto('/');

    await page.getByTitle('Runtime').click();
    await expect(page.getByTestId('bottom-drawer')).toBeVisible();

    const drawer = page.getByTestId('bottom-drawer');
    await expect(drawer.getByRole('button', { name: 'Recording' })).toBeVisible();
});

test('F68-S02 transport record arms recording workflow', async ({ page }) => {
    await installElectronBridge(page, buildWorkspaceSeed());
    await page.goto('/');

    await page.getByTitle('Runtime').click();

    await page.getByTestId('transport-record-button').click();
    await expect(page.getByText(/Armed — press Play to record/i)).toBeVisible();
});
