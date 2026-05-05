import { z } from "zod";
import { toolError, toolOk } from "../types/index.js";
import type { ToolResult } from "../types/index.js";
import { routeIntent } from "../lib/reference-router.js";
import { loadReference } from "../lib/reference-loader.js";

export const title = "Forge skeleton loading state";
export const description =
  "Generates a skeleton (loading-state) component matched to the structure of a real component. Always emits both pulse and shimmer variants in the same file unless `variant` narrows it. The host AI receives the file as text — Darkforge never writes to disk.";

/* -------------------------------------------------------------------------- */
/*  Input schema                                                              */
/* -------------------------------------------------------------------------- */

export const inputSchema = {
  targetComponent: z
    .string()
    .optional()
    .describe(
      "Raw JSX/TSX source of a real component to mirror. Darkforge regex-parses the top-level structure (no AST library is bundled).",
    ),
  componentDescription: z
    .string()
    .optional()
    .describe(
      "Plain-English description of the component shape (e.g. 'pricing card', 'list row', 'hero', 'stat'). Used when no source is available.",
    ),
  variant: z
    .enum(["pulse", "shimmer", "both"])
    .optional()
    .default("both")
    .describe("Which animation variant(s) to emit. Default: both."),
  language: z
    .enum(["typescript", "javascript"])
    .optional()
    .default("typescript")
    .describe("Output language. TypeScript adds a typed `variant` prop; JavaScript drops the type annotation."),
};

interface Args {
  targetComponent?: string;
  componentDescription?: string;
  variant?: "pulse" | "shimmer" | "both";
  language?: "typescript" | "javascript";
}

/* -------------------------------------------------------------------------- */
/*  Skeleton block model                                                      */
/* -------------------------------------------------------------------------- */

type BlockKind = "text" | "block" | "avatar" | "button" | "image" | "row";

interface SkelBlock {
  kind: BlockKind;
  /** Tailwind width class (e.g. "w-3/4", "w-24"). */
  width: string;
  /** Tailwind height class (e.g. "h-4", "h-32"). */
  height: string;
  /** "rounded-sm" | "rounded-md" | "rounded-full" | "" */
  radius: "sm" | "md" | "full" | "none";
  children?: SkelBlock[];
}

/* -------------------------------------------------------------------------- */
/*  Tailwind size hint mapping                                                */
/* -------------------------------------------------------------------------- */

const TEXT_SIZE_TO_HEIGHT: Record<string, string> = {
  "text-xs": "h-3",
  "text-sm": "h-4",
  "text-base": "h-4",
  "text-lg": "h-5",
  "text-xl": "h-6",
  "text-2xl": "h-7",
  "text-3xl": "h-8",
  "text-4xl": "h-10",
  "text-5xl": "h-12",
  "text-6xl": "h-14",
  "text-7xl": "h-16",
  "text-8xl": "h-20",
  "text-9xl": "h-24",
};

const TAG_DEFAULT_HEIGHT: Record<string, string> = {
  h1: "h-10",
  h2: "h-8",
  h3: "h-7",
  h4: "h-6",
  h5: "h-5",
  h6: "h-5",
  p: "h-4",
  span: "h-4",
  button: "h-10",
  img: "h-32",
  svg: "h-6",
  input: "h-10",
};

/* -------------------------------------------------------------------------- */
/*  className parsing helpers                                                 */
/* -------------------------------------------------------------------------- */

function extractClassName(rawAttrs: string): string {
  // Match className="..." or className={"..."} or className={`...`}
  const dq = /className\s*=\s*"([^"]*)"/.exec(rawAttrs);
  if (dq) return dq[1] ?? "";
  const sq = /className\s*=\s*'([^']*)'/.exec(rawAttrs);
  if (sq) return sq[1] ?? "";
  const tpl = /className\s*=\s*\{\s*`([^`]*)`\s*\}/.exec(rawAttrs);
  if (tpl) return tpl[1] ?? "";
  const obj = /className\s*=\s*\{\s*"([^"]*)"\s*\}/.exec(rawAttrs);
  if (obj) return obj[1] ?? "";
  return "";
}

function pickWidthFromClassName(className: string, fallback: string): string {
  const m = /(?:^|\s)(w-(?:\d+(?:\/\d+)?|full|screen|auto|px|\[[^\]]+\]))/.exec(className);
  return m ? (m[1] ?? fallback) : fallback;
}

function pickHeightFromClassName(className: string, fallback: string): string {
  const m = /(?:^|\s)(h-(?:\d+|full|screen|auto|px|\[[^\]]+\]))/.exec(className);
  if (m) return m[1] ?? fallback;
  for (const [size, h] of Object.entries(TEXT_SIZE_TO_HEIGHT)) {
    if (new RegExp(`(?:^|\\s)${size}(?:\\s|$)`).test(className)) return h;
  }
  return fallback;
}

function pickRadiusFromClassName(className: string, fallback: SkelBlock["radius"]): SkelBlock["radius"] {
  if (/(?:^|\s)rounded-full(?:\s|$)/.test(className)) return "full";
  if (/(?:^|\s)rounded-(?:lg|xl|2xl|3xl)(?:\s|$)/.test(className)) return "md";
  if (/(?:^|\s)rounded(?:-md|-sm)?(?:\s|$)/.test(className)) return "sm";
  return fallback;
}

/* -------------------------------------------------------------------------- */
/*  Regex JSX walker                                                          */
/* -------------------------------------------------------------------------- */

const STRUCTURAL_TAGS = ["h1", "h2", "h3", "h4", "h5", "h6", "p", "span", "img", "button", "svg", "input", "li"];

function tagToBlockKind(tag: string): BlockKind {
  if (tag === "img") return "image";
  if (tag === "button") return "button";
  if (tag.startsWith("h") || tag === "p" || tag === "span") return "text";
  if (tag === "input") return "block";
  return "block";
}

/**
 * Very small regex-based JSX scanner. Walks every opening tag in source order
 * and pulls out the structural ones. Hierarchy is approximated as flat — good
 * enough for skeleton mirroring where we only need rough block counts and
 * sizes.
 */
function parseJsx(source: string): SkelBlock[] {
  const blocks: SkelBlock[] = [];
  // Match <tag ...> or <tag .../>
  const tagRe = /<([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g;
  let match: RegExpExecArray | null;
  while ((match = tagRe.exec(source)) !== null) {
    const rawTag = match[1];
    const rawAttrs = match[2];
    if (!rawTag) continue;
    const tag = rawTag.toLowerCase();
    if (!STRUCTURAL_TAGS.includes(tag)) continue;

    const className = extractClassName(rawAttrs ?? "");

    const defaultHeight = TAG_DEFAULT_HEIGHT[tag] ?? "h-4";
    const defaultWidth =
      tag === "img" ? "w-full" : tag === "button" ? "w-32" : tag === "input" ? "w-full" : "w-3/4";
    const defaultRadius: SkelBlock["radius"] =
      tag === "img" ? "md" : tag === "button" || tag === "input" ? "md" : "sm";

    const width = pickWidthFromClassName(className, defaultWidth);
    const height = pickHeightFromClassName(className, defaultHeight);
    const radius = pickRadiusFromClassName(className, defaultRadius);

    // Heuristic: small square with rounded-full → avatar
    const isAvatar =
      /(?:^|\s)rounded-full(?:\s|$)/.test(className) &&
      /(?:^|\s)w-(?:8|10|12|14|16|20)(?:\s|$)/.test(className);

    blocks.push({
      kind: isAvatar ? "avatar" : tagToBlockKind(tag),
      width: isAvatar ? width : width,
      height: isAvatar ? height : height,
      radius: isAvatar ? "full" : radius,
    });
  }
  return blocks;
}

/* -------------------------------------------------------------------------- */
/*  Description-based templates                                               */
/* -------------------------------------------------------------------------- */

function templateFromDescription(desc: string): SkelBlock[] {
  const d = desc.toLowerCase();
  if (/\b(card|tile)\b/.test(d) && /\bpric/.test(d)) {
    // Pricing card: badge, big price, 4 feature lines, CTA
    return [
      { kind: "text", width: "w-20", height: "h-4", radius: "sm" },
      { kind: "text", width: "w-32", height: "h-12", radius: "sm" },
      { kind: "text", width: "w-3/4", height: "h-4", radius: "sm" },
      { kind: "text", width: "w-2/3", height: "h-4", radius: "sm" },
      { kind: "text", width: "w-3/4", height: "h-4", radius: "sm" },
      { kind: "text", width: "w-1/2", height: "h-4", radius: "sm" },
      { kind: "button", width: "w-full", height: "h-10", radius: "md" },
    ];
  }
  if (/\b(card|tile)\b/.test(d)) {
    return [
      { kind: "image", width: "w-full", height: "h-40", radius: "md" },
      { kind: "text", width: "w-3/4", height: "h-5", radius: "sm" },
      { kind: "text", width: "w-1/2", height: "h-4", radius: "sm" },
      { kind: "button", width: "w-28", height: "h-9", radius: "md" },
    ];
  }
  if (/\b(list[-\s]?item|row|comment|message)\b/.test(d)) {
    return [
      { kind: "row", width: "w-full", height: "h-12", radius: "none", children: [
        { kind: "avatar", width: "w-10", height: "h-10", radius: "full" },
        { kind: "text", width: "w-1/2", height: "h-4", radius: "sm" },
        { kind: "text", width: "w-1/3", height: "h-3", radius: "sm" },
      ] },
    ];
  }
  if (/\bhero\b/.test(d)) {
    return [
      { kind: "text", width: "w-3/4", height: "h-12", radius: "sm" },
      { kind: "text", width: "w-2/3", height: "h-12", radius: "sm" },
      { kind: "text", width: "w-1/2", height: "h-5", radius: "sm" },
      { kind: "button", width: "w-32", height: "h-11", radius: "md" },
      { kind: "button", width: "w-32", height: "h-11", radius: "md" },
    ];
  }
  if (/\b(stat|metric|kpi)\b/.test(d)) {
    return [
      { kind: "text", width: "w-24", height: "h-3", radius: "sm" },
      { kind: "text", width: "w-32", height: "h-10", radius: "sm" },
      { kind: "text", width: "w-20", height: "h-3", radius: "sm" },
    ];
  }
  if (/\b(testimonial|quote|review)\b/.test(d)) {
    return [
      { kind: "text", width: "w-full", height: "h-4", radius: "sm" },
      { kind: "text", width: "w-full", height: "h-4", radius: "sm" },
      { kind: "text", width: "w-2/3", height: "h-4", radius: "sm" },
      { kind: "row", width: "w-full", height: "h-12", radius: "none", children: [
        { kind: "avatar", width: "w-10", height: "h-10", radius: "full" },
        { kind: "text", width: "w-1/3", height: "h-4", radius: "sm" },
      ] },
    ];
  }
  if (/\b(nav|navbar|header)\b/.test(d)) {
    return [
      { kind: "row", width: "w-full", height: "h-12", radius: "none", children: [
        { kind: "block", width: "w-32", height: "h-6", radius: "sm" },
        { kind: "text", width: "w-16", height: "h-4", radius: "sm" },
        { kind: "text", width: "w-16", height: "h-4", radius: "sm" },
        { kind: "button", width: "w-24", height: "h-9", radius: "md" },
      ] },
    ];
  }
  if (/\b(form|input|field)\b/.test(d)) {
    return [
      { kind: "text", width: "w-24", height: "h-4", radius: "sm" },
      { kind: "block", width: "w-full", height: "h-10", radius: "md" },
      { kind: "text", width: "w-24", height: "h-4", radius: "sm" },
      { kind: "block", width: "w-full", height: "h-10", radius: "md" },
      { kind: "button", width: "w-full", height: "h-10", radius: "md" },
    ];
  }
  // Generic 3-row vertical fallback
  return [
    { kind: "text", width: "w-3/4", height: "h-5", radius: "sm" },
    { kind: "text", width: "w-full", height: "h-4", radius: "sm" },
    { kind: "text", width: "w-2/3", height: "h-4", radius: "sm" },
  ];
}

/* -------------------------------------------------------------------------- */
/*  Naming                                                                    */
/* -------------------------------------------------------------------------- */

function pascalCase(input: string): string {
  const cleaned = input
    .replace(/[^a-zA-Z0-9\s_-]/g, " ")
    .split(/[\s_-]+/)
    .filter(Boolean);
  if (cleaned.length === 0) return "Component";
  return cleaned
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join("");
}

function deriveBaseName(args: Args): string {
  if (args.componentDescription && args.componentDescription.trim().length > 0) {
    return pascalCase(args.componentDescription);
  }
  if (args.targetComponent) {
    // Try function/const ComponentName = ... pattern
    const fn = /(?:function|const|class)\s+([A-Z][A-Za-z0-9]*)/.exec(args.targetComponent);
    if (fn && fn[1]) return fn[1];
    // Try export default function Name
    const exp = /export\s+default\s+function\s+([A-Z][A-Za-z0-9]*)/.exec(args.targetComponent);
    if (exp && exp[1]) return exp[1];
  }
  return "Component";
}

/* -------------------------------------------------------------------------- */
/*  Code emitters                                                             */
/* -------------------------------------------------------------------------- */

const KEYFRAMES_CSS = `@keyframes df-pulse {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.55; }
}
@keyframes df-shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
@media (prefers-reduced-motion: reduce) {
  .df-skel-pulse,
  .df-skel-shimmer {
    animation: none !important;
  }
}`;

function radiusValue(r: SkelBlock["radius"]): string {
  if (r === "full") return "9999px";
  if (r === "md") return "var(--df-radius-md)";
  if (r === "sm") return "var(--df-radius-sm)";
  return "0px";
}

function pulseStyleObject(b: SkelBlock): string {
  return `{ background: "var(--df-skeleton-base)", borderRadius: "${radiusValue(b.radius)}" }`;
}

function shimmerStyleObject(b: SkelBlock): string {
  return (
    `{ ` +
    `backgroundImage: "linear-gradient(90deg, var(--df-skeleton-base) 0%, var(--df-skeleton-shine) 50%, var(--df-skeleton-base) 100%)", ` +
    `backgroundSize: "200% 100%", ` +
    `animation: "df-shimmer 1.6s linear infinite", ` +
    `backgroundColor: "var(--df-skeleton-base)", ` +
    `borderRadius: "${radiusValue(b.radius)}" ` +
    `}`
  );
}

function emitBlockJsx(b: SkelBlock, mode: "pulse" | "shimmer", indent = 6): string {
  const pad = " ".repeat(indent);
  if (b.kind === "row" && b.children && b.children.length > 0) {
    const inner = b.children.map((c) => emitBlockJsx(c, mode, indent + 2)).join("\n");
    return `${pad}<div className="flex items-center gap-3 ${b.width}">\n${inner}\n${pad}</div>`;
  }
  const sizing = `${b.width} ${b.height}`.trim();
  if (mode === "pulse") {
    return `${pad}<div className="df-skel-pulse animate-pulse ${sizing}" style={${pulseStyleObject(b)}} />`;
  }
  return `${pad}<div className="df-skel-shimmer ${sizing}" style={${shimmerStyleObject(b)}} />`;
}

function emitVariantComponent(
  componentName: string,
  blocks: SkelBlock[],
  mode: "pulse" | "shimmer",
  language: "typescript" | "javascript",
): string {
  const propsType = language === "typescript" ? ": { className?: string }" : "";
  const body = blocks.map((b) => emitBlockJsx(b, mode, 6)).join("\n");
  return `export function ${componentName}${mode === "pulse" ? "Pulse" : "Shimmer"}({ className = "" }${propsType}) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className={\`df-skel-root flex flex-col gap-3 p-4 \${className}\`}
      style={{ background: "var(--df-bg-surface)", borderRadius: "var(--df-radius-md)" }}
    >
${body}
      <span className="sr-only">Loading…</span>
    </div>
  );
}`;
}

function emitChooser(
  componentName: string,
  language: "typescript" | "javascript",
  hasPulse: boolean,
  hasShimmer: boolean,
): string {
  if (!hasPulse && !hasShimmer) return "";
  if (hasPulse && !hasShimmer) {
    return `export default ${componentName}Pulse;`;
  }
  if (hasShimmer && !hasPulse) {
    return `export default ${componentName}Shimmer;`;
  }
  const propsType =
    language === "typescript"
      ? ': { variant?: "pulse" | "shimmer"; className?: string }'
      : "";
  return `export default function ${componentName}({ variant = "shimmer", className = "" }${propsType}) {
  if (variant === "pulse") return <${componentName}Pulse className={className} />;
  return <${componentName}Shimmer className={className} />;
}`;
}

function emitKeyframeStyleTag(): string {
  // Inlined once — the host can move it to globals.css if preferred.
  return `function ${"DfSkeletonKeyframes"}() {
  return (
    <style>{\`${KEYFRAMES_CSS.replace(/`/g, "\\`")}\`}</style>
  );
}`;
}

/* -------------------------------------------------------------------------- */
/*  Handler                                                                   */
/* -------------------------------------------------------------------------- */

export async function handler(args: Args): Promise<ToolResult> {
  try {
    const variant = args.variant ?? "both";
    const language = args.language ?? "typescript";

    if (
      (!args.targetComponent || args.targetComponent.trim().length === 0) &&
      (!args.componentDescription || args.componentDescription.trim().length === 0)
    ) {
      return toolError(
        "forge_skeleton",
        "neither targetComponent nor componentDescription was supplied",
        [
          "Provide either targetComponent (raw JSX/TSX) or componentDescription (a short phrase)",
          "If you have neither, describe the shape: e.g. 'pricing card', 'list row', 'hero', 'stat'",
        ],
      );
    }

    if (variant !== "pulse" && variant !== "shimmer" && variant !== "both") {
      return toolError("forge_skeleton", `unknown variant '${String(variant)}'`, [
        "Confirm the variant is one of pulse | shimmer | both",
      ]);
    }

    // 0. Route to reference docs (best-effort; never abort the tool on failure).
    const routingInput =
      (args.componentDescription || args.targetComponent || "") + " skeleton";
    const routedReferences = routeIntent(routingInput);
    let referenceExcerpt = "";
    if (routedReferences.length > 0) {
      try {
        const md = await loadReference(routedReferences[0]!);
        referenceExcerpt = md.slice(0, 400);
      } catch {
        referenceExcerpt = "";
      }
    }

    // 1. Build skeleton blocks
    let blocks: SkelBlock[] = [];
    if (args.targetComponent && args.targetComponent.trim().length > 0) {
      try {
        blocks = parseJsx(args.targetComponent);
      } catch {
        blocks = [];
      }
    }
    if (blocks.length === 0) {
      if (!args.componentDescription || args.componentDescription.trim().length === 0) {
        return toolError(
          "forge_skeleton",
          "targetComponent did not contain any structural elements Darkforge could parse",
          [
            "If targetComponent failed to parse, simplify the input or use componentDescription instead",
            "Provide a componentDescription such as 'pricing card' or 'list row' as a fallback",
          ],
        );
      }
      blocks = templateFromDescription(args.componentDescription);
    }

    // 2. Naming
    const baseName = deriveBaseName(args);
    const componentName = `${baseName}Skeleton`;
    const filename = `${componentName}.${language === "typescript" ? "tsx" : "jsx"}`;

    // 3. Emit code
    const wantsPulse = variant === "pulse" || variant === "both";
    const wantsShimmer = variant === "shimmer" || variant === "both";

    const parts: string[] = [];
    parts.push(
      `// References consulted: ${routedReferences.length > 0 ? routedReferences.join(", ") : "(none)"}`,
    );
    if (referenceExcerpt) {
      parts.push(`// Reference excerpt:`);
      for (const line of referenceExcerpt.split(/\r?\n/)) {
        parts.push(`// ${line}`);
      }
    }
    parts.push(`// ${filename}`);
    parts.push(`// Auto-generated by Darkforge forge_skeleton.`);
    parts.push(`// Tokens consumed: --df-skeleton-base, --df-skeleton-shine, --df-radius-sm, --df-radius-md, --df-bg-surface.`);
    parts.push(`// Reduced-motion fallback is included via the inlined <style> block.`);
    parts.push("");
    if (language === "typescript") {
      parts.push(`import * as React from "react";`);
    } else {
      parts.push(`import * as React from "react";`);
    }
    parts.push("");

    // Inline keyframe component — emitted exactly once.
    parts.push(`/** Keyframes for both pulse and shimmer variants. Mount this once near your skeleton tree, or copy KEYFRAMES_CSS into globals.css and drop this component. */`);
    parts.push(emitKeyframeStyleTag());
    parts.push("");

    if (wantsPulse) {
      parts.push(emitVariantComponent(componentName, blocks, "pulse", language));
      parts.push("");
    }
    if (wantsShimmer) {
      parts.push(emitVariantComponent(componentName, blocks, "shimmer", language));
      parts.push("");
    }

    const chooser = emitChooser(componentName, language, wantsPulse, wantsShimmer);
    if (chooser) {
      parts.push(chooser);
      parts.push("");
    }

    // Re-export the keyframe component so consumers can mount it explicitly.
    parts.push(`export { DfSkeletonKeyframes };`);

    const code = parts.join("\n");

    const usageImport =
      variant === "both"
        ? `import ${componentName}, { ${componentName}Pulse, ${componentName}Shimmer, DfSkeletonKeyframes } from "./${componentName}";`
        : variant === "pulse"
          ? `import ${componentName}Pulse, { DfSkeletonKeyframes } from "./${componentName}";`
          : `import ${componentName}Shimmer, { DfSkeletonKeyframes } from "./${componentName}";`;

    const usageJsx =
      variant === "pulse"
        ? `<${componentName}Pulse />`
        : variant === "shimmer"
          ? `<${componentName}Shimmer />`
          : `<${componentName} variant="shimmer" />`;

    const usageBlock = [
      "── Usage ──",
      usageImport,
      "",
      "// Mount <DfSkeletonKeyframes /> once at the top of your tree,",
      "// OR paste KEYFRAMES_CSS into globals.css and skip the component.",
      "",
      usageJsx,
    ].join("\n");

    const text = `${code}\n\n${usageBlock}`;

    return toolOk(text, {
      skeletonCode: code,
      filename,
      cssRequired: KEYFRAMES_CSS,
      usageExample: `${usageImport}\n\n${usageJsx}`,
      routedReferences,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return toolError("forge_skeleton", msg, [
      "Provide either targetComponent or componentDescription",
      "If targetComponent failed to parse, simplify the input or use componentDescription instead",
      "Confirm the variant is one of pulse | shimmer | both",
    ]);
  }
}
