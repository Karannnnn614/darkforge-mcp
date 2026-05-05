
## Contents

- [Source-of-truth caveat](#source-of-truth-caveat)
- [How to use this file](#how-to-use-this-file)
- [linear.app — scroll-driven gradient mesh](#linearapp-scroll-driven-gradient-mesh)
- [stripe.com — magnetic CTA + pinned scroll sections](#stripecom-magnetic-cta-pinned-scroll-sections)
- [vercel.com — geometric mesh hero + ⌘K command bar](#vercelcom-geometric-mesh-hero-k-command-bar)
- [raycast.com — animated icon arrays + snappy springs](#raycastcom-animated-icon-arrays-snappy-springs)
- [framer.com — layout animations + sticky scroll glass showcases](#framercom-layout-animations-sticky-scroll-glass-showcases)
- [arc.net — playful spring bounce + saturated gradient hero](#arcnet-playful-spring-bounce-saturated-gradient-hero)
- [resend.com — minimalist dark + monospace labels + narrow column](#resendcom-minimalist-dark-monospace-labels-narrow-column)
- [anthropic.com — restrained type + cream/amber accents + slow fades](#anthropiccom-restrained-type-creamamber-accents-slow-fades)
- [Picking the right anchor](#picking-the-right-anchor)

---

---
name: inspiration-tour
description: Named real-world sites and the techniques they use, so generation can anchor to known references.
---

# Inspiration Tour — technique anchors from real sites

Use this when a user says "make it look like X" or describes a vibe that matches a known site. Each entry names the technique, points to the Darkforge reference that implements it, and gives a recipe.

---

## Source-of-truth caveat

These entries describe **techniques** observed across publicly visible marketing surfaces of the named sites, captured from training-data exposure as of January 2026. Live sites are updated frequently — by the time you read this, Linear may have swapped its mesh, Vercel may have re-tuned its hero, Arc may have re-skinned its homepage entirely. Treat each entry as a **named pattern** ("the Linear violet-mesh look") rather than a current screenshot. **Never scrape, copy, or attempt pixel-parity** with these sites — the goal is to translate a *vibe* into Darkforge tokens. If the user wants exactly what site X looks like today, ask them to share a screenshot and adapt from there.

---

## How to use this file

1. **Match the user's intent.** "Make a hero like Linear" → linear.app entry. "Vercel-style command palette" → vercel.com entry. "Stripe scroll feel" → stripe.com entry.
2. **Cross-reference the recommended Darkforge file.** Each entry names the single strongest reference in our library that implements the technique. Pull the canonical implementation from there, not from the recipe sketch — the sketch is a 10-line orientation, not the production component.
3. **Generate using DF tokens only.** All code uses `var(--df-*)` tokens defined in `references/00-dark-tokens.md`. Sites with non-AMOLED palettes (Anthropic's cream, Raycast's cyan-forward) get translated into our token system — note the mapping inline.

---

## linear.app — scroll-driven gradient mesh

**The vibe**: ambient violet glow over true-black, drifts as you scroll, never overpowers content.

**The technique**: A fixed-position blurred radial-gradient layer with `mix-blend-mode: screen`, animated via scroll progress on a single `background-position` axis. Hero text sits above with `z-index` separation. The mesh is always *behind* — it tints, it never competes.

**Darkforge reference**: `references/02-gsap.md` (ScrollTrigger-driven background drift; pair with `--df-glow-violet-lg`).

**Recipe**:
```tsx
'use client'
import { useScroll, useTransform, motion, useReducedMotion } from 'framer-motion'

export function LinearMesh() {
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll()
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '40%'])
  return (
    <motion.div aria-hidden style={{ y: reduce ? 0 : y }}
      className="pointer-events-none fixed inset-0 -z-10 [mix-blend-mode:screen]
                 bg-[radial-gradient(60%_50%_at_50%_20%,rgba(167,139,250,0.35),transparent_70%)]
                 bg-[var(--df-bg-base)]" />
  )
}
```

**Why it works**: True-black backdrop, single neon hue (violet via `--df-neon-violet`), motion subordinate to content. AMOLED-friendly — the screen only lights pixels that need lighting.

---

## stripe.com — magnetic CTA + pinned scroll sections

**The vibe**: cursor *pulls* the primary button toward it on hover; long marketing pages feel like a slideshow rather than a scroll because each section pins.

**The technique**: Magnetic-cursor follow uses `pointermove` to translate the button toward `(clientX, clientY)` by a small percentage (0.15–0.25) of the offset, eased back on leave. Pinned sections use GSAP ScrollTrigger with `pin: true` and `scrub`-driven inner animations.

**Darkforge reference**: `references/02-gsap.md` (ScrollTrigger pinning + scrub timelines is exactly this).

**Recipe**:
```tsx
'use client'
import { useRef } from 'react'
export function MagneticButton({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLButtonElement>(null)
  return (
    <button ref={ref}
      onPointerMove={(e) => {
        const r = ref.current!.getBoundingClientRect()
        const x = (e.clientX - r.left - r.width / 2) * 0.2
        const y = (e.clientY - r.top - r.height / 2) * 0.2
        ref.current!.style.transform = `translate(${x}px, ${y}px)`
      }}
      onPointerLeave={() => { ref.current!.style.transform = '' }}
      className="rounded-[var(--df-radius-full)] bg-[var(--df-neon-violet)] px-6 py-3
                 text-[var(--df-text-inverse)] shadow-[var(--df-glow-violet)]
                 transition-transform duration-300 motion-reduce:transform-none">
      {children}
    </button>
  )
}
```

**Why it works**: Magnetic pull is subtle (20% of cursor delta), so it reads as "alive" not "twitchy." Pair with `--df-glow-violet` so the button feels like a light source the cursor is drawn to.

---

## vercel.com — geometric mesh hero + ⌘K command bar

**The vibe**: angular grid/triangle mesh hero with sharp typographic hierarchy; the ⌘K command bar is the primary navigation affordance, not a side feature.

**The technique**: SVG triangulated mesh with stroke-only paths and a low-opacity radial mask. Command bar is a fixed-position, glass-blurred dialog triggered by `⌘K` / `Ctrl+K`, populated from a flat command registry.

**Darkforge reference**: `references/08-shadcn-dark.md` (the `<Command />` + `<CommandDialog />` primitives are the canonical ⌘K implementation in our stack).

**Recipe**:
```tsx
'use client'
import { useEffect, useState } from 'react'
import { CommandDialog, CommandInput, CommandList, CommandItem } from '@/components/ui/command'

export function CmdK() {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setOpen((o) => !o) }
    }
    document.addEventListener('keydown', onKey); return () => document.removeEventListener('keydown', onKey)
  }, [])
  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command..." />
      <CommandList><CommandItem>Go to dashboard</CommandItem></CommandList>
    </CommandDialog>
  )
}
```

**Why it works**: A discoverable shortcut (`⌘K`) replaces 80% of the navbar surface area. Tokens: `--df-bg-overlay` for the dialog scrim, `--df-glass-bg-md` for the command panel, `--df-font-display` for the hero headline weight.

---

## raycast.com — animated icon arrays + snappy springs

**The vibe**: a wall of crisp app icons that subtly bob, glow, and rotate in sequence; cyan-forward accent palette over deep dark.

**The technique**: Each icon is a `motion.div` with a stagger-delayed `y`/`scale`/`rotate` spring loop. The springs are snappy (high stiffness, low damping ratio) so they feel mechanical rather than floaty. Cyan replaces violet as the dominant accent.

**Darkforge reference**: `references/13-react-spring.md` (snappy springs + `useSprings` for arrays of items).

**Recipe**:
```tsx
'use client'
import { useSprings, animated } from '@react-spring/web'
import { useEffect } from 'react'

export function IconWall({ icons }: { icons: React.ReactNode[] }) {
  const [springs, api] = useSprings(icons.length, (i) => ({ y: 0, scale: 1, delay: i * 60 }))
  useEffect(() => {
    api.start((i) => ({ to: async (next) => {
      await next({ y: -6, scale: 1.04 }); await next({ y: 0, scale: 1 })
    }, loop: true, config: { tension: 380, friction: 14 }, delay: i * 60 }))
  }, [api])
  return (
    <div className="grid grid-cols-6 gap-4">
      {springs.map((s, i) => (
        <animated.div key={i} style={s}
          className="grid h-14 w-14 place-items-center rounded-[var(--df-radius-md)]
                     bg-[var(--df-bg-elevated)] text-[var(--df-neon-cyan)]
                     shadow-[var(--df-glow-cyan)]">{icons[i]}</animated.div>
      ))}
    </div>
  )
}
```

**Why it works**: Stagger + snappy springs read as "system alive, ready to launch." Cyan accent (`--df-neon-cyan`) over `--df-bg-elevated` keeps the AMOLED contract while pivoting the brand hue.

---

## framer.com — layout animations + sticky scroll glass showcases

**The vibe**: UI panels glide between layouts as you scroll, glass cards stack and unstack, every transition feels native to the canvas (because the company makes the canvas).

**The technique**: `layoutId` on shared elements lets Framer Motion auto-tween between two states. Pair with sticky-positioned section containers so a single composition stays fixed while inner contents swap layouts on scroll.

**Darkforge reference**: `references/01-framer-motion.md` (`layoutId` shared-element morphs + `LayoutGroup`).

**Recipe**:
```tsx
'use client'
import { motion, useReducedMotion } from 'framer-motion'
import { useState } from 'react'

export function GlassMorph() {
  const [open, setOpen] = useState(false)
  const reduce = useReducedMotion()
  return (
    <div className="sticky top-20 grid place-items-center" onClick={() => setOpen(!open)}>
      <motion.div layout={!reduce} layoutId="glass-card" transition={{ type: 'spring', stiffness: 180, damping: 22 }}
        className={`backdrop-blur-xl border border-[var(--df-glass-border-md)] bg-[var(--df-glass-bg-md)]
                    rounded-[var(--df-radius-xl)] ${open ? 'h-80 w-[28rem]' : 'h-24 w-64'} p-6`}>
        <span className="text-[var(--df-text-primary)]">Click to morph</span>
      </motion.div>
    </div>
  )
}
```

**Why it works**: `layout` does the math — no manual width/height tweens. Glass tokens (`--df-glass-bg-md`, `--df-glass-border-md`) keep the surface translucent over whatever sits behind.

---

## arc.net — playful spring bounce + saturated gradient hero

**The vibe**: micro-interactions overshoot before settling (spring bounce > 1), the hero gradient is loud and color-saturated, scroll-triggered reveals feel celebratory.

**The technique**: Springs configured with `bounce: 0.4–0.6` (or `damping` < `stiffness`/10 in motion-spring math). Gradient hero is a multi-stop conic or radial blend, layered with subtle grain.

**Darkforge reference**: `references/01-framer-motion.md` (overshoot springs + `whileInView` reveals are the bread-and-butter).

**Recipe**:
```tsx
'use client'
import { motion, useReducedMotion } from 'framer-motion'

export function ArcHero() {
  const reduce = useReducedMotion()
  return (
    <section className="relative min-h-[80vh] overflow-hidden bg-[var(--df-bg-base)]
                        bg-[conic-gradient(from_220deg_at_50%_30%,rgba(167,139,250,0.28),rgba(34,211,238,0.22),rgba(244,114,182,0.20),rgba(167,139,250,0.28))]">
      <motion.h1
        initial={{ y: 60, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 240, damping: 14 }}
        className="relative z-10 mx-auto max-w-3xl pt-32 text-center text-6xl font-bold text-[var(--df-text-primary)]">
        A browser that loves you back.
      </motion.h1>
    </section>
  )
}
```

**Why it works**: The conic gradient layers all three DF neons at low alpha — saturated *feeling* without abandoning AMOLED black. The overshoot spring (`damping: 14` vs `stiffness: 240`) is what reads as "playful."

---

## resend.com — minimalist dark + monospace labels + narrow column

**The vibe**: one neon accent (cyan or violet, never both), monospace section labels (`> features`, `> docs`), content clamped to a narrow reading column. Restraint as a flex.

**The technique**: A single accent token, mono font for `.eyebrow` labels, max-width ~640–720px on text content. Heavy use of generous vertical whitespace and a single horizontal divider style.

**Darkforge reference**: `references/12-tailwind-v4.md` (typography utilities + `--df-font-mono` from `00-dark-tokens.md` for labels).

**Recipe**:
```tsx
export function ResendSection() {
  return (
    <section className="bg-[var(--df-bg-base)] py-32">
      <div className="mx-auto max-w-[680px] px-6">
        <p className="font-[family-name:var(--df-font-mono)] text-xs uppercase tracking-widest
                      text-[var(--df-neon-cyan)]">
          &gt; deliverability
        </p>
        <h2 className="mt-4 text-4xl font-semibold text-[var(--df-text-primary)]">
          Email that arrives.
        </h2>
        <p className="mt-6 text-[var(--df-text-secondary)] leading-relaxed">
          One inbox provider, one accent color, zero distractions.
        </p>
      </div>
    </section>
  )
}
```

**Why it works**: Monospace eyebrow + narrow column + single accent (`--df-neon-cyan`) is the "indie dev tool" signal. Skip glow, skip motion, let the typography breathe.

---

## anthropic.com — restrained type + cream/amber accents + slow fades

**The vibe**: editorial pacing, warm-toned palette (cream paper, amber accents) instead of cool neon, scroll-fade transitions slow enough to feel deliberate.

**The technique**: Long-duration opacity/translate fades (600–1000ms) on `whileInView`, easing-out curves with no overshoot. Typographic restraint — fewer weights, larger sizes, ample line-height.

**Token translation note**: Anthropic's cream isn't a Darkforge default — map it to `--df-text-secondary` on a warm-tinted surface, with `--df-neon-amber` as the single accent. This is a *translation*, not a 1:1: Darkforge stays AMOLED-first; "Anthropic-inspired" here means *restraint + warm accent*, not *light mode*.

**Darkforge reference**: `references/01-framer-motion.md` (`whileInView` with custom slow easing + `viewport` once).

**Recipe**:
```tsx
'use client'
import { motion, useReducedMotion } from 'framer-motion'

export function EditorialFade({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-15% 0px' }}
      transition={reduce ? { duration: 0 } : { duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="mx-auto max-w-[640px] py-24 text-[var(--df-text-secondary)]
                 [&_h2]:text-[var(--df-text-primary)] [&_h2]:text-5xl [&_h2]:font-medium
                 [&_strong]:text-[var(--df-neon-amber)]">
      {children}
    </motion.div>
  )
}
```

**Why it works**: 800ms duration + `--df-ease-out` curve reads as "considered" — most landing pages animate in 300ms and feel rushed in comparison. Amber on near-black gives the warm-accent signal without abandoning AMOLED.

---

## Picking the right anchor

| User says... | Anchor | Primary reference |
|---|---|---|
| "Linear-style hero" | linear.app | `02-gsap.md` |
| "Stripe scroll feel" | stripe.com | `02-gsap.md` |
| "Vercel landing / ⌘K" | vercel.com | `08-shadcn-dark.md` |
| "Raycast-y, lots of icons" | raycast.com | `13-react-spring.md` |
| "Framer-style morphing UI" | framer.com | `01-framer-motion.md` |
| "Arc browser playfulness" | arc.net | `01-framer-motion.md` |
| "Resend minimalism" | resend.com | `12-tailwind-v4.md` |
| "Anthropic / editorial" | anthropic.com | `01-framer-motion.md` |

> Anchor first, then layer. Don't try to combine four sites' techniques on one page — pick one as the spine, borrow at most one micro-interaction from a second. The pattern files in `references/patterns/` (hero, dashboard, pricing, etc.) are where these anchors get composed into shippable sections.
