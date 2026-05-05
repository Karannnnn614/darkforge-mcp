# Darkforge — React Spring Dark Reference
`@react-spring/web` is Darkforge's physics engine for gesture-driven UIs — drag, pinch, swipe, tilt, magnetic attraction — anywhere Framer Motion's spring lacks the rest velocity, multi-config interpolation, or tight `@use-gesture/react` integration we need. Reach for it when the user's finger is in control; reach for `motion/react` when the page is.

## Contents

- [Source-of-truth caveat](#source-of-truth-caveat)
- [Install / Setup](#install-setup)
- [Spring Config Presets](#spring-config-presets)
- [Core useSpring / useSprings / useTransition](#core-usespring-usesprings-usetransition)
  - [1. useSpring — single animated value with imperative `api`](#1-usespring-single-animated-value-with-imperative-api)
  - [2. useSprings — list with stagger via per-index delay](#2-usesprings-list-with-stagger-via-per-index-delay)
  - [3. useTransition — mount/unmount with enter, leave, update](#3-usetransition-mountunmount-with-enter-leave-update)
- [Gesture-Driven (with @use-gesture/react)](#gesture-driven-with-use-gesturereact)
  - [1. Drag-to-dismiss card](#1-drag-to-dismiss-card)
  - [2. Pinch-to-zoom image with constraints](#2-pinch-to-zoom-image-with-constraints)
  - [3. Swipe carousel with rubberband](#3-swipe-carousel-with-rubberband)
  - [4. Tilt card — mouse parallax with depth](#4-tilt-card-mouse-parallax-with-depth)
  - [5. Magnetic button — cursor attraction](#5-magnetic-button-cursor-attraction)
  - [6. Bottom sheet — drag-up to expand](#6-bottom-sheet-drag-up-to-expand)
- [Parallax / Scroll](#parallax-scroll)
  - [1. Layered parallax background (`@react-spring/parallax`)](#1-layered-parallax-background-react-springparallax)
  - [2. Scroll progress with springy easing](#2-scroll-progress-with-springy-easing)
  - [3. Sticky reveal — fade and slide on intersection](#3-sticky-reveal-fade-and-slide-on-intersection)
- [Common Gotchas](#common-gotchas)
- [Cross-References](#cross-references)

---

## Source-of-truth caveat

This reference targets `@react-spring/web@9.7.x` paired with `@use-gesture/react@10.3.x` — the long-standing v9 line that's been stable since 2021 and remains the recommended import as of the assistant's training cutoff (Jan 2026). v10 has been in preview but is not yet the default. Snippets are written from memory of the v9 docs; lines marked `// VERIFY:` are the spots most likely to drift across patch versions — confirm against the live docs at `react-spring.dev` and `use-gesture.netlify.app` before shipping. If your project still has `react-spring` (no scope) in `package.json`, that's the v8 alias — bump to `@react-spring/web` on the next dependency sweep, the API in this file will not work on v8.

---

## Install / Setup

```bash
npm i @react-spring/web @use-gesture/react
# or
pnpm add @react-spring/web @use-gesture/react
```

```ts
// Always import the web bundle — never the bare `react-spring` package
import { useSpring, useSprings, useTransition, animated, config, to } from '@react-spring/web'

// Gestures live in their own scope
import { useDrag, useGesture, usePinch, useWheel } from '@use-gesture/react'
```

Touch the root layout once to opt every gesture target out of native scroll/zoom interception:

```css
/* app/globals.css — add alongside :root tokens */
[data-nx-gesture] {
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}
```

In Next.js App Router, every file that calls `useSpring`, `useDrag`, or any animation hook needs `'use client'`. The `animated.*` factory is not SSR-safe for measurement-driven values — render skeletons until hydration if the spring depends on `getBoundingClientRect`.

---

## Spring Config Presets

Drop this at `lib/spring/configs.ts`. Every gesture and physics interaction below imports from here — never inline `{ tension, friction }` in a component.

React Spring's classic physics shape is `{ tension, friction, mass, clamp, precision, velocity }`. The built-in `config.*` presets are fine starting points but tuned for light surfaces; the DF presets below are calibrated for AMOLED dark UIs where slight overshoot reads as glow rather than instability.

```ts
// lib/spring/configs.ts
import type { SpringConfig } from '@react-spring/web'

// Tight & decisive — toggles, button press, focus rings
export const stiff: SpringConfig = { tension: 380, friction: 26, mass: 0.6 }

// Default surface motion — drawers, drag-snap, layout shifts
export const gentle: SpringConfig = { tension: 220, friction: 28, mass: 1 }

// Visible overshoot — playful CTAs, success confirmations
export const wobbly: SpringConfig = { tension: 180, friction: 12, mass: 1 }

// Weighted, slow — hero parallax, modal mount
export const slow: SpringConfig = { tension: 90, friction: 26, mass: 1.2 }

// Truly languid — full-bleed reveals, route transitions
export const molasses: SpringConfig = { tension: 60, friction: 30, mass: 1.6 }

// DF signature — magnetic snap with neon-glow energy
// Slightly under-damped so the rest position kisses the target
export const amoled: SpringConfig = { tension: 260, friction: 22, mass: 0.7, precision: 0.0001 }

// Rubberband — used by drag boundaries; clamps once decision crosses threshold
export const rubber: SpringConfig = { tension: 200, friction: 30, clamp: false }

// For "fly off screen" exits where you want momentum carry-through
// VERIFY: react-spring honours `velocity` only on the first frame after re-init
export const fling: SpringConfig = { tension: 400, friction: 40, mass: 1 }
```

Reduced-motion fallback — wrap the entire tree once and forget about it inside components:

```tsx
// components/spring-config.tsx
'use client'
import { Globals } from '@react-spring/web'
import { useEffect } from 'react'

export function ReducedMotionGate() {
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => Globals.assign({ skipAnimation: mq.matches })
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])
  return null
}
```

Mount `<ReducedMotionGate />` in `app/layout.tsx` once. When `skipAnimation` flips on, every spring jumps straight to its target — no per-component guards needed.

---

## Core useSpring / useSprings / useTransition

### 1. useSpring — single animated value with imperative `api`

```tsx
'use client'
import { useSpring, animated } from '@react-spring/web'
import { amoled } from '@/lib/spring/configs'
import { useState } from 'react'

interface ToggleProps { label: string; defaultOn?: boolean }

export function NeonToggle({ label, defaultOn = false }: ToggleProps) {
  const [on, setOn] = useState(defaultOn)
  const styles = useSpring({
    x: on ? 22 : 2,
    glow: on ? 1 : 0,
    config: amoled,
  })

  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => setOn(o => !o)}
      style={{
        position: 'relative',
        width: 48,
        height: 26,
        padding: 0,
        border: '1px solid var(--df-border-default)',
        borderRadius: 'var(--df-radius-full)',
        background: on ? 'rgba(167,139,250,0.18)' : 'var(--df-bg-elevated)',
        cursor: 'pointer',
        transition: 'background 250ms var(--df-ease-out)',
      }}
    >
      <animated.span
        style={{
          position: 'absolute',
          top: 2,
          left: 0,
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: 'var(--df-neon-violet)',
          transform: styles.x.to(x => `translateX(${x}px)`),
          boxShadow: styles.glow.to(g => `0 0 ${g * 14}px rgba(167,139,250,${0.5 * g})`),
        }}
      />
    </button>
  )
}
```

### 2. useSprings — list with stagger via per-index delay

```tsx
'use client'
import { useSprings, animated } from '@react-spring/web'
import { gentle } from '@/lib/spring/configs'
import { useEffect } from 'react'

interface FeatureRow { id: string; title: string; metric: string }

export function FeatureLedger({ rows }: { rows: FeatureRow[] }) {
  const [springs, api] = useSprings(rows.length, i => ({
    from: { opacity: 0, y: 20 },
    config: gentle,
    delay: i * 70,
  }))

  useEffect(() => {
    api.start(i => ({ opacity: 1, y: 0, delay: i * 70 }))
  }, [api, rows.length])

  return (
    <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 'var(--df-space-3)' }}>
      {springs.map((s, i) => (
        <animated.li
          key={rows[i].id}
          style={{
            opacity: s.opacity,
            transform: s.y.to(y => `translate3d(0,${y}px,0)`),
            display: 'flex',
            justifyContent: 'space-between',
            padding: 'var(--df-space-4) var(--df-space-5)',
            color: 'var(--df-text-primary)',
            background: 'var(--df-bg-surface)',
            border: '1px solid var(--df-border-subtle)',
            borderRadius: 'var(--df-radius-md)',
          }}
        >
          <span>{rows[i].title}</span>
          <span style={{ color: 'var(--df-neon-cyan)', fontVariantNumeric: 'tabular-nums' }}>
            {rows[i].metric}
          </span>
        </animated.li>
      ))}
    </ul>
  )
}
```

### 3. useTransition — mount/unmount with enter, leave, update

```tsx
'use client'
import { useTransition, animated } from '@react-spring/web'
import { stiff } from '@/lib/spring/configs'

export interface Notification { id: string; message: string; tone: 'info' | 'success' | 'error' }

const accent: Record<Notification['tone'], string> = {
  info: 'var(--df-neon-cyan)',
  success: 'var(--df-neon-green)',
  error: 'var(--df-neon-red)',
}

export function NotificationStack({ items }: { items: Notification[] }) {
  const transitions = useTransition(items, {
    keys: item => item.id,
    from: { opacity: 0, x: 60, scale: 0.94 },
    enter: { opacity: 1, x: 0, scale: 1 },
    leave: { opacity: 0, x: 60, scale: 0.96 },
    config: stiff,
  })

  return (
    <ol
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        listStyle: 'none',
        padding: 0,
        margin: 0,
        display: 'grid',
        gap: 10,
        zIndex: 500,
      }}
    >
      {transitions((style, item) => (
        <animated.li
          style={{
            opacity: style.opacity,
            transform: to([style.x, style.scale], (x, s) => `translate3d(${x}px,0,0) scale(${s})`),
            minWidth: 280,
            padding: '12px 16px',
            color: 'var(--df-text-primary)',
            background: 'var(--df-bg-elevated)',
            border: '1px solid var(--df-border-default)',
            borderLeft: `3px solid ${accent[item.tone]}`,
            borderRadius: 'var(--df-radius-md)',
            boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
            fontSize: 14,
          }}
        >
          {item.message}
        </animated.li>
      ))}
    </ol>
  )
}

// Note: import { to } separately
import { to } from '@react-spring/web'
```

---

## Gesture-Driven (with @use-gesture/react)

Every gesture pattern below pairs `@use-gesture/react` for input with `@react-spring/web` for output. `useDrag` returns a `bind()` spreader; spread it on the `animated` element to wire `pointermove`, momentum, and cancellation.

### 1. Drag-to-dismiss card

```tsx
'use client'
import { useSpring, animated } from '@react-spring/web'
import { useDrag } from '@use-gesture/react'
import { stiff, fling } from '@/lib/spring/configs'

interface DismissCardProps {
  title: string
  body: string
  onDismiss: () => void
}

export function DismissCard({ title, body, onDismiss }: DismissCardProps) {
  const [{ x, opacity }, api] = useSpring(() => ({ x: 0, opacity: 1, config: stiff }))

  const bind = useDrag(({ active, movement: [mx], velocity: [vx], direction: [dx] }) => {
    const trigger = Math.abs(mx) > 140 || Math.abs(vx) > 0.5
    if (!active && trigger) {
      const flyTo = (dx < 0 ? -1 : 1) * window.innerWidth
      api.start({ x: flyTo, opacity: 0, config: fling, onRest: onDismiss })
      return
    }
    api.start({
      x: active ? mx : 0,
      opacity: active ? 1 - Math.min(Math.abs(mx) / 400, 0.5) : 1,
      immediate: active,
    })
  })

  return (
    <animated.article
      {...bind()}
      data-nx-gesture
      role="button"
      tabIndex={0}
      aria-label={`Dismiss ${title}`}
      style={{
        opacity,
        transform: x.to(v => `translate3d(${v}px,0,0) rotate(${v * 0.05}deg)`),
        cursor: 'grab',
        padding: 'var(--df-space-6)',
        maxWidth: 420,
        color: 'var(--df-text-primary)',
        background: 'var(--df-bg-surface)',
        border: '1px solid var(--df-border-default)',
        borderRadius: 'var(--df-radius-xl)',
      }}
    >
      <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{title}</h3>
      <p style={{ margin: '8px 0 0', color: 'var(--df-text-secondary)', lineHeight: 1.55 }}>{body}</p>
    </animated.article>
  )
}
```

### 2. Pinch-to-zoom image with constraints

```tsx
'use client'
import { useSpring, animated } from '@react-spring/web'
import { useGesture } from '@use-gesture/react'
import { gentle } from '@/lib/spring/configs'

export function ZoomableImage({ src, alt }: { src: string; alt: string }) {
  const [style, api] = useSpring(() => ({ scale: 1, x: 0, y: 0, config: gentle }))

  const bind = useGesture(
    {
      onDrag: ({ pinching, cancel, offset: [ox, oy] }) => {
        if (pinching) return cancel()
        api.start({ x: ox, y: oy })
      },
      onPinch: ({ origin: [ox, oy], first, movement: [ms], offset: [s], memo }) => {
        if (first) {
          const rect = (document.getElementById('zoom-img') as HTMLElement).getBoundingClientRect()
          memo = [rect.width / 2 - ox, rect.height / 2 - oy]
        }
        const x = (memo as number[])[0] * (ms - 1)
        const y = (memo as number[])[1] * (ms - 1)
        api.start({ scale: s, x, y })
        return memo
      },
    },
    {
      drag: { from: () => [style.x.get(), style.y.get()] },
      pinch: { scaleBounds: { min: 1, max: 4 }, rubberband: true },
    },
  )

  return (
    <div
      style={{
        overflow: 'hidden',
        background: 'var(--df-bg-base)',
        border: '1px solid var(--df-border-default)',
        borderRadius: 'var(--df-radius-xl)',
        touchAction: 'none',
      }}
    >
      <animated.img
        id="zoom-img"
        src={src}
        alt={alt}
        draggable={false}
        {...bind()}
        style={{
          x: style.x,
          y: style.y,
          scale: style.scale,
          width: '100%',
          display: 'block',
          willChange: 'transform',
          touchAction: 'none',
        }}
      />
    </div>
  )
}
```

### 3. Swipe carousel with rubberband

```tsx
'use client'
import { useSprings, animated } from '@react-spring/web'
import { useDrag } from '@use-gesture/react'
import { stiff, rubber } from '@/lib/spring/configs'
import { useState } from 'react'

interface Slide { id: string; src: string; caption: string }

export function SwipeCarousel({ slides }: { slides: Slide[] }) {
  const [index, setIndex] = useState(0)

  const [props, api] = useSprings(slides.length, i => ({
    x: (i - index) * 100 + '%',
    scale: i === index ? 1 : 0.92,
    config: stiff,
  }))

  const bind = useDrag(
    ({ active, movement: [mx], direction: [xDir], distance: [dx], cancel }) => {
      if (active && dx > 80) {
        const next = Math.max(0, Math.min(slides.length - 1, index + (xDir > 0 ? -1 : 1)))
        cancel()
        setIndex(next)
        api.start(i => ({
          x: (i - next) * 100 + '%',
          scale: i === next ? 1 : 0.92,
          config: stiff,
        }))
        return
      }
      api.start(i => ({
        x: `calc(${(i - index) * 100}% + ${active ? mx : 0}px)`,
        scale: i === index ? (active ? 0.96 : 1) : 0.92,
        immediate: active && i === index,
        config: active ? rubber : stiff,
      }))
    },
    { axis: 'x', filterTaps: true },
  )

  return (
    <div
      data-nx-gesture
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: 720,
        height: 360,
        margin: '0 auto',
        overflow: 'hidden',
        borderRadius: 'var(--df-radius-xl)',
        background: 'var(--df-bg-surface)',
        border: '1px solid var(--df-border-default)',
      }}
    >
      {props.map(({ x, scale }, i) => (
        <animated.figure
          key={slides[i].id}
          {...bind()}
          aria-hidden={i !== index}
          style={{
            position: 'absolute',
            inset: 0,
            margin: 0,
            transform: x.to(v => `translate3d(${v},0,0)`),
            scale,
            cursor: 'grab',
          }}
        >
          <img
            src={slides[i].src}
            alt={slides[i].caption}
            draggable={false}
            style={{ width: '100%', height: '100%', objectFit: 'cover', userSelect: 'none' }}
          />
          <figcaption
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: 'var(--df-space-4) var(--df-space-5)',
              color: 'var(--df-text-primary)',
              background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
              fontSize: 14,
            }}
          >
            {slides[i].caption}
          </figcaption>
        </animated.figure>
      ))}

      <div
        role="tablist"
        aria-label="Carousel pagination"
        style={{
          position: 'absolute',
          bottom: 12,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 6,
        }}
      >
        {slides.map((s, i) => (
          <button
            key={s.id}
            role="tab"
            aria-selected={i === index}
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => setIndex(i)}
            style={{
              width: i === index ? 18 : 6,
              height: 6,
              padding: 0,
              border: 0,
              borderRadius: 'var(--df-radius-full)',
              background: i === index ? 'var(--df-neon-violet)' : 'rgba(255,255,255,0.25)',
              cursor: 'pointer',
              transition: 'width 250ms var(--df-ease-out)',
            }}
          />
        ))}
      </div>
    </div>
  )
}
```

### 4. Tilt card — mouse parallax with depth

```tsx
'use client'
import { useSpring, animated } from '@react-spring/web'
import { useGesture } from '@use-gesture/react'
import { amoled } from '@/lib/spring/configs'

interface TiltCardProps {
  title: string
  metric: string
  description: string
}

export function TiltCard({ title, metric, description }: TiltCardProps) {
  const [style, api] = useSpring(() => ({
    rotateX: 0,
    rotateY: 0,
    scale: 1,
    z: 0,
    config: amoled,
  }))

  const bind = useGesture({
    onMove: ({ xy: [px, py], currentTarget }) => {
      const target = currentTarget as HTMLElement
      if (!target?.getBoundingClientRect) return
      const rect = target.getBoundingClientRect()
      const x = (px - rect.left) / rect.width - 0.5
      const y = (py - rect.top) / rect.height - 0.5
      api.start({
        rotateX: -y * 14,
        rotateY: x * 18,
        scale: 1.03,
        z: 30,
      })
    },
    onHover: ({ hovering }) => {
      if (!hovering) api.start({ rotateX: 0, rotateY: 0, scale: 1, z: 0 })
    },
  })

  return (
    <div style={{ perspective: 1200 }}>
      <animated.article
        {...bind()}
        style={{
          rotateX: style.rotateX,
          rotateY: style.rotateY,
          scale: style.scale,
          transformStyle: 'preserve-3d',
          willChange: 'transform',
          maxWidth: 360,
          padding: 'var(--df-space-8)',
          color: 'var(--df-text-primary)',
          background: 'var(--df-bg-surface)',
          border: '1px solid var(--df-border-default)',
          borderRadius: 'var(--df-radius-xl)',
          boxShadow: '0 24px 48px rgba(0,0,0,0.45)',
          cursor: 'pointer',
        }}
      >
        <animated.span
          style={{
            transform: style.z.to(z => `translateZ(${z * 0.6}px)`),
            display: 'block',
            color: 'var(--df-neon-violet)',
            fontSize: 12,
            fontWeight: 500,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          {title}
        </animated.span>
        <animated.p
          style={{
            transform: style.z.to(z => `translateZ(${z}px)`),
            margin: '12px 0 6px',
            fontSize: 38,
            fontWeight: 600,
            lineHeight: 1,
          }}
        >
          {metric}
        </animated.p>
        <animated.p
          style={{
            transform: style.z.to(z => `translateZ(${z * 0.4}px)`),
            margin: 0,
            color: 'var(--df-text-secondary)',
            fontSize: 14,
            lineHeight: 1.55,
          }}
        >
          {description}
        </animated.p>
      </animated.article>
    </div>
  )
}
```

### 5. Magnetic button — cursor attraction

```tsx
'use client'
import { useSpring, animated } from '@react-spring/web'
import { useGesture } from '@use-gesture/react'
import { amoled } from '@/lib/spring/configs'

export function MagneticButton({ label, onClick }: { label: string; onClick?: () => void }) {
  const [style, api] = useSpring(() => ({ x: 0, y: 0, scale: 1, config: amoled }))

  const bind = useGesture({
    onMove: ({ xy: [px, py], currentTarget }) => {
      const target = currentTarget as HTMLElement
      const rect = target.getBoundingClientRect()
      const dx = (px - (rect.left + rect.width / 2)) * 0.28
      const dy = (py - (rect.top + rect.height / 2)) * 0.28
      api.start({ x: dx, y: dy, scale: 1.05 })
    },
    onHover: ({ hovering }) => {
      if (!hovering) api.start({ x: 0, y: 0, scale: 1 })
    },
  })

  return (
    <animated.button
      {...bind()}
      onClick={onClick}
      style={{
        x: style.x,
        y: style.y,
        scale: style.scale,
        padding: '14px 28px',
        fontWeight: 600,
        fontSize: 15,
        color: 'var(--df-text-inverse)',
        background: 'var(--df-neon-violet)',
        border: 0,
        borderRadius: 'var(--df-radius-full)',
        boxShadow: 'var(--df-glow-violet)',
        cursor: 'pointer',
        willChange: 'transform',
      }}
    >
      {label}
    </animated.button>
  )
}
```

### 6. Bottom sheet — drag-up to expand

```tsx
'use client'
import { useSpring, animated } from '@react-spring/web'
import { useDrag } from '@use-gesture/react'
import { gentle, stiff } from '@/lib/spring/configs'
import { useEffect } from 'react'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  peekHeight?: number
}

export function BottomSheet({ open, onClose, children, peekHeight = 420 }: BottomSheetProps) {
  const [{ y }, api] = useSpring(() => ({ y: window.innerHeight, config: gentle }))

  useEffect(() => {
    api.start({ y: open ? window.innerHeight - peekHeight : window.innerHeight, config: gentle })
  }, [open, peekHeight, api])

  const bind = useDrag(
    ({ last, velocity: [, vy], direction: [, dy], movement: [, my], cancel }) => {
      if (my < -70) cancel()
      const goingDown = dy > 0
      if (last) {
        if (my > 100 || (vy > 0.5 && goingDown)) {
          api.start({ y: window.innerHeight, config: stiff, onRest: onClose })
        } else {
          api.start({ y: window.innerHeight - peekHeight, config: gentle })
        }
      } else {
        api.start({
          y: window.innerHeight - peekHeight + my,
          immediate: true,
        })
      }
    },
    { from: () => [0, y.get()], filterTaps: true, bounds: { top: 0 }, rubberband: true },
  )

  return (
    <>
      {open && (
        <div
          onClick={onClose}
          aria-hidden
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(8px)',
            zIndex: 300,
          }}
        />
      )}
      <animated.div
        {...bind()}
        role="dialog"
        aria-modal="true"
        aria-label="Sheet"
        data-nx-gesture
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          top: 0,
          height: '100vh',
          y,
          background: 'var(--df-bg-overlay)',
          borderTopLeftRadius: 'var(--df-radius-2xl)',
          borderTopRightRadius: 'var(--df-radius-2xl)',
          borderTop: '1px solid var(--df-border-default)',
          boxShadow: '0 -24px 64px rgba(0,0,0,0.7)',
          zIndex: 400,
          color: 'var(--df-text-primary)',
          touchAction: 'none',
        }}
      >
        <div
          style={{
            padding: '12px 0 4px',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <span
            aria-hidden
            style={{
              width: 44,
              height: 4,
              borderRadius: 999,
              background: 'var(--df-border-strong)',
            }}
          />
        </div>
        <div style={{ padding: 'var(--df-space-5) var(--df-space-6)' }}>{children}</div>
      </animated.div>
    </>
  )
}
```

---

## Parallax / Scroll

React Spring ships its own `@react-spring/parallax` for layered scroll scenes. For component-level scroll progress we lean on `useSpring` driven by an `IntersectionObserver` or scroll listener — simpler and keeps the bundle to one package.

### 1. Layered parallax background (`@react-spring/parallax`)

```tsx
'use client'
// VERIFY: package name is @react-spring/parallax — installs alongside /web
import { Parallax, ParallaxLayer } from '@react-spring/parallax'
import { useRef } from 'react'
import type { IParallax } from '@react-spring/parallax'

export function HeroParallaxScene() {
  const ref = useRef<IParallax>(null)

  return (
    <Parallax
      ref={ref}
      pages={3}
      style={{ background: 'var(--df-bg-base)', top: 0, left: 0 }}
    >
      <ParallaxLayer
        offset={0}
        speed={-0.3}
        factor={2}
        style={{
          background:
            'radial-gradient(circle at 30% 20%, rgba(167,139,250,0.18), transparent 60%),' +
            'radial-gradient(circle at 70% 80%, rgba(34,211,238,0.12), transparent 60%)',
        }}
      />
      <ParallaxLayer offset={0} speed={0.4} style={{ display: 'grid', placeItems: 'center' }}>
        <h1
          style={{
            fontFamily: 'var(--df-font-display)',
            fontSize: 'clamp(2.5rem, 8vw, 6rem)',
            fontWeight: 600,
            letterSpacing: '-0.02em',
            color: 'var(--df-text-primary)',
            margin: 0,
            textAlign: 'center',
          }}
        >
          Inbox placement,<br />finally measurable.
        </h1>
      </ParallaxLayer>
      <ParallaxLayer
        offset={1}
        speed={0.6}
        style={{ display: 'grid', placeItems: 'center', padding: 'var(--df-space-8)' }}
      >
        <p
          style={{
            color: 'var(--df-text-secondary)',
            fontSize: 18,
            lineHeight: 1.6,
            maxWidth: 640,
            textAlign: 'center',
          }}
        >
          Scroll down to see deliverability metrics across 14 mailbox providers.
        </p>
      </ParallaxLayer>
      <ParallaxLayer
        offset={2}
        speed={-0.2}
        style={{ display: 'grid', placeItems: 'center', cursor: 'pointer' }}
        onClick={() => ref.current?.scrollTo(0)}
      >
        <button
          style={{
            padding: '14px 28px',
            background: 'var(--df-neon-violet)',
            color: 'var(--df-text-inverse)',
            border: 0,
            borderRadius: 'var(--df-radius-full)',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: 'var(--df-glow-violet)',
          }}
        >
          Back to top
        </button>
      </ParallaxLayer>
    </Parallax>
  )
}
```

### 2. Scroll progress with springy easing

```tsx
'use client'
import { useSpring, animated } from '@react-spring/web'
import { gentle } from '@/lib/spring/configs'
import { useEffect, useState } from 'react'

export function SpringyProgressBar() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const onScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight
      setProgress(total > 0 ? window.scrollY / total : 0)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const styles = useSpring({ scaleX: progress, config: gentle })

  return (
    <animated.div
      aria-hidden
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 2,
        transformOrigin: '0% 50%',
        scaleX: styles.scaleX,
        background: 'var(--df-neon-violet)',
        boxShadow: 'var(--df-glow-violet)',
        zIndex: 200,
      }}
    />
  )
}
```

### 3. Sticky reveal — fade and slide on intersection

```tsx
'use client'
import { useSpring, animated } from '@react-spring/web'
import { gentle } from '@/lib/spring/configs'
import { useEffect, useRef, useState } from 'react'

interface RevealRowProps {
  title: string
  body: string
}

export function RevealRow({ title, body }: RevealRowProps) {
  const ref = useRef<HTMLElement>(null)
  const [seen, setSeen] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const io = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting) {
          setSeen(true)
          io.disconnect()
        }
      },
      { rootMargin: '-80px 0px' },
    )
    io.observe(node)
    return () => io.disconnect()
  }, [])

  const styles = useSpring({
    opacity: seen ? 1 : 0,
    y: seen ? 0 : 28,
    blur: seen ? 0 : 6,
    config: gentle,
  })

  return (
    <animated.article
      ref={ref}
      style={{
        opacity: styles.opacity,
        transform: styles.y.to(v => `translate3d(0,${v}px,0)`),
        filter: styles.blur.to(b => `blur(${b}px)`),
        padding: 'var(--df-space-6)',
        background: 'var(--df-bg-surface)',
        border: '1px solid var(--df-border-subtle)',
        borderRadius: 'var(--df-radius-lg)',
      }}
    >
      <h3 style={{ margin: 0, color: 'var(--df-text-primary)', fontSize: 18, fontWeight: 600 }}>
        {title}
      </h3>
      <p
        style={{
          margin: '8px 0 0',
          color: 'var(--df-text-secondary)',
          lineHeight: 1.6,
          fontSize: 15,
        }}
      >
        {body}
      </p>
    </animated.article>
  )
}
```

---

## Common Gotchas

- **v8 `react-spring` vs v9 `@react-spring/web`.** v9 split the package per renderer (`/web`, `/native`, `/three`, `/parallax`) and rewrote the API around imperative `api` returned from `useSpring`. v8 patterns like `props.x.interpolate(...)` no longer work — use `style.x.to(...)` and `to([a, b], (a, b) => ...)`. If you see plain `react-spring` in `package.json`, none of this file applies; bump first.
- **Hooks need `'use client'`.** `useSpring`, `useSprings`, `useTransition`, `useGesture`, `useDrag` all touch `window` or React internals that require browser hydration. In Next.js App Router, every gesture file must opt out of server rendering — a missing `'use client'` compiles silently and runs nothing.
- **`animated.*` is not a forwardRef passthrough.** Wrapping a component that doesn't accept `style`/`ref` correctly produces a no-op. Either wrap a primitive (`animated.div`, `animated.img`) or a component that explicitly forwards ref and style — `animated(MyButton)` requires `MyButton` to be wrapped in `React.forwardRef`.
- **SSR + measurement-driven springs.** Anything keyed off `getBoundingClientRect`, `window.innerHeight`, or `IntersectionObserver` must guard for the server. Initialize the spring with a static `from` and update on `useEffect` — never read `window` at render. The `BottomSheet` above sets `y: window.innerHeight` lazily inside `useSpring(() => ({ ... }))`, which is safe because the function only runs on the client.
- **Performance with many springs.** Each `useSpring` runs its own RAF loop. For lists past ~50 items use a single `useSprings` (one loop, batched updates), or virtualize the list. Animating `box-shadow`, `filter: blur`, or `width` triggers paint on every frame — prefer `transform` and `opacity`, then composite filters via `will-change: filter` only on the visible item.
- **`@use-gesture` `touchAction`.** The library recommends `touch-action: none` on draggable targets so the browser doesn't fight you for vertical scroll on mobile. Setting it via the `[data-nx-gesture]` attribute (see Setup) is cleaner than per-component inline styles. Forgetting this on a horizontal swipe carousel is the #1 reason "it works on desktop, breaks on iOS."
- **`Globals.assign({ skipAnimation: true })` is global.** It affects every spring instance in the app. Mount `<ReducedMotionGate />` once at the layout root; never call `Globals.assign` from inside a component effect that re-runs, or you'll thrash the setting on every re-render.
- **Re-running `useSpring` config doesn't re-fire animations.** Changing `config` on an existing `useSpring` updates the next animation, not the in-flight one. To re-trigger from a new resting state, call `api.start({ from: { ... }, to: { ... } })` explicitly.

---

## Cross-References

- `references/01-framer-motion.md` — peer animation engine; choose `motion/react` for declarative entrance/scroll/layout, choose React Spring when input drives motion or you need rest-velocity carry-through that Framer's spring doesn't expose
- `references/patterns/hero.md` — `TiltCard` powers the KPI grid; `HeroParallaxScene` underlays the launch hero
- `references/patterns/product-showcase.md` — `SwipeCarousel` and `ZoomableImage` for product galleries; `DismissCard` for compare-tray removals
- `references/patterns/mobile-drawer.md` — `BottomSheet` is the canonical mobile sheet; pair with `framer-motion` `AnimatePresence` for the backdrop fade
- `references/patterns/dashboard.md` — `MagneticButton` for primary CTAs, `NeonToggle` for filter chips
- `references/00-dark-tokens.md` — every color, glow, radius, easing variable referenced above
- `references/17-skeleton-system.md` — render skeletons until `useSpring` hydrates measurement-driven values on the client
- `references/02-gsap.md` — when scroll choreography exceeds component-local `IntersectionObserver` springs, fall back to GSAP ScrollTrigger
