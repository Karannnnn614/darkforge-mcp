/**
 * Darkforge MCP — locked shared types
 * Tool agents MUST import from here. Do not redefine these types in tool files.
 */

export type Category = "animation" | "components" | "3d" | "styling" | "framework";
export type SupportLevel = "full" | "partial" | "fallback";
export type Framework = "nextjs" | "nuxt" | "vue" | "svelte" | "remix" | "vite" | "react" | "unknown";
export type Language = "typescript" | "javascript";
export type Variant = "dark" | "glass" | "neon" | "minimal";
export type Aggressiveness = "subtle" | "full" | "extreme";
export type SkeletonVariant = "pulse" | "shimmer" | "both";
export type PageType = "saas" | "product" | "portfolio" | "agency" | "startup" | "dashboard";

/**
 * Logical reference name as used by the loader and router — file-relative path
 * under `refs/` without the `.md` suffix (e.g. "01-framer-motion", "patterns/hero").
 * Concrete names are runtime-discovered from the bundled refs/ directory.
 */
export type ReferenceName = string;

export interface LibraryCapability {
  name: string;
  category: Category;
  support: SupportLevel;
  description?: string;
}

export interface StackProfile {
  detectedLibraries: string[];
  capabilities: {
    animation: string[];
    components: string[];
    threeD: string[];
    styling: string[];
    framework: Framework;
    language: Language;
  };
  recommendations: string[];
  forgeCommand: string;
}

/** Slim version passed into forge_* tools when scan_stack already ran */
export interface StackHint {
  animation?: string;
  components?: string;
  styling?: string;
  framework?: Framework;
  language?: Language;
}

/** All MCP tool handlers return this shape (CallToolResult-compatible) */
export interface ToolResult {
  content: Array<{ type: "text"; text: string }>;
  /**
   * Free-form structured payload. Convention for tools that consult the
   * reference router: include `routedReferences: ReferenceName[]` so host
   * AIs can see which references informed the output.
   */
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
}

/** Helper for error returns — every tool uses this for consistent UX */
export function toolError(toolName: string, message: string, fixes: string[]): ToolResult {
  const fixList = fixes.map((f, i) => `${i + 1}. ${f}`).join("\n");
  return {
    content: [
      {
        type: "text",
        text:
          `Darkforge error in ${toolName}: ${message}\n\n` +
          `What you can try:\n${fixList}\n` +
          `If the error persists, report at https://github.com/Karannnnn614/darkforge-mcp/issues`,
      },
    ],
    isError: true,
  };
}

/** Helper for success returns when a tool produces text + optional structured data */
export function toolOk(text: string, structured?: Record<string, unknown>): ToolResult {
  return {
    content: [{ type: "text", text }],
    ...(structured ? { structuredContent: structured } : {}),
  };
}
