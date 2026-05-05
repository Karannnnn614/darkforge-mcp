---
name: 24-inspira-ui
description: Inspira UI — Vue 3 / Nuxt equivalent of Aceternity. shadcn-vue compatible, @vueuse/motion powered. First Vue reference in Darkforge. Use when project is Vue/Nuxt and brief calls for animated marketing surfaces.
---

# Inspira UI — Darkforge Integration (Vue)

> **Vue ecosystem's answer to Aceternity.** First Vue reference in Darkforge. Built on Vue 3 + `<script setup>`, Tailwind, and `@vueuse/motion`. Pairs naturally with `shadcn-vue` for primitives. Use when the project is Vue/Nuxt — most of Darkforge is React-first, this opens the door for Vue users.

## Source-of-truth caveat

Generated from training-data recall (Jan 2026 cutoff). `context7` + `WebFetch` were denied at generation time. Inspira UI is a youthful project (forked the Aceternity vibe in 2024) — component names, slot conventions, and prop signatures all drift between minor releases. `// VERIFY:` markers flag every prop and slot worth re-reading. Cross-check `https://inspira-ui.com` before shipping.

**Vue support is partial in Darkforge v1.1.** This file is the only Vue-targeted reference; the rest of the plugin assumes React. Treat Vue support as "ecosystem expansion" — the brand stays React-first.

## Contents

- [When to reach for Inspira UI](#when-to-reach-for-inspira-ui)
- [Install / Setup (Vue 3 + Nuxt)](#install--setup-vue-3--nuxt)
- [DF tokens in Vue — they just work](#df-tokens-in-vue--they-just-work)
- [Worked examples](#worked-examples)
- [Reduced-motion in Vue](#reduced-motion-in-vue)
- [Pairing with shadcn-vue](#pairing-with-shadcn-vue)
- [Pitfalls](#pitfalls)
- [Cross-references](#cross-references)

---

## When to reach for Inspira UI

| Brief | Pick |
|---|---|
| "Vue/Nuxt project, marketing site, animated hero" | Inspira UI |
| "Vue/Nuxt project, primitive components" | shadcn-vue (cross-ref `references/08-shadcn-dark.md` for dark theming) |
| "React project, animated hero" | `references/04-aceternity.md` |
| "Vue project, scroll engine" | `references/26-lenis-smooth-scroll.md` (framework-agnostic) |

If the project is React, **never** pull from Inspira UI — copy the equivalent from Aceternity instead.

## Install / Setup (Vue 3 + Nuxt)

```bash
# VERIFY: Inspira UI ships as either copy-paste snippets (preferred) or an npm package.
# Check the live docs first; the snippet path is what most projects use.
npm i @vueuse/motion @vueuse/core
```

For Nuxt 3:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: [
    '@vueuse/motion/nuxt',
    '@nuxtjs/tailwindcss',
  ],
  css: ['~/assets/css/tokens.css'], // DF tokens
})
```

```css
/* assets/css/tokens.css */
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

html, body {
  background: var(--df-bg-base);
  color: var(--df-text-primary);
}
```

## DF tokens in Vue — they just work

CSS custom properties are framework-agnostic. The same `var(--df-neon-violet)` that drives React components in this plugin drives Vue components here. No bridge layer needed.

For runtime token resolution (e.g. WebGL color args), use `getComputedStyle` exactly like in React:

```ts
// composables/useNxToken.ts
export function useNxToken(name: string) {
  if (typeof window === 'undefined') return ''
  return getComputedStyle(document.documentElement).getPropertyValue(`--df-${name}`).trim()
}
```

## Worked examples

### 1. Hero with motion

```vue
<!-- components/HeroInspira.vue -->
<script setup lang="ts">
import { useReducedMotion } from '@vueuse/motion'
const reduced = useReducedMotion()
</script>

<template>
  <section
    :style="{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: '120px 24px',
      background: 'var(--df-bg-base)',
      gap: '24px',
    }"
  >
    <h1
      v-motion="reduced ? undefined : {
        initial: { opacity: 0, y: 40 },
        enter: { opacity: 1, y: 0, transition: { duration: 800 } },
      }"
      :style="{
        fontSize: 'clamp(48px, 8vw, 92px)',
        color: 'var(--df-text-primary)',
        margin: 0,
      }"
    >
      Vue meets Darkforge.
    </h1>
    <p
      v-motion="reduced ? undefined : {
        initial: { opacity: 0, y: 20 },
        enter: { opacity: 1, y: 0, transition: { duration: 600, delay: 200 } },
      }"
      :style="{ color: 'var(--df-text-secondary)', fontSize: '18px', maxWidth: '540px' }"
    >
      First Vue reference. Same DF tokens, same dark-first defaults.
    </p>
    <a
      href="#install"
      :style="{
        alignSelf: 'flex-start',
        padding: '14px 28px',
        background: 'var(--df-neon-violet)',
        color: '#000',
        borderRadius: 'var(--df-radius-md)',
        textDecoration: 'none',
        fontWeight: 600,
        boxShadow: 'var(--df-glow-violet)',
      }"
    >
      Install
    </a>
  </section>
</template>
```

### 2. Animated text reveal

```vue
<script setup lang="ts">
defineProps<{ text: string }>()
</script>

<template>
  <h2 :style="{ color: 'var(--df-text-primary)', fontSize: '36px', margin: 0 }">
    <span
      v-for="(word, i) in text.split(' ')"
      :key="i"
      v-motion="{
        initial: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 400, delay: i * 60 } },
      }"
      :style="{ display: 'inline-block', marginRight: '0.25em' }"
    >
      {{ word }}
    </span>
  </h2>
</template>
```

### 3. Card grid with stagger

```vue
<script setup lang="ts">
const features = [
  { title: 'AMOLED dark', body: 'Pure black backgrounds, neon accents.' },
  { title: 'Vue + React', body: 'DF tokens work in both.' },
  { title: 'Animated by default', body: 'Motion built in, reduced-motion respected.' },
]
</script>

<template>
  <div
    :style="{
      display: 'grid',
      gap: '16px',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      padding: '24px',
    }"
  >
    <article
      v-for="(f, i) in features"
      :key="f.title"
      v-motion="{
        initial: { opacity: 0, y: 24 },
        visible: { opacity: 1, y: 0, transition: { duration: 500, delay: i * 80 } },
      }"
      :style="{
        padding: '24px',
        background: 'var(--df-glass-bg)',
        border: '1px solid var(--df-glass-border)',
        borderRadius: 'var(--df-radius-lg)',
        backdropFilter: 'blur(10px)',
      }"
    >
      <h3 :style="{ color: 'var(--df-text-primary)', margin: 0 }">{{ f.title }}</h3>
      <p :style="{ color: 'var(--df-text-secondary)' }">{{ f.body }}</p>
    </article>
  </div>
</template>
```

### 4. Glow card with hover

```vue
<script setup lang="ts">
import { ref } from 'vue'
const hovered = ref(false)
</script>

<template>
  <div
    @mouseenter="hovered = true"
    @mouseleave="hovered = false"
    :style="{
      padding: '32px',
      background: 'var(--df-bg-elev-1)',
      border: '1px solid var(--df-border-subtle)',
      borderRadius: 'var(--df-radius-lg)',
      transition: 'box-shadow 300ms ease, border-color 300ms ease',
      boxShadow: hovered ? 'var(--df-glow-violet)' : 'none',
      borderColor: hovered ? 'var(--df-neon-violet)' : 'var(--df-border-subtle)',
    }"
  >
    <h3 :style="{ color: 'var(--df-text-primary)' }">Hover me</h3>
    <p :style="{ color: 'var(--df-text-secondary)' }">Glow on hover, DF-token driven.</p>
  </div>
</template>
```

### 5. Animated number counter

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useIntersectionObserver } from '@vueuse/core'

const props = defineProps<{ to: number; suffix?: string }>()
const display = ref(0)
const target = ref<HTMLElement | null>(null)

onMounted(() => {
  const { stop } = useIntersectionObserver(
    target,
    ([entry]) => {
      if (!entry.isIntersecting) return
      const start = performance.now()
      const duration = 1200
      const tick = (now: number) => {
        const t = Math.min((now - start) / duration, 1)
        const eased = 1 - Math.pow(1 - t, 3)
        display.value = Math.round(eased * props.to)
        if (t < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
      stop()
    },
    { threshold: 0.3 },
  )
})
</script>

<template>
  <span
    ref="target"
    :style="{
      color: 'var(--df-neon-violet)',
      fontSize: '48px',
      fontWeight: 600,
      fontVariantNumeric: 'tabular-nums',
    }"
  >
    {{ display.toLocaleString() }}{{ suffix || '' }}
  </span>
</template>
```

### 6. Marquee strip (Vue)

```vue
<script setup lang="ts">
const items = ['Stripe', 'Linear', 'Vercel', 'Anthropic', 'Notion']
</script>

<template>
  <div
    :style="{
      overflow: 'hidden',
      background: 'var(--df-bg-elev-1)',
      borderTop: '1px solid var(--df-border-subtle)',
      borderBottom: '1px solid var(--df-border-subtle)',
      padding: '24px 0',
      maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
    }"
    aria-label="Trusted by"
  >
    <div
      :style="{
        display: 'flex',
        gap: '64px',
        width: 'max-content',
        animation: 'nx-marquee 30s linear infinite',
      }"
    >
      <span
        v-for="(brand, i) in [...items, ...items]"
        :key="i"
        :style="{
          color: 'var(--df-text-secondary)',
          fontSize: '24px',
          fontWeight: 500,
          whiteSpace: 'nowrap',
        }"
      >
        {{ brand }}
      </span>
    </div>
  </div>
</template>

<style scoped>
@keyframes nx-marquee {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}
@media (prefers-reduced-motion: reduce) {
  div[aria-label] > div {
    animation: none !important;
  }
}
</style>
```

## Reduced-motion in Vue

```ts
// composables/useReducedMotion.ts
import { ref, onMounted } from 'vue'

export function useReducedMotion() {
  const reduced = ref(false)
  onMounted(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    reduced.value = mq.matches
    mq.addEventListener('change', (e) => (reduced.value = e.matches))
  })
  return reduced
}
```

Use the `prefers-reduced-motion` CSS guard for pure-CSS animations as a belt-and-suspenders fallback (see the marquee example above).

## Pairing with shadcn-vue

shadcn-vue is the canonical primitive layer for Vue projects. Inspira UI sits on top of it the same way Aceternity sits on shadcn in React.

```vue
<script setup lang="ts">
import { Button } from '@/components/ui/button' // shadcn-vue
import HeroInspira from '@/components/HeroInspira.vue'
</script>

<template>
  <HeroInspira>
    <Button
      :style="{
        background: 'var(--df-neon-violet)',
        color: '#000',
        boxShadow: 'var(--df-glow-violet)',
      }"
    >
      Get started
    </Button>
  </HeroInspira>
</template>
```

## Pitfalls

| Pitfall | Fix |
|---|---|
| `v-motion` directive not registered | Install the `@vueuse/motion/nuxt` module (Nuxt) or `MotionPlugin` (vanilla Vue 3) |
| Animation runs on SSR and flickers on hydration | Wrap motion-only content in `<ClientOnly>` (Nuxt) — Inspira components hydrate client-side |
| DF tokens don't apply in Vue components | CSS vars are global; ensure `tokens.css` is loaded in `nuxt.config.ts` `css` array |
| `style` binding loses object syntax in `<script setup>` | Use `:style="{ ... }"` shorthand; computed styles need `computed(() => ({ ... }))` |
| Reduced-motion not respected | Always check the composable; v-motion's `initial`/`enter` props don't respect `prefers-reduced-motion` automatically |

## Cross-references

- `references/04-aceternity.md` — React equivalent; copy the *idea* across frameworks
- `references/00-dark-tokens.md` — DF token system (works identically in Vue)
- `references/08-shadcn-dark.md` — shadcn-vue pairing pattern
- `references/12-tailwind-v4.md` — Tailwind setup (works in Nuxt with `@nuxtjs/tailwindcss`)
- `references/01-framer-motion.md` — for the React-side conceptual mapping (`v-motion` ≈ `motion.div`)
