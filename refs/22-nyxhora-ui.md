---
name: 22-nyxhora-ui
description: Nyxhora UI — startup-grade SaaS dashboard primitives built on shadcn. Tables, sidebars, stat cards, command palettes, settings shells. Use for CRMs, admin panels, analytics dashboards. Bridges directly to references/08-shadcn-dark.md primitives.
---

# Nyxhora UI — Darkforge Integration

> **Startup-grade SaaS dashboard library.** Shadcn-compatible. Where shadcn gives you primitives (Button, Card), Nyxhora gives you the *composed* dashboard surfaces — DataTable, Sidebar, StatGroup, CommandPalette. Use when the brief is "ship a dashboard / CRM / admin panel."

## Source-of-truth caveat

Generated from training-data recall (Jan 2026 cutoff). `context7` + `WebFetch` were denied at generation time. Nyxhora is a younger ecosystem than shadcn — component surface area and naming are most likely to drift. `// VERIFY:` markers flag every prop signature where uncertainty is meaningful. Cross-check `https://nyxhora.com/docs` before shipping any compound component.

## Contents

- [When to reach for Nyxhora](#when-to-reach-for-nyxhora)
- [Install / Setup](#install--setup)
- [DF → Nyxhora token bridge](#nx--nyxhora-token-bridge)
- [Worked examples](#worked-examples)
- [Pairing with shadcn primitives](#pairing-with-shadcn-primitives)
- [Pitfalls](#pitfalls)
- [Cross-references](#cross-references)

---

## When to reach for Nyxhora

| Brief | Pick |
|---|---|
| "Ship a CRM dashboard" | Nyxhora — full shells, sidebars, tables, command palettes |
| "Build a marketing landing page" | Skip — use Aceternity / MagicUI / shadcn |
| "I need a single Button component" | shadcn primitive — `references/08-shadcn-dark.md` |
| "Settings page with sectioned forms" | Nyxhora `SettingsShell` patterns below |
| "Data-heavy admin with sortable tables" | Nyxhora `DataTable` + shadcn `Table` primitive |

Nyxhora sits **on top of** shadcn, never replacing it. If a primitive exists in shadcn, prefer it; reach for Nyxhora when the surface is composed (sidebar+main, multi-pane, complex empty states).

## Install / Setup

```bash
# VERIFY: actual npm package name. Earlier docs referenced @nyxhora/ui;
# some forks ship as nyxhora-ui. Confirm against npmjs.com before installing.
npm i @nyxhora/ui
```

Assumes shadcn is already wired. If not, follow `references/08-shadcn-dark.md` first.

```ts
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    // VERIFY: package path that emits the Tailwind classes Nyxhora ships.
    './node_modules/@nyxhora/ui/dist/**/*.{js,mjs}',
  ],
  theme: {
    extend: {
      colors: {
        // Bridge so Nyxhora's `bg-surface` / `bg-elevated` emit DF tokens.
        surface: 'var(--df-bg-base)',
        elevated: 'var(--df-bg-elev-1)',
        accent: 'var(--df-neon-violet)',
        muted: 'var(--df-text-tertiary)',
      },
    },
  },
}

export default config
```

## DF → Nyxhora token bridge

```css
/* app/globals.css */
:root {
  --df-bg-base: #000000;
  --df-bg-elev-1: #0a0a0a;
  --df-bg-elev-2: #141414;
  --df-text-primary: #f4f4f5;
  --df-text-secondary: #a1a1aa;
  --df-text-tertiary: #71717a;
  --df-neon-violet: #a78bfa;
  --df-neon-cyan: #67e8f9;
  --df-border-subtle: rgba(255, 255, 255, 0.08);
  --df-glass-bg: rgba(20, 20, 20, 0.6);
  --df-glass-border: rgba(255, 255, 255, 0.06);
  --df-radius-md: 10px;
  --df-radius-lg: 14px;
  --df-glow-violet: 0 0 24px rgba(167, 139, 250, 0.3);
}

/* Map Nyxhora's expected vars to DF tokens. */
:root {
  --nyx-surface: var(--df-bg-base);
  --nyx-surface-elevated: var(--df-bg-elev-1);
  --nyx-surface-overlay: var(--df-glass-bg);
  --nyx-text: var(--df-text-primary);
  --nyx-text-muted: var(--df-text-secondary);
  --nyx-text-faint: var(--df-text-tertiary);
  --nyx-accent: var(--df-neon-violet);
  --nyx-border: var(--df-border-subtle);
  --nyx-radius: var(--df-radius-lg);
}
```

## Worked examples

### 1. Dashboard shell with sidebar

```tsx
'use client'
import { Sidebar, SidebarItem, SidebarSection, AppShell } from '@nyxhora/ui'
import { Home, Users, BarChart3, Settings } from 'lucide-react'

export function AppDashboard({ children }: { children: React.ReactNode }) {
  return (
    <AppShell
      style={{ background: 'var(--df-bg-base)', color: 'var(--df-text-primary)', minHeight: '100vh' }}
    >
      <Sidebar
        // VERIFY: Sidebar prop names — earlier alphas used `compact` not `collapsible`.
        collapsible
        style={{
          background: 'var(--df-bg-elev-1)',
          borderRight: '1px solid var(--df-border-subtle)',
        }}
      >
        <SidebarSection label="Workspace">
          <SidebarItem icon={<Home size={16} />} href="/" active>
            Home
          </SidebarItem>
          <SidebarItem icon={<Users size={16} />} href="/customers">
            Customers
          </SidebarItem>
          <SidebarItem icon={<BarChart3 size={16} />} href="/analytics">
            Analytics
          </SidebarItem>
        </SidebarSection>
        <SidebarSection label="Account">
          <SidebarItem icon={<Settings size={16} />} href="/settings">
            Settings
          </SidebarItem>
        </SidebarSection>
      </Sidebar>
      <main style={{ padding: 32, background: 'var(--df-bg-base)' }}>{children}</main>
    </AppShell>
  )
}
```

### 2. Stat group at the top of a dashboard

```tsx
import { StatCard, StatGroup } from '@nyxhora/ui'

const STATS = [
  { label: 'MRR', value: '$184,290', delta: '+12.4%', positive: true },
  { label: 'Active users', value: '12,492', delta: '+3.1%', positive: true },
  { label: 'Churn', value: '2.4%', delta: '-0.6%', positive: true },
  { label: 'Open tickets', value: '38', delta: '+8', positive: false },
]

export function DashboardStats() {
  return (
    <StatGroup style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
      {STATS.map((s) => (
        <StatCard
          key={s.label}
          label={s.label}
          value={s.value}
          delta={s.delta}
          tone={s.positive ? 'positive' : 'negative'}
          style={{
            background: 'var(--df-glass-bg)',
            border: '1px solid var(--df-glass-border)',
            borderRadius: 'var(--df-radius-lg)',
            backdropFilter: 'blur(10px)',
          }}
        />
      ))}
    </StatGroup>
  )
}
```

### 3. DataTable with DF accent

```tsx
'use client'
import { DataTable } from '@nyxhora/ui'

type Customer = { id: string; name: string; mrr: number; status: 'active' | 'churned' }

const ROWS: Customer[] = [
  { id: '1', name: 'Acme', mrr: 1200, status: 'active' },
  { id: '2', name: 'Globex', mrr: 800, status: 'active' },
  { id: '3', name: 'Initech', mrr: 0, status: 'churned' },
]

export function CustomersTable() {
  return (
    <DataTable<Customer>
      data={ROWS}
      // VERIFY: column shape — alpha used `id`, beta switched to `key`.
      columns={[
        { key: 'name', header: 'Customer' },
        {
          key: 'mrr',
          header: 'MRR',
          render: (row) => (
            <span style={{ color: 'var(--df-neon-violet)', fontWeight: 600 }}>
              ${row.mrr.toLocaleString()}
            </span>
          ),
        },
        {
          key: 'status',
          header: 'Status',
          render: (row) => (
            <span
              style={{
                padding: '2px 8px',
                borderRadius: 999,
                fontSize: 12,
                background:
                  row.status === 'active'
                    ? 'rgba(103, 232, 249, 0.12)'
                    : 'rgba(255, 255, 255, 0.04)',
                color: row.status === 'active' ? 'var(--df-neon-cyan)' : 'var(--df-text-tertiary)',
              }}
            >
              {row.status}
            </span>
          ),
        },
      ]}
      style={{
        background: 'var(--df-bg-elev-1)',
        border: '1px solid var(--df-border-subtle)',
        borderRadius: 'var(--df-radius-lg)',
      }}
    />
  )
}
```

### 4. Command palette (Cmd+K)

```tsx
'use client'
import { CommandPalette, CommandItem } from '@nyxhora/ui'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Home, Users, Settings } from 'lucide-react'

export function GlobalCommandPalette() {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <CommandPalette
      open={open}
      onOpenChange={setOpen}
      placeholder="Search or jump to…"
      style={{
        background: 'var(--df-glass-bg)',
        border: '1px solid var(--df-glass-border)',
        borderRadius: 'var(--df-radius-lg)',
        backdropFilter: 'blur(20px)',
        boxShadow: 'var(--df-glow-violet)',
      }}
    >
      <CommandItem icon={<Home size={16} />} onSelect={() => router.push('/')}>
        Go to Home
      </CommandItem>
      <CommandItem icon={<Users size={16} />} onSelect={() => router.push('/customers')}>
        Go to Customers
      </CommandItem>
      <CommandItem icon={<Settings size={16} />} onSelect={() => router.push('/settings')}>
        Open Settings
      </CommandItem>
    </CommandPalette>
  )
}
```

### 5. Settings shell with sectioned forms

```tsx
import { SettingsShell, SettingsSection, SettingsRow } from '@nyxhora/ui'
import { Input } from '@/components/ui/input' // shadcn primitive

export function SettingsPage() {
  return (
    <SettingsShell
      style={{ background: 'var(--df-bg-base)', color: 'var(--df-text-primary)' }}
    >
      <SettingsSection
        title="Profile"
        description="Public information about your workspace."
        style={{
          background: 'var(--df-bg-elev-1)',
          border: '1px solid var(--df-border-subtle)',
          borderRadius: 'var(--df-radius-lg)',
          padding: 24,
        }}
      >
        <SettingsRow label="Workspace name" htmlFor="ws-name">
          <Input id="ws-name" defaultValue="Acme" />
        </SettingsRow>
        <SettingsRow label="Slug" htmlFor="ws-slug" hint="Used in your public URL">
          <Input id="ws-slug" defaultValue="acme" />
        </SettingsRow>
      </SettingsSection>
    </SettingsShell>
  )
}
```

### 6. Empty state

```tsx
import { EmptyState } from '@nyxhora/ui'
import { Button } from '@/components/ui/button' // shadcn

export function EmptyCustomers() {
  return (
    <EmptyState
      title="No customers yet"
      description="Once you connect your CRM, customers will show up here."
      style={{
        padding: 64,
        background: 'var(--df-glass-bg)',
        border: '1px dashed var(--df-border-subtle)',
        borderRadius: 'var(--df-radius-lg)',
        textAlign: 'center',
      }}
    >
      <Button
        style={{
          background: 'var(--df-neon-violet)',
          color: '#000',
          boxShadow: 'var(--df-glow-violet)',
        }}
      >
        Connect a CRM
      </Button>
    </EmptyState>
  )
}
```

## Pairing with shadcn primitives

Nyxhora and shadcn share the same Radix-based foundation. Patterns that work well:

- **Forms**: Nyxhora `SettingsRow` for layout + shadcn `Input` / `Select` / `Switch` for the controls.
- **Tables**: Nyxhora `DataTable` for the shell + shadcn `Table` primitive parts (`TableHead`, `TableRow`) when you need full control.
- **Dialogs**: shadcn `Dialog` is more tweakable; Nyxhora `CommandPalette` is the right choice when you want fuzzy search wired in.

Cross-reference `references/08-shadcn-dark.md` whenever you need a primitive — never reach for a Nyxhora wrapper if shadcn already covers it.

## Pitfalls

| Pitfall | Fix |
|---|---|
| Nyxhora ships its own dark theme that fights DF tokens | Set `data-theme="nx"` on `<html>` and rely on the bridge above; do not import Nyxhora's default theme CSS |
| `Sidebar` flickers on hydration | Wrap the shell in a `'use client'` component; SSR-render with the collapsed state to avoid layout shift |
| `DataTable` row keys collide with React key warnings | Always pass `getRowId={(r) => r.id}` — column key alone is not enough |
| Command palette ignores `prefers-reduced-motion` | Pass `transition={false}` (`// VERIFY:`) when reduced-motion is detected |
| Mobile sidebar overlaps content | Use `<Sidebar collapsible>` and pair with a `<Drawer>` from shadcn at <768px |

## Cross-references

- `references/08-shadcn-dark.md` — primitives layer underneath everything Nyxhora ships
- `references/00-dark-tokens.md` — DF tokens consumed via the bridge
- `references/12-tailwind-v4.md` — Tailwind config that wires Nyxhora classes to DF vars
- `references/17-skeleton-system.md` — pair empty/loading states with DF skeletons
- `references/patterns/dashboard-shell.md` — broader composition recipes
