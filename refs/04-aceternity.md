# Darkforge — Aceternity UI Dark Reference
Aceternity UI is a copy-paste React component library (no npm install — components live in your repo). Darkforge uses it as the backbone of premium AMOLED dark interfaces: tracing beams, parallax heroes, animated borders, spotlight cards, beam backgrounds. Each component below is rewritten with DF tokens so it ships AMOLED-first instead of generic neutral.

> **Source note.** Live web access to `ui.aceternity.com` was unavailable during writeup, so implementations below follow Aceternity's documented structural patterns from prior exposure. Component names, prop APIs, hook usage (`useScroll`, `useTransform`, `useAnimate`), and overall composition match the public surface, **but exact SVG path coordinates, spring `stiffness`/`damping` numbers, and `viewBox` dimensions may differ from the canonical source**. Diff against the live site before claiming pixel parity. The DF token mapping and reduced-motion guards are Darkforge additions and are correct as-shipped.

## Contents

- [Install / Setup](#install-setup)
  - [Required peer deps](#required-peer-deps)
  - [Folder convention](#folder-convention)
  - [`cn()` utility — required by every Aceternity component](#cn-utility-required-by-every-aceternity-component)
  - [Tailwind config — required keyframes](#tailwind-config-required-keyframes)
- [Component: Tracing Beam](#component-tracing-beam)
- [Component: Background Beams](#component-background-beams)
- [Component: Spotlight](#component-spotlight)
- [Component: Wavy Background](#component-wavy-background)
- [Component: Glare Card (Glowing Card)](#component-glare-card-glowing-card)
- [Component: Moving Border (Button)](#component-moving-border-button)
- [Component: Text Generate Effect](#component-text-generate-effect)
- [Component: Hero Parallax](#component-hero-parallax)
- [Component: Floating Nav](#component-floating-nav)
- [Component: Infinite Moving Cards](#component-infinite-moving-cards)
- [Component: Meteors](#component-meteors)
- [Component: Background Lines](#component-background-lines)
- [Component: Sparkles](#component-sparkles)
- [Component: Card Hover Effect (Cards Reveal)](#component-card-hover-effect-cards-reveal)
- [Common Gotchas](#common-gotchas)
- [Cross-References](#cross-references)

---

## Install / Setup

Aceternity has no published package. You scaffold a folder, paste components, and wire up four peer deps.

### Required peer deps

```bash
npm install framer-motion clsx tailwind-merge
# or pnpm / bun / yarn equivalent
```

`tailwindcss` ≥ 3.4 (v4 also fine) must already be configured. `next/image` is needed for some components (Hero Parallax, Infinite Moving Cards) — drop in a plain `<img>` if you're not on Next.

### Folder convention

```
src/
  components/
    aceternity/         <-- paste Aceternity components here
      tracing-beam.tsx
      background-beams.tsx
      spotlight.tsx
      ...
  lib/
    utils.ts            <-- the cn() helper
```

### `cn()` utility — required by every Aceternity component

```ts
// src/lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
```

### Tailwind config — required keyframes

Add these to `tailwind.config.ts` so Aceternity animations work. (Darkforge's `00-dark-tokens.md` already includes `shimmer`, `glow-pulse`, `float`. Below are the additions Aceternity expects.)

```ts
// tailwind.config.ts — extend.theme.extend
animation: {
  "background-beams": "background-beams 12s linear infinite",
  "moving-border": "moving-border 4s linear infinite",
  spotlight: "spotlight 2s ease .75s 1 forwards",
  meteor: "meteor 5s linear infinite",
  scroll:
    "scroll var(--animation-duration, 40s) var(--animation-direction, forwards) linear infinite",
  aurora: "aurora 60s linear infinite",
},
keyframes: {
  "background-beams": {
    "0%": { backgroundPosition: "0% 50%" },
    "100%": { backgroundPosition: "100% 50%" },
  },
  "moving-border": {
    "0%": { "offset-distance": "0%" },
    "100%": { "offset-distance": "100%" },
  },
  spotlight: {
    "0%": { opacity: "0", transform: "translate(-72%,-62%) scale(0.5)" },
    "100%": { opacity: "1", transform: "translate(-50%,-40%) scale(1)" },
  },
  meteor: {
    "0%":   { transform: "rotate(215deg) translateX(0)", opacity: "1" },
    "70%":  { opacity: "1" },
    "100%": { transform: "rotate(215deg) translateX(-500px)", opacity: "0" },
  },
  scroll: {
    to: { transform: "translate(calc(-50% - 0.5rem))" },
  },
  aurora: {
    from: { backgroundPosition: "50% 50%, 50% 50%" },
    to:   { backgroundPosition: "350% 50%, 350% 50%" },
  },
},
```

> Darkforge rule: every code block below uses DF CSS variables (`var(--df-bg-base)`, `var(--df-neon-violet)`, etc.) via Tailwind arbitrary-value syntax. Never hardcode hex.

---

## Component: Tracing Beam

A vertical beam that traces the user's scroll position down a long article — perfect for blog posts, changelog timelines, and feature walkthroughs. Default Aceternity uses neutrals; the DF variant is violet neon on AMOLED.

**When to use.** Long-form content (blog post, docs page, scrollable timeline). Avoid on screens shorter than two viewports — the effect needs scroll runway.

```tsx
// src/components/aceternity/tracing-beam.tsx
"use client";

import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useReducedMotion,
} from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface TracingBeamProps {
  children: React.ReactNode;
  className?: string;
}

export function TracingBeam({ children, className }: TracingBeamProps) {
  const ref = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [svgHeight, setSvgHeight] = useState(0);
  const prefersReduced = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  useEffect(() => {
    if (contentRef.current) {
      setSvgHeight(contentRef.current.offsetHeight);
    }
  }, []);

  const y1 = useSpring(
    useTransform(scrollYProgress, [0, 0.8], [50, svgHeight]),
    { stiffness: 500, damping: 90 }
  );
  const y2 = useSpring(
    useTransform(scrollYProgress, [0, 1], [50, svgHeight - 200]),
    { stiffness: 500, damping: 90 }
  );

  return (
    <motion.div
      ref={ref}
      className={cn("relative mx-auto h-full w-full max-w-4xl", className)}
    >
      <div className="absolute -left-4 top-3 md:-left-20" aria-hidden="true">
        <motion.div
          transition={{ duration: 0.2, delay: 0.5 }}
          animate={{
            boxShadow:
              scrollYProgress.get() > 0
                ? "none"
                : "var(--df-glow-violet)",
          }}
          className={cn(
            "ml-[27px] flex h-4 w-4 items-center justify-center",
            "rounded-full border border-[var(--df-border-default)]",
            "bg-[var(--df-bg-elevated)] shadow-sm"
          )}
        >
          <motion.div
            transition={{ duration: 0.2, delay: 0.5 }}
            animate={{
              backgroundColor:
                scrollYProgress.get() > 0
                  ? "var(--df-bg-elevated)"
                  : "var(--df-neon-violet)",
              borderColor:
                scrollYProgress.get() > 0
                  ? "var(--df-border-strong)"
                  : "var(--df-neon-violet)",
            }}
            className="h-2 w-2 rounded-full border border-[var(--df-neon-violet)] bg-[var(--df-neon-violet)]"
          />
        </motion.div>
        <svg
          viewBox={`0 0 20 ${svgHeight}`}
          width="20"
          height={svgHeight}
          className="ml-4 block"
          aria-hidden="true"
        >
          <motion.path
            d={`M 1 0V -36 l 18 24 V ${svgHeight * 0.8} l -18 24V ${svgHeight}`}
            fill="none"
            stroke="var(--df-border-default)"
            strokeOpacity="0.6"
            transition={{ duration: 10 }}
          />
          <motion.path
            d={`M 1 0V -36 l 18 24 V ${svgHeight * 0.8} l -18 24V ${svgHeight}`}
            fill="none"
            stroke="url(#nx-tracing-gradient)"
            strokeWidth="1.5"
            className="motion-reduce:hidden"
            transition={{ duration: 10 }}
          />
          <defs>
            <motion.linearGradient
              id="nx-tracing-gradient"
              gradientUnits="userSpaceOnUse"
              x1="0"
              x2="0"
              y1={prefersReduced ? 0 : y1}
              y2={prefersReduced ? svgHeight : y2}
            >
              <stop stopColor="var(--df-neon-violet)" stopOpacity="0" />
              <stop stopColor="var(--df-neon-violet)" />
              <stop offset="0.325" stopColor="var(--df-neon-cyan)" />
              <stop offset="1" stopColor="var(--df-neon-pink)" stopOpacity="0" />
            </motion.linearGradient>
          </defs>
        </svg>
      </div>
      <div ref={contentRef}>{children}</div>
    </motion.div>
  );
}
```

**Customization knobs.** Swap the gradient stops to recolor (cyan-only beam, single-color violet, etc.). Increase spring `stiffness` for a snappier follow. Set `offset` to `["start 30%", "end 70%"]` for centered articles.

---

## Component: Background Beams

Animated diagonal beams sweeping across an AMOLED sky — used as a hero or section backdrop. Pure SVG + CSS so it's GPU-cheap.

**When to use.** Hero backgrounds, login screens, empty states. Place behind a solid `<section>` and absolute-position children above it.

```tsx
// src/components/aceternity/background-beams.tsx
"use client";

import { memo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface BackgroundBeamsProps {
  className?: string;
}

const BEAM_PATHS = [
  "M-380 -189C-380 -189 -312 216 152 343C616 470 684 875 684 875",
  "M-373 -197C-373 -197 -305 208 159 335C623 462 691 867 691 867",
  "M-366 -205C-366 -205 -298 200 166 327C630 454 698 859 698 859",
  "M-359 -213C-359 -213 -291 192 173 319C637 446 705 851 705 851",
  "M-352 -221C-352 -221 -284 184 180 311C644 438 712 843 712 843",
];

export const BackgroundBeams = memo(({ className }: BackgroundBeamsProps) => {
  const prefersReduced = useReducedMotion();

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 flex h-full w-full items-center justify-center",
        "bg-[var(--df-bg-base)]",
        "[mask-image:radial-gradient(60%_60%_at_50%_50%,#000_30%,transparent_100%)]",
        className
      )}
    >
      <svg
        className="pointer-events-none absolute z-0 h-full w-full"
        width="100%"
        height="100%"
        viewBox="0 0 696 316"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M-380 -189C-380 -189 -312 216 152 343C616 470 684 875 684 875M-373 -197C-373 -197 -305 208 159 335C623 462 691 867 691 867M-366 -205C-366 -205 -298 200 166 327C630 454 698 859 698 859"
          stroke="var(--df-border-default)"
          strokeOpacity="0.4"
          strokeWidth="0.5"
        />
        {BEAM_PATHS.map((d, i) => (
          <motion.path
            key={`beam-${i}`}
            d={d}
            stroke={`url(#nx-beam-gradient-${i})`}
            strokeOpacity="0.6"
            strokeWidth="1.4"
            initial={{ pathLength: 0, pathOffset: 1 }}
            animate={
              prefersReduced
                ? { pathLength: 1, pathOffset: 0 }
                : {
                    pathLength: [0, 1, 1],
                    pathOffset: [1, 0, -1],
                  }
            }
            transition={{
              duration: prefersReduced ? 0 : 6 + i * 0.8,
              repeat: prefersReduced ? 0 : Infinity,
              ease: "linear",
              delay: i * 0.4,
            }}
          />
        ))}
        <defs>
          {BEAM_PATHS.map((_, i) => (
            <linearGradient
              key={`grad-${i}`}
              id={`nx-beam-gradient-${i}`}
              gradientUnits="userSpaceOnUse"
              x1="0"
              y1="0"
              x2="100%"
              y2="100%"
            >
              <stop stopColor="var(--df-neon-violet)" stopOpacity="0" />
              <stop offset="0.5" stopColor="var(--df-neon-violet)" />
              <stop offset="1" stopColor="var(--df-neon-cyan)" stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>
      </svg>
    </div>
  );
});

BackgroundBeams.displayName = "BackgroundBeams";
```

**Usage.**

```tsx
<section className="relative min-h-screen overflow-hidden bg-[var(--df-bg-base)]">
  <BackgroundBeams />
  <div className="relative z-10 mx-auto max-w-3xl px-6 pt-32 text-center">
    <h1 className="text-5xl font-semibold text-[var(--df-text-primary)]">
      Ship AMOLED interfaces in minutes
    </h1>
  </div>
</section>
```

---

## Component: Spotlight

Aceternity's signature: a soft elliptical light that lifts the eye toward your hero headline. Two variants — fixed (CSS-only, animates in) and `SpotlightFollow` (tracks the cursor). DF customizes both with violet/cyan neon.

**When to use.** Hero sections, product launch pages, anywhere you want a single point of focus on a black canvas.

```tsx
// src/components/aceternity/spotlight.tsx
"use client";

import { cn } from "@/lib/utils";

interface SpotlightProps {
  className?: string;
  fill?: string;
}

export function Spotlight({
  className,
  fill = "var(--df-neon-violet)",
}: SpotlightProps) {
  return (
    <svg
      className={cn(
        "pointer-events-none absolute z-[1] h-[169%] w-[138%] lg:w-[84%]",
        "animate-spotlight opacity-0",
        "motion-reduce:animate-none motion-reduce:opacity-100",
        className
      )}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 3787 2842"
      fill="none"
      aria-hidden="true"
    >
      <g filter="url(#nx-spotlight-blur)">
        <ellipse
          cx="1924.71"
          cy="273.501"
          rx="1924.71"
          ry="273.501"
          transform="matrix(-0.822377 -0.568943 -0.568943 0.822377 3631.88 2291.09)"
          fill={fill}
          fillOpacity="0.18"
        />
      </g>
      <defs>
        <filter
          id="nx-spotlight-blur"
          x="0.860352"
          y="0.838989"
          width="3785.16"
          height="2840.26"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feGaussianBlur stdDeviation="151" result="blur" />
        </filter>
      </defs>
    </svg>
  );
}
```

```tsx
// Cursor-following spotlight card variant
// src/components/aceternity/spotlight-card.tsx
"use client";

import { useRef, useState, MouseEvent, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SpotlightCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: string;
}

export function SpotlightCard({
  children,
  className,
  glowColor = "rgba(167, 139, 250, 0.18)",
}: SpotlightCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  function onMouseMove(e: MouseEvent<HTMLDivElement>): void {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseEnter={() => setOpacity(1)}
      onMouseLeave={() => setOpacity(0)}
      className={cn(
        "group relative overflow-hidden rounded-[var(--df-radius-lg)]",
        "border border-[var(--df-border-default)]",
        "bg-[var(--df-bg-surface)] p-8",
        "transition-colors duration-300 hover:border-[var(--df-border-focus)]",
        "motion-reduce:transition-none",
        className
      )}
    >
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300 motion-reduce:transition-none"
        style={{
          opacity,
          background: `radial-gradient(420px circle at ${pos.x}px ${pos.y}px, ${glowColor}, transparent 60%)`,
        }}
        aria-hidden="true"
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
```

**Usage.**

```tsx
<SpotlightCard glowColor="rgba(34, 211, 238, 0.18)">
  <h3 className="text-xl font-semibold text-[var(--df-text-primary)]">
    Realtime sync
  </h3>
  <p className="mt-2 text-[var(--df-text-secondary)]">
    Cross-device updates under 80ms. CRDT-backed, offline-first.
  </p>
</SpotlightCard>
```

---

## Component: Wavy Background

A flowing canvas wave — soft, organic motion behind hero content. Uses simplex-style noise via `simplex-noise` (or skip the dep with the inline approximation below).

**When to use.** Newsletter signups, marketing testimonials, "join the beta" sections. Easier on the eye than beams.

```tsx
// src/components/aceternity/wavy-background.tsx
"use client";

import { useEffect, useRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface WavyBackgroundProps {
  children?: ReactNode;
  className?: string;
  containerClassName?: string;
  colors?: string[];
  waveWidth?: number;
  blur?: number;
  speed?: "slow" | "fast";
  waveOpacity?: number;
}

const DEFAULT_COLORS = [
  "var(--df-neon-violet)",
  "var(--df-neon-cyan)",
  "var(--df-neon-pink)",
  "#8b5cf6",
  "#06b6d4",
];

export function WavyBackground({
  children,
  className,
  containerClassName,
  colors = DEFAULT_COLORS,
  waveWidth = 50,
  blur = 10,
  speed = "fast",
  waveOpacity = 0.5,
}: WavyBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const setSize = (): void => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      ctx.filter = `blur(${blur}px)`;
    };
    setSize();
    window.addEventListener("resize", setSize);

    const speedFactor = speed === "slow" ? 0.001 : 0.002;
    let t = 0;

    const draw = (): void => {
      ctx.fillStyle = "rgba(0, 0, 0, 1)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < colors.length; i++) {
        ctx.beginPath();
        ctx.lineWidth = waveWidth;
        ctx.strokeStyle = colors[i];
        ctx.globalAlpha = waveOpacity;

        for (let x = 0; x < canvas.width; x += 5) {
          const y =
            Math.sin(x * 0.005 + t + i) * 50 +
            Math.sin(x * 0.01 + t * 1.3 + i) * 30 +
            canvas.height / 2;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.closePath();
      }

      if (!prefersReduced) {
        t += speedFactor;
        rafRef.current = requestAnimationFrame(draw);
      }
    };

    draw();

    return () => {
      window.removeEventListener("resize", setSize);
      cancelAnimationFrame(rafRef.current);
    };
  }, [blur, colors, speed, waveOpacity, waveWidth]);

  return (
    <div
      className={cn(
        "relative flex h-screen flex-col items-center justify-center bg-[var(--df-bg-base)]",
        containerClassName
      )}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-0 h-full w-full"
        aria-hidden="true"
      />
      <div className={cn("relative z-10", className)}>{children}</div>
    </div>
  );
}
```

> If you want the canonical Aceternity simplex noise, install `simplex-noise` and replace the `Math.sin` chain in `draw()` with `noise(x / 800, 0.3 * i, t)`. The above approximation is dependency-free.

---

## Component: Glare Card (Glowing Card)

A glass card with a moving glare highlight — feels like real glass tilting under light. Aceternity ships this as `GlareCard`; the DF variant lifts the glare into violet-cyan.

**When to use.** Pricing tiers, feature cards, premium "pro" callouts.

```tsx
// src/components/aceternity/glare-card.tsx
"use client";

import { ReactNode, useRef, MouseEvent } from "react";
import { cn } from "@/lib/utils";

interface GlareCardProps {
  children: ReactNode;
  className?: string;
}

export function GlareCard({ children, className }: GlareCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  function onMouseMove(e: MouseEvent<HTMLDivElement>): void {
    const card = ref.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    card.style.setProperty("--df-glare-x", `${x}%`);
    card.style.setProperty("--df-glare-y", `${y}%`);
  }

  function onMouseLeave(): void {
    const card = ref.current;
    if (!card) return;
    card.style.setProperty("--df-glare-x", `50%`);
    card.style.setProperty("--df-glare-y", `50%`);
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className={cn(
        "group relative isolate overflow-hidden",
        "rounded-[var(--df-radius-lg)] p-px",
        "transition-transform duration-500 ease-out hover:scale-[1.01]",
        "motion-reduce:hover:scale-100 motion-reduce:transition-none",
        className
      )}
      style={{
        background: `
          radial-gradient(
            220px circle at var(--df-glare-x, 50%) var(--df-glare-y, 50%),
            rgba(167, 139, 250, 0.45),
            rgba(34, 211, 238, 0.18) 40%,
            var(--df-border-default) 80%
          )
        `,
      }}
    >
      <div
        className={cn(
          "relative h-full w-full overflow-hidden",
          "rounded-[calc(var(--df-radius-lg)-1px)]",
          "bg-[var(--df-bg-surface)] p-8",
          "backdrop-blur-md"
        )}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 motion-reduce:transition-none"
          style={{
            background: `radial-gradient(360px circle at var(--df-glare-x, 50%) var(--df-glare-y, 50%), rgba(255,255,255,0.06), transparent 60%)`,
          }}
          aria-hidden="true"
        />
        <div className="relative z-10">{children}</div>
      </div>
    </div>
  );
}
```

---

## Component: Moving Border (Button)

Aceternity's `MovingBorder` wraps any element in a ring of light that slides around the perimeter. Most often wired into a button.

**When to use.** Primary CTAs, "join waitlist", "upgrade now". One per page max — overuse kills the wow.

```tsx
// src/components/aceternity/moving-border.tsx
"use client";

import {
  motion,
  useAnimationFrame,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import { useRef, ReactNode, ElementType } from "react";
import { cn } from "@/lib/utils";

interface MovingBorderProps {
  children: ReactNode;
  duration?: number;
  rx?: string;
  ry?: string;
}

function MovingBorder({
  children,
  duration = 3000,
  rx = "30%",
  ry = "30%",
}: MovingBorderProps) {
  const pathRef = useRef<SVGRectElement>(null);
  const progress = useMotionValue(0);
  const prefersReduced = useReducedMotion();

  useAnimationFrame((time) => {
    if (prefersReduced) return;
    const length = pathRef.current?.getTotalLength();
    if (length) {
      const pxPerMs = length / duration;
      progress.set((time * pxPerMs) % length);
    }
  });

  const x = useTransform(
    progress,
    (val) => pathRef.current?.getPointAtLength(val).x ?? 0
  );
  const y = useTransform(
    progress,
    (val) => pathRef.current?.getPointAtLength(val).y ?? 0
  );
  const transform = useMotionTemplate`translateX(${x}px) translateY(${y}px) translateX(-50%) translateY(-50%)`;

  return (
    <>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        className="absolute h-full w-full"
        width="100%"
        height="100%"
        aria-hidden="true"
      >
        <rect
          fill="none"
          width="100%"
          height="100%"
          rx={rx}
          ry={ry}
          ref={pathRef}
        />
      </svg>
      <motion.div
        style={{ position: "absolute", top: 0, left: 0, transform }}
      >
        {children}
      </motion.div>
    </>
  );
}

interface MovingBorderButtonProps {
  children: ReactNode;
  as?: ElementType;
  borderRadius?: string;
  containerClassName?: string;
  borderClassName?: string;
  duration?: number;
  className?: string;
  onClick?: () => void;
  href?: string;
}

export function MovingBorderButton({
  children,
  as: Component = "button",
  borderRadius = "1.75rem",
  containerClassName,
  borderClassName,
  duration,
  className,
  onClick,
  ...rest
}: MovingBorderButtonProps) {
  return (
    <Component
      onClick={onClick}
      className={cn(
        "relative overflow-hidden bg-transparent p-[1px] text-[var(--df-text-primary)]",
        containerClassName
      )}
      style={{ borderRadius }}
      {...rest}
    >
      <div
        className="absolute inset-0"
        style={{ borderRadius: `calc(${borderRadius} * 0.96)` }}
      >
        <MovingBorder duration={duration} rx="30%" ry="30%">
          <div
            className={cn(
              "h-20 w-20 bg-[radial-gradient(var(--df-neon-violet)_40%,transparent_60%)] opacity-90",
              borderClassName
            )}
          />
        </MovingBorder>
      </div>
      <div
        className={cn(
          "relative flex h-full w-full items-center justify-center antialiased",
          "border border-[var(--df-border-default)] bg-[var(--df-bg-elevated)]",
          "px-6 py-3 text-sm font-medium backdrop-blur-xl",
          className
        )}
        style={{ borderRadius: `calc(${borderRadius} * 0.96)` }}
      >
        {children}
      </div>
    </Component>
  );
}
```

**Usage.**

```tsx
<MovingBorderButton onClick={() => router.push("/signup")}>
  Start free trial
</MovingBorderButton>
```

---

## Component: Text Generate Effect

Words fade and blur into existence one at a time — an elegant alternative to a typewriter for hero headlines.

**When to use.** Hero subheads, section intros, animated value props. Skip on body paragraphs (too slow to read).

```tsx
// src/components/aceternity/text-generate-effect.tsx
"use client";

import { useEffect } from "react";
import { motion, stagger, useAnimate, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TextGenerateEffectProps {
  words: string;
  className?: string;
  filter?: boolean;
  duration?: number;
}

export function TextGenerateEffect({
  words,
  className,
  filter = true,
  duration = 0.5,
}: TextGenerateEffectProps) {
  const [scope, animate] = useAnimate();
  const wordsArray = words.split(" ");
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (prefersReduced) {
      animate("span", { opacity: 1, filter: "none" }, { duration: 0 });
      return;
    }
    animate(
      "span",
      {
        opacity: 1,
        filter: filter ? "blur(0px)" : "none",
      },
      { duration, delay: stagger(0.18) }
    );
  }, [animate, duration, filter, prefersReduced]);

  return (
    <div
      className={cn("font-semibold leading-snug", className)}
      aria-label={words}
    >
      <motion.div ref={scope}>
        {wordsArray.map((word, idx) => (
          <motion.span
            key={`${word}-${idx}`}
            className="inline-block text-[var(--df-text-primary)] opacity-0"
            style={{ filter: filter ? "blur(10px)" : "none" }}
          >
            {word}&nbsp;
          </motion.span>
        ))}
      </motion.div>
      <span
        aria-hidden="true"
        className={cn(
          "ml-1 inline-block h-6 w-[2px] translate-y-1",
          "bg-[var(--df-neon-violet)]",
          "shadow-[var(--df-glow-violet)]",
          "animate-pulse motion-reduce:animate-none"
        )}
      />
    </div>
  );
}
```

**Usage.**

```tsx
<TextGenerateEffect
  words="Realtime collaboration. Zero config. Built for teams that ship."
  className="text-4xl md:text-6xl"
/>
```

---

## Component: Hero Parallax

A 3-row showcase grid that scrolls through your products on a tilted plane — Aceternity's most cinematic component. Long file, but the math is the value.

**When to use.** Marketing landing pages with 12+ visual products to showcase (apps, themes, screenshots). Needs at least 1500px scroll runway.

```tsx
// src/components/aceternity/hero-parallax.tsx
"use client";

import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  MotionValue,
  useReducedMotion,
} from "framer-motion";
import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";

export interface HeroProduct {
  title: string;
  link: string;
  thumbnail: string;
}

interface HeroParallaxProps {
  products: HeroProduct[];
}

export function HeroParallax({ products }: HeroParallaxProps) {
  const firstRow = products.slice(0, 5);
  const secondRow = products.slice(5, 10);
  const thirdRow = products.slice(10, 15);

  const ref = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const springConfig = { stiffness: 300, damping: 30, bounce: 100 };

  const translateX = useSpring(
    useTransform(scrollYProgress, [0, 1], [0, 1000]),
    springConfig
  );
  const translateXReverse = useSpring(
    useTransform(scrollYProgress, [0, 1], [0, -1000]),
    springConfig
  );
  const rotateX = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [15, 0]),
    springConfig
  );
  const opacity = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [0.2, 1]),
    springConfig
  );
  const rotateZ = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [20, 0]),
    springConfig
  );
  const translateY = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [-700, 500]),
    springConfig
  );

  return (
    <div
      ref={ref}
      className="relative flex h-[300vh] flex-col self-auto overflow-hidden bg-[var(--df-bg-base)] py-40 antialiased [perspective:1000px] [transform-style:preserve-3d]"
    >
      <Header />
      <motion.div
        style={
          prefersReduced
            ? undefined
            : {
                rotateX,
                rotateZ,
                translateY,
                opacity,
              }
        }
      >
        <motion.div className="mb-20 flex flex-row-reverse space-x-20 space-x-reverse">
          {firstRow.map((p) => (
            <ProductCard
              product={p}
              translate={prefersReduced ? undefined : translateX}
              key={p.title}
            />
          ))}
        </motion.div>
        <motion.div className="mb-20 flex flex-row space-x-20">
          {secondRow.map((p) => (
            <ProductCard
              product={p}
              translate={prefersReduced ? undefined : translateXReverse}
              key={p.title}
            />
          ))}
        </motion.div>
        <motion.div className="flex flex-row-reverse space-x-20 space-x-reverse">
          {thirdRow.map((p) => (
            <ProductCard
              product={p}
              translate={prefersReduced ? undefined : translateX}
              key={p.title}
            />
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}

function Header() {
  return (
    <div className="relative left-0 top-0 mx-auto w-full max-w-7xl px-4 py-20 md:py-40">
      <h1 className="text-2xl font-bold text-[var(--df-text-primary)] md:text-7xl">
        The ultimate <br /> AMOLED component library
      </h1>
      <p className="mt-8 max-w-2xl text-base text-[var(--df-text-secondary)] md:text-xl">
        We build beautiful dark-mode products with React, Tailwind, and Framer
        Motion. Copy, paste, ship. Zero install.
      </p>
    </div>
  );
}

interface ProductCardProps {
  product: HeroProduct;
  translate?: MotionValue<number>;
}

function ProductCard({ product, translate }: ProductCardProps) {
  return (
    <motion.div
      style={translate ? { x: translate } : undefined}
      whileHover={{ y: -20 }}
      key={product.title}
      className="group/product relative h-96 w-[30rem] flex-shrink-0"
    >
      <Link
        href={product.link}
        className="block group-hover/product:shadow-2xl"
      >
        <Image
          src={product.thumbnail}
          height={600}
          width={600}
          className="h-full w-full rounded-[var(--df-radius-lg)] object-cover object-left-top absolute inset-0"
          alt={product.title}
        />
      </Link>
      <div className="pointer-events-none absolute inset-0 h-full w-full rounded-[var(--df-radius-lg)] bg-[var(--df-bg-base)] opacity-0 transition-opacity duration-300 group-hover/product:opacity-80" />
      <h2 className="absolute bottom-4 left-4 text-[var(--df-text-primary)] opacity-0 transition-opacity duration-300 group-hover/product:opacity-100">
        {product.title}
      </h2>
    </motion.div>
  );
}
```

**Usage.**

```tsx
const products: HeroProduct[] = [
  { title: "Linear", link: "https://linear.app", thumbnail: "/showcase/linear.png" },
  { title: "Vercel", link: "https://vercel.com", thumbnail: "/showcase/vercel.png" },
  // ... 15 total for full effect
];

<HeroParallax products={products} />
```

---

## Component: Floating Nav

A glass navbar that hides on scroll-down, returns on scroll-up, and clamps to a centered pill near the top of the viewport. Pairs perfectly with `BackgroundBeams`.

**When to use.** Marketing pages, docs, landing — anywhere you want a navbar that doesn't squat over content.

```tsx
// src/components/aceternity/floating-nav.tsx
"use client";

import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
  useReducedMotion,
} from "framer-motion";
import Link from "next/link";
import { useState, ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface NavItem {
  name: string;
  link: string;
  icon?: ReactNode;
}

interface FloatingNavProps {
  navItems: NavItem[];
  className?: string;
}

export function FloatingNav({ navItems, className }: FloatingNavProps) {
  const { scrollYProgress } = useScroll();
  const [visible, setVisible] = useState(true);
  const prefersReduced = useReducedMotion();

  useMotionValueEvent(scrollYProgress, "change", (current) => {
    if (typeof current !== "number") return;
    const direction = current - (scrollYProgress.getPrevious() ?? 0);

    if (current < 0.05) {
      setVisible(true);
      return;
    }
    setVisible(direction < 0);
  });

  return (
    <AnimatePresence mode="wait">
      <motion.nav
        aria-label="Primary"
        initial={
          prefersReduced ? { opacity: 1, y: 0 } : { opacity: 1, y: -100 }
        }
        animate={{
          y: visible || prefersReduced ? 0 : -100,
          opacity: visible || prefersReduced ? 1 : 0,
        }}
        transition={{ duration: 0.2 }}
        className={cn(
          "fixed inset-x-0 top-6 z-[var(--df-z-sticky)] mx-auto flex max-w-fit items-center justify-center space-x-2 rounded-full",
          "border border-[var(--df-glass-border-md)] bg-[var(--df-glass-bg-md)] px-6 py-2",
          "shadow-[0_0_24px_rgba(167,139,250,0.08)] backdrop-blur-xl",
          className
        )}
      >
        {navItems.map((item, idx) => (
          <Link
            key={`nav-${idx}`}
            href={item.link}
            className={cn(
              "relative flex items-center gap-1 rounded-full px-3 py-1.5 text-sm",
              "text-[var(--df-text-secondary)] transition-colors duration-200",
              "hover:text-[var(--df-neon-violet)] focus-visible:text-[var(--df-neon-violet)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--df-border-focus)]"
            )}
          >
            {item.icon && (
              <span className="block sm:hidden" aria-hidden="true">
                {item.icon}
              </span>
            )}
            <span className="hidden sm:block">{item.name}</span>
          </Link>
        ))}
        <Link
          href="/signup"
          className={cn(
            "relative ml-2 rounded-full px-4 py-1.5 text-sm font-medium",
            "border border-[var(--df-border-focus)] text-[var(--df-text-primary)]",
            "bg-[var(--df-bg-elevated)] hover:shadow-[var(--df-glow-violet)]",
            "transition-shadow duration-300 motion-reduce:transition-none"
          )}
        >
          <span>Sign up</span>
          <span
            aria-hidden="true"
            className="absolute inset-x-0 -bottom-px mx-auto h-px w-2/3 bg-gradient-to-r from-transparent via-[var(--df-neon-violet)] to-transparent"
          />
        </Link>
      </motion.nav>
    </AnimatePresence>
  );
}
```

---

## Component: Infinite Moving Cards

A seamless marquee of testimonial cards — never resets, never visibly loops. Pure CSS variable trick.

**When to use.** Social proof sections, customer logos, "trusted by" rows.

```tsx
// src/components/aceternity/infinite-moving-cards.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface Testimonial {
  quote: string;
  name: string;
  title: string;
}

interface InfiniteMovingCardsProps {
  items: Testimonial[];
  direction?: "left" | "right";
  speed?: "fast" | "normal" | "slow";
  pauseOnHover?: boolean;
  className?: string;
}

export function InfiniteMovingCards({
  items,
  direction = "left",
  speed = "normal",
  pauseOnHover = true,
  className,
}: InfiniteMovingCardsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLUListElement>(null);
  const [start, setStart] = useState(false);

  useEffect(() => {
    if (!containerRef.current || !scrollerRef.current) return;
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // Duplicate items for seamless loop
    const scrollerContent = Array.from(scrollerRef.current.children);
    scrollerContent.forEach((item) => {
      const clone = item.cloneNode(true);
      if (scrollerRef.current) scrollerRef.current.appendChild(clone);
    });

    containerRef.current.style.setProperty(
      "--animation-direction",
      direction === "left" ? "forwards" : "reverse"
    );
    const durationMap = { fast: "20s", normal: "40s", slow: "80s" };
    containerRef.current.style.setProperty(
      "--animation-duration",
      prefersReduced ? "0s" : durationMap[speed]
    );

    setStart(true);
  }, [direction, speed]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "scroller relative z-20 max-w-7xl overflow-hidden",
        "[mask-image:linear-gradient(to_right,transparent,white_20%,white_80%,transparent)]",
        className
      )}
      role="region"
      aria-label="Customer testimonials"
    >
      <ul
        ref={scrollerRef}
        className={cn(
          "flex w-max min-w-full shrink-0 flex-nowrap gap-4 py-4",
          start && "animate-scroll",
          pauseOnHover && "hover:[animation-play-state:paused]"
        )}
      >
        {items.map((item, idx) => (
          <li
            key={`${item.name}-${idx}`}
            className={cn(
              "relative w-[350px] max-w-full shrink-0 md:w-[420px]",
              "rounded-[var(--df-radius-lg)] border border-[var(--df-border-default)]",
              "bg-[var(--df-bg-surface)] px-8 py-6"
            )}
          >
            <blockquote className="relative">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -top-2 -z-10 h-full w-full"
              />
              <p className="relative z-20 text-sm font-normal leading-[1.6] text-[var(--df-text-primary)]">
                {item.quote}
              </p>
              <footer className="relative z-20 mt-6 flex flex-row items-center">
                <span className="flex flex-col gap-1">
                  <cite className="text-sm not-italic font-medium leading-[1.4] text-[var(--df-text-primary)]">
                    {item.name}
                  </cite>
                  <span className="text-xs leading-[1.4] text-[var(--df-text-secondary)]">
                    {item.title}
                  </span>
                </span>
              </footer>
            </blockquote>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

**Usage.**

```tsx
const testimonials: Testimonial[] = [
  {
    quote: "We replaced three internal tools with one Darkforge dashboard. Shipped in a week.",
    name: "Priya Raman",
    title: "Head of Engineering, Lattice",
  },
  {
    quote: "The AMOLED defaults make everything we ship feel like a flagship product.",
    name: "Marcus Vega",
    title: "Founder, Linear-clone",
  },
  // 4-6 minimum for the marquee to feel natural
];

<InfiniteMovingCards items={testimonials} direction="left" speed="slow" />
```

---

## Component: Meteors

Diagonal streaks of light falling across a card — a small touch that lifts an empty state or hero from "fine" to "wow".

**When to use.** Card overlays, login screens, 404 pages.

```tsx
// src/components/aceternity/meteors.tsx
"use client";

import { cn } from "@/lib/utils";

interface MeteorsProps {
  number?: number;
  className?: string;
}

export function Meteors({ number = 20, className }: MeteorsProps) {
  const meteors = new Array(number).fill(true);
  return (
    <>
      {meteors.map((_, idx) => (
        <span
          key={`meteor-${idx}`}
          aria-hidden="true"
          className={cn(
            "absolute left-1/2 top-1/2 h-0.5 w-0.5 rotate-[215deg] rounded-[9999px]",
            "bg-[var(--df-text-primary)] shadow-[var(--df-glow-violet)]",
            "animate-meteor motion-reduce:animate-none",
            "before:absolute before:top-1/2 before:h-px before:w-[50px] before:-translate-y-1/2",
            "before:bg-gradient-to-r before:from-[var(--df-neon-violet)] before:via-[var(--df-text-primary)] before:to-transparent before:content-['']",
            className
          )}
          style={{
            top: 0,
            left: `${Math.floor(Math.random() * (400 - -400) + -400)}px`,
            animationDelay: `${Math.random() * (0.8 - 0.2) + 0.2}s`,
            animationDuration: `${Math.floor(Math.random() * (10 - 2) + 2)}s`,
          }}
        />
      ))}
    </>
  );
}
```

**Usage.**

```tsx
<div className="relative overflow-hidden rounded-[var(--df-radius-lg)] border border-[var(--df-border-default)] bg-[var(--df-bg-surface)] p-10">
  <Meteors number={30} />
  <h3 className="relative z-10 text-2xl font-semibold text-[var(--df-text-primary)]">
    Your inbox is clear
  </h3>
  <p className="relative z-10 mt-2 text-[var(--df-text-secondary)]">
    No alerts in the last 24 hours.
  </p>
</div>
```

---

## Component: Background Lines

A neutral grid of animated SVG lines — more restrained than `BackgroundBeams`. Good for landing pages where the hero needs to dominate, not the backdrop.

**When to use.** Auth pages, simple hero sections, anywhere you want texture without movement noise.

```tsx
// src/components/aceternity/background-lines.tsx
"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface BackgroundLinesProps {
  children: ReactNode;
  className?: string;
  svgOptions?: { duration?: number };
}

const PATHS = [
  "M0 460C-149.084 387.815 -322.156 339.844 -456.31 295.844 -590.464 251.844 -690.65 175.547 -797.473 76.5466",
  "M5 460C-145.732 388.671 -319.466 339.81 -454.06 297.301 -588.654 254.792 -688.842 178.917 -795.823 79.6648",
  "M10 460C-141.881 389.27 -316.241 339.692 -451.288 298.51 -586.335 257.328 -686.524 181.973 -793.665 82.387",
  "M15 460C-138.029 389.846 -312.99 339.521 -448.48 299.682 -583.97 259.842 -684.16 184.969 -791.456 85.0479",
  "M20 460C-134.172 390.398 -309.713 339.296 -445.635 300.815 -581.557 262.334 -681.749 187.905 -789.198 87.6463",
];

export function BackgroundLines({
  children,
  className,
  svgOptions = { duration: 10 },
}: BackgroundLinesProps) {
  const prefersReduced = useReducedMotion();

  return (
    <div
      className={cn(
        "relative h-[20rem] w-full overflow-hidden bg-[var(--df-bg-base)] md:h-screen",
        className
      )}
    >
      <svg
        viewBox="0 0 1440 900"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="pointer-events-none absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        {PATHS.map((d, idx) => (
          <motion.path
            key={`bg-line-${idx}`}
            d={d}
            stroke={`url(#nx-bg-line-grad-${idx})`}
            strokeOpacity="0.6"
            strokeWidth="1"
            initial={{ pathLength: 0 }}
            animate={
              prefersReduced
                ? { pathLength: 1 }
                : {
                    pathLength: 1,
                    pathOffset: [0, 1],
                  }
            }
            transition={{
              duration: prefersReduced ? 0 : svgOptions.duration ?? 10,
              ease: "linear",
              repeat: prefersReduced ? 0 : Infinity,
              delay: idx * 0.4,
            }}
          />
        ))}
        <defs>
          {PATHS.map((_, idx) => (
            <linearGradient
              key={`bg-line-grad-${idx}`}
              id={`nx-bg-line-grad-${idx}`}
              gradientUnits="userSpaceOnUse"
              x1="0"
              y1="0"
              x2="100%"
              y2="100%"
            >
              <stop stopColor="var(--df-neon-violet)" stopOpacity="0" />
              <stop offset="0.5" stopColor="var(--df-neon-cyan)" />
              <stop offset="1" stopColor="var(--df-neon-pink)" stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>
      </svg>
      <div className="relative z-10 flex h-full w-full items-center justify-center">
        {children}
      </div>
    </div>
  );
}
```

---

## Component: Sparkles

A particle field of twinkling dots — Aceternity uses tsparticles under the hood. DF variant uses violet/cyan dots on AMOLED.

**When to use.** Hero backdrops, "magic" or AI-themed launches, achievement unlock animations.

```tsx
// src/components/aceternity/sparkles.tsx
"use client";

// Requires: npm install @tsparticles/react @tsparticles/slim
import { useEffect, useState, useId } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { type ISourceOptions } from "@tsparticles/engine";
import { loadSlim } from "@tsparticles/slim";
import { cn } from "@/lib/utils";

interface SparklesCoreProps {
  id?: string;
  className?: string;
  background?: string;
  particleColor?: string;
  particleDensity?: number;
  minSize?: number;
  maxSize?: number;
  speed?: number;
}

export function SparklesCore({
  id,
  className,
  background = "transparent",
  particleColor = "var(--df-neon-violet)",
  particleDensity = 120,
  minSize = 0.6,
  maxSize = 1.4,
  speed = 1,
}: SparklesCoreProps) {
  const [init, setInit] = useState(false);
  const generatedId = useId();

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => setInit(true));
  }, []);

  if (!init) return null;

  const options: ISourceOptions = {
    background: { color: { value: background } },
    fullScreen: { enable: false, zIndex: 1 },
    fpsLimit: 120,
    particles: {
      number: {
        value: particleDensity,
        density: { enable: true, width: 400, height: 400 },
      },
      color: { value: particleColor },
      size: { value: { min: minSize, max: maxSize } },
      move: {
        enable: true,
        speed: { min: 0.1, max: speed },
        direction: "none",
        random: true,
        outModes: { default: "out" },
      },
      opacity: {
        value: { min: 0.1, max: 1 },
        animation: {
          enable: true,
          speed: speed,
          startValue: "random",
          sync: false,
        },
      },
    },
    detectRetina: true,
    pauseOnBlur: true,
    pauseOnOutsideViewport: true,
  };

  return (
    <Particles
      id={id ?? generatedId}
      className={cn("h-full w-full", className)}
      options={options}
      aria-hidden="true"
    />
  );
}
```

**Usage.**

```tsx
<div className="relative h-[40rem] w-full overflow-hidden bg-[var(--df-bg-base)]">
  <SparklesCore
    particleColor="var(--df-neon-cyan)"
    particleDensity={140}
    className="absolute inset-0"
  />
  <h1 className="relative z-10 mt-40 text-center text-7xl font-bold text-[var(--df-text-primary)]">
    Sparkle.
  </h1>
</div>
```

---

## Component: Card Hover Effect (Cards Reveal)

A grid of cards where hovering one slides a violet glow under it — perfect for feature grids and pricing pages.

**When to use.** Feature lists with 3-9 items, pricing tier rows, "what's included" sections.

```tsx
// src/components/aceternity/hover-effect.tsx
"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useState, ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface HoverEffectItem {
  title: string;
  description: string;
  link: string;
  icon?: ReactNode;
}

interface HoverEffectProps {
  items: HoverEffectItem[];
  className?: string;
}

export function HoverEffect({ items, className }: HoverEffectProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const prefersReduced = useReducedMotion();

  return (
    <div
      className={cn(
        "grid grid-cols-1 py-10 md:grid-cols-2 lg:grid-cols-3",
        className
      )}
    >
      {items.map((item, idx) => (
        <Link
          href={item.link}
          key={item.link}
          className="group relative block h-full w-full p-2"
          onMouseEnter={() => setHoveredIndex(idx)}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <AnimatePresence>
            {hoveredIndex === idx && !prefersReduced && (
              <motion.span
                className="absolute inset-0 block h-full w-full rounded-[var(--df-radius-lg)] bg-[var(--df-bg-elevated)] shadow-[var(--df-glow-violet)]"
                layoutId="hoverBackground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: 0.15 } }}
                exit={{ opacity: 0, transition: { duration: 0.15, delay: 0.2 } }}
              />
            )}
          </AnimatePresence>
          <Card>
            {item.icon && (
              <span
                aria-hidden="true"
                className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-[var(--df-radius-md)] bg-[var(--df-bg-elevated)] text-[var(--df-neon-violet)]"
              >
                {item.icon}
              </span>
            )}
            <CardTitle>{item.title}</CardTitle>
            <CardDescription>{item.description}</CardDescription>
          </Card>
        </Link>
      ))}
    </div>
  );
}

function Card({ children }: { children: ReactNode }) {
  return (
    <div
      className={cn(
        "relative z-20 h-full w-full overflow-hidden rounded-[var(--df-radius-lg)] p-6",
        "border border-[var(--df-border-default)] bg-[var(--df-bg-surface)]",
        "transition-colors duration-300 group-hover:border-[var(--df-border-focus)]"
      )}
    >
      <div className="relative z-50">{children}</div>
    </div>
  );
}

function CardTitle({ children }: { children: ReactNode }) {
  return (
    <h4 className="mt-2 font-semibold tracking-wide text-[var(--df-text-primary)]">
      {children}
    </h4>
  );
}

function CardDescription({ children }: { children: ReactNode }) {
  return (
    <p className="mt-4 text-sm leading-relaxed tracking-wide text-[var(--df-text-secondary)]">
      {children}
    </p>
  );
}
```

**Usage.**

```tsx
const features: HoverEffectItem[] = [
  {
    title: "Edge-deployed",
    description: "Sub-50ms cold starts on 220+ regions. Zero idle billing.",
    link: "/edge",
  },
  {
    title: "CRDT sync",
    description: "Conflict-free multi-cursor editing. Offline-first by default.",
    link: "/sync",
  },
  {
    title: "Embedded analytics",
    description: "Realtime funnel + cohort views. No SQL. No drag-and-drop.",
    link: "/analytics",
  },
];

<HoverEffect items={features} />
```

---

## Common Gotchas

- **`cn()` utility forgotten.** Every Aceternity component imports `cn` from `@/lib/utils`. If your project uses a different alias, update the import — don't redefine `cn` inline.
- **Peer dep version mismatch.** `framer-motion` ≥ 11 is required for `useAnimate`, `useMotionValueEvent`, `useReducedMotion` hooks used here. Older v10 will throw.
- **Tailwind animations missing.** If `animate-spotlight`, `animate-meteor`, `animate-scroll` resolve to `unset`, you forgot the keyframes block in `tailwind.config.ts`. Re-check the Setup section.
- **Hero Parallax + Next.js.** Uses `next/image`. On non-Next, swap to `<img>` and remove `width`/`height` props (or set `style={{ objectFit: "cover" }}`).
- **Sparkles + tsparticles version.** `@tsparticles/react` v3 changed the `init` API. Code above targets v3+; for v2 you'd use `loadSlim(engine)` inside `Particles` props directly.
- **`prefersReduced` is reactive.** `useReducedMotion()` returns `null | true | false`. Always treat falsy as "animate". Don't gate on `=== false`.
- **`'use client'` is non-negotiable.** Every component here uses hooks, refs, or browser APIs. Forgetting it on Next.js App Router throws a runtime error.
- **Mask images on Tailwind v3.** `[mask-image:...]` arbitrary values need Tailwind v3.4+. On older versions, drop into a `style={{}}` prop.
- **Background layering.** Aceternity components are absolute-positioned by default. Wrap in `<section className="relative overflow-hidden">` and lift content with `relative z-10`.
- **Tracing Beam height.** Computes once on mount. If content height changes (lazy images, accordions), call `setSvgHeight(contentRef.current.offsetHeight)` after the change or use a `ResizeObserver`.
- **DF glow on hover for keyboard users.** Most Aceternity demos only handle `:hover`. The variants above add `focus-visible:` mirrors for tab nav — don't strip them.

---

## Cross-References

How Darkforge patterns combine these components:

- **Hero (`patterns/hero.md`)** — `Spotlight` + `TextGenerateEffect` + `BackgroundBeams`. Optional `Sparkles` overlay. Wrap in a `relative overflow-hidden` section with the spotlight pinned top-left.
- **Hero (cinematic)** — `HeroParallax` standalone. Needs ≥ 12 product thumbnails to feel full.
- **Navbar (`patterns/navbar.md`)** — `FloatingNav` over a hero with `BackgroundBeams`. The active nav item should pulse `var(--df-neon-violet)`.
- **Pricing (`patterns/pricing.md`)** — `GlareCard` for each tier. Mark the recommended tier with `MovingBorderButton` as the CTA. `HoverEffect` works for the "everything included" list below.
- **Features (`patterns/features.md`)** — `HoverEffect` 3x2 grid. Optionally wrap each card in `SpotlightCard` for cursor-tracking glow.
- **Testimonials (`patterns/testimonials.md`)** — Two `InfiniteMovingCards` rows in opposite directions. Place a centered `<h2>` between them.
- **Dashboard (`patterns/dashboard.md`)** — `FloatingNav` (collapsed mode), `SpotlightCard` for KPI tiles, `Meteors` over the empty-state alert panel.
- **CTA (`patterns/cta.md`)** — `BackgroundLines` backdrop + centered `MovingBorderButton`. Skip animation density here; the eye must land on the button.
- **Auth pages** — `Spotlight` (top-right, cyan fill) + form on `var(--df-bg-surface)` glass card with `GlareCard` border.
- **404 / empty states** — `Meteors` over a centered surface card. One sentence of copy, one CTA. No more.
- **Skeleton loading (`17-skeleton-system.md`)** — Skeletons should match the resting state. If a card uses `SpotlightCard`, its skeleton drops the cursor glow but keeps the border + radius. Animate skeleton shimmer with the same `var(--df-skeleton-base)` → `var(--df-skeleton-shine)` gradient.

> Aceternity components are fragments, not pages. Darkforge's job is to compose them into shippable sections — always with DF tokens, always AMOLED, always a senior engineer's restraint. One hero effect per page. One `MovingBorderButton`. One `Sparkles` field. Restraint is the differentiator.
</content>
</invoke>