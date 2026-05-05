# darkforge-mcp

> Forge AMOLED-dark, neon-glow, glassmorphism UI from any MCP-compatible AI tool — Claude Code, Cursor, Windsurf, Gemini CLI, Zed, Codex CLI.

Companion MCP server for the [Darkforge Claude Code plugin](https://github.com/Karannnnn614/Darkforge). The plugin ships static dark-UI knowledge inside Claude Code; this MCP server exposes the same generation power as 8 live tools every MCP client can call.

---

## v1.1 — combined mode

The MCP server now bundles the same 35+ reference documents the Darkforge Claude Code plugin uses (~44k lines of library knowledge spanning Framer Motion, GSAP, R3F, Aceternity, Magic UI, shadcn, Mantine, Lenis, dashboard patterns, hero patterns, and more).

- **Standalone** — works in any MCP client without the plugin. Schemas, tool names, and outputs are unchanged from v1.0.
- **Combined with the plugin** — in Claude Code, plugin static knowledge plus live MCP tools means generation can route the same intent through either path. The MCP tools internally consult the routing table; one new tool, `get_reference`, exposes the markdown directly to any host AI.

`forge_component`, `forge_page`, and `forge_skeleton` now route descriptions through the bundled reference table before generation. When a description matches a known library or pattern (e.g. "aceternity tracing beam hero" routes to `04-aceternity` + `patterns/hero`), the matched reference's markdown informs import choices and shows up as a `// Reference excerpt:` block in the tool output. The structured payload includes `routedReferences` so host AIs can see what informed the result.

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
