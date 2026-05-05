# darkforge-mcp

> Forge AMOLED-dark, neon-glow, glassmorphism UI from any MCP-compatible AI tool — Claude Code, Cursor, Windsurf, Gemini CLI, Zed, Codex CLI.

Companion MCP server for the [Darkforge Claude Code plugin](https://github.com/Karannnnn614/Darkforge). The plugin ships static dark-UI knowledge inside Claude Code; this MCP server exposes the same generation power as 8 live tools every MCP client can call.

---

## v1.1 — bundled references

The MCP server bundles the same 45 reference documents the Darkforge Claude Code plugin uses (~44,000 lines covering Framer Motion, GSAP, Three.js / R3F, Aceternity, Magic UI, shadcn, Mantine, Lenis, dashboard patterns, hero patterns, the AMOLED token system, and more).

### How routing works

Every `forge_*` call goes through `routeIntent(description)` before generation. The router:

1. Always loads `00-dark-tokens` (the design-system foundation — token system, glass utility classes, neon glow utilities). No library knows you want dark UI by default; this anchor reference makes the variant decisions sane.
2. Walks a manual synonym table (style/intent vocabulary like `glass`, `neon`, `stagger`, `partner`, `marquee`, `chip`).
3. Walks the auto-generated table mirrored from the plugin's `SKILL.md` (literal library names like `aceternity`, `framer-motion`, `gsap`).
4. Returns up to 4 references ranked tokens → lib → pattern.

### How tools consume references

`forge_component`, `forge_skeleton`, and `forge_page` thread the loaded markdown into their template builders. Concrete consumption:

- Variant selection respects style cues — `glass chips, neon edge glow` triggers `--df-glass-bg` + `--df-glow-violet` emission per element, not just at the root.
- List builders extract named entities from the description (`for Microsoft, AWS, Google Cloud` → renders three placeholders/items, named verbatim — no stock placeholder content).
- Layout follows description over `componentType` — `feature-grid` plus `strip` produces a horizontal flex layout.
- Motion stagger is emitted when `01-framer-motion.md` is loaded AND the description mentions stagger / sequence / cascade words.
- Imports and `prefersReduced` are derived from the assembled body, never declared and unused.

`forge_dark` accepts an optional `description` field. When provided, it consults the same router and applies per-element treatments (glass utilities, color-mixed borders, named glow tokens) instead of just root-level enhancements.

Every routed tool returns `structuredContent.routedReferences` (names) and `structuredContent.referenceExcerpts` (800-char slices of each loaded markdown), so host AIs see what informed the result without a second round trip.

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
