# Website integration notes

This folder is plain Markdown with **relative links** so it can be copied into a static site, git submodule, or content directory without rewriting URLs—provided the site preserves the same relative layout between `docs/product/`, `docs/*.md`, and `project/features/`.

## Suggested layouts

1. **Docs-only site** — Set the content root to the `din-studio` repo (or a subtree). Map:
   - `docs/product/**/*.md` → product section routes
   - `docs/*.md` → reference section
   - Optionally expose `project/features/*.feature.md` as “Specification” pages (same relative paths as in this doc set).

2. **Combined handbook** — Import `docs/product` as a section; keep contributor panels under `docs/` as a sibling section; link scenario IDs to your internal search or to GitHub source.

## Optional front matter

If your generator expects YAML, you can prepend consistent keys without changing body content, for example:

```yaml
---
title: Editor & workspace
nav_order: 20
parent: DIN Studio product
---
```

Slug policy: derive from filenames (`editor-workspace`, `nodes/index`) for stable permalinks.

## Anchor IDs

Section headings in feature files generate anchors (e.g. `### F05-S01 …`); generators differ—verify with your toolchain if deep-linking into scenarios.

---

[← Product home](./README.md)
