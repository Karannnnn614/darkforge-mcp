# Darkforge — Skeleton Loading System
Generate skeleton loading states that exactly match the real component's shape.
Always dark AMOLED. Always animated. Always TypeScript.

## Contents

- [Core Skeleton Primitives](#core-skeleton-primitives)
- [Skeleton Compositions](#skeleton-compositions)
  - [Blog Card Skeleton](#blog-card-skeleton)
  - [Dashboard Stat Card Skeleton](#dashboard-stat-card-skeleton)
  - [Profile Card Skeleton](#profile-card-skeleton)
  - [Table Skeleton](#table-skeleton)
  - [Chat Message Skeleton](#chat-message-skeleton)
  - [Sidebar Navigation Skeleton](#sidebar-navigation-skeleton)
- [Global CSS Animations (add to your CSS)](#global-css-animations-add-to-your-css)

---

## Core Skeleton Primitives

```tsx
// components/ui/skeleton.tsx
import { CSSProperties } from 'react'

interface SkeletonProps {
  width?: string | number
  height?: string | number
  borderRadius?: string
  className?: string
  style?: CSSProperties
  variant?: 'pulse' | 'shimmer'
}

const shimmerStyle: CSSProperties = {
  background: `linear-gradient(
    90deg,
    var(--df-skeleton-base) 0%,
    var(--df-skeleton-shine) 50%,
    var(--df-skeleton-base) 100%
  )`,
  backgroundSize: '200% 100%',
  animation: 'nx-shimmer 2s linear infinite',
}

const pulseStyle: CSSProperties = {
  background: 'var(--df-skeleton-base)',
  animation: 'nx-pulse 2s ease-in-out infinite',
}

export function Skeleton({ width, height, borderRadius, className, style, variant = 'shimmer' }: SkeletonProps) {
  return (
    <div
      className={className}
      style={{
        width: width ?? '100%',
        height: height ?? '16px',
        borderRadius: borderRadius ?? 'var(--df-radius-sm)',
        display: 'block',
        ...(variant === 'shimmer' ? shimmerStyle : pulseStyle),
        ...style,
      }}
      aria-hidden="true"
    />
  )
}

// Add to global CSS:
// @keyframes nx-shimmer { 0% { background-position: -200% 0 } 100% { background-position: 200% 0 } }
// @keyframes nx-pulse { 0%, 100% { opacity: 0.4 } 50% { opacity: 0.8 } }
```

---

## Skeleton Compositions

### Blog Card Skeleton
```tsx
export function BlogCardSkeleton() {
  return (
    <div style={{
      background: 'var(--df-bg-surface)',
      border: '1px solid var(--df-border-subtle)',
      borderRadius: 'var(--df-radius-lg)',
      padding: '20px',
      display: 'flex', flexDirection: 'column', gap: '12px',
    }} aria-label="Loading blog card">
      {/* Thumbnail */}
      <Skeleton height="180px" borderRadius="var(--df-radius-md)" />
      {/* Tags */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <Skeleton width="60px" height="22px" borderRadius="var(--df-radius-full)" />
        <Skeleton width="80px" height="22px" borderRadius="var(--df-radius-full)" />
      </div>
      {/* Title */}
      <Skeleton height="20px" width="90%" />
      <Skeleton height="20px" width="70%" />
      {/* Meta */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
        <Skeleton width="28px" height="28px" borderRadius="50%" />
        <Skeleton width="100px" height="13px" />
        <Skeleton width="60px" height="13px" style={{ marginLeft: 'auto' }} />
      </div>
    </div>
  )
}
```

### Dashboard Stat Card Skeleton
```tsx
export function StatCardSkeleton() {
  return (
    <div style={{
      background: 'var(--df-bg-elevated)',
      border: '1px solid var(--df-border-subtle)',
      borderRadius: 'var(--df-radius-lg)',
      padding: '20px',
    }} aria-label="Loading stat">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
        <Skeleton width="100px" height="13px" />
        <Skeleton width="32px" height="32px" borderRadius="var(--df-radius-md)" />
      </div>
      <Skeleton width="80px" height="32px" style={{ marginBottom: '8px' }} />
      <Skeleton width="120px" height="12px" />
    </div>
  )
}
```

### Profile Card Skeleton
```tsx
export function ProfileCardSkeleton() {
  return (
    <div style={{
      background: 'var(--df-bg-surface)',
      border: '1px solid var(--df-border-subtle)',
      borderRadius: 'var(--df-radius-lg)',
      padding: '24px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
    }} aria-label="Loading profile">
      <Skeleton width="72px" height="72px" borderRadius="50%" />
      <Skeleton width="120px" height="18px" />
      <Skeleton width="180px" height="13px" />
      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
        <Skeleton width="80px" height="32px" borderRadius="var(--df-radius-md)" />
        <Skeleton width="80px" height="32px" borderRadius="var(--df-radius-md)" />
      </div>
    </div>
  )
}
```

### Table Skeleton
```tsx
export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div style={{
      background: 'var(--df-bg-surface)',
      border: '1px solid var(--df-border-subtle)',
      borderRadius: 'var(--df-radius-lg)',
      overflow: 'hidden',
    }} aria-label="Loading table">
      {/* Header */}
      <div style={{
        display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: '16px', padding: '14px 16px',
        borderBottom: '1px solid var(--df-border-subtle)',
        background: 'var(--df-bg-elevated)',
      }}>
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} height="13px" width={i === 0 ? '60%' : '80%'} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div key={rowIdx} style={{
          display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: '16px', padding: '14px 16px',
          borderBottom: rowIdx < rows - 1 ? '1px solid var(--df-border-subtle)' : 'none',
        }}>
          {Array.from({ length: cols }).map((_, colIdx) => (
            <Skeleton
              key={colIdx}
              height="13px"
              width={`${Math.floor(50 + Math.random() * 40)}%`}
              variant={rowIdx % 2 === 0 ? 'shimmer' : 'pulse'}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
```

### Chat Message Skeleton
```tsx
export function ChatSkeletonList({ count = 4 }: { count?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px' }}>
      {Array.from({ length: count }).map((_, i) => {
        const isUser = i % 2 !== 0
        return (
          <div key={i} style={{
            display: 'flex', gap: '10px',
            flexDirection: isUser ? 'row-reverse' : 'row',
            alignItems: 'flex-end',
          }}>
            {!isUser && <Skeleton width="32px" height="32px" borderRadius="50%" style={{ flexShrink: 0 }} />}
            <div style={{
              display: 'flex', flexDirection: 'column', gap: '6px',
              alignItems: isUser ? 'flex-end' : 'flex-start',
              maxWidth: '60%',
            }}>
              <Skeleton height="40px" width={`${160 + i * 20}px`} borderRadius="12px" />
              {i % 3 === 0 && <Skeleton height="40px" width={`${100 + i * 15}px`} borderRadius="12px" />}
              <Skeleton width="60px" height="10px" />
            </div>
          </div>
        )
      })}
    </div>
  )
}
```

### Sidebar Navigation Skeleton
```tsx
export function SidebarSkeleton() {
  return (
    <div style={{
      width: '240px', height: '100vh',
      background: 'var(--df-bg-surface)',
      borderRight: '1px solid var(--df-border-subtle)',
      padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '8px',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
        <Skeleton width="32px" height="32px" borderRadius="var(--df-radius-md)" />
        <Skeleton width="100px" height="16px" />
      </div>
      {/* Nav items */}
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px' }}>
          <Skeleton width="18px" height="18px" borderRadius="var(--df-radius-sm)" />
          <Skeleton width={`${80 + i * 10}px`} height="13px" />
        </div>
      ))}
      {/* Bottom user */}
      <div style={{
        marginTop: 'auto',
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '12px 8px',
        borderTop: '1px solid var(--df-border-subtle)',
      }}>
        <Skeleton width="36px" height="36px" borderRadius="50%" />
        <div style={{ flex: 1 }}>
          <Skeleton width="90px" height="13px" style={{ marginBottom: '5px' }} />
          <Skeleton width="120px" height="11px" />
        </div>
      </div>
    </div>
  )
}
```

---

## Global CSS Animations (add to your CSS)

```css
@keyframes nx-shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position:  200% 0; }
}

@keyframes nx-pulse {
  0%, 100% { opacity: 0.4; }
  50%       { opacity: 0.75; }
}

/* Respect user's motion preferences */
@media (prefers-reduced-motion: reduce) {
  .nx-skeleton, [aria-label*="Loading"] * {
    animation: none !important;
    transition: none !important;
  }
}
```
