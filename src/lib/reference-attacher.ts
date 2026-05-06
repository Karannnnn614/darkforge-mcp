/**
 * Reference attacher. Builds the "elaboration hints" textual block that
 * accompanies the generated component code.
 *
 * The MCP server's job is to give the host AI a correct semantic skeleton
 * plus the relevant context. The host AI does the elaboration. This module
 * makes that division of labor explicit in the tool output — the block
 * names every routed reference and tells the host AI what to pull from each.
 *
 * Pure function. No I/O. Does not modify the scaffold.
 */

import type { ReferenceExcerpt } from "../types/index.js";

/* ── per-reference hint table ───────────────────────────────────────────── */

interface ReferenceHint {
  readonly match: (name: string) => boolean;
  readonly hint: (name: string) => string;
}

const REFERENCE_HINTS: readonly ReferenceHint[] = [
  {
    match: (n) => n === "00-dark-tokens",
    hint: () =>
      "00-dark-tokens (always present): the AMOLED token system, glass utility classes, neon glow utilities, gradient mesh helpers. Pull these for surface decoration, glow stack composition, and any --df-* utilities you wire into the scaffold.",
  },
  {
    match: (n) => n === "01-framer-motion",
    hint: () =>
      "01-framer-motion: motion variants, gesture handlers, AnimatePresence, layout animations. Reach here for entry/exit choreography, hover/tap micro-interactions, and reduced-motion patterns.",
  },
  {
    match: (n) => n === "02-gsap",
    hint: () =>
      "02-gsap: scroll-driven sequences (ScrollTrigger), pinned timelines, SplitText, scrubbed reveals. Reach here for narrative scrolling and complex orchestrated sequences.",
  },
  {
    match: (n) => n === "03-threejs-r3f",
    hint: () =>
      "03-threejs-r3f: React-Three-Fiber primitives, drei helpers, shader patterns. Reach here for any 3D scene, particle field, or floating-object embellishment.",
  },
  {
    match: (n) => n === "04-aceternity",
    hint: () =>
      "04-aceternity: TracingBeam, Spotlight, BackgroundBeams, MovingBorder, WavyBackground. Reach here for high-impact dark-UI accents and component-level visual effects.",
  },
  {
    match: (n) => n === "05-magicui",
    hint: () =>
      "05-magicui: Meteors, Shimmer, GridPattern, BlurFade, Marquee, Ticker. Reach here for ambient backgrounds, kinetic text, and subtle motion fillers.",
  },
  {
    match: (n) => n === "12-tailwind-v4",
    hint: () =>
      "12-tailwind-v4: container queries, color-mix utilities, layer ordering, arbitrary values. Reach here for layout, spacing rhythm, and color-mix utility class equivalents.",
  },
  {
    match: (n) => n === "17-skeleton-system",
    hint: () =>
      "17-skeleton-system: pulse + shimmer skeleton variants, suspense fallback patterns. Reach here for loading-state mirroring of any rendered structure.",
  },
  {
    match: (n) => n === "23-animata",
    hint: () =>
      "23-animata: snippet-style animations, magnetic buttons, motion playgrounds. Reach here for compact, drop-in micro-interactions.",
  },
  {
    match: (n) => n === "26-lenis-smooth-scroll",
    hint: () =>
      "26-lenis-smooth-scroll: smooth-scroll provider patterns. Reach here when scroll inertia or smooth-scroll gating matters to the section.",
  },
  {
    match: (n) => n === "inspiration-tour",
    hint: () =>
      "inspiration-tour: real-site inspiration reference (Linear, Stripe, Vercel, Raycast, Framer, Arc, Resend, Anthropic). Reach here for proportions, copy register, and overall visual tone.",
  },
  {
    match: (n) => n.startsWith("patterns/"),
    hint: (n) => {
      const slug = n.split("/")[1] ?? "pattern";
      const map: Record<string, string> = {
        hero: "patterns/hero: hero-section composition (eyebrow + headline + subline + CTAs + supporting visual). Pull proportions and the visual-anchor placement.",
        navbar: "patterns/navbar: header composition (brand mark + nav links + actions). Pull spacing rhythm and the active-state treatment.",
        pricing: "patterns/pricing: pricing-tier composition (header + feature list + CTA), middle-tier accent treatment, comparison cell rhythm.",
        dashboard: "patterns/dashboard: sidebar + main grid + stat tile composition, sticky header, density variants.",
        features: "patterns/features: feature-grid composition, bento layouts, partner/logo strips, card-to-card spacing rhythm.",
        testimonials: "patterns/testimonials: quote + attribution + role layout, multi-card composition, brand-logo bar.",
        footer: "patterns/footer: footer link grouping, fine print, brand mark + social row.",
        cta: "patterns/cta: end-of-page conversion section, headline + sub + dual-CTA layout.",
        "3d-scene": "patterns/3d-scene: R3F canvas placement, lighting setup, camera framing for product/showcase scenes.",
        "scroll-story": "patterns/scroll-story: pinned scroll scenes, scrubbed timeline beats, narrative pacing.",
      };
      return map[slug] ?? `patterns/${slug}: layout proportions and spacing rhythm for ${slug}-style sections.`;
    },
  },
  {
    match: (n) => /^\d{2,}-.+-dark$/.test(n),
    hint: (n) => {
      const lib = n.replace(/^\d+-/, "").replace(/-dark$/, "");
      return `${n}: ${lib}-specific component patterns adapted for dark UI. Reach here when the user's stack already includes ${lib} — match its component vocabulary.`;
    },
  },
  {
    match: () => true,
    hint: (n) =>
      `${n}: library-specific patterns. Read the excerpt for component vocabulary, import paths, and idiomatic usage.`,
  },
];

function hintFor(name: string): string {
  for (const rule of REFERENCE_HINTS) {
    if (rule.match(name)) return rule.hint(name);
  }
  return name;
}

/* ── public API ──────────────────────────────────────────────────────────── */

interface AttachResult {
  /** Unmodified jsx — the elaboration hints live in the textual output, not the code. */
  jsx: string;
  /** The block to append to the textual ToolResult content. */
  elaborationBlock: string;
}

export function attachReferenceHints(
  jsx: string,
  routedReferences: readonly string[],
  referenceExcerpts: readonly ReferenceExcerpt[],
): AttachResult {
  const lines: string[] = [];
  lines.push("-- BEGIN ELABORATION HINTS --");
  lines.push("");
  lines.push(
    "This is a structural scaffold. The host AI should elaborate it using the references in routedReferences:",
  );
  lines.push("");
  for (const name of routedReferences) {
    lines.push(`- ${hintFor(name)}`);
  }
  lines.push("");
  lines.push(
    `Reference markdown excerpts are in structuredContent.referenceExcerpts (~800 chars per reference). Read them before elaborating. ${referenceExcerpts.length} excerpt${referenceExcerpts.length === 1 ? "" : "s"} available.`,
  );
  lines.push("");
  lines.push(
    "The /* ELABORATE: ... */ comments mark spots where the scaffold needs your judgment — copy that fits the user's domain, micro-interactions that fit the brand, sub-components that complete the structure. Replace each comment with real content; do not leave them in the final file.",
  );
  lines.push("");
  lines.push("-- END ELABORATION HINTS --");
  return { jsx, elaborationBlock: lines.join("\n") };
}
