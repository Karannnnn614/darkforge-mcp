/**
 * Description parser. Turns a freeform description into a ParsedSpec — a
 * structured representation with detected layout primitives, counts, named
 * entities, style cues, motion cues, and a clean headline.
 *
 * Pure function. No I/O. No deps beyond TS std.
 *
 * Intended consumers: scaffold-builder (uses structures + counts + entities),
 * variant-applier (uses styleCues), motion-applier (uses motionCues),
 * forge-component renderer (uses headline as componentName basis).
 *
 * Design notes:
 *   - Structures are detected by keyword presence in a tokenised description.
 *     Order in the output array reflects FIRST-occurrence order in the text.
 *   - Counts are number-immediately-before-structure-keyword. "4 stat cards"
 *     records counts.stat = 4 (the cardinality of the stat structure).
 *     "three plans" records counts["pricing-tier"] = 3 — number words are
 *     translated.
 *   - Headline is intentionally short (<= 5 significant words) to avoid
 *     verbose mid-sentence nonsense. "Dark dashboard sidebar with collapsible
 *     nav, 4 stat cards" -> "Dark Dashboard Sidebar".
 */

import type {
  ParsedSpec,
  Structure,
  StyleCue,
  MotionCue,
} from "../types/index.js";

/* ── vocabulary tables ───────────────────────────────────────────────────── */

interface StructureRule {
  readonly structure: Structure;
  readonly patterns: readonly RegExp[];
}

const STRUCTURE_RULES: readonly StructureRule[] = [
  { structure: "sidebar",      patterns: [/\bsidebars?\b/, /\bside\s+nav(?:s)?\b/] },
  { structure: "nav",          patterns: [/\bnav(?:bar|igation)?s?\b/, /\bmenu\b/, /\btopbar\b/] },
  { structure: "header",       patterns: [/\bheaders?\b/, /\bmasthead\b/] },
  { structure: "footer",       patterns: [/\bfooters?\b/, /\bsitemap\b/] },
  { structure: "breadcrumb",   patterns: [/\bbreadcrumbs?\b/] },
  { structure: "tabs",         patterns: [/\btabs?\b(?!\w)/] },
  { structure: "accordion",    patterns: [/\baccordions?\b/, /\bexpandables?\b/] },
  { structure: "modal",        patterns: [/\bmodals?\b/, /\bdialogs?\b/, /\bpopovers?\b/] },
  { structure: "drawer",       patterns: [/\bdrawers?\b/, /\bsheets?\b/] },
  { structure: "table",        patterns: [/\btables?\b/, /\bdata\s+grid\b/] },
  { structure: "form",         patterns: [/\bforms?\b/, /\bsign\s+up\s+form\b/] },
  { structure: "hero",         patterns: [/\bhero(?:es)?\b/, /\babove\s+the\s+fold\b/, /\blanding\s+top\b/] },
  { structure: "strip",        patterns: [/\bstrips?\b/, /\bmarquees?\b/, /\bband\b/, /\blogo\s+row\b/] },
  { structure: "grid",         patterns: [/\bgrids?\b/, /\bbentos?\b/] },
  { structure: "list",         patterns: [/\blists?\b/] },
  { structure: "stat",         patterns: [/\bstats?\b/, /\bmetrics?\b/, /\bkpis?\b/] },
  { structure: "pricing-tier", patterns: [/\bpricing\b/, /\btiers?\b/, /\bplans?\b/, /\bsubscriptions?\b/] },
  { structure: "testimonial",  patterns: [/\btestimonials?\b/, /\bquotes?\b/, /\breviews?\b/] },
  { structure: "feature",      patterns: [/\bfeatures?\b/, /\bbenefits?\b/] },
  { structure: "card",         patterns: [/\bcards?\b/, /\bchips?\b/, /\btiles?\b/] },
  { structure: "tile",         patterns: [/\btiles?\b/] },
];

interface CueRule<T> {
  readonly cue: T;
  readonly patterns: readonly RegExp[];
}

const STYLE_CUE_RULES: readonly CueRule<StyleCue>[] = [
  { cue: "neon",     patterns: [/\bneon\b/, /\bneon[- ]edged?\b/] },
  { cue: "glass",    patterns: [/\bglass(?:morph(?:ism)?)?\b/, /\bfrosted\b/, /\bblur(?:red)?\s+card\b/] },
  { cue: "minimal",  patterns: [/\bminimal\b/, /\bclean\b(?!\s+code)/] },
  { cue: "amoled",   patterns: [/\bamoled\b/, /\bpitch\s+black\b/] },
  { cue: "dark",     patterns: [/\bdark\b/] },
  { cue: "glow",     patterns: [/\bglow(?:ing)?\b/, /\bshine\b/, /\bedge\s+glow\b/] },
  { cue: "blur",     patterns: [/\bblur(?:red)?\b/, /\bbackdrop[- ]?blur\b/] },
  { cue: "gradient", patterns: [/\bgradient\b/] },
  { cue: "mesh",     patterns: [/\bmesh\b/] },
];

const MOTION_CUE_RULES: readonly CueRule<MotionCue>[] = [
  { cue: "reveal",          patterns: [/\breveal(?:s|ed|ing)?\b/, /\bunfold(?:s|ed|ing)?\b/] },
  { cue: "fade",            patterns: [/\bfade(?:[- ]in|s|d)?\b/] },
  { cue: "stagger",         patterns: [/\bstagger(?:ed|ing)?\b/, /\bcascade(?:d|s|ing)?\b/, /\bsequence\b/] },
  { cue: "hover-lift",      patterns: [/\bhover[- ]lift\b/, /\bhover\s+(?:scale|lift|raise)\b/, /\blift\s+on\s+hover\b/] },
  { cue: "magnetic",        patterns: [/\bmagnetic\b/] },
  { cue: "on-mount",        patterns: [/\bon\s+mount\b/, /\bmount\s+animation\b/, /\benter\s+animation\b/, /\bentrance\b/] },
  { cue: "scroll-trigger",  patterns: [/\bscroll[- ](?:trigger(?:ed)?|driven|reveal)\b/, /\bon\s+scroll\b/] },
  { cue: "parallax",        patterns: [/\bparallax\b/] },
];

/* ── helpers ─────────────────────────────────────────────────────────────── */

const NUMBER_WORDS: ReadonlyMap<string, number> = new Map([
  ["zero", 0], ["one", 1], ["two", 2], ["three", 3], ["four", 4],
  ["five", 5], ["six", 6], ["seven", 7], ["eight", 8], ["nine", 9],
  ["ten", 10], ["eleven", 11], ["twelve", 12],
]);

const HEADLINE_STOP_WORDS = new Set([
  "with", "containing", "featuring", "that", "for", "including",
  "named", "where", "which", "having", "showing", "on",
]);

const HEADLINE_LEADING_ARTICLES = /^(?:a|an|the)\s+/i;

const ALL_CAPS_PRESERVE = new Set(["AMOLED", "CTA", "API", "UI", "UX", "AWS", "SVG", "JSON", "PWA", "HTML", "CSS", "TSX", "JSX"]);

function structureMatches(text: string, rule: StructureRule): { idx: number; match: string } | null {
  let earliest: { idx: number; match: string } | null = null;
  for (const p of rule.patterns) {
    const re = new RegExp(p.source, p.flags.includes("g") ? p.flags : p.flags + "g");
    re.lastIndex = 0;
    const m = re.exec(text);
    if (m && (earliest === null || m.index < earliest.idx)) {
      earliest = { idx: m.index, match: m[0] };
    }
  }
  return earliest;
}

function detectStructures(text: string): Structure[] {
  const found: Array<{ structure: Structure; idx: number }> = [];
  for (const rule of STRUCTURE_RULES) {
    const hit = structureMatches(text, rule);
    if (hit) found.push({ structure: rule.structure, idx: hit.idx });
  }
  // Dedup keeping earliest, then sort by occurrence order.
  const seen = new Set<Structure>();
  const ordered: Structure[] = [];
  for (const f of found.sort((a, b) => a.idx - b.idx)) {
    if (seen.has(f.structure)) continue;
    seen.add(f.structure);
    ordered.push(f.structure);
  }
  return ordered;
}

function detectStyleCues(text: string): Set<StyleCue> {
  const out = new Set<StyleCue>();
  for (const rule of STYLE_CUE_RULES) {
    if (rule.patterns.some((p) => p.test(text))) out.add(rule.cue);
  }
  return out;
}

function detectMotionCues(text: string): Set<MotionCue> {
  const out = new Set<MotionCue>();
  for (const rule of MOTION_CUE_RULES) {
    if (rule.patterns.some((p) => p.test(text))) out.add(rule.cue);
  }
  return out;
}

function detectCounts(text: string, structures: readonly Structure[]): Record<string, number> {
  const counts: Record<string, number> = {};
  // Build lookup of which structure each rule covers.
  for (const rule of STRUCTURE_RULES) {
    if (!structures.includes(rule.structure)) continue;
    for (const p of rule.patterns) {
      // Number digit before keyword.
      const digitRe = new RegExp(`\\b(\\d+)\\s+${p.source.replace(/^\\b|\\b$/g, "")}`, p.flags.includes("g") ? p.flags : p.flags + "g");
      const wordRe = new RegExp(`\\b(zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\\s+${p.source.replace(/^\\b|\\b$/g, "")}`, "g");
      digitRe.lastIndex = 0;
      const dm = digitRe.exec(text);
      if (dm && counts[rule.structure] === undefined) counts[rule.structure] = parseInt(dm[1] ?? "0", 10);
      wordRe.lastIndex = 0;
      const wm = wordRe.exec(text);
      if (wm && counts[rule.structure] === undefined) {
        const n = NUMBER_WORDS.get((wm[1] ?? "").toLowerCase());
        if (typeof n === "number") counts[rule.structure] = n;
      }
    }
  }
  return counts;
}

/**
 * Named entities: sequences of 2+ comma-separated capitalised tokens
 * (usually proper nouns), or sequences after "for|with|including|featuring".
 * Filters out years, single-letter tokens.
 */
function detectEntities(rawDescription: string): string[] {
  const candidates = new Set<string>();

  // Pattern A: explicit list after "for|with|including|featuring|named". The
  // captured body extends until end-of-sentence (period or end-of-string), so
  // multi-word entries like "Google Cloud" stay whole.
  const trigger = /\b(?:for|with|including|featuring|named|like|of)\s+([A-Z][^.!?]*?)(?:[.!?]|$)/i;
  const tm = rawDescription.match(trigger);
  if (tm && typeof tm[1] === "string") {
    for (const part of tm[1].split(/,|\s+and\s+/i)) {
      const cleaned = part.trim().replace(/[.!?,]+$/, "");
      if (cleaned && /^[A-Z]/.test(cleaned)) candidates.add(cleaned);
    }
  }

  // Pattern B: capitalized list anywhere (3+ comma-separated capitalised tokens)
  const seqRe = /(?:[A-Z][a-zA-Z0-9.]*(?:\s+[A-Z][a-zA-Z0-9.]*)*?)(?:,\s*[A-Z][a-zA-Z0-9.]*(?:\s+[A-Z][a-zA-Z0-9.]*)*?){1,}(?:,?\s+and\s+[A-Z][a-zA-Z0-9.]*(?:\s+[A-Z][a-zA-Z0-9.]*)*?)?/g;
  for (const match of rawDescription.matchAll(seqRe)) {
    for (const part of match[0].split(/,|\s+and\s+/i)) {
      const cleaned = part.trim().replace(/[.!?,]+$/, "");
      if (cleaned && /^[A-Z]/.test(cleaned) && cleaned.length > 1 && !/^\d{4}$/.test(cleaned)) {
        candidates.add(cleaned);
      }
    }
  }

  // Reject obvious non-entities: structural words ("Dark", "Glass") that happen to be capitalised at sentence start.
  const REJECT = /^(?:Dark|Glass|Neon|Minimal|Amoled|Light|Bright|Pure|Solid)$/i;
  return Array.from(candidates).filter((c) => !REJECT.test(c));
}

function titleCaseToken(token: string): string {
  if (token.length === 0) return token;
  if (ALL_CAPS_PRESERVE.has(token.toUpperCase()) && /[A-Z]/.test(token)) return token.toUpperCase();
  // Mixed-case proper noun (e.g., "iOS", "tsx"): preserve first cap, lowercase rest unless camelCase.
  if (/^[A-Z]{2,}$/.test(token)) return token; // already all caps
  return (token[0] ?? "").toUpperCase() + token.slice(1).toLowerCase();
}

function deriveHeadline(rawDescription: string): string {
  // 1. Take left of first comma, period, or semicolon.
  const split = rawDescription.split(/[,.;]/, 1);
  let left = (split[0] ?? rawDescription).trim();
  // 2. Drop leading article.
  left = left.replace(HEADLINE_LEADING_ARTICLES, "");
  // 3. Truncate at first stop-word boundary (with / containing / for / etc.)
  const words = left.split(/\s+/).filter(Boolean);
  const truncated: string[] = [];
  for (const w of words) {
    if (HEADLINE_STOP_WORDS.has(w.toLowerCase())) break;
    truncated.push(w);
    if (truncated.length >= 5) break;
  }
  if (truncated.length === 0) return "Component";
  return truncated.map(titleCaseToken).join(" ");
}

/* ── public API ──────────────────────────────────────────────────────────── */

export function parseDescription(description: string, componentType?: string): ParsedSpec {
  const raw = description ?? "";
  const lower = raw.toLowerCase();

  const structures = detectStructures(lower);
  const styleCues = detectStyleCues(lower);
  const motionCues = detectMotionCues(lower);
  const counts = detectCounts(lower, structures);
  const entities = detectEntities(raw);
  const headline = deriveHeadline(raw);

  // Fallback: if structures came up empty, map componentType into a default.
  if (structures.length === 0 && componentType) {
    const fallback = mapComponentTypeToStructure(componentType);
    if (fallback) structures.push(fallback);
  }

  return { structures, counts, entities, styleCues, motionCues, headline, raw };
}

function mapComponentTypeToStructure(componentType: string): Structure | null {
  const normalized = componentType.toLowerCase().trim();
  const map: Record<string, Structure> = {
    "card": "card",
    "hero": "hero",
    "modal": "modal",
    "navbar": "nav",
    "footer": "footer",
    "feature-grid": "grid",
    "cta": "feature",
    "testimonial": "testimonial",
    "stat": "stat",
    "pricing-tier": "pricing-tier",
    "button": "feature",
    "input": "form",
  };
  return map[normalized] ?? null;
}
