import { readFile, access } from "node:fs/promises";
import { resolve, join } from "node:path";
import { LIBRARY_MAP, lookupPackage } from "./library-map.js";
import type { Framework, Language, StackProfile } from "../types/index.js";

interface PackageJsonShape {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function readPackageJson(projectPath: string): Promise<PackageJsonShape> {
  const pkgPath = resolve(projectPath, "package.json");
  const raw = await readFile(pkgPath, "utf8");
  return JSON.parse(raw) as PackageJsonShape;
}

function detectFramework(deps: Record<string, string>, scripts: Record<string, string>): Framework {
  if (deps.next || /next\s/.test(scripts.dev ?? "") || /next\s/.test(scripts.build ?? "")) return "nextjs";
  if (deps.nuxt) return "nuxt";
  if (deps.remix || deps["@remix-run/react"]) return "remix";
  if (deps.svelte) return "svelte";
  if (deps.vue) return "vue";
  if (deps.vite || /vite\s/.test(scripts.dev ?? "")) return "vite";
  if (deps.react) return "react";
  return "unknown";
}

async function detectLanguage(projectPath: string): Promise<Language> {
  if (await fileExists(join(projectPath, "tsconfig.json"))) return "typescript";
  return "javascript";
}

/**
 * Reads the project's package.json, maps known packages to capabilities,
 * detects framework + language, and emits recommendations.
 *
 * Throws if package.json is missing or unreadable. Caller (tool handler)
 * is responsible for catching and returning a friendly error.
 */
export async function detectStack(projectPath: string): Promise<StackProfile> {
  const absPath = resolve(projectPath);
  const pkg = await readPackageJson(absPath);
  const deps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
  const scripts = pkg.scripts ?? {};

  const detectedLibraries = Object.keys(deps).filter((p) => lookupPackage(p));

  const animation = detectedLibraries.filter((p) => LIBRARY_MAP[p].category === "animation");
  const components = detectedLibraries.filter((p) => LIBRARY_MAP[p].category === "components");
  const threeD = detectedLibraries.filter((p) => LIBRARY_MAP[p].category === "3d");
  const styling = detectedLibraries.filter((p) => LIBRARY_MAP[p].category === "styling");

  const framework = detectFramework(deps, scripts);
  const language = await detectLanguage(absPath);

  const recommendations: string[] = [];
  if (animation.length === 0) recommendations.push("framer-motion (for entrance/scroll animations)");
  if (styling.length === 0) recommendations.push("tailwindcss (Darkforge tokens are Tailwind-friendly)");
  if (threeD.length === 0 && (framework === "nextjs" || framework === "vite" || framework === "react")) {
    recommendations.push("@react-three/fiber + @react-three/drei (for optional 3D hero elements)");
  }

  const forgeCommand =
    detectedLibraries.length === 0
      ? "Install at least tailwindcss and framer-motion, then run forge_component again"
      : "forge_component with a description like 'glassmorphism pricing card with hover glow'";

  return {
    detectedLibraries,
    capabilities: {
      animation,
      components,
      threeD,
      styling,
      framework,
      language,
    },
    recommendations,
    forgeCommand,
  };
}
