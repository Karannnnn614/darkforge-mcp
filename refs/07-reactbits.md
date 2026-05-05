# Darkforge — ReactBits Dark Reference
ReactBits (reactbits.dev, by David Haz) is a copy-paste collection of animated text components, scroll/pointer effects, and lightweight interactive backgrounds. Its hallmark is **drop-in animated typography** (split, decrypt, shimmer, rotate) and **pointer-reactive surfaces** (magnet, click spark, star border) — perfect for hero sections, CTAs, and feature reveals in Darkforge.

## Contents

- [Source-of-truth caveat](#source-of-truth-caveat)
- [Install / Setup](#install-setup)
- [Animated Text: Split Text Reveal](#animated-text-split-text-reveal)
- [Animated Text: Gradient Text Shimmer](#animated-text-gradient-text-shimmer)
- [Animated Text: Decrypted Text](#animated-text-decrypted-text)
- [Animated Text: Shiny Text](#animated-text-shiny-text)
- [Animated Text: Rotating Text](#animated-text-rotating-text)
- [Animated Text: Count Up](#animated-text-count-up)
- [Animated Text: Variable Proximity](#animated-text-variable-proximity)
- [Interactive: Magnet (Pointer Attraction)](#interactive-magnet-pointer-attraction)
- [Interactive: Star Border](#interactive-star-border)
- [Interactive: Click Spark](#interactive-click-spark)
- [Backgrounds: Aurora](#backgrounds-aurora)
- [Backgrounds: Particles](#backgrounds-particles)
- [Common Gotchas](#common-gotchas)
- [Cross-References](#cross-references)

---

## Source-of-truth caveat

> **Read this before copying.** ReactBits is a less-universally-documented library than shadcn or MagicUI, and the components below are reconstructed from training-data familiarity with the **visual behavior + typical implementation patterns**, not a guaranteed 1:1 port of the library's current API.
>
> **What is reasonably faithful:** the visual effect, the underlying technique (GSAP, framer-motion, IntersectionObserver, canvas, CSS gradient sweep), and prop **shape**.
>
> **What you must verify against reactbits.dev before publishing:**
> - Exact prop names (e.g. `delay` vs `staggerDelay`, `duration` vs `animationDuration`).
> - Whether the component is shipped as **GSAP-based** (most ReactBits text effects) or **framer-motion-based**.
> - Default values (the upstream defaults may differ from ours).
> - Whether the upstream component exposes `className`, `style`, or both.
>
> Throughout this file, `// VERIFY:` comments mark every prop name or behavior you should sanity-check against the live source. Treat these as **Darkforge-flavored patterns inspired by ReactBits**, retokenized to AMOLED + neon, not a literal mirror.
>
> If a component you need is missing, prefer the upstream snippet and just retoken with `var(--df-*)` per `00-dark-tokens.md`.

---

## Install / Setup

ReactBits is **copy-paste, not a package**. You install only the runtime peers each component uses.

```bash
# Most text-animation components use GSAP
pnpm add gsap

# A subset (rotating text, scroll velocity) often use framer-motion
pnpm add framer-motion

# Class-merging utility (used everywhere in Darkforge)
pnpm add clsx tailwind-merge
```

```ts
// lib/cn.ts — used by every component below
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

```css
/* Append to your global CSS after the :root tokens from 00-dark-tokens.md */

@keyframes nx-shimmer-sweep {
  0%   { background-position: -200% 0; }
  100% { background-position:  200% 0; }
}

@keyframes nx-aurora {
  0%, 100% { transform: translate3d(0, 0, 0) rotate(0deg); }
  50%      { transform: translate3d(-2%, 1%, 0) rotate(180deg); }
}

@keyframes nx-rotate-in {
  from { opacity: 0; transform: translateY(0.6em); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes nx-star-border-rotate {
  to { --df-star-angle: 360deg; }
}

@property --df-star-angle {
  syntax: '<angle>';
  inherits: false;
  initial-value: 0deg;
}

@media (prefers-reduced-motion: reduce) {
  [data-nx-animated] {
    animation: none !important;
    transition: none !important;
  }
}
```

---

## Animated Text: Split Text Reveal

**When to use:** Hero headlines, section titles where you want each character to "land" on scroll-in.

```tsx
'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/cn'

interface SplitTextProps {
  text: string
  className?: string
  // VERIFY: upstream may call this `delay` or `staggerDelay`
  staggerMs?: number
  durationMs?: number
  /** 'words' splits per word; 'chars' splits per character */
  splitBy?: 'chars' | 'words'
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span'
}

/**
 * Split-text reveal — letter or word level.
 * Pure CSS + IntersectionObserver (no GSAP dep) so it ships small.
 */
export function SplitText({
  text,
  className,
  staggerMs = 40,
  durationMs = 600,
  splitBy = 'chars',
  as: Tag = 'h1',
}: SplitTextProps) {
  const rootRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const el = rootRef.current
    if (!el) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      el.querySelectorAll<HTMLElement>('[data-nx-split]').forEach((s) => {
        s.style.opacity = '1'
        s.style.transform = 'none'
      })
      return
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          el.querySelectorAll<HTMLElement>('[data-nx-split]').forEach((piece, i) => {
            piece.style.transitionDelay = `${i * staggerMs}ms`
            piece.style.opacity = '1'
            piece.style.transform = 'translateY(0)'
          })
          io.disconnect()
        })
      },
      { threshold: 0.3 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [staggerMs, text])

  const pieces = splitBy === 'chars' ? Array.from(text) : text.split(/(\s+)/)

  return (
    <Tag
      ref={rootRef as React.RefObject<HTMLHeadingElement>}
      className={cn(
        'inline-block leading-[1.05] tracking-tight',
        'text-[var(--df-text-primary)]',
        className,
      )}
      data-nx-animated
      aria-label={text}
    >
      {pieces.map((piece, i) =>
        piece === ' ' ? (
          <span key={i}>&nbsp;</span>
        ) : (
          <span
            key={i}
            data-nx-split
            aria-hidden="true"
            style={{
              display: 'inline-block',
              opacity: 0,
              transform: 'translateY(0.4em)',
              transition: `opacity ${durationMs}ms var(--df-ease-out), transform ${durationMs}ms var(--df-ease-out)`,
              willChange: 'opacity, transform',
            }}
          >
            {piece}
          </span>
        ),
      )}
    </Tag>
  )
}
```

**Knobs:** `staggerMs` (per-piece offset), `durationMs` (per-piece run), `splitBy: 'chars' | 'words'`, `as` (tag).

---

## Animated Text: Gradient Text Shimmer

**When to use:** A single high-intent word in a hero ("**Ship** faster"). Uses DF neon trio.

```tsx
'use client'

import { cn } from '@/lib/cn'

interface GradientTextProps {
  children: React.ReactNode
  className?: string
  // VERIFY: upstream prop names may differ
  speedSec?: number
  /** Custom 3-stop gradient; defaults to DF violet → cyan → pink */
  colors?: [string, string, string]
}

export function GradientText({
  children,
  className,
  speedSec = 4,
  colors = [
    'var(--df-neon-violet)',
    'var(--df-neon-cyan)',
    'var(--df-neon-pink)',
  ],
}: GradientTextProps) {
  const gradient = `linear-gradient(90deg, ${colors[0]}, ${colors[1]}, ${colors[2]}, ${colors[0]})`
  return (
    <span
      data-nx-animated
      className={cn('inline-block font-semibold', className)}
      style={{
        backgroundImage: gradient,
        backgroundSize: '200% auto',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        animation: `nx-shimmer-sweep ${speedSec}s linear infinite`,
      }}
    >
      {children}
    </span>
  )
}
```

**Knobs:** `speedSec`, `colors` (any 3 DF neons).

---

## Animated Text: Decrypted Text

**When to use:** Code-themed pages, terminals, "loading" hero copy. Matrix-style decode from random glyphs to the real string.

```tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/cn'

interface DecryptedTextProps {
  text: string
  className?: string
  // VERIFY: upstream may expose `speed`, `maxIterations`, etc. with different names
  durationMs?: number
  /** Glyph pool used during the scramble */
  glyphs?: string
  /** Trigger: 'mount' | 'hover' | 'view' */
  trigger?: 'mount' | 'hover' | 'view'
}

const DEFAULT_GLYPHS = '!<>-_\\/[]{}—=+*^?#________01'

export function DecryptedText({
  text,
  className,
  durationMs = 1200,
  glyphs = DEFAULT_GLYPHS,
  trigger = 'view',
}: DecryptedTextProps) {
  const [display, setDisplay] = useState(() => text.replace(/\S/g, ' '))
  const ref = useRef<HTMLSpanElement | null>(null)
  const startedRef = useRef(false)

  const rafRef = useRef(0)

  function run(): () => void {
    if (startedRef.current) return () => {}
    startedRef.current = true

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      setDisplay(text)
      return () => {}
    }

    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs)
      const out = Array.from(text).map((ch, i) => {
        if (ch === ' ') return ' '
        const reveal = i / text.length
        return t > reveal
          ? ch
          : glyphs[Math.floor(Math.random() * glyphs.length)]
      })
      setDisplay(out.join(''))
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }

  useEffect(() => {
    let cancel: (() => void) | undefined
    if (trigger === 'mount') {
      cancel = run()
      return () => cancel?.()
    }
    if (trigger !== 'view') return
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && (cancel = run())),
      { threshold: 0.4 },
    )
    io.observe(el)
    return () => {
      io.disconnect()
      cancel?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger, text])

  return (
    <span
      ref={ref}
      data-nx-animated
      aria-label={text}
      onMouseEnter={trigger === 'hover' ? run : undefined}
      className={cn(
        'font-mono tabular-nums',
        'text-[var(--df-text-primary)]',
        className,
      )}
      style={{ fontFamily: 'var(--df-font-mono)' }}
    >
      {display}
    </span>
  )
}
```

**Knobs:** `durationMs`, `glyphs` (custom alphabet), `trigger` (mount, hover, or view).

---

## Animated Text: Shiny Text

**When to use:** Subtitle taglines, badge copy, "New" pill labels. Subtle moving highlight.

```tsx
'use client'

import { cn } from '@/lib/cn'

interface ShinyTextProps {
  children: React.ReactNode
  className?: string
  // VERIFY: upstream may name this `speed` or `duration`
  speedSec?: number
  /** Color of the moving highlight; defaults to white */
  shineColor?: string
}

export function ShinyText({
  children,
  className,
  speedSec = 3,
  shineColor = 'rgba(255,255,255,0.85)',
}: ShinyTextProps) {
  return (
    <span
      data-nx-animated
      className={cn('inline-block', className)}
      style={{
        color: 'var(--df-text-secondary)',
        backgroundImage: `linear-gradient(120deg, transparent 30%, ${shineColor} 50%, transparent 70%)`,
        backgroundSize: '200% 100%',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        animation: `nx-shimmer-sweep ${speedSec}s linear infinite`,
      }}
    >
      {children}
    </span>
  )
}
```

**Knobs:** `speedSec`, `shineColor`.

---

## Animated Text: Rotating Text

**When to use:** "Ship **faster / safer / smarter**" headlines that cycle.

```tsx
'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/cn'

interface RotatingTextProps {
  // VERIFY: upstream prop name may be `texts`, `words`, or `phrases`
  words: string[]
  className?: string
  intervalMs?: number
  /** Token from DF neon set */
  accentColor?: string
}

export function RotatingText({
  words,
  className,
  intervalMs = 2200,
  accentColor = 'var(--df-neon-violet)',
}: RotatingTextProps) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (words.length < 2) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return
    const id = window.setInterval(
      () => setIndex((i) => (i + 1) % words.length),
      intervalMs,
    )
    return () => window.clearInterval(id)
  }, [intervalMs, words.length])

  // Reserve width using the longest word so layout doesn't jitter on rotate.
  const longest = words.reduce((a, b) => (a.length > b.length ? a : b), '')

  return (
    <span
      data-nx-animated
      // Decorative cycling — read once via aria-label, not per-rotation.
      aria-label={words.join(', ')}
      className={cn(
        'relative inline-flex h-[1.1em] overflow-hidden align-baseline',
        className,
      )}
    >
      {/* Visible (animated) word */}
      <span
        key={index}
        aria-hidden="true"
        className="absolute left-0 top-0 whitespace-nowrap font-semibold"
        style={{
          color: accentColor,
          animation: 'nx-rotate-in 400ms var(--df-ease-out) both',
        }}
      >
        {words[index]}
      </span>
      {/* Width reservation only (invisible) */}
      <span aria-hidden="true" className="invisible whitespace-nowrap font-semibold">
        {longest}
      </span>
    </span>
  )
}
```

**Knobs:** `intervalMs`, `accentColor`. Words list drives layout reservation automatically.

---

## Animated Text: Count Up

**When to use:** Stat sections, "10,000+ users", landing-page social proof.

```tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/cn'

interface CountUpProps {
  // VERIFY: upstream may use `end` / `from` / `to` naming
  to: number
  from?: number
  durationMs?: number
  decimals?: number
  prefix?: string
  suffix?: string
  className?: string
}

function easeOutQuart(t: number) {
  return 1 - Math.pow(1 - t, 4)
}

export function CountUp({
  to,
  from = 0,
  durationMs = 1600,
  decimals = 0,
  prefix = '',
  suffix = '',
  className,
}: CountUpProps) {
  const [value, setValue] = useState(from)
  const ref = useRef<HTMLSpanElement | null>(null)
  const startedRef = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting || startedRef.current) return
          startedRef.current = true

          const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
          if (reduced) {
            setValue(to)
            return
          }

          const start = performance.now()
          let raf = 0
          const tick = (now: number) => {
            const t = Math.min(1, (now - start) / durationMs)
            const eased = easeOutQuart(t)
            setValue(from + (to - from) * eased)
            if (t < 1) raf = requestAnimationFrame(tick)
          }
          raf = requestAnimationFrame(tick)
        })
      },
      { threshold: 0.5 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [from, to, durationMs])

  const formatted = value.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })

  return (
    <span
      ref={ref}
      data-nx-animated
      className={cn(
        'tabular-nums font-semibold',
        'text-[var(--df-text-primary)]',
        className,
      )}
    >
      {prefix}
      {formatted}
      {suffix}
    </span>
  )
}
```

**Knobs:** `to`, `from`, `durationMs`, `decimals`, `prefix`, `suffix`.

---

## Animated Text: Variable Proximity

**When to use:** Hero headlines using a variable font (Inter Variable, Geist Variable). Each letter's weight is driven by its distance from the cursor — heavier near, lighter far.

> **Confidence note:** the visual technique (variable-font weight axis × pointer distance) is solid. Upstream prop names — likely `radius`, `falloff`, `containerRef` — are **not verified**; lean on the `// VERIFY:` comments and tweak after diffing against reactbits.dev.

```tsx
'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/cn'

interface VariableProximityProps {
  text: string
  className?: string
  // VERIFY: upstream may use different names (radius / falloffDistance / fromFontVariationSettings)
  /** Activation radius in px from cursor */
  radius?: number
  /** Font weight at cursor (max) */
  weightNear?: number
  /** Font weight at radius edge (min) */
  weightFar?: number
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span'
}

/**
 * Each letter's font-weight axis is interpolated by its distance from the pointer.
 * Requires a variable font that exposes the `wght` axis (Inter Variable, Geist Variable, etc.).
 */
export function VariableProximity({
  text,
  className,
  radius = 160,
  weightNear = 800,
  weightFar = 200,
  as: Tag = 'h1',
}: VariableProximityProps) {
  const rootRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return

    const letters = Array.from(
      root.querySelectorAll<HTMLSpanElement>('[data-nx-letter]'),
    )

    let raf = 0
    let pointerX = -9999
    let pointerY = -9999

    function onMove(e: PointerEvent) {
      pointerX = e.clientX
      pointerY = e.clientY
    }

    function onLeave() {
      pointerX = -9999
      pointerY = -9999
    }

    function loop() {
      letters.forEach((letter) => {
        const rect = letter.getBoundingClientRect()
        const cx = rect.left + rect.width / 2
        const cy = rect.top + rect.height / 2
        const dist = Math.hypot(pointerX - cx, pointerY - cy)
        const t = Math.max(0, Math.min(1, 1 - dist / radius))
        const weight = Math.round(weightFar + (weightNear - weightFar) * t)
        letter.style.fontVariationSettings = `"wght" ${weight}`
      })
      raf = requestAnimationFrame(loop)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerleave', onLeave)
    raf = requestAnimationFrame(loop)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerleave', onLeave)
      cancelAnimationFrame(raf)
    }
  }, [radius, weightNear, weightFar])

  return (
    <Tag
      ref={rootRef as React.RefObject<HTMLHeadingElement>}
      data-nx-animated
      aria-label={text}
      className={cn(
        'inline-block leading-[1.05] tracking-tight',
        'text-[var(--df-text-primary)]',
        className,
      )}
      style={{
        // Variable font with `wght` axis required.
        fontFamily: 'var(--df-font-sans)',
      }}
    >
      {Array.from(text).map((ch, i) =>
        ch === ' ' ? (
          <span key={i}>&nbsp;</span>
        ) : (
          <span
            key={i}
            data-nx-letter
            aria-hidden="true"
            style={{
              display: 'inline-block',
              fontVariationSettings: `"wght" ${weightFar}`,
              transition: 'font-variation-settings 80ms linear',
              willChange: 'font-variation-settings',
            }}
          >
            {ch}
          </span>
        ),
      )}
    </Tag>
  )
}
```

**Knobs:** `radius`, `weightNear`, `weightFar`, `as`. Pair with Inter Variable or Geist Variable — non-variable fonts will silently no-op the axis.

---

## Interactive: Magnet (Pointer Attraction)

**When to use:** Wrap any CTA button or icon. Pulls toward the cursor inside a radius.

```tsx
'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/cn'

interface MagnetProps {
  children: React.ReactNode
  className?: string
  // VERIFY: upstream prop names may be `padding` / `magnetStrength`
  /** Activation radius in px (distance from element center) */
  radius?: number
  /** 0-1: how strongly to follow the cursor */
  strength?: number
}

export function Magnet({
  children,
  className,
  radius = 220,
  strength = 0.35,
}: MagnetProps) {
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return

    let raf = 0
    let targetX = 0
    let targetY = 0
    let curX = 0
    let curY = 0

    function loop() {
      curX += (targetX - curX) * 0.18
      curY += (targetY - curY) * 0.18
      el!.style.transform = `translate3d(${curX}px, ${curY}px, 0)`
      raf = requestAnimationFrame(loop)
    }

    function onMove(e: PointerEvent) {
      const rect = el!.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const dx = e.clientX - cx
      const dy = e.clientY - cy
      const dist = Math.hypot(dx, dy)
      if (dist < radius) {
        const f = (1 - dist / radius) * strength
        targetX = dx * f
        targetY = dy * f
      } else {
        targetX = 0
        targetY = 0
      }
    }

    function onLeave() {
      targetX = 0
      targetY = 0
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerleave', onLeave)
    raf = requestAnimationFrame(loop)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerleave', onLeave)
      cancelAnimationFrame(raf)
    }
  }, [radius, strength])

  return (
    <div
      ref={ref}
      data-nx-animated
      className={cn('inline-block will-change-transform', className)}
      style={{ transition: 'transform 200ms var(--df-ease-out)' }}
    >
      {children}
    </div>
  )
}
```

**Knobs:** `radius` (activation distance), `strength` (0-1 follow force).

---

## Interactive: Star Border

**When to use:** Premium CTA / pricing card / "AI" badge — a rotating conic gradient ring.

```tsx
'use client'

import { CSSProperties } from 'react'
import { cn } from '@/lib/cn'

interface StarBorderProps {
  children: React.ReactNode
  className?: string
  // VERIFY: upstream prop is often `color` / `speed`
  speedSec?: number
  /** Two-color sweep (defaults to DF violet + cyan) */
  colors?: [string, string]
  thickness?: number
  radius?: string
}

export function StarBorder({
  children,
  className,
  speedSec = 6,
  colors = ['var(--df-neon-violet)', 'var(--df-neon-cyan)'],
  thickness = 1,
  radius = 'var(--df-radius-lg)',
}: StarBorderProps) {
  const wrapStyle: CSSProperties = {
    '--df-star-angle': '0deg',
    background: `conic-gradient(from var(--df-star-angle), ${colors[0]}, ${colors[1]}, ${colors[0]})`,
    padding: thickness,
    borderRadius: radius,
    animation: `nx-star-border-rotate ${speedSec}s linear infinite`,
  } as CSSProperties

  return (
    <div data-nx-animated className={cn('inline-block', className)} style={wrapStyle}>
      <div
        style={{
          background: 'var(--df-bg-surface)',
          borderRadius: `calc(${radius} - ${thickness}px)`,
          color: 'var(--df-text-primary)',
        }}
      >
        {children}
      </div>
    </div>
  )
}
```

**Knobs:** `speedSec`, `colors`, `thickness`, `radius`. Pair with `Magnet` for ultimate CTA.

---

## Interactive: Click Spark

**When to use:** Global pointer feedback. Wrap a section, every click bursts particles.

```tsx
'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/cn'

interface ClickSparkProps {
  children: React.ReactNode
  className?: string
  // VERIFY: upstream may be `sparkColor`, `sparkCount`, etc.
  color?: string
  count?: number
  durationMs?: number
  spread?: number
}

interface Spark {
  x: number
  y: number
  vx: number
  vy: number
  born: number
}

export function ClickSpark({
  children,
  className,
  color = 'var(--df-neon-violet)',
  count = 10,
  durationMs = 500,
  spread = 60,
}: ClickSparkProps) {
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const sparks = useRef<Spark[]>([])

  useEffect(() => {
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    if (!wrap || !canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resolved = getComputedStyle(wrap).getPropertyValue('--df-spark-color').trim() || color

    function resize() {
      const rect = wrap!.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      canvas!.width = rect.width * dpr
      canvas!.height = rect.height * dpr
      canvas!.style.width = `${rect.width}px`
      canvas!.style.height = `${rect.height}px`
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    function spawn(e: PointerEvent) {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (reduced) return
      const rect = wrap!.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const now = performance.now()
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2
        sparks.current.push({
          x,
          y,
          vx: Math.cos(angle) * (spread / (durationMs / 16)),
          vy: Math.sin(angle) * (spread / (durationMs / 16)),
          born: now,
        })
      }
    }

    let raf = 0
    function loop(now: number) {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height)
      sparks.current = sparks.current.filter((s) => now - s.born < durationMs)
      sparks.current.forEach((s) => {
        const t = (now - s.born) / durationMs
        const a = 1 - t
        ctx!.strokeStyle = resolved
        ctx!.globalAlpha = a
        ctx!.lineWidth = 2
        ctx!.beginPath()
        ctx!.moveTo(s.x, s.y)
        ctx!.lineTo(s.x + s.vx * 8 * a, s.y + s.vy * 8 * a)
        ctx!.stroke()
        s.x += s.vx
        s.y += s.vy
      })
      ctx!.globalAlpha = 1
      raf = requestAnimationFrame(loop)
    }

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(wrap)
    wrap.addEventListener('pointerdown', spawn)
    raf = requestAnimationFrame(loop)
    return () => {
      ro.disconnect()
      wrap.removeEventListener('pointerdown', spawn)
      cancelAnimationFrame(raf)
    }
  }, [color, count, durationMs, spread])

  return (
    <div
      ref={wrapRef}
      data-nx-animated
      className={cn('relative', className)}
      style={{ ['--df-spark-color' as string]: color }}
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
      />
      {children}
    </div>
  )
}
```

**Knobs:** `color`, `count`, `durationMs`, `spread`.

---

## Backgrounds: Aurora

**When to use:** Hero / pricing section background. Animated rotating neon blobs.

```tsx
'use client'

import { cn } from '@/lib/cn'

interface AuroraProps {
  className?: string
  // VERIFY: upstream may expose `colors`, `speed`, `blend`
  intensity?: 'subtle' | 'medium' | 'strong'
}

const intensityMap = {
  subtle: { violet: 0.15, cyan: 0.10, pink: 0.08, blur: 80 },
  medium: { violet: 0.28, cyan: 0.18, pink: 0.14, blur: 100 },
  strong: { violet: 0.45, cyan: 0.30, pink: 0.22, blur: 120 },
} as const

export function Aurora({ className, intensity = 'medium' }: AuroraProps) {
  const cfg = intensityMap[intensity]
  return (
    <div
      data-nx-animated
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute inset-0 overflow-hidden',
        className,
      )}
      style={{ background: 'var(--df-bg-base)' }}
    >
      <div
        className="absolute inset-[-25%]"
        style={{
          background: `
            radial-gradient(60% 60% at 20% 30%, rgba(167,139,250,${cfg.violet}) 0%, transparent 70%),
            radial-gradient(50% 50% at 80% 20%, rgba(34,211,238,${cfg.cyan}) 0%, transparent 70%),
            radial-gradient(55% 55% at 60% 80%, rgba(244,114,182,${cfg.pink}) 0%, transparent 70%)
          `,
          filter: `blur(${cfg.blur}px)`,
          animation: 'nx-aurora 18s ease-in-out infinite',
        }}
      />
      {/* Vignette so edges feel deep */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 50%, var(--df-bg-base) 100%)',
        }}
      />
    </div>
  )
}
```

**Knobs:** `intensity` (subtle / medium / strong).

---

## Backgrounds: Particles

**When to use:** Lightweight ambient bg behind hero. Far cheaper than tsParticles.

```tsx
'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/cn'

interface ParticlesProps {
  className?: string
  // VERIFY: upstream prop names may be `quantity`, `staticity`
  count?: number
  color?: string
  speed?: number
}

interface P {
  x: number
  y: number
  vx: number
  vy: number
  r: number
}

export function Particles({
  className,
  count = 60,
  color = 'rgba(167,139,250,0.7)',
  speed = 0.25,
}: ParticlesProps) {
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    if (!wrap || !canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let w = 0
    let h = 0
    let particles: P[] = []
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    function resize() {
      const rect = wrap!.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      w = rect.width
      h = rect.height
      canvas!.width = w * dpr
      canvas!.height = h * dpr
      canvas!.style.width = `${w}px`
      canvas!.style.height = `${h}px`
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * speed,
        vy: (Math.random() - 0.5) * speed,
        r: Math.random() * 1.4 + 0.4,
      }))
    }

    let raf = 0
    function loop() {
      ctx!.clearRect(0, 0, w, h)
      ctx!.fillStyle = color
      particles.forEach((p) => {
        if (!reduced) {
          p.x += p.vx
          p.y += p.vy
          if (p.x < 0 || p.x > w) p.vx *= -1
          if (p.y < 0 || p.y > h) p.vy *= -1
        }
        ctx!.beginPath()
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx!.fill()
      })
      raf = requestAnimationFrame(loop)
    }

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(wrap)
    raf = requestAnimationFrame(loop)
    return () => {
      ro.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [count, color, speed])

  return (
    <div
      ref={wrapRef}
      data-nx-animated
      aria-hidden="true"
      className={cn('absolute inset-0 overflow-hidden', className)}
    >
      <canvas ref={canvasRef} className="block" />
    </div>
  )
}
```

**Knobs:** `count`, `color`, `speed`.

---

## Common Gotchas

1. **SSR + `window` access.** Every effect here is wrapped in `useEffect`, so it runs only on the client. Do **not** add `'use client'` to a parent that calls `Particles` from a server component prop — pass it through a child boundary.
2. **`ResizeObserver` on hidden tabs.** When a containing tab/drawer is `display: none`, the observer never fires and canvas stays at zero size. After showing, force a resize: `el.dispatchEvent(new Event('resize'))` or remount with `key={visible}`.
3. **`pointer-events: none` on overlays.** `Aurora`, `Squares`, and `Particles` are absolute-positioned overlays. They include `aria-hidden` and (where applicable) `pointer-events: none` so they don't steal clicks from `Magnet` / CTAs sitting above. Order matters: render the bg first, content second, so z-stacking is correct.
4. **Long-text performance with `SplitText`.** A 200-char string yields 200 spans + 200 transitions. Cap to titles only; for paragraphs use a single fade-in instead.
5. **Reduced motion.** Every component checks `prefers-reduced-motion: reduce` and either disables the animation or jumps to the final state. Verify on macOS System Settings → Accessibility → Display → Reduce motion before shipping.

---

## Cross-References

- **Hero pattern** (`patterns/hero.md`): combine `Aurora` (bg) + `SplitText` or `VariableProximity` (headline) + `GradientText` (highlighted word) + `Magnet`-wrapped CTA.
- **CTA section**: `StarBorder` around the primary button with `Magnet` outside it; `ClickSpark` on the section wrapper.
- **Features grid**: `Particles` background + `CountUp` on stat numbers + `ShinyText` on tags.
- **Pricing**: `StarBorder` to crown the recommended tier; `RotatingText` in the headline ("Built for **startups / teams / enterprises**").
- **Code/dev landing**: `DecryptedText` for the hero subtitle; `Particles` background.
- **Foundation**: every component uses `var(--df-*)` tokens from `00-dark-tokens.md`. Skeleton loading states for any of these surfaces should follow `17-skeleton-system.md`.
