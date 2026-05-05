---
name: 19-once-ui
description: Once UI — full design system with scroll storytelling, cinematic section transitions, responsive tokens. Fills Darkforge's "complete site system" gap. Use when user has @once-ui/core in package.json or wants a full design system instead of primitives.
---

# Once UI — Darkforge Integration

> **Once UI is a complete site design system** — not just primitives like shadcn or component classes like DaisyUI. Ships responsive layout tokens, scroll-based section reveals, dark/light mode out of the box, CLI-based component install (shadcn-style). Route here when user wants a *full site system* rather than à-la-carte components.

## Source-of-truth caveat

Generated from training-data recall (Jan 2026 cutoff). `context7` + `WebFetch` were denied at generation time. Once UI ships its own token system; this reference shows how to bridge those tokens to DF. `// VERIFY:` markers flag prop signatures most likely to drift. Cross-check `https://once-ui.com` before shipping.

## Contents

- [Install / Setup](#install--setup)
- [Once UI ↔ DF token bridge](#once-ui--df-token-bridge)
- [Worked examples](#worked-examples)
- [Scroll storytelling recipe](#scroll-storytelling-recipe)
- [Pitfalls](#pitfalls)
- [Cross-references](#cross-references)

---

## Install / Setup

```bash
# CLI install pattern (shadcn-style, per-component)
# VERIFY: command shape may differ in current Once UI docs.
npx once-ui init
npx once-ui add hero pricing testimonial
```

```tsx
// app/layout.tsx
import { OnceUIProvider } from '@once-ui/core'
import '@once-ui/core/styles.css'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark">
      <body
        style={{
          background: 'var(--df-bg-base)',
          color: 'var(--df-text-primary)',
          margin: 0,
        }}
      >
        <OnceUIProvider>{children}</OnceUIProvider>
      </body>
    </html>
  )
}
```

## Once UI ↔ DF token bridge

Once UI defines its own theme variables (e.g. `--once-bg-base`, `--once-accent`). Bridge them to DF in your `globals.css`:

```css
:root[data-theme="dark"] {
  /* Map Once UI semantic tokens → DF */
  --once-bg-base: var(--df-bg-base);
  --once-bg-surface: var(--df-bg-elev-1);
  --once-bg-elevated: var(--df-bg-elev-2);
  --once-text-primary: var(--df-text-primary);
  --once-text-secondary: var(--df-text-secondary);
  --once-text-muted: var(--df-text-tertiary);
  --once-accent: var(--df-neon-violet);
  --once-accent-glow: var(--df-glow-violet);
  --once-border: var(--df-border-default);
  --once-border-subtle: var(--df-border-subtle);
  --once-radius-md: var(--df-radius-md);
  --once-radius-lg: var(--df-radius-lg);
}
```

After this, every Once UI component automatically renders in DF colors with no per-component overrides.

## Worked examples

### 1. Layout primitives (Flex, Grid, Stack)

```tsx
'use client'
import { Flex, Grid, Column } from '@once-ui/core'

export function HeroLayout() {
  return (
    <Column gap="l" padding="xl" style={{ background: 'var(--df-bg-base)' }}>
      <Flex gap="m" align="center">
        <h1 style={{ color: 'var(--df-text-primary)', fontSize: 56, margin: 0 }}>Darkforge</h1>
        <span
          style={{
            background: 'var(--df-glass-bg)',
            border: '1px solid var(--df-glass-border)',
            color: 'var(--df-neon-violet)',
            padding: '4px 10px',
            borderRadius: 999,
            fontSize: 12,
          }}
        >
          v1.1
        </span>
      </Flex>
      <Grid columns="repeat(auto-fit, minmax(280px, 1fr))" gap="m">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              padding: 24,
              background: 'var(--df-glass-bg)',
              border: '1px solid var(--df-glass-border)',
              borderRadius: 'var(--df-radius-lg)',
            }}
          >
            <h3 style={{ color: 'var(--df-text-primary)' }}>Feature {i}</h3>
          </div>
        ))}
      </Grid>
    </Column>
  )
}
```

### 2. Scroll-triggered Section (cinematic transition)

```tsx
'use client'
import { Section } from '@once-ui/core'
import { useReducedMotion } from 'framer-motion'

export function CinematicSection() {
  const reduced = useReducedMotion()
  return (
    <Section
      transition={reduced ? 'none' : 'micro-medium'}
      // VERIFY: `transition` prop options in current Once UI docs.
      style={{
        background: 'var(--df-bg-base)',
        padding: '120px 24px',
      }}
      aria-labelledby="cinematic-heading"
    >
      <h2 id="cinematic-heading" style={{ fontSize: 64, color: 'var(--df-text-primary)' }}>
        Stack-aware. Senior-grade.
      </h2>
      <p style={{ color: 'var(--df-text-secondary)', maxWidth: 540, lineHeight: 1.6 }}>
        Once UI's scroll system reveals each section with cinematic timing.
      </p>
    </Section>
  )
}
```

### 3. Hero with parallax

```tsx
'use client'
import { Hero, Heading, Text, Button } from '@once-ui/core'

export function ParallaxHero() {
  return (
    <Hero
      parallax
      style={{
        background:
          'radial-gradient(ellipse at 50% 30%, rgba(167,139,250,0.18), transparent 60%), var(--df-bg-base)',
      }}
    >
      <Heading variant="display" style={{ color: 'var(--df-text-primary)' }}>
        Build dark UI in seconds.
      </Heading>
      <Text variant="body-l" style={{ color: 'var(--df-text-secondary)', maxWidth: 540 }}>
        AMOLED-first. Stack-aware. Production-grade.
      </Text>
      <Button
        variant="primary"
        size="lg"
        style={{ background: 'var(--df-neon-violet)', color: '#000', boxShadow: 'var(--df-glow-violet)' }}
      >
        Get started
      </Button>
    </Hero>
  )
}
```

### 4. Pricing tier card

```tsx
'use client'
import { Card, Heading, Text, Button } from '@once-ui/core'

export function ProTier() {
  return (
    <Card
      style={{
        background: 'var(--df-glass-bg)',
        border: '1px solid var(--df-neon-violet)',
        borderRadius: 'var(--df-radius-lg)',
        boxShadow: 'var(--df-glow-violet)',
        padding: 32,
        backdropFilter: 'blur(10px)',
      }}
    >
      <Text variant="label-s" style={{ color: 'var(--df-neon-violet)', textTransform: 'uppercase' }}>
        Pro
      </Text>
      <Heading variant="display-s" style={{ color: 'var(--df-text-primary)', margin: '12px 0 24px' }}>
        $49<span style={{ fontSize: 18, color: 'var(--df-text-tertiary)' }}>/mo</span>
      </Heading>
      <ul style={{ color: 'var(--df-text-secondary)', listStyle: 'none', padding: 0 }}>
        <li>Unlimited campaigns</li>
        <li>AI agent included</li>
        <li>Priority support</li>
      </ul>
      <Button variant="primary" fillWidth style={{ marginTop: 24 }}>
        Subscribe
      </Button>
    </Card>
  )
}
```

### 5. Animated stats counter

```tsx
'use client'
import { useEffect, useState } from 'react'
import { useReducedMotion } from 'framer-motion'

export function StatsCounter({ target, label }: { target: number; label: string }) {
  const [v, setV] = useState(0)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (reduced) {
      setV(target)
      return
    }
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 1100)
      setV(Math.round(target * (1 - Math.pow(1 - t, 3))))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, reduced])

  return (
    <div style={{ padding: 24, textAlign: 'center', background: 'var(--df-glass-bg)', borderRadius: 'var(--df-radius-lg)' }}>
      <p style={{ fontSize: 48, color: 'var(--df-neon-violet)', margin: 0, fontWeight: 600 }}>
        {v.toLocaleString()}
      </p>
      <p style={{ color: 'var(--df-text-tertiary)', fontSize: 13, margin: 0 }}>{label}</p>
    </div>
  )
}
```

### 6. Glass card with violet glow

```tsx
'use client'
import { motion, useReducedMotion } from 'framer-motion'

export function GlassCard({ title, children }: { title: string; children: React.ReactNode }) {
  const reduced = useReducedMotion()
  return (
    <motion.div
      whileHover={reduced ? undefined : { y: -4 }}
      style={{
        padding: 24,
        background: 'var(--df-glass-bg)',
        backdropFilter: 'blur(16px)',
        border: '1px solid var(--df-glass-border)',
        borderRadius: 'var(--df-radius-lg)',
        transition: 'border-color 200ms, box-shadow 200ms',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--df-neon-violet)'
        e.currentTarget.style.boxShadow = 'var(--df-glow-violet)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--df-glass-border)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      <h3 style={{ color: 'var(--df-text-primary)', margin: '0 0 8px' }}>{title}</h3>
      <div style={{ color: 'var(--df-text-secondary)' }}>{children}</div>
    </motion.div>
  )
}
```

### 7. Form input with focus ring

```tsx
'use client'
import { Input, Label, Column } from '@once-ui/core'

export function NewsletterInput() {
  return (
    <Column gap="xs">
      <Label htmlFor="newsletter" style={{ color: 'var(--df-text-secondary)' }}>
        Email
      </Label>
      <Input
        id="newsletter"
        type="email"
        placeholder="you@example.com"
        style={{
          background: 'var(--df-bg-elev-1)',
          border: '1px solid var(--df-border-default)',
          color: 'var(--df-text-primary)',
        }}
        // VERIFY: focus styles in Once UI may need a `focusStyle` slot or use CSS.
      />
    </Column>
  )
}
```

### 8. Footer with social links

```tsx
import { Flex, Text } from '@once-ui/core'

export function SiteFooter() {
  return (
    <footer
      style={{
        padding: '60px 24px',
        background: 'var(--df-bg-elev-1)',
        borderTop: '1px solid var(--df-border-subtle)',
      }}
    >
      <Flex justify="space-between" align="center" gap="m">
        <Text variant="body-s" style={{ color: 'var(--df-text-tertiary)' }}>
          © 2026 Darkforge. MIT.
        </Text>
        <Flex gap="m">
          {['GitHub', 'Twitter', 'Discord'].map((label) => (
            <a
              key={label}
              href="#"
              style={{ color: 'var(--df-text-secondary)', textDecoration: 'none', fontSize: 14 }}
            >
              {label}
            </a>
          ))}
        </Flex>
      </Flex>
    </footer>
  )
}
```

## Scroll storytelling recipe

The signature Once UI pattern: a sequence of full-viewport sections that reveal cinematically as the user scrolls. Combine Once UI's `<Section transition>` with our Lenis integration (`references/26-lenis-smooth-scroll.md`):

```tsx
'use client'
import { Section, Heading, Text } from '@once-ui/core'
import { useReducedMotion } from 'framer-motion'

export function ScrollStory() {
  const reduced = useReducedMotion()
  const sections = [
    { title: 'Stack-aware.', body: 'Reads your package.json on first call.' },
    { title: 'AMOLED dark.', body: 'True-black backdrop. Neon accent. Glass surfaces.' },
    { title: 'Production-grade.', body: 'Every component is typed, accessible, responsive.' },
  ]

  return (
    <>
      {sections.map((s, i) => (
        <Section
          key={i}
          transition={reduced ? 'none' : 'macro-medium'}
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '0 24px',
            background: 'var(--df-bg-base)',
          }}
          aria-labelledby={`section-${i}`}
        >
          <Heading id={`section-${i}`} variant="display" style={{ color: 'var(--df-text-primary)' }}>
            {s.title}
          </Heading>
          <Text variant="body-l" style={{ color: 'var(--df-text-secondary)', maxWidth: 600 }}>
            {s.body}
          </Text>
        </Section>
      ))}
    </>
  )
}
```

Pair with `<SmoothScrollProvider>` from the Lenis reference for the full premium feel.

## Pitfalls

| Pitfall | Fix |
|---|---|
| Components render unstyled | `<OnceUIProvider>` not wrapping app, OR `@once-ui/core/styles.css` not imported |
| DF colors not applied | The CSS bridge mapping `--once-*` → `var(--df-*)` must be in your `globals.css` |
| Sections don't transition | `data-theme="dark"` not on `<html>`, OR `transition` prop value not recognized — VERIFY |
| Hot reload breaks scroll positions | Once UI's scroll system caches scroll state; reload page on dev |
| CLI `npx once-ui add` fails | VERIFY current command in Once UI docs — exact name may differ |

## Cross-references

- `references/00-dark-tokens.md` — DF token system used in the bridge
- `references/26-lenis-smooth-scroll.md` — pair Once UI scroll storytelling with Lenis smooth-scroll
- `references/08-shadcn-dark.md` — alternative when you want primitives instead of full system
- `references/patterns/scroll-story.md` — section-level scroll narrative recipes
- `references/18-light-theme.md` — runtime-flippable light theme via `[data-theme="light"]` override; Once UI components flip alongside the rest of the system
