/** Persisted OpenAI chat model id for the patch agent. */
export const DEFAULT_AGENT_MODEL = 'gpt-4o';

export type AgentReasoningMode = 'default' | 'low' | 'medium' | 'high';

export interface AgentModelOption {
    id: string;
    label: string;
}

/** Curated list; you can swap the id for any model your key supports. */
export const AGENT_MODEL_OPTIONS: AgentModelOption[] = [
    { id: 'gpt-4o', label: 'GPT-4o' },
    { id: 'gpt-4o-mini', label: 'GPT-4o mini' },
    { id: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
    { id: 'o3-mini', label: 'o3-mini' },
    { id: 'o4-mini', label: 'o4-mini' },
];

export const REASONING_MODE_OPTIONS: { value: AgentReasoningMode; label: string }[] = [
    { value: 'default', label: 'Default' },
    { value: 'low', label: 'Thinking: low' },
    { value: 'medium', label: 'Thinking: medium' },
    { value: 'high', label: 'Thinking: high' },
];

/**
 * Reasoning effort is only meaningful for newer reasoning models (o·series, gpt-5·, …).
 * GPT-4o family ignores this parameter on the API.
 */
export function modelSupportsReasoningEffort(modelId: string): boolean {
    if (/^o[0-9]/.test(modelId)) return true;
    if (modelId.startsWith('gpt-5')) return true;
    return false;
}

export function reasoningModeToApiEffort(
    mode: AgentReasoningMode,
): 'low' | 'medium' | 'high' | undefined {
    if (mode === 'default') return undefined;
    return mode;
}

export function parseStoredReasoningMode(raw: string | null): AgentReasoningMode {
    if (raw === 'low' || raw === 'medium' || raw === 'high') return raw;
    return 'default';
}
