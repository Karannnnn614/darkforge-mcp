---
name: 31-mojs-bursts
description: Mo.js — burst, confetti, celebration micro-interactions. Like-button explosions, achievement unlocks, click delights. Unique niche — no overlap with other Darkforge references. Use when user wants celebration / delight moments.
---

# Mo.js — Burst & Celebration Effects

> **Burst/celebration micro-interactions.** Like-button explosions, confetti, achievement unlocks, follow-button celebrations. Unique niche — no other Darkforge reference covers this. Darkforge v1.0 had zero coverage for "things that explode out of an element on click".

## Source-of-truth caveat

Generated from training-data recall (Jan 2026 cutoff). `context7` + `WebFetch` were denied at generation time. Mo.js v1.x is stable but small community — package name `@mojs/core`. `// VERIFY:` markers flag prop signatures most likely to drift. Cross-check `https://mojs.github.io` before shipping.

## Contents

- [Install / Setup](#install--setup)
- [DF color resolution for canvas](#nx-color-resolution-for-canvas)
- [Worked examples](#worked-examples)
- [Reduced-motion handling (REQUIRED on every burst)](#reduced-motion-handling-required-on-every-burst)
- [Pitfalls](#pitfalls)
- [Cross-references](#cross-references)

---

## Install / Setup

```bash
npm i @mojs/core
# VERIFY: package name is @mojs/core in current docs.
# Older versions used `mo-js` — different package, deprecated.
```

```tsx
import mojs from '@mojs/core'
```

## DF color resolution for canvas

Mo.js renders to canvas, which doesn't resolve CSS variables. We need to read computed CSS to get hex values for burst colors.

```ts
function readNxBurstPalette() {
  if (typeof window === 'undefined') return { violet: '#a78bfa', cyan: '#22d3ee', pink: '#f472b6', emerald: '#4ade80', amber: '#fbbf24' }
  const style = getComputedStyle(document.documentElement)
  return {
    violet: style.getPropertyValue('--df-neon-violet').trim() || '#a78bfa',
    cyan: style.getPropertyValue('--df-neon-cyan').trim() || '#22d3ee',
    pink: style.getPropertyValue('--df-neon-pink').trim() || '#f472b6',
    emerald: style.getPropertyValue('--df-neon-emerald').trim() || '#4ade80',
    amber: style.getPropertyValue('--df-neon-amber').trim() || '#fbbf24',
  }
}

function isReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
```

Use these helpers in every burst component below.

## Worked examples

### 1. Like button burst (heart + violet/pink particles)

```tsx
'use client'
import { useRef, useState } from 'react'
import mojs from '@mojs/core'

export function LikeButton() {
  const ref = useRef<HTMLButtonElement>(null)
  const burstRef = useRef<any>(null)
  const [liked, setLiked] = useState(false)

  const onLike = () => {
    setLiked(!liked)
    if (isReducedMotion()) return // skip burst entirely

    if (!burstRef.current && ref.current) {
      const palette = readNxBurstPalette()
      // VERIFY: mojs.Burst constructor signature in v1.x.
      burstRef.current = new mojs.Burst({
        parent: ref.current,
        radius: { 0: 80 },
        count: 12,
        children: {
          shape: 'circle',
          fill: [palette.violet, palette.pink, palette.cyan],
          radius: { 8: 0 },
          duration: 600,
          easing: 'cubic.out',
        },
      })
    }
    burstRef.current?.replay()
  }

  return (
    <button
      ref={ref}
      onClick={onLike}
      aria-label={liked ? 'Unlike' : 'Like'}
      aria-pressed={liked}
      style={{
        position: 'relative',
        background: 'transparent',
        border: 0,
        fontSize: 28,
        cursor: 'pointer',
        color: liked ? 'var(--df-neon-pink)' : 'var(--df-text-secondary)',
        transition: 'color 200ms',
      }}
    >
      {liked ? '♥' : '♡'}
    </button>
  )
}
```

### 2. Confetti celebration

```tsx
'use client'
import { useRef } from 'react'
import mojs from '@mojs/core'

export function ConfettiButton() {
  const ref = useRef<HTMLButtonElement>(null)

  const celebrate = () => {
    if (isReducedMotion() || !ref.current) return
    const palette = readNxBurstPalette()
    new mojs.Burst({
      parent: ref.current,
      radius: { 0: 120 },
      count: 24,
      angle: { 0: 360 },
      children: {
        shape: ['rect', 'circle', 'polygon'],
        fill: [palette.violet, palette.cyan, palette.emerald, palette.amber],
        radius: 6,
        duration: 1200,
        easing: 'quad.out',
        rotate: { 0: 720 },
      },
    }).replay()
  }

  return (
    <button
      ref={ref}
      onClick={celebrate}
      aria-label="Celebrate"
      style={{
        padding: '14px 28px',
        background: 'var(--df-neon-violet)',
        color: '#000',
        border: 0,
        borderRadius: 'var(--df-radius-md)',
        fontWeight: 600,
        cursor: 'pointer',
        boxShadow: 'var(--df-glow-violet)',
      }}
    >
      🎉 Celebrate
    </button>
  )
}
```

### 3. Achievement unlock (radial burst with glow)

```tsx
'use client'
import { useEffect, useRef } from 'react'
import mojs from '@mojs/core'

export function AchievementUnlock() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isReducedMotion() || !ref.current) return
    const palette = readNxBurstPalette()

    new mojs.Burst({
      parent: ref.current,
      radius: { 0: 100 },
      count: 16,
      children: {
        shape: 'line',
        stroke: palette.amber,
        strokeWidth: { 4: 0 },
        radius: 30,
        duration: 800,
        easing: 'cubic.out',
      },
    }).play()
  }, [])

  return (
    <div
      ref={ref}
      role="status"
      aria-label="Achievement unlocked"
      style={{
        position: 'relative',
        padding: 24,
        background: 'var(--df-glass-bg)',
        border: '1px solid var(--df-neon-amber)',
        borderRadius: 'var(--df-radius-lg)',
        boxShadow: '0 0 24px rgba(251, 191, 36, 0.4)',
        textAlign: 'center',
      }}
    >
      <p style={{ color: 'var(--df-text-primary)', margin: 0 }}>🏆 Achievement unlocked</p>
    </div>
  )
}
```

### 4. Follow button (cyan particles)

```tsx
'use client'
import { useRef, useState } from 'react'
import mojs from '@mojs/core'

export function FollowButton() {
  const ref = useRef<HTMLButtonElement>(null)
  const burst = useRef<any>(null)
  const [following, setFollowing] = useState(false)

  const onFollow = () => {
    setFollowing(!following)
    if (isReducedMotion() || !ref.current) return
    if (!burst.current) {
      const palette = readNxBurstPalette()
      burst.current = new mojs.Burst({
        parent: ref.current,
        radius: { 0: 60 },
        count: 8,
        children: {
          shape: 'polygon',
          points: 5,
          fill: palette.cyan,
          radius: 6,
          duration: 500,
          easing: 'cubic.out',
        },
      })
    }
    if (!following) burst.current.replay()
  }

  return (
    <button
      ref={ref}
      onClick={onFollow}
      aria-pressed={following}
      style={{
        position: 'relative',
        padding: '8px 20px',
        background: following ? 'var(--df-glass-bg)' : 'var(--df-neon-cyan)',
        color: following ? 'var(--df-text-primary)' : '#000',
        border: following ? '1px solid var(--df-glass-border)' : 0,
        borderRadius: 'var(--df-radius-md)',
        fontWeight: 600,
        cursor: 'pointer',
      }}
    >
      {following ? 'Following' : 'Follow'}
    </button>
  )
}
```

### 5. Star rating burst

```tsx
'use client'
import { useRef, useState } from 'react'
import mojs from '@mojs/core'

export function StarRating() {
  const refs = useRef<Array<HTMLButtonElement | null>>([])
  const [rating, setRating] = useState(0)

  const onStar = (index: number) => {
    setRating(index + 1)
    if (isReducedMotion() || !refs.current[index]) return
    const palette = readNxBurstPalette()
    new mojs.Burst({
      parent: refs.current[index]!,
      radius: { 0: 40 },
      count: 6,
      children: {
        shape: 'circle',
        fill: palette.amber,
        radius: 4,
        duration: 400,
        easing: 'cubic.out',
      },
    }).replay()
  }

  return (
    <div role="radiogroup" aria-label="Rating" style={{ display: 'flex', gap: 4 }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <button
          key={i}
          ref={(el) => { refs.current[i] = el }}
          onClick={() => onStar(i)}
          role="radio"
          aria-checked={rating === i + 1}
          aria-label={`${i + 1} stars`}
          style={{
            position: 'relative',
            background: 'transparent',
            border: 0,
            fontSize: 24,
            cursor: 'pointer',
            color: i < rating ? 'var(--df-neon-amber)' : 'var(--df-text-tertiary)',
          }}
        >
          ★
        </button>
      ))}
    </div>
  )
}
```

### 6. Cursor click ripple

```tsx
'use client'
import { useEffect } from 'react'
import mojs from '@mojs/core'

export function CursorRipple() {
  useEffect(() => {
    if (isReducedMotion()) return

    const onClick = (e: MouseEvent) => {
      const palette = readNxBurstPalette()
      const ripple = document.createElement('span')
      ripple.style.position = 'fixed'
      ripple.style.left = `${e.clientX}px`
      ripple.style.top = `${e.clientY}px`
      ripple.style.pointerEvents = 'none'
      ripple.style.zIndex = '9999'
      document.body.appendChild(ripple)

      new mojs.Shape({
        parent: ripple,
        shape: 'circle',
        radius: { 0: 60 },
        stroke: palette.violet,
        strokeWidth: { 3: 0 },
        fill: 'none',
        duration: 600,
        easing: 'cubic.out',
        onComplete: () => ripple.remove(),
      }).play()
    }

    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  return null
}
```

### 7. Score increment with burst

```tsx
'use client'
import { useRef, useState } from 'react'
import mojs from '@mojs/core'

export function ScoreCounter() {
  const ref = useRef<HTMLSpanElement>(null)
  const [score, setScore] = useState(0)

  const increment = () => {
    setScore(score + 1)
    if (isReducedMotion() || !ref.current) return
    const palette = readNxBurstPalette()
    new mojs.Burst({
      parent: ref.current,
      radius: { 0: 50 },
      count: 8,
      children: {
        shape: 'circle',
        fill: palette.emerald,
        radius: 4,
        duration: 500,
      },
    }).replay()
  }

  return (
    <button onClick={increment} style={{ background: 'transparent', border: 0, cursor: 'pointer' }}>
      <span
        ref={ref}
        style={{
          position: 'relative',
          fontSize: 48,
          color: 'var(--df-neon-emerald)',
          fontWeight: 700,
        }}
      >
        {score}
      </span>
    </button>
  )
}
```

### 8. Subscribe button (multi-color burst)

```tsx
'use client'
import { useRef } from 'react'
import mojs from '@mojs/core'

export function SubscribeButton() {
  const ref = useRef<HTMLButtonElement>(null)

  const onSubscribe = () => {
    if (isReducedMotion() || !ref.current) return
    const palette = readNxBurstPalette()
    new mojs.Burst({
      parent: ref.current,
      radius: { 0: 100 },
      count: 16,
      children: {
        shape: ['circle', 'rect'],
        fill: [palette.violet, palette.cyan, palette.pink, palette.emerald],
        radius: { 6: 0 },
        duration: 800,
        easing: 'quad.out',
      },
    }).replay()
  }

  return (
    <button
      ref={ref}
      onClick={onSubscribe}
      aria-label="Subscribe"
      style={{
        position: 'relative',
        padding: '14px 28px',
        background: 'linear-gradient(135deg, var(--df-neon-violet), var(--df-neon-cyan))',
        color: '#000',
        border: 0,
        borderRadius: 'var(--df-radius-md)',
        fontWeight: 600,
        cursor: 'pointer',
      }}
    >
      Subscribe ✨
    </button>
  )
}
```

## Reduced-motion handling (REQUIRED on every burst)

Bursts are **pure delight** — they're optional for reduced-motion users. Every example above checks `isReducedMotion()` and skips the burst entirely. The action still fires (state still updates), but no animation plays. **No fallback animation** — that's the right pattern for celebrations.

## Pitfalls

| Pitfall | Fix |
|---|---|
| Burst doesn't appear | Parent element needs `position: relative` for the canvas to anchor |
| Performance jank with many bursts | Cap concurrent bursts to 3-4; debounce rapid triggers |
| Bursts cut off at parent edge | Set `parent` to `document.body` for full-viewport bursts |
| `mojs.Burst is not a constructor` | Wrong import — `import mojs from '@mojs/core'` (default), then `new mojs.Burst(...)` |
| Bursts on SSR throw | Mo.js is client-only — wrap in `'use client'`, init in `useEffect` |
| Colors don't match brand | Use the `readNxBurstPalette()` helper — canvas can't resolve CSS vars |

## Cross-references

- `references/00-dark-tokens.md` — DF neon palette read by `readNxBurstPalette()`
- `references/14-animejs.md` — alternative for path-based / SVG-morph animations
- `references/01-framer-motion.md` — for orchestrated React component animations
