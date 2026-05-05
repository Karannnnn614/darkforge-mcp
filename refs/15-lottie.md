# Darkforge — Lottie Dark Reference
Lottie is a JSON-based animation player that renders After Effects compositions in the browser. Darkforge reaches for it in three situations: when designers ship `.json` / `.lottie` files from AE, when a brand-mark or hero illustration needs to feel alive, and for icon micro-interactions that would be tedious to recreate in CSS or SVG.

## Contents

- [Source-of-truth caveat](#source-of-truth-caveat)
- [Install / Setup](#install-setup)
- [Sourcing Animations for AMOLED Dark](#sourcing-animations-for-amoled-dark)
  - [What breaks on AMOLED black](#what-breaks-on-amoled-black)
  - [Recoloring a JSON animation (designer handoff workflow)](#recoloring-a-json-animation-designer-handoff-workflow)
- [Component Patterns](#component-patterns)
  - [1. Branded Loader (dotLottie spinning logo)](#1-branded-loader-dotlottie-spinning-logo)
  - [2. Empty State Illustration (plays once)](#2-empty-state-illustration-plays-once)
  - [3. Success / Error Confirmation](#3-success-error-confirmation)
  - [4. Page Transition (loop while route changes)](#4-page-transition-loop-while-route-changes)
  - [5. Hover-to-Play Icon](#5-hover-to-play-icon)
  - [6. Scroll-Tied Progress](#6-scroll-tied-progress)
- [Performance Best Practices](#performance-best-practices)
- [Common Gotchas](#common-gotchas)
- [Cross-References](#cross-references)

---

## Source-of-truth caveat

> **APIs verified against late-2025 versions of `@lottiefiles/dotlottie-react` (~0.13.x), `lottie-react` (~2.4.x), and `lottie-web` (~5.12.x).** Lottie players ship breaking changes in minor versions — prop casing (`autoplay` vs `autoPlay`), ref callback names, and event names drift. Every uncertain prop in this file is marked with `// VERIFY:`. Before shipping, run `npm view <package> versions --json` and skim the package's README on GitHub. If a prop fails silently, the `// VERIFY:` markers are your first suspects.

---

## Install / Setup

Darkforge recommends `@lottiefiles/dotlottie-react` for new work — `.lottie` files are gzipped containers that are typically 50–80% smaller than raw JSON, and the player is WASM-backed for smoother playback on low-end devices. Use `lottie-react` only when your designer can't export `.lottie` and you have raw `.json`. Reach for `lottie-web` only inside imperative, non-React surfaces (Web Components, vanilla widgets).

```bash
# Recommended — dotLottie format, smaller payloads, WASM player
npm install @lottiefiles/dotlottie-react

# Alternative — classic JSON-driven React wrapper
npm install lottie-react

# Low-level — vanilla JS, no React bindings
npm install lottie-web
```

```tsx
// app/lib/lottie/types.ts
// Shared types so components don't import directly from the library

import type { DotLottie } from '@lottiefiles/dotlottie-react' // VERIFY: type re-export name
import type { LottieRefCurrentProps } from 'lottie-react'

export type DotLottieInstance = DotLottie | null
export type LottieReactRef = React.RefObject<LottieRefCurrentProps>

export interface LottieAriaProps {
  /** Decorative animations: pass `decorative` and component will set aria-hidden */
  decorative?: boolean
  /** Informative animations: pass a label describing what the animation conveys */
  ariaLabel?: string
}
```

```tsx
// app/lib/lottie/use-reduced-motion.ts
'use client'

import { useEffect, useState } from 'react'

/**
 * Returns true when the user prefers reduced motion. SSR-safe — defaults to
 * false until hydration completes, then mirrors the matchMedia value.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const listener = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener('change', listener)
    return () => mq.removeEventListener('change', listener)
  }, [])

  return reduced
}
```

---

## Sourcing Animations for AMOLED Dark

LottieFiles (lottiefiles.com) is the largest library — filter by "Dark Mode" tag and "Free" license. IconScout and Lordicon supply polished icon sets. For brand-mark animations the team should commission a designer; the AE → Bodymovin export pipeline is well-documented, and most agency designers know it.

### What breaks on AMOLED black

- **Solid white background fills** — common in free animations as the bottommost `layers[0]`. On `--df-bg-base` (#000) this becomes a white square. Strip it in AE before export, or delete `layers[0]` in the JSON.
- **Sharp pure-white strokes** look medical against neon. Prefer DF neon hues; reserve `--df-text-primary` for high-contrast informational icons only.
- **Baked-in drop shadows** render as gray smudges. Remove in AE.
- **sRGB+gamma metadata** can wash neon hues; if colors look duller than expected, recolor directly to the DF palette.

### Recoloring a JSON animation (designer handoff workflow)

Lottie stores colors as normalized RGBA arrays (`[0–1, 0–1, 0–1, 1]`) inside deeply nested shape layers, typically at `layers[*].shapes[*].it[*].c.k`. For animated colors, `c.k` is itself an array of keyframes, each with its own `s` (start) value. The two practical strategies:

```ts
// app/lib/lottie/recolor.ts
// Strategy A — designer-controlled hex replacement.
// Use when the designer has agreed to author with placeholder hex values that
// you find/replace at build time. Most reliable for brand handoff.

export function recolorByHex(
  json: string,
  swaps: Record<string, string>,
): string {
  let out = json
  for (const [from, to] of Object.entries(swaps)) {
    const fromNorm = hexToLottieRgb(from)
    const toNorm = hexToLottieRgb(to)
    out = out.replaceAll(JSON.stringify(fromNorm), JSON.stringify(toNorm))
  }
  return out
}

function hexToLottieRgb(hex: string): [number, number, number, number] {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.slice(0, 2), 16) / 255
  const g = parseInt(clean.slice(2, 4), 16) / 255
  const b = parseInt(clean.slice(4, 6), 16) / 255
  return [
    Number(r.toFixed(4)),
    Number(g.toFixed(4)),
    Number(b.toFixed(4)),
    1,
  ]
}

// Strategy B — recursive walker. Use when you don't control the source JSON
// and need to map every existing color to a DF-friendly equivalent.

type LottieJSON = Record<string, unknown>

export function recolorByMap(
  data: LottieJSON,
  predicate: (rgb: [number, number, number]) => [number, number, number] | null,
): LottieJSON {
  const cloned: LottieJSON = JSON.parse(JSON.stringify(data))

  const visit = (node: unknown): void => {
    if (Array.isArray(node)) {
      node.forEach(visit)
      return
    }
    if (node && typeof node === 'object') {
      const obj = node as Record<string, unknown>
      // c.k holds either a static [r,g,b,a] or an array of keyframes
      if ('c' in obj && obj.c && typeof obj.c === 'object') {
        const c = obj.c as { k?: unknown }
        if (Array.isArray(c.k) && typeof c.k[0] === 'number') {
          const [r, g, b] = c.k as number[]
          const next = predicate([r, g, b])
          if (next) c.k = [...next, c.k[3] ?? 1]
        }
      }
      Object.values(obj).forEach(visit)
    }
  }

  visit(cloned)
  return cloned
}

// Example: swap any near-white color to DF violet
// recolorByMap(json, ([r, g, b]) => (r > 0.9 && g > 0.9 && b > 0.9 ? [0.655, 0.545, 0.98] : null))
```

The DF-tuned RGB triplets you'll reach for most:

| DF token | Hex | Lottie RGB |
| --- | --- | --- |
| `--df-neon-violet` | `#a78bfa` | `[0.6549, 0.5451, 0.9804]` |
| `--df-neon-cyan` | `#22d3ee` | `[0.1333, 0.8275, 0.9333]` |
| `--df-neon-pink` | `#f472b6` | `[0.9569, 0.4471, 0.7137]` |
| `--df-neon-green` | `#4ade80` | `[0.2902, 0.8706, 0.5020]` |
| `--df-text-primary` | `#ffffff` | `[1, 1, 1]` |

---

## Component Patterns

All six components below assume the dotLottie player. A `lottie-react` variant of the loader is included to show the alternate API. Every component is `'use client'`, fully typed, mobile-first, and respects `prefers-reduced-motion`.

### 1. Branded Loader (dotLottie spinning logo)

Use as a route-level loading indicator or inside `<Suspense fallback>`. Loops by default. Pauses entirely when reduced motion is active and shows a static last frame, so users still get the brand cue.

```tsx
// app/components/lottie/branded-loader.tsx
'use client'

import { useEffect, useState } from 'react'
import {
  DotLottieReact,
  type DotLottie,
} from '@lottiefiles/dotlottie-react'
import { useReducedMotion } from '@/lib/lottie/use-reduced-motion'

interface BrandedLoaderProps {
  /** URL or local import of the .lottie file. Defaults to Darkforge mark. */
  src?: string
  /** Pixel size — width and height. Defaults to 96. */
  size?: number
  /** Optional caption beneath the mark, e.g., "Loading dashboard…" */
  caption?: string
}

export function BrandedLoader({
  src = '/lottie/nexus-mark.lottie',
  size = 96,
  caption,
}: BrandedLoaderProps) {
  const reduced = useReducedMotion()
  const [instance, setInstance] = useState<DotLottie | null>(null)

  useEffect(() => {
    if (!instance) return
    if (reduced) {
      instance.pause() // VERIFY: pause() exists on the DotLottie instance
    } else {
      instance.play()
    }
  }, [instance, reduced])

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'var(--df-space-3)',
        padding: 'var(--df-space-6)',
        background: 'var(--df-bg-base)',
        color: 'var(--df-text-secondary)',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          width: size,
          height: size,
          filter: 'drop-shadow(var(--df-glow-violet))',
        }}
      >
        <DotLottieReact
          src={src}
          autoplay={!reduced} // VERIFY: prop is lowercase `autoplay`
          loop
          dotLottieRefCallback={setInstance} // VERIFY: ref callback prop name
          style={{ width: '100%', height: '100%' }}
        />
      </div>
      {caption && (
        <span style={{ fontSize: 13, letterSpacing: '0.02em' }}>{caption}</span>
      )}
      <span className="sr-only">Loading</span>
    </div>
  )
}
```

For raw `.json` files via `lottie-react`, the equivalent shape is:

```tsx
// Inside a 'use client' file
import Lottie, { type LottieRefCurrentProps } from 'lottie-react'
import nexusMark from '@/lottie/nexus-mark.json'

const ref = useRef<LottieRefCurrentProps>(null)
const reduced = useReducedMotion()

useEffect(() => {
  if (!ref.current) return
  reduced ? ref.current.pause() : ref.current.play()
}, [reduced])

return <Lottie lottieRef={ref} animationData={nexusMark} loop autoplay={!reduced} />
```

### 2. Empty State Illustration (plays once)

For "no results", "inbox zero", "no team members yet" surfaces. Plays once on mount, stops on the final frame. Includes a heading + body + optional CTA so the whole pattern lives in one component.

```tsx
// app/components/lottie/empty-state.tsx
'use client'

import { useEffect, useState, type ReactNode } from 'react'
import {
  DotLottieReact,
  type DotLottie,
} from '@lottiefiles/dotlottie-react'
import { useReducedMotion } from '@/lib/lottie/use-reduced-motion'

interface EmptyStateProps {
  src: string
  title: string
  description: string
  /** Slot for an action button or link */
  action?: ReactNode
  /** Override default 220px illustration height */
  illustrationSize?: number
}

export function EmptyState({
  src,
  title,
  description,
  action,
  illustrationSize = 220,
}: EmptyStateProps) {
  const reduced = useReducedMotion()
  const [instance, setInstance] = useState<DotLottie | null>(null)

  useEffect(() => {
    if (!instance || reduced) return
    instance.play()
  }, [instance, reduced])

  return (
    <section
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: 'var(--df-space-4)',
        padding: 'var(--df-space-10) var(--df-space-4)',
        background: 'var(--df-bg-surface)',
        border: '1px solid var(--df-border-subtle)',
        borderRadius: 'var(--df-radius-xl)',
        maxWidth: 480,
        margin: '0 auto',
      }}
    >
      <div
        role="img"
        aria-label={`Illustration: ${title}`}
        style={{
          width: '100%',
          maxWidth: illustrationSize,
          aspectRatio: '1 / 1',
        }}
      >
        <DotLottieReact
          src={src}
          autoplay={!reduced}
          loop={false}
          dotLottieRefCallback={setInstance}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
      <h2 style={{ color: 'var(--df-text-primary)', fontSize: 20, margin: 0, fontWeight: 600 }}>
        {title}
      </h2>
      <p style={{ color: 'var(--df-text-secondary)', fontSize: 14, margin: 0, lineHeight: 1.5 }}>
        {description}
      </p>
      {action && <div style={{ marginTop: 'var(--df-space-2)' }}>{action}</div>}
    </section>
  )
}

// Usage:
// <EmptyState
//   src="/lottie/empty-inbox.lottie"
//   title="Inbox zero"
//   description="You're all caught up. New messages will land here."
//   action={<NeonButton onClick={refresh}>Refresh</NeonButton>}
// />
```

### 3. Success / Error Confirmation

Plays once on mount and stays on the last frame — checkmark draws, X scribbles itself out. Use after form submits, payment confirmations, destructive actions. Reduced-motion users see the final state instantly.

```tsx
// app/components/lottie/confirmation.tsx
'use client'

import { useEffect, useState } from 'react'
import {
  DotLottieReact,
  type DotLottie,
} from '@lottiefiles/dotlottie-react'
import { useReducedMotion } from '@/lib/lottie/use-reduced-motion'

type ConfirmationKind = 'success' | 'error' | 'warning'

interface ConfirmationProps {
  kind: ConfirmationKind
  title: string
  message: string
}

const KIND_CONFIG: Record<
  ConfirmationKind,
  { src: string; tint: string; ariaPrefix: string }
> = {
  success: {
    src: '/lottie/check-success.lottie',
    tint: 'var(--df-neon-green)',
    ariaPrefix: 'Success',
  },
  error: {
    src: '/lottie/cross-error.lottie',
    tint: 'var(--df-neon-red)',
    ariaPrefix: 'Error',
  },
  warning: {
    src: '/lottie/alert-warning.lottie',
    tint: 'var(--df-neon-amber)',
    ariaPrefix: 'Warning',
  },
}

export function Confirmation({ kind, title, message }: ConfirmationProps) {
  const reduced = useReducedMotion()
  const cfg = KIND_CONFIG[kind]
  const [instance, setInstance] = useState<DotLottie | null>(null)

  useEffect(() => {
    if (!instance) return
    if (reduced) {
      // Snap to final frame so the user still sees the checkmark / X
      instance.setFrame?.(instance.totalFrames ?? 0) // VERIFY: setFrame + totalFrames API
      instance.pause()
    } else {
      instance.play()
    }
  }, [instance, reduced])

  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'var(--df-space-3)',
        padding: 'var(--df-space-6)',
        background: 'var(--df-bg-elevated)',
        border: `1px solid ${cfg.tint}33`,
        borderRadius: 'var(--df-radius-lg)',
        boxShadow: `0 0 32px ${cfg.tint}22`,
        maxWidth: 360,
      }}
    >
      <div
        aria-label={`${cfg.ariaPrefix}: ${title}`}
        role="img"
        style={{ width: 96, height: 96 }}
      >
        <DotLottieReact
          src={cfg.src}
          autoplay={!reduced}
          loop={false}
          dotLottieRefCallback={setInstance}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
      <h3 style={{ color: cfg.tint, fontSize: 16, margin: 0, fontWeight: 600 }}>
        {title}
      </h3>
      <p style={{ color: 'var(--df-text-secondary)', fontSize: 13, margin: 0, textAlign: 'center', lineHeight: 1.5 }}>
        {message}
      </p>
    </div>
  )
}
```

### 4. Page Transition (loop while route changes)

Plays a loading bar / loop while a Next.js navigation is pending, then unmounts. The container is fixed-position so it overlays without shifting layout. In reduced-motion mode the same component renders a static progress shimmer instead of the animation.

```tsx
// app/components/lottie/route-transition.tsx
'use client'

import { useEffect, useState } from 'react'
import { DotLottieReact } from '@lottiefiles/dotlottie-react'
import { useReducedMotion } from '@/lib/lottie/use-reduced-motion'

interface RouteTransitionProps {
  /** Set true when navigation is pending (e.g., from a Next.js useTransition) */
  active: boolean
  /** Optional override — defaults to DF-tinted progress bar animation */
  src?: string
}

export function RouteTransition({
  active,
  src = '/lottie/route-loader-violet.lottie',
}: RouteTransitionProps) {
  const reduced = useReducedMotion()
  const [render, setRender] = useState(active)

  // Keep the element mounted long enough to fade out
  useEffect(() => {
    if (active) {
      setRender(true)
      return
    }
    const timeout = window.setTimeout(() => setRender(false), 250)
    return () => window.clearTimeout(timeout)
  }, [active])

  if (!render) return null

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        zIndex: 'var(--df-z-toast)' as unknown as number,
        opacity: active ? 1 : 0,
        transition: 'opacity 250ms var(--df-ease-smooth)',
        pointerEvents: 'none',
      }}
    >
      {reduced ? (
        <div
          style={{
            height: '100%',
            width: '100%',
            background: `linear-gradient(90deg, transparent, var(--df-neon-violet), transparent)`,
            backgroundSize: '200% 100%',
            animation: 'nx-shimmer 1.2s linear infinite',
          }}
        />
      ) : (
        <DotLottieReact
          src={src}
          autoplay
          loop
          style={{ width: '100%', height: '100%' }}
        />
      )}
    </div>
  )
}

// Usage in a Next.js layout:
// const [pending, startTransition] = useTransition()
// <RouteTransition active={pending} />
```

### 5. Hover-to-Play Icon

Plays forward on hover, plays backward on leave. Used in nav rails, feature lists, "see more" cards. Stays at frame 0 at rest, frame N while hovered. Reduced-motion users see a CSS transform fallback (subtle scale) so the affordance survives.

```tsx
// app/components/lottie/hover-icon.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import {
  DotLottieReact,
  type DotLottie,
} from '@lottiefiles/dotlottie-react'
import { useReducedMotion } from '@/lib/lottie/use-reduced-motion'

interface HoverIconProps {
  src: string
  size?: number
  /** Forwarded to the wrapper, e.g., for keyboard focus handling on a parent button */
  onActivate?: () => void
}

export function HoverIcon({ src, size = 28, onActivate }: HoverIconProps) {
  const reduced = useReducedMotion()
  const [instance, setInstance] = useState<DotLottie | null>(null)
  const wrapperRef = useRef<HTMLSpanElement>(null)
  const [hovered, setHovered] = useState(false)

  useEffect(() => {
    if (!instance || reduced) return
    if (hovered) {
      instance.setMode?.('forward') // VERIFY: setMode signature
      instance.play()
    } else {
      instance.setMode?.('reverse')
      instance.play()
    }
  }, [hovered, instance, reduced])

  return (
    <span
      ref={wrapperRef}
      aria-hidden="true"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => {
        setHovered(true)
        onActivate?.()
      }}
      onBlur={() => setHovered(false)}
      style={{
        display: 'inline-flex',
        width: size,
        height: size,
        transform: reduced && hovered ? 'scale(1.08)' : 'scale(1)',
        transition: 'transform 200ms var(--df-ease-out)',
      }}
    >
      {!reduced && (
        <DotLottieReact
          src={src}
          autoplay={false}
          loop={false}
          dotLottieRefCallback={setInstance}
          style={{ width: '100%', height: '100%' }}
        />
      )}
    </span>
  )
}

// Usage:
// <button className="nx-glow-border" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
//   <HoverIcon src="/lottie/icons/arrow-right.lottie" />
//   Continue
// </button>
```

### 6. Scroll-Tied Progress

Drives a frame index from scroll position — useful for hero illustrations that "build" as the user scrolls, or section-anchored explainers. Uses an `IntersectionObserver` to skip work while the element is offscreen, and `requestAnimationFrame` to throttle frame updates to the screen's refresh rate.

```tsx
// app/components/lottie/scroll-progress.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import {
  DotLottieReact,
  type DotLottie,
} from '@lottiefiles/dotlottie-react'
import { useReducedMotion } from '@/lib/lottie/use-reduced-motion'

interface ScrollProgressProps {
  src: string
  /** How tall the scroll track should be relative to viewport. Defaults to 200vh. */
  trackHeight?: string
}

export function ScrollProgress({ src, trackHeight = '200vh' }: ScrollProgressProps) {
  const reduced = useReducedMotion()
  const [instance, setInstance] = useState<DotLottie | null>(null)
  const [totalFrames, setTotalFrames] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const stickyRef = useRef<HTMLDivElement>(null)
  const inViewRef = useRef(false)

  // Capture totalFrames once the file finishes loading
  useEffect(() => {
    if (!instance) return
    const handleLoad = () => {
      setTotalFrames(instance.totalFrames ?? 0) // VERIFY: totalFrames property
    }
    instance.addEventListener?.('load', handleLoad) // VERIFY: 'load' event name
    return () => instance.removeEventListener?.('load', handleLoad)
  }, [instance])

  // Track viewport visibility so we don't process scroll for offscreen players
  useEffect(() => {
    const node = containerRef.current
    if (!node) return
    const io = new IntersectionObserver(
      ([entry]) => {
        inViewRef.current = entry.isIntersecting
      },
      { threshold: 0 },
    )
    io.observe(node)
    return () => io.disconnect()
  }, [])

  // Drive frames from scroll progress
  useEffect(() => {
    if (!instance || !totalFrames || reduced) return
    let raf = 0
    const onScroll = () => {
      if (raf || !inViewRef.current || !containerRef.current) return
      raf = window.requestAnimationFrame(() => {
        raf = 0
        const rect = containerRef.current!.getBoundingClientRect()
        const progressed = -rect.top
        const distance = rect.height - window.innerHeight
        const pct = Math.max(0, Math.min(1, progressed / Math.max(1, distance)))
        instance.setFrame?.(Math.round(pct * (totalFrames - 1)))
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (raf) window.cancelAnimationFrame(raf)
    }
  }, [instance, totalFrames, reduced])

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        height: trackHeight,
        background: 'var(--df-bg-base)',
      }}
    >
      <div
        ref={stickyRef}
        style={{
          position: 'sticky',
          top: 0,
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          role="img"
          aria-label="Animated diagram that progresses as you scroll"
          style={{ width: 'min(80vw, 560px)', aspectRatio: '1 / 1' }}
        >
          {reduced ? (
            // Static fallback poster — replace with an SVG keyframe export
            <img
              src="/lottie/scroll-diagram.poster.svg"
              alt=""
              style={{ width: '100%', height: '100%' }}
            />
          ) : (
            <DotLottieReact
              src={src}
              autoplay={false}
              loop={false}
              dotLottieRefCallback={setInstance}
              style={{ width: '100%', height: '100%' }}
            />
          )}
        </div>
      </div>
    </div>
  )
}
```

---

## Performance Best Practices

Lottie is heavier than CSS or SVG by an order of magnitude. The animation runs every frame and re-rasterizes shapes, so treat it like an embedded video, not a button. Apply these rules unconditionally:

```tsx
// 1. LAZY-LOAD THE PLAYER. The dotLottie WASM bundle is ~150KB; don't ship it
//    on routes that don't render an animation. Use Next.js dynamic imports
//    with ssr: false because the player touches `window` on instantiation.

// app/components/lottie/lazy.tsx
'use client'

import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton' // from references/17-skeleton-system.md

export const LazyBrandedLoader = dynamic(
  () => import('./branded-loader').then(m => m.BrandedLoader),
  {
    ssr: false,
    loading: () => <Skeleton width={96} height={96} borderRadius="50%" />,
  },
)
```

```tsx
// 2. PRELOAD CRITICAL ANIMATIONS. For first-paint mark animations, fetch the
//    .lottie file early so the player has bytes ready when it mounts.

// app/components/lottie/preload-link.tsx
export function LottiePreloadLink({ src }: { src: string }) {
  return (
    <link
      rel="preload"
      href={src}
      as="fetch"
      type="application/zip"
      crossOrigin="anonymous"
    />
  )
}
// Drop into <Head> for the brand mark used on the landing route.
```

```tsx
// 3. AUTOPLAY ONLY WHEN VISIBLE. Off-screen Lotties still consume a render
//    timeline. Pause them when scrolled out.

// app/lib/lottie/use-in-viewport.ts
'use client'

import { useEffect, useRef, useState } from 'react'

export function useInViewport<T extends HTMLElement>(threshold = 0.1) {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const node = ref.current
    if (!node) return
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold })
    io.observe(node)
    return () => io.disconnect()
  }, [threshold])
  return [ref, inView] as const
}
```

```tsx
// 4. PREFER .lottie OVER .json. A typical 200KB JSON compresses to ~40KB as
//    .lottie. Convert via https://lottielab.com/convert or the
//    `dotlottie-js` package locally:
//      npx dotlottie-js path/to/anim.json --output public/lottie/
```

```ts
// 5. CHOOSE THE RIGHT RENDERER.
//    - dotLottie / lottie-web default to the SVG renderer — DOM-friendly, sharp
//      at any size, but heavy on layer-heavy animations.
//    - The `canvas` renderer (set on lottie-web via lottie.loadAnimation({ renderer: 'canvas' }))
//      uses the GPU on most browsers, ideal for confetti-style or 30+ layer animations,
//      but blurs at high DPR if you forget to scale the canvas. // VERIFY: 'canvas' renderer flag
//    - dotLottie defaults to canvas via WASM and is generally the fastest pick.
```

---

## Common Gotchas

**SSR errors with `window is not defined`.** Both player libraries instantiate against `window` synchronously. In Next.js App Router, mark every component that imports the player as `'use client'`, and use `dynamic(() => import('…'), { ssr: false })` for code-splitting.

**Animation flashes a frozen first frame.** Happens when `autoplay` is set but the asset is still streaming. Either preload the file (see Performance #2) or render a `Skeleton` until the player's `load` event fires.

**Hover-replay double-trigger on rapid mouse movement.** When `play()` is called every render, `lottie-react` will jitter. Track the hovered state in a `useState` (as in component 5) and let `useEffect` issue exactly one play call per state change — never call `play()` directly in the JSX event handler.

**Color overrides don't apply on interactive contexts.** `recolorByMap` only walks the JSON once. If you want hover/focus to recolor, you have two options: (a) keep two distinct `.lottie` files and swap `src` on hover, or (b) wrap in a CSS filter chain — `filter: hue-rotate(180deg) saturate(1.2)` — accepting the imprecision. Recoloring per-event at runtime is too expensive and causes a layout flash.

**Accessibility mismatch.** Decorative animations (loaders, hover icons, page transitions) need `aria-hidden="true"` on the wrapping element. Informative animations (success/error confirmations, empty states, scroll-tied diagrams) need `role="img"` plus a descriptive `aria-label` that conveys the meaning, not the visual content. "Confetti animation" is wrong; "Payment confirmed" is right.

**Reduced-motion noncompliance.** A Lottie that ignores `prefers-reduced-motion: reduce` is an accessibility bug. The hook in this file handles three behaviors: pause loops, snap once-on-mount animations to their last frame, and disable hover-replay. Wire all three explicitly — there is no global "disable Lottie" switch.

**Memory leaks on route change.** Some `lottie-web` versions don't tear down `requestAnimationFrame` cleanly when the React component unmounts. If a profile shows growing memory after navigating, call `instance.destroy()` // VERIFY: destroy method on dotLottie inside the `useEffect` cleanup. The wrappers above usually handle this, but watch for it on long-lived dashboards.

**Large JSON in your bundle.** Importing a 400KB JSON via `import data from './anim.json'` ships the whole thing in your client bundle. Always serve `.lottie` (or `.json`) from `/public` and pass `src` as a URL — the player will fetch lazily.

**Designer hands you a 60fps export.** Lottie respects the AE comp framerate. If a designer ships a 60fps anim, low-end mobile devices will drop frames trying to keep up. Ask designers to export at 30fps unless the animation explicitly needs the higher cadence.

---

## Cross-References

- **Hero brand-mark animation** — see `references/patterns/hero/*` for `BrandedLoader`-style mark playback layered behind a glass card.
- **CTA success state** — `references/patterns/cta/*` pairs the `Confirmation` component with `references/01-framer-motion.md` for the post-confirm transition.
- **Dashboard empty data illustration** — combine `EmptyState` here with the `StatCardSkeleton` in `references/17-skeleton-system.md` to handle "loading → empty" gracefully without a flash of the illustration during the first paint.
- **Token foundation** — every color value above resolves to a token from `references/00-dark-tokens.md`.
- **Motion siblings** — for code-driven animation see `references/01-framer-motion.md` (state-driven motion) and `references/02-gsap.md` (timeline-driven motion). Use Lottie when the animation is asset-driven and would be tedious to recreate by hand.
