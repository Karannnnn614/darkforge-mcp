/**
 * Variant applier. Mutates a Scaffold's jsx in place to apply real visual
 * primitives — color-mix borders, stacked shadows, glass surfaces — not
 * just token swaps.
 *
 * Why this exists: the previous implementation drove "neon" and "glass"
 * variants through trivial token swaps and produced visually-flat output.
 * This module is the place where variant cues become actual decoration.
 *
 * Pure function. No I/O.
 *
 * Targeting strategy: each scaffolded surface element ships with `data-`
 * attributes (data-stat-index, data-tier-index, data-card-index, data-cta).
 * The applier finds these markers and mutates their inline `style={{ ... }}`
 * prop. We never parse the JSX into an AST — we use targeted regex against
 * known data-attribute anchors. Scaffold authoring contract: every variant-
 * styled surface MUST carry one of the data anchors recognised below.
 */

import type { Scaffold, Variant } from "../types/index.js";
import { rescanTokens } from "./scaffold-builder.js";

/* ── style fragments ─────────────────────────────────────────────────────── */

const FOCUS_OUTLINE = '"--df-focus-outline"';

interface StyleOverrides {
  background?: string;
  border?: string;
  boxShadow?: string;
  backdropFilter?: string;
  WebkitBackdropFilter?: string;
  color?: string;
  transition?: string;
}

function neonSurfaceOverrides(): StyleOverrides {
  return {
    background: "var(--df-bg-surface)",
    border: "1px solid color-mix(in oklab, var(--df-neon-violet) 60%, transparent)",
    boxShadow:
      "0 0 0 1px color-mix(in oklab, var(--df-neon-violet) 30%, transparent), " +
      "0 0 24px var(--df-glow-violet), " +
      "inset 0 1px 0 rgba(255, 255, 255, 0.04)",
    transition: "transform var(--df-dur-base) var(--df-ease-out), box-shadow var(--df-dur-base) var(--df-ease-out)",
  };
}

function neonAccentSurface(): StyleOverrides {
  // For middle pricing tier or active sidebar item — stronger neon weight.
  return {
    background: "var(--df-bg-surface)",
    border: "1px solid color-mix(in oklab, var(--df-neon-violet) 80%, transparent)",
    boxShadow:
      "0 0 0 1px var(--df-neon-violet), " +
      "0 0 32px var(--df-glow-violet-strong, var(--df-glow-violet)), " +
      "inset 0 1px 0 rgba(255, 255, 255, 0.06)",
    transition: "transform var(--df-dur-base) var(--df-ease-out), box-shadow var(--df-dur-base) var(--df-ease-out)",
  };
}

function glassSurfaceOverrides(): StyleOverrides {
  return {
    background: "var(--df-glass-bg)",
    border: "1px solid var(--df-glass-border)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    transition: "transform var(--df-dur-base) var(--df-ease-out), border-color var(--df-dur-base) var(--df-ease-out)",
  };
}

function minimalSurfaceOverrides(): StyleOverrides {
  return {
    background: "transparent",
    border: "1px solid var(--df-border-subtle)",
    boxShadow: "none",
  };
}

/**
 * Merge overrides into an existing style string.
 *
 * Input: ` style={{ background: "var(--df-bg-surface)", color: "var(--df-text-primary)", border: "1px solid var(--df-border-default)", borderRadius: "12px" }}`
 * Output: same shape, with our keys replacing/extending the existing ones.
 *
 * Approach: parse the inner object literal as a sequence of `key: value` pairs
 * (values are double-quoted strings, optionally numbers). Apply overrides.
 * Re-emit. We intentionally keep the format consistent with how scaffold-
 * builder emits style props (JSON.stringify-quoted values).
 */
function mergeStyleProp(styleProp: string, overrides: StyleOverrides): string {
  // Match the inner braces of style={{ ... }}.
  const m = styleProp.match(/style=\{\{\s*([\s\S]*?)\s*\}\}/);
  if (!m || typeof m[1] !== "string") {
    // No style prop; emit a fresh one.
    return ` style={{ ${formatPairs(overrides as Record<string, string>)} }}`;
  }
  const inner = m[1];
  const pairs = parsePairs(inner);
  for (const [k, v] of Object.entries(overrides)) {
    if (typeof v === "string") pairs[k] = v;
  }
  return ` style={{ ${formatPairs(pairs)} }}`;
}

function parsePairs(inner: string): Record<string, string> {
  const out: Record<string, string> = {};
  // key: "value" or key: number  (value strings can contain commas inside quotes)
  // Simple state machine: walk forward, find key, then ":", then value.
  let i = 0;
  const n = inner.length;
  while (i < n) {
    while (i < n && /[\s,]/.test(inner[i] ?? "")) i++;
    if (i >= n) break;
    // key
    const keyStart = i;
    while (i < n && /[A-Za-z0-9_$]/.test(inner[i] ?? "")) i++;
    const key = inner.slice(keyStart, i);
    if (!key) break;
    // skip ws + ":"
    while (i < n && /\s/.test(inner[i] ?? "")) i++;
    if (inner[i] !== ":") break;
    i++;
    while (i < n && /\s/.test(inner[i] ?? "")) i++;
    // value: either "...", or number until comma/whitespace.
    let value: string;
    if (inner[i] === '"') {
      i++;
      const valStart = i;
      while (i < n && inner[i] !== '"') {
        if (inner[i] === "\\") i++;
        i++;
      }
      value = inner.slice(valStart, i);
      i++; // closing quote
    } else {
      const valStart = i;
      while (i < n && inner[i] !== "," && !/\s/.test(inner[i] ?? "")) i++;
      value = inner.slice(valStart, i);
    }
    out[key] = value;
  }
  return out;
}

function formatPairs(pairs: Record<string, string | number>): string {
  return Object.entries(pairs)
    .filter(([, v]) => v !== "" && v !== undefined && v !== null)
    .map(([k, v]) => {
      if (typeof v === "number") return `${k}: ${v}`;
      // Numeric strings (without units, no spaces, no parens) can be emitted as numbers.
      if (/^-?\d+(?:\.\d+)?$/.test(v)) return `${k}: ${v}`;
      return `${k}: ${JSON.stringify(v)}`;
    })
    .join(", ");
}

/* ── targeted mutators ───────────────────────────────────────────────────── */

/**
 * For each anchor specifier (either a bare attribute name like "data-stat-index"
 * or an exact attribute match like 'data-cta="primary"'), find every opening
 * tag that carries it AND replace that tag's `style={{ ... }}` with the merged
 * overrides.
 *
 * Bare names get expanded to `name="..."`. Exact matches are used verbatim.
 */
function mutateAnchoredElements(
  jsx: string,
  anchors: readonly string[],
  overrides: StyleOverrides,
): string {
  let out = jsx;
  for (const anchor of anchors) {
    // If the anchor already includes "=", treat it as an exact attribute matcher.
    // Otherwise wrap as `name="..."`.
    const anchorPattern = anchor.includes("=")
      ? anchor.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      : `${anchor}="[^"]*"`;
    const re = new RegExp(`(${anchorPattern}[\\s\\S]*?)(\\sstyle=\\{\\{[\\s\\S]*?\\}\\})`, "g");
    out = out.replace(re, (_full, prefix: string, styleAttr: string) => {
      const merged = mergeStyleProp(styleAttr, overrides);
      return `${prefix}${merged}`;
    });
  }
  return out;
}

/**
 * Replace the style={{ ... }} on every opening tag whose tag name matches.
 * Used for blanket treatments like "every <article> in this scaffold".
 */
function mutateByTagName(
  jsx: string,
  tags: readonly string[],
  overrides: StyleOverrides,
): string {
  let out = jsx;
  for (const tag of tags) {
    // Match opening tag with style prop. Stop before children to avoid greedy crash.
    const re = new RegExp(`(<${tag}\\b)([^>]*?)(\\sstyle=\\{\\{[\\s\\S]*?\\}\\})`, "g");
    out = out.replace(re, (full, open: string, mid: string, styleAttr: string) => {
      const merged = mergeStyleProp(styleAttr, overrides);
      return `${open}${mid}${merged}`;
    });
  }
  return out;
}

/* ── public API ──────────────────────────────────────────────────────────── */

/**
 * Apply variant styling. Mutates `scaffold.jsx`. Token discovery is re-run
 * after mutation so `tokensUsed` reflects the final state.
 */
export function applyVariant(scaffold: Scaffold, variant: Variant): Scaffold {
  let jsx = scaffold.jsx;

  switch (variant) {
    case "neon": {
      // Cards / stats / tier surfaces get neon decoration.
      jsx = mutateAnchoredElements(jsx, ["data-stat-index", "data-card-index", "data-tier-index"], neonSurfaceOverrides());
      // Sidebar gets the same neon decoration on the outer aside.
      jsx = mutateByTagName(jsx, ["aside"], neonSurfaceOverrides());
      // CTA primary gets the accent treatment.
      jsx = mutateAnchoredElements(jsx, ['data-cta="primary"'], neonAccentSurface());
      // Active nav item: any <li data-active="true"> first child <a> gets neon text.
      jsx = jsx.replace(
        /(<li\s+data-active="true">\s*<a[^>]*?\sstyle=\{\{[^}]*\}\})/g,
        (m) => mergeStyleProp(m, { color: "var(--df-neon-violet)", border: "1px solid color-mix(in oklab, var(--df-neon-violet) 50%, transparent)", background: "color-mix(in oklab, var(--df-neon-violet) 10%, transparent)" }),
      );
      break;
    }
    case "glass": {
      jsx = mutateAnchoredElements(jsx, ["data-stat-index", "data-card-index", "data-tier-index"], glassSurfaceOverrides());
      jsx = mutateByTagName(jsx, ["aside", "figure"], glassSurfaceOverrides());
      // The middle (accent) tier: keep glass but overlay a neon tint border.
      jsx = mutateAnchoredElements(
        jsx,
        ["data-tier-index"],
        // Apply neon-tinted glass to anything carrying a borderColor=var(--df-neon-*) hint already (set by scaffold-builder for middle tier).
        // Implementation: post-process to add a stronger border AND keep glass background.
        {},
      );
      // For glass middle-tier accent, find articles whose style still has neon-violet border (set at scaffold time) and beef it up.
      jsx = jsx.replace(
        /(<article\s+data-tier-index="\d+"[\s\S]*?style=\{\{[\s\S]*?border:\s*"1px\s+solid\s+var\(--df-glass-border\)"[\s\S]*?\}\})/g,
        (m) => m, // no change here for now; primary CTA accent below covers it
      );
      // CTA primary stays solid neon (visible against glass).
      jsx = mutateAnchoredElements(jsx, ['data-cta="primary"'], {
        background: "var(--df-neon-violet)",
        color: "var(--df-bg-base)",
        border: "1px solid var(--df-neon-violet)",
        boxShadow: "0 0 24px var(--df-glow-violet)",
      });
      break;
    }
    case "minimal": {
      jsx = mutateAnchoredElements(jsx, ["data-stat-index", "data-card-index", "data-tier-index"], minimalSurfaceOverrides());
      jsx = mutateByTagName(jsx, ["aside", "figure"], minimalSurfaceOverrides());
      break;
    }
    case "dark":
    default: {
      // No-op — scaffold's default styling is already dark.
      break;
    }
  }

  return rescanTokens({ ...scaffold, jsx });
}

/**
 * Resolve the effective variant given the explicit arg and parsed style cues.
 * Description cues win over the explicit arg when exactly one of
 * neon/glass/minimal is cued. This makes "neon-edged active state" override
 * a stale `variant: "dark"` arg without surprising explicit overrides.
 */
export function chooseVariant(explicit: Variant | undefined, styleCues: ReadonlySet<string>): Variant {
  const hasNeon = styleCues.has("neon");
  const hasGlass = styleCues.has("glass");
  const hasMinimal = styleCues.has("minimal");
  const cuedCount = (hasNeon ? 1 : 0) + (hasGlass ? 1 : 0) + (hasMinimal ? 1 : 0);
  if (cuedCount === 1) {
    if (hasNeon) return "neon";
    if (hasGlass) return "glass";
    if (hasMinimal) return "minimal";
  }
  return explicit ?? "dark";
}
