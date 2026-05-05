import { z } from "zod";
import { toolError, toolOk, REFERENCE_EXCERPT_CHARS } from "../types/index.js";
import type {
  Framework,
  Language,
  PageType,
  ReferenceExcerpt,
  StackHint,
  ToolResult,
} from "../types/index.js";
import { detectStack } from "../lib/stack-detector.js";
import { routeIntent } from "../lib/reference-router.js";
import { loadReference } from "../lib/reference-loader.js";

export const title = "Forge a complete dark page";
export const description =
  "Generates a multi-section AMOLED dark page (hero, features, pricing, etc.) tuned to a pageType. Returns each section + a root page file as text — the host AI decides where to write them. Use after scan_stack so the output matches your animation/styling/framework stack.";

export const inputSchema = {
  pageType: z
    .enum(["saas", "product", "portfolio", "agency", "startup", "dashboard"])
    .describe("Which template to forge. Determines default sections and copy domain."),
  sections: z
    .array(z.string())
    .optional()
    .describe(
      "Optional override for the section list. Unknown section names are emitted as generic dark sections.",
    ),
  stack: z
    .object({
      animation: z.string().optional(),
      components: z.string().optional(),
      styling: z.string().optional(),
      framework: z
        .enum(["nextjs", "nuxt", "vue", "svelte", "remix", "vite", "react", "unknown"])
        .optional(),
      language: z.enum(["typescript", "javascript"]).optional(),
    })
    .optional()
    .describe("Pre-resolved stack hint. If omitted, forge_page calls detectStack(projectPath)."),
  projectPath: z
    .string()
    .optional()
    .describe("Project root used by detectStack when stack is not supplied."),
  theme: z
    .enum(["dark", "glass", "neon"])
    .optional()
    .default("dark")
    .describe("Visual treatment for surfaces and CTAs."),
  description: z
    .string()
    .optional()
    .describe(
      "Free-text intent (e.g. 'dark saas landing with partner logos strip and staggered hero animations'). Routes additional references and can imply extra sections like a partner-logos strip.",
    ),
};

// ──────────────────────────────────────────────────────────────────────────────
// Internal types — kept inline so we don't redefine shared types in src/types.
// ──────────────────────────────────────────────────────────────────────────────

type Theme = "dark" | "glass" | "neon";

interface ForgeArgs {
  pageType: PageType;
  sections?: string[];
  stack?: StackHint;
  projectPath?: string;
  theme?: Theme;
  description?: string;
}

interface ResolvedStack {
  framework: Framework;
  language: Language;
  hasFramerMotion: boolean;
}

interface GeneratedFile {
  filename: string;
  code: string;
}

interface ReferenceText {
  name: string;
  markdown: string;
}

interface SectionCtx {
  pageType: PageType;
  theme: Theme;
  stack: ResolvedStack;
  ext: "tsx" | "jsx";
  description: string;
  referenceTexts: ReferenceText[];
}

// ──────────────────────────────────────────────────────────────────────────────
// Defaults
// ──────────────────────────────────────────────────────────────────────────────

const DEFAULT_SECTIONS: Record<PageType, string[]> = {
  saas: ["hero", "features", "pricing", "testimonials", "cta", "footer"],
  product: ["hero", "showcase", "features", "pricing", "footer"],
  portfolio: ["hero", "work", "about", "contact"],
  agency: ["hero", "services", "case-studies", "testimonials", "cta", "footer"],
  startup: ["hero", "problem", "solution", "features", "cta", "footer"],
  dashboard: ["shell", "stats", "charts", "table"],
};

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

function pascalCase(input: string): string {
  return input
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join("");
}

function componentNameFor(section: string, pageType: PageType): string {
  // Dashboard "shell" reads better as DashboardShell; everything else gets "Section".
  if (pageType === "dashboard" && section === "shell") return "DashboardShell";
  if (pageType === "dashboard") {
    return `Dashboard${pascalCase(section)}`;
  }
  return `${pascalCase(section)}Section`;
}

function rootFilename(framework: Framework, ext: "tsx" | "jsx"): string {
  return framework === "nextjs" ? `page.${ext}` : `Page.${ext}`;
}

function resolveStack(args: ForgeArgs, detected?: { framework: Framework; language: Language; animation: string[] }): ResolvedStack {
  const framework: Framework =
    args.stack?.framework ?? detected?.framework ?? "react";
  const language: Language =
    args.stack?.language ?? detected?.language ?? "typescript";
  const hintedAnim = (args.stack?.animation ?? "").toLowerCase();
  const detectedAnim = detected?.animation ?? [];
  const hasFramerMotion =
    hintedAnim.includes("framer") ||
    hintedAnim.includes("motion") ||
    detectedAnim.includes("framer-motion") ||
    detectedAnim.includes("motion");
  return { framework, language, hasFramerMotion };
}

// Surface treatments per theme — every value is a token reference, never raw hex.
function surfaceCardStyle(theme: Theme): string {
  if (theme === "glass") {
    return [
      "background: var(--df-glass-bg)",
      "backdrop-filter: blur(12px)",
      "-webkit-backdrop-filter: blur(12px)",
      "border: 1px solid var(--df-glass-border)",
      "border-radius: var(--df-radius-lg)",
    ].join("; ");
  }
  if (theme === "neon") {
    return [
      "background: var(--df-bg-surface)",
      "border: 1px solid var(--df-border-default)",
      "border-radius: var(--df-radius-lg)",
      "box-shadow: var(--df-glow-violet)",
    ].join("; ");
  }
  return [
    "background: var(--df-bg-surface)",
    "border: 1px solid var(--df-border-default)",
    "border-radius: var(--df-radius-lg)",
  ].join("; ");
}

function ctaButtonStyle(theme: Theme): string {
  const base = [
    "display: inline-flex",
    "align-items: center",
    "justify-content: center",
    "gap: 0.5rem",
    "padding: 0.75rem 1.5rem",
    "border-radius: var(--df-radius-md)",
    "font-weight: 600",
    "color: var(--df-bg-base)",
    "background: var(--df-ember)",
    "border: 1px solid var(--df-border-focus)",
    "transition: transform var(--df-dur-base) var(--df-ease-out), box-shadow var(--df-dur-base) var(--df-ease-out)",
    "cursor: pointer",
  ];
  if (theme === "neon") {
    base.push("box-shadow: var(--df-glow-cyan)");
    base.push("background: var(--df-neon-cyan)");
  } else {
    base.push("box-shadow: var(--df-glow-ember)");
  }
  return base.join("; ");
}

function ghostButtonStyle(): string {
  return [
    "display: inline-flex",
    "align-items: center",
    "justify-content: center",
    "padding: 0.75rem 1.5rem",
    "border-radius: var(--df-radius-md)",
    "font-weight: 600",
    "color: var(--df-text-primary)",
    "background: transparent",
    "border: 1px solid var(--df-border-strong)",
    "transition: background var(--df-dur-base) var(--df-ease-out)",
    "cursor: pointer",
  ].join("; ");
}

function reducedMotionCSS(): string {
  return `@media (prefers-reduced-motion: reduce) {
    .df-animate-in { animation: none !important; opacity: 1 !important; transform: none !important; }
  }`;
}

function cssAnimateInKeyframes(): string {
  return `@keyframes dfFadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .df-animate-in {
    animation: dfFadeUp var(--df-dur-slow) var(--df-ease-out) both;
  }
  ${reducedMotionCSS()}`;
}

// Component file scaffold — handles framer-motion vs CSS animation branch.
interface ScaffoldOpts {
  componentName: string;
  ext: "tsx" | "jsx";
  ariaLabel: string;
  landmarkTag: "section" | "header" | "footer" | "nav" | "main" | "aside";
  /** JSX body that goes inside the landmark tag. Use {motionWrap} for animated children. */
  body: string;
  /** Extra <style jsx-like> CSS (scoped via a unique class set at the root). */
  scopedCSS: string;
  /** Outer style object key/values, comma-separated, e.g. `padding: "6rem 1.5rem"`. */
  rootStyle: string;
  hasFramerMotion: boolean;
}

function buildSectionFile(opts: ScaffoldOpts): string {
  const {
    componentName,
    ariaLabel,
    landmarkTag,
    body,
    scopedCSS,
    rootStyle,
    hasFramerMotion,
  } = opts;

  const headingId = `${componentName.toLowerCase()}-heading`;
  const ariaProp =
    landmarkTag === "section"
      ? `aria-labelledby="${headingId}"`
      : `aria-label="${ariaLabel}"`;

  if (hasFramerMotion) {
    return `import { motion, useReducedMotion } from "framer-motion";

export default function ${componentName}() {
  const prefersReducedMotion = useReducedMotion();
  const fadeUp = prefersReducedMotion
    ? { hidden: { opacity: 1 }, visible: { opacity: 1 } }
    : {
        hidden: { opacity: 0, y: 16 },
        visible: { opacity: 1, y: 0 },
      };
  const stagger = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
  };

  return (
    <${landmarkTag}
      ${ariaProp}
      style={{ ${rootStyle} }}
    >
      <style>{\`${scopedCSS}\`}</style>
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={stagger}
        style={{ width: "100%", maxWidth: "1200px", margin: "0 auto" }}
      >
${body
  .split("\n")
  .map((l) => (l ? "        " + l : l))
  .join("\n")}
      </motion.div>
    </${landmarkTag}>
  );
}

const _itemVariants = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } };
void _itemVariants;
void fadeUp;
`;
  }

  // CSS-animation fallback path. We use a plain div + .df-animate-in class.
  return `export default function ${componentName}() {
  return (
    <${landmarkTag}
      ${ariaProp}
      style={{ ${rootStyle} }}
    >
      <style>{\`${scopedCSS}\n${cssAnimateInKeyframes()}\`}</style>
      <div
        className="df-animate-in"
        style={{ width: "100%", maxWidth: "1200px", margin: "0 auto" }}
      >
${body
  .split("\n")
  .map((l) => (l ? "        " + l : l))
  .join("\n")}
      </div>
    </${landmarkTag}>
  );
}
`;
}

// Replace `motion.div` with plain `div` if framer-motion is not present.
function maybeMotion(
  tag: "div" | "li" | "article" | "header" | "aside",
  hasFM: boolean,
): string {
  return hasFM ? `motion.${tag}` : tag;
}

function itemVariantsProp(hasFM: boolean): string {
  return hasFM ? `variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}` : "";
}

// ──────────────────────────────────────────────────────────────────────────────
// Per-section content generators
// ──────────────────────────────────────────────────────────────────────────────

interface SectionCopy {
  eyebrow: string;
  heading: string;
  sub: string;
}

function heroCopy(pageType: PageType): SectionCopy {
  switch (pageType) {
    case "saas":
      return {
        eyebrow: "Now in public beta",
        heading: "Stop reinventing dark UIs from scratch.",
        sub: "Forge production-ready AMOLED interfaces in seconds — wired to your stack, your tokens, your conventions.",
      };
    case "product":
      return {
        eyebrow: "v2.0 — out today",
        heading: "The keyboard built for people who think in code.",
        sub: "Hot-swap switches, magnetic feet, full QMK. Designed for the dark hours when the rest of the office has gone home.",
      };
    case "portfolio":
      return {
        eyebrow: "Selected work, 2022 — 2026",
        heading: "Interfaces that feel obvious in retrospect.",
        sub: "I'm a product designer working at the seam between brand, motion, and engineering. Currently shipping at a Series B fintech.",
      };
    case "agency":
      return {
        eyebrow: "Independent product studio",
        heading: "We design what your engineers wish they had time to build.",
        sub: "A 12-person studio embedded with founders from week one. Strategy, brand, product — one team, one weekly review.",
      };
    case "startup":
      return {
        eyebrow: "Backed by Y Combinator (W26)",
        heading: "Ship customer support that doesn't sound like a robot.",
        sub: "We replace your Tier-1 inbox with an agent your customers actually thank. Setup takes 11 minutes.",
      };
    case "dashboard":
      return {
        eyebrow: "Live",
        heading: "Operations control",
        sub: "Real-time view of revenue, churn, and incidents across every region.",
      };
  }
}

function generateHero(ctx: SectionCtx): GeneratedFile {
  const { theme, stack, ext, pageType } = ctx;
  const fm = stack.hasFramerMotion;
  const copy = heroCopy(pageType);

  const eyebrowPill = `
<${maybeMotion("div", fm)}
  ${itemVariantsProp(fm)}
  style={{
    display: "inline-flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.375rem 0.875rem",
    borderRadius: "999px",
    background: "var(--df-bg-elevated)",
    border: "1px solid var(--df-border-default)",
    color: "var(--df-text-secondary)",
    fontSize: "0.8125rem",
    fontWeight: 500,
  }}
>
  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--df-neon-green)" }} aria-hidden="true" />
  ${copy.eyebrow}
</${maybeMotion("div", fm)}>`.trim();

  const headingEl = `
<${maybeMotion("div", fm)} ${itemVariantsProp(fm)}>
  <h1
    id="herosection-heading"
    style={{
      fontSize: "clamp(2.25rem, 5vw, 4rem)",
      lineHeight: 1.05,
      fontWeight: 700,
      letterSpacing: "-0.02em",
      color: "var(--df-text-primary)",
      maxWidth: "20ch",
      margin: "1.5rem 0 1rem",
    }}
  >
    ${copy.heading}
  </h1>
</${maybeMotion("div", fm)}>`.trim();

  const subEl = `
<${maybeMotion("div", fm)} ${itemVariantsProp(fm)}>
  <p style={{
    fontSize: "1.125rem",
    lineHeight: 1.6,
    color: "var(--df-text-secondary)",
    maxWidth: "52ch",
    margin: "0 0 2rem",
  }}>
    ${copy.sub}
  </p>
</${maybeMotion("div", fm)}>`.trim();

  const ctaRow = `
<${maybeMotion("div", fm)} ${itemVariantsProp(fm)} style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
  <a href="#cta" style={{ ${JSON.stringify(ctaButtonStyle(theme)).slice(1, -1).replace(/"/g, "")} }}>
    Start building
    <span aria-hidden="true">&rarr;</span>
  </a>
  <a href="#features" style={{ ${JSON.stringify(ghostButtonStyle()).slice(1, -1).replace(/"/g, "")} }}>
    See how it works
  </a>
</${maybeMotion("div", fm)}>`.trim();

  // Use literal style strings via inline objects to avoid the JSON-roundtrip hack:
  const body = [
    eyebrowPill,
    headingEl,
    subEl,
    `<${maybeMotion("div", fm)} ${itemVariantsProp(fm)} style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
  <a
    href="#cta"
    className="df-cta-primary"
    style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
      padding: "0.75rem 1.5rem", borderRadius: "var(--df-radius-md)",
      fontWeight: 600, color: "var(--df-bg-base)",
      background: "${theme === "neon" ? "var(--df-neon-cyan)" : "var(--df-ember)"}",
      border: "1px solid var(--df-border-focus)",
      boxShadow: "${theme === "neon" ? "var(--df-glow-cyan)" : "var(--df-glow-ember)"}",
      transition: "transform var(--df-dur-base) var(--df-ease-out)",
      textDecoration: "none",
    }}
  >
    Start building <span aria-hidden="true">&rarr;</span>
  </a>
  <a
    href="#features"
    style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      padding: "0.75rem 1.5rem", borderRadius: "var(--df-radius-md)",
      fontWeight: 600, color: "var(--df-text-primary)",
      background: "transparent", border: "1px solid var(--df-border-strong)",
      textDecoration: "none",
    }}
  >
    See how it works
  </a>
</${maybeMotion("div", fm)}>`,
  ].join("\n");

  void ctaRow; // older variant kept for reference, not used.

  const code = buildSectionFile({
    componentName: "HeroSection",
    ext,
    ariaLabel: "Hero",
    landmarkTag: "section",
    body,
    scopedCSS: `.df-cta-primary:hover { transform: translateY(-1px); }`,
    rootStyle: `padding: "6rem 1.5rem", position: "relative", overflow: "hidden"`,
    hasFramerMotion: fm,
  });

  return { filename: `HeroSection.${ext}`, code };
}

// ── Features ────────────────────────────────────────────────────────────────

interface FeatureItem {
  title: string;
  body: string;
  glyph: string; // unicode glyph as cheap icon
}

function featuresList(pageType: PageType): FeatureItem[] {
  switch (pageType) {
    case "saas":
      return [
        { title: "Stack-aware codegen", body: "Detects framer-motion, shadcn/ui, Tailwind v4. Output compiles in your project on first paste.", glyph: "⚙" },
        { title: "Token-locked theming", body: "Every color, radius, and easing pulls from --df-* CSS variables. Rebrand by editing one file.", glyph: "◆" },
        { title: "AMOLED-first surfaces", body: "True-black backgrounds, glassmorphism, and neon glows tuned for OLED panels.", glyph: "■" },
        { title: "Reduced-motion safe", body: "Every animation respects prefers-reduced-motion and ships with a static fallback.", glyph: "·" },
        { title: "Accessible by default", body: "Semantic landmarks, focus rings, keyboard order, and AA contrast on every generated section.", glyph: "⦿" },
        { title: "MCP-native", body: "Runs as a tool inside Claude, Cursor, or any MCP-compatible host. No separate UI.", glyph: "▲" },
      ];
    case "product":
      return [
        { title: "Hot-swap MX sockets", body: "Switch between linear, tactile, and clicky in under a minute. No soldering, no warranty void.", glyph: "◇" },
        { title: "Per-key RGB", body: "16.7M colors per switch. Layered effects, reactive typing, and a true off mode for the dark.", glyph: "●" },
        { title: "USB-C + Bluetooth 5.2", body: "Pair three devices and switch with one chord. 90 hours on a charge with backlight off.", glyph: "⧉" },
        { title: "QMK / VIA on board", body: "Remap, layer, and macro everything. Firmware updates without flashing.", glyph: "⦾" },
      ];
    case "agency":
      return [
        { title: "Embedded engagement", body: "We sit in your Slack, your standups, your roadmap. Async-first, but never absent.", glyph: "▰" },
        { title: "Outcome-priced engagements", body: "Fixed scope, fixed price, fixed dates. We eat the cost of our own miscalibration.", glyph: "◉" },
        { title: "Founders only", body: "We work with the person who can say yes. Not a steering committee, not a working group.", glyph: "◈" },
      ];
    case "startup":
      return [
        { title: "11-minute setup", body: "Drop in a snippet, point us at your help center, and we go live on a sandbox channel before lunch.", glyph: "➞" },
        { title: "Trained on your tone", body: "Three sample tickets and a brand doc is enough. We never sound like the generic chatbot.", glyph: "▤" },
        { title: "Escalation, not replacement", body: "Anything we're not 95% sure about routes to your humans with full context attached.", glyph: "⦵" },
        { title: "Pay per resolved ticket", body: "$0.40 per fully-handled conversation. No seats, no platform fee, no annual lock-in.", glyph: "¤" },
      ];
    default:
      return [
        { title: "Fast", body: "Optimized rendering pipeline that stays smooth on low-end hardware.", glyph: "◉" },
        { title: "Flexible", body: "Composable primitives that fit whatever shape your product takes.", glyph: "◇" },
        { title: "Honest", body: "Clear docs, real changelogs, and a public roadmap.", glyph: "■" },
      ];
  }
}

function generateFeatures(ctx: SectionCtx): GeneratedFile {
  const { theme, stack, ext, pageType } = ctx;
  const fm = stack.hasFramerMotion;
  const items = featuresList(pageType);

  const cards = items
    .map(
      (it) => `<${maybeMotion("article", fm)}
  ${itemVariantsProp(fm)}
  style={{
    ${theme === "glass"
      ? `background: "var(--df-glass-bg)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1px solid var(--df-glass-border)"`
      : `background: "var(--df-bg-surface)", border: "1px solid var(--df-border-default)"`},
    borderRadius: "var(--df-radius-lg)",
    padding: "1.5rem",
    ${theme === "neon" ? `boxShadow: "var(--df-glow-violet)",` : ""}
    transition: "transform var(--df-dur-base) var(--df-ease-out), border-color var(--df-dur-base) var(--df-ease-out)",
  }}
>
  <div aria-hidden="true" style={{
    width: 36, height: 36, borderRadius: "var(--df-radius-md)",
    background: "var(--df-bg-elevated)",
    border: "1px solid var(--df-border-default)",
    display: "grid", placeItems: "center",
    color: "var(--df-neon-violet)",
    marginBottom: "1rem",
    fontSize: "1.125rem",
  }}>${it.glyph}</div>
  <h3 style={{ fontSize: "1.0625rem", fontWeight: 600, color: "var(--df-text-primary)", margin: "0 0 0.5rem" }}>${it.title}</h3>
  <p style={{ fontSize: "0.9375rem", lineHeight: 1.55, color: "var(--df-text-secondary)", margin: 0 }}>${it.body}</p>
</${maybeMotion("article", fm)}>`,
    )
    .join("\n");

  const body = `<header style={{ textAlign: "center", marginBottom: "3rem" }}>
  <p style={{ color: "var(--df-neon-violet)", fontSize: "0.8125rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 0.75rem" }}>What's inside</p>
  <h2 id="featuressection-heading" style={{ fontSize: "clamp(1.875rem, 3.5vw, 2.75rem)", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--df-text-primary)", margin: 0 }}>
    Built for the dark hours.
  </h2>
</header>
<div style={{
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: "1rem",
}}>
${cards}
</div>`;

  const code = buildSectionFile({
    componentName: "FeaturesSection",
    ext,
    ariaLabel: "Features",
    landmarkTag: "section",
    body,
    scopedCSS: `article:hover { transform: translateY(-2px); border-color: var(--df-border-strong); }`,
    rootStyle: `padding: "5rem 1.5rem", background: "var(--df-bg-base)"`,
    hasFramerMotion: fm,
  });

  return { filename: `FeaturesSection.${ext}`, code };
}

// ── Pricing ─────────────────────────────────────────────────────────────────

interface PricingTier {
  name: string;
  price: string;
  cadence: string;
  blurb: string;
  features: string[];
  highlight?: boolean;
  cta: string;
}

function pricingTiers(pageType: PageType): PricingTier[] {
  if (pageType === "product") {
    return [
      {
        name: "Standard",
        price: "$149",
        cadence: "one-time",
        blurb: "The board, three switch options, USB-C cable.",
        features: ["75% layout, 84 keys", "Pre-lubed Gateron switches", "PBT doubleshot keycaps", "QMK / VIA support", "1-year warranty"],
        cta: "Add to cart",
      },
      {
        name: "Pro",
        price: "$199",
        cadence: "one-time",
        blurb: "Everything in Standard plus aluminium and wireless.",
        features: ["CNC aluminium case", "Bluetooth 5.2 (3 devices)", "Per-key RGB", "Hot-swap MX sockets", "Magnetic angle feet", "2-year warranty"],
        highlight: true,
        cta: "Add to cart",
      },
      {
        name: "Founders",
        price: "$329",
        cadence: "one-time",
        blurb: "Limited run of 500. Numbered, signed, and shipped first.",
        features: ["Brass weight (340g)", "Custom keycap set", "Carrying case + extra cable", "Numbered plate (1-500)", "Lifetime switch replacement"],
        cta: "Reserve",
      },
    ];
  }
  // Default SaaS-style pricing.
  return [
    {
      name: "Starter",
      price: "$0",
      cadence: "/ month",
      blurb: "Everything you need to ship a side project.",
      features: ["Up to 3 projects", "1,000 generations / month", "Community support", "Public roadmap voting", "MIT-licensed output"],
      cta: "Start free",
    },
    {
      name: "Pro",
      price: "$24",
      cadence: "/ month",
      blurb: "For founders and teams shipping production work.",
      features: ["Unlimited projects", "20,000 generations / month", "Priority MCP queue", "Custom token presets", "Email support within 24h"],
      highlight: true,
      cta: "Start 14-day trial",
    },
    {
      name: "Enterprise",
      price: "Let's talk",
      cadence: "",
      blurb: "Self-hosted, SSO, and a procurement-friendly contract.",
      features: ["Self-hosted MCP server", "SAML SSO + SCIM", "Audit log export", "Named support engineer", "MSA + DPA + SOC 2 report"],
      cta: "Contact sales",
    },
  ];
}

function generatePricing(ctx: SectionCtx): GeneratedFile {
  const { theme, stack, ext, pageType } = ctx;
  const fm = stack.hasFramerMotion;
  const tiers = pricingTiers(pageType);

  const cards = tiers
    .map((t) => {
      const featuresList = t.features
        .map(
          (f) =>
            `<li style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", padding: "0.375rem 0", color: "var(--df-text-secondary)", fontSize: "0.9375rem" }}>
  <span aria-hidden="true" style={{ color: "var(--df-neon-green)", marginTop: 2 }}>✓</span>
  <span>${f}</span>
</li>`,
        )
        .join("\n");

      const highlightStyle = t.highlight
        ? `border: "1px solid var(--df-border-focus)", boxShadow: "var(--df-glow-ember)"`
        : theme === "glass"
          ? `border: "1px solid var(--df-glass-border)", background: "var(--df-glass-bg)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)"`
          : `border: "1px solid var(--df-border-default)", background: "var(--df-bg-surface)"`;

      return `<${maybeMotion("article", fm)}
  ${itemVariantsProp(fm)}
  style={{
    ${highlightStyle},
    borderRadius: "var(--df-radius-lg)",
    padding: "2rem 1.75rem",
    display: "flex", flexDirection: "column",
    position: "relative",
  }}
>
  ${t.highlight ? `<div style={{ position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)", padding: "0.25rem 0.625rem", borderRadius: 999, background: "var(--df-ember)", color: "var(--df-bg-base)", fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>Most popular</div>` : ""}
  <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--df-text-secondary)", margin: 0 }}>${t.name}</h3>
  <div style={{ display: "flex", alignItems: "baseline", gap: "0.375rem", margin: "0.75rem 0 0.25rem" }}>
    <span style={{ fontSize: "2.5rem", fontWeight: 700, color: "var(--df-text-primary)", letterSpacing: "-0.02em" }}>${t.price}</span>
    ${t.cadence ? `<span style={{ color: "var(--df-text-muted)", fontSize: "0.9375rem" }}>${t.cadence}</span>` : ""}
  </div>
  <p style={{ color: "var(--df-text-secondary)", fontSize: "0.9375rem", lineHeight: 1.5, margin: "0 0 1.5rem" }}>${t.blurb}</p>
  <ul style={{ listStyle: "none", padding: 0, margin: "0 0 2rem", flex: 1 }}>
${featuresList}
  </ul>
  <a href="#cta" style={{
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    padding: "0.75rem 1rem", borderRadius: "var(--df-radius-md)",
    fontWeight: 600, textDecoration: "none",
    ${t.highlight
      ? `color: "var(--df-bg-base)", background: "var(--df-ember)", border: "1px solid var(--df-border-focus)"`
      : `color: "var(--df-text-primary)", background: "transparent", border: "1px solid var(--df-border-strong)"`},
  }}>${t.cta}</a>
</${maybeMotion("article", fm)}>`;
    })
    .join("\n");

  const body = `<header style={{ textAlign: "center", marginBottom: "3rem" }}>
  <p style={{ color: "var(--df-neon-cyan)", fontSize: "0.8125rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 0.75rem" }}>Pricing</p>
  <h2 id="pricingsection-heading" style={{ fontSize: "clamp(1.875rem, 3.5vw, 2.75rem)", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--df-text-primary)", margin: 0 }}>
    Honest pricing. No seat tax.
  </h2>
  <p style={{ color: "var(--df-text-secondary)", margin: "1rem auto 0", maxWidth: "44ch" }}>
    Pick the plan that matches where you are this quarter. Switch any time, prorated to the day.
  </p>
</header>
<div style={{
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: "1.25rem",
  alignItems: "stretch",
}}>
${cards}
</div>`;

  const code = buildSectionFile({
    componentName: "PricingSection",
    ext,
    ariaLabel: "Pricing",
    landmarkTag: "section",
    body,
    scopedCSS: ``,
    rootStyle: `padding: "5rem 1.5rem", background: "var(--df-bg-base)"`,
    hasFramerMotion: fm,
  });

  return { filename: `PricingSection.${ext}`, code };
}

// ── Testimonials ────────────────────────────────────────────────────────────

function testimonialList(pageType: PageType): Array<{ quote: string; name: string; role: string }> {
  if (pageType === "agency") {
    return [
      { quote: "They rewrote our onboarding in three weeks and we saw a 41% lift in week-one retention. The team operates like a co-founder, not a vendor.", name: "Maya Okonkwo", role: "CEO, Outpost (Series A)" },
      { quote: "Most studios send you decks. They sent us a working prototype on day four and shipped to production by day eighteen.", name: "Daniel Reyes", role: "Head of Product, Atlas Health" },
      { quote: "The clearest design thinking I've worked with. Every decision has a reason you can repeat back to a stakeholder.", name: "Priya Shankar", role: "VP Engineering, Northwind" },
    ];
  }
  return [
    { quote: "Darkforge replaced about 600 lines of bespoke pricing-card code we'd been maintaining for two years. The output dropped in clean.", name: "Aris Chen", role: "Staff Engineer, Linear" },
    { quote: "The AMOLED tokens are the best dark-mode system I've seen outside of native iOS. Our designers stopped fighting the theme and started using it.", name: "Hanna Lindqvist", role: "Design Lead, Notion" },
    { quote: "We added it to our MCP server config on Monday and shipped the new dashboard on Thursday. That's not normal.", name: "Marcus Webb", role: "Founder, Crate.dev" },
  ];
}

function generateTestimonials(ctx: SectionCtx): GeneratedFile {
  const { theme, stack, ext, pageType } = ctx;
  const fm = stack.hasFramerMotion;
  const items = testimonialList(pageType);

  const cards = items
    .map(
      (t) => `<${maybeMotion("article", fm)}
  ${itemVariantsProp(fm)}
  style={{
    ${theme === "glass"
      ? `background: "var(--df-glass-bg)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1px solid var(--df-glass-border)"`
      : `background: "var(--df-bg-surface)", border: "1px solid var(--df-border-default)"`},
    borderRadius: "var(--df-radius-lg)",
    padding: "1.75rem",
  }}
>
  <p style={{ color: "var(--df-text-primary)", fontSize: "1rem", lineHeight: 1.6, margin: "0 0 1.25rem" }}>
    &ldquo;${t.quote}&rdquo;
  </p>
  <footer style={{ display: "flex", flexDirection: "column" }}>
    <span style={{ fontWeight: 600, color: "var(--df-text-primary)", fontSize: "0.9375rem" }}>${t.name}</span>
    <span style={{ color: "var(--df-text-muted)", fontSize: "0.875rem" }}>${t.role}</span>
  </footer>
</${maybeMotion("article", fm)}>`,
    )
    .join("\n");

  const body = `<header style={{ textAlign: "center", marginBottom: "3rem" }}>
  <p style={{ color: "var(--df-neon-pink)", fontSize: "0.8125rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 0.75rem" }}>What teams say</p>
  <h2 id="testimonialssection-heading" style={{ fontSize: "clamp(1.875rem, 3.5vw, 2.75rem)", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--df-text-primary)", margin: 0 }}>
    Trusted by teams that ship.
  </h2>
</header>
<div style={{
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: "1rem",
}}>
${cards}
</div>`;

  const code = buildSectionFile({
    componentName: "TestimonialsSection",
    ext,
    ariaLabel: "Testimonials",
    landmarkTag: "section",
    body,
    scopedCSS: ``,
    rootStyle: `padding: "5rem 1.5rem", background: "var(--df-bg-base)"`,
    hasFramerMotion: fm,
  });

  return { filename: `TestimonialsSection.${ext}`, code };
}

// ── CTA ─────────────────────────────────────────────────────────────────────

function ctaCopy(pageType: PageType): { heading: string; sub: string; primary: string; secondary: string } {
  switch (pageType) {
    case "saas":
      return { heading: "Stop maintaining your own dark UI library.", sub: "Install once, generate forever. Free for individual developers.", primary: "Install via MCP", secondary: "Read the docs" };
    case "product":
      return { heading: "Type on it for 30 days. Send it back if you don't love it.", sub: "Free shipping in the US and EU. No restocking fee.", primary: "Buy now", secondary: "Read the review" };
    case "startup":
      return { heading: "Launch your AI inbox before next Monday's standup.", sub: "Setup in 11 minutes. Cancel any time. First 1,000 tickets on us.", primary: "Start free trial", secondary: "Talk to a human" };
    case "agency":
      return { heading: "We have two engagement slots open in Q3.", sub: "If your roadmap is bigger than your team, let's talk this week.", primary: "Book a 30-min intro", secondary: "See case studies" };
    default:
      return { heading: "Ready when you are.", sub: "Get started in under five minutes — no credit card required.", primary: "Get started", secondary: "Learn more" };
  }
}

function generateCTA(ctx: SectionCtx): GeneratedFile {
  const { theme, stack, ext, pageType } = ctx;
  const fm = stack.hasFramerMotion;
  const c = ctaCopy(pageType);

  const body = `<${maybeMotion("div", fm)}
  ${itemVariantsProp(fm)}
  style={{
    ${theme === "glass"
      ? `background: "var(--df-glass-bg)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1px solid var(--df-glass-border)"`
      : `background: "var(--df-bg-surface)", border: "1px solid var(--df-border-default)"`},
    borderRadius: "var(--df-radius-xl)",
    padding: "clamp(2rem, 5vw, 4rem)",
    textAlign: "center",
    ${theme === "neon" ? `boxShadow: "var(--df-glow-violet)",` : ""}
  }}
>
  <h2 id="ctasection-heading" style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--df-text-primary)", margin: "0 0 1rem" }}>
    ${c.heading}
  </h2>
  <p style={{ color: "var(--df-text-secondary)", fontSize: "1.0625rem", margin: "0 auto 2rem", maxWidth: "48ch" }}>
    ${c.sub}
  </p>
  <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
    <a href="#" style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
      padding: "0.875rem 1.75rem", borderRadius: "var(--df-radius-md)",
      fontWeight: 600, color: "var(--df-bg-base)",
      background: "${theme === "neon" ? "var(--df-neon-cyan)" : "var(--df-ember)"}",
      border: "1px solid var(--df-border-focus)",
      boxShadow: "${theme === "neon" ? "var(--df-glow-cyan)" : "var(--df-glow-ember)"}",
      textDecoration: "none",
    }}>${c.primary}</a>
    <a href="#" style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      padding: "0.875rem 1.75rem", borderRadius: "var(--df-radius-md)",
      fontWeight: 600, color: "var(--df-text-primary)",
      background: "transparent", border: "1px solid var(--df-border-strong)",
      textDecoration: "none",
    }}>${c.secondary}</a>
  </div>
</${maybeMotion("div", fm)}>`;

  const code = buildSectionFile({
    componentName: "CtaSection",
    ext,
    ariaLabel: "Call to action",
    landmarkTag: "section",
    body,
    scopedCSS: ``,
    rootStyle: `padding: "5rem 1.5rem", background: "var(--df-bg-base)"`,
    hasFramerMotion: fm,
  });

  return { filename: `CtaSection.${ext}`, code };
}

// ── Footer ──────────────────────────────────────────────────────────────────

function generateFooter(ctx: SectionCtx): GeneratedFile {
  const { ext } = ctx;
  const groups: Array<{ heading: string; links: string[] }> = [
    { heading: "Product", links: ["Features", "Pricing", "Changelog", "Roadmap"] },
    { heading: "Company", links: ["About", "Customers", "Blog", "Careers"] },
    { heading: "Resources", links: ["Docs", "API reference", "Status", "Security"] },
    { heading: "Legal", links: ["Privacy", "Terms", "DPA", "Cookies"] },
  ];

  const cols = groups
    .map(
      (g) => `<div>
  <h3 style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--df-text-primary)", letterSpacing: "0.04em", textTransform: "uppercase", margin: "0 0 1rem" }}>${g.heading}</h3>
  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: "0.5rem" }}>
    ${g.links
      .map(
        (l) =>
          `<li><a href="#" style={{ color: "var(--df-text-secondary)", textDecoration: "none", fontSize: "0.9375rem" }}>${l}</a></li>`,
      )
      .join("\n    ")}
  </ul>
</div>`,
    )
    .join("\n");

  // Footer doesn't need framer-motion — it's always visible at scroll bottom.
  const code = `export default function FooterSection() {
  return (
    <footer
      aria-label="Site footer"
      style={{
        padding: "4rem 1.5rem 2rem",
        background: "var(--df-bg-base)",
        borderTop: "1px solid var(--df-border-subtle)",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "2rem",
          marginBottom: "3rem",
        }}>
          <div style={{ gridColumn: "1 / -1", maxWidth: 360 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
              <span style={{ width: 24, height: 24, borderRadius: "var(--df-radius-sm)", background: "var(--df-ember)", boxShadow: "var(--df-glow-ember)" }} aria-hidden="true" />
              <span style={{ fontWeight: 700, color: "var(--df-text-primary)" }}>Darkforge</span>
            </div>
            <p style={{ color: "var(--df-text-secondary)", fontSize: "0.9375rem", lineHeight: 1.55, margin: 0 }}>
              Production-ready AMOLED dark interfaces, generated to fit your stack.
            </p>
          </div>
${cols
  .split("\n")
  .map((l) => "          " + l)
  .join("\n")}
        </div>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          paddingTop: "1.5rem", borderTop: "1px solid var(--df-border-subtle)",
          color: "var(--df-text-muted)", fontSize: "0.8125rem", flexWrap: "wrap", gap: "1rem",
        }}>
          <span>(c) {new Date().getFullYear()} Darkforge Labs. All rights reserved.</span>
          <nav aria-label="Social">
            <ul style={{ display: "flex", gap: "1rem", listStyle: "none", padding: 0, margin: 0 }}>
              <li><a href="#" style={{ color: "var(--df-text-secondary)", textDecoration: "none" }}>GitHub</a></li>
              <li><a href="#" style={{ color: "var(--df-text-secondary)", textDecoration: "none" }}>X</a></li>
              <li><a href="#" style={{ color: "var(--df-text-secondary)", textDecoration: "none" }}>Discord</a></li>
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}
`;

  return { filename: `FooterSection.${ext}`, code };
}

// ── Showcase (product) ──────────────────────────────────────────────────────

function generateShowcase(ctx: SectionCtx): GeneratedFile {
  const { theme, stack, ext } = ctx;
  const fm = stack.hasFramerMotion;

  const body = `<header style={{ textAlign: "center", marginBottom: "3rem" }}>
  <p style={{ color: "var(--df-neon-amber)", fontSize: "0.8125rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 0.75rem" }}>The board, up close</p>
  <h2 id="showcasesection-heading" style={{ fontSize: "clamp(1.875rem, 3.5vw, 2.75rem)", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--df-text-primary)", margin: 0 }}>
    Every detail, considered.
  </h2>
</header>
<${maybeMotion("div", fm)}
  ${itemVariantsProp(fm)}
  style={{
    aspectRatio: "16 / 9",
    width: "100%",
    borderRadius: "var(--df-radius-xl)",
    ${theme === "glass"
      ? `background: "linear-gradient(135deg, var(--df-bg-elevated), var(--df-bg-surface))", border: "1px solid var(--df-glass-border)"`
      : `background: "linear-gradient(135deg, var(--df-bg-elevated), var(--df-bg-overlay))", border: "1px solid var(--df-border-default)"`},
    display: "grid", placeItems: "center",
    color: "var(--df-text-muted)",
    fontSize: "0.875rem",
    overflow: "hidden",
    position: "relative",
  }}
>
  <div aria-hidden="true" style={{
    position: "absolute", inset: 0,
    background: "radial-gradient(circle at 30% 30%, var(--df-glow-ember), transparent 60%)",
    opacity: 0.4,
  }} />
  <span style={{ position: "relative", zIndex: 1 }}>Product photo / 3D render goes here</span>
</${maybeMotion("div", fm)}>
<div style={{
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "1rem",
  marginTop: "2rem",
}}>
  ${[
    { label: "Weight", value: "1.4 kg" },
    { label: "Switch travel", value: "3.6 mm" },
    { label: "Battery", value: "90 hours" },
    { label: "Polling rate", value: "1000 Hz" },
  ]
    .map(
      (s) =>
        `<div style={{ padding: "1rem 1.25rem", borderRadius: "var(--df-radius-md)", background: "var(--df-bg-surface)", border: "1px solid var(--df-border-subtle)" }}>
    <div style={{ color: "var(--df-text-muted)", fontSize: "0.75rem", letterSpacing: "0.06em", textTransform: "uppercase" }}>${s.label}</div>
    <div style={{ color: "var(--df-text-primary)", fontWeight: 600, fontSize: "1.125rem", marginTop: "0.25rem" }}>${s.value}</div>
  </div>`,
    )
    .join("\n  ")}
</div>`;

  const code = buildSectionFile({
    componentName: "ShowcaseSection",
    ext,
    ariaLabel: "Product showcase",
    landmarkTag: "section",
    body,
    scopedCSS: ``,
    rootStyle: `padding: "5rem 1.5rem", background: "var(--df-bg-base)"`,
    hasFramerMotion: fm,
  });

  return { filename: `ShowcaseSection.${ext}`, code };
}

// ── Portfolio: work, about, contact ─────────────────────────────────────────

function generateWork(ctx: SectionCtx): GeneratedFile {
  const { theme, stack, ext } = ctx;
  const fm = stack.hasFramerMotion;

  const projects = [
    { title: "Atlas — onboarding rebuild", year: "2026", role: "Lead designer", tag: "Fintech, Series B" },
    { title: "Outpost — pricing surface", year: "2025", role: "Product designer", tag: "B2B SaaS" },
    { title: "Northwind — dashboard system", year: "2024", role: "Design + frontend", tag: "Healthcare" },
  ];

  const cards = projects
    .map(
      (p) => `<${maybeMotion("article", fm)}
  ${itemVariantsProp(fm)}
  style={{
    ${theme === "glass"
      ? `background: "var(--df-glass-bg)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1px solid var(--df-glass-border)"`
      : `background: "var(--df-bg-surface)", border: "1px solid var(--df-border-default)"`},
    borderRadius: "var(--df-radius-lg)",
    padding: 0,
    overflow: "hidden",
  }}
>
  <div aria-hidden="true" style={{
    aspectRatio: "16 / 10",
    background: "linear-gradient(135deg, var(--df-bg-elevated), var(--df-bg-overlay))",
    borderBottom: "1px solid var(--df-border-subtle)",
  }} />
  <div style={{ padding: "1.25rem 1.5rem 1.5rem" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
      <span style={{ color: "var(--df-text-muted)", fontSize: "0.8125rem" }}>${p.year} - ${p.role}</span>
      <span style={{ color: "var(--df-neon-violet)", fontSize: "0.75rem", letterSpacing: "0.04em", textTransform: "uppercase" }}>${p.tag}</span>
    </div>
    <h3 style={{ color: "var(--df-text-primary)", fontSize: "1.125rem", fontWeight: 600, margin: "0 0 0.75rem" }}>${p.title}</h3>
    <a href="#" style={{ color: "var(--df-text-secondary)", fontSize: "0.9375rem", textDecoration: "none" }}>Read case study &rarr;</a>
  </div>
</${maybeMotion("article", fm)}>`,
    )
    .join("\n");

  const body = `<header style={{ marginBottom: "2.5rem" }}>
  <h2 id="worksection-heading" style={{ fontSize: "clamp(1.875rem, 3.5vw, 2.75rem)", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--df-text-primary)", margin: 0 }}>
    Selected work
  </h2>
  <p style={{ color: "var(--df-text-secondary)", margin: "0.75rem 0 0", maxWidth: "48ch" }}>
    Three projects from the last two years. Full case studies on request.
  </p>
</header>
<div style={{
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: "1.25rem",
}}>
${cards}
</div>`;

  const code = buildSectionFile({
    componentName: "WorkSection",
    ext,
    ariaLabel: "Selected work",
    landmarkTag: "section",
    body,
    scopedCSS: ``,
    rootStyle: `padding: "5rem 1.5rem", background: "var(--df-bg-base)"`,
    hasFramerMotion: fm,
  });

  return { filename: `WorkSection.${ext}`, code };
}

function generateAbout(ctx: SectionCtx): GeneratedFile {
  const { stack, ext } = ctx;
  const fm = stack.hasFramerMotion;

  const body = `<div style={{
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: "3rem",
  alignItems: "start",
}}>
  <div>
    <h2 id="aboutsection-heading" style={{ fontSize: "clamp(1.75rem, 3vw, 2.25rem)", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--df-text-primary)", margin: "0 0 1rem" }}>
      About
    </h2>
    <p style={{ color: "var(--df-text-secondary)", fontSize: "1rem", lineHeight: 1.7, margin: "0 0 1rem" }}>
      I'm a product designer based in Berlin, working at the seam between brand, motion, and engineering. The last seven years have been mostly fintech and developer tools.
    </p>
    <p style={{ color: "var(--df-text-secondary)", fontSize: "1rem", lineHeight: 1.7, margin: 0 }}>
      Outside of work I run a small letterpress studio and write occasionally about typography, dark mode, and the strange art of designing interfaces nobody notices.
    </p>
  </div>
  <${maybeMotion("aside", fm)} ${itemVariantsProp(fm)} style={{
    background: "var(--df-bg-surface)",
    border: "1px solid var(--df-border-default)",
    borderRadius: "var(--df-radius-lg)",
    padding: "1.5rem",
  }}>
    <h3 style={{ color: "var(--df-text-primary)", fontSize: "0.9375rem", fontWeight: 600, margin: "0 0 0.75rem" }}>Currently</h3>
    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: "0.625rem", color: "var(--df-text-secondary)", fontSize: "0.9375rem" }}>
      <li>Design lead at Atlas (Series B fintech)</li>
      <li>Mentoring at ADPList — 2 sessions / week</li>
      <li>Speaking at Config 2026, San Francisco</li>
      <li>Open to one freelance engagement in Q3</li>
    </ul>
  </${maybeMotion("aside", fm)}>
</div>`;

  const code = buildSectionFile({
    componentName: "AboutSection",
    ext,
    ariaLabel: "About",
    landmarkTag: "section",
    body,
    scopedCSS: ``,
    rootStyle: `padding: "5rem 1.5rem", background: "var(--df-bg-base)"`,
    hasFramerMotion: fm,
  });

  return { filename: `AboutSection.${ext}`, code };
}

function generateContact(ctx: SectionCtx): GeneratedFile {
  const { theme, stack, ext } = ctx;
  const fm = stack.hasFramerMotion;

  const body = `<div style={{
  ${theme === "glass"
    ? `background: "var(--df-glass-bg)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1px solid var(--df-glass-border)"`
    : `background: "var(--df-bg-surface)", border: "1px solid var(--df-border-default)"`},
  borderRadius: "var(--df-radius-xl)",
  padding: "clamp(2rem, 5vw, 3.5rem)",
  textAlign: "center",
}}>
  <h2 id="contactsection-heading" style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--df-text-primary)", margin: "0 0 0.75rem" }}>
    Let's talk.
  </h2>
  <p style={{ color: "var(--df-text-secondary)", maxWidth: "44ch", margin: "0 auto 2rem" }}>
    Best way to reach me is email — I read everything and reply to most of it within two business days.
  </p>
  <a href="mailto:hello@example.com" style={{
    display: "inline-flex", alignItems: "center", gap: "0.5rem",
    padding: "0.875rem 1.75rem", borderRadius: "var(--df-radius-md)",
    fontWeight: 600, color: "var(--df-bg-base)",
    background: "var(--df-ember)",
    border: "1px solid var(--df-border-focus)",
    boxShadow: "var(--df-glow-ember)",
    textDecoration: "none",
  }}>hello@example.com</a>
</div>`;

  const code = buildSectionFile({
    componentName: "ContactSection",
    ext,
    ariaLabel: "Contact",
    landmarkTag: "section",
    body,
    scopedCSS: ``,
    rootStyle: `padding: "5rem 1.5rem", background: "var(--df-bg-base)"`,
    hasFramerMotion: fm,
  });
  void fm;

  return { filename: `ContactSection.${ext}`, code };
}

// ── Agency: services, case-studies ──────────────────────────────────────────

function generateServices(ctx: SectionCtx): GeneratedFile {
  const { theme, stack, ext } = ctx;
  const fm = stack.hasFramerMotion;

  const services = [
    { title: "Product strategy", body: "Six-week sprints that turn a fuzzy direction into a roadmap, a budget, and a thing your team can ship.", glyph: "◈" },
    { title: "Brand & identity", body: "Wordmark, system, voice, and the dozen artifacts you actually need on day one. Built to grow with you.", glyph: "●" },
    { title: "Product design", body: "Embedded with your team for a quarter. Weekly demos, daily reviews, no kabuki ceremonies.", glyph: "◇" },
    { title: "Frontend engineering", body: "We ship the design we made. React, Vue, or whatever your team writes — we adapt to your house style.", glyph: "⧉" },
  ];

  const cards = services
    .map(
      (s) => `<${maybeMotion("article", fm)}
  ${itemVariantsProp(fm)}
  style={{
    ${theme === "glass"
      ? `background: "var(--df-glass-bg)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1px solid var(--df-glass-border)"`
      : `background: "var(--df-bg-surface)", border: "1px solid var(--df-border-default)"`},
    borderRadius: "var(--df-radius-lg)",
    padding: "1.75rem",
  }}
>
  <div aria-hidden="true" style={{ width: 36, height: 36, borderRadius: "var(--df-radius-md)", background: "var(--df-bg-elevated)", border: "1px solid var(--df-border-default)", display: "grid", placeItems: "center", color: "var(--df-neon-cyan)", marginBottom: "1rem", fontSize: "1.125rem" }}>${s.glyph}</div>
  <h3 style={{ color: "var(--df-text-primary)", fontSize: "1.0625rem", fontWeight: 600, margin: "0 0 0.5rem" }}>${s.title}</h3>
  <p style={{ color: "var(--df-text-secondary)", fontSize: "0.9375rem", lineHeight: 1.55, margin: 0 }}>${s.body}</p>
</${maybeMotion("article", fm)}>`,
    )
    .join("\n");

  const body = `<header style={{ marginBottom: "2.5rem" }}>
  <h2 id="servicessection-heading" style={{ fontSize: "clamp(1.875rem, 3.5vw, 2.75rem)", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--df-text-primary)", margin: 0 }}>
    What we do
  </h2>
  <p style={{ color: "var(--df-text-secondary)", margin: "0.75rem 0 0", maxWidth: "48ch" }}>
    Four practices, one team. Engagements typically run six to fourteen weeks.
  </p>
</header>
<div style={{
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: "1rem",
}}>
${cards}
</div>`;

  const code = buildSectionFile({
    componentName: "ServicesSection",
    ext,
    ariaLabel: "Services",
    landmarkTag: "section",
    body,
    scopedCSS: ``,
    rootStyle: `padding: "5rem 1.5rem", background: "var(--df-bg-base)"`,
    hasFramerMotion: fm,
  });

  return { filename: `ServicesSection.${ext}`, code };
}

function generateCaseStudies(ctx: SectionCtx): GeneratedFile {
  const { theme, stack, ext } = ctx;
  const fm = stack.hasFramerMotion;

  const cases = [
    { client: "Outpost", problem: "Onboarding completion stuck at 38%.", outcome: "Rebuilt in 3 weeks. Shipped a first-run experience that lifted week-1 retention 41%." },
    { client: "Atlas Health", problem: "Clinicians abandoning the chart in 12 seconds.", outcome: "Cut average time-to-vitals from 9 clicks to 3. Saved an estimated 1,400 hours per month across 220 sites." },
    { client: "Northwind", problem: "Three product surfaces, three brand systems.", outcome: "Unified into a single design system with 87 components. Cross-team feature ship rate doubled." },
  ];

  const items = cases
    .map(
      (c) => `<${maybeMotion("article", fm)}
  ${itemVariantsProp(fm)}
  style={{
    ${theme === "glass"
      ? `background: "var(--df-glass-bg)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1px solid var(--df-glass-border)"`
      : `background: "var(--df-bg-surface)", border: "1px solid var(--df-border-default)"`},
    borderRadius: "var(--df-radius-lg)",
    padding: "1.75rem",
    display: "grid",
    gridTemplateColumns: "minmax(140px, 200px) 1fr",
    gap: "1.5rem",
    alignItems: "start",
  }}
>
  <header>
    <span style={{ color: "var(--df-neon-amber)", fontSize: "0.6875rem", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600 }}>Case study</span>
    <h3 style={{ color: "var(--df-text-primary)", fontSize: "1.25rem", fontWeight: 700, margin: "0.5rem 0 0" }}>${c.client}</h3>
  </header>
  <div>
    <p style={{ color: "var(--df-text-secondary)", fontSize: "0.9375rem", lineHeight: 1.6, margin: "0 0 0.75rem" }}><strong style={{ color: "var(--df-text-primary)" }}>Problem:</strong> ${c.problem}</p>
    <p style={{ color: "var(--df-text-secondary)", fontSize: "0.9375rem", lineHeight: 1.6, margin: 0 }}><strong style={{ color: "var(--df-text-primary)" }}>Outcome:</strong> ${c.outcome}</p>
  </div>
</${maybeMotion("article", fm)}>`,
    )
    .join("\n");

  const body = `<header style={{ marginBottom: "2.5rem" }}>
  <h2 id="case-studiessection-heading" style={{ fontSize: "clamp(1.875rem, 3.5vw, 2.75rem)", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--df-text-primary)", margin: 0 }}>
    Recent case studies
  </h2>
</header>
<div style={{ display: "grid", gap: "1rem" }}>
${items}
</div>`;

  const code = buildSectionFile({
    componentName: "CaseStudiesSection",
    ext,
    ariaLabel: "Case studies",
    landmarkTag: "section",
    body,
    scopedCSS: ``,
    rootStyle: `padding: "5rem 1.5rem", background: "var(--df-bg-base)"`,
    hasFramerMotion: fm,
  });

  return { filename: `CaseStudiesSection.${ext}`, code };
}

// ── Startup: problem, solution ──────────────────────────────────────────────

function generateProblem(ctx: SectionCtx): GeneratedFile {
  const { stack, ext } = ctx;
  const fm = stack.hasFramerMotion;

  const stats = [
    { value: "47%", label: "of support tickets are repeats of the same five questions." },
    { value: "9 min", label: "median first response time across SaaS in 2025." },
    { value: "$4.20", label: "average fully-loaded cost of a single Tier-1 ticket." },
  ];

  const cards = stats
    .map(
      (s) => `<${maybeMotion("div", fm)}
  ${itemVariantsProp(fm)}
  style={{
    background: "var(--df-bg-surface)",
    border: "1px solid var(--df-border-default)",
    borderRadius: "var(--df-radius-lg)",
    padding: "1.75rem",
  }}
>
  <div style={{ color: "var(--df-neon-pink)", fontSize: "2.5rem", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1 }}>${s.value}</div>
  <p style={{ color: "var(--df-text-secondary)", fontSize: "0.9375rem", lineHeight: 1.55, margin: "0.75rem 0 0" }}>${s.label}</p>
</${maybeMotion("div", fm)}>`,
    )
    .join("\n");

  const body = `<header style={{ marginBottom: "2.5rem", maxWidth: 640 }}>
  <p style={{ color: "var(--df-neon-pink)", fontSize: "0.8125rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 0.75rem" }}>The problem</p>
  <h2 id="problemsection-heading" style={{ fontSize: "clamp(1.875rem, 3.5vw, 2.75rem)", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--df-text-primary)", margin: 0 }}>
    Customer support is the most expensive form of repeated typing in modern software.
  </h2>
</header>
<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
${cards}
</div>`;

  const code = buildSectionFile({
    componentName: "ProblemSection",
    ext,
    ariaLabel: "The problem",
    landmarkTag: "section",
    body,
    scopedCSS: ``,
    rootStyle: `padding: "5rem 1.5rem", background: "var(--df-bg-base)"`,
    hasFramerMotion: fm,
  });

  return { filename: `ProblemSection.${ext}`, code };
}

function generateSolution(ctx: SectionCtx): GeneratedFile {
  const { theme, stack, ext } = ctx;
  const fm = stack.hasFramerMotion;

  const steps = [
    { n: "01", title: "Connect", body: "Drop our snippet into your help center, or point us at your Intercom workspace. We index everything in under five minutes." },
    { n: "02", title: "Train", body: "Three example tickets and your brand voice doc. We mirror your tone, your style, your edge cases." },
    { n: "03", title: "Go live", body: "Start in shadow mode — we draft, your humans send. Switch to autonomous when you're ready, ticket by ticket." },
  ];

  const cards = steps
    .map(
      (s) => `<${maybeMotion("li", fm)}
  ${itemVariantsProp(fm)}
  style={{
    ${theme === "glass"
      ? `background: "var(--df-glass-bg)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1px solid var(--df-glass-border)"`
      : `background: "var(--df-bg-surface)", border: "1px solid var(--df-border-default)"`},
    borderRadius: "var(--df-radius-lg)",
    padding: "1.75rem",
    listStyle: "none",
  }}
>
  <div style={{ color: "var(--df-neon-cyan)", fontSize: "0.8125rem", fontWeight: 700, letterSpacing: "0.1em", marginBottom: "0.75rem" }}>${s.n}</div>
  <h3 style={{ color: "var(--df-text-primary)", fontSize: "1.125rem", fontWeight: 600, margin: "0 0 0.5rem" }}>${s.title}</h3>
  <p style={{ color: "var(--df-text-secondary)", fontSize: "0.9375rem", lineHeight: 1.55, margin: 0 }}>${s.body}</p>
</${maybeMotion("li", fm)}>`,
    )
    .join("\n");

  const body = `<header style={{ marginBottom: "2.5rem", maxWidth: 640 }}>
  <p style={{ color: "var(--df-neon-cyan)", fontSize: "0.8125rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 0.75rem" }}>How it works</p>
  <h2 id="solutionsection-heading" style={{ fontSize: "clamp(1.875rem, 3.5vw, 2.75rem)", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--df-text-primary)", margin: 0 }}>
    Live in 11 minutes. Better than your humans by Friday.
  </h2>
</header>
<ol style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem", padding: 0, margin: 0 }}>
${cards}
</ol>`;

  const code = buildSectionFile({
    componentName: "SolutionSection",
    ext,
    ariaLabel: "How it works",
    landmarkTag: "section",
    body,
    scopedCSS: ``,
    rootStyle: `padding: "5rem 1.5rem", background: "var(--df-bg-base)"`,
    hasFramerMotion: fm,
  });

  return { filename: `SolutionSection.${ext}`, code };
}

// ── Dashboard: shell, stats, charts, table ──────────────────────────────────

function generateDashboardShell(ctx: SectionCtx): GeneratedFile {
  const { ext } = ctx;
  const code = `export default function DashboardShell({ children }: { children?: React.ReactNode }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "240px 1fr",
      gridTemplateRows: "56px 1fr",
      gridTemplateAreas: '"sidebar topbar" "sidebar main"',
      minHeight: "100vh",
      background: "var(--df-bg-base)",
      color: "var(--df-text-primary)",
    }}>
      <aside aria-label="Primary navigation" style={{
        gridArea: "sidebar",
        background: "var(--df-bg-surface)",
        borderRight: "1px solid var(--df-border-subtle)",
        padding: "1.25rem 1rem",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
          <span aria-hidden="true" style={{ width: 24, height: 24, borderRadius: "var(--df-radius-sm)", background: "var(--df-ember)", boxShadow: "var(--df-glow-ember)" }} />
          <span style={{ fontWeight: 700 }}>Operations</span>
        </div>
        <nav aria-label="Sections">
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: "0.25rem" }}>
            {[
              { label: "Overview", active: true },
              { label: "Revenue" },
              { label: "Customers" },
              { label: "Incidents" },
              { label: "Settings" },
            ].map((item) => (
              <li key={item.label}>
                <a href="#" style={{
                  display: "block",
                  padding: "0.5rem 0.75rem",
                  borderRadius: "var(--df-radius-sm)",
                  textDecoration: "none",
                  color: item.active ? "var(--df-text-primary)" : "var(--df-text-secondary)",
                  background: item.active ? "var(--df-bg-elevated)" : "transparent",
                  fontSize: "0.9375rem",
                }}>{item.label}</a>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      <header style={{
        gridArea: "topbar",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 1.5rem",
        background: "var(--df-bg-surface)",
        borderBottom: "1px solid var(--df-border-subtle)",
      }}>
        <h1 style={{ fontSize: "0.9375rem", fontWeight: 600, margin: 0 }}>Operations control</h1>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", padding: "0.25rem 0.625rem", borderRadius: 999, background: "var(--df-bg-elevated)", color: "var(--df-text-secondary)", fontSize: "0.75rem" }}>
            <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--df-neon-green)" }} />
            All systems normal
          </span>
        </div>
      </header>
      <main aria-label="Dashboard content" style={{ gridArea: "main", padding: "1.5rem", display: "grid", gap: "1rem", alignContent: "start" }}>
        {children}
      </main>
    </div>
  );
}
`;
  return { filename: `DashboardShell.${ext}`, code };
}

function generateDashboardStats(ctx: SectionCtx): GeneratedFile {
  const { stack, ext } = ctx;
  const fm = stack.hasFramerMotion;

  const stats = [
    { label: "MRR", value: "$148,209", delta: "+4.2%", positive: true },
    { label: "Active customers", value: "2,418", delta: "+87", positive: true },
    { label: "Net churn", value: "1.6%", delta: "-0.3pp", positive: true },
    { label: "Open incidents", value: "0", delta: "-2", positive: true },
  ];

  const cards = stats
    .map(
      (s) => `<${maybeMotion("article", fm)}
  ${itemVariantsProp(fm)}
  style={{
    background: "var(--df-bg-surface)",
    border: "1px solid var(--df-border-default)",
    borderRadius: "var(--df-radius-lg)",
    padding: "1.25rem 1.5rem",
  }}
>
  <div style={{ color: "var(--df-text-muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>${s.label}</div>
  <div style={{ color: "var(--df-text-primary)", fontSize: "1.875rem", fontWeight: 700, letterSpacing: "-0.02em", marginTop: "0.5rem" }}>${s.value}</div>
  <div style={{ color: "${s.positive ? "var(--df-neon-green)" : "var(--df-neon-pink)"}", fontSize: "0.8125rem", marginTop: "0.375rem" }}>${s.delta} vs. last week</div>
</${maybeMotion("article", fm)}>`,
    )
    .join("\n");

  const body = `<header style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "1rem" }}>
  <h2 id="statssection-heading" style={{ fontSize: "1.0625rem", fontWeight: 600, color: "var(--df-text-primary)", margin: 0 }}>This week</h2>
  <span style={{ color: "var(--df-text-muted)", fontSize: "0.8125rem" }}>Updated 2 minutes ago</span>
</header>
<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
${cards}
</div>`;

  const code = buildSectionFile({
    componentName: "DashboardStats",
    ext,
    ariaLabel: "Stat tiles",
    landmarkTag: "section",
    body,
    scopedCSS: ``,
    rootStyle: `padding: 0`,
    hasFramerMotion: fm,
  });

  return { filename: `DashboardStats.${ext}`, code };
}

function generateDashboardCharts(ctx: SectionCtx): GeneratedFile {
  const { stack, ext } = ctx;
  const fm = stack.hasFramerMotion;

  // Inline SVG sparkline — no chart library dependency.
  const body = `<header style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "1rem" }}>
  <h2 id="chartssection-heading" style={{ fontSize: "1.0625rem", fontWeight: 600, color: "var(--df-text-primary)", margin: 0 }}>Revenue, last 30 days</h2>
  <span style={{ color: "var(--df-text-muted)", fontSize: "0.8125rem" }}>USD, daily</span>
</header>
<${maybeMotion("div", fm)}
  ${itemVariantsProp(fm)}
  style={{
    background: "var(--df-bg-surface)",
    border: "1px solid var(--df-border-default)",
    borderRadius: "var(--df-radius-lg)",
    padding: "1.5rem",
  }}
>
  <svg viewBox="0 0 600 180" preserveAspectRatio="none" style={{ width: "100%", height: 180 }} role="img" aria-label="Daily revenue trend showing steady growth over 30 days">
    <defs>
      <linearGradient id="dfChartFill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="var(--df-ember)" stopOpacity="0.4" />
        <stop offset="100%" stopColor="var(--df-ember)" stopOpacity="0" />
      </linearGradient>
    </defs>
    <path
      d="M0,140 L20,132 L40,128 L60,118 L80,122 L100,108 L120,102 L140,110 L160,96 L180,88 L200,92 L220,80 L240,72 L260,78 L280,66 L300,58 L320,62 L340,52 L360,46 L380,50 L400,40 L420,36 L440,42 L460,30 L480,26 L500,22 L520,28 L540,18 L560,14 L580,12 L600,8"
      stroke="var(--df-ember)"
      strokeWidth="2"
      fill="none"
    />
    <path
      d="M0,140 L20,132 L40,128 L60,118 L80,122 L100,108 L120,102 L140,110 L160,96 L180,88 L200,92 L220,80 L240,72 L260,78 L280,66 L300,58 L320,62 L340,52 L360,46 L380,50 L400,40 L420,36 L440,42 L460,30 L480,26 L500,22 L520,28 L540,18 L560,14 L580,12 L600,8 L600,180 L0,180 Z"
      fill="url(#dfChartFill)"
    />
  </svg>
  <div style={{ display: "flex", gap: "1.5rem", marginTop: "1rem", color: "var(--df-text-secondary)", fontSize: "0.8125rem" }}>
    <span><strong style={{ color: "var(--df-text-primary)" }}>$148,209</strong> total</span>
    <span><strong style={{ color: "var(--df-neon-green)" }}>+18.4%</strong> vs. last 30</span>
  </div>
</${maybeMotion("div", fm)}>`;

  const code = buildSectionFile({
    componentName: "DashboardCharts",
    ext,
    ariaLabel: "Charts",
    landmarkTag: "section",
    body,
    scopedCSS: ``,
    rootStyle: `padding: 0`,
    hasFramerMotion: fm,
  });

  return { filename: `DashboardCharts.${ext}`, code };
}

function generateDashboardTable(ctx: SectionCtx): GeneratedFile {
  const { ext } = ctx;
  // Plain table — no animation, but accessibility focused.
  const code = `export default function DashboardTable() {
  const rows = [
    { id: "INV-1042", customer: "Atlas, Inc.", amount: "$8,400", status: "Paid", date: "Apr 28" },
    { id: "INV-1041", customer: "Outpost", amount: "$2,100", status: "Paid", date: "Apr 27" },
    { id: "INV-1040", customer: "Northwind", amount: "$12,000", status: "Pending", date: "Apr 26" },
    { id: "INV-1039", customer: "Crate.dev", amount: "$960", status: "Paid", date: "Apr 25" },
    { id: "INV-1038", customer: "Linear (acq.)", amount: "$5,400", status: "Failed", date: "Apr 24" },
  ];

  return (
    <section aria-labelledby="tablesection-heading" style={{ padding: 0 }}>
      <header style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "1rem" }}>
        <h2 id="tablesection-heading" style={{ fontSize: "1.0625rem", fontWeight: 600, color: "var(--df-text-primary)", margin: 0 }}>Recent invoices</h2>
        <a href="#" style={{ color: "var(--df-text-secondary)", fontSize: "0.8125rem", textDecoration: "none" }}>View all &rarr;</a>
      </header>
      <div style={{
        background: "var(--df-bg-surface)",
        border: "1px solid var(--df-border-default)",
        borderRadius: "var(--df-radius-lg)",
        overflow: "hidden",
      }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9375rem" }}>
          <thead>
            <tr style={{ background: "var(--df-bg-elevated)" }}>
              {["Invoice", "Customer", "Amount", "Status", "Date"].map((h) => (
                <th key={h} scope="col" style={{
                  textAlign: "left",
                  padding: "0.75rem 1rem",
                  color: "var(--df-text-muted)",
                  fontSize: "0.75rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  fontWeight: 600,
                  borderBottom: "1px solid var(--df-border-subtle)",
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td style={cell}>{r.id}</td>
                <td style={cell}>{r.customer}</td>
                <td style={cell}>{r.amount}</td>
                <td style={cell}>
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: "0.375rem",
                    padding: "0.125rem 0.5rem", borderRadius: 999,
                    fontSize: "0.75rem", fontWeight: 500,
                    background: r.status === "Paid" ? "rgba(74, 222, 128, 0.12)" : r.status === "Pending" ? "rgba(251, 191, 36, 0.12)" : "rgba(244, 114, 182, 0.12)",
                    color: r.status === "Paid" ? "var(--df-neon-green)" : r.status === "Pending" ? "var(--df-neon-amber)" : "var(--df-neon-pink)",
                  }}>{r.status}</span>
                </td>
                <td style={cell}>{r.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

const cell: React.CSSProperties = {
  padding: "0.875rem 1rem",
  color: "var(--df-text-primary)",
  borderBottom: "1px solid var(--df-border-subtle)",
};
`;

  return { filename: `DashboardTable.${ext}`, code };
}

// ── Generic fallback for unknown section names ─────────────────────────────

function generateGeneric(section: string, ctx: SectionCtx): GeneratedFile {
  const { stack, ext, pageType } = ctx;
  const fm = stack.hasFramerMotion;
  const componentName = componentNameFor(section, pageType);
  const human = section.replace(/[-_]/g, " ");

  const body = `<header style={{ marginBottom: "1.5rem" }}>
  <h2 id="${componentName.toLowerCase()}-heading" style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)", fontWeight: 700, color: "var(--df-text-primary)", margin: 0 }}>
    ${human.charAt(0).toUpperCase() + human.slice(1)}
  </h2>
  <p style={{ color: "var(--df-text-secondary)", margin: "0.75rem 0 0", maxWidth: "52ch" }}>
    Section content goes here. Replace this paragraph with copy that fits your story — the structure, tokens, and motion are already production-ready.
  </p>
</header>
<${maybeMotion("div", fm)}
  ${itemVariantsProp(fm)}
  style={{
    background: "var(--df-bg-surface)",
    border: "1px solid var(--df-border-default)",
    borderRadius: "var(--df-radius-lg)",
    padding: "2rem",
    color: "var(--df-text-secondary)",
  }}
>
  <p style={{ margin: 0, lineHeight: 1.6 }}>
    Drop your custom content into this surface — it inherits the dark token system, supports glass and neon themes through the same props, and respects prefers-reduced-motion automatically.
  </p>
</${maybeMotion("div", fm)}>`;

  const code = buildSectionFile({
    componentName,
    ext,
    ariaLabel: human,
    landmarkTag: "section",
    body,
    scopedCSS: ``,
    rootStyle: `padding: "5rem 1.5rem", background: "var(--df-bg-base)"`,
    hasFramerMotion: fm,
  });

  return { filename: `${componentName}.${ext}`, code };
}

// ── Section dispatcher ──────────────────────────────────────────────────────

function generateSection(section: string, ctx: SectionCtx): GeneratedFile {
  const key = section.toLowerCase();
  switch (key) {
    case "hero":
      return generateHero(ctx);
    case "features":
      return generateFeatures(ctx);
    case "pricing":
      return generatePricing(ctx);
    case "testimonials":
      return generateTestimonials(ctx);
    case "cta":
      return generateCTA(ctx);
    case "footer":
      return generateFooter(ctx);
    case "showcase":
      return generateShowcase(ctx);
    case "work":
      return generateWork(ctx);
    case "about":
      return generateAbout(ctx);
    case "contact":
      return generateContact(ctx);
    case "services":
      return generateServices(ctx);
    case "case-studies":
    case "casestudies":
      return generateCaseStudies(ctx);
    case "problem":
      return generateProblem(ctx);
    case "solution":
      return generateSolution(ctx);
    case "shell":
      return ctx.pageType === "dashboard"
        ? generateDashboardShell(ctx)
        : generateGeneric(section, ctx);
    case "stats":
      return generateDashboardStats(ctx);
    case "charts":
      return generateDashboardCharts(ctx);
    case "table":
      return generateDashboardTable(ctx);
    case "partner-logos":
    case "partnerlogos":
    case "logos":
    case "logo-strip":
    case "brand-strip":
      return generatePartnerLogos(ctx);
    default:
      return generateGeneric(section, ctx);
  }
}

// ── Partner logos / brand strip ─────────────────────────────────────────────

function generatePartnerLogos(ctx: SectionCtx): GeneratedFile {
  const { theme, stack, ext, referenceTexts } = ctx;
  const fm = stack.hasFramerMotion;

  // Presence checks — same approach as the page wrapper.
  const hasGlassRef = referenceTexts.some((r) => r.markdown.includes("--df-glass-bg"));
  const hasLogoStripPattern = referenceTexts.some((r) => r.name === "patterns/features");
  const hasStaggerRef = referenceTexts.some(
    (r) => r.name === "01-framer-motion" || r.markdown.includes("staggerChildren"),
  );

  // Eight neutral wordmark placeholders. Real consumers swap these for real brands.
  const brands = [
    "Northwind",
    "Atlas",
    "Outpost",
    "Crate.dev",
    "Linear",
    "Notion",
    "Verdana",
    "Helios",
  ];

  // When the features pattern reference is loaded, emit a tighter horizontal
  // strip with marquee-style spacing. Otherwise still emit a strip — but a
  // lighter, plainer one.
  const stripGap = hasLogoStripPattern ? "2.5rem" : "1.5rem";
  const useStaggerInner = fm && hasStaggerRef;

  const itemTag = useStaggerInner ? "motion.div" : "div";
  const itemVariants = useStaggerInner
    ? `variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}`
    : "";

  const items = brands
    .map(
      (name) => `<${itemTag}
  ${itemVariants}
  style={{
    fontFamily: "ui-sans-serif, system-ui, sans-serif",
    fontSize: "1rem",
    fontWeight: 600,
    letterSpacing: "0.02em",
    color: "var(--df-text-muted)",
    opacity: 0.85,
    whiteSpace: "nowrap",
  }}
>
  ${name}
</${itemTag}>`,
    )
    .join("\n");

  const stripStyle =
    theme === "glass" && hasGlassRef
      ? `background: "var(--df-glass-bg)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1px solid var(--df-glass-border)"`
      : `background: "var(--df-bg-surface)", border: "1px solid var(--df-border-default)"`;

  const innerWrapper = useStaggerInner
    ? `<motion.div
  initial="hidden"
  whileInView="visible"
  viewport={{ once: true, margin: "-40px" }}
  variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }}
  style={{
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    gap: "${stripGap}",
  }}
>
${items}
</motion.div>`
    : `<div
  className="df-logo-strip"
  style={{
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    gap: "${stripGap}",
  }}
>
${items}
</div>`;

  const body = `<p
  id="partnerlogossection-heading"
  style={{
    textAlign: "center",
    color: "var(--df-text-muted)",
    fontSize: "0.8125rem",
    fontWeight: 600,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    margin: "0 0 1.5rem",
  }}
>
  Trusted by teams shipping every week
</p>
<div
  style={{
    ${stripStyle},
    borderRadius: "var(--df-radius-lg)",
    padding: "1.25rem 1.5rem",
  }}
>
${innerWrapper}
</div>`;

  const importLine = useStaggerInner ? `import { motion } from "framer-motion";\n\n` : "";
  // We can't easily inject extra imports through buildSectionFile, so we
  // bypass it here when we need framer-motion at this section's top level
  // and the scaffold doesn't already provide it. buildSectionFile already
  // imports framer-motion when hasFramerMotion is true, so the standard
  // path is fine. Use a plain body when we already use motion via scaffold.
  void importLine;

  const code = buildSectionFile({
    componentName: "PartnerLogosSection",
    ext,
    ariaLabel: "Partner logos",
    landmarkTag: "section",
    body,
    scopedCSS: `.df-logo-strip > * { transition: opacity var(--df-dur-base) var(--df-ease-out); }
    .df-logo-strip > *:hover { opacity: 1 !important; }`,
    rootStyle: `padding: "3rem 1.5rem", background: "var(--df-bg-base)"`,
    hasFramerMotion: fm,
  });

  return { filename: `PartnerLogosSection.${ext}`, code };
}

// ──────────────────────────────────────────────────────────────────────────────
// Root page assembly
// ──────────────────────────────────────────────────────────────────────────────

function buildRootPage(
  pageType: PageType,
  files: GeneratedFile[],
  stack: ResolvedStack,
  ext: "tsx" | "jsx",
  ctx?: SectionCtx,
): GeneratedFile {
  const sections = files.map((f) => f.filename.replace(/\.(tsx|jsx)$/, ""));

  // Reference-driven flags. Presence checks mirror Agent 1's approach: scan
  // the loaded markdown for tell-tale tokens or filenames, gate behavior on
  // the boolean.
  const refs = ctx?.referenceTexts ?? [];
  const lowerDesc = (ctx?.description ?? "").toLowerCase();
  const hasGlassRef = refs.some((r) => r.markdown.includes("--df-glass-bg"));
  const hasStaggerRef = refs.some(
    (r) =>
      r.markdown.includes("staggerChildren") ||
      r.markdown.includes("delay: i *") ||
      r.name === "01-framer-motion",
  );
  const wantsGlass =
    /\b(glass|glassmorphism|frosted|blur card)\b/.test(lowerDesc) || ctx?.theme === "glass";
  const sectionWrapperClass =
    hasGlassRef && wantsGlass ? ` className="df-glass-section"` : "";
  const wrapperGlassCSS =
    hasGlassRef && wantsGlass
      ? `\n      <style>{\`
        .df-glass-section { background: var(--df-glass-bg); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border-bottom: 1px solid var(--df-glass-border); }
      \`}</style>`
      : "";

  // Dashboard pages compose differently — DashboardShell wraps the others.
  if (pageType === "dashboard") {
    const importStatements = sections
      .map((s) => `import ${s} from "./${s}.js";`)
      .join("\n");
    const shellChildren = sections
      .filter((s) => s !== "DashboardShell")
      .map((s) => `        <${s} />`)
      .join("\n");

    const code = `${importStatements}

export default function Page() {
  return (
    <DashboardShell>
${shellChildren}
    </DashboardShell>
  );
}
`;
    return { filename: rootFilename(stack.framework, ext), code };
  }

  const importStatements = sections
    .map((s) => `import ${s} from "./${s}.js";`)
    .join("\n");

  // Stagger variant — only emitted when reference markdown advertises it AND
  // framer-motion is present. Otherwise we render plain children, same as before.
  const useStaggerWrapper = hasStaggerRef && stack.hasFramerMotion;

  if (useStaggerWrapper) {
    const motionImport = `import { motion } from "framer-motion";`;
    const renders = sections
      .map(
        (s) => `        <motion.div${sectionWrapperClass} variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}>
          <${s} />
        </motion.div>`,
      )
      .join("\n");
    const code = `${motionImport}
${importStatements}

const pageStagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

export default function Page() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--df-bg-base)",
        color: "var(--df-text-primary)",
      }}
    >${wrapperGlassCSS}
      <motion.div initial="hidden" animate="visible" variants={pageStagger}>
${renders}
      </motion.div>
    </main>
  );
}
`;
    return { filename: rootFilename(stack.framework, ext), code };
  }

  const renders = sections
    .map((s) => `      <div${sectionWrapperClass}><${s} /></div>`)
    .join("\n");

  const code = `${importStatements}

export default function Page() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--df-bg-base)",
        color: "var(--df-text-primary)",
      }}
    >${wrapperGlassCSS}
${renders}
    </main>
  );
}
`;
  return { filename: rootFilename(stack.framework, ext), code };
}

// ──────────────────────────────────────────────────────────────────────────────
// Diagram + setup instructions
// ──────────────────────────────────────────────────────────────────────────────

function buildPageStructure(files: GeneratedFile[]): string {
  const sectionFiles = files.filter((f) => !/^page\./i.test(f.filename));
  const lines: string[] = [];
  sectionFiles.forEach((f, i) => {
    const isLast = i === sectionFiles.length - 1;
    const prefix = isLast ? "└─" : "├─";
    lines.push(`${prefix} ${f.filename.replace(/\.(tsx|jsx)$/, "")}`);
  });
  return lines.join("\n");
}

function buildSetupInstructions(stack: ResolvedStack, theme: Theme): string {
  const dropPath =
    stack.framework === "nextjs"
      ? "app/ (App Router) — co-locate the section files next to page.tsx, or move them to components/ and update imports."
      : stack.framework === "remix"
        ? "app/routes/ — drop page.tsx as your route file and the sections into app/components/."
        : stack.framework === "vite" || stack.framework === "react"
          ? "src/components/ for the section files; src/Page.tsx (or wherever your router renders the page)."
          : stack.framework === "nuxt" || stack.framework === "vue" || stack.framework === "svelte"
            ? "These files are React. Convert to Vue/Svelte SFCs before dropping in, or use them as a reference for shape and copy."
            : "src/components/ for the section files and src/Page.tsx for the assembled page.";

  const installs: string[] = [];
  if (!stack.hasFramerMotion) {
    installs.push("framer-motion  (optional — currently using CSS animations as a fallback)");
  }
  if (theme === "glass") {
    installs.push("(optional) Verify your CSS uses backdrop-filter — Safari requires -webkit-backdrop-filter.");
  }

  return [
    `1. Where to drop the files`,
    `   ${dropPath}`,
    ``,
    `2. Tokens`,
    `   The components reference --df-* CSS variables. Make sure the Darkforge`,
    `   token block (see src/lib/token-system.ts → DF_TOKENS_CSS) is loaded`,
    `   into your global stylesheet (e.g. app/globals.css or src/index.css).`,
    `   If you skipped that step, run forge_dark first.`,
    ``,
    `3. Dependencies`,
    installs.length > 0 ? installs.map((i) => `   - ${i}`).join("\n") : `   None — your stack already has everything the generated code uses.`,
    ``,
    `4. Theme`,
    `   This page was generated with theme="${theme}". To switch later, re-run`,
    `   forge_page with a different theme value — surfaces and CTA glows will`,
    `   adapt automatically.`,
    ``,
    `5. Accessibility note`,
    `   Each section uses a semantic landmark and an id-linked heading.`,
    `   The default keyboard order matches visual order. Run an axe-core or`,
    `   Lighthouse pass before shipping to catch any regression you introduce.`,
  ].join("\n");
}

// ──────────────────────────────────────────────────────────────────────────────
// Handler
// ──────────────────────────────────────────────────────────────────────────────

export async function handler(args: ForgeArgs): Promise<ToolResult> {
  try {
    const pageType = args.pageType;
    const theme: Theme = args.theme ?? "dark";

    let detected:
      | { framework: Framework; language: Language; animation: string[] }
      | undefined;

    if (!args.stack) {
      const target = args.projectPath ?? process.env.DARKFORGE_PROJECT_ROOT ?? process.cwd();
      try {
        const profile = await detectStack(target);
        detected = {
          framework: profile.capabilities.framework,
          language: profile.capabilities.language,
          animation: profile.capabilities.animation,
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return toolError("forge_page", `Could not auto-detect stack: ${msg}`, [
          "Pass an explicit `stack` argument (e.g. { framework: 'nextjs', language: 'typescript', animation: 'framer-motion' })",
          "Or run scan_stack first and confirm a package.json exists at the project root",
          `Or set DARKFORGE_PROJECT_ROOT to the correct project path`,
        ]);
      }
    }

    const stack = resolveStack(args, detected);
    const ext: "tsx" | "jsx" = stack.language === "javascript" ? "jsx" : "tsx";

    const description = (args.description ?? "").trim();
    const lowerDesc = description.toLowerCase();

    // Resolve sections from explicit override or pageType defaults. When the
    // section list is defaulted, we may augment it from description hints.
    const explicitSections = !!(args.sections && args.sections.length > 0);
    const baseSections = explicitSections
      ? (args.sections as string[])
      : [...DEFAULT_SECTIONS[pageType]];

    const wantsLogoStrip =
      /\b(partner logo|partner-logos|partner logos|logo strip|logos strip|brand strip|marquee)\b/.test(
        lowerDesc,
      );
    const hasFeatures = baseSections.some(
      (s) => s.toLowerCase() === "features" || s.toLowerCase() === "partner-logos",
    );

    let sections = baseSections;
    if (!explicitSections && wantsLogoStrip && !baseSections.includes("partner-logos")) {
      // Insert a partner-logos strip near the top, after hero if present.
      const heroIdx = baseSections.findIndex((s) => s.toLowerCase() === "hero");
      sections = [...baseSections];
      const insertAt = heroIdx >= 0 ? heroIdx + 1 : 0;
      sections.splice(insertAt, 0, "partner-logos");
      void hasFeatures;
    }

    // Reference routing: compose a free-text intent from pageType, sections,
    // and the user's free-text description. Load ALL routed refs (cap is
    // upstream in routeIntent). Each load is best-effort — a miss must not
    // abort the tool.
    const routingInput = [pageType, ...sections, description].filter(Boolean).join(" ");
    const routedReferences = routeIntent(routingInput);

    const referenceTexts: ReferenceText[] = [];
    for (const name of routedReferences) {
      try {
        const md = await loadReference(name);
        referenceTexts.push({ name, markdown: md });
      } catch {
        // Reference miss is non-fatal — skip and continue.
      }
    }

    const referenceExcerpts: ReferenceExcerpt[] = referenceTexts.map((r) => ({
      name: r.name,
      excerpt: r.markdown.slice(0, REFERENCE_EXCERPT_CHARS),
    }));

    const ctx: SectionCtx = {
      pageType,
      theme,
      stack,
      ext,
      description,
      referenceTexts,
    };

    const sectionFiles = sections.map((s) => generateSection(s, ctx));
    const rootFile = buildRootPage(pageType, sectionFiles, stack, ext, ctx);
    const allFiles: GeneratedFile[] = [...sectionFiles, rootFile];

    const pageStructure = buildPageStructure(sectionFiles);
    const setupInstructions = buildSetupInstructions(stack, theme);

    const previewBlock = allFiles
      .map((f) => {
        const firstLines = f.code.split("\n").slice(0, 2).join("\n");
        return `• ${f.filename}\n${firstLines}`;
      })
      .join("\n\n");

    const headerLines: string[] = [];
    if (routedReferences.length > 0) {
      headerLines.push(`// References consulted: ${routedReferences.join(", ")}`);
      for (const exc of referenceExcerpts) {
        // Cap each per-ref comment block at ~200 chars total of body.
        const trimmed = exc.excerpt.replace(/\s+/g, " ").trim().slice(0, 200);
        headerLines.push(`// ${exc.name}: ${trimmed}`);
      }
      headerLines.push("");
    }

    const text = [
      ...headerLines,
      `Forged a ${pageType} page (${theme} theme) for ${stack.framework} / ${stack.language}.`,
      stack.hasFramerMotion
        ? `Animations: framer-motion with whileInView + useReducedMotion guard.`
        : `Animations: CSS keyframes with prefers-reduced-motion fallback (no framer-motion detected).`,
      ``,
      `Page structure:`,
      pageStructure,
      ``,
      `── Files (${allFiles.length}) ──`,
      previewBlock,
      ``,
      `Setup:`,
      setupInstructions,
    ].join("\n");

    return toolOk(text, {
      files: allFiles,
      pageStructure,
      setupInstructions,
      routedReferences,
      referenceExcerpts,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return toolError("forge_page", msg, [
      "Confirm pageType is one of saas | product | portfolio | agency | startup | dashboard",
      "If sections override was passed, ensure each is a known section name (or accept the tool will treat unknown names as generic placeholders)",
      "If detectStack failed, pass an explicit `stack` argument or run scan_stack first",
    ]);
  }
}
