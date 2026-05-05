# Darkforge — Footer Patterns
Footer patterns for AMOLED-dark sites — multi-column standard, minimal, big animated, newsletter-first, status-aware. Every pattern uses semantic `<footer role="contentinfo">` and groups link columns inside `<nav aria-labelledby>`.

## Contents

- [Source-of-truth caveat](#source-of-truth-caveat)
- [Shared link tree (used by Patterns 1, 3, 4)](#shared-link-tree-used-by-patterns-1-3-4)
- [Pattern 1 — Multi-Column Standard](#pattern-1-multi-column-standard)
- [Pattern 2 — Minimal (logo + copyright)](#pattern-2-minimal-logo-copyright)
- [Pattern 3 — Big Animated Footer (with neon glow)](#pattern-3-big-animated-footer-with-neon-glow)
- [Pattern 4 — Newsletter-First](#pattern-4-newsletter-first)
- [Pattern 5 — Status Footer (SaaS / dev tools)](#pattern-5-status-footer-saas-dev-tools)
- [Picking a pattern](#picking-a-pattern)
- [Cross-References](#cross-references)

---

## Source-of-truth caveat

Written from training-data recall (Jan 2026 cutoff). Targets `framer-motion@11+`. `// VERIFY:` markers flag prop signatures that may shift between minor versions.

---

## Shared link tree (used by Patterns 1, 3, 4)

```tsx
// footer.config.ts
export interface FooterColumn {
  heading: string
  links: { label: string; href: string; badge?: string }[]
}

export const FOOTER_COLUMNS: FooterColumn[] = [
  {
    heading: 'Product',
    links: [
      { label: 'Pricing',    href: '/pricing' },
      { label: 'Features',   href: '/features' },
      { label: 'Changelog',  href: '/changelog', badge: 'New' },
      { label: 'Roadmap',    href: '/roadmap' },
    ],
  },
  {
    heading: 'Resources',
    links: [
      { label: 'Docs',          href: '/docs' },
      { label: 'Guides',        href: '/guides' },
      { label: 'API Reference', href: '/api' },
      { label: 'Status',        href: 'https://status.nexus.cloud' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About',    href: '/about' },
      { label: 'Blog',     href: '/blog' },
      { label: 'Careers',  href: '/careers', badge: '4 open' },
      { label: 'Press',    href: '/press' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Privacy',       href: '/privacy' },
      { label: 'Terms',         href: '/terms' },
      { label: 'Cookie Policy', href: '/cookies' },
      { label: 'Security',      href: '/security' },
    ],
  },
]

export interface SocialLink { label: string; href: string; icon: string }

export const SOCIAL_LINKS: SocialLink[] = [
  { label: 'Twitter / X', href: 'https://twitter.com/nexuscloud',          icon: '𝕏' },
  { label: 'GitHub',      href: 'https://github.com/nexuscloud',           icon: '◷' },
  { label: 'LinkedIn',    href: 'https://linkedin.com/company/nexuscloud', icon: 'in' },
  { label: 'YouTube',     href: 'https://youtube.com/@nexuscloud',         icon: '▶' },
  { label: 'Discord',     href: 'https://discord.gg/nexuscloud',           icon: '◆' },
]
```

(In production, swap the `icon` text glyphs for `lucide-react` SVGs.)

---

## Pattern 1 — Multi-Column Standard

The default. 4 columns of links + brand block + newsletter signup left, social row + status badge bottom.

```tsx
'use client'
import { FOOTER_COLUMNS, SOCIAL_LINKS } from './footer.config'

export function MultiColumnFooter() {
  return (
    <footer
      role="contentinfo"
      style={{
        background: 'var(--df-bg-surface)',
        borderTop: '1px solid var(--df-border-subtle)',
        color: 'var(--df-text-secondary)',
      }}
    >
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '64px 24px 32px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(260px, 1.4fr) repeat(4, 1fr)',
            gap: 48,
            marginBottom: 48,
          }}
        >
          {/* Brand + newsletter */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <span
                style={{
                  width: 28, height: 28, borderRadius: 'var(--df-radius-md)',
                  background: 'linear-gradient(135deg, var(--df-neon-violet), var(--df-neon-cyan))',
                  display: 'grid', placeItems: 'center',
                  fontWeight: 700, color: 'var(--df-text-inverse)', fontSize: 13,
                }}
                aria-hidden="true"
              >
                N
              </span>
              <span style={{ fontWeight: 600, fontSize: 16, color: 'var(--df-text-primary)' }}>
                Nexus Cloud
              </span>
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.6, margin: '0 0 20px', maxWidth: 320 }}>
              The dark UI arsenal for modern teams. Stack-aware, AMOLED-first,
              production-grade.
            </p>
            <form
              onSubmit={e => e.preventDefault()}
              style={{ display: 'flex', gap: 8, maxWidth: 320 }}
            >
              <input
                type="email"
                placeholder="you@company.com"
                aria-label="Email address"
                required
                style={{
                  flex: 1,
                  background: 'var(--df-bg-elevated)',
                  border: '1px solid var(--df-border-default)',
                  borderRadius: 'var(--df-radius-md)',
                  padding: '9px 12px',
                  color: 'var(--df-text-primary)',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                style={{
                  background: 'var(--df-neon-violet)',
                  color: 'var(--df-text-inverse)',
                  border: 'none',
                  borderRadius: 'var(--df-radius-md)',
                  padding: '9px 14px',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Subscribe
              </button>
            </form>
          </div>

          {/* Link columns */}
          {FOOTER_COLUMNS.map(col => {
            const id = `footer-col-${col.heading.toLowerCase()}`
            return (
              <nav key={col.heading} aria-labelledby={id}>
                <h4
                  id={id}
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--df-text-primary)',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    margin: '0 0 16px',
                  }}
                >
                  {col.heading}
                </h4>
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {col.links.map(l => (
                    <li key={l.href}>
                      <a
                        href={l.href}
                        style={{
                          color: 'var(--df-text-secondary)',
                          fontSize: 13,
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 8,
                          transition: 'color 150ms var(--df-ease-out)',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.color = 'var(--df-neon-violet)')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--df-text-secondary)')}
                      >
                        {l.label}
                        {l.badge && (
                          <span
                            style={{
                              background: 'rgba(167,139,250,0.12)',
                              color: 'var(--df-neon-violet)',
                              border: '1px solid rgba(167,139,250,0.22)',
                              borderRadius: 'var(--df-radius-full)',
                              padding: '1px 7px',
                              fontSize: 10,
                              fontWeight: 500,
                            }}
                          >
                            {l.badge}
                          </span>
                        )}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            )
          })}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 24,
            borderTop: '1px solid var(--df-border-subtle)',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12 }}>
            <span
              aria-hidden="true"
              style={{
                width: 7, height: 7, borderRadius: '50%',
                background: 'var(--df-neon-green)',
                boxShadow: 'var(--df-glow-green)',
              }}
            />
            <span>All systems operational</span>
            <span style={{ color: 'var(--df-text-muted)', marginLeft: 6 }}>·</span>
            <span style={{ color: 'var(--df-text-muted)' }}>© 2026 Nexus Cloud, Inc.</span>
          </div>
          <ul style={{ display: 'flex', gap: 4, listStyle: 'none', margin: 0, padding: 0 }}>
            {SOCIAL_LINKS.map(s => (
              <li key={s.href}>
                <a
                  href={s.href}
                  aria-label={s.label}
                  style={{
                    width: 32, height: 32,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: 'var(--df-radius-md)',
                    color: 'var(--df-text-muted)',
                    fontSize: 14,
                    textDecoration: 'none',
                    transition: 'background-color 150ms var(--df-ease-out), color 150ms var(--df-ease-out)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'var(--df-bg-hover)'
                    e.currentTarget.style.color = 'var(--df-text-primary)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = 'var(--df-text-muted)'
                  }}
                >
                  <span aria-hidden="true">{s.icon}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  )
}
```

Mobile collapse: at `<768px`, the grid becomes single-column. Add a media query in your global CSS or wrap the grid container in a hook-driven layout.

---

## Pattern 2 — Minimal (logo + copyright)

Single-line footer for app shells, docs sites, and auth pages — anywhere the page itself is the product and the footer should disappear.

```tsx
import { SOCIAL_LINKS } from './footer.config'

export function MinimalFooter() {
  return (
    <footer
      role="contentinfo"
      style={{
        background: 'var(--df-bg-base)',
        borderTop: '1px solid var(--df-border-subtle)',
        padding: '20px 24px',
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <a
          href="/"
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            color: 'var(--df-text-primary)', textDecoration: 'none',
          }}
        >
          <span
            style={{
              width: 22, height: 22, borderRadius: 'var(--df-radius-sm)',
              background: 'var(--df-neon-violet)',
              display: 'grid', placeItems: 'center',
              fontWeight: 700, color: 'var(--df-text-inverse)', fontSize: 11,
            }}
            aria-hidden="true"
          >
            N
          </span>
          <span style={{ fontWeight: 500, fontSize: 13 }}>Nexus</span>
        </a>

        <span style={{ color: 'var(--df-text-muted)', fontSize: 12 }}>
          © 2026 Nexus Cloud
        </span>

        <nav aria-label="Footer" style={{ marginLeft: 'auto', display: 'flex', gap: 20 }}>
          {[
            { label: 'Privacy', href: '/privacy' },
            { label: 'Terms',   href: '/terms' },
            { label: 'Status',  href: 'https://status.nexus.cloud' },
          ].map(l => (
            <a
              key={l.href}
              href={l.href}
              style={{
                color: 'var(--df-text-muted)',
                fontSize: 12,
                textDecoration: 'none',
              }}
            >
              {l.label}
            </a>
          ))}
        </nav>

        <ul style={{ display: 'flex', gap: 4, listStyle: 'none', margin: 0, padding: 0 }}>
          {SOCIAL_LINKS.slice(0, 3).map(s => (
            <li key={s.href}>
              <a
                href={s.href}
                aria-label={s.label}
                style={{
                  width: 28, height: 28,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--df-text-muted)',
                  textDecoration: 'none',
                  fontSize: 13,
                }}
              >
                <span aria-hidden="true">{s.icon}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  )
}
```

---

## Pattern 3 — Big Animated Footer (with neon glow)

Marketing-page footer with oversized brand mark using DF shimmer gradient, on-scroll entrance, and animated DF glow border on link-group hover.

```tsx
'use client'
import { motion, useInView, useReducedMotion } from 'framer-motion'
import { useRef } from 'react'
import { FOOTER_COLUMNS, SOCIAL_LINKS } from './footer.config'

export function BigAnimatedFooter() {
  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref, { once: true, margin: '-15%' })
  const reduce = useReducedMotion()

  return (
    <footer
      ref={ref}
      role="contentinfo"
      style={{
        position: 'relative',
        background: 'var(--df-bg-base)',
        borderTop: '1px solid var(--df-border-subtle)',
        overflow: 'hidden',
      }}
    >
      {/* Ambient neon glow blobs */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute', top: '-20%', left: '20%',
          width: 520, height: 520, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(167,139,250,0.18) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: 'absolute', bottom: '-10%', right: '10%',
          width: 420, height: 420, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(34,211,238,0.10) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ position: 'relative', maxWidth: 1280, margin: '0 auto', padding: '96px 24px 32px' }}>
        {/* Oversized shimmer brand mark */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: reduce ? 0 : 0.9, ease: [0.16, 1, 0.3, 1] }}
          style={{ marginBottom: 64 }}
        >
          <h2
            className="nx-text-shimmer"
            style={{
              fontFamily: 'var(--df-font-display)',
              fontSize: 'clamp(64px, 14vw, 180px)',
              fontWeight: 700,
              lineHeight: 0.95,
              letterSpacing: '-0.04em',
              margin: 0,
              background: 'linear-gradient(90deg, var(--df-neon-violet), var(--df-neon-cyan), var(--df-neon-pink), var(--df-neon-violet))',
              backgroundSize: '300% auto',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            Nexus Cloud
          </h2>
        </motion.div>

        {/* Link grid with hover glow */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 24,
            marginBottom: 56,
          }}
        >
          {FOOTER_COLUMNS.map((col, i) => {
            const id = `big-footer-${col.heading.toLowerCase()}`
            return (
              <motion.nav
                key={col.heading}
                aria-labelledby={id}
                initial={{ opacity: 0, y: 16 }}
                animate={inView ? { opacity: 1, y: 0 } : undefined}
                transition={{ duration: reduce ? 0 : 0.6, delay: reduce ? 0 : 0.15 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  background: 'var(--df-glass-bg)',
                  border: '1px solid var(--df-glass-border)',
                  borderRadius: 'var(--df-radius-lg)',
                  padding: '20px 22px',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  transition: 'border-color 250ms var(--df-ease-out), box-shadow 250ms var(--df-ease-out)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'rgba(167,139,250,0.35)'
                  e.currentTarget.style.boxShadow = 'var(--df-glow-violet)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--df-glass-border)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <h4
                  id={id}
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--df-text-primary)',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    margin: '0 0 14px',
                  }}
                >
                  {col.heading}
                </h4>
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {col.links.map(l => (
                    <li key={l.href}>
                      <a
                        href={l.href}
                        style={{
                          color: 'var(--df-text-secondary)',
                          fontSize: 13,
                          textDecoration: 'none',
                        }}
                      >
                        {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </motion.nav>
            )
          })}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 24,
            borderTop: '1px solid var(--df-border-subtle)',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <span style={{ color: 'var(--df-text-muted)', fontSize: 12 }}>
            © 2026 Nexus Cloud, Inc. · Made in San Francisco + Bengaluru
          </span>
          <ul style={{ display: 'flex', gap: 4, listStyle: 'none', margin: 0, padding: 0 }}>
            {SOCIAL_LINKS.map(s => (
              <li key={s.href}>
                <a
                  href={s.href}
                  aria-label={s.label}
                  style={{
                    width: 32, height: 32,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: 'var(--df-radius-md)',
                    color: 'var(--df-text-muted)',
                    textDecoration: 'none',
                    fontSize: 13,
                  }}
                >
                  <span aria-hidden="true">{s.icon}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  )
}
```

---

## Pattern 4 — Newsletter-First

Centered hero-style "Stay in the loop" with form state machine (`idle | submitting | success | error`), `role="status" aria-live="polite"`, supporting links below in a flat 4-column grid.

```tsx
'use client'
import { motion, useReducedMotion } from 'framer-motion'
import { useState } from 'react'
import { FOOTER_COLUMNS } from './footer.config'

type FormState = 'idle' | 'submitting' | 'success' | 'error'

export function NewsletterFirstFooter() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<FormState>('idle')
  const [error, setError] = useState<string | null>(null)
  const reduce = useReducedMotion()

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setState('submitting')
    setError(null)
    try {
      // VERIFY: replace with your real subscribe endpoint
      await new Promise<void>((resolve) => setTimeout(resolve, 800))
      setState('success')
      setEmail('')
    } catch (err) {
      setState('error')
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.')
    }
  }

  return (
    <footer
      role="contentinfo"
      style={{
        background: 'var(--df-bg-base)',
        borderTop: '1px solid var(--df-border-subtle)',
        padding: '96px 24px 48px',
      }}
    >
      {/* Newsletter centerpiece */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-15%' }}
        transition={{ duration: reduce ? 0 : 0.7, ease: [0.16, 1, 0.3, 1] }}
        style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center', marginBottom: 80 }}
        aria-labelledby="newsletter-heading"
      >
        <h2
          id="newsletter-heading"
          style={{
            fontFamily: 'var(--df-font-display)',
            fontSize: 'clamp(28px, 4vw, 44px)',
            fontWeight: 600,
            color: 'var(--df-text-primary)',
            margin: '0 0 14px',
            letterSpacing: '-0.02em',
          }}
        >
          Stay in the loop
        </h2>
        <p style={{ color: 'var(--df-text-secondary)', fontSize: 16, lineHeight: 1.6, margin: '0 0 28px' }}>
          One email per week. New features, deep-dive guides, and the occasional
          dark-UI inspiration. No noise.
        </p>
        <form onSubmit={onSubmit} style={{ display: 'flex', gap: 8, maxWidth: 440, margin: '0 auto', flexWrap: 'wrap' }}>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@company.com"
            required
            disabled={state === 'submitting' || state === 'success'}
            aria-label="Email address"
            style={{
              flex: '1 1 220px',
              minWidth: 0,
              background: 'var(--df-bg-elevated)',
              border: '1px solid var(--df-border-default)',
              borderRadius: 'var(--df-radius-md)',
              padding: '12px 14px',
              color: 'var(--df-text-primary)',
              fontSize: 14,
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={state === 'submitting' || state === 'success'}
            style={{
              background: 'var(--df-neon-violet)',
              color: 'var(--df-text-inverse)',
              border: 'none',
              borderRadius: 'var(--df-radius-md)',
              padding: '12px 22px',
              fontSize: 14,
              fontWeight: 600,
              cursor: state === 'idle' ? 'pointer' : 'not-allowed',
              opacity: state === 'submitting' || state === 'success' ? 0.6 : 1,
              boxShadow: 'var(--df-glow-violet)',
            }}
          >
            {state === 'submitting' ? 'Submitting…' : state === 'success' ? 'Subscribed ✓' : 'Subscribe'}
          </button>
        </form>
        <div role="status" aria-live="polite" style={{ minHeight: 20, marginTop: 12, fontSize: 13 }}>
          {state === 'success' && (
            <span style={{ color: 'var(--df-neon-green)' }}>
              Check your inbox — confirmation sent.
            </span>
          )}
          {state === 'error' && (
            <span style={{ color: 'var(--df-neon-red)' }}>{error}</span>
          )}
        </div>
      </motion.section>

      {/* Flat link grid */}
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 32,
          paddingBottom: 32,
          borderBottom: '1px solid var(--df-border-subtle)',
        }}
      >
        {FOOTER_COLUMNS.map(col => {
          const id = `nl-footer-${col.heading.toLowerCase()}`
          return (
            <nav key={col.heading} aria-labelledby={id}>
              <h4
                id={id}
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--df-text-muted)',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  margin: '0 0 12px',
                }}
              >
                {col.heading}
              </h4>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {col.links.map(l => (
                  <li key={l.href}>
                    <a
                      href={l.href}
                      style={{
                        color: 'var(--df-text-secondary)',
                        fontSize: 12,
                        textDecoration: 'none',
                      }}
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          )
        })}
      </div>

      <div style={{ maxWidth: 1200, margin: '24px auto 0', textAlign: 'center', color: 'var(--df-text-muted)', fontSize: 12 }}>
        © 2026 Nexus Cloud, Inc. All rights reserved.
      </div>
    </footer>
  )
}
```

---

## Pattern 5 — Status Footer (SaaS / dev tools)

For developer-facing products: live status indicator, version chip, "Last updated X minutes ago" relative-time hook (SSR-safe).

```tsx
'use client'
import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

type SystemStatus = 'operational' | 'degraded' | 'partial' | 'outage'

const STATUS_CONFIG: Record<SystemStatus, { label: string; color: string; glow: string }> = {
  operational: { label: 'All systems operational',      color: 'var(--df-neon-green)',  glow: 'var(--df-glow-green)' },
  degraded:    { label: 'Degraded performance',         color: 'var(--df-neon-amber)',  glow: '0 0 12px rgba(251,191,36,0.45)' },
  partial:     { label: 'Partial outage',               color: 'var(--df-neon-amber)',  glow: '0 0 12px rgba(251,191,36,0.45)' },
  outage:      { label: 'Major outage',                 color: 'var(--df-neon-red)',    glow: '0 0 12px rgba(248,113,113,0.45)' },
}

/** SSR-safe relative time. Renders empty on server; hydrates client-side. */
function useRelativeTime(updatedAt: Date | null) {
  const [label, setLabel] = useState('')
  useEffect(() => {
    if (!updatedAt) return
    function tick() {
      const diff = Math.max(0, Date.now() - updatedAt!.getTime())
      const mins = Math.floor(diff / 60000)
      if (mins < 1)         setLabel('just now')
      else if (mins < 60)   setLabel(`${mins}m ago`)
      else if (mins < 1440) setLabel(`${Math.floor(mins / 60)}h ago`)
      else                  setLabel(`${Math.floor(mins / 1440)}d ago`)
    }
    tick()
    const id = setInterval(tick, 60000)
    return () => clearInterval(id)
  }, [updatedAt])
  return label
}

interface StatusFooterProps {
  status?: SystemStatus
  version?: string
  buildSha?: string
  lastUpdated?: Date
}

export function StatusFooter({
  status = 'operational',
  version = 'v1.0.0',
  buildSha = '6778893',
  lastUpdated = new Date(Date.now() - 14 * 60_000),
}: StatusFooterProps) {
  const reduce = useReducedMotion()
  const cfg = STATUS_CONFIG[status]
  const relative = useRelativeTime(lastUpdated)

  return (
    <footer
      role="contentinfo"
      style={{
        background: 'var(--df-bg-surface)',
        borderTop: '1px solid var(--df-border-subtle)',
        padding: '20px 24px',
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          flexWrap: 'wrap',
        }}
      >
        <a
          href="https://status.nexus.cloud"
          aria-label={`System status: ${cfg.label}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            color: 'var(--df-text-secondary)',
            textDecoration: 'none',
            fontSize: 13,
          }}
        >
          <motion.span
            aria-hidden="true"
            animate={reduce ? undefined : { opacity: [0.5, 1, 0.5] }}
            transition={reduce ? undefined : { duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              width: 8, height: 8,
              borderRadius: '50%',
              background: cfg.color,
              boxShadow: cfg.glow,
            }}
          />
          {cfg.label}
        </a>

        <span style={{ color: 'var(--df-text-muted)', fontSize: 12 }}>·</span>

        <span
          style={{
            fontFamily: 'var(--df-font-mono)',
            fontSize: 11,
            color: 'var(--df-text-muted)',
            background: 'var(--df-bg-elevated)',
            border: '1px solid var(--df-border-subtle)',
            borderRadius: 'var(--df-radius-sm)',
            padding: '2px 8px',
          }}
        >
          {version} · {buildSha}
        </span>

        {relative && (
          <span style={{ color: 'var(--df-text-muted)', fontSize: 12 }}>
            Last deployed {relative}
          </span>
        )}

        <nav aria-label="Footer" style={{ marginLeft: 'auto', display: 'flex', gap: 18 }}>
          {[
            { label: 'Docs',     href: '/docs' },
            { label: 'Status',   href: 'https://status.nexus.cloud' },
            { label: 'Changelog', href: '/changelog' },
            { label: 'Privacy',  href: '/privacy' },
          ].map(l => (
            <a
              key={l.href}
              href={l.href}
              style={{ color: 'var(--df-text-muted)', fontSize: 12, textDecoration: 'none' }}
            >
              {l.label}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  )
}
```

---

## Picking a pattern

| Use this pattern when… | …pick |
|---|---|
| Standard marketing / product site | **1. Multi-Column Standard** |
| Auth pages, docs, app shells | **2. Minimal** |
| Landing page hero finale, brand-forward | **3. Big Animated** |
| Newsletter is the conversion event | **4. Newsletter-First** |
| Dev tools, SaaS dashboards, API products | **5. Status Footer** |

---

## Cross-References

- `references/01-framer-motion.md` — entrance animations in Patterns 3 + 4, status pulse in Pattern 5
- `references/05-magicui.md` — animated brand mark via `nx-text-shimmer` utility (Pattern 3)
- `references/patterns/cta.md` — the inline newsletter form pattern Pattern 4 builds on
- `references/patterns/hero.md` — Pattern 3 reads as a "footer hero"
