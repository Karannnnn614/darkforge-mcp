import { toolOk } from "../types/index.js";
import type { ToolResult } from "../types/index.js";
import { listReferences } from "../lib/reference-loader.js";

export const title = "List bundled Darkforge references";
export const description =
  "Lists every reference document bundled with Darkforge. Use get_reference to fetch the markdown for a name. References cover UI libraries (Framer Motion, GSAP, R3F, Aceternity, Magic UI, shadcn, ...) and pattern playbooks (hero, navbar, pricing, dashboard, ...).";

export const inputSchema = {};

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface Args {}

/**
 * Bucket a reference name into one of three categories:
 *   - "patterns" — anything under patterns/
 *   - "libraries" — top-level entries that look like a library doc (numbered
 *     prefix like "01-..." or the special "inspiration-tour")
 *   - "other" — anything else (future-proofing)
 */
function categoryOf(name: string): "libraries" | "patterns" | "other" {
  if (name.startsWith("patterns/")) return "patterns";
  if (/^\d{2,}-/.test(name)) return "libraries";
  if (name === "inspiration-tour") return "libraries";
  return "other";
}

export async function handler(_args: Args): Promise<ToolResult> {
  const names = await listReferences();

  const buckets: Record<"libraries" | "patterns" | "other", string[]> = {
    libraries: [],
    patterns: [],
    other: [],
  };
  for (const n of names) {
    buckets[categoryOf(n)].push(n);
  }

  const lines: string[] = [`Darkforge references (${names.length} total):`, ""];

  const sections: Array<["libraries" | "patterns" | "other", string]> = [
    ["libraries", "Libraries"],
    ["patterns", "Patterns"],
    ["other", "Other"],
  ];
  for (const [key, label] of sections) {
    const items = buckets[key];
    if (items.length === 0) continue;
    lines.push(`${label} (${items.length}):`);
    for (const item of items) {
      lines.push(`  - ${item}`);
    }
    lines.push("");
  }

  return toolOk(lines.join("\n").trimEnd(), { references: names, count: names.length });
}
