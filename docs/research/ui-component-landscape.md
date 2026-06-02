# Research: UI component landscape (foundation + AI/chat surfaces)

- **Status:** Research — backs [ADR-005](../decisions/005-ui-react-aria-intent.md). Snapshot 2026-06-02; this space moves fast, re-verify if reopened.
- **Purpose:** Pick the component **foundation** for the UI layer, decide how to source **AI/chat surfaces**, and confirm the **theming** story — all under the free/OSS + build-our-own (own-the-code) constraints.
- **Constraint recap:** all-TypeScript; free/OSS only; prefer **copy-paste / own-the-code** over component dependencies; built on **react-aria-components** (the chosen accessibility primitive).

## Component foundation (react-aria-components kits + HeroUI)

Stats verified via GitHub API on 2026-06-02.

| Library                       | Stars  | Last push        | License         | Distribution                | Built on                                                | Verdict                                                                                    |
| ----------------------------- | ------ | ---------------- | --------------- | --------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| **Intent UI** _(chosen)_      | ~1.9k  | 2026-05-30       | MIT             | **copy-paste** (shadcn CLI) | react-aria-components + Tailwind v4 + tailwind-variants | **Most comprehensive fully-MIT RAC kit, actively maintained, own-the-code.**               |
| HeroUI (ex-NextUI)            | ~29.5k | 2026-06-02       | Apache-2.0      | **npm** (`@heroui/*`)       | React Aria (hooks) + Tailwind v4                        | Polished + huge, but a **dependency** with its own theming. **Reference, not foundation.** |
| Jolly UI                      | ~1.1k  | 2025-01-31       | MIT             | copy-paste                  | react-aria-components (shadcn-theme)                    | **Dormant** (~16 mo, pre-TW4) — long-run risk.                                             |
| Untitled UI React             | ~1.8k  | 2026-06-01       | MIT (free tier) | copy-paste (CLI)            | React Aria + Tailwind v4                                | Free tier real, but **breadth is paid PRO ($349+)** → fails free/OSS-only.                 |
| Adobe RAC + Tailwind examples | —      | Adobe-maintained | Apache-2.0      | copy-paste (registry)       | react-aria-components                                   | Durable source-of-truth, but an **example set**, not a curated kit. Supplement/fallback.   |

**Decision:** **Intent UI** as the foundation. The copy-paste model neutralizes the single-maintainer bus factor (the code becomes ours, on Adobe's stable react-aria-components), and it's the most comprehensive free RAC kit. **HeroUI** is the strongest enhancement reference — Apache-2.0 on the same React Aria DNA — so we study its [GitHub repo](https://github.com/heroui-inc/heroui) and port specific component improvements onto the Intent UI/RAC base rather than depending on it.

## AI / chat surfaces

No AI/chat kit is built on react-aria-components — they're all Radix/shadcn-based. All are **references to reimplement on our foundation**, not dependencies.

| Kit                            | Distribution          | Built on                                      | Covers                                                                                     | License                    |
| ------------------------------ | --------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------ | -------------------------- |
| **prompt-kit** _(closest fit)_ | copy-paste            | shadcn/ui; **works on React Aria** primitives | prompt-input, message, markdown, code-block, streaming                                     | MIT                        |
| AI Elements (Vercel)           | copy-paste (registry) | shadcn/ui (Radix)                             | message, conversation, prompt-input, reasoning, tool, sources                              | Apache-2.0; assumes AI SDK |
| assistant-ui                   | **npm**               | Radix                                         | Thread, Composer, **BranchPicker**, **ChainOfThought**, runtimes (AI SDK/LangGraph/Mastra) | MIT                        |
| shadcn-chatbot-kit (Blazity)   | copy-paste            | shadcn/ui                                     | message list, prompt input, attachments, reasoning, tool                                   | MIT                        |
| Kibo UI                        | shadcn registry       | shadcn/ui                                     | AI components among a broader set                                                          | MIT                        |

**Approach:** reimplement the chat surface on Intent UI/RAC, **referencing prompt-kit** (the only one that ports cleanly to React Aria primitives), with **AI Elements** and **assistant-ui** as design references — assistant-ui's `BranchPicker` + `ChainOfThought` are direct references for the glass-box fork + reasoning display. The LLM **runtime** stays ours (wired to ADR-001 collections per build-our-own); these kits assume Vercel AI SDK / their own runtimes and are UI references only.

## Theming & theme switching

Odysseus ships a built-in **theme switcher** (a "Theme" sidebar destination) — a ring-1 parity feature. The chosen stack supports it natively:

- **Tailwind v4 CSS-variable tokens** + a theme provider → **light / dark / system** and **multiple named themes**.
- Intent UI ships dark-mode/theming support out of the box on this model.
- Concrete design tokens and palettes are an R1 implementation detail, not a separate architectural decision.

## Mapping to the three rings

- **Ring 1 (parity):** the chat surface + theme switching — covered by Intent UI + reimplemented chat components.
- **Ring 3 (best-of-breed imports):** polish/interactions ported from HeroUI and the AI kits — reference-and-reimplement.
- **Ring 2 (the wedge):** the work surface, glass-box run/step timeline + rewind/fork, and working-memory panel are **in no kit** — reconfirming the net-new finding ([`missing-features.md`](missing-features.md)). Built from scratch on react-aria-components.

## Sources

- [Intent UI](https://intentui.com/) · [github](https://github.com/intentui/intentui)
- [HeroUI](https://github.com/heroui-inc/heroui)
- [Jolly UI](https://www.jollyui.dev/) · [Untitled UI React](https://www.untitledui.com/react)
- [Adobe React Aria](https://react-aria.adobe.com/)
- [prompt-kit](https://www.prompt-kit.com/) · [AI Elements](https://elements.ai-sdk.dev/) · [assistant-ui](https://www.assistant-ui.com/) · [shadcn-chatbot-kit](https://github.com/Blazity/shadcn-chatbot-kit) · [Kibo UI](https://www.kibo-ui.com/)
