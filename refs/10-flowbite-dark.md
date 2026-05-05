# Darkforge — Flowbite Dark Reference
Flowbite is a Tailwind-native component library shipped in four flavours: vanilla JS (`flowbite`), React (`flowbite-react`), Vue (`flowbite-vue`), and Svelte (`flowbite-svelte`). Dark mode is first-class — every component is built against Tailwind's `dark:` variant from day one — which makes it a clean fit for AMOLED retheming. Darkforge reaches for Flowbite when projects are enterprise-shaped (admin panels, SaaS dashboards, marketing pages with forms) and want pre-wired widgets without hand-rolling Radix.

## Contents

- [Source-of-truth caveat](#source-of-truth-caveat)
- [Install / Setup](#install-setup)
  - [Vanilla (HTML / non-React frameworks)](#vanilla-html-non-react-frameworks)
  - [React](#react)
  - [Tailwind plugin — v3 vs v4](#tailwind-plugin-v3-vs-v4)
  - [Dark mode toggle](#dark-mode-toggle)
- [DF Token Bridge](#df-token-bridge)
  - [DF → Flowbite ramp mapping (documentation table)](#nx-flowbite-ramp-mapping-documentation-table)
  - [DF :root tokens — paste FIRST](#nx-root-tokens-paste-first)
  - [Tailwind theme — palette ramps (the documentation token block)](#tailwind-theme-palette-ramps-the-documentation-token-block)
  - [DF glow utility classes (escape-hatch layer)](#nx-glow-utility-classes-escape-hatch-layer)
  - [`flowbite-react` ThemeConfig](#flowbite-react-themeconfig)
- [Components: Dark Variants](#components-dark-variants)
  - [1. Button group (variants + sizes + icon button)](#1-button-group-variants-sizes-icon-button)
  - [2. Card (default, image, profile)](#2-card-default-image-profile)
  - [3. Modal (with backdrop + form)](#3-modal-with-backdrop-form)
  - [4. Dropdown](#4-dropdown)
  - [5. Navbar (sticky, with active state)](#5-navbar-sticky-with-active-state)
  - [6. Sidebar (collapsible groups)](#6-sidebar-collapsible-groups)
  - [7. Forms (input, select, textarea, file upload, toggle)](#7-forms-input-select-textarea-file-upload-toggle)
  - [8. Toast / Alert (4 colour variants)](#8-toast-alert-4-colour-variants)
  - [9. Tabs](#9-tabs)
  - [10. Stepper / Timeline](#10-stepper-timeline)
  - [11. Pagination](#11-pagination)
  - [12. Tooltip + Popover](#12-tooltip-popover)
- [Pitfalls](#pitfalls)
- [Cross-References](#cross-references)

---

## Source-of-truth caveat

This document is written against `flowbite ^2.5` and `flowbite-react ^0.10` as of the assistant's training cutoff (Jan 2026). Sandbox restrictions blocked live doc retrieval (context7 + WebFetch denied), so any code marked `// VERIFY:` is API-shaped and worth a sanity check against current docs at <https://flowbite.com/docs/> and <https://flowbite-react.com/> before shipping. The `flowbite-react` project went through a theming rewrite around v0.10 (provider → `createTheme()` + `<ThemeConfig>`); if your project is older, downgrade the snippets accordingly.

DF tokens are sourced from `references/00-dark-tokens.md` — never hardcode hex values in component output; bridge through Tailwind's theme. The only place hex literals appear in this file is the **DF → Flowbite ramp mapping table** (documentation only) and the **palette ramp definition block** that re-states those values for the Tailwind plugin. Every concrete CSS class, component example, and `theme={{...}}` slot uses `var(--df-*)` — never a hex literal.

---

## Install / Setup

Flowbite ships JS behaviours for vanilla projects (dropdowns, modals, tabs etc. bind via `data-*` attributes) and a separate React package that wraps the same components as proper RSC-aware TSX. Pick one — never both in the same app, the data-attribute initialiser will fight the React state.

### Vanilla (HTML / non-React frameworks)

```bash
npm install flowbite
# or
pnpm add flowbite
```

```ts
// src/main.ts (or app entry — Vite, Astro, vanilla)
import 'flowbite' // initialises data-attribute components ONCE at app start
```

If you're using a framework that does client-side route changes (Astro view transitions, Hotwire Turbo, vanilla SPA routers), call `initFlowbite()` after each navigation, not just on first load:

```ts
import { initFlowbite } from 'flowbite'

document.addEventListener('astro:page-load', () => initFlowbite())
// or for Turbo:
document.addEventListener('turbo:load', () => initFlowbite())
```

### React

```bash
npm install flowbite-react
# flowbite-react bundles flowbite as a peer; do NOT also `import 'flowbite'`
```

`flowbite-react` re-implements every component as TSX with React state — there is no data-attribute scanner to run. Importing the vanilla `flowbite` package on top causes duplicate event listeners and bizarre flicker on dropdowns.

### Tailwind plugin — v3 vs v4

**Tailwind v3** (config-as-JS):

```ts
// tailwind.config.ts
import type { Config } from 'tailwindcss'
import flowbitePlugin from 'flowbite/plugin' // VERIFY: flowbite ^2.5

export default {
  darkMode: 'class',
  content: [
    './src/**/*.{ts,tsx,mdx,html}',
    './node_modules/flowbite/**/*.js',
    './node_modules/flowbite-react/lib/**/*.js', // only if using React variant
  ],
  plugins: [flowbitePlugin],
} satisfies Config
```

**Tailwind v4** (config-in-CSS):

```css
/* src/app/globals.css */
@import "tailwindcss";
@plugin "flowbite/plugin"; /* VERIFY: flowbite v2.5+ ships v4-compatible plugin */

@source "./node_modules/flowbite/**/*.js";
@source "./node_modules/flowbite-react/lib/**/*.js";

@custom-variant dark (&:where(.dark, .dark *));
```

### Dark mode toggle

Flowbite reads `dark:` variants off Tailwind's strategy — `class` is the only sensible setting for AMOLED, since `media` strategy can't be force-toggled.

```tsx
// components/theme-toggle.tsx
'use client'
import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('nx-theme', theme)
  }, [theme])

  useEffect(() => {
    const stored = localStorage.getItem('nx-theme') as 'dark' | 'light' | null
    if (stored) setTheme(stored)
  }, [])

  return (
    <button
      type="button"
      onClick={() => setTheme(t => (t === 'dark' ? 'light' : 'dark'))}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      className="rounded-[var(--df-radius-md)] border border-[var(--df-border-default)] bg-[var(--df-bg-elevated)] p-2 text-[var(--df-text-primary)] transition-colors hover:bg-[var(--df-bg-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--df-border-focus)]"
    >
      {theme === 'dark' ? 'Light' : 'Dark'}
    </button>
  )
}
```

Darkforge defaults `<html className="dark">` SSR-rendered and only flips on explicit user input — there is no "system" mode by design (AMOLED-first).

---

## DF Token Bridge

Flowbite components read from Tailwind's standard color scales (`primary-50..950`, `green-`, `red-`, etc.) at compile time — `<Button color="primary">` ultimately resolves to classes like `bg-primary-700`, `hover:bg-primary-800`, `focus:ring-primary-300`. To make every Flowbite component AMOLED-DF without rewriting them, override these palette ramps so the `400` anchor of each color is the corresponding DF neon hue.

### DF → Flowbite ramp mapping (documentation table)

| Flowbite ramp | Anchor slot | DF token              | Resolved hex (docs only) |
|---------------|-------------|-----------------------|--------------------------|
| `primary`     | `400`       | `--df-neon-violet`    | `#a78bfa`                |
| `cyan`        | `400`       | `--df-neon-cyan`      | `#22d3ee`                |
| `pink`        | `400`       | `--df-neon-pink`      | `#f472b6`                |
| `green`       | `400`       | `--df-neon-green`     | `#4ade80`                |
| `amber`       | `400`       | `--df-neon-amber`     | `#fbbf24`                |
| `red`         | `400`       | `--df-neon-red`       | `#f87171`                |
| `nx.base`     | n/a         | `--df-bg-base`        | `#000000`                |
| `nx.surface`  | n/a         | `--df-bg-surface`     | `#080808`                |
| `nx.elevated` | n/a         | `--df-bg-elevated`    | `#111111`                |
| `nx.overlay`  | n/a         | `--df-bg-overlay`     | `#1a1a1a`                |
| `nx.muted`    | n/a         | `--df-bg-muted`       | `#222222`                |
| `nx.hover`    | n/a         | `--df-bg-hover`       | `#2a2a2a`                |

> The hex column is for documentation only. Every CSS rule, `theme={{...}}` slot, and Tailwind class in this file references `var(--df-*)` instead. The ramp-definition block below is the single place where Flowbite's compile-time scale needs literal stops; treat it as the **documentation token table** mentioned in the source-of-truth caveat.

### DF :root tokens — paste FIRST

Flowbite's plugin reads the resolved hex at compile time, but every override class downstream reads `var(--df-*)` at runtime. The DF token block must be in scope before any component renders:

```css
/* src/app/globals.css — paste BEFORE @plugin "flowbite/plugin" */
:root {
  /* AMOLED black scale */
  --df-bg-base:       #000000;
  --df-bg-surface:    #080808;
  --df-bg-elevated:   #111111;
  --df-bg-overlay:    #1a1a1a;
  --df-bg-muted:      #222222;
  --df-bg-hover:      #2a2a2a;

  /* Neon accents */
  --df-neon-violet:   #a78bfa;
  --df-neon-cyan:     #22d3ee;
  --df-neon-pink:     #f472b6;
  --df-neon-green:    #4ade80;
  --df-neon-amber:    #fbbf24;
  --df-neon-red:      #f87171;

  /* Glow shadows */
  --df-glow-violet:    0 0 20px rgba(167, 139, 250, 0.35);
  --df-glow-violet-lg: 0 0 40px rgba(167, 139, 250, 0.45);
  --df-glow-cyan:      0 0 20px rgba(34, 211, 238, 0.35);
  --df-glow-pink:      0 0 20px rgba(244, 114, 182, 0.35);
  --df-glow-green:     0 0 20px rgba(74, 222, 128, 0.35);
  --df-glow-red:       0 0 20px rgba(248, 113, 113, 0.35);

  /* Text */
  --df-text-primary:   #ffffff;
  --df-text-secondary: #a1a1aa;
  --df-text-muted:     #52525b;
  --df-text-inverse:   #000000;

  /* Borders */
  --df-border-subtle:  rgba(255, 255, 255, 0.05);
  --df-border-default: rgba(255, 255, 255, 0.09);
  --df-border-strong:  rgba(255, 255, 255, 0.16);
  --df-border-focus:   rgba(167, 139, 250, 0.5);

  /* Radius */
  --df-radius-sm: 6px;
  --df-radius-md: 10px;
  --df-radius-lg: 16px;

  /* Z-index scale */
  --df-z-dropdown: 100;
  --df-z-sticky:   200;
  --df-z-overlay:  300;
  --df-z-modal:    400;
  --df-z-toast:    500;
}
```

### Tailwind theme — palette ramps (the documentation token block)

This is the **only** block in the file with literal hex stops; Flowbite's compile-time scale needs them. The `400` slot of each ramp is anchored on the matching DF neon token's resolved value (cross-referenced in the table above), and the surface `nx.*` block re-states the AMOLED ladder for components that opt into DF-prefixed Tailwind classes:

```ts
// tailwind.config.ts (v3) — paste into the v4 @theme block for v4
import type { Config } from 'tailwindcss'
import flowbitePlugin from 'flowbite/plugin'

export default {
  darkMode: 'class',
  content: [
    './src/**/*.{ts,tsx,mdx,html}',
    './node_modules/flowbite/**/*.js',
    './node_modules/flowbite-react/lib/**/*.js',
  ],
  theme: {
    extend: {
      colors: {
        // Flowbite reads `primary-*` for buttons, focus rings, links.
        // The `400` slot matches --df-neon-violet so `<Button color="primary">`
        // renders the AMOLED violet anchor. Other stops are tonal neighbours
        // for hover/disabled states the plugin emits.
        primary: {
          50:  '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa', // <-- DF violet anchor (= --df-neon-violet)
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065',
        },
        // Flowbite color="info"
        cyan: {
          400: '#22d3ee', // <-- DF cyan anchor (= --df-neon-cyan)
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
        },
        // Flowbite color="pink" (notifications, highlights)
        pink: {
          400: '#f472b6', // <-- DF pink (= --df-neon-pink)
          500: '#ec4899',
          600: '#db2777',
        },
        // Flowbite color="success"
        green: {
          400: '#4ade80', // <-- DF green (= --df-neon-green)
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        },
        // Flowbite color="warning"
        amber: {
          400: '#fbbf24', // <-- DF amber (= --df-neon-amber)
          500: '#f59e0b',
          600: '#d97706',
        },
        // Flowbite color="failure"
        red: {
          400: '#f87171', // <-- DF red (= --df-neon-red)
          500: '#ef4444',
          600: '#dc2626',
        },
        // Surface scale — used by DF-flavoured Flowbite overrides.
        // Mirrors the --df-bg-* ladder so `bg-nx-surface` ≡ `bg-[var(--df-bg-surface)]`.
        nx: {
          base:     '#000000', // = --df-bg-base
          surface:  '#080808', // = --df-bg-surface
          elevated: '#111111', // = --df-bg-elevated
          overlay:  '#1a1a1a', // = --df-bg-overlay
          muted:    '#222222', // = --df-bg-muted
          hover:    '#2a2a2a', // = --df-bg-hover
        },
      },
      boxShadow: {
        // Map directly to --df-glow-* tokens — editing 00-dark-tokens.md propagates.
        'glow-violet': 'var(--df-glow-violet)',
        'glow-cyan':   'var(--df-glow-cyan)',
        'glow-pink':   'var(--df-glow-pink)',
        'glow-green':  'var(--df-glow-green)',
        'glow-red':    'var(--df-glow-red)',
      },
      borderRadius: {
        // Alias DF radii into Tailwind so utilities stay short.
        'nx-sm': 'var(--df-radius-sm)',
        'nx-md': 'var(--df-radius-md)',
        'nx-lg': 'var(--df-radius-lg)',
      },
    },
  },
  plugins: [flowbitePlugin],
} satisfies Config
```

### DF glow utility classes (escape-hatch layer)

Flowbite components don't ship a glow utility, and a number of `theme={{...}}` slots can't reference `box-shadow` via Tailwind's arbitrary-value syntax cleanly. Add a thin layer of DF-token classes that pair with any Flowbite element. **Each rule reads from a `var(--df-glow-*)` token** so editing `00-dark-tokens.md` retunes them automatically:

```css
/* src/app/globals.css — append after the Tailwind layers */

/* Violet glow — primary CTA hover, focus ring on Buttons */
.nx-glow-primary    { box-shadow: var(--df-glow-violet); }
.nx-glow-primary-lg { box-shadow: var(--df-glow-violet-lg); }
.nx-glow-cyan       { box-shadow: var(--df-glow-cyan); }
.nx-glow-pink       { box-shadow: var(--df-glow-pink); }
.nx-glow-green      { box-shadow: var(--df-glow-green); }
.nx-glow-red        { box-shadow: var(--df-glow-red); }

/* Glassmorphism overlay — pairs with Modal, Drawer backdrops */
.nx-glass {
  background: var(--df-glass-bg);
  border: 1px solid var(--df-glass-border);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
}
```

### `flowbite-react` ThemeConfig

For `flowbite-react` v0.10+, also wrap the app once with the theme provider. The provider re-themes built-in components at runtime (e.g. dark backgrounds for `<Card>`, focus colours for `<Button>`). Every override below pipes through `var(--df-*)`:

```tsx
// app/layout.tsx (Next.js) or src/main.tsx (Vite)
import { ThemeConfig, createTheme } from 'flowbite-react' // VERIFY: flowbite-react v0.10+

const nxTheme = createTheme({
  // Flowbite-react theme schema — overrides per-component class lists.
  // Below: only the most-touched surfaces. Extend as needed.
  // VERIFY: slot names ('root', 'content', 'inner', 'field') are stable in v0.10+
  card: {
    root: {
      base: 'flex rounded-[var(--df-radius-lg)] border border-[var(--df-border-default)] bg-[var(--df-bg-surface)] text-[var(--df-text-primary)] shadow-none',
    },
  },
  modal: {
    content: {
      base: 'relative h-full w-full p-4 md:h-auto',
      inner: 'relative flex max-h-[90dvh] flex-col rounded-[var(--df-radius-lg)] border border-[var(--df-border-default)] bg-[var(--df-bg-overlay)] text-[var(--df-text-primary)] shadow-[0_20px_80px_rgba(0,0,0,0.6)]',
    },
  },
  navbar: {
    root: {
      base: 'border-b border-[var(--df-border-subtle)] bg-[var(--df-bg-surface)]/80 text-[var(--df-text-primary)] backdrop-blur-xl',
    },
  },
  textInput: {
    field: {
      input: {
        base: 'block w-full rounded-[var(--df-radius-md)] border border-[var(--df-border-default)] bg-[var(--df-bg-elevated)] text-[var(--df-text-primary)] placeholder:text-[var(--df-text-muted)] focus:border-[var(--df-border-focus)] focus:ring-2 focus:ring-[var(--df-border-focus)]',
      },
    },
  },
  badge: {
    root: {
      color: {
        // VERIFY: badge slot keys per color in v0.10+
        primary: 'bg-[var(--df-neon-violet)]/15 text-[var(--df-neon-violet)]',
        info:    'bg-[var(--df-neon-cyan)]/15   text-[var(--df-neon-cyan)]',
        success: 'bg-[var(--df-neon-green)]/15  text-[var(--df-neon-green)]',
        warning: 'bg-[var(--df-neon-amber)]/15  text-[var(--df-neon-amber)]',
        failure: 'bg-[var(--df-neon-red)]/15    text-[var(--df-neon-red)]',
        pink:    'bg-[var(--df-neon-pink)]/15   text-[var(--df-neon-pink)]',
      },
    },
  },
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[var(--df-bg-base)] text-[var(--df-text-primary)] antialiased">
        <ThemeConfig theme={nxTheme}>{children}</ThemeConfig>
      </body>
    </html>
  )
}
```

> All component examples below assume the bridge above is wired. If you skip the bridge, components will still render — but with Flowbite's default white/gray, not AMOLED.

---

## Components: Dark Variants

Each example is production-ready: full TSX, named props, no `any`, mobile-first, AMOLED, accessibility hooks. `'use client'` is included where the component owns state. Every Tailwind class that paints a color, border, radius, or shadow uses `var(--df-*)` via the arbitrary-value bracket syntax — no raw hex literals slip into component output.

### 1. Button group (variants + sizes + icon button)

```tsx
// components/nx/button-group-demo.tsx
import { Button, ButtonGroup } from 'flowbite-react'
import { Download, ChevronDown, Sparkles } from 'lucide-react'

export function ButtonGroupDemo() {
  return (
    <div className="flex flex-col gap-6">
      {/* Solid violet primary */}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          color="primary"
          className="bg-[var(--df-neon-violet)] text-[var(--df-text-inverse)] shadow-[var(--df-glow-violet)] hover:bg-[var(--df-neon-violet)]/90 hover:shadow-[var(--df-glow-violet-lg)] focus:ring-2 focus:ring-[var(--df-border-focus)] transition-shadow"
        >
          <Sparkles className="mr-2 h-4 w-4" aria-hidden="true" />
          Generate
        </Button>

        <Button
          color="gray"
          className="border-[var(--df-border-default)] bg-[var(--df-bg-elevated)] text-[var(--df-text-primary)] hover:bg-[var(--df-bg-hover)]"
        >
          Cancel
        </Button>

        <Button
          color="failure"
          className="bg-[var(--df-neon-red)]/10 text-[var(--df-neon-red)] hover:bg-[var(--df-neon-red)]/20 focus:ring-2 focus:ring-[var(--df-neon-red)]/40"
        >
          Delete account
        </Button>
      </div>

      {/* Sizes */}
      <div className="flex flex-wrap items-center gap-3">
        <Button size="xs" color="primary" className="bg-[var(--df-neon-violet)] text-[var(--df-text-inverse)] hover:bg-[var(--df-neon-violet)]/90">Extra small</Button>
        <Button size="sm" color="primary" className="bg-[var(--df-neon-violet)] text-[var(--df-text-inverse)] hover:bg-[var(--df-neon-violet)]/90">Small</Button>
        <Button size="md" color="primary" className="bg-[var(--df-neon-violet)] text-[var(--df-text-inverse)] hover:bg-[var(--df-neon-violet)]/90">Medium</Button>
        <Button size="lg" color="primary" className="bg-[var(--df-neon-violet)] text-[var(--df-text-inverse)] hover:bg-[var(--df-neon-violet)]/90">Large</Button>
      </div>

      {/* Grouped */}
      <ButtonGroup>
        <Button color="gray" className="border-[var(--df-border-default)] bg-[var(--df-bg-elevated)] text-[var(--df-text-primary)] hover:bg-[var(--df-bg-hover)]">
          <Download className="mr-2 h-4 w-4" aria-hidden="true" />
          Export
        </Button>
        <Button color="gray" className="border-[var(--df-border-default)] bg-[var(--df-bg-elevated)] text-[var(--df-text-primary)] hover:bg-[var(--df-bg-hover)]">
          CSV
        </Button>
        <Button color="gray" className="border-[var(--df-border-default)] bg-[var(--df-bg-elevated)] text-[var(--df-text-primary)] hover:bg-[var(--df-bg-hover)]">
          <ChevronDown className="h-4 w-4" aria-label="More export options" />
        </Button>
      </ButtonGroup>
    </div>
  )
}
```

### 2. Card (default, image, profile)

```tsx
// components/nx/cards-demo.tsx
import { Card, Avatar, Button } from 'flowbite-react'
import { ArrowUpRight } from 'lucide-react'

export function CardsDemo() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {/* Default */}
      <Card className="border-[var(--df-border-default)] bg-[var(--df-bg-surface)] text-[var(--df-text-primary)] transition-colors hover:border-[var(--df-neon-violet)]/40 hover:shadow-[var(--df-glow-violet)]">
        <h5 className="text-xl font-semibold tracking-tight text-[var(--df-text-primary)]">
          Real-time analytics
        </h5>
        <p className="text-sm leading-relaxed text-[var(--df-text-secondary)]">
          Stream events as they happen. p99 dashboard latency under 80ms with edge-caching.
        </p>
        <Button
          color="primary"
          className="bg-[var(--df-neon-violet)] text-[var(--df-text-inverse)] shadow-[var(--df-glow-violet)] hover:bg-[var(--df-neon-violet)]/90 hover:shadow-[var(--df-glow-violet-lg)] transition-shadow"
        >
          View metrics
          <ArrowUpRight className="ml-2 h-4 w-4" aria-hidden="true" />
        </Button>
      </Card>

      {/* Image */}
      <Card
        className="overflow-hidden border-[var(--df-border-default)] bg-[var(--df-bg-surface)] text-[var(--df-text-primary)]"
        imgAlt="Aurora over a mountain ridge at night"
        imgSrc="/images/aurora-ridge.jpg"
      >
        <h5 className="text-lg font-semibold text-[var(--df-text-primary)]">
          Northern Lights — March 2026
        </h5>
        <p className="text-sm text-[var(--df-text-secondary)]">
          Captured at 65.0° N over the Lyngen Alps. Shutter 8s, ISO 800.
        </p>
      </Card>

      {/* Profile */}
      <Card className="border-[var(--df-border-default)] bg-[var(--df-bg-surface)] text-[var(--df-text-primary)]">
        <div className="flex flex-col items-center gap-3 pb-4">
          <Avatar
            img="/avatars/mira.jpg"
            alt="Mira Tanaka"
            size="xl"
            rounded
            bordered
            className="ring-2 ring-[var(--df-neon-violet)]/40"
          />
          <h5 className="text-lg font-semibold text-[var(--df-text-primary)]">Mira Tanaka</h5>
          <span className="text-sm text-[var(--df-text-secondary)]">Staff Platform Engineer</span>
          <div className="mt-2 flex gap-2">
            <Button
              size="sm"
              color="primary"
              className="bg-[var(--df-neon-violet)] text-[var(--df-text-inverse)] hover:bg-[var(--df-neon-violet)]/90"
            >
              Follow
            </Button>
            <Button
              size="sm"
              color="gray"
              className="border-[var(--df-border-default)] bg-[var(--df-bg-elevated)] text-[var(--df-text-primary)] hover:bg-[var(--df-bg-hover)]"
            >
              Message
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
```

### 3. Modal (with backdrop + form)

```tsx
// components/nx/invite-modal.tsx
'use client'
import { useState } from 'react'
import { Modal, Button, Label, TextInput, Select } from 'flowbite-react'
import { UserPlus } from 'lucide-react'

interface InviteModalProps {
  workspaceName: string
  onInvite?: (payload: { email: string; role: 'viewer' | 'editor' | 'admin' }) => void
}

export function InviteModal({ workspaceName, onInvite }: InviteModalProps) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'viewer' | 'editor' | 'admin'>('editor')

  const submit = () => {
    onInvite?.({ email, role })
    setOpen(false)
    setEmail('')
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    submit()
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        color="primary"
        className="bg-[var(--df-neon-violet)] text-[var(--df-text-inverse)] shadow-[var(--df-glow-violet)] hover:bg-[var(--df-neon-violet)]/90 hover:shadow-[var(--df-glow-violet-lg)] transition-shadow"
      >
        <UserPlus className="mr-2 h-4 w-4" aria-hidden="true" />
        Invite teammate
      </Button>

      <Modal
        show={open}
        onClose={() => setOpen(false)}
        size="md"
        dismissible
        // VERIFY: Modal `theme` slot keys (`content.inner`, `header`, `body`, `footer`) for flowbite-react v0.10+
        theme={{
          content: {
            inner: 'relative flex max-h-[90dvh] flex-col rounded-[var(--df-radius-lg)] border border-[var(--df-border-default)] bg-[var(--df-bg-overlay)] text-[var(--df-text-primary)]',
          },
        }}
      >
        <Modal.Header className="border-b border-[var(--df-border-subtle)] !bg-transparent !text-[var(--df-text-primary)]">
          Invite to {workspaceName}
        </Modal.Header>
        <Modal.Body className="!bg-transparent">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <Label htmlFor="invite-email" className="!text-[var(--df-text-secondary)]">
                Work email
              </Label>
              <TextInput
                id="invite-email"
                type="email"
                required
                placeholder="ada@lovelace.dev"
                value={email}
                onChange={e => setEmail(e.currentTarget.value)}
                className="[&_input]:!bg-[var(--df-bg-elevated)] [&_input]:!text-[var(--df-text-primary)] [&_input]:!border-[var(--df-border-default)] [&_input:focus]:!border-[var(--df-border-focus)] [&_input:focus]:!ring-2 [&_input:focus]:!ring-[var(--df-border-focus)] [&_input::placeholder]:!text-[var(--df-text-muted)]"
              />
            </div>
            <div>
              <Label htmlFor="invite-role" className="!text-[var(--df-text-secondary)]">
                Role
              </Label>
              <Select
                id="invite-role"
                value={role}
                onChange={e => setRole(e.currentTarget.value as typeof role)}
                className="[&_select]:!bg-[var(--df-bg-elevated)] [&_select]:!text-[var(--df-text-primary)] [&_select]:!border-[var(--df-border-default)] [&_select:focus]:!border-[var(--df-border-focus)]"
              >
                <option value="viewer">Viewer — read only</option>
                <option value="editor">Editor — can change content</option>
                <option value="admin">Admin — full access</option>
              </Select>
            </div>
          </form>
        </Modal.Body>
        <Modal.Footer className="border-t border-[var(--df-border-subtle)] !bg-transparent">
          <Button
            color="primary"
            onClick={() => handleSubmit({ preventDefault: () => {} } as React.FormEvent<HTMLFormElement>)}
            className="bg-[var(--df-neon-violet)] text-[var(--df-text-inverse)] shadow-[var(--df-glow-violet)] hover:bg-[var(--df-neon-violet)]/90 hover:shadow-[var(--df-glow-violet-lg)] transition-shadow"
          >
            Send invite
          </Button>
          <Button
            color="gray"
            onClick={() => setOpen(false)}
            className="border-[var(--df-border-default)] bg-[var(--df-bg-elevated)] text-[var(--df-text-primary)] hover:bg-[var(--df-bg-hover)]"
          >
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}
```

### 4. Dropdown

```tsx
// components/nx/account-dropdown.tsx
'use client'
import { Dropdown, Avatar } from 'flowbite-react'
import { LogOut, Settings, CreditCard, LifeBuoy } from 'lucide-react'

interface AccountDropdownProps {
  user: { name: string; email: string; avatar: string }
  onSignOut: () => void
}

export function AccountDropdown({ user, onSignOut }: AccountDropdownProps) {
  return (
    <Dropdown
      arrowIcon={false}
      inline
      label={<Avatar img={user.avatar} alt={user.name} rounded size="sm" />}
      // VERIFY: Dropdown `theme` shape (`floating.base`, `content`) is stable in v0.10+
      theme={{
        floating: {
          base: 'z-[var(--df-z-dropdown)] min-w-[14rem] divide-y divide-[var(--df-border-subtle)] rounded-[var(--df-radius-lg)] border border-[var(--df-border-default)] bg-[var(--df-bg-elevated)] shadow-[0_8px_32px_rgba(0,0,0,0.6)]',
        },
        content: 'py-1 text-sm text-[var(--df-text-primary)]',
      }}
    >
      <Dropdown.Header className="!bg-transparent">
        <span className="block text-sm text-[var(--df-text-primary)]">{user.name}</span>
        <span className="block truncate text-sm text-[var(--df-text-secondary)]">{user.email}</span>
      </Dropdown.Header>
      <Dropdown.Item icon={Settings} className="!text-[var(--df-text-primary)] hover:!bg-[var(--df-bg-hover)]">
        Account settings
      </Dropdown.Item>
      <Dropdown.Item icon={CreditCard} className="!text-[var(--df-text-primary)] hover:!bg-[var(--df-bg-hover)]">
        Billing
      </Dropdown.Item>
      <Dropdown.Item icon={LifeBuoy} className="!text-[var(--df-text-primary)] hover:!bg-[var(--df-bg-hover)]">
        Help center
      </Dropdown.Item>
      <Dropdown.Divider className="!border-[var(--df-border-subtle)]" />
      <Dropdown.Item
        icon={LogOut}
        onClick={onSignOut}
        className="!text-[var(--df-neon-red)] hover:!bg-[var(--df-bg-hover)] hover:!text-[var(--df-neon-red)]"
      >
        Sign out
      </Dropdown.Item>
    </Dropdown>
  )
}
```

### 5. Navbar (sticky, with active state)

```tsx
// components/nx/app-navbar.tsx
'use client'
import { Navbar, Button } from 'flowbite-react'
import { usePathname } from 'next/navigation'

interface NavLink { href: string; label: string }

const links: NavLink[] = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/projects',  label: 'Projects'  },
  { href: '/team',      label: 'Team'      },
  { href: '/billing',   label: 'Billing'   },
]

export function AppNavbar() {
  const pathname = usePathname()
  return (
    <Navbar
      fluid
      className="sticky top-0 z-[var(--df-z-sticky)] border-b border-[var(--df-border-subtle)] !bg-[var(--df-bg-surface)]/75 px-4 py-3 backdrop-blur-xl"
    >
      <Navbar.Brand href="/" className="gap-2">
        <span
          aria-hidden="true"
          className="inline-block h-7 w-7 rounded-[var(--df-radius-md)] bg-gradient-to-br from-[var(--df-neon-violet)] to-[var(--df-neon-cyan)] shadow-[var(--df-glow-violet)]"
        />
        <span className="self-center whitespace-nowrap text-lg font-semibold text-[var(--df-text-primary)]">
          Darkforge
        </span>
      </Navbar.Brand>

      <div className="flex items-center gap-3 md:order-2">
        <Button
          size="sm"
          color="primary"
          className="bg-[var(--df-neon-violet)] text-[var(--df-text-inverse)] shadow-[var(--df-glow-violet)] hover:bg-[var(--df-neon-violet)]/90 hover:shadow-[var(--df-glow-violet-lg)] transition-shadow"
        >
          Upgrade
        </Button>
        <Navbar.Toggle aria-label="Toggle navigation" className="!text-[var(--df-text-primary)] hover:!bg-[var(--df-bg-hover)]" />
      </div>

      <Navbar.Collapse>
        {links.map(link => {
          const active = pathname === link.href
          return (
            <Navbar.Link
              key={link.href}
              href={link.href}
              active={active}
              aria-current={active ? 'page' : undefined}
              className={
                active
                  ? '!bg-transparent !text-[var(--df-neon-violet)] [text-shadow:0_0_18px_rgba(167,139,250,0.4)]'
                  : '!text-[var(--df-text-secondary)] hover:!bg-[var(--df-bg-hover)] hover:!text-[var(--df-text-primary)]'
              }
            >
              {link.label}
            </Navbar.Link>
          )
        })}
      </Navbar.Collapse>
    </Navbar>
  )
}
```

### 6. Sidebar (collapsible groups)

```tsx
// components/nx/app-sidebar.tsx
'use client'
import { Sidebar } from 'flowbite-react'
import { LayoutDashboard, Users, ShoppingCart, BarChart3, Settings, Inbox } from 'lucide-react'

export function AppSidebar() {
  return (
    <Sidebar
      aria-label="Primary navigation"
      className="h-[100dvh] [&>div]:!bg-[var(--df-bg-surface)] [&>div]:!border-r [&>div]:!border-[var(--df-border-subtle)] [&>div]:!text-[var(--df-text-primary)]"
    >
      <Sidebar.Items>
        <Sidebar.ItemGroup>
          <Sidebar.Item
            href="/dashboard"
            icon={LayoutDashboard}
            className="!text-[var(--df-text-secondary)] hover:!bg-[var(--df-bg-hover)] hover:!text-[var(--df-text-primary)]"
          >
            Dashboard
          </Sidebar.Item>

          <Sidebar.Item
            href="/inbox"
            icon={Inbox}
            label="12"
            labelColor="primary"
            // VERIFY: Sidebar.Item label-bubble selector — this `[data-testid]` selector is the recall
            className="!text-[var(--df-text-secondary)] hover:!bg-[var(--df-bg-hover)] hover:!text-[var(--df-text-primary)] [&_span[data-testid='flowbite-sidebar-item-label']]:!bg-[var(--df-neon-violet)]/15 [&_span[data-testid='flowbite-sidebar-item-label']]:!text-[var(--df-neon-violet)]"
          >
            Inbox
          </Sidebar.Item>

          <Sidebar.Collapse
            icon={ShoppingCart}
            label="Commerce"
            className="!text-[var(--df-text-secondary)] hover:!bg-[var(--df-bg-hover)] hover:!text-[var(--df-text-primary)]"
          >
            <Sidebar.Item href="/products" className="!text-[var(--df-text-secondary)] hover:!text-[var(--df-text-primary)] hover:!bg-[var(--df-bg-hover)]">
              Products
            </Sidebar.Item>
            <Sidebar.Item href="/orders" className="!text-[var(--df-text-secondary)] hover:!text-[var(--df-text-primary)] hover:!bg-[var(--df-bg-hover)]">
              Orders
            </Sidebar.Item>
            <Sidebar.Item href="/customers" className="!text-[var(--df-text-secondary)] hover:!text-[var(--df-text-primary)] hover:!bg-[var(--df-bg-hover)]">
              Customers
            </Sidebar.Item>
          </Sidebar.Collapse>

          <Sidebar.Item
            href="/team"
            icon={Users}
            className="!text-[var(--df-text-secondary)] hover:!bg-[var(--df-bg-hover)] hover:!text-[var(--df-text-primary)]"
          >
            Team
          </Sidebar.Item>
          <Sidebar.Item
            href="/analytics"
            icon={BarChart3}
            className="!text-[var(--df-text-secondary)] hover:!bg-[var(--df-bg-hover)] hover:!text-[var(--df-text-primary)]"
          >
            Analytics
          </Sidebar.Item>
        </Sidebar.ItemGroup>

        <Sidebar.ItemGroup>
          <Sidebar.Item
            href="/settings"
            icon={Settings}
            className="!text-[var(--df-text-secondary)] hover:!bg-[var(--df-bg-hover)] hover:!text-[var(--df-text-primary)]"
          >
            Settings
          </Sidebar.Item>
        </Sidebar.ItemGroup>
      </Sidebar.Items>
    </Sidebar>
  )
}
```

### 7. Forms (input, select, textarea, file upload, toggle)

```tsx
// components/nx/profile-form.tsx
'use client'
import { useState } from 'react'
import { Label, TextInput, Textarea, Select, FileInput, ToggleSwitch, Button } from 'flowbite-react'
import { Mail, AtSign } from 'lucide-react'

interface ProfileFormState {
  username: string
  email: string
  bio: string
  timezone: string
  marketingOptIn: boolean
}

export function ProfileForm() {
  const [form, setForm] = useState<ProfileFormState>({
    username: '',
    email: '',
    bio: '',
    timezone: 'UTC',
    marketingOptIn: false,
  })

  // Reusable input override class — every TextInput in the form pipes through these DF vars.
  const inputClass =
    '[&_input]:!bg-[var(--df-bg-elevated)] [&_input]:!text-[var(--df-text-primary)] [&_input]:!border-[var(--df-border-default)] [&_input]:placeholder:!text-[var(--df-text-muted)] [&_input:focus]:!border-[var(--df-border-focus)] [&_input:focus]:!ring-2 [&_input:focus]:!ring-[var(--df-border-focus)]'

  return (
    <form
      className="mx-auto flex max-w-xl flex-col gap-5 rounded-[var(--df-radius-lg)] border border-[var(--df-border-default)] bg-[var(--df-bg-surface)] p-6 text-[var(--df-text-primary)]"
      onSubmit={e => {
        e.preventDefault()
        console.log('submit', form) // VERIFY: replace with real handler
      }}
    >
      <header>
        <h2 className="text-lg font-semibold text-[var(--df-text-primary)]">Profile</h2>
        <p className="text-sm text-[var(--df-text-secondary)]">
          This information is displayed on your public profile page.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="username" className="!text-[var(--df-text-secondary)]">Username</Label>
          <TextInput
            id="username"
            icon={AtSign}
            placeholder="ada"
            required
            value={form.username}
            onChange={e => setForm(f => ({ ...f, username: e.currentTarget.value }))}
            className={inputClass}
          />
        </div>
        <div>
          <Label htmlFor="email" className="!text-[var(--df-text-secondary)]">Email</Label>
          <TextInput
            id="email"
            type="email"
            icon={Mail}
            placeholder="ada@lovelace.dev"
            required
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.currentTarget.value }))}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="bio" className="!text-[var(--df-text-secondary)]">Short bio</Label>
        <Textarea
          id="bio"
          rows={4}
          maxLength={280}
          placeholder="Building the first analytical engine, one cog at a time."
          value={form.bio}
          onChange={e => setForm(f => ({ ...f, bio: e.currentTarget.value }))}
          className="!bg-[var(--df-bg-elevated)] !text-[var(--df-text-primary)] !border-[var(--df-border-default)] placeholder:!text-[var(--df-text-muted)] focus:!border-[var(--df-border-focus)] focus:!ring-2 focus:!ring-[var(--df-border-focus)]"
        />
        <p className="mt-1 text-xs text-[var(--df-text-muted)]">{form.bio.length} / 280</p>
      </div>

      <div>
        <Label htmlFor="timezone" className="!text-[var(--df-text-secondary)]">Timezone</Label>
        <Select
          id="timezone"
          value={form.timezone}
          onChange={e => setForm(f => ({ ...f, timezone: e.currentTarget.value }))}
          className="[&_select]:!bg-[var(--df-bg-elevated)] [&_select]:!text-[var(--df-text-primary)] [&_select]:!border-[var(--df-border-default)] [&_select:focus]:!border-[var(--df-border-focus)]"
        >
          <option value="UTC">UTC — Coordinated Universal Time</option>
          <option value="Europe/London">Europe/London (GMT)</option>
          <option value="America/New_York">America/New_York (EST)</option>
          <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
        </Select>
      </div>

      <div>
        <Label htmlFor="avatar" className="!text-[var(--df-text-secondary)]">Avatar</Label>
        <FileInput
          id="avatar"
          accept="image/png,image/jpeg,image/webp"
          helperText="PNG, JPG or WEBP up to 4MB. Square images render best."
          className="[&_input]:!bg-[var(--df-bg-elevated)] [&_input]:!text-[var(--df-text-primary)] [&_input]:!border-[var(--df-border-default)] [&_p]:!text-[var(--df-text-muted)]"
        />
      </div>

      <ToggleSwitch
        checked={form.marketingOptIn}
        onChange={value => setForm(f => ({ ...f, marketingOptIn: value }))}
        label="Send me product updates and announcements"
        // VERIFY: ToggleSwitch checkbox handle selector — `span[role='checkbox']` is recall
        className="[&_span[role='checkbox']]:!bg-[var(--df-bg-muted)] [&_span[role='checkbox'][aria-checked='true']]:!bg-[var(--df-neon-violet)] [&_label]:!text-[var(--df-text-primary)]"
      />

      <div className="flex justify-end gap-3 pt-2">
        <Button
          color="gray"
          type="button"
          className="border-[var(--df-border-default)] bg-[var(--df-bg-elevated)] text-[var(--df-text-primary)] hover:bg-[var(--df-bg-hover)]"
        >
          Discard
        </Button>
        <Button
          color="primary"
          type="submit"
          className="bg-[var(--df-neon-violet)] text-[var(--df-text-inverse)] shadow-[var(--df-glow-violet)] hover:bg-[var(--df-neon-violet)]/90 hover:shadow-[var(--df-glow-violet-lg)] transition-shadow"
        >
          Save changes
        </Button>
      </div>
    </form>
  )
}
```

### 8. Toast / Alert (4 colour variants)

```tsx
// components/nx/notifications.tsx
'use client'
import { Toast, Alert } from 'flowbite-react'
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react'

type NxToastKind = 'success' | 'error' | 'info' | 'warning'

// All values reference DF tokens — switching `--df-neon-green` retunes every toast.
const kindStyles: Record<NxToastKind, { icon: typeof CheckCircle2; color: string; bar: string; glow: string }> = {
  success: { icon: CheckCircle2,  color: 'var(--df-neon-green)',  bar: 'border-l-[var(--df-neon-green)]',  glow: 'var(--df-glow-green)' },
  error:   { icon: XCircle,       color: 'var(--df-neon-red)',    bar: 'border-l-[var(--df-neon-red)]',    glow: 'var(--df-glow-red)' },
  info:    { icon: Info,          color: 'var(--df-neon-cyan)',   bar: 'border-l-[var(--df-neon-cyan)]',   glow: 'var(--df-glow-cyan)' },
  warning: { icon: AlertTriangle, color: 'var(--df-neon-amber)',  bar: 'border-l-[var(--df-neon-amber)]',  glow: 'var(--df-glow-violet)' /* fallback */ },
}

interface NxToastProps {
  kind: NxToastKind
  title: string
  message: string
  onDismiss?: () => void
}

export function NxToast({ kind, title, message, onDismiss }: NxToastProps) {
  const { icon: Icon, color, bar, glow } = kindStyles[kind]
  return (
    <Toast
      role="status"
      aria-live="polite"
      className={`!bg-[var(--df-bg-elevated)] border border-[var(--df-border-default)] border-l-4 ${bar} !text-[var(--df-text-primary)] shadow-[0_12px_40px_rgba(0,0,0,0.6)]`}
      style={{ boxShadow: `0 12px 40px rgba(0,0,0,0.6), ${glow}` }}
    >
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-5 w-5 shrink-0" style={{ color }} aria-hidden="true" />
        <div className="flex-1">
          <p className="text-sm font-medium text-[var(--df-text-primary)]">{title}</p>
          <p className="mt-0.5 text-xs text-[var(--df-text-secondary)]">{message}</p>
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss notification"
            className="rounded-[var(--df-radius-sm)] p-1 text-[var(--df-text-muted)] transition-colors hover:bg-[var(--df-bg-hover)] hover:text-[var(--df-text-primary)]"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </Toast>
  )
}

export function NxAlertExamples() {
  return (
    <div className="flex flex-col gap-3">
      <Alert
        color="success"
        icon={CheckCircle2}
        className="!bg-[var(--df-neon-green)]/10 !text-[var(--df-neon-green)] border border-[var(--df-neon-green)]/30"
      >
        <span className="font-medium text-[var(--df-neon-green)]">Deployment succeeded.</span>{' '}
        <span className="text-[var(--df-text-secondary)]">Build #4821 is live on production.</span>
      </Alert>
      <Alert
        color="failure"
        icon={XCircle}
        className="!bg-[var(--df-neon-red)]/10 !text-[var(--df-neon-red)] border border-[var(--df-neon-red)]/30"
      >
        <span className="font-medium text-[var(--df-neon-red)]">Webhook delivery failed.</span>{' '}
        <span className="text-[var(--df-text-secondary)]">3 retries exhausted — check the destination URL.</span>
      </Alert>
      <Alert
        color="info"
        icon={Info}
        className="!bg-[var(--df-neon-cyan)]/10 !text-[var(--df-neon-cyan)] border border-[var(--df-neon-cyan)]/30"
      >
        <span className="font-medium text-[var(--df-neon-cyan)]">Heads up.</span>{' '}
        <span className="text-[var(--df-text-secondary)]">Maintenance window scheduled for Apr 30, 02:00–04:00 UTC.</span>
      </Alert>
      <Alert
        color="warning"
        icon={AlertTriangle}
        className="!bg-[var(--df-neon-amber)]/10 !text-[var(--df-neon-amber)] border border-[var(--df-neon-amber)]/30"
      >
        <span className="font-medium text-[var(--df-neon-amber)]">Quota at 87%.</span>{' '}
        <span className="text-[var(--df-text-secondary)]">Upgrade your plan or expect throttling next billing cycle.</span>
      </Alert>
    </div>
  )
}
```

### 9. Tabs

```tsx
// components/nx/settings-tabs.tsx
'use client'
import { Tabs } from 'flowbite-react'
import { User, Shield, Bell, Receipt } from 'lucide-react'

export function SettingsTabs() {
  return (
    <Tabs
      aria-label="Settings sections"
      style="underline"
      // VERIFY: Tabs `theme` slot path — `tablist.tabitem.variant.underline.active.{on,off}` is recall
      theme={{
        tablist: {
          base: 'flex border-b border-[var(--df-border-subtle)]',
          tabitem: {
            base: 'flex items-center gap-2 px-4 py-3 text-sm font-medium text-[var(--df-text-secondary)] transition-colors hover:text-[var(--df-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--df-border-focus)]',
            variant: {
              underline: {
                active: {
                  on:  'border-b-2 border-[var(--df-neon-violet)] !text-[var(--df-neon-violet)]',
                  off: 'border-b-2 border-transparent',
                },
              },
            },
          },
        },
      }}
    >
      <Tabs.Item active title="Profile" icon={User}>
        <div className="rounded-[var(--df-radius-lg)] border border-[var(--df-border-default)] bg-[var(--df-bg-surface)] p-6 text-sm text-[var(--df-text-secondary)]">
          Profile fields go here. Pair this tab with the <code className="rounded-[var(--df-radius-sm)] bg-[var(--df-bg-elevated)] px-1.5 py-0.5 font-mono text-xs text-[var(--df-neon-violet)]">ProfileForm</code> component.
        </div>
      </Tabs.Item>
      <Tabs.Item title="Security" icon={Shield}>
        <div className="rounded-[var(--df-radius-lg)] border border-[var(--df-border-default)] bg-[var(--df-bg-surface)] p-6 text-sm text-[var(--df-text-secondary)]">
          2FA, sessions, recovery codes.
        </div>
      </Tabs.Item>
      <Tabs.Item title="Notifications" icon={Bell}>
        <div className="rounded-[var(--df-radius-lg)] border border-[var(--df-border-default)] bg-[var(--df-bg-surface)] p-6 text-sm text-[var(--df-text-secondary)]">
          Per-channel preferences.
        </div>
      </Tabs.Item>
      <Tabs.Item title="Billing" icon={Receipt}>
        <div className="rounded-[var(--df-radius-lg)] border border-[var(--df-border-default)] bg-[var(--df-bg-surface)] p-6 text-sm text-[var(--df-text-secondary)]">
          Invoices, payment method, plan.
        </div>
      </Tabs.Item>
    </Tabs>
  )
}
```

### 10. Stepper / Timeline

```tsx
// components/nx/onboarding-timeline.tsx
import { Timeline } from 'flowbite-react'
import { Check, ArrowRight } from 'lucide-react'

interface TimelineStep {
  title: string
  date: string
  description: string
  status: 'done' | 'current' | 'upcoming'
}

const steps: TimelineStep[] = [
  { title: 'Account created',     date: 'Apr 21, 2026', description: 'Workspace provisioned, DNS verified.',         status: 'done' },
  { title: 'Team invited',        date: 'Apr 23, 2026', description: '7 members joined across 2 roles.',              status: 'done' },
  { title: 'First integration',   date: 'Apr 26, 2026', description: 'Slack connected, webhook firing on deploys.',   status: 'current' },
  { title: 'Production rollout',  date: 'Pending',      description: 'Promote staging build to production.',          status: 'upcoming' },
]

// Status colors all read from DF neon tokens — editing 00-dark-tokens.md retunes the timeline.
const statusStyle = {
  done:     { ring: 'ring-[var(--df-neon-green)]/30',  bg: 'bg-[var(--df-neon-green)]/10',  fg: 'var(--df-neon-green)',  icon: Check        },
  current:  { ring: 'ring-[var(--df-neon-violet)]/40', bg: 'bg-[var(--df-neon-violet)]/15', fg: 'var(--df-neon-violet)', icon: ArrowRight   },
  upcoming: { ring: 'ring-[var(--df-border-default)]', bg: 'bg-[var(--df-bg-elevated)]',    fg: 'var(--df-text-muted)',  icon: ArrowRight   },
} as const

export function OnboardingTimeline() {
  return (
    <Timeline className="border-l border-[var(--df-border-subtle)] pl-2">
      {steps.map(step => {
        const s = statusStyle[step.status]
        const Icon = s.icon
        return (
          <Timeline.Item key={step.title} className="!ml-2">
            <Timeline.Point
              icon={() => <Icon className="h-3 w-3" style={{ color: s.fg }} />}
              // VERIFY: Timeline.Point `theme.marker.icon.{wrapper,base}` slot path
              theme={{
                marker: {
                  icon: {
                    wrapper: `absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full ring-4 ${s.ring} ${s.bg}`,
                    base: '',
                  },
                },
              }}
            />
            <Timeline.Content>
              <Timeline.Time className="text-xs text-[var(--df-text-muted)]">
                {step.date}
              </Timeline.Time>
              <Timeline.Title
                className="text-sm font-semibold"
                style={{
                  color: step.status === 'upcoming'
                    ? 'var(--df-text-secondary)'
                    : 'var(--df-text-primary)',
                }}
              >
                {step.title}
              </Timeline.Title>
              <Timeline.Body className="text-sm text-[var(--df-text-secondary)]">
                {step.description}
              </Timeline.Body>
            </Timeline.Content>
          </Timeline.Item>
        )
      })}
    </Timeline>
  )
}
```

### 11. Pagination

```tsx
// components/nx/results-pagination.tsx
'use client'
import { useState } from 'react'
import { Pagination } from 'flowbite-react'

interface ResultsPaginationProps {
  totalItems: number
  pageSize?: number
  onPageChange?: (page: number) => void
}

export function ResultsPagination({ totalItems, pageSize = 20, onPageChange }: ResultsPaginationProps) {
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const handle = (p: number) => {
    setPage(p)
    onPageChange?.(p)
  }
  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, totalItems)

  return (
    <div className="flex flex-col items-center justify-between gap-4 border-t border-[var(--df-border-subtle)] pt-4 md:flex-row">
      <p className="text-xs text-[var(--df-text-secondary)]">
        Showing <span className="font-medium text-[var(--df-text-primary)]">{start}</span>–<span className="font-medium text-[var(--df-text-primary)]">{end}</span> of{' '}
        <span className="font-medium text-[var(--df-text-primary)]">{totalItems}</span> results
      </p>
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={handle}
        showIcons
        previousLabel="Previous"
        nextLabel="Next"
        // VERIFY: Pagination `theme.pages.{selector,previous,next}` slot path in v0.10+
        theme={{
          pages: {
            base: 'inline-flex items-center -space-x-px',
            selector: {
              base: 'inline-flex h-9 w-9 items-center justify-center border border-[var(--df-border-default)] bg-[var(--df-bg-elevated)] text-sm text-[var(--df-text-secondary)] hover:bg-[var(--df-bg-hover)] hover:text-[var(--df-text-primary)]',
              active: '!bg-[var(--df-neon-violet)]/15 !text-[var(--df-neon-violet)] !border-[var(--df-neon-violet)]/40',
            },
            previous: {
              base: 'rounded-l-[var(--df-radius-md)] border border-[var(--df-border-default)] bg-[var(--df-bg-elevated)] px-3 text-[var(--df-text-secondary)] hover:bg-[var(--df-bg-hover)] hover:text-[var(--df-text-primary)]',
            },
            next: {
              base: 'rounded-r-[var(--df-radius-md)] border border-[var(--df-border-default)] bg-[var(--df-bg-elevated)] px-3 text-[var(--df-text-secondary)] hover:bg-[var(--df-bg-hover)] hover:text-[var(--df-text-primary)]',
            },
          },
        }}
      />
    </div>
  )
}
```

### 12. Tooltip + Popover

```tsx
// components/nx/info-tooltip.tsx
import { Tooltip, Popover, Button } from 'flowbite-react'
import { HelpCircle, KeyRound } from 'lucide-react'

export function InfoTooltip({ label }: { label: string }) {
  return (
    <Tooltip
      content={label}
      placement="top"
      arrow={false}
      // VERIFY: Tooltip `theme.{target,base}` slot keys for flowbite-react v0.10+
      theme={{
        target: 'inline-flex',
        base: 'absolute z-[var(--df-z-overlay)] inline-block rounded-[var(--df-radius-md)] border border-[var(--df-border-default)] bg-[var(--df-bg-overlay)] px-3 py-1.5 text-xs font-medium text-[var(--df-text-primary)] shadow-[0_8px_24px_rgba(0,0,0,0.6)]',
      }}
    >
      <button
        type="button"
        aria-label={label}
        className="rounded-[var(--df-radius-sm)] text-[var(--df-text-muted)] transition-colors hover:text-[var(--df-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--df-border-focus)]"
      >
        <HelpCircle className="h-4 w-4" />
      </button>
    </Tooltip>
  )
}

export function ApiKeyPopover() {
  return (
    <Popover
      aria-labelledby="api-key-title"
      content={
        <div className="w-72 space-y-2 rounded-[var(--df-radius-lg)] border border-[var(--df-border-default)] bg-[var(--df-bg-overlay)] p-4 text-sm shadow-[0_12px_48px_rgba(0,0,0,0.7)]">
          <h4 id="api-key-title" className="font-semibold text-[var(--df-text-primary)]">
            Rotate API key?
          </h4>
          <p className="text-[var(--df-text-secondary)]">
            The previous key will be revoked in 60 seconds. Update your integrations before rotation completes.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              size="xs"
              color="primary"
              className="bg-[var(--df-neon-violet)] text-[var(--df-text-inverse)] shadow-[var(--df-glow-violet)] hover:bg-[var(--df-neon-violet)]/90"
            >
              Confirm rotate
            </Button>
          </div>
        </div>
      }
      placement="bottom-end"
      trigger="click"
    >
      <Button
        size="sm"
        color="gray"
        className="border-[var(--df-border-default)] bg-[var(--df-bg-elevated)] text-[var(--df-text-primary)] hover:bg-[var(--df-bg-hover)]"
      >
        <KeyRound className="mr-2 h-4 w-4" aria-hidden="true" />
        Rotate key
      </Button>
    </Popover>
  )
}
```

---

## Pitfalls

**1. Vanilla `flowbite` needs a one-time `import 'flowbite'` at the app entry.** Without it, `data-dropdown-toggle`, `data-modal-toggle`, etc. silently do nothing. `flowbite-react` is the opposite — never import the vanilla package alongside it; you'll get duplicate listeners on dropdowns and modals will flicker open/closed.

**2. Client-side route changes do not re-bind vanilla initialisers.** Astro view transitions, Turbo, and SPA routers replace the DOM but don't re-run module-level `import 'flowbite'` side effects. Call `initFlowbite()` in your router's `*:load` event hook (snippet shown in Install).

**3. RSC + flowbite-react.** Every flowbite-react component that uses internal state (`Modal`, `Dropdown`, `Tabs`, `Sidebar.Collapse`, `Carousel`, `Datepicker`, `Tooltip`, `Popover`) requires `'use client'`. Static-only components like `<Card>`, `<Avatar>`, `<Alert>`, `<Badge>` work as Server Components — keep them server-side to save JS bytes.

**4. Theme override precedence with Tailwind v4.** v4's class layer ordering means Flowbite's default classes can win over your component-level Tailwind unless you use `!` (important) on overriding utilities or extend Flowbite's theme via the `theme={...}` prop / `createTheme`. The component examples lean on `!bg-[var(--df-...)]` / `!text-[var(--df-...)]` for exactly this reason — the bracket arbitrary value plus the bang ensures the DF token wins over Flowbite's compiled `bg-primary-700`.

**5. `darkMode: 'class'` is non-negotiable.** Flowbite's `dark:` variants are wired to the `.dark` strategy. Setting `darkMode: 'media'` will make the AMOLED palette flicker on/off based on OS theme regardless of your toggle — and SSR will hydrate with the wrong colour.

**6. Don't double-import `'flowbite'` in monorepos.** If a shared UI package re-exports flowbite-react components, the leaf app's `import 'flowbite'` will still attach a global initialiser. Audit your import graph; you should see `'flowbite'` exactly once and only in vanilla projects.

**7. `flowbite-react` v0.10 theming rewrite.** Older docs reference a `<Flowbite theme={{...}}>` provider. v0.10+ renamed it to `<ThemeConfig>` and split theme creation into `createTheme()`. If your snippet imports from `flowbite-react` and uses `<Flowbite>`, you're on a stale version — pin to `^0.10` and migrate. `// VERIFY: flowbite-react v0.10+`

**8. Datepicker locale + timezone.** Flowbite's vanilla Datepicker uses the browser locale by default; this can produce DD/MM vs MM/DD drift across users. Pass an explicit `language` option, and store ISO 8601 strings rather than locale-formatted output. Don't forget to retheme its calendar surface — it doesn't pick up `var(--df-bg-overlay)` automatically; pass `theme={{ popup: { root: 'bg-[var(--df-bg-overlay)] border-[var(--df-border-default)]' } }}`.

**9. Form validation styling.** Flowbite ships `color="failure"` / `color="success"` props on `<TextInput>`, but the helper text colours don't auto-flip in dark mode. Override `helperText` text colour via the component's `theme={{ field: { input: { helperText: '!text-[var(--df-neon-red)]' } } }}` slot or use a separate `<p>` element with `text-[var(--df-neon-red)]`.

**10. Z-index collisions.** Flowbite tooltips default to `z-50`; modals to `z-50` too. If you stack modal-on-tooltip you'll get clipping. Use the DF z-scale (`--df-z-dropdown: 100`, `--df-z-overlay: 300`, `--df-z-modal: 400`, `--df-z-toast: 500`) and override via `theme={{ root: { base: 'z-[var(--df-z-modal)]' } }}` to avoid surprises.

**11. Ramp anchor drift.** If you change `--df-neon-violet` in `00-dark-tokens.md` but forget to update the `400` slot in the `primary` ramp here, components rendered through `<Button color="primary">` (which the plugin compiles to `bg-primary-700`/`hover:bg-primary-800`) will silently use the OLD violet — only the explicit `bg-[var(--df-neon-violet)]` overrides will retune. The mapping table at the top of DF Token Bridge is the contract; keep it in sync.

**12. `<Badge>` color slot keys.** The badge `theme.root.color.{primary,info,success,warning,failure,pink}` keys must match Flowbite's internal color enum exactly. If you add a custom color (e.g. `cyan`) without registering it in the underlying type, Flowbite falls back to `gray`. `// VERIFY: badge color enum members in flowbite-react v0.10+`

---

## Cross-References

- **`references/00-dark-tokens.md`** — All DF tokens. Override Flowbite's palette via Tailwind theme extension; never hardcode hex outside the documentation token table.
- **`references/17-skeleton-system.md`** — Pair Flowbite Tables and Cards with DF skeletons during loading; Flowbite's built-in `<Spinner>` works but doesn't preserve layout.
- **`references/08-shadcn-dark.md`** — When a project needs both libraries (Flowbite for forms, shadcn for primitives), keep them in separate folders (`components/flowbite/`, `components/ui/`) and never mix Tailwind theme overrides — pick one provider per app.
- **`references/09-daisyui-dark.md`** — Sister theme pattern: daisyUI exposes its own CSS-variable schema (`--color-primary`, `--color-base-100`) that we populate from `var(--df-*)`. Same DF→library bridge philosophy applied to a different surface.
- **`patterns/dashboard.md`** — Composes Sidebar + Navbar + Card + Pagination from this file into a full admin shell.
- **`patterns/forms.md`** — Long-form layouts, multi-step wizards, validation — extends section 7 with Zod + react-hook-form integration.
- **`patterns/navbar.md`** — Marketing vs app navbar variants; the navbar in section 5 is the app variant.
