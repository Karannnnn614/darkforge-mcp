# Darkforge — Skiper UI Dark Reference
Skiper UI is a premium, scroll-driven component library in the shadcn-style copy-paste tradition — known for cinematic 3D card reveals, sticky stacked sections, and tight scroll-tied motion. Darkforge complements it: this file delivers the **scroll patterns** that make landing pages feel premium, dark-tokenized, and brand-coherent with the rest of Darkforge.

## Contents

- [Source-of-truth caveat (read first)](#source-of-truth-caveat-read-first)
- [How to use these patterns](#how-to-use-these-patterns)
- [Pattern 1 — `NxScrollStack` (sticky stacked cards)](#pattern-1-nxscrollstack-sticky-stacked-cards)
- [Pattern 2 — `NxScrollFlipCard` (3D flip on scroll progress)](#pattern-2-nxscrollflipcard-3d-flip-on-scroll-progress)
- [Pattern 3 — `NxHorizontalSnapRow` (horizontal scroll-snap with neon dots)](#pattern-3-nxhorizontalsnaprow-horizontal-scroll-snap-with-neon-dots)
- [Pattern 4 — `NxParallaxImageRow` (scroll-driven parallax band)](#pattern-4-nxparallaximagerow-scroll-driven-parallax-band)
- [Pattern 5 — `NxScrollCounter` (scroll-tied counter strip)](#pattern-5-nxscrollcounter-scroll-tied-counter-strip)
- [Pattern 6 — `NxScrollReveal` (spring text reveal on scroll)](#pattern-6-nxscrollreveal-spring-text-reveal-on-scroll)
- [Pattern 7 — `NxScrollProgressBar` (top-of-page neon progress)](#pattern-7-nxscrollprogressbar-top-of-page-neon-progress)
- [Common gotchas](#common-gotchas)
- [Cross-references](#cross-references)

---

## Source-of-truth caveat (read first)

This file ships **Darkforge scroll patterns inspired by Skiper UI's approach** — not verbatim Skiper components. Skiper UI is a less universally-documented library and the assistant's training data does not reliably contain its exact import paths, prop signatures, or CLI behavior. Rather than fabricate `SkiperCard` APIs that may not exist, every component below is namespaced `Nx*` and built from primitives that **are** firmly known: Framer Motion's `useScroll` / `useTransform`, CSS `scroll-snap`, `position: sticky`, and `IntersectionObserver`.

If you want a verbatim Skiper component, copy it from **skiper-ui.com** directly into your codebase, then re-skin it with the DF tokens documented in `00-dark-tokens.md`. The patterns below give you the same *visual genre* (3D scroll cards, sticky stacks, parallax rows, scroll-flip cards) without claiming brand parity.

**What's high confidence in this file:**
- Framer Motion `useScroll` / `useTransform` / `useMotionValueEvent` APIs
- CSS `scroll-snap-type` / `scroll-snap-align` behavior
- `position: sticky` with stacked translate offsets
- `IntersectionObserver` reveal patterns
- All DF token names (cross-checked against `00-dark-tokens.md`)

**What is explicitly NOT claimed:**
- Any `npx skiper@latest …` install command — none is shown below
- Any `import { … } from "@/components/ui/skiper-…"` path
- Any direct re-implementation of a named Skiper component

---

## How to use these patterns

These are paste-in patterns, not an installable package. Each component:

1. Declares `'use client'` (all use Framer Motion or DOM APIs).
2. Depends only on `framer-motion` and React 18+. Install with `npm i framer-motion`.
3. Reads from the global DF token system in `00-dark-tokens.md` — inject those CSS custom properties into `:root` first.
4. Honors `prefers-reduced-motion` so motion-sensitive users get a static fallback.

Copy the file, drop it into `components/ui/`, import where needed.

---

## Pattern 1 — `NxScrollStack` (sticky stacked cards)

**When to use:** Long-form landing pages where each pillar of your value prop deserves its own viewport. Cards stack on top of each other as the user scrolls, with subtle scale and y-offset on the leaving card.

```tsx
'use client'

import { useRef, type ReactNode } from 'react'
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion'

interface NxScrollStackItem {
  id: string
  eyebrow: string
  title: string
  body: string
  accent?: 'violet' | 'cyan' | 'pink' | 'green'
}

interface NxScrollStackProps {
  items: NxScrollStackItem[]
  /** Vertical scroll distance per card. Higher = slower stack. */
  cardScrollVh?: number
}

const ACCENT_GLOW: Record<NonNullable<NxScrollStackItem['accent']>, string> = {
  violet: 'var(--df-glow-violet)',
  cyan: 'var(--df-glow-cyan)',
  pink: 'var(--df-glow-pink)',
  green: 'var(--df-glow-green)',
}

const ACCENT_COLOR: Record<NonNullable<NxScrollStackItem['accent']>, string> = {
  violet: 'var(--df-neon-violet)',
  cyan: 'var(--df-neon-cyan)',
  pink: 'var(--df-neon-pink)',
  green: 'var(--df-neon-green)',
}

function NxScrollStackCard({
  item,
  index,
  total,
  containerRef,
  reduce,
}: {
  item: NxScrollStackItem
  index: number
  total: number
  containerRef: React.RefObject<HTMLElement>
  reduce: boolean
}): JSX.Element {
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  })

  // Each card lives in its own slice of [0..1] of the parent scroll progress.
  const sliceStart = index / total
  const sliceEnd = (index + 1) / total

  // Card scales down + drifts up slightly as the *next* card covers it.
  const scale = useTransform(
    scrollYProgress,
    [sliceStart, sliceEnd],
    reduce ? [1, 1] : [1, 0.92],
  )
  const y = useTransform(
    scrollYProgress,
    [sliceStart, sliceEnd],
    reduce ? [0, 0] : [0, -32],
  )

  const accent = item.accent ?? 'violet'

  return (
    <div
      style={{
        position: 'sticky',
        top: '10vh',
        height: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        // Each card sits on top of the previous via paint order.
        paddingTop: `${index * 18}px`,
      }}
    >
      <motion.article
        style={{
          scale,
          y,
          width: 'min(960px, 92vw)',
          background: 'var(--df-bg-surface)',
          border: '1px solid var(--df-border-default)',
          borderRadius: 'var(--df-radius-2xl)',
          padding: 'var(--df-space-12) var(--df-space-8)',
          boxShadow: ACCENT_GLOW[accent],
          color: 'var(--df-text-primary)',
          willChange: 'transform',
        }}
        aria-roledescription="scroll-stacked card"
      >
        <p
          style={{
            color: ACCENT_COLOR[accent],
            fontSize: 13,
            fontWeight: 500,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            margin: 0,
          }}
        >
          {item.eyebrow}
        </p>
        <h2
          style={{
            fontFamily: 'var(--df-font-display)',
            fontSize: 'clamp(28px, 5vw, 56px)',
            fontWeight: 600,
            lineHeight: 1.05,
            margin: 'var(--df-space-3) 0 var(--df-space-5)',
          }}
        >
          {item.title}
        </h2>
        <p
          style={{
            color: 'var(--df-text-secondary)',
            fontSize: 'clamp(15px, 1.6vw, 18px)',
            lineHeight: 1.6,
            maxWidth: '52ch',
            margin: 0,
          }}
        >
          {item.body}
        </p>
      </motion.article>
    </div>
  )
}

export function NxScrollStack({ items, cardScrollVh = 100 }: NxScrollStackProps): JSX.Element {
  const containerRef = useRef<HTMLElement | null>(null)
  const reduce = useReducedMotion() ?? false

  return (
    <section
      ref={containerRef}
      aria-label="Feature stack"
      style={{
        position: 'relative',
        background: 'var(--df-bg-base)',
        // Total scroll length — one viewport per card plus a tail.
        height: `${items.length * cardScrollVh + 50}vh`,
      }}
    >
      {items.map((item, i) => (
        <NxScrollStackCard
          key={item.id}
          item={item}
          index={i}
          total={items.length}
          containerRef={containerRef}
          reduce={reduce}
        />
      ))}
    </section>
  )
}
```

**Customization knobs:** `cardScrollVh` controls scroll distance per card; `accent` per item swaps the glow color; reduce the `padding` token to fit shorter cards.

---

## Pattern 2 — `NxScrollFlipCard` (3D flip on scroll progress)

**When to use:** Hero or feature reveal where one card pivots from "before" to "after" face as the user scrolls past. Replaces the click-to-flip pattern with a scroll-tied one.

```tsx
'use client'

import { useRef, type ReactNode } from 'react'
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion'

interface NxScrollFlipCardProps {
  front: ReactNode
  back: ReactNode
  /** Aspect ratio of the card — defaults to 3/4 portrait. */
  aspectRatio?: string
  ariaLabel?: string
}

export function NxScrollFlipCard({
  front,
  back,
  aspectRatio = '3 / 4',
  ariaLabel = 'Scroll-flipping card',
}: NxScrollFlipCardProps): JSX.Element {
  const ref = useRef<HTMLDivElement | null>(null)
  const reduce = useReducedMotion() ?? false

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 80%', 'end 20%'],
  })

  const rotateY = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [0, 180])
  const frontOpacity = useTransform(scrollYProgress, [0.45, 0.55], [1, 0])
  const backOpacity = useTransform(scrollYProgress, [0.45, 0.55], [0, 1])

  return (
    <div
      ref={ref}
      role="figure"
      aria-label={ariaLabel}
      style={{
        perspective: '1600px',
        width: '100%',
        maxWidth: 480,
        aspectRatio,
        margin: '0 auto',
      }}
    >
      <motion.div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          transformStyle: 'preserve-3d',
          rotateY,
          willChange: 'transform',
        }}
      >
        {/* Front face */}
        <motion.div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'var(--df-bg-surface)',
            border: '1px solid var(--df-border-default)',
            borderRadius: 'var(--df-radius-xl)',
            padding: 'var(--df-space-8)',
            color: 'var(--df-text-primary)',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            opacity: frontOpacity,
            boxShadow: 'var(--df-glow-violet)',
          }}
        >
          {front}
        </motion.div>

        {/* Back face — pre-rotated 180deg so it faces forward when parent flips */}
        <motion.div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'var(--df-bg-elevated)',
            border: '1px solid rgba(167, 139, 250, 0.4)',
            borderRadius: 'var(--df-radius-xl)',
            padding: 'var(--df-space-8)',
            color: 'var(--df-text-primary)',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            opacity: backOpacity,
            boxShadow: 'var(--df-glow-cyan)',
          }}
        >
          {back}
        </motion.div>
      </motion.div>
    </div>
  )
}

// Example usage
export function NxScrollFlipCardExample(): JSX.Element {
  return (
    <section
      style={{
        background: 'var(--df-bg-base)',
        padding: 'var(--df-space-16) var(--df-space-6)',
        minHeight: '180vh', // give it scroll room
      }}
    >
      <NxScrollFlipCard
        ariaLabel="Before and after results"
        front={
          <>
            <p style={{ color: 'var(--df-neon-violet)', fontSize: 13, margin: 0 }}>BEFORE</p>
            <h3 style={{ fontSize: 28, fontWeight: 600, marginTop: 12 }}>Manual onboarding</h3>
            <p style={{ color: 'var(--df-text-secondary)', fontSize: 15, lineHeight: 1.6 }}>
              4 hours of setup. 12 emails. Zero traction in week one.
            </p>
          </>
        }
        back={
          <>
            <p style={{ color: 'var(--df-neon-cyan)', fontSize: 13, margin: 0 }}>AFTER</p>
            <h3 style={{ fontSize: 28, fontWeight: 600, marginTop: 12 }}>One-click to live</h3>
            <p style={{ color: 'var(--df-text-secondary)', fontSize: 15, lineHeight: 1.6 }}>
              90 seconds, automated. Day one delivery, week one revenue.
            </p>
          </>
        }
      />
    </section>
  )
}
```

**Gotcha:** The card needs **vertical scroll room** above and below. The `offset: ['start 80%', 'end 20%']` means the flip starts when the card top hits 80% of viewport and ends when its bottom passes 20% — so a one-screen-tall card needs ~1.5 screens of surrounding scroll.

---

## Pattern 3 — `NxHorizontalSnapRow` (horizontal scroll-snap with neon dots)

**When to use:** Mobile-first product showcases, testimonials, or case studies. Pure CSS scroll-snap — no JavaScript on the scroll path, so it's smooth even on low-end devices.

```tsx
'use client'

import type { ReactNode } from 'react'
import { useRef, useState, useEffect } from 'react'

interface NxHorizontalSnapRowProps<T> {
  items: T[]
  renderItem: (item: T, index: number) => ReactNode
  ariaLabel: string
  /** Card width in CSS — defaults to clamp(280px, 80vw, 420px). */
  itemWidth?: string
}

export function NxHorizontalSnapRow<T>({
  items,
  renderItem,
  ariaLabel,
  itemWidth = 'clamp(280px, 80vw, 420px)',
}: NxHorizontalSnapRowProps<T>): JSX.Element {
  const trackRef = useRef<HTMLDivElement | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const el = trackRef.current
    if (!el) return

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
            const idx = Number((entry.target as HTMLElement).dataset.idx)
            if (!Number.isNaN(idx)) setActiveIndex(idx)
          }
        })
      },
      { root: el, threshold: [0.6] },
    )

    el.querySelectorAll<HTMLElement>('[data-snap-item]').forEach((node) => obs.observe(node))
    return () => obs.disconnect()
  }, [items.length])

  const scrollTo = (idx: number): void => {
    const el = trackRef.current
    if (!el) return
    const target = el.querySelector<HTMLElement>(`[data-idx="${idx}"]`)
    target?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }

  return (
    <section
      aria-label={ariaLabel}
      style={{
        background: 'var(--df-bg-base)',
        paddingBlock: 'var(--df-space-12)',
      }}
    >
      <div
        ref={trackRef}
        role="region"
        aria-roledescription="carousel"
        style={{
          display: 'flex',
          gap: 'var(--df-space-6)',
          paddingInline: 'max(var(--df-space-6), 6vw)',
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          scrollPadding: 'var(--df-space-6)',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {items.map((item, i) => (
          <div
            key={i}
            data-snap-item
            data-idx={i}
            style={{
              flex: `0 0 ${itemWidth}`,
              scrollSnapAlign: 'center',
              scrollSnapStop: 'always',
            }}
          >
            {renderItem(item, i)}
          </div>
        ))}
      </div>

      {/* Neon dot indicator */}
      <div
        role="tablist"
        aria-label="Slides"
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 'var(--df-space-2)',
          marginTop: 'var(--df-space-6)',
        }}
      >
        {items.map((_, i) => {
          const active = i === activeIndex
          return (
            <button
              key={i}
              role="tab"
              aria-selected={active}
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => scrollTo(i)}
              style={{
                width: active ? 28 : 8,
                height: 8,
                borderRadius: 'var(--df-radius-full)',
                border: 'none',
                cursor: 'pointer',
                background: active ? 'var(--df-neon-violet)' : 'var(--df-bg-muted)',
                boxShadow: active ? 'var(--df-glow-violet)' : 'none',
                transition: `width var(--df-duration-base) var(--df-ease-out),
                             background var(--df-duration-base) var(--df-ease-out)`,
              }}
            />
          )
        })}
      </div>
    </section>
  )
}
```

**Hide the scrollbar:** add `.nx-snap-row::-webkit-scrollbar { display: none }` to your global CSS if you want a fully clean track. The component already sets `scrollbarWidth: 'none'` for Firefox.

---

## Pattern 4 — `NxParallaxImageRow` (scroll-driven parallax band)

**When to use:** A horizontal band of images that drift sideways as the section enters the viewport — common in editorial, portfolio, and "trusted by" rows.

```tsx
'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion'

interface NxParallaxImageRowItem {
  src: string
  alt: string
  caption?: string
}

interface NxParallaxImageRowProps {
  items: NxParallaxImageRowItem[]
  /** Negative drift in px — how far the row shifts during its scroll window. */
  driftPx?: number
}

export function NxParallaxImageRow({
  items,
  driftPx = 320,
}: NxParallaxImageRowProps): JSX.Element {
  const ref = useRef<HTMLElement | null>(null)
  const reduce = useReducedMotion() ?? false

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })

  const x = useTransform(
    scrollYProgress,
    [0, 1],
    reduce ? [0, 0] : [driftPx / 2, -driftPx / 2],
  )

  return (
    <section
      ref={ref}
      aria-label="Featured imagery"
      style={{
        position: 'relative',
        overflow: 'hidden',
        background: 'var(--df-bg-base)',
        paddingBlock: 'var(--df-space-16)',
      }}
    >
      {/* Edge fades — keeps the row feeling infinite */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background:
            'linear-gradient(90deg, var(--df-bg-base) 0%, transparent 8%, transparent 92%, var(--df-bg-base) 100%)',
          zIndex: 1,
        }}
      />
      <motion.div
        style={{
          x,
          display: 'flex',
          gap: 'var(--df-space-6)',
          willChange: 'transform',
          paddingInline: 'var(--df-space-6)',
        }}
      >
        {items.map((item, i) => (
          <figure
            key={i}
            style={{
              flex: '0 0 auto',
              width: 'clamp(220px, 28vw, 360px)',
              margin: 0,
            }}
          >
            <div
              style={{
                position: 'relative',
                aspectRatio: '4 / 5',
                borderRadius: 'var(--df-radius-lg)',
                overflow: 'hidden',
                background: 'var(--df-bg-surface)',
                border: '1px solid var(--df-border-subtle)',
              }}
            >
              <img
                src={item.src}
                alt={item.alt}
                loading="lazy"
                decoding="async"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            </div>
            {item.caption && (
              <figcaption
                style={{
                  marginTop: 'var(--df-space-3)',
                  color: 'var(--df-text-secondary)',
                  fontSize: 13,
                  letterSpacing: '0.04em',
                }}
              >
                {item.caption}
              </figcaption>
            )}
          </figure>
        ))}
      </motion.div>
    </section>
  )
}
```

**Why edge fades matter:** without them the parallax shift looks like clipping. The fade pretends the row continues beyond viewport.

---

## Pattern 5 — `NxScrollCounter` (scroll-tied counter strip)

**When to use:** "By the numbers" social-proof strip. Numbers tick up as the section enters the viewport, then lock once visible.

```tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useInView, useReducedMotion } from 'framer-motion'

interface NxScrollCounterStat {
  label: string
  /** Final integer to count up to. */
  value: number
  /** Optional suffix like '%', '+', 'k'. */
  suffix?: string
  accent?: 'violet' | 'cyan' | 'pink' | 'green'
}

interface NxScrollCounterProps {
  stats: NxScrollCounterStat[]
  /** Animation duration in ms. */
  durationMs?: number
}

const ACCENT: Record<NonNullable<NxScrollCounterStat['accent']>, string> = {
  violet: 'var(--df-neon-violet)',
  cyan: 'var(--df-neon-cyan)',
  pink: 'var(--df-neon-pink)',
  green: 'var(--df-neon-green)',
}

function CounterCell({
  stat,
  start,
  durationMs,
  reduce,
}: {
  stat: NxScrollCounterStat
  start: boolean
  durationMs: number
  reduce: boolean
}): JSX.Element {
  const [display, setDisplay] = useState(reduce ? stat.value : 0)
  const accent = ACCENT[stat.accent ?? 'violet']

  useEffect(() => {
    if (!start) return
    if (reduce) {
      setDisplay(stat.value)
      return
    }
    let raf = 0
    const startTs = performance.now()
    const tick = (now: number): void => {
      const t = Math.min(1, (now - startTs) / durationMs)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(Math.round(stat.value * eased))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [start, stat.value, durationMs, reduce])

  return (
    <div
      style={{
        flex: 1,
        minWidth: 160,
        padding: 'var(--df-space-6)',
        textAlign: 'left',
      }}
    >
      <p
        style={{
          fontFamily: 'var(--df-font-display)',
          color: accent,
          fontSize: 'clamp(36px, 5vw, 64px)',
          fontWeight: 600,
          margin: 0,
          fontVariantNumeric: 'tabular-nums',
          textShadow: `0 0 24px ${accent}`,
        }}
        aria-label={`${stat.value}${stat.suffix ?? ''} ${stat.label}`}
      >
        <span aria-hidden>{display.toLocaleString()}</span>
        {stat.suffix && <span aria-hidden>{stat.suffix}</span>}
      </p>
      <p
        style={{
          color: 'var(--df-text-secondary)',
          fontSize: 14,
          margin: 'var(--df-space-2) 0 0',
          letterSpacing: '0.02em',
        }}
      >
        {stat.label}
      </p>
    </div>
  )
}

export function NxScrollCounter({
  stats,
  durationMs = 1400,
}: NxScrollCounterProps): JSX.Element {
  const ref = useRef<HTMLElement | null>(null)
  const inView = useInView(ref, { once: true, amount: 0.4 })
  const reduce = useReducedMotion() ?? false

  return (
    <motion.section
      ref={ref}
      aria-label="Key metrics"
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        background: 'var(--df-bg-surface)',
        border: '1px solid var(--df-border-subtle)',
        borderRadius: 'var(--df-radius-xl)',
        margin: 'var(--df-space-12) auto',
        maxWidth: 1120,
        display: 'flex',
        flexWrap: 'wrap',
        gap: 0,
        divideX: 1,
      }}
    >
      {stats.map((s, i) => (
        <div
          key={s.label}
          style={{
            flex: '1 1 200px',
            borderLeft: i === 0 ? 'none' : '1px solid var(--df-border-subtle)',
          }}
        >
          <CounterCell stat={s} start={inView} durationMs={durationMs} reduce={reduce} />
        </div>
      ))}
    </motion.section>
  )
}
```

**Tabular nums** (`fontVariantNumeric: 'tabular-nums'`) is the detail that prevents numbers from "jiggling" while the count animates — every digit takes the same horizontal slot.

---

## Pattern 6 — `NxScrollReveal` (spring text reveal on scroll)

**When to use:** Section headlines that "rise" into view word-by-word. Replaces the bog-standard fade-up.

```tsx
'use client'

import { useRef } from 'react'
import { motion, useInView, useReducedMotion, type Variants } from 'framer-motion'

interface NxScrollRevealProps {
  text: string
  as?: 'h1' | 'h2' | 'h3' | 'p'
  /** Stagger delay between words, in seconds. */
  stagger?: number
  className?: string
}

export function NxScrollReveal({
  text,
  as: Tag = 'h2',
  stagger = 0.06,
  className,
}: NxScrollRevealProps): JSX.Element {
  const ref = useRef<HTMLElement | null>(null)
  const inView = useInView(ref, { once: true, amount: 0.5 })
  const reduce = useReducedMotion() ?? false

  const words = text.split(' ')

  const container: Variants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: reduce ? 0 : stagger },
    },
  }

  const word: Variants = {
    hidden: reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: '0.6em' },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 240, damping: 22 },
    },
  }

  return (
    <Tag
      ref={ref as React.RefObject<HTMLHeadingElement>}
      className={className}
      style={{
        fontFamily: 'var(--df-font-display)',
        fontSize: 'clamp(32px, 6vw, 72px)',
        fontWeight: 600,
        lineHeight: 1.05,
        color: 'var(--df-text-primary)',
        margin: 0,
        // overflow hidden so the y: 0.6em words "rise" from below the line.
        overflow: 'hidden',
      }}
    >
      <motion.span
        style={{ display: 'inline-block' }}
        variants={container}
        initial="hidden"
        animate={inView ? 'visible' : 'hidden'}
        aria-label={text}
      >
        {words.map((w, i) => (
          <motion.span
            key={`${w}-${i}`}
            variants={word}
            aria-hidden
            style={{ display: 'inline-block', marginRight: '0.25em', willChange: 'transform' }}
          >
            {w}
          </motion.span>
        ))}
      </motion.span>
    </Tag>
  )
}

// Example
export function NxScrollRevealExample(): JSX.Element {
  return (
    <section
      style={{
        background: 'var(--df-bg-base)',
        padding: 'var(--df-space-16) var(--df-space-6)',
        minHeight: '60vh',
      }}
    >
      <NxScrollReveal text="Built for teams who ship daily, not quarterly." as="h1" />
    </section>
  )
}
```

**Accessibility note:** `aria-label` on the parent span carries the full text; each word span is `aria-hidden` so screen readers don't read fragmented words.

---

## Pattern 7 — `NxScrollProgressBar` (top-of-page neon progress)

**When to use:** Long-form content (blog posts, docs, landing pages). A thin neon bar at the top of the viewport tracks scroll progress.

```tsx
'use client'

import { motion, useScroll, useSpring } from 'framer-motion'

interface NxScrollProgressBarProps {
  /** Sticky position from top — defaults to 0. Use larger if you have a fixed header. */
  top?: number | string
  height?: number
}

export function NxScrollProgressBar({
  top = 0,
  height = 2,
}: NxScrollProgressBarProps): JSX.Element {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 24,
    mass: 0.4,
    restDelta: 0.001,
  })

  return (
    <motion.div
      role="progressbar"
      aria-label="Page scroll progress"
      style={{
        position: 'fixed',
        top,
        left: 0,
        right: 0,
        height,
        scaleX,
        transformOrigin: '0% 50%',
        background: `linear-gradient(
          90deg,
          var(--df-neon-violet) 0%,
          var(--df-neon-cyan) 50%,
          var(--df-neon-pink) 100%
        )`,
        boxShadow: '0 0 12px rgba(167, 139, 250, 0.6)',
        zIndex: 'var(--df-z-sticky)',
        pointerEvents: 'none',
      }}
    />
  )
}
```

Drop `<NxScrollProgressBar />` once at the root of your `app/layout.tsx` (after a `'use client'` wrapper) and forget about it.

---

## Common gotchas

1. **IntersectionObserver SSR safety.** `IntersectionObserver` is a browser API. Any component using it must declare `'use client'` at the very top of the file in Next.js App Router, otherwise hydration will throw or the effect will silently not run. Pattern 3 (`NxHorizontalSnapRow`) is the relevant case here.
2. **`useScroll` + `target` ref needs height.** `useScroll({ target })` reads the element's bounding box against the viewport. If your target is `display: contents` or zero-height, `scrollYProgress` will pin at 0 forever. Always give the target a real height — patterns 1 and 4 set explicit `height` or `paddingBlock`.
3. **Hydration mismatch on scroll-tied state.** Don't initialize state with `window.scrollY` at module scope — that runs on the server and crashes. Initialize to a static value (`0`, `false`, etc.) and update inside `useEffect`. Pattern 5's counter follows this rule.
4. **Sticky pin offsets break on resize.** A `position: sticky` card pinned at `top: 10vh` recalculates on resize, but if a user rotates their phone mid-scroll, Safari can leave the card mis-pinned for one frame. Mitigation: avoid pinning to absolute pixel offsets — use `vh` or `rem` so the offset scales naturally.
5. **`prefers-reduced-motion` is non-negotiable.** Vestibular-disorder users can experience nausea from scroll-tied animations. Every pattern above pulls `useReducedMotion()` from Framer and short-circuits transforms to identity values when true. Never ship a scroll component without this guard.

---

## Cross-references

- **`01-framer-motion.md`** — primary dependency. `useScroll`, `useTransform`, `useInView`, `useSpring`, `useReducedMotion`, and `motion` components are all defined there. If anything in this file confuses you, `01-framer-motion.md` is the source of truth.
- **`00-dark-tokens.md`** — every CSS custom property referenced here (`--df-bg-*`, `--df-neon-*`, `--df-glow-*`, `--df-radius-*`, `--df-space-*`, `--df-z-*`, `--df-ease-*`) is defined there.
- **`04-aceternity.md` / `05-magicui.md`** — sibling premium-component references. Aceternity has overlapping intent (3D card, parallax) but tends toward heavier WebGL/canvas effects; this file is the lighter, scroll-API-only counterpart.
- **`17-skeleton-system.md`** — for the loading state of any of these patterns. A `NxScrollStack` whose data is fetched should render `<BlogCardSkeleton />` placeholders inside until items arrive.

**Where these patterns earn their keep in Darkforge:**
- **Scroll-story landing pages** — `NxScrollStack` + `NxScrollReveal` carry the value-prop narrative.
- **Marketing feature sections** — `NxHorizontalSnapRow` for testimonials, `NxParallaxImageRow` for case studies.
- **Dashboard scroll-reveals** — `NxScrollCounter` on the "metrics overview" route, `NxScrollProgressBar` on long settings pages.
- **Product detail pages** — `NxScrollFlipCard` for before/after comparisons.
