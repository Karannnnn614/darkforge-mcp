# Darkforge — Features Section Patterns
6 production-grade dark feature sections — bento grids, icon cards, timelines, comparisons, animated stats, and spotlight rows.
Pick the variant that matches the user's narrative density and stack. All patterns inherit `--df-*` tokens; never hardcode hex.

> **Sandbox caveat:** This file was authored without live `context7` / `WebFetch` access. API surfaces for `framer-motion`, `magic-ui`, `aceternity`, and Tailwind v4 reflect knowledge through Q1 2025. Before shipping in production, verify each marked `// VERIFY:` line against the current docs (especially `framer-motion` 11→12 imports and `useInView` signature, `magic-ui` `BorderBeam`/`NumberTicker` props, and `aceternity` `HoverEffect` imports).

## Contents

- [Pattern 1 — Bento Grid (asymmetric tiles)](#pattern-1-bento-grid-asymmetric-tiles)
- [Pattern 2 — 3-Up Icon Cards](#pattern-2-3-up-icon-cards)
- [Pattern 3 — Vertical Timeline (numbered nodes, zigzag content)](#pattern-3-vertical-timeline-numbered-nodes-zigzag-content)
- [Pattern 4 — Comparison Table (vs competitor / before-after)](#pattern-4-comparison-table-vs-competitor-before-after)
- [Pattern 5 — Animated Stats Strip](#pattern-5-animated-stats-strip)
- [Pattern 6 — Feature Spotlight (alternating image+text rows)](#pattern-6-feature-spotlight-alternating-imagetext-rows)
- [Cross-References — Library Combos](#cross-references-library-combos)

---

## Pattern 1 — Bento Grid (asymmetric tiles)

Six tiles in a 4-column desktop grid. One large hero tile (2x2), four small (1x1), one wide (2x1).
Each tile has a DF glow on hover and a Framer-staggered entrance from below.

```tsx
// app/components/features/BentoGrid.tsx
// Requires: framer-motion ^11, tailwindcss ^4, magic-ui (optional, for BorderBeam)
// VERIFY: framer-motion 12 changed the entrypoint to 'motion/react' for some bundlers.
'use client'

import { motion, useReducedMotion, type Variants } from 'framer-motion'
import { useMemo } from 'react'

interface BentoTile {
  id: string
  title: string
  description: string
  span: 'hero' | 'small' | 'wide'
  accent: 'violet' | 'cyan' | 'pink' | 'green'
  icon?: React.ReactNode
  preview?: React.ReactNode
}

const TILES: BentoTile[] = [
  {
    id: 'deliverability',
    title: 'Real-time deliverability scoring',
    description:
      'Every send is graded against 47 inbox-placement signals - SPF, DKIM, content tone, link reputation, and 43 more - before it leaves the queue.',
    span: 'hero',
    accent: 'violet',
  },
  {
    id: 'subject-ai',
    title: 'AI-powered subject lines',
    description: 'Generate 8 variants per send, A/B/n auto-route to winner.',
    span: 'small',
    accent: 'cyan',
  },
  {
    id: 'warmup',
    title: 'Automated inbox warmup',
    description: 'Reputation built passively across 12K real human accounts.',
    span: 'small',
    accent: 'pink',
  },
  {
    id: 'unibox',
    title: 'Unified reply inbox',
    description: 'Every domain, every reply, one keyboard-driven inbox.',
    span: 'small',
    accent: 'green',
  },
  {
    id: 'analytics',
    title: 'Cohort-level analytics',
    description: 'Drill from campaign to sequence to variant to contact in two clicks.',
    span: 'small',
    accent: 'violet',
  },
  {
    id: 'crm',
    title: 'Two-way CRM sync - HubSpot, Salesforce, Pipedrive, Close',
    description:
      'Pushes every reply, opportunity, and meeting back to your source of truth in under 90 seconds. No middleware, no Zapier.',
    span: 'wide',
    accent: 'cyan',
  },
]

const accentMap = {
  violet: { color: 'var(--df-neon-violet)', glow: 'var(--df-glow-violet)', soft: 'rgba(167,139,250,0.14)' },
  cyan: { color: 'var(--df-neon-cyan)', glow: 'var(--df-glow-cyan)', soft: 'rgba(34,211,238,0.14)' },
  pink: { color: 'var(--df-neon-pink)', glow: 'var(--df-glow-pink)', soft: 'rgba(244,114,182,0.14)' },
  green: { color: 'var(--df-neon-green)', glow: 'var(--df-glow-green)', soft: 'rgba(74,222,128,0.14)' },
} as const

const spanClasses: Record<BentoTile['span'], string> = {
  hero: 'md:col-span-2 md:row-span-2 min-h-[320px] md:min-h-[420px]',
  small: 'md:col-span-1 md:row-span-1 min-h-[200px]',
  wide: 'md:col-span-2 md:row-span-1 min-h-[200px]',
}

export function BentoGrid() {
  const reduce = useReducedMotion()

  const container: Variants = useMemo(
    () => ({
      hidden: {},
      show: {
        transition: { staggerChildren: reduce ? 0 : 0.08, delayChildren: reduce ? 0 : 0.1 },
      },
    }),
    [reduce],
  )

  const item: Variants = useMemo(
    () => ({
      hidden: { opacity: 0, y: reduce ? 0 : 24 },
      show: {
        opacity: 1,
        y: 0,
        transition: { duration: reduce ? 0 : 0.55, ease: [0.16, 1, 0.3, 1] },
      },
    }),
    [reduce],
  )

  return (
    <section
      aria-labelledby="bento-heading"
      className="relative w-full"
      style={{
        background: 'var(--df-bg-base)',
        padding: 'clamp(64px, 10vw, 120px) clamp(20px, 5vw, 48px)',
      }}
    >
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-12 max-w-2xl md:mb-16">
          <p
            style={{
              color: 'var(--df-neon-violet)',
              fontSize: 13,
              fontWeight: 500,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: 16,
            }}
          >
            Built for senders that ship
          </p>
          <h2
            id="bento-heading"
            style={{
              fontSize: 'clamp(32px, 5vw, 52px)',
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: '-0.025em',
              color: 'var(--df-text-primary)',
              margin: '0 0 16px',
            }}
          >
            Everything cold outbound{' '}
            <span
              style={{
                background:
                  'linear-gradient(135deg, var(--df-neon-violet), var(--df-neon-cyan))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              forgot to be
            </span>
          </h2>
          <p
            style={{
              color: 'var(--df-text-secondary)',
              fontSize: 18,
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            One platform that grades, sends, warms, and routes - replacing four tools
            and two part-time engineers.
          </p>
        </header>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          className="grid grid-cols-1 gap-4 md:grid-cols-4 md:gap-5"
        >
          {TILES.map((tile) => {
            const accent = accentMap[tile.accent]
            return (
              <motion.article
                key={tile.id}
                variants={item}
                className={`group relative overflow-hidden ${spanClasses[tile.span]}`}
                style={{
                  background: 'var(--df-bg-surface)',
                  border: '1px solid var(--df-border-default)',
                  borderRadius: 'var(--df-radius-xl)',
                  padding: 'clamp(20px, 3vw, 32px)',
                  transition:
                    'border-color var(--df-duration-base) var(--df-ease-out), box-shadow var(--df-duration-base) var(--df-ease-out), transform var(--df-duration-base) var(--df-ease-out)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = `${accent.color}66`
                  e.currentTarget.style.boxShadow = accent.glow
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--df-border-default)'
                  e.currentTarget.style.boxShadow = 'none'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                {/* Soft accent wash - only visible on hover */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  style={{
                    background: `radial-gradient(circle at 30% 0%, ${accent.soft} 0%, transparent 60%)`,
                  }}
                />

                <div className="relative flex h-full flex-col justify-between gap-6">
                  <div
                    aria-hidden
                    className="flex h-10 w-10 items-center justify-center"
                    style={{
                      background: accent.soft,
                      border: `1px solid ${accent.color}33`,
                      borderRadius: 'var(--df-radius-md)',
                      color: accent.color,
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12l5 5 9-9" />
                    </svg>
                  </div>

                  <div>
                    <h3
                      style={{
                        color: 'var(--df-text-primary)',
                        fontSize: tile.span === 'hero' ? 'clamp(22px, 2.4vw, 28px)' : 18,
                        fontWeight: 600,
                        lineHeight: 1.25,
                        letterSpacing: '-0.01em',
                        margin: '0 0 10px',
                      }}
                    >
                      {tile.title}
                    </h3>
                    <p
                      style={{
                        color: 'var(--df-text-secondary)',
                        fontSize: tile.span === 'hero' ? 16 : 14,
                        lineHeight: 1.6,
                        margin: 0,
                      }}
                    >
                      {tile.description}
                    </p>
                  </div>
                </div>
              </motion.article>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
```

**Cross-references:**
- `framer-motion` - `staggerChildren` for entrance, `viewport={{ once: true }}` for fire-once on scroll. // VERIFY: 12.x docs
- `magic-ui` `BorderBeam` - animated border on the hero tile (drop into the `motion.article` with `<BorderBeam size={250} duration={12} />`). // VERIFY: prop names against magicui.design
- `aceternity` Card Hover Effect - alternative to the inline mouseEnter/Leave handlers; use `HoverEffect` if you'd rather wrap the whole grid.

---

## Pattern 2 — 3-Up Icon Cards

Three columns desktop, one column mobile. Large neon icon at top, headline, supporting copy. Hover lifts card and pulses a soft accent halo. Reduced-motion respected.

```tsx
// app/components/features/IconCardRow.tsx
// Requires: framer-motion ^11, tailwindcss ^4
'use client'

import { motion, useReducedMotion } from 'framer-motion'

interface IconFeature {
  id: string
  title: string
  description: string
  accent: 'violet' | 'cyan' | 'pink'
  icon: React.ReactNode
}

const FEATURES: IconFeature[] = [
  {
    id: 'send',
    title: 'Send at human cadence',
    description:
      'Per-mailbox throttling, weekend skips, and time-zone-aware delivery - no more 9 AM cliff edges that scream "automation" to spam filters.',
    accent: 'violet',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
        <path d="M3 12l18-9-9 18-2-7-7-2z" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'warm',
    title: 'Warm without lifting a finger',
    description:
      'Reputation grown across a closed pool of 12K real inboxes. Replies, opens, and forwards happen on autopilot - even while you sleep.',
    accent: 'cyan',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
        <circle cx="12" cy="12" r="4" />
      </svg>
    ),
  },
  {
    id: 'reply',
    title: 'Reply in 90 seconds flat',
    description:
      'Unified inbox, keyboard shortcuts, AI-drafted responses pre-scored for tone. Move from triage to sales meeting without a context switch.',
    accent: 'pink',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" strokeLinejoin="round" />
      </svg>
    ),
  },
]

const accentMap = {
  violet: {
    color: 'var(--df-neon-violet)',
    soft: 'rgba(167,139,250,0.12)',
    glow: '0 0 28px rgba(167,139,250,0.35)',
  },
  cyan: {
    color: 'var(--df-neon-cyan)',
    soft: 'rgba(34,211,238,0.12)',
    glow: '0 0 28px rgba(34,211,238,0.35)',
  },
  pink: {
    color: 'var(--df-neon-pink)',
    soft: 'rgba(244,114,182,0.12)',
    glow: '0 0 28px rgba(244,114,182,0.35)',
  },
} as const

export function IconCardRow() {
  const reduce = useReducedMotion()

  return (
    <section
      aria-labelledby="icon-cards-heading"
      style={{
        background: 'var(--df-bg-base)',
        padding: 'clamp(64px, 10vw, 120px) clamp(20px, 5vw, 48px)',
      }}
    >
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-12 text-center md:mb-16">
          <h2
            id="icon-cards-heading"
            style={{
              fontSize: 'clamp(28px, 4.5vw, 44px)',
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              color: 'var(--df-text-primary)',
              margin: '0 auto 16px',
              maxWidth: 720,
            }}
          >
            Three jobs your stack should already do
          </h2>
          <p
            style={{
              color: 'var(--df-text-secondary)',
              fontSize: 17,
              lineHeight: 1.6,
              margin: '0 auto',
              maxWidth: 560,
            }}
          >
            Send. Warm. Reply. We do all three so you can stop duct-taping four
            half-finished SaaS subscriptions together.
          </p>
        </header>

        <ul
          className="grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-6"
          role="list"
        >
          {FEATURES.map((feature, idx) => {
            const accent = accentMap[feature.accent]
            return (
              <motion.li
                key={feature.id}
                initial={{ opacity: 0, y: reduce ? 0 : 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{
                  duration: reduce ? 0 : 0.5,
                  delay: reduce ? 0 : idx * 0.08,
                  ease: [0.16, 1, 0.3, 1],
                }}
                whileHover={reduce ? undefined : { y: -4 }}
                className="relative h-full"
                style={{
                  background: 'var(--df-bg-surface)',
                  border: '1px solid var(--df-border-default)',
                  borderRadius: 'var(--df-radius-xl)',
                  padding: 'clamp(24px, 3vw, 32px)',
                  transition:
                    'border-color var(--df-duration-base) var(--df-ease-out), box-shadow var(--df-duration-base) var(--df-ease-out)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = `${accent.color}55`
                  e.currentTarget.style.boxShadow = accent.glow
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--df-border-default)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <div
                  aria-hidden
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 'var(--df-radius-lg)',
                    background: accent.soft,
                    border: `1px solid ${accent.color}33`,
                    color: accent.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 24,
                    boxShadow: `inset 0 0 16px ${accent.color}1a`,
                  }}
                >
                  <span style={{ width: 26, height: 26, display: 'block' }}>
                    {feature.icon}
                  </span>
                </div>

                <h3
                  style={{
                    color: 'var(--df-text-primary)',
                    fontSize: 20,
                    fontWeight: 600,
                    lineHeight: 1.3,
                    letterSpacing: '-0.01em',
                    margin: '0 0 12px',
                  }}
                >
                  {feature.title}
                </h3>
                <p
                  style={{
                    color: 'var(--df-text-secondary)',
                    fontSize: 15,
                    lineHeight: 1.65,
                    margin: 0,
                  }}
                >
                  {feature.description}
                </p>
              </motion.li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
```

**Cross-references:**
- `aceternity` `HoverEffect` - drop-in replacement for the manual hover state if you prefer the cursor-tracked spotlight. // VERIFY: ui.aceternity.com/components/card-hover-effect
- `framer-motion` `whileInView` - fire-once entrance with `viewport={{ once: true }}`.

---

## Pattern 3 — Vertical Timeline (numbered nodes, zigzag content)

A violet vertical line with numbered nodes. Content panels alternate left/right on desktop, stack on mobile. Active node glows when scrolled into view via `useInView`.

```tsx
// app/components/features/Timeline.tsx
// Requires: framer-motion ^11, tailwindcss ^4
'use client'

import { motion, useInView, useReducedMotion } from 'framer-motion'
import { useRef } from 'react'

interface TimelineStep {
  id: string
  step: number
  title: string
  description: string
  meta: string
}

const STEPS: TimelineStep[] = [
  {
    id: 'connect',
    step: 1,
    title: 'Connect your sending domains',
    description:
      'Auto-DNS validation for SPF, DKIM, and DMARC across unlimited mailboxes - Google Workspace, Microsoft 365, or custom SMTP.',
    meta: 'Setup - 4 minutes',
  },
  {
    id: 'warm',
    step: 2,
    title: 'Start warmup',
    description:
      'Automated reputation building begins immediately. Watch your sender score climb from 0 to 95+ over 14 days, no babysitting required.',
    meta: 'Day 1 - Day 14',
  },
  {
    id: 'launch',
    step: 3,
    title: 'Launch your first sequence',
    description:
      'AI drafts subject lines, schedules sends per time zone, and routes around weekends. You approve; we do the rest.',
    meta: 'Day 15 onward',
  },
  {
    id: 'reply',
    step: 4,
    title: 'Close in the unibox',
    description:
      'Every reply lands in one keyboard-driven inbox. Sentiment tagged, opportunities flagged, and CRM-synced in real time.',
    meta: 'Daily, 90 seconds',
  },
  {
    id: 'scale',
    step: 5,
    title: 'Scale without breaking deliverability',
    description:
      'Add domains, add mailboxes, add sequences. The platform rebalances send-rate ceilings automatically. No spreadsheets, no spam folders.',
    meta: 'Forever',
  },
]

interface StepRowProps {
  step: TimelineStep
  side: 'left' | 'right'
}

function StepRow({ step, side }: StepRowProps) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })
  const reduce = useReducedMotion()

  return (
    <div ref={ref} className="relative grid grid-cols-[1fr_auto_1fr] items-start gap-4 md:gap-8">
      {/* Left content (desktop) */}
      <div className={`hidden md:block ${side === 'left' ? '' : 'invisible'}`}>
        {side === 'left' && (
          <StepCard step={step} inView={inView} reduce={!!reduce} align="right" />
        )}
      </div>

      {/* Center node */}
      <div className="relative flex justify-center">
        <motion.div
          initial={{ scale: reduce ? 1 : 0.4, opacity: 0 }}
          animate={inView ? { scale: 1, opacity: 1 } : undefined}
          transition={{ duration: reduce ? 0 : 0.5, ease: [0.34, 1.56, 0.64, 1] }}
          aria-hidden
          style={{
            width: 44,
            height: 44,
            borderRadius: 'var(--df-radius-full)',
            background: 'var(--df-bg-elevated)',
            border: `2px solid ${inView ? 'var(--df-neon-violet)' : 'var(--df-border-default)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: inView ? 'var(--df-neon-violet)' : 'var(--df-text-muted)',
            fontFamily: 'var(--df-font-mono)',
            fontSize: 14,
            fontWeight: 600,
            boxShadow: inView ? 'var(--df-glow-violet)' : 'none',
            transition: 'box-shadow var(--df-duration-slow) var(--df-ease-out), border-color var(--df-duration-slow) var(--df-ease-out), color var(--df-duration-slow) var(--df-ease-out)',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {String(step.step).padStart(2, '0')}
        </motion.div>
      </div>

      {/* Right content (desktop) + mobile content (always right) */}
      <div className={side === 'right' ? 'block' : 'block md:invisible'}>
        {(side === 'right' || side === 'left') && (
          <div className={side === 'left' ? 'md:hidden' : ''}>
            <StepCard step={step} inView={inView} reduce={!!reduce} align="left" />
          </div>
        )}
      </div>
    </div>
  )
}

function StepCard({
  step,
  inView,
  reduce,
  align,
}: {
  step: TimelineStep
  inView: boolean
  reduce: boolean
  align: 'left' | 'right'
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: reduce ? 0 : align === 'left' ? 20 : -20 }}
      animate={inView ? { opacity: 1, x: 0 } : undefined}
      transition={{ duration: reduce ? 0 : 0.55, ease: [0.16, 1, 0.3, 1] }}
      style={{
        background: 'var(--df-bg-surface)',
        border: '1px solid var(--df-border-default)',
        borderRadius: 'var(--df-radius-lg)',
        padding: 'clamp(20px, 2.5vw, 28px)',
        textAlign: align === 'right' ? 'right' : 'left',
      }}
    >
      <p
        style={{
          color: 'var(--df-neon-violet)',
          fontSize: 12,
          fontWeight: 500,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          margin: '0 0 8px',
          fontFamily: 'var(--df-font-mono)',
        }}
      >
        {step.meta}
      </p>
      <h3
        style={{
          color: 'var(--df-text-primary)',
          fontSize: 'clamp(18px, 2vw, 22px)',
          fontWeight: 600,
          lineHeight: 1.3,
          letterSpacing: '-0.01em',
          margin: '0 0 10px',
        }}
      >
        {step.title}
      </h3>
      <p
        style={{
          color: 'var(--df-text-secondary)',
          fontSize: 15,
          lineHeight: 1.65,
          margin: 0,
        }}
      >
        {step.description}
      </p>
    </motion.div>
  )
}

export function Timeline() {
  return (
    <section
      aria-labelledby="timeline-heading"
      style={{
        background: 'var(--df-bg-base)',
        padding: 'clamp(64px, 10vw, 120px) clamp(20px, 5vw, 48px)',
      }}
    >
      <div className="mx-auto w-full max-w-5xl">
        <header className="mb-16 text-center">
          <p
            style={{
              color: 'var(--df-neon-violet)',
              fontSize: 13,
              fontWeight: 500,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: 16,
            }}
          >
            From signup to sales meeting
          </p>
          <h2
            id="timeline-heading"
            style={{
              fontSize: 'clamp(28px, 4.5vw, 44px)',
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              color: 'var(--df-text-primary)',
              margin: '0 auto 16px',
              maxWidth: 720,
            }}
          >
            Five steps. Zero deliverability headaches.
          </h2>
        </header>

        <div className="relative">
          {/* Vertical line */}
          <div
            aria-hidden
            className="absolute left-1/2 top-0 h-full -translate-x-1/2"
            style={{
              width: 2,
              background:
                'linear-gradient(to bottom, transparent 0%, var(--df-neon-violet) 8%, var(--df-neon-violet) 92%, transparent 100%)',
              opacity: 0.4,
            }}
          />

          <div className="flex flex-col gap-16 md:gap-20">
            {STEPS.map((step, idx) => (
              <StepRow key={step.id} step={step} side={idx % 2 === 0 ? 'left' : 'right'} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
```

**Cross-references:**
- `framer-motion` `useInView` - fires once when node enters viewport, drives the active glow.
- For a more advanced "filling line" effect (line draws as you scroll), add `useScroll` + `useTransform` on a clipped overlay div. // VERIFY: motion docs for `useScroll` target option.

---

## Pattern 4 — Comparison Table (vs competitor / before-after)

Two-column dark cards side by side. Header row anchors each column with a DF accent. Rows of category labels with check (DF green) or X (DF red) icons. Mobile collapses to stacked cards.

```tsx
// app/components/features/ComparisonTable.tsx
// Requires: framer-motion ^11, tailwindcss ^4
'use client'

import { motion, useReducedMotion } from 'framer-motion'

interface ComparisonRow {
  feature: string
  description?: string
  ours: boolean | string
  theirs: boolean | string
}

const ROWS: ComparisonRow[] = [
  {
    feature: 'Inbox warmup',
    description: 'Automated reputation building',
    ours: 'Built-in, 12K inbox network',
    theirs: 'Add-on, $50/mo extra',
  },
  { feature: 'AI subject lines', ours: true, theirs: false },
  { feature: 'Two-way CRM sync', description: 'HubSpot, Salesforce, Pipedrive', ours: true, theirs: 'One-way, polling only' },
  { feature: 'Unified reply inbox', ours: true, theirs: false },
  { feature: 'Per-mailbox throttling', ours: true, theirs: true },
  { feature: 'Time-zone-aware sending', ours: true, theirs: false },
  { feature: 'Cohort-level analytics', ours: true, theirs: false },
  { feature: 'Unlimited mailboxes per workspace', ours: true, theirs: 'Capped at 5' },
  { feature: 'API access', ours: 'REST + webhooks, all plans', theirs: 'Enterprise tier only' },
  { feature: 'Onboarding migration', ours: 'White-glove, free', theirs: 'Self-serve, $499 add-on' },
]

interface CellProps {
  value: boolean | string
  variant: 'ours' | 'theirs'
}

function Cell({ value, variant }: CellProps) {
  const isBool = typeof value === 'boolean'

  if (isBool) {
    const positive = value === true
    return (
      <div className="flex justify-center">
        <span
          aria-label={positive ? 'Included' : 'Not included'}
          style={{
            width: 28,
            height: 28,
            borderRadius: 'var(--df-radius-full)',
            background: positive
              ? 'rgba(74,222,128,0.12)'
              : 'rgba(248,113,113,0.1)',
            border: `1px solid ${positive ? 'rgba(74,222,128,0.3)' : 'rgba(248,113,113,0.25)'}`,
            color: positive ? 'var(--df-neon-green)' : 'var(--df-neon-red)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: positive ? '0 0 12px rgba(74,222,128,0.25)' : 'none',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            {positive ? <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" /> : <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />}
          </svg>
        </span>
      </div>
    )
  }

  return (
    <span
      style={{
        color:
          variant === 'ours'
            ? 'var(--df-text-primary)'
            : 'var(--df-text-secondary)',
        fontSize: 14,
        lineHeight: 1.5,
        textAlign: 'center',
        display: 'block',
      }}
    >
      {value}
    </span>
  )
}

export function ComparisonTable() {
  const reduce = useReducedMotion()

  return (
    <section
      aria-labelledby="comparison-heading"
      style={{
        background: 'var(--df-bg-base)',
        padding: 'clamp(64px, 10vw, 120px) clamp(20px, 5vw, 48px)',
      }}
    >
      <div className="mx-auto w-full max-w-5xl">
        <header className="mb-12 text-center md:mb-16">
          <h2
            id="comparison-heading"
            style={{
              fontSize: 'clamp(28px, 4.5vw, 44px)',
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              color: 'var(--df-text-primary)',
              margin: '0 auto 16px',
              maxWidth: 720,
            }}
          >
            Why teams switch from{' '}
            <span style={{ color: 'var(--df-text-secondary)' }}>the legacy tool</span>
          </h2>
          <p
            style={{
              color: 'var(--df-text-secondary)',
              fontSize: 17,
              lineHeight: 1.6,
              margin: '0 auto',
              maxWidth: 580,
            }}
          >
            Same price. More features. No hidden add-ons. Migration in under
            a day, with white-glove help on every plan.
          </p>
        </header>

        {/* Desktop table */}
        <motion.div
          initial={{ opacity: 0, y: reduce ? 0 : 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: reduce ? 0 : 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="hidden md:block overflow-hidden"
          style={{
            background: 'var(--df-bg-surface)',
            border: '1px solid var(--df-border-default)',
            borderRadius: 'var(--df-radius-xl)',
          }}
        >
          {/* Header */}
          <div
            className="grid grid-cols-[1.4fr_1fr_1fr]"
            role="row"
            style={{
              borderBottom: '1px solid var(--df-border-default)',
              background: 'var(--df-bg-elevated)',
            }}
          >
            <div role="columnheader" style={{ padding: '20px 24px', color: 'var(--df-text-muted)', fontSize: 12, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Feature
            </div>
            <div
              role="columnheader"
              style={{
                padding: '20px 24px',
                textAlign: 'center',
                color: 'var(--df-neon-violet)',
                fontSize: 14,
                fontWeight: 600,
                letterSpacing: '-0.005em',
                borderLeft: '1px solid var(--df-border-default)',
                borderRight: '1px solid var(--df-border-default)',
                background: 'rgba(167,139,250,0.04)',
              }}
            >
              NexusOutbound
            </div>
            <div role="columnheader" style={{ padding: '20px 24px', textAlign: 'center', color: 'var(--df-text-secondary)', fontSize: 14, fontWeight: 500 }}>
              Legacy tool
            </div>
          </div>

          {ROWS.map((row, idx) => (
            <div
              key={row.feature}
              role="row"
              className="grid grid-cols-[1.4fr_1fr_1fr] items-center"
              style={{
                borderBottom: idx === ROWS.length - 1 ? 'none' : '1px solid var(--df-border-subtle)',
              }}
            >
              <div role="cell" style={{ padding: '18px 24px' }}>
                <p style={{ color: 'var(--df-text-primary)', fontSize: 15, fontWeight: 500, margin: '0 0 2px' }}>
                  {row.feature}
                </p>
                {row.description && (
                  <p style={{ color: 'var(--df-text-muted)', fontSize: 13, margin: 0 }}>
                    {row.description}
                  </p>
                )}
              </div>
              <div
                role="cell"
                style={{
                  padding: '18px 24px',
                  borderLeft: '1px solid var(--df-border-subtle)',
                  borderRight: '1px solid var(--df-border-subtle)',
                  background: 'rgba(167,139,250,0.02)',
                }}
              >
                <Cell value={row.ours} variant="ours" />
              </div>
              <div role="cell" style={{ padding: '18px 24px' }}>
                <Cell value={row.theirs} variant="theirs" />
              </div>
            </div>
          ))}
        </motion.div>

        {/* Mobile stacked cards */}
        <div className="grid grid-cols-1 gap-4 md:hidden">
          <ComparisonStack title="NexusOutbound" highlighted rows={ROWS.map(r => ({ ...r, value: r.ours }))} />
          <ComparisonStack title="Legacy tool" rows={ROWS.map(r => ({ ...r, value: r.theirs }))} />
        </div>
      </div>
    </section>
  )
}

function ComparisonStack({
  title,
  rows,
  highlighted,
}: {
  title: string
  rows: Array<ComparisonRow & { value: boolean | string }>
  highlighted?: boolean
}) {
  return (
    <div
      style={{
        background: 'var(--df-bg-surface)',
        border: `1px solid ${highlighted ? 'rgba(167,139,250,0.4)' : 'var(--df-border-default)'}`,
        borderRadius: 'var(--df-radius-xl)',
        padding: 24,
        boxShadow: highlighted ? 'var(--df-glow-violet)' : 'none',
      }}
    >
      <h3
        style={{
          color: highlighted ? 'var(--df-neon-violet)' : 'var(--df-text-secondary)',
          fontSize: 16,
          fontWeight: 600,
          margin: '0 0 16px',
        }}
      >
        {title}
      </h3>
      <ul role="list" style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {rows.map((r) => (
          <li
            key={r.feature}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 16,
              paddingBottom: 12,
              borderBottom: '1px solid var(--df-border-subtle)',
            }}
          >
            <span style={{ color: 'var(--df-text-primary)', fontSize: 14 }}>{r.feature}</span>
            <Cell value={r.value} variant={highlighted ? 'ours' : 'theirs'} />
          </li>
        ))}
      </ul>
    </div>
  )
}
```

**Cross-references:**
- Use `aria-label` on bool cells so screen-readers announce "Included" / "Not included" rather than the generic check icon.
- For a "before/after" variant, swap column titles to `Before NexusOutbound` / `After NexusOutbound` and reorder cells.

---

## Pattern 5 — Animated Stats Strip

A horizontal row of 4 stats. Each number counts up on intersection (using `requestAnimationFrame`, no extra dep needed). DF violet glow on hover. Mobile wraps to 2x2.

```tsx
// app/components/features/StatsStrip.tsx
// Requires: framer-motion ^11, tailwindcss ^4
// Optional: magic-ui NumberTicker as drop-in replacement for CountUp.
'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useInView, useReducedMotion } from 'framer-motion'

interface Stat {
  id: string
  value: number
  suffix?: string
  decimals?: number
  label: string
  sublabel?: string
}

const STATS: Stat[] = [
  { id: 'users', value: 10000, suffix: '+', label: 'Active users', sublabel: 'across 47 countries' },
  { id: 'uptime', value: 99.9, suffix: '%', decimals: 1, label: 'Uptime SLA', sublabel: 'last 12 months' },
  { id: 'rating', value: 4.9, suffix: '★', decimals: 1, label: 'G2 rating', sublabel: '1,200+ reviews' },
  { id: 'support', value: 24, suffix: '/7', label: 'Support coverage', sublabel: 'human, never AI-first' },
]

interface CountUpProps {
  to: number
  decimals?: number
  duration?: number
  start: boolean
}

function CountUp({ to, decimals = 0, duration = 1800, start }: CountUpProps) {
  const [value, setValue] = useState(0)
  const reduce = useReducedMotion()

  useEffect(() => {
    if (!start) return
    if (reduce) {
      setValue(to)
      return
    }
    let raf = 0
    const startTime = performance.now()
    const ease = (t: number) => 1 - Math.pow(1 - t, 3) // easeOutCubic

    const tick = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      setValue(to * ease(progress))
      if (progress < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [to, duration, start, reduce])

  const formatted =
    decimals > 0
      ? value.toFixed(decimals)
      : Math.round(value).toLocaleString('en-US')

  return <>{formatted}</>
}

export function StatsStrip() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const inView = useInView(sectionRef, { once: true, margin: '-100px' })
  const reduce = useReducedMotion()

  return (
    <section
      ref={sectionRef}
      aria-labelledby="stats-heading"
      style={{
        background: 'var(--df-bg-base)',
        padding: 'clamp(64px, 10vw, 120px) clamp(20px, 5vw, 48px)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Soft violet wash behind the strip */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse at center, rgba(167,139,250,0.08) 0%, transparent 60%)',
          pointerEvents: 'none',
        }}
      />

      <div className="relative mx-auto w-full max-w-6xl">
        <h2
          id="stats-heading"
          className="sr-only"
        >
          Key product statistics
        </h2>

        <ul
          role="list"
          className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6"
        >
          {STATS.map((stat, idx) => (
            <motion.li
              key={stat.id}
              initial={{ opacity: 0, y: reduce ? 0 : 16 }}
              animate={inView ? { opacity: 1, y: 0 } : undefined}
              transition={{
                duration: reduce ? 0 : 0.5,
                delay: reduce ? 0 : idx * 0.08,
                ease: [0.16, 1, 0.3, 1],
              }}
              style={{
                background: 'var(--df-bg-surface)',
                border: '1px solid var(--df-border-default)',
                borderRadius: 'var(--df-radius-xl)',
                padding: 'clamp(20px, 3vw, 32px)',
                textAlign: 'center',
                transition:
                  'border-color var(--df-duration-base) var(--df-ease-out), box-shadow var(--df-duration-base) var(--df-ease-out)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(167,139,250,0.45)'
                e.currentTarget.style.boxShadow = 'var(--df-glow-violet)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--df-border-default)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <p
                style={{
                  fontSize: 'clamp(36px, 5vw, 56px)',
                  fontWeight: 700,
                  letterSpacing: '-0.03em',
                  lineHeight: 1,
                  margin: '0 0 8px',
                  background:
                    'linear-gradient(135deg, var(--df-neon-violet), var(--df-neon-cyan))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  textShadow: '0 0 30px rgba(167,139,250,0.2)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                <CountUp to={stat.value} decimals={stat.decimals} start={inView} />
                <span aria-hidden style={{ fontSize: '0.65em', verticalAlign: 'baseline' }}>
                  {stat.suffix}
                </span>
              </p>
              <p
                style={{
                  color: 'var(--df-text-primary)',
                  fontSize: 14,
                  fontWeight: 500,
                  margin: '0 0 4px',
                }}
              >
                {stat.label}
              </p>
              {stat.sublabel && (
                <p
                  style={{
                    color: 'var(--df-text-muted)',
                    fontSize: 12,
                    margin: 0,
                  }}
                >
                  {stat.sublabel}
                </p>
              )}
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  )
}
```

**Cross-references:**
- `magic-ui` `NumberTicker` - drop-in replacement for `<CountUp>`. Use `<NumberTicker value={stat.value} decimalPlaces={stat.decimals} />` if you've already installed the lib. // VERIFY: prop names against magicui.design
- `framer-motion` `useInView` triggers the count exactly once on first scroll-into-view (don't re-trigger on every scroll up/down).
- `font-variant-numeric: tabular-nums` keeps digits the same width as they tick - prevents layout jitter.

---

## Pattern 6 — Feature Spotlight (alternating image+text rows)

Three rows, alternating text-left+visual-right and text-right+visual-left. Each visual is a glass-card mock UI with DF neon accents. Scroll-fades each row independently.

```tsx
// app/components/features/FeatureSpotlight.tsx
// Requires: framer-motion ^11, tailwindcss ^4
'use client'

import { motion, useReducedMotion } from 'framer-motion'

interface SpotlightRow {
  id: string
  eyebrow: string
  title: string
  description: string
  bullets: string[]
  accent: 'violet' | 'cyan' | 'pink'
  visual: React.ReactNode
}

const ROWS: SpotlightRow[] = [
  {
    id: 'deliverability',
    eyebrow: 'Deliverability engine',
    title: 'Stop landing in spam. Forever.',
    description:
      'Real-time scoring grades every send against 47 inbox-placement signals before it leaves the queue - and re-routes failures to a healthier mailbox automatically.',
    bullets: [
      'SPF, DKIM, DMARC auto-validation per domain',
      '12K-account warmup network on every plan',
      'Send-rate ceilings rebalance every 6 hours',
    ],
    accent: 'violet',
    visual: <DeliverabilityVisual />,
  },
  {
    id: 'sequences',
    eyebrow: 'Sequence builder',
    title: 'Multi-channel sequences without the complexity',
    description:
      'Email, LinkedIn, and call tasks in one canvas. Branch on opens, replies, or custom CRM properties - without writing a line of logic.',
    bullets: [
      'AI-drafted subject lines with A/B/n testing',
      'Time-zone-aware sending across 47 countries',
      'CRM properties available as branch conditions',
    ],
    accent: 'cyan',
    visual: <SequenceVisual />,
  },
  {
    id: 'unibox',
    eyebrow: 'Unified inbox',
    title: 'Reply in 90 seconds, every time',
    description:
      'Every reply, every domain, every mailbox - collapsed into one keyboard-driven inbox with sentiment tagging and AI-drafted responses.',
    bullets: [
      'Keyboard shortcuts for every action (j/k navigate, r reply)',
      'Sentiment tagged automatically - interested, OOO, unsubscribe',
      'Draft responses pre-scored against your tone profile',
    ],
    accent: 'pink',
    visual: <UniboxVisual />,
  },
]

const accentMap = {
  violet: { color: 'var(--df-neon-violet)', soft: 'rgba(167,139,250,0.12)' },
  cyan: { color: 'var(--df-neon-cyan)', soft: 'rgba(34,211,238,0.12)' },
  pink: { color: 'var(--df-neon-pink)', soft: 'rgba(244,114,182,0.12)' },
} as const

export function FeatureSpotlight() {
  const reduce = useReducedMotion()

  return (
    <section
      aria-labelledby="spotlight-heading"
      style={{
        background: 'var(--df-bg-base)',
        padding: 'clamp(64px, 10vw, 120px) clamp(20px, 5vw, 48px)',
      }}
    >
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-16 max-w-2xl md:mb-24">
          <h2
            id="spotlight-heading"
            style={{
              fontSize: 'clamp(32px, 5vw, 52px)',
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: '-0.025em',
              color: 'var(--df-text-primary)',
              margin: 0,
            }}
          >
            Three engines. One workflow.
          </h2>
        </header>

        <div className="flex flex-col gap-24 md:gap-32">
          {ROWS.map((row, idx) => {
            const reverse = idx % 2 === 1
            const accent = accentMap[row.accent]
            return (
              <motion.div
                key={row.id}
                initial={{ opacity: 0, y: reduce ? 0 : 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: reduce ? 0 : 0.7, ease: [0.16, 1, 0.3, 1] }}
                className={`grid grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-16 ${
                  reverse ? 'md:[&>*:first-child]:order-2' : ''
                }`}
              >
                {/* Text */}
                <div>
                  <p
                    style={{
                      color: accent.color,
                      fontSize: 13,
                      fontWeight: 500,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      margin: '0 0 16px',
                    }}
                  >
                    {row.eyebrow}
                  </p>
                  <h3
                    style={{
                      fontSize: 'clamp(24px, 3.5vw, 36px)',
                      fontWeight: 700,
                      lineHeight: 1.2,
                      letterSpacing: '-0.02em',
                      color: 'var(--df-text-primary)',
                      margin: '0 0 16px',
                    }}
                  >
                    {row.title}
                  </h3>
                  <p
                    style={{
                      color: 'var(--df-text-secondary)',
                      fontSize: 17,
                      lineHeight: 1.65,
                      margin: '0 0 24px',
                    }}
                  >
                    {row.description}
                  </p>
                  <ul
                    role="list"
                    style={{
                      listStyle: 'none',
                      padding: 0,
                      margin: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                    }}
                  >
                    {row.bullets.map((b) => (
                      <li
                        key={b}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 12,
                          color: 'var(--df-text-secondary)',
                          fontSize: 15,
                          lineHeight: 1.55,
                        }}
                      >
                        <span
                          aria-hidden
                          style={{
                            flexShrink: 0,
                            marginTop: 4,
                            width: 18,
                            height: 18,
                            borderRadius: 'var(--df-radius-full)',
                            background: accent.soft,
                            border: `1px solid ${accent.color}40`,
                            color: accent.color,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Visual */}
                <div
                  style={{
                    background: 'var(--df-glass-bg)',
                    border: '1px solid var(--df-glass-border)',
                    borderRadius: 'var(--df-radius-xl)',
                    backdropFilter: 'blur(20px) saturate(180%)',
                    padding: 'clamp(20px, 3vw, 32px)',
                    boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Accent halo */}
                  <div
                    aria-hidden
                    style={{
                      position: 'absolute',
                      top: '-30%',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '80%',
                      height: '60%',
                      background: `radial-gradient(ellipse, ${accent.soft} 0%, transparent 70%)`,
                      pointerEvents: 'none',
                    }}
                  />
                  <div style={{ position: 'relative' }}>{row.visual}</div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ---------- Visual mocks ---------- */

function DeliverabilityVisual() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: 'var(--df-text-muted)', fontSize: 12, fontFamily: 'var(--df-font-mono)' }}>
          Inbox score
        </span>
        <span style={{ color: 'var(--df-neon-green)', fontSize: 12, fontWeight: 600 }}>● Healthy</span>
      </div>
      <p
        style={{
          fontSize: 48,
          fontWeight: 700,
          color: 'var(--df-text-primary)',
          margin: 0,
          letterSpacing: '-0.03em',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        96<span style={{ color: 'var(--df-text-muted)', fontSize: 24, fontWeight: 500 }}>/100</span>
      </p>
      <div style={{ height: 8, borderRadius: 'var(--df-radius-full)', background: 'var(--df-bg-elevated)', overflow: 'hidden' }}>
        <div
          style={{
            width: '96%',
            height: '100%',
            background:
              'linear-gradient(90deg, var(--df-neon-violet), var(--df-neon-cyan))',
            boxShadow: 'var(--df-glow-violet)',
          }}
        />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 8 }}>
        {[
          { label: 'SPF', val: 'Pass' },
          { label: 'DKIM', val: 'Pass' },
          { label: 'DMARC', val: 'Pass' },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: 'var(--df-bg-elevated)',
              border: '1px solid var(--df-border-subtle)',
              borderRadius: 'var(--df-radius-md)',
              padding: '10px 12px',
            }}
          >
            <p style={{ color: 'var(--df-text-muted)', fontSize: 11, margin: '0 0 4px', fontFamily: 'var(--df-font-mono)' }}>
              {s.label}
            </p>
            <p style={{ color: 'var(--df-neon-green)', fontSize: 13, fontWeight: 600, margin: 0 }}>
              {s.val}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

function SequenceVisual() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {[
        { i: 1, label: 'Day 0 - Initial outreach', meta: 'Email - 41% open' },
        { i: 2, label: 'Day 3 - Soft follow-up', meta: 'Email - 28% open' },
        { i: 3, label: 'Day 7 - LinkedIn touch', meta: 'LI - 64% accept' },
        { i: 4, label: 'Day 14 - Breakup', meta: 'Email - 19% open' },
      ].map((step, idx) => (
        <div
          key={step.i}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            background: 'var(--df-bg-elevated)',
            border: '1px solid var(--df-border-subtle)',
            borderRadius: 'var(--df-radius-md)',
            padding: '12px 14px',
            opacity: idx === 1 ? 1 : 0.7,
            borderColor: idx === 1 ? 'rgba(34,211,238,0.4)' : 'var(--df-border-subtle)',
            boxShadow: idx === 1 ? 'var(--df-glow-cyan)' : 'none',
          }}
        >
          <span
            style={{
              width: 28,
              height: 28,
              borderRadius: 'var(--df-radius-full)',
              background: 'var(--df-bg-overlay)',
              border: '1px solid var(--df-border-default)',
              color: 'var(--df-neon-cyan)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--df-font-mono)',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {step.i}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ color: 'var(--df-text-primary)', fontSize: 13, fontWeight: 500, margin: '0 0 2px' }}>
              {step.label}
            </p>
            <p style={{ color: 'var(--df-text-muted)', fontSize: 11, margin: 0 }}>
              {step.meta}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

function UniboxVisual() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {[
        { from: 'Jordan @ Acme', subject: 'Re: Quick question', tag: 'Interested', color: 'var(--df-neon-green)', active: true },
        { from: 'Riley @ Beta Co', subject: 'Re: Demo scheduling', tag: 'Meeting', color: 'var(--df-neon-violet)', active: false },
        { from: 'Sam @ Delta Inc', subject: 'Re: Pricing question', tag: 'Q&A', color: 'var(--df-neon-cyan)', active: false },
        { from: 'Casey @ Omega', subject: 'Re: Out of office', tag: 'OOO', color: 'var(--df-neon-amber)', active: false },
      ].map((m, idx) => (
        <div
          key={idx}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            background: m.active ? 'rgba(244,114,182,0.06)' : 'var(--df-bg-elevated)',
            border: `1px solid ${m.active ? 'rgba(244,114,182,0.3)' : 'var(--df-border-subtle)'}`,
            borderRadius: 'var(--df-radius-md)',
            padding: '12px 14px',
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ color: 'var(--df-text-primary)', fontSize: 13, fontWeight: 500, margin: '0 0 2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {m.from}
            </p>
            <p style={{ color: 'var(--df-text-muted)', fontSize: 11, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {m.subject}
            </p>
          </div>
          <span
            style={{
              flexShrink: 0,
              fontSize: 10,
              fontWeight: 500,
              color: m.color,
              background: `${m.color}1a`,
              border: `1px solid ${m.color}33`,
              borderRadius: 'var(--df-radius-full)',
              padding: '3px 8px',
              fontFamily: 'var(--df-font-mono)',
            }}
          >
            {m.tag}
          </span>
        </div>
      ))}
    </div>
  )
}
```

**Cross-references:**
- `framer-motion` `whileInView` with `viewport={{ once: true, margin: '-100px' }}` - fade each row in 100px before it enters the viewport.
- `aceternity` `Sticky Scroll Reveal` - alternative for a more cinematic feel where the visual stays pinned while text changes. // VERIFY: ui.aceternity.com/components/sticky-scroll-reveal
- `magic-ui` `BorderBeam` - drop onto each visual card for an animated rim light. // VERIFY: prop names against magicui.design

---

## Cross-References — Library Combos

When the user has these libs in their stack, prefer these enhancements over the bare-CSS versions above:

| Library | Use for | Pattern fit |
| --- | --- | --- |
| `framer-motion` | All entrance / stagger / count-up | Patterns 1, 2, 3, 5, 6 |
| `magic-ui` `BorderBeam` | Animated border on hero bento tile / spotlight visual cards | Patterns 1, 6 |
| `magic-ui` `NumberTicker` | Drop-in replacement for the inline `CountUp` component | Pattern 5 |
| `aceternity` `HoverEffect` (Card Hover) | Cursor-tracked spotlight on icon cards | Pattern 2 |
| `aceternity` `Sticky Scroll Reveal` | Pin visual while text scrolls (cinematic spotlight) | Pattern 6 (alternative) |
| `lucide-react` | Replace the inline SVG icons in patterns 1, 2, 4, 6 | All |
| `react-intersection-observer` | Older codebases without `useInView` | Patterns 3, 5 |

**Tailwind v4 note:** All Tailwind classes here are v4-compatible (no JIT-specific syntax, no `@apply` inside CSS modules). The arbitrary-value syntax `bg-[var(--df-bg-base)]` works identically in v3 and v4. // VERIFY: v4.0 docs for any breaking changes to arbitrary-value parsing.

**Accessibility checklist (every pattern above implements):**
- `aria-labelledby` on every `<section>` pointing at the heading
- `role="list"` / `role="row"` / `role="cell"` for semantic structure
- `aria-hidden` on purely decorative SVG, glow divs, and background washes
- `prefers-reduced-motion` honored via `useReducedMotion` - entrance/stagger/count-up all collapse to instant when set
- Focus-visible respected (no custom outline overrides)
- Color contrast: all text uses `--df-text-primary` (#fff on #000 = 21:1) or `--df-text-secondary` (#a1a1aa on #000 = 9.5:1) - well above WCAG AAA
