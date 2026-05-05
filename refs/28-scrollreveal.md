---
name: 28-scrollreveal
description: ScrollReveal — beginner-friendly imperative scroll-reveal library with sr.reveal('.hero') API. Zero dependencies, ~5kb. Use when project lacks Framer Motion/GSAP and just needs basic fade-up reveals without learning a full animation system.
---

# ScrollReveal — Darkforge Integration

> **The dead-simplest scroll-reveal library.** Zero dependencies, ~5kb, imperative API: `sr.reveal('.hero', { ... })`. Use when AOS feels too declarative and Framer Motion / GSAP are overkill.

## Source-of-truth caveat

Generated from training-data recall (Jan 2026 cutoff). `context7` + `WebFetch` were denied at generation time. ScrollReveal v4 has been stable since 2017 — minimal API drift. `// VERIFY:` markers flag any uncertainty. Cross-check `https://scrollrevealjs.org` before shipping.

## Contents

- [Install / Setup](#install--setup)
- [Worked examples](#worked-examples)
- [Reduced-motion handling](#reduced-motion-handling)
- [When to use ScrollReveal vs alternatives](#when-to-use-scrollreveal-vs-alternatives)
- [Pitfalls](#pitfalls)
- [Cross-references](#cross-references)

---

## Install / Setup

```bash
npm i scrollreveal
```

ScrollReveal is plain JS — no React-specific package. Init in a client component via `useEffect`.

```tsx
// app/providers/ScrollRevealProvider.tsx
'use client'
import { useEffect } from 'react'

export function ScrollRevealProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Skip entirely for reduced-motion users
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let sr: any = null
    ;(async () => {
      const ScrollReveal = (await import('scrollreveal')).default
      sr = ScrollReveal({
        // VERIFY: ScrollReveal v4 default options.
        distance: '40px',
        duration: 800,
        easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
        origin: 'bottom',
        reset: false,
        viewFactor: 0.2,
      })
    })()

    return () => {
      sr?.destroy()
    }
  }, [])

  return <>{children}</>
}
```

## Worked examples

### 1. Basic per-element reveal

```tsx
'use client'
import { useEffect } from 'react'

export function HeroReveal() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let sr: any
    ;(async () => {
      const ScrollReveal = (await import('scrollreveal')).default
      sr = ScrollReveal()
      sr.reveal('.sr-hero-title', { delay: 0, distance: '40px' })
      sr.reveal('.sr-hero-sub', { delay: 200, distance: '40px' })
      sr.reveal('.sr-hero-cta', { delay: 400, distance: '40px' })
    })()
    return () => sr?.destroy()
  }, [])

  return (
    <section
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '120px 24px',
        background: 'var(--df-bg-base)',
        gap: 24,
      }}
    >
      <h1
        className="sr-hero-title"
        style={{
          fontSize: 'clamp(48px, 8vw, 92px)',
          color: 'var(--df-text-primary)',
          margin: 0,
        }}
      >
        Ship dark UI fast.
      </h1>
      <p className="sr-hero-sub" style={{ color: 'var(--df-text-secondary)', maxWidth: 540, fontSize: 18 }}>
        ScrollReveal handles the entrance. Darkforge handles the rest.
      </p>
      <a
        className="sr-hero-cta"
        href="#install"
        style={{
          alignSelf: 'flex-start',
          padding: '14px 28px',
          background: 'var(--df-neon-violet)',
          color: '#000',
          borderRadius: 'var(--df-radius-md)',
          fontWeight: 600,
          textDecoration: 'none',
          boxShadow: 'var(--df-glow-violet)',
        }}
      >
        Install
      </a>
    </section>
  )
}
```

### 2. Sequential reveal of stat cards

```tsx
'use client'
import { useEffect } from 'react'

const STATS = [
  { label: 'Sent', value: '184K' },
  { label: 'Delivered', value: '178K' },
  { label: 'Replies', value: '6,412' },
  { label: 'Bounce', value: '2.4%' },
]

export function StatsReveal() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let sr: any
    ;(async () => {
      const ScrollReveal = (await import('scrollreveal')).default
      sr = ScrollReveal()
      // `interval` staggers reveal by N ms between matched elements
      sr.reveal('.sr-stat', { interval: 100, distance: '40px' })
    })()
    return () => sr?.destroy()
  }, [])

  return (
    <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', padding: 32 }}>
      {STATS.map((s) => (
        <div
          key={s.label}
          className="sr-stat"
          style={{
            padding: 20,
            background: 'var(--df-glass-bg)',
            border: '1px solid var(--df-glass-border)',
            borderRadius: 'var(--df-radius-lg)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <p style={{ color: 'var(--df-text-tertiary)', fontSize: 13, margin: 0 }}>{s.label}</p>
          <p style={{ color: 'var(--df-neon-violet)', fontSize: 28, fontWeight: 600, margin: 0 }}>{s.value}</p>
        </div>
      ))}
    </div>
  )
}
```

### 3. Per-element config

```tsx
'use client'
import { useEffect } from 'react'

export function VariedReveal() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let sr: any
    ;(async () => {
      const ScrollReveal = (await import('scrollreveal')).default
      sr = ScrollReveal()
      sr.reveal('.sr-from-left', { origin: 'left', distance: '60px' })
      sr.reveal('.sr-from-right', { origin: 'right', distance: '60px', delay: 200 })
      sr.reveal('.sr-zoom', { scale: 0.92, distance: '0px' })
    })()
    return () => sr?.destroy()
  }, [])

  return (
    <section style={{ padding: '80px 24px', background: 'var(--df-bg-base)' }}>
      <div className="sr-from-left" style={{ background: 'var(--df-glass-bg)', padding: 24, borderRadius: 'var(--df-radius-lg)', marginBottom: 16 }}>
        <p style={{ color: 'var(--df-text-primary)' }}>Slides in from left.</p>
      </div>
      <div className="sr-from-right" style={{ background: 'var(--df-glass-bg)', padding: 24, borderRadius: 'var(--df-radius-lg)', marginBottom: 16 }}>
        <p style={{ color: 'var(--df-text-primary)' }}>Slides in from right with 200ms delay.</p>
      </div>
      <div className="sr-zoom" style={{ background: 'var(--df-glass-bg)', padding: 24, borderRadius: 'var(--df-radius-lg)' }}>
        <p style={{ color: 'var(--df-text-primary)' }}>Zooms in.</p>
      </div>
    </section>
  )
}
```

### 4. Feature grid reveal

```tsx
'use client'
import { useEffect } from 'react'

export function FeatureGridReveal() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let sr: any
    ;(async () => {
      const ScrollReveal = (await import('scrollreveal')).default
      sr = ScrollReveal()
      sr.reveal('.sr-feature', { interval: 80, viewFactor: 0.3 })
    })()
    return () => sr?.destroy()
  }, [])

  return (
    <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', padding: 24 }}>
      {['Stack-aware', 'AMOLED dark', 'Animated default'].map((feature) => (
        <article
          key={feature}
          className="sr-feature"
          style={{
            padding: 24,
            background: 'var(--df-bg-elev-1)',
            border: '1px solid var(--df-border-subtle)',
            borderRadius: 'var(--df-radius-lg)',
          }}
        >
          <h3 style={{ color: 'var(--df-text-primary)', margin: 0 }}>{feature}</h3>
        </article>
      ))}
    </div>
  )
}
```

### 5. Reveal with DF glow accent

```tsx
'use client'
import { useEffect } from 'react'

export function GlowingReveal() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let sr: any
    ;(async () => {
      const ScrollReveal = (await import('scrollreveal')).default
      sr = ScrollReveal()
      sr.reveal('.sr-glow', {
        distance: '40px',
        duration: 1000,
        afterReveal: (el: HTMLElement) => {
          // After ScrollReveal finishes, add DF glow class
          el.style.boxShadow = 'var(--df-glow-violet)'
        },
      })
    })()
    return () => sr?.destroy()
  }, [])

  return (
    <div
      className="sr-glow"
      style={{
        padding: 32,
        background: 'var(--df-glass-bg)',
        border: '1px solid var(--df-neon-violet)',
        borderRadius: 'var(--df-radius-lg)',
        transition: 'box-shadow 600ms ease',
      }}
    >
      <h3 style={{ color: 'var(--df-text-primary)' }}>Reveals, then glows.</h3>
    </div>
  )
}
```

### 6. Reduced-motion handling

The init code above already short-circuits for reduced-motion users. Belt-and-suspenders CSS:

```css
@media (prefers-reduced-motion: reduce) {
  [data-sr-id] {
    visibility: visible !important;
    opacity: 1 !important;
    transform: none !important;
  }
}
```

### 7. Cleanup pattern

```tsx
useEffect(() => {
  let sr: any
  let mounted = true
  ;(async () => {
    const ScrollReveal = (await import('scrollreveal')).default
    if (!mounted) return
    sr = ScrollReveal()
    sr.reveal('.target', { distance: '40px' })
  })()

  return () => {
    mounted = false
    sr?.destroy()
  }
}, [])
```

## When to use ScrollReveal vs alternatives

| Use ScrollReveal when | Use alternative when |
|---|---|
| Project doesn't have Framer Motion or GSAP | You're already in React with Framer Motion → `01-framer-motion.md` `whileInView` |
| You need 3-5 lines of imperative reveal code | You want declarative `data-aos="fade-up"` syntax → `29-aos-scroll.md` |
| Beginner team / one-off page | You need scroll-tied scrub or pinning → `02-gsap.md` |
| Bundle size matters (~5kb) | You want smooth-scroll inertia too → `26-lenis-smooth-scroll.md` |

## Pitfalls

| Pitfall | Fix |
|---|---|
| Elements stay invisible after init | Forgot `await` on dynamic import; ScrollReveal called before DOM ready |
| Reveal fires twice on dev HMR | Always call `sr.destroy()` in cleanup |
| Mobile shows flicker on first paint | Set initial `visibility: hidden` in CSS; ScrollReveal makes them visible after init |
| Server-side rendering shows un-animated final state | Expected — ScrollReveal is client-only; animations only fire after JS hydrates |
| `useEffect` runs before content mounts | Use `viewFactor` to delay reveal until element is in view |

## Cross-references

- `references/29-aos-scroll.md` — declarative alternative with `data-aos` attributes
- `references/01-framer-motion.md` — React-native `whileInView` alternative
- `references/26-lenis-smooth-scroll.md` — pair with Lenis for smooth-scroll + reveal combo
- `references/00-dark-tokens.md` — DF tokens used throughout
