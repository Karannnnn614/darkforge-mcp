---
name: 33-ldrs-loaders
description: LDRS — production-ready loading animations as Web Components. 40+ spinners, bars, dots. Companion to Darkforge's skeleton system. Use whenever user wants inline action-progress indicators (button loading, AI thinking states) beyond skeleton loaders.
---

# LDRS — Loading Animations

> **40+ production-ready loaders as Web Components.** Where Darkforge's skeleton system covers "page is loading, here's what's coming", LDRS covers "action in progress, button is disabled" or "small inline operation". Web Components angle is unique — one `<l-ring>` tag works in React, Vue, Svelte, plain HTML.

## Source-of-truth caveat

Generated from training-data recall (Jan 2026 cutoff). `context7` + `WebFetch` were denied at generation time. LDRS package name on npm is `ldrs`. v1.x is current. `// VERIFY:` markers flag prop signatures most likely to drift. Cross-check `https://uiball.com/ldrs` before shipping.

## Contents

- [Install / Setup](#install--setup)
- [Loader catalog (40+)](#loader-catalog-40)
- [Companion to skeletons](#companion-to-skeletons)
- [Worked examples](#worked-examples)
- [Accessibility notes](#accessibility-notes)
- [Reduced-motion handling](#reduced-motion-handling)
- [Pitfalls](#pitfalls)
- [Cross-references](#cross-references)

---

## Install / Setup

```bash
npm i ldrs
```

LDRS uses lazy registration — register only the loaders you actually use.

```tsx
// app/providers/LoadersProvider.tsx
'use client'
import { useEffect } from 'react'

export function LoadersProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // VERIFY: register signature stable in ldrs v1.x.
    Promise.all([
      import('ldrs').then(({ ring }) => ring.register()),
      import('ldrs').then(({ bouncy }) => bouncy.register()),
      import('ldrs').then(({ tailChase }) => tailChase.register()),
      import('ldrs').then(({ trefoil }) => trefoil.register()),
      import('ldrs').then(({ mirage }) => mirage.register()),
    ])
  }, [])
  return <>{children}</>
}
```

Mount once at the root of your app — Web Components are global.

## Loader catalog (40+)

| Tag | Vibe | Best use case |
|---|---|---|
| `<l-ring>` | Classic spinner | Buttons, generic action |
| `<l-ring-2>` | Dual-ring | Heavier operation |
| `<l-tail-chase>` | Tail chasing dots | Full-page initial load |
| `<l-bouncy>` | Bouncing dots | Inline feedback |
| `<l-trefoil>` | Three-leaf knot | AI thinking states |
| `<l-jelly-triangle>` | Squishy triangle | Upload progress |
| `<l-quantum>` | Geometric pulse | Compute-heavy ops |
| `<l-newtons-cradle>` | Pendulum | Queue states |
| `<l-mirage>` | Wave morph | AI streaming |
| `<l-pinwheel>` | Spinning blades | Refresh actions |
| `<l-zoomies>` | Fast lines | Quick operations |
| `<l-pulsar>` | Radial pulse | Notifications |
| `<l-ripples>` | Concentric rings | Background sync |
| `<l-grid>` | 9-cell grid | Loading dashboards |
| `<l-helix>` | Double helix | Bio/data themes |
| `<l-orbit>` | Orbiting dots | Astro/space themes |
| `<l-leapfrog>` | Hopping dots | Playful contexts |
| `<l-tail-spin>` | Tailed circle | Twitter-style |
| `<l-squircle>` | Morphing square | Modern feel |
| `<l-treadmill>` | Conveyor belt | Processing queue |
| `<l-momentum>` | Sliding bar | Linear progress |
| `<l-line-spinner>` | Single line | Minimal contexts |
| `<l-line-wobble>` | Wavy line | Audio/voice |
| `<l-cardio>` | Heart pulse | Health themes |
| `<l-square>` | Rotating square | Modern minimal |
| `<l-waveform>` | Audio bars | Audio/voice apps |
| `<l-bouncy-arc>` | Arc bounce | Playful loading |
| `<l-grid-pulse>` | Grid pulsing | Multi-cell load |
| `<l-bouncing-balls>` | 3 balls | Soft feedback |
| `<l-spiral>` | Spiral lines | Complex compute |
| `<l-jelly>` | Jelly blob | Squishy fun |
| `<l-clock-loader>` | Clock face | Time-based ops |
| `<l-dot-spinner>` | Dot ring | Polished default |
| `<l-dot-wave>` | Wave of dots | Streaming text |
| `<l-dot-pulse>` | Pulsing dot | Single-step wait |
| `<l-cardiograph>` | EKG line | Live monitoring |
| `<l-superballs>` | 3D balls | Fun animation |
| `<l-grid-cube>` | 3D cube grid | Heavy compute |
| `<l-fan>` | Spinning fan | Cooling/processing |
| `<l-jelly-quad>` | 4 jellies | Multi-stream |

## Companion to skeletons

Darkforge ships two complementary loading patterns:

| Use **skeletons** (`references/17-skeleton-system.md`) | Use **LDRS loaders** |
|---|---|
| Page is loading initial content | Button is disabled awaiting click result |
| Section is fetching async data | AI is thinking / streaming |
| Replacing layout shape (avatar, card, table) | Inline progress (upload, refresh, sync) |
| Large area | Small area (icon-sized) |

Use both together: skeleton for the surface, LDRS for an inline indicator within it.

## Worked examples

### 1. Button with `<l-ring>` action-in-progress

```tsx
'use client'
import { useState } from 'react'

export function SubmitButton() {
  const [loading, setLoading] = useState(false)
  return (
    <button
      onClick={() => {
        setLoading(true)
        setTimeout(() => setLoading(false), 1500)
      }}
      disabled={loading}
      aria-label="Submit campaign"
      style={{
        padding: '12px 24px',
        background: 'var(--df-neon-violet)',
        color: '#000',
        border: 0,
        borderRadius: 'var(--df-radius-md)',
        fontWeight: 600,
        cursor: loading ? 'wait' : 'pointer',
        boxShadow: 'var(--df-glow-violet)',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      {loading && (
        <span role="status" aria-label="Loading">
          {/* @ts-expect-error — Web Component custom element */}
          <l-ring size="14" stroke="2" speed="1.6" color="#000" />
        </span>
      )}
      {loading ? 'Submitting…' : 'Submit'}
    </button>
  )
}
```

### 2. Full-page `<l-tail-chase>` initial load

```tsx
'use client'

export function FullPageLoader() {
  return (
    <div
      role="status"
      aria-label="Loading application"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--df-bg-base)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        zIndex: 100,
      }}
    >
      {/* @ts-expect-error */}
      <l-tail-chase size="48" speed="1.6" color="var(--df-neon-violet)" />
      <p style={{ color: 'var(--df-text-secondary)' }}>Loading workspace…</p>
    </div>
  )
}
```

### 3. `<l-trefoil>` AI thinking state

```tsx
export function AgentThinking() {
  return (
    <div
      role="status"
      aria-label="Agent is thinking"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 14px',
        background: 'var(--df-glass-bg)',
        backdropFilter: 'blur(10px)',
        border: '1px solid var(--df-glass-border)',
        borderRadius: 'var(--df-radius-md)',
      }}
    >
      {/* @ts-expect-error */}
      <l-trefoil size="20" stroke="3" speed="1.4" color="var(--df-neon-violet)" />
      <span style={{ color: 'var(--df-text-secondary)', fontSize: 13 }}>Thinking…</span>
    </div>
  )
}
```

### 4. `<l-jelly-triangle>` upload progress

```tsx
export function UploadIndicator({ percent }: { percent: number }) {
  return (
    <div
      role="status"
      aria-label={`Uploading ${percent}% complete`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: 16,
        background: 'var(--df-bg-elev-1)',
        borderRadius: 'var(--df-radius-md)',
      }}
    >
      {/* @ts-expect-error */}
      <l-jelly-triangle size="32" speed="1.5" color="var(--df-neon-cyan)" />
      <div>
        <p style={{ color: 'var(--df-text-primary)', margin: 0 }}>Uploading…</p>
        <p style={{ color: 'var(--df-text-tertiary)', margin: 0, fontSize: 12 }}>{percent}%</p>
      </div>
    </div>
  )
}
```

### 5. `<l-mirage>` AI streaming state

```tsx
export function StreamingIndicator() {
  return (
    <span
      role="status"
      aria-label="Streaming response"
      style={{ display: 'inline-flex', verticalAlign: 'middle' }}
    >
      {/* @ts-expect-error */}
      <l-mirage size="60" speed="2.5" color="var(--df-neon-violet)" />
    </span>
  )
}
```

### 6. `<l-newtons-cradle>` queue state

```tsx
export function QueueIndicator({ position }: { position: number }) {
  return (
    <div
      role="status"
      aria-label={`Queued at position ${position}`}
      style={{ display: 'flex', alignItems: 'center', gap: 12 }}
    >
      {/* @ts-expect-error */}
      <l-newtons-cradle size="48" speed="1.4" color="var(--df-neon-amber)" />
      <span style={{ color: 'var(--df-text-secondary)' }}>Queued · #{position}</span>
    </div>
  )
}
```

### 7. DF neon palette matrix

```tsx
export function LoaderPaletteShowcase() {
  const items = [
    { color: 'var(--df-neon-violet)', label: 'Primary actions' },
    { color: 'var(--df-neon-cyan)', label: 'Info / sync' },
    { color: 'var(--df-neon-emerald)', label: 'Success / save' },
    { color: 'var(--df-neon-amber)', label: 'Pending / queue' },
  ]
  return (
    <div style={{ display: 'flex', gap: 32, padding: 32 }}>
      {items.map((item) => (
        <div key={item.label} style={{ textAlign: 'center' }}>
          <span role="status" aria-label={item.label}>
            {/* @ts-expect-error */}
            <l-ring size="32" stroke="3" speed="1.6" color={item.color} />
          </span>
          <p style={{ color: 'var(--df-text-tertiary)', fontSize: 12, marginTop: 8 }}>{item.label}</p>
        </div>
      ))}
    </div>
  )
}
```

### 8. Skeleton + LDRS combo

```tsx
export function CardLoadingSkeleton() {
  return (
    <div
      style={{
        position: 'relative',
        padding: 20,
        background: 'var(--df-bg-elev-1)',
        border: '1px solid var(--df-border-subtle)',
        borderRadius: 'var(--df-radius-lg)',
      }}
    >
      <div style={{ height: 16, width: '60%', background: 'var(--df-skeleton-base)', borderRadius: 4, marginBottom: 12 }} />
      <div style={{ height: 12, width: '90%', background: 'var(--df-skeleton-base)', borderRadius: 4, marginBottom: 8 }} />
      <div style={{ height: 12, width: '70%', background: 'var(--df-skeleton-base)', borderRadius: 4 }} />
      {/* Inline LDRS for "still loading" feedback */}
      <span
        role="status"
        aria-label="Loading content"
        style={{ position: 'absolute', top: 16, right: 16 }}
      >
        {/* @ts-expect-error */}
        <l-dot-pulse size="12" speed="1.3" color="var(--df-neon-violet)" />
      </span>
    </div>
  )
}
```

## Accessibility notes

Every LDRS loader needs an a11y wrapper:

```tsx
<span role="status" aria-label="Loading">
  <l-ring size="20" color="var(--df-neon-violet)" />
</span>
```

- `role="status"` — announces to screen readers as a live status region
- `aria-label` — describes what's loading (be specific: "Saving form" not "Loading")
- For long operations, also use `aria-live="polite"` on the parent for progress announcements
- Hide LDRS from screen readers with `aria-hidden="true"` when the surrounding text already announces state

## Reduced-motion handling

LDRS animations respect `prefers-reduced-motion: reduce` via CSS animation-play-state. Belt-and-suspenders override:

```css
@media (prefers-reduced-motion: reduce) {
  l-ring, l-bouncy, l-tail-chase, l-trefoil, l-mirage,
  l-jelly-triangle, l-quantum, l-newtons-cradle, l-pinwheel,
  l-zoomies, l-pulsar, l-dot-pulse, l-dot-wave {
    animation-play-state: paused !important;
  }
}
```

For full reduced-motion support, swap loaders with static "Loading…" text in your component layer when you detect the preference.

## Pitfalls

| Pitfall | Fix |
|---|---|
| `<l-ring>` renders blank | Forgot to `register()` — Web Components are opt-in per loader |
| Hydration mismatch in App Router | Register loaders inside `useEffect` in a client component, not at module level |
| TypeScript errors on JSX usage | Add `@ts-expect-error` comments OR augment JSX.IntrinsicElements with a global d.ts |
| `color="var(--df-*)"` not applied | Some loaders accept only hex — check the loader's specific docs; use `getComputedStyle` workaround if needed |
| Multiple loaders on page slow | Each Web Component runs its own animation loop; cap to 5-6 visible at once |
| Loader stays on screen forever | Check your loading state machine; LDRS itself has no timeout |

## Cross-references

- `references/00-dark-tokens.md` — DF color tokens used as `color=` props
- `references/17-skeleton-system.md` — companion: skeletons for shape, LDRS for inline progress
- `references/15-lottie.md` — alternative when you need brand-specific custom animations
- `references/01-framer-motion.md` — alternative for fully custom CSS animations
