import { z } from "zod";
import { toolError, toolOk } from "../types/index.js";
import type { ToolResult } from "../types/index.js";
import { loadReference, listReferences } from "../lib/reference-loader.js";

export const title = "Get a Darkforge reference document";
export const description =
  "Returns the full markdown text of a bundled Darkforge reference (e.g. '04-aceternity', 'patterns/hero', '17-skeleton-system'). Use list_references to discover available names. References cover ~35 UI libraries plus pattern playbooks and were authored for the Darkforge Claude Code plugin — this tool exposes the same library to any MCP client.";

export const inputSchema = {
  name: z
    .string()
    .min(1)
    .describe(
      "Reference name as a path under refs/ without the .md suffix. Examples: '01-framer-motion', '04-aceternity', 'patterns/hero', 'patterns/dashboard', 'inspiration-tour'.",
    ),
};

interface Args {
  name: string;
}

/**
 * Suggest up to `limit` names from `available` that look closest to `query`.
 * Strategy (cheap, no extra deps):
 *   1) exact-prefix matches
 *   2) substring matches on the full name
 *   3) substring matches on the basename (last `/` segment)
 * Results are de-duplicated while preserving the order above.
 */
function nearestNames(query: string, available: string[], limit = 5): string[] {
  const needle = query.toLowerCase().replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
  if (!needle) return available.slice(0, limit);

  const seen = new Set<string>();
  const out: string[] = [];
  const push = (n: string) => {
    if (!seen.has(n)) {
      seen.add(n);
      out.push(n);
    }
  };

  for (const n of available) {
    if (n.toLowerCase().startsWith(needle)) push(n);
    if (out.length >= limit) return out;
  }
  for (const n of available) {
    if (n.toLowerCase().includes(needle)) push(n);
    if (out.length >= limit) return out;
  }
  for (const n of available) {
    const base = n.includes("/") ? n.slice(n.lastIndexOf("/") + 1) : n;
    if (base.toLowerCase().includes(needle)) push(n);
    if (out.length >= limit) return out;
  }
  return out;
}

export async function handler(args: Args): Promise<ToolResult> {
  const name = typeof args?.name === "string" ? args.name.trim() : "";
  if (!name) {
    return toolError("get_reference", "name is required", [
      "Pass a reference name like '01-framer-motion' or 'patterns/hero'",
      "Call list_references first to see every bundled reference",
      "Names are paths under refs/ without the .md suffix",
    ]);
  }

  try {
    const content = await loadReference(name);
    return toolOk(content, { name, length: content.length });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);

    let suggestions: string[] = [];
    try {
      const all = await listReferences();
      suggestions = nearestNames(name, all, 5);
    } catch {
      // listing failed too — fall through with empty suggestions
    }

    const fixes: string[] = [];
    if (suggestions.length > 0) {
      fixes.push(`Did you mean one of: ${suggestions.join(", ")}`);
    }
    fixes.push("Call list_references to see every bundled reference name");
    fixes.push("Names are paths under refs/ without the .md suffix (e.g. 'patterns/hero')");
    if (/Invalid reference name/i.test(msg)) {
      fixes.push("Avoid '..' segments and absolute paths in the name");
    }

    return toolError("get_reference", `Reference '${name}' not found`, fixes);
  }
}
