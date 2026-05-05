#!/usr/bin/env node
// Maintainer script. Mirrors the Darkforge plugin's reference library into
// this repo's refs/ directory and regenerates src/lib/reference-router.generated.ts
// from the plugin's SKILL.md Phase 2 routing table.
//
// Usage:
//   node scripts/sync-refs.mjs --from-local <plugin-path>
//   node scripts/sync-refs.mjs --from-github
//
// Default plugin path (when --from-local is given without a value) is the
// local NexusUI checkout. Override by passing the path explicitly.
//
// References flow plugin -> MCP only. Never the reverse.

import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..");

const DEFAULT_LOCAL_PLUGIN = "C:\\Users\\karan\\OneDrive\\Creative Cloud Files\\Desktop\\NexusUI";
const GITHUB_REPO = "Karannnnn614/Darkforge";
const GITHUB_BRANCH = "main";
const GITHUB_RAW_BASE = `https://raw.githubusercontent.com/${GITHUB_REPO}/${GITHUB_BRANCH}`;
const GITHUB_API_BASE = `https://api.github.com/repos/${GITHUB_REPO}/contents`;

function parseArgs(argv) {
  const args = argv.slice(2);
  let mode = null;
  let localPath = DEFAULT_LOCAL_PLUGIN;
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--from-local") {
      mode = "local";
      if (args[i + 1] && !args[i + 1].startsWith("--")) {
        localPath = args[i + 1];
        i++;
      }
    } else if (a === "--from-github") {
      mode = "github";
    } else if (a === "--help" || a === "-h") {
      printHelp();
      process.exit(0);
    } else {
      console.error(`Unknown argument: ${a}`);
      printHelp();
      process.exit(2);
    }
  }
  if (!mode) {
    console.error("Specify --from-local <path> or --from-github");
    printHelp();
    process.exit(2);
  }
  return { mode, localPath };
}

function printHelp() {
  console.log(
    [
      "sync-refs - mirror plugin references into this repo",
      "",
      "  --from-local [path]   Read from a local Darkforge plugin checkout.",
      `                        Default: ${DEFAULT_LOCAL_PLUGIN}`,
      "  --from-github         Fetch from raw.githubusercontent.com (Karannnnn614/Darkforge@main).",
      "  --help, -h            Show this message.",
    ].join("\n"),
  );
}

async function readMarkdown(filePath) {
  const content = await fs.readFile(filePath, "utf8");
  return { content, lines: content.split("\n").length };
}

async function writeMarkdown(filePath, content) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, "utf8");
}

async function listLocalMarkdown(dir) {
  const out = [];
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch (e) {
    if (e.code === "ENOENT") return out;
    throw e;
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      const nested = await listLocalMarkdown(full);
      for (const n of nested) out.push(n);
    } else if (e.isFile() && e.name.endsWith(".md")) {
      out.push(full);
    }
  }
  return out;
}

async function syncFromLocal(pluginRoot) {
  const refsSrc = path.join(pluginRoot, "skills", "forge", "references");
  const skillSrc = path.join(pluginRoot, "skills", "forge", "SKILL.md");
  await fs.stat(refsSrc).catch(() => {
    throw new Error(`Plugin references directory not found: ${refsSrc}`);
  });
  await fs.stat(skillSrc).catch(() => {
    throw new Error(`Plugin SKILL.md not found: ${skillSrc}`);
  });

  const refsDest = path.join(REPO_ROOT, "refs");
  await fs.mkdir(refsDest, { recursive: true });

  const sources = await listLocalMarkdown(refsSrc);
  let fileCount = 0;
  let totalLines = 0;
  for (const src of sources) {
    const rel = path.relative(refsSrc, src).split(path.sep).join("/");
    const dest = path.join(refsDest, rel);
    const { content, lines } = await readMarkdown(src);
    await writeMarkdown(dest, content);
    fileCount++;
    totalLines += lines;
  }

  const skillText = (await readMarkdown(skillSrc)).content;
  return { fileCount, totalLines, skillText };
}

async function fetchText(url) {
  const res = await fetch(url, { headers: { "User-Agent": "darkforge-mcp-sync-refs" } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

async function fetchJSON(url) {
  const res = await fetch(url, { headers: { "User-Agent": "darkforge-mcp-sync-refs", Accept: "application/vnd.github+json" } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

async function listGitHubMarkdown(repoSubpath) {
  const url = `${GITHUB_API_BASE}/${repoSubpath}?ref=${GITHUB_BRANCH}`;
  const entries = await fetchJSON(url);
  const out = [];
  for (const e of entries) {
    if (e.type === "file" && e.name.endsWith(".md")) {
      out.push({ rel: e.name, downloadUrl: e.download_url });
    } else if (e.type === "dir") {
      const nested = await listGitHubMarkdown(`${repoSubpath}/${e.name}`);
      for (const n of nested) out.push({ rel: `${e.name}/${n.rel}`, downloadUrl: n.downloadUrl });
    }
  }
  return out;
}

async function syncFromGitHub() {
  const refsDest = path.join(REPO_ROOT, "refs");
  await fs.mkdir(refsDest, { recursive: true });

  const list = await listGitHubMarkdown("skills/forge/references");
  let fileCount = 0;
  let totalLines = 0;
  for (const { rel, downloadUrl } of list) {
    const content = await fetchText(downloadUrl);
    await writeMarkdown(path.join(refsDest, rel), content);
    fileCount++;
    totalLines += content.split("\n").length;
  }

  const skillText = await fetchText(`${GITHUB_RAW_BASE}/skills/forge/SKILL.md`);
  return { fileCount, totalLines, skillText };
}

function parseRoutingTable(skillText) {
  const lines = skillText.split("\n");
  const phase2Idx = lines.findIndex((l) => /^##\s+Phase\s+2/i.test(l));
  if (phase2Idx < 0) throw new Error("SKILL.md: '## Phase 2' section not found");
  let i = phase2Idx;
  while (i < lines.length && !/^\|\s*User\s+says/i.test(lines[i])) i++;
  if (i >= lines.length) throw new Error("SKILL.md: routing table header not found");
  i += 2; // skip header + separator
  const rows = [];
  for (; i < lines.length; i++) {
    const raw = lines[i];
    if (!raw.trim().startsWith("|")) break;
    if (raw.trim().startsWith("|--") || raw.trim().startsWith("|-")) continue;
    const cells = raw.split("|").map((c) => c.trim());
    const kwCell = cells[1] ?? "";
    const refCell = cells[2] ?? "";
    if (!kwCell || !refCell) continue;
    const m = refCell.match(/`?references\/([^`]+?)\.md`?/);
    if (!m) continue;
    const reference = m[1];
    const keywords = kwCell
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    if (keywords.length === 0) continue;
    rows.push({ keywords, reference });
  }
  if (rows.length === 0) throw new Error("SKILL.md: parsed 0 routing rows");
  return rows;
}

function emitRouterModule(rows) {
  const header = [
    "// AUTO-GENERATED by scripts/sync-refs.mjs - do not edit.",
    "// Source: skills/forge/SKILL.md routing table (Darkforge plugin).",
    "// Re-run `npm run sync-refs -- --from-local <path>` to refresh.",
    "",
    "export interface RoutingRow {",
    "  readonly keywords: readonly string[];",
    "  readonly reference: string;",
    "}",
    "",
    "export const ROUTING_TABLE: readonly RoutingRow[] = [",
  ];
  const body = rows.map((r) => {
    const kws = r.keywords.map((k) => JSON.stringify(k)).join(", ");
    return `  { keywords: [${kws}], reference: ${JSON.stringify(r.reference)} },`;
  });
  const footer = [
    "];",
    "",
    "/**",
    " * Lowercased keyword phrase -> ordered list of reference names.",
    " * Multiple rows may share a keyword; values preserve routing-table order.",
    " */",
    "export const KEYWORD_TO_REFS: ReadonlyMap<string, readonly string[]> = (() => {",
    "  const map = new Map<string, string[]>();",
    "  for (const row of ROUTING_TABLE) {",
    "    for (const keyword of row.keywords) {",
    "      const list = map.get(keyword);",
    "      if (list) list.push(row.reference);",
    "      else map.set(keyword, [row.reference]);",
    "    }",
    "  }",
    "  return map;",
    "})();",
    "",
  ];
  return [...header, ...body, ...footer].join("\n");
}

async function main() {
  const { mode, localPath } = parseArgs(process.argv);
  console.log(`darkforge sync-refs - mode: ${mode}`);
  if (mode === "local") console.log(`  plugin: ${localPath}`);

  const { fileCount, totalLines, skillText } =
    mode === "local" ? await syncFromLocal(localPath) : await syncFromGitHub();

  const rows = parseRoutingTable(skillText);
  const generated = emitRouterModule(rows);
  const outPath = path.join(REPO_ROOT, "src", "lib", "reference-router.generated.ts");
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, generated, "utf8");

  console.log(`  refs:    ${fileCount} markdown files (${totalLines} lines)`);
  console.log(`  router:  ${rows.length} routing rows -> ${path.relative(REPO_ROOT, outPath)}`);
  console.log("done.");
}

main().catch((err) => {
  console.error(`sync-refs failed: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
