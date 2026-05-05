// Stdio MCP smoke test for darkforge-mcp.
//
// Three phases:
//   1. Tool surface — initialize handshake, tools/list, every tool returns
//      isError: false against minimal happy-path inputs.
//   2. Reference depth-gain — prompts that name a library OR a style/intent
//      word must surface relevant references and embed evidence in output.
//   3. Specificity cross-check — the partner-logos prompts that the v1.1
//      rebuild was triggered by. forge_component, forge_dark, forge_skeleton,
//      forge_page must each score >=4/6 on a regex specificity rubric.
//
// Exit 0 when every check passes. Exit 1 with a per-tool breakdown otherwise.

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
      catch { console.error("non-JSON line:", line); }
    }
  }
});

const send = (msg) => server.stdin.write(JSON.stringify(msg) + "\n");
const wait = (n, t = 30000) => new Promise((res, rej) => {
  const start = Date.now();
  const iv = setInterval(() => {
    if (responses.length >= n) { clearInterval(iv); res(); }
    else if (Date.now() - start > t) { clearInterval(iv); rej(new Error(`timeout waiting for ${n} responses (got ${responses.length})`)); }
  }, 25);
});

// ---- Specificity rubric ----------------------------------------------------
//
// 6 regex checks, return matched count + per-check breakdown. Used for the
// partner-logos cross-check prompts. Threshold for pass is >=4/6.

function scoreSpecificity(text, structured, expectedEntities) {
  const checks = {
    glass:        /--df-glass-/i.test(text),
    glow:         /--df-(glow|neon)-/i.test(text),
    prefersReduced: /prefersReduced|prefers-reduced-motion/i.test(text),
    stagger:      /staggerChildren|delay:\s*i\s*\*|delay:\s*\d+\s*\*\s*i/i.test(text),
    horizontal:   /flex(?!-col)\b/.test(text) && !/grid-cols-3/.test(text),
    entities:     expectedEntities.every(e => text.includes(e)),
  };
  const score = Object.values(checks).filter(Boolean).length;
  return { score, total: 6, checks };
}

// ---- Send messages ---------------------------------------------------------

send({ jsonrpc: "2.0", id: 1, method: "initialize", params: {
  protocolVersion: "2024-11-05",
  capabilities: {},
  clientInfo: { name: "smoke", version: "0.0.1" },
}});
await wait(1);
send({ jsonrpc: "2.0", method: "notifications/initialized" });

send({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} });
await wait(2);

const PARTNERS = ["Microsoft", "AWS", "Google Cloud"];
const PARTNER_DESC = "AMOLED partner logos strip with glass chips, neon edge glow per logo, staggered fade-in for Microsoft, AWS, Google Cloud";

const PARTNER_LIGHT_SOURCE = `<div className="bg-white p-6 rounded-lg shadow-md">
    <div className="flex items-center gap-6">
      <div className="bg-gray-50 px-4 py-2 rounded-md border border-gray-200">Microsoft</div>
      <div className="bg-gray-50 px-4 py-2 rounded-md border border-gray-200">AWS</div>
      <div className="bg-gray-50 px-4 py-2 rounded-md border border-gray-200">Google Cloud</div>
    </div>
  </div>`;

const calls = [
  // Phase 1: tool surface
  { id: 3,  name: "scan_stack",      arguments: { projectPath: process.cwd() } },
  { id: 4,  name: "list_libraries",  arguments: {} },
  { id: 5,  name: "forge_component", arguments: { description: "glassmorphism pricing card with hover glow", stack: { animation: "framer-motion", styling: "tailwindcss", framework: "react", language: "typescript" } } },
  { id: 6,  name: "forge_skeleton",  arguments: { componentDescription: "card with avatar, two text lines, and a button" } },
  { id: 7,  name: "forge_dark",      arguments: { componentCode: "<div className=\"bg-white text-gray-900 p-6 rounded-lg\">Hi</div>" } },
  { id: 8,  name: "forge_page",      arguments: { pageType: "saas" } },
  { id: 9,  name: "get_reference",   arguments: { name: "01-framer-motion" } },
  { id: 10, name: "list_references", arguments: {} },

  // Phase 2: depth-gain (literal lib name routing)
  { id: 11, name: "forge_component",
    arguments: { description: "aceternity tracing beam hero", stack: { animation: "framer-motion", styling: "tailwindcss", framework: "react", language: "typescript" } },
    _depthCheck: /aceternity|tracingbeam|tracing beam/i,
    _label: "depth-gain (aceternity)" },

  // Phase 3: specificity cross-check (partner-logos prompts)
  { id: 20, name: "forge_component",
    arguments: { description: PARTNER_DESC, componentType: "feature-grid",
                 stack: { animation: "framer-motion", styling: "tailwindcss", framework: "react", language: "typescript" } },
    _specificity: { entities: PARTNERS, threshold: 4 },
    _label: "partner-logos (forge_component)" },

  { id: 21, name: "forge_dark",
    arguments: { componentCode: PARTNER_LIGHT_SOURCE, aggressiveness: "extreme",
                 description: "glass chips with neon edge glow per logo" },
    _specificity: { entities: PARTNERS, threshold: 3 }, // forge_dark won't have stagger/prefersReduced — lower bar
    _label: "partner-logos (forge_dark)" },

  { id: 22, name: "forge_skeleton",
    arguments: { componentDescription: "skeleton for partner logos strip with chips for Microsoft, AWS, Google Cloud", variant: "shimmer" },
    _routedReferencesContains: ["00-dark-tokens"],
    _label: "partner-logos (forge_skeleton)" },

  { id: 23, name: "forge_page",
    arguments: { pageType: "saas", description: "dark saas landing with partner logos strip and staggered hero animations" },
    _routedReferencesContains: ["00-dark-tokens"],
    _label: "partner-logos (forge_page)" },
];

for (const c of calls) {
  send({ jsonrpc: "2.0", id: c.id, method: "tools/call", params: { name: c.name, arguments: c.arguments } });
}
await wait(2 + calls.length, 60000);

// ---- Render report ---------------------------------------------------------

const init = responses.find(r => r.id === 1);
const list = responses.find(r => r.id === 2);

console.log("--- initialize ---");
console.log("server:", init?.result?.serverInfo, "protocol:", init?.result?.protocolVersion);
console.log("--- tools/list ---");
console.log("count:", list?.result?.tools?.length, "tools:", list?.result?.tools?.map(t => t.name));
console.log("--- tools/call results ---");

let allGreen = true;

for (const c of calls) {
  const r = responses.find(x => x.id === c.id);
  const isError = r?.result?.isError ?? false;
  const ok = r && !r.error && !isError;
  if (!ok) allGreen = false;

  const text = r?.result?.content?.[0]?.text ?? "";
  const structured = r?.result?.structuredContent;
  const len = text.length;
  const label = c._label ? ` [${c._label}]` : "";

  const extras = [];

  if (c._depthCheck) {
    const matched = c._depthCheck.test(text);
    if (!matched) allGreen = false;
    extras.push(`depth=${matched}`);
  }

  if (c._specificity) {
    const result = scoreSpecificity(text, structured, c._specificity.entities);
    const passing = result.score >= c._specificity.threshold;
    if (!passing) allGreen = false;
    const failed = Object.entries(result.checks).filter(([, v]) => !v).map(([k]) => k);
    extras.push(`spec=${result.score}/${result.total}${failed.length ? ` (failed: ${failed.join(",")})` : ""}`);
  }

  if (c._routedReferencesContains) {
    const refs = structured?.routedReferences ?? [];
    const missing = c._routedReferencesContains.filter(n => !refs.includes(n));
    const passing = missing.length === 0;
    if (!passing) allGreen = false;
    extras.push(`refs=${refs.length}${missing.length ? ` (missing: ${missing.join(",")})` : ""}`);
  }

  const extraStr = extras.length ? ` ${extras.join(" ")}` : "";
  console.log(`  ${(c.name + label).padEnd(48)} isError=${isError} len=${len}${extraStr}`);
  if (r?.error) console.log(`    rpc err:`, r.error);
}

console.log("---");
console.log(allGreen ? "ALL GREEN" : "SOMETHING FAILED");

server.kill();
process.exit(allGreen ? 0 : 1);
