# Reference: Pierre (`@pierre/diffs`, `@pierre/trees`)

- **Status:** Component review, 2026-06-01
- **Repo:** [pierrecomputer/pierre](https://github.com/pierrecomputer/pierre) — TypeScript, Apache-2.0, ~4.9k★ (approx., gh, 2026-06-01). Sites: diffs.com, trees.software.
- **Role:** **Focused front-end UI-component references** (study + reimplement, never a dependency). _Not_ a workspace/agent — so deliberately **excluded from `../feature-matrix.md`** (no comparable feature surface); referenced here for specific UI surfaces only.

## What it is

Pierre is a git-collaboration/code-review platform; its open-source repo ships small, modern UI primitives. Two are relevant to telemachus:

- **`@pierre/diffs`** — diff/code rendering library (Shiki-based): split/unified (side-by-side or stacked) views, classic + bar + background + inline change styling, **merge-conflict UI**, **comments/annotations framework**, line selection, **token hover callbacks**, theming/fonts, and **diffing arbitrary file pairs** (beyond git diffs). _(t3code already uses this — see [`t3code.md`](t3code.md).)_
- **`@pierre/trees`** — "path-first **file tree** UI for the web": one implementation, four entry points (vanilla model + mounting API; React hooks + `<FileTree>`; SSR preload; web-components). Renders in a **shadow root**, state keyed by **canonical path strings** (not numeric IDs). Beta (`1.0.0-beta.4`), README-light.
- (Minor sibling packages: `path-store`, `storage-elements`, `truncate` — not telemachus-relevant.)

## Relevance to telemachus (honest, surface-specific)

- **`@pierre/diffs` → glass-box + editor.** A diff renderer is exactly what a **fork comparison** needs (diff two forked run paths, or message/version A vs B) and what a **document editor** needs (show edits/AI rewrites). The comments/annotations + token-hover framework is also suggestive for annotating a replayed run. Most relevant of the two.
- **`@pierre/trees` → file/folder navigation.** A file-tree component for an editor/document/code surface, or potentially the **folders/projects** org feature (high community demand). It is a _file_ tree — **not** the conversation/run **branch tree** the glass-box fork wedge needs; that's a different structure to build.

## Caveats

- **Narrow + surface-specific.** These are UI bits, not core to the conversation-primary workspace or the wedge engine. Worth studying _if/when_ telemachus builds an editor/file/diff surface.
- **Modern stack worth a look** — web-components + shadow-DOM + SSR + React multi-entry, path-keyed state. Good design reference for framework-agnostic UI components.
- Per the build-our-own rule, study the UX/API and reimplement. (Diff/tree rendering is also the kind of commodity UI where a dependency would be defensible if that rule is ever relaxed — author's call.)
