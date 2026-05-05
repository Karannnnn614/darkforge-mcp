# Darkforge — Hero Section Patterns
6 complete dark hero variants. Every one is full-width, responsive, includes headline + subtext + CTA + badge.
Pick the variant that matches the user's stack and vibe.

## Contents

- [Hero 1 — Glassmorphism Split (No 3D lib needed — pure CSS + Framer)](#hero-1-glassmorphism-split-no-3d-lib-needed-pure-css-framer)
- [Hero 2 — Minimal AMOLED (Typography-led, pure CSS animations)](#hero-2-minimal-amoled-typography-led-pure-css-animations)
- [Hero 3 — Neon Gradient Mesh (Framer Motion entrance)](#hero-3-neon-gradient-mesh-framer-motion-entrance)
- [Variant 4 — Video Background + Animated Text](#variant-4-video-background-animated-text)
- [Variant 5 — R3F Floating Product](#variant-5-r3f-floating-product)
- [Variant 6 — Three.js Particle Field](#variant-6-threejs-particle-field)

---

## Hero 1 — Glassmorphism Split (No 3D lib needed — pure CSS + Framer)

```tsx
// Requires: framer-motion, tailwindcss
'use client'
import { motion } from 'framer-motion'

export function HeroGlass() {
  return (
    <section style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      background: 'var(--df-bg-base)', position: 'relative', overflow: 'hidden',
      padding: '80px 24px',
    }}>
      {/* Neon orbs */}
      <div style={{
        position: 'absolute', top: '10%', right: '15%',
        width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(167,139,250,0.15) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '10%', left: '5%',
        width: 300, height: 300, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(34,211,238,0.1) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        maxWidth: 1200, margin: '0 auto', width: '100%',
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center',
      }}>
        {/* Left — Text */}
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)',
              borderRadius: 'var(--df-radius-full)', padding: '4px 14px',
              marginBottom: 24,
            }}
          >
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: 'var(--df-neon-violet)',
              boxShadow: 'var(--df-glow-violet)',
            }} />
            <span style={{ color: 'var(--df-neon-violet)', fontSize: 12, fontWeight: 500 }}>
              Now in public beta
            </span>
          </motion.div>

          <h1 style={{
            fontSize: 'clamp(36px, 5vw, 60px)', fontWeight: 600,
            color: 'var(--df-text-primary)', lineHeight: 1.15,
            margin: '0 0 20px', letterSpacing: '-0.02em',
          }}>
            Build faster with{' '}
            <span style={{
              background: 'linear-gradient(135deg, var(--df-neon-violet), var(--df-neon-cyan))',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              AI-native tools
            </span>
          </h1>

          <p style={{
            color: 'var(--df-text-secondary)', fontSize: 18, lineHeight: 1.65,
            margin: '0 0 36px', maxWidth: 480,
          }}>
            The complete platform for teams that move fast. Automate workflows,
            ship features, and scale without the overhead.
          </p>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(167,139,250,0.4)' }}
              whileTap={{ scale: 0.98 }}
              style={{
                background: 'var(--df-neon-violet)', color: '#000',
                border: 'none', borderRadius: 'var(--df-radius-md)',
                padding: '12px 24px', fontSize: 15, fontWeight: 600, cursor: 'pointer',
                boxShadow: 'var(--df-glow-violet)',
              }}
            >
              Get started free
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02, borderColor: 'var(--df-border-strong)' }}
              whileTap={{ scale: 0.98 }}
              style={{
                background: 'var(--df-glass-bg)', color: 'var(--df-text-primary)',
                border: '1px solid var(--df-border-default)',
                backdropFilter: 'blur(12px)',
                borderRadius: 'var(--df-radius-md)',
                padding: '12px 24px', fontSize: 15, fontWeight: 500, cursor: 'pointer',
              }}
            >
              View demo →
            </motion.button>
          </div>
        </motion.div>

        {/* Right — Glass Card UI preview */}
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          style={{
            background: 'var(--df-glass-bg)',
            border: '1px solid var(--df-glass-border)',
            backdropFilter: 'blur(20px)',
            borderRadius: 'var(--df-radius-xl)',
            padding: 24,
            boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)',
          }}
        >
          {/* Fake UI inside glass card */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
            {['#f87171','#fbbf24','#4ade80'].map((c, i) => (
              <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
            ))}
          </div>
          {[100, 80, 90, 65, 75].map((w, i) => (
            <div key={i} style={{
              height: i === 0 ? 16 : 12,
              background: i === 0 ? 'var(--df-border-default)' : 'var(--df-border-subtle)',
              borderRadius: 4, marginBottom: 10, width: `${w}%`,
            }} />
          ))}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 20,
          }}>
            {['var(--df-neon-violet)', 'var(--df-neon-cyan)'].map((c, i) => (
              <div key={i} style={{
                height: 80, borderRadius: 'var(--df-radius-md)',
                background: `linear-gradient(135deg, ${c}22, transparent)`,
                border: `1px solid ${c}33`,
              }} />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
```

---

## Hero 2 — Minimal AMOLED (Typography-led, pure CSS animations)

```tsx
// Requires: tailwindcss only. No animation library.
export function HeroMinimal() {
  return (
    <section style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', textAlign: 'center',
      background: 'var(--df-bg-base)', padding: '80px 24px',
      position: 'relative',
    }}>
      {/* Subtle grid */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.03,
        backgroundImage: `
          linear-gradient(var(--df-border-default) 1px, transparent 1px),
          linear-gradient(90deg, var(--df-border-default) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', maxWidth: 720 }}>
        <p style={{
          color: 'var(--df-neon-violet)', fontSize: 13, fontWeight: 500,
          letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 24,
        }}>
          Introducing Darkforge v1
        </p>

        <h1 style={{
          fontSize: 'clamp(40px, 7vw, 80px)', fontWeight: 700,
          lineHeight: 1.1, letterSpacing: '-0.03em',
          color: 'var(--df-text-primary)', margin: '0 0 24px',
        }}>
          Dark UI.<br />
          <span style={{
            background: 'linear-gradient(90deg, var(--df-neon-violet), var(--df-neon-pink))',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Done right.
          </span>
        </h1>

        <p style={{
          color: 'var(--df-text-secondary)', fontSize: 20, lineHeight: 1.6, marginBottom: 40,
        }}>
          Generate stunning AMOLED dark interfaces in seconds.
          Every library. Every framework. Zero compromise.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button style={{
            background: 'var(--df-text-primary)', color: 'var(--df-text-inverse)',
            border: 'none', borderRadius: 'var(--df-radius-md)',
            padding: '14px 28px', fontSize: 15, fontWeight: 600, cursor: 'pointer',
          }}>
            Install plugin →
          </button>
          <button style={{
            background: 'transparent', color: 'var(--df-text-secondary)',
            border: '1px solid var(--df-border-default)',
            borderRadius: 'var(--df-radius-md)',
            padding: '14px 28px', fontSize: 15, cursor: 'pointer',
          }}>
            View docs
          </button>
        </div>

        {/* Social proof */}
        <p style={{ color: 'var(--df-text-muted)', fontSize: 13, marginTop: 40 }}>
          Trusted by <strong style={{ color: 'var(--df-text-secondary)' }}>2,400+</strong> developers
        </p>
      </div>
    </section>
  )
}
```

---

## Hero 3 — Neon Gradient Mesh (Framer Motion entrance)

```tsx
'use client'
import { motion } from 'framer-motion'

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } }
}
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
}

export function HeroNeonMesh() {
  return (
    <section style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--df-bg-base)', position: 'relative', overflow: 'hidden',
      padding: '80px 24px', textAlign: 'center',
    }}>
      {/* Mesh gradient orbs */}
      {[
        { top: '-5%', left: '20%', color: 'rgba(167,139,250,0.2)', size: 600 },
        { top: '60%', right: '-5%', color: 'rgba(34,211,238,0.12)', size: 500 },
        { bottom: '-10%', left: '-5%', color: 'rgba(244,114,182,0.1)', size: 400 },
      ].map((orb, i) => (
        <div key={i} style={{
          position: 'absolute',
          width: orb.size, height: orb.size, borderRadius: '50%',
          background: `radial-gradient(circle, ${orb.color} 0%, transparent 70%)`,
          ...Object.fromEntries(
            Object.entries(orb).filter(([k]) => ['top','left','right','bottom'].includes(k))
          ),
          pointerEvents: 'none', zIndex: 0,
        }} />
      ))}

      <motion.div
        variants={container} initial="hidden" animate="show"
        style={{ position: 'relative', zIndex: 1, maxWidth: 680 }}
      >
        <motion.div variants={item} style={{ marginBottom: 20 }}>
          <span style={{
            background: 'linear-gradient(90deg, rgba(167,139,250,0.15), rgba(34,211,238,0.15))',
            border: '1px solid rgba(167,139,250,0.25)',
            borderRadius: 'var(--df-radius-full)', padding: '5px 16px',
            color: 'var(--df-neon-violet)', fontSize: 12, fontWeight: 500,
          }}>
            ✦ Claude Code Plugin · v1.0
          </span>
        </motion.div>

        <motion.h1 variants={item} style={{
          fontSize: 'clamp(36px, 6vw, 68px)', fontWeight: 700,
          lineHeight: 1.1, letterSpacing: '-0.025em',
          color: 'var(--df-text-primary)', margin: '0 0 20px',
        }}>
          The dark UI arsenal for{' '}
          <span style={{
            background: 'linear-gradient(135deg, var(--df-neon-violet) 0%, var(--df-neon-cyan) 50%, var(--df-neon-pink) 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
            Claude Code
          </span>
        </motion.h1>

        <motion.p variants={item} style={{
          color: 'var(--df-text-secondary)', fontSize: 18, lineHeight: 1.65, margin: '0 0 36px',
        }}>
          One plugin. Every UI library. AMOLED dark, neon-glow, glassmorphism UI
          generated automatically in your stack.
        </motion.p>

        <motion.div variants={item} style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <motion.button
            whileHover={{ scale: 1.03, boxShadow: '0 0 40px rgba(167,139,250,0.5)' }}
            whileTap={{ scale: 0.97 }}
            style={{
              background: 'linear-gradient(135deg, var(--df-neon-violet), var(--df-neon-cyan))',
              color: '#000', border: 'none', borderRadius: 'var(--df-radius-md)',
              padding: '13px 28px', fontSize: 15, fontWeight: 700, cursor: 'pointer',
            }}
          >
            /plugin install darkforge
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            style={{
              background: 'var(--df-glass-bg)', backdropFilter: 'blur(12px)',
              border: '1px solid var(--df-glass-border)',
              color: 'var(--df-text-primary)', borderRadius: 'var(--df-radius-md)',
              padding: '13px 28px', fontSize: 15, fontWeight: 500, cursor: 'pointer',
            }}
          >
            Star on GitHub ★
          </motion.button>
        </motion.div>
      </motion.div>
    </section>
  )
}
```

---

## Variant 4 — Video Background + Animated Text

**When to use:** Brand-led marketing pages, fintech, creative agencies. Video carries 80% of the mood; copy is sparse and confident. Demands a real master video file (looped, color-graded, ~6–10 MB H.264 or smaller H.265/AV1) — do not ship without one.

**Performance notes:**
- `<video preload="metadata" muted autoPlay playsInline loop>` is the only safe combo for autoplay across mobile browsers.
- Always pair with `poster=` so the first paint is instant even before the video network round-trip.
- Reduced-motion users get the poster as a static `<img>` — never autoplay video for them.
- Keep the video < 10s. Longer loops cost bandwidth without adding value.
- Add a dark gradient overlay so text contrast holds against any video frame.

```tsx
'use client'
import { motion, useReducedMotion } from 'framer-motion'

const HEADLINE = ['Ship', 'beautiful', 'dark', 'interfaces', 'in', 'minutes.']

export function HeroVideoBg() {
  const reduced = useReducedMotion()

  return (
    <section style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden', background: 'var(--df-bg-base)' }}>
      {reduced ? (
        <img
          src="/hero-poster.jpg"
          alt=""
          aria-hidden="true"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <video
          src="/hero.mp4"
          poster="/hero-poster.jpg"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
      )}

      {/* Dark gradient overlay for contrast */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.55) 50%, var(--df-bg-base) 100%)',
        }}
      />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1200, margin: '0 auto', padding: '180px 24px 120px', textAlign: 'center' }}>
        <h1
          style={{
            fontSize: 'clamp(48px, 9vw, 104px)',
            fontWeight: 700, lineHeight: 1.02, letterSpacing: '-0.04em',
            color: 'var(--df-text-primary)', margin: '0 0 28px',
          }}
        >
          {HEADLINE.map((word, i) => (
            <motion.span
              key={i}
              initial={reduced ? false : { y: 28, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.08, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              style={{ display: 'inline-block', marginRight: '0.25em' }}
            >
              {word}
            </motion.span>
          ))}
        </h1>

        <motion.p
          initial={reduced ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: HEADLINE.length * 0.08 + 0.1, duration: 0.6 }}
          style={{
            fontSize: 'clamp(17px, 2vw, 21px)', color: 'var(--df-text-secondary)',
            maxWidth: 640, margin: '0 auto 40px', lineHeight: 1.6,
          }}
        >
          Darkforge generates AMOLED-dark, animated, production-ready React UI from a single prompt — composed from the libraries you already have installed.
        </motion.p>

        <motion.div
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: HEADLINE.length * 0.08 + 0.25, duration: 0.5 }}
          style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}
        >
          <a
            href="#start"
            style={{
              padding: '14px 30px', borderRadius: 'var(--df-radius-md)',
              background: 'var(--df-neon-violet)', color: '#000',
              fontWeight: 600, textDecoration: 'none',
              boxShadow: 'var(--df-glow-violet)',
            }}
          >
            Get started
          </a>
          <a
            href="#demo"
            style={{
              padding: '14px 30px', borderRadius: 'var(--df-radius-md)',
              background: 'var(--df-glass-bg)', backdropFilter: 'blur(12px)',
              border: '1px solid var(--df-glass-border)',
              color: 'var(--df-text-primary)', textDecoration: 'none',
            }}
          >
            Watch demo
          </a>
        </motion.div>
      </div>
    </section>
  )
}
```

---

## Variant 5 — R3F Floating Product

**When to use:** Hardware launches, premium SaaS, anything where a 3D hero asset already exists or is worth modeling. The asset itself carries the wow; copy is supportive.

**Performance notes:**
- Dynamic-import the Canvas with `ssr: false` — R3F + drei + your GLB easily add 400 KB+ to initial bundle. Lazy is non-negotiable.
- Wrap GLB load in `<Suspense>` with a skeleton fallback so the layout doesn't jump.
- `MeshTransmissionMaterial` is expensive — clamp `samples` and avoid on mobile (`window.innerWidth < 768` → fall back to `MeshStandardMaterial`).
- Reduced-motion users get a still render (no auto-rotate, no float).
- // VERIFY: `useGLTF` from `@react-three/drei` ≥ 9.x; older versions used `useLoader(GLTFLoader, …)`.

```tsx
'use client'
import dynamic from 'next/dynamic'
import { Suspense, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF, Float, Environment, MeshTransmissionMaterial, OrbitControls } from '@react-three/drei'
import { motion, useReducedMotion } from 'framer-motion'
import type { Mesh } from 'three'

const Canvas = dynamic(() => import('@react-three/fiber').then((m) => m.Canvas), { ssr: false })

function HeroModel() {
  const ref = useRef<Mesh>(null)
  // Lazy-load the GLB asset; place under /public/models/
  const { scene } = useGLTF('/models/hero.glb')

  useFrame((state) => {
    if (!ref.current) return
    ref.current.rotation.y = state.clock.elapsedTime * 0.15
  })

  return (
    <group ref={ref as never}>
      <primitive object={scene} scale={1.4} />
    </group>
  )
}

function FallbackKnot() {
  // Used when no GLB is provided yet — torus knot with violet transmission glass
  const ref = useRef<Mesh>(null)
  useFrame((s) => { if (ref.current) ref.current.rotation.y = s.clock.elapsedTime * 0.2 })
  return (
    <mesh ref={ref}>
      <torusKnotGeometry args={[1, 0.32, 220, 32]} />
      <MeshTransmissionMaterial
        samples={6}
        thickness={1.4}
        roughness={0.05}
        transmission={1}
        chromaticAberration={0.06}
        color="#a78bfa"
      />
    </mesh>
  )
}

export function HeroR3FFloating() {
  const reduced = useReducedMotion()

  return (
    <section style={{ position: 'relative', minHeight: '100vh', background: 'var(--df-bg-base)', overflow: 'hidden' }}>
      <div
        style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
          gap: 32, alignItems: 'center', maxWidth: 1280, margin: '0 auto', padding: '120px 24px',
        }}
      >
        {/* Copy column */}
        <motion.div
          initial={reduced ? false : { opacity: 0, x: -28 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <span
            style={{
              display: 'inline-block', padding: '6px 14px', marginBottom: 24,
              borderRadius: 999, fontSize: 12, fontWeight: 600, letterSpacing: '0.08em',
              background: 'var(--df-glass-bg)', backdropFilter: 'blur(12px)',
              border: '1px solid var(--df-glass-border)',
              color: 'var(--df-neon-violet)', textTransform: 'uppercase',
            }}
          >
            New · v1.0
          </span>
          <h1
            style={{
              fontSize: 'clamp(44px, 6vw, 76px)', fontWeight: 700, lineHeight: 1.05,
              letterSpacing: '-0.03em', color: 'var(--df-text-primary)', margin: '0 0 24px',
            }}
          >
            Hardware that <span style={{ color: 'var(--df-neon-violet)' }}>moves</span>.
          </h1>
          <p style={{ fontSize: 19, color: 'var(--df-text-secondary)', maxWidth: 480, lineHeight: 1.6, margin: '0 0 32px' }}>
            Real-time WebGL preview of every angle. Spin it, see it, ship it.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <a href="#buy" style={{ padding: '14px 28px', borderRadius: 'var(--df-radius-md)', background: 'var(--df-neon-violet)', color: '#000', fontWeight: 600, textDecoration: 'none', boxShadow: 'var(--df-glow-violet)' }}>
              Pre-order — $399
            </a>
            <a href="#specs" style={{ padding: '14px 28px', borderRadius: 'var(--df-radius-md)', background: 'transparent', border: '1px solid var(--df-glass-border)', color: 'var(--df-text-primary)', textDecoration: 'none' }}>
              Tech specs
            </a>
          </div>
        </motion.div>

        {/* Canvas column */}
        <div style={{ height: 'min(70vh, 620px)', position: 'relative' }}>
          <Canvas camera={{ position: [0, 0.4, 4.6], fov: 38 }} dpr={[1, 1.6]}>
            <ambientLight intensity={0.25} />
            <directionalLight position={[3, 4, 5]} intensity={1.4} color="#a78bfa" />
            <directionalLight position={[-3, -2, 4]} intensity={0.6} color="#4ea2ff" />
            <Suspense fallback={null}>
              <Float speed={reduced ? 0 : 1.4} rotationIntensity={reduced ? 0 : 0.4} floatIntensity={reduced ? 0 : 0.6}>
                <FallbackKnot />
                {/* Swap with <HeroModel /> once /public/models/hero.glb exists */}
              </Float>
              <Environment preset="city" />
            </Suspense>
            <OrbitControls enableZoom={false} enablePan={false} autoRotate={!reduced} autoRotateSpeed={0.4} />
          </Canvas>
        </div>
      </div>
    </section>
  )
}

// useGLTF.preload('/models/hero.glb') // call at module top-level once asset exists
```

---

## Variant 6 — Three.js Particle Field

**When to use:** AI/ML products, infrastructure tools, anything that wants a "compute is happening" mood. Fully procedural — no asset pipeline needed.

**Performance notes:**
- 3000 points is the sweet spot for desktop; reduce to 800 on mobile or low-core devices (`navigator.hardwareConcurrency < 4`).
- BufferGeometry with `Float32Array` positions is ~10x cheaper than instanced meshes for pure points.
- Additive blending + `depthWrite: false` for the glow look — but it costs fillrate; cap `dpr` at 1.5.
- Reduced-motion users get a static gradient div, no canvas at all.
- Hex literal `0xa78bfa` is allowed inside `THREE.Color` constructors — Three.js operates in WebGL color space, DF CSS vars don't apply inside the canvas.

```tsx
'use client'
import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

export function HeroParticleField() {
  const reduced = useReducedMotion()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [supported, setSupported] = useState(true)

  useEffect(() => {
    if (reduced) return
    let cancelled = false
    let cleanup: (() => void) | undefined

    ;(async () => {
      const THREE = await import('three')
      if (cancelled || !canvasRef.current) return

      const canvas = canvasRef.current
      const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
      renderer.setSize(canvas.clientWidth, canvas.clientHeight, false)

      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(60, canvas.clientWidth / canvas.clientHeight, 0.1, 100)
      camera.position.z = 14

      const lowEnd = (navigator.hardwareConcurrency ?? 8) < 4 || window.innerWidth < 768
      const COUNT = lowEnd ? 800 : 3000
      const positions = new Float32Array(COUNT * 3)
      const speeds = new Float32Array(COUNT)
      for (let i = 0; i < COUNT; i++) {
        positions[i * 3 + 0] = (Math.random() - 0.5) * 30
        positions[i * 3 + 1] = (Math.random() - 0.5) * 20
        positions[i * 3 + 2] = (Math.random() - 0.5) * 30
        speeds[i] = 0.005 + Math.random() * 0.02
      }

      const geom = new THREE.BufferGeometry()
      geom.setAttribute('position', new THREE.BufferAttribute(positions, 3))

      const mat = new THREE.PointsMaterial({
        color: 0xa78bfa,
        size: 0.06,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
      const points = new THREE.Points(geom, mat)
      scene.add(points)

      let raf = 0
      let t = 0
      const tick = () => {
        t += 0.005
        const arr = geom.attributes.position.array as Float32Array
        for (let i = 0; i < COUNT; i++) {
          arr[i * 3 + 2] += speeds[i]
          if (arr[i * 3 + 2] > 14) arr[i * 3 + 2] = -16
        }
        geom.attributes.position.needsUpdate = true
        camera.position.x = Math.sin(t * 0.5) * 0.6
        camera.lookAt(0, 0, 0)
        renderer.render(scene, camera)
        raf = requestAnimationFrame(tick)
      }
      tick()

      const onResize = () => {
        if (!canvas) return
        renderer.setSize(canvas.clientWidth, canvas.clientHeight, false)
        camera.aspect = canvas.clientWidth / canvas.clientHeight
        camera.updateProjectionMatrix()
      }
      window.addEventListener('resize', onResize)

      cleanup = () => {
        cancelAnimationFrame(raf)
        window.removeEventListener('resize', onResize)
        geom.dispose(); mat.dispose(); renderer.dispose()
      }
    })().catch(() => setSupported(false))

    return () => { cancelled = true; cleanup?.() }
  }, [reduced])

  return (
    <section style={{ position: 'relative', minHeight: '100vh', background: 'var(--df-bg-base)', overflow: 'hidden' }}>
      {reduced || !supported ? (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse at 50% 30%, rgba(167,139,250,0.18) 0%, transparent 60%), var(--df-bg-base)',
          }}
        />
      ) : (
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        />
      )}

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 880, margin: '0 auto', padding: '200px 24px 120px', textAlign: 'center' }}>
        <motion.div
          initial={reduced ? false : { opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          style={{
            display: 'inline-block', padding: '40px 48px',
            background: 'var(--df-glass-bg)', backdropFilter: 'blur(16px)',
            border: '1px solid var(--df-glass-border)',
            borderRadius: 'var(--df-radius-lg)',
          }}
        >
          <h1
            style={{
              fontSize: 'clamp(40px, 7vw, 72px)', fontWeight: 700, lineHeight: 1.05,
              letterSpacing: '-0.03em', color: 'var(--df-text-primary)', margin: '0 0 20px',
            }}
          >
            The fabric of <span style={{ color: 'var(--df-neon-violet)' }}>compute.</span>
          </h1>
          <p style={{ fontSize: 18, color: 'var(--df-text-secondary)', maxWidth: 560, margin: '0 auto 32px', lineHeight: 1.6 }}>
            Distributed inference at the edge. Sub-50ms latency anywhere on Earth.
          </p>
          <a
            href="#start"
            style={{
              display: 'inline-block', padding: '14px 32px', borderRadius: 'var(--df-radius-md)',
              background: 'var(--df-neon-violet)', color: '#000', fontWeight: 600,
              textDecoration: 'none', boxShadow: 'var(--df-glow-violet)',
            }}
          >
            Start free →
          </a>
        </motion.div>
      </div>
    </section>
  )
}
```

