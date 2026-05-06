// Behavioral check for description-parser. Run via: node scripts/test-parser.mjs
import { parseDescription } from "../dist/lib/description-parser.js";

const cases = [
  {
    label: "A: dashboard sidebar",
    description: "Dark dashboard sidebar with collapsible nav, 4 stat cards above the fold, neon-edged active state, and framer-motion reveal on mount. Calibrated for a Next.js + Tailwind + framer-motion site.",
    componentType: "feature-grid",
    expects: {
      structures: ["sidebar", "nav", "stat", "card", "hero"],
      countsStat: 4,
      styleCues: ["dark", "neon"],
      motionCues: ["reveal", "on-mount"],
      headline: "Dark Dashboard Sidebar",
    },
  },
  {
    label: "B: glass pricing tier",
    description: "Glass pricing tier with three plans, neon CTA on the middle plan, framer-motion hover lift.",
    componentType: "card",
    expects: {
      structures: ["pricing-tier", "card"],
      countsTier: 3,
      styleCues: ["glass", "neon"],
      motionCues: ["hover-lift"],
      headline: "Glass Pricing Tier",
    },
  },
  {
    label: "C: hero with 3D",
    description: "AMOLED hero section with kinetic typography, floating 3D ember orb, scroll-driven gradient mesh background, magnetic CTA button.",
    componentType: "hero",
    expects: {
      structures: ["hero"],
      styleCues: ["amoled", "gradient", "mesh"],
      motionCues: ["scroll-trigger", "magnetic"],
      headline: "AMOLED Hero Section",
    },
  },
];

for (const c of cases) {
  const spec = parseDescription(c.description, c.componentType);
  console.log(`--- ${c.label} ---`);
  console.log("structures:", spec.structures);
  console.log("counts:    ", spec.counts);
  console.log("entities:  ", spec.entities);
  console.log("styleCues: ", [...spec.styleCues]);
  console.log("motionCues:", [...spec.motionCues]);
  console.log("headline:  ", JSON.stringify(spec.headline));
  console.log();
}
