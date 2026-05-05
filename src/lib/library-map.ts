import type { LibraryCapability } from "../types/index.js";

/**
 * Maps npm package names → Darkforge capability metadata.
 * Tool agents READ this map; do not mutate it at runtime.
 *
 * Notes:
 * - shadcn/ui is NOT a real npm package (it's a CLI that copies source files).
 *   We detect it via class-variance-authority + tailwind-merge signals instead.
 */
export const LIBRARY_MAP: Record<string, LibraryCapability> = {
  // ── Animation ────────────────────────────────────────────────────────
  "framer-motion": { name: "Framer Motion", category: "animation", support: "full" },
  motion: { name: "Motion", category: "animation", support: "full" },
  gsap: { name: "GSAP", category: "animation", support: "full" },
  "@react-spring/web": { name: "React Spring", category: "animation", support: "full" },
  animejs: { name: "Anime.js", category: "animation", support: "full" },
  "lottie-react": { name: "Lottie React", category: "animation", support: "full" },
  "lottie-web": { name: "Lottie Web", category: "animation", support: "full" },
  "auto-animate": { name: "AutoAnimate", category: "animation", support: "partial" },

  // ── Components ───────────────────────────────────────────────────────
  "class-variance-authority": { name: "shadcn/ui (signal)", category: "components", support: "full" },
  "tailwind-merge": { name: "shadcn/ui (signal)", category: "components", support: "full" },
  daisyui: { name: "DaisyUI", category: "components", support: "full" },
  flowbite: { name: "Flowbite", category: "components", support: "full" },
  "flowbite-react": { name: "Flowbite React", category: "components", support: "full" },
  antd: { name: "Ant Design", category: "components", support: "full" },
  "@mui/material": { name: "MUI", category: "components", support: "partial" },
  "@radix-ui/react-dialog": { name: "Radix UI", category: "components", support: "full" },
  "@radix-ui/react-dropdown-menu": { name: "Radix UI", category: "components", support: "full" },
  "@headlessui/react": { name: "Headless UI", category: "components", support: "full" },

  // ── 3D ────────────────────────────────────────────────────────────────
  three: { name: "Three.js", category: "3d", support: "full" },
  "@react-three/fiber": { name: "React Three Fiber", category: "3d", support: "full" },
  "@react-three/drei": { name: "R3F Drei", category: "3d", support: "full" },
  vanta: { name: "Vanta.js", category: "3d", support: "full" },
  ogl: { name: "OGL", category: "3d", support: "partial" },

  // ── Styling ───────────────────────────────────────────────────────────
  tailwindcss: { name: "Tailwind CSS", category: "styling", support: "full" },
  "@tailwindcss/postcss": { name: "Tailwind CSS v4", category: "styling", support: "full" },
  unocss: { name: "UnoCSS", category: "styling", support: "partial" },
  "styled-components": { name: "styled-components", category: "styling", support: "partial" },
  "@emotion/react": { name: "Emotion", category: "styling", support: "partial" },

  // ── Framework signals (also detected via scripts/config files) ───────
  next: { name: "Next.js", category: "framework", support: "full" },
  nuxt: { name: "Nuxt", category: "framework", support: "partial" },
  vue: { name: "Vue", category: "framework", support: "partial" },
  svelte: { name: "Svelte", category: "framework", support: "partial" },
  remix: { name: "Remix", category: "framework", support: "partial" },
  "@remix-run/react": { name: "Remix", category: "framework", support: "partial" },
  vite: { name: "Vite", category: "framework", support: "full" },
  react: { name: "React", category: "framework", support: "full" },
};

/** Reverse-lookup: list every package we know about, by category. */
export function packagesByCategory(category: LibraryCapability["category"]): string[] {
  return Object.entries(LIBRARY_MAP)
    .filter(([, cap]) => cap.category === category)
    .map(([pkg]) => pkg);
}

/** Returns the LibraryCapability for a package, or null if unknown. */
export function lookupPackage(pkg: string): LibraryCapability | null {
  return LIBRARY_MAP[pkg] ?? null;
}
