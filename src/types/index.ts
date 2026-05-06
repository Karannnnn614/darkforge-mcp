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

/**
 * A single reference excerpt as surfaced in tool responses. The excerpt is
 * truncated (~800 chars) so the full payload across 4 references stays in a
 * sane size budget. Tools that consult the router include an array of these
 * in `structuredContent.referenceExcerpts`.
 */
export interface ReferenceExcerpt {
  name: ReferenceName;
  excerpt: string;
}

/** Public excerpt length (chars). Internal full markdown is uncapped. */
export const REFERENCE_EXCERPT_CHARS = 800;

/* ── pipeline types (description -> scaffold -> variant -> motion) ───────── */

/**
 * Layout/semantic primitive detected in a description. Order in a ParsedSpec
 * reflects first-occurrence in the source text. New entries here MUST also
 * add detection rules in description-parser.ts.
 */
export type Structure =
  | "sidebar"
  | "nav"
  | "grid"
  | "list"
  | "hero"
  | "modal"
  | "drawer"
  | "strip"
  | "card"
  | "tile"
  | "table"
  | "form"
  | "footer"
  | "header"
  | "breadcrumb"
  | "tabs"
  | "accordion"
  | "stat"
  | "pricing-tier"
  | "testimonial"
  | "feature";

/** Visual style cues. Drives variant resolution and per-element decoration. */
export type StyleCue =
  | "neon"
  | "glass"
  | "minimal"
  | "dark"
  | "amoled"
  | "glow"
  | "blur"
  | "gradient"
  | "mesh";

/** Motion intent cues. Drives whether and how motion-applier wraps the scaffold. */
export type MotionCue =
  | "reveal"
  | "fade"
  | "stagger"
  | "hover-lift"
  | "on-mount"
  | "scroll-trigger"
  | "parallax"
  | "magnetic";

/**
 * Parsed structural representation of a freeform description. Pure data.
 * Produced by `parseDescription`, consumed by every later pipeline stage.
 */
export interface ParsedSpec {
  /** Detected structures in first-occurrence order, deduped. */
  structures: Structure[];
  /** Map structure -> declared count (e.g. "4 stat cards" -> {stat: 4}). */
  counts: Record<string, number>;
  /** Named entities preserved verbatim from the description. */
  entities: string[];
  /** Style intent cues. */
  styleCues: Set<StyleCue>;
  /** Motion intent cues. */
  motionCues: Set<MotionCue>;
  /** Short, clean noun-phrase headline derived from the description. */
  headline: string;
  /** The original description, unmodified. */
  raw: string;
}

/**
 * A semantic JSX scaffold built from a ParsedSpec. The variant- and
 * motion-applier layers mutate `jsx` and `imports` in place; the renderer
 * assembles the final componentCode string.
 */
export interface Scaffold {
  /** PascalCase component name derived from the headline. */
  componentName: string;
  /** JSX body (the `return (...)` content, no surrounding function). */
  jsx: string;
  /** Imports needed by the body. Sorted/deduped at render time. */
  imports: ScaffoldImport[];
  /** Tokens used in the body. Recomputed by regex scan after each pipeline stage. */
  tokensUsed: Set<string>;
  /** Whether `prefersReduced` is referenced in jsx (motion path enabled). */
  usesPrefersReduced: boolean;
}

/** A single ESM import line specified structurally so the renderer can dedupe. */
export interface ScaffoldImport {
  /** e.g. "react", "framer-motion" */
  from: string;
  /** Default-imported binding (e.g. "* as React" -> { default: "* as React" }). */
  default?: string;
  /** Named imports. */
  named?: string[];
}

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
