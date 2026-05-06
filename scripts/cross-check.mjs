// Phase 3 cross-checks for the v1.1 architectural rebuild.
// Three NEW prompts (not the partner-logos overfit canon). Each scores
// 0-5 against the brief's specificity rubric. Pass requires >=4 on all three.
//
// Runs against dist/index.js via stdio. Exits 0 on pass, 1 on fail.

import { spawn } from "node:child_process";
import path from "node:path";

const server = spawn(process.execPath, [path.resolve("dist/index.js")], {
  stdio: ["pipe", "pipe", "inherit"],
});
const responses = [];
let buf = "";
server.stdout.on("data", (chunk) => {
  buf += chunk.toString("utf8");
  let nl;
  while ((nl = buf.indexOf("\n")) !== -1) {
    const line = buf.slice(0, nl).trim();
    buf = buf.slice(nl + 1);
    if (line) {
      try { responses.push(JSON.parse(line)); }
      catch { console.error("non-JSON:", line); }
    }
  }
});
const send = (msg) => server.stdin.write(JSON.stringify(msg) + "\n");
const wait = (n, t = 30000) => new Promise((res, rej) => {
  const start = Date.now();
  const iv = setInterval(() => {
    if (responses.length >= n) { clearInterval(iv); res(); }
    else if (Date.now() - start > t) { clearInterval(iv); rej(new Error(`timeout (${responses.length}/${n})`)); }
  }, 25);
});

send({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "x", version: "0" }}});
await wait(1);
send({ jsonrpc: "2.0", method: "notifications/initialized" });

const STACK_NEXT = { animation: "framer-motion", styling: "tailwindcss", framework: "nextjs", language: "typescript" };

const checks = [
  {
    id: 10,
    label: "A: Dashboard sidebar",
    args: {
      description: "Dark dashboard sidebar with collapsible nav, 4 stat cards above the fold, neon-edged active state, and framer-motion reveal on mount. Calibrated for a Next.js + Tailwind + framer-motion site.",
      componentType: "feature-grid",
      variant: "neon",
      stack: STACK_NEXT,
    },
    rubric: (text, sc) => ({
      "structure-correct":
        /<aside\b/.test(text) && (text.match(/data-stat-index="\d+"/g) || []).length === 4,
      "no-placeholder-strings":
        !/Token-driven|Motion-aware|Accessible(?!\s+via)/i.test(text),
      "variant-primitive":
        /color-mix\(/.test(text) && /0 0 \d+px var\(--df-glow-/.test(text),
      "motion-correct":
        /motion\.\w/.test(text) && /useReducedMotion/.test(text) && /prefersReduced/.test(text),
      "headline-clean":
        sc?.parsedSpec?.headline === "Dark Dashboard Sidebar",
    }),
    expectedRefs: ["00-dark-tokens", "01-framer-motion"],
  },
  {
    id: 11,
    label: "B: Glass pricing tier",
    args: {
      description: "Glass pricing tier with three plans, neon CTA on the middle plan, framer-motion hover lift.",
      componentType: "card",
      variant: "glass",
      stack: STACK_NEXT,
    },
    rubric: (text, sc) => ({
      "structure-correct":
        (text.match(/data-tier-index="\d+"/g) || []).length === 3,
      "no-placeholder-strings":
        !/Token-driven|Motion-aware|Accessible(?!\s+via)/i.test(text),
      "variant-primitive":
        /backdrop[Ff]ilter/.test(text) && /var\(--df-glass-bg\)/.test(text),
      "motion-correct":
        /motion\.\w/.test(text) && /whileHover/.test(text) && /prefersReduced/.test(text),
      "headline-clean":
        sc?.parsedSpec?.headline === "Glass Pricing Tier",
    }),
    expectedRefs: ["00-dark-tokens"],
  },
  {
    id: 12,
    label: "C: Hero with 3D",
    args: {
      description: "AMOLED hero section with kinetic typography, floating 3D ember orb, scroll-driven gradient mesh background, magnetic CTA button.",
      componentType: "hero",
      variant: "neon",
      stack: STACK_NEXT,
    },
    rubric: (text, sc) => ({
      "structure-correct":
        /<motion\.section\b|<section\b/.test(text),
      "no-placeholder-strings":
        !/Token-driven|Motion-aware|Accessible(?!\s+via)/i.test(text),
      "variant-primitive":
        /color-mix\(/.test(text) && /var\(--df-glow-/.test(text),
      "motion-correct":
        /motion\.\w/.test(text) && /useReducedMotion/.test(text) && /prefersReduced/.test(text),
      "headline-clean":
        typeof sc?.parsedSpec?.headline === "string"
        && !sc.parsedSpec.headline.endsWith(",")
        && sc.parsedSpec.headline.length < 50,
    }),
    expectedRefs: ["00-dark-tokens"],
  },
];

for (const c of checks) {
  send({ jsonrpc: "2.0", id: c.id, method: "tools/call", params: { name: "forge_component", arguments: c.args }});
}
await wait(1 + checks.length, 30000);

console.log("");
let allGreen = true;
for (const c of checks) {
  const r = responses.find((x) => x.id === c.id);
  const text = r?.result?.content?.[0]?.text ?? "";
  const sc = r?.result?.structuredContent;
  const isError = r?.result?.isError ?? false;
  if (isError) { allGreen = false; console.log(`${c.label}: TOOL ERROR`); console.log(text); continue; }
  const checkResults = c.rubric(text, sc);
  const score = Object.values(checkResults).filter(Boolean).length;
  const passing = score >= 4;
  if (!passing) allGreen = false;
  const refOk = c.expectedRefs.every(n => (sc?.routedReferences || []).includes(n));
  if (!refOk) allGreen = false;
  console.log(`${c.label}  score=${score}/5  refsOk=${refOk}`);
  for (const [k, v] of Object.entries(checkResults)) {
    console.log(`  [${v ? "PASS" : "FAIL"}] ${k}`);
  }
  if (sc?.routedReferences) console.log(`  routedReferences: ${sc.routedReferences.join(", ")}`);
  console.log("");
}
console.log(allGreen ? "ALL THREE PASS (>=4/5 each)" : "FAILURES PRESENT");

server.kill();
process.exit(allGreen ? 0 : 1);
