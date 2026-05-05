# Darkforge — Call-to-Action Patterns
Six dark CTA variants — full-width band, glow card, sticky bar, split, newsletter, exit-intent.
Drop-in, mobile-first, accessibility-built-in. Pair with `00-dark-tokens.md` and `hero.md`.

## Contents

- [Source caveat](#source-caveat)
- [Required reads](#required-reads)
- [Pattern 1 — Full-Width Gradient Band](#pattern-1-full-width-gradient-band)
- [Pattern 2 — Glow Card (centered)](#pattern-2-glow-card-centered)
- [Pattern 3 — Floating Sticky Bar](#pattern-3-floating-sticky-bar)
- [Pattern 4 — Mid-Page Split CTA](#pattern-4-mid-page-split-cta)
- [Pattern 5 — Newsletter Signup (inline)](#pattern-5-newsletter-signup-inline)
- [Pattern 6 — Exit-Intent Modal](#pattern-6-exit-intent-modal)
- [Cross-References](#cross-references)

---

## Source caveat

These patterns are written from training data only. `context7` and `WebFetch` were denied
during authoring, so any library-specific API surface (Framer Motion hooks, Aceternity
`MovingBorder`, magic-ui `ShimmerButton`) is annotated with `// VERIFY:` next to the call
site. **Run a quick docs check before shipping** — type signatures and import paths drift
between minor versions.

## Required reads

Read these first; the patterns assume they're already loaded:

- `skills/forge/references/00-dark-tokens.md` — every `--df-*` variable used below is defined there.
- `skills/forge/references/patterns/hero.md` — entrance-animation conventions and gradient-orb idioms reused below.

---

## Pattern 1 — Full-Width Gradient Band

Section spans full viewport width with a DF violet → cyan → pink mesh gradient background.
Big headline, supporting line, dual CTAs (solid + ghost), social proof underneath.

```tsx
// skills/forge/components/cta/CtaGradientBand.tsx
'use client'

import { motion, useReducedMotion } from 'framer-motion' // VERIFY: framer-motion ^11

export interface CtaGradientBandProps {
  eyebrow?: string
  headline: string
  subline?: string
  primaryLabel: string
  primaryHref?: string
  secondaryLabel?: string
  secondaryHref?: string
  proofText?: string
  onPrimary?: () => void
  onSecondary?: () => void
}

export function CtaGradientBand({
  eyebrow = 'Ready when you are',
  headline,
  subline,
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref,
  proofText = 'Trusted by 4,000+ teams shipping daily',
  onPrimary,
  onSecondary,
}: CtaGradientBandProps) {
  const reduce = useReducedMotion() // VERIFY: useReducedMotion exported from framer-motion

  const fade = reduce
    ? { initial: false, animate: { opacity: 1, y: 0 } }
    : {
        initial: { opacity: 0, y: 16 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: '-80px' },
        transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
      }

  return (
    <section
      aria-labelledby="cta-band-headline"
      style={{
        position: 'relative',
        width: '100%',
        background: 'var(--df-bg-base)',
        overflow: 'hidden',
        padding: 'clamp(64px, 10vw, 128px) 24px',
      }}
    >
      {/* Mesh gradient orbs — violet, cyan, pink */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '-20%',
          left: '10%',
          width: 'min(640px, 80vw)',
          height: 'min(640px, 80vw)',
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(167,139,250,0.22) 0%, transparent 65%)',
          filter: 'blur(8px)',
          pointerEvents: 'none',
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: '-30%',
          right: '-10%',
          width: 'min(720px, 90vw)',
          height: 'min(720px, 90vw)',
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(34,211,238,0.16) 0%, transparent 65%)',
          filter: 'blur(8px)',
          pointerEvents: 'none',
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '40%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(420px, 70vw)',
          height: 'min(420px, 70vw)',
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(244,114,182,0.12) 0%, transparent 65%)',
          filter: 'blur(8px)',
          pointerEvents: 'none',
        }}
      />

      <motion.div
        {...fade}
        style={{
          position: 'relative',
          maxWidth: 920,
          margin: '0 auto',
          textAlign: 'center',
          zIndex: 1,
        }}
      >
        <p
          style={{
            color: 'var(--df-neon-violet)',
            fontSize: 13,
            fontWeight: 500,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            margin: '0 0 16px',
          }}
        >
          {eyebrow}
        </p>

        <h2
          id="cta-band-headline"
          style={{
            color: 'var(--df-text-primary)',
            fontSize: 'clamp(32px, 5vw, 56px)',
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: '-0.025em',
            margin: '0 0 20px',
          }}
        >
          {headline}
        </h2>

        {subline && (
          <p
            style={{
              color: 'var(--df-text-secondary)',
              fontSize: 'clamp(16px, 2vw, 19px)',
              lineHeight: 1.6,
              maxWidth: 620,
              margin: '0 auto 36px',
            }}
          >
            {subline}
          </p>
        )}

        <div
          style={{
            display: 'flex',
            gap: 12,
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          <a
            href={primaryHref}
            onClick={onPrimary}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'var(--df-neon-violet)',
              color: 'var(--df-text-inverse)',
              border: 'none',
              borderRadius: 'var(--df-radius-md)',
              padding: '14px 28px',
              fontSize: 15,
              fontWeight: 600,
              textDecoration: 'none',
              cursor: 'pointer',
              boxShadow: 'var(--df-glow-violet)',
              transition:
                'transform var(--df-duration-fast) var(--df-ease-out), box-shadow var(--df-duration-base) var(--df-ease-out)',
            }}
            onMouseEnter={(e) => {
              if (reduce) return
              e.currentTarget.style.transform = 'translateY(-1px)'
              e.currentTarget.style.boxShadow = 'var(--df-glow-violet-lg)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'var(--df-glow-violet)'
            }}
            onFocus={(e) => {
              e.currentTarget.style.outline = `2px solid var(--df-border-focus)`
              e.currentTarget.style.outlineOffset = '3px'
            }}
            onBlur={(e) => {
              e.currentTarget.style.outline = 'none'
            }}
          >
            {primaryLabel}
            <span aria-hidden="true">→</span>
          </a>

          {secondaryLabel && (
            <a
              href={secondaryHref}
              onClick={onSecondary}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: 'var(--df-glass-bg)',
                color: 'var(--df-text-primary)',
                border: '1px solid var(--df-border-default)',
                backdropFilter: 'blur(12px)',
                borderRadius: 'var(--df-radius-md)',
                padding: '14px 28px',
                fontSize: 15,
                fontWeight: 500,
                textDecoration: 'none',
                cursor: 'pointer',
                transition:
                  'border-color var(--df-duration-fast) var(--df-ease-out), background var(--df-duration-fast) var(--df-ease-out)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--df-border-strong)'
                e.currentTarget.style.background = 'var(--df-glass-bg-md)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--df-border-default)'
                e.currentTarget.style.background = 'var(--df-glass-bg)'
              }}
            >
              {secondaryLabel}
            </a>
          )}
        </div>

        {proofText && (
          <p
            style={{
              color: 'var(--df-text-muted)',
              fontSize: 13,
              margin: '36px 0 0',
            }}
          >
            {proofText}
          </p>
        )}
      </motion.div>
    </section>
  )
}
```

**Usage**

```tsx
<CtaGradientBand
  headline="Ship 10x faster with AI-native tooling"
  subline="The platform engineering teams trust to automate workflows, deploy safely, and scale without bloat."
  primaryLabel="Start free trial"
  primaryHref="/signup"
  secondaryLabel="Book a demo"
  secondaryHref="/demo"
/>
```

---

## Pattern 2 — Glow Card (centered)

A single card centered on AMOLED background, intense violet border glow, magnetic-style
button as the primary CTA. Best as a stand-alone section between content blocks.

```tsx
// skills/forge/components/cta/CtaGlowCard.tsx
'use client'

import { useRef } from 'react'
import { motion, useReducedMotion } from 'framer-motion' // VERIFY: framer-motion ^11

export interface CtaGlowCardProps {
  badge?: string
  headline: string
  subline?: string
  primaryLabel: string
  primaryHref?: string
  onPrimary?: () => void
}

export function CtaGlowCard({
  badge = 'Limited launch pricing',
  headline,
  subline,
  primaryLabel,
  primaryHref,
  onPrimary,
}: CtaGlowCardProps) {
  const reduce = useReducedMotion() // VERIFY:
  const btnRef = useRef<HTMLAnchorElement>(null)

  // Magnetic effect — button drifts toward cursor
  const handleMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (reduce || !btnRef.current) return
    const rect = btnRef.current.getBoundingClientRect()
    const x = e.clientX - (rect.left + rect.width / 2)
    const y = e.clientY - (rect.top + rect.height / 2)
    btnRef.current.style.transform = `translate(${x * 0.18}px, ${y * 0.32}px)`
  }
  const handleLeave = () => {
    if (!btnRef.current) return
    btnRef.current.style.transform = 'translate(0, 0)'
  }

  return (
    <section
      aria-labelledby="cta-glow-headline"
      style={{
        background: 'var(--df-bg-base)',
        padding: 'clamp(64px, 10vw, 120px) 24px',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <motion.div
        initial={reduce ? false : { opacity: 0, scale: 0.97, y: 16 }}
        whileInView={{ opacity: 1, scale: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 720,
          background: 'var(--df-bg-surface)',
          border: '1px solid rgba(167,139,250,0.35)',
          borderRadius: 'var(--df-radius-xl)',
          padding: 'clamp(32px, 5vw, 64px)',
          textAlign: 'center',
          boxShadow:
            '0 0 0 1px rgba(167,139,250,0.12), 0 0 60px rgba(167,139,250,0.18), 0 0 120px rgba(167,139,250,0.08)',
        }}
      >
        {/* Inner gradient halo */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 'inherit',
            background:
              'radial-gradient(circle at 50% 0%, rgba(167,139,250,0.12) 0%, transparent 60%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ position: 'relative' }}>
          {badge && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: 'rgba(167,139,250,0.1)',
                border: '1px solid rgba(167,139,250,0.25)',
                borderRadius: 'var(--df-radius-full)',
                padding: '4px 14px',
                color: 'var(--df-neon-violet)',
                fontSize: 12,
                fontWeight: 500,
                marginBottom: 20,
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: 'var(--df-neon-violet)',
                  boxShadow: 'var(--df-glow-violet)',
                }}
              />
              {badge}
            </span>
          )}

          <h2
            id="cta-glow-headline"
            style={{
              color: 'var(--df-text-primary)',
              fontSize: 'clamp(28px, 4vw, 44px)',
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              margin: '0 0 16px',
            }}
          >
            {headline}
          </h2>

          {subline && (
            <p
              style={{
                color: 'var(--df-text-secondary)',
                fontSize: 17,
                lineHeight: 1.6,
                maxWidth: 480,
                margin: '0 auto 32px',
              }}
            >
              {subline}
            </p>
          )}

          <a
            ref={btnRef}
            href={primaryHref}
            onClick={onPrimary}
            onMouseMove={handleMove}
            onMouseLeave={handleLeave}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background:
                'linear-gradient(135deg, var(--df-neon-violet), var(--df-neon-cyan))',
              color: 'var(--df-text-inverse)',
              border: 'none',
              borderRadius: 'var(--df-radius-md)',
              padding: '14px 32px',
              fontSize: 15,
              fontWeight: 700,
              textDecoration: 'none',
              cursor: 'pointer',
              boxShadow: '0 0 30px rgba(167,139,250,0.45)',
              transition:
                'transform var(--df-duration-base) var(--df-ease-spring), box-shadow var(--df-duration-base) var(--df-ease-out)',
              willChange: 'transform',
            }}
            onFocus={(e) => {
              e.currentTarget.style.outline = `2px solid var(--df-border-focus)`
              e.currentTarget.style.outlineOffset = '4px'
            }}
            onBlur={(e) => {
              e.currentTarget.style.outline = 'none'
            }}
          >
            {primaryLabel}
            <span aria-hidden="true">→</span>
          </a>

          <p
            style={{
              color: 'var(--df-text-muted)',
              fontSize: 12,
              margin: '20px 0 0',
            }}
          >
            No credit card required · Cancel anytime
          </p>
        </div>
      </motion.div>
    </section>
  )
}
```

**Usage**

```tsx
<CtaGlowCard
  headline="Start your 14-day free trial"
  subline="Get instant access to every feature. No credit card. No commitment."
  primaryLabel="Start free trial"
  primaryHref="/signup"
/>
```

> Alt — replace the `<a>` with Aceternity `<MovingBorder>` for an animated rotating
> gradient border. See cross-references at the bottom. // VERIFY: aceternity-ui MovingBorder API.

---

## Pattern 3 — Floating Sticky Bar

Bottom-fixed bar that appears after the user scrolls past the hero. Backdrop-blurred,
dismissible, slide-up entrance via Framer.

```tsx
// skills/forge/components/cta/CtaStickyBar.tsx
'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion' // VERIFY: framer-motion ^11

export interface CtaStickyBarProps {
  /** Pixels scrolled before the bar shows (defaults to 600). */
  threshold?: number
  /** sessionStorage key — when present, the bar stays dismissed for the session. */
  storageKey?: string
  message: string
  ctaLabel: string
  ctaHref?: string
  onCta?: () => void
}

export function CtaStickyBar({
  threshold = 600,
  storageKey = 'nx-cta-bar-dismissed',
  message,
  ctaLabel,
  ctaHref,
  onCta,
}: CtaStickyBarProps) {
  const reduce = useReducedMotion() // VERIFY:
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.sessionStorage.getItem(storageKey) === '1') {
      setDismissed(true)
      return
    }

    const onScroll = () => {
      setVisible(window.scrollY > threshold)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [threshold, storageKey])

  const handleDismiss = () => {
    setDismissed(true)
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(storageKey, '1')
    }
  }

  if (dismissed) return null

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role="region"
          aria-label="Promotional banner"
          initial={reduce ? false : { y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={reduce ? { opacity: 0 } : { y: 80, opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: 'fixed',
            left: 16,
            right: 16,
            bottom: 16,
            margin: '0 auto',
            maxWidth: 760,
            zIndex: 'var(--df-z-sticky)' as unknown as number,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              background: 'rgba(8, 8, 8, 0.85)',
              border: '1px solid var(--df-border-default)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              borderRadius: 'var(--df-radius-lg)',
              padding: '12px 12px 12px 20px',
              boxShadow: '0 16px 48px rgba(0,0,0,0.6), var(--df-glow-violet)',
            }}
          >
            <span
              aria-hidden="true"
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: 'var(--df-neon-violet)',
                boxShadow: 'var(--df-glow-violet)',
                flexShrink: 0,
              }}
            />

            <p
              style={{
                flex: 1,
                color: 'var(--df-text-primary)',
                fontSize: 14,
                lineHeight: 1.45,
                margin: 0,
              }}
            >
              {message}
            </p>

            <a
              href={ctaHref}
              onClick={onCta}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: 'var(--df-neon-violet)',
                color: 'var(--df-text-inverse)',
                border: 'none',
                borderRadius: 'var(--df-radius-sm)',
                padding: '8px 16px',
                fontSize: 13,
                fontWeight: 600,
                textDecoration: 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {ctaLabel}
              <span aria-hidden="true">→</span>
            </a>

            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Dismiss promotional banner"
              style={{
                width: 32,
                height: 32,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                border: 'none',
                borderRadius: 'var(--df-radius-sm)',
                color: 'var(--df-text-secondary)',
                cursor: 'pointer',
                transition: 'background var(--df-duration-fast) var(--df-ease-out)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--df-bg-hover)'
                e.currentTarget.style.color = 'var(--df-text-primary)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = 'var(--df-text-secondary)'
              }}
              onFocus={(e) => {
                e.currentTarget.style.outline = `2px solid var(--df-border-focus)`
                e.currentTarget.style.outlineOffset = '2px'
              }}
              onBlur={(e) => {
                e.currentTarget.style.outline = 'none'
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M1 1L13 13M1 13L13 1"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

**Usage** — mount once at the app root (e.g. `app/layout.tsx`):

```tsx
<CtaStickyBar
  message="Black Friday — 40% off Pro for 48 hours."
  ctaLabel="Claim discount"
  ctaHref="/pricing"
/>
```

---

## Pattern 4 — Mid-Page Split CTA

Two-column layout: text + CTA on the left, animated product visual on the right. Whole
section sits inside one large glass card. Stacks to single column under 768px.

```tsx
// skills/forge/components/cta/CtaSplit.tsx
'use client'

import { motion, useReducedMotion } from 'framer-motion' // VERIFY: framer-motion ^11

export interface CtaSplitProps {
  eyebrow?: string
  headline: string
  subline: string
  bullets?: string[]
  primaryLabel: string
  primaryHref?: string
  secondaryLabel?: string
  secondaryHref?: string
}

export function CtaSplit({
  eyebrow = 'For product teams',
  headline,
  subline,
  bullets = [
    'Real-time collaboration',
    'Built-in audit trail',
    'SSO + SCIM included',
  ],
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref,
}: CtaSplitProps) {
  const reduce = useReducedMotion() // VERIFY:

  return (
    <section
      aria-labelledby="cta-split-headline"
      style={{
        background: 'var(--df-bg-base)',
        padding: 'clamp(64px, 8vw, 96px) 24px',
      }}
    >
      <div
        className="nx-cta-split-grid"
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          background: 'var(--df-glass-bg-md)',
          border: '1px solid var(--df-glass-border-md)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          borderRadius: 'var(--df-radius-2xl)',
          padding: 'clamp(32px, 5vw, 64px)',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
          gap: 48,
          alignItems: 'center',
        }}
      >
        {/* Left — copy */}
        <motion.div
          initial={reduce ? false : { opacity: 0, x: -16 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <p
            style={{
              color: 'var(--df-neon-cyan)',
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              margin: '0 0 16px',
            }}
          >
            {eyebrow}
          </p>

          <h2
            id="cta-split-headline"
            style={{
              color: 'var(--df-text-primary)',
              fontSize: 'clamp(26px, 3.5vw, 40px)',
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              margin: '0 0 16px',
            }}
          >
            {headline}
          </h2>

          <p
            style={{
              color: 'var(--df-text-secondary)',
              fontSize: 17,
              lineHeight: 1.65,
              margin: '0 0 24px',
            }}
          >
            {subline}
          </p>

          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: '0 0 32px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            {bullets.map((b) => (
              <li
                key={b}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  color: 'var(--df-text-primary)',
                  fontSize: 14,
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    background: 'rgba(74,222,128,0.15)',
                    color: 'var(--df-neon-green)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    flexShrink: 0,
                  }}
                >
                  ✓
                </span>
                {b}
              </li>
            ))}
          </ul>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <a
              href={primaryHref}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: 'var(--df-neon-violet)',
                color: 'var(--df-text-inverse)',
                border: 'none',
                borderRadius: 'var(--df-radius-md)',
                padding: '12px 24px',
                fontSize: 15,
                fontWeight: 600,
                textDecoration: 'none',
                boxShadow: 'var(--df-glow-violet)',
              }}
            >
              {primaryLabel} <span aria-hidden="true">→</span>
            </a>
            {secondaryLabel && (
              <a
                href={secondaryHref}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  background: 'transparent',
                  color: 'var(--df-text-primary)',
                  border: '1px solid var(--df-border-default)',
                  borderRadius: 'var(--df-radius-md)',
                  padding: '12px 24px',
                  fontSize: 15,
                  fontWeight: 500,
                  textDecoration: 'none',
                }}
              >
                {secondaryLabel}
              </a>
            )}
          </div>
        </motion.div>

        {/* Right — animated product mockup */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 24, scale: 0.96 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          aria-hidden="true"
          style={{
            position: 'relative',
            background: 'var(--df-bg-elevated)',
            border: '1px solid var(--df-border-default)',
            borderRadius: 'var(--df-radius-xl)',
            padding: 24,
            boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
            overflow: 'hidden',
          }}
        >
          {/* Faux window chrome */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
            {['#f87171', '#fbbf24', '#4ade80'].map((c) => (
              <span
                key={c}
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: c,
                  opacity: 0.6,
                }}
              />
            ))}
          </div>

          {/* Faux dashboard */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div
              style={{
                height: 14,
                width: '60%',
                background: 'var(--df-border-default)',
                borderRadius: 4,
              }}
            />
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: 12,
                marginTop: 8,
              }}
            >
              {[
                'var(--df-neon-violet)',
                'var(--df-neon-cyan)',
                'var(--df-neon-pink)',
              ].map((c) => (
                <div
                  key={c}
                  style={{
                    height: 72,
                    background: `linear-gradient(135deg, ${c}33, transparent)`,
                    border: `1px solid ${c}55`,
                    borderRadius: 'var(--df-radius-md)',
                  }}
                />
              ))}
            </div>
            <div
              style={{
                height: 120,
                background:
                  'linear-gradient(180deg, rgba(167,139,250,0.08), transparent)',
                border: '1px solid var(--df-border-subtle)',
                borderRadius: 'var(--df-radius-md)',
                marginTop: 8,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Pulsing dot — soft heartbeat indicator */}
              <motion.span
                animate={
                  reduce
                    ? undefined
                    : { opacity: [0.4, 1, 0.4], scale: [1, 1.4, 1] }
                }
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: 'var(--df-neon-green)',
                  boxShadow: 'var(--df-glow-green)',
                  display: 'inline-block',
                }}
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Mobile collapse */}
      <style>{`
        @media (max-width: 768px) {
          .nx-cta-split-grid {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
          }
        }
      `}</style>
    </section>
  )
}
```

**Usage**

```tsx
<CtaSplit
  headline="The dashboard that actually moves the needle"
  subline="Stop fighting your tools. Darkforge generates the UI; you ship the product."
  primaryLabel="Get instant access"
  primaryHref="/signup"
  secondaryLabel="See live demo"
  secondaryHref="/demo"
/>
```

---

## Pattern 5 — Newsletter Signup (inline)

Compact inline form: heading + supporting line + email input + violet submit.
Real form state, real validation, success state with `aria-live`.

```tsx
// skills/forge/components/cta/CtaNewsletter.tsx
'use client'

import { useId, useState } from 'react'

type Status = 'idle' | 'submitting' | 'success' | 'error'

export interface CtaNewsletterProps {
  heading?: string
  subline?: string
  /** Replace with a real submit (POST to /api/subscribe etc). */
  onSubmit?: (email: string) => Promise<void>
}

export function CtaNewsletter({
  heading = 'Get the weekly Darkforge digest',
  subline = 'New patterns, shipped components, and dark-UI tips. One email, no spam, easy unsubscribe.',
  onSubmit,
}: CtaNewsletterProps) {
  const inputId = useId()
  const errorId = useId()

  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const validate = (value: string): string | null => {
    if (!value.trim()) return 'Please enter your email'
    // Light client-side validation — server is source of truth
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
    return ok ? null : 'Please enter a valid email address'
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const err = validate(email)
    if (err) {
      setErrorMsg(err)
      setStatus('error')
      return
    }
    setErrorMsg(null)
    setStatus('submitting')
    try {
      if (onSubmit) {
        await onSubmit(email.trim())
      } else {
        // Default — simulated success so the demo works out of the box
        await new Promise((r) => setTimeout(r, 600))
      }
      setStatus('success')
    } catch {
      setErrorMsg('Something went wrong. Please try again.')
      setStatus('error')
    }
  }

  return (
    <section
      aria-labelledby={`${inputId}-heading`}
      style={{
        background: 'var(--df-bg-base)',
        padding: 'clamp(48px, 8vw, 96px) 24px',
      }}
    >
      <div
        style={{
          maxWidth: 640,
          margin: '0 auto',
          textAlign: 'center',
        }}
      >
        <h2
          id={`${inputId}-heading`}
          style={{
            color: 'var(--df-text-primary)',
            fontSize: 'clamp(24px, 3vw, 32px)',
            fontWeight: 700,
            letterSpacing: '-0.015em',
            margin: '0 0 12px',
          }}
        >
          {heading}
        </h2>
        <p
          style={{
            color: 'var(--df-text-secondary)',
            fontSize: 16,
            lineHeight: 1.6,
            margin: '0 0 28px',
          }}
        >
          {subline}
        </p>

        {status === 'success' ? (
          <div
            role="status"
            aria-live="polite"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 12,
              background: 'rgba(74,222,128,0.08)',
              border: '1px solid rgba(74,222,128,0.3)',
              borderRadius: 'var(--df-radius-lg)',
              padding: '14px 22px',
              color: 'var(--df-text-primary)',
            }}
          >
            <span
              aria-hidden="true"
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: 'rgba(74,222,128,0.18)',
                color: 'var(--df-neon-green)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--df-glow-green)',
                flexShrink: 0,
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M2 7.5L5.5 11L12 3.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span style={{ fontSize: 15 }}>
              You're in. Check your inbox to confirm.
            </span>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            noValidate
            style={{
              display: 'flex',
              gap: 8,
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            <label htmlFor={inputId} className="nx-sr-only">
              Email address
            </label>

            <input
              id={inputId}
              type="email"
              name="email"
              required
              inputMode="email"
              autoComplete="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (status === 'error') setStatus('idle')
              }}
              aria-invalid={status === 'error'}
              aria-describedby={status === 'error' ? errorId : undefined}
              disabled={status === 'submitting'}
              style={{
                flex: '1 1 280px',
                minWidth: 0,
                background: 'var(--df-bg-elevated)',
                border: `1px solid ${
                  status === 'error'
                    ? 'var(--df-neon-red)'
                    : 'var(--df-border-default)'
                }`,
                borderRadius: 'var(--df-radius-md)',
                padding: '12px 16px',
                color: 'var(--df-text-primary)',
                fontSize: 15,
                outline: 'none',
                transition:
                  'border-color var(--df-duration-fast) var(--df-ease-out), box-shadow var(--df-duration-fast) var(--df-ease-out)',
              }}
              onFocus={(e) => {
                if (status !== 'error') {
                  e.currentTarget.style.borderColor = 'var(--df-border-focus)'
                  e.currentTarget.style.boxShadow =
                    '0 0 0 3px rgba(167,139,250,0.15)'
                }
              }}
              onBlur={(e) => {
                if (status !== 'error') {
                  e.currentTarget.style.borderColor = 'var(--df-border-default)'
                  e.currentTarget.style.boxShadow = 'none'
                }
              }}
            />

            <button
              type="submit"
              disabled={status === 'submitting'}
              style={{
                background: 'var(--df-neon-violet)',
                color: 'var(--df-text-inverse)',
                border: 'none',
                borderRadius: 'var(--df-radius-md)',
                padding: '12px 24px',
                fontSize: 15,
                fontWeight: 600,
                cursor: status === 'submitting' ? 'wait' : 'pointer',
                opacity: status === 'submitting' ? 0.7 : 1,
                boxShadow: 'var(--df-glow-violet)',
                whiteSpace: 'nowrap',
                transition:
                  'transform var(--df-duration-fast) var(--df-ease-out), box-shadow var(--df-duration-base) var(--df-ease-out)',
              }}
            >
              {status === 'submitting' ? 'Subscribing…' : 'Subscribe'}
            </button>
          </form>
        )}

        {status === 'error' && errorMsg && (
          <p
            id={errorId}
            role="alert"
            style={{
              color: 'var(--df-neon-red)',
              fontSize: 13,
              margin: '12px 0 0',
            }}
          >
            {errorMsg}
          </p>
        )}

        <p
          style={{
            color: 'var(--df-text-muted)',
            fontSize: 12,
            margin: '20px 0 0',
          }}
        >
          Join 4,000+ builders. We respect your inbox.
        </p>
      </div>

      {/* sr-only utility — keep co-located so the file is drop-in */}
      <style>{`
        .nx-sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
      `}</style>
    </section>
  )
}
```

**Usage**

```tsx
<CtaNewsletter
  onSubmit={async (email) => {
    await fetch('/api/subscribe', { method: 'POST', body: JSON.stringify({ email }) })
  }}
/>
```

---

## Pattern 6 — Exit-Intent Modal

Dark overlay modal triggered when the cursor leaves the viewport (desktop) or after a
fast scroll-up (mobile). Full focus management — trap, restore, Esc to close.
**Use sparingly** — at most once per session, dismissable, never on first visit.

```tsx
// skills/forge/components/cta/CtaExitIntent.tsx
'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion' // VERIFY: framer-motion ^11

export interface CtaExitIntentProps {
  storageKey?: string
  /** Skip on first visit — only enable after this many seconds on the page. */
  armAfterMs?: number
  headline: string
  subline: string
  offerLabel?: string
  primaryLabel: string
  primaryHref?: string
  onPrimary?: () => void
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function CtaExitIntent({
  storageKey = 'nx-exit-intent-shown',
  armAfterMs = 5000,
  headline,
  subline,
  offerLabel = 'Limited offer',
  primaryLabel,
  primaryHref,
  onPrimary,
}: CtaExitIntentProps) {
  const reduce = useReducedMotion() // VERIFY:
  const titleId = useId()
  const descId = useId()

  const [open, setOpen] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)
  const armed = useRef(false)
  const lastScrollY = useRef(0)

  // Open guard — sessionStorage so we only fire once per session
  const shouldOpen = useCallback(() => {
    if (typeof window === 'undefined') return false
    if (window.sessionStorage.getItem(storageKey) === '1') return false
    return armed.current
  }, [storageKey])

  // Mount: arm after delay, then bind exit listeners
  useEffect(() => {
    if (typeof window === 'undefined') return

    const armTimer = window.setTimeout(() => {
      armed.current = true
    }, armAfterMs)

    const onMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && shouldOpen()) {
        setOpen(true)
      }
    }
    const onScroll = () => {
      const y = window.scrollY
      const delta = lastScrollY.current - y
      lastScrollY.current = y
      // Mobile heuristic — fast upward swipe near the top
      if (y < 200 && delta > 30 && shouldOpen()) {
        setOpen(true)
      }
    }

    document.addEventListener('mouseleave', onMouseLeave)
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      window.clearTimeout(armTimer)
      document.removeEventListener('mouseleave', onMouseLeave)
      window.removeEventListener('scroll', onScroll)
    }
  }, [armAfterMs, shouldOpen])

  // When open: mark session-shown, freeze body scroll, capture focus,
  // wire Esc + focus trap. On close: restore everything.
  useEffect(() => {
    if (!open) return

    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(storageKey, '1')
    }

    previouslyFocused.current =
      (document.activeElement as HTMLElement | null) ?? null

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    // Defer focus to next frame so the dialog is mounted
    const focusFrame = window.requestAnimationFrame(() => {
      const node = dialogRef.current
      if (!node) return
      const focusables = node.querySelectorAll<HTMLElement>(FOCUSABLE)
      if (focusables.length > 0) {
        focusables[0].focus()
      } else {
        node.focus()
      }
    })

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        setOpen(false)
        return
      }
      if (e.key !== 'Tab') return

      const node = dialogRef.current
      if (!node) return
      const focusables = Array.from(
        node.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((el) => !el.hasAttribute('disabled'))
      if (focusables.length === 0) {
        e.preventDefault()
        return
      }
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      const active = document.activeElement as HTMLElement | null

      if (e.shiftKey) {
        if (active === first || !node.contains(active)) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (active === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', onKeyDown)

    return () => {
      window.cancelAnimationFrame(focusFrame)
      document.body.style.overflow = prevOverflow
      document.removeEventListener('keydown', onKeyDown)
      // Restore focus
      previouslyFocused.current?.focus?.()
    }
  }, [open, storageKey])

  const close = useCallback(() => setOpen(false), [])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="overlay"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={close}
          aria-hidden="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 'var(--df-z-overlay)' as unknown as number,
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <motion.div
            key="dialog"
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descId}
            tabIndex={-1}
            onClick={(e) => e.stopPropagation()}
            initial={reduce ? false : { opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={
              reduce
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.96, y: 12, transition: { duration: 0.2 } }
            }
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: 480,
              background: 'var(--df-bg-overlay)',
              border: '1px solid rgba(167,139,250,0.3)',
              borderRadius: 'var(--df-radius-xl)',
              padding: 'clamp(24px, 4vw, 40px)',
              boxShadow:
                '0 32px 80px rgba(0,0,0,0.7), 0 0 60px rgba(167,139,250,0.2)',
              zIndex: 'var(--df-z-modal)' as unknown as number,
            }}
          >
            {/* Close */}
            <button
              type="button"
              onClick={close}
              aria-label="Close dialog"
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                width: 36,
                height: 36,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                border: 'none',
                borderRadius: 'var(--df-radius-sm)',
                color: 'var(--df-text-secondary)',
                cursor: 'pointer',
                transition: 'background var(--df-duration-fast) var(--df-ease-out)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--df-bg-hover)'
                e.currentTarget.style.color = 'var(--df-text-primary)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = 'var(--df-text-secondary)'
              }}
              onFocus={(e) => {
                e.currentTarget.style.outline = `2px solid var(--df-border-focus)`
                e.currentTarget.style.outlineOffset = '2px'
              }}
              onBlur={(e) => {
                e.currentTarget.style.outline = 'none'
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M1 1L13 13M1 13L13 1"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </button>

            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: 'rgba(244,114,182,0.12)',
                border: '1px solid rgba(244,114,182,0.3)',
                borderRadius: 'var(--df-radius-full)',
                padding: '4px 12px',
                color: 'var(--df-neon-pink)',
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                marginBottom: 16,
              }}
            >
              {offerLabel}
            </span>

            <h2
              id={titleId}
              style={{
                color: 'var(--df-text-primary)',
                fontSize: 'clamp(22px, 3vw, 28px)',
                fontWeight: 700,
                lineHeight: 1.2,
                letterSpacing: '-0.015em',
                margin: '0 0 12px',
              }}
            >
              {headline}
            </h2>

            <p
              id={descId}
              style={{
                color: 'var(--df-text-secondary)',
                fontSize: 15,
                lineHeight: 1.6,
                margin: '0 0 24px',
              }}
            >
              {subline}
            </p>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <a
                href={primaryHref}
                onClick={(e) => {
                  onPrimary?.()
                  if (!primaryHref) e.preventDefault()
                  close()
                }}
                style={{
                  flex: '1 1 auto',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  background: 'var(--df-neon-violet)',
                  color: 'var(--df-text-inverse)',
                  border: 'none',
                  borderRadius: 'var(--df-radius-md)',
                  padding: '12px 20px',
                  fontSize: 15,
                  fontWeight: 600,
                  textDecoration: 'none',
                  boxShadow: 'var(--df-glow-violet)',
                }}
              >
                {primaryLabel}
                <span aria-hidden="true">→</span>
              </a>
              <button
                type="button"
                onClick={close}
                style={{
                  background: 'transparent',
                  color: 'var(--df-text-secondary)',
                  border: '1px solid var(--df-border-default)',
                  borderRadius: 'var(--df-radius-md)',
                  padding: '12px 20px',
                  fontSize: 15,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                No thanks
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

**Usage** — mount once near the root, gate by route (don't show on `/checkout`):

```tsx
<CtaExitIntent
  headline="Wait — 30% off your first month"
  subline="Get every Darkforge pattern, every dark theme, every ship-ready component. Today only."
  primaryLabel="Claim 30% off"
  primaryHref="/pricing?promo=NX30"
/>
```

---

## Cross-References

- **`framer-motion`** — Pattern 3's slide-up entrance and Pattern 6's fade rely on
  `AnimatePresence` + `motion`. Pattern 1, 2, 4 use `motion` for in-view fades.
  `useReducedMotion` is the gate for `prefers-reduced-motion` across all patterns.
  // VERIFY: imports for `framer-motion` v11+; older `useReducedMotion` lived in `framer-motion/dom`.

- **`aceternity-ui`** — Swap Pattern 2's static gradient button for `<MovingBorder>` to
  get a rotating gradient outline. // VERIFY: aceternity-ui ships per-component; copy from
  the docs site rather than `npm install`.

- **`magic-ui`** — `ShimmerButton` is a drop-in replacement for the primary CTA in
  Patterns 1, 2, 4, 6. Same DF violet scheme; adds the shimmer sweep on hover.
  // VERIFY: magic-ui exports vary by version; cross-check the install snippet.

- **DF tokens** — every color, radius, shadow, and easing in this file is a
  `var(--df-*)`. If a value looks hardcoded (`rgba(167,139,250,0.X)`), that's the raw
  tuple matching `--df-neon-violet` — used inline for shadow/gradient layering where a
  token form isn't defined. Never write `#a78bfa` directly — always token or rgba().

- **Hero parity** — entrance timings (`duration: 0.6, ease: [0.16, 1, 0.3, 1]`),
  gradient orb sizing, and badge styling all match `hero.md`. Use the same in any new
  CTA you build so sections feel like one product.
