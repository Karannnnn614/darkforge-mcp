---
name: 25-float-ui
description: Float UI — multi-framework section templates (React, Vue, Svelte, plain HTML). Pre-styled hero/pricing/testimonial blocks. Use when project is non-React, or when copy-paste section templates beat hand-rolling.
---

# Float UI — Darkforge Integration (Multi-framework)

> **Multi-framework section templates.** Float UI ships hero, pricing, testimonial, feature-grid, and CTA blocks as **copy-paste snippets in React, Vue, Svelte, and plain HTML**. Rare in this space — most libraries are React-only. Use when the project is Svelte, plain HTML, or when copy-paste sections beat hand-rolling.

## Source-of-truth caveat

Generated from training-data recall (Jan 2026 cutoff). `context7` + `WebFetch` were denied at generation time. Float UI is a snippet library — the *page structure* changes faster than docs. Class names and component shapes drift between weeks. `// VERIFY:` markers flag every section name worth re-reading. Cross-check `https://floatui.com` for the live snippet code before copying.

## Contents

- [When to reach for Float UI](#when-to-reach-for-float-ui)
- [DF tokens are framework-agnostic](#df-tokens-are-framework-agnostic)
- [Worked examples (per framework)](#worked-examples-per-framework)
- [Multi-framework strategy](#multi-framework-strategy)
- [Pitfalls](#pitfalls)
- [Cross-references](#cross-references)

---

## When to reach for Float UI

| Brief | Pick |
|---|---|
| "Plain HTML landing page, no framework" | Float UI HTML snippets |
| "Svelte project, marketing site" | Float UI Svelte snippets |
| "Vue project, animated marketing surfaces" | `references/24-inspira-ui.md` (richer Vue patterns) |
| "React project, animated hero" | `references/04-aceternity.md` (richer React patterns) |
| "I need a pricing section, fast, in any stack" | Float UI |

Float UI's strength is **breadth of frameworks**, not depth. Inspira UI and Aceternity outpace it within their respective ecosystems.

## DF tokens are framework-agnostic

CSS custom properties work in every framework Float UI targets. The token block below goes in:
- React/Next.js: `app/globals.css`
- Vue/Nuxt: `assets/css/tokens.css` (registered in `nuxt.config.ts`)
- SvelteKit: `src/app.css`
- Plain HTML: a `<style>` block in `<head>` or `tokens.css` linked

```css
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
  margin: 0;
}
```

## Worked examples (per framework)

### 1. Hero — React (JSX)

```tsx
export function Hero() {
  return (
    <section
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '120px 24px',
        background: 'var(--df-bg-base)',
        gap: 24,
      }}
    >
      <h1 style={{ fontSize: 'clamp(48px, 8vw, 92px)', color: 'var(--df-text-primary)', margin: 0 }}>
        Ship sections, fast.
      </h1>
      <p style={{ color: 'var(--df-text-secondary)', maxWidth: 540, fontSize: 18 }}>
        Float UI templates wired to DF tokens. Works in React, Vue, Svelte, HTML.
      </p>
      <a
        href="#install"
        style={{
          alignSelf: 'flex-start',
          padding: '14px 28px',
          background: 'var(--df-neon-violet)',
          color: '#000',
          borderRadius: 'var(--df-radius-md)',
          textDecoration: 'none',
          fontWeight: 600,
          boxShadow: 'var(--df-glow-violet)',
        }}
      >
        Get started
      </a>
    </section>
  )
}
```

### 2. Hero — Vue 3

```vue
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
    <h1 :style="{ fontSize: 'clamp(48px, 8vw, 92px)', color: 'var(--df-text-primary)', margin: 0 }">
      Ship sections, fast.
    </h1>
    <p :style="{ color: 'var(--df-text-secondary)', maxWidth: '540px', fontSize: '18px' }">
      Float UI templates wired to DF tokens. Works in React, Vue, Svelte, HTML.
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
      Get started
    </a>
  </section>
</template>
```

### 3. Hero — Svelte

```svelte
<section
  style:min-height="100vh"
  style:display="flex"
  style:flex-direction="column"
  style:justify-content="center"
  style:padding="120px 24px"
  style:background="var(--df-bg-base)"
  style:gap="24px"
>
  <h1 style:font-size="clamp(48px, 8vw, 92px)" style:color="var(--df-text-primary)" style:margin="0">
    Ship sections, fast.
  </h1>
  <p style:color="var(--df-text-secondary)" style:max-width="540px" style:font-size="18px">
    Float UI templates wired to DF tokens.
  </p>
  <a
    href="#install"
    style:align-self="flex-start"
    style:padding="14px 28px"
    style:background="var(--df-neon-violet)"
    style:color="#000"
    style:border-radius="var(--df-radius-md)"
    style:text-decoration="none"
    style:font-weight="600"
    style:box-shadow="var(--df-glow-violet)"
  >
    Get started
  </a>
</section>
```

### 4. Hero — Plain HTML

```html
<section class="nx-hero">
  <h1>Ship sections, fast.</h1>
  <p>Float UI templates wired to DF tokens. Works in React, Vue, Svelte, HTML.</p>
  <a href="#install" class="nx-cta">Get started</a>
</section>

<style>
  .nx-hero {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 120px 24px;
    background: var(--df-bg-base);
    gap: 24px;
  }
  .nx-hero h1 {
    font-size: clamp(48px, 8vw, 92px);
    color: var(--df-text-primary);
    margin: 0;
  }
  .nx-hero p {
    color: var(--df-text-secondary);
    max-width: 540px;
    font-size: 18px;
  }
  .nx-cta {
    align-self: flex-start;
    padding: 14px 28px;
    background: var(--df-neon-violet);
    color: #000;
    border-radius: var(--df-radius-md);
    text-decoration: none;
    font-weight: 600;
    box-shadow: var(--df-glow-violet);
  }
  @media (prefers-reduced-motion: reduce) {
    .nx-cta { transition: none; }
  }
</style>
```

### 5. Pricing — React

```tsx
const TIERS = [
  { name: 'Starter', price: '$0', features: ['1 user', 'Community support'] },
  { name: 'Pro', price: '$29', features: ['10 users', 'Email support', 'API access'], highlight: true },
  { name: 'Team', price: '$99', features: ['Unlimited users', 'Priority support', 'SSO'] },
]

export function Pricing() {
  return (
    <section style={{ padding: '80px 24px', background: 'var(--df-bg-base)' }}>
      <div
        style={{
          display: 'grid',
          gap: 16,
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          maxWidth: 1100,
          margin: '0 auto',
        }}
      >
        {TIERS.map((tier) => (
          <article
            key={tier.name}
            style={{
              padding: 32,
              background: tier.highlight ? 'var(--df-glass-bg)' : 'var(--df-bg-elev-1)',
              border: tier.highlight
                ? '1px solid var(--df-neon-violet)'
                : '1px solid var(--df-border-subtle)',
              borderRadius: 'var(--df-radius-lg)',
              boxShadow: tier.highlight ? 'var(--df-glow-violet)' : 'none',
            }}
          >
            <h3 style={{ color: 'var(--df-text-primary)', margin: 0 }}>{tier.name}</h3>
            <p style={{ color: 'var(--df-neon-violet)', fontSize: 36, fontWeight: 600, margin: '8px 0' }}>
              {tier.price}
            </p>
            <ul style={{ padding: 0, listStyle: 'none', color: 'var(--df-text-secondary)' }}>
              {tier.features.map((f) => (
                <li key={f} style={{ padding: '6px 0' }}>{f}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  )
}
```

### 6. Testimonial — Plain HTML

```html
<figure class="nx-testimonial">
  <blockquote>
    "Switched to Darkforge on a Friday, shipped a dark dashboard by Monday."
  </blockquote>
  <figcaption>
    <strong>Jamie Chen</strong>
    <span>Engineer, Acme</span>
  </figcaption>
</figure>

<style>
  .nx-testimonial {
    max-width: 640px;
    margin: 80px auto;
    padding: 48px;
    background: var(--df-glass-bg);
    border: 1px solid var(--df-glass-border);
    border-radius: var(--df-radius-lg);
    backdrop-filter: blur(10px);
    text-align: center;
  }
  .nx-testimonial blockquote {
    color: var(--df-text-primary);
    font-size: 24px;
    line-height: 1.5;
    margin: 0 0 24px;
    font-style: normal;
  }
  .nx-testimonial strong { color: var(--df-neon-violet); display: block; }
  .nx-testimonial span { color: var(--df-text-tertiary); font-size: 14px; }
</style>
```

### 7. Feature grid — Svelte

```svelte
<script>
  const features = [
    { title: 'Stack-aware', body: 'Works in React, Vue, Svelte, HTML.' },
    { title: 'AMOLED dark', body: 'Pure black, neon accents.' },
    { title: 'Reduced motion', body: 'Every animation guarded.' },
  ]
</script>

<div class="grid">
  {#each features as f}
    <article>
      <h3>{f.title}</h3>
      <p>{f.body}</p>
    </article>
  {/each}
</div>

<style>
  .grid {
    display: grid;
    gap: 16px;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    padding: 24px;
  }
  article {
    padding: 24px;
    background: var(--df-bg-elev-1);
    border: 1px solid var(--df-border-subtle);
    border-radius: var(--df-radius-lg);
  }
  h3 { color: var(--df-text-primary); margin: 0; }
  p { color: var(--df-text-secondary); }
</style>
```

## Multi-framework strategy

When you copy a Float UI snippet:

1. Check whether Darkforge has a richer reference for that framework. React → `04-aceternity.md`. Vue → `24-inspira-ui.md`. If yes, prefer those.
2. If not (Svelte, plain HTML), Float UI is the right pick.
3. **Always** strip Float UI's hardcoded `bg-gray-900` / hex colors and replace with `var(--df-*)` tokens.
4. Add the reduced-motion CSS guard to any animation block.

## Pitfalls

| Pitfall | Fix |
|---|---|
| Float UI snippets ship with hardcoded `bg-gray-900` Tailwind classes | Replace with inline style `style={{ background: 'var(--df-bg-base)' }}` or Tailwind arbitrary `bg-[var(--df-bg-base)]` |
| Snippet uses `text-purple-400` for accents | Replace with `var(--df-neon-violet)` — never hardcode hex |
| Plain HTML version ships without reduced-motion guard | Add `@media (prefers-reduced-motion: reduce)` block manually |
| Cross-framework copy-paste loses keyboard semantics | Float UI's `<a class="btn">` is a link — wrap in `<button>` if it triggers JS, never the reverse |
| Pricing card height inconsistent at small viewports | Ensure each `<article>` has the same `padding` and `min-height` — Float UI's snippet ships with `auto`, which uneven content breaks |

## Cross-references

- `references/04-aceternity.md` — richer React patterns (prefer for React)
- `references/24-inspira-ui.md` — richer Vue patterns (prefer for Vue)
- `references/00-dark-tokens.md` — DF token block (works in every framework)
- `references/12-tailwind-v4.md` — Tailwind setup if framework supports it
- `references/patterns/dashboard-shell.md` — composition recipes
