# Darkforge — Ant Design Dark Reference
Ant Design (antd) is the de-facto enterprise React component library — 60+ components, native i18n, and a token-driven theme engine introduced in v5. Darkforge hooks into that engine via `ConfigProvider` + `theme.algorithm`, then overrides AntD's design tokens with DF AMOLED tokens so every default component (Button, Table, Form, Modal, Drawer, Menu...) inherits true `#000000` backgrounds, neon-violet accents, and the rest of the Darkforge visual language without touching component-level styles.

## Contents

- [Source-of-truth caveat](#source-of-truth-caveat)
- [Install / Setup](#install-setup)
- [Darkforge AMOLED Theme via ConfigProvider](#darkforge-amoled-theme-via-configprovider)
- [Components: AMOLED Variants](#components-amoled-variants)
  - [1. Button — primary violet, default glass, dashed, link, danger](#1-button-primary-violet-default-glass-dashed-link-danger)
  - [2. Card — cover, extra, glass variant](#2-card-cover-extra-glass-variant)
  - [3. Table — dark with violet hover, sticky header, sortable](#3-table-dark-with-violet-hover-sticky-header-sortable)
  - [4. Form + Input + Select + DatePicker + Upload](#4-form-input-select-datepicker-upload)
  - [5. Menu — vertical sidebar dark with DF active](#5-menu-vertical-sidebar-dark-with-nx-active)
  - [6. Modal + Drawer — backdrop blur](#6-modal-drawer-backdrop-blur)
  - [7. Notification + Message — DF colors](#7-notification-message-nx-colors)
  - [8. Tabs + Steps](#8-tabs-steps)
  - [9. Statistic — DF violet large numbers](#9-statistic-nx-violet-large-numbers)
  - [10. Tag + Badge — DF colors](#10-tag-badge-nx-colors)
  - [11. Tooltip + Popover](#11-tooltip-popover)
- [Common gotchas](#common-gotchas)
- [Cross-References](#cross-references)

---

## Source-of-truth caveat

> **Sandbox warning.** `context7` and `WebFetch` are likely denied in this environment, so the API surface below is reconstructed from training data (cutoff: January 2026). AntD v5 has been stable since 2022, but minor tokens (e.g. `colorBgSpotlight`, `colorErrorBgFilledHover`) are still being added between point releases. Lines marked `// VERIFY:` are the most likely to drift — confirm against the live token table at <https://ant.design/docs/react/customize-theme> and `theme/interface.ts` in your installed `antd` version before shipping. If a token name produces a TypeScript error, run `npx ts-node -e "import { theme } from 'antd'; console.log(Object.keys(theme.defaultSeed))"` to dump the current seed map.

---

## Install / Setup

AntD v5 ships pure CSS-in-JS (`@ant-design/cssinjs`). No `less` loader, no `babel-plugin-import`, no theme `.less` overrides. Install only the runtime package and (optionally) the Next.js registry helper for SSR.

```bash
# package manager of your choice
pnpm add antd @ant-design/icons
# Next.js App Router users — eliminates flash-of-unstyled-content
pnpm add @ant-design/nextjs-registry
# Day.js is the default date library since v5
pnpm add dayjs
```

```jsonc
// tsconfig.json — must include
{
  "compilerOptions": {
    "jsx": "preserve",
    "moduleResolution": "bundler",
    "strict": true
  }
}
```

```ts
// src/lib/antd-locale.ts — single source for locales (optional but recommended)
import enUS from 'antd/locale/en_US'
import 'dayjs/locale/en'

export const antdLocale = enUS
```

In v5 the algorithm is the entry point to dark mode. Three algorithms ship by default and they can be composed: `theme.defaultAlgorithm`, `theme.darkAlgorithm`, and `theme.compactAlgorithm`. Darkforge always uses `[darkAlgorithm, compactAlgorithm]` because the compact preset reduces vertical rhythm (perfect for AMOLED dashboards) and `darkAlgorithm` gives every derivative token (hover states, borders, disabled colors) sensible dark fallbacks before our overrides land.

```tsx
// src/app/layout.tsx — Next.js 14 App Router skeleton
import type { ReactNode } from 'react'
import { AntdRegistry } from '@ant-design/nextjs-registry'
import { NexusAntdProvider } from '@/providers/nexus-antd-provider'
import './globals.css' // loads :root DF tokens

export const metadata = { title: 'Darkforge Console' }

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="dark">
      <body style={{ background: 'var(--df-bg-base)', color: 'var(--df-text-primary)', margin: 0 }}>
        <AntdRegistry>
          <NexusAntdProvider>{children}</NexusAntdProvider>
        </AntdRegistry>
      </body>
    </html>
  )
}
```

---

## Darkforge AMOLED Theme via ConfigProvider

The mapping between DF CSS variables and AntD design tokens is the load-bearing piece of this integration. AntD's `ThemeConfig` accepts a flat `token` bag (global) and a `components` bag (per-component overrides). Because AntD's runtime resolves tokens at render time we *cannot* pass `var(--df-...)` directly for **every** token — `colorPrimary` and other seed tokens feed into the algorithm's color generator, which expects valid hex/rgba strings. The rule of thumb:

- **Seed tokens** (`colorPrimary`, `colorSuccess`, `colorError`, `colorWarning`, `colorInfo`, `colorTextBase`, `colorBgBase`) → use **resolved hex literals** matching the DF palette. AntD will derive 10-step palettes from these.
- **Component-level tokens** (backgrounds, borders, text colors that don't feed the generator) → may use `var(--df-...)` directly, which keeps runtime theme switching cheap.

```tsx
// src/providers/nexus-antd-provider.tsx
'use client'

import type { ReactNode } from 'react'
import { ConfigProvider, App as AntApp, theme } from 'antd'
import type { ThemeConfig } from 'antd'
import { antdLocale } from '@/lib/antd-locale'

/**
 * DF → AntD seed palette.
 * These literals MUST match the values in references/00-dark-tokens.md.
 * Exposed as constants so component-level overrides can reuse them.
 */
const DF = {
  bgBase:     '#000000',
  bgSurface:  '#080808',
  bgElevated: '#111111',
  bgOverlay:  '#1a1a1a',
  bgMuted:    '#222222',
  bgHover:    '#2a2a2a',
  violet:     '#a78bfa',
  cyan:       '#22d3ee',
  pink:       '#f472b6',
  green:      '#4ade80',
  amber:      '#fbbf24',
  red:        '#f87171',
  textPri:    '#ffffff',
  textSec:    '#a1a1aa',
  textMuted:  '#52525b',
  borderSub:  'rgba(255, 255, 255, 0.05)',
  borderDef:  'rgba(255, 255, 255, 0.09)',
  borderStr:  'rgba(255, 255, 255, 0.16)',
} as const

const nexusTheme: ThemeConfig = {
  algorithm: [theme.darkAlgorithm, theme.compactAlgorithm],
  cssVar: { key: 'nx-antd' }, // emits AntD tokens as CSS vars under [data-prefix=nx-antd]
  hashed: false,              // smaller class names; safe when only one provider per app
  token: {
    // ── Brand ────────────────────────────────────────────
    colorPrimary:       DF.violet,
    colorInfo:          DF.cyan,
    colorSuccess:       DF.green,
    colorWarning:       DF.amber,
    colorError:         DF.red,
    colorLink:          DF.cyan,
    colorLinkHover:     '#67e8f9', // VERIFY: token name pre v5.18 was colorLinkHover

    // ── Surfaces (AMOLED scale) ──────────────────────────
    colorBgBase:        DF.bgBase,
    colorBgLayout:      DF.bgBase,        // body/layout
    colorBgContainer:   DF.bgSurface,     // cards, table, list
    colorBgElevated:    DF.bgElevated,    // dropdown, popover, modal panel
    colorBgSpotlight:   DF.bgOverlay,     // tooltip
    colorBgMask:        'rgba(0, 0, 0, 0.72)', // modal/drawer scrim

    // ── Text ─────────────────────────────────────────────
    colorTextBase:        DF.textPri,
    colorText:            DF.textPri,
    colorTextSecondary:   DF.textSec,
    colorTextTertiary:    DF.textMuted,
    colorTextQuaternary:  '#3f3f46', // VERIFY: matches zinc-700 step
    colorTextDisabled:    DF.textMuted,
    colorTextPlaceholder: DF.textMuted,
    colorTextHeading:     DF.textPri,

    // ── Borders ──────────────────────────────────────────
    colorBorder:          DF.borderDef,
    colorBorderSecondary: DF.borderSub,
    colorSplit:           DF.borderSub,

    // ── Radii (DF scale) ─────────────────────────────────
    borderRadius:    10, // var(--df-radius-md)
    borderRadiusLG:  16, // var(--df-radius-lg)
    borderRadiusSM:  6,  // var(--df-radius-sm)
    borderRadiusXS:  4,  // var(--df-radius-xs)

    // ── Spacing & sizing ─────────────────────────────────
    sizeUnit:  4,
    sizeStep:  4,
    controlHeight:    36,
    controlHeightLG:  44,
    controlHeightSM:  28,

    // ── Typography ───────────────────────────────────────
    fontFamily: "'Inter', 'Geist', system-ui, -apple-system, sans-serif",
    fontFamilyCode: "'JetBrains Mono', 'Fira Code', monospace",
    fontSize: 14,
    lineHeight: 1.5715,

    // ── Motion ───────────────────────────────────────────
    motionDurationFast: '0.15s',
    motionDurationMid:  '0.25s',
    motionDurationSlow: '0.4s',
    motionEaseInOut:    'cubic-bezier(0.4, 0, 0.2, 1)',
    motionEaseOut:      'cubic-bezier(0.16, 1, 0.3, 1)',

    // ── Shadows ──────────────────────────────────────────
    boxShadow:          '0 8px 32px rgba(0,0,0,0.5)',
    boxShadowSecondary: '0 4px 16px rgba(0,0,0,0.4)',
    boxShadowTertiary:  '0 2px 8px rgba(0,0,0,0.3)',

    // ── Misc ─────────────────────────────────────────────
    wireframe: false,
    colorIcon: DF.textSec,
    colorIconHover: DF.textPri,
  },
  components: {
    Button: {
      defaultBg: 'transparent',
      defaultBorderColor: DF.borderDef,
      defaultColor: DF.textPri,
      defaultHoverBg: DF.bgHover,
      defaultHoverBorderColor: DF.violet,
      defaultHoverColor: DF.violet,
      primaryShadow: '0 0 20px rgba(167,139,250,0.35)',
      dangerShadow:  '0 0 20px rgba(248,113,113,0.35)',
      fontWeight: 500,
      contentFontSize: 14,
    },
    Card: {
      colorBgContainer:    DF.bgSurface,
      colorBorderSecondary: DF.borderSub,
      headerBg:            'transparent',
      headerFontSize:      16,
      headerHeight:        56,
      paddingLG:           24,
      boxShadowTertiary:   '0 4px 16px rgba(0,0,0,0.4)',
    },
    Table: {
      colorBgContainer:    DF.bgSurface,
      headerBg:            DF.bgElevated,
      headerColor:         DF.textSec,
      headerSortActiveBg:  DF.bgOverlay,
      headerSortHoverBg:   DF.bgHover,
      rowHoverBg:          'rgba(167,139,250,0.06)',
      rowSelectedBg:       'rgba(167,139,250,0.1)',
      rowSelectedHoverBg:  'rgba(167,139,250,0.14)',
      borderColor:         DF.borderSub,
      footerBg:            DF.bgElevated,
      cellPaddingBlock:    14,
      cellPaddingInline:   16,
    },
    Modal: {
      contentBg:        DF.bgOverlay,
      headerBg:         'transparent',
      titleColor:       DF.textPri,
      footerBg:         'transparent',
      colorIcon:        DF.textSec,
      colorIconHover:   DF.violet,
    },
    Drawer: {
      colorBgElevated: DF.bgOverlay,
    },
    Menu: {
      itemBg:                'transparent',
      itemHoverBg:           DF.bgHover,
      itemHoverColor:        DF.violet,
      itemSelectedBg:        'rgba(167,139,250,0.12)',
      itemSelectedColor:     DF.violet,
      itemColor:             DF.textSec,
      itemActiveBg:          'rgba(167,139,250,0.16)',
      iconSize:              18,
      collapsedIconSize:     20,
      subMenuItemBg:         'transparent',
      groupTitleColor:       DF.textMuted,
    },
    Input: {
      colorBgContainer:  DF.bgElevated,
      activeBorderColor: DF.violet,
      hoverBorderColor:  'rgba(167,139,250,0.5)',
      activeShadow:      '0 0 0 3px rgba(167,139,250,0.15)',
      paddingBlock:      8,
    },
    Select: {
      colorBgContainer:        DF.bgElevated,
      colorBgElevated:         DF.bgOverlay,
      optionSelectedBg:        'rgba(167,139,250,0.12)',
      optionSelectedColor:     DF.violet,
      optionActiveBg:          DF.bgHover,
      multipleItemBg:          'rgba(167,139,250,0.1)',
      multipleItemBorderColor: 'rgba(167,139,250,0.3)',
    },
    DatePicker: {
      colorBgContainer:    DF.bgElevated,
      colorBgElevated:     DF.bgOverlay,
      cellHoverBg:         DF.bgHover,
      cellActiveWithRangeBg: 'rgba(167,139,250,0.1)',
      cellRangeBorderColor: DF.violet,
    },
    Tabs: {
      itemColor:               DF.textSec,
      itemHoverColor:          DF.textPri,
      itemSelectedColor:       DF.violet,
      itemActiveColor:         DF.violet,
      inkBarColor:             DF.violet,
      cardBg:                  DF.bgElevated,
      cardGutter:              4,
      titleFontSize:           14,
      horizontalItemPadding:   '12px 16px',
    },
    Steps: {
      colorPrimary: DF.violet,
      finishIconBorderColor: DF.violet,
      titleLineHeight: 24,
      iconSize: 28,
    },
    Statistic: {
      titleFontSize:   13,
      contentFontSize: 32,
      colorTextHeading: DF.violet,
    },
    Tag: {
      defaultBg: DF.bgElevated,
      defaultColor: DF.textSec,
    },
    Badge: {
      colorBgContainer: DF.bgBase,
      dotSize: 8,
      statusSize: 8,
    },
    Tooltip: {
      colorBgSpotlight: DF.bgOverlay,
      colorTextLightSolid: DF.textPri,
    },
    Popover: {
      colorBgElevated: DF.bgOverlay,
      titleMinWidth: 180,
    },
    Notification: {
      colorBgElevated: DF.bgOverlay,
      colorIcon: DF.violet,
      colorIconHover: DF.textPri,
      paddingMD: 16,
    },
    Message: {
      contentBg: DF.bgOverlay,
      contentPadding: '10px 16px',
    },
    Form: {
      labelColor:        DF.textSec,
      labelFontSize:     13,
      labelRequiredMarkColor: DF.red,
      verticalLabelPadding:   '0 0 6px',
    },
    Upload: {
      colorBorder: DF.borderDef,
      colorFillAlter: DF.bgElevated,
      colorPrimary: DF.violet,
    },
    Switch: {
      colorPrimary: DF.violet,
      colorPrimaryHover: '#c4b5fd',
      handleBg: DF.textPri,
    },
    Slider: {
      railBg: DF.bgElevated,
      railHoverBg: DF.bgHover,
      trackBg: DF.violet,
      trackHoverBg: '#c4b5fd',
      handleColor: DF.violet,
      handleActiveColor: '#c4b5fd',
      dotBorderColor: DF.borderDef,
    },
    Progress: {
      defaultColor: DF.violet,
      remainingColor: DF.bgElevated,
    },
    Divider: {
      colorSplit: DF.borderSub,
    },
    Empty: {
      colorTextDisabled: DF.textMuted,
    },
    Spin: {
      colorPrimary: DF.violet,
      dotSize: 24,
    },
    Pagination: {
      itemBg: 'transparent',
      itemActiveBg: 'rgba(167,139,250,0.12)',
      itemSize: 32,
    },
  },
}

interface NexusAntdProviderProps {
  children: ReactNode
}

export function NexusAntdProvider({ children }: NexusAntdProviderProps) {
  return (
    <ConfigProvider theme={nexusTheme} locale={antdLocale} componentSize="middle">
      <AntApp message={{ maxCount: 3, duration: 3 }} notification={{ placement: 'topRight', duration: 4 }}>
        {children}
      </AntApp>
    </ConfigProvider>
  )
}
```

The wrapping `<AntApp />` (alias of `App` from `antd`) is what unlocks the imperative `message`/`notification`/`Modal.confirm` APIs while still inheriting the theme — without it, those globals render through React's default portal which sits outside `ConfigProvider`. Darkforge always pairs the two.

---

## Components: AMOLED Variants

### 1. Button — primary violet, default glass, dashed, link, danger

```tsx
// src/components/antd/buttons.tsx
'use client'

import { Button, Flex, Tooltip } from 'antd'
import { ArrowRightOutlined, DownloadOutlined, DeleteOutlined } from '@ant-design/icons'

export function ButtonShowcase(): JSX.Element {
  return (
    <Flex gap={12} wrap="wrap" align="center" aria-label="Button variants">
      <Button type="primary" icon={<ArrowRightOutlined aria-hidden />}>
        Deploy now
      </Button>

      <Button type="default">View logs</Button>

      <Button type="dashed" icon={<DownloadOutlined aria-hidden />}>
        Download SBOM
      </Button>

      <Button type="link" href="https://nexus.example/docs">
        Read the docs
      </Button>

      <Tooltip title="Permanent — cannot be undone">
        <Button danger type="primary" icon={<DeleteOutlined aria-hidden />}>
          Destroy cluster
        </Button>
      </Tooltip>

      <Button type="primary" loading aria-live="polite">
        Provisioning…
      </Button>

      <Button type="primary" disabled>
        Awaiting approval
      </Button>
    </Flex>
  )
}
```

### 2. Card — cover, extra, glass variant

```tsx
// src/components/antd/project-card.tsx
'use client'

import { Card, Tag, Avatar, Space, Typography, Button } from 'antd'
import { GithubOutlined, StarOutlined, ForkOutlined } from '@ant-design/icons'

const { Meta } = Card
const { Text } = Typography

export interface ProjectCardData {
  id: string
  name: string
  description: string
  cover: string
  language: 'TypeScript' | 'Rust' | 'Python'
  stars: number
  forks: number
  members: { name: string; src: string }[]
}

const langColor: Record<ProjectCardData['language'], string> = {
  TypeScript: 'var(--df-neon-cyan)',
  Rust:       'var(--df-neon-amber)',
  Python:     'var(--df-neon-green)',
}

export function ProjectCard({ project }: { project: ProjectCardData }): JSX.Element {
  return (
    <Card
      hoverable
      style={{
        background: 'var(--df-glass-bg)',
        border: '1px solid var(--df-glass-border)',
        backdropFilter: 'blur(12px) saturate(180%)',
        WebkitBackdropFilter: 'blur(12px) saturate(180%)',
        borderRadius: 'var(--df-radius-lg)',
      }}
      cover={
        <img
          alt={`${project.name} cover`}
          src={project.cover}
          style={{ height: 160, objectFit: 'cover', borderRadius: 'var(--df-radius-lg) var(--df-radius-lg) 0 0' }}
          loading="lazy"
        />
      }
      actions={[
        <Space key="stars" size={4}><StarOutlined aria-hidden /> <Text type="secondary">{project.stars}</Text></Space>,
        <Space key="forks" size={4}><ForkOutlined aria-hidden /> <Text type="secondary">{project.forks}</Text></Space>,
        <Button key="src" type="link" icon={<GithubOutlined aria-hidden />} aria-label={`Open ${project.name} on GitHub`}>
          Source
        </Button>,
      ]}
      extra={<Tag color={langColor[project.language] as string}>{project.language}</Tag>}
    >
      <Meta
        avatar={<Avatar.Group max={{ count: 3 }}>{project.members.map(m => <Avatar key={m.name} src={m.src} alt={m.name} />)}</Avatar.Group>}
        title={<span style={{ color: 'var(--df-text-primary)' }}>{project.name}</span>}
        description={<span style={{ color: 'var(--df-text-secondary)' }}>{project.description}</span>}
      />
    </Card>
  )
}
```

### 3. Table — dark with violet hover, sticky header, sortable

```tsx
// src/components/antd/deployments-table.tsx
'use client'

import { Table, Tag, Space, Button, Typography } from 'antd'
import type { TableColumnsType } from 'antd'
import { CheckCircleFilled, ClockCircleFilled, CloseCircleFilled } from '@ant-design/icons'

const { Text } = Typography

interface DeploymentRow {
  key: string
  service: string
  environment: 'production' | 'staging' | 'preview'
  status: 'healthy' | 'pending' | 'failed'
  version: string
  deployedAt: string
  durationMs: number
}

const statusToken = {
  healthy: { icon: <CheckCircleFilled style={{ color: 'var(--df-neon-green)' }} aria-hidden />, label: 'Healthy', color: 'var(--df-neon-green)' },
  pending: { icon: <ClockCircleFilled style={{ color: 'var(--df-neon-amber)' }} aria-hidden />, label: 'Pending', color: 'var(--df-neon-amber)' },
  failed:  { icon: <CloseCircleFilled style={{ color: 'var(--df-neon-red)' }}   aria-hidden />, label: 'Failed',  color: 'var(--df-neon-red)' },
} as const

const data: DeploymentRow[] = [
  { key: '1', service: 'auth-api',     environment: 'production', status: 'healthy', version: 'v2.14.3', deployedAt: '2 min ago',  durationMs: 42_000 },
  { key: '2', service: 'billing-svc',  environment: 'production', status: 'pending', version: 'v1.8.0',  deployedAt: '4 min ago',  durationMs: 88_000 },
  { key: '3', service: 'web-frontend', environment: 'staging',    status: 'healthy', version: 'v3.0.1',  deployedAt: '12 min ago', durationMs: 31_200 },
  { key: '4', service: 'webhooks',     environment: 'preview',    status: 'failed',  version: 'v0.4.0',  deployedAt: '21 min ago', durationMs: 12_000 },
]

const columns: TableColumnsType<DeploymentRow> = [
  {
    title: 'Service',
    dataIndex: 'service',
    sorter: (a, b) => a.service.localeCompare(b.service),
    render: (v: string) => <Text strong style={{ color: 'var(--df-text-primary)' }}>{v}</Text>,
  },
  {
    title: 'Environment',
    dataIndex: 'environment',
    filters: [
      { text: 'Production', value: 'production' },
      { text: 'Staging',    value: 'staging' },
      { text: 'Preview',    value: 'preview' },
    ],
    onFilter: (value, record) => record.environment === value,
    render: (env: DeploymentRow['environment']) => {
      const palette = { production: 'cyan', staging: 'magenta', preview: 'gold' } as const
      return <Tag color={palette[env]}>{env}</Tag>
    },
  },
  {
    title: 'Status',
    dataIndex: 'status',
    render: (s: DeploymentRow['status']) => {
      const t = statusToken[s]
      return <Space size={6} style={{ color: t.color }}>{t.icon}{t.label}</Space>
    },
  },
  { title: 'Version', dataIndex: 'version', render: v => <Text code>{v}</Text> },
  {
    title: 'Duration',
    dataIndex: 'durationMs',
    sorter: (a, b) => a.durationMs - b.durationMs,
    render: (ms: number) => `${(ms / 1000).toFixed(1)}s`,
    align: 'right',
  },
  { title: 'Deployed', dataIndex: 'deployedAt', responsive: ['md'] },
  {
    title: 'Actions',
    key: 'actions',
    fixed: 'right',
    width: 120,
    render: (_v, row) => (
      <Space size={4}>
        <Button size="small" type="link" aria-label={`Open ${row.service} logs`}>Logs</Button>
        <Button size="small" type="link" danger aria-label={`Rollback ${row.service}`}>Rollback</Button>
      </Space>
    ),
  },
]

export function DeploymentsTable(): JSX.Element {
  return (
    <Table<DeploymentRow>
      columns={columns}
      dataSource={data}
      rowSelection={{ type: 'checkbox' }}
      pagination={{ pageSize: 10, showSizeChanger: false }}
      sticky
      scroll={{ x: 880 }}
      size="middle"
      aria-label="Recent deployments"
    />
  )
}
```

### 4. Form + Input + Select + DatePicker + Upload

```tsx
// src/components/antd/create-deployment-form.tsx
'use client'

import { Form, Input, Select, DatePicker, Upload, Button, Switch, Row, Col, App } from 'antd'
import { InboxOutlined } from '@ant-design/icons'
import type { UploadProps } from 'antd'
import dayjs from 'dayjs'

const { Dragger } = Upload
const { TextArea } = Input

interface DeploymentForm {
  service: string
  environment: 'production' | 'staging' | 'preview'
  version: string
  scheduledAt: dayjs.Dayjs
  notes?: string
  notifyTeam: boolean
}

const draggerProps: UploadProps = {
  name: 'manifest',
  multiple: false,
  accept: '.yaml,.yml,.json',
  maxCount: 1,
  beforeUpload: () => false, // handle upload via parent submit
}

export function CreateDeploymentForm(): JSX.Element {
  const { message } = App.useApp()
  const [form] = Form.useForm<DeploymentForm>()

  const onFinish = (values: DeploymentForm): void => {
    message.success(`Queued ${values.service}@${values.version} for ${values.environment}`)
  }

  return (
    <Form<DeploymentForm>
      form={form}
      layout="vertical"
      onFinish={onFinish}
      initialValues={{ environment: 'staging', notifyTeam: true, scheduledAt: dayjs() }}
      requiredMark="optional"
      style={{ maxWidth: 720 }}
    >
      <Row gutter={[16, 0]}>
        <Col xs={24} md={12}>
          <Form.Item name="service" label="Service" rules={[{ required: true, message: 'Pick a service' }]}>
            <Select
              placeholder="Select a service"
              options={[
                { value: 'auth-api',     label: 'auth-api' },
                { value: 'billing-svc',  label: 'billing-svc' },
                { value: 'web-frontend', label: 'web-frontend' },
                { value: 'webhooks',     label: 'webhooks' },
              ]}
              showSearch
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="environment" label="Environment" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'production', label: 'Production' },
                { value: 'staging',    label: 'Staging' },
                { value: 'preview',    label: 'Preview' },
              ]}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={[16, 0]}>
        <Col xs={24} md={12}>
          <Form.Item
            name="version"
            label="Version tag"
            rules={[{ required: true, pattern: /^v\d+\.\d+\.\d+$/, message: 'Use semver, e.g. v1.2.3' }]}
          >
            <Input placeholder="v2.14.3" autoComplete="off" />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="scheduledAt" label="Schedule" rules={[{ required: true }]}>
            <DatePicker showTime style={{ width: '100%' }} format="YYYY-MM-DD HH:mm" />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item name="notes" label="Release notes">
        <TextArea rows={4} placeholder="Closed bugs, breaking changes, rollback plan…" maxLength={500} showCount />
      </Form.Item>

      <Form.Item label="Manifest">
        <Dragger {...draggerProps} aria-label="Upload Kubernetes manifest">
          <p style={{ fontSize: 32, color: 'var(--df-neon-violet)', margin: 0 }}>
            <InboxOutlined aria-hidden />
          </p>
          <p style={{ color: 'var(--df-text-primary)', fontWeight: 500 }}>Drop a manifest here</p>
          <p style={{ color: 'var(--df-text-secondary)', fontSize: 12 }}>YAML or JSON, max 1 MB</p>
        </Dragger>
      </Form.Item>

      <Form.Item name="notifyTeam" label="Notify #deploys" valuePropName="checked">
        <Switch />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" size="large">Queue deployment</Button>
        <Button htmlType="reset" style={{ marginLeft: 8 }}>Reset</Button>
      </Form.Item>
    </Form>
  )
}
```

### 5. Menu — vertical sidebar dark with DF active

```tsx
// src/components/antd/sidebar-menu.tsx
'use client'

import { useState } from 'react'
import { Menu } from 'antd'
import type { MenuProps } from 'antd'
import {
  DashboardOutlined, RocketOutlined, DatabaseOutlined,
  TeamOutlined, BellOutlined, SettingOutlined, ApiOutlined,
} from '@ant-design/icons'

type MenuItem = Required<MenuProps>['items'][number]

const items: MenuItem[] = [
  { type: 'group', label: 'Overview', children: [
    { key: 'dashboard',   icon: <DashboardOutlined />, label: 'Dashboard' },
    { key: 'deployments', icon: <RocketOutlined />,    label: 'Deployments' },
  ]},
  { type: 'divider' },
  { type: 'group', label: 'Build', children: [
    { key: 'services', icon: <ApiOutlined />,      label: 'Services' },
    { key: 'data',     icon: <DatabaseOutlined />, label: 'Data',
      children: [
        { key: 'data.postgres', label: 'Postgres' },
        { key: 'data.redis',    label: 'Redis' },
        { key: 'data.s3',       label: 'Object storage' },
      ],
    },
  ]},
  { type: 'divider' },
  { type: 'group', label: 'Workspace', children: [
    { key: 'team',     icon: <TeamOutlined />,     label: 'Team' },
    { key: 'alerts',   icon: <BellOutlined />,     label: 'Alerts' },
    { key: 'settings', icon: <SettingOutlined />,  label: 'Settings' },
  ]},
]

export function SidebarMenu(): JSX.Element {
  const [selected, setSelected] = useState<string[]>(['dashboard'])
  return (
    <nav
      aria-label="Primary"
      style={{
        width: 240,
        background: 'var(--df-bg-surface)',
        borderRight: '1px solid var(--df-border-subtle)',
        height: '100dvh',
        padding: 12,
      }}
    >
      <Menu
        mode="inline"
        items={items}
        selectedKeys={selected}
        onClick={({ key }) => setSelected([key])}
        style={{ background: 'transparent', border: 'none' }}
      />
    </nav>
  )
}
```

### 6. Modal + Drawer — backdrop blur

```tsx
// src/components/antd/overlays.tsx
'use client'

import { useState } from 'react'
import { Modal, Drawer, Button, Space, Descriptions, App } from 'antd'

export function ConfirmDestroyModal(): JSX.Element {
  const { modal } = App.useApp()

  const open = (): void => {
    modal.confirm({
      title: 'Destroy production cluster?',
      content: 'This permanently deletes 12 nodes, 4 databases, and 2.1 TB of data. There is no undo.',
      okText: 'Destroy cluster',
      cancelText: 'Keep cluster',
      okButtonProps: { danger: true, type: 'primary' },
      maskStyle: { backdropFilter: 'blur(8px)' },
      width: 480,
      centered: true,
    })
  }
  return <Button danger onClick={open}>Destroy cluster…</Button>
}

interface ServiceDetail {
  name: string
  status: 'healthy' | 'degraded'
  region: string
  cpu: string
  memory: string
}

export function ServiceDrawer({ service }: { service: ServiceDetail }): JSX.Element {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button type="link" onClick={() => setOpen(true)} aria-label={`Inspect ${service.name}`}>
        Inspect
      </Button>
      <Drawer
        title={service.name}
        placement="right"
        width={Math.min(480, typeof window === 'undefined' ? 480 : window.innerWidth)}
        onClose={() => setOpen(false)}
        open={open}
        styles={{
          mask: { backdropFilter: 'blur(8px)', background: 'rgba(0,0,0,0.6)' },
          header: { borderBottom: '1px solid var(--df-border-subtle)' },
        }}
        extra={
          <Space>
            <Button onClick={() => setOpen(false)}>Close</Button>
            <Button type="primary">Restart</Button>
          </Space>
        }
      >
        <Descriptions column={1} colon={false} labelStyle={{ color: 'var(--df-text-secondary)' }}>
          <Descriptions.Item label="Status">{service.status}</Descriptions.Item>
          <Descriptions.Item label="Region">{service.region}</Descriptions.Item>
          <Descriptions.Item label="CPU">{service.cpu}</Descriptions.Item>
          <Descriptions.Item label="Memory">{service.memory}</Descriptions.Item>
        </Descriptions>
      </Drawer>
    </>
  )
}
```

### 7. Notification + Message — DF colors

```tsx
// src/components/antd/feedback.tsx
'use client'

import { Button, Space, App } from 'antd'
import { CheckCircleFilled, WarningFilled, CloseCircleFilled, InfoCircleFilled } from '@ant-design/icons'

export function FeedbackShowcase(): JSX.Element {
  const { message, notification } = App.useApp()

  return (
    <Space wrap>
      <Button onClick={() => message.success('Saved 3 services')}>message.success</Button>
      <Button onClick={() => message.warning('Two pods are restarting')}>message.warning</Button>
      <Button
        onClick={() =>
          notification.open({
            message: 'Deployment failed',
            description: 'auth-api v2.14.3 reverted to v2.14.2 after health checks failed.',
            icon: <CloseCircleFilled style={{ color: 'var(--df-neon-red)' }} aria-hidden />,
            placement: 'topRight',
            duration: 6,
            role: 'alert',
          })
        }
      >
        notification.error
      </Button>
      <Button
        onClick={() =>
          notification.open({
            message: 'New region available',
            description: 'eu-central-2 is now in general availability.',
            icon: <InfoCircleFilled style={{ color: 'var(--df-neon-cyan)' }} aria-hidden />,
            placement: 'topRight',
          })
        }
      >
        notification.info
      </Button>
      <Button
        onClick={() =>
          notification.open({
            message: 'Backup completed',
            description: 'Snapshot d6e1 is ready for restore.',
            icon: <CheckCircleFilled style={{ color: 'var(--df-neon-green)' }} aria-hidden />,
            placement: 'topRight',
          })
        }
      >
        notification.success
      </Button>
      <Button
        onClick={() =>
          notification.open({
            message: 'Quota at 86%',
            description: 'Consider upgrading your plan before the end of the cycle.',
            icon: <WarningFilled style={{ color: 'var(--df-neon-amber)' }} aria-hidden />,
            placement: 'topRight',
          })
        }
      >
        notification.warn
      </Button>
    </Space>
  )
}
```

### 8. Tabs + Steps

```tsx
// src/components/antd/tabs-steps.tsx
'use client'

import { Tabs, Steps, Card } from 'antd'
import type { TabsProps } from 'antd'
import { GithubOutlined, DatabaseOutlined, KeyOutlined } from '@ant-design/icons'

const tabItems: TabsProps['items'] = [
  { key: 'overview', label: 'Overview',  children: <p style={{ color: 'var(--df-text-secondary)' }}>3 active services, 2 in degraded state.</p> },
  { key: 'metrics',  label: 'Metrics',   children: <p style={{ color: 'var(--df-text-secondary)' }}>p99 = 124 ms · error rate = 0.04%</p> },
  { key: 'logs',     label: 'Logs',      children: <p style={{ color: 'var(--df-text-secondary)' }}>Streaming logs from auth-api…</p> },
  { key: 'settings', label: 'Settings',  children: <p style={{ color: 'var(--df-text-secondary)' }}>Manage region, scaling and secrets.</p> },
]

export function ServiceTabs(): JSX.Element {
  return (
    <Card style={{ background: 'var(--df-bg-surface)' }}>
      <Tabs defaultActiveKey="overview" items={tabItems} animated tabBarGutter={4} />
    </Card>
  )
}

export function OnboardingSteps({ current }: { current: number }): JSX.Element {
  return (
    <Steps
      current={current}
      direction="horizontal"
      responsive
      items={[
        { title: 'Connect repo', description: 'GitHub or GitLab',     icon: <GithubOutlined /> },
        { title: 'Pick database', description: 'Postgres, Redis, …', icon: <DatabaseOutlined /> },
        { title: 'Add secrets',   description: 'Env vars',            icon: <KeyOutlined /> },
        { title: 'Deploy',        description: 'Ship to production' },
      ]}
    />
  )
}
```

### 9. Statistic — DF violet large numbers

```tsx
// src/components/antd/stats-grid.tsx
'use client'

import { Row, Col, Card, Statistic } from 'antd'
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons'

export function StatsGrid(): JSX.Element {
  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Active deployments"
            value={48}
            valueStyle={{ color: 'var(--df-neon-violet)' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Uptime (30d)"
            value={99.987}
            precision={3}
            suffix="%"
            valueStyle={{ color: 'var(--df-neon-green)' }}
            prefix={<ArrowUpOutlined aria-hidden />}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="p99 latency"
            value={124}
            suffix="ms"
            valueStyle={{ color: 'var(--df-neon-cyan)' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Error rate"
            value={0.04}
            precision={2}
            suffix="%"
            valueStyle={{ color: 'var(--df-neon-red)' }}
            prefix={<ArrowDownOutlined aria-hidden />}
          />
        </Card>
      </Col>
    </Row>
  )
}
```

### 10. Tag + Badge — DF colors

```tsx
// src/components/antd/tags-badges.tsx
'use client'

import { Tag, Badge, Space, Avatar } from 'antd'

const tagPalette: { label: string; color: string }[] = [
  { label: 'production', color: 'var(--df-neon-violet)' },
  { label: 'staging',    color: 'var(--df-neon-cyan)' },
  { label: 'beta',       color: 'var(--df-neon-pink)' },
  { label: 'stable',     color: 'var(--df-neon-green)' },
  { label: 'pending',    color: 'var(--df-neon-amber)' },
  { label: 'failed',     color: 'var(--df-neon-red)' },
]

export function TagPalette(): JSX.Element {
  return (
    <Space wrap>
      {tagPalette.map(t => (
        <Tag key={t.label} color={t.color} style={{ borderRadius: 'var(--df-radius-full)', padding: '2px 12px' }}>
          {t.label}
        </Tag>
      ))}
    </Space>
  )
}

export function BadgeShowcase(): JSX.Element {
  return (
    <Space size={32} wrap>
      <Badge count={12} color="var(--df-neon-violet)">
        <Avatar shape="square" size={40}>DF</Avatar>
      </Badge>
      <Badge dot color="var(--df-neon-green)" status="processing">
        <Avatar shape="square" size={40}>API</Avatar>
      </Badge>
      <Badge count={99} overflowCount={50} color="var(--df-neon-pink)">
        <Avatar shape="square" size={40}>NS</Avatar>
      </Badge>
      <Badge.Ribbon text="New" color="var(--df-neon-cyan)">
        <Avatar shape="square" size={56} style={{ width: 160, height: 56, borderRadius: 'var(--df-radius-md)' }}>
          v3.0
        </Avatar>
      </Badge.Ribbon>
    </Space>
  )
}
```

### 11. Tooltip + Popover

```tsx
// src/components/antd/disclosures.tsx
'use client'

import { Tooltip, Popover, Button, Space, Typography, Divider } from 'antd'
import { InfoCircleOutlined } from '@ant-design/icons'

const { Text, Paragraph } = Typography

export function DisclosureShowcase(): JSX.Element {
  return (
    <Space size="large" wrap>
      <Tooltip title="Provisioning takes 30–60 seconds." color="var(--df-bg-overlay)">
        <Button type="dashed" icon={<InfoCircleOutlined aria-hidden />}>Why is this slow?</Button>
      </Tooltip>

      <Popover
        title="Region health"
        trigger={['click']}
        placement="bottomRight"
        content={
          <div style={{ width: 220 }}>
            <Paragraph style={{ marginBottom: 8 }}>
              <Text type="secondary">us-east-1:</Text>{' '}
              <Text style={{ color: 'var(--df-neon-green)' }}>healthy</Text>
            </Paragraph>
            <Paragraph style={{ marginBottom: 8 }}>
              <Text type="secondary">eu-west-1:</Text>{' '}
              <Text style={{ color: 'var(--df-neon-amber)' }}>degraded</Text>
            </Paragraph>
            <Divider style={{ margin: '8px 0' }} />
            <Button type="link" size="small" style={{ padding: 0 }}>View status page →</Button>
          </div>
        }
      >
        <Button>Inspect regions</Button>
      </Popover>
    </Space>
  )
}
```

---

## Common gotchas

1. **Provider tree order matters.** `AntdRegistry` (or `StyleProvider` in non-Next setups) must wrap `ConfigProvider`, which must wrap `App`. Inverting any pair causes hydration mismatches or theme leaks.
2. **CSS-in-JS performance in App Router.** Use `@ant-design/nextjs-registry` to extract critical CSS at the server boundary. Without it, AntD renders a `<style data-emotion>` block on every server render and hydration restarts the cascade — visible as a flash on slow networks. For Pages Router, follow the AntD docs for `_document` extraction.
3. **`hashed: false` is convenient but global.** Setting `hashed: false` removes the per-instance suffix from generated class names. Safe when you mount exactly one `ConfigProvider` per app, dangerous when nesting multiple themes (Storybook stories, modal-in-iframe, micro-frontends) — keep it `true` in those cases.
4. **`message` and `notification` outside `<App>` ignore your theme.** Importing `import { message } from 'antd'` calls the static API which lives outside React; it cannot read your `ConfigProvider`. Always pull these from `App.useApp()` inside components or use `App.message` after mounting `<App />`.
5. **Locale mismatch with Day.js.** Setting `locale={zhCN}` without also calling `dayjs.locale('zh-cn')` results in mixed-language `DatePicker` headers. Always import the matching `dayjs/locale/*` file.
6. **Motion overrides clash with Framer Motion.** AntD components run their own enter/exit transitions via `motionDurationMid`. If you wrap a Modal or Drawer in `<motion.div>` you'll get double-animations. Either set `transitionName=""` on the AntD component or skip the FM wrapper.
7. **Token literals vs. CSS variables.** Seed tokens (`colorPrimary`, `colorBgBase`, `colorTextBase`, `colorError`, `colorSuccess`, `colorWarning`, `colorInfo`) MUST be hex strings — they feed AntD's color generator which can't parse `var()`. Component-level tokens (e.g. `Table.headerBg`) accept any CSS color and work fine with `var(--df-...)`.
8. **`compactAlgorithm` shrinks defaults.** It reduces `controlHeight` from 32 → 28 and trims paddings. Pair with explicit `controlHeight: 36` (as we do) to keep tap targets ≥ 36 px on touch devices.
9. **`reduce-motion` is not automatic.** AntD respects `prefers-reduced-motion: reduce` only for built-in motion presets. For your own DF overrides, gate animations with the media query in your global CSS (see `references/00-dark-tokens.md`).
10. **Tree-shaking icons.** Always `import { GithubOutlined } from '@ant-design/icons'` — never `import * as Icons from '@ant-design/icons'`. The latter pulls in the entire 800+ icon set (~700 KB gzipped).
11. **`cssVar` and selector specificity.** `cssVar: { key: 'nx-antd' }` writes tokens to `[data-prefix=nx-antd]` instead of inline styles. If your global stylesheet defines `body { color: ... }` with higher specificity, AntD components inherit your value, not the theme. Scope global rules with `:where()` or use `!important` sparingly on the AntD layer.
12. **Form ref types.** Always type `Form.useForm<T>()` with the form values interface — without it, `form.getFieldsValue()` returns `unknown` and `form.setFieldsValue` accepts anything.

---

## Cross-References

- **Best fit pattern:** Admin / dashboard / data-heavy panels — the AntD table, form, and menu primitives are the densest in the React ecosystem and pair naturally with DF AMOLED chrome. See `references/patterns/dashboard.md` and `references/patterns/admin-panel.md` (if present in your skill bundle).
- **Data tables:** Use this file's `DeploymentsTable` as the AntD baseline; for virtualized 10k+ row tables, swap in TanStack Table inside an AntD `<Card>` shell.
- **Forms with validation:** Pair AntD `<Form />` with Zod via `@hookform/resolvers` only if you need cross-form schemas; otherwise AntD's built-in `rules` and `validator` cover 90% of cases.
- **Charts:** AntD has no native chart primitive. Pair with `@ant-design/charts` (G2 under the hood) or recharts; pass `theme={{ background: 'transparent' }}` so the AMOLED layer shows through.
- **Tokens of last resort:** When AntD has no exposed token for the surface you want to style (e.g. `Drawer` mask), fall back to `styles={{ mask: { ... } }}` semantic-DOM overrides — supported on every overlay component since v5.10.
- **Companion references:**
  - `references/00-dark-tokens.md` — the DF token system this file maps from.
  - `references/08-shadcn-dark.md` — the alternative when a project does **not** include `antd`.
  - `references/17-skeleton-system.md` — drop-in skeletons that match the shape of AntD `Card`, `Table`, and `List` while data loads.
