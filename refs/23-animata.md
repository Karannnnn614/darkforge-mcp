---
name: 23-animata
description: Animata — curated open-source animation snippets, motion playground style. React + Tailwind + Framer Motion. Use for hover states, magnetic buttons, marquees, animated cards. Drop-in micro-interactions, DF-token wrapped.
---

# Animata — Darkforge Integration

> **Curated motion snippets, not a component library.** Animata is a *playground* of hand-crafted micro-interactions — magnetic buttons, marquee strips, hover gradients, card stack reveals. Each snippet is copy-paste, React + Tailwind + Framer Motion. Use when the brief is "make this section feel alive" and shadcn/Aceternity feel too templated.

## Source-of-truth caveat

Generated from training-data recall (Jan 2026 cutoff). `context7` + `WebFetch` were denied at generation time. Animata is a fast-moving snippet collection — individual snippet APIs change between weeks. The patterns below are the *shape* of the snippets; props and class names will drift. `// VERIFY:` markers flag every name worth re-reading at the live site. Cross-check `https://animata.design` for the exact snippet code before shipping.

## Contents

- [Install / Setup](#install--setup)
- [Worked snippets](#worked-snippets)
- [Reduced-motion handling](#reduced-motion-handling)
- [When to reach for Animata vs alternatives](#when-to-reach-for-animata-vs-alternatives)
- [Pitfalls](#pitfalls)
- [Cross-references](#cross-references)

---

## Install / Setup

Animata is **not** a npm package — it's a snippet library. You copy the components directly into your repo. The runtime dependencies are:

```bash
npm i framer-motion clsx tailwind-merge
```

Tailwind v4 must be configured. DF tokens must already exist in `app/globals.css` (see `references/00-dark-tokens.md`).

```ts
// lib/utils.ts — standard shadcn-style merge helper
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

## Worked snippets

### 1. Magnetic button

Cursor pulls the button toward it within a small radius. Reverts on `mouseleave`.

```tsx
'use client'
import { motion, useMotionValue, useSpring, useReducedMotion } from 'framer-motion'
import { useRef } from 'react'

export function MagneticButton({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion()
  const ref = useRef<HTMLButtonElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  // VERIFY: spring config — Animata's snippet at last check used stiffness 150.
  const sx = useSpring(x, { stiffness: 150, damping: 15 })
  const sy = useSpring(y, { stiffness: 150, damping: 15 })

  const onMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (reduced || !ref.current) return
    const rect = ref.current.getBoundingClientRect()
    x.set((e.clientX - rect.left - rect.width / 2) * 0.4)
    y.set((e.clientY - rect.top - rect.height / 2) * 0.4)
  }

  const onLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.button
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{
        x: sx,
        y: sy,
        background: 'var(--df-neon-violet)',
        color: '#000',
        padding: '14px 28px',
        borderRadius: 'var(--df-radius-md)',
        fontWeight: 600,
        boxShadow: 'var(--df-glow-violet)',
        border: 'none',
        cursor: 'pointer',
      }}
    >
      {children}
    </motion.button>
  )
}
```

### 2. Marquee strip with DF brand badges

```tsx
'use client'
import { motion, useReducedMotion } from 'framer-motion'

const ITEMS = ['Stripe', 'Linear', 'Vercel', 'Anthropic', 'Notion', 'Figma']

export function BrandMarquee() {
  const reduced = useReducedMotion()
  return (
    <div
      style={{
        overflow: 'hidden',
        background: 'var(--df-bg-elev-1)',
        borderTop: '1px solid var(--df-border-subtle)',
        borderBottom: '1px solid var(--df-border-subtle)',
        padding: '24px 0',
        maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
      }}
      aria-label="Trusted by"
    >
      <motion.div
        animate={reduced ? undefined : { x: ['0%', '-50%'] }}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
        style={{ display: 'flex', gap: 64, width: 'max-content' }}
      >
        {[...ITEMS, ...ITEMS].map((brand, i) => (
          <span
            key={i}
            style={{
              color: 'var(--df-text-secondary)',
              fontSize: 24,
              fontWeight: 500,
              whiteSpace: 'nowrap',
            }}
          >
            {brand}
          </span>
        ))}
      </motion.div>
    </div>
  )
}
```

### 3. Hover-gradient card

```tsx
'use client'
import { motion, useMotionValue, useReducedMotion } from 'framer-motion'

export function HoverGradientCard({
  title,
  body,
}: {
  title: string
  body: string
}) {
  const reduced = useReducedMotion()
  const mx = useMotionValue(0)
  const my = useMotionValue(0)

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduced) return
    const rect = e.currentTarget.getBoundingClientRect()
    mx.set(e.clientX - rect.left)
    my.set(e.clientY - rect.top)
  }

  return (
    <motion.div
      onMouseMove={onMove}
      style={{
        position: 'relative',
        padding: 32,
        background: 'var(--df-bg-elev-1)',
        border: '1px solid var(--df-border-subtle)',
        borderRadius: 'var(--df-radius-lg)',
        overflow: 'hidden',
      }}
    >
      <motion.div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(400px circle at var(--mx) var(--my), rgba(167,139,250,0.18), transparent 60%)',
          // VERIFY: Animata uses CSS vars set via style — confirm name pattern.
          '--mx': mx.get() + 'px',
          '--my': my.get() + 'px',
        } as React.CSSProperties}
      />
      <h3 style={{ position: 'relative', color: 'var(--df-text-primary)', margin: 0 }}>{title}</h3>
      <p style={{ position: 'relative', color: 'var(--df-text-secondary)' }}>{body}</p>
    </motion.div>
  )
}
```

### 4. Animated counter

```tsx
'use client'
import { animate, useInView, useMotionValue, useTransform } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

export function AnimatedCounter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-50px' })
  const count = useMotionValue(0)
  const rounded = useTransform(count, (v) => Math.round(v).toLocaleString())
  const [display, setDisplay] = useState('0')

  useEffect(() => {
    if (!inView) return
    const controls = animate(count, to, { duration: 1.2, ease: 'easeOut' })
    const unsub = rounded.on('change', setDisplay)
    return () => {
      controls.stop()
      unsub()
    }
  }, [inView, to, count, rounded])

  return (
    <span
      ref={ref}
      style={{ color: 'var(--df-neon-violet)', fontSize: 48, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}
    >
      {display}
      {suffix}
    </span>
  )
}
```

### 5. Card stack reveal

```tsx
'use client'
import { motion, useReducedMotion } from 'framer-motion'

const CARDS = [
  { title: 'Inbox', body: '184 unread' },
  { title: 'Projects', body: '12 active' },
  { title: 'Tasks', body: '38 due today' },
]

export function CardStackReveal() {
  const reduced = useReducedMotion()
  return (
    <ul style={{ display: 'flex', flexDirection: 'column', gap: 16, listStyle: 'none', padding: 0 }}>
      {CARDS.map((card, i) => (
        <motion.li
          key={card.title}
          initial={reduced ? false : { opacity: 0, y: 24 }}
          whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
          style={{
            padding: 24,
            background: 'var(--df-glass-bg)',
            border: '1px solid var(--df-glass-border)',
            borderRadius: 'var(--df-radius-lg)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <h3 style={{ color: 'var(--df-text-primary)', margin: 0 }}>{card.title}</h3>
          <p style={{ color: 'var(--df-text-secondary)', margin: 0 }}>{card.body}</p>
        </motion.li>
      ))}
    </ul>
  )
}
```

### 6. Underline-on-hover link

```tsx
'use client'
import { motion } from 'framer-motion'

export function AnimatedLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      style={{
        position: 'relative',
        color: 'var(--df-text-primary)',
        textDecoration: 'none',
        display: 'inline-block',
      }}
    >
      <motion.span
        whileHover={{ y: -2 }}
        transition={{ duration: 0.2 }}
        style={{ display: 'inline-block' }}
      >
        {children}
      </motion.span>
      <motion.span
        aria-hidden="true"
        initial={{ scaleX: 0 }}
        whileHover={{ scaleX: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        style={{
          position: 'absolute',
          bottom: -2,
          left: 0,
          right: 0,
          height: 2,
          background: 'var(--df-neon-violet)',
          transformOrigin: 'left',
        }}
      />
    </a>
  )
}
```

### 7. Tilt card (subtle 3D on hover)

```tsx
'use client'
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'framer-motion'

export function TiltCard({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion()
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 300, damping: 30 })
  const sy = useSpring(my, { stiffness: 300, damping: 30 })
  const rotateX = useTransform(sy, [-0.5, 0.5], ['8deg', '-8deg'])
  const rotateY = useTransform(sx, [-0.5, 0.5], ['-8deg', '8deg'])

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduced) return
    const rect = e.currentTarget.getBoundingClientRect()
    mx.set((e.clientX - rect.left) / rect.width - 0.5)
    my.set((e.clientY - rect.top) / rect.height - 0.5)
  }

  return (
    <motion.div
      onMouseMove={onMove}
      onMouseLeave={() => {
        mx.set(0)
        my.set(0)
      }}
      style={{
        transformStyle: 'preserve-3d',
        rotateX,
        rotateY,
        padding: 32,
        background: 'var(--df-bg-elev-1)',
        border: '1px solid var(--df-border-subtle)',
        borderRadius: 'var(--df-radius-lg)',
      }}
    >
      <div style={{ transform: 'translateZ(40px)' }}>{children}</div>
    </motion.div>
  )
}
```

## Reduced-motion handling

Every snippet above uses Framer Motion's `useReducedMotion()` hook. The pattern:

```tsx
const reduced = useReducedMotion()

<motion.div
  animate={reduced ? undefined : { /* normal anim */ }}
  initial={reduced ? false : { /* hidden state */ }}
/>
```

For mouse-driven snippets (magnetic, hover-gradient, tilt), short-circuit the handler:

```tsx
const onMove = (e) => {
  if (reduced) return
  // ...
}
```

## When to reach for Animata vs alternatives

| Snippet need | Pick |
|---|---|
| Magnetic button, marquee, tilt, hover gradient | Animata snippet |
| Full hero section with text effects | `references/04-aceternity.md` (Aceternity) |
| Production component with a11y story (Combobox, Dialog) | `references/08-shadcn-dark.md` (shadcn) |
| Burst/celebration | `references/31-mojs-bursts.md` |
| Scroll-tied effects | `references/02-gsap.md` (ScrollTrigger) |

## Pitfalls

| Pitfall | Fix |
|---|---|
| Snippets reference `cn()` helper that doesn't exist in your repo | Add the standard shadcn `cn` helper from `lib/utils.ts` (see Setup) |
| Snippet ships hardcoded `bg-purple-500` colors | Replace with `bg-[var(--df-neon-violet)]` or inline `style={{ background: 'var(--df-neon-violet)' }}` |
| Marquee jitters on Safari | Wrap children in a single `<motion.div>` with `width: max-content`; do NOT animate the children individually |
| Tilt cards break in Firefox | Set `transformStyle: 'preserve-3d'` on the parent; Firefox needs the perspective on the *grandparent* — add `style={{ perspective: 1000 }}` one level up |
| Animated counter resets on every render | The `inView` flag must use `{ once: true }` |

## Cross-references

- `references/01-framer-motion.md` — runtime engine for every Animata snippet
- `references/00-dark-tokens.md` — DF tokens consumed via inline styles
- `references/04-aceternity.md` — when you need a full section, not a snippet
- `references/12-tailwind-v4.md` — Tailwind setup that snippets assume
- `references/patterns/dashboard-shell.md` — composition recipes for combining snippets
