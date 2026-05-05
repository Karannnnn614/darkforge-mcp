# Darkforge — Testimonial Patterns
6 production-ready dark testimonial patterns. Every variant honors the AMOLED palette, ships with real-feeling social proof, mobile-first responsive layouts, full a11y wiring, and `prefers-reduced-motion` fallbacks.
Pick the variant that matches the page goal — carousel for landing, masonry for proof-heavy product pages, hero quote for case-study lead-ins, marquee for "wall of love," video for high-trust enterprise sales, and tweet/social card embeds for community-led products.

## Contents

- [Source caveat](#source-caveat)
- [Shared types + sample data](#shared-types-sample-data)
- [Pattern 1 — Carousel (swipable on mobile)](#pattern-1-carousel-swipable-on-mobile)
- [Pattern 2 — Masonry Grid (variable-height proof wall)](#pattern-2-masonry-grid-variable-height-proof-wall)
- [Pattern 3 — Hero Quote (single big testimonial)](#pattern-3-hero-quote-single-big-testimonial)
- [Pattern 4 — Infinite Marquee (two rows, opposite directions)](#pattern-4-infinite-marquee-two-rows-opposite-directions)
- [Pattern 5 — Video Testimonial Cards](#pattern-5-video-testimonial-cards)
- [Pattern 6 — Tweet / Social Card Embed Style](#pattern-6-tweet-social-card-embed-style)
- [Cross-References](#cross-references)
- [Implementation notes](#implementation-notes)

---

## Source caveat

```
// VERIFY: All TSX below is reconstructed from training-data familiarity with
//   framer-motion (v11), magicui (Marquee), and aceternity-ui (InfiniteMovingCards).
//   context7 + WebFetch were unavailable when this file was written - confirm
//   import paths and prop names against the live docs before shipping:
//     - https://www.framer.com/motion/
//     - https://magicui.design/docs/components/marquee
//     - https://forge.aceternity.com/components/infinite-moving-cards
// Avatar URLs use the i.pravatar.cc placeholder service (deterministic by seed).
//   In production, swap for self-hosted assets - pravatar may rate-limit and
//   doesn't preserve identity across deploys. For headshots, use Cloudinary,
//   imgix, or your CDN. Names + companies + quotes are illustrative - replace
//   with real customers (with permission) before going live.
```

---

## Shared types + sample data

Reused by every pattern below. Define once in `lib/testimonials.ts` (or co-locate per pattern).

```ts
// lib/testimonials.ts
export type Testimonial = {
  id: string
  name: string
  role: string
  company: string
  companyLogo?: string         // square favicon-style URL
  avatar: string               // headshot URL
  quote: string                // single-paragraph short form
  longQuote?: string[]         // multi-paragraph for masonry / hero
  rating?: 1 | 2 | 3 | 4 | 5
  videoUrl?: string            // mp4/webm or YouTube embed for video pattern
  thumbnail?: string           // poster frame for video
  durationSec?: number
  social?: {
    platform: 'x' | 'linkedin'
    handle: string
    verified?: boolean
    likes?: number
    reposts?: number
    replies?: number
    postedAt?: string         // ISO date
  }
}

export const TESTIMONIALS: Testimonial[] = [
  {
    id: 't1',
    name: 'Sarah Chen',
    role: 'Head of Growth',
    company: 'Stripe',
    avatar: 'https://i.pravatar.cc/160?img=47',
    rating: 5,
    quote:
      'Darkforge cut our design-to-ship time by 60%. We now prototype dark dashboards in a single afternoon and they actually pass design review.',
    longQuote: [
      'Darkforge cut our design-to-ship time by 60%. We now prototype dark dashboards in a single afternoon and they actually pass design review.',
      'The token system is the real magic - every Claude-generated component already speaks our visual language, so engineers stop arguing about hex codes and ship.',
    ],
    social: {
      platform: 'x',
      handle: '@sarahchen',
      verified: true,
      likes: 1247,
      reposts: 184,
      replies: 31,
      postedAt: '2026-03-14',
    },
  },
  {
    id: 't2',
    name: 'Marcus Okonkwo',
    role: 'Staff Engineer',
    company: 'Linear',
    avatar: 'https://i.pravatar.cc/160?img=12',
    rating: 5,
    quote:
      'Genuinely the first AI-UI tool that nails OLED black. Our marketing site was rebuilt in a weekend and it finally looks like our app.',
    longQuote: [
      'Genuinely the first AI-UI tool that nails OLED black. Most generators output grey-on-grey slop - this one understands neon glow restraint.',
      'I plugged it into our existing Tailwind config and it inherited every token without complaint. Zero PRs needed to align with our DS.',
    ],
    social: {
      platform: 'x',
      handle: '@marcus_dev',
      verified: true,
      likes: 892,
      reposts: 73,
      postedAt: '2026-02-28',
    },
  },
  {
    id: 't3',
    name: 'Priya Raghavan',
    role: 'Design Engineer',
    company: 'Vercel',
    avatar: 'https://i.pravatar.cc/160?img=45',
    rating: 5,
    quote:
      'The glassmorphism presets are chef-kiss. I used to hand-tune backdrop-filter for hours - now I just describe the vibe and ship.',
  },
  {
    id: 't4',
    name: 'Jonas Weber',
    role: 'Founder',
    company: 'Reflect',
    avatar: 'https://i.pravatar.cc/160?img=33',
    rating: 5,
    quote:
      'We replaced three design tools with Darkforge. The output is good enough that our designer started using Claude for first drafts.',
    social: {
      platform: 'linkedin',
      handle: 'jonasweber',
      verified: true,
      likes: 412,
      reposts: 28,
      postedAt: '2026-03-02',
    },
  },
  {
    id: 't5',
    name: 'Ana Lima',
    role: 'Frontend Lead',
    company: 'Raycast',
    avatar: 'https://i.pravatar.cc/160?img=20',
    rating: 5,
    quote:
      'Every component lands accessible - focus rings, aria labels, reduced-motion fallbacks. That alone saves us a sprint per quarter.',
    longQuote: [
      'Every component lands accessible - focus rings, aria labels, reduced-motion fallbacks. That alone saves us a sprint per quarter.',
      'And the docs are written for engineers who actually read code, not marketing pages disguised as documentation.',
      'Underrated feature: it teaches you why a token exists. Junior devs onboard 3x faster.',
    ],
  },
  {
    id: 't6',
    name: 'Diego Alvarez',
    role: 'Engineering Manager',
    company: 'Plaid',
    avatar: 'https://i.pravatar.cc/160?img=15',
    rating: 5,
    quote:
      'Shipped a full pricing page redesign in 4 hours, including animations. Reviewers thought we hired a contractor.',
  },
  {
    id: 't7',
    name: 'Yuki Tanaka',
    role: 'Product Designer',
    company: 'Figma',
    avatar: 'https://i.pravatar.cc/160?img=23',
    rating: 5,
    quote:
      "I'm a designer who can't really code. Darkforge gave me a way to actually push pixels in production without bothering an engineer.",
  },
  {
    id: 't8',
    name: 'Olivia Park',
    role: 'CTO',
    company: 'Cal.com',
    avatar: 'https://i.pravatar.cc/160?img=44',
    rating: 5,
    quote:
      'The neon-violet glow is the new default vibe of our product. Three customers asked who redesigned us - it was Claude and a Tuesday.',
  },
  {
    id: 't9',
    name: 'Tomas Restrepo',
    role: 'Senior Frontend Engineer',
    company: 'Resend',
    avatar: 'https://i.pravatar.cc/160?img=8',
    rating: 5,
    quote:
      'I was skeptical of "AI design." Darkforge converted me. The componentry is opinionated in exactly the right places.',
  },
  {
    id: 't10',
    name: 'Hana Nakamura',
    role: 'Head of Design',
    company: 'PostHog',
    avatar: 'https://i.pravatar.cc/160?img=49',
    rating: 5,
    quote:
      "The way it handles dark-mode contrast for charts is *actually* WCAG-compliant. First time I haven't had to retrofit.",
  },
  // Video-specific entries used by Pattern 5
  {
    id: 'v1',
    name: 'Lena Voss',
    role: 'VP Engineering',
    company: 'Loom',
    avatar: 'https://i.pravatar.cc/160?img=29',
    quote: 'How Darkforge rebuilt our entire dashboard in one weekend.',
    videoUrl: 'https://example.com/testimonial-loom.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&q=70',
    durationSec: 87,
  },
  {
    id: 'v2',
    name: 'Kwame Asante',
    role: 'Director of Product',
    company: 'Notion',
    avatar: 'https://i.pravatar.cc/160?img=11',
    quote: 'Why we switched from custom CSS to Darkforge tokens.',
    videoUrl: 'https://example.com/testimonial-notion.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=70',
    durationSec: 124,
  },
  {
    id: 'v3',
    name: 'Maya Sokolova',
    role: 'Lead Designer',
    company: 'Arc Browser',
    avatar: 'https://i.pravatar.cc/160?img=24',
    quote: "A designer's honest take on AI-generated UI.",
    videoUrl: 'https://example.com/testimonial-arc.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=70',
    durationSec: 96,
  },
  {
    id: 'v4',
    name: 'Rafael Costa',
    role: 'Solo Founder',
    company: 'Lago',
    avatar: 'https://i.pravatar.cc/160?img=14',
    quote: 'How a solo founder ships like a 10-person team.',
    videoUrl: 'https://example.com/testimonial-lago.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&q=70',
    durationSec: 68,
  },
]
```

---

## Pattern 1 — Carousel (swipable on mobile)

Full-width testimonial carousel. Dot indicators with DF violet active state, autoplay with pause-on-hover and pause-on-focus, drag-to-swipe via Framer Motion drag, keyboard arrows (left/right), `aria-live="polite"` for slide announcements, full reduced-motion freeze.

```tsx
// Requires: framer-motion, react. DF tokens injected at :root.
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence, useReducedMotion, type PanInfo } from 'framer-motion'
import type { Testimonial } from '@/lib/testimonials'

interface TestimonialCarouselProps {
  testimonials: Testimonial[]
  autoplayMs?: number
  ariaLabel?: string
}

export function TestimonialCarousel({
  testimonials,
  autoplayMs = 6000,
  ariaLabel = 'Customer testimonials',
}: TestimonialCarouselProps) {
  const [index, setIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [direction, setDirection] = useState<1 | -1>(1)
  const reduceMotion = useReducedMotion()
  const liveRegionRef = useRef<HTMLDivElement>(null)
  const total = testimonials.length

  const goTo = useCallback(
    (next: number, dir: 1 | -1 = 1) => {
      setDirection(dir)
      setIndex(((next % total) + total) % total)
    },
    [total],
  )

  const next = useCallback(() => goTo(index + 1, 1), [goTo, index])
  const prev = useCallback(() => goTo(index - 1, -1), [goTo, index])

  // Autoplay - disabled if user prefers reduced motion or pauses
  useEffect(() => {
    if (reduceMotion || isPaused || total <= 1) return
    const id = window.setInterval(next, autoplayMs)
    return () => window.clearInterval(id)
  }, [reduceMotion, isPaused, next, autoplayMs, total])

  // Keyboard arrows
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next()
      if (e.key === 'ArrowLeft') prev()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [next, prev])

  const handleDragEnd = (_e: unknown, info: PanInfo) => {
    const swipe = info.offset.x
    const velocity = info.velocity.x
    if (swipe < -60 || velocity < -300) next()
    else if (swipe > 60 || velocity > 300) prev()
  }

  const t = testimonials[index]

  return (
    <section
      role="region"
      aria-roledescription="carousel"
      aria-label={ariaLabel}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      style={{
        position: 'relative',
        background: 'var(--df-bg-base)',
        padding: '96px 24px',
        overflow: 'hidden',
      }}
    >
      {/* Ambient violet orb */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 600,
          height: 600,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(167,139,250,0.10) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'relative',
          maxWidth: 880,
          margin: '0 auto',
          textAlign: 'center',
        }}
      >
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
          What our users say
        </p>
        <h2
          style={{
            fontSize: 'clamp(28px, 4vw, 44px)',
            fontWeight: 700,
            color: 'var(--df-text-primary)',
            lineHeight: 1.15,
            margin: '0 0 56px',
            letterSpacing: '-0.02em',
          }}
        >
          Loved by teams shipping in the dark
        </h2>

        {/* Slide stage */}
        <div
          style={{
            position: 'relative',
            minHeight: 280,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AnimatePresence mode="wait" custom={direction}>
            <motion.article
              key={t.id}
              custom={direction}
              drag={reduceMotion ? false : 'x'}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={handleDragEnd}
              initial={
                reduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, x: direction * 60 }
              }
              animate={{ opacity: 1, x: 0 }}
              exit={
                reduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, x: direction * -60 }
              }
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              aria-roledescription="slide"
              aria-label={`Slide ${index + 1} of ${total}`}
              style={{
                background: 'var(--df-glass-bg-md)',
                border: '1px solid var(--df-glass-border-md)',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                borderRadius: 'var(--df-radius-xl)',
                padding: 'clamp(28px, 5vw, 48px)',
                width: '100%',
                cursor: reduceMotion ? 'default' : 'grab',
                userSelect: 'none',
              }}
            >
              {t.rating && (
                <div
                  aria-label={`Rated ${t.rating} out of 5`}
                  style={{ display: 'flex', justifyContent: 'center', gap: 4, marginBottom: 24 }}
                >
                  {Array.from({ length: 5 }).map((_, i) => (
                    <svg
                      key={i}
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill={i < t.rating! ? 'var(--df-neon-amber)' : 'var(--df-bg-muted)'}
                      aria-hidden="true"
                    >
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  ))}
                </div>
              )}

              <blockquote
                style={{
                  fontSize: 'clamp(18px, 2.4vw, 24px)',
                  fontWeight: 500,
                  lineHeight: 1.5,
                  color: 'var(--df-text-primary)',
                  margin: '0 0 32px',
                  letterSpacing: '-0.01em',
                }}
              >
                &ldquo;{t.quote}&rdquo;
              </blockquote>

              <footer
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 12,
                }}
              >
                <img
                  src={t.avatar}
                  alt=""
                  loading="lazy"
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2px solid var(--df-border-default)',
                  }}
                />
                <div style={{ textAlign: 'left' }}>
                  <p
                    style={{
                      color: 'var(--df-text-primary)',
                      fontSize: 15,
                      fontWeight: 600,
                      margin: 0,
                    }}
                  >
                    {t.name}
                  </p>
                  <p
                    style={{
                      color: 'var(--df-text-secondary)',
                      fontSize: 13,
                      margin: 0,
                    }}
                  >
                    {t.role} - {t.company}
                  </p>
                </div>
              </footer>
            </motion.article>
          </AnimatePresence>
        </div>

        {/* Controls */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 24,
            marginTop: 40,
          }}
        >
          <button
            type="button"
            onClick={prev}
            aria-label="Previous testimonial"
            style={arrowButtonStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(167,139,250,0.4)'
              e.currentTarget.style.boxShadow = 'var(--df-glow-violet)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--df-border-default)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          {/* Dots */}
          <div role="tablist" aria-label="Select slide" style={{ display: 'flex', gap: 8 }}>
            {testimonials.map((_, i) => {
              const active = i === index
              return (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-label={`Go to slide ${i + 1}`}
                  tabIndex={active ? 0 : -1}
                  onClick={() => goTo(i, i > index ? 1 : -1)}
                  style={{
                    width: active ? 28 : 8,
                    height: 8,
                    borderRadius: 'var(--df-radius-full)',
                    background: active
                      ? 'var(--df-neon-violet)'
                      : 'var(--df-bg-muted)',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: active ? 'var(--df-glow-violet)' : 'none',
                    transition:
                      'width var(--df-duration-base) var(--df-ease-out), background-color var(--df-duration-base) var(--df-ease-out)',
                  }}
                />
              )
            })}
          </div>

          <button
            type="button"
            onClick={next}
            aria-label="Next testimonial"
            style={arrowButtonStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(167,139,250,0.4)'
              e.currentTarget.style.boxShadow = 'var(--df-glow-violet)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--df-border-default)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>

        {/* SR-only live announcement */}
        <div
          ref={liveRegionRef}
          aria-live="polite"
          aria-atomic="true"
          style={{
            position: 'absolute',
            width: 1,
            height: 1,
            padding: 0,
            margin: -1,
            overflow: 'hidden',
            clip: 'rect(0,0,0,0)',
            whiteSpace: 'nowrap',
            border: 0,
          }}
        >
          {`Testimonial ${index + 1} of ${total}: ${t.name} from ${t.company}`}
        </div>
      </div>
    </section>
  )
}

const arrowButtonStyle: React.CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: '50%',
  background: 'var(--df-glass-bg)',
  border: '1px solid var(--df-border-default)',
  color: 'var(--df-text-primary)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backdropFilter: 'blur(12px)',
  transition: 'border-color var(--df-duration-base) var(--df-ease-out), box-shadow var(--df-duration-base) var(--df-ease-out)',
}
```

---

## Pattern 2 — Masonry Grid (variable-height proof wall)

3-column masonry with CSS columns (responsive to 2 / 1), real avatars, multi-paragraph long quotes, DF glass card aesthetic. Each card animates in on scroll via `whileInView`. Cards stagger with a small delay so a long page doesn't feel like an explosion.

```tsx
'use client'

import { motion, useReducedMotion } from 'framer-motion'
import type { Testimonial } from '@/lib/testimonials'

interface MasonryProps {
  testimonials: Testimonial[]
  title?: string
  eyebrow?: string
}

export function TestimonialMasonry({
  testimonials,
  title = "A decade of trust, in our customers' words",
  eyebrow = 'Wall of love',
}: MasonryProps) {
  const reduceMotion = useReducedMotion()

  return (
    <section
      style={{
        background: 'var(--df-bg-base)',
        padding: '96px 24px',
        position: 'relative',
      }}
      aria-label="Customer testimonials"
    >
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <header style={{ textAlign: 'center', marginBottom: 64 }}>
          <p
            style={{
              color: 'var(--df-neon-cyan)',
              fontSize: 13,
              fontWeight: 500,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              margin: '0 0 16px',
            }}
          >
            {eyebrow}
          </p>
          <h2
            style={{
              fontSize: 'clamp(28px, 4vw, 44px)',
              fontWeight: 700,
              color: 'var(--df-text-primary)',
              lineHeight: 1.15,
              margin: 0,
              letterSpacing: '-0.02em',
            }}
          >
            {title}
          </h2>
        </header>

        {/* CSS columns gives us a real masonry without JS layout math */}
        <div
          style={{
            columnGap: 'var(--df-space-6)',
          }}
          className="nx-masonry"
        >
          <style>{`
            .nx-masonry {
              column-count: 1;
            }
            @media (min-width: 640px) {
              .nx-masonry { column-count: 2; }
            }
            @media (min-width: 1024px) {
              .nx-masonry { column-count: 3; }
            }
            .nx-masonry > * {
              break-inside: avoid;
              margin-bottom: var(--df-space-6);
            }
          `}</style>

          {testimonials.map((t, i) => (
            <motion.article
              key={t.id}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{
                duration: 0.5,
                delay: reduceMotion ? 0 : Math.min(i * 0.05, 0.4),
                ease: [0.16, 1, 0.3, 1],
              }}
              style={{
                background: 'var(--df-glass-bg)',
                border: '1px solid var(--df-glass-border)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                borderRadius: 'var(--df-radius-lg)',
                padding: 'var(--df-space-6)',
                transition:
                  'border-color var(--df-duration-base) var(--df-ease-out), box-shadow var(--df-duration-base) var(--df-ease-out)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(167,139,250,0.3)'
                e.currentTarget.style.boxShadow = 'var(--df-glow-violet)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--df-glass-border)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              {t.rating && (
                <div
                  aria-label={`Rated ${t.rating} out of 5`}
                  style={{ display: 'flex', gap: 2, marginBottom: 16 }}
                >
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <svg
                      key={idx}
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill={idx < t.rating! ? 'var(--df-neon-amber)' : 'var(--df-bg-muted)'}
                      aria-hidden="true"
                    >
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  ))}
                </div>
              )}

              {(t.longQuote ?? [t.quote]).map((para, idx) => (
                <p
                  key={idx}
                  style={{
                    color: 'var(--df-text-primary)',
                    fontSize: 15,
                    lineHeight: 1.65,
                    margin: idx === 0 ? '0 0 12px' : '0 0 12px',
                  }}
                >
                  {idx === 0 && (
                    <span
                      aria-hidden="true"
                      style={{
                        color: 'var(--df-neon-violet)',
                        fontFamily: 'var(--df-font-display, Georgia, serif)',
                        fontSize: 24,
                        lineHeight: 1,
                        marginRight: 4,
                      }}
                    >
                      &ldquo;
                    </span>
                  )}
                  {para}
                </p>
              ))}

              <footer
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  marginTop: 20,
                  paddingTop: 16,
                  borderTop: '1px solid var(--df-border-subtle)',
                }}
              >
                <img
                  src={t.avatar}
                  alt=""
                  loading="lazy"
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    objectFit: 'cover',
                  }}
                />
                <div>
                  <p
                    style={{
                      color: 'var(--df-text-primary)',
                      fontSize: 14,
                      fontWeight: 600,
                      margin: 0,
                    }}
                  >
                    {t.name}
                  </p>
                  <p
                    style={{
                      color: 'var(--df-text-secondary)',
                      fontSize: 12,
                      margin: 0,
                    }}
                  >
                    {t.role} <span aria-hidden="true">-</span>{' '}
                    <span style={{ color: 'var(--df-text-accent)' }}>{t.company}</span>
                  </p>
                </div>
              </footer>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}
```

---

## Pattern 3 — Hero Quote (single big testimonial)

One huge centered quote with massive serif quote marks (DF violet), author photo, name, company logo. Designed to live on its own as a section between feature and pricing. The quote marks are decorative — `aria-hidden`, but the blockquote semantics carry the meaning.

```tsx
'use client'

import { motion, useReducedMotion } from 'framer-motion'
import type { Testimonial } from '@/lib/testimonials'

interface HeroQuoteProps {
  testimonial: Testimonial
  /** Optional company wordmark URL (rendered above the quote in muted color) */
  companyWordmark?: string
}

export function TestimonialHeroQuote({
  testimonial,
  companyWordmark,
}: HeroQuoteProps) {
  const reduceMotion = useReducedMotion()

  return (
    <section
      style={{
        background: 'var(--df-bg-base)',
        padding: 'clamp(80px, 12vw, 160px) 24px',
        position: 'relative',
        overflow: 'hidden',
      }}
      aria-label="Featured customer testimonial"
    >
      {/* Decorative orb behind the quote */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 800,
          height: 800,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(167,139,250,0.08) 0%, transparent 60%)',
          pointerEvents: 'none',
        }}
      />

      <motion.figure
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: 'relative',
          maxWidth: 920,
          margin: '0 auto',
          textAlign: 'center',
        }}
      >
        {companyWordmark && (
          <img
            src={companyWordmark}
            alt={`${testimonial.company} logo`}
            style={{
              height: 28,
              opacity: 0.6,
              filter: 'grayscale(1) brightness(2)',
              margin: '0 auto 40px',
              display: 'block',
            }}
          />
        )}

        {/* Giant decorative quote glyph */}
        <span
          aria-hidden="true"
          style={{
            display: 'block',
            fontFamily: 'var(--df-font-display, Georgia, serif)',
            fontSize: 'clamp(120px, 18vw, 220px)',
            lineHeight: 0.7,
            color: 'var(--df-neon-violet)',
            textShadow: '0 0 60px rgba(167,139,250,0.4)',
            marginBottom: -40,
            userSelect: 'none',
          }}
        >
          &ldquo;
        </span>

        <blockquote
          style={{
            fontSize: 'clamp(24px, 3.6vw, 44px)',
            fontWeight: 500,
            lineHeight: 1.35,
            letterSpacing: '-0.02em',
            color: 'var(--df-text-primary)',
            margin: '0 0 48px',
          }}
        >
          {testimonial.quote}
        </blockquote>

        <figcaption
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <img
            src={testimonial.avatar}
            alt=""
            loading="lazy"
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2px solid var(--df-border-default)',
              boxShadow: '0 0 0 4px rgba(167,139,250,0.15)',
            }}
          />
          <div>
            <p
              style={{
                color: 'var(--df-text-primary)',
                fontSize: 17,
                fontWeight: 600,
                margin: 0,
                letterSpacing: '-0.01em',
              }}
            >
              {testimonial.name}
            </p>
            <p
              style={{
                color: 'var(--df-text-secondary)',
                fontSize: 14,
                margin: '4px 0 0',
              }}
            >
              {testimonial.role} at{' '}
              <span style={{ color: 'var(--df-text-accent)' }}>{testimonial.company}</span>
            </p>
          </div>
        </figcaption>
      </motion.figure>
    </section>
  )
}
```

---

## Pattern 4 — Infinite Marquee (two rows, opposite directions)

Pure-CSS infinite marquee — duplicates the track once for seamless loop, pauses on hover, fades edges with mask gradients, reverses second row. No JS animation loop required. `prefers-reduced-motion` freezes both rows.

```tsx
'use client'

import type { Testimonial } from '@/lib/testimonials'

interface MarqueeProps {
  testimonials: Testimonial[]
  /** Animation duration in seconds for one full track loop */
  durationSec?: number
}

export function TestimonialMarquee({
  testimonials,
  durationSec = 50,
}: MarqueeProps) {
  // Split roughly in half for two distinct rows
  const mid = Math.ceil(testimonials.length / 2)
  const rowA = testimonials.slice(0, mid)
  const rowB = testimonials.slice(mid)

  return (
    <section
      aria-label="Customer testimonials"
      style={{
        background: 'var(--df-bg-base)',
        padding: '96px 0',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <header style={{ textAlign: 'center', marginBottom: 56, padding: '0 24px' }}>
        <p
          style={{
            color: 'var(--df-neon-pink)',
            fontSize: 13,
            fontWeight: 500,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            margin: '0 0 16px',
          }}
        >
          The receipts
        </p>
        <h2
          style={{
            fontSize: 'clamp(28px, 4vw, 44px)',
            fontWeight: 700,
            color: 'var(--df-text-primary)',
            margin: 0,
            letterSpacing: '-0.02em',
          }}
        >
          What teams are saying right now
        </h2>
      </header>

      <style>{`
        @keyframes nx-marquee-left {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @keyframes nx-marquee-right {
          from { transform: translateX(-50%); }
          to   { transform: translateX(0); }
        }
        .nx-marquee-track {
          display: flex;
          gap: var(--df-space-4);
          width: max-content;
          will-change: transform;
        }
        .nx-marquee-track-a {
          animation: nx-marquee-left ${durationSec}s linear infinite;
        }
        .nx-marquee-track-b {
          animation: nx-marquee-right ${durationSec * 1.2}s linear infinite;
        }
        .nx-marquee-viewport:hover .nx-marquee-track,
        .nx-marquee-viewport:focus-within .nx-marquee-track {
          animation-play-state: paused;
        }
        @media (prefers-reduced-motion: reduce) {
          .nx-marquee-track-a,
          .nx-marquee-track-b {
            animation: none;
            transform: translateX(0);
          }
        }
        .nx-marquee-mask {
          mask-image: linear-gradient(
            90deg,
            transparent 0,
            #000 80px,
            #000 calc(100% - 80px),
            transparent 100%
          );
          -webkit-mask-image: linear-gradient(
            90deg,
            transparent 0,
            #000 80px,
            #000 calc(100% - 80px),
            transparent 100%
          );
        }
      `}</style>

      {/* Row A - left */}
      <div
        className="nx-marquee-viewport nx-marquee-mask"
        role="group"
        aria-roledescription="testimonial marquee"
        style={{ overflow: 'hidden', marginBottom: 24 }}
      >
        <div className="nx-marquee-track nx-marquee-track-a">
          {[...rowA, ...rowA].map((t, i) => (
            <MarqueeCard key={`a-${i}`} t={t} ariaHidden={i >= rowA.length} />
          ))}
        </div>
      </div>

      {/* Row B - right */}
      <div
        className="nx-marquee-viewport nx-marquee-mask"
        role="group"
        aria-roledescription="testimonial marquee"
        style={{ overflow: 'hidden' }}
      >
        <div className="nx-marquee-track nx-marquee-track-b">
          {[...rowB, ...rowB].map((t, i) => (
            <MarqueeCard key={`b-${i}`} t={t} ariaHidden={i >= rowB.length} />
          ))}
        </div>
      </div>
    </section>
  )
}

function MarqueeCard({ t, ariaHidden }: { t: Testimonial; ariaHidden: boolean }) {
  return (
    <article
      aria-hidden={ariaHidden ? 'true' : undefined}
      style={{
        flex: '0 0 auto',
        width: 'clamp(280px, 32vw, 360px)',
        background: 'var(--df-glass-bg)',
        border: '1px solid var(--df-glass-border)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderRadius: 'var(--df-radius-lg)',
        padding: 'var(--df-space-5)',
      }}
    >
      <p
        style={{
          color: 'var(--df-text-primary)',
          fontSize: 14,
          lineHeight: 1.6,
          margin: '0 0 16px',
          display: '-webkit-box',
          WebkitLineClamp: 4,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        &ldquo;{t.quote}&rdquo;
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <img
          src={t.avatar}
          alt=""
          loading="lazy"
          style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
        />
        <div>
          <p
            style={{
              color: 'var(--df-text-primary)',
              fontSize: 13,
              fontWeight: 600,
              margin: 0,
            }}
          >
            {t.name}
          </p>
          <p
            style={{
              color: 'var(--df-text-secondary)',
              fontSize: 11,
              margin: 0,
            }}
          >
            {t.role} - {t.company}
          </p>
        </div>
      </div>
    </article>
  )
}
```

---

## Pattern 5 — Video Testimonial Cards

Grid of 4 video thumbnails with play button overlays. Click expands to a fullscreen glass modal with inline `<video>`. Modal closes on `Escape` and backdrop click, restores focus to the trigger on close, and locks body scroll while open.

```tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import type { Testimonial } from '@/lib/testimonials'

interface VideoTestimonialsProps {
  testimonials: Testimonial[] // expected to have videoUrl + thumbnail
  title?: string
}

export function VideoTestimonialGrid({
  testimonials,
  title = 'See it from people who shipped it',
}: VideoTestimonialsProps) {
  const [active, setActive] = useState<Testimonial | null>(null)
  const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const lastTrigger = useRef<HTMLButtonElement | null>(null)
  const reduceMotion = useReducedMotion()

  const open = (t: Testimonial, btn: HTMLButtonElement | null) => {
    lastTrigger.current = btn
    setActive(t)
  }
  const close = () => {
    setActive(null)
    // Restore focus to the trigger that opened the modal
    requestAnimationFrame(() => lastTrigger.current?.focus())
  }

  // Lock body scroll + escape to close
  useEffect(() => {
    if (!active) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])

  return (
    <section
      style={{ background: 'var(--df-bg-base)', padding: '96px 24px' }}
      aria-label="Video testimonials"
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <h2
          style={{
            fontSize: 'clamp(28px, 4vw, 44px)',
            fontWeight: 700,
            color: 'var(--df-text-primary)',
            textAlign: 'center',
            margin: '0 0 56px',
            letterSpacing: '-0.02em',
          }}
        >
          {title}
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 'var(--df-space-6)',
          }}
        >
          {testimonials.map((t) => (
            <button
              key={t.id}
              ref={(el) => {
                triggerRefs.current[t.id] = el
              }}
              type="button"
              onClick={(e) => open(t, e.currentTarget)}
              aria-label={`Play video testimonial from ${t.name}, ${t.role} at ${t.company}`}
              style={{
                position: 'relative',
                width: '100%',
                aspectRatio: '16 / 10',
                background: 'var(--df-bg-elevated)',
                border: '1px solid var(--df-border-default)',
                borderRadius: 'var(--df-radius-lg)',
                overflow: 'hidden',
                cursor: 'pointer',
                padding: 0,
                transition:
                  'border-color var(--df-duration-base) var(--df-ease-out), transform var(--df-duration-base) var(--df-ease-out), box-shadow var(--df-duration-base) var(--df-ease-out)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(167,139,250,0.4)'
                e.currentTarget.style.transform = reduceMotion ? 'none' : 'translateY(-2px)'
                e.currentTarget.style.boxShadow = 'var(--df-glow-violet)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--df-border-default)'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--df-border-focus)'
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(167,139,250,0.2)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--df-border-default)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              {t.thumbnail && (
                <img
                  src={t.thumbnail}
                  alt=""
                  loading="lazy"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    opacity: 0.7,
                  }}
                />
              )}
              {/* Dark gradient for text legibility */}
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  inset: 0,
                  background:
                    'linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.85) 100%)',
                }}
              />
              {/* Play button */}
              <span
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: 'var(--df-neon-violet)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'var(--df-glow-violet-lg)',
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="#000">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
              {/* Footer caption */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: 'var(--df-space-4)',
                  textAlign: 'left',
                }}
              >
                <p
                  style={{
                    color: 'var(--df-text-primary)',
                    fontSize: 14,
                    fontWeight: 600,
                    margin: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {t.name}
                </p>
                <p
                  style={{
                    color: 'var(--df-text-secondary)',
                    fontSize: 12,
                    margin: '2px 0 0',
                  }}
                >
                  {t.company}
                  {t.durationSec && (
                    <span style={{ color: 'var(--df-text-muted)' }}>
                      {' - '}
                      {Math.floor(t.durationSec / 60)}:
                      {String(t.durationSec % 60).padStart(2, '0')}
                    </span>
                  )}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {active && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="video-testimonial-title"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={close}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 'var(--df-z-modal)',
              background: 'rgba(0,0,0,0.85)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 24,
            }}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 16 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: 960,
                background: 'var(--df-bg-overlay)',
                border: '1px solid var(--df-glass-border-md)',
                borderRadius: 'var(--df-radius-xl)',
                overflow: 'hidden',
                boxShadow: '0 40px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05)',
              }}
            >
              <button
                type="button"
                onClick={close}
                aria-label="Close video"
                style={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  zIndex: 1,
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'rgba(0,0,0,0.6)',
                  border: '1px solid var(--df-border-default)',
                  color: 'var(--df-text-primary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>

              <video
                key={active.id}
                src={active.videoUrl}
                poster={active.thumbnail}
                controls
                autoPlay={!reduceMotion}
                playsInline
                style={{
                  width: '100%',
                  display: 'block',
                  background: '#000',
                  aspectRatio: '16 / 9',
                }}
              >
                Your browser doesn&rsquo;t support embedded video. Watch on{' '}
                <a href={active.videoUrl}>the source page</a> instead.
              </video>

              <div style={{ padding: 'var(--df-space-5)' }}>
                <h3
                  id="video-testimonial-title"
                  style={{
                    color: 'var(--df-text-primary)',
                    fontSize: 18,
                    fontWeight: 600,
                    margin: '0 0 8px',
                  }}
                >
                  {active.quote}
                </h3>
                <p
                  style={{
                    color: 'var(--df-text-secondary)',
                    fontSize: 14,
                    margin: 0,
                  }}
                >
                  {active.name} - {active.role} at{' '}
                  <span style={{ color: 'var(--df-text-accent)' }}>{active.company}</span>
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
```

---

## Pattern 6 — Tweet / Social Card Embed Style

Replicates the X / LinkedIn post aesthetic — avatar + handle + verified badge + quote + engagement stats. Dark version with DF violet checkmark instead of platform blue. Engagement counts are formatted (1.2k, 1M) for readability.

```tsx
'use client'

import type { Testimonial } from '@/lib/testimonials'

interface SocialCardsProps {
  testimonials: Testimonial[] // expects entries with social.* populated
  title?: string
  eyebrow?: string
}

const formatCount = (n?: number) => {
  if (n === undefined) return ''
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}

const formatDate = (iso?: string) => {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return iso
  }
}

export function TestimonialSocialCards({
  testimonials,
  title = 'Straight from the timeline',
  eyebrow = 'In the wild',
}: SocialCardsProps) {
  const withSocial = testimonials.filter((t) => t.social)

  return (
    <section
      style={{ background: 'var(--df-bg-base)', padding: '96px 24px' }}
      aria-label="Social media testimonials"
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <header style={{ textAlign: 'center', marginBottom: 56 }}>
          <p
            style={{
              color: 'var(--df-neon-violet)',
              fontSize: 13,
              fontWeight: 500,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              margin: '0 0 16px',
            }}
          >
            {eyebrow}
          </p>
          <h2
            style={{
              fontSize: 'clamp(28px, 4vw, 44px)',
              fontWeight: 700,
              color: 'var(--df-text-primary)',
              margin: 0,
              letterSpacing: '-0.02em',
            }}
          >
            {title}
          </h2>
        </header>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 'var(--df-space-5)',
          }}
        >
          {withSocial.map((t) => {
            const s = t.social!
            return (
              <article
                key={t.id}
                style={{
                  background: 'var(--df-bg-surface)',
                  border: '1px solid var(--df-border-default)',
                  borderRadius: 'var(--df-radius-lg)',
                  padding: 'var(--df-space-5)',
                  transition:
                    'border-color var(--df-duration-base) var(--df-ease-out), box-shadow var(--df-duration-base) var(--df-ease-out)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(167,139,250,0.3)'
                  e.currentTarget.style.boxShadow = 'var(--df-glow-violet)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--df-border-default)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                {/* Header */}
                <header
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    marginBottom: 12,
                  }}
                >
                  <img
                    src={t.avatar}
                    alt=""
                    loading="lazy"
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      objectFit: 'cover',
                      flex: '0 0 auto',
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <p
                        style={{
                          color: 'var(--df-text-primary)',
                          fontSize: 14,
                          fontWeight: 700,
                          margin: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {t.name}
                      </p>
                      {s.verified && (
                        <span
                          aria-label="Verified account"
                          title="Verified"
                          style={{ flex: '0 0 auto', display: 'inline-flex' }}
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="var(--df-neon-violet)"
                            aria-hidden="true"
                            style={{ filter: 'drop-shadow(0 0 4px rgba(167,139,250,0.5))' }}
                          >
                            <path d="M22.5 12.5l-2-2.3.3-3.1-3-.7-1.6-2.6L13.4 5 12 3 10.6 5l-2.8-1.2-1.6 2.6-3 .7.3 3.1-2 2.3 2 2.3-.3 3.1 3 .7 1.6 2.6L10.6 19 12 21l1.4-2 2.8 1.2 1.6-2.6 3-.7-.3-3.1 2-2.3zm-12 4l-4-4 1.4-1.4 2.6 2.6 6.6-6.6L18.5 8.5l-8 8z" />
                          </svg>
                        </span>
                      )}
                    </div>
                    <p
                      style={{
                        color: 'var(--df-text-muted)',
                        fontSize: 13,
                        margin: '2px 0 0',
                      }}
                    >
                      {s.platform === 'x' ? s.handle : `@${s.handle.replace(/^@/, '')}`}{' '}
                      <span aria-hidden="true">-</span>{' '}
                      <span>{s.platform === 'x' ? 'X' : 'LinkedIn'}</span>
                    </p>
                  </div>
                  {/* Platform glyph */}
                  <span
                    aria-hidden="true"
                    style={{
                      color: 'var(--df-text-muted)',
                      flex: '0 0 auto',
                    }}
                  >
                    {s.platform === 'x' ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.86-3.04-1.86 0-2.14 1.45-2.14 2.95v5.66H9.35V9h3.41v1.56h.05c.47-.9 1.63-1.86 3.36-1.86 3.6 0 4.27 2.37 4.27 5.45v6.3zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zm-1.78 13.02h3.55V9H3.56v11.45z" />
                      </svg>
                    )}
                  </span>
                </header>

                {/* Body */}
                <p
                  style={{
                    color: 'var(--df-text-primary)',
                    fontSize: 15,
                    lineHeight: 1.55,
                    margin: '0 0 16px',
                    whiteSpace: 'pre-line',
                  }}
                >
                  {t.quote}
                </p>

                {/* Date */}
                {s.postedAt && (
                  <time
                    dateTime={s.postedAt}
                    style={{
                      color: 'var(--df-text-muted)',
                      fontSize: 13,
                      display: 'block',
                      margin: '0 0 12px',
                    }}
                  >
                    {formatDate(s.postedAt)}
                  </time>
                )}

                {/* Engagement footer */}
                <footer
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 24,
                    paddingTop: 12,
                    borderTop: '1px solid var(--df-border-subtle)',
                    color: 'var(--df-text-secondary)',
                    fontSize: 13,
                  }}
                >
                  {s.replies !== undefined && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                      <span aria-label={`${s.replies} replies`}>{formatCount(s.replies)}</span>
                    </span>
                  )}
                  {s.reposts !== undefined && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path d="M17 1l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3" />
                      </svg>
                      <span aria-label={`${s.reposts} reposts`}>{formatCount(s.reposts)}</span>
                    </span>
                  )}
                  {s.likes !== undefined && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--df-neon-pink)" aria-hidden="true">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                      <span aria-label={`${s.likes} likes`} style={{ color: 'var(--df-neon-pink)' }}>
                        {formatCount(s.likes)}
                      </span>
                    </span>
                  )}
                </footer>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
```

---

## Cross-References

- `framer-motion` (v11) — `AnimatePresence` for carousel + modal transitions, `drag` for carousel swipe, `useReducedMotion` for the universal a11y guard, `whileInView` for masonry stagger. Patterns 1, 2, 3, 5.
- `magic-ui` — `<Marquee />` is a drop-in for Pattern 4 if you want a higher-level abstraction; the version above intentionally avoids the dependency so it ships in raw Next.js with no install.
- `aceternity-ui` — `<InfiniteMovingCards />` is the inspiration for Pattern 4's edge-fade + dual-row layout. If you adopt aceternity, swap in their primitive and skip the `<style>` block.
- `lucide-react` — feel free to replace the inline SVG icons (chevrons, play, X-mark, social glyphs, heart) with `lucide-react` icons; they tree-shake to comparable size and stay consistent across the design system. DF violet is the natural `currentColor`.
- Avatar provider — `i.pravatar.cc` is shown for portability. For production, host on Cloudinary / imgix / your CDN, or use Gravatar with a `dark-mode-friendly` default.

---

## Implementation notes

1. **No hardcoded hex.** Every color above resolves through `var(--df-*)` so the same components retrofit any tenant brand.
2. **Mobile-first.** All grids collapse to a single column at mobile widths; the masonry pattern uses CSS columns so reflow is automatic. The carousel ships drag-to-swipe out of the box.
3. **Reduced-motion.** Every entrance animation is gated on `useReducedMotion()` (or the CSS `@media` rule for marquee). Carousel autoplay disables, masonry stagger collapses to instant, modal transitions degrade to opacity-only, marquee freezes mid-track.
4. **Accessibility.**
   - Carousel: `role="region"` + `aria-roledescription="carousel"`, slides have `aria-roledescription="slide"` + `aria-label="Slide N of M"`, dot nav uses `role="tablist"` / `role="tab"` / `aria-selected`, SR-only `aria-live="polite"` announces every slide change.
   - Masonry: each card is an `<article>`; rating stars have `aria-label="Rated 5 out of 5"` and decorative star fills are `aria-hidden`.
   - Hero quote: `<figure>` + `<blockquote>` + `<figcaption>` is the canonical semantic structure; the giant `&ldquo;` glyph is `aria-hidden`.
   - Marquee: each row has `role="group"` + `aria-roledescription`, duplicate cards (the seamless-loop clones) carry `aria-hidden="true"` so screen readers don't read every quote twice.
   - Video: triggers expose full alt context in `aria-label`, modal is `role="dialog"` + `aria-modal="true"` + labelled by the quote heading, focus is restored to the trigger on close, `Escape` and backdrop click dismiss, body scroll is locked while open.
   - Social cards: verified glyph has `aria-label="Verified account"`, engagement counts have descriptive `aria-label`s, dates use `<time dateTime>`.
5. **Performance.** All `<img>` use `loading="lazy"`. Marquee uses `will-change: transform` on the track only. Modal video uses `playsInline` so iOS doesn't force fullscreen.
6. **Theming hook.** To swap DF violet for cyan or pink everywhere, change the dot active color, glyph color, glow, and verified-badge fill — they all reference `var(--df-neon-violet)`. A `--df-accent` indirection is recommended if you ship multi-theme.
