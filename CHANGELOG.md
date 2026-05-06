# Changelog

All notable changes to darkforge-mcp are documented here. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) · [SemVer](https://semver.org/).

## [1.1.0] — 2026-05-06

Architectural rebuild. Replaces the per-componentType template machinery with a typed pipeline: `parseDescription -> buildScaffold -> applyVariant -> applyMotion -> attachReferenceHints -> renderComponent`. References are surfaced as elaboration context for the host AI; the MCP server emits a correct semantic scaffold and stops there. Two prior v1.1 cuts shipped templates that ignored references and emitted hardcoded placeholder content; this rebuild deletes that machinery entirely.

### Added

- `refs/` — bundled reference library (45 markdown files, ~44,000 lines) mirrored from the plugin's `skills/forge/references/`.
- `scripts/sync-refs.mjs` — maintainer script that syncs `refs/` from the plugin (`--from-local <path>` or `--from-github`) and regenerates the routing table.
- `src/lib/reference-loader.ts` — loads markdown by logical name.
- `src/lib/reference-router.ts` — multi-match router with always-loaded `00-dark-tokens`, hand-maintained style/intent synonyms, and the auto-generated literal-name table. Returns up to 4 references ranked tokens -> lib -> pattern.
- `src/lib/reference-router.generated.ts` — auto-generated rows from the plugin's `SKILL.md` Phase 2 table.
- `src/lib/description-parser.ts` — pure parser: detects structures (sidebar, nav, grid, hero, modal, ...), counts ("4 stat cards" -> `{stat: 4}`), entities ("for Microsoft, AWS, Google Cloud"), style cues (neon, glass, glow, ...), motion cues (stagger, hover-lift, on-mount, ...), and a clean truncated headline.
- `src/lib/scaffold-builder.ts` — composes semantic JSX scaffolds from a ParsedSpec. Sidebar + stat layouts emit `<aside>` + `<main>` with N stat cards. Pricing tiers emit N tier cards with middle-tier accent. Entities are used verbatim; no placeholder content. Where elaboration belongs, emits `/* ELABORATE: ... */` markers.
- `src/lib/variant-applier.ts` — mutates inline `style={{ ... }}` props on data-anchored scaffold elements to apply variant primitives: neon (color-mix borders + stacked glow shadows), glass (backdrop-filter + glass-bg), minimal (subtle borders, no decoration).
- `src/lib/motion-applier.ts` — wraps the outermost element in `motion.*`, injects `useReducedMotion` and `prefersReduced` declaration, emits stagger child variants on data-anchored cards. `prefersReduced` is referenced in the body — never declared and unused.
- `src/lib/reference-attacher.ts` — emits the `-- BEGIN ELABORATION HINTS --` block that names each routed reference and tells the host AI what to pull from each.
- `src/lib/component-renderer.ts` — single source of truth for file emission: imports block (sorted, deduped), props interface, function signature, `prefersReduced` declaration only when consumed.
- `ReferenceExcerpt` type, `REFERENCE_EXCERPT_CHARS = 800`, `ParsedSpec`, `Scaffold`, `Structure`, `StyleCue`, `MotionCue` in `src/types/index.ts`.
- `get_reference` tool — returns the markdown text of any bundled reference.
- `list_references` tool — lists every bundled reference grouped by libraries vs patterns.
- `scripts/cross-check.mjs` — three architectural cross-check prompts (dashboard sidebar, glass pricing tier, hero with 3D) scored against a 5-point rubric.

### Changed

- `forge_component` (full rewrite, 1500 -> 204 lines) — runs the pipeline. No template builders, no `BuildContext`, no `pickTemplate`. When the parser detects no concrete structures and no `componentType` fallback applies, returns `toolError` rather than inventing placeholder content.
- `forge_skeleton` (full rewrite) — uses the same pipeline, then applies a `skeletonize` transformation that replaces text and `ELABORATE` markers with animated placeholder spans (pulse + shimmer keyframes), wraps in `role="status" aria-busy`.
- `forge_page` (full rewrite, 2312 -> 391 lines) — composes a page from N independently-pipelined sections, each scaffolded from the description plus a section-specific cue, with explicit `// === Section: <name> ===` delimiters.
- `forge_dark` — kept as a CONVERSION tool (Tailwind rule machinery preserved). Now consults `parseDescription(args.description)` to gate which transformation helpers fire. Still emits `routedReferences` + `referenceExcerpts` in `structuredContent`.
- `structuredContent` shape on the four forge tools: `parsedSpec` (transparency for the host AI), `appliedVariant`, `motionApplied`, `routedReferences`, `referenceExcerpts`.

### Verified

Three architectural cross-checks (chosen to detect overfit), each scored against a 5-point rubric of correct semantic structure, no placeholder strings, variant primitives present, motion path correct, headline clean:

- **A** "Dark dashboard sidebar with collapsible nav, 4 stat cards above the fold, neon-edged active state, framer-motion reveal on mount" -> **5/5**
- **B** "Glass pricing tier with three plans, neon CTA on the middle plan, framer-motion hover lift" -> **5/5**
- **C** "AMOLED hero section with kinetic typography, floating 3D ember orb, scroll-driven gradient mesh background, magnetic CTA button" -> **5/5**

### Notes

- References are read-only in this repo. Source-of-truth lives in the plugin (Karannnnn614/Darkforge); sync flows plugin -> MCP only.
- Bundle size: ~425 kB packed, ~1.7 MB unpacked.
- Tool count: 8. Schema additions only — no removes, no renames.

## [1.0.0] — 2026-05-03

First release. Six MCP tools for forging AMOLED-dark UI from any MCP-compatible AI tool — Claude Code, Cursor, Windsurf, Gemini CLI, Codex CLI, Zed.

### Added

- `scan_stack` — reads `package.json`, returns a Darkforge stack profile (animation, components, 3D, styling, framework, language).
- `list_libraries` — lists every UI library Darkforge knows about, filterable by category. Marks installed/not-installed when given a project path.
- `forge_component` — generates one complete AMOLED-dark TSX/JSX component from a freeform description, tuned to the detected stack. Variant (dark/glass/neon/minimal) inferred from description keywords.
- `forge_skeleton` — generates a skeleton loading state matching a real component's structure. Pulse + shimmer variants.
- `forge_dark` — converts a light Tailwind/inline component to AMOLED dark with `--df-*` tokens; produces a diff-style change log.
- `forge_page` — generates a multi-section dark page (saas/product/portfolio/agency/startup/dashboard) tuned to the detected stack.
- `scripts/smoke.mjs` — stdio smoke harness exercising every tool.
- Token system — full `--df-*` CSS variable block embedded in `src/lib/token-system.ts`.

### Notes

- Companion to the Darkforge Claude Code plugin (separate repo, same brand, same token system, same design language).
- Plugin repo: https://github.com/Karannnnn614/Darkforge

[1.1.0]: https://github.com/Karannnnn614/darkforge-mcp/releases/tag/v1.1.0
[1.0.0]: https://github.com/Karannnnn614/darkforge-mcp/releases/tag/v1.0.0
