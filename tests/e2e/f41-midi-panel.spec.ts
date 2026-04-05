import { expect, test, type Page } from '@playwright/test';
import { createSeedProject, installElectronBridge } from './support/fixtures';

function buildWorkspaceSeed() {
    const project = createSeedProject({ id: 'workspace-midi', name: 'MIDI Lab' });
    return {
        bootstrap: { windowKind: 'project' as const, projectId: project.snapshot.project.id },
        projects: [project],
    };
}

async function installWebMidiMock(page: Page) {
    await page.addInitScript(() => {
        const port = (id: string, type: 'input' | 'output', name: string) => ({
            id,
            type,
            name,
            manufacturer: 'TestCo',
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

        const input = port('input-1', 'input', 'Test Keyboard');
        const output = port('output-1', 'output', 'Test Synth');

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

test('F41-S01 Open MIDI panel', async ({ page }) => {
    await installElectronBridge(page, buildWorkspaceSeed());
    await installWebMidiMock(page);
    await page.goto('/');

    await page.getByTitle('MIDI').click();
    await expect(page.getByTestId('left-drawer')).toContainText('MIDI Devices');
    await expect(page.getByTestId('midi-device-panel')).toBeVisible();
});

test('F41-S02 Connect MIDI lists mocked devices', async ({ page }) => {
    await installElectronBridge(page, buildWorkspaceSeed());
    await installWebMidiMock(page);
    await page.goto('/');

    await page.getByTitle('MIDI').click();
    await page.getByTestId('midi-connect-button').click();
    await expect(page.getByText('Test Keyboard')).toBeVisible();
    await expect(page.getByText('Test Synth')).toBeVisible();
});

test('F41-S07 Device count badge after MIDI access', async ({ page }) => {
    await installElectronBridge(page, buildWorkspaceSeed());
    await installWebMidiMock(page);
    await page.goto('/');

    await page.getByTitle('MIDI').click();
    await page.getByTestId('midi-connect-button').click();
    await expect(page.getByTestId('midi-rail-badge')).toHaveText('2');
});
