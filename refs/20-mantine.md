---
name: 20-mantine
description: Mantine — 120+ component React library with 50+ hooks. Highest component count of any lib Darkforge covers. Use when @mantine/core is in package.json or user wants feature-rich apps with notifications, modals, dates, forms, and rich inputs out of the box.
---

# Mantine — Darkforge Integration

> **120+ components, 50+ hooks, full TypeScript.** The largest component library Darkforge covers by component count. Built-in notification system, modals, rich inputs (DatePicker, RichText, etc.), and a powerful theme override system.

## Source-of-truth caveat

Generated from training-data recall (Jan 2026 cutoff). `context7` + `WebFetch` were denied at generation time. Mantine v7 (released late 2023) was a major rewrite — moved from Emotion to CSS Modules. `// VERIFY:` markers flag API surfaces likely to drift between minor versions. Cross-check `https://mantine.dev` before shipping.

## Contents

- [Install / Setup](#install--setup)
- [MantineProvider with DF token bridging](#mantineprovider-with-df-token-bridging)
- [DF → Mantine prop mapping](#nx--mantine-prop-mapping)
- [Worked examples](#worked-examples)
- [Hooks recipes](#hooks-recipes)
- [Pitfalls](#pitfalls)
- [Cross-references](#cross-references)

---

## Install / Setup

```bash
npm i @mantine/core @mantine/hooks @mantine/notifications @mantine/modals @mantine/dates @mantine/form
# Peer deps:
npm i react react-dom dayjs
```

```tsx
// app/layout.tsx
import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'
import '@mantine/dates/styles.css'
import { MantineProvider, ColorSchemeScript } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { ModalsProvider } from '@mantine/modals'
import { theme } from './mantine-theme'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-mantine-color-scheme="dark">
      <head>
        <ColorSchemeScript defaultColorScheme="dark" />
      </head>
      <body
        style={{
          background: 'var(--df-bg-base)',
          color: 'var(--df-text-primary)',
        }}
      >
        <MantineProvider theme={theme} defaultColorScheme="dark">
          <Notifications position="top-right" zIndex={2000} />
          <ModalsProvider>{children}</ModalsProvider>
        </MantineProvider>
      </body>
    </html>
  )
}
```

## MantineProvider with DF token bridging

Mantine's theme expects color tuples of 10 shades. Bridge each DF neon to a 10-step ramp by interpolating from a dark base to the neon hex.

```ts
// app/mantine-theme.ts
import { createTheme, type MantineColorsTuple } from '@mantine/core'

// VERIFY: Mantine v7 colors must be exactly 10 shades. Older versions allowed shorter tuples.
const nxViolet: MantineColorsTuple = [
  '#1a0d2e', '#2c1854', '#3e236b', '#5a3a8c', '#7858b4',
  '#a78bfa', '#b9a4fb', '#cbbdfd', '#dccffe', '#ede0ff',
]

const nxCyan: MantineColorsTuple = [
  '#062a30', '#0a4853', '#0e6577', '#138497', '#1ba3b8',
  '#22d3ee', '#5cdcf2', '#8ee5f5', '#beedf8', '#dff6fc',
]

const nxEmerald: MantineColorsTuple = [
  '#062a17', '#0a4828', '#0e6539', '#138550', '#1ca468',
  '#4ade80', '#76e49a', '#9eedb4', '#c4f4cd', '#e3fae6',
]

const nxAmber: MantineColorsTuple = [
  '#2a1f06', '#48360a', '#654c0e', '#856613', '#b3881b',
  '#fbbf24', '#fbcc54', '#fcd884', '#fde5ad', '#fef2d6',
]

const nxRose: MantineColorsTuple = [
  '#2a0d0d', '#4a1717', '#6a2222', '#8d2e2e', '#b53b3b',
  '#f87171', '#fa9595', '#fcb6b6', '#fdd5d5', '#feebeb',
]

export const theme = createTheme({
  primaryColor: 'nxViolet',
  primaryShade: 5,
  defaultRadius: 'md',
  colors: {
    nxViolet, nxCyan, nxEmerald, nxAmber, nxRose,
  },
  shadows: {
    nxGlowViolet: 'var(--df-glow-violet)',
    nxGlowCyan: 'var(--df-glow-cyan)',
    nxGlowRose: 'var(--df-glow-rose)',
  },
  radius: {
    sm: 'var(--df-radius-sm)',
    md: 'var(--df-radius-md)',
    lg: 'var(--df-radius-lg)',
    xl: 'var(--df-radius-xl)',
  },
  fontFamily: 'var(--df-font-sans, ui-sans-serif, system-ui, sans-serif)',
})
```

After this, `<Button color="nxViolet">` and `<Badge color="nxCyan">` automatically pull DF neon. Inline DF vars (`bg="var(--df-bg-base)"` style props) handle anything not covered by the theme.

## DF → Mantine prop mapping

| DF token | Mantine prop |
|---|---|
| `var(--df-neon-violet)` | `color="nxViolet"` |
| `var(--df-neon-cyan)` | `color="nxCyan"` |
| `var(--df-neon-emerald)` | `color="nxEmerald"` |
| `var(--df-text-primary)` | `c="white"` or inline style |
| `var(--df-text-secondary)` | `c="dimmed"` |
| `var(--df-glow-violet)` | `shadow="nxGlowViolet"` |
| `var(--df-radius-md)` | `radius="md"` |
| `var(--df-bg-elev-1)` | inline `bg="var(--df-bg-elev-1)"` |

## Worked examples

### 1. Button with glow

```tsx
'use client'
import { Button } from '@mantine/core'

export function GetStartedButton() {
  return (
    <Button
      color="nxViolet"
      size="lg"
      radius="md"
      style={{ boxShadow: 'var(--df-glow-violet)' }}
      aria-label="Get started"
    >
      Get started
    </Button>
  )
}
```

### 2. TextInput with focus ring

```tsx
'use client'
import { TextInput } from '@mantine/core'

export function EmailField() {
  return (
    <TextInput
      label="Email"
      placeholder="you@example.com"
      type="email"
      // VERIFY: styles API in v7 uses CSS variables; older v6 used Emotion.
      styles={{
        input: {
          background: 'var(--df-bg-elev-1)',
          borderColor: 'var(--df-border-default)',
          color: 'var(--df-text-primary)',
        },
        label: { color: 'var(--df-text-secondary)' },
      }}
    />
  )
}
```

### 3. Modal with glass backdrop

```tsx
'use client'
import { Modal, Button, Group } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'

export function ConfirmModal() {
  const [opened, { open, close }] = useDisclosure(false)
  return (
    <>
      <Button onClick={open} color="nxViolet">Open</Button>
      <Modal
        opened={opened}
        onClose={close}
        title="Confirm archive"
        centered
        overlayProps={{ backgroundOpacity: 0.55, blur: 6 }}
        styles={{
          content: { background: 'var(--df-bg-elev-2)', borderColor: 'var(--df-glass-border)' },
          header: { background: 'var(--df-bg-elev-2)', borderBottom: '1px solid var(--df-border-subtle)' },
          title: { color: 'var(--df-text-primary)' },
        }}
      >
        <p style={{ color: 'var(--df-text-secondary)' }}>This will archive 12 campaigns.</p>
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={close}>Cancel</Button>
          <Button color="nxRose" onClick={close}>Archive</Button>
        </Group>
      </Modal>
    </>
  )
}
```

### 4. Notification

```tsx
'use client'
import { Button } from '@mantine/core'
import { notifications } from '@mantine/notifications'

export function SuccessNotifyButton() {
  return (
    <Button
      onClick={() =>
        notifications.show({
          title: 'Saved',
          message: 'Campaign settings updated',
          color: 'nxEmerald',
          autoClose: 3000,
          // VERIFY: `style` prop on notifications was added in @mantine/notifications v7.
          style: { background: 'var(--df-bg-elev-2)', borderColor: 'var(--df-glass-border)' },
        })
      }
    >
      Save
    </Button>
  )
}
```

### 5. Table with hover violet

```tsx
'use client'
import { Table } from '@mantine/core'

export function CampaignTable() {
  const rows = ['Ramp', 'Mercury', 'Lattice'].map((name) => (
    <Table.Tr key={name} className="campaign-row">
      <Table.Td style={{ color: 'var(--df-text-primary)' }}>{name}</Table.Td>
      <Table.Td style={{ color: 'var(--df-text-secondary)' }}>Live</Table.Td>
      <Table.Td style={{ color: 'var(--df-text-secondary)' }}>24,180</Table.Td>
    </Table.Tr>
  ))
  return (
    <>
      <Table
        striped={false}
        highlightOnHover
        styles={{
          th: { color: 'var(--df-text-tertiary)', borderColor: 'var(--df-border-subtle)' },
          td: { borderColor: 'var(--df-border-subtle)' },
        }}
      >
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Campaign</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th>Sent</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>
      <style>{`
        .campaign-row:hover { background: rgba(167, 139, 250, 0.06) !important; }
      `}</style>
    </>
  )
}
```

### 6. DatePicker (dark)

```tsx
'use client'
import { DatePickerInput } from '@mantine/dates'

export function CampaignStartDate() {
  return (
    <DatePickerInput
      label="Start date"
      placeholder="Pick a date"
      // VERIFY: @mantine/dates v7 styles slot names. v6 differed.
      styles={{
        input: {
          background: 'var(--df-bg-elev-1)',
          borderColor: 'var(--df-border-default)',
          color: 'var(--df-text-primary)',
        },
        label: { color: 'var(--df-text-secondary)' },
      }}
      popoverProps={{
        styles: {
          dropdown: {
            background: 'var(--df-bg-elev-2)',
            borderColor: 'var(--df-glass-border)',
          },
        },
      }}
    />
  )
}
```

### 7. NavLink + Sidebar

```tsx
'use client'
import { NavLink, Stack } from '@mantine/core'

export function Sidebar() {
  return (
    <Stack
      gap={4}
      p="sm"
      style={{
        width: 240,
        height: '100vh',
        background: 'var(--df-bg-elev-1)',
        borderRight: '1px solid var(--df-border-subtle)',
      }}
    >
      {['Overview', 'Campaigns', 'Inbox health', 'Agent', 'Settings'].map((label, i) => (
        <NavLink
          key={label}
          label={label}
          active={i === 0}
          color="nxViolet"
          variant="filled"
          styles={{
            root: { borderRadius: 'var(--df-radius-md)' },
            label: { color: i === 0 ? '#000' : 'var(--df-text-secondary)' },
          }}
        />
      ))}
    </Stack>
  )
}
```

### 8. LoadingOverlay

```tsx
'use client'
import { LoadingOverlay, Card } from '@mantine/core'

export function StatsCard({ loading }: { loading: boolean }) {
  return (
    <Card pos="relative" p="lg" style={{ background: 'var(--df-glass-bg)', borderColor: 'var(--df-glass-border)' }}>
      <LoadingOverlay
        visible={loading}
        zIndex={1}
        loaderProps={{ color: 'nxViolet', type: 'dots' }}
        overlayProps={{ blur: 2, color: 'var(--df-bg-base)' }}
      />
      <h3 style={{ color: 'var(--df-text-primary)' }}>Replies (24h)</h3>
      <p style={{ fontSize: 32, color: 'var(--df-neon-violet)' }}>6,412</p>
    </Card>
  )
}
```

## Hooks recipes

```tsx
'use client'
import { useDisclosure, useDebouncedValue, useInputState, useLocalStorage, useMediaQuery } from '@mantine/hooks'

export function HookExamples() {
  // Disclosure: toggle modals/drawers
  const [opened, { open, close, toggle }] = useDisclosure(false)

  // Debounce input for search
  const [query, setQuery] = useInputState('')
  const [debounced] = useDebouncedValue(query, 300)

  // Persist user preference
  const [theme, setTheme] = useLocalStorage<'dark' | 'light'>({ key: 'theme', defaultValue: 'dark' })

  // Responsive logic
  const isMobile = useMediaQuery('(max-width: 768px)')

  return null
}
```

## Pitfalls

| Pitfall | Fix |
|---|---|
| `useMantineTheme` returns undefined | `<MantineProvider>` not wrapping the component subtree |
| Color tuple errors at build time | Each color must be exactly 10 hex strings — count them |
| Notifications don't appear | `<Notifications />` component missing from layout, OR `@mantine/notifications/styles.css` not imported |
| Dates picker is unstyled | Forgot `import '@mantine/dates/styles.css'` |
| Hydration mismatch in App Router | Add `<ColorSchemeScript />` in `<head>` and set `data-mantine-color-scheme` on `<html>` |
| v6 → v7 migration breaks Emotion `sx` props | v7 removed Emotion; convert `sx={{ color: 'red' }}` → `styles={{ root: { color: 'red' } }}` |

## Cross-references

- `references/00-dark-tokens.md` — DF token system
- `references/08-shadcn-dark.md` — primitive alternative when you don't need 120 components
- `references/11-antdesign-dark.md` — closest comparable (component-library-with-theme-system)
- `references/01-framer-motion.md` — for animations Mantine doesn't ship
- `references/18-light-theme.md` — light-theme DF bridge
