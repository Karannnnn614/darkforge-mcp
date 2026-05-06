/**
 * forge_page — pipeline-driven multi-section page generator.
 *
 * A "page" is a sequence of sections, each independently scaffolded through
 * the same pipeline used by forge_component:
 *
 *   parseDescription -> buildScaffold -> applyVariant -> applyMotion -> renderComponent
 *
 * The handler:
 *   1. Validates args. `pageType` is the only required field.
 *   2. Decides the section list (args.sections override > pageType defaults),
 *      auto-injecting a partner-logos strip when the description hints at it.
 *   3. Routes references ONCE for the whole page (pageType + sections + description).
 *   4. For each section: composes a per-section cue, parses it, scaffolds,
 *      applies variant + motion, renders TSX/JSX.
 *   5. Composes the final text output with `// === Section: <name> ===` delimiters
 *      and a single elaboration-hints block at the end.
 *
 * The host AI consumes the per-section scaffolds + reference excerpts to fill
 * in the /* ELABORATE: ... *\/ markers. This module never invents copy and
 * never renders hardcoded section templates.
 */

import { z } from "zod";
import { REFERENCE_EXCERPT_CHARS, toolError, toolOk } from "../types/index.js";
import type {
  PageType,
  ReferenceExcerpt,
  StackHint,
  ToolResult,
  Variant,
} from "../types/index.js";
import { detectStack } from "../lib/stack-detector.js";
import { routeIntent } from "../lib/reference-router.js";
import { loadReference } from "../lib/reference-loader.js";
import { parseDescription } from "../lib/description-parser.js";
import { buildScaffold } from "../lib/scaffold-builder.js";
import { applyVariant, chooseVariant } from "../lib/variant-applier.js";
import { applyMotion } from "../lib/motion-applier.js";
import { attachReferenceHints } from "../lib/reference-attacher.js";
import { renderComponent } from "../lib/component-renderer.js";

export const title = "Forge a complete dark page";
export const description =
  "Generates a multi-section AMOLED dark page (hero, features, pricing, etc.) by composing the same pipeline as forge_component once per section. Returns each section as an independent component plus a combined text output. Run scan_stack first when unsure of the project's libraries.";

const pageTypeEnum = z.enum(["saas", "product", "portfolio", "agency", "startup", "dashboard"]);
const themeEnum = z.enum(["dark", "glass", "neon"]);
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
  pageType: pageTypeEnum.describe(
    "Which template to forge. Determines the default section list and the routing/copy domain.",
  ),
  sections: z
    .array(z.string())
    .optional()
    .describe(
      "Optional override for the section list. Unknown section names render as generic dark sections (the scaffold builder has a generic fallback).",
    ),
  stack: stackSchema
    .optional()
    .describe("Pre-resolved stack hint. If omitted, forge_page calls detectStack(projectPath ?? cwd())."),
  projectPath: z
    .string()
    .optional()
    .describe("Project root used by detectStack when stack is not supplied."),
  theme: themeEnum
    .optional()
    .describe(
      "Visual treatment hint for surfaces and CTAs. Mapped to the variant pipeline (dark | glass | neon). Style cues in the description still take precedence.",
    ),
  description: z
    .string()
    .optional()
    .describe(
      "Free-text intent (e.g. 'dark saas landing with partner logos strip and staggered hero animations'). Routes additional references and can imply extra sections like a partner-logos strip.",
    ),
};

interface ForgeArgs {
  pageType: PageType;
  sections?: string[];
  stack?: StackHint;
  projectPath?: string;
  theme?: "dark" | "glass" | "neon";
  description?: string;
}

// ──────────────────────────────────────────────────────────────────────────────
// Section list resolution
// ──────────────────────────────────────────────────────────────────────────────

const DEFAULT_SECTIONS: Record<PageType, string[]> = {
  saas: ["hero", "features", "pricing", "testimonials", "cta", "footer"],
  product: ["hero", "features", "testimonials", "cta", "footer"],
  portfolio: ["hero", "features", "testimonials", "footer"],
  agency: ["hero", "features", "cta", "footer"],
  startup: ["hero", "features", "pricing", "cta", "footer"],
  dashboard: ["hero", "features", "footer"],
};

const PARTNER_LOGOS_HINT = /\bpartner\s+logos?\b|\blogo\s+strip\b|\bmarquee\b|\bbrand\s+strip\b/i;

/**
 * Per-section cue map. Section names that don't map cleanly to a Structure rule
 * in the description-parser get explicit cue text so `parseDescription` picks
 * the right primitive. Extending this map is the way to teach the page tool
 * about new section names without forking the parser.
 */
const SECTION_CUES: Record<string, string> = {
  hero: "hero section above the fold",
  features: "features grid section",
  pricing: "pricing tiers section",
  testimonials: "testimonials section",
  cta: "cta call to action section",
  footer: "footer section",
  "partner-logos": "partner logos strip marquee section",
  showcase: "feature grid showcase section",
  work: "feature grid work section",
  about: "feature grid about section",
  contact: "cta contact section",
  services: "feature grid services section",
  "case-studies": "feature grid case studies section",
  problem: "feature grid problem section",
  solution: "feature grid solution section",
  shell: "sidebar dashboard shell section",
  stats: "stat grid section",
  charts: "feature grid charts section",
  table: "table section",
};

function resolveSections(args: ForgeArgs): string[] {
  if (args.sections && args.sections.length > 0) return args.sections.slice();

  const sections = DEFAULT_SECTIONS[args.pageType].slice();

  // If the user's description hints at a partner-logos strip, ensure one is
  // present in the section list. Inserted after hero so it reads naturally.
  if (args.description && PARTNER_LOGOS_HINT.test(args.description)) {
    if (!sections.includes("partner-logos")) {
      const heroIdx = sections.indexOf("hero");
      const insertAt = heroIdx >= 0 ? heroIdx + 1 : 0;
      sections.splice(insertAt, 0, "partner-logos");
    }
  }
  return sections;
}

function sectionCueFor(section: string): string {
  return SECTION_CUES[section] ?? `${section} section`;
}

// ──────────────────────────────────────────────────────────────────────────────
// Filename helpers — guarantee uniqueness across sections of one page.
// (deriveFilename in component-renderer derives from scaffold.componentName,
//  which would collide when every section parses the same description.)
// ──────────────────────────────────────────────────────────────────────────────

function pascalCase(input: string): string {
  return input
    .split(/[\s\-_]+/)
    .filter(Boolean)
    .map((w) => (w[0] ?? "").toUpperCase() + w.slice(1).toLowerCase())
    .join("")
    .replace(/[^A-Za-z0-9]/g, "") || "Section";
}

function sectionComponentName(section: string): string {
  return `${pascalCase(section)}Section`;
}

function sectionFilename(section: string, language: "typescript" | "javascript"): string {
  const ext = language === "typescript" ? "tsx" : "jsx";
  return `${sectionComponentName(section)}.${ext}`;
}

// ──────────────────────────────────────────────────────────────────────────────
// Stack resolution (mirrors forge_component)
// ──────────────────────────────────────────────────────────────────────────────

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

// ──────────────────────────────────────────────────────────────────────────────
// Theme -> variant hint
// ──────────────────────────────────────────────────────────────────────────────

function themeAsVariantHint(theme: ForgeArgs["theme"]): Variant | undefined {
  if (theme === "neon") return "neon";
  if (theme === "glass") return "glass";
  // "dark" or undefined -> let chooseVariant decide from cues, fall back to dark.
  return undefined;
}

// ──────────────────────────────────────────────────────────────────────────────
// Per-section pipeline
// ──────────────────────────────────────────────────────────────────────────────

interface SectionResult {
  name: string;
  filename: string;
  componentCode: string;
  appliedVariant: Variant;
  motionApplied: boolean;
}

function forgeOneSection(
  section: string,
  baseDescription: string,
  themeHint: Variant | undefined,
  language: "typescript" | "javascript",
  framerAvailable: boolean,
): SectionResult {
  const perSectionDescription = `${baseDescription} ${sectionCueFor(section)}`.trim();
  const spec = parseDescription(perSectionDescription, undefined);

  // Note: forge_page intentionally does NOT bail on empty structures — the
  // scaffold builder has a generic dark-section fallback for unknown section
  // names ("shell", "showcase", ...). That's the correct behaviour here.
  let scaffold = buildScaffold(spec);

  const effectiveVariant = chooseVariant(themeHint, spec.styleCues);
  scaffold = applyVariant(scaffold, effectiveVariant);

  const motionResult = applyMotion(scaffold, spec.motionCues, framerAvailable);
  scaffold = motionResult.scaffold;

  // Override the scaffold's componentName so each section's filename and
  // exported function are unique within the page (the scaffold-builder
  // derives names from the headline, which repeats across sections of
  // one page when they all share `args.description`).
  scaffold = { ...scaffold, componentName: sectionComponentName(section) };

  const componentCode = renderComponent(scaffold, { language });
  const filename = sectionFilename(section, language);

  return {
    name: section,
    filename,
    componentCode,
    appliedVariant: effectiveVariant,
    motionApplied: motionResult.applied,
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// Handler
// ──────────────────────────────────────────────────────────────────────────────

export async function handler(args: ForgeArgs): Promise<ToolResult> {
  try {
    if (!args.pageType) {
      return toolError("forge_page", "pageType is required.", [
        "Pass `pageType` as one of: saas, product, portfolio, agency, startup, dashboard",
        "Optionally pass `sections` to override the default section list",
      ]);
    }

    let stack: StackHint;
    try {
      stack = await resolveStack(args);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return toolError("forge_page", `Could not detect project stack: ${msg}`, [
        "Pass an explicit `stack` argument (animation, styling, framework, language)",
        "Pass `projectPath` pointing to a folder that contains package.json",
        "Run scan_stack first to verify what Darkforge can see",
      ]);
    }

    const language: "typescript" | "javascript" = stack.language ?? "typescript";
    const baseDescription = args.description?.trim() ?? "";
    const sections = resolveSections(args);

    // Route once over the full intent (pageType + section list + description).
    // routeIntent always returns at least ["00-dark-tokens"]; section words like
    // "pricing", "footer", "testimonials" pull in pattern refs; "stagger"
    // synonyms in the description pull in 01-framer-motion.
    const routingText = [args.pageType, ...sections, baseDescription].filter(Boolean).join(" ");
    const routedReferences = routeIntent(routingText);

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

    // Compute framer availability ONCE outside the loop — it's a property of
    // the page's references + stack, not of any individual section.
    const framerAvailable =
      routedReferences.includes("01-framer-motion") || stack.animation === "framer-motion";

    const themeHint = themeAsVariantHint(args.theme);

    const sectionResults: SectionResult[] = sections.map((section) =>
      forgeOneSection(section, baseDescription, themeHint, language, framerAvailable),
    );

    // Compose the textual output:
    //   - Header line listing consulted references
    //   - Per-section block with the section delimiter + componentCode
    //   - Trailing single elaboration-hints block (the per-section advice is
    //     identical, no need to repeat it N times)
    const consultedNames = referenceExcerpts.map((r) => r.name);
    const referencesLine =
      consultedNames.length > 0
        ? `// References consulted: ${consultedNames.join(", ")}`
        : "// References consulted: (none)";
    const headerLines: string[] = [
      referencesLine,
      `// Page type: ${args.pageType}`,
      `// Sections (${sectionResults.length}): ${sectionResults.map((s) => s.name).join(", ")}`,
      `// Theme: ${args.theme ?? "dark"}`,
    ];
    const header = headerLines.join("\n");

    const sectionBlocks = sectionResults
      .map(
        (s) =>
          `// === Section: ${s.name} ===\n// File: ${s.filename}\n${s.componentCode}`,
      )
      .join("\n\n");

    // Single elaboration block — pass an empty jsx because we don't need
    // attachReferenceHints to inspect any one section's body; the hints are
    // about which references inform the elaboration, which is page-wide.
    const { elaborationBlock } = attachReferenceHints("", routedReferences, referenceExcerpts);

    const text = `${header}\n\n${sectionBlocks}\n\n${elaborationBlock}\n`;

    const structuredContent: Record<string, unknown> = {
      pageType: args.pageType,
      sections: sectionResults.map((s) => s.name),
      routedReferences,
      referenceExcerpts,
      sectionFiles: sectionResults.map((s) => ({
        name: s.name,
        filename: s.filename,
        componentCode: s.componentCode,
        appliedVariant: s.appliedVariant,
        motionApplied: s.motionApplied,
      })),
    };

    return toolOk(text, structuredContent);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return toolError("forge_page", `Unexpected failure while forging page: ${msg}`, [
      "Re-run with a simpler description to isolate the failing input",
      "Pass an explicit `stack` if auto-detection is failing",
      "Run scan_stack to confirm the project's stack is detectable",
      "If the error persists, capture the pageType + description + stack and file an issue",
    ]);
  }
}
