# DIN Studio MCP Server

## Purpose

`@din/studio-mcp` exposes a local MCP server for DIN Studio.
It supports:

- live control of an open DIN Studio instance through a local bridge
- offline patch validation, export, and code generation from `.json` patch files
- guarded mutations through preview and apply flows

## Running

Build and start the server from the repository root:

```bash
npm run editor:build:mcp
npm run editor:mcp:start
```

For local development:

```bash
npm run editor:dev:mcp
```

This dev command runs the bridge on `http://localhost`.
By default it uses port `17374` to stay separate from the secure standalone MCP port.
The browser editor dev shell should use this mode by default.

## Environment

- `DIN_STUDIO_MCP_BRIDGE_PORT`
  Default: `17373`
- `DIN_STUDIO_MCP_READ_ONLY`
  Set to `1`, `true`, `yes`, or `on` to reject live mutations
- `DIN_STUDIO_MCP_REQUEST_TIMEOUT_MS`
  Default: `10000`
- `DIN_STUDIO_MCP_BRIDGE_PROTOCOL`
  Default: `https` in standalone mode, `http` via `npm run editor:dev:mcp`
- `DIN_STUDIO_MCP_BRIDGE_HOST`
  Default: `localhost`
- `DIN_STUDIO_MCP_TLS_DIR`
  Default: `.din-studio-mcp/tls` relative to the MCP server working directory

The bridge listens on loopback only.
In HTTPS mode, the server auto-generates a local certificate authority and a localhost server certificate in the TLS directory.
The browser must trust that local CA once before DIN Studio can connect over HTTPS/WSS without certificate errors.

## MCP Surface

Resources:

- `din-studio://sessions`
- `din-studio://session/{sessionId}/state`
- `din-studio://session/{sessionId}/graphs`
- `din-studio://session/{sessionId}/graphs/{graphId}`
- `din-studio://offline/patch/{encodedPath}`

Tools:

- `editor_list_sessions`
- `editor_get_state`
- `editor_list_graphs`
- `editor_get_graph`
- `editor_preview_operations`
- `editor_apply_operations`
- `editor_import_patch`
- `editor_export_patch`
- `editor_validate_patch`
- `editor_generate_code`
- `editor_list_assets`
- `editor_ingest_asset_file`

## Browser Bridge

The DIN Studio front-end discovers the bridge through:

- `GET http://localhost:<port>/bridge-info` in local dev
- `GET https://localhost:<port>/bridge-info` in standalone secure mode

The generated CA certificate is also exposed at:

- `GET https://localhost:<port>/bridge-ca`

It then connects to:

- `ws://localhost:<port>/bridge` in local dev
- `wss://localhost:<port>/bridge` in standalone secure mode

The bridge requires an ephemeral token returned by the discovery endpoint and validates it during `session.hello`.

## Dev vs Secure Mode

- `npm run editor:dev:mcp`
  Runs the local bridge on `http://localhost:17374` for browser development.
- `npm run editor:mcp:start`
  Runs the secure standalone bridge on `https://localhost:17373`.

If you point the dev UI at the secure standalone bridge, set `VITE_DIN_STUDIO_MCP_PROTOCOL=https` and trust the generated local CA first.
