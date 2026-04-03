export interface AgentMessage {
    role: 'user' | 'assistant';
    content: string;
    operationsApplied?: number;
    error?: string;
}

export interface GraphSnapshot {
    activeGraphId: string | null;
    nodes: Array<{ id: string; type: string; label: string }>;
    edges: Array<{ id: string; source: string; target: string; sourceHandle?: string | null; targetHandle?: string | null }>;
}
