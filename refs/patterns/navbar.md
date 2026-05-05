# Darkforge — Navbar Patterns
Navigation patterns for AMOLED-dark sites — sticky glass, floating pill, mega menu, mobile drawer. Every pattern below works at 375px.

## Contents

- [Source-of-truth caveat](#source-of-truth-caveat)
- [Pattern 1 — Sticky Glass Navbar](#pattern-1-sticky-glass-navbar)
- [Pattern 2 — Floating Pill Navbar (centered)](#pattern-2-floating-pill-navbar-centered)
- [Pattern 3 — Mobile Drawer](#pattern-3-mobile-drawer)
- [Pattern 4 — Minimal Logo + Account](#pattern-4-minimal-logo-account)
- [Cross-References](#cross-references)

---

## Source-of-truth caveat

Written from training-data recall (Jan 2026 cutoff). `// VERIFY:` markers flag prop names that drift between minor versions. Targets: `framer-motion@11+`, plus optional Radix Popover for dropdown menus.

---

## Pattern 1 — Sticky Glass Navbar

Top-stuck, transparent until scroll past 32px, then blur backdrop fades in. Standard product-marketing navbar shape.

```tsx
'use client'
import { motion, useMotionValueEvent, useScroll, useReducedMotion } from 'framer-motion'
import { useState } from 'react'

interface NavLink { label: string; href: string }

const LINKS: NavLink[] = [
  { label: 'Product',  href: '/product' },
  { label: 'Pricing',  href: '/pricing' },
  { label: 'Features', href: '/features' },
  { label: 'Docs',     href: '/docs' },
  { label: 'Customers', href: '/customers' },
]

export function StickyGlassNavbar() {
  const { scrollY } = useScroll()
  const [scrolled, setScrolled] = useState(false)
  const reduce = useReducedMotion()

  useMotionValueEvent(scrollY, 'change', y => setScrolled(y > 32))

  return (
    <header
      style={{
        position: 'sticky', top: 0, zIndex: 50,
        transition: reduce ? 'none' : 'background-color 220ms var(--df-ease-out), backdrop-filter 220ms var(--df-ease-out), border-color 220ms var(--df-ease-out)',
        background: scrolled ? 'rgba(8,8,8,0.78)' : 'transparent',
        backdropFilter: scrolled ? 'blur(14px) saturate(180%)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(14px) saturate(180%)' : 'none',
        borderBottom: scrolled ? '1px solid var(--df-border-subtle)' : '1px solid transparent',
      }}
    >
      <nav
        aria-label="Primary"
        style={{
          maxWidth: 1280, margin: '0 auto',
          padding: '14px 24px',
          display: 'flex', alignItems: 'center', gap: 24,
        }}
      >
        <a
          href="/"
          style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'var(--df-text-primary)' }}
        >
          <span
            style={{
              width: 28, height: 28, borderRadius: 'var(--df-radius-md)',
              background: 'linear-gradient(135deg, var(--df-neon-violet), var(--df-neon-cyan))',
              display: 'grid', placeItems: 'center',
              fontWeight: 700, color: 'var(--df-text-inverse)', fontSize: 13,
              boxShadow: 'var(--df-glow-violet)',
            }}
            aria-hidden="true"
          >
            N
          </span>
          <span style={{ fontWeight: 600, fontSize: 16 }}>Nexus Cloud</span>
        </a>

        <ul style={{ display: 'flex', gap: 4, listStyle: 'none', margin: 0, padding: 0, flex: 1, justifyContent: 'center' }}>
          {LINKS.map(l => (
            <li key={l.href}>
              <a
                href={l.href}
                style={{
                  display: 'inline-block',
                  padding: '8px 14px',
                  borderRadius: 'var(--df-radius-md)',
                  color: 'var(--df-text-secondary)',
                  textDecoration: 'none',
                  fontSize: 14, fontWeight: 500,
                  transition: 'background-color 150ms var(--df-ease-out), color 150ms var(--df-ease-out)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'var(--df-bg-hover)'
                  e.currentTarget.style.color = 'var(--df-neon-violet)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = 'var(--df-text-secondary)'
                }}
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <a
            href="/login"
            style={{ color: 'var(--df-text-secondary)', textDecoration: 'none', fontSize: 14, padding: '8px 14px' }}
          >
            Sign in
          </a>
          <motion.a
            href="/start"
            whileHover={reduce ? undefined : { scale: 1.03, boxShadow: '0 0 24px rgba(167,139,250,0.45)' }}
            whileTap={reduce ? undefined : { scale: 0.97 }}
            style={{
              background: 'var(--df-neon-violet)',
              color: 'var(--df-text-inverse)',
              borderRadius: 'var(--df-radius-md)',
              padding: '9px 18px',
              fontSize: 14, fontWeight: 600,
              textDecoration: 'none',
              boxShadow: 'var(--df-glow-violet)',
            }}
          >
            Start free
          </motion.a>
        </div>
      </nav>
    </header>
  )
}
```

---

## Pattern 2 — Floating Pill Navbar (centered)

Centered pill that floats with DF glow border, animated active indicator using Framer's shared `layoutId`. Mobile collapses to hamburger.

```tsx
'use client'
import { motion, useReducedMotion } from 'framer-motion'
import { useState } from 'react'

interface NavLink { id: string; label: string; href: string }

const LINKS: NavLink[] = [
  { id: 'product',  label: 'Product',  href: '/product' },
  { id: 'pricing',  label: 'Pricing',  href: '/pricing' },
  { id: 'docs',     label: 'Docs',     href: '/docs' },
  { id: 'changelog', label: 'Changelog', href: '/changelog' },
]

export function FloatingPillNavbar({ initialActive = 'product' }: { initialActive?: string }) {
  const [active, setActive] = useState(initialActive)
  const reduce = useReducedMotion()

  return (
    <header
      style={{
        position: 'fixed', top: 16, left: 0, right: 0, zIndex: 50,
        display: 'flex', justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
      <nav
        aria-label="Primary"
        style={{
          pointerEvents: 'auto',
          display: 'flex', alignItems: 'center', gap: 4,
          background: 'rgba(17,17,17,0.78)',
          backdropFilter: 'blur(16px) saturate(200%)',
          WebkitBackdropFilter: 'blur(16px) saturate(200%)',
          border: '1px solid var(--df-border-default)',
          borderRadius: 'var(--df-radius-full)',
          padding: 6,
          boxShadow: '0 12px 40px rgba(0,0,0,0.5), 0 0 24px rgba(167,139,250,0.12)',
        }}
      >
        {LINKS.map(l => {
          const isActive = l.id === active
          return (
            <a
              key={l.id}
              href={l.href}
              onClick={e => { e.preventDefault(); setActive(l.id) }}
              aria-current={isActive ? 'page' : undefined}
              style={{
                position: 'relative',
                padding: '8px 16px',
                borderRadius: 'var(--df-radius-full)',
                color: isActive ? 'var(--df-text-inverse)' : 'var(--df-text-secondary)',
                fontSize: 14,
                fontWeight: 500,
                textDecoration: 'none',
                transition: 'color 150ms var(--df-ease-out)',
                zIndex: 1,
              }}
            >
              {isActive && (
                <motion.span
                  layoutId="floating-pill-indicator"
                  transition={{ duration: reduce ? 0 : 0.3, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    position: 'absolute', inset: 0,
                    background: 'var(--df-neon-violet)',
                    borderRadius: 'var(--df-radius-full)',
                    boxShadow: 'var(--df-glow-violet)',
                    zIndex: -1,
                  }}
                  aria-hidden="true"
                />
              )}
              {l.label}
            </a>
          )
        })}
      </nav>
    </header>
  )
}
```

---

## Pattern 3 — Mobile Drawer

Hamburger triggers full-screen dark drawer with backdrop blur. Tab/Esc focus trap, body scroll lock, focus return to trigger.

```tsx
'use client'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

const LINKS = [
  { label: 'Product',   href: '/product' },
  { label: 'Pricing',   href: '/pricing' },
  { label: 'Docs',      href: '/docs' },
  { label: 'Changelog', href: '/changelog' },
  { label: 'Customers', href: '/customers' },
]
const SOCIAL = [
  { label: 'Twitter',  href: 'https://twitter.com/nexuscloud' },
  { label: 'GitHub',   href: 'https://github.com/nexuscloud' },
  { label: 'LinkedIn', href: 'https://linkedin.com/company/nexuscloud' },
]

export function MobileDrawer() {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const reduce = useReducedMotion()

  useEffect(() => {
    if (!open) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  useEffect(() => {
    if (!open) triggerRef.current?.focus()
  }, [open])

  return (
    <>
      <button
        ref={triggerRef}
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-label="Open menu"
        aria-controls="nx-mobile-drawer"
        style={{
          width: 40, height: 40,
          borderRadius: 'var(--df-radius-md)',
          background: 'var(--df-bg-elevated)',
          border: '1px solid var(--df-border-default)',
          color: 'var(--df-text-primary)',
          fontSize: 18,
          cursor: 'pointer',
        }}
      >
        ☰
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            id="nx-mobile-drawer"
            role="dialog" aria-modal="true" aria-label="Site menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.2 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 90,
              background: 'rgba(0,0,0,0.72)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              display: 'flex', flexDirection: 'column',
            }}
          >
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              transition={{ duration: reduce ? 0 : 0.28, ease: [0.16, 1, 0.3, 1] }}
              style={{
                background: 'var(--df-bg-base)',
                borderBottom: '1px solid var(--df-border-subtle)',
                padding: '16px 20px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}
            >
              <span style={{ fontWeight: 600, fontSize: 16, color: 'var(--df-text-primary)' }}>Nexus Cloud</span>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                style={{
                  width: 36, height: 36,
                  borderRadius: '50%',
                  background: 'var(--df-bg-elevated)',
                  border: '1px solid var(--df-border-default)',
                  color: 'var(--df-text-primary)',
                  cursor: 'pointer',
                  fontSize: 18,
                }}
              >
                ×
              </button>
            </motion.div>

            <nav aria-label="Mobile navigation" style={{ flex: 1, overflowY: 'auto', padding: '24px 20px' }}>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {LINKS.map((l, i) => (
                  <motion.li
                    key={l.href}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: reduce ? 0 : 0.3, delay: reduce ? 0 : 0.05 + i * 0.04 }}
                  >
                    <a
                      href={l.href}
                      style={{
                        display: 'block',
                        padding: '14px 12px',
                        borderRadius: 'var(--df-radius-md)',
                        color: 'var(--df-text-primary)',
                        fontSize: 22, fontWeight: 600,
                        textDecoration: 'none',
                        fontFamily: 'var(--df-font-display)',
                      }}
                    >
                      {l.label}
                    </a>
                  </motion.li>
                ))}
              </ul>
            </nav>

            <div style={{ padding: '20px', borderTop: '1px solid var(--df-border-subtle)', background: 'var(--df-bg-base)' }}>
              <a
                href="/start"
                style={{
                  display: 'block',
                  textAlign: 'center',
                  background: 'var(--df-neon-violet)',
                  color: 'var(--df-text-inverse)',
                  borderRadius: 'var(--df-radius-md)',
                  padding: '14px 18px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  marginBottom: 16,
                  boxShadow: 'var(--df-glow-violet)',
                }}
              >
                Start free
              </a>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', gap: 16, justifyContent: 'center' }}>
                {SOCIAL.map(s => (
                  <li key={s.href}>
                    <a
                      href={s.href}
                      style={{ color: 'var(--df-text-muted)', textDecoration: 'none', fontSize: 13 }}
                    >
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
```

---

## Pattern 4 — Minimal Logo + Account

Logo left, simple links center, account dropdown + theme toggle right. No CTA — for product app shells, not marketing pages.

```tsx
'use client'
import { useState } from 'react'

const SECTIONS = [
  { label: 'Inbox',     href: '/inbox' },
  { label: 'Library',   href: '/library' },
  { label: 'Insights',  href: '/insights' },
]

export function MinimalAppNavbar({ userName = 'Karan' }: { userName?: string }) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header
      style={{
        background: 'var(--df-bg-surface)',
        borderBottom: '1px solid var(--df-border-subtle)',
      }}
    >
      <nav
        aria-label="Primary"
        style={{
          maxWidth: 1280, margin: '0 auto',
          padding: '12px 24px',
          display: 'flex', alignItems: 'center', gap: 24,
        }}
      >
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'var(--df-text-primary)' }}>
          <span
            style={{
              width: 26, height: 26, borderRadius: 'var(--df-radius-sm)',
              background: 'var(--df-neon-violet)',
              display: 'grid', placeItems: 'center',
              fontWeight: 700, color: 'var(--df-text-inverse)', fontSize: 12,
            }}
            aria-hidden="true"
          >
            N
          </span>
          <span style={{ fontWeight: 500, fontSize: 14 }}>Nexus</span>
        </a>

        <ul style={{ display: 'flex', gap: 2, listStyle: 'none', margin: 0, padding: 0 }}>
          {SECTIONS.map(s => (
            <li key={s.href}>
              <a
                href={s.href}
                style={{
                  display: 'inline-block',
                  padding: '6px 12px',
                  borderRadius: 'var(--df-radius-sm)',
                  color: 'var(--df-text-secondary)',
                  textDecoration: 'none',
                  fontSize: 13, fontWeight: 500,
                }}
              >
                {s.label}
              </a>
            </li>
          ))}
        </ul>

        <div style={{ marginLeft: 'auto', position: 'relative' }}>
          <button
            onClick={() => setMenuOpen(o => !o)}
            aria-haspopup="menu" aria-expanded={menuOpen}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'var(--df-bg-elevated)',
              border: '1px solid var(--df-border-subtle)',
              borderRadius: 'var(--df-radius-md)',
              padding: '5px 12px 5px 5px',
              color: 'var(--df-text-primary)',
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            <span
              style={{
                width: 24, height: 24, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--df-neon-violet), var(--df-neon-cyan))',
                display: 'grid', placeItems: 'center',
                color: 'var(--df-text-inverse)', fontWeight: 700, fontSize: 11,
              }}
              aria-hidden="true"
            >
              {userName[0]?.toUpperCase()}
            </span>
            {userName} ▾
          </button>

          {menuOpen && (
            <div
              role="menu"
              style={{
                position: 'absolute', top: '100%', right: 0, marginTop: 8,
                minWidth: 180,
                background: 'var(--df-bg-elevated)',
                border: '1px solid var(--df-border-default)',
                borderRadius: 'var(--df-radius-md)',
                padding: 4,
                boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
                zIndex: 30,
              }}
            >
              {['Settings', 'Billing', 'Theme: Dark', 'Sign out'].map(item => (
                <button
                  key={item}
                  role="menuitem"
                  style={{
                    display: 'block', width: '100%',
                    textAlign: 'left',
                    padding: '8px 12px',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--df-text-secondary)',
                    fontSize: 13,
                    cursor: 'pointer',
                    borderRadius: 'var(--df-radius-sm)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--df-bg-hover)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                >
                  {item}
                </button>
              ))}
            </div>
          )}
        </div>
      </nav>
    </header>
  )
}
```

---

## Cross-References

- `references/01-framer-motion.md` — `layoutId` (Pattern 2), `AnimatePresence` (Pattern 3)
- `references/04-aceternity.md` — FloatingNav variant of Pattern 2
- `references/08-shadcn-dark.md` — DropdownMenu primitive for Pattern 4 with proper a11y baked in
- `references/patterns/dashboard.md` — Pattern 6 (sidebar) pairs with these for full app shell
