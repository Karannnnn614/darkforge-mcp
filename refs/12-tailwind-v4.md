# Darkforge — Tailwind v4 Dark Reference
Tailwind CSS v4 collapses configuration into CSS itself: a single `@import "tailwindcss"`, a `@theme { ... }` block that registers tokens *and auto-generates utilities*, native container queries, `@utility` for first-class custom utilities, and a Rust-powered engine that compiles roughly an order of magnitude faster than v3. Darkforge's `--df-*` token contract maps onto v4 perfectly — we keep the raw `:root` tokens (so every existing reference still works) and *bridge* them into `@theme` so utilities like `bg-nx-surface`, `text-nx-violet`, `shadow-glow-cyan`, and `rounded-nx-lg` materialise for free.

## Contents

- [Source-of-truth caveat](#source-of-truth-caveat)
- [Install / Setup](#install-setup)
  - [Vite (preferred for Vite/React/Vue/Solid/SvelteKit)](#vite-preferred-for-vitereactvuesolidsveltekit)
  - [Next.js / general PostCSS](#nextjs-general-postcss)
  - [Migrating from v3 (incremental)](#migrating-from-v3-incremental)
- [The Darkforge `@theme` Block (the big one)](#the-darkforge-theme-block-the-big-one)
  - [What the bridge unlocks](#what-the-bridge-unlocks)
- [Container Queries Patterns](#container-queries-patterns)
  - [1. Container-aware product card](#1-container-aware-product-card)
  - [2. Sidebar-responsive dashboard grid](#2-sidebar-responsive-dashboard-grid)
  - [3. Article layout breakpoints from container width](#3-article-layout-breakpoints-from-container-width)
  - [4. Composer toolbar that condenses](#4-composer-toolbar-that-condenses)
  - [5. Email-style two-pane that becomes single-column](#5-email-style-two-pane-that-becomes-single-column)
- [Modern CSS Patterns (v4 power features)](#modern-css-patterns-v4-power-features)
  - [1. View Transitions for route changes (CSS-only)](#1-view-transitions-for-route-changes-css-only)
  - [2. Scroll-driven animations (no JS, no IntersectionObserver)](#2-scroll-driven-animations-no-js-no-intersectionobserver)
  - [3. `:has()` conditional styling](#3-has-conditional-styling)
  - [4. `@starting-style` for entrance animations on mount](#4-starting-style-for-entrance-animations-on-mount)
  - [5. Subgrid for nested grids that line up](#5-subgrid-for-nested-grids-that-line-up)
  - [6. `color-mix()` for runtime variants](#6-color-mix-for-runtime-variants)
  - [7. `light-dark()` (when you do need a light surface)](#7-light-dark-when-you-do-need-a-light-surface)
- [Cascade Layers in Darkforge](#cascade-layers-in-darkforge)
  - [Why layer order matters](#why-layer-order-matters)
- [Glass Effect Utilities (v4 syntax)](#glass-effect-utilities-v4-syntax)
  - [Usage](#usage)
- [Neon Glow Utilities (v4 syntax)](#neon-glow-utilities-v4-syntax)
  - [Usage](#usage)
- [Common Gotchas](#common-gotchas)
  - [1. `postcss.config.js` is now one line (or absent)](#1-postcssconfigjs-is-now-one-line-or-absent)
  - [2. `tailwind.config.ts` is deprecated, not banned](#2-tailwindconfigts-is-deprecated-not-banned)
  - [3. Content paths are auto-detected](#3-content-paths-are-auto-detected)
  - [4. Tailwind extension / IDE lag](#4-tailwind-extension-ide-lag)
  - [5. Plugin ecosystem is fragmented](#5-plugin-ecosystem-is-fragmented)
  - [6. Arbitrary values still work, but tokens are preferred](#6-arbitrary-values-still-work-but-tokens-are-preferred)
  - [7. `prefers-reduced-motion` has a built-in variant](#7-prefers-reduced-motion-has-a-built-in-variant)
  - [8. `@theme inline` for tokens that should *not* emit a CSS variable](#8-theme-inline-for-tokens-that-should-not-emit-a-css-variable)
  - [9. Dark variant configuration](#9-dark-variant-configuration)
  - [10. `hover:` on touch devices](#10-hover-on-touch-devices)
- [Cross-References](#cross-references)

---

## Source-of-truth caveat

Tailwind v4 stable shipped in early 2025. The v4 surface — `@theme`, `@utility`, `@custom-variant`, `@source`, the `@tailwindcss/vite` and `@tailwindcss/postcss` packages, container queries — is settled. Smaller details (which property namespaces auto-generate which utility prefixes, exact behaviour of `@theme inline`, plugin ecosystem coverage) can drift between minor versions. Anything below marked `// VERIFY:` should be cross-checked against `tailwindcss.com/docs` and your installed `tailwindcss` version before shipping. Run `npx tailwindcss --version` in your project — this reference targets `4.x`.

---

## Install / Setup

v4 has two supported installation paths. Pick by toolchain.

### Vite (preferred for Vite/React/Vue/Solid/SvelteKit)

```bash
npm install -D tailwindcss @tailwindcss/vite
```

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // single line — no postcss config needed
  ],
})
```

```css
/* src/app.css — imported once at the entry */
@import "tailwindcss";
```

That is the entire setup. No `tailwind.config.ts`. No `postcss.config.js`. No `content: []` array.

### Next.js / general PostCSS

```bash
npm install -D tailwindcss @tailwindcss/postcss
```

```js
// postcss.config.mjs
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
```

```css
/* src/app/globals.css */
@import "tailwindcss";
```

Then in `app/layout.tsx`:

```tsx
import './globals.css'

export const metadata = {
  title: 'Darkforge App',
  description: 'AMOLED-dark interface',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-nx-base text-nx-text-primary antialiased">
        {children}
      </body>
    </html>
  )
}
```

### Migrating from v3 (incremental)

If you have an existing `tailwind.config.ts` and aren't ready to port it, v4 can still consume it:

```css
@import "tailwindcss";
@config "../tailwind.config.ts"; /* loads the legacy JS config */
```

This keeps `theme.extend`, plugins, and `content` paths working while you migrate to `@theme`. // VERIFY: `@config` still ships in your v4 minor — it was present at 4.0 and is documented as a migration aid.

---

## The Darkforge `@theme` Block (the big one)

This is the bridge. It does **not** replace `00-dark-tokens.md`'s `:root` block — keep that, because every existing Darkforge reference reads `var(--df-bg-surface)` etc. directly. What `@theme` adds is *utility generation*: when you write `--color-nx-violet` inside `@theme`, Tailwind emits `bg-nx-violet`, `text-nx-violet`, `border-nx-violet`, `ring-nx-violet`, `from-nx-violet`, `to-nx-violet`, `divide-nx-violet`, `outline-nx-violet`, `decoration-nx-violet`, `accent-nx-violet`, `caret-nx-violet`, `fill-nx-violet`, `stroke-nx-violet`, and `shadow-nx-violet` — automatically. Same idea applies to `--font-*`, `--text-*`, `--spacing-*`, `--radius-*`, `--shadow-*`, `--ease-*`, `--breakpoint-*`, and `--animate-*` namespaces. // VERIFY: exact list of derived utilities per namespace against `tailwindcss.com/docs/theme`.

```css
/* src/app/globals.css */
@import "tailwindcss";

/* ---- Step 1: keep the canonical DF tokens at :root (from 00-dark-tokens.md) ---- */
:root {
  color-scheme: dark;

  --df-bg-base:       #000000;
  --df-bg-surface:    #080808;
  --df-bg-elevated:   #111111;
  --df-bg-overlay:    #1a1a1a;
  --df-bg-muted:      #222222;
  --df-bg-hover:      #2a2a2a;

  --df-neon-violet:   #a78bfa;
  --df-neon-cyan:     #22d3ee;
  --df-neon-pink:     #f472b6;
  --df-neon-green:    #4ade80;
  --df-neon-amber:    #fbbf24;
  --df-neon-red:      #f87171;

  --df-text-primary:   #ffffff;
  --df-text-secondary: #a1a1aa;
  --df-text-muted:     #52525b;
  --df-text-inverse:   #000000;

  --df-border-subtle:  rgba(255, 255, 255, 0.05);
  --df-border-default: rgba(255, 255, 255, 0.09);
  --df-border-strong:  rgba(255, 255, 255, 0.16);
  --df-border-focus:   rgba(167, 139, 250, 0.5);

  --df-glass-bg:       rgba(255, 255, 255, 0.04);
  --df-glass-bg-md:    rgba(255, 255, 255, 0.07);
  --df-glass-bg-lg:    rgba(255, 255, 255, 0.10);
  --df-glass-border:   rgba(255, 255, 255, 0.08);
  --df-glass-border-md: rgba(255, 255, 255, 0.12);

  --df-glow-violet:    0 0 20px rgba(167, 139, 250, 0.35);
  --df-glow-cyan:      0 0 20px rgba(34, 211, 238, 0.35);
  --df-glow-pink:      0 0 20px rgba(244, 114, 182, 0.35);
  --df-glow-green:     0 0 20px rgba(74, 222, 128, 0.35);
  --df-glow-violet-lg: 0 0 40px rgba(167, 139, 250, 0.25);
}

/* ---- Step 2: bridge them into @theme so utilities are generated ---- */
@theme {
  /* Colors → bg-nx-*, text-nx-*, border-nx-*, ring-nx-*, from-nx-*, etc. */
  --color-nx-base:        var(--df-bg-base);
  --color-nx-surface:     var(--df-bg-surface);
  --color-nx-elevated:    var(--df-bg-elevated);
  --color-nx-overlay:     var(--df-bg-overlay);
  --color-nx-muted:       var(--df-bg-muted);
  --color-nx-hover:       var(--df-bg-hover);

  --color-nx-violet:      var(--df-neon-violet);
  --color-nx-cyan:        var(--df-neon-cyan);
  --color-nx-pink:        var(--df-neon-pink);
  --color-nx-green:       var(--df-neon-green);
  --color-nx-amber:       var(--df-neon-amber);
  --color-nx-red:         var(--df-neon-red);

  --color-nx-fg:          var(--df-text-primary);
  --color-nx-fg-muted:    var(--df-text-secondary);
  --color-nx-fg-subtle:   var(--df-text-muted);
  --color-nx-fg-inverse:  var(--df-text-inverse);

  --color-nx-border:        var(--df-border-default);
  --color-nx-border-subtle: var(--df-border-subtle);
  --color-nx-border-strong: var(--df-border-strong);
  --color-nx-border-focus:  var(--df-border-focus);

  /* Radii → rounded-nx-* */
  --radius-nx-xs:   4px;
  --radius-nx-sm:   6px;
  --radius-nx-md:   10px;
  --radius-nx-lg:   16px;
  --radius-nx-xl:   24px;
  --radius-nx-2xl:  32px;

  /* Shadows → shadow-glow-* */
  --shadow-glow-violet:    var(--df-glow-violet);
  --shadow-glow-cyan:      var(--df-glow-cyan);
  --shadow-glow-pink:      var(--df-glow-pink);
  --shadow-glow-green:     var(--df-glow-green);
  --shadow-glow-violet-lg: var(--df-glow-violet-lg);
  // VERIFY: shadow utility prefix in v4 is `shadow-{name}` for arbitrary `--shadow-*`
  // tokens — confirmed at 4.0; double-check current version.

  /* Typography → font-sans, font-mono, font-display */
  --font-sans:    'Inter', 'Geist', system-ui, sans-serif;
  --font-mono:    'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
  --font-display: 'Cal Sans', 'Inter', sans-serif;

  /* Easing → ease-nx-* */
  --ease-nx-out:    cubic-bezier(0.16, 1, 0.3, 1);
  --ease-nx-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-nx-smooth: cubic-bezier(0.4, 0, 0.2, 1);

  /* Custom breakpoints (optional — overrides defaults if you want them) */
  --breakpoint-3xl: 120rem;

  /* Animations → animate-* (paired with @keyframes below) */
  --animate-shimmer:    shimmer 2s linear infinite;
  --animate-glow-pulse: glow-pulse 2.4s ease-in-out infinite;
  --animate-float:      float 3s ease-in-out infinite;
  --animate-spin-slow:  spin 8s linear infinite;
}

/* @theme registers the tokens; the @keyframes still need to exist in CSS */
@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position:  200% 0; }
}
@keyframes glow-pulse {
  0%, 100% { opacity: 0.55; transform: scale(1); }
  50%      { opacity: 1;    transform: scale(1.04); }
}
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-8px); }
}

/* Optional: dark variant — Darkforge is dark-only so this can be inverted from v3 */
@custom-variant dark (&:is(.dark *));
// VERIFY: shadcn convention; alternative `@custom-variant dark (&:where(.dark, .dark *))`
// is used by some templates — both work, pick one and stick with it.
```

### What the bridge unlocks

```tsx
// All of the below are now valid utility class names — generated from @theme.
<div className="
  bg-nx-surface
  border border-nx-border
  text-nx-fg
  rounded-nx-lg
  shadow-glow-violet
  ease-nx-out
  hover:bg-nx-hover
  hover:shadow-glow-violet-lg
  font-display
  animate-float
" />
```

No more `bg-[var(--df-bg-surface)]` arbitrary-value escape hatches in component code.

---

## Container Queries Patterns

Container queries are first-class in v4 — no plugin, no config. Wrap an element in `@container` and children can branch on *that element's* width using `@sm:`, `@md:`, `@lg:`, `@xl:`, `@2xl:` (mirrors viewport breakpoints) or arbitrary `@[42rem]:`.

### 1. Container-aware product card

```tsx
// components/product-card.tsx
'use client'

interface Product {
  id: string
  title: string
  price: number
  image: string
  badge?: string
}

export function ProductCard({ product }: { product: Product }) {
  return (
    <article
      className="
        @container
        bg-nx-surface
        border border-nx-border-subtle
        rounded-nx-lg
        overflow-hidden
        transition-colors duration-300 ease-nx-out
        hover:border-nx-violet/40
      "
    >
      {/* Layout flips at 22rem container width — not viewport */}
      <div className="flex flex-col @[22rem]:flex-row gap-4 p-4">
        <img
          src={product.image}
          alt={product.title}
          className="
            w-full @[22rem]:w-32
            aspect-square
            object-cover
            rounded-nx-md
          "
        />
        <div className="flex-1 flex flex-col gap-2">
          {product.badge && (
            <span className="
              self-start
              px-2 py-0.5
              text-[11px] font-medium
              text-nx-violet
              bg-nx-violet/10
              rounded-full
              border border-nx-violet/20
            ">
              {product.badge}
            </span>
          )}
          <h3 className="text-nx-fg font-medium text-base @[28rem]:text-lg">
            {product.title}
          </h3>
          <p className="text-nx-fg-muted text-sm hidden @[22rem]:block">
            Premium build with 1-year warranty.
          </p>
          <div className="mt-auto flex items-baseline gap-2">
            <span className="text-nx-fg font-semibold text-xl">
              ${product.price.toFixed(2)}
            </span>
            <span className="text-nx-fg-subtle text-xs line-through">
              ${(product.price * 1.25).toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </article>
  )
}
```

### 2. Sidebar-responsive dashboard grid

```tsx
// components/dashboard/stat-grid.tsx
interface Stat {
  label: string
  value: string
  delta: number
}

const STATS: Stat[] = [
  { label: 'MRR',           value: '$48,210', delta:  12.4 },
  { label: 'Active users',  value: '12,408',  delta:   3.2 },
  { label: 'Trial signups', value: '942',     delta:  -1.1 },
  { label: 'Churn',         value: '2.3%',    delta:  -0.4 },
]

export function StatGrid() {
  return (
    <section
      className="
        @container/dashboard
        bg-nx-base
        p-6
      "
    >
      {/* The grid responds to the dashboard container, not viewport.
          Sidebar collapse instantly reflows it. */}
      <div
        className="
          grid gap-4
          grid-cols-1
          @md/dashboard:grid-cols-2
          @2xl/dashboard:grid-cols-4
        "
      >
        {STATS.map(s => (
          <div
            key={s.label}
            className="
              bg-nx-elevated
              border border-nx-border-subtle
              rounded-nx-lg
              p-5
            "
          >
            <p className="text-nx-fg-subtle text-xs uppercase tracking-wide">
              {s.label}
            </p>
            <p className="mt-2 text-nx-fg text-2xl font-semibold tabular-nums">
              {s.value}
            </p>
            <p
              className={`
                mt-1 text-xs font-medium tabular-nums
                ${s.delta >= 0 ? 'text-nx-green' : 'text-nx-red'}
              `}
            >
              {s.delta >= 0 ? '+' : ''}{s.delta.toFixed(1)}%
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
```

Note the named container `@container/dashboard` — children scope to it via `@md/dashboard:`, which is essential when nesting containers (e.g. a card inside the dashboard that has its *own* `@container`).

### 3. Article layout breakpoints from container width

```tsx
// components/article-body.tsx
interface ArticleProps {
  title: string
  body: string
  meta: { author: string; readTime: string; date: string }
}

export function ArticleBody({ title, body, meta }: ArticleProps) {
  return (
    <article className="@container bg-nx-base text-nx-fg">
      <div
        className="
          mx-auto
          px-4
          py-8
          max-w-prose
          @lg:max-w-2xl
          @2xl:max-w-3xl
        "
      >
        <h1
          className="
            font-display
            text-3xl
            @md:text-4xl
            @2xl:text-5xl
            leading-tight
            tracking-tight
          "
        >
          {title}
        </h1>
        <div
          className="
            mt-3
            flex flex-col gap-1
            @sm:flex-row @sm:gap-4
            text-nx-fg-muted text-sm
          "
        >
          <span>{meta.author}</span>
          <span>{meta.readTime}</span>
          <span>{meta.date}</span>
        </div>
        <div
          className="
            mt-8
            text-base @lg:text-lg
            leading-relaxed
            text-nx-fg-muted
            [&_p]:mb-4
          "
          dangerouslySetInnerHTML={{ __html: body }}
        />
      </div>
    </article>
  )
}
```

### 4. Composer toolbar that condenses

```tsx
// components/composer-toolbar.tsx
'use client'

import { Bold, Italic, Code, Link2, ListOrdered, Quote, Image as Img } from 'lucide-react'

const TOOLS = [
  { icon: Bold,        label: 'Bold' },
  { icon: Italic,      label: 'Italic' },
  { icon: Code,        label: 'Code' },
  { icon: Link2,       label: 'Link' },
  { icon: ListOrdered, label: 'List' },
  { icon: Quote,       label: 'Quote' },
  { icon: Img,         label: 'Image' },
] as const

export function ComposerToolbar() {
  return (
    <div className="@container bg-nx-elevated border-b border-nx-border-subtle">
      <div
        className="
          flex items-center gap-1
          px-3 py-2
          @md:gap-2 @md:px-4
        "
      >
        {TOOLS.map(({ icon: Icon, label }) => (
          <button
            key={label}
            type="button"
            aria-label={label}
            className="
              flex items-center gap-1.5
              px-2 py-1.5
              text-nx-fg-muted
              hover:text-nx-fg hover:bg-nx-hover
              rounded-nx-sm
              transition-colors duration-150
              motion-reduce:transition-none
            "
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            {/* Label only when toolbar container is wide enough */}
            <span className="hidden @md:inline text-xs font-medium">{label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
```

### 5. Email-style two-pane that becomes single-column

```tsx
// components/inbox.tsx
interface Email {
  id: string
  from: string
  subject: string
  preview: string
  unread: boolean
}

export function Inbox({ emails }: { emails: Email[] }) {
  return (
    <div className="@container bg-nx-base h-screen">
      <div
        className="
          h-full
          grid
          grid-cols-1
          @lg:grid-cols-[20rem_1fr]
          divide-y divide-nx-border-subtle
          @lg:divide-y-0 @lg:divide-x
        "
      >
        {/* List pane */}
        <ul className="overflow-y-auto">
          {emails.map(e => (
            <li
              key={e.id}
              className="
                p-4
                border-b border-nx-border-subtle last:border-b-0
                hover:bg-nx-hover
                cursor-pointer
              "
            >
              <div className="flex items-baseline justify-between gap-2">
                <span
                  className={`
                    text-sm truncate
                    ${e.unread ? 'text-nx-fg font-semibold' : 'text-nx-fg-muted'}
                  `}
                >
                  {e.from}
                </span>
                {e.unread && (
                  <span className="size-1.5 rounded-full bg-nx-violet shrink-0" />
                )}
              </div>
              <p className="mt-1 text-sm text-nx-fg truncate">{e.subject}</p>
              <p className="mt-0.5 text-xs text-nx-fg-subtle truncate">
                {e.preview}
              </p>
            </li>
          ))}
        </ul>
        {/* Reader pane — only visible at container >= lg */}
        <div className="hidden @lg:block p-8 overflow-y-auto">
          <p className="text-nx-fg-muted">Select a message to read.</p>
        </div>
      </div>
    </div>
  )
}
```

---

## Modern CSS Patterns (v4 power features)

These are CSS platform features — not v4 inventions — but v4 stops getting in the way. With `@theme` carrying tokens and `@utility` carrying custom utilities, you can drop into modern CSS without losing utility-first ergonomics.

### 1. View Transitions for route changes (CSS-only)

```css
/* globals.css — after @theme */
@layer base {
  /* Browser triggers when document.startViewTransition() runs (Next.js App
     Router does this automatically on route change in supported browsers). */
  ::view-transition-old(root),
  ::view-transition-new(root) {
    animation-duration: 280ms;
    animation-timing-function: var(--ease-nx-out);
  }
  ::view-transition-old(root) {
    animation-name: fade-out;
  }
  ::view-transition-new(root) {
    animation-name: fade-in;
  }

  @keyframes fade-out {
    to { opacity: 0; }
  }
  @keyframes fade-in {
    from { opacity: 0; transform: translateY(4px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @media (prefers-reduced-motion: reduce) {
    ::view-transition-old(root),
    ::view-transition-new(root) {
      animation: none;
    }
  }
}
```

```tsx
// app/layout.tsx — Next.js App Router
import './globals.css'

export const viewport = {
  themeColor: '#000000',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-nx-base text-nx-fg">{children}</body>
    </html>
  )
}
// Next 14.1+ enables view transitions automatically when supported.
// VERIFY: feature flag name in your Next.js version — has been `experimental.viewTransition`
// at various points.
```

### 2. Scroll-driven animations (no JS, no IntersectionObserver)

```css
/* globals.css */
@layer utilities {
  /* Fade-in as element enters viewport */
  .nx-scroll-fade {
    animation: nx-scroll-fade linear both;
    animation-timeline: view();
    animation-range: entry 0% cover 30%;
  }

  /* Progress bar tied to root scroll */
  .nx-scroll-progress {
    animation: nx-grow linear both;
    animation-timeline: scroll(root);
  }

  @keyframes nx-scroll-fade {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes nx-grow {
    from { transform: scaleX(0); }
    to   { transform: scaleX(1); }
  }

  @media (prefers-reduced-motion: reduce) {
    .nx-scroll-fade,
    .nx-scroll-progress { animation: none; opacity: 1; transform: none; }
  }
}
```

```tsx
// components/scroll-progress.tsx
export function ScrollProgress() {
  return (
    <div
      role="progressbar"
      aria-label="Reading progress"
      className="
        fixed top-0 inset-x-0 z-50
        h-0.5
        origin-left
        bg-gradient-to-r from-nx-violet via-nx-cyan to-nx-pink
        nx-scroll-progress
      "
    />
  )
}
```

### 3. `:has()` conditional styling

```tsx
// components/form-field.tsx
interface FieldProps {
  label: string
  type?: string
  required?: boolean
  hint?: string
  error?: string
}

export function FormField({ label, type = 'text', required, hint, error }: FieldProps) {
  return (
    <label
      className="
        flex flex-col gap-1.5
        text-sm
        text-nx-fg-muted
        // :has() lets the wrapper restyle itself when its input is invalid/focused
        [&:has(input:focus)]:text-nx-fg
        [&:has(input[aria-invalid='true'])]:text-nx-red
      "
    >
      <span>
        {label}
        {required && <span className="ml-0.5 text-nx-red">*</span>}
      </span>
      <input
        type={type}
        required={required}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={error ? `${label}-error` : undefined}
        className="
          bg-nx-elevated
          border border-nx-border
          rounded-nx-md
          px-3 py-2
          text-nx-fg text-base
          outline-none
          transition-colors duration-150
          focus:border-nx-violet
          focus:ring-2 focus:ring-nx-violet/30
          aria-invalid:border-nx-red
          aria-invalid:focus:ring-nx-red/30
          motion-reduce:transition-none
        "
      />
      {hint && !error && (
        <span className="text-xs text-nx-fg-subtle">{hint}</span>
      )}
      {error && (
        <span id={`${label}-error`} className="text-xs text-nx-red">
          {error}
        </span>
      )}
    </label>
  )
}
```

### 4. `@starting-style` for entrance animations on mount

```css
/* globals.css */
@layer components {
  /* Smooth entrance whenever the element is first added to the DOM
     (works with React conditional rendering, popovers, dialogs). */
  .nx-popover {
    opacity: 1;
    transform: translateY(0);
    transition:
      opacity 220ms var(--ease-nx-out),
      transform 220ms var(--ease-nx-out);
  }

  @starting-style {
    .nx-popover {
      opacity: 0;
      transform: translateY(-6px);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .nx-popover { transition: none; }
    @starting-style { .nx-popover { opacity: 1; transform: none; } }
  }
}
```

```tsx
// components/popover.tsx
'use client'

import { useState } from 'react'

export function Popover({ trigger, children }: { trigger: React.ReactNode; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="
          px-3 py-1.5
          rounded-nx-md
          bg-nx-elevated
          border border-nx-border
          text-nx-fg text-sm
          hover:bg-nx-hover
        "
      >
        {trigger}
      </button>
      {open && (
        <div
          role="dialog"
          className="
            nx-popover
            absolute top-full left-0 mt-2 z-50
            min-w-56
            bg-nx-overlay
            border border-nx-border-subtle
            rounded-nx-lg
            shadow-2xl shadow-black/60
            p-3
          "
        >
          {children}
        </div>
      )}
    </div>
  )
}
```

### 5. Subgrid for nested grids that line up

```tsx
// components/feature-table.tsx
interface FeatureRow {
  feature: string
  starter: string
  pro: string
  enterprise: string
}

const FEATURES: FeatureRow[] = [
  { feature: 'Projects',     starter: '3',         pro: 'Unlimited', enterprise: 'Unlimited' },
  { feature: 'Collaborators', starter: '1',         pro: '10',        enterprise: 'Unlimited' },
  { feature: 'API calls / mo', starter: '10,000',   pro: '500,000',   enterprise: 'Custom' },
  { feature: 'SLA',           starter: '—',         pro: '99.5%',     enterprise: '99.99%' },
]

export function FeatureTable() {
  return (
    <div
      className="
        grid
        grid-cols-[2fr_1fr_1fr_1fr]
        gap-y-2
        bg-nx-surface
        border border-nx-border-subtle
        rounded-nx-lg
        p-6
      "
    >
      {FEATURES.map((row, i) => (
        <div
          key={row.feature}
          className="
            col-span-full
            grid grid-cols-subgrid
            py-3
            border-t border-nx-border-subtle
            first:border-t-0
            text-sm
          "
        >
          <span className="text-nx-fg font-medium">{row.feature}</span>
          <span className="text-nx-fg-muted tabular-nums">{row.starter}</span>
          <span className="text-nx-fg-muted tabular-nums">{row.pro}</span>
          <span className="text-nx-fg-muted tabular-nums">{row.enterprise}</span>
        </div>
      ))}
    </div>
  )
}
```

### 6. `color-mix()` for runtime variants

```tsx
// components/dynamic-tag.tsx
interface TagProps {
  label: string
  // any CSS color — token, hex, oklch, etc.
  color: string
}

export function DynamicTag({ label, color }: TagProps) {
  return (
    <span
      className="
        inline-flex items-center
        px-2.5 py-0.5
        text-[11px] font-medium
        rounded-full
        border
      "
      style={{
        // Mix author-provided color with surface token at runtime
        color,
        background: `color-mix(in oklab, ${color} 12%, var(--df-bg-elevated))`,
        borderColor: `color-mix(in oklab, ${color} 35%, transparent)`,
      }}
    >
      {label}
    </span>
  )
}

// Usage — no need to predefine bg/border tokens for every brand color
// <DynamicTag label="React" color="var(--df-neon-cyan)" />
// <DynamicTag label="Beta"  color="#10b981" />
```

### 7. `light-dark()` (when you do need a light surface)

Darkforge is dark-only by default, but documentation pages, print views, and embedded widgets sometimes need both. `light-dark()` resolves based on `color-scheme`.

```css
:root {
  /* Tell the UA both schemes are valid for opted-in elements */
  color-scheme: dark;
}

.nx-printable {
  color-scheme: light dark; /* required for light-dark() to evaluate */
  background: light-dark(#ffffff, var(--df-bg-base));
  color:      light-dark(#0a0a0a, var(--df-text-primary));
  border:     1px solid light-dark(#e5e7eb, var(--df-border-default));
}
```

```tsx
// components/printable-receipt.tsx
export function PrintableReceipt({ children }: { children: React.ReactNode }) {
  return (
    <article
      className="
        nx-printable
        rounded-nx-md
        p-6
        max-w-md
      "
    >
      {children}
    </article>
  )
}
```

---

## Cascade Layers in Darkforge

v4 uses CSS cascade layers internally — `@layer theme, base, components, utilities` — and yours stack predictably on top. Darkforge uses three layers in app code:

```css
/* globals.css */
@import "tailwindcss";

/* @theme already lives in Tailwind's `theme` layer — declared above */

@layer base {
  /* Resets, html/body styling, font-loading, focus-visible defaults */
  html {
    background: var(--df-bg-base);
    color: var(--df-text-primary);
    -webkit-font-smoothing: antialiased;
  }
  body {
    font-family: var(--font-sans);
    min-height: 100dvh;
  }
  :focus-visible {
    outline: 2px solid var(--df-border-focus);
    outline-offset: 2px;
    border-radius: var(--radius-nx-sm);
  }
  ::selection {
    background: color-mix(in oklab, var(--df-neon-violet) 30%, transparent);
    color: var(--df-text-primary);
  }
}

@layer components {
  /* High-level component classes that compose tokens.
     Anything an app might want to override should live here, not in utilities. */
  .nx-page {
    background: var(--df-bg-base);
    min-height: 100dvh;
  }
  .nx-card {
    background: var(--df-bg-surface);
    border: 1px solid var(--df-border-subtle);
    border-radius: var(--radius-nx-lg);
    padding: 1.5rem;
  }
}

/* Custom utilities go via @utility (next section), which Tailwind places in
   the `utilities` layer for you. Don't hand-write @layer utilities — use @utility. */
```

### Why layer order matters

1. `theme` — from `@theme`. Defines variables. Always wins on tokens.
2. `base` — resets and root styling. Easily overridden.
3. `components` — multi-property classes (`.nx-card`). Lower priority than utilities.
4. `utilities` — single-purpose classes (`bg-nx-violet`, custom `@utility`). Always win against components.

The practical rule: define a `.nx-card` in `@layer components` and let consumers override `bg-nx-elevated` on the same element via a class without `!important`.

---

## Glass Effect Utilities (v4 syntax)

In v3 these were plain classes in global CSS. In v4 we promote them to `@utility` so they automatically gain variant support — `hover:nx-glass`, `md:nx-glass-lg`, `motion-reduce:nx-glass`, all work for free.

```css
/* globals.css — after @theme */

@utility nx-glass {
  background: var(--df-glass-bg);
  border: 1px solid var(--df-glass-border);
  -webkit-backdrop-filter: blur(12px) saturate(180%);
          backdrop-filter: blur(12px) saturate(180%);
}

@utility nx-glass-md {
  background: var(--df-glass-bg-md);
  border: 1px solid var(--df-glass-border-md);
  -webkit-backdrop-filter: blur(20px) saturate(200%);
          backdrop-filter: blur(20px) saturate(200%);
}

@utility nx-glass-lg {
  background: var(--df-glass-bg-lg);
  border: 1px solid var(--df-glass-border-md);
  -webkit-backdrop-filter: blur(32px) saturate(220%);
          backdrop-filter: blur(32px) saturate(220%);
}

/* Frosted overlay (good for modal backdrops) */
@utility nx-frost {
  background: rgba(0, 0, 0, 0.55);
  -webkit-backdrop-filter: blur(8px);
          backdrop-filter: blur(8px);
}

/* Edge-lit border that pulses on hover */
@utility nx-edge {
  position: relative;
  border: 1px solid var(--df-border-default);
  transition:
    border-color 250ms var(--ease-nx-out),
    box-shadow   250ms var(--ease-nx-out);
}
@utility nx-edge-hover {
  border-color: color-mix(in oklab, var(--df-neon-violet) 50%, transparent);
  box-shadow: var(--shadow-glow-violet);
}

@media (prefers-reduced-motion: reduce) {
  .nx-edge { transition: none; }
}
```

### Usage

```tsx
// components/glass-panel.tsx
export function GlassPanel({ children }: { children: React.ReactNode }) {
  return (
    <section
      className="
        nx-glass-md
        rounded-nx-xl
        p-8
        text-nx-fg
        hover:nx-glass-lg
        motion-reduce:transition-none
        transition-all duration-300 ease-nx-out
      "
    >
      {children}
    </section>
  )
}
```

```tsx
// components/modal.tsx
'use client'

import { useEffect } from 'react'

export function Modal({ open, onClose, children }: {
  open: boolean
  onClose: () => void
  children: React.ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      <button
        aria-label="Close modal"
        onClick={onClose}
        className="absolute inset-0 nx-frost"
      />
      <div
        className="
          relative
          nx-glass-lg
          rounded-nx-xl
          p-8
          max-w-lg w-[calc(100%-2rem)]
          shadow-2xl shadow-black/80
          text-nx-fg
        "
      >
        {children}
      </div>
    </div>
  )
}
```

---

## Neon Glow Utilities (v4 syntax)

Same `@utility` approach — but glow utilities also benefit from variant composition (`hover:glow-violet-lg`, `focus-visible:glow-cyan`, `group-hover:glow-pink`).

```css
/* globals.css — after @theme */

@utility glow-violet    { box-shadow: var(--shadow-glow-violet); }
@utility glow-cyan      { box-shadow: var(--shadow-glow-cyan); }
@utility glow-pink      { box-shadow: var(--shadow-glow-pink); }
@utility glow-green     { box-shadow: var(--shadow-glow-green); }
@utility glow-violet-lg { box-shadow: var(--shadow-glow-violet-lg); }

/* Inset glow (for buttons that should look pressed/active) */
@utility glow-inset-violet {
  box-shadow:
    inset 0 0 0 1px color-mix(in oklab, var(--df-neon-violet) 60%, transparent),
    inset 0 0 16px color-mix(in oklab, var(--df-neon-violet) 25%, transparent);
}

/* Pulsing glow that breathes — pairs with --animate-glow-pulse */
@utility glow-violet-pulse {
  animation: var(--animate-glow-pulse);
  box-shadow: var(--shadow-glow-violet);
}

@media (prefers-reduced-motion: reduce) {
  .glow-violet-pulse { animation: none; }
}
```

### Usage

```tsx
// components/neon-button.tsx
'use client'

interface NeonButtonProps {
  children: React.ReactNode
  variant?: 'violet' | 'cyan' | 'pink' | 'green'
  onClick?: () => void
  type?: 'button' | 'submit'
}

const VARIANT_CLASSES = {
  violet: 'bg-nx-violet text-nx-fg-inverse hover:glow-violet-lg focus-visible:glow-violet-lg',
  cyan:   'bg-nx-cyan   text-nx-fg-inverse hover:glow-cyan       focus-visible:glow-cyan',
  pink:   'bg-nx-pink   text-nx-fg-inverse hover:glow-pink       focus-visible:glow-pink',
  green:  'bg-nx-green  text-nx-fg-inverse hover:glow-green      focus-visible:glow-green',
} as const

export function NeonButton({ children, variant = 'violet', onClick, type = 'button' }: NeonButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`
        ${VARIANT_CLASSES[variant]}
        glow-${variant}
        inline-flex items-center justify-center
        px-5 py-2.5
        rounded-nx-md
        font-medium text-sm
        transition-all duration-200 ease-nx-out
        hover:-translate-y-px
        active:translate-y-0 active:glow-inset-${variant}
        focus-visible:outline-none
        motion-reduce:transition-none motion-reduce:hover:translate-y-0
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
    >
      {children}
    </button>
  )
}
```

```tsx
// components/spotlight-card.tsx — group-hover glow on a child
export function SpotlightCard({ title, body }: { title: string; body: string }) {
  return (
    <article
      className="
        group relative
        bg-nx-surface
        border border-nx-border-subtle
        rounded-nx-lg
        p-6
        overflow-hidden
        transition-colors duration-300 ease-nx-out
        hover:border-nx-violet/40
      "
    >
      {/* Decorative orb that lights up on hover */}
      <span
        aria-hidden
        className="
          absolute -top-12 -right-12
          size-32
          rounded-full
          bg-nx-violet/40
          blur-2xl
          opacity-0
          transition-opacity duration-500 ease-nx-out
          group-hover:opacity-100
          motion-reduce:transition-none
        "
      />
      <h3 className="relative text-nx-fg font-semibold text-lg">{title}</h3>
      <p className="relative mt-2 text-nx-fg-muted text-sm leading-relaxed">{body}</p>
    </article>
  )
}
```

---

## Common Gotchas

### 1. `postcss.config.js` is now one line (or absent)

v3 required a multi-plugin config (`tailwindcss`, `autoprefixer`, `postcss-import`). v4 ships its own bundler.

```js
// postcss.config.mjs — v4
export default { plugins: { '@tailwindcss/postcss': {} } }
```

If you're on Vite, **delete `postcss.config.js` entirely** and rely on `@tailwindcss/vite`. Leaving the postcss plugin around alongside the Vite plugin can produce double-compilation. // VERIFY: confirmed on 4.0; behaviour stable through 4.1.

### 2. `tailwind.config.ts` is deprecated, not banned

`@theme` is the new home for tokens. But `@config "../tailwind.config.ts"` still works as a migration aid — keep your old plugins running while you port. Don't tell teams the old config is unusable; it's just *unidiomatic* in v4.

### 3. Content paths are auto-detected

v4 globs your project automatically (respecting `.gitignore`). The old `content: ['./src/**/*.{ts,tsx,mdx}']` array is gone. To add a path *outside* the project root:

```css
@import "tailwindcss";
@source "../../packages/ui/src/**/*.{ts,tsx}";
```

To exclude a path: there is no first-class exclude — keep generated/built files inside `.gitignore` or move them outside the scanned tree. // VERIFY: as of 4.1, an explicit `@source not "..."` syntax may be available in newer minors.

### 4. Tailwind extension / IDE lag

The official `bradlc.vscode-tailwindcss` extension caught up to v4 in early 2025, but older versions show false "unknown at-rule" errors on `@theme`, `@utility`, `@custom-variant`. Update to the latest extension and add to `.vscode/settings.json`:

```jsonc
{
  "tailwindCSS.experimental.classRegex": [
    ["className=\"([^\"]*)\"", "([^\\s]+)"]
  ],
  "files.associations": { "*.css": "tailwindcss" }
}
```

### 5. Plugin ecosystem is fragmented

Many v3 plugins (`tailwindcss-animate`, `@tailwindcss/typography`, `@tailwindcss/forms`) were updated, but third-party plugins lag. **First-party plugins are now built in or replaced**:

- Container queries — built in (no plugin needed). Drop `@tailwindcss/container-queries`.
- Animations for shadcn — use `tw-animate-css` (the v4-compatible successor to `tailwindcss-animate`). // VERIFY: shadcn docs reference `tw-animate-css` for v4 setups.
- Typography — `@tailwindcss/typography` ships a v4 build.

When in doubt, check the plugin's README for v4 support before adding it.

### 6. Arbitrary values still work, but tokens are preferred

```tsx
// Still valid:
<div className="bg-[var(--df-bg-surface)] rounded-[16px]" />

// Preferred (after @theme bridge):
<div className="bg-nx-surface rounded-nx-lg" />
```

The arbitrary-value escape hatch is fine for one-offs, but every time you reach for it you're missing a chance to add a token to `@theme`.

### 7. `prefers-reduced-motion` has a built-in variant

Use `motion-reduce:` and `motion-safe:` rather than hand-rolling `@media (prefers-reduced-motion)` queries on every animated element:

```tsx
<div className="
  animate-float
  motion-reduce:animate-none
" />

<button className="
  transition-transform duration-200
  hover:-translate-y-px
  motion-reduce:transition-none
  motion-reduce:hover:translate-y-0
" />
```

For complex CSS-only animations defined in `@layer utilities` or `@utility`, still write the explicit `@media (prefers-reduced-motion: reduce)` guard inside the CSS — the `motion-reduce:` variant only helps on Tailwind class chains.

### 8. `@theme inline` for tokens that should *not* emit a CSS variable

Default `@theme` registers a CSS variable *and* generates utilities. `@theme inline { ... }` only generates utilities — useful when the value should never be runtime-overridable (e.g. a hard-coded animation timing). // VERIFY: `inline` modifier is documented at `tailwindcss.com/docs/theme#using-inline-values`.

```css
@theme inline {
  --animate-spin-slow: spin 8s linear infinite;
}
```

### 9. Dark variant configuration

Darkforge is dark-only — set `color-scheme: dark` on `:root` and apply `class="dark"` on `<html>` if you ever want to opt-out individual subtrees with `class="light"`. The v4-idiomatic way to define the dark variant is `@custom-variant`:

```css
@custom-variant dark (&:is(.dark *));
```

This replaces v3's `darkMode: 'class'` config option entirely.

### 10. `hover:` on touch devices

v4 keeps the v3 default of only applying `hover:` styles when the device actually supports hover (via `@media (hover: hover)`). Don't fight it — use `active:` or `aria-pressed:` for touch states.

```tsx
<button className="
  bg-nx-elevated
  hover:bg-nx-hover
  active:bg-nx-overlay
  aria-pressed:bg-nx-violet aria-pressed:text-nx-fg-inverse
" />
```

---

## Cross-References

- `00-dark-tokens.md` — the canonical DF token system. The `@theme` block in this file *bridges* those tokens; it does not replace them. Both files must coexist.
- `08-shadcn-dark.md` — shadcn under v4 with `@custom-variant dark` and `tw-animate-css`. The `@theme` bridge here is the prerequisite.
- `17-skeleton-system.md` — skeleton classes use `nx-shimmer` and `nx-pulse` keyframes; declare them once in this file's `@theme` + global keyframes section.
- `01-framer-motion.md`, `02-gsap.md` — when motion exceeds CSS transitions, hand off to JS animation. Keep `motion-reduce:` guards on the wrapper class.
- `04-aceternity.md`, `05-magicui.md`, `06-skiper-ui.md`, `07-reactbits.md` — paste-in component libraries. All consume `bg-nx-*`, `text-nx-*`, `rounded-nx-*` utilities generated by *this* file's `@theme`.
- `03-threejs-r3f.md` — canvas backgrounds sit *behind* utility-styled DOM. The `@layer base` body rules in this file ensure the canvas inherits `var(--df-bg-base)`.

This file is foundational. Every Darkforge component generated by Claude Code in a v4 project assumes the `@theme` block above is present in `globals.css`.
