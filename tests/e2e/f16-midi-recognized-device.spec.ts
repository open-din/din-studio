import { expect, test, type Page } from '@playwright/test';
import { createSeedProject, installElectronBridge } from './support/fixtures';

const SCAFFOLD_NODE_COUNT = 35;

function buildWorkspaceSeed() {
    const project = createSeedProject({ id: 'workspace-midi-rec', name: 'MIDI Recognized Lab' });
    return {
        bootstrap: { windowKind: 'project' as const, projectId: project.snapshot.project.id },
        projects: [project],
    };
}

async function installDdjXp2WebMidiMock(page: Page) {
    await page.addInitScript(() => {
        const port = (
            id: string,
            type: 'input' | 'output',
            name: string,
            manufacturer: string,
        ) => ({
            id,
            type,
            name,
            manufacturer,
            state: 'connected',
            connection: 'open',
            onmidimessage: null,
            addEventListener() {},
            removeEventListener() {},
            open() {
                return Promise.resolve(this);
            },
            close() {
                return Promise.resolve();
            },
        });

        const input = port('input-1', 'input', 'DDJ-XP2', 'Pioneer DJ');
        const output = port('output-1', 'output', 'Test Synth', 'TestCo');

        (navigator as Navigator & { requestMIDIAccess?: () => Promise<unknown> }).requestMIDIAccess = () =>
            Promise.resolve({
                inputs: new Map([
                    [input.id, input],
                ]),
                outputs: new Map([
                    [output.id, output],
                ]),
                sysexEnabled: false,
                onstatechange: null,
                addEventListener() {},
                removeEventListener() {},
            });
    });
}

test('F16-S01 Recognized MIDI UI for DDJ-XP2', async ({ page }) => {
    await installElectronBridge(page, buildWorkspaceSeed());
    await installDdjXp2WebMidiMock(page);
    await page.goto('/');

    await page.getByTitle('MIDI').click();
    await page.getByTestId('midi-connect-button').click();
    await expect(page.getByText('DDJ-XP2')).toBeVisible();
    await expect(page.getByTestId('midi-recognized-badge').first()).toBeVisible();
    await expect(page.getByTestId('midi-apply-preset').first()).toBeVisible();
});

test('F16-S02 Apply preset adds scaffold nodes', async ({ page }) => {
    await installElectronBridge(page, buildWorkspaceSeed());
    await installDdjXp2WebMidiMock(page);
    await page.goto('/');

    await page.getByTitle('MIDI').click();
    await page.getByTestId('midi-connect-button').click();
    const before = await page.locator('.react-flow__node').count();
    await page.getByTestId('midi-apply-preset').click();
    await expect(page.locator('.react-flow__node')).toHaveCount(before + SCAFFOLD_NODE_COUNT);
});

test('F16-S03 Pad scaffold exposes expected note in node', async ({ page }) => {
    await installElectronBridge(page, buildWorkspaceSeed());
    await installDdjXp2WebMidiMock(page);
    await page.goto('/');

    await page.getByTitle('MIDI').click();
    await page.getByTestId('midi-connect-button').click();
    await page.getByTestId('midi-apply-preset').click();

    const padNode = page.locator('.react-flow__node').filter({ hasText: 'Pad L1' }).first();
    await padNode.click();
    await expect(padNode.locator('input[type="range"]').first()).toHaveValue('0');
});

test('F16-S04 Left and right pad clusters are separated horizontally', async ({ page }) => {
    await installElectronBridge(page, buildWorkspaceSeed());
    await installDdjXp2WebMidiMock(page);
    await page.goto('/');

    await page.getByTitle('MIDI').click();
    await page.getByTestId('midi-connect-button').click();
    await page.getByTestId('midi-apply-preset').click();

    const layout = await page.evaluate(() => {
        const boxes = (label: string) =>
            Array.from(document.querySelectorAll('.react-flow__node'))
                .filter((el) => el.textContent?.includes(label))
                .map((el) => el.getBoundingClientRect().x);
        const left = boxes('Pad L1');
        const right = boxes('Pad R1');
        const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
        return { avgLeft: avg(left), avgRight: avg(right) };
    });
    expect(layout.avgLeft).toBeLessThan(layout.avgRight);
});

test('F16-S05 Apply preset is non-destructive', async ({ page }) => {
    await installElectronBridge(page, buildWorkspaceSeed());
    await installDdjXp2WebMidiMock(page);
    await page.goto('/');

    await expect(page.locator('.react-flow__node').filter({ hasText: 'Oscillator' })).toHaveCount(1);

    await page.getByTitle('MIDI').click();
    await page.getByTestId('midi-connect-button').click();
    await page.getByTestId('midi-apply-preset').click();

    await expect(page.locator('.react-flow__node').filter({ hasText: 'Oscillator' })).toHaveCount(1);
});
