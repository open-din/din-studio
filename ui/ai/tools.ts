import type { ChatCompletionTool } from 'openai/resources/chat/completions';

export const PATCH_TOOLS: ChatCompletionTool[] = [
    {
        type: 'function',
        function: {
            name: 'apply_patch_operations',
            description: 'Apply a sequence of editor operations to create or modify the audio patch. Call this whenever the user wants to add, remove, or modify nodes and connections.',
            parameters: {
                type: 'object',
                properties: {
                    operations: {
                        type: 'array',
                        description: 'Ordered list of editor operations to apply.',
                        items: {
                            type: 'object',
                            properties: {
                                type: {
                                    type: 'string',
                                    enum: [
                                        'add_node',
                                        'connect',
                                        'disconnect',
                                        'update_node_data',
                                        'remove_node',
                                        'create_graph',
                                        'load_graph',
                                    ],
                                },
                                nodeType: { type: 'string', description: 'Node type key (e.g. osc, gain, filter). Required for add_node.' },
                                nodeId: { type: 'string', description: 'Temporary node ID you assign (e.g. osc1). Used for add_node and update/remove.' },
                                position: {
                                    type: 'object',
                                    properties: {
                                        x: { type: 'number' },
                                        y: { type: 'number' },
                                    },
                                    required: ['x', 'y'],
                                },
                                source: { type: 'string', description: 'Source node ID for connect/disconnect.' },
                                sourceHandle: { type: 'string', description: 'Source handle ID (port name).' },
                                target: { type: 'string', description: 'Target node ID for connect/disconnect.' },
                                targetHandle: { type: 'string', description: 'Target handle ID (port name).' },
                                edgeId: { type: 'string', description: 'Edge ID for disconnect.' },
                                data: {
                                    type: 'object',
                                    description: 'Partial node data to update. Required for update_node_data.',
                                },
                                name: { type: 'string', description: 'Graph name for create_graph.' },
                                activate: { type: 'boolean', description: 'Whether to activate the graph after creating it.' },
                                graphId: { type: 'string', description: 'Target graph ID (optional, defaults to active graph).' },
                            },
                            required: ['type'],
                        },
                    },
                },
                required: ['operations'],
            },
        },
    },
];
