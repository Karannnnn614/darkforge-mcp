// Run the full lib pipeline on the three cross-check prompts. No tool involvement.
// node scripts/test-pipeline.mjs
import { parseDescription } from "../dist/lib/description-parser.js";
import { buildScaffold } from "../dist/lib/scaffold-builder.js";
import { applyVariant, chooseVariant } from "../dist/lib/variant-applier.js";
import { applyMotion } from "../dist/lib/motion-applier.js";
import { attachReferenceHints } from "../dist/lib/reference-attacher.js";

const cases = [
  {
    label: "A: dashboard sidebar",
    description: "Dark dashboard sidebar with collapsible nav, 4 stat cards above the fold, neon-edged active state, and framer-motion reveal on mount. Calibrated for a Next.js + Tailwind + framer-motion site.",
    componentType: "feature-grid",
    explicitVariant: "neon",
    framerAvail: true,
    refs: ["00-dark-tokens", "01-framer-motion", "patterns/dashboard"],
  },
  {
    label: "B: glass pricing tier",
    description: "Glass pricing tier with three plans, neon CTA on the middle plan, framer-motion hover lift.",
    componentType: "card",
    explicitVariant: "glass",
    framerAvail: true,
    refs: ["00-dark-tokens", "01-framer-motion", "patterns/pricing"],
  },
  {
    label: "C: hero with 3D",
    description: "AMOLED hero section with kinetic typography, floating 3D ember orb, scroll-driven gradient mesh background, magnetic CTA button.",
    componentType: "hero",
    explicitVariant: "neon",
    framerAvail: true,
    refs: ["00-dark-tokens", "03-threejs-r3f", "patterns/hero", "02-gsap"],
  },
];

function check(label, value) { console.log(`  ${label}:`, value); }

for (const c of cases) {
  console.log(`\n========== ${c.label} ==========`);
  const spec = parseDescription(c.description, c.componentType);
  console.log("[spec]");
  check("structures", spec.structures);
  check("counts    ", spec.counts);
  check("entities  ", spec.entities);
  check("styleCues ", [...spec.styleCues]);
  check("motionCues", [...spec.motionCues]);
  check("headline  ", spec.headline);

  let scaffold = buildScaffold(spec);
  console.log("[scaffold name]", scaffold.componentName);
  console.log("[jsx length]", scaffold.jsx.length);

  const variant = chooseVariant(c.explicitVariant, spec.styleCues);
  console.log("[variant chosen]", variant);
  scaffold = applyVariant(scaffold, variant);

  const motionResult = applyMotion(scaffold, spec.motionCues, c.framerAvail);
  scaffold = motionResult.scaffold;
  console.log("[motion applied]", motionResult.applied);
  console.log("[jsx length post-motion]", scaffold.jsx.length);
  console.log("[imports]", scaffold.imports);
  console.log("[tokensUsed]", [...scaffold.tokensUsed]);
  console.log("[usesPrefersReduced]", scaffold.usesPrefersReduced);

  const excerpts = c.refs.map(name => ({ name, excerpt: "(stub)" }));
  const { elaborationBlock } = attachReferenceHints(scaffold.jsx, c.refs, excerpts);
  console.log("[elaboration block lines]", elaborationBlock.split("\n").length);

  // Specificity rubric
  const text = scaffold.jsx + "\n" + elaborationBlock;
  const rubric = {
    "structure-correct":
      (c.label.startsWith("A:") ? /<aside\b/.test(scaffold.jsx) && (scaffold.jsx.match(/data-stat-index/g) || []).length === 4
      : c.label.startsWith("B:") ? (scaffold.jsx.match(/data-tier-index/g) || []).length === 3
      : c.label.startsWith("C:") ? /<section\b/.test(scaffold.jsx) || /<motion\.section\b/.test(scaffold.jsx)
      : false),
    "no-placeholder-strings":
      !/Token-driven|Motion-aware|Accessible/.test(text),
    "variant-primitive":
      (variant === "neon" ? /color-mix\(/.test(scaffold.jsx) && /0 0 \d+px var\(--df-glow-/.test(scaffold.jsx)
      : variant === "glass" ? /backdrop[Ff]ilter/.test(scaffold.jsx)
      : variant === "minimal" ? /var\(--df-border-subtle\)/.test(scaffold.jsx)
      : true),
    "motion-correct":
      spec.motionCues.size > 0
        ? motionResult.applied && /<motion\./.test(scaffold.jsx) && scaffold.usesPrefersReduced
        : true,
    "headline-clean":
      !spec.headline.endsWith(",") && !spec.headline.endsWith(".") && spec.headline.length < 50,
  };
  const score = Object.values(rubric).filter(Boolean).length;
  console.log(`[SPEC SCORE: ${score}/5]`, rubric);
}
