/**
 * forge_skeleton — pipeline-driven skeleton (loading-state) generator.
 *
 * Pipeline:
 *   parseDescription -> buildScaffold -> skeletonize -> renderComponent
 *                                    -> attachReferenceHints
 *
 * The skeletonize step replaces every `{/* ELABORATE: ... *\/}` comment and
 * every plain-text JSX content slot with a placeholder bar span, applies
 * pulse/shimmer animation styling, and wraps the whole tree in a
 * `role="status" aria-busy` accessibility shell with inlined keyframes.
 *
 * Pure transform per call. No file I/O for output (the MCP host receives the
 * file as text and decides where to write it).
 */

import { z } from "zod";
import { REFERENCE_EXCERPT_CHARS, toolError, toolOk } from "../types/index.js";
import type {
  ParsedSpec,
  ReferenceExcerpt,
  Scaffold,
  SkeletonVariant,
  ToolResult,
} from "../types/index.js";
import { parseDescription } from "../lib/description-parser.js";
import { buildScaffold } from "../lib/scaffold-builder.js";
import { renderComponent, deriveFilename } from "../lib/component-renderer.js";
import { routeIntent } from "../lib/reference-router.js";
import { loadReference } from "../lib/reference-loader.js";
import { attachReferenceHints } from "../lib/reference-attacher.js";

export const title = "Forge skeleton loading state";
export const description =
  "Generates a skeleton (loading-state) component matched to the structure of a real component. The structural shape is mirrored from a description (or raw JSX), with text content replaced by animated placeholder bars. The host AI receives the file as text — Darkforge never writes to disk.";

/* -------------------------------------------------------------------------- */
/*  Input schema (LOCKED)                                                     */
/* -------------------------------------------------------------------------- */

export const inputSchema = {
  targetComponent: z
    .string()
    .optional()
    .describe(
      "Raw JSX/TSX source of a real component to mirror. The structural shape (counts of stats/cards/tiers) is extracted by lightweight regex.",
    ),
  componentDescription: z
    .string()
    .optional()
    .describe(
      "Plain-English description of the component shape (e.g. 'sidebar with 4 stat cards', 'pricing card', 'list row').",
    ),
  variant: z
    .enum(["pulse", "shimmer", "both"])
    .optional()
    .default("both")
    .describe("Animation variant to emit. Default: both (shimmer-driven, with pulse keyframes available for override)."),
  language: z
    .enum(["typescript", "javascript"])
    .optional()
    .default("typescript")
    .describe("Output language. TypeScript emits .tsx; JavaScript emits .jsx."),
};

interface Args {
  targetComponent?: string;
  componentDescription?: string;
  variant?: SkeletonVariant;
  language?: "typescript" | "javascript";
}

/* -------------------------------------------------------------------------- */
/*  Skeleton transformation                                                   */
/* -------------------------------------------------------------------------- */

const SKELETON_KEYFRAMES = `@keyframes df-skeleton-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.55; }
}
@keyframes df-skeleton-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
@media (prefers-reduced-motion: reduce) {
  [data-skeleton-text="true"], [data-skeleton-bar="true"] { animation: none !important; }
}`;

function pulseStyle(width: string, heightEm: string): string {
  return (
    `{{ display: "inline-block", width: "${width}", height: "${heightEm}", ` +
    `background: "var(--df-bg-elevated)", borderRadius: "4px", ` +
    `animation: "df-skeleton-pulse 1.5s ease-in-out infinite" }}`
  );
}

function shimmerStyle(width: string, heightEm: string): string {
  return (
    `{{ display: "inline-block", width: "${width}", height: "${heightEm}", ` +
    `backgroundImage: "linear-gradient(90deg, var(--df-bg-elevated) 0%, var(--df-bg-surface) 50%, var(--df-bg-elevated) 100%)", ` +
    `backgroundSize: "200% 100%", backgroundColor: "var(--df-bg-elevated)", borderRadius: "4px", ` +
    `animation: "df-skeleton-shimmer 1.6s linear infinite" }}`
  );
}

function placeholderStyle(animation: SkeletonVariant, width: string, heightEm: string): string {
  // "both" emits shimmer (the richer treatment); pulse keyframes are still
  // included in <style> so consumers can override via class if desired.
  if (animation === "pulse") return pulseStyle(width, heightEm);
  return shimmerStyle(width, heightEm);
}

function pickWidth(text: string): string {
  // Heuristic: shorter text -> narrower bar. Keeps mirrored proportions.
  const len = text.trim().length;
  if (len === 0) return "60%";
  if (len <= 6) return "32%";
  if (len <= 14) return "48%";
  if (len <= 28) return "64%";
  return "80%";
}

/**
 * Skeletonize a scaffold: replace ELABORATE comments and plain-text slots
 * with animated placeholder spans, wrap in a role="status" shell, and inline
 * the keyframes so the file is self-contained.
 */
function skeletonize(scaffold: Scaffold, animation: SkeletonVariant): Scaffold {
  let jsx = scaffold.jsx;

  // 1. Replace `{/* ELABORATE: ... */}` comments with placeholder spans.
  //    Lazy, dotall via [\s\S] so multi-line ELABORATE comments are caught.
  jsx = jsx.replace(/\{\/\*\s*ELABORATE:[\s\S]*?\*\/\}/g, () => {
    return `<span data-skeleton-text="true" style=${placeholderStyle(animation, "60%", "0.875em")} />`;
  });

  // 2. Replace plain text content between > and < with placeholder bars.
  //    Skip whitespace-only segments and JSX expressions (anything containing { or }).
  jsx = jsx.replace(/>([^<{}]+)</g, (full, raw: string) => {
    if (!/\S/.test(raw)) return full; // pure whitespace — preserve formatting
    const width = pickWidth(raw);
    const span = `<span data-skeleton-text="true" style=${placeholderStyle(animation, width, "0.875em")} />`;
    // Preserve surrounding whitespace (newline + indentation) so output stays readable.
    const lead = (raw.match(/^\s*/) ?? [""])[0];
    const trail = (raw.match(/\s*$/) ?? [""])[0];
    return `>${lead}${span}${trail}<`;
  });

  // 3. Wrap with role="status" + aria-busy and inline keyframes once.
  const wrapped = `<div role="status" aria-busy="true" aria-label="Loading..." data-skeleton-variant="${animation}">
  <style>{${JSON.stringify(SKELETON_KEYFRAMES)}}</style>
${indentLines(jsx, 2)}
  <span style={{ position: "absolute", width: "1px", height: "1px", padding: 0, margin: "-1px", overflow: "hidden", clip: "rect(0, 0, 0, 0)", whiteSpace: "nowrap", border: 0 }}>Loading...</span>
</div>`;

  return {
    ...scaffold,
    jsx: wrapped,
    componentName: scaffold.componentName.endsWith("Skeleton")
      ? scaffold.componentName
      : `${scaffold.componentName}Skeleton`,
  };
}

function indentLines(s: string, n: number): string {
  const pad = " ".repeat(n);
  return s
    .split("\n")
    .map((l) => (l.length > 0 ? pad + l : l))
    .join("\n");
}

/* -------------------------------------------------------------------------- */
/*  targetComponent fallback                                                  */
/* -------------------------------------------------------------------------- */

/**
 * When only raw JSX is supplied, do a coarse regex extraction of the count of
 * repeated structural elements. Falls back to a 3-card structure if nothing
 * useful is found.
 */
function extractCardCountFromJsx(source: string): number {
  // Count <article>, <li>, or <Card> as candidate repeated elements.
  const articles = (source.match(/<article\b/g) ?? []).length;
  const lis = (source.match(/<li\b/g) ?? []).length;
  const cards = (source.match(/<Card\b/g) ?? []).length;
  const best = Math.max(articles, lis, cards);
  if (best >= 2 && best <= 12) return best;
  return 3;
}

/* -------------------------------------------------------------------------- */
/*  Handler                                                                   */
/* -------------------------------------------------------------------------- */

export async function handler(args: Args): Promise<ToolResult> {
  try {
    const variant: SkeletonVariant = args.variant ?? "both";
    const language = args.language ?? "typescript";

    const hasDesc = !!args.componentDescription && args.componentDescription.trim().length > 0;
    const hasTarget = !!args.targetComponent && args.targetComponent.trim().length > 0;

    if (!hasDesc && !hasTarget) {
      return toolError(
        "forge_skeleton",
        "neither targetComponent nor componentDescription was supplied",
        [
          "Provide componentDescription (e.g. 'sidebar with 4 stat cards', 'pricing card')",
          "Or pass raw JSX as targetComponent so the shape can be mirrored",
        ],
      );
    }

    // 1. Source description for parsing. componentDescription wins; otherwise
    //    use the raw JSX so the description-parser can still pick up
    //    structural keywords (e.g. "card", "stat") that may appear in class
    //    names or comments.
    const sourceDescription = hasDesc
      ? (args.componentDescription ?? "")
      : (args.targetComponent ?? "");

    // 2. Parse with "skeleton" component-type fallback.
    const spec: ParsedSpec = parseDescription(sourceDescription, "skeleton");

    // 3. Ensure we have something to scaffold. If structures came up empty
    //    (common when only raw JSX was supplied), force a card grid with a
    //    count derived from the JSX (or 3 by default).
    if (spec.structures.length === 0) {
      spec.structures.push("card");
      const count = hasTarget ? extractCardCountFromJsx(args.targetComponent ?? "") : 3;
      if (spec.counts["card"] === undefined) spec.counts["card"] = count;
    }

    // 4. Route references. Append " skeleton" so 17-skeleton-system is
    //    reachable even when the description doesn't mention loading.
    const routingInput = `${sourceDescription} skeleton`;
    const routedReferences = routeIntent(routingInput);

    // 5. Load reference excerpts (best-effort).
    const referenceTexts: { name: string; markdown: string }[] = [];
    for (const name of routedReferences) {
      try {
        const md = await loadReference(name);
        referenceTexts.push({ name, markdown: md });
      } catch {
        // Loading is best-effort; missing refs do not abort the tool.
      }
    }

    // 6. Build the semantic scaffold from the spec.
    let scaffold = buildScaffold(spec);

    // 7. Apply the skeleton transformation (replaces ELABORATE + text slots).
    scaffold = skeletonize(scaffold, variant);

    // 8. Render the file.
    const componentCode = renderComponent(scaffold, { language });
    const filename = deriveFilename(scaffold, { language });

    // 9. Build elaboration hints block.
    const referenceExcerpts: ReferenceExcerpt[] = referenceTexts.map((r) => ({
      name: r.name,
      excerpt: r.markdown.slice(0, REFERENCE_EXCERPT_CHARS),
    }));
    const { elaborationBlock } = attachReferenceHints(
      scaffold.jsx,
      routedReferences,
      referenceExcerpts,
    );

    const text = `${componentCode}\n\n${elaborationBlock}`;

    return toolOk(text, {
      componentCode,
      filename,
      parsedSpec: {
        structures: spec.structures,
        counts: spec.counts,
        entities: spec.entities,
        styleCues: Array.from(spec.styleCues),
        motionCues: Array.from(spec.motionCues),
        headline: spec.headline,
      },
      routedReferences,
      referenceExcerpts,
      animationVariant: variant,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return toolError("forge_skeleton", msg, [
      "Provide either targetComponent or componentDescription",
      "Confirm the variant is one of pulse | shimmer | both",
      "If targetComponent failed to parse, simplify it or use componentDescription",
    ]);
  }
}
