/**
 * Reference loader. Reads markdown reference files from the bundled `refs/`
 * directory by logical name (e.g. "01-framer-motion" or "patterns/hero").
 *
 * Names are file-relative paths under `refs/` without the `.md` suffix.
 * The bundle ships read-only with the package — see scripts/sync-refs.mjs
 * for how it's mirrored from the Darkforge plugin.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Refs live next to the package root, two levels up from `dist/lib/` at runtime
 * and two levels up from `src/lib/` during tsx development. Both resolve to the
 * package root, so `<package-root>/refs/` works for both.
 */
const REFS_ROOT = path.resolve(__dirname, "..", "..", "refs");

const cache = new Map<string, string>();
let listCache: string[] | null = null;

function resolveReferencePath(name: string): string {
  const normalized = name.replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
  if (normalized === "" || normalized.includes("..")) {
    throw new Error(`Invalid reference name: ${JSON.stringify(name)}`);
  }
  return path.join(REFS_ROOT, ...normalized.split("/")) + ".md";
}

export async function loadReference(name: string): Promise<string> {
  const cached = cache.get(name);
  if (cached !== undefined) return cached;
  const filePath = resolveReferencePath(name);
  let content: string;
  try {
    content = await fs.readFile(filePath, "utf8");
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      throw new Error(`Reference not found: ${name} (looked in refs/${name}.md)`);
    }
    throw err;
  }
  cache.set(name, content);
  return content;
}

async function walk(dir: string, prefix: string, out: string[]): Promise<void> {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return;
    throw err;
  }
  for (const e of entries) {
    if (e.isDirectory()) {
      await walk(path.join(dir, e.name), prefix ? `${prefix}/${e.name}` : e.name, out);
    } else if (e.isFile() && e.name.endsWith(".md")) {
      const stem = e.name.slice(0, -3);
      out.push(prefix ? `${prefix}/${stem}` : stem);
    }
  }
}

export async function listReferences(): Promise<string[]> {
  if (listCache) return listCache;
  const found: string[] = [];
  await walk(REFS_ROOT, "", found);
  found.sort();
  listCache = found;
  return found;
}

/** Test-only: clear caches between runs. Not part of the public API. */
export function __resetReferenceCache(): void {
  cache.clear();
  listCache = null;
}
