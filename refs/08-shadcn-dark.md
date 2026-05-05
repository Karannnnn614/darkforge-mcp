# Darkforge — shadcn/ui Dark Reference
shadcn/ui is the most-installed React component model in the ecosystem: copy-paste components built on Radix primitives, owned by your repo (not a dependency you upgrade). Darkforge extends it for AMOLED with DF tokens mapped into shadcn's CSS variable layer, plus Framer Motion overlays where Radix's defaults are flat. Current install command is `npx shadcn@latest` (the legacy `shadcn-ui` package was renamed late 2024 — anything still using `shadcn-ui@latest` is outdated).

## Contents

- [Install / Setup](#install-setup)
  - [One-time init](#one-time-init)
  - [Current `components.json` schema](#current-componentsjson-schema)
  - [Tailwind v4 setup (current default)](#tailwind-v4-setup-current-default)
  - [The `cn()` utility](#the-cn-utility)
- [Theme Provider for AMOLED Dark](#theme-provider-for-amoled-dark)
  - [Provider (next-themes)](#provider-next-themes)
- [DF-Token Mapping](#df-token-mapping)
  - [Mapping table](#mapping-table)
  - [globals.css — paste this block](#globalscss-paste-this-block)
- [Component: Button (AMOLED variants)](#component-button-amoled-variants)
  - [Usage](#usage)
- [Component: Card (3 variants)](#component-card-3-variants)
  - [Usage](#usage)
- [Component: Dialog](#component-dialog)
  - [Usage — destructive confirmation](#usage-destructive-confirmation)
- [Component: Popover](#component-popover)
  - [Usage — color picker](#usage-color-picker)
- [Component: Dropdown Menu](#component-dropdown-menu)
  - [Usage — user account menu](#usage-user-account-menu)
- [Component: Command Palette (Cmd+K)](#component-command-palette-cmdk)
  - [Usage — global Cmd+K palette](#usage-global-cmdk-palette)
- [Component: Sheet (Drawer)](#component-sheet-drawer)
  - [Usage — mobile nav](#usage-mobile-nav)
- [Component: Toast / Sonner](#component-toast-sonner)
  - [Usage](#usage)
- [Component: Tabs](#component-tabs)
  - [Usage — settings panel](#usage-settings-panel)
- [Component: Form (Input + Label + FormMessage)](#component-form-input-label-formmessage)
  - [Usage — sign-in form](#usage-sign-in-form)
- [Component: Tooltip](#component-tooltip)
- [Animation Enhancements](#animation-enhancements)
  - [Pattern 1 — Animated list inside Dialog](#pattern-1-animated-list-inside-dialog)
  - [Pattern 2 — Tab indicator with `layoutId`](#pattern-2-tab-indicator-with-layoutid)
  - [Pattern 3 — Sheet swipe-to-dismiss (mobile)](#pattern-3-sheet-swipe-to-dismiss-mobile)
- [Common Gotchas](#common-gotchas)
- [Cross-References](#cross-references)

---

## Install / Setup

shadcn ships as a CLI that scaffolds components into your repo. You own the source — there is no `node_modules/shadcn-ui/Button` to upgrade.

### One-time init

```bash
# Next.js 14/15 App Router (recommended)
npx shadcn@latest init

# Vite + React
npx shadcn@latest init --template vite

# Add a component
npx shadcn@latest add button card dialog popover
```

The CLI asks four questions on init: **style** (`new-york` is the default and the only one we recommend for dark — tighter spacing, sharper borders), **base color**, **CSS variables yes**, **icon library** (`lucide` by default, `radix-icons` optional).

### Current `components.json` schema

```jsonc
// components.json — written by `npx shadcn@latest init`
{
  "$schema": "https://forge.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

Notes:
- `"tailwind.config": ""` is intentional for **Tailwind v4** projects — v4 has no JS config, theming lives in CSS via `@theme`. For v3 projects, point this at `tailwind.config.ts`.
- `"rsc": true` only if Next.js App Router. For Vite/CRA set to `false`.
- `"baseColor": "neutral"` — neutral grayscale is the cleanest base to override with DF tokens.

### Tailwind v4 setup (current default)

```css
/* src/app/globals.css */
@import "tailwindcss";
@import "tw-animate-css"; /* shadcn animation utilities for v4 */

@custom-variant dark (&:is(.dark *));

/* shadcn theme tokens (mapped to DF further down) live here */
```

For Tailwind v3:

```ts
// tailwind.config.ts
import type { Config } from 'tailwindcss'
import animate from 'tailwindcss-animate'

export default {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx,mdx}'],
  plugins: [animate],
} satisfies Config
```

### The `cn()` utility

Every shadcn component uses this. The CLI writes it to `src/lib/utils.ts`:

```ts
// src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
```

`clsx` resolves conditional class arrays, `twMerge` dedupes conflicting Tailwind classes (`px-4 px-2` becomes `px-2`). Always import as `import { cn } from '@/lib/utils'`.

---

## Theme Provider for AMOLED Dark

shadcn doesn't ship a theme provider — it expects you to bring `next-themes` (App Router) or roll your own. Darkforge defaults to **`next-themes` with `forcedTheme="dark"`** because AMOLED is the product, not an option.

### Provider (next-themes)

```tsx
// src/components/providers/theme-provider.tsx
'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'
import type { ThemeProviderProps } from 'next-themes'
import { ReactNode } from 'react'

interface NxThemeProviderProps extends ThemeProviderProps {
  children: ReactNode
}

export function NxThemeProvider({ children, ...props }: NxThemeProviderProps): JSX.Element {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      forcedTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
}
```

```tsx
// src/app/layout.tsx
import './globals.css'
import { NxThemeProvider } from '@/components/providers/theme-provider'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], variable: '--df-font-sans' })

export const metadata: Metadata = {
  title: 'Nexus',
  description: 'Built with Darkforge',
}

export default function RootLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <html lang="en" className={`${inter.variable} dark`} suppressHydrationWarning>
      <body className="bg-background text-foreground antialiased">
        <NxThemeProvider>{children}</NxThemeProvider>
      </body>
    </html>
  )
}
```

The `dark` class on `<html>` (plus `forcedTheme="dark"`) avoids the **theme flash on load** — the most common shadcn dark-mode bug. `suppressHydrationWarning` is required because `next-themes` rewrites the class on mount.

---

## DF-Token Mapping

shadcn ships generic `--background`/`--primary`/etc. CSS variables. We map them straight to DF tokens so every shadcn component you `add` automatically renders AMOLED.

### Mapping table

| shadcn variable | Used by | DF token |
|-----------------|---------|----------|
| `--background` | page bg, dialog backdrop | `--df-bg-base` (`#000`) |
| `--foreground` | body text | `--df-text-primary` (`#fff`) |
| `--card` | card bg | `--df-bg-surface` (`#080808`) |
| `--card-foreground` | card text | `--df-text-primary` |
| `--popover` | popover, dropdown, command bg | `--df-bg-elevated` (`#111`) |
| `--popover-foreground` | popover text | `--df-text-primary` |
| `--primary` | primary button bg, active states | `--df-neon-violet` (`#a78bfa`) |
| `--primary-foreground` | primary button text | `--df-text-inverse` (`#000`) |
| `--secondary` | secondary button, ghost hover | `--df-bg-elevated` |
| `--secondary-foreground` | secondary button text | `--df-text-primary` |
| `--muted` | skeleton, disabled | `--df-bg-muted` (`#222`) |
| `--muted-foreground` | placeholder, captions | `--df-text-secondary` (`#a1a1aa`) |
| `--accent` | hover bg on menu items | `--df-bg-hover` (`#2a2a2a`) |
| `--accent-foreground` | hover text on menu items | `--df-text-primary` |
| `--destructive` | destructive button, error | `--df-neon-red` (`#f87171`) |
| `--destructive-foreground` | destructive button text | `--df-text-inverse` |
| `--border` | borders | `--df-border-default` |
| `--input` | input border | `--df-border-default` |
| `--ring` | focus ring | `--df-border-focus` (violet 50%) |
| `--radius` | base radius | `--df-radius-md` (10px) |

### globals.css — paste this block

```css
/* src/app/globals.css */
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

/* ============================================
   DARKFORGE TOKENS (full set)
   ============================================ */
:root {
  /* Backgrounds */
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
  --df-glow-violet:   0 0 20px rgba(167, 139, 250, 0.35);
  --df-glow-violet-lg:0 0 40px rgba(167, 139, 250, 0.25);
  --df-glow-cyan:     0 0 20px rgba(34, 211, 238, 0.35);
  --df-glow-pink:     0 0 20px rgba(244, 114, 182, 0.35);
  --df-glow-green:    0 0 20px rgba(74, 222, 128, 0.35);
  --df-glow-red:      0 0 20px rgba(248, 113, 113, 0.35);

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

  /* ============================================
     SHADCN TOKENS — mapped to DF
     Both :root and .dark hold the same values
     because Darkforge ships dark-only.
     ============================================ */
  --background:           var(--df-bg-base);
  --foreground:           var(--df-text-primary);
  --card:                 var(--df-bg-surface);
  --card-foreground:      var(--df-text-primary);
  --popover:              var(--df-bg-elevated);
  --popover-foreground:   var(--df-text-primary);
  --primary:              var(--df-neon-violet);
  --primary-foreground:   var(--df-text-inverse);
  --secondary:            var(--df-bg-elevated);
  --secondary-foreground: var(--df-text-primary);
  --muted:                var(--df-bg-muted);
  --muted-foreground:     var(--df-text-secondary);
  --accent:               var(--df-bg-hover);
  --accent-foreground:    var(--df-text-primary);
  --destructive:          var(--df-neon-red);
  --destructive-foreground: var(--df-text-inverse);
  --border:               var(--df-border-default);
  --input:                var(--df-border-default);
  --ring:                 var(--df-border-focus);
  --radius:               var(--df-radius-md);

  /* Sidebar (shadcn v4 sidebar component) */
  --sidebar:                       var(--df-bg-surface);
  --sidebar-foreground:            var(--df-text-primary);
  --sidebar-primary:               var(--df-neon-violet);
  --sidebar-primary-foreground:    var(--df-text-inverse);
  --sidebar-accent:                var(--df-bg-hover);
  --sidebar-accent-foreground:     var(--df-text-primary);
  --sidebar-border:                var(--df-border-subtle);
  --sidebar-ring:                  var(--df-border-focus);

  /* Chart palette (data viz) */
  --chart-1: var(--df-neon-violet);
  --chart-2: var(--df-neon-cyan);
  --chart-3: var(--df-neon-pink);
  --chart-4: var(--df-neon-green);
  --chart-5: var(--df-neon-amber);
}

.dark {
  /* Same values — dark is the only mode. Kept so shadcn's
     `dark:` variants and components expecting .dark still resolve. */
  --background:           var(--df-bg-base);
  --foreground:           var(--df-text-primary);
  --card:                 var(--df-bg-surface);
  --card-foreground:      var(--df-text-primary);
  --popover:              var(--df-bg-elevated);
  --popover-foreground:   var(--df-text-primary);
  --primary:              var(--df-neon-violet);
  --primary-foreground:   var(--df-text-inverse);
  --secondary:            var(--df-bg-elevated);
  --secondary-foreground: var(--df-text-primary);
  --muted:                var(--df-bg-muted);
  --muted-foreground:     var(--df-text-secondary);
  --accent:               var(--df-bg-hover);
  --accent-foreground:    var(--df-text-primary);
  --destructive:          var(--df-neon-red);
  --destructive-foreground: var(--df-text-inverse);
  --border:               var(--df-border-default);
  --input:                var(--df-border-default);
  --ring:                 var(--df-border-focus);
  --radius:               var(--df-radius-md);
}

/* Tailwind v4 — bind shadcn vars into the @theme layer */
@theme inline {
  --color-background:           var(--background);
  --color-foreground:           var(--foreground);
  --color-card:                 var(--card);
  --color-card-foreground:      var(--card-foreground);
  --color-popover:              var(--popover);
  --color-popover-foreground:   var(--popover-foreground);
  --color-primary:              var(--primary);
  --color-primary-foreground:   var(--primary-foreground);
  --color-secondary:            var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted:                var(--muted);
  --color-muted-foreground:     var(--muted-foreground);
  --color-accent:               var(--accent);
  --color-accent-foreground:    var(--accent-foreground);
  --color-destructive:          var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border:               var(--border);
  --color-input:                var(--input);
  --color-ring:                 var(--ring);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: var(--radius);
  --radius-lg: calc(var(--radius) + 4px);
  --radius-xl: calc(var(--radius) + 8px);
}

@layer base {
  * { border-color: var(--border); }
  body {
    background: var(--background);
    color: var(--foreground);
    font-family: 'Inter', system-ui, sans-serif;
  }
  /* Selection in violet */
  ::selection {
    background: rgba(167, 139, 250, 0.3);
    color: #fff;
  }
  /* Custom scrollbar — AMOLED appropriate */
  ::-webkit-scrollbar { width: 10px; height: 10px; }
  ::-webkit-scrollbar-track { background: var(--df-bg-base); }
  ::-webkit-scrollbar-thumb {
    background: var(--df-border-strong);
    border-radius: 5px;
  }
  ::-webkit-scrollbar-thumb:hover { background: var(--df-neon-violet); }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

After this, every shadcn component you `npx shadcn@latest add` is automatically AMOLED. No further edits needed to the generated files for theming — just for variants and animation upgrades below.

---

## Component: Button (AMOLED variants)

The shadcn-generated `Button` is solid but flat. Darkforge replaces the `buttonVariants` with neon-aware variants. Drop this in place of the file `npx shadcn@latest add button` writes.

```tsx
// src/components/ui/button.tsx
'use client'

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  // base
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--df-radius-md)]',
    'text-sm font-medium select-none',
    'transition-[transform,box-shadow,background,border-color] duration-200',
    '[transition-timing-function:cubic-bezier(0.16,1,0.3,1)]',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]',
    'disabled:pointer-events-none disabled:opacity-50',
    'active:scale-[0.98]',
    'motion-reduce:transition-none motion-reduce:active:scale-100',
  ].join(' '),
  {
    variants: {
      variant: {
        primary: [
          'bg-[var(--df-neon-violet)] text-[var(--df-text-inverse)]',
          'shadow-[var(--df-glow-violet)]',
          'hover:shadow-[var(--df-glow-violet-lg)] hover:-translate-y-px',
          'hover:bg-[var(--df-neon-violet)]/90',
        ].join(' '),
        secondary: [
          'bg-[var(--df-glass-bg-md)] text-[var(--df-text-primary)]',
          'border border-[var(--df-border-default)] backdrop-blur-md',
          'hover:border-[var(--df-border-focus)] hover:bg-[var(--df-bg-hover)]',
          'hover:shadow-[var(--df-glow-violet)]',
        ].join(' '),
        destructive: [
          'bg-[var(--df-neon-red)]/10 text-[var(--df-neon-red)]',
          'border border-[var(--df-neon-red)]/30',
          'hover:bg-[var(--df-neon-red)]/15 hover:border-[var(--df-neon-red)]/60',
          'hover:shadow-[var(--df-glow-red)]',
        ].join(' '),
        ghost: [
          'bg-transparent text-[var(--df-text-secondary)]',
          'hover:bg-[var(--df-bg-hover)] hover:text-[var(--df-text-primary)]',
        ].join(' '),
        outline: [
          'bg-transparent text-[var(--df-text-primary)]',
          'border border-[var(--df-border-default)]',
          'hover:border-[var(--df-border-focus)] hover:bg-[var(--df-glass-bg)]',
        ].join(' '),
        link: [
          'bg-transparent text-[var(--df-neon-violet)] underline-offset-4',
          'hover:underline',
        ].join(' '),
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4',
        lg: 'h-12 px-6 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  iconLeft?: React.ReactNode
  iconRight?: React.ReactNode
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, iconLeft, iconRight, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : iconLeft}
        {children}
        {!loading && iconRight}
      </Comp>
    )
  },
)
Button.displayName = 'Button'

export { buttonVariants }
```

### Usage

```tsx
'use client'

import { Button } from '@/components/ui/button'
import { ArrowRight, Trash2 } from 'lucide-react'

export function ButtonShowcase(): JSX.Element {
  return (
    <div className="flex flex-wrap items-center gap-3 p-8 bg-[var(--df-bg-base)]">
      <Button>Get started</Button>
      <Button variant="secondary" iconRight={<ArrowRight className="size-4" />}>
        View pricing
      </Button>
      <Button variant="destructive" iconLeft={<Trash2 className="size-4" />}>
        Delete workspace
      </Button>
      <Button variant="ghost">Cancel</Button>
      <Button variant="outline">Documentation</Button>
      <Button variant="link">Read changelog</Button>
      <Button loading>Saving</Button>
      <Button disabled>Unavailable</Button>
    </div>
  )
}
```

`asChild` lets you wrap a Next.js `<Link>`: `<Button asChild><Link href="/billing">Billing</Link></Button>`.

---

## Component: Card (3 variants)

shadcn's default Card is a single surface variant. Darkforge exposes three: `surface`, `elevated`, `glass`.

```tsx
// src/components/ui/card.tsx
import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const cardVariants = cva(
  'rounded-[var(--df-radius-lg)] text-[var(--card-foreground)] transition-[border-color,box-shadow] duration-300 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)]',
  {
    variants: {
      variant: {
        surface: [
          'bg-[var(--df-bg-surface)]',
          'border border-[var(--df-border-subtle)]',
          'hover:border-[var(--df-border-default)]',
        ].join(' '),
        elevated: [
          'bg-[var(--df-bg-elevated)]',
          'border border-[var(--df-border-default)]',
          'shadow-[0_8px_32px_rgba(0,0,0,0.5)]',
          'hover:border-[var(--df-border-focus)]',
          'hover:shadow-[0_12px_40px_rgba(0,0,0,0.6),var(--df-glow-violet)]',
        ].join(' '),
        glass: [
          'bg-[var(--df-glass-bg)] backdrop-blur-xl backdrop-saturate-[180%]',
          'border border-[var(--df-glass-border)]',
          'hover:border-[var(--df-border-focus)]',
          'hover:shadow-[var(--df-glow-violet)]',
        ].join(' '),
      },
    },
    defaultVariants: { variant: 'surface' },
  },
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, ...props }, ref) => (
    <div ref={ref} className={cn(cardVariants({ variant }), className)} {...props} />
  ),
)
Card.displayName = 'Card'

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col gap-1.5 p-6', className)} {...props} />
  ),
)
CardHeader.displayName = 'CardHeader'

export const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn('text-lg font-semibold tracking-tight text-[var(--df-text-primary)]', className)} {...props} />
  ),
)
CardTitle.displayName = 'CardTitle'

export const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm text-[var(--df-text-secondary)] leading-relaxed', className)} {...props} />
  ),
)
CardDescription.displayName = 'CardDescription'

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />,
)
CardContent.displayName = 'CardContent'

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center gap-3 p-6 pt-0', className)} {...props} />
  ),
)
CardFooter.displayName = 'CardFooter'
```

### Usage

```tsx
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sparkles } from 'lucide-react'

export function PricingTier(): JSX.Element {
  return (
    <Card variant="elevated" className="max-w-sm">
      <CardHeader>
        <div className="flex items-center gap-2 text-[var(--df-neon-violet)]">
          <Sparkles className="size-4" aria-hidden />
          <span className="text-xs font-medium uppercase tracking-wider">Pro</span>
        </div>
        <CardTitle>$24/mo per seat</CardTitle>
        <CardDescription>
          Unlimited workspaces, real-time collaboration, audit logs, SSO.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-[var(--df-text-secondary)]">
        <p>Includes everything in Starter, plus:</p>
        <ul className="space-y-1.5">
          <li>SAML / OIDC single sign-on</li>
          <li>SOC 2 Type II compliance</li>
          <li>99.99% uptime SLA</li>
        </ul>
      </CardContent>
      <CardFooter>
        <Button className="w-full">Start free trial</Button>
      </CardFooter>
    </Card>
  )
}
```

---

## Component: Dialog

Radix Dialog is solid for a11y (focus trap, ESC, click-outside, scroll lock). Darkforge replaces the visual layer with an elevated dark surface and animated backdrop blur.

```tsx
// src/components/ui/dialog.tsx
'use client'

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger
export const DialogPortal = DialogPrimitive.Portal
export const DialogClose = DialogPrimitive.Close

export const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-[400]',
      'bg-black/70 backdrop-blur-md',
      'data-[state=open]:animate-in data-[state=open]:fade-in-0',
      'data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
      'motion-reduce:data-[state=open]:animate-none motion-reduce:data-[state=closed]:animate-none',
      className,
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

export const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed left-1/2 top-1/2 z-[401] -translate-x-1/2 -translate-y-1/2',
        'w-[calc(100%-2rem)] max-w-lg',
        'bg-[var(--df-bg-elevated)] text-[var(--df-text-primary)]',
        'border border-[var(--df-border-default)] rounded-[var(--df-radius-lg)]',
        'shadow-[0_24px_64px_rgba(0,0,0,0.6),0_0_0_1px_rgba(167,139,250,0.08),var(--df-glow-violet-lg)]',
        'p-6',
        'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-top-4',
        'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:slide-out-to-top-4',
        'duration-200',
        'motion-reduce:data-[state=open]:animate-none motion-reduce:data-[state=closed]:animate-none',
        'focus:outline-none',
        className,
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close
        className="absolute right-4 top-4 rounded-md p-1.5 text-[var(--df-text-secondary)] hover:text-[var(--df-text-primary)] hover:bg-[var(--df-bg-hover)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
        aria-label="Close dialog"
      >
        <X className="size-4" aria-hidden />
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>): JSX.Element {
  return <div className={cn('flex flex-col gap-1.5 mb-4', className)} {...props} />
}

export function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>): JSX.Element {
  return <div className={cn('flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-6', className)} {...props} />
}

export const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('text-lg font-semibold tracking-tight text-[var(--df-text-primary)]', className)}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

export const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-sm text-[var(--df-text-secondary)] leading-relaxed', className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName
```

### Usage — destructive confirmation

```tsx
'use client'

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

export function DeleteWorkspaceDialog({ workspaceName }: { workspaceName: string }): JSX.Element {
  const [open, setOpen] = useState(false)

  async function handleDelete(): Promise<void> {
    // call your server action here
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive">Delete workspace</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete &quot;{workspaceName}&quot;?</DialogTitle>
          <DialogDescription>
            This permanently removes all projects, billing history, and team members.
            This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="destructive" onClick={handleDelete}>I understand, delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

Radix handles ESC, click-outside (`onOpenChange(false)`), focus trap, return focus to trigger, and `aria-modal="true"` automatically.

---

## Component: Popover

```tsx
// src/components/ui/popover.tsx
'use client'

import * as React from 'react'
import * as PopoverPrimitive from '@radix-ui/react-popover'
import { cn } from '@/lib/utils'

export const Popover = PopoverPrimitive.Root
export const PopoverTrigger = PopoverPrimitive.Trigger
export const PopoverAnchor = PopoverPrimitive.Anchor

export const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = 'center', sideOffset = 8, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        'z-[300] w-72 p-4',
        'bg-[var(--df-bg-elevated)] text-[var(--df-text-primary)]',
        'border border-[var(--df-border-default)] rounded-[var(--df-radius-md)]',
        'shadow-[0_16px_48px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.04)]',
        'backdrop-blur-xl',
        'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
        'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
        'data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2',
        'data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2',
        'duration-150',
        'motion-reduce:data-[state=open]:animate-none motion-reduce:data-[state=closed]:animate-none',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
        className,
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
))
PopoverContent.displayName = PopoverPrimitive.Content.displayName
```

### Usage — color picker

```tsx
'use client'

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Palette } from 'lucide-react'

const ACCENT_COLORS = [
  { name: 'Violet', value: 'var(--df-neon-violet)' },
  { name: 'Cyan',   value: 'var(--df-neon-cyan)' },
  { name: 'Pink',   value: 'var(--df-neon-pink)' },
  { name: 'Green',  value: 'var(--df-neon-green)' },
  { name: 'Amber',  value: 'var(--df-neon-amber)' },
] as const

export function AccentColorPicker({ onSelect }: { onSelect: (value: string) => void }): JSX.Element {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Pick accent color">
          <Palette className="size-4" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56">
        <p className="text-xs font-medium text-[var(--df-text-secondary)] mb-3">Accent color</p>
        <div className="grid grid-cols-5 gap-2">
          {ACCENT_COLORS.map((c) => (
            <button
              key={c.name}
              onClick={() => onSelect(c.value)}
              className="size-8 rounded-md border border-[var(--df-border-subtle)] hover:scale-110 hover:border-white/30 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] motion-reduce:hover:scale-100"
              style={{ background: c.value }}
              aria-label={c.name}
              title={c.name}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
```

---

## Component: Dropdown Menu

```tsx
// src/components/ui/dropdown-menu.tsx
'use client'

import * as React from 'react'
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import { Check, ChevronRight, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'

export const DropdownMenu = DropdownMenuPrimitive.Root
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger
export const DropdownMenuGroup = DropdownMenuPrimitive.Group
export const DropdownMenuPortal = DropdownMenuPrimitive.Portal
export const DropdownMenuSub = DropdownMenuPrimitive.Sub
export const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup

export const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 6, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        'z-[300] min-w-[12rem] overflow-hidden p-1',
        'bg-[var(--df-bg-elevated)] text-[var(--df-text-primary)]',
        'border border-[var(--df-border-default)] rounded-[var(--df-radius-md)]',
        'shadow-[0_16px_48px_rgba(0,0,0,0.6)] backdrop-blur-xl',
        'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
        'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
        'data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2',
        'duration-150 motion-reduce:animate-none',
        className,
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
))
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName

const itemBase =
  'relative flex select-none items-center gap-2 rounded-[var(--df-radius-sm)] px-2 py-1.5 text-sm outline-none transition-colors duration-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 cursor-pointer'

export const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & { inset?: boolean; destructive?: boolean }
>(({ className, inset, destructive, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      itemBase,
      inset && 'pl-8',
      destructive
        ? 'text-[var(--df-neon-red)] focus:bg-[var(--df-neon-red)]/10 focus:text-[var(--df-neon-red)]'
        : 'text-[var(--df-text-primary)] focus:bg-[var(--df-bg-hover)] focus:text-[var(--df-neon-violet)]',
      className,
    )}
    {...props}
  />
))
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName

export const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    checked={checked}
    className={cn(itemBase, 'pl-8 focus:bg-[var(--df-bg-hover)]', className)}
    {...props}
  >
    <span className="absolute left-2 flex size-4 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Check className="size-3.5 text-[var(--df-neon-violet)]" aria-hidden />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
))
DropdownMenuCheckboxItem.displayName = DropdownMenuPrimitive.CheckboxItem.displayName

export const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn('px-2 py-1.5 text-xs font-medium uppercase tracking-wider text-[var(--df-text-muted)]', className)}
    {...props}
  />
))
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName

export const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn('-mx-1 my-1 h-px bg-[var(--df-border-subtle)]', className)}
    {...props}
  />
))
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName

export function DropdownMenuShortcut({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>): JSX.Element {
  return (
    <span
      className={cn('ml-auto text-xs tracking-widest text-[var(--df-text-muted)] font-mono', className)}
      {...props}
    />
  )
}
```

### Usage — user account menu

```tsx
'use client'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Settings, CreditCard, LogOut, User } from 'lucide-react'

export function UserMenu({ email }: { email: string }): JSX.Element {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Account menu">
          <User className="size-4" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>{email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <User className="size-4" aria-hidden />
          Profile
          <DropdownMenuShortcut>P</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <CreditCard className="size-4" aria-hidden />
          Billing
          <DropdownMenuShortcut>B</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Settings className="size-4" aria-hidden />
          Settings
          <DropdownMenuShortcut>,</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem destructive>
          <LogOut className="size-4" aria-hidden />
          Sign out
          <DropdownMenuShortcut>Q</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

---

## Component: Command Palette (Cmd+K)

shadcn's Command is built on `cmdk`. The default works — Darkforge tightens the visual layer and adds the global Cmd+K binding.

```tsx
// src/components/ui/command.tsx
'use client'

import * as React from 'react'
import { Command as CommandPrimitive } from 'cmdk'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'

export const Command = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    className={cn(
      'flex h-full w-full flex-col overflow-hidden rounded-[var(--df-radius-lg)]',
      'bg-[var(--df-bg-elevated)] text-[var(--df-text-primary)]',
      className,
    )}
    {...props}
  />
))
Command.displayName = CommandPrimitive.displayName

interface CommandDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

export function CommandDialog({ open, onOpenChange, children }: CommandDialogProps): JSX.Element {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 max-w-xl border-[var(--df-border-default)] shadow-[0_24px_64px_rgba(0,0,0,0.7),var(--df-glow-violet-lg)]">
        <Command className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-[var(--df-text-muted)]">
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  )
}

export const CommandInput = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Input>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(({ className, ...props }, ref) => (
  <div className="flex items-center gap-2 border-b border-[var(--df-border-subtle)] px-4" cmdk-input-wrapper="">
    <Search className="size-4 text-[var(--df-text-muted)]" aria-hidden />
    <CommandPrimitive.Input
      ref={ref}
      className={cn(
        'flex h-12 w-full bg-transparent text-sm text-[var(--df-text-primary)] outline-none',
        'placeholder:text-[var(--df-text-muted)] disabled:opacity-50',
        className,
      )}
      {...props}
    />
  </div>
))
CommandInput.displayName = CommandPrimitive.Input.displayName

export const CommandList = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.List
    ref={ref}
    className={cn('max-h-[320px] overflow-y-auto overflow-x-hidden p-2', className)}
    {...props}
  />
))
CommandList.displayName = CommandPrimitive.List.displayName

export const CommandEmpty = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Empty>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
>((props, ref) => (
  <CommandPrimitive.Empty ref={ref} className="py-8 text-center text-sm text-[var(--df-text-muted)]" {...props} />
))
CommandEmpty.displayName = CommandPrimitive.Empty.displayName

export const CommandGroup = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Group ref={ref} className={cn('overflow-hidden p-1 text-[var(--df-text-primary)]', className)} {...props} />
))
CommandGroup.displayName = CommandPrimitive.Group.displayName

export const CommandSeparator = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Separator ref={ref} className={cn('-mx-1 h-px bg-[var(--df-border-subtle)]', className)} {...props} />
))
CommandSeparator.displayName = CommandPrimitive.Separator.displayName

export const CommandItem = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex cursor-pointer select-none items-center gap-2 rounded-[var(--df-radius-sm)] px-2 py-2 text-sm outline-none',
      'data-[selected=true]:bg-[var(--df-bg-hover)] data-[selected=true]:text-[var(--df-neon-violet)]',
      'data-[selected=true]:shadow-[inset_0_0_0_1px_rgba(167,139,250,0.2)]',
      'transition-colors duration-100',
      'data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50',
      className,
    )}
    {...props}
  />
))
CommandItem.displayName = CommandPrimitive.Item.displayName

export function CommandShortcut({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>): JSX.Element {
  return (
    <span
      className={cn(
        'ml-auto inline-flex items-center gap-0.5 rounded-[var(--df-radius-xs)] border border-[var(--df-border-subtle)] bg-[var(--df-bg-base)] px-1.5 py-0.5 text-[10px] font-mono text-[var(--df-text-muted)]',
        className,
      )}
      {...props}
    />
  )
}
```

### Usage — global Cmd+K palette

```tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command'
import { FileText, Plus, Search, Settings, User } from 'lucide-react'

export function GlobalCommandMenu(): JSX.Element {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent): void {
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  function go(path: string): void {
    setOpen(false)
    router.push(path)
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search projects, settings, docs…" />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>
        <CommandGroup heading="Suggestions">
          <CommandItem onSelect={() => go('/projects/new')}>
            <Plus className="size-4" aria-hidden />
            Create project
            <CommandShortcut>N</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => go('/search')}>
            <Search className="size-4" aria-hidden />
            Search workspace
            <CommandShortcut>/</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => go('/docs')}>
            <FileText className="size-4" aria-hidden />
            Documentation
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Account">
          <CommandItem onSelect={() => go('/profile')}>
            <User className="size-4" aria-hidden />
            Profile
            <CommandShortcut>P</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => go('/settings')}>
            <Settings className="size-4" aria-hidden />
            Settings
            <CommandShortcut>,</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
```

Mount `<GlobalCommandMenu />` once in your root layout client wrapper. `cmdk` handles fuzzy filter, arrow nav, Enter to select, ESC to close.

---

## Component: Sheet (Drawer)

```tsx
// src/components/ui/sheet.tsx
'use client'

import * as React from 'react'
import * as SheetPrimitive from '@radix-ui/react-dialog'
import { cva, type VariantProps } from 'class-variance-authority'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export const Sheet = SheetPrimitive.Root
export const SheetTrigger = SheetPrimitive.Trigger
export const SheetClose = SheetPrimitive.Close
export const SheetPortal = SheetPrimitive.Portal

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-[400] bg-black/70 backdrop-blur-md',
      'data-[state=open]:animate-in data-[state=open]:fade-in-0',
      'data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
      'motion-reduce:animate-none',
      className,
    )}
    {...props}
  />
))
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName

const sheetVariants = cva(
  [
    'fixed z-[401] gap-4 p-6',
    'bg-[var(--df-bg-elevated)] text-[var(--df-text-primary)]',
    'border-[var(--df-border-default)] shadow-[0_24px_64px_rgba(0,0,0,0.6)]',
    'transition ease-out',
    'data-[state=open]:animate-in data-[state=open]:duration-300',
    'data-[state=closed]:animate-out data-[state=closed]:duration-200',
    'motion-reduce:animate-none',
  ].join(' '),
  {
    variants: {
      side: {
        top: 'inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top',
        bottom: 'inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
        left: 'inset-y-0 left-0 h-full w-3/4 sm:max-w-sm border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left',
        right: 'inset-y-0 right-0 h-full w-3/4 sm:max-w-sm border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right',
      },
    },
    defaultVariants: { side: 'right' },
  },
)

interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>,
    VariantProps<typeof sheetVariants> {}

export const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  SheetContentProps
>(({ side = 'right', className, children, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <SheetPrimitive.Content ref={ref} className={cn(sheetVariants({ side }), className)} {...props}>
      {children}
      <SheetPrimitive.Close
        className="absolute right-4 top-4 rounded-md p-1.5 text-[var(--df-text-secondary)] hover:text-[var(--df-text-primary)] hover:bg-[var(--df-bg-hover)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
        aria-label="Close panel"
      >
        <X className="size-4" aria-hidden />
      </SheetPrimitive.Close>
    </SheetPrimitive.Content>
  </SheetPortal>
))
SheetContent.displayName = SheetPrimitive.Content.displayName

export function SheetHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>): JSX.Element {
  return <div className={cn('flex flex-col gap-1.5 mb-6', className)} {...props} />
}

export const SheetTitle = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    className={cn('text-lg font-semibold tracking-tight text-[var(--df-text-primary)]', className)}
    {...props}
  />
))
SheetTitle.displayName = SheetPrimitive.Title.displayName

export const SheetDescription = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description
    ref={ref}
    className={cn('text-sm text-[var(--df-text-secondary)]', className)}
    {...props}
  />
))
SheetDescription.displayName = SheetPrimitive.Description.displayName
```

### Usage — mobile nav

```tsx
'use client'

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Menu } from 'lucide-react'
import Link from 'next/link'

export function MobileNav(): JSX.Element {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
          <Menu className="size-5" aria-hidden />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px]">
        <SheetHeader>
          <SheetTitle>Nexus</SheetTitle>
          <SheetDescription>Navigate your workspace</SheetDescription>
        </SheetHeader>
        <nav className="flex flex-col gap-1">
          {[
            { label: 'Dashboard', href: '/' },
            { label: 'Projects',  href: '/projects' },
            { label: 'Team',      href: '/team' },
            { label: 'Billing',   href: '/billing' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-3 py-2 rounded-md text-sm text-[var(--df-text-secondary)] hover:bg-[var(--df-bg-hover)] hover:text-[var(--df-neon-violet)] transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
```

---

## Component: Toast / Sonner

shadcn now ships **Sonner** as the default toast (the older `Toast` component is deprecated). Add via `npx shadcn@latest add sonner`.

```tsx
// src/components/ui/sonner.tsx
'use client'

import { Toaster as SonnerToaster, type ToasterProps } from 'sonner'

export function Toaster(props: ToasterProps): JSX.Element {
  return (
    <SonnerToaster
      theme="dark"
      position="bottom-right"
      richColors={false}
      closeButton
      toastOptions={{
        unstyled: false,
        classNames: {
          toast: [
            'group toast',
            'bg-[var(--df-bg-elevated)] text-[var(--df-text-primary)]',
            'border border-[var(--df-border-default)] rounded-[var(--df-radius-md)]',
            'shadow-[0_16px_48px_rgba(0,0,0,0.6)] backdrop-blur-xl',
          ].join(' '),
          title: 'text-sm font-medium text-[var(--df-text-primary)]',
          description: 'text-xs text-[var(--df-text-secondary)]',
          actionButton: 'bg-[var(--df-neon-violet)] text-[var(--df-text-inverse)] rounded-md px-2 py-1 text-xs font-medium',
          cancelButton: 'bg-[var(--df-bg-hover)] text-[var(--df-text-secondary)] rounded-md px-2 py-1 text-xs',
          success: 'border-l-2 border-l-[var(--df-neon-green)]',
          error: 'border-l-2 border-l-[var(--df-neon-red)]',
          warning: 'border-l-2 border-l-[var(--df-neon-amber)]',
          info: 'border-l-2 border-l-[var(--df-neon-cyan)]',
          closeButton: 'bg-[var(--df-bg-elevated)] border-[var(--df-border-default)] text-[var(--df-text-secondary)]',
        },
      }}
      {...props}
    />
  )
}
```

Mount once in root layout:

```tsx
// src/app/layout.tsx (excerpt)
import { Toaster } from '@/components/ui/sonner'

// inside <body>:
<NxThemeProvider>
  {children}
  <Toaster />
</NxThemeProvider>
```

### Usage

```tsx
'use client'

import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

export function SaveProfileButton(): JSX.Element {
  async function save(): Promise<void> {
    try {
      // await saveProfile()
      toast.success('Profile updated', { description: 'Changes synced across all sessions.' })
    } catch {
      toast.error('Could not save', {
        description: 'Check your connection and try again.',
        action: { label: 'Retry', onClick: save },
      })
    }
  }
  return <Button onClick={save}>Save profile</Button>
}
```

`toast.promise(fetch(...), { loading, success, error })` is also valuable for async work — Sonner swaps the toast in place.

---

## Component: Tabs

```tsx
// src/components/ui/tabs.tsx
'use client'

import * as React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cn } from '@/lib/utils'

export const Tabs = TabsPrimitive.Root

export const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      'relative inline-flex h-10 items-center gap-1 border-b border-[var(--df-border-subtle)]',
      className,
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

export const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'relative inline-flex items-center px-4 py-2 text-sm font-medium',
      'text-[var(--df-text-secondary)] transition-colors duration-200',
      'hover:text-[var(--df-text-primary)]',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] rounded-t-md',
      'data-[state=active]:text-[var(--df-neon-violet)]',
      // Animated underline via pseudo
      'after:absolute after:left-2 after:right-2 after:bottom-[-1px] after:h-[2px]',
      'after:bg-[var(--df-neon-violet)] after:rounded-full',
      'after:scale-x-0 after:origin-center after:transition-transform after:duration-300',
      'data-[state=active]:after:scale-x-100',
      'data-[state=active]:after:shadow-[0_0_12px_rgba(167,139,250,0.6)]',
      'motion-reduce:after:transition-none',
      'disabled:pointer-events-none disabled:opacity-50',
      className,
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

export const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'mt-4 focus-visible:outline-none',
      'data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:slide-in-from-bottom-1 data-[state=active]:duration-200',
      'motion-reduce:animate-none',
      className,
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName
```

### Usage — settings panel

```tsx
'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function SettingsTabs(): JSX.Element {
  return (
    <Tabs defaultValue="account" className="w-full">
      <TabsList>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="security">Security</TabsTrigger>
        <TabsTrigger value="billing">Billing</TabsTrigger>
        <TabsTrigger value="api">API keys</TabsTrigger>
      </TabsList>
      <TabsContent value="account">
        <Card variant="surface">
          <CardHeader><CardTitle>Account</CardTitle></CardHeader>
          <CardContent className="text-sm text-[var(--df-text-secondary)]">
            Profile, name, avatar, and email preferences.
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="security">
        <Card variant="surface">
          <CardHeader><CardTitle>Security</CardTitle></CardHeader>
          <CardContent className="text-sm text-[var(--df-text-secondary)]">
            Two-factor authentication, active sessions, and recovery codes.
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="billing">
        <Card variant="surface">
          <CardHeader><CardTitle>Billing</CardTitle></CardHeader>
          <CardContent className="text-sm text-[var(--df-text-secondary)]">
            Plan, payment method, invoices.
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="api">
        <Card variant="surface">
          <CardHeader><CardTitle>API keys</CardTitle></CardHeader>
          <CardContent className="text-sm text-[var(--df-text-secondary)]">
            Generate, rotate, and revoke programmatic access tokens.
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
```

---

## Component: Form (Input + Label + FormMessage)

shadcn forms wrap `react-hook-form` with `zod` validation. The `<Form>` provides field-level context so error messages auto-link to their inputs.

```tsx
// src/components/ui/input.tsx
import * as React from 'react'
import { cn } from '@/lib/utils'

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        'flex h-10 w-full rounded-[var(--df-radius-md)] px-3 text-sm',
        'bg-[var(--df-bg-elevated)] text-[var(--df-text-primary)]',
        'border border-[var(--df-border-default)]',
        'placeholder:text-[var(--df-text-muted)]',
        'transition-[border-color,box-shadow] duration-150',
        'focus:outline-none focus:border-[var(--df-border-focus)] focus:shadow-[0_0_0_3px_rgba(167,139,250,0.15)]',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'aria-[invalid=true]:border-[var(--df-neon-red)] aria-[invalid=true]:focus:shadow-[0_0_0_3px_rgba(248,113,113,0.15)]',
        'file:border-0 file:bg-transparent file:text-sm file:font-medium',
        className,
      )}
      {...props}
    />
  ),
)
Input.displayName = 'Input'
```

```tsx
// src/components/ui/label.tsx
'use client'

import * as React from 'react'
import * as LabelPrimitive from '@radix-ui/react-label'
import { cn } from '@/lib/utils'

export const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(
      'text-sm font-medium leading-none text-[var(--df-text-secondary)]',
      'peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
      className,
    )}
    {...props}
  />
))
Label.displayName = LabelPrimitive.Root.displayName
```

```tsx
// src/components/ui/form.tsx
'use client'

import * as React from 'react'
import * as LabelPrimitive from '@radix-ui/react-label'
import { Slot } from '@radix-ui/react-slot'
import {
  Controller,
  FormProvider,
  useFormContext,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export const Form = FormProvider

interface FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
  name: TName
}

const FormFieldContext = React.createContext<FormFieldContextValue | null>(null)

export function FormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(props: ControllerProps<TFieldValues, TName>): JSX.Element {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  )
}

interface FormItemContextValue {
  id: string
}
const FormItemContext = React.createContext<FormItemContextValue | null>(null)

function useFormField() {
  const fieldContext = React.useContext(FormFieldContext)
  const itemContext = React.useContext(FormItemContext)
  const { getFieldState, formState } = useFormContext()
  if (!fieldContext) throw new Error('useFormField must be inside <FormField>')
  if (!itemContext) throw new Error('useFormField must be inside <FormItem>')
  const fieldState = getFieldState(fieldContext.name, formState)
  const id = itemContext.id
  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  }
}

export const FormItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const id = React.useId()
    return (
      <FormItemContext.Provider value={{ id }}>
        <div ref={ref} className={cn('flex flex-col gap-1.5', className)} {...props} />
      </FormItemContext.Provider>
    )
  },
)
FormItem.displayName = 'FormItem'

export const FormLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => {
  const { error, formItemId } = useFormField()
  return (
    <Label
      ref={ref}
      className={cn(error && 'text-[var(--df-neon-red)]', className)}
      htmlFor={formItemId}
      {...props}
    />
  )
})
FormLabel.displayName = 'FormLabel'

export const FormControl = React.forwardRef<
  React.ElementRef<typeof Slot>,
  React.ComponentPropsWithoutRef<typeof Slot>
>(({ ...props }, ref) => {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField()
  return (
    <Slot
      ref={ref}
      id={formItemId}
      aria-describedby={!error ? formDescriptionId : `${formDescriptionId} ${formMessageId}`}
      aria-invalid={!!error}
      {...props}
    />
  )
})
FormControl.displayName = 'FormControl'

export const FormDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => {
    const { formDescriptionId } = useFormField()
    return (
      <p
        ref={ref}
        id={formDescriptionId}
        className={cn('text-xs text-[var(--df-text-muted)]', className)}
        {...props}
      />
    )
  },
)
FormDescription.displayName = 'FormDescription'

export const FormMessage = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, children, ...props }, ref) => {
    const { error, formMessageId } = useFormField()
    const body = error ? String(error.message ?? '') : children
    if (!body) return null
    return (
      <p
        ref={ref}
        id={formMessageId}
        className={cn('text-xs text-[var(--df-neon-red)] flex items-center gap-1', className)}
        {...props}
      >
        {body}
      </p>
    )
  },
)
FormMessage.displayName = 'FormMessage'
```

### Usage — sign-in form

```tsx
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { toast } from 'sonner'

const signInSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'At least 8 characters'),
})
type SignInValues = z.infer<typeof signInSchema>

export function SignInForm(): JSX.Element {
  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit(values: SignInValues): Promise<void> {
    // await signIn(values)
    toast.success('Welcome back', { description: `Signed in as ${values.email}` })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 max-w-sm">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Work email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="you@company.com" autoComplete="email" {...field} />
              </FormControl>
              <FormDescription>We&apos;ll never share this with anyone.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="current-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" loading={form.formState.isSubmitting}>
          Sign in
        </Button>
      </form>
    </Form>
  )
}
```

`aria-invalid` and `aria-describedby` are wired automatically — screen readers announce errors as they appear.

---

## Component: Tooltip

```tsx
// src/components/ui/tooltip.tsx
'use client'

import * as React from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { cn } from '@/lib/utils'

export const TooltipProvider = TooltipPrimitive.Provider
export const Tooltip = TooltipPrimitive.Root
export const TooltipTrigger = TooltipPrimitive.Trigger

export const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        'z-[500] overflow-hidden rounded-[var(--df-radius-sm)] px-2.5 py-1.5 text-xs',
        'bg-[var(--df-bg-overlay)] text-[var(--df-text-primary)]',
        'border border-[var(--df-border-default)]',
        'shadow-[0_8px_24px_rgba(0,0,0,0.6)] backdrop-blur-md',
        'data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95',
        'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
        'data-[side=top]:slide-in-from-bottom-1 data-[side=bottom]:slide-in-from-top-1',
        'duration-100 motion-reduce:animate-none',
        className,
      )}
      {...props}
    />
  </TooltipPrimitive.Portal>
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName
```

Wrap your app once with `<TooltipProvider delayDuration={200}>` (in root layout client wrapper). Then per usage:

```tsx
'use client'

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { GitBranch } from 'lucide-react'

export function BranchButton({ branch }: { branch: string }): JSX.Element {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Current branch: ${branch}`}>
          <GitBranch className="size-4" aria-hidden />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">Switch branch — current: <strong>{branch}</strong></TooltipContent>
    </Tooltip>
  )
}
```

---

## Animation Enhancements

Radix's `data-[state=open]` plus `tw-animate-css` covers 80% of motion well. The remaining 20% — list reorders, layout transitions, gesture-driven sheets — are where Framer Motion earns its bytes. Layer it on top of Radix; never replace Radix's behavior.

### Pattern 1 — Animated list inside Dialog

Radix mounts/unmounts content; Framer's `AnimatePresence` handles per-item enter/exit even when the parent is mid-close.

```tsx
'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

interface Member { id: string; name: string; role: string }

export function TeamMembersDialog({ initial }: { initial: Member[] }): JSX.Element {
  const [members, setMembers] = useState<Member[]>(initial)

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary">Manage team</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Team members</DialogTitle>
        </DialogHeader>
        <ul className="space-y-2">
          <AnimatePresence initial={false}>
            {members.map((m) => (
              <motion.li
                key={m.id}
                layout
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-center justify-between p-3 rounded-md bg-[var(--df-bg-surface)] border border-[var(--df-border-subtle)]"
              >
                <div>
                  <p className="text-sm font-medium text-[var(--df-text-primary)]">{m.name}</p>
                  <p className="text-xs text-[var(--df-text-muted)]">{m.role}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMembers((xs) => xs.filter((x) => x.id !== m.id))}
                >
                  Remove
                </Button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      </DialogContent>
    </Dialog>
  )
}
```

### Pattern 2 — Tab indicator with `layoutId`

Replace the CSS `::after` underline on `TabsTrigger` with a shared `layoutId` element for a sliding indicator instead of a fade:

```tsx
'use client'

import { motion } from 'framer-motion'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useState } from 'react'

const TABS = [
  { id: 'today',   label: 'Today' },
  { id: 'week',    label: 'This week' },
  { id: 'month',   label: 'This month' },
  { id: 'quarter', label: 'Quarter' },
] as const

export function MotionTabs(): JSX.Element {
  const [active, setActive] = useState<string>('week')
  return (
    <Tabs value={active} onValueChange={setActive}>
      <TabsList>
        {TABS.map((t) => (
          <div key={t.id} className="relative">
            <TabsTrigger value={t.id} className="after:hidden relative z-10">
              {t.label}
            </TabsTrigger>
            {active === t.id && (
              <motion.span
                layoutId="tab-indicator"
                className="absolute inset-x-2 bottom-[-1px] h-[2px] bg-[var(--df-neon-violet)] rounded-full shadow-[0_0_12px_rgba(167,139,250,0.6)]"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                aria-hidden
              />
            )}
          </div>
        ))}
      </TabsList>
    </Tabs>
  )
}
```

### Pattern 3 — Sheet swipe-to-dismiss (mobile)

```tsx
'use client'

import { motion, useMotionValue, useTransform } from 'framer-motion'
import { useState, type ReactNode } from 'react'

export function SwipeSheet({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }): JSX.Element | null {
  const y = useMotionValue(0)
  const opacity = useTransform(y, [0, 200], [1, 0])
  if (!open) return null
  return (
    <motion.div
      drag="y"
      dragConstraints={{ top: 0, bottom: 300 }}
      dragElastic={0.2}
      style={{ y, opacity }}
      onDragEnd={(_, info) => {
        if (info.offset.y > 120) onClose()
      }}
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="fixed inset-x-0 bottom-0 z-[401] rounded-t-[var(--df-radius-xl)] bg-[var(--df-bg-elevated)] border-t border-[var(--df-border-default)] p-6 max-h-[80vh] overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-[var(--df-border-strong)]" aria-hidden />
      {children}
    </motion.div>
  )
}
```

Always wrap motion components in `motion-reduce:` guards or check `useReducedMotion()` from framer-motion.

---

## Common Gotchas

**1. Theme flash on load (FOUC).** Caused by `next-themes` rewriting `<html class>` after hydration. Fix by hard-coding `className="dark"` on `<html>` in `layout.tsx` AND keeping `forcedTheme="dark"` in the provider AND `suppressHydrationWarning`. Darkforge is dark-only, so any flash is a configuration bug.

**2. `components.json` paths broken after monorepo refactor.** The `aliases` in `components.json` must match `tsconfig.json` `paths`. If you move from `src/` to `app/`, both files need updating. Run `npx shadcn@latest init --force` to rewrite — it preserves your custom components and only overwrites the config.

**3. RSC vs client boundary.** `Form`, `Dialog`, `Popover`, `DropdownMenu`, `Tabs`, `Sheet`, `Tooltip` all use React state and **must** start with `'use client'`. The components above already have it. Importing them into a server component is fine; just don't drop hooks into a server component file.

**4. `useFormState` (now `useActionState`) in Server Actions.** React 19 renamed `useFormState` to `useActionState`. If you see `Cannot find module 'react-dom'` errors after upgrading, switch your import:

```tsx
// React 18
import { useFormState } from 'react-dom'
// React 19
import { useActionState } from 'react'
```

shadcn `<Form>` works with both — it's a wrapper around `react-hook-form`, not server actions. Use server actions for the submit handler, RHF for client validation.

**5. Tailwind v4 breaking change.** `tailwind.config.ts` colors no longer affect anything — v4 reads tokens from `@theme` in CSS only. If your shadcn components don't pick up colors, you forgot the `@theme inline` block. The mapping in this file's globals.css covers it.

**6. `class-variance-authority` mismatch with `tailwind-merge`.** When variant classes contain conflicting utilities (e.g. `px-3` and a consumer passes `px-5`), `cn()` resolves correctly. If a variant class isn't winning, you wrote it directly without going through `cn()` — always pipe through.

**7. Radix Portal escapes your CSS scope.** Tooltip/Popover/Dialog content renders into `document.body`, so it inherits `:root` tokens but **not** any parent container's CSS. If a tooltip looks unstyled, your tokens aren't on `:root` — they're on a wrapper.

**8. `forwardRef` displayName warnings.** Set `Component.displayName = 'Component'` after every `forwardRef` (every example above does). React DevTools and error stacks rely on it.

**9. `cmdk` sets `data-selected` on first item by default.** If your CommandPalette opens with the wrong item highlighted, pass `value=""` to `<CommandPrimitive>` or use the `defaultValue` prop on `<CommandItem>` you actually want active.

**10. Sonner doesn't render in tests.** Mock it: `vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() }, Toaster: () => null }))`.

---

## Cross-References

shadcn primitives are the substrate for everything Darkforge generates beyond pure visual flourishes. Patterns that compose these components:

- **`patterns/dashboard.md`** — Sidebar + Sheet (mobile nav) + DropdownMenu (user) + Tabs (sections) + Card (stat tiles) + Tooltip (icon hints).
- **`patterns/pricing.md`** — Card variant=`elevated` for tiers, Button variant=`primary` for CTA, Tabs for monthly/annual switch.
- **`patterns/hero.md`** — Button as the CTA. Everything else custom motion.
- **`patterns/cta.md`** — Card variant=`glass` + Button + Form (inline email signup).
- **`patterns/footer.md`** — DropdownMenu for region/locale switcher.
- **`references/01-framer-motion.md`** — partner reference for the Animation Enhancements section.
- **`references/17-skeleton-system.md`** — every shadcn data view (Table, Card grid) needs a Skeleton variant for `Suspense fallback`.
- **`references/00-dark-tokens.md`** — every CSS var used here originates in the token system.

Any time the user asks for a modal flow, a form, a settings page, or a mobile nav, reach for shadcn first — the a11y is solved, the keyboard nav is solved, and the dark theming above means it ships AMOLED on day one.
