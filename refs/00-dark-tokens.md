# Darkforge — Dark Token System
The foundation of every component Darkforge generates.
Always inject these into `:root` when creating new stylesheets.

## Contents

- [CSS Custom Properties — Full System](#css-custom-properties-full-system)
- [Tailwind v4 Config Extension](#tailwind-v4-config-extension)
- [Glass Effect Utility Classes](#glass-effect-utility-classes)
- [10 Component Examples Using DF Tokens](#10-component-examples-using-df-tokens)
  - [1. Glass Card](#1-glass-card)
  - [2. Neon Button](#2-neon-button)
  - [3. Surface Card with Glow Border on Hover (Tailwind)](#3-surface-card-with-glow-border-on-hover-tailwind)
  - [4. Stat Badge](#4-stat-badge)
  - [5. Dark Input](#5-dark-input)
  - [6. Gradient Mesh Background](#6-gradient-mesh-background)
  - [7. Neon Tag / Badge](#7-neon-tag-badge)
  - [8. Dark Divider](#8-dark-divider)
  - [9. Avatar Stack](#9-avatar-stack)
  - [10. Dark Toast Notification](#10-dark-toast-notification)

---

## CSS Custom Properties — Full System

```css
/* ============================================
   DARKFORGE DARK TOKEN SYSTEM v1.0
   Inject into :root in your global CSS
   ============================================ */

:root {
  /* --- Backgrounds (AMOLED black scale) --- */
  --df-bg-base:       #000000;  /* true OLED black — page background */
  --df-bg-surface:    #080808;  /* cards, panels, containers */
  --df-bg-elevated:   #111111;  /* dropdowns, tooltips, popovers */
  --df-bg-overlay:    #1a1a1a;  /* modals, drawers, sheets */
  --df-bg-muted:      #222222;  /* disabled, placeholder areas */
  --df-bg-hover:      #2a2a2a;  /* hover state for interactive items */

  /* --- Neon Accents --- */
  --df-neon-violet:   #a78bfa;  /* primary — CTAs, active, focus */
  --df-neon-cyan:     #22d3ee;  /* secondary — links, info, data */
  --df-neon-pink:     #f472b6;  /* highlight — badges, notifications */
  --df-neon-green:    #4ade80;  /* success — online, confirmed */
  --df-neon-amber:    #fbbf24;  /* warning — pending, caution */
  --df-neon-red:      #f87171;  /* error — destructive, danger */

  /* --- Neon Glow Shadows (apply with box-shadow) --- */
  --df-glow-violet:   0 0 20px rgba(167, 139, 250, 0.35);
  --df-glow-violet-lg:0 0 40px rgba(167, 139, 250, 0.25);
  --df-glow-cyan:     0 0 20px rgba(34, 211, 238, 0.35);
  --df-glow-cyan-lg:  0 0 40px rgba(34, 211, 238, 0.25);
  --df-glow-pink:     0 0 20px rgba(244, 114, 182, 0.35);
  --df-glow-green:    0 0 20px rgba(74, 222, 128, 0.35);

  /* --- Glassmorphism --- */
  --df-glass-bg:      rgba(255, 255, 255, 0.04);
  --df-glass-bg-md:   rgba(255, 255, 255, 0.07);
  --df-glass-bg-lg:   rgba(255, 255, 255, 0.10);
  --df-glass-border:  rgba(255, 255, 255, 0.08);
  --df-glass-border-md: rgba(255, 255, 255, 0.12);

  /* --- Text --- */
  --df-text-primary:   #ffffff;
  --df-text-secondary: #a1a1aa;
  --df-text-muted:     #52525b;
  --df-text-inverse:   #000000;
  --df-text-accent:    #a78bfa;

  /* --- Borders --- */
  --df-border-subtle:  rgba(255, 255, 255, 0.05);
  --df-border-default: rgba(255, 255, 255, 0.09);
  --df-border-strong:  rgba(255, 255, 255, 0.16);
  --df-border-focus:   rgba(167, 139, 250, 0.5);

  /* --- Border Radius --- */
  --df-radius-xs:   4px;
  --df-radius-sm:   6px;
  --df-radius-md:   10px;
  --df-radius-lg:   16px;
  --df-radius-xl:   24px;
  --df-radius-2xl:  32px;
  --df-radius-full: 9999px;

  /* --- Spacing (8px base) --- */
  --df-space-1:  4px;
  --df-space-2:  8px;
  --df-space-3:  12px;
  --df-space-4:  16px;
  --df-space-5:  20px;
  --df-space-6:  24px;
  --df-space-8:  32px;
  --df-space-10: 40px;
  --df-space-12: 48px;
  --df-space-16: 64px;

  /* --- Layout (heights consumed by smooth-scroll padding) --- */
  --df-nav-h:    64px;   /* sticky nav height — used by scroll-padding-top */
  --df-section-y: 96px;  /* default top/bottom padding for full-width sections */

  /* --- Typography --- */
  --df-font-sans: 'Inter', 'Geist', system-ui, sans-serif;
  --df-font-mono: 'JetBrains Mono', 'Fira Code', monospace;
  --df-font-display: 'Cal Sans', 'Inter', sans-serif;

  /* --- Transitions --- */
  --df-ease-out:    cubic-bezier(0.16, 1, 0.3, 1);
  --df-ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --df-ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);
  --df-duration-fast:   150ms;
  --df-duration-base:   250ms;
  --df-duration-slow:   400ms;
  --df-duration-slower: 600ms;

  /* --- Skeleton --- */
  --df-skeleton-base:   #111111;
  --df-skeleton-shine:  #1e1e1e;
  --df-skeleton-glow:   rgba(167, 139, 250, 0.04);

  /* --- Z-index Scale --- */
  --df-z-base:    0;
  --df-z-raised:  10;
  --df-z-dropdown:100;
  --df-z-sticky:  200;
  --df-z-overlay: 300;
  --df-z-modal:   400;
  --df-z-toast:   500;
}

/* ============================================
   GLOBAL LAYOUT DEFAULTS
   Smooth scroll + anchor-aware scroll padding so
   in-page links don't slide under a sticky navbar.
   Honors prefers-reduced-motion.
   ============================================ */

html {
  scroll-behavior: smooth;
  scroll-padding-top: var(--df-nav-h, 4rem);
}

@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }
}

/* ============================================
   LIGHT THEME OVERRIDE (opt-in)
   Activate by setting [data-theme="light"] on <html>.
   Same token names — components flip automatically at runtime.
   Dark stays the default. See references/18-light-theme.md.
   ============================================ */

:root[data-theme="light"] {
  /* --- Backgrounds (white scale) --- */
  --df-bg-base:       #ffffff;
  --df-bg-surface:    #fafafa;
  --df-bg-elevated:   #f4f4f5;
  --df-bg-overlay:    #e4e4e7;
  --df-bg-muted:      #d4d4d8;
  --df-bg-hover:      #ececef;

  /* --- Neon Accents (hues unchanged — keep brand DNA) --- */
  /* No override needed: violet/cyan/pink/green/amber/red work on white too */

  /* --- Glow Shadows (alpha halved — softer on white surfaces) --- */
  --df-glow-violet:    0 0 20px rgba(167, 139, 250, 0.18);
  --df-glow-violet-lg: 0 0 40px rgba(167, 139, 250, 0.14);
  --df-glow-cyan:      0 0 20px rgba(34, 211, 238, 0.18);
  --df-glow-cyan-lg:   0 0 40px rgba(34, 211, 238, 0.14);
  --df-glow-pink:      0 0 20px rgba(244, 114, 182, 0.18);
  --df-glow-green:     0 0 20px rgba(74, 222, 128, 0.18);

  /* --- Glassmorphism (black-alpha tints on white) --- */
  --df-glass-bg:        rgba(0, 0, 0, 0.04);
  --df-glass-bg-md:     rgba(0, 0, 0, 0.06);
  --df-glass-bg-lg:     rgba(0, 0, 0, 0.08);
  --df-glass-border:    rgba(0, 0, 0, 0.08);
  --df-glass-border-md: rgba(0, 0, 0, 0.12);

  /* --- Text (zinc scale, deep but not pure black) --- */
  --df-text-primary:   #0a0a0a;
  --df-text-secondary: #52525b;
  --df-text-muted:     #a1a1aa;
  --df-text-inverse:   #ffffff;  /* flips: white text over violet bg passes AA */
  --df-text-accent:    #7c3aed;  /* violet-600 — deeper for AA on white */

  /* --- Borders (black-alpha mirrors dark's white-alpha) --- */
  --df-border-subtle:  rgba(0, 0, 0, 0.06);
  --df-border-default: rgba(0, 0, 0, 0.10);
  --df-border-strong:  rgba(0, 0, 0, 0.18);
  --df-border-focus:   rgba(167, 139, 250, 0.5);  /* accent unchanged */

  /* --- Skeleton (flipped so shimmer reads on white) --- */
  --df-skeleton-base:  #e4e4e7;
  --df-skeleton-shine: #f4f4f5;
  --df-skeleton-glow:  rgba(167, 139, 250, 0.06);

  /* Radii, spacing, typography, transitions, z-index unchanged across themes. */
}

/* Belt-and-suspenders: respect the OS preference if no explicit theme is set.
   Drop this block if you want strict dark-by-default regardless of OS. */
@media (prefers-color-scheme: light) {
  :root:not([data-theme]) {
    color-scheme: light;
  }
}
```

> **One namespace, two themes.** Components only ever reference `var(--df-bg-base)` etc. The same component renders dark by default and flips to light the moment `<html data-theme="light">` is set — no regenerate, no separate `--df-light-*` namespace. The pre-v1.1.1 `--df-light-*` tokens are deprecated; see `references/18-light-theme.md` for migration.

---

## Tailwind v4 Config Extension

```ts
// tailwind.config.ts
import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        nx: {
          base:      '#000000',
          surface:   '#080808',
          elevated:  '#111111',
          overlay:   '#1a1a1a',
          muted:     '#222222',
          violet:    '#a78bfa',
          cyan:      '#22d3ee',
          pink:      '#f472b6',
          green:     '#4ade80',
          amber:     '#fbbf24',
        }
      },
      boxShadow: {
        'glow-violet': '0 0 20px rgba(167,139,250,0.35)',
        'glow-cyan':   '0 0 20px rgba(34,211,238,0.35)',
        'glow-pink':   '0 0 20px rgba(244,114,182,0.35)',
        'glow-lg':     '0 0 60px rgba(167,139,250,0.15)',
      },
      backdropBlur: {
        xs: '4px',
        '2xl': '40px',
      },
      animation: {
        'shimmer':      'shimmer 2s linear infinite',
        'pulse-slow':   'pulse 3s ease-in-out infinite',
        'glow-pulse':   'glow-pulse 2s ease-in-out infinite',
        'float':        'float 3s ease-in-out infinite',
        'spin-slow':    'spin 8s linear infinite',
      },
      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%':      { opacity: '1',   transform: 'scale(1.05)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-8px)' },
        }
      }
    }
  }
} satisfies Config
```

---

## Glass Effect Utility Classes

```css
/* Paste into your global CSS after the :root tokens */

.nx-glass {
  background: var(--df-glass-bg);
  border: 1px solid var(--df-glass-border);
  backdrop-filter: blur(12px) saturate(180%);
  -webkit-backdrop-filter: blur(12px) saturate(180%);
}

.nx-glass-md {
  background: var(--df-glass-bg-md);
  border: 1px solid var(--df-glass-border-md);
  backdrop-filter: blur(20px) saturate(200%);
  -webkit-backdrop-filter: blur(20px) saturate(200%);
}

.nx-glass-lg {
  background: var(--df-glass-bg-lg);
  border: 1px solid var(--df-glass-border-md);
  backdrop-filter: blur(32px) saturate(220%);
  -webkit-backdrop-filter: blur(32px) saturate(220%);
}

/* Neon border glow on hover */
.nx-glow-border {
  border: 1px solid var(--df-border-default);
  transition: border-color var(--df-duration-base) var(--df-ease-out),
              box-shadow var(--df-duration-base) var(--df-ease-out);
}
.nx-glow-border:hover {
  border-color: rgba(167, 139, 250, 0.4);
  box-shadow: var(--df-glow-violet);
}

/* Shimmer gradient text */
.nx-text-shimmer {
  background: linear-gradient(
    90deg,
    var(--df-neon-violet),
    var(--df-neon-cyan),
    var(--df-neon-pink),
    var(--df-neon-violet)
  );
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: shimmer 4s linear infinite;
}

/* Skeleton pulse */
.nx-skeleton {
  background: var(--df-skeleton-base);
  border-radius: var(--df-radius-md);
  position: relative;
  overflow: hidden;
}
.nx-skeleton::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    var(--df-skeleton-shine) 50%,
    transparent 100%
  );
  background-size: 200% 100%;
  animation: shimmer 2s linear infinite;
}
```

---

## 10 Component Examples Using DF Tokens

### 1. Glass Card
```tsx
export function GlassCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: 'var(--df-glass-bg)',
        border: '1px solid var(--df-glass-border)',
        backdropFilter: 'blur(12px) saturate(180%)',
        borderRadius: 'var(--df-radius-lg)',
        padding: 'var(--df-space-6)',
        color: 'var(--df-text-primary)',
      }}
    >
      {children}
    </div>
  )
}
```

### 2. Neon Button
```tsx
export function NeonButton({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'var(--df-neon-violet)',
        color: 'var(--df-text-inverse)',
        border: 'none',
        borderRadius: 'var(--df-radius-md)',
        padding: '10px 20px',
        fontWeight: 500,
        cursor: 'pointer',
        boxShadow: 'var(--df-glow-violet)',
        transition: `transform var(--df-duration-fast) var(--df-ease-out),
                     box-shadow var(--df-duration-base) var(--df-ease-out)`,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-1px)'
        e.currentTarget.style.boxShadow = 'var(--df-glow-violet-lg)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'var(--df-glow-violet)'
      }}
    >
      {children}
    </button>
  )
}
```

### 3. Surface Card with Glow Border on Hover (Tailwind)
```tsx
export function SurfaceCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="
      bg-[var(--df-bg-surface)]
      border border-[var(--df-border-default)]
      rounded-[var(--df-radius-lg)]
      p-6
      transition-all duration-250
      hover:border-violet-400/40
      hover:shadow-[0_0_20px_rgba(167,139,250,0.25)]
      group
    ">
      <h3 className="text-[var(--df-text-primary)] font-medium mb-2">{title}</h3>
      <p className="text-[var(--df-text-secondary)] text-sm leading-relaxed">{description}</p>
    </div>
  )
}
```

### 4. Stat Badge
```tsx
interface StatBadgeProps {
  label: string
  value: string
  trend?: 'up' | 'down'
}

export function StatBadge({ label, value, trend }: StatBadgeProps) {
  return (
    <div style={{
      background: 'var(--df-bg-elevated)',
      border: '1px solid var(--df-border-subtle)',
      borderRadius: 'var(--df-radius-lg)',
      padding: '16px 20px',
    }}>
      <p style={{ color: 'var(--df-text-muted)', fontSize: '12px', margin: '0 0 4px' }}>{label}</p>
      <p style={{
        color: trend === 'up' ? 'var(--df-neon-green)' 
             : trend === 'down' ? 'var(--df-neon-red)' 
             : 'var(--df-text-primary)',
        fontSize: '24px',
        fontWeight: 600,
        margin: 0,
      }}>{value}</p>
    </div>
  )
}
```

### 5. Dark Input
```tsx
export function DarkInput({ placeholder, label }: { placeholder: string; label: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ color: 'var(--df-text-secondary)', fontSize: '13px', fontWeight: 500 }}>
        {label}
      </label>
      <input
        placeholder={placeholder}
        style={{
          background: 'var(--df-bg-elevated)',
          border: '1px solid var(--df-border-default)',
          borderRadius: 'var(--df-radius-md)',
          padding: '10px 14px',
          color: 'var(--df-text-primary)',
          fontSize: '14px',
          outline: 'none',
          transition: `border-color var(--df-duration-fast) var(--df-ease-out),
                       box-shadow var(--df-duration-fast) var(--df-ease-out)`,
        }}
        onFocus={e => {
          e.currentTarget.style.borderColor = 'var(--df-border-focus)'
          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(167,139,250,0.1)'
        }}
        onBlur={e => {
          e.currentTarget.style.borderColor = 'var(--df-border-default)'
          e.currentTarget.style.boxShadow = 'none'
        }}
      />
    </div>
  )
}
```

### 6. Gradient Mesh Background
```tsx
export function MeshBackground() {
  return (
    <div style={{ position: 'relative', background: 'var(--df-bg-base)', overflow: 'hidden' }}>
      {/* Neon orbs creating mesh effect */}
      <div style={{
        position: 'absolute', top: '-20%', left: '-10%',
        width: '500px', height: '500px',
        background: 'radial-gradient(circle, rgba(167,139,250,0.12) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-20%', right: '-10%',
        width: '600px', height: '600px',
        background: 'radial-gradient(circle, rgba(34,211,238,0.08) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />
    </div>
  )
}
```

### 7. Neon Tag / Badge
```tsx
type NeonColor = 'violet' | 'cyan' | 'pink' | 'green' | 'amber'

const colorMap: Record<NeonColor, { bg: string; color: string }> = {
  violet: { bg: 'rgba(167,139,250,0.1)', color: 'var(--df-neon-violet)' },
  cyan:   { bg: 'rgba(34,211,238,0.1)',  color: 'var(--df-neon-cyan)' },
  pink:   { bg: 'rgba(244,114,182,0.1)', color: 'var(--df-neon-pink)' },
  green:  { bg: 'rgba(74,222,128,0.1)',  color: 'var(--df-neon-green)' },
  amber:  { bg: 'rgba(251,191,36,0.1)',  color: 'var(--df-neon-amber)' },
}

export function NeonTag({ label, color = 'violet' }: { label: string; color?: NeonColor }) {
  const { bg, color: textColor } = colorMap[color]
  return (
    <span style={{
      background: bg, color: textColor,
      borderRadius: 'var(--df-radius-full)',
      padding: '3px 10px', fontSize: '11px', fontWeight: 500,
      border: `1px solid ${textColor}22`,
    }}>
      {label}
    </span>
  )
}
```

### 8. Dark Divider
```tsx
export function NxDivider({ label }: { label?: string }) {
  if (!label) return (
    <hr style={{ border: 'none', borderTop: '1px solid var(--df-border-subtle)', margin: '24px 0' }} />
  )
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '24px 0' }}>
      <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--df-border-subtle)' }} />
      <span style={{ color: 'var(--df-text-muted)', fontSize: '12px', whiteSpace: 'nowrap' }}>{label}</span>
      <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--df-border-subtle)' }} />
    </div>
  )
}
```

### 9. Avatar Stack
```tsx
interface Avatar { src: string; alt: string }
export function AvatarStack({ avatars, max = 4 }: { avatars: Avatar[]; max?: number }) {
  const visible = avatars.slice(0, max)
  const overflow = avatars.length - max
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {visible.map((av, i) => (
        <img key={i} src={av.src} alt={av.alt} style={{
          width: 32, height: 32, borderRadius: '50%',
          border: '2px solid var(--df-bg-base)',
          marginLeft: i === 0 ? 0 : -8, objectFit: 'cover',
          zIndex: visible.length - i,
        }} />
      ))}
      {overflow > 0 && (
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'var(--df-bg-elevated)',
          border: '2px solid var(--df-bg-base)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--df-text-secondary)', fontSize: '11px', fontWeight: 500,
          marginLeft: -8,
        }}>+{overflow}</div>
      )}
    </div>
  )
}
```

### 10. Dark Toast Notification
```tsx
interface ToastProps { message: string; type?: 'success' | 'error' | 'info' | 'warning' }

const toastColors = {
  success: 'var(--df-neon-green)',
  error:   'var(--df-neon-red)',
  info:    'var(--df-neon-cyan)',
  warning: 'var(--df-neon-amber)',
}

export function DarkToast({ message, type = 'info' }: ToastProps) {
  return (
    <div style={{
      background: 'var(--df-bg-elevated)',
      border: `1px solid var(--df-border-default)`,
      borderLeft: `3px solid ${toastColors[type]}`,
      borderRadius: 'var(--df-radius-md)',
      padding: '12px 16px',
      color: 'var(--df-text-primary)',
      fontSize: '14px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      backdropFilter: 'blur(12px)',
      maxWidth: '360px',
    }}>
      {message}
    </div>
  )
}
```
