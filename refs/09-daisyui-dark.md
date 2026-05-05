# Darkforge — DaisyUI Dark Reference
DaisyUI is a Tailwind plugin that adds semantic component classes (`btn`, `card`, `modal`, `tabs`, `navbar`, ...) on top of a CSS-variable theme system. Darkforge auto-selects this reference when `daisyui` appears in `package.json` — we ship a custom **`nexus-amoled`** theme that pipes DF tokens straight into daisy's variable layer, so every daisy class renders AMOLED black with violet/cyan/pink neon accents.

DaisyUI v5 (released April 2025, Tailwind v4 native) reworked plugin registration to live in CSS via the `@plugin` directive and overhauled theme variable names. Examples below target **daisyui v5** with **Tailwind v4**; a v3/v4-compat block is included where syntax diverged.

## Contents

- [Source-of-truth caveat](#source-of-truth-caveat)
- [Install / Setup](#install-setup)
  - [Tailwind v4 (current default — daisy v5)](#tailwind-v4-current-default-daisy-v5)
  - [Tailwind v3 (legacy projects — daisy v4)](#tailwind-v3-legacy-projects-daisy-v4)
  - [Activate the theme](#activate-the-theme)
- [Darkforge AMOLED Theme for DaisyUI](#darkforge-amoled-theme-for-daisyui)
  - [DF → DaisyUI variable mapping (the load-bearing table)](#nx-daisyui-variable-mapping-the-load-bearing-table)
  - [DF token block — paste FIRST](#df-token-block-paste-first)
  - [Theme block — Tailwind v4 + daisy v5 (preferred)](#theme-block-tailwind-v4-daisy-v5-preferred)
  - [Theme block — Tailwind v3 + daisy v4 (legacy)](#theme-block-tailwind-v3-daisy-v4-legacy)
  - [Bridging DF glow shadows into daisy](#bridging-nx-glow-shadows-into-daisy)
- [Components: Dark variants](#components-dark-variants)
  - [1. Buttons — every variant, AMOLED-correct](#1-buttons-every-variant-amoled-correct)
  - [2. Card — image, compact, glass variants](#2-card-image-compact-glass-variants)
  - [3. Modal — checkbox/htmlFor pattern (no React state)](#3-modal-checkboxhtmlfor-pattern-no-react-state)
  - [4. Drawer — mobile nav pattern (responsive)](#4-drawer-mobile-nav-pattern-responsive)
  - [5. Dropdown — pure CSS, no JS state](#5-dropdown-pure-css-no-js-state)
  - [6. Tabs — pills, bordered, lifted](#6-tabs-pills-bordered-lifted)
  - [7. Form — input, select, checkbox, toggle (all dark)](#7-form-input-select-checkbox-toggle-all-dark)
  - [8. Stats — DF violet number colors](#8-stats-nx-violet-number-colors)
  - [9. Hero — daisy `hero` with DF gradient mesh](#9-hero-daisy-hero-with-nx-gradient-mesh)
  - [10. Navbar — sticky, with DF glow on active link](#10-navbar-sticky-with-nx-glow-on-active-link)
- [Pitfalls / Common gotchas](#pitfalls-common-gotchas)
- [When to prefer DaisyUI over shadcn/ui](#when-to-prefer-daisyui-over-shadcnui)
- [Cross-References](#cross-references)

---

## Source-of-truth caveat

This reference is written from memory (training cutoff January 2026). Sandbox blocked context7 + WebFetch, so the items below are flagged `// VERIFY:` inline because daisy v5 reshuffled them and recall is most fragile here:

- **Theme variable names.** v4 used short codes (`--p`, `--b1`, `--b2`, `--b3`, `--bc`, `--n`, `--in`, `--su`, `--wa`, `--er`). v5 may have renamed to long form (`--color-primary`, `--color-base-100`, `--color-base-content`, ...). The theme block below uses the long form per v5 docs; v4 short-form fallback is shown directly underneath.
- **`form-control` wrapper.** Deprecated/removed in v5 in favor of bare `<label class="label">` + `<input class="input">` or a `fieldset`. Examples below avoid `form-control`.
- **`@plugin "daisyui/theme" {}` directive syntax.** The keyword tokens (`name`, `default`, `prefersdark`, `color-scheme`) are correct to the best of recall — verify against `daisyui.com/docs/themes` before shipping.
- **`btn-outline` composition** in v5 (variant inheritance from sibling class). Verify if a button looks wrong.
- **Tailwind v3 vs v4 plugin install.** v4 = `@plugin "daisyui"` in CSS. v3 = `require('daisyui')` in `tailwind.config.ts` plugins array. Both shown.

When any of those bites in real generation, fall back to the official daisyui.com docs and patch the affected snippet — the DF→daisy mapping itself (which colors flow where) is canonical and won't change.

---

## Install / Setup

### Tailwind v4 (current default — daisy v5)

```bash
npm i -D daisyui@latest
```

```css
/* src/app/globals.css */
@import "tailwindcss";

/* VERIFY: v5 plugin syntax — confirm against daisyui.com/docs/install */
@plugin "daisyui" {
  themes: false; /* we register a single custom theme below — disable bundled ones */
  root: ":root";
  include: ;       /* empty = include all components */
  exclude: ;       /* empty = exclude none */
  prefix: ;        /* no class prefix */
  logs: false;
}
```

### Tailwind v3 (legacy projects — daisy v4)

```ts
// tailwind.config.ts
import type { Config } from 'tailwindcss'
import daisyui from 'daisyui'

export default {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx,mdx}'],
  plugins: [daisyui],
  // @ts-expect-error daisyui extends Config at runtime
  daisyui: {
    themes: ['nexus-amoled'], // see theme block below
    darkTheme: 'nexus-amoled',
    base: true,
    styled: true,
    utils: true,
    logs: false,
  },
} satisfies Config
```

### Activate the theme

```html
<!-- app/layout.tsx — set once on <html>. No provider needed. -->
<html lang="en" data-theme="nexus-amoled">
  <body>{children}</body>
</html>
```

DaisyUI doesn't need a React provider — theme is a static CSS-variable scope tied to a `data-theme` attribute. `next-themes` is only useful if you want to swap between multiple themes; for AMOLED-only Darkforge projects, hard-code the attribute on `<html>` and skip the provider.

---

## Darkforge AMOLED Theme for DaisyUI

The bridge: daisy reads its own CSS variables; we populate those variables with DF tokens. One file, all components, AMOLED-correct.

### DF → DaisyUI variable mapping (the load-bearing table)

| DaisyUI semantic     | DaisyUI v5 var (long)      | DaisyUI v4 var (short) | DF token / value                |
|----------------------|----------------------------|------------------------|---------------------------------|
| Page background      | `--color-base-100`         | `--b1`                 | `#000000` (`--df-bg-base`)      |
| Surface / card       | `--color-base-200`         | `--b2`                 | `#080808` (`--df-bg-surface`)   |
| Elevated / input bg  | `--color-base-300`         | `--b3`                 | `#111111` (`--df-bg-elevated`)  |
| Text on base         | `--color-base-content`     | `--bc`                 | `#ffffff` (`--df-text-primary`) |
| Primary (CTAs)       | `--color-primary`          | `--p`                  | `#a78bfa` (`--df-neon-violet`)  |
| Primary text         | `--color-primary-content`  | `--pc`                 | `#000000` (`--df-text-inverse`) |
| Secondary            | `--color-secondary`        | `--s`                  | `#22d3ee` (`--df-neon-cyan`)    |
| Secondary text       | `--color-secondary-content`| `--sc`                 | `#000000`                       |
| Accent (highlights)  | `--color-accent`           | `--a`                  | `#f472b6` (`--df-neon-pink`)    |
| Accent text          | `--color-accent-content`   | `--ac`                 | `#000000`                       |
| Neutral (overlay bg) | `--color-neutral`          | `--n`                  | `#1a1a1a` (`--df-bg-overlay`)   |
| Neutral text         | `--color-neutral-content`  | `--nc`                 | `#a1a1aa` (`--df-text-secondary`) |
| Info                 | `--color-info`             | `--in`                 | `#22d3ee` (`--df-neon-cyan`)    |
| Success              | `--color-success`          | `--su`                 | `#4ade80` (`--df-neon-green`)   |
| Warning              | `--color-warning`          | `--wa`                 | `#fbbf24` (`--df-neon-amber`)   |
| Error                | `--color-error`            | `--er`                 | `#f87171` (`--df-neon-red`)     |

The hex values above are the **resolved** colors from `references/00-dark-tokens.md` — they're shown for documentation only. Every concrete CSS rule in the rest of this file uses `var(--df-*)`, never the hex literal.

### DF token block — paste FIRST

DaisyUI's theme block reads `var(--df-*)` references, so the DF tokens must be defined in `:root` before the `@plugin "daisyui/theme" {}` directive runs. This block is identical to `references/00-dark-tokens.md` and is shown here for self-containment:

```css
/* src/app/globals.css — paste BEFORE the @plugin blocks */
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

  /* Glass */
  --df-glass-bg:      rgba(255, 255, 255, 0.04);
  --df-glass-bg-md:   rgba(255, 255, 255, 0.07);
  --df-glass-border:  rgba(255, 255, 255, 0.08);

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
  --df-radius-xs: 4px;
  --df-radius-sm: 6px;
  --df-radius-md: 10px;
  --df-radius-lg: 16px;
  --df-radius-xl: 24px;
}
```

### Theme block — Tailwind v4 + daisy v5 (preferred)

Every value below is `var(--df-*)`. DaisyUI's variable names are kept (its API requires them), but they're populated entirely from DF tokens:

```css
/* src/app/globals.css — paste BELOW the :root DF block AND below @plugin "daisyui" {} */

/* VERIFY: v5 theme directive — confirm @plugin "daisyui/theme" {} grammar
   against daisyui.com/docs/themes before shipping. */
@plugin "daisyui/theme" {
  name: "nexus-amoled";
  default: true;          /* applied when no data-theme is set */
  prefersdark: true;      /* used when prefers-color-scheme: dark */
  color-scheme: dark;

  /* --- Base scale (AMOLED black ladder) --- */
  --color-base-100: var(--df-bg-base);
  --color-base-200: var(--df-bg-surface);
  --color-base-300: var(--df-bg-elevated);
  --color-base-content: var(--df-text-primary);

  /* --- Brand: violet primary --- */
  --color-primary: var(--df-neon-violet);
  --color-primary-content: var(--df-text-inverse);

  /* --- Cyan secondary (links, info data) --- */
  --color-secondary: var(--df-neon-cyan);
  --color-secondary-content: var(--df-text-inverse);

  /* --- Pink accent (badges, highlights) --- */
  --color-accent: var(--df-neon-pink);
  --color-accent-content: var(--df-text-inverse);

  /* --- Neutral (overlay surface, modal bg) --- */
  --color-neutral: var(--df-bg-overlay);
  --color-neutral-content: var(--df-text-secondary);

  /* --- Status --- */
  --color-info: var(--df-neon-cyan);
  --color-info-content: var(--df-text-inverse);
  --color-success: var(--df-neon-green);
  --color-success-content: var(--df-text-inverse);
  --color-warning: var(--df-neon-amber);
  --color-warning-content: var(--df-text-inverse);
  --color-error: var(--df-neon-red);
  --color-error-content: var(--df-text-inverse);

  /* --- Radius (mapped to DF scale) --- */
  --radius-selector: var(--df-radius-sm);   /* checkboxes, toggles, radios */
  --radius-field:    var(--df-radius-md);   /* inputs, selects, buttons */
  --radius-box:      var(--df-radius-lg);   /* cards, modals, drawers */

  /* --- Sizing --- */
  --size-selector: 0.25rem;
  --size-field:    0.25rem;
  --border:        1px;
  --depth:         1;        /* shadow intensity (0..1) */
  --noise:         0;        /* background noise (0..1) */
}
```

### Theme block — Tailwind v3 + daisy v4 (legacy)

The v3 block is a JS object literal that daisy's plugin emits as CSS at build time. The string values are CSS variable references — they resolve at runtime against the `:root { --df-* }` block above. **VERIFY:** daisy v4 may double-quote the value; the unquoted form `var(--df-...)` is the recall.

```ts
// tailwind.config.ts — daisyui.themes array entry
daisyui: {
  themes: [
    {
      'nexus-amoled': {
        '--p':  'var(--df-neon-violet)',  // primary (violet)
        '--pc': 'var(--df-text-inverse)',
        '--s':  'var(--df-neon-cyan)',    // secondary (cyan)
        '--sc': 'var(--df-text-inverse)',
        '--a':  'var(--df-neon-pink)',    // accent (pink)
        '--ac': 'var(--df-text-inverse)',
        '--n':  'var(--df-bg-overlay)',   // neutral
        '--nc': 'var(--df-text-secondary)',
        '--b1': 'var(--df-bg-base)',      // base-100
        '--b2': 'var(--df-bg-surface)',   // base-200
        '--b3': 'var(--df-bg-elevated)',  // base-300
        '--bc': 'var(--df-text-primary)', // base-content
        '--in': 'var(--df-neon-cyan)',
        '--su': 'var(--df-neon-green)',
        '--wa': 'var(--df-neon-amber)',
        '--er': 'var(--df-neon-red)',
        '--rounded-box':       'var(--df-radius-lg)',
        '--rounded-btn':       'var(--df-radius-md)',
        '--rounded-badge':     '9999px',
        '--animation-btn':     '0.25s',
        '--animation-input':   '0.2s',
        '--btn-focus-scale':   '0.97',
        '--border-btn':        '1px',
        '--tab-border':        '1px',
        '--tab-radius':        'var(--df-radius-sm)',
      },
    },
  ],
  darkTheme: 'nexus-amoled',
}
```

### Bridging DF glow shadows into daisy

DaisyUI components don't have a built-in glow utility. Add a thin layer of DF-token classes that work on any daisy element. **Each rule reads from a `var(--df-glow-*)` token** rather than hard-coded rgba — so editing `00-dark-tokens.md` propagates here automatically:

```css
/* src/app/globals.css — append after the theme block */

/* Violet glow on focus/hover for daisy primary surfaces */
.nx-glow-primary {
  box-shadow: var(--df-glow-violet);
}
.nx-glow-primary-lg {
  box-shadow: var(--df-glow-violet-lg);
}
.nx-glow-cyan { box-shadow: var(--df-glow-cyan); }
.nx-glow-pink { box-shadow: var(--df-glow-pink); }
.nx-glow-green { box-shadow: var(--df-glow-green); }
.nx-glow-red { box-shadow: var(--df-glow-red); }

/* Glassmorphism overlay for daisy modal/drawer backdrops */
.nx-glass {
  background: var(--df-glass-bg);
  border: 1px solid var(--df-glass-border);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
}
.nx-glass-md {
  background: var(--df-glass-bg-md);
  border: 1px solid var(--df-glass-border);
  backdrop-filter: blur(28px) saturate(200%);
  -webkit-backdrop-filter: blur(28px) saturate(200%);
}
```

---

## Components: Dark variants

Every example below renders correctly with `data-theme="nexus-amoled"` set on `<html>`. Daisy is CSS-only for most components, so we avoid `'use client'` unless React state is genuinely required (the modal and drawer use the checkbox/htmlFor pattern — pure HTML).

The pattern: daisy semantic classes (`btn-primary`, `bg-base-200`) inherit AMOLED via the theme block above. Where we want **explicit** DF-token values (escape hatches for borders, focus rings, glows that daisy doesn't theme), we use Tailwind's `[var(--df-*)]` arbitrary-value syntax.

### 1. Buttons — every variant, AMOLED-correct

```tsx
// src/components/ui/button-set.tsx
import type { ReactNode } from 'react'

interface ButtonSetProps {
  onPrimary?: () => void
}

export function ButtonSet({ onPrimary }: ButtonSetProps): ReactNode {
  return (
    <div className="flex flex-wrap gap-3 bg-[var(--df-bg-base)] p-6">
      {/* Primary — violet glow on hover via DF class */}
      <button
        type="button"
        onClick={onPrimary}
        className="btn btn-primary hover:nx-glow-primary transition-shadow"
      >
        Start free trial
      </button>

      {/* Secondary — cyan */}
      <button type="button" className="btn btn-secondary hover:nx-glow-cyan transition-shadow">
        View pricing
      </button>

      {/* Accent — pink */}
      <button type="button" className="btn btn-accent hover:nx-glow-pink transition-shadow">
        Invite teammate
      </button>

      {/* Neutral — overlay grey, used for non-destructive secondary actions */}
      <button
        type="button"
        className="btn btn-neutral border border-[var(--df-border-subtle)] text-[var(--df-text-primary)]"
      >
        Cancel
      </button>

      {/* Ghost — transparent, surfaces on hover */}
      <button
        type="button"
        className="btn btn-ghost text-[var(--df-text-secondary)] hover:bg-[var(--df-bg-hover)] hover:text-[var(--df-text-primary)]"
      >
        Learn more
      </button>

      {/* Link — looks like an anchor */}
      <button
        type="button"
        className="btn btn-link text-[var(--df-neon-cyan)] hover:text-[var(--df-neon-violet)]"
      >
        Read changelog
      </button>

      {/* Outline modifier — adds 1px border, transparent fill */}
      {/* VERIFY: btn-outline composition in v5 — class order may matter */}
      <button
        type="button"
        className="btn btn-outline btn-primary border-[var(--df-border-default)] hover:border-[var(--df-neon-violet)]"
      >
        Manage domains
      </button>

      {/* Destructive */}
      <button type="button" className="btn btn-error hover:nx-glow-red transition-shadow">
        Delete sequence
      </button>

      {/* Sizes: btn-xs / btn-sm / (default) / btn-lg */}
      <button
        type="button"
        className="btn btn-primary btn-sm shadow-[var(--df-glow-violet)]"
        aria-label="Add row"
      >
        + Add
      </button>

      {/* Loading state — daisy ships a spinner span */}
      <button
        type="button"
        className="btn btn-primary"
        disabled
        aria-busy="true"
      >
        <span
          className="loading loading-spinner loading-sm text-[var(--df-text-inverse)]"
          aria-hidden="true"
        />
        Sending...
      </button>
    </div>
  )
}
```

Note the layered approach: daisy's `btn-primary` paints violet (theme block), the explicit `shadow-[var(--df-glow-violet)]` adds the AMOLED glow daisy doesn't ship, and the hover-only `nx-glow-primary` utility class is reusable across every component.

### 2. Card — image, compact, glass variants

```tsx
// src/components/ui/feature-cards.tsx
import type { ReactNode } from 'react'
import Image from 'next/image'

interface FeatureCardProps {
  title: string
  description: string
  imageSrc: string
  imageAlt: string
  badge?: string
}

/** Standard image card — 'card-side' variant for horizontal layout on md+. */
export function FeatureCard({
  title, description, imageSrc, imageAlt, badge,
}: FeatureCardProps): ReactNode {
  return (
    <article
      className="card md:card-side bg-[var(--df-bg-surface)] border border-[var(--df-border-subtle)] shadow-xl hover:border-[var(--df-border-default)] transition-colors"
    >
      <figure className="md:w-2/5">
        <Image
          src={imageSrc}
          alt={imageAlt}
          width={640}
          height={400}
          className="h-full w-full object-cover"
        />
      </figure>
      <div className="card-body">
        {badge && (
          <span
            className="badge badge-primary badge-outline mb-2 border-[var(--df-neon-violet)] text-[var(--df-neon-violet)]"
          >
            {badge}
          </span>
        )}
        <h3 className="card-title text-[var(--df-text-primary)]">{title}</h3>
        <p className="text-[var(--df-text-secondary)] leading-relaxed">{description}</p>
        <div className="card-actions justify-end mt-2">
          <button
            type="button"
            className="btn btn-primary btn-sm shadow-[var(--df-glow-violet)] hover:shadow-[var(--df-glow-violet-lg)] transition-shadow"
          >
            Open report
          </button>
        </div>
      </div>
    </article>
  )
}

/** Compact card — tight padding, used in dashboards. */
export function CompactCard({ title, value }: { title: string; value: string }): ReactNode {
  return (
    <div
      className="card card-compact bg-[var(--df-bg-surface)] border border-[var(--df-border-subtle)] hover:border-[var(--df-border-default)] transition-colors"
    >
      <div className="card-body">
        <p className="text-[var(--df-text-muted)] text-xs uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-semibold text-[var(--df-text-primary)]">{value}</p>
      </div>
    </div>
  )
}

/** Glass card — overlay surface with backdrop blur. DF glass utility. */
export function GlassCard({ children }: { children: ReactNode }): ReactNode {
  return (
    <div className="card nx-glass shadow-2xl text-[var(--df-text-primary)]">
      <div className="card-body">{children}</div>
    </div>
  )
}

/** Elevated card — used for highlighted/featured tier cards. Pairs with violet glow. */
export function ElevatedCard({ children }: { children: ReactNode }): ReactNode {
  return (
    <div
      className="card bg-[var(--df-bg-elevated)] border border-[var(--df-border-default)] shadow-[var(--df-glow-violet-lg)] hover:border-[var(--df-neon-violet)] transition-colors"
    >
      <div className="card-body text-[var(--df-text-primary)]">{children}</div>
    </div>
  )
}
```

### 3. Modal — checkbox/htmlFor pattern (no React state)

```tsx
// src/components/ui/upgrade-modal.tsx
import type { ReactNode } from 'react'

interface UpgradeModalProps {
  /** htmlFor target — must match the checkbox id. */
  id: string
}

/**
 * DaisyUI modal pattern: a hidden checkbox toggles `:checked` state which
 * shows the modal via CSS. Trigger anywhere with <label htmlFor={id}>.
 * No React state, no 'use client'.
 */
export function UpgradeModal({ id }: UpgradeModalProps): ReactNode {
  return (
    <>
      <input type="checkbox" id={id} className="modal-toggle" aria-hidden="true" />
      <div
        className="modal backdrop-blur-md"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
      >
        <div
          className="modal-box bg-[var(--df-bg-overlay)] border border-[var(--df-border-default)] max-w-md shadow-[0_24px_64px_rgba(0,0,0,0.6),var(--df-glow-violet-lg)]"
        >
          <h3
            id={`${id}-title`}
            className="text-xl font-semibold text-[var(--df-text-primary)]"
          >
            Upgrade to Scale
          </h3>
          <p className="py-4 text-[var(--df-text-secondary)] leading-relaxed">
            You've sent 9,840 of your 10,000 monthly emails. Upgrade now to keep your
            warmup schedule running without interruption.
          </p>
          <div className="modal-action">
            <label
              htmlFor={id}
              className="btn btn-ghost text-[var(--df-text-secondary)] hover:bg-[var(--df-bg-hover)] hover:text-[var(--df-text-primary)]"
            >
              Maybe later
            </label>
            <label
              htmlFor={id}
              className="btn btn-primary shadow-[var(--df-glow-violet)] hover:shadow-[var(--df-glow-violet-lg)] transition-shadow"
            >
              Upgrade — $97/mo
            </label>
          </div>
        </div>
        {/* Backdrop click closes modal */}
        <label className="modal-backdrop bg-[color-mix(in_oklch,var(--df-bg-base)_80%,transparent)]" htmlFor={id}>
          Close
        </label>
      </div>
    </>
  )
}

/** Trigger usage anywhere in the tree:
 *   <label htmlFor="upgrade" className="btn btn-primary">Upgrade</label>
 *   <UpgradeModal id="upgrade" />
 */
```

### 4. Drawer — mobile nav pattern (responsive)

```tsx
// src/components/ui/app-drawer.tsx
import type { ReactNode } from 'react'
import Link from 'next/link'

interface AppDrawerProps {
  children: ReactNode
}

/**
 * Drawer hidden on lg+ (sidebar always visible), toggleable on mobile via
 * the hamburger label. Uses the same checkbox-state pattern as Modal.
 */
export function AppDrawer({ children }: AppDrawerProps): ReactNode {
  return (
    <div className="drawer lg:drawer-open bg-[var(--df-bg-base)] text-[var(--df-text-primary)]">
      <input id="app-drawer" type="checkbox" className="drawer-toggle" />

      <div className="drawer-content flex flex-col">
        {/* Top bar with hamburger on mobile */}
        <header className="navbar bg-[var(--df-bg-surface)] border-b border-[var(--df-border-subtle)] lg:hidden">
          <div className="flex-none">
            <label
              htmlFor="app-drawer"
              className="btn btn-square btn-ghost text-[var(--df-text-secondary)] hover:bg-[var(--df-bg-hover)] hover:text-[var(--df-text-primary)]"
              aria-label="Open navigation"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </label>
          </div>
          <div className="flex-1 px-2 font-semibold text-[var(--df-text-primary)]">Nexus</div>
        </header>

        <main className="flex-1 p-6 bg-[var(--df-bg-base)]">{children}</main>
      </div>

      <aside className="drawer-side z-40">
        <label
          htmlFor="app-drawer"
          className="drawer-overlay bg-[color-mix(in_oklch,var(--df-bg-base)_70%,transparent)]"
          aria-label="Close navigation"
        />
        <nav
          aria-label="Primary"
          className="menu w-64 min-h-full bg-[var(--df-bg-surface)] border-r border-[var(--df-border-subtle)] p-4 gap-1 text-[var(--df-text-primary)]"
        >
          <div className="px-3 py-4 font-semibold text-[var(--df-text-primary)]">Nexus</div>
          <li>
            <Link href="/dashboard" className="hover:bg-[var(--df-bg-hover)]">Dashboard</Link>
          </li>
          <li>
            <Link href="/sequences" className="hover:bg-[var(--df-bg-hover)]">Sequences</Link>
          </li>
          <li>
            <Link href="/inbox" className="hover:bg-[var(--df-bg-hover)]">Inbox</Link>
          </li>
          <li>
            <Link href="/analytics" className="hover:bg-[var(--df-bg-hover)]">Analytics</Link>
          </li>
          <li className="mt-auto">
            <Link
              href="/settings"
              className="text-[var(--df-text-muted)] hover:bg-[var(--df-bg-hover)] hover:text-[var(--df-text-secondary)]"
            >
              Settings
            </Link>
          </li>
        </nav>
      </aside>
    </div>
  )
}
```

### 5. Dropdown — pure CSS, no JS state

```tsx
// src/components/ui/account-dropdown.tsx
import type { ReactNode } from 'react'

interface AccountDropdownProps {
  email: string
  onSignOut?: () => void
}

export function AccountDropdown({ email, onSignOut }: AccountDropdownProps): ReactNode {
  return (
    <div className="dropdown dropdown-end">
      <div
        tabIndex={0}
        role="button"
        className="btn btn-ghost gap-2 text-[var(--df-text-secondary)] hover:bg-[var(--df-bg-hover)] hover:text-[var(--df-text-primary)]"
        aria-haspopup="menu"
      >
        <span className="avatar avatar-placeholder">
          <span className="bg-[var(--df-neon-violet)] text-[var(--df-text-inverse)] w-8 rounded-full">
            {email.charAt(0).toUpperCase()}
          </span>
        </span>
        <span className="hidden sm:inline text-sm">{email}</span>
      </div>
      <ul
        tabIndex={0}
        role="menu"
        className="dropdown-content menu bg-[var(--df-bg-elevated)] border border-[var(--df-border-default)] rounded-[var(--df-radius-lg)] z-50 mt-2 w-56 p-2 shadow-[0_8px_32px_rgba(0,0,0,0.5)] text-[var(--df-text-primary)]"
      >
        <li>
          <a href="/account" className="hover:bg-[var(--df-bg-hover)]">
            Account settings
          </a>
        </li>
        <li>
          <a href="/billing" className="hover:bg-[var(--df-bg-hover)]">Billing</a>
        </li>
        <li>
          <a href="/team" className="hover:bg-[var(--df-bg-hover)]">Team members</a>
        </li>
        <li>
          <hr className="border-[var(--df-border-subtle)] my-1" />
        </li>
        <li>
          <button
            type="button"
            onClick={onSignOut}
            className="text-[var(--df-neon-red)] hover:bg-[var(--df-bg-hover)]"
          >
            Sign out
          </button>
        </li>
      </ul>
    </div>
  )
}
```

### 6. Tabs — pills, bordered, lifted

```tsx
// src/components/ui/dashboard-tabs.tsx
import type { ReactNode } from 'react'

/**
 * Pure-CSS tabs using radio inputs. Each `tab-content` shows when the
 * matching radio is checked. No React state, no 'use client'.
 */
export function DashboardTabs(): ReactNode {
  return (
    <div role="tablist" className="tabs tabs-lifted">
      <input
        type="radio"
        name="dashboard-tabs"
        role="tab"
        className="tab text-[var(--df-text-secondary)] checked:text-[var(--df-neon-violet)]"
        aria-label="Overview"
        defaultChecked
      />
      <div
        role="tabpanel"
        className="tab-content bg-[var(--df-bg-surface)] border-[var(--df-border-subtle)] rounded-[var(--df-radius-lg)] p-6"
      >
        <h3 className="font-semibold text-[var(--df-text-primary)] mb-2">Overview</h3>
        <p className="text-[var(--df-text-secondary)]">
          12,840 emails sent across 14 active sequences this week.
        </p>
      </div>

      <input
        type="radio"
        name="dashboard-tabs"
        role="tab"
        className="tab text-[var(--df-text-secondary)] checked:text-[var(--df-neon-violet)]"
        aria-label="Deliverability"
      />
      <div
        role="tabpanel"
        className="tab-content bg-[var(--df-bg-surface)] border-[var(--df-border-subtle)] rounded-[var(--df-radius-lg)] p-6"
      >
        <h3 className="font-semibold text-[var(--df-text-primary)] mb-2">Deliverability</h3>
        <p className="text-[var(--df-text-secondary)]">
          Inbox placement holding at 94.2% across all 14 mailbox providers.
        </p>
      </div>

      <input
        type="radio"
        name="dashboard-tabs"
        role="tab"
        className="tab text-[var(--df-text-secondary)] checked:text-[var(--df-neon-violet)]"
        aria-label="Replies"
      />
      <div
        role="tabpanel"
        className="tab-content bg-[var(--df-bg-surface)] border-[var(--df-border-subtle)] rounded-[var(--df-radius-lg)] p-6"
      >
        <h3 className="font-semibold text-[var(--df-text-primary)] mb-2">Replies</h3>
        <p className="text-[var(--df-text-secondary)]">
          84 positive replies pending review in the unified inbox.
        </p>
      </div>
    </div>
  )
}

/** Pills variant — 'tabs-boxed' wraps each tab in a pill. */
export function PillTabs(): ReactNode {
  return (
    <div
      role="tablist"
      className="tabs tabs-boxed bg-[var(--df-bg-surface)] border border-[var(--df-border-subtle)] p-1"
    >
      <button
        role="tab"
        type="button"
        className="tab tab-active bg-[var(--df-neon-violet)] text-[var(--df-text-inverse)]"
      >
        Daily
      </button>
      <button
        role="tab"
        type="button"
        className="tab text-[var(--df-text-secondary)] hover:text-[var(--df-text-primary)]"
      >
        Weekly
      </button>
      <button
        role="tab"
        type="button"
        className="tab text-[var(--df-text-secondary)] hover:text-[var(--df-text-primary)]"
      >
        Monthly
      </button>
    </div>
  )
}

/** Bordered variant — bottom-border accent on the active tab. */
export function BorderedTabs(): ReactNode {
  return (
    <div role="tablist" className="tabs tabs-bordered border-b border-[var(--df-border-subtle)]">
      <button
        role="tab"
        type="button"
        className="tab tab-active text-[var(--df-neon-violet)] border-[var(--df-neon-violet)]"
      >
        Sequence
      </button>
      <button
        role="tab"
        type="button"
        className="tab text-[var(--df-text-secondary)] hover:text-[var(--df-text-primary)]"
      >
        Recipients
      </button>
      <button
        role="tab"
        type="button"
        className="tab text-[var(--df-text-secondary)] hover:text-[var(--df-text-primary)]"
      >
        Schedule
      </button>
    </div>
  )
}
```

### 7. Form — input, select, checkbox, toggle (all dark)

```tsx
// src/components/ui/sequence-form.tsx
'use client'

import { useState, type FormEvent, type ReactNode } from 'react'

interface SequenceFormValues {
  name: string
  fromEmail: string
  cadence: 'aggressive' | 'balanced' | 'gentle'
  trackOpens: boolean
  warmupEnabled: boolean
}

interface SequenceFormProps {
  onSubmit: (values: SequenceFormValues) => void
}

export function SequenceForm({ onSubmit }: SequenceFormProps): ReactNode {
  const [values, setValues] = useState<SequenceFormValues>({
    name: '',
    fromEmail: '',
    cadence: 'balanced',
    trackOpens: true,
    warmupEnabled: false,
  })

  const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault()
    onSubmit(values)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-5 max-w-md bg-[var(--df-bg-surface)] border border-[var(--df-border-subtle)] rounded-[var(--df-radius-lg)] p-6"
    >
      {/* Text input — no form-control wrapper (deprecated in v5) */}
      <label className="grid gap-1.5">
        <span className="label-text text-[var(--df-text-secondary)] text-sm font-medium">
          Sequence name
        </span>
        <input
          type="text" required
          placeholder="Q4 outbound — SaaS founders"
          value={values.name}
          onChange={(e) => setValues({ ...values, name: e.target.value })}
          className="input input-bordered bg-[var(--df-bg-elevated)] border-[var(--df-border-default)] text-[var(--df-text-primary)] placeholder:text-[var(--df-text-muted)] focus:border-[var(--df-neon-violet)] focus:shadow-[var(--df-glow-violet)] focus:outline-none transition-shadow"
        />
      </label>

      <label className="grid gap-1.5">
        <span className="label-text text-[var(--df-text-secondary)] text-sm font-medium">
          From email
        </span>
        <input
          type="email" required
          placeholder="founder@yourdomain.com"
          value={values.fromEmail}
          onChange={(e) => setValues({ ...values, fromEmail: e.target.value })}
          className="input input-bordered bg-[var(--df-bg-elevated)] border-[var(--df-border-default)] text-[var(--df-text-primary)] placeholder:text-[var(--df-text-muted)] focus:border-[var(--df-neon-violet)] focus:outline-none"
        />
      </label>

      {/* Select */}
      <label className="grid gap-1.5">
        <span className="label-text text-[var(--df-text-secondary)] text-sm font-medium">
          Send cadence
        </span>
        <select
          value={values.cadence}
          onChange={(e) =>
            setValues({ ...values, cadence: e.target.value as SequenceFormValues['cadence'] })
          }
          className="select select-bordered bg-[var(--df-bg-elevated)] border-[var(--df-border-default)] text-[var(--df-text-primary)] focus:border-[var(--df-neon-violet)] focus:outline-none"
        >
          <option value="gentle">Gentle — 20 sends/day</option>
          <option value="balanced">Balanced — 50 sends/day</option>
          <option value="aggressive">Aggressive — 100 sends/day</option>
        </select>
      </label>

      {/* Checkbox */}
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={values.trackOpens}
          onChange={(e) => setValues({ ...values, trackOpens: e.target.checked })}
          className="checkbox checkbox-primary border-[var(--df-border-default)] checked:bg-[var(--df-neon-violet)] checked:border-[var(--df-neon-violet)]"
        />
        <span className="text-[var(--df-text-primary)] text-sm">
          Track email opens with pixel tracking
        </span>
      </label>

      {/* Toggle */}
      <label className="flex items-center justify-between cursor-pointer">
        <span className="text-[var(--df-text-primary)] text-sm">
          Enable inbox warmup before first send
        </span>
        <input
          type="checkbox"
          checked={values.warmupEnabled}
          onChange={(e) => setValues({ ...values, warmupEnabled: e.target.checked })}
          className="toggle toggle-primary bg-[var(--df-bg-elevated)] border-[var(--df-border-default)] checked:bg-[var(--df-neon-violet)]"
        />
      </label>

      <button
        type="submit"
        className="btn btn-primary mt-2 shadow-[var(--df-glow-violet)] hover:shadow-[var(--df-glow-violet-lg)] transition-shadow"
      >
        Create sequence
      </button>
    </form>
  )
}
```

### 8. Stats — DF violet number colors

```tsx
// src/components/ui/dashboard-stats.tsx
import type { ReactNode } from 'react'

interface DashboardStatsProps {
  emailsSent: number
  openRate: number
  replyRate: number
  positiveReplies: number
}

const fmt = new Intl.NumberFormat('en-US')
const pct = (n: number): string => `${(n * 100).toFixed(1)}%`

export function DashboardStats({
  emailsSent, openRate, replyRate, positiveReplies,
}: DashboardStatsProps): ReactNode {
  return (
    <div
      className="stats stats-vertical lg:stats-horizontal bg-[var(--df-bg-surface)] border border-[var(--df-border-subtle)] shadow-xl w-full"
    >
      <div className="stat">
        <div className="stat-title text-[var(--df-text-muted)]">Emails sent</div>
        <div className="stat-value text-[var(--df-neon-violet)]">{fmt.format(emailsSent)}</div>
        <div className="stat-desc text-[var(--df-neon-green)]">+12.4% vs last week</div>
      </div>

      <div className="stat">
        <div className="stat-title text-[var(--df-text-muted)]">Open rate</div>
        <div className="stat-value text-[var(--df-neon-cyan)]">{pct(openRate)}</div>
        <div className="stat-desc text-[var(--df-text-muted)]">Industry avg: 38.2%</div>
      </div>

      <div className="stat">
        <div className="stat-title text-[var(--df-text-muted)]">Reply rate</div>
        <div className="stat-value text-[var(--df-neon-pink)]">{pct(replyRate)}</div>
        <div className="stat-desc text-[var(--df-neon-green)]">+0.8 pts</div>
      </div>

      <div className="stat">
        <div className="stat-title text-[var(--df-text-muted)]">Positive replies</div>
        <div className="stat-value text-[var(--df-text-primary)]">{fmt.format(positiveReplies)}</div>
        <div className="stat-desc text-[var(--df-text-muted)]">Pending review</div>
      </div>
    </div>
  )
}
```

### 9. Hero — daisy `hero` with DF gradient mesh

```tsx
// src/components/ui/marketing-hero.tsx
import type { ReactNode } from 'react'

interface MarketingHeroProps {
  eyebrow: string
  headline: string
  subhead: string
  primaryCta: string
  secondaryCta: string
}

export function MarketingHero({
  eyebrow, headline, subhead, primaryCta, secondaryCta,
}: MarketingHeroProps): ReactNode {
  return (
    <section
      className="hero min-h-[80vh] relative overflow-hidden bg-[var(--df-bg-base)]"
    >
      {/* DF gradient mesh — violet + cyan radial orbs.
          color-mix() reads from DF neon tokens so editing 00-dark-tokens.md
          retunes the orb hues without touching this file. */}
      {/* VERIFY: color-mix() in oklch is supported in evergreen browsers ≥ 2023 */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 20% 20%, color-mix(in oklch, var(--df-neon-violet) 18%, transparent) 0%, transparent 55%), ' +
            'radial-gradient(circle at 80% 70%, color-mix(in oklch, var(--df-neon-cyan) 12%, transparent) 0%, transparent 55%)',
        }}
      />
      <div className="hero-content text-center max-w-3xl relative">
        <div className="grid gap-6">
          <span
            className="text-[var(--df-neon-violet)] text-sm font-medium tracking-[0.18em] uppercase"
          >
            {eyebrow}
          </span>
          <h1
            className="text-4xl sm:text-5xl md:text-6xl font-semibold text-[var(--df-text-primary)] leading-[1.05] tracking-tight"
          >
            {headline}
          </h1>
          <p
            className="text-lg text-[var(--df-text-secondary)] leading-relaxed max-w-2xl mx-auto"
          >
            {subhead}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-2">
            <button
              type="button"
              className="btn btn-primary btn-lg shadow-[var(--df-glow-violet)] hover:shadow-[var(--df-glow-violet-lg)] transition-shadow"
            >
              {primaryCta}
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-lg text-[var(--df-text-primary)] border border-[var(--df-border-default)] hover:border-[var(--df-border-strong)] hover:bg-[var(--df-bg-hover)]"
            >
              {secondaryCta}
            </button>
          </div>
          <p className="text-[var(--df-text-muted)] text-sm">
            14-day free trial. No credit card. Cancel anytime.
          </p>
        </div>
      </div>
    </section>
  )
}
```

### 10. Navbar — sticky, with DF glow on active link

```tsx
// src/components/ui/site-navbar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

interface NavLink {
  href: string
  label: string
}

const links: NavLink[] = [
  { href: '/product', label: 'Product' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/customers', label: 'Customers' },
  { href: '/docs', label: 'Docs' },
]

export function SiteNavbar(): ReactNode {
  const pathname = usePathname()

  return (
    <header
      className="navbar sticky top-0 z-30 bg-[color-mix(in_oklch,var(--df-bg-base)_80%,transparent)] backdrop-blur-xl border-b border-[var(--df-border-subtle)]"
    >
      <div className="navbar-start">
        <Link
          href="/"
          className="btn btn-ghost text-lg font-semibold tracking-tight text-[var(--df-text-primary)]"
        >
          Nexus
        </Link>
      </div>

      <nav className="navbar-center hidden md:flex" aria-label="Primary">
        <ul className="menu menu-horizontal gap-1">
          {links.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`)
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={isActive
                    ? 'text-[var(--df-neon-violet)] font-medium nx-glow-primary'
                    : 'text-[var(--df-text-secondary)] hover:text-[var(--df-text-primary)] hover:bg-[var(--df-bg-hover)]'}
                >
                  {link.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="navbar-end gap-2">
        <Link
          href="/login"
          className="btn btn-ghost btn-sm text-[var(--df-text-secondary)] hover:bg-[var(--df-bg-hover)] hover:text-[var(--df-text-primary)]"
        >
          Sign in
        </Link>
        <Link
          href="/signup"
          className="btn btn-primary btn-sm shadow-[var(--df-glow-violet)] hover:shadow-[var(--df-glow-violet-lg)] transition-shadow"
        >
          Start free
        </Link>
      </div>
    </header>
  )
}
```

---

## Pitfalls / Common gotchas

- **Theme not applying.** If components render shadcn-grey instead of AMOLED black, the `data-theme="nexus-amoled"` attribute is missing from `<html>`, or the `@plugin "daisyui/theme" {}` block is above `@import "tailwindcss"` (must be below). In a Vite project, the root attribute lives in `index.html`, not React. Inspect `<html>` in devtools — that's the fastest tell.

- **DF tokens unresolved.** If daisy renders fully transparent (or in default neutral), the `:root { --df-bg-base: ... }` block is missing. The `@plugin "daisyui/theme" {}` block reads `var(--df-*)` references, which only resolve once `:root` defines them. Order: DF tokens → `@plugin "daisyui"` → `@plugin "daisyui/theme" {}`.

- **v5 vs v4 variable names.** A theme block written with `--p`/`--b1`/`--bc` won't apply on daisy v5; v5 expects `--color-primary`/`--color-base-100`/`--color-base-content`. Check `package.json` for the major version before copy-pasting either block above.

- **`@plugin` directive only in Tailwind v4.** If your `globals.css` starts with `@tailwind base; @tailwind components; @tailwind utilities;`, you're on Tailwind v3 — `@plugin` will silently fail. Use the `tailwind.config.ts` `daisyui:` block instead.

- **`form-control` wrapper deprecated.** v4 examples often wrapped inputs in `<div class="form-control">`. v5 dropped this; use bare `<label>` + `input className="input input-bordered"`. If you copy from older daisy docs, strip the wrapper.

- **Plugin order matters.** When combining daisyui with `tailwindcss-animate` or `@tailwindcss/typography`, register daisyui **last** in the v3 plugins array. In v4 with `@plugin`, declare daisyui after other plugins for the same reason — variable cascade order.

- **Modal/drawer don't render.** Both rely on a hidden checkbox having a unique `id` that matches the `htmlFor` on every trigger. If two modals share an id on the same page, both open together. Always namespace ids by the modal's purpose (`upgrade-modal`, `confirm-delete`, ...).

- **`btn-outline` color override.** In v5, `btn-outline btn-primary` paints a violet outline button. Reordering to `btn-primary btn-outline` may render differently — `btn-outline` should follow the color modifier. VERIFY: this composition behavior changed between v4 and v5.

- **`stats stats-vertical` collapse on mobile.** On screens narrower than the daisy `lg` breakpoint, `stats-horizontal` overflows. Combine with `stats-vertical lg:stats-horizontal` so the layout stacks below 1024px.

- **Tooltip clipping in cards.** `card` has `overflow: hidden` to clip the figure image. Tooltips spawned inside a card get clipped at the card edge. Either move the tooltip target outside the card or override `overflow: visible` on the card body.

- **`color-mix()` browser support.** Used in the hero gradient and navbar backdrop tint to layer DF tokens with transparency. Supported in Chrome/Edge ≥ 111, Safari ≥ 16.4, Firefox ≥ 113 — if your support matrix includes older browsers, fall back to the `rgba(167,139,250,0.18)` literal pattern.

---

## When to prefer DaisyUI over shadcn/ui

DaisyUI is the right pick when the project values **fast scaffolding, multi-theme switching, and CSS-only components** — marketing sites, admin tools where one developer ships the whole UI in a week, or apps that need light/dark/brand-X theme variants live. The component library is class-based, so prototyping is `<button class="btn btn-primary">` and you're done.

shadcn/ui (see `references/08-shadcn-dark.md`) is the right pick when the project needs **deep accessibility primitives, owned component source, and behavior-rich interactions** — Radix-backed comboboxes, command palettes, keyboard-navigable menus, complex dialogs. shadcn copies code into your repo; daisy stays a dependency.

In Darkforge generation: if the project has **only** `daisyui` in `package.json`, use this reference. If it has **both** daisyui and shadcn, prefer shadcn for interactive primitives (Dialog, Combobox, Popover) and daisy for visual primitives (Card, Stats, Hero, Navbar) — you can mix freely because both render through Tailwind classes.

---

## Cross-References

- `references/00-dark-tokens.md` — every DF color, glow, radius variable mapped into the `nexus-amoled` daisy theme above
- `references/08-shadcn-dark.md` — peer reference; covers Radix-backed primitives daisy doesn't ship
- `references/01-framer-motion.md` — wrap daisy `card`, `modal`, `drawer` in `motion.*` to add DF-grade entrance animations daisy doesn't ship
- `references/17-skeleton-system.md` — daisy's built-in `skeleton` class works, but DF shimmer skeletons match better; pair them for `card` and `stats` loading states
- `references/patterns/dashboard.md` — combines `DashboardStats` + `DashboardTabs` + `AppDrawer` from this file
- `references/patterns/hero.md` — pairs `MarketingHero` + `SiteNavbar` with framer entrance overlays
- `references/patterns/pricing.md` — uses `ElevatedCard` with `nx-glow-primary-lg` on the highlighted column
