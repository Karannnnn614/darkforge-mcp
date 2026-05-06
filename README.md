# darkforge-mcp

> Forge AMOLED-dark, neon-glow, glassmorphism UI from any MCP-compatible AI tool — Claude Code, Cursor, Windsurf, Gemini CLI, Zed, Codex CLI.

Companion MCP server for the [Darkforge Claude Code plugin](https://github.com/Karannnnn614/Darkforge). The plugin ships static dark-UI knowledge inside Claude Code; this MCP server exposes the same generation power as 8 live tools every MCP client can call.

---

## v1.1 — pipeline, scaffold, references

`forge_component`, `forge_skeleton`, and `forge_page` run a typed pipeline: parse the description into a structural spec, build a semantic scaffold from it, apply variant primitives, apply motion, attach reference hints. The MCP server emits a correct semantic skeleton with explicit `/* ELABORATE: ... */` markers; the host AI fills the markers with copy and micro-decisions, using the bundled references as context.

### Pipeline

1. **`parseDescription`** detects structures (sidebar, nav, grid, hero, modal, strip, ...), counts (`"4 stat cards"` -> `{stat: 4}`), entities (`"for Microsoft, AWS, Google Cloud"` -> three names), style cues (`neon`, `glass`, `glow`, ...), motion cues (`stagger`, `hover-lift`, `on-mount`, ...), and a clean headline.
2. **`buildScaffold`** composes semantic JSX. Sidebar + stat layouts emit `<aside>` + `<main>` with N stat cards. Pricing tiers emit N tier cards with the middle one accented. Strips become horizontal `<ul>` of named entities. Where actual copy lives, the scaffold emits `/* ELABORATE: ... */` instead of placeholder text.
3. **`applyVariant`** mutates inline `style={{ ... }}` props on data-anchored elements to apply real visual primitives — `color-mix` borders + stacked glow shadows for neon, `backdrop-filter` + `--df-glass-bg` for glass, subtle borders for minimal.
4. **`applyMotion`** wraps the outermost element in `motion.*`, injects `useReducedMotion`, emits stagger child variants. `prefersReduced` is always referenced in the body — never declared and unused.
5. **`attachReferenceHints`** writes a per-reference elaboration block telling the host AI what to pull from each routed reference.

### Routing

Every `forge_*` call goes through `routeIntent(description)`:

1. Always returns `00-dark-tokens` first (the AMOLED token system + glass utilities + glow primitives).
2. Walks a manual synonym table for style/intent words (`glass`, `neon`, `stagger`, `partner`, `marquee`, `chip`, ...).
3. Walks the auto-generated table mirrored from the plugin's `SKILL.md` (literal library names — `aceternity`, `framer-motion`, `gsap`, ...).
4. Returns up to 4 references ranked tokens -> lib -> pattern.

### What's in the response

Every routed tool returns:

- The component code with embedded `/* ELABORATE: ... */` markers.
- An `-- BEGIN ELABORATION HINTS --` block that names each routed reference and a one-line guide on what to pull from it.
- `structuredContent.parsedSpec` — the parsed structural representation, for transparency.
- `structuredContent.appliedVariant` — the variant actually rendered (description cues can override the explicit arg).
- `structuredContent.motionApplied` — whether the motion path triggered.
- `structuredContent.routedReferences` — the reference names.
- `structuredContent.referenceExcerpts` — 800-char slices of each loaded reference's markdown.

`forge_dark` is a separate conversion tool — it takes light-themed code and rewrites it to AMOLED. It accepts an optional `description` field that gates additional per-element treatments (glass surfaces, per-chip glow, color-mix borders).

---

## Install

```bash
npm install -g darkforge-mcp
```

Or run on demand without installing:

```bash
npx darkforge-mcp
```

Requires Node.js 20+.

---

## Tools

| Tool | What it does |
|------|--------------|
| `scan_stack` | Reads `package.json`, maps installed libraries to Darkforge capabilities, returns a stack profile. Always run first. |
| `list_libraries` | Lists every UI library Darkforge has built-in knowledge for, optionally filtered by category. |
| `forge_component` | Generates a complete AMOLED-dark TSX/JSX component from a freeform description, tuned to the detected stack. Consults bundled references when the description matches a known library or pattern. |
| `forge_skeleton` | Generates a skeleton loading state matching the shape of a real component. Pulse + shimmer variants. Consults the skeleton-system reference. |
| `forge_dark` | Converts a light-themed Tailwind / inline-style component to AMOLED dark using `--df-*` tokens, with a diff-style change log. |
| `forge_page` | Generates a complete multi-section dark page (hero, features, pricing, etc.) tuned to a `pageType`. Consults pattern references per section. |
| `get_reference` | Returns the full markdown of any bundled Darkforge reference (e.g. `04-aceternity`, `patterns/hero`, `17-skeleton-system`). |
| `list_references` | Lists every bundled reference, grouped by libraries vs patterns. Use to discover names for `get_reference`. |

Every tool returns code as text — the host AI decides what to write to disk. No surprise file writes.

---

## Claude Code config

Add to `~/.claude/mcp.json` (or your project-scoped `.mcp.json`):

```json
{
  "mcpServers": {
    "darkforge": {
      "command": "npx",
      "args": ["darkforge-mcp"]
    }
  }
}
```

For other MCP clients (Cursor, Windsurf, Zed, Codex CLI), follow their docs — the command is the same.

---

## Example

```
You: scan_stack
Tool: Detected Next.js 15, Tailwind v4, framer-motion. 0 libraries missing.

You: forge_component { description: "glassmorphism pricing card with hover glow" }
Tool: [returns ~3KB of complete TSX using --df-glass-bg, --df-glow-violet,
       framer-motion entrance with prefers-reduced-motion guard]
```

The variant (`dark` / `glass` / `neon` / `minimal`) is inferred from the description automatically, or you can pass it explicitly to override.

---

## Related

- **[Darkforge Claude Code plugin](https://github.com/Karannnnn614/Darkforge)** — the static SKILL.md version, install via `/plugin marketplace add Karannnnn614/Darkforge`.
- **[Model Context Protocol](https://modelcontextprotocol.io)** — the open standard this server implements.

---

## License

MIT — built by [Karan](https://github.com/Karannnnn614).
