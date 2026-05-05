# Darkforge — Vanta.js + Spline Dark Reference
When Darkforge needs animated WebGL backgrounds without writing Three.js code, or when a designer hands off an interactive 3D scene built in Spline. These are the lowest-friction paths to a "wow" 3D moment when full R3F isn't justified.

## Contents

- [Source-of-truth caveat](#source-of-truth-caveat)
- [Vanta.js — Install / Setup](#vantajs-install-setup)
- [Vanta Effects with DF Color Palette](#vanta-effects-with-nx-color-palette)
  - [NET — Geometric net (violet on AMOLED)](#net-geometric-net-violet-on-amoled)
  - [WAVES — Cyan + violet silk](#waves-cyan-violet-silk)
  - [CELLS — Pink organic membrane](#cells-pink-organic-membrane)
  - [BIRDS — Neon flock (uses p5, NOT three)](#birds-neon-flock-uses-p5-not-three)
  - [HALO — Violet orbital](#halo-violet-orbital)
  - [DOTS — Cyan point cloud](#dots-cyan-point-cloud)
- [Reusable VantaBackground Router](#reusable-vantabackground-router)
- [Spline — Install / Setup](#spline-install-setup)
- [Spline Embedding Patterns](#spline-embedding-patterns)
  - [Pattern 1 — Hero scene (full bleed, fixed background)](#pattern-1-hero-scene-full-bleed-fixed-background)
  - [Pattern 2 — Product showcase (interactive, 60% width)](#pattern-2-product-showcase-interactive-60-width)
  - [Pattern 3 — Lazy-loaded modal scene](#pattern-3-lazy-loaded-modal-scene)
- [Performance & Mobile](#performance-and-mobile)
- [Common Gotchas](#common-gotchas)
- [Cross-References](#cross-references)

---

## Source-of-truth caveat

Written from training-data recall (Jan 2026 cutoff) — **context7, WebFetch, and live-doc tools are denied in this sandbox**. Verify these surfaces against their official docs before publishing the plugin release:

- Vanta peer-dep: **you bring your own THREE** (`vanta` does not bundle three.js — pass it in via `THREE` config option). Most builds want `three@0.134` (the version Vanta was developed against) OR a current `three` version with the THREE-injection pattern below.
- `BIRDS` effect uniquely depends on **p5.js**, not three.js. If you're using only `BIRDS`, install `p5` instead.
- Spline: `@splinetool/react-spline` v4+. Next.js App Router uses the `/next` subpath: `import Spline from '@splinetool/react-spline/next'`.
- Browsers cap WebGL contexts at ~16 — putting too many Vanta/Spline scenes on one page will silently drop the older ones. Use `IntersectionObserver` + lazy mount + cleanup on unmount.
- Every `// VERIFY:` comment below flags a prop name or API surface that's stable in spirit but may have shifted by minor version.

---

## Vanta.js — Install / Setup

```bash
npm install vanta three
# (or `npm install vanta p5` if you only need BIRDS)
```

Vanta's effects mutate the DOM imperatively and need a real ref to attach to. They are **client-only** — never render Vanta in a server component or during SSR (the WebGL context will throw).

Conventions used in every example below:

- `useRef<HTMLDivElement>(null)` for the container
- `useRef<{ destroy: () => void } | null>(null)` for the Vanta instance (NOT `useState` — we don't want re-renders to recreate the effect)
- `useEffect` with cleanup that calls `effect.destroy()`
- `prefers-reduced-motion` early-return that swaps to a static DF gradient fallback
- `aria-hidden="true"` on the canvas wrapper (decorative only)
- `'use client'` directive

---

## Vanta Effects with DF Color Palette

Each effect below maps Vanta's color args to the DF neon palette. Vanta accepts WebGL color values as numeric hex (e.g. `0xa78bfa`) — that's allowed because it's WebGL-internal, not DOM/CSS. DOM/CSS uses DF vars throughout.

### NET — Geometric net (violet on AMOLED)

The flagship effect. Best for hero backgrounds.

```tsx
'use client'
import { useEffect, useRef } from 'react'

interface VantaInstance { destroy: () => void }
interface VantaNetProps {
  className?: string
  fallbackToStaticOnReducedMotion?: boolean
}

export function VantaNet({ className, fallbackToStaticOnReducedMotion = true }: VantaNetProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const effectRef = useRef<VantaInstance | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const prefersReduced = typeof window !== 'undefined'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReduced && fallbackToStaticOnReducedMotion) return

    let cancelled = false

    ;(async () => {
      const [{ default: NET }, THREE] = await Promise.all([
        // VERIFY: subpath for individual effects
        import('vanta/dist/vanta.net.min'),
        import('three'),
      ])
      if (cancelled || !containerRef.current) return

      effectRef.current = NET({
        el: containerRef.current,
        THREE,                     // <- bring-your-own-THREE pattern
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200,
        minWidth: 200,
        scale: 1,
        scaleMobile: 1,
        color: 0xa78bfa,            // var(--df-neon-violet)
        backgroundColor: 0x000000,  // var(--df-bg-base)
        points: 10,
        maxDistance: 22,
        spacing: 16,
      }) as VantaInstance
    })()

    return () => {
      cancelled = true
      effectRef.current?.destroy()
      effectRef.current = null
    }
  }, [fallbackToStaticOnReducedMotion])

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={className}
      style={{
        position: 'absolute',
        inset: 0,
        background: 'var(--df-bg-base)',
      }}
    />
  )
}
```

### WAVES — Cyan + violet silk

Smooth animated wave plane. Best for sub-hero or section dividers.

```tsx
'use client'
import { useEffect, useRef } from 'react'

interface VantaInstance { destroy: () => void }

export function VantaWaves({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const effectRef = useRef<VantaInstance | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let cancelled = false
    ;(async () => {
      const [{ default: WAVES }, THREE] = await Promise.all([
        import('vanta/dist/vanta.waves.min'),
        import('three'),
      ])
      if (cancelled || !containerRef.current) return
      effectRef.current = WAVES({
        el: containerRef.current,
        THREE,
        mouseControls: true,
        touchControls: true,
        minHeight: 200,
        minWidth: 200,
        scale: 1,
        scaleMobile: 1,
        color: 0x22d3ee,             // var(--df-neon-cyan)
        shininess: 30,
        waveHeight: 18,
        waveSpeed: 0.65,
        zoom: 0.85,
      }) as VantaInstance
    })()

    return () => {
      cancelled = true
      effectRef.current?.destroy()
      effectRef.current = null
    }
  }, [])

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={className}
      style={{ position: 'absolute', inset: 0, background: 'var(--df-bg-base)' }}
    />
  )
}
```

### CELLS — Pink organic membrane

Voronoi-style cellular pattern. Great for biology/health/AI brand contexts.

```tsx
'use client'
import { useEffect, useRef } from 'react'
interface VantaInstance { destroy: () => void }

export function VantaCells({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const effectRef = useRef<VantaInstance | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let cancelled = false
    ;(async () => {
      const [{ default: CELLS }, THREE] = await Promise.all([
        import('vanta/dist/vanta.cells.min'),
        import('three'),
      ])
      if (cancelled || !containerRef.current) return
      effectRef.current = CELLS({
        el: containerRef.current,
        THREE,
        mouseControls: true,
        touchControls: true,
        minHeight: 200,
        minWidth: 200,
        scale: 1,
        scaleMobile: 1,
        color1: 0xf472b6,           // var(--df-neon-pink)
        color2: 0x080808,           // var(--df-bg-surface)
        size: 1.5,
        speed: 1,
      }) as VantaInstance
    })()

    return () => {
      cancelled = true
      effectRef.current?.destroy()
      effectRef.current = null
    }
  }, [])

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={className}
      style={{ position: 'absolute', inset: 0, background: 'var(--df-bg-base)' }}
    />
  )
}
```

### BIRDS — Neon flock (uses p5, NOT three)

Birds is the one Vanta effect built on **p5.js**, not three.js. Install `p5` if you use it.

```tsx
'use client'
import { useEffect, useRef } from 'react'
interface VantaInstance { destroy: () => void }

export function VantaBirds({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const effectRef = useRef<VantaInstance | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let cancelled = false
    ;(async () => {
      // VERIFY: BIRDS uniquely needs p5, not THREE
      const [{ default: BIRDS }, p5] = await Promise.all([
        import('vanta/dist/vanta.birds.min'),
        import('p5'),
      ])
      if (cancelled || !containerRef.current) return
      effectRef.current = BIRDS({
        el: containerRef.current,
        p5: p5.default,
        mouseControls: true,
        touchControls: true,
        minHeight: 200,
        minWidth: 200,
        scale: 1,
        scaleMobile: 1,
        backgroundColor: 0x000000,   // var(--df-bg-base)
        color1: 0xa78bfa,            // var(--df-neon-violet)
        color2: 0x22d3ee,            // var(--df-neon-cyan)
        birdSize: 1,
        wingSpan: 22,
        speedLimit: 4,
        separation: 30,
        alignment: 30,
        cohesion: 30,
        quantity: 4,
      }) as VantaInstance
    })()

    return () => {
      cancelled = true
      effectRef.current?.destroy()
      effectRef.current = null
    }
  }, [])

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={className}
      style={{ position: 'absolute', inset: 0, background: 'var(--df-bg-base)' }}
    />
  )
}
```

### HALO — Violet orbital

Orbital ring effect. Great for product hero "above the fold" energy.

```tsx
'use client'
import { useEffect, useRef } from 'react'
interface VantaInstance { destroy: () => void }

export function VantaHalo({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const effectRef = useRef<VantaInstance | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let cancelled = false
    ;(async () => {
      const [{ default: HALO }, THREE] = await Promise.all([
        import('vanta/dist/vanta.halo.min'),
        import('three'),
      ])
      if (cancelled || !containerRef.current) return
      effectRef.current = HALO({
        el: containerRef.current,
        THREE,
        mouseControls: true,
        touchControls: true,
        minHeight: 200,
        minWidth: 200,
        baseColor: 0xa78bfa,        // var(--df-neon-violet)
        backgroundColor: 0x000000,  // var(--df-bg-base)
        amplitudeFactor: 1.2,
        size: 1.4,
      }) as VantaInstance
    })()

    return () => {
      cancelled = true
      effectRef.current?.destroy()
      effectRef.current = null
    }
  }, [])

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={className}
      style={{ position: 'absolute', inset: 0, background: 'var(--df-bg-base)' }}
    />
  )
}
```

### DOTS — Cyan point cloud

Subtle dotted background. Quietest Vanta effect — works as a permanent ambient.

```tsx
'use client'
import { useEffect, useRef } from 'react'
interface VantaInstance { destroy: () => void }

export function VantaDots({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const effectRef = useRef<VantaInstance | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let cancelled = false
    ;(async () => {
      const [{ default: DOTS }, THREE] = await Promise.all([
        import('vanta/dist/vanta.dots.min'),
        import('three'),
      ])
      if (cancelled || !containerRef.current) return
      effectRef.current = DOTS({
        el: containerRef.current,
        THREE,
        mouseControls: true,
        touchControls: true,
        minHeight: 200,
        minWidth: 200,
        scale: 1,
        scaleMobile: 1,
        color: 0x22d3ee,             // var(--df-neon-cyan)
        color2: 0xa78bfa,            // var(--df-neon-violet)
        backgroundColor: 0x000000,   // var(--df-bg-base)
        size: 3,
        spacing: 35,
        showLines: false,
      }) as VantaInstance
    })()

    return () => {
      cancelled = true
      effectRef.current?.destroy()
      effectRef.current = null
    }
  }, [])

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={className}
      style={{ position: 'absolute', inset: 0, background: 'var(--df-bg-base)' }}
    />
  )
}
```

---

## Reusable VantaBackground Router

When you want a single component that switches between effects via prop. Use lazy IntersectionObserver to mount only when in view.

```tsx
'use client'
import { useEffect, useRef, useState } from 'react'

type VantaEffect = 'NET' | 'WAVES' | 'CELLS' | 'BIRDS' | 'HALO' | 'DOTS'
interface VantaInstance { destroy: () => void }

interface VantaBackgroundProps {
  effect: VantaEffect
  className?: string
  /** DF neon: 'violet' | 'cyan' | 'pink'. Maps to the effect's primary color. */
  accent?: 'violet' | 'cyan' | 'pink'
  /** Lazy-mount only when scrolled into view (recommended for non-hero sections). */
  lazy?: boolean
}

const NEON: Record<NonNullable<VantaBackgroundProps['accent']>, number> = {
  violet: 0xa78bfa,
  cyan: 0x22d3ee,
  pink: 0xf472b6,
}

export function VantaBackground({
  effect,
  className,
  accent = 'violet',
  lazy = true,
}: VantaBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const effectRef = useRef<VantaInstance | null>(null)
  const [shouldMount, setShouldMount] = useState(!lazy)

  useEffect(() => {
    if (!lazy || !containerRef.current) return
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setShouldMount(true),
      { rootMargin: '200px' },
    )
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [lazy])

  useEffect(() => {
    if (!shouldMount || !containerRef.current) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let cancelled = false
    ;(async () => {
      const color = NEON[accent]
      // VERIFY: each effect file path
      if (effect === 'BIRDS') {
        const [{ default: BIRDS }, p5] = await Promise.all([
          import('vanta/dist/vanta.birds.min'),
          import('p5'),
        ])
        if (cancelled || !containerRef.current) return
        effectRef.current = BIRDS({
          el: containerRef.current,
          p5: p5.default,
          backgroundColor: 0x000000,
          color1: color,
          color2: 0x22d3ee,
        }) as VantaInstance
      } else {
        const moduleMap = {
          NET: () => import('vanta/dist/vanta.net.min'),
          WAVES: () => import('vanta/dist/vanta.waves.min'),
          CELLS: () => import('vanta/dist/vanta.cells.min'),
          HALO: () => import('vanta/dist/vanta.halo.min'),
          DOTS: () => import('vanta/dist/vanta.dots.min'),
        } as const
        const [{ default: Effect }, THREE] = await Promise.all([
          moduleMap[effect](),
          import('three'),
        ])
        if (cancelled || !containerRef.current) return
        const baseConfig = {
          el: containerRef.current,
          THREE,
          mouseControls: true,
          touchControls: true,
          minHeight: 200,
          minWidth: 200,
          backgroundColor: 0x000000,
        }
        effectRef.current = Effect(
          effect === 'CELLS'
            ? { ...baseConfig, color1: color, color2: 0x080808, size: 1.5, speed: 1 }
            : { ...baseConfig, color, ...(effect === 'HALO' ? { baseColor: color } : {}) }
        ) as VantaInstance
      }
    })()

    return () => {
      cancelled = true
      effectRef.current?.destroy()
      effectRef.current = null
    }
  }, [shouldMount, effect, accent])

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={className}
      style={{
        position: 'absolute',
        inset: 0,
        background: 'var(--df-bg-base)',
      }}
    />
  )
}
```

---

## Spline — Install / Setup

```bash
npm install @splinetool/react-spline @splinetool/runtime
```

Spline ships scenes from their visual editor (spline.design) as `.splinecode` files served from a CDN URL. Free tier is fine for portfolios; paid for commercial.

**Next.js App Router**: import from the `/next` subpath so the runtime is dynamically loaded only on the client:

```ts
// app router
import Spline from '@splinetool/react-spline/next'
// pages router or vanilla React
import Spline from '@splinetool/react-spline'
```

---

## Spline Embedding Patterns

### Pattern 1 — Hero scene (full bleed, fixed background)

The Spline scene fills the hero; HTML content sits absolutely on top.

```tsx
'use client'
import Spline from '@splinetool/react-spline/next'
import { Suspense } from 'react'

export function SplineHero() {
  return (
    <section
      style={{
        position: 'relative',
        minHeight: '100vh',
        background: 'var(--df-bg-base)',
        overflow: 'hidden',
      }}
    >
      <Suspense
        fallback={
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'radial-gradient(ellipse at center, rgba(167,139,250,0.18) 0%, transparent 60%), var(--df-bg-base)',
            }}
          />
        }
      >
        <Spline
          scene="https://prod.spline.design/your-public-scene/scene.splinecode" // VERIFY: replace with real URL
          aria-hidden="true"
          style={{ position: 'absolute', inset: 0 }}
        />
      </Suspense>

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          minHeight: '100vh',
          padding: '0 24px',
          maxWidth: 1200,
          margin: '0 auto',
        }}
      >
        <div style={{ maxWidth: 540 }}>
          <h1
            style={{
              fontSize: 'clamp(40px, 6vw, 72px)',
              fontWeight: 700,
              color: 'var(--df-text-primary)',
              lineHeight: 1.1,
              letterSpacing: '-0.025em',
              margin: '0 0 20px',
            }}
          >
            Built in{' '}
            <span
              style={{
                background:
                  'linear-gradient(135deg, var(--df-neon-violet), var(--df-neon-cyan))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              3D
            </span>
            . Shipped on the web.
          </h1>
          <p
            style={{
              color: 'var(--df-text-secondary)',
              fontSize: 18,
              lineHeight: 1.65,
              margin: '0 0 32px',
            }}
          >
            Drop interactive Spline scenes into any React app. No 3D code required.
          </p>
          <a
            href="/signup"
            style={{
              display: 'inline-block',
              background: 'var(--df-neon-violet)',
              color: 'var(--df-text-inverse)',
              padding: '14px 28px',
              borderRadius: 'var(--df-radius-md)',
              fontWeight: 600,
              boxShadow: 'var(--df-glow-violet)',
              textDecoration: 'none',
            }}
          >
            Get started free
          </a>
        </div>
      </div>
    </section>
  )
}
```

### Pattern 2 — Product showcase (interactive, 60% width)

The user actually plays with the model — orbits, clicks. Use real Spline events.

```tsx
'use client'
import Spline from '@splinetool/react-spline/next'
import type { Application, SPEObject } from '@splinetool/runtime'
import { Suspense, useRef, useState } from 'react'

export function SplineProductShowcase() {
  const splineRef = useRef<Application | null>(null)
  const [activeFeature, setActiveFeature] = useState<string | null>(null)

  function onLoad(spline: Application) {
    splineRef.current = spline
  }

  function focusFeature(name: string) {
    setActiveFeature(name)
    const obj: SPEObject | undefined = splineRef.current?.findObjectByName(name) // VERIFY
    if (obj) obj.emitEvent('mouseHover')
  }

  return (
    <section
      style={{
        background: 'var(--df-bg-base)',
        padding: '120px 24px',
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '60% 1fr',
          gap: 48,
          alignItems: 'center',
        }}
      >
        <div
          style={{
            position: 'relative',
            aspectRatio: '4 / 3',
            background: 'var(--df-bg-surface)',
            border: '1px solid var(--df-border-subtle)',
            borderRadius: 'var(--df-radius-xl)',
            overflow: 'hidden',
          }}
        >
          <Suspense fallback={<div style={{ background: 'var(--df-bg-elevated)', width: '100%', height: '100%' }} />}>
            <Spline
              scene="https://prod.spline.design/your-product/scene.splinecode" // VERIFY
              onLoad={onLoad}
              style={{ width: '100%', height: '100%' }}
            />
          </Suspense>
        </div>

        <div>
          <h2
            style={{
              fontSize: 'clamp(28px, 3vw, 40px)',
              color: 'var(--df-text-primary)',
              fontWeight: 600,
              margin: '0 0 24px',
            }}
          >
            Every detail, in your hands.
          </h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { id: 'Sensor', label: 'Edge-to-edge sensor — 1ms response' },
              { id: 'Battery', label: '72-hour battery on a single charge' },
              { id: 'Body', label: 'Recycled aluminum, sealed to IP68' },
            ].map((f) => (
              <li key={f.id}>
                <button
                  onClick={() => focusFeature(f.id)}
                  aria-pressed={activeFeature === f.id}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '14px 16px',
                    borderRadius: 'var(--df-radius-md)',
                    background: activeFeature === f.id ? 'var(--df-glass-bg-md)' : 'var(--df-glass-bg)',
                    border: `1px solid ${activeFeature === f.id ? 'var(--df-border-focus)' : 'var(--df-glass-border)'}`,
                    color: 'var(--df-text-primary)',
                    cursor: 'pointer',
                    transition: 'all var(--df-duration-base) var(--df-ease-out)',
                  }}
                >
                  {f.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
```

### Pattern 3 — Lazy-loaded modal scene

Spline scenes are heavy (often 3-15 MB). Don't load on page mount — load when the user opts in.

```tsx
'use client'
import Spline from '@splinetool/react-spline/next'
import { Suspense, useState } from 'react'

export function SplineModal({ sceneUrl, label }: { sceneUrl: string; label: string }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          background: 'var(--df-glass-bg)',
          border: '1px solid var(--df-glass-border)',
          color: 'var(--df-text-primary)',
          borderRadius: 'var(--df-radius-md)',
          padding: '12px 20px',
          cursor: 'pointer',
          backdropFilter: 'blur(12px)',
        }}
      >
        Open 3D preview →
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={label}
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(8px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <div
            style={{
              position: 'relative',
              width: 'min(900px, 100%)',
              aspectRatio: '16 / 10',
              background: 'var(--df-bg-surface)',
              border: '1px solid var(--df-border-default)',
              borderRadius: 'var(--df-radius-xl)',
              overflow: 'hidden',
            }}
          >
            <button
              onClick={() => setOpen(false)}
              aria-label="Close 3D preview"
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                zIndex: 2,
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'var(--df-bg-elevated)',
                border: '1px solid var(--df-border-default)',
                color: 'var(--df-text-primary)',
                cursor: 'pointer',
              }}
            >
              ×
            </button>
            <Suspense
              fallback={
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--df-text-muted)',
                  }}
                >
                  Loading scene…
                </div>
              }
            >
              <Spline scene={sceneUrl} style={{ width: '100%', height: '100%' }} />
            </Suspense>
          </div>
        </div>
      )}
    </>
  )
}
```

---

## Performance & Mobile

Both libraries are heavy. Strategies:

- **Conditional render** based on `prefers-reduced-motion` AND screen size. On mobile or reduced-motion, swap in a static DF gradient `<img>` or radial-gradient div instead of the WebGL scene.
- **Lazy load** Spline only on intersection (use the `<Suspense>` + IntersectionObserver pattern from `VantaBackground`).
- **Vanta cleanup is mandatory** — `useEffect` return must call `effect.destroy()`. Otherwise the WebGL context leaks and after ~16 mounts new Vanta instances will silently fail.
- **Mobile fallback** — every Vanta example above respects `prefers-reduced-motion`. For older phones with weak GPUs, also bail on `navigator.deviceMemory < 4` or `(navigator as any).connection?.saveData`.
- **Don't put two heavy scenes on one page.** Browsers cap WebGL contexts at ~16. One Vanta + one Spline is fine; two Splines in view at once will start dropping the older one without an error.

---

## Common Gotchas

1. **THREE peer-dep**: Vanta does NOT bundle three.js. Pass `THREE` in the config object. If you skip it, Vanta tries to read a global `window.THREE` — works only via `<script>` tag, not via npm.
2. **`BIRDS` uses p5, not three.** Don't try to inject THREE into BIRDS — it'll fail silently and the birds won't appear.
3. **App Router subpath**: `import Spline from '@splinetool/react-spline'` is fine in pages router but breaks in Next.js App Router with hydration mismatch. Use `'@splinetool/react-spline/next'`.
4. **WebGL context budget**: ~16 contexts per page. Putting Vanta in nav + hero + footer + 3 cards = silent failures.
5. **`useRef` not `useState`** for the Vanta instance. State changes re-render and the `useEffect` cleanup destroys + recreates, which is wasteful and visually flickers.
6. **Reduced-motion early-return**: DF standard. Every Vanta/Spline component above bails before mounting WebGL when `prefers-reduced-motion: reduce`.
7. **Spline scene file size**: a complex scene can be 10+ MB. Always wrap in `<Suspense>` with a real fallback (NOT just `null` — that flashes).
8. **iOS low-power mode** disables WebGL animation aggressively. Don't rely on Vanta animation timing.

---

## Cross-References

- `references/03-threejs-r3f.md` — when you outgrow Vanta and need a real 3D scene.
- `references/patterns/hero.md` — Vanta NET / WAVES / HALO are perfect hero backgrounds.
- `references/patterns/3d-scene.md` — patterns that compose Vanta or Spline into full launch sections.
- `references/patterns/scroll-story.md` — Spline scenes pinned with scroll-driven camera.
