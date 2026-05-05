import { z } from "zod";
import { toolError, toolOk } from "../types/index.js";
import type { ToolResult, Aggressiveness } from "../types/index.js";
import { DF_TOKENS_CSS, DF_TOKEN_NAMES } from "../lib/token-system.js";

export const title = "Forge dark variant of a component";
export const description =
  "Takes a light-themed Tailwind / inline-style component and rewrites it into an AMOLED, token-driven dark variant using --df-* CSS variables. Produces a diff-style change log and the minimum CSS tokens to add.";

export const inputSchema = {
  componentCode: z.string().describe("The full source of a single light-themed component (JSX/TSX/HTML/Vue, Tailwind classes or inline styles)."),
  aggressiveness: z
    .enum(["subtle", "full", "extreme"])
    .optional()
    .default("full")
    .describe("subtle = obvious swaps only; full = all token replacements; extreme = full + glass/glow/transition enhancements."),
};

interface RuleHit {
  from: string;
  to: string;
  reason: string;
}

interface Rule {
  /** Must be a global regex; capturing group 0 is replaced. */
  pattern: RegExp;
  /** Static replacement string (no $ refs). */
  replacement: string;
  reason: string;
  appliesAt: ReadonlyArray<Aggressiveness>;
}

const ALL_LEVELS: ReadonlyArray<Aggressiveness> = ["subtle", "full", "extreme"];
const FULL_AND_EXTREME: ReadonlyArray<Aggressiveness> = ["full", "extreme"];

/**
 * Tailwind class boundary helper.
 *
 * Tailwind classes live inside class strings — `className="..."`, `class="..."`,
 * `clsx("...", "...")`, template literals, etc. The hard correctness problem is
 * making sure `bg-white` does NOT match inside `bg-white-foo` or `lg:bg-white-2`.
 *
 * Strategy: each Tailwind rule's pattern wraps the class with:
 *   - leading boundary: start-of-string OR whitespace OR quote OR backtick OR `{` OR `(`
 *   - trailing boundary: end-of-string OR whitespace OR quote OR backtick OR `}` OR `)` OR `,`
 *
 * We use lookbehind / lookahead so the boundary chars are NOT consumed and
 * therefore not part of the replacement. The full match (group 0) is exactly
 * the class token.
 */
const CLASS_LEADING = "(?<=^|[\\s\"'`{(])";
const CLASS_TRAILING = "(?=$|[\\s\"'`}),])";

function tailwindRule(from: string, to: string, reason: string, levels: ReadonlyArray<Aggressiveness> = FULL_AND_EXTREME): Rule {
  return {
    pattern: new RegExp(CLASS_LEADING + escapeRegex(from) + CLASS_TRAILING, "g"),
    replacement: to,
    reason,
    appliesAt: levels,
  };
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/* ---------- rule table ---------- */

const RULES: Rule[] = [
  // --- Backgrounds (subtle covers obvious whites + gray-50/100) ---
  tailwindRule("bg-white", "bg-[var(--df-bg-surface)]", "AMOLED background swap", ALL_LEVELS),
  tailwindRule("bg-gray-50", "bg-[var(--df-bg-surface)]", "AMOLED background swap", ALL_LEVELS),
  tailwindRule("bg-gray-100", "bg-[var(--df-bg-elevated)]", "AMOLED background swap", ALL_LEVELS),
  tailwindRule("bg-gray-200", "bg-[var(--df-bg-elevated)]", "AMOLED background swap"),
  tailwindRule("bg-slate-50", "bg-[var(--df-bg-surface)]", "AMOLED background swap"),
  tailwindRule("bg-slate-100", "bg-[var(--df-bg-elevated)]", "AMOLED background swap"),
  tailwindRule("bg-zinc-50", "bg-[var(--df-bg-surface)]", "AMOLED background swap"),
  tailwindRule("bg-zinc-100", "bg-[var(--df-bg-elevated)]", "AMOLED background swap"),
  tailwindRule("bg-neutral-50", "bg-[var(--df-bg-surface)]", "AMOLED background swap"),
  tailwindRule("bg-neutral-100", "bg-[var(--df-bg-elevated)]", "AMOLED background swap"),

  // --- Text colors ---
  tailwindRule("text-black", "text-[var(--df-text-primary)]", "Token-driven text color", ALL_LEVELS),
  tailwindRule("text-gray-900", "text-[var(--df-text-primary)]", "Token-driven text color", ALL_LEVELS),
  tailwindRule("text-gray-800", "text-[var(--df-text-primary)]", "Token-driven text color"),
  tailwindRule("text-gray-700", "text-[var(--df-text-secondary)]", "Token-driven text color"),
  tailwindRule("text-gray-600", "text-[var(--df-text-secondary)]", "Token-driven text color"),
  tailwindRule("text-gray-500", "text-[var(--df-text-secondary)]", "Token-driven text color"),
  tailwindRule("text-gray-400", "text-[var(--df-text-muted)]", "Token-driven text color"),
  tailwindRule("text-gray-300", "text-[var(--df-text-muted)]", "Token-driven text color"),

  tailwindRule("text-slate-900", "text-[var(--df-text-primary)]", "Token-driven text color"),
  tailwindRule("text-slate-800", "text-[var(--df-text-primary)]", "Token-driven text color"),
  tailwindRule("text-slate-700", "text-[var(--df-text-secondary)]", "Token-driven text color"),
  tailwindRule("text-slate-600", "text-[var(--df-text-secondary)]", "Token-driven text color"),
  tailwindRule("text-slate-500", "text-[var(--df-text-secondary)]", "Token-driven text color"),
  tailwindRule("text-slate-400", "text-[var(--df-text-muted)]", "Token-driven text color"),
  tailwindRule("text-slate-300", "text-[var(--df-text-muted)]", "Token-driven text color"),

  tailwindRule("text-zinc-900", "text-[var(--df-text-primary)]", "Token-driven text color"),
  tailwindRule("text-zinc-800", "text-[var(--df-text-primary)]", "Token-driven text color"),
  tailwindRule("text-zinc-700", "text-[var(--df-text-secondary)]", "Token-driven text color"),
  tailwindRule("text-zinc-600", "text-[var(--df-text-secondary)]", "Token-driven text color"),
  tailwindRule("text-zinc-500", "text-[var(--df-text-secondary)]", "Token-driven text color"),
  tailwindRule("text-zinc-400", "text-[var(--df-text-muted)]", "Token-driven text color"),
  tailwindRule("text-zinc-300", "text-[var(--df-text-muted)]", "Token-driven text color"),

  // --- Borders ---
  tailwindRule("border-gray-100", "border-[var(--df-border-subtle)]", "Token-driven border"),
  tailwindRule("border-gray-200", "border-[var(--df-border-default)]", "Token-driven border", ALL_LEVELS),
  tailwindRule("border-gray-300", "border-[var(--df-border-strong)]", "Token-driven border"),
  tailwindRule("border-slate-100", "border-[var(--df-border-subtle)]", "Token-driven border"),
  tailwindRule("border-slate-200", "border-[var(--df-border-default)]", "Token-driven border"),
  tailwindRule("border-slate-300", "border-[var(--df-border-strong)]", "Token-driven border"),

  // --- Rings (skipped at "subtle") ---
  tailwindRule("ring-blue-500", "ring-[var(--df-border-focus)]", "Token-driven focus ring"),
  tailwindRule("ring-gray-200", "ring-[var(--df-border-default)]", "Token-driven focus ring"),

  // --- Shadows -> neon glow ---
  tailwindRule("shadow-sm", "shadow-[var(--df-glow-violet)]", "Replace soft drop-shadow with neon glow", ALL_LEVELS),
  tailwindRule("shadow-md", "shadow-[var(--df-glow-violet)]", "Replace soft drop-shadow with neon glow"),
  tailwindRule("shadow-lg", "shadow-[var(--df-glow-violet)]", "Replace soft drop-shadow with neon glow"),
  tailwindRule("shadow-xl", "shadow-[var(--df-glow-violet)]", "Replace soft drop-shadow with neon glow"),

  // --- Inline styles / raw CSS (whitespace-tolerant, run at full + extreme) ---
  {
    pattern: /background\s*:\s*#fff(?:fff)?\b/gi,
    replacement: "background: var(--df-bg-surface)",
    reason: "Inline style background swap",
    appliesAt: FULL_AND_EXTREME,
  },
  {
    pattern: /background-color\s*:\s*#fff(?:fff)?\b/gi,
    replacement: "background-color: var(--df-bg-surface)",
    reason: "Inline style background-color swap",
    appliesAt: FULL_AND_EXTREME,
  },
  {
    pattern: /color\s*:\s*#000(?:000)?\b/gi,
    replacement: "color: var(--df-text-primary)",
    reason: "Inline style color swap",
    appliesAt: FULL_AND_EXTREME,
  },
  {
    pattern: /color\s*:\s*#111\b/gi,
    replacement: "color: var(--df-text-primary)",
    reason: "Inline style color swap",
    appliesAt: FULL_AND_EXTREME,
  },
  {
    pattern: /border\s*:\s*1px\s+solid\s+#e5e7eb\b/gi,
    replacement: "border: 1px solid var(--df-border-default)",
    reason: "Inline style border swap",
    appliesAt: FULL_AND_EXTREME,
  },
];

/* ---------- token discovery ---------- */

const TOKEN_REGEX = /--df-[a-z0-9-]+/gi;

function collectTokens(source: string, into: Set<string>): void {
  const matches = source.match(TOKEN_REGEX);
  if (!matches) return;
  const allowed = new Set<string>(DF_TOKEN_NAMES);
  for (const m of matches) {
    if (allowed.has(m)) into.add(m);
  }
}

/* ---------- extreme mode enhancements ---------- */

/**
 * Glass effect upgrade: any element with a `rounded-*` class AND an already-converted
 * `bg-[var(--df-bg-...)]` gets its bg swapped to glass + a glass border + backdrop blur.
 * Idempotent: if `--df-glass-bg` is already present on the element class string we skip.
 */
const GLASS_RE =
  /class(Name)?\s*=\s*(["'`])([^"'`]*?)\2/g;

function applyGlassUpgrade(code: string, hits: RuleHit[]): string {
  return code.replace(GLASS_RE, (full, _name: string | undefined, quote: string, classes: string) => {
    if (!/\brounded-/.test(classes)) return full;
    if (!/bg-\[var\(--df-bg-(surface|elevated|overlay|muted|base)\)\]/.test(classes)) return full;
    if (/--df-glass-bg/.test(classes)) return full; // already glass

    const before = classes;
    let next = classes.replace(
      /bg-\[var\(--df-bg-(?:surface|elevated|overlay|muted|base)\)\]/,
      "bg-[var(--df-glass-bg)]"
    );
    if (!/\bbackdrop-blur-/.test(next)) next = `${next} backdrop-blur-md`;
    if (!/\bborder-\[var\(--df-glass-border\)\]/.test(next)) {
      next = /\bborder\b/.test(next) ? `${next} border-[var(--df-glass-border)]` : `${next} border border-[var(--df-glass-border)]`;
    }

    hits.push({
      from: before.trim(),
      to: next.trim(),
      reason: "Glass effect upgrade",
    });

    const attr = full.startsWith("className") ? "className" : "class";
    return `${attr}=${quote}${next}${quote}`;
  });
}

/**
 * Add ambient neon glow to the OUTERMOST root element. We approximate "outermost"
 * by finding the first opening tag's class attribute and appending the glow class
 * (only if not already present).
 */
function applyRootGlow(code: string, hits: RuleHit[]): string {
  let applied = false;
  return code.replace(GLASS_RE, (full, _name: string | undefined, quote: string, classes: string) => {
    if (applied) return full;
    if (/shadow-\[var\(--df-glow-violet\)\]/.test(classes)) {
      applied = true;
      return full;
    }
    applied = true;
    const attr = full.startsWith("className") ? "className" : "class";
    const next = `${classes} shadow-[var(--df-glow-violet)]`.trim();
    hits.push({
      from: classes.trim(),
      to: next,
      reason: "Add ambient neon glow",
    });
    return `${attr}=${quote}${next}${quote}`;
  });
}

/**
 * Inject `transition-colors duration-200 ease-out` onto interactive elements
 * (button, a, input) that don't already have a `transition*` utility.
 */
const INTERACTIVE_TAG_RE =
  /<(button|a|input)\b([^>]*?)class(Name)?\s*=\s*(["'`])([^"'`]*?)\4/gi;

function applyInteractiveTransitions(code: string, hits: RuleHit[]): string {
  return code.replace(INTERACTIVE_TAG_RE, (full, tag: string, between: string, _name: string | undefined, quote: string, classes: string) => {
    if (/\btransition(-[a-z]+)?\b/.test(classes)) return full;
    const attr = full.includes("className=") ? "className" : "class";
    const next = `${classes} transition-colors duration-200 ease-out`.trim();
    hits.push({
      from: `<${tag} ... ${attr}="${classes.trim()}">`,
      to: `<${tag} ... ${attr}="${next}">`,
      reason: "Inject interactive transition",
    });
    return `<${tag}${between}${attr}=${quote}${next}${quote}`;
  });
}

/* ---------- token CSS slicing ---------- */

function buildTokensCss(tokensAdded: Set<string>): string {
  if (tokensAdded.size === 0) return "";
  const required = Array.from(tokensAdded).sort();
  return `${DF_TOKENS_CSS}\n/* minimum required: ${required.join(", ")} */\n`;
}

/* ---------- handler ---------- */

export async function handler(args: {
  componentCode: string;
  aggressiveness?: Aggressiveness;
}): Promise<ToolResult> {
  try {
    const componentCode = args.componentCode;
    if (typeof componentCode !== "string" || componentCode.length === 0) {
      return toolError("forge_dark", "componentCode must be a non-empty string", [
        "Confirm componentCode is a non-empty string",
        "If aggressiveness was passed, ensure it's subtle | full | extreme",
        "If no rules matched, the input may already be dark or use unrecognized class names — check the changes[] count",
      ]);
    }

    const level: Aggressiveness = args.aggressiveness ?? "full";
    if (level !== "subtle" && level !== "full" && level !== "extreme") {
      return toolError("forge_dark", `Unknown aggressiveness level: ${String(level)}`, [
        "Confirm componentCode is a non-empty string",
        "If aggressiveness was passed, ensure it's subtle | full | extreme",
        "If no rules matched, the input may already be dark or use unrecognized class names — check the changes[] count",
      ]);
    }

    const changes: RuleHit[] = [];
    const tokensAdded = new Set<string>();
    let darkCode = componentCode;

    // --- Pass 1: run all token-replacement rules in declaration order. ---
    for (const rule of RULES) {
      if (!rule.appliesAt.includes(level)) continue;

      // Reset lastIndex defensively (each rule has its own RegExp instance, but be safe).
      rule.pattern.lastIndex = 0;

      darkCode = darkCode.replace(rule.pattern, (match: string) => {
        changes.push({ from: match, to: rule.replacement, reason: rule.reason });
        collectTokens(rule.replacement, tokensAdded);
        return rule.replacement;
      });
    }

    // --- Pass 2: extreme-only structural enhancements. Run AFTER Pass 1 so we
    // operate on already-tokenized markup and check for token presence to stay
    // idempotent against re-runs. ---
    if (level === "extreme") {
      darkCode = applyGlassUpgrade(darkCode, changes);
      darkCode = applyRootGlow(darkCode, changes);
      darkCode = applyInteractiveTransitions(darkCode, changes);

      // Refresh token set against the post-extreme code so glass / glow tokens
      // get included in `tokensCssToAdd`.
      collectTokens(darkCode, tokensAdded);
    }

    const tokensCssToAdd = buildTokensCss(tokensAdded);

    const sections: string[] = [];
    sections.push(`Darkforge forge_dark — aggressiveness: ${level}`);
    sections.push("");
    sections.push("── Converted code ──");
    sections.push(darkCode);
    sections.push("");
    sections.push(`── Changes (${changes.length}) ──`);
    if (changes.length === 0) {
      sections.push(
        "No light-mode patterns matched. Component may already be dark, or uses non-Tailwind / non-standard color references."
      );
    } else {
      for (const c of changes) {
        sections.push(`- "${c.from}" → "${c.to}"     — ${c.reason}`);
      }
    }
    sections.push("");
    sections.push("── Tokens to add to globals.css ──");
    sections.push(tokensCssToAdd || "(no Darkforge tokens were emitted — nothing to add)");

    return toolOk(sections.join("\n"), {
      darkCode,
      changes,
      tokensAdded: Array.from(tokensAdded).sort(),
      tokensCssToAdd,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return toolError("forge_dark", msg, [
      "Confirm componentCode is a non-empty string",
      "If aggressiveness was passed, ensure it's subtle | full | extreme",
      "If no rules matched, the input may already be dark or use unrecognized class names — check the changes[] count",
    ]);
  }
}
