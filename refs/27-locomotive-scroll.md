---
name: 27-locomotive-scroll
description: Locomotive Scroll — smooth scroll + parallax engine, agency favorite. Data-attribute driven. Use when user has locomotive-scroll in package.json or wants both smooth scroll AND parallax in one library.
---

# Locomotive Scroll

> **Smooth scroll + parallax in one library.** Where Lenis is pure smooth-scroll, Locomotive ships smooth-scroll AND parallax via data attributes. Agency favorite. Pairs natively with GSAP ScrollTrigger.

## Source-of-truth caveat

Generated from training-data recall (Jan 2026 cutoff). `context7` + `WebFetch` were denied at generation time. Locomotive v4.x → v5.x had API drift — `data-scroll-call` deprecated in v5; module class renamed. `// VERIFY:` markers flag prop signatures most likely to drift. Cross-check `https://locomotivemtl.github.io/locomotive-scroll` before shipping.

## Contents

- [Install / Setup](#install--setup)
- [Data attributes reference](#data-attributes-reference)
- [Worked examples](#worked-examples)
- [Locomotive + GSAP ScrollTrigger sync](#locomotive--gsap-scrolltrigger-sync)
- [Reduced-motion handling](#reduced-motion-handling)
- [Pitfalls](#pitfalls)
- [Cross-references](#cross-references)

---

## Install / Setup

```bash
npm i locomotive-scroll
```

```tsx
// app/providers/LocomotiveProvider.tsx
'use client'
import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'framer-motion'

export function LocomotiveProvider({ children }: { children: React.ReactNode }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (reduced || !scrollRef.current) return
    let scroll: import('locomotive-scroll').default | null = null

    ;(async () => {
      // VERIFY: v5 default export name and constructor signature.
      const LocomotiveScroll = (await import('locomotive-scroll')).default
      scroll = new LocomotiveScroll({
        el: scrollRef.current!,
        smooth: true,
        lerp: 0.08,
        smartphone: { smooth: false }, // mobile: native scroll
        tablet: { smooth: false },
      })
    })()

    return () => {
      scroll?.destroy()
    }
  }, [reduced])

  return (
    <div ref={scrollRef} data-scroll-container>
      {children}
    </div>
  )
}
```

## Data attributes reference

| Attribute | Purpose |
|---|---|
| `data-scroll` | Mark element as Locomotive-controlled |
| `data-scroll-section` | Optimization boundary — Locomotive only updates visible sections |
| `data-scroll-speed="2"` | Parallax speed multiplier (positive = faster, negative = reverse) |
| `data-scroll-direction="horizontal"` | Override scroll direction for an element |
| `data-scroll-position="top"` | Where in viewport the trigger fires |
| `data-scroll-sticky` | Element stays fixed within parent during scroll |
| `data-scroll-target` | Reference for sticky elements |
| `data-scroll-class="is-visible"` | Class added when in view |
| `data-scroll-repeat` | Re-trigger class toggle on every scroll-in |

## Worked examples

### 1. Smooth-scroll wrapper

```tsx
// app/layout.tsx
import { LocomotiveProvider } from './providers/LocomotiveProvider'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ background: 'var(--df-bg-base)', color: 'var(--df-text-primary)' }}>
        <LocomotiveProvider>{children}</LocomotiveProvider>
      </body>
    </html>
  )
}
```

### 2. Parallax hero

```tsx
export function ParallaxHero() {
  return (
    <section
      data-scroll-section
      style={{
        position: 'relative',
        minHeight: '100vh',
        background: 'var(--df-bg-base)',
        overflow: 'hidden',
      }}
    >
      <div
        data-scroll
        data-scroll-speed="-3"
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 50% 30%, rgba(167,139,250,0.18), transparent 60%)',
        }}
      />
      <div data-scroll data-scroll-speed="1" style={{ position: 'relative', padding: '180px 24px', maxWidth: 880, margin: '0 auto' }}>
        <h1 style={{ fontSize: 'clamp(48px, 8vw, 92px)', color: 'var(--df-text-primary)', margin: 0 }}>
          Parallax that ships.
        </h1>
        <p style={{ color: 'var(--df-text-secondary)', fontSize: 18, lineHeight: 1.6 }}>
          Locomotive Scroll handles the velocity. Darkforge handles the visuals.
        </p>
      </div>
    </section>
  )
}
```

### 3. Sticky sidebar

```tsx
export function StickySection() {
  return (
    <section
      data-scroll-section
      style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 32, padding: 24 }}
    >
      <aside
        data-scroll
        data-scroll-sticky
        data-scroll-target="#sticky-target"
        style={{
          padding: 24,
          background: 'var(--df-glass-bg)',
          border: '1px solid var(--df-glass-border)',
          borderRadius: 'var(--df-radius-lg)',
          height: 'fit-content',
        }}
      >
        <h3 style={{ color: 'var(--df-text-primary)' }}>On this page</h3>
        <ul style={{ color: 'var(--df-text-secondary)', listStyle: 'none', padding: 0 }}>
          <li>Intro</li>
          <li>Setup</li>
          <li>Examples</li>
        </ul>
      </aside>
      <main id="sticky-target" style={{ display: 'flex', flexDirection: 'column', gap: 600 }}>
        <p style={{ color: 'var(--df-text-secondary)' }}>Long content...</p>
      </main>
    </section>
  )
}
```

### 4. Reveal-on-scroll element

```tsx
export function RevealCard() {
  return (
    <article
      data-scroll
      data-scroll-class="is-visible"
      data-scroll-position="top"
      style={{
        padding: 32,
        background: 'var(--df-glass-bg)',
        border: '1px solid var(--df-glass-border)',
        borderRadius: 'var(--df-radius-lg)',
        opacity: 0,
        transform: 'translateY(40px)',
        transition: 'opacity 0.8s ease, transform 0.8s ease',
      }}
    >
      <h3 style={{ color: 'var(--df-text-primary)' }}>Reveal me</h3>
      <style>{`
        [data-scroll].is-visible {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }
      `}</style>
    </article>
  )
}
```

### 5. Image parallax

```tsx
export function ParallaxImage({ src, alt }: { src: string; alt: string }) {
  return (
    <figure
      data-scroll-section
      style={{ overflow: 'hidden', borderRadius: 'var(--df-radius-lg)' }}
    >
      <img
        data-scroll
        data-scroll-speed="-2"
        src={src}
        alt={alt}
        style={{ display: 'block', width: '100%', transform: 'scale(1.2)' }}
      />
    </figure>
  )
}
```

### 6. Footer reverse parallax

```tsx
export function ReverseParallaxFooter() {
  return (
    <footer
      data-scroll-section
      data-scroll
      data-scroll-speed="-1"
      style={{
        padding: 80,
        background: 'var(--df-bg-elev-1)',
        borderTop: '1px solid var(--df-border-subtle)',
        textAlign: 'center',
        color: 'var(--df-text-tertiary)',
      }}
    >
      © 2026 Brand
    </footer>
  )
}
```

## Locomotive + GSAP ScrollTrigger sync

Mirrors the Lenis pattern (`26-lenis-smooth-scroll.md`). Locomotive owns the scroll, ScrollTrigger listens.

```tsx
'use client'
import { useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function useLocomotiveGsapBridge(scroll: any) {
  useEffect(() => {
    if (!scroll) return

    // VERIFY: v5 instance method is `on('scroll', ...)`. v4 differed.
    scroll.on('scroll', ScrollTrigger.update)

    ScrollTrigger.scrollerProxy(scroll.el, {
      scrollTop(value) {
        return arguments.length ? scroll.scrollTo(value, 0, 0) : scroll.scroll.instance.scroll.y
      },
      getBoundingClientRect() {
        return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight }
      },
      pinType: scroll.el.style.transform ? 'transform' : 'fixed',
    })

    ScrollTrigger.addEventListener('refresh', () => scroll.update())
    ScrollTrigger.refresh()
  }, [scroll])
}
```

## Reduced-motion handling

The provider above short-circuits when `useReducedMotion()` returns true — Locomotive simply doesn't initialize. Belt-and-suspenders CSS:

```css
@media (prefers-reduced-motion: reduce) {
  [data-scroll-container],
  [data-scroll-section] {
    transform: none !important;
  }
  [data-scroll] {
    opacity: 1 !important;
    transform: none !important;
  }
}
```

## Pitfalls

| Pitfall | Fix |
|---|---|
| `position: fixed` elements jitter | Add `data-scroll-fixed` to the fixed element |
| Locomotive instance leaks between routes | Always call `scroll.destroy()` in cleanup |
| Mobile shows broken layout | Disable smooth on mobile/tablet (`smartphone: { smooth: false }`) |
| Scroll position lost on dynamic content load | Call `scroll.update()` after content mounts |
| Conflicts with native CSS `scroll-behavior: smooth` | Remove the CSS rule when using Locomotive |
| GSAP ScrollTrigger pins behave wrong | Use the `scrollerProxy` bridge above |

## Cross-references

- `references/26-lenis-smooth-scroll.md` — alternative when you want pure smooth-scroll without parallax
- `references/02-gsap.md` — ScrollTrigger plugin used in the bridge
- `references/patterns/scroll-story.md` — full scroll-narrative section recipes
- `references/00-dark-tokens.md` — DF token system used throughout
