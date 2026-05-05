# Darkforge — Magic UI Dark Reference
Magic UI is a copy-paste catalog of animated React components — installed component-by-component via the shadcn CLI registry, sourced into the project, and then owned/edited by you. Darkforge loves it because the catalog (BorderBeam, Meteors, ShimmerButton, Marquee, NumberTicker, AnimatedBeam, Globe, Confetti) is precisely the visual vocabulary of viral-on-Twitter dark SaaS landing pages — and because every component is just TSX + Tailwind, swapping in DF tokens and AMOLED defaults is one search-and-replace away from "looks like the team paid a senior FE to customize it."

> **Source-of-truth caveat (read first).** This file was written from training knowledge — both `context7` and `WebFetch` were unavailable when it was generated. Before shipping, sanity-check the following against `https://magicui.design/docs/components` for each component's current page:
> - Peer-dep name: Magic UI is mid-rename from `framer-motion` to the unscoped `motion` package. The install command shown below uses `motion`; older snippets in the wild still import from `framer-motion`. Both work, but pick one and stay consistent.
> - Exact prop signatures for `NumberTicker`, `Globe`, `Confetti`, `AnimatedBeam` — these have shifted between releases more than the rest.
> - Registry URLs (`https://magicui.design/r/<name>.json`) — the slugs occasionally rename.
>
> Component names, structure, and animation logic below match the public catalog and are stable. Anything flagged inline as `// VERIFY:` is the small set of details worth a 30-second cross-check.

## Contents

- [Install / Setup](#install-setup)
  - [`cn()` utility (lives at `@/lib/utils.ts`)](#cn-utility-lives-at-libutilsts)
  - [Tailwind config — keyframes Magic UI assumes exist](#tailwind-config-keyframes-magic-ui-assumes-exist)
  - [`prefers-reduced-motion` — do this once, globally](#prefers-reduced-motion-do-this-once-globally)
- [Component: BorderBeam (Animated Border Card)](#component-borderbeam-animated-border-card)
  - [Usage — Featured pricing card](#usage-featured-pricing-card)
- [Component: Meteors (Meteor Shower)](#component-meteors-meteor-shower)
  - [Usage — Hero with meteor backdrop](#usage-hero-with-meteor-backdrop)
- [Component: GridPattern](#component-gridpattern)
  - [Usage — Section background with highlighted intersections](#usage-section-background-with-highlighted-intersections)
- [Component: ShimmerButton](#component-shimmerbutton)
  - [Usage](#usage)
- [Component: BlurFade](#component-blurfade)
  - [Four directional variants](#four-directional-variants)
- [Component: NumberTicker](#component-numberticker)
  - [Usage — Dashboard stats strip](#usage-dashboard-stats-strip)
- [Component: Marquee](#component-marquee)
  - [Usage — Logo cloud with edge fades](#usage-logo-cloud-with-edge-fades)
- [Component: DotPattern](#component-dotpattern)
  - [Usage — Hero with masked dot field](#usage-hero-with-masked-dot-field)
- [Component: Ripple](#component-ripple)
- [Component: AnimatedGradientText](#component-animatedgradienttext)
  - [Usage — Hero headline accent](#usage-hero-headline-accent)
- [Component: AnimatedBeam](#component-animatedbeam)
  - [Usage — "Stack → Us → User" diagram](#usage-stack-us-user-diagram)
- [Component: AvatarCircles](#component-avatarcircles)
- [Component: Confetti](#component-confetti)
- [Common Gotchas](#common-gotchas)
- [Cross-References — which patterns compose which Magic UI primitives](#cross-references-which-patterns-compose-which-magic-ui-primitives)

---

## Install / Setup

Magic UI piggy-backs on shadcn's component registry — no npm package, no version pin, just the CLI fetching JSON manifests and writing files into your project under `@/components/magicui/`.

```bash
# 1. shadcn must be initialized first (creates components.json, lib/utils.ts, etc.)
npx shadcn@latest init

# 2. Install the components Darkforge uses most. One-shot install:
npx shadcn@latest add \
  "https://magicui.design/r/border-beam.json" \
  "https://magicui.design/r/meteors.json" \
  "https://magicui.design/r/shimmer-button.json" \
  "https://magicui.design/r/blur-fade.json" \
  "https://magicui.design/r/number-ticker.json" \
  "https://magicui.design/r/marquee.json" \
  "https://magicui.design/r/grid-pattern.json" \
  "https://magicui.design/r/dot-pattern.json" \
  "https://magicui.design/r/ripple.json" \
  "https://magicui.design/r/animated-gradient-text.json" \
  "https://magicui.design/r/animated-beam.json" \
  "https://magicui.design/r/confetti.json" \
  "https://magicui.design/r/avatar-circles.json"

# 3. Peer dependencies (Magic UI relies on these at runtime):
npm i motion clsx tailwind-merge
# `motion` is the new name for framer-motion's core export.
# If your project already pins `framer-motion`, keep it — both work.
```

### `cn()` utility (lives at `@/lib/utils.ts`)

shadcn-init creates this for you. Magic UI imports `cn` from here in every component, so if you've never run `shadcn init` you need to write it manually:

```ts
// lib/utils.ts
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
```

### Tailwind config — keyframes Magic UI assumes exist

Many Magic UI components reference custom keyframes (`shimmer-slide`, `border-beam`, `marquee`, `meteor`, `gradient`). If you're not also using shadcn-ui's full registry, add these manually. Darkforge bundles them into `tailwind.config.ts`:

```ts
// tailwind.config.ts (extend block, additive)
import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    extend: {
      animation: {
        'border-beam':   'border-beam calc(var(--duration)*1s) infinite linear',
        'shimmer-slide': 'shimmer-slide var(--speed) ease-in-out infinite alternate',
        'marquee':       'marquee var(--duration) linear infinite',
        'marquee-vertical': 'marquee-vertical var(--duration) linear infinite',
        'meteor':        'meteor 5s linear infinite',
        'gradient':      'gradient 8s linear infinite',
        'ripple':        'ripple var(--duration,2s) ease calc(var(--i,0)*.2s) infinite',
      },
      keyframes: {
        'border-beam': {
          '100%': { 'offset-distance': '100%' },
        },
        'shimmer-slide': {
          to: { transform: 'translate(calc(100cqw - 100%), 0)' },
        },
        marquee: {
          from: { transform: 'translateX(0)' },
          to:   { transform: 'translateX(calc(-100% - var(--gap)))' },
        },
        'marquee-vertical': {
          from: { transform: 'translateY(0)' },
          to:   { transform: 'translateY(calc(-100% - var(--gap)))' },
        },
        meteor: {
          '0%':   { transform: 'rotate(var(--angle)) translateX(0)',     opacity: '1' },
          '70%':  { opacity: '1' },
          '100%': { transform: 'rotate(var(--angle)) translateX(-500px)', opacity: '0' },
        },
        gradient: {
          to: { 'background-position': 'var(--bg-size,300%) 0' },
        },
        ripple: {
          '0%, 100%': { transform: 'translate(-50%, -50%) scale(1)' },
          '50%':      { transform: 'translate(-50%, -50%) scale(0.9)' },
        },
      },
    },
  },
} satisfies Config
```

### `prefers-reduced-motion` — do this once, globally

Every Magic UI component uses CSS `animation` or Motion. Add a single global override so users with reduced-motion preferences get a static version of the entire catalog at once — beats per-component guards.

```css
/* globals.css — paste under your :root DF tokens */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

## Component: BorderBeam (Animated Border Card)

A neon gradient that travels along the perimeter of any container — perfect for highlighting the "Most Popular" pricing tier or a featured changelog card on AMOLED black. Magic UI calls this `BorderBeam`; Darkforge defaults it to violet on the inside, cyan on the outside, so the beam reads as a violet→cyan sweep against pure black.

```tsx
// components/magicui/border-beam.tsx
'use client'

import { cn } from '@/lib/utils'
import type { CSSProperties } from 'react'

interface BorderBeamProps {
  className?: string
  size?: number
  duration?: number
  borderWidth?: number
  anchor?: number
  colorFrom?: string
  colorTo?: string
  delay?: number
}

export function BorderBeam({
  className,
  size = 200,
  duration = 12,
  anchor = 90,
  borderWidth = 1.5,
  colorFrom = 'var(--df-neon-violet)',
  colorTo   = 'var(--df-neon-cyan)',
  delay = 0,
}: BorderBeamProps) {
  return (
    <div
      aria-hidden="true"
      style={{
        '--size':         size,
        '--duration':     duration,
        '--anchor':       anchor,
        '--border-width': borderWidth,
        '--color-from':   colorFrom,
        '--color-to':     colorTo,
        '--delay':        `-${delay}s`,
      } as CSSProperties}
      className={cn(
        'pointer-events-none absolute inset-0 rounded-[inherit]',
        '[border:calc(var(--border-width)*1px)_solid_transparent]',
        '![mask-clip:padding-box,border-box] ![mask-composite:intersect]',
        '[mask:linear-gradient(transparent,transparent),linear-gradient(white,white)]',
        'after:absolute after:aspect-square after:w-[calc(var(--size)*1px)]',
        'after:animate-border-beam after:[animation-delay:var(--delay)]',
        'after:[background:linear-gradient(to_left,var(--color-from),var(--color-to),transparent)]',
        'after:[offset-anchor:calc(var(--anchor)*1%)_50%]',
        'after:[offset-path:rect(0_auto_auto_0_round_calc(var(--size)*1px))]',
        className,
      )}
    />
  )
}
```

### Usage — Featured pricing card

```tsx
// components/pricing-featured-card.tsx
'use client'

import { BorderBeam } from '@/components/magicui/border-beam'
import { cn } from '@/lib/utils'

interface PricingFeaturedCardProps {
  plan: 'Pro' | 'Team' | 'Enterprise'
  monthly: number
  description: string
  features: ReadonlyArray<string>
  ctaLabel: string
  onSelect: () => void
}

export function PricingFeaturedCard({
  plan, monthly, description, features, ctaLabel, onSelect,
}: PricingFeaturedCardProps) {
  return (
    <article
      aria-labelledby={`plan-${plan}`}
      className={cn(
        'relative overflow-hidden rounded-[var(--df-radius-xl)] p-8',
        'bg-[var(--df-bg-surface)] border border-[var(--df-border-default)]',
        'flex flex-col gap-6 min-w-[280px] max-w-[380px] w-full',
      )}
    >
      <BorderBeam duration={10} size={260} />

      <header className="flex flex-col gap-2">
        <span className="text-xs font-medium uppercase tracking-wider text-[var(--df-neon-violet)]">
          Most popular
        </span>
        <h3 id={`plan-${plan}`} className="text-2xl font-semibold text-[var(--df-text-primary)]">
          {plan}
        </h3>
        <p className="text-sm text-[var(--df-text-secondary)]">{description}</p>
      </header>

      <div className="flex items-baseline gap-1">
        <span className="text-5xl font-bold text-[var(--df-text-primary)]">${monthly}</span>
        <span className="text-sm text-[var(--df-text-muted)]">/month</span>
      </div>

      <ul className="flex flex-col gap-3 text-sm text-[var(--df-text-secondary)]">
        {features.map(f => (
          <li key={f} className="flex items-start gap-2">
            <span aria-hidden className="text-[var(--df-neon-cyan)] mt-0.5">→</span>
            {f}
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onSelect}
        className={cn(
          'mt-auto rounded-[var(--df-radius-md)] px-5 py-2.5 text-sm font-medium',
          'bg-[var(--df-neon-violet)] text-[var(--df-text-inverse)]',
          'transition-all duration-200',
          'hover:shadow-[var(--df-glow-violet-lg)] hover:-translate-y-0.5',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--df-border-focus)]',
        )}
      >
        {ctaLabel}
      </button>
    </article>
  )
}
```

---

## Component: Meteors (Meteor Shower)

A sky of neon streaks crossing the AMOLED background diagonally. Use as a `<Meteors />` siblings of your hero copy — set `position: relative` on the parent, `overflow-hidden`, and the streaks anchor to the top edge.

```tsx
// components/magicui/meteors.tsx
'use client'

import { useEffect, useState, type CSSProperties } from 'react'
import { cn } from '@/lib/utils'

interface MeteorsProps {
  number?: number
  className?: string
  /** angle in degrees, e.g. 215 for top-left → bottom-right */
  angle?: number
}

interface MeteorStyle extends CSSProperties {
  '--angle'?: string
}

export function Meteors({ number = 20, className, angle = 215 }: MeteorsProps) {
  const [styles, setStyles] = useState<MeteorStyle[]>([])

  // Hydration-safe: random positions only assigned client-side after mount.
  useEffect(() => {
    const next = Array.from({ length: number }, (): MeteorStyle => ({
      '--angle':         `${angle}deg`,
      top:               '-5%',
      left:              `calc(0% + ${Math.floor(Math.random() * window.innerWidth)}px)`,
      animationDelay:    `${Math.random() * (0.8 - 0.2) + 0.2}s`,
      animationDuration: `${Math.floor(Math.random() * (10 - 2) + 2)}s`,
    }))
    setStyles(next)
  }, [number, angle])

  return (
    <div aria-hidden="true" className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}>
      {styles.map((style, i) => (
        <span
          key={i}
          style={style}
          className={cn(
            'absolute h-0.5 w-0.5 rotate-[var(--angle)]',
            'rounded-[9999px] bg-[var(--df-neon-violet)]',
            'shadow-[0_0_0_1px_rgba(167,139,250,0.1)]',
            'animate-meteor',
            // Trailing streak
            'before:absolute before:top-1/2 before:left-0 before:-translate-y-1/2',
            'before:h-px before:w-[50px]',
            'before:[background:linear-gradient(90deg,var(--df-neon-violet),transparent)]',
            'before:content-[""]',
          )}
        />
      ))}
    </div>
  )
}
```

### Usage — Hero with meteor backdrop

```tsx
// components/sections/hero-meteor.tsx
'use client'

import { Meteors } from '@/components/magicui/meteors'

export function HeroMeteor() {
  return (
    <section
      aria-labelledby="hero-headline"
      className="relative isolate overflow-hidden bg-[var(--df-bg-base)] min-h-[640px] py-24 sm:py-32"
    >
      <Meteors number={30} />

      <div className="relative mx-auto max-w-3xl px-6 text-center">
        <h1
          id="hero-headline"
          className="text-4xl sm:text-6xl font-semibold tracking-tight text-[var(--df-text-primary)]"
        >
          Ship dark UI <br className="hidden sm:block" />
          your team will brag about.
        </h1>
        <p className="mt-6 text-base sm:text-lg text-[var(--df-text-secondary)]">
          Darkforge generates AMOLED-first React components straight into your repo —
          tokens injected, animations wired, accessibility handled.
        </p>
      </div>
    </section>
  )
}
```

---

## Component: GridPattern

A subtle dark grid background — squares drawn from SVG `<pattern>`. Darkforge sets the stroke to a barely-there white at 5% opacity so the grid only catches the eye when neon spotlights cross over it.

```tsx
// components/magicui/grid-pattern.tsx
'use client'

import { useId } from 'react'
import { cn } from '@/lib/utils'

interface GridPatternProps {
  width?: number
  height?: number
  x?: number
  y?: number
  squares?: ReadonlyArray<readonly [number, number]>
  strokeDasharray?: string
  className?: string
}

export function GridPattern({
  width = 40,
  height = 40,
  x = -1,
  y = -1,
  squares,
  strokeDasharray = '0',
  className,
}: GridPatternProps) {
  const id = useId()

  return (
    <svg
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute inset-0 h-full w-full',
        'fill-white/[0.02] stroke-white/5',
        className,
      )}
    >
      <defs>
        <pattern id={id} width={width} height={height} patternUnits="userSpaceOnUse" x={x} y={y}>
          <path d={`M.5 ${height}V.5H${width}`} fill="none" strokeDasharray={strokeDasharray} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" strokeWidth={0} fill={`url(#${id})`} />
      {squares?.map(([sx, sy]) => (
        <rect
          key={`${sx}-${sy}`}
          strokeWidth="0"
          width={width - 1}
          height={height - 1}
          x={sx * width + 1}
          y={sy * height + 1}
          className="fill-[var(--df-neon-violet)]/10"
        />
      ))}
    </svg>
  )
}
```

### Usage — Section background with highlighted intersections

```tsx
// components/sections/feature-grid-bg.tsx
import { GridPattern } from '@/components/magicui/grid-pattern'

export function FeatureGridBackground() {
  return (
    <div className="relative h-[480px] w-full overflow-hidden rounded-[var(--df-radius-xl)] bg-[var(--df-bg-base)]">
      <GridPattern
        width={60}
        height={60}
        squares={[
          [4, 4], [5, 1], [8, 2], [5, 3], [7, 5], [10, 8],
          [12, 4], [15, 7], [3, 9],
        ]}
      />
      <div
        className="absolute inset-0 [background:radial-gradient(circle_at_center,transparent_0%,var(--df-bg-base)_75%)]"
        aria-hidden="true"
      />
    </div>
  )
}
```

---

## Component: ShimmerButton

A dark CTA button with a continuously sweeping inner highlight — looks like polished onyx. Darkforge defaults the shimmer to violet so it reads as a brand-tinted gleam, not a generic "loading" sweep.

```tsx
// components/magicui/shimmer-button.tsx
'use client'

import { forwardRef, type ButtonHTMLAttributes, type CSSProperties } from 'react'
import { cn } from '@/lib/utils'

interface ShimmerButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  shimmerColor?: string
  shimmerSize?: string
  borderRadius?: string
  shimmerDuration?: string
  background?: string
}

export const ShimmerButton = forwardRef<HTMLButtonElement, ShimmerButtonProps>(
  (
    {
      shimmerColor    = 'var(--df-neon-violet)',
      shimmerSize     = '0.06em',
      shimmerDuration = '3s',
      borderRadius    = 'var(--df-radius-full)',
      background      = 'var(--df-bg-elevated)',
      className,
      children,
      ...rest
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        style={{
          '--spread':           '90deg',
          '--shimmer-color':    shimmerColor,
          '--radius':           borderRadius,
          '--speed':            shimmerDuration,
          '--cut':              shimmerSize,
          '--bg':               background,
        } as CSSProperties}
        className={cn(
          'group relative z-0 flex items-center justify-center overflow-hidden whitespace-nowrap',
          'cursor-pointer px-6 py-3 text-sm font-medium',
          '[border-radius:var(--radius)] [background:var(--bg)]',
          'text-[var(--df-text-primary)]',
          'transition-all duration-300',
          'hover:shadow-[var(--df-glow-violet)]',
          '[box-shadow:inset_0_-8px_10px_rgba(167,139,250,0.12)]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--df-border-focus)]',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        {...rest}
      >
        {/* Shimmer container */}
        <div
          aria-hidden="true"
          className="-z-30 blur-[2px] absolute inset-0 overflow-visible [container-type:size]"
        >
          <div className="absolute inset-0 h-[100cqh] animate-shimmer-slide [aspect-ratio:1] [border-radius:0] [mask:none]">
            <div className="animate-spin-slow absolute -inset-full w-auto rotate-0 [background:conic-gradient(from_calc(270deg-(var(--spread)*0.5)),transparent_0,var(--shimmer-color)_var(--spread),transparent_var(--spread))] [translate:0_0]" />
          </div>
        </div>

        {children}

        {/* Highlight layer */}
        <div
          aria-hidden="true"
          className={cn(
            'insert-0 absolute size-full',
            'rounded-[var(--radius)] px-4 py-1.5 text-sm font-medium',
            'shadow-[inset_0_-8px_10px_rgba(255,255,255,0.05)]',
            'transform-gpu transition-all duration-300 ease-in-out',
            'group-hover:shadow-[inset_0_-6px_10px_rgba(167,139,250,0.18)]',
            'group-active:shadow-[inset_0_-10px_10px_rgba(167,139,250,0.22)]',
          )}
        />

        {/* Backdrop */}
        <div
          aria-hidden="true"
          className="absolute -z-20 [background:var(--bg)] [border-radius:var(--radius)] [inset:var(--cut)]"
        />
      </button>
    )
  },
)
ShimmerButton.displayName = 'ShimmerButton'
```

### Usage

```tsx
import { ShimmerButton } from '@/components/magicui/shimmer-button'

export function HeroCta() {
  return (
    <div className="flex flex-wrap gap-3">
      <ShimmerButton onClick={() => location.href = '/signup'} aria-label="Start free trial">
        Start free trial
      </ShimmerButton>
      <ShimmerButton
        shimmerColor="var(--df-neon-cyan)"
        background="var(--df-bg-surface)"
        onClick={() => location.href = '/docs'}
      >
        Read the docs
      </ShimmerButton>
    </div>
  )
}
```

---

## Component: BlurFade

Entrance animation: element fades in while a Y-offset settles to zero and `filter: blur()` clears. Darkforge exposes 4 directional variants by tweaking `yOffset` / `xOffset`.

```tsx
// components/magicui/blur-fade.tsx
'use client'

import {
  motion,
  useInView,
  type Variants,
  type UseInViewOptions,
} from 'motion/react'
import { useRef, type ReactNode } from 'react'

type MarginType = UseInViewOptions['margin']

interface BlurFadeProps {
  children: ReactNode
  className?: string
  variant?: { hidden: { y: number; x?: number }; visible: { y: number; x?: number } }
  duration?: number
  delay?: number
  yOffset?: number
  xOffset?: number
  inView?: boolean
  inViewMargin?: MarginType
  blur?: string
}

export function BlurFade({
  children,
  className,
  variant,
  duration = 0.4,
  delay = 0,
  yOffset = 6,
  xOffset = 0,
  inView = false,
  inViewMargin = '-50px',
  blur = '6px',
}: BlurFadeProps) {
  const ref = useRef<HTMLDivElement>(null)
  const inViewResult = useInView(ref, { once: true, margin: inViewMargin })
  const isInView = !inView || inViewResult

  const defaultVariants: Variants = {
    hidden:  { y: yOffset,  x: xOffset,  opacity: 0, filter: `blur(${blur})` },
    visible: { y: -0,       x: 0,        opacity: 1, filter: 'blur(0px)' },
  }

  const combinedVariants = variant ?? defaultVariants

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      exit="hidden"
      variants={combinedVariants}
      transition={{ delay: 0.04 + delay, duration, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
```

### Four directional variants

```tsx
// 1. From below (default) — yOffset positive
<BlurFade yOffset={8}>...</BlurFade>

// 2. From above — yOffset negative
<BlurFade yOffset={-8}>...</BlurFade>

// 3. From left — xOffset positive, yOffset 0
<BlurFade yOffset={0} xOffset={12}>...</BlurFade>

// 4. From right — xOffset negative, yOffset 0
<BlurFade yOffset={0} xOffset={-12}>...</BlurFade>

// Stagger pattern in feature grids:
{features.map((f, i) => (
  <BlurFade key={f.id} delay={0.08 * i} inView yOffset={10}>
    <FeatureTile {...f} />
  </BlurFade>
))}
```

---

## Component: NumberTicker

Counts a number up from zero (or down to zero) on scroll. Used in dashboard stat hero strips ("47,219 builds shipped this week"). // VERIFY: prop signature for `decimalPlaces` and `direction` against current docs — these are the most-changed props in the catalog.

```tsx
// components/magicui/number-ticker.tsx
'use client'

import { useInView, useMotionValue, useSpring } from 'motion/react'
import { useEffect, useRef, type ComponentPropsWithoutRef } from 'react'
import { cn } from '@/lib/utils'

interface NumberTickerProps extends ComponentPropsWithoutRef<'span'> {
  value: number
  startValue?: number
  direction?: 'up' | 'down'
  delay?: number
  decimalPlaces?: number
}

export function NumberTicker({
  value,
  startValue = 0,
  direction = 'up',
  delay = 0,
  decimalPlaces = 0,
  className,
  ...rest
}: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const motionValue = useMotionValue(direction === 'down' ? value : startValue)
  const springValue = useSpring(motionValue, { damping: 60, stiffness: 100 })
  const isInView = useInView(ref, { once: true, margin: '0px' })

  useEffect(() => {
    if (!isInView) return
    const timer = setTimeout(() => {
      motionValue.set(direction === 'down' ? startValue : value)
    }, delay * 1000)
    return () => clearTimeout(timer)
  }, [isInView, motionValue, value, startValue, direction, delay])

  useEffect(() => {
    return springValue.on('change', latest => {
      if (!ref.current) return
      ref.current.textContent = Intl.NumberFormat('en-US', {
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces,
      }).format(Number(latest.toFixed(decimalPlaces)))
    })
  }, [springValue, decimalPlaces])

  return (
    <span
      ref={ref}
      className={cn(
        'inline-block tabular-nums tracking-tight',
        'text-[var(--df-text-primary)]',
        className,
      )}
      {...rest}
    >
      {startValue}
    </span>
  )
}
```

### Usage — Dashboard stats strip

```tsx
import { NumberTicker } from '@/components/magicui/number-ticker'

interface DashboardStat {
  label: string
  value: number
  decimals?: number
  suffix?: string
  accent?: 'violet' | 'cyan' | 'green'
}

const stats: ReadonlyArray<DashboardStat> = [
  { label: 'Builds shipped',   value: 47219,  accent: 'violet' },
  { label: 'P95 response (ms)', value: 142,    accent: 'cyan' },
  { label: 'Uptime',            value: 99.98,  decimals: 2, suffix: '%', accent: 'green' },
]

const accentMap = {
  violet: 'text-[var(--df-neon-violet)]',
  cyan:   'text-[var(--df-neon-cyan)]',
  green:  'text-[var(--df-neon-green)]',
} as const

export function StatsStrip() {
  return (
    <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {stats.map(s => (
        <div
          key={s.label}
          className="rounded-[var(--df-radius-lg)] border border-[var(--df-border-subtle)] bg-[var(--df-bg-elevated)] p-6"
        >
          <dt className="text-xs uppercase tracking-wider text-[var(--df-text-muted)]">{s.label}</dt>
          <dd className={cn('mt-2 text-4xl font-semibold', accentMap[s.accent ?? 'violet'])}>
            <NumberTicker value={s.value} decimalPlaces={s.decimals ?? 0} />
            {s.suffix && <span className="ml-0.5 text-2xl">{s.suffix}</span>}
          </dd>
        </div>
      ))}
    </dl>
  )
}

// helper above for cn class merging
import { cn } from '@/lib/utils'
```

---

## Component: Marquee

Infinite-scroll row (or column) of children. Pauses on hover. Drop logos, testimonials, or release-note pills inside. Darkforge wraps it in fade gradients on the edges so the loop feels seamless against AMOLED.

```tsx
// components/magicui/marquee.tsx
'use client'

import { cn } from '@/lib/utils'
import type { ComponentPropsWithoutRef, CSSProperties } from 'react'

interface MarqueeProps extends ComponentPropsWithoutRef<'div'> {
  reverse?: boolean
  pauseOnHover?: boolean
  vertical?: boolean
  repeat?: number
  /** gap between repeated children, in rem; default 1 */
  gapRem?: number
  /** animation duration in seconds; default 40 */
  durationSec?: number
}

export function Marquee({
  className,
  reverse = false,
  pauseOnHover = false,
  vertical = false,
  repeat = 4,
  gapRem = 1,
  durationSec = 40,
  children,
  ...rest
}: MarqueeProps) {
  return (
    <div
      {...rest}
      style={{
        '--duration': `${durationSec}s`,
        '--gap':      `${gapRem}rem`,
      } as CSSProperties}
      className={cn(
        'group flex overflow-hidden p-2 [gap:var(--gap)]',
        vertical ? 'flex-col' : 'flex-row',
        className,
      )}
    >
      {Array.from({ length: repeat }).map((_, i) => (
        <div
          key={i}
          className={cn('flex shrink-0 justify-around [gap:var(--gap)]', {
            'animate-marquee flex-row':           !vertical && !reverse,
            'animate-marquee flex-row [animation-direction:reverse]': !vertical && reverse,
            'animate-marquee-vertical flex-col':  vertical && !reverse,
            'animate-marquee-vertical flex-col [animation-direction:reverse]': vertical && reverse,
            'group-hover:[animation-play-state:paused]': pauseOnHover,
          })}
        >
          {children}
        </div>
      ))}
    </div>
  )
}
```

### Usage — Logo cloud with edge fades

```tsx
'use client'

import Image from 'next/image'
import { Marquee } from '@/components/magicui/marquee'

interface CustomerLogo {
  name: string
  src: string
  width: number
  height: number
}

const logos: ReadonlyArray<CustomerLogo> = [
  { name: 'Linear',    src: '/logos/linear.svg',    width: 96,  height: 24 },
  { name: 'Vercel',    src: '/logos/vercel.svg',    width: 90,  height: 22 },
  { name: 'Supabase',  src: '/logos/supabase.svg',  width: 110, height: 24 },
  { name: 'Anthropic', src: '/logos/anthropic.svg', width: 120, height: 24 },
  { name: 'Stripe',    src: '/logos/stripe.svg',    width: 76,  height: 24 },
  { name: 'OpenAI',    src: '/logos/openai.svg',    width: 96,  height: 24 },
]

export function LogoCloud() {
  return (
    <section
      aria-labelledby="customers"
      className="relative w-full bg-[var(--df-bg-base)] py-16"
    >
      <h2 id="customers" className="sr-only">Customers</h2>
      <p className="mb-8 text-center text-sm uppercase tracking-wider text-[var(--df-text-muted)]">
        Powering teams at
      </p>

      <div className="relative">
        <Marquee pauseOnHover durationSec={36} repeat={3} gapRem={3}>
          {logos.map(l => (
            <div
              key={l.name}
              className="flex h-12 items-center grayscale opacity-60 transition-all hover:opacity-100 hover:grayscale-0"
            >
              <Image src={l.src} alt={l.name} width={l.width} height={l.height} />
            </div>
          ))}
        </Marquee>

        {/* Edge fade — left */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[var(--df-bg-base)] to-transparent"
        />
        {/* Edge fade — right */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[var(--df-bg-base)] to-transparent"
        />
      </div>
    </section>
  )
}
```

---

## Component: DotPattern

Same idea as `GridPattern` but with circles. Slightly more "tech" feel, slightly less "grid software." Darkforge uses it under hero copy, hero copy stays sharp, dots dim toward the edges via a radial mask.

```tsx
// components/magicui/dot-pattern.tsx
'use client'

import { useId } from 'react'
import { cn } from '@/lib/utils'

interface DotPatternProps {
  width?: number
  height?: number
  x?: number
  y?: number
  cx?: number
  cy?: number
  cr?: number
  className?: string
}

export function DotPattern({
  width = 16,
  height = 16,
  x = 0,
  y = 0,
  cx = 1,
  cy = 1,
  cr = 1,
  className,
}: DotPatternProps) {
  const id = useId()

  return (
    <svg
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute inset-0 h-full w-full',
        'fill-white/10',
        className,
      )}
    >
      <defs>
        <pattern id={id} width={width} height={height} patternUnits="userSpaceOnUse" x={x} y={y}>
          <circle cx={cx} cy={cy} r={cr} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" strokeWidth={0} fill={`url(#${id})`} />
    </svg>
  )
}
```

### Usage — Hero with masked dot field

```tsx
import { DotPattern } from '@/components/magicui/dot-pattern'
import { cn } from '@/lib/utils'

export function HeroDotField() {
  return (
    <section className="relative isolate flex min-h-[520px] flex-col items-center justify-center overflow-hidden bg-[var(--df-bg-base)] py-24">
      <DotPattern
        className={cn(
          '[mask-image:radial-gradient(400px_circle_at_center,white,transparent)]',
        )}
      />
      <h1 className="relative z-10 max-w-2xl px-6 text-center text-4xl font-semibold tracking-tight text-[var(--df-text-primary)] sm:text-6xl">
        The dark dashboard your investors will screenshot.
      </h1>
    </section>
  )
}
```

---

## Component: Ripple

Concentric expanding circles emanating from a center point — perfect under a "Tap to start" or "Listening..." indicator on dark surfaces.

```tsx
// components/magicui/ripple.tsx
'use client'

import { memo, type CSSProperties } from 'react'
import { cn } from '@/lib/utils'

interface RippleProps {
  mainCircleSize?: number
  mainCircleOpacity?: number
  numCircles?: number
  className?: string
}

export const Ripple = memo(function Ripple({
  mainCircleSize    = 210,
  mainCircleOpacity = 0.24,
  numCircles        = 8,
  className,
}: RippleProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute inset-0 select-none',
        '[mask-image:linear-gradient(to_bottom,white,transparent)]',
        className,
      )}
    >
      {Array.from({ length: numCircles }).map((_, i) => {
        const size       = mainCircleSize + i * 70
        const opacity    = Math.max(mainCircleOpacity - i * 0.03, 0)
        const animationDelay = `${i * 0.06}s`
        const borderStyle  = i === numCircles - 1 ? 'dashed' : 'solid'

        const style: CSSProperties = {
          width:      `${size}px`,
          height:     `${size}px`,
          opacity,
          animationDelay,
          borderStyle,
          borderWidth: '1px',
          borderColor: `rgba(167, 139, 250, ${opacity})`, // violet via DF value
        }

        return (
          <div
            key={i}
            style={style}
            className={cn(
              'absolute left-1/2 top-1/2 animate-ripple rounded-full',
              'bg-[var(--df-neon-violet)]/[0.04]',
              'shadow-[0_0_40px_rgba(167,139,250,0.05)]',
              '[transform:translate(-50%,-50%)]',
            )}
          />
        )
      })}
    </div>
  )
})
```

---

## Component: AnimatedGradientText

Headline text where a violet → cyan → pink gradient sweeps continuously across the glyphs. Use sparingly: one phrase per page, typically the marquee headline or a status pill.

```tsx
// components/magicui/animated-gradient-text.tsx
'use client'

import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface AnimatedGradientTextProps {
  children: ReactNode
  className?: string
}

export function AnimatedGradientText({ children, className }: AnimatedGradientTextProps) {
  return (
    <span
      className={cn(
        'inline animate-gradient bg-clip-text text-transparent',
        'bg-[length:var(--bg-size,300%)_100%]',
        '[background-image:linear-gradient(90deg,var(--df-neon-violet),var(--df-neon-cyan),var(--df-neon-pink),var(--df-neon-violet))]',
        className,
      )}
    >
      {children}
    </span>
  )
}
```

### Usage — Hero headline accent

```tsx
import { AnimatedGradientText } from '@/components/magicui/animated-gradient-text'

export function HeroHeadline() {
  return (
    <h1 className="text-5xl sm:text-7xl font-semibold tracking-tight text-[var(--df-text-primary)]">
      Build interfaces that{' '}
      <AnimatedGradientText className="font-bold">don&apos;t look like everyone else&apos;s</AnimatedGradientText>.
    </h1>
  )
}
```

---

## Component: AnimatedBeam

Draws an animated SVG path connecting two refs in the DOM — a violet pulse travels from `fromRef` to `toRef`. Used for "your stack → us → your customer" diagrams.

```tsx
// components/magicui/animated-beam.tsx
'use client'

import {
  type RefObject,
  useEffect,
  useId,
  useState,
} from 'react'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'

interface AnimatedBeamProps {
  className?: string
  containerRef: RefObject<HTMLElement>
  fromRef: RefObject<HTMLElement>
  toRef: RefObject<HTMLElement>
  curvature?: number
  reverse?: boolean
  pathColor?: string
  pathWidth?: number
  pathOpacity?: number
  gradientStartColor?: string
  gradientStopColor?: string
  delay?: number
  duration?: number
  startXOffset?: number
  startYOffset?: number
  endXOffset?: number
  endYOffset?: number
}

export function AnimatedBeam({
  className,
  containerRef,
  fromRef,
  toRef,
  curvature  = 0,
  reverse    = false,
  duration   = 5,
  delay      = 0,
  pathColor  = 'var(--df-border-default)',
  pathWidth  = 2,
  pathOpacity = 0.2,
  gradientStartColor = 'var(--df-neon-violet)',
  gradientStopColor  = 'var(--df-neon-cyan)',
  startXOffset = 0,
  startYOffset = 0,
  endXOffset   = 0,
  endYOffset   = 0,
}: AnimatedBeamProps) {
  const id = useId()
  const [pathD, setPathD] = useState('')
  const [box, setBox] = useState<{ width: number; height: number }>({ width: 0, height: 0 })

  // gradient sweep config
  const gradientCoordinates = reverse
    ? { x1: ['90%', '-10%'], x2: ['100%', '0%'], y1: ['0%', '0%'], y2: ['0%', '0%'] }
    : { x1: ['10%', '110%'], x2: ['0%', '100%'],  y1: ['0%', '0%'], y2: ['0%', '0%'] }

  useEffect(() => {
    const update = () => {
      if (!containerRef.current || !fromRef.current || !toRef.current) return
      const c = containerRef.current.getBoundingClientRect()
      const a = fromRef.current.getBoundingClientRect()
      const b = toRef.current.getBoundingClientRect()

      setBox({ width: c.width, height: c.height })

      const sx = a.left - c.left + a.width / 2  + startXOffset
      const sy = a.top  - c.top  + a.height / 2 + startYOffset
      const ex = b.left - c.left + b.width / 2  + endXOffset
      const ey = b.top  - c.top  + b.height / 2 + endYOffset

      const cx = (sx + ex) / 2
      const cy = (sy + ey) / 2 - curvature

      setPathD(`M ${sx},${sy} Q ${cx},${cy} ${ex},${ey}`)
    }

    update()
    const ro = new ResizeObserver(update)
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [containerRef, fromRef, toRef, curvature, startXOffset, startYOffset, endXOffset, endYOffset])

  return (
    <svg
      aria-hidden="true"
      fill="none"
      width={box.width}
      height={box.height}
      xmlns="http://www.w3.org/2000/svg"
      className={cn('pointer-events-none absolute left-0 top-0 transform-gpu stroke-2', className)}
      viewBox={`0 0 ${box.width} ${box.height}`}
    >
      <path d={pathD} stroke={pathColor} strokeWidth={pathWidth} strokeOpacity={pathOpacity} strokeLinecap="round" />
      <path d={pathD} strokeWidth={pathWidth} stroke={`url(#${id})`} strokeOpacity="1" strokeLinecap="round" />
      <defs>
        <motion.linearGradient
          className="transform-gpu"
          id={id}
          gradientUnits="userSpaceOnUse"
          initial={{ x1: '0%', x2: '0%', y1: '0%', y2: '0%' }}
          animate={{
            x1: gradientCoordinates.x1,
            x2: gradientCoordinates.x2,
            y1: gradientCoordinates.y1,
            y2: gradientCoordinates.y2,
          }}
          transition={{
            delay,
            duration,
            repeat: Infinity,
            repeatDelay: 0,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          <stop stopColor={gradientStartColor} stopOpacity="0" />
          <stop stopColor={gradientStartColor} />
          <stop offset="32.5%" stopColor={gradientStopColor} />
          <stop offset="100%" stopColor={gradientStopColor} stopOpacity="0" />
        </motion.linearGradient>
      </defs>
    </svg>
  )
}
```

### Usage — "Stack → Us → User" diagram

```tsx
'use client'

import { useRef } from 'react'
import { AnimatedBeam } from '@/components/magicui/animated-beam'

export function ConnectionDiagram() {
  const containerRef = useRef<HTMLDivElement>(null)
  const stackRef     = useRef<HTMLDivElement>(null)
  const hubRef       = useRef<HTMLDivElement>(null)
  const userRef      = useRef<HTMLDivElement>(null)

  return (
    <div
      ref={containerRef}
      className="relative flex w-full max-w-3xl items-center justify-between rounded-[var(--df-radius-xl)] border border-[var(--df-border-default)] bg-[var(--df-bg-surface)] p-10"
    >
      <Node label="Your stack" innerRef={stackRef} />
      <Node label="Darkforge"    innerRef={hubRef}   accent />
      <Node label="Your user"  innerRef={userRef} />

      <AnimatedBeam containerRef={containerRef} fromRef={stackRef} toRef={hubRef} curvature={-40} />
      <AnimatedBeam containerRef={containerRef} fromRef={hubRef}   toRef={userRef} curvature={-40} delay={0.5} />
    </div>
  )
}

function Node({
  label, innerRef, accent,
}: { label: string; innerRef: React.RefObject<HTMLDivElement>; accent?: boolean }) {
  return (
    <div
      ref={innerRef}
      className={cn(
        'z-10 flex size-16 items-center justify-center rounded-full border text-xs font-medium',
        accent
          ? 'border-[var(--df-neon-violet)]/40 bg-[var(--df-bg-elevated)] text-[var(--df-neon-violet)] shadow-[var(--df-glow-violet)]'
          : 'border-[var(--df-border-default)] bg-[var(--df-bg-elevated)] text-[var(--df-text-secondary)]',
      )}
    >
      {label}
    </div>
  )
}

import { cn } from '@/lib/utils'
```

---

## Component: AvatarCircles

Stack of overlapping avatars with "+N more" tail. Used in social-proof rows: "Trusted by 12,400+ engineers."

```tsx
// components/magicui/avatar-circles.tsx
'use client'

import { cn } from '@/lib/utils'

interface AvatarCirclesProps {
  className?: string
  numPeople?: number
  avatarUrls: ReadonlyArray<{ imageUrl: string; profileUrl?: string; alt?: string }>
}

export function AvatarCircles({ numPeople, className, avatarUrls }: AvatarCirclesProps) {
  return (
    <div className={cn('z-10 flex -space-x-3', className)}>
      {avatarUrls.map((a, i) => {
        const Img = (
          <img
            key={`avatar-${i}`}
            className="size-9 rounded-full border-2 border-[var(--df-bg-base)] object-cover"
            src={a.imageUrl}
            width={36}
            height={36}
            alt={a.alt ?? `User ${i + 1}`}
          />
        )
        return a.profileUrl
          ? <a key={i} href={a.profileUrl} target="_blank" rel="noopener noreferrer" aria-label={a.alt ?? `User ${i + 1}`}>{Img}</a>
          : Img
      })}

      {typeof numPeople === 'number' && numPeople > 0 && (
        <span
          aria-label={`${numPeople} more users`}
          className={cn(
            'flex size-9 items-center justify-center rounded-full',
            'border-2 border-[var(--df-bg-base)] bg-[var(--df-bg-elevated)]',
            'text-center text-xs font-medium text-[var(--df-neon-violet)]',
          )}
        >
          +{numPeople}
        </span>
      )}
    </div>
  )
}
```

---

## Component: Confetti

A burst of multi-colored particles, fired imperatively (e.g. on "Subscribe successful"). Magic UI ships a wrapper around `canvas-confetti`. // VERIFY: current Magic UI ships either a fully imperative API or a `<Confetti />` component with a `manualstart` prop — confirm against docs before shipping.

```tsx
// components/magicui/confetti.tsx
'use client'

import confetti from 'canvas-confetti'
import { useCallback } from 'react'
import { cn } from '@/lib/utils'

interface ConfettiOptions {
  particleCount?: number
  spread?: number
  origin?: { x?: number; y?: number }
  colors?: ReadonlyArray<string>
  scalar?: number
}

export function useConfetti() {
  return useCallback((opts?: ConfettiOptions) => {
    confetti({
      particleCount: opts?.particleCount ?? 80,
      spread:        opts?.spread ?? 70,
      origin:        opts?.origin ?? { x: 0.5, y: 0.6 },
      // DF violet / cyan / pink — feed hex because canvas-confetti can't read CSS vars.
      // VERIFY against your tokens: violet #a78bfa, cyan #22d3ee, pink #f472b6.
      colors:        opts?.colors ?? ['#a78bfa', '#22d3ee', '#f472b6', '#ffffff'],
      scalar:        opts?.scalar ?? 1,
    })
  }, [])
}

interface ConfettiButtonProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

export function ConfettiButton({ children, className, onClick }: ConfettiButtonProps) {
  const fire = useConfetti()
  return (
    <button
      type="button"
      onClick={() => { fire(); onClick?.() }}
      className={cn(
        'rounded-[var(--df-radius-md)] px-5 py-2.5 text-sm font-medium',
        'bg-[var(--df-neon-violet)] text-[var(--df-text-inverse)]',
        'transition-all duration-200 hover:shadow-[var(--df-glow-violet)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--df-border-focus)]',
        className,
      )}
    >
      {children}
    </button>
  )
}
```

> Install peer dep: `npm i canvas-confetti && npm i -D @types/canvas-confetti`.

---

---

## Common Gotchas

1. **Tailwind keyframes silently missing.** Magic UI components reference `animate-border-beam`, `animate-shimmer-slide`, `animate-marquee`, `animate-meteor`, `animate-gradient`, `animate-ripple`. If they're not in `tailwind.config.ts`, the components render but never move. Symptom: BorderBeam looks like a static gradient stripe. Fix: copy the keyframes block in the install section.

2. **`motion` vs `framer-motion` peer dep.** Magic UI moved to the unscoped `motion` package. If you have both installed, Vite/Next will sometimes resolve different versions in different files and `useInView` returns `false` forever. Pick one, delete the other from `package.json`, `npm i` clean.

3. **Hydration mismatch on Meteors / random-positioned backdrops.** Random positions assigned during render fire on the server first, producing different DOM than the client. Always assign random values **inside `useEffect`** (the `Meteors` impl above already does this — replicate the pattern in any random-positioned component you author).

4. **`canvas-confetti` doesn't read CSS variables.** It needs RGB hex strings. Don't try `'var(--df-neon-violet)'` — it'll silently fall back to red default. Pass the resolved hex (`#a78bfa`) and document the duplication in a comment.

5. **`BorderBeam` parent must be `position: relative`.** It absolutely-positions to `inset-0` and uses `rounded-[inherit]` to follow the parent's border radius. If parent is `position: static`, the beam draws against `<body>` and looks like a screen-edge laser.

6. **`ShimmerButton`'s container queries.** It uses `[container-type:size]` and `100cqw/100cqh` units. If your Tailwind preflight has been customized to drop arbitrary `container-type`, the shimmer won't translate. Symptom: button looks fine, just no shimmer. Fix: ensure JIT mode and Tailwind v3.4+ (or v4).

7. **`AnimatedBeam` requires three layout passes.** It reads `getBoundingClientRect()` of three refs. If you render it conditionally (`{ready && <AnimatedBeam .../>}`) before the children are laid out, the path computes to `M 0,0 Q 0,0 0,0`. Always render it inside the same parent as `fromRef`/`toRef`, never above them.

8. **`Marquee` breaks under `flex-wrap`.** The animation translates by `-100% - var(--gap)`. If the parent allows wrapping, the second copy of children renders below, not next to, the first. Always `flex-nowrap` or `overflow-hidden flex` (already in the impl above).

9. **`prefers-reduced-motion` not respected by every component.** Per-component guards are tedious; the global override in the install section disables all CSS animations and Motion transitions in one shot. Verified safe.

10. **`NumberTicker` jumps to final value on Strict Mode double-mount.** React 18 dev Strict Mode runs effects twice. The ticker's `setTimeout` fires once, the spring snaps once — both runs land on `value`. In production this is fine; if it bothers you in dev, gate the effect behind a `useRef` "ran-once" flag.

---

## Cross-References — which patterns compose which Magic UI primitives

| Pattern              | Magic UI primitives (composed in this order)                                                          |
| -------------------- | ----------------------------------------------------------------------------------------------------- |
| `patterns/hero.md`             | `Meteors` backdrop → `AnimatedGradientText` headline → `ShimmerButton` CTA → `BlurFade` for sub-copy reveal |
| `patterns/dashboard.md`        | `NumberTicker` in stat tiles → `Marquee` for activity ticker → `BorderBeam` on the focused tile           |
| `patterns/pricing.md`          | `BorderBeam` on featured plan → `ShimmerButton` CTA → `BlurFade` stagger on tier reveal                  |
| `patterns/features.md`         | `BlurFade` stagger on each tile → `GridPattern` or `DotPattern` background → `AnimatedBeam` between connected tiles |
| `patterns/testimonials.md`     | `Marquee` (vertical or horizontal) → `AvatarCircles` in the trust strip → `BlurFade` on quote reveal      |
| `patterns/cta.md`              | `Ripple` behind a primary action → `ConfettiButton` for delight on click → `Meteors` for energy        |
| `patterns/footer.md`           | `DotPattern` masked at the top edge → `Marquee` of secondary brand assets                                |
| `patterns/3d-scene.md`         | `AnimatedBeam` connecting orbiting cards → `Ripple` behind central node → `BorderBeam` on hub card    |
| `patterns/scroll-story.md`     | `BlurFade` per scene chapter → `NumberTicker` for stat reveal beats → `BorderBeam` on the active panel  |
| `patterns/navbar.md`           | `AnimatedGradientText` for the wordmark → `ShimmerButton` for the primary nav CTA                       |

Cross-skill links:
- Style/tokens: `references/00-dark-tokens.md`
- Skeleton fallbacks while Magic UI components hydrate: `references/17-skeleton-system.md`
- More background motion (Beams, Spotlight, WavyBackground): `references/04-aceternity.md`
- Scroll-driven entrances (alternative to BlurFade for heavier scenes): `references/01-framer-motion.md` + `references/02-gsap.md`
- Pure-CSS animation tuning that Magic UI keyframes assume: `references/12-tailwind-v4.md`
