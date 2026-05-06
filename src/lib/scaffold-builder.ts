/**
 * Scaffold builder. Turns a ParsedSpec into a semantic JSX scaffold.
 *
 * Responsibilities:
 *   - Compose semantic HTML primitives (aside, nav, section, article, ...)
 *     from the spec's structures + counts + entities.
 *   - Repeat elements based on counts (e.g. counts.stat = 4 -> emit four
 *     <article> stat cards, unrolled).
 *   - Use entities verbatim where they fit (entities + nav -> nav item labels;
 *     entities + card -> card titles).
 *   - Where actual content would live, emit /* ELABORATE: hint *\/ comments.
 *     The host AI fills these in using routedReferences.
 *   - Use `var(--df-*)` tokens via inline style props (no Tailwind required —
 *     this works for any project regardless of stack).
 *
 * What this layer DOES NOT do:
 *   - Apply variant styling primitives (color-mix borders, stacked shadows,
 *     glass blur). That's variant-applier.
 *   - Inject motion. That's motion-applier.
 *   - Render the imports block / function signature. That's the renderer in
 *     forge-component.
 *
 * Pure function. No I/O.
 */

import type { ParsedSpec, Scaffold, Structure } from "../types/index.js";

/* ── helpers ─────────────────────────────────────────────────────────────── */

function pascalCase(input: string): string {
  return input
    .split(/[\s\-_]+/)
    .filter(Boolean)
    .map((w) => (/^[A-Z0-9]+$/.test(w) ? w[0] + w.slice(1).toLowerCase() : (w[0] ?? "").toUpperCase() + w.slice(1)))
    .join("")
    .replace(/[^A-Za-z0-9]/g, "")
    || "Component";
}

function deriveComponentName(spec: ParsedSpec): string {
  const head = pascalCase(spec.headline);
  // Append a structure suffix if not already present.
  const primary = spec.structures[0];
  if (!primary) return head;
  const suffix = pascalCase(primary);
  return head.toLowerCase().includes(suffix.toLowerCase()) ? head : `${head}${suffix}`;
}

/** Indent a multi-line string by `n` spaces (every line). */
function indent(s: string, n: number): string {
  const pad = " ".repeat(n);
  return s
    .split("\n")
    .map((l) => (l.length > 0 ? pad + l : l))
    .join("\n");
}

/** Build inline `style={{ ... }}` from a key->value map. Skips empty values. */
function styleProp(map: Record<string, string | number | undefined>): string {
  const entries = Object.entries(map).filter(([, v]) => v !== "" && v !== undefined && v !== null);
  if (entries.length === 0) return "";
  const body = entries
    .map(([k, v]) => (typeof v === "number" ? `${k}: ${v}` : `${k}: ${JSON.stringify(v as string)}`))
    .join(", ");
  return ` style={{ ${body} }}`;
}

/** Token-driven style baseline used by every scaffolded surface. */
const SURFACE_STYLE = {
  background: "var(--df-bg-surface)",
  color: "var(--df-text-primary)",
  border: "1px solid var(--df-border-default)",
  borderRadius: "12px",
};

const MUTED_TEXT_STYLE = {
  color: "var(--df-text-muted)",
};

const SECONDARY_TEXT_STYLE = {
  color: "var(--df-text-secondary)",
};

/* ── primitive structure builders ────────────────────────────────────────── */

function buildSidebar(spec: ParsedSpec, navItemLabels: string[]): string {
  const items = navItemLabels.length > 0
    ? navItemLabels.map((label, i) => {
        const active = i === 0 ? ' data-active="true"' : "";
        return `      <li${active}>
        <a href="#" style={{ color: "var(--df-text-primary)", padding: "0.5rem 0.75rem", borderRadius: "8px", display: "block", fontSize: "0.875rem" }}>
          ${escapeJsx(label)}
        </a>
      </li>`;
      }).join("\n")
    : `      <li data-active="true">
        <a href="#" style={{ color: "var(--df-text-primary)", padding: "0.5rem 0.75rem", borderRadius: "8px", display: "block", fontSize: "0.875rem" }}>
          {/* ELABORATE: active nav item label */}
        </a>
      </li>
      <li>
        <a href="#" style={{ color: "var(--df-text-secondary)", padding: "0.5rem 0.75rem", borderRadius: "8px", display: "block", fontSize: "0.875rem" }}>
          {/* ELABORATE: nav item */}
        </a>
      </li>
      <li>
        <a href="#" style={{ color: "var(--df-text-secondary)", padding: "0.5rem 0.75rem", borderRadius: "8px", display: "block", fontSize: "0.875rem" }}>
          {/* ELABORATE: nav item */}
        </a>
      </li>`;

  return `<aside${styleProp({ ...SURFACE_STYLE, padding: "1.25rem", width: "240px", display: "flex", flexDirection: "column", gap: "0.5rem" })}>
  <header${styleProp({ marginBottom: "0.75rem" })}>
    <p${styleProp({ ...MUTED_TEXT_STYLE, fontSize: "0.75rem", letterSpacing: "0.08em", textTransform: "uppercase", margin: 0 })}>
      {/* ELABORATE: workspace label */}
    </p>
  </header>
  <nav aria-label="Primary"${styleProp({ display: "flex", flexDirection: "column", gap: "0.25rem" })}>
    <ul${styleProp({ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.125rem" })}>
${items}
    </ul>
  </nav>
</aside>`;
}

function buildStatCard(idx: number, label?: string): string {
  return `<article data-stat-index="${idx}"${styleProp({ ...SURFACE_STYLE, padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: "0.5rem", minHeight: "120px" })}>
  <p${styleProp({ ...MUTED_TEXT_STYLE, fontSize: "0.75rem", letterSpacing: "0.06em", textTransform: "uppercase", margin: 0 })}>
    {/* ELABORATE: stat label${label ? ` (${label})` : ""} */}
  </p>
  <p${styleProp({ color: "var(--df-text-primary)", fontSize: "1.875rem", fontWeight: 600, letterSpacing: "-0.01em", margin: 0 })}>
    {/* ELABORATE: stat value */}
  </p>
  <p${styleProp({ ...SECONDARY_TEXT_STYLE, fontSize: "0.8125rem", margin: 0 })}>
    {/* ELABORATE: stat delta or sub-line */}
  </p>
</article>`;
}

function buildStatGrid(count: number, entities: string[]): string {
  const n = Math.max(1, Math.min(12, count));
  const cols = n <= 2 ? n : n <= 4 ? 2 : 3;
  const cards = Array.from({ length: n }, (_, i) => buildStatCard(i + 1, entities[i] ?? undefined)).join("\n");
  return `<div${styleProp({ display: "grid", gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap: "1rem" })}>
${indent(cards, 2)}
</div>`;
}

function buildPricingTierCard(idx: number, isMiddle: boolean, label?: string): string {
  const accent = isMiddle ? { borderColor: "var(--df-neon-violet)" } : {};
  return `<article data-tier-index="${idx}"${styleProp({ ...SURFACE_STYLE, ...accent, padding: "1.5rem 1.5rem 1.75rem", display: "flex", flexDirection: "column", gap: "1rem" })}>
  <header${styleProp({ display: "flex", flexDirection: "column", gap: "0.25rem" })}>
    <p${styleProp({ ...MUTED_TEXT_STYLE, fontSize: "0.75rem", letterSpacing: "0.08em", textTransform: "uppercase", margin: 0 })}>
      {/* ELABORATE: plan name${label ? ` (${label})` : ""} */}
    </p>
    <p${styleProp({ color: "var(--df-text-primary)", fontSize: "2rem", fontWeight: 600, margin: 0 })}>
      {/* ELABORATE: price */}
    </p>
    <p${styleProp({ ...SECONDARY_TEXT_STYLE, fontSize: "0.875rem", margin: 0 })}>
      {/* ELABORATE: price suffix (e.g. /month) */}
    </p>
  </header>
  <ul${styleProp({ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" })}>
    <li${styleProp({ ...SECONDARY_TEXT_STYLE, fontSize: "0.875rem" })}>{/* ELABORATE: feature 1 */}</li>
    <li${styleProp({ ...SECONDARY_TEXT_STYLE, fontSize: "0.875rem" })}>{/* ELABORATE: feature 2 */}</li>
    <li${styleProp({ ...SECONDARY_TEXT_STYLE, fontSize: "0.875rem" })}>{/* ELABORATE: feature 3 */}</li>
  </ul>
  <button data-cta="${isMiddle ? "primary" : "secondary"}"${styleProp({
    background: isMiddle ? "var(--df-neon-violet)" : "transparent",
    color: isMiddle ? "var(--df-bg-base)" : "var(--df-text-primary)",
    border: isMiddle ? "1px solid var(--df-neon-violet)" : "1px solid var(--df-border-default)",
    borderRadius: "8px",
    padding: "0.625rem 1rem",
    fontSize: "0.875rem",
    fontWeight: 600,
    cursor: "pointer",
  })}>
    {/* ELABORATE: CTA copy */}
  </button>
</article>`;
}

function buildPricingTiers(count: number, entities: string[]): string {
  const n = Math.max(1, Math.min(6, count));
  const middleIdx = n >= 3 ? Math.floor(n / 2) : -1;
  const cards = Array.from({ length: n }, (_, i) => buildPricingTierCard(i + 1, i === middleIdx, entities[i] ?? undefined)).join("\n");
  return `<div${styleProp({ display: "grid", gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))`, gap: "1.25rem", maxWidth: "1080px", margin: "0 auto" })}>
${indent(cards, 2)}
</div>`;
}

function buildHeroShell(inner: string, headline: string): string {
  return `<section${styleProp({
    minHeight: "100svh",
    background: "var(--df-bg-base)",
    color: "var(--df-text-primary)",
    padding: "clamp(3rem, 8vw, 6rem) 1.5rem",
    display: "flex",
    flexDirection: "column",
    gap: "2.5rem",
    alignItems: "center",
    justifyContent: "center",
  })}>
  <header${styleProp({ display: "flex", flexDirection: "column", gap: "1rem", textAlign: "center", maxWidth: "780px" })}>
    <p${styleProp({ ...MUTED_TEXT_STYLE, fontSize: "0.8125rem", letterSpacing: "0.12em", textTransform: "uppercase", margin: 0 })}>
      {/* ELABORATE: eyebrow / category label */}
    </p>
    <h1${styleProp({ fontSize: "clamp(2.5rem, 6vw, 4.25rem)", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.05, margin: 0 })}>
      {/* ELABORATE: hero headline derived from "${headline}" */}
    </h1>
    <p${styleProp({ ...SECONDARY_TEXT_STYLE, fontSize: "1.125rem", lineHeight: 1.5, margin: 0 })}>
      {/* ELABORATE: hero subline / value prop */}
    </p>
  </header>
  <div${styleProp({ display: "flex", gap: "0.75rem", alignItems: "center" })}>
    <button data-cta="primary"${styleProp({
      background: "var(--df-neon-violet)",
      color: "var(--df-bg-base)",
      border: "1px solid var(--df-neon-violet)",
      borderRadius: "8px",
      padding: "0.75rem 1.25rem",
      fontSize: "0.9375rem",
      fontWeight: 600,
      cursor: "pointer",
    })}>
      {/* ELABORATE: primary CTA copy */}
    </button>
    <button data-cta="secondary"${styleProp({
      background: "transparent",
      color: "var(--df-text-primary)",
      border: "1px solid var(--df-border-default)",
      borderRadius: "8px",
      padding: "0.75rem 1.25rem",
      fontSize: "0.9375rem",
      fontWeight: 500,
      cursor: "pointer",
    })}>
      {/* ELABORATE: secondary CTA copy */}
    </button>
  </div>
${inner ? indent(inner, 2) : "  {/* ELABORATE: hero supporting visual — typography, 3D scene, gradient mesh, background art */}"}
</section>`;
}

function buildLogoStrip(entities: string[]): string {
  const items = (entities.length > 0 ? entities : ["{/* ELABORATE: brand 1 */}", "{/* ELABORATE: brand 2 */}", "{/* ELABORATE: brand 3 */}"])
    .map((label) =>
      `      <li${styleProp({ ...SURFACE_STYLE, padding: "0.5rem 1rem", fontSize: "0.875rem", color: "var(--df-text-secondary)", whiteSpace: "nowrap" })}>
        ${entities.length > 0 ? escapeJsx(label) : label}
      </li>`,
    )
    .join("\n");
  return `<div${styleProp({
    background: "var(--df-bg-base)",
    padding: "1.5rem",
    borderTop: "1px solid var(--df-border-subtle)",
    borderBottom: "1px solid var(--df-border-subtle)",
  })}>
  <ul${styleProp({
    listStyle: "none",
    padding: 0,
    margin: 0,
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    overflowX: "auto",
    flexWrap: "nowrap",
  })}>
${items}
  </ul>
</div>`;
}

function buildModalDialog(headline: string): string {
  return `<div role="dialog" aria-modal="true" aria-labelledby="dialog-title"${styleProp({
    position: "fixed",
    inset: 0,
    background: "var(--df-bg-overlay)",
    backdropFilter: "blur(8px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "1.5rem",
    zIndex: 50,
  })}>
  <div${styleProp({ ...SURFACE_STYLE, padding: "1.75rem", maxWidth: "420px", width: "100%", display: "flex", flexDirection: "column", gap: "1rem" })}>
    <header${styleProp({ display: "flex", flexDirection: "column", gap: "0.25rem" })}>
      <h2 id="dialog-title"${styleProp({ color: "var(--df-text-primary)", fontSize: "1.125rem", fontWeight: 600, margin: 0 })}>
        {/* ELABORATE: dialog title (was "${headline}") */}
      </h2>
      <p${styleProp({ ...SECONDARY_TEXT_STYLE, fontSize: "0.875rem", margin: 0 })}>
        {/* ELABORATE: dialog body */}
      </p>
    </header>
    <footer${styleProp({ display: "flex", justifyContent: "flex-end", gap: "0.5rem" })}>
      <button${styleProp({ background: "transparent", color: "var(--df-text-secondary)", border: "1px solid var(--df-border-default)", borderRadius: "8px", padding: "0.5rem 0.875rem", fontSize: "0.875rem", cursor: "pointer" })}>
        {/* ELABORATE: cancel */}
      </button>
      <button${styleProp({ background: "var(--df-neon-violet)", color: "var(--df-bg-base)", border: "1px solid var(--df-neon-violet)", borderRadius: "8px", padding: "0.5rem 0.875rem", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer" })}>
        {/* ELABORATE: confirm */}
      </button>
    </footer>
  </div>
</div>`;
}

function buildTestimonial(entities: string[]): string {
  const author = entities[0];
  const role = entities[1];
  return `<figure${styleProp({ ...SURFACE_STYLE, padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem", maxWidth: "560px" })}>
  <blockquote${styleProp({ color: "var(--df-text-primary)", fontSize: "1rem", lineHeight: 1.5, margin: 0, fontStyle: "normal" })}>
    {/* ELABORATE: testimonial quote */}
  </blockquote>
  <figcaption${styleProp({ display: "flex", flexDirection: "column", gap: "0.125rem" })}>
    <p${styleProp({ color: "var(--df-text-primary)", fontSize: "0.875rem", fontWeight: 600, margin: 0 })}>${author ? escapeJsx(author) : "{/* ELABORATE: author name */}"}</p>
    <p${styleProp({ ...MUTED_TEXT_STYLE, fontSize: "0.8125rem", margin: 0 })}>${role ? escapeJsx(role) : "{/* ELABORATE: author role */}"}</p>
  </figcaption>
</figure>`;
}

function buildBareCardGrid(count: number, entities: string[]): string {
  const n = Math.max(1, Math.min(12, count));
  const cols = n <= 2 ? n : n <= 4 ? 2 : 3;
  const cards = Array.from({ length: n }, (_, i) => {
    const label = entities[i];
    const titleSlot = label ? escapeJsx(label) : "{/* ELABORATE: card title */}";
    return `<article data-card-index="${i + 1}"${styleProp({ ...SURFACE_STYLE, padding: "1.5rem", display: "flex", flexDirection: "column", gap: "0.625rem", minHeight: "180px" })}>
  <p${styleProp({ ...MUTED_TEXT_STYLE, fontSize: "0.75rem", letterSpacing: "0.08em", textTransform: "uppercase", margin: 0 })}>
    {/* ELABORATE: card eyebrow${label ? ` (${label})` : ""} */}
  </p>
  <p${styleProp({ color: "var(--df-text-primary)", fontSize: "1.125rem", fontWeight: 600, margin: 0 })}>
    ${titleSlot}
  </p>
  <p${styleProp({ ...SECONDARY_TEXT_STYLE, fontSize: "0.875rem", lineHeight: 1.5, margin: 0 })}>
    {/* ELABORATE: card body */}
  </p>
</article>`;
  }).join("\n");
  return `<div${styleProp({ display: "grid", gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap: "1rem" })}>
${indent(cards, 2)}
</div>`;
}

/* ── escape helper ───────────────────────────────────────────────────────── */

function escapeJsx(s: string): string {
  return s.replace(/[<>{}]/g, (c) => `{"${c}"}`);
}

/* ── token discovery ─────────────────────────────────────────────────────── */

const TOKEN_RE = /var\(--df-[a-z0-9-]+\)/gi;

function scanTokens(jsx: string): Set<string> {
  const tokens = new Set<string>();
  for (const match of jsx.matchAll(TOKEN_RE)) {
    const inner = match[0].replace(/^var\(/, "").replace(/\)$/, "");
    tokens.add(inner);
  }
  return tokens;
}

/* ── public API ──────────────────────────────────────────────────────────── */

/**
 * Compose a Scaffold from a ParsedSpec. Always returns a usable scaffold —
 * if no concrete structures were detected, builds a generic dark surface
 * with an ELABORATE marker so the host AI can fill it in.
 */
export function buildScaffold(spec: ParsedSpec): Scaffold {
  const componentName = deriveComponentName(spec);
  const structures = spec.structures;
  const counts = spec.counts;

  // Decide top-level layout family based on which primary structures are present.
  const has = (s: Structure) => structures.includes(s);
  const heroLike = has("hero");
  const sidebarLike = has("sidebar");
  const navLike = has("nav") || sidebarLike;
  const tierLike = has("pricing-tier");
  const statLike = has("stat");
  const cardLike = has("card") || has("tile") || has("feature");
  const stripLike = has("strip");
  const modalLike = has("modal") || has("drawer");
  const testimonialLike = has("testimonial");

  const navItemEntities = navLike ? spec.entities : [];
  const cardEntities = !navLike ? spec.entities : [];

  let body: string;

  if (modalLike) {
    body = buildModalDialog(spec.headline);
  } else if (sidebarLike) {
    // Dashboard layout: aside + main with stat/card grid.
    const sidebar = buildSidebar(spec, navItemEntities);
    const mainInner = statLike
      ? buildStatGrid(counts.stat ?? 4, cardEntities)
      : tierLike
        ? buildPricingTiers(counts["pricing-tier"] ?? 3, cardEntities)
        : cardLike
          ? buildBareCardGrid(counts.card ?? counts.tile ?? counts.feature ?? 4, cardEntities)
          : `<div>{/* ELABORATE: main content area */}</div>`;
    const main = `<main${styleProp({ flex: "1", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" })}>
  <header${styleProp({ display: "flex", flexDirection: "column", gap: "0.25rem" })}>
    <h1${styleProp({ color: "var(--df-text-primary)", fontSize: "1.5rem", fontWeight: 600, margin: 0, letterSpacing: "-0.01em" })}>
      {/* ELABORATE: page heading derived from "${spec.headline}" */}
    </h1>
    <p${styleProp({ ...SECONDARY_TEXT_STYLE, fontSize: "0.875rem", margin: 0 })}>
      {/* ELABORATE: subline */}
    </p>
  </header>
${indent(mainInner, 2)}
</main>`;
    const wrapStyle = heroLike
      ? { minHeight: "100svh", background: "var(--df-bg-base)" }
      : { minHeight: "100vh", background: "var(--df-bg-base)" };
    body = `<div${styleProp({ ...wrapStyle, color: "var(--df-text-primary)", display: "flex", alignItems: "stretch" })}>
${indent(sidebar, 2)}
${indent(main, 2)}
</div>`;
  } else if (tierLike) {
    const tiers = buildPricingTiers(counts["pricing-tier"] ?? counts.card ?? 3, cardEntities);
    body = heroLike
      ? buildHeroShell(tiers, spec.headline)
      : `<section${styleProp({ background: "var(--df-bg-base)", color: "var(--df-text-primary)", padding: "clamp(3rem, 8vw, 5rem) 1.5rem" })}>
  <header${styleProp({ display: "flex", flexDirection: "column", gap: "0.5rem", textAlign: "center", marginBottom: "2.5rem" })}>
    <h2${styleProp({ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 700, letterSpacing: "-0.01em", margin: 0 })}>
      {/* ELABORATE: heading derived from "${spec.headline}" */}
    </h2>
    <p${styleProp({ ...SECONDARY_TEXT_STYLE, fontSize: "1rem", margin: 0 })}>
      {/* ELABORATE: subhead */}
    </p>
  </header>
${indent(tiers, 2)}
</section>`;
  } else if (statLike && !heroLike) {
    body = buildStatGrid(counts.stat ?? 4, cardEntities);
  } else if (stripLike) {
    body = buildLogoStrip(spec.entities);
  } else if (testimonialLike) {
    body = buildTestimonial(spec.entities);
  } else if (heroLike) {
    body = buildHeroShell("", spec.headline);
  } else if (cardLike) {
    body = buildBareCardGrid(counts.card ?? counts.tile ?? counts.feature ?? 3, cardEntities);
  } else {
    body = `<section${styleProp({ background: "var(--df-bg-base)", color: "var(--df-text-primary)", padding: "clamp(3rem, 8vw, 5rem) 1.5rem", minHeight: "60vh" })}>
  <h2${styleProp({ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 600, margin: 0, letterSpacing: "-0.01em" })}>
    {/* ELABORATE: heading derived from "${spec.headline}" */}
  </h2>
  <p${styleProp({ ...SECONDARY_TEXT_STYLE, fontSize: "1rem", marginTop: "0.75rem" })}>
    {/* ELABORATE: body content */}
  </p>
</section>`;
  }

  const tokensUsed = scanTokens(body);
  return {
    componentName,
    jsx: body,
    imports: [{ from: "react", default: "* as React" }],
    tokensUsed,
    usesPrefersReduced: false,
  };
}

/** Re-scan tokens after a pipeline stage mutates the jsx string. */
export function rescanTokens(scaffold: Scaffold): Scaffold {
  return { ...scaffold, tokensUsed: scanTokens(scaffold.jsx) };
}
