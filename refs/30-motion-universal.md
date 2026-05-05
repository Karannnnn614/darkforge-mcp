---
name: 30-motion-universal
description: Motion (Popmotion / motion.dev) — universal animation library from Framer Motion's creator. Lightweight alternative to GSAP for simple-to-medium animations. Hardware-accelerated, springs, keyframes, sequences. Plain JS API + React API.
---

# Motion (motion.dev) — Darkforge Integration

> **Lightweight universal animation library.** Created by the Framer Motion team. Two APIs: plain JS (`animate(el, { opacity: 1 })`) for any framework, and React API (`<motion.div>`) for React-specific projects. Use when GSAP feels heavyweight, Framer Motion's React-only constraint is a problem, or bundle size matters.

## Source-of-truth caveat

Generated from training-data recall (Jan 2026 cutoff). `context7` + `WebFetch` were denied at generation time. Motion has gone through naming churn — `popmotion` → `motion.dev` rebrand, the `animate` function signature shifted between v10 and v11. `// VERIFY:` markers flag every signature most likely to drift. Cross-check `https://motion.dev/docs` for the live API before shipping.

## Contents

- [Motion vs Framer Motion vs GSAP](#motion-vs-framer-motion-vs-gsap)
- [Install / Setup](#install--setup)
- [Worked examples — plain JS API](#worked-examples--plain-js-api)
- [Worked examples — React API](#worked-examples--react-api)
- [Reduced-motion handling](#reduced-motion-handling)
- [Pitfalls](#pitfalls)
- [Cross-references](#cross-references)

---

## Motion vs Framer Motion vs GSAP

| Need | Pick |
|---|---|
| Simple-to-medium React animations, ~7kb bundle | **Motion** (this file) |
| Rich React animation primitives (`AnimatePresence`, `LayoutGroup`, drag) | `references/01-framer-motion.md` |
| Scroll-tied scrubbing, timeline editor, MorphSVG | `references/02-gsap.md` |
| Vue / Svelte / vanilla JS animation | **Motion** (plain JS API) |
| Burst / celebration effects | `references/31-mojs-bursts.md` |

**Rule of thumb:** Reach for Motion when you'd otherwise use Framer Motion but the bundle pressure is real, or when the project isn't React.

## Install / Setup

```bash
# VERIFY: package name. v10 was `motion`; some bundlers also ship `framer-motion`'s
# subset. Check the live npm page before deciding.
npm i motion
```

```css
/* app/globals.css — DF token block */
:root {
  --df-bg-base: #000000;
  --df-bg-elev-1: #0a0a0a;
  --df-bg-elev-2: #141414;
  --df-text-primary: #f4f4f5;
  --df-text-secondary: #a1a1aa;
  --df-text-tertiary: #71717a;
  --df-neon-violet: #a78bfa;
  --df-neon-cyan: #67e8f9;
  --df-border-subtle: rgba(255, 255, 255, 0.08);
  --df-glass-bg: rgba(20, 20, 20, 0.6);
  --df-glass-border: rgba(255, 255, 255, 0.06);
  --df-radius-md: 10px;
  --df-radius-lg: 14px;
  --df-glow-violet: 0 0 24px rgba(167, 139, 250, 0.3);
}
```

## Worked examples — plain JS API

### 1. Animate an element on click

```ts
'use client'
import { animate } from 'motion'

export function FadeOnClick() {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    // VERIFY: `animate(target, keyframes, options)` signature.
    animate(
      e.currentTarget,
      { opacity: [1, 0.4, 1], scale: [1, 0.96, 1] },
      { duration: 0.4, easing: [0.16, 1, 0.3, 1] },
    )
  }

  return (
    <button
      onClick={handleClick}
      style={{
        padding: '14px 28px',
        background: 'var(--df-neon-violet)',
        color: '#000',
        borderRadius: 'var(--df-radius-md)',
        border: 'none',
        fontWeight: 600,
        cursor: 'pointer',
        boxShadow: 'var(--df-glow-violet)',
      }}
    >
      Click me
    </button>
  )
}
```

### 2. Stagger reveal across multiple elements

```ts
'use client'
import { animate, stagger } from 'motion'
import { useEffect, useRef } from 'react'

export function StaggerCards() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const cards = ref.current.querySelectorAll('.card')
    animate(
      cards,
      { opacity: [0, 1], y: [20, 0] },
      { duration: 0.6, delay: stagger(0.1), easing: 'ease-out' },
    )
  }, [])

  return (
    <div
      ref={ref}
      style={{
        display: 'grid',
        gap: 16,
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        padding: 24,
      }}
    >
      {['Sent', 'Delivered', 'Replies'].map((label) => (
        <div
          key={label}
          className="card"
          style={{
            padding: 24,
            background: 'var(--df-glass-bg)',
            border: '1px solid var(--df-glass-border)',
            borderRadius: 'var(--df-radius-lg)',
            backdropFilter: 'blur(10px)',
            opacity: 0,
          }}
        >
          <p style={{ color: 'var(--df-text-tertiary)', fontSize: 13, margin: 0 }}>{label}</p>
          <p style={{ color: 'var(--df-neon-violet)', fontSize: 28, fontWeight: 600, margin: 0 }}>1.2k</p>
        </div>
      ))}
    </div>
  )
}
```

### 3. Spring animation

```ts
'use client'
import { animate, spring } from 'motion'

export function SpringDemo() {
  const onClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    // VERIFY: spring options. v11 added `bounce` and `visualDuration`.
    animate(
      e.currentTarget,
      { x: [0, 200, 0] },
      { duration: 1, easing: spring({ stiffness: 200, damping: 12 }) },
    )
  }

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      style={{
        padding: 24,
        background: 'var(--df-bg-elev-1)',
        border: '1px solid var(--df-neon-violet)',
        borderRadius: 'var(--df-radius-lg)',
        cursor: 'pointer',
        color: 'var(--df-text-primary)',
        userSelect: 'none',
        boxShadow: 'var(--df-glow-violet)',
      }}
    >
      Click to spring →
    </div>
  )
}
```

### 4. Scroll-linked animation (plain JS)

```ts
'use client'
import { scroll, animate } from 'motion'
import { useEffect, useRef } from 'react'

export function ScrollLinkedHero() {
  const titleRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (!titleRef.current) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    // VERIFY: scroll() returns a teardown — store it for cleanup.
    const stop = scroll(
      animate(titleRef.current, { opacity: [0, 1], y: [40, 0] }),
      { target: titleRef.current, offset: ['start end', 'center center'] },
    )
    return () => stop?.()
  }, [])

  return (
    <section style={{ padding: '120px 24px', background: 'var(--df-bg-base)' }}>
      <h1
        ref={titleRef}
        style={{
          fontSize: 'clamp(48px, 8vw, 92px)',
          color: 'var(--df-text-primary)',
          margin: 0,
          opacity: 0,
        }}
      >
        Scroll-linked title
      </h1>
    </section>
  )
}
```

### 5. Sequence (chained animations)

```ts
'use client'
import { animate } from 'motion'

export function SequencedReveal() {
  const onMount = async (el: HTMLElement | null) => {
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.style.opacity = '1'
      return
    }
    // VERIFY: `animate` returns a controls object with `.finished` promise.
    await animate(el, { opacity: 1 }, { duration: 0.4 }).finished
    await animate(el, { scale: [1, 1.05, 1] }, { duration: 0.6 }).finished
    await animate(el, { boxShadow: 'var(--df-glow-violet)' }, { duration: 0.4 }).finished
  }

  return (
    <div
      ref={onMount}
      style={{
        padding: 32,
        background: 'var(--df-glass-bg)',
        border: '1px solid var(--df-neon-violet)',
        borderRadius: 'var(--df-radius-lg)',
        opacity: 0,
        color: 'var(--df-text-primary)',
        transition: 'box-shadow 400ms ease',
      }}
    >
      Sequenced fade → pulse → glow.
    </div>
  )
}
```

## Worked examples — React API

### 6. Motion React component

```tsx
'use client'
// VERIFY: import path — v11 ships `motion/react`; older code used `motion`.
import { motion } from 'motion/react'
import { useReducedMotion } from 'motion/react'

export function MotionCard() {
  const reduced = useReducedMotion()
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      style={{
        padding: 24,
        background: 'var(--df-bg-elev-1)',
        border: '1px solid var(--df-border-subtle)',
        borderRadius: 'var(--df-radius-lg)',
        color: 'var(--df-text-primary)',
      }}
    >
      React API works just like Framer Motion.
    </motion.div>
  )
}
```

### 7. Hover-tap feedback

```tsx
'use client'
import { motion } from 'motion/react'

export function PressButton({ children }: { children: React.ReactNode }) {
  return (
    <motion.button
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      style={{
        padding: '14px 28px',
        background: 'var(--df-neon-violet)',
        color: '#000',
        borderRadius: 'var(--df-radius-md)',
        border: 'none',
        fontWeight: 600,
        cursor: 'pointer',
        boxShadow: 'var(--df-glow-violet)',
      }}
    >
      {children}
    </motion.button>
  )
}
```

## Reduced-motion handling

The plain-JS API does **not** auto-respect `prefers-reduced-motion`. You must guard manually:

```ts
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
animate(/* ... */)
```

The React API ships `useReducedMotion()` exactly like Framer Motion:

```tsx
import { useReducedMotion } from 'motion/react'

const reduced = useReducedMotion()
<motion.div animate={reduced ? undefined : { opacity: 1 }} />
```

## Pitfalls

| Pitfall | Fix |
|---|---|
| Bundle size larger than expected | Tree-shake — import `animate` directly, never `import * as motion` |
| Animation doesn't run on first render | Pass an explicit `initial` prop on `<motion.div>`; without it, the from-state is unset |
| `scroll()` doesn't clean up between routes | Store the returned teardown function; call it in `useEffect` cleanup |
| Plain-JS spring overshoots wildly | `damping` is the brake — increase to 20+ for snappier easing |
| React API + Framer Motion installed together | Pick one. They share types but the runtime is different — bundle bloat will follow |
| Stagger doesn't trigger on grid items | Pass the actual NodeList to `animate()`, not the parent — `el.querySelectorAll()` |

## Cross-references

- `references/01-framer-motion.md` — bigger React-only sibling with richer primitives
- `references/02-gsap.md` — when you need scroll scrubbing or timeline editor
- `references/14-animejs.md` — alternative plain-JS animation engine
- `references/00-dark-tokens.md` — DF tokens used throughout
- `references/26-lenis-smooth-scroll.md` — pair Motion's `scroll()` with Lenis for full smooth-scroll
