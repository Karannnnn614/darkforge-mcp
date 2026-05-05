---
name: 26-lenis-smooth-scroll
description: Lenis — buttery smooth inertia scrolling. The de-facto premium-site smooth-scroll lib of 2025. Pairs natively with GSAP ScrollTrigger. Darkforge v1.0 had zero smooth-scroll coverage; this closes the gap.
---

# Lenis — Smooth Scroll

> Single most-requested smooth-scroll library in 2025. Used in nearly every Awwwards-winning site. **Darkforge v1.0 had zero smooth-scroll coverage — Lenis closes that gap.** Pairs natively with GSAP ScrollTrigger (the canonical premium-site combo).

## Source-of-truth caveat

Generated from training-data recall (Jan 2026 cutoff). `context7` + `WebFetch` were denied at generation time. Lenis API moved between v1.0 and v1.1 — `wrapper`/`content` props were replaced by auto-detection. `// VERIFY:` markers flag prop signatures most likely to drift. Cross-check against `https://lenis.darkroom.engineering` before shipping.

## Contents

- [Install / Setup](#install--setup)
- [Next.js App Router setup (the canonical pattern)](#nextjs-app-router-setup-the-canonical-pattern)
- [Reduced-motion fallback (REQUIRED)](#reduced-motion-fallback-required)
- [Lenis + GSAP ScrollTrigger combo](#lenis--gsap-scrolltrigger-combo)
- [Worked examples](#worked-examples)
  - [1. Basic Lenis provider](#1-basic-lenis-provider)
  - [2. Scroll-to-section CTA](#2-scroll-to-section-cta)
  - [3. Hero with parallax-via-Lenis](#3-hero-with-parallax-via-lenis)
  - [4. Pinned section (Lenis + GSAP)](#4-pinned-section-lenis--gsap)
  - [5. Image reveal on scroll-into-view](#5-image-reveal-on-scroll-into-view)
  - [6. Horizontal scroll panel](#6-horizontal-scroll-panel)
  - [7. Smooth-scroll-aware navbar](#7-smooth-scroll-aware-navbar)
- [Easing functions reference](#easing-functions-reference)
- [Pitfalls](#pitfalls)
- [Cross-references](#cross-references)

---

## Install / Setup

```bash
npm i lenis
# or
pnpm add lenis
```

Lenis is ~3kb gzipped, framework-agnostic, MIT. Optional React wrapper: `npm i lenis @studio-freight/react-lenis` (note: package was renamed; `lenis/react` ships with the core package now).

```ts
// VERIFY: package.json should resolve `lenis/react` from lenis ≥1.1.x.
// Older code may import from `@studio-freight/react-lenis` (deprecated alias).
import Lenis from 'lenis'
import { ReactLenis, useLenis } from 'lenis/react'
```

## Next.js App Router setup (the canonical pattern)

Drop a single client provider at the root of your app. Every child page gets smooth scroll for free.

```tsx
// app/providers/SmoothScrollProvider.tsx
'use client'
import { ReactLenis } from 'lenis/react'
import { useReducedMotion } from 'framer-motion'
import type { ReactNode } from 'react'

export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion()

  // CRITICAL: when the user prefers reduced motion, do NOT mount Lenis.
  // Smooth-scroll is enhancement, not requirement. Native scroll respects user preferences.
  if (reduced) return <>{children}</>

  return (
    <ReactLenis
      root
      options={{
        // VERIFY: lerp 0.1 is the "feels like Apple" sweet spot per current Lenis docs.
        // Older v0.x used `smoothness`; v1.x is `lerp`.
        lerp: 0.1,
        duration: 1.2,
        // exponential ease — feels closest to native momentum scroll
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        // VERIFY: `smoothTouch` was renamed to `syncTouch` in lenis v1.1.x.
        syncTouch: false, // touch users get native scroll — never override.
      }}
    >
      {children}
    </ReactLenis>
  )
}
```

```tsx
// app/layout.tsx
import { SmoothScrollProvider } from './providers/SmoothScrollProvider'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{
          background: 'var(--df-bg-base)',
          color: 'var(--df-text-primary)',
          margin: 0,
        }}
      >
        <SmoothScrollProvider>{children}</SmoothScrollProvider>
      </body>
    </html>
  )
}
```

## Reduced-motion fallback (REQUIRED)

Smooth scroll is the most common accessibility complaint about modern sites. Users with vestibular disorders, motion sensitivity, or simply a preference for native scroll **must** get native browser scroll. The pattern above already handles this — `useReducedMotion()` short-circuits the provider.

Belt-and-suspenders CSS fallback for non-React contexts:

```css
/* app/globals.css */
@media (prefers-reduced-motion: reduce) {
  html.lenis,
  html.lenis body {
    overflow: auto !important;
    height: auto !important;
  }
  /* Disable Lenis-injected transforms that fight native scroll */
  [data-lenis-prevent] { all: revert; }
}
```

## Lenis + GSAP ScrollTrigger combo

This is the single most-requested recipe in premium web dev. **Every Awwwards-winning site uses some variant of this.** Lenis owns the scroll position, GSAP listens via `ScrollTrigger.update`.

```tsx
'use client'
import { useEffect } from 'react'
import { useLenis } from 'lenis/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useReducedMotion } from 'framer-motion'

gsap.registerPlugin(ScrollTrigger)

export function useLenisGsapBridge() {
  const reduced = useReducedMotion()
  const lenis = useLenis()

  useEffect(() => {
    if (reduced || !lenis) return

    // The bridge: every Lenis scroll tick refreshes ScrollTrigger.
    // VERIFY: ScrollTrigger.update is the public method since gsap 3.10+.
    const onScroll = () => ScrollTrigger.update()
    lenis.on('scroll', onScroll)

    // Drive Lenis from gsap.ticker so frame timing is unified.
    const tickerCallback = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(tickerCallback)
    gsap.ticker.lagSmoothing(0)

    return () => {
      lenis.off('scroll', onScroll)
      gsap.ticker.remove(tickerCallback)
    }
  }, [lenis, reduced])
}
```

Mount this hook anywhere inside `<SmoothScrollProvider>` — typically once at the layout level. After this, every GSAP `ScrollTrigger.create({ trigger, ... })` works seamlessly with Lenis's velocity.

## Worked examples

### 1. Basic Lenis provider

Already shown above — `<SmoothScrollProvider>` in `app/layout.tsx`. Every child route gets smooth scroll. Total cost: 30 lines + reduced-motion guard.

### 2. Scroll-to-section CTA

Programmatic scroll to a section. Better than `<a href="#features">` because Lenis animates the scroll instead of jumping.

```tsx
'use client'
import { useLenis } from 'lenis/react'
import { motion, useReducedMotion } from 'framer-motion'

export function ScrollToFeaturesButton() {
  const lenis = useLenis()
  const reduced = useReducedMotion()

  return (
    <motion.button
      type="button"
      aria-label="Scroll to features section"
      onClick={() => {
        if (reduced) {
          // Reduced-motion users get native instant jump
          document.getElementById('features')?.scrollIntoView({ block: 'start' })
          return
        }
        // VERIFY: lenis.scrollTo accepts string selector, element, or number.
        lenis?.scrollTo('#features', { offset: -64, duration: 1.4 })
      }}
      whileHover={reduced ? undefined : { scale: 1.04 }}
      whileTap={reduced ? undefined : { scale: 0.98 }}
      style={{
        background: 'var(--df-neon-violet)',
        color: '#000',
        border: 0,
        borderRadius: 'var(--df-radius-md)',
        padding: '12px 28px',
        fontSize: 15,
        fontWeight: 600,
        cursor: 'pointer',
        boxShadow: 'var(--df-glow-violet)',
      }}
    >
      See the features ↓
    </motion.button>
  )
}
```

### 3. Hero with parallax-via-Lenis

Read scroll velocity from Lenis and drive transform on a hero element.

```tsx
'use client'
import { useRef } from 'react'
import { useLenis } from 'lenis/react'
import { useReducedMotion } from 'framer-motion'

export function ParallaxHero() {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()

  useLenis(({ scroll }) => {
    if (reduced || !ref.current) return
    // Move the hero background at half scroll speed for parallax.
    ref.current.style.transform = `translate3d(0, ${scroll * 0.5}px, 0)`
  })

  return (
    <section
      aria-label="Hero"
      style={{
        position: 'relative',
        minHeight: '100vh',
        background: 'var(--df-bg-base)',
        overflow: 'hidden',
      }}
    >
      <div
        ref={ref}
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 50% 30%, rgba(167,139,250,0.18), transparent 60%)',
          willChange: 'transform',
        }}
      />
      <div style={{ position: 'relative', maxWidth: 880, margin: '0 auto', padding: '180px 24px' }}>
        <h1
          style={{
            fontSize: 'clamp(48px, 8vw, 92px)',
            fontWeight: 700,
            color: 'var(--df-text-primary)',
            letterSpacing: '-0.03em',
            margin: 0,
          }}
        >
          Scroll like silk.
        </h1>
        <p style={{ color: 'var(--df-text-secondary)', fontSize: 18, lineHeight: 1.6, maxWidth: 540 }}>
          Lenis-driven inertia + DF violet bloom. Reduced-motion users get a static gradient — no compromise on motion safety.
        </p>
      </div>
    </section>
  )
}
```

### 4. Pinned section (Lenis + GSAP)

Pin a section while content animates over it — the canonical Apple-product-page move. Requires the Lenis + GSAP bridge from earlier.

```tsx
'use client'
import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useReducedMotion } from 'framer-motion'

export function PinnedFeatureSection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (reduced || !sectionRef.current) return

    // VERIFY: gsap 3.12+ ScrollTrigger pinning API.
    const ctx = gsap.context(() => {
      gsap.from('.feature-line', {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: '+=2000',
          pin: true,
          scrub: 1,
        },
        opacity: 0,
        y: 40,
        stagger: 0.4,
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [reduced])

  return (
    <section
      ref={sectionRef}
      aria-label="Pinned features"
      style={{
        minHeight: '100vh',
        background: 'var(--df-bg-base)',
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
        padding: '120px 24px',
      }}
    >
      <p className="feature-line" style={{ fontSize: 28, color: 'var(--df-text-primary)', maxWidth: 600 }}>
        Stack-aware UI generation.
      </p>
      <p className="feature-line" style={{ fontSize: 28, color: 'var(--df-text-secondary)', maxWidth: 600 }}>
        Reads your <code style={{ color: 'var(--df-neon-violet)' }}>package.json</code>, picks the right libraries.
      </p>
      <p className="feature-line" style={{ fontSize: 28, color: 'var(--df-text-secondary)', maxWidth: 600 }}>
        Generates AMOLED-dark, animated, accessible code that matches your conventions.
      </p>
    </section>
  )
}
```

### 5. Image reveal on scroll-into-view

Lenis's velocity-aware update lets you tie any property to scroll progress. Use a plain `IntersectionObserver` for "fired once" reveals — Lenis is for *continuous* scroll-tied animation.

```tsx
'use client'
import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'

export function ScrollRevealImage({ src, alt }: { src: string; alt: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (!ref.current) return
    const obs = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setVisible(true),
      { threshold: 0.2 },
    )
    obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible || reduced ? 'translateY(0)' : 'translateY(40px)',
        transition: reduced ? 'none' : 'opacity 0.8s ease, transform 0.8s ease',
        background: 'var(--df-glass-bg)',
        backdropFilter: 'blur(10px)',
        border: '1px solid var(--df-glass-border)',
        borderRadius: 'var(--df-radius-lg)',
        overflow: 'hidden',
      }}
    >
      <img src={src} alt={alt} style={{ display: 'block', width: '100%', height: 'auto' }} />
    </div>
  )
}
```

### 6. Horizontal scroll panel

Lenis can drive horizontal scroll inside a section by reading `scroll` and translating a wrapper.

```tsx
'use client'
import { useRef } from 'react'
import { useLenis } from 'lenis/react'
import { useReducedMotion } from 'framer-motion'

export function HorizontalScrollPanel({ children }: { children: React.ReactNode }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()

  useLenis(() => {
    if (reduced || !wrapRef.current || !trackRef.current) return
    const wrap = wrapRef.current
    const track = trackRef.current
    const rect = wrap.getBoundingClientRect()
    // Only translate while the section is in view
    if (rect.top > window.innerHeight || rect.bottom < 0) return
    const progress = Math.max(0, Math.min(1, -rect.top / (rect.height - window.innerHeight)))
    const distance = track.scrollWidth - window.innerWidth
    track.style.transform = `translate3d(${-progress * distance}px, 0, 0)`
  })

  return (
    <section
      ref={wrapRef}
      aria-label="Horizontal scroll showcase"
      style={{ height: '300vh', position: 'relative', background: 'var(--df-bg-base)' }}
    >
      <div
        style={{
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <div
          ref={trackRef}
          style={{
            display: 'flex',
            gap: 24,
            padding: '0 24px',
            willChange: 'transform',
          }}
        >
          {children}
        </div>
      </div>
    </section>
  )
}
```

### 7. Smooth-scroll-aware navbar

Hide the navbar when scrolling down, show it when scrolling up — driven by Lenis velocity.

```tsx
'use client'
import { useState } from 'react'
import { useLenis } from 'lenis/react'
import { motion, useReducedMotion } from 'framer-motion'

export function SmartNavbar() {
  const [hidden, setHidden] = useState(false)
  const reduced = useReducedMotion()

  useLenis(({ velocity, scroll }) => {
    if (reduced) return
    // Hide when scrolling down past 80px, show otherwise.
    setHidden(velocity > 1 && scroll > 80)
  })

  return (
    <motion.nav
      animate={reduced ? false : { y: hidden ? -80 : 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      aria-label="Primary"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 30,
        height: 64,
        background: 'var(--df-glass-bg)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--df-glass-border)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
      }}
    >
      <span style={{ color: 'var(--df-text-primary)', fontWeight: 600 }}>Brand</span>
    </motion.nav>
  )
}
```

## Easing functions reference

Lenis accepts any `(t: number) => number` for the `easing` option. Useful presets:

```ts
// Exponential — feels closest to native momentum (default-recommended)
const expoOut = (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t))

// Cubic ease-out — snappy and modern
const cubicOut = (t: number) => 1 - Math.pow(1 - t, 3)

// Quart ease-out — Apple-product-page feel
const quartOut = (t: number) => 1 - Math.pow(1 - t, 4)

// Material standard — softer Google-style decel
const material = (t: number) => 1 - Math.pow(1 - t, 1.5)
```

`lerp` controls the interpolation rate per frame (`0.1` ≈ slow + buttery, `0.2` ≈ snappier). `duration` controls the total animation time when using `scrollTo`. They are independent — `lerp` for live scrolling, `duration` for programmatic.

## Pitfalls

| Pitfall | Fix |
|---|---|
| Safari momentum scroll fights Lenis | Lenis disables it via `-webkit-overflow-scrolling: auto` on `html`. Don't override. |
| `overflow: hidden` on `<body>` blocks Lenis | Move overflow control to a wrapper inside `<body>`, not body itself. |
| Anchor links (`<a href="#x">`) jump instead of smooth-scrolling | Use `lenis.scrollTo('#x')` instead, or set `data-lenis-anchor` (VERIFY syntax). |
| `position: fixed` elements jitter on iOS | Add `transform: translateZ(0)` to force GPU layer. |
| Hot module reload leaves stale Lenis instances | The `<ReactLenis>` provider handles this; raw `new Lenis()` does not — destroy in cleanup. |
| Programmatic scroll fires before Lenis hydrates | Guard with `if (lenis) lenis.scrollTo(...)` — `useLenis()` returns `null` until mounted. |
| Reduced-motion users still see smooth scroll | Always wrap the provider with the `useReducedMotion` short-circuit shown above. |

## Cross-references

- `references/02-gsap.md` — ScrollTrigger plugin docs and the canonical GSAP integration patterns
- `references/patterns/scroll-story.md` — full scroll-narrative section recipes that benefit most from Lenis
- `references/patterns/hero.md` — hero variants that pair well with Lenis parallax
- `references/00-dark-tokens.md` — DF token system used throughout
- `references/27-locomotive-scroll.md` — alternative when you also need data-attribute parallax
- `references/28-scrollreveal.md` — simpler scroll-reveal alternative when Lenis is overkill
