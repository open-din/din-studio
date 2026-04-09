# Website integration notes

The [user guide](./README.md) is plain Markdown with **relative links**. To publish it:

1. Copy the `docs/product/` tree (and optionally parent `docs/*.md` for cross-links like [MCP](../MCP.md)).  
2. Preserve relative paths between `docs/product/`, `docs/`, and the repo root if you also host `project/features/` for spec links from [Contributor reference](./contributor-reference.md).

## Refreshing screenshots

Playwright can rewrite most files under `images/` (except `launcher.png`—usually captured from `npm run dev:web`). See [images/README.md](./images/README.md).

## Optional front matter

If your static site generator expects YAML, you can prepend stable metadata without changing the body:

```yaml
---
title: Interface tour
nav_order: 30
parent: DIN Studio user guide
---
```

Use filenames as **slugs** (`interface-tour`, `nodes/sources`) for stable URLs.

## Anchor IDs

Heading text becomes anchors depending on the renderer; verify deep links into long pages after you choose a toolchain.

---

[← User guide](./README.md)
