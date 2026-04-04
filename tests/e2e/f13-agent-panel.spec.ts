import { expect, test } from '@playwright/test';
import { createSeedProject, installElectronBridge } from './support/fixtures';

const API_KEY_STORAGE = 'din-studio-openai-api-key';
const CHAT_KEY_PREFIX = 'din-studio-agent-chat-v1:';
const MODEL_STORAGE = 'din-studio-agent-model';

function buildWorkspaceSeed(localStorageOverrides?: Record<string, string>) {
    const project = createSeedProject({ id: 'agent-lab', name: 'Agent Lab' });
    return {
        bootstrap: { windowKind: 'project' as const, projectId: project.snapshot.project.id },
        projects: [project],
        localStorage: localStorageOverrides,
    };
}

function buildSeededChatKey(project: ReturnType<typeof createSeedProject>): string {
    const graphId = project.snapshot.activeGraphId ?? '';
    return `${CHAT_KEY_PREFIX}${graphId}`;
}

// ---------------------------------------------------------------------------
// F13-S01 — Bottom drawer exposes the AI Agent tab
// ---------------------------------------------------------------------------

test('F13-S01 bottom drawer exposes the AI Agent tab alongside Runtime and Diagnostics', async ({ page }) => {
    await installElectronBridge(page, buildWorkspaceSeed());
    await page.goto('/');

    await page.getByTitle('Runtime').click();
    await expect(page.getByTestId('bottom-drawer')).toBeVisible();

    const drawer = page.getByTestId('bottom-drawer');
    await expect(drawer.getByRole('button', { name: 'Runtime' })).toBeVisible();
    await expect(drawer.getByRole('button', { name: 'Diagnostics' })).toBeVisible();
    await expect(drawer.getByRole('button', { name: 'AI Agent' })).toBeVisible();
});

// ---------------------------------------------------------------------------
// F13-S02 — Setup view shown when no API key is stored
// ---------------------------------------------------------------------------

test('F13-S02 AI Agent tab shows API key setup view when no key is stored', async ({ page }) => {
    await installElectronBridge(page, buildWorkspaceSeed());
    await page.goto('/');

    await page.getByTitle('Runtime').click();
    await page.getByTestId('bottom-drawer').getByRole('button', { name: 'AI Agent' }).click();

    await expect(page.getByPlaceholder('sk-...')).toBeVisible();
    await expect(page.getByRole('button', { name: /save key/i })).toBeVisible();

    // Model selectors and chat input should not be visible yet
    await expect(page.getByPlaceholder(/describe a patch/i)).not.toBeVisible();
});

// ---------------------------------------------------------------------------
// F13-S03 — After saving an API key the chat UI becomes active
// ---------------------------------------------------------------------------

test('F13-S03 saving an API key reveals model selectors and chat input', async ({ page }) => {
    await installElectronBridge(page, buildWorkspaceSeed());
    await page.goto('/');

    await page.getByTitle('Runtime').click();
    await page.getByTestId('bottom-drawer').getByRole('button', { name: 'AI Agent' }).click();

    await page.getByPlaceholder('sk-...').fill('sk-test-fake-key');
    await page.getByRole('button', { name: /save key/i }).click();

    // Chat input should now be present
    await expect(page.getByPlaceholder(/describe a patch/i)).toBeVisible();

    // Model and thinking selectors should appear
    await expect(page.getByText(/agent \(model\)/i)).toBeVisible();
    await expect(page.getByText(/thinking/i)).toBeVisible();
});

// ---------------------------------------------------------------------------
// F13-S04 — Chat history persists per graph across navigation
// ---------------------------------------------------------------------------

test('F13-S04 chat history is restored from localStorage when switching back to a graph', async ({ page }) => {
    const project = createSeedProject({ id: 'agent-lab', name: 'Agent Lab' });
    const graphId = project.snapshot.activeGraphId ?? '';
    const chatKey = `${CHAT_KEY_PREFIX}${graphId}`;

    const storedChat = JSON.stringify([
        { role: 'user', content: 'add a reverb node' },
        { role: 'assistant', content: 'I added a Convolver node wired to the output.', operationsApplied: 1 },
    ]);

    await installElectronBridge(page, {
        bootstrap: { windowKind: 'project', projectId: project.snapshot.project.id },
        projects: [project],
        localStorage: {
            [API_KEY_STORAGE]: 'sk-test-fake-key',
            [chatKey]: storedChat,
        },
    });
    await page.goto('/');

    await page.getByTitle('Runtime').click();
    await page.getByTestId('bottom-drawer').getByRole('button', { name: 'AI Agent' }).click();

    // Previously stored messages should be visible
    await expect(page.getByText('add a reverb node')).toBeVisible();
    await expect(page.getByText('I added a Convolver node wired to the output.')).toBeVisible();
    // Operations applied annotation
    await expect(page.getByText(/1 operation/)).toBeVisible();
});

// ---------------------------------------------------------------------------
// F13-S05 — Clear chat button removes visible messages
// ---------------------------------------------------------------------------

test('F13-S05 clear chat button wipes the message history from view', async ({ page }) => {
    const project = createSeedProject({ id: 'agent-lab', name: 'Agent Lab' });
    const graphId = project.snapshot.activeGraphId ?? '';
    const chatKey = `${CHAT_KEY_PREFIX}${graphId}`;

    await installElectronBridge(page, {
        bootstrap: { windowKind: 'project', projectId: project.snapshot.project.id },
        projects: [project],
        localStorage: {
            [API_KEY_STORAGE]: 'sk-test-fake-key',
            [chatKey]: JSON.stringify([{ role: 'user', content: 'hello agent' }]),
        },
    });
    await page.goto('/');

    await page.getByTitle('Runtime').click();
    await page.getByTestId('bottom-drawer').getByRole('button', { name: 'AI Agent' }).click();

    await expect(page.getByText('hello agent')).toBeVisible();

    await page.getByTitle('Clear chat for this graph').click();

    await expect(page.getByText('hello agent')).not.toBeVisible();
    await expect(page.getByText(/describe a patch/i)).toBeVisible();
});

// ---------------------------------------------------------------------------
// F13-S06 — Model selection persists across reload
// ---------------------------------------------------------------------------

test('F13-S06 model selection is persisted and restored from localStorage', async ({ page }) => {
    await installElectronBridge(page, buildWorkspaceSeed({
        [API_KEY_STORAGE]: 'sk-test-fake-key',
        [MODEL_STORAGE]: 'o4-mini',
    }));
    await page.goto('/');

    await page.getByTitle('Runtime').click();
    await page.getByTestId('bottom-drawer').getByRole('button', { name: 'AI Agent' }).click();

    // The model select should reflect the stored value
    const modelSelect = page.getByLabel(/agent \(model\)/i);
    await expect(modelSelect).toHaveValue('o4-mini');

    // Thinking select should be enabled for o4-mini (reasoning model)
    const thinkingSelect = page.getByLabel(/thinking/i);
    await expect(thinkingSelect).toBeEnabled();
});

// ---------------------------------------------------------------------------
// F13-S07 — Reasoning mode is disabled for non-reasoning models
// ---------------------------------------------------------------------------

test('F13-S07 thinking selector is disabled when a non-reasoning model is selected', async ({ page }) => {
    await installElectronBridge(page, buildWorkspaceSeed({
        [API_KEY_STORAGE]: 'sk-test-fake-key',
        [MODEL_STORAGE]: 'gpt-4o',
    }));
    await page.goto('/');

    await page.getByTitle('Runtime').click();
    await page.getByTestId('bottom-drawer').getByRole('button', { name: 'AI Agent' }).click();

    const thinkingSelect = page.getByLabel(/thinking/i);
    await expect(thinkingSelect).toBeDisabled();
});
