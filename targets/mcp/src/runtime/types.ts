export interface McpTool {
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
}

export interface McpToolResult {
    content: Array<{ type: 'text'; text: string }>;
    structuredContent?: unknown;
    isError?: boolean;
}

export interface McpResource {
    uri: string;
    name: string;
    description?: string;
    mimeType?: string;
}

export interface McpResourceTemplate {
    uriTemplate: string;
    name: string;
    description?: string;
    mimeType?: string;
}

export interface McpResourceReadResult {
    contents: Array<{
        uri: string;
        mimeType: string;
        text: string;
    }>;
}
