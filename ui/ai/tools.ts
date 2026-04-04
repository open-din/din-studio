import type { ChatCompletionTool } from 'openai/resources/chat/completions';

export const PATCH_TOOLS: ChatCompletionTool[] = [
    {
        type: 'function',
        function: {
            name: 'apply_patch_operations',
            description:
                'Apply ordered editor operations to the active graph. Use exact node type keys (osc, gain, stepSequencer, …) and handle ids from the DIN catalog (e.g. out, in, frequency, gate, transport). Call when the user wants structural or parameter changes; explain-only questions need no tool.',
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
                                nodeType: {
                                    type: 'string',
                                    description:
                                        'Catalog node type id (osc, noise, stepSequencer, adsr, gain, filter, output, …). Must match DIN / react-din registry exactly.',
                                },
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
                                sourceHandle: {
                                    type: 'string',
                                    description: 'Source output handle id (e.g. out, envelope, trigger, note).',
                                },
                                target: { type: 'string', description: 'Target node ID for connect/disconnect.' },
                                targetHandle: {
                                    type: 'string',
                                    description: 'Target input handle id (e.g. in, frequency, gate, transport).',
                                },
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
