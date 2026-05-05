# Darkforge — GSAP Dark UI Reference
GSAP is Darkforge's heavy-lift animation engine — the imperative timeline + ScrollTrigger powerhouse you reach for when Framer Motion's declarative `useScroll` / `useTransform` runs out of road (pinning, scrub-tied multi-step choreography, SplitText character reveals, scroll-to-snap stories). Targets **GSAP 3.12+** under the new MIT license — since the GreenSock acquisition by Webflow in 2024, every former Club plugin (SplitText, MorphSVG, DrawSVG, ScrollSmoother, Inertia, MotionPath, CustomEase) ships free with the standard install.

## Contents

- [Source-of-truth caveat](#source-of-truth-caveat)
- [Install / Setup](#install-setup)
- [Custom Eases for Dark UI](#custom-eases-for-dark-ui)
- [Core Patterns](#core-patterns)
  - [1. Tween basics — `gsap.to`, `gsap.from`, `gsap.fromTo`](#1-tween-basics-gsapto-gsapfrom-gsapfromto)
  - [2. Timeline sequencing — orchestrated multi-step entrance](#2-timeline-sequencing-orchestrated-multi-step-entrance)
  - [3. Stagger — list reveal with `fromCenter` curve](#3-stagger-list-reveal-with-fromcenter-curve)
  - [4. fromTo — explicit start and end states](#4-fromto-explicit-start-and-end-states)
  - [5. Repeat with yoyo — ambient pulse](#5-repeat-with-yoyo-ambient-pulse)
  - [6. Kill / cleanup — `useGSAP` + `gsap.context()` (auto-revert)](#6-kill-cleanup-usegsap-gsapcontext-auto-revert)
- [ScrollTrigger Patterns](#scrolltrigger-patterns)
  - [1. Pin section — keep panel fixed while content scrolls](#1-pin-section-keep-panel-fixed-while-content-scrolls)
  - [2. Scrub progress — animation tied frame-by-frame to scroll](#2-scrub-progress-animation-tied-frame-by-frame-to-scroll)
  - [3. Snap to section — sticky scroll snap](#3-snap-to-section-sticky-scroll-snap)
  - [4. Scroll-driven counter — number ticks as you scroll](#4-scroll-driven-counter-number-ticks-as-you-scroll)
  - [5. Horizontal scroll — vertical wheel drives sideways panels](#5-horizontal-scroll-vertical-wheel-drives-sideways-panels)
  - [6. Parallax background — multi-layer depth](#6-parallax-background-multi-layer-depth)
  - [7. Reveal on enter — `toggleActions` without scrub](#7-reveal-on-enter-toggleactions-without-scrub)
  - [8. Scroll-tied scale — hero card grows as it enters](#8-scroll-tied-scale-hero-card-grows-as-it-enters)
- [SplitText Animations](#splittext-animations)
  - [1. Word-by-word reveal — hero entrance](#1-word-by-word-reveal-hero-entrance)
  - [2. Letter-by-letter neon shimmer](#2-letter-by-letter-neon-shimmer)
  - [3. Line-by-line fade — long-form copy](#3-line-by-line-fade-long-form-copy)
  - [4. Character mask reveal — wipe up](#4-character-mask-reveal-wipe-up)
- [Common Scenes (compositions)](#common-scenes-compositions)
  - [1. Scroll story — five pinned panels with scrub-driven content swap](#1-scroll-story-five-pinned-panels-with-scrub-driven-content-swap)
  - [2. Parallax hero with mouse follow](#2-parallax-hero-with-mouse-follow)
  - [3. Scrubbed text reveal — sentence assembles as you scroll](#3-scrubbed-text-reveal-sentence-assembles-as-you-scroll)
- [React Integration Best Practices](#react-integration-best-practices)
- [Common Gotchas](#common-gotchas)
- [Cross-References](#cross-references)

---

## Source-of-truth caveat

> **Verify before LinkedIn launch.** This file was authored from training-data knowledge; the plugin list and APIs below have been stable since 2024 but cross-check the following against `gsap.com/docs`:
>
> - **SplitText API surface** — particularly `SplitText.create(target, opts)` static factory vs the legacy `new SplitText()` constructor, and the `mask`, `autoSplit`, `aria` options. The plugin moved from Club-only to free in 2024 and gained new options in the migration.
> - **ScrollSmoother availability** — last plugin to go free; confirm it ships with the public npm `gsap` package and isn't gated behind a separate install.
> - **`useGSAP` hook signature** — options object keys (`scope`, `dependencies`, `revertOnUpdate`) and dependency-array semantics in `@gsap/react`.
> - **Current plugin import paths** — most resolve from `gsap/<Plugin>` (e.g. `gsap/ScrollTrigger`) but a few sub-plugins live under `gsap/all` or namespaced exports.
> - **`gsap.matchMedia()` cleanup contract** — return value of the breakpoint callback (a `() => void` revert function) and behaviour on hot-reload.
>
> Inline `// VERIFY:` comments mark every prop, method, or import the author wasn't 100% sure about. Treat them as "search the docs" markers, not as bugs.

---

## Install / Setup

```bash
npm i gsap @gsap/react
# or
pnpm add gsap @gsap/react
```

**`@gsap/react`** is the React companion package that ships the `useGSAP()` hook — it wraps `gsap.context()` and auto-reverts every animation, ScrollTrigger, and timeline created inside the callback when the component unmounts (no manual cleanup, no zombie ScrollTriggers). Use it instead of raw `useEffect` in every Darkforge component.

```ts
// lib/gsap/register.ts — single source of truth for plugin registration
'use client'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'           // VERIFY: free since 2024 Webflow acquisition
import { ScrollSmoother } from 'gsap/ScrollSmoother' // VERIFY: confirm shipped in public package; not demonstrated in this reference but registered for downstream use
import { CustomEase } from 'gsap/CustomEase'
import { Flip } from 'gsap/Flip'

// Plugins must register on the client. Calling registerPlugin in a server
// component (no 'use client') will throw at build time in Next.js App Router.
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, SplitText, ScrollSmoother, CustomEase, Flip)
}

// DF-aware ScrollTrigger defaults — scrub feel that matches the dark spring system
ScrollTrigger.defaults({
  toggleActions: 'play none none reverse',
  // VERIFY: markers/scroller/anticipatePin defaults — set per-trigger when needed
})

export { gsap, ScrollTrigger, SplitText, ScrollSmoother, CustomEase, Flip }
```

Import this once at the top of any client component that drives GSAP — never re-register in component bodies (registration is global and idempotent but noisy in HMR logs).

---

## Custom Eases for Dark UI

GSAP eases are **strings or function references**, not objects. The constants below standardise the feel across every Darkforge animation. Drop into `lib/gsap/eases.ts`.

```ts
// lib/gsap/eases.ts
import { CustomEase } from 'gsap/CustomEase'

// Register custom curves once — must run on the client, after registerPlugin.
if (typeof window !== 'undefined') {
  CustomEase.create('nxNeonElastic',  'M0,0 C0.2,0 0.1,1.2 0.5,1.05 0.7,0.97 0.85,1 1,1') // VERIFY: bezier path
  CustomEase.create('nxMagneticOut',  'M0,0 C0.2,0 0,1 1,1')
}

// Built-in GSAP eases — proven, no plugin required
export const snappy   = 'power3.out'           // buttons, micro-interactions
export const smooth   = 'power2.inOut'         // panels, cards, transitions
export const slow     = 'power4.out'           // hero text, route changes
export const expoOut  = 'expo.out'             // scrubbed reveals
export const elastic  = 'elastic.out(1, 0.4)'  // playful CTAs (amplitude, period)
export const linear   = 'none'                 // scrubbed scroll progress

// Custom-registered (require CustomEase plugin)
export const neonElastic  = 'nxNeonElastic'    // VERIFY: curve tuning
export const magneticOut  = 'nxMagneticOut'

// Stagger helpers
export const fromCenter = { each: 0.05, from: 'center' as const }
export const cascade    = { each: 0.06, from: 'start'  as const }
```

---

## Core Patterns

> **Reduced-motion convention.** Examples below omit the `gsap.matchMedia` wrapper for readability. In production, wrap any animation that runs on mount or scroll inside the matchMedia pattern shown in §Scroll story and §Common Gotchas — `mm.add({ reduceMotion: '(prefers-reduced-motion: reduce)' }, ctx => { ... })` — so reduced-motion users get instant or no-op states. Darkforge's component generator applies this wrapper automatically; hand-authored components must add it explicitly.

### 1. Tween basics — `gsap.to`, `gsap.from`, `gsap.fromTo`

```tsx
'use client'
import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap/register'
import { snappy } from '@/lib/gsap/eases'

export function NeonPulseBadge({ label }: { label: string }) {
  const ref = useRef<HTMLSpanElement>(null)

  useGSAP(() => {
    gsap.from(ref.current, { opacity: 0, scale: 0.8, duration: 0.5, ease: snappy })
  }, { scope: ref })

  return (
    <span
      ref={ref}
      role="status"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '4px 10px', fontSize: 12, fontWeight: 500,
        color: 'var(--df-neon-violet)', background: 'rgba(167,139,250,0.1)',
        border: '1px solid rgba(167,139,250,0.25)',
        borderRadius: 'var(--df-radius-full)',
        boxShadow: 'var(--df-glow-violet)',
      }}
    >
      {label}
    </span>
  )
}
```

### 2. Timeline sequencing — orchestrated multi-step entrance

```tsx
'use client'
import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap/register'
import { smooth, expoOut } from '@/lib/gsap/eases'

export function HeroBlock() {
  const root = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: smooth } })
    tl.from('.hero-eyebrow',  { y: 12, opacity: 0, duration: 0.4 })
      .from('.hero-title',    { y: 32, opacity: 0, duration: 0.7, ease: expoOut }, '-=0.2')
      .from('.hero-body',     { y: 16, opacity: 0, duration: 0.5 }, '-=0.4')
      .from('.hero-cta',      { y: 8,  opacity: 0, duration: 0.4, scale: 0.96 }, '-=0.3')
  }, { scope: root })

  return (
    <section
      ref={root}
      style={{ display: 'grid', gap: 'var(--df-space-5)', maxWidth: 720, padding: 'var(--df-space-12)' }}
    >
      <span className="hero-eyebrow" style={{ color: 'var(--df-neon-violet)', fontSize: 13, fontWeight: 500, letterSpacing: '0.08em' }}>
        BUILD 04 · INBOX PLACEMENT
      </span>
      <h1 className="hero-title" style={{
        fontFamily: 'var(--df-font-display)', fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
        fontWeight: 600, color: 'var(--df-text-primary)', margin: 0, lineHeight: 1.05,
      }}>
        Catch warmup drops before they cost a domain.
      </h1>
      <p className="hero-body" style={{ color: 'var(--df-text-secondary)', fontSize: 17, lineHeight: 1.6, margin: 0 }}>
        Track every send across 14 mailbox providers. Fix sender reputation in real time.
      </p>
      <button className="hero-cta" style={{
        justifySelf: 'start', padding: '14px 28px', fontWeight: 600,
        color: 'var(--df-text-inverse)', background: 'var(--df-neon-violet)',
        border: 0, borderRadius: 'var(--df-radius-full)', cursor: 'pointer',
        boxShadow: 'var(--df-glow-violet)',
      }}>
        Start free trial
      </button>
    </section>
  )
}
```

### 3. Stagger — list reveal with `fromCenter` curve

```tsx
'use client'
import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap/register'
import { smooth, cascade } from '@/lib/gsap/eases'

interface Sequence { id: string; name: string; opens: number }

export function SequenceList({ items }: { items: Sequence[] }) {
  const root = useRef<HTMLUListElement>(null)

  useGSAP(() => {
    gsap.from('.seq-row', {
      opacity: 0, y: 16, duration: 0.5,
      ease: smooth, stagger: cascade,
    })
  }, { scope: root, dependencies: [items.length] })

  return (
    <ul ref={root} style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 'var(--df-space-3)' }}>
      {items.map(s => (
        <li key={s.id} className="seq-row" style={{
          display: 'flex', justifyContent: 'space-between',
          padding: 'var(--df-space-4)', color: 'var(--df-text-primary)',
          background: 'var(--df-bg-surface)', border: '1px solid var(--df-border-subtle)',
          borderRadius: 'var(--df-radius-md)',
        }}>
          <span>{s.name}</span>
          <span style={{ color: 'var(--df-neon-cyan)' }}>{s.opens.toLocaleString()} opens</span>
        </li>
      ))}
    </ul>
  )
}
```

### 4. fromTo — explicit start and end states

```tsx
'use client'
import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap/register'
import { neonElastic } from '@/lib/gsap/eases'

export function MetricCounter({ to, label }: { to: number; label: string }) {
  const numRef = useRef<HTMLParagraphElement>(null)

  useGSAP(() => {
    const obj = { val: 0 }
    gsap.fromTo(obj,
      { val: 0 },
      {
        val: to, duration: 1.6, ease: neonElastic,
        onUpdate: () => {
          if (numRef.current) numRef.current.textContent = Math.round(obj.val).toLocaleString()
        },
      },
    )
  }, { dependencies: [to] })

  return (
    <div style={{
      padding: 'var(--df-space-6)',
      background: 'var(--df-bg-elevated)', border: '1px solid var(--df-border-subtle)',
      borderRadius: 'var(--df-radius-lg)',
    }}>
      <p style={{ margin: 0, color: 'var(--df-text-muted)', fontSize: 12 }}>{label}</p>
      <p
        ref={numRef}
        style={{
          margin: '6px 0 0', fontFamily: 'var(--df-font-display)', fontSize: 36,
          fontWeight: 700, color: 'var(--df-neon-violet)',
          textShadow: '0 0 24px rgba(167,139,250,0.4)',
        }}
      >
        0
      </p>
    </div>
  )
}
```

### 5. Repeat with yoyo — ambient pulse

```tsx
'use client'
import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap/register'

export function LiveDot() {
  const ref = useRef<HTMLSpanElement>(null)

  useGSAP(() => {
    gsap.to(ref.current, {
      scale: 1.35, opacity: 0.6, duration: 1.0,
      ease: 'sine.inOut', repeat: -1, yoyo: true,
    })
  }, { scope: ref })

  return (
    <span
      ref={ref}
      aria-label="Live"
      style={{
        display: 'inline-block', width: 8, height: 8,
        background: 'var(--df-neon-green)', borderRadius: '50%',
        boxShadow: 'var(--df-glow-green)',
      }}
    />
  )
}
```

### 6. Kill / cleanup — `useGSAP` + `gsap.context()` (auto-revert)

```tsx
'use client'
import { useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap/register'
import { smooth } from '@/lib/gsap/eases'

export function ToggleablePanel() {
  const root = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)

  // useGSAP automatically calls .revert() on every animation when the component
  // unmounts AND when `dependencies` change — no manual gsap.context() needed.
  useGSAP(() => {
    gsap.to('.panel-body', {
      height: open ? 'auto' : 0, opacity: open ? 1 : 0,
      duration: 0.35, ease: smooth,
    })
  }, { scope: root, dependencies: [open] })

  return (
    <div ref={root} style={{
      background: 'var(--df-bg-surface)', border: '1px solid var(--df-border-subtle)',
      borderRadius: 'var(--df-radius-md)', overflow: 'hidden',
    }}>
      <button
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', textAlign: 'left', cursor: 'pointer',
          padding: 'var(--df-space-4) var(--df-space-5)',
          color: 'var(--df-text-primary)', background: 'transparent', border: 0,
          fontSize: 15, fontWeight: 500,
        }}
      >
        Bounce reasons (last 24h)
      </button>
      <div className="panel-body" style={{ overflow: 'hidden', height: 0, opacity: 0 }}>
        <p style={{ margin: 0, padding: '0 var(--df-space-5) var(--df-space-5)', color: 'var(--df-text-secondary)', lineHeight: 1.6 }}>
          412 sends bounced — 318 hard, 94 soft. Top reason: 5.7.1 from Outlook.
        </p>
      </div>
    </div>
  )
}
```

---

## ScrollTrigger Patterns

ScrollTrigger is GSAP's reason for existing in Darkforge — pinning, scrubbing, and snap-to-section behaviour that Framer Motion's `useScroll` cannot orchestrate cleanly. Every example below assumes `ScrollTrigger` was registered in `lib/gsap/register.ts`.

### 1. Pin section — keep panel fixed while content scrolls

```tsx
'use client'
import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap, ScrollTrigger } from '@/lib/gsap/register'

export function PinnedFeature() {
  const root = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    ScrollTrigger.create({
      trigger: '.pin-stage',
      start: 'top top',
      end: '+=80%',
      pin: '.pin-target',
      pinSpacing: true,           // VERIFY: keep true to preserve scroll length
      anticipatePin: 1,
    })
  }, { scope: root })

  return (
    <section ref={root} className="pin-stage" style={{ minHeight: '180vh', background: 'var(--df-bg-base)' }}>
      <div className="pin-target" style={{
        height: '100vh', display: 'grid', placeItems: 'center', padding: 'var(--df-space-8)',
      }}>
        <div style={{
          maxWidth: 640, padding: 'var(--df-space-8)',
          background: 'var(--df-bg-surface)', border: '1px solid var(--df-border-default)',
          borderRadius: 'var(--df-radius-xl)', boxShadow: 'var(--df-glow-violet-lg)',
        }}>
          <h2 style={{ margin: 0, color: 'var(--df-text-primary)', fontSize: 32 }}>
            Inbox placement, finally measurable.
          </h2>
          <p style={{ marginTop: 12, color: 'var(--df-text-secondary)', lineHeight: 1.6 }}>
            Stays pinned for 80% of the parent's scroll length, then releases.
          </p>
        </div>
      </div>
    </section>
  )
}
```

### 2. Scrub progress — animation tied frame-by-frame to scroll

```tsx
'use client'
import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap, ScrollTrigger } from '@/lib/gsap/register'

export function ScrubbedHeadline() {
  const root = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    gsap.to('.scrub-bar', {
      width: '100%',
      ease: 'none',
      scrollTrigger: {
        trigger: root.current,
        start: 'top 80%',
        end: 'bottom 20%',
        scrub: 0.6,             // smoothing — 0 = instant, larger = lag
      },
    })
  }, { scope: root })

  return (
    <div ref={root} style={{ minHeight: '120vh', padding: 'var(--df-space-12)', background: 'var(--df-bg-base)' }}>
      <p style={{ margin: 0, color: 'var(--df-text-secondary)', fontSize: 13 }}>Deliverability score</p>
      <div style={{
        marginTop: 12, height: 6, width: '100%',
        background: 'var(--df-bg-muted)', borderRadius: 999, overflow: 'hidden',
      }}>
        <div className="scrub-bar" style={{
          width: 0, height: '100%',
          background: 'var(--df-neon-cyan)', boxShadow: 'var(--df-glow-cyan)',
        }} />
      </div>
    </div>
  )
}
```

### 3. Snap to section — sticky scroll snap

```tsx
'use client'
import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap, ScrollTrigger } from '@/lib/gsap/register'

const PANELS = [
  { title: 'Send', body: '14M emails / month' },
  { title: 'Track', body: 'Per-mailbox open rate' },
  { title: 'Repair', body: 'Auto-warmup pause' },
] as const

export function SnapPanels() {
  const root = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    const sections = gsap.utils.toArray<HTMLElement>('.snap-panel')
    ScrollTrigger.create({
      trigger: root.current,
      start: 'top top',
      end: () => `+=${sections.length * window.innerHeight}`,
      snap: {
        snapTo: 1 / (sections.length - 1),
        duration: { min: 0.2, max: 0.6 },
        ease: 'power2.inOut',
      },
    })
  }, { scope: root })

  return (
    <div ref={root}>
      {PANELS.map(p => (
        <section key={p.title} className="snap-panel" style={{
          minHeight: '100vh', display: 'grid', placeItems: 'center',
          background: 'var(--df-bg-base)',
          borderBottom: '1px solid var(--df-border-subtle)',
        }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--df-neon-violet)', margin: 0, fontSize: 13, letterSpacing: '0.08em' }}>{p.title.toUpperCase()}</p>
            <h2 style={{ color: 'var(--df-text-primary)', margin: '8px 0 0', fontSize: 56 }}>{p.body}</h2>
          </div>
        </section>
      ))}
    </div>
  )
}
```

### 4. Scroll-driven counter — number ticks as you scroll

```tsx
'use client'
import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap, ScrollTrigger } from '@/lib/gsap/register'

export function ScrollCounter({ to }: { to: number }) {
  const root = useRef<HTMLDivElement>(null)
  const num  = useRef<HTMLParagraphElement>(null)

  useGSAP(() => {
    const obj = { val: 0 }
    gsap.to(obj, {
      val: to, ease: 'none',
      scrollTrigger: {
        trigger: root.current,
        start: 'top 80%',
        end: 'bottom 20%',
        scrub: true,
      },
      onUpdate: () => {
        if (num.current) num.current.textContent = Math.round(obj.val).toLocaleString()
      },
    })
  }, { scope: root, dependencies: [to] })

  return (
    <div ref={root} style={{ minHeight: '90vh', display: 'grid', placeItems: 'center', background: 'var(--df-bg-base)' }}>
      <div style={{ textAlign: 'center' }}>
        <p
          ref={num}
          style={{
            margin: 0, fontFamily: 'var(--df-font-display)',
            fontSize: 'clamp(4rem, 12vw, 8rem)', fontWeight: 700,
            color: 'var(--df-neon-violet)', textShadow: '0 0 40px rgba(167,139,250,0.4)',
            lineHeight: 1,
          }}
        >0</p>
        <p style={{ marginTop: 12, color: 'var(--df-text-secondary)' }}>emails delivered this week</p>
      </div>
    </div>
  )
}
```

### 5. Horizontal scroll — vertical wheel drives sideways panels

```tsx
'use client'
import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap, ScrollTrigger } from '@/lib/gsap/register'

const STAGES = ['Compose', 'Warmup', 'Send', 'Track', 'Iterate'] as const

export function HorizontalScroller() {
  const root  = useRef<HTMLDivElement>(null)
  const track = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (!track.current) return
    const total = track.current.scrollWidth - window.innerWidth
    gsap.to(track.current, {
      x: -total, ease: 'none',
      scrollTrigger: {
        trigger: root.current,
        start: 'top top',
        end: () => `+=${total}`,
        pin: true,
        scrub: 0.8,
        invalidateOnRefresh: true,   // re-measure on resize
      },
    })
  }, { scope: root })

  return (
    <section ref={root} style={{ overflow: 'hidden', background: 'var(--df-bg-base)' }}>
      <div ref={track} style={{ display: 'flex', gap: 'var(--df-space-8)', padding: 'var(--df-space-8)' }}>
        {STAGES.map(stage => (
          <article key={stage} style={{
            flex: '0 0 70vw', height: '70vh', display: 'grid', placeItems: 'center',
            background: 'var(--df-bg-surface)', border: '1px solid var(--df-border-default)',
            borderRadius: 'var(--df-radius-xl)',
          }}>
            <h3 style={{ color: 'var(--df-text-primary)', fontSize: 64, margin: 0 }}>{stage}</h3>
          </article>
        ))}
      </div>
    </section>
  )
}
```

### 6. Parallax background — multi-layer depth

```tsx
'use client'
import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap, ScrollTrigger } from '@/lib/gsap/register'

export function ParallaxLayers({ children }: { children: React.ReactNode }) {
  const root = useRef<HTMLElement>(null)

  useGSAP(() => {
    const st = {
      trigger: root.current,
      start: 'top top',
      end: 'bottom top',
      scrub: true,
    } as const
    gsap.to('.layer-bg', { yPercent: 40, ease: 'none', scrollTrigger: st })
    gsap.to('.layer-mid',{ yPercent: 20, ease: 'none', scrollTrigger: st })
    gsap.to('.layer-fg', { yPercent: 8,  ease: 'none', scrollTrigger: st })
  }, { scope: root })

  return (
    <section ref={root} style={{ position: 'relative', height: '120vh', overflow: 'hidden', background: 'var(--df-bg-base)' }}>
      <div className="layer-bg" style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(circle at 20% 20%, rgba(167,139,250,0.18), transparent 60%)',
      }} />
      <div className="layer-mid" style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(circle at 80% 80%, rgba(34,211,238,0.12), transparent 55%)',
      }} />
      <div className="layer-fg" style={{ position: 'relative', padding: 'var(--df-space-16)' }}>{children}</div>
    </section>
  )
}
```

### 7. Reveal on enter — `toggleActions` without scrub

```tsx
'use client'
import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap, ScrollTrigger } from '@/lib/gsap/register'
import { expoOut } from '@/lib/gsap/eases'

interface FeatureRow { title: string; copy: string }

export function FeatureRows({ rows }: { rows: FeatureRow[] }) {
  const root = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    gsap.utils.toArray<HTMLElement>('.feat-row').forEach(row => {
      gsap.from(row, {
        opacity: 0, y: 32, duration: 0.7, ease: expoOut,
        scrollTrigger: {
          trigger: row,
          start: 'top 85%',
          toggleActions: 'play none none reverse',
        },
      })
    })
  }, { scope: root, dependencies: [rows.length] })

  return (
    <div ref={root} style={{ display: 'grid', gap: 'var(--df-space-6)', padding: 'var(--df-space-12)' }}>
      {rows.map(r => (
        <article key={r.title} className="feat-row" style={{
          padding: 'var(--df-space-6)',
          background: 'var(--df-bg-surface)', border: '1px solid var(--df-border-subtle)',
          borderRadius: 'var(--df-radius-lg)',
        }}>
          <h3 style={{ margin: 0, color: 'var(--df-text-primary)', fontSize: 18 }}>{r.title}</h3>
          <p style={{ margin: '8px 0 0', color: 'var(--df-text-secondary)', lineHeight: 1.6 }}>{r.copy}</p>
        </article>
      ))}
    </div>
  )
}
```

### 8. Scroll-tied scale — hero card grows as it enters

```tsx
'use client'
import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap, ScrollTrigger } from '@/lib/gsap/register'

export function ScaleOnScroll({ src, alt }: { src: string; alt: string }) {
  const root = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    gsap.fromTo('.scale-card',
      { scale: 0.85, opacity: 0.6 },
      {
        scale: 1, opacity: 1, ease: 'none',
        scrollTrigger: {
          trigger: root.current,
          start: 'top 80%',
          end: 'top 30%',
          scrub: 0.5,
        },
      },
    )
  }, { scope: root })

  return (
    <div ref={root} style={{ padding: 'var(--df-space-12)' }}>
      <figure className="scale-card" style={{
        margin: 0, overflow: 'hidden',
        background: 'var(--df-bg-surface)', border: '1px solid var(--df-border-default)',
        borderRadius: 'var(--df-radius-xl)',
        boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
      }}>
        <img src={src} alt={alt} style={{ width: '100%', display: 'block' }} />
      </figure>
    </div>
  )
}
```

---

## SplitText Animations

`SplitText` shatters a text node into spans of `lines`, `words`, and/or `chars` so each piece can animate independently. Free since the 2024 Webflow acquisition. Always store the instance ref so cleanup can call `.revert()` and restore the original DOM.

### 1. Word-by-word reveal — hero entrance

```tsx
'use client'
import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap, SplitText } from '@/lib/gsap/register'
import { expoOut, cascade } from '@/lib/gsap/eases'

export function WordRevealHeading({ children }: { children: string }) {
  const ref = useRef<HTMLHeadingElement>(null)

  useGSAP(() => {
    if (!ref.current) return
    // VERIFY: SplitText.create static factory — also valid: new SplitText(target, opts)
    const split = SplitText.create(ref.current, { type: 'words', wordsClass: 'word' })

    gsap.from(split.words, {
      opacity: 0, y: 24, filter: 'blur(8px)',
      duration: 0.8, ease: expoOut, stagger: cascade,
    })

    return () => split.revert()  // restore original text on unmount
  }, { scope: ref })

  return (
    <h1
      ref={ref}
      style={{
        fontFamily: 'var(--df-font-display)', fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
        fontWeight: 600, letterSpacing: '-0.02em',
        color: 'var(--df-text-primary)', margin: 0, lineHeight: 1.1,
      }}
    >
      {children}
    </h1>
  )
}
```

### 2. Letter-by-letter neon shimmer

```tsx
'use client'
import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap, SplitText } from '@/lib/gsap/register'

export function NeonShimmerText({ children }: { children: string }) {
  const ref = useRef<HTMLSpanElement>(null)

  useGSAP(() => {
    if (!ref.current) return
    const split = SplitText.create(ref.current, { type: 'chars' })  // VERIFY: type prop

    gsap.fromTo(split.chars,
      { color: 'var(--df-text-muted)', textShadow: '0 0 0 transparent' },
      {
        color: 'var(--df-neon-violet)',
        textShadow: '0 0 12px rgba(167,139,250,0.6)',
        duration: 0.4, ease: 'sine.inOut',
        stagger: { each: 0.04, from: 'start', repeat: -1, yoyo: true, repeatDelay: 1.2 },
      },
    )

    return () => split.revert()
  }, { scope: ref })

  return (
    <span ref={ref} style={{
      fontFamily: 'var(--df-font-mono)', fontSize: 14, letterSpacing: '0.04em',
    }}>
      {children}
    </span>
  )
}
```

### 3. Line-by-line fade — long-form copy

```tsx
'use client'
import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap, SplitText, ScrollTrigger } from '@/lib/gsap/register'
import { smooth } from '@/lib/gsap/eases'

export function LineFadeBlock({ paragraph }: { paragraph: string }) {
  const ref = useRef<HTMLParagraphElement>(null)

  useGSAP(() => {
    if (!ref.current) return
    const split = SplitText.create(ref.current, {
      type: 'lines',
      linesClass: 'split-line',
      // mask: 'lines',   // VERIFY: 'mask' option available since the 2024 free-tier release
    })

    gsap.from(split.lines, {
      opacity: 0, y: 18, duration: 0.6, ease: smooth, stagger: 0.08,
      scrollTrigger: {
        trigger: ref.current,
        start: 'top 80%',
        toggleActions: 'play none none reverse',
      },
    })

    return () => split.revert()
  }, { scope: ref })

  return (
    <p
      ref={ref}
      style={{
        maxWidth: 640, color: 'var(--df-text-secondary)',
        fontSize: 17, lineHeight: 1.6, margin: 0,
      }}
    >
      {paragraph}
    </p>
  )
}
```

### 4. Character mask reveal — wipe up

```tsx
'use client'
import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap, SplitText } from '@/lib/gsap/register'
import { expoOut } from '@/lib/gsap/eases'

export function MaskReveal({ children }: { children: string }) {
  const ref = useRef<HTMLHeadingElement>(null)

  useGSAP(() => {
    if (!ref.current) return
    const split = SplitText.create(ref.current, {
      type: 'chars,words',
      wordsClass: 'word-mask',     // VERIFY: class names propagate to wrappers
      charsClass: 'char-mask',
    })

    gsap.from(split.chars, {
      yPercent: 110,                // each char starts below its line-box
      duration: 0.9, ease: expoOut, stagger: 0.025,
    })

    return () => split.revert()
  }, { scope: ref })

  return (
    <>
      <style>{`
        .word-mask { display: inline-block; overflow: hidden; }
        .char-mask { display: inline-block; }
      `}</style>
      <h2
        ref={ref}
        style={{
          fontFamily: 'var(--df-font-display)', fontSize: 'clamp(2rem, 5vw, 3.5rem)',
          fontWeight: 600, color: 'var(--df-text-primary)', margin: 0, lineHeight: 1.1,
          overflow: 'hidden',
        }}
      >
        {children}
      </h2>
    </>
  )
}
```

---

## Common Scenes (compositions)

Full self-contained components combining the patterns above into Darkforge-flavoured set pieces.

### 1. Scroll story — five pinned panels with scrub-driven content swap

```tsx
'use client'
import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap, ScrollTrigger } from '@/lib/gsap/register'
import { smooth } from '@/lib/gsap/eases'

interface Chapter { tag: string; title: string; body: string; tone: 'violet' | 'cyan' | 'pink' | 'green' }

const CHAPTERS: Chapter[] = [
  { tag: '01', title: 'Connect mailboxes',  body: 'Import unlimited senders. SPF, DKIM, DMARC verified at link-time.', tone: 'violet' },
  { tag: '02', title: 'Warm sender domains', body: 'Auto-rotation across 14 providers. No human in the loop.',          tone: 'cyan'   },
  { tag: '03', title: 'Send sequences',     body: 'Branching steps, AI replies, A/B at the variable level.',           tone: 'pink'   },
  { tag: '04', title: 'Track placement',    body: 'Per-mailbox open and reply rate. Spam rate alerts under 0.3%.',     tone: 'green'  },
  { tag: '05', title: 'Iterate weekly',     body: 'Auto-pause cold lists, swap subjects, recover bounce-heavy IPs.',   tone: 'violet' },
]

const TONE_VAR = (t: Chapter['tone']) => `var(--df-neon-${t})`

export function ScrollStory() {
  const root = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    const mm = gsap.matchMedia()

    mm.add({
      isDesktop:    '(min-width: 768px)',
      reduceMotion: '(prefers-reduced-motion: reduce)',
    }, ctx => {
      const { reduceMotion } = ctx.conditions as { isDesktop: boolean; reduceMotion: boolean }

      if (reduceMotion) {
        // No pin, no scrub — just fade chapters in on enter.
        gsap.utils.toArray<HTMLElement>('.story-chapter').forEach(ch => {
          gsap.from(ch, {
            opacity: 0, duration: 0.4,
            scrollTrigger: { trigger: ch, start: 'top 80%' },
          })
        })
        return
      }

      ScrollTrigger.create({
        trigger: '.story-stage',
        start: 'top top',
        end: () => `+=${CHAPTERS.length * 100}%`,
        pin: '.story-pin',
        scrub: 0.6,
      })

      gsap.utils.toArray<HTMLElement>('.story-chapter').forEach((ch, i) => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: '.story-stage',
            start:   () => `top+=${i * 100}% top`,
            end:     () => `top+=${(i + 1) * 100}% top`,
            scrub:   0.5,
          },
        })
        tl.fromTo(ch,
          { opacity: 0, y: 40 },
          { opacity: 1, y: 0, ease: smooth },
        ).to(ch, { opacity: 0, y: -40, ease: smooth }, '+=0.4')
      })
    })

    return () => mm.revert()
  }, { scope: root })

  return (
    <section ref={root} className="story-stage" style={{ background: 'var(--df-bg-base)' }}>
      <div className="story-pin" style={{
        height: '100vh', display: 'grid', placeItems: 'center', position: 'relative',
        padding: 'var(--df-space-8)',
      }}>
        {CHAPTERS.map(ch => (
          <article
            key={ch.tag}
            className="story-chapter"
            style={{
              position: 'absolute', maxWidth: 640, opacity: 0,
              padding: 'var(--df-space-8)',
              background: 'var(--df-bg-surface)',
              border: `1px solid ${TONE_VAR(ch.tone)}33`,
              borderRadius: 'var(--df-radius-xl)',
              boxShadow: `0 0 60px ${TONE_VAR(ch.tone)}22`,
            }}
            aria-label={`Chapter ${ch.tag}: ${ch.title}`}
          >
            <p style={{ margin: 0, color: TONE_VAR(ch.tone), fontSize: 12, fontWeight: 600, letterSpacing: '0.12em' }}>
              CH {ch.tag}
            </p>
            <h2 style={{ margin: '8px 0 12px', color: 'var(--df-text-primary)', fontSize: 36, lineHeight: 1.1 }}>
              {ch.title}
            </h2>
            <p style={{ margin: 0, color: 'var(--df-text-secondary)', fontSize: 16, lineHeight: 1.6 }}>
              {ch.body}
            </p>
          </article>
        ))}
      </div>
    </section>
  )
}
```

### 2. Parallax hero with mouse follow

```tsx
'use client'
import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap, ScrollTrigger, SplitText } from '@/lib/gsap/register'
import { expoOut } from '@/lib/gsap/eases'
import type { PointerEvent } from 'react'

export function ParallaxHero() {
  const root  = useRef<HTMLElement>(null)
  const orb1  = useRef<HTMLDivElement>(null)
  const orb2  = useRef<HTMLDivElement>(null)
  const title = useRef<HTMLHeadingElement>(null)

  useGSAP(() => {
    if (title.current) {
      const split = SplitText.create(title.current, { type: 'words,chars' })  // VERIFY: dual type
      gsap.from(split.chars, { opacity: 0, y: 24, duration: 0.6, ease: expoOut, stagger: 0.02 })
    }

    gsap.utils.toArray<HTMLElement>('.parallax-orb').forEach((orb, i) => {
      gsap.to(orb, {
        yPercent: 30 + i * 15, ease: 'none',
        scrollTrigger: {
          trigger: root.current,
          start: 'top top',
          end:   'bottom top',
          scrub: true,
        },
      })
    })
  }, { scope: root })

  const onMove = (e: PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    const dx = (e.clientX - r.left) / r.width  - 0.5
    const dy = (e.clientY - r.top)  / r.height - 0.5
    gsap.to(orb1.current, { x: dx * 40, y: dy * 40, duration: 0.8, ease: 'power3.out' })
    gsap.to(orb2.current, { x: dx * -60, y: dy * -60, duration: 1.0, ease: 'power3.out' })
  }

  return (
    <section
      ref={root}
      onPointerMove={onMove}
      style={{
        position: 'relative', minHeight: '100vh', overflow: 'hidden',
        background: 'var(--df-bg-base)', color: 'var(--df-text-primary)',
      }}
    >
      <div ref={orb1} className="parallax-orb" style={{
        position: 'absolute', top: '-15%', left: '-10%',
        width: 540, height: 540, borderRadius: '50%', pointerEvents: 'none',
        background: 'radial-gradient(circle, rgba(167,139,250,0.22), transparent 70%)',
      }} />
      <div ref={orb2} className="parallax-orb" style={{
        position: 'absolute', bottom: '-20%', right: '-15%',
        width: 620, height: 620, borderRadius: '50%', pointerEvents: 'none',
        background: 'radial-gradient(circle, rgba(34,211,238,0.16), transparent 70%)',
      }} />
      <div style={{ position: 'relative', maxWidth: 720, padding: 'var(--df-space-16)' }}>
        <p style={{ margin: 0, color: 'var(--df-neon-violet)', fontSize: 13, letterSpacing: '0.08em' }}>
          INSTANTLY · BUILD 04
        </p>
        <h1
          ref={title}
          style={{
            margin: '12px 0 16px',
            fontFamily: 'var(--df-font-display)',
            fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
            fontWeight: 600, lineHeight: 1.05, letterSpacing: '-0.02em',
          }}
        >
          Inbox placement, finally measurable.
        </h1>
        <p style={{ margin: 0, color: 'var(--df-text-secondary)', fontSize: 17, lineHeight: 1.6 }}>
          Track every send across 14 mailbox providers. Catch warmup drops before they cost a domain.
        </p>
      </div>
    </section>
  )
}
```

### 3. Scrubbed text reveal — sentence assembles as you scroll

```tsx
'use client'
import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap, ScrollTrigger, SplitText } from '@/lib/gsap/register'

export function ScrubbedTextReveal({ sentence }: { sentence: string }) {
  const ref = useRef<HTMLParagraphElement>(null)

  useGSAP(() => {
    if (!ref.current) return
    const split = SplitText.create(ref.current, { type: 'words' })

    gsap.fromTo(split.words,
      { opacity: 0.15 },
      {
        opacity: 1, ease: 'none',
        stagger: { each: 0.04 },
        scrollTrigger: {
          trigger: ref.current,
          start: 'top 70%',
          end:   'top 25%',
          scrub: 0.4,
        },
      },
    )

    return () => split.revert()
  }, { scope: ref })

  return (
    <p
      ref={ref}
      style={{
        maxWidth: 880, margin: '0 auto', padding: 'var(--df-space-16) var(--df-space-8)',
        fontFamily: 'var(--df-font-display)',
        fontSize: 'clamp(1.75rem, 4vw, 3rem)', fontWeight: 500, lineHeight: 1.3,
        color: 'var(--df-text-primary)',
      }}
    >
      {sentence}
    </p>
  )
}
```

---

## React Integration Best Practices

- **Always reach for `useGSAP`** from `@gsap/react`, never raw `useEffect`. It wraps `gsap.context()`, scopes selectors to `scope`, and reverts every animation, ScrollTrigger, and timeline on unmount or dependency change. Manual cleanup is one of the top three sources of bugs in GSAP-React projects.
- **Pass `scope`** so class selectors like `.hero-title` only match descendants of the ref. Without scope, a second instance of the component animates the first instance's nodes.
- **`dependencies` array mirrors `useEffect`.** Re-run the animation only when an input that affects it changes (`[items.length]`, `[open]`). Omitting it makes the hook run once on mount, like `useEffect(..., [])`. // VERIFY: `revertOnUpdate` defaults to `true` since `@gsap/react` v2.
- **Refs over IDs.** Use `useRef` for elements you'll target individually; reserve class selectors for groups (`.feat-row`).
- **Plugin registration is global and client-only.** Centralise it in one file (`lib/gsap/register.ts`) guarded by `typeof window !== 'undefined'`. Calling `gsap.registerPlugin` inside a server component throws at build time.
- **SSR safety.** Anything that touches `window`, measures the DOM, or starts a ScrollTrigger must run inside `useGSAP`. The hook only fires after hydration, so SSR output stays static-safe.
- **Avoid mixing engines on the same property.** Don't transition `opacity` with CSS while GSAP also tweens it — the last writer wins and the animation will jitter. Pick GSAP for the property and let it own all transitions on that node.
- **Hot module reload pitfalls.** During HMR, modules re-execute and may try to re-register plugins. Idempotent registration plus `useGSAP`'s auto-revert means you rarely have to think about it — but if you see ghost ScrollTriggers after edits, hard-refresh once.

---

## Common Gotchas

- **Pin spacers eat layout.** When `pin: true`, ScrollTrigger inserts a wrapper div sized to the original element's height. If you set the trigger's height to `100vh` and pin it for `+=200%`, the doc grows by 200vh — that's the design. To pin without adding scroll length use `pinSpacing: false` (rare; usually a bug). // VERIFY: `pinType: 'transform'` for nested-scroll containers.
- **Multiple ScrollTrigger instances duplicate on re-mount.** Without `useGSAP`, every component remount creates new triggers that the old ones never clean up — scroll then becomes erratic and CPU-heavy. `useGSAP({ scope })` fixes this. To audit: `console.log(ScrollTrigger.getAll().length)` in dev.
- **Transform conflicts with CSS.** GSAP writes inline styles to `transform`. If your CSS has `transform: translateY(...)` on the same element, the cascade fights the tween. Solution: keep the static base in CSS as `transform: none` (or omit) and let GSAP own the transform.
- **`useEffect` vs `useGSAP` in StrictMode.** React 18 StrictMode runs effects twice on mount in dev — `useGSAP` correctly reverts between the two passes; raw `useEffect` does not, leaving phantom timelines. This alone is reason enough to standardise on `useGSAP`.
- **`ScrollTrigger.refresh()` after async layout shifts.** Fonts loading, images decoding, accordions opening — anything that changes element heights after triggers were registered will leave start/end positions stale. Call `ScrollTrigger.refresh()` after the shift, or set `invalidateOnRefresh: true` on triggers whose end value is calculated.
- **Resize without `invalidateOnRefresh`.** ScrollTrigger auto-`refresh()` on window resize but doesn't re-evaluate function-based `start` / `end` values unless you flag it. Horizontal scrollers in particular need `invalidateOnRefresh: true`.
- **Next.js App Router specifics.** Components driving GSAP must have `'use client'` at the top of the file. Plugin registration belongs in a single client module; importing `gsap/ScrollTrigger` in a server file will compile but the registration call will silently no-op (then break on the client when ScrollTrigger isn't recognised). For App Router with route changes, call `ScrollTrigger.killAll()` on route transitions or scope every trigger inside a `useGSAP` whose component unmounts with the route.
- **`prefers-reduced-motion` is `gsap.matchMedia()`'s job.** Don't add a separate `useReducedMotion` hook — wrap your animations in `mm.add({ reduceMotion: '(prefers-reduced-motion: reduce)' }, ctx => { ... })`. The breakpoint cleanup is automatic and the same pattern handles responsive variants in one shot.

---

## Cross-References

- `references/01-framer-motion.md` — for declarative entrance, gesture, layout, and `AnimatePresence` flows where GSAP would be overkill. Reach for Framer first; promote to GSAP when scrub, pin, or SplitText is required.
- `references/00-dark-tokens.md` — every color, glow, radius, and easing variable referenced in code blocks above.
- `references/17-skeleton-system.md` — pair with `useGSAP` reveals so loading-to-content swaps stagger in instead of popping.
- `references/patterns/scroll-story.md` — implements the `ScrollStory` scene above end-to-end with five live chapters.
- `references/patterns/hero.md` — combines `ParallaxHero` with `WordRevealHeading` and a `MagneticCTA` from the Framer Motion file.
- `references/patterns/dashboard.md` — uses `ScrollCounter` and `FeatureRows` for KPI sections; layout reorder still goes through Framer's `layout` prop, not GSAP Flip.
- `references/patterns/pricing.md` — `MaskReveal` for tier headlines, `LineFadeBlock` for feature lists.
