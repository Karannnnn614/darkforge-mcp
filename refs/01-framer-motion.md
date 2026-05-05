# Darkforge — Framer Motion Dark UI Reference
`motion` (formerly `framer-motion`) is Darkforge's default animation engine — declarative React primitives for entrance, scroll, gesture, layout, and presence transitions, all GPU-accelerated and SSR-safe. Since v11.18 (Nov 2024) the package was renamed from `framer-motion` to `motion`; all examples below import from `motion/react` and target **motion v12.x**.

## Contents

- [Install](#install)
- [Spring Config Presets](#spring-config-presets)
- [Entrance Animations](#entrance-animations)
  - [1. FadeUp — the workhorse](#1-fadeup-the-workhorse)
  - [2. FadeIn — minimal, no Y offset (modals, replaced content)](#2-fadein-minimal-no-y-offset-modals-replaced-content)
  - [3. SlideInLeft — sidebar, drawer entry](#3-slideinleft-sidebar-drawer-entry)
  - [4. SlideInRight — toast, notification panel](#4-slideinright-toast-notification-panel)
  - [5. ScaleIn — modal content, popover](#5-scalein-modal-content-popover)
  - [6. BlurIn — premium hero text reveal](#6-blurin-premium-hero-text-reveal)
  - [7. StaggerChildren — list reveal](#7-staggerchildren-list-reveal)
  - [8. SequentialReveal — orchestrated multi-element scene](#8-sequentialreveal-orchestrated-multi-element-scene)
- [Scroll-Driven Animations](#scroll-driven-animations)
  - [1. useScroll — viewport progress basics](#1-usescroll-viewport-progress-basics)
  - [2. useTransform parallax — layered hero depth](#2-usetransform-parallax-layered-hero-depth)
  - [3. Sticky progress — section completion indicator](#3-sticky-progress-section-completion-indicator)
  - [4. Scale on scroll — featured card zoom](#4-scale-on-scroll-featured-card-zoom)
  - [5. Fade on scroll — `whileInView` shorthand](#5-fade-on-scroll-whileinview-shorthand)
  - [6. Scrubbed scene — number ticker tied to scroll](#6-scrubbed-scene-number-ticker-tied-to-scroll)
- [Gesture Animations](#gesture-animations)
  - [1. Drag with constraints — sortable card](#1-drag-with-constraints-sortable-card)
  - [2. 3D hover tilt](#2-3d-hover-tilt)
  - [3. Magnetic button — cursor pull](#3-magnetic-button-cursor-pull)
  - [4. Swipe card — Tinder-style decision](#4-swipe-card-tinder-style-decision)
  - [5. Hover glow — neon edge ignite](#5-hover-glow-neon-edge-ignite)
- [AnimatePresence Patterns](#animatepresence-patterns)
  - [1. Modal with backdrop](#1-modal-with-backdrop)
  - [2. Toast list — staggered enter and exit](#2-toast-list-staggered-enter-and-exit)
  - [3. Route transition wrapper (Next.js App Router)](#3-route-transition-wrapper-nextjs-app-router)
  - [4. Accordion — height auto expand](#4-accordion-height-auto-expand)
- [Layout Animations](#layout-animations)
  - [1. Shared `layoutId` — list to detail morph](#1-shared-layoutid-list-to-detail-morph)
  - [2. Expanding card](#2-expanding-card)
  - [3. FLIP grid reorder](#3-flip-grid-reorder)
- [Common Gotchas](#common-gotchas)
- [Cross-References](#cross-references)

---

## Install

```bash
npm i motion
# or
pnpm add motion
```

```ts
// Modern (motion v11.18+ / v12.x) — use this everywhere
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react'

// Next.js 14/15 App Router — pre-flagged 'use client', skip the directive
import { motion } from 'motion/react-client'

// Legacy alias (v6 → v11.17) — still works, but rename when you touch a file
// import { motion } from 'framer-motion'
```

If a Darkforge project still has `framer-motion` in `package.json`, treat it as a v11+ alias — the API in this file is identical. Bump to `motion` on next dependency sweep.

---

## Spring Config Presets

Drop this file at `lib/motion/springs.ts`. Every entrance, hover, and layout animation in the rest of this reference imports from here — never inline a spring config.

Two valid spring shapes: classic physics (`stiffness`, `damping`, `mass`) and the newer visual API (`bounce`, `duration`). Both ship below.

```ts
// lib/motion/springs.ts
import type { Transition } from 'motion/react'

// Tight & decisive — buttons, toggles, micro-interactions
export const snappy: Transition = { type: 'spring', stiffness: 400, damping: 30, mass: 0.6 }
// Default surface motion — cards, panels, drawers
export const smooth: Transition = { type: 'spring', stiffness: 220, damping: 26 }
// Visible overshoot — playful CTAs (visual API)
export const bouncy: Transition = { type: 'spring', bounce: 0.42, duration: 0.7 }
// Heavy & languid — hero text, route transitions
export const slow: Transition = { type: 'spring', stiffness: 90, damping: 22, mass: 1.4 }
// Magnetic cursor follow — hover targets
export const magnetic: Transition = { type: 'spring', stiffness: 320, damping: 22, mass: 0.5 }
// Gentle scrub — scroll-driven scale/opacity
export const scrub: Transition = { type: 'spring', stiffness: 60, damping: 20 }

// Stagger orchestrator — applies to parent, child uses `smooth`
export const stagger = (delayChildren = 0.08, staggerChildren = 0.06): Transition => ({ delayChildren, staggerChildren })
// Tween fallback for reduced-motion users
export const reduced: Transition = { duration: 0 }
```

---

## Entrance Animations

### 1. FadeUp — the workhorse

```tsx
'use client'
import { motion, useReducedMotion, type Variants } from 'motion/react'
import { smooth } from '@/lib/motion/springs'

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: smooth },
}

export function MetricHeadline({ value, label }: { value: string; label: string }) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      initial="hidden" animate="visible" variants={reduce ? undefined : fadeUp}
      style={{
        background: 'var(--df-bg-surface)', border: '1px solid var(--df-border-default)',
        borderRadius: 'var(--df-radius-lg)', padding: 'var(--df-space-6)',
      }}
    >
      <p style={{ color: 'var(--df-text-muted)', fontSize: 12, margin: 0 }}>{label}</p>
      <p style={{ color: 'var(--df-text-primary)', fontSize: 36, fontWeight: 600, margin: 0 }}>{value}</p>
    </motion.div>
  )
}
```

### 2. FadeIn — minimal, no Y offset (modals, replaced content)

```tsx
'use client'
import { motion } from 'motion/react'
import { snappy } from '@/lib/motion/springs'

export function StatusBadge({ status }: { status: 'live' | 'paused' | 'failed' }) {
  const color = status === 'live' ? 'var(--df-neon-green)'
    : status === 'paused' ? 'var(--df-neon-amber)'
    : 'var(--df-neon-red)'
  return (
    <motion.span
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={snappy}
      role="status" aria-label={`Campaign status: ${status}`}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6, color, fontSize: 12, fontWeight: 500,
        background: 'rgba(255,255,255,0.04)', padding: '4px 10px',
        borderRadius: 'var(--df-radius-full)', border: `1px solid ${color}33`,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, boxShadow: `0 0 8px ${color}` }} />
      {status}
    </motion.span>
  )
}
```

### 3. SlideInLeft — sidebar, drawer entry

```tsx
'use client'
import { motion } from 'motion/react'
import { smooth } from '@/lib/motion/springs'

export function NavRail({ children }: { children: React.ReactNode }) {
  return (
    <motion.aside
      initial={{ x: -240, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={smooth}
      aria-label="Primary navigation"
      style={{
        width: 240, height: '100vh', background: 'var(--df-bg-surface)',
        borderRight: '1px solid var(--df-border-subtle)', padding: 'var(--df-space-5)',
      }}
    >{children}</motion.aside>
  )
}
```

### 4. SlideInRight — toast, notification panel

```tsx
'use client'
import { motion } from 'motion/react'
import { snappy } from '@/lib/motion/springs'

export function NotificationPanel({ unread }: { unread: number }) {
  return (
    <motion.div
      initial={{ x: 360, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
      exit={{ x: 360, opacity: 0 }} transition={snappy}
      role="dialog" aria-label="Notifications"
      style={{
        position: 'fixed', top: 16, right: 16, width: 360, color: 'var(--df-text-primary)',
        background: 'var(--df-bg-elevated)', border: '1px solid var(--df-border-default)',
        borderRadius: 'var(--df-radius-lg)', padding: 'var(--df-space-5)',
        boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
      }}
    >
      <p style={{ margin: 0, fontWeight: 600 }}>{unread} new alerts</p>
      <p style={{ margin: '6px 0 0', color: 'var(--df-text-secondary)', fontSize: 13 }}>
        Bounce rate spiked above 4.2% — review deliverability.
      </p>
    </motion.div>
  )
}
```

### 5. ScaleIn — modal content, popover

```tsx
'use client'
import { motion } from 'motion/react'
import { bouncy } from '@/lib/motion/springs'

export function ConfirmDialog({ title, body }: { title: string; body: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }} transition={bouncy}
      role="alertdialog" aria-labelledby="cd-title"
      style={{
        background: 'var(--df-bg-overlay)', border: '1px solid var(--df-border-default)',
        borderRadius: 'var(--df-radius-xl)', padding: 'var(--df-space-8)',
        maxWidth: 420, boxShadow: 'var(--df-glow-violet-lg)',
      }}
    >
      <h2 id="cd-title" style={{ color: 'var(--df-text-primary)', margin: 0, fontSize: 20 }}>{title}</h2>
      <p style={{ color: 'var(--df-text-secondary)', marginTop: 8, lineHeight: 1.5 }}>{body}</p>
    </motion.div>
  )
}
```

### 6. BlurIn — premium hero text reveal

```tsx
'use client'
import { motion, useReducedMotion } from 'motion/react'
import { slow } from '@/lib/motion/springs'

export function HeroHeadline({ children }: { children: string }) {
  const reduce = useReducedMotion()
  return (
    <motion.h1
      initial={reduce ? false : { opacity: 0, filter: 'blur(12px)', y: 16 }}
      animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }} transition={slow}
      style={{
        fontFamily: 'var(--df-font-display)', fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
        fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--df-text-primary)',
        margin: 0, lineHeight: 1.05,
      }}
    >{children}</motion.h1>
  )
}
```

### 7. StaggerChildren — list reveal

```tsx
'use client'
import { motion, type Variants } from 'motion/react'
import { smooth, stagger } from '@/lib/motion/springs'

interface Campaign { id: string; name: string; opens: number }

const list: Variants = { hidden: {}, visible: { transition: stagger(0.1, 0.07) } }
const item: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: smooth },
}

export function CampaignList({ campaigns }: { campaigns: Campaign[] }) {
  return (
    <motion.ul
      initial="hidden" animate="visible" variants={list}
      style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 'var(--df-space-3)' }}
    >
      {campaigns.map(c => (
        <motion.li key={c.id} variants={item} style={{
          display: 'flex', justifyContent: 'space-between', color: 'var(--df-text-primary)',
          background: 'var(--df-bg-surface)', border: '1px solid var(--df-border-subtle)',
          borderRadius: 'var(--df-radius-md)', padding: 'var(--df-space-4)',
        }}>
          <span>{c.name}</span>
          <span style={{ color: 'var(--df-neon-cyan)' }}>{c.opens.toLocaleString()} opens</span>
        </motion.li>
      ))}
    </motion.ul>
  )
}
```

### 8. SequentialReveal — orchestrated multi-element scene

```tsx
'use client'
import { motion, type Variants } from 'motion/react'
import { smooth } from '@/lib/motion/springs'

const scene: Variants = {
  hidden: {},
  visible: { transition: { delayChildren: 0.15, staggerChildren: 0.12 } },
}
const piece: Variants = {
  hidden: { opacity: 0, y: 20, filter: 'blur(6px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: smooth },
}

export function HeroBlock() {
  return (
    <motion.section
      initial="hidden" animate="visible" variants={scene}
      style={{ display: 'grid', gap: 'var(--df-space-5)', maxWidth: 720 }}
    >
      <motion.span variants={piece} style={{ color: 'var(--df-neon-violet)', fontSize: 13, fontWeight: 500, letterSpacing: '0.08em' }}>
        BUILD 03 · DELIVERABILITY
      </motion.span>
      <motion.h1 variants={piece} style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 600, color: 'var(--df-text-primary)', margin: 0, lineHeight: 1.1 }}>
        Inbox placement, finally measurable.
      </motion.h1>
      <motion.p variants={piece} style={{ color: 'var(--df-text-secondary)', fontSize: 17, lineHeight: 1.6, margin: 0 }}>
        Track every send across 14 mailbox providers. Catch warmup drops before they cost you a domain.
      </motion.p>
      <motion.div variants={piece}>
        <button style={{
          background: 'var(--df-neon-violet)', color: 'var(--df-text-inverse)', border: 0,
          borderRadius: 'var(--df-radius-md)', padding: '12px 24px', fontWeight: 600,
          cursor: 'pointer', boxShadow: 'var(--df-glow-violet)',
        }}>Start free trial</button>
      </motion.div>
    </motion.section>
  )
}
```

---

## Scroll-Driven Animations

### 1. useScroll — viewport progress basics

```tsx
'use client'
import { motion, useScroll, useSpring } from 'motion/react'

export function ReadingProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 22, mass: 0.4 })
  return (
    <motion.div
      aria-hidden
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: 2, scaleX, transformOrigin: '0%',
        background: 'var(--df-neon-violet)', boxShadow: 'var(--df-glow-violet)', zIndex: 200,
      }}
    />
  )
}
```

### 2. useTransform parallax — layered hero depth

```tsx
'use client'
import { motion, useScroll, useTransform } from 'motion/react'
import { useRef } from 'react'

export function ParallaxHero({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const yBg = useTransform(scrollYProgress, [0, 1], ['0%', '40%'])
  const yFg = useTransform(scrollYProgress, [0, 1], ['0%', '15%'])
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])

  return (
    <section ref={ref} style={{ position: 'relative', height: '100vh', overflow: 'hidden', background: 'var(--df-bg-base)' }}>
      <motion.div style={{ y: yBg, position: 'absolute', inset: 0, background: 'radial-gradient(circle at 30% 20%, rgba(167,139,250,0.18), transparent 60%)' }} />
      <motion.div style={{ y: yFg, opacity, position: 'relative', padding: 'var(--df-space-16)' }}>{children}</motion.div>
    </section>
  )
}
```

### 3. Sticky progress — section completion indicator

```tsx
'use client'
import { motion, useScroll, useTransform } from 'motion/react'
import { useRef } from 'react'

export function SectionProgress({ label }: { label: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const width = useTransform(scrollYProgress, [0, 1], ['0%', '100%'])

  return (
    <div ref={ref} style={{ minHeight: '120vh', position: 'relative' }}>
      <div style={{
        position: 'sticky', top: 24, background: 'var(--df-bg-elevated)',
        border: '1px solid var(--df-border-default)', borderRadius: 'var(--df-radius-md)',
        padding: 'var(--df-space-4)',
      }}>
        <p style={{ margin: 0, color: 'var(--df-text-secondary)', fontSize: 13 }}>{label}</p>
        <div style={{ marginTop: 8, height: 3, background: 'var(--df-bg-muted)', borderRadius: 999, overflow: 'hidden' }}>
          <motion.div style={{ width, height: '100%', background: 'var(--df-neon-cyan)', boxShadow: 'var(--df-glow-cyan)' }} />
        </div>
      </div>
    </div>
  )
}
```

### 4. Scale on scroll — featured card zoom

```tsx
'use client'
import { motion, useScroll, useTransform } from 'motion/react'
import { useRef } from 'react'

export function ZoomCard({ src, alt }: { src: string; alt: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.85, 1, 0.95])
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0.6])

  return (
    <div ref={ref} style={{ perspective: 1200 }}>
      <motion.figure style={{
        scale, opacity, margin: 0, overflow: 'hidden',
        background: 'var(--df-bg-surface)', border: '1px solid var(--df-border-default)',
        borderRadius: 'var(--df-radius-xl)',
      }}>
        <img src={src} alt={alt} style={{ width: '100%', display: 'block' }} />
      </motion.figure>
    </div>
  )
}
```

### 5. Fade on scroll — `whileInView` shorthand

```tsx
'use client'
import { motion } from 'motion/react'
import { smooth } from '@/lib/motion/springs'

export function FeatureRow({ title, description }: { title: string; description: string }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }} transition={smooth}
      style={{
        background: 'var(--df-bg-surface)', border: '1px solid var(--df-border-subtle)',
        borderRadius: 'var(--df-radius-lg)', padding: 'var(--df-space-6)',
      }}
    >
      <h3 style={{ color: 'var(--df-text-primary)', margin: 0, fontSize: 18, fontWeight: 600 }}>{title}</h3>
      <p style={{ color: 'var(--df-text-secondary)', margin: '8px 0 0', lineHeight: 1.6 }}>{description}</p>
    </motion.article>
  )
}
```

### 6. Scrubbed scene — number ticker tied to scroll

```tsx
'use client'
import { motion, useScroll, useTransform, useMotionValueEvent } from 'motion/react'
import { useRef, useState } from 'react'

export function ScrubbedCounter({ to }: { to: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.8', 'end 0.2'] })
  const value = useTransform(scrollYProgress, [0, 1], [0, to])
  const [display, setDisplay] = useState(0)
  useMotionValueEvent(value, 'change', v => setDisplay(Math.round(v)))

  return (
    <div ref={ref} style={{ minHeight: '80vh', display: 'grid', placeItems: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <motion.p style={{
          fontFamily: 'var(--df-font-display)', fontSize: 'clamp(4rem, 12vw, 8rem)', fontWeight: 700,
          color: 'var(--df-neon-violet)', textShadow: '0 0 40px rgba(167,139,250,0.4)',
          margin: 0, lineHeight: 1,
        }}>{display.toLocaleString()}</motion.p>
        <p style={{ color: 'var(--df-text-secondary)', marginTop: 12 }}>emails delivered this week</p>
      </div>
    </div>
  )
}
```

---

## Gesture Animations

### 1. Drag with constraints — sortable card

```tsx
'use client'
import { motion } from 'motion/react'
import { useRef } from 'react'
import { snappy } from '@/lib/motion/springs'

export function DraggableTile({ label }: { label: string }) {
  const wrap = useRef<HTMLDivElement>(null)
  return (
    <div ref={wrap} style={{ height: 240, position: 'relative' }}>
      <motion.div
        drag dragConstraints={wrap} dragElastic={0.18}
        dragTransition={{ bounceStiffness: 400, bounceDamping: 28 }}
        whileDrag={{ scale: 1.04, boxShadow: 'var(--df-glow-violet-lg)' }} transition={snappy}
        role="button" tabIndex={0} aria-label={`Drag ${label}`}
        style={{
          width: 180, padding: 'var(--df-space-5)', cursor: 'grab', userSelect: 'none',
          color: 'var(--df-text-primary)', background: 'var(--df-bg-elevated)',
          border: '1px solid var(--df-border-default)', borderRadius: 'var(--df-radius-lg)',
        }}
      >{label}</motion.div>
    </div>
  )
}
```

### 2. 3D hover tilt

```tsx
'use client'
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react'
import { magnetic } from '@/lib/motion/springs'
import type { PointerEvent } from 'react'

export function TiltCard({ title, value }: { title: string; value: string }) {
  const x = useMotionValue(0); const y = useMotionValue(0)
  const sx = useSpring(x, magnetic); const sy = useSpring(y, magnetic)
  const rotateY = useTransform(sx, [-0.5, 0.5], [-12, 12])
  const rotateX = useTransform(sy, [-0.5, 0.5], [10, -10])

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    x.set((e.clientX - r.left) / r.width - 0.5)
    y.set((e.clientY - r.top) / r.height - 0.5)
  }
  const reset = () => { x.set(0); y.set(0) }

  return (
    <motion.div
      onPointerMove={onMove} onPointerLeave={reset}
      style={{
        rotateX, rotateY, transformPerspective: 1200, transformStyle: 'preserve-3d',
        width: 320, padding: 'var(--df-space-8)', background: 'var(--df-bg-surface)',
        border: '1px solid var(--df-border-default)', borderRadius: 'var(--df-radius-xl)',
      }}
    >
      <p style={{ margin: 0, color: 'var(--df-text-muted)', fontSize: 12 }}>{title}</p>
      <p style={{ margin: '8px 0 0', color: 'var(--df-text-primary)', fontSize: 32, fontWeight: 600 }}>{value}</p>
    </motion.div>
  )
}
```

### 3. Magnetic button — cursor pull

```tsx
'use client'
import { motion, useMotionValue, useSpring } from 'motion/react'
import { magnetic } from '@/lib/motion/springs'
import type { PointerEvent } from 'react'

export function MagneticCTA({ label, onClick }: { label: string; onClick?: () => void }) {
  const x = useMotionValue(0); const y = useMotionValue(0)
  const sx = useSpring(x, magnetic); const sy = useSpring(y, magnetic)

  const onMove = (e: PointerEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    x.set((e.clientX - r.left - r.width / 2) * 0.25)
    y.set((e.clientY - r.top - r.height / 2) * 0.25)
  }
  return (
    <motion.button
      onPointerMove={onMove} onPointerLeave={() => { x.set(0); y.set(0) }}
      onClick={onClick} whileTap={{ scale: 0.96 }}
      style={{
        x: sx, y: sy, border: 0, padding: '14px 28px', fontWeight: 600, cursor: 'pointer',
        background: 'var(--df-neon-violet)', color: 'var(--df-text-inverse)',
        borderRadius: 'var(--df-radius-full)', boxShadow: 'var(--df-glow-violet)',
      }}
    >{label}</motion.button>
  )
}
```

### 4. Swipe card — Tinder-style decision

```tsx
'use client'
import { motion, useMotionValue, useTransform, type PanInfo } from 'motion/react'

export function SwipeCard({ name, role, onDecide }: {
  name: string; role: string; onDecide: (verdict: 'shortlist' | 'reject') => void
}) {
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 200], [-18, 18])
  const opacity = useTransform(x, [-220, -120, 0, 120, 220], [0, 1, 1, 1, 0])
  const accept = useTransform(x, [40, 160], [0, 1])
  const reject = useTransform(x, [-160, -40], [1, 0])

  const onEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x > 140) onDecide('shortlist')
    else if (info.offset.x < -140) onDecide('reject')
  }
  return (
    <motion.div
      drag="x" dragElastic={0.3} onDragEnd={onEnd}
      style={{
        x, rotate, opacity, width: 320, padding: 'var(--df-space-6)', position: 'relative', cursor: 'grab',
        background: 'var(--df-bg-surface)', border: '1px solid var(--df-border-default)',
        borderRadius: 'var(--df-radius-xl)',
      }}
    >
      <motion.span style={{ opacity: accept, position: 'absolute', top: 16, left: 16, color: 'var(--df-neon-green)', fontWeight: 700 }}>SHORTLIST</motion.span>
      <motion.span style={{ opacity: reject, position: 'absolute', top: 16, right: 16, color: 'var(--df-neon-red)', fontWeight: 700 }}>REJECT</motion.span>
      <p style={{ color: 'var(--df-text-primary)', fontSize: 22, fontWeight: 600, margin: '32px 0 4px' }}>{name}</p>
      <p style={{ color: 'var(--df-text-secondary)', margin: 0 }}>{role}</p>
    </motion.div>
  )
}
```

### 5. Hover glow — neon edge ignite

```tsx
'use client'
import { motion } from 'motion/react'
import { smooth } from '@/lib/motion/springs'

export function GlowTile({ title, kpi }: { title: string; kpi: string }) {
  return (
    <motion.div
      initial={{ boxShadow: '0 0 0 rgba(167,139,250,0)' }}
      whileHover={{ boxShadow: '0 0 40px rgba(167,139,250,0.45)', borderColor: 'rgba(167,139,250,0.5)', y: -2 }}
      transition={smooth}
      style={{
        cursor: 'pointer', padding: 'var(--df-space-6)', background: 'var(--df-bg-surface)',
        border: '1px solid var(--df-border-default)', borderRadius: 'var(--df-radius-lg)',
      }}
    >
      <p style={{ color: 'var(--df-text-muted)', margin: 0, fontSize: 12 }}>{title}</p>
      <p style={{ color: 'var(--df-text-primary)', fontSize: 28, fontWeight: 600, margin: '6px 0 0' }}>{kpi}</p>
    </motion.div>
  )
}
```

---

## AnimatePresence Patterns

### 1. Modal with backdrop

```tsx
'use client'
import { AnimatePresence, motion } from 'motion/react'
import { snappy } from '@/lib/motion/springs'

export function Modal({ open, onClose, children }: {
  open: boolean; onClose: () => void; children: React.ReactNode
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="backdrop" onClick={onClose}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{
            position: 'fixed', inset: 0, display: 'grid', placeItems: 'center', zIndex: 400,
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
          }}
        >
          <motion.div
            key="panel" onClick={e => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.94, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }} transition={snappy}
            role="dialog" aria-modal="true"
            style={{
              maxWidth: 480, width: '92%', padding: 'var(--df-space-8)',
              background: 'var(--df-bg-overlay)', border: '1px solid var(--df-border-default)',
              borderRadius: 'var(--df-radius-xl)',
            }}
          >{children}</motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

### 2. Toast list — staggered enter and exit

```tsx
'use client'
import { AnimatePresence, motion } from 'motion/react'
import { snappy } from '@/lib/motion/springs'

export interface Toast { id: string; message: string; tone: 'info' | 'success' | 'error' }

export function ToastStack({ toasts }: { toasts: Toast[] }) {
  const accent = (t: Toast['tone']) =>
    t === 'success' ? 'var(--df-neon-green)' : t === 'error' ? 'var(--df-neon-red)' : 'var(--df-neon-cyan)'

  return (
    <ol aria-live="polite" style={{
      position: 'fixed', bottom: 24, right: 24, listStyle: 'none', padding: 0, margin: 0,
      display: 'grid', gap: 10, zIndex: 500,
    }}>
      <AnimatePresence initial={false}>
        {toasts.map(t => (
          <motion.li
            key={t.id} layout transition={snappy}
            initial={{ opacity: 0, x: 60, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.96, transition: { duration: 0.18 } }}
            style={{
              minWidth: 280, padding: '12px 16px', fontSize: 14,
              color: 'var(--df-text-primary)', background: 'var(--df-bg-elevated)',
              border: '1px solid var(--df-border-default)', borderLeft: `3px solid ${accent(t.tone)}`,
              borderRadius: 'var(--df-radius-md)', boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
            }}
          >{t.message}</motion.li>
        ))}
      </AnimatePresence>
    </ol>
  )
}
```

### 3. Route transition wrapper (Next.js App Router)

```tsx
'use client'
import { AnimatePresence, motion } from 'motion/react'
import { usePathname } from 'next/navigation'
import { smooth } from '@/lib/motion/springs'

export function RouteTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.main
        key={pathname} transition={smooth}
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
        style={{ minHeight: '100vh', background: 'var(--df-bg-base)' }}
      >{children}</motion.main>
    </AnimatePresence>
  )
}
```

### 4. Accordion — height auto expand

```tsx
'use client'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { smooth } from '@/lib/motion/springs'

export function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ background: 'var(--df-bg-surface)', border: '1px solid var(--df-border-subtle)', borderRadius: 'var(--df-radius-md)' }}>
      <button
        aria-expanded={open} onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', textAlign: 'left', background: 'transparent', border: 0, cursor: 'pointer',
          padding: 'var(--df-space-4) var(--df-space-5)', color: 'var(--df-text-primary)',
          fontSize: 15, fontWeight: 500, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}
      >
        {q}
        <motion.span animate={{ rotate: open ? 45 : 0 }} transition={smooth}
          style={{ color: 'var(--df-neon-violet)', fontSize: 20, lineHeight: 1 }}>+</motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content" transition={smooth} style={{ overflow: 'hidden' }}
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
          >
            <p style={{ margin: 0, padding: '0 var(--df-space-5) var(--df-space-5)', color: 'var(--df-text-secondary)', lineHeight: 1.6, fontSize: 14 }}>{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
```

---

## Layout Animations

### 1. Shared `layoutId` — list to detail morph

```tsx
'use client'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { smooth } from '@/lib/motion/springs'

interface Sequence { id: string; name: string; sends: number }

export function SequenceGallery({ items }: { items: Sequence[] }) {
  const [active, setActive] = useState<Sequence | null>(null)
  return (
    <>
      <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))' }}>
        {items.map(s => (
          <motion.li
            key={s.id} layoutId={`seq-${s.id}`} onClick={() => setActive(s)}
            style={{
              cursor: 'pointer', padding: 'var(--df-space-5)', background: 'var(--df-bg-surface)',
              border: '1px solid var(--df-border-default)', borderRadius: 'var(--df-radius-lg)',
            }}
          >
            <motion.h3 layoutId={`title-${s.id}`} style={{ color: 'var(--df-text-primary)', margin: 0 }}>{s.name}</motion.h3>
            <p style={{ color: 'var(--df-text-muted)', margin: '6px 0 0', fontSize: 13 }}>{s.sends.toLocaleString()} sends</p>
          </motion.li>
        ))}
      </ul>
      <AnimatePresence>
        {active && (
          <motion.div onClick={() => setActive(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'grid', placeItems: 'center', zIndex: 400 }}>
            <motion.div layoutId={`seq-${active.id}`} transition={smooth}
              style={{
                maxWidth: 560, width: '90%', padding: 'var(--df-space-8)',
                background: 'var(--df-bg-overlay)', border: '1px solid var(--df-border-default)',
                borderRadius: 'var(--df-radius-xl)',
              }}
            >
              <motion.h3 layoutId={`title-${active.id}`} style={{ color: 'var(--df-text-primary)', margin: 0, fontSize: 28 }}>{active.name}</motion.h3>
              <p style={{ color: 'var(--df-text-secondary)', marginTop: 12, lineHeight: 1.6 }}>
                Detail view animates from the card position. Press anywhere to dismiss.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
```

### 2. Expanding card

```tsx
'use client'
import { motion } from 'motion/react'
import { useState } from 'react'
import { smooth } from '@/lib/motion/springs'

export function ExpandingMetricCard({ title, body }: { title: string; body: string }) {
  const [open, setOpen] = useState(false)
  return (
    <motion.div
      layout transition={smooth} onClick={() => setOpen(o => !o)}
      style={{
        cursor: 'pointer', width: open ? 480 : 280, padding: 'var(--df-space-5)',
        background: 'var(--df-bg-surface)', border: '1px solid var(--df-border-default)',
        borderRadius: 'var(--df-radius-lg)',
      }}
    >
      <motion.h3 layout="position" style={{ color: 'var(--df-text-primary)', margin: 0 }}>{title}</motion.h3>
      {open && (
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
          style={{ color: 'var(--df-text-secondary)', marginTop: 12, lineHeight: 1.6 }}
        >{body}</motion.p>
      )}
    </motion.div>
  )
}
```

### 3. FLIP grid reorder

```tsx
'use client'
import { AnimatePresence, motion } from 'motion/react'
import { smooth } from '@/lib/motion/springs'

interface Inbox { id: string; subject: string; sender: string }

export function InboxGrid({ items }: { items: Inbox[] }) {
  return (
    <motion.ul layout style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))' }}>
      <AnimatePresence>
        {items.map(it => (
          <motion.li
            key={it.id} layout transition={smooth}
            initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
            style={{
              padding: 'var(--df-space-4)', background: 'var(--df-bg-surface)',
              border: '1px solid var(--df-border-subtle)', borderRadius: 'var(--df-radius-md)',
            }}
          >
            <p style={{ color: 'var(--df-text-primary)', margin: 0, fontWeight: 500 }}>{it.subject}</p>
            <p style={{ color: 'var(--df-text-muted)', margin: '4px 0 0', fontSize: 12 }}>{it.sender}</p>
          </motion.li>
        ))}
      </AnimatePresence>
    </motion.ul>
  )
}
```

---

## Common Gotchas

- **`'use client'` on every motion file.** Hooks like `useScroll`, `useMotionValue`, `useReducedMotion` only run in the browser. In Next.js App Router either add the directive or import from `motion/react-client`, which is pre-flagged. Server components rendering raw `motion.*` will compile but never animate.
- **`useReducedMotion()` returns `boolean | null`.** It's `null` during SSR — never assert non-null. Always treat null as "not yet known" and render the static path until hydration; alternately wrap the whole tree in `<MotionConfig reducedMotion="user">` to opt every component in globally with no per-call guards.
- **`layoutId` collisions silently teleport.** Reusing the same `layoutId` across two simultaneously-mounted nodes causes them to morph into each other. Prefix with the entity id (`seq-${id}`, not `card`) when rendering lists.
- **`AnimatePresence mode="wait"` is wrong for lists.** Use it only when one element replaces another (route transitions, modal swaps). For toast stacks, accordions, and grids leave the default mode and combine with `layout` so siblings flow around exiting items. Add `initial={false}` on the parent to skip the first-render entrance.
- **Heavy lists tank framerate.** Animating 100+ children with springs and `layout` will jank. Cap visible animated items, virtualize the rest, or downgrade to `transition={{ duration: 0.2 }}` for items past index 30.
- **`AnimatePresence` + `<Suspense>` swallows exits.** When a suspended child unmounts, AnimatePresence never sees an exit — Suspense replaces it synchronously. Lift the AnimatePresence above the Suspense boundary or key the Suspense fallback itself.
- **`whileInView` runs once per scroll-back unless you set `viewport.once`.** The default re-fires every entry. For reveal-only-on-first-sight set `viewport={{ once: true, margin: '-80px' }}` — the negative margin starts the animation slightly before the element fully enters the viewport.

---

## Cross-References

- `references/patterns/hero.md` — combines `SequentialReveal` + `ParallaxHero` + `MagneticCTA`
- `references/patterns/dashboard.md` — uses `StaggerChildren` for stat cards, `TiltCard` for KPI tiles, `FLIP grid reorder` for the inbox view
- `references/patterns/navbar.md` — `SlideInLeft` for mobile drawer, `useScroll` for shrink-on-scroll header
- `references/patterns/scroll-story.md` — chains every scroll pattern in this file
- `references/patterns/pricing.md` — `ExpandingMetricCard` powers tier feature reveals
- `references/17-skeleton-system.md` — pair `FadeIn` with skeleton-to-content swaps via `AnimatePresence mode="wait"`
- `references/02-gsap.md` — when scrubbed scroll choreography exceeds what `useScroll` + `useTransform` can express, fall back to GSAP ScrollTrigger
- `references/00-dark-tokens.md` — every color, glow, radius, and easing variable referenced above
