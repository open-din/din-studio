import * as path from 'node:path';
import { test } from '@playwright/test';
import { createSeedProject, installElectronBridge } from './support/fixtures';

const OUT_DIR = path.join(process.cwd(), 'docs/product/images');

function workspaceSeed() {
    const project = createSeedProject({ id: 'product-docs-shell', name: 'Demo Project' });
    return {
        bootstrap: { windowKind: 'project' as const, projectId: project.snapshot.project.id },
        projects: [project],
    };
}

/**
 * Generates screenshots for docs/product when run with:
 *   CAPTURE_PRODUCT_DOCS=1 npx playwright test tests/e2e/product-docs-screenshots.spec.ts
 * Skipped in normal CI (no env).
 */
test.describe('Product documentation screenshots', () => {
    test.skip(() => !process.env.CAPTURE_PRODUCT_DOCS, 'Set CAPTURE_PRODUCT_DOCS=1 to regenerate docs/product/images');

    test('write docs/product/images/*.png', async ({ page }) => {
        await installElectronBridge(page, workspaceSeed());
        await page.goto('/');

        await page.screenshot({ path: path.join(OUT_DIR, 'editor-workspace.png'), fullPage: true });

        await page.getByTitle('Catalog').click();
        await page.getByLabel('Search nodes').waitFor({ state: 'visible' });
        await page.screenshot({ path: path.join(OUT_DIR, 'node-catalog.png'), fullPage: true });

        await page.keyboard.press('Escape');
        await page.waitForTimeout(200);
        await page.keyboard.press(process.platform === 'darwin' ? 'Meta+K' : 'Control+K');
        await page.getByPlaceholder('Search commands').waitFor({ state: 'visible' });
        await page.screenshot({ path: path.join(OUT_DIR, 'command-palette.png'), fullPage: true });
        await page.keyboard.press('Escape');

        await page.locator('.react-flow__node').filter({ hasText: 'Oscillator' }).first().click();
        await page.waitForTimeout(150);
        await page.screenshot({ path: path.join(OUT_DIR, 'inspector-node.png'), fullPage: true });

        await page.getByTitle('Library').click();
        await page.getByLabel('Search library files').waitFor({ state: 'visible' });
        await page.screenshot({ path: path.join(OUT_DIR, 'audio-library.png'), fullPage: true });
    });
});
