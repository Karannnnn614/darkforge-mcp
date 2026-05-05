import { z } from "zod";
import { REFERENCE_EXCERPT_CHARS, toolError, toolOk } from "../types/index.js";
import type { ReferenceExcerpt, StackHint, ToolResult, Variant } from "../types/index.js";
import { detectStack } from "../lib/stack-detector.js";
import { routeIntent } from "../lib/reference-router.js";
import { loadReference } from "../lib/reference-loader.js";

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

interface BuildContext {
  description: string;
  componentName: string;
  filename: string;
  componentType: ComponentType;
  variant: Variant;
  stack: StackHint;
  language: "typescript" | "javascript";
  isTs: boolean;
  hasTailwind: boolean;
  hasFramerMotion: boolean;
  imports: string[];
  tokensRequired: Set<string>;
  /** Full markdown of every successfully-loaded reference. Empty array on full miss. */
  referenceTexts: { name: string; markdown: string }[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const KEYWORD_TO_TYPE: Array<[RegExp, ComponentType]> = [
  [/\bhero\b/i, "hero"],
  [/\bnav\s?bar\b|\bheader\b|\btop\s?nav\b/i, "navbar"],
  [/\bfooter\b/i, "footer"],
  [/\bmodal\b|\bdialog\b/i, "modal"],
  [/\bcard\b/i, "card"],
  [/\bbutton\b|\bcta\s+button\b/i, "button"],
  [/\binput\b|\btext\s?field\b|\bsearch\s?box\b/i, "input"],
  [/\bpricing\b|\btier\b|\bplan\b/i, "pricing-tier"],
  [/\btestimonial\b|\bquote\b|\breview\b/i, "testimonial"],
  [/\bstat\b|\bmetric\b|\bkpi\b/i, "stat"],
  [/\bfeature[s]?\s+grid\b|\bfeatures\b/i, "feature-grid"],
  [/\bcta\b|\bcall[- ]to[- ]action\b/i, "cta"],
];

function inferComponentType(description: string): ComponentType {
  for (const [re, type] of KEYWORD_TO_TYPE) {
    if (re.test(description)) return type;
  }
  return "card";
}

/**
 * Infer visual variant from description keywords. Order matters: `glass`
 * defines the surface substrate, `neon` is an accent treatment, `minimal`
 * is a stripped-back style. When multiple match, the surface-level cue wins.
 */
function inferVariant(description: string): Variant {
  if (/\bglass(morphism)?\b/i.test(description)) return "glass";
  if (/\bneon\b|\bglow\w*/i.test(description)) return "neon";
  if (/\bminimal\b|\bclean\b/i.test(description)) return "minimal";
  return "dark";
}

function toPascalCase(input: string): string {
  return input
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : ""))
    .join("");
}

function pickSlug(description: string, componentType: ComponentType): string {
  const stop = new Set([
    "a",
    "an",
    "the",
    "with",
    "and",
    "for",
    "of",
    "to",
    "in",
    "on",
    "card",
    "hero",
    "button",
    "input",
    "modal",
    "navbar",
    "footer",
    "feature",
    "features",
    "cta",
    "testimonial",
    "stat",
    "pricing",
    "tier",
    "plan",
    "dark",
    "glass",
    "neon",
    "minimal",
    "glowing",
    "glow",
    "section",
    "component",
    "ui",
    "modern",
    "sleek",
    "beautiful",
    "animated",
    "interactive",
    "responsive",
  ]);
  const words = description
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stop.has(w));
  const pick = words.slice(0, 2).join(" ");
  if (!pick) {
    return componentType === "card" ? "Feature" : "";
  }
  return toPascalCase(pick);
}

function buildComponentName(componentType: ComponentType, slug: string): string {
  const typePart = toPascalCase(componentType.replace(/-/g, " "));
  const name = (slug + typePart).replace(/[^A-Za-z0-9]/g, "");
  // Avoid double-naming e.g. "PricingPricingTier" — strip duplicate prefix tokens.
  return name || typePart;
}

function summariseStack(stack: StackHint): string {
  const parts: string[] = [];
  if (stack.framework && stack.framework !== "unknown") parts.push(stack.framework);
  if (stack.language) parts.push(stack.language);
  if (stack.styling) parts.push(stack.styling);
  if (stack.components) parts.push(stack.components);
  if (stack.animation) parts.push(stack.animation);
  return parts.length > 0 ? parts.join(" + ") : "vanilla react";
}

function looksLikeTailwind(stack: StackHint): boolean {
  const s = (stack.styling ?? "").toLowerCase();
  return s.includes("tailwind") || s === "twcss";
}

function looksLikeFramerMotion(stack: StackHint): boolean {
  const a = (stack.animation ?? "").toLowerCase();
  return a.includes("framer") || a === "motion";
}

function track(ctx: BuildContext, ...tokens: string[]): void {
  for (const t of tokens) ctx.tokensRequired.add(t);
}

// ── Reference consumption helpers ──────────────────────────────────────────

/** True when the named reference's markdown is loaded into ctx. */
function hasRef(ctx: BuildContext, name: string): boolean {
  return ctx.referenceTexts.some((r) => r.name === name);
}

/** Concatenated markdown of all loaded references — used for substring presence checks. */
function refsCombined(ctx: BuildContext): string {
  return ctx.referenceTexts.map((r) => r.markdown).join("\n");
}

/**
 * Extract entity names from a freeform description (e.g. "for Microsoft, AWS, Google Cloud").
 * Tries multiple lead-in keywords and a comma-sequence fallback, returning the longest
 * valid item list. Items must start with a capital letter.
 */
function extractItems(description: string): string[] {
  const candidates: string[] = [];
  const keywords = ["for", "with", "including", "featuring", "logos:?", "named"];
  for (const kw of keywords) {
    const re = new RegExp(
      `(?:${kw})\\s+([A-Z][^.]*?)(?=\\s+(?:and|that|which|where|so|to)\\b|[.!?]|$)`,
      "gi",
    );
    let m: RegExpExecArray | null;
    while ((m = re.exec(description)) !== null) {
      if (m[1]) candidates.push(m[1]);
    }
  }
  // Fallback: any sequence of 3+ comma-separated capitalised tokens anywhere.
  const seq = description.match(/[A-Z][a-zA-Z0-9 .]*?(?:,\s*[A-Z][a-zA-Z0-9 .]*?){2,}/);
  if (seq) candidates.push(seq[0]);

  let best: string[] = [];
  for (const body of candidates) {
    const items = body
      .split(/,|\s+and\s+/i)
      .map((s) => s.trim().replace(/[.!?]+$/, ""))
      .filter((s) => s.length > 0 && /^[A-Z]/.test(s));
    if (items.length > best.length) best = items;
  }
  return best;
}

/**
 * When 00-dark-tokens is loaded AND the description contains style cues, override
 * the variant. Returns undefined when no cue applies; preserves the default
 * inferVariant precedence otherwise. `args.variant` always wins (handled in handler).
 */
function cueDrivenVariant(description: string, hasTokensRef: boolean): Variant | undefined {
  if (!hasTokensRef) return undefined;
  if (/\bglass(morphism)?\b|\bblur card\b|\bfrosted\b/i.test(description)) return "glass";
  if (/\bneon\b|\bglow\w*\b|\bedge glow\b/i.test(description)) return "neon";
  return undefined;
}

/** True when description signals horizontal layout (strip / marquee / row of). */
function isHorizontalLayout(description: string): boolean {
  return /\bstrip\b|\bhorizontal\b|\bmarquee\b|\brow of\b/i.test(description);
}

/** True when description signals stagger/sequence motion. */
function isStaggered(description: string): boolean {
  return /\bstagger(ed)?\b|\bsequence\b|\bcascade\b/i.test(description);
}

// ── Style fragment builders (return JSX inline-style object literal text) ──

function variantSurface(ctx: BuildContext, opts: { radius?: "md" | "lg" | "xl" } = {}): string {
  const radius = opts.radius ?? "md";
  const radiusToken = `--df-radius-${radius}`;
  track(ctx, radiusToken);

  switch (ctx.variant) {
    case "glass":
      track(ctx, "--df-glass-bg", "--df-glass-border");
      return [
        `background: 'var(--df-glass-bg)'`,
        `border: '1px solid var(--df-glass-border)'`,
        `borderRadius: 'var(${radiusToken})'`,
        `backdropFilter: 'blur(12px)'`,
        `WebkitBackdropFilter: 'blur(12px)'`,
      ].join(", ");
    case "neon":
      track(ctx, "--df-bg-surface", "--df-neon-violet", "--df-glow-violet");
      return [
        `background: 'var(--df-bg-surface)'`,
        `border: '1px solid var(--df-neon-violet)'`,
        `borderRadius: 'var(${radiusToken})'`,
        `boxShadow: 'var(--df-glow-violet)'`,
      ].join(", ");
    case "minimal":
      track(ctx, "--df-bg-base", "--df-border-subtle");
      return [
        `background: 'var(--df-bg-base)'`,
        `border: '1px solid var(--df-border-subtle)'`,
        `borderRadius: 'var(${radiusToken})'`,
      ].join(", ");
    case "dark":
    default:
      track(ctx, "--df-bg-surface", "--df-border-default");
      return [
        `background: 'var(--df-bg-surface)'`,
        `border: '1px solid var(--df-border-default)'`,
        `borderRadius: 'var(${radiusToken})'`,
      ].join(", ");
  }
}

function focusRingStyleProps(ctx: BuildContext): string {
  track(ctx, "--df-border-focus");
  return `outline: 'none', outlineOffset: '2px'`;
}

// ── Per-component template content (returns body JSX as a string) ──────────

interface TemplateContent {
  /** JSX returned from the component body. */
  body: string;
  /** Optional inferred title for the file/usage block. */
  title: string;
  /** Optional inferred description text used inside the component. */
  copy: { title: string; subtitle?: string; cta?: string; meta?: string };
}

function inferCopy(ctx: BuildContext): TemplateContent["copy"] {
  const d = ctx.description.trim();
  // Try to lift a noun-phrase title from description; otherwise synthesize per type.
  const lifted = d
    .replace(/^(a|an|the)\s+/i, "")
    .replace(/\s+(component|section|ui|element)\s*$/i, "")
    .trim();
  const titleCase = lifted
    .split(/\s+/)
    .slice(0, 6)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ""))
    .join(" ");

  switch (ctx.componentType) {
    case "hero":
      return {
        title: titleCase || "Build the next dark interface",
        subtitle: "AMOLED-first design tokens, tuned animations, and zero compromise on accessibility.",
        cta: "Get started",
      };
    case "card":
      return {
        title: titleCase || "Real-time observability",
        subtitle: "Stream metrics, traces, and logs into one focused surface.",
      };
    case "pricing-tier":
      return {
        title: "Pro",
        subtitle: "For teams shipping serious dark interfaces.",
        cta: "Start trial",
        meta: "$24 / month",
      };
    case "testimonial":
      return {
        title: "It looks like a product I want to live in.",
        subtitle: "Mira Cheng — Design Lead, Northwind",
      };
    case "stat":
      return {
        title: "98.7%",
        subtitle: "Render budget headroom across the last 30 days.",
      };
    case "cta":
      return {
        title: titleCase || "Ship the dark UI your users deserve",
        subtitle: "Drop in tokens, run forge, and keep moving.",
        cta: "Start now",
      };
    case "button":
      return { title: titleCase || "Continue" };
    case "input":
      return { title: "Search" };
    case "modal":
      return {
        title: titleCase || "Confirm action",
        subtitle: "This step cannot be undone — please review before proceeding.",
        cta: "Confirm",
      };
    case "navbar":
      return { title: titleCase || "Darkforge" };
    case "footer":
      return { title: "Darkforge", subtitle: "Built for night-mode-first teams." };
    case "feature-grid":
      return {
        title: titleCase || "Everything you need to forge dark",
        subtitle: "A token-first system that adapts to your stack.",
      };
    default:
      return { title: titleCase || "Untitled" };
  }
}

function buildHero(ctx: BuildContext): TemplateContent {
  const copy = inferCopy(ctx);
  const surface = variantSurface(ctx, { radius: "xl" });
  track(
    ctx,
    "--df-text-primary",
    "--df-text-secondary",
    "--df-ember",
    "--df-glow-ember",
    "--df-dur-base",
    "--df-ease-out",
  );
  const tw = ctx.hasTailwind;

  // ── Reference consumption ────────────────────────────────────────────
  // When the hero description names entities (logos, partners, etc.) and we have
  // motion + stagger reference loaded, render an inline strip of staggered chips
  // beneath the headline. Pulls layout cues from patterns/features.md when present.
  const motionMd = ctx.referenceTexts.find((r) => r.name === "01-framer-motion")?.markdown ?? "";
  const featuresMd = ctx.referenceTexts.find((r) => r.name === "patterns/features")?.markdown ?? "";
  const tokensMd = ctx.referenceTexts.find((r) => r.name === "00-dark-tokens")?.markdown ?? "";
  const extracted = extractItems(ctx.description);
  const useExtracted = extracted.length >= 2 && !!featuresMd;
  const useStagger = ctx.hasFramerMotion && !!motionMd && isStaggered(ctx.description);
  const heroGlass = ctx.variant === "glass" && tokensMd.includes("--df-glass-bg");
  const heroNeon = ctx.variant === "neon" && tokensMd.includes("--df-glow-violet");
  if (useExtracted && heroGlass) track(ctx, "--df-glass-bg", "--df-glass-border");
  if (useExtracted && heroNeon) track(ctx, "--df-glow-violet", "--df-neon-violet");

  const containerClass = tw
    ? "relative mx-auto flex w-full max-w-5xl flex-col items-center gap-6 px-8 py-24 text-center"
    : "";
  const containerStyle = tw
    ? `{${surface} }`
    : `{${surface}, position: 'relative', maxWidth: '64rem', margin: '0 auto', padding: '6rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', textAlign: 'center' }`;

  const titleClass = tw ? "text-4xl font-semibold tracking-tight md:text-5xl" : "";
  const titleStyle = tw
    ? `{color: 'var(--df-text-primary)' }`
    : `{color: 'var(--df-text-primary)', fontSize: '3rem', fontWeight: 600, letterSpacing: '-0.02em', margin: 0 }`;

  const subClass = tw ? "max-w-2xl text-base md:text-lg" : "";
  const subStyle = tw
    ? `{color: 'var(--df-text-secondary)' }`
    : `{color: 'var(--df-text-secondary)', fontSize: '1.125rem', maxWidth: '40rem', margin: 0 }`;

  const btnClass = tw
    ? "inline-flex items-center gap-2 rounded-md px-5 py-3 text-sm font-medium transition focus-visible:outline focus-visible:outline-2"
    : "";
  const btnStyle = tw
    ? `{background: 'var(--df-ember)', color: 'var(--df-bg-base)', boxShadow: 'var(--df-glow-ember)', transition: 'transform var(--df-dur-base) var(--df-ease-out), box-shadow var(--df-dur-base) var(--df-ease-out)', outlineColor: 'var(--df-border-focus)' }`
    : `{background: 'var(--df-ember)', color: 'var(--df-bg-base)', boxShadow: 'var(--df-glow-ember)', padding: '0.75rem 1.25rem', borderRadius: 'var(--df-radius-md)', border: 'none', fontWeight: 500, fontSize: '0.875rem', cursor: 'pointer', transition: 'transform var(--df-dur-base) var(--df-ease-out), box-shadow var(--df-dur-base) var(--df-ease-out)', outlineColor: 'var(--df-border-focus)' }`;

  // Optional entity-strip (logos / partners) when description names ≥2 entities
  // and the patterns/features reference is loaded. Reuses motion + glass/neon
  // rules pulled from references.
  const stripChipTw = [
    "inline-flex items-center px-4 py-2 rounded-md text-sm font-medium",
    heroGlass ? "bg-[var(--df-glass-bg)] backdrop-blur-md border border-[var(--df-glass-border)]" : "",
    heroNeon ? "shadow-[var(--df-glow-violet)] border border-[var(--df-neon-violet)]" : "",
  ]
    .filter(Boolean)
    .join(" ");
  const chipInlineStyle = `{ padding: '0.5rem 1rem', borderRadius: 'var(--df-radius-md)', color: 'var(--df-text-primary)', fontSize: '0.875rem', fontWeight: 500${heroGlass ? `, background: 'var(--df-glass-bg)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid var(--df-glass-border)'` : ""}${heroNeon ? `, boxShadow: 'var(--df-glow-violet)', border: '1px solid var(--df-neon-violet)'` : ""} }`;
  const stripItemsExpr = useExtracted
    ? `[${extracted.map((s) => JSON.stringify(s)).join(", ")}]`
    : `[]`;
  const stripContainerTag =
    ctx.hasFramerMotion && useStagger ? "motion.ul" : "ul";
  const stripContainerProps =
    ctx.hasFramerMotion && useStagger
      ? `\n        initial="hidden"\n        animate="visible"\n        variants={{ visible: { transition: { staggerChildren: 0.06 } } }}`
      : "";
  const stripItemTag = ctx.hasFramerMotion && useStagger ? "motion.li" : "li";
  const stripItemProps =
    ctx.hasFramerMotion && useStagger
      ? `\n            initial={prefersReduced ? false : { opacity: 0, y: 8 }}\n            animate={{ opacity: 1, y: 0 }}\n            transition={prefersReduced ? { duration: 0 } : { delay: i * 0.05, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}`
      : "";
  const stripMapCallback =
    ctx.hasFramerMotion && useStagger
      ? `(name, i) => (
          <${stripItemTag} key={name} className=${classProp(stripChipTw)} style={${chipInlineStyle}}${stripItemProps}>
            {name}
          </${stripItemTag}>
        )`
      : `(name) => (
          <${stripItemTag} key={name} className=${classProp(stripChipTw)} style={${chipInlineStyle}}>
            {name}
          </${stripItemTag}>
        )`;
  const stripBlock = useExtracted
    ? `
      <${stripContainerTag} className=${classProp(tw ? "flex flex-row items-center gap-3 overflow-x-auto" : "")} style={${tw ? `{}` : `{display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '0.75rem', overflowX: 'auto', listStyle: 'none', padding: 0, margin: 0 }`}}${stripContainerProps}>
        {${stripItemsExpr}.map(${stripMapCallback})}
      </${stripContainerTag}>`
    : "";

  if (ctx.hasFramerMotion) {
    return {
      title: copy.title,
      copy,
      body: `<motion.section
      aria-labelledby="${idify(copy.title)}-title"
      className=${classProp(containerClass)}
      style={${containerStyle}}
      initial={prefersReduced ? false : { opacity: 0, y: 12 }}
      animate={prefersReduced ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
    >
      <h1 id="${idify(copy.title)}-title" className=${classProp(titleClass)} style={${titleStyle}}>
        ${escapeJsx(copy.title)}
      </h1>
      <p className=${classProp(subClass)} style={${subStyle}}>
        ${escapeJsx(copy.subtitle ?? "")}
      </p>
      <motion.button
        type="button"
        aria-label=${JSON.stringify(copy.cta ?? "Get started")}
        className=${classProp(btnClass)}
        style={${btnStyle}}
        whileHover={prefersReduced ? undefined : { y: -2, boxShadow: "0 0 28px rgba(249, 115, 22, 0.5)" }}
        whileTap={prefersReduced ? undefined : { scale: 0.98 }}
        onClick={onCtaClick}
      >
        ${escapeJsx(copy.cta ?? "Get started")}
      </motion.button>${stripBlock}
    </motion.section>`,
    };
  }

  return {
    title: copy.title,
    copy,
    body: `<section
      aria-labelledby="${idify(copy.title)}-title"
      className=${classProp(containerClass)}
      style={${containerStyle}}
    >
      <h1 id="${idify(copy.title)}-title" className=${classProp(titleClass)} style={${titleStyle}}>
        ${escapeJsx(copy.title)}
      </h1>
      <p className=${classProp(subClass)} style={${subStyle}}>
        ${escapeJsx(copy.subtitle ?? "")}
      </p>
      <button
        type="button"
        aria-label=${JSON.stringify(copy.cta ?? "Get started")}
        className=${classProp(btnClass)}
        style={${btnStyle}}
        onClick={onCtaClick}
      >
        ${escapeJsx(copy.cta ?? "Get started")}
      </button>${stripBlock}
    </section>`,
  };
}

function buildCard(ctx: BuildContext): TemplateContent {
  const copy = inferCopy(ctx);
  const surface = variantSurface(ctx, { radius: "md" });
  track(ctx, "--df-text-primary", "--df-text-secondary", "--df-dur-base", "--df-ease-out");
  const tw = ctx.hasTailwind;

  // ── Reference consumption ────────────────────────────────────────────
  // When 00-dark-tokens is loaded, layer the matching glass/neon class hint
  // straight onto the card so the output reads like the tokens md prescribes.
  const tokensMd = ctx.referenceTexts.find((r) => r.name === "00-dark-tokens")?.markdown ?? "";
  const cardGlass = ctx.variant === "glass" && tokensMd.includes("--df-glass-bg");
  const cardNeon = ctx.variant === "neon" && tokensMd.includes("--df-glow-violet");
  if (cardGlass) track(ctx, "--df-glass-bg", "--df-glass-border");
  if (cardNeon) track(ctx, "--df-glow-violet", "--df-neon-violet");

  const cardExtraTw = [
    cardGlass ? "bg-[var(--df-glass-bg)] backdrop-blur-md border border-[var(--df-glass-border)]" : "",
    cardNeon ? "shadow-[var(--df-glow-violet)]" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const wrapClass = tw
    ? `flex w-full max-w-sm flex-col gap-3 p-6${cardExtraTw ? " " + cardExtraTw : ""}`
    : "";
  const wrapStyle = tw
    ? `{${surface}, transition: 'transform var(--df-dur-base) var(--df-ease-out), box-shadow var(--df-dur-base) var(--df-ease-out)' }`
    : `{${surface}, display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1.5rem', maxWidth: '24rem', transition: 'transform var(--df-dur-base) var(--df-ease-out), box-shadow var(--df-dur-base) var(--df-ease-out)' }`;

  const titleStyle = tw
    ? `{color: 'var(--df-text-primary)' }`
    : `{color: 'var(--df-text-primary)', fontSize: '1.25rem', fontWeight: 600, margin: 0 }`;
  const subStyle = tw
    ? `{color: 'var(--df-text-secondary)' }`
    : `{color: 'var(--df-text-secondary)', fontSize: '0.875rem', lineHeight: 1.5, margin: 0 }`;
  const titleClass = tw ? "text-xl font-semibold" : "";
  const subClass = tw ? "text-sm leading-relaxed" : "";

  if (ctx.hasFramerMotion) {
    return {
      title: copy.title,
      copy,
      body: `<motion.article
      role="article"
      aria-label=${JSON.stringify(copy.title)}
      className=${classProp(wrapClass)}
      style={${wrapStyle}}
      initial={prefersReduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      whileHover={prefersReduced ? undefined : { y: -2, boxShadow: "0 0 24px rgba(167, 139, 250, 0.25)" }}
    >
      <h3 className=${classProp(titleClass)} style={${titleStyle}}>
        ${escapeJsx(copy.title)}
      </h3>
      <p className=${classProp(subClass)} style={${subStyle}}>
        ${escapeJsx(copy.subtitle ?? "")}
      </p>
    </motion.article>`,
    };
  }

  return {
    title: copy.title,
    copy,
    body: `<article
      role="article"
      aria-label=${JSON.stringify(copy.title)}
      className=${classProp(wrapClass)}
      style={${wrapStyle}}
    >
      <h3 className=${classProp(titleClass)} style={${titleStyle}}>
        ${escapeJsx(copy.title)}
      </h3>
      <p className=${classProp(subClass)} style={${subStyle}}>
        ${escapeJsx(copy.subtitle ?? "")}
      </p>
    </article>`,
  };
}

function buildButton(ctx: BuildContext): TemplateContent {
  const copy = inferCopy(ctx);
  track(
    ctx,
    "--df-ember",
    "--df-bg-base",
    "--df-glow-ember",
    "--df-radius-md",
    "--df-dur-fast",
    "--df-ease-out",
    "--df-border-focus",
  );
  const tw = ctx.hasTailwind;

  const cls = tw
    ? "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition focus-visible:outline focus-visible:outline-2"
    : "";
  const baseStyle = `{background: 'var(--df-ember)', color: 'var(--df-bg-base)', boxShadow: 'var(--df-glow-ember)', borderRadius: 'var(--df-radius-md)', border: 'none', cursor: 'pointer', padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: 500, transition: 'transform var(--df-dur-fast) var(--df-ease-out), box-shadow var(--df-dur-fast) var(--df-ease-out)', outlineColor: 'var(--df-border-focus)' }`;

  if (ctx.hasFramerMotion) {
    return {
      title: copy.title,
      copy,
      body: `<motion.button
      type="button"
      aria-label={ariaLabel ?? ${JSON.stringify(copy.title)}}
      className=${classProp(cls)}
      style={${baseStyle}}
      whileHover={prefersReduced ? undefined : { y: -1, boxShadow: "0 0 28px rgba(249, 115, 22, 0.5)" }}
      whileTap={prefersReduced ? undefined : { scale: 0.97 }}
      onClick={onClick}
      disabled={disabled}
    >
      {children ?? ${JSON.stringify(copy.title)}}
    </motion.button>`,
    };
  }

  return {
    title: copy.title,
    copy,
    body: `<button
      type="button"
      aria-label={ariaLabel ?? ${JSON.stringify(copy.title)}}
      className=${classProp(cls)}
      style={${baseStyle}}
      onClick={onClick}
      disabled={disabled}
    >
      {children ?? ${JSON.stringify(copy.title)}}
    </button>`,
  };
}

function buildInput(ctx: BuildContext): TemplateContent {
  const copy = inferCopy(ctx);
  track(
    ctx,
    "--df-bg-elevated",
    "--df-border-default",
    "--df-border-focus",
    "--df-text-primary",
    "--df-text-muted",
    "--df-radius-md",
    "--df-dur-fast",
    "--df-ease-out",
  );
  const tw = ctx.hasTailwind;
  const wrap = tw ? "flex w-full max-w-sm flex-col gap-2" : "";
  const wrapStyle = tw
    ? `{}`
    : `{display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: '24rem', width: '100%' }`;

  const labelStyle = tw
    ? `{color: 'var(--df-text-muted)' }`
    : `{color: 'var(--df-text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }`;
  const labelClass = tw ? "text-xs uppercase tracking-wider" : "";

  const inputClass = tw ? "w-full rounded-md px-3 py-2 text-sm transition outline-none" : "";
  const inputStyle = `{background: 'var(--df-bg-elevated)', border: '1px solid var(--df-border-default)', color: 'var(--df-text-primary)', borderRadius: 'var(--df-radius-md)', padding: '0.5rem 0.75rem', fontSize: '0.875rem', width: '100%', transition: 'border-color var(--df-dur-fast) var(--df-ease-out), box-shadow var(--df-dur-fast) var(--df-ease-out)' }`;

  return {
    title: copy.title,
    copy,
    body: `<label className=${classProp(wrap)} style={${wrapStyle}}>
      <span className=${classProp(labelClass)} style={${labelStyle}}>
        {label ?? ${JSON.stringify(copy.title)}}
      </span>
      <input
        type={type ?? "text"}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder ?? "Type to search…"}
        aria-label={label ?? ${JSON.stringify(copy.title)}}
        className=${classProp(inputClass)}
        style={${inputStyle}}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "var(--df-border-focus)";
          e.currentTarget.style.boxShadow = "0 0 0 3px rgba(249, 115, 22, 0.15)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "var(--df-border-default)";
          e.currentTarget.style.boxShadow = "none";
        }}
      />
    </label>`,
  };
}

function buildModal(ctx: BuildContext): TemplateContent {
  const copy = inferCopy(ctx);
  const surface = variantSurface(ctx, { radius: "lg" });
  track(
    ctx,
    "--df-bg-overlay",
    "--df-text-primary",
    "--df-text-secondary",
    "--df-ember",
    "--df-bg-base",
    "--df-radius-md",
    "--df-glow-ember",
    "--df-dur-base",
    "--df-ease-out",
  );
  const tw = ctx.hasTailwind;

  const overlayClass = tw ? "fixed inset-0 z-50 flex items-center justify-center p-4" : "";
  const overlayStyle = tw
    ? `{background: 'rgba(0, 0, 0, 0.72)', backdropFilter: 'blur(6px)' }`
    : `{position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(0, 0, 0, 0.72)', backdropFilter: 'blur(6px)' }`;

  const dialogClass = tw ? "flex w-full max-w-md flex-col gap-4 p-6" : "";
  const dialogStyle = tw
    ? `{${surface} }`
    : `{${surface}, display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem', width: '100%', maxWidth: '28rem' }`;

  const titleClass = tw ? "text-xl font-semibold" : "";
  const subClass = tw ? "text-sm leading-relaxed" : "";
  const rowClass = tw ? "mt-2 flex justify-end gap-2" : "";

  const titleStyle = tw
    ? `{color: 'var(--df-text-primary)' }`
    : `{color: 'var(--df-text-primary)', fontSize: '1.25rem', fontWeight: 600, margin: 0 }`;
  const subStyle = tw
    ? `{color: 'var(--df-text-secondary)' }`
    : `{color: 'var(--df-text-secondary)', fontSize: '0.875rem', lineHeight: 1.5, margin: 0 }`;

  const rowStyle = tw
    ? `{}`
    : `{display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }`;

  const cancelStyle = `{background: 'transparent', color: 'var(--df-text-secondary)', border: '1px solid var(--df-border-default)', borderRadius: 'var(--df-radius-md)', padding: '0.5rem 1rem', cursor: 'pointer', fontSize: '0.875rem' }`;
  const confirmStyle = `{background: 'var(--df-ember)', color: 'var(--df-bg-base)', borderRadius: 'var(--df-radius-md)', border: 'none', padding: '0.5rem 1rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500, boxShadow: 'var(--df-glow-ember)' }`;

  const motionWrap = ctx.hasFramerMotion;

  const dialogTag = motionWrap ? "motion.div" : "div";
  const overlayTag = motionWrap ? "motion.div" : "div";
  const motionOverlayProps = motionWrap
    ? `\n      initial={prefersReduced ? false : { opacity: 0 }}\n      animate={{ opacity: 1 }}\n      exit={{ opacity: 0 }}`
    : "";
  const motionDialogProps = motionWrap
    ? `\n      initial={prefersReduced ? false : { opacity: 0, y: 12, scale: 0.98 }}\n      animate={{ opacity: 1, y: 0, scale: 1 }}\n      exit={{ opacity: 0, y: 12, scale: 0.98 }}\n      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}`
    : "";

  return {
    title: copy.title,
    copy,
    body: `open ? (
      <${overlayTag}
        role="presentation"
        onClick={onClose}
        className=${classProp(overlayClass)}
        style={${overlayStyle}}${motionOverlayProps}
      >
        <${dialogTag}
          role="dialog"
          aria-modal="true"
          aria-labelledby="${idify(copy.title)}-title"
          onClick={(e) => e.stopPropagation()}
          className=${classProp(dialogClass)}
          style={${dialogStyle}}${motionDialogProps}
        >
          <h2 id="${idify(copy.title)}-title" className=${classProp(titleClass)} style={${titleStyle}}>
            ${escapeJsx(copy.title)}
          </h2>
          <p className=${classProp(subClass)} style={${subStyle}}>
            ${escapeJsx(copy.subtitle ?? "")}
          </p>
          <div className=${classProp(rowClass)} style={${rowStyle}}>
            <button type="button" aria-label="Cancel" onClick={onClose} style={${cancelStyle}}>
              Cancel
            </button>
            <button type="button" aria-label=${JSON.stringify(copy.cta ?? "Confirm")} onClick={onConfirm} style={${confirmStyle}}>
              ${escapeJsx(copy.cta ?? "Confirm")}
            </button>
          </div>
        </${dialogTag}>
      </${overlayTag}>
    ) : null`,
  };
}

function buildNavbar(ctx: BuildContext): TemplateContent {
  const copy = inferCopy(ctx);
  track(
    ctx,
    "--df-bg-base",
    "--df-glass-bg",
    "--df-glass-border",
    "--df-text-primary",
    "--df-text-secondary",
    "--df-ember",
    "--df-radius-md",
    "--df-dur-base",
    "--df-ease-out",
  );
  const tw = ctx.hasTailwind;

  const navClass = tw
    ? "sticky top-0 z-40 flex w-full items-center justify-between gap-6 px-6 py-3"
    : "";
  const navStyle = tw
    ? `{background: 'var(--df-glass-bg)', borderBottom: '1px solid var(--df-glass-border)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }`
    : `{position: 'sticky', top: 0, zIndex: 40, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem', padding: '0.75rem 1.5rem', background: 'var(--df-glass-bg)', borderBottom: '1px solid var(--df-glass-border)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }`;

  const brandStyle = tw
    ? `{color: 'var(--df-text-primary)' }`
    : `{color: 'var(--df-text-primary)', fontWeight: 600, fontSize: '1rem', textDecoration: 'none' }`;
  const brandClass = tw ? "text-base font-semibold" : "";

  const linksClass = tw ? "hidden items-center gap-5 md:flex" : "";
  const linksStyle = tw
    ? `{color: 'var(--df-text-secondary)' }`
    : `{display: 'flex', alignItems: 'center', gap: '1.25rem', color: 'var(--df-text-secondary)', fontSize: '0.875rem' }`;

  const ctaClass = tw
    ? "rounded-md px-3 py-1.5 text-sm font-medium transition focus-visible:outline focus-visible:outline-2"
    : "";
  const ctaStyle = `{background: 'var(--df-ember)', color: 'var(--df-bg-base)', borderRadius: 'var(--df-radius-md)', border: 'none', padding: '0.375rem 0.75rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500, transition: 'transform var(--df-dur-base) var(--df-ease-out)', outlineColor: 'var(--df-border-focus)' }`;

  return {
    title: copy.title,
    copy,
    body: `<nav
      role="navigation"
      aria-label="Primary"
      className=${classProp(navClass)}
      style={${navStyle}}
    >
      <a href="/" className=${classProp(brandClass)} style={${brandStyle}}>
        ${escapeJsx(copy.title)}
      </a>
      <ul className=${classProp(linksClass)} style={${linksStyle}}>
        {(items ?? defaultItems).map((item) => (
          <li key={item.href}>
            <a
              href={item.href}
              style={{ color: 'inherit', textDecoration: 'none' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--df-text-primary)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'inherit')}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
      <button type="button" aria-label="Get started" className=${classProp(ctaClass)} style={${ctaStyle}} onClick={onCtaClick}>
        Get started
      </button>
    </nav>`,
  };
}

function buildFooter(ctx: BuildContext): TemplateContent {
  const copy = inferCopy(ctx);
  track(
    ctx,
    "--df-bg-base",
    "--df-border-subtle",
    "--df-text-primary",
    "--df-text-muted",
  );
  const tw = ctx.hasTailwind;
  const wrapClass = tw
    ? "flex w-full flex-col gap-4 px-6 py-8 md:flex-row md:items-center md:justify-between"
    : "";
  const wrapStyle = tw
    ? `{background: 'var(--df-bg-base)', borderTop: '1px solid var(--df-border-subtle)' }`
    : `{display: 'flex', flexDirection: 'column', gap: '1rem', padding: '2rem 1.5rem', background: 'var(--df-bg-base)', borderTop: '1px solid var(--df-border-subtle)' }`;
  const brandStyle = tw
    ? `{color: 'var(--df-text-primary)' }`
    : `{color: 'var(--df-text-primary)', fontWeight: 600 }`;
  const subStyle = tw
    ? `{color: 'var(--df-text-muted)' }`
    : `{color: 'var(--df-text-muted)', fontSize: '0.75rem' }`;

  return {
    title: copy.title,
    copy,
    body: `<footer
      role="contentinfo"
      className=${classProp(wrapClass)}
      style={${wrapStyle}}
    >
      <div>
        <p style={${brandStyle}}>${escapeJsx(copy.title)}</p>
        <p style={${subStyle}}>${escapeJsx(copy.subtitle ?? "")}</p>
      </div>
      <p style={${subStyle}}>
        © {new Date().getFullYear()} ${escapeJsx(copy.title)}. All rights reserved.
      </p>
    </footer>`,
  };
}

function buildFeatureGrid(ctx: BuildContext): TemplateContent {
  const copy = inferCopy(ctx);
  const surface = variantSurface(ctx, { radius: "md" });
  track(
    ctx,
    "--df-text-primary",
    "--df-text-secondary",
    "--df-dur-base",
    "--df-ease-out",
  );
  const tw = ctx.hasTailwind;

  // ── Reference consumption ──────────────────────────────────────────────
  const tokensMd = ctx.referenceTexts.find((r) => r.name === "00-dark-tokens")?.markdown ?? "";
  const featuresMd = ctx.referenceTexts.find((r) => r.name === "patterns/features")?.markdown ?? "";
  const motionMd = ctx.referenceTexts.find((r) => r.name === "01-framer-motion")?.markdown ?? "";

  // Apply patterns/features rules: glass cards get glass-bg + backdrop blur when
  // variant is glass, and a per-card neon glow token whenever the description
  // signals neon/glow cues (additive on top of whatever surface variant). The
  // additive neon path lets prompts like "glass chips + neon edge glow" emit
  // BOTH treatments rather than picking one.
  const descSignalsNeon = /\bneon\b|\bglow\w*\b|\bedge glow\b/i.test(ctx.description);
  const hasGlassRule =
    !!featuresMd && tokensMd.includes("--df-glass-bg") && ctx.variant === "glass";
  const hasNeonRule =
    !!featuresMd &&
    tokensMd.includes("--df-glow-violet") &&
    (ctx.variant === "neon" || descSignalsNeon);

  if (hasGlassRule) track(ctx, "--df-glass-bg", "--df-glass-border");
  if (hasNeonRule) track(ctx, "--df-glow-violet", "--df-neon-violet");

  // Layout: horizontal strip when description signals it (strip/marquee/row of/horizontal).
  const horizontal = isHorizontalLayout(ctx.description);

  // Per-index stagger: enabled when motion ref loaded AND description signals stagger.
  const useStagger = ctx.hasFramerMotion && !!motionMd && isStaggered(ctx.description);

  // Extracted entity names (e.g. "Microsoft, AWS, Google Cloud") become the items,
  // overriding stock placeholders.
  const extracted = extractItems(ctx.description);
  const useExtracted = extracted.length >= 2;

  const sectionClass = tw ? "mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-16" : "";
  const sectionStyle = tw
    ? `{}`
    : `{maxWidth: '72rem', margin: '0 auto', padding: '4rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }`;
  const headerClass = tw ? "flex flex-col gap-2 text-center" : "";
  const headerStyle = tw
    ? `{}`
    : `{display: 'flex', flexDirection: 'column', gap: '0.5rem', textAlign: 'center' }`;

  const titleStyle = tw
    ? `{color: 'var(--df-text-primary)' }`
    : `{color: 'var(--df-text-primary)', fontSize: '2rem', fontWeight: 600, margin: 0 }`;
  const subStyle = tw
    ? `{color: 'var(--df-text-secondary)' }`
    : `{color: 'var(--df-text-secondary)', fontSize: '1rem', margin: 0 }`;
  const titleClass = tw ? "text-3xl font-semibold" : "";
  const subClass = tw ? "text-base" : "";

  // Layout class: horizontal flex strip vs. responsive grid.
  const gridClass = tw
    ? horizontal
      ? "flex items-center gap-6 overflow-x-auto"
      : "grid grid-cols-1 gap-4 md:grid-cols-3"
    : "";
  const gridStyle = tw
    ? `{}`
    : horizontal
      ? `{display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '1.5rem', overflowX: 'auto' }`
      : `{display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }`;

  // Per-cell styling — glass and neon rules pull from references.
  const glassCellTw = "bg-[var(--df-glass-bg)] backdrop-blur-md border border-[var(--df-glass-border)]";
  const neonCellTw = "shadow-[var(--df-glow-violet)] border border-[var(--df-neon-violet)]";
  const cellExtraTw = [hasGlassRule ? glassCellTw : "", hasNeonRule ? neonCellTw : ""]
    .filter(Boolean)
    .join(" ");

  const cellStyle = tw
    ? `{${surface}, transition: 'transform var(--df-dur-base) var(--df-ease-out)' }`
    : `{${surface}, padding: '1.5rem', transition: 'transform var(--df-dur-base) var(--df-ease-out)'${
        hasGlassRule
          ? `, background: 'var(--df-glass-bg)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid var(--df-glass-border)'`
          : ""
      }${hasNeonRule ? `, boxShadow: 'var(--df-glow-violet)', border: '1px solid var(--df-neon-violet)'` : ""} }`;
  const cellBaseClass = horizontal ? "flex flex-col items-center gap-2 p-6 shrink-0" : "flex flex-col gap-2 p-6";
  const cellClass = tw ? `${cellBaseClass}${cellExtraTw ? " " + cellExtraTw : ""}` : "";

  const cellTitleStyle = tw
    ? `{color: 'var(--df-text-primary)' }`
    : `{color: 'var(--df-text-primary)', fontSize: '1rem', fontWeight: 600, margin: 0 }`;
  const cellTitleClass = tw ? "text-base font-semibold" : "";
  const cellBodyStyle = tw
    ? `{color: 'var(--df-text-secondary)' }`
    : `{color: 'var(--df-text-secondary)', fontSize: '0.875rem', lineHeight: 1.5, margin: 0 }`;
  const cellBodyClass = tw ? "text-sm leading-relaxed" : "";

  // Choose item source: extracted strings or default features array.
  // When extracted, render as simple { title } items (each represents a logo/brand label).
  const itemsExpr = useExtracted
    ? `[${extracted.map((s) => JSON.stringify({ title: s, body: "" })).join(", ")}]`
    : `(features ?? defaultFeatures)`;

  // Cell tag — motion when staggered, plain li otherwise.
  const useMotionCell = useStagger;
  const cellTag = useMotionCell ? "motion.li" : "li";
  const motionCellProps = useMotionCell
    ? `\n            initial={prefersReduced ? false : { opacity: 0, y: 8 }}\n            animate={{ opacity: 1, y: 0 }}\n            transition={prefersReduced ? { duration: 0 } : { delay: i * 0.05, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}`
    : "";

  // Container tag — when staggering, use a motion.ul container with staggerChildren so the
  // per-index transition delay also has a parent variants-driven option mentioned in motion ref.
  const containerTag = useStagger ? "motion.ul" : "ul";
  const motionContainerProps = useStagger
    ? `\n        initial="hidden"\n        animate="visible"\n        variants={{ visible: { transition: { staggerChildren: 0.06 } } }}`
    : "";

  // Render: when extracted, show f.title prominent (logo label); skip body if empty.
  const cellInner = useExtracted
    ? `<h3 className=${classProp(cellTitleClass)} style={${cellTitleStyle}}>{f.title}</h3>`
    : `<h3 className=${classProp(cellTitleClass)} style={${cellTitleStyle}}>{f.title}</h3>
            <p className=${classProp(cellBodyClass)} style={${cellBodyStyle}}>{f.body}</p>`;

  const mapCallback = useMotionCell
    ? `(f, i) => (
          <${cellTag} key={f.title} className=${classProp(cellClass)} style={${cellStyle}}${motionCellProps}>
            ${cellInner}
          </${cellTag}>
        )`
    : `(f) => (
          <${cellTag} key={f.title} className=${classProp(cellClass)} style={${cellStyle}}>
            ${cellInner}
          </${cellTag}>
        )`;

  return {
    title: copy.title,
    copy,
    body: `<section
      aria-labelledby="${idify(copy.title)}-title"
      className=${classProp(sectionClass)}
      style={${sectionStyle}}
    >
      <header className=${classProp(headerClass)} style={${headerStyle}}>
        <h2 id="${idify(copy.title)}-title" className=${classProp(titleClass)} style={${titleStyle}}>
          ${escapeJsx(copy.title)}
        </h2>
        <p className=${classProp(subClass)} style={${subStyle}}>
          ${escapeJsx(copy.subtitle ?? "")}
        </p>
      </header>
      <${containerTag} className=${classProp(gridClass)} style={${gridStyle}}${motionContainerProps}>
        {${itemsExpr}.map(${mapCallback})}
      </${containerTag}>
    </section>`,
  };
}

function buildCta(ctx: BuildContext): TemplateContent {
  const copy = inferCopy(ctx);
  const surface = variantSurface(ctx, { radius: "lg" });
  track(
    ctx,
    "--df-text-primary",
    "--df-text-secondary",
    "--df-ember",
    "--df-bg-base",
    "--df-glow-ember",
    "--df-radius-md",
    "--df-dur-base",
    "--df-ease-out",
  );
  const tw = ctx.hasTailwind;

  const wrapClass = tw
    ? "mx-auto flex w-full max-w-4xl flex-col items-center gap-4 px-8 py-16 text-center"
    : "";
  const wrapStyle = tw
    ? `{${surface} }`
    : `{${surface}, maxWidth: '56rem', margin: '0 auto', padding: '4rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', textAlign: 'center' }`;

  const titleStyle = tw
    ? `{color: 'var(--df-text-primary)' }`
    : `{color: 'var(--df-text-primary)', fontSize: '2rem', fontWeight: 600, margin: 0 }`;
  const subStyle = tw
    ? `{color: 'var(--df-text-secondary)' }`
    : `{color: 'var(--df-text-secondary)', fontSize: '1rem', margin: 0 }`;
  const titleClass = tw ? "text-3xl font-semibold" : "";
  const subClass = tw ? "text-base" : "";

  const btnClass = tw
    ? "inline-flex items-center gap-2 rounded-md px-5 py-3 text-sm font-medium transition focus-visible:outline focus-visible:outline-2"
    : "";
  const btnStyle = `{background: 'var(--df-ember)', color: 'var(--df-bg-base)', borderRadius: 'var(--df-radius-md)', border: 'none', padding: '0.75rem 1.25rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500, boxShadow: 'var(--df-glow-ember)', transition: 'transform var(--df-dur-base) var(--df-ease-out)', outlineColor: 'var(--df-border-focus)' }`;

  return {
    title: copy.title,
    copy,
    body: `<section
      aria-labelledby="${idify(copy.title)}-title"
      className=${classProp(wrapClass)}
      style={${wrapStyle}}
    >
      <h2 id="${idify(copy.title)}-title" className=${classProp(titleClass)} style={${titleStyle}}>
        ${escapeJsx(copy.title)}
      </h2>
      <p className=${classProp(subClass)} style={${subStyle}}>
        ${escapeJsx(copy.subtitle ?? "")}
      </p>
      <button type="button" aria-label=${JSON.stringify(copy.cta ?? "Start now")} className=${classProp(btnClass)} style={${btnStyle}} onClick={onCtaClick}>
        ${escapeJsx(copy.cta ?? "Start now")}
      </button>
    </section>`,
  };
}

function buildTestimonial(ctx: BuildContext): TemplateContent {
  const copy = inferCopy(ctx);
  const surface = variantSurface(ctx, { radius: "md" });
  track(ctx, "--df-text-primary", "--df-text-muted", "--df-neon-cyan");
  const tw = ctx.hasTailwind;

  const wrapClass = tw ? "flex w-full max-w-md flex-col gap-3 p-6" : "";
  const wrapStyle = tw
    ? `{${surface} }`
    : `{${surface}, display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1.5rem', maxWidth: '28rem' }`;

  const quoteStyle = tw
    ? `{color: 'var(--df-text-primary)' }`
    : `{color: 'var(--df-text-primary)', fontSize: '1.125rem', lineHeight: 1.5, margin: 0, fontStyle: 'italic' }`;
  const quoteClass = tw ? "text-lg italic leading-relaxed" : "";

  const metaStyle = tw
    ? `{color: 'var(--df-text-muted)' }`
    : `{color: 'var(--df-text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }`;
  const metaClass = tw ? "text-xs uppercase tracking-wider" : "";

  return {
    title: copy.title,
    copy,
    body: `<figure
      className=${classProp(wrapClass)}
      style={${wrapStyle}}
    >
      <blockquote className=${classProp(quoteClass)} style={${quoteStyle}}>
        “${escapeJsx(copy.title)}”
      </blockquote>
      <figcaption className=${classProp(metaClass)} style={${metaStyle}}>
        ${escapeJsx(copy.subtitle ?? "")}
      </figcaption>
    </figure>`,
  };
}

function buildStat(ctx: BuildContext): TemplateContent {
  const copy = inferCopy(ctx);
  const surface = variantSurface(ctx, { radius: "md" });
  track(ctx, "--df-text-primary", "--df-text-secondary", "--df-neon-cyan");
  const tw = ctx.hasTailwind;

  const wrapClass = tw ? "flex w-full max-w-xs flex-col gap-1 p-5" : "";
  const wrapStyle = tw
    ? `{${surface} }`
    : `{${surface}, display: 'flex', flexDirection: 'column', gap: '0.25rem', padding: '1.25rem', maxWidth: '20rem' }`;

  const valueStyle = tw
    ? `{color: 'var(--df-neon-cyan)' }`
    : `{color: 'var(--df-neon-cyan)', fontSize: '2.25rem', fontWeight: 700, lineHeight: 1, margin: 0, fontVariantNumeric: 'tabular-nums' }`;
  const valueClass = tw ? "text-4xl font-bold tabular-nums leading-none" : "";

  const labelStyle = tw
    ? `{color: 'var(--df-text-secondary)' }`
    : `{color: 'var(--df-text-secondary)', fontSize: '0.875rem', margin: 0 }`;
  const labelClass = tw ? "text-sm" : "";

  return {
    title: copy.title,
    copy,
    body: `<div
      role="group"
      aria-label={label ?? ${JSON.stringify(copy.subtitle ?? "Statistic")}}
      className=${classProp(wrapClass)}
      style={${wrapStyle}}
    >
      <span className=${classProp(valueClass)} style={${valueStyle}}>
        {value ?? ${JSON.stringify(copy.title)}}
      </span>
      <span className=${classProp(labelClass)} style={${labelStyle}}>
        {label ?? ${JSON.stringify(copy.subtitle ?? "")}}
      </span>
    </div>`,
  };
}

function buildPricingTier(ctx: BuildContext): TemplateContent {
  const copy = inferCopy(ctx);
  const surface = variantSurface(ctx, { radius: "lg" });
  track(
    ctx,
    "--df-text-primary",
    "--df-text-secondary",
    "--df-text-muted",
    "--df-ember",
    "--df-bg-base",
    "--df-glow-ember",
    "--df-radius-md",
    "--df-dur-base",
    "--df-ease-out",
  );
  const tw = ctx.hasTailwind;

  const wrapClass = tw ? "flex w-full max-w-sm flex-col gap-4 p-7" : "";
  const wrapStyle = tw
    ? `{${surface} }`
    : `{${surface}, display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.75rem', maxWidth: '24rem' }`;

  const tierStyle = tw
    ? `{color: 'var(--df-text-muted)' }`
    : `{color: 'var(--df-text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }`;
  const tierClass = tw ? "text-xs uppercase tracking-widest" : "";

  const priceStyle = tw
    ? `{color: 'var(--df-text-primary)' }`
    : `{color: 'var(--df-text-primary)', fontSize: '2.25rem', fontWeight: 700, margin: 0 }`;
  const priceClass = tw ? "text-4xl font-bold" : "";

  const bodyStyle = tw
    ? `{color: 'var(--df-text-secondary)' }`
    : `{color: 'var(--df-text-secondary)', fontSize: '0.875rem', lineHeight: 1.5, margin: 0 }`;
  const bodyClass = tw ? "text-sm leading-relaxed" : "";

  const listStyle = tw
    ? `{color: 'var(--df-text-secondary)' }`
    : `{color: 'var(--df-text-secondary)', fontSize: '0.875rem', listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }`;
  const listClass = tw ? "flex list-none flex-col gap-2 text-sm" : "";

  const btnClass = tw
    ? "mt-2 inline-flex items-center justify-center rounded-md px-4 py-2.5 text-sm font-medium transition focus-visible:outline focus-visible:outline-2"
    : "";
  const btnStyle = `{background: 'var(--df-ember)', color: 'var(--df-bg-base)', borderRadius: 'var(--df-radius-md)', border: 'none', padding: '0.625rem 1rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500, boxShadow: 'var(--df-glow-ember)', transition: 'transform var(--df-dur-base) var(--df-ease-out)', outlineColor: 'var(--df-border-focus)', marginTop: '0.5rem' }`;

  return {
    title: copy.title,
    copy,
    body: `<article
      role="article"
      aria-label={${JSON.stringify(`${copy.title} plan`)}}
      className=${classProp(wrapClass)}
      style={${wrapStyle}}
    >
      <p className=${classProp(tierClass)} style={${tierStyle}}>${escapeJsx(copy.title)}</p>
      <p className=${classProp(priceClass)} style={${priceStyle}}>${escapeJsx(copy.meta ?? "$24")}<span style={{ color: 'var(--df-text-muted)', fontSize: '0.875rem', fontWeight: 400 }}> / mo</span></p>
      <p className=${classProp(bodyClass)} style={${bodyStyle}}>${escapeJsx(copy.subtitle ?? "")}</p>
      <ul className=${classProp(listClass)} style={${listStyle}}>
        {(features ?? defaultFeatures).map((f) => (
          <li key={f}>• {f}</li>
        ))}
      </ul>
      <button type="button" aria-label=${JSON.stringify(copy.cta ?? "Start trial")} className=${classProp(btnClass)} style={${btnStyle}} onClick={onCtaClick}>
        ${escapeJsx(copy.cta ?? "Start trial")}
      </button>
    </article>`,
  };
}

// ── JSX text utilities ─────────────────────────────────────────────────────

function escapeJsx(s: string): string {
  return s.replace(/\{/g, "&#123;").replace(/\}/g, "&#125;");
}

function classProp(cls: string): string {
  if (!cls) return `""`;
  return JSON.stringify(cls);
}

function idify(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 32) || "df"
  );
}

// ── Component file assembly ────────────────────────────────────────────────

function pickTemplate(ctx: BuildContext): TemplateContent {
  switch (ctx.componentType) {
    case "hero":
      return buildHero(ctx);
    case "button":
      return buildButton(ctx);
    case "input":
      return buildInput(ctx);
    case "modal":
      return buildModal(ctx);
    case "navbar":
      return buildNavbar(ctx);
    case "footer":
      return buildFooter(ctx);
    case "feature-grid":
      return buildFeatureGrid(ctx);
    case "cta":
      return buildCta(ctx);
    case "testimonial":
      return buildTestimonial(ctx);
    case "stat":
      return buildStat(ctx);
    case "pricing-tier":
      return buildPricingTier(ctx);
    case "card":
    default:
      return buildCard(ctx);
  }
}

interface PropDecl {
  name: string;
  tsType: string;
  optional: boolean;
  /** When true the prop is destructured with a default initializer in JS mode. */
  jsDefault?: string;
}

function propsForType(componentType: ComponentType): PropDecl[] {
  switch (componentType) {
    case "hero":
    case "cta":
      return [{ name: "onCtaClick", tsType: "() => void", optional: true }];
    case "button":
      return [
        { name: "children", tsType: "React.ReactNode", optional: true },
        { name: "onClick", tsType: "() => void", optional: true },
        { name: "disabled", tsType: "boolean", optional: true },
        { name: "ariaLabel", tsType: "string", optional: true },
      ];
    case "input":
      return [
        { name: "value", tsType: "string", optional: true },
        { name: "onChange", tsType: "(value: string) => void", optional: true },
        { name: "placeholder", tsType: "string", optional: true },
        { name: "label", tsType: "string", optional: true },
        { name: "type", tsType: "string", optional: true },
      ];
    case "modal":
      return [
        { name: "open", tsType: "boolean", optional: false },
        { name: "onClose", tsType: "() => void", optional: false },
        { name: "onConfirm", tsType: "() => void", optional: true },
      ];
    case "navbar":
      return [
        {
          name: "items",
          tsType: "Array<{ label: string; href: string }>",
          optional: true,
        },
        { name: "onCtaClick", tsType: "() => void", optional: true },
      ];
    case "feature-grid":
      return [
        {
          name: "features",
          tsType: "Array<{ title: string; body: string }>",
          optional: true,
        },
      ];
    case "stat":
      return [
        { name: "value", tsType: "string", optional: true },
        { name: "label", tsType: "string", optional: true },
      ];
    case "pricing-tier":
      return [
        { name: "features", tsType: "string[]", optional: true },
        { name: "onCtaClick", tsType: "() => void", optional: true },
      ];
    case "card":
    case "footer":
    case "testimonial":
    default:
      return [];
  }
}

function renderPropsType(componentName: string, props: PropDecl[]): string {
  if (props.length === 0) {
    return `interface ${componentName}Props {}\n\n`;
  }
  const lines = props
    .map((p) => `  ${p.name}${p.optional ? "?" : ""}: ${p.tsType};`)
    .join("\n");
  return `interface ${componentName}Props {\n${lines}\n}\n\n`;
}

function renderDestructure(props: PropDecl[]): string {
  if (props.length === 0) return "";
  return `{ ${props.map((p) => p.name).join(", ")} }`;
}

function renderExtraDefaults(componentType: ComponentType): string {
  switch (componentType) {
    case "navbar":
      return `  const defaultItems = [
    { label: "Product", href: "#product" },
    { label: "Docs", href: "#docs" },
    { label: "Pricing", href: "#pricing" },
    { label: "Changelog", href: "#changelog" },
  ];\n`;
    case "feature-grid":
      return `  const defaultFeatures = [
    { title: "Token-driven", body: "Every color is a CSS variable, so retheming costs nothing." },
    { title: "Motion-aware", body: "Animations respect prefers-reduced-motion out of the box." },
    { title: "Accessible", body: "Focus rings, ARIA labels, and contrast baked into every primitive." },
  ];\n`;
    case "pricing-tier":
      return `  const defaultFeatures = [
    "Unlimited components",
    "Priority support",
    "Custom token bundles",
    "Team analytics",
  ];\n`;
    default:
      return "";
  }
}

function buildComponentCode(ctx: BuildContext, template: TemplateContent): string {
  const { componentName, isTs } = ctx;
  const props = propsForType(ctx.componentType);
  const propsInterface = isTs ? renderPropsType(componentName, props) : "";
  const propsTypeSuffix = isTs ? `: ${componentName}Props` : "";

  const destructured = renderDestructure(props);
  const sigParam = destructured ? `${destructured}${propsTypeSuffix}` : `_props${propsTypeSuffix}`;

  const extraDefaults = renderExtraDefaults(ctx.componentType);

  const usesReturnExpression = ctx.componentType === "modal";
  const returnStatement = usesReturnExpression
    ? `  return ${template.body};`
    : `  return (\n    ${template.body}\n  );`;

  // ── Import & decl derivation: scan the body, then emit only what's actually used. ──
  // The previous build emitted React + framer-motion imports unconditionally based on
  // the stack hint, which produced unused imports when a builder happened not to use
  // motion. Instead, scan the final body string and only emit symbols it references.
  const bodyForScan = `${extraDefaults}${returnStatement}`;
  const usesMotion = /\bmotion\.[a-zA-Z]+/.test(bodyForScan) || /<Motion\b/.test(bodyForScan);
  const usesPrefersReduced = bodyForScan.includes("prefersReduced");
  const usesReactSymbol =
    /\bReact\./.test(bodyForScan) || props.some((p) => /\bReact\./.test(p.tsType));

  const imports: string[] = [];
  if (usesReactSymbol) imports.push(`import * as React from "react";`);
  if (usesMotion) {
    const motionParts = ["motion"];
    if (usesPrefersReduced) motionParts.push("useReducedMotion");
    imports.push(`import { ${motionParts.join(", ")} } from "framer-motion";`);
  }
  ctx.imports.length = 0;
  ctx.imports.push(...imports);

  const reducedMotionDecl = usesPrefersReduced
    ? `  const prefersReduced = useReducedMotion();\n`
    : "";

  const importBlock = imports.length > 0 ? `${imports.join("\n")}\n\n` : "";
  const reactWarning = !ctx.hasTailwind
    ? `// NOTE: This component relies on Darkforge --df-* tokens. Make sure DF_TOKENS_CSS\n// is loaded once in your global stylesheet (e.g. globals.css or app entry).\n`
    : "";

  const fnBody = `${reducedMotionDecl}${extraDefaults}${returnStatement}`;

  const componentFn = `export default function ${componentName}(${sigParam}) {
${fnBody}
}
`;

  return `${importBlock}${reactWarning}${propsInterface}${componentFn}`;
}

/** Scan generated code for `var(--df-*)` references and return the bare token names. */
function deriveTokensFromCode(code: string): string[] {
  const found = new Set<string>();
  const re = /var\((--df-[a-z0-9-]+)\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(code)) !== null) {
    if (m[1]) found.add(m[1]);
  }
  return Array.from(found).sort();
}

function buildUsageExample(ctx: BuildContext, copy: TemplateContent["copy"]): string {
  const importPath = `./${ctx.componentName}`;
  const tagOpen = `<${ctx.componentName}`;
  switch (ctx.componentType) {
    case "modal":
      return `import ${ctx.componentName} from "${importPath}";\n\n${tagOpen} open={isOpen} onClose={() => setIsOpen(false)} onConfirm={handleConfirm} />`;
    case "button":
      return `import ${ctx.componentName} from "${importPath}";\n\n${tagOpen} onClick={() => console.log("clicked")}>${escapeJsx(copy.title)}</${ctx.componentName}>`;
    case "input":
      return `import ${ctx.componentName} from "${importPath}";\n\n${tagOpen} value={query} onChange={setQuery} placeholder="Search the dark…" />`;
    case "navbar":
      return `import ${ctx.componentName} from "${importPath}";\n\n${tagOpen} onCtaClick={() => router.push("/signup")} />`;
    case "stat":
      return `import ${ctx.componentName} from "${importPath}";\n\n${tagOpen} value="98.7%" label="Uptime over 30d" />`;
    case "feature-grid":
      return `import ${ctx.componentName} from "${importPath}";\n\n${tagOpen} />`;
    case "pricing-tier":
      return `import ${ctx.componentName} from "${importPath}";\n\n${tagOpen} onCtaClick={() => router.push("/checkout")} />`;
    case "hero":
    case "cta":
      return `import ${ctx.componentName} from "${importPath}";\n\n${tagOpen} onCtaClick={() => router.push("/signup")} />`;
    default:
      return `import ${ctx.componentName} from "${importPath}";\n\n${tagOpen} />`;
  }
}

// ── Stack resolution ────────────────────────────────────────────────────────

async function resolveStack(args: ForgeArgs): Promise<StackHint> {
  if (args.stack) {
    return { ...args.stack };
  }
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

// ── Handler ─────────────────────────────────────────────────────────────────

export async function handler(args: ForgeArgs): Promise<ToolResult> {
  try {
    if (!args.description || args.description.trim().length === 0) {
      return toolError("forge_component", "description is required and must be non-empty.", [
        "Pass a `description` like 'glassmorphism pricing card with hover glow'",
        "Run scan_stack first to confirm the project's stack",
      ]);
    }

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

    const componentType: ComponentType = args.componentType ?? inferComponentType(args.description);
    const language: "typescript" | "javascript" =
      stack.language ?? (args.stack?.language ?? "typescript");
    const isTs = language === "typescript";
    const slug = pickSlug(args.description, componentType);
    const componentName = buildComponentName(componentType, slug);
    const filename = `${componentName}.${isTs ? "tsx" : "jsx"}`;

    // ── Multi-reference loading ─────────────────────────────────────────
    // routeIntent always returns ≥1 (00-dark-tokens always-loaded). Load every
    // routed reference; failures shrink the array but never fail the tool.
    const referenceNames = routeIntent(args.description);
    const referenceTexts: { name: string; markdown: string }[] = [];
    for (const name of referenceNames) {
      try {
        const markdown = await loadReference(name);
        referenceTexts.push({ name, markdown });
      } catch {
        // skip on miss — references are advisory, not load-bearing
      }
    }

    // Variant resolution: explicit args.variant > cue-driven (when tokens loaded)
    // > inferVariant heuristic. Cue-driven only kicks in when 00-dark-tokens is
    // available — otherwise we fall back to the existing inference.
    const tokensLoaded = referenceTexts.some((r) => r.name === "00-dark-tokens");
    const variant: Variant =
      args.variant ??
      cueDrivenVariant(args.description, tokensLoaded) ??
      inferVariant(args.description);

    const ctx: BuildContext = {
      description: args.description,
      componentName,
      filename,
      componentType,
      variant,
      stack,
      language,
      isTs,
      hasTailwind: looksLikeTailwind(stack),
      hasFramerMotion: looksLikeFramerMotion(stack),
      imports: [],
      tokensRequired: new Set<string>(),
      referenceTexts,
    };

    const template = pickTemplate(ctx);
    const componentCode = buildComponentCode(ctx, template);

    // After buildComponentCode finishes, derive tokensRequired by scanning the
    // emitted code. This eliminates drift between `track()` declarations and
    // what actually shows up in the output.
    ctx.tokensRequired = new Set<string>(deriveTokensFromCode(componentCode));

    const usageExample = buildUsageExample(ctx, template.copy);

    const stackSummary = summariseStack(stack);
    const consultedNames = referenceTexts.map((r) => r.name);
    const referencesLine =
      consultedNames.length > 0
        ? `// References consulted: ${consultedNames.join(", ")}\n`
        : `// References consulted: (none)\n`;
    const header = `${referencesLine}// ${filename}\n// Generated by Darkforge forge_component — variant: ${variant}, stack: ${stackSummary}\n`;

    // Per-reference excerpt block — emit a small commented slice from EACH loaded
    // reference (≤300 chars) so the host AI sees content from all routed refs,
    // not just the first one.
    const refBlocks: string[] = [];
    for (const r of referenceTexts) {
      const excerpt = r.markdown.slice(0, 300);
      const commented = excerpt
        .split("\n")
        .map((line) => `// ${line}`)
        .join("\n");
      refBlocks.push(
        `// ── Reference: ${r.name} ───────────────────────\n${commented}\n// ────────────────────────────────────────────`,
      );
    }
    const referenceExcerptBlock = refBlocks.length > 0 ? refBlocks.join("\n") + "\n\n" : "";

    const text = `${header}\n${referenceExcerptBlock}${componentCode}\n// ── Usage ───────────────────────────────────\n${usageExample}\n`;

    const referenceExcerpts: ReferenceExcerpt[] = referenceTexts.map((r) => ({
      name: r.name,
      excerpt: r.markdown.slice(0, REFERENCE_EXCERPT_CHARS),
    }));

    const structured: Record<string, unknown> = {
      componentCode,
      filename,
      imports: ctx.imports,
      tokensRequired: Array.from(ctx.tokensRequired).sort(),
      usageExample,
      routedReferences: consultedNames,
      referenceExcerpts,
    };

    return toolOk(text, structured);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return toolError("forge_component", msg, [
      "Confirm the description is a non-empty string",
      "Pass an explicit `stack` if auto-detection is failing",
      "Re-run scan_stack to refresh capability detection",
    ]);
  }
}
