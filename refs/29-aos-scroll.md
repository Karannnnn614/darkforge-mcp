---
name: 29-aos-scroll
description: AOS (Animate On Scroll) — declarative scroll animations via `data-aos="fade-up"` attribute. Massive install base. Use when user has aos in package.json or wants the simplest possible scroll-reveal API with zero JS per element.
---

# AOS — Animate On Scroll

> **The simplest possible scroll animation library.** Add `data-aos="fade-up"` to any element and you're done. Zero JS to write per element. Massive install base — broad audience reach for Darkforge.

## Source-of-truth caveat

Generated from training-data recall (Jan 2026 cutoff). `context7` + `WebFetch` were denied at generation time. **AOS hasn't been actively maintained since 2022** — flag this when recommending. The API is stable but newer alternatives (Framer Motion `whileInView`, Lenis, ScrollReveal) get more attention. `// VERIFY:` markers flag any uncertainty. Cross-check `https://michalsnik.github.io/aos` before shipping.

## Contents

- [Install / Setup](#install--setup)
- [Built-in animations catalog](#built-in-animations-catalog)
- [Worked examples](#worked-examples)
- [Reduced-motion handling](#reduced-motion-handling)
- [When to use AOS vs alternatives](#when-to-use-aos-vs-alternatives)
- [Pitfalls](#pitfalls)
- [Cross-references](#cross-references)

---

## Install / Setup

```bash
npm i aos
```

```tsx
// app/providers/AOSProvider.tsx
'use client'
import { useEffect } from 'react'
import AOS from 'aos'
import 'aos/dist/aos.css'

export function AOSProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // VERIFY: AOS.init signature stable since v2.x.
    AOS.init({
      duration: 800,
      easing: 'ease-out-cubic',
      once: true, // animate once, then leave element in place
      offset: 50,
      // VERIFY: `disable` accepts 'phone' | 'tablet' | 'mobile' | boolean | function.
      disable: () =>
        window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    })

    // Refresh AOS when content changes (route navigation, async data load).
    const refresh = () => AOS.refresh()
    window.addEventListener('load', refresh)
    return () => window.removeEventListener('load', refresh)
  }, [])

  return <>{children}</>
}
```

```tsx
// app/layout.tsx
import { AOSProvider } from './providers/AOSProvider'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ background: 'var(--df-bg-base)', color: 'var(--df-text-primary)' }}>
        <AOSProvider>{children}</AOSProvider>
      </body>
    </html>
  )
}
```

## Built-in animations catalog

| `data-aos` value | What it does |
|---|---|
| `fade` | Opacity 0 → 1 |
| `fade-up` | Fade + slide up |
| `fade-down` | Fade + slide down |
| `fade-left` | Fade + slide from right |
| `fade-right` | Fade + slide from left |
| `fade-up-right` | Fade + slide diagonal |
| `fade-up-left` | Fade + slide diagonal |
| `fade-down-right` | Fade + slide diagonal |
| `fade-down-left` | Fade + slide diagonal |
| `flip-up` | 3D flip from bottom |
| `flip-down` | 3D flip from top |
| `flip-left` | 3D flip from left |
| `flip-right` | 3D flip from right |
| `slide-up` | Pure slide (no fade) |
| `slide-down` | Pure slide |
| `slide-left` | Pure slide |
| `slide-right` | Pure slide |
| `zoom-in` | Scale 0.6 → 1 + fade |
| `zoom-in-up` | Zoom + slide up |
| `zoom-in-down` | Zoom + slide down |
| `zoom-in-left` | Zoom + slide left |
| `zoom-in-right` | Zoom + slide right |
| `zoom-out` | Scale 1.2 → 1 + fade |
| `zoom-out-up` | Zoom-out + slide up |
| `zoom-out-down` | Zoom-out + slide down |
| `zoom-out-left` | Zoom-out + slide left |
| `zoom-out-right` | Zoom-out + slide right |

Per-element overrides via attributes:
- `data-aos-duration="1200"` — animation duration in ms
- `data-aos-delay="200"` — start delay in ms (use for stagger)
- `data-aos-easing="ease-out-back"` — override easing
- `data-aos-anchor="#trigger"` — animate when a different element enters viewport
- `data-aos-anchor-placement="top-bottom"` — viewport position trigger
- `data-aos-once="true"` — override global `once` setting

## Worked examples

### 1. Hero with fade-up headline + CTA

```tsx
export function AOSHero() {
  return (
    <section
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '120px 24px',
        background: 'var(--df-bg-base)',
      }}
    >
      <h1
        data-aos="fade-up"
        style={{
          fontSize: 'clamp(48px, 8vw, 92px)',
          fontWeight: 700,
          color: 'var(--df-text-primary)',
          letterSpacing: '-0.03em',
          margin: 0,
          textAlign: 'center',
        }}
      >
        Ship faster.
      </h1>
      <p
        data-aos="fade-up"
        data-aos-delay="120"
        style={{
          fontSize: 18,
          color: 'var(--df-text-secondary)',
          maxWidth: 540,
          margin: '24px 0 32px',
          textAlign: 'center',
          lineHeight: 1.6,
        }}
      >
        AMOLED-dark UI generation. Stack-aware. Production-grade.
      </p>
      <a
        data-aos="fade-up"
        data-aos-delay="240"
        href="#install"
        style={{
          padding: '14px 32px',
          background: 'var(--df-neon-violet)',
          color: '#000',
          borderRadius: 'var(--df-radius-md)',
          fontWeight: 600,
          textDecoration: 'none',
          boxShadow: 'var(--df-glow-violet)',
        }}
      >
        Get started
      </a>
    </section>
  )
}
```

### 2. Stats grid with staggered fade-up

```tsx
const STATS = [
  { label: 'Sent', value: '184K' },
  { label: 'Delivered', value: '178K' },
  { label: 'Replies', value: '6,412' },
  { label: 'Bounce', value: '2.4%' },
]

export function StatsGrid() {
  return (
    <div
      style={{
        display: 'grid',
        gap: 16,
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        padding: 32,
      }}
    >
      {STATS.map((s, i) => (
        <div
          key={s.label}
          data-aos="fade-up"
          data-aos-delay={i * 80}
          style={{
            padding: 20,
            background: 'var(--df-glass-bg)',
            backdropFilter: 'blur(10px)',
            border: '1px solid var(--df-glass-border)',
            borderRadius: 'var(--df-radius-lg)',
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

### 3. Pricing tiers with zoom-in

```tsx
const TIERS = [
  { name: 'Free', price: '$0' },
  { name: 'Pro', price: '$49', accent: true },
  { name: 'Enterprise', price: '$249' },
]

export function PricingTiers() {
  return (
    <div
      style={{
        display: 'grid',
        gap: 24,
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        padding: '80px 24px',
        maxWidth: 1100,
        margin: '0 auto',
      }}
    >
      {TIERS.map((tier, i) => (
        <div
          key={tier.name}
          data-aos="zoom-in"
          data-aos-delay={i * 100}
          style={{
            padding: 32,
            background: 'var(--df-glass-bg)',
            border: `1px solid ${tier.accent ? 'var(--df-neon-violet)' : 'var(--df-glass-border)'}`,
            borderRadius: 'var(--df-radius-lg)',
            boxShadow: tier.accent ? 'var(--df-glow-violet)' : undefined,
          }}
        >
          <h3 style={{ color: 'var(--df-text-primary)', margin: 0 }}>{tier.name}</h3>
          <p style={{ fontSize: 36, color: 'var(--df-text-primary)', margin: '12px 0 0' }}>{tier.price}</p>
        </div>
      ))}
    </div>
  )
}
```

### 4. Feature cards with flip-left

```tsx
export function FeatureGrid() {
  return (
    <div
      style={{
        display: 'grid',
        gap: 16,
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        padding: 24,
      }}
    >
      {['Stack-aware', 'AMOLED dark', 'Animated default'].map((feature, i) => (
        <article
          key={feature}
          data-aos="flip-left"
          data-aos-delay={i * 100}
          style={{
            padding: 24,
            background: 'var(--df-bg-elev-1)',
            borderRadius: 'var(--df-radius-lg)',
            border: '1px solid var(--df-border-subtle)',
          }}
        >
          <h3 style={{ color: 'var(--df-text-primary)', margin: 0 }}>{feature}</h3>
          <p style={{ color: 'var(--df-text-secondary)', marginTop: 8 }}>One-line description.</p>
        </article>
      ))}
    </div>
  )
}
```

### 5. Image reveal with zoom-in-up

```tsx
export function ImageReveal({ src, alt }: { src: string; alt: string }) {
  return (
    <div
      data-aos="zoom-in-up"
      data-aos-duration="1200"
      style={{
        background: 'var(--df-glass-bg)',
        border: '1px solid var(--df-glass-border)',
        borderRadius: 'var(--df-radius-lg)',
        overflow: 'hidden',
      }}
    >
      <img src={src} alt={alt} style={{ display: 'block', width: '100%', height: 'auto' }} />
    </div>
  )
}
```

### 6. Anchor-based reveal

Trigger an animation when a *different* element enters the viewport.

```tsx
export function AnchorReveal() {
  return (
    <>
      <div id="hero-trigger" style={{ height: '50vh' }} />
      <h2
        data-aos="fade-up"
        data-aos-anchor="#hero-trigger"
        data-aos-anchor-placement="top-center"
        style={{ color: 'var(--df-text-primary)', fontSize: 48 }}
      >
        Triggers when the hero is half-scrolled.
      </h2>
    </>
  )
}
```

### 7. Navbar fade-down on mount

```tsx
export function FadeInNavbar() {
  return (
    <nav
      data-aos="fade-down"
      data-aos-once="true"
      style={{
        position: 'sticky',
        top: 0,
        height: 64,
        background: 'var(--df-glass-bg)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--df-glass-border)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        zIndex: 30,
      }}
      aria-label="Primary"
    >
      <span style={{ color: 'var(--df-text-primary)', fontWeight: 600 }}>Brand</span>
    </nav>
  )
}
```

### 8. Footer reveal

```tsx
export function FadeUpFooter() {
  return (
    <footer
      data-aos="fade-up"
      data-aos-offset="200"
      style={{
        padding: '60px 24px',
        background: 'var(--df-bg-elev-1)',
        borderTop: '1px solid var(--df-border-subtle)',
        textAlign: 'center',
        color: 'var(--df-text-tertiary)',
      }}
    >
      © 2026 Brand. All rights reserved.
    </footer>
  )
}
```

## Reduced-motion handling

The provider above sets `disable` to a function that returns `true` when `prefers-reduced-motion: reduce` matches. AOS then **does not run at all** — elements render in their final state instantly. This is the correct behavior — no fallback animation, no faked instant fade.

Belt-and-suspenders CSS:

```css
@media (prefers-reduced-motion: reduce) {
  [data-aos] {
    transform: none !important;
    opacity: 1 !important;
    transition: none !important;
  }
}
```

## When to use AOS vs alternatives

| Use AOS when | Use alternative when |
|---|---|
| You want declarative `data-aos` attributes (no JS per element) | You need scroll-tied scrub or pinned sections → `02-gsap.md` |
| Project doesn't have Framer Motion or GSAP | You're already in React with Framer Motion → `01-framer-motion.md` `whileInView` |
| You're a beginner / need quick setup | You need smooth-scroll inertia → `26-lenis-smooth-scroll.md` |
| You want 25+ pre-built animations | You need parallax + scroll velocity → `27-locomotive-scroll.md` |

## Pitfalls

| Pitfall | Fix |
|---|---|
| Animations don't fire | `AOS.init()` not called, OR CSS file not imported |
| Animations fire before content loads | Call `AOS.refresh()` after dynamic content mounts |
| Server-side rendering shows un-animated final state then "pops" | Expected — AOS adds initial transform via CSS class only after `init()` runs client-side. Set `once: true` to avoid pop on subsequent scrolls |
| Mobile performance jank | Lower `duration` to 400-600ms; use `once: true`; consider disabling on mobile via `disable: 'mobile'` |
| Conflicts with native CSS `scroll-snap` | AOS scroll listener fights snap — pick one |
| Hot module reload breaks animations | Add `AOS.refreshHard()` on dev-only HMR boundary |

## Cross-references

- `references/00-dark-tokens.md` — DF token system
- `references/01-framer-motion.md` — `whileInView` is the React-native equivalent
- `references/26-lenis-smooth-scroll.md` — pair AOS with Lenis for smooth-scroll + reveal combo
- `references/28-scrollreveal.md` — alternative beginner scroll lib with imperative API
- `references/02-gsap.md` — when AOS is too declarative and you need scroll-scrubbed animations
