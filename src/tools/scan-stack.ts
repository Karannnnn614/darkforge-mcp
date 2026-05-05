import { z } from "zod";
import { toolError, toolOk } from "../types/index.js";
import type { ToolResult } from "../types/index.js";
import { detectStack } from "../lib/stack-detector.js";

export const title = "Scan project stack";
export const description =
  "Scans the current project's package.json and maps installed libraries to Darkforge capabilities. Always run this first before forge_* tools.";

export const inputSchema = {
  projectPath: z
    .string()
    .optional()
    .describe("Absolute or relative path to the project root. Defaults to process.cwd() if omitted."),
};

export async function handler(args: { projectPath?: string }): Promise<ToolResult> {
  const target = args.projectPath ?? process.env.DARKFORGE_PROJECT_ROOT ?? process.cwd();

  try {
    const profile = await detectStack(target);

    const lines: string[] = [
      `Darkforge stack scan — ${target}`,
      ``,
      `Framework:      ${profile.capabilities.framework}`,
      `Language:       ${profile.capabilities.language}`,
      `Animation:      ${profile.capabilities.animation.join(", ") || "(none detected)"}`,
      `Components:     ${profile.capabilities.components.join(", ") || "(none detected)"}`,
      `3D:             ${profile.capabilities.threeD.join(", ") || "(none detected)"}`,
      `Styling:        ${profile.capabilities.styling.join(", ") || "(none detected)"}`,
      ``,
      `Detected libraries (${profile.detectedLibraries.length}):`,
      profile.detectedLibraries.length > 0
        ? profile.detectedLibraries.map((p) => `  - ${p}`).join("\n")
        : "  (none recognised by Darkforge)",
      ``,
    ];

    if (profile.recommendations.length > 0) {
      lines.push(`Recommendations to broaden capabilities:`);
      lines.push(...profile.recommendations.map((r) => `  + ${r}`));
      lines.push(``);
    }

    lines.push(`Next: ${profile.forgeCommand}`);

    return toolOk(lines.join("\n"), profile as unknown as Record<string, unknown>);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return toolError("scan_stack", msg, [
      `Confirm a package.json exists at: ${target}`,
      `Pass an explicit projectPath argument to scan_stack`,
      `If the file is malformed JSON, fix it and re-run`,
    ]);
  }
}
