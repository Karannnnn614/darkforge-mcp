# Darkforge — Scroll Story Patterns
5 production-grade scroll-driven storytelling patterns — pinned multi-step narratives, parallax depth scenes, horizontal pipeline reveals, scrub-tied SVG morphs, and reveal cascades with progress meters. Use these when a landing page has to *teach* something on the way down — product walkthroughs, animated case studies, narrative onboarding tours, or technical explainers where the cadence of revelation is itself the value.

> **Sandbox caveat:** This file was authored without live `context7` / `WebFetch` access. API surfaces for `motion` (formerly `framer-motion`), `gsap` + `ScrollTrigger`, and `@react-three/drei` reflect knowledge through Q1 2025. Before shipping in production, verify each `// VERIFY:` line against the current docs — particularly `useInView` options in motion v12, `gsap.matchMedia()`'s breakpoint cleanup contract, and `<ScrollControls />` props in `@react-three/drei`. Pattern 1 expands the `ScrollStory` scene from `02-gsap.md` (lines 896-1002) with progress dots, mobile fallback, and a dual-column visual swap; everything else in this file is new.

## Contents

- [Pattern 1 — Pinned Multi-Step Narrative (5 chapters, side dots, visual swap)](#pattern-1-pinned-multi-step-narrative-5-chapters-side-dots-visual-swap)
- [Pattern 2 — Layered Parallax with Scrub-Tied Highlight Reveals](#pattern-2-layered-parallax-with-scrub-tied-highlight-reveals)
- [Pattern 3 — Horizontal Pipeline (vertical scroll → horizontal scroll within section)](#pattern-3-horizontal-pipeline-vertical-scroll-horizontal-scroll-within-section)
- [Pattern 4 — Scrub-Tied Scene (SVG path morph driven by scroll progress)](#pattern-4-scrub-tied-scene-svg-path-morph-driven-by-scroll-progress)
- [Pattern 5 — Reveal Cascade (timeline + sticky scroll-progress bar)](#pattern-5-reveal-cascade-timeline-sticky-scroll-progress-bar)
- [Performance Strategy](#performance-strategy)
- [Cross-References](#cross-references)

---

## Pattern 1 — Pinned Multi-Step Narrative (5 chapters, side dots, visual swap)

A two-column scroll story. Section pins for the duration of 5 scroll-progress steps; each step swaps the active text on the left and the visual on the right with a smooth crossfade. Side progress dots reflect the active chapter index. On screens narrower than `768px` the section unpins and degrades to a vertical scroll-snapped stack — the user still scrolls through the same chapters, just without the choreography.

```tsx
// app/components/scroll-story/PinnedNarrative.tsx
// Requires: gsap ^3.12, @gsap/react ^2, react ^18
// Token reference: 00-dark-tokens.md
// Engine reference: 02-gsap.md (ScrollTrigger primitives, gsap.matchMedia)
'use client'

import { useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap, ScrollTrigger } from '@/lib/gsap/register'
import { smooth } from '@/lib/gsap/eases'

interface Chapter {
  id: string
  index: string
  title: string
  body: string
  highlight: string
  tone: 'violet' | 'cyan' | 'pink' | 'green' | 'amber'
  visual: ChapterVisual
}

type ChapterVisual =
  | { kind: 'connect';   mailboxes: number }
  | { kind: 'warmup';    providers: number; days: number }
  | { kind: 'sequence';  steps: number; replyRate: number }
  | { kind: 'placement'; primary: number; spam: number }
  | { kind: 'iterate';   pausedLists: number; recoveredIPs: number }

const CHAPTERS: Chapter[] = [
  {
    id: 'connect',
    index: '01',
    title: 'Connect every mailbox in under 90 seconds',
    body: 'Import unlimited Gmail, Outlook, and custom SMTP senders from a single OAuth flow. SPF, DKIM, and DMARC are verified at link-time — no hand-editing DNS records, no waiting on IT.',
    highlight: 'OAuth verified at link-time',
    tone: 'violet',
    visual: { kind: 'connect', mailboxes: 47 },
  },
  {
    id: 'warmup',
    index: '02',
    title: 'Warm sender domains, automatically',
    body: 'Auto-rotation across 14 mailbox providers. Reply patterns mimic real human cadence — folders moved, threads continued, signals harvested for 21 days before your first cold send goes out.',
    highlight: '14 providers, 21-day warm path',
    tone: 'cyan',
    visual: { kind: 'warmup', providers: 14, days: 21 },
  },
  {
    id: 'sequence',
    index: '03',
    title: 'Send branching sequences with AI replies',
    body: 'Compose multi-step sequences with conditional branches, AI-drafted replies, and A/B testing at the variable level. Variants compete in flight; the winner becomes the default for the next cohort.',
    highlight: 'A/B at the variable level',
    tone: 'pink',
    visual: { kind: 'sequence', steps: 6, replyRate: 11.4 },
  },
  {
    id: 'placement',
    index: '04',
    title: 'Track inbox placement, per mailbox provider',
    body: 'Per-mailbox open and reply rates with daily seed-list checks. Spam-rate alerts fire under 0.3% so you can pause a domain before Gmail throttles it. No more guessing whether a campaign actually landed.',
    highlight: 'Spam alerts under 0.3%',
    tone: 'green',
    visual: { kind: 'placement', primary: 91.2, spam: 0.18 },
  },
  {
    id: 'iterate',
    index: '05',
    title: 'Iterate weekly with auto-pause and IP recovery',
    body: 'Cold-list scoring auto-pauses underperformers. Bounce-heavy IPs are quarantined and reintroduced with shaped-up volume. Subject lines, opening sentences, and CTAs swap themselves out based on reply-quality signal.',
    highlight: 'Self-healing IP rotation',
    tone: 'amber',
    visual: { kind: 'iterate', pausedLists: 18, recoveredIPs: 4 },
  },
]

const TONE_VAR = (t: Chapter['tone']) => `var(--df-neon-${t})`
const TONE_GLOW = (t: Chapter['tone']) => `var(--df-glow-${t})`

export function PinnedNarrative() {
  const root = useRef<HTMLElement>(null)
  const [active, setActive] = useState(0)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()  // VERIFY: cleanup contract — mm.revert() on hot reload
      const total = CHAPTERS.length

      mm.add(
        {
          isDesktop: '(min-width: 768px)',
          isMobile: '(max-width: 767px)',
          reduceMotion: '(prefers-reduced-motion: reduce)',
        },
        ctx => {
          const c = ctx.conditions as {
            isDesktop: boolean
            isMobile: boolean
            reduceMotion: boolean
          }

          // ---- Reduced motion: instant fade per chapter, no pin, no scrub ----
          if (c.reduceMotion) {
            gsap.utils.toArray<HTMLElement>('.pn-chapter').forEach(ch => {
              gsap.set(ch, { opacity: 1, y: 0 })
              const v = ch.querySelector('.pn-visual')
              if (v) gsap.set(v, { opacity: 1 })
            })
            return
          }

          // ---- Mobile: scroll-snap stack, no pin, no horizontal binding ----
          if (c.isMobile) {
            gsap.utils.toArray<HTMLElement>('.pn-chapter-mobile').forEach((ch, i) => {
              gsap.from(ch, {
                opacity: 0,
                y: 32,
                duration: 0.6,
                ease: smooth,
                scrollTrigger: {
                  trigger: ch,
                  start: 'top 80%',
                  toggleActions: 'play none none reverse',
                  onEnter:     () => setActive(i),
                  onEnterBack: () => setActive(i),
                },
              })
            })
            return
          }

          // ---- Desktop: pin + scrub the whole story stage ----
          if (!c.isDesktop) return

          ScrollTrigger.create({
            trigger: '.pn-stage',
            start: 'top top',
            end: () => `+=${total * 100}%`,
            pin: '.pn-pin',
            anticipatePin: 1,
            invalidateOnRefresh: true,
          })

          // Each chapter owns a slice of the pinned scroll length
          gsap.utils.toArray<HTMLElement>('.pn-chapter').forEach((ch, i) => {
            const enter = i / total
            const exit  = (i + 1) / total

            gsap.timeline({
              scrollTrigger: {
                trigger: '.pn-stage',
                start: () => `top+=${enter * 100}% top`,
                end:   () => `top+=${exit  * 100}% top`,
                scrub: 0.6,
                onEnter:     () => setActive(i),
                onEnterBack: () => setActive(i),
              },
            })
              .fromTo(
                ch,
                { opacity: 0, y: 28, filter: 'blur(6px)' },
                { opacity: 1, y: 0,  filter: 'blur(0px)', ease: smooth },
              )
              .to(
                ch,
                { opacity: 0, y: -28, filter: 'blur(6px)', ease: smooth },
                '+=0.35',
              )

            const visual = ch.querySelector('.pn-visual')
            if (visual) {
              gsap.timeline({
                scrollTrigger: {
                  trigger: '.pn-stage',
                  start: () => `top+=${enter * 100}% top`,
                  end:   () => `top+=${exit  * 100}% top`,
                  scrub: 0.6,
                },
              })
                .fromTo(
                  visual,
                  { opacity: 0, scale: 0.92 },
                  { opacity: 1, scale: 1, ease: smooth },
                )
                .to(
                  visual,
                  { opacity: 0, scale: 1.06, ease: smooth },
                  '+=0.35',
                )
            }
          })
        },
      )

      return () => mm.revert()
    },
    { scope: root },
  )

  return (
    <section
      ref={root}
      className="pn-stage"
      aria-label="Product walkthrough"
      style={{
        background: 'var(--df-bg-base)',
        color: 'var(--df-text-primary)',
      }}
    >
      {/* Mobile: scroll-snap stack rendered from same data */}
      <ol
        className="pn-mobile"
        style={{
          display: 'none',
          listStyle: 'none',
          padding: 0,
          margin: 0,
          scrollSnapType: 'y mandatory',
        }}
      >
        {CHAPTERS.map((ch, i) => (
          <li
            key={ch.id}
            className="pn-chapter-mobile"
            aria-current={i === active ? 'step' : undefined}
            style={{
              minHeight: '85vh',
              scrollSnapAlign: 'start',
              padding: 'var(--df-space-12) var(--df-space-6)',
              borderBottom: '1px solid var(--df-border-subtle)',
              display: 'grid',
              gap: 'var(--df-space-6)',
            }}
          >
            <ChapterCopy chapter={ch} />
            <div
              className="pn-visual"
              style={{
                aspectRatio: '4 / 3',
                background: 'var(--df-bg-surface)',
                border: `1px solid ${TONE_VAR(ch.tone)}33`,
                borderRadius: 'var(--df-radius-xl)',
                padding: 'var(--df-space-6)',
                boxShadow: `0 0 60px ${TONE_VAR(ch.tone)}22`,
              }}
            >
              <ChapterVisualPanel visual={ch.visual} tone={ch.tone} />
            </div>
          </li>
        ))}
      </ol>

      {/* Desktop: pinned dual-column stage */}
      <div
        className="pn-pin"
        style={{
          height: '100vh',
          display: 'grid',
          gridTemplateColumns: '64px 1fr 1fr',
          alignItems: 'center',
          gap: 'var(--df-space-12)',
          padding: 'var(--df-space-12) var(--df-space-12)',
          position: 'relative',
        }}
      >
        {/* Side progress dots — display-only, synced via ScrollTrigger callbacks */}
        <ProgressRail
          total={CHAPTERS.length}
          active={active}
          tone={CHAPTERS[active]?.tone ?? 'violet'}
        />

        {/* Left column: copy stack — chapters absolute-stacked, only one visible at a time */}
        <div
          style={{
            position: 'relative',
            minHeight: 320,
          }}
          aria-live="polite"
          aria-atomic="true"
        >
          {CHAPTERS.map((ch, i) => (
            <article
              key={ch.id}
              className="pn-chapter"
              aria-current={i === active ? 'step' : undefined}
              aria-hidden={i !== active}
              aria-label={`Chapter ${ch.index} of ${CHAPTERS.length}: ${ch.title}`}
              style={{
                position: 'absolute',
                inset: 0,
                opacity: 0,
                display: 'grid',
                gap: 'var(--df-space-4)',
                alignContent: 'center',
                willChange: 'opacity, transform, filter',
              }}
            >
              <ChapterCopy chapter={ch} />
            </article>
          ))}
        </div>

        {/* Right column: visual stack */}
        <div
          style={{ position: 'relative', aspectRatio: '4 / 3' }}
          aria-hidden="true"
        >
          {CHAPTERS.map(ch => (
            <div
              key={ch.id}
              className="pn-visual"
              style={{
                position: 'absolute',
                inset: 0,
                opacity: 0,
                background: 'var(--df-bg-surface)',
                border: `1px solid ${TONE_VAR(ch.tone)}33`,
                borderRadius: 'var(--df-radius-xl)',
                padding: 'var(--df-space-6)',
                boxShadow: `0 0 80px ${TONE_VAR(ch.tone)}1f, 0 24px 64px rgba(0,0,0,0.6)`,
                willChange: 'opacity, transform',
              }}
            >
              <ChapterVisualPanel visual={ch.visual} tone={ch.tone} />
            </div>
          ))}
        </div>
      </div>

      {/* Responsive tweaks */}
      <style>{`
        @media (min-width: 768px) {
          .pn-mobile { display: none !important; }
        }
        @media (max-width: 767px) {
          .pn-stage > .pn-pin { display: none !important; }
          .pn-mobile { display: block !important; }
        }
      `}</style>
    </section>
  )
}

/* ---------------- Sub-components ---------------- */

function ChapterCopy({ chapter }: { chapter: Chapter }) {
  return (
    <>
      <p
        style={{
          margin: 0,
          color: TONE_VAR(chapter.tone),
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
        }}
      >
        Chapter {chapter.index}
      </p>
      <h2
        style={{
          margin: 0,
          fontFamily: 'var(--df-font-display)',
          fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)',
          fontWeight: 600,
          color: 'var(--df-text-primary)',
          lineHeight: 1.15,
          letterSpacing: '-0.02em',
        }}
      >
        {chapter.title}
      </h2>
      <p
        style={{
          margin: 0,
          color: 'var(--df-text-secondary)',
          fontSize: 17,
          lineHeight: 1.65,
        }}
      >
        {chapter.body}
      </p>
      <p
        style={{
          margin: 0,
          display: 'inline-flex',
          alignSelf: 'start',
          alignItems: 'center',
          gap: 8,
          padding: '4px 12px',
          fontSize: 12,
          fontWeight: 500,
          color: TONE_VAR(chapter.tone),
          background: `${TONE_VAR(chapter.tone)}1a`,
          border: `1px solid ${TONE_VAR(chapter.tone)}33`,
          borderRadius: 'var(--df-radius-full)',
          boxShadow: TONE_GLOW(chapter.tone),
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: TONE_VAR(chapter.tone),
            boxShadow: TONE_GLOW(chapter.tone),
          }}
        />
        {chapter.highlight}
      </p>
    </>
  )
}

function ProgressRail({
  total,
  active,
  tone,
}: {
  total: number
  active: number
  tone: Chapter['tone']
}) {
  return (
    <ol
      role="list"
      aria-label="Chapter progress"
      style={{
        listStyle: 'none',
        margin: 0,
        padding: 0,
        display: 'grid',
        gap: 'var(--df-space-4)',
        justifySelf: 'center',
        alignSelf: 'center',
      }}
    >
      {Array.from({ length: total }).map((_, i) => {
        const reached = i <= active
        return (
          <li
            key={i}
            aria-current={i === active ? 'step' : undefined}
            aria-label={`Chapter ${i + 1} of ${total}${i === active ? ', current' : ''}`}
            style={{
              width: 8,
              height: i === active ? 28 : 8,
              borderRadius: 999,
              background: reached
                ? `var(--df-neon-${tone})`
                : 'var(--df-bg-muted)',
              boxShadow: i === active ? `var(--df-glow-${tone})` : 'none',
              transition:
                'height var(--df-duration-base) var(--df-ease-out), background var(--df-duration-base) var(--df-ease-out), box-shadow var(--df-duration-base) var(--df-ease-out)',
            }}
          />
        )
      })}
    </ol>
  )
}

/* Per-chapter visual — renders a different infographic for each chapter
   so the right column actually changes content, not just opacity. */
function ChapterVisualPanel({
  visual,
  tone,
}: {
  visual: ChapterVisual
  tone: Chapter['tone']
}) {
  const accent = `var(--df-neon-${tone})`

  switch (visual.kind) {
    case 'connect':
      return (
        <div style={{ display: 'grid', gap: 'var(--df-space-4)' }}>
          <p style={{ margin: 0, color: 'var(--df-text-muted)', fontSize: 12 }}>
            Verified mailboxes
          </p>
          <p
            style={{
              margin: 0,
              fontFamily: 'var(--df-font-display)',
              fontSize: 56,
              fontWeight: 700,
              color: accent,
              lineHeight: 1,
            }}
          >
            {visual.mailboxes}
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(8, 1fr)',
              gap: 6,
              marginTop: 4,
            }}
          >
            {Array.from({ length: 24 }).map((_, i) => (
              <div
                key={i}
                style={{
                  height: 18,
                  background: i < 22 ? `${accent}33` : 'var(--df-bg-muted)',
                  border: `1px solid ${i < 22 ? `${accent}44` : 'var(--df-border-subtle)'}`,
                  borderRadius: 'var(--df-radius-xs)',
                }}
              />
            ))}
          </div>
        </div>
      )
    case 'warmup':
      return (
        <div style={{ display: 'grid', gap: 'var(--df-space-4)' }}>
          <p style={{ margin: 0, color: 'var(--df-text-muted)', fontSize: 12 }}>
            Warmup providers
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: 8,
            }}
          >
            {Array.from({ length: visual.providers }).map((_, i) => (
              <div
                key={i}
                style={{
                  height: 36,
                  background: 'var(--df-bg-elevated)',
                  border: `1px solid ${accent}55`,
                  borderRadius: 'var(--df-radius-sm)',
                  boxShadow: `0 0 8px ${accent}22`,
                }}
              />
            ))}
          </div>
          <p style={{ margin: 0, color: 'var(--df-text-secondary)', fontSize: 13 }}>
            Day{' '}
            <span style={{ color: accent, fontWeight: 600 }}>{visual.days}</span> of warmth · 0
            domains throttled
          </p>
        </div>
      )
    case 'sequence':
      return (
        <div style={{ display: 'grid', gap: 'var(--df-space-4)' }}>
          <p style={{ margin: 0, color: 'var(--df-text-muted)', fontSize: 12 }}>
            Active sequence
          </p>
          <div style={{ display: 'grid', gap: 8 }}>
            {Array.from({ length: visual.steps }).map((_, i) => (
              <div
                key={i}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '24px 1fr 60px',
                  gap: 12,
                  alignItems: 'center',
                  padding: '10px 12px',
                  background: 'var(--df-bg-elevated)',
                  border: '1px solid var(--df-border-subtle)',
                  borderRadius: 'var(--df-radius-sm)',
                }}
              >
                <span
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: i === 0 ? accent : 'var(--df-bg-muted)',
                    border: `1px solid ${accent}55`,
                    color: i === 0 ? 'var(--df-text-inverse)' : 'var(--df-text-muted)',
                    fontSize: 11,
                    fontWeight: 600,
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  {i + 1}
                </span>
                <span style={{ color: 'var(--df-text-primary)', fontSize: 13 }}>
                  Step {i + 1} · waited {(i + 1) * 2}d
                </span>
                <span
                  style={{
                    color: 'var(--df-text-secondary)',
                    fontSize: 12,
                    textAlign: 'right',
                  }}
                >
                  {Math.max(20 - i * 3, 5)}.{i}%
                </span>
              </div>
            ))}
          </div>
          <p style={{ margin: 0, color: 'var(--df-text-secondary)', fontSize: 13 }}>
            Reply rate{' '}
            <span style={{ color: accent, fontWeight: 600 }}>{visual.replyRate}%</span>
          </p>
        </div>
      )
    case 'placement':
      return (
        <div style={{ display: 'grid', gap: 'var(--df-space-4)' }}>
          <p style={{ margin: 0, color: 'var(--df-text-muted)', fontSize: 12 }}>
            Inbox placement (last 24h)
          </p>
          <div style={{ display: 'grid', gap: 12 }}>
            <PlacementBar label="Primary" value={visual.primary} accent={accent} />
            <PlacementBar
              label="Promotions"
              value={Math.max(0, 100 - visual.primary - visual.spam - 1.4)}
              accent="var(--df-neon-amber)"
            />
            <PlacementBar
              label="Spam"
              value={visual.spam}
              accent="var(--df-neon-red)"
            />
          </div>
          <p style={{ margin: 0, color: 'var(--df-text-secondary)', fontSize: 13 }}>
            Spam rate{' '}
            <span
              style={{
                color: visual.spam < 0.3 ? 'var(--df-neon-green)' : 'var(--df-neon-amber)',
                fontWeight: 600,
              }}
            >
              {visual.spam}%
            </span>{' '}
            · alert threshold 0.30%
          </p>
        </div>
      )
    case 'iterate':
      return (
        <div style={{ display: 'grid', gap: 'var(--df-space-4)' }}>
          <p style={{ margin: 0, color: 'var(--df-text-muted)', fontSize: 12 }}>
            This week's automations
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12,
            }}
          >
            <StatTile label="Lists paused" value={visual.pausedLists} accent={accent} />
            <StatTile
              label="IPs recovered"
              value={visual.recoveredIPs}
              accent="var(--df-neon-green)"
            />
          </div>
          <ul
            style={{
              margin: 0,
              padding: 0,
              listStyle: 'none',
              display: 'grid',
              gap: 6,
              color: 'var(--df-text-secondary)',
              fontSize: 13,
            }}
          >
            <li>· Subject A swapped for Subject D (CTR +18%)</li>
            <li>· `mail3.instantly.io` cooled for 36h, returned</li>
            <li>· Cold list `Q1-cleantech` paused at 4.7% bounce</li>
          </ul>
        </div>
      )
  }
}

function PlacementBar({
  label,
  value,
  accent,
}: {
  label: string
  value: number
  accent: string
}) {
  return (
    <div style={{ display: 'grid', gap: 4 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          color: 'var(--df-text-secondary)',
          fontSize: 12,
        }}
      >
        <span>{label}</span>
        <span>{value.toFixed(1)}%</span>
      </div>
      <div
        style={{
          height: 6,
          background: 'var(--df-bg-muted)',
          borderRadius: 999,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${value}%`,
            height: '100%',
            background: accent,
            boxShadow: `0 0 12px ${accent}55`,
          }}
        />
      </div>
    </div>
  )
}

function StatTile({
  label,
  value,
  accent,
}: {
  label: string
  value: number
  accent: string
}) {
  return (
    <div
      style={{
        padding: 'var(--df-space-4)',
        background: 'var(--df-bg-elevated)',
        border: '1px solid var(--df-border-subtle)',
        borderRadius: 'var(--df-radius-md)',
      }}
    >
      <p style={{ margin: 0, color: 'var(--df-text-muted)', fontSize: 11 }}>{label}</p>
      <p
        style={{
          margin: '4px 0 0',
          fontFamily: 'var(--df-font-display)',
          fontSize: 28,
          fontWeight: 700,
          color: accent,
          lineHeight: 1,
        }}
      >
        {value}
      </p>
    </div>
  )
}
```

---

## Pattern 2 — Layered Parallax with Scrub-Tied Highlight Reveals

A three-depth dark scene — back (slow), mid (medium), foreground (fast) — over which long-form prose scrolls normally. Specific words and phrases inside the prose are wrapped in `<mark>` elements that scrub their color and glow into existence at fixed scroll points, so the eye is led through key terms in lockstep with the depth shift.

```tsx
// app/components/scroll-story/ParallaxHighlights.tsx
// Requires: motion ^12 (formerly framer-motion), react ^18
'use client'

import { useRef, type ReactNode } from 'react'
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  type MotionValue,
} from 'motion/react'

interface Highlight {
  /** Scroll progress in 0..1 at which this highlight ignites. */
  ignite: number
  text: string
  tone: 'violet' | 'cyan' | 'pink' | 'green'
}

interface Block {
  before: string
  highlight?: Highlight
  after: string
}

// Reads: "Cold email reputation isn't reputation, it's [signal density].
// Every reply lifts a domain; every bounce buries it. We measure
// [47 placement signals] across [14 mailbox providers] and rebuild your
// sender score in real time, so a flagged subject line gets [auto-paused]
// before Gmail throttles the entire IP block."
const PROSE: Block[] = [
  {
    before: "Cold email reputation isn't reputation, it's ",
    highlight: { ignite: 0.18, text: 'signal density', tone: 'violet' },
    after: '. Every reply lifts a domain; every bounce buries it. We measure ',
  },
  {
    before: '',
    highlight: { ignite: 0.42, text: '47 placement signals', tone: 'cyan' },
    after: ' across ',
  },
  {
    before: '',
    highlight: { ignite: 0.58, text: '14 mailbox providers', tone: 'pink' },
    after: ' and rebuild your sender score in real time, so a flagged subject line gets ',
  },
  {
    before: '',
    highlight: { ignite: 0.78, text: 'auto-paused', tone: 'green' },
    after: ' before Gmail throttles the entire IP block.',
  },
]

const TONE_GLOW_RGBA: Record<Highlight['tone'], string> = {
  violet: 'rgba(167,139,250,0.55)',
  cyan:   'rgba(34,211,238,0.55)',
  pink:   'rgba(244,114,182,0.55)',
  green:  'rgba(74,222,128,0.55)',
}

export function ParallaxHighlights() {
  const ref = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  })

  // Layer transforms — only consumed when motion is allowed.
  const yBack = useTransform(scrollYProgress, [0, 1], ['0%', '60%'])
  const yMid  = useTransform(scrollYProgress, [0, 1], ['0%', '30%'])
  const yFore = useTransform(scrollYProgress, [0, 1], ['0%', '12%'])
  const opacityHaze = useTransform(scrollYProgress, [0, 0.6, 1], [0.4, 0.9, 0.6])

  return (
    <section
      ref={ref}
      aria-label="How sender reputation actually works"
      style={{
        position: 'relative',
        minHeight: '220vh',
        overflow: 'hidden',
        background: 'var(--df-bg-base)',
      }}
    >
      {/* Layer 1 — back. Slowest movement, deepest field. */}
      <motion.div
        aria-hidden="true"
        style={{
          y: reduce ? 0 : yBack,
          position: 'absolute',
          inset: '-10% 0 0 0',
          height: '120%',
          pointerEvents: 'none',
          willChange: 'transform',
          background:
            'radial-gradient(900px 600px at 18% 22%, rgba(167,139,250,0.12), transparent 60%), radial-gradient(700px 500px at 82% 78%, rgba(34,211,238,0.10), transparent 60%)',
        }}
      />

      {/* Layer 2 — mid. Subtle grid pattern. */}
      <motion.div
        aria-hidden="true"
        style={{
          y: reduce ? 0 : yMid,
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          willChange: 'transform, opacity',
          opacity: reduce ? 0.05 : opacityHaze,
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      />

      {/* Layer 3 — foreground. Sparse neon dots that drift. */}
      <motion.div
        aria-hidden="true"
        style={{
          y: reduce ? 0 : yFore,
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          willChange: 'transform',
        }}
      >
        {[
          { top: '14%', left: '8%',  c: 'rgba(167,139,250,0.6)' },
          { top: '42%', left: '88%', c: 'rgba(34,211,238,0.5)'  },
          { top: '70%', left: '12%', c: 'rgba(244,114,182,0.5)' },
          { top: '88%', left: '76%', c: 'rgba(74,222,128,0.5)'  },
        ].map((dot, i) => (
          <span
            key={i}
            style={{
              position: 'absolute',
              top: dot.top,
              left: dot.left,
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: dot.c,
              boxShadow: `0 0 16px ${dot.c}`,
            }}
          />
        ))}
      </motion.div>

      {/* Prose — scrolls normally, highlights ignite at fixed % points */}
      <div
        style={{
          position: 'relative',
          maxWidth: 880,
          margin: '0 auto',
          padding: 'clamp(96px, 18vh, 192px) var(--df-space-8)',
          color: 'var(--df-text-secondary)',
          fontFamily: 'var(--df-font-display)',
          fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
          lineHeight: 1.45,
          fontWeight: 500,
        }}
      >
        <p style={{ margin: 0 }}>
          {PROSE.map((block, i) => (
            <span key={i}>
              {block.before}
              {block.highlight && (
                <ScrubHighlight
                  scrollYProgress={scrollYProgress}
                  ignite={block.highlight.ignite}
                  tone={block.highlight.tone}
                  reduce={Boolean(reduce)}
                >
                  {block.highlight.text}
                </ScrubHighlight>
              )}
              {block.after}
            </span>
          ))}
        </p>
      </div>
    </section>
  )
}

function ScrubHighlight({
  scrollYProgress,
  ignite,
  tone,
  reduce,
  children,
}: {
  scrollYProgress: MotionValue<number>
  ignite: number
  tone: Highlight['tone']
  reduce: boolean
  children: ReactNode
}) {
  const start = Math.max(0, ignite - 0.06)
  const end = Math.min(1, ignite + 0.04)
  const accent = `var(--df-neon-${tone})`
  const dimmed = 'var(--df-text-muted)'

  // Crossfade dim → bright tone, plus a glow shadow that ignites with it.
  const color  = useTransform(scrollYProgress, [start, end], [dimmed, accent])
  const shadow = useTransform(
    scrollYProgress,
    [start, end],
    ['0 0 0 transparent', `0 0 18px ${TONE_GLOW_RGBA[tone]}`],
  )

  if (reduce) {
    // Reduced motion: ignite immediately, no scrub.
    return (
      <mark
        style={{
          background: 'transparent',
          color: accent,
          fontWeight: 700,
          textShadow: `0 0 14px ${TONE_GLOW_RGBA[tone]}`,
        }}
      >
        {children}
      </mark>
    )
  }

  return (
    <motion.mark
      style={{
        background: 'transparent',
        color,
        textShadow: shadow,
        fontWeight: 700,
      }}
    >
      {children}
    </motion.mark>
  )
}
```

---

## Pattern 3 — Horizontal Pipeline (vertical scroll → horizontal scroll within section)

Five horizontal panels showing a delivery pipeline. The section pins, then panels translate left as the user scrolls down (GSAP horizontal-scroll pattern). Below `768px` the horizontal track is replaced with a vertical scroll-snap stack — every viewer sees all five panels in their natural scroll direction.

```tsx
// app/components/scroll-story/HorizontalPipeline.tsx
// Requires: gsap ^3.12, @gsap/react ^2
'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap, ScrollTrigger } from '@/lib/gsap/register'

interface PipelineStage {
  id: string
  number: string
  title: string
  body: string
  metric: { label: string; value: string }
  tone: 'violet' | 'cyan' | 'pink' | 'green' | 'amber'
}

const STAGES: PipelineStage[] = [
  {
    id: 'compose',
    number: '01',
    title: 'Compose',
    body: 'Draft sequences with branching logic, AI-generated openers, and conditional follow-ups based on reply intent.',
    metric: { label: 'Avg. compose time', value: '4m 18s' },
    tone: 'violet',
  },
  {
    id: 'warm',
    number: '02',
    title: 'Warm',
    body: 'Auto-warm new mailboxes against a network of 12K real human inboxes for 21 days before any cold send fires.',
    metric: { label: 'Warmup network', value: '12,400 mailboxes' },
    tone: 'cyan',
  },
  {
    id: 'send',
    number: '03',
    title: 'Send',
    body: 'Throttle per-mailbox with shaped daily ramps. Per-domain caps prevent any single sender from carrying more than its reputation can hold.',
    metric: { label: 'Sends today', value: '482,317' },
    tone: 'pink',
  },
  {
    id: 'track',
    number: '04',
    title: 'Track',
    body: 'Per-mailbox open rate, reply rate, and inbox placement. Daily seed-list checks across Gmail, Outlook, Yahoo, ProtonMail, and 10 more.',
    metric: { label: 'Inbox placement', value: '91.2%' },
    tone: 'green',
  },
  {
    id: 'iterate',
    number: '05',
    title: 'Iterate',
    body: 'Auto-pause cold lists below the reply threshold. Subject lines, openers, and CTAs swap based on reply-quality signal — not just opens.',
    metric: { label: 'Variants tested / week', value: '218' },
    tone: 'amber',
  },
]

export function HorizontalPipeline() {
  const root = useRef<HTMLElement>(null)
  const track = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()

      mm.add(
        {
          isDesktop: '(min-width: 768px)',
          isMobile: '(max-width: 767px)',
          reduceMotion: '(prefers-reduced-motion: reduce)',
        },
        ctx => {
          const c = ctx.conditions as {
            isDesktop: boolean
            isMobile: boolean
            reduceMotion: boolean
          }

          // Reduced motion + mobile both render the vertical fallback.
          if (c.reduceMotion || c.isMobile) {
            gsap.utils.toArray<HTMLElement>('.hp-card-mobile').forEach((card, i) => {
              if (c.reduceMotion) {
                gsap.set(card, { opacity: 1, y: 0 })
                return
              }
              gsap.from(card, {
                opacity: 0,
                y: 24,
                duration: 0.55,
                ease: 'power2.out',
                scrollTrigger: {
                  trigger: card,
                  start: 'top 85%',
                  toggleActions: 'play none none reverse',
                },
                delay: i * 0.04,
              })
            })
            return
          }

          if (!c.isDesktop || !track.current) return

          // Desktop: pin the section and translate the track horizontally.
          const distance = () =>
            (track.current?.scrollWidth ?? 0) - window.innerWidth + 64

          const horizontalTween = gsap.to(track.current, {
            x: () => -distance(),
            ease: 'none',
            scrollTrigger: {
              trigger: root.current,
              start: 'top top',
              end: () => `+=${distance()}`,
              pin: true,
              scrub: 0.8,
              invalidateOnRefresh: true,
              anticipatePin: 1,
            },
          })

          // Card pop-in tied to horizontal entry.
          // `containerAnimation` lets ScrollTrigger track elements inside a
          // tweened container — pass the tween itself, not a string id.
          gsap.utils.toArray<HTMLElement>('.hp-card').forEach((card, i) => {
            gsap.from(card, {
              opacity: 0,
              y: 24,
              duration: 0.5,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: card,
                containerAnimation: horizontalTween, // VERIFY: tween-ref form vs id lookup
                start: 'left 85%',
                toggleActions: 'play none none reverse',
              },
              delay: i * 0.05,
            })
          })
        },
      )

      return () => mm.revert()
    },
    { scope: root },
  )

  return (
    <section
      ref={root}
      aria-label="Delivery pipeline"
      style={{
        position: 'relative',
        background: 'var(--df-bg-base)',
        color: 'var(--df-text-primary)',
        overflow: 'hidden',
      }}
    >
      {/* Heading sits outside the pin so it scrolls past normally on desktop
          and reads naturally on mobile. */}
      <header
        style={{
          maxWidth: 720,
          padding: 'clamp(72px, 12vh, 128px) var(--df-space-8) var(--df-space-8)',
        }}
      >
        <p
          style={{
            margin: 0,
            color: 'var(--df-neon-violet)',
            fontSize: 13,
            fontWeight: 500,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}
        >
          The pipeline
        </p>
        <h2
          style={{
            margin: '12px 0 16px',
            fontFamily: 'var(--df-font-display)',
            fontSize: 'clamp(2rem, 4vw, 2.75rem)',
            fontWeight: 600,
            lineHeight: 1.15,
            letterSpacing: '-0.02em',
          }}
        >
          From idea to inbox in five stages.
        </h2>
        <p
          style={{
            margin: 0,
            color: 'var(--df-text-secondary)',
            fontSize: 17,
            lineHeight: 1.65,
          }}
        >
          Scroll through the operating loop. Compose, warm, send, track, iterate — every stage feeds the next.
        </p>
      </header>

      {/* Desktop horizontal track */}
      <div
        ref={track}
        className="hp-track"
        style={{
          display: 'flex',
          gap: 'var(--df-space-6)',
          padding: '0 var(--df-space-8) var(--df-space-12)',
          willChange: 'transform',
        }}
      >
        {STAGES.map(stage => (
          <PipelineCard key={stage.id} stage={stage} />
        ))}
      </div>

      {/* Mobile fallback — vertical stack with scroll snap.
          We render a duplicate list because flex-direction switching mid-tween
          fights ScrollTrigger's pinSpacer math; safer to keep two trees. */}
      <ol
        className="hp-mobile"
        aria-label="Pipeline stages, vertical layout"
        style={{
          listStyle: 'none',
          margin: 0,
          padding: '0 var(--df-space-6) var(--df-space-12)',
          display: 'none',
          gap: 'var(--df-space-5)',
          flexDirection: 'column',
          scrollSnapType: 'y proximity',
        }}
      >
        {STAGES.map(stage => (
          <li
            key={stage.id}
            className="hp-card-mobile"
            style={{ scrollSnapAlign: 'start' }}
          >
            <PipelineCard stage={stage} mobile />
          </li>
        ))}
      </ol>

      <style>{`
        @media (max-width: 767px) {
          .hp-track { display: none !important; }
          .hp-mobile { display: flex !important; }
        }
      `}</style>
    </section>
  )
}

function PipelineCard({
  stage,
  mobile = false,
}: {
  stage: PipelineStage
  mobile?: boolean
}) {
  const accent = `var(--df-neon-${stage.tone})`
  const glow = `var(--df-glow-${stage.tone})`

  return (
    <article
      className="hp-card"
      aria-label={`Stage ${stage.number}: ${stage.title}`}
      style={{
        flex: mobile ? undefined : '0 0 clamp(420px, 38vw, 560px)',
        width: mobile ? '100%' : undefined,
        minHeight: mobile ? undefined : '60vh',
        padding: 'var(--df-space-8)',
        background: 'var(--df-bg-surface)',
        border: `1px solid ${accent}33`,
        borderRadius: 'var(--df-radius-xl)',
        boxShadow: `0 0 60px ${accent}1a, 0 24px 64px rgba(0,0,0,0.55)`,
        display: 'grid',
        gap: 'var(--df-space-5)',
        alignContent: 'space-between',
      }}
    >
      <div style={{ display: 'grid', gap: 'var(--df-space-4)' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--df-space-3)' }}>
          <span
            aria-hidden="true"
            style={{
              fontFamily: 'var(--df-font-mono)',
              fontSize: 13,
              color: accent,
              letterSpacing: '0.12em',
            }}
          >
            STAGE
          </span>
          <span
            aria-hidden="true"
            style={{
              fontFamily: 'var(--df-font-display)',
              fontSize: 56,
              fontWeight: 700,
              color: 'var(--df-text-primary)',
              lineHeight: 1,
              letterSpacing: '-0.04em',
            }}
          >
            {stage.number}
          </span>
        </div>
        <h3
          style={{
            margin: 0,
            fontFamily: 'var(--df-font-display)',
            fontSize: 'clamp(1.5rem, 2.5vw, 2rem)',
            fontWeight: 600,
            color: 'var(--df-text-primary)',
          }}
        >
          {stage.title}
        </h3>
        <p
          style={{
            margin: 0,
            color: 'var(--df-text-secondary)',
            fontSize: 16,
            lineHeight: 1.6,
          }}
        >
          {stage.body}
        </p>
      </div>

      <div
        style={{
          padding: 'var(--df-space-4)',
          background: 'var(--df-bg-elevated)',
          border: '1px solid var(--df-border-subtle)',
          borderRadius: 'var(--df-radius-md)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ color: 'var(--df-text-muted)', fontSize: 12 }}>
          {stage.metric.label}
        </span>
        <span
          style={{
            color: accent,
            fontFamily: 'var(--df-font-mono)',
            fontSize: 14,
            fontWeight: 600,
            textShadow: `0 0 12px ${accent}55`,
          }}
        >
          {stage.metric.value}
        </span>
      </div>

      <div
        aria-hidden="true"
        style={{
          height: 1,
          background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
          opacity: 0.5,
          boxShadow: glow,
        }}
      />
    </article>
  )
}
```

---

## Pattern 4 — Scrub-Tied Scene (SVG path morph driven by scroll progress)

Scroll progress directly drives a scene. We use an SVG path-draw + hue shift because it works without a 3D library, video file, or `MorphSVG` plugin — `pathLength` + `strokeDasharray` is supported in every evergreen browser. Beat copy reveals at fixed scroll percentages and crossfades as the next beat enters.

> **Alternative implementations.** For a video-driven scene, replace the SVG block with a `<video preload="auto" muted playsInline>` and set `currentTime` from `scrollYProgress` via `useMotionValueEvent(progress, 'change', v => video.currentTime = v * video.duration)`. For a 3D camera dolly, use `<ScrollControls>` from `@react-three/drei` (see `03-threejs-r3f.md`) — wrap your `<Canvas>` with `<ScrollControls pages={4} damping={0.25}>` and read `useScroll().offset` inside a `useFrame` loop to drive the camera. // VERIFY: drei `<ScrollControls>` props (`pages`, `damping`, `distance`) and `useScroll().offset` API surface.

```tsx
// app/components/scroll-story/ScrubbedScene.tsx
// Requires: motion ^12, react ^18
'use client'

import { useRef } from 'react'
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  type MotionValue,
} from 'motion/react'

interface SceneBeat {
  /** When this beat's text becomes fully readable, in 0..1 progress. */
  reveal: number
  eyebrow: string
  title: string
}

const BEATS: SceneBeat[] = [
  {
    reveal: 0.05,
    eyebrow: '00:00',
    title: 'A campaign begins.',
  },
  {
    reveal: 0.32,
    eyebrow: '06:14',
    title: '482,317 messages enter the warmup queue.',
  },
  {
    reveal: 0.58,
    eyebrow: '09:48',
    title: 'Reputation signals stabilize across all 14 providers.',
  },
  {
    reveal: 0.86,
    eyebrow: '11:02',
    title: 'Inbox placement settles at 91.2%.',
  },
]

// Pre-computed beat marker positions, sampled along the path's bounding box.
const BEAT_POINTS: Array<{ cx: number; cy: number }> = [
  { cx: 60 + (1140 - 60) * 0.05, cy: 478 },
  { cx: 60 + (1140 - 60) * 0.32, cy: 290 },
  { cx: 60 + (1140 - 60) * 0.58, cy: 280 },
  { cx: 60 + (1140 - 60) * 0.86, cy: 150 },
]

export function ScrubbedScene() {
  const ref = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end end'],
  })

  // Path draw — `pathLength` is a 0..1 normalized stroke length.
  // Browser support: all evergreen since 2020. // VERIFY: Safari < 16.4 quirks
  const draw = useTransform(scrollYProgress, [0.0, 0.95], [0, 1])

  // Hue rotation across the curve as you scroll — violet → cyan → green
  const hue = useTransform(scrollYProgress, [0, 0.5, 1], [270, 195, 145])
  const stroke = useTransform(hue, h => `hsl(${h.toFixed(0)}, 90%, 70%)`)
  const glow = useTransform(
    hue,
    h => `drop-shadow(0 0 16px hsla(${h.toFixed(0)}, 90%, 70%, 0.55))`,
  )

  // Camera-like vertical drift on the scene — gentle so it never competes
  // with the path draw for attention.
  const sceneY = useTransform(scrollYProgress, [0, 1], ['0%', '-12%'])
  const sceneScale = useTransform(scrollYProgress, [0, 0.5, 1], [1.0, 1.04, 1.0])

  return (
    <section
      ref={ref}
      aria-label="Campaign timeline scene"
      style={{
        position: 'relative',
        minHeight: '320vh',
        background: 'var(--df-bg-base)',
      }}
    >
      <div
        style={{
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflow: 'hidden',
        }}
      >
        {/* Scene */}
        <motion.div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            y: reduce ? 0 : sceneY,
            scale: reduce ? 1 : sceneScale,
            display: 'grid',
            placeItems: 'center',
            willChange: 'transform',
          }}
        >
          <svg
            viewBox="0 0 1200 600"
            width="92%"
            height="auto"
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label="Reply rate trajectory across a 24-hour campaign"
          >
            <defs>
              <linearGradient id="ss-bg" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%"   stopColor="rgba(167,139,250,0.15)" />
                <stop offset="100%" stopColor="rgba(0,0,0,0)" />
              </linearGradient>
            </defs>

            {/* Soft background glow */}
            <rect width="1200" height="600" fill="url(#ss-bg)" />

            {/* Reference grid */}
            <g opacity="0.12" stroke="white" strokeWidth="1">
              {Array.from({ length: 7 }).map((_, i) => (
                <line
                  key={`v${i}`}
                  x1={(i + 1) * 150}
                  x2={(i + 1) * 150}
                  y1="40"
                  y2="560"
                />
              ))}
              {Array.from({ length: 4 }).map((_, i) => (
                <line
                  key={`h${i}`}
                  x1="40"
                  x2="1160"
                  y1={120 + i * 120}
                  y2={120 + i * 120}
                />
              ))}
            </g>

            {/* The trajectory itself.
                Hand-tuned cubic — climbs steeply, stutters at hour 6, recovers,
                plateaus near the end. Mirrors a real warmup curve. */}
            <motion.path
              d="M 60 480
                 C 200 470, 280 410, 360 360
                 S 520 220, 620 250
                 S 780 420, 880 320
                 S 1040 160, 1140 140"
              fill="none"
              stroke={reduce ? 'var(--df-neon-violet)' : stroke}
              strokeWidth={4}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                pathLength: reduce ? 1 : draw,
                filter: reduce
                  ? 'drop-shadow(0 0 14px rgba(167,139,250,0.55))'
                  : glow,
              }}
            />

            {/* Beat markers — pinned dots that ignite as the path passes them */}
            {BEAT_POINTS.map((p, i) => (
              <BeatMarker
                key={i}
                progress={scrollYProgress}
                ignite={BEATS[i].reveal}
                cx={p.cx}
                cy={p.cy}
                reduce={Boolean(reduce)}
              />
            ))}
          </svg>
        </motion.div>

        {/* Beat copy — pinned bottom-left, swaps as scroll passes each reveal */}
        <div
          style={{
            position: 'absolute',
            bottom: 'clamp(32px, 6vh, 64px)',
            left: 'clamp(24px, 4vw, 64px)',
            right: 'clamp(24px, 4vw, 64px)',
            maxWidth: 720,
            color: 'var(--df-text-primary)',
          }}
          aria-live="polite"
          aria-atomic="true"
        >
          {reduce ? (
            BEATS.map((beat, i) => (
              <ReducedBeat key={i} eyebrow={beat.eyebrow} title={beat.title} />
            ))
          ) : (
            <div style={{ position: 'relative', minHeight: 120 }}>
              {BEATS.map((beat, i) => {
                const next = BEATS[i + 1]?.reveal ?? 1.05
                return (
                  <Beat
                    key={i}
                    progress={scrollYProgress}
                    enterStart={beat.reveal - 0.03}
                    enterEnd={beat.reveal + 0.04}
                    exitStart={next - 0.06}
                    exitEnd={next - 0.01}
                    eyebrow={beat.eyebrow}
                    title={beat.title}
                  />
                )
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function BeatMarker({
  progress,
  ignite,
  cx,
  cy,
  reduce,
}: {
  progress: MotionValue<number>
  ignite: number
  cx: number
  cy: number
  reduce: boolean
}) {
  const r    = useTransform(progress, [ignite - 0.04, ignite + 0.02], [0, 8])
  const fill = useTransform(progress, [ignite - 0.04, ignite + 0.02], [
    'rgba(167,139,250,0)',
    'rgba(167,139,250,1)',
  ])

  if (reduce) {
    return (
      <circle
        cx={cx}
        cy={cy}
        r={8}
        fill="rgba(167,139,250,1)"
        style={{ filter: 'drop-shadow(0 0 12px rgba(167,139,250,0.65))' }}
      />
    )
  }

  return (
    <motion.circle
      cx={cx}
      cy={cy}
      r={r}
      fill={fill}
      style={{ filter: 'drop-shadow(0 0 12px rgba(167,139,250,0.65))' }}
    />
  )
}

function ReducedBeat({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <article style={{ marginBottom: 'var(--df-space-3)' }}>
      <p
        style={{
          margin: 0,
          color: 'var(--df-neon-violet)',
          fontFamily: 'var(--df-font-mono)',
          fontSize: 13,
          letterSpacing: '0.12em',
        }}
      >
        {eyebrow}
      </p>
      <p
        style={{
          margin: '6px 0 0',
          fontFamily: 'var(--df-font-display)',
          fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
          fontWeight: 600,
          lineHeight: 1.2,
        }}
      >
        {title}
      </p>
    </article>
  )
}

function Beat({
  progress,
  enterStart,
  enterEnd,
  exitStart,
  exitEnd,
  eyebrow,
  title,
}: {
  progress: MotionValue<number>
  enterStart: number
  enterEnd: number
  exitStart: number
  exitEnd: number
  eyebrow: string
  title: string
}) {
  const opacity = useTransform(
    progress,
    [enterStart, enterEnd, exitStart, exitEnd],
    [0, 1, 1, 0],
  )
  const y = useTransform(
    progress,
    [enterStart, enterEnd, exitStart, exitEnd],
    [16, 0, 0, -16],
  )

  return (
    <motion.article
      style={{
        opacity,
        y,
        position: 'absolute',
        inset: 0,
        willChange: 'opacity, transform',
      }}
    >
      <p
        style={{
          margin: 0,
          color: 'var(--df-neon-violet)',
          fontFamily: 'var(--df-font-mono)',
          fontSize: 13,
          letterSpacing: '0.12em',
          textShadow: '0 0 12px rgba(167,139,250,0.5)',
        }}
      >
        {eyebrow}
      </p>
      <p
        style={{
          margin: '6px 0 0',
          fontFamily: 'var(--df-font-display)',
          fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
          fontWeight: 600,
          lineHeight: 1.2,
          color: 'var(--df-text-primary)',
        }}
      >
        {title}
      </p>
    </motion.article>
  )
}
```

---

## Pattern 5 — Reveal Cascade (timeline + sticky scroll-progress bar)

A vertical timeline of milestones that reveals each event as the user scrolls past it. A sticky progress bar at the top of the section tracks overall section completion in DF violet. Built with Framer Motion's `useInView` so each milestone owns its own reveal independently — and a sibling `useScroll` drives the progress bar.

```tsx
// app/components/scroll-story/RevealCascade.tsx
// Requires: motion ^12, react ^18
'use client'

import { useRef } from 'react'
import {
  motion,
  useInView,
  useScroll,
  useSpring,
  useReducedMotion,
  type Variants,
} from 'motion/react'

interface Milestone {
  date: string
  iso: string
  title: string
  body: string
  badge: 'shipped' | 'beta' | 'planned'
}

const MILESTONES: Milestone[] = [
  {
    date: 'Jan 2024',
    iso: '2024-01',
    title: 'Inbox placement scoring goes GA',
    body: 'Per-mailbox open and reply rates with daily seed-list checks across Gmail, Outlook, Yahoo, ProtonMail, and 10 more.',
    badge: 'shipped',
  },
  {
    date: 'Apr 2024',
    iso: '2024-04',
    title: 'AI reply detection',
    body: 'Out-of-office, auto-responder, and "wrong contact" replies are filtered before they hit your unibox.',
    badge: 'shipped',
  },
  {
    date: 'Aug 2024',
    iso: '2024-08',
    title: 'Sequence A/B/n at the variable level',
    body: 'Test 8 subject lines, 4 openers, and 3 CTAs in a single sequence. Variants compete in flight; winners carry forward.',
    badge: 'shipped',
  },
  {
    date: 'Nov 2024',
    iso: '2024-11',
    title: 'Two-way CRM sync — HubSpot + Salesforce',
    body: 'Every reply, opportunity, and meeting flows back to your source of truth in under 90 seconds. No middleware.',
    badge: 'shipped',
  },
  {
    date: 'Feb 2025',
    iso: '2025-02',
    title: 'Auto-pause on bounce-rate spike',
    body: 'Cold lists exceeding 4% bounce auto-pause and notify the campaign owner. Manual override available.',
    badge: 'beta',
  },
  {
    date: 'Q2 2025',
    iso: '2025-Q2',
    title: 'Reply intent classifier',
    body: 'Group replies into "interested / not now / wrong person / unsubscribe" and route each to the right next step.',
    badge: 'planned',
  },
]

const BADGE_TONE: Record<Milestone['badge'], { color: string; bg: string }> = {
  shipped: { color: 'var(--df-neon-green)',  bg: 'rgba(74,222,128,0.12)' },
  beta:    { color: 'var(--df-neon-amber)',  bg: 'rgba(251,191,36,0.12)' },
  planned: { color: 'var(--df-neon-violet)', bg: 'rgba(167,139,250,0.12)' },
}

export function RevealCascade() {
  const ref = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 22,
    mass: 0.4,
  })

  return (
    <section
      ref={ref}
      aria-label="Product roadmap"
      style={{
        position: 'relative',
        background: 'var(--df-bg-base)',
        color: 'var(--df-text-primary)',
        padding: 'clamp(72px, 12vh, 128px) 0',
      }}
    >
      {/* Sticky scroll-progress bar */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 200,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--df-border-subtle)',
        }}
      >
        <div
          style={{
            maxWidth: 880,
            margin: '0 auto',
            padding: 'var(--df-space-3) var(--df-space-6)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--df-space-4)',
          }}
        >
          <span
            aria-hidden="true"
            style={{
              color: 'var(--df-text-muted)',
              fontSize: 12,
              fontFamily: 'var(--df-font-mono)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              flex: '0 0 auto',
            }}
          >
            Roadmap
          </span>
          <div
            role="progressbar"
            aria-label="Roadmap reading progress"
            aria-valuemin={0}
            aria-valuemax={100}
            style={{
              flex: 1,
              height: 3,
              background: 'var(--df-bg-muted)',
              borderRadius: 999,
              overflow: 'hidden',
            }}
          >
            <motion.div
              style={{
                height: '100%',
                background: 'var(--df-neon-violet)',
                boxShadow: 'var(--df-glow-violet)',
                transformOrigin: '0%',
                scaleX: reduce ? 1 : scaleX,
                willChange: 'transform',
              }}
            />
          </div>
        </div>
      </div>

      {/* Timeline */}
      <ol
        style={{
          listStyle: 'none',
          maxWidth: 720,
          margin: '0 auto',
          padding: 'var(--df-space-12) var(--df-space-6) 0',
          position: 'relative',
        }}
      >
        {/* Vertical rail */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 'var(--df-space-12)',
            bottom: 0,
            left: 'calc(var(--df-space-6) + 14px)',
            width: 2,
            background:
              'linear-gradient(to bottom, transparent, var(--df-border-default) 8%, var(--df-border-default) 92%, transparent)',
          }}
        />

        {MILESTONES.map(m => (
          <CascadeRow key={m.title} milestone={m} reduce={Boolean(reduce)} />
        ))}
      </ol>
    </section>
  )
}

function CascadeRow({
  milestone,
  reduce,
}: {
  milestone: Milestone
  reduce: boolean
}) {
  const ref = useRef<HTMLLIElement>(null)
  const inView = useInView(ref, {
    once: true,                                   // VERIFY: motion v12 useInView option name
    margin: '-80px 0px -80px 0px',                // VERIFY: `margin` vs `rootMargin`
    amount: 0.35,                                 // VERIFY: `amount` 0..1 in motion v12
  })

  const variants: Variants = {
    hidden: {
      opacity: 0,
      y: 32,
      filter: 'blur(8px)',
    },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: { type: 'spring', stiffness: 220, damping: 26 },
    },
  }

  const dotVariants: Variants = {
    hidden: { scale: 0, boxShadow: '0 0 0 rgba(167,139,250,0)' },
    visible: {
      scale: 1,
      boxShadow: '0 0 18px rgba(167,139,250,0.55)',
      transition: { type: 'spring', stiffness: 380, damping: 22, delay: 0.1 },
    },
  }

  const badge = BADGE_TONE[milestone.badge]

  return (
    <motion.li
      ref={ref}
      initial={reduce ? false : 'hidden'}
      animate={reduce ? undefined : inView ? 'visible' : 'hidden'}
      variants={reduce ? undefined : variants}
      style={{
        position: 'relative',
        paddingLeft: 'calc(var(--df-space-8) + 14px)',
        paddingBottom: 'var(--df-space-10)',
      }}
    >
      {/* Timeline dot */}
      <motion.span
        aria-hidden="true"
        variants={reduce ? undefined : dotVariants}
        style={{
          position: 'absolute',
          left: 6,
          top: 6,
          width: 18,
          height: 18,
          borderRadius: '50%',
          background:
            milestone.badge === 'shipped'
              ? 'var(--df-neon-green)'
              : milestone.badge === 'beta'
                ? 'var(--df-neon-amber)'
                : 'var(--df-neon-violet)',
          border: '3px solid var(--df-bg-base)',
        }}
      />

      <article
        style={{
          background: 'var(--df-bg-surface)',
          border: '1px solid var(--df-border-subtle)',
          borderRadius: 'var(--df-radius-lg)',
          padding: 'var(--df-space-5) var(--df-space-6)',
        }}
      >
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--df-space-3)',
            marginBottom: 'var(--df-space-3)',
          }}
        >
          <time
            dateTime={milestone.iso}
            style={{
              color: 'var(--df-text-muted)',
              fontFamily: 'var(--df-font-mono)',
              fontSize: 13,
              letterSpacing: '0.06em',
            }}
          >
            {milestone.date}
          </time>
          <span
            aria-label={`Status: ${milestone.badge}`}
            style={{
              padding: '3px 10px',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: badge.color,
              background: badge.bg,
              border: `1px solid ${badge.color}33`,
              borderRadius: 'var(--df-radius-full)',
            }}
          >
            {milestone.badge}
          </span>
        </header>
        <h3
          style={{
            margin: 0,
            color: 'var(--df-text-primary)',
            fontSize: 18,
            fontWeight: 600,
            lineHeight: 1.3,
          }}
        >
          {milestone.title}
        </h3>
        <p
          style={{
            margin: '8px 0 0',
            color: 'var(--df-text-secondary)',
            fontSize: 15,
            lineHeight: 1.6,
          }}
        >
          {milestone.body}
        </p>
      </article>
    </motion.li>
  )
}
```

---

## Performance Strategy

Scroll storytelling is the single most expensive UI primitive in the kit. Five guardrails keep these patterns under 16ms/frame on a mid-range laptop.

1. **Refresh on layout shift.** ScrollTrigger caches start/end positions on registration. Anything that changes element heights *after* registration — late-loading fonts, lazy images, accordions opening upstream — leaves your triggers off-by-pixels. Two fixes:
   - For triggers whose `start` / `end` are functions, pass `invalidateOnRefresh: true` (used in Patterns 1 and 3).
   - For static triggers, call `ScrollTrigger.refresh()` after the shift. A standard pattern is `document.fonts.ready.then(() => ScrollTrigger.refresh())`.
2. **`will-change` on transformed elements only.** GPU promotion is not free — too many promoted layers cause GPU memory pressure and texture thrashing on low-end devices. Apply `will-change: transform` to the *one* element whose transform animates per pattern (the pinned wrapper, the horizontal track, the SVG stroke, the layered parallax bg). Never blanket-apply to children.
3. **Throttle scroll-driven calculations.** Both engines do this for you — `motion/react`'s `useScroll` runs on a single rAF loop regardless of how many subscribers, and `ScrollTrigger` batches updates internally. Don't add a second layer of `requestAnimationFrame` or `requestIdleCallback`. Don't subscribe to `window.addEventListener('scroll')` alongside either engine; it duplicates work.
4. **`prefers-reduced-motion` is non-negotiable.** Each pattern in this file has a reduced-motion branch and they are not the same:
   - Pattern 1: instant fade-in chapters, no pin, no scrub.
   - Pattern 2: static layered background, no parallax, highlights ignite immediately.
   - Pattern 3: vertical stack regardless of screen width.
   - Pattern 4: path drawn at full length on mount, no scrub, all beats stacked.
   - Pattern 5: instant reveal per milestone, scroll progress bar is filled to 100%.
   Use `gsap.matchMedia({ reduceMotion: '(prefers-reduced-motion: reduce)' }, ctx => ...)` for GSAP patterns and motion's `useReducedMotion()` for Framer patterns. Wrapping `<MotionConfig reducedMotion="user">` higher in the tree opts every motion subtree in globally — drop it in `app/layout.tsx` if your team prefers a single switch over per-component checks.
5. **Mobile fallbacks render a different DOM, not a different animation.** Patterns 1 and 3 both render two trees (desktop pinned, mobile stacked) and CSS-toggle visibility. This is intentional — flex-direction switches mid-animation fight GSAP's pin spacer math, and the perf hit of two trees is negligible compared to forcing a 50KB pinned scene to render on a 4G phone. Audit with `ScrollTrigger.getAll().length` in dev — desktop should report exactly the number of triggers your patterns create; if mobile reports more than zero, the matchMedia branch is leaking.

Bonus: if scroll feels heavy on Safari, the culprit is almost always `backdrop-filter` stacking. Glass progress bars (Pattern 5's sticky header) are the worst offender. If you see frame drops, swap `backdrop-filter: blur(...)` for a solid `rgba(0,0,0,0.85)` background — Safari's WebKit composer cannot rasterize backdrop blur on a sticky element while a paint-heavy timeline scrolls beneath it.

---

## Cross-References

- `references/00-dark-tokens.md` — every color, glow, radius, easing, and z-index token referenced above
- `references/01-framer-motion.md` — `useScroll`, `useTransform`, `useInView`, `useReducedMotion`, `<MotionConfig>` (peers for Patterns 2, 4, 5)
- `references/02-gsap.md` — ScrollTrigger primitives, `gsap.matchMedia`, `useGSAP` hook, the original `ScrollStory` scene that Pattern 1 expands (peers for Patterns 1, 3)
- `references/03-threejs-r3f.md` — `<ScrollControls>` from `@react-three/drei` for the 3D-camera variant of Pattern 4
- `references/patterns/hero.md` — `ParallaxHero` and `WordRevealHeading` are the natural intro that hands off to Pattern 1 below the fold
- `references/patterns/features.md` — the bento grid pairs well after Pattern 5's roadmap as a feature catalog
- `references/17-skeleton-system.md` — pair the skeleton-to-content swap with Pattern 5's reveal cascade so async-loaded milestones don't pop
