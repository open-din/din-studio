# din-studio

Standalone DIN Studio editor repository.

`din-studio` contains the editor UI, Electron-facing app target, and MCP server that sit on top of the published `@open-din/react` library.

## Local Setup

1. Install dependencies with `npm install`.
2. Install a compatible `@open-din/react` release, or use a local tarball or `npm link` during the transition.
3. Run `npm run dev:web` for the browser editor or `npm run dev:mcp` for the MCP bridge.

## Scripts

- `npm run dev:web`
- `npm run build:web`
- `npm run dev:app`
- `npm run build:app`
- `npm run dev:mcp`
- `npm run mcp:start`
- `npm run test`
- `npm run test:e2e`

## Compatibility

This repo assumes `@open-din/react` exposes public patch, MIDI, and data helper surfaces used by the editor:

- `@open-din/react/patch`
- `@open-din/react/midi`
- `@open-din/react/data`
