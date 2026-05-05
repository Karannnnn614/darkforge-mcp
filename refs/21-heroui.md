---
name: 21-heroui
description: HeroUI (formerly NextUI) — dark-first React component library built on React Aria + Tailwind + Framer Motion. The closest direct brand match for Darkforge in the entire ecosystem. Use whenever the user has @heroui/react in their package.json or wants premium-feeling dark components with built-in accessibility.
---

# HeroUI — Darkforge Integration

> **HeroUI is dark-first by default — the closest direct brand match for Darkforge.** Built on React Aria for accessibility, Framer Motion for animation, Tailwind for styling. Was renamed from NextUI in late 2024.

## Source-of-truth caveat

Generated from training-data recall (Jan 2026 cutoff). `context7` + `WebFetch` were denied at generation time. HeroUI is the rebrand of NextUI — package name moved from `@nextui-org/react` → `@heroui/react`. `// VERIFY:` markers flag prop signatures most likely to drift between minor versions. Cross-check `https://heroui.com` before shipping.

## Contents

- [Install / Setup](#install--setup)
- [HeroUIProvider with DF token override](#herouiprovider-with-df-token-override)
- [DF → HeroUI semantic mapping](#nx--heroui-semantic-mapping)
- [Worked examples](#worked-examples)
- [React Aria a11y notes](#react-aria-a11y-notes)
- [Pitfalls](#pitfalls)
- [Cross-references](#cross-references)

---

## Install / Setup

```bash
npm i @heroui/react framer-motion
# or
pnpm add @heroui/react framer-motion
```

```ts
// VERIFY: package was renamed late 2024. Old code may import from @nextui-org/react.
// The component API is largely unchanged but theme tokens were renamed.
import { HeroUIProvider } from '@heroui/react'
```

```tsx
// app/layout.tsx
import { HeroUIProvider } from '@heroui/react'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body
        style={{
          background: 'var(--df-bg-base)',
          color: 'var(--df-text-primary)',
        }}
      >
        <HeroUIProvider>{children}</HeroUIProvider>
      </body>
    </html>
  )
}
```

`<HeroUIProvider>` MUST wrap your app at the root for components to receive theme context.

## HeroUIProvider with DF token override

The integration point: replace HeroUI's default dark palette with DF neon. Add the `heroui()` plugin to your Tailwind config and pass DF color overrides.

```ts
// tailwind.config.ts
import { heroui } from '@heroui/react'

export default {
  content: [
    './app/**/*.{ts,tsx}',
    './node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  plugins: [
    heroui({
      themes: {
        dark: {
          colors: {
            // VERIFY: heroui v2.x semantic colors. Older versions used `primaryColor`.
            background: 'var(--df-bg-base)',
            foreground: 'var(--df-text-primary)',
            primary: {
              DEFAULT: 'var(--df-neon-violet)',
              foreground: '#000',
            },
            secondary: {
              DEFAULT: 'var(--df-neon-cyan)',
              foreground: '#000',
            },
            success: { DEFAULT: 'var(--df-neon-emerald)', foreground: '#000' },
            warning: { DEFAULT: 'var(--df-neon-amber)', foreground: '#000' },
            danger: { DEFAULT: 'var(--df-neon-rose)', foreground: '#000' },
            content1: 'var(--df-bg-elev-1)',
            content2: 'var(--df-bg-elev-2)',
            content3: 'var(--df-glass-bg)',
            divider: 'var(--df-border-subtle)',
            focus: 'var(--df-neon-violet)',
          },
          layout: {
            radius: {
              small: 'var(--df-radius-sm)',
              medium: 'var(--df-radius-md)',
              large: 'var(--df-radius-lg)',
            },
          },
        },
      },
    }),
  ],
}
```

## DF → HeroUI semantic mapping

| DF token | HeroUI slot |
|---|---|
| `var(--df-bg-base)` | `background` |
| `var(--df-bg-elev-1)` | `content1` |
| `var(--df-bg-elev-2)` | `content2` |
| `var(--df-glass-bg)` | `content3` |
| `var(--df-text-primary)` | `foreground` |
| `var(--df-neon-violet)` | `primary.DEFAULT`, `focus` |
| `var(--df-neon-cyan)` | `secondary.DEFAULT` |
| `var(--df-neon-emerald)` | `success.DEFAULT` |
| `var(--df-neon-amber)` | `warning.DEFAULT` |
| `var(--df-neon-rose)` | `danger.DEFAULT` |
| `var(--df-border-subtle)` | `divider` |

After this mapping, every HeroUI component automatically uses DF colors — no per-component overrides needed.

## Worked examples

### 1. Button with violet glow

```tsx
'use client'
import { Button } from '@heroui/react'
import { motion, useReducedMotion } from 'framer-motion'

export function PrimaryCTA() {
  const reduced = useReducedMotion()
  return (
    <motion.div
      whileHover={reduced ? undefined : { scale: 1.02 }}
      whileTap={reduced ? undefined : { scale: 0.98 }}
    >
      <Button
        color="primary"
        size="lg"
        radius="md"
        aria-label="Get started with Darkforge"
        style={{ boxShadow: 'var(--df-glow-violet)' }}
      >
        Get started
      </Button>
    </motion.div>
  )
}
```

### 2. Input with focus ring

```tsx
'use client'
import { Input } from '@heroui/react'

export function EmailInput() {
  return (
    <Input
      type="email"
      label="Email"
      labelPlacement="outside"
      placeholder="you@example.com"
      variant="bordered"
      // VERIFY: classNames slots are stable since heroui v2.0.
      classNames={{
        input: 'bg-[var(--df-bg-elev-1)] text-[var(--df-text-primary)]',
        inputWrapper:
          'bg-[var(--df-bg-elev-1)] border-[var(--df-border-default)] data-[hover=true]:border-[var(--df-border-strong)] data-[focus=true]:border-[var(--df-neon-violet)]',
        label: 'text-[var(--df-text-secondary)]',
      }}
    />
  )
}
```

### 3. Modal with blur backdrop

```tsx
'use client'
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, useDisclosure } from '@heroui/react'

export function ConfirmDialog() {
  const { isOpen, onOpen, onOpenChange } = useDisclosure()
  return (
    <>
      <Button color="primary" onPress={onOpen}>Open</Button>
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        backdrop="blur"
        classNames={{
          base: 'bg-[var(--df-bg-elev-2)] border border-[var(--df-glass-border)]',
          header: 'border-b border-[var(--df-border-subtle)]',
          footer: 'border-t border-[var(--df-border-subtle)]',
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader style={{ color: 'var(--df-text-primary)' }}>Confirm action</ModalHeader>
              <ModalBody style={{ color: 'var(--df-text-secondary)' }}>
                This will permanently archive 12 campaigns. You can restore within 30 days.
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>Cancel</Button>
                <Button color="danger" onPress={onClose}>Archive</Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  )
}
```

### 4. Card with hover lift

```tsx
'use client'
import { Card, CardBody, CardHeader } from '@heroui/react'
import { motion, useReducedMotion } from 'framer-motion'

export function PricingTier() {
  const reduced = useReducedMotion()
  return (
    <motion.div whileHover={reduced ? undefined : { y: -4 }} transition={{ duration: 0.3 }}>
      <Card
        classNames={{
          base: 'bg-[var(--df-glass-bg)] backdrop-blur-md border border-[var(--df-glass-border)] hover:border-[var(--df-neon-violet)]',
          header: 'border-b border-[var(--df-border-subtle)]',
        }}
      >
        <CardHeader className="flex flex-col items-start gap-1">
          <p className="text-sm uppercase tracking-wider" style={{ color: 'var(--df-neon-violet)' }}>Pro</p>
          <h3 className="text-3xl font-semibold" style={{ color: 'var(--df-text-primary)' }}>$49<span className="text-base font-normal" style={{ color: 'var(--df-text-tertiary)' }}>/mo</span></h3>
        </CardHeader>
        <CardBody>
          <ul className="space-y-2" style={{ color: 'var(--df-text-secondary)' }}>
            <li>Unlimited campaigns</li>
            <li>AI agent included</li>
            <li>Priority support</li>
          </ul>
        </CardBody>
      </Card>
    </motion.div>
  )
}
```

### 5. Dropdown menu

```tsx
'use client'
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Button } from '@heroui/react'

export function AccountMenu() {
  return (
    <Dropdown>
      <DropdownTrigger>
        <Button
          variant="bordered"
          aria-label="Open account menu"
          style={{
            background: 'var(--df-glass-bg)',
            borderColor: 'var(--df-glass-border)',
            color: 'var(--df-text-primary)',
          }}
        >
          Account ▾
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        aria-label="Account actions"
        classNames={{
          base: 'bg-[var(--df-bg-elev-2)] border border-[var(--df-glass-border)]',
        }}
      >
        <DropdownItem key="profile" textValue="Profile">Profile</DropdownItem>
        <DropdownItem key="settings" textValue="Settings">Settings</DropdownItem>
        <DropdownItem key="logout" textValue="Sign out" color="danger" className="text-[var(--df-neon-rose)]">
          Sign out
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  )
}
```

### 6. Tabs with animated indicator

```tsx
'use client'
import { Tabs, Tab } from '@heroui/react'

export function ProductTabs() {
  return (
    <Tabs
      aria-label="Product tabs"
      color="primary"
      variant="underlined"
      classNames={{
        tabList: 'border-b border-[var(--df-border-subtle)]',
        tab: 'text-[var(--df-text-secondary)] data-[selected=true]:text-[var(--df-text-primary)]',
        cursor: 'bg-[var(--df-neon-violet)]',
      }}
    >
      <Tab key="overview" title="Overview">
        <p style={{ color: 'var(--df-text-secondary)', padding: 16 }}>Campaign overview content.</p>
      </Tab>
      <Tab key="analytics" title="Analytics">
        <p style={{ color: 'var(--df-text-secondary)', padding: 16 }}>Analytics content.</p>
      </Tab>
      <Tab key="settings" title="Settings">
        <p style={{ color: 'var(--df-text-secondary)', padding: 16 }}>Settings content.</p>
      </Tab>
    </Tabs>
  )
}
```

### 7. Tooltip

```tsx
'use client'
import { Tooltip, Button } from '@heroui/react'

export function HelpTip() {
  return (
    <Tooltip
      content="This action is irreversible"
      placement="top"
      classNames={{
        content: 'bg-[var(--df-bg-elev-2)] text-[var(--df-text-primary)] border border-[var(--df-glass-border)]',
      }}
    >
      <Button variant="ghost" size="sm" aria-label="Delete with confirmation">Delete</Button>
    </Tooltip>
  )
}
```

### 8. Pagination

```tsx
'use client'
import { Pagination } from '@heroui/react'

export function ResultsPagination() {
  return (
    <Pagination
      total={12}
      initialPage={1}
      color="primary"
      showShadow
      classNames={{
        item: 'bg-[var(--df-glass-bg)] text-[var(--df-text-secondary)]',
        cursor: 'bg-[var(--df-neon-violet)] text-black shadow-[var(--df-glow-violet)]',
      }}
    />
  )
}
```

## React Aria a11y notes

HeroUI builds on **React Aria** (Adobe's a11y primitives library). You get for free:

- Full keyboard navigation on every interactive component (`Tab`, `Shift+Tab`, arrow keys, `Enter`, `Space`, `Esc`)
- Focus management in modals (trap + restore)
- Screen reader announcements via `aria-live` regions
- High-contrast mode support
- RTL direction support

**Do not strip `aria-*` attributes** from HeroUI components even if they look redundant — many are React Aria internals that other a11y tools rely on.

## Pitfalls

| Pitfall | Fix |
|---|---|
| Components render unstyled | `<HeroUIProvider>` not wrapping the app, or Tailwind config missing `@heroui/theme` content path |
| `bg-[var(--df-*)]` not applied | Tailwind arbitrary-value mode requires Tailwind ≥ v3.0; check version |
| Theme overrides ignored | The `heroui()` plugin must be in `tailwind.config.ts`, not `tailwind.config.js` if using ESM |
| Old NextUI imports break | Search-and-replace `@nextui-org/react` → `@heroui/react`; some prop names changed (`color="primary"` is unchanged) |
| Modal scroll-lock fights body content | HeroUI handles this; don't add your own `overflow: hidden` on body |
| Keyboard focus invisible | Ensure `focus-visible` ring is enabled — check global CSS isn't overriding |

## Cross-references

- `references/00-dark-tokens.md` — DF token system used throughout the integration
- `references/08-shadcn-dark.md` — alternative dark component lib (shadcn is primitive-level; HeroUI is finished components)
- `references/01-framer-motion.md` — HeroUI's animation peer dep
- `references/12-tailwind-v4.md` — Tailwind config notes
- `references/18-light-theme.md` — runtime-flippable light theme via `[data-theme="light"]`; HeroUI components consume `var(--df-*)` and flip without rewrites
