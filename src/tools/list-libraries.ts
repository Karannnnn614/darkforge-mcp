import { z } from "zod";
import { LIBRARY_MAP } from "../lib/library-map.js";
import { detectStack } from "../lib/stack-detector.js";
import { toolError, toolOk } from "../types/index.js";
import type { Category, ToolResult } from "../types/index.js";

export const title = "List supported libraries";
export const description =
  "Lists every UI library Darkforge has built-in knowledge for, optionally filtered by category. If a project path is provided, marks each library as installed/not installed.";

export const inputSchema = {
  category: z
    .enum(["animation", "components", "3d", "styling", "framework", "all"])
    .optional()
    .describe("Filter to one category. Omit or 'all' to list everything."),
  projectPath: z
    .string()
    .optional()
    .describe("If provided, marks each library as installed in the target project."),
};

interface Args {
  category?: Category | "all";
  projectPath?: string;
}

export async function handler(args: Args): Promise<ToolResult> {
  const wanted = !args.category || args.category === "all" ? null : args.category;

  let installedSet: Set<string> | null = null;
  if (args.projectPath) {
    try {
      const profile = await detectStack(args.projectPath);
      installedSet = new Set(profile.detectedLibraries);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return toolError("list_libraries", `could not read project at ${args.projectPath}: ${msg}`, [
        "Drop the projectPath argument to list without install detection",
        "Confirm the path points to a directory containing package.json",
      ]);
    }
  }

  const entries = Object.entries(LIBRARY_MAP)
    .filter(([, cap]) => (wanted ? cap.category === wanted : true))
    .map(([npmPackage, cap]) => ({
      name: cap.name,
      npmPackage,
      category: cap.category,
      darkforgeSupport: cap.support,
      ...(installedSet ? { installed: installedSet.has(npmPackage) } : {}),
    }));

  const grouped = entries.reduce<Record<string, typeof entries>>((acc, e) => {
    (acc[e.category] ??= []).push(e);
    return acc;
  }, {});

  const lines: string[] = [`Darkforge library catalog${wanted ? ` (${wanted})` : ""}:`, ``];
  for (const [cat, items] of Object.entries(grouped)) {
    lines.push(`── ${cat} ──`);
    for (const item of items) {
      const installedTag =
        installedSet === null ? "" : "installed" in item && item.installed ? "  [installed]" : "  [not installed]";
      lines.push(`  ${item.npmPackage.padEnd(30)} ${item.name} (${item.darkforgeSupport})${installedTag}`);
    }
    lines.push("");
  }

  return toolOk(lines.join("\n").trimEnd(), { libraries: entries });
}
