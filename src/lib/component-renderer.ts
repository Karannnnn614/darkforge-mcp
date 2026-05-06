/**
 * Component renderer. Single source of truth for the file-string format of
 * a generated component. Pure function. No I/O.
 *
 * Takes the pipeline-assembled Scaffold and emits a complete TSX or JSX file:
 *   - imports block (sorted, deduped)
 *   - props interface (TS only — currently empty stub; placeholder for future)
 *   - default export function with prefersReduced declaration if usesPrefersReduced
 *   - the scaffold's jsx as the return body
 *
 * Why this exists: the four forge_* tool handlers must not each write their
 * own file emitter. Diverging emitters were the source of past inconsistency
 * (one tool's output had unused imports, another's had extra trailing
 * commas). All file-emit logic lives here.
 */

import type { Scaffold, ScaffoldImport } from "../types/index.js";

interface RenderOptions {
  language: "typescript" | "javascript";
}

function renderImports(imports: readonly ScaffoldImport[]): string {
  // Dedup by `from` and merge named imports.
  const merged = new Map<string, { default?: string; named: Set<string> }>();
  for (const imp of imports) {
    const cur = merged.get(imp.from) ?? { named: new Set<string>() };
    if (imp.default) cur.default = imp.default;
    if (imp.named) for (const n of imp.named) cur.named.add(n);
    merged.set(imp.from, cur);
  }

  const lines: string[] = [];
  // React import goes first by convention.
  const reactEntry = merged.get("react");
  if (reactEntry) {
    lines.push(formatImportLine("react", reactEntry));
    merged.delete("react");
  }
  // Then framer-motion.
  const motionEntry = merged.get("framer-motion");
  if (motionEntry) {
    lines.push(formatImportLine("framer-motion", motionEntry));
    merged.delete("framer-motion");
  }
  // Then everything else, alphabetically.
  for (const from of Array.from(merged.keys()).sort()) {
    const v = merged.get(from);
    if (v) lines.push(formatImportLine(from, v));
  }
  return lines.join("\n");
}

function formatImportLine(from: string, entry: { default?: string; named: Set<string> }): string {
  const namedArr = Array.from(entry.named).sort();
  const parts: string[] = [];
  if (entry.default) parts.push(entry.default);
  if (namedArr.length > 0) parts.push(`{ ${namedArr.join(", ")} }`);
  if (parts.length === 0) return `import "${from}";`;
  return `import ${parts.join(", ")} from "${from}";`;
}

/**
 * Indent lines of a JSX block by N spaces (per line) so it nests inside the
 * `return (...)` block at column 4.
 */
function indentBlock(s: string, n: number): string {
  const pad = " ".repeat(n);
  return s
    .split("\n")
    .map((l) => (l.length > 0 ? pad + l : l))
    .join("\n");
}

/**
 * Render the full file string for a component scaffold.
 */
export function renderComponent(scaffold: Scaffold, opts: RenderOptions): string {
  const { componentName, jsx, usesPrefersReduced } = scaffold;
  const isTs = opts.language === "typescript";

  const importsBlock = renderImports(scaffold.imports);

  // No props for the scaffolded component (future: pull from scaffold.props if added).
  const propsTypeBlock = isTs ? `\ninterface ${componentName}Props {}\n` : "";
  const sigSuffix = isTs ? `: ${componentName}Props` : "";
  const sig = `export default function ${componentName}(_props${sigSuffix}) {`;

  const declLines: string[] = [];
  if (usesPrefersReduced) {
    declLines.push("  const prefersReduced = useReducedMotion();");
  }
  const declBlock = declLines.length > 0 ? declLines.join("\n") + "\n\n" : "";

  // Indent jsx by 4 spaces so `return (` + 4-space-indented JSX reads cleanly.
  const indentedJsx = indentBlock(jsx, 4);

  const body = `${declBlock}  return (\n${indentedJsx}\n  );\n}`;
  return `${importsBlock}\n${propsTypeBlock}\n${sig}\n${body}\n`;
}

/**
 * Convenience: derive a filename from the scaffold's component name + language.
 */
export function deriveFilename(scaffold: Scaffold, opts: RenderOptions): string {
  const ext = opts.language === "typescript" ? "tsx" : "jsx";
  return `${scaffold.componentName}.${ext}`;
}
