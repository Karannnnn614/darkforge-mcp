/**
 * Motion applier. Wraps a Scaffold's outermost element in framer-motion
 * primitives when motion cues are present and framer-motion is available.
 *
 * Pure function (modulo mutation of the returned scaffold). No I/O.
 *
 * Contract:
 *   - If `framerMotionAvailable` is false OR motionCues is empty -> no-op,
 *     returns { scaffold, applied: false }.
 *   - Otherwise injects:
 *     - import { motion, useReducedMotion } from "framer-motion"
 *     - prefersReduced declaration in the body (forge-component renders this)
 *     - rewrites the outermost <section|<div|<aside|<main|<article tag to <motion.X>
 *     - emits an initial/animate/variants prop with reduced-motion guard
 *     - if children at the next level have data-* anchors, marks them as
 *       motion-staggered children (motion.li / motion.article variants)
 *
 * The contract guarantees `prefersReduced` is referenced in the body — never
 * declared and unused.
 */

import type { MotionCue, Scaffold } from "../types/index.js";
import { rescanTokens } from "./scaffold-builder.js";

interface ApplyMotionResult {
  scaffold: Scaffold;
  applied: boolean;
}

const STAGGERABLE_PARENTS = new Set(["ul", "div", "section", "main"]);

const MOTION_TAGS = ["section", "div", "aside", "main", "article"];

/**
 * Wrap the outermost top-level element in motion. Returns the modified jsx
 * and a flag indicating whether the wrap actually happened.
 *
 * The outer-element detection looks at the very first opening tag in the jsx
 * string (after trimming leading whitespace). We replace that single opening
 * tag and the matching closing tag.
 */
function wrapOutermost(jsx: string, hasStagger: boolean): { jsx: string; wrapped: boolean } {
  const trimmed = jsx.trimStart();
  const firstTagMatch = trimmed.match(/^<([a-z]+)\b/i);
  if (!firstTagMatch) return { jsx, wrapped: false };
  const tag = (firstTagMatch[1] ?? "").toLowerCase();
  if (!MOTION_TAGS.includes(tag)) return { jsx, wrapped: false };

  const variantsProp = hasStagger
    ? `\n  variants={{\n    hidden: { opacity: 0, y: 8 },\n    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1], staggerChildren: prefersReduced ? 0 : 0.05, delayChildren: prefersReduced ? 0 : 0.05 } }\n  }}`
    : `\n  variants={{\n    hidden: { opacity: 0, y: 8 },\n    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } }\n  }}`;
  const motionProps = `\n  initial={prefersReduced ? false : "hidden"}\n  animate="visible"${variantsProp}`;

  // Replace the first <tag and the LAST closing </tag> in the source.
  // We assume the scaffold is balanced (it is, by construction).
  const openRe = new RegExp(`<${tag}\\b`);
  const newOpen = `<motion.${tag}`;
  const jsxWithOpen = jsx.replace(openRe, newOpen);

  // Insert motion props right after the tag name, before any other attributes.
  // Find "<motion.tag" and inject the props on a new line just after.
  const propsInjection = jsxWithOpen.replace(
    new RegExp(`<motion\\.${tag}\\b`),
    `<motion.${tag}${motionProps}`,
  );

  // Replace LAST closing </tag> with </motion.tag>.
  const lastCloseRe = new RegExp(`</${tag}>(?![\\s\\S]*?</${tag}>)`);
  const jsxClosed = propsInjection.replace(lastCloseRe, `</motion.${tag}>`);

  return { jsx: jsxClosed, wrapped: true };
}

/**
 * Convert direct children of a stagger-eligible parent into motion children
 * with their own variant prop, so staggerChildren on the parent has effect.
 *
 * Heuristic: find ALL <article ... data-stat-index="..."> or data-card-index
 * or data-tier-index elements and rewrite to <motion.article ... variants={...}>.
 */
function staggerChildren(jsx: string): string {
  const childVariants = `\n  variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } } }}`;
  let out = jsx;

  // Stat / card / tier articles -> motion.article
  out = out.replace(
    /<article\b([^>]*?\bdata-(?:stat|card|tier)-index="\d+"[^>]*?)>/g,
    (full, attrs: string) => `<motion.article${attrs}${childVariants}>`,
  );

  // Match the corresponding </article> closes that follow these openings.
  // Simpler approach: replace ALL </article> after we've replaced openings.
  // But we don't know which closes correspond. The articles in our scaffolds
  // are always leaf elements (no nested articles), so a 1:1 swap of
  // </article> after data-anchored opens is reasonable.
  // To stay conservative: count motion.article opens, replace that many </article>.
  const openCount = (out.match(/<motion\.article\b/g) || []).length;
  if (openCount > 0) {
    let replaced = 0;
    out = out.replace(/<\/article>/g, (m) => {
      if (replaced < openCount) {
        replaced++;
        return "</motion.article>";
      }
      return m;
    });
  }

  return out;
}

/**
 * Add the framer-motion import to the scaffold's import set.
 */
function ensureMotionImport(scaffold: Scaffold): void {
  const existing = scaffold.imports.find((i) => i.from === "framer-motion");
  const desired = ["motion", "useReducedMotion"];
  if (existing) {
    const named = new Set(existing.named ?? []);
    for (const n of desired) named.add(n);
    existing.named = Array.from(named).sort();
  } else {
    scaffold.imports.push({ from: "framer-motion", named: desired });
  }
}

/* ── public API ──────────────────────────────────────────────────────────── */

export function applyMotion(
  scaffold: Scaffold,
  motionCues: ReadonlySet<MotionCue>,
  framerMotionAvailable: boolean,
): ApplyMotionResult {
  if (!framerMotionAvailable || motionCues.size === 0) {
    return { scaffold, applied: false };
  }

  const hasStagger = motionCues.has("stagger");
  const { jsx: wrappedJsx, wrapped } = wrapOutermost(scaffold.jsx, hasStagger);
  if (!wrapped) {
    // Outermost wasn't a motion-eligible tag; bail.
    return { scaffold, applied: false };
  }

  let jsx = wrappedJsx;
  if (hasStagger) jsx = staggerChildren(jsx);

  // Hover lift: any data-cta="primary" buttons gain whileHover.
  if (motionCues.has("hover-lift") || motionCues.has("magnetic")) {
    jsx = jsx.replace(
      /<button\b([^>]*?\bdata-cta="primary"[^>]*?)>/g,
      (_full, attrs: string) => `<motion.button${attrs} whileHover={prefersReduced ? undefined : { y: -1, scale: 1.02 }} whileTap={prefersReduced ? undefined : { scale: 0.98 }}>`,
    );
    if (jsx.includes("<motion.button")) {
      const openCount = (jsx.match(/<motion\.button\b/g) || []).length;
      let replaced = 0;
      jsx = jsx.replace(/<\/button>/g, (m) => {
        if (replaced < openCount) {
          replaced++;
          return "</motion.button>";
        }
        return m;
      });
    }
  }

  ensureMotionImport(scaffold);

  const next: Scaffold = {
    ...scaffold,
    jsx,
    usesPrefersReduced: true,
  };
  return { scaffold: rescanTokens(next), applied: true };
}
