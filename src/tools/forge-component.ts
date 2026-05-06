/**
 * forge_component — pipeline-driven AMOLED dark component generator.
 *
 * Architecture (no template fallbacks, no hardcoded copy):
 *   1. parseDescription -> ParsedSpec (structures, counts, entities, cues, headline)
 *   2. routeIntent -> reference names; loadReference -> excerpts
 *   3. Concrete-spec gate: bail if no structures could be inferred
 *   4. buildScaffold -> semantic JSX (with /* ELABORATE: ... *\/ markers)
 *   5. chooseVariant + applyVariant -> real visual primitives (color-mix, glow stack, glass blur)
 *   6. applyMotion -> framer-motion wrap with reduced-motion guard (when motion cues present)
 *   7. renderComponent + deriveFilename -> final TSX/JSX file string
 *   8. attachReferenceHints -> elaboration block appended to text output
 *
 * The host AI consumes the scaffold + reference excerpts to fill in the
 * /* ELABORATE: ... *\/ markers. This module never invents copy.
 */

import { z } from "zod";
import { REFERENCE_EXCERPT_CHARS, toolError, toolOk } from "../types/index.js";
import type { ReferenceExcerpt, StackHint, ToolResult, Variant } from "../types/index.js";
import { detectStack } from "../lib/stack-detector.js";
import { routeIntent } from "../lib/reference-router.js";
import { loadReference } from "../lib/reference-loader.js";
import { parseDescription } from "../lib/description-parser.js";
import { buildScaffold } from "../lib/scaffold-builder.js";
import { applyVariant, chooseVariant } from "../lib/variant-applier.js";
import { applyMotion } from "../lib/motion-applier.js";
import { attachReferenceHints } from "../lib/reference-attacher.js";
import { renderComponent, deriveFilename } from "../lib/component-renderer.js";

export const title = "Forge a dark UI component";
export const description =
  "Generates a complete, production-ready AMOLED-dark component (TSX/JSX) from a freeform description, tuned to the user's installed stack and styled with Darkforge --df-* tokens. Run scan_stack first when unsure of the project's libraries.";

const componentTypeEnum = z.enum([
  "card",
  "hero",
  "button",
  "input",
  "modal",
  "navbar",
  "footer",
  "feature-grid",
  "cta",
  "testimonial",
  "stat",
  "pricing-tier",
]);

const variantEnum = z.enum(["dark", "glass", "neon", "minimal"]);

const frameworkEnum = z.enum([
  "nextjs",
  "nuxt",
  "vue",
  "svelte",
  "remix",
  "vite",
  "react",
  "unknown",
]);

const languageEnum = z.enum(["typescript", "javascript"]);

const stackSchema = z.object({
  animation: z.string().optional(),
  components: z.string().optional(),
  styling: z.string().optional(),
  framework: frameworkEnum.optional(),
  language: languageEnum.optional(),
});

export const inputSchema = {
  description: z
    .string()
    .min(1)
    .describe("Freeform description of the component to generate (e.g. 'glassmorphism pricing card with hover glow')."),
  componentType: componentTypeEnum
    .optional()
    .describe("Optional explicit component family. If omitted, inferred from the description."),
  variant: variantEnum
    .optional()
    .describe("Visual variant: dark (solid), glass (blur+translucent), neon (glow), or minimal (thin border). If omitted, inferred from the description (glass/neon/minimal keywords) and defaults to dark."),
  stack: stackSchema
    .optional()
    .describe("Optional explicit stack hint. Overrides detection when provided."),
  projectPath: z
    .string()
    .optional()
    .describe("Used only when stack is absent — Darkforge will run detectStack(projectPath ?? cwd())."),
};

type ComponentType = z.infer<typeof componentTypeEnum>;

interface ForgeArgs {
  description: string;
  componentType?: ComponentType;
  variant?: Variant;
  stack?: StackHint;
  projectPath?: string;
}

/** Resolve stack: explicit hint wins, else detect from package.json. */
async function resolveStack(args: ForgeArgs): Promise<StackHint> {
  if (args.stack) return { ...args.stack };
  const target = args.projectPath ?? process.env.DARKFORGE_PROJECT_ROOT ?? process.cwd();
  const profile = await detectStack(target);
  return {
    animation: profile.capabilities.animation[0],
    components: profile.capabilities.components[0],
    styling: profile.capabilities.styling[0],
    framework: profile.capabilities.framework,
    language: profile.capabilities.language,
  };
}

export async function handler(args: ForgeArgs): Promise<ToolResult> {
  try {
    if (!args.description || args.description.trim().length === 0) {
      return toolError("forge_component", "description is required and must be non-empty.", [
        "Pass a `description` like 'glassmorphism pricing card with hover glow'",
        "Run scan_stack first to confirm the project's stack",
      ]);
    }

    // 1. Stack
    let stack: StackHint;
    try {
      stack = await resolveStack(args);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return toolError(
        "forge_component",
        `Could not detect project stack: ${msg}`,
        [
          "Pass an explicit `stack` argument (animation, styling, framework, language)",
          "Pass `projectPath` pointing to a folder that contains package.json",
          "Run scan_stack first to verify what Darkforge can see",
        ],
      );
    }

    const language: "typescript" | "javascript" = stack.language ?? "typescript";

    // 2. Parse description (parser internally applies componentType -> structure fallback)
    const spec = parseDescription(args.description, args.componentType);

    // 3. Route + load references in parallel; skip refs that fail to load.
    const routedReferences = routeIntent(args.description);
    const referenceExcerpts: ReferenceExcerpt[] = (
      await Promise.all(
        routedReferences.map(async (name): Promise<ReferenceExcerpt | null> => {
          try {
            const md = await loadReference(name);
            return { name, excerpt: md.slice(0, REFERENCE_EXCERPT_CHARS) };
          } catch {
            return null;
          }
        }),
      )
    ).filter((x): x is ReferenceExcerpt => x !== null);

    // 4. Concrete-spec gate. parseDescription already applied the
    //    componentType fallback, so an empty structures array here means we
    //    truly have no anchor to scaffold against. The renderer never invents.
    if (spec.structures.length === 0) {
      return toolError(
        "forge_component",
        "Could not infer any concrete UI primitives (sidebar, hero, card, grid, ...) from the description.",
        [
          "Add a structural noun to the description (e.g. 'pricing card', 'hero section', 'sidebar with stat cards')",
          "Pass `componentType` explicitly (e.g. 'hero', 'card', 'feature-grid', 'pricing-tier')",
          "Mention quantities and entities — '4 stat cards', 'three plans', 'logo, nav, search' — to enrich the scaffold",
        ],
      );
    }

    // 5. Build scaffold from spec.
    let scaffold = buildScaffold(spec);

    // 6. Variant: explicit arg > styleCue inference > "dark" default.
    const effectiveVariant = chooseVariant(args.variant, spec.styleCues);
    scaffold = applyVariant(scaffold, effectiveVariant);

    // 7. Motion: only when framer-motion is available (routed or in stack)
    //    AND the description carries motion cues.
    const framerAvailable =
      routedReferences.includes("01-framer-motion") || stack.animation === "framer-motion";
    const motionResult = applyMotion(scaffold, spec.motionCues, framerAvailable);
    scaffold = motionResult.scaffold;
    const motionApplied = motionResult.applied;

    // 8. Render to a complete TSX/JSX file string.
    const componentCode = renderComponent(scaffold, { language });
    const filename = deriveFilename(scaffold, { language });

    // 9. Elaboration hints block (textual; does not modify jsx).
    const { elaborationBlock } = attachReferenceHints(scaffold.jsx, routedReferences, referenceExcerpts);

    const text = `// File: ${filename}\n${componentCode}\n${elaborationBlock}`;

    const structuredContent: Record<string, unknown> = {
      componentCode,
      filename,
      parsedSpec: {
        structures: spec.structures,
        counts: spec.counts,
        entities: spec.entities,
        styleCues: [...spec.styleCues],
        motionCues: [...spec.motionCues],
        headline: spec.headline,
      },
      appliedVariant: effectiveVariant,
      motionApplied,
      routedReferences,
      referenceExcerpts,
      tokensRequired: Array.from(scaffold.tokensUsed).sort(),
    };

    return toolOk(text, structuredContent);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return toolError("forge_component", `Unexpected failure while forging component: ${msg}`, [
      "Re-run with a simpler description to isolate the failing input",
      "Run scan_stack to confirm the project's stack is detectable",
      "If the error persists, capture the description + stack and file an issue",
    ]);
  }
}
