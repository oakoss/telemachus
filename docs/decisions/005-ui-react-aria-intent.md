# UI components: React Aria Components + Intent UI

- **Status:** Accepted
- **Date:** 2026-06-02
- **Authors:** @jbabin91

## Context

Telemachus needs a component layer that is **accessible**, **themeable** (light/dark + multiple named themes — Odysseus ships a theme switcher, so this is parity), **owned in-repo** (build-our-own), **free/OSS**, and comprehensive enough for three kinds of surface:

1. **Parity / table-stakes** — chat, forms, tables, date pickers, comboboxes, overlays.
2. **AI / chat surfaces** — message stream, streaming markdown, code blocks, reasoning, tool-call/approval cards, prompt input.
3. **Net-new wedge surfaces** — the in-thread work surface (pins→checklist + notes), the glass-box run/step timeline + rewind/fork, the working-memory panel. No kit ships these.

Constraints that apply:

- **All-TypeScript**, **free / open-source**; **own the code** (the build-our-own principle — references studied and reimplemented, not black-box component dependencies).
- Pairs with [ADR-002](002-app-framework-tanstack-start-nitro.md) (TanStack Start).

This decision is **scoped to the component foundation and theming approach only**. The AI **runtime** (streaming, the model/LLM layer that feeds the chat surface) is decided separately in [ADR-006](006-model-llm-layer.md); concrete design tokens/theme palettes are deferred to R1.

Evidence (verified 2026-06-02): see [`../research/ui-component-landscape.md`](../research/ui-component-landscape.md). Intent UI is built on **react-aria-components + Tailwind CSS v4 + tailwind-variants**, distributed **copy-paste** via the shadcn CLI (source lands in-repo), **MIT**, 80+ components including dark-mode/theming, ~1.9k★ and actively maintained. No AI/chat kit is built on react-aria-components — they are Radix/shadcn-based.

## Decision

Adopt **react-aria-components** (Adobe) as the behavior/accessibility primitive layer, with **Intent UI** as the styled component foundation.

- **Distribution:** Intent UI installed **copy-paste** (shadcn CLI) — component source lives in our repo, owned and customizable. Styling via **Tailwind CSS v4 + tailwind-variants**. **`tailwind-variants` (`tv`) is the variant utility across the app** — Intent UI already ships on it (v3, no `cva`), and it's preferred over `cva` for slots, responsive variants, and built-in `tailwind-merge`.
- **Theming:** Tailwind v4 CSS-variable tokens + a theme provider, supporting **light / dark / system and multiple named themes** (parity with Odysseus's theme switcher).
- **AI / chat surfaces:** **reimplemented on this foundation**, referencing **prompt-kit** (the closest fit — copy-paste, MIT, works on React Aria primitives), **AI Elements**, and **assistant-ui** as design references. No AI kit is adopted as a dependency. The shadcn-based references use `cva`; porting them converts variants to **tailwind-variants** so the codebase stays on one utility.
- **HeroUI and other React Aria libraries:** **source/GitHub references** to enhance specific components — _not_ dependencies. HeroUI ships via npm with its own theming system; we port enhancements onto the Intent UI/RAC base rather than running both stacks. Vendoring a single component is a bounded exception, not the default.
- **Wedge surfaces:** built from scratch on react-aria-components — no kit ships them.

## Consequences

**Easier / gained:**

- **Adobe-grade accessibility** (keyboard, screen reader, touch/mobile) across every surface — primitives, AI, and wedge — on **one primitive base and one a11y model**.
- **We own the code** (copy-paste) — aligns with build-our-own; 80+ MIT components as the starting point, on Tailwind v4.
- **Theming built in** — multi-theme switching is straightforward on CSS-variable tokens.
- A large **reference pool** (HeroUI, AI kits, Adobe examples) on the same React Aria DNA to enhance from.

**Harder / accepted tradeoffs:**

- **Copy-paste means manual updates** — no `npm update`; we own divergence from upstream Intent UI.
- **Reimplementing AI surfaces is more work** than dropping in a Radix AI kit — the cost of keeping one stack and owning the code.
- **Single-maintainer upstream** (Intent UI). Mitigated: the code is ours once copied, sits on Adobe's stable react-aria-components, and can be enhanced from HeroUI/Adobe examples if Intent UI stalls.
- Learn react-aria-components + Tailwind v4 conventions.

**Follow-up:**

- [`../research/ui-component-landscape.md`](../research/ui-component-landscape.md) records the evaluated field.
- Design tokens, theme palettes, and the theme switcher are detailed at R1; theme switching is tracked as a ring-1 parity feature.
- The AI runtime / model-LLM layer is decided in [ADR-006](006-model-llm-layer.md) (the chat surface's data comes from there + ADR-001 collections).

## Alternatives considered

- **HeroUI (formerly NextUI)** — ~29.5k★, Apache-2.0, very polished, React Aria–based, Tailwind v4. **Not chosen as the foundation:** it's an installed **npm dependency** with its **own theming system** — mixing it with Intent UI means two theming models and duplicate primitives, and it loses the own-the-code property. Switching to HeroUI wholesale was considered (popularity, polish, maintenance) but rejected to preserve build-our-own. **Kept as a top-tier reference** to enhance components from.
- **Jolly UI** — react-aria-components, shadcn-theme-compatible, copy-paste. **Not chosen:** dormant (~16 months without a push, pre-Tailwind-v4) — a long-run risk.
- **Untitled UI React** — React Aria + Tailwind v4, copy-paste; free MIT tier. **Not chosen:** its comprehensive set is behind a paid PRO tier ($349+) — the breadth violates free/OSS-only.
- **shadcn/ui** — the largest ecosystem (and the base for most AI kits), but **Radix-based, not React Aria**. **Not chosen:** react-aria-components was preferred for mobile/touch accessibility and Adobe backing. Its AI kits are referenced, not adopted.
- **Adobe's official React Aria + Tailwind examples** — the durable source-of-truth, installable via the shadcn registry, but an example set rather than a curated kit. **Retained as a supplement/fallback**, not the primary foundation.
