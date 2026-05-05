---
name: 32-moving-letters
description: Moving Letters — 30+ pre-choreographed typographic animations powered by anime.js. Treat as a snippets layer on top of references/14-animejs.md. Use for cinematic headline reveals, animated quotes, hero text effects.
---

# Moving Letters — Darkforge Integration

> **Pre-choreographed typographic animations.** Tobias Ahlin's collection of 30+ headline reveal recipes — letter-by-letter fades, slides, blurs, rotations — all powered by anime.js (which Darkforge already covers in `references/14-animejs.md`). Treat this as a *snippets layer* on top of anime.js.

## Source-of-truth caveat

Generated from training-data recall (Jan 2026 cutoff). `context7` + `WebFetch` were denied at generation time. The reference site has been stable since 2017 — recipes don't drift. What *does* drift is the underlying anime.js API: anime.js v3 → v4 changed the timeline syntax. The recipes below use **anime.js v3** patterns that match `references/14-animejs.md`. Cross-check `https://tobiasahlin.com/moving-letters` and `references/14-animejs.md` before shipping.

## Contents

- [How it works](#how-it-works)
- [Install / Setup](#install--setup)
- [Worked recipes](#worked-recipes)
- [Reduced-motion handling](#reduced-motion-handling)
- [When Moving Letters vs alternatives](#when-moving-letters-vs-alternatives)
- [Pitfalls](#pitfalls)
- [Cross-references](#cross-references)

---

## How it works

Every Moving Letters animation follows the same shape:

1. Wrap each letter (or word) of a heading in its own `<span>`.
2. Use anime.js to target those spans with a staggered animation.
3. Optional: fire on scroll-into-view via IntersectionObserver.

The library is **not a npm package** — it's a collection of recipes you copy. The only runtime dependency is `animejs`.

## Install / Setup

```bash
npm i animejs
```

```css
/* app/globals.css — DF tokens */
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
  --df-radius-md: 10px;
  --df-radius-lg: 14px;
  --df-glow-violet: 0 0 24px rgba(167, 139, 250, 0.3);
}
```

```tsx
// components/SplitText.tsx — shared utility used by every recipe below
'use client'
import { useMemo } from 'react'

export function SplitText({
  text,
  className,
  letterClass,
}: {
  text: string
  className?: string
  letterClass?: string
}) {
  const letters = useMemo(() => Array.from(text), [text])
  return (
    <span className={className} aria-label={text}>
      {letters.map((char, i) => (
        <span
          key={i}
          aria-hidden="true"
          className={letterClass}
          style={{ display: 'inline-block', whiteSpace: char === ' ' ? 'pre' : undefined }}
        >
          {char}
        </span>
      ))}
    </span>
  )
}
```

## Worked recipes

### 1. Animation 1 — staggered letter fade-up

```tsx
'use client'
import anime from 'animejs'
import { useEffect, useRef } from 'react'
import { SplitText } from '@/components/SplitText'

export function AnimationOne() {
  const ref = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (!ref.current) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    // VERIFY: anime.js v3 signature; v4 uses `createTimeline()`.
    anime.timeline({ loop: false }).add({
      targets: ref.current.querySelectorAll('.ml1-letter'),
      translateY: ['1.1em', 0],
      translateZ: 0,
      duration: 750,
      delay: (_el, i) => 50 * i,
    })
  }, [])

  return (
    <h1
      ref={ref}
      style={{
        color: 'var(--df-text-primary)',
        fontSize: 'clamp(48px, 8vw, 92px)',
        margin: 0,
        overflow: 'hidden',
      }}
    >
      <SplitText text="Ship dark UI fast." letterClass="ml1-letter" />
    </h1>
  )
}
```

### 2. Animation 4 — letter scale + spin

```tsx
'use client'
import anime from 'animejs'
import { useEffect, useRef } from 'react'
import { SplitText } from '@/components/SplitText'

export function AnimationFour() {
  const ref = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (!ref.current) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    anime.timeline().add({
      targets: ref.current.querySelectorAll('.ml4-letter'),
      scale: [4, 1],
      opacity: [0, 1],
      translateZ: 0,
      easing: 'easeOutExpo',
      duration: 950,
      delay: (_el, i) => 70 * (i + 1),
    })
  }, [])

  return (
    <h1
      ref={ref}
      style={{
        color: 'var(--df-neon-violet)',
        fontSize: 'clamp(48px, 8vw, 92px)',
        margin: 0,
        textShadow: 'var(--df-glow-violet)',
      }}
    >
      <SplitText text="Darkforge" letterClass="ml4-letter" />
    </h1>
  )
}
```

### 3. Animation 6 — typewriter-style reveal

```tsx
'use client'
import anime from 'animejs'
import { useEffect, useRef } from 'react'
import { SplitText } from '@/components/SplitText'

export function AnimationSix() {
  const ref = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (!ref.current) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    anime
      .timeline({ loop: false })
      .add({
        targets: ref.current.querySelectorAll('.ml6-letter'),
        opacity: [0, 1],
        translateY: ['1.1em', 0],
        translateZ: 0,
        duration: 600,
        delay: (_el, i) => 40 * i,
      })
      .add(
        {
          targets: ref.current.querySelector('.ml6-cursor'),
          opacity: [1, 0],
          loop: true,
          duration: 600,
          easing: 'easeInOutSine',
        },
        '+=200',
      )
  }, [])

  return (
    <h1
      ref={ref}
      style={{
        color: 'var(--df-text-primary)',
        fontSize: 'clamp(36px, 6vw, 72px)',
        margin: 0,
        fontFamily: 'monospace',
      }}
    >
      <SplitText text="Built for Claude Code" letterClass="ml6-letter" />
      <span
        className="ml6-cursor"
        aria-hidden="true"
        style={{ display: 'inline-block', color: 'var(--df-neon-cyan)', marginLeft: 4 }}
      >
        ▌
      </span>
    </h1>
  )
}
```

### 4. Animation 8 — letter blur-in

```tsx
'use client'
import anime from 'animejs'
import { useEffect, useRef } from 'react'
import { SplitText } from '@/components/SplitText'

export function AnimationEight() {
  const ref = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (!ref.current) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    // VERIFY: filter property animation requires anime.js v3.2+.
    anime.timeline().add({
      targets: ref.current.querySelectorAll('.ml8-letter'),
      opacity: [0, 1],
      filter: ['blur(8px)', 'blur(0px)'],
      easing: 'easeOutQuint',
      duration: 1200,
      delay: (_el, i) => 60 * i,
    })
  }, [])

  return (
    <h2
      ref={ref}
      style={{
        color: 'var(--df-text-primary)',
        fontSize: 'clamp(28px, 4vw, 48px)',
        margin: 0,
      }}
    >
      <SplitText text="Cinematic headline reveal" letterClass="ml8-letter" />
    </h2>
  )
}
```

### 5. Animation 13 — word-level slide-in

```tsx
'use client'
import anime from 'animejs'
import { useEffect, useRef } from 'react'

export function AnimationThirteen() {
  const ref = useRef<HTMLHeadingElement>(null)
  const text = 'Animations that respect motion preferences.'
  const words = text.split(' ')

  useEffect(() => {
    if (!ref.current) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    anime.timeline().add({
      targets: ref.current.querySelectorAll('.ml13-word'),
      translateX: ['-100%', 0],
      opacity: [0, 1],
      easing: 'easeOutExpo',
      duration: 800,
      delay: (_el, i) => 100 * i,
    })
  }, [])

  return (
    <h2
      ref={ref}
      aria-label={text}
      style={{
        color: 'var(--df-text-secondary)',
        fontSize: 'clamp(20px, 3vw, 32px)',
        margin: 0,
        overflow: 'hidden',
      }}
    >
      {words.map((word, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="ml13-word"
          style={{ display: 'inline-block', marginRight: '0.25em' }}
        >
          {word}
        </span>
      ))}
    </h2>
  )
}
```

### 6. Animation 16 — letter explode + return

```tsx
'use client'
import anime from 'animejs'
import { useEffect, useRef } from 'react'
import { SplitText } from '@/components/SplitText'

export function AnimationSixteen() {
  const ref = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (!ref.current) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    anime
      .timeline({ loop: false })
      .add({
        targets: ref.current.querySelectorAll('.ml16-letter'),
        translateY: [-50, 0],
        translateX: () => anime.random(-100, 100),
        rotateZ: () => anime.random(-30, 30),
        duration: 1000,
        easing: 'easeOutExpo',
        delay: (_el, i) => 30 * i,
      })
  }, [])

  return (
    <h1
      ref={ref}
      style={{
        color: 'var(--df-neon-cyan)',
        fontSize: 'clamp(48px, 8vw, 92px)',
        margin: 0,
        textShadow: '0 0 24px rgba(103, 232, 249, 0.3)',
      }}
    >
      <SplitText text="EXPLODE" letterClass="ml16-letter" />
    </h1>
  )
}
```

### 7. Scroll-triggered reveal wrapper

```tsx
'use client'
import { useEffect, useRef, useState } from 'react'

export function OnScroll({ children }: { children: (visible: boolean) => React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!ref.current) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          obs.disconnect()
        }
      },
      { threshold: 0.3 },
    )
    obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  return <div ref={ref}>{visible ? children(true) : children(false)}</div>
}

// Usage: pair with any of the recipes above by gating their `useEffect` on `visible`.
```

## Reduced-motion handling

Every recipe checks `prefers-reduced-motion` and bails before calling anime.js. This is critical — Moving Letters animations are aggressive and can trigger vestibular issues.

```ts
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
```

Belt-and-suspenders CSS to ensure letters are *visible* even if JS doesn't run:

```css
@media (prefers-reduced-motion: reduce) {
  [class*="ml"]-letter,
  [class*="ml"]-word {
    opacity: 1 !important;
    transform: none !important;
    filter: none !important;
  }
}
```

## When Moving Letters vs alternatives

| Need | Pick |
|---|---|
| Heading reveal, anime.js already in repo | Moving Letters recipe |
| Heading reveal, Framer Motion already in repo | `references/01-framer-motion.md` (`<motion.span>` per letter, `staggerChildren`) |
| GSAP SplitText for production-grade typography | `references/02-gsap.md` (Club GSAP $99/yr) |
| Variable-font morph reveals | GSAP — Moving Letters doesn't cover this |
| Snippets without writing per-letter span code | `react-type-animation` library or GSAP SplitText |

## Pitfalls

| Pitfall | Fix |
|---|---|
| Screen readers read letter-by-letter | Use the `SplitText` helper above — `aria-label` on parent, `aria-hidden` on letter spans |
| Layout breaks on letter wrap | Letters with `display: inline-block` lose word-spacing; preserve spaces with `whiteSpace: 'pre'` on space chars |
| Animation runs on every render | Run anime.js inside `useEffect` with empty deps; never on every paint |
| `loop: true` bug — leaks memory on unmount | Always store the timeline reference; call `.pause()` in cleanup |
| Letters explode out of viewport | Wrap heading in `overflow: hidden` parent — Animation 1, 8, 13 expect this |
| `translateZ(0)` doesn't help on Safari | Force GPU compositing with `will-change: transform` on the parent instead |

## Cross-references

- `references/14-animejs.md` — runtime engine (every recipe is anime.js)
- `references/01-framer-motion.md` — React-native alternative for similar effects
- `references/02-gsap.md` — production-grade typography (SplitText plugin)
- `references/00-dark-tokens.md` — DF tokens consumed throughout
- `references/26-lenis-smooth-scroll.md` — pair scroll-triggered reveals with smooth scroll
