# Darkforge — Dashboard Patterns
> **Source caveat.** This file was authored without live documentation access. APIs from `framer-motion`, `@tanstack/react-table`, and the keyboard model for the command palette reflect the author's best knowledge as of early 2025 and are flagged with `// VERIFY:` where the surface area is most likely to drift. Confirm against current docs before shipping.

8 production-grade dark dashboard patterns + a layout composition. Built around a single fictional product — **Nexus Cloud**, an AI agent deployment platform — so the patterns assemble into a coherent product surface, not eight orphan demos. Every pattern is AMOLED-first, mobile-aware, and announces itself correctly to a screen reader. Voice and token discipline match `00-dark-tokens.md` and the peer pattern `hero.md`.

## Contents

- [Pattern 1 — Three-Pane Shell](#pattern-1-three-pane-shell)
- [Pattern 2 — Stats Grid with Animated Counters](#pattern-2-stats-grid-with-animated-counters)
- [Pattern 3 — Dark Data Table](#pattern-3-dark-data-table)
- [Pattern 4 — Agent Chat Interface](#pattern-4-agent-chat-interface)
- [Pattern 5 — Activity Feed Timeline](#pattern-5-activity-feed-timeline)
- [Pattern 6 — Command Palette (⌘K)](#pattern-6-command-palette-k)
- [Pattern 7 — Sidebar with Icon Nav](#pattern-7-sidebar-with-icon-nav)
- [Pattern 8 — Top Bar with Breadcrumbs + Search + Notifications](#pattern-8-top-bar-with-breadcrumbs-search-notifications)
- [Layout Composition — `<DashboardPage>`](#layout-composition-dashboardpage)
  - [Page-shell skeleton state](#page-shell-skeleton-state)
- [Cross-References](#cross-references)

---

## Pattern 1 — Three-Pane Shell

A 240px sidebar, a fluid main column, and an optional 320px detail rail. Mobile collapses both rails behind a hamburger. Framer Motion handles the rail transitions; CSS Grid handles the steady state. This is the **chassis** every other pattern slots into.

```tsx
// Requires: framer-motion, tailwindcss
'use client'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useEffect, useState, type ReactNode } from 'react'

interface ThreePaneShellProps {
  sidebar: ReactNode
  topbar?: ReactNode
  detail?: ReactNode
  children: ReactNode
}

export function ThreePaneShell({ sidebar, topbar, detail, children }: ThreePaneShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(true)
  const reduceMotion = useReducedMotion()

  // Lock body scroll when mobile nav is open
  useEffect(() => {
    if (typeof document === 'undefined') return
    document.body.style.overflow = mobileNavOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileNavOpen])

  // Close mobile nav on resize to desktop
  useEffect(() => {
    if (typeof window === 'undefined') return
    const onResize = () => { if (window.innerWidth >= 1024) setMobileNavOpen(false) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const railTransition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.25, ease: [0.16, 1, 0.3, 1] as const }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--df-bg-base)',
        color: 'var(--df-text-primary)',
        fontFamily: 'var(--df-font-sans)',
        display: 'grid',
        gridTemplateColumns: detail && detailOpen ? '240px 1fr 320px' : '240px 1fr',
        gridTemplateRows: 'auto 1fr',
        gridTemplateAreas: detail && detailOpen
          ? `"sidebar topbar topbar" "sidebar main detail"`
          : `"sidebar topbar" "sidebar main"`,
      }}
      className="nx-shell"
    >
      {/* Mobile hamburger trigger — only visible below 1024px */}
      <button
        type="button"
        onClick={() => setMobileNavOpen(true)}
        aria-label="Open navigation"
        aria-expanded={mobileNavOpen}
        aria-controls="nx-sidebar"
        className="nx-mobile-trigger"
        style={{
          display: 'none',
          position: 'fixed', top: 16, left: 16, zIndex: 200,
          width: 40, height: 40,
          background: 'var(--df-bg-elevated)',
          border: '1px solid var(--df-border-default)',
          borderRadius: 'var(--df-radius-md)',
          color: 'var(--df-text-primary)',
          cursor: 'pointer',
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Sidebar — desktop static, mobile drawer */}
      <aside
        id="nx-sidebar"
        style={{
          gridArea: 'sidebar',
          background: 'var(--df-bg-surface)',
          borderRight: '1px solid var(--df-border-subtle)',
          height: '100vh',
          position: 'sticky',
          top: 0,
          overflowY: 'auto',
        }}
        className="nx-sidebar-desktop"
        aria-label="Primary"
      >
        {sidebar}
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileNavOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={railTransition}
              onClick={() => setMobileNavOpen(false)}
              style={{
                position: 'fixed', inset: 0,
                background: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(6px)',
                zIndex: 300,
              }}
              aria-hidden="true"
            />
            <motion.aside
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={railTransition}
              role="dialog"
              aria-modal="true"
              aria-label="Navigation"
              style={{
                position: 'fixed', top: 0, left: 0, bottom: 0,
                width: 240,
                background: 'var(--df-bg-surface)',
                borderRight: '1px solid var(--df-border-default)',
                zIndex: 301,
                overflowY: 'auto',
              }}
            >
              {sidebar}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Top bar */}
      {topbar && (
        <div
          style={{
            gridArea: 'topbar',
            position: 'sticky',
            top: 0,
            zIndex: 100,
          }}
        >
          {topbar}
        </div>
      )}

      {/* Main */}
      <main
        style={{
          gridArea: 'main',
          padding: 'var(--df-space-6)',
          minWidth: 0, // critical for grid overflow handling
        }}
        aria-label="Main content"
      >
        {children}
      </main>

      {/* Detail rail */}
      <AnimatePresence>
        {detail && detailOpen && (
          <motion.aside
            initial={{ x: 320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 320, opacity: 0 }}
            transition={railTransition}
            style={{
              gridArea: 'detail',
              background: 'var(--df-bg-surface)',
              borderLeft: '1px solid var(--df-border-subtle)',
              padding: 'var(--df-space-5)',
              overflowY: 'auto',
              minHeight: '100vh',
            }}
            aria-label="Details"
          >
            <button
              type="button"
              onClick={() => setDetailOpen(false)}
              aria-label="Close detail panel"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--df-text-secondary)',
                cursor: 'pointer',
                padding: 4,
                marginBottom: 'var(--df-space-4)',
              }}
            >
              ×
            </button>
            {detail}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Responsive rules */}
      <style>{`
        @media (max-width: 1023px) {
          .nx-shell { grid-template-columns: 1fr !important; grid-template-areas: "topbar" "main" !important; }
          .nx-sidebar-desktop { display: none; }
          .nx-mobile-trigger { display: flex !important; align-items: center; justify-content: center; }
        }
        @media (min-width: 1024px) and (max-width: 1279px) {
          .nx-shell { grid-template-columns: 240px 1fr !important; grid-template-areas: "sidebar topbar" "sidebar main" !important; }
        }
      `}</style>
    </div>
  )
}
```

---

## Pattern 2 — Stats Grid with Animated Counters

Four KPI cards in a responsive grid (4 → 2 → 1). Numbers count up on mount via `requestAnimationFrame`, but the hook bails to the final value when the user prefers reduced motion. Trend deltas use neon green / red, never color-fill alone — the icon and sign carry the meaning for color-blind users.

```tsx
// Requires: framer-motion, tailwindcss
'use client'
import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

// ---------- Count-up hook ----------
function useCountUp(target: number, duration = 1200): number {
  const [value, setValue] = useState(0)
  const reduceMotion = useReducedMotion()
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (reduceMotion) {
      setValue(target)
      return
    }
    const start = performance.now()
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(target * eased))
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [target, duration, reduceMotion])

  return value
}

// ---------- Types ----------
type Trend = 'up' | 'down' | 'flat'
interface Stat {
  id: string
  label: string
  value: number
  format: (n: number) => string
  delta: number // percentage e.g. 12.4 for +12.4%
  trend: Trend
  caption: string
}

// ---------- Single card ----------
interface StatCardProps {
  stat: Stat
  index: number
}

function StatCard({ stat, index }: StatCardProps) {
  const live = useCountUp(stat.value)
  const reduceMotion = useReducedMotion()
  const trendColor =
    stat.trend === 'up' ? 'var(--df-neon-green)'
    : stat.trend === 'down' ? 'var(--df-neon-red)'
    : 'var(--df-text-muted)'

  return (
    <motion.article
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: reduceMotion ? 0 : index * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      style={{
        background: 'var(--df-bg-elevated)',
        border: '1px solid var(--df-border-subtle)',
        borderRadius: 'var(--df-radius-lg)',
        padding: 'var(--df-space-5)',
        position: 'relative',
        overflow: 'hidden',
      }}
      aria-labelledby={`stat-${stat.id}-label`}
      aria-describedby={`stat-${stat.id}-caption`}
    >
      {/* Subtle violet glow tucked top-right */}
      <div
        style={{
          position: 'absolute', top: -40, right: -40,
          width: 140, height: 140, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(167,139,250,0.10) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
        aria-hidden="true"
      />

      <p
        id={`stat-${stat.id}-label`}
        style={{
          color: 'var(--df-text-muted)',
          fontSize: 12,
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          margin: '0 0 var(--df-space-3)',
        }}
      >
        {stat.label}
      </p>

      <p
        style={{
          fontFamily: 'var(--df-font-display)',
          fontSize: 32,
          fontWeight: 600,
          lineHeight: 1.1,
          color: 'var(--df-neon-violet)',
          margin: '0 0 var(--df-space-2)',
          letterSpacing: '-0.02em',
        }}
      >
        {stat.format(live)}
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            color: trendColor,
            fontSize: 12,
            fontWeight: 600,
          }}
          aria-label={`${stat.trend === 'up' ? 'Up' : stat.trend === 'down' ? 'Down' : 'Unchanged'} ${Math.abs(stat.delta)} percent`}
        >
          {stat.trend === 'up' && (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M2 8L6 4L10 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          {stat.trend === 'down' && (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          {stat.trend === 'up' ? '+' : stat.trend === 'down' ? '−' : ''}
          {Math.abs(stat.delta).toFixed(1)}%
        </span>
        <span
          id={`stat-${stat.id}-caption`}
          style={{ color: 'var(--df-text-muted)', fontSize: 12 }}
        >
          {stat.caption}
        </span>
      </div>
    </motion.article>
  )
}

// ---------- Grid ----------
const NEXUS_CLOUD_STATS: Stat[] = [
  {
    id: 'agents',
    label: 'Active agents',
    value: 4827,
    format: (n) => n.toLocaleString('en-US'),
    delta: 12.4,
    trend: 'up',
    caption: 'vs. last week',
  },
  {
    id: 'requests',
    label: 'Requests / min',
    value: 18420,
    format: (n) => n.toLocaleString('en-US'),
    delta: 3.2,
    trend: 'up',
    caption: 'rolling 5 min',
  },
  {
    id: 'latency',
    label: 'P95 latency',
    value: 312,
    format: (n) => `${n} ms`,
    delta: 4.1,
    trend: 'down', // down latency = good — green still applies
    caption: 'vs. last hour',
  },
  {
    id: 'tokens',
    label: 'Tokens used',
    value: 9700000,
    format: (n) => `${(n / 1_000_000).toFixed(1)}M`,
    delta: 0.4,
    trend: 'flat',
    caption: 'this billing cycle',
  },
]

export function StatsGrid({ stats = NEXUS_CLOUD_STATS }: { stats?: Stat[] }) {
  return (
    <section aria-label="Key metrics">
      <h2
        style={{
          color: 'var(--df-text-primary)',
          fontSize: 16,
          fontWeight: 600,
          margin: '0 0 var(--df-space-4)',
        }}
      >
        Overview
      </h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 'var(--df-space-4)',
        }}
      >
        {stats.map((stat, i) => (
          <StatCard key={stat.id} stat={stat} index={i} />
        ))}
      </div>
    </section>
  )
}
```

---

## Pattern 3 — Dark Data Table

Built on `@tanstack/react-table` v8 (headless). Sortable columns, sticky header inside a scroll container (so it pins on long lists without leaking out of the card), pagination, per-row action menu. On narrow viewports the table becomes horizontally scrollable rather than collapsing — losing data in a CRUD table is worse than a swipe gesture.

```tsx
// Requires: @tanstack/react-table ^8, tailwindcss
// VERIFY: @tanstack/react-table v8 import paths and API surface
'use client'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { useState, useRef, useEffect, type CSSProperties } from 'react'

// ---------- Domain ----------
type DeploymentStatus = 'running' | 'degraded' | 'failed' | 'paused'

interface Deployment {
  id: string
  agent: string
  region: string
  status: DeploymentStatus
  requestsPerMin: number
  p95Ms: number
  lastDeploy: string // ISO
}

const SAMPLE: Deployment[] = [
  { id: 'dep_01HX', agent: 'support-router-v3', region: 'us-east-1', status: 'running', requestsPerMin: 4210, p95Ms: 287, lastDeploy: '2026-04-26T18:32:00Z' },
  { id: 'dep_02HX', agent: 'invoice-classifier', region: 'eu-west-2', status: 'running', requestsPerMin: 1840, p95Ms: 412, lastDeploy: '2026-04-26T11:04:00Z' },
  { id: 'dep_03HX', agent: 'lead-enricher', region: 'us-west-2', status: 'degraded', requestsPerMin: 612, p95Ms: 1840, lastDeploy: '2026-04-25T22:11:00Z' },
  { id: 'dep_04HX', agent: 'meeting-summarizer', region: 'ap-southeast-1', status: 'running', requestsPerMin: 2390, p95Ms: 198, lastDeploy: '2026-04-26T07:55:00Z' },
  { id: 'dep_05HX', agent: 'pricing-bot', region: 'us-east-1', status: 'failed', requestsPerMin: 0, p95Ms: 0, lastDeploy: '2026-04-26T19:01:00Z' },
  { id: 'dep_06HX', agent: 'changelog-writer', region: 'eu-central-1', status: 'paused', requestsPerMin: 0, p95Ms: 0, lastDeploy: '2026-04-24T13:20:00Z' },
  { id: 'dep_07HX', agent: 'voice-transcriber', region: 'us-east-1', status: 'running', requestsPerMin: 5610, p95Ms: 244, lastDeploy: '2026-04-26T15:48:00Z' },
  { id: 'dep_08HX', agent: 'churn-predictor', region: 'us-west-2', status: 'running', requestsPerMin: 380, p95Ms: 522, lastDeploy: '2026-04-22T09:00:00Z' },
]

// ---------- Status pill ----------
const STATUS_STYLE: Record<DeploymentStatus, { color: string; bg: string; label: string }> = {
  running:  { color: 'var(--df-neon-green)', bg: 'rgba(74,222,128,0.10)',  label: 'Running' },
  degraded: { color: 'var(--df-neon-amber)', bg: 'rgba(251,191,36,0.10)',  label: 'Degraded' },
  failed:   { color: 'var(--df-neon-red)',   bg: 'rgba(248,113,113,0.10)', label: 'Failed' },
  paused:   { color: 'var(--df-text-muted)', bg: 'rgba(255,255,255,0.04)', label: 'Paused' },
}

function StatusPill({ status }: { status: DeploymentStatus }) {
  const s = STATUS_STYLE[status]
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        background: s.bg, color: s.color,
        borderRadius: 'var(--df-radius-full)',
        padding: '3px 10px', fontSize: 11, fontWeight: 600,
        border: `1px solid ${s.color}33`,
      }}
    >
      <span
        style={{ width: 6, height: 6, borderRadius: '50%', background: s.color }}
        aria-hidden="true"
      />
      {s.label}
    </span>
  )
}

// ---------- Row action menu ----------
function RowActions({ deployment }: { deployment: Deployment }) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node) && !triggerRef.current?.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const ACTIONS: Array<{ label: string; dest: string; danger?: boolean }> = [
    { label: 'View logs', dest: 'logs' },
    { label: 'Restart',   dest: 'restart' },
    { label: 'Roll back', dest: 'rollback' },
    { label: 'Delete',    dest: 'delete', danger: true },
  ]

  return (
    <div style={{ position: 'relative' }}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Actions for ${deployment.agent}`}
        onClick={() => setOpen((o) => !o)}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--df-text-secondary)',
          cursor: 'pointer',
          padding: 4,
          borderRadius: 'var(--df-radius-sm)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="3" cy="8" r="1.4" fill="currentColor" />
          <circle cx="8" cy="8" r="1.4" fill="currentColor" />
          <circle cx="13" cy="8" r="1.4" fill="currentColor" />
        </svg>
      </button>
      {open && (
        <div
          ref={menuRef}
          role="menu"
          style={{
            position: 'absolute', top: '100%', right: 0, marginTop: 4,
            background: 'var(--df-bg-elevated)',
            border: '1px solid var(--df-border-default)',
            borderRadius: 'var(--df-radius-md)',
            boxShadow: '0 12px 32px rgba(0,0,0,0.6)',
            minWidth: 180,
            padding: 4,
            zIndex: 100,
          }}
        >
          {ACTIONS.map((item) => (
            <button
              key={item.dest}
              role="menuitem"
              type="button"
              onClick={() => { setOpen(false); console.log(item.dest, deployment.id) }}
              style={{
                width: '100%', textAlign: 'left',
                background: 'transparent',
                border: 'none',
                padding: '8px 12px',
                borderRadius: 'var(--df-radius-sm)',
                color: item.danger ? 'var(--df-neon-red)' : 'var(--df-text-primary)',
                fontSize: 13,
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--df-bg-hover)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------- Columns ----------
const columns: ColumnDef<Deployment>[] = [
  {
    accessorKey: 'agent',
    header: 'Agent',
    cell: (info) => (
      <span style={{ color: 'var(--df-text-primary)', fontWeight: 500, fontFamily: 'var(--df-font-mono)', fontSize: 13 }}>
        {info.getValue<string>()}
      </span>
    ),
  },
  {
    accessorKey: 'region',
    header: 'Region',
    cell: (info) => (
      <span style={{ color: 'var(--df-text-secondary)', fontSize: 13 }}>{info.getValue<string>()}</span>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: (info) => <StatusPill status={info.getValue<DeploymentStatus>()} />,
  },
  {
    accessorKey: 'requestsPerMin',
    header: 'Req/min',
    cell: (info) => (
      <span style={{ color: 'var(--df-text-primary)', fontFamily: 'var(--df-font-mono)', fontSize: 13 }}>
        {info.getValue<number>().toLocaleString('en-US')}
      </span>
    ),
  },
  {
    accessorKey: 'p95Ms',
    header: 'P95',
    cell: (info) => {
      const v = info.getValue<number>()
      return (
        <span style={{
          color: v > 1000 ? 'var(--df-neon-amber)' : 'var(--df-text-secondary)',
          fontFamily: 'var(--df-font-mono)', fontSize: 13,
        }}>
          {v === 0 ? '—' : `${v} ms`}
        </span>
      )
    },
  },
  {
    accessorKey: 'lastDeploy',
    header: 'Last deploy',
    cell: (info) => {
      const iso = info.getValue<string>()
      const d = new Date(iso)
      return (
        <time
          dateTime={iso}
          style={{ color: 'var(--df-text-muted)', fontSize: 12 }}
        >
          {d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
        </time>
      )
    },
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => <RowActions deployment={row.original} />,
    enableSorting: false,
  },
]

// ---------- Table ----------
export function DeploymentsTable({ data = SAMPLE }: { data?: Deployment[] }) {
  const [sorting, setSorting] = useState<SortingState>([])

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 6 } },
  })

  const tdStyle: CSSProperties = {
    padding: '14px 16px',
    borderBottom: '1px solid var(--df-border-subtle)',
    fontSize: 13,
  }

  return (
    <div
      style={{
        background: 'var(--df-bg-surface)',
        border: '1px solid var(--df-border-subtle)',
        borderRadius: 'var(--df-radius-lg)',
        overflow: 'hidden',
      }}
    >
      <header
        style={{
          padding: 'var(--df-space-5) var(--df-space-5) var(--df-space-4)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          borderBottom: '1px solid var(--df-border-subtle)',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h2 style={{ color: 'var(--df-text-primary)', fontSize: 15, fontWeight: 600, margin: 0 }}>
            Deployments
          </h2>
          <p style={{ color: 'var(--df-text-muted)', fontSize: 12, margin: '4px 0 0' }}>
            {data.length} agents across {new Set(data.map((d) => d.region)).size} regions
          </p>
        </div>
        <button
          type="button"
          style={{
            background: 'var(--df-neon-violet)', color: 'var(--df-text-inverse)',
            border: 'none', borderRadius: 'var(--df-radius-md)',
            padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            boxShadow: 'var(--df-glow-violet)',
          }}
        >
          New deployment
        </button>
      </header>

      {/* Scroll container — sticky header lives here, not in viewport */}
      <div style={{ overflowX: 'auto', maxHeight: 480, overflowY: 'auto' }}>
        <table
          role="table"
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            minWidth: 880, // forces horizontal scroll on small screens rather than column collapse
          }}
        >
          <thead
            style={{
              position: 'sticky', top: 0,
              background: 'var(--df-bg-elevated)',
              zIndex: 1,
            }}
          >
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id}>
                {group.headers.map((header) => {
                  const sortable = header.column.getCanSort()
                  const dir = header.column.getIsSorted()
                  return (
                    <th
                      key={header.id}
                      scope="col"
                      aria-sort={
                        dir === 'asc' ? 'ascending' :
                        dir === 'desc' ? 'descending' :
                        sortable ? 'none' : undefined
                      }
                      style={{
                        textAlign: 'left',
                        padding: '12px 16px',
                        fontSize: 11,
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        color: 'var(--df-text-muted)',
                        borderBottom: '1px solid var(--df-border-subtle)',
                        cursor: sortable ? 'pointer' : 'default',
                        userSelect: 'none',
                      }}
                      onClick={sortable ? header.column.getToggleSortingHandler() : undefined}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {sortable && (
                          <span style={{ color: dir ? 'var(--df-neon-violet)' : 'var(--df-text-muted)', fontSize: 10 }}>
                            {dir === 'asc' ? '▲' : dir === 'desc' ? '▼' : '↕'}
                          </span>
                        )}
                      </span>
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                style={{ transition: 'background 150ms var(--df-ease-out), box-shadow 150ms var(--df-ease-out)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--df-bg-hover)'
                  e.currentTarget.style.boxShadow = 'inset 3px 0 0 var(--df-neon-violet), 0 0 24px rgba(167,139,250,0.08)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} style={tdStyle}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <footer
        style={{
          padding: '12px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          borderTop: '1px solid var(--df-border-subtle)',
          flexWrap: 'wrap',
        }}
      >
        <p style={{ color: 'var(--df-text-muted)', fontSize: 12, margin: 0 }}>
          Page <strong style={{ color: 'var(--df-text-secondary)' }}>{table.getState().pagination.pageIndex + 1}</strong>
          {' '}of <strong style={{ color: 'var(--df-text-secondary)' }}>{table.getPageCount()}</strong>
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            aria-label="Previous page"
            style={{
              background: 'var(--df-bg-elevated)',
              border: '1px solid var(--df-border-default)',
              borderRadius: 'var(--df-radius-sm)',
              padding: '6px 12px',
              color: table.getCanPreviousPage() ? 'var(--df-text-primary)' : 'var(--df-text-muted)',
              fontSize: 12,
              cursor: table.getCanPreviousPage() ? 'pointer' : 'not-allowed',
              opacity: table.getCanPreviousPage() ? 1 : 0.5,
            }}
          >
            ← Prev
          </button>
          <button
            type="button"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            aria-label="Next page"
            style={{
              background: 'var(--df-bg-elevated)',
              border: '1px solid var(--df-border-default)',
              borderRadius: 'var(--df-radius-sm)',
              padding: '6px 12px',
              color: table.getCanNextPage() ? 'var(--df-text-primary)' : 'var(--df-text-muted)',
              fontSize: 12,
              cursor: table.getCanNextPage() ? 'pointer' : 'not-allowed',
              opacity: table.getCanNextPage() ? 1 : 0.5,
            }}
          >
            Next →
          </button>
        </div>
      </footer>
    </div>
  )
}
```

---

## Pattern 4 — Agent Chat Interface

The killer demo for AI products. Conversation list on the left, message thread in the middle, composer at the bottom. Streaming indicator is three pure-CSS dots staggered at 0/0.18/0.36s. The message list is `aria-live="polite"` so a screen reader announces new messages without interrupting. Pressing Enter sends; Shift+Enter newlines.

```tsx
// Requires: framer-motion, tailwindcss
'use client'
import { motion, useReducedMotion } from 'framer-motion'
import {
  useState,
  useRef,
  useEffect,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react'

// ---------- Domain ----------
type Role = 'user' | 'agent' | 'system'

interface Message {
  id: string
  role: Role
  content: string
  ts: string // ISO
  streaming?: boolean
}

interface Conversation {
  id: string
  agent: string
  preview: string
  unread: number
  ts: string
}

const CONVERSATIONS: Conversation[] = [
  { id: 'c1', agent: 'support-router-v3',  preview: 'Routed to billing — escalation cleared', unread: 0, ts: '2m' },
  { id: 'c2', agent: 'invoice-classifier', preview: '47 invoices reconciled this hour',        unread: 2, ts: '14m' },
  { id: 'c3', agent: 'lead-enricher',      preview: 'Pulled domain data for 12 leads',         unread: 0, ts: '1h' },
  { id: 'c4', agent: 'meeting-summarizer', preview: 'Posted summary to #design-syncs',         unread: 0, ts: '3h' },
]

const INITIAL_MESSAGES: Message[] = [
  { id: 'm1', role: 'system', content: 'Connected to support-router-v3 · us-east-1',  ts: '2026-04-26T18:30:00Z' },
  { id: 'm2', role: 'user',   content: 'How did you handle the latest escalation?',   ts: '2026-04-26T18:31:00Z' },
  { id: 'm3', role: 'agent',  content: 'Routed ticket #4827 to billing because the user mentioned a duplicate charge. Confidence 0.94. Follow-up SLA is 4 hours.', ts: '2026-04-26T18:31:08Z' },
  { id: 'm4', role: 'user',   content: 'Show me your reasoning trace.',               ts: '2026-04-26T18:32:14Z' },
]

// ---------- Streaming dots (pure CSS, motion-safe) ----------
function StreamingDots() {
  return (
    <span
      role="status"
      aria-label="Agent is responding"
      style={{ display: 'inline-flex', gap: 4, alignItems: 'center', height: 16 }}
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 6, height: 6, borderRadius: '50%',
            background: 'var(--df-neon-violet)',
            boxShadow: '0 0 6px rgba(167,139,250,0.6)',
            animation: `nx-stream-pulse 1.2s ease-in-out ${i * 0.18}s infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes nx-stream-pulse {
          0%, 100% { opacity: 0.25; transform: scale(0.85); }
          50%      { opacity: 1;    transform: scale(1.05); }
        }
        @media (prefers-reduced-motion: reduce) {
          [role="status"] span { animation: none !important; opacity: 0.7 !important; }
        }
      `}</style>
    </span>
  )
}

// ---------- Bubble ----------
function MessageBubble({ message }: { message: Message }) {
  const reduceMotion = useReducedMotion()
  if (message.role === 'system') {
    return (
      <p
        role="status"
        style={{
          textAlign: 'center',
          color: 'var(--df-text-muted)',
          fontSize: 11,
          margin: 'var(--df-space-3) 0',
          fontFamily: 'var(--df-font-mono)',
        }}
      >
        {message.content}
      </p>
    )
  }
  const isUser = message.role === 'user'
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      style={{
        display: 'flex',
        flexDirection: isUser ? 'row-reverse' : 'row',
        alignItems: 'flex-end',
        gap: 10,
        marginBottom: 12,
      }}
    >
      {!isUser && (
        <div
          style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--df-neon-violet), var(--df-neon-cyan))',
            flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, color: 'var(--df-text-inverse)',
          }}
          aria-hidden="true"
        >
          DF
        </div>
      )}
      <div
        style={{
          maxWidth: '70%',
          background: isUser
            ? 'linear-gradient(135deg, rgba(167,139,250,0.18), rgba(167,139,250,0.08))'
            : 'var(--df-bg-elevated)',
          border: isUser
            ? '1px solid rgba(167,139,250,0.3)'
            : '1px solid var(--df-border-subtle)',
          borderRadius: 'var(--df-radius-lg)',
          padding: '10px 14px',
          color: 'var(--df-text-primary)',
          fontSize: 14,
          lineHeight: 1.55,
          boxShadow: isUser ? '0 0 20px rgba(167,139,250,0.15)' : 'none',
        }}
      >
        {message.streaming ? <StreamingDots /> : message.content}
        <span
          style={{
            display: 'block',
            color: 'var(--df-text-muted)',
            fontSize: 10,
            marginTop: 4,
          }}
        >
          {new Date(message.ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
        </span>
      </div>
    </motion.div>
  )
}

// ---------- Chat shell ----------
export function AgentChat() {
  const [activeId, setActiveId] = useState<string>('c1')
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES)
  const [draft, setDraft] = useState('')
  const listEndRef = useRef<HTMLDivElement | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  // Autoscroll on new message
  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages])

  const sendMessage = (text: string) => {
    if (!text.trim()) return
    const now = new Date().toISOString()
    const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', content: text.trim(), ts: now }
    const streamMsg: Message = { id: `a-${Date.now()}`, role: 'agent', content: '', ts: now, streaming: true }
    setMessages((prev) => [...prev, userMsg, streamMsg])
    setDraft('')

    // Simulated streaming response
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === streamMsg.id
            ? { ...m, content: 'Trace recorded. I escalated based on three signals: duplicate charge mention, account tier (Pro), and prior unresolved tickets. Want me to attach the full chain-of-thought?', streaming: false }
            : m
        )
      )
    }, 1400)
  }

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    sendMessage(draft)
    textareaRef.current?.focus()
  }

  const onKeyDown = (e: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(draft)
    }
  }

  return (
    <section
      aria-label="Agent chat"
      style={{
        display: 'grid',
        gridTemplateColumns: '280px 1fr',
        height: '100%',
        minHeight: 600,
        background: 'var(--df-bg-surface)',
        border: '1px solid var(--df-border-subtle)',
        borderRadius: 'var(--df-radius-lg)',
        overflow: 'hidden',
      }}
    >
      {/* Conversation list */}
      <aside
        style={{
          borderRight: '1px solid var(--df-border-subtle)',
          background: 'var(--df-bg-base)',
          overflowY: 'auto',
        }}
        aria-label="Conversations"
      >
        <header style={{ padding: '16px 16px 12px', borderBottom: '1px solid var(--df-border-subtle)' }}>
          <h2 style={{ color: 'var(--df-text-primary)', fontSize: 14, fontWeight: 600, margin: 0 }}>Agents</h2>
        </header>
        <ul role="list" style={{ listStyle: 'none', margin: 0, padding: 4 }}>
          {CONVERSATIONS.map((c) => {
            const isActive = c.id === activeId
            return (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => setActiveId(c.id)}
                  aria-current={isActive ? 'true' : undefined}
                  style={{
                    width: '100%', textAlign: 'left',
                    background: isActive ? 'rgba(167,139,250,0.08)' : 'transparent',
                    border: 'none',
                    borderLeft: isActive ? '2px solid var(--df-neon-violet)' : '2px solid transparent',
                    borderRadius: 'var(--df-radius-sm)',
                    padding: '10px 12px',
                    cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', gap: 4,
                  }}
                  onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'var(--df-bg-hover)' }}
                  onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span
                      style={{
                        color: 'var(--df-text-primary)',
                        fontSize: 13,
                        fontWeight: 600,
                        fontFamily: 'var(--df-font-mono)',
                      }}
                    >
                      {c.agent}
                    </span>
                    <span style={{ color: 'var(--df-text-muted)', fontSize: 11 }}>{c.ts}</span>
                  </div>
                  <p
                    style={{
                      color: 'var(--df-text-secondary)', fontSize: 12, margin: 0,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}
                  >
                    {c.preview}
                  </p>
                  {c.unread > 0 && (
                    <span
                      aria-label={`${c.unread} unread messages`}
                      style={{
                        alignSelf: 'flex-start',
                        background: 'var(--df-neon-pink)',
                        color: 'var(--df-text-inverse)',
                        fontSize: 10, fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: 'var(--df-radius-full)',
                        boxShadow: 'var(--df-glow-pink)',
                      }}
                    >
                      {c.unread}
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </aside>

      {/* Thread */}
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid var(--df-border-subtle)',
            display: 'flex', alignItems: 'center', gap: 12,
          }}
        >
          <span
            style={{
              width: 8, height: 8, borderRadius: '50%',
              background: 'var(--df-neon-green)',
              boxShadow: 'var(--df-glow-green)',
            }}
            aria-hidden="true"
          />
          <h3
            style={{
              color: 'var(--df-text-primary)', fontSize: 14, fontWeight: 600, margin: 0,
              fontFamily: 'var(--df-font-mono)',
            }}
          >
            support-router-v3
          </h3>
          <span style={{ color: 'var(--df-text-muted)', fontSize: 12 }}>· us-east-1 · running</span>
        </header>

        <div
          role="log"
          aria-live="polite"
          aria-label="Message history"
          style={{
            flex: 1,
            padding: '16px 20px',
            overflowY: 'auto',
          }}
        >
          {messages.map((m) => <MessageBubble key={m.id} message={m} />)}
          <div ref={listEndRef} />
        </div>

        <form
          onSubmit={onSubmit}
          style={{
            padding: 16,
            borderTop: '1px solid var(--df-border-subtle)',
            background: 'var(--df-bg-base)',
          }}
        >
          <label
            htmlFor="nx-chat-input"
            style={{
              position: 'absolute', width: 1, height: 1, padding: 0, margin: -1,
              overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0,
            }}
          >
            Message support-router-v3
          </label>
          <div
            style={{
              display: 'flex', alignItems: 'flex-end', gap: 10,
              background: 'var(--df-bg-elevated)',
              border: '1px solid var(--df-border-default)',
              borderRadius: 'var(--df-radius-lg)',
              padding: 8,
              transition: 'border-color 150ms var(--df-ease-out), box-shadow 150ms var(--df-ease-out)',
            }}
          >
            <textarea
              ref={textareaRef}
              id="nx-chat-input"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Ask the agent — Shift+Enter for newline"
              rows={1}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--df-text-primary)',
                fontSize: 14,
                fontFamily: 'var(--df-font-sans)',
                resize: 'none',
                padding: '8px 10px',
                maxHeight: 120,
                lineHeight: 1.5,
              }}
              onFocus={(e) => {
                const parent = e.currentTarget.parentElement
                if (parent) {
                  parent.style.borderColor = 'var(--df-border-focus)'
                  parent.style.boxShadow = '0 0 0 3px rgba(167,139,250,0.12)'
                }
              }}
              onBlur={(e) => {
                const parent = e.currentTarget.parentElement
                if (parent) {
                  parent.style.borderColor = 'var(--df-border-default)'
                  parent.style.boxShadow = 'none'
                }
              }}
            />
            <button
              type="submit"
              aria-label="Send message"
              disabled={!draft.trim()}
              style={{
                background: draft.trim() ? 'var(--df-neon-violet)' : 'var(--df-bg-muted)',
                color: draft.trim() ? 'var(--df-text-inverse)' : 'var(--df-text-muted)',
                border: 'none',
                borderRadius: 'var(--df-radius-md)',
                width: 36, height: 36,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                cursor: draft.trim() ? 'pointer' : 'not-allowed',
                boxShadow: draft.trim() ? 'var(--df-glow-violet)' : 'none',
                transition: 'all 150ms var(--df-ease-out)',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M2 8L14 2L9 14L7.5 9L2 8Z" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}
```

---

## Pattern 5 — Activity Feed Timeline

Vertical timeline grouped by day, neon timestamps, action descriptions, and a marker dot per kind. Useful for audit logs, deploy history, or agent action streams. Day headers are sticky inside the scroll container; entries stagger in via Framer Motion.

```tsx
// Requires: framer-motion, tailwindcss
'use client'
import { motion, useReducedMotion } from 'framer-motion'
import { useMemo } from 'react'

// ---------- Domain ----------
type ActivityKind = 'deploy' | 'rollback' | 'alert' | 'config' | 'message'

interface Activity {
  id: string
  kind: ActivityKind
  actor: string
  target: string
  detail: string
  ts: string // ISO
}

const ACTIVITIES: Activity[] = [
  { id: 'a01', kind: 'deploy',   actor: 'karan',          target: 'support-router-v3', detail: 'shipped v3.4.1 → us-east-1',     ts: '2026-04-27T09:14:00Z' },
  { id: 'a02', kind: 'alert',    actor: 'monitoring-bot', target: 'lead-enricher',     detail: 'P95 latency over 1500ms (3min)', ts: '2026-04-27T08:52:00Z' },
  { id: 'a03', kind: 'config',   actor: 'maya',           target: 'invoice-classifier',detail: 'updated rate limit to 200 RPM',  ts: '2026-04-27T08:01:00Z' },
  { id: 'a04', kind: 'rollback', actor: 'karan',          target: 'pricing-bot',       detail: 'reverted to v2.1.7 — schema drift', ts: '2026-04-26T22:43:00Z' },
  { id: 'a05', kind: 'message',  actor: 'support-router', target: '#ops',              detail: 'closed escalation #4811',         ts: '2026-04-26T18:18:00Z' },
  { id: 'a06', kind: 'deploy',   actor: 'devon',          target: 'meeting-summarizer',detail: 'shipped v1.9.0 → ap-southeast-1', ts: '2026-04-26T07:55:00Z' },
]

const KIND_META: Record<ActivityKind, { color: string; verb: string; icon: string }> = {
  deploy:   { color: 'var(--df-neon-violet)', verb: 'deployed',   icon: '↑' },
  rollback: { color: 'var(--df-neon-amber)',  verb: 'rolled back', icon: '↺' },
  alert:    { color: 'var(--df-neon-red)',    verb: 'alerted',    icon: '!' },
  config:   { color: 'var(--df-neon-cyan)',   verb: 'configured', icon: '∗' },
  message:  { color: 'var(--df-neon-pink)',   verb: 'messaged',   icon: '✦' },
}

// ---------- Group by day ----------
function groupByDay(items: Activity[]): Array<{ day: string; items: Activity[] }> {
  const groups = new Map<string, Activity[]>()
  for (const item of items) {
    const day = new Date(item.ts).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
    if (!groups.has(day)) groups.set(day, [])
    groups.get(day)!.push(item)
  }
  return Array.from(groups.entries()).map(([day, items]) => ({ day, items }))
}

// ---------- Component ----------
export function ActivityFeed({ items = ACTIVITIES }: { items?: Activity[] }) {
  const reduceMotion = useReducedMotion()
  const groups = useMemo(() => groupByDay(items), [items])

  return (
    <section
      aria-label="Activity feed"
      style={{
        background: 'var(--df-bg-surface)',
        border: '1px solid var(--df-border-subtle)',
        borderRadius: 'var(--df-radius-lg)',
        padding: 'var(--df-space-5)',
        maxHeight: 540,
        overflowY: 'auto',
      }}
    >
      <h2
        style={{
          color: 'var(--df-text-primary)',
          fontSize: 15,
          fontWeight: 600,
          margin: '0 0 var(--df-space-4)',
        }}
      >
        Activity
      </h2>

      {groups.map(({ day, items }) => (
        <div key={day}>
          <h3
            style={{
              position: 'sticky', top: 0,
              background: 'var(--df-bg-surface)',
              color: 'var(--df-text-muted)',
              fontSize: 11,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              margin: 0,
              padding: '8px 0',
              zIndex: 1,
            }}
          >
            {day}
          </h3>

          <ol role="list" style={{ listStyle: 'none', padding: 0, margin: 0, position: 'relative' }}>
            {/* Vertical rail */}
            <span
              aria-hidden="true"
              style={{
                position: 'absolute',
                left: 13, top: 0, bottom: 0,
                width: 1,
                background: 'linear-gradient(to bottom, var(--df-border-subtle), transparent)',
              }}
            />

            {items.map((act, i) => {
              const meta = KIND_META[act.kind]
              return (
                <motion.li
                  key={act.id}
                  initial={reduceMotion ? false : { opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: reduceMotion ? 0 : i * 0.05, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    position: 'relative',
                    paddingLeft: 36,
                    paddingBottom: 'var(--df-space-4)',
                  }}
                >
                  {/* Marker */}
                  <span
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      left: 4, top: 4,
                      width: 20, height: 20,
                      borderRadius: '50%',
                      background: 'var(--df-bg-elevated)',
                      border: `1px solid ${meta.color}`,
                      boxShadow: `0 0 12px ${meta.color}33`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: meta.color,
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    {meta.icon}
                  </span>

                  {/* Content */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{ margin: 0, fontSize: 13, color: 'var(--df-text-primary)', lineHeight: 1.5 }}>
                        <strong style={{ color: 'var(--df-text-primary)', fontWeight: 600 }}>{act.actor}</strong>
                        {' '}
                        <span style={{ color: meta.color, fontWeight: 600 }}>{meta.verb}</span>
                        {' '}
                        <span style={{ color: 'var(--df-text-secondary)', fontFamily: 'var(--df-font-mono)' }}>{act.target}</span>
                      </p>
                      <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--df-text-secondary)', lineHeight: 1.5 }}>
                        {act.detail}
                      </p>
                    </div>
                    <time
                      dateTime={act.ts}
                      style={{
                        color: meta.color,
                        fontSize: 11,
                        fontFamily: 'var(--df-font-mono)',
                        flexShrink: 0,
                      }}
                    >
                      {new Date(act.ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    </time>
                  </div>
                </motion.li>
              )
            })}
          </ol>
        </div>
      ))}
    </section>
  )
}
```

---

## Pattern 6 — Command Palette (⌘K)

A custom-built palette — no `cmdk` dependency, so it's portable and the keyboard model is fully visible. Opens on `⌘+K` / `Ctrl+K`, traps body scroll, restores focus to the trigger on close. Up/Down moves selection; Enter executes; Esc closes.

```tsx
// Requires: framer-motion, tailwindcss
// VERIFY: createPortal omitted for clarity — wrap in `createPortal(..., document.body)` in real apps.
'use client'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import {
  useState,
  useRef,
  useEffect,
  useMemo,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react'

// ---------- Command shape ----------
interface Command {
  id: string
  label: string
  hint?: string
  group: string
  shortcut?: string[]
  run: () => void
}

const COMMANDS: Command[] = [
  { id: 'cmd-deploy',    group: 'Agents',        label: 'Deploy new agent',     hint: 'Spin up from template',   shortcut: ['⌘', 'N'],   run: () => console.log('deploy') },
  { id: 'cmd-rollback',  group: 'Agents',        label: 'Rollback last deploy', hint: 'Revert to previous',      shortcut: ['⌘', '⇧', 'Z'], run: () => console.log('rollback') },
  { id: 'cmd-logs',      group: 'Observability', label: 'Open logs',            hint: 'Stream from agents',      shortcut: ['⌘', 'L'],   run: () => console.log('logs') },
  { id: 'cmd-alerts',    group: 'Observability', label: 'View alerts',          hint: '3 active',                                          run: () => console.log('alerts') },
  { id: 'cmd-billing',   group: 'Account',       label: 'Billing & usage',      hint: '9.7M tokens this cycle',  shortcut: ['⌘', 'B'],   run: () => console.log('billing') },
  { id: 'cmd-keys',      group: 'Account',       label: 'Manage API keys',                                                                run: () => console.log('keys') },
  { id: 'cmd-docs',      group: 'Help',          label: 'Read documentation',                                                             run: () => console.log('docs') },
  { id: 'cmd-shortcuts', group: 'Help',          label: 'Keyboard shortcuts',   shortcut: ['⌘', '/'],                                     run: () => console.log('shortcuts') },
]

// ---------- Global ⌘K hook ----------
function useGlobalShortcut(open: () => void) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/i.test(navigator.platform)
      const cmd = isMac ? e.metaKey : e.ctrlKey
      if (cmd && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        open()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open])
}

// ---------- Palette ----------
interface CommandPaletteProps {
  commands?: Command[]
}

export function CommandPalette({ commands = COMMANDS }: CommandPaletteProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIdx, setActiveIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const triggerRef = useRef<HTMLElement | null>(null)
  const reduceMotion = useReducedMotion()

  useGlobalShortcut(() => {
    triggerRef.current = document.activeElement as HTMLElement
    setOpen(true)
  })

  // Body scroll lock + autofocus
  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const t = setTimeout(() => inputRef.current?.focus(), 50)
    return () => {
      document.body.style.overflow = previous
      clearTimeout(t)
    }
  }, [open])

  const closePalette = () => {
    setOpen(false)
    setQuery('')
    setActiveIdx(0)
    setTimeout(() => triggerRef.current?.focus(), 0)
  }

  // Filter
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return commands
    return commands.filter((c) => c.label.toLowerCase().includes(q) || c.group.toLowerCase().includes(q))
  }, [query, commands])

  // Group filtered
  const grouped = useMemo(() => {
    const map = new Map<string, Command[]>()
    for (const c of filtered) {
      if (!map.has(c.group)) map.set(c.group, [])
      map.get(c.group)!.push(c)
    }
    return Array.from(map.entries())
  }, [filtered])

  // Reset highlighted item when query changes
  useEffect(() => { setActiveIdx(0) }, [query])

  const onKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      closePalette()
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx((i) => Math.min(filtered.length - 1, i + 1))
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx((i) => Math.max(0, i - 1))
      return
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      const cmd = filtered[activeIdx]
      if (cmd) {
        cmd.run()
        closePalette()
      }
    }
  }

  // Compute global index for highlighting across groups
  let runningIdx = -1

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.15 }}
            onClick={closePalette}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(8px)',
              zIndex: 400,
            }}
            aria-hidden="true"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: reduceMotion ? 0 : 0.18, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'fixed',
              top: '15vh',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 'min(92vw, 600px)',
              background: 'var(--df-bg-elevated)',
              border: '1px solid var(--df-border-default)',
              borderRadius: 'var(--df-radius-lg)',
              boxShadow: '0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(167,139,250,0.12)',
              zIndex: 401,
              overflow: 'hidden',
            }}
          >
            {/* Search */}
            <div
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 18px',
                borderBottom: '1px solid var(--df-border-subtle)',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--df-text-muted)" strokeWidth="1.6" aria-hidden="true">
                <circle cx="7" cy="7" r="5" />
                <path d="M11 11L14 14" strokeLinecap="round" />
              </svg>
              <input
                ref={inputRef}
                role="combobox"
                aria-expanded="true"
                aria-controls="nx-cmd-list"
                aria-activedescendant={filtered[activeIdx] ? `cmd-opt-${filtered[activeIdx].id}` : undefined}
                placeholder="Type a command, agent, or doc…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--df-text-primary)',
                  fontSize: 15,
                  fontFamily: 'var(--df-font-sans)',
                }}
              />
              <kbd
                style={{
                  fontFamily: 'var(--df-font-mono)',
                  fontSize: 11,
                  color: 'var(--df-text-muted)',
                  background: 'var(--df-bg-base)',
                  border: '1px solid var(--df-border-subtle)',
                  borderRadius: 'var(--df-radius-sm)',
                  padding: '2px 6px',
                }}
              >
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div
              id="nx-cmd-list"
              role="listbox"
              style={{
                maxHeight: 360,
                overflowY: 'auto',
                padding: 6,
              }}
            >
              {grouped.length === 0 && (
                <p style={{ color: 'var(--df-text-muted)', fontSize: 13, textAlign: 'center', padding: 'var(--df-space-6)' }}>
                  No results for &quot;{query}&quot;
                </p>
              )}
              {grouped.map(([group, cmds]) => (
                <div key={group} style={{ marginBottom: 4 }}>
                  <p
                    style={{
                      color: 'var(--df-text-muted)',
                      fontSize: 10,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      padding: '8px 12px 4px',
                      margin: 0,
                    }}
                  >
                    {group}
                  </p>
                  {cmds.map((cmd) => {
                    runningIdx += 1
                    const isActive = runningIdx === activeIdx
                    return (
                      <button
                        key={cmd.id}
                        id={`cmd-opt-${cmd.id}`}
                        role="option"
                        aria-selected={isActive}
                        type="button"
                        onClick={() => { cmd.run(); closePalette() }}
                        onMouseEnter={() => setActiveIdx(runningIdx)}
                        style={{
                          width: '100%', textAlign: 'left',
                          background: isActive ? 'rgba(167,139,250,0.12)' : 'transparent',
                          border: 'none',
                          borderRadius: 'var(--df-radius-sm)',
                          padding: '10px 12px',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                          cursor: 'pointer',
                          color: isActive ? 'var(--df-neon-violet)' : 'var(--df-text-primary)',
                          boxShadow: isActive ? 'inset 2px 0 0 var(--df-neon-violet)' : 'none',
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                          <span style={{ fontSize: 14, fontWeight: 500 }}>{cmd.label}</span>
                          {cmd.hint && (
                            <span style={{ color: 'var(--df-text-muted)', fontSize: 12 }}>{cmd.hint}</span>
                          )}
                        </div>
                        {cmd.shortcut && (
                          <span style={{ display: 'inline-flex', gap: 4, flexShrink: 0 }}>
                            {cmd.shortcut.map((k) => (
                              <kbd
                                key={k}
                                style={{
                                  fontFamily: 'var(--df-font-mono)',
                                  fontSize: 10,
                                  color: 'var(--df-text-secondary)',
                                  background: 'var(--df-bg-base)',
                                  border: '1px solid var(--df-border-subtle)',
                                  borderRadius: 'var(--df-radius-sm)',
                                  padding: '1px 5px',
                                  minWidth: 18,
                                  textAlign: 'center',
                                }}
                              >
                                {k}
                              </kbd>
                            ))}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>

            {/* Footer */}
            <footer
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 16px',
                borderTop: '1px solid var(--df-border-subtle)',
                background: 'var(--df-bg-base)',
                fontSize: 11,
                color: 'var(--df-text-muted)',
              }}
            >
              <span>Nexus Cloud · v1.4</span>
              <span style={{ display: 'inline-flex', gap: 12 }}>
                <span><kbd style={{ fontFamily: 'var(--df-font-mono)' }}>↑↓</kbd> navigate</span>
                <span><kbd style={{ fontFamily: 'var(--df-font-mono)' }}>↵</kbd> select</span>
              </span>
            </footer>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
```

---

## Pattern 7 — Sidebar with Icon Nav

The sidebar that fills Pattern 1's left rail. Collapsed/expanded states (66px / 240px), icon nav with labels, active item gets violet bg + glow + a 2px violet rail on the left edge, footer holds a user avatar dropdown. Uses `aria-current="page"` on the active item.

```tsx
// Requires: tailwindcss (no animation library required)
'use client'
import { useState, useRef, useEffect, type ReactNode } from 'react'
import { useReducedMotion } from 'framer-motion'

// ---------- Domain ----------
interface NavItem {
  id: string
  label: string
  href: string
  icon: ReactNode
  badge?: string
}

interface SidebarUser {
  name: string
  email: string
}

const ICON: Record<string, ReactNode> = {
  overview: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="9" /><rect x="14" y="3" width="7" height="5" />
      <rect x="14" y="12" width="7" height="9" /><rect x="3" y="16" width="7" height="5" />
    </svg>
  ),
  agents: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="4" /><path d="M4 21V19a4 4 0 014-4h8a4 4 0 014 4v2" />
    </svg>
  ),
  deployments: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2L4 6v6c0 5 3.5 9.7 8 10 4.5-.3 8-5 8-10V6l-8-4z" />
    </svg>
  ),
  logs: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6" /><path d="M9 13h6M9 17h6" />
    </svg>
  ),
  billing: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="6" width="20" height="13" rx="2" /><path d="M2 11h20" />
    </svg>
  ),
  settings: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 008 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.6 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.6 1.65 1.65 0 0010 3.09V3a2 2 0 014 0v.09c0 .68.39 1.27 1 1.51a1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9c.24.61.83 1 1.51 1H21a2 2 0 010 4h-.09c-.68 0-1.27.39-1.51 1z" />
    </svg>
  ),
}

const NAV_ITEMS: NavItem[] = [
  { id: 'overview',    label: 'Overview',    href: '/', icon: ICON.overview },
  { id: 'agents',      label: 'Agents',      href: '/agents', icon: ICON.agents, badge: '4.8K' },
  { id: 'deployments', label: 'Deployments', href: '/deployments', icon: ICON.deployments },
  { id: 'logs',        label: 'Logs',        href: '/logs', icon: ICON.logs, badge: 'live' },
  { id: 'billing',     label: 'Billing',     href: '/billing', icon: ICON.billing },
  { id: 'settings',    label: 'Settings',    href: '/settings', icon: ICON.settings },
]

const SIDEBAR_USER: SidebarUser = {
  name: 'Karan Mundre',
  email: 'karan@nexus.cloud',
}

// ---------- Sidebar ----------
interface SidebarProps {
  items?: NavItem[]
  activeId?: string
  user?: SidebarUser
  onNavigate?: (href: string) => void
}

export function Sidebar({
  items = NAV_ITEMS,
  activeId = 'overview',
  user = SIDEBAR_USER,
  onNavigate,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const userBtnRef = useRef<HTMLButtonElement | null>(null)
  const reduceMotion = useReducedMotion()

  // Close user menu on outside click / Esc
  useEffect(() => {
    if (!menuOpen) return
    const onClick = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node) && !userBtnRef.current?.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false)
        userBtnRef.current?.focus()
      }
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  return (
    <nav
      aria-label="Primary navigation"
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '16px 12px',
        width: collapsed ? 66 : 240,
        transition: reduceMotion ? 'none' : 'width 200ms var(--df-ease-out)',
      }}
    >
      {/* Logo / brand */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '4px 8px',
          marginBottom: 24,
        }}
      >
        <div
          style={{
            width: 32, height: 32,
            borderRadius: 'var(--df-radius-md)',
            background: 'linear-gradient(135deg, var(--df-neon-violet), var(--df-neon-cyan))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--df-text-inverse)',
            fontWeight: 700,
            fontSize: 14,
            boxShadow: 'var(--df-glow-violet)',
            flexShrink: 0,
          }}
          aria-hidden="true"
        >
          DF
        </div>
        {!collapsed && (
          <span
            style={{
              color: 'var(--df-text-primary)',
              fontWeight: 600,
              fontSize: 15,
              letterSpacing: '-0.01em',
            }}
          >
            Nexus Cloud
          </span>
        )}
      </div>

      {/* Nav items */}
      <ul role="list" style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {items.map((item) => {
          const isActive = item.id === activeId
          return (
            <li key={item.id}>
              <a
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                onClick={(e) => { if (onNavigate) { e.preventDefault(); onNavigate(item.href) } }}
                title={collapsed ? item.label : undefined}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: collapsed ? '10px' : '10px 12px',
                  borderRadius: 'var(--df-radius-md)',
                  color: isActive ? 'var(--df-neon-violet)' : 'var(--df-text-secondary)',
                  background: isActive ? 'rgba(167,139,250,0.10)' : 'transparent',
                  borderLeft: isActive ? '2px solid var(--df-neon-violet)' : '2px solid transparent',
                  paddingLeft: isActive ? (collapsed ? 8 : 10) : (collapsed ? 10 : 12),
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 500,
                  textDecoration: 'none',
                  transition: 'all 150ms var(--df-ease-out)',
                  boxShadow: isActive ? 'inset 0 0 24px rgba(167,139,250,0.06)' : 'none',
                  position: 'relative',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'var(--df-bg-hover)'
                    e.currentTarget.style.color = 'var(--df-text-primary)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = 'var(--df-text-secondary)'
                  }
                }}
              >
                <span style={{ flexShrink: 0, display: 'inline-flex' }}>{item.icon}</span>
                {!collapsed && (
                  <>
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {item.badge && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          padding: '2px 6px',
                          borderRadius: 'var(--df-radius-full)',
                          color: item.badge === 'live' ? 'var(--df-neon-green)' : 'var(--df-text-muted)',
                          background: item.badge === 'live'
                            ? 'rgba(74,222,128,0.10)'
                            : 'var(--df-bg-elevated)',
                          border: item.badge === 'live'
                            ? '1px solid rgba(74,222,128,0.3)'
                            : '1px solid var(--df-border-subtle)',
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </a>
            </li>
          )
        })}
      </ul>

      {/* Collapse toggle */}
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-pressed={collapsed}
        style={{
          marginTop: 12,
          background: 'transparent',
          border: 'none',
          color: 'var(--df-text-muted)',
          fontSize: 12,
          padding: '8px 12px',
          cursor: 'pointer',
          textAlign: collapsed ? 'center' : 'left',
          borderRadius: 'var(--df-radius-sm)',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--df-text-secondary)' }}
        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--df-text-muted)' }}
      >
        {collapsed ? '→' : '← Collapse'}
      </button>

      {/* User footer */}
      <div
        style={{
          marginTop: 'auto',
          paddingTop: 12,
          borderTop: '1px solid var(--df-border-subtle)',
          position: 'relative',
        }}
      >
        <button
          ref={userBtnRef}
          type="button"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
          style={{
            width: '100%',
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'transparent',
            border: 'none',
            padding: '8px 8px',
            borderRadius: 'var(--df-radius-md)',
            color: 'var(--df-text-primary)',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--df-bg-hover)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
        >
          <span
            style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--df-neon-violet), var(--df-neon-cyan))',
              flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--df-text-inverse)',
              fontSize: 12,
              fontWeight: 700,
              border: '2px solid var(--df-bg-surface)',
            }}
            aria-hidden="true"
          >
            {user.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
          </span>
          {!collapsed && (
            <span style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.name}
              </span>
              <span style={{ display: 'block', fontSize: 11, color: 'var(--df-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.email}
              </span>
            </span>
          )}
        </button>

        {menuOpen && (
          <div
            ref={menuRef}
            role="menu"
            style={{
              position: 'absolute',
              bottom: 'calc(100% + 4px)',
              left: 0, right: 0,
              background: 'var(--df-bg-elevated)',
              border: '1px solid var(--df-border-default)',
              borderRadius: 'var(--df-radius-md)',
              boxShadow: '0 12px 32px rgba(0,0,0,0.6)',
              padding: 4,
              zIndex: 100,
              minWidth: 200,
            }}
          >
            {[
              { label: 'Profile',         href: '/profile' },
              { label: 'Workspace',       href: '/workspace' },
              { label: 'Theme: AMOLED',   href: '#theme' },
              { label: 'Sign out',        href: '/logout', danger: true },
            ].map((m) => (
              <a
                key={m.label}
                role="menuitem"
                href={m.href}
                style={{
                  display: 'block',
                  padding: '8px 12px',
                  fontSize: 13,
                  color: m.danger ? 'var(--df-neon-red)' : 'var(--df-text-primary)',
                  textDecoration: 'none',
                  borderRadius: 'var(--df-radius-sm)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--df-bg-hover)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
              >
                {m.label}
              </a>
            ))}
          </div>
        )}
      </div>
    </nav>
  )
}
```

---

## Pattern 8 — Top Bar with Breadcrumbs + Search + Notifications

The top bar that fills Pattern 1's `topbar` slot. Sticky with `backdrop-filter`, breadcrumbs on the left, ⌘K search trigger in the middle, neon pink notification dot on the right (with `aria-label` carrying the unread count), user menu beyond that.

```tsx
// Requires: framer-motion, tailwindcss
'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef, useEffect } from 'react'

// ---------- Types ----------
interface Crumb {
  label: string
  href: string
}

interface Notification {
  id: string
  title: string
  body: string
  ts: string
  read: boolean
}

const SAMPLE_CRUMBS: Crumb[] = [
  { label: 'Nexus Cloud', href: '/' },
  { label: 'Agents',      href: '/agents' },
  { label: 'support-router-v3', href: '/agents/support-router-v3' },
]

const NOTIFICATIONS: Notification[] = [
  { id: 'n1', title: 'Latency alert',   body: 'lead-enricher P95 > 1500ms (3 min)',     ts: '4m ago',  read: false },
  { id: 'n2', title: 'Deploy complete', body: 'support-router-v3 v3.4.1 → us-east-1',   ts: '12m ago', read: false },
  { id: 'n3', title: 'New API key',     body: 'Created by maya@nexus.cloud',            ts: '1h ago',  read: false },
  { id: 'n4', title: 'Billing',         body: 'You used 9.7M / 10M tokens',             ts: '3h ago',  read: true  },
]

// ---------- Top bar ----------
interface TopBarProps {
  crumbs?: Crumb[]
  onOpenPalette?: () => void
}

export function TopBar({ crumbs = SAMPLE_CRUMBS, onOpenPalette }: TopBarProps) {
  const [bellOpen, setBellOpen] = useState(false)
  const bellRef = useRef<HTMLButtonElement | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)
  const unread = NOTIFICATIONS.filter((n) => !n.read).length

  useEffect(() => {
    if (!bellOpen) return
    const onClick = (e: MouseEvent) => {
      if (!panelRef.current?.contains(e.target as Node) && !bellRef.current?.contains(e.target as Node)) {
        setBellOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setBellOpen(false)
        bellRef.current?.focus()
      }
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [bellOpen])

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '12px 24px',
        background: 'rgba(8,8,8,0.7)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderBottom: '1px solid var(--df-border-subtle)',
      }}
    >
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" style={{ minWidth: 0, flexShrink: 0 }}>
        <ol
          role="list"
          style={{
            display: 'flex',
            alignItems: 'center',
            listStyle: 'none',
            margin: 0,
            padding: 0,
            gap: 8,
            fontSize: 13,
          }}
        >
          {crumbs.map((c, i) => {
            const isLast = i === crumbs.length - 1
            return (
              <li key={c.href} style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                {!isLast ? (
                  <a
                    href={c.href}
                    style={{
                      color: 'var(--df-text-secondary)',
                      textDecoration: 'none',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: 180,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--df-text-primary)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--df-text-secondary)' }}
                  >
                    {c.label}
                  </a>
                ) : (
                  <span
                    aria-current="page"
                    style={{
                      color: 'var(--df-text-primary)',
                      fontWeight: 600,
                      fontFamily: 'var(--df-font-mono)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: 240,
                    }}
                  >
                    {c.label}
                  </span>
                )}
                {!isLast && (
                  <span style={{ color: 'var(--df-text-muted)', fontSize: 12 }} aria-hidden="true">/</span>
                )}
              </li>
            )
          })}
        </ol>
      </nav>

      {/* Search trigger (opens command palette) */}
      <button
        type="button"
        onClick={onOpenPalette}
        aria-label="Open command palette"
        style={{
          flex: 1,
          maxWidth: 480,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: 'var(--df-bg-elevated)',
          border: '1px solid var(--df-border-subtle)',
          borderRadius: 'var(--df-radius-md)',
          padding: '8px 12px',
          color: 'var(--df-text-muted)',
          fontSize: 13,
          cursor: 'pointer',
          transition: 'all 150ms var(--df-ease-out)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--df-border-default)'
          e.currentTarget.style.background = 'var(--df-bg-hover)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--df-border-subtle)'
          e.currentTarget.style.background = 'var(--df-bg-elevated)'
        }}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          <circle cx="7" cy="7" r="5" /><path d="M11 11L14 14" strokeLinecap="round" />
        </svg>
        <span style={{ flex: 1, textAlign: 'left' }}>Search agents, deploys, docs…</span>
        <kbd
          style={{
            fontFamily: 'var(--df-font-mono)',
            fontSize: 11,
            color: 'var(--df-text-muted)',
            background: 'var(--df-bg-base)',
            border: '1px solid var(--df-border-subtle)',
            borderRadius: 'var(--df-radius-sm)',
            padding: '1px 6px',
          }}
        >
          ⌘K
        </kbd>
      </button>

      {/* Right cluster */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, position: 'relative' }}>
        {/* Notification bell */}
        <button
          ref={bellRef}
          type="button"
          aria-label={unread > 0 ? `Notifications: ${unread} unread` : 'Notifications'}
          aria-haspopup="dialog"
          aria-expanded={bellOpen}
          onClick={() => setBellOpen((o) => !o)}
          style={{
            position: 'relative',
            background: 'transparent',
            border: '1px solid var(--df-border-subtle)',
            borderRadius: 'var(--df-radius-md)',
            color: 'var(--df-text-secondary)',
            width: 36, height: 36,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--df-border-default)'
            e.currentTarget.style.color = 'var(--df-text-primary)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--df-border-subtle)'
            e.currentTarget.style.color = 'var(--df-text-secondary)'
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 01-3.4 0" />
          </svg>
          {unread > 0 && (
            <span
              aria-hidden="true"
              style={{
                position: 'absolute', top: 6, right: 6,
                width: 8, height: 8, borderRadius: '50%',
                background: 'var(--df-neon-pink)',
                boxShadow: 'var(--df-glow-pink)',
                border: '2px solid var(--df-bg-base)',
              }}
            />
          )}
        </button>

        <AnimatePresence>
          {bellOpen && (
            <motion.div
              ref={panelRef}
              role="dialog"
              aria-label="Notifications"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: 360,
                background: 'var(--df-bg-elevated)',
                border: '1px solid var(--df-border-default)',
                borderRadius: 'var(--df-radius-lg)',
                boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
                zIndex: 200,
                overflow: 'hidden',
              }}
            >
              <header
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--df-border-subtle)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}
              >
                <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--df-text-primary)', margin: 0 }}>
                  Notifications
                </h2>
                <button
                  type="button"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--df-neon-violet)',
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  Mark all read
                </button>
              </header>
              <ul role="list" style={{ listStyle: 'none', margin: 0, padding: 0, maxHeight: 380, overflowY: 'auto' }}>
                {NOTIFICATIONS.map((n) => (
                  <li
                    key={n.id}
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid var(--df-border-subtle)',
                      display: 'flex', gap: 10,
                      background: n.read ? 'transparent' : 'rgba(167,139,250,0.04)',
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: n.read ? 'var(--df-bg-muted)' : 'var(--df-neon-violet)',
                        boxShadow: n.read ? 'none' : 'var(--df-glow-violet)',
                        marginTop: 6, flexShrink: 0,
                      }}
                    />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--df-text-primary)', margin: 0 }}>
                        {n.title}
                      </p>
                      <p style={{ fontSize: 12, color: 'var(--df-text-secondary)', margin: '2px 0 0' }}>
                        {n.body}
                      </p>
                      <p style={{ fontSize: 11, color: 'var(--df-text-muted)', margin: '4px 0 0' }}>
                        {n.ts}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  )
}
```

---

## Layout Composition — `<DashboardPage>`

This composes Patterns 1 (shell), 7 (sidebar), 8 (topbar), 2 (stats), 3 (table), and 5 (activity feed in the detail rail). Drop `<CommandPalette />` from Pattern 6 as a sibling and you have a working agent-platform surface.

```tsx
// Requires: framer-motion, @tanstack/react-table, tailwindcss
'use client'
import { useState } from 'react'
import { ThreePaneShell }    from './ThreePaneShell'
import { Sidebar }           from './Sidebar'
import { TopBar }            from './TopBar'
import { StatsGrid }         from './StatsGrid'
import { DeploymentsTable }  from './DeploymentsTable'
import { ActivityFeed }      from './ActivityFeed'
import { CommandPalette }    from './CommandPalette'

export default function DashboardPage() {
  const [activeNav, setActiveNav] = useState('overview')

  // Open the palette from the top bar's search trigger by dispatching ⌘K.
  const openPalette = () => {
    const ev = new KeyboardEvent('keydown', { key: 'k', metaKey: true, ctrlKey: true })
    window.dispatchEvent(ev)
  }

  return (
    <>
      <ThreePaneShell
        sidebar={
          <Sidebar
            activeId={activeNav}
            onNavigate={(href) => {
              const id = href.replace('/', '') || 'overview'
              setActiveNav(id)
            }}
          />
        }
        topbar={
          <TopBar
            crumbs={[
              { label: 'Nexus Cloud', href: '/' },
              { label: 'Overview',    href: '/' },
            ]}
            onOpenPalette={openPalette}
          />
        }
        detail={<ActivityFeed />}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--df-space-8)' }}>
          {/* Page header */}
          <div>
            <h1
              style={{
                fontSize: 28,
                fontWeight: 600,
                color: 'var(--df-text-primary)',
                margin: 0,
                letterSpacing: '-0.02em',
              }}
            >
              Overview
            </h1>
            <p
              style={{
                color: 'var(--df-text-secondary)',
                fontSize: 14,
                margin: '6px 0 0',
              }}
            >
              All Nexus Cloud agents in one place. Updated live.
            </p>
          </div>

          {/* Stats */}
          <StatsGrid />

          {/* Deployments table */}
          <DeploymentsTable />
        </div>
      </ThreePaneShell>

      {/* Mounted once at the top level — listens for ⌘K globally */}
      <CommandPalette />
    </>
  )
}
```

### Page-shell skeleton state

While the page hydrates, swap the table and stats for skeletons from `references/17-skeleton-system.md`:

```tsx
// Loading state (server / suspense fallback)
import { StatCardSkeleton, TableSkeleton, SidebarSkeleton } from '@/components/ui/skeletons'

export function DashboardLoading() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '240px 1fr',
        minHeight: '100vh',
        background: 'var(--df-bg-base)',
      }}
    >
      <SidebarSkeleton />
      <div style={{ padding: 'var(--df-space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--df-space-8)' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 'var(--df-space-4)',
          }}
        >
          {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
        <TableSkeleton rows={6} cols={6} />
      </div>
    </div>
  )
}
```

---

## Cross-References

**Token system:** `references/00-dark-tokens.md` — every color, radius, shadow, and animation in this file resolves through the `--df-*` custom properties defined there. Inject those into `:root` before mounting any pattern.

**Skeleton parity:** `references/17-skeleton-system.md` — `<StatCardSkeleton>`, `<TableSkeleton>`, `<SidebarSkeleton>`, and `<ChatSkeletonList>` line up shape-for-shape with Patterns 2, 3, 7, and 4 respectively. Use them in `loading.tsx` and Suspense fallbacks.

**Library leans:**
- `framer-motion` — Patterns 1, 2, 4, 5, 6, 8 (rail transitions, stat stagger, message entry, timeline stagger, palette open/close, notification panel). Every Framer-using pattern guards with `useReducedMotion()`.
- `@tanstack/react-table` v8 — Pattern 3 (sorting, pagination). `// VERIFY:` against current docs before shipping.
- shadcn/ui (optional) — Patterns 3, 4, 6 pair naturally with shadcn `<Dialog>`, `<DropdownMenu>`, and `<Command>` if you'd rather not roll your own focus management. The versions here are dependency-free.
- No `cmdk`, `react-countup`, or other helper libs — anything that animates or paginates is hand-built so you control the keyboard model and motion guards.

**Peer patterns:**
- `references/patterns/hero.md` — same voice and token discipline; pair Hero 1 or 3 with this dashboard for marketing-to-app continuity.
- `references/patterns/cta.md`, `pricing.md`, `features.md`, `testimonials.md` — marketing-side counterparts to this product surface.

**Accessibility checklist (every pattern in this file ships with):**
- `aria-current="page"` on active sidebar nav and the last breadcrumb
- `aria-modal="true"` + focus return on the command palette and mobile drawer
- `aria-live="polite"` on the chat thread, `aria-label="Agent is responding"` on streaming dots
- `aria-label` on the notification dot carrying the unread count, not visual-only
- `aria-sort` on sortable table headers
- `<nav aria-label="Primary">` and `<nav aria-label="Breadcrumb">`
- `prefers-reduced-motion` honored for both CSS animations (streaming dots) and JS-driven motion (count-up, Framer staggers)

---

> Built for Claude Code. AMOLED-first. Ship the demo.
