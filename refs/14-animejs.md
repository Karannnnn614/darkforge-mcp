# Darkforge — Anime.js Dark Reference
Anime.js is a lightweight (~17 kB gzipped, zero-dependency) JavaScript animation engine.
Darkforge reaches for it when bundle size matters, when GSAP/Framer Motion are overkill, or
specifically for SVG path morphing, stagger grids, and timeline orchestration on AMOLED-dark surfaces.

## Contents

- [Source-of-truth caveat](#source-of-truth-caveat)
- [Install / Setup](#install-setup)
- [Core Animation Patterns](#core-animation-patterns)
  - [1. Animate property — neon button pulse on mount](#1-animate-property-neon-button-pulse-on-mount)
  - [2. Timeline — orchestrated hero entrance](#2-timeline-orchestrated-hero-entrance)
  - [3. Stagger from grid — feature tile reveal](#3-stagger-from-grid-feature-tile-reveal)
  - [4. Follow path — orbiting glow](#4-follow-path-orbiting-glow)
  - [5. Spring timing — interactive card lift](#5-spring-timing-interactive-card-lift)
- [SVG Morphing](#svg-morphing)
  - [1. Shape morph — rect to circle status indicator](#1-shape-morph-rect-to-circle-status-indicator)
  - [2. Path draw-on — checkmark reveal](#2-path-draw-on-checkmark-reveal)
  - [3. Liquid metaball blob — ambient hero accent](#3-liquid-metaball-blob-ambient-hero-accent)
- [Text Animation](#text-animation)
  - [1. Letter stagger reveal](#1-letter-stagger-reveal)
  - [2. Gradient sweep on text](#2-gradient-sweep-on-text)
  - [3. Shuffle scramble decode](#3-shuffle-scramble-decode)
- [Counters & Numbers](#counters-and-numbers)
  - [1. Number ticker — DF violet KPI](#1-number-ticker-nx-violet-kpi)
  - [2. Percentage progress ring](#2-percentage-progress-ring)
- [React Integration](#react-integration)
- [Common Gotchas](#common-gotchas)
- [Cross-References](#cross-references)

---

## Source-of-truth caveat

> **VERIFY before shipping.** Anime.js v4 (released late 2024 / 2025) introduced a major
> rewrite with **modular ESM imports** (`{ animate, createTimeline, stagger }`) and replaced
> the legacy `anime({ targets, ... })` callable. This document defaults to **v4 syntax**.
> If your project still pins `animejs@3.x`, the imports collapse to `import anime from 'animejs'`
> and the API becomes `anime({ targets: el, ... })`. Lines tagged `// VERIFY:` are points to
> double-check against the live docs at `animejs.com` for your exact version.
> Sandbox limitation: context7 + WebFetch were unavailable while writing this reference.

---

## Install / Setup

```bash
# v4 (default for this reference)
npm install animejs@4

# v3 legacy (if pinned by an existing project)
npm install animejs@3
npm install -D @types/animejs   # v3 only — v4 ships its own types
```

```ts
// v4 — modular, tree-shakeable imports
import { animate, createTimeline, createSpring, stagger, svg, utils } from 'animejs'
// VERIFY: exact named exports for your v4 patch version

// v3 — single default export
import anime from 'animejs'
```

```css
/* tokens consumed across every example below */
@import './df-tokens.css';   /* exposes --df-bg-base, --df-neon-violet, etc. */

/* shared reduced-motion guard — referenced from React via matchMedia */
@media (prefers-reduced-motion: reduce) {
  [data-anime-target] { animation: none !important; transition: none !important; }
}
```

---

## Core Animation Patterns

### 1. Animate property — neon button pulse on mount

```tsx
'use client'

import { useEffect, useRef } from 'react'
import { animate } from 'animejs'

interface PulseButtonProps {
  label: string
  onClick?: () => void
}

export function PulseButton({ label, onClick }: PulseButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const node = buttonRef.current
    if (!node) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const instance = animate(node, {
      scale: [{ to: 1.04, duration: 600 }, { to: 1, duration: 600 }],
      boxShadow: [
        { to: '0 0 40px rgba(167,139,250,0.55)', duration: 600 },
        { to: '0 0 20px rgba(167,139,250,0.35)', duration: 600 },
      ],
      ease: 'inOutQuad',
      loop: true,
    }) // VERIFY: animate() signature in v4

    return () => instance.pause()
  }, [])

  return (
    <button
      ref={buttonRef}
      onClick={onClick}
      data-anime-target
      aria-label={label}
      style={{
        background: 'var(--df-neon-violet)',
        color: 'var(--df-text-inverse)',
        border: 'none',
        borderRadius: 'var(--df-radius-md)',
        padding: '12px 24px',
        fontFamily: 'var(--df-font-sans)',
        fontWeight: 600,
        fontSize: '14px',
        cursor: 'pointer',
        boxShadow: 'var(--df-glow-violet)',
      }}
    >
      {label}
    </button>
  )
}
```

### 2. Timeline — orchestrated hero entrance

```tsx
'use client'

import { useEffect, useRef } from 'react'
import { createTimeline } from 'animejs'

export function HeroEntrance() {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      root.querySelectorAll<HTMLElement>('[data-stage]').forEach((el) => {
        el.style.opacity = '1'
        el.style.transform = 'none'
      })
      return
    }

    const tl = createTimeline({
      defaults: { ease: 'out(3)', duration: 700 },
    }) // VERIFY: createTimeline() options shape in v4

    tl.add('[data-stage="badge"]', { opacity: [0, 1], translateY: [12, 0] })
      .add('[data-stage="title"]', { opacity: [0, 1], translateY: [24, 0] }, '-=400')
      .add('[data-stage="subtitle"]', { opacity: [0, 1], translateY: [16, 0] }, '-=500')
      .add('[data-stage="cta"]', { opacity: [0, 1], scale: [0.92, 1] }, '-=350')

    return () => tl.pause()
  }, [])

  return (
    <section
      ref={rootRef}
      style={{
        background: 'var(--df-bg-base)',
        padding: 'clamp(48px, 8vw, 120px) clamp(20px, 5vw, 64px)',
        color: 'var(--df-text-primary)',
        minHeight: '70vh',
        display: 'grid',
        placeItems: 'center',
        textAlign: 'center',
      }}
    >
      <div style={{ maxWidth: '720px', width: '100%' }}>
        <span
          data-stage="badge"
          style={{
            display: 'inline-block',
            opacity: 0,
            background: 'rgba(167,139,250,0.1)',
            color: 'var(--df-neon-violet)',
            border: '1px solid rgba(167,139,250,0.25)',
            borderRadius: 'var(--df-radius-full)',
            padding: '6px 14px',
            fontSize: '12px',
            fontWeight: 500,
            marginBottom: 'var(--df-space-6)',
          }}
        >
          v2.4 — now in public beta
        </span>
        <h1
          data-stage="title"
          style={{
            opacity: 0,
            fontFamily: 'var(--df-font-display)',
            fontSize: 'clamp(40px, 7vw, 72px)',
            lineHeight: 1.05,
            margin: '0 0 var(--df-space-5)',
            letterSpacing: '-0.02em',
          }}
        >
          Animation that respects your bundle.
        </h1>
        <p
          data-stage="subtitle"
          style={{
            opacity: 0,
            color: 'var(--df-text-secondary)',
            fontSize: '18px',
            lineHeight: 1.6,
            margin: '0 auto var(--df-space-8)',
            maxWidth: '560px',
          }}
        >
          17&nbsp;KB. Zero dependencies. SVG morphing baked in.
        </p>
        <button
          data-stage="cta"
          data-anime-target
          style={{
            opacity: 0,
            background: 'var(--df-neon-violet)',
            color: 'var(--df-text-inverse)',
            border: 'none',
            borderRadius: 'var(--df-radius-md)',
            padding: '14px 28px',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: 'var(--df-glow-violet)',
          }}
        >
          Read the migration guide
        </button>
      </div>
    </section>
  )
}
```

### 3. Stagger from grid — feature tile reveal

```tsx
'use client'

import { useEffect, useRef } from 'react'
import { animate, stagger } from 'animejs'

interface Feature {
  id: string
  title: string
  body: string
}

const features: Feature[] = [
  { id: 'a', title: 'Zero deps', body: 'Ships nothing extra. Tree-shakes to what you call.' },
  { id: 'b', title: 'SVG morph', body: 'Path-to-path interpolation without a plugin.' },
  { id: 'c', title: 'Timeline', body: 'Orchestrate sequences with relative offsets.' },
  { id: 'd', title: 'Spring', body: 'Physics-based curves via createSpring().' },
  { id: 'e', title: 'Stagger', body: 'Grid origins, falloff, and direction control.' },
  { id: 'f', title: 'Tiny', body: '17 KB gzipped. Smaller than most icon sets.' },
]

export function FeatureGrid() {
  const gridRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const grid = gridRef.current
    if (!grid) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const tiles = grid.querySelectorAll<HTMLElement>('[data-tile]')

    const instance = animate(tiles, {
      opacity: [0, 1],
      translateY: [20, 0],
      scale: [0.96, 1],
      duration: 600,
      ease: 'out(2)',
      delay: stagger(70, { grid: [3, 2], from: 'center' }),
      // VERIFY: stagger() grid + from options in v4
    })

    return () => instance.pause()
  }, [])

  return (
    <div
      ref={gridRef}
      role="list"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 'var(--df-space-4)',
        padding: 'var(--df-space-6)',
        background: 'var(--df-bg-base)',
      }}
    >
      {features.map((f) => (
        <article
          key={f.id}
          data-tile
          role="listitem"
          style={{
            opacity: 0,
            background: 'var(--df-bg-surface)',
            border: '1px solid var(--df-border-default)',
            borderRadius: 'var(--df-radius-lg)',
            padding: 'var(--df-space-5)',
            color: 'var(--df-text-primary)',
          }}
        >
          <h3 style={{ margin: '0 0 var(--df-space-2)', fontSize: '15px', fontWeight: 600 }}>
            {f.title}
          </h3>
          <p style={{ margin: 0, color: 'var(--df-text-secondary)', fontSize: '13px', lineHeight: 1.5 }}>
            {f.body}
          </p>
        </article>
      ))}
    </div>
  )
}
```

### 4. Follow path — orbiting glow

```tsx
'use client'

import { useEffect, useRef } from 'react'
import { animate, svg } from 'animejs'

export function OrbitingGlow() {
  const dotRef = useRef<SVGCircleElement>(null)
  const pathRef = useRef<SVGPathElement>(null)

  useEffect(() => {
    const dot = dotRef.current
    const path = pathRef.current
    if (!dot || !path) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const motion = svg.createMotionPath(path) // VERIFY: svg.createMotionPath in v4

    const instance = animate(dot, {
      ...motion,
      duration: 6000,
      ease: 'linear',
      loop: true,
    })

    return () => instance.pause()
  }, [])

  return (
    <div
      style={{
        background: 'var(--df-bg-base)',
        padding: 'var(--df-space-8)',
        display: 'grid',
        placeItems: 'center',
      }}
    >
      <svg
        viewBox="0 0 240 240"
        width={240}
        height={240}
        role="img"
        aria-label="Decorative orbit animation"
      >
        <path
          ref={pathRef}
          d="M120,40 a80,80 0 1,1 -0.01,0"
          fill="none"
          stroke="rgba(167,139,250,0.18)"
          strokeWidth={1}
        />
        <circle
          ref={dotRef}
          r={6}
          fill="var(--df-neon-violet)"
          style={{ filter: 'drop-shadow(0 0 12px rgba(167,139,250,0.7))' }}
        />
      </svg>
    </div>
  )
}
```

### 5. Spring timing — interactive card lift

```tsx
'use client'

import { useEffect, useRef } from 'react'
import { animate, createSpring } from 'animejs'

export function SpringCard({ title, value }: { title: string; value: string }) {
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = cardRef.current
    if (!node) return

    const spring = createSpring({ stiffness: 180, damping: 14, mass: 1 })
    // VERIFY: createSpring() returns an ease compatible with animate() in v4

    const onEnter = () => {
      animate(node, { translateY: -6, scale: 1.02, ease: spring, duration: 600 })
    }
    const onLeave = () => {
      animate(node, { translateY: 0, scale: 1, ease: spring, duration: 600 })
    }

    node.addEventListener('mouseenter', onEnter)
    node.addEventListener('mouseleave', onLeave)
    return () => {
      node.removeEventListener('mouseenter', onEnter)
      node.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  return (
    <div
      ref={cardRef}
      data-anime-target
      style={{
        background: 'var(--df-bg-surface)',
        border: '1px solid var(--df-border-default)',
        borderRadius: 'var(--df-radius-lg)',
        padding: 'var(--df-space-6)',
        color: 'var(--df-text-primary)',
        cursor: 'pointer',
        willChange: 'transform',
      }}
    >
      <p style={{ margin: '0 0 var(--df-space-2)', color: 'var(--df-text-muted)', fontSize: '12px' }}>
        {title}
      </p>
      <p style={{ margin: 0, fontSize: '28px', fontWeight: 600 }}>{value}</p>
    </div>
  )
}
```

---

## SVG Morphing

### 1. Shape morph — rect to circle status indicator

```tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { animate } from 'animejs'

type Status = 'idle' | 'busy'

const PATHS: Record<Status, string> = {
  idle: 'M12,12 L52,12 L52,52 L12,52 Z',
  busy: 'M32,12 a20,20 0 1,0 0.01,0',
}

export function ShapeMorphIndicator() {
  const pathRef = useRef<SVGPathElement>(null)
  const [status, setStatus] = useState<Status>('idle')

  useEffect(() => {
    const node = pathRef.current
    if (!node) return

    animate(node, {
      d: PATHS[status],
      duration: 700,
      ease: 'inOut(2)',
      // VERIFY: morphing the `d` attribute path string directly in v4
    })
  }, [status])

  return (
    <div style={{ background: 'var(--df-bg-base)', padding: 'var(--df-space-6)', display: 'flex', gap: 'var(--df-space-4)', alignItems: 'center' }}>
      <svg viewBox="0 0 64 64" width={48} height={48} role="img" aria-label={`Status: ${status}`}>
        <path
          ref={pathRef}
          d={PATHS.idle}
          fill={status === 'busy' ? 'var(--df-neon-amber)' : 'var(--df-neon-green)'}
          style={{ transition: 'fill 250ms var(--df-ease-out)' }}
        />
      </svg>
      <button
        onClick={() => setStatus((s) => (s === 'idle' ? 'busy' : 'idle'))}
        style={{
          background: 'var(--df-bg-elevated)',
          color: 'var(--df-text-primary)',
          border: '1px solid var(--df-border-default)',
          borderRadius: 'var(--df-radius-md)',
          padding: '8px 14px',
          fontSize: '13px',
          cursor: 'pointer',
        }}
      >
        Toggle status
      </button>
    </div>
  )
}
```

### 2. Path draw-on — checkmark reveal

```tsx
'use client'

import { useEffect, useRef } from 'react'
import { animate, svg } from 'animejs'

export function CheckmarkDraw({ trigger }: { trigger: boolean }) {
  const pathRef = useRef<SVGPathElement>(null)

  useEffect(() => {
    const node = pathRef.current
    if (!node) return
    if (!trigger) return

    const drawable = svg.createDrawable(node)
    // VERIFY: svg.createDrawable() in v4 returns a target wrapping the path

    animate(drawable, {
      draw: ['0 0', '0 1'],
      duration: 600,
      ease: 'out(3)',
    })
  }, [trigger])

  return (
    <svg viewBox="0 0 64 64" width={64} height={64} role="img" aria-label="Success">
      <circle cx={32} cy={32} r={28} fill="rgba(74,222,128,0.1)" stroke="var(--df-neon-green)" strokeWidth={1.5} />
      <path
        ref={pathRef}
        d="M20,33 L29,42 L46,24"
        fill="none"
        stroke="var(--df-neon-green)"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
```

### 3. Liquid metaball blob — ambient hero accent

```tsx
'use client'

import { useEffect, useRef } from 'react'
import { animate } from 'animejs'

const BLOB_FRAMES = [
  'M60,20 Q92,28 96,60 Q100,92 60,100 Q20,108 16,60 Q12,12 60,20 Z',
  'M60,16 Q98,32 92,64 Q86,96 60,104 Q34,112 18,68 Q2,24 60,16 Z',
  'M60,24 Q88,20 100,56 Q112,92 60,96 Q8,100 16,64 Q24,28 60,24 Z',
]

export function LiquidBlob() {
  const pathRef = useRef<SVGPathElement>(null)

  useEffect(() => {
    const node = pathRef.current
    if (!node) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const instance = animate(node, {
      d: [
        { to: BLOB_FRAMES[1], duration: 3200 },
        { to: BLOB_FRAMES[2], duration: 3200 },
        { to: BLOB_FRAMES[0], duration: 3200 },
      ],
      ease: 'inOut(2)',
      loop: true,
    })

    return () => instance.pause()
  }, [])

  return (
    <svg
      viewBox="0 0 120 120"
      width="100%"
      style={{ maxWidth: 320, filter: 'blur(0.5px)' }}
      role="img"
      aria-label="Decorative animated blob"
    >
      <defs>
        <linearGradient id="nx-blob" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--df-neon-violet)" />
          <stop offset="100%" stopColor="var(--df-neon-cyan)" />
        </linearGradient>
      </defs>
      <path ref={pathRef} d={BLOB_FRAMES[0]} fill="url(#nx-blob)" opacity={0.55} />
    </svg>
  )
}
```

---

## Text Animation

### 1. Letter stagger reveal

```tsx
'use client'

import { useEffect, useMemo, useRef } from 'react'
import { animate, stagger } from 'animejs'

interface LetterRevealProps {
  text: string
  delay?: number
}

export function LetterReveal({ text, delay = 0 }: LetterRevealProps) {
  const wrapRef = useRef<HTMLSpanElement>(null)
  const letters = useMemo(() => Array.from(text), [text])

  useEffect(() => {
    const root = wrapRef.current
    if (!root) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      root.querySelectorAll<HTMLElement>('[data-letter]').forEach((el) => {
        el.style.opacity = '1'
        el.style.transform = 'none'
      })
      return
    }

    animate(root.querySelectorAll('[data-letter]'), {
      opacity: [0, 1],
      translateY: [16, 0],
      rotate: [-6, 0],
      duration: 700,
      ease: 'out(3)',
      delay: stagger(35, { start: delay }),
    })
  }, [delay, text])

  return (
    <span
      ref={wrapRef}
      aria-label={text}
      style={{
        display: 'inline-flex',
        flexWrap: 'wrap',
        color: 'var(--df-text-primary)',
        fontFamily: 'var(--df-font-display)',
        fontSize: 'clamp(28px, 5vw, 56px)',
        fontWeight: 700,
        letterSpacing: '-0.01em',
      }}
    >
      {letters.map((char, i) => (
        <span
          key={`${char}-${i}`}
          data-letter
          aria-hidden="true"
          style={{
            display: 'inline-block',
            opacity: 0,
            whiteSpace: char === ' ' ? 'pre' : 'normal',
          }}
        >
          {char}
        </span>
      ))}
    </span>
  )
}
```

### 2. Gradient sweep on text

```tsx
'use client'

import { useEffect, useRef } from 'react'
import { animate } from 'animejs'

export function GradientSweep({ children }: { children: string }) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const instance = animate(node, {
      backgroundPosition: ['0% 50%', '200% 50%'],
      duration: 4000,
      ease: 'linear',
      loop: true,
    })

    return () => instance.pause()
  }, [])

  return (
    <span
      ref={ref}
      style={{
        backgroundImage: `linear-gradient(
          90deg,
          var(--df-neon-violet),
          var(--df-neon-cyan),
          var(--df-neon-pink),
          var(--df-neon-violet)
        )`,
        backgroundSize: '200% auto',
        backgroundPosition: '0% 50%',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        color: 'transparent',
        fontFamily: 'var(--df-font-display)',
        fontWeight: 700,
        fontSize: 'clamp(32px, 6vw, 64px)',
      }}
    >
      {children}
    </span>
  )
}
```

### 3. Shuffle scramble decode

```tsx
'use client'

import { useEffect, useRef, useState } from 'react'

const GLYPHS = '!<>-_\\/[]{}—=+*^?#________'

interface ScrambleProps {
  finalText: string
  duration?: number
}

export function ScrambleText({ finalText, duration = 1400 }: ScrambleProps) {
  const [display, setDisplay] = useState(finalText)
  const frameRef = useRef<number | null>(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplay(finalText)
      return
    }

    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const revealCount = Math.floor(t * finalText.length)
      const next = Array.from(finalText, (ch, i) =>
        i < revealCount ? ch : GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
      ).join('')
      setDisplay(next)
      if (t < 1) frameRef.current = requestAnimationFrame(tick)
    }

    frameRef.current = requestAnimationFrame(tick)
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
    }
  }, [finalText, duration])

  return (
    <span
      aria-label={finalText}
      style={{
        fontFamily: 'var(--df-font-mono)',
        color: 'var(--df-neon-cyan)',
        fontSize: '15px',
        letterSpacing: '0.04em',
        textShadow: '0 0 12px rgba(34,211,238,0.4)',
      }}
    >
      {display}
    </span>
  )
}
```

> Note: pattern 3 uses `requestAnimationFrame` directly rather than `animate()` because
> Anime.js targets numeric/string property tweens; for character-by-character scramble
> rolling your own loop is leaner. Still respects reduced-motion.

---

## Counters & Numbers

### 1. Number ticker — DF violet KPI

```tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { animate, utils } from 'animejs'

interface CounterProps {
  to: number
  label: string
  suffix?: string
}

export function NumberTicker({ to, label, suffix = '' }: CounterProps) {
  const [value, setValue] = useState(0)
  const cellRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValue(to)
      return
    }

    const counter = { n: 0 }
    const instance = animate(counter, {
      n: to,
      duration: 1600,
      ease: 'out(3)',
      onUpdate: () => setValue(Math.round(counter.n)),
      // VERIFY: animating a plain object with onUpdate in v4
    })

    return () => instance.pause()
  }, [to])

  const formatted = utils?.roundPad ? utils.roundPad(value, 0) : value.toLocaleString()
  // VERIFY: utils.roundPad name/signature; fallback handles missing util

  return (
    <div
      ref={cellRef}
      style={{
        background: 'var(--df-bg-elevated)',
        border: '1px solid var(--df-border-subtle)',
        borderRadius: 'var(--df-radius-lg)',
        padding: 'var(--df-space-5) var(--df-space-6)',
        color: 'var(--df-text-primary)',
        minWidth: 180,
      }}
    >
      <p style={{ margin: '0 0 var(--df-space-2)', color: 'var(--df-text-muted)', fontSize: '12px' }}>
        {label}
      </p>
      <p
        style={{
          margin: 0,
          fontFamily: 'var(--df-font-display)',
          fontSize: '36px',
          fontWeight: 700,
          color: 'var(--df-neon-violet)',
          letterSpacing: '-0.02em',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {formatted}
        <span style={{ fontSize: '20px', color: 'var(--df-text-secondary)', marginLeft: 4 }}>
          {suffix}
        </span>
      </p>
    </div>
  )
}
```

### 2. Percentage progress ring

```tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { animate } from 'animejs'

interface ProgressRingProps {
  percent: number
  label: string
  size?: number
}

export function ProgressRing({ percent, label, size = 160 }: ProgressRingProps) {
  const RADIUS = size / 2 - 12
  const CIRC = 2 * Math.PI * RADIUS
  const ringRef = useRef<SVGCircleElement>(null)
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    const node = ringRef.current
    if (!node) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      node.style.strokeDashoffset = `${CIRC * (1 - percent / 100)}`
      setDisplay(percent)
      return
    }

    const state = { offset: CIRC, n: 0 }
    const instance = animate(state, {
      offset: CIRC * (1 - percent / 100),
      n: percent,
      duration: 1400,
      ease: 'out(3)',
      onUpdate: () => {
        node.style.strokeDashoffset = `${state.offset}`
        setDisplay(Math.round(state.n))
      },
    })

    return () => instance.pause()
  }, [percent, CIRC])

  return (
    <div
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      style={{ position: 'relative', width: size, height: size }}
    >
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={RADIUS}
          fill="none"
          stroke="var(--df-border-subtle)"
          strokeWidth={6}
        />
        <circle
          ref={ringRef}
          cx={size / 2}
          cy={size / 2}
          r={RADIUS}
          fill="none"
          stroke="var(--df-neon-violet)"
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={CIRC}
          style={{ filter: 'drop-shadow(0 0 8px rgba(167,139,250,0.5))' }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          placeItems: 'center',
          color: 'var(--df-text-primary)',
          fontFamily: 'var(--df-font-display)',
          fontSize: '28px',
          fontWeight: 700,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {display}%
      </div>
    </div>
  )
}
```

---

## React Integration

```tsx
'use client'

import { useEffect, useRef } from 'react'
import { animate } from 'animejs'

/**
 * Production-grade Anime.js + React checklist demonstrated below:
 *
 * 1. 'use client' — Anime.js touches DOM; no SSR.
 * 2. useRef for targets, NOT querySelector at module scope.
 * 3. useEffect cleanup — pause/cancel any instance you create.
 * 4. prefers-reduced-motion guard at the top of every effect.
 * 5. Strict TypeScript — no `any`. Refs typed to the element.
 * 6. Re-run the effect when inputs that drive the animation change.
 */

interface AnimatedCounterProps {
  to: number
  label: string
}

export function AnimatedCounter({ to, label }: AnimatedCounterProps) {
  const valueRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const node = valueRef.current
    if (!node) return

    // (4) reduced-motion guard
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      node.textContent = String(to)
      return
    }

    // (2) typed counter target object
    const state: { n: number } = { n: 0 }

    // animate() returns an instance; we keep a handle for cleanup.
    const instance = animate(state, {
      n: to,
      duration: 1400,
      ease: 'out(3)',
      onUpdate: () => {
        node.textContent = String(Math.round(state.n))
      },
    })

    // (3) cleanup — fires on unmount AND on `to` change before re-run.
    return () => {
      instance.pause()
    }
  }, [to])

  return (
    <p style={{ color: 'var(--df-text-primary)', fontFamily: 'var(--df-font-display)' }}>
      <span style={{ color: 'var(--df-text-muted)', fontSize: '12px', marginRight: 8 }}>
        {label}
      </span>
      <span ref={valueRef} style={{ color: 'var(--df-neon-violet)', fontWeight: 700 }}>
        0
      </span>
    </p>
  )
}
```

**State bridges:** when `useState` should update on each tick, store the numeric target on a
ref or plain object and call `setState` from `onUpdate`. Never put the React state itself
inside `animate()` — Anime.js mutates the target, and `setState` is not a writable property.

**Targeting refs vs strings:** `animate(ref.current, {...})` is preferable in React. Selector
strings work but become flaky once components mount/unmount, hydration runs twice in dev, or
multiple instances coexist on the page.

---

## Common Gotchas

| # | Issue | Fix |
|---|-------|-----|
| 1 | **v4 vs v3 imports.** `import anime from 'animejs'` (v3) errors in v4. | v4 is named-export only: `import { animate, createTimeline } from 'animejs'`. Pick one and stick with it. |
| 2 | **String selectors miss in React strict mode.** Effects run twice; selectors may match nothing on the second pass. | Use `useRef` and pass `ref.current`. |
| 3 | **No cleanup = leaking RAF loops.** Instances keep ticking after unmount. | Return `() => instance.pause()` from every `useEffect`. |
| 4 | **Animating React state directly.** `animate(state, {...})` mutates — React won't re-render. | Animate a plain object; call `setState` inside `onUpdate`. |
| 5 | **SSR crash on `window`/`document`.** | Always `'use client'`; guard `matchMedia` calls behind `if (typeof window !== 'undefined')` if used outside an effect. |
| 6 | **Many simultaneous instances tank FPS.** Each adds RAF work. | Batch via `createTimeline`, prefer `stagger`, and prefer `transform`/`opacity` over layout properties. |
| 7 | **SVG morph distortion.** Source and target paths must have compatible point counts and command shapes. | Author both paths from the same template (same number of bezier segments) or pass through a path normalizer. |
| 8 | **`prefers-reduced-motion` ignored.** Animations still autoplay in reduced-motion mode. | Guard every effect with `matchMedia('(prefers-reduced-motion: reduce)').matches`, and set the final visual state synchronously when reduced. |
| 9 | **Tailwind purge strips JIT classes Anime.js writes inline.** Not actually a Tailwind issue — Anime.js sets inline styles, which always win. Make sure your Tailwind classes don't fight by using `!important` only when truly needed. |
| 10 | **`createSpring` not exported.** | `// VERIFY:` against your installed v4 patch — function may live under `eases.spring()` in some patch versions. |

---

## Cross-References

- `references/00-dark-tokens.md` — every color, glow, easing, and spacing literal used above.
- `references/17-skeleton-system.md` — pair Anime.js entrance animations with skeleton placeholders during data fetches.
- `references/01-framer-motion.md` — when you need layout animations, gestures, or React-first ergonomics, prefer Framer Motion.
- `references/02-gsap.md` — if scroll triggers, ScrollSmoother, or MorphSVG plugins are required, GSAP is the heavier but more capable option.
- `references/patterns/scroll-story.md` — combine pattern 4 (follow path) with scroll progress for path-draw narratives.
- `references/patterns/cta.md` — pattern 1 (pulse) and the `LetterReveal` component pair well on hero CTAs.
- `references/patterns/dashboard.md` — `NumberTicker` and `ProgressRing` plug straight into KPI cards.
