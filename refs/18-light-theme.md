---
name: 18-light-theme
description: Opt-in light theme — same DF token names, theme-scoped overrides under [data-theme="light"]. Components written once, flip at runtime. Dark stays default. Replaces the deprecated --df-light-* namespace as of v1.1.1.
---

# Darkforge — Light Theme (Opt-In, Runtime-Flippable)

> **Architecture: one namespace, two themes.** Components only ever reference `var(--df-bg-base)`, `var(--df-text-primary)`, etc. The dark values live in `:root`. The light values override the **same names** under `:root[data-theme="light"]`. Toggle the attribute → every component flips. No regenerate. No FOUC if you set the attribute in a `<head>` script. No crash.

## Contents

- [What changed in v1.1.1](#what-changed-in-v111)
- [Why this architecture](#why-this-architecture)
- [The token override block](#the-token-override-block)
- [Activation patterns](#activation-patterns)
  - [1. Static (`<html data-theme="light">`)](#1-static-html-data-themelight)
  - [2. SSR-safe ThemeProvider (Next.js App Router)](#2-ssr-safe-themeprovider-nextjs-app-router)
  - [3. Theme-toggle button](#3-theme-toggle-button)
  - [4. The `/darkforge:forge --light` flag](#4-the-darkforgeui-light-flag)
- [Worked components (work in BOTH themes, no rewrites)](#worked-components-work-in-both-themes-no-rewrites)
- [Migration from `--df-light-*` (pre-v1.1.1 deprecation)](#migration-from-nx-light--pre-v111-deprecation)
- [When NOT to use light theme](#when-not-to-use-light-theme)
- [Pitfalls](#pitfalls)
- [Cross-references](#cross-references)

---

## What changed in v1.1.1

| Era | Approach | Runtime flip? |
|---|---|---|
| **v1.0.0 — v1.1.0** (deprecated) | Separate `--df-light-*` token namespace. Light components hand-rewritten to read `var(--df-light-bg-base)`. | **No.** Toggling `[data-theme="light"]` did nothing because dark `--df-bg-base` was never overridden. Components had to be regenerated to switch themes. |
| **v1.1.1+ (current)** | Same `--df-bg-base`, `--df-text-primary`, etc. names. Dark in `:root`, light overrides under `:root[data-theme="light"]`. | **Yes.** Set the attribute, every component flips at the next paint. No regenerate. |

**The bug this fixes:** users reported that asking the plugin to "switch to light" produced broken renders or empty backgrounds. Root cause: components ended up referencing `var(--df-light-bg-base)` outside of `[data-theme="light"]` context (where the variable is undefined → no background). The override approach removes the failure mode entirely — every DF token is always defined; only its *value* changes per theme.

## Why this architecture

It is the same pattern shadcn/ui, next-themes, Linear, Stripe, and every modern dark-mode site uses. The reasons:

1. **One source of truth per concept.** "Page background" is `--df-bg-base`. Always. The value changes; the name does not.
2. **Components are theme-agnostic.** A `<Card>` written for dark works in light with zero changes. The plugin generates one component, not two.
3. **Runtime switching is free.** No JS recompiles, no class swaps, no full re-renders — just CSS variable resolution against the new attribute.
4. **SSR safety is achievable.** With a `<head>` script that reads localStorage and patches `<html>` *before* hydration, there is no flash of wrong theme.
5. **Validator-friendly.** Hardcoded `--df-light-*` references in generated code are now a code-smell the validator can flag.

## The token override block

Already injected by the canonical `00-dark-tokens.md` token system (v1.1.1+). If you have an older project on the deprecated namespace, drop this block into your `globals.css` directly under your `:root { --df-bg-base: ... }` declaration — same file, after the dark block.

```css
:root[data-theme="light"] {
  --df-bg-base:        #ffffff;
  --df-bg-surface:     #fafafa;
  --df-bg-elevated:    #f4f4f5;
  --df-bg-overlay:     #e4e4e7;
  --df-bg-muted:       #d4d4d8;
  --df-bg-hover:       #ececef;

  --df-glow-violet:    0 0 20px rgba(167, 139, 250, 0.18);
  --df-glow-violet-lg: 0 0 40px rgba(167, 139, 250, 0.14);
  --df-glow-cyan:      0 0 20px rgba(34, 211, 238, 0.18);
  --df-glow-cyan-lg:   0 0 40px rgba(34, 211, 238, 0.14);
  --df-glow-pink:      0 0 20px rgba(244, 114, 182, 0.18);
  --df-glow-green:     0 0 20px rgba(74, 222, 128, 0.18);

  --df-glass-bg:        rgba(0, 0, 0, 0.04);
  --df-glass-bg-md:     rgba(0, 0, 0, 0.06);
  --df-glass-bg-lg:     rgba(0, 0, 0, 0.08);
  --df-glass-border:    rgba(0, 0, 0, 0.08);
  --df-glass-border-md: rgba(0, 0, 0, 0.12);

  --df-text-primary:    #0a0a0a;
  --df-text-secondary:  #52525b;
  --df-text-muted:      #a1a1aa;
  --df-text-inverse:    #ffffff;   /* flips so violet-bg buttons read on white */
  --df-text-accent:     #7c3aed;   /* violet-600 for AA on white */

  --df-border-subtle:   rgba(0, 0, 0, 0.06);
  --df-border-default:  rgba(0, 0, 0, 0.10);
  --df-border-strong:   rgba(0, 0, 0, 0.18);
  --df-border-focus:    rgba(167, 139, 250, 0.5);

  --df-skeleton-base:   #e4e4e7;
  --df-skeleton-shine:  #f4f4f5;
  --df-skeleton-glow:   rgba(167, 139, 250, 0.06);

  /* Neons, radii, spacing, typography, transitions, z-index — unchanged. */
}
```

Note what is **not** here: neon accent hues (`--df-neon-violet` etc.) are unchanged across themes — that is the brand DNA. Only contrast-sensitive values (backgrounds, text, glows, glass alpha) flip.

## Activation patterns

### 1. Static (`<html data-theme="light">`)

The simplest possible mode. Set the attribute server-side; never toggles.

```html
<html data-theme="light">
  <head>...</head>
  <body>...</body>
</html>
```

Use this when the entire product is light — fintech consumer app, healthcare portal, regulated SaaS — and the user never opts back to dark.

### 2. SSR-safe ThemeProvider (Next.js App Router)

The pattern that avoids both FOUC (flash of wrong theme) and React hydration mismatch. A tiny synchronous `<head>` script reads localStorage and patches `<html>` **before** React hydrates.

```tsx
// app/layout.tsx
import { ThemeScript } from './ThemeScript'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body>{children}</body>
    </html>
  )
}
```

```tsx
// app/ThemeScript.tsx — runs before hydration, no React state involved
export function ThemeScript() {
  const code = `
    (function () {
      try {
        var stored = localStorage.getItem('nx-theme');
        var theme = stored === 'light' || stored === 'dark'
          ? stored
          : (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
        if (theme === 'light') document.documentElement.setAttribute('data-theme', 'light');
        document.documentElement.style.colorScheme = theme;
      } catch (_) {}
    })();
  `
  return <script dangerouslySetInnerHTML={{ __html: code }} />
}
```

Two things to notice:

1. `suppressHydrationWarning` on `<html>` is required — the server renders the bare element, the client patches it before paint, and React would otherwise warn about the mismatch. This is the official next-themes pattern.
2. `colorScheme` is set on the documentElement style so the browser's native widgets (form inputs, scrollbars) flip too.

Then build a `useDfTheme()` hook for any component that needs to read or write the theme:

```tsx
// app/useDfTheme.ts
'use client'
import { useEffect, useState, useCallback } from 'react'

export type NxTheme = 'dark' | 'light'

export function useDfTheme() {
  const [theme, setThemeState] = useState<NxTheme>('dark')

  // Sync from DOM on mount (the ThemeScript already set the attribute)
  useEffect(() => {
    const current = document.documentElement.getAttribute('data-theme') === 'light'
      ? 'light'
      : 'dark'
    setThemeState(current)
  }, [])

  const setTheme = useCallback((next: NxTheme) => {
    if (next === 'light') {
      document.documentElement.setAttribute('data-theme', 'light')
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
    document.documentElement.style.colorScheme = next
    localStorage.setItem('nx-theme', next)
    setThemeState(next)
  }, [])

  const toggle = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }, [theme, setTheme])

  return { theme, setTheme, toggle }
}
```

### 3. Theme-toggle button

Drop-in component. Lives anywhere in the tree — top-right of the navbar is canonical.

```tsx
'use client'
import { Sun, Moon } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import { useDfTheme } from '@/app/useDfTheme'

export function ThemeToggle() {
  const { theme, toggle } = useDfTheme()
  const reduced = useReducedMotion()

  return (
    <motion.button
      onClick={toggle}
      whileTap={reduced ? undefined : { scale: 0.94 }}
      transition={{ duration: 0.15 }}
      aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      aria-pressed={theme === 'light'}
      style={{
        width: 36,
        height: 36,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--df-bg-elevated)',
        border: '1px solid var(--df-border-default)',
        borderRadius: 'var(--df-radius-md)',
        color: 'var(--df-text-primary)',
        cursor: 'pointer',
        transition: 'background var(--df-duration-fast) var(--df-ease-out)',
      }}
    >
      {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
    </motion.button>
  )
}
```

Notice the button itself uses only `var(--df-*)` — it works identically in both themes. That is the whole point of the override architecture.

### 4. The `/darkforge:forge --light` flag

When the user invokes `/darkforge:forge --light <prompt>`, the flag means **"emit a layout root that pre-renders with `data-theme='light'`"** — *not* "use a different token namespace." Every generated component still references `var(--df-bg-base)` etc. The plugin emits:

```tsx
export default function Page() {
  return (
    <html lang="en" data-theme="light">
      <body>
        {/* ...generated components, all using var(--df-*) ... */}
      </body>
    </html>
  )
}
```

If `--light` is omitted, the layout has no `data-theme` attribute and components render against the dark default.

## Worked components (work in BOTH themes, no rewrites)

Every component below is theme-agnostic — same source code, both palettes. Toggle the attribute and watch them flip.

### 1. Surface card

```tsx
'use client'
import { motion, useReducedMotion } from 'framer-motion'

export function Card({ title, body }: { title: string; body: string }) {
  const reduced = useReducedMotion()
  return (
    <motion.article
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      style={{
        background: 'var(--df-bg-surface)',
        border: '1px solid var(--df-border-default)',
        borderRadius: 'var(--df-radius-lg)',
        padding: 24,
        color: 'var(--df-text-primary)',
        boxShadow: 'var(--df-glow-violet-lg)',
      }}
    >
      <h3 style={{ margin: 0, color: 'var(--df-text-primary)' }}>{title}</h3>
      <p style={{ margin: '8px 0 0', color: 'var(--df-text-secondary)' }}>{body}</p>
    </motion.article>
  )
}
```

### 2. NeonButton (text-inverse flips automatically)

```tsx
'use client'
import { motion, useReducedMotion } from 'framer-motion'

export function NeonButton({ label, onClick }: { label: string; onClick?: () => void }) {
  const reduced = useReducedMotion()
  return (
    <motion.button
      onClick={onClick}
      whileHover={reduced ? undefined : { y: -1 }}
      whileTap={reduced ? undefined : { y: 0 }}
      transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
      style={{
        background: 'var(--df-neon-violet)',
        color: 'var(--df-text-inverse)',
        border: '1px solid var(--df-border-focus)',
        borderRadius: 'var(--df-radius-md)',
        padding: '12px 24px',
        fontWeight: 600,
        cursor: 'pointer',
        boxShadow: 'var(--df-glow-violet)',
        transition: 'box-shadow var(--df-duration-base) var(--df-ease-out)',
      }}
    >
      {label}
    </motion.button>
  )
}
```

`--df-text-inverse` is `#000` in dark and `#fff` in light. The button text reads correctly on the violet background in both themes without any code branching.

### 3. Glass panel

```tsx
export function GlassPanel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: 'var(--df-glass-bg)',
        border: '1px solid var(--df-glass-border)',
        backdropFilter: 'blur(12px) saturate(140%)',
        WebkitBackdropFilter: 'blur(12px) saturate(140%)',
        borderRadius: 'var(--df-radius-lg)',
        padding: 24,
        color: 'var(--df-text-primary)',
      }}
    >
      {children}
    </div>
  )
}
```

In dark, the glass tint is white-alpha on near-black. In light, it flips to black-alpha on white — automatically.

### 4. Skeleton with shimmer

```tsx
'use client'
import { useReducedMotion } from 'framer-motion'

export function Skeleton({ width = '100%', height = 16 }: { width?: number | string; height?: number | string }) {
  const reduced = useReducedMotion()
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      aria-label="Loading"
      style={{
        width,
        height,
        background: 'var(--df-skeleton-base)',
        borderRadius: 'var(--df-radius-md)',
        position: 'relative',
        overflow: 'hidden',
        ...(reduced ? {} : {
          background: `linear-gradient(90deg, var(--df-skeleton-base) 0%, var(--df-skeleton-shine) 50%, var(--df-skeleton-base) 100%)`,
          backgroundSize: '200% 100%',
          animation: 'nx-shimmer 1.6s linear infinite',
        }),
      }}
    />
  )
}
```

Add the keyframe once globally:

```css
@keyframes nx-shimmer {
  from { background-position: 200% 0; }
  to   { background-position: -200% 0; }
}
@media (prefers-reduced-motion: reduce) {
  [aria-busy="true"] { animation: none !important; }
}
```

### 5. Hero with shimmer text

```tsx
'use client'
import { motion, useReducedMotion } from 'framer-motion'

export function Hero({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  const reduced = useReducedMotion()
  return (
    <section
      aria-labelledby="nx-hero-title"
      style={{
        background: 'var(--df-bg-base)',
        color: 'var(--df-text-primary)',
        padding: '120px 24px',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 24,
      }}
    >
      <motion.p
        initial={reduced ? false : { opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          color: 'var(--df-text-secondary)',
          fontFamily: 'var(--df-font-mono)',
          fontSize: 12,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          margin: 0,
        }}
      >
        {eyebrow}
      </motion.p>
      <motion.h1
        id="nx-hero-title"
        initial={reduced ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05 }}
        style={{
          fontFamily: 'var(--df-font-display)',
          fontSize: 'clamp(40px, 6vw, 72px)',
          fontWeight: 700,
          lineHeight: 1.05,
          margin: 0,
          background: 'linear-gradient(90deg, var(--df-text-accent), var(--df-neon-cyan), var(--df-text-accent))',
          backgroundSize: '200% auto',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        {title}
      </motion.h1>
      <p style={{ color: 'var(--df-text-secondary)', maxWidth: '52ch', fontSize: 18, lineHeight: 1.5 }}>
        {subtitle}
      </p>
    </section>
  )
}
```

`--df-text-accent` is `#a78bfa` in dark and `#7c3aed` in light — the gradient stays on-brand and contrast-correct in both.

## Migration from `--df-light-*` (pre-v1.1.1 deprecation)

Every reference to a `--df-light-*` token in your codebase should become the same token without the `light-` prefix:

```diff
- background: 'var(--df-light-bg-base)';
+ background: 'var(--df-bg-base)';

- color: 'var(--df-light-text-primary)';
+ color: 'var(--df-text-primary)';

- box-shadow: var(--df-light-glow-violet);
+ box-shadow: var(--df-glow-violet);
```

A bash one-liner that safely covers most repos:

```bash
# preview
grep -rn "var(--df-light-" --include="*.tsx" --include="*.ts" --include="*.css" .

# rewrite (after preview looks right)
grep -rl "var(--df-light-" --include="*.tsx" --include="*.ts" --include="*.css" . \
  | xargs sed -i 's|var(--df-light-|var(--df-|g'
```

After the rewrite, every component is theme-agnostic — same source code, dark by default, light when `[data-theme="light"]` is set on `<html>`.

The deprecated `--df-light-*` namespace will be removed in v2.0. Until then, the legacy block is harmless if it stays in `globals.css`, but new components must not reference it.

## When NOT to use light theme

Same as before — light is for accessibility, brand convention, and explicit stakeholder ask, never the default override.

- The product's core value is **AMOLED-on-glass aesthetic** — gaming dashboards, music players, design tools.
- The audience is **crypto, ML/AI tooling, devtools, terminals** — light reads as out-of-place.
- Marketing has built campaigns around **true-black hero shots** — flipping breaks the visual language.

## Pitfalls

| Pitfall | Fix |
|---|---|
| FOUC: page renders dark for 1 frame, then snaps to light | Move the `ThemeScript` to `<head>`, before any other script — it must execute synchronously before paint |
| React hydration warning ("data-theme attribute mismatch") | Add `suppressHydrationWarning` to `<html>` — the script intentionally diverges from server output |
| `var(--df-bg-base)` is undefined in some component | The component is rendered outside the document tree (e.g. portals to `document.body`). Make sure `:root` declarations live in `globals.css` and that file is imported by `app/layout.tsx` |
| Theme flips work in dev but not after `next build` | Tailwind v4's `@theme` block can shadow `:root` declarations — make sure DF tokens are declared OUTSIDE `@theme`, in plain `:root { ... }` |
| Old code still references `--df-light-*` and shows blank backgrounds | Run the migration sed one-liner above. The deprecated namespace is no longer in `:root` |
| Form input colors don't flip | Add `color-scheme: dark` (or `light`) on `<html>` — the ThemeScript above already does this |

## Cross-references

- `references/00-dark-tokens.md` — the canonical token block, now with the `[data-theme="light"]` override included
- `DESIGN.md` — same architecture documented for non-Claude tools (Stitch, Cursor, Windsurf)
- `references/17-skeleton-system.md` — skeleton tokens flip automatically with the theme
- `references/19-once-ui.md` — Once UI components consume DF tokens via the bridge; they flip with the rest
- `references/inspiration-tour.md` — most named sites (Linear, Stripe, Vercel) ship light variants of their otherwise-dark UIs
